"use client";

import React from "react";

interface AIAvatarProps {
  status: 'idle' | 'listening' | 'speaking' | 'processing';
  size?: 'sm' | 'md' | 'lg';
}

export const AIAvatar = ({ status, size = 'md' }: AIAvatarProps) => {
  // Default to female persona (Prakriti)
  const agentPersona: 'female' | 'male' = 'female';
  const sizeClasses = {
    sm: "w-16 h-16",
    md: "w-48 h-48",
    lg: "w-64 h-64"
  };

  const isAnimating = status !== 'idle';

  return (
    <div className={`relative ${sizeClasses[size]} flex items-center justify-center`}>
      {/* Colorful RGB Animated Border */}
      {isAnimating && (
        <div 
          className="absolute inset-[-6px] rounded-full animate-[spin_3s_linear_infinite] z-0 shadow-lg"
          style={{
            background: 'conic-gradient(from 0deg, #ff0000, #ff7f00, #ffff00, #00ff00, #0000ff, #4b0082, #9400d3, #ff0000)'
          }}
        ></div>
      )}

      {/* Central Avatar Container */}
      <div className={`relative z-10 w-full h-full rounded-full p-1.5 bg-surface-container-lowest transition-transform duration-500 ${status === 'listening' ? 'scale-105' : 'scale-100'}`}>
        <div className="w-full h-full rounded-full overflow-hidden bg-primary-fixed relative">
           <img 
            src="/Image-Assets/prakriti.png" 
            alt="AI Assistant" 
            className="w-full h-full object-cover"
          />
        </div>
      </div>
    </div>
  );
};
