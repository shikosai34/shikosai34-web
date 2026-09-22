import { useState } from 'react';
import MobileNav from './MobileNav';

interface Props {
	logoSrc: string;
}

export default function Header({ logoSrc }: Props) {
	const [isNavOpen, setIsNavOpen] = useState(false);

	return (
		<header>
			{/*
			 * 参考サイトに倣い、ロゴとメニューは 1 本の帯にまとめず、
			 * 左上と右上にそれぞれ独立した面として浮かせる。
			 * 帯を外した分、下の本文が潜り込まないよう
			 * ページ側ではなくここで上端の余白を確保する。
			 */}
			<div aria-hidden="true" className="h-20" />

			{/*
			 * 左右の端に別々に置くのではなく、透明な一本の枠を渡してその両端に配置する。
			 * 枠自体は当たり判定を持たせず、2 つの面だけが押せるようにする。
			 */}
			<div className="pointer-events-none fixed inset-x-0 top-3 z-[60] flex items-start justify-between px-3">
				{/*
				 * ロゴ。地もヘッダーも同じ濃紺なので、塗りだけでは面が消える。
				 * 少し濃い地に差し色の縁と発光を添えて、浮いた札として見せる。
				 */}
				<a
					href="/"
					className="pointer-events-auto flex items-center rounded-2xl border border-accent/40 bg-base/80 px-4 py-3 shadow-[0_0_20px_rgba(0,255,204,0.15)] backdrop-blur-sm transition-colors hover:border-accent"
				>
					<img src={logoSrc} alt="茨香祭" className="h-9 w-auto" />
				</a>

				{/*
				 * メニュー。参考サイトと同じく丸い面に 2 本線と MENU の字を収める。
				 * 開いている間は線を交差させて×にし、字と線を差し色に変える。
				 */}
				<button
					type="button"
					aria-label={isNavOpen ? 'メニューを閉じる' : 'メニューを開く'}
					aria-expanded={isNavOpen}
					onClick={() => setIsNavOpen((open) => !open)}
					className="group pointer-events-auto flex h-16 w-16 flex-col items-center justify-center rounded-full border border-accent/40 bg-base/80 shadow-[0_0_20px_rgba(0,255,204,0.15)] backdrop-blur-sm transition-colors hover:border-accent"
				>
					<span aria-hidden="true" className="relative block h-3 w-7">
						<span
							className={`absolute inset-x-0 top-0 block h-0.5 rounded-full transition-all duration-300 ${
								isNavOpen ? 'translate-y-[5px] rotate-20 bg-accent' : 'bg-text'
							} group-hover:bg-accent`}
						/>
						<span
							className={`absolute inset-x-0 bottom-0 block h-0.5 rounded-full transition-all duration-300 ${
								isNavOpen ? '-translate-y-[5px] -rotate-20 bg-accent' : 'bg-text'
							} group-hover:bg-accent`}
						/>
					</span>
					<span
						className={`mt-1.5 text-[10px] leading-none tracking-[0.2em] transition-colors duration-300 ${
							isNavOpen ? 'text-accent' : 'text-text'
						} group-hover:text-accent`}
					>
						MENU
					</span>
				</button>
			</div>

			<MobileNav isOpen={isNavOpen} onClose={() => setIsNavOpen(false)} />
		</header>
	);
}
