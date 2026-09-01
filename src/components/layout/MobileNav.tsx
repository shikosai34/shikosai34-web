import { navGroups } from '../../lib/navigation';
import CloseIcon from '../icons/CloseIcon';
import NavLink from './NavLink';

interface Props {
	isOpen: boolean;
	onClose: () => void;
}

export default function MobileNav({ isOpen, onClose }: Props) {
	return (
		<div
			className={`fixed inset-0 z-50 transition-opacity ${
				isOpen ? 'pointer-events-auto opacity-100' : 'pointer-events-none opacity-0'
			}`}
			aria-hidden={!isOpen}
		>
			<button
				type="button"
				aria-label="メニューを閉じる"
				onClick={onClose}
				className="absolute inset-0 bg-base/80"
			/>
			<nav
				className={`absolute inset-y-0 right-0 flex w-[85%] max-w-sm flex-col gap-6 overflow-y-auto border-l border-accent/20 bg-base px-6 py-6 transition-transform duration-300 ${
					isOpen ? 'translate-x-0' : 'translate-x-full'
				}`}
				aria-label="サイト内メニュー"
			>
				<div className="flex items-center justify-between">
					<span className="text-sm font-medium text-text/70">メニュー</span>
					<button
						type="button"
						aria-label="メニューを閉じる"
						onClick={onClose}
						className="rounded-full p-2 text-text hover:bg-text/10"
					>
						<CloseIcon className="h-5 w-5" />
					</button>
				</div>

				{navGroups.map((group) => (
					<div key={group.heading ?? 'main'}>
						{group.heading ? (
							<p className="mb-1 px-3 text-xs font-medium tracking-wide text-accent">
								{group.heading}
							</p>
						) : null}
						<ul>
							{group.links.map((item) => (
								<NavLink key={item.href} item={item} onNavigate={onClose} />
							))}
						</ul>
					</div>
				))}
			</nav>
		</div>
	);
}
