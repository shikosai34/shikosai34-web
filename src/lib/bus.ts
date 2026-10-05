/**
 * 茨香祭当日のバス時刻データ。
 *
 * /access ページの時刻表と、トップページ右下のバス発車カウントダウン
 * （BusCountdownWidget）の両方がここを参照する。データは /access 側の
 * コメントに合わせてある。変更する場合は両方の見え方を確認すること。
 *
 * 臨時便（茨城高専スクールバス）は 1 日目（10/24）のみ運行する。時刻は出発時刻。
 * 茨城交通の定期便は 10/24 が土曜ダイヤ。臨時便の最初〜最後の時刻の間に出る便を載せている。
 *
 * 勝田駅から高専へ向かうバスは、下車する停留所が系統によって違うので系統ごとに表を分ける。
 *   - 「茨城高専前」下車: 勝田駅前の 海浜公園南口 行き（市役所・海浜公園西口・中央研修所経由）。正門の目の前。
 *   - 「深谷津」下車: 勝田駅前の 足崎団地 行き（市役所・勝田高校経由）。高専前は通らず、徒歩が必要。
 *     土曜ダイヤは 8:15 の次が 17:24 で、茨香祭の時間帯（9〜17 時）に走る便がない（2026/10/02 時点）。
 *     便がないことが分かるよう、前後の 8 時台・17 時台だけ参考として載せ、注記を添える。
 *     ほかに 6:56 / 19:10 / 19:50（第二工業団地入口止）があるが、時間帯が離れるため省く。
 * 復路も同様に、茨城高専前発（市役所経由 勝田駅前行き）と深谷津発（市役所経由 勝田駅前行き）で分ける。
 *   深谷津発の土曜ダイヤは 8:38 の次が 17:47 で、こちらも該当時間帯の便がない。
 *   ほかに 7:19 / 19:33 があるが、同じ理由で省く。
 *
 * 時刻は茨城交通の時刻表（2026/10/02 時点・土曜ダイヤ）から転記している。ダイヤが変わったら見直す。
 */

/** 一般公開日（臨時便の運行日）。 */
export const BUS_SERVICE_DATE = '2026-10-24';

export type BusDirection = '往路' | '復路';

export interface BusRoute {
	id: string;
	direction: BusDirection;
	/** 表示用の経路名（例: "勝田駅発 → 茨城高専前"）。 */
	route: string;
	/** 下車・乗車する停留所名。 */
	stop: string;
	/** 停留所についての短い補足（乗り場や徒歩の案内）。 */
	stopNote: string;
	/** 臨時便（茨城高専スクールバス）の出発時刻。 */
	times: string[];
	/** 茨城交通の定期便の出発時刻。 */
	regularTimes: string[];
	/** 時刻表の下に添える注記（深谷津のように便が少ない系統向け）。 */
	caveat?: string;
}

export const BUS_ROUTES: BusRoute[] = [
	{
		id: 'outbound-kosen',
		direction: '往路',
		route: '勝田駅発 → 茨城高専前',
		stop: '茨城高専前',
		stopNote: '下車後、北へ進むと正門です。',
		times: ['9:35', '10:00', '10:25', '11:00', '11:30', '12:00', '12:30', '13:00'],
		regularTimes: ['9:40', '10:00', '10:20', '10:40', '11:00', '11:20', '11:40', '12:00', '12:20', '12:40'],
	},
	{
		id: 'outbound-fukayatsu',
		direction: '往路',
		route: '勝田駅発 → 深谷津',
		stop: '深谷津',
		stopNote: '茨城高専前は通りません。',
		times: [],
		regularTimes: ['8:15', '17:24'],
		caveat: '土曜ダイヤでは 8:15 の次が 17:24 です。茨香祭の時間帯（9〜17 時）に深谷津へ向かう便はありません。',
	},
	{
		id: 'inbound-kosen',
		direction: '復路',
		route: '茨城高専前発 → 勝田駅',
		stop: '茨城高専前',
		stopNote: '正門を出て南へ進むと乗り場です。',
		times: ['15:00', '15:30', '16:10', '16:50'],
		regularTimes: ['15:01', '15:16', '15:31', '16:11', '16:31'],
	},
	{
		id: 'inbound-fukayatsu',
		direction: '復路',
		route: '深谷津発 → 勝田駅',
		stop: '深谷津',
		stopNote: '茨城高専前からは離れています。',
		times: [],
		regularTimes: ['8:38', '17:47'],
		caveat: '土曜ダイヤでは 8:38 の次が 17:47 です。茨香祭の時間帯（9〜17 時）に深谷津から勝田駅へ向かう便はありません。',
	},
];

/** バス運賃（片道・行き帰りとも同額）。茨城交通の運賃（2026/10/04 時点）。改定されたら見直す。 */
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
		route: '勝田駅〜深谷津',
		prices: [{ label: '大人・小人とも', price: '100円' }],
	},
] as const;

export interface BusDeparture {
	/** "HH:mm" 形式の出発時刻。 */
	time: string;
	/** 茨城高専スクールバス（臨時便）なら true、茨城交通の定期便なら false。 */
	extra: boolean;
}

export interface BusTimetable extends BusRoute {
	/** 臨時便と定期便を時刻順に並べたリスト（同時刻は定期便が先）。 */
	departures: BusDeparture[];
}

function toMinutes(time: string): number {
	const [hour, minute] = time.split(':').map(Number);
	return hour * 60 + minute;
}

/** 臨時便と定期便を 1 本の時刻順リストにまとめる（同時刻のときは定期便が先）。 */
export function getBusTimetables(routes: BusRoute[] = BUS_ROUTES): BusTimetable[] {
	return routes.map((route) => ({
		...route,
		departures: [
			...route.regularTimes.map((time) => ({ time, extra: false })),
			...route.times.map((time) => ({ time, extra: true })),
		].sort((a, b) => toMinutes(a.time) - toMinutes(b.time)),
	}));
}

/** JST の日付部分（YYYY-MM-DD）。 */
function jstDateKey(date: Date): string {
	return new Intl.DateTimeFormat('en-CA', { timeZone: 'Asia/Tokyo' }).format(date);
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
	stop: string;
	time: string;
	extra: boolean;
	/** 出発までの残り分数（切り上げ）。発車済みなら 0。 */
	minutesLeft: number;
	departureDate: Date;
}

/**
 * 指定した時刻（now）以降に出発する便を、方向ごとに分けて返す。
 * 各方向とも出発時刻が早い順に並び、デフォルトで直近 3 本まで。
 *
 * 当日（serviceDate、既定は茨香祭 1 日目）は、臨時便を含めた実際のダイヤで
 * 計算する。当日以外は、茨城交通の定期便だけを「今日のダイヤ」とみなして
 * 計算する（土曜ダイヤかどうかなどは考慮しない、あくまで目安の案内）。
 *
 * どちらの場合も、今日の残り時間に便がなければそのまま空にする
 * （＝「本日はもう発車しない」）。3 本に満たないからといって翌日の
 * 始発を混ぜることはしない。翌日の便を含めると、当日は最終便の案内が
 * 「本日はもうない」から「明日の始発」にすり替わってしまい、当日以外は
 * 実在しない「本日」の便として明日の時刻を見せてしまうため。
 */
export function getUpcomingDepartures(
	now: Date,
	options: { limit?: number; serviceDate?: string; timetables?: BusTimetable[] } = {},
): Record<BusDirection, UpcomingDeparture[]> {
	const { limit = 3, serviceDate = BUS_SERVICE_DATE, timetables = getBusTimetables() } = options;

	const isServiceDay = jstDateKey(now) === serviceDate;
	// 当日以外は定期便のみを対象にする（臨時便は 1 日目限定の増便のため）。
	const effectiveTimetables = isServiceDay
		? timetables
		: timetables.map((timetable) => ({
				...timetable,
				departures: timetable.departures.filter((departure) => !departure.extra),
			}));

	const dateKey = isServiceDay ? serviceDate : jstDateKey(now);

	const all: UpcomingDeparture[] = effectiveTimetables.flatMap((timetable) =>
		timetable.departures.map((departure) => {
			const departureDate = toDepartureDate(departure.time, dateKey);
			return {
				routeId: timetable.id,
				direction: timetable.direction,
				route: timetable.route,
				stop: timetable.stop,
				time: departure.time,
				extra: departure.extra,
				minutesLeft: Math.max(0, Math.ceil((departureDate.getTime() - now.getTime()) / 60_000)),
				departureDate,
			};
		}),
	);

	const upcoming = all
		.filter((departure) => departure.departureDate.getTime() >= now.getTime())
		.sort((a, b) => a.departureDate.getTime() - b.departureDate.getTime());

	const byDirection: Record<BusDirection, UpcomingDeparture[]> = { 往路: [], 復路: [] };
	for (const departure of upcoming) {
		const bucket = byDirection[departure.direction];
		if (bucket.length < limit) bucket.push(departure);
	}
	return byDirection;
}
