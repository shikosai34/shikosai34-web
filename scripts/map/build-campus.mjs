/**
 * 3D の会場マップに敷く地面と建物のデータを作る。
 *
 * - scripts/map/overture-buildings.geojson … 建物の外形と階数（Overture Maps / OSM 由来）
 * - scripts/map/osm.json … 敷地・トラック・コート・駐車場・道路（Overpass API で取得）
 * を 1 つにまとめて public/map/campus.geojson に書き出す。各 feature の properties.kind で種類を分ける。
 *
 * 実行: bun scripts/map/build-campus.mjs
 */
import fs from 'node:fs';
import path from 'node:path';

const ROOT = path.resolve(import.meta.dirname, '../..');
const OVERTURE = path.join(ROOT, 'scripts/map/overture-buildings.geojson');
const OSM = path.join(ROOT, 'scripts/map/osm.json');
const OUT = path.join(ROOT, 'public/map/campus.geojson');

/** 地図の中心（src/lib/map.ts の MAP_CENTER と揃える）。道路はここから ROAD_RADIUS m 以内だけ残す */
const CENTER = [140.5509, 36.4002];
const ROAD_RADIUS = 380;
const M_PER_DEG_LAT = 110950;
const M_PER_DEG_LON = 111320 * Math.cos((CENTER[1] * Math.PI) / 180);
const distance = ([lon, lat]) => Math.hypot((lon - CENTER[0]) * M_PER_DEG_LON, (lat - CENTER[1]) * M_PER_DEG_LAT);

/**
 * Overture の建物名の補正。
 * 北側の「第一体育館」は重複登録で、実際の第一体育館（1号館の東）とは別の建物のため名前を外す。
 */
const RENAME_BY_INDEX = { 37: null };
/**
 * 階数が無い・誤っている建物の補正。学生便覧の建物図面に合わせる
 * （TODO: 情報センター・寄宿舎管理棟は便覧に図面がなく未確認のため仮に 2 階）
 */
const LEVELS = { '2・3号館': 3, '4号館': 4, '7号館': 3, '図書館棟': 2, '情報センター': 2, '寄宿舎管理棟': 2, '第一体育館': 3 };

const round = (v) => Math.round(v * 1e7) / 1e7;
const roundCoords = (c) => (typeof c[0] === 'number' ? c.map(round) : c.map(roundCoords));

const features = [];

// 建物・舗装面（Overture）
const overture = JSON.parse(fs.readFileSync(OVERTURE, 'utf-8'));
overture.features.forEach((f, i) => {
	const geometry = { type: f.geometry.type, coordinates: roundCoords(f.geometry.coordinates) };
	if (f.properties.type === 'land') {
		features.push({ type: 'Feature', properties: { kind: 'plaza' }, geometry });
		return;
	}
	const name = i in RENAME_BY_INDEX ? RENAME_BY_INDEX[i] : (f.properties.name ?? null);
	features.push({
		type: 'Feature',
		properties: { kind: 'building', id: `b${i}`, name, levels: (name && LEVELS[name]) ?? f.properties.levels ?? 1 },
		geometry,
	});
});

// 敷地・運動場・道路（OSM）
const osm = JSON.parse(fs.readFileSync(OSM, 'utf-8'));
for (const e of osm.elements) {
	const t = e.tags ?? {};
	const coords = (e.geometry ?? []).map((p) => [round(p.lon), round(p.lat)]);
	if (coords.length < 2) continue;
	const closed = coords.length > 3 && coords[0][0] === coords.at(-1)[0] && coords[0][1] === coords.at(-1)[1];
	const polygon = { type: 'Polygon', coordinates: [coords] };
	const line = { type: 'LineString', coordinates: coords };

	let kind = null;
	let geometry = null;
	if (t.amenity === 'college') [kind, geometry] = ['campus', polygon];
	else if (t.leisure === 'track') [kind, geometry] = ['track', closed ? polygon : line];
	else if (t.leisure === 'pitch') [kind, geometry] = ['pitch', polygon];
	else if (t.amenity === 'parking') [kind, geometry] = ['parking', polygon];
	else if (t.leisure === 'park') [kind, geometry] = ['park', polygon];
	else if (t.highway === 'service') [kind, geometry] = ['path', line];
	else if (t.highway && coords.some((c) => distance(c) < ROAD_RADIUS)) [kind, geometry] = ['road', line];
	if (kind) features.push({ type: 'Feature', properties: { kind }, geometry });
}

fs.mkdirSync(path.dirname(OUT), { recursive: true });
fs.writeFileSync(OUT, JSON.stringify({ type: 'FeatureCollection', features }));
const counts = features.reduce((m, f) => ((m[f.properties.kind] = (m[f.properties.kind] ?? 0) + 1), m), {});
console.log(`public/map/campus.geojson: ${Object.entries(counts).map(([k, v]) => `${k} ${v}`).join(', ')}`);
