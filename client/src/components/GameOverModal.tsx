import React, { useEffect } from 'react';
import { Player } from '../types/game';
import { AvatarDisplay } from './AvatarDisplay';
import confetti from 'canvas-confetti';
import { Trophy, RotateCcw, Award } from 'lucide-react';

interface GameOverModalProps {
  leaderboard: Player[];
  winner: Player | null;
  isHost: boolean;
  onReturnToLobby: () => void;
}

export const GameOverModal: React.FC<GameOverModalProps> = ({
  leaderboard,
  winner,
  isHost,
  onReturnToLobby
}) => {
  useEffect(() => {
    // Launch celebratory confetti bursts!
    const duration = 3 * 1000;
    const end = Date.now() + duration;

    const frame = () => {
      confetti({
        particleCount: 3,
        angle: 60,
        spread: 55,
        origin: { x: 0 }
      });
      confetti({
        particleCount: 3,
        angle: 120,
        spread: 55,
        origin: { x: 1 }
      });

      if (Date.now() < end) {
        requestAnimationFrame(frame);
      }
    };
    frame();
  }, []);

  const first = leaderboard[0];
  const second = leaderboard[1];
  const third = leaderboard[2];

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/85 backdrop-blur-md p-4 animate-in fade-in">
      <div className="bg-slate-900 border border-slate-700 rounded-3xl p-6 max-w-lg w-full shadow-2xl text-center space-y-6">
        <div className="space-y-1">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-amber-500/20 border border-amber-500/40 text-amber-300 text-xs font-bold uppercase tracking-widest">
            <Trophy className="w-4 h-4 text-amber-400" />
            <span>Game Finished</span>
          </div>
          <h2 className="text-3xl font-black text-white">
            {winner ? `${winner.name} Wins!` : 'Game Over!'}
          </h2>
        </div>

        {/* Podium View */}
        <div className="flex items-end justify-center gap-3 pt-6 pb-2">
          {/* 2nd Place */}
          {second && (
            <div className="flex flex-col items-center flex-1">
              <AvatarDisplay avatar={second.avatar} size={48} />
              <div className="text-xs font-bold text-slate-200 mt-2 truncate max-w-[80px]">
                {second.name}
              </div>
              <div className="text-[11px] font-mono text-emerald-400 font-semibold mb-2">
                {second.score} pts
              </div>
              <div className="w-full bg-slate-800 border-t-2 border-slate-400 h-20 rounded-t-xl flex items-center justify-center font-black text-slate-400 text-lg shadow-inner">
                🥈 2nd
              </div>
            </div>
          )}

          {/* 1st Place (Tallest) */}
          {first && (
            <div className="flex flex-col items-center flex-1 -mt-4">
              <div className="relative">
                <div className="text-2xl absolute -top-6 left-1/2 -translate-x-1/2 animate-bounce">
                  👑
                </div>
                <AvatarDisplay avatar={first.avatar} size={64} animate />
              </div>
              <div className="text-sm font-extrabold text-amber-300 mt-2 truncate max-w-[90px]">
                {first.name}
              </div>
              <div className="text-xs font-mono text-emerald-400 font-bold mb-2">
                {first.score} pts
              </div>
              <div className="w-full bg-gradient-to-t from-amber-600/30 to-amber-500/50 border-t-4 border-amber-400 h-28 rounded-t-xl flex items-center justify-center font-black text-amber-300 text-xl shadow-lg">
                🥇 1st
              </div>
            </div>
          )}

          {/* 3rd Place */}
          {third && (
            <div className="flex flex-col items-center flex-1">
              <AvatarDisplay avatar={third.avatar} size={44} />
              <div className="text-xs font-bold text-slate-300 mt-2 truncate max-w-[80px]">
                {third.name}
              </div>
              <div className="text-[11px] font-mono text-emerald-400 font-semibold mb-2">
                {third.score} pts
              </div>
              <div className="w-full bg-slate-800 border-t-2 border-amber-700 h-16 rounded-t-xl flex items-center justify-center font-black text-amber-700 text-base shadow-inner">
                🥉 3rd
              </div>
            </div>
          )}
        </div>

        {/* Full Leaderboard List */}
        <div className="bg-slate-800/80 rounded-2xl p-3 border border-slate-700 max-h-40 overflow-y-auto space-y-1 text-left">
          <div className="text-[10px] font-bold uppercase tracking-wider text-slate-400 px-1 mb-1 flex items-center gap-1">
            <Award className="w-3.5 h-3.5" />
            <span>Full Rankings</span>
          </div>
          {leaderboard.map((p, idx) => (
            <div
              key={p.id}
              className="flex items-center justify-between py-1 px-2.5 rounded-lg bg-slate-900/60 text-xs"
            >
              <div className="flex items-center gap-2">
                <span className="font-bold text-slate-500 w-4 font-mono">#{idx + 1}</span>
                <span className="font-medium text-slate-200">{p.name}</span>
              </div>
              <span className="font-mono font-bold text-emerald-400">{p.score} pts</span>
            </div>
          ))}
        </div>

        {/* Action Button */}
        {isHost ? (
          <button
            type="button"
            onClick={onReturnToLobby}
            className="w-full py-3 rounded-2xl bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 text-white font-black text-sm uppercase tracking-wider shadow-lg hover:shadow-blue-500/25 transition-all flex items-center justify-center gap-2 cursor-pointer"
          >
            <RotateCcw className="w-4 h-4" />
            <span>Play Again (Return to Lobby)</span>
          </button>
        ) : (
          <p className="text-xs text-slate-400 italic">
            Waiting for host to return to lobby or start a new game...
          </p>
        )}
      </div>
    </div>
  );
};
