import { useState, useEffect } from "react";
import { UserProfile, Quiz, AppSettings, UserHistoryItem, Badge } from "./types";
import { DEFAULT_QUIZZES, DEFAULT_LEADERBOARD, INITIAL_BADGES, CATEGORIES } from "./data";
import { motion, AnimatePresence } from "motion/react";

// Sub-components
import AndroidFrame from "./components/AndroidFrame";
import AuthScreen from "./components/AuthScreen";
import HomeScreen from "./components/HomeScreen";
import ExplorerScreen from "./components/ExplorerScreen";
import CreateScreen from "./components/CreateScreen";
import LeaderboardScreen from "./components/LeaderboardScreen";
import ProfileScreen from "./components/ProfileScreen";
import SettingsScreen from "./components/SettingsScreen";
import QuizPlayer from "./components/QuizPlayer";
import SocialHubScreen from "./components/SocialHubScreen";
import BoutiqueScreen from "./components/BoutiqueScreen";
import PremiumScreen from "./components/PremiumScreen";
import AdminPanel from "./components/AdminPanel";
import SplashScreen from "./components/SplashScreen";

import { Home, Search, PlusCircle, Trophy, User as UserIcon, Sparkles, Play, X, Award, Info, Gamepad2 } from "lucide-react";

export default function App() {
  // Splash Screen Active State
  const [showSplash, setShowSplash] = useState<boolean>(true);

  // Core Settings
  const [settings, setSettings] = useState<AppSettings>(() => {
    const saved = localStorage.getItem("qm_settings");
    if (saved) return JSON.parse(saved);
    return {
      darkMode: false,
      language: "fr",
      notificationsEnabled: true,
      privacyMode: false
    };
  });

  // Handle HTML document body dark class for global Tailwind dark mode styling
  useEffect(() => {
    const root = window.document.documentElement;
    if (settings.darkMode) {
      root.classList.add("dark");
    } else {
      root.classList.remove("dark");
    }
    localStorage.setItem("qm_settings", JSON.stringify(settings));
  }, [settings]);

  // Current Active User
  const [user, setUser] = useState<UserProfile | null>(() => {
    const saved = localStorage.getItem("qm_user_profile");
    return saved ? JSON.parse(saved) : null;
  });

  // Global Quizzes list (seeded initially from default data)
  const [quizzes, setQuizzes] = useState<Quiz[]>(() => {
    const saved = localStorage.getItem("qm_quizzes_list");
    if (saved) return JSON.parse(saved);
    return DEFAULT_QUIZZES;
  });

  // Sync state changes with localStorage and competitive server
  useEffect(() => {
    if (user) {
      localStorage.setItem("qm_user_profile", JSON.stringify(user));
      // Sync with in-memory multiplayer backend
      fetch("/api/user/sync", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ profile: user })
      }).catch(e => console.error("Failed user profile sync to backend", e));
    } else {
      localStorage.removeItem("qm_user_profile");
    }
  }, [user]);

  useEffect(() => {
    localStorage.setItem("qm_quizzes_list", JSON.stringify(quizzes));
  }, [quizzes]);

  // Active Screen / Tab Navigation
  const [activeTab, setActiveTab] = useState<string>("Accueil");
  const [preselectedCategory, setPreselectedCategory] = useState<string | null>(null);

  // Dynamic categories state
  const [categories, setCategories] = useState<any[]>(() => {
    const saved = localStorage.getItem("qm_categories");
    if (saved) return JSON.parse(saved);
    return CATEGORIES;
  });

  useEffect(() => {
    localStorage.setItem("qm_categories", JSON.stringify(categories));
  }, [categories]);

  const handleAddCategory = (newCat: any) => {
    setCategories((prev) => [...prev, newCat]);
  };

  // Active Quiz playing state
  const [activeQuiz, setActiveQuiz] = useState<Quiz | null>(null);
  const [showStartModal, setShowStartModal] = useState<boolean>(false);
  const [selectedQuizToPreview, setSelectedQuizToPreview] = useState<Quiz | null>(null);
  const [isInfiniteModeSelected, setIsInfiniteModeSelected] = useState<boolean>(false);

  const handleAuthSuccess = (profile: UserProfile) => {
    setUser(profile);
    setActiveTab("Accueil");
  };

  const handleLogout = () => {
    setUser(null);
    setActiveTab("Accueil");
    setActiveQuiz(null);
  };

  // Navigates to a tab, with optional category filter
  const handleNavigateToTab = (tab: string, filterCategory?: string) => {
    setActiveTab(tab);
    if (filterCategory) {
      setPreselectedCategory(filterCategory);
    }
  };

  // Handles adding a newly created quiz
  const handleCreateQuiz = (newQuiz: Quiz) => {
    setQuizzes([newQuiz, ...quizzes]);
    setActiveTab("Explorer");

    // Award "Créateur" badge to active user if they don't have it yet!
    if (user) {
      const hasCreatorBadge = user.badges.some(b => b.id === "badge-4");
      let updatedBadges = [...user.badges];
      
      if (!hasCreatorBadge) {
        const creatorBadge = INITIAL_BADGES.find(b => b.id === "badge-4");
        if (creatorBadge) {
          updatedBadges.push({
            ...creatorBadge,
            earnedAt: new Date().toISOString()
          });
        }
      }

      setUser({
        ...user,
        badges: updatedBadges
      });
    }
  };

  // Handles recording statistics, level-ups and badges after completing a quiz
  const handleFinishQuiz = (
    historyItem: UserHistoryItem,
    xpEarned: number,
    badgesEarned: Badge[],
    coinsReward?: number
  ) => {
    if (!user) return;

    // Calculate new XP
    let newXp = user.xp + xpEarned;
    let newLevel = user.level;

    // Level-up calculation: level up threshold is Level * 1000 XP
    while (newXp >= newLevel * 1000) {
      newXp -= newLevel * 1000;
      newLevel += 1;
    }

    const updatedHistory = [historyItem, ...user.history];
    const newPlayedCount = user.quizzesPlayedCount + 1;
    const newFinishedCount = user.quizzesFinishedCount + 1;

    // Accuracy Math
    const totalQuestionsSum = updatedHistory.reduce((acc, h) => acc + h.totalQuestions, 0);
    const totalCorrectSum = updatedHistory.reduce((acc, h) => acc + h.score, 0);
    const newSuccessRate = Math.round((totalCorrectSum / totalQuestionsSum) * 100);

    // Dynamic Badges Merger
    const uniqueBadges = [...user.badges];
    badgesEarned.forEach(badge => {
      if (!uniqueBadges.some(b => b.id === badge.id)) {
        uniqueBadges.push(badge);
      }
    });

    const rewardAmount = coinsReward || 0;
    const nextCoins = (user.quizCoins || 0) + rewardAmount;
    const nextCoinsEarned = (user.quizCoinsEarned || 0) + rewardAmount;

    setUser({
      ...user,
      xp: newXp,
      level: newLevel,
      quizCoins: nextCoins,
      quizCoinsEarned: nextCoinsEarned,
      quizzesPlayedCount: newPlayedCount,
      quizzesFinishedCount: newFinishedCount,
      successRate: newSuccessRate,
      averageResponseTime: 4.8, // Simulate average response speed
      history: updatedHistory,
      badges: uniqueBadges
    });

    // Increment play count of the specific quiz
    setQuizzes(prevQuizzes => 
      prevQuizzes.map(q => 
        q.id === historyItem.quizId 
          ? { ...q, playsCount: q.playsCount + 1 } 
          : q
      )
    );
  };

  return (
    <AndroidFrame darkMode={settings.darkMode}>
      {/* 0. Show professional loading screen (Splash Screen) for 3 seconds */}
      {showSplash ? (
        <SplashScreen onComplete={() => setShowSplash(false)} />
      ) : !user ? (
        /* 1. Show Auth screen if user is logged out */
        <AuthScreen onAuthSuccess={handleAuthSuccess} />
      ) : activeQuiz ? (
        /* 2. Show active quiz player session if currently playing */
        <QuizPlayer 
          user={user}
          quiz={activeQuiz}
          onBack={() => setActiveQuiz(null)}
          onFinishQuiz={handleFinishQuiz}
          isInfiniteMode={isInfiniteModeSelected}
          settings={settings}
        />
      ) : (
        /* 3. Show tabbed app interface */
        <div className="flex-1 flex flex-col h-full overflow-hidden relative">
          
          {/* Main Display Area */}
          <div className="flex-1 overflow-hidden flex flex-col">
            {activeTab === "Accueil" && user && (
              <HomeScreen 
                user={user} 
                quizzes={quizzes}
                onSelectQuiz={(quiz) => {
                  setSelectedQuizToPreview(quiz);
                  setIsInfiniteModeSelected(false); // Default standard
                  setShowStartModal(true);
                }}
                onNavigateToTab={handleNavigateToTab}
                onNavigateToBoutique={() => setActiveTab("Boutique")}
                onNavigateToPremium={() => setActiveTab("Premium")}
                onNavigateToAdmin={() => setActiveTab("AdminPanel")}
                onUpdateUser={setUser}
              />
            )}

            {activeTab === "Boutique" && user && (
              <BoutiqueScreen 
                user={user}
                onBack={() => setActiveTab("Accueil")}
                onUpdateUser={setUser}
              />
            )}

            {activeTab === "Premium" && user && (
              <PremiumScreen 
                user={user}
                onBack={() => setActiveTab("Accueil")}
                onUpdateUser={setUser}
              />
            )}

            {activeTab === "AdminPanel" && user && (
              <AdminPanel 
                user={user}
                onBack={() => setActiveTab("Accueil")}
                onUpdateUser={setUser}
              />
            )}

            {activeTab === "Explorer" && (
              <ExplorerScreen 
                quizzes={quizzes}
                onSelectQuiz={(quiz) => {
                  setSelectedQuizToPreview(quiz);
                  setIsInfiniteModeSelected(false); // Default standard
                  setShowStartModal(true);
                }}
                preselectedCategory={preselectedCategory}
                clearPreselectedCategory={() => setPreselectedCategory(null)}
              />
            )}

            {activeTab === "Créer" && (
              <CreateScreen 
                user={user}
                onCreateQuiz={handleCreateQuiz}
                categories={categories}
                onAddCategory={handleAddCategory}
              />
            )}

            {activeTab === "Social" && (
              <SocialHubScreen 
                user={user}
                quizzes={quizzes}
                onBack={() => setActiveTab("Accueil")}
                onPlayQuiz={(quiz) => {
                  setActiveQuiz(quiz);
                }}
              />
            )}

            {activeTab === "Classement" && (
              <LeaderboardScreen 
                user={user}
              />
            )}

            {activeTab === "Profil" && (
              <ProfileScreen 
                user={user}
                onNavigateToSettings={() => setActiveTab("Settings")}
                onUpdateUser={setUser}
              />
            )}

            {activeTab === "Settings" && (
              <SettingsScreen 
                settings={settings}
                onChangeSettings={(next) => setSettings(next)}
                onLogout={handleLogout}
                onBack={() => setActiveTab("Profil")}
              />
            )}
          </div>

          {/* Bottom MD3 Navigation bar (Only visible when not actively playing a quiz) */}
          {activeTab !== "Settings" && activeTab !== "Boutique" && activeTab !== "Premium" && activeTab !== "AdminPanel" && (
            <div className="w-full h-[68px] px-4 flex items-center justify-around border-t border-slate-100 dark:border-slate-800/60 bg-white/95 dark:bg-slate-950/95 backdrop-blur-md select-none shrink-0 z-40">
              
              <button
                id="nav-home"
                onClick={() => setActiveTab("Accueil")}
                className={`flex flex-col items-center gap-1 cursor-pointer transition-all ${
                  activeTab === "Accueil" 
                    ? "text-blue-500 font-extrabold scale-105" 
                    : "text-slate-400 dark:text-slate-500 hover:text-slate-600"
                }`}
              >
                <Home className="w-5 h-5" />
                <span className="text-[10px] tracking-tight">Accueil</span>
              </button>

              <button
                id="nav-explorer"
                onClick={() => setActiveTab("Explorer")}
                className={`flex flex-col items-center gap-1 cursor-pointer transition-all ${
                  activeTab === "Explorer" 
                    ? "text-blue-500 font-extrabold scale-105" 
                    : "text-slate-400 dark:text-slate-500 hover:text-slate-600"
                }`}
              >
                <Search className="w-5 h-5" />
                <span className="text-[10px] tracking-tight">Explorer</span>
              </button>

              <button
                id="nav-create"
                onClick={() => setActiveTab("Créer")}
                className={`flex flex-col items-center gap-1 cursor-pointer transition-all ${
                  activeTab === "Créer" 
                    ? "text-blue-500 font-extrabold scale-105" 
                    : "text-slate-400 dark:text-slate-500 hover:text-slate-600"
                }`}
              >
                <PlusCircle className="w-5 h-5" />
                <span className="text-[10px] tracking-tight">Créer</span>
              </button>

              <button
                id="nav-social"
                onClick={() => setActiveTab("Social")}
                className={`flex flex-col items-center gap-1 cursor-pointer transition-all ${
                  activeTab === "Social" 
                    ? "text-blue-500 font-extrabold scale-105" 
                    : "text-slate-400 dark:text-slate-500 hover:text-slate-600"
                }`}
              >
                <Gamepad2 className="w-5 h-5" />
                <span className="text-[10px] tracking-tight">Social</span>
              </button>

              <button
                id="nav-leaderboard"
                onClick={() => setActiveTab("Classement")}
                className={`flex flex-col items-center gap-1 cursor-pointer transition-all ${
                  activeTab === "Classement" 
                    ? "text-blue-500 font-extrabold scale-105" 
                    : "text-slate-400 dark:text-slate-500 hover:text-slate-600"
                }`}
              >
                <Trophy className="w-5 h-5" />
                <span className="text-[10px] tracking-tight">Classement</span>
              </button>

              <button
                id="nav-profile"
                onClick={() => setActiveTab("Profil")}
                className={`flex flex-col items-center gap-1 cursor-pointer transition-all ${
                  activeTab === "Profil" 
                    ? "text-blue-500 font-extrabold scale-105" 
                    : "text-slate-400 dark:text-slate-500 hover:text-slate-600"
                }`}
              >
                <UserIcon className="w-5 h-5" />
                <span className="text-[10px] tracking-tight">Profil</span>
              </button>

            </div>
          )}

          {/* Material Design 3 Style Quiz Start Drawer Modal */}
          <AnimatePresence>
            {showStartModal && selectedQuizToPreview && (
              <>
                {/* Backdrop Blur */}
                <motion.div
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 0.5 }}
                  exit={{ opacity: 0 }}
                  onClick={() => setShowStartModal(false)}
                  className="absolute inset-0 bg-black/60 backdrop-blur-sm z-50 cursor-pointer"
                />

                {/* Drawer Body */}
                <motion.div
                  initial={{ y: "100%" }}
                  animate={{ y: 0 }}
                  exit={{ y: "100%" }}
                  transition={{ type: "spring", damping: 25, stiffness: 220 }}
                  className="absolute bottom-0 left-0 right-0 max-h-[85%] bg-white dark:bg-slate-900 rounded-t-[32px] border-t border-slate-100 dark:border-slate-800/80 z-50 flex flex-col overflow-hidden select-none"
                >
                  {/* Pull Indicator Bar */}
                  <div className="w-12 h-1.5 bg-slate-200 dark:bg-slate-800 rounded-full mx-auto my-3 shrink-0" />

                  {/* Header */}
                  <div className="px-6 pb-2 flex items-center justify-between shrink-0">
                    <h3 className="text-base font-black text-slate-900 dark:text-white">
                      Prêt pour le défi ?
                    </h3>
                    <button
                      onClick={() => setShowStartModal(false)}
                      className="p-1.5 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-xl cursor-pointer text-slate-400 hover:text-slate-600 transition-colors"
                    >
                      <X className="w-5 h-5" />
                    </button>
                  </div>

                  {/* Scrollable Content */}
                  <div className="px-6 py-4 space-y-5 overflow-y-auto flex-1">
                    {/* Quiz Quick Preview Card */}
                    <div className="p-4 bg-slate-50 dark:bg-slate-950 rounded-2xl border border-slate-100 dark:border-slate-800/40">
                      <span className="text-[9px] font-black uppercase text-blue-500 px-2 py-0.5 rounded-md bg-blue-50 dark:bg-blue-950/40">
                        {selectedQuizToPreview.category}
                      </span>
                      <h4 className="text-sm font-black text-slate-900 dark:text-white mt-2">
                        {selectedQuizToPreview.title}
                      </h4>
                      <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-1 leading-relaxed">
                        {selectedQuizToPreview.description}
                      </p>
                      
                      {/* Meta stats */}
                      <div className="flex gap-4 border-t border-slate-100 dark:border-slate-800/40 pt-3 mt-3">
                        <div>
                          <span className="text-[9px] font-black text-slate-400 uppercase tracking-wider block">Questions</span>
                          <span className="text-xs font-black text-slate-800 dark:text-slate-200">{selectedQuizToPreview.questions.length}</span>
                        </div>
                        <div>
                          <span className="text-[9px] font-black text-slate-400 uppercase tracking-wider block">Difficulté</span>
                          <span className="text-xs font-black text-slate-800 dark:text-slate-200">{selectedQuizToPreview.difficulty}</span>
                        </div>
                        <div>
                          <span className="text-[9px] font-black text-slate-400 uppercase tracking-wider block">Créateur</span>
                          <span className="text-xs font-semibold text-blue-500">{selectedQuizToPreview.creatorPseudo || "Système"}</span>
                        </div>
                      </div>
                    </div>

                    {/* Mode Selector Option Cards */}
                    <div className="space-y-3">
                      <span className="text-[10px] font-black text-slate-400 uppercase tracking-wider block">
                        Choisis ton mode de jeu
                      </span>

                      {/* Mode A: Standard */}
                      <button
                        onClick={() => setIsInfiniteModeSelected(false)}
                        className={`w-full p-4 rounded-2xl border text-left flex items-center justify-between transition-all cursor-pointer ${
                          !isInfiniteModeSelected
                            ? "bg-blue-500/5 border-blue-500 ring-2 ring-blue-500/10"
                            : "bg-white dark:bg-slate-900 border-slate-100 dark:border-slate-800/60 hover:border-blue-500/20"
                        }`}
                      >
                        <div className="flex gap-3.5 items-center">
                          <div className={`w-10 h-10 rounded-xl flex items-center justify-center shrink-0 ${
                            !isInfiniteModeSelected ? "bg-blue-500 text-white" : "bg-slate-100 dark:bg-slate-800 text-slate-500"
                          }`}>
                            <Play className="w-5 h-5 fill-current pl-0.5" />
                          </div>
                          <div>
                            <h5 className="text-xs font-black text-slate-800 dark:text-slate-200">
                              Mode Classique (Chronométré)
                            </h5>
                            <p className="text-[10px] text-slate-500 dark:text-slate-400 font-medium mt-0.5 leading-tight">
                              Réponds aux {selectedQuizToPreview.questions.length} questions originales sous pression !
                            </p>
                          </div>
                        </div>
                        <div className={`w-5 h-5 rounded-full border flex items-center justify-center shrink-0 ${
                          !isInfiniteModeSelected ? "border-blue-500 bg-blue-500 text-white" : "border-slate-200 dark:border-slate-700"
                        }`}>
                          {!isInfiniteModeSelected && <div className="w-2 h-2 bg-white rounded-full" />}
                        </div>
                      </button>

                      {/* Mode B: Infinite AI Mode */}
                      <button
                        onClick={() => setIsInfiniteModeSelected(true)}
                        className={`w-full p-4 rounded-2xl border text-left flex items-center justify-between transition-all cursor-pointer relative overflow-hidden ${
                          isInfiniteModeSelected
                            ? "bg-indigo-500/5 border-indigo-500 ring-2 ring-indigo-500/10"
                            : "bg-white dark:bg-slate-900 border-slate-100 dark:border-slate-800/60 hover:border-indigo-500/20"
                        }`}
                      >
                        <div className="flex gap-3.5 items-center">
                          <div className={`w-10 h-10 rounded-xl flex items-center justify-center shrink-0 ${
                            isInfiniteModeSelected ? "bg-indigo-500 text-white" : "bg-slate-100 dark:bg-slate-800 text-slate-500"
                          }`}>
                            <Sparkles className="w-5 h-5" />
                          </div>
                          <div>
                            <div className="flex items-center gap-1.5">
                              <h5 className="text-xs font-black text-slate-800 dark:text-slate-200">
                                Mode Infini (Génération IA)
                              </h5>
                              <span className="text-[8px] font-black text-indigo-500 px-1.5 py-0.5 bg-indigo-50 dark:bg-indigo-950/40 rounded uppercase tracking-wider animate-pulse">
                                IA
                              </span>
                            </div>
                            <p className="text-[10px] text-slate-500 dark:text-slate-400 font-medium mt-0.5 leading-tight">
                              Génération en continu de questions uniques. Le jeu ne s'arrête jamais !
                            </p>
                          </div>
                        </div>
                        <div className={`w-5 h-5 rounded-full border flex items-center justify-center shrink-0 ${
                          isInfiniteModeSelected ? "border-indigo-500 bg-indigo-500 text-white" : "border-slate-200 dark:border-slate-700"
                        }`}>
                          {isInfiniteModeSelected && <div className="w-2 h-2 bg-white rounded-full" />}
                        </div>
                      </button>
                    </div>
                  </div>

                  {/* Action CTA Button */}
                  <div className="p-6 border-t border-slate-100 dark:border-slate-800/60 shrink-0 bg-white dark:bg-slate-900">
                    <button
                      onClick={() => {
                        setActiveQuiz(selectedQuizToPreview);
                        setShowStartModal(false);
                      }}
                      className={`w-full py-4 text-white text-xs font-black rounded-2xl flex items-center justify-center gap-2 cursor-pointer transition-all active:scale-98 shadow-lg ${
                        isInfiniteModeSelected
                          ? "bg-indigo-500 hover:bg-indigo-600 shadow-indigo-500/15"
                          : "bg-blue-500 hover:bg-blue-600 shadow-blue-500/15"
                      }`}
                    >
                      <Play className="w-4.5 h-4.5 fill-current" />
                      C'EST PARTI ! COMMENCER
                    </button>
                  </div>

                </motion.div>
              </>
            )}
          </AnimatePresence>

        </div>
      )}
    </AndroidFrame>
  );
}
