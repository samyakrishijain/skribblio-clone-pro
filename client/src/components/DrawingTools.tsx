import React from 'react';
import {
  Paintbrush,
  PaintBucket,
  Eraser,
  Undo2,
  Trash2,
  Pipette
} from 'lucide-react';

interface DrawingToolsProps {
  color: string;
  setColor: (color: string) => void;
  brushSize: number;
  setBrushSize: (size: number) => void;
  tool: 'brush' | 'fill' | 'eraser';
  setTool: (tool: 'brush' | 'fill' | 'eraser') => void;
  onUndo: () => void;
  onClear: () => void;
  disabled?: boolean;
}

const PALETTE = [
  '#000000', '#ffffff', '#78716c', '#ef4444',
  '#f97316', '#eab308', '#22c55e', '#06b6d4',
  '#3b82f6', '#8b5cf6', '#ec4899', '#854d0e',
  '#15803d', '#1e40af', '#9333ea', '#be185d'
];

const BRUSH_SIZES = [
  { label: 'S', size: 3 },
  { label: 'M', size: 8 },
  { label: 'L', size: 16 },
  { label: 'XL', size: 28 }
];

export const DrawingTools: React.FC<DrawingToolsProps> = ({
  color,
  setColor,
  brushSize,
  setBrushSize,
  tool,
  setTool,
  onUndo,
  onClear,
  disabled = false
}) => {
  return (
    <div className={`flex flex-wrap items-center justify-between gap-3 p-3 bg-slate-900/90 border border-slate-700/80 rounded-2xl shadow-xl backdrop-blur-md transition-opacity ${disabled ? 'opacity-50 pointer-events-none' : ''}`}>
      {/* Tool Selection */}
      <div className="flex items-center gap-1.5 bg-slate-800/80 p-1.5 rounded-xl border border-slate-700">
        <button
          type="button"
          onClick={() => setTool('brush')}
          title="Brush Tool"
          className={`p-2 rounded-lg transition-all cursor-pointer ${
            tool === 'brush'
              ? 'bg-blue-600 text-white shadow-md'
              : 'text-slate-400 hover:text-slate-200 hover:bg-slate-700/60'
          }`}
        >
          <Paintbrush className="w-5 h-5" />
        </button>

        <button
          type="button"
          onClick={() => setTool('fill')}
          title="Paint Bucket (Flood Fill)"
          className={`p-2 rounded-lg transition-all cursor-pointer ${
            tool === 'fill'
              ? 'bg-blue-600 text-white shadow-md'
              : 'text-slate-400 hover:text-slate-200 hover:bg-slate-700/60'
          }`}
        >
          <PaintBucket className="w-5 h-5" />
        </button>

        <button
          type="button"
          onClick={() => setTool('eraser')}
          title="Eraser Tool"
          className={`p-2 rounded-lg transition-all cursor-pointer ${
            tool === 'eraser'
              ? 'bg-blue-600 text-white shadow-md'
              : 'text-slate-400 hover:text-slate-200 hover:bg-slate-700/60'
          }`}
        >
          <Eraser className="w-5 h-5" />
        </button>
      </div>

      {/* Brush Sizes */}
      <div className="flex items-center gap-1.5 bg-slate-800/80 p-1.5 rounded-xl border border-slate-700">
        {BRUSH_SIZES.map(item => (
          <button
            key={item.label}
            type="button"
            onClick={() => setBrushSize(item.size)}
            title={`Size: ${item.label} (${item.size}px)`}
            className={`w-9 h-9 flex items-center justify-center rounded-lg font-bold text-xs transition-all cursor-pointer ${
              brushSize === item.size
                ? 'bg-indigo-600 text-white shadow-md'
                : 'text-slate-400 hover:text-slate-200 hover:bg-slate-700/60'
            }`}
          >
            <span
              className="rounded-full bg-current block"
              style={{
                width: Math.min(20, Math.max(4, item.size)),
                height: Math.min(20, Math.max(4, item.size))
              }}
            />
          </button>
        ))}
      </div>

      {/* Color Palette */}
      <div className="flex items-center gap-1 bg-slate-800/80 p-1.5 rounded-xl border border-slate-700 max-w-xs flex-wrap">
        {PALETTE.map(c => (
          <button
            key={c}
            type="button"
            onClick={() => {
              setColor(c);
              if (tool === 'eraser') setTool('brush');
            }}
            title={c}
            style={{ backgroundColor: c }}
            className={`w-5 h-5 rounded-md transition-transform cursor-pointer border ${
              c === '#ffffff' ? 'border-slate-500' : 'border-slate-700'
            } ${color === c && tool !== 'eraser' ? 'scale-125 border-white ring-2 ring-blue-500 shadow-md z-10' : 'hover:scale-110 opacity-90'}`}
          />
        ))}

        {/* Custom Color Input */}
        <label className="relative w-5 h-5 rounded-md cursor-pointer overflow-hidden border border-slate-500 flex items-center justify-center bg-gradient-to-tr from-pink-500 via-yellow-500 to-blue-500 hover:scale-110">
          <input
            type="color"
            value={color}
            onChange={e => {
              setColor(e.target.value);
              if (tool === 'eraser') setTool('brush');
            }}
            className="opacity-0 absolute inset-0 cursor-pointer w-full h-full"
            title="Custom Color"
          />
          <Pipette className="w-3 h-3 text-white drop-shadow pointer-events-none" />
        </label>
      </div>

      {/* Undo & Clear */}
      <div className="flex items-center gap-1.5 bg-slate-800/80 p-1.5 rounded-xl border border-slate-700">
        <button
          type="button"
          onClick={onUndo}
          title="Undo Last Stroke"
          className="p-2 text-slate-300 hover:text-white hover:bg-slate-700 rounded-lg transition-colors cursor-pointer"
        >
          <Undo2 className="w-5 h-5" />
        </button>

        <button
          type="button"
          onClick={onClear}
          title="Clear Canvas"
          className="p-2 text-red-400 hover:text-red-300 hover:bg-red-500/20 rounded-lg transition-colors cursor-pointer"
        >
          <Trash2 className="w-5 h-5" />
        </button>
      </div>
    </div>
  );
};
