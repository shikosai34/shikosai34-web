import { EXHIBIT_GROUPS, type MapExhibit } from '../../lib/map';

/*
 * 出展 1 件の情報カード。地図のポップアップ（2D の部屋・3D のテント）で使う。
 * 詳しい説明は各サークル・ステージ企画のページに任せ、ここでは名前・時間・紹介の頭の 1 文とリンクを出す。
 */

export default function ExhibitCard({ item }: { item: MapExhibit }) {
	const group = EXHIBIT_GROUPS[item.group];
	const when = item.time ?? item.schedule;
	return (
		<article className="flex flex-col gap-1.5">
			{item.image && <img src={item.image} alt="" loading="lazy" className="h-24 w-full rounded-sm object-cover" />}
			<p className="flex items-center gap-2 text-xs text-text/80">
				<span className="inline-block h-2 w-2 shrink-0 rounded-full" style={{ backgroundColor: group.color }} aria-hidden="true" />
				{group.label}
				{item.spot && <span className="rounded-sm bg-accent/85 px-1 font-medium text-base">{item.spot}</span>}
			</p>
			<a href={item.href} className="text-base font-medium text-text underline decoration-accent/50 underline-offset-4 hover:decoration-accent">
				{item.title}
			</a>
			<p className="text-xs text-text/70">{item.subtitle}</p>
			{when && <p className="text-xs text-main">{when}</p>}
			{item.summary && <p className="text-xs leading-relaxed text-text/80">{item.summary}</p>}
			<a href={item.href} className="self-start text-xs text-accent underline hover:no-underline">
				詳しく見る →
			</a>
		</article>
	);
}
