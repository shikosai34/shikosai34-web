import { getEventDayKey } from '../events';

/** ステージ企画ページの OGP 画像（ビルド時に自動生成）のパス。 */
export const eventOgImagePath = (slug: string) => `/og/event/${slug}.jpg`;

/**
 * OGP 画像を専用に作る開催日（日本時間の YYYY-MM-DD）。
 * まず前夜祭だけで試している。ほかの日も作るときは FESTIVAL_DAYS の日付を足す。
 */
export const OG_EVENT_DAYS: readonly string[] = ['2026-10-23'];

/** 専用の OGP 画像を持つ企画か。持たない企画は共通の /ogp.jpg を使う。 */
export const hasEventOgImage = (startAt: Date) => OG_EVENT_DAYS.includes(getEventDayKey(startAt));
