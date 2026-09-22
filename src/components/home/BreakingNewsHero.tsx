import ArrowRightIcon from '../icons/ArrowRightIcon';
import Button from '../ui/Button';
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
		<section className="surface-panel scanlines mx-4 mt-6 rounded-2xl border-x-4 border-x-main px-4 pt-6 pb-4">
			<SectionHeading title="茨香祭速報" />

			{/*
			 * ポスター本体。スイープは紙面に重ねると作品自身のピンクの線と
			 * ぶつかって読めないため、見出し側と下の区切りに逃がしている。
			 */}
			<img
				src={posterSrc}
				width={posterWidth}
				height={posterHeight}
				alt={posterAlt}
				className="w-full rounded-xl border border-text/15"
			/>

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
