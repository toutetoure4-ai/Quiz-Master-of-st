import React, { useState } from "react";
import { motion, AnimatePresence } from "motion/react";
import { UserProfile, Quiz, DailyMission, AppSettings } from "../types";
import { CATEGORIES } from "../data";
import IconHelper from "./IconHelper";
import { dbService } from "../lib/firebase";
import { t, Language } from "../lib/i18n";
import { Play, Flame, Star, ChevronRight, GraduationCap, Coins, Crown, Check, Target, Gift, Sparkles } from "lucide-react";

interface HomeScreenProps {
  user: UserProfile;
  quizzes: Quiz[];
  settings?: AppSettings;
  onSelectQuiz: (quiz: Quiz) => void;
  onNavigateToTab: (tab: string, filterCategory?: string) => void;
  onNavigateToBoutique: () => void;
  onNavigateToPremium: () => void;
  onNavigateToAdmin: () => void;
  onNavigateToLevelMode: () => void;
  onUpdateUser: (user: UserProfile) => void;
}

export default function HomeScreen({ 
  user, 
  quizzes,
  settings, 
  onSelectQuiz, 
  onNavigateToTab,
  onNavigateToBoutique,
  onNavigateToPremium,
  onNavigateToAdmin,
  onNavigateToLevelMode,
  onUpdateUser
}: HomeScreenProps) {
  const [claimingId, setClaimingId] = useState<string | null>(null);
  const [successAnimation, setSuccessAnimation] = useState<{ active: boolean; text: string }>({ active: false, text: "" });

  const lang: Language = settings?.language || "fr";

  // Sort quizzes by playsCount to get popular ones
  const popularQuizzes = [...quizzes].sort((a, b) => b.playsCount - a.playsCount).slice(0, 3);
  
  // Sort quizzes by creation date or just take first few for "Derniers quiz"
  const recentQuizzes = [...quizzes].slice(0, 3);

  // Calculate XP progress percentage
  const nextLevelXp = user.level * 1000;
  const xpPercentage = Math.min((user.xp / nextLevelXp) * 100, 100);

  // Take first 6 categories for the home page preview
  const previewCategories = CATEGORIES.slice(0, 6);

  const handleClaimReward = async (mission: DailyMission) => {
    setClaimingId(mission.id);
    try {
      // 1. Sync claim status to server first
      const res = await fetch("/api/missions/claim", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          uid: user.uid,
          missionId: mission.id,
          rewardCoins: mission.rewardCoins,
          missionTitle: mission.title
        })
      });

      if (!res.ok) {
        throw new Error("Échec de la validation serveur de la mission.");
      }

      // 2. Persist locally in DB service
      const result = await dbService.claimDailyMissionReward(user.uid, mission.id);
      if (result.success && result.profile) {
        onUpdateUser(result.profile);
        setSuccessAnimation({
          active: true,
          text: `Bravo ! Tu as récupéré +${mission.rewardCoins} QuizCoins ! 🪙`
        });
        setTimeout(() => {
          setSuccessAnimation({ active: false, text: "" });
        }, 3000);
      }
    } catch (err) {
      console.error(err);
      alert("Impossible de réclamer la récompense.");
    } finally {
      setClaimingId(null);
    }
  };

  return (
    <div className="flex-1 overflow-y-auto px-5 py-4 space-y-6 bg-slate-50 dark:bg-slate-950">
      
      {/* Wallet Celebration Success Alert */}
      <AnimatePresence>
        {successAnimation.active && (
          <motion.div
            initial={{ opacity: 0, y: -20, scale: 0.9 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -20, scale: 0.9 }}
            className="bg-amber-500 border border-amber-400 text-white p-4 rounded-2xl flex items-center gap-3 shadow-lg shadow-amber-500/20 z-50 relative"
          >
            <Gift className="w-5 h-5 animate-bounce shrink-0" />
            <span className="text-xs font-black">{successAnimation.text}</span>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Welcome header & Interactive Wallet Display */}
      <div className="flex items-center justify-between">
        <div>
          <span className="text-[11px] font-bold tracking-wider text-slate-400 uppercase">{t("welcome", lang)}</span>
          <h2 className="text-xl font-extrabold font-display text-slate-950 dark:text-white flex items-center gap-1.5 mt-0.5">
            {t("hello", lang)}, {user.pseudo || "Joueur"} ! 👋
          </h2>
        </div>
        
        {/* Wallet & Premium Shortcuts */}
        <div className="flex items-center gap-1.5 select-none">
          {/* Wallet */}
          <button 
            onClick={onNavigateToBoutique}
            className="flex items-center gap-1.5 bg-amber-500/10 hover:bg-amber-500/20 border border-amber-500/20 px-2.5 py-1.5 rounded-full cursor-pointer transition-colors active:scale-95"
            title="Boutique"
          >
            <Coins className="w-3.5 h-3.5 text-amber-500 fill-amber-500/10 animate-pulse" />
            <span className="text-xs font-black font-mono text-amber-600 dark:text-amber-400">
              {(user.quizCoins ?? 1000).toLocaleString()} QC
            </span>
          </button>

          {/* Premium Status Banner */}
          <button
            onClick={onNavigateToPremium}
            className={`p-1.5 rounded-xl border flex items-center justify-center cursor-pointer transition-all active:scale-95 ${
              user.isPremium 
                ? "bg-gradient-to-br from-amber-400 to-yellow-500 border-amber-300 text-slate-950 shadow-sm" 
                : "bg-white dark:bg-slate-900 border-slate-100 dark:border-slate-800 text-slate-400 hover:text-slate-600 dark:hover:text-white"
            }`}
            title={user.isPremium ? "Abonnement Premium Actif ⭐" : "S'abonner au Premium"}
          >
            <Crown className={`w-4 h-4 ${user.isPremium ? "fill-amber-500/10 animate-pulse" : ""}`} />
          </button>
        </div>
      </div>

      {/* Level & XP Progression Card */}
      <motion.div 
        initial={{ y: 15, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        className="p-5 md3-card-gradient text-white rounded-3xl android-shadow-lg flex flex-col relative overflow-hidden"
      >
        <div className="absolute right-0 top-0 -mr-6 -mt-6 w-32 h-32 bg-white/5 rounded-full blur-xl"></div>
        
        <div className="flex items-center justify-between z-10">
          <div className="flex items-center gap-2">
            <div className="p-2 bg-white/10 rounded-xl">
              <GraduationCap className="w-5 h-5 text-white" />
            </div>
            <div>
              <span className="text-[10px] font-bold tracking-wider text-blue-100 uppercase">Niveau actuel</span>
              <p className="text-lg font-black font-display leading-tight">Niveau {user.level}</p>
            </div>
          </div>
          <div className="text-right">
            <span className="text-[10px] font-bold tracking-wider text-blue-100 uppercase">Total XP</span>
            <p className="text-lg font-black font-mono leading-tight">{user.xp} XP</p>
          </div>
        </div>

        {/* Progress Bar */}
        <div className="mt-5 z-10">
          <div className="w-full h-2.5 bg-white/25 rounded-full overflow-hidden">
            <motion.div 
              initial={{ width: 0 }}
              animate={{ width: `${xpPercentage}%` }}
              transition={{ duration: 1, ease: "easeOut" }}
              className="h-full bg-orange-400 rounded-full"
            ></motion.div>
          </div>
          <div className="flex justify-between items-center text-[10px] text-blue-100 font-semibold mt-1.5">
            <span>{user.xp} XP</span>
            <span>{nextLevelXp} XP pour Niv. {user.level + 1}</span>
          </div>
        </div>
      </motion.div>

      {/* Mode Niveaux IA (Progression) Banner */}
      <motion.div
        initial={{ y: 15, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        onClick={onNavigateToLevelMode}
        className="p-5 rounded-3xl bg-gradient-to-r from-indigo-600 via-purple-600 to-blue-600 text-white shadow-xl shadow-indigo-500/20 cursor-pointer relative overflow-hidden active:scale-98 transition-all border border-indigo-400/30"
      >
        <div className="absolute right-0 top-0 -mr-6 -mt-6 w-32 h-32 bg-white/10 rounded-full blur-xl" />
        <div className="flex items-center justify-between relative z-10">
          <div className="flex items-center gap-3.5">
            <div className="w-12 h-12 rounded-2xl bg-white/20 backdrop-blur-md flex items-center justify-center shrink-0 text-white shadow-inner">
              <Sparkles className="w-6 h-6 animate-pulse text-yellow-300" />
            </div>
            <div>
              <div className="flex items-center gap-1.5">
                <span className="text-[9px] font-black uppercase tracking-wider px-2 py-0.5 rounded-full bg-white/20 text-white">
                  MODE PROGRESSION IA
                </span>
              </div>
              <h3 className="text-sm font-black font-display text-white mt-1">
                Mode Niveaux IA (De + en + difficile)
              </h3>
              <p className="text-[10px] text-indigo-100 font-medium mt-0.5">
                Questions inédites à chaque palier. Débloque tous les niveaux !
              </p>
            </div>
          </div>
          <div className="w-9 h-9 rounded-full bg-white/20 flex items-center justify-center shrink-0 ml-2">
            <ChevronRight className="w-5 h-5 text-white" />
          </div>
        </div>
      </motion.div>

      {/* Quick Statistics Row */}
      <div className="grid grid-cols-2 gap-4">
        <div className="p-4 bg-white dark:bg-slate-900 rounded-2xl border border-slate-100 dark:border-slate-800/60 android-shadow flex flex-col justify-between">
          <div className="flex items-center gap-2 text-blue-500">
            <Flame className="w-4 h-4 fill-blue-500/10" />
            <span className="text-xs font-bold text-slate-500 dark:text-slate-400">Quiz joués</span>
          </div>
          <p className="text-2xl font-black font-mono text-slate-900 dark:text-white mt-2">
            {user.quizzesPlayedCount}
          </p>
        </div>

        <div className="p-4 bg-white dark:bg-slate-900 rounded-2xl border border-slate-100 dark:border-slate-800/60 android-shadow flex flex-col justify-between">
          <div className="flex items-center gap-2 text-emerald-500">
            <Star className="w-4 h-4 fill-emerald-500/10" />
            <span className="text-xs font-bold text-slate-500 dark:text-slate-400">Taux réussite</span>
          </div>
          <p className="text-2xl font-black font-mono text-slate-900 dark:text-white mt-2">
            {user.successRate}%
          </p>
        </div>
      </div>

      {/* DAILY MISSIONS MODULE */}
      <div className="bg-white dark:bg-slate-900 p-5 rounded-3xl border border-slate-100 dark:border-slate-800/60 android-shadow space-y-4">
        <div className="flex items-center justify-between pb-2 border-b border-slate-50 dark:border-slate-850">
          <h3 className="text-xs font-black text-slate-950 dark:text-white uppercase tracking-wider flex items-center gap-2">
            <Target className="w-4 h-4 text-blue-500" />
            Missions Quotidiennes
          </h3>
          <span className="text-[9px] bg-blue-50 dark:bg-blue-950/40 text-blue-600 dark:text-blue-400 px-2 py-0.5 rounded-full font-black uppercase tracking-wider">
            Virtuel
          </span>
        </div>

        <div className="space-y-4">
          {(user.dailyMissions || []).map((mission) => {
            const pct = Math.min((mission.currentCount / mission.targetCount) * 100, 100);
            const isDone = mission.currentCount >= mission.targetCount;
            const isClaimed = mission.isClaimed;

            return (
              <div key={mission.id} className="space-y-2">
                <div className="flex items-start justify-between gap-3">
                  <div className="space-y-1">
                    <p className="text-xs font-extrabold text-slate-900 dark:text-white leading-tight">
                      {mission.title}
                    </p>
                    <p className="text-[10px] text-slate-400 font-semibold">
                      Récompense : <span className="font-bold text-amber-500">+{mission.rewardCoins} QuizCoins</span>
                    </p>
                  </div>

                  {isClaimed ? (
                    <span className="flex items-center gap-1 text-[10px] text-emerald-500 font-extrabold select-none bg-emerald-500/5 px-2.5 py-1 rounded-full border border-emerald-500/10">
                      <Check className="w-3 h-3" />
                      <span>Récupéré</span>
                    </span>
                  ) : isDone ? (
                    <button
                      disabled={claimingId === mission.id}
                      onClick={() => handleClaimReward(mission)}
                      className="px-3 py-1.5 bg-amber-500 hover:bg-amber-600 text-white font-black text-[10px] uppercase rounded-xl shadow-md cursor-pointer transition-all active:scale-95 shrink-0"
                    >
                      {claimingId === mission.id ? "..." : "Récupérer"}
                    </button>
                  ) : (
                    <span className="text-[10px] font-mono font-black text-slate-400 bg-slate-50 dark:bg-slate-950 px-2 py-1 rounded-lg">
                      {mission.currentCount}/{mission.targetCount}
                    </span>
                  )}
                </div>

                {/* Progress Mini Bar */}
                {!isClaimed && (
                  <div className="w-full h-1.5 bg-slate-100 dark:bg-slate-950 rounded-full overflow-hidden">
                    <div 
                      className={`h-full rounded-full transition-all duration-500 ${isDone ? "bg-emerald-500" : "bg-blue-500"}`} 
                      style={{ width: `${pct}%` }}
                    />
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </div>

      {/* Continuer un Quiz (Resume Section) */}
      <div className="p-4 bg-white dark:bg-slate-900 rounded-2xl border border-slate-100 dark:border-slate-800/60 android-shadow flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-orange-100 dark:bg-orange-950/40 text-orange-500 flex items-center justify-center font-bold">
            <Flame className="w-5 h-5 fill-orange-500/10 animate-pulse" />
          </div>
          <div>
            <h4 className="text-xs font-black text-slate-400 uppercase tracking-wider">Continuer le défi</h4>
            <p className="text-sm font-extrabold text-slate-900 dark:text-white mt-0.5">Culture Gaming...</p>
            <span className="text-[10px] text-slate-500 dark:text-slate-400 font-semibold">Question 2 sur 3 • Facile</span>
          </div>
        </div>
        
        <button 
          onClick={() => {
            const gamingQuiz = quizzes.find(q => q.id === "quiz-jeux-video");
            if (gamingQuiz) onSelectQuiz(gamingQuiz);
          }}
          className="p-2.5 bg-blue-500 hover:bg-blue-600 text-white rounded-xl shadow-md shadow-blue-500/10 hover:shadow-blue-500/20 active:scale-95 transition-all cursor-pointer"
        >
          <Play className="w-4 h-4 fill-current" />
        </button>
      </div>

      {/* Categories Horizontal Grid */}
      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <h3 className="text-base font-black font-display text-slate-900 dark:text-white">Catégories populaires</h3>
          <button 
            onClick={() => onNavigateToTab("Explorer")}
            className="text-xs font-bold text-blue-500 flex items-center gap-0.5 hover:underline"
          >
            Voir tout <ChevronRight className="w-4 h-4" />
          </button>
        </div>

        <div className="grid grid-cols-3 gap-3">
          {previewCategories.map((cat) => (
            <button
              key={cat.id}
              onClick={() => onNavigateToTab("Explorer", cat.name)}
              className="p-3 bg-white dark:bg-slate-900 rounded-2xl border border-slate-100 dark:border-slate-800/60 android-shadow flex flex-col items-center text-center group cursor-pointer hover:border-blue-500/20 active:scale-95 transition-all"
            >
              <div 
                className="w-10 h-10 rounded-xl flex items-center justify-center text-white mb-2 shadow-inner"
                style={{ backgroundColor: cat.color }}
              >
                <IconHelper name={cat.icon} className="w-5 h-5" />
              </div>
              <span className="text-[11px] font-extrabold text-slate-700 dark:text-slate-300 tracking-tight leading-tight group-hover:text-blue-500 transition-colors">
                {cat.name}
              </span>
            </button>
          ))}
        </div>
      </div>

      {/* Popular Quizzes */}
      <div className="space-y-3">
        <h3 className="text-base font-black font-display text-slate-900 dark:text-white">Quiz Populaires</h3>
        <div className="space-y-3">
          {popularQuizzes.map((quiz) => (
            <div 
              key={quiz.id}
              onClick={() => onSelectQuiz(quiz)}
              className="p-4 bg-white dark:bg-slate-900 rounded-2xl border border-slate-100 dark:border-slate-800/60 android-shadow flex items-center justify-between hover:border-blue-500/20 cursor-pointer active:scale-99 transition-all"
            >
              <div className="flex items-center gap-3.5 overflow-hidden">
                <div className="w-11 h-11 rounded-xl bg-gradient-to-br from-blue-500/10 to-indigo-500/10 dark:from-blue-950/30 dark:to-indigo-950/30 border border-blue-500/10 flex items-center justify-center text-blue-500 shrink-0">
                  <Star className="w-5 h-5 fill-blue-500/10" />
                </div>
                <div className="overflow-hidden">
                  <h4 className="text-sm font-black text-slate-900 dark:text-white truncate">{quiz.title}</h4>
                  <div className="flex items-center gap-2 mt-1">
                    <span className="text-[10px] font-bold text-blue-600 dark:text-blue-400 bg-blue-50 dark:bg-blue-950/40 px-1.5 py-0.5 rounded-md">
                      {quiz.category}
                    </span>
                    <span className="text-[10px] text-slate-400 font-semibold">•</span>
                    <span className="text-[10px] text-slate-400 font-semibold">
                      {quiz.difficulty}
                    </span>
                  </div>
                </div>
              </div>

              <ChevronRight className="w-5 h-5 text-slate-400 shrink-0" />
            </div>
          ))}
        </div>
      </div>

      {/* Recent Quizzes */}
      <div className="space-y-3">
        <h3 className="text-base font-black font-display text-slate-900 dark:text-white">Derniers Quiz Ajoutés</h3>
        <div className="space-y-3">
          {recentQuizzes.map((quiz) => (
            <div 
              key={quiz.id}
              onClick={() => onSelectQuiz(quiz)}
              className="p-4 bg-white dark:bg-slate-900 rounded-2xl border border-slate-100 dark:border-slate-800/60 android-shadow flex items-center justify-between hover:border-blue-500/20 cursor-pointer active:scale-99 transition-all"
            >
              <div className="flex items-center gap-3.5 overflow-hidden">
                <div className="w-11 h-11 rounded-xl bg-gradient-to-br from-violet-500/10 to-purple-500/10 dark:from-violet-950/30 dark:to-purple-950/30 border border-violet-500/10 flex items-center justify-center text-violet-500 shrink-0">
                  <Flame className="w-5 h-5 fill-violet-500/10" />
                </div>
                <div className="overflow-hidden">
                  <h4 className="text-sm font-black text-slate-900 dark:text-white truncate">{quiz.title}</h4>
                  <div className="flex items-center gap-2 mt-1">
                    <span className="text-[10px] font-bold text-violet-600 dark:text-violet-400 bg-violet-50 dark:bg-violet-950/40 px-1.5 py-0.5 rounded-md">
                      {quiz.category}
                    </span>
                    <span className="text-[10px] text-slate-400 font-semibold">•</span>
                    <span className="text-[10px] text-slate-400 font-semibold">
                      {quiz.difficulty}
                    </span>
                  </div>
                </div>
              </div>

              <ChevronRight className="w-5 h-5 text-slate-400 shrink-0" />
            </div>
          ))}
        </div>
      </div>

    </div>
  );
}
