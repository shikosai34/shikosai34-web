import type { APIRoute, GetStaticPaths } from 'astro';
import { getCollectionOrEmpty } from '../../../lib/content';
import { renderOgImage } from '../../../lib/og-image';

/**
 * サークル個別ページ用の OGP 画像。中央の円をポスターではなくそのサークルの画像にする。
 * 画像が未提出のサークルは、ほかのページと同じポスターの画像になる。
 */
export const getStaticPaths: GetStaticPaths = async () => {
	const circles = await getCollectionOrEmpty('circles');
	return circles.map((circle) => ({
		params: { slug: circle.id },
		props: { image: circle.data.image },
	}));
};

export const GET: APIRoute = async ({ props }) => {
	const png = await renderOgImage({ circleImageUrl: props.image as string | undefined });
	return new Response(new Uint8Array(png), {
		headers: { 'Content-Type': 'image/png' },
	});
};
