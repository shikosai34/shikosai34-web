import { defineCollection, z } from 'astro:content';
import { glob } from 'astro/loaders';
import { CIRCLE_CATEGORIES } from './lib/circles';
import { NEWS_CATEGORIES } from './lib/news';

/**
 * お知らせ（`/news`）のコレクション。
 *
 * 記事本文は Decap CMS から GitHub App 経由で書き込むため、`src/` の外
 * （リポジトリ直下の `content/news/`）で Markdown を管理する（Issue #17）。
 * サークル情報など他の静的データとは分離する。
 */
const news = defineCollection({
	loader: glob({ pattern: '**/[^_]*.md', base: './content/news' }),
	schema: z.object({
		title: z.string().min(1),
		/**
		 * URL 識別子（任意）。Decap CMS が採番する。
		 * 未指定のときはファイル名がそのまま `/news/[slug]` の slug になる。
		 */
		slug: z.string().optional(),
		/** 公開日時。並び順に用いる。タイムゾーン付き ISO 8601 で記述する。 */
		publishedAt: z.coerce.date(),
		/** 更新日時（任意）。 */
		updatedAt: z.coerce.date().optional(),
		category: z.enum(NEWS_CATEGORIES).default('news'),
		/**
		 * 見出し画像（任意）。
		 * 暫定では `/uploads/...` のローカルパス、R2 導入後は `https://assets.<domain>/...` の
		 * 配信 URL を入れる（Issue #17）。どちらも受け付けられるよう文字列で検証する。
		 */
		image: z.string().optional(),
		/** 一覧・OGP に使う要約（任意）。 */
		description: z.string().optional(),
		/** 下書き。本番ビルドでは除外する。 */
		draft: z.boolean().default(false),
		/** 重要なお知らせ（一覧での強調などに使用）。 */
		important: z.boolean().default(false),
	}),
});

/**
 * サークル情報（`/circle`）。
 *
 * Google フォームで集めた原稿、または Decap CMS の circles コレクションから
 * 確認のうえ JSON 化する（docs/design/03-design.md §2.9.3）。
 * 本文を持たないため JSON。リポジトリ直下の `content/circles/` で管理する。
 */
const circles = defineCollection({
	loader: glob({ pattern: '**/[^_]*.json', base: './content/circles' }),
	schema: z.object({
		/** 団体名 */
		name: z.string().min(1),
		/** 団体名（かな）。並び順に使用。 */
		nameKana: z.string().min(1),
		/**
		 * URL 識別子（任意）。Decap CMS が書き込む。
		 * 未指定のときはファイル名がそのまま `/circle/[slug]` の slug になる。
		 */
		slug: z.string().optional(),
		category: z.enum(CIRCLE_CATEGORIES),
		/** 実施場所（教室名など） */
		location: z.string().min(1),
		/** 実施時間（自由記述） */
		schedule: z.string().min(1),
		/** 紹介文 */
		description: z.string().min(1),
		/** FesFlow 導入予定（各団体の申告）。詳細ページのリンク表示判定に使う。 */
		fesflowPlanned: z.boolean(),
		/**
		 * サムネイル画像（任意項目。未提出のサークルがある）。
		 * ローカルパスまたは R2 の配信 URL。
		 */
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

export const collections = { news, circles };
