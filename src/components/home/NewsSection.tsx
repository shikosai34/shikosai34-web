import ArrowRightIcon from '../icons/ArrowRightIcon';
import Button from '../ui/Button';
import SectionHeading from '../ui/SectionHeading';
import NewsListItem from './NewsListItem';

const newsItems = [
	{
		href: '/news/schedule-decided',
		title: '茨香祭開催日程決定',
		meta: '10/24~25',
	},
	{
		href: '/news/theme-decided',
		title: 'テーマ正式決定',
		meta: '「守破離」',
	},
];

export default function NewsSection() {
	return (
		<section className="mx-4 mt-8 rounded-3xl bg-base p-4 pt-6 pb-6">
			<SectionHeading title="News" />

			<div className="border-t border-text/40 pt-2">
				<ul className="divide-y divide-text/10">
					{newsItems.map((item) => (
						<NewsListItem key={item.href} {...item} />
					))}
				</ul>
			</div>

			<div className="mt-6 flex justify-end">
				<Button href="/news" variant="main">
					全てのお知らせを見る
				</Button>
			</div>
		</section>
	);
}
