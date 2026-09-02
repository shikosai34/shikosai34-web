/**
 * サークル（circles）関連の定数とラベル。
 * `astro:content` に依存しないため React からも読み込める。
 *
 * 絞り込みは「学年」と「種別」の2グループ（画面上は1つだけ選択）。
 * docs/design/03-design.md §2.8.1 の3区分（出展主体）から変更している。
 * 収集フォームのカテゴリ選択肢もこれに合わせる必要がある。
 */

export const CIRCLE_CATEGORY_GROUPS = [
	{
		label: '学年',
		options: [
			{ value: 'grade1', label: '1年生' },
			{ value: 'grade2', label: '2年生' },
			{ value: 'grade3', label: '3年生' },
			{ value: 'grade4', label: '4年生' },
			{ value: 'grade5', label: '5年生' },
		],
	},
	{
		label: '種別',
		options: [
			{ value: 'sports', label: '運動部' },
			{ value: 'culture', label: '文化部' },
			{ value: 'society', label: '同好会' },
			{ value: 'other', label: 'その他' },
		],
	},
] as const;

export const CIRCLE_CATEGORIES = [
	'grade1',
	'grade2',
	'grade3',
	'grade4',
	'grade5',
	'sports',
	'culture',
	'society',
	'other',
] as const;

export type CircleCategory = (typeof CIRCLE_CATEGORIES)[number];

export const CIRCLE_CATEGORY_LABELS: Record<CircleCategory, string> = {
	grade1: '1年生',
	grade2: '2年生',
	grade3: '3年生',
	grade4: '4年生',
	grade5: '5年生',
	sports: '運動部',
	culture: '文化部',
	society: '同好会',
	other: 'その他',
};

/** 検索・比較用に文字列を正規化する（全角半角を畳み、小文字化）。 */
export function normalizeForSearch(value: string): string {
	return value.normalize('NFKC').toLowerCase();
}
