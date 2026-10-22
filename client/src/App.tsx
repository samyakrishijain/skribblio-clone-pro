import React, { useState, useEffect, useRef } from 'react';
import { socket } from './lib/socket';
import {
  Player,
  RoomSettings,
  GamePhase,
  ChatMessage,
  DrawingAction,
  RoundScore,
  AvatarConfig,
  RoomSummary
} from './types/game';
import { AvatarDisplay } from './components/AvatarDisplay';
import { AvatarCreator } from './components/AvatarCreatorModal';
import { Canvas } from './components/Canvas';
import { DrawingTools } from './components/DrawingTools';
import { Chat } from './components/Chat';
import { Leaderboard } from './components/Leaderboard';
import { WordPickerModal } from './components/WordPickerModal';
import { RoundEndModal } from './components/RoundEndModal';
import { GameOverModal } from './components/GameOverModal';
import { SettingsModal } from './components/SettingsModal';
import { PublicRoomsModal } from './components/PublicRoomsModal';
import { soundManager } from './utils/SoundManager';
import { replayDrawingHistory } from './utils/canvasRenderer';
import {
  Sparkles,
  Volume2,
  VolumeX,
  Copy,
  Check,
  Settings as SettingsIcon,
  Play,
  LogOut,
  Users,
  Globe,
  PlusCircle,
  LogIn,
  Dices,
  Clock,
  Palette
} from 'lucide-react';

const RANDOM_NAMES = [
  'DoodleNinja', 'SketchKoala', 'PixelPanda', 'ArtisticPotato',
  'BrushHero', 'CosmicPainter', 'PencilWizard', 'VelvetFox'
];

export function App() {
  // User profile
  const [playerName, setPlayerName] = useState(() => {
    return localStorage.getItem('skribbl_name') || RANDOM_NAMES[Math.floor(Math.random() * RANDOM_NAMES.length)];
  });

  const [avatar, setAvatar] = useState<AvatarConfig>(() => {
    try {
      const saved = localStorage.getItem('skribbl_avatar');
      return saved ? JSON.parse(saved) : { color: '#3b82f6', eyes: 0, mouth: 0, accessory: 0 };
    } catch {
      return { color: '#3b82f6', eyes: 0, mouth: 0, accessory: 0 };
    }
  });

  // Room & Game state
  const [roomId, setRoomId] = useState('');
  const [joinInputCode, setJoinInputCode] = useState('');
  const [inRoom, setInRoom] = useState(false);
  const [currentUserId, setCurrentUserId] = useState('');
  const [players, setPlayers] = useState<Player[]>([]);
  const [phase, setPhase] = useState<GamePhase>('LOBBY');
  const [round, setRound] = useState(1);
  const [totalRounds, setTotalRounds] = useState(3);
  const [activeDrawerId, setActiveDrawerId] = useState<string | null>(null);
  const [activeDrawerName, setActiveDrawerName] = useState('');
  const [timer, setTimer] = useState(0);
  const [maskedWord, setMaskedWord] = useState('');
  const [myWord, setMyWord] = useState('');
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [closeGuessAlert, setCloseGuessAlert] = useState<string | null>(null);

  // Canvas state
  const [color, setColor] = useState('#000000');
  const [brushSize, setBrushSize] = useState(8);
  const [tool, setTool] = useState<'brush' | 'fill' | 'eraser'>('brush');
  const [canvasHistory, setCanvasHistory] = useState<DrawingAction[]>([]);
  const [drawerCursor, setDrawerCursor] = useState<{ x: number; y: number } | null>(null);

  // Modals & UI toggles
  const [wordChoices, setWordChoices] = useState<string[]>([]);
  const [roundEndData, setRoundEndData] = useState<{ word: string; scores: RoundScore[]; nextDrawer?: string; reason?: string; replayData?: DrawingAction[] } | null>(null);
  const [gameOverData, setGameOverData] = useState<{ leaderboard: Player[]; winner: Player | null } | null>(null);
  const [showSettingsModal, setShowSettingsModal] = useState(false);
  const [showAvatarModal, setShowAvatarModal] = useState(false);
  const [showPublicRooms, setShowPublicRooms] = useState(false);
  const [publicRooms, setPublicRooms] = useState<RoomSummary[]>([]);
  const [isLoadingRooms, setIsLoadingRooms] = useState(false);

  // Settings
  const [settings, setSettings] = useState<RoomSettings>({
    maxPlayers: 8,
    rounds: 3,
    drawTime: 80,
    wordCount: 3,
    hintsCount: 2,
    category: 'all',
    customWords: '',
    isPrivate: false
  });

  // Audio & feedback
  const [isMuted, setIsMuted] = useState(() => soundManager.getMuted());
  const [copiedLink, setCopiedLink] = useState(false);
  const [notification, setNotification] = useState<string | null>(null);

  const me = players.find(p => p.id === currentUserId);
  const isHost = me?.isHost || false;
  const isDrawer = activeDrawerId === currentUserId;
  const hasGuessed = me?.hasGuessed || false;

  const showToast = (text: string) => {
    setNotification(text);
    setTimeout(() => setNotification(null), 3500);
  };

  // Check URL query parameters for direct room invite link (?room=CODE)
  useEffect(() => {
    if (typeof window !== 'undefined') {
      const urlParams = new URLSearchParams(window.location.search);
      const codeFromUrl = urlParams.get('room');
      if (codeFromUrl) {
        setJoinInputCode(codeFromUrl.toUpperCase());
      }
    }
  }, []);

  // Save profile changes
  useEffect(() => {
    localStorage.setItem('skribbl_name', playerName);
    localStorage.setItem('skribbl_avatar', JSON.stringify(avatar));
  }, [playerName, avatar]);

  // Setup Socket Listeners
  useEffect(() => {
    socket.on('connect', () => {
      setCurrentUserId(socket.id || '');
    });

    socket.on('player_joined', (data: { player: Player; players: Player[] }) => {
      setPlayers(data.players);
      soundManager.playPop();
    });

    socket.on('player_left', (data: { playerId: string; players: Player[] }) => {
      setPlayers(data.players);
    });

    socket.on('host_changed', (data: { newHostId: string; newHostName: string }) => {
      showToast(`${data.newHostName} is now the room host!`);
    });

    socket.on('round_start', (data: { drawerId: string; drawerName: string; round: number; totalRounds: number; phase: GamePhase; drawTime: number }) => {
      setActiveDrawerId(data.drawerId);
      setActiveDrawerName(data.drawerName);
      setRound(data.round);
      setTotalRounds(data.totalRounds);
      setPhase('WORD_SELECTION');
      setMaskedWord('');
      setMyWord('');
      setRoundEndData(null);
      setGameOverData(null);
      setCanvasHistory([]);
      setDrawerCursor(null);
      soundManager.playPop();
    });

    socket.on('word_choices', (data: { words: string[]; timeLimit: number }) => {
      setWordChoices(data.words);
    });

    socket.on('word_chosen', (data: { drawerId: string; maskedWord: string; drawTime: number }) => {
      setWordChoices([]);
      setPhase('DRAWING');
      setMaskedWord(data.maskedWord);
      setTimer(data.drawTime);
      soundManager.playPop();
    });

    socket.on('your_word', (data: { word: string }) => {
      setMyWord(data.word);
    });

    socket.on('timer_tick', (data: { timeLeft: number }) => {
      setTimer(data.timeLeft);
      if (data.timeLeft <= 5 && data.timeLeft > 0) {
        soundManager.playTick();
      }
    });

    socket.on('hint_update', (data: { maskedWord: string }) => {
      setMaskedWord(data.maskedWord);
      soundManager.playPop();
    });

    socket.on('draw_data', (action: DrawingAction) => {
      setCanvasHistory(prev => [...prev, action]);
    });

    socket.on('canvas_clear', () => {
      setCanvasHistory([]);
    });

    socket.on('canvas_sync_history', (data: { history: DrawingAction[] }) => {
      setCanvasHistory(data.history);
    });

    socket.on('drawer_cursor', (pos: { x: number; y: number }) => {
      setDrawerCursor(pos);
    });

    socket.on('guess_result', (data: { correct: boolean; playerId: string; playerName: string; points: number; scores: Player[] }) => {
      if (data.correct) {
        soundManager.playCorrect();
        setPlayers(data.scores);
        setMessages(prev => [
          ...prev,
          {
            playerId: 'system',
            playerName: 'System',
            text: `🎉 ${data.playerName} guessed the word! (+${data.points} pts)`,
            type: 'system',
            timestamp: Date.now()
          }
        ]);
      }
    });

    socket.on('close_guess', (data: { text: string }) => {
      setCloseGuessAlert(data.text);
      setTimeout(() => setCloseGuessAlert(null), 3500);
    });

    socket.on('chat_message', (msg: ChatMessage) => {
      setMessages(prev => [...prev, msg]);
    });

    socket.on('round_end', (data: { word: string; reason?: string; scores: RoundScore[]; leaderboard: Player[]; nextDrawer?: string; replayData?: DrawingAction[] }) => {
      setPhase('ROUND_END');
      setPlayers(data.leaderboard);
      setRoundEndData({
        word: data.word,
        scores: data.scores,
        nextDrawer: data.nextDrawer,
        reason: data.reason,
        replayData: data.replayData
      });
      soundManager.playRoundEnd();
    });

    socket.on('game_over', (data: { leaderboard: Player[]; winner: Player | null; totalRounds: number }) => {
      setPhase('GAME_OVER');
      setPlayers(data.leaderboard);
      setGameOverData({
        leaderboard: data.leaderboard,
        winner: data.winner
      });
      soundManager.playVictory();
    });

    socket.on('room_settings_updated', (updatedSettings: RoomSettings) => {
      setSettings(updatedSettings);
      showToast('Room settings updated by host');
    });

    socket.on('returned_to_lobby', (data: { players: Player[]; settings: RoomSettings }) => {
      setPhase('LOBBY');
      setPlayers(data.players);
      setSettings(data.settings);
      setRoundEndData(null);
      setGameOverData(null);
      setWordChoices([]);
      setCanvasHistory([]);
      showToast('Game reset. Back in lobby!');
    });

    socket.on('kicked', (data: { reason: string }) => {
      alert(data.reason || 'You were kicked by the host.');
      window.location.href = '/';
    });

    socket.on('game_error', (data: { message: string }) => {
      showToast(`Error: ${data.message}`);
    });

    return () => {
      socket.off('connect');
      socket.off('player_joined');
      socket.off('player_left');
      socket.off('host_changed');
      socket.off('round_start');
      socket.off('word_choices');
      socket.off('word_chosen');
      socket.off('your_word');
      socket.off('timer_tick');
      socket.off('hint_update');
      socket.off('draw_data');
      socket.off('canvas_clear');
      socket.off('canvas_sync_history');
      socket.off('drawer_cursor');
      socket.off('guess_result');
      socket.off('close_guess');
      socket.off('chat_message');
      socket.off('round_end');
      socket.off('game_over');
      socket.off('room_settings_updated');
      socket.off('returned_to_lobby');
      socket.off('kicked');
      socket.off('game_error');
    };
  }, []);

  // Room Actions
  const handleCreateRoom = (isPrivateRoom = false) => {
    if (!playerName.trim()) return showToast('Please enter your player name!');

    if (!socket.connected) socket.connect();

    const roomPayload = {
      hostName: playerName.trim(),
      avatar,
      settings: {
        ...settings,
        isPrivate: isPrivateRoom
      }
    };

    socket.emit('create_room', roomPayload, (res: { success: boolean; roomId?: string; message?: string; roomState?: any }) => {
      if (res.success && res.roomId) {
        setRoomId(res.roomId);
        setInRoom(true);
        if (res.roomState) {
          setPlayers(res.roomState.players);
          setSettings(res.roomState.settings);
          setPhase(res.roomState.phase);
        }
        // Update URL without reload
        window.history.pushState({}, '', `?room=${res.roomId}`);
        showToast(`Room created! Code: ${res.roomId}`);
      } else {
        showToast(res.message || 'Failed to create room');
      }
    });
  };

  const handleJoinRoom = (codeToJoin?: string) => {
    const targetCode = (codeToJoin || joinInputCode).toUpperCase().trim();
    if (!playerName.trim()) return showToast('Please enter your player name!');
    if (!targetCode) return showToast('Please enter a 6-character room code!');

    if (!socket.connected) socket.connect();

    socket.emit('join_room', {
      roomId: targetCode,
      playerName: playerName.trim(),
      avatar
    }, (res: { success: boolean; roomId?: string; message?: string; roomState?: any }) => {
      if (res.success && res.roomId) {
        setRoomId(res.roomId);
        setInRoom(true);
        setShowPublicRooms(false);
        if (res.roomState) {
          setPlayers(res.roomState.players);
          setSettings(res.roomState.settings);
          setPhase(res.roomState.phase);
          setRound(res.roomState.round);
          setTotalRounds(res.roomState.totalRounds);
          setActiveDrawerId(res.roomState.activeDrawerId);
          setTimer(res.roomState.timer);
          setMaskedWord(res.roomState.maskedWord);
          setMyWord(res.roomState.targetWord);
          setCanvasHistory(res.roomState.canvasHistory || []);
        }
        window.history.pushState({}, '', `?room=${res.roomId}`);
        showToast(`Joined Room ${res.roomId}!`);
      } else {
        showToast(res.message || 'Room not found');
      }
    });
  };

  const handleStartGame = () => {
    if (!isHost) return;
    socket.emit('start_game', { roomId }, (res: { success: boolean; message?: string }) => {
      if (!res?.success && res?.message) {
        showToast(res.message);
      }
    });
  };

  const handleSaveSettings = (newSettings: RoomSettings) => {
    socket.emit('update_settings', { roomId, settings: newSettings });
  };

  const handleReturnToLobby = () => {
    socket.emit('return_to_lobby', { roomId });
  };

  const handleKickPlayer = (targetId: string) => {
    socket.emit('kick_player', { roomId, targetPlayerId: targetId });
  };

  const handleLeaveRoom = () => {
    socket.disconnect();
    setInRoom(false);
    setRoomId('');
    setPhase('LOBBY');
    setMessages([]);
    setCanvasHistory([]);
    window.history.pushState({}, '', window.location.pathname);
  };

  const fetchPublicRooms = () => {
    setIsLoadingRooms(true);
    if (!socket.connected) socket.connect();
    socket.emit('get_public_rooms', {}, (res: { success: boolean; rooms: RoomSummary[] }) => {
      setIsLoadingRooms(false);
      if (res.success) {
        setPublicRooms(res.rooms);
      }
    });
  };

  // Drawing Emitters
  const handleEmitAction = (action: DrawingAction) => {
    setCanvasHistory(prev => [...prev, action]);
    socket.emit('draw_stroke', { roomId, action });
  };

  const handleEmitCursor = (pos: { x: number; y: number }) => {
    socket.emit('draw_cursor', { roomId, ...pos });
  };

  const handleUndo = () => {
    socket.emit('draw_undo', { roomId });
  };

  const handleClear = () => {
    setCanvasHistory([]);
    socket.emit('canvas_clear', { roomId });
  };

  const handleSelectWord = (word: string) => {
    socket.emit('choose_word', { roomId, word });
  };

  const handleSendMessage = (text: string) => {
    socket.emit('chat_or_guess', { roomId, text });
  };

  const copyRoomLink = () => {
    const inviteUrl = `${window.location.origin}${window.location.pathname}?room=${roomId}`;
    navigator.clipboard.writeText(inviteUrl);
    setCopiedLink(true);
    showToast('Room invite link copied to clipboard!');
    setTimeout(() => setCopiedLink(false), 2500);
  };

  const toggleSound = () => {
    const muted = soundManager.toggleMute();
    setIsMuted(muted);
    showToast(muted ? 'Sound muted' : 'Sound unmuted');
  };

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col font-sans select-none">
      {/* Toast Notification Banner */}
      {notification && (
        <div className="fixed top-4 right-4 z-50 bg-blue-600/90 text-white px-4 py-2.5 rounded-2xl shadow-2xl backdrop-blur-md border border-blue-400/40 text-xs font-bold animate-in slide-in-from-top-4 flex items-center gap-2">
          <Sparkles className="w-4 h-4 text-blue-200" />
          <span>{notification}</span>
        </div>
      )}

      {/* Top Navbar */}
      <header className="h-16 border-b border-slate-800 bg-slate-900/80 backdrop-blur-md px-4 flex items-center justify-between z-30 shrink-0">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-2xl bg-gradient-to-tr from-blue-600 via-indigo-600 to-purple-600 flex items-center justify-center shadow-lg shadow-blue-500/20">
            <Palette className="w-6 h-6 text-white" />
          </div>
          <div>
            <h1 className="text-xl font-black tracking-tight text-white flex items-center gap-1.5">
              <span>skribbl</span>
              <span className="text-transparent bg-clip-text bg-gradient-to-r from-blue-400 to-indigo-400 font-extrabold text-xs px-1.5 py-0.5 rounded-md bg-blue-500/10 border border-blue-500/20">
                PRO
              </span>
            </h1>
            <p className="text-[10px] text-slate-400 hidden sm:block">Real-time Multiplayer Drawing Game</p>
          </div>
        </div>

        {/* Center Game Header Info (When In Room) */}
        {inRoom && phase !== 'LOBBY' && (
          <div className="flex items-center gap-4 bg-slate-800/80 px-4 py-1.5 rounded-2xl border border-slate-700 shadow-inner">
            {/* Round info */}
            <div className="flex items-center gap-1.5 text-xs font-extrabold text-slate-300">
              <span className="text-slate-500 uppercase text-[10px] tracking-wider">Round</span>
              <span className="text-white font-mono">{round} / {totalRounds}</span>
            </div>

            <div className="h-4 w-px bg-slate-700" />

            {/* Timer countdown */}
            <div className={`flex items-center gap-1.5 font-mono font-black text-sm px-2.5 py-0.5 rounded-xl border ${
              timer <= 10
                ? 'bg-red-500/20 border-red-500/40 text-red-400 animate-pulse'
                : 'bg-slate-900/60 border-slate-700 text-amber-400'
            }`}>
              <Clock className="w-3.5 h-3.5" />
              <span>{timer}s</span>
            </div>

            <div className="h-4 w-px bg-slate-700" />

            {/* Target Word / Masked Blanks */}
            <div className="text-center">
              {isDrawer ? (
                <div className="flex items-center gap-2">
                  <span className="text-[10px] font-bold text-amber-400 uppercase tracking-widest">Draw:</span>
                  <span className="font-black text-emerald-400 uppercase tracking-wider text-sm">
                    {myWord || 'Choosing...'}
                  </span>
                </div>
              ) : (
                <div className="flex items-center gap-2">
                  <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Word:</span>
                  <span className="font-mono font-black text-white text-base tracking-widest">
                    {maskedWord || '_ _ _ _'}
                  </span>
                </div>
              )}
            </div>
          </div>
        )}

        {/* Right Header Controls */}
        <div className="flex items-center gap-2">
          {inRoom && (
            <button
              type="button"
              onClick={copyRoomLink}
              title="Copy Room Link"
              className="hidden sm:flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 border border-slate-700 text-xs font-bold text-slate-200 transition-colors cursor-pointer"
            >
              {copiedLink ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
              <span>{roomId}</span>
            </button>
          )}

          <button
            type="button"
            onClick={toggleSound}
            title={isMuted ? 'Unmute Audio' : 'Mute Audio'}
            className="p-2 rounded-xl bg-slate-800 hover:bg-slate-700 border border-slate-700 text-slate-300 transition-colors cursor-pointer"
          >
            {isMuted ? <VolumeX className="w-4 h-4 text-rose-400" /> : <Volume2 className="w-4 h-4 text-emerald-400" />}
          </button>

          {inRoom && (
            <button
              type="button"
              onClick={handleLeaveRoom}
              title="Leave Room"
              className="p-2 rounded-xl bg-rose-500/10 hover:bg-rose-500/20 border border-rose-500/30 text-rose-400 transition-colors cursor-pointer"
            >
              <LogOut className="w-4 h-4" />
            </button>
          )}
        </div>
      </header>

      {/* Main Container */}
      <main className="flex-1 p-3 sm:p-5 flex flex-col max-w-7xl w-full mx-auto overflow-hidden">
        {!inRoom ? (
          /* ========================================== */
          /* HOME LANDING SCREEN                        */
          /* ========================================== */
          <div className="flex-1 flex flex-col items-center justify-center max-w-md w-full mx-auto space-y-6">
            {/* Title / Banner */}
            <div className="text-center space-y-2">
              <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-blue-500/10 border border-blue-500/20 text-blue-400 text-xs font-bold">
                <Sparkles className="w-3.5 h-3.5" />
                <span>God-Level Pictionary Experience</span>
              </div>
              <h2 className="text-4xl font-black text-white tracking-tight">
                Play, Draw & Guess!
              </h2>
              <p className="text-xs text-slate-400">
                Join thousands in real-time online sketch battles. Fast, fun, and fully synchronized.
              </p>
            </div>

            {/* Profile & Avatar Customizer Box */}
            <div className="w-full bg-slate-900/90 border border-slate-800 rounded-3xl p-6 shadow-2xl backdrop-blur-md space-y-4">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold uppercase tracking-wider text-slate-400">Player Profile</span>
                <button
                  type="button"
                  onClick={() => setShowAvatarModal(true)}
                  className="text-xs font-bold text-blue-400 hover:text-blue-300 transition-colors cursor-pointer flex items-center gap-1"
                >
                  <span>Edit Avatar</span>
                  <Palette className="w-3.5 h-3.5" />
                </button>
              </div>

              {/* Avatar Centerpiece */}
              <div className="flex items-center gap-4 bg-slate-950/60 p-3 rounded-2xl border border-slate-800">
                <button
                  type="button"
                  onClick={() => setShowAvatarModal(true)}
                  title="Click to customize avatar"
                  className="cursor-pointer hover:scale-105 transition-transform"
                >
                  <AvatarDisplay avatar={avatar} size={64} animate />
                </button>

                <div className="flex-1 space-y-1">
                  <label className="text-[10px] font-bold uppercase tracking-wider text-slate-500">Your Nickname</label>
                  <div className="flex items-center gap-1.5">
                    <input
                      type="text"
                      maxLength={18}
                      value={playerName}
                      onChange={e => setPlayerName(e.target.value)}
                      placeholder="Enter your name..."
                      className="w-full bg-slate-900 border border-slate-700 rounded-xl px-3 py-1.5 text-sm font-bold text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                    />
                    <button
                      type="button"
                      onClick={() => setPlayerName(RANDOM_NAMES[Math.floor(Math.random() * RANDOM_NAMES.length)])}
                      title="Random Name"
                      className="p-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 transition-colors cursor-pointer"
                    >
                      <Dices className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              </div>

              {/* Action Buttons */}
              <div className="space-y-2.5 pt-2">
                <button
                  type="button"
                  onClick={() => handleCreateRoom(false)}
                  className="w-full py-3.5 rounded-2xl bg-gradient-to-r from-blue-600 via-indigo-600 to-purple-600 hover:from-blue-500 hover:to-purple-500 text-white font-extrabold text-sm uppercase tracking-wider shadow-lg shadow-blue-500/25 transition-all flex items-center justify-center gap-2 cursor-pointer"
                >
                  <PlusCircle className="w-5 h-5" />
                  <span>Create New Room</span>
                </button>

                {/* Join Code Box */}
                <div className="flex items-center gap-2 pt-1">
                  <input
                    type="text"
                    maxLength={6}
                    value={joinInputCode}
                    onChange={e => setJoinInputCode(e.target.value.toUpperCase())}
                    placeholder="ENTER 6-CHAR CODE"
                    className="flex-1 bg-slate-950 border border-slate-700 rounded-2xl px-4 py-3 text-xs font-mono font-bold tracking-widest uppercase text-white placeholder-slate-600 focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                  <button
                    type="button"
                    onClick={() => handleJoinRoom()}
                    className="px-5 py-3 rounded-2xl bg-emerald-600 hover:bg-emerald-500 text-white font-extrabold text-xs uppercase tracking-wider transition-all shadow-md flex items-center gap-1.5 cursor-pointer shrink-0"
                  >
                    <LogIn className="w-4 h-4" />
                    <span>Join</span>
                  </button>
                </div>

                {/* Browse Public Rooms */}
                <button
                  type="button"
                  onClick={() => {
                    fetchPublicRooms();
                    setShowPublicRooms(true);
                  }}
                  className="w-full py-2.5 rounded-2xl bg-slate-800/80 hover:bg-slate-800 border border-slate-700/80 text-slate-300 hover:text-white font-bold text-xs transition-colors flex items-center justify-center gap-2 cursor-pointer"
                >
                  <Globe className="w-4 h-4 text-emerald-400" />
                  <span>Browse Public Rooms</span>
                </button>
              </div>
            </div>
          </div>
        ) : phase === 'LOBBY' ? (
          /* ========================================== */
          /* ROOM LOBBY SCREEN                          */
          /* ========================================== */
          <div className="flex-1 flex flex-col lg:flex-row gap-5 max-w-6xl w-full mx-auto">
            {/* Left: Players Roster & Start Game */}
            <div className="flex-1 bg-slate-900/90 border border-slate-800 rounded-3xl p-6 shadow-2xl backdrop-blur-md flex flex-col justify-between space-y-6">
              <div className="space-y-4">
                {/* Lobby Header */}
                <div className="flex flex-wrap items-center justify-between gap-3 border-b border-slate-800 pb-4">
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="text-xs font-bold uppercase tracking-wider text-slate-400">Room Code</span>
                      <span className="font-mono text-xl font-black text-transparent bg-clip-text bg-gradient-to-r from-blue-400 to-indigo-400">
                        {roomId}
                      </span>
                    </div>
                    <p className="text-xs text-slate-400">Share this code with your friends to play together!</p>
                  </div>

                  <div className="flex items-center gap-2">
                    <button
                      type="button"
                      onClick={copyRoomLink}
                      className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-blue-600/20 text-blue-400 hover:bg-blue-600/30 border border-blue-500/30 text-xs font-bold transition-all cursor-pointer"
                    >
                      {copiedLink ? <Check className="w-4 h-4 text-emerald-400" /> : <Copy className="w-4 h-4" />}
                      <span>Copy Invite Link</span>
                    </button>

                    <button
                      type="button"
                      onClick={() => setShowSettingsModal(true)}
                      className="p-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 border border-slate-700 transition-colors cursor-pointer"
                      title="Room Settings"
                    >
                      <SettingsIcon className="w-4 h-4" />
                    </button>
                  </div>
                </div>

                {/* Player Grid */}
                <div>
                  <div className="flex items-center justify-between mb-3">
                    <h3 className="text-xs font-bold uppercase tracking-wider text-slate-400 flex items-center gap-1.5">
                      <Users className="w-4 h-4" />
                      <span>Players in Lobby ({players.length}/{settings.maxPlayers})</span>
                    </h3>
                  </div>

                  <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3">
                    {players.map(player => (
                      <div
                        key={player.id}
                        className={`p-3 rounded-2xl border flex flex-col items-center text-center space-y-2 relative transition-all ${
                          player.id === currentUserId
                            ? 'bg-blue-950/40 border-blue-500/40 ring-1 ring-blue-500/30'
                            : 'bg-slate-800/60 border-slate-700/60'
                        }`}
                      >
                        <AvatarDisplay avatar={player.avatar} size={52} animate />
                        <div className="w-full">
                          <div className="font-bold text-xs text-white truncate flex items-center justify-center gap-1">
                            <span>{player.name}</span>
                            {player.isHost && (
                              <span className="text-[10px] bg-amber-500/20 text-amber-300 px-1 rounded border border-amber-500/30">
                                Host
                              </span>
                            )}
                          </div>
                        </div>

                        {/* Kick button for host */}
                        {isHost && player.id !== currentUserId && (
                          <button
                            type="button"
                            onClick={() => handleKickPlayer(player.id)}
                            title={`Kick ${player.name}`}
                            className="absolute top-2 right-2 text-slate-500 hover:text-red-400 transition-colors cursor-pointer text-xs"
                          >
                            ×
                          </button>
                        )}
                      </div>
                    ))}
                  </div>
                </div>
              </div>

              {/* Start Game Footer */}
              <div className="pt-4 border-t border-slate-800 flex items-center justify-between gap-4">
                <div className="text-xs text-slate-400">
                  {isHost ? (
                    players.length < 2 ? (
                      <span className="text-amber-400 font-medium">Waiting for at least 2 players to start...</span>
                    ) : (
                      <span className="text-emerald-400 font-medium">Ready to begin! Click Start Game.</span>
                    )
                  ) : (
                    <span>Waiting for the room host to start the game...</span>
                  )}
                </div>

                {isHost && (
                  <button
                    type="button"
                    onClick={handleStartGame}
                    disabled={players.length < 2 && !import.meta.env.DEV}
                    className="px-6 py-3 rounded-2xl bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 disabled:bg-slate-800 disabled:text-slate-500 text-white font-black text-sm uppercase tracking-wider transition-all shadow-lg flex items-center gap-2 cursor-pointer disabled:cursor-not-allowed"
                  >
                    <Play className="w-4 h-4 fill-current" />
                    <span>Start Game</span>
                  </button>
                )}
              </div>
            </div>

            {/* Right: Lobby Chat Stream */}
            <div className="w-full lg:w-80 h-96 lg:h-auto">
              <Chat
                messages={messages}
                isDrawer={false}
                hasGuessed={false}
                isDrawingPhase={false}
                closeGuessAlert={null}
                onSendMessage={handleSendMessage}
              />
            </div>
          </div>
        ) : (
          /* ========================================== */
          /* ACTIVE GAMEPLAY SCREEN                     */
          /* ========================================== */
          <div className="flex-1 grid grid-cols-1 lg:grid-cols-12 gap-4 h-full overflow-hidden">
            {/* Left Column: Leaderboard (Cols 3) */}
            <div className="lg:col-span-3 h-48 lg:h-full overflow-hidden">
              <Leaderboard
                players={players}
                activeDrawerId={activeDrawerId}
                isHost={isHost}
                currentUserId={currentUserId}
                onKickPlayer={handleKickPlayer}
              />
            </div>

            {/* Center Column: Canvas + Drawing Tools (Cols 6) */}
            <div className="lg:col-span-6 flex flex-col gap-3 h-full overflow-hidden">
              {/* Responsive Canvas */}
              <div className="flex-1 flex items-center justify-center min-h-0">
                <Canvas
                  isDrawer={isDrawer}
                  canDraw={phase === 'DRAWING'}
                  color={color}
                  brushSize={brushSize}
                  tool={tool}
                  history={canvasHistory}
                  drawerCursor={drawerCursor}
                  drawerName={activeDrawerName}
                  onEmitAction={handleEmitAction}
                  onEmitCursor={handleEmitCursor}
                />
              </div>

              {/* Drawing Tools (Only visible to Drawer) */}
              {isDrawer && phase === 'DRAWING' ? (
                <DrawingTools
                  color={color}
                  setColor={setColor}
                  brushSize={brushSize}
                  setBrushSize={setBrushSize}
                  tool={tool}
                  setTool={setTool}
                  onUndo={handleUndo}
                  onClear={handleClear}
                />
              ) : (
                <div className="p-3 bg-slate-900/60 border border-slate-800 rounded-2xl text-center text-xs text-slate-400 font-medium">
                  {phase === 'DRAWING' ? (
                    <span>
                      <strong className="text-white">{activeDrawerName}</strong> is drawing! Guess the word in the chat on the right.
                    </span>
                  ) : (
                    <span>Waiting for next turn...</span>
                  )}
                </div>
              )}
            </div>

            {/* Right Column: Chat & Guessing (Cols 3) */}
            <div className="lg:col-span-3 h-64 lg:h-full overflow-hidden">
              <Chat
                messages={messages}
                isDrawer={isDrawer}
                hasGuessed={hasGuessed}
                isDrawingPhase={phase === 'DRAWING'}
                closeGuessAlert={closeGuessAlert}
                onSendMessage={handleSendMessage}
              />
            </div>
          </div>
        )}
      </main>

      {/* MODALS */}
      {/* 1. Word Picker Modal (Drawer only) */}
      {isDrawer && phase === 'WORD_SELECTION' && wordChoices.length > 0 && (
        <WordPickerModal
          words={wordChoices}
          timeLeft={timer}
          onSelectWord={handleSelectWord}
        />
      )}

      {/* 2. Round End Modal */}
      {phase === 'ROUND_END' && roundEndData && (
        <RoundEndModal
          word={roundEndData.word}
          scores={roundEndData.scores}
          nextDrawer={roundEndData.nextDrawer}
          reason={roundEndData.reason}
          replayData={roundEndData.replayData}
          onReplayDrawing={(history) => {
            const canvas = document.querySelector('canvas');
            if (canvas) {
              const ctx = canvas.getContext('2d');
              if (ctx) replayDrawingHistory(ctx, history, 4);
            }
          }}
        />
      )}

      {/* 3. Game Over Modal */}
      {phase === 'GAME_OVER' && gameOverData && (
        <GameOverModal
          leaderboard={gameOverData.leaderboard}
          winner={gameOverData.winner}
          isHost={isHost}
          onReturnToLobby={handleReturnToLobby}
        />
      )}

      {/* 4. Avatar Creator Modal */}
      {showAvatarModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-md p-4">
          <AvatarCreator
            avatar={avatar}
            onChange={setAvatar}
            onClose={() => setShowAvatarModal(false)}
          />
        </div>
      )}

      {/* 5. Room Settings Modal */}
      {showSettingsModal && (
        <SettingsModal
          initialSettings={settings}
          onSave={handleSaveSettings}
          onClose={() => setShowSettingsModal(false)}
          isHost={isHost}
        />
      )}

      {/* 6. Public Rooms Browser Modal */}
      {showPublicRooms && (
        <PublicRoomsModal
          rooms={publicRooms}
          isLoading={isLoadingRooms}
          onRefresh={fetchPublicRooms}
          onJoinRoom={(code) => handleJoinRoom(code)}
          onClose={() => setShowPublicRooms(false)}
        />
      )}
    </div>
  );
}

export default App;
