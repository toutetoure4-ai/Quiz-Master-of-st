import React, { useState } from "react";
import { motion, AnimatePresence } from "motion/react";
import { UserProfile } from "../types";
import { dbService } from "../lib/firebase";
import { 
  X, Check, Camera, User, Sparkles, Upload, Link as LinkIcon, 
  RotateCcw, Shield, CheckCircle2, Crown, Lock
} from "lucide-react";

interface EditProfileModalProps {
  user: UserProfile;
  isOpen: boolean;
  onClose: () => void;
  onUpdateUser: (updatedUser: UserProfile) => void;
  onNavigateToPremium?: () => void;
}

// Standard preset avatars
export const PRESET_AVATARS = [
  { id: "gamer-1", name: "Gamer Pro", url: "https://api.dicebear.com/7.x/avataaars/svg?seed=GamerPro" },
  { id: "gamer-2", name: "Gamer Girl", url: "https://api.dicebear.com/7.x/avataaars/svg?seed=GamerGirl" },
  { id: "ninja", name: "Ninja Shinobi", url: "https://api.dicebear.com/7.x/bottts/svg?seed=Ninja" },
  { id: "robot-1", name: "Cyber Bot", url: "https://api.dicebear.com/7.x/bottts/svg?seed=CyberBot" },
  { id: "robot-2", name: "AI Core", url: "https://api.dicebear.com/7.x/bottts/svg?seed=AICore" },
  { id: "astro", name: "Astronaute", url: "https://api.dicebear.com/7.x/avataaars/svg?seed=Astro" },
  { id: "mage", name: "Sorcier", url: "https://api.dicebear.com/7.x/avataaars/svg?seed=Mage" },
  { id: "hero-1", name: "Héros Pixel", url: "https://api.dicebear.com/7.x/pixel-art/svg?seed=HeroPixel" },
  { id: "hero-2", name: "Légende Cyber", url: "https://api.dicebear.com/7.x/pixel-art/svg?seed=CyberLegend" },
  { id: "cat", name: "Chat Malin", url: "https://api.dicebear.com/7.x/big-ears/svg?seed=SmartCat" },
  { id: "fox", name: "Renard Ruse", url: "https://api.dicebear.com/7.x/big-ears/svg?seed=Fox" },
  { id: "panda", name: "Panda Zen", url: "https://api.dicebear.com/7.x/big-ears/svg?seed=Panda" },
  { id: "prof", name: "Professeur", url: "https://api.dicebear.com/7.x/avataaars/svg?seed=Einstein" },
  { id: "captain", name: "Capitaine", url: "https://api.dicebear.com/7.x/avataaars/svg?seed=Captain" },
  { id: "champion", name: "Champion", url: "https://api.dicebear.com/7.x/avataaars/svg?seed=Champion" },
];

// Super Cool Premium Exclusive Avatars
export const PREMIUM_AVATARS = [
  { id: "prem-dragon", name: "Dragon Cyber", url: "https://api.dicebear.com/7.x/bottts/svg?seed=CyberDragon" },
  { id: "prem-phenix", name: "Phénix de Feu", url: "https://api.dicebear.com/7.x/bottts/svg?seed=FirePhoenix" },
  { id: "prem-goldking", name: "Roi Gold VIP", url: "https://api.dicebear.com/7.x/avataaars/svg?seed=GoldKing" },
  { id: "prem-cybervalk", name: "Néon Valkyrie", url: "https://api.dicebear.com/7.x/avataaars/svg?seed=NeonValkyrie" },
  { id: "prem-samurai", name: "Cyborg Samourai", url: "https://api.dicebear.com/7.x/pixel-art/svg?seed=NeonSamurai" },
  { id: "prem-galaxy", name: "Galaxie Stellaire", url: "https://api.dicebear.com/7.x/bottts/svg?seed=StarlightGalaxy" },
  { id: "prem-shadow", name: "Lord Shadow", url: "https://api.dicebear.com/7.x/pixel-art/svg?seed=LordShadow" },
  { id: "prem-quantum", name: "Quantum Master", url: "https://api.dicebear.com/7.x/avataaars/svg?seed=QuantumMaster" },
];

export default function EditProfileModal({
  user,
  isOpen,
  onClose,
  onUpdateUser,
  onNavigateToPremium
}: EditProfileModalProps) {
  const [pseudo, setPseudo] = useState<string>(user.pseudo || "");
  const [fullName, setFullName] = useState<string>(user.fullName || "");
  const [selectedAvatarUrl, setSelectedAvatarUrl] = useState<string>(user.avatarUrl || PRESET_AVATARS[0].url);
  const [customUrl, setCustomUrl] = useState<string>("");
  const [isUrlInputActive, setIsUrlInputActive] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);
  const [successMsg, setSuccessMsg] = useState<boolean>(false);
  const [premiumLockAlert, setPremiumLockAlert] = useState<boolean>(false);

  if (!isOpen) return null;

  // Combine unlocked shop avatars + default presets
  const userUnlocked = user.unlockedAvatars || [];
  const allAvailableAvatars = [
    ...PRESET_AVATARS,
    ...userUnlocked
      .filter(url => !PRESET_AVATARS.some(p => p.url === url))
      .map((url, idx) => ({ id: `shop-${idx}`, name: `Débloqué ${idx + 1}`, url }))
  ];

  // Image Upload Handler (Converts file to Base64)
  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      if (file.size > 2 * 1024 * 1024) { // 2MB limit
        setError("L'image est trop lourde (max 2 Mo).");
        return;
      }
      const reader = new FileReader();
      reader.onloadend = () => {
        if (reader.result) {
          setSelectedAvatarUrl(reader.result as string);
          setError(null);
        }
      };
      reader.readAsDataURL(file);
    }
  };

  const handleApplyCustomUrl = () => {
    if (!customUrl.trim()) return;
    setSelectedAvatarUrl(customUrl.trim());
    setIsUrlInputActive(false);
    setError(null);
  };

  const handleSave = async () => {
    const cleanPseudo = pseudo.trim().replace(/^@/, "");
    const cleanName = fullName.trim();

    if (!cleanPseudo) {
      setError("Le pseudo ne peut pas être vide.");
      return;
    }

    if (cleanPseudo.length < 3) {
      setError("Le pseudo doit contenir au moins 3 caractères.");
      return;
    }

    const updatedUser: UserProfile = {
      ...user,
      pseudo: cleanPseudo,
      fullName: cleanName || cleanPseudo,
      avatarUrl: selectedAvatarUrl,
      unlockedAvatars: user.unlockedAvatars?.includes(selectedAvatarUrl)
        ? user.unlockedAvatars
        : [...(user.unlockedAvatars || []), selectedAvatarUrl]
    };

    try {
      // Save in Firebase / LocalStorage DB
      await dbService.saveUserProfile(updatedUser);
      onUpdateUser(updatedUser);
      setSuccessMsg(true);
      
      setTimeout(() => {
        setSuccessMsg(false);
        onClose();
      }, 700);
    } catch (err) {
      console.error(err);
      setError("Erreur lors de la sauvegarde du profil.");
    }
  };

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/70 backdrop-blur-sm">
        <motion.div
          initial={{ scale: 0.9, opacity: 0, y: 20 }}
          animate={{ scale: 1, opacity: 1, y: 0 }}
          exit={{ scale: 0.9, opacity: 0, y: 20 }}
          className="bg-white dark:bg-slate-900 border border-slate-100 dark:border-slate-800 rounded-3xl p-6 w-full max-w-md max-h-[90vh] overflow-y-auto shadow-2xl flex flex-col space-y-5"
        >
          
          {/* Header */}
          <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800/80 pb-3">
            <div className="flex items-center gap-2">
              <div className="p-2 bg-indigo-50 dark:bg-indigo-950/40 text-indigo-500 rounded-xl">
                <User className="w-5 h-5" />
              </div>
              <div>
                <h3 className="text-base font-black font-display text-slate-900 dark:text-white">
                  Changer de Pseudo & Avatar
                </h3>
                <p className="text-[11px] font-medium text-slate-400">
                  Personnalise ton apparence sur QuizMaster
                </p>
              </div>
            </div>

            <button
              onClick={onClose}
              className="p-2 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 rounded-xl hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors cursor-pointer"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          {/* Success Banner */}
          {successMsg && (
            <motion.div
              initial={{ opacity: 0, y: -10 }}
              animate={{ opacity: 1, y: 0 }}
              className="p-3 bg-emerald-500/10 border border-emerald-500/30 rounded-2xl text-emerald-600 dark:text-emerald-400 text-xs font-bold flex items-center gap-2"
            >
              <CheckCircle2 className="w-4 h-4 shrink-0" />
              <span>Profil mis à jour avec succès !</span>
            </motion.div>
          )}

          {/* Error Banner */}
          {error && (
            <div className="p-3 bg-red-500/10 border border-red-500/30 rounded-2xl text-red-500 text-xs font-semibold flex items-center justify-between">
              <span>{error}</span>
              <button onClick={() => setError(null)} className="text-[10px] font-bold underline">OK</button>
            </div>
          )}

          {/* Live Preview Card */}
          <div className="flex flex-col items-center justify-center p-4 rounded-2xl bg-slate-50 dark:bg-slate-800/50 border border-slate-100 dark:border-slate-800 relative">
            <div className="relative group">
              <img
                src={selectedAvatarUrl}
                alt="Selected Avatar Preview"
                className="w-20 h-20 rounded-2xl bg-white dark:bg-slate-900 border-2 border-indigo-500 shadow-md object-cover"
              />
              <div className="absolute -bottom-1 -right-1 bg-indigo-500 text-white p-1 rounded-full shadow">
                <Sparkles className="w-3.5 h-3.5" />
              </div>
            </div>

            <h4 className="text-sm font-black text-slate-900 dark:text-white mt-2.5">
              {fullName || pseudo || "Joueur"}
            </h4>
            <span className="text-xs font-bold text-indigo-500 dark:text-indigo-400">
              @{pseudo || "pseudo"}
            </span>
          </div>

          {/* Form Fields: Pseudo & Name */}
          <div className="space-y-3">
            <div>
              <label className="text-[11px] font-black text-slate-400 uppercase tracking-wider block mb-1">
                Pseudo (Nom d'utilisateur)
              </label>
              <div className="relative">
                <span className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400 font-bold text-xs">
                  @
                </span>
                <input
                  type="text"
                  value={pseudo}
                  onChange={(e) => setPseudo(e.target.value.replace(/\s+/g, "_"))}
                  placeholder="ton_pseudo"
                  maxLength={20}
                  className="w-full pl-8 pr-4 py-2.5 bg-slate-50 dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700/80 rounded-xl text-xs font-bold text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-indigo-500/50"
                />
              </div>
            </div>

            <div>
              <label className="text-[11px] font-black text-slate-400 uppercase tracking-wider block mb-1">
                Nom complet / Titre d'affichage
              </label>
              <input
                type="text"
                value={fullName}
                onChange={(e) => setFullName(e.target.value)}
                placeholder="Ex: Alex Dupont"
                maxLength={30}
                className="w-full px-3.5 py-2.5 bg-slate-50 dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700/80 rounded-xl text-xs font-bold text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-indigo-500/50"
              />
            </div>
          </div>

          {/* Avatar Gallery Section */}
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-[11px] font-black text-slate-400 uppercase tracking-wider">
                Choisir un Avatar
              </span>

              {/* Upload photo or custom URL actions */}
              <div className="flex items-center gap-2">
                {/* Image File Upload */}
                <label className="px-2.5 py-1 bg-indigo-50 dark:bg-indigo-950/40 hover:bg-indigo-100 text-indigo-600 dark:text-indigo-300 rounded-lg text-[10px] font-bold flex items-center gap-1 cursor-pointer transition-colors">
                  <Upload className="w-3 h-3" />
                  <span>Importer photo</span>
                  <input
                    type="file"
                    accept="image/*"
                    onChange={handleFileUpload}
                    className="hidden"
                  />
                </label>

                {/* Custom URL */}
                <button
                  type="button"
                  onClick={() => setIsUrlInputActive(!isUrlInputActive)}
                  className="px-2.5 py-1 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 text-slate-600 dark:text-slate-300 rounded-lg text-[10px] font-bold flex items-center gap-1 cursor-pointer transition-colors"
                >
                  <LinkIcon className="w-3 h-3" />
                  <span>Lien URL</span>
                </button>
              </div>
            </div>

            {/* Custom URL Input Field */}
            {isUrlInputActive && (
              <div className="flex gap-2">
                <input
                  type="text"
                  value={customUrl}
                  onChange={(e) => setCustomUrl(e.target.value)}
                  placeholder="https://exemple.com/mon-image.jpg"
                  className="flex-1 px-3 py-1.5 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-xs text-slate-900 dark:text-white focus:outline-none"
                />
                <button
                  type="button"
                  onClick={handleApplyCustomUrl}
                  className="px-3 py-1.5 bg-indigo-500 text-white rounded-xl text-xs font-bold cursor-pointer"
                >
                  Appliquer
                </button>
              </div>
            )}

            {/* Standard Avatars Grid */}
            <div className="grid grid-cols-5 gap-2.5 max-h-36 overflow-y-auto p-1 scrollbar-thin">
              {allAvailableAvatars.map((item) => {
                const isSelected = selectedAvatarUrl === item.url;
                return (
                  <button
                    key={item.id}
                    type="button"
                    onClick={() => setSelectedAvatarUrl(item.url)}
                    className={`relative p-1 rounded-2xl border transition-all cursor-pointer aspect-square flex items-center justify-center group ${
                      isSelected
                        ? "border-indigo-500 ring-2 ring-indigo-500/30 bg-indigo-500/10 scale-105"
                        : "border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-800/40 hover:border-indigo-300"
                    }`}
                  >
                    <img
                      src={item.url}
                      alt={item.name}
                      className="w-full h-full rounded-xl object-cover"
                    />
                    {isSelected && (
                      <div className="absolute top-0 right-0 -mr-1 -mt-1 bg-indigo-500 text-white p-0.5 rounded-full shadow">
                        <Check className="w-3 h-3" />
                      </div>
                    )}
                  </button>
                );
              })}
            </div>

            {/* Premium Super Cool Avatars Section */}
            <div className="pt-2 space-y-2 border-t border-slate-100 dark:border-slate-800">
              <div className="flex items-center justify-between">
                <span className="text-[11px] font-black uppercase tracking-wider text-amber-500 flex items-center gap-1">
                  <Crown className="w-3.5 h-3.5 fill-amber-500" />
                  Avatars VIP Super Cool (Premium 👑)
                </span>
                {!user.isPremium && (
                  <span className="text-[10px] font-bold text-amber-600 bg-amber-50 dark:bg-amber-950/40 px-2 py-0.5 rounded-full border border-amber-500/30 flex items-center gap-1">
                    <Lock className="w-2.5 h-2.5" />
                    Vérouillé
                  </span>
                )}
              </div>

              <div className="grid grid-cols-4 gap-2 max-h-32 overflow-y-auto p-1">
                {PREMIUM_AVATARS.map((item) => {
                  const isSelected = selectedAvatarUrl === item.url;
                  const canUse = user.isPremium;

                  return (
                    <button
                      key={item.id}
                      type="button"
                      onClick={() => {
                        if (canUse) {
                          setSelectedAvatarUrl(item.url);
                          setError(null);
                        } else {
                          setPremiumLockAlert(true);
                        }
                      }}
                      className={`relative p-1 rounded-2xl border transition-all cursor-pointer aspect-square flex items-center justify-center group ${
                        isSelected
                          ? "border-amber-500 ring-2 ring-amber-500/30 bg-amber-500/10 scale-105"
                          : "border-amber-200 dark:border-amber-900/40 bg-amber-50/50 dark:bg-amber-950/20 hover:border-amber-400"
                      }`}
                    >
                      <img
                        src={item.url}
                        alt={item.name}
                        className={`w-full h-full rounded-xl object-cover ${!canUse ? "opacity-60 grayscale-[40%]" : ""}`}
                      />
                      
                      {!canUse ? (
                        <div className="absolute inset-0 bg-slate-950/40 rounded-2xl flex items-center justify-center">
                          <Lock className="w-4 h-4 text-amber-300 drop-shadow" />
                        </div>
                      ) : isSelected ? (
                        <div className="absolute top-0 right-0 -mr-1 -mt-1 bg-amber-500 text-slate-950 p-0.5 rounded-full shadow font-bold">
                          <Check className="w-3 h-3" />
                        </div>
                      ) : null}
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Premium Lock Modal Prompt */}
            {premiumLockAlert && (
              <motion.div
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                className="p-3 bg-gradient-to-r from-amber-500/15 via-orange-500/15 to-yellow-500/15 border border-amber-500/30 rounded-2xl flex flex-col space-y-2 text-center"
              >
                <div className="flex items-center justify-center gap-1.5 text-amber-600 dark:text-amber-400 font-extrabold text-xs">
                  <Crown className="w-4 h-4 fill-amber-400" />
                  <span>Avatar Réservé aux Membres Premium 👑</span>
                </div>
                <p className="text-[11px] text-slate-600 dark:text-slate-300 font-medium">
                  Les avatars VIP super cool sont réservés aux abonnés Premium !
                </p>
                <div className="flex items-center gap-2 pt-1">
                  <button
                    type="button"
                    onClick={() => setPremiumLockAlert(false)}
                    className="flex-1 py-1.5 bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 rounded-xl text-[10px] font-bold"
                  >
                    Fermer
                  </button>
                  {onNavigateToPremium && (
                    <button
                      type="button"
                      onClick={() => {
                        setPremiumLockAlert(false);
                        onClose();
                        onNavigateToPremium();
                      }}
                      className="flex-1 py-1.5 bg-gradient-to-r from-amber-500 to-orange-500 text-slate-950 font-black rounded-xl text-[10px] shadow-sm flex items-center justify-center gap-1"
                    >
                      <Crown className="w-3 h-3 fill-slate-950" />
                      Devenir Premium
                    </button>
                  )}
                </div>
              </motion.div>
            )}
          </div>

          {/* Modal Actions */}
          <div className="flex items-center gap-3 pt-2">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 py-3 bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 rounded-2xl text-xs font-bold transition-all cursor-pointer"
            >
              Annuler
            </button>
            <button
              type="button"
              onClick={handleSave}
              className="flex-1 py-3 bg-indigo-500 hover:bg-indigo-600 text-white rounded-2xl text-xs font-black shadow-lg shadow-indigo-500/20 transition-all cursor-pointer active:scale-98 flex items-center justify-center gap-1.5"
            >
              <Check className="w-4 h-4" />
              Enregistrer
            </button>
          </div>

        </motion.div>
      </div>
    </AnimatePresence>
  );
}
