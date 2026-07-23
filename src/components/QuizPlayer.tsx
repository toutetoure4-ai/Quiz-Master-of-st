import { useState, useEffect, useRef } from "react";
import { Quiz, Question, UserProfile, UserHistoryItem, Badge, QuizDifficulty, QuizAttempt, AppSettings } from "../types";
import { INITIAL_BADGES } from "../data";
import IconHelper from "./IconHelper";
import { dbService } from "../lib/firebase";
import { 
  ArrowLeft, Check, X, Clock, Award, Star, Zap, Play, Pause,
  ChevronRight, MessageSquare, Volume2, VolumeX, Image as ImageIcon, Flame, RotateCcw, Share2, Sparkles, BookOpen, Coins
} from "lucide-react";
import { motion, AnimatePresence } from "motion/react";
import ShareCard from "./ShareCard";

interface QuizPlayerProps {
  user: UserProfile;
  quiz: Quiz;
  onBack: () => void;
  onFinishQuiz: (
    historyItem: UserHistoryItem,
    xpEarned: number,
    badgesUnlocked: Badge[],
    coinsReward?: number
  ) => void;
  isLevelMode?: boolean;
  levelNumber?: number;
  onLevelCompleted?: (levelNumber: number, score: number, totalQuestions: number, stars: number) => void;
  settings?: AppSettings;
}

export default function QuizPlayer({ 
  user, 
  quiz, 
  onBack, 
  onFinishQuiz, 
  isLevelMode = false,
  levelNumber,
  onLevelCompleted,
  settings = { darkMode: false, language: "fr", notificationsEnabled: true, privacyMode: false, textSize: "medium", ttsEnabled: false, ttsRate: 1.0 }
}: QuizPlayerProps) {
  // Draft / Resume states
  const [hasDraftChecked, setHasDraftChecked] = useState(false);
  const [foundDraft, setFoundDraft] = useState<QuizAttempt | null>(null);

  // Active questions pool
  const [activeQuestions, setActiveQuestions] = useState<Question[]>(quiz.questions);

  // Core quiz player states
  const [currentQuestionIdx, setCurrentQuestionIdx] = useState(0);
  const [selectedOptionIdx, setSelectedOptionIdx] = useState<number | null>(null); // For qcm_single / vrai_faux
  const [selectedOptionIndices, setSelectedOptionIndices] = useState<number[]>([]); // For qcm_multi
  const [freeTextValue, setFreeTextValue] = useState(""); // For libre
  const [isAnswered, setIsAnswered] = useState(false);
  const [score, setScore] = useState(0);
  const [currentStreak, setCurrentStreak] = useState(0);
  const [bestStreak, setBestStreak] = useState(0);
  const [totalXpEarned, setTotalXpEarned] = useState(0);
  
  // Speed bonuses and list of answer outcomes
  const [speedBonusesCount, setSpeedBonusesCount] = useState(0);
  const [streakBonusesXp, setStreakBonusesXp] = useState(0);
  const [questionOutcomes, setQuestionOutcomes] = useState<{ id: string; correct: boolean; responseTime: number }[]>([]);

  // Bookmark / Favorite state
  const [isFavorite, setIsFavorite] = useState(false);
  const [badgesUnlocked, setBadgesUnlocked] = useState<Badge[]>([]);

  // Audio player / TTS simulation state
  const [isAudioPlaying, setIsAudioPlaying] = useState(false);
  const [audioTimer, setAudioTimer] = useState<NodeJS.Timeout | null>(null);

  // Sharing Card
  const [showShareModal, setShowShareModal] = useState(false);
  const [isFinished, setIsFinished] = useState(false);
  const [avgTime, setAvgTime] = useState(0);
  const [shareToast, setShareToast] = useState(false);
  const [coinsReward, setCoinsReward] = useState<number | null>(null);

  // Timers
  const getQuestionTimeLimit = (q: Question) => q.recommendedTime || 15;
  const [timeLeft, setTimeLeft] = useState(15);
  const [globalTimeLeft, setGlobalTimeLeft] = useState(() => {
    // Sum of recommended times for the whole quiz
    return activeQuestions.reduce((acc, q) => acc + (q.recommendedTime || 15), 0);
  });

  const timerRef = useRef<NodeJS.Timeout | null>(null);
  const globalTimerRef = useRef<NodeJS.Timeout | null>(null);
  const questionStartTimeRef = useRef<number>(Date.now());
  const [responseTimes, setResponseTimes] = useState<number[]>([]);

  const currentQuestion = activeQuestions[currentQuestionIdx] || activeQuestions[0];

  // Check for active draft when quiz mounts
  useEffect(() => {
    const checkDraft = async () => {
      const draft = await dbService.getQuizAttempt(user.uid, quiz.id);
      if (draft && !draft.isCompleted) {
        setFoundDraft(draft);
      }
      setHasDraftChecked(true);
    };
    checkDraft();
  }, [user.uid, quiz.id]);

  // Load draft function
  const handleLoadDraft = (draft: QuizAttempt) => {
    setCurrentQuestionIdx(draft.currentQuestionIdx);
    setScore(draft.score);
    setSelectedOptionIdx(null);
    setSelectedOptionIndices([]);
    setFreeTextValue("");
    setIsAnswered(false);
    setResponseTimes(draft.responseTimes || []);
    
    // Calculate global time left from draft
    if (draft.globalTimeLeft) {
      setGlobalTimeLeft(draft.globalTimeLeft);
    }
    
    // Clear draft state to boot into the game
    setFoundDraft(null);
  };

  const handleDeclineDraft = async () => {
    await dbService.deleteQuizAttempt(user.uid, quiz.id);
    setFoundDraft(null);
  };

  // Check if current question is favorited when current question index changes
  useEffect(() => {
    if (currentQuestion) {
      dbService.isQuestionFavorite(user.uid, currentQuestion.id).then(setIsFavorite);
    }
  }, [currentQuestionIdx, currentQuestion, user.uid]);

  // Automatic Voice Reader (TTS Accessibility)
  useEffect(() => {
    if (settings?.ttsEnabled && currentQuestion && !isFinished && !foundDraft && hasDraftChecked) {
      const readText = async () => {
        // Wait 800ms so the question transition completes beautifully
        await new Promise(resolve => setTimeout(resolve, 800));
        if ("speechSynthesis" in window) {
          window.speechSynthesis.cancel();
          const qText = currentQuestion.questionText;
          let optionsText = "";
          if (currentQuestion.options && currentQuestion.options.length > 0) {
            optionsText = " . Les options de réponse sont : . " + currentQuestion.options.map((opt, i) => `Option ${i + 1} : ${opt}`).join(" . ");
          }
          const utterance = new SpeechSynthesisUtterance(qText + optionsText);
          utterance.lang = "fr-FR";
          utterance.rate = settings?.ttsRate || 1.0;
          window.speechSynthesis.speak(utterance);
        }
      };
      readText();
    }
    return () => {
      if ("speechSynthesis" in window) {
        window.speechSynthesis.cancel();
      }
    };
  }, [currentQuestionIdx, currentQuestion, settings?.ttsEnabled, isFinished, foundDraft, hasDraftChecked]);

  // Toggle favorite
  const handleToggleFavorite = async () => {
    const isFav = await dbService.toggleFavoriteQuestion(user.uid, currentQuestion.id);
    setIsFavorite(isFav);
  };

  // Start Global Timer
  useEffect(() => {
    if (!hasDraftChecked || foundDraft) return;

    globalTimerRef.current = setInterval(() => {
      setGlobalTimeLeft((prev) => {
        if (prev <= 1) {
          clearInterval(globalTimerRef.current!);
          handleGlobalTimeOut();
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    return () => {
      if (globalTimerRef.current) clearInterval(globalTimerRef.current);
    };
  }, [hasDraftChecked, foundDraft]);

  // Start question level timer
  useEffect(() => {
    if (!hasDraftChecked || foundDraft || isFinished) return;

    const limit = getQuestionTimeLimit(currentQuestion);
    setTimeLeft(limit);
    questionStartTimeRef.current = Date.now();
    setIsAnswered(false);
    setSelectedOptionIdx(null);
    setSelectedOptionIndices([]);
    setFreeTextValue("");
    setIsAudioPlaying(false);

    if (audioTimer) {
      clearInterval(audioTimer);
      setAudioTimer(null);
    }

    timerRef.current = setInterval(() => {
      setTimeLeft((prev) => {
        if (prev <= 1) {
          clearInterval(timerRef.current!);
          handleQuestionTimeOut();
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, [currentQuestionIdx, hasDraftChecked, foundDraft]);

  // Question Timeout handler
  const handleQuestionTimeOut = () => {
    if (isAnswered) return;
    setIsAnswered(true);
    setCurrentStreak(0); // Reset streak on timeout

    const limit = getQuestionTimeLimit(currentQuestion);
    setResponseTimes((prev) => [...prev, limit]);
    setQuestionOutcomes((prev) => [
      ...prev,
      { id: currentQuestion.id, correct: false, responseTime: limit },
    ]);

    // Save to revision
    dbService.addFailedQuestion(user.uid, currentQuestion.id);

    // Save attempt progress
    saveProgressDraft(currentQuestionIdx, score, [...responseTimes, limit]);
  };

  // Global Timeout handler
  const handleGlobalTimeOut = () => {
    if (isFinished) return;
    alert("Le temps global du quiz s'est écoulé !");
    handleCompleteQuiz(true);
  };

  // Audio Play Simulation & Web Speech Synthesis
  const handlePlayAudio = () => {
    if (isAudioPlaying) {
      setIsAudioPlaying(false);
      if (audioTimer) {
        clearInterval(audioTimer);
        setAudioTimer(null);
      }
      if ("speechSynthesis" in window) {
        window.speechSynthesis.cancel();
      }
    } else {
      setIsAudioPlaying(true);
      // Trigger Web Speech Synthesis in French to read the question out loud
      if ("speechSynthesis" in window) {
        window.speechSynthesis.cancel();
        const utterance = new SpeechSynthesisUtterance(currentQuestion.questionText);
        utterance.lang = "fr-FR";
        utterance.rate = settings?.ttsRate || 1.0;
        utterance.onend = () => {
          setIsAudioPlaying(false);
        };
        window.speechSynthesis.speak(utterance);
      } else {
        // Fallback simulation if speech synthesis is not supported
        const timer = setTimeout(() => {
          setIsAudioPlaying(false);
        }, 5000);
        setAudioTimer(timer);
      }
    }
  };

  // Clean up speech synthesis on unmount
  useEffect(() => {
    return () => {
      if ("speechSynthesis" in window) {
        window.speechSynthesis.cancel();
      }
    };
  }, []);

  // Multi-choice helper
  const handleToggleMultiOption = (idx: number) => {
    if (isAnswered) return;
    setSelectedOptionIndices((prev) => {
      if (prev.includes(idx)) {
        return prev.filter((i) => i !== idx);
      } else {
        return [...prev, idx];
      }
    });
  };

  // Submission handler for manual inputs (multi QCM, Libre)
  const handleSubmitAnswer = () => {
    if (isAnswered) return;
    if (timerRef.current) clearInterval(timerRef.current);

    const type = currentQuestion.type || "qcm_single";
    let isCorrect = false;

    if (type === "qcm_multi") {
      const correctIndices = currentQuestion.correctAnswerIndices || [];
      const hasAllCorrect = 
        selectedOptionIndices.length === correctIndices.length &&
        selectedOptionIndices.every((idx) => correctIndices.includes(idx));
      isCorrect = hasAllCorrect;
    } else if (type === "libre") {
      const typed = freeTextValue.trim().toLowerCase();
      const answer = (currentQuestion.correctFreeText || "").trim().toLowerCase();
      isCorrect = typed === answer;
    }

    processAnswerOutcome(isCorrect);
  };

  // Select option handler for qcm_single and vrai_faux
  const handleSelectSingleOption = (idx: number) => {
    if (isAnswered) return;
    if (timerRef.current) clearInterval(timerRef.current);

    setSelectedOptionIdx(idx);
    const isCorrect = idx === currentQuestion.correctAnswerIndex;
    processAnswerOutcome(isCorrect);
  };

  // Core answer processing
  const processAnswerOutcome = (isCorrect: boolean) => {
    setIsAnswered(true);

    const limit = getQuestionTimeLimit(currentQuestion);
    const duration = Math.min((Date.now() - questionStartTimeRef.current) / 1000, limit);
    const updatedResponseTimes = [...responseTimes, duration];
    setResponseTimes(updatedResponseTimes);

    // Speed bonus threshold (less than 35% of recommended time limit)
    const isSuperFast = duration < limit * 0.35;
    if (isCorrect && isSuperFast) {
      setSpeedBonusesCount((prev) => prev + 1);
    }

    // Streak tracker
    let nextStreak = currentStreak;
    if (isCorrect) {
      nextStreak += 1;
      setScore((prev) => prev + 1);
      setCurrentStreak(nextStreak);
      if (nextStreak > bestStreak) {
        setBestStreak(nextStreak);
      }

      // Add streak bonus XP directly
      if (nextStreak === 3) {
        setStreakBonusesXp((prev) => prev + 30);
      } else if (nextStreak === 5) {
        setStreakBonusesXp((prev) => prev + 60);
      } else if (nextStreak === 10) {
        setStreakBonusesXp((prev) => prev + 120);
      }
    } else {
      setCurrentStreak(0);
      // Mark question for revision mode
      dbService.addFailedQuestion(user.uid, currentQuestion.id);
    }

    // Save attempt progress
    saveProgressDraft(currentQuestionIdx, isCorrect ? score + 1 : score, updatedResponseTimes);

    setQuestionOutcomes((prev) => [
      ...prev,
      { id: currentQuestion.id, correct: isCorrect, responseTime: duration },
    ]);
  };

  // Auto-save draft helper
  const saveProgressDraft = async (qIdx: number, currentScore: number, times: number[]) => {
    const draft: QuizAttempt = {
      id: `draft_${user.uid}_${quiz.id}`,
      uid: user.uid,
      quizId: quiz.id,
      currentQuestionIdx: qIdx,
      score: currentScore,
      responseTimes: times,
      selectedAnswers: [], // Optional
      timeLeft: timeLeft,
      globalTimeLeft: globalTimeLeft,
      isCompleted: false,
      lastUpdated: new Date().toISOString(),
    };
    await dbService.saveQuizAttempt(draft);
  };

  const handleNext = () => {
    if (currentQuestionIdx < activeQuestions.length - 1) {
      setCurrentQuestionIdx((prev) => prev + 1);
    } else {
      handleCompleteQuiz(false);
    }
  };

  // End of quiz handling

  const handleCompleteQuiz = async (timedOutGlobally = false) => {
    if (globalTimerRef.current) clearInterval(globalTimerRef.current);
    if (timerRef.current) clearInterval(timerRef.current);

    // Delete saved draft upon successful completion
    await dbService.deleteQuizAttempt(user.uid, quiz.id);

    const finalScore = score;
    const totalQ = activeQuestions.length;
    const accuracyPct = Math.round((finalScore / totalQ) * 100);
    const starsEarned = accuracyPct === 100 ? 3 : accuracyPct >= 80 ? 2 : accuracyPct >= 60 ? 1 : 0;

    if (isLevelMode && levelNumber && onLevelCompleted) {
      onLevelCompleted(levelNumber, finalScore, totalQ, starsEarned);
    }

    // SCORING WITH MULTIPLIERS
    // Base XP: 200 XP per correct answer
    // Difficulty multipliers: Facile: 1.0x, Moyen: 1.5x, Difficile: 2.0x
    let difficultyMultiplier = 1.0;
    if (quiz.difficulty === QuizDifficulty.MOYEN) difficultyMultiplier = 1.5;
    if (quiz.difficulty === QuizDifficulty.DIFFICILE) difficultyMultiplier = 2.0;

    let baseScoreXp = finalScore * 200;
    let baseWithMultiplier = Math.round(baseScoreXp * difficultyMultiplier);

    // Extra bonuses
    let speedBonusXp = speedBonusesCount * 25; // +25 XP per lightning fast answer
    let perfectScoreXp = finalScore === totalQ ? 150 : 0; // +150 XP for flawless play

    const finalXpEarned = baseWithMultiplier + speedBonusXp + streakBonusesXp + perfectScoreXp;
    setTotalXpEarned(finalXpEarned);

    // Average time calculations
    const totalDuration = responseTimes.length > 0 ? responseTimes.reduce((a, b) => a + b, 0) : 0;
    const averageTime = totalQ > 0 ? totalDuration / totalQ : 0;
    setAvgTime(Number(averageTime.toFixed(1)));

    // Badge triggers
    const newlyUnlockedBadges: Badge[] = [];

    // Badge 1: Premier Pas (always unlock if first time)
    const hasPremierPas = user.badges.some((b) => b.id === "badge-1");
    if (!hasPremierPas) {
      const b1 = INITIAL_BADGES.find((b) => b.id === "badge-1");
      if (b1) newlyUnlockedBadges.push({ ...b1, earnedAt: new Date().toISOString() });
    }

    // Badge 2: Sans faute (perfect score)
    const hasSansFaute = user.badges.some((b) => b.id === "badge-2");
    if (finalScore === totalQ && !hasSansFaute) {
      const b2 = INITIAL_BADGES.find((b) => b.id === "badge-2");
      if (b2) newlyUnlockedBadges.push({ ...b2, earnedAt: new Date().toISOString() });
    }

    // Badge 3: Flash (lightning speed)
    const hasFlash = user.badges.some((b) => b.id === "badge-3");
    if (averageTime < 4 && finalScore >= 2 && !hasFlash) {
      const b3 = INITIAL_BADGES.find((b) => b.id === "badge-3");
      if (b3) newlyUnlockedBadges.push({ ...b3, earnedAt: new Date().toISOString() });
    }

    // Badge 5: Génie Scientifique
    const hasGenie = user.badges.some((b) => b.id === "badge-5");
    if (quiz.category === "Sciences" && quiz.difficulty === "Difficile" && finalScore >= 3 && !hasGenie) {
      const b5 = INITIAL_BADGES.find((b) => b.id === "badge-5");
      if (b5) newlyUnlockedBadges.push({ ...b5, earnedAt: new Date().toISOString() });
    }

    // Badge 6: Maître du Streak
    const hasStreakBadge = user.badges.some((b) => b.title === "Série de Feu");
    if (bestStreak >= 3 && !hasStreakBadge) {
      newlyUnlockedBadges.push({
        id: "badge-streak-3",
        title: "Série de Feu",
        description: "Obtenir une série de 3 réponses correctes d'affilée !",
        iconName: "Flame",
        color: "#f59e0b",
        earnedAt: new Date().toISOString(),
      });
    }

    setBadgesUnlocked(newlyUnlockedBadges);
    setIsFinished(true);

    // Save statistics in DB
    await dbService.incrementQuizPlays(quiz.id);

    // Secure server-side validation and leaderboards update
    let serverAwardedCoins = 0;
    try {
      const validateRes = await fetch("/api/quiz/validate-score", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          uid: user.uid,
          quizId: quiz.id,
          score: finalScore * 100, // point conversion for global competitive leaderboard
          accuracy: Math.round((finalScore / totalQ) * 100),
          xpEarned: finalXpEarned,
          responseTimes: responseTimes,
          correctAnswersCount: finalScore,
          totalQuestions: totalQ,
          bestStreak: bestStreak,
          category: quiz.category,
          difficulty: quiz.difficulty
        })
      });

      if (validateRes.ok) {
        console.log("Score validated securely on server !");
        const valData = await validateRes.json();
        if (valData && typeof valData.coinsReward === "number") {
          serverAwardedCoins = valData.coinsReward;
          setCoinsReward(valData.coinsReward);
        }
      }
    } catch (e) {
      console.error("Server score validation failed:", e);
    }

    // Challenge check and submission
    const activeChallengeId = sessionStorage.getItem("active_challenge_id");
    if (activeChallengeId) {
      try {
        await fetch("/api/challenges/complete", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            challengeId: activeChallengeId,
            uid: user.uid,
            score: finalScore * 100,
            accuracy: Math.round((finalScore / totalQ) * 100)
          })
        });
        sessionStorage.removeItem("active_challenge_id");
      } catch (e) {
        console.error("Challenge score submission failed:", e);
      }
    }

    // Generate UserHistoryItem
    const historyItem: UserHistoryItem = {
      id: `hist-${Date.now()}`,
      quizId: quiz.id,
      quizTitle: quiz.title,
      category: quiz.category,
      score: finalScore,
      totalQuestions: totalQ,
      xpEarned: finalXpEarned,
      date: new Date().toISOString(),
      timeTaken: Math.round(totalDuration),
      correctAnswersCount: finalScore,
      wrongAnswersCount: totalQ - finalScore,
      accuracy: Math.round((finalScore / totalQ) * 100),
    };

    onFinishQuiz(historyItem, finalXpEarned, newlyUnlockedBadges, serverAwardedCoins);
  };

  // Share social scorecard function
  const handleShareScore = () => {
    const accuracy = Math.round((score / quiz.questions.length) * 100);
    const shareText = `🏆 J'ai fait un score de ${score}/${quiz.questions.length} (${accuracy}%) sur le quiz "${quiz.title}" sur QuizMaster ! Viens me défier ! 🚀`;
    navigator.clipboard.writeText(shareText);
    setShareToast(true);
    setTimeout(() => setShareToast(false), 3000);
    setShowShareModal(true);
  };

  // RENDER FLOW CHECKING

  // 1. Initial Checking screen loader
  if (!hasDraftChecked) {
    return (
      <div className="flex-1 flex flex-col items-center justify-center bg-slate-50 dark:bg-slate-950">
        <div className="w-10 h-10 border-4 border-slate-200 border-t-blue-500 rounded-full animate-spin"></div>
        <p className="text-xs text-slate-500 font-bold mt-4">Chargement du quiz...</p>
      </div>
    );
  }

  // 2. Resume Draft Modal/View
  if (foundDraft) {
    const pct = Math.round((foundDraft.currentQuestionIdx / quiz.questions.length) * 100);
    return (
      <div className="flex-1 flex flex-col justify-between p-6 bg-slate-50 dark:bg-slate-950">
        <div className="my-auto text-center space-y-6">
          <motion.div 
            initial={{ scale: 0.9, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            className="w-16 h-16 rounded-3xl bg-orange-100 dark:bg-orange-950/40 text-orange-500 flex items-center justify-center mx-auto"
          >
            <Flame className="w-9 h-9 fill-orange-500/10 animate-pulse" />
          </motion.div>

          <div className="space-y-2">
            <h3 className="text-xl font-black font-display text-slate-900 dark:text-white">
              Reprendre la partie ?
            </h3>
            <p className="text-xs text-slate-500 dark:text-slate-400 max-w-xs mx-auto leading-relaxed">
              Une tentative de quiz interrompue a été trouvée pour <strong>{quiz.title}</strong>. Tu en étais à la question {foundDraft.currentQuestionIdx + 1}.
            </p>
          </div>

          {/* Progress bar preview */}
          <div className="p-4 bg-white dark:bg-slate-900 border border-slate-100 dark:border-slate-800 rounded-2xl max-w-xs mx-auto android-shadow">
            <div className="flex justify-between items-center text-[10px] text-slate-400 font-bold">
              <span>Progression</span>
              <span>{pct}%</span>
            </div>
            <div className="w-full h-2 bg-slate-100 dark:bg-slate-800 rounded-full mt-1.5 overflow-hidden">
              <div className="bg-orange-400 h-full rounded-full" style={{ width: `${pct}%` }} />
            </div>
            <div className="text-[10px] text-slate-500 font-extrabold mt-3 text-left flex justify-between">
              <span>Score actuel: {foundDraft.score} pts</span>
              <span>Question {foundDraft.currentQuestionIdx + 1}/{quiz.questions.length}</span>
            </div>
          </div>
        </div>

        <div className="flex gap-4">
          <button
            onClick={handleDeclineDraft}
            className="flex-1 py-4 bg-slate-100 dark:bg-slate-900 text-slate-600 dark:text-slate-400 text-xs font-bold rounded-2xl cursor-pointer"
          >
            Recommencer à zéro
          </button>
          <button
            onClick={() => handleLoadDraft(foundDraft)}
            className="flex-1 py-4 bg-blue-500 hover:bg-blue-600 text-white text-xs font-black rounded-2xl flex items-center justify-center gap-1.5 shadow-lg shadow-blue-500/10 cursor-pointer"
          >
            Continuer la partie
            <ChevronRight className="w-4 h-4" />
          </button>
        </div>
      </div>
    );
  }

  // 3. Finished Results Dashboard
  if (isFinished) {
    const accuracy = Math.round((score / quiz.questions.length) * 100);
    const feedbackMsg =
      accuracy === 100 ? "Légendaire ! Sans-faute absolu ! 🏆" :
      accuracy >= 75 ? "Excellent travail ! Tu assures ! 🌟" :
      accuracy >= 50 ? "Pas mal ! Encore un peu d'entraînement ! 👍" :
      "Dommage... Retente ta chance pour faire mieux ! 💪";

    return (
      <div className="flex-1 flex flex-col bg-slate-50 dark:bg-slate-950 overflow-y-auto px-6 py-6 select-none relative">
        
        {/* Share scorecard Toast notification */}
        <AnimatePresence>
          {shareToast && (
            <motion.div
              initial={{ y: -50, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              exit={{ y: -50, opacity: 0 }}
              className="absolute top-4 left-6 right-6 p-3 bg-emerald-500 text-white rounded-2xl text-center text-xs font-black shadow-lg z-50 flex items-center justify-center gap-2"
            >
              <Check className="w-4 h-4" />
              Score copié dans le presse-papiers !
            </motion.div>
          )}
        </AnimatePresence>

        {/* Results Banner Header */}
        <div className="flex flex-col items-center text-center mt-2">
          <motion.div 
            initial={{ scale: 0.8, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            transition={{ type: "spring", stiffness: 200, damping: 15 }}
            className="w-16 h-16 rounded-3xl bg-amber-500/10 border-2 border-amber-500 flex items-center justify-center text-amber-500 shadow-lg shadow-amber-500/10"
          >
            <Award className="w-9 h-9" />
          </motion.div>

          <h2 className="text-xl font-black font-display text-slate-900 dark:text-white mt-4">
            Quiz terminé !
          </h2>
          <p className="text-xs font-semibold text-blue-500 mt-0.5 max-w-xs leading-relaxed">
            {feedbackMsg}
          </p>
        </div>

        {/* Dynamic QuizCoins Reward Banner with Floating Coins animation */}
        {coinsReward !== null && coinsReward > 0 && (
          <motion.div
            initial={{ scale: 0.3, opacity: 0 }}
            animate={{ scale: [0.9, 1.1, 1], opacity: 1 }}
            transition={{ duration: 0.6, ease: "easeOut" }}
            className="mt-5 p-4 bg-gradient-to-r from-amber-500 to-orange-500 rounded-3xl border border-amber-400 text-white shadow-lg shadow-amber-500/20 text-center flex flex-col items-center relative overflow-hidden select-none"
          >
            {/* Background floating sparkle shapes */}
            <div className="absolute top-0 right-0 -mr-4 -mt-4 w-16 h-16 bg-white/10 rounded-full blur-sm" />
            <div className="absolute bottom-0 left-0 -ml-4 -mb-4 w-12 h-12 bg-white/10 rounded-full blur-sm" />
            
            <div className="flex items-center gap-3">
              <motion.div
                animate={{ rotate: 360 }}
                transition={{ repeat: Infinity, duration: 4, ease: "linear" }}
                className="w-10 h-10 rounded-2xl bg-white/20 flex items-center justify-center shadow-inner shrink-0"
              >
                <Coins className="w-6 h-6 text-yellow-300 fill-yellow-400" />
              </motion.div>
              
              <div className="text-left">
                <p className="text-[9px] font-black uppercase text-amber-100 tracking-widest leading-none">Victoire Économique</p>
                <h4 className="text-base font-black font-display text-white mt-1 leading-none">
                  +{coinsReward} QuizCoins !
                </h4>
              </div>
            </div>
            
            <p className="text-[10px] text-white/90 font-semibold mt-2.5 leading-tight">
              Félicitations ! Tes QuizCoins ont été versés de manière sécurisée dans ton portefeuille.
            </p>
          </motion.div>
        )}

        {/* Stat Dashboard Card Blocks */}
        <div className="my-5 space-y-4">
          <div className="grid grid-cols-2 gap-4">
            
            {/* Score box */}
            <div className="p-4 bg-white dark:bg-slate-900 border border-slate-100 dark:border-slate-800 rounded-2xl android-shadow text-center flex flex-col justify-between">
              <div>
                <span className="text-[9px] font-black uppercase text-slate-400">Score Final</span>
                <p className="text-xl font-black font-mono text-slate-900 dark:text-white mt-1">
                  {score} / {quiz.questions.length}
                </p>
              </div>
              <div className="w-full bg-slate-100 dark:bg-slate-800 h-1.5 rounded-full overflow-hidden mt-2.5">
                <div 
                  className="bg-blue-500 h-full rounded-full" 
                  style={{ width: `${accuracy}%` }}
                />
              </div>
            </div>

            {/* XP Gained breakout block */}
            <div className="p-4 bg-white dark:bg-slate-900 border border-slate-100 dark:border-slate-800 rounded-2xl android-shadow text-center flex flex-col justify-between">
              <div>
                <span className="text-[9px] font-black uppercase text-slate-400">Total XP Remportés</span>
                <p className="text-xl font-black font-mono text-blue-500 mt-1">
                  +{totalXpEarned} XP
                </p>
              </div>
              <span className="text-[8px] font-bold text-slate-400 mt-1 block leading-tight">
                Multiplier: {quiz.difficulty === QuizDifficulty.DIFFICILE ? "2.0x" : quiz.difficulty === QuizDifficulty.MOYEN ? "1.5x" : "1.0x"}
                {speedBonusesCount > 0 && ` • Vitesse (+${speedBonusesCount * 25})`}
                {streakBonusesXp > 0 && ` • Série (+${streakBonusesXp})`}
              </span>
            </div>

          </div>

          {/* Mini scorecard metrics row */}
          <div className="p-4 bg-white dark:bg-slate-900 border border-slate-100 dark:border-slate-800 rounded-2xl android-shadow flex items-center justify-around">
            <div className="text-center">
              <span className="text-[9px] font-black uppercase text-slate-400">Précision</span>
              <p className="text-base font-black font-mono text-slate-900 dark:text-white mt-0.5">
                {accuracy}%
              </p>
            </div>
            <div className="w-px h-8 bg-slate-100 dark:bg-slate-800"></div>
            <div className="text-center">
              <span className="text-[9px] font-black uppercase text-slate-400">Temps moyen</span>
              <p className="text-base font-black font-mono text-slate-900 dark:text-white mt-0.5">
                {avgTime}s / q
              </p>
            </div>
            <div className="w-px h-8 bg-slate-100 dark:bg-slate-800"></div>
            <div className="text-center">
              <span className="text-[9px] font-black uppercase text-slate-400">Meilleure Série</span>
              <p className="text-base font-black font-mono text-amber-500 mt-0.5 flex items-center justify-center gap-0.5">
                <Flame className="w-4 h-4 fill-amber-500/10" />
                {bestStreak}
              </p>
            </div>
          </div>
        </div>

        {/* Unlocked Badges Alerts */}
        {badgesUnlocked.length > 0 && (
          <div className="mb-5 space-y-3">
            <h4 className="text-[10px] font-black text-slate-400 uppercase tracking-wider block">
              Badge(s) débloqué(s) ! 🎉
            </h4>
            <div className="space-y-2">
              {badgesUnlocked.map(badge => (
                <motion.div 
                  key={badge.id}
                  initial={{ x: -20, opacity: 0 }}
                  animate={{ x: 0, opacity: 1 }}
                  className="p-3 bg-gradient-to-r from-blue-500/10 to-indigo-500/10 dark:from-blue-950/20 dark:to-indigo-950/20 border border-blue-500/20 rounded-2xl flex items-center gap-3.5"
                >
                  <div 
                    className="w-10 h-10 rounded-xl flex items-center justify-center text-white shrink-0 shadow-sm"
                    style={{ backgroundColor: badge.color }}
                  >
                    <IconHelper name={badge.iconName} className="w-5 h-5" />
                  </div>
                  <div>
                    <h5 className="text-xs font-black text-slate-800 dark:text-slate-200">
                      {badge.title}
                    </h5>
                    <p className="text-[10px] text-slate-400 font-medium leading-tight mt-0.5">
                      {badge.description}
                    </p>
                  </div>
                </motion.div>
              ))}
            </div>
          </div>
        )}

        {/* Dynamic Revision mode prompt (if failed any questions) */}
        {accuracy < 100 && (
          <div className="mb-6 p-4 bg-blue-50 dark:bg-blue-950/20 rounded-2xl border border-blue-500/10 flex items-center gap-3">
            <BookOpen className="w-6 h-6 text-blue-500 shrink-0" />
            <div className="flex-1">
              <h5 className="text-xs font-black text-slate-800 dark:text-slate-200 leading-tight">
                Mode Révision activé !
              </h5>
              <p className="text-[10px] text-slate-500 dark:text-slate-400 mt-0.5 leading-normal">
                Les questions manquées ont été ajoutées à tes révisions. Tu pourras les rejouer depuis ton profil pour te perfectionner.
              </p>
            </div>
          </div>
        )}

        {/* Scoreboard Actions Bar */}
        <div className="space-y-3 mt-auto">
          <button
            onClick={handleShareScore}
            className="w-full py-3.5 bg-slate-100 dark:bg-slate-900 text-slate-700 dark:text-slate-300 rounded-2xl text-xs font-bold flex items-center justify-center gap-2 cursor-pointer border border-slate-200 dark:border-slate-800/60"
          >
            <Share2 className="w-4 h-4" />
            Partager mes résultats
          </button>
          
          <button
            onClick={onBack}
            className="w-full py-4 bg-blue-500 hover:bg-blue-600 text-white rounded-2xl text-xs font-black flex items-center justify-center gap-2 shadow-lg shadow-blue-500/10 cursor-pointer active:scale-98 transition-all"
          >
            Retourner à l'accueil
            <ChevronRight className="w-4.5 h-4.5" />
          </button>
        </div>

        <AnimatePresence>
          {showShareModal && (
            <ShareCard
              type={score === activeQuestions.length ? "highscore" : "result"}
              title={quiz.title}
              subtitle={`${score} réponses correctes sur ${activeQuestions.length}`}
              score={`${score}/${activeQuestions.length}`}
              xp={totalXpEarned}
              pseudo={user.pseudo}
              avatarUrl={user.avatarUrl}
              onClose={() => setShowShareModal(false)}
            />
          )}
        </AnimatePresence>
      </div>
    );
  }

  // Calculate timer visual percentage
  const limit = getQuestionTimeLimit(currentQuestion);
  const timerPercentage = (timeLeft / limit) * 100;

  // Active question type definition
  const type = currentQuestion.type || "qcm_single";

  return (
    <div className="flex-1 flex flex-col bg-slate-50 dark:bg-slate-950 overflow-hidden">
      
      {/* Header bar */}
      <div className="px-5 py-3 border-b border-slate-100 dark:border-slate-800/60 shrink-0 bg-white dark:bg-slate-950 flex items-center justify-between">
        <div className="flex items-center gap-3 overflow-hidden">
          <button
            onClick={onBack}
            className="p-2 hover:bg-slate-100 dark:hover:bg-slate-900 rounded-xl cursor-pointer text-slate-700 dark:text-slate-300"
          >
            <ArrowLeft className="w-5 h-5" />
          </button>
          <div className="overflow-hidden">
            <span className="text-[9px] font-black uppercase text-blue-500 px-2 py-0.5 rounded-md bg-blue-50 dark:bg-blue-950/40">
              {quiz.category}
            </span>
            <h3 className="text-xs font-bold text-slate-400 mt-1 truncate flex items-center gap-1.5">
              {isLevelMode ? (
                <>
                  <span className="text-indigo-500 font-extrabold uppercase text-[10px] bg-indigo-50 dark:bg-indigo-950/60 px-1.5 py-0.5 rounded">
                    Niveau {levelNumber || 1}
                  </span>
                  • Q{currentQuestionIdx + 1} sur {activeQuestions.length}
                </>
              ) : (
                `Q${currentQuestionIdx + 1} sur ${activeQuestions.length}`
              )} • {currentQuestion.difficulty || quiz.difficulty}
            </h3>
          </div>
        </div>

        {/* Streaks & Timer indicators */}
        <div className="flex items-center gap-2 shrink-0">
          
          {/* Flame streak indicator if active */}
          {currentStreak >= 2 && (
            <div className="px-2.5 py-1.5 rounded-xl bg-orange-500 text-white font-black font-mono text-xs flex items-center gap-1 animate-bounce">
              <Flame className="w-4 h-4 fill-current" />
              {currentStreak}
            </div>
          )}

          {/* Per-question Timer */}
          <div className={`px-3 py-1.5 rounded-xl font-black font-mono text-xs flex items-center gap-1.5 transition-colors duration-300 ${
            timeLeft <= 4 
              ? "bg-red-50 dark:bg-red-950/20 text-red-500 border border-red-500/20 animate-pulse" 
              : "bg-slate-100 dark:bg-slate-900 text-slate-700 dark:text-slate-300"
          }`}>
            <Clock className="w-3.5 h-3.5" />
            {timeLeft}s
          </div>

          {/* Global Timer */}
          <div className="px-2.5 py-1.5 rounded-xl bg-blue-50 dark:bg-blue-950/30 text-blue-600 dark:text-blue-400 border border-blue-500/10 font-bold font-mono text-xs flex items-center gap-1">
            <Sparkles className="w-3.5 h-3.5 animate-spin-slow" />
            {Math.floor(globalTimeLeft / 60)}:{(globalTimeLeft % 60).toString().padStart(2, "0")}
          </div>

        </div>
      </div>

      {/* Countdown Progress Slider */}
      <div className="w-full h-1 bg-slate-100 dark:bg-slate-900 shrink-0">
        <div 
          className={`h-full transition-all duration-1000 ease-linear ${
            timeLeft <= 4 ? "bg-red-500" : "bg-blue-500"
          }`}
          style={{ width: `${timerPercentage}%` }}
        />
      </div>

      {/* Main quiz interface fields */}
      <div className="flex-1 overflow-y-auto p-5 flex flex-col justify-between">
        
        {/* Bookmark star / Image / Audio questions presentation */}
        <div className="space-y-4">
          
          {/* Bookmark favorites star toggler in top-right of question card */}
          <div className="flex justify-end">
            <button
              onClick={handleToggleFavorite}
              className={`p-2 rounded-xl border transition-all cursor-pointer ${
                isFavorite 
                  ? "bg-amber-50 dark:bg-amber-950/20 border-amber-300 text-amber-500" 
                  : "bg-white dark:bg-slate-900 border-slate-100 dark:border-slate-800 text-slate-400"
              }`}
            >
              <Star className={`w-4 h-4 ${isFavorite ? "fill-amber-500" : ""}`} />
            </button>
          </div>

          {/* Display image question card if present */}
          {currentQuestion.imageUrl && (
            <div className="w-full h-40 rounded-3xl overflow-hidden border border-slate-100 dark:border-slate-800/60 shadow-inner relative group select-none">
              <img 
                src={currentQuestion.imageUrl} 
                alt="Question visual clue" 
                className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                referrerPolicy="no-referrer"
              />
              <div className="absolute top-3 left-3 px-2 py-1 bg-black/60 backdrop-blur-md rounded-lg text-[9px] text-white font-black uppercase tracking-wider flex items-center gap-1">
                <ImageIcon className="w-3 h-3" />
                Indice visuel
              </div>
            </div>
          )}

          {/* Display audio question card with wave simulation if present */}
          {(currentQuestion.audioUrl || currentQuestion.audioUrl === "") && (
            <div className="p-4 bg-white dark:bg-slate-900 border border-slate-100 dark:border-slate-800 rounded-2xl flex items-center justify-between shadow-sm">
              <div className="flex items-center gap-3.5">
                <button
                  onClick={handlePlayAudio}
                  className={`w-11 h-11 rounded-xl flex items-center justify-center transition-all cursor-pointer ${
                    isAudioPlaying 
                      ? "bg-red-500 text-white shadow-md shadow-red-500/20" 
                      : "bg-blue-500 text-white shadow-md shadow-blue-500/20"
                  }`}
                >
                  {isAudioPlaying ? <Pause className="w-5 h-5 fill-current" /> : <Play className="w-5 h-5 fill-current pl-0.5" />}
                </button>
                <div>
                  <h5 className="text-xs font-black text-slate-800 dark:text-slate-200">
                    Question Audio
                  </h5>
                  <p className="text-[10px] text-slate-400 font-medium">
                    {isAudioPlaying ? "Lecture en cours (TTS français)..." : "Clique pour écouter l'énoncé !"}
                  </p>
                </div>
              </div>

              {/* Glowing audio wave animation block */}
              {isAudioPlaying && (
                <div className="flex gap-1 items-end h-6 pr-1 select-none">
                  {[1.2, 0.6, 1.8, 1.0, 1.5, 0.7].map((delay, i) => (
                    <motion.div
                      key={i}
                      animate={{ height: ["10%", "100%", "10%"] }}
                      transition={{ duration: delay, repeat: Infinity, ease: "easeInOut" }}
                      className="w-1 bg-blue-500 rounded-full"
                      style={{ height: "100%" }}
                    />
                  ))}
                </div>
              )}
            </div>
          )}

          {/* Question text title */}
          <div className="py-4">
            <h2 className={`font-black font-sans leading-relaxed text-slate-900 dark:text-white text-center ${
              settings?.textSize === "small" ? "text-xs" :
              settings?.textSize === "large" ? "text-base md:text-lg" :
              settings?.textSize === "xlarge" ? "text-lg md:text-xl font-extrabold" :
              "text-sm md:text-base"
            }`}>
              {currentQuestion.questionText}
            </h2>
            {type === "qcm_multi" && (
              <span className="text-[9px] font-black text-blue-500 uppercase tracking-widest text-center block mt-1">
                Plusieurs réponses correctes possibles
              </span>
            )}
          </div>

        </div>

        {/* INPUT OPTIONS RENDERING BY QUESTION TYPE */}
        <div className="space-y-3 my-4">
          
          {/* A. QCM SINGLE OPTION CHOICE */}
          {(type === "qcm_single") && currentQuestion.options.map((option, idx) => {
            const isSelected = selectedOptionIdx === idx;
            const isCorrectAnswer = idx === currentQuestion.correctAnswerIndex;

            let buttonStyle = "bg-white dark:bg-slate-900 border-slate-100 dark:border-slate-800/60 text-slate-800 dark:text-slate-200 hover:border-blue-500/20";
            let indicatorStyle = "bg-slate-50 dark:bg-slate-950 border-slate-200 dark:border-slate-800 text-slate-500";
            let indicatorIcon = null;

            if (isAnswered) {
              if (isCorrectAnswer) {
                buttonStyle = "bg-emerald-500/10 border-emerald-500 text-emerald-600 dark:text-emerald-400 ring-2 ring-emerald-500/20";
                indicatorStyle = "bg-emerald-500 text-white border-emerald-500";
                indicatorIcon = <Check className="w-3.5 h-3.5" />;
              } else if (isSelected) {
                buttonStyle = "bg-red-500/10 border-red-500 text-red-600 dark:text-red-400 ring-2 ring-red-500/20";
                indicatorStyle = "bg-red-500 text-white border-red-500";
                indicatorIcon = <X className="w-3.5 h-3.5" />;
              } else {
                buttonStyle = "bg-white dark:bg-slate-900 border-slate-100 dark:border-slate-800/30 text-slate-400 dark:text-slate-500 opacity-60";
              }
            }

            return (
              <button
                key={idx}
                disabled={isAnswered}
                onClick={() => handleSelectSingleOption(idx)}
                className={`p-3.5 rounded-2xl border text-xs font-extrabold flex items-center gap-3 text-left w-full transition-all cursor-pointer ${buttonStyle}`}
              >
                <div className={`w-7 h-7 rounded-lg border shrink-0 flex items-center justify-center font-bold text-[11px] ${indicatorStyle}`}>
                  {indicatorIcon ? indicatorIcon : idx + 1}
                </div>
                <span className="flex-1 leading-tight font-bold">{option}</span>
              </button>
            );
          })}

          {/* B. VRAI / FAUX CHIPS (GIANT CHIPS) */}
          {type === "vrai_faux" && (
            <div className="grid grid-cols-2 gap-4">
              {currentQuestion.options.map((option, idx) => {
                const isSelected = selectedOptionIdx === idx;
                const isCorrectAnswer = idx === currentQuestion.correctAnswerIndex;

                let buttonStyle = "bg-white dark:bg-slate-900 border-slate-100 dark:border-slate-800/60 text-slate-800 dark:text-slate-200 hover:border-blue-500/20";
                let iconCls = option === "Vrai" ? "text-emerald-500 bg-emerald-500/10" : "text-rose-500 bg-rose-500/10";

                if (isAnswered) {
                  if (isCorrectAnswer) {
                    buttonStyle = "bg-emerald-500/10 border-emerald-500 text-emerald-600 dark:text-emerald-400 ring-2 ring-emerald-500/20";
                  } else if (isSelected) {
                    buttonStyle = "bg-red-500/10 border-red-500 text-red-600 dark:text-red-400 ring-2 ring-red-500/20";
                  } else {
                    buttonStyle = "bg-white dark:bg-slate-900 border-slate-100 dark:border-slate-800/30 text-slate-400 dark:text-slate-500 opacity-60";
                  }
                }

                return (
                  <button
                    key={idx}
                    disabled={isAnswered}
                    onClick={() => handleSelectSingleOption(idx)}
                    className={`py-8 rounded-3xl border text-sm font-black flex flex-col items-center justify-center gap-3 transition-all cursor-pointer ${buttonStyle}`}
                  >
                    <div className={`w-10 h-10 rounded-full flex items-center justify-center ${iconCls}`}>
                      {option === "Vrai" ? <Check className="w-5 h-5" /> : <X className="w-5 h-5" />}
                    </div>
                    {option}
                  </button>
                );
              })}
            </div>
          )}

          {/* C. QCM MULTI OPTIONS (WITH CHECKBOXES) */}
          {type === "qcm_multi" && currentQuestion.options.map((option, idx) => {
            const isSelected = selectedOptionIndices.includes(idx);
            const isCorrectIndex = (currentQuestion.correctAnswerIndices || []).includes(idx);

            let buttonStyle = "bg-white dark:bg-slate-900 border-slate-100 dark:border-slate-800/60 text-slate-800 dark:text-slate-200";
            let checkboxStyle = "border-slate-200 dark:border-slate-800 text-slate-300";

            if (isAnswered) {
              if (isCorrectIndex) {
                buttonStyle = "bg-emerald-500/10 border-emerald-500 text-emerald-600 dark:text-emerald-400 ring-1 ring-emerald-500/15";
                checkboxStyle = "bg-emerald-500 border-emerald-500 text-white";
              } else if (isSelected) {
                buttonStyle = "bg-red-500/10 border-red-500 text-red-600 dark:text-red-400 ring-1 ring-red-500/15";
                checkboxStyle = "bg-red-500 border-red-500 text-white";
              } else {
                buttonStyle = "bg-white dark:bg-slate-900 border-slate-100 dark:border-slate-800/30 text-slate-400 opacity-60";
              }
            } else if (isSelected) {
              buttonStyle = "bg-blue-500/10 border-blue-500 text-blue-600 dark:text-blue-400 ring-1 ring-blue-500/20";
              checkboxStyle = "bg-blue-500 border-blue-500 text-white";
            }

            return (
              <button
                key={idx}
                disabled={isAnswered}
                onClick={() => handleToggleMultiOption(idx)}
                className={`p-3.5 rounded-2xl border text-xs font-extrabold flex items-center gap-3 text-left w-full transition-all cursor-pointer ${buttonStyle}`}
              >
                <div className={`w-5 h-5 rounded-md border shrink-0 flex items-center justify-center font-bold text-xs ${checkboxStyle}`}>
                  {isSelected || (isAnswered && isCorrectIndex) ? <Check className="w-3.5 h-3.5" /> : null}
                </div>
                <span className="flex-1 leading-tight font-bold">{option}</span>
              </button>
            );
          })}

          {/* D. FREE TEXT INPUT FOR REPLIES */}
          {type === "libre" && (
            <div className="space-y-4 py-2">
              <input
                type="text"
                disabled={isAnswered}
                value={freeTextValue}
                onChange={(e) => setFreeTextValue(e.target.value)}
                placeholder="Rédige ta réponse ici..."
                className={`w-full px-4 py-4 bg-white dark:bg-slate-900 border text-xs font-bold rounded-2xl focus:outline-none focus:ring-2 focus:ring-blue-500 transition-all text-slate-900 dark:text-white ${
                  isAnswered
                    ? freeTextValue.trim().toLowerCase() === (currentQuestion.correctFreeText || "").trim().toLowerCase()
                      ? "bg-emerald-500/10 border-emerald-500 text-emerald-600"
                      : "bg-red-500/10 border-red-500 text-red-600"
                    : "border-slate-200 dark:border-slate-800"
                }`}
              />
              {isAnswered && (
                <div className="p-3 bg-emerald-50 dark:bg-emerald-950/20 border border-emerald-100 dark:border-emerald-900/40 rounded-xl text-center">
                  <span className="text-[10px] font-black text-emerald-500 uppercase tracking-wider block">
                    Bonne réponse attendue
                  </span>
                  <p className="text-xs font-black text-slate-800 dark:text-slate-200 mt-1">
                    "{currentQuestion.correctFreeText}"
                  </p>
                </div>
              )}
            </div>
          )}

        </div>

        {/* Correction Explanation display card */}
        <div className="min-h-[100px] flex items-center justify-center py-2">
          <AnimatePresence mode="wait">
            {isAnswered && (
              <motion.div
                initial={{ y: 15, opacity: 0 }}
                animate={{ y: 0, opacity: 1 }}
                exit={{ y: -15, opacity: 0 }}
                className="p-4 bg-blue-50/70 dark:bg-blue-950/20 border border-blue-500/10 rounded-2xl flex gap-3 w-full"
              >
                <div className="p-2 bg-blue-500/10 text-blue-500 rounded-xl shrink-0 h-fit">
                  <MessageSquare className="w-4 h-4 fill-blue-500/5" />
                </div>
                <div className="overflow-hidden">
                  <h4 className="text-[9px] font-black uppercase text-blue-500 tracking-wider">
                    Explication & Correction
                  </h4>
                  <p className="text-[10px] text-slate-600 dark:text-slate-300 font-semibold leading-relaxed mt-0.5">
                    {currentQuestion.explanation}
                  </p>
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        {/* BOTTOM ACTIVE ACTION BAR */}
        <div className="shrink-0 pt-2 flex flex-col gap-2">
          {isAnswered ? (
            <>
              <button
                onClick={handleNext}
                className="w-full py-4 bg-blue-500 hover:bg-blue-600 text-white rounded-2xl text-xs font-black flex items-center justify-center gap-1.5 shadow-lg shadow-blue-500/10 cursor-pointer active:scale-98 transition-all"
              >
                {currentQuestionIdx < activeQuestions.length - 1 ? (
                  <>
                    Question suivante
                    <ChevronRight className="w-4.5 h-4.5" />
                  </>
                ) : (
                  <>
                    Terminer le Quiz et voir mon score
                    <Award className="w-4.5 h-4.5" />
                  </>
                )}
              </button>
            </>
          ) : (
            <>
              {/* Conditional manual validation CTA button for Multi-Choice or Free text */}
              {(type === "qcm_multi" || type === "libre") ? (
                <button
                  onClick={handleSubmitAnswer}
                  disabled={(type === "qcm_multi" && selectedOptionIndices.length === 0) || (type === "libre" && !freeTextValue.trim())}
                  className={`w-full py-4 rounded-2xl text-xs font-black flex items-center justify-center gap-2 shadow-md cursor-pointer transition-all ${
                    (type === "qcm_multi" && selectedOptionIndices.length === 0) || (type === "libre" && !freeTextValue.trim())
                      ? "bg-slate-200 dark:bg-slate-800 text-slate-400 cursor-not-allowed"
                      : "bg-blue-500 hover:bg-blue-600 text-white shadow-blue-500/10 active:scale-98"
                  }`}
                >
                  <Check className="w-4.5 h-4.5" />
                  Valider ma réponse
                </button>
              ) : (
                <div className="w-full text-center py-4 text-[10px] font-black text-slate-400 uppercase tracking-wider">
                  Choisis une option de réponse pour continuer
                </div>
              )}
            </>
          )}
        </div>

      </div>

    </div>
  );
}
