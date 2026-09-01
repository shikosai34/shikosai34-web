interface Props {
	className?: string;
}

export default function MegaphoneIcon({ className }: Props) {
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
			<path d="M3 10v4a1 1 0 0 0 1 1h2l4 5V4l-4 5H4a1 1 0 0 0-1 1Z" />
			<path d="M15 8a4 4 0 0 1 0 8" />
			<path d="M18 5a8 8 0 0 1 0 14" />
		</svg>
	);
}
