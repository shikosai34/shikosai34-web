import { useEffect, useRef, useState } from 'react';
import { buttonClassName } from '../ui/Button';
import NeonClouds from '../ui/NeonClouds';
import PosterCircle from '../ui/PosterCircle';
import SectionHeading from '../ui/SectionHeading';

interface Props {
	posterSrc: string;
	posterWidth: number;
	posterHeight: number;
	posterAlt: string;
	/** 拡大表示に使うポスター全体。円に切り抜く表面より大きい画像を渡す。 */
	posterFullSrc: string;
	posterFullWidth: number;
	posterFullHeight: number;
}

const fadeDurationMs = 250;

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
	 * mounted: ビューアを DOM に置くか。shown: 表示状態（transition の到達点）。
	 * 開くときは mounted → 次フレームで shown、閉じるときは shown を落として
	 * transition が終わってから外す。
	 */
	const [mounted, setMounted] = useState(false);
	const [shown, setShown] = useState(false);
	const showButtonRef = useRef<HTMLButtonElement>(null);
	const closeButtonRef = useRef<HTMLButtonElement>(null);
	const closeTimer = useRef<number | null>(null);

	const open = () => {
		if (closeTimer.current !== null) window.clearTimeout(closeTimer.current);
		setMounted(true);
		window.requestAnimationFrame(() => window.requestAnimationFrame(() => setShown(true)));
	};

	const close = () => {
		setShown(false);
		closeTimer.current = window.setTimeout(() => {
			setMounted(false);
			showButtonRef.current?.focus({ preventScroll: true });
		}, fadeDurationMs);
	};

	useEffect(() => () => {
		if (closeTimer.current !== null) window.clearTimeout(closeTimer.current);
	}, []);

	// 開いている間は背面のスクロールを止め、Esc で閉じる。
	useEffect(() => {
		if (!mounted) return;
		const previousOverflow = document.body.style.overflow;
		document.body.style.overflow = 'hidden';
		closeButtonRef.current?.focus({ preventScroll: true });
		const onKeyDown = (event: KeyboardEvent) => {
			if (event.key === 'Escape') close();
		};
		window.addEventListener('keydown', onKeyDown);
		return () => {
			document.body.style.overflow = previousOverflow;
			window.removeEventListener('keydown', onKeyDown);
		};
	}, [mounted]);

	return (
		<div className="mt-6">
			<section className="surface-panel rounded-2xl px-4 pt-6 pb-4 sm:px-6 lg:px-10 lg:pb-8">
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
							{/* 終了の告知と御礼を、ポスター掲示のときと同じネオンサインの見た目で出す。 */}

							{/* 主文。地から浮かせるため縁取りする。 */}
							<p className="outlined-text neon-text text-xl font-bold tracking-tight lg:text-3xl">
								茨香祭は終了しました！
							</p>

							{/* 開催日の補足とハザード帯。 */}
							<div className="mt-2 flex items-center gap-3">
								<p className="shrink-0 text-xs text-text/75">第34回 茨香祭（10月24日・25日）</p>
								<span className="hazard-stripes h-3 flex-1 opacity-70" aria-hidden="true" />
							</div>

							<p className="outlined-text neon-text--cyan mt-1 text-xl font-bold tracking-tight text-accent sm:text-2xl lg:mt-2 lg:text-3xl">
								ご来場いただき
								<br className="sm:hidden" />
								ありがとうございました！
							</p>
						</div>

						{/*
						 * 円から外れる情報（開催日時・QR コード・学校名）は紙面の四隅に
						 * あるため、切り抜くと読めなくなる。全体を見られる導線を必ず添える。
						 */}
						<div className="mt-4 sm:mx-auto sm:max-w-md lg:mx-0 lg:max-w-none">
							<button
								ref={showButtonRef}
								type="button"
								onClick={open}
								className={buttonClassName('outline', 'w-full justify-center')}
							>
								ポスター全体を見る
							</button>
						</div>
					</div>
				</div>
			</section>

			{/*
			 * ポスター全体の拡大表示。画面いっぱいに暗幕を敷き、ポスターを横幅いっぱいに出す。
			 * 暗幕・閉じるボタンのどちらを押しても閉じる。
			 */}
			{mounted && (
				<div
					role="dialog"
					aria-modal="true"
					aria-label="ポスター全体"
					className="fixed inset-0 z-[100] flex items-center justify-center bg-black/90 transition-opacity motion-reduce:transition-none"
					style={{ opacity: shown ? 1 : 0, transitionDuration: `${fadeDurationMs}ms` }}
					onClick={close}
				>
					<img
						src={posterFullSrc}
						width={posterFullWidth}
						height={posterFullHeight}
						alt={posterAlt}
						className="max-h-dvh w-full object-contain transition-transform motion-reduce:transition-none sm:w-auto sm:max-w-full"
						style={{ transform: shown ? 'scale(1)' : 'scale(0.9)', transitionDuration: `${fadeDurationMs}ms` }}
					/>
					<button
						ref={closeButtonRef}
						type="button"
						onClick={close}
						aria-label="閉じる"
						className="absolute top-3 right-3 flex h-11 w-11 items-center justify-center rounded-full bg-black/60 text-2xl text-text transition-colors hover:bg-black/80"
					>
						×
					</button>
				</div>
			)}
		</div>
	);
}
