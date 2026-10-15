/** 開場（1 日目 一般公開の開始）。 */
export const COUNTDOWN_TARGET = new Date('2026-10-24T09:00:00+09:00');

export interface Countdown {
	days: number;
	hours: number;
	minutes: number;
	seconds: number;
	/** 開場時刻を過ぎている。 */
	finished: boolean;
}

export function getCountdown(now: Date, target: Date = COUNTDOWN_TARGET): Countdown {
	const remainingMs = Math.max(0, target.getTime() - now.getTime());
	const totalSeconds = Math.floor(remainingMs / 1000);

	return {
		days: Math.floor(totalSeconds / 86_400),
		hours: Math.floor((totalSeconds % 86_400) / 3_600),
		minutes: Math.floor((totalSeconds % 3_600) / 60),
		seconds: totalSeconds % 60,
		finished: remainingMs === 0,
	};
}
