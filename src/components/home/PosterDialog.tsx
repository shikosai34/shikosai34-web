import { useCallback, useRef, useState } from 'react';
import CloseIcon from '../icons/CloseIcon';

interface Props {
	src: string;
	width: number;
	height: number;
	alt: string;
}

/**
 * ポスター全体の拡大表示。
 *
 * 円で切り抜いたヒーローでは四隅が欠けるため、全体を確認する導線として
 * 使う。別タブで画像を直接開くと「戻る」手段がブラウザの戻るボタンしか
 * なくなるので、ページ内のダイアログで開いて閉じるボタンを添える。
 *
 * `/main-visual` のライトボックスと同じくネイティブの <dialog> を使い、
 * Esc での閉包とフォーカストラップはブラウザに任せる。
 */
export default function PosterDialog({ src, width, height, alt }: Props) {
	const dialogRef = useRef<HTMLDialogElement>(null);
	const [isOpen, setIsOpen] = useState(false);

	const open = useCallback(() => {
		setIsOpen(true);
		const dialog = dialogRef.current;
		if (dialog && !dialog.open) dialog.showModal();
	}, []);

	const close = useCallback(() => {
		dialogRef.current?.close();
	}, []);

	return (
		<>
			<p className="mt-3 text-center text-xs text-text/70">
				<button
					type="button"
					onClick={open}
					className="min-h-11 underline underline-offset-2 transition-colors hover:text-accent"
				>
					ポスター全体を見る
				</button>
			</p>

			<dialog
				ref={dialogRef}
				onClose={() => setIsOpen(false)}
				className="max-h-none max-w-none bg-transparent p-0"
				aria-label="ポスター全体の拡大表示"
			>
				{isOpen ? (
					<div
						className="fixed inset-0 flex flex-col items-center justify-center gap-4 bg-black/85 p-4"
						onClick={(event) => {
							// 画像や操作ボタンの外側（＝背景）を押したときだけ閉じる。
							if (event.target === event.currentTarget) close();
						}}
					>
						<img
							src={src}
							width={width}
							height={height}
							alt={alt}
							className="max-h-[78vh] w-auto max-w-full object-contain"
						/>

						{/*
						 * 右上の × に加えて、画像の下にも「閉じる」を置く。
						 * 縦長の画像だと右上まで指が届きにくいため。
						 */}
						<button
							type="button"
							onClick={close}
							className="inline-flex min-h-11 items-center gap-1.5 rounded-xl bg-text px-5 py-3 text-sm font-medium text-base transition-colors hover:bg-text/85"
						>
							<CloseIcon className="h-4 w-4" />
							閉じる
						</button>

						<button
							type="button"
							aria-label="閉じる"
							onClick={close}
							className="absolute top-4 right-4 rounded-full bg-black/50 p-2.5 text-white transition-colors hover:bg-black/70"
						>
							<CloseIcon className="h-6 w-6" />
						</button>
					</div>
				) : null}
			</dialog>
		</>
	);
}
