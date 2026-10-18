import path from 'node:path';
import { loadMedia, renderOgCard } from './card';

/**
 * トップページと固定ページ用の OGP 画像。サークルと同じカードに、ポスター・題名・開催日時を載せる。
 * 開催情報は src/lib/poster.ts の posterAlt（ポスターの記載）に合わせている。
 */

// src/lib/poster.ts が掲げているポスターと同じ原稿（5000x7074）。差し替えるときは両方そろえる。
const POSTER_PATH = path.resolve('src/assets/poster/sokuhou/01-poster.png');
// ヘッダーと下の余白を除いた高さいっぱいまで大きく出す。
const POSTER_HEIGHT = 440;
const POSTER_WIDTH = Math.round(POSTER_HEIGHT * (5000 / 7074));

/** ポスター + 題名・説明 + 場所・日時のカード。summary は配列なら 1 要素 1 行。 */
export async function renderPosterOgImage({ title, summary }: { title: string; summary: string | string[] }): Promise<Buffer> {
	return renderOgCard({
		title,
		summary,
		location: '茨城工業高等専門学校',
		schedule: [
			{ label: '10/24（土）', value: '9:00〜17:00' },
			{ label: '10/25（日）', value: '学内限定' },
		],
		mediaWidth: POSTER_WIDTH,
		mediaHeight: POSTER_HEIGHT,
		textLayout: 'compact',
		media: await loadMedia(POSTER_PATH, { width: POSTER_WIDTH, height: POSTER_HEIGHT }),
	});
}

export const renderHomeOgImage = () =>
	renderPosterOgImage({
		title: 'テーマ「守破離」',
		summary: ['和風×サイバーパンクの新しい文化祭を', 'お届けします。一般公開は10月24日（土）。'],
	});
