import { defineCollection, z } from 'astro:content';
import { glob } from 'astro/loaders';
import { CIRCLE_CATEGORIES } from './lib/circles';
import { EVENT_GENRES, EVENT_STATUSES, FESTIVAL_DAYS, getEventDayKey } from './lib/events';
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
 * お知らせと同じく Decap CMS から Markdown で管理する。紹介文は本文（body）。
 * リポジトリ直下の `content/circles/` に置く。
 */
const circles = defineCollection({
	loader: glob({ pattern: '**/[^_]*.md', base: './content/circles' }),
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

/**
 * 体育館ステージの企画（`/event`、`/timetable`）。
 *
 * CMS では開始・終了をタイムゾーン付き日時として入力する。会場は体育館のみのため
 * 編集項目にはせず、コンテンツ側で固定値を補う。
 */
const events = defineCollection({
	loader: glob({ pattern: '**/[^_]*.md', base: './content/events' }),
	schema: z
		.object({
			title: z.string().min(1),
			slug: z.string().optional(),
			/** 出演団体名。個人名や連絡先は掲載しない。 */
			performer: z.string().min(1),
			startAt: z.coerce.date(),
			endAt: z.coerce.date(),
			genre: z.enum(EVENT_GENRES).default('other'),
			status: z.enum(EVENT_STATUSES).default('scheduled'),
			venue: z.literal('体育館').default('体育館'),
			image: z.string().optional(),
			description: z.string().optional(),
			draft: z.boolean().default(false),
		})
		.superRefine((event, ctx) => {
			if (event.endAt <= event.startAt) {
				ctx.addIssue({
					code: 'custom',
					path: ['endAt'],
					message: '終了日時は開始日時より後にしてください。',
				});
			}

			const startDay = getEventDayKey(event.startAt);
			const endDay = getEventDayKey(event.endAt);
			if (!FESTIVAL_DAYS.some((day) => day.date === startDay)) {
				ctx.addIssue({
					code: 'custom',
					path: ['startAt'],
					message: '開始日時は開催日（2026年10月24日または25日）を指定してください。',
				});
			}
			if (startDay !== endDay) {
				ctx.addIssue({
					code: 'custom',
					path: ['endAt'],
					message: '開始日時と終了日時は同じ開催日にしてください。',
				});
			}
		}),
});

export const collections = { news, circles, events };
