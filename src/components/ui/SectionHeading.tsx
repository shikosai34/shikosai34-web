interface Props {
	title: string;
	className?: string;
	/** 明るい背景に置くときは "dark"（文字色を濃色に）。既定は暗いパネル向けの "light"。 */
	tone?: 'light' | 'dark';
}

export default function SectionHeading({ title, className = '', tone = 'light' }: Props) {
	return (
		<div className={`mb-5 flex items-center gap-3 ${className}`}>
			<span className="flex gap-1" aria-hidden="true">
				<span className="h-6 w-2 -skew-x-12 bg-accent" />
				<span className="h-6 w-2 -skew-x-12 bg-main" />
			</span>
			<h2
				className={`text-xl font-medium tracking-wide ${tone === 'dark' ? 'text-base' : 'text-text'}`}
			>
				{title}
			</h2>
		</div>
	);
}
