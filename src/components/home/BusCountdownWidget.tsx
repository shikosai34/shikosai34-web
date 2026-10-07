import { useEffect, useRef, useState } from 'react';
import { BUS_SERVICE_DATE, getUpcomingDepartures, type BusDirection, type UpcomingDeparture } from '../../lib/bus';
import BusIcon from '../icons/BusIcon';
import CloseIcon from '../icons/CloseIcon';

const DIRECTIONS: BusDirection[] = ['往路', '復路'];

/** 当日（臨時便の運行日）かどうか。表示文言の出し分けに使う。 */
function isServiceDay(now: Date) {
	const key = new Intl.DateTimeFormat('en-CA', { timeZone: 'Asia/Tokyo' }).format(now);
	return key === BUS_SERVICE_DATE;
}

/** 60分を超える場合は「1時間35分」のように時間も添える。 */
function formatMinutesLeft(minutesLeft: number) {
	if (minutesLeft <= 0) return 'まもなく発車';
	if (minutesLeft < 60) return `あと${minutesLeft}分`;
	const hours = Math.floor(minutesLeft / 60);
	const minutes = minutesLeft % 60;
	return minutes === 0 ? `あと${hours}時間` : `あと${hours}時間${minutes}分`;
}

function DepartureRow({ departure }: { departure: UpcomingDeparture }) {
	return (
		<li className="flex items-center justify-between gap-3 rounded-lg border border-text/15 bg-base px-3 py-2">
			<div className="min-w-0">
				<p className="flex flex-wrap items-center gap-x-2 gap-y-0.5 text-sm text-text">
					<time className="font-medium tabular-nums">{departure.time}</time>
					<span className="text-xs text-text/70">{departure.stop}</span>
					{departure.extra ? (
						<span className="rounded-full bg-main px-2 py-0.5 text-[10px] font-medium text-base">臨時便</span>
					) : null}
				</p>
			</div>
			<p className="shrink-0 text-sm font-medium whitespace-nowrap tabular-nums text-accent">
				{formatMinutesLeft(departure.minutesLeft)}
			</p>
		</li>
	);
}

/**
 * トップページ右上、ハンバーガーメニューの左に常駐する、バスの発車カウントダウン。
 *
 * AtCoder のコンテスト中カウントダウンのように、普段は小さなピル1つだけを
 * 置いておき、タップしたときだけ詳細（往路・復路それぞれ直近3本の時刻）を
 * ダイアログで開く。常時表示なので、閉じた状態の存在感は最小限にする。
 * 乗り場・運賃など時刻以外の案内は、重複を避けてアクセスページへ誘導する。
 *
 * 位置は Header.tsx のメニューボタン（top-3・右端 px-3・幅 16=4rem）に
 * あわせている。両者は独立したコンポーネントなので、どちらかのサイズや
 * 余白を変えたときはもう片方の位置もずれていないか確認すること。
 */
export default function BusCountdownWidget() {
	const dialogRef = useRef<HTMLDialogElement>(null);
	// 描画のたびに時刻が変わるため、サーバー出力との差が出ないよう
	// マウントされるまでは null（＝まだ何も分からない状態）を出す。
	const [now, setNow] = useState<Date | null>(null);
	const [open, setOpen] = useState(false);

	useEffect(() => {
		const update = () => setNow(new Date());
		update();
		const timer = window.setInterval(update, 1000 * 15);
		return () => window.clearInterval(timer);
	}, []);

	const today = now ? isServiceDay(now) : false;
	const byDirection = now ? getUpcomingDepartures(now) : { 往路: [], 復路: [] };
	const nextOverall = now
		? DIRECTIONS.map((direction) => byDirection[direction][0])
				.filter((departure): departure is UpcomingDeparture => Boolean(departure))
				.sort((a, b) => a.departureDate.getTime() - b.departureDate.getTime())[0]
		: undefined;
	// 今日の最終便（当日は臨時便、当日以外は定期便）を過ぎたら「本日はもう
	// 発車しない」を出す。翌日の便は混ぜない。日付が変われば次の更新で
	// 新しい「今日」のダイヤとして再計算される。
	const finishedForToday = Boolean(now) && !nextOverall;

	const openDialog = () => {
		setOpen(true);
		const dialog = dialogRef.current;
		if (dialog && !dialog.open) dialog.showModal();
	};
	const closeDialog = () => dialogRef.current?.close();

	return (
		<>
			<button
				type="button"
				onClick={openDialog}
				aria-haspopup="dialog"
				aria-expanded={open}
				aria-label={
					finishedForToday
						? '本日のバスの発車は終了しました。タップで時刻表を開く'
						: nextOverall
							? `次のバス（${nextOverall.direction}）は${formatMinutesLeft(nextOverall.minutesLeft)}。タップで時刻表を開く`
							: 'バスの時刻表を開く'
				}
				className="surface-panel fixed top-[2.75rem] right-[5.25rem] z-40 flex w-max max-w-[11rem] -translate-y-1/2 items-center gap-1.5 rounded-full py-2 pr-3 pl-2.5 text-left shadow-lg transition-transform hover:scale-105 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accent"
			>
				<BusIcon className="h-5 w-5 shrink-0 text-accent" />
				{finishedForToday ? (
					<span className="text-xs leading-tight text-text/70">
						本日の
						<br />
						発車終了
					</span>
				) : nextOverall ? (
					<span className="min-w-0 leading-tight text-text">
						<span className="block truncate text-[10px] text-text/70">{nextOverall.direction}</span>
						<span className="block text-sm font-medium tabular-nums whitespace-nowrap">
							{formatMinutesLeft(nextOverall.minutesLeft)}
						</span>
					</span>
				) : (
					<span className="block text-sm font-medium text-text/70">--</span>
				)}
			</button>

			{/*
			 * dialog 自体を画面いっぱいの透明な層にし、中の面を flex で
			 * 上下左右の中央に置く。Tailwind Preflight が <dialog> 既定の
			 * margin: auto を消すため、ブラウザ任せの中央寄せには頼らない
			 * （MainVisualLightbox と同じやり方）。
			 */}
			<dialog
				ref={dialogRef}
				onClose={() => setOpen(false)}
				className="fixed inset-0 m-0 h-dvh max-h-none w-screen max-w-none bg-transparent p-0"
				aria-label="バスの発車カウントダウン"
			>
				<div
					className="flex h-full w-full items-center justify-center bg-black/70 p-4"
					onClick={(event) => {
						// 面の外側（＝背景）を押したときだけ閉じる。
						if (event.target === event.currentTarget) closeDialog();
					}}
				>
					<div className="surface-panel max-h-[85vh] w-full max-w-lg overflow-y-auto rounded-2xl p-4 pt-5 pb-6 text-text sm:p-6">
						<div className="mb-4 flex items-center justify-between gap-3">
							<div className="flex items-center gap-2">
								<BusIcon className="h-6 w-6 shrink-0 text-accent" />
								<h2 className="text-lg font-medium tracking-wide text-text">バスの発車カウントダウン</h2>
							</div>
							<button
								type="button"
								aria-label="閉じる"
								onClick={closeDialog}
								className="shrink-0 rounded-full p-1.5 text-text/70 transition-colors hover:bg-text/10 hover:text-text"
							>
								<CloseIcon className="h-5 w-5" />
							</button>
						</div>

						<p className="text-xs text-text/60">
							{today
								? '1日目（10月24日）の当日ダイヤです。茨城高専スクールバス（臨時便）・茨城交通の定期便の両方を含みます。時刻は出発時刻の目安です。'
								: '茨城交通の定期便の時刻です。茨城高専スクールバス（臨時便）は1日目（10月24日）のみ運行します。'}
						</p>

						<div className="mt-5 space-y-6">
							{DIRECTIONS.map((direction) => (
								<section key={direction} aria-label={direction}>
									<h3 className="border-b-2 border-text/25 pb-2 text-sm font-medium text-main">{direction}</h3>
									{byDirection[direction].length > 0 ? (
										<ul className="mt-3 space-y-2">
											{byDirection[direction].map((departure) => (
												<DepartureRow key={`${departure.routeId}-${departure.time}`} departure={departure} />
											))}
										</ul>
									) : (
										<p className="mt-3 text-sm text-text/70">本日、この方向の発車はもうありません。</p>
									)}
								</section>
							))}
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
		</>
	);
}
