interface Props {
	className?: string;
}

/**
 * 両端に菱形を置いた細い罫線。参考サイトがメニューの囲みに使っている意匠。
 * 飾りなので aria-hidden とし、読み上げには乗せない。
 */
export default function DiamondRule({ className = '' }: Props) {
	return (
		<div className={`flex items-center ${className}`} aria-hidden="true">
			<span className="h-1.5 w-1.5 rotate-45 border border-accent/70" />
			<span className="h-px flex-1 bg-accent/40" />
			<span className="h-1.5 w-1.5 rotate-45 border border-accent/70" />
		</div>
	);
}
