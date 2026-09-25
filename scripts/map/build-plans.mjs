/**
 * 会場マップの平面図を作る。
 *
 * scripts/map/svg/*.svg（第33回サイトの各館の図面）から壁を拾い、
 * 壁に囲まれた領域を部屋として切り出して public/map/plans/<file>.json に書き出す。
 * 部屋の名前・部屋キーは scripts/map/labels/<file>.json で与える（図面の文字はアウトライン化されていて読めないため）。
 *
 * あわせて次を生成する。
 * - src/data/map-rooms.json … 部屋キーの一覧（ビルド時の検証とテキストの配置一覧に使う）
 * - public/admin/config.yml の「マップ上の場所」の選択肢（GENERATED の目印の間）
 *
 * 実行: bun scripts/map/build-plans.mjs
 * 確認用の図: DEBUG_ROOMS=1 bun scripts/map/build-plans.mjs → /tmp/map-debug/<file>.svg
 */
import fs from 'node:fs';
import path from 'node:path';
import * as turf from '@turf/turf';

const ROOT = path.resolve(import.meta.dirname, '../..');
const SVG_DIR = path.join(ROOT, 'scripts/map/svg');
const LABELS_DIR = path.join(ROOT, 'scripts/map/labels');
const OUTDOOR_FILE = path.join(ROOT, 'scripts/map/outdoor.json');
const PLANS_DIR = path.join(ROOT, 'public/map/plans');
const ROOMS_FILE = path.join(ROOT, 'src/data/map-rooms.json');
const CMS_CONFIG = path.join(ROOT, 'public/admin/config.yml');
const DEBUG_DIR = '/tmp/map-debug';

/**
 * 図面ごとの設定。yBoundaries は各階を分ける SVG 上の y 座標（上から順）。
 * 図面は上の階ほど上に描かれているので、いちばん上の帯が最上階になる。
 * building は public/map/buildings.geojson の name と一致させる（3D の建物と結びつけるため）。
 */
const CONFIG = {
	bldg1: { building: '1号館', yBoundaries: [310, 540] },
	'bldg2-3': { building: '2・3号館', yBoundaries: [320, 560] },
	bldg4: { building: '4号館', yBoundaries: [258, 425] },
	bldg5: { building: '5号館', yBoundaries: [230] },
	bldg8: { building: '8号館', yBoundaries: [300, 600] },
	library: { building: '図書館棟', yBoundaries: [290] },
};

// ---------------------------------------------------------------------------
// SVG から壁を拾う
// ---------------------------------------------------------------------------

/** path の d（絶対座標の M/L/H/V/Z のみ）を点列の配列（サブパスごと）にする。曲線を含むものは null。 */
function parsePath(d) {
	if (/[CQSATcqsatmlhvz]/.test(d.replace(/[Zz]/g, ''))) return null;
	const subpaths = [];
	let cur = [0, 0];
	let pts = null;
	for (const [, cmd, rest] of d.matchAll(/([MLHVZ])([^MLHVZ]*)/g)) {
		const a = rest.trim().split(/[\s,]+/).filter(Boolean).map(Number);
		if (cmd === 'M') {
			cur = [a[0], a[1]];
			pts = [cur];
			subpaths.push(pts);
			// M の後に続く座標は L とみなす
			for (let i = 2; i + 1 < a.length; i += 2) pts.push((cur = [a[i], a[i + 1]]));
		} else if (cmd === 'L') {
			for (let i = 0; i + 1 < a.length; i += 2) pts.push((cur = [a[i], a[i + 1]]));
		} else if (cmd === 'H') {
			for (const x of a) pts.push((cur = [x, cur[1]]));
		} else if (cmd === 'V') {
			for (const y of a) pts.push((cur = [cur[0], y]));
		} else if (cmd === 'Z' && pts) {
			pts.push(pts[0]);
		}
	}
	return subpaths;
}

const attr = (tag, name) => tag.match(new RegExp(`\\s${name}="([^"]*)"`))?.[1];

/**
 * 壁を SVG 座標の矩形 [x0, y0, x1, y1] の配列として取り出す。
 * - 塗りの細長い path（2・3・5・8号館、図書館棟）は外接矩形をそのまま壁にする
 * - 線で描いた path / line（1・4号館）は線分を線幅ぶん太らせた矩形にする
 */
function extractWallRects(svg) {
	const rects = [];
	// 継ぎ目の微小な隙間から隣の部屋へ漏れないよう少し膨らませる
	const e = 0.3;
	const push = (r) => rects.push([r[0] - e, r[1] - e, r[2] + e, r[3] + e]);

	for (const [tag] of svg.matchAll(/<(?:path|line)\b[^>]*>/g)) {
		const fill = attr(tag, 'fill');
		const stroke = attr(tag, 'stroke');
		if (fill === 'white' || stroke === 'white') continue;

		let subpaths;
		if (tag.startsWith('<line')) {
			const [x1, y1, x2, y2] = ['x1', 'y1', 'x2', 'y2'].map((k) => Number(attr(tag, k)));
			subpaths = [[[x1, y1], [x2, y2]]];
		} else {
			subpaths = parsePath(attr(tag, 'd') ?? '');
			if (!subpaths) continue;
		}

		if (stroke && stroke !== 'none' && (!fill || fill === 'none')) {
			// 線で描いた壁
			const hw = Number(attr(tag, 'stroke-width') ?? 1) / 2;
			for (const pts of subpaths) {
				for (let i = 0; i + 1 < pts.length; i++) {
					const [p, q] = [pts[i], pts[i + 1]];
					// 斜めの線（矢印など）は壁ではない
					if (Math.abs(p[0] - q[0]) > 0.5 && Math.abs(p[1] - q[1]) > 0.5) continue;
					if (Math.hypot(q[0] - p[0], q[1] - p[1]) < 2) continue;
					push([Math.min(p[0], q[0]) - hw, Math.min(p[1], q[1]) - hw, Math.max(p[0], q[0]) + hw, Math.max(p[1], q[1]) + hw]);
				}
			}
		} else {
			// 塗りの細長い矩形の壁
			const pts = subpaths.flat();
			if (pts.length < 2) continue;
			const xs = pts.map((p) => p[0]);
			const ys = pts.map((p) => p[1]);
			const r = [Math.min(...xs), Math.min(...ys), Math.max(...xs), Math.max(...ys)];
			if (Math.min(r[2] - r[0], r[3] - r[1]) > 3) continue; // 壁は厚さ3px以下
			push(r);
		}
	}
	return rects;
}

// ---------------------------------------------------------------------------
// 壁に囲まれた領域（部屋）を求める
// ---------------------------------------------------------------------------

/** 壁の座標で区切ったグリッド上で塗りつぶし、外に抜けない領域を部屋として返す */
function findRooms(rects) {
	const uniq = (arr) => [...new Set(arr)].sort((a, b) => a - b);
	const all = rects.flat();
	const xs = uniq([...rects.flatMap((r) => [r[0], r[2]]), Math.min(...all) - 10, Math.max(...all) + 10]);
	const ys = uniq([...rects.flatMap((r) => [r[1], r[3]]), Math.min(...all) - 10, Math.max(...all) + 10]);
	const nx = xs.length - 1;
	const ny = ys.length - 1;
	const xi = new Map(xs.map((v, i) => [v, i]));
	const yi = new Map(ys.map((v, i) => [v, i]));
	const wall = new Uint8Array(nx * ny);
	for (const r of rects) {
		for (let i = xi.get(r[0]); xs[i] < r[2]; i++) for (let j = yi.get(r[1]); ys[j] < r[3]; j++) wall[j * nx + i] = 1;
	}

	const seen = new Uint8Array(nx * ny);
	const rooms = [];
	for (let start = 0; start < nx * ny; start++) {
		if (wall[start] || seen[start]) continue;
		const cells = [];
		let touchesBorder = false;
		const stack = [start];
		seen[start] = 1;
		while (stack.length) {
			const c = stack.pop();
			const i = c % nx;
			const j = (c - i) / nx;
			cells.push([i, j]);
			if (i === 0 || j === 0 || i === nx - 1 || j === ny - 1) touchesBorder = true;
			for (const [a, b] of [[i - 1, j], [i + 1, j], [i, j - 1], [i, j + 1]]) {
				if (a < 0 || b < 0 || a >= nx || b >= ny) continue;
				const n = b * nx + a;
				if (!wall[n] && !seen[n]) {
					seen[n] = 1;
					stack.push(n);
				}
			}
		}
		if (touchesBorder) continue; // 建物の外

		let area = 0;
		let bbox = [Infinity, Infinity, -Infinity, -Infinity];
		for (const [i, j] of cells) {
			area += (xs[i + 1] - xs[i]) * (ys[j + 1] - ys[j]);
			bbox = [Math.min(bbox[0], xs[i]), Math.min(bbox[1], ys[j]), Math.max(bbox[2], xs[i + 1]), Math.max(bbox[3], ys[j + 1])];
		}
		// 二重壁の間の細い隙間などは除外
		if (area < 40 || Math.min(bbox[2] - bbox[0], bbox[3] - bbox[1]) < 4) continue;

		// セルを行ごとの帯にまとめてから結合し、部屋の輪郭にする
		let ring;
		if (Math.abs(area - (bbox[2] - bbox[0]) * (bbox[3] - bbox[1])) < 1e-6) {
			ring = turf.bboxPolygon(bbox).geometry.coordinates[0];
		} else {
			const byRow = {};
			for (const [i, j] of cells) (byRow[j] ||= []).push(i);
			const strips = [];
			for (const [j, is] of Object.entries(byRow)) {
				is.sort((a, b) => a - b);
				let s0 = is[0];
				for (let k = 1; k <= is.length; k++) {
					if (k === is.length || is[k] !== is[k - 1] + 1) {
						strips.push(turf.bboxPolygon([xs[s0], ys[+j], xs[is[k - 1] + 1], ys[+j + 1]]));
						s0 = is[k];
					}
				}
			}
			const merged = strips.length === 1 ? strips[0] : turf.union(turf.featureCollection(strips));
			const g = merged.geometry;
			// 結合しきれず MultiPolygon になった場合は最大の片を使う
			ring = g.type === 'Polygon' ? g.coordinates[0] : g.coordinates.map((p) => p[0]).sort((a, b) => turf.area(turf.polygon([b])) - turf.area(turf.polygon([a])))[0];
		}
		const cellSet = new Set(cells.map(([i, j]) => j * nx + i));
		rooms.push({
			ring,
			bbox,
			area,
			contains: ([x, y]) => {
				const i = xs.findIndex((v, k) => v <= x && x < xs[k + 1]);
				const j = ys.findIndex((v, k) => v <= y && y < ys[k + 1]);
				return i >= 0 && j >= 0 && cellSet.has(j * nx + i);
			},
		});
	}
	return rooms;
}

// ---------------------------------------------------------------------------
// 出力
// ---------------------------------------------------------------------------

const round = (v) => Math.round(v * 100) / 100;
const debug = !!process.env.DEBUG_ROOMS;
if (debug) fs.mkdirSync(DEBUG_DIR, { recursive: true });
fs.mkdirSync(PLANS_DIR, { recursive: true });

/** src/data/map-rooms.json に載せる部屋（部屋キーを持つもの） */
const roomIndex = [];
let problems = 0;

for (const [file, info] of Object.entries(CONFIG)) {
	const svg = fs.readFileSync(path.join(SVG_DIR, `${file}.svg`), 'utf-8');
	const labelsPath = path.join(LABELS_DIR, `${file}.json`);
	const labelFile = fs.existsSync(labelsPath) ? JSON.parse(fs.readFileSync(labelsPath, 'utf-8')) : {};
	const labels = labelFile.rooms ?? [];

	const wallRects = extractWallRects(svg);
	const allRooms = findRooms(wallRects);
	const bounds = [-Infinity, ...info.yBoundaries, Infinity];
	const floorCount = bounds.length - 1;
	const floorOfY = (y) => {
		const i = bounds.findIndex((b, k) => y > b && y <= bounds[k + 1]);
		return floorCount - i;
	};

	const floors = [];
	for (let floor = 1; floor <= floorCount; floor++) {
		const rooms = allRooms.filter((r) => floorOfY((r.bbox[1] + r.bbox[3]) / 2) === floor);
		if (rooms.length === 0) continue;
		// 各階の範囲は部屋の外接矩形に外壁の厚みを足したもの（範囲外の矢印などは捨てる）
		const bbox = [
			Math.min(...rooms.map((r) => r.bbox[0])) - 1.5,
			Math.min(...rooms.map((r) => r.bbox[1])) - 1.5,
			Math.max(...rooms.map((r) => r.bbox[2])) + 1.5,
			Math.max(...rooms.map((r) => r.bbox[3])) + 1.5,
		];
		const inBox = (r) => r[0] >= bbox[0] - 1 && r[2] <= bbox[2] + 1 && r[1] >= bbox[1] - 1 && r[3] <= bbox[3] + 1;
		floors.push({ floor, bbox: bbox.map(round), walls: wallRects.filter(inBox).map((r) => r.map(round)), rooms: [], markers: [], rawRooms: rooms });
	}

	const usedLabels = new Set();
	for (const f of floors) {
		f.rawRooms.forEach((room, n) => {
			const label = labels.find((l) => room.contains(l.at));
			if (label) {
				if (usedLabels.has(label)) {
					console.warn(`  ⚠ ${info.building}: ラベル「${label.name}」が複数の部屋に当たっています`);
					problems++;
				}
				usedLabels.add(label);
			}
			const key = label?.key ?? null;
			f.rooms.push({
				id: key ?? `${file}-${f.floor}-${n}`,
				key,
				number: label?.number ?? null,
				name: label?.name ?? null,
				kind: label?.kind ?? 'room',
				points: room.ring.slice(0, -1).map((p) => p.map(round)),
				bbox: room.bbox.map(round),
			});
			if (key) roomIndex.push({ key, building: info.building, floor: f.floor, number: label.number ?? null, name: label.name, plan: file });
		});
		delete f.rawRooms;
	}

	// 階段・入口などの目印（その点を範囲に含む階に置く）
	for (const m of labelFile.markers ?? []) {
		const f = floors.find((f) => m.at[0] >= f.bbox[0] && m.at[0] <= f.bbox[2] && m.at[1] >= f.bbox[1] && m.at[1] <= f.bbox[3]);
		if (f) f.markers.push(m);
		else {
			console.warn(`  ⚠ ${info.building}: 目印 (${m.at}) がどの階の範囲にも入っていません`);
			problems++;
		}
	}
	for (const l of labels.filter((l) => !usedLabels.has(l))) {
		console.warn(`  ⚠ ${info.building}: ラベル「${l.name}」(${l.at}) に対応する部屋が見つかりません`);
		problems++;
	}

	const plan = { building: info.building, floors };
	fs.writeFileSync(path.join(PLANS_DIR, `${file}.json`), JSON.stringify(plan));
	const total = floors.reduce((n, f) => n + f.rooms.length, 0);
	console.log(`${info.building}: ${floors.map((f) => `${f.floor}F ${f.rooms.length}室`).join(' / ')}（名前付き ${usedLabels.size}/${total}）`);

	if (debug) {
		// 元の図面に抽出した部屋を重ね、部屋ごとに中心の座標を書いたもの（ラベル付け用）
		const overlay = floors.flatMap((f) =>
			f.rooms.map((r, i) => {
				const hue = (i * 137) % 360;
				const cx = round((r.bbox[0] + r.bbox[2]) / 2);
				const cy = round((r.bbox[1] + r.bbox[3]) / 2);
				return `<path d="M${r.points.map((p) => p.join(' ')).join('L')}Z" fill="hsla(${hue},80%,55%,0.35)" stroke="hsl(${hue},80%,40%)" stroke-width="0.5"/><text x="${cx}" y="${cy}" font-size="5" text-anchor="middle" fill="${r.key ? '#060' : '#c00'}">${r.key ?? `${Math.round(cx)},${Math.round(cy)}`}</text>`;
			}),
		);
		const bands = info.yBoundaries.map((y) => `<line x1="0" x2="596" y1="${y}" y2="${y}" stroke="blue" stroke-dasharray="4 2"/>`);
		fs.writeFileSync(path.join(DEBUG_DIR, `${file}.svg`), svg.replace('</svg>', `${[...overlay, ...bands].join('\n')}\n</svg>`));
	}
}

// 屋外の場所（図面を持たず、3D 上のピンで示す）
if (fs.existsSync(OUTDOOR_FILE)) {
	for (const o of JSON.parse(fs.readFileSync(OUTDOOR_FILE, 'utf-8')).places ?? []) {
		roomIndex.push({ key: o.key, building: o.building ?? '屋外', floor: null, number: null, name: o.name, plan: null });
	}
}

// 館 → 階 → 部屋番号の順に並べる（CMS の選択肢とテキストの配置一覧の順になる）
const planOrder = Object.keys(CONFIG);
const orderOf = (r) => (r.plan ? planOrder.indexOf(r.plan) : planOrder.length);
roomIndex.sort((a, b) => orderOf(a) - orderOf(b) || (a.floor ?? 0) - (b.floor ?? 0) || (a.number ? 0 : 1) - (b.number ? 0 : 1) || (a.number ?? '').localeCompare(b.number ?? '') || a.name.localeCompare(b.name, 'ja'));

const dupes = roomIndex.map((r) => r.key).filter((k, i, a) => a.indexOf(k) !== i);
if (dupes.length) {
	console.warn(`⚠ 部屋キーが重複しています: ${[...new Set(dupes)].join(', ')}`);
	problems++;
}

fs.mkdirSync(path.dirname(ROOMS_FILE), { recursive: true });
fs.writeFileSync(ROOMS_FILE, `${JSON.stringify(roomIndex, null, '\t')}\n`);

// CMS の選択肢を書き換える
const START = '# >>> GENERATED: map-rooms (bun scripts/map/build-plans.mjs)';
const END = '# <<< GENERATED: map-rooms';
const cms = fs.readFileSync(CMS_CONFIG, 'utf-8');
const startAt = cms.indexOf(START);
const endAt = cms.indexOf(END);
if (startAt >= 0 && endAt > startAt) {
	const indent = cms.slice(cms.lastIndexOf('\n', startAt) + 1, startAt);
	const q = (s) => `'${s.replaceAll("'", "''")}'`;
	const lines = roomIndex.map((r) => {
		const label = [r.building, r.floor ? `${r.floor}F` : null, r.number, r.name === r.building ? null : r.name].filter(Boolean).join(' ');
		return `${indent}- { label: ${q(label)}, value: ${q(r.key)} }`;
	});
	const next = `${cms.slice(0, startAt)}${START}\n${lines.join('\n')}\n${indent}${cms.slice(endAt)}`;
	if (next !== cms) fs.writeFileSync(CMS_CONFIG, next);
} else {
	console.warn('⚠ public/admin/config.yml に GENERATED の目印がないため、CMS の選択肢は更新していません');
}

console.log(`\n部屋キー ${roomIndex.length} 件を書き出しました。`);
if (problems) {
	console.warn(`⚠ 問題 ${problems} 件`);
	process.exitCode = 1;
}
