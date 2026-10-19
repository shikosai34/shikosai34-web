import { useEffect, useRef, useState, type RefObject } from 'react';
import {
	BUS_OPERATOR_LABELS,
	BUS_ROUTES,
	getBusTimetables,
	getScheduleKind,
	getUpcomingDepartures,
	SHUTTLE_SERVICE_DATES,
	type BusDeparture,
	type BusTimetable,
	type ScheduleKind,
	type UpcomingDeparture,
} from '../../lib/bus';
import BusIcon from '../icons/BusIcon';
import CloseIcon from '../icons/CloseIcon';

/** 「次」「次々」の見出し。駅の発車標の「次」「次々」表記にならう。 */
const ORDER_LABELS = ['次', '次々'];

/** 発車標の列。茨城高専に行く便・高専から帰る便に絞る（深谷津など高専前を通らない系統は載せない）。 */
const COLUMNS: { heading: string; routeId: string; stop: '勝田駅' | '茨城高専前' }[] = [
	{ heading: '勝田駅 → 茨城高専（行き）', routeId: 'outbound-kosen', stop: '勝田駅' },
	{ heading: '茨城高専 → 勝田駅（帰り）', routeId: 'inbound-kosen', stop: '茨城高専前' },
];

/** 発車標が対象にする系統。 */
const BOARD_ROUTES = BUS_ROUTES.filter((route) => COLUMNS.some((column) => column.routeId === route.id));

/** 当日（臨時便の運行日）かどうか。表示文言の出し分けに使う。 */
function isShuttleDay(now: Date) {
	const key = new Intl.DateTimeFormat('en-CA', { timeZone: 'Asia/Tokyo' }).format(now);
	return SHUTTLE_SERVICE_DATES.includes(key);
}

/** 60分を超える場合は「1時間35分」のように時間も添える。 */
function formatMinutesLeft(minutesLeft: number) {
	if (minutesLeft <= 0) return 'まもなく発車';
	if (minutesLeft < 60) return `あと${minutesLeft}分`;
	const hours = Math.floor(minutesLeft / 60);
	const minutes = minutesLeft % 60;
	return minutes === 0 ? `あと${hours}時間` : `あと${hours}時間${minutes}分`;
}

/** 発車標 1 行分（行先・時刻・残り時間）。 */
function DepartureRow({ order, departure }: { order: string; departure: UpcomingDeparture }) {
	return (
		<li className="flex items-center gap-2 rounded-lg border border-text/15 bg-base px-3 py-2.5">
			<span className="w-6 shrink-0 text-center text-xs font-medium text-text/50">{order}</span>
			<div className="min-w-0 flex-1">
				<p className="flex flex-wrap items-center gap-x-2 gap-y-1 text-sm text-text">
					{departure.headsign ? <span className="whitespace-nowrap">{departure.headsign}</span> : null}
					{departure.extra ? (
						<span className="rounded-full bg-main px-2 py-0.5 text-xs font-medium text-on-main">臨時便（臨）</span>
					) : departure.operator === 'smile' ? (
						<span className="rounded-full border border-text/30 px-2 py-0.5 text-xs font-medium text-text/70">
							{BUS_OPERATOR_LABELS.smile}
						</span>
					) : null}
				</p>
			</div>
			<time className="shrink-0 font-primary text-lg font-medium tabular-nums text-text">{departure.time}</time>
			<p className="shrink-0 text-right text-sm font-medium whitespace-nowrap tabular-nums text-accent">
				{formatMinutesLeft(departure.minutesLeft)}
			</p>
		</li>
	);
}

/** 時刻表チップの種別バッジ。色だけでなく文字でも臨時便・スマイルあおぞらバスを区別する。 */
function departureBadge(departure: BusDeparture) {
	if (departure.extra) return '臨';
	if (departure.operator === 'smile') return 'ス';
	return null;
}

/** 便を「時」ごとにまとめる。便のない時間帯は行にならない。 */
function groupByHour(departures: BusDeparture[]) {
	const groups: { hour: number; items: BusDeparture[] }[] = [];
	for (const departure of departures) {
		const hour = Number(departure.time.split(':')[0]);
		const last = groups[groups.length - 1];
		if (last && last.hour === hour) last.items.push(departure);
		else groups.push({ hour, items: [departure] });
	}
	return groups;
}

/** 時刻表の 1 便分。分だけを固定幅で出し、臨時便・スマイルあおぞらバスは印を添える。 */
function DepartureChip({ departure }: { departure: BusDeparture }) {
	const badge = departureBadge(departure);
	return (
		<span
			className={`flex h-8 w-14 items-center justify-center gap-0.5 rounded-md border text-sm tabular-nums ${
				departure.extra
					? 'border-main/50 bg-main/10 font-medium text-text'
					: departure.operator === 'smile'
						? 'border-text/30 text-text'
						: 'border-text/15 text-text'
			}`}
		>
			<time dateTime={departure.time}>{departure.time.split(':')[1]}</time>
			{badge ? (
				<span aria-label={departure.extra ? '臨時便' : 'スマイルあおぞらバス'} className="text-xs text-text/70">
					{badge}
				</span>
			) : null}
		</span>
	);
}

/** 時刻表ダイアログの 1 系統分。経路見出しと、時ごとに分を並べた表。 */
function TimetableSection({ timetable }: { timetable: BusTimetable }) {
	// 車両に出る行先表示。この系統の便に実際にあるものを、便数の多い順に出す。
	const headsignCounts = new Map<string, number>();
	for (const departure of timetable.departures) {
		if (departure.headsign) headsignCounts.set(departure.headsign, (headsignCounts.get(departure.headsign) ?? 0) + 1);
	}
	const headsigns = [...headsignCounts.entries()].sort((x, y) => y[1] - x[1]).map(([headsign]) => headsign);

	return (
		<section aria-labelledby={`timetable-${timetable.id}`} className="rounded-xl border border-text/15 p-3 sm:p-4">
			<div className="flex flex-wrap items-baseline justify-between gap-x-3 gap-y-1">
				<h4 id={`timetable-${timetable.id}`} className="text-base font-medium text-text">
					{timetable.route}
				</h4>
				<span className="text-sm text-accent">下車：{timetable.stop}</span>
			</div>
			<p className="mt-1 text-xs leading-relaxed text-text/70">
				{timetable.stopNote}
				{timetable.caveat}
			</p>
			{headsigns.length > 0 && (
				<p className="mt-1 text-xs leading-relaxed text-text/70">
					行先表示：<span className="font-medium text-text">{headsigns.join('／')}</span>
				</p>
			)}
			{timetable.departures.length > 0 ? (
				<dl className="mt-3 divide-y divide-text/10 border-y border-text/10">
					{groupByHour(timetable.departures).map(({ hour, items }) => (
						<div key={`${timetable.id}-${hour}`} className="flex items-start gap-3 py-2">
							<dt className="w-10 shrink-0 pt-1 text-right text-sm font-medium tabular-nums text-text">{hour}時</dt>
							<dd className="flex flex-1 flex-wrap gap-1.5">
								{items.map((departure, index) => (
									<DepartureChip key={`${timetable.id}-${departure.time}-${index}`} departure={departure} />
								))}
							</dd>
						</div>
					))}
				</dl>
			) : (
				<p className="mt-3 text-sm text-text/70">この系統の便はありません。</p>
			)}
		</section>
	);
}

/** ダイヤ種別の切り替え。 */
const SCHEDULE_KINDS: { kind: ScheduleKind; label: string }[] = [
	{ kind: 'weekday', label: '平日ダイヤ' },
	{ kind: 'weekend', label: '土日祝ダイヤ' },
];

/**
 * 全系統・全便の時刻表ダイアログ。
 *
 * 平日ダイヤと土日祝ダイヤを切り替えられる。開いた直後は今日のダイヤ
 * （scheduleKind）を表示する。臨時便は運行日が決まっているため、平日ダイヤの
 * 表には載せない。面は後ろのページが透けないよう不透明にする。
 */
function TimetableDialog({
	dialogRef,
	isShuttleDay: shuttleDay,
	scheduleKind,
}: {
	dialogRef: RefObject<HTMLDialogElement | null>;
	isShuttleDay: boolean;
	scheduleKind: ScheduleKind;
}) {
	const [selectedKind, setSelectedKind] = useState<ScheduleKind | null>(null);
	const kind = selectedKind ?? scheduleKind;
	const timetables = getBusTimetables(kind).map((timetable) =>
		kind === 'weekday' ? { ...timetable, departures: timetable.departures.filter((departure) => !departure.extra) } : timetable,
	);
	const directions: { label: string; timetables: BusTimetable[] }[] = [
		{ label: '往路（勝田駅 → 高専方面）', timetables: timetables.filter((t) => t.direction === '往路') },
		{ label: '復路（高専方面 → 勝田駅）', timetables: timetables.filter((t) => t.direction === '復路') },
	];

	return (
		<dialog
			ref={dialogRef}
			className="fixed inset-0 m-0 h-dvh max-h-none w-screen max-w-none bg-transparent p-0"
			aria-label="バス時刻表一覧"
		>
			<div
				className="flex h-full w-full items-center justify-center bg-black/70 p-4"
				onClick={(event) => {
					if (event.target === event.currentTarget) dialogRef.current?.close();
				}}
			>
				<div className="max-h-[85dvh] w-full max-w-2xl overflow-y-auto rounded-2xl border border-text/15 bg-base text-text shadow-2xl">
					<div className="sticky top-0 z-10 flex items-center justify-between gap-3 border-b border-text/15 bg-base px-4 py-3 sm:px-6">
						<div className="flex items-center gap-2">
							<BusIcon className="h-6 w-6 shrink-0 text-accent" />
							<h2 className="text-lg font-medium text-text">バス時刻表一覧</h2>
						</div>
						<button
							type="button"
							aria-label="閉じる"
							onClick={() => dialogRef.current?.close()}
							className="shrink-0 rounded-full p-2 text-text/70 transition-colors hover:bg-text/10 hover:text-text focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accent"
						>
							<CloseIcon className="h-5 w-5" />
						</button>
					</div>

					<div className="space-y-6 p-4 pb-6 sm:p-6 sm:pb-8">
						<div role="group" aria-label="ダイヤの種類" className="grid grid-cols-2 gap-2">
							{SCHEDULE_KINDS.map((option) => (
								<button
									key={option.kind}
									type="button"
									aria-pressed={kind === option.kind}
									onClick={() => setSelectedKind(option.kind)}
									className={`rounded-full border px-3 py-2 text-sm transition-colors focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accent ${
										kind === option.kind
											? 'border-accent bg-accent font-medium text-on-accent'
											: 'border-text/30 text-text hover:border-accent hover:text-accent'
									}`}
								>
									{option.label}
								</button>
							))}
						</div>

						<section aria-labelledby="timetable-guide" className="space-y-3 rounded-xl bg-text/5 p-3 sm:p-4">
							<h3 id="timetable-guide" className="text-sm font-medium text-text">
								見方
							</h3>
							<ul className="space-y-2 text-sm text-text">
								<li className="flex items-center gap-3">
									<DepartureChip departure={{ time: '9:15', extra: false, operator: 'ibako' }} />
									<span>茨城交通の定期便（印なし）</span>
								</li>
								<li className="flex items-center gap-3">
									<DepartureChip departure={{ time: '9:35', extra: true }} />
									<span>臨時便（臨）</span>
								</li>
								<li className="flex items-center gap-3">
									<DepartureChip departure={{ time: '8:14', extra: false, operator: 'smile' }} />
									<span>スマイルあおぞらバス（ス）</span>
								</li>
							</ul>
							<ul className="list-disc space-y-1 pl-5 text-xs leading-relaxed text-text/80">
								<li>左の「9時」などが時、枠の中の数字が出発時刻の分です。</li>
								<li>
									茨城高専へは、勝田駅前2番のりばの<span className="font-medium text-text">「海浜公園南口行」「中央研修所行」「東中根団地行」</span>（本郷台団地経由）に乗り、「茨城高専前」で降ります。
								</li>
								<li>
									{shuttleDay ? '臨時便は本日運行します。' : '臨時便は10月24日のみ運行します。'}
									時刻は出発時刻の予定で、遅延は反映されません。
								</li>
								<li>
									乗り場・運賃は
									<a
										href="/access"
										className="text-accent underline underline-offset-4 hover:decoration-2 focus-visible:rounded-sm focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accent"
									>
										アクセスページ
									</a>
									をご覧ください。
								</li>
							</ul>
						</section>

						{directions.map(({ label, timetables }) => (
							<div key={label} className="space-y-3">
								<h3 className="text-sm font-medium text-text/70">{label}</h3>
								{timetables.map((timetable) => (
									<TimetableSection key={timetable.id} timetable={timetable} />
								))}
							</div>
						))}

					</div>
				</div>
			</div>
		</dialog>
	);
}

/** 1 列分（勝田駅発 or 高専・深谷津発）。複数の出発地点の便を時刻順にまとめる。 */
function DepartureColumn({ heading, departures }: { heading: string; departures: UpcomingDeparture[] }) {
	return (
		<div>
			<h3 className="text-sm font-medium text-text">{heading}</h3>
			{departures.length > 0 ? (
				<ul className="mt-2 space-y-2">
					{departures.map((departure, index) => (
						<DepartureRow key={`${departure.routeId}-${departure.time}-${index}`} order={ORDER_LABELS[index]} departure={departure} />
					))}
				</ul>
			) : (
				<p className="mt-2 rounded-lg border border-dashed border-text/20 px-3 py-2.5 text-sm text-text/70">
					本日の発車はもうありません。
				</p>
			)}
		</div>
	);
}

/**
 * トップページに常設する「次のバス」案内。
 *
 * 茨城高専へ行く人・高専から帰る人が知りたいのは「次に乗れる、高専前に
 * 停まるバス」なので、勝田駅発（高専前行き）と高専前発（勝田駅行き）の
 * 2 列に絞り、各列とも次発・次々発の 2 本を行先・時刻・残り時間つきで出す。
 * 深谷津など高専前を通らない系統は全便の時刻表ダイアログにだけ載せる。
 * 定期便は曜日から平日・休日ダイヤを自動判定し、茨香祭当日
 * （SHUTTLE_SERVICE_DATES）は臨時便も合わせて出す。
 * 遅延情報は取得手段がないため、時刻表どおりの予定として表示する。
 */
export default function BusDepartureBoard() {
	// 描画のたびに時刻が変わるため、サーバー出力との差が出ないよう
	// マウントされるまでは null（＝まだ何も分からない状態）を出す。
	const [now, setNow] = useState<Date | null>(null);

	useEffect(() => {
		const update = () => setNow(new Date());
		update();
		const timer = window.setInterval(update, 1000 * 15);
		return () => window.clearInterval(timer);
	}, []);

	const today = now ? isShuttleDay(now) : false;
	const byStop = now
		? getUpcomingDepartures(now, { limit: ORDER_LABELS.length, routes: BOARD_ROUTES })
		: { 勝田駅: [], 茨城高専前: [], 深谷津: [] };

	const dialogRef = useRef<HTMLDialogElement>(null);
	const openTimetableDialog = () => {
		const dialog = dialogRef.current;
		if (dialog && !dialog.open) dialog.showModal();
	};

	return (
		<section className="surface-panel mt-6 rounded-2xl p-4 pt-6 pb-6 text-text sm:p-6">
			<div className="flex items-center gap-2">
				<BusIcon className="h-6 w-6 shrink-0 text-accent" />
				<h2 className="text-lg font-medium tracking-wide text-text">次のバス</h2>
			</div>

			<p className="mt-2 text-xs text-text/70">
				茨城高専前に停まるバスだけを表示しています。
				{today ? '' : '臨時便は10月24日のみ運行します。'}
			</p>

			<div className="mt-4 grid gap-6 sm:grid-cols-2">
				{COLUMNS.map((column) => (
					<DepartureColumn key={column.heading} heading={column.heading} departures={byStop[column.stop]} />
				))}
			</div>

			<div className="mt-5 text-center">
				<button
					type="button"
					onClick={openTimetableDialog}
					aria-haspopup="dialog"
					className="inline-block rounded-full border border-text/30 px-4 py-2 text-sm text-text transition-colors hover:border-accent hover:text-accent focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accent"
				>
					全便の時刻表を見る
				</button>
			</div>

			<TimetableDialog dialogRef={dialogRef} isShuttleDay={today} scheduleKind={now ? getScheduleKind(now) : 'weekend'} />
		</section>
	);
}
