import { createHash, randomUUID } from 'node:crypto';
import fs from 'node:fs/promises';
import path from 'node:path';

/**
 * 永続化する OGP 画像キャッシュ。
 * 入力データと描画コード・素材の指紋が一致するときだけ、前回の JPEG を使う。
 */

// Cloudflare が Astro のビルドキャッシュ対象にする node_modules/.astro を使う。
const CACHE_DIR = path.resolve('node_modules/.astro/og-image-cache');
const CACHE_FORMAT_VERSION = 1;

// 描画結果に影響するコード、画像、フォントの定義。
// 新しい依存素材を OGP 描画処理に加えた場合は、ここにも登録する。
const RENDERER_INPUT_FILES = [
	'src/lib/og/card.tsx',
	'src/lib/og/circle.tsx',
	'src/lib/og/event.tsx',
	'src/lib/og/home.tsx',
	'src/lib/og/fonts.ts',
	'src/lib/og/pages.ts',
	'src/lib/events.ts',
	'src/lib/og-image.ts',
	'src/pages/og/home.jpg.ts',
	'src/pages/og/circle/[slug].jpg.ts',
	'src/pages/og/event/[slug].jpg.ts',
	'src/pages/og/page/[...slug].jpg.ts',
	'src/pages/ogp.jpg.ts',
	'src/lib/kasumi.ts',
	'src/assets/fonts/KiwiMaru-Regular.ttf',
	'src/assets/logo/yokogaki/HOL_W-trimmed.png',
	'src/assets/logo/kosen/footer.svg',
	'src/assets/poster/sokuhou/01-poster.png',
	'node_modules/@fontsource/kiwi-maru/400.css',
	'node_modules/@fontsource/kiwi-maru/500.css',
	'bun.lock',
];

let rendererFingerprint: Promise<string> | undefined;

function fingerprintRenderer(): Promise<string> {
	rendererFingerprint ??= (async () => {
		const hash = createHash('sha256');
		for (const file of RENDERER_INPUT_FILES) {
			hash.update(file);
			hash.update('\0');
			hash.update(await fs.readFile(path.resolve(file)));
		}
		return hash.digest('hex');
	})();
	return rendererFingerprint;
}

function sha256(value: string): string {
	return createHash('sha256').update(value).digest('hex');
}

/** 生成物の入力が前回のビルドと同じなら、描画せず保存済み JPEG を返す。 */
export async function getCachedOgImage<T>(
	imageId: string,
	input: T,
	render: () => Promise<Buffer>,
): Promise<Buffer> {
	const slot = sha256(imageId);
	const imagePath = path.join(CACHE_DIR, `${slot}.jpg`);
	const metadataPath = path.join(CACHE_DIR, `${slot}.json`);
	const signature = sha256(
		JSON.stringify({ version: CACHE_FORMAT_VERSION, renderer: await fingerprintRenderer(), input }),
	);

	try {
		const [metadata, jpeg] = await Promise.all([
			fs.readFile(metadataPath, 'utf8').then((contents) => JSON.parse(contents) as { signature?: string }),
			fs.readFile(imagePath),
		]);
		if (metadata.signature === signature) {
			console.info(`[og] cache hit: ${imageId}`);
			return jpeg;
		}
	} catch {
		// 初回ビルド、または不完全なキャッシュは通常どおり描画する。
	}

	console.info(`[og] cache miss: ${imageId}`);
	const jpeg = await render();
	await fs.mkdir(CACHE_DIR, { recursive: true });
	const suffix = randomUUID();
	const imageTempPath = `${imagePath}.${suffix}.tmp`;
	const metadataTempPath = `${metadataPath}.${suffix}.tmp`;
	try {
		await fs.writeFile(imageTempPath, jpeg);
		await fs.rename(imageTempPath, imagePath);
		await fs.writeFile(metadataTempPath, JSON.stringify({ signature }));
		await fs.rename(metadataTempPath, metadataPath);
	} finally {
		await Promise.all([
			fs.rm(imageTempPath, { force: true }),
			fs.rm(metadataTempPath, { force: true }),
		]);
	}
	return jpeg;
}
