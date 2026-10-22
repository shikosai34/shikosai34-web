import { useRef, useState, useEffect } from 'react';
import Tilt from 'react-parallax-tilt';

interface Props {
	src: string;
	alt: string;
	width: number;
	height: number;
}

/**
 * クリアステッカーを 3D に傾けて見せるカード。
 * 傾きは react-parallax-tilt（MIT）、虹色の反射は傾きに連動する CSS 変数で描く。
 */
export default function StickerCard({ src, alt, width, height }: Props) {
	const cardRef = useRef<HTMLDivElement>(null);
	const [reduceMotion, setReduceMotion] = useState(false);

	useEffect(() => {
		const query = window.matchMedia('(prefers-reduced-motion: reduce)');
		setReduceMotion(query.matches);
		const onChange = (event: MediaQueryListEvent) => setReduceMotion(event.matches);
		query.addEventListener('change', onChange);
		return () => query.removeEventListener('change', onChange);
	}, []);

	const setShine = (x: number, y: number) => {
		const card = cardRef.current;
		if (!card) return;
		card.style.setProperty('--shine-x', `${x}%`);
		card.style.setProperty('--shine-y', `${y}%`);
	};

	return (
		<Tilt
			className="sticker-tilt mx-auto w-full max-w-[17rem]"
			tiltEnable={!reduceMotion}
			tiltMaxAngleX={14}
			tiltMaxAngleY={14}
			perspective={900}
			scale={1.03}
			transitionSpeed={900}
			glareEnable={!reduceMotion}
			glareMaxOpacity={0.35}
			glareColor="#ffffff"
			glarePosition="all"
			glareBorderRadius="1.25rem"
			onMove={({ tiltAngleXPercentage, tiltAngleYPercentage }) =>
				setShine(tiltAngleYPercentage ?? 50, tiltAngleXPercentage ?? 50)
			}
			onLeave={() => setShine(50, 50)}
		>
			<div ref={cardRef} className="sticker-card" style={{ aspectRatio: `${width} / ${height}` }}>
				<img src={src} alt={alt} width={width} height={height} className="sticker-image" draggable={false} />
				<span className="sticker-holo" aria-hidden="true" />
			</div>
		</Tilt>
	);
}
