import { motion, useReducedMotion } from 'framer-motion';
import { useEffect, useRef, useState } from 'react';
import ChevronRightIcon from '../icons/ChevronRightIcon';
import YouTubeEmbed from './YouTubeEmbed';

export interface VideoStackItem {
	videoId: string;
	title: string;
}

interface Props {
	videos: VideoStackItem[];
}

/** 手前のカードから左右に何枚まで重ねて見せるか。 */
const STACK_DEPTH = 2;
/** 横スワイプ 1 回とみなす移動量（px）。 */
const SWIPE_THRESHOLD = 40;
/**
 * 1 回のスワイプが終わったとみなす、ホイール入力の途切れ（ms）。
 * スワイプ中や慣性中は 1 フレーム（約 16ms）ごとに入力が届くので、これだけ空けば次のスワイプ。
 */
const WHEEL_GAP_MS = 80;

/**
 * 複数の動画を iMessage の写真のように重ねて見せる。
 *
 * 動画とタイトルは 1 枚のカードにまとめる。手前のカードだけが再生でき、
 * 見終わったカードは左側に、まだのカードは右側に重なる。
 * 1 周はせず、先頭と末尾で止まる。カードの動きに弾みは付けない。
 * 左右のボタン・矢印キー・トラックパッドの横スワイプ・タッチのスワイプで送れる。
 */
export default function VideoStack({ videos }: Props) {
	const [active, setActive] = useState(0);
	const reduceMotion = useReducedMotion();
	const count = videos.length;
	const rootRef = useRef<HTMLDivElement>(null);

	const go = (delta: number) => setActive((i) => Math.min(count - 1, Math.max(0, i + delta)));

	// トラックパッドの横スワイプ。ブラウザの「戻る／進む」ジェスチャに奪われないよう、
	// 横方向の動きは preventDefault する（passive: false で登録しないと効かない）。
	useEffect(() => {
		const el = rootRef.current;
		if (!el) return;

		// 1 回のスワイプ（指で払う動き + その後の慣性）で送るのは 1 枚だけ。
		// 送ったらロックし、次のスワイプが始まったと判断できるまで入力を無視する。
		//
		// 次のスワイプの始まりは 2 通りで見分ける。
		// - 入力が途切れた（WHEEL_GAP_MS 以上空いた）あとに再び届いた。
		// - 慣性で十分に減衰したあと、移動量が再び大きくなった。macOS では慣性の最中に
		//   指を置くと慣性が止まり、新しいスワイプの入力が小さい値から増えていく。
		//   指で払っている途中の加速では「減衰」を挟まないので、ここで誤って送ることはない。
		let sum = 0;
		let locked = false;
		let lastTime = -Infinity;
		let peakAbs = 0;
		let minAbs = Infinity;

		const onWheel = (e: WheelEvent) => {
			if (Math.abs(e.deltaX) <= Math.abs(e.deltaY)) return;
			e.preventDefault();

			const abs = Math.abs(e.deltaX);
			const gap = e.timeStamp - lastTime;
			lastTime = e.timeStamp;

			if (gap >= WHEEL_GAP_MS) {
				// 前のスワイプは終わっている。
				locked = false;
				sum = 0;
			} else if (locked) {
				// 最小値はピークを更新した後のものだけを見る（加速中は「減衰」と数えない）。
				if (abs >= peakAbs) {
					peakAbs = abs;
					minAbs = abs;
				}
				minAbs = Math.min(minAbs, abs);
				const decayed = minAbs <= peakAbs * 0.5;
				const risingAgain = abs >= minAbs * 2 && abs - minAbs >= 6;
				if (!(decayed && risingAgain)) return;
				locked = false;
				sum = 0;
			}

			sum += e.deltaX;
			if (Math.abs(sum) >= SWIPE_THRESHOLD) {
				const delta = sum > 0 ? 1 : -1;
				setActive((i) => Math.min(count - 1, Math.max(0, i + delta)));
				sum = 0;
				locked = true;
				peakAbs = abs;
				minAbs = abs;
			}
		};

		el.addEventListener('wheel', onWheel, { passive: false });
		return () => el.removeEventListener('wheel', onWheel);
	}, [count]);

	// タッチのスワイプ（縦スクロールは `touch-pan-y` でブラウザに任せる）。
	const touchStartX = useRef<number | null>(null);

	return (
		<div
			ref={rootRef}
			role="group"
			aria-roledescription="carousel"
			aria-label="映像の一覧"
			tabIndex={0}
			onKeyDown={(e) => {
				if (e.key === 'ArrowRight') go(1);
				if (e.key === 'ArrowLeft') go(-1);
			}}
			onTouchStart={(e) => {
				touchStartX.current = e.touches[0].clientX;
			}}
			onTouchEnd={(e) => {
				if (touchStartX.current === null) return;
				const dx = e.changedTouches[0].clientX - touchStartX.current;
				touchStartX.current = null;
				if (Math.abs(dx) >= SWIPE_THRESHOLD) go(dx < 0 ? 1 : -1);
			}}
			className="touch-pan-y overscroll-x-contain outline-none focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-accent"
		>
			{/* 全カードを同じ格子の 1 マスに重ねる。高さはカード自身で決まる。 */}
			<div className="mx-auto grid w-[78%] max-w-xl">
				{videos.map((video, index) => {
					const offset = index - active;
					const depth = Math.abs(offset);
					const visible = depth <= STACK_DEPTH;
					const isFront = offset === 0;

					return (
						<motion.div
							key={video.videoId}
							className="col-start-1 row-start-1"
							style={{ zIndex: 10 - depth }}
							initial={false}
							animate={{
								// 見終わった（offset < 0）カードは左へ、まだのカードは右へ重ねる。
								x: `${offset * 9}%`,
								y: `${depth * 2}%`,
								scale: 1 - Math.min(depth, STACK_DEPTH + 1) * 0.06,
								rotate: offset * 3,
								opacity: visible ? 1 : 0,
							}}
							transition={reduceMotion ? { duration: 0 } : { duration: 0.3, ease: 'easeOut' }}
							aria-hidden={!isFront}
						>
							<div className="relative flex h-full flex-col overflow-hidden rounded-xl border border-accent/40 bg-base shadow-lg shadow-black/40">
								{isFront ? (
									<YouTubeEmbed videoId={video.videoId} title={video.title} />
								) : (
									<div className="relative aspect-video w-full overflow-hidden">
										<img
											src={`https://i.ytimg.com/vi/${video.videoId}/hqdefault.jpg`}
											alt=""
											loading="lazy"
											className="absolute inset-0 h-full w-full object-cover"
										/>
									</div>
								)}
								<p className="line-clamp-2 min-h-[3.75rem] px-3 py-2.5 text-sm leading-6 font-medium text-text">
									{video.title}
								</p>

								{/* 手前以外は暗くして、押すとそのカードを手前に出す。 */}
								{!isFront && (
									<button
										type="button"
										tabIndex={visible ? 0 : -1}
										onClick={() => setActive(index)}
										aria-label={`${video.title}を手前に出す`}
										className="absolute inset-0 bg-base"
										style={{ opacity: 0.3 + depth * 0.15, pointerEvents: visible ? 'auto' : 'none' }}
									/>
								)}
							</div>
						</motion.div>
					);
				})}
			</div>

			<div className="mt-6 flex items-center justify-center gap-5">
				<button
					type="button"
					onClick={() => go(-1)}
					disabled={active === 0}
					aria-label="前の動画"
					className="flex h-10 w-10 items-center justify-center rounded-full border border-accent/40 text-accent transition-colors hover:border-accent focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accent disabled:pointer-events-none disabled:opacity-30"
				>
					<ChevronRightIcon className="h-5 w-5 rotate-180" />
				</button>
				<p className="min-w-16 text-center text-xs tracking-[0.2em] text-accent/80" aria-live="polite">
					{active + 1} / {count}
				</p>
				<button
					type="button"
					onClick={() => go(1)}
					disabled={active === count - 1}
					aria-label="次の動画"
					className="flex h-10 w-10 items-center justify-center rounded-full border border-accent/40 text-accent transition-colors hover:border-accent focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accent disabled:pointer-events-none disabled:opacity-30"
				>
					<ChevronRightIcon className="h-5 w-5" />
				</button>
			</div>
		</div>
	);
}
