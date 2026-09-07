export interface HomeStageEventData {
	href: string;
	title: string;
	performer: string;
	startAt: string;
	endAt: string;
	status: 'scheduled' | 'changed' | 'cancelled';
}

export type HomeStageEventState =
	| { kind: 'next'; event: HomeStageEventData }
	| { kind: 'current'; event: HomeStageEventData }
	| { kind: 'finished' }
	| { kind: 'empty' };

const availableEvents = (events: HomeStageEventData[]) =>
	[...events]
		.filter((event) => event.status !== 'cancelled')
		.sort((a, b) => Date.parse(a.startAt) - Date.parse(b.startAt));

/**
 * 静的 HTML 用の初期表示。現在時刻に依存させず、Hydration 後に実時刻へ更新する。
 */
export function getInitialHomeStageEventState(events: HomeStageEventData[]): HomeStageEventState {
	const firstEvent = availableEvents(events)[0];
	return firstEvent ? { kind: 'next', event: firstEvent } : { kind: 'empty' };
}

/** 現在時刻より後に始まる演目を返す。最後の演目中だけは「上演中」として返す。 */
export function getHomeStageEventState(
	events: HomeStageEventData[],
	now: Date,
): HomeStageEventState {
	const available = availableEvents(events);
	if (available.length === 0) return { kind: 'empty' };

	const nextEvent = available.find((event) => Date.parse(event.startAt) > now.getTime());
	if (nextEvent) return { kind: 'next', event: nextEvent };

	const currentEvent = available.find(
		(event) =>
			Date.parse(event.startAt) <= now.getTime() && Date.parse(event.endAt) > now.getTime(),
	);
	return currentEvent ? { kind: 'current', event: currentEvent } : { kind: 'finished' };
}
