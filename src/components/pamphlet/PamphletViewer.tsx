import { useEffect, useLayoutEffect, useRef, useState } from 'react';
import type { KeyboardEvent } from 'react';
import { Document, Page, pdfjs } from 'react-pdf';

// pdf.js のワーカーは、このビューアを開いたときだけ読み込む（トップなど他ページには影響しない）。
pdfjs.GlobalWorkerOptions.workerSrc = new URL('pdfjs-dist/build/pdf.worker.min.mjs', import.meta.url).toString();

interface Props {
	/** 配信する PDF の URL（public 配下）。 */
	file: string;
}

/** A4 縦。PDF を読み込む前の仮の縦横比。 */
const DEFAULT_ASPECT = 595.28 / 841.89;
/** ページ同士の間隔（px）。 */
const GAP = 16;
/** スマホで次のページを少しのぞかせるため、1 ページを枠の何割の幅にするか。 */
const PAGE_WIDTH_RATIO = 0.86;
/** ビューアより下に確保する余白（ページ番号＋セクションの余白, px）。 */
const BELOW_RESERVE = 100;
/** 表示中のページから前後何ページ分まで canvas を描くか。離れたページは捨てる。 */
const RENDER_RANGE = 2;

export default function PamphletViewer({ file }: Props) {
	const frameRef = useRef<HTMLDivElement>(null);
	const scrollerRef = useRef<HTMLDivElement>(null);
	const indexRef = useRef(0);
	/** キーでスクロール中の移動先。連打しても、移動先から数えて進めるため。 */
	const targetRef = useRef<number | null>(null);
	const [numPages, setNumPages] = useState(0);
	const [index, setIndex] = useState(0);
	const [size, setSize] = useState({ width: 0, height: 0, top: 0 });
	const [aspect, setAspect] = useState(DEFAULT_ASPECT);
	const [failed, setFailed] = useState(false);

	useEffect(() => {
		const frame = frameRef.current;
		if (!frame) return;
		const update = () =>
			setSize({
				width: frame.clientWidth,
				height: window.innerHeight,
				// ビューアより上（ヘッダーや説明文）の高さ。ページが 1 画面に収まるよう差し引く。
				top: frame.getBoundingClientRect().top + window.scrollY,
			});
		update();
		const observer = new ResizeObserver(update);
		observer.observe(frame);
		window.addEventListener('resize', update);
		return () => {
			observer.disconnect();
			window.removeEventListener('resize', update);
		};
	}, []);

	// 1 ページの幅は「画面に収まる高さ」と「枠の幅」の小さい方に合わせる。
	const maxHeight = Math.max(360, size.height - size.top - BELOW_RESERVE);
	const pageWidth = Math.floor(Math.min(size.width * PAGE_WIDTH_RATIO, maxHeight * aspect));
	const step = pageWidth + GAP;

	// 画面サイズが変わってページ幅が変わっても、同じページが中央に残るようにする。
	useLayoutEffect(() => {
		const scroller = scrollerRef.current;
		if (scroller && pageWidth > 0) scroller.scrollTo({ left: indexRef.current * step, behavior: 'instant' });
	}, [step, pageWidth, numPages]);

	const onScroll = () => {
		const scroller = scrollerRef.current;
		if (!scroller || pageWidth <= 0) return;
		const next = Math.min(numPages - 1, Math.max(0, Math.round(scroller.scrollLeft / step)));
		if (next === targetRef.current) targetRef.current = null;
		if (next === indexRef.current) return;
		indexRef.current = next;
		setIndex(next);
	};

	const onKeyDown = (event: KeyboardEvent) => {
		const direction = event.key === 'ArrowRight' ? 1 : event.key === 'ArrowLeft' ? -1 : 0;
		if (direction === 0) return;
		event.preventDefault();
		const target = Math.min(numPages - 1, Math.max(0, (targetRef.current ?? indexRef.current) + direction));
		targetRef.current = target;
		scrollerRef.current?.scrollTo({ left: target * step, behavior: 'smooth' });
	};

	return (
		<div className="flex flex-col items-center gap-3">
			<div ref={frameRef} className="w-full">
				{failed ? (
					<div className="rounded-xl bg-base/45 p-8 text-center text-base leading-relaxed text-text/85">
						<p>パンフレットを表示できませんでした。時間をおいて、もう一度お試しください。</p>
					</div>
				) : (
					<Document
						file={file}
						onLoadSuccess={(pdf) => setNumPages(pdf.numPages)}
						onLoadError={() => setFailed(true)}
						loading={<PagePlaceholder width={pageWidth} aspect={aspect} label="読み込み中…" />}
						error={null}
					>
						{numPages > 0 && pageWidth > 0 ? (
							<div
								ref={scrollerRef}
								role="group"
								aria-roledescription="横にスクロールして読むパンフレット"
								aria-label="パンフレット。横にスワイプ、または左右の矢印キーでページを移動できます。"
								tabIndex={0}
								onScroll={onScroll}
								onKeyDown={onKeyDown}
								className="flex snap-x snap-mandatory overflow-x-auto overscroll-x-contain pb-3 outline-none [scrollbar-width:thin] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accent"
								style={{
									gap: GAP,
									// 先頭と末尾のページも中央に止まれるよう、左右に余白を取る。
									paddingInline: Math.max(0, (size.width - pageWidth) / 2),
								}}
							>
								{Array.from({ length: numPages }, (_, i) => (
									<div
										key={i}
										role="group"
										aria-label={`パンフレット ${i + 1} / ${numPages} ページ`}
										className="shrink-0 snap-center shadow-lg"
										style={{ width: pageWidth, minHeight: pageWidth / aspect }}
									>
										{Math.abs(i - index) <= RENDER_RANGE ? (
											<Page
												pageNumber={i + 1}
												width={pageWidth}
												renderTextLayer={false}
												renderAnnotationLayer={false}
												onLoadSuccess={(loaded) => setAspect(loaded.originalWidth / loaded.originalHeight)}
												loading={<PagePlaceholder width={pageWidth} aspect={aspect} />}
											/>
										) : (
											<PagePlaceholder width={pageWidth} aspect={aspect} />
										)}
									</div>
								))}
							</div>
						) : (
							<PagePlaceholder width={pageWidth} aspect={aspect} label="読み込み中…" />
						)}
					</Document>
				)}
			</div>

			{!failed && numPages > 0 ? (
				<p className="text-sm tabular-nums text-text/85" aria-live="polite">
					{index + 1} / {numPages}
				</p>
			) : null}
		</div>
	);
}

function PagePlaceholder({ width, aspect, label }: { width: number; aspect: number; label?: string }) {
	return (
		<div
			className="flex items-center justify-center bg-text/10 text-sm text-text/70"
			style={{ width, height: width / aspect }}
		>
			{label}
		</div>
	);
}
