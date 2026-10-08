import InstagramIcon from '../icons/InstagramIcon';
import XLogoIcon from '../icons/XLogoIcon';
import FooterLinkColumn from './FooterLinkColumn';

interface Props {
	logoSrc: string;
	kosenLogoSrc: string;
}

const snsLinks = [
	{ label: 'X（公式）', href: 'https://x.com/Shikosai34', icon: <XLogoIcon className="h-4 w-4" /> },
	{ label: 'Instagram（公式）', href: 'https://www.instagram.com/shikosai34/', icon: <InstagramIcon className="h-4 w-4" /> },
	{ label: 'Instagram（情報部）', href: 'https://www.instagram.com/shikosai34_tech/', icon: <InstagramIcon className="h-4 w-4" /> },
];

const eventLinks = [
	{ label: '1日目（10月24日）', href: '/timetable#day-1' },
	{ label: '2日目（10月25日）', href: '/timetable#day-2' },
	{ label: 'サークル一覧（学年ごと）', href: '/circle?filter=grade' },
	{ label: 'サークル一覧（区分ごと）', href: '/circle?filter=category' },
	{ label: 'サークル一覧（種別ごと）', href: '/circle?filter=type' },
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
			{/* モバイルは全幅、PC は本文（max-w-3xl）と同じ幅で中央に寄せる */}
			<div className="mx-auto w-full max-w-3xl">
				<div className="flex flex-col items-center">
					<img src={logoSrc} alt="茨香祭" className="h-16 w-56 object-contain" />
					<p className="mt-3 text-center text-xs text-text/60">
						© 2026 Shikousai Executive Committee All Rights Reserved.
					</p>
				</div>
	
				<div className="mt-8 grid grid-cols-2 gap-x-6 gap-y-8 md:flex md:flex-wrap md:justify-center md:gap-x-16">
					<FooterLinkColumn heading="公式SNS" links={snsLinks} />
					<FooterLinkColumn heading="イベント" links={eventLinks} />
					<FooterLinkColumn heading="その他のページ" links={otherLinks} />
				</div>
	
				<div className="mt-10 border-t border-text/10 pt-6 text-xs leading-relaxed text-text/70 md:flex md:flex-col md:items-center md:text-center">
					<img src={kosenLogoSrc} alt="茨城工業高等専門学校" className="h-15 w-auto" />
					<p className="mt-2">〒312-8508 茨城県ひたちなか市中根866</p>
					<p>TEL 029-272-5201</p>
				</div>
			</div>
		</footer>
	);
}
