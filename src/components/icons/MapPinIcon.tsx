interface Props {
	className?: string;
}

export default function MapPinIcon({ className }: Props) {
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
			<path d="M12 21s7-6.5 7-12A7 7 0 0 0 5 9c0 5.5 7 12 7 12Z" />
			<circle cx="12" cy="9" r="2.5" />
		</svg>
	);
}
