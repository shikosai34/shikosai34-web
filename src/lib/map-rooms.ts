/**
 * 会場マップの部屋キー（scripts/map/build-plans.mjs が生成する src/data/map-rooms.json）。
 * `astro:content` に依存しないため React からも読み込める。
 */
import rooms from '../data/map-rooms.json';

/**
 * 天候。晴天時と雨天時で出展場所が変わる（【晴天時】【雨天時】動線・出展場所一覧）。
 * サークルの mapRoom が晴天時、mapRoomRainy が雨天時の場所。
 */
export const WEATHERS = ['sunny', 'rainy'] as const;
export type Weather = (typeof WEATHERS)[number];
export const WEATHER_LABELS: Record<Weather, string> = { sunny: '晴天時', rainy: '雨天時' };

/**
 * 地図を開いたときに出す天候。当日に雨天時の配置と決まったら 'rainy' にしてデプロイする。
 * （?weather=rainy で開けば、この値によらず雨天時の配置を出す）
 */
export const DEFAULT_WEATHER: Weather = 'sunny';

/** 雨天時に出展しないサークルの mapRoomRainy */
export const NOT_IN_RAIN = 'none';

/** 当日の使い道（予選会場・休憩所など、サークルの出展ではない場所）。天候ごとに持つ */
export type RoomUse = Partial<Record<Weather, string>>;

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
	use?: RoomUse;
	/** 図面を持たない場所の位置 [経度, 緯度]（3D の地図にピンを立てる） */
	at?: [number, number];
	/**
	 * 屋台のテントが並ぶ屋外の会場。3D の地図で出展の数だけテントを描く。
	 * outline: at を含む区画（トラック・広場）の縁に沿って / column: ピンの南へ 1 列に / grid: ピンの南に碁盤目に
	 */
	tents?: 'outline' | 'column' | 'grid';
	/** outline のとき、区画の縁からどれだけ内側にテントを置くか（m） */
	tentsInset?: number;
	/** その天候のときだけ使う会場（省略時はどちらの天候でも使う） */
	weather?: Weather;
}

export const MAP_ROOMS = rooms as MapRoom[];

export const MAP_ROOM_KEYS = new Set(MAP_ROOMS.map((room) => room.key));

export function getMapRoom(key: string | undefined): MapRoom | undefined {
	return key ? MAP_ROOMS.find((room) => room.key === key) : undefined;
}

/** その天候で使う会場か */
export const isRoomInWeather = (room: MapRoom, weather: Weather) => !room.weather || room.weather === weather;

/**
 * サークルのその天候での部屋キー。雨天時の指定がなければ晴天時と同じ場所、
 * 「雨天時は出展しない」なら undefined。
 */
export function roomKeyInWeather(circle: { mapRoom?: string; mapRoomRainy?: string }, weather: Weather): string | undefined {
	if (weather === 'sunny') return circle.mapRoom;
	if (circle.mapRoomRainy === NOT_IN_RAIN) return undefined;
	return circle.mapRoomRainy ?? circle.mapRoom;
}

/** 「8号館 3F 8-301」のような短い表記。 */
export function formatMapRoom(room: MapRoom): string {
	return [room.building, room.floor ? `${room.floor}F` : null, room.number ?? (room.name === room.building ? null : room.name)]
		.filter(Boolean)
		.join(' ');
}
