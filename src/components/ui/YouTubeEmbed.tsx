import { useState } from 'react';

interface Props {
	videoId: string;
	/** iframe の title とボタンの読み上げに使う。 */
	title: string;
}

/**
 * YouTube 埋め込み（クリックするまで iframe を読み込まないファサード方式）。
 *
 * トップページは 3D などで初期表示が重いので、再生前はサムネイルだけを出し、
 * クリックしたときに youtube-nocookie.com の iframe へ差し替えて自動再生する。
 * 角丸や枠は親のカード側で付ける（ここは 16:9 の映像部分だけ）。
 */
export default function YouTubeEmbed({ videoId, title }: Props) {
	const [active, setActive] = useState(false);

	return (
		<div className="relative aspect-video w-full overflow-hidden bg-base">
			{active ? (
				<iframe
					src={`https://www.youtube-nocookie.com/embed/${videoId}?autoplay=1&rel=0`}
					title={title}
					allow="accelerometer; autoplay; encrypted-media; gyroscope; picture-in-picture; fullscreen"
					allowFullScreen
					referrerPolicy="strict-origin-when-cross-origin"
					className="absolute inset-0 h-full w-full border-0"
				/>
			) : (
				<>
					<img
						src={`https://i.ytimg.com/vi/${videoId}/hqdefault.jpg`}
						alt=""
						loading="lazy"
						className="absolute inset-0 h-full w-full object-cover"
					/>
					<button
						type="button"
						onClick={() => setActive(true)}
						aria-label={`${title}を再生`}
						className="group absolute inset-0 grid place-items-center bg-base/30 transition-colors hover:bg-base/10 focus-visible:outline-2 focus-visible:-outline-offset-4 focus-visible:outline-accent"
					>
						{/* YouTube の再生ボタンと同じ形（赤い角丸 + 白い三角）。YouTube の動画だとひと目でわかるようにする。 */}
						<svg viewBox="0 0 68 48" className="h-12 w-[68px] drop-shadow-md transition-transform group-hover:scale-110" aria-hidden="true">
							<path
								d="M66.52 7.74c-.78-2.93-2.49-5.41-5.42-6.19C55.79.13 34 0 34 0S12.21.13 6.9 1.55C3.97 2.33 2.27 4.81 1.48 7.74.06 13.05 0 24 0 24s.06 10.95 1.48 16.26c.78 2.93 2.49 5.41 5.42 6.19C12.21 47.87 34 48 34 48s21.79-.13 27.1-1.55c2.93-.78 4.64-3.26 5.42-6.19C67.94 34.95 68 24 68 24s-.06-10.95-1.48-16.26z"
								fill="#f00"
							/>
							<path d="M45 24 27 14v20z" fill="#fff" />
						</svg>
					</button>
				</>
			)}
		</div>
	);
}
