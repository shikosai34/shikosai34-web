import type { KeyboardEvent } from 'react';
import type { Weather } from '../../lib/map-rooms';
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
	/** 天候（部屋の使い道が天候で変わる） */
	weather: Weather;
	exhibits: ExhibitsByRoom;
	selectedKey: string | null;
	hoveredKey: string | null;
	floorNumbers: number[];
	onSelect: (key: string | null) => void;
	onHover: (key: string | null) => void;
	/** カーソルの下の部屋（詳細のツールチップ用）。null で外れた */
	onPoint: (room: PlanRoom | null, clientX?: number, clientY?: number) => void;
	onGoFloor: (floor: number) => void;
	className?: string;
}

const BASE = '#0b3041';
/** 予選会場・休憩所など、出展ではない使い道のある部屋の色（凡例の「ステージ」と同じピンク） */
const USE_COLOR = '#ff6ea8';

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
	weather,
	exhibits,
	selectedKey,
	hoveredKey,
	floorNumbers,
	onSelect,
	onHover,
	onPoint,
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
			onClick={() => {
				onSelect(null);
				onPoint(null);
			}}
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
					use={room.use?.[weather]}
					exhibits={room.key ? (exhibits[room.key] ?? []) : []}
					active={!!room.key && room.key === activeKey}
					dimmed={!!selectedKey && room.key !== selectedKey && room.kind === 'room'}
					onSelect={onSelect}
					onHover={onHover}
					onPoint={onPoint}
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
	/** その天候での使い道（予選会場・休憩所など） */
	use?: string;
	exhibits: ExhibitsByRoom[string];
	active: boolean;
	dimmed: boolean;
	onSelect: (key: string | null) => void;
	onHover: (key: string | null) => void;
	onPoint: (room: PlanRoom | null, clientX?: number, clientY?: number) => void;
}

/**
 * 文字列の幅の目安（px）。全角は 1 字 ≒ 1em、半角は ≒ 0.6em とみて少し多めに見積もる。
 * foreignObject の中身は描いてみないと幅が分からないため、収まるかの判定はこの見積もりで行う。
 */
function textWidth(text: string, fontSize: number): number {
	let em = 0;
	for (const ch of text) em += (ch.codePointAt(0) ?? 0) < 0x2000 ? 0.62 : 1.05;
	return em * fontSize;
}

/** 行の高さ（px）。フォントの大きさ × 1.3 */
const lineHeight = (fontSize: number) => fontSize * 1.3;

function Room({ room, use, exhibits, active, dimmed, onSelect, onHover, onPoint }: RoomProps) {
	const [x0, y0, x1, y1] = room.bbox.map((v) => v * S);
	const w = x1 - x0;
	const h = y1 - y0;
	const points = toPoints(room);
	const main = exhibits[0];
	const color = main ? EXHIBIT_GROUPS[main.group].color : null;
	const selectable = !!room.key;
	// 名前・番号・出展のどれかがあれば、カーソルを当てたときに詳細を出す
	const hasDetail = !!(room.name || room.number || use || exhibits.length);

	const fill =
		room.kind === 'corridor'
			? mix('#00ffcc', BASE, 0.05)
			: room.kind === 'toilet'
				? mix('#e8e8e8', BASE, 0.08)
				: color
					? mix(color, BASE, 0.16)
					: use
						? mix(USE_COLOR, BASE, 0.14)
						: mix('#e8e8e8', BASE, 0.04);

	/*
	 * 部屋の中の文字は、収まるものだけ出す（… で切ったり折り返したりしない）。
	 * 収まらない分はカーソルを当てたときの詳細（FloorPlanView のツールチップ）で見せる。
	 */
	const iw = w - 8;
	const ih = h - 6;
	const badgeW = room.number ? textWidth(room.number, 10) + 8 : 0;
	const showBadge = room.kind === 'room' && !!room.number && badgeW <= iw && ih >= lineHeight(10);
	const nameSize = showBadge ? 10 : 11;
	const showName =
		room.kind === 'room' &&
		!!room.name &&
		ih >= lineHeight(nameSize) &&
		textWidth(room.name, nameSize) <= iw - (showBadge ? badgeW + 4 : 0);
	const firstLine = showBadge || showName;

	const titleSize = w > 100 ? 12 : 11;
	const more = exhibits.length > 1 ? ` ほか${exhibits.length - 1}件` : '';
	const titleRoom = ih - (firstLine ? lineHeight(10) + 4 : 0);
	const showImage = !!main?.image && titleRoom > 50;
	const horizontal = w >= h * 1.3;
	const imageW = showImage && horizontal ? Math.min(48, titleRoom) + 6 : 0;
	const showTitle = !!main && titleRoom >= lineHeight(titleSize) && textWidth(main.title + more, titleSize) <= iw - imageW;
	// 出展名が入らないときは件数だけ出し、カーソルを当てれば見られることを示す
	const countText = `●${exhibits.length}`;
	const showCount = !!main && !showTitle && titleRoom >= lineHeight(11) && textWidth(countText, 11) <= iw;
	// 出展のない部屋は、当日の使い道（予選会場・休憩所など）を書く
	const showUse = !main && !!use && titleRoom >= lineHeight(12) && textWidth(use, 12) <= iw;

	const centerText = room.kind === 'stairs' ? '階段' : room.kind === 'toilet' ? room.name : null;
	const centerSize = Math.min(10, h / 2.5);
	const showCenter = !!centerText && textWidth(centerText, centerSize) <= iw && ih >= lineHeight(centerSize);

	// L 字の部屋の名前は、ラベルの点から部屋の外接矩形の端までに収める
	const labelHalf = room.labelAt ? Math.min(room.labelAt[0] * S - x0, x1 - room.labelAt[0] * S) - 3 : 0;
	// 出展がなく使い道（休憩所など）がある部屋は、部屋名の代わりに使い道を書く
	const labelText = main ? main.title + more : (use ?? room.name);
	const showLabelAt = !!room.labelAt && room.kind === 'room' && !!labelText && textWidth(labelText, 11) <= labelHalf * 2;

	const onKeyDown = (e: KeyboardEvent) => {
		if (e.key === 'Enter' || e.key === ' ') {
			e.preventDefault();
			onSelect(room.key);
		}
	};

	return (
		<g
			{...(hasDetail && {
				onPointerMove: (e) => onPoint(room, e.clientX, e.clientY),
				onPointerDown: (e) => onPoint(room, e.clientX, e.clientY),
				onPointerLeave: () => onPoint(null),
			})}
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
			{(color ?? (use ? USE_COLOR : null)) && !active && (
				<polygon points={points} fill="none" stroke={color ?? USE_COLOR} strokeWidth={1.5} strokeOpacity={0.8} />
			)}
			{active && <polygon points={points} fill="none" stroke="#ff9933" strokeWidth={4} filter="url(#plan-glow)" />}

			{showLabelAt && (
				<foreignObject
					x={room.labelAt![0] * S - labelHalf}
					y={room.labelAt![1] * S - 10}
					width={labelHalf * 2}
					height={20}
					style={{ pointerEvents: 'none' }}
				>
					<div
						className="flex h-full w-full items-center justify-center whitespace-nowrap font-medium text-text"
						style={{ fontSize: 11, color: !main && use ? USE_COLOR : undefined }}
					>
						{labelText}
					</div>
				</foreignObject>
			)}

			{!room.labelAt && (firstLine || showTitle || showCount || showUse || showCenter) && (
				<foreignObject x={x0 + 3} y={y0 + 3} width={Math.max(w - 6, 1)} height={Math.max(h - 6, 1)} style={{ pointerEvents: 'none' }}>
					<div className="flex h-full w-full flex-col overflow-hidden whitespace-nowrap text-text" style={{ fontSize: 11, lineHeight: 1.3 }}>
						{room.kind === 'room' ? (
							<>
								{firstLine && (
									<div className="flex shrink-0 items-center gap-1">
										{showBadge && (
											<span className="shrink-0 rounded-sm bg-accent/85 px-1 font-medium text-base" style={{ fontSize: 10 }}>
												{room.number}
											</span>
										)}
										{showName && (
											<span className={showBadge ? 'text-text/70' : 'font-medium'} style={{ fontSize: nameSize }}>
												{room.name}
											</span>
										)}
									</div>
								)}
								{showUse && (
									<div className="m-auto font-medium" style={{ fontSize: 12, color: USE_COLOR }}>
										{use}
									</div>
								)}
								{(showTitle || showCount || showImage) && (
									<div className={`mt-1 flex min-h-0 flex-1 gap-1.5 ${horizontal ? 'items-center' : 'flex-col items-start'}`}>
										{showImage && (
											<img
												src={main!.image}
												alt=""
												className={`${horizontal ? 'aspect-square h-full max-h-[48px]' : 'min-h-0 w-full flex-1'} shrink-0 rounded-sm object-cover`}
											/>
										)}
										{showTitle && (
											<div className="font-medium" style={{ fontSize: titleSize }}>
												{main!.title}
												{more && <span className="text-text/60">{more}</span>}
											</div>
										)}
										{showCount && (
											<div style={{ fontSize: 11, color: color ?? undefined }} aria-hidden="true">
												{countText}
											</div>
										)}
									</div>
								)}
							</>
						) : (
							showCenter && (
								<div className="m-auto text-center text-text/60" style={{ fontSize: centerSize }}>
									{centerText}
								</div>
							)
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
	// 札の長さに関わらず切れないよう枠は広めに取り、札のない余白はクリックを下の部屋へ通す
	const w = 320;
	if (marker.type === 'stairs' && !up && !down) return null;

	return (
		<foreignObject x={x - w / 2} y={y - 12} width={w} height={24} style={{ pointerEvents: 'none' }}>
			<div className="flex h-full w-full items-center justify-center [&>*]:pointer-events-auto">
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
