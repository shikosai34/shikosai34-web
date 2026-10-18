/**
 * 固定ページの名前（先頭のパス → ページ名）。
 * Layout.astro が og:title に「第34回 茨香祭 › ページ名」の階層を出すのと、
 * OGP 画像の右下にページ名を載せる（src/pages/og/[slug].jpg.ts）のに使う。
 * サークルの画像は別に用意するので、OGP 画像のページ名には使わない（ogPageNameSlugs を参照）。
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

/** OGP 画像の右下にページ名を載せるページ。サークルは個別の画像を持つので除く。 */
export const ogPageNameSlugs = Object.keys(ogPageTitles).filter((slug) => slug !== 'circle');
