import { useEffect, useMemo, useState } from 'react';
import { EXHIBIT_GROUPS, PLAN_SCALE, type ExhibitsByRoom, type Plan, type PlanRoom } from '../../lib/map';
import { MAP_ROOMS, type Weather } from '../../lib/map-rooms';
import ExhibitPopover from './ExhibitPopover';
import { FloorExhibitList, type FloorExhibit } from './ExhibitPanel';
import FloorPlan from './FloorPlan';
import FloorStack from './FloorStack';
import RoomTooltip from './RoomTooltip';
import WeatherToggle from './WeatherToggle';
import { usePanZoom } from './usePanZoom';

/*
  * 建物のフロア画面（2D）。左に階の積み重ね、中央に平面図、右（モバイルでは下）に出展一覧。
  * 階はホイール・縦のスワイプ・PageUp/PageDown・階の積み重ね図で移る。移ると、上の階へは上から・
  * 下の階へは下から図面が入ってくる。部屋をタップすると、その場所の近くへサークルの情報が開く。
 */

interface Props {
	plan: Plan;
	exhibits: ExhibitsByRoom;
	weather: Weather;
	onWeatherChange: (weather: Weather) => void;
	initialFloor?: number;
	initialRoom?: string;
	onClose: () => void;
	/** 階・部屋が変わったとき（URL の書き換えに使う） */
	onChange: (floor: number, room: string | null) => void;
}

const S = PLAN_SCALE;

export default function FloorPlanView({ plan, exhibits, weather, onWeatherChange, initialFloor, initialRoom, onClose, onChange }: Props) {
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
	/** カーソルの下の部屋と、図面の枠の中での位置（詳細のツールチップ用） */
	const [tip, setTip] = useState<{ room: PlanRoom; x: number; y: number } | null>(null);
	/** 開いているポップアップ（部屋と、図面の枠の中での位置） */
	const [popup, setPopup] = useState<{ room: PlanRoom; x: number; y: number } | null>(null);

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

	// 部屋の選択がなくなったらポップアップも閉じる
	useEffect(() => {
		if (!selectedKey) setPopup(null);
	}, [selectedKey]);

	const goFloor = (f: number) => {
		if (f === floor) return;
		setDirection(f > floor ? 'up' : 'down');
		setFloor(f);
		setSelectedKey(null);
		setHoveredKey(null);
		setTip(null);
	};
	/** 1 つ上（1）・下（-1）の階へ。いちばん上・下ならそのまま */
	const stepFloor = (direction: 1 | -1) => {
		const next = floorNumbers[floorNumbers.indexOf(floor) + direction];
		if (next !== undefined) goFloor(next);
	};

	// PageUp / PageDown でも階を移す
	useEffect(() => {
		const onKey = (e: KeyboardEvent) => {
			if (e.key === 'PageUp') stepFloor(1);
			else if (e.key === 'PageDown') stepFloor(-1);
			else return;
			e.preventDefault();
		};
		window.addEventListener('keydown', onKey);
		return () => window.removeEventListener('keydown', onKey);
	}); // eslint-disable-line react-hooks/exhaustive-deps -- stepFloor は毎回作り直すので、描画のたびに付け直す

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
	const panZoom = usePanZoom(baseBox, floor, { onNavigate: stepFloor });

	/** 部屋をタップした位置（画面の座標）に、情報のポップアップを開く。枠の外へ出ないよう位置を寄せる */
	const pickRoom = (room: PlanRoom, clientX: number, clientY: number) => {
		const box = panZoom.ref.current?.getBoundingClientRect();
		if (!room.key || !box) return;
		setSelectedKey(room.key);
		setTip(null);
		setPopup({
			room,
			x: Math.min(Math.max(clientX - box.left, 0), box.width),
			y: Math.min(Math.max(clientY - box.top, 0), box.height),
		});
	};

	/** 部屋のキーから、その部屋の中央にポップアップを開く（出展一覧・URL から開くとき） */
	const openRoom = (key: string) => {
		const room = floors.flatMap((f) => f.rooms).find((r) => r.key === key);
		const svg = panZoom.ref.current?.querySelector('svg');
		const ctm = svg?.getScreenCTM();
		if (!room || !svg || !ctm) return setSelectedKey(key);
		const point = svg.createSVGPoint();
		point.x = ((room.bbox[0] + room.bbox[2]) / 2) * S;
		point.y = ((room.bbox[1] + room.bbox[3]) / 2) * S;
		const at = point.matrixTransform(ctm);
		pickRoom(room, at.x, at.y);
	};

	// URL で部屋が指定されていれば、描画のあとにその部屋のポップアップを開く
	useEffect(() => {
		if (!initialRoom) return;
		const id = requestAnimationFrame(() => openRoom(initialRoom));
		return () => cancelAnimationFrame(id);
	}, []); // eslint-disable-line react-hooks/exhaustive-deps

	const pointRoom = (room: PlanRoom | null, clientX?: number, clientY?: number) => {
		const box = panZoom.ref.current?.getBoundingClientRect();
		if (!room || !box || clientX === undefined || clientY === undefined) return setTip(null);
		setTip({ room, x: clientX - box.left, y: clientY - box.top });
	};

	const floorItems = (f: number): FloorExhibit[] =>
		roomsInPlan
			.filter((room) => room.floor === f)
			.flatMap((room) => (exhibits[room.key] ?? []).map((item) => ({ item, room })));
	const counts = Object.fromEntries(floorNumbers.map((f) => [f, floorItems(f).length]));


	return (
		// 上端（pt-20）はヘッダーのロゴ・メニューが重なるので空けておく
		<div className="map-floor-view absolute inset-0 z-20 flex flex-col bg-base pt-20 md:flex-row">
			<section className="flex min-h-0 flex-1 flex-col">
				<header className="flex items-center gap-2 px-3 py-3 md:gap-3 md:px-5">
					<button
						type="button"
						onClick={onClose}
						aria-label="キャンパスに戻る"
						className="shrink-0 whitespace-nowrap rounded-lg border border-accent/60 bg-base/80 px-3 py-1.5 text-sm text-accent hover:border-main hover:text-main"
					>
						←<span className="hidden sm:inline"> キャンパス</span>
					</button>
					<h3 className="flex min-w-0 items-baseline gap-2 whitespace-nowrap text-text">
						<span className="truncate text-xl">{plan.building}</span>
						<span className="shrink-0 text-2xl leading-none text-text">
							{floor}F
						</span>
					</h3>
					<WeatherToggle weather={weather} onChange={onWeatherChange} className="ml-auto hidden md:inline-flex" />
					{/* モバイルは階のボタンを並べる（積み重ね図は小さすぎて押しにくい） */}
					<div className="ml-auto flex shrink-0 gap-1 md:hidden" role="group" aria-label="階の切り替え">
						{[...floorNumbers].reverse().map((f) => (
							<button
								key={f}
								type="button"
								onClick={() => goFloor(f)}
								aria-pressed={f === floor}
								className={`h-9 w-9 rounded-md border text-sm ${f === floor ? 'border-accent bg-accent text-base' : 'border-accent/40 text-text'}`}
							>
								{f}F
							</button>
						))}
					</div>
				</header>

				<div className="flex min-h-0 flex-1 overflow-hidden px-2 pb-2 md:px-5 md:pb-5" onClick={() => setSelectedKey(null)}>
					<div className="hidden w-[190px] shrink-0 flex-col justify-center gap-3 pr-4 md:flex" onClick={(e) => e.stopPropagation()}>
						<FloorStack floors={floors} current={floor} counts={counts} onSelect={goFloor} className="w-full" />
						{/* 1 行ずつ短く区切り、欄の幅で折り返さないようにする */}
						<ul className="flex flex-col gap-0.5 whitespace-nowrap text-xs text-text/60">
							<li>部屋を押すと詳細</li>
							<li>ホイールで階を移動</li>
							<li>Ctrl＋ホイールで拡大</li>
							<li>ドラッグで移動</li>
						</ul>
					</div>
					<div
						ref={panZoom.ref}
						{...panZoom.handlers}
						onPointerMove={(e) => {
							// ドラッグで図面を動かしている間は詳細を出さない
							if (e.buttons && e.pointerType === 'mouse') setTip(null);
							panZoom.handlers.onPointerMove(e);
						}}
						onPointerLeave={() => setTip(null)}
						className="relative h-full min-w-0 flex-1 touch-none select-none"
						onClick={(e) => e.stopPropagation()}
					>
						<FloorPlan
							key={floor}
							floor={current}
							viewBox={panZoom.viewBox}
							weather={weather}
							exhibits={exhibits}
							selectedKey={selectedKey}
							hoveredKey={hoveredKey}
							floorNumbers={floorNumbers}
							onSelect={(key) => setSelectedKey(key)}
							onHover={setHoveredKey}
							onPoint={pointRoom}
							onPick={pickRoom}
							onGoFloor={goFloor}
							className={`h-full w-full ${direction ? `map-floor-enter-${direction}` : ''}`}
						/>
						{tip && !popup && (
							<RoomTooltip
								room={tip.room}
								use={tip.room.use?.[weather]}
								exhibits={tip.room.key ? (exhibits[tip.room.key] ?? []) : []}
								x={tip.x}
								y={tip.y}
								width={panZoom.ref.current?.clientWidth ?? 0}
								height={panZoom.ref.current?.clientHeight ?? 0}
							/>
						)}
						{popup && (
							<ExhibitPopover
								badge={popup.room.number}
								title={popup.room.name ?? popup.room.number ?? ''}
								use={popup.room.use?.[weather]}
								items={popup.room.key ? (exhibits[popup.room.key] ?? []) : []}
								x={popup.x}
								y={popup.y}
								width={panZoom.ref.current?.clientWidth ?? 0}
								height={panZoom.ref.current?.clientHeight ?? 0}
								onClose={() => setSelectedKey(null)}
							/>
						)}
						{floors.length > 1 && panZoom.zoom <= 1 && (
							<p className="pointer-events-none absolute bottom-2 left-2 text-[11px] text-text/50 md:hidden">上下にスワイプで階を移動</p>
						)}
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
				{/* 凡例は 1 行に並べる。狭い画面では横にずらして見る（スクロールバーは出さない） */}
				<div className="flex gap-x-2 overflow-x-auto whitespace-nowrap border-b border-text/10 px-4 py-2.5 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
					{Object.values(EXHIBIT_GROUPS).map((g) => (
						<span key={g.label} className="inline-flex shrink-0 items-center gap-1 text-xs text-text/80">
							<span className="inline-block h-2.5 w-2.5 rounded-sm" style={{ backgroundColor: g.color }} aria-hidden="true" />
							{g.label}
						</span>
					))}
				</div>
				<div className="flex-1 overflow-y-auto p-3" aria-live="polite">
					<WeatherToggle weather={weather} onChange={onWeatherChange} className="mb-3 md:hidden" />
					<FloorExhibitList
						title={`${plan.building} ${floor}F の出展`}
						items={floorItems(floor)}
						hoveredKey={selectedKey ?? hoveredKey}
						onHover={setHoveredKey}
						onSelect={openRoom}
					/>
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
