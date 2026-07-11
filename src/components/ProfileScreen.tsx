import { useState } from "react";
import { UserProfile, Question } from "../types";
import { INITIAL_BADGES, DEFAULT_QUIZZES } from "../data";
import { dbService } from "../lib/firebase";
import IconHelper from "./IconHelper";
import { 
  Settings, Calendar, Award, Zap, Star, ShieldAlert, CheckCircle, Clock, 
  BookOpen, ChevronDown, ChevronUp, Trash2, HelpCircle 
} from "lucide-react";
import { motion, AnimatePresence } from "motion/react";

interface ProfileScreenProps {
  user: UserProfile;
  onNavigateToSettings: () => void;
  onUpdateUser?: (updated: UserProfile) => void;
}

export default function ProfileScreen({ user, onNavigateToSettings, onUpdateUser }: ProfileScreenProps) {
  const [activeReviewTab, setActiveReviewTab] = useState<"failed" | "favorites">("failed");
  const [expandedQuestionId, setExpandedQuestionId] = useState<string | null>(null);

  // Dynamic calculations
  const totalPlays = user.history.length;
  const playedCount = user.quizzesPlayedCount || totalPlays;
  const successRate = user.successRate || 0;
  const avgResponseTime = user.averageResponseTime || 0;

  // Resolve question details from ID using default quizzes
  const getQuestionById = (qId: string): Question | null => {
    for (const quiz of DEFAULT_QUIZZES) {
      const found = quiz.questions.find((q) => q.id === qId);
      if (found) return found;
    }
    return null;
  };

  const failedQuestions = (user.failedQuestionIds || [])
    .map(getQuestionById)
    .filter((q): q is Question => q !== null);

  const favoriteQuestions = (user.favorites || [])
    .map(getQuestionById)
    .filter((q): q is Question => q !== null);

  // Remove from revisions handler
  const handleRemoveFromRevisions = async (qId: string) => {
    await dbService.removeFailedQuestion(user.uid, qId);
    
    // Update parent state if callback is provided, otherwise update local state
    if (onUpdateUser) {
      const updatedUser = {
        ...user,
        failedQuestionIds: (user.failedQuestionIds || []).filter((id) => id !== qId)
      };
      onUpdateUser(updatedUser);
    } else {
      // Direct local storage fallback to ensure instant UI responsiveness
      const saved = localStorage.getItem("qm_user_profile");
      if (saved) {
        const parsed = JSON.parse(saved);
        parsed.failedQuestionIds = (parsed.failedQuestionIds || []).filter((id: string) => id !== qId);
        localStorage.setItem("qm_user_profile", JSON.stringify(parsed));
        window.dispatchEvent(new Event("storage")); // Trigger state sync
      }
    }
  };

  // Remove from favorites handler
  const handleRemoveFromFavorites = async (qId: string) => {
    await dbService.toggleFavoriteQuestion(user.uid, qId);
    
    if (onUpdateUser) {
      const updatedUser = {
        ...user,
        favorites: (user.favorites || []).filter((id) => id !== qId)
      };
      onUpdateUser(updatedUser);
    } else {
      const saved = localStorage.getItem("qm_user_profile");
      if (saved) {
        const parsed = JSON.parse(saved);
        parsed.favorites = (parsed.favorites || []).filter((id: string) => id !== qId);
        localStorage.setItem("qm_user_profile", JSON.stringify(parsed));
        window.dispatchEvent(new Event("storage"));
      }
    }
  };

  const toggleExpandQuestion = (qId: string) => {
    setExpandedQuestionId(expandedQuestionId === qId ? null : qId);
  };

  return (
    <div className="flex-1 flex flex-col bg-slate-50 dark:bg-slate-950 overflow-hidden">
      
      {/* Header */}
      <div className="p-5 pb-3 border-b border-slate-100 dark:border-slate-800/60 shrink-0 bg-white dark:bg-slate-950 flex justify-between items-center">
        <div>
          <h2 className="text-xl font-extrabold font-display text-slate-950 dark:text-white">Mon Profil</h2>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">Suivi de tes réussites et révisions</p>
        </div>
        
        <button
          onClick={onNavigateToSettings}
          className="p-2.5 bg-slate-100 dark:bg-slate-900 hover:bg-slate-200 dark:hover:bg-slate-800 text-slate-700 dark:text-slate-300 rounded-xl cursor-pointer transition-all active:scale-95"
        >
          <Settings className="w-5 h-5" />
        </button>
      </div>

      {/* Main Scroller */}
      <div className="flex-1 overflow-y-auto p-5 space-y-6">
        
        {/* Profile Card Header */}
        <div className="flex flex-col items-center text-center p-6 bg-white dark:bg-slate-900 border border-slate-100 dark:border-slate-800/60 rounded-3xl android-shadow relative overflow-hidden">
          <div className="absolute top-0 right-0 p-3 text-[10px] text-slate-400 font-extrabold flex items-center gap-1">
            <Calendar className="w-3 h-3" />
            {user.joinDate}
          </div>

          <img 
            src={user.avatarUrl} 
            alt="Profile Avatar" 
            className="w-20 h-20 rounded-3xl bg-slate-100 dark:bg-slate-800 border-2 border-blue-500/20 android-shadow select-none mb-3"
          />

          <h3 className="text-base font-black text-slate-900 dark:text-white">{user.fullName}</h3>
          <span className="text-xs font-bold text-slate-400 mt-0.5">@{user.pseudo}</span>

          <div className="mt-4 flex items-center gap-1.5 px-4 py-1.5 bg-blue-50 dark:bg-blue-950/40 text-blue-500 rounded-full font-black text-xs font-display border border-blue-500/10">
            Niveau {user.level} • {user.xp} XP
          </div>
        </div>

        {/* Detailed Stats Cards */}
        <div className="grid grid-cols-3 gap-3">
          
          <div className="p-3 bg-white dark:bg-slate-900 rounded-2xl border border-slate-100 dark:border-slate-800/60 android-shadow text-center flex flex-col items-center justify-center">
            <div className="p-1.5 rounded-lg bg-blue-50 dark:bg-blue-950/20 text-blue-500">
              <Zap className="w-4 h-4 fill-blue-500/10" />
            </div>
            <span className="text-[9px] font-black uppercase text-slate-400 mt-2 block leading-none">Parties</span>
            <p className="text-base font-black font-mono text-slate-900 dark:text-white mt-1">
              {playedCount}
            </p>
          </div>

          <div className="p-3 bg-white dark:bg-slate-900 rounded-2xl border border-slate-100 dark:border-slate-800/60 android-shadow text-center flex flex-col items-center justify-center">
            <div className="p-1.5 rounded-lg bg-emerald-50 dark:bg-emerald-950/20 text-emerald-500">
              <Star className="w-4 h-4 fill-emerald-500/10" />
            </div>
            <span className="text-[9px] font-black uppercase text-slate-400 mt-2 block leading-none">Réussite</span>
            <p className="text-base font-black font-mono text-slate-900 dark:text-white mt-1">
              {successRate}%
            </p>
          </div>

          <div className="p-3 bg-white dark:bg-slate-900 rounded-2xl border border-slate-100 dark:border-slate-800/60 android-shadow text-center flex flex-col items-center justify-center">
            <div className="p-1.5 rounded-lg bg-orange-50 dark:bg-orange-950/20 text-orange-500">
              <Clock className="w-4 h-4" />
            </div>
            <span className="text-[9px] font-black uppercase text-slate-400 mt-2 block leading-none">Tps moyen</span>
            <p className="text-base font-black font-mono text-slate-900 dark:text-white mt-1">
              {avgResponseTime > 0 ? `${avgResponseTime}s` : "N/A"}
            </p>
          </div>

        </div>

        {/* REVISION MODE ZONE */}
        <div className="space-y-3 bg-white dark:bg-slate-900 border border-slate-100 dark:border-slate-800 rounded-3xl p-4 android-shadow">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <div className="p-1.5 rounded-lg bg-orange-100 dark:bg-orange-950/30 text-orange-500">
                <BookOpen className="w-4.5 h-4.5" />
              </div>
              <h4 className="text-xs font-black text-slate-900 dark:text-white uppercase tracking-wider">
                Zone de Révisions
              </h4>
            </div>

            {/* Toggle tabs */}
            <div className="flex bg-slate-100 dark:bg-slate-950 p-1 rounded-xl text-[10px] font-black">
              <button
                onClick={() => { setActiveReviewTab("failed"); setExpandedQuestionId(null); }}
                className={`px-3 py-1.5 rounded-lg cursor-pointer ${
                  activeReviewTab === "failed" 
                    ? "bg-white dark:bg-slate-900 text-slate-900 dark:text-white shadow-sm" 
                    : "text-slate-400 hover:text-slate-600"
                }`}
              >
                Ratées ({failedQuestions.length})
              </button>
              <button
                onClick={() => { setActiveReviewTab("favorites"); setExpandedQuestionId(null); }}
                className={`px-3 py-1.5 rounded-lg cursor-pointer ${
                  activeReviewTab === "favorites" 
                    ? "bg-white dark:bg-slate-900 text-slate-900 dark:text-white shadow-sm" 
                    : "text-slate-400 hover:text-slate-600"
                }`}
              >
                Favoris ({favoriteQuestions.length})
              </button>
            </div>
          </div>

          {/* List display */}
          <div className="pt-2 space-y-2">
            {activeReviewTab === "failed" && (
              failedQuestions.length > 0 ? (
                failedQuestions.map((q) => {
                  const isExpanded = expandedQuestionId === q.id;
                  return (
                    <div 
                      key={q.id} 
                      className="border border-slate-100 dark:border-slate-800 rounded-2xl overflow-hidden bg-slate-50 dark:bg-slate-950/50"
                    >
                      <button
                        onClick={() => toggleExpandQuestion(q.id)}
                        className="w-full p-3 flex justify-between items-start text-left gap-3 cursor-pointer"
                      >
                        <div className="overflow-hidden">
                          <span className="text-[8px] font-black uppercase text-orange-500 bg-orange-500/10 px-2 py-0.5 rounded-md leading-none">
                            {q.category || "Général"}
                          </span>
                          <p className="text-[11px] font-bold text-slate-800 dark:text-slate-200 mt-1.5 leading-normal">
                            {q.questionText}
                          </p>
                        </div>
                        <div className="shrink-0 mt-0.5 text-slate-400">
                          {isExpanded ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
                        </div>
                      </button>

                      <AnimatePresence>
                        {isExpanded && (
                          <motion.div
                            initial={{ height: 0, opacity: 0 }}
                            animate={{ height: "auto", opacity: 1 }}
                            exit={{ height: 0, opacity: 0 }}
                            className="px-3 pb-3 border-t border-slate-100 dark:border-slate-800 pt-3 space-y-3 text-[10px]"
                          >
                            <div className="bg-emerald-500/10 p-2.5 rounded-xl border border-emerald-500/10">
                              <span className="font-black text-emerald-600 uppercase tracking-wider block text-[8px]">
                                Bonne réponse attendue
                              </span>
                              <p className="font-extrabold text-slate-800 dark:text-slate-200 mt-0.5">
                                {q.type === "libre" ? q.correctFreeText : q.type === "vrai_faux" || q.type === "qcm_single" ? q.options[q.correctAnswerIndex ?? 0] : (q.correctAnswerIndices || []).map(idx => q.options[idx]).join(", ")}
                              </p>
                            </div>

                            <div className="bg-blue-50 dark:bg-blue-950/20 p-2.5 rounded-xl text-slate-600 dark:text-slate-300 font-semibold leading-relaxed">
                              <span className="font-black text-blue-500 uppercase tracking-wider block text-[8px]">
                                Explication détaillée
                              </span>
                              <p className="mt-0.5 text-[9.5px]">
                                {q.explanation}
                              </p>
                            </div>

                            <button
                              onClick={() => handleRemoveFromRevisions(q.id)}
                              className="w-full py-2 bg-emerald-500 hover:bg-emerald-600 text-white rounded-xl text-[10px] font-black flex items-center justify-center gap-1 cursor-pointer transition-all active:scale-98"
                            >
                              <CheckCircle className="w-3.5 h-3.5" />
                              Marquer comme maîtrisé
                            </button>
                          </motion.div>
                        )}
                      </AnimatePresence>
                    </div>
                  );
                })
              ) : (
                <div className="py-6 text-center text-slate-400 text-xs font-semibold">
                  <CheckCircle className="w-6 h-6 mx-auto mb-2 text-emerald-500 opacity-60" />
                  Génial ! Tu n'as aucune question à réviser.
                </div>
              )
            )}

            {activeReviewTab === "favorites" && (
              favoriteQuestions.length > 0 ? (
                favoriteQuestions.map((q) => {
                  const isExpanded = expandedQuestionId === q.id;
                  return (
                    <div 
                      key={q.id} 
                      className="border border-slate-100 dark:border-slate-800 rounded-2xl overflow-hidden bg-slate-50 dark:bg-slate-950/50"
                    >
                      <button
                        onClick={() => toggleExpandQuestion(q.id)}
                        className="w-full p-3 flex justify-between items-start text-left gap-3 cursor-pointer"
                      >
                        <div className="overflow-hidden">
                          <span className="text-[8px] font-black uppercase text-amber-500 bg-amber-500/10 px-2 py-0.5 rounded-md leading-none">
                            {q.category || "Général"}
                          </span>
                          <p className="text-[11px] font-bold text-slate-800 dark:text-slate-200 mt-1.5 leading-normal">
                            {q.questionText}
                          </p>
                        </div>
                        <div className="shrink-0 mt-0.5 text-slate-400">
                          {isExpanded ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
                        </div>
                      </button>

                      <AnimatePresence>
                        {isExpanded && (
                          <motion.div
                            initial={{ height: 0, opacity: 0 }}
                            animate={{ height: "auto", opacity: 1 }}
                            exit={{ height: 0, opacity: 0 }}
                            className="px-3 pb-3 border-t border-slate-100 dark:border-slate-800 pt-3 space-y-3 text-[10px]"
                          >
                            <div className="bg-emerald-500/10 p-2.5 rounded-xl border border-emerald-500/10">
                              <span className="font-black text-emerald-600 uppercase tracking-wider block text-[8px]">
                                Bonne réponse attendue
                              </span>
                              <p className="font-extrabold text-slate-800 dark:text-slate-200 mt-0.5">
                                {q.type === "libre" ? q.correctFreeText : q.type === "vrai_faux" || q.type === "qcm_single" ? q.options[q.correctAnswerIndex ?? 0] : (q.correctAnswerIndices || []).map(idx => q.options[idx]).join(", ")}
                              </p>
                            </div>

                            <div className="bg-blue-50 dark:bg-blue-950/20 p-2.5 rounded-xl text-slate-600 dark:text-slate-300 font-semibold leading-relaxed">
                              <span className="font-black text-blue-500 uppercase tracking-wider block text-[8px]">
                                Explication détaillée
                              </span>
                              <p className="mt-0.5 text-[9.5px]">
                                {q.explanation}
                              </p>
                            </div>

                            <button
                              onClick={() => handleRemoveFromFavorites(q.id)}
                              className="w-full py-2 bg-slate-100 dark:bg-slate-900 text-red-500 rounded-xl text-[10px] font-black flex items-center justify-center gap-1 cursor-pointer transition-all active:scale-98 border border-slate-200 dark:border-slate-800"
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                              Retirer des favoris
                            </button>
                          </motion.div>
                        )}
                      </AnimatePresence>
                    </div>
                  );
                })
              ) : (
                <div className="py-6 text-center text-slate-400 text-xs font-semibold">
                  <Star className="w-6 h-6 mx-auto mb-2 text-amber-400 opacity-60" />
                  Aucun favori enregistré. Ajoute des questions en favoris pendant tes quiz !
                </div>
              )
            )}
          </div>
        </div>

        {/* Badges Section */}
        <div className="space-y-3">
          <h4 className="text-xs font-black text-slate-400 uppercase tracking-wider">
            Mes Badges ({user.badges.length}/{INITIAL_BADGES.length})
          </h4>

          <div className="grid grid-cols-2 gap-3 select-none">
            {INITIAL_BADGES.map((badge) => {
              const earned = user.badges.some(b => b.id === badge.id);
              return (
                <div
                  key={badge.id}
                  className={`p-3 rounded-2xl border transition-all flex items-center gap-3 ${
                    earned
                      ? "bg-white dark:bg-slate-900 border-slate-100 dark:border-slate-800/60 android-shadow opacity-100"
                      : "bg-slate-100/50 dark:bg-slate-900/30 border-dashed border-slate-200 dark:border-slate-800 opacity-60"
                  }`}
                >
                  <div 
                    className={`w-9 h-9 rounded-xl flex items-center justify-center text-white shrink-0 ${
                      earned ? "shadow-sm shadow-black/10" : "bg-slate-200 dark:bg-slate-800 text-slate-400"
                    }`}
                    style={earned ? { backgroundColor: badge.color } : {}}
                  >
                    <IconHelper name={badge.iconName} className="w-4 h-4" />
                  </div>

                  <div className="overflow-hidden">
                    <h5 className="text-xs font-black text-slate-800 dark:text-slate-200 truncate">
                      {badge.title}
                    </h5>
                    <p className="text-[9px] text-slate-400 font-medium leading-tight mt-0.5">
                      {badge.description}
                    </p>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Historique Play history */}
        <div className="space-y-3">
          <h4 className="text-xs font-black text-slate-400 uppercase tracking-wider">
            Historique de jeu
          </h4>

          {user.history.length > 0 ? (
            <div className="space-y-2.5">
              {user.history.map((item) => (
                <div
                  key={item.id}
                  className="p-3.5 bg-white dark:bg-slate-900 rounded-2xl border border-slate-100 dark:border-slate-800/60 android-shadow flex justify-between items-center"
                >
                  <div className="overflow-hidden pr-3">
                    <h5 className="text-xs font-black text-slate-800 dark:text-slate-200 truncate">
                      {item.quizTitle}
                    </h5>
                    <div className="flex items-center gap-2 mt-1 text-[10px] text-slate-400 font-semibold">
                      <span>{item.category}</span>
                      <span>•</span>
                      <span>{new Date(item.date).toLocaleDateString("fr-FR")}</span>
                    </div>
                  </div>

                  <div className="text-right shrink-0">
                    <span className="text-xs font-black text-slate-800 dark:text-slate-200 block">
                      {item.score}/{item.totalQuestions}
                    </span>
                    <span className="text-[10px] font-black text-blue-500 font-mono">
                      +{item.xpEarned} XP
                    </span>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="p-6 bg-white dark:bg-slate-900 rounded-2xl border border-dashed border-slate-200 dark:border-slate-800 text-center text-slate-400">
              <Award className="w-6 h-6 mx-auto mb-2 opacity-50" />
              <p className="text-xs font-semibold">Aucune partie jouée pour le moment.</p>
            </div>
          )}
        </div>

      </div>

    </div>
  );
}
