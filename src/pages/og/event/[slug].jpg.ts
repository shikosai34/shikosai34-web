import type { APIRoute, GetStaticPaths } from 'astro';
import { getCollectionOrEmpty } from '../../../lib/content';
import { getCachedOgImage } from '../../../lib/og/cache';
import { renderEventOgImage } from '../../../lib/og/event';

/** ステージ企画ごとの OGP 画像（/og/event/<slug>.jpg）。ビルド時に企画の情報から生成する。 */
export const getStaticPaths = (async () => {
	const events = await getCollectionOrEmpty('events', ({ data }) =>
		!data.committeeOnly && (import.meta.env.PROD ? !data.draft : true),
	);
	return events.map((event) => ({ params: { slug: event.id }, props: { event } }));
}) satisfies GetStaticPaths;

export const GET: APIRoute = async ({ props }) => {
	const jpeg = await getCachedOgImage(`event/${props.event.id}`, props.event.data, () => renderEventOgImage(props.event));
	return new Response(new Uint8Array(jpeg), { headers: { 'Content-Type': 'image/jpeg' } });
};
