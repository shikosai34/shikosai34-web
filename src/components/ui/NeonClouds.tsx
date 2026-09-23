/*
 * 光る雲と流れる霧を重ねた背景。
 *
 * 参考サイト（cho-kaguyahime.com）の雲は、塊ではなく
 * 「瑞雲の渦をネオン管で描いた線」になっている。
 * 太い丸端の線が平行に並び、芯が白く飛び、まわりに色がにじむ。
 * そこで塗りではなく stroke で描き、
 * にじみ・中間・芯の3枚を重ねて管の見え方を作る（CSS 側 .neon-cloud）。
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
 * 瑞雲ひとつ分の線。viewBox は 124x80。
 * 「峰（丸い膨らみ）＋ たなびく帯」を、太さの違う線で3回描く。
 * 同じ d を3枚重ね、CSS 側で外側のにじみ・中間・芯に塗り分ける。
 */
const CLOUD_PATH =
	// 上：雲の峰（三つの膨らみ）。下：たなびく帯を3本。
	// 和の瑞雲は「峰＋横に流れる帯」で描くのが定型で、
	// 参考サイトのネオン雲もこの構成になっている。
	'M30 42a10 10 0 0 1 12-10 12 12 0 0 1 22-3 10 10 0 0 1 14 9' +
	'M24 50h76' +
	'M36 58h56' +
	'M48 66h36';

function CloudTube({ flip = false }: { flip?: boolean }) {
	return (
		<svg
			viewBox="-12 -12 148 104"
			preserveAspectRatio="xMidYMid meet"
			style={flip ? { transform: 'scaleX(-1)' } : undefined}
		>
			{/* 外→中→芯の順に重ねる。順番を変えると芯が埋もれる。 */}
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
			<span className="neon-cloud top-2 right-3 h-16 w-44 sm:h-20 sm:w-56">
				<CloudTube />
			</span>
			{placement === 'corners' ? (
				<>
					<span className="neon-cloud neon-cloud--pink bottom-4 left-3 h-14 w-40 opacity-85 sm:h-16 sm:w-48">
						<CloudTube flip />
					</span>
					<span className="neon-cloud top-1/2 right-6 h-12 w-32 opacity-45 sm:w-40">
						<CloudTube />
					</span>
				</>
			) : (
				/* 上だけ。本文の上に雲がかからないようにする。 */
				<span className="neon-cloud neon-cloud--pink top-16 left-3 h-12 w-32 opacity-70 sm:h-14 sm:w-40">
					<CloudTube flip />
				</span>
			)}
		</div>
	);
}
