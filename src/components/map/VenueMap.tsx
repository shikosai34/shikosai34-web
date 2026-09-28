import { lazy, Suspense, useCallback, useEffect, useMemo, useRef, useState } from 'react';
import CloseIcon from '../icons/CloseIcon';
import {
	countExhibitsByBuilding,
	loadPlan,
	PLAN_FILES,
	project,
	readViewFromUrl,
	readWeatherFromUrl,
	viewToSearch,
	type ExhibitsByRoom,
	type MapView,
	type Plan,
} from '../../lib/map';
import { isRoomInWeather, MAP_ROOMS, type Weather } from '../../lib/map-rooms';
import type { CameraRequest, CampusData } from './CampusScene';
import { RoomDetail } from './ExhibitPanel';
import FloorPlanView from './FloorPlanView';
import WeatherToggle from './WeatherToggle';

/*
 * 会場マップ（/map）の本体。client:only で読み込む。
 *
 * 全体は 3D のキャンパス。建物を押すとカメラが真上へ回り込み、フロア画面（2D）へ切り替わる。
 * 平面図のない会場（体育館・屋外テントなど）は、その場で出展の一覧を出す。
 * 表示中の建物・階・部屋は URL（?room= / ?building=&floor=）に反映し、そのまま共有できる。
 * 晴天時・雨天時で出展場所が変わるので、天候を切り替えられる（?weather=rainy）。
 *
 * WebGL が使えない環境では 3D を出さず、建物のボタンだけを並べる。
 */

const CampusScene = lazy(() => import('./CampusScene'));

interface Props {
	/** 天候ごとの「部屋キー → 出展」 */
	exhibits: Record<Weather, ExhibitsByRoom>;
	/** 最初に出す天候（?weather= があればそちらを優先） */
	defaultWeather: Weather;
}

const HOME_CAMERA: CameraRequest = { center: null };

function supportsWebGL(): boolean {
	try {
		const canvas = document.createElement('canvas');
		return !!(canvas.getContext('webgl2') ?? canvas.getContext('webgl'));
	} catch {
		return false;
	}
}

function useMediaQuery(query: string): boolean {
	const [matches, setMatches] = useState(() => window.matchMedia(query).matches);
	useEffect(() => {
		const mq = window.matchMedia(query);
		const update = () => setMatches(mq.matches);
		mq.addEventListener('change', update);
		return () => mq.removeEventListener('change', update);
	}, [query]);
	return matches;
}

/** 平面図のない会場（グラウンド・第二体育館など）。天候によって使うものが変わる */
const ALL_PLACES = MAP_ROOMS.filter((r) => !r.plan);

export default function VenueMap({ exhibits: exhibitsByWeather, defaultWeather }: Props) {
	const [weather, setWeather] = useState<Weather>(() => readWeatherFromUrl(location.search) ?? defaultWeather);
	const exhibits = exhibitsByWeather[weather];
	const PLACES = useMemo(() => ALL_PLACES.filter((p) => isRoomInWeather(p, weather)), [weather]);
	const reducedMotion = useMediaQuery('(prefers-reduced-motion: reduce)');
	const narrow = useMediaQuery('(max-width: 767px)');
	const [webgl] = useState(supportsWebGL);
	const lowPower = narrow || (navigator.hardwareConcurrency ?? 8) <= 4;

	const [campus, setCampus] = useState<CampusData | null>(null);
	const [loadError, setLoadError] = useState(false);
	const [view, setView] = useState<MapView>(() => readViewFromUrl(location.search));
	const [plan, setPlan] = useState<Plan | null>(null);
	/** 3D 上で選んでいる建物（フロア画面へ切り替える途中を含む） */
	const [selected, setSelected] = useState<string | null>(null);
	/** 一覧を出している平面図のない会場（部屋キー） */
	const [placeKey, setPlaceKey] = useState<string | null>(() => {
		const key = new URLSearchParams(location.search).get('room');
		return ALL_PLACES.some((p) => p.key === key) ? key : null;
	});
	const [camera, setCamera] = useState<CameraRequest>(HOME_CAMERA);

	const counts = useMemo(() => {
		const byBuilding = countExhibitsByBuilding(exhibits);
		for (const p of PLACES) byBuilding[p.key] = exhibits[p.key]?.length ?? 0;
		return byBuilding;
	}, [exhibits, PLACES]);

	useEffect(() => {
		if (!webgl) return;
		fetch('/map/campus.geojson')
			.then((res) => (res.ok ? res.json() : Promise.reject(res.status)))
			.then(setCampus)
			.catch(() => setLoadError(true));
	}, [webgl]);

	/** 最後に URL に書いた表示状態（天候を切り替えたときに書き直す） */
	const lastView = useRef<MapView>({ building: null });
	const writeUrl = useCallback(
		(next: MapView) => {
			lastView.current = next;
			history.replaceState(history.state, '', `${location.pathname}${viewToSearch(next, weather)}`);
		},
		[weather],
	);

	// 天候を切り替えたら URL を書き直し、下の配置一覧にも知らせる。一覧のタブからの切り替えも受ける
	useEffect(() => {
		history.replaceState(history.state, '', `${location.pathname}${viewToSearch(lastView.current, weather)}`);
		window.dispatchEvent(new CustomEvent('map:weather', { detail: weather }));
	}, [weather]);
	useEffect(() => {
		const onSet = (e: Event) => {
			const next = (e as CustomEvent<string>).detail;
			if (next === 'sunny' || next === 'rainy') setWeather(next);
		};
		window.addEventListener('map:set-weather', onSet);
		return () => window.removeEventListener('map:set-weather', onSet);
	}, []);

	/** 建物の中心（平面の [東, 北]） */
	const centerOf = useCallback(
		(name: string): [number, number] | null => {
			const f = campus?.features.find((f) => f.properties.kind === 'building' && f.properties.name === name);
			if (!f || f.geometry.type !== 'Polygon') return null;
			const ring = f.geometry.coordinates[0].slice(0, -1).map((c) => project(c));
			return [ring.reduce((a, p) => a + p[0], 0) / ring.length, ring.reduce((a, p) => a + p[1], 0) / ring.length];
		},
		[campus],
	);

	// URL で建物が指定されていれば、最初から平面図を開く
	useEffect(() => {
		if (!view.building) return;
		let cancelled = false;
		loadPlan(view.building)
			.then((p) => !cancelled && setPlan(p))
			.catch(() => !cancelled && setView({ building: null }));
		return () => {
			cancelled = true;
		};
	}, [view.building]);

	const openBuilding = (name: string) => {
		setPlaceKey(null);
		if (name in PLAN_FILES) {
			setSelected(name);
			loadPlan(name).catch(() => {}); // カメラが回り込むあいだに読み込んでおく
			const center = centerOf(name);
			const open = () => setView({ building: name });
			if (center && !reducedMotion) setCamera({ center, topDown: true, onDone: open });
			else open();
			return;
		}
		// 平面図のない建物は、その建物にある会場の一覧を出す
		const place = PLACES.find((p) => p.building === name);
		if (place) openPlace(place.key);
	};

	const openPlace = (key: string) => {
		const place = PLACES.find((p) => p.key === key);
		if (!place) return;
		setPlaceKey(key);
		setSelected(key);
		writeUrl({ building: null, room: key });
		const center = centerOf(place.building) ?? (place.at ? project(place.at) : null);
		if (center) setCamera({ center });
	};

	const closePlace = () => {
		setPlaceKey(null);
		setSelected(null);
		writeUrl({ building: null });
	};

	const closePlan = useCallback(() => {
		setView({ building: null });
		setPlan(null);
		setSelected(null);
		setCamera(HOME_CAMERA);
		writeUrl({ building: null });
	}, [writeUrl]);

	// キャンパスの読み込み後、URL で指定された会場があればカメラを寄せる
	useEffect(() => {
		if (!campus || !placeKey) return;
		openPlace(placeKey);
	}, [campus]); // eslint-disable-line react-hooks/exhaustive-deps

	// その天候で使わない会場を開いていたら閉じる
	useEffect(() => {
		if (placeKey && !PLACES.some((p) => p.key === placeKey)) closePlace();
	}, [PLACES]); // eslint-disable-line react-hooks/exhaustive-deps

	const place = PLACES.find((p) => p.key === placeKey);
	const planOpen = !!view.building && !!plan && plan.building === view.building;

	return (
		<div className="relative h-full w-full overflow-hidden bg-[#04141c]">
			{webgl && !loadError ? (
				campus ? (
					<Suspense fallback={<Loading />}>
						<CampusScene
							campus={campus}
							counts={counts}
							places={PLACES}
							selected={selected}
							camera={camera}
							animate={!reducedMotion}
							lowPower={lowPower}
							paused={planOpen}
							weather={weather}
							onPickBuilding={openBuilding}
							onPickPlace={openPlace}
							onBackgroundClick={() => placeKey && closePlace()}
						/>
					</Suspense>
				) : (
					<Loading />
				)
			) : (
				<p className="absolute inset-x-0 top-1/3 px-6 text-center text-sm text-text/70">
					この環境では 3D の地図を表示できません。下の建物から選んでください。
				</p>
			)}

			{/* 建物・会場のボタン。3D を操作しなくても（キーボードでも）選べるように常に出す */}
			{!planOpen && (
				<nav aria-label="建物から選ぶ" className="absolute inset-x-0 bottom-0 z-10 p-2 md:p-5">
					<ul className="flex gap-1.5 overflow-x-auto pb-1 md:flex-wrap">
						{[...Object.keys(PLAN_FILES), ...PLACES.map((p) => p.key)].map((id) => {
							const p = PLACES.find((p) => p.key === id);
							const label = p ? p.name : id;
							const count = counts[id] ?? 0;
							return (
								<li key={id} className="shrink-0">
									<button
										type="button"
										onClick={() => (p ? openPlace(p.key) : openBuilding(id))}
										className={`whitespace-nowrap rounded-md border bg-base/85 px-3 py-1.5 text-sm backdrop-blur-sm transition-colors ${
											selected === id ? 'border-main text-main' : 'border-accent/50 text-text hover:border-main hover:text-main'
										}`}
									>
										{label}
										{count > 0 && <span className="ml-1.5 text-main">{count}</span>}
									</button>
								</li>
							);
						})}
						<li className="shrink-0">
							<a
								href="#floor-guide"
								className="inline-block whitespace-nowrap rounded-md border border-text/30 bg-base/85 px-3 py-1.5 text-sm text-text/80 backdrop-blur-sm hover:border-main hover:text-main"
							>
								配置一覧 ↓
							</a>
						</li>
					</ul>
				</nav>
			)}

			{!planOpen && !place && (
				<div className="pointer-events-none absolute top-20 left-3 z-10 max-w-[calc(100%-1.5rem)] md:top-24 md:left-5">
					<p className="whitespace-nowrap text-2xl tracking-wide text-text drop-shadow-[0_0_8px_color-mix(in_srgb,var(--color-accent)_60%,transparent)] md:text-3xl">
						Map
						<span className="ml-2 align-middle text-xs tracking-[0.2em] text-accent">会場マップ</span>
					</p>
					{webgl && (
						<>
							<p className="mt-1 truncate text-xs text-text/70">建物を押すと中が見られます</p>
							<p className="truncate text-xs text-text/50">
								<span className="md:hidden">指でなぞって移動・2本指で回転</span>
								<span className="hidden md:inline">ドラッグで移動・右ドラッグで回転・ダブルクリックでそこへ寄る</span>
							</p>
						</>
					)}
					<WeatherToggle weather={weather} onChange={setWeather} className="pointer-events-auto mt-2" />
				</div>
			)}

			{/* 3D の視点の操作。ドラッグ・ピンチが難しいときや、見失ったときに全体へ戻れるように */}
			{webgl && campus && !planOpen && (
				<div className="absolute top-1/2 right-3 z-10 flex -translate-y-1/2 flex-col gap-1" role="group" aria-label="地図の視点">
					<CameraButton label="拡大" onClick={() => setCamera({ center: null, zoom: 'in' })}>
						＋
					</CameraButton>
					<CameraButton label="縮小" onClick={() => setCamera({ center: null, zoom: 'out' })}>
						－
					</CameraButton>
					<CameraButton label="全体を表示" onClick={() => setCamera({ center: null })}>
						⤢
					</CameraButton>
				</div>
			)}

			{place && !planOpen && (
				<div
					role="dialog"
					aria-label={place.name}
					className="absolute inset-x-2 top-20 z-20 max-h-[60%] overflow-y-auto rounded-lg border border-accent/40 bg-base/95 p-4 md:inset-x-auto md:top-24 md:right-5 md:w-[360px]"
				>
					<button type="button" onClick={closePlace} aria-label="閉じる" className="absolute top-3 right-3 text-text/70 hover:text-main">
						<CloseIcon className="h-5 w-5" />
					</button>
					<RoomDetail room={place} items={exhibits[place.key] ?? []} />
				</div>
			)}

			{planOpen && (
				<FloorPlanView
					key={plan.building}
					plan={plan}
					exhibits={exhibits}
					weather={weather}
					onWeatherChange={setWeather}
					initialFloor={view.floor}
					initialRoom={view.room}
					onClose={closePlan}
					onChange={(floor, room) => writeUrl({ building: plan.building, floor, room: room ?? undefined })}
				/>
			)}
		</div>
	);
}

function Loading() {
	return (
		<p className="absolute inset-0 flex items-center justify-center text-sm tracking-widest text-accent/80" role="status">
			地図を読み込んでいます…
		</p>
	);
}

function CameraButton({ label, onClick, children }: { label: string; onClick: () => void; children: string }) {
	return (
		<button
			type="button"
			aria-label={label}
			title={label}
			onClick={onClick}
			className="h-9 w-9 rounded-md border border-accent/50 bg-base/85 text-lg leading-none text-accent backdrop-blur-sm hover:border-main hover:text-main"
		>
			{children}
		</button>
	);
}
