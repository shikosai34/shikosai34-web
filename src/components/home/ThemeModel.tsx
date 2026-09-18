import { Float, PresentationControls, useGLTF } from '@react-three/drei';
import { Canvas, useFrame, useThree } from '@react-three/fiber';
import { Component, Suspense, useEffect, useMemo, useRef, useState, type ReactNode } from 'react';
import * as THREE from 'three';
import { SVGLoader } from 'three/examples/jsm/loaders/SVGLoader.js';
import shuhariSvg from '../../assets/theme/shuhari.svg?raw';

/*
 * 「This year's theme」セクションのロゴ部分に埋め込む 3D モデル。
 * 参考: https://2026.marugotosai.jp/ （React Three Fiber + GLB モデルをゆっくり回転させる構成）
 *
 * - 既定ではテーマロゴ「守破離」の SVG を押し出した 3D オブジェクトを表示する。
 * - modelSrc を渡すと public/ 配下の GLB（例: /models/theme.glb）を代わりに読み込む。
 * - ドラッグで回転、放置で自動回転。prefers-reduced-motion 時は動かさない。
 * - 親要素いっぱいに描画するので、置き場所の高さは呼び出し側（ThemeSection）で決める。
 */

interface Props {
	/** 表示する GLB モデルの URL（public/ 起点）。未指定なら「守破離」の押し出しモデル */
	modelSrc?: string;
	/** 回転時も含めてモデルが描画領域に占める割合。0〜1（Float の揺れ分の余白を残す） */
	fill?: number;
}

/* docs/design/03-design.md 3.2 のパレット */
const COLOR_TEXT = '#e8e8e8';
const COLOR_MAIN = '#ff9933';
const COLOR_ACCENT = '#00ffcc';

function usePrefersReducedMotion() {
	const [reduced, setReduced] = useState(false);
	useEffect(() => {
		const mq = window.matchMedia('(prefers-reduced-motion: reduce)');
		const update = () => setReduced(mq.matches);
		update();
		mq.addEventListener('change', update);
		return () => mq.removeEventListener('change', update);
	}, []);
	return reduced;
}

/** 子要素を Y 軸まわりにゆっくり自動回転させる */
function Spinner({ children, enabled, speed = 0.35 }: { children: ReactNode; enabled: boolean; speed?: number }) {
	const ref = useRef<THREE.Group>(null);
	useFrame((_, delta) => {
		if (enabled && ref.current) ref.current.rotation.y += speed * delta;
	});
	return <group ref={ref}>{children}</group>;
}

/**
 * 子要素を「Y 軸で一回転させても描画領域からはみ出さない」大きさにスケーリングし、原点に中央寄せする。
 * 単に正面向きの幅で合わせると、回転して角が手前に来たときに遠近で拡大されて見切れるため、
 * 回転の軌跡（XZ 平面の外接円）と上下端がカメラの視錐台に収まる条件で最大スケールを求める。
 * size はモデルのローカル座標系での寸法、center はモデルの中心、fill は余白のための比率（0〜1）。
 */
function FitToViewport({
	children,
	size,
	center,
	fill,
}: {
	children: ReactNode;
	size: THREE.Vector3;
	center: THREE.Vector3;
	fill: number;
}) {
	const camera = useThree((state) => state.camera as THREE.PerspectiveCamera);
	const aspect = useThree((state) => state.viewport.aspect);

	const scale = useMemo(() => {
		const distance = camera.position.length(); // カメラは原点を向いている
		const tanV = Math.tan(THREE.MathUtils.degToRad(camera.fov) / 2);
		const tanH = tanV * aspect;
		const radius = Math.hypot(size.x, size.z) / 2; // 回転時に中心から最も遠くなる角までの距離
		const halfHeight = size.y / 2;
		// 横: 外接円が左右の視野面に接する条件 radius * s <= distance * sin(hfov / 2)
		const byWidth = (distance * tanH) / Math.sqrt(1 + tanH * tanH) / radius;
		// 縦: 角が一番手前（distance - radius）に来たときに上下端が収まる条件
		const byHeight = (distance * tanV) / (halfHeight + tanV * radius);
		return Math.min(byWidth, byHeight) * fill;
	}, [camera, aspect, size]);

	return (
		<group scale={scale}>
			<group position={[-center.x, -center.y, -center.z]}>{children}</group>
		</group>
	);
}

/** テーマロゴ「守破離」の SVG を押し出した 3D オブジェクト */
function ShuhariModel({ fill }: { fill: number }) {
	const { geometry, size, center } = useMemo(() => {
		// fill="currentColor" は SVGLoader が色として解釈できず警告を出すので外す（色はマテリアルで決める）
		const data = new SVGLoader().parse(shuhariSvg.replace(/fill="currentColor"/g, ''));
		const shapes = data.paths.flatMap((path) => {
			// svg 要素の style から継承されるが、確実に偶奇規則で穴を抜くため明示する
			const userData = (path.userData ??= {}) as { style?: Record<string, unknown> };
			userData.style = { ...userData.style, fillRule: 'evenodd' };
			return path.toShapes();
		});
		const geometry = new THREE.ExtrudeGeometry(shapes, {
			depth: 60,
			bevelEnabled: false,
			curveSegments: 6,
		});
		// SVG は y 軸が下向きなので X 軸まわりに 180° 回して正立させる（鏡像にはならない）
		geometry.rotateX(Math.PI);
		geometry.computeBoundingBox();
		const box = geometry.boundingBox!;
		const size = new THREE.Vector3();
		const center = new THREE.Vector3();
		box.getSize(size);
		box.getCenter(center);
		return { geometry, size, center };
	}, []);

	useEffect(() => () => geometry.dispose(), [geometry]);

	return (
		<FitToViewport size={size} center={center} fill={fill}>
			<mesh geometry={geometry}>
				{/* ExtrudeGeometry のグループ: 0 = 表裏の面, 1 = 側面 */}
				<meshStandardMaterial attach="material-0" color={COLOR_TEXT} roughness={0.55} metalness={0.15} />
				<meshStandardMaterial
					attach="material-1"
					color={COLOR_MAIN}
					emissive={COLOR_MAIN}
					emissiveIntensity={0.35}
					roughness={0.4}
					metalness={0.2}
				/>
			</mesh>
		</FitToViewport>
	);
}

/** GLB モデル */
function GltfModel({ src, fill }: { src: string; fill: number }) {
	const { scene } = useGLTF(src);
	const { size, center } = useMemo(() => {
		const box = new THREE.Box3().setFromObject(scene);
		const size = new THREE.Vector3();
		const center = new THREE.Vector3();
		box.getSize(size);
		box.getCenter(center);
		return { size, center };
	}, [scene]);

	return (
		<FitToViewport size={size} center={center} fill={fill}>
			<primitive object={scene} />
		</FitToViewport>
	);
}

function Scene({ modelSrc, fill }: Required<Props>) {
	const reducedMotion = usePrefersReducedMotion();

	return (
		<>
			<ambientLight intensity={0.6} />
			<directionalLight position={[3, 5, 6]} intensity={2.2} />
			{/* 和風×サイバーパンク: 左からミント、右からオレンジのリムライト */}
			<pointLight position={[-4, 1.5, 2]} intensity={24} color={COLOR_ACCENT} />
			<pointLight position={[4, -1.5, 3]} intensity={12} color={COLOR_MAIN} />

			<PresentationControls
				global={false}
				cursor
				speed={1.4}
				polar={[-Math.PI / 6, Math.PI / 6]}
				azimuth={[-Infinity, Infinity]}
				damping={0.2}
			>
				<Float enabled={!reducedMotion} speed={1.2} rotationIntensity={0.25} floatIntensity={0.6}>
					<Spinner enabled={!reducedMotion}>
						<Suspense fallback={null}>
							{modelSrc ? <GltfModel src={modelSrc} fill={fill} /> : <ShuhariModel fill={fill} />}
						</Suspense>
					</Spinner>
				</Float>
			</PresentationControls>
		</>
	);
}

/** WebGL 非対応環境などで Canvas が例外を投げた場合の受け皿 */
class CanvasErrorBoundary extends Component<{ fallback: ReactNode; children: ReactNode }, { failed: boolean }> {
	state = { failed: false };

	static getDerivedStateFromError() {
		return { failed: true };
	}

	render() {
		return this.state.failed ? this.props.fallback : this.props.children;
	}
}

export default function ThemeModel({ modelSrc = '', fill = 0.9 }: Props) {
	return (
		<CanvasErrorBoundary fallback={<StaticFallback />}>
			<Canvas
				className="h-full w-full"
				dpr={[1, 1.5]}
				camera={{ position: [0, 0.2, 7], fov: 35 }}
				gl={{ antialias: true, alpha: true, powerPreference: 'low-power' }}
				onCreated={({ gl }) => {
					// R3F は canvas に touch-action: none を設定するが、
					// それだとスマホでモデル上から縦スクロールできなくなるので縦方向は通す
					gl.domElement.style.touchAction = 'pan-y';
				}}
			>
				<Scene modelSrc={modelSrc} fill={fill} />
			</Canvas>
		</CanvasErrorBoundary>
	);
}

/** 3D が描けないときは SVG をそのまま表示する */
function StaticFallback() {
	return (
		<div
			className="flex h-full w-full items-center justify-center p-4 text-text"
			dangerouslySetInnerHTML={{ __html: shuhariSvg }}
			aria-hidden="true"
		/>
	);
}
