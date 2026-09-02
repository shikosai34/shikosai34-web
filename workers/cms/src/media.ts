import type { Env } from './env';

/**
 * 画像アップロード。編集者がスマホの写真をそのまま送っても、
 * 元画像は公開せず、リサイズ + WebP 変換して R2 に保存し公開 URL を返す（Issue #17）。
 */

const ALLOWED_TYPES = new Set([
	'image/jpeg',
	'image/png',
	'image/webp',
	'image/gif',
	'image/heic',
	'image/heif',
	'image/avif',
]);
const MAX_BYTES = 15 * 1024 * 1024;
const MAX_EDGE = 1920;
const WEBP_QUALITY = 82;

/** multipart フォームで届く File の必要な部分だけ。 */
interface UploadFile {
	type: string;
	size: number;
	stream(): ReadableStream;
}

export async function handleMediaUpload(request: Request, env: Env): Promise<Response> {
	if (request.method !== 'POST') return json({ error: 'method not allowed' }, 405);

	const form = await request.formData();
	const entry: unknown = form.get('file');
	if (entry === null || typeof entry === 'string' || typeof entry === 'undefined') {
		return json({ error: 'file フィールドが必要です' }, 400);
	}
	const file = entry as UploadFile;
	if (!ALLOWED_TYPES.has(file.type)) {
		return json({ error: `未対応の形式です: ${file.type || '不明'}` }, 415);
	}
	if (file.size > MAX_BYTES) return json({ error: '画像が大きすぎます（上限 15MB）' }, 413);

	let webp: ReadableStream;
	try {
		const result = await env.IMAGES.input(file.stream())
			// scale-down: 長辺 MAX_EDGE に収める。小さい画像は拡大しない。アスペクト比は維持。
			.transform({ width: MAX_EDGE, height: MAX_EDGE, fit: 'scale-down' })
			.output({ format: 'image/webp', quality: WEBP_QUALITY });
		webp = result.response().body as ReadableStream;
	} catch (err) {
		return json({ error: `画像の変換に失敗しました: ${(err as Error).message}` }, 422);
	}

	const key = `news/${crypto.randomUUID()}.webp`;
	await env.MEDIA_BUCKET.put(key, webp, {
		httpMetadata: {
			contentType: 'image/webp',
			cacheControl: 'public, max-age=31536000, immutable',
		},
	});

	return json({ url: `${env.ASSETS_BASE_URL.replace(/\/$/, '')}/${key}` });
}

function json(data: unknown, status = 200): Response {
	return new Response(JSON.stringify(data), {
		status,
		headers: { 'Content-Type': 'application/json' },
	});
}
