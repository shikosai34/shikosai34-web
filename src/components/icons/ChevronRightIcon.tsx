interface Props {
	className?: string;
}

export default function ChevronRightIcon({ className }: Props) {
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
			<polyline points="9 6 15 12 9 18" />
		</svg>
	);
}
