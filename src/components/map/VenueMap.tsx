import { lazy, Suspense, useCallback, useEffect, useMemo, useState } from 'react';
import CloseIcon from '../icons/CloseIcon';
import {
	countExhibitsByBuilding,
	loadPlan,
	PLAN_FILES,
	project,
	readViewFromUrl,
	viewToSearch,
	type ExhibitsByRoom,
	type MapView,
	type Plan,
} from '../../lib/map';
import { MAP_ROOMS } from '../../lib/map-rooms';
import type { CameraRequest, CampusData } from './CampusScene';
import { RoomDetail } from './ExhibitPanel';
import FloorPlanView from './FloorPlanView';

/*
 * 会場マップ（/map）の本体。client:only で読み込む。
 *
 * 全体は 3D のキャンパス。建物を押すとカメラが真上へ回り込み、フロア画面（2D）へ切り替わる。
 * 平面図のない会場（体育館・屋外テントなど）は、その場で出展の一覧を出す。
 * 表示中の建物・階・部屋は URL（?room= / ?building=&floor=）に反映し、そのまま共有できる。
 *
 * WebGL が使えない環境では 3D を出さず、建物のボタンだけを並べる。
 */

const CampusScene = lazy(() => import('./CampusScene'));

interface Props {
	exhibits: ExhibitsByRoom;
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

/** 平面図のない会場（屋外テント・体育館ステージなど） */
const PLACES = MAP_ROOMS.filter((r) => !r.plan);

export default function VenueMap({ exhibits }: Props) {
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
		return PLACES.some((p) => p.key === key) ? key : null;
	});
	const [camera, setCamera] = useState<CameraRequest>(HOME_CAMERA);

	const counts = useMemo(() => {
		const byBuilding = countExhibitsByBuilding(exhibits);
		for (const p of PLACES) byBuilding[p.key] = exhibits[p.key]?.length ?? 0;
		return byBuilding;
	}, [exhibits]);

	useEffect(() => {
		if (!webgl) return;
		fetch('/map/campus.geojson')
			.then((res) => (res.ok ? res.json() : Promise.reject(res.status)))
			.then(setCampus)
			.catch(() => setLoadError(true));
	}, [webgl]);

	const writeUrl = useCallback((next: MapView) => {
		history.replaceState(history.state, '', `${location.pathname}${viewToSearch(next)}`);
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
				<nav aria-label="建物から選ぶ" className="absolute inset-x-0 bottom-0 z-10 p-2 md:p-3">
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
										className={`rounded-md border bg-base/85 px-3 py-1.5 text-sm backdrop-blur-sm transition-colors ${
											selected === id ? 'border-main text-main' : 'border-accent/50 text-text hover:border-main hover:text-main'
										}`}
									>
										{label}
										{count > 0 && <span className="ml-1.5 text-main">{count}</span>}
									</button>
								</li>
							);
						})}
					</ul>
				</nav>
			)}

			{!planOpen && !place && webgl && (
				<p className="pointer-events-none absolute top-3 left-3 z-10 rounded-sm bg-base/70 px-2 py-1 text-xs text-text/70">
					ドラッグで回転・ピンチで拡大。建物を押すと中が見られます。
				</p>
			)}

			{place && !planOpen && (
				<div
					role="dialog"
					aria-label={place.name}
					className="absolute inset-x-2 top-2 z-20 max-h-[65%] overflow-y-auto rounded-lg border border-accent/40 bg-base/95 p-4 md:inset-x-auto md:top-3 md:right-3 md:w-[340px]"
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
