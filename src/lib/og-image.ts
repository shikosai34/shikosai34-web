import satori from 'satori';
import { Resvg } from '@resvg/resvg-js';
import sharp from 'sharp';
import fs from 'node:fs';
import path from 'node:path';
import { KASUMI_PATH } from './kasumi';

const FONTS_DIR = path.resolve('src/assets/fonts');
const LOGO_PATH = path.resolve('src/assets/logo/yokogaki/HOL_W-trimmed.png');
// src/lib/poster.ts が掲げているポスターと同じ原稿。差し替えるときは両方そろえる。
const POSTER_PATH = path.resolve('src/assets/poster/sokuhou/01-poster.png');
const KOSEN_LOGO_PATH = path.resolve('src/assets/logo/kosen/footer.svg');

/*
 * 画像には文字を載せていない（ロゴとポスターは画像）が、satori はフォントを 1 つも
 * 渡さないと描画できないため、Kiwi Maru を必要最小限に絞ったサブセット（52KB）を渡している。
 * 画像に文字を載せるときは、使う文字を含むようフルセットの TTF から pyftsubset で抜き出し直すこと。
 */

const kiwiMaruRegular = fs.readFileSync(path.join(FONTS_DIR, 'KiwiMaru-Regular.ttf'));
const logoDataUri = `data:image/png;base64,${fs.readFileSync(LOGO_PATH).toString('base64')}`;
const kosenLogoDataUri = `data:image/svg+xml;base64,${fs.readFileSync(KOSEN_LOGO_PATH).toString('base64')}`;

/** 中央の円に入れる画像。円の中での大きさ（px）を持つ。 */
interface CenterImage {
	src: string;
	width: number;
	height: number;
}

const toJpegDataUri = (buf: Buffer) => `data:image/jpeg;base64,${buf.toString('base64')}`;

// 原寸は 5000x7074（14MB）あるので、円の中に収まる大きさまで縮めた JPEG にして埋め込む。
let posterImage: Promise<CenterImage> | undefined;
function getPosterImage(): Promise<CenterImage> {
	posterImage ??= sharp(POSTER_PATH)
		.resize({ width: POSTER_WIDTH * 2 })
		.jpeg({ quality: 88 })
		.toBuffer()
		.then((buf) => ({ src: toJpegDataUri(buf), width: POSTER_WIDTH, height: POSTER_HEIGHT }));
	return posterImage;
}

/**
 * サークルの画像を、円いっぱいに敷く正方形の JPEG にして返す。
 * サークルの image は R2 の URL（https://...）かリポジトリ内のパス（/uploads/...）。
 * 縦横比が違っても円からはみ出さないよう、中央を正方形に切り抜く。
 */
async function getCircleImage(imageUrl: string): Promise<CenterImage> {
	let source: Buffer;
	if (/^https?:\/\//.test(imageUrl)) {
		const res = await fetch(imageUrl, { signal: AbortSignal.timeout(15_000) });
		if (!res.ok) throw new Error(`${res.status} ${res.statusText}`);
		source = Buffer.from(await res.arrayBuffer());
	} else {
		source = fs.readFileSync(path.resolve('public', imageUrl.replace(/^\//, '')));
	}
	const size = POSTER_CIRCLE - POSTER_BORDER * 2;
	const buf = await sharp(source)
		.resize({ width: size * 2, height: size * 2, fit: 'cover' })
		.jpeg({ quality: 88 })
		.toBuffer();
	return { src: toJpegDataUri(buf), width: size, height: size };
}

// Layout.astro の --kikko-tile と同じ柄（global.css からコピー）。
const KIKKO_TILE =
	"data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='48' height='27.713' viewBox='0 0 48 27.713'%3E%3Cg fill='none' stroke='%2300ffcc' stroke-opacity='0.18' stroke-width='1.2'%3E%3Cpath d='M16 0 L8 13.86 L-8 13.86 L-16 0'/%3E%3Cpath d='M16 27.71 L8 13.86'/%3E%3Cpath d='M64 0 L56 13.86 L40 13.86 L32 0'/%3E%3Cpath d='M64 27.71 L56 13.86'/%3E%3Cpath d='M40 13.86 L32 27.71 L16 27.71'/%3E%3C/g%3E%3C/svg%3E";

/**
 * 霞の雲を data URI の SVG にする（サイトの KasumiCloud.tsx と同じ線・同じ2層の発光）。
 * viewBox は発光が切れないよう線の外側まで広げてある（KasumiCloud.tsx のフィルター範囲と同じ）。
 * flip は右側に置く用の左右反転。
 */
function kasumiDataUri(color: string, opacity: number, flip: boolean): string {
	const shape = `<path d="${KASUMI_PATH}" transform="${flip ? 'translate(210 0) scale(-1 1)' : ''}"/>`;
	const svg =
		`<svg xmlns="http://www.w3.org/2000/svg" viewBox="-45 -10 300 246" fill="none" stroke="${color}" ` +
		`stroke-opacity="${opacity}" stroke-linecap="round" stroke-linejoin="round">` +
		`<defs><filter id="g" filterUnits="userSpaceOnUse" x="-45" y="-10" width="300" height="246">` +
		`<feGaussianBlur in="SourceGraphic" stdDeviation="2" result="near"/>` +
		`<feGaussianBlur in="SourceGraphic" stdDeviation="10" result="far"/>` +
		`<feMerge><feMergeNode in="far"/><feMergeNode in="near"/></feMerge></filter></defs>` +
		`<g stroke-width="6" stroke-opacity="${opacity * 0.55}" filter="url(#g)">${shape}</g>` +
		`<g stroke-width="3">${shape}</g></svg>`;
	return `data:image/svg+xml;base64,${Buffer.from(svg).toString('base64')}`;
}

const kasumiCyanDataUri = kasumiDataUri('#00ffcc', 0.6, false);
const kasumiPinkDataUri = kasumiDataUri('#ff6ea8', 0.6, true);
const KASUMI_WIDTH = 360;
const KASUMI_HEIGHT = Math.round(KASUMI_WIDTH * (246 / 300));

const WIDTH = 1200;
const HEIGHT = 630;
const LOGO_RATIO = 233 / 721;
const KOSEN_LOGO_WIDTH = 260;
const KOSEN_LOGO_HEIGHT = Math.round(KOSEN_LOGO_WIDTH * (56 / 327));

// 中央のポスター円。PosterCircle.tsx と同じく、紙面を円の高さの 106% で置いて上下だけ少し切る。
// 枠（余白 16px）の内側にちょうど収まる大きさ。サークルの画像は円と画面の端で切れるので、
// 上下に食み出させない。四隅のロゴにも掛からない。
const POSTER_CIRCLE = 580;
const POSTER_BORDER = 3;
const POSTER_TOP = (HEIGHT - POSTER_CIRCLE) / 2;
const POSTER_HEIGHT = Math.round(POSTER_CIRCLE * 1.06);
const POSTER_WIDTH = Math.round(POSTER_HEIGHT * (5000 / 7074));

function buildTemplate(center: CenterImage) {
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
					type: 'img',
					props: {
						src: kasumiPinkDataUri,
						width: KASUMI_WIDTH,
						height: KASUMI_HEIGHT,
						style: { position: 'absolute', right: -110, top: 10 },
					},
				},
				{
					type: 'img',
					props: {
						src: kasumiCyanDataUri,
						width: KASUMI_WIDTH,
						height: KASUMI_HEIGHT,
						style: { position: 'absolute', left: -110, bottom: 10 },
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
							position: 'absolute',
							left: (WIDTH - POSTER_CIRCLE) / 2,
							top: POSTER_TOP,
							width: POSTER_CIRCLE,
							height: POSTER_CIRCLE,
							boxSizing: 'border-box',
							borderRadius: '50%',
							border: `${POSTER_BORDER}px solid rgba(0,255,204,0.5)`,
							boxShadow: '0 0 32px rgba(0,255,204,0.35)',
							backgroundColor: '#0b3041',
							overflow: 'hidden',
							display: 'flex',
						},
						children: {
							type: 'img',
							props: {
								src: center.src,
								width: center.width,
								height: center.height,
								style: {
									position: 'absolute',
									left: (POSTER_CIRCLE - center.width) / 2 - POSTER_BORDER,
									top: (POSTER_CIRCLE - center.height) / 2 - POSTER_BORDER,
								},
							},
						},
					},
				},
				{
					type: 'img',
					props: {
						src: logoDataUri,
						width: 240,
						height: Math.round(240 * LOGO_RATIO),
						style: { position: 'absolute', left: 40, top: 48 },
					},
				},
				{
					type: 'img',
					props: {
						src: kosenLogoDataUri,
						width: KOSEN_LOGO_WIDTH,
						height: KOSEN_LOGO_HEIGHT,
						style: { position: 'absolute', right: 40, bottom: 44 },
					},
				},
			],
		},
	};
}

/**
 * OGP 画像(PNG)を生成する。ポスターの円・茨香祭ロゴ・茨城高専ロゴをベースデザインの上に載せる。
 * circleImageUrl を渡すと、中央の円をポスターではなくそのサークルの画像にする。
 * 取得に失敗したときはポスターに戻す（画像が取れないだけでビルドを落とさない）。
 */
export async function renderOgImage(options: { circleImageUrl?: string } = {}): Promise<Buffer> {
	let center: CenterImage | undefined;
	if (options.circleImageUrl) {
		try {
			center = await getCircleImage(options.circleImageUrl);
		} catch (error) {
			console.warn(`[og-image] サークル画像を読めなかったのでポスターで代用します: ${options.circleImageUrl}`, error);
		}
	}
	center ??= await getPosterImage();

	// satori は JSX (ReactNode) を受け取る型だが、ここでは JSX を使わずプレーンオブジェクトで
	// 同じ形（{ type, props }）のノードツリーを組み立てている。satori 自身はこの形をそのまま解釈する。
	const svg = await satori(buildTemplate(center) as Parameters<typeof satori>[0], {
		width: WIDTH,
		height: HEIGHT,
		fonts: [
			{ name: 'Kiwi Maru', data: kiwiMaruRegular, weight: 400, style: 'normal' },
		],
	});

	const resvg = new Resvg(svg, { fitTo: { mode: 'width', value: WIDTH } });
	return resvg.render().asPng();
}
