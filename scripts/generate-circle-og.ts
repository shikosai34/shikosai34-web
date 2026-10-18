/**
 * サークル個別ページ用の OGP 画像（public/og/circle/{slug}.jpg）を事前に作る。
 *
 * ビルドのたびに作ると 63 枚で 15〜25 秒かかるため、生成済みの JPEG をリポジトリに置く方式にしている。
 * サークルの画像を差し替えない前提なので、作るのは次の2つのときだけ。
 *   - 新しいサークルが増えたとき: 引数なしで実行。まだ JPEG が無いサークルの分だけ作る。
 *   - デザイン（lib/og-image.ts）を変えたとき: --force で全部作り直す。
 * 作った JPEG はコミットする。画像が未提出のサークルは作らない（Layout が共通の /ogp.jpg を使う）。
 *
 * 画像の右下には、茨城高専ロゴの上にサークル名を載せる。
 *
 *   bun run og:circles            # 無いものだけ
 *   bun run og:circles --force    # 全部作り直す
 *   bun run og:circles 1-3 1-4    # 指定したサークルだけ作り直す
 */
import fs from 'node:fs';
import path from 'node:path';
// Bun.YAML は `name: 1-2` を数値の 1 と読んでしまうので、コンテンツを読む Astro と同じ js-yaml を使う。
import yaml from 'js-yaml';
import { renderOgImage } from '../src/lib/og-image';

const CIRCLES_DIR = path.resolve('content/circles');
const OUT_DIR = path.resolve('public/og/circle');

// 既定の見た目から外れるサークルだけ、ここで個別に指定する。
//   nameLines: 名前の改行位置（1 行ずつ並べる）。文字サイズは円に掛からない最大に自動で決まる
//   imageScale: 円の中の画像を、円いっぱい（1）より小さくする（画像の文字が円で切れるとき）
const OVERRIDES: Record<string, { nameLines?: string[]; imageScale?: number }> = {
	'1-1': { nameLines: ['メイド喫茶', 'こうせん通り'] },
	'1-4': { nameLines: ['SMILE', 'CHARGE'] },
	'2-1': { nameLines: ['とりあえず、', '揚げてみた'] },
	'3i': { nameLines: ['3I POP-UP store', '~パフェ＆モクテル~'] },
	'3m1': { nameLines: ['オノデラックス', '焼きそば'] },
	'4c': { nameLines: ['ひできパパの', 'ベビーカステラ'] },
	'4i': { nameLines: ['およげ!', 'まつざきくん'] },
	am2: { nameLines: ['ネコミミ', 'メイドラーメン'] },
	'model-rocket': { nameLines: ['モデルロケット', '打ち上げ隊'] },
	'tea-time-seminar-doukoukai': { nameLines: ['ティータイム', 'セミナー同好会'] },
};

const args = process.argv.slice(2);
const force = args.includes('--force');
const only = new Set(args.filter((arg) => !arg.startsWith('--')));

function readFrontmatter(file: string): { name?: string; image?: string } {
	const source = fs.readFileSync(path.join(CIRCLES_DIR, file), 'utf8');
	const frontmatter = source.match(/^---\r?\n([\s\S]*?)\r?\n---/)?.[1];
	return frontmatter ? (yaml.load(frontmatter) as Record<string, string>) : {};
}

fs.mkdirSync(OUT_DIR, { recursive: true });

let created = 0;
let skipped = 0;
const failed: string[] = [];

for (const file of fs.readdirSync(CIRCLES_DIR).filter((name) => name.endsWith('.md') && !name.startsWith('_'))) {
	// URL の識別子はファイル名（content.config.ts のとおり、slug 未指定ならファイル名）。
	const slug = path.basename(file, '.md');
	if (only.size > 0 && !only.has(slug)) continue;

	const { name, image: imageUrl } = readFrontmatter(file);
	if (!imageUrl) {
		console.log(`- ${slug}: 画像が未提出なのでスキップ（共通の /ogp.jpg を使う）`);
		skipped++;
		continue;
	}

	const out = path.join(OUT_DIR, `${slug}.jpg`);
	if (!force && only.size === 0 && fs.existsSync(out)) {
		skipped++;
		continue;
	}

	try {
		fs.writeFileSync(out, await renderOgImage({ circleImageUrl: imageUrl, pageName: name, ...OVERRIDES[slug] }));
		console.log(`✓ ${slug}`);
		created++;
	} catch (error) {
		console.error(`✗ ${slug}: ${imageUrl}`, error);
		failed.push(slug);
	}
}

console.log(`\n作成 ${created} 枚 / スキップ ${skipped} 枚 / 失敗 ${failed.length} 枚`);
if (failed.length > 0) {
	console.error(`失敗: ${failed.join(', ')}`);
	process.exit(1);
}
