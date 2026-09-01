import type { ReactNode } from 'react';

interface FooterLink {
	label: string;
	href: string;
	icon?: ReactNode;
}

interface Props {
	heading: string;
	links: FooterLink[];
}

export default function FooterLinkColumn({ heading, links }: Props) {
	return (
		<div>
			<p className="mb-3 flex items-center gap-1.5 text-xs font-medium tracking-wide text-accent">
				<span className="h-3 w-0.5 rounded-full bg-accent/70" aria-hidden="true" />
				{heading}
			</p>
			<ul className="flex flex-col gap-2.5">
				{links.map((link) => (
					<li key={link.href}>
						<a
							href={link.href}
							className="inline-flex items-center gap-1.5 text-sm underline underline-offset-2 text-text/85 transition-colors hover:text-accent"
						>
							{link.icon}
							{link.label}
						</a>
					</li>
				))}
			</ul>
		</div>
	);
}
