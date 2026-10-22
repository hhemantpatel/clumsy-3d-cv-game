import React, { useEffect, useRef, useState } from 'react';

interface Rect {
  x: number;
  y: number;
  width: number;
  height: number;
}

interface Options {
  /** Initial geometry, computed lazily from the viewport. */
  initial: () => Rect;
  minWidth: () => number;
  minHeight: number;
}

/**
 * Drag (by a title bar) + resize (by a corner handle) for a fixed-position in-page window,
 * with mouse and touch support. Keeps the window reachable inside the viewport.
 */
export function useFloatingWindow({ initial, minWidth, minHeight }: Options) {
  const [rect, setRect] = useState<Rect>(initial);
  const rectRef = useRef(rect);
  rectRef.current = rect;

  const dragRef = useRef<{ startX: number; startY: number; initX: number; initY: number } | null>(null);
  const resizeRef = useRef<{ startX: number; startY: number; initW: number; initH: number } | null>(null);

  const point = (e: React.MouseEvent | React.TouchEvent) =>
    'touches' in e ? { x: e.touches[0].clientX, y: e.touches[0].clientY } : { x: e.clientX, y: e.clientY };

  const onDragStart = (e: React.MouseEvent | React.TouchEvent) => {
    if ((e.target as HTMLElement).closest('button')) return;
    const p = point(e);
    dragRef.current = { startX: p.x, startY: p.y, initX: rectRef.current.x, initY: rectRef.current.y };
  };

  const onResizeStart = (e: React.MouseEvent | React.TouchEvent) => {
    e.stopPropagation();
    e.preventDefault();
    const p = point(e);
    resizeRef.current = { startX: p.x, startY: p.y, initW: rectRef.current.width, initH: rectRef.current.height };
  };

  useEffect(() => {
    const move = (e: MouseEvent | TouchEvent) => {
      if (!dragRef.current && !resizeRef.current) return;
      const pt = 'touches' in e ? e.touches[0] : e;
      if (!pt) return;
      if (dragRef.current) {
        const d = dragRef.current;
        setRect((r) => ({
          ...r,
          x: Math.max(0, Math.min(window.innerWidth - 120, d.initX + pt.clientX - d.startX)),
          y: Math.max(0, Math.min(window.innerHeight - 48, d.initY + pt.clientY - d.startY)),
        }));
      }
      if (resizeRef.current) {
        const s = resizeRef.current;
        setRect((r) => ({
          ...r,
          width: Math.max(minWidth(), Math.min(window.innerWidth - 8, s.initW + pt.clientX - s.startX)),
          height: Math.max(minHeight, Math.min(window.innerHeight - 8, s.initH + pt.clientY - s.startY)),
        }));
      }
    };
    const up = () => {
      dragRef.current = null;
      resizeRef.current = null;
    };
    window.addEventListener('mousemove', move);
    window.addEventListener('mouseup', up);
    window.addEventListener('touchmove', move);
    window.addEventListener('touchend', up);
    return () => {
      window.removeEventListener('mousemove', move);
      window.removeEventListener('mouseup', up);
      window.removeEventListener('touchmove', move);
      window.removeEventListener('touchend', up);
    };
    // minWidth/minHeight are stable for the lifetime of a window
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return { rect, onDragStart, onResizeStart };
}

/** Corner grip shared by the floating garden windows. */
export const ResizeGrip: React.FC<{ onResizeStart: (e: React.MouseEvent | React.TouchEvent) => void }> = ({ onResizeStart }) => (
  <div
    onMouseDown={onResizeStart}
    onTouchStart={onResizeStart}
    title="Drag to resize window"
    aria-hidden="true"
    className="absolute bottom-0.5 right-0.5 w-5 h-5 cursor-se-resize flex items-center justify-center text-[#2b1d16]/50 hover:text-[#2b1d16] z-30 select-none"
  >
    <svg className="w-3.5 h-3.5" viewBox="0 0 10 10" fill="currentColor">
      <path d="M9 1L1 9M9 5L5 9M9 9L9 9" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" />
    </svg>
  </div>
);
