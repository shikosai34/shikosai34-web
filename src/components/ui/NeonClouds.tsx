/*
 * パネルの奥を流れる霧。
 *
 * 以前はここに光る雲（KasumiCloud）も置いていたが、雲はタイルの中ではなく
 * 画面の端から出ているように見せるため EdgeKasumi に移した。
 * ここに残すのは、タイルの面に空気感を足す霧だけ。
 *
 * 純粋な装飾なので、全体を aria-hidden にしてスクリーンリーダーから外す。
 */
interface Props {
	/** 追加のクラス。置き場所（inset や z-index）の調整に使う。 */
	className?: string;
}

export default function NeonClouds({ className = '' }: Props) {
	return (
		<div
			aria-hidden="true"
			className={`neon-backdrop pointer-events-none absolute inset-0 overflow-hidden ${className}`}
		>
			{/* 2層を逆向きに流して視差を作る。 */}
			<span className="neon-fog" />
			<span className="neon-fog neon-fog--reverse" />
		</div>
	);
}
