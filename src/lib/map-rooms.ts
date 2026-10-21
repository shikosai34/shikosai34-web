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
	/** サークルが「実施場所」に書く呼び方（「1-1」「つながる〜む」など）。部屋の名前・番号・キーと並べて、場所を探すのに使う */
	aliases?: string[];
	/** 「雨天時の場所」に書く呼び方。クラス名は【雨天時】動線・出展場所一覧 の割り当てに合わせる */
	rainAliases?: string[];
	/**
	 * 番号つきのテント（グラウンドの G-1〜G-33 など）が属する会場の部屋キー。
	 * サークルはこの番号で出店場所を登録し、親の会場はその出展をまとめて見せる。
	 */
	parent?: string;
	/** 番号つきのテントの向き（平面でのラジアン。東向きが 0、北向きが正）。屋根を区画の縁に沿わせる */
	angle?: number;
}

export const MAP_ROOMS = rooms as MapRoom[];

export const MAP_ROOM_KEYS = new Set(MAP_ROOMS.map((room) => room.key));

/** 番号つきのテントをまとめる会場（グラウンドなど）の部屋キー。サークルの登録先には使わない */
export const AGGREGATE_KEYS = new Set(MAP_ROOMS.flatMap((room) => (room.parent ? [room.parent] : [])));

export function getMapRoom(key: string | undefined): MapRoom | undefined {
	return key ? MAP_ROOMS.find((room) => room.key === key) : undefined;
}

// ---------------------------------------------------------------------------
// サークルの「実施場所」から部屋を探す
// ---------------------------------------------------------------------------

/**
 * 場所の名前を比べやすい形にする（全角→半角、空白を除く、ハイフン・波ダッシュを統一）。
 * scripts/map/build-plans.mjs の normalizeLocation と同じ処理にする。
 */
export function normalizeLocation(text: string): string {
	return text
		.normalize('NFKC')
		.toLowerCase()
		.replace(/[\s\u3000]+/g, '')
		.replace(/[\u2010-\u2015\u2212]/g, '-')
		.replace(/[\u301c\u223c~]/g, '~');
}

/**
 * 正規化した名前 → その名前を持つ部屋。tiers は優先順位の高い順の「名前の取り方」で、
 * 前の段で見つかった名前は後ろの段では使わない（雨天時の別名を、晴天時の別名より先に引くため）。
 * 同じ段で 2 つ以上の部屋が同じ名前を持つなら、どれか選べないのでその名前は使わない。
 */
function buildIndex(tiers: ((room: MapRoom) => (string | null | undefined)[])[]): Map<string, MapRoom> {
	const result = new Map<string, MapRoom>();
	for (const names of tiers) {
		const found = new Map<string, MapRoom | null>();
		for (const room of MAP_ROOMS) {
			for (const name of names(room)) {
				if (!name) continue;
				const key = normalizeLocation(name);
				const prev = found.get(key);
				found.set(key, prev === undefined || prev?.key === room.key ? room : null);
			}
		}
		for (const [key, room] of found) if (room && !result.has(key)) result.set(key, room);
	}
	return result;
}

const plainNames = (r: MapRoom) => [r.key, r.number, r.name];
/** 晴天時（ふだん）の「実施場所」で使う名前。別名を優先し、キー・番号・名前でも探せる */
const LOCATION_INDEX = buildIndex([(r) => r.aliases ?? [], plainNames]);
/** 「雨天時の場所」で使う名前。雨天時の別名、晴天時の別名、キー・番号・名前の順 */
const RAIN_INDEX = buildIndex([(r) => r.rainAliases ?? [], (r) => r.aliases ?? [], plainNames]);

/**
 * 「実施場所」の文字から部屋を探す。見つからない（または 2 つ以上の部屋に当たる）なら undefined。
 * 「3M1（8号館1階）」のように括弧つきで書かれていれば、括弧の前・括弧の中の順にも試す。
 */
export function resolveRoomByLocation(location: string | undefined, kind: 'sunny' | 'rainy' = 'sunny'): MapRoom | undefined {
	if (!location) return undefined;
	const index = kind === 'rainy' ? RAIN_INDEX : LOCATION_INDEX;
	const candidates = [location];
	const paren = location.match(/^(.*?)[（(]([^）)]*)[）)]/);
	if (paren) candidates.push(paren[1], paren[2]);
	for (const text of candidates) {
		const room = index.get(normalizeLocation(text));
		if (room) return room;
	}
	return undefined;
}

/** その天候で使う会場か */
export const isRoomInWeather = (room: MapRoom, weather: Weather) => !room.weather || room.weather === weather;

/** 雨天時に「中止」と書かれているか（rainLocation） */
export const isCancelledInRain = (rainLocation: string | undefined) => !!rainLocation && /中止/.test(rainLocation);

interface CircleLocation {
	mapRoom?: string;
	mapRoomRainy?: string;
	location?: string;
	rainLocation?: string;
}

/**
 * サークルのその天候での部屋キー。CMS で選んだ部屋（mapRoom / mapRoomRainy）を優先し、
 * 選んでいなければ「実施場所」「雨天時の場所」の名前から探す。
 * - 雨天時: 「雨天時は出展しない」（none）や「中止」なら undefined。雨天時の場所が書いてあるのに
 *   地図に見つからないときも、晴天時と同じ場所にはせず undefined（地図に未登録として出す）
 */
export function roomKeyInWeather(circle: CircleLocation, weather: Weather): string | undefined {
	const base = circle.mapRoom ?? resolveRoomByLocation(circle.location)?.key;
	if (weather === 'sunny') return base;
	if (circle.mapRoomRainy === NOT_IN_RAIN || isCancelledInRain(circle.rainLocation)) return undefined;
	if (circle.mapRoomRainy) return circle.mapRoomRainy;
	if (circle.rainLocation?.trim()) return resolveRoomByLocation(circle.rainLocation, 'rainy')?.key;
	return base;
}

/** 「8号館 3F 8-301」のような短い表記。 */
export function formatMapRoom(room: MapRoom): string {
	return [room.building, room.floor ? `${room.floor}F` : null, room.number ?? (room.name === room.building ? null : room.name)]
		.filter(Boolean)
		.join(' ');
}
