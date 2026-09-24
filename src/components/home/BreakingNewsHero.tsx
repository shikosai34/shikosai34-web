import { useEffect, useRef, useState } from 'react';
import ArrowRightIcon from '../icons/ArrowRightIcon';
import Button, { buttonClassName } from '../ui/Button';
import NeonClouds from '../ui/NeonClouds';
import PosterCircle from '../ui/PosterCircle';
import SectionHeading from '../ui/SectionHeading';

interface Props {
	posterSrc: string;
	posterWidth: number;
	posterHeight: number;
	posterAlt: string;
	/** 裏面に貼るポスター全体。円に切り抜く表面より大きい画像を渡す。 */
	posterFullSrc: string;
	posterFullWidth: number;
	posterFullHeight: number;
}

export default function BreakingNewsHero({
	posterSrc,
	posterWidth,
	posterHeight,
	posterAlt,
	posterFullSrc,
	posterFullWidth,
	posterFullHeight,
}: Props) {
	/*
	 * めくった回数。1回ごとに同じ向きへ 180 度ずつ足していき、
	 * 表へ戻すときも逆回転させずに一周（計 360 度）させる。
	 */
	const [turns, setTurns] = useState(0);
	const flipped = turns % 2 === 1;
	const showButtonRef = useRef<HTMLButtonElement>(null);
	const backButtonRef = useRef<HTMLButtonElement>(null);
	// 初回描画ではフォーカスを動かさない（ページを開いた瞬間に奪わないため）。
	const hasToggled = useRef(false);

	/*
	 * めくった先の面へフォーカスを移す。隠れた面は inert にするので、
	 * 押したボタンにフォーカスが残ったままだと行き場がなくなる。
	 */
	useEffect(() => {
		if (!hasToggled.current) return;
		(flipped ? backButtonRef : showButtonRef).current?.focus({ preventScroll: true });
	}, [flipped]);

	const flip = (next: boolean) => {
		if (next === flipped) return;
		hasToggled.current = true;
		setTurns((count) => count + 1);
	};

	/*
	 * タイルそのものを Y 軸で裏返し、裏面にポスター全体を貼る。
	 * 以前はダイアログで拡大していたが、ページの流れを切らずに
	 * 紙面を確かめられるよう、カードをめくる見せ方にした。
	 *
	 * 表面が高さを決め、裏面はその上に重ねて（absolute）同じ大きさにする。
	 * ポスターは縦長なので、裏面では高さに収まるよう object-contain で縮める。
	 */
	return (
		<div
			className="mt-6 perspective-[1600px]"
			onKeyDown={(event) => {
				if (flipped && event.key === 'Escape') flip(false);
			}}
		>
			<div
				className="relative transition-transform duration-700 ease-in-out transform-3d motion-reduce:transition-none"
				style={{ transform: `rotateY(${turns * 180}deg)` }}
			>
				<section
					className="surface-panel rounded-2xl px-4 pt-6 pb-4 backface-hidden sm:px-6 lg:px-10 lg:pb-8"
					inert={flipped}
					aria-hidden={flipped}
				>
					{/*
					 * 流れる霧。参考サイトのキービジュアルの空気感にあたる部分。
					 * .surface-panel > * は z-index:1 なので、この背景だけ 0 に落として
					 * 走査線（::after）と本文の間に挟む。
					 */}
					<NeonClouds className="rounded-2xl" />

					<SectionHeading title="茨香祭速報" icon="megaphone" />

					{/*
					 * モバイルは円の下に告知を重ねて縦に積む。
					 * 広い画面では円を左、告知と導線を右に置いて横に並べ、
					 * 円が画面の高さを超えて大きくなりすぎないようにする。
					 */}
					<div className="lg:grid lg:grid-cols-2 lg:items-center lg:gap-10">
						<PosterCircle
							src={posterSrc}
							width={posterWidth}
							height={posterHeight}
							alt={posterAlt}
							className="-mx-2 sm:mx-auto sm:max-w-md lg:mx-0 lg:max-w-none"
						/>

						<div>
							{/*
							 * 告知のパネル。参考サイトに倣い、円の下端に少し重ねて置く。
							 * 円と重ねるぶん、地は不透明にして紙面が透けないようにする。
							 */}
							<div className="bracket-frame stripes relative z-10 -mt-5 bg-base/55 px-4 py-3 backdrop-blur-[2px] sm:mx-auto sm:max-w-md lg:mx-0 lg:mt-0 lg:max-w-none lg:px-6 lg:py-5">
								{/*
								 * 見出し → 何の → いつ の順に並べる。日付を見出しより前に置くと
								 * 「10月24日に新ポスター解禁」という予告に読めてしまうため、
								 * 日付は「一般公開」の直後に添えて開催日だとわかるようにする。
								 */}

								{/* 主文。地から浮かせるため縁取りする。 */}
								{/*
								 * 主文はピンクで光らせる。ポスターのマゼンタを
								 * 一番目立つ一行に回して、シアンの日付と対にする。
								 */}
								<p className="outlined-text neon-text text-xl font-bold tracking-tight lg:text-3xl">
									新ポスター解禁！
								</p>

								{/* 補足とハザード帯。 */}
								<div className="mt-2 flex items-center gap-3">
									<p className="shrink-0 text-xs text-text/75">第34回 茨香祭 一般公開</p>
									<span className="hazard-stripes h-3 flex-1 opacity-70" aria-hidden="true" />
								</div>

								{/* 日付＋注記。参考サイトは大きな日付の右に小さく添える。 */}
								<div className="mt-1 flex flex-wrap items-baseline gap-x-3 gap-y-1 lg:mt-2">
									<p className="outlined-text neon-text--cyan text-2xl font-bold tracking-tight text-accent lg:text-4xl">
										10月24日(土)
									</p>
									<p className="text-xs text-text/80">※25日(日)は学内限定</p>
								</div>
							</div>

							{/*
							 * 円から外れる情報（開催日時・QR コード・学校名）は紙面の四隅に
							 * あるため、切り抜くと読めなくなる。全体を見られる導線を必ず添える。
							 */}
							<div className="mt-3 flex justify-center">
								<button
									ref={showButtonRef}
									type="button"
									onClick={() => flip(true)}
									className={buttonClassName('outline')}
								>
									ポスター全体を見る
								</button>
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
									過去のポスターを見る
									<ArrowRightIcon className="h-4 w-4" />
								</Button>
							</div>
						</div>
					</div>
				</section>

				{/* 裏面。ポスター全体を貼り、表へ戻るボタンを添える。 */}
				<section
					className="surface-panel absolute inset-0 flex rotate-y-180 flex-col items-center gap-3 rounded-2xl p-4 backface-hidden"
					inert={!flipped}
					aria-hidden={!flipped}
					aria-label="ポスター全体"
				>
					{/*
					 * 紙面の角を丸めるため、object-contain で枠の中に余白を作るのではなく、
					 * 画像そのものを枠に収まる大きさまで縮める（要素の箱＝見えている紙面になる）。
					 */}
					<div className="flex min-h-0 w-full flex-1 items-center justify-center">
						<img
							src={posterFullSrc}
							width={posterFullWidth}
							height={posterFullHeight}
							alt={posterAlt}
							loading="lazy"
							className="h-auto max-h-full w-auto max-w-full rounded-xl"
						/>
					</div>

					<button
						ref={backButtonRef}
						type="button"
						onClick={() => flip(false)}
						className={buttonClassName('outline', 'shrink-0')}
					>
						表に戻る
					</button>
				</section>
			</div>
		</div>
	);
}
