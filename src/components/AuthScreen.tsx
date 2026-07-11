import React, { useState } from "react";
import { motion } from "motion/react";
import { UserProfile } from "../types";
import { Sparkles, Mail, Lock, User, ArrowRight, Chrome, Compass, GraduationCap } from "lucide-react";

interface AuthScreenProps {
  onAuthSuccess: (user: UserProfile) => void;
}

export default function AuthScreen({ onAuthSuccess }: AuthScreenProps) {
  const [mode, setMode] = useState<"login" | "register" | "forgot">("login");
  
  // Form states
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [pseudo, setPseudo] = useState("");
  const [fullName, setFullName] = useState("");
  const [error, setError] = useState("");
  const [infoMessage, setInfoMessage] = useState("");

  const handleLogin = (e: React.FormEvent) => {
    e.preventDefault();
    setError("");

    if (!email || !password) {
      setError("Veuillez remplir tous les champs.");
      return;
    }

    if (password.length < 6) {
      setError("Le mot de passe doit contenir au moins 6 caractères.");
      return;
    }

    // Simulate successful login
    const mockUser: UserProfile = {
      uid: "u-current",
      email: email,
      pseudo: email.split("@")[0],
      fullName: "Nouvel Utilisateur",
      avatarUrl: `https://api.dicebear.com/7.x/pixel-art/svg?seed=${email}`,
      level: 1,
      xp: 0,
      quizzesPlayedCount: 0,
      quizzesFinishedCount: 0,
      successRate: 0,
      averageResponseTime: 0,
      badges: [],
      joinDate: "Juillet 2026",
      history: []
    };

    onAuthSuccess(mockUser);
  };

  const handleRegister = (e: React.FormEvent) => {
    e.preventDefault();
    setError("");

    if (!email || !password || !pseudo || !fullName) {
      setError("Veuillez remplir tous les champs.");
      return;
    }

    if (password.length < 6) {
      setError("Le mot de passe doit contenir au moins 6 caractères.");
      return;
    }

    // Simulate profile creation after registration
    const newUser: UserProfile = {
      uid: "u-current",
      email: email,
      pseudo: pseudo,
      fullName: fullName,
      avatarUrl: `https://api.dicebear.com/7.x/pixel-art/svg?seed=${pseudo}`,
      level: 1,
      xp: 0,
      quizzesPlayedCount: 0,
      quizzesFinishedCount: 0,
      successRate: 0,
      averageResponseTime: 0,
      badges: [],
      joinDate: "Juillet 2026",
      history: []
    };

    onAuthSuccess(newUser);
  };

  const handleForgotPassword = (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setInfoMessage("");

    if (!email) {
      setError("Veuillez entrer votre adresse email.");
      return;
    }

    setInfoMessage("Un lien de réinitialisation a été envoyé à votre adresse email.");
    setTimeout(() => {
      setMode("login");
      setInfoMessage("");
    }, 4000);
  };

  const handleGoogleSignIn = () => {
    setError("");
    // Simulate Google Sign-In and profile creation
    const googleUser: UserProfile = {
      uid: "u-google",
      email: "toutetoure4@gmail.com",
      pseudo: "Toure_Expert",
      fullName: "Toure Expert",
      avatarUrl: "https://api.dicebear.com/7.x/pixel-art/svg?seed=google_user",
      level: 1,
      xp: 1200, // Pre-gifted XP for testing
      quizzesPlayedCount: 2,
      quizzesFinishedCount: 2,
      successRate: 85,
      averageResponseTime: 5.2,
      badges: [
        {
          id: "badge-1",
          title: "Premier Pas",
          description: "Terminer ton tout premier quiz sur QuizMaster.",
          iconName: "Compass",
          color: "#3b82f6",
          earnedAt: "2026-07-10T10:00:00Z"
        }
      ],
      joinDate: "Juillet 2026",
      history: [
        {
          id: "hist-pre-1",
          quizId: "quiz-jeux-video",
          quizTitle: "Culture Gaming & Légendes",
          category: "Jeux vidéo",
          score: 3,
          totalQuestions: 3,
          xpEarned: 600,
          date: "2026-07-09T18:30:00Z"
        },
        {
          id: "hist-pre-2",
          quizId: "quiz-tech-ia",
          quizTitle: "L'Intelligence Artificielle & La Tech",
          category: "Technologie",
          score: 2,
          totalQuestions: 3,
          xpEarned: 600,
          date: "2026-07-10T09:45:00Z"
        }
      ]
    };

    onAuthSuccess(googleUser);
  };

  return (
    <div className="flex-1 flex flex-col justify-between px-6 py-6 bg-slate-50 dark:bg-slate-950 overflow-y-auto">
      {/* Header Splash */}
      <div className="flex flex-col items-center text-center mt-6">
        <motion.div 
          initial={{ scale: 0.8, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          transition={{ duration: 0.5, type: "spring" }}
          className="w-16 h-16 rounded-3xl bg-blue-500 flex items-center justify-center text-white shadow-lg shadow-blue-500/20"
        >
          <GraduationCap className="w-9 h-9" />
        </motion.div>
        
        <motion.h1 
          initial={{ y: 10, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ delay: 0.1, duration: 0.4 }}
          className="text-2xl font-extrabold tracking-tight font-display text-slate-900 dark:text-white mt-4"
        >
          QuizMaster
        </motion.h1>
        
        <p className="text-sm text-slate-500 dark:text-slate-400 mt-1 max-w-xs">
          {mode === "login" && "Connecte-toi pour affronter la communauté et remporter des badges !"}
          {mode === "register" && "Crée ton profil en quelques secondes et commence à grimper le classement."}
          {mode === "forgot" && "Pas de panique, saisis ton adresse email pour récupérer tes accès."}
        </p>
      </div>

      {/* Main Form Fields */}
      <motion.div 
        key={mode}
        initial={{ x: 20, opacity: 0 }}
        animate={{ x: 0, opacity: 1 }}
        exit={{ x: -20, opacity: 0 }}
        transition={{ duration: 0.3 }}
        className="my-auto py-6"
      >
        {error && (
          <div className="mb-4 p-3 rounded-xl bg-red-50 dark:bg-red-950/30 text-red-600 dark:text-red-400 text-xs font-semibold border border-red-100 dark:border-red-900/50">
            {error}
          </div>
        )}

        {infoMessage && (
          <div className="mb-4 p-3 rounded-xl bg-emerald-50 dark:bg-emerald-950/30 text-emerald-600 dark:text-emerald-400 text-xs font-semibold border border-emerald-100 dark:border-emerald-900/50">
            {infoMessage}
          </div>
        )}

        {/* Email, Password Sign In Form */}
        <form onSubmit={
          mode === "login" ? handleLogin : 
          mode === "register" ? handleRegister : 
          handleForgotPassword
        } className="space-y-4">
          
          {mode === "register" && (
            <>
              {/* Pseudo input */}
              <div className="relative">
                <span className="absolute inset-y-0 left-4 flex items-center text-slate-400">
                  <User className="w-4 h-4" />
                </span>
                <input
                  type="text"
                  placeholder="Pseudo"
                  value={pseudo}
                  onChange={(e) => setPseudo(e.target.value)}
                  className="w-full pl-11 pr-4 py-3.5 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 text-slate-900 dark:text-white transition-all"
                  required
                />
              </div>

              {/* Nom Complet */}
              <div className="relative">
                <span className="absolute inset-y-0 left-4 flex items-center text-slate-400">
                  <Sparkles className="w-4 h-4" />
                </span>
                <input
                  type="text"
                  placeholder="Nom complet"
                  value={fullName}
                  onChange={(e) => setFullName(e.target.value)}
                  className="w-full pl-11 pr-4 py-3.5 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 text-slate-900 dark:text-white transition-all"
                  required
                />
              </div>
            </>
          )}

          {/* Email input */}
          <div className="relative">
            <span className="absolute inset-y-0 left-4 flex items-center text-slate-400">
              <Mail className="w-4 h-4" />
            </span>
            <input
              type="email"
              placeholder="Adresse email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="w-full pl-11 pr-4 py-3.5 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 text-slate-900 dark:text-white transition-all"
              required
            />
          </div>

          {mode !== "forgot" && (
            /* Password input */
            <div className="relative">
              <span className="absolute inset-y-0 left-4 flex items-center text-slate-400">
                <Lock className="w-4 h-4" />
              </span>
              <input
                type="password"
                placeholder="Mot de passe"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full pl-11 pr-4 py-3.5 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 text-slate-900 dark:text-white transition-all"
                required
              />
            </div>
          )}

          {mode === "login" && (
            <div className="text-right">
              <button
                type="button"
                onClick={() => setMode("forgot")}
                className="text-xs font-semibold text-blue-500 hover:underline"
              >
                Mot de passe oublié ?
              </button>
            </div>
          )}

          {/* Action Button */}
          <button
            type="submit"
            className="w-full py-4 bg-blue-500 hover:bg-blue-600 text-white rounded-2xl text-sm font-bold flex items-center justify-center gap-2 shadow-lg shadow-blue-500/10 cursor-pointer active:scale-98 transition-all"
          >
            {mode === "login" && "Se connecter"}
            {mode === "register" && "Créer un compte"}
            {mode === "forgot" && "Envoyer le lien"}
            <ArrowRight className="w-4 h-4" />
          </button>
        </form>

        {mode !== "forgot" && (
          <div className="mt-6">
            <div className="relative flex items-center justify-center">
              <div className="absolute w-full border-t border-slate-200 dark:border-slate-800"></div>
              <span className="relative px-3 bg-slate-50 dark:bg-slate-950 text-[11px] font-semibold tracking-wider text-slate-400 uppercase">
                Ou continuer avec
              </span>
            </div>

            {/* Google OAuth Simulation Button */}
            <button
              type="button"
              onClick={handleGoogleSignIn}
              className="mt-4 w-full py-3.5 bg-white dark:bg-slate-900 hover:bg-slate-50 dark:hover:bg-slate-850 text-slate-700 dark:text-slate-300 rounded-2xl text-sm font-semibold flex items-center justify-center gap-3 border border-slate-200 dark:border-slate-800 cursor-pointer transition-all active:scale-98"
            >
              <Chrome className="w-4.5 h-4.5 text-red-500" />
              Google
            </button>
          </div>
        )}
      </motion.div>

      {/* Footer Navigation */}
      <div className="text-center pb-2">
        {mode === "login" ? (
          <p className="text-xs text-slate-500 dark:text-slate-400">
            Nouveau sur QuizMaster ?{" "}
            <button
              onClick={() => setMode("register")}
              className="font-bold text-blue-500 hover:underline"
            >
              Créer un compte
            </button>
          </p>
        ) : (
          <p className="text-xs text-slate-500 dark:text-slate-400">
            Déjà inscrit ?{" "}
            <button
              onClick={() => setMode("login")}
              className="font-bold text-blue-500 hover:underline"
            >
              Se connecter
            </button>
          </p>
        )}
      </div>
    </div>
  );
}
