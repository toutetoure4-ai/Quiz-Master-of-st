import { useState, useEffect } from "react";
import { UserProfile, LeaderboardEntry } from "../types";
import { 
  Trophy, Award, Medal, Sparkles, Search, Globe, Users, 
  MapPin, BookOpen, Clock, X, UserPlus, Zap, Flame, Target, 
  Check, Swords, AlertCircle, Coins
} from "lucide-react";
import { motion, AnimatePresence } from "motion/react";

interface LeaderboardScreenProps {
  user: UserProfile;
}

export default function LeaderboardScreen({ user }: LeaderboardScreenProps) {
  // Filters & State
  const [scope, setScope] = useState<"world" | "country" | "friends" | "category">("world");
  const [period, setPeriod] = useState<"alltime" | "daily" | "weekly" | "monthly">("alltime");
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedCountry, setSelectedCountry] = useState("France");
  const [selectedCategory, setSelectedCategory] = useState("Culture générale");
  
  const [rankingList, setRankingList] = useState<LeaderboardEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Profile Peek Modal State
  const [peekProfileUid, setPeekProfileUid] = useState<string | null>(null);
  const [peekData, setPeekData] = useState<any>(null);
  const [peekLoading, setPeekLoading] = useState(false);
  const [friendActionMsg, setFriendActionMsg] = useState("");

  const countriesList = ["France", "Belgique", "Suisse", "Canada", "Sénégal", "Maroc"];
  const categoriesList = ["Culture générale", "Histoire & Géo", "Sciences", "Technologie", "Art & Littérature", "Cinéma & Pop"];

  // Fetch rankings from API
  const fetchRankings = async () => {
    setLoading(true);
    setError(null);
    try {
      // Determine what leaderboard type to query
      let typeQuery = scope;
      if (period !== "alltime" && scope === "world") {
        typeQuery = period as any; // maps to daily, weekly, monthly
      }

      const params = new URLSearchParams({
        type: typeQuery,
        uid: user.uid,
        search: searchQuery,
      });

      if (scope === "country") {
        params.append("country", selectedCountry);
      } else if (scope === "category") {
        params.append("category", selectedCategory);
      }

      const res = await fetch(`/api/leaderboard?${params.toString()}`);
      if (res.ok) {
        const data = await res.json();
        setRankingList(data);
      } else {
        throw new Error("Erreur de récupération du classement.");
      }
    } catch (err: any) {
      setError(err.message || "Impossible de charger le classement.");
    } finally {
      setLoading(false);
    }
  };

  // Re-fetch whenever filters change
  useEffect(() => {
    fetchRankings();
  }, [scope, period, selectedCountry, selectedCategory, searchQuery]);

  // Handle Profile Peek Click
  const handlePeekProfile = async (uid: string) => {
    setPeekProfileUid(uid);
    setPeekLoading(true);
    setFriendActionMsg("");
    try {
      const res = await fetch(`/api/user/public?uid=${uid}`);
      if (res.ok) {
        const data = await res.json();
        setPeekData(data);
      }
    } catch (e) {
      console.error(e);
    } finally {
      setPeekLoading(false);
    }
  };

  // Send friend request helper
  const handleSendFriendRequest = async (pseudo: string) => {
    try {
      const res = await fetch("/api/friends/request", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          fromUid: user.uid,
          toPseudo: pseudo,
        }),
      });
      const data = await res.json();
      if (res.ok) {
        setFriendActionMsg("✓ Demande d'ami envoyée !");
      } else {
        setFriendActionMsg(`⚠ ${data.error || "Erreur"}`);
      }
    } catch (err) {
      setFriendActionMsg("⚠ Erreur de connexion");
    }
  };

  const top3 = rankingList.slice(0, 3);
  const remainingList = rankingList.slice(3);

  return (
    <div id="leaderboard-screen-root" className="flex-1 flex flex-col bg-slate-50 dark:bg-slate-950 overflow-hidden">
      
      {/* Dynamic Header */}
      <div className="p-5 pb-3 border-b border-slate-100 dark:border-slate-800/60 shrink-0 bg-white dark:bg-slate-950 flex flex-col gap-3">
        <div className="flex justify-between items-center">
          <div>
            <h2 className="text-xl font-extrabold font-display text-slate-950 dark:text-white flex items-center gap-2">
              <Trophy className="w-5 h-5 text-amber-500 fill-amber-500/20" />
              Arène Compétitive
            </h2>
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
              Suis les classements et défie tes rivaux en direct !
            </p>
          </div>
          <div className="p-2.5 bg-yellow-50 dark:bg-yellow-950/20 text-yellow-500 rounded-2xl animate-pulse">
            <Sparkles className="w-5 h-5 fill-current" />
          </div>
        </div>

        {/* Real-time Search input */}
        <div className="relative">
          <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
          <input
            type="text"
            placeholder="Rechercher un pseudo..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-10 pr-4 py-2.5 bg-slate-50 dark:bg-slate-900 border border-slate-100 dark:border-slate-800/60 rounded-2xl text-xs font-semibold focus:outline-none focus:ring-2 focus:ring-blue-500 dark:text-white transition-all"
          />
        </div>

        {/* Leaderboard Scope filter row */}
        <div className="flex gap-1.5 overflow-x-auto pb-1 no-scrollbar">
          <button
            onClick={() => { setScope("world"); setPeriod("alltime"); }}
            className={`py-2 px-3.5 rounded-xl text-[10px] font-black tracking-wider uppercase shrink-0 flex items-center gap-1.5 transition-all cursor-pointer ${
              scope === "world" 
                ? "bg-slate-950 dark:bg-white text-white dark:text-slate-950 shadow-md" 
                : "bg-slate-100 dark:bg-slate-900 text-slate-600 dark:text-slate-400 hover:bg-slate-200"
            }`}
          >
            <Globe className="w-3.5 h-3.5" />
            Mondial
          </button>
          <button
            onClick={() => { setScope("country"); }}
            className={`py-2 px-3.5 rounded-xl text-[10px] font-black tracking-wider uppercase shrink-0 flex items-center gap-1.5 transition-all cursor-pointer ${
              scope === "country" 
                ? "bg-slate-950 dark:bg-white text-white dark:text-slate-950 shadow-md" 
                : "bg-slate-100 dark:bg-slate-900 text-slate-600 dark:text-slate-400 hover:bg-slate-200"
            }`}
          >
            <MapPin className="w-3.5 h-3.5" />
            Par Pays
          </button>
          <button
            onClick={() => { setScope("friends"); }}
            className={`py-2 px-3.5 rounded-xl text-[10px] font-black tracking-wider uppercase shrink-0 flex items-center gap-1.5 transition-all cursor-pointer ${
              scope === "friends" 
                ? "bg-slate-950 dark:bg-white text-white dark:text-slate-950 shadow-md" 
                : "bg-slate-100 dark:bg-slate-900 text-slate-600 dark:text-slate-400 hover:bg-slate-200"
            }`}
          >
            <Users className="w-3.5 h-3.5" />
            Amis
          </button>
          <button
            onClick={() => { setScope("category"); }}
            className={`py-2 px-3.5 rounded-xl text-[10px] font-black tracking-wider uppercase shrink-0 flex items-center gap-1.5 transition-all cursor-pointer ${
              scope === "category" 
                ? "bg-slate-950 dark:bg-white text-white dark:text-slate-950 shadow-md" 
                : "bg-slate-100 dark:bg-slate-900 text-slate-600 dark:text-slate-400 hover:bg-slate-200"
            }`}
          >
            <BookOpen className="w-3.5 h-3.5" />
            Catégories
          </button>
        </div>

        {/* Conditional Dropdown filter based on scope */}
        {scope === "country" && (
          <div className="flex gap-2 items-center text-xs animate-fadeIn">
            <span className="font-bold text-slate-400 dark:text-slate-500">Pays :</span>
            <select
              value={selectedCountry}
              onChange={(e) => setSelectedCountry(e.target.value)}
              className="bg-slate-100 dark:bg-slate-900 border border-slate-200/50 dark:border-slate-800 rounded-xl px-2.5 py-1.5 text-xs font-bold text-slate-800 dark:text-slate-200 focus:outline-none"
            >
              {countriesList.map((c) => (
                <option key={c} value={c}>{c}</option>
              ))}
            </select>
          </div>
        )}

        {scope === "category" && (
          <div className="flex gap-2 items-center text-xs animate-fadeIn">
            <span className="font-bold text-slate-400 dark:text-slate-500">Thème :</span>
            <select
              value={selectedCategory}
              onChange={(e) => setSelectedCategory(e.target.value)}
              className="bg-slate-100 dark:bg-slate-900 border border-slate-200/50 dark:border-slate-800 rounded-xl px-2.5 py-1.5 text-xs font-bold text-slate-800 dark:text-slate-200 focus:outline-none"
            >
              {categoriesList.map((c) => (
                <option key={c} value={c}>{c}</option>
              ))}
            </select>
          </div>
        )}

        {/* Global/Mondial Timeframe filters */}
        {scope === "world" && (
          <div className="flex gap-1.5 border-t border-slate-100 dark:border-slate-800/60 pt-2.5 text-xs animate-fadeIn">
            {(["alltime", "daily", "weekly", "monthly"] as const).map((p) => (
              <button
                key={p}
                onClick={() => setPeriod(p)}
                className={`flex-1 py-1 px-2.5 rounded-lg text-[10px] font-black transition-all cursor-pointer ${
                  period === p 
                    ? "bg-blue-100 dark:bg-blue-950/40 text-blue-600 dark:text-blue-400 font-extrabold" 
                    : "text-slate-400 hover:text-slate-700"
                }`}
              >
                {p === "alltime" && "Toujours"}
                {p === "daily" && "Quotidien"}
                {p === "weekly" && "Hebdo"}
                {p === "monthly" && "Mensuel"}
              </button>
            ))}
          </div>
        )}
      </div>

      {/* Main rankings scroller */}
      <div className="flex-1 overflow-y-auto p-5 space-y-6">
        
        {loading ? (
          /* Skeletons */
          <div className="space-y-4">
            <div className="h-44 bg-slate-200 dark:bg-slate-900 rounded-3xl animate-pulse" />
            <div className="space-y-2">
              {[1, 2, 3, 4, 5].map((i) => (
                <div key={i} className="h-14 bg-slate-100 dark:bg-slate-900/40 rounded-2xl animate-pulse" />
              ))}
            </div>
          </div>
        ) : error ? (
          <div className="p-8 text-center text-slate-400 dark:text-slate-500 flex flex-col items-center gap-3">
            <AlertCircle className="w-10 h-10 text-red-400" />
            <p className="text-xs font-bold">{error}</p>
          </div>
        ) : rankingList.length === 0 ? (
          <div className="p-12 text-center text-slate-400 dark:text-slate-500">
            <p className="text-xs font-black">Aucun joueur enregistré sous ces filtres.</p>
            <p className="text-[10px] text-slate-400 mt-1">Sois le premier à marquer des points !</p>
          </div>
        ) : (
          <>
            {/* Beautiful Podiums for Top 3 */}
            {top3.length > 0 && searchQuery === "" && (
              <div className="flex justify-center items-end gap-2.5 py-6 select-none bg-gradient-to-t from-slate-100/50 dark:from-slate-900/30 to-transparent rounded-[32px] border border-slate-100 dark:border-slate-800/20 px-3">
                
                {/* Rank 2 (Left) */}
                {top3[1] && (
                  <motion.div 
                    initial={{ y: 20, opacity: 0 }}
                    animate={{ y: 0, opacity: 1 }}
                    transition={{ delay: 0.1, duration: 0.4 }}
                    onClick={() => handlePeekProfile(top3[1].uid)}
                    className="flex flex-col items-center flex-1 cursor-pointer group"
                  >
                    <div className="relative">
                      <img 
                        src={top3[1].avatarUrl} 
                        alt="Avatar" 
                        className="w-12 h-12 rounded-2xl bg-white dark:bg-slate-800 border-2 border-slate-300 group-hover:scale-105 transition-transform" 
                      />
                      <span className="absolute -bottom-1.5 left-1/2 -translate-x-1/2 w-5 h-5 bg-slate-300 text-slate-800 text-[10px] font-black rounded-full flex items-center justify-center border border-white">
                        2
                      </span>
                    </div>
                    <span className="text-[11px] font-black text-slate-700 dark:text-slate-300 mt-3 truncate max-w-[80px] flex items-center justify-center gap-1">
                      {top3[1].pseudo}
                      {top3[1].isPremium && <span className="text-[8px] bg-amber-500 text-white font-extrabold px-1 rounded shrink-0">PRO</span>}
                    </span>
                    <span className="text-[10px] font-black text-slate-400 font-mono mt-0.5">
                      {top3[1].xp} XP
                    </span>
                    {top3[1].quizCoinsEarned !== undefined && (
                      <span className="text-[9px] font-extrabold font-mono text-amber-500 flex items-center gap-0.5 mt-0.5">
                        <Coins className="w-3 h-3 text-amber-500 fill-current shrink-0" />
                        {top3[1].quizCoinsEarned}
                      </span>
                    )}
                    <div className="h-14 w-14 bg-slate-200 dark:bg-slate-800 rounded-t-xl mt-3 flex items-center justify-center font-black text-slate-400 text-lg">
                      🥈
                    </div>
                  </motion.div>
                )}

                {/* Rank 1 (Center) */}
                {top3[0] && (
                  <motion.div 
                    initial={{ y: 25, opacity: 0 }}
                    animate={{ y: 0, opacity: 1 }}
                    transition={{ duration: 0.4 }}
                    onClick={() => handlePeekProfile(top3[0].uid)}
                    className="flex flex-col items-center flex-1 z-10 cursor-pointer group"
                  >
                    <div className="relative -mt-6">
                      <div className="absolute -top-5 left-1/2 -translate-x-1/2 text-yellow-500 animate-pulse">
                        <Medal className="w-5.5 h-5.5 fill-current" />
                      </div>
                      <img 
                        src={top3[0].avatarUrl} 
                        alt="Avatar" 
                        className="w-15 h-15 rounded-2xl bg-white dark:bg-slate-800 border-2 border-yellow-400 ring-4 ring-yellow-400/20 group-hover:scale-105 transition-transform" 
                      />
                      <span className="absolute -bottom-1.5 left-1/2 -translate-x-1/2 w-5.5 h-5.5 bg-yellow-400 text-slate-900 text-[11px] font-black rounded-full flex items-center justify-center border border-white">
                        1
                      </span>
                    </div>
                    <span className="text-xs font-black text-slate-900 dark:text-white mt-3 truncate max-w-[90px] flex items-center gap-1 justify-center">
                      {top3[0].pseudo}
                      {top3[0].isPremium && <span className="text-[8px] bg-amber-500 text-white font-extrabold px-1 rounded shrink-0">PRO</span>}
                      <Sparkles className="w-3 h-3 text-yellow-400 fill-current shrink-0" />
                    </span>
                    <span className="text-xs font-black text-yellow-500 font-mono mt-0.5">
                      {top3[0].xp} XP
                    </span>
                    {top3[0].quizCoinsEarned !== undefined && (
                      <span className="text-[9px] font-extrabold font-mono text-amber-500 flex items-center gap-0.5 mt-0.5">
                        <Coins className="w-3 h-3 text-amber-500 fill-current shrink-0" />
                        {top3[0].quizCoinsEarned}
                      </span>
                    )}
                    <div className="h-20 w-18 bg-gradient-to-t from-yellow-400/10 to-yellow-400/30 rounded-t-2xl mt-3 flex items-center justify-center font-black text-yellow-600 text-2xl border-t-2 border-yellow-400">
                      👑
                    </div>
                  </motion.div>
                )}

                {/* Rank 3 (Right) */}
                {top3[2] && (
                  <motion.div 
                    initial={{ y: 20, opacity: 0 }}
                    animate={{ y: 0, opacity: 1 }}
                    transition={{ delay: 0.2, duration: 0.4 }}
                    onClick={() => handlePeekProfile(top3[2].uid)}
                    className="flex flex-col items-center flex-1 cursor-pointer group"
                  >
                    <div className="relative">
                      <img 
                        src={top3[2].avatarUrl} 
                        alt="Avatar" 
                        className="w-11 h-11 rounded-2xl bg-white dark:bg-slate-800 border-2 border-amber-600 group-hover:scale-105 transition-transform" 
                      />
                      <span className="absolute -bottom-1.5 left-1/2 -translate-x-1/2 w-5 h-5 bg-amber-600 text-white text-[10px] font-black rounded-full flex items-center justify-center border border-white">
                        3
                      </span>
                    </div>
                    <span className="text-[11px] font-black text-slate-700 dark:text-slate-300 mt-3 truncate max-w-[80px] flex items-center justify-center gap-1">
                      {top3[2].pseudo}
                      {top3[2].isPremium && <span className="text-[8px] bg-amber-500 text-white font-extrabold px-1 rounded shrink-0">PRO</span>}
                    </span>
                    <span className="text-[10px] font-black text-slate-400 font-mono mt-0.5">
                      {top3[2].xp} XP
                    </span>
                    {top3[2].quizCoinsEarned !== undefined && (
                      <span className="text-[9px] font-extrabold font-mono text-amber-500 flex items-center gap-0.5 mt-0.5">
                        <Coins className="w-3 h-3 text-amber-500 fill-current shrink-0" />
                        {top3[2].quizCoinsEarned}
                      </span>
                    )}
                    <div className="h-10 w-14 bg-amber-100/50 dark:bg-amber-950/20 rounded-t-xl mt-3 flex items-center justify-center font-black text-amber-700 text-lg">
                      🥉
                    </div>
                  </motion.div>
                )}

              </div>
            )}

            {/* List of remaining ranks */}
            <div className="space-y-2.5">
              {(searchQuery !== "" ? rankingList : remainingList).map((entry) => {
                const isMe = entry.uid === user.uid;
                return (
                  <div
                    key={entry.uid}
                    onClick={() => handlePeekProfile(entry.uid)}
                    className={`p-3.5 rounded-2xl flex items-center justify-between border cursor-pointer hover:bg-slate-100/50 dark:hover:bg-slate-900/60 active:scale-99 transition-all ${
                      isMe
                        ? "bg-blue-50/70 dark:bg-blue-950/20 border-blue-200 dark:border-blue-900/50 ring-2 ring-blue-500/20"
                        : "bg-white dark:bg-slate-900 border-slate-100 dark:border-slate-800/60"
                    }`}
                  >
                    <div className="flex items-center gap-3.5">
                      <span className="w-6 text-center text-xs font-black text-slate-400 font-mono">
                        {entry.rank}
                      </span>
                      <img 
                        src={entry.avatarUrl} 
                        alt="Avatar" 
                        className="w-10 h-10 rounded-xl bg-slate-100 dark:bg-slate-800" 
                      />
                      <div>
                        <p className={`text-xs font-black flex items-center gap-1.5 ${
                          isMe ? "text-blue-600 dark:text-blue-400" : "text-slate-800 dark:text-slate-200"
                        }`}>
                          {entry.pseudo}
                          {isMe && (
                            <span className="text-[9px] font-black tracking-wider uppercase bg-blue-100 dark:bg-blue-950/60 px-1.5 py-0.5 rounded-md text-blue-500 shrink-0">
                              Toi
                            </span>
                          )}
                          {entry.isPremium && (
                            <span className="text-[8px] font-black tracking-wider uppercase bg-amber-500 text-white px-1.5 py-0.5 rounded-md shadow-xs shrink-0 flex items-center gap-0.5">
                              ⭐ PRO
                            </span>
                          )}
                          {entry.country && (
                            <span className="text-[10px] text-slate-400 font-normal">
                              ({entry.country})
                            </span>
                          )}
                        </p>
                        <span className="text-[10px] font-bold text-slate-400">
                          Niveau {entry.level}
                        </span>
                      </div>
                    </div>

                    <div className="text-right flex flex-col items-end">
                      <span className={`text-xs font-black font-mono ${isMe ? "text-blue-500" : "text-slate-700 dark:text-slate-300"}`}>
                        {entry.xp} XP
                      </span>
                      {entry.quizCoinsEarned !== undefined && (
                        <span className="text-[9px] font-extrabold font-mono text-amber-500 flex items-center gap-0.5 mt-0.5">
                          <Coins className="w-3 h-3 text-amber-500 fill-current shrink-0" />
                          {entry.quizCoinsEarned}
                        </span>
                      )}
                      {entry.totalScore !== undefined && (
                        <span className="text-[9px] font-bold text-slate-400 mt-0.5">
                          {entry.totalScore.toLocaleString()} pts
                        </span>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          </>
        )}

      </div>

      {/* USER PROFILE PEEK DRAWER / MODAL */}
      <AnimatePresence>
        {peekProfileUid && (
          <div id="leaderboard-profile-modal" className="absolute inset-0 bg-black/60 backdrop-blur-xs z-50 flex items-center justify-center p-4">
            <div className="absolute inset-0" onClick={() => setPeekProfileUid(null)} />
            
            <motion.div
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              className="relative bg-white dark:bg-slate-900 rounded-[30px] w-full max-w-sm overflow-hidden border border-slate-100 dark:border-slate-800 shadow-2xl z-10 p-5 flex flex-col"
            >
              {/* Close Icon */}
              <button
                onClick={() => setPeekProfileUid(null)}
                className="absolute top-4 right-4 p-2 bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 rounded-full transition-colors cursor-pointer"
              >
                <X className="w-4 h-4 text-slate-500" />
              </button>

              {peekLoading ? (
                <div className="py-20 flex flex-col items-center justify-center gap-3">
                  <div className="w-8 h-8 border-3 border-slate-200 border-t-blue-500 rounded-full animate-spin" />
                  <p className="text-[11px] font-bold text-slate-400">Lecture des statistiques...</p>
                </div>
              ) : peekData ? (
                <div className="space-y-4">
                  
                  {/* Card Header: Avatar & Level */}
                  <div className="flex items-center gap-4">
                    <img
                      src={peekData.avatarUrl}
                      alt="Avatar"
                      className="w-16 h-16 rounded-2xl bg-slate-100 dark:bg-slate-800 border border-slate-200/50 dark:border-slate-800"
                    />
                    <div>
                      <h3 className="text-base font-black text-slate-950 dark:text-white flex items-center gap-1.5">
                        {peekData.pseudo}
                        {peekData.uid === user.uid && (
                          <span className="text-[8px] font-bold bg-blue-100 text-blue-500 px-1 rounded">Toi</span>
                        )}
                      </h3>
                      <p className="text-xs text-slate-400 font-bold flex items-center gap-1">
                        <MapPin className="w-3 h-3 text-slate-400" />
                        {peekData.country || "France"}
                      </p>
                      <div className="mt-1 flex items-center gap-2">
                        <span className="px-2 py-0.5 rounded-md bg-yellow-100 text-yellow-700 dark:bg-yellow-950/40 dark:text-yellow-400 text-[9px] font-black uppercase">
                          Niveau {peekData.level || 1}
                        </span>
                        <span className="text-[10px] font-mono text-slate-400">
                          {peekData.xp} XP
                        </span>
                      </div>
                    </div>
                  </div>

                  {/* Actions Bar (Challenge & Friends) */}
                  {peekData.uid !== user.uid && (
                    <div className="flex gap-2 pt-1">
                      <button
                        onClick={() => handleSendFriendRequest(peekData.pseudo)}
                        className="flex-1 py-2.5 bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 rounded-xl text-[10px] font-black tracking-wider uppercase flex items-center justify-center gap-1.5 text-slate-700 dark:text-slate-300 cursor-pointer"
                      >
                        <UserPlus className="w-3.5 h-3.5" />
                        Ajouter en ami
                      </button>
                    </div>
                  )}

                  {friendActionMsg && (
                    <p className="text-[11px] font-black text-center text-blue-600 dark:text-blue-400 bg-blue-50 dark:bg-blue-950/20 py-2 rounded-xl">
                      {friendActionMsg}
                    </p>
                  )}

                  <hr className="border-slate-100 dark:border-slate-800" />

                  {/* Grid Statistics */}
                  <div className="grid grid-cols-2 gap-3">
                    
                    <div className="p-3 bg-slate-50 dark:bg-slate-900 rounded-2xl border border-slate-100/50 dark:border-slate-800 flex items-center gap-3">
                      <Target className="w-5 h-5 text-emerald-500" />
                      <div>
                        <span className="text-[10px] text-slate-400 block font-bold">Réussite</span>
                        <span className="text-xs font-black dark:text-white">{peekData.successRate || 0}%</span>
                      </div>
                    </div>

                    <div className="p-3 bg-slate-50 dark:bg-slate-900 rounded-2xl border border-slate-100/50 dark:border-slate-800 flex items-center gap-3">
                      <Flame className="w-5 h-5 text-orange-500" />
                      <div>
                        <span className="text-[10px] text-slate-400 block font-bold">Max Série</span>
                        <span className="text-xs font-black dark:text-white">{peekData.bestStreak || 0} correct</span>
                      </div>
                    </div>

                    <div className="p-3 bg-slate-50 dark:bg-slate-900 rounded-2xl border border-slate-100/50 dark:border-slate-800 flex items-center gap-3">
                      <Trophy className="w-5 h-5 text-blue-500" />
                      <div>
                        <span className="text-[10px] text-slate-400 block font-bold">Score Total</span>
                        <span className="text-xs font-black dark:text-white">{(peekData.totalScore || 0).toLocaleString()}</span>
                      </div>
                    </div>

                    <div className="p-3 bg-slate-50 dark:bg-slate-900 rounded-2xl border border-slate-100/50 dark:border-slate-800 flex items-center gap-3">
                      <Zap className="w-5 h-5 text-violet-500" />
                      <div>
                        <span className="text-[10px] text-slate-400 block font-bold">Quiz terminés</span>
                        <span className="text-xs font-black dark:text-white">{peekData.quizzesFinishedCount || 0}</span>
                      </div>
                    </div>

                  </div>

                  {/* Badges Earned previews */}
                  {peekData.badges && peekData.badges.length > 0 && (
                    <div className="space-y-1.5">
                      <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest block">
                        Badges obtenus ({peekData.badges.length})
                      </span>
                      <div className="flex flex-wrap gap-1.5">
                        {peekData.badges.slice(0, 4).map((b: any) => (
                          <div
                            key={b.id}
                            style={{ borderColor: b.color }}
                            className="px-2 py-1 rounded-xl bg-slate-50 dark:bg-slate-800 border text-[9px] font-black text-slate-700 dark:text-slate-300"
                          >
                            🏅 {b.title}
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Last 3 Quizzes History */}
                  <div className="space-y-1.5">
                    <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest block">
                      Dernières parties
                    </span>
                    {peekData.history && peekData.history.length > 0 ? (
                      <div className="space-y-1.5">
                        {peekData.history.slice(0, 3).map((h: any, idx: number) => (
                          <div
                            key={idx}
                            className="p-2 bg-slate-50 dark:bg-slate-900/60 rounded-xl border border-slate-100/40 dark:border-slate-850 flex justify-between items-center text-[11px]"
                          >
                            <span className="font-extrabold text-slate-800 dark:text-slate-300 truncate max-w-[150px]">
                              {h.quizTitle}
                            </span>
                            <span className="font-bold text-slate-400 shrink-0">
                              Score: {h.score}/{h.totalQuestions} ({h.accuracy}%)
                            </span>
                          </div>
                        ))}
                      </div>
                    ) : (
                      <p className="text-[10px] text-slate-400 italic">Aucune partie récente.</p>
                    )}
                  </div>

                </div>
              ) : (
                <p className="text-xs text-red-500 text-center py-6">Échec de lecture.</p>
              )}
            </motion.div>
          </div>
        )}
      </AnimatePresence>

    </div>
  );
}
