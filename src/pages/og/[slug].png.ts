import type { APIRoute, GetStaticPaths } from 'astro';
import { ogPageTitles } from '../../lib/og-pages';
import { renderOgImage } from '../../lib/og-image';

export const getStaticPaths: GetStaticPaths = () =>
	Object.entries(ogPageTitles).map(([slug, title]) => ({
		params: { slug },
		props: { title },
	}));

export const GET: APIRoute = async ({ props }) => {
	const png = await renderOgImage(props.title as string);
	return new Response(new Uint8Array(png), {
		headers: { 'Content-Type': 'image/png' },
	});
};
