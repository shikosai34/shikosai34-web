/*
 * 和傘を真上から見た線画。フッターの上に並べる装飾。
 *
 * 参考サイト（cho-kaguyahime.com）も deco_umbrella*.svg を
 * @keyframes umbrella（14〜17秒で 720deg）でゆっくり回しており、
 * 速度と向きを傘ごとに変えている。ここでも同じ考え方にした。
 *
 * 骨（ribs）と縁の波（scallop）は本数から計算して組み立てる。
 * 長いパス文字列を直接持つより、本数・半径を変えるだけで
 * 4種類の傘を作り分けられるため。
 *
 * 純粋な装飾なので aria-hidden にして読み上げから外す。
 */

const C = 60; // 中心（viewBox は 120x120）

/** 骨。内側の輪（r0）から縁（r1）まで、n 本を放射状に引く。 */
function ribPath(n: number, r0: number, r1: number) {
	const out: string[] = [];
	for (let i = 0; i < n; i++) {
		const a = (2 * Math.PI * i) / n;
		const cos = Math.cos(a);
		const sin = Math.sin(a);
		out.push(
			`M${(C + r0 * cos).toFixed(1)} ${(C + r0 * sin).toFixed(1)}` +
				`L${(C + r1 * cos).toFixed(1)} ${(C + r1 * sin).toFixed(1)}`,
		);
	}
	return out.join(' ');
}

/**
 * 縁。骨の先どうしを外側へ膨らむ弧でつなぎ、
 * 和傘の縁の波形（scallop）にする。
 *
 * 弧の半径は傘の半径ではなく「骨の先どうしの間隔（弦）」から決める。
 * 弦の半分（wave=0.5）が半円で最も波打ち、大きくするほど平らになる。
 * 1.6 あたりが、いただいた図のゆるい波形に近い。
 * 傘の半径を使うと弧が巨大になり、ほぼ真円になってしまう。
 */
function scallopPath(n: number, r: number, wave = 1.6) {
	const pt = (i: number) => {
		const a = (2 * Math.PI * i) / n;
		return `${(C + r * Math.cos(a)).toFixed(1)} ${(C + r * Math.sin(a)).toFixed(1)}`;
	};
	const chord = 2 * r * Math.sin(Math.PI / n);
	const rr = (chord * wave).toFixed(2);
	let d = `M${pt(0)}`;
	for (let i = 1; i <= n; i++) d += `A${rr} ${rr} 0 0 1 ${pt(i % n)}`;
	return `${d}Z`;
}

/** 桜の花。いただいた図の2本目の傘は中心に小さな花が入っている。 */
function SakuraMark() {
	const petals = [];
	for (let i = 0; i < 5; i++) {
		const a = (2 * Math.PI * i) / 5 - Math.PI / 2;
		petals.push(
			<ellipse
				key={i}
				cx={C + 4.2 * Math.cos(a)}
				cy={C + 4.2 * Math.sin(a)}
				rx="3.1"
				ry="3.8"
				transform={`rotate(${(a * 180) / Math.PI + 90} ${C + 4.2 * Math.cos(a)} ${C + 4.2 * Math.sin(a)})`}
			/>,
		);
	}
	return (
		<g>
			{petals}
			<circle cx={C} cy={C} r="1.6" />
		</g>
	);
}

/** 傘の種類。いただいた図の4本に対応する。 */
export type WagasaVariant = 'petals' | 'sakura' | 'dense' | 'spiral';

interface Props {
	variant?: WagasaVariant;
	className?: string;
}

export default function Wagasa({ variant = 'dense', className = '' }: Props) {
	// 種類ごとの骨数。密なものほど本数を増やす。
	const ribs = variant === 'dense' ? 28 : variant === 'spiral' ? 18 : 20;

	return (
		<svg
			viewBox="0 0 120 120"
			className={className}
			fill="none"
			stroke="currentColor"
			strokeWidth="0.9"
			strokeLinejoin="round"
			aria-hidden="true"
		>
			{/* 縁の波形 */}
			<path d={scallopPath(ribs, 52)} />

			{/*
			 * 骨。sakura だけは縁の近くにしか骨を見せない
			 * （いただいた図の2本目は、天井が広く空いている）。
			 */}
			<path d={variant === 'sakura' ? ribPath(ribs, 40, 52) : ribPath(ribs, 9, 52)} />

			{/* 中ほどの輪（骨を横につなぐ糸） */}
			<circle cx={C} cy={C} r={variant === 'sakura' ? 40 : 38} />

			{/*
			 * 種類ごとの内側の意匠。
			 * sakura は中心を大きく空けて花を置き、
			 * spiral は中心から渦を巻かせる。
			 */}
			{variant === 'sakura' && <SakuraMark />}

			{variant === 'dense' && (
				<>
					<circle cx={C} cy={C} r="22" />
					<circle cx={C} cy={C} r="14" />
				</>
			)}

			{variant === 'spiral' && (
				<>
					{/* 渦。半径を少しずつ広げながら一周させる。 */}
					<path
						d={(() => {
							const steps = 64;
							let d = '';
							for (let i = 0; i <= steps; i++) {
								const t = i / steps;
								const a = t * Math.PI * 3.4;
								const r = 8 + t * 32;
								const x = (C + r * Math.cos(a)).toFixed(1);
								const y = (C + r * Math.sin(a)).toFixed(1);
								d += i === 0 ? `M${x} ${y}` : `L${x} ${y}`;
							}
							return d;
						})()}
					/>
					<circle cx={C} cy={C} r="26" />
				</>
			)}

			{variant === 'petals' && (
				<>
					{/* 散らした花びら。左上に寄せて風に流れる感じにする。 */}
					{[
						[38, 30, 18],
						[30, 42, -25],
						[46, 22, 40],
						[26, 56, 10],
						[42, 46, -40],
						[34, 66, 30],
						[52, 36, -15],
						[24, 30, 55],
					].map(([x, y, rot], i) => (
						<ellipse key={i} cx={x} cy={y} rx="1.9" ry="3.4" transform={`rotate(${rot} ${x} ${y})`} />
					))}
					<circle cx={C} cy={C} r="20" />
				</>
			)}

			{/* 中心の轆轤（ろくろ） */}
			<circle cx={C} cy={C} r="6" />
			<circle cx={C} cy={C} r="2.6" />
		</svg>
	);
}
