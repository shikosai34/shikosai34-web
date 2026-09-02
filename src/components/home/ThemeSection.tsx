

function CrossMark({ className = '' }: { className?: string }) {
	return (
		<span className={`relative inline-block h-6 w-36 overflow-visible ${className}`} aria-hidden="true">
			<div className="absolute top-3 left-0 h-[1px] w-36 bg-text" />
			<div className="absolute top-0 left-2 h-16 w-[1px] bg-text" />
		</span>
	);
}

export default function ThemeSection() {
	return (
		<section className="mx-4 mt-8 rounded-2xl bg-base p-6 text-text">
			<div className="w-72 justify-start font-primary text-3xl font-normal text-white">This year's theme</div>

			<div className="mt-2 flex flex-col items-start gap-2">
				<CrossMark />
				<h2 className="self-center text-6xl font-bold">守破離</h2>
				<CrossMark className="self-end rotate-180" />
			</div>

			<div className="mt-4 font-primary text-xs font-normal leading-[17px] text-white">
				和を基調とした、新しさと挑戦を表現するテーマです。
				<br />
				<br />
				守：受け継がれてきた伝統や型を大切に守る
				<br />
				破：既存の枠にとらわれず、新たな発想で変化を生み出す
				<br />
				離：学びを土台に、自分たちらしい独自の形へと昇華させる
				<br />
				<br />
				これまでの茨香祭の歴史と想いを受け継ぎながら、一人ひとりの個性が輝き、常識を越える新たな茨香祭を創り上げます！
			</div>
		</section>
	);
}
