import NewsListItem, { type NewsListItemData } from '../news/NewsListItem';
import Button from '../ui/Button';
import SectionHeading from '../ui/SectionHeading';

interface Props {
	/** 表示するお知らせ。トップページでは新着数件のみを渡す。 */
	items?: NewsListItemData[];
}

export default function NewsSection({ items = [] }: Props) {
	return (
		<section className="mx-4 mt-8 rounded-2xl bg-base p-4 pt-6 pb-6">
			<SectionHeading title="News" />

			<div className="border-t border-text/40 pt-2">
				{items.length === 0 ? (
					<p className="py-6 text-center text-sm text-text/70">現在お知らせはありません。</p>
				) : (
					<ul className="divide-y divide-text/10">
						{items.map((item) => (
							<NewsListItem key={item.href} {...item} />
						))}
					</ul>
				)}
			</div>

			<div className="mt-6 flex justify-end">
				<Button href="/news" variant="main">
					全てのお知らせを見る
				</Button>
			</div>
		</section>
	);
}
