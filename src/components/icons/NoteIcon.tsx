interface Props {
	className?: string;
}

export default function NoteIcon({ className }: Props) {
	return (
		<svg viewBox="0 0 24 24" fill="none" className={className} aria-hidden="true">
			<circle cx="12" cy="12" r="10" fill="currentColor" />
			<text x="12" y="16.5" fontSize="13" fontWeight="700" textAnchor="middle" fill="var(--color-base)">
				n
			</text>
		</svg>
	);
}
