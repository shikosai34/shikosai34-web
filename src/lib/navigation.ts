export interface NavLinkItem {
	label: string;
	href: string;
}

export interface NavGroupItem {
	heading?: string;
	links: NavLinkItem[];
}

// docs/design/02-overview.md 2.7 ページ一覧 に基づく仮の分類。
// ナビゲーション階層は 3.0 の #1 で ［要検討］ のため、確定後に見直す。
export const navGroups: NavGroupItem[] = [
	{
		links: [
			{ label: 'トップ', href: '/' },
			{ label: 'お知らせ', href: '/news' },
			{ label: '茨香祭について', href: '/about' },
			{ label: 'テーマ', href: '/theme' },
		],
	},
	{
		heading: '企画',
		links: [
			{ label: 'サークル一覧', href: '/circle' },
			{ label: 'ステージ企画一覧', href: '/event' },
			{ label: 'タイムテーブル', href: '/timetable' },
		],
	},
	{
		heading: '来場案内',
		links: [
			{ label: '会場マップ', href: '/map' },
			{ label: 'アクセス', href: '/access' },
			{ label: '注意事項', href: '/cautions' },
			{ label: 'よくある質問', href: '/faq' },
		],
	},
	{
		heading: 'その他',
		links: [
			{ label: 'グッズ', href: '/goods' },
			{ label: '装飾', href: '/decoration' },
			{ label: '実行委員紹介', href: '/staff' },
			{ label: '協賛', href: '/sponsor' },
		],
	},
];
