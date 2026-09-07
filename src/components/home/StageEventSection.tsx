import { useEffect, useState } from 'react';
import type { HomeStageEventData, HomeStageEventState } from '../../lib/next-stage-event';
import {
	getHomeStageEventState,
	getInitialHomeStageEventState,
} from '../../lib/next-stage-event';
import ArrowRightIcon from '../icons/ArrowRightIcon';
import Button from '../ui/Button';
import SectionHeading from '../ui/SectionHeading';

interface Props {
	events?: HomeStageEventData[];
}

const dateFormatter = new Intl.DateTimeFormat('ja-JP', {
	month: 'numeric',
	day: 'numeric',
	weekday: 'short',
	timeZone: 'Asia/Tokyo',
});

const timeFormatter = new Intl.DateTimeFormat('ja-JP', {
	hour: '2-digit',
	minute: '2-digit',
	hour12: false,
	timeZone: 'Asia/Tokyo',
});

const dateKeyFormatter = new Intl.DateTimeFormat('en-CA', {
	year: 'numeric',
	month: '2-digit',
	day: '2-digit',
	timeZone: 'Asia/Tokyo',
});

function formatDate(date: Date) {
	return dateFormatter.format(date).replace('/', '月').replace('(', '日（').replace(')', '）');
}

function getTimingLabel(state: HomeStageEventState, now: Date | null) {
	if (state.kind === 'empty') return 'ステージ企画は準備中です';
	if (state.kind === 'finished') return 'すべての演目が終了しました';
	if (state.kind === 'current') {
		return `${timeFormatter.format(new Date(state.event.endAt))}まで`;
	}

	const startAt = new Date(state.event.startAt);
	if (now) {
		const minutes = Math.max(1, Math.ceil((startAt.getTime() - now.getTime()) / 60_000));
		if (dateKeyFormatter.format(startAt) === dateKeyFormatter.format(now)) {
			return minutes <= 120 ? `開始まであと${minutes}分` : `本日 ${timeFormatter.format(startAt)}から`;
		}
	}
	return `${formatDate(startAt)} ${timeFormatter.format(startAt)}から`;
}

export default function StageEventSection({ events = [] }: Props) {
	const [state, setState] = useState<HomeStageEventState>(() =>
		getInitialHomeStageEventState(events),
	);
	const [now, setNow] = useState<Date | null>(null);

	useEffect(() => {
		const update = () => {
			const currentTime = new Date();
			setNow(currentTime);
			setState(getHomeStageEventState(events, currentTime));
		};
		update();
		const timer = window.setInterval(update, 30_000);
		return () => window.clearInterval(timer);
	}, [events]);

	const event = state.kind === 'next' || state.kind === 'current' ? state.event : null;

	return (
		<section className="mx-4 mt-8 rounded-2xl bg-base p-4 pt-6 pb-6 text-text">
			<SectionHeading title="Stage Events" />
			<p className="text-sm leading-relaxed text-text/80">
				体育館ステージのイベント情報はこちらから確認できます。
			</p>

			<div className="mt-4 rounded-xl border border-accent/50 bg-text/5 p-4" aria-live="polite">
				<div className="flex flex-wrap items-center justify-between gap-2 text-xs">
					<p className="font-medium text-accent">
						{state.kind === 'next'
							? '次の演目'
							: state.kind === 'current'
								? 'ただいま上演中'
								: getTimingLabel(state, now)}
					</p>
					{event ? <p className="text-text/70">{getTimingLabel(state, now)}</p> : null}
				</div>
				{event ? (
					<>
						<div className="mt-2 flex flex-wrap items-center gap-2">
							<time dateTime={event.startAt} className="text-lg font-medium text-text">
								{formatDate(new Date(event.startAt))} {timeFormatter.format(new Date(event.startAt))}
							</time>
							{event.status === 'changed' ? (
								<span className="rounded bg-main px-2 py-0.5 text-xs font-medium text-base">
									時間変更あり
								</span>
							) : null}
						</div>
						<h2 className="mt-2 text-xl font-medium text-text">{event.title}</h2>
						<p className="mt-1 text-sm text-text/70">{event.performer}</p>
						<a
							href={event.href}
							className="mt-3 inline-flex items-center gap-1 text-sm text-accent underline hover:no-underline"
						>
							企画の詳細を見る
							<ArrowRightIcon className="h-4 w-4" />
						</a>
					</>
				) : (
					<p className="mt-2 text-sm text-text/70">
						{state.kind === 'finished'
							? 'ご来場ありがとうございました。'
							: '公開までしばらくお待ちください。'}
					</p>
				)}
			</div>

			<div className="mt-5 grid gap-2 sm:flex sm:flex-wrap sm:justify-end">
				<Button href="/event" variant="outline" className="justify-center">
					イベント一覧
				</Button>
				<Button href="/timetable" variant="main" className="justify-center">
					タイムテーブルを見る
					<ArrowRightIcon className="h-4 w-4" />
				</Button>
			</div>
		</section>
	);
}
