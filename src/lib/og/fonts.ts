import fs from 'node:fs';
import path from 'node:path';

/**
 * OGP 画像（satori）に渡す Kiwi Maru。
 *
 * satori は woff2 を読めず、日本語フォントは 1 ファイルが数 MB になる。
 * そこで `@fontsource/kiwi-maru` が配っている unicode-range ごとの分割 woff から、
 * 画像に載せる文字を含むスライスだけを選んで渡す。
 * satori は同じ名前・太さのフォントを複数渡しても 1 つしか使わないので、
 * スライスごとに別名を付け、font-family に並べてフォールバックさせる。
 */

const FONTSOURCE_DIR = path.resolve('node_modules/@fontsource/kiwi-maru');

export type FontWeight = 400 | 500;

interface FontSlice {
	name: string;
	file: string;
	weight: FontWeight;
	ranges: [number, number][];
}

let slices: FontSlice[] | undefined;
const sliceData = new Map<string, Buffer>();

/** 400.css / 500.css の @font-face から、スライスごとのファイル名と unicode-range を読む。 */
function loadSlices(): FontSlice[] {
	slices ??= ([400, 500] as const).flatMap((weight) => {
		const css = fs.readFileSync(path.join(FONTSOURCE_DIR, `${weight}.css`), 'utf8');
		return [...css.matchAll(/@font-face\s*{[^}]*}/g)].flatMap(([block]): FontSlice[] => {
			const file = block.match(/files\/(kiwi-maru-[\w-]+\.woff)\)/)?.[1];
			const range = block.match(/unicode-range:\s*([^;]+);/)?.[1];
			if (!file || !range) return [];
			const ranges = range.split(',').map((part): [number, number] => {
				const [from, to] = part.trim().replace(/^U\+/i, '').split('-');
				return [parseInt(from!, 16), parseInt(to ?? from!, 16)];
			});
			return [{ name: file, file, weight, ranges }];
		});
	});
	return slices;
}

const inRanges = (code: number, ranges: [number, number][]) =>
	ranges.some(([from, to]) => code >= from && code <= to);

/** Kiwi Maru が持っていない文字（絵文字・♡ など）を取り除く。satori は無い字を豆腐で描くため。 */
export function stripUnsupportedGlyphs(text: string): string {
	const covered = loadSlices().filter((slice) => slice.weight === 400);
	return [...text]
		.filter((char) => {
			const code = char.codePointAt(0)!;
			return code === 0x20 || covered.some((slice) => inRanges(code, slice.ranges));
		})
		.join('');
}

export interface SatoriFont {
	name: string;
	data: Buffer;
	weight: FontWeight;
	style: 'normal';
}

export interface FontSet {
	fonts: SatoriFont[];
	/** weight ごとの font-family。satori の `fontFamily` にそのまま渡す。 */
	family: Record<FontWeight, string>;
}

/** text に含まれる文字を描くのに必要なスライスを、satori に渡す形で返す。 */
export function fontsFor(text: string): FontSet {
	const codes = [...new Set([...text].map((char) => char.codePointAt(0)!))];
	const fonts: SatoriFont[] = [];
	const family: Record<FontWeight, string[]> = { 400: [], 500: [] };

	for (const slice of loadSlices()) {
		if (!codes.some((code) => inRanges(code, slice.ranges))) continue;
		if (!sliceData.has(slice.file)) {
			sliceData.set(slice.file, fs.readFileSync(path.join(FONTSOURCE_DIR, 'files', slice.file)));
		}
		const name = `${slice.name}@${slice.weight}`;
		fonts.push({ name, data: sliceData.get(slice.file)!, weight: slice.weight, style: 'normal' });
		family[slice.weight].push(`"${name}"`);
	}

	return { fonts, family: { 400: family[400].join(', '), 500: family[500].join(', ') } };
}
