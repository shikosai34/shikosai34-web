import NewsListItem, { type NewsListItemData } from '../news/NewsListItem';
import Button from '../ui/Button';
import SectionHeading from '../ui/SectionHeading';

interface Props {
	/** 表示するお知らせ。トップページでは新着数件のみを渡す。 */
	items?: NewsListItemData[];
}

export default function NewsSection({ items = [] }: Props) {
	return (
		<section className="surface-panel mx-4 mt-8 rounded-2xl p-4 pt-6 pb-6">
			<SectionHeading title="News" icon="newspaper" />

			{/*
			 * 一覧は角を落としたシアンの枠で囲う。枠の内側に余白を取り、
			 * 行間の罫線は枠の縁まで届かせない（参考サイトの囲みの作り）。
			 */}
			<div className="hud-frame px-3 py-2">
				{items.length === 0 ? (
					<p className="py-6 text-center text-sm text-text/70">現在お知らせはありません。</p>
				) : (
					<ul className="divide-y divide-accent/20">
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
