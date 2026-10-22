import React from 'react';
import { RoomSummary } from '../types/game';
import { Globe, Users, ArrowRight, RefreshCw, X } from 'lucide-react';

interface PublicRoomsModalProps {
  rooms: RoomSummary[];
  onRefresh: () => void;
  onJoinRoom: (roomId: string) => void;
  onClose: () => void;
  isLoading?: boolean;
}

export const PublicRoomsModal: React.FC<PublicRoomsModalProps> = ({
  rooms,
  onRefresh,
  onJoinRoom,
  onClose,
  isLoading = false
}) => {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-md p-4 animate-in fade-in">
      <div className="bg-slate-900 border border-slate-700/80 rounded-3xl p-6 max-w-lg w-full shadow-2xl text-left space-y-4 max-h-[85vh] flex flex-col">
        <div className="flex items-center justify-between border-b border-slate-800 pb-3">
          <div className="flex items-center gap-2">
            <Globe className="w-5 h-5 text-emerald-400" />
            <h2 className="text-xl font-bold text-white">Public Rooms Browser</h2>
          </div>
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={onRefresh}
              disabled={isLoading}
              title="Refresh List"
              className="p-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 transition-colors cursor-pointer"
            >
              <RefreshCw className={`w-4 h-4 ${isLoading ? 'animate-spin' : ''}`} />
            </button>
            <button
              type="button"
              onClick={onClose}
              className="p-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 transition-colors cursor-pointer"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>

        <div className="flex-1 overflow-y-auto space-y-2 pr-1">
          {rooms.length === 0 ? (
            <div className="text-center py-12 text-slate-400 text-xs space-y-2">
              <Globe className="w-8 h-8 text-slate-600 mx-auto" />
              <p>No active public rooms found.</p>
              <p className="text-[11px] text-slate-500">
                Create a new public room or invite friends to your own room!
              </p>
            </div>
          ) : (
            rooms.map(room => (
              <div
                key={room.id}
                className="flex items-center justify-between p-3 rounded-2xl bg-slate-800/80 border border-slate-700/80 hover:border-slate-600 transition-all"
              >
                <div className="space-y-1">
                  <div className="flex items-center gap-2">
                    <span className="font-mono font-bold text-white text-sm tracking-wider">
                      {room.id}
                    </span>
                    <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-blue-500/10 text-blue-400 border border-blue-500/20 capitalize">
                      {room.category}
                    </span>
                    <span className="text-[10px] text-slate-400">
                      {room.rounds} Rnds
                    </span>
                  </div>

                  <div className="flex items-center gap-2 text-xs text-slate-400">
                    <span className="flex items-center gap-1">
                      <Users className="w-3.5 h-3.5 text-slate-400" />
                      <span>{room.playerCount} / {room.maxPlayers} players</span>
                    </span>
                    <span className="text-slate-600">•</span>
                    <span className="capitalize text-emerald-400 font-medium">
                      {room.phase === 'LOBBY' ? 'In Lobby' : 'In Game'}
                    </span>
                  </div>
                </div>

                <button
                  type="button"
                  onClick={() => onJoinRoom(room.id)}
                  disabled={room.playerCount >= room.maxPlayers}
                  className="px-3.5 py-2 bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 disabled:bg-slate-700 text-white text-xs font-bold rounded-xl transition-all shadow-md flex items-center gap-1.5 cursor-pointer disabled:cursor-not-allowed"
                >
                  <span>{room.playerCount >= room.maxPlayers ? 'Full' : 'Join'}</span>
                  <ArrowRight className="w-3.5 h-3.5" />
                </button>
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );
};
