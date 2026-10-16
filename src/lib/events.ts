import type { CollectionEntry } from 'astro:content';
import { getCollectionOrEmpty } from './content';

export const EVENT_GENRES = [
	'music',
	'dance',
	'performance',
	'contest',
	'ceremony',
	'other',
] as const;

export type EventGenre = (typeof EVENT_GENRES)[number];

export const EVENT_GENRE_LABELS: Record<EventGenre, string> = {
	music: '音楽',
	dance: 'ダンス',
	performance: 'パフォーマンス',
	contest: '大会・コンテスト',
	ceremony: '式典',
	other: 'その他',
};

export const EVENT_STATUSES = ['scheduled', 'changed', 'cancelled'] as const;

export type EventStatus = (typeof EVENT_STATUSES)[number];

export const EVENT_STATUS_LABELS: Record<EventStatus, string> = {
	scheduled: '予定どおり',
	changed: '時間変更あり',
	cancelled: '中止',
};

export const EVENT_VENUES = [
	'main-stage',
	'large-classroom',
	'audiovisual-room',
	'preliminary-venue',
	'rotary',
	'general-circles',
	'other',
] as const;

export type EventVenue = (typeof EVENT_VENUES)[number];

export const EVENT_VENUE_LABELS: Record<EventVenue, string> = {
	'main-stage': '中ステージ（第一体育館）',
	'large-classroom': '大教室',
	'audiovisual-room': '視聴覚室',
	'preliminary-venue': '予選会場',
	rotary: 'ロータリー',
	'general-circles': '一般サークル会場',
	other: 'その他',
};

export const FESTIVAL_DAYS = [
	{ id: 'eve', date: '2026-10-23', shortLabel: '10月23日', label: '10月23日（金）' },
	{ id: 'day-1', date: '2026-10-24', shortLabel: '1日目', label: '10月24日（土）' },
	{ id: 'day-2', date: '2026-10-25', shortLabel: '2日目', label: '10月25日（日）' },
] as const;

export type EventEntry = CollectionEntry<'events'>;

export interface EventGroup {
	name: string;
	events: EventEntry[];
}

/** 開始時刻順の企画を、連続する同じイベント名ごとにまとめる。 */
export function groupConsecutiveEvents(events: EventEntry[]): EventGroup[] {
	const groups: EventGroup[] = [];
	for (const event of events) {
		const current = groups.at(-1);
		if (current?.name === event.data.eventName) {
			current.events.push(event);
		} else {
			groups.push({ name: event.data.eventName, events: [event] });
		}
	}
	return groups;
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

export function getEventDayKey(date: Date): string {
	const parts = new Intl.DateTimeFormat('en-CA', {
		year: 'numeric',
		month: '2-digit',
		day: '2-digit',
		timeZone: 'Asia/Tokyo',
	}).formatToParts(date);
	const values = Object.fromEntries(parts.map((part) => [part.type, part.value]));
	return `${values.year}-${values.month}-${values.day}`;
}

export function formatEventDate(date: Date): string {
	return dateFormatter.format(date).replace('/', '月').replace('(', '日（').replace(')', '）');
}

export function formatEventTime(date: Date): string {
	return timeFormatter.format(date);
}

export function formatEventTimeRange(startAt: Date, endAt: Date): string {
	return `${formatEventTime(startAt)}〜${formatEventTime(endAt)}`;
}

export async function getVisibleEvents(): Promise<EventEntry[]> {
	const events = await getCollectionOrEmpty('events', ({ data }) =>
		import.meta.env.PROD ? !data.draft : true,
	);
	return events
		.filter((event) => !event.data.committeeOnly)
		.sort((a, b) => a.data.startAt.getTime() - b.data.startAt.getTime());
}

export async function getCommitteeEvents(): Promise<EventEntry[]> {
	const events = await getCollectionOrEmpty('events', ({ data }) =>
		data.committeeOnly && (import.meta.env.PROD ? !data.draft : true),
	);
	return events.sort((a, b) => a.data.startAt.getTime() - b.data.startAt.getTime());
}
