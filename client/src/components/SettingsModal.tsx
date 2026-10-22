import React, { useState } from 'react';
import { RoomSettings } from '../types/game';
import { Settings, Lock, Unlock, Check } from 'lucide-react';

interface SettingsModalProps {
  initialSettings: RoomSettings;
  onSave: (settings: RoomSettings) => void;
  onClose: () => void;
  isHost: boolean;
}

const CATEGORIES = [
  { id: 'all', label: 'All Categories (Mixed)' },
  { id: 'animals', label: 'Animals & Wildlife' },
  { id: 'food', label: 'Food & Drinks' },
  { id: 'objects', label: 'Everyday Objects' },
  { id: 'tech', label: 'Tech & Sci-Fi' },
  { id: 'actions', label: 'Actions & Verbs' },
  { id: 'places', label: 'Places & Nature' }
];

export const SettingsModal: React.FC<SettingsModalProps> = ({
  initialSettings,
  onSave,
  onClose,
  isHost
}) => {
  const [settings, setSettings] = useState<RoomSettings>(initialSettings);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!isHost) return onClose();
    onSave(settings);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-md p-4 animate-in fade-in">
      <div className="bg-slate-900 border border-slate-700/80 rounded-3xl p-6 max-w-lg w-full shadow-2xl text-left space-y-5 max-h-[90vh] overflow-y-auto">
        <div className="flex items-center justify-between border-b border-slate-800 pb-3">
          <h2 className="text-xl font-bold text-white flex items-center gap-2">
            <Settings className="w-5 h-5 text-blue-400" />
            <span>Room Settings</span>
          </h2>
          {!isHost && (
            <span className="text-xs bg-slate-800 text-slate-400 px-2 py-1 rounded-md">
              View Only
            </span>
          )}
        </div>

        <form onSubmit={handleSubmit} className="space-y-4 text-xs">
          {/* Rounds */}
          <div>
            <div className="flex justify-between font-semibold text-slate-300 mb-1">
              <label>Rounds</label>
              <span className="font-mono text-blue-400">{settings.rounds} rounds</span>
            </div>
            <input
              type="range"
              min={2}
              max={10}
              step={1}
              value={settings.rounds}
              disabled={!isHost}
              onChange={e => setSettings({ ...settings, rounds: Number(e.target.value) })}
              className="w-full accent-blue-500 cursor-pointer disabled:opacity-50"
            />
          </div>

          {/* Draw Time */}
          <div>
            <div className="flex justify-between font-semibold text-slate-300 mb-1">
              <label>Drawing Time</label>
              <span className="font-mono text-blue-400">{settings.drawTime}s</span>
            </div>
            <input
              type="range"
              min={15}
              max={240}
              step={5}
              value={settings.drawTime}
              disabled={!isHost}
              onChange={e => setSettings({ ...settings, drawTime: Number(e.target.value) })}
              className="w-full accent-blue-500 cursor-pointer disabled:opacity-50"
            />
          </div>

          {/* Max Players */}
          <div>
            <div className="flex justify-between font-semibold text-slate-300 mb-1">
              <label>Maximum Players</label>
              <span className="font-mono text-blue-400">{settings.maxPlayers} players</span>
            </div>
            <input
              type="range"
              min={2}
              max={20}
              step={1}
              value={settings.maxPlayers}
              disabled={!isHost}
              onChange={e => setSettings({ ...settings, maxPlayers: Number(e.target.value) })}
              className="w-full accent-blue-500 cursor-pointer disabled:opacity-50"
            />
          </div>

          {/* Word Choices Count */}
          <div>
            <div className="flex justify-between font-semibold text-slate-300 mb-1">
              <label>Word Choices per Turn</label>
              <span className="font-mono text-blue-400">{settings.wordCount} words</span>
            </div>
            <input
              type="range"
              min={1}
              max={5}
              step={1}
              value={settings.wordCount}
              disabled={!isHost}
              onChange={e => setSettings({ ...settings, wordCount: Number(e.target.value) })}
              className="w-full accent-blue-500 cursor-pointer disabled:opacity-50"
            />
          </div>

          {/* Hints Count */}
          <div>
            <div className="flex justify-between font-semibold text-slate-300 mb-1">
              <label>Revealed Hints</label>
              <span className="font-mono text-blue-400">
                {settings.hintsCount === 0 ? 'Disabled' : `${settings.hintsCount} hints`}
              </span>
            </div>
            <input
              type="range"
              min={0}
              max={5}
              step={1}
              value={settings.hintsCount}
              disabled={!isHost}
              onChange={e => setSettings({ ...settings, hintsCount: Number(e.target.value) })}
              className="w-full accent-blue-500 cursor-pointer disabled:opacity-50"
            />
          </div>

          {/* Category Selection */}
          <div>
            <label className="block font-semibold text-slate-300 mb-1">Word Category</label>
            <select
              value={settings.category}
              disabled={!isHost}
              onChange={e => setSettings({ ...settings, category: e.target.value })}
              className="w-full bg-slate-800 border border-slate-700 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:opacity-50"
            >
              {CATEGORIES.map(cat => (
                <option key={cat.id} value={cat.id}>
                  {cat.label}
                </option>
              ))}
            </select>
          </div>

          {/* Custom Words */}
          <div>
            <label className="block font-semibold text-slate-300 mb-1">
              Custom Word List (Comma-separated)
            </label>
            <textarea
              rows={2}
              placeholder="e.g. superhero, bitcoin, javascript, lightsaber"
              value={settings.customWords}
              disabled={!isHost}
              onChange={e => setSettings({ ...settings, customWords: e.target.value })}
              className="w-full bg-slate-800 border border-slate-700 rounded-xl px-3 py-2 text-xs text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:opacity-50"
            />
            <p className="text-[10px] text-slate-400 mt-0.5">
              Leave blank to use default categorized dictionary words.
            </p>
          </div>

          {/* Privacy Toggle */}
          <div className="flex items-center justify-between p-3 rounded-xl bg-slate-800/80 border border-slate-700">
            <div className="flex items-center gap-2">
              {settings.isPrivate ? (
                <Lock className="w-4 h-4 text-amber-400" />
              ) : (
                <Unlock className="w-4 h-4 text-emerald-400" />
              )}
              <div>
                <div className="font-semibold text-white">Private Room</div>
                <div className="text-[10px] text-slate-400">
                  {settings.isPrivate
                    ? 'Only people with the code/link can join'
                    : 'Visible in the public lobby room browser'}
                </div>
              </div>
            </div>
            <button
              type="button"
              disabled={!isHost}
              onClick={() => setSettings({ ...settings, isPrivate: !settings.isPrivate })}
              className={`w-11 h-6 rounded-full transition-colors p-1 cursor-pointer disabled:opacity-50 ${
                settings.isPrivate ? 'bg-amber-600' : 'bg-slate-700'
              }`}
            >
              <div
                className={`w-4 h-4 rounded-full bg-white transition-transform ${
                  settings.isPrivate ? 'translate-x-5' : 'translate-x-0'
                }`}
              />
            </button>
          </div>

          {/* Buttons */}
          <div className="flex items-center gap-2 pt-2">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 font-bold transition-colors cursor-pointer"
            >
              Cancel
            </button>
            {isHost && (
              <button
                type="submit"
                className="flex-1 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-500 text-white font-bold transition-all shadow-md flex items-center justify-center gap-1.5 cursor-pointer"
              >
                <Check className="w-4 h-4" />
                <span>Save Settings</span>
              </button>
            )}
          </div>
        </form>
      </div>
    </div>
  );
};
