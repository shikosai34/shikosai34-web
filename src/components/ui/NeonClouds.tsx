/*
 * 光る雲と流れる霧を重ねた背景。
 *
 * 参考サイト（cho-kaguyahime.com）のキービジュアルは
 *   - deco_neon-cloud1/2.png を floating-x で左右に揺らす
 *   - 背景の霧を fog（60s / 80s reverse）で流す
 * という二層構成になっている。画像は持てないので、
 * 同じ役割を CSS（.neon-cloud / .neon-fog）で組み立てたものがこれ。
 *
 * 純粋な装飾なので、全体を aria-hidden にしてスクリーンリーダーから外す。
 * 位置は「余白に逃がす」ことだけ考えればよく、
 * 中身の可読性を落とさないよう、雲は四隅に寄せて中央を空ける。
 */
interface Props {
	/** 追加のクラス。置き場所（inset や z-index）の調整に使う。 */
	className?: string;
	/**
	 * 霧を流すか。ヒーローのような広い面では有効にし、
	 * 小さな囲みでは雲だけにする（霧はタイルが大きく、狭い面では効かない）。
	 */
	fog?: boolean;
}

export default function NeonClouds({ className = '', fog = true }: Props) {
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
			 * 手前の雲。左上はシアン、右下はピンクに振って、
			 * ポスターの2色が画面の対角で呼応するようにする。
			 */}
			{/*
			 * 雲の形（SVG）は 300x140 なので、要素も横長にする。
			 * 正方形に近い箱に入れると瑞雲が縦に潰れる。
			 *
			 * 位置は枠の内側に収める。親が overflow-hidden なので、
			 * negative inset で大きく外に出すと明るい芯だけが切り取られ、
			 * 裾の暗い部分しか残らず灰色の帯に見えてしまう。
			 */}
			{/*
			 * 見出しの右の空き、円の左右の三日月状の余白、下の帯。
			 * 文字やポスターの上には置かない。
			 */}
			<span className="neon-cloud top-1 right-2 h-16 w-36 sm:h-20 sm:w-44" />
			<span className="neon-cloud neon-cloud--pink bottom-4 left-6 h-14 w-32 opacity-70 sm:h-16 sm:w-40" />
			{/*
			 * 中段にもう一枚だけ薄く置くと、上下の雲がつながって
			 * 「靄の中に浮いている」ように見える。
			 */}
			<span className="neon-cloud top-1/2 -right-6 h-14 w-32 opacity-50 sm:w-40" />
		</div>
	);
}
