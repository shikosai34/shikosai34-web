import { loadMedia, MEDIA_HEIGHT, renderOgCard } from './card';

/**
 * サークル詳細ページ用の OGP 画像。
 * 紹介画像は CMS が書いた R2 の URL（https://assets.34.shikosai.net/...）をビルド時に取りに行く。
 * 取れなかったときは「画像準備中」の枠にして、ビルドは止めない。
 */

export interface CircleOgInput {
	name: string;
	summary: string;
	location: string;
	/** 10月24日（土）の実施時間。空なら「実施なし」。 */
	scheduleDay1?: string | undefined;
	/** 10月25日（日）の実施時間。空なら「実施なし」。 */
	scheduleDay2?: string | undefined;
	/** R2 の配信 URL、または public/ 配下のパス。 */
	image?: string | undefined;
}

export async function renderCircleOgImage(circle: CircleOgInput): Promise<Buffer> {
	return renderOgCard({
		label: 'サークル',
		title: circle.name,
		summary: circle.summary,
		location: circle.location,
		schedule: [
			{ label: '10/24', value: circle.scheduleDay1?.trim() || '実施なし' },
			{ label: '10/25', value: circle.scheduleDay2?.trim() || '実施なし' },
		],
		mediaWidth: MEDIA_HEIGHT,
		media: circle.image ? await loadMedia(circle.image, { width: MEDIA_HEIGHT, height: MEDIA_HEIGHT }) : undefined,
	});
}
