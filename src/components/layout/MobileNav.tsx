import { useEffect, useState } from 'react';
import { navGroups } from '../../lib/navigation';
import DiamondRule from '../ui/DiamondRule';
import PosterCircle from '../ui/PosterCircle';

export interface NavPoster {
	src: string;
	width: number;
	height: number;
}

interface Props {
	isOpen: boolean;
	onClose: () => void;
	poster: NavPoster;
}

export default function MobileNav({ isOpen, onClose, poster }: Props) {
	/*
	 * メニューは閉じている間も DOM に残る（透明にしているだけ）ので、
	 * そのままだと開かないページでもポスターを読み込んでしまう。
	 * 一度開くまでは描かず、開いたら以降は残しておく。
	 * モバイルではポスターを出さない（display:none）ので、画像は lazy にして読み込ませない。
	 */
	const [hasOpened, setHasOpened] = useState(false);
	useEffect(() => {
		if (isOpen) setHasOpened(true);
	}, [isOpen]);

	return (
		<div
			className={`fixed inset-0 z-50 transition-opacity duration-300 ${
				isOpen ? 'pointer-events-auto opacity-100' : 'pointer-events-none opacity-0'
			}`}
			aria-hidden={!isOpen}
		>
			{/*
			 * 参考サイトに倣い、脇から出す引き出しではなく全面を覆う。
			 * 地は亀甲を敷いた濃紺で、ページ本体と同じ意匠にする。
			 */}
			<div className="kikko absolute inset-0 bg-base" />

			<nav
				className="absolute inset-0 flex flex-col overflow-y-auto px-5 py-5"
				aria-label="サイト内メニュー"
			>
				{/*
				 * 閉じる導線はヘッダーの MENU ボタンが兼ねる（開くと×に変わる）。
				 * ここではその丸い面と重ならないよう、上端を空けておく。
				 */}
				<div aria-hidden="true" className="h-16" />

				<div className="mt-6 flex-1 md:mx-auto md:w-full md:max-w-5xl">
					<DiamondRule className="mb-6" />

					{/*
					 * 広い画面では、縦書きの項目が右に寄って左側が空くので、
					 * そこにトップの速報と同じ円のポスターを置く。
					 * 項目の列は中身の幅（auto）、ポスターは残りの幅を取る。
					 * モバイルは左に余白がないので出さない。
					 */}
					<div className="md:grid md:grid-cols-[minmax(0,1fr)_auto] md:items-center md:gap-12">
						<div className="hidden md:block">
							{hasOpened && (
								<PosterCircle
									src={poster.src}
									width={poster.width}
									height={poster.height}
									alt=""
									loading="lazy"
									className="mx-auto w-full max-w-sm lg:max-w-md"
								/>
							)}
						</div>

						{/*
						 * 縦書きは右から左へ読むため、グループも右端から並べる。
						 * 全 19 項目を 1 行に並べると画面幅に収まらないので、
						 * グループごとに行を分け、行の中だけ右から左へ送る。
						 *
						 * 広い画面でも同じく、トップ類・企画・来場案内・その他の 4 段に積む。
						 * グループを横に並べると、縦書きの列がどのグループに属するのか
						 * 見分けにくくなるため。
						 */}
						<div className="flex flex-col gap-7">
							{navGroups.map((group) => (
								<div key={group.heading ?? 'main'}>
									{group.heading ? (
										<p className="mb-2 text-right text-xs tracking-[0.3em] text-accent">
											{group.heading}
										</p>
									) : null}
									{/*
									 * 縦書きは字数で高さが決まるため、2 文字の項目（装飾・協賛）は
									 * そのままだと 37px しかない。指で押せるよう min-h / w で下限を敷く。
									 */}
									<ul className="flex flex-row-reverse flex-wrap items-start justify-start gap-x-4 gap-y-5">
										{group.links.map((item) => (
											<li key={item.href}>
												<a
													href={item.href}
													onClick={onClose}
													className="tategaki block min-h-28 w-11 py-1 text-base tracking-[0.15em] whitespace-nowrap text-text transition-colors hover:text-accent"
												>
													{item.label}
												</a>
											</li>
										))}
									</ul>
								</div>
							))}
						</div>
					</div>

					<DiamondRule className="mt-6" />
				</div>
			</nav>
		</div>
	);
}
