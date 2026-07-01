import { useState, useRef, useCallback, useEffect } from 'react';
import type Konva from 'konva';
import { CANVAS } from '@/utils/constants';
import { clamp } from '@/utils/helpers';
export interface CanvasViewport {
  x: number;
  y: number;
  scale: number;
}

/**
 * Manages the infinite canvas viewport state: pan + zoom.
 * Zoom is centered on the pointer position for a natural feel.
 */
export function useCanvasStage(initial?: Partial<CanvasViewport>) {
  const stageRef = useRef<Konva.Stage | null>(null);
  const containerRef = useRef<HTMLDivElement | null>(null);

  const [viewport, setViewport] = useState<CanvasViewport>({
    x: initial?.x ?? 0,
    y: initial?.y ?? 0,
    scale: initial?.scale ?? CANVAS.DEFAULT_SCALE,
  });

  // Track container size for centering calculations
  const [size, setSize] = useState({ width: 0, height: 0 });

  useEffect(() => {
    const el = containerRef.current;
    if (!el) return;
    const update = () => setSize({ width: el.clientWidth, height: el.clientHeight });
    update();
    const ro = new ResizeObserver(update);
    ro.observe(el);
    return () => ro.disconnect();
  }, []);

  // Wheel zoom centered on cursor
  const handleWheel = useCallback((e: Konva.KonvaEventObject<WheelEvent>) => {
    e.evt.preventDefault();
    const stage = stageRef.current;
    if (!stage) return;

    const pointer = stage.getPointerPosition();
    if (!pointer) return;

    const oldScale = viewport.scale;
    const direction = e.evt.deltaY > 0 ? -1 : 1;
    const factor = direction > 0 ? CANVAS.WHEEL_ZOOM_FACTOR : 1 / CANVAS.WHEEL_ZOOM_FACTOR;
    const newScale = clamp(oldScale * factor, CANVAS.MIN_SCALE, CANVAS.MAX_SCALE);

    // Keep the point under cursor fixed while zooming
    const mousePointTo = {
      x: (pointer.x - viewport.x) / oldScale,
      y: (pointer.y - viewport.y) / oldScale,
    };

    setViewport({
      scale: newScale,
      x: pointer.x - mousePointTo.x * newScale,
      y: pointer.y - mousePointTo.y * newScale,
    });
  }, [viewport]);

  // Drag the background to pan
  const handleDragEnd = useCallback((e: Konva.KonvaEventObject<DragEvent>) => {
    setViewport((vp) => ({
      ...vp,
      x: e.target.x(),
      y: e.target.y(),
    }));
  }, []);

  // Programmatic zoom controls (toolbar buttons)
  const zoomBy = useCallback((factor: number) => {
    const stage = stageRef.current;
    if (!stage) return;
    const center = { x: size.width / 2, y: size.height / 2 };
    const oldScale = viewport.scale;
    const newScale = clamp(oldScale * factor, CANVAS.MIN_SCALE, CANVAS.MAX_SCALE);
    const point = {
      x: (center.x - viewport.x) / oldScale,
      y: (center.y - viewport.y) / oldScale,
    };
    setViewport({
      scale: newScale,
      x: center.x - point.x * newScale,
      y: center.y - point.y * newScale,
    });
  }, [viewport, size]);

  const zoomIn = useCallback(() => zoomBy(1.2), [zoomBy]);
  const zoomOut = useCallback(() => zoomBy(1 / 1.2), [zoomBy]);
  const resetZoom = useCallback(() => setViewport({ x: 0, y: 0, scale: 1 }), []);

  // Imperatively set viewport (used by camera fly animations)
  const setViewportExternal = useCallback((vp: CanvasViewport) => {
    setViewport(vp);
  }, []);

  return {
    stageRef,
    containerRef,
    viewport,
    size,
    handleWheel,
    handleDragEnd,
    zoomIn,
    zoomOut,
    resetZoom,
    setViewport: setViewportExternal,
  };
}
