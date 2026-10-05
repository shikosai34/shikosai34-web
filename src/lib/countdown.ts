/** 開場（1 日目 一般公開の開始）。 */
export const COUNTDOWN_TARGET = new Date('2026-10-24T09:00:00+09:00');

export interface Countdown {
	days: number;
	hours: number;
	/** 開場時刻を過ぎている。 */
	finished: boolean;
}

export function getCountdown(now: Date, target: Date = COUNTDOWN_TARGET): Countdown {
	const remainingMs = Math.max(0, target.getTime() - now.getTime());
	const totalHours = Math.floor(remainingMs / 3_600_000);

	return {
		days: Math.floor(totalHours / 24),
		hours: totalHours % 24,
		finished: remainingMs === 0,
	};
}
