import { useEffect, useRef, useState, type RefObject } from 'react';
import {
	BUS_OPERATOR_LABELS,
	getBusTimetables,
	getUpcomingDepartures,
	SHUTTLE_SERVICE_DATES,
	type BusTimetable,
	type DepartureStop,
	type UpcomingDeparture,
} from '../../lib/bus';
import BusIcon from '../icons/BusIcon';
import CloseIcon from '../icons/CloseIcon';

/** 「次」「次々」の見出し。駅の発車標の「次」「次々」表記にならう。 */
const ORDER_LABELS = ['次', '次々'];

/** 発車標の列。左＝勝田駅発、右＝高専・深谷津発（復路側）。 */
const COLUMNS: { heading: string; stops: DepartureStop[] }[] = [
	{ heading: '勝田駅発', stops: ['勝田駅'] },
	{ heading: '茨城高専前・深谷津発', stops: ['茨城高専前', '深谷津'] },
];

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

/** 発車標 1 行分（経路・時刻・残り時間）。 */
function DepartureRow({ order, departure }: { order: string; departure: UpcomingDeparture }) {
	return (
		<li className="flex items-center gap-3 rounded-lg border border-text/15 bg-base px-3 py-2.5">
			<span className="w-6 shrink-0 text-center text-xs font-medium text-text/50">{order}</span>
			<div className="min-w-0 flex-1">
				<p className="flex flex-wrap items-center gap-x-1.5 gap-y-0.5 text-sm text-text">
					<span className="truncate">{departure.from}</span>
					<span aria-hidden="true" className="text-text/40">
						→
					</span>
					<span className="truncate text-text/80">{departure.stop}</span>
					{departure.extra ? (
						<span className="rounded-full bg-main px-2 py-0.5 text-[10px] font-medium text-base">臨時便</span>
					) : departure.operator === 'smile' ? (
						<span className="rounded-full border border-text/30 px-2 py-0.5 text-[10px] font-medium text-text/70">
							{BUS_OPERATOR_LABELS.smile}
						</span>
					) : null}
				</p>
			</div>
			<time className="shrink-0 font-primary text-lg font-medium tabular-nums text-text">{departure.time}</time>
			<p className="w-20 shrink-0 text-right text-xs font-medium whitespace-nowrap tabular-nums text-accent">
				{formatMinutesLeft(departure.minutesLeft)}
			</p>
		</li>
	);
}

/** 時刻表ダイアログの 1 系統分。経路見出しと、全便を時刻順に並べたリスト。 */
function TimetableSection({ timetable }: { timetable: BusTimetable }) {
	return (
		<section aria-labelledby={`timetable-${timetable.id}`}>
			<div className="flex flex-wrap items-baseline justify-between gap-x-3 gap-y-1">
				<h4 id={`timetable-${timetable.id}`} className="text-sm font-medium text-text">
					{timetable.route}
				</h4>
				<span className="text-xs text-text/60">下車：{timetable.stop}</span>
			</div>
			<p className="mt-0.5 text-xs text-text/60">{timetable.stopNote}</p>
			{timetable.departures.length > 0 ? (
				<ul className="mt-2 flex flex-wrap gap-1.5">
					{timetable.departures.map((departure) => (
						<li
							key={`${timetable.id}-${departure.time}`}
							className={`rounded-md border px-2 py-1 text-xs tabular-nums ${
								departure.extra
									? 'border-main/40 bg-main/10 font-medium text-text'
									: departure.operator === 'smile'
										? 'border-text/20 bg-base text-text/80'
										: 'border-text/15 bg-base text-text'
							}`}
						>
							{departure.time}
							{departure.extra ? '（臨）' : departure.operator === 'smile' ? '（ス）' : ''}
						</li>
					))}
				</ul>
			) : (
				<p className="mt-2 text-xs text-text/60">この系統の便はありません。</p>
			)}
			{timetable.caveat && <p className="mt-2 text-xs leading-relaxed text-text/60">{timetable.caveat}</p>}
		</section>
	);
}

/** 全系統・全便の時刻表ダイアログ。 */
function TimetableDialog({ dialogRef, isShuttleDay: shuttleDay }: { dialogRef: RefObject<HTMLDialogElement | null>; isShuttleDay: boolean }) {
	const weekdayTimetables = getBusTimetables('weekday');
	const weekendTimetables = getBusTimetables('weekend');

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
				<div className="surface-panel max-h-[85vh] w-full max-w-2xl overflow-y-auto rounded-2xl p-4 pt-5 pb-6 text-text sm:p-6">
					<div className="mb-4 flex items-center justify-between gap-3">
						<div className="flex items-center gap-2">
							<BusIcon className="h-6 w-6 shrink-0 text-accent" />
							<h2 className="text-lg font-medium tracking-wide text-text">バス時刻表一覧</h2>
						</div>
						<button
							type="button"
							aria-label="閉じる"
							onClick={() => dialogRef.current?.close()}
							className="shrink-0 rounded-full p-1.5 text-text/70 transition-colors hover:bg-text/10 hover:text-text"
						>
							<CloseIcon className="h-5 w-5" />
						</button>
					</div>

					<p className="text-xs text-text/60">
						茨城交通（定期便）とスマイルあおぞらバス（表示は「ス」）の全便です。
						{shuttleDay ? '本日は茨城高専スクールバス（表示は「臨」）も運行します。' : '茨城高専スクールバス（臨時便）は茨香祭当日のみ運行します。'}
						時刻は出発時刻の予定で、遅延は反映されません。
					</p>

					<div className="mt-5 space-y-6">
						<div>
							<h3 className="border-b-2 border-text/25 pb-2 text-sm font-medium text-main">平日ダイヤ</h3>
							<div className="mt-3 space-y-4">
								{weekdayTimetables.map((timetable) => (
									<TimetableSection key={timetable.id} timetable={timetable} />
								))}
							</div>
						</div>
						<div>
							<h3 className="border-b-2 border-text/25 pb-2 text-sm font-medium text-main">土日祝ダイヤ</h3>
							<div className="mt-3 space-y-4">
								{weekendTimetables.map((timetable) => (
									<TimetableSection key={timetable.id} timetable={timetable} />
								))}
							</div>
						</div>
					</div>

					<p className="mt-6 text-center text-xs leading-relaxed text-text/60">
						乗り場・運賃など詳しい案内は
						<a
							href="/access"
							className="text-accent underline underline-offset-4 hover:decoration-2 focus-visible:rounded-sm focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accent"
						>
							アクセスページ
						</a>
						をご覧ください。
					</p>
				</div>
			</div>
		</dialog>
	);
}

/** 1 列分（勝田駅発 or 高専・深谷津発）。複数の出発地点の便を時刻順にまとめる。 */
function DepartureColumn({ heading, stops, byStop }: { heading: string; stops: DepartureStop[]; byStop: Record<DepartureStop, UpcomingDeparture[]> }) {
	const departures = stops
		.flatMap((stop) => byStop[stop])
		.sort((a, b) => a.departureDate.getTime() - b.departureDate.getTime())
		.slice(0, ORDER_LABELS.length);

	return (
		<div>
			<h3 className="text-sm font-medium text-text">{heading}</h3>
			{departures.length > 0 ? (
				<ul className="mt-2 space-y-2">
					{departures.map((departure, index) => (
						<DepartureRow key={`${departure.routeId}-${departure.time}`} order={ORDER_LABELS[index]} departure={departure} />
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
 * トップページに常設する、駅の発車標ふうのバス発車カウントダウン。
 *
 * 「勝田駅発」「茨城高専前・深谷津発」の 2 列に分け、各列とも次発・次々発の
 * 2 本を時刻と残り時間つきで表示する。定期便は曜日から平日・休日ダイヤを
 * 自動判定し、茨香祭当日（SHUTTLE_SERVICE_DATES）は臨時便も合わせて出す。
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
	const byStop = now ? getUpcomingDepartures(now) : { 勝田駅: [], 茨城高専前: [], 深谷津: [] };

	const dialogRef = useRef<HTMLDialogElement>(null);
	const openTimetableDialog = () => {
		const dialog = dialogRef.current;
		if (dialog && !dialog.open) dialog.showModal();
	};

	return (
		<section className="surface-panel mt-6 rounded-2xl p-4 pt-6 pb-6 text-text sm:p-6">
			<div className="flex items-center gap-2">
				<BusIcon className="h-6 w-6 shrink-0 text-accent" />
				<h2 className="text-lg font-medium tracking-wide text-text">バス発車カウントダウン</h2>
			</div>

			<p className="mt-2 text-xs text-text/60">
				{today
					? '茨城高専スクールバス（臨時便）・茨城交通の定期便の両方を含みます。時刻は出発時刻の予定で、遅延は反映されません。'
					: '茨城交通の定期便の時刻です。茨城高専スクールバス（臨時便）は茨香祭当日のみ運行します。'}
			</p>

			<div className="mt-4 grid gap-6 sm:grid-cols-2">
				{COLUMNS.map((column) => (
					<DepartureColumn key={column.heading} heading={column.heading} stops={column.stops} byStop={byStop} />
				))}
			</div>

			<div className="mt-5 text-center">
				<button
					type="button"
					onClick={openTimetableDialog}
					aria-haspopup="dialog"
					className="inline-block rounded-full border border-text/30 px-4 py-2 text-sm text-text transition-colors hover:border-accent hover:text-accent focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accent"
				>
					時刻表はこちら
				</button>
			</div>

			<TimetableDialog dialogRef={dialogRef} isShuttleDay={today} />
		</section>
	);
}
