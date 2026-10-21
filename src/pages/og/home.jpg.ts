import type { APIRoute } from 'astro';
import { renderHomeOgImage } from '../../lib/og/home';

/** トップページの OGP 画像（/og/home.jpg）。ビルド時に生成する。 */
export const GET: APIRoute = async () => {
	const jpeg = await renderHomeOgImage();
	return new Response(new Uint8Array(jpeg), { headers: { 'Content-Type': 'image/jpeg' } });
};
