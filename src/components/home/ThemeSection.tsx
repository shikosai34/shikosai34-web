import ThemeTenet from './ThemeTenet';

const tenets = [
	{ character: '守', description: '受け継がれてきた伝統や型を大切に守る' },
	{ character: '破', description: '既存の枠にとらわれず、新たな発想で変化を生み出す' },
	{ character: '離', description: '学びを土台に、自分たちらしい独自の形へと昇華させる' },
];

function CrossMark({ className = '' }: { className?: string }) {
	return (
		<span className={`relative inline-block h-12 w-24 ${className}`} aria-hidden="true">
			<div className="absolute top-1/2 left-0 h-[0.02px] w-24 -translate-y-1/2 outline outline-1 outline-offset-[-0.50px] outline-text" />
			<div className="absolute top-0 left-4 h-12 w-0 outline outline-1 outline-offset-[-0.50px] outline-text" />
		</span>
	);
}

export default function ThemeSection() {
	return (
		<section className="mx-4 mt-8 rounded-2xl bg-base p-6 text-text">
			<div className="w-72 h-16 justify-start text-white text-3xl font-normal font-['Kiwi_Maru']">This year's theme</div>

			<div className="mt-6 flex flex-col items-start gap-2">
				<CrossMark />
				<h2 className="self-center text-6xl font-bold">守破離</h2>
				<CrossMark className="self-end rotate-180" />
			</div>

			<p className="text-sm leading-loose text-text">
				和を基調とした、新しさと挑戦を表現するテーマです。
			</p>

			<div className="mt-4 flex flex-col gap-1">
				{tenets.map((tenet) => (
					<ThemeTenet key={tenet.character} {...tenet} />
				))}
			</div>

			<p className="mt-4 text-sm leading-loose text-text">
				これまでの茨香祭の歴史と想いを受け継ぎながら、一人ひとりの個性が輝き、常識を超える新たな茨香祭を創り上げます！
			</p>
		</section>
	);
}
