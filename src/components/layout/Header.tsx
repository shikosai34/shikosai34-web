import { useState } from 'react';
import HamburgerIcon from '../icons/HamburgerIcon';
import MobileNav from './MobileNav';

interface Props {
	logoSrc: string;
}

export default function Header({ logoSrc }: Props) {
	const [isNavOpen, setIsNavOpen] = useState(false);

	return (
		<header className="sticky top-3 z-40 mx-3 flex items-center justify-between rounded-2xl bg-base px-4 py-2.5">
			<a href="/" className="flex items-center gap-2 py-1">
				<img src={logoSrc} alt="茨香祭" className="h-8 w-auto" />
			</a>

			<button
				type="button"
				aria-label="メニューを開く"
				aria-expanded={isNavOpen}
				onClick={() => setIsNavOpen(true)}
				className="rounded-full p-2 text-text transition-colors hover:bg-text/10 hover:text-accent"
			>
				<HamburgerIcon className="h-6 w-6" />
			</button>

			<MobileNav isOpen={isNavOpen} onClose={() => setIsNavOpen(false)} />
		</header>
	);
}
