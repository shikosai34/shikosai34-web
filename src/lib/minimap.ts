/**
 * サークルページのミニマップ用の図形（ビルド時に静的な SVG にする）。
 * public/map/ の平面図・キャンパスのデータを読み、SVG の座標（y は下向き）に直す。
 * ビルドでしか使わないので fs で読む（ブラウザには入らない）。
 */
import fs from 'node:fs';
import path from 'node:path';
import { project, type Plan } from './map';
import { MAP_ROOMS, type MapRoom } from './map-rooms';

type Ring = [number, number][];

interface CampusFeature {
	properties: { kind: string; name?: string | null };
	geometry: { type: string; coordinates: Ring[] | Ring };
}

const cache = new Map<string, unknown>();
function readJson<T>(relative: string): T {
	if (!cache.has(relative)) cache.set(relative, JSON.parse(fs.readFileSync(path.join(process.cwd(), 'public', relative), 'utf-8')));
	return cache.get(relative) as T;
}

const fix = (n: number) => Math.round(n * 10) / 10;

/** 経緯度 → SVG の座標（m。北が上なので y を反転する） */
function toSvg(lonlat: [number, number]): [number, number] {
	const [e, n] = project(lonlat);
	return [fix(e), fix(-n)];
}

const pointsOf = (ring: Ring) => ring.map((c) => toSvg(c).join(',')).join(' ');

export interface Box {
	x: number;
	y: number;
	w: number;
	h: number;
}

export const viewBoxOf = (b: Box) => `${fix(b.x)} ${fix(b.y)} ${fix(b.w)} ${fix(b.h)}`;

function boxOf(points: [number, number][], margin: number): Box {
	const xs = points.map((p) => p[0]);
	const ys = points.map((p) => p[1]);
	const [x0, x1, y0, y1] = [Math.min(...xs) - margin, Math.max(...xs) + margin, Math.min(...ys) - margin, Math.max(...ys) + margin];
	return { x: x0, y: y0, w: x1 - x0, h: y1 - y0 };
}

/** 指定の縦横比（幅 / 高さ）になるよう、枠を広げる */
function withAspect(b: Box, aspect: number): Box {
	if (b.w / b.h < aspect) {
		const w = b.h * aspect;
		return { x: b.x - (w - b.w) / 2, y: b.y, w, h: b.h };
	}
	const h = b.w / aspect;
	return { x: b.x, y: b.y - (h - b.h) / 2, w: b.w, h };
}

// ---------------------------------------------------------------------------
// キャンパス（屋外の会場・どの建物か）
// ---------------------------------------------------------------------------

export interface CampusLayer {
	kind: string;
	points: string;
	/** 選んだ会場の建物 */
	highlight?: boolean;
}

export interface CampusMap {
	viewBox: string;
	layers: CampusLayer[];
	/** 屋外の会場の位置 */
	marker?: { x: number; y: number };
	/** 番号つきのテント（グラウンドの G-1〜G-33 など）。main が選んだテント */
	dots?: { x: number; y: number; main: boolean; label?: string }[];
	/** 選んだ会場の建物の名前（建物の上に書く） */
	buildingLabel?: { x: number; y: number; text: string; size: number };
}

const DRAW_ORDER = ['campus', 'plaza', 'pitch', 'track', 'building'];

/**
 * 会場を示すキャンパスの図。zoom が 'area' のときは番号つきのテントの並ぶ区画（グラウンド）に寄せ、
 * そうでなければ敷地の全体を見せる。
 */
export function buildCampusMap(room: MapRoom, zoom: 'campus' | 'area', aspect = 1): CampusMap {
	const features = readJson<{ features: CampusFeature[] }>('map/campus.geojson').features;
	const ring = (f: CampusFeature) => (f.geometry.coordinates as Ring[])[0];

	const campusRing = ring(features.find((f) => f.properties.kind === 'campus')!);
	const siblings = room.parent ? MAP_ROOMS.filter((r) => r.parent === room.parent && r.at) : [];
	const dotsAt = siblings.map((r) => ({ r, p: toSvg(r.at!) }));

	const box =
		zoom === 'area' && dotsAt.length > 0
			? withAspect(boxOf(dotsAt.map((d) => d.p), 18), aspect)
			: withAspect(boxOf(campusRing.map(toSvg), 14), aspect);

	const layers: CampusLayer[] = [];
	for (const kind of DRAW_ORDER) {
		for (const f of features.filter((f) => f.properties.kind === kind && f.geometry.type === 'Polygon')) {
			layers.push({ kind, points: pointsOf(ring(f)), highlight: kind === 'building' && !!f.properties.name && f.properties.name === room.building });
		}
	}

	const map: CampusMap = { viewBox: viewBoxOf(box), layers };
	if (room.at && !room.parent) {
		const [x, y] = toSvg(room.at);
		map.marker = { x, y };
	}
	if (dotsAt.length) map.dots = dotsAt.map(({ r, p }) => ({ x: p[0], y: p[1], main: r.key === room.key, label: r.number ?? undefined }));
	const target = features.find((f) => f.properties.kind === 'building' && f.properties.name === room.building);
	if (target) {
		const pts = ring(target).slice(0, -1).map(toSvg);
		map.buildingLabel = {
			x: fix(pts.reduce((n, p) => n + p[0], 0) / pts.length),
			y: fix(pts.reduce((n, p) => n + p[1], 0) / pts.length),
			text: room.building,
			size: fix(box.w * 0.07),
		};
	}
	return map;
}

// ---------------------------------------------------------------------------
// 平面図（建物の中のどの部屋か）
// ---------------------------------------------------------------------------

export interface FloorMap {
	viewBox: string;
	rooms: { points: string; kind: string; target: boolean }[];
	walls: { x: number; y: number; w: number; h: number }[];
	floor: number;
	building: string;
}

const planFiles: Record<string, string> = {};

/** 部屋のある階の平面図。平面図のない会場なら null */
export function buildFloorMap(room: MapRoom): FloorMap | null {
	if (!room.plan || room.floor == null) return null;
	const plan = readJson<Plan>(`map/plans/${room.plan}.json`);
	planFiles[room.plan] = plan.building;
	const floor = plan.floors.find((f) => f.floor === room.floor);
	if (!floor) return null;
	const [x0, y0, x1, y1] = floor.bbox;
	const pad = 6;
	return {
		viewBox: viewBoxOf({ x: x0 - pad, y: y0 - pad, w: x1 - x0 + pad * 2, h: y1 - y0 + pad * 2 }),
		rooms: floor.rooms.map((r) => ({ points: r.points.map((p) => p.join(',')).join(' '), kind: r.kind, target: r.key === room.key })),
		walls: floor.walls.map(([a, b, c, d]) => ({ x: a, y: b, w: c - a, h: d - b })),
		floor: floor.floor,
		building: plan.building,
	};
}
