/**
 * YouTube の URL（watch / youtu.be / shorts / embed）または 11 文字の動画 ID から、動画 ID を取り出す。
 * 解釈できなければ `null`。
 */
export function parseYouTubeId(input: string | undefined): string | null {
	const value = input?.trim();
	if (!value) return null;
	if (/^[\w-]{11}$/.test(value)) return value;

	try {
		const url = new URL(value);
		const host = url.hostname.replace(/^www\./, '');
		if (host === 'youtu.be') return url.pathname.slice(1).match(/^[\w-]{11}/)?.[0] ?? null;
		if (host.endsWith('youtube.com') || host.endsWith('youtube-nocookie.com')) {
			const v = url.searchParams.get('v');
			if (v && /^[\w-]{11}$/.test(v)) return v;
			return url.pathname.match(/^\/(?:shorts|embed|live)\/([\w-]{11})/)?.[1] ?? null;
		}
	} catch {
		// URL として解釈できない入力は無効扱い
	}
	return null;
}

/**
 * 動画のタイトルを YouTube の oEmbed（API キー不要）から取得する。ビルド時に使う。
 * 取得できなければ `null`（タイトルなしで表示する）。
 */
export async function fetchYouTubeTitle(videoId: string): Promise<string | null> {
	try {
		const url = `https://www.youtube.com/oembed?url=${encodeURIComponent(`https://www.youtube.com/watch?v=${videoId}`)}&format=json`;
		const res = await fetch(url, { signal: AbortSignal.timeout(10_000) });
		if (!res.ok) return null;
		const data: { title?: unknown } = await res.json();
		return typeof data.title === 'string' && data.title ? data.title : null;
	} catch {
		return null;
	}
}
