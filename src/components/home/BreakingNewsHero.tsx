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
		<section className="mx-4 mt-6 rounded-3xl bg-main p-4 pt-6">
			<SectionHeading title="茨香祭速報" />

			<div className="rounded-2xl">
				<img
					src={posterSrc}
					width={posterWidth}
					height={posterHeight}
					alt={posterAlt}
					className="w-full rounded-xl"
				/>
				<div className="flex justify-end pt-3">
					<Button href="/news?category=sokuhou" variant="primary-dark">
						バックナンバーを見る
						<ArrowRightIcon className="h-4 w-4" />
					</Button>
				</div>
			</div>
		</section>
	);
}
