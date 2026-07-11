import React, { useState, useEffect } from "react";
import { motion, AnimatePresence } from "motion/react";
import { UserProfile } from "../types";
import { dbService } from "../lib/firebase";
import { ArrowLeft, Sparkles, Star, ShieldCheck, Zap, Coins, Check, Crown, AlertTriangle } from "lucide-react";

interface PremiumScreenProps {
  user: UserProfile;
  onBack: () => void;
  onUpdateUser: (user: UserProfile) => void;
}

export default function PremiumScreen({ user, onBack, onUpdateUser }: PremiumScreenProps) {
  const [premiumPrice, setPremiumPrice] = useState<number>(5000);
  const [isBuying, setIsBuying] = useState<boolean>(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [success, setSuccess] = useState<boolean>(false);

  useEffect(() => {
    // Fetch price from admin settings
    dbService.getAdminSettings().then(settings => {
      if (settings && settings.premiumPrice) {
        setPremiumPrice(settings.premiumPrice);
      }
    });
  }, []);

  const coins = user.quizCoins ?? 1000;
  const missingCoins = Math.max(0, premiumPrice - coins);

  const handlePurchasePremium = async () => {
    setIsBuying(true);
    setErrorMsg(null);

    try {
      // 1. Secure Server-Side premium purchase
      const response = await fetch("/api/premium/buy", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ uid: user.uid })
      });

      if (!response.ok) {
        const errData = await response.json();
        throw new Error(errData.error || "Échec de la validation serveur de l'abonnement Premium.");
      }

      // 2. Complete local purchase and state persistence
      const result = await dbService.buyPremium(user.uid);
      if (result.success && result.profile) {
        onUpdateUser(result.profile);
        setSuccess(true);
      } else {
        throw new Error(result.error || "Impossible d'enregistrer le statut Premium localement.");
      }
    } catch (err: any) {
      setErrorMsg(err.message || "Une erreur est survenue lors de l'achat.");
    } finally {
      setIsBuying(false);
    }
  };

  const advantages = [
    { 
      category: "Personnalisation exclusive", 
      items: [
        "Accès immédiat à tous les avatars exclusifs de la boutique",
        "Cadres de profil dorés et animés scintillants",
        "Thèmes de couleur Premium pour personnaliser l'application",
        "Badges de profil spéciaux visibles par tous les joueurs",
        "Animations et effets visuels de gain décuplés"
      ] 
    },
    { 
      category: "Avantages de Jeu & Quiz", 
      items: [
        "Génération de quiz IA illimitée sans aucune restriction",
        "Accès exclusif aux quiz premium",
        "Mode révision avancé pour réviser tes erreurs à l'infini",
        "Statistiques de progression détaillées et analytiques",
        "Bonus permanent de XP (+50% XP sur toutes les victoires)",
        "Suppression complète des limites de vies quotidiennes"
      ] 
    },
    { 
      category: "Visibilité & Profil", 
      items: [
        "Badge Premium scintillant visible sur le classement",
        "Profil utilisateur amélioré avec cartes au design épuré",
        "Historique des parties complet sauvegardé à vie",
        "Animations de victoire exclusives lors de tes succès"
      ] 
    }
  ];

  return (
    <div className="flex-1 flex flex-col h-full bg-slate-950 text-white overflow-hidden relative">
      
      {/* Background Star Ambient Effect */}
      <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top,_var(--tw-gradient-stops))] from-amber-500/10 via-slate-950 to-slate-950 z-0"></div>
      
      {/* Header bar */}
      <div className="px-5 py-4 border-b border-white/5 bg-slate-900/40 backdrop-blur-md flex items-center justify-between shrink-0 z-10">
        <div className="flex items-center gap-3">
          <button 
            onClick={onBack}
            className="p-1.5 hover:bg-white/5 rounded-xl cursor-pointer text-slate-400 hover:text-white transition-colors"
          >
            <ArrowLeft className="w-5 h-5" />
          </button>
          <div>
            <h2 className="text-base font-black text-white flex items-center gap-1.5">
              Premium <Crown className="w-4 h-4 text-amber-400 fill-amber-400/20" />
            </h2>
            <p className="text-[10px] text-amber-400/80 font-bold uppercase tracking-wider">Économie 100% virtuelle</p>
          </div>
        </div>

        {/* Portefeuille (Wallet) */}
        <div className="flex items-center gap-1.5 bg-amber-500/15 border border-amber-500/30 px-3 py-1.5 rounded-full select-none">
          <Coins className="w-3.5 h-3.5 text-amber-400 animate-bounce" />
          <span className="text-xs font-black font-mono text-amber-400">
            {coins.toLocaleString()} QC
          </span>
        </div>
      </div>

      {/* Main Content Area */}
      <div className="flex-1 overflow-y-auto px-5 py-6 space-y-6 z-10">
        
        <AnimatePresence mode="wait">
          {!success ? (
            <motion.div 
              key="premium-sales-pitch"
              initial={{ opacity: 0, y: 15 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -15 }}
              className="space-y-6"
            >
              {/* Premium Promo Hero Card */}
              <div className="p-6 rounded-[32px] bg-gradient-to-br from-amber-400 via-amber-500 to-yellow-600 text-slate-950 text-center relative overflow-hidden shadow-xl shadow-amber-500/10">
                <div className="absolute -right-12 -top-12 w-40 h-40 bg-white/10 rounded-full blur-2xl"></div>
                <Crown className="w-12 h-12 text-slate-950 fill-slate-950/10 mx-auto animate-pulse" />
                
                <h1 className="text-xl font-black font-display mt-3 tracking-tight">QUIZMASTER PREMIUM</h1>
                <p className="text-xs font-semibold text-slate-900 mt-1 max-w-[250px] mx-auto leading-relaxed">
                  Deviens une légende des quiz et personnalise ton expérience sans limites.
                </p>

                {/* Price Tag */}
                <div className="mt-4 inline-flex items-center gap-2 bg-slate-950 text-white px-5 py-2.5 rounded-2xl shadow-lg border border-white/10">
                  <Coins className="w-4 h-4 text-amber-400 fill-amber-400/10" />
                  <span className="text-sm font-black font-mono">{premiumPrice.toLocaleString()} QuizCoins</span>
                </div>

                <p className="text-[9px] text-slate-950/70 font-black tracking-wider uppercase mt-3">Achat unique • Sans abonnement réel</p>
              </div>

              {/* Advantages Modules */}
              <div className="space-y-4">
                <h3 className="text-xs font-black text-slate-400 tracking-wider uppercase">Tous tes avantages</h3>

                {advantages.map((adv, idx) => (
                  <div 
                    key={idx} 
                    className="p-5 bg-slate-900/60 border border-white/5 rounded-2xl space-y-3 shadow-lg"
                  >
                    <h4 className="text-xs font-black text-amber-400 flex items-center gap-2">
                      <Star className="w-3.5 h-3.5 fill-amber-400/20" />
                      {adv.category}
                    </h4>
                    <ul className="space-y-2">
                      {adv.items.map((item, itemIdx) => (
                        <li key={itemIdx} className="flex items-start gap-2 text-xs text-slate-300">
                          <Check className="w-3.5 h-3.5 text-amber-400 mt-0.5 shrink-0" />
                          <span className="leading-tight">{item}</span>
                        </li>
                      ))}
                    </ul>
                  </div>
                ))}
              </div>

              {/* Error messages */}
              {errorMsg && (
                <div className="p-4 bg-red-950/60 border border-red-500/30 rounded-2xl flex items-center gap-3 text-xs text-red-300">
                  <AlertTriangle className="w-5 h-5 text-red-400 shrink-0" />
                  <span>{errorMsg}</span>
                </div>
              )}

              {/* Missing Coins Alert */}
              {missingCoins > 0 && (
                <div className="p-4 bg-amber-950/40 border border-amber-500/20 rounded-2xl text-center text-xs text-amber-200">
                  <p className="font-semibold">Il te manque <span className="font-mono font-black">{missingCoins} QuizCoins</span> pour débloquer le Premium.</p>
                  <p className="text-[10px] text-slate-400 mt-1">Joue à des quiz pour accumuler assez de monnaie virtuelle !</p>
                </div>
              )}

              {/* Purchase Button Action */}
              <div className="pt-2">
                {user.isPremium ? (
                  <div className="w-full py-4 bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 text-xs font-black rounded-2xl flex items-center justify-center gap-2">
                    <ShieldCheck className="w-5 h-5 text-emerald-400" />
                    <span>ABONNEMENT PREMIUM ACTIF</span>
                  </div>
                ) : (
                  <button
                    disabled={isBuying || missingCoins > 0}
                    onClick={handlePurchasePremium}
                    className={`w-full py-4 rounded-2xl text-xs font-black tracking-wider uppercase transition-all cursor-pointer flex items-center justify-center gap-2 shadow-lg ${
                      missingCoins > 0
                        ? "bg-slate-800 text-slate-500 border border-white/5 cursor-not-allowed"
                        : "bg-gradient-to-r from-amber-400 to-yellow-500 text-slate-950 hover:from-amber-500 hover:to-yellow-600 shadow-amber-500/20"
                    }`}
                  >
                    {isBuying ? (
                      <span>Activation en cours...</span>
                    ) : (
                      <>
                        <Zap className="w-4 h-4 fill-slate-950" />
                        <span>Débloquer avec {premiumPrice.toLocaleString()} QC</span>
                      </>
                    )}
                  </button>
                )}
              </div>
            </motion.div>
          ) : (
            <motion.div 
              key="premium-celebration"
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              className="text-center py-12 space-y-6"
            >
              {/* Golden sparkles confetti mock animation */}
              <div className="w-24 h-24 rounded-full bg-gradient-to-br from-amber-400 to-yellow-600 flex items-center justify-center mx-auto shadow-2xl shadow-amber-500/30">
                <Crown className="w-12 h-12 text-slate-950 fill-slate-950/10 animate-bounce" />
              </div>

              <div className="space-y-2">
                <h1 className="text-2xl font-black font-display text-amber-400 tracking-tight">FÉLICITATIONS ! 🎉</h1>
                <p className="text-sm text-slate-200 font-bold">Tu es désormais membre Premium de QuizMaster !</p>
                <p className="text-xs text-slate-400 max-w-[280px] mx-auto leading-relaxed">
                  Ton badge a été ajouté à ton profil, et toutes les fonctionnalités et personnalisations exclusives de la boutique te sont désormais accessibles.
                </p>
              </div>

              <div className="pt-4 max-w-[200px] mx-auto">
                <button
                  onClick={onBack}
                  className="w-full py-3 bg-white text-slate-950 hover:bg-slate-100 rounded-xl text-xs font-black tracking-wider uppercase transition-colors cursor-pointer"
                >
                  Continuer
                </button>
              </div>
            </motion.div>
          )}
        </AnimatePresence>

      </div>
    </div>
  );
}
