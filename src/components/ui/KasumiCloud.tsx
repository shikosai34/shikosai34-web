/*
 * 霞（かすみ）の雲。
 *
 * 形は kasumi-cloud-2.svg（元画像から白線の中心位置を計測して起こしたもの）。
 * 1本の連続した線で、水平線と半円（左右交互）を上から順につなぎ、
 * 各段の内側に同じ半径の半円をもう1本ずらして置く、という構成。
 *
 * ファイルを <img> で読まずコンポーネントにしているのは、
 *   - 色を currentColor で差し替えたい（シアン／ピンク）
 *   - 発光の強さを場所ごとに変えたい
 * ため。<img> だと中の stroke を外から触れない。
 *
 * 装飾なので aria-hidden。
 */

/** 本体。水平線＋半円を上から順につないだ連続線。 */
const KASUMI_MAIN =
	'M 215 61 H 121 A 9 9 0 0 0 121 79 H 188 A 11.5 11.5 0 0 1 188 102 ' +
	'H 45.5 A 9 9 0 0 0 45.5 120 H 127 A 12 12 0 0 1 127 144 ' +
	'H 57.5 A 9 9 0 0 0 57.5 162 H 152 A 11.5 11.5 0 0 1 152 185 H 10';

/** 最上段の直線。 */
const KASUMI_TOP = 'M 89.5 37.5 H 215';

/** 各段の内側に重ねる半円。 */
const KASUMI_INNER = [
	'M 149 61 A 9 9 0 0 0 149 79',
	'M 159 79 A 11.5 11.5 0 0 1 159 102',
	'M 74 102 A 9 9 0 0 0 74 120',
	'M 98 120 A 12 12 0 0 1 98 144',
	'M 86 144 A 9 9 0 0 0 86 162',
	'M 123.5 162 A 11.5 11.5 0 0 1 123.5 185',
];

interface Props {
	className?: string;
	/** 左右反転。画面の右端に置くときに使う。 */
	flip?: boolean;
	/**
	 * 発光を描くか。小さく置くときは芯だけにしたほうが締まる。
	 */
	glow?: boolean;
	/**
	 * ぼかしの id。1ページに複数置くため、filter の id を
	 * 重複させないよう呼び出し側で分ける。
	 */
	id?: string;
}

export default function KasumiCloud({
	className = '',
	flip = false,
	glow = true,
	id = 'kasumi',
}: Props) {
	const filterId = `${id}-glow`;

	return (
		<svg
			viewBox="0 0 210 226"
			className={className}
			fill="none"
			stroke="currentColor"
			strokeLinecap="round"
			strokeLinejoin="round"
			aria-hidden="true"
		>
			<defs>
				{/*
				 * 発光。ぼかし量の違う2層を重ねると、
				 * 管のすぐ外の明るいにじみと、遠くまで届く淡い光の
				 * 両方が出る（元の SVG と同じ作り）。
				 */}
				{glow && (
					<filter id={filterId} filterUnits="userSpaceOnUse" x="-20" y="0" width="250" height="226">
						<feGaussianBlur in="SourceGraphic" stdDeviation="2" result="near" />
						<feGaussianBlur in="SourceGraphic" stdDeviation="10" result="far" />
						<feMerge>
							<feMergeNode in="far" />
							<feMergeNode in="near" />
						</feMerge>
					</filter>
				)}

				{/*
				 * 反転は SVG の中（この g）で行う。要素側の transform に
				 * scaleX(-1) を置くと、揺れのアニメーション（.edge-kasumi）の
				 * transform に上書きされて反転が消えるため。
				 */}
				<g id={`${id}-shape`} transform={flip ? 'translate(210 0) scale(-1 1)' : undefined}>
					<path d={KASUMI_TOP} />
					<path d={KASUMI_MAIN} />
					{KASUMI_INNER.map((d) => (
						<path key={d} d={d} />
					))}
				</g>
			</defs>

			{/* 発光層。太めの線をぼかす。 */}
			{glow && <use href={`#${id}-shape`} strokeWidth="6" strokeOpacity="0.55" filter={`url(#${filterId})`} />}

			{/* 芯。ぼかさない細い線。 */}
			<use href={`#${id}-shape`} strokeWidth="3" />
		</svg>
	);
}
