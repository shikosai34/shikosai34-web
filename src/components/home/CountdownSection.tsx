import { useEffect, useState } from 'react';
import { getCountdown, type Countdown } from '../../lib/countdown';
import SectionHeading from '../ui/SectionHeading';

function Unit({ value, label }: { value: string; label: string }) {
	return (
		<span className="flex items-baseline gap-1">
			<span className="font-primary text-5xl tabular-nums text-accent sm:text-6xl">{value}</span>
			<span className="text-base text-text/80 sm:text-lg">{label}</span>
		</span>
	);
}

export default function CountdownSection() {
	// 描画のたびに時刻が変わるため、サーバー出力との差が出ないよう
	// マウントされるまでは「--」を出す。
	const [countdown, setCountdown] = useState<Countdown | null>(null);

	useEffect(() => {
		const update = () => setCountdown(getCountdown(new Date()));
		update();
		const timer = window.setInterval(update, 30_000);
		return () => window.clearInterval(timer);
	}, []);

	return (
		<section className="surface-panel mt-8 rounded-2xl p-4 pt-6 pb-6 text-text sm:p-6">
			<SectionHeading title="Countdown" icon="clock" />

			{countdown?.finished ? (
				<p className="text-center font-primary text-xl text-accent">茨香祭、開幕！</p>
			) : (
				<div className="flex items-baseline justify-center gap-6" role="timer" aria-label="開催までの残り時間">
					<Unit value={countdown ? String(countdown.days) : '--'} label="日" />
					<Unit value={countdown ? String(countdown.hours) : '--'} label="時間" />
				</div>
			)}
		</section>
	);
}
