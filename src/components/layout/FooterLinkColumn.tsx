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
			{/*
			 * 指で押す前提の間隔。リンク自体に縦の余白を持たせて、
			 * 文字高（約 20px）ではなく 44px 相当の高さを確保する。
			 */}
			<ul className="flex flex-col">
				{links.map((link) => (
					<li key={link.href}>
						<a
							href={link.href}
							className="inline-flex min-h-11 items-center gap-1.5 py-1.5 text-sm underline underline-offset-2 text-text/85 transition-colors hover:text-accent"
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
