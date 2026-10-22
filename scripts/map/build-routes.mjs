/**
 * 動線・立入禁止区域を、実際の地図の座標（経緯度）に直して public/map/routes.json に書き出す。
 *
 * scripts/map/routes.json は、配布された動線の図（画像）の中のピクセル座標で書いてある。
 * calibration に挙げた建物（図の中の中心のピクセル）と、public/map/campus.geojson の同じ建物の
 * 中心を最小二乗で合わせ、画像の座標 → 経緯度のアフィン変換を求める。
 *
 * 実行: bun scripts/map/build-routes.mjs（先に build-campus.mjs）
 */
import fs from 'node:fs';
import path from 'node:path';

const ROOT = path.resolve(import.meta.dirname, '../..');
const SOURCE = path.join(ROOT, 'scripts/map/routes.json');
const CAMPUS = path.join(ROOT, 'public/map/campus.geojson');
const OUT = path.join(ROOT, 'public/map/routes.json');

const CENTER = [140.5509, 36.4002]; // src/lib/map.ts の MAP_CENTER と揃える
const M_PER_DEG_LAT = 110950;
const M_PER_DEG_LON = 111320 * Math.cos((CENTER[1] * Math.PI) / 180);
const toPlane = ([lon, lat]) => [(lon - CENTER[0]) * M_PER_DEG_LON, (lat - CENTER[1]) * M_PER_DEG_LAT];
const toLonLat = ([e, n]) => [CENTER[0] + e / M_PER_DEG_LON, CENTER[1] + n / M_PER_DEG_LAT];
const round = (v) => Math.round(v * 1e7) / 1e7;

const source = JSON.parse(fs.readFileSync(SOURCE, 'utf-8'));
const campus = JSON.parse(fs.readFileSync(CAMPUS, 'utf-8'));

// 建物の中心（平面の m）
const centers = {};
for (const f of campus.features) {
	const name = f.properties.name;
	if (f.properties.kind !== 'building' || !name || centers[name]) continue;
	const ring = f.geometry.coordinates[0].slice(0, -1).map(toPlane);
	centers[name] = [ring.reduce((a, p) => a + p[0], 0) / ring.length, ring.reduce((a, p) => a + p[1], 0) / ring.length];
}

// 画像 (x, y) → 平面 (E, N) のアフィン変換を最小二乗で求める。E = a·x + b·y + c、N = d·x + e·y + f
function solve3(A, b) {
	// 3×3 の連立方程式（ガウスの消去法）
	const M = A.map((row, i) => [...row, b[i]]);
	for (let i = 0; i < 3; i++) {
		let p = i;
		for (let r = i + 1; r < 3; r++) if (Math.abs(M[r][i]) > Math.abs(M[p][i])) p = r;
		[M[i], M[p]] = [M[p], M[i]];
		for (let r = i + 1; r < 3; r++) {
			const k = M[r][i] / M[i][i];
			for (let c = i; c < 4; c++) M[r][c] -= k * M[i][c];
		}
	}
	const x = [0, 0, 0];
	for (let i = 2; i >= 0; i--) x[i] = (M[i][3] - M[i].slice(i + 1, 3).reduce((s, v, j) => s + v * x[i + 1 + j], 0)) / M[i][i];
	return x;
}

/** 画像 (x, y) → 平面 (E, N) のアフィン変換を最小二乗で求める。pairs は [{ px: [x, y], plane: [E, N] }] */
function affineFit(pairs) {
	const normal = [[0, 0, 0], [0, 0, 0], [0, 0, 0]];
	const rhsE = [0, 0, 0];
	const rhsN = [0, 0, 0];
	for (const { px: [x, y], plane: [e, n] } of pairs) {
		const v = [x, y, 1];
		for (let i = 0; i < 3; i++) {
			for (let j = 0; j < 3; j++) normal[i][j] += v[i] * v[j];
			rhsE[i] += v[i] * e;
			rhsN[i] += v[i] * n;
		}
	}
	const [ae, be, ce] = solve3(normal, rhsE);
	const [an, bn, cn] = solve3(normal, rhsN);
	const apply = ([x, y]) => [ae * x + be * y + ce, an * x + bn * y + cn];
	return { apply, residuals: pairs.map(({ px, plane }) => Math.hypot(...apply(px).map((v, i) => v - plane[i]))) };
}

const pairs = Object.entries(source.calibration).map(([name, px]) => {
	if (!centers[name]) throw new Error(`calibration の建物「${name}」が campus.geojson にありません`);
	return { px, plane: centers[name] };
});
const fitRoutes = affineFit(pairs);
const toGeo = (px) => toLonLat(fitRoutes.apply(px)).map(round);

console.log(`位置合わせの誤差（m）: ${fitRoutes.residuals.map((r) => r.toFixed(1)).join(', ')}`);
if (Math.max(...fitRoutes.residuals) > 12) console.warn('⚠ 位置合わせの誤差が大きい建物があります（calibration の座標を見直してください）');

// 消防用出展マップ（確定版）の消化器設置場所。グラウンドのテント（G-1〜G-33）の位置を基準に、図の画像 → 地図を合わせる
const safety = JSON.parse(fs.readFileSync(path.join(ROOT, 'scripts/map/safety.json'), 'utf-8'));
const rooms = JSON.parse(fs.readFileSync(path.join(ROOT, 'src/data/map-rooms.json'), 'utf-8'));
const tentPairs = Object.entries(safety.tents).map(([key, px]) => {
	const room = rooms.find((r) => r.key === key);
	if (!room?.at) throw new Error(`消防用出展マップのテント「${key}」が src/data/map-rooms.json にありません（先に build-plans.mjs）`);
	return { px, plane: toPlane(room.at) };
});
const fitTents = affineFit(tentPairs);
console.log(`消防用出展マップの位置合わせの誤差（m）: 平均 ${(fitTents.residuals.reduce((a, b) => a + b, 0) / fitTents.residuals.length).toFixed(1)}、最大 ${Math.max(...fitTents.residuals).toFixed(1)}`);
const toGeoSafety = (px) => toLonLat(fitTents.apply(px)).map(round);
const extinguishers = (safety.extinguishers ?? []).map((px) => ({ kind: 'extinguisher', weather: safety.weather, at: toGeoSafety(px) }));

const out = {
	legend: source.legend,
	routes: source.routes.map((r) => ({ id: r.id, kind: r.kind, weather: r.weather, arrow: r.arrow !== false, points: r.points.map(toGeo) })),
	markers: [...source.markers.map((m) => ({ kind: m.kind, weather: m.weather, name: m.name, at: toGeo(m.at) })), ...extinguishers],
	restricted: (source.restricted ?? []).map((a) => ({ id: a.id, name: a.name, weather: a.weather, points: a.points.map(toGeo) })),
};
fs.writeFileSync(OUT, `${JSON.stringify(out)}\n`);
console.log(`public/map/routes.json: 動線 ${out.routes.length} 本、目印 ${out.markers.length}（うち消火器 ${extinguishers.length}）、立入禁止区域 ${out.restricted.length}`);
