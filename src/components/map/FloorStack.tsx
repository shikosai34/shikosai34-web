import type { PlanFloor } from '../../lib/map';

/*
 * 建物を斜め上から見た階の積み重ね。今いる階と、その上下に階があることを示す。
 * 各階の部屋の形をそのまま薄い板にして重ね、今いる階だけ明るく塗る（光らせはしない）。
 */

interface Props {
	floors: PlanFloor[];
	current: number;
	/** 階ごとの出展数 */
	counts: Record<number, number>;
	onSelect: (floor: number) => void;
	className?: string;
}

export default function FloorStack({ floors, current, counts, onSelect, className = '' }: Props) {
	const W = 150;
	const TILT = 0.42;
	const SKEW = 0.3;
	const THICK = 5;
	const maxW = Math.max(...floors.map((f) => f.bbox[2] - f.bbox[0]));
	const maxH = Math.max(...floors.map((f) => f.bbox[3] - f.bbox[1]));
	const k = W / (maxW + maxH * SKEW);
	const slabH = maxH * k * TILT;
	// 少しだけ重ねて「積み重なっている」感じを出す
	const GAP = slabH * 0.8 + 8;
	const top = [...floors].sort((a, b) => b.floor - a.floor);
	const height = slabH + GAP * (floors.length - 1) + THICK + 8;

	/** 平面図の点 → 斜め上から見た座標（各階の中心を揃える） */
	const project = (f: PlanFloor, [x, y]: [number, number], i: number) => {
		const dx = x - (f.bbox[0] + f.bbox[2]) / 2;
		const dy = y - (f.bbox[1] + f.bbox[3]) / 2;
		return [W / 2 + dx * k - dy * k * SKEW, 4 + slabH / 2 + dy * k * TILT + i * GAP] as const;
	};

	return (
		<svg viewBox={`0 0 ${W + 70} ${height}`} className={`overflow-visible ${className}`} aria-hidden="true">
			{/* 下の階から描いて、上の階が手前に重なるようにする */}
			{[...top].reverse().map((f) => {
				const i = top.indexOf(f);
				const isCurrent = f.floor === current;
				const pts = (dy: number, points: [number, number][]) =>
					points
						.map((p) => project(f, p, i))
						.map(([x, y]) => `${x},${y + dy}`)
						.join(' ');
				return (
					<g key={f.floor} onClick={() => onSelect(f.floor)} className="cursor-pointer" opacity={f.floor > current ? 0.45 : 1}>
						{f.rooms.map((r) => (
							<polygon key={`t-${r.id}`} points={pts(THICK, r.points)} fill={isCurrent ? '#2a6770' : '#16475c'} />
						))}
						{f.rooms.map((r) => (
							<polygon
								key={r.id}
								points={pts(0, r.points)}
								fill={isCurrent ? '#4b9aa0' : '#1f5a70'}
								stroke={isCurrent ? '#4b9aa0' : '#1f5a70'}
								strokeWidth={1.5}
							/>
						))}
					</g>
				);
			})}
			{top.map((f, i) => {
				const y = 4 + slabH / 2 + i * GAP;
				const isCurrent = f.floor === current;
				return (
					<g key={`l-${f.floor}`} onClick={() => onSelect(f.floor)} className="cursor-pointer">
						<line x1={W - 6} x2={W + 8} y1={y} y2={y} stroke={isCurrent ? '#e8e8e8' : '#4d7a8a'} strokeWidth={1.5} />
						<text x={W + 12} y={y + 6} fontSize={isCurrent ? 19 : 15} fill={isCurrent ? '#e8e8e8' : '#8fb0bb'}>
							{f.floor}F
						</text>
						{counts[f.floor] > 0 && (
							<text x={W + (isCurrent ? 42 : 38)} y={y + 5} fontSize={11} fill="#ff9933">
								●{counts[f.floor]}
							</text>
						)}
					</g>
				);
			})}
		</svg>
	);
}
