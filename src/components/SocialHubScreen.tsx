import React, { useState, useEffect, useRef } from "react";
import { UserProfile, Quiz, Friend, FriendRequest, Challenge, MultiplayerRoom } from "../types";
import { 
  Users, Swords, Gamepad2, UserPlus, Trash2, Check, X, Flame, 
  Trophy, AlertCircle, Play, Sparkles, Send, ShieldAlert, ArrowLeft,
  Volume2, VolumeX, Clock, Award, Star, Zap, UserCheck, Smartphone, ChevronRight
} from "lucide-react";
import { motion, AnimatePresence } from "motion/react";

interface SocialHubScreenProps {
  user: UserProfile;
  quizzes: Quiz[];
  onBack?: () => void;
  onPlayQuiz: (quiz: Quiz) => void;
}

export default function SocialHubScreen({ user, quizzes, onBack, onPlayQuiz }: SocialHubScreenProps) {
  const [activeTab, setActiveTab] = useState<"friends" | "challenges" | "multiplayer">("friends");

  // State: Friends
  const [friends, setFriends] = useState<Friend[]>([]);
  const [requests, setRequests] = useState<FriendRequest[]>([]);
  const [searchPseudo, setSearchPseudo] = useState("");
  const [friendsLoading, setFriendsLoading] = useState(false);
  const [friendMsg, setFriendMsg] = useState("");

  // State: Challenges
  const [challenges, setChallenges] = useState<Challenge[]>([]);
  const [challengesLoading, setChallengesLoading] = useState(false);
  const [selectedQuizIdForChallenge, setSelectedQuizIdForChallenge] = useState("");
  const [selectedFriendUidForChallenge, setSelectedFriendUidForChallenge] = useState("");
  const [challengeMsg, setChallengeMsg] = useState("");

  // State: Multiplayer
  const [roomCodeToJoin, setRoomCodeToJoin] = useState("");
  const [activeRoom, setActiveRoom] = useState<MultiplayerRoom | null>(null);
  const [selectedQuizIdForRoom, setSelectedQuizIdForRoom] = useState(quizzes[0]?.id || "");
  const [multiLoading, setMultiLoading] = useState(false);
  const [multiError, setMultiError] = useState("");

  const pollIntervalRef = useRef<NodeJS.Timeout | null>(null);

  // Fetch Friends & Requests
  const fetchFriendsData = async () => {
    setFriendsLoading(true);
    try {
      const friendsRes = await fetch(`/api/friends/list?uid=${user.uid}`);
      const requestsRes = await fetch(`/api/friends/requests?uid=${user.uid}`);
      if (friendsRes.ok) setFriends(await friendsRes.json());
      if (requestsRes.ok) setRequests(await requestsRes.json());
    } catch (e) {
      console.error(e);
    } finally {
      setFriendsLoading(false);
    }
  };

  // Fetch Challenges
  const fetchChallengesData = async () => {
    setChallengesLoading(true);
    try {
      const res = await fetch(`/api/challenges/list?uid=${user.uid}`);
      if (res.ok) {
        setChallenges(await res.json());
      }
    } catch (e) {
      console.error(e);
    } finally {
      setChallengesLoading(false);
    }
  };

  useEffect(() => {
    fetchFriendsData();
    fetchChallengesData();
  }, [user.uid]);

  // Friend logic helpers
  const handleAddFriend = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!searchPseudo.trim()) return;
    setFriendMsg("");
    try {
      const res = await fetch("/api/friends/request", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          fromUid: user.uid,
          toPseudo: searchPseudo.trim()
        })
      });
      const data = await res.json();
      if (res.ok) {
        setFriendMsg("✓ Invitation envoyée avec succès !");
        setSearchPseudo("");
      } else {
        setFriendMsg(`⚠ ${data.error || "Erreur"}`);
      }
    } catch (err) {
      setFriendMsg("⚠ Erreur de connexion au serveur.");
    }
  };

  const handleRespondRequest = async (requestId: string, status: "accepted" | "declined") => {
    try {
      const res = await fetch("/api/friends/respond", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ requestId, status })
      });
      if (res.ok) {
        fetchFriendsData();
      }
    } catch (e) {
      console.error(e);
    }
  };

  const handleRemoveFriend = async (friendUid: string) => {
    if (!confirm("Voulez-vous vraiment supprimer cet ami ?")) return;
    try {
      const res = await fetch("/api/friends/remove", {
        method: "DELETE",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ uid: user.uid, friendUid })
      });
      if (res.ok) {
        fetchFriendsData();
      }
    } catch (e) {
      console.error(e);
    }
  };

  // Challenge logic helpers
  const handleCreateChallenge = async () => {
    if (!selectedQuizIdForChallenge || !selectedFriendUidForChallenge) {
      setChallengeMsg("⚠ Sélectionne un ami et un quiz d'abord.");
      return;
    }
    setChallengeMsg("");
    const selectedQuiz = quizzes.find(q => q.id === selectedQuizIdForChallenge);
    if (!selectedQuiz) return;

    try {
      const res = await fetch("/api/challenges/create", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          creatorUid: user.uid,
          targetUid: selectedFriendUidForChallenge,
          quizId: selectedQuiz.id,
          quizTitle: selectedQuiz.title,
          category: selectedQuiz.category,
          difficulty: selectedQuiz.difficulty
        })
      });
      if (res.ok) {
        setChallengeMsg("✓ Défi envoyé ! En attente de sa réponse.");
        fetchChallengesData();
      }
    } catch (e) {
      console.error(e);
    }
  };

  const handleRespondChallenge = async (challengeId: string, status: "accepted" | "declined") => {
    try {
      const res = await fetch("/api/challenges/respond", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ challengeId, status })
      });
      if (res.ok) {
        fetchChallengesData();
        if (status === "accepted") {
          const ch = challenges.find(c => c.id === challengeId);
          if (ch) {
            const quiz = quizzes.find(q => q.id === ch.quizId);
            if (quiz) {
              // Launch play mode immediately
              onPlayQuiz(quiz);
              // Store challengeId in sessionStorage to log score at the end
              sessionStorage.setItem("active_challenge_id", challengeId);
            }
          }
        }
      }
    } catch (e) {
      console.error(e);
    }
  };

  // MULTIPLAYER ENGINE CODES
  const startRoomPolling = (roomId: string) => {
    if (pollIntervalRef.current) clearInterval(pollIntervalRef.current);
    pollIntervalRef.current = setInterval(async () => {
      try {
        const res = await fetch(`/api/multiplayer/room/status?roomId=${roomId}`);
        if (res.ok) {
          const roomState = await res.json();
          setActiveRoom(roomState);
          if (roomState.status === "finished") {
            clearInterval(pollIntervalRef.current!);
          }
        } else {
          // Room deleted or ended
          clearInterval(pollIntervalRef.current!);
          setActiveRoom(null);
          setMultiError("La salle a été dissoute.");
        }
      } catch (e) {
        console.error(e);
      }
    }, 1000);
  };

  const handleCreateRoom = async () => {
    setMultiError("");
    const selectedQuiz = quizzes.find(q => q.id === selectedQuizIdForRoom);
    if (!selectedQuiz) return;

    try {
      const res = await fetch("/api/multiplayer/room/create", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          hostUid: user.uid,
          hostPseudo: user.pseudo,
          hostAvatarUrl: user.avatarUrl,
          hostLevel: user.level,
          quiz: selectedQuiz
        })
      });
      if (res.ok) {
        const data = await res.json();
        setActiveRoom(data.room);
        startRoomPolling(data.room.id);
      }
    } catch (e) {
      setMultiError("Échec de création de salle.");
    }
  };

  const handleJoinRoom = async () => {
    setMultiError("");
    if (!roomCodeToJoin.trim()) return;

    try {
      const res = await fetch("/api/multiplayer/room/join", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          roomId: roomCodeToJoin.trim(),
          uid: user.uid,
          pseudo: user.pseudo,
          avatarUrl: user.avatarUrl,
          level: user.level
        })
      });
      const data = await res.json();
      if (res.ok) {
        setActiveRoom(data.room);
        startRoomPolling(data.room.id);
      } else {
        setMultiError(data.error || "Impossible de rejoindre la salle.");
      }
    } catch (e) {
      setMultiError("Erreur de connexion.");
    }
  };

  const handleStartGame = async () => {
    if (!activeRoom) return;
    try {
      const res = await fetch("/api/multiplayer/room/start", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          roomId: activeRoom.id,
          uid: user.uid
        })
      });
      if (res.ok) {
        const data = await res.json();
        setActiveRoom(data.room);
      }
    } catch (e) {
      console.error(e);
    }
  };

  const [answering, setAnswering] = useState(false);
  const handleMultiAnswerSubmit = async (optionIdx: number) => {
    if (!activeRoom || answering) return;
    
    const currentQ = activeRoom.quiz.questions[activeRoom.currentQuestionIdx];
    const isCorrect = optionIdx === currentQ.correctAnswerIndex;
    const recommended = currentQ.recommendedTime || 15;
    const elapsed = activeRoom.timerLeft; // approximation
    const responseTime = recommended - elapsed;

    setAnswering(true);
    try {
      const res = await fetch("/api/multiplayer/room/submit-answer", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          roomId: activeRoom.id,
          uid: user.uid,
          selectedOptionIdx: optionIdx,
          isCorrect,
          responseTime
        })
      });
      if (res.ok) {
        const data = await res.json();
        setActiveRoom(data.room);
      }
    } catch (e) {
      console.error(e);
    } finally {
      setAnswering(false);
    }
  };

  const handleNextQuestion = async () => {
    if (!activeRoom) return;
    try {
      const res = await fetch("/api/multiplayer/room/next-question", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          roomId: activeRoom.id,
          uid: user.uid
        })
      });
      if (res.ok) {
        const data = await res.json();
        setActiveRoom(data.room);
      }
    } catch (e) {
      console.error(e);
    }
  };

  const handleLeaveRoom = () => {
    if (pollIntervalRef.current) clearInterval(pollIntervalRef.current);
    setActiveRoom(null);
  };

  useEffect(() => {
    return () => {
      if (pollIntervalRef.current) clearInterval(pollIntervalRef.current);
    };
  }, []);

  return (
    <div id="social-hub-root" className="flex-1 flex flex-col bg-slate-50 dark:bg-slate-950 overflow-hidden">
      
      {/* HEADER */}
      <div className="p-5 pb-3 border-b border-slate-100 dark:border-slate-800/60 shrink-0 bg-white dark:bg-slate-950 flex justify-between items-center">
        <div className="flex items-center gap-3">
          {onBack && (
            <button
              onClick={onBack}
              className="p-2 hover:bg-slate-100 dark:hover:bg-slate-900 rounded-xl text-slate-600 dark:text-slate-400 cursor-pointer"
            >
              <ArrowLeft className="w-5 h-5" />
            </button>
          )}
          <div>
            <h2 className="text-xl font-extrabold font-display text-slate-950 dark:text-white flex items-center gap-2">
              <Gamepad2 className="w-5 h-5 text-indigo-500" />
              Lobby Multijoueur & Social
            </h2>
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
              Connecte-toi, défie tes amis et joue en temps réel !
            </p>
          </div>
        </div>
      </div>

      {/* Conditionally render multiplayer active room overlay to bypass tab layout */}
      {activeRoom ? (
        <div className="flex-1 overflow-y-auto p-5 bg-slate-50 dark:bg-slate-950 flex flex-col justify-between">
          
          {/* MULTIPLAYER LOBBY SCREEN */}
          {activeRoom.status === "lobby" && (
            <div className="flex-1 flex flex-col justify-between max-w-sm mx-auto w-full py-6">
              <div className="space-y-6">
                
                {/* Visual Header */}
                <div className="text-center space-y-2">
                  <div className="w-16 h-16 rounded-[24px] bg-indigo-100 dark:bg-indigo-950/40 text-indigo-500 flex items-center justify-center mx-auto shadow-lg shadow-indigo-500/10">
                    <Swords className="w-8 h-8" />
                  </div>
                  <h3 className="text-lg font-black dark:text-white">Salle d'attente Multijoueur</h3>
                  <p className="text-[10px] text-slate-400 max-w-xs mx-auto">
                    Partage le code ci-dessous avec tes amis pour qu'ils te rejoignent !
                  </p>
                </div>

                {/* Room Code Showcase */}
                <div className="p-5 bg-gradient-to-br from-indigo-500 to-indigo-600 text-white rounded-3xl text-center shadow-xl shadow-indigo-500/15 relative overflow-hidden select-all">
                  <span className="text-[10px] font-black tracking-widest uppercase opacity-75">CODE DE LA SALLE</span>
                  <p className="text-4xl font-extrabold tracking-widest mt-1">{activeRoom.id}</p>
                </div>

                {/* Connected Players list */}
                <div className="space-y-2">
                  <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest block">
                    Joueurs rejoints ({activeRoom.players.length})
                  </span>
                  <div className="space-y-2">
                    {activeRoom.players.map((p) => (
                      <div
                        key={p.uid}
                        className="p-3 bg-white dark:bg-slate-900 border border-slate-100 dark:border-slate-800 rounded-2xl flex items-center justify-between"
                      >
                        <div className="flex items-center gap-3">
                          <img src={p.avatarUrl} alt="" className="w-8 h-8 rounded-lg bg-slate-100" />
                          <div>
                            <p className="text-xs font-black dark:text-white">{p.pseudo}</p>
                            <span className="text-[10px] text-slate-400 font-bold">Niveau {p.level}</span>
                          </div>
                        </div>
                        <span className={`px-2 py-0.5 text-[9px] font-black uppercase rounded-lg ${
                          p.uid === activeRoom.hostUid 
                            ? "bg-amber-100 text-amber-600" 
                            : p.isReady ? "bg-emerald-100 text-emerald-600" : "bg-slate-100 text-slate-400"
                        }`}>
                          {p.uid === activeRoom.hostUid ? "Hôte" : p.isReady ? "Prêt" : "Attente"}
                        </span>
                      </div>
                    ))}
                  </div>
                </div>

              </div>

              {/* Lobby Footer Action */}
              <div className="space-y-2.5 pt-6">
                {activeRoom.hostUid === user.uid ? (
                  <button
                    onClick={handleStartGame}
                    disabled={activeRoom.players.length < 1}
                    className="w-full py-4 bg-indigo-500 hover:bg-indigo-600 text-white text-xs font-black rounded-2xl flex items-center justify-center gap-2 shadow-lg shadow-indigo-500/10 cursor-pointer disabled:opacity-40"
                  >
                    <Play className="w-4 h-4 fill-current" />
                    Lancer la partie synchronisée !
                  </button>
                ) : (
                  <div className="text-center py-3 bg-slate-100 dark:bg-slate-900 rounded-xl">
                    <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest animate-pulse">
                      L'hôte va lancer la partie...
                    </span>
                  </div>
                )}
                
                <button
                  onClick={handleLeaveRoom}
                  className="w-full py-3 text-xs font-bold text-slate-500 text-center cursor-pointer"
                >
                  Quitter la salle
                </button>
              </div>

            </div>
          )}

          {/* ACTIVE MULTIPLAYER PLAYING LOOP */}
          {activeRoom.status === "playing" && (
            <div className="flex-1 flex flex-col justify-between max-w-md mx-auto w-full py-4">
              
              {/* Question Index & Live Timers */}
              <div className="space-y-4">
                <div className="flex justify-between items-center">
                  <div>
                    <span className="text-[9px] font-black text-indigo-500 uppercase tracking-widest">
                      MUTLIJOUEUR EN DIRECT
                    </span>
                    <h3 className="text-xs font-black dark:text-white">
                      Question {activeRoom.currentQuestionIdx + 1}/{activeRoom.quiz.questions.length}
                    </h3>
                  </div>
                  <div className="flex items-center gap-2">
                    <div className="px-3 py-1 bg-rose-50 dark:bg-rose-950/20 border border-rose-100 dark:border-rose-900 rounded-xl flex items-center gap-1 text-rose-500 font-mono text-xs font-black">
                      <Clock className="w-3.5 h-3.5 animate-spin" />
                      {activeRoom.timerLeft}s
                    </div>
                  </div>
                </div>

                {/* Current Question Text */}
                <div className="p-5 bg-white dark:bg-slate-900 border border-slate-100 dark:border-slate-800 rounded-3xl android-shadow">
                  <p className="text-sm font-black dark:text-white leading-relaxed">
                    {activeRoom.quiz.questions[activeRoom.currentQuestionIdx]?.questionText}
                  </p>
                </div>

                {/* Option Choices */}
                {activeRoom.questionActive ? (
                  <div className="space-y-2.5">
                    {activeRoom.quiz.questions[activeRoom.currentQuestionIdx]?.options.map((option, idx) => {
                      const player = activeRoom.players.find(p => p.uid === user.uid);
                      const hasSelected = player?.currentAnswerIdx === idx;
                      return (
                        <button
                          key={idx}
                          disabled={player?.hasAnswered}
                          onClick={() => handleMultiAnswerSubmit(idx)}
                          className={`w-full p-4 rounded-2xl border text-left text-xs font-black transition-all cursor-pointer ${
                            hasSelected 
                              ? "bg-indigo-500 border-indigo-500 text-white shadow-lg" 
                              : player?.hasAnswered 
                                ? "bg-slate-50 dark:bg-slate-900/40 border-slate-100 dark:border-slate-850 opacity-45"
                                : "bg-white dark:bg-slate-900 border-slate-100 dark:border-slate-800 text-slate-800 dark:text-slate-200 hover:border-slate-300"
                          }`}
                        >
                          {option}
                        </button>
                      );
                    })}
                  </div>
                ) : (
                  /* MANCHESTER SHOW INTER-QUESTION RANKINGS AND ANSWERS */
                  <div className="space-y-4">
                    <div className="p-4 bg-emerald-50 dark:bg-emerald-950/20 border border-emerald-100 dark:border-emerald-900 rounded-2xl">
                      <span className="text-[10px] font-black text-emerald-600 dark:text-emerald-400 uppercase tracking-widest block mb-1">
                        Bonne réponse
                      </span>
                      <p className="text-xs font-black text-emerald-800 dark:text-emerald-300">
                        {activeRoom.quiz.questions[activeRoom.currentQuestionIdx]?.options[
                          activeRoom.quiz.questions[activeRoom.currentQuestionIdx]?.correctAnswerIndex || 0
                        ]}
                      </p>
                    </div>

                    {/* Explanations peeking */}
                    <p className="text-[11px] text-slate-400 italic leading-relaxed px-1">
                      {activeRoom.quiz.questions[activeRoom.currentQuestionIdx]?.explanation}
                    </p>

                    {/* Live Rankings for this question */}
                    <div className="space-y-2 pt-2">
                      <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest block">
                        Classement Live de la Manche
                      </span>
                      <div className="space-y-2">
                        {[...activeRoom.players].sort((a,b)=> b.score - a.score).map((p, idx) => (
                          <div
                            key={p.uid}
                            className="p-3 bg-white dark:bg-slate-900 border border-slate-100 dark:border-slate-800 rounded-xl flex items-center justify-between"
                          >
                            <div className="flex items-center gap-3">
                              <span className="text-xs font-bold text-slate-400 font-mono">#{idx+1}</span>
                              <img src={p.avatarUrl} alt="" className="w-6 h-6 rounded bg-slate-100" />
                              <span className="text-xs font-black dark:text-white">{p.pseudo}</span>
                            </div>
                            <div className="flex items-center gap-2 text-right">
                              <span className="text-[10px] font-black text-indigo-500 font-mono">{p.score} pts</span>
                              <span className="text-[10px] text-slate-400">({p.correctCount} correct)</span>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>

                    {/* Host action button for proceeding */}
                    {activeRoom.hostUid === user.uid && (
                      <button
                        onClick={handleNextQuestion}
                        className="w-full mt-4 py-4 bg-indigo-500 hover:bg-indigo-600 text-white text-xs font-black rounded-2xl flex items-center justify-center gap-1.5 cursor-pointer shadow-lg"
                      >
                        Suivant <ChevronRight className="w-4 h-4" />
                      </button>
                    )}
                  </div>
                )}

              </div>

              {/* Active Playing Info overlay footer */}
              <div className="pt-6 border-t border-slate-100 dark:border-slate-800 mt-6 flex justify-between items-center text-[10px] text-slate-400 font-bold">
                <span>Quiz : {activeRoom.quiz.title}</span>
                <span>Code : {activeRoom.id}</span>
              </div>

            </div>
          )}

          {/* FINISHED SCOREBOARD SCREEN */}
          {activeRoom.status === "finished" && (
            <div className="flex-1 flex flex-col justify-between max-w-sm mx-auto w-full py-6 text-center">
              <div className="space-y-6">
                
                {/* Visual Header */}
                <div className="space-y-2">
                  <div className="w-16 h-16 rounded-[24px] bg-yellow-100 dark:bg-yellow-950/40 text-yellow-500 flex items-center justify-center mx-auto shadow-lg shadow-yellow-500/10">
                    <Trophy className="w-8 h-8 fill-current" />
                  </div>
                  <h3 className="text-lg font-black dark:text-white">Duel Terminé !</h3>
                  <p className="text-[10px] text-slate-400 max-w-xs mx-auto">
                    Voici les scores définitifs de la partie en direct. Félicitations à tous les combattants !
                  </p>
                </div>

                {/* Scoreboard List */}
                <div className="space-y-2.5">
                  {[...activeRoom.players].sort((a,b)=> b.score - a.score).map((p, idx) => (
                    <div
                      key={p.uid}
                      className={`p-3.5 rounded-2xl flex items-center justify-between border ${
                        idx === 0 
                          ? "bg-yellow-50/70 dark:bg-yellow-950/20 border-yellow-200" 
                          : "bg-white dark:bg-slate-900 border-slate-100"
                      }`}
                    >
                      <div className="flex items-center gap-3">
                        <span className="text-sm font-black font-mono">
                          {idx === 0 ? "🏆" : `#${idx+1}`}
                        </span>
                        <img src={p.avatarUrl} alt="" className="w-9 h-9 rounded-xl bg-slate-100" />
                        <div className="text-left">
                          <span className="text-xs font-black block dark:text-white">{p.pseudo}</span>
                          <span className="text-[9px] font-bold text-slate-400">Niveau {p.level}</span>
                        </div>
                      </div>

                      <div className="text-right">
                        <span className="text-xs font-black text-indigo-500 font-mono block">{p.score} pts</span>
                        <span className="text-[9px] font-bold text-slate-400">{p.correctCount} bonnes réponses</span>
                      </div>
                    </div>
                  ))}
                </div>

              </div>

              {/* Action leave finished room */}
              <button
                onClick={handleLeaveRoom}
                className="w-full py-4 bg-slate-900 hover:bg-black text-white text-xs font-black rounded-2xl shadow-lg cursor-pointer mt-8"
              >
                Retourner au Hub Social
              </button>

            </div>
          )}

        </div>
      ) : (
        /* STANDARD TAB HUB LAYOUT */
        <>
          {/* Tab Navigation row */}
          <div className="px-5 border-b border-slate-100 dark:border-slate-800/60 shrink-0 bg-white dark:bg-slate-950 flex gap-4">
            <button
              onClick={() => setActiveTab("friends")}
              className={`py-3.5 text-xs font-black uppercase tracking-wider relative cursor-pointer ${
                activeTab === "friends" ? "text-indigo-600 dark:text-indigo-400" : "text-slate-400"
              }`}
            >
              Amis ({friends.length})
              {activeTab === "friends" && (
                <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-indigo-500 rounded-full" />
              )}
            </button>

            <button
              onClick={() => setActiveTab("challenges")}
              className={`py-3.5 text-xs font-black uppercase tracking-wider relative cursor-pointer ${
                activeTab === "challenges" ? "text-indigo-600 dark:text-indigo-400" : "text-slate-400"
              }`}
            >
              Défis ({challenges.length})
              {activeTab === "challenges" && (
                <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-indigo-500 rounded-full" />
              )}
            </button>

            <button
              onClick={() => setActiveTab("multiplayer")}
              className={`py-3.5 text-xs font-black uppercase tracking-wider relative cursor-pointer ${
                activeTab === "multiplayer" ? "text-indigo-600 dark:text-indigo-400" : "text-slate-400"
              }`}
            >
              Multijoueur en direct
              {activeTab === "multiplayer" && (
                <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-indigo-500 rounded-full" />
              )}
            </button>
          </div>

          {/* Tab Scroll Content */}
          <div className="flex-1 overflow-y-auto p-5">
            
            {/* 1. TAB FRIENDS */}
            {activeTab === "friends" && (
              <div className="space-y-5 animate-fadeIn">
                
                {/* Form Add Friend */}
                <form onSubmit={handleAddFriend} className="p-4 bg-white dark:bg-slate-900 border border-slate-100 dark:border-slate-800 rounded-2xl android-shadow space-y-3">
                  <div className="flex items-center gap-1.5">
                    <UserPlus className="w-4 h-4 text-indigo-500" />
                    <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">
                      Ajouter un ami
                    </span>
                  </div>
                  
                  <div className="flex gap-2">
                    <input
                      type="text"
                      placeholder="Saisir son pseudo QuizMaster..."
                      value={searchPseudo}
                      onChange={(e) => setSearchPseudo(e.target.value)}
                      className="flex-1 px-3 py-2.5 bg-slate-50 dark:bg-slate-800 border border-slate-200/50 dark:border-slate-700 rounded-xl text-xs font-bold focus:outline-none focus:ring-1 focus:ring-indigo-500 dark:text-white"
                    />
                    <button
                      type="submit"
                      className="px-4 bg-indigo-500 hover:bg-indigo-600 text-white rounded-xl text-xs font-black flex items-center justify-center gap-1.5 cursor-pointer shadow-md shadow-indigo-500/10"
                    >
                      <Send className="w-3.5 h-3.5" /> Envoyer
                    </button>
                  </div>

                  {friendMsg && (
                    <p className="text-[10px] font-black text-indigo-600 dark:text-indigo-400">
                      {friendMsg}
                    </p>
                  )}
                </form>

                {/* Received Friend requests */}
                {requests.length > 0 && (
                  <div className="space-y-2 animate-bounceIn">
                    <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest block">
                      Demandes reçues ({requests.length})
                    </span>
                    <div className="space-y-2">
                      {requests.map((r) => (
                        <div
                          key={r.id}
                          className="p-3 bg-indigo-50/60 dark:bg-indigo-950/20 border border-indigo-100 dark:border-indigo-900 rounded-2xl flex items-center justify-between"
                        >
                          <div className="flex items-center gap-3">
                            <img src={r.fromAvatarUrl} alt="" className="w-8 h-8 rounded-lg bg-slate-100" />
                            <span className="text-xs font-black dark:text-white">{r.fromPseudo}</span>
                          </div>
                          <div className="flex gap-1.5">
                            <button
                              onClick={() => handleRespondRequest(r.id, "accepted")}
                              className="p-1.5 bg-emerald-500 hover:bg-emerald-600 text-white rounded-lg cursor-pointer shadow"
                            >
                              <Check className="w-3.5 h-3.5" />
                            </button>
                            <button
                              onClick={() => handleRespondRequest(r.id, "declined")}
                              className="p-1.5 bg-rose-500 hover:bg-rose-600 text-white rounded-lg cursor-pointer shadow"
                            >
                              <X className="w-3.5 h-3.5" />
                            </button>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* Main Friends listing */}
                <div className="space-y-2">
                  <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest block">
                    Mes amis ({friends.length})
                  </span>

                  {friendsLoading ? (
                    <div className="py-8 text-center text-slate-400 animate-pulse">Chargement de la liste...</div>
                  ) : friends.length === 0 ? (
                    <div className="p-8 text-center text-slate-400 border border-dashed border-slate-200 dark:border-slate-800 rounded-2xl">
                      <p className="text-xs font-black">Tu n'as pas encore d'amis connectés.</p>
                      <p className="text-[10px] text-slate-400 mt-1">Ajoute un pseudo pour commencer à le défier !</p>
                    </div>
                  ) : (
                    <div className="space-y-2">
                      {friends.map((f) => (
                        <div
                          key={f.uid}
                          className="p-3.5 bg-white dark:bg-slate-900 border border-slate-100 dark:border-slate-800 rounded-2xl flex items-center justify-between shadow-xs"
                        >
                          <div className="flex items-center gap-3">
                            <div className="relative">
                              <img src={f.avatarUrl} alt="" className="w-10 h-10 rounded-xl bg-slate-100" />
                              <span className={`absolute -bottom-1 -right-1 w-3 h-3 rounded-full border-2 border-white ${
                                f.status === "online" ? "bg-emerald-500" : "bg-slate-300"
                              }`} />
                            </div>
                            <div>
                              <p className="text-xs font-black dark:text-white flex items-center gap-1.5">
                                {f.pseudo}
                              </p>
                              <span className="text-[10px] text-slate-400 font-bold block">
                                Niveau {f.level} • {f.successRate}% succès
                              </span>
                            </div>
                          </div>

                          <div className="flex gap-1">
                            <button
                              onClick={() => {
                                setSelectedFriendUidForChallenge(f.uid);
                                setSelectedQuizIdForChallenge(quizzes[0]?.id || "");
                                setActiveTab("challenges");
                              }}
                              className="p-2 bg-indigo-50 hover:bg-indigo-100 dark:bg-indigo-950/20 dark:hover:bg-indigo-950/40 text-indigo-500 rounded-xl cursor-pointer"
                            >
                              <Swords className="w-4 h-4" />
                            </button>
                            <button
                              onClick={() => handleRemoveFriend(f.uid)}
                              className="p-2 bg-rose-50 hover:bg-rose-100 dark:bg-rose-950/20 dark:hover:bg-rose-950/40 text-rose-500 rounded-xl cursor-pointer"
                            >
                              <Trash2 className="w-4 h-4" />
                            </button>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>

              </div>
            )}

            {/* 2. TAB CHALLENGES */}
            {activeTab === "challenges" && (
              <div className="space-y-5 animate-fadeIn">
                
                {/* Form Create Challenge */}
                <div className="p-4 bg-white dark:bg-slate-900 border border-slate-100 dark:border-slate-800 rounded-2xl android-shadow space-y-3">
                  <div className="flex items-center gap-1.5">
                    <Swords className="w-4 h-4 text-indigo-500 animate-pulse" />
                    <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">
                      Lancer un nouveau Duel
                    </span>
                  </div>

                  <div className="space-y-2">
                    <label className="text-[10px] text-slate-400 font-black block">1. Choisis un ami</label>
                    <select
                      value={selectedFriendUidForChallenge}
                      onChange={(e) => setSelectedFriendUidForChallenge(e.target.value)}
                      className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-200/50 dark:border-slate-700 px-3 py-2.5 rounded-xl text-xs font-bold dark:text-white"
                    >
                      <option value="">-- Sélectionner un ami --</option>
                      {friends.map((f) => (
                        <option key={f.uid} value={f.uid}>{f.pseudo} (Niveau {f.level})</option>
                      ))}
                    </select>

                    <label className="text-[10px] text-slate-400 font-black block pt-1">2. Choisis un quiz pour s'affronter</label>
                    <select
                      value={selectedQuizIdForChallenge}
                      onChange={(e) => setSelectedQuizIdForChallenge(e.target.value)}
                      className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-200/50 dark:border-slate-700 px-3 py-2.5 rounded-xl text-xs font-bold dark:text-white"
                    >
                      <option value="">-- Sélectionner un quiz --</option>
                      {quizzes.map((q) => (
                        <option key={q.id} value={q.id}>{q.title} ({q.category})</option>
                      ))}
                    </select>
                  </div>

                  <button
                    onClick={handleCreateChallenge}
                    className="w-full py-3 bg-indigo-500 hover:bg-indigo-600 text-white rounded-xl text-xs font-black flex items-center justify-center gap-2 cursor-pointer shadow-md"
                  >
                    <Play className="w-3.5 h-3.5 fill-current" />
                    Défier cet ami maintenant !
                  </button>

                  {challengeMsg && (
                    <p className="text-[10px] font-black text-indigo-500 text-center">{challengeMsg}</p>
                  )}
                </div>

                {/* Challenges lists */}
                <div className="space-y-2">
                  <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest block">
                    Mes défis récents
                  </span>

                  {challengesLoading ? (
                    <div className="py-8 text-center text-slate-400 animate-pulse">Chargement de la liste...</div>
                  ) : challenges.length === 0 ? (
                    <div className="p-8 text-center text-slate-400 border border-dashed border-slate-200 dark:border-slate-800 rounded-2xl">
                      <p className="text-xs font-black">Aucun défi en cours.</p>
                      <p className="text-[10px] text-slate-400 mt-1">Crée un duel ci-dessus pour lancer les hostilités !</p>
                    </div>
                  ) : (
                    <div className="space-y-2">
                      {challenges.map((c) => {
                        const isCreator = c.creatorUid === user.uid;
                        return (
                          <div
                            key={c.id}
                            className="p-3.5 bg-white dark:bg-slate-900 border border-slate-100 dark:border-slate-800 rounded-2xl flex flex-col gap-2 shadow-xs"
                          >
                            <div className="flex justify-between items-center">
                              <span className="text-[9px] font-mono text-slate-400">
                                {new Date(c.timestamp).toLocaleDateString()}
                              </span>
                              <span className={`px-2 py-0.5 text-[8px] font-black uppercase rounded-md ${
                                c.status === "completed" 
                                  ? "bg-emerald-100 text-emerald-600" 
                                  : c.status === "accepted" ? "bg-blue-100 text-blue-600" : "bg-amber-100 text-amber-600"
                              }`}>
                                {c.status === "completed" ? "Terminé" : c.status === "accepted" ? "En cours" : "En attente"}
                              </span>
                            </div>

                            <div className="flex justify-between items-center">
                              <div className="text-left">
                                <p className="text-xs font-black dark:text-white">{c.quizTitle}</p>
                                <p className="text-[9px] font-bold text-slate-400">
                                  {isCreator ? `Défi envoyé à ${c.targetPseudo}` : `Reçu de ${c.creatorPseudo}`}
                                </p>
                              </div>

                              {!isCreator && c.status === "pending" && (
                                <div className="flex gap-1 shrink-0">
                                  <button
                                    onClick={() => handleRespondChallenge(c.id, "accepted")}
                                    className="p-2 bg-indigo-500 hover:bg-indigo-600 text-white rounded-xl text-[10px] font-black cursor-pointer shadow"
                                  >
                                    Accepter & Jouer
                                  </button>
                                  <button
                                    onClick={() => handleRespondChallenge(c.id, "declined")}
                                    className="p-2 bg-slate-100 hover:bg-slate-200 dark:bg-slate-850 text-slate-500 rounded-xl text-[10px] font-black cursor-pointer"
                                  >
                                    Refuser
                                  </button>
                                </div>
                              )}
                            </div>

                            {/* Scores display if completed */}
                            {c.status === "completed" && (
                              <div className="border-t border-slate-100 dark:border-slate-800/60 pt-2.5 mt-1 grid grid-cols-2 text-center text-[10px]">
                                <div>
                                  <span className="text-slate-400 block font-bold">{c.creatorPseudo}</span>
                                  <span className="font-extrabold text-slate-800 dark:text-slate-300">{c.creatorScore} pts ({c.creatorAccuracy}%)</span>
                                </div>
                                <div className="border-l border-slate-100 dark:border-slate-800/60">
                                  <span className="text-slate-400 block font-bold">{c.targetPseudo}</span>
                                  <span className="font-extrabold text-slate-800 dark:text-slate-300">{c.targetScore} pts ({c.targetAccuracy}%)</span>
                                </div>
                              </div>
                            )}

                          </div>
                        );
                      })}
                    </div>
                  )}
                </div>

              </div>
            )}

            {/* 3. TAB MULTIPLAYER */}
            {activeTab === "multiplayer" && (
              <div className="space-y-5 animate-fadeIn">
                
                {/* Panel 1: Join via code */}
                <div className="p-4 bg-white dark:bg-slate-900 border border-slate-100 dark:border-slate-800 rounded-2xl android-shadow space-y-3">
                  <div className="flex items-center gap-1.5">
                    <Smartphone className="w-4 h-4 text-indigo-500" />
                    <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">
                      Rejoindre un salon existant
                    </span>
                  </div>

                  <div className="flex gap-2">
                    <input
                      type="text"
                      maxLength={6}
                      placeholder="Saisir le code à 6 chiffres..."
                      value={roomCodeToJoin}
                      onChange={(e) => setRoomCodeToJoin(e.target.value.replace(/\D/g, ""))}
                      className="flex-1 px-3 py-2.5 bg-slate-50 dark:bg-slate-800 border border-slate-200/50 dark:border-slate-700 rounded-xl text-center font-extrabold font-mono tracking-widest text-sm focus:outline-none focus:ring-1 focus:ring-indigo-500 dark:text-white"
                    />
                    <button
                      onClick={handleJoinRoom}
                      className="px-4 bg-indigo-500 hover:bg-indigo-600 text-white rounded-xl text-xs font-black flex items-center justify-center gap-1.5 cursor-pointer shadow-md"
                    >
                      Rejoindre
                    </button>
                  </div>
                </div>

                {/* Panel 2: Create room as Host */}
                <div className="p-4 bg-white dark:bg-slate-900 border border-slate-100 dark:border-slate-800 rounded-2xl android-shadow space-y-3">
                  <div className="flex items-center gap-1.5">
                    <Trophy className="w-4 h-4 text-amber-500" />
                    <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">
                      Créer un salon de Duel
                    </span>
                  </div>

                  <div className="space-y-1.5">
                    <label className="text-[10px] text-slate-400 font-black block">Sélectionner le Quiz de l'arène</label>
                    <select
                      value={selectedQuizIdForRoom}
                      onChange={(e) => setSelectedQuizIdForRoom(e.target.value)}
                      className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-200/50 dark:border-slate-700 px-3 py-2.5 rounded-xl text-xs font-bold dark:text-white"
                    >
                      {quizzes.map((q) => (
                        <option key={q.id} value={q.id}>{q.title} ({q.category})</option>
                      ))}
                    </select>
                  </div>

                  <button
                    onClick={handleCreateRoom}
                    className="w-full py-3 bg-slate-950 dark:bg-white text-white dark:text-slate-950 rounded-xl text-xs font-black flex items-center justify-center gap-2 cursor-pointer shadow-md"
                  >
                    <Play className="w-3.5 h-3.5 fill-current" />
                    Créer et générer le code
                  </button>
                </div>

                {multiError && (
                  <p className="text-xs font-black text-rose-500 text-center">{multiError}</p>
                )}

              </div>
            )}

          </div>
        </>
      )}

    </div>
  );
}
