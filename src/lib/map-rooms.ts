/**
 * 会場マップの部屋キー（scripts/map/build-plans.mjs が生成する src/data/map-rooms.json）。
 * `astro:content` に依存しないため React からも読み込める。
 */
import rooms from '../data/map-rooms.json';

export interface MapRoom {
	/** 部屋キー。サークルの mapRoom と /map?room= に使う。 */
	key: string;
	/** 建物名（public/map/campus.geojson の建物名と一致する）。屋外は「屋外」。 */
	building: string;
	/** 階。図面を持たない場所は null。 */
	floor: number | null;
	/** 部屋番号（8-301 など）。 */
	number: string | null;
	name: string;
	/** 平面図のファイル名（public/map/plans/<plan>.json）。図面を持たない場所は null。 */
	plan: string | null;
	/** 図面を持たない場所の位置 [経度, 緯度]（3D の地図にピンを立てる） */
	at?: [number, number];
}

export const MAP_ROOMS = rooms as MapRoom[];

export const MAP_ROOM_KEYS = new Set(MAP_ROOMS.map((room) => room.key));

export function getMapRoom(key: string | undefined): MapRoom | undefined {
	return key ? MAP_ROOMS.find((room) => room.key === key) : undefined;
}

/** 「8号館 3F 8-301」のような短い表記。 */
export function formatMapRoom(room: MapRoom): string {
	return [room.building, room.floor ? `${room.floor}F` : null, room.number ?? (room.name === room.building ? null : room.name)]
		.filter(Boolean)
		.join(' ');
}
