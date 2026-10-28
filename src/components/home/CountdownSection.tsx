import '@fontsource/dseg7-classic/400.css';
import { useEffect, useState } from 'react';
import { getCountdown, type Countdown } from '../../lib/countdown';
import { buttonClassName } from '../ui/Button';

/** 来場者アンケート（Google フォーム）。埋め込まず、別タブで開く。 */
const SURVEY_URL = 'https://forms.gle/fy4BVzijibS4xcsBA';

function pad(value: number) {
	return String(value).padStart(2, '0');
}

/** 残りこの秒数以下になったら、日・時間・分を消して秒だけを大きく出す。 */
const FINAL_SECONDS = 10;

/**
 * 7 セグメントの数字。薄い「8」を下に重ねて、消灯しているセグメントも見せる。
 * 右詰めで重ねるので、桁数が変わっても幅が揺れない。
 */
function Unit({ value, label, final = false }: { value: string; label: string; final?: boolean }) {
	return (
		<span className="flex items-baseline gap-1 sm:gap-2" aria-hidden="true">
			<span
				className={`inline-grid justify-items-end font-[DSEG7_Classic] ${
					final
						? 'text-7xl text-main drop-shadow-[0_0_14px_color-mix(in_srgb,var(--color-main)_60%,transparent)] motion-safe:animate-pulse sm:text-9xl'
						: 'text-2xl text-accent drop-shadow-[0_0_8px_color-mix(in_srgb,var(--color-accent)_60%,transparent)] sm:text-5xl'
				}`}
			>
				<span className="col-start-1 row-start-1 opacity-[0.12]">{'8'.repeat(value.length)}</span>
				<span className="col-start-1 row-start-1">{value}</span>
			</span>
			<span className={final ? 'text-xl text-text/80 sm:text-3xl' : 'text-sm text-text/80 sm:text-lg'}>{label}</span>
		</span>
	);
}

function describe(countdown: Countdown | null, final: boolean) {
	if (!countdown) return '開催までの残り時間';
	if (final) return '開催まで残りわずか';
	return `開催まであと${countdown.days}日${countdown.hours}時間${countdown.minutes}分`;
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

	// 日・時間・分がすべて 0 で、秒が FINAL_SECONDS 以下。
	const final = !!countdown && countdown.days === 0 && countdown.hours === 0 && countdown.minutes === 0 && countdown.seconds <= FINAL_SECONDS;

	return (
		<section className="surface-panel mt-6 rounded-2xl p-4 pt-6 pb-6 text-text sm:p-6">
			{countdown?.finished ? (
				<>
					<p className="flex items-center justify-center gap-2 text-center font-primary text-xl text-accent sm:gap-3 sm:text-4xl">
						<img src={logoSrc} alt="茨香祭" className="h-8 w-auto sm:h-14" />
						<span>は終了しました</span>
					</p>
					<div className="mt-5 flex justify-center">
						<a
							href={SURVEY_URL}
							target="_blank"
							rel="noopener noreferrer"
							className={buttonClassName('main', 'w-full justify-center py-4 text-base shadow-lg sm:w-auto sm:px-10 sm:text-lg')}
						>
							アンケートはこちら
							<svg viewBox="0 0 24 24" className="size-5" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
								<path d="M5 12h14m0 0l-6-6m6 6l-6 6" />
							</svg>
						</a>
					</div>
				</>
			) : (
				<>
					<div className="mb-4 flex items-center justify-center gap-3">
						<img src={logoSrc} alt="茨香祭" className="h-8 w-auto sm:h-10" />
						<p className="text-lg tracking-widest text-text sm:text-2xl">開催まであと</p>
					</div>

					<div className="flex items-baseline justify-center gap-3 sm:gap-6" role="timer" aria-label={describe(countdown, final)}>
						{final ? (
							<Unit value={pad(countdown.seconds)} label="秒" final />
						) : (
							<>
								<Unit value={countdown ? String(countdown.days) : '--'} label="日" />
								<Unit value={countdown ? pad(countdown.hours) : '--'} label="時間" />
								<Unit value={countdown ? pad(countdown.minutes) : '--'} label="分" />
								<Unit value={countdown ? pad(countdown.seconds) : '--'} label="秒" />
							</>
						)}
					</div>
				</>
			)}
		</section>
	);
}
