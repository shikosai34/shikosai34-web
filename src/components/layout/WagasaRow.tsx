import Wagasa, { type WagasaVariant } from '../ui/Wagasa';

/*
 * フッターの上に和傘を並べる帯。
 *
 * 参考サイト（cho-kaguyahime.com）も deco_umbrella*.svg を
 * @keyframes umbrella（14〜17秒・向き違い）でゆっくり回している。
 * ここでも傘ごとに速度と向きを変え、同じ動きが揃わないようにする。
 *
 * フッターは上端が弧（border-radius: 50% 50% 0 0）になっているため、
 * 傘は弧の内側に収まるよう、下げすぎないこと。
 * 下へずらすと、フッターの縁で下端が切れてしまう。
 *
 * 装飾なので aria-hidden。
 */

/** 傘ごとの見せ方。速度・向き・大きさを散らす。 */
const UMBRELLAS: {
	variant: WagasaVariant;
	/** 回転の秒数。参考サイトに倣い 14〜17 秒。 */
	spin: string;
	reverse?: boolean;
	/** 弧に沿わせるための上げ幅。外側の2本をわずかに上げる。 */
	offset: string;
	size: string;
}[] = [
	{ variant: 'petals', spin: 'wagasa-spin-15', offset: '-translate-y-1', size: 'w-24 sm:w-32' },
	{ variant: 'sakura', spin: 'wagasa-spin-16', reverse: true, offset: '', size: 'w-28 sm:w-36' },
	{ variant: 'dense', spin: 'wagasa-spin-14', offset: '', size: 'w-28 sm:w-36' },
	{ variant: 'spiral', spin: 'wagasa-spin-17', reverse: true, offset: '-translate-y-1', size: 'w-24 sm:w-32' },
];

export default function WagasaRow() {
	return (
		<div
			aria-hidden="true"
			className="pointer-events-none relative -mb-2 flex items-end justify-center gap-2 px-4 sm:gap-6"
		>
			{UMBRELLAS.map((u, i) => (
				<span key={i} className={`${u.offset} ${u.size} shrink-0`}>
					<Wagasa
						variant={u.variant}
						className={`h-auto w-full text-text/45 ${u.spin} ${u.reverse ? 'wagasa-reverse' : ''}`}
					/>
				</span>
			))}
		</div>
	);
}
