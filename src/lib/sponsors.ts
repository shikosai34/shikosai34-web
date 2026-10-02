import type { CollectionEntry } from 'astro:content';
import { getCollectionOrEmpty } from './content';

export type SponsorEntry = CollectionEntry<'sponsors'>;

/** 協賛企業を五十音順で返す。本番ビルドでは下書きを除外する。 */
export async function getVisibleSponsors(): Promise<SponsorEntry[]> {
	const sponsors = await getCollectionOrEmpty('sponsors', ({ data }) =>
		import.meta.env.PROD ? !data.draft : true,
	);
	return sponsors.sort((a, b) => a.data.nameKana.localeCompare(b.data.nameKana, 'ja'));
}

/**
 * 協賛金額に応じた企業名の文字サイズ（Tailwind クラス）。
 *
 * 年によって協賛額の分布が変わるため、固定の円額ではなく
 * 最大協賛額に対する比率で 4 段階に分ける。
 */
export function getSponsorSizeClass(amount: number, maxAmount: number): string {
	const ratio = maxAmount > 0 ? amount / maxAmount : 0;
	if (ratio >= 0.5) return 'text-3xl font-medium';
	if (ratio >= 0.25) return 'text-2xl';
	if (ratio >= 0.15) return 'text-lg';
	return 'text-sm';
}
