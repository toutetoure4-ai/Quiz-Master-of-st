import React, { useState, useEffect } from "react";
import { motion, AnimatePresence } from "motion/react";
import { UserProfile, Transaction } from "../types";
import { dbService } from "../lib/firebase";
import { ArrowLeft, Users, Settings, ScrollText, Coins, Plus, Minus, Check, AlertCircle, RefreshCw, Star } from "lucide-react";

interface AdminPanelProps {
  user: UserProfile;
  onBack: () => void;
  onUpdateUser: (user: UserProfile) => void;
}

interface AdminSettings {
  facile: number;
  moyen: number;
  difficile: number;
  expert: number;
  premiumPrice: number;
}

export default function AdminPanel({ user, onBack, onUpdateUser }: AdminPanelProps) {
  const [activeTab, setActiveTab] = useState<"players" | "economy" | "transactions">("players");
  const [players, setPlayers] = useState<any[]>([]);
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [economy, setEconomy] = useState<AdminSettings>({
    facile: 50,
    moyen: 100,
    difficile: 500,
    expert: 1000,
    premiumPrice: 5000
  });

  const [loading, setLoading] = useState<boolean>(false);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  // Form states for manual credit adjustment
  const [selectedPlayerUid, setSelectedPlayerUid] = useState<string>("");
  const [adjustAmount, setAdjustAmount] = useState<number>(500);
  const [adjustReason, setAdjustReason] = useState<string>("Récompense administrative ⚙️");

  useEffect(() => {
    fetchAdminData();
  }, [activeTab]);

  const fetchAdminData = async () => {
    setLoading(true);
    setSuccessMsg(null);
    setErrorMsg(null);
    try {
      if (activeTab === "players") {
        // Fetch server players list
        const res = await fetch("/api/admin/players");
        if (res.ok) {
          const list = await res.json();
          setPlayers(list);
          if (list.length > 0 && !selectedPlayerUid) {
            setSelectedPlayerUid(list[0].uid);
          }
        } else {
          // Fallback to local
          const mockUser = await dbService.getUserProfile(user.uid);
          setPlayers(mockUser ? [mockUser] : []);
          setSelectedPlayerUid(user.uid);
        }
      } else if (activeTab === "economy") {
        // Fetch server economy settings
        const res = await fetch("/api/admin/settings");
        if (res.ok) {
          const settings = await res.json();
          setEconomy(settings);
        } else {
          const localSettings = await dbService.getAdminSettings();
          setEconomy(localSettings);
        }
      } else if (activeTab === "transactions") {
        // Fetch all transaction logs
        const res = await fetch("/api/admin/transactions");
        if (res.ok) {
          const list = await res.json();
          setTransactions(list);
        } else {
          const list = await dbService.getTransactions(user.uid);
          setTransactions(list);
        }
      }
    } catch (err: any) {
      console.error(err);
      setErrorMsg("Échec de la récupération des données.");
    } finally {
      setLoading(false);
    }
  };

  const handleModifyCoins = async (isAdding: boolean) => {
    if (!selectedPlayerUid || adjustAmount <= 0) {
      setErrorMsg("Veuillez sélectionner un joueur et un montant valide.");
      return;
    }

    setLoading(true);
    setSuccessMsg(null);
    setErrorMsg(null);

    try {
      // 1. Post to Server
      const res = await fetch("/api/admin/modify-coins", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          uid: selectedPlayerUid,
          amount: adjustAmount,
          isAdding,
          raison: adjustReason
        })
      });

      if (!res.ok) {
        const errData = await res.json();
        throw new Error(errData.error || "Échec de l'ajustement serveur.");
      }

      // 2. Adjust Local database for offline synchronization consistency
      const result = await dbService.modifyPlayerCoinsManually(selectedPlayerUid, adjustAmount, isAdding, adjustReason);
      if (result.success) {
        // If modifying current user, notify parent
        if (selectedPlayerUid === user.uid && result.profile) {
          onUpdateUser(result.profile);
        }
        setSuccessMsg(`Solde ajusté avec succès : ${isAdding ? "+" : "-"}${adjustAmount} QuizCoins.`);
        fetchAdminData(); // Refresh players
      } else {
        throw new Error(result.error || "Erreur d'ajustement local.");
      }
    } catch (err: any) {
      setErrorMsg(err.message || "Erreur lors de l'ajustement.");
    } finally {
      setLoading(false);
    }
  };

  const handleSaveEconomy = async () => {
    setLoading(true);
    setSuccessMsg(null);
    setErrorMsg(null);

    try {
      // 1. Post to server
      const res = await fetch("/api/admin/settings", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(economy)
      });

      if (!res.ok) {
        throw new Error("Échec de la sauvegarde sur le serveur.");
      }

      // 2. Save locally
      await dbService.updateAdminSettings(economy);
      setSuccessMsg("Paramètres de l'économie sauvegardés avec succès !");
    } catch (err: any) {
      setErrorMsg(err.message || "Impossible de sauvegarder.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex-1 flex flex-col h-full bg-slate-50 dark:bg-slate-950 overflow-hidden">
      
      {/* Header bar */}
      <div className="px-5 py-4 border-b border-slate-100 dark:border-slate-900 bg-white dark:bg-slate-900/60 backdrop-blur-md flex items-center justify-between shrink-0">
        <div className="flex items-center gap-3">
          <button 
            onClick={onBack}
            className="p-1.5 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-xl cursor-pointer text-slate-500 hover:text-slate-800 dark:text-slate-400 dark:hover:text-white transition-colors"
          >
            <ArrowLeft className="w-5 h-5" />
          </button>
          <div>
            <h2 className="text-base font-black text-slate-950 dark:text-white">Panneau d'Administration</h2>
            <p className="text-[10px] text-red-500 font-black uppercase tracking-wider">Supervision de l'économie</p>
          </div>
        </div>

        {/* Refresh button */}
        <button 
          onClick={fetchAdminData}
          disabled={loading}
          className="p-2 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-xl cursor-pointer text-slate-400 hover:text-slate-600 dark:hover:text-white"
        >
          <RefreshCw className={`w-4 h-4 ${loading ? "animate-spin" : ""}`} />
        </button>
      </div>

      {/* Admin category navigation */}
      <div className="px-5 py-3 bg-white dark:bg-slate-900/30 border-b border-slate-100 dark:border-slate-900/40 flex gap-2 shrink-0 select-none">
        {[
          { id: "players", label: "Ajustements Joueurs", icon: Users },
          { id: "economy", label: "Réglages de l'Économie", icon: Settings },
          { id: "transactions", label: "Journal de Transactions", icon: ScrollText }
        ].map(tab => {
          const Icon = tab.icon;
          const isSel = activeTab === tab.id;
          return (
            <button
              key={tab.id}
              onClick={() => {
                setActiveTab(tab.id as any);
              }}
              className={`flex-1 flex items-center justify-center gap-1.5 py-2.5 rounded-xl border text-xs font-bold transition-all cursor-pointer ${
                isSel
                  ? "bg-slate-950 text-white dark:bg-white dark:text-slate-950 border-transparent shadow-md"
                  : "bg-white dark:bg-slate-900 border-slate-100 dark:border-slate-800 text-slate-500 hover:bg-slate-50 dark:text-slate-400 dark:hover:bg-slate-800"
              }`}
            >
              <Icon className="w-3.5 h-3.5" />
              <span className="hidden sm:inline">{tab.label}</span>
            </button>
          );
        })}
      </div>

      {/* Message banners */}
      <AnimatePresence>
        {successMsg && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: "auto", opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            className="px-5 py-2.5 text-xs font-semibold bg-emerald-500 text-white text-center shrink-0 flex items-center justify-center gap-1.5"
          >
            <Check className="w-4 h-4 shrink-0" />
            <span>{successMsg}</span>
          </motion.div>
        )}
        {errorMsg && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: "auto", opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            className="px-5 py-2.5 text-xs font-semibold bg-red-500 text-white text-center shrink-0 flex items-center justify-center gap-1.5"
          >
            <AlertCircle className="w-4 h-4 shrink-0" />
            <span>{errorMsg}</span>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Dynamic Tab Body */}
      <div className="flex-1 overflow-y-auto p-5 space-y-5">
        
        {/* TAB 1: PLAYERS COINS ADJUSTMENT */}
        {activeTab === "players" && (
          <div className="space-y-5">
            <div className="bg-white dark:bg-slate-900 rounded-3xl border border-slate-100 dark:border-slate-800/60 p-5 space-y-4 shadow-sm">
              <h3 className="text-xs font-black text-slate-900 dark:text-white uppercase tracking-wider flex items-center gap-2">
                <Users className="w-4 h-4 text-blue-500" />
                Ajuster le solde d'un joueur
              </h3>

              <div className="space-y-3">
                {/* Selector */}
                <div>
                  <label className="text-[10px] font-black uppercase text-slate-400">Sélectionner un Joueur</label>
                  <select
                    value={selectedPlayerUid}
                    onChange={e => setSelectedPlayerUid(e.target.value)}
                    className="w-full mt-1 px-4 py-2.5 bg-slate-50 dark:bg-slate-950 border border-slate-100 dark:border-slate-800 rounded-xl text-xs font-bold text-slate-850 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                  >
                    {players.map(p => (
                      <option key={p.uid} value={p.uid}>
                        {p.pseudo} (Solde: {p.quizCoins ?? 0} QC - {p.isPremium ? "⭐ Premium" : "Standard"})
                      </option>
                    ))}
                  </select>
                </div>

                {/* Amount input */}
                <div>
                  <label className="text-[10px] font-black uppercase text-slate-400">Montant (QuizCoins)</label>
                  <input
                    type="number"
                    value={adjustAmount}
                    onChange={e => setAdjustAmount(Math.max(1, parseInt(e.target.value) || 0))}
                    className="w-full mt-1 px-4 py-2.5 bg-slate-50 dark:bg-slate-950 border border-slate-100 dark:border-slate-800 rounded-xl text-xs font-black font-mono text-slate-850 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>

                {/* Reason input */}
                <div>
                  <label className="text-[10px] font-black uppercase text-slate-400">Raison de l'Ajustement</label>
                  <input
                    type="text"
                    value={adjustReason}
                    onChange={e => setAdjustReason(e.target.value)}
                    className="w-full mt-1 px-4 py-2.5 bg-slate-50 dark:bg-slate-950 border border-slate-100 dark:border-slate-800 rounded-xl text-xs font-bold text-slate-850 dark:text-white focus:outline-none"
                    placeholder="Raison ou motif"
                  />
                </div>
              </div>

              {/* Add / Deduct buttons */}
              <div className="flex gap-4 pt-2">
                <button
                  disabled={loading}
                  onClick={() => handleModifyCoins(true)}
                  className="flex-1 py-3 bg-emerald-500 hover:bg-emerald-600 text-white font-black text-xs rounded-xl flex items-center justify-center gap-1.5 transition-colors cursor-pointer"
                >
                  <Plus className="w-4 h-4" />
                  <span>Créditer (Ajouter)</span>
                </button>
                <button
                  disabled={loading}
                  onClick={() => handleModifyCoins(false)}
                  className="flex-1 py-3 bg-red-500 hover:bg-red-600 text-white font-black text-xs rounded-xl flex items-center justify-center gap-1.5 transition-colors cursor-pointer"
                >
                  <Minus className="w-4 h-4" />
                  <span>Débiter (Retirer)</span>
                </button>
              </div>
            </div>

            {/* Players List Table */}
            <div className="bg-white dark:bg-slate-900 rounded-3xl border border-slate-100 dark:border-slate-800/60 p-5 shadow-sm space-y-3">
              <h3 className="text-xs font-black text-slate-900 dark:text-white uppercase tracking-wider">Base des Joueurs</h3>
              
              <div className="space-y-3.5">
                {players.map(p => (
                  <div key={p.uid} className="flex items-center justify-between p-3 bg-slate-50 dark:bg-slate-950 rounded-2xl border border-slate-100/60 dark:border-slate-850">
                    <div className="flex items-center gap-3">
                      <div className="relative">
                        <img src={p.avatarUrl} alt={p.pseudo} className={`w-10 h-10 rounded-xl bg-white p-0.5 border ${p.activeFrame || "border-slate-100"}`} />
                        {p.isPremium && (
                          <span className="absolute -top-1.5 -right-1.5 bg-amber-400 text-amber-950 p-0.5 rounded-full ring-2 ring-white dark:ring-slate-950">
                            <Star className="w-2.5 h-2.5 fill-amber-500 text-amber-950" />
                          </span>
                        )}
                      </div>
                      <div>
                        <h4 className="text-xs font-extrabold text-slate-900 dark:text-white">{p.pseudo}</h4>
                        <p className="text-[10px] text-slate-400 font-bold">Niveau {p.level || 1} • {p.country || "France"}</p>
                      </div>
                    </div>
                    <div className="text-right">
                      <div className="flex items-center gap-1 bg-amber-500/10 border border-amber-500/25 px-2.5 py-1 rounded-full">
                        <Coins className="w-3.5 h-3.5 text-amber-500" />
                        <span className="text-[11px] font-black font-mono text-amber-600 dark:text-amber-400">
                          {(p.quizCoins ?? 0).toLocaleString()}
                        </span>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* TAB 2: ECONOMIC SETTINGS */}
        {activeTab === "economy" && (
          <div className="bg-white dark:bg-slate-900 rounded-3xl border border-slate-100 dark:border-slate-800/60 p-5 space-y-5 shadow-sm">
            <div className="flex items-center justify-between border-b border-slate-50 dark:border-slate-850 pb-3">
              <h3 className="text-xs font-black text-slate-900 dark:text-white uppercase tracking-wider flex items-center gap-2">
                <Settings className="w-4 h-4 text-purple-500" />
                Paramétrer les gains de QuizCoins
              </h3>
            </div>

            <div className="space-y-4">
              {/* Easy difficulty */}
              <div>
                <label className="text-[10px] font-black uppercase text-slate-400 flex justify-between">
                  <span>Difficulté : Facile</span>
                  <span className="text-emerald-500 font-bold">Défaut: +50 QC</span>
                </label>
                <input
                  type="number"
                  value={economy.facile}
                  onChange={e => setEconomy({ ...economy, facile: Math.max(0, parseInt(e.target.value) || 0) })}
                  className="w-full mt-1.5 px-4 py-2.5 bg-slate-50 dark:bg-slate-950 border border-slate-100 dark:border-slate-800 rounded-xl text-xs font-black font-mono text-slate-850 dark:text-white focus:outline-none"
                />
              </div>

              {/* Medium difficulty */}
              <div>
                <label className="text-[10px] font-black uppercase text-slate-400 flex justify-between">
                  <span>Difficulté : Moyen</span>
                  <span className="text-emerald-500 font-bold">Défaut: +100 QC</span>
                </label>
                <input
                  type="number"
                  value={economy.moyen}
                  onChange={e => setEconomy({ ...economy, moyen: Math.max(0, parseInt(e.target.value) || 0) })}
                  className="w-full mt-1.5 px-4 py-2.5 bg-slate-50 dark:bg-slate-950 border border-slate-100 dark:border-slate-800 rounded-xl text-xs font-black font-mono text-slate-850 dark:text-white focus:outline-none"
                />
              </div>

              {/* Hard difficulty */}
              <div>
                <label className="text-[10px] font-black uppercase text-slate-400 flex justify-between">
                  <span>Difficulté : Difficile</span>
                  <span className="text-emerald-500 font-bold">Défaut: +500 QC</span>
                </label>
                <input
                  type="number"
                  value={economy.difficile}
                  onChange={e => setEconomy({ ...economy, difficile: Math.max(0, parseInt(e.target.value) || 0) })}
                  className="w-full mt-1.5 px-4 py-2.5 bg-slate-50 dark:bg-slate-950 border border-slate-100 dark:border-slate-800 rounded-xl text-xs font-black font-mono text-slate-850 dark:text-white focus:outline-none"
                />
              </div>

              {/* Expert difficulty */}
              <div>
                <label className="text-[10px] font-black uppercase text-slate-400 flex justify-between">
                  <span>Difficulté : Expert (Personnalisable)</span>
                  <span className="text-emerald-500 font-bold">Défaut: +1000 QC</span>
                </label>
                <input
                  type="number"
                  value={economy.expert}
                  onChange={e => setEconomy({ ...economy, expert: Math.max(0, parseInt(e.target.value) || 0) })}
                  className="w-full mt-1.5 px-4 py-2.5 bg-slate-50 dark:bg-slate-950 border border-slate-100 dark:border-slate-800 rounded-xl text-xs font-black font-mono text-slate-850 dark:text-white focus:outline-none"
                />
              </div>

              {/* Premium price */}
              <div>
                <label className="text-[10px] font-black uppercase text-slate-400 flex justify-between">
                  <span>Prix de l'abonnement Premium</span>
                  <span className="text-purple-500 font-bold">Défaut: 5000 QC</span>
                </label>
                <input
                  type="number"
                  value={economy.premiumPrice}
                  onChange={e => setEconomy({ ...economy, premiumPrice: Math.max(100, parseInt(e.target.value) || 0) })}
                  className="w-full mt-1.5 px-4 py-2.5 bg-slate-50 dark:bg-slate-950 border border-slate-100 dark:border-slate-800 rounded-xl text-xs font-black font-mono text-slate-850 dark:text-white focus:outline-none"
                />
              </div>
            </div>

            <button
              disabled={loading}
              onClick={handleSaveEconomy}
              className="w-full py-3 bg-blue-500 hover:bg-blue-600 text-white text-xs font-black rounded-xl tracking-wider uppercase transition-colors cursor-pointer"
            >
              Enregistrer les Réglages
            </button>
          </div>
        )}

        {/* TAB 3: MASTER TRANSACTION LEDGER */}
        {activeTab === "transactions" && (
          <div className="bg-white dark:bg-slate-900 rounded-3xl border border-slate-100 dark:border-slate-800/60 p-5 space-y-4 shadow-sm">
            <h3 className="text-xs font-black text-slate-900 dark:text-white uppercase tracking-wider flex items-center gap-2">
              <ScrollText className="w-4 h-4 text-amber-500" />
              Historique Global des Transactions
            </h3>

            {transactions.length === 0 ? (
              <div className="text-center py-8 text-xs text-slate-400">
                Aucune transaction enregistrée pour l'instant.
              </div>
            ) : (
              <div className="space-y-3">
                {transactions.map(tx => {
                  const isGain = tx.type === "gain";
                  return (
                    <div 
                      key={tx.id} 
                      className="p-3 bg-slate-50 dark:bg-slate-950 border border-slate-100/70 dark:border-slate-850 rounded-2xl flex items-center justify-between"
                    >
                      <div>
                        <span className="text-[8px] font-mono text-slate-400">{tx.id}</span>
                        <h4 className="text-xs font-extrabold text-slate-900 dark:text-white mt-0.5">{tx.raison}</h4>
                        <p className="text-[9px] text-slate-400 mt-0.5">
                          Date : {new Date(tx.date).toLocaleString()}
                        </p>
                      </div>

                      <div className="text-right">
                        <span className={`text-xs font-black font-mono ${isGain ? "text-emerald-500" : "text-red-500"}`}>
                          {isGain ? "+" : "-"}{tx.montant} QC
                        </span>
                        <p className="text-[8px] font-bold uppercase text-slate-400 mt-1">
                          {isGain ? "CRÉDIT" : "DÉBIT"}
                        </p>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        )}

      </div>
    </div>
  );
}
