import React from 'react';
import { Sparkles, Clock } from 'lucide-react';

interface WordPickerModalProps {
  words: string[];
  timeLeft: number;
  onSelectWord: (word: string) => void;
}

export const WordPickerModal: React.FC<WordPickerModalProps> = ({
  words,
  timeLeft,
  onSelectWord
}) => {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-md p-4 animate-in fade-in duration-200">
      <div className="bg-slate-900 border border-slate-700 rounded-3xl p-6 max-w-md w-full shadow-2xl text-center space-y-5">
        <div className="flex items-center justify-center gap-2 text-amber-400">
          <Sparkles className="w-6 h-6 animate-spin" style={{ animationDuration: '4s' }} />
          <h2 className="text-2xl font-black tracking-wide text-white">Choose Your Word!</h2>
        </div>

        <p className="text-sm text-slate-400">
          Pick a word to draw for your friends before time runs out.
        </p>

        {/* Timer Bar */}
        <div className="space-y-1">
          <div className="flex items-center justify-between text-xs font-bold text-slate-400 px-1">
            <span className="flex items-center gap-1">
              <Clock className="w-3.5 h-3.5" />
              <span>Time Remaining</span>
            </span>
            <span className="text-amber-400 font-mono">{timeLeft}s</span>
          </div>
          <div className="w-full bg-slate-800 h-2.5 rounded-full overflow-hidden border border-slate-700">
            <div
              className="h-full bg-gradient-to-r from-amber-500 to-rose-500 transition-all duration-1000 ease-linear"
              style={{ width: `${Math.max(0, Math.min(100, (timeLeft / 15) * 100))}%` }}
            />
          </div>
        </div>

        {/* Word Choices */}
        <div className="grid grid-cols-1 gap-3 pt-2">
          {words.map((word) => (
            <button
              key={word}
              type="button"
              onClick={() => onSelectWord(word)}
              className="py-3.5 px-6 rounded-2xl bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 text-white font-extrabold text-lg capitalize tracking-wide shadow-lg hover:shadow-blue-500/25 hover:scale-[1.02] active:scale-[0.98] transition-all cursor-pointer border border-blue-400/30"
            >
              {word}
            </button>
          ))}
        </div>
      </div>
    </div>
  );
};
