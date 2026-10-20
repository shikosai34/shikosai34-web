import settings from '../../content/settings/video.json';

export interface VideoItem {
	videoId: string;
	title: string;
	publishedAt: string;
}

const FEED_URL = 'https://www.youtube.com/feeds/videos.xml?channel_id=';
const FETCH_TIMEOUT_MS = 10_000;

const ENTITIES: Record<string, string> = { '&amp;': '&', '&lt;': '<', '&gt;': '>', '&quot;': '"', '&#39;': "'" };

function decodeEntities(text: string): string {
	return text.replace(/&(?:amp|lt|gt|quot|#39);/g, (m) => ENTITIES[m] ?? m);
}

/** `@ハンドル` をチャンネル ID（UC…）へ解決する。ID が渡されたらそのまま返す。 */
async function resolveChannelId(channel: string): Promise<string | null> {
	const value = channel.trim();
	if (/^UC[\w-]{22}$/.test(value)) return value;
	if (!value.startsWith('@')) return null;

	const res = await fetch(`https://www.youtube.com/${encodeURIComponent(value)}`, {
		signal: AbortSignal.timeout(FETCH_TIMEOUT_MS),
		headers: { 'Accept-Language': 'ja' },
	});
	if (!res.ok) return null;
	const html = await res.text();
	return html.match(/youtube\.com\/channel\/(UC[\w-]{22})/)?.[1] ?? null;
}

/** 再生リストの ID、または `list=` を含む URL から再生リスト ID を取り出す。 */
export function parsePlaylistId(input: string | undefined): string | null {
	const value = input?.trim();
	if (!value) return null;
	if (/^(?:PL|UU|FL|OL)[\w-]{10,}$/.test(value)) return value;
	try {
		const list = new URL(value).searchParams.get('list');
		return list && /^[\w-]{10,}$/.test(list) ? list : null;
	} catch {
		return null;
	}
}

async function fetchFeedEntries(feedUrl: string): Promise<VideoItem[]> {
	const res = await fetch(feedUrl, { signal: AbortSignal.timeout(FETCH_TIMEOUT_MS) });
	if (!res.ok) throw new Error(`HTTP ${res.status}`);
	const xml = await res.text();

	const entries: VideoItem[] = [];
	for (const [, entry] of xml.matchAll(/<entry>([\s\S]*?)<\/entry>/g)) {
		const videoId = entry.match(/<yt:videoId>([\w-]{11})<\/yt:videoId>/)?.[1];
		const title = entry.match(/<title>([\s\S]*?)<\/title>/)?.[1];
		const publishedAt = entry.match(/<published>([^<]+)<\/published>/)?.[1];
		if (videoId && title && publishedAt) {
			entries.push({ videoId, title: decodeEntities(title), publishedAt });
		}
	}
	return entries;
}

/**
 * `content/settings/video.json` で指定した動画一覧を返す。
 *
 * - `playlist` があれば再生リストを使い、**再生リストの並び順**のまま返す（見せたい順は YouTube 側で決める）。
 * - なければ `channel` の最新動画を新しい順に返す。
 *
 * ビルド時に YouTube の RSS（API キー不要）を取得するため、変更はデプロイ後に反映される。
 * 取得に失敗してもビルドは止めず、空配列（= セクションを出さない）を返す。
 */
export async function getFeaturedVideos(): Promise<VideoItem[]> {
	const playlistValue = settings.playlist?.trim();
	try {
		if (playlistValue) {
			const playlistId = parsePlaylistId(playlistValue);
			if (!playlistId) {
				console.warn(`[videos] 再生リストを特定できませんでした: ${playlistValue}`);
				return [];
			}
			return (await fetchFeedEntries(`${FEED_URL.replace('channel_id=', 'playlist_id=')}${playlistId}`)).slice(0, settings.count);
		}

		const channelId = await resolveChannelId(settings.channel);
		if (!channelId) {
			console.warn(`[videos] チャンネルを特定できませんでした: ${settings.channel}`);
			return [];
		}
		const entries = await fetchFeedEntries(FEED_URL + channelId);
		return entries.sort((a, b) => b.publishedAt.localeCompare(a.publishedAt)).slice(0, settings.count);
	} catch (error) {
		console.warn('[videos] YouTube の動画一覧を取得できませんでした:', error);
		return [];
	}
}
