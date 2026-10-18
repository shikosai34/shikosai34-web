/**
 * サークル個別ページ用の OGP 画像（public/og/circle/{slug}.png）を事前に作る。
 *
 * ビルドのたびに作ると 63 枚で 15〜25 秒かかるため、生成済みの PNG をリポジトリに置く方式にしている。
 * サークルの画像を差し替えない前提なので、作るのは次の2つのときだけ。
 *   - 新しいサークルが増えたとき: 引数なしで実行。まだ PNG が無いサークルの分だけ作る。
 *   - デザイン（lib/og-image.ts）を変えたとき: --force で全部作り直す。
 * 作った PNG はコミットする。画像が未提出のサークルは作らない（Layout が共通の /ogp.png を使う）。
 *
 *   bun run og:circles            # 無いものだけ
 *   bun run og:circles --force    # 全部作り直す
 *   bun run og:circles 1-3 1-4    # 指定したサークルだけ作り直す
 */
import fs from 'node:fs';
import path from 'node:path';
import { renderOgImage } from '../src/lib/og-image';

const CIRCLES_DIR = path.resolve('content/circles');
const OUT_DIR = path.resolve('public/og/circle');

const args = process.argv.slice(2);
const force = args.includes('--force');
const only = new Set(args.filter((arg) => !arg.startsWith('--')));

function readImageUrl(file: string): string | undefined {
	const source = fs.readFileSync(path.join(CIRCLES_DIR, file), 'utf8');
	const frontmatter = source.match(/^---\r?\n([\s\S]*?)\r?\n---/)?.[1];
	if (!frontmatter) return undefined;
	const data = Bun.YAML.parse(frontmatter) as { image?: string };
	return data.image || undefined;
}

fs.mkdirSync(OUT_DIR, { recursive: true });

let created = 0;
let skipped = 0;
const failed: string[] = [];

for (const file of fs.readdirSync(CIRCLES_DIR).filter((name) => name.endsWith('.md') && !name.startsWith('_'))) {
	// URL の識別子はファイル名（content.config.ts のとおり、slug 未指定ならファイル名）。
	const slug = path.basename(file, '.md');
	if (only.size > 0 && !only.has(slug)) continue;

	const imageUrl = readImageUrl(file);
	if (!imageUrl) {
		console.log(`- ${slug}: 画像が未提出なのでスキップ（共通の /ogp.png を使う）`);
		skipped++;
		continue;
	}

	const out = path.join(OUT_DIR, `${slug}.png`);
	if (!force && only.size === 0 && fs.existsSync(out)) {
		skipped++;
		continue;
	}

	try {
		fs.writeFileSync(out, await renderOgImage({ circleImageUrl: imageUrl }));
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
