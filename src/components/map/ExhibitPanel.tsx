import ChevronRightIcon from '../icons/ChevronRightIcon';
import { EXHIBIT_GROUPS, type MapExhibit } from '../../lib/map';
import type { MapRoom } from '../../lib/map-rooms';

/*
 * フロア図の横（モバイルでは下）に出す出展一覧。
 * 部屋を選んでいなければその階の出展を、選んでいればその部屋の出展を並べる。
 * 詳しい説明は各サークル・ステージ企画のページに任せ、ここではリンクだけ出す。
 */

export interface FloorExhibit {
	item: MapExhibit;
	room: MapRoom;
}

interface ListProps {
	title: string;
	items: FloorExhibit[];
	hoveredKey: string | null;
	onHover: (key: string | null) => void;
	onSelect: (key: string) => void;
}

export function FloorExhibitList({ title, items, hoveredKey, onHover, onSelect }: ListProps) {
	return (
		<div>
			<p className="mb-2 px-1 text-sm text-text/80">
				{title}
				<span className="ml-2 text-main">{items.length}件</span>
			</p>
			{items.length === 0 ? (
				<p className="py-8 text-center text-sm text-text/60">この階に出展はありません。</p>
			) : (
				<ul className="flex flex-col gap-1">
					{items.map(({ item, room }) => (
						<li key={`${room.key}-${item.id}`}>
							<button
								type="button"
								onMouseEnter={() => onHover(room.key)}
								onMouseLeave={() => onHover(null)}
								onFocus={() => onHover(room.key)}
								onBlur={() => onHover(null)}
								onClick={() => onSelect(room.key)}
								className={`flex w-full gap-3 rounded-lg border p-2 text-left transition-colors ${
									hoveredKey === room.key ? 'border-main/70 bg-main/10' : 'border-transparent hover:border-accent/40'
								}`}
							>
								<Thumb item={item} className="h-14 w-14" />
								<span className="min-w-0 flex-1">
									<span className="block truncate text-xs text-text/60">{room.number ?? room.name}</span>
									<span className="line-clamp-2 block text-sm font-medium text-text">{item.title}</span>
									<GroupChip item={item} />
								</span>
							</button>
						</li>
					))}
				</ul>
			)}
		</div>
	);
}

interface DetailProps {
	room: MapRoom;
	items: MapExhibit[];
	/** 省略時は「一覧へ戻る」を出さない（屋外の会場など） */
	onBack?: () => void;
}

export function RoomDetail({ room, items, onBack }: DetailProps) {
	return (
		<div className="flex flex-col gap-4">
			{onBack && (
				<button type="button" onClick={onBack} className="self-start text-sm text-text/70 underline hover:no-underline">
					← この階の出展一覧
				</button>
			)}
			<div>
				<p className="text-xs tracking-wider text-accent">
					{[room.building, room.floor ? `${room.floor}F` : null, room.number].filter(Boolean).join(' ・ ')}
				</p>
				<h3 className="text-xl font-medium text-text">{room.name}</h3>
			</div>
			{items.length === 0 ? (
				<p className="text-sm text-text/60">この部屋の出展情報はありません。</p>
			) : (
				<ul className="flex flex-col gap-3">
					{items.map((item) => (
						<li key={item.id}>
							<a href={item.href} className="bracket-frame group flex gap-3 bg-base/60 p-3 transition-colors hover:bg-accent/10">
								<Thumb item={item} className="h-20 w-20" />
								<span className="min-w-0 flex-1">
									<GroupChip item={item} />
									<span className="mt-1 block font-medium text-text underline decoration-accent/50 underline-offset-4 group-hover:decoration-accent">
										{item.title}
									</span>
									<span className="block text-xs text-text/70">{item.subtitle}</span>
									{item.time && <span className="block text-xs text-main">{item.time}</span>}
								</span>
								<ChevronRightIcon className="h-5 w-5 shrink-0 self-center text-accent" />
							</a>
						</li>
					))}
				</ul>
			)}
		</div>
	);
}

function Thumb({ item, className }: { item: MapExhibit; className: string }) {
	return item.image ? (
		<img src={item.image} alt="" loading="lazy" className={`${className} shrink-0 rounded-sm object-cover`} />
	) : (
		<span className={`${className} kikko block shrink-0 rounded-sm bg-text/5`} aria-hidden="true" />
	);
}

function GroupChip({ item }: { item: MapExhibit }) {
	const group = EXHIBIT_GROUPS[item.group];
	return (
		<span className="mt-0.5 inline-flex items-center gap-1 text-xs text-text/80">
			<span className="inline-block h-2 w-2 rounded-full" style={{ backgroundColor: group.color }} aria-hidden="true" />
			{group.label}
		</span>
	);
}
