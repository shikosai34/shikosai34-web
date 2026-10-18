import { EVENT_VENUE_LABELS, formatEventDate, formatEventTimeRange, type EventEntry } from '../events';
import { renderPosterOgImage } from './home';

/**
 * ステージ企画ページ（/event/<slug>）用の OGP 画像。トップと同じポスターのカードに、企画の題名・出演団体・会場・日時を載せる。
 */

export async function renderEventOgImage({ data }: EventEntry): Promise<Buffer> {
	// 出演団体が題名と同じ（猿頭 / 猿頭）なら重ねて出さない。
	const summary = [`第34回 茨香祭 ${data.eventName}`, ...(data.performer !== data.title ? [`出演: ${data.performer}`] : [])];
	return renderPosterOgImage({
		title: data.title,
		summary,
		location: EVENT_VENUE_LABELS[data.venue],
		schedule: [{ label: formatEventDate(data.startAt), value: formatEventTimeRange(data.startAt, data.endAt) }],
	});
}
