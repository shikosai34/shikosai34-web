import { useEffect, useMemo, useState } from 'react';
import { EXHIBIT_GROUPS, PLAN_SCALE, type ExhibitsByRoom, type Plan } from '../../lib/map';
import { MAP_ROOMS } from '../../lib/map-rooms';
import { FloorExhibitList, RoomDetail, type FloorExhibit } from './ExhibitPanel';
import FloorPlan from './FloorPlan';
import FloorStack from './FloorStack';
import { usePanZoom } from './usePanZoom';

/*
 * 建物のフロア画面（2D）。左に階の積み重ね、中央に平面図、右（モバイルでは下）に出展一覧。
 * 階を移ると、上の階へは上から・下の階へは下から図面が入ってくる。
 */

interface Props {
	plan: Plan;
	exhibits: ExhibitsByRoom;
	initialFloor?: number;
	initialRoom?: string;
	onClose: () => void;
	/** 階・部屋が変わったとき（URL の書き換えに使う） */
	onChange: (floor: number, room: string | null) => void;
}

const S = PLAN_SCALE;

export default function FloorPlanView({ plan, exhibits, initialFloor, initialRoom, onClose, onChange }: Props) {
	const floors = plan.floors;
	const floorNumbers = floors.map((f) => f.floor);
	const roomsInPlan = useMemo(() => MAP_ROOMS.filter((r) => r.building === plan.building), [plan.building]);

	const [floor, setFloor] = useState(() => {
		const byRoom = roomsInPlan.find((r) => r.key === initialRoom)?.floor;
		const wanted = byRoom ?? initialFloor;
		return wanted && floorNumbers.includes(wanted) ? wanted : floorNumbers[0];
	});
	const [selectedKey, setSelectedKey] = useState<string | null>(initialRoom ?? null);
	const [hoveredKey, setHoveredKey] = useState<string | null>(null);
	const [direction, setDirection] = useState<'up' | 'down' | null>(null);

	useEffect(() => onChange(floor, selectedKey), [floor, selectedKey]); // eslint-disable-line react-hooks/exhaustive-deps

	// Esc で部屋の選択 → フロア画面の順に閉じる
	useEffect(() => {
		const onKey = (e: KeyboardEvent) => {
			if (e.key !== 'Escape') return;
			if (selectedKey) setSelectedKey(null);
			else onClose();
		};
		window.addEventListener('keydown', onKey);
		return () => window.removeEventListener('keydown', onKey);
	}, [selectedKey, onClose]);

	const goFloor = (f: number) => {
		if (f === floor) return;
		setDirection(f > floor ? 'up' : 'down');
		setFloor(f);
		setSelectedKey(null);
		setHoveredKey(null);
	};

	const current = floors.find((f) => f.floor === floor) ?? floors[0];

	// 階を切り替えても縮尺が変わらないよう、全階で最大の範囲を使う
	const baseBox = useMemo((): [number, number, number, number] => {
		const pad = 6;
		const w = Math.max(...floors.map((f) => f.bbox[2] - f.bbox[0])) + pad * 2;
		const h = Math.max(...floors.map((f) => f.bbox[3] - f.bbox[1])) + pad * 2;
		const cx = (current.bbox[0] + current.bbox[2]) / 2;
		const cy = (current.bbox[1] + current.bbox[3]) / 2;
		return [(cx - w / 2) * S, (cy - h / 2) * S, w * S, h * S];
	}, [floors, current]);
	const panZoom = usePanZoom(baseBox, floor);

	const floorItems = (f: number): FloorExhibit[] =>
		roomsInPlan
			.filter((room) => room.floor === f)
			.flatMap((room) => (exhibits[room.key] ?? []).map((item) => ({ item, room })));
	const counts = Object.fromEntries(floorNumbers.map((f) => [f, floorItems(f).length]));
	const selectedRoom = roomsInPlan.find((r) => r.key === selectedKey);

	return (
		<div className="map-floor-view absolute inset-0 z-20 flex flex-col bg-base md:flex-row">
			<section className="flex min-h-0 flex-1 flex-col">
				<header className="flex flex-wrap items-center gap-3 px-3 py-3 md:px-5">
					<button
						type="button"
						onClick={onClose}
						className="rounded-lg border border-accent/60 bg-base/80 px-3 py-1.5 text-sm text-accent hover:border-main hover:text-main"
					>
						← キャンパス
					</button>
					<h3 className="flex items-baseline gap-2 text-text">
						<span className="text-xl">{plan.building}</span>
						<span className="text-3xl leading-none text-accent drop-shadow-[0_0_6px_color-mix(in_srgb,var(--color-accent)_70%,transparent)]">
							{floor}F
						</span>
					</h3>
					{/* モバイルは階のボタンを並べる（積み重ね図は小さすぎて押しにくい） */}
					<div className="ml-auto flex gap-1 md:hidden" role="group" aria-label="階の切り替え">
						{[...floorNumbers].reverse().map((f) => (
							<button
								key={f}
								type="button"
								onClick={() => goFloor(f)}
								aria-pressed={f === floor}
								className={`h-9 w-10 rounded-md border text-sm ${f === floor ? 'border-accent bg-accent text-base' : 'border-accent/40 text-text'}`}
							>
								{f}F
							</button>
						))}
					</div>
				</header>

				<div className="flex min-h-0 flex-1 overflow-hidden px-2 pb-2 md:px-5 md:pb-5" onClick={() => setSelectedKey(null)}>
					<div className="hidden w-[190px] shrink-0 flex-col justify-center gap-3 pr-4 md:flex" onClick={(e) => e.stopPropagation()}>
						<FloorStack floors={floors} current={floor} counts={counts} onSelect={goFloor} className="w-full" />
						<p className="text-xs leading-snug text-text/60">
							階を押すと移動します。
							<br />
							図面はホイール・ドラッグで拡大・移動できます。
						</p>
					</div>
					<div
						ref={panZoom.ref}
						{...panZoom.handlers}
						className="relative h-full min-w-0 flex-1 touch-none select-none"
						onClick={(e) => e.stopPropagation()}
					>
						<FloorPlan
							key={floor}
							floor={current}
							viewBox={panZoom.viewBox}
							exhibits={exhibits}
							selectedKey={selectedKey}
							hoveredKey={hoveredKey}
							floorNumbers={floorNumbers}
							onSelect={(key) => setSelectedKey(key)}
							onHover={setHoveredKey}
							onGoFloor={goFloor}
							className={`h-full w-full ${direction ? `map-floor-enter-${direction}` : ''}`}
						/>
						<div className="absolute right-1 bottom-1 flex flex-col gap-1" role="group" aria-label="図面の拡大・縮小">
							<ZoomButton label="拡大" onClick={panZoom.zoomIn}>＋</ZoomButton>
							<ZoomButton label="縮小" onClick={panZoom.zoomOut} disabled={panZoom.zoom <= 1}>－</ZoomButton>
							{panZoom.zoom > 1 && (
								<ZoomButton label="全体を表示" onClick={panZoom.reset}>⤢</ZoomButton>
							)}
						</div>
					</div>
				</div>
			</section>

			<aside className="flex h-[42%] w-full flex-col border-t border-accent/30 bg-base/95 md:h-full md:w-[360px] md:border-t-0 md:border-l">
				<div className="flex flex-wrap gap-x-3 gap-y-1 border-b border-text/10 px-4 py-2.5">
					{Object.values(EXHIBIT_GROUPS).map((g) => (
						<span key={g.label} className="inline-flex items-center gap-1 text-xs text-text/80">
							<span className="inline-block h-2.5 w-2.5 rounded-sm" style={{ backgroundColor: g.color }} aria-hidden="true" />
							{g.label}
						</span>
					))}
				</div>
				<div className="flex-1 overflow-y-auto p-3" aria-live="polite">
					{selectedRoom ? (
						<RoomDetail room={selectedRoom} items={exhibits[selectedRoom.key] ?? []} onBack={() => setSelectedKey(null)} />
					) : (
						<FloorExhibitList
							title={`${plan.building} ${floor}F の出展`}
							items={floorItems(floor)}
							hoveredKey={hoveredKey}
							onHover={setHoveredKey}
							onSelect={setSelectedKey}
						/>
					)}
				</div>
			</aside>
		</div>
	);
}

function ZoomButton({ label, onClick, disabled, children }: { label: string; onClick: () => void; disabled?: boolean; children: string }) {
	return (
		<button
			type="button"
			aria-label={label}
			title={label}
			onClick={(e) => {
				e.stopPropagation();
				onClick();
			}}
			disabled={disabled}
			className="h-9 w-9 rounded-md border border-accent/50 bg-base/90 text-lg leading-none text-accent hover:border-main hover:text-main disabled:opacity-40"
		>
			{children}
		</button>
	);
}
