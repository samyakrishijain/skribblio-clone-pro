import React, { useState } from 'react';
import { RoundScore, DrawingAction } from '../types/game';
import { Trophy, Play, CheckCircle } from 'lucide-react';

interface RoundEndModalProps {
  word: string;
  scores: RoundScore[];
  nextDrawer?: string;
  reason?: string;
  replayData?: DrawingAction[];
  onReplayDrawing?: (data: DrawingAction[]) => void;
}

export const RoundEndModal: React.FC<RoundEndModalProps> = ({
  word,
  scores,
  nextDrawer,
  reason,
  replayData,
  onReplayDrawing
}) => {
  const [isReplaying, setIsReplaying] = useState(false);

  const handleReplay = () => {
    if (replayData && onReplayDrawing) {
      setIsReplaying(true);
      onReplayDrawing(replayData);
      setTimeout(() => setIsReplaying(false), 4000);
    }
  };

  return (
    <div className="fixed inset-0 z-40 flex items-center justify-center bg-black/75 backdrop-blur-sm p-4 animate-in fade-in">
      <div className="bg-slate-900 border border-slate-700/80 rounded-3xl p-6 max-w-md w-full shadow-2xl text-center space-y-4">
        {reason && (
          <div className="text-xs font-semibold uppercase tracking-wider text-amber-400">
            {reason}
          </div>
        )}

        <div className="space-y-1">
          <p className="text-xs font-medium text-slate-400 uppercase tracking-widest">
            The Word Was
          </p>
          <h2 className="text-3xl font-black text-transparent bg-clip-text bg-gradient-to-r from-emerald-400 via-teal-300 to-cyan-400 uppercase tracking-wider drop-shadow-sm">
            {word}
          </h2>
        </div>

        {/* Round Scores Earned */}
        <div className="bg-slate-800/80 rounded-2xl p-3 border border-slate-700 text-left space-y-1.5 max-h-48 overflow-y-auto">
          <div className="text-[11px] font-bold uppercase tracking-wider text-slate-400 px-1 flex items-center justify-between">
            <span>Round Scores</span>
            <Trophy className="w-3.5 h-3.5 text-amber-400" />
          </div>
          {scores.map(s => (
            <div
              key={s.id}
              className="flex items-center justify-between text-xs py-1 px-2 rounded-lg bg-slate-900/60"
            >
              <span className="font-semibold text-slate-200 truncate">{s.name}</span>
              <div className="flex items-center gap-2">
                {s.roundScore > 0 ? (
                  <span className="font-bold text-emerald-400">+{s.roundScore}</span>
                ) : (
                  <span className="text-slate-500">0</span>
                )}
                <span className="text-slate-400 text-[10px] font-mono">({s.totalScore})</span>
              </div>
            </div>
          ))}
        </div>

        {/* Replay action */}
        {replayData && replayData.length > 0 && onReplayDrawing && (
          <button
            type="button"
            onClick={handleReplay}
            disabled={isReplaying}
            className="flex items-center justify-center gap-2 w-full py-2.5 rounded-xl bg-indigo-600/30 hover:bg-indigo-600/50 border border-indigo-500/40 text-indigo-300 text-xs font-bold transition-all cursor-pointer"
          >
            {isReplaying ? (
              <>
                <CheckCircle className="w-4 h-4 text-emerald-400 animate-spin" />
                <span>Replaying Drawing on Canvas...</span>
              </>
            ) : (
              <>
                <Play className="w-4 h-4 fill-current" />
                <span>Watch Round Drawing Replay</span>
              </>
            )}
          </button>
        )}

        {/* Next Drawer Preview */}
        {nextDrawer && (
          <div className="pt-2 text-xs text-slate-400 flex items-center justify-center gap-1.5">
            <span>Next up to draw:</span>
            <span className="font-bold text-white bg-slate-800 px-2.5 py-0.5 rounded-full border border-slate-700">
              {nextDrawer}
            </span>
          </div>
        )}
      </div>
    </div>
  );
};
