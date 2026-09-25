import { useCallback, useEffect, useRef, useState, type MouseEvent, type PointerEvent } from 'react';

/*
 * SVG の viewBox を動かして、図面を拡大・移動できるようにする。
 * - ホイール: カーソルの位置を中心に拡大・縮小
 * - ドラッグ: 移動（5px 以上動いたらドラッグとみなし、直後のクリックを捨てる）
 * - 2 本指: ピンチで拡大・縮小
 */

type Box = [number, number, number, number];

const MIN_ZOOM = 1;
const MAX_ZOOM = 5;
const DRAG_THRESHOLD = 5;

interface State {
	/** 拡大率 */
	k: number;
	/** 表示の中心（SVG 座標） */
	cx: number;
	cy: number;
}

export function usePanZoom(base: Box, resetKey: unknown) {
	const initial = useCallback((): State => ({ k: 1, cx: base[0] + base[2] / 2, cy: base[1] + base[3] / 2 }), [base]);
	const [state, setState] = useState<State>(initial);
	const ref = useRef<HTMLDivElement>(null);
	const pointers = useRef(new Map<number, { x: number; y: number }>());
	const dragged = useRef(false);
	const start = useRef<{ x: number; y: number; dist: number; state: State } | null>(null);

	useEffect(() => setState(initial()), [resetKey]); // eslint-disable-line react-hooks/exhaustive-deps

	/** 画面の 1px が SVG の何単位か（preserveAspectRatio="meet" なので縦横の大きいほう） */
	const unitsPerPx = (s: State) => {
		const el = ref.current;
		if (!el) return 1;
		return Math.max(base[2] / s.k / el.clientWidth, base[3] / s.k / el.clientHeight);
	};

	const clamp = useCallback(
		(s: State): State => {
			const k = Math.min(MAX_ZOOM, Math.max(MIN_ZOOM, s.k));
			// 図面の外へ行き過ぎないよう、中心を元の範囲に収める
			const cx = Math.min(base[0] + base[2], Math.max(base[0], s.cx));
			const cy = Math.min(base[1] + base[3], Math.max(base[1], s.cy));
			return k === 1 ? { k, cx: base[0] + base[2] / 2, cy: base[1] + base[3] / 2 } : { k, cx, cy };
		},
		[base],
	);

	/** 画面上の点 (px, py) を動かさずに拡大率を factor 倍する */
	const zoomAt = useCallback(
		(s: State, factor: number, px?: number, py?: number): State => {
			const el = ref.current;
			const next = clamp({ ...s, k: s.k * factor });
			if (!el || px === undefined || py === undefined) return next;
			const rect = el.getBoundingClientRect();
			const dx = px - rect.left - rect.width / 2;
			const dy = py - rect.top - rect.height / 2;
			const before = unitsPerPx(s);
			const after = unitsPerPx(next);
			return clamp({ ...next, cx: s.cx + dx * (before - after), cy: s.cy + dy * (before - after) });
		},
		[clamp], // eslint-disable-line react-hooks/exhaustive-deps
	);

	// ホイールはページのスクロールを止めたいので passive: false で登録する
	useEffect(() => {
		const el = ref.current;
		if (!el) return;
		const onWheel = (e: WheelEvent) => {
			e.preventDefault();
			setState((s) => zoomAt(s, Math.exp(-e.deltaY * 0.0015), e.clientX, e.clientY));
		};
		el.addEventListener('wheel', onWheel, { passive: false });
		return () => el.removeEventListener('wheel', onWheel);
	}, [zoomAt]);

	const distance = () => {
		const [a, b] = [...pointers.current.values()];
		return a && b ? Math.hypot(a.x - b.x, a.y - b.y) : 0;
	};
	const midpoint = () => {
		const pts = [...pointers.current.values()];
		return { x: pts.reduce((n, p) => n + p.x, 0) / pts.length, y: pts.reduce((n, p) => n + p.y, 0) / pts.length };
	};

	const onPointerEnd = (e: PointerEvent) => {
		pointers.current.delete(e.pointerId);
		const mid = pointers.current.size ? midpoint() : { x: 0, y: 0 };
		start.current = pointers.current.size ? { ...mid, dist: distance(), state } : null;
	};

	const handlers = {
		onPointerDown: (e: PointerEvent) => {
			pointers.current.set(e.pointerId, { x: e.clientX, y: e.clientY });
			const mid = midpoint();
			start.current = { ...mid, dist: distance(), state };
			if (pointers.current.size === 1) dragged.current = false;
		},
		onPointerMove: (e: PointerEvent) => {
			if (!pointers.current.has(e.pointerId) || !start.current) return;
			pointers.current.set(e.pointerId, { x: e.clientX, y: e.clientY });
			const mid = midpoint();
			const s0 = start.current.state;
			const dx = mid.x - start.current.x;
			const dy = mid.y - start.current.y;
			if (!dragged.current && Math.hypot(dx, dy) < DRAG_THRESHOLD && pointers.current.size === 1) return;
			if (!dragged.current) {
				dragged.current = true;
				// ドラッグ中は部屋のボタンではなくこの要素がポインタを受ける
				ref.current?.setPointerCapture(e.pointerId);
			}
			let next: State = { ...s0, cx: s0.cx - dx * unitsPerPx(s0), cy: s0.cy - dy * unitsPerPx(s0) };
			if (pointers.current.size === 2 && start.current.dist > 0) {
				next = zoomAt(next, distance() / start.current.dist, mid.x, mid.y);
			}
			setState(clamp(next));
		},
		onPointerUp: onPointerEnd,
		onPointerCancel: onPointerEnd,
		/** ドラッグ直後のクリック（部屋の選択など）を捨てる */
		onClickCapture: (e: MouseEvent) => {
			if (dragged.current) {
				e.stopPropagation();
				dragged.current = false;
			}
		},
	};

	const w = base[2] / state.k;
	const h = base[3] / state.k;
	const viewBox = [state.cx - w / 2, state.cy - h / 2, w, h].join(' ');

	return {
		ref,
		viewBox,
		zoom: state.k,
		handlers,
		zoomIn: () => setState((s) => zoomAt(s, 1.5)),
		zoomOut: () => setState((s) => zoomAt(s, 1 / 1.5)),
		reset: () => setState(initial()),
	};
}
