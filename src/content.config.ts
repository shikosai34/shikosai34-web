import { defineCollection, z } from 'astro:content';
import { glob } from 'astro/loaders';
import { CIRCLE_CATEGORIES } from './lib/circles';

/**
 * サークル情報（`/circle`）。
 *
 * Google フォームで集めた原稿を確認のうえ手作業で JSON 化する
 * （docs/design/03-design.md §2.9.3）。記事本文を持たないため JSON。
 * リポジトリ直下の `content/circles/` で管理する。
 */
const circles = defineCollection({
	loader: glob({ pattern: '**/[^_]*.json', base: './content/circles' }),
	schema: z.object({
		/** 団体名 */
		name: z.string().min(1),
		/** 団体名（かな）。並び順に使用。 */
		nameKana: z.string().min(1),
		category: z.enum(CIRCLE_CATEGORIES),
		/** 実施場所（教室名など） */
		location: z.string().min(1),
		/** 実施時間（自由記述） */
		schedule: z.string().min(1),
		/** 紹介文 */
		description: z.string().min(1),
		/** FesFlow 導入予定（各団体の申告）。詳細ページのリンク表示判定に使う。 */
		fesflowPlanned: z.boolean(),
		/** サムネイル画像のパス（任意項目。未提出のサークルがある）。 */
		image: z.string().optional(),
		snsLinks: z
			.array(z.object({ label: z.string().min(1), url: z.string().url() }))
			.default([]),

		// 以下は実行委員会が後から付与する（§2.9.3）。収集時点では値がない。
		/** 実際の FesFlow ページ URL */
		fesflowUrl: z.string().url().optional(),
		/** 掲載順を手動指定する場合の並び順 */
		order: z.number().optional(),
	}),
});

export const collections = { circles };
