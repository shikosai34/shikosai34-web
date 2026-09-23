/*
 * 光る雲と流れる霧を重ねた背景。
 *
 * 参考サイト（cho-kaguyahime.com）の雲（deco_neon-cloud1.png）の意匠に合わせた。
 * 先方の画像は転載できないので、同じ構成を SVG で描き起こしてある。
 *
 * 実物を解析したところ、あの雲は渦でも峰でもなく、
 * 丸端の横棒を段状にずらして重ねただけの、ごく規則的な形だった：
 *   - 2本ずつが右端でU字につながり、1本の管が折り返して流れる
 *   - その組が4つ、順に右へずれていく
 *   - 管は塗りではなく細い輪郭線（中は地が透ける）
 *   - 線そのものはほぼ白（#f0f0f0）で、色みは
 *     まわりのにじみが作っている
 * 下の CLOUD_PATH はその実測値をそのまま viewBox に写したもの。
 *
 * 純粋な装飾なので、全体を aria-hidden にしてスクリーンリーダーから外す。
 */
interface Props {
	/** 追加のクラス。置き場所（inset や z-index）の調整に使う。 */
	className?: string;
	/**
	 * 霧を流すか。ヒーローのような広い面では有効にし、
	 * 小さな囲みでは雲だけにする（霧はタイルが大きく、狭い面では効かない）。
	 */
	fog?: boolean;
	/**
	 * 雲の配置。既定（'corners'）は上下に散らす。
	 * 本文が下まで詰まっているパネルでは 'top' にして、
	 * 上の余白だけに置く（文字に重ねない）。
	 */
	placement?: 'corners' | 'top';
}

/*
 * 横棒8本。実測した座標（viewBox 542x368）をそのまま使う。
 * 太さ・丸端・間隔を変えると「段々に流れる」印象が崩れるため、
 * 大きさの調整は要素側（幅・高さ）で行う。
 */
const CLOUD_PATH =
	// 横棒は独立していない。2本ずつが右端でU字につながり、
	// 1本の管が折り返しながら右下へ流れていく形になっている。
	// 座標・折り返し位置は実物（542x368）からの実測値。
	'M45 78H246A17 17 0 0 1 246 112H107 ' +
	'M108 138H210A17 17 0 0 1 210 172H91 ' +
	'M92 198H297A17 17 0 0 1 297 232H199 ' +
	'M200 258H445A17 17 0 0 1 445 292H161';

function CloudTube({ flip = false }: { flip?: boolean }) {
	return (
		<svg
			viewBox="0 0 542 368"
			preserveAspectRatio="xMidYMid meet"
			style={flip ? { transform: 'scaleX(-1)' } : undefined}
		>
			{/*
			 * にじみ → 中間 → 芯 の順に重ねる。
			 * 参考サイトは芯がほぼ白で、まわりだけが色づいている。
			 */}
			<path className="cloud-bloom" d={CLOUD_PATH} />
			<path className="cloud-mid" d={CLOUD_PATH} />
			<path className="cloud-core" d={CLOUD_PATH} />
		</svg>
	);
}

export default function NeonClouds({ className = '', fog = true, placement = 'corners' }: Props) {
	return (
		<div
			aria-hidden="true"
			className={`neon-backdrop pointer-events-none absolute inset-0 overflow-hidden ${className}`}
		>
			{/* 奥の霧。2層を逆向きに流して視差を作る。 */}
			{fog && (
				<>
					<span className="neon-fog" />
					<span className="neon-fog neon-fog--reverse" />
				</>
			)}

			{/*
			 * 雲は余白に置く。文字やポスターの上には重ねない。
			 * 左右で向きを反転させると、同じ形の繰り返しに見えにくい。
			 */}
			<span className="neon-cloud top-1 right-3 h-20 w-36 sm:h-24 sm:w-44">
				<CloudTube />
			</span>

			{placement === 'corners' ? (
				<>
					<span className="neon-cloud neon-cloud--pink bottom-3 left-3 h-16 w-32 opacity-75 sm:h-20 sm:w-40">
						<CloudTube flip />
					</span>
					<span className="neon-cloud top-1/2 right-5 h-14 w-28 opacity-35 sm:w-32">
						<CloudTube />
					</span>
				</>
			) : (
				/* 上だけ。本文の上に雲がかからないようにする。 */
				<span className="neon-cloud neon-cloud--pink top-14 left-3 h-16 w-32 opacity-60 sm:h-20 sm:w-40">
					<CloudTube flip />
				</span>
			)}
		</div>
	);
}
