import type { APIRoute, GetStaticPaths } from 'astro';
import { getCollectionOrEmpty } from '../../../lib/content';
import { renderEventOgImage } from '../../../lib/og/event';
import { hasEventOgImage } from '../../../lib/og/event-path';

/** ステージ企画ごとの OGP 画像（/og/event/<slug>.jpg）。ビルド時に企画の情報から生成する。 */
export const getStaticPaths = (async () => {
	const events = await getCollectionOrEmpty('events', ({ data }) =>
		!data.committeeOnly && (import.meta.env.PROD ? !data.draft : true) && hasEventOgImage(data.startAt),
	);
	return events.map((event) => ({ params: { slug: event.id }, props: { event } }));
}) satisfies GetStaticPaths;

export const GET: APIRoute = async ({ props }) => {
	const jpeg = await renderEventOgImage(props.event);
	return new Response(new Uint8Array(jpeg), { headers: { 'Content-Type': 'image/jpeg' } });
};
