import { useEffect, useState } from 'react';
import { getCountdown, type Countdown } from '../../lib/countdown';
import SectionHeading from '../ui/SectionHeading';

function pad(value: number) {
	return String(value).padStart(2, '0');
}

function Unit({ value, label }: { value: string; label: string }) {
	return (
		<div className="hud-frame flex flex-col items-center px-1 py-3 sm:py-4">
			<span className="font-primary text-3xl tabular-nums text-accent sm:text-4xl lg:text-5xl">
				{value}
			</span>
			<span className="mt-1 text-xs tracking-widest text-text/70">{label}</span>
		</div>
	);
}

export default function CountdownSection() {
	// 描画のたびに時刻が変わるため、サーバー出力との差が出ないよう
	// マウントされるまでは「--」を出す。
	const [countdown, setCountdown] = useState<Countdown | null>(null);

	useEffect(() => {
		const update = () => setCountdown(getCountdown(new Date()));
		update();
		const timer = window.setInterval(update, 1000);
		return () => window.clearInterval(timer);
	}, []);

	const percent = countdown ? countdown.elapsedPercent : 0;

	return (
		<section className="surface-panel mt-8 rounded-2xl p-4 pt-6 pb-6 text-text sm:p-6">
			<SectionHeading title="Countdown" icon="clock" subtitle="開催まで" />

			{countdown?.finished ? (
				<p className="text-center font-primary text-xl text-accent">茨香祭、開幕！</p>
			) : (
				<>
					<p className="mb-3 text-sm text-text/80">10月24日（土）9:00 の開場まで</p>
					<div className="grid grid-cols-4 gap-2 sm:gap-3" role="timer" aria-label="開催までの残り時間">
						<Unit value={countdown ? String(countdown.days) : '--'} label="日" />
						<Unit value={countdown ? pad(countdown.hours) : '--'} label="時間" />
						<Unit value={countdown ? pad(countdown.minutes) : '--'} label="分" />
						<Unit value={countdown ? pad(countdown.seconds) : '--'} label="秒" />
					</div>
				</>
			)}

			<div className="mt-5">
				<div className="mb-1.5 flex items-baseline justify-between text-xs text-text/70">
					<span>経過率</span>
					<span className="font-primary text-base tabular-nums text-accent">
						{countdown ? percent.toFixed(1) : '--'}
						<span className="text-xs">%</span>
					</span>
				</div>
				<div
					className="h-2 overflow-hidden rounded-full bg-text/10"
					role="progressbar"
					aria-label="開催までの経過率"
					aria-valuemin={0}
					aria-valuemax={100}
					aria-valuenow={countdown ? Math.round(percent) : undefined}
				>
					<div
						className="h-full rounded-full bg-accent shadow-[0_0_8px_color-mix(in_srgb,var(--color-accent)_70%,transparent)]"
						style={{ width: `${percent}%` }}
					/>
				</div>
			</div>
		</section>
	);
}
