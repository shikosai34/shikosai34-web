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

/**
 * `content/settings/video.json` で指定したチャンネルの最新動画を新しい順に返す。
 *
 * ビルド時に YouTube の RSS（API キー不要）を取得するため、新しい動画はデプロイ後に反映される。
 * 取得に失敗してもビルドは止めず、空配列（= セクションを出さない）を返す。
 */
export async function getChannelVideos(): Promise<VideoItem[]> {
	try {
		const channelId = await resolveChannelId(settings.channel);
		if (!channelId) {
			console.warn(`[videos] チャンネルを特定できませんでした: ${settings.channel}`);
			return [];
		}

		const res = await fetch(FEED_URL + channelId, { signal: AbortSignal.timeout(FETCH_TIMEOUT_MS) });
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

		return entries
			.sort((a, b) => b.publishedAt.localeCompare(a.publishedAt))
			.slice(0, settings.count);
	} catch (error) {
		console.warn('[videos] YouTube の動画一覧を取得できませんでした:', error);
		return [];
	}
}
