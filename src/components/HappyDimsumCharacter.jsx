import React from 'react';
import { Sparkles, Heart } from 'lucide-react';

export default function HappyDimsumCharacter({ size = 180, className = '' }) {
  return (
    <div className={`relative flex items-center justify-center select-none ${className}`}>
      {/* Background Radial Glow */}
      <div 
        className="absolute w-44 h-44 rounded-full bg-gradient-to-tr from-brand-gold/20 via-brand-blue/15 to-amber-200/30 blur-xl animate-pulse pointer-events-none"
        style={{ animationDuration: '3s' }}
      />

      {/* Floating Sparkles & Confetti surrounding the character */}
      <div className="absolute -top-2 left-6 text-brand-gold animate-bounce" style={{ animationDuration: '2.2s' }}>
        <Sparkles size={20} className="fill-brand-gold/60" />
      </div>
      <div className="absolute top-2 right-6 text-brand-red animate-pulse" style={{ animationDuration: '1.8s' }}>
        <Heart size={18} className="fill-brand-red text-brand-red -rotate-12" />
      </div>
      <div className="absolute -bottom-1 left-8 w-2.5 h-2.5 rounded-full bg-brand-blue/70 animate-ping" style={{ animationDuration: '2.5s' }} />
      <div className="absolute top-10 -right-2 text-brand-gold animate-bounce" style={{ animationDuration: '1.9s' }}>
        <Sparkles size={16} className="fill-brand-gold/40" />
      </div>
      <div className="absolute -bottom-2 right-10 w-2 h-2 rounded-full bg-brand-gold/80 animate-ping" style={{ animationDuration: '2.8s' }} />

      {/* Main Animated SVG Container */}
      <div className="relative animate-bounce-happy" style={{ width: size, height: size }}>
        <svg
          viewBox="0 0 200 200"
          className="w-full h-full drop-shadow-lg overflow-visible"
          fill="none"
          xmlns="http://www.w3.org/2000/svg"
        >
          <defs>
            {/* Dumpling Gradient */}
            <linearGradient id="dimsumBodyGrad" x1="100" y1="50" x2="100" y2="170" gradientUnits="userSpaceOnUse">
              <stop offset="0%" stopColor="#FFFFFF" />
              <stop offset="70%" stopColor="#FFF7EC" />
              <stop offset="100%" stopColor="#F5E7D3" />
            </linearGradient>

            {/* Dumpling Outline & Shadow */}
            <linearGradient id="dimsumBorderGrad" x1="100" y1="50" x2="100" y2="170" gradientUnits="userSpaceOnUse">
              <stop offset="0%" stopColor="#E2C17C" />
              <stop offset="100%" stopColor="#C9A23D" />
            </linearGradient>

            {/* Steamer Shadow */}
            <radialGradient id="dimsumShadow" cx="50%" cy="50%" r="50%">
              <stop offset="0%" stopColor="rgba(44, 62, 80, 0.25)" />
              <stop offset="100%" stopColor="rgba(44, 62, 80, 0)" />
            </radialGradient>
          </defs>

          {/* Contact Shadow under Bao */}
          <ellipse cx="100" cy="182" rx="60" ry="10" fill="url(#dimsumShadow)" />

          {/* Steaming Aroma Curls Rising (Animated via CSS) */}
          <g className="animate-steam origin-bottom" style={{ animationDelay: '0s' }}>
            <path
              d="M85 45 C80 32, 92 25, 88 15"
              stroke="#6A9DB3"
              strokeWidth="3.5"
              strokeLinecap="round"
              fill="none"
              opacity="0.8"
            />
          </g>
          <g className="animate-steam origin-bottom" style={{ animationDelay: '0.7s' }}>
            <path
              d="M100 42 C96 28, 108 20, 102 10"
              stroke="#C9A23D"
              strokeWidth="4"
              strokeLinecap="round"
              fill="none"
              opacity="0.9"
            />
          </g>
          <g className="animate-steam origin-bottom" style={{ animationDelay: '1.2s' }}>
            <path
              d="M115 45 C112 32, 122 25, 118 15"
              stroke="#6A9DB3"
              strokeWidth="3.5"
              strokeLinecap="round"
              fill="none"
              opacity="0.8"
            />
          </g>

          {/* Little Cheerful Hands */}
          {/* Left Waving Hand */}
          <g className="animate-wiggle-hand origin-[50px_130px]">
            <path
              d="M48 128 C34 118, 30 134, 42 142 C48 145, 52 140, 52 135 Z"
              fill="#FFF7EC"
              stroke="#C9A23D"
              strokeWidth="3"
              strokeLinejoin="round"
            />
          </g>
          {/* Right Waving Hand */}
          <g className="animate-wiggle-hand origin-[150px_130px]" style={{ animationDelay: '0.4s' }}>
            <path
              d="M152 128 C166 118, 170 134, 158 142 C152 145, 148 140, 148 135 Z"
              fill="#FFF7EC"
              stroke="#C9A23D"
              strokeWidth="3"
              strokeLinejoin="round"
            />
          </g>

          {/* Main Dumpling Body */}
          <path
            d="M100 56
               C135 56, 168 85, 168 126
               C168 160, 140 174, 100 174
               C60 174, 32 160, 32 126
               C32 85, 65 56, 100 56 Z"
            fill="url(#dimsumBodyGrad)"
            stroke="url(#dimsumBorderGrad)"
            strokeWidth="4"
          />

          {/* Top Pleats / Folds of Dimsum Bao */}
          <path
            d="M100 56 Q94 76 86 92"
            stroke="#E0C27B"
            strokeWidth="3"
            strokeLinecap="round"
            fill="none"
          />
          <path
            d="M100 56 Q100 78 100 96"
            stroke="#E0C27B"
            strokeWidth="3"
            strokeLinecap="round"
            fill="none"
          />
          <path
            d="M100 56 Q106 76 114 92"
            stroke="#E0C27B"
            strokeWidth="3"
            strokeLinecap="round"
            fill="none"
          />
          <path
            d="M100 56 Q82 72 68 86"
            stroke="#E5CC94"
            strokeWidth="2.5"
            strokeLinecap="round"
            fill="none"
          />
          <path
            d="M100 56 Q118 72 132 86"
            stroke="#E5CC94"
            strokeWidth="2.5"
            strokeLinecap="round"
            fill="none"
          />

          {/* Cute Golden Topping Garnish on Crown */}
          <circle cx="100" cy="56" r="6.5" fill="#E8352D" stroke="#B5372E" strokeWidth="1.5" />
          <circle cx="97" cy="54" r="2" fill="#FFA39E" />

          {/* Happy Curved Squinting Eyes (^ ^) */}
          {/* Left Eye */}
          <path
            d="M68 118 Q78 105 88 118"
            stroke="#2C3E50"
            strokeWidth="4.5"
            strokeLinecap="round"
            fill="none"
          />
          {/* Right Eye */}
          <path
            d="M112 118 Q122 105 132 118"
            stroke="#2C3E50"
            strokeWidth="4.5"
            strokeLinecap="round"
            fill="none"
          />

          {/* Rosy Cheeks (Blushing) */}
          <ellipse cx="64" cy="130" rx="9" ry="5.5" fill="#FF8A8A" opacity="0.85" />
          <ellipse cx="136" cy="130" rx="9" ry="5.5" fill="#FF8A8A" opacity="0.85" />

          {/* Happy Open Smiling Mouth with Tongue */}
          <g>
            <path
              d="M86 128 Q100 132 114 128 Q115 152 100 152 Q85 152 86 128 Z"
              fill="#B5372E"
              stroke="#2C3E50"
              strokeWidth="3"
              strokeLinejoin="round"
            />
            {/* Cute Pink Tongue */}
            <path
              d="M91 142 Q100 138 109 142 Q105 151 100 151 Q95 151 91 142 Z"
              fill="#FF7B88"
            />
          </g>

          {/* Sparkle details on body */}
          <circle cx="58" cy="98" r="2.5" fill="#FFFFFF" />
          <circle cx="144" cy="98" r="2" fill="#FFFFFF" />
        </svg>
      </div>
    </div>
  );
}
