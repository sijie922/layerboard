import { useCallback, useRef } from 'react';
import gsap from 'gsap';
import type Konva from 'konva';
import type { CanvasViewport } from './useCanvasStage';
import { CANVAS, AREA_DEFAULTS, CAMERA } from '@/utils/constants';

export interface FlyTarget {
  areaX: number;
  areaY: number;
  areaWidth?: number;
  areaHeight?: number;
  scale?: number;
}

/**
 * Drives the "first-person fly" camera animation used when navigating
 * between areas. Animates the Konva Stage's x/y/scale via GSAP.
 */
export function useCameraAnimation(
  stageRef: React.RefObject<Konva.Stage | null>,
  currentViewport: CanvasViewport,
  setViewport: (vp: CanvasViewport) => void,
  containerSize: { width: number; height: number }
) {
  const tweenRef = useRef<gsap.core.Tween | null>(null);

  const flyTo = useCallback(
    (target: FlyTarget) => {
      const stage = stageRef.current;
      if (!stage) return;

      // Kill any running animation
      tweenRef.current?.kill();

      const cw = containerSize.width || window.innerWidth;
      const ch = containerSize.height || window.innerHeight;
      const aw = target.areaWidth ?? AREA_DEFAULTS.WIDTH;
      const ah = target.areaHeight ?? AREA_DEFAULTS.HEIGHT;
      const targetScale = target.scale ?? Math.max(
        CANVAS.DEFAULT_SCALE,
        Math.min(cw / (aw * 1.6), ch / (ah * 1.6))
      );

      // Compute stage position so the area is centered & fitted
      const targetX = cw / 2 - (target.areaX + aw / 2) * targetScale;
      const targetY = ch / 2 - (target.areaY + ah / 2) * targetScale;

      const from = { ...currentViewport };

      const proxy = { x: from.x, y: from.y, scale: from.scale };
      tweenRef.current = gsap.to(proxy, {
        x: targetX,
        y: targetY,
        scale: targetScale,
        duration: CAMERA.FLY_DURATION,
        ease: CAMERA.EASE,
        onUpdate: () => {
          setViewport({ x: proxy.x, y: proxy.y, scale: proxy.scale });
        },
      });
    },
    [stageRef, currentViewport, setViewport, containerSize]
  );

  const flyToArea = useCallback(
    (areaX: number, areaY: number, areaWidth: number, areaHeight: number) => {
      flyTo({ areaX, areaY, areaWidth, areaHeight });
    },
    [flyTo]
  );

  return { flyTo, flyToArea };
}
