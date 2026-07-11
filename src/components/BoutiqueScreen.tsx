import React, { useState, useEffect } from "react";
import { motion, AnimatePresence } from "motion/react";
import { UserProfile, ShopItem } from "../types";
import { dbService, DEFAULT_SHOP_ITEMS } from "../lib/firebase";
import { ArrowLeft, Coins, Check, Sparkles, Shirt, Shield, Palette, Eye, ShoppingBag } from "lucide-react";

interface BoutiqueScreenProps {
  user: UserProfile;
  onBack: () => void;
  onUpdateUser: (user: UserProfile) => void;
}

export default function BoutiqueScreen({ user, onBack, onUpdateUser }: BoutiqueScreenProps) {
  const [shopItems, setShopItems] = useState<ShopItem[]>(DEFAULT_SHOP_ITEMS);
  const [activeCategory, setActiveCategory] = useState<string>("all");
  const [loadingItemId, setLoadingItemId] = useState<string | null>(null);
  const [message, setMessage] = useState<{ type: "success" | "error"; text: string } | null>(null);
  const [showPreviewItem, setShowPreviewItem] = useState<ShopItem | null>(null);

  useEffect(() => {
    // Sync with DB
    dbService.getShopItems().then(items => {
      if (items && items.length > 0) {
        setShopItems(items);
      }
    });
  }, []);

  const coins = user.quizCoins ?? 1000;

  const getRarityColor = (rarity: string) => {
    switch (rarity) {
      case "legendaire":
        return "from-amber-400 to-yellow-600 text-amber-950 font-black ring-amber-300";
      case "rare":
        return "from-purple-500 to-indigo-600 text-white font-bold ring-purple-300";
      default:
        return "from-emerald-500 to-teal-600 text-white font-semibold ring-emerald-300";
    }
  };

  const getRarityLabel = (rarity: string) => {
    switch (rarity) {
      case "legendaire": return "LÉGENDAIRE";
      case "rare": return "RARE";
      default: return "NORMAL";
    }
  };

  // Check if user has unlocked the item
  const isUnlocked = (item: ShopItem) => {
    if (item.type === "avatar") {
      return (user.unlockedAvatars || []).includes(item.value);
    } else if (item.type === "frame") {
      return (user.unlockedFrames || []).includes(item.id);
    } else if (item.type === "theme") {
      return (user.unlockedThemes || []).includes(item.id);
    } else if (item.type === "badge") {
      return (user.unlockedBadges || []).includes(item.id);
    }
    return false;
  };

  // Check if item is equipped
  const isEquipped = (item: ShopItem) => {
    if (item.type === "avatar") {
      return user.avatarUrl === item.value;
    } else if (item.type === "frame") {
      return user.activeFrame === item.id;
    } else if (item.type === "theme") {
      return user.activeTheme === item.id;
    }
    return false;
  };

  const handleBuyItem = async (item: ShopItem) => {
    setLoadingItemId(item.id);
    setMessage(null);

    try {
      // 1. Sync to Server first for security validation
      const response = await fetch("/api/shop/buy", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          uid: user.uid,
          itemId: item.id,
          itemPrice: item.price,
          itemName: item.name
        })
      });

      if (!response.ok) {
        const errData = await response.json();
        throw new Error(errData.error || "Échec de la validation serveur.");
      }

      // 2. Complete purchase in local state database
      const result = await dbService.buyShopItem(user.uid, item.id);
      if (result.success && result.profile) {
        onUpdateUser(result.profile);
        setMessage({ type: "success", text: `Félicitations ! Tu as acheté et équipé "${item.name}" ! 🎉` });
      } else {
        throw new Error(result.error || "Erreur lors de l'achat local.");
      }
    } catch (err: any) {
      setMessage({ type: "error", text: err.message || "Une erreur est survenue." });
    } finally {
      setLoadingItemId(null);
    }
  };

  const handleEquipItem = async (item: ShopItem) => {
    setLoadingItemId(item.id);
    let updated = { ...user };

    if (item.type === "avatar") {
      updated.avatarUrl = item.value;
    } else if (item.type === "frame") {
      updated.activeFrame = user.activeFrame === item.id ? "" : item.id; // Toggle
    } else if (item.type === "theme") {
      updated.activeTheme = user.activeTheme === item.id ? "" : item.id; // Toggle
    }

    try {
      await dbService.saveUserProfile(updated);
      onUpdateUser(updated);
      setMessage({ type: "success", text: `Équipé : "${item.name}"` });
    } catch (err) {
      setMessage({ type: "error", text: "Impossible d'équiper l'objet." });
    } finally {
      setLoadingItemId(null);
    }
  };

  const filteredItems = shopItems.filter(item => {
    if (activeCategory === "all") return true;
    return item.type === activeCategory;
  });

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
            <h2 className="text-base font-black text-slate-950 dark:text-white">Boutique QuizMaster</h2>
            <p className="text-[10px] text-slate-400 font-bold uppercase tracking-wider">Personnalise ton profil</p>
          </div>
        </div>

        {/* Portefeuille (Wallet) */}
        <div className="flex items-center gap-1.5 bg-amber-500/10 border border-amber-500/20 px-3 py-1.5 rounded-full select-none">
          <Coins className="w-4 h-4 text-amber-500 fill-amber-500/10 animate-bounce" />
          <span className="text-xs font-black font-mono text-amber-600 dark:text-amber-400">
            {coins.toLocaleString()} QC
          </span>
        </div>
      </div>

      {/* Main categories navigation */}
      <div className="px-5 py-3 bg-white dark:bg-slate-900/30 border-b border-slate-100 dark:border-slate-900/40 flex gap-2 overflow-x-auto shrink-0 select-none scrollbar-none">
        {[
          { id: "all", label: "Tout", icon: ShoppingBag },
          { id: "avatar", label: "Avatars", icon: Shirt },
          { id: "frame", label: "Cadres", icon: Shield },
          { id: "theme", label: "Thèmes", icon: Palette },
          { id: "badge", label: "Badges", icon: Sparkles }
        ].map(cat => {
          const Icon = cat.icon;
          const isSel = activeCategory === cat.id;
          return (
            <button
              key={cat.id}
              onClick={() => {
                setActiveCategory(cat.id);
                setMessage(null);
              }}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl border text-xs font-bold whitespace-nowrap transition-all cursor-pointer ${
                isSel
                  ? "bg-blue-500 text-white border-blue-500 shadow-md"
                  : "bg-white dark:bg-slate-900 border-slate-100 dark:border-slate-800 text-slate-500 hover:bg-slate-50 dark:text-slate-400 dark:hover:bg-slate-800"
              }`}
            >
              <Icon className="w-3.5 h-3.5" />
              <span>{cat.label}</span>
            </button>
          );
        })}
      </div>

      {/* Message banners */}
      <AnimatePresence>
        {message && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: "auto", opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            className={`px-5 py-2 text-xs font-semibold shrink-0 text-center text-white ${
              message.type === "success" ? "bg-emerald-500" : "bg-red-500"
            }`}
          >
            {message.text}
          </motion.div>
        )}
      </AnimatePresence>

      {/* Scrollable Shop Items Grid */}
      <div className="flex-1 overflow-y-auto px-5 py-4 space-y-4">
        <div className="grid grid-cols-2 gap-4">
          {filteredItems.map(item => {
            const unlocked = isUnlocked(item);
            const equipped = isEquipped(item);
            const canAfford = coins >= item.price;

            return (
              <motion.div
                key={item.id}
                layout
                className="bg-white dark:bg-slate-900 rounded-3xl border border-slate-100 dark:border-slate-800/60 p-4 flex flex-col justify-between android-shadow relative group"
              >
                {/* Rarity tag */}
                <div className="absolute top-3 left-3 z-10">
                  <span className={`text-[8px] tracking-wider px-2 py-0.5 rounded-full ring-2 ${getRarityColor(item.rarity)}`}>
                    {getRarityLabel(item.rarity)}
                  </span>
                </div>

                {/* Preview block */}
                <div className="h-28 w-full bg-slate-50 dark:bg-slate-950 rounded-2xl flex items-center justify-center relative overflow-hidden mt-4">
                  {item.type === "avatar" && (
                    <img 
                      src={item.value} 
                      alt={item.name} 
                      className="w-16 h-16 rounded-2xl bg-white dark:bg-slate-800 p-1 border-2 border-slate-100 dark:border-slate-700" 
                    />
                  )}

                  {item.type === "frame" && (
                    <div className="relative">
                      <img 
                        src={user.avatarUrl} 
                        alt="Avatar Preview" 
                        className={`w-16 h-16 rounded-2xl bg-white dark:bg-slate-800 p-1 ${item.value}`} 
                      />
                    </div>
                  )}

                  {item.type === "theme" && (
                    <div className={`w-20 h-10 rounded-xl flex items-center justify-center text-[10px] text-center p-1 font-bold ${item.value}`}>
                      Aa Zz
                    </div>
                  )}

                  {item.type === "badge" && (
                    <div className="flex flex-col items-center">
                      <Sparkles className={`w-8 h-8 ${item.rarity === "legendaire" ? "text-amber-400" : item.rarity === "rare" ? "text-purple-500" : "text-emerald-500"}`} />
                      <span className="text-[10px] font-extrabold mt-1 text-slate-800 dark:text-slate-200">{item.value}</span>
                    </div>
                  )}

                  {/* Preview button */}
                  <button 
                    onClick={() => setShowPreviewItem(item)}
                    className="absolute bottom-2 right-2 p-1.5 bg-black/40 hover:bg-black/60 rounded-lg text-white opacity-0 group-hover:opacity-100 transition-opacity cursor-pointer"
                  >
                    <Eye className="w-3.5 h-3.5" />
                  </button>
                </div>

                {/* Metadata */}
                <div className="mt-3 flex-1 flex flex-col justify-between">
                  <div>
                    <h3 className="text-xs font-extrabold text-slate-900 dark:text-white line-clamp-1 leading-snug">
                      {item.name}
                    </h3>
                    <p className="text-[9px] text-slate-400 font-semibold mt-0.5">
                      {item.type === "avatar" ? "Avatar exclusif" : item.type === "frame" ? "Cadre de profil" : item.type === "theme" ? "Thème visuel" : "Badge honorifique"}
                    </p>
                  </div>

                  {/* Actions */}
                  <div className="mt-3 border-t border-slate-50 dark:border-slate-850 pt-2.5">
                    {unlocked ? (
                      <button
                        disabled={loadingItemId === item.id}
                        onClick={() => handleEquipItem(item)}
                        className={`w-full py-2 rounded-xl text-[10px] font-black tracking-wider uppercase transition-all cursor-pointer flex items-center justify-center gap-1 ${
                          equipped
                            ? "bg-emerald-50 border border-emerald-200 text-emerald-600 dark:bg-emerald-950/20 dark:border-emerald-900/50 dark:text-emerald-400"
                            : "bg-slate-100 hover:bg-slate-200 text-slate-700 dark:bg-slate-800 dark:hover:bg-slate-700 dark:text-slate-200"
                        }`}
                      >
                        {equipped ? (
                          <>
                            <Check className="w-3 h-3" />
                            <span>Équipé</span>
                          </>
                        ) : (
                          <span>Équiper</span>
                        )}
                      </button>
                    ) : (
                      <button
                        disabled={loadingItemId === item.id}
                        onClick={() => handleBuyItem(item)}
                        className={`w-full py-2 rounded-xl text-[10px] font-black tracking-wider uppercase transition-all cursor-pointer flex items-center justify-center gap-1 ${
                          canAfford
                            ? "bg-amber-500 hover:bg-amber-600 text-white shadow-sm shadow-amber-500/20"
                            : "bg-slate-100 text-slate-400 dark:bg-slate-800 dark:text-slate-500 cursor-not-allowed"
                        }`}
                      >
                        <Coins className="w-3.5 h-3.5 shrink-0" />
                        <span>{item.price.toLocaleString()} QC</span>
                      </button>
                    )}
                  </div>
                </div>
              </motion.div>
            );
          })}
        </div>
      </div>

      {/* Item Inspection Preview Modal */}
      <AnimatePresence>
        {showPreviewItem && (
          <div className="absolute inset-0 z-50 flex items-center justify-center p-6 select-none">
            {/* Backdrop */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 0.5 }}
              exit={{ opacity: 0 }}
              onClick={() => setShowPreviewItem(null)}
              className="absolute inset-0 bg-black"
            />

            {/* Modal Body */}
            <motion.div
              initial={{ scale: 0.9, y: 15, opacity: 0 }}
              animate={{ scale: 1, y: 0, opacity: 1 }}
              exit={{ scale: 0.9, y: 15, opacity: 0 }}
              className="w-full max-w-sm bg-white dark:bg-slate-900 rounded-[32px] overflow-hidden border border-slate-150 dark:border-slate-800 z-10 p-6 flex flex-col relative"
            >
              <h3 className="text-base font-black text-slate-900 dark:text-white mb-2 text-center">Aperçu en Grand</h3>
              
              <div className="h-44 bg-slate-50 dark:bg-slate-950 rounded-2xl flex items-center justify-center p-4">
                {showPreviewItem.type === "avatar" && (
                  <img 
                    src={showPreviewItem.value} 
                    alt={showPreviewItem.name} 
                    className="w-24 h-24 rounded-3xl bg-white dark:bg-slate-800 p-2 border-4 border-white dark:border-slate-700 shadow-xl" 
                  />
                )}

                {showPreviewItem.type === "frame" && (
                  <img 
                    src={user.avatarUrl} 
                    alt="Frame preview" 
                    className={`w-24 h-24 rounded-3xl bg-white p-2 ${showPreviewItem.value}`} 
                  />
                )}

                {showPreviewItem.type === "theme" && (
                  <div className={`w-40 h-20 rounded-2xl flex flex-col items-center justify-center font-black shadow-lg ${showPreviewItem.value}`}>
                    <span className="text-sm">Aperçu Thème</span>
                    <span className="text-[10px] opacity-75 font-normal">QuizMaster Design</span>
                  </div>
                )}

                {showPreviewItem.type === "badge" && (
                  <div className="flex flex-col items-center">
                    <Sparkles className={`w-14 h-14 ${showPreviewItem.rarity === "legendaire" ? "text-amber-400" : showPreviewItem.rarity === "rare" ? "text-purple-500" : "text-emerald-500"}`} />
                    <span className="text-xs font-black mt-2 text-slate-800 dark:text-slate-200">{showPreviewItem.value}</span>
                  </div>
                )}
              </div>

              <div className="text-center mt-4">
                <span className={`text-[9px] font-black tracking-wider px-2.5 py-1 rounded-full uppercase ${getRarityColor(showPreviewItem.rarity)}`}>
                  {getRarityLabel(showPreviewItem.rarity)}
                </span>
                <h4 className="text-sm font-black text-slate-900 dark:text-white mt-3">{showPreviewItem.name}</h4>
                <p className="text-[11px] text-slate-400 mt-1">
                  {showPreviewItem.type === "avatar" && "Un avatar exclusif pour briller sur le classement mondial."}
                  {showPreviewItem.type === "frame" && "Un cadre somptueux entourant ton portrait sur tous les écrans."}
                  {showPreviewItem.type === "theme" && "Une palette de couleur qui transforme l'atmosphère de ton application."}
                  {showPreviewItem.type === "badge" && "Un badge unique affiché sur ton profil pour attester de ta grandeur."}
                </p>
              </div>

              <div className="mt-5 flex gap-3">
                <button
                  onClick={() => setShowPreviewItem(null)}
                  className="flex-1 py-2.5 border border-slate-100 dark:border-slate-800 rounded-xl text-xs font-bold text-slate-500 hover:bg-slate-50 dark:text-slate-400 dark:hover:bg-slate-800 transition-colors cursor-pointer"
                >
                  Fermer
                </button>
                {!isUnlocked(showPreviewItem) && (
                  <button
                    disabled={coins < showPreviewItem.price}
                    onClick={() => {
                      handleBuyItem(showPreviewItem);
                      setShowPreviewItem(null);
                    }}
                    className={`flex-1 py-2.5 rounded-xl text-xs font-black text-white flex items-center justify-center gap-1 cursor-pointer ${
                      coins >= showPreviewItem.price
                        ? "bg-amber-500 hover:bg-amber-600"
                        : "bg-slate-100 text-slate-400 cursor-not-allowed"
                    }`}
                  >
                    <Coins className="w-3.5 h-3.5" />
                    <span>Acheter ({showPreviewItem.price})</span>
                  </button>
                )}
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

    </div>
  );
}
