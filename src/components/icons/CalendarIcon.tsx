interface Props {
	className?: string;
}

export default function CalendarIcon({ className }: Props) {
	return (
		<svg
			viewBox="0 0 24 24"
			fill="none"
			stroke="currentColor"
			strokeWidth={2}
			strokeLinecap="round"
			strokeLinejoin="round"
			className={className}
			aria-hidden="true"
		>
			<rect x="3" y="5" width="18" height="16" rx="2" />
			<line x1="3" y1="10" x2="21" y2="10" />
			<line x1="8" y1="3" x2="8" y2="7" />
			<line x1="16" y1="3" x2="16" y2="7" />
		</svg>
	);
}
