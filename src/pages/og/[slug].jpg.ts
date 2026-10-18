import type { APIRoute, GetStaticPaths } from 'astro';
import { ogPageNameSlugs, ogPageTitles } from '../../lib/og-pages';
import { renderOgImage } from '../../lib/og-image';

/**
 * 固定ページ用の OGP 画像（/og/{slug}.jpg）。共通の /ogp.jpg の右下の茨城高専ロゴを、そのページの名前に置き換える。
 * サークル（/og/circle/*.jpg）は事前に生成した PNG を public/ に置いているので、ここでは作らない。
 */
export const getStaticPaths: GetStaticPaths = () =>
	ogPageNameSlugs.map((slug) => ({
		params: { slug },
		props: { pageName: ogPageTitles[slug] },
	}));

export const GET: APIRoute = async ({ props }) => {
	const png = await renderOgImage({ pageName: props.pageName as string });
	return new Response(new Uint8Array(png), {
		headers: { 'Content-Type': 'image/jpeg' },
	});
};
