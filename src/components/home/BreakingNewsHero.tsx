import ArrowRightIcon from '../icons/ArrowRightIcon';
import Button from '../ui/Button';
import KumoLine from '../ui/KumoLine';
import SectionHeading from '../ui/SectionHeading';

interface Props {
	posterSrc: string;
	posterWidth: number;
	posterHeight: number;
	posterAlt: string;
}

export default function BreakingNewsHero({
	posterSrc,
	posterWidth,
	posterHeight,
	posterAlt,
}: Props) {
	return (
		/*
		 * ポスターの構図に合わせ、左右のオレンジの帯で濃紺の面を挟む。
		 * 帯は border で引く（要素を足すとレイアウトが増えるため）。
		 */
		<section className="surface-panel mx-4 mt-6 rounded-2xl border-x-4 border-x-main px-4 pt-6 pb-4">
			{/*
			 * 見出しの右の余白に流雲を流す。狭い画面では場所がないので
			 * sm 以上でのみ出す。
			 */}
			<div className="flex items-start justify-between gap-4">
				<SectionHeading title="茨香祭速報" />
				<KumoLine className="hidden h-8 w-24 shrink-0 text-accent/40 sm:block" side="right" />
			</div>

			{/*
			 * ポスターを円形の台座に載せる（参考サイトの丸いヒーローの見せ方）。
			 * ただし円で切り抜くと四隅の開催日・QR コード・学校名が欠けるため、
			 * 切り抜かずに円の内側へ全体を収める。
			 *
			 * 縦長（約 1:1.41）なので、円の直径は紙面の「高さ」に合わせる。
			 * そのぶん左右に余白ができるので、そこに走査線と亀甲を覗かせる。
			 */}
			{/*
			 * 円はパネルの左右の余白ぶんまで広げたいので、負のマージンで
			 * px-4 を打ち消して目一杯の直径を取る。
			 */}
			<div className="relative -mx-2 flex aspect-square items-center justify-center sm:mx-auto sm:max-w-md">
				{/*
				 * 円は紙面より大きく取りたいが、幅いっぱいだとパネルの縁で
				 * 左右が切れる。
				 */}
				<div className="kikko absolute inset-0 rounded-full border-2 border-accent/60 bg-base shadow-[0_0_24px_rgba(0,255,204,0.18)]" />
				{/* 円周に沿ったシアンの細い環。参考サイトの縁取りに倣う。 */}
				<div className="absolute inset-[5%] rounded-full border border-accent/25" />
				<img
					src={posterSrc}
					width={posterWidth}
					height={posterHeight}
					alt={posterAlt}
					className="relative max-h-[88%] w-auto rounded-lg border border-text/15"
				/>
			</div>

			{/*
			 * 紙面の下に、ポスターのマゼンタの斜線とハーフトーンを重ねた区切りを敷く。
			 */}
			<div className="relative mt-4 h-3 w-full overflow-hidden" aria-hidden="true">
				<span className="halftone absolute inset-0 opacity-40" />
				<span className="glitch-sweep absolute inset-0" />
			</div>

			<div className="flex justify-end pt-3">
				<Button href="/poster/backnumber" variant="primary-dark">
					バックナンバーを見る
					<ArrowRightIcon className="h-4 w-4" />
				</Button>
			</div>
		</section>
	);
}
