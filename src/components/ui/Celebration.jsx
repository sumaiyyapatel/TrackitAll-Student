import React, { useEffect, useState } from 'react';
import { Trophy, Sparkles, Star, CheckCircle2 } from 'lucide-react';

export const Celebration = ({ show, message, onComplete }) => {
  const [visible, setVisible] = useState(false);
  const [particles, setParticles] = useState([]);

  useEffect(() => {
    if (show) {
      setVisible(true);
      // Create confetti particles
      const newParticles = Array.from({ length: 30 }, (_, i) => ({
        id: i,
        x: Math.random() * 100,
        y: -10,
        delay: Math.random() * 0.5,
        duration: 1 + Math.random() * 1,
        color: ['#8b5cf6', '#ec4899', '#f59e0b', '#10b981', '#3b82f6'][Math.floor(Math.random() * 5)]
      }));
      setParticles(newParticles);

      const timer = setTimeout(() => {
        setVisible(false);
        if (onComplete) onComplete();
      }, 3000);

      return () => clearTimeout(timer);
    }
  }, [show, onComplete]);

  if (!visible) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center pointer-events-none">
      {/* Confetti particles */}
      <div className="absolute inset-0 overflow-hidden">
        {particles.map(particle => (
          <div
            key={particle.id}
            className="absolute w-2 h-2 rounded-full animate-fall"
            style={{
              left: `${particle.x}%`,
              top: `${particle.y}%`,
              backgroundColor: particle.color,
              animation: `fall ${particle.duration}s ${particle.delay}s ease-out forwards`,
            }}
          />
        ))}
      </div>

      {/* Celebration content */}
      <div className="relative bg-[#8b5cf6] rounded-3xl p-8 transform scale-0 animate-scale-in">
        <div className="text-center">
          <div className="flex justify-center mb-4">
            <Trophy className="w-16 h-16 text-amber-300 animate-bounce" />
          </div>
          <h3 className="text-3xl font-bold text-white mb-2 animate-fade-in" style={{ fontFamily: 'Outfit, sans-serif' }}>
            🎉 Amazing!
          </h3>
          <p className="text-xl text-white/90 mb-4 animate-fade-in-delay">{message}</p>
          <div className="flex justify-center gap-2">
            <Star className="w-6 h-6 text-amber-300 animate-pulse" />
            <Sparkles className="w-6 h-6 text-amber-300 animate-pulse delay-100" />
            <CheckCircle2 className="w-6 h-6 text-amber-300 animate-pulse delay-200" />
          </div>
        </div>
      </div>

    </div>
  );
};

