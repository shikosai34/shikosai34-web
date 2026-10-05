/** 開場（1 日目 一般公開の開始）。 */
export const COUNTDOWN_TARGET = new Date('2026-10-24T09:00:00+09:00');

/**
 * 経過率の 0% にあたる日時。開場のちょうど 1 か月前。
 * 変えると進捗バーの割合だけが変わる。
 */
export const COUNTDOWN_START = new Date('2026-09-24T09:00:00+09:00');

export interface Countdown {
	days: number;
	hours: number;
	minutes: number;
	seconds: number;
	/** 起点から開場までのうち、すでに過ぎた割合（0〜100）。 */
	elapsedPercent: number;
	/** 開場時刻を過ぎている。 */
	finished: boolean;
}

export function getCountdown(
	now: Date,
	target: Date = COUNTDOWN_TARGET,
	start: Date = COUNTDOWN_START,
): Countdown {
	const remainingMs = Math.max(0, target.getTime() - now.getTime());
	const totalMs = target.getTime() - start.getTime();
	const elapsedMs = Math.min(Math.max(now.getTime() - start.getTime(), 0), totalMs);
	const totalSeconds = Math.floor(remainingMs / 1000);

	return {
		days: Math.floor(totalSeconds / 86_400),
		hours: Math.floor((totalSeconds % 86_400) / 3_600),
		minutes: Math.floor((totalSeconds % 3_600) / 60),
		seconds: totalSeconds % 60,
		elapsedPercent: totalMs > 0 ? (elapsedMs / totalMs) * 100 : 100,
		finished: remainingMs === 0,
	};
}
