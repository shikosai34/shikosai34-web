import { useEffect, useRef } from 'react';
import { animate, useMotionValue, type MotionValue } from 'framer-motion';
import '../../styles/pokemon-cards/cards.css';
import '../../styles/pokemon-cards/base.css';
import '../../styles/pokemon-cards/rainbow-alt.css';
import '../../styles/pokemon-cards/sticker.css';

interface Props {
	src: string;
	alt: string;
	width: number;
	height: number;
}

const clamp = (value: number, min = 0, max = 100) => Math.min(Math.max(value, min), max);
const adjust = (value: number, fromMin: number, fromMax: number, toMin: number, toMax: number) =>
	toMin + ((toMax - toMin) * (value - fromMin)) / (fromMax - fromMin);

const SPRING = { type: 'spring', stiffness: 120, damping: 14 } as const;
const SNAP_BACK = { type: 'spring', stiffness: 40, damping: 10 } as const;

/**
 * クリアステッカーを、ポケモンカード風のホログラムで見せるカード。
 * 見た目は simeydotme/pokemon-cards-css（GPL-3.0）の「rare rainbow alt」、
 * ポインターへの追従は同リポジトリの Card.svelte をばね運動で再現している。
 */
export default function StickerCard({ src, alt, width, height }: Props) {
	const cardRef = useRef<HTMLDivElement>(null);
	const rotateX = useMotionValue(0);
	const rotateY = useMotionValue(0);
	const glareX = useMotionValue(50);
	const glareY = useMotionValue(50);
	const glareOpacity = useMotionValue(0);
	const backgroundX = useMotionValue(50);
	const backgroundY = useMotionValue(50);

	useEffect(() => {
		const card = cardRef.current;
		if (!card) return;

		const write = () => {
			const gx = glareX.get();
			const gy = glareY.get();
			const fromCenter = clamp(Math.hypot(gx - 50, gy - 50) / 50, 0, 1);
			card.style.setProperty('--pointer-x', `${gx}%`);
			card.style.setProperty('--pointer-y', `${gy}%`);
			card.style.setProperty('--pointer-from-center', `${fromCenter}`);
			card.style.setProperty('--pointer-from-top', `${gy / 100}`);
			card.style.setProperty('--pointer-from-left', `${gx / 100}`);
			card.style.setProperty('--card-opacity', `${glareOpacity.get()}`);
			card.style.setProperty('--rotate-x', `${rotateX.get()}deg`);
			card.style.setProperty('--rotate-y', `${rotateY.get()}deg`);
			card.style.setProperty('--background-x', `${backgroundX.get()}%`);
			card.style.setProperty('--background-y', `${backgroundY.get()}%`);
		};

		const values: MotionValue<number>[] = [rotateX, rotateY, glareX, glareY, glareOpacity, backgroundX, backgroundY];
		const unsubscribes = values.map((value) => value.on('change', write));
		write();
		return () => unsubscribes.forEach((unsubscribe) => unsubscribe());
	}, [rotateX, rotateY, glareX, glareY, glareOpacity, backgroundX, backgroundY]);

	const reducedMotion = () => window.matchMedia('(prefers-reduced-motion: reduce)').matches;

	const onPointerMove = (event: React.PointerEvent<HTMLButtonElement>) => {
		if (reducedMotion()) return;
		const rect = event.currentTarget.getBoundingClientRect();
		const percentX = clamp(((event.clientX - rect.left) / rect.width) * 100);
		const percentY = clamp(((event.clientY - rect.top) / rect.height) * 100);
		const centerX = percentX - 50;
		const centerY = percentY - 50;

		animate(rotateX, -(centerX / 3.5), SPRING);
		animate(rotateY, centerY / 3.5, SPRING);
		animate(glareX, percentX, SPRING);
		animate(glareY, percentY, SPRING);
		animate(glareOpacity, 1, SPRING);
		animate(backgroundX, adjust(percentX, 0, 100, 37, 63), SPRING);
		animate(backgroundY, adjust(percentY, 0, 100, 33, 67), SPRING);
	};

	const onPointerLeave = () => {
		animate(rotateX, 0, SNAP_BACK);
		animate(rotateY, 0, SNAP_BACK);
		animate(glareX, 50, SNAP_BACK);
		animate(glareY, 50, SNAP_BACK);
		animate(glareOpacity, 0, SNAP_BACK);
		animate(backgroundX, 50, SNAP_BACK);
		animate(backgroundY, 50, SNAP_BACK);
	};

	return (
		<div
			ref={cardRef}
			className="holo-card interactive mx-auto w-full max-w-[17rem]"
			data-rarity="rare rainbow alt"
			style={
				{
					'--card-aspect': width / height,
					'--card-radius': '5.5% / 3.5%',
				} as React.CSSProperties
			}
		>
			<div className="holo-card__translater">
				<button
					type="button"
					className="holo-card__rotator"
					style={{ touchAction: 'pan-y' }}
					onPointerMove={onPointerMove}
					onPointerLeave={onPointerLeave}
					onBlur={onPointerLeave}
					aria-label="クリアステッカーを見る"
				>
					<div className="holo-card__front">
						<img src={src} alt={alt} width={width} height={height} draggable={false} />
						<div className="holo-card__shine" />
						<div className="holo-card__glare" />
					</div>
				</button>
			</div>
		</div>
	);
}
