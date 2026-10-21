import type { APIRoute, GetStaticPaths } from 'astro';
import { getCachedOgImage } from '../../../lib/og/cache';
import { renderPosterOgImage } from '../../../lib/og/home';
import { OG_PAGES } from '../../../lib/og/pages';

/** 固定ページごとの OGP 画像（/og/page/<path>.jpg）。ビルド時に生成する。 */
export const getStaticPaths = (() =>
	OG_PAGES.map((page) => ({ params: { slug: page.path }, props: { page } }))) satisfies GetStaticPaths;

export const GET: APIRoute = async ({ props }) => {
	const input = { title: props.page.title, summary: props.page.summary };
	const jpeg = await getCachedOgImage(`page/${props.page.path}`, input, () => renderPosterOgImage(input));
	return new Response(new Uint8Array(jpeg), { headers: { 'Content-Type': 'image/jpeg' } });
};
