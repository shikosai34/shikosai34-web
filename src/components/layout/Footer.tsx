import InstagramIcon from '../icons/InstagramIcon';
import NoteIcon from '../icons/NoteIcon';
import XLogoIcon from '../icons/XLogoIcon';
import FooterLinkColumn from './FooterLinkColumn';

interface Props {
	logoSrc: string;
	kosenLogoSrc: string;
}

const snsLinks = [
	{ label: 'X（Twitter）', href: 'https://x.com/', icon: <XLogoIcon className="h-4 w-4" /> },
	{ label: 'Instagram', href: 'https://instagram.com/', icon: <InstagramIcon className="h-4 w-4" /> },
	{ label: 'note', href: 'https://note.com/', icon: <NoteIcon className="h-4 w-4" /> },
];

const circleLinks = [
	{ label: '学年ごとに見る', href: '/circle?filter=grade' },
	{ label: '区分ごとにみる', href: '/circle?filter=category' },
	{ label: '種別ごとに見る', href: '/circle?filter=type' },
];

const eventLinks = [
	{ label: '1日目（10月24日）', href: '/timetable?day=1' },
	{ label: '2日目（10月25日）', href: '/timetable?day=2' },
];

const otherLinks = [
	{ label: 'スタッフ', href: '/staff' },
	{ label: 'アクセス', href: '/access' },
	{ label: 'プライバシーポリシー', href: '/privacy' },
	{ label: 'お問い合わせ', href: '/contact' },
];

export default function Footer({ logoSrc, kosenLogoSrc }: Props) {
	return (
		<footer
			className="mt-14 border-t border-accent/20 bg-base px-6 pb-8 pt-10"
			style={{ borderRadius: '50% 50% 0 0 / 80px 80px 0 0' }}
		>
			<div className="flex flex-col items-center">
				<img src={logoSrc} alt="茨香祭" className="h-16 w-56 object-contain" />
				<p className="mt-3 text-center text-xs text-text/60">
					© 2026 Shikousai Extention Committee All Rights Reserved.
				</p>
			</div>

			<div className="mt-8 grid grid-cols-2 gap-x-6 gap-y-8">
				<FooterLinkColumn heading="公式SNS" links={snsLinks} />
				<FooterLinkColumn heading="サークル" links={circleLinks} />
				<FooterLinkColumn heading="イベント" links={eventLinks} />
				<FooterLinkColumn heading="その他のページ" links={otherLinks} />
			</div>

			<div className="mt-10 border-t border-text/10 pt-6 text-xs leading-relaxed text-text/70">
				<img src={kosenLogoSrc} alt="茨城工業高等専門学校" className="h-15 w-auto" />
				<p className="mt-2">〒312-8508 茨城県ひたちなか市中根866</p>
				<p>TEL 029-272-5201</p>
			</div>
		</footer>
	);
}
