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
 * 画像に載せる文字は、右下のページ名だけ（ロゴとポスターは画像）。
 * 基本の Kiwi Maru は og-pages.ts のページ名と英数字記号だけに絞ったサブセット（52KB）。
 * サークルの名前のように、そこに無い文字が入るときは、@fontsource/kiwi-maru の分割フォント（woff）から
 * その文字を含むスライスだけを、別の名前のフォントとして足して渡す。ページ名の font-family に
 * 並べておくと、satori が基本のフォントに無い文字をそちらで描く。
 * （同じ名前・太さのフォントを複数渡しても、satori は 1 つしか使わない。）
 */

const kiwiMaruRegular = fs.readFileSync(path.join(FONTS_DIR, 'KiwiMaru-Regular.ttf'));

const FONTSOURCE_DIR = path.resolve('node_modules/@fontsource/kiwi-maru');

interface FontSlice {
	file: string;
	ranges: [number, number][];
}

let fontSlices: FontSlice[] | undefined;
const fontSliceData = new Map<string, Buffer>();

/** 400.css の @font-face から、スライスごとのファイル名と unicode-range を読む。 */
function loadFontSlices(): FontSlice[] {
	fontSlices ??= [...fs.readFileSync(path.join(FONTSOURCE_DIR, '400.css'), 'utf8').matchAll(/@font-face\s*{[^}]*}/g)].flatMap(
		([block]) => {
			const file = block.match(/files\/(kiwi-maru-[\w-]+\.woff)\)/)?.[1];
			const range = block.match(/unicode-range:\s*([^;]+);/)?.[1];
			if (!file || !range) return [];
			const ranges = range.split(',').map((part): [number, number] => {
				const [from, to] = part.trim().replace(/^U\+/i, '').split('-');
				return [parseInt(from, 16), parseInt(to ?? from, 16)];
			});
			return [{ file, ranges }];
		},
	);
	return fontSlices;
}

/** text の文字を含むスライスを、satori に渡す名前つきの woff にして返す。 */
function fontSlicesFor(text: string): { name: string; data: Buffer }[] {
	const codes = new Set([...text].map((char) => char.codePointAt(0)!));
	return loadFontSlices()
		.filter(({ ranges }) => ranges.some(([from, to]) => [...codes].some((code) => code >= from && code <= to)))
		.map(({ file }) => {
			if (!fontSliceData.has(file)) fontSliceData.set(file, fs.readFileSync(path.join(FONTSOURCE_DIR, 'files', file)));
			return { name: file, data: fontSliceData.get(file)! };
		});
}

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
 * サークルの画像を、円の中央に置く正方形の JPEG にして返す。
 * imageScale は円の内径に対する一辺の割合で、既定の 1 は円いっぱい。角や縁の文字が円で切れるサークルだけ小さくする。
 * サークルの image は R2 の URL（https://...）かリポジトリ内のパス（/uploads/...）。
 * 縦横比が違っても円からはみ出さないよう、中央を正方形に切り抜く。
 */
async function getCircleImage(imageUrl: string, imageScale = 1): Promise<CenterImage> {
	let source: Buffer;
	if (/^https?:\/\//.test(imageUrl)) {
		const res = await fetch(imageUrl, { signal: AbortSignal.timeout(15_000) });
		if (!res.ok) throw new Error(`${res.status} ${res.statusText}`);
		source = Buffer.from(await res.arrayBuffer());
	} else {
		source = fs.readFileSync(path.resolve('public', imageUrl.replace(/^\//, '')));
	}
	const size = Math.round((POSTER_CIRCLE - POSTER_BORDER * 2) * imageScale);
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
const KOSEN_LOGO_WIDTH = 320;
const KOSEN_LOGO_HEIGHT = Math.round(KOSEN_LOGO_WIDTH * (56 / 327));
// ページ名は 1 行に収まる大きさにし、長い名前は最小の大きさまで縮めたうえで折り返す。
// 折り返すときは行ごとの文字数をそろえ、最後の行に 1 文字だけ残らないようにする。
// 固定ページは高専ロゴの上に添える大きさ、サークルはロゴを載せない代わりに大きく出す。
const PAGE_NAME_MAX_WIDTH = 360;
const PAGE_NAME_LETTER_SPACING = 0.06;
const PAGE_NAME_LINE_HEIGHT = 1.3;
// 改行を指定した名前（nameLines）で、円の右端と名前の間に最低限あけておく幅。
const NAME_CIRCLE_GAP = 28;
const PAGE_NAME_SIZES = {
	page: { max: 44, min: 28 },
	circle: { max: 64, min: 36 },
};

// 画像の端から四隅のロゴ・ページ名までの余白。枠（端から 16px）からは 40px 空く。
const EDGE_MARGIN = 56;

function pageNameLayout(name: string, circle: boolean): { fontSize: number; maxWidth: number } {
	const { max, min } = PAGE_NAME_SIZES[circle ? 'circle' : 'page'];
	const length = [...name].length;
	const charWidth = (fontSize: number) => fontSize * (1 + PAGE_NAME_LETTER_SPACING);
	const fontSize = Math.max(min, Math.min(max, Math.floor(PAGE_NAME_MAX_WIDTH / (length * charWidth(1)))));
	const lines = Math.max(1, Math.ceil((length * charWidth(fontSize)) / PAGE_NAME_MAX_WIDTH));
	const maxWidth = Math.min(PAGE_NAME_MAX_WIDTH, Math.ceil(Math.ceil(length / lines) * charWidth(fontSize)) + 4);
	return { fontSize, maxWidth };
}

/** 文字の幅（全角を 1 としたときの比）。英数字・記号は半角として数える。 */
const glyphWidth = (char: string) => (char.charCodeAt(0) < 0x80 ? 0.62 : 1);
const lineWidth = (line: string, fontSize: number) =>
	[...line].reduce((width, char) => width + (glyphWidth(char) + PAGE_NAME_LETTER_SPACING) * fontSize, 0);

/** 高さ y での、円の右端の x。円の上下より外なら中心の x。 */
function circleRightEdge(y: number): number {
	const radius = POSTER_CIRCLE / 2;
	const dy = y - HEIGHT / 2;
	return Math.abs(dy) >= radius ? POSTER_CENTER_X : POSTER_CENTER_X + Math.sqrt(radius * radius - dy * dy);
}

/**
 * 改行を指定した名前（nameLines）の文字サイズ。各行が、円の右端に NAME_CIRCLE_GAP 以上あけて
 * 右下に収まる範囲で、いちばん大きい大きさにする（行の位置が低いほど円から離れるので、下の行ほど長くできる）。
 */
function fitNameLines(lines: string[]): number {
	const { max, min } = PAGE_NAME_SIZES.circle;
	for (let fontSize = max; fontSize > min; fontSize--) {
		const fits = lines.every((line, index) => {
			const top = HEIGHT - EDGE_MARGIN - (lines.length - index) * fontSize * PAGE_NAME_LINE_HEIGHT;
			const available = WIDTH - EDGE_MARGIN - circleRightEdge(top) - NAME_CIRCLE_GAP;
			return lineWidth(line, fontSize) <= available;
		});
		if (fits) return fontSize;
	}
	return min;
}

// 中央のポスター円。PosterCircle.tsx と同じく、紙面を円の高さの 106% で置いて上下だけ少し切る。
// 上下とも枠から 40px 以上の余白を残す大きさ。中心は画面の真ん中。
const POSTER_CIRCLE = 520;
const POSTER_CENTER_X = WIDTH / 2;
const POSTER_BORDER = 3;
const POSTER_TOP = (HEIGHT - POSTER_CIRCLE) / 2;
const POSTER_HEIGHT = Math.round(POSTER_CIRCLE * 1.06);
const POSTER_WIDTH = Math.round(POSTER_HEIGHT * (5000 / 7074));

function pageNameNode(pageName: string, fallbackFonts: string[], circle: boolean, nameLines?: string[]) {
	const style = {
		color: '#e8e8e8',
		fontFamily: ['Kiwi Maru', ...fallbackFonts].map((name) => `"${name}"`).join(', '),
		letterSpacing: `${PAGE_NAME_LETTER_SPACING}em`,
		lineHeight: PAGE_NAME_LINE_HEIGHT,
		textAlign: 'right',
		display: 'flex',
	};
	if (circle && nameLines) {
		// 改行を指定した名前は、1 行ずつ別の要素にして、折り返しを satori に任せない。
		const fontSize = fitNameLines(nameLines);
		return {
			type: 'div',
			props: {
				style: { display: 'flex', flexDirection: 'column', alignItems: 'flex-end' },
				children: nameLines.map((line) => ({ type: 'div', props: { style: { ...style, fontSize }, children: line } })),
			},
		};
	}
	const layout = pageNameLayout(pageName, circle);
	return {
		type: 'div',
		props: {
			style: { ...style, fontSize: layout.fontSize, maxWidth: layout.maxWidth, marginBottom: circle ? 0 : 14 },
			children: pageName,
		},
	};
}

function buildTemplate(center: CenterImage, pageName?: string, fallbackFonts: string[] = [], circle = false, nameLines?: string[]) {
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
							left: POSTER_CENTER_X - POSTER_CIRCLE / 2,
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
						style: { position: 'absolute', left: EDGE_MARGIN, top: EDGE_MARGIN },
					},
				},
				{
					type: 'div',
					props: {
						style: {
							position: 'absolute',
							right: EDGE_MARGIN,
							bottom: EDGE_MARGIN,
							display: 'flex',
							flexDirection: 'column',
							alignItems: 'flex-end',
						},
						children: [
							...(pageName ? [pageNameNode(pageName, fallbackFonts, circle, nameLines)] : []),
							...(circle
								? []
								: [
										{
											type: 'img',
											props: {
												src: kosenLogoDataUri,
												width: KOSEN_LOGO_WIDTH,
												height: KOSEN_LOGO_HEIGHT,
											},
										},
									]),
						],
					},
				},
			],
		},
	};
}

/**
 * OGP 画像(JPEG)を生成する。ポスターの円・茨香祭ロゴ・茨城高専ロゴをベースデザインの上に載せる。
 * circleImageUrl を渡すと、中央の円をポスターではなくそのサークルの画像にする。
 * pageName を渡すと、右下の茨城高専ロゴの上にそのページの名前を載せる。
 * サークルの画像（circleImageUrl）では、ロゴを載せずに名前だけを大きく載せる。
 * nameLines は名前の改行位置を指定し（サークルの画像のみ。文字サイズは円に掛からない最大に自動で決まる）、
 * imageScale は円の中の画像を小さくする。
 * 画像を取得できないときは例外を投げる（ポスターで代用した画像を、そのサークルのものとして残さないため）。
 */
export async function renderOgImage(
	options: { circleImageUrl?: string; pageName?: string; nameLines?: string[]; imageScale?: number } = {},
): Promise<Buffer> {
	const center = options.circleImageUrl ? await getCircleImage(options.circleImageUrl, options.imageScale) : await getPosterImage();

	// satori は JSX (ReactNode) を受け取る型だが、ここでは JSX を使わずプレーンオブジェクトで
	// 同じ形（{ type, props }）のノードツリーを組み立てている。satori 自身はこの形をそのまま解釈する。
	const slices = options.pageName ? fontSlicesFor(options.pageName) : [];
	const svg = await satori(buildTemplate(center, options.pageName, slices.map(({ name }) => name), Boolean(options.circleImageUrl), options.nameLines) as Parameters<typeof satori>[0], {
		width: WIDTH,
		height: HEIGHT,
		fonts: [
			{ name: 'Kiwi Maru', data: kiwiMaruRegular, weight: 400, style: 'normal' },
			...slices.map(({ name, data }) => ({ name, data, weight: 400 as const, style: 'normal' as const })),
		],
	});

	const resvg = new Resvg(svg, { fitTo: { mode: 'width', value: WIDTH } });
	// PNG（圧縮レベル 9）だと 1 枚 約 600KB・再圧縮に 約 140ms かかるので、JPEG にして小さく速くする（約 150KB・約 8ms）。
	return sharp(resvg.render().asPng()).jpeg({ quality: 85, progressive: true }).toBuffer();
}
