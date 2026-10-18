import type { MapExhibit } from '../../lib/map';
import CloseIcon from '../icons/CloseIcon';
import ExhibitCard from './ExhibitCard';

/*
 * 地図の部屋（2D）をタップしたときに、その場所の近くへ開く出展の情報。
 * 図面の枠（x, y は枠の左上からの px）に収まるよう、位置を寄せて上下どちらかへ開く。
 * 枠はドラッグで動かせるので、ここへのポインタ操作は枠へ伝えない。ホイールも枠の階移動に使われないよう data-popup を付ける。
 */

interface Props {
	/** 「8-301」など。なければ出さない */
	badge?: string | null;
	title: string;
	/** その天候での使い道（予選会場・休憩所など） */
	use?: string;
	items: MapExhibit[];
	x: number;
	y: number;
	/** 図面の枠の大きさ */
	width: number;
	height: number;
	onClose: () => void;
}

const stop = (e: { stopPropagation: () => void }) => e.stopPropagation();

export default function ExhibitPopover({ badge, title, use, items, x, y, width, height, onClose }: Props) {
	const w = Math.max(200, Math.min(300, width - 16));
	const left = Math.min(Math.max(x - w / 2, 8), Math.max(8, width - w - 8));
	const above = y > height * 0.55;
	const maxHeight = Math.max(160, (above ? y : height - y) - 28);

	return (
		<>
			{/* タップした場所の目印 */}
			<span className="pointer-events-none absolute z-10 h-3 w-3 rounded-full border-2 border-main" style={{ left: x - 6, top: y - 6 }} aria-hidden="true" />
			<div
				data-popup
				role="dialog"
				aria-label={title}
				className="absolute z-20 flex flex-col rounded-lg border border-accent/50 bg-base/95 shadow-[0_4px_24px_rgba(0,0,0,0.45)] backdrop-blur-sm"
				style={{ left, width: w, maxHeight, ...(above ? { bottom: height - y + 14 } : { top: y + 14 }) }}
				onPointerDown={stop}
				onPointerMove={stop}
				onPointerUp={stop}
				onClick={stop}
			>
				<header className="flex items-center gap-2 border-b border-text/10 px-3 py-2">
					{badge && <span className="shrink-0 rounded-sm bg-accent/85 px-1 text-xs font-medium text-base">{badge}</span>}
					<h4 className="min-w-0 flex-1 truncate text-sm font-medium text-text">{title}</h4>
					<button type="button" onClick={onClose} aria-label="閉じる" className="shrink-0 text-text/70 hover:text-main">
						<CloseIcon className="h-4 w-4" />
					</button>
				</header>
				<div className="flex flex-col gap-4 overflow-y-auto p-3">
					{use && <p className="text-sm font-medium text-glow-pink">{use}</p>}
					{items.length === 0 && !use && <p className="text-xs text-text/60">この場所の出展情報はありません。</p>}
					{items.map((item) => (
						<ExhibitCard key={item.id} item={item} />
					))}
				</div>
			</div>
		</>
	);
}
