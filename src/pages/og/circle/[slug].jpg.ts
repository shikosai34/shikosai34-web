import type { APIRoute, GetStaticPaths } from 'astro';
import { getCollectionOrEmpty } from '../../../lib/content';
import { getCachedOgImage } from '../../../lib/og/cache';
import { renderCircleOgImage } from '../../../lib/og/circle';

/** サークルごとの OGP 画像（/og/circle/<slug>.jpg）。ビルド時に R2 の画像とサークル情報から生成する。 */
export const getStaticPaths = (async () => {
	const circles = await getCollectionOrEmpty('circles');
	return circles.map((circle) => ({ params: { slug: circle.id }, props: { circle } }));
}) satisfies GetStaticPaths;

export const GET: APIRoute = async ({ props }) => {
	const { name, summary, location, scheduleDay1, scheduleDay2, image } = props.circle.data;
	const input = { name, summary, location, scheduleDay1, scheduleDay2, image };
	const jpeg = await getCachedOgImage(`circle/${props.circle.id}`, input, () => renderCircleOgImage(input));
	return new Response(new Uint8Array(jpeg), { headers: { 'Content-Type': 'image/jpeg' } });
};
