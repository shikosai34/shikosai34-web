import SectionIcon, { type SectionIconName } from '../icons/SectionIcon';

interface Props {
	title: string;
	/** 見出しの左に置くアイコン。題に合ったものを選ぶ。 */
	icon: SectionIconName;
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
	icon,
	className = '',
	tone = 'light',
	subtitle,
}: Props) {
	return (
		<div className={`mb-5 flex items-center gap-3 ${className}`}>
			{/* ネオン管のように、シアンの線画をにじませる。 */}
			<SectionIcon
				name={icon}
				className="h-6 w-6 shrink-0 text-accent drop-shadow-[0_0_4px_color-mix(in_srgb,var(--color-accent)_60%,transparent)]"
			/>
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
