interface Props {
	src: string;
	width: number;
	height: number;
	/** 装飾として置くときは空文字にする。 */
	alt: string;
	/** 大きさや余白など、置き場所ごとの調整。 */
	className?: string;
	/** 隠れている場面がある置き場所では lazy にして、見えるまで読み込まない。 */
	loading?: 'eager' | 'lazy';
}

/*
 * ポスターを円で切り抜いて見せる面。トップの速報タイルとメニューで使う。
 *
 * 参考サイトに倣い、紙面を円でそのまま切り抜く。
 * 円は縦長だと上下が切れすぎるので、横長（5:4）の楕円ではなく正円にする。
 */
export default function PosterCircle({ src, width, height, alt, className = '', loading }: Props) {
	return (
		<div
			className={`kikko neon-ring relative flex aspect-square items-center justify-center overflow-hidden rounded-full border-2 border-accent/50 bg-base ${className}`}
		>
			{/*
			 * 紙面は円より小さく置く。object-cover で埋めると倍率が上がって
			 * 四隅が大きく欠けるため、縮めて端の情報を残す。
			 *
			 * ただし縮めすぎると円の中で紙面が浮いてしまうので、
			 * 上下は円からわずかに外れるくらい（高さ 106%）に留める。
			 * 左右は円の内側に収まる幅にして、隅が環をはみ出さないようにする。
			 */}
			<img
				src={src}
				width={width}
				height={height}
				alt={alt}
				loading={loading}
				className="h-[106%] w-auto max-w-none"
			/>
		</div>
	);
}
