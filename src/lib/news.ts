/**
 * お知らせ（news）関連の定数と整形処理。
 *
 * このファイルは `astro:content` に依存しないため、React コンポーネントからも
 * 安全に読み込める。Content Collections を参照する処理は `news-collection.ts` にある。
 */

export const NEWS_CATEGORIES = ['news', 'event', 'press', 'update'] as const;

export type NewsCategory = (typeof NEWS_CATEGORIES)[number];

/** カテゴリの表示名。原稿・UI ともにこのラベルを用いる。 */
export const NEWS_CATEGORY_LABELS: Record<NewsCategory, string> = {
	news: 'お知らせ',
	event: 'イベント',
	press: 'メディア掲載',
	update: '更新情報',
};

const dateFormatter = new Intl.DateTimeFormat('ja-JP', {
	timeZone: 'Asia/Tokyo',
	year: 'numeric',
	month: '2-digit',
	day: '2-digit',
});

/** Date を Asia/Tokyo の `YYYY/MM/DD` 表記へ整形する。 */
export function formatNewsDate(date: Date): string {
	return dateFormatter.format(date);
}
