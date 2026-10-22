import React from 'react';
import { AvatarConfig } from '../types/game';
import { AvatarDisplay } from './AvatarDisplay';
import { Check, Sparkles } from 'lucide-react';

interface AvatarCreatorProps {
  avatar: AvatarConfig;
  onChange: (updated: AvatarConfig) => void;
  onClose?: () => void;
}

const COLOR_OPTIONS = [
  '#3b82f6', // Blue
  '#10b981', // Emerald
  '#f59e0b', // Amber
  '#ef4444', // Red
  '#8b5cf6', // Violet
  '#ec4899', // Pink
  '#06b6d4', // Cyan
  '#84cc16'  // Lime
];

const EYE_LABELS = ['Happy', 'Wink', 'Sparkle', 'Shades', 'Open'];
const MOUTH_LABELS = ['Smile', 'Grin', 'Tongue', 'Laugh', 'Smirk'];
const ACCESSORY_LABELS = ['None', 'Party Hat', 'Crown', 'Beret', 'Headband'];

export const AvatarCreator: React.FC<AvatarCreatorProps> = ({
  avatar,
  onChange,
  onClose
}) => {
  const randomize = () => {
    onChange({
      color: COLOR_OPTIONS[Math.floor(Math.random() * COLOR_OPTIONS.length)],
      eyes: Math.floor(Math.random() * 5),
      mouth: Math.floor(Math.random() * 5),
      accessory: Math.floor(Math.random() * 5)
    });
  };

  return (
    <div className="bg-slate-800/90 border border-slate-700/80 rounded-2xl p-6 shadow-2xl backdrop-blur-md max-w-md w-full">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-xl font-bold text-white flex items-center gap-2">
          <span>Customize Avatar</span>
        </h3>
        <button
          onClick={randomize}
          type="button"
          className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold rounded-lg bg-indigo-600/30 text-indigo-300 hover:bg-indigo-600/50 border border-indigo-500/30 transition-all cursor-pointer"
        >
          <Sparkles className="w-3.5 h-3.5" />
          <span>Randomize</span>
        </button>
      </div>

      {/* Avatar Preview */}
      <div className="flex justify-center my-4">
        <div className="p-4 bg-slate-900/60 rounded-2xl border border-slate-700 shadow-inner">
          <AvatarDisplay avatar={avatar} size={96} animate />
        </div>
      </div>

      <div className="space-y-4 text-sm">
        {/* Colors */}
        <div>
          <label className="block text-xs font-medium text-slate-400 mb-2 uppercase tracking-wider">
            Body Color
          </label>
          <div className="flex items-center gap-2 flex-wrap">
            {COLOR_OPTIONS.map(c => (
              <button
                key={c}
                type="button"
                onClick={() => onChange({ ...avatar, color: c })}
                style={{ backgroundColor: c }}
                className={`w-8 h-8 rounded-full border-2 transition-transform cursor-pointer flex items-center justify-center ${
                  avatar.color === c ? 'border-white scale-110 shadow-lg' : 'border-transparent hover:scale-105 opacity-80'
                }`}
              >
                {avatar.color === c && <Check className="w-4 h-4 text-white drop-shadow" />}
              </button>
            ))}
          </div>
        </div>

        {/* Eyes Selector */}
        <div>
          <label className="block text-xs font-medium text-slate-400 mb-1.5 uppercase tracking-wider">
            Eyes Style
          </label>
          <div className="grid grid-cols-5 gap-1.5">
            {EYE_LABELS.map((label, idx) => (
              <button
                key={label}
                type="button"
                onClick={() => onChange({ ...avatar, eyes: idx })}
                className={`py-1.5 px-1 text-xs rounded-lg font-medium transition-colors cursor-pointer text-center ${
                  avatar.eyes === idx
                    ? 'bg-blue-600 text-white font-bold shadow-md'
                    : 'bg-slate-700/60 text-slate-300 hover:bg-slate-700'
                }`}
              >
                {label}
              </button>
            ))}
          </div>
        </div>

        {/* Mouth Selector */}
        <div>
          <label className="block text-xs font-medium text-slate-400 mb-1.5 uppercase tracking-wider">
            Mouth Expression
          </label>
          <div className="grid grid-cols-5 gap-1.5">
            {MOUTH_LABELS.map((label, idx) => (
              <button
                key={label}
                type="button"
                onClick={() => onChange({ ...avatar, mouth: idx })}
                className={`py-1.5 px-1 text-xs rounded-lg font-medium transition-colors cursor-pointer text-center ${
                  avatar.mouth === idx
                    ? 'bg-blue-600 text-white font-bold shadow-md'
                    : 'bg-slate-700/60 text-slate-300 hover:bg-slate-700'
                }`}
              >
                {label}
              </button>
            ))}
          </div>
        </div>

        {/* Accessory Selector */}
        <div>
          <label className="block text-xs font-medium text-slate-400 mb-1.5 uppercase tracking-wider">
            Hat / Accessory
          </label>
          <div className="grid grid-cols-5 gap-1.5">
            {ACCESSORY_LABELS.map((label, idx) => (
              <button
                key={label}
                type="button"
                onClick={() => onChange({ ...avatar, accessory: idx })}
                className={`py-1.5 px-1 text-xs rounded-lg font-medium transition-colors cursor-pointer text-center ${
                  avatar.accessory === idx
                    ? 'bg-blue-600 text-white font-bold shadow-md'
                    : 'bg-slate-700/60 text-slate-300 hover:bg-slate-700'
                }`}
              >
                {label}
              </button>
            ))}
          </div>
        </div>
      </div>

      {onClose && (
        <div className="mt-6">
          <button
            type="button"
            onClick={onClose}
            className="w-full py-2.5 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 text-white font-bold rounded-xl shadow-lg transition-all cursor-pointer"
          >
            Save Avatar
          </button>
        </div>
      )}
    </div>
  );
};
