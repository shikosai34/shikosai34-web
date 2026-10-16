import { createHash } from 'node:crypto';
import { lookup } from 'node:dns/promises';
import { mkdir, readFile, readdir, rm, writeFile } from 'node:fs/promises';
import { isIP } from 'node:net';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const contentDirectory = path.join(root, 'content', 'circles');
const outputDirectory = path.join(root, 'public', '_generated', 'circle-ogp');
const manifestPath = path.join(root, 'circle-ogp-manifest.generated.json');
const userAgent = 'OpenAI File Downloader, XaiImageApiFetch/1.0';
const maxHtmlBytes = 2 * 1024 * 1024;
const maxImageBytes = 2 * 1024 * 1024;
const timeoutMs = 5_000;
const dnsTimeoutMs = 2_500;

function parseScalar(value) {
	const scalar = value.trim();
	if (scalar.startsWith('"')) {
		try {
			return JSON.parse(scalar);
		} catch {
			return '';
		}
	}
	if (scalar.startsWith("'")) {
		return scalar.endsWith("'") ? scalar.slice(1, -1).replaceAll("''", "'") : '';
	}
	return scalar.replace(/\s+#.*$/, '').trim();
}

function getCircleLinks(markdown, filename) {
	const frontmatter = markdown.match(/^---\s*\r?\n([\s\S]*?)\r?\n---(?:\r?\n|$)/)?.[1];
	if (!frontmatter) return [];

	const links = [];
	let inLinks = false;
	let current;
	const finishLink = () => {
		if (current?.url && !current.previewImage) links.push({ url: current.url, filename });
		current = undefined;
	};

	for (const line of frontmatter.split(/\r?\n/)) {
		if (/^[A-Za-z][\w-]*\s*:/.test(line)) {
			finishLink();
			inLinks = /^snsLinks\s*:/.test(line);
			continue;
		}
		if (!inLinks) continue;

		const item = line.match(/^\s{2}-\s*(.*)$/);
		if (item) {
			finishLink();
			current = {};
			const firstField = item[1].match(/^(url|previewImage)\s*:\s*(.*)$/);
			if (firstField) current[firstField[1]] = parseScalar(firstField[2]);
			continue;
		}

		const field = line.match(/^\s{4}(url|previewImage)\s*:\s*(.*)$/);
		if (field && current) current[field[1]] = parseScalar(field[2]);
	}
	finishLink();
	return links;
}

function isPrivateAddress(address) {
	if (isIP(address) === 4) {
		const octets = address.split('.').map(Number);
		const [a, b, c] = octets;
		return (
			a === 0 ||
			a === 10 ||
			a === 127 ||
			(a === 100 && b >= 64 && b <= 127) ||
			(a === 169 && b === 254) ||
			(a === 172 && b >= 16 && b <= 31) ||
			(a === 192 && (b === 168 || (b === 0 && c === 0))) ||
			(a === 198 && (b === 18 || b === 19 || (b === 51 && c === 100))) ||
			(a === 203 && b === 0 && c === 113) ||
			a >= 224
		);
	}

	const normalized = address.toLowerCase().split('%')[0];
	if (normalized.startsWith('::ffff:')) {
		const mapped = normalized.slice('::ffff:'.length);
		return isIP(mapped) === 4 ? isPrivateAddress(mapped) : true;
	}
	return (
		normalized === '::' ||
		normalized === '::1' ||
		/^f[cd]/.test(normalized) ||
		/^fe[89ab]/.test(normalized)
	);
}

async function assertPublicHttpUrl(input) {
	const url = new URL(input);
	if (!['http:', 'https:'].includes(url.protocol) || url.username || url.password) {
		throw new Error('URL must be a public HTTP(S) URL without credentials');
	}

	const hostname = url.hostname.replace(/^\[|\]$/g, '').toLowerCase();
	if (hostname === 'localhost' || hostname.endsWith('.localhost') || hostname.endsWith('.local')) {
		throw new Error('Local hostnames are not fetched');
	}

	if (isIP(hostname)) {
		if (isPrivateAddress(hostname)) throw new Error('Private IP addresses are not fetched');
	} else {
		let dnsTimer;
		const addresses = await Promise.race([
			lookup(hostname, { all: true, verbatim: true }),
			new Promise((_, reject) => {
				dnsTimer = setTimeout(() => reject(new Error('DNS lookup timed out')), dnsTimeoutMs);
			}),
		]).finally(() => clearTimeout(dnsTimer));
		if (addresses.length === 0 || addresses.some(({ address }) => isPrivateAddress(address))) {
			throw new Error('Host does not resolve exclusively to public IP addresses');
		}
	}
	return url;
}

async function fetchPublic(input, accept) {
	let url = await assertPublicHttpUrl(input);
	for (let redirects = 0; redirects <= 3; redirects += 1) {
		const response = await fetch(url, {
			redirect: 'manual',
			headers: { accept, 'user-agent': userAgent },
			signal: AbortSignal.timeout(timeoutMs),
		});
		if (![301, 302, 303, 307, 308].includes(response.status)) return { response, url };
		const location = response.headers.get('location');
		await response.body?.cancel();
		if (!location || redirects === 3) throw new Error('Too many or invalid redirects');
		url = await assertPublicHttpUrl(new URL(location, url).href);
	}
	throw new Error('Too many redirects');
}

async function readLimited(response, maxBytes) {
	const declaredLength = Number(response.headers.get('content-length'));
	if (Number.isFinite(declaredLength) && declaredLength > maxBytes) {
		throw new Error(`Response exceeds ${maxBytes} bytes`);
	}
	if (!response.body) throw new Error('Response has no body');

	const reader = response.body.getReader();
	const chunks = [];
	let total = 0;
	while (true) {
		const { done, value } = await reader.read();
		if (done) break;
		total += value.byteLength;
		if (total > maxBytes) {
			await reader.cancel();
			throw new Error(`Response exceeds ${maxBytes} bytes`);
		}
		chunks.push(Buffer.from(value));
	}
	return Buffer.concat(chunks, total);
}

function getOgImages(html, pageUrl) {
	const values = [];
	for (const tag of html.matchAll(/<meta\b[^>]*>/gi)) {
		const attributes = new Map();
		for (const attr of tag[0].matchAll(/([^\s=/>]+)\s*=\s*(?:"([^"]*)"|'([^']*)'|([^\s>]+))/g)) {
			attributes.set(attr[1].toLowerCase(), attr[2] ?? attr[3] ?? attr[4] ?? '');
		}
		const property = (attributes.get('property') ?? attributes.get('name') ?? '').toLowerCase();
		const content = attributes.get('content')?.trim();
		if (content && ['og:image', 'og:image:url', 'og:image:secure_url', 'twitter:image', 'twitter:image:src'].includes(property)) {
			values.push({ property, content });
		}
	}

	const images = [];
	for (const property of ['og:image', 'og:image:url', 'og:image:secure_url', 'twitter:image', 'twitter:image:src']) {
		for (const { content } of values.filter((item) => item.property === property)) {
			try {
				const imageUrl = new URL(content, pageUrl);
				if (['http:', 'https:'].includes(imageUrl.protocol) && !images.includes(imageUrl.href)) images.push(imageUrl.href);
			} catch {
				// Ignore malformed metadata and continue to the next supported tag.
			}
		}
	}
	return images;
}

function detectImageType(bytes) {
	if (bytes.length >= 3 && bytes[0] === 0xff && bytes[1] === 0xd8 && bytes[2] === 0xff) return 'jpg';
	if (bytes.subarray(0, 8).equals(Buffer.from([137, 80, 78, 71, 13, 10, 26, 10]))) return 'png';
	if (bytes.toString('ascii', 0, 4) === 'RIFF' && bytes.toString('ascii', 8, 12) === 'WEBP') return 'webp';
	if (bytes.toString('ascii', 0, 6) === 'GIF87a' || bytes.toString('ascii', 0, 6) === 'GIF89a') return 'gif';
	if (bytes.toString('ascii', 4, 8) === 'ftyp' && /^(avif|avis)$/.test(bytes.toString('ascii', 8, 12))) return 'avif';
	return undefined;
}

async function readCircleFiles() {
	const entries = await readdir(contentDirectory, { withFileTypes: true });
	return entries
		.filter((entry) => entry.isFile() && entry.name.endsWith('.md') && !entry.name.startsWith('_'))
		.map((entry) => entry.name);
}

async function fetchOgpImage({ url, filename }) {
	try {
		const page = await fetchPublic(url, 'text/html,application/xhtml+xml');
		if (!page.response.ok || !/^(?:text\/html|application\/xhtml\+xml)(?:;|$)/i.test(page.response.headers.get('content-type') ?? '')) {
			throw new Error(`Page returned ${page.response.status} or was not HTML`);
		}
		const html = (await readLimited(page.response, maxHtmlBytes)).toString('utf8');
		const imageUrls = getOgImages(html, page.url.href);
		if (imageUrls.length === 0) throw new Error('No supported OGP image metadata');

		let imageBytes;
		let imageExtension;
		let lastImageError;
		for (const imageUrl of imageUrls.slice(0, 3)) {
			try {
				const image = await fetchPublic(imageUrl, 'image/avif,image/webp,image/png,image/jpeg,image/gif');
				if (!image.response.ok) throw new Error(`Image returned ${image.response.status}`);
				const bytes = await readLimited(image.response, maxImageBytes);
				const extension = detectImageType(bytes);
				if (!extension) throw new Error('OGP image was not a supported raster image');
				imageBytes = bytes;
				imageExtension = extension;
				break;
			} catch (error) {
				lastImageError = error;
			}
		}
		if (!imageBytes || !imageExtension) throw lastImageError ?? new Error('Unable to fetch an OGP image');

		const id = createHash('sha256').update(url).digest('hex').slice(0, 16);
		const relativePath = `/_generated/circle-ogp/${id}.${imageExtension}`;
		await writeFile(path.join(root, 'public', relativePath), imageBytes);
		return [url, relativePath];
	} catch (error) {
		const message = error instanceof Error ? error.message : String(error);
		console.warn(`[circle-ogp] ${filename}: ${message}`);
		return undefined;
	}
}

async function main() {
	const filenames = await readCircleFiles();
	const parsedFiles = await Promise.all(
		filenames.map(async (filename) => ({
			filename,
			markdown: await readFile(path.join(contentDirectory, filename), 'utf8'),
		})),
	);
	const candidates = parsedFiles.flatMap(({ filename, markdown }) => getCircleLinks(markdown, filename));
	const uniqueCandidates = [...new Map(candidates.map((candidate) => [candidate.url, candidate])).values()];

	await rm(outputDirectory, { recursive: true, force: true });
	await rm(manifestPath, { force: true });
	await mkdir(outputDirectory, { recursive: true });

	const manifest = {};
	let next = 0;
	const workers = Array.from({ length: Math.min(8, uniqueCandidates.length) }, async () => {
		while (next < uniqueCandidates.length) {
			const candidate = uniqueCandidates[next++];
			const result = await fetchOgpImage(candidate);
			if (result) manifest[result[0]] = result[1];
		}
	});
	await Promise.all(workers);
	await writeFile(manifestPath, `${JSON.stringify(manifest, null, 2)}\n`);
	console.info(`[circle-ogp] downloaded ${Object.keys(manifest).length}/${uniqueCandidates.length} OGP images`);
}

await main();
