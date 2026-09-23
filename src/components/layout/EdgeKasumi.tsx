import KasumiCloud from '../ui/KasumiCloud';

/*
 * 画面の左右端に霞を固定する層。
 *
 * 参考サイト（cho-kaguyahime.com）は .kv__frame を
 * position:sticky / height:100vh / z-index:500 の枠にして、
 * その左右に装飾（decoInnerL / decoInnerR）を貼り付け、
 * spotlightL / spotlightR（2.7s / 2.9s）でゆっくり揺らしている。
 * ここでも同じ考え方で、端に霞を置いて揺らす。
 *
 * fixed にしているのは、スクロールしても端に残したいため。
 * 本文の邪魔をしないよう pointer-events:none とする。
 *
 * 雲はタイルの中ではなく、画面の外から覗いているように見せる。
 * そのため各雲を左右へ大きくはみ出させ、画面内には半分ほどだけ出す。
 * 雲はタイルの上に乗せる（z-10）。ヘッダー（z-[60]）やメニュー（z-50）
 * よりは下。幅の狭い画面では雲を小さくし、画面内には半分強を
 * 覗かせる。
 *
 * 装飾なので aria-hidden。
 */
export default function EdgeKasumi() {
	return (
		<div
			aria-hidden="true"
			className="pointer-events-none fixed inset-0 z-10 overflow-hidden"
		>
			{/* 左端。上寄りに置く。 */}
			<KasumiCloud
				id="edge-l"
				className="edge-kasumi edge-kasumi--l absolute top-[8vh] -left-10 w-28 text-accent/45 lg:-left-6 lg:w-44 xl:-left-8 xl:w-56"
			/>

			{/* 左端の下。ピンクにして、上下で色を分ける。 */}
			<KasumiCloud
				id="edge-l2"
				flip
				className="edge-kasumi edge-kasumi--l2 absolute bottom-[10vh] -left-8 w-24 text-glow-pink/35 lg:-left-6 lg:w-36 xl:-left-8 xl:w-44"
			/>

			{/* 右端。左と向きを変える。 */}
			<KasumiCloud
				id="edge-r"
				flip
				className="edge-kasumi edge-kasumi--r absolute top-[22vh] -right-10 w-28 text-glow-pink/40 lg:-right-6 lg:w-44 xl:-right-8 xl:w-56"
			/>

			{/* 右端の下。 */}
			<KasumiCloud
				id="edge-r2"
				className="edge-kasumi edge-kasumi--r2 absolute bottom-[6vh] -right-8 w-24 text-accent/40 lg:-right-6 lg:w-36 xl:-right-8 xl:w-44"
			/>
		</div>
	);
}
