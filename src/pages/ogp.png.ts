import type { APIRoute } from 'astro';
import { renderOgImage } from '../lib/og-image';

/**
 * 共通の OGP 画像（/ogp.png）。トップ・404・お知らせ/イベントの個別記事など、
 * 専用の画像を持たないページが使う。
 * 静的ファイルにせずビルド時に生成して、ほかのページの画像とデザインがずれないようにする。
 */
export const GET: APIRoute = async () => {
	const png = await renderOgImage();
	return new Response(new Uint8Array(png), {
		headers: { 'Content-Type': 'image/png' },
	});
};
