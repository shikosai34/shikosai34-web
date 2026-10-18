import satori from 'satori';
import { Resvg } from '@resvg/resvg-js';
import fs from 'node:fs';
import path from 'node:path';

const FONTS_DIR = path.resolve('src/assets/fonts');
const LOGO_PATH = path.resolve('src/assets/logo/yokogaki/HOL_W-trimmed.png');

/*
 * KiwiMaru-{Regular,Medium}.ttf は Google Fonts の Kiwi Maru から、このファイルで
 * 実際に組版する文字（og-pages.ts の見出し一覧 + 英数字記号）だけを pyftsubset で
 * 抜き出したサブセット版（4.7MB→52KB）。見出しに新しい文字種を使う場合は、
 * フルセットの TTF から文字を再抽出して差し替える必要がある。
 */

const kiwiMaruRegular = fs.readFileSync(path.join(FONTS_DIR, 'KiwiMaru-Regular.ttf'));
const kiwiMaruMedium = fs.readFileSync(path.join(FONTS_DIR, 'KiwiMaru-Medium.ttf'));
const logoDataUri = `data:image/png;base64,${fs.readFileSync(LOGO_PATH).toString('base64')}`;

// Layout.astro の --kikko-tile と同じ柄（global.css からコピー）。
const KIKKO_TILE =
	"data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='48' height='27.713' viewBox='0 0 48 27.713'%3E%3Cg fill='none' stroke='%2300ffcc' stroke-opacity='0.18' stroke-width='1.2'%3E%3Cpath d='M16 0 L8 13.86 L-8 13.86 L-16 0'/%3E%3Cpath d='M16 27.71 L8 13.86'/%3E%3Cpath d='M64 0 L56 13.86 L40 13.86 L32 0'/%3E%3Cpath d='M64 27.71 L56 13.86'/%3E%3Cpath d='M40 13.86 L32 27.71 L16 27.71'/%3E%3C/g%3E%3C/svg%3E";

const WIDTH = 1200;
const HEIGHT = 630;
const LOGO_RATIO = 233 / 721;

/** タイトルの文字数に応じてフォントサイズを下げ、長い見出しでもはみ出さないようにする。 */
function titleFontSize(title: string): number {
	const len = [...title].length;
	if (len <= 8) return 72;
	if (len <= 12) return 58;
	if (len <= 16) return 46;
	return 38;
}

const DEFAULT_CAPTION = '第34回 茨香祭 ｜ 2026.10.24 SAT';

function buildTemplate(title: string, caption: string = DEFAULT_CAPTION) {
	return {
		type: 'div',
		props: {
			style: {
				width: `${WIDTH}px`,
				height: `${HEIGHT}px`,
				display: 'flex',
				flexDirection: 'column',
				backgroundColor: '#0b3041',
				backgroundImage: `url(${KIKKO_TILE})`,
				backgroundSize: '96px 55.4px',
				position: 'relative',
				fontFamily: 'Kiwi Maru',
			},
			children: [
				{
					type: 'div',
					props: {
						style: {
							position: 'absolute',
							left: -180,
							top: -180,
							width: 520,
							height: 520,
							borderRadius: '50%',
							background: 'radial-gradient(circle, rgba(0,255,204,0.28) 0%, rgba(0,255,204,0) 70%)',
							display: 'flex',
						},
					},
				},
				{
					type: 'div',
					props: {
						style: {
							position: 'absolute',
							right: -200,
							bottom: -200,
							width: 560,
							height: 560,
							borderRadius: '50%',
							background: 'radial-gradient(circle, rgba(231,56,111,0.26) 0%, rgba(231,56,111,0) 70%)',
							display: 'flex',
						},
					},
				},
				{
					type: 'div',
					props: {
						style: {
							position: 'absolute',
							width: 1500,
							height: 4,
							top: 110,
							left: -200,
							background:
								'linear-gradient(90deg, rgba(255,110,168,0) 0%, rgba(255,110,168,0.55) 50%, rgba(255,110,168,0) 100%)',
							transform: 'rotate(-7deg)',
							display: 'flex',
						},
					},
				},
				{
					type: 'div',
					props: {
						style: {
							position: 'absolute',
							width: 1500,
							height: 4,
							bottom: 90,
							left: -250,
							background:
								'linear-gradient(90deg, rgba(0,255,204,0) 0%, rgba(0,255,204,0.4) 50%, rgba(0,255,204,0) 100%)',
							transform: 'rotate(-7deg)',
							display: 'flex',
						},
					},
				},
				{
					type: 'div',
					props: {
						style: {
							position: 'absolute',
							top: 16,
							left: 16,
							right: 16,
							bottom: 16,
							border: '2px solid rgba(232,232,232,0.3)',
							display: 'flex',
						},
					},
				},
				{
					type: 'div',
					props: {
						style: {
							position: 'absolute',
							top: 14,
							left: 14,
							width: 32,
							height: 32,
							borderTop: '4px solid #ff9933',
							borderLeft: '4px solid #ff9933',
							display: 'flex',
						},
					},
				},
				{
					type: 'div',
					props: {
						style: {
							position: 'absolute',
							bottom: 14,
							right: 14,
							width: 32,
							height: 32,
							borderBottom: '4px solid #ff9933',
							borderRight: '4px solid #ff9933',
							display: 'flex',
						},
					},
				},
				{
					type: 'div',
					props: {
						style: {
							position: 'relative',
							width: '100%',
							height: '100%',
							display: 'flex',
							flexDirection: 'column',
							alignItems: 'center',
							justifyContent: 'center',
							gap: 26,
						},
						children: [
							{
								type: 'img',
								props: {
									src: logoDataUri,
									width: 240,
									height: Math.round(240 * LOGO_RATIO),
									style: { display: 'flex' },
								},
							},
							{
								type: 'div',
								props: {
									style: {
										fontSize: titleFontSize(title),
										fontWeight: 500,
										color: '#e8e8e8',
										letterSpacing: '0.04em',
										display: 'flex',
										textShadow: '0 0 24px rgba(0,255,204,0.25)',
									},
									children: title,
								},
							},
							{
								type: 'div',
								props: {
									style: {
										fontSize: 24,
										fontWeight: 400,
										color: '#00ffcc',
										letterSpacing: '0.15em',
										display: 'flex',
									},
									children: caption,
								},
							},
						],
					},
				},
			],
		},
	};
}

/**
 * ページタイトルからベースデザイン共通の OGP 画像(PNG)を生成する。
 * caption 省略時は「第34回 茨香祭｜開催日」。トップページなどタイトルと重複する場合は渡し替える。
 */
export async function renderOgImage(title: string, caption?: string): Promise<Buffer> {
	// satori は JSX (ReactNode) を受け取る型だが、ここでは JSX を使わずプレーンオブジェクトで
	// 同じ形（{ type, props }）のノードツリーを組み立てている。satori 自身はこの形をそのまま解釈する。
	const svg = await satori(buildTemplate(title, caption) as Parameters<typeof satori>[0], {
		width: WIDTH,
		height: HEIGHT,
		fonts: [
			{ name: 'Kiwi Maru', data: kiwiMaruRegular, weight: 400, style: 'normal' },
			{ name: 'Kiwi Maru', data: kiwiMaruMedium, weight: 500, style: 'normal' },
		],
	});

	const resvg = new Resvg(svg, { fitTo: { mode: 'width', value: WIDTH } });
	return resvg.render().asPng();
}
