import { EXHIBIT_GROUPS, type MapExhibit, type PlanRoom } from '../../lib/map';

/*
 * 平面図の部屋にカーソルを当てた（スマホでは触れた）ときに出す詳細。
 * 図面の中には収まる文字しか書かないので、部屋番号・部屋名・出展の全文はここで見せる。
 */

/** 出展を並べる上限。超えた分は「ほか N 件」にまとめる */
const MAX_ITEMS = 4;

interface Props {
	room: PlanRoom;
	/** その天候での使い道（予選会場・休憩所など） */
	use?: string;
	exhibits: MapExhibit[];
	/** 図面の枠の中での位置（px） */
	x: number;
	y: number;
	/** 図面の枠の大きさ。端に近いときはカーソルの反対側へ出す */
	width: number;
	height: number;
}

export default function RoomTooltip({ room, use, exhibits, x, y, width, height }: Props) {
	const flipX = x > width * 0.6;
	const flipY = y > height * 0.7;
	const shown = exhibits.slice(0, MAX_ITEMS);

	return (
		<div
			role="tooltip"
			className="pointer-events-none absolute z-10 whitespace-nowrap rounded-md border border-accent/50 bg-base/95 px-2.5 py-1.5 text-xs text-text shadow-[0_0_12px_color-mix(in_srgb,var(--color-accent)_25%,transparent)]"
			style={{
				left: x + (flipX ? -14 : 14),
				top: y + (flipY ? -14 : 14),
				transform: `translate(${flipX ? '-100%' : '0'}, ${flipY ? '-100%' : '0'})`,
			}}
		>
			<div className="flex items-center gap-1.5">
				{room.number && <span className="rounded-sm bg-accent/85 px-1 font-medium text-base">{room.number}</span>}
				{room.name && <span className="text-sm font-medium">{room.name}</span>}
			</div>
			{use && <div className="mt-1 font-medium text-glow-pink">{use}</div>}
			{shown.map((item) => (
				<div key={item.id} className="mt-1 flex items-center gap-1.5">
					<span className="inline-block h-2 w-2 shrink-0 rounded-full" style={{ backgroundColor: EXHIBIT_GROUPS[item.group].color }} aria-hidden="true" />
					<span>{item.title}</span>
					{item.time && <span className="text-main">{item.time}</span>}
				</div>
			))}
			{exhibits.length > MAX_ITEMS && <div className="mt-1 text-text/60">ほか{exhibits.length - MAX_ITEMS}件</div>}
			{room.key && exhibits.length > 0 && <div className="mt-1 text-text/50">押すと一覧に出ます</div>}
		</div>
	);
}
