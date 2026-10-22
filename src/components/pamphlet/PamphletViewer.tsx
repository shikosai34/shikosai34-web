import { useCallback, useEffect, useRef, useState } from 'react';
import type { KeyboardEvent, PointerEvent } from 'react';
import { Document, Page, pdfjs } from 'react-pdf';

// pdf.js のワーカーは、このビューアを開いたときだけ読み込む（トップなど他ページには影響しない）。
pdfjs.GlobalWorkerOptions.workerSrc = new URL('pdfjs-dist/build/pdf.worker.min.mjs', import.meta.url).toString();

interface Props {
	/** 配信する PDF の URL（public 配下）。 */
	file: string;
}

/** A4 縦。PDF を読み込む前の仮の縦横比。 */
const DEFAULT_ASPECT = 595.28 / 841.89;
/** この幅以上なら見開きで表示する（px）。 */
const SPREAD_MIN_WIDTH = 720;
/** ビューアより下に確保する余白（ページ送りバー＋セクションの余白, px）。 */
const BELOW_RESERVE = 130;
/** スワイプとみなす最小の横移動量（px）。 */
const SWIPE_DISTANCE = 48;

/** 表紙だけ単独、以降は 2 ページずつ。最終ページが余れば単独。 */
function spreadOf(page: number, numPages: number, spread: boolean): number[] {
	if (!spread) return [page];
	if (page === 1) return [1];
	const left = page % 2 === 0 ? page : page - 1;
	return left + 1 <= numPages ? [left, left + 1] : [left];
}

export default function PamphletViewer({ file }: Props) {
	const frameRef = useRef<HTMLDivElement>(null);
	const swipeStart = useRef<{ x: number; y: number } | null>(null);
	const [numPages, setNumPages] = useState(0);
	const [page, setPage] = useState(1);
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

	const spread = size.width >= SPREAD_MIN_WIDTH;
	const current = spreadOf(page, numPages, spread);
	const prevStart = current[0] - 1;
	const nextStart = current[current.length - 1] + 1;
	const hasPrev = prevStart >= 1;
	const hasNext = nextStart <= numPages;

	// 1 ページの幅は「画面に収まる高さ」と「枠の幅」の小さい方に合わせる。
	const maxHeight = Math.max(360, size.height - size.top - BELOW_RESERVE);
	const pageWidth = Math.floor(Math.min(size.width / (spread ? 2 : 1), maxHeight * aspect));

	const goPrev = useCallback(() => {
		if (hasPrev) setPage(prevStart);
	}, [hasPrev, prevStart]);
	const goNext = useCallback(() => {
		if (hasNext) setPage(nextStart);
	}, [hasNext, nextStart]);

	const onKeyDown = (event: KeyboardEvent) => {
		if (event.key === 'ArrowLeft') goPrev();
		else if (event.key === 'ArrowRight') goNext();
		else return;
		event.preventDefault();
	};

	const onPointerDown = (event: PointerEvent) => {
		swipeStart.current = { x: event.clientX, y: event.clientY };
	};
	const onPointerUp = (event: PointerEvent) => {
		const start = swipeStart.current;
		swipeStart.current = null;
		if (!start) return;
		const dx = event.clientX - start.x;
		const dy = event.clientY - start.y;
		if (Math.abs(dx) < SWIPE_DISTANCE || Math.abs(dx) < Math.abs(dy)) return;
		if (dx < 0) goNext();
		else goPrev();
	};

	// 前後の見開きも先に描いておき、めくった瞬間に表示できるようにする（表示はしない）。
	const prefetch = [
		...(hasPrev ? spreadOf(prevStart, numPages, spread) : []),
		...(hasNext ? spreadOf(nextStart, numPages, spread) : []),
	];

	return (
		<div className="flex flex-col items-center gap-4">
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
								role="group"
								aria-roledescription="ページめくり"
								aria-label="パンフレット。左右の矢印キー、またはスワイプでページをめくれます。"
								tabIndex={0}
								onKeyDown={onKeyDown}
								onPointerDown={onPointerDown}
								onPointerUp={onPointerUp}
								className="relative mx-auto flex select-none justify-center outline-none focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-accent"
								style={{ touchAction: 'pan-y', width: pageWidth * current.length }}
							>
								{current.map((n) => (
									<Page
										key={n}
										pageNumber={n}
										width={pageWidth}
										renderTextLayer={false}
										renderAnnotationLayer={false}
										onLoadSuccess={(loaded) => setAspect(loaded.originalWidth / loaded.originalHeight)}
										loading={<PagePlaceholder width={pageWidth} aspect={aspect} />}
										className="shadow-lg"
									/>
								))}

								<EdgeButton side="prev" disabled={!hasPrev} onClick={goPrev} />
								<EdgeButton side="next" disabled={!hasNext} onClick={goNext} />

								<div aria-hidden="true" className="pointer-events-none absolute -left-[9999px] top-0 h-0 w-0 overflow-hidden">
									{prefetch.map((n) => (
										<Page key={n} pageNumber={n} width={pageWidth} renderTextLayer={false} renderAnnotationLayer={false} />
									))}
								</div>
							</div>
						) : (
							<PagePlaceholder width={pageWidth} aspect={aspect} label="読み込み中…" />
						)}
					</Document>
				)}
			</div>

			{!failed && numPages > 0 ? (
				<nav aria-label="ページ送り" className="flex items-center gap-4 text-text">
					<BarButton label="前のページ" disabled={!hasPrev} onClick={goPrev}>
						‹
					</BarButton>
					<p className="min-w-24 text-center text-sm tabular-nums" aria-live="polite">
						{current.join('・')} / {numPages}
					</p>
					<BarButton label="次のページ" disabled={!hasNext} onClick={goNext}>
						›
					</BarButton>
				</nav>
			) : null}
		</div>
	);
}

/** ページの左右を押してもめくれるようにする、見えない当たり判定（スマホ向け）。 */
function EdgeButton({ side, disabled, onClick }: { side: 'prev' | 'next'; disabled: boolean; onClick: () => void }) {
	return (
		<button
			type="button"
			tabIndex={-1}
			aria-hidden="true"
			disabled={disabled}
			onClick={onClick}
			className={`absolute inset-y-0 w-1/4 ${side === 'prev' ? 'left-0' : 'right-0'} ${disabled ? 'cursor-default' : 'cursor-pointer'}`}
		/>
	);
}

function BarButton({
	label,
	disabled,
	onClick,
	children,
}: {
	label: string;
	disabled: boolean;
	onClick: () => void;
	children: string;
}) {
	return (
		<button
			type="button"
			aria-label={label}
			disabled={disabled}
			onClick={onClick}
			className="flex size-11 items-center justify-center rounded-full border border-text/25 text-2xl leading-none transition-colors hover:border-accent hover:text-accent focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accent disabled:cursor-default disabled:opacity-30 disabled:hover:border-text/25 disabled:hover:text-text"
		>
			{children}
		</button>
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
