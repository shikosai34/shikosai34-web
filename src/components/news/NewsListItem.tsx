import CalendarIcon from '../icons/CalendarIcon';
import ChevronRightIcon from '../icons/ChevronRightIcon';

interface Props {
	href: string;
	title: string;
	meta: string;
	date?: string;
}

export default function NewsListItem({ href, title, meta, date = 'YYYY/MM/DD' }: Props) {
	return (
		<li>
			<a
				href={href}
				className="group flex items-start gap-4 rounded-xl px-2 py-4 transition-colors hover:bg-text/5"
			>
				<span className="h-14 w-14 shrink-0 rounded-lg bg-text" />
				<span className="min-w-0 flex-1 flex flex-col gap-0.5">
					<span className="flex items-center gap-1.5 text-xs text-text">
						<CalendarIcon className="h-3.5 w-3.5" />
						{date}
					</span>
					<span className="block truncate text-base font-medium text-text mt-0.5">{title}</span>
					<span className="block text-sm text-text">{meta}</span>
				</span>
				<div className="flex h-14 items-center">
					<ChevronRightIcon className="h-5 w-5 shrink-0 text-text transition-transform group-hover:translate-x-0.5" />
				</div>
			</a>
		</li>
	);
}
