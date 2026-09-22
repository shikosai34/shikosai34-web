interface Props {
	title: string;
	className?: string;
	/** 明るい背景に置くときは "dark"（文字色を濃色に）。既定は暗いパネル向けの "light"。 */
	tone?: 'light' | 'dark';
	/**
	 * 見出しの下に添える日本語の小見出し。
	 * 英字の見出しに読みを添える形（指定がなければ従来どおり見出しのみ）。
	 */
	subtitle?: string;
}

export default function SectionHeading({
	title,
	className = '',
	tone = 'light',
	subtitle,
}: Props) {
	return (
		<div className={`mb-5 flex items-center gap-3 ${className}`}>
			<span className="flex gap-1" aria-hidden="true">
				<span className="h-6 w-2 -skew-x-12 bg-accent" />
				<span className="h-6 w-2 -skew-x-12 bg-main" />
			</span>
			<div className="min-w-0">
				<h2
					className={`text-xl font-medium tracking-wide ${tone === 'dark' ? 'text-base' : 'text-text'}`}
				>
					{title}
				</h2>
				{subtitle ? (
					<p
						className={`text-xs tracking-[0.2em] ${tone === 'dark' ? 'text-base/60' : 'text-accent/80'}`}
					>
						{subtitle}
					</p>
				) : null}
			</div>
		</div>
	);
}
