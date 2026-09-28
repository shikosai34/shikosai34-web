import { WEATHER_LABELS, WEATHERS, type Weather } from '../../lib/map-rooms';

/*
 * 晴天時・雨天時の配置の切り替え。出展場所が天候で変わるため、地図の見出しの下とフロア画面の見出しに置く。
 */

interface Props {
	weather: Weather;
	onChange: (weather: Weather) => void;
	className?: string;
}

export default function WeatherToggle({ weather, onChange, className = '' }: Props) {
	return (
		<div role="radiogroup" aria-label="天候" className={`inline-flex shrink-0 overflow-hidden rounded-md border border-accent/50 bg-base/85 backdrop-blur-sm ${className}`}>
			{WEATHERS.map((w) => (
				<button
					key={w}
					type="button"
					role="radio"
					aria-checked={weather === w}
					onClick={() => onChange(w)}
					className={`whitespace-nowrap px-3 py-1 text-xs transition-colors ${weather === w ? 'bg-accent text-base' : 'text-text hover:text-main'}`}
				>
					{WEATHER_LABELS[w]}
				</button>
			))}
		</div>
	);
}
