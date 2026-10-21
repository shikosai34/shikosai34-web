import type { CollectionEntry } from 'astro:content';
import { getCollectionOrEmpty } from './content';

export type GoodsEntry = CollectionEntry<'goods'>;

/** グッズを表示順（同順位は名前順）で返す。本番ビルドでは下書きを除外する。 */
export async function getVisibleGoods(): Promise<GoodsEntry[]> {
	const goods = await getCollectionOrEmpty('goods', ({ data }) =>
		import.meta.env.PROD ? !data.draft : true,
	);
	return goods.sort(
		(a, b) => a.data.order - b.data.order || a.data.name.localeCompare(b.data.name, 'ja'),
	);
}

export function formatPrice(price: number): string {
	return `${price.toLocaleString('ja-JP')}円`;
}
