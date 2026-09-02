/**
 * サークル（circles）関連の定数とラベル。
 * `astro:content` に依存しないため React からも読み込める。
 *
 * カテゴリは「出展主体」による3区分（docs/design/03-design.md §2.8.1 ［確定］）。
 */

export const CIRCLE_CATEGORIES = ['class', 'club', 'group'] as const;

export type CircleCategory = (typeof CIRCLE_CATEGORIES)[number];

export const CIRCLE_CATEGORY_LABELS: Record<CircleCategory, string> = {
	class: 'クラス',
	club: '部・同好会',
	group: '有志サークル',
};
