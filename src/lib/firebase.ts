import { UserProfile, Quiz, QuizAttempt, LeaderboardEntry, Transaction, DailyMission, ShopItem, Badge } from "../types";
import { DEFAULT_QUIZZES, DEFAULT_LEADERBOARD } from "../data";

// Dual-mode Firebase helper
let isFirebaseAvailable = false;
let db: any = null;
let auth: any = null;

// Safe dynamic config loader
try {
  // We check if firebase is imported and initialized correctly if config is present.
} catch (e) {
  console.log("Firebase is not initialized. Using persistent LocalStorage database engine instead.");
}

// Low-level helper to manage LocalStorage database collections (simulated Firestore)
const getCollection = (collectionName: string): any[] => {
  const data = localStorage.getItem(`qm_db_${collectionName}`);
  return data ? JSON.parse(data) : [];
};

const setCollection = (collectionName: string, data: any[]): void => {
  localStorage.setItem(`qm_db_${collectionName}`, JSON.stringify(data));
};

// Default Shop Items
export const DEFAULT_SHOP_ITEMS: ShopItem[] = [
  // Avatars
  { id: "avatar-pirate", name: "Pirate des Caraïbes", type: "avatar", rarity: "normal", price: 500, value: "https://api.dicebear.com/7.x/pixel-art/svg?seed=pirate" },
  { id: "avatar-ninja", name: "Maître Ninja", type: "avatar", rarity: "rare", price: 2000, value: "https://api.dicebear.com/7.x/pixel-art/svg?seed=ninja" },
  { id: "avatar-astronaut", name: "Explorateur Spatial", type: "avatar", rarity: "legendaire", price: 5000, value: "https://api.dicebear.com/7.x/pixel-art/svg?seed=astronaut" },
  
  // Cadres (Frames)
  { id: "frame-emerald", name: "Cadre Émeraude", type: "frame", rarity: "normal", price: 500, value: "border-emerald-500 border-4 shadow-md" },
  { id: "frame-star", name: "Cadre Stellaire", type: "frame", rarity: "rare", price: 2000, value: "border-amber-400 border-4 ring-2 ring-yellow-300 shadow-xl animate-pulse" },
  { id: "frame-cyberpunk", name: "Néon Cyberpunk", type: "frame", rarity: "legendaire", price: 5000, value: "border-fuchsia-500 border-4 ring-4 ring-cyan-400 shadow-cyan-500/50 shadow-2xl animate-pulse" },
  
  // Thèmes
  { id: "theme-forest", name: "Forêt Enchantée", type: "theme", rarity: "normal", price: 500, value: "bg-gradient-to-br from-emerald-800 to-teal-950 text-white" },
  { id: "theme-twilight", name: "Crépuscule Cosmique", type: "theme", rarity: "rare", price: 2000, value: "bg-gradient-to-br from-indigo-950 via-purple-950 to-pink-950 text-white border-2 border-purple-500/20" },
  { id: "theme-royal", name: "Or Impérial", type: "theme", rarity: "legendaire", price: 5000, value: "bg-gradient-to-r from-amber-500 via-yellow-400 to-amber-600 text-slate-900 border-4 border-yellow-200/50 font-black" },
  
  // Badges
  { id: "badge-amateur", name: "Initié des Quiz", type: "badge", rarity: "normal", price: 500, value: "Initié" },
  { id: "badge-collector", name: "Mégacollectionneur", type: "badge", rarity: "rare", price: 2000, value: "Mégacollectionneur" },
  { id: "badge-god", name: "Divinité Suprême", type: "badge", rarity: "legendaire", price: 5000, value: "Dieu du Quiz" }
];

// INITIALIZE PERSISTENT STORAGE
if (!localStorage.getItem("qm_db_quizzes")) {
  setCollection("quizzes", DEFAULT_QUIZZES);
}
if (!localStorage.getItem("qm_db_leaderboard")) {
  setCollection("leaderboard", DEFAULT_LEADERBOARD);
}
if (!localStorage.getItem("qm_db_shop_items")) {
  setCollection("shop_items", DEFAULT_SHOP_ITEMS);
}

export const dbService = {
  // --- USER PROFILE & STATISTICS ---
  async saveUserProfile(user: UserProfile): Promise<void> {
    const users = getCollection("users");
    const index = users.findIndex((u) => u.uid === user.uid);
    if (index >= 0) {
      users[index] = { ...users[index], ...user };
    } else {
      users.push(user);
    }
    setCollection("users", users);

    // Sync to leaderboard
    await this.updateLeaderboard(user.uid, user.pseudo, user.avatarUrl, user.xp, user.level, user.isPremium, user.quizCoinsEarned);
  },

  async getUserProfile(uid: string): Promise<UserProfile | null> {
    const users = getCollection("users");
    const user = users.find((u) => u.uid === uid);
    if (user) {
      // Ensure economy fields are initialized
      if (user.quizCoins === undefined) {
        user.quizCoins = 1000; // Gift 1000 QuizCoins initial for rich sandbox gameplay
        user.quizCoinsEarned = 1000;
        
        // Log transaction for welcome gift
        setTimeout(() => {
          this.addTransaction(uid, "gain", 1000, "Cadeau de bienvenue QuizMaster ! 🎁");
        }, 100);
      }
      if (user.isPremium === undefined) user.isPremium = false;
      if (user.quizCoinsEarned === undefined) user.quizCoinsEarned = user.quizCoins || 0;
      if (!user.unlockedAvatars) user.unlockedAvatars = [user.avatarUrl];
      if (!user.unlockedFrames) user.unlockedFrames = [];
      if (!user.unlockedThemes) user.unlockedThemes = [];
      if (!user.unlockedBadges) user.unlockedBadges = [];
      
      // Daily missions setup
      const todayStr = new Date().toISOString().split("T")[0];
      if (!user.dailyMissions || user.lastMissionsRefresh !== todayStr) {
        user.dailyMissions = this.generateDailyMissions();
        user.lastMissionsRefresh = todayStr;
        // Resave profile with new missions
        const idx = users.findIndex((u) => u.uid === uid);
        if (idx >= 0) {
          users[idx] = user;
          setCollection("users", users);
        }
      }
    }
    return user || null;
  },

  // --- REWARDS & MONETARY OPERATIONS ---
  async handleQuizCompletedReward(uid: string, difficulty: string): Promise<number> {
    const adminSettings = getCollection("admin_settings")[0] || {
      facile: 50,
      moyen: 100,
      difficile: 500,
      expert: 1000,
      premiumPrice: 5000
    };

    let rewardCoins = 50;
    const diff = String(difficulty).toLowerCase();
    if (diff === "facile") rewardCoins = adminSettings.facile;
    else if (diff === "moyen") rewardCoins = adminSettings.moyen;
    else if (diff === "difficile") rewardCoins = adminSettings.difficile;
    else if (diff === "expert") rewardCoins = adminSettings.expert;
    else rewardCoins = 100; // default Fallback

    // Save transaction
    await this.addTransaction(uid, "gain", rewardCoins, `Victoire Quiz (${difficulty}) 🏆`);
    
    // Progress missions
    await this.progressDailyMission(uid, "quizzes_played", 1);
    
    return rewardCoins;
  },

  // --- TRANSACTIONS LOGS (SECURE HISTORY) ---
  async getTransactions(uid: string): Promise<Transaction[]> {
    const txs = getCollection("transactions");
    return txs.filter((t) => t.userId === uid).sort((a, b) => b.date.localeCompare(a.date));
  },

  async addTransaction(uid: string, type: "gain" | "depense", montant: number, raison: string): Promise<Transaction> {
    const txs = getCollection("transactions");
    const newTx: Transaction = {
      id: `tx-${Date.now()}-${Math.floor(Math.random() * 1000)}`,
      userId: uid,
      type,
      montant,
      raison,
      date: new Date().toISOString()
    };
    txs.push(newTx);
    setCollection("transactions", txs);

    // Sync directly to user profile balance
    const users = getCollection("users");
    const index = users.findIndex((u) => u.uid === uid);
    if (index >= 0) {
      const u = users[index];
      const curCoins = u.quizCoins || 0;
      if (type === "gain") {
        u.quizCoins = curCoins + montant;
        u.quizCoinsEarned = (u.quizCoinsEarned || 0) + montant;
      } else {
        u.quizCoins = Math.max(0, curCoins - montant);
      }
      users[index] = u;
      setCollection("users", users);
      
      // Update leaderboard entry in real time
      await this.updateLeaderboard(u.uid, u.pseudo, u.avatarUrl, u.xp, u.level, u.isPremium, u.quizCoinsEarned);
    }

    return newTx;
  },

  // --- MISSIONS QUOTIDIENNES ---
  generateDailyMissions(): DailyMission[] {
    return [
      {
        id: "mission-1",
        title: "Jouer 3 quiz",
        rewardCoins: 100,
        targetCount: 3,
        currentCount: 0,
        isCompleted: false,
        isClaimed: false,
        type: "quizzes_played"
      },
      {
        id: "mission-2",
        title: "Faire 10 bonnes réponses",
        rewardCoins: 200,
        targetCount: 10,
        currentCount: 0,
        isCompleted: false,
        isClaimed: false,
        type: "correct_answers"
      },
      {
        id: "mission-3",
        title: "Gagner 5 parties",
        rewardCoins: 500,
        targetCount: 5,
        currentCount: 0,
        isCompleted: false,
        isClaimed: false,
        type: "perfect_scores" // or completed quizzes count
      }
    ];
  },

  async progressDailyMission(uid: string, type: "quizzes_played" | "correct_answers" | "perfect_scores" | "challenges_played", amount: number): Promise<UserProfile | null> {
    const user = await this.getUserProfile(uid);
    if (!user || !user.dailyMissions) return null;

    let changed = false;
    user.dailyMissions = user.dailyMissions.map(m => {
      if (m.type === type && !m.isCompleted) {
        m.currentCount = Math.min(m.targetCount, m.currentCount + amount);
        if (m.currentCount >= m.targetCount) {
          m.isCompleted = true;
        }
        changed = true;
      }
      return m;
    });

    if (changed) {
      await this.saveUserProfile(user);
    }
    return user;
  },

  async claimDailyMissionReward(uid: string, missionId: string): Promise<{ success: boolean; rewardCoins: number; profile: UserProfile | null }> {
    const user = await this.getUserProfile(uid);
    if (!user || !user.dailyMissions) return { success: false, rewardCoins: 0, profile: null };

    const mission = user.dailyMissions.find(m => m.id === missionId);
    if (!mission || !mission.isCompleted || mission.isClaimed) {
      return { success: false, rewardCoins: 0, profile: user };
    }

    mission.isClaimed = true;
    await this.addTransaction(uid, "gain", mission.rewardCoins, `Mission quotidienne : ${mission.title} 🌟`);
    
    // Fetch refreshed user profile
    const updatedUser = await this.getUserProfile(uid);
    return { success: true, rewardCoins: mission.rewardCoins, profile: updatedUser };
  },

  // --- BOUTIQUE DE JEUX ET CUSTOMISATION ---
  async getShopItems(): Promise<ShopItem[]> {
    return getCollection("shop_items");
  },

  async buyShopItem(uid: string, itemId: string): Promise<{ success: boolean; error?: string; profile: UserProfile | null }> {
    const user = await this.getUserProfile(uid);
    if (!user) return { success: false, error: "Profil introuvable", profile: null };

    const items = await this.getShopItems();
    const item = items.find(i => i.id === itemId);
    if (!item) return { success: false, error: "Objet introuvable dans la boutique", profile: user };

    // Check if already bought
    if (item.type === "avatar" && (user.unlockedAvatars || []).includes(item.value)) {
      return { success: false, error: "Tu possèdes déjà cet avatar", profile: user };
    }
    if (item.type === "frame" && (user.unlockedFrames || []).includes(item.id)) {
      return { success: false, error: "Tu possèdes déjà ce cadre de profil", profile: user };
    }
    if (item.type === "theme" && (user.unlockedThemes || []).includes(item.id)) {
      return { success: false, error: "Tu possèdes déjà ce thème", profile: user };
    }
    if (item.type === "badge" && (user.unlockedBadges || []).includes(item.id)) {
      return { success: false, error: "Tu possèdes déjà ce badge", profile: user };
    }

    // Check coins balance
    const cost = item.price;
    const balance = user.quizCoins || 0;
    if (balance < cost) {
      const missing = cost - balance;
      return { success: false, error: `Tu n'as pas assez de QuizCoins. Il te manque ${missing} QuizCoins !`, profile: user };
    }

    // Spend QuizCoins
    await this.addTransaction(uid, "depense", cost, `Achat Boutique : ${item.name} 🛍️`);

    // Add item to inventory
    const updated = await this.getUserProfile(uid);
    if (updated) {
      if (item.type === "avatar") {
        updated.unlockedAvatars = [...(updated.unlockedAvatars || []), item.value];
        updated.avatarUrl = item.value; // auto-equip avatar
      } else if (item.type === "frame") {
        updated.unlockedFrames = [...(updated.unlockedFrames || []), item.id];
        updated.activeFrame = item.id; // auto-equip frame
      } else if (item.type === "theme") {
        updated.unlockedThemes = [...(updated.unlockedThemes || []), item.id];
        updated.activeTheme = item.id; // auto-equip theme
      } else if (item.type === "badge") {
        updated.unlockedBadges = [...(updated.unlockedBadges || []), item.id];
        // Add badge directly into profile badges
        const specialBadge: Badge = {
          id: item.id,
          title: item.name,
          description: `Badge exclusif acheté dans la boutique : ${item.name}`,
          iconName: "Award",
          color: item.rarity === "legendaire" ? "#eab308" : item.rarity === "rare" ? "#a855f7" : "#10b981",
          earnedAt: new Date().toISOString()
        };
        updated.badges = [...(updated.badges || []), specialBadge];
      }
      await this.saveUserProfile(updated);
    }

    const finalProfile = await this.getUserProfile(uid);
    return { success: true, profile: finalProfile };
  },

  // --- ACHAT PREMIUM ---
  async buyPremium(uid: string): Promise<{ success: boolean; error?: string; profile: UserProfile | null }> {
    const user = await this.getUserProfile(uid);
    if (!user) return { success: false, error: "Profil introuvable", profile: null };

    if (user.isPremium) {
      return { success: false, error: "Tu possèdes déjà l'abonnement Premium !", profile: user };
    }

    const adminSettings = getCollection("admin_settings")[0] || { premiumPrice: 5000 };
    const price = adminSettings.premiumPrice;
    const balance = user.quizCoins || 0;

    if (balance < price) {
      const missing = price - balance;
      return { success: false, error: `Tu n'as pas assez de QuizCoins. Il te manque ${missing} QuizCoins.`, profile: user };
    }

    // Deduct coins and log transaction
    await this.addTransaction(uid, "depense", price, "Achat Abonnement Premium ✨");

    const updated = await this.getUserProfile(uid);
    if (updated) {
      updated.isPremium = true;
      
      // Award exclusive premium badge
      const premiumBadge: Badge = {
        id: "badge-premium-exclusive",
        title: "Membre Premium",
        description: "Abonné Premium de l'économie QuizMaster",
        iconName: "Sparkles",
        color: "#f59e0b",
        earnedAt: new Date().toISOString()
      };
      
      updated.badges = [...(updated.badges || []), premiumBadge];
      await this.saveUserProfile(updated);
    }

    const finalProfile = await this.getUserProfile(uid);
    return { success: true, profile: finalProfile };
  },

  // --- ADMIN SETTINGS ---
  async getAdminSettings() {
    const settings = getCollection("admin_settings");
    if (settings.length === 0) {
      const defaultSet = {
        facile: 50,
        moyen: 100,
        difficile: 500,
        expert: 1000,
        premiumPrice: 5000
      };
      setCollection("admin_settings", [defaultSet]);
      return defaultSet;
    }
    return settings[0];
  },

  async updateAdminSettings(settings: any): Promise<void> {
    setCollection("admin_settings", [settings]);
  },

  async getAllPlayersProfiles(): Promise<UserProfile[]> {
    return getCollection("users");
  },

  async modifyPlayerCoinsManually(uid: string, amount: number, isAdding: boolean, raison: string): Promise<{ success: boolean; profile: UserProfile | null; error?: string }> {
    const users = getCollection("users");
    const index = users.findIndex(u => u.uid === uid);
    if (index >= 0) {
      if (isAdding) {
        await this.addTransaction(uid, "gain", amount, `Ajustement Admin : ${raison} ⚙️`);
      } else {
        await this.addTransaction(uid, "depense", amount, `Retrait Admin : ${raison} ⚙️`);
      }
      const updatedUser = await this.getUserProfile(uid);
      return { success: true, profile: updatedUser };
    }
    return { success: false, error: "Utilisateur introuvable", profile: null };
  },

  // --- QUIZZES ---
  async getQuizzes(): Promise<Quiz[]> {
    return getCollection("quizzes");
  },

  async saveQuiz(quiz: Quiz): Promise<void> {
    const quizzes = getCollection("quizzes");
    const index = quizzes.findIndex((q) => q.id === quiz.id);
    if (index >= 0) {
      quizzes[index] = quiz;
    } else {
      quizzes.push(quiz);
    }
    setCollection("quizzes", quizzes);
  },

  async incrementQuizPlays(quizId: string): Promise<void> {
    const quizzes = getCollection("quizzes");
    const index = quizzes.findIndex((q) => q.id === quizId);
    if (index >= 0) {
      quizzes[index].playsCount = (quizzes[index].playsCount || 0) + 1;
      setCollection("quizzes", quizzes);
    }
  },

  // --- QUIZ ATTEMPTS (AUTO-SAVE & RESUME) ---
  async saveQuizAttempt(attempt: QuizAttempt): Promise<void> {
    const attempts = getCollection("quiz_attempts");
    const index = attempts.findIndex((a) => a.uid === attempt.uid && a.quizId === attempt.quizId);
    if (index >= 0) {
      attempts[index] = attempt;
    } else {
      attempts.push(attempt);
    }
    setCollection("quiz_attempts", attempts);
  },

  async getQuizAttempt(uid: string, quizId: string): Promise<QuizAttempt | null> {
    const attempts = getCollection("quiz_attempts");
    const attempt = attempts.find((a) => a.uid === uid && a.quizId === quizId && !a.isCompleted);
    return attempt || null;
  },

  async deleteQuizAttempt(uid: string, quizId: string): Promise<void> {
    const attempts = getCollection("quiz_attempts");
    const filtered = attempts.filter((a) => !(a.uid === uid && a.quizId === quizId));
    setCollection("quiz_attempts", filtered);
  },

  async getActiveAttempts(uid: string): Promise<QuizAttempt[]> {
    const attempts = getCollection("quiz_attempts");
    return attempts.filter((a) => a.uid === uid && !a.isCompleted);
  },

  // --- FAVORITES ---
  async toggleFavoriteQuestion(uid: string, questionId: string): Promise<boolean> {
    const user = await this.getUserProfile(uid);
    if (!user) return false;

    const favorites = user.favorites || [];
    const index = favorites.indexOf(questionId);
    let isFav = false;

    if (index >= 0) {
      favorites.splice(index, 1);
    } else {
      favorites.push(questionId);
      isFav = true;
    }

    user.favorites = favorites;
    await this.saveUserProfile(user);

    // Save to distinct collections as requested (favorites)
    const allFavorites = getCollection("favorites");
    const favKey = `${uid}_${questionId}`;
    const favIndex = allFavorites.findIndex(f => f.id === favKey);
    if (isFav) {
      if (favIndex < 0) {
        allFavorites.push({ id: favKey, uid, questionId, createdAt: new Date().toISOString() });
      }
    } else {
      if (favIndex >= 0) {
        allFavorites.splice(favIndex, 1);
      }
    }
    setCollection("favorites", allFavorites);

    return isFav;
  },

  async isQuestionFavorite(uid: string, questionId: string): Promise<boolean> {
    const user = await this.getUserProfile(uid);
    if (!user) return false;
    return (user.favorites || []).includes(questionId);
  },

  // --- REVISIONS (FAILED / DIFFICULT QUESTIONS) ---
  async addFailedQuestion(uid: string, questionId: string): Promise<void> {
    const user = await this.getUserProfile(uid);
    if (!user) return;

    const failed = user.failedQuestionIds || [];
    if (!failed.includes(questionId)) {
      failed.push(questionId);
      user.failedQuestionIds = failed;
      await this.saveUserProfile(user);
    }

    // Save to distinct revisions collection as requested
    const revisions = getCollection("revisions");
    const revKey = `${uid}_${questionId}`;
    const index = revisions.findIndex(r => r.id === revKey);
    if (index < 0) {
      revisions.push({
        id: revKey,
        uid,
        questionId,
        type: "failed",
        addedAt: new Date().toISOString()
      });
      setCollection("revisions", revisions);
    }
  },

  async addDifficultQuestion(uid: string, questionId: string): Promise<void> {
    const user = await this.getUserProfile(uid);
    if (!user) return;

    const difficult = user.difficultQuestionIds || [];
    if (!difficult.includes(questionId)) {
      difficult.push(questionId);
      user.difficultQuestionIds = difficult;
      await this.saveUserProfile(user);
    }

    // Save to distinct revisions collection as requested
    const revisions = getCollection("revisions");
    const revKey = `${uid}_${questionId}`;
    const index = revisions.findIndex(r => r.id === revKey);
    if (index < 0) {
      revisions.push({
        id: revKey,
        uid,
        questionId,
        type: "difficult",
        addedAt: new Date().toISOString()
      });
      setCollection("revisions", revisions);
    }
  },

  async removeFailedQuestion(uid: string, questionId: string): Promise<void> {
    const user = await this.getUserProfile(uid);
    if (!user) return;

    if (user.failedQuestionIds) {
      user.failedQuestionIds = user.failedQuestionIds.filter(id => id !== questionId);
      await this.saveUserProfile(user);
    }

    const revisions = getCollection("revisions");
    const revKey = `${uid}_${questionId}`;
    const filtered = revisions.filter(r => r.id !== revKey);
    setCollection("revisions", filtered);
  },

  // --- LEADERBOARDS ---
  async getLeaderboard(): Promise<LeaderboardEntry[]> {
    const board = getCollection("leaderboard");
    return board.sort((a, b) => b.xp - a.xp);
  },

  async updateLeaderboard(uid: string, pseudo: string, avatarUrl: string, xp: number, level: number, isPremium?: boolean, quizCoinsEarned?: number): Promise<void> {
    const board = getCollection("leaderboard");
    const index = board.findIndex((e) => e.uid === uid);
    if (index >= 0) {
      board[index] = { ...board[index], pseudo, avatarUrl, xp, level, isPremium, quizCoinsEarned };
    } else {
      board.push({ uid, pseudo, avatarUrl, xp, level, isPremium, quizCoinsEarned });
    }
    setCollection("leaderboard", board);
  }
};
