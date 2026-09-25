import { CameraControls, Edges, Html, Line, Stars } from '@react-three/drei';
import { Canvas, useFrame, useThree, type ThreeEvent } from '@react-three/fiber';
import { Bloom, EffectComposer } from '@react-three/postprocessing';
import { useEffect, useMemo, useRef, useState } from 'react';
import * as THREE from 'three';
import { PLAN_FILES, project } from '../../lib/map';
import type { MapRoom } from '../../lib/map-rooms';

/*
 * 会場マップの 3D キャンパス。夜祭の「和風ネオン模型」として描く。
 * - 地面は濃紺に亀甲の格子。敷地・広場・トラックを面で分け、道は発光線でなぞる
 * - 建物は濃紺の箱をシアンの縁で光らせ、窓の帯を灯す。出展のある建物は橙に灯る
 * - 構内の道に提灯を吊り、屋外の会場には和傘のピンを立てる
 * 航空写真は使わない（昼の写真では夜の色調と馴染まないため）。
 */

// ---------------------------------------------------------------------------
// データ
// ---------------------------------------------------------------------------

type Ring = [number, number][];

export interface CampusFeature {
	type: 'Feature';
	properties: { kind: string; id?: string; name?: string | null; levels?: number };
	geometry: { type: 'Polygon'; coordinates: Ring[] } | { type: 'LineString'; coordinates: Ring };
}

export interface CampusData {
	type: 'FeatureCollection';
	features: CampusFeature[];
}

const FLOOR_HEIGHT = 3.6;
const COLOR = {
	base: '#0b3041',
	sky: '#04141c',
	text: '#e8e8e8',
	main: '#ff9933',
	accent: '#00ffcc',
	glitch: '#e7386f',
	pink: '#ff6ea8',
};

/** 既定の視点（全体を斜めに見下ろす） */
const HOME = { position: [40, 190, 250] as const, target: [10, 0, 10] as const };

/** 経緯度の輪 → 平面の輪（three の Shape 用に [東, 北]） */
const toPlane = (ring: Ring) => ring.map((c) => project(c));

function centroid(points: [number, number][]): [number, number] {
	const pts = points.slice(0, -1);
	const sum = pts.reduce((a, p) => [a[0] + p[0], a[1] + p[1]], [0, 0]);
	return [sum[0] / pts.length, sum[1] / pts.length];
}

function shapeOf(points: [number, number][]): THREE.Shape {
	const shape = new THREE.Shape();
	points.forEach(([x, y], i) => (i === 0 ? shape.moveTo(x, y) : shape.lineTo(x, y)));
	return shape;
}

// ---------------------------------------------------------------------------
// テクスチャ（手続き的に作る）
// ---------------------------------------------------------------------------

/** 亀甲の格子（global.css の --kikko-tile と同じ形を 2 倍で描く） */
function makeKikkoTexture(): THREE.Texture {
	const canvas = document.createElement('canvas');
	canvas.width = 192;
	canvas.height = 111;
	const ctx = canvas.getContext('2d')!;
	ctx.fillStyle = '#07222e';
	ctx.fillRect(0, 0, canvas.width, canvas.height);
	ctx.scale(4, 4);
	ctx.strokeStyle = 'rgba(0, 255, 204, 0.22)';
	ctx.lineWidth = 0.6;
	const paths = [
		[[16, 0], [8, 13.86], [-8, 13.86], [-16, 0]],
		[[16, 27.71], [8, 13.86]],
		[[64, 0], [56, 13.86], [40, 13.86], [32, 0]],
		[[64, 27.71], [56, 13.86]],
		[[40, 13.86], [32, 27.71], [16, 27.71]],
	];
	for (const path of paths) {
		ctx.beginPath();
		path.forEach(([x, y], i) => (i === 0 ? ctx.moveTo(x, y) : ctx.lineTo(x, y)));
		ctx.stroke();
	}
	const tex = new THREE.CanvasTexture(canvas);
	tex.wrapS = tex.wrapT = THREE.RepeatWrapping;
	tex.colorSpace = THREE.SRGBColorSpace;
	tex.anisotropy = 8;
	return tex;
}

/** 外壁の窓の帯（1 枚 = 横 3m × 1 フロア）。発光マップとして使う */
function makeWindowTexture(): THREE.Texture {
	const canvas = document.createElement('canvas');
	canvas.width = 64;
	canvas.height = 76;
	const ctx = canvas.getContext('2d')!;
	ctx.fillStyle = '#000';
	ctx.fillRect(0, 0, 64, 76);
	ctx.fillStyle = '#fff';
	ctx.fillRect(6, 22, 52, 30);
	ctx.fillStyle = '#000';
	ctx.fillRect(31, 22, 2, 30);
	const tex = new THREE.CanvasTexture(canvas);
	tex.wrapS = tex.wrapT = THREE.RepeatWrapping;
	// ExtrudeGeometry の側面 UV はメートル単位なので、1m → 1/タイル幅 に直す
	tex.repeat.set(1 / 3, 1 / FLOOR_HEIGHT);
	return tex;
}

// ---------------------------------------------------------------------------
// 地面
// ---------------------------------------------------------------------------

const GROUND_STYLE: Record<string, { fill: string; y: number; outline?: string }> = {
	campus: { fill: '#0b2f3e', y: 0.02, outline: COLOR.accent },
	park: { fill: '#0a3034', y: 0.03 },
	parking: { fill: '#0d2a38', y: 0.04 },
	plaza: { fill: '#113c4e', y: 0.05 },
	pitch: { fill: '#0c3a36', y: 0.06, outline: COLOR.accent },
	track: { fill: '#3a1530', y: 0.06, outline: COLOR.pink },
};

function Ground({ features }: { features: CampusFeature[] }) {
	const kikko = useMemo(() => {
		const tex = makeKikkoTexture();
		// 1 タイル = 12m × 6.9m
		tex.repeat.set(2000 / 12, 2000 / 6.93);
		return tex;
	}, []);

	const areas = useMemo(
		() =>
			features
				.filter((f) => f.geometry.type === 'Polygon' && f.properties.kind in GROUND_STYLE)
				.map((f, i) => {
					const ring = toPlane((f.geometry as { coordinates: Ring[] }).coordinates[0]);
					return { key: `${f.properties.kind}-${i}`, style: GROUND_STYLE[f.properties.kind], shape: shapeOf(ring), ring };
				}),
		[features],
	);

	const lines = useMemo(
		() =>
			features
				.filter((f) => f.geometry.type === 'LineString')
				.map((f, i) => ({
					key: `${f.properties.kind}-${i}`,
					kind: f.properties.kind,
					points: toPlane((f.geometry as { coordinates: Ring }).coordinates).map(([x, y]) => new THREE.Vector3(x, 0.12, -y)),
				})),
		[features],
	);

	return (
		<group>
			<mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, -0.05, 0]}>
				<planeGeometry args={[2000, 2000]} />
				<meshBasicMaterial map={kikko} />
			</mesh>
			{areas.map(({ key, style, shape, ring }) => (
				<group key={key}>
					<mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, style.y, 0]}>
						<shapeGeometry args={[shape]} />
						<meshBasicMaterial color={style.fill} transparent opacity={0.92} />
					</mesh>
					{style.outline && (
						<Line points={ring.map(([x, y]) => [x, style.y + 0.05, -y])} color={style.outline} lineWidth={1.5} transparent opacity={0.55} />
					)}
				</group>
			))}
			{lines.map(({ key, kind, points }) =>
				kind === 'path' ? (
					<Line key={key} points={points} color={COLOR.accent} lineWidth={2} transparent opacity={0.6} />
				) : (
					<Line key={key} points={points} color="#3f6f80" lineWidth={1.5} transparent opacity={0.7} />
				),
			)}
		</group>
	);
}

// ---------------------------------------------------------------------------
// 建物
// ---------------------------------------------------------------------------

export interface BuildingInfo {
	id: string;
	name: string | null;
	levels: number;
	shape: THREE.Shape;
	center: [number, number];
	height: number;
	/** 渡り廊下（2 階の高さに浮かせる） */
	bridge: boolean;
}

export function buildingsOf(features: CampusFeature[]): BuildingInfo[] {
	return features
		.filter((f) => f.properties.kind === 'building' && f.geometry.type === 'Polygon')
		.map((f) => {
			const ring = toPlane((f.geometry as { coordinates: Ring[] }).coordinates[0]);
			const name = f.properties.name ?? null;
			const bridge = !!name?.includes('渡り廊下');
			const levels = f.properties.levels ?? 1;
			return {
				id: f.properties.id ?? name ?? '',
				name,
				levels,
				shape: shapeOf(ring),
				center: centroid(ring),
				height: bridge ? (name?.startsWith('1階') ? 0.3 : 3) : Math.max(levels, 1) * FLOOR_HEIGHT,
				bridge,
			};
		});
}

interface BuildingProps {
	info: BuildingInfo;
	lit: boolean;
	selectable: boolean;
	hovered: boolean;
	selected: boolean;
	windows: THREE.Texture;
	onHover: (name: string | null) => void;
	onPick: (name: string) => void;
}

function Building({ info, lit, selectable, hovered, selected, windows, onHover, onPick }: BuildingProps) {
	const base = info.bridge ? (info.name?.startsWith('1階') ? 2.8 : FLOOR_HEIGHT) : 0;
	const materials = useMemo(() => {
		const roof = new THREE.MeshStandardMaterial({ color: '#0e2c39', roughness: 0.9 });
		const wall = new THREE.MeshStandardMaterial({
			color: '#10384a',
			roughness: 0.8,
			emissive: new THREE.Color(lit ? COLOR.main : '#2b8b93'),
			emissiveMap: info.bridge ? null : windows,
			emissiveIntensity: lit ? 2.2 : 0.6,
			toneMapped: !lit,
		});
		return [roof, wall];
	}, [lit, windows, info.bridge]);
	useEffect(() => () => materials.forEach((m) => m.dispose()), [materials]);

	const edgeColor = selected || hovered ? COLOR.main : lit ? '#ffc27a' : COLOR.accent;

	return (
		<mesh
			position={[0, base, 0]}
			rotation={[-Math.PI / 2, 0, 0]}
			material={materials}
			onPointerOver={
				selectable
					? (e: ThreeEvent<PointerEvent>) => {
							e.stopPropagation();
							onHover(info.name);
						}
					: undefined
			}
			onPointerOut={selectable ? () => onHover(null) : undefined}
			onClick={
				selectable
					? (e: ThreeEvent<MouseEvent>) => {
							e.stopPropagation();
							onPick(info.name!);
						}
					: undefined
			}
		>
			<extrudeGeometry args={[info.shape, { depth: info.height, bevelEnabled: false }]} />
			<Edges threshold={20} color={edgeColor} toneMapped={false} />
		</mesh>
	);
}

// ---------------------------------------------------------------------------
// 提灯・和傘
// ---------------------------------------------------------------------------

/** 構内の道に沿って提灯を吊る（一定間隔に置いた発光球をインスタンス描画） */
function Lanterns({ features, animate }: { features: CampusFeature[]; animate: boolean }) {
	const HEIGHT = 3.4;
	const SPACING = 7;
	const { positions, strings } = useMemo(() => {
		const positions: THREE.Vector3[] = [];
		const strings: THREE.Vector3[][] = [];
		for (const f of features) {
			if (f.properties.kind !== 'path' || f.geometry.type !== 'LineString') continue;
			const pts = toPlane(f.geometry.coordinates).map(([x, y]) => new THREE.Vector3(x, HEIGHT, -y));
			const curve = new THREE.CurvePath<THREE.Vector3>();
			for (let i = 0; i + 1 < pts.length; i++) curve.add(new THREE.LineCurve3(pts[i], pts[i + 1]));
			const length = curve.getLength();
			const n = Math.max(2, Math.floor(length / SPACING));
			const along = curve.getSpacedPoints(n);
			positions.push(...along);
			// 提灯のあいだで紐を少したるませる
			const string: THREE.Vector3[] = [];
			for (let i = 0; i + 1 < along.length; i++) {
				for (let t = 0; t < 1; t += 0.25) {
					const p = along[i].clone().lerp(along[i + 1], t);
					p.y += 0.5 - Math.sin(t * Math.PI) * 0.35;
					string.push(p);
				}
			}
			string.push(along.at(-1)!.clone().setY(HEIGHT + 0.5));
			strings.push(string);
		}
		return { positions, strings };
	}, [features]);

	const ref = useRef<THREE.InstancedMesh>(null);
	useEffect(() => {
		const mesh = ref.current;
		if (!mesh) return;
		const m = new THREE.Matrix4();
		const colors = [new THREE.Color(COLOR.main).multiplyScalar(2.4), new THREE.Color(COLOR.pink).multiplyScalar(2)];
		positions.forEach((p, i) => {
			m.compose(p, new THREE.Quaternion(), new THREE.Vector3(1, 1.35, 1));
			mesh.setMatrixAt(i, m);
			mesh.setColorAt(i, colors[i % 2]);
		});
		mesh.instanceMatrix.needsUpdate = true;
		if (mesh.instanceColor) mesh.instanceColor.needsUpdate = true;
	}, [positions]);

	// ゆっくり明滅させる（1 秒に 3 回を超える点滅はしない。周期は約 4 秒）
	useFrame(({ clock }) => {
		if (!animate || !ref.current) return;
		const mat = ref.current.material as THREE.MeshBasicMaterial;
		mat.opacity = 0.85 + Math.sin(clock.elapsedTime * 1.5) * 0.15;
	});

	return (
		<group>
			<instancedMesh ref={ref} args={[undefined, undefined, positions.length]}>
				<sphereGeometry args={[0.42, 12, 10]} />
				<meshBasicMaterial toneMapped={false} transparent />
			</instancedMesh>
			{strings.map((s, i) => (
				<Line key={i} points={s} color="#ffcf99" lineWidth={1} transparent opacity={0.35} />
			))}
		</group>
	);
}

/** 屋外の会場に立てる和傘のピン */
function WagasaPin({ position, active, animate, onPick }: { position: [number, number]; active: boolean; animate: boolean; onPick: () => void }) {
	const ref = useRef<THREE.Group>(null);
	useFrame((_, delta) => {
		if (animate && ref.current) ref.current.rotation.y += delta * 0.5;
	});
	return (
		<group
			position={[position[0], 0, -position[1]]}
			onClick={(e) => {
				e.stopPropagation();
				onPick();
			}}
		>
			<mesh position={[0, 3.5, 0]}>
				<cylinderGeometry args={[0.1, 0.1, 7, 6]} />
				<meshBasicMaterial color="#ffcf99" />
			</mesh>
			<group ref={ref} position={[0, 7.4, 0]}>
				<mesh>
					<coneGeometry args={[3.4, 1.5, 16, 1, true]} />
					<meshStandardMaterial
						color={COLOR.glitch}
						emissive={active ? COLOR.main : COLOR.glitch}
						emissiveIntensity={active ? 2 : 1.3}
						side={THREE.DoubleSide}
						toneMapped={false}
					/>
					<Edges threshold={1} color={COLOR.accent} toneMapped={false} />
				</mesh>
			</group>
		</group>
	);
}

// ---------------------------------------------------------------------------
// カメラ
// ---------------------------------------------------------------------------

export interface CameraRequest {
	/** 見る先（平面の [東, 北]）。null なら既定の視点に戻る */
	center: [number, number] | null;
	/** 真上から見下ろす（フロア画面へ切り替える前） */
	topDown?: boolean;
	/** 動き終わったら呼ぶ */
	onDone?: () => void;
}

function CameraRig({ request, animate }: { request: CameraRequest; animate: boolean }) {
	const ref = useRef<CameraControls>(null);
	// 縦長の画面では横の視野が狭くなるので、全体を見る視点を引いて敷地が収まるようにする
	const aspect = useThree((s) => s.size.width / s.size.height);
	const pullBack = aspect < 1.2 ? Math.min(2.4, 1.2 / aspect) : 1;
	useEffect(() => {
		const controls = ref.current;
		if (!controls) return;
		const { center, topDown, onDone } = request;
		const move = center
			? topDown
				? controls.setLookAt(center[0], 150, -center[1] + 0.1, center[0], 0, -center[1], animate)
				: controls.setLookAt(center[0] + 55, 70, -center[1] + 75, center[0], 5, -center[1], animate)
			: controls.setLookAt(
					...(HOME.position.map((v, i) => HOME.target[i] + (v - HOME.target[i]) * pullBack) as [number, number, number]),
					...HOME.target,
					animate,
				);
		let cancelled = false;
		move.then(() => !cancelled && onDone?.());
		return () => {
			cancelled = true;
		};
	}, [request, animate]); // eslint-disable-line react-hooks/exhaustive-deps -- 画面の縦横比が変わるたびに視点を戻さない

	return (
		<CameraControls
			ref={ref}
			makeDefault
			minDistance={25}
			maxDistance={900}
			maxPolarAngle={Math.PI * 0.42}
			smoothTime={0.5}
			dollyToCursor
		/>
	);
}

// ---------------------------------------------------------------------------
// 全体
// ---------------------------------------------------------------------------

interface Props {
	campus: CampusData;
	/** 建物名・屋外の会場の部屋キー → 出展数 */
	counts: Record<string, number>;
	/** 屋外の会場（ピンを立てる） */
	places: MapRoom[];
	selected: string | null;
	camera: CameraRequest;
	animate: boolean;
	/** 光のにじみ（Bloom）を切る・解像度を抑える */
	lowPower: boolean;
	/** フロア画面を上に重ねているあいだは描画を止める */
	paused: boolean;
	onPickBuilding: (name: string) => void;
	onPickPlace: (key: string) => void;
	onBackgroundClick: () => void;
}

export default function CampusScene({ campus, counts, places, selected, camera, animate, lowPower, paused, onPickBuilding, onPickPlace, onBackgroundClick }: Props) {
	const buildings = useMemo(() => buildingsOf(campus.features), [campus]);
	const windows = useMemo(() => makeWindowTexture(), []);
	const [hovered, setHovered] = useState<string | null>(null);

	useEffect(() => {
		document.body.style.cursor = hovered ? 'pointer' : '';
		return () => {
			document.body.style.cursor = '';
		};
	}, [hovered]);

	/** 押せる建物（平面図があるか、屋外の会場を含む建物） */
	const selectable = (name: string | null) => !!name && (name in PLAN_FILES || places.some((p) => p.building === name));

	return (
		<Canvas
			dpr={lowPower ? [1, 1.5] : [1, 2]}
			frameloop={paused ? 'never' : 'always'}
			camera={{ position: [...HOME.position], fov: 40, near: 1, far: 3000 }}
			gl={{ antialias: !lowPower }}
			onPointerMissed={onBackgroundClick}
			aria-hidden="true"
		>
			<color attach="background" args={[COLOR.sky]} />
			<fog attach="fog" args={[COLOR.sky, 320, 900]} />
			<Stars radius={700} depth={120} count={lowPower ? 800 : 2000} factor={5} fade speed={animate ? 0.4 : 0} />
			<ambientLight intensity={0.5} color="#6fa6c0" />
			<hemisphereLight args={['#2a5f7a', '#0b1a22', 0.8]} />
			{/* 月明かり */}
			<directionalLight position={[-120, 220, 80]} intensity={1.1} color="#b9d4ff" />

			<Ground features={campus.features} />

			{buildings.map((b) => (
				<Building
					key={b.id}
					info={b}
					lit={!!b.name && (counts[b.name] ?? 0) > 0}
					selectable={selectable(b.name)}
					hovered={!!b.name && hovered === b.name}
					selected={!!b.name && selected === b.name}
					windows={windows}
					onHover={setHovered}
					onPick={onPickBuilding}
				/>
			))}

			<Lanterns features={campus.features} animate={animate} />

			{places
				.filter((p) => p.at && !buildings.some((b) => b.name === p.building))
				.map((p) => (
					<WagasaPin key={p.key} position={project(p.at!)} active={selected === p.key} animate={animate} onPick={() => onPickPlace(p.key)} />
				))}

			{/* 建物名 */}
			{buildings
				.filter((b) => b.name && !b.bridge)
				.map((b) => {
					const count = counts[b.name!] ?? 0;
					const major = selectable(b.name);
					return (
						<Html key={`label-${b.id}`} position={[b.center[0], b.height + 2, -b.center[1]]} center zIndexRange={[10, 0]} style={{ pointerEvents: 'none' }}>
							<div
								className={`whitespace-nowrap rounded-sm border px-1.5 py-0.5 ${
									major ? 'border-accent/70 bg-base/85 text-sm text-text' : 'border-transparent bg-base/50 text-xs text-text/60'
								}`}
							>
								{b.name}
								{count > 0 && <span className="ml-1 text-main">●{count}</span>}
							</div>
						</Html>
					);
				})}
			{places
				.filter((p) => p.at && !buildings.some((b) => b.name === p.building))
				.map((p) => {
					const [x, y] = project(p.at!);
					const count = counts[p.key] ?? 0;
					return (
						<Html key={`label-${p.key}`} position={[x, 10, -y]} center zIndexRange={[10, 0]} style={{ pointerEvents: 'none' }}>
							<div className="whitespace-nowrap rounded-sm border border-glow-pink/70 bg-base/85 px-1.5 py-0.5 text-sm text-text">
								{p.name}
								{count > 0 && <span className="ml-1 text-main">●{count}</span>}
							</div>
						</Html>
					);
				})}

			<CameraRig request={camera} animate={animate} />

			{!lowPower && (
				<EffectComposer>
					<Bloom mipmapBlur intensity={0.9} luminanceThreshold={0.75} luminanceSmoothing={0.2} />
				</EffectComposer>
			)}
		</Canvas>
	);
}
