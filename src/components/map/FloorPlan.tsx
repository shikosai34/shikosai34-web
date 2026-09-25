import type { KeyboardEvent } from 'react';
import { EXHIBIT_GROUPS, PLAN_SCALE, type ExhibitsByRoom, type PlanFloor, type PlanMarker, type PlanRoom } from '../../lib/map';

/*
 * 1 フロア分の平面図。夜の図面をネオン管でなぞったような見た目にする。
 * - 壁はシアンの発光線、部屋は濃紺の面
 * - 出展のある部屋は区分の色で縁取り、名前を部屋の中に書く
 * - 選んだ部屋は橙で強く光らせる
 */

const S = PLAN_SCALE;

interface Props {
	floor: PlanFloor;
	/** 全階で共通の viewBox（階を切り替えても縮尺が変わらないように） */
	viewBox: string;
	exhibits: ExhibitsByRoom;
	selectedKey: string | null;
	hoveredKey: string | null;
	floorNumbers: number[];
	onSelect: (key: string | null) => void;
	onHover: (key: string | null) => void;
	onGoFloor: (floor: number) => void;
	className?: string;
}

const BASE = '#0b3041';

/** 2 色を混ぜる（a を t の割合で b に混ぜる）。SVG の fill 属性では color-mix() が効かない環境があるため */
function mix(a: string, b: string, t: number): string {
	const rgb = (hex: string) => [1, 3, 5].map((i) => Number.parseInt(hex.slice(i, i + 2), 16));
	const [ca, cb] = [rgb(a), rgb(b)];
	return `#${ca.map((v, i) => Math.round(v * t + cb[i] * (1 - t)).toString(16).padStart(2, '0')).join('')}`;
}

const toPoints = (room: PlanRoom) => room.points.map(([x, y]) => `${x * S},${y * S}`).join(' ');

export default function FloorPlan({
	floor,
	viewBox,
	exhibits,
	selectedKey,
	hoveredKey,
	floorNumbers,
	onSelect,
	onHover,
	onGoFloor,
	className = '',
}: Props) {
	const activeKey = hoveredKey ?? selectedKey;

	return (
		<svg
			viewBox={viewBox}
			className={className}
			preserveAspectRatio="xMidYMid meet"
			role="group"
			aria-label={`${floor.floor}階の平面図`}
			onClick={() => onSelect(null)}
		>
			<defs>
				<filter id="plan-glow" x="-10%" y="-10%" width="120%" height="120%">
					<feGaussianBlur stdDeviation="1.5" result="blur" />
					<feMerge>
						<feMergeNode in="blur" />
						<feMergeNode in="SourceGraphic" />
					</feMerge>
				</filter>
				{/* 階段の段 */}
				<pattern id="plan-stairs" width={5} height={5} patternUnits="userSpaceOnUse">
					<line x1={0} y1={2.5} x2={5} y2={2.5} stroke="#00ffcc" strokeOpacity={0.25} strokeWidth={1} />
				</pattern>
			</defs>

			{/* 床（部屋の面） */}
			{floor.rooms.map((room) => (
				<Room
					key={room.id}
					room={room}
					exhibits={room.key ? (exhibits[room.key] ?? []) : []}
					active={!!room.key && room.key === activeKey}
					dimmed={!!selectedKey && room.key !== selectedKey && room.kind === 'room'}
					onSelect={onSelect}
					onHover={onHover}
				/>
			))}

			{/* 壁 */}
			<g filter="url(#plan-glow)" style={{ pointerEvents: 'none' }}>
				{floor.walls.map(([x0, y0, x1, y1], i) => (
					<rect key={i} x={x0 * S} y={y0 * S} width={(x1 - x0) * S} height={(y1 - y0) * S} fill="#00ffcc" fillOpacity={0.75} />
				))}
			</g>

			{floor.markers.map((marker, i) => (
				<Marker key={i} marker={marker} floor={floor.floor} floorNumbers={floorNumbers} onGoFloor={onGoFloor} />
			))}
		</svg>
	);
}

interface RoomProps {
	room: PlanRoom;
	exhibits: ExhibitsByRoom[string];
	active: boolean;
	dimmed: boolean;
	onSelect: (key: string | null) => void;
	onHover: (key: string | null) => void;
}

function Room({ room, exhibits, active, dimmed, onSelect, onHover }: RoomProps) {
	const [x0, y0, x1, y1] = room.bbox.map((v) => v * S);
	const w = x1 - x0;
	const h = y1 - y0;
	const points = toPoints(room);
	const main = exhibits[0];
	const color = main ? EXHIBIT_GROUPS[main.group].color : null;
	const selectable = !!room.key;

	const fill =
		room.kind === 'corridor'
			? mix('#00ffcc', BASE, 0.05)
			: room.kind === 'toilet'
				? mix('#e8e8e8', BASE, 0.08)
				: color
					? mix(color, BASE, 0.16)
					: mix('#e8e8e8', BASE, 0.04);

	const label = room.number ?? (room.kind === 'room' ? room.name : null);
	const onKeyDown = (e: KeyboardEvent) => {
		if (e.key === 'Enter' || e.key === ' ') {
			e.preventDefault();
			onSelect(room.key);
		}
	};

	return (
		<g
			{...(selectable && {
				role: 'button',
				tabIndex: 0,
				'aria-label': [room.number, room.name, exhibits.length ? `出展${exhibits.length}件` : null].filter(Boolean).join(' '),
				'aria-pressed': active,
				onClick: (e) => {
					e.stopPropagation();
					onSelect(room.key);
				},
				onKeyDown,
				onMouseEnter: () => onHover(room.key),
				onMouseLeave: () => onHover(null),
				onFocus: () => onHover(room.key),
				onBlur: () => onHover(null),
			})}
			className={selectable ? 'cursor-pointer outline-none' : undefined}
			style={{ opacity: dimmed ? 0.4 : 1, transition: 'opacity .2s' }}
		>
			<polygon points={points} fill={fill} />
			{room.kind === 'stairs' && <polygon points={points} fill="url(#plan-stairs)" />}
			{color && !active && <polygon points={points} fill="none" stroke={color} strokeWidth={1.5} strokeOpacity={0.8} />}
			{active && <polygon points={points} fill="none" stroke="#ff9933" strokeWidth={4} filter="url(#plan-glow)" />}

			{(room.kind === 'room' || room.kind === 'toilet' || room.kind === 'stairs') && (label || room.kind !== 'room') && (
				<foreignObject x={x0 + 3} y={y0 + 3} width={Math.max(w - 6, 1)} height={Math.max(h - 6, 1)} style={{ pointerEvents: 'none' }}>
					{/* 部屋の中の文字は折り返さず、入り切らない分は … で切る */}
					<div className="flex h-full w-full flex-col overflow-hidden whitespace-nowrap text-text" style={{ fontSize: 11, lineHeight: 1.3 }}>
						{room.kind === 'room' ? (
							<>
								<div className="flex min-w-0 shrink-0 items-center gap-1">
									{room.number && (
										<span className="shrink-0 rounded-sm bg-accent/85 px-1 font-medium text-base" style={{ fontSize: 10 }}>
											{room.number}
										</span>
									)}
									{room.name && room.number && <span className="min-w-0 truncate text-text/70" style={{ fontSize: 10 }}>{room.name}</span>}
									{!room.number && room.name && <span className="min-w-0 truncate font-medium">{room.name}</span>}
								</div>
								{main && (
									<div className={`mt-1 flex min-h-0 flex-1 gap-1.5 ${w < h * 1.3 ? 'flex-col items-start' : 'items-center'}`}>
										{main.image && h > 60 && (
											<img
												src={main.image}
												alt=""
												className={`${w < h * 1.3 ? 'min-h-0 w-full flex-1' : 'aspect-square h-full max-h-[48px]'} shrink-0 rounded-sm object-cover`}
											/>
										)}
										<div className="w-full min-w-0 truncate font-medium" style={{ fontSize: w > 100 ? 12 : 11 }}>
											{main.title}
											{exhibits.length > 1 && <span className="text-text/60"> ほか{exhibits.length - 1}件</span>}
										</div>
									</div>
								)}
							</>
						) : (
							<div className="m-auto max-w-full truncate text-center text-text/60" style={{ fontSize: Math.min(10, h / 2.5) }}>
								{room.kind === 'stairs' ? '階段' : room.name}
							</div>
						)}
					</div>
				</foreignObject>
			)}
		</g>
	);
}

interface MarkerProps {
	marker: PlanMarker;
	floor: number;
	floorNumbers: number[];
	onGoFloor: (floor: number) => void;
}

/** 階段・入口などの目印。階段には上下の階へのボタンを付ける */
function Marker({ marker, floor, floorNumbers, onGoFloor }: MarkerProps) {
	const [x, y] = marker.at.map((v) => v * S);
	const up = floorNumbers.includes(floor + 1) ? floor + 1 : null;
	const down = floorNumbers.includes(floor - 1) ? floor - 1 : null;
	const w = marker.type === 'stairs' ? 110 : 160;
	if (marker.type === 'stairs' && !up && !down) return null;

	return (
		<foreignObject x={x - w / 2} y={y - 12} width={w} height={24}>
			<div className="flex h-full w-full items-center justify-center">
				{marker.type === 'stairs' ? (
					<div className="flex items-center gap-1 whitespace-nowrap rounded-full border border-accent/50 bg-base/90 py-0.5 pr-0.5 pl-1.5 text-text" style={{ fontSize: 9 }}>
						<span className="mr-1 text-text/70">階段</span>
						{up && (
							<button
								type="button"
								onClick={(e) => {
									e.stopPropagation();
									onGoFloor(up);
								}}
								className="rounded-full bg-accent px-1.5 font-medium text-base hover:bg-main"
							>
								↑{up}F
							</button>
						)}
						{down && (
							<button
								type="button"
								onClick={(e) => {
									e.stopPropagation();
									onGoFloor(down);
								}}
								className="rounded-full border border-accent/60 px-1.5 font-medium text-accent hover:border-main hover:text-main"
							>
								↓{down}F
							</button>
						)}
					</div>
				) : (
					<div
						className={`whitespace-nowrap rounded-full px-2 py-0.5 font-medium ${marker.type === 'entrance' ? 'bg-main text-base' : 'border border-glow-pink bg-base/90 text-glow-pink'}`}
						style={{ fontSize: 9 }}
					>
						{marker.text}
					</div>
				)}
			</div>
		</foreignObject>
	);
}
