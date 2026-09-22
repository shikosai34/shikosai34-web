import { useCallback, useEffect, useRef, useState } from 'react';
import ChevronRightIcon from '../icons/ChevronRightIcon';
import CloseIcon from '../icons/CloseIcon';

export interface MainVisualItem {
	/** 拡大表示に使う画像（webp に変換済み） */
	src: string;
	/** 格子に並べるサムネイル */
	thumb: string;
	width: number;
	height: number;
}

interface Props {
	/**
	 * 対応するサムネイル群の識別子（`data-lightbox-group` と一致させる）。
	 * セクションごとにこのコンポーネントを置き、送りをその中で完結させる。
	 */
	group: string;
	items: MainVisualItem[];
}

/**
 * 応募作品のライトボックス。
 *
 * 格子（サムネイル）は Astro 側で静的に出力し、このコンポーネントは
 * 拡大表示だけを担う。JS が動かない場合は格子の <a> が原寸画像を直接開く
 * （`/circle` の絞り込みと同じく、JS はあくまで上乗せ）。
 *
 * ネイティブの <dialog> を使うことで、フォーカストラップと Esc での
 * クローズをブラウザに任せている。
 */
export default function MainVisualLightbox({ group, items }: Props) {
	const dialogRef = useRef<HTMLDialogElement>(null);
	const [index, setIndex] = useState<number | null>(null);

	const close = useCallback(() => {
		dialogRef.current?.close();
	}, []);

	const show = useCallback((next: number) => {
		setIndex(next);
		const dialog = dialogRef.current;
		if (dialog && !dialog.open) dialog.showModal();
	}, []);

	const step = useCallback(
		(delta: number) => {
			setIndex((current) => {
				if (current === null) return current;
				// 端で止めず巡回させる（作品数が少ないため行き止まりの方が不便）。
				return (current + delta + items.length) % items.length;
			});
		},
		[items.length],
	);

	// 格子のサムネイルは Astro が出力した静的な <a>。ここで拾って乗っ取る。
	useEffect(() => {
		const links = Array.from(
			document.querySelectorAll<HTMLAnchorElement>(
				`[data-lightbox-group="${group}"][data-lightbox-index]`,
			),
		);
		if (links.length === 0) return;

		const onClick = (event: MouseEvent) => {
			// 修飾キー付きクリック（新しいタブで開く）はブラウザ既定の挙動を尊重する。
			if (event.metaKey || event.ctrlKey || event.shiftKey || event.altKey) return;
			const target = event.currentTarget as HTMLAnchorElement;
			const next = Number(target.dataset.lightboxIndex);
			if (Number.isNaN(next)) return;
			event.preventDefault();
			show(next);
		};

		for (const link of links) {
			link.addEventListener('click', onClick);
		}
		return () => {
			for (const link of links) {
				link.removeEventListener('click', onClick);
			}
		};
	}, [group, show]);

	useEffect(() => {
		const onKeyDown = (event: KeyboardEvent) => {
			if (index === null) return;
			if (event.key === 'ArrowRight') {
				event.preventDefault();
				step(1);
			} else if (event.key === 'ArrowLeft') {
				event.preventDefault();
				step(-1);
			}
		};
		document.addEventListener('keydown', onKeyDown);
		return () => document.removeEventListener('keydown', onKeyDown);
	}, [index, step]);

	const current = index === null ? null : items[index];

	return (
		<dialog
			ref={dialogRef}
			onClose={() => setIndex(null)}
			className="max-h-none max-w-none bg-transparent p-0"
			aria-label="作品の拡大表示"
		>
			{current ? (
				<div
					className="fixed inset-0 flex flex-col items-center justify-center gap-3 bg-black/85 p-4"
					onClick={(event) => {
						// 画像や操作ボタンの外側（＝背景）を押したときだけ閉じる。
						if (event.target === event.currentTarget) close();
					}}
				>
					<img
						src={current.src}
						alt=""
						width={current.width}
						height={current.height}
						className="max-h-[80vh] w-auto max-w-full object-contain"
					/>

					<p className="text-sm text-white/80" aria-live="polite">
						{(index ?? 0) + 1} / {items.length}
					</p>

					<button
						type="button"
						aria-label="閉じる"
						onClick={close}
						className="absolute top-4 right-4 rounded-full bg-black/50 p-2 text-white transition-colors hover:bg-black/70"
					>
						<CloseIcon className="h-6 w-6" />
					</button>

					{items.length > 1 ? (
						<>
							<button
								type="button"
								aria-label="前の作品"
								onClick={() => step(-1)}
								className="absolute top-1/2 left-2 -translate-y-1/2 rounded-full bg-black/50 p-2 text-white transition-colors hover:bg-black/70"
							>
								<ChevronRightIcon className="h-6 w-6 rotate-180" />
							</button>
							<button
								type="button"
								aria-label="次の作品"
								onClick={() => step(1)}
								className="absolute top-1/2 right-2 -translate-y-1/2 rounded-full bg-black/50 p-2 text-white transition-colors hover:bg-black/70"
							>
								<ChevronRightIcon className="h-6 w-6" />
							</button>
						</>
					) : null}
				</div>
			) : null}
		</dialog>
	);
}
