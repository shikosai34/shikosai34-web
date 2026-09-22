import type { NavLinkItem } from '../../lib/navigation';

interface Props {
	item: NavLinkItem;
	onNavigate?: () => void;
}

export default function NavLink({ item, onNavigate }: Props) {
	return (
		<li>
			<a
				href={item.href}
				onClick={onNavigate}
				className="block rounded-lg px-3 py-2.5 text-text transition-colors hover:bg-text/5 hover:text-accent"
			>
				{item.label}
			</a>
		</li>
	);
}
