export enum QuizDifficulty {
  FACILE = "Facile",
  MOYEN = "Moyen",
  DIFFICILE = "Difficile",
  EXPERT = "Expert"
}

export type QuestionType = "qcm_single" | "qcm_multi" | "vrai_faux" | "libre";

export interface Question {
  id: string;
  questionText: string;
  options: string[]; // Options for QCM/Vrai_Faux. Empty for Free Text.
  correctAnswerIndex?: number; // For qcm_single and vrai_faux
  correctAnswerIndices?: number[]; // For qcm_multi (multiple answers)
  correctFreeText?: string; // For libre (free text response)
  explanation: string;
  type?: QuestionType;
  imageUrl?: string;
  audioUrl?: string;
  difficulty?: QuizDifficulty;
  recommendedTime?: number; // recommended time in seconds (e.g. 15)
  category?: string;
  isFavorite?: boolean;
}

export interface Quiz {
  id: string;
  title: string;
  description: string;
  category: string;
  difficulty: QuizDifficulty;
  questions: Question[];
  creatorId?: string;
  createdAt: string;
  playsCount: number;
  totalTimeLimit?: number; // Global time limit for the quiz in seconds
}

export interface Badge {
  id: string;
  title: string;
  description: string;
  iconName: string;
  color: string;
  earnedAt?: string;
}

export interface UserHistoryItem {
  id: string;
  quizId: string;
  quizTitle: string;
  category: string;
  score: number;
  totalQuestions: number;
  xpEarned: number;
  date: string;
  timeTaken?: number; // in seconds
  correctAnswersCount?: number;
  wrongAnswersCount?: number;
  accuracy?: number; // percentage
}

export interface UserStatistics {
  uid: string;
  quizzesPlayedCount: number;
  quizzesFinishedCount: number;
  totalTimeSpent: number; // in seconds
  averageResponseTime: number; // in seconds
  successRate: number; // percentage
  favoriteCategory: string;
  bestScore: number; // highest score on any quiz
  currentStreak: number; // current consecutive correct answers
  bestStreak: number; // highest consecutive correct answers
  totalXp: number;
  level: number;
}

export interface QuizAttempt {
  id: string;
  uid: string;
  quizId: string;
  currentQuestionIdx: number;
  score: number;
  responseTimes: number[];
  selectedAnswers: any[]; // User's custom selected answers
  timeLeft: number; // Remaining time for the current question
  globalTimeLeft?: number; // Remaining time for the whole quiz
  isCompleted: boolean;
  lastUpdated: string;
}

export interface Transaction {
  id: string;
  userId: string;
  type: "gain" | "depense";
  montant: number;
  raison: string; // e.g. "Quiz Facile", "Achat d'un Avatar", "Premium activé"
  date: string;
}

export interface DailyMission {
  id: string;
  title: string;
  rewardCoins: number;
  targetCount: number;
  currentCount: number;
  isCompleted: boolean;
  isClaimed: boolean;
  type: "quizzes_played" | "correct_answers" | "perfect_scores" | "challenges_played";
}

export interface ShopItem {
  id: string;
  name: string;
  type: "avatar" | "frame" | "theme" | "badge";
  rarity: "normal" | "rare" | "legendaire";
  price: number;
  value: string; // e.g. a link, color class, border/shadow class
  previewValue?: string;
}

export interface UserProfile {
  uid: string;
  email: string;
  pseudo: string;
  fullName: string;
  avatarUrl: string;
  level: number;
  xp: number;
  quizzesPlayedCount: number;
  quizzesFinishedCount: number;
  successRate: number; // percentage (e.g., 75)
  averageResponseTime: number; // in seconds
  badges: Badge[];
  joinDate: string;
  history: UserHistoryItem[];
  favorites?: string[]; // List of favorite question IDs or quiz IDs
  failedQuestionIds?: string[]; // List of failed question IDs for revision
  difficultQuestionIds?: string[]; // List of question IDs marked difficult
  
  // -- ÉCONOMIE DU JEU --
  quizCoins?: number;
  isPremium?: boolean;
  quizCoinsEarned?: number; // total cumulé
  
  // Customisations débloquées & activées
  activeFrame?: string; // id du cadre de profil actif
  activeTheme?: string; // id du thème de profil/jeu actif
  activeTitle?: string; // titre personnalisé
  activeEffects?: string; // effets visuels actifs
  
  unlockedAvatars?: string[]; // URLs d'avatars achetés
  unlockedFrames?: string[]; // IDs de cadres achetés
  unlockedThemes?: string[]; // IDs de thèmes achetés
  unlockedBadges?: string[]; // IDs de badges de la boutique achetés
  
  // Missions quotidiennes
  dailyMissions?: DailyMission[];
  lastMissionsRefresh?: string; // Format YYYY-MM-DD
}

export interface LeaderboardEntry {
  uid: string;
  pseudo: string;
  avatarUrl: string;
  xp: number;
  level: number;
  rank?: number;
  isCurrentUser?: boolean;
  country?: string;
  totalScore?: number;
  quizzesFinished?: number;
  successRate?: number;
  bestStreak?: number;
  categoryRankings?: Record<string, number>;
  lastUpdated?: string; // For daily, weekly, monthly filtering
  isPremium?: boolean;
  quizCoinsEarned?: number;
}

export interface Friend {
  uid: string;
  pseudo: string;
  avatarUrl: string;
  level: number;
  xp: number;
  status: "online" | "offline";
  successRate: number;
  bestStreak: number;
}

export interface FriendRequest {
  id: string;
  fromUid: string;
  fromPseudo: string;
  fromAvatarUrl: string;
  toUid: string;
  toPseudo: string;
  timestamp: string;
  status: "pending" | "accepted" | "declined";
}

export interface Challenge {
  id: string;
  creatorUid: string;
  creatorPseudo: string;
  creatorAvatarUrl: string;
  targetUid: string;
  targetPseudo: string;
  quizId: string;
  quizTitle: string;
  category: string;
  difficulty: QuizDifficulty;
  status: "pending" | "accepted" | "declined" | "completed";
  creatorScore?: number;
  creatorAccuracy?: number;
  targetScore?: number;
  targetAccuracy?: number;
  winnerUid?: string;
  timestamp: string;
}

export interface MultiplayerPlayer {
  uid: string;
  pseudo: string;
  avatarUrl: string;
  level: number;
  score: number;
  currentAnswerIdx?: number | null; // Selected option index or -1 for unanswered
  correctCount: number;
  isReady: boolean;
  hasAnswered: boolean;
  lastResponseTime?: number; // in milliseconds
}

export interface MultiplayerRoom {
  id: string; // Room Code (e.g. 123456)
  hostUid: string;
  hostPseudo: string;
  quiz: Quiz;
  players: MultiplayerPlayer[];
  status: "lobby" | "playing" | "finished";
  currentQuestionIdx: number;
  questionActive: boolean; // Is the countdown ticking
  timerLeft: number; // Ticking remaining seconds for current question
  answersSubmitted: number; // Count of players who answered current question
  timestamp: string;
}

export interface NotificationItem {
  id: string;
  title: string;
  body: string;
  type: "challenge_invite" | "challenge_result" | "badge_earned" | "reward_available" | "popular_quiz";
  timestamp: string;
  isRead: boolean;
  payload?: any;
}

export interface NotificationPreferences {
  challengeInvites: boolean;
  challengeResults: boolean;
  badgeUnlocks: boolean;
  dailyReminder: boolean;
  popularQuizzes: boolean;
}

export interface AppSettings {
  darkMode: boolean;
  language: "fr";
  notificationsEnabled: boolean;
  privacyMode: boolean;
  ttsEnabled?: boolean;
  ttsRate?: number; // Speech rate 0.5 - 2.0
  textSize?: "small" | "medium" | "large" | "xlarge";
  notificationPreferences?: NotificationPreferences;
}
