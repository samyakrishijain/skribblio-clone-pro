import React, { useState, useRef, useEffect } from 'react';
import { ChatMessage } from '../types/game';
import { AvatarDisplay } from './AvatarDisplay';
import { Send, CheckCircle2, AlertCircle } from 'lucide-react';

interface ChatProps {
  messages: ChatMessage[];
  isDrawer: boolean;
  hasGuessed: boolean;
  isDrawingPhase: boolean;
  closeGuessAlert: string | null;
  onSendMessage: (text: string) => void;
}

export const Chat: React.FC<ChatProps> = ({
  messages,
  isDrawer,
  hasGuessed,
  isDrawingPhase,
  closeGuessAlert,
  onSendMessage
}) => {
  const [inputText, setInputText] = useState('');
  const chatBottomRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    chatBottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, closeGuessAlert]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!inputText.trim()) return;
    if (isDrawer && isDrawingPhase) return;

    onSendMessage(inputText.trim());
    setInputText('');
  };

  const getPlaceholder = () => {
    if (isDrawingPhase) {
      if (isDrawer) return 'You are drawing! Cannot guess.';
      if (hasGuessed) return 'You guessed it! Chat with other winners...';
      return 'Type your guess here...';
    }
    return 'Send a message...';
  };

  return (
    <div className="flex flex-col h-full bg-slate-900/90 border border-slate-700/80 rounded-2xl shadow-xl overflow-hidden backdrop-blur-md">
      {/* Chat Header */}
      <div className="px-4 py-3 bg-slate-800/80 border-b border-slate-700/80 flex items-center justify-between">
        <h3 className="font-bold text-white text-sm flex items-center gap-2">
          <span>Game Chat & Guesses</span>
        </h3>
        {hasGuessed && (
          <span className="flex items-center gap-1 text-[11px] font-bold text-emerald-400 bg-emerald-500/10 px-2 py-0.5 rounded-full border border-emerald-500/20">
            <CheckCircle2 className="w-3 h-3" />
            <span>Guessed</span>
          </span>
        )}
      </div>

      {/* Message Stream */}
      <div className="flex-1 p-3 overflow-y-auto space-y-2 text-xs">
        {messages.map((msg, index) => {
          if (msg.type === 'system') {
            return (
              <div
                key={index}
                className="py-1 px-2.5 rounded-lg bg-amber-500/10 border border-amber-500/20 text-amber-300 text-center font-medium my-1"
              >
                {msg.text}
              </div>
            );
          }

          if (msg.type === 'guessed_chat') {
            return (
              <div
                key={index}
                className="flex items-start gap-2 p-1.5 rounded-lg bg-emerald-950/40 border border-emerald-500/30 text-emerald-200"
              >
                {msg.avatar && <AvatarDisplay avatar={msg.avatar} size={22} />}
                <div>
                  <span className="font-bold text-emerald-300">{msg.playerName}: </span>
                  <span>{msg.text}</span>
                </div>
              </div>
            );
          }

          // Normal chat or regular guess
          return (
            <div
              key={index}
              className="flex items-start gap-2 p-1 rounded-lg hover:bg-slate-800/50 transition-colors"
            >
              {msg.avatar && <AvatarDisplay avatar={msg.avatar} size={22} />}
              <div className="break-words max-w-[85%]">
                <span className="font-bold text-slate-300 mr-1.5">{msg.playerName}:</span>
                <span className="text-slate-100">{msg.text}</span>
              </div>
            </div>
          );
        })}

        {/* Close Guess Notification Popup */}
        {closeGuessAlert && (
          <div className="flex items-center gap-2 p-2 rounded-lg bg-yellow-500/20 border border-yellow-500/40 text-yellow-300 font-bold animate-bounce">
            <AlertCircle className="w-4 h-4 shrink-0" />
            <span>{closeGuessAlert}</span>
          </div>
        )}

        <div ref={chatBottomRef} />
      </div>

      {/* Input Form */}
      <form onSubmit={handleSubmit} className="p-2.5 bg-slate-800/90 border-t border-slate-700/80 flex items-center gap-2">
        <input
          type="text"
          value={inputText}
          onChange={e => setInputText(e.target.value)}
          placeholder={getPlaceholder()}
          disabled={isDrawer && isDrawingPhase}
          maxLength={100}
          className="flex-1 bg-slate-900 border border-slate-700 rounded-xl px-3 py-2 text-xs text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:opacity-50 disabled:cursor-not-allowed"
        />
        <button
          type="submit"
          disabled={!inputText.trim() || (isDrawer && isDrawingPhase)}
          className="p-2 bg-blue-600 hover:bg-blue-500 disabled:bg-slate-700 text-white rounded-xl transition-colors cursor-pointer disabled:cursor-not-allowed shrink-0"
        >
          <Send className="w-4 h-4" />
        </button>
      </form>
    </div>
  );
};
