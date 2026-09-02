import { getCollection, type CollectionEntry } from 'astro:content';

export type NewsEntry = CollectionEntry<'news'>;

/**
 * 公開対象のお知らせを、公開日の降順で返す。
 *
 * `draft` は本番ビルド（`import.meta.env.PROD`）でのみ除外する。
 * 開発サーバーでは下書きもプレビューできるよう残す。
 */
export async function getVisibleNews(): Promise<NewsEntry[]> {
	const entries = await getCollection('news', ({ data }) =>
		import.meta.env.PROD ? !data.draft : true,
	);

	return entries.sort(
		(a, b) => b.data.publishedAt.getTime() - a.data.publishedAt.getTime(),
	);
}
