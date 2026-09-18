import { getCollection, type CollectionEntry, type CollectionKey } from 'astro:content';

/**
 * `content/<collection>/` 配下の Markdown 一覧（ビルド時に解決）。
 *
 * パターンは src/content.config.ts の各ローダー（`**\/[^_]*.md`）と合わせる。
 * 中身は読まず、ファイルの有無を知るためだけに使う。
 */
const contentFiles = import.meta.glob('/content/*/**/[^_]*.md', { query: '?raw' });

/** コレクションに Markdown が 1 件以上あるか。 */
export function hasContent(collection: CollectionKey): boolean {
	const prefix = `/content/${collection}/`;
	return Object.keys(contentFiles).some((path) => path.startsWith(prefix));
}

/**
 * 空のコレクションでも警告を出さない `getCollection()`。
 *
 * サークル・ステージ企画は CMS から投入されるまで `content/<name>/` が空で、
 * その状態で `getCollection()` を呼ぶと Astro がビルドのたびに
 * 「The collection "..." does not exist or is empty」を警告する。
 * ファイルが無いときは `getCollection()` を呼ばずに空配列を返す。
 */
export async function getCollectionOrEmpty<C extends CollectionKey>(
	collection: C,
	filter?: (entry: CollectionEntry<C>) => boolean,
): Promise<CollectionEntry<C>[]> {
	if (!hasContent(collection)) return [];
	return getCollection(collection, filter);
}
