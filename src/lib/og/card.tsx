import fs from 'node:fs';
import path from 'node:path';
import satori from 'satori';
import sharp from 'sharp';
import { KASUMI_PATH } from '../kasumi';
import { fontsFor, stripUnsupportedGlyphs } from './fonts';

/**
 * OGP 画像（1200x630）の共通カード。サークル詳細・トップなどで使う。
 *
 * レイアウト: 左上に茨香祭ロゴと区分名、左に画像、右にタイトル・紹介文・場所・日時、右下に茨城高専ロゴ。
 * 背景・枠・ロゴなどの意匠はここに集め、ページごとに変わる中身だけを OgCardInput で渡す。
 */

export const OG_WIDTH = 1200;
export const OG_HEIGHT = 630;

const COLOR = {
	base: '#0b3041',
	text: '#e8e8e8',
	accent: '#00ffcc',
	main: '#ff9933',
	glitch: '#e7386f',
	pink: '#ff6ea8',
} as const;

/** 画像枠の既定の高さ。 */
export const MEDIA_HEIGHT = 360;
const MEDIA_BORDER = 3;
const PADDING_X = 88;
const COLUMN_GAP = 56;
const SUMMARY_LINES = 2;

const LOGO_PATH = path.resolve('src/assets/logo/yokogaki/HOL_W-trimmed.png');
const LOGO_WIDTH = 230;
const LOGO_HEIGHT = Math.round(LOGO_WIDTH * (233 / 721));
const KOSEN_LOGO_PATH = path.resolve('src/assets/logo/kosen/footer.svg');
const KOSEN_LOGO_WIDTH = 250;
const KOSEN_LOGO_HEIGHT = Math.round(KOSEN_LOGO_WIDTH * (56 / 327));

// global.css の --kikko-tile と同じ亀甲柄。
const KIKKO_TILE =
	"data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='48' height='27.713' viewBox='0 0 48 27.713'%3E%3Cg fill='none' stroke='%2300ffcc' stroke-opacity='0.18' stroke-width='1.2'%3E%3Cpath d='M16 0 L8 13.86 L-8 13.86 L-16 0'/%3E%3Cpath d='M16 27.71 L8 13.86'/%3E%3Cpath d='M64 0 L56 13.86 L40 13.86 L32 0'/%3E%3Cpath d='M64 27.71 L56 13.86'/%3E%3Cpath d='M40 13.86 L32 27.71 L16 27.71'/%3E%3C/g%3E%3C/svg%3E";

const svgDataUri = (svg: string) => `data:image/svg+xml;base64,${Buffer.from(svg).toString('base64')}`;

const logoDataUri = `data:image/png;base64,${fs.readFileSync(LOGO_PATH).toString('base64')}`;
const kosenLogoDataUri = `data:image/svg+xml;base64,${fs.readFileSync(KOSEN_LOGO_PATH).toString('base64')}`;

/**
 * 霞の雲を data URI の SVG にする（サイトの KasumiCloud.tsx と同じ線・同じ 2 層の発光）。
 * viewBox は発光が切れないよう線の外側まで広げてある。flip は右側に置く用の左右反転。
 */
function kasumiDataUri(color: string, flip: boolean): string {
	const opacity = 0.6;
	const shape = `<path d="${KASUMI_PATH}" transform="${flip ? 'translate(210 0) scale(-1 1)' : ''}"/>`;
	return svgDataUri(
		`<svg xmlns="http://www.w3.org/2000/svg" viewBox="-45 -10 300 246" fill="none" stroke="${color}" stroke-opacity="${opacity}" stroke-linecap="round" stroke-linejoin="round">` +
			`<defs><filter id="g" filterUnits="userSpaceOnUse" x="-45" y="-10" width="300" height="246">` +
			`<feGaussianBlur in="SourceGraphic" stdDeviation="2" result="near"/>` +
			`<feGaussianBlur in="SourceGraphic" stdDeviation="10" result="far"/>` +
			`<feMerge><feMergeNode in="far"/><feMergeNode in="near"/></feMerge></filter></defs>` +
			`<g stroke-width="6" stroke-opacity="${opacity * 0.55}" filter="url(#g)">${shape}</g>` +
			`<g stroke-width="3">${shape}</g></svg>`,
	);
}

const KASUMI_PINK = kasumiDataUri(COLOR.pink, true);
const KASUMI_CYAN = kasumiDataUri(COLOR.accent, false);
const KASUMI_WIDTH = 270;
const KASUMI_HEIGHT = Math.round(KASUMI_WIDTH * (246 / 300));

const PIN_ICON = svgDataUri(
	`<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="${COLOR.accent}" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M12 22s7-6.2 7-12a7 7 0 0 0-14 0c0 5.8 7 12 7 12z"/><circle cx="12" cy="10" r="2.6"/></svg>`,
);
const CLOCK_ICON = svgDataUri(
	`<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="${COLOR.accent}" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="9.5"/><path d="M12 6.5V12l3.8 2.2"/></svg>`,
);

export interface OgCardInput {
	/** ロゴの右に出す区分名（「サークル」など）。省略すると出さない。 */
	label?: string;
	title: string;
	/** 紹介文。配列で渡すと 1 要素を 1 行として、改行位置を指定できる。 */
	summary: string | string[];
	location: string;
	/** 日付ラベルと内容の行。 */
	schedule: { label: string; value: string }[];
	/** 画像枠の幅（px）。 */
	mediaWidth: number;
	/** 画像枠の高さ（px）。右の文章もこの高さに合わせて上下に広がる。既定は MEDIA_HEIGHT。 */
	mediaHeight?: number;
	/**
	 * 右の文章の並べ方。'spread'（既定）は紹介文を上、場所・日時を下に離して置く。
	 * 'compact' は間を空けず、画像の上寄りにまとめる。
	 */
	textLayout?: 'spread' | 'compact';
	/** loadMedia() で作った画像。undefined なら「画像準備中」の枠にする。 */
	media?: string | undefined;
}

/**
 * 画像を取得し、width x height に切り抜いた JPEG の data URI にする。失敗したら undefined。
 * source は https の URL、public/ 配下のパス、またはプロジェクト内の絶対パス。
 */
export async function loadMedia(
	source: string,
	{ width, height }: { width: number; height: number },
): Promise<string | undefined> {
	try {
		let buffer: Buffer;
		if (/^https?:\/\//.test(source)) {
			const res = await fetch(source, {
				headers: { 'User-Agent': 'OpenAI File Downloader, XaiImageApiFetch/1.0' },
				signal: AbortSignal.timeout(15_000),
			});
			if (!res.ok) throw new Error(`${res.status} ${res.statusText}`);
			buffer = Buffer.from(await res.arrayBuffer());
		} else if (source.startsWith(process.cwd())) {
			buffer = fs.readFileSync(source);
		} else {
			buffer = fs.readFileSync(path.resolve('public', source.replace(/^\//, '')));
		}
		// satori は webp を読めない（R2 には webp で入っている）ので JPEG にそろえる。2 倍で作って縮小表示する。
		const jpeg = await sharp(buffer)
			.resize({ width: width * 2, height: height * 2, fit: 'cover' })
			.jpeg({ quality: 88 })
			.toBuffer();
		return `data:image/jpeg;base64,${jpeg.toString('base64')}`;
	} catch (error) {
		console.warn(`[og] 画像を取得できませんでした (${source}):`, error);
		return undefined;
	}
}

const NAME_FONT_MAX = 62;
const NAME_FONT_MIN = 40;
const NAME_FONT_WRAPPED = 44;

/**
 * 団体名の文字サイズと折り返し幅。
 * 1 行に収まる範囲でなるべく大きくし、MIN でも収まらない長さだけ 2 行に折り返す。
 * 折り返すときは、スペースのない名前は行ごとの文字数をそろえ、最後の行に 1 文字だけ残らないようにする。
 */
function nameLayout(name: string, textWidth: number): { fontSize: number; width: number } {
	const length = [...name].length;
	const fit = Math.floor(textWidth / length);
	if (fit >= NAME_FONT_MIN) return { fontSize: Math.min(NAME_FONT_MAX, fit), width: textWidth };
	const balanced = Math.ceil(length / 2) * NAME_FONT_WRAPPED + 8;
	return { fontSize: NAME_FONT_WRAPPED, width: name.includes(' ') ? textWidth : Math.min(textWidth, balanced) };
}

/** 四隅のうち左上・右下に出すオレンジの鉤括弧。 */
function Bracket({ corner }: { corner: 'top-left' | 'bottom-right' }) {
	const line = `4px solid ${COLOR.main}`;
	const topLeft = corner === 'top-left';
	return (
		<div
			style={{
				position: 'absolute',
				display: 'flex',
				width: 32,
				height: 32,
				...(topLeft ? { top: 14, left: 14, borderTop: line, borderLeft: line } : { bottom: 14, right: 14, borderBottom: line, borderRight: line }),
			}}
		/>
	);
}

/** 背景の発光・斜めの光線。 */
function glow(style: Record<string, string | number>) {
	return <div style={{ position: 'absolute', display: 'flex', ...style }} />;
}

export async function renderOgCard(card: OgCardInput): Promise<Buffer> {
	const title = stripUnsupportedGlyphs(card.title.trim());
	const summaryLines = (Array.isArray(card.summary) ? card.summary : [card.summary.replace(/\s+/g, ' ')]).map((line) =>
		stripUnsupportedGlyphs(line.trim()),
	);
	const compact = card.textLayout === 'compact';
	const location = stripUnsupportedGlyphs(card.location.trim());
	const schedule = card.schedule.map((row) => ({
		label: stripUnsupportedGlyphs(row.label),
		value: stripUnsupportedGlyphs(row.value),
	}));
	const section = stripUnsupportedGlyphs(card.label ?? '');
	const mediaHeight = card.mediaHeight ?? MEDIA_HEIGHT;
	const placeholder = '画像準備中';
	// satori は flex 子の幅を内容に合わせて広げてしまうので、右カラムは残りの幅を明示して折り返させる。
	const textWidth = OG_WIDTH - PADDING_X * 2 - card.mediaWidth - COLUMN_GAP;

	const text = [section, placeholder, title, ...summaryLines, location, ...schedule.flatMap((row) => [row.label, row.value])].join('');
	const { fonts, family } = fontsFor(text);
	const media = card.media;
	const nameStyle = nameLayout(title, textWidth);
	const imageFrame = {
		display: 'flex',
		boxSizing: 'border-box',
		width: card.mediaWidth,
		height: mediaHeight,
		flexShrink: 0,
		borderRadius: 24,
		border: `${MEDIA_BORDER}px solid rgba(0,255,204,0.5)`,
		boxShadow: '0 0 32px rgba(0,255,204,0.35)',
		backgroundColor: COLOR.base,
		overflow: 'hidden',
	} as const;

	const svg = await satori(
		<div
			style={{
				position: 'relative',
				display: 'flex',
				width: OG_WIDTH,
				height: OG_HEIGHT,
				backgroundColor: COLOR.base,
				backgroundImage: `url("${KIKKO_TILE}")`,
				backgroundSize: '96px 55.4px',
				color: COLOR.text,
				fontFamily: family[400],
			}}
		>
			{/* 背景: 左上のシアン・右下のピンクの発光と、斜めの光線。 */}
			{glow({
				left: -180,
				top: -180,
				width: 520,
				height: 520,
				borderRadius: '50%',
				background: 'radial-gradient(circle, rgba(0,255,204,0.28) 0%, rgba(0,255,204,0) 70%)',
			})}
			{glow({
				right: -200,
				bottom: -200,
				width: 560,
				height: 560,
				borderRadius: '50%',
				background: 'radial-gradient(circle, rgba(231,56,111,0.26) 0%, rgba(231,56,111,0) 70%)',
			})}
			{glow({
				width: 1500,
				height: 4,
				top: 110,
				left: -200,
				background: 'linear-gradient(90deg, rgba(255,110,168,0) 0%, rgba(255,110,168,0.55) 50%, rgba(255,110,168,0) 100%)',
				transform: 'rotate(-7deg)',
			})}
			{glow({
				width: 1500,
				height: 4,
				bottom: 90,
				left: -250,
				background: 'linear-gradient(90deg, rgba(0,255,204,0) 0%, rgba(0,255,204,0.4) 50%, rgba(0,255,204,0) 100%)',
				transform: 'rotate(-7deg)',
			})}

			{/* 霞の雲。文字にかからないよう角に寄せて小さめに置く。 */}
			<img
				src={KASUMI_PINK}
				width={KASUMI_WIDTH}
				height={KASUMI_HEIGHT}
				style={{ position: 'absolute', right: -100, top: -10 }}
			/>
			<img
				src={KASUMI_CYAN}
				width={KASUMI_WIDTH}
				height={KASUMI_HEIGHT}
				style={{ position: 'absolute', left: -100, bottom: -10 }}
			/>

			{/* 枠と、左上・右下のオレンジの鉤括弧。 */}
			{glow({
				top: 16,
				left: 16,
				right: 16,
				bottom: 16,
				border: '2px solid rgba(232,232,232,0.3)',
			})}
			<Bracket corner="top-left" />
			<Bracket corner="bottom-right" />

			{/* 右下の茨城高専ロゴ。 */}
			<img
				src={kosenLogoDataUri}
				width={KOSEN_LOGO_WIDTH}
				height={KOSEN_LOGO_HEIGHT}
				style={{ position: 'absolute', right: 68, bottom: 50 }}
			/>

			{/* 本体。 */}
			<div
				style={{
					position: 'absolute',
					top: 0,
					left: 0,
					display: 'flex',
					flexDirection: 'column',
					width: OG_WIDTH,
					height: OG_HEIGHT,
					padding: `52px ${PADDING_X}px 0`,
				}}
			>
				<div style={{ display: 'flex', alignItems: 'center', gap: 36 }}>
					<img src={logoDataUri} width={LOGO_WIDTH} height={LOGO_HEIGHT} />
					{section && <div style={{ fontFamily: family[500], fontSize: 38, letterSpacing: '0.08em' }}>{section}</div>}
				</div>

				<div style={{ display: 'flex', flex: 1, gap: COLUMN_GAP, alignItems: 'center', paddingBottom: 48 }}>
					<div style={imageFrame}>
						{media ? (
							<img
								src={media}
								width={card.mediaWidth - MEDIA_BORDER * 2}
								height={mediaHeight - MEDIA_BORDER * 2}
							/>
						) : (
							<div
								style={{
									display: 'flex',
									alignItems: 'center',
									justifyContent: 'center',
									width: '100%',
									fontSize: 28,
									color: 'rgba(232, 232, 232, 0.6)',
								}}
							>
								{placeholder}
							</div>
						)}
					</div>

					<div
						style={{
							display: 'flex',
							flexDirection: 'column',
							width: textWidth,
							height: mediaHeight,
							justifyContent: compact ? 'flex-start' : 'space-between',
							gap: compact ? 30 : 0,
							paddingTop: compact ? 20 : 0,
							boxSizing: 'border-box',
						}}
					>
						<div style={{ display: 'flex', flexDirection: 'column', gap: 18, width: textWidth }}>
							<div style={{ fontFamily: family[500], fontSize: nameStyle.fontSize, width: nameStyle.width, lineHeight: 1.25, lineClamp: 2 }}>
								{title}
							</div>
							{Array.isArray(card.summary) ? (
								<div style={{ display: 'flex', flexDirection: 'column', width: textWidth, fontSize: 28, lineHeight: 1.55, color: 'rgba(232, 232, 232, 0.82)' }}>
									{summaryLines.map((line, index) => (
										<div key={index}>{line}</div>
									))}
								</div>
							) : (
								<div style={{ width: textWidth, fontSize: 28, lineHeight: 1.55, lineClamp: SUMMARY_LINES, color: 'rgba(232, 232, 232, 0.82)' }}>
									{summaryLines[0]}
								</div>
							)}
						</div>

						<div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
							<div style={{ display: 'flex', alignItems: 'center', gap: 14, fontSize: 36 }}>
								<img src={PIN_ICON} width={36} height={36} />
								<div style={{ lineClamp: 1 }}>{location}</div>
							</div>
							<div style={{ display: 'flex', alignItems: 'flex-start', gap: 14, fontSize: 28 }}>
								<img src={CLOCK_ICON} width={34} height={34} style={{ marginTop: 2 }} />
								<div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
									{schedule.map((row) => (
										<div key={row.label} style={{ display: 'flex', gap: 16 }}>
											<div style={{ color: 'rgba(232, 232, 232, 0.7)' }}>{row.label}</div>
											<div>{row.value}</div>
										</div>
									))}
								</div>
							</div>
						</div>
					</div>
				</div>
			</div>
		</div>,
		{ width: OG_WIDTH, height: OG_HEIGHT, fonts },
	);

	// SNS のクローラは大きい PNG を嫌うことがあるので、写真向きの JPEG にする。
	return sharp(Buffer.from(svg)).jpeg({ quality: 90 }).toBuffer();
}
