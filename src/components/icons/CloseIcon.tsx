interface Props {
	className?: string;
}

export default function CloseIcon({ className }: Props) {
	return (
		<svg
			viewBox="0 0 24 24"
			fill="none"
			stroke="currentColor"
			strokeWidth={2}
			strokeLinecap="round"
			className={className}
			aria-hidden="true"
		>
			<line x1="5" y1="5" x2="19" y2="19" />
			<line x1="19" y1="5" x2="5" y2="19" />
		</svg>
	);
}
