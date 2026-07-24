import React from "react";
import { motion } from "motion/react";
import { Construction, Sparkles, ArrowLeft, Gamepad2, Trophy } from "lucide-react";

interface ModeInDevelopmentScreenProps {
  title: string;
  icon?: "social" | "leaderboard";
  onBack?: () => void;
}

export default function ModeInDevelopmentScreen({
  title,
  icon = "social",
  onBack
}: ModeInDevelopmentScreenProps) {
  return (
    <div className="flex-1 flex flex-col bg-slate-50 dark:bg-slate-950 p-6 items-center justify-center text-center relative overflow-hidden">
      {/* Background Decorative Blur */}
      <div className="absolute -top-10 -right-10 w-48 h-48 bg-indigo-500/10 rounded-full blur-3xl pointer-events-none" />
      <div className="absolute -bottom-10 -left-10 w-48 h-48 bg-blue-500/10 rounded-full blur-3xl pointer-events-none" />

      {onBack && (
        <button
          onClick={onBack}
          className="absolute top-5 left-5 p-2 bg-white dark:bg-slate-900 border border-slate-100 dark:border-slate-800 rounded-xl text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 cursor-pointer transition-colors shadow-sm"
        >
          <ArrowLeft className="w-5 h-5" />
        </button>
      )}

      <motion.div
        initial={{ scale: 0.8, opacity: 0, y: 20 }}
        animate={{ scale: 1, opacity: 1, y: 0 }}
        className="max-w-sm w-full bg-white dark:bg-slate-900 border border-slate-100 dark:border-slate-800 rounded-3xl p-7 shadow-2xl space-y-5 flex flex-col items-center relative z-10"
      >
        <div className="w-16 h-16 rounded-2xl bg-gradient-to-tr from-amber-500 to-orange-500 text-white flex items-center justify-center shadow-lg shadow-orange-500/20">
          {icon === "leaderboard" ? (
            <Trophy className="w-8 h-8 animate-bounce" />
          ) : (
            <Gamepad2 className="w-8 h-8 animate-pulse" />
          )}
        </div>

        <div className="space-y-2">
          <span className="text-[10px] font-black uppercase tracking-widest text-amber-500 bg-amber-50 dark:bg-amber-950/40 px-3 py-1 rounded-full border border-amber-500/20">
            En Développement
          </span>
          <h3 className="text-lg font-black font-display text-slate-900 dark:text-white pt-1">
            {title}
          </h3>
          <p className="text-xs font-semibold text-slate-500 dark:text-slate-400 leading-relaxed pt-1">
            Ce mode n'est pas encore disponible. Le jeu est en cours de développement.
          </p>
        </div>

        <div className="pt-2 w-full">
          {onBack && (
            <button
              onClick={onBack}
              className="w-full py-3.5 bg-indigo-500 hover:bg-indigo-600 text-white rounded-2xl text-xs font-black shadow-lg shadow-indigo-500/20 transition-all cursor-pointer active:scale-98"
            >
              Retour à l'accueil
            </button>
          )}
        </div>
      </motion.div>
    </div>
  );
}
