interface Props {
	className?: string;
}

export default function TikTokIcon({ className }: Props) {
	return (
		<svg viewBox="0 0 24 24" fill="currentColor" className={className} aria-hidden="true">
			<path d="M19.59 6.69a4.83 4.83 0 0 1-3.77-4.25V2h-3.31v13.67a2.9 2.9 0 0 1-2.9 2.9 2.9 2.9 0 1 1 2.9-2.9c0-.17-.02-.34-.05-.5V11.8a6.22 6.22 0 0 0-.95-.07 6.2 6.2 0 1 0 6.2 6.2V9.77a8.1 8.1 0 0 0 4.74 1.52V7.98a4.84 4.84 0 0 1-2.86-1.29Z" />
		</svg>
	);
}
