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
			{ value: 'advanced', label: '専攻科' },
		],
	},
	{
		label: '種別',
		options: [
			{ value: 'sports', label: '運動部' },
			{ value: 'culture', label: '文化部' },
			{ value: 'other', label: '有志サークル' },
		],
	},
] as const;

export const CIRCLE_CATEGORIES = [
	'grade1',
	'grade2',
	'grade3',
	'grade4',
	'grade5',
	'advanced',
	'sports',
	'culture',
	'other',
] as const;

export type CircleCategory = (typeof CIRCLE_CATEGORIES)[number];

export const CIRCLE_CATEGORY_LABELS: Record<CircleCategory, string> = {
	grade1: '1年生',
	grade2: '2年生',
	grade3: '3年生',
	grade4: '4年生',
	grade5: '5年生',
	advanced: '専攻科',
	sports: '運動部',
	culture: '文化部',
	other: '有志サークル',
};

/** 出展内容の区分（学年・種別の `category` とは別。CMS の「サークルカテゴリ」）。 */
export const CIRCLE_GENRES = ['culture', 'food', 'tech'] as const;

export type CircleGenre = (typeof CIRCLE_GENRES)[number];

export const CIRCLE_GENRE_LABELS: Record<CircleGenre, string> = {
	culture: '文化',
	food: '食品',
	tech: '技術',
};

/** 検索・比較用に文字列を正規化する（全角半角を畳み、小文字化）。 */
export function normalizeForSearch(value: string): string {
	return value.normalize('NFKC').toLowerCase();
}

/**
 * 1・2年生のクラス出店 slug（"1-1" 等）を組番号順に比較する。
 * 数字部分を取り出して比較し、取れない場合は文字列として比較する。
 */
function compareGrade12Slug(a: string, b: string): number {
	const parse = (slug: string) => {
		const match = slug.match(/^(\d+)-(\d+)$/);
		return match ? [Number(match[1]), Number(match[2])] : null;
	};
	const pa = parse(a);
	const pb = parse(b);
	if (pa && pb) {
		return pa[0] - pb[0] || pa[1] - pb[1];
	}
	return a.localeCompare(b, 'ja');
}

/** 3〜5年生のコース記号の表示順（M1 → M2 → E → I → C）。 */
const GRADE345_COURSE_ORDER = ['m1', 'm2', 'e', 'i', 'c'];

/**
 * 3〜5年生のクラス出店 slug（"3m1", "4e", "5c" 等）をコース順に比較する。
 * 数字部分（学年）が同じであれば、コース記号を GRADE345_COURSE_ORDER の順で比較する。
 */
function compareGrade345Slug(a: string, b: string): number {
	const parse = (slug: string) => {
		const match = slug.match(/^(\d+)([a-z0-9]+)$/);
		return match ? ([Number(match[1]), match[2]] as const) : null;
	};
	const pa = parse(a);
	const pb = parse(b);
	if (pa && pb) {
		if (pa[0] !== pb[0]) return pa[0] - pb[0];
		const courseDiff = GRADE345_COURSE_ORDER.indexOf(pa[1]) - GRADE345_COURSE_ORDER.indexOf(pb[1]);
		if (courseDiff !== 0) return courseDiff;
		return pa[1].localeCompare(pb[1], 'ja');
	}
	return a.localeCompare(b, 'ja');
}

/**
 * サークル一覧をカテゴリ（学年→種別）ごとにまとめ、カテゴリ内で並べ替える。
 * 1・2年生（grade1, grade2）はクラス出店の組番号順（slug: "1-1", "1-2", ...）、
 * 3〜5年生（grade3〜grade5）はコース順 M1 → M2 → E → I → C（slug: "3m1", "3m2", "3e", "3i", "3c" 等）、
 * それ以外のカテゴリ（専攻科を含む）は `nameKana` の五十音順。
 */
export function sortCirclesByCategory<T extends { data: { category: string; nameKana: string }; id: string }>(
	circles: T[],
): T[] {
	const order = new Map(CIRCLE_CATEGORIES.map((category, index) => [category, index]));
	return [...circles].sort((a, b) => {
		const categoryDiff =
			(order.get(a.data.category) ?? Number.MAX_SAFE_INTEGER) -
			(order.get(b.data.category) ?? Number.MAX_SAFE_INTEGER);
		if (categoryDiff !== 0) return categoryDiff;

		if (a.data.category === 'grade1' || a.data.category === 'grade2') {
			return compareGrade12Slug(a.id, b.id);
		}
		if (a.data.category === 'grade3' || a.data.category === 'grade4' || a.data.category === 'grade5') {
			return compareGrade345Slug(a.id, b.id);
		}
		return a.data.nameKana.localeCompare(b.data.nameKana, 'ja');
	});
}
