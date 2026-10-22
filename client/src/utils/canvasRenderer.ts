import { DrawingAction } from '../types/game';
import { floodFill } from './floodFill';

export function renderActionOnCanvas(
  ctx: CanvasRenderingContext2D,
  action: DrawingAction
) {
  const width = ctx.canvas.width;
  const height = ctx.canvas.height;

  if (action.type === 'clear') {
    ctx.fillStyle = '#ffffff';
    ctx.fillRect(0, 0, width, height);
    return;
  }

  if (action.type === 'fill' && action.x !== undefined && action.y !== undefined && action.color) {
    floodFill(ctx, action.x * width, action.y * height, action.color);
    return;
  }

  if (action.type === 'brush' && action.points && action.points.length > 0) {
    ctx.save();
    ctx.strokeStyle = action.color || '#000000';
    ctx.lineWidth = (action.size || 5) * (width / 800); // scale line width relative to canvas baseline
    ctx.lineCap = 'round';
    ctx.lineJoin = 'round';

    ctx.beginPath();
    const p0 = action.points[0];
    ctx.moveTo(p0.x * width, p0.y * height);

    if (action.points.length === 1) {
      // Single dot tap
      ctx.lineTo(p0.x * width + 0.1, p0.y * height + 0.1);
      ctx.stroke();
    } else {
      for (let i = 1; i < action.points.length; i++) {
        const pt = action.points[i];
        ctx.lineTo(pt.x * width, pt.y * height);
      }
      ctx.stroke();
    }
    ctx.restore();
  }
}

export function renderFullHistory(
  ctx: CanvasRenderingContext2D,
  history: DrawingAction[]
) {
  const width = ctx.canvas.width;
  const height = ctx.canvas.height;

  ctx.fillStyle = '#ffffff';
  ctx.fillRect(0, 0, width, height);

  for (const action of history) {
    renderActionOnCanvas(ctx, action);
  }
}

/**
 * Replays history in speed-up animation
 */
export function replayDrawingHistory(
  ctx: CanvasRenderingContext2D,
  history: DrawingAction[],
  speedMultiplier: number = 3,
  onComplete?: () => void
): () => void {
  let isCancelled = false;
  let index = 0;

  // Clear first
  ctx.fillStyle = '#ffffff';
  ctx.fillRect(0, 0, ctx.canvas.width, ctx.canvas.height);

  const step = () => {
    if (isCancelled) return;
    if (index >= history.length) {
      if (onComplete) onComplete();
      return;
    }

    renderActionOnCanvas(ctx, history[index]);
    index++;

    setTimeout(step, Math.max(10, 50 / speedMultiplier));
  };

  step();

  return () => {
    isCancelled = true;
  };
}
