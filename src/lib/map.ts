/**
 * 会場マップ（/map）の共通の型と定数。
 * `astro:content` に依存しないため React からも読み込める。
 *
 * データは scripts/map/ のスクリプトが生成する。
 * - public/map/campus.geojson … 3D の地面と建物（build-campus.mjs）
 * - public/map/plans/<file>.json … 各館の平面図（build-plans.mjs）
 */
import { MAP_ROOMS, type MapRoom } from './map-rooms';

// ---------------------------------------------------------------------------
// 平面図
// ---------------------------------------------------------------------------

export type PlanRoomKind = 'room' | 'corridor' | 'stairs' | 'toilet';

export interface PlanRoom {
	/** 部屋キーを持つ部屋はそのキー、ほかは図面ごとの連番 */
	id: string;
	/** 部屋キー（サークルの mapRoom と対応）。出展場所にならない部屋は null */
	key: string | null;
	number: string | null;
	name: string | null;
	kind: PlanRoomKind;
	/** 輪郭（SVG 座標） */
	points: [number, number][];
	bbox: [number, number, number, number];
	/** 矩形でない部屋の名前を置く位置（SVG 座標）。なければ外接矩形の左上に置く */
	labelAt?: [number, number];
}

export interface PlanMarker {
	at: [number, number];
	type: 'stairs' | 'entrance' | 'exit';
	text?: string;
}

export interface PlanFloor {
	floor: number;
	bbox: [number, number, number, number];
	/** 壁（SVG 座標の矩形 [x0, y0, x1, y1]） */
	walls: [number, number, number, number][];
	rooms: PlanRoom[];
	markers: PlanMarker[];
}

export interface Plan {
	building: string;
	floors: PlanFloor[];
}

/**
 * 平面図を描くときの拡大率。図面の座標は小さい（1 部屋 ≒ 60 単位）ので、
 * 部屋の中の文字が読める大きさになるよう拡大して描く。
 */
export const PLAN_SCALE = 2;

/** 平面図を持つ建物 → public/map/plans/<file>.json（scripts/map/build-plans.mjs の CONFIG と揃える） */
export const PLAN_FILES: Record<string, string> = {
	'1号館': 'bldg1',
	'2・3号館': 'bldg2-3',
	'4号館': 'bldg4',
	'5号館': 'bldg5',
	'7号館': 'bldg7',
	'8号館': 'bldg8',
	'10号館': 'bldg10',
	図書館棟: 'library',
	茨友会館: 'ibayu',
	第一体育館: 'gym1',
	武道館: 'budokan',
};

export async function loadPlan(building: string): Promise<Plan> {
	const res = await fetch(`/map/plans/${PLAN_FILES[building]}.json`);
	if (!res.ok) throw new Error(`平面図を読み込めませんでした（${building}）`);
	return res.json();
}

// ---------------------------------------------------------------------------
// 出展
// ---------------------------------------------------------------------------

/** 地図の凡例の区分。サークルのカテゴリ（学年・種別）とステージ企画をまとめたもの */
export type ExhibitGroup = 'grade' | 'club' | 'stage' | 'other';

export interface MapExhibit {
	id: string;
	/** 企画名（ステージ企画）・団体名（サークル） */
	title: string;
	/** 出演団体・カテゴリなどの補足 */
	subtitle: string;
	group: ExhibitGroup;
	href: string;
	image?: string;
	/** ステージ企画の時間（「10/24 13:00〜13:30」） */
	time?: string;
}

/** 部屋キー → そこで行われる出展 */
export type ExhibitsByRoom = Record<string, MapExhibit[]>;

/** 凡例。色は global.css のパレット（main / accent / glow-pink / text）に揃える */
export const EXHIBIT_GROUPS: Record<ExhibitGroup, { label: string; color: string }> = {
	grade: { label: 'クラス・学年', color: '#ff9933' },
	club: { label: '部活・同好会', color: '#00ffcc' },
	stage: { label: 'ステージ', color: '#ff6ea8' },
	other: { label: 'その他', color: '#e8e8e8' },
};

export function exhibitGroupOfCategory(category: string): ExhibitGroup {
	if (category.startsWith('grade')) return 'grade';
	if (category === 'sports' || category === 'culture' || category === 'society') return 'club';
	return 'other';
}

/** 建物ごとの出展数 */
export function countExhibitsByBuilding(exhibits: ExhibitsByRoom): Record<string, number> {
	const counts: Record<string, number> = {};
	for (const room of MAP_ROOMS) {
		const n = exhibits[room.key]?.length ?? 0;
		if (n) counts[room.building] = (counts[room.building] ?? 0) + n;
	}
	return counts;
}

// ---------------------------------------------------------------------------
// 地図の座標
// ---------------------------------------------------------------------------

/** 3D 空間の原点にする経緯度（scripts/map/build-campus.mjs の CENTER と揃える）。1 単位 = 1m */
export const MAP_CENTER: [number, number] = [140.5509, 36.4002];
const M_PER_DEG_LAT = 110950;
const M_PER_DEG_LON = 111320 * Math.cos((MAP_CENTER[1] * Math.PI) / 180);

/** 経緯度 → 平面上の [東, 北]（m） */
export function project([lon, lat]: [number, number]): [number, number] {
	return [(lon - MAP_CENTER[0]) * M_PER_DEG_LON, (lat - MAP_CENTER[1]) * M_PER_DEG_LAT];
}

// ---------------------------------------------------------------------------
// URL
// ---------------------------------------------------------------------------

/** 地図の表示状態。building が null なら全体（3D）を見ている */
export interface MapView {
	building: string | null;
	floor?: number;
	room?: string;
}

/** ?room=<部屋キー> または ?building=<建物名>&floor=<階> を読む */
export function readViewFromUrl(search: string): MapView {
	const params = new URLSearchParams(search);
	const room: MapRoom | undefined = MAP_ROOMS.find((r) => r.key === params.get('room'));
	if (room) {
		return { building: room.plan ? room.building : null, floor: room.floor ?? undefined, room: room.key };
	}
	const building = params.get('building');
	if (building && building in PLAN_FILES) {
		const floor = Number(params.get('floor'));
		return { building, floor: Number.isInteger(floor) && floor > 0 ? floor : undefined };
	}
	return { building: null };
}

export function viewToSearch(view: MapView): string {
	if (!view.building) return view.room ? `?room=${encodeURIComponent(view.room)}` : '';
	if (view.room) return `?room=${encodeURIComponent(view.room)}`;
	const params = new URLSearchParams({ building: view.building });
	if (view.floor) params.set('floor', String(view.floor));
	return `?${params}`;
}
