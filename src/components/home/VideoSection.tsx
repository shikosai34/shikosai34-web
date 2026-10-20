import VideoStack, { type VideoStackItem } from '../ui/VideoStack';

interface Props {
	/** 表示する動画（新しい順）。空のときは何も出さない。 */
	videos?: VideoStackItem[];
}

/**
 * 実行委員紹介のカードの先頭に置く、紹介映像のブロック（自前のパネルは持たない）。
 * 上の見出し（STAFF）とは罫線で区切る。
 */
export default function VideoSection({ videos = [] }: Props) {
	if (videos.length === 0) return null;

	return (
		<div className="mb-8 border-t border-text/15 pt-6" aria-label="実行委員の紹介映像">
			<p className="mb-1 text-xs tracking-[0.2em] text-accent">MOVIE</p>
			<h3 className="mb-5 text-lg font-medium text-text">実行委員の紹介映像</h3>
			<VideoStack videos={videos} />
		</div>
	);
}
