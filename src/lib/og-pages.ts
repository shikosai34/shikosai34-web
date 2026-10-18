/**
 * ページごとに動的生成する OGP 画像の見出し一覧。
 * キーはパス（先頭スラッシュなし、末尾スラッシュなし）。
 * `src/pages/og/[slug].png.ts` の静的生成と、Layout.astro の og:image 解決の両方から参照する。
 *
 * 対象は URL が固定されている一覧・案内ページのみ。
 * circle/event/news の個別記事（content collection で件数が増える動的ページ）と
 * トップページ・404 は対象外（トップは /ogp.png、他は Layout 既定の /ogp.png にフォールバックする）。
 */
export const ogPageTitles: Record<string, string> = {
	about: '茨香祭について',
	access: 'アクセス',
	cautions: '注意事項',
	circle: 'サークル一覧',
	contact: 'お問い合わせ',
	decoration: '装飾',
	event: 'イベント一覧',
	faq: 'よくある質問',
	goods: 'グッズ',
	greeting: 'ご挨拶',
	'main-visual': 'ビジュアル',
	map: '会場マップ',
	news: 'お知らせ',
	privacy: 'プライバシーポリシー',
	sponsor: '協賛',
	staff: '部署紹介',
	theme: 'テーマ',
	timetable: 'タイムテーブル',
};

export type OgPageSlug = keyof typeof ogPageTitles;
