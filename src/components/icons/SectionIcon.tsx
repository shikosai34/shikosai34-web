import type { ReactNode } from 'react';

/*
 * セクション見出しの左に置く、題に合わせたアイコン。
 * 他のアイコン（MegaphoneIcon など）と同じく 24px 角・線 2 の線画にそろえる。
 * 見出しごとに 1 ファイル作ると数が多くなるため、名前で引く形にまとめた。
 */
const PATHS = {
	/** 茨香祭速報 */
	megaphone: (
		<>
			<path d="M3 10v4a1 1 0 0 0 1 1h2l4 5V4l-4 5H4a1 1 0 0 0-1 1Z" />
			<path d="M15 8a4 4 0 0 1 0 8" />
			<path d="M18 5a8 8 0 0 1 0 14" />
		</>
	),
	/** News */
	newspaper: (
		<>
			<path d="M4 22h16a2 2 0 0 0 2-2V4a2 2 0 0 0-2-2H8a2 2 0 0 0-2 2v16a2 2 0 0 1-2 2Zm0 0a2 2 0 0 1-2-2v-9c0-1.1.9-2 2-2h2" />
			<path d="M18 14h-8" />
			<path d="M15 18h-5" />
			<path d="M10 6h8v4h-8Z" />
		</>
	),
	/** Stage Events */
	mic: (
		<>
			<path d="M12 2a3 3 0 0 0-3 3v7a3 3 0 0 0 6 0V5a3 3 0 0 0-3-3Z" />
			<path d="M19 10v2a7 7 0 0 1-14 0v-2" />
			<path d="M12 19v3" />
		</>
	),
	/** Timetable */
	clock: (
		<>
			<circle cx="12" cy="12" r="10" />
			<path d="M12 6v6l4 2" />
		</>
	),
	/** Circle */
	users: (
		<>
			<path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2" />
			<circle cx="9" cy="7" r="4" />
			<path d="M22 21v-2a4 4 0 0 0-3-3.87" />
			<path d="M16 3.13a4 4 0 0 1 0 7.75" />
		</>
	),
	/** Visual */
	image: (
		<>
			<rect width="18" height="18" x="3" y="3" rx="2" />
			<circle cx="9" cy="9" r="2" />
			<path d="m21 15-3.086-3.086a2 2 0 0 0-2.828 0L6 21" />
		</>
	),
	/** バックナンバー（過去のポスターを重ねた形） */
	images: (
		<>
			<path d="M18 22H4a2 2 0 0 1-2-2V6" />
			<path d="m22 13-1.296-1.296a2.41 2.41 0 0 0-3.408 0L11 18" />
			<circle cx="12" cy="8" r="2" />
			<rect width="16" height="16" x="6" y="2" rx="2" />
		</>
	),
	/** Original Character */
	user: (
		<>
			<circle cx="12" cy="8" r="5" />
			<path d="M20 21a8 8 0 0 0-16 0" />
		</>
	),
	/** Decoration */
	sparkles: (
		<>
			<path d="M9.937 15.5A2 2 0 0 0 8.5 14.063l-6.135-1.582a.5.5 0 0 1 0-.962L8.5 9.936A2 2 0 0 0 9.937 8.5l1.582-6.135a.5.5 0 0 1 .963 0L14.063 8.5A2 2 0 0 0 15.5 9.937l6.135 1.581a.5.5 0 0 1 0 .964L15.5 14.063a2 2 0 0 0-1.437 1.437l-1.582 6.135a.5.5 0 0 1-.963 0Z" />
			<path d="M20 3v4" />
			<path d="M22 5h-4" />
			<path d="M4 17v2" />
			<path d="M5 18H3" />
		</>
	),
	/** Contact */
	mail: (
		<>
			<rect width="20" height="16" x="2" y="4" rx="2" />
			<path d="m22 7-8.97 5.7a1.94 1.94 0 0 1-2.06 0L2 7" />
		</>
	),
	/** Privacy Policy */
	shield: (
		<path d="M20 13c0 5-3.5 7.5-7.66 8.95a1 1 0 0 1-.67-.01C7.5 20.5 4 18 4 13V6a1 1 0 0 1 1-1c2 0 4.5-1.2 6.24-2.72a1.17 1.17 0 0 1 1.52 0C14.51 3.81 17 5 19 5a1 1 0 0 1 1 1Z" />
	),
	/** Access */
	pin: (
		<>
			<path d="M20 10c0 6-8 12-8 12s-8-6-8-12a8 8 0 0 1 16 0Z" />
			<circle cx="12" cy="10" r="3" />
		</>
	),
	/** FAQ */
	question: (
		<>
			<circle cx="12" cy="12" r="10" />
			<path d="M9.09 9a3 3 0 0 1 5.83 1c0 2-3 3-3 3" />
			<path d="M12 17h.01" />
		</>
	),
	/** About */
	info: (
		<>
			<circle cx="12" cy="12" r="10" />
			<path d="M12 16v-4" />
			<path d="M12 8h.01" />
		</>
	),
	/** Map */
	map: (
		<>
			<path d="M3 6l6-3 6 3 6-3v15l-6 3-6-3-6 3Z" />
			<path d="M9 3v15" />
			<path d="M15 6v15" />
		</>
	),
	/** Sponsor */
	handshake: (
		<>
			<path d="m11 17 2 2a1 1 0 1 0 3-3" />
			<path d="m14 14 2.5 2.5a1 1 0 1 0 3-3l-3.88-3.88a3 3 0 0 0-4.24 0l-.88.88a1 1 0 1 1-3-3l2.81-2.81a5.79 5.79 0 0 1 7.06-.87l.47.28a2 2 0 0 0 1.42.25L21 4" />
			<path d="m21 3 1 11h-2" />
			<path d="M3 3 2 14l6.5 6.5a1 1 0 1 0 3-3" />
			<path d="M3 4h8" />
		</>
	),
	/** Cautions */
	alert: (
		<>
			<path d="m21.73 18-8-14a2 2 0 0 0-3.48 0l-8 14A2 2 0 0 0 4 21h16a2 2 0 0 0 1.73-3Z" />
			<path d="M12 9v4" />
			<path d="M12 17h.01" />
		</>
	),
	/** Staff（名札） */
	badge: (
		<>
			<rect width="20" height="14" x="2" y="5" rx="2" />
			<circle cx="8" cy="11" r="2" />
			<path d="M5 16a3 3 0 0 1 6 0" />
			<path d="M14 10h5" />
			<path d="M14 14h4" />
		</>
	),
	/** Goods */
	bag: (
		<>
			<path d="M6 2 3 6v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2V6l-3-4Z" />
			<path d="M3 6h18" />
			<path d="M16 10a4 4 0 0 1-8 0" />
		</>
	),
} satisfies Record<string, ReactNode>;

export type SectionIconName = keyof typeof PATHS;

interface Props {
	name: SectionIconName;
	className?: string;
}

export default function SectionIcon({ name, className }: Props) {
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
			{PATHS[name]}
		</svg>
	);
}
