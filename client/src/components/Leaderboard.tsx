import React from 'react';
import { Player } from '../types/game';
import { AvatarDisplay } from './AvatarDisplay';
import { Crown, Pencil, CheckCircle2, UserX } from 'lucide-react';

interface LeaderboardProps {
  players: Player[];
  activeDrawerId?: string | null;
  isHost: boolean;
  currentUserId: string;
  onKickPlayer?: (playerId: string) => void;
}

export const Leaderboard: React.FC<LeaderboardProps> = ({
  players,
  activeDrawerId,
  isHost,
  currentUserId,
  onKickPlayer
}) => {
  // Sort players descending by score
  const sorted = [...players].sort((a, b) => b.score - a.score);

  return (
    <div className="bg-slate-900/90 border border-slate-700/80 rounded-2xl p-3 shadow-xl backdrop-blur-md flex flex-col h-full">
      <div className="flex items-center justify-between pb-2 mb-2 border-b border-slate-800">
        <h3 className="text-xs font-bold uppercase tracking-wider text-slate-400">
          Players ({players.length})
        </h3>
        <span className="text-[10px] text-slate-500 font-semibold">Live Scores</span>
      </div>

      <div className="space-y-1.5 overflow-y-auto flex-1 pr-1">
        {sorted.map((player, index) => {
          const isDrawer = player.id === activeDrawerId;
          const isMe = player.id === currentUserId;

          return (
            <div
              key={player.id}
              className={`flex items-center justify-between p-2 rounded-xl border transition-all ${
                isMe
                  ? 'bg-blue-950/40 border-blue-500/40 ring-1 ring-blue-500/30'
                  : 'bg-slate-800/60 border-slate-700/60 hover:bg-slate-800'
              }`}
            >
              <div className="flex items-center gap-2 min-w-0">
                {/* Rank number or medal */}
                <div className="w-5 text-center font-black text-xs shrink-0">
                  {index === 0 && <span className="text-amber-400 text-sm">🥇</span>}
                  {index === 1 && <span className="text-slate-300 text-sm">🥈</span>}
                  {index === 2 && <span className="text-amber-600 text-sm">🥉</span>}
                  {index > 2 && <span className="text-slate-500 font-mono">#{index + 1}</span>}
                </div>

                {/* Avatar */}
                <AvatarDisplay avatar={player.avatar} size={32} />

                {/* Name & Indicators */}
                <div className="min-w-0">
                  <div className="flex items-center gap-1.5">
                    <span className={`text-xs font-bold truncate ${isMe ? 'text-blue-300' : 'text-white'}`}>
                      {player.name}
                    </span>
                    {player.isHost && (
                      <span title="Host">
                        <Crown className="w-3.5 h-3.5 text-amber-400 shrink-0" />
                      </span>
                    )}
                  </div>

                  <div className="flex items-center gap-1.5 mt-0.5">
                    <span className="text-[11px] font-mono font-semibold text-emerald-400">
                      {player.score} pts
                    </span>

                    {/* Round score popup */}
                    {player.roundScore > 0 && (
                      <span className="text-[10px] font-bold text-emerald-300 bg-emerald-500/20 px-1 rounded animate-pulse">
                        +{player.roundScore}
                      </span>
                    )}
                  </div>
                </div>
              </div>

              {/* Status Icons */}
              <div className="flex items-center gap-1.5 shrink-0 ml-2">
                {isDrawer && (
                  <div className="flex items-center gap-1 bg-amber-500/20 text-amber-300 px-1.5 py-0.5 rounded-md text-[10px] font-bold border border-amber-500/30 animate-pulse">
                    <Pencil className="w-3 h-3" />
                    <span>Drawing</span>
                  </div>
                )}

                {player.hasGuessed && !isDrawer && (
                  <div className="text-emerald-400" title="Guessed the word!">
                    <CheckCircle2 className="w-4 h-4" />
                  </div>
                )}

                {/* Kick Button for Host */}
                {isHost && !isMe && onKickPlayer && (
                  <button
                    type="button"
                    onClick={() => onKickPlayer(player.id)}
                    title={`Kick ${player.name}`}
                    className="p-1 text-slate-500 hover:text-red-400 hover:bg-red-500/10 rounded-md transition-colors cursor-pointer"
                  >
                    <UserX className="w-3.5 h-3.5" />
                  </button>
                )}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};
