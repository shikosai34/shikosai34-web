import { NEWS_CATEGORY_LABELS, type NewsCategory } from '../../lib/news';
import CalendarIcon from '../icons/CalendarIcon';
import ChevronRightIcon from '../icons/ChevronRightIcon';

export interface NewsListItemData {
	href: string;
	title: string;
	/** 整形済みの公開日（`formatNewsDate` の戻り値）。 */
	date: string;
	category: NewsCategory;
	image?: string;
}

export default function NewsListItem({ href, title, date, category, image }: NewsListItemData) {
	return (
		<li>
			<a
				href={href}
				className="group flex items-start gap-4 rounded-xl px-2 py-4 transition-colors hover:bg-text/5"
			>
				{image ? (
					<img
						src={image}
						alt=""
						loading="lazy"
						className="h-14 w-14 shrink-0 rounded-lg object-cover"
					/>
				) : (
					/* 画像がない記事の代替。地色に馴染むよう、塗りではなく細枠と麻の葉で示す。 */
					<span className="kikko h-14 w-14 shrink-0 rounded-lg border border-current/20 bg-current/5 bg-[length:24px_13.86px]" />
				)}
				<span className="min-w-0 flex-1 flex flex-col gap-0.5">
					<span className="flex items-center gap-2 text-xs text-text">
						<span className="inline-flex items-center gap-1">
							<CalendarIcon className="h-3.5 w-3.5" />
							{date}
						</span>
						<span className="rounded bg-text/10 px-1.5 py-0.5">
							{NEWS_CATEGORY_LABELS[category]}
						</span>
					</span>
					<span className="block truncate text-base font-medium text-text mt-0.5">{title}</span>
				</span>
				<div className="flex h-14 items-center">
					<ChevronRightIcon className="h-5 w-5 shrink-0 text-text transition-transform group-hover:translate-x-0.5" />
				</div>
			</a>
		</li>
	);
}
