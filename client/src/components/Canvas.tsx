import React, { useRef, useEffect, useState, useCallback } from 'react';
import { DrawingAction, Point } from '../types/game';
import { renderActionOnCanvas, renderFullHistory } from '../utils/canvasRenderer';
import { floodFill } from '../utils/floodFill';

interface CanvasProps {
  isDrawer: boolean;
  canDraw: boolean;
  color: string;
  brushSize: number;
  tool: 'brush' | 'fill' | 'eraser';
  history: DrawingAction[];
  drawerCursor?: { x: number; y: number } | null;
  drawerName?: string;
  onEmitAction: (action: DrawingAction) => void;
  onEmitCursor?: (pos: { x: number; y: number }) => void;
}

export const Canvas: React.FC<CanvasProps> = ({
  isDrawer,
  canDraw,
  color,
  brushSize,
  tool,
  history,
  drawerCursor,
  drawerName,
  onEmitAction,
  onEmitCursor
}) => {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const containerRef = useRef<HTMLDivElement | null>(null);

  const [isDrawing, setIsDrawing] = useState(false);
  const currentStrokePoints = useRef<Point[]>([]);
  const lastEmitTime = useRef(0);

  // Initialize or re-render full canvas history
  const redrawAll = useCallback(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d', { willReadFrequently: true });
    if (!ctx) return;

    renderFullHistory(ctx, history);
  }, [history]);

  useEffect(() => {
    redrawAll();
  }, [redrawAll]);

  // Window resize handler: keeps internal resolution crisp at 1200x800
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    canvas.width = 1200;
    canvas.height = 800;
    redrawAll();
  }, [redrawAll]);

  // Get normalized coordinates (0..1) from mouse or touch event
  const getNormalizedCoords = (e: React.MouseEvent | React.TouchEvent): Point | null => {
    const canvas = canvasRef.current;
    if (!canvas) return null;
    const rect = canvas.getBoundingClientRect();

    let clientX = 0;
    let clientY = 0;

    if ('touches' in e) {
      if (e.touches.length === 0) return null;
      clientX = e.touches[0].clientX;
      clientY = e.touches[0].clientY;
    } else {
      clientX = e.clientX;
      clientY = e.clientY;
    }

    const x = Math.max(0, Math.min(1, (clientX - rect.left) / rect.width));
    const y = Math.max(0, Math.min(1, (clientY - rect.top) / rect.height));

    return { x, y };
  };

  const handlePointerDown = (e: React.MouseEvent | React.TouchEvent) => {
    if (!isDrawer || !canDraw) return;
    const pt = getNormalizedCoords(e);
    if (!pt) return;

    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d', { willReadFrequently: true });
    if (!ctx) return;

    const effectiveColor = tool === 'eraser' ? '#ffffff' : color;

    if (tool === 'fill') {
      // Execute flood fill
      floodFill(ctx, pt.x * canvas.width, pt.y * canvas.height, effectiveColor);
      onEmitAction({
        type: 'fill',
        x: pt.x,
        y: pt.y,
        color: effectiveColor
      });
      return;
    }

    // Brush or Eraser
    setIsDrawing(true);
    currentStrokePoints.current = [pt];

    // Draw initial dot
    renderActionOnCanvas(ctx, {
      type: 'brush',
      points: [pt],
      color: effectiveColor,
      size: brushSize
    });
  };

  const handlePointerMove = (e: React.MouseEvent | React.TouchEvent) => {
    const pt = getNormalizedCoords(e);
    if (!pt) return;

    // Send cursor position occasionally
    if (isDrawer && onEmitCursor) {
      const now = Date.now();
      if (now - lastEmitTime.current > 40) {
        onEmitCursor(pt);
        lastEmitTime.current = now;
      }
    }

    if (!isDrawer || !canDraw || !isDrawing) return;

    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d', { willReadFrequently: true });
    if (!ctx) return;

    const effectiveColor = tool === 'eraser' ? '#ffffff' : color;
    const points = currentStrokePoints.current;
    points.push(pt);

    // Render segment
    if (points.length >= 2) {
      const lastTwo = [points[points.length - 2], pt];
      renderActionOnCanvas(ctx, {
        type: 'brush',
        points: lastTwo,
        color: effectiveColor,
        size: brushSize
      });
    }
  };

  const handlePointerUp = () => {
    if (!isDrawer || !canDraw || !isDrawing) return;
    setIsDrawing(false);

    const points = currentStrokePoints.current;
    if (points.length > 0) {
      const effectiveColor = tool === 'eraser' ? '#ffffff' : color;
      onEmitAction({
        type: 'brush',
        points: [...points],
        color: effectiveColor,
        size: brushSize
      });
    }

    currentStrokePoints.current = [];
  };

  return (
    <div
      ref={containerRef}
      className="relative w-full aspect-[3/2] bg-white rounded-2xl shadow-2xl overflow-hidden border-2 border-slate-700/80 touch-none select-none flex items-center justify-center cursor-crosshair"
      onMouseLeave={() => {
        if (isDrawing) handlePointerUp();
      }}
    >
      <canvas
        ref={canvasRef}
        className="w-full h-full block bg-white"
        onMouseDown={handlePointerDown}
        onMouseMove={handlePointerMove}
        onMouseUp={handlePointerUp}
        onTouchStart={handlePointerDown}
        onTouchMove={handlePointerMove}
        onTouchEnd={handlePointerUp}
      />

      {/* Drawer Live Cursor Indicator for Guessers */}
      {!isDrawer && drawerCursor && (
        <div
          className="absolute pointer-events-none transition-all duration-75 ease-out -translate-x-1/2 -translate-y-1/2 flex items-center gap-1 z-20"
          style={{
            left: `${drawerCursor.x * 100}%`,
            top: `${drawerCursor.y * 100}%`
          }}
        >
          <div className="w-3.5 h-3.5 rounded-full border-2 border-white bg-blue-500 shadow-md animate-ping" />
          <div className="w-3 h-3 rounded-full border border-white bg-blue-600 shadow" />
          {drawerName && (
            <span className="text-[10px] font-bold px-1.5 py-0.5 rounded bg-slate-900/80 text-white shadow backdrop-blur-sm whitespace-nowrap">
              {drawerName}
            </span>
          )}
        </div>
      )}

      {/* Floating spectator badge */}
      {!isDrawer && canDraw && (
        <div className="absolute top-3 right-3 bg-slate-900/70 backdrop-blur-md px-3 py-1 rounded-full border border-slate-700 text-xs text-slate-300 font-medium pointer-events-none flex items-center gap-1.5">
          <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
          <span>Live Sync</span>
        </div>
      )}
    </div>
  );
};
