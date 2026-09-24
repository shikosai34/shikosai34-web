import { getImage } from 'astro:assets';
import posterAsset from '../assets/poster/sokuhou/01-poster.png';

/*
 * いま掲げている茨香祭速報のポスター。
 * トップの速報タイルとメニューで同じものを見せるので、差し替えはここだけで済むようにする。
 *
 * 原寸（PNG）は 14MB あるので、そのままは使わず getImage で縮めて webp にする。
 */

export const posterAlt =
	'茨香祭2026 ポスター。第34回茨香祭 テーマ「守破離」。一般公開は10月24日（土）9:00〜17:00、25日（日）は学内限定。茨城工業高等専門学校。';

/** 円で切り抜いて見せる用。トップとメニューで同じ URL になり、キャッシュが効く。 */
export function getPosterImage() {
	return getImage({ src: posterAsset, width: 800, format: 'webp' });
}

/**
 * ポスター全体を見せる用。円で切り抜く表面では四隅が欠けるため、
 * タイルを裏返した面には文字が読める大きさのものを渡す。
 */
export function getPosterFullImage() {
	return getImage({ src: posterAsset, width: 1600, format: 'webp' });
}
