export interface AvatarConfig {
  color: string;
  eyes: number;
  mouth: number;
  accessory: number;
}

export interface Player {
  id: string;
  name: string;
  avatar: AvatarConfig;
  score: number;
  roundScore: number;
  isHost: boolean;
  isReady: boolean;
  isDrawing: boolean;
  hasGuessed: boolean;
}

export interface RoomSettings {
  maxPlayers: number;
  rounds: number;
  drawTime: number;
  wordCount: number;
  hintsCount: number;
  category: string;
  customWords: string;
  isPrivate: boolean;
}

export type GamePhase = 'LOBBY' | 'WORD_SELECTION' | 'DRAWING' | 'ROUND_END' | 'GAME_OVER';

export interface ChatMessage {
  id?: string;
  playerId: string;
  playerName: string;
  avatar?: AvatarConfig;
  text: string;
  type: 'chat' | 'system' | 'guessed_chat';
  timestamp?: number;
}

export interface Point {
  x: number;
  y: number;
}

export interface DrawingAction {
  type: 'brush' | 'fill' | 'clear';
  points?: Point[];
  color?: string;
  size?: number;
  x?: number; // for flood fill normalized x (0..1)
  y?: number; // for flood fill normalized y (0..1)
  timestamp?: number;
}

export interface RoundScore {
  id: string;
  name: string;
  roundScore: number;
  totalScore: number;
}

export interface RoomSummary {
  id: string;
  playerCount: number;
  maxPlayers: number;
  rounds: number;
  category: string;
  phase: string;
  isPrivate: boolean;
  createdAt: number;
}
