import React, { useState, useEffect } from "react";
import { motion, AnimatePresence } from "motion/react";
import { UserProfile, Quiz } from "../types";
import { 
  ArrowLeft, Lock, Star, Play, Sparkles, Trophy, CheckCircle2, 
  ChevronRight, RefreshCw, Zap, Compass, Flame, Award, BookOpen
} from "lucide-react";

interface LevelModeScreenProps {
  user: UserProfile;
  onBack: () => void;
  onStartLevelQuiz: (quiz: Quiz, levelNumber: number) => void;
}

// Preset categories for Level Mode
const LEVEL_CATEGORIES = [
  { id: "Culture générale", name: "Culture Générale", icon: "🧠", color: "from-blue-500 to-indigo-600" },
  { id: "Sciences", name: "Sciences & Nature", icon: "🔬", color: "from-emerald-500 to-teal-600" },
  { id: "Histoire", name: "Histoire du Monde", icon: "🏛️", color: "from-amber-500 to-orange-600" },
  { id: "Géographie", name: "Géographie & Pays", icon: "🌍", color: "from-cyan-500 to-blue-600" },
  { id: "Technologie", name: "Tech & IA", icon: "💻", color: "from-purple-500 to-indigo-600" },
  { id: "Cinéma", name: "Cinéma & Séries", icon: "🎬", color: "from-pink-500 to-rose-600" },
  { id: "Gaming", name: "Gaming & Esport", icon: "🎮", color: "from-violet-500 to-purple-600" },
  { id: "Manga", name: "Manga & Anime", icon: "⚡", color: "from-yellow-500 to-amber-600" },
];

export const LEVEL_TITLES: { [key: number]: { title: string; diff: "Facile" | "Moyen" | "Difficile" | "Expert"; color: string } } = {
  1: { title: "Débutant", diff: "Facile", color: "text-emerald-500 bg-emerald-50 dark:bg-emerald-950/40 border-emerald-200 dark:border-emerald-800/40" },
  2: { title: "Initié", diff: "Facile", color: "text-emerald-500 bg-emerald-50 dark:bg-emerald-950/40 border-emerald-200 dark:border-emerald-800/40" },
  3: { title: "Apprenti", diff: "Facile", color: "text-emerald-500 bg-emerald-50 dark:bg-emerald-950/40 border-emerald-200 dark:border-emerald-800/40" },
  4: { title: "Explorateur", diff: "Moyen", color: "text-amber-500 bg-amber-50 dark:bg-amber-950/40 border-amber-200 dark:border-amber-800/40" },
  5: { title: "Aventurier", diff: "Moyen", color: "text-amber-500 bg-amber-50 dark:bg-amber-950/40 border-amber-200 dark:border-amber-800/40" },
  6: { title: "Confirmé", diff: "Moyen", color: "text-amber-500 bg-amber-50 dark:bg-amber-950/40 border-amber-200 dark:border-amber-800/40" },
  7: { title: "Expert", diff: "Difficile", color: "text-orange-500 bg-orange-50 dark:bg-orange-950/40 border-orange-200 dark:border-orange-800/40" },
  8: { title: "Maître", diff: "Difficile", color: "text-orange-500 bg-orange-50 dark:bg-orange-950/40 border-orange-200 dark:border-orange-800/40" },
  9: { title: "Légende", diff: "Difficile", color: "text-orange-500 bg-orange-50 dark:bg-orange-950/40 border-orange-200 dark:border-orange-800/40" },
  10: { title: "Demi-Dieu", diff: "Expert", color: "text-purple-500 bg-purple-50 dark:bg-purple-950/40 border-purple-200 dark:border-purple-800/40" },
  11: { title: "Titanesque", diff: "Expert", color: "text-purple-500 bg-purple-50 dark:bg-purple-950/40 border-purple-200 dark:border-purple-800/40" },
  12: { title: "Cosmique", diff: "Expert", color: "text-purple-500 bg-purple-50 dark:bg-purple-950/40 border-purple-200 dark:border-purple-800/40" },
  13: { title: "Suprême", diff: "Expert", color: "text-purple-500 bg-purple-50 dark:bg-purple-950/40 border-purple-200 dark:border-purple-800/40" },
  14: { title: "Omniscient", diff: "Expert", color: "text-purple-500 bg-purple-50 dark:bg-purple-950/40 border-purple-200 dark:border-purple-800/40" },
  15: { title: "Maître Absolu", diff: "Expert", color: "text-purple-500 bg-purple-50 dark:bg-purple-950/40 border-purple-200 dark:border-purple-800/40" },
};

export default function LevelModeScreen({ user, onBack, onStartLevelQuiz }: LevelModeScreenProps) {
  const [selectedCategory, setSelectedCategory] = useState<string>("Culture générale");
  const [customTopic, setCustomTopic] = useState<string>("");
  const [isGenerating, setIsGenerating] = useState<boolean>(false);
  const [generatingLevel, setGeneratingLevel] = useState<number | null>(null);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  // User progression per category/topic saved in localStorage
  const activeTopic = customTopic.trim() || selectedCategory;
  const storageKey = `qm_lvl_prog_${activeTopic.toLowerCase().replace(/[^a-z0-0]/g, "_")}`;

  const [progress, setProgress] = useState<{
    unlockedLevel: number;
    levelStars: { [level: number]: number };
    levelScores: { [level: number]: number };
  }>(() => {
    const saved = localStorage.getItem(storageKey);
    if (saved) {
      try {
        return JSON.parse(saved);
      } catch (e) {
        console.error(e);
      }
    }
    return { unlockedLevel: 1, levelStars: {}, levelScores: {} };
  });

  // Re-load progression when category or custom topic changes
  useEffect(() => {
    const saved = localStorage.getItem(storageKey);
    if (saved) {
      try {
        setProgress(JSON.parse(saved));
      } catch (e) {
        setProgress({ unlockedLevel: 1, levelStars: {}, levelScores: {} });
      }
    } else {
      setProgress({ unlockedLevel: 1, levelStars: {}, levelScores: {} });
    }
  }, [storageKey]);

  const handleLaunchLevel = async (levelNumber: number) => {
    if (levelNumber > progress.unlockedLevel) return; // Locked

    setIsGenerating(true);
    setGeneratingLevel(levelNumber);
    setErrorMsg(null);

    try {
      const currentLevelConfig = LEVEL_TITLES[levelNumber] || { diff: "Moyen" };
      
      const res = await fetch("/api/gemini/generate-quiz", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          topic: activeTopic,
          category: selectedCategory,
          difficulty: currentLevelConfig.diff,
          level: levelNumber,
          count: 5
        })
      });

      if (!res.ok) {
        throw new Error("Erreur de génération du quiz par l'IA.");
      }

      const generatedQuiz = await res.json();
      
      // Ensure level info is attached to quiz title
      const levelQuiz: Quiz = {
        ...generatedQuiz,
        id: `quiz-lvl-${levelNumber}-${Date.now()}`,
        title: `Niveau ${levelNumber} : ${generatedQuiz.title || activeTopic}`,
        description: `Mode Niveau IA - Palier ${levelNumber} (${currentLevelConfig.diff}). Réussis au moins 60% pour débloquer le niveau suivant !`,
        category: selectedCategory,
        difficulty: currentLevelConfig.diff as any,
        createdAt: new Date().toISOString(),
        playsCount: 1
      };

      onStartLevelQuiz(levelQuiz, levelNumber);
    } catch (err: any) {
      console.error("Failed to generate level quiz:", err);
      setErrorMsg("Impossible de générer le niveau pour l'instant. Vérifie ta connexion.");
    } finally {
      setIsGenerating(false);
      setGeneratingLevel(null);
    }
  };

  const totalStarsCount = (Object.values(progress.levelStars) as number[]).reduce((acc, s) => acc + s, 0);

  return (
    <div className="flex-1 flex flex-col h-full bg-slate-50 dark:bg-slate-950 overflow-hidden">
      
      {/* Header Bar */}
      <div className="px-5 py-4 bg-white dark:bg-slate-900 border-b border-slate-100 dark:border-slate-800/80 flex items-center justify-between shrink-0 z-10">
        <div className="flex items-center gap-3">
          <button
            onClick={onBack}
            className="p-2 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-xl cursor-pointer text-slate-600 dark:text-slate-300 transition-colors"
          >
            <ArrowLeft className="w-5 h-5" />
          </button>
          <div>
            <div className="flex items-center gap-1.5">
              <h2 className="text-base font-black text-slate-900 dark:text-white font-display">
                Mode Niveaux IA
              </h2>
              <span className="text-[9px] font-black text-indigo-500 bg-indigo-50 dark:bg-indigo-950/60 px-1.5 py-0.5 rounded uppercase tracking-wider">
                IA
              </span>
            </div>
            <p className="text-[11px] font-medium text-slate-500 dark:text-slate-400">
              Progression par étapes • Questions uniques
            </p>
          </div>
        </div>

        {/* Total Stars Counter */}
        <div className="flex items-center gap-1.5 bg-amber-500/10 border border-amber-500/20 px-3 py-1.5 rounded-full">
          <Star className="w-4 h-4 text-amber-500 fill-amber-500" />
          <span className="text-xs font-black text-amber-600 dark:text-amber-400 font-mono">
            {totalStarsCount} / 45 ⭐
          </span>
        </div>
      </div>

      {/* Main Content Area */}
      <div className="flex-1 overflow-y-auto px-5 py-5 space-y-6">

        {/* Info Banner */}
        <div className="p-4 rounded-2xl bg-gradient-to-r from-indigo-500/10 via-purple-500/10 to-blue-500/10 border border-indigo-500/20 flex items-start gap-3.5">
          <div className="w-10 h-10 rounded-xl bg-indigo-500 text-white flex items-center justify-center shrink-0 shadow-md shadow-indigo-500/20 mt-0.5">
            <Sparkles className="w-5 h-5" />
          </div>
          <div>
            <h3 className="text-xs font-black text-slate-900 dark:text-white">
              Chaque niveau devient de plus en plus difficile !
            </h3>
            <p className="text-[11px] text-slate-600 dark:text-slate-300 font-medium mt-1 leading-relaxed">
              L'IA génère un quiz inédit à chaque niveau. Obtiens au moins <strong className="text-indigo-600 dark:text-indigo-400">1 Étoile (60% de bonnes réponses)</strong> pour débloquer le niveau supérieur !
            </p>
          </div>
        </div>

        {/* Category & Topic Selection */}
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-black text-slate-400 uppercase tracking-wider block">
              Thème de progression
            </span>
            {customTopic && (
              <button 
                onClick={() => setCustomTopic("")} 
                className="text-[10px] font-bold text-blue-500 hover:underline cursor-pointer"
              >
                Réinitialiser le sujet
              </button>
            )}
          </div>

          {/* Custom Topic Input */}
          <div className="relative">
            <input
              type="text"
              value={customTopic}
              onChange={(e) => setCustomTopic(e.target.value)}
              placeholder="Saisis un sujet personnalisé (ex: Marvel, Astronomie)..."
              className="w-full px-4 py-3 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl text-xs text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-indigo-500/50 shadow-sm pr-10"
            />
            <div className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400">
              <Sparkles className="w-4 h-4 text-indigo-500 animate-pulse" />
            </div>
          </div>

          {/* Preset Categories Slider/Chips */}
          <div className="flex gap-2 overflow-x-auto pb-1 scrollbar-none">
            {LEVEL_CATEGORIES.map((cat) => {
              const isSelected = selectedCategory === cat.name && !customTopic;
              return (
                <button
                  key={cat.id}
                  onClick={() => {
                    setSelectedCategory(cat.name);
                    setCustomTopic("");
                  }}
                  className={`px-3.5 py-2 rounded-xl border text-xs font-bold shrink-0 flex items-center gap-2 cursor-pointer transition-all ${
                    isSelected
                      ? "bg-indigo-500 text-white border-indigo-500 shadow-md shadow-indigo-500/20"
                      : "bg-white dark:bg-slate-900 text-slate-700 dark:text-slate-300 border-slate-200 dark:border-slate-800 hover:border-indigo-500/30"
                  }`}
                >
                  <span>{cat.icon}</span>
                  <span>{cat.name}</span>
                </button>
              );
            })}
          </div>
        </div>

        {/* Error Alert */}
        {errorMsg && (
          <div className="p-3 bg-red-500/10 border border-red-500/20 rounded-xl text-red-500 text-xs font-semibold flex items-center justify-between">
            <span>{errorMsg}</span>
            <button onClick={() => setErrorMsg(null)} className="text-xs font-bold underline">Fermer</button>
          </div>
        )}

        {/* Level Roadmap Grid / Path */}
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-black text-slate-400 uppercase tracking-wider">
              Feuille de Route des Niveaux ({activeTopic})
            </span>
            <span className="text-[10px] font-bold text-slate-500">
              Niveau débloqué : {progress.unlockedLevel} / 15
            </span>
          </div>

          <div className="grid grid-cols-1 gap-3">
            {Array.from({ length: 15 }, (_, i) => i + 1).map((lvl) => {
              const isUnlocked = lvl <= progress.unlockedLevel;
              const isCurrentUnlocked = lvl === progress.unlockedLevel;
              const stars = progress.levelStars[lvl] || 0;
              const bestScore = progress.levelScores[lvl];
              const config = LEVEL_TITLES[lvl] || { title: `Niveau ${lvl}`, diff: "Moyen", color: "text-slate-500" };
              const isThisGenerating = isGenerating && generatingLevel === lvl;

              return (
                <motion.div
                  key={lvl}
                  whileHover={isUnlocked ? { scale: 1.01 } : {}}
                  className={`p-4 rounded-2xl border transition-all flex items-center justify-between select-none relative overflow-hidden ${
                    isCurrentUnlocked
                      ? "bg-gradient-to-r from-indigo-500/10 via-purple-500/5 to-white dark:to-slate-900 border-indigo-500 ring-2 ring-indigo-500/20 shadow-lg shadow-indigo-500/10"
                      : isUnlocked
                      ? "bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-800/80 hover:border-slate-300 dark:hover:border-slate-700"
                      : "bg-slate-100/60 dark:bg-slate-900/40 border-slate-200/50 dark:border-slate-800/40 opacity-70"
                  }`}
                >
                  {/* Left info */}
                  <div className="flex items-center gap-3.5">
                    {/* Badge Icon */}
                    <div className={`w-12 h-12 rounded-2xl flex items-center justify-center shrink-0 font-black text-sm shadow-sm ${
                      isUnlocked
                        ? lvl <= 3
                          ? "bg-emerald-500 text-white"
                          : lvl <= 6
                          ? "bg-amber-500 text-white"
                          : lvl <= 9
                          ? "bg-orange-500 text-white"
                          : "bg-purple-600 text-white"
                        : "bg-slate-200 dark:bg-slate-800 text-slate-400"
                    }`}>
                      {isUnlocked ? `NIV ${lvl}` : <Lock className="w-5 h-5 text-slate-400" />}
                    </div>

                    <div>
                      <div className="flex items-center gap-2">
                        <h4 className="text-xs font-black text-slate-900 dark:text-white">
                          Niveau {lvl} : {config.title}
                        </h4>
                        <span className={`text-[9px] font-black px-2 py-0.5 rounded-full border uppercase tracking-wider ${config.color}`}>
                          {config.diff}
                        </span>
                      </div>

                      <p className="text-[10px] text-slate-500 dark:text-slate-400 font-medium mt-0.5">
                        {isUnlocked 
                          ? bestScore !== undefined 
                            ? `Meilleur score : ${bestScore}/5` 
                            : "5 questions générées par l'IA"
                          : `Débloque le niveau ${lvl - 1} pour continuer`}
                      </p>

                      {/* Stars Display */}
                      {isUnlocked && (
                        <div className="flex items-center gap-1 mt-1.5">
                          {[1, 2, 3].map((starIdx) => (
                            <Star
                              key={starIdx}
                              className={`w-3.5 h-3.5 ${
                                starIdx <= stars
                                  ? "text-amber-400 fill-amber-400"
                                  : "text-slate-200 dark:text-slate-800 fill-slate-200 dark:fill-slate-800"
                              }`}
                            />
                          ))}
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Right CTA Button */}
                  <div>
                    {isUnlocked ? (
                      <button
                        onClick={() => handleLaunchLevel(lvl)}
                        disabled={isGenerating}
                        className={`px-4 py-2.5 rounded-xl font-black text-xs flex items-center gap-1.5 cursor-pointer transition-all active:scale-95 shadow-md ${
                          isCurrentUnlocked
                            ? "bg-indigo-500 hover:bg-indigo-600 text-white shadow-indigo-500/20"
                            : "bg-slate-900 hover:bg-slate-800 dark:bg-slate-800 dark:hover:bg-slate-700 text-white"
                        }`}
                      >
                        {isThisGenerating ? (
                          <>
                            <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                            <span>IA...</span>
                          </>
                        ) : (
                          <>
                            <Play className="w-3.5 h-3.5 fill-current" />
                            <span>{bestScore !== undefined ? "REJOUER" : "JOUER"}</span>
                          </>
                        )}
                      </button>
                    ) : (
                      <div className="p-2 rounded-xl bg-slate-100 dark:bg-slate-800/50 text-slate-400">
                        <Lock className="w-4 h-4" />
                      </div>
                    )}
                  </div>
                </motion.div>
              );
            })}
          </div>
        </div>

      </div>
    </div>
  );
}
