import { useCallback, useEffect, useRef, useState, type MouseEvent, type PointerEvent } from 'react';

/*
 * SVG の viewBox を動かして、図面を拡大・移動できるようにする。
 * - ドラッグ: 移動（5px 以上動いたらドラッグとみなし、直後のクリックを捨てる）
 * - 2 本指・Ctrl（⌘）+ ホイール（トラックパッドのピンチも）: カーソルの位置を中心に拡大・縮小
 * - ホイール・縦のスワイプ（拡大していないとき）: onNavigate で階を上下に移す。ホイールは 1 回の動きで 1 階だけ
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

interface Options {
	/** 階の移動。1 で上の階、-1 で下の階。指定しないときはホイールで拡大・縮小する */
	onNavigate?: (direction: 1 | -1) => void;
}

/** ホイールがこの量たまったら 1 階動かす（マウスのホイールは 1 目盛りで約 100、トラックパッドは細かく何度も来る） */
const WHEEL_STEP = 50;
/** 1 階動かしたあと、続けて来るホイールを無視する時間（ms） */
const WHEEL_LOCK_MS = 450;
/** 縦のスワイプとみなす最小の距離（px） */
const SWIPE_DISTANCE = 70;

export function usePanZoom(base: Box, resetKey: unknown, options: Options = {}) {
	const navigate = useRef(options.onNavigate);
	navigate.current = options.onNavigate;
	const wheel = useRef({ acc: 0, last: 0, lockUntil: 0 });
	const initial = useCallback((): State => ({ k: 1, cx: base[0] + base[2] / 2, cy: base[1] + base[3] / 2 }), [base]);
	const [state, setState] = useState<State>(initial);
	const ref = useRef<HTMLDivElement>(null);
	const pointers = useRef(new Map<number, { x: number; y: number }>());
	const dragged = useRef(false);
	const start = useRef<{ x: number; y: number; dist: number; state: State; t: number } | null>(null);

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
			// ポップアップの中のスクロールは邪魔しない
			if ((e.target as Element | null)?.closest?.('[data-popup]')) return;
			e.preventDefault();
			const dy = e.deltaMode === 1 ? e.deltaY * 33 : e.deltaY;
			if (e.ctrlKey || e.metaKey || !navigate.current) {
				// ピンチ（ctrlKey つきの細かい値）は感度を上げる
				setState((s) => zoomAt(s, Math.exp(-dy * (e.ctrlKey ? 0.01 : 0.0015)), e.clientX, e.clientY));
				return;
			}
			const w = wheel.current;
			const now = performance.now();
			if (now < w.lockUntil) return;
			if (now - w.last > 250) w.acc = 0;
			w.last = now;
			w.acc += dy;
			if (Math.abs(w.acc) >= WHEEL_STEP) {
				// 下へスクロール = 下の階、上へスクロール = 上の階
				navigate.current(w.acc < 0 ? 1 : -1);
				w.acc = 0;
				w.lockUntil = now + WHEEL_LOCK_MS;
			}
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
		const began = start.current;
		const single = pointers.current.size === 1;
		pointers.current.delete(e.pointerId);
		// 拡大していないときの縦のスワイプで階を移す（拡大中は図面を動かすドラッグ）
		if (began && single && e.pointerType !== 'mouse' && e.type === 'pointerup' && state.k <= 1.01 && navigate.current) {
			const dx = e.clientX - began.x;
			const dy = e.clientY - began.y;
			if (Math.abs(dy) >= SWIPE_DISTANCE && Math.abs(dy) > Math.abs(dx) * 2 && performance.now() - began.t < 900) {
				navigate.current(dy < 0 ? 1 : -1);
			}
		}
		const mid = pointers.current.size ? midpoint() : { x: 0, y: 0 };
		start.current = pointers.current.size ? { ...mid, dist: distance(), state, t: performance.now() } : null;
	};

	const handlers = {
		onPointerDown: (e: PointerEvent) => {
			pointers.current.set(e.pointerId, { x: e.clientX, y: e.clientY });
			const mid = midpoint();
			start.current = { ...mid, dist: distance(), state, t: performance.now() };
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
