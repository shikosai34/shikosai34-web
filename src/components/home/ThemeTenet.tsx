interface Props {
	character: string;
	description: string;
}

export default function ThemeTenet({ character, description }: Props) {
	return (
		<p className="text-sm leading-loose text-text">
			{character}：{description}
		</p>
	);
}
