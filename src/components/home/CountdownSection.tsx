import { useEffect, useState } from 'react';
import { getCountdown, type Countdown } from '../../lib/countdown';

function pad(value: number) {
	return String(value).padStart(2, '0');
}

function Unit({ value, label }: { value: string; label: string }) {
	return (
		<span className="flex items-baseline gap-1">
			<span className="font-primary text-3xl tabular-nums text-accent drop-shadow-[0_0_8px_color-mix(in_srgb,var(--color-accent)_60%,transparent)] sm:text-5xl">{value}</span>
			<span className="text-base text-text/80 sm:text-lg">{label}</span>
		</span>
	);
}

interface Props {
	/** 「茨香祭」のロゴ画像（Astro 側で import した src を渡す）。 */
	logoSrc: string;
}

export default function CountdownSection({ logoSrc }: Props) {
	// 描画のたびに時刻が変わるため、サーバー出力との差が出ないよう
	// マウントされるまでは「--」を出す。
	const [countdown, setCountdown] = useState<Countdown | null>(null);

	useEffect(() => {
		const update = () => setCountdown(getCountdown(new Date()));
		update();
		const timer = window.setInterval(update, 1000);
		return () => window.clearInterval(timer);
	}, []);

	return (
		<section className="surface-panel mt-6 rounded-2xl p-4 pt-6 pb-6 text-text sm:p-6">
			<div className="mb-4 flex items-center justify-center gap-3">
				<img src={logoSrc} alt="茨香祭" className="h-8 w-auto sm:h-10" />
				<p className="text-lg tracking-widest text-text sm:text-2xl">開催まであと</p>
			</div>

			{countdown?.finished ? (
				<p className="text-center font-primary text-xl text-accent">茨香祭、開幕！</p>
			) : (
				<div className="flex items-baseline justify-center gap-3 sm:gap-6" role="timer" aria-label="開催までの残り時間">
					<Unit value={countdown ? String(countdown.days) : '--'} label="日" />
					<Unit value={countdown ? pad(countdown.hours) : '--'} label="時間" />
					<Unit value={countdown ? pad(countdown.minutes) : '--'} label="分" />
					<Unit value={countdown ? pad(countdown.seconds) : '--'} label="秒" />
				</div>
			)}
		</section>
	);
}
