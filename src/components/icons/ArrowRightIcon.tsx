interface Props {
	className?: string;
}

export default function ArrowRightIcon({ className }: Props) {
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
			<line x1="4" y1="12" x2="20" y2="12" />
			<polyline points="13 5 20 12 13 19" />
		</svg>
	);
}
