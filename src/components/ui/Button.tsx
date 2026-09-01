import type { ReactNode } from 'react';

interface Props {
	href: string;
	children: ReactNode;
	variant?: 'accent' | 'outline' | 'primary-dark' | 'main';
	className?: string;
}

const variantClass: Record<NonNullable<Props['variant']>, string> = {
	accent: 'bg-accent text-base hover:bg-accent/85',
	outline: 'border border-text/40 text-text hover:border-accent hover:text-accent',
	'primary-dark': 'bg-base text-text hover:bg-base/85',
	main: 'bg-main text-base font-bold hover:bg-main/85',
};

export default function Button({ href, children, variant = 'accent', className = '' }: Props) {
	return (
		<a
			href={href}
			className={`inline-flex items-center gap-1.5 rounded-xl px-5 py-2.5 text-sm font-medium transition-colors ${variantClass[variant]} ${className}`}
		>
			{children}
		</a>
	);
}
