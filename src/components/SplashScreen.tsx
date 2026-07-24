import React, { useEffect, useState } from "react";
import { motion } from "motion/react";
import { Sparkles, Gamepad2 } from "lucide-react";

interface SplashScreenProps {
  onComplete: () => void;
}

export default function SplashScreen({ onComplete }: SplashScreenProps) {
  const [progress, setProgress] = useState(0);

  // Smooth progress count up over 4 seconds
  useEffect(() => {
    const duration = 4000; // 4 seconds
    const intervalTime = 30; // update every 30ms
    const step = (100 / (duration / intervalTime));

    const timer = setInterval(() => {
      setProgress((prev) => {
        const next = prev + step;
        if (next >= 100) {
          clearInterval(timer);
          return 100;
        }
        return next;
      });
    }, intervalTime);

    const completeTimeout = setTimeout(() => {
      onComplete();
    }, duration);

    return () => {
      clearInterval(timer);
      clearTimeout(completeTimeout);
    };
  }, [onComplete]);

  return (
    <div 
      id="splash-screen-container"
      className="absolute inset-0 z-[999] flex flex-col items-center justify-between bg-slate-950 text-white p-8 overflow-hidden select-none"
    >
      {/* Decorative premium ambient blur elements */}
      <div className="absolute top-[-10%] left-[-10%] w-[50%] aspect-square rounded-full bg-blue-500/10 blur-[80px]" />
      <div className="absolute bottom-[-10%] right-[-10%] w-[50%] aspect-square rounded-full bg-amber-500/10 blur-[80px]" />
      
      {/* Invisible spacer to center-align the main logo */}
      <div className="h-10" />

      {/* Centerpiece Logo & Title with premium glowing effect */}
      <div className="flex flex-col items-center text-center space-y-6">
        <motion.div
          initial={{ scale: 0.8, opacity: 0 }}
          animate={{ scale: [0.8, 1.05, 1], opacity: 1 }}
          transition={{ duration: 1.2, ease: "easeOut" }}
          className="relative flex items-center justify-center"
        >
          {/* Pulsing outer glowing rings */}
          <motion.div 
            animate={{ scale: [1, 1.15, 1], opacity: [0.2, 0.4, 0.2] }}
            transition={{ repeat: Infinity, duration: 2.5, ease: "easeInOut" }}
            className="absolute w-24 h-24 rounded-full border border-blue-500/30 bg-blue-500/5 filter blur-xs"
          />
          <motion.div 
            animate={{ scale: [1.1, 1.3, 1.1], opacity: [0.1, 0.2, 0.1] }}
            transition={{ repeat: Infinity, duration: 3, ease: "easeInOut", delay: 0.5 }}
            className="absolute w-32 h-32 rounded-full border border-amber-500/20 bg-amber-500/5 filter blur-xs"
          />

          {/* Central emblem */}
          <div className="relative w-16 h-16 rounded-2xl bg-gradient-to-br from-blue-600 via-indigo-600 to-amber-500 p-[1px] shadow-2xl shadow-blue-500/20">
            <div className="w-full h-full rounded-2xl bg-slate-950 flex items-center justify-center">
              <Gamepad2 className="w-8 h-8 text-white fill-white/5 animate-pulse" />
            </div>
          </div>
          
          {/* Tiny sparkling accent */}
          <motion.div
            animate={{ rotate: 360, scale: [0.8, 1.2, 0.8] }}
            transition={{ repeat: Infinity, duration: 4, ease: "linear" }}
            className="absolute -top-1 -right-1 text-amber-400"
          >
            <Sparkles className="w-5 h-5 fill-amber-400/30" />
          </motion.div>
        </motion.div>

        {/* Title & Slogan */}
        <div className="space-y-2">
          <motion.h1
            initial={{ opacity: 0, y: 15 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.4, duration: 0.8 }}
            className="text-2xl font-black tracking-widest uppercase bg-gradient-to-r from-blue-400 via-indigo-200 to-amber-400 bg-clip-text text-transparent font-display"
          >
            QUIZMASTER
          </motion.h1>
          
          <motion.p
            initial={{ opacity: 0 }}
            animate={{ opacity: 0.6 }}
            transition={{ delay: 0.8, duration: 0.8 }}
            className="text-[10px] font-bold uppercase tracking-[0.3em] text-slate-300"
          >
            L'Arène de la Culture
          </motion.p>
        </div>
      </div>

      {/* Loading Progress Indicator & Signature */}
      <div className="w-full max-w-xs flex flex-col items-center space-y-6 pb-6">
        
        {/* Modern Circular Progress Indicator */}
        <div className="relative flex flex-col items-center justify-center my-1">
          <div className="relative w-28 h-28 flex items-center justify-center">
            {/* Ambient subtle glow ring */}
            <div className="absolute inset-0 rounded-full bg-indigo-500/15 blur-md animate-pulse" />
            
            <svg className="w-full h-full -rotate-90 drop-shadow-[0_0_12px_rgba(99,102,241,0.5)]" viewBox="0 0 88 88">
              <defs>
                <linearGradient id="splashProgressGradient" x1="0%" y1="0%" x2="100%" y2="100%">
                  <stop offset="0%" stopColor="#3b82f6" />
                  <stop offset="50%" stopColor="#6366f1" />
                  <stop offset="100%" stopColor="#f59e0b" />
                </linearGradient>
              </defs>
              
              {/* Background track circle */}
              <circle
                cx="44"
                cy="44"
                r="36"
                className="text-slate-900/90 stroke-current"
                strokeWidth="5.5"
                fill="transparent"
              />
              
              {/* Animated Progress circle */}
              <circle
                cx="44"
                cy="44"
                r="36"
                stroke="url(#splashProgressGradient)"
                strokeWidth="5.5"
                strokeLinecap="round"
                fill="transparent"
                strokeDasharray="226.19"
                strokeDashoffset={226.19 - (226.19 * progress) / 100}
                className="transition-all duration-75 ease-out"
              />
            </svg>

            {/* Percentage Display at the center of the circle */}
            <div className="absolute inset-0 flex flex-col items-center justify-center text-center">
              <span className="text-lg font-black font-mono tracking-tight text-white drop-shadow flex items-baseline justify-center">
                {Math.round(progress)}
                <span className="text-xs font-extrabold text-amber-400 ml-0.5">%</span>
              </span>
              <span className="text-[8px] font-black uppercase tracking-widest text-indigo-300/80 animate-pulse -mt-0.5">
                Chargement
              </span>
            </div>
          </div>
        </div>

        {/* Centered signature text "Samba" requested by user */}
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ delay: 0.6, duration: 1 }}
          className="flex flex-col items-center space-y-1.5"
        >
          <span className="text-[10px] tracking-[0.4em] text-slate-500 uppercase font-bold">
            Créé par
          </span>
          <span className="text-sm font-black tracking-widest uppercase bg-gradient-to-r from-amber-400 via-yellow-200 to-amber-500 bg-clip-text text-transparent">
            Samba
          </span>
        </motion.div>

      </div>
    </div>
  );
}
