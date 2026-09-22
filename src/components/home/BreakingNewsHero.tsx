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
			 * 参考サイトに倣い、紙面を円でそのまま切り抜く。
			 * 円の内側いっぱいに広がるよう object-cover で埋める。
			 *
			 * 円は縦長だと上下が切れすぎるので、横長（5:4）の楕円ではなく
			 * 正円にし、紙面の上寄り（object-top）を見せる。ポスターは
			 * 人物と日付が上半分に集まっているため。
			 */}
			<div className="kikko relative -mx-2 flex aspect-square items-center justify-center overflow-hidden rounded-full border-2 border-accent/50 bg-base shadow-[0_0_28px_rgba(0,255,204,0.16)] sm:mx-auto sm:max-w-md">
				{/*
				 * 紙面は円より小さく置く。object-cover で埋めると倍率が上がって
				 * 四隅が大きく欠けるため、縮めて端の情報を残す。
				 *
				 * ただし縮めすぎると円の中で紙面が浮いてしまうので、
				 * 上下は円からわずかに外れるくらい（高さ 106%）に留める。
				 * 左右は円の内側に収まる幅にして、隅が環をはみ出さないようにする。
				 */}
				<img
					src={posterSrc}
					width={posterWidth}
					height={posterHeight}
					alt={posterAlt}
					className="h-[106%] w-auto max-w-none"
				/>
			</div>

			{/*
			 * 円から外れる情報（開催日時・QR コード・学校名）は紙面の四隅に
			 * あるため、切り抜くと読めなくなる。全体を見られる導線を必ず添える。
			 */}
			<p className="mt-3 text-center text-xs text-text/70">
				<a
					href={posterSrc}
					target="_blank"
					rel="noopener noreferrer"
					className="underline underline-offset-2 transition-colors hover:text-accent"
				>
					ポスター全体を見る
				</a>
			</p>

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
