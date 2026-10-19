/**
 * 茨香祭当日のバス時刻データ。
 *
 * /access ページの臨時便案内と、トップページのバス発車カウントダウン
 * （BusDepartureBoard）の両方がここを参照する。変更する場合は両方の
 * 見え方を確認すること。
 *
 * 時間帯を絞らず、始発〜終発までの 1 日全便を載せる。「次のバス」案内
 * （getUpcomingDepartures）はこのデータをもとに現在時刻以降の便を
 * 計算するので、時間帯を限定するとその時間帯の外では案内が出せなくなる。
 *
 * 定期便は 2 事業者分を扱う。
 *   - 茨城交通（ibako）: 曜日でダイヤが変わるため、平日ダイヤ（weekday）と
 *     休日ダイヤ（weekend、土日祝。祝日判定はせず土日のみで近似）の 2 種類
 *     を持つ。どちらを使うかは出発日の曜日から自動で決める
 *     （getScheduleKind）。時刻は茨城交通の時刻表検索システム
 *     （bus.ibako.co.jp、2026/10/15 時点）から転記。
 *       - 勝田駅前 2番のりば → 茨城高専前に停まる便（no=1052）。行先は「海浜公園南口行」
 *         「中央研修所行」「東中根団地行（市役所・本郷台団地経由）」の 3 種類で、すべて
 *         茨城高専前を通る。「21 東中根団地行（薬師台経由）」は通らないので含めない。
 *         便ごとの行先表示は OperatorTime.headsign に持つ（2026/10/19 に再確認）。
 *       - 勝田駅前 → 深谷津・足崎団地行き（no=1052, des_no=6）
 *       - 茨城高専前 → 勝田駅方面（no=436, de=2）。市役所経由・薬師台経由の勝田駅前行きと、
 *         勝田駅を通る茨大前営業所行きを含める。
 *       - 深谷津 → 勝田駅前行き（市役所経由。no=3710, de=2。de=1 は足崎団地方面で逆向き）
 *     平日の「市役所経由 茨城高専」直行（no=1052, des_no=7）は 8:32 の
 *     1 本のみで、海浜公園南口行きと合わせて茨城高専前発着の便として扱う。
 *   - スマイルあおぞらバス（smile、ひたちなか市コミュニティバス）: 曜日に
 *     よるダイヤの違いはなく、1 種類のみ。深谷津バス停を通る勝田北コース・勝田中央
 *     コースを扱う。向きは次のとおり判定した。
 *     勝田北コースはひたちなか市の公式時刻表（勝田駅東口発・大島・六ツ野循環）で、
 *     勝田中央コースは茨城交通の時刻表検索（深谷津 no=20280、勝田駅東口 no=20259,
 *     2026/10/19 時点）で、勝田駅東口の発時刻と深谷津の通過時刻を突き合わせて向きを判定した。
 *       - 勝田北コース 往路（勝田駅 → 深谷津）: 勝田駅東口 8:10・11:00・12:30・15:20 発、21 分で深谷津。
 *       - 勝田北コース 復路（深谷津 → 勝田駅）: 勝田駅東口 9:35・13:55・16:45 発の逆回りで、
 *         深谷津から約 23 分で勝田駅東口に着く。
 *       - 勝田中央コース 往路: 「高野・向野」循環。勝田駅東口 8:00・11:45・15:35 発、約 14 分で深谷津。
 *       - 勝田中央コース 復路: 「向野・高野」循環。深谷津から 8 停留所で勝田駅東口に着く。
 *     茨城交通の時刻表検索では、同じ便でも停留所によって「大島・六ツ野」と「六ツ野・大島」の
 *     呼び名が逆になるため、循環の名前では向きを判定しない。
 *
 * 平日ダイヤ（茨城交通）は実データを反映済み。
 *
 * 臨時便は 1 日目（10/24）のみ運行する。
 * 時刻は出発時刻。曜日によらず、当日の臨時便時刻として扱う。
 *
 * 勝田駅から高専へ向かうバスは、下車する停留所が系統によって違うので系統ごとに表を分ける。
 *   - 「茨城高専前」下車: 勝田駅前の 海浜公園南口 行き（市役所・海浜公園西口・中央研修所経由）。正門の目の前。
 *   - 「深谷津」下車: 勝田駅前の 足崎団地 行き（市役所・勝田高校経由）、またはスマイルあおぞらバス。高専前は通らず、徒歩が必要。
 * 復路も同様に、茨城高専前発（市役所経由 勝田駅前行き）と深谷津発（市役所経由 勝田駅前行き）で分ける。
 *
 * 遅延情報は取得手段がないため扱わない（時刻表どおりの予定として案内する）。
 */

/** 臨時便の運行日。 */
export const SHUTTLE_SERVICE_DATES = ['2026-10-24'];

export type BusDirection = '往路' | '復路';

/** 出発地点（発車標の列の単位）。 */
export type DepartureStop = '勝田駅' | '茨城高専前' | '深谷津';

/** 定期便のダイヤ種別。 */
export type ScheduleKind = 'weekday' | 'weekend';

/** 定期便の運行事業者。 */
export type BusOperator = 'ibako' | 'smile';

export const BUS_OPERATOR_LABELS: Record<BusOperator, string> = {
	ibako: '茨城交通',
	smile: 'スマイルあおぞらバス',
};

export interface BusRoute {
	id: string;
	direction: BusDirection;
	/** 表示用の経路名（例: "勝田駅発 → 茨城高専前"）。 */
	route: string;
	/** 出発する停留所（発車標の列の単位）。 */
	from: DepartureStop;
	/** 下車・乗車する停留所名（表示用）。 */
	stop: string;
	/** 停留所についての短い補足（乗り場や徒歩の案内）。 */
	stopNote: string;
	/** 臨時便の出発時刻。曜日によらず当日共通。 */
	shuttleTimes: string[];
	/** 時刻表の下に添える注記（便が少ない・事業者が複数ある系統向け）。 */
	caveat?: string;
}

/** 系統の骨格（方向・停留所など、ダイヤ種別によらない部分）。 */
const ROUTE_BASE: Omit<BusRoute, 'shuttleTimes'>[] = [
	{
		id: 'outbound-kosen',
		direction: '往路',
		route: '勝田駅発 → 茨城高専前',
		from: '勝田駅',
		stop: '茨城高専前',
		stopNote: '下車後、北へ進むと正門です。',
	},
	{
		id: 'outbound-fukayatsu',
		direction: '往路',
		route: '勝田駅発 → 深谷津',
		from: '勝田駅',
		stop: '深谷津',
		stopNote: '茨城高専前は通りません。',
		caveat: 'スマイルあおぞらバス（勝田北・勝田中央コース）の便を含みます。',
	},
	{
		id: 'inbound-kosen',
		direction: '復路',
		route: '茨城高専前発 → 勝田駅',
		from: '茨城高専前',
		stop: '勝田駅',
		stopNote: '正門を出て南へ進むと乗り場です。',
	},
	{
		id: 'inbound-fukayatsu',
		direction: '復路',
		route: '深谷津発 → 勝田駅',
		from: '深谷津',
		stop: '勝田駅',
		stopNote: '茨城高専前からは離れています。',
		caveat: 'スマイルあおぞらバス（勝田北・勝田中央コース）の便を含みます。',
	},
];

/** 臨時便の出発時刻。曜日によらず運行日共通。 */
const SHUTTLE_TIMES: Record<string, string[]> = {
	'outbound-kosen': ['9:35', '10:00', '10:25', '11:00', '11:30', '12:00', '12:30', '13:00'],
	'outbound-fukayatsu': [],
	'inbound-kosen': ['15:00', '15:30', '16:10', '16:50'],
	'inbound-fukayatsu': [],
};

function buildRoutes(): BusRoute[] {
	return ROUTE_BASE.map((base) => ({ ...base, shuttleTimes: SHUTTLE_TIMES[base.id] ?? [] }));
}

export const BUS_ROUTES: BusRoute[] = buildRoutes();

interface OperatorTime {
	time: string;
	operator: BusOperator;
	/**
	 * 車両の行先表示（「〜〜行」）。同じ系統でも便ごとに違うので時刻ごとに持つ。
	 * 臨時便は表示が確認できていないため持たない。
	 */
	headsign: string;
}

function ibako(headsign: string, times: string[]): OperatorTime[] {
	return times.map((time) => ({ time, operator: 'ibako', headsign }));
}

/** スマイルあおぞらバスはコース名を行先表示の代わりに載せる。 */
function smile(course: string, times: string[]): OperatorTime[] {
	return times.map((time) => ({ time, operator: 'smile', headsign: course }));
}

/**
 * 定期便の出発時刻。ダイヤ種別・系統ごと。
 *
 * 茨城交通（ibako）は bus.ibako.co.jp の時刻表検索（2026/10/15 時点）から
 * 転記。スマイルあおぞらバス（smile）も同じ時刻表検索の勝田中央コース。
 * どちらも曜日区分
 * （week=1 平日 / week=2 土曜 / week=3 日曜・祝日）で引いた値。
 */
const REGULAR_TIMES: Record<ScheduleKind, Record<string, OperatorTime[]>> = {
	weekday: {
		// 勝田駅前 → 海浜公園南口（茨城高専前経由）de_no=3。市役所経由茨城高専直行(des_no=7)の 8:32 を含む。
		'outbound-kosen': [
			// 勝田駅前 2番のりば発の、茨城高専前に停まる便（bus.ibako.co.jp no=1052, de=2。2026/10/19 時点）。
			// 海浜公園南口行（市役所・海浜公園西口・中央研修所経由）
			...ibako('海浜公園南口行', ['9:00', '9:26', '9:40', '10:00', '10:20', '10:40', '11:00', '11:20', '11:40', '12:00', '12:20', '12:40', '13:10', '13:40', '14:10', '14:40', '15:10', '15:40', '16:10']),
			// 中央研修所行（市役所・海浜公園西口経由）
			...ibako('中央研修所行', ['8:10', '8:15', '8:32', '17:05', '17:30', '19:05']),
			// 東中根団地行（市役所・本郷台団地経由）。「東中」は東中根団地中央止まり。
			...ibako('東中根団地行', ['7:28', '8:00', '17:50', '18:15', '18:52', '19:34', '20:05']),
			// 市役所経由の茨城高専行（学校休業日は運休）
			...ibako('茨城高専行', ['8:32']),
		],
		// 勝田駅前 → 足崎団地（深谷津経由）des_no=6 ＋ スマイルあおぞらバス 勝田中央コース
		'outbound-fukayatsu': [
			...ibako('足崎団地行', ['6:56', '7:37', '7:55', '8:15', '8:28', '16:25', '16:55', '17:24', '18:10', '19:10', '19:50']),
			// 勝田中央コース「高野・向野」: 勝田駅東口 8:00・11:45・15:35 発、約14分で深谷津（茨城交通 no=20280, de=1）
			...smile('勝田中央コース', ['8:14', '11:59', '15:49']),
			// 勝田北コース: 勝田駅東口 8:10・11:00・12:30・15:20 発、21分で深谷津（ひたちなか市の時刻表）
			...smile('勝田北コース', ['8:31', '11:21', '12:51', '15:41']),
		],
		// 茨城高専前 → 勝田駅前 des_no=1
		'inbound-kosen': [
			// 茨城高専前発（bus.ibako.co.jp no=436, de=2。2026/10/19 時点）。市役所経由 勝田駅前行
			...ibako('勝田駅前行', [
			'7:00',
			'7:24',
			'7:49',
			'8:39',
			'8:58',
			'9:16',
			'9:51',
			'10:17',
			'10:31',
			'10:51',
			'11:11',
			'11:31',
			'11:51',
			'12:11',
			'12:31',
			'12:51',
			'13:11',
			'13:31',
			'14:01',
			'14:31',
			'15:01',
			'15:31',
			'16:11',
			'16:14',
			'16:31',
			'17:01',
			'17:14',
			'17:26',
			'17:48',
			'18:19',
			'18:20',
			'18:44',
			'19:12',
			'19:43',
			'20:17',
			'20:47',
		]),
			// 薬師台経由 勝田駅前行（21）
			...ibako('勝田駅前行', ['6:06']),
			// 薬師台・勝田駅・水戸駅経由 茨大前営業所行（21。勝田駅に停まる）
			...ibako('茨大前営業所行', ['6:45', '8:23', '9:09']),
		],
		// 深谷津 → 勝田駅前 des_no=1
		'inbound-fukayatsu': [
			...ibako('勝田駅前行', ['6:14', '7:19', '8:00', '8:38', '8:51', '16:48', '17:18', '17:47', '18:33', '19:33']),
			// 勝田中央コース「向野・高野」: 深谷津から8停留所で勝田駅東口に着く（茨城交通 no=20280, de=1）
			...smile('勝田中央コース', ['11:17', '14:57', '18:52']),
			// 勝田北コース「六ツ野・大島」: 深谷津から14停留所で勝田駅東口に着く（茨城交通 no=20280, de=1）
			...smile('勝田北コース', ['10:17', '14:37', '17:31']),
		],
	},
	weekend: {
		'outbound-kosen': [
			// 勝田駅前 2番のりば発の、茨城高専前に停まる便（bus.ibako.co.jp no=1052, de=2。2026/10/19 時点）。
			// 海浜公園南口行（市役所・海浜公園西口・中央研修所経由）
			...ibako('海浜公園南口行', ['9:00', '9:26', '9:40', '10:00', '10:20', '10:40', '11:00', '11:20', '11:40', '12:00', '12:20', '12:40', '13:10', '13:40', '14:10', '14:25', '14:40', '15:10', '15:40', '16:10']),
			// 中央研修所行（市役所・海浜公園西口経由）
			...ibako('中央研修所行', ['8:10', '8:32', '17:05', '17:30', '19:05']),
			// 東中根団地行（市役所・本郷台団地経由）。「東中」は東中根団地中央止まり。
			...ibako('東中根団地行', ['18:15']),
		],
		'outbound-fukayatsu': [
			...ibako('足崎団地行', ['6:56', '8:15', '17:24', '19:10', '19:50']),
			// 勝田中央コース「高野・向野」: 勝田駅東口 8:00・11:45・15:35 発、約14分で深谷津（茨城交通 no=20280, de=1）
			...smile('勝田中央コース', ['8:14', '11:59', '15:49']),
			// 勝田北コース: 勝田駅東口 8:10・11:00・12:30・15:20 発、21分で深谷津（ひたちなか市の時刻表）
			...smile('勝田北コース', ['8:31', '11:21', '12:51', '15:41']),
		],
		'inbound-kosen': [
			// 茨城高専前発（bus.ibako.co.jp no=436, de=2。2026/10/19 時点）。市役所経由 勝田駅前行
			...ibako('勝田駅前行', [
			'7:24',
			'8:39',
			'8:58',
			'9:16',
			'9:51',
			'10:17',
			'10:31',
			'10:51',
			'11:11',
			'11:31',
			'11:51',
			'12:11',
			'12:31',
			'12:51',
			'13:11',
			'13:31',
			'14:01',
			'14:31',
			'15:01',
			'15:16',
			'15:31',
			'16:11',
			'16:31',
			'17:01',
			'17:26',
			'17:48',
			'18:19',
			'18:19',
			'18:44',
			'19:43',
			'20:17',
			'20:47',
		]),
			// 薬師台経由 勝田駅前行（21）
			...ibako('勝田駅前行', ['9:09']),
			// 薬師台・勝田駅・水戸駅経由 茨大前営業所行（21。勝田駅に停まる）
			...ibako('茨大前営業所行', ['6:45', '8:23']),
		],
		// 深谷津 → 勝田駅前（市役所経由）no=3710, de=2。7:03 などは足崎団地方面（de=1）の時刻なので混ぜない。
		'inbound-fukayatsu': [
			...ibako('勝田駅前行', ['7:19', '8:38', '17:47', '19:33']),
			// 勝田中央コース「向野・高野」: 深谷津から8停留所で勝田駅東口に着く（茨城交通 no=20280, de=1）
			...smile('勝田中央コース', ['11:17', '14:57', '18:52']),
			// 勝田北コース「六ツ野・大島」: 深谷津から14停留所で勝田駅東口に着く（茨城交通 no=20280, de=1）
			...smile('勝田北コース', ['10:17', '14:37', '17:31']),
		],
	},
};

/** バス運賃（片道・行き帰りとも同額）。茨城交通の運賃（2026/10/18 時点）。改定されたら見直す。 */
export const BUS_FARES = [
	{
		id: 'kosen',
		route: '勝田駅〜茨城高専前',
		prices: [
			{ label: '大人', price: '240円' },
			{ label: '小人', price: '120円' },
		],
	},
	{
		id: 'fukayatsu',
		route: '勝田駅〜深谷津（茨城交通）',
		prices: [
			{ label: '大人', price: '250円' },
			{ label: '小人', price: '130円' },
		],
	},
	{
		id: 'fukayatsu-smile',
		route: '勝田駅〜深谷津（スマイルあおぞらバス）',
		prices: [{ label: '小学生以上', price: '100円' }],
	},
] as const;

export interface BusDeparture {
	/** "HH:mm" 形式の出発時刻。 */
	time: string;
	/** 臨時便なら true、定期便なら false。 */
	extra: boolean;
	/** 定期便の運行事業者。臨時便（extra: true）では undefined。 */
	operator?: BusOperator;
	/** 車両の行先表示。臨時便など不明な便では undefined。 */
	headsign?: string;
}

export interface BusTimetable extends BusRoute {
	/** 臨時便と定期便を時刻順に並べたリスト（同時刻は定期便が先）。 */
	departures: BusDeparture[];
}

function toMinutes(time: string): number {
	const [hour, minute] = time.split(':').map(Number);
	return hour * 60 + minute;
}

/**
 * 臨時便と、指定したダイヤ種別の定期便を 1 本の時刻順リストにまとめる
 * （同時刻のときは定期便が先）。
 */
export function getBusTimetables(kind: ScheduleKind, routes: BusRoute[] = BUS_ROUTES): BusTimetable[] {
	const regularByRoute = REGULAR_TIMES[kind];
	return routes.map((route) => ({
		...route,
		departures: [
			...(regularByRoute[route.id] ?? []).map(({ time, operator, headsign }) => ({ time, extra: false, operator, headsign })),
			...route.shuttleTimes.map((time) => ({ time, extra: true })),
		].sort((a, b) => toMinutes(a.time) - toMinutes(b.time)),
	}));
}

/** JST の日付部分（YYYY-MM-DD）。 */
function jstDateKey(date: Date): string {
	return new Intl.DateTimeFormat('en-CA', { timeZone: 'Asia/Tokyo' }).format(date);
}

/** JST の曜日（0=日 〜 6=土）。 */
function jstWeekday(date: Date): number {
	const key = new Intl.DateTimeFormat('en-US', { timeZone: 'Asia/Tokyo', weekday: 'short' }).format(date);
	return ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].indexOf(key);
}

/**
 * 指定した日の定期便ダイヤ種別を返す。土日は休日ダイヤ、それ以外は平日ダイヤ。
 * 祝日は考慮しない簡易判定（茨城交通が祝日を土日と同じダイヤにしているため、
 * 実務上の誤差は小さい）。
 */
export function getScheduleKind(date: Date): ScheduleKind {
	const weekday = jstWeekday(date);
	return weekday === 0 || weekday === 6 ? 'weekend' : 'weekday';
}

/** "HH:mm" の時刻を、指定した日付（YYYY-MM-DD）の JST の Date にする。 */
function toDepartureDate(time: string, dateKey: string): Date {
	const [hour, minute] = time.split(':').map(Number);
	return new Date(`${dateKey}T${String(hour).padStart(2, '0')}:${String(minute).padStart(2, '0')}:00+09:00`);
}

export interface UpcomingDeparture {
	routeId: string;
	direction: BusDirection;
	route: string;
	from: DepartureStop;
	stop: string;
	time: string;
	extra: boolean;
	operator?: BusOperator;
	headsign?: string;
	/** 出発までの残り分数（切り上げ）。発車済みなら 0。 */
	minutesLeft: number;
	departureDate: Date;
}

/**
 * 指定した時刻（now）以降に出発する便を、出発地点（from）ごとに分けて返す。
 * 各地点とも出発時刻が早い順に並び、デフォルトで直近 3 本まで。
 *
 * 定期便は、出発日の曜日から平日・休日ダイヤを自動で選ぶ
 * （getScheduleKind）。臨時便は運行日（SHUTTLE_SERVICE_DATES）に
 * 含まれる日だけ加える。
 *
 * 今日の残り時間に便がなければそのまま空にする（＝「本日はもう発車
 * しない」）。3 本に満たないからといって翌日の始発を混ぜることはしない。
 * 翌日の便を含めると、当日は最終便の案内が「本日はもうない」から
 * 「明日の始発」にすり替わってしまうため。
 */
export function getUpcomingDepartures(
	now: Date,
	options: { limit?: number; routes?: BusRoute[] } = {},
): Record<DepartureStop, UpcomingDeparture[]> {
	const { limit = 3, routes = BUS_ROUTES } = options;

	const dateKey = jstDateKey(now);
	const isShuttleDay = SHUTTLE_SERVICE_DATES.includes(dateKey);
	const scheduleKind = getScheduleKind(now);
	const timetables = getBusTimetables(scheduleKind, routes);

	const effectiveTimetables = isShuttleDay
		? timetables
		: timetables.map((timetable) => ({
				...timetable,
				departures: timetable.departures.filter((departure) => !departure.extra),
			}));

	const all: UpcomingDeparture[] = effectiveTimetables.flatMap((timetable) =>
		timetable.departures.map((departure) => {
			const departureDate = toDepartureDate(departure.time, dateKey);
			return {
				routeId: timetable.id,
				direction: timetable.direction,
				route: timetable.route,
				from: timetable.from,
				stop: timetable.stop,
				time: departure.time,
				extra: departure.extra,
				operator: departure.operator,
				headsign: departure.headsign,
				minutesLeft: Math.max(0, Math.ceil((departureDate.getTime() - now.getTime()) / 60_000)),
				departureDate,
			};
		}),
	);

	const upcoming = all
		.filter((departure) => departure.departureDate.getTime() >= now.getTime())
		.sort((a, b) => a.departureDate.getTime() - b.departureDate.getTime());

	const byStop: Record<DepartureStop, UpcomingDeparture[]> = { 勝田駅: [], 茨城高専前: [], 深谷津: [] };
	for (const departure of upcoming) {
		const bucket = byStop[departure.from];
		if (bucket.length < limit) bucket.push(departure);
	}
	return byStop;
}
