import { useEffect, useRef, useState } from 'react';
import { Document, Page, pdfjs } from 'react-pdf';

// pdf.js のワーカーは、このビューアを開いたときだけ読み込む（トップなど他ページには影響しない）。
pdfjs.GlobalWorkerOptions.workerSrc = new URL('pdfjs-dist/build/pdf.worker.min.mjs', import.meta.url).toString();

interface Props {
	/** 配信する PDF の URL（public 配下）。 */
	file: string;
}

/** A4 縦。PDF を読み込む前の仮の縦横比。 */
const DEFAULT_ASPECT = 595.28 / 841.89;
/** PC で 1 ページを広げすぎない上限（px）。 */
const MAX_PAGE_WIDTH = 800;

export default function PamphletViewer({ file }: Props) {
	const frameRef = useRef<HTMLDivElement>(null);
	const [numPages, setNumPages] = useState(0);
	const [frameWidth, setFrameWidth] = useState(0);
	const [aspect, setAspect] = useState(DEFAULT_ASPECT);
	const [failed, setFailed] = useState(false);

	useEffect(() => {
		const frame = frameRef.current;
		if (!frame) return;
		const update = () => setFrameWidth(frame.clientWidth);
		update();
		const observer = new ResizeObserver(update);
		observer.observe(frame);
		return () => observer.disconnect();
	}, []);

	const pageWidth = Math.min(frameWidth, MAX_PAGE_WIDTH);

	return (
		<div className="flex flex-col gap-4">
			<p className="text-sm text-text/85" aria-live="polite">
				{failed ? '' : numPages > 0 ? `全 ${numPages} ページ。下にスクロールして読めます。` : '読み込み中…'}
			</p>

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
						className="flex flex-col items-center gap-6"
					>
						{pageWidth > 0
							? Array.from({ length: numPages }, (_, i) => (
									<PageSlot
										key={i + 1}
										pageNumber={i + 1}
										numPages={numPages}
										width={pageWidth}
										aspect={aspect}
										onAspect={setAspect}
									/>
								))
							: null}
					</Document>
				)}
			</div>
		</div>
	);
}

interface SlotProps {
	pageNumber: number;
	numPages: number;
	width: number;
	aspect: number;
	onAspect: (aspect: number) => void;
}

/**
 * 1 ページ分の枠。画面の近くにあるときだけ canvas を描き、離れたら捨てる。
 * 24 ページ分の canvas を同時に持つと、スマホではメモリが足りなくなるため。
 */
function PageSlot({ pageNumber, numPages, width, aspect, onAspect }: SlotProps) {
	const slotRef = useRef<HTMLDivElement>(null);
	const [near, setNear] = useState(pageNumber <= 2);

	useEffect(() => {
		const slot = slotRef.current;
		if (!slot) return;
		const observer = new IntersectionObserver(([entry]) => setNear(entry.isIntersecting), { rootMargin: '150% 0px' });
		observer.observe(slot);
		return () => observer.disconnect();
	}, []);

	return (
		<div
			ref={slotRef}
			role="group"
			aria-label={`パンフレット ${pageNumber} / ${numPages} ページ`}
			style={{ width, minHeight: width / aspect }}
		>
			{near ? (
				<Page
					pageNumber={pageNumber}
					width={width}
					renderTextLayer={false}
					renderAnnotationLayer={false}
					onLoadSuccess={(loaded) => onAspect(loaded.originalWidth / loaded.originalHeight)}
					loading={<PagePlaceholder width={width} aspect={aspect} label={`${pageNumber} ページ目を読み込み中…`} />}
				/>
			) : (
				<PagePlaceholder width={width} aspect={aspect} />
			)}
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
