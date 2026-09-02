import { defineCollection, z } from 'astro:content';
import { glob } from 'astro/loaders';
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

export const collections = { news };
