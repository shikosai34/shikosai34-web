interface Props {
	className?: string;
	/** 左右どちら側の余白に置くか。右に置くときは左右を反転する。 */
	side?: 'left' | 'right';
}

/**
 * 流雲を線画にしたネオンの装飾。参考サイトが余白に置いている雲の意匠に倣う。
 * 意味を持たない飾りなので aria-hidden とし、読み上げには乗せない。
 */
export default function KumoLine({ className = '', side = 'left' }: Props) {
	return (
		<svg
			className={`neon-line ${side === 'right' ? '-scale-x-100' : ''} ${className}`}
			viewBox="0 0 120 64"
			fill="none"
			stroke="currentColor"
			strokeWidth="1.5"
			strokeLinecap="round"
			aria-hidden="true"
		>
			{/* 渦を巻いた雲の頭 */}
			<path d="M22 32c0-6 5-11 11-11s11 5 11 11-5 11-11 11a8 8 0 0 1-8-8 5 5 0 0 1 5-5" />
			{/* 雲から伸びる three 本の流れ */}
			<path d="M44 26h34a7 7 0 0 1 0 14H58" />
			<path d="M44 32h48" />
			<path d="M50 44h42a6 6 0 0 0 0-12" />
			<path d="M4 20h30" />
			<path d="M8 50h28" />
		</svg>
	);
}
