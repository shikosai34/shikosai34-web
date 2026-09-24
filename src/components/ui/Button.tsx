import type { ReactNode } from 'react';

interface Props {
	href: string;
	children: ReactNode;
	variant?: 'accent' | 'outline' | 'primary-dark' | 'main';
	className?: string;
}

type Variant = NonNullable<Props['variant']>;

const variantClass: Record<Variant, string> = {
	accent: 'bg-accent text-base hover:bg-accent/85',
	outline: 'border border-text/40 text-text hover:border-accent hover:text-accent',
	'primary-dark': 'bg-base text-text hover:bg-base/85',
	main: 'bg-main text-base font-bold hover:bg-main/85',
};

/**
 * ボタンの見た目。リンクではなく <button> で動作させたい場所
 * （カードをめくるなど）でも、同じ押しやすさ・見た目にそろえるために使う。
 */
export function buttonClassName(variant: Variant = 'accent', className = '') {
	return `inline-flex min-h-11 items-center gap-1.5 rounded-xl px-5 py-3 text-sm font-medium transition-colors ${variantClass[variant]} ${className}`;
}

export default function Button({ href, children, variant = 'accent', className = '' }: Props) {
	return (
		<a href={href} className={buttonClassName(variant, className)}>
			{children}
		</a>
	);
}
