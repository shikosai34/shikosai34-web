import KasumiCloud from './KasumiCloud';
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
 * 雲の絵は KasumiCloud（kasumi-cloud-2.svg 由来）に統一した。
 * 以前は参考サイトの PNG から実測した横棒のパスを持っていたが、
 * より作り込まれた霞の SVG に差し替えている。
 */

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
			<KasumiCloud
				id="panel-a"
				className="neon-cloud top-1 right-2 w-20 text-accent/35 sm:w-24"
			/>

			{placement === 'corners' ? (
				<>
					<KasumiCloud
						id="panel-b"
						flip
						className="neon-cloud bottom-1 left-1 w-16 text-glow-pink/30 sm:w-20"
					/>
					<KasumiCloud
						id="panel-c"
						className="neon-cloud top-1/3 right-3 w-14 text-accent/18 sm:w-16"
					/>
				</>
			) : (
				/* 上だけ。本文の上に雲がかからないようにする。 */
				<KasumiCloud
					id="panel-top"
					flip
					className="neon-cloud top-12 left-1 w-16 text-glow-pink/28 sm:w-20"
				/>
			)}
		</div>
	);
}
