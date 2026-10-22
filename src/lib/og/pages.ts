/**
 * 固定ページ（/access など）の OGP 画像に載せる題名と説明。
 *
 * 画像は /og/page/<path>.jpg にビルド時に生成する。Layout が現在のパスからここを引いて
 * og:image を決めるので、ページ側で指定する必要はない。ページを足したらここにも足す。
 * 説明は 2 行まで。改行位置は summary の配列で指定する（自動の折り返しだと 1〜2 文字だけ次の行に残るため）。
 * トップ（/）とサークル詳細（/circle/<slug>）は専用の画像を持つので、ここには入れない。
 */

export interface OgPage {
	/** 先頭の / を除いたパス。 */
	path: string;
	title: string;
	/** 1 要素を 1 行として並べる。1 行は全角 23 字以内（右の文章欄の幅）。 */
	summary: string[];
}

export const OG_PAGES: readonly OgPage[] = [
	{ path: 'about', title: '茨香祭について', summary: ['第34回 茨香祭の概要と、', '開催にこめた思いをご紹介します。'] },
	{ path: 'theme', title: 'テーマ', summary: ['今年のテーマ「守破離」に', 'こめた意味をご紹介します。'] },
	{ path: 'main-visual', title: 'ビジュアル', summary: ['ポスターやキャラクター「ぽんず」など、', '茨香祭のビジュアルをご紹介します。'] },
	{ path: 'news', title: 'お知らせ', summary: ['茨香祭の最新情報をお届けします。'] },
	{ path: 'circle', title: 'サークル一覧', summary: ['クラスや部活動・同好会による出展を、', '学年や種別から探せます。'] },
	{ path: 'event', title: 'ステージ企画一覧', summary: ['ステージで行われる企画の一覧をご紹介します。'] },
	{ path: 'pamphlet', title: 'デジタルパンフレット', summary: ['公式パンフレットを、', 'ブラウザでそのまま読めます。'] },
	{ path: 'map', title: '会場マップ', summary: ['校内の会場マップをご案内します。'] },
	{ path: 'access', title: 'アクセス', summary: ['バス・タクシーなど、', '茨城高専へのアクセス方法をご案内します。'] },
	{ path: 'cautions', title: '注意事項', summary: ['ご来場前にご確認いただきたい', '注意事項をまとめています。'] },
	{ path: 'faq', title: 'よくある質問', summary: ['第34回 茨香祭について、', 'よくある質問と回答をご案内します。'] },
	{ path: 'fireworks', title: '花火', summary: ['10月25日（日）の花火打ち上げの', '日時・場所とお願いをご案内します。'] },
	{ path: 'goods', title: 'グッズ', summary: ['グッズ情報は準備中です。'] },
	{ path: 'decoration', title: '装飾', summary: ['装飾情報は準備中です。'] },
	{ path: 'staff', title: '部署紹介', summary: ['第34回 茨香祭をつくる', '実行委員会の各部署を紹介します。'] },
	{ path: 'sponsor', title: '協賛', summary: ['茨香祭を支えてくださる', '協賛企業の皆様をご紹介します。'] },
	{ path: 'greeting', title: 'ご挨拶', summary: ['第34回 茨香祭に寄せた', '校長と実行委員長のご挨拶です。'] },
	{ path: 'privacy', title: 'プライバシーポリシー', summary: ['個人情報の取り扱いについてご案内します。'] },
	{ path: 'contact', title: 'お問い合わせ', summary: ['茨城工業高等専門学校と第34回 茨香祭の', 'お問い合わせ先をご案内します。'] },
];

export const pageOgImagePath = (path: string) => `/og/page/${path}.jpg`;

/** ページの URL パス（/access や /access/）から OGP 画像のパスを引く。対象外のページは undefined。 */
export function getPageOgImagePath(pathname: string): string | undefined {
	const path = pathname.replace(/^\/+|\/+$/g, '');
	return OG_PAGES.some((page) => page.path === path) ? pageOgImagePath(path) : undefined;
}
