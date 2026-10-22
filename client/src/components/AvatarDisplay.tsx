import React from 'react';
import { AvatarConfig } from '../types/game';

interface AvatarDisplayProps {
  avatar: AvatarConfig;
  size?: number;
  className?: string;
  animate?: boolean;
}

export const AvatarDisplay: React.FC<AvatarDisplayProps> = ({
  avatar,
  size = 48,
  className = '',
  animate = false
}) => {
  const { color = '#3b82f6', eyes = 0, mouth = 0, accessory = 0 } = avatar || {};

  return (
    <div
      style={{ width: size, height: size }}
      className={`relative inline-flex items-center justify-center shrink-0 ${animate ? 'hover:scale-105 transition-transform' : ''} ${className}`}
    >
      <svg
        viewBox="0 0 100 100"
        className="w-full h-full drop-shadow-md"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
      >
        {/* Base Body Circle */}
        <circle cx="50" cy="50" r="42" fill={color} stroke="#1e293b" strokeWidth="4" />

        {/* Blush Cheeks */}
        <ellipse cx="28" cy="62" rx="7" ry="4" fill="#fb7185" opacity="0.6" />
        <ellipse cx="72" cy="62" rx="7" ry="4" fill="#fb7185" opacity="0.6" />

        {/* Eyes Styles */}
        {eyes === 0 && (
          // Normal Happy Eyes
          <g fill="#0f172a">
            <ellipse cx="34" cy="46" rx="5" ry="6" />
            <ellipse cx="66" cy="46" rx="5" ry="6" />
            <circle cx="36" cy="44" r="2" fill="white" />
            <circle cx="68" cy="44" r="2" fill="white" />
          </g>
        )}

        {eyes === 1 && (
          // Wink
          <g stroke="#0f172a" strokeWidth="4" strokeLinecap="round" fill="none">
            <path d="M28 46 Q34 40 40 46" />
            <circle cx="66" cy="46" r="5" fill="#0f172a" stroke="none" />
            <circle cx="68" cy="44" r="1.8" fill="white" stroke="none" />
          </g>
        )}

        {eyes === 2 && (
          // Anime / Star Sparkle
          <g fill="#0f172a">
            <ellipse cx="34" cy="45" rx="6" ry="8" />
            <ellipse cx="66" cy="45" rx="6" ry="8" />
            <circle cx="36" cy="42" r="3" fill="white" />
            <circle cx="68" cy="42" r="3" fill="white" />
            <circle cx="32" cy="49" r="1.5" fill="white" />
            <circle cx="64" cy="49" r="1.5" fill="white" />
          </g>
        )}

        {eyes === 3 && (
          // Cool Sunglasses
          <g>
            <rect x="22" y="38" width="24" height="15" rx="4" fill="#18181b" stroke="#09090b" strokeWidth="2" />
            <rect x="54" y="38" width="24" height="15" rx="4" fill="#18181b" stroke="#09090b" strokeWidth="2" />
            <line x1="46" y1="45" x2="54" y2="45" stroke="#18181b" strokeWidth="3" />
            <line x1="24" y1="41" x2="40" y2="41" stroke="#a1a1aa" strokeWidth="1.5" strokeLinecap="round" />
            <line x1="56" y1="41" x2="72" y2="41" stroke="#a1a1aa" strokeWidth="1.5" strokeLinecap="round" />
          </g>
        )}

        {eyes === 4 && (
          // Surprised Open
          <g stroke="#0f172a" strokeWidth="3.5" fill="white">
            <circle cx="34" cy="45" r="7" />
            <circle cx="66" cy="45" r="7" />
            <circle cx="34" cy="45" r="3" fill="#0f172a" stroke="none" />
            <circle cx="66" cy="45" r="3" fill="#0f172a" stroke="none" />
          </g>
        )}

        {/* Mouth Styles */}
        {mouth === 0 && (
          // Sweet Smile
          <path d="M38 60 Q50 72 62 60" stroke="#0f172a" strokeWidth="4" strokeLinecap="round" fill="none" />
        )}

        {mouth === 1 && (
          // Big Grin
          <path d="M35 60 Q50 78 65 60 Z" fill="#ffffff" stroke="#0f172a" strokeWidth="3.5" strokeLinejoin="round" />
        )}

        {mouth === 2 && (
          // Tongue Out
          <g>
            <path d="M38 60 Q50 68 62 60" stroke="#0f172a" strokeWidth="4" strokeLinecap="round" fill="none" />
            <path d="M46 63 C46 72 54 72 54 63 Z" fill="#f43f5e" stroke="#0f172a" strokeWidth="2" />
          </g>
        )}

        {mouth === 3 && (
          // Joy Laugh / Open Mouth
          <path d="M36 58 Q50 78 64 58 Q50 54 36 58 Z" fill="#991b1b" stroke="#0f172a" strokeWidth="3.5" />
        )}

        {mouth === 4 && (
          // Cheeky Smirk
          <path d="M40 64 Q56 65 62 56" stroke="#0f172a" strokeWidth="4" strokeLinecap="round" fill="none" />
        )}

        {/* Accessory Styles */}
        {accessory === 1 && (
          // Party Cone Hat
          <polygon points="50,4 32,24 68,24" fill="#ec4899" stroke="#be185d" strokeWidth="2" />
        )}

        {accessory === 2 && (
          // Golden Crown
          <path
            d="M32 24 L36 12 L44 20 L50 8 L56 20 L64 12 L68 24 Z"
            fill="#eab308"
            stroke="#ca8a04"
            strokeWidth="2.5"
            strokeLinejoin="round"
          />
        )}

        {accessory === 3 && (
          // Artist French Beret
          <g>
            <ellipse cx="50" cy="18" rx="24" ry="9" fill="#e11d48" stroke="#9f1239" strokeWidth="2" />
            <circle cx="50" cy="9" r="2.5" fill="#9f1239" />
          </g>
        )}

        {accessory === 4 && (
          // Karate / Ninja Headband
          <g>
            <rect x="18" y="28" width="64" height="7" rx="3.5" fill="#ef4444" stroke="#991b1b" strokeWidth="1.5" />
            <circle cx="50" cy="31.5" r="3" fill="#ffffff" />
          </g>
        )}
      </svg>
    </div>
  );
};
