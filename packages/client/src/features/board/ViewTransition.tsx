import { useEffect, useRef, useState } from 'react';

interface ViewTransitionProps {
  active: boolean;
  fromView: '2d' | '3d';
  toView: '2d' | '3d';
  onComplete: () => void;
}

/**
 * A lightweight CSS-based "fly-through" transition overlay used when
 * switching between the 2D canvas and the 3D viewer. It renders a brief
 * zoom + blur animation so the swap feels continuous rather than abrupt.
 */
export default function ViewTransition({ active, fromView, toView, onComplete }: ViewTransitionProps) {
  const ref = useRef<HTMLDivElement>(null);
  const [phase, setPhase] = useState<'idle' | 'zoom-in' | 'flash' | 'zoom-out'>('idle');

  useEffect(() => {
    if (!active) {
      setPhase('idle');
      return;
    }

    let raf1 = 0;
    let raf2 = 0;

    // Phase 1: zoom-in + blur the outgoing view
    setPhase('zoom-in');
    raf1 = window.setTimeout(() => {
      // Phase 2: white flash hides the actual DOM swap
      setPhase('flash');
      raf2 = window.setTimeout(() => {
        // Phase 3: zoom-out to reveal the new view
        setPhase('zoom-out');
        window.setTimeout(() => {
          setPhase('idle');
          onComplete();
        }, 360);
      }, 140);
    }, 320);

    return () => {
      clearTimeout(raf1);
      clearTimeout(raf2);
    };
  }, [active, fromView, toView, onComplete]);

  if (phase === 'idle') return null;

  return (
    <div
      ref={ref}
      style={{
        position: 'absolute',
        inset: 0,
        zIndex: 1000,
        pointerEvents: phase === 'flash' ? 'all' : 'none',
        background:
          phase === 'flash'
            ? '#ffffff'
            : 'radial-gradient(circle at center, rgba(255,255,255,0) 30%, rgba(255,255,255,0.9) 100%)',
        opacity: phase === 'zoom-in' ? 0 : phase === 'flash' ? 1 : 0,
        transition:
          phase === 'zoom-in'
            ? 'opacity 0.3s ease-in'
            : phase === 'zoom-out'
            ? 'opacity 0.35s ease-out'
            : 'opacity 0.14s linear',
      }}
    >
      <div
        style={{
          position: 'absolute',
          top: '50%',
          left: '50%',
          transform: 'translate(-50%, -50%)',
          fontSize: 14,
          color: '#6C5CE7',
          fontWeight: 600,
          opacity: phase === 'flash' ? 1 : 0,
          transition: 'opacity 0.2s',
        }}
      >
        {toView === '3d' ? '🌐 进入立体视图...' : '🖱️ 返回画板...'}
      </div>
    </div>
  );
}
