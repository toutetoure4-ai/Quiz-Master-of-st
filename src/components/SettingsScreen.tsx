import React, { useState } from "react";
import { AppSettings, NotificationPreferences, UserProfile } from "../types";
import EditProfileModal from "./EditProfileModal";
import { t, Language } from "../lib/i18n";
import { 
  ArrowLeft, Moon, Sun, Bell, Shield, Info, LogOut, ChevronRight, 
  Globe2, Type, Volume2, Sparkles, User, Edit3, Camera, VolumeX,
  Trash2, RefreshCw, CheckCircle2, AlertTriangle, X, Crown, Palette, Lock
} from "lucide-react";

interface SettingsScreenProps {
  user?: UserProfile;
  onUpdateUser?: (updated: UserProfile) => void;
  settings: AppSettings;
  onChangeSettings: (settings: AppSettings) => void;
  onLogout: () => void;
  onBack: () => void;
}

export default function SettingsScreen({ 
  user,
  onUpdateUser,
  settings, 
  onChangeSettings, 
  onLogout, 
  onBack 
}: SettingsScreenProps) {
  const [isEditModalOpen, setIsEditModalOpen] = useState<boolean>(false);
  const [isResetConfirmOpen, setIsResetConfirmOpen] = useState<boolean>(false);
  const [resetSuccessToast, setResetSuccessToast] = useState<boolean>(false);
  const [themeNotice, setThemeNotice] = useState<string | null>(null);

  const SUPER_COOL_PREMIUM_THEMES = [
    { id: "theme-neon-cyber", name: "Néon Cyberpunk", color: "from-cyan-500 via-fuchsia-500 to-pink-500", border: "border-cyan-400" },
    { id: "theme-gold-vip", name: "Or Suprême VIP", color: "from-amber-400 via-yellow-300 to-amber-600", border: "border-amber-400" },
    { id: "theme-aurora", name: "Aurore Boréale", color: "from-emerald-400 via-teal-500 to-indigo-600", border: "border-emerald-400" },
    { id: "theme-galaxy", name: "Galaxie Sombre", color: "from-purple-900 via-indigo-950 to-slate-950", border: "border-purple-500" },
    { id: "theme-emerald-king", name: "Émeraude Royale", color: "from-emerald-500 via-teal-400 to-emerald-800", border: "border-teal-400" },
  ];

  const handleSelectTheme = (themeId: string) => {
    if (!user) return;
    if (!user.isPremium) {
      setThemeNotice("⚠️ Ce thème super cool est réservé exclusivement aux Membres Premium 👑");
      setTimeout(() => setThemeNotice(null), 3500);
      return;
    }
    const updated = { ...user, activeTheme: themeId };
    if (onUpdateUser) onUpdateUser(updated);
    setThemeNotice("✨ Thème Premium activé avec succès !");
    setTimeout(() => setThemeNotice(null), 3000);
  };

  const lang: Language = settings.language || "fr";

  const toggleDarkMode = () => {
    onChangeSettings({ ...settings, darkMode: !settings.darkMode });
  };

  const toggleSoundEffects = () => {
    onChangeSettings({ ...settings, soundEffectsEnabled: !settings.soundEffectsEnabled });
  };

  const handleLanguageChange = (lang: "fr" | "en" | "es") => {
    onChangeSettings({ ...settings, language: lang });
  };

  const togglePrivacyMode = () => {
    onChangeSettings({ ...settings, privacyMode: !settings.privacyMode });
  };

  const toggleTts = () => {
    onChangeSettings({ ...settings, ttsEnabled: !settings.ttsEnabled });
  };

  const handleTtsRateChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    onChangeSettings({ ...settings, ttsRate: parseFloat(e.target.value) });
  };

  const handleTextSizeChange = (size: "small" | "medium" | "large" | "xlarge") => {
    onChangeSettings({ ...settings, textSize: size });
  };

  const handleNotificationPreferenceToggle = (key: keyof NotificationPreferences) => {
    const prefs = settings.notificationPreferences || {
      challengeInvites: true,
      challengeResults: true,
      badgeUnlocks: true,
      dailyReminder: true,
      popularQuizzes: true,
    };
    onChangeSettings({
      ...settings,
      notificationPreferences: {
        ...prefs,
        [key]: !prefs[key]
      }
    });
  };

  const handleClearCache = () => {
    // Clear draft attempts and cached items safely
    localStorage.removeItem("qm_draft_attempts");
    setResetSuccessToast(true);
    setIsResetConfirmOpen(false);
    setTimeout(() => {
      setResetSuccessToast(false);
    }, 2500);
  };

  const currentPrefs = settings.notificationPreferences || {
    challengeInvites: true,
    challengeResults: true,
    badgeUnlocks: true,
    dailyReminder: true,
    popularQuizzes: true,
  };

  return (
    <div className="flex-1 flex flex-col bg-slate-50 dark:bg-slate-950 overflow-hidden relative">
      
      {/* Header */}
      <div className="p-5 pb-3 border-b border-slate-100 dark:border-slate-800/60 shrink-0 bg-white dark:bg-slate-950 flex items-center gap-3">
        <button
          onClick={onBack}
          className="p-2 hover:bg-slate-100 dark:hover:bg-slate-900 rounded-xl cursor-pointer text-slate-700 dark:text-slate-300 transition-colors"
        >
          <ArrowLeft className="w-5 h-5" />
        </button>
        <div>
          <h2 className="text-xl font-extrabold font-display text-slate-950 dark:text-white">{t("nav_settings", lang)}</h2>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">Personnalise ton profil et l'application</p>
        </div>
      </div>

      {/* Toast Notification */}
      {resetSuccessToast && (
        <div className="absolute top-16 left-1/2 -translate-x-1/2 z-50 bg-emerald-600 text-white px-4 py-2 rounded-2xl text-xs font-bold shadow-xl flex items-center gap-2 animate-bounce">
          <CheckCircle2 className="w-4 h-4" />
          <span>Cache de l'application vidé avec succès !</span>
        </div>
      )}

      {/* Settings list scroller */}
      <div className="flex-1 overflow-y-auto p-5 space-y-5">
        
        {/* SECTION 1: PROFIL & IDENTITÉ */}
        {user && (
          <div className="bg-white dark:bg-slate-900 border border-slate-100 dark:border-slate-800/60 rounded-3xl p-5 space-y-4 android-shadow">
            <h3 className="text-[10px] font-black text-slate-400 tracking-wider uppercase block">
              Mon Profil & Identité
            </h3>

            <div className="flex items-center justify-between p-3.5 bg-slate-50 dark:bg-slate-800/50 rounded-2xl border border-slate-100 dark:border-slate-800/80">
              <div className="flex items-center gap-3.5">
                <div 
                  onClick={() => setIsEditModalOpen(true)}
                  className="relative cursor-pointer group shrink-0"
                >
                  <img
                    src={user.avatarUrl}
                    alt="Avatar"
                    className="w-14 h-14 rounded-2xl bg-white dark:bg-slate-900 border-2 border-indigo-500 object-cover shadow-md"
                  />
                  <div className="absolute -bottom-1 -right-1 bg-indigo-500 text-white p-1 rounded-lg shadow group-hover:scale-110 transition-transform">
                    <Camera className="w-3 h-3" />
                  </div>
                </div>

                <div>
                  <h4 className="text-sm font-black text-slate-900 dark:text-white">
                    {user.fullName || user.pseudo}
                  </h4>
                  <span className="text-xs font-bold text-indigo-500 dark:text-indigo-400 block mt-0.5">
                    @{user.pseudo}
                  </span>
                  <p className="text-[10px] text-slate-400 font-medium mt-0.5">
                    Niveau {user.level} • {user.xp} XP
                  </p>
                </div>
              </div>

              <button
                onClick={() => setIsEditModalOpen(true)}
                className="px-3.5 py-2 bg-indigo-500 hover:bg-indigo-600 text-white rounded-xl text-xs font-black shadow-md shadow-indigo-500/20 flex items-center gap-1.5 cursor-pointer transition-all active:scale-95 shrink-0"
              >
                <Edit3 className="w-3.5 h-3.5" />
                <span>Modifier</span>
              </button>
            </div>
          </div>
        )}

        {/* SECTION 2: PRÉFÉRENCES SYSTÈME */}
        <div className="bg-white dark:bg-slate-900 border border-slate-100 dark:border-slate-800/60 rounded-3xl p-5 space-y-4 android-shadow">
          <h3 className="text-[10px] font-black text-slate-400 tracking-wider uppercase block">
            Préférences système & Affichage
          </h3>

          {/* Mode Sombre */}
          <div className="flex items-center justify-between py-1">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-blue-50 dark:bg-blue-950/20 text-blue-500 rounded-xl shrink-0">
                {settings.darkMode ? <Moon className="w-4 h-4" /> : <Sun className="w-4 h-4" />}
              </div>
              <div>
                <span className="text-xs font-black text-slate-800 dark:text-slate-200">Mode Sombre</span>
                <p className="text-[10px] text-slate-400 font-semibold">Réduit la fatigue oculaire la nuit</p>
              </div>
            </div>

            <button
              onClick={toggleDarkMode}
              className={`w-11 h-6 rounded-full p-1 cursor-pointer transition-colors duration-200 focus:outline-none ${
                settings.darkMode ? "bg-blue-500" : "bg-slate-200 dark:bg-slate-800"
              }`}
            >
              <div
                className={`w-4 h-4 rounded-full bg-white transition-transform duration-200 ${
                  settings.darkMode ? "translate-x-5" : "translate-x-0"
                }`}
              />
            </button>
          </div>

          <hr className="border-slate-100 dark:border-slate-800/60" />

          {/* Effets sonores */}
          <div className="flex items-center justify-between py-1">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-emerald-50 dark:bg-emerald-950/20 text-emerald-500 rounded-xl shrink-0">
                {settings.soundEffectsEnabled !== false ? <Volume2 className="w-4 h-4" /> : <VolumeX className="w-4 h-4" />}
              </div>
              <div>
                <span className="text-xs font-black text-slate-800 dark:text-slate-200">Effets sonores & Bruitages</span>
                <p className="text-[10px] text-slate-400 font-semibold">Sons lors des bonnes réponses et victoires</p>
              </div>
            </div>

            <button
              onClick={toggleSoundEffects}
              className={`w-11 h-6 rounded-full p-1 cursor-pointer transition-colors duration-200 focus:outline-none ${
                settings.soundEffectsEnabled !== false ? "bg-emerald-500" : "bg-slate-200 dark:bg-slate-800"
              }`}
            >
              <div
                className={`w-4 h-4 rounded-full bg-white transition-transform duration-200 ${
                  settings.soundEffectsEnabled !== false ? "translate-x-5" : "translate-x-0"
                }`}
              />
            </button>
          </div>

          <hr className="border-slate-100 dark:border-slate-800/60" />

          {/* Choix de la Langue */}
          <div className="space-y-2 py-1">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-indigo-50 dark:bg-indigo-950/20 text-indigo-500 rounded-xl shrink-0">
                <Globe2 className="w-4 h-4" />
              </div>
              <div>
                <span className="text-xs font-black text-slate-800 dark:text-slate-200">Langue de l'application</span>
                <p className="text-[10px] text-slate-400 font-semibold">Sélectionne ton langage préféré</p>
              </div>
            </div>

            <div className="grid grid-cols-3 gap-2 pt-1 pl-11">
              {[
                { code: "fr", label: "Français 🇫🇷" },
                { code: "en", label: "English 🇬🇧" },
                { code: "es", label: "Español 🇪🇸" }
              ].map((item) => {
                const isSelected = (settings.language || "fr") === item.code;
                return (
                  <button
                    key={item.code}
                    type="button"
                    onClick={() => handleLanguageChange(item.code as "fr" | "en" | "es")}
                    className={`py-2 text-[10px] font-black rounded-xl border transition-all cursor-pointer ${
                      isSelected
                        ? "bg-indigo-500 text-white border-indigo-500 shadow-md shadow-indigo-500/10"
                        : "bg-slate-50 dark:bg-slate-800 border-slate-100 dark:border-slate-700 text-slate-600 dark:text-slate-300"
                    }`}
                  >
                    {item.label}
                  </button>
                );
              })}
            </div>
          </div>
        </div>

        {/* SECTION PREMIUM THEMES */}
        <div className="bg-gradient-to-br from-amber-500/10 via-amber-500/5 to-slate-900/5 dark:from-amber-950/40 dark:to-slate-900 border border-amber-500/30 rounded-3xl p-5 space-y-4 android-shadow relative overflow-hidden">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2.5">
              <div className="p-2.5 bg-gradient-to-br from-amber-400 to-amber-600 text-slate-950 rounded-2xl shadow-md">
                <Palette className="w-5 h-5 fill-slate-950/20" />
              </div>
              <div>
                <div className="flex items-center gap-1.5">
                  <h3 className="text-xs font-black uppercase tracking-wider text-slate-900 dark:text-white font-display">
                    Thèmes Super Cool
                  </h3>
                  <span className="px-2 py-0.5 bg-amber-500 text-slate-950 text-[9px] font-black rounded-full uppercase tracking-wider flex items-center gap-0.5 shadow-xs">
                    <Crown className="w-2.5 h-2.5 fill-slate-950" /> Premium
                  </span>
                </div>
                <p className="text-[10px] font-semibold text-slate-500 dark:text-slate-400 mt-0.5">
                  Personnalise l'ambiance avec des styles visuels VIP
                </p>
              </div>
            </div>
          </div>

          {/* Theme Notice Popup Alert */}
          {themeNotice && (
            <div className="p-2.5 bg-amber-500/20 border border-amber-500/40 rounded-2xl text-[11px] font-bold text-amber-600 dark:text-amber-300 flex items-center gap-2 animate-bounce">
              <Sparkles className="w-4 h-4 shrink-0 text-amber-400" />
              <span>{themeNotice}</span>
            </div>
          )}

          {/* Grid of Super Cool Premium Themes */}
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-2.5 pt-1">
            {SUPER_COOL_PREMIUM_THEMES.map((item) => {
              const isSelected = user?.activeTheme === item.id;
              const isPremium = user?.isPremium;

              return (
                <button
                  key={item.id}
                  type="button"
                  onClick={() => handleSelectTheme(item.id)}
                  className={`p-3 rounded-2xl border text-left flex flex-col justify-between space-y-2 relative transition-all cursor-pointer ${
                    isSelected
                      ? `border-amber-500 ring-2 ring-amber-500/40 bg-white dark:bg-slate-900 shadow-lg scale-[1.02]`
                      : `border-slate-200 dark:border-slate-800 bg-white/80 dark:bg-slate-900/80 hover:border-amber-300`
                  }`}
                >
                  <div className={`w-full h-8 rounded-xl bg-gradient-to-r ${item.color} shadow-inner flex items-center justify-end px-2`}>
                    {!isPremium ? (
                      <Lock className="w-3.5 h-3.5 text-white/90 drop-shadow" />
                    ) : isSelected ? (
                      <CheckCircle2 className="w-4 h-4 text-white drop-shadow" />
                    ) : null}
                  </div>
                  <div>
                    <span className="text-[11px] font-black text-slate-900 dark:text-white block truncate">
                      {item.name}
                    </span>
                    <span className="text-[9px] font-bold text-amber-500 uppercase tracking-wider block">
                      {isPremium ? (isSelected ? "Actif ✨" : "Débloqué") : "Réservé VIP"}
                    </span>
                  </div>
                </button>
              );
            })}
          </div>
        </div>

        {/* SECTION 3: ACCESSIBILITÉ & SYNTHÈSE VOCALE (TTS) */}
        <div className="bg-white dark:bg-slate-900 border border-slate-100 dark:border-slate-800/60 rounded-3xl p-5 space-y-4 android-shadow">
          <h3 className="text-[10px] font-black text-slate-400 tracking-wider uppercase block">
            Accessibilité & Synthèse vocale
          </h3>

          {/* Text Size adjust */}
          <div className="space-y-3 py-1">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-violet-50 dark:bg-violet-950/20 text-violet-500 rounded-xl shrink-0">
                <Type className="w-4 h-4" />
              </div>
              <div>
                <span className="text-xs font-black text-slate-800 dark:text-slate-200">Taille du texte</span>
                <p className="text-[10px] text-slate-400 font-semibold">Ajuster la taille de police des questions</p>
              </div>
            </div>

            <div className="grid grid-cols-4 gap-2 pt-1">
              {(["small", "medium", "large", "xlarge"] as const).map((size) => {
                const isSelected = (settings.textSize || "medium") === size;
                return (
                  <button
                    key={size}
                    onClick={() => handleTextSizeChange(size)}
                    className={`py-2 text-[10px] font-extrabold rounded-xl border transition-all cursor-pointer ${
                      isSelected
                        ? "bg-violet-500 text-white border-violet-500 shadow-md shadow-violet-500/10"
                        : "bg-slate-50 dark:bg-slate-800 border-slate-100 dark:border-slate-700 text-slate-600 dark:text-slate-300"
                    }`}
                  >
                    {size === "small" && "Normal (A)"}
                    {size === "medium" && "Grand (A+)"}
                    {size === "large" && "Très grand (A++)"}
                    {size === "xlarge" && "MAX"}
                  </button>
                );
              })}
            </div>
          </div>

          <hr className="border-slate-100 dark:border-slate-800/60" />

          {/* Synthèse vocale automatique */}
          <div className="flex items-center justify-between py-1">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-pink-50 dark:bg-pink-950/20 text-pink-500 rounded-xl shrink-0">
                <Volume2 className="w-4 h-4" />
              </div>
              <div>
                <span className="text-xs font-black text-slate-800 dark:text-slate-200">Lecture audio automatique</span>
                <p className="text-[10px] text-slate-400 font-semibold">Lit la question dès qu'elle apparaît</p>
              </div>
            </div>

            <button
              onClick={toggleTts}
              className={`w-11 h-6 rounded-full p-1 cursor-pointer transition-colors duration-200 focus:outline-none ${
                settings.ttsEnabled ? "bg-blue-500" : "bg-slate-200 dark:bg-slate-800"
              }`}
            >
              <div
                className={`w-4 h-4 rounded-full bg-white transition-transform duration-200 ${
                  settings.ttsEnabled ? "translate-x-5" : "translate-x-0"
                }`}
              />
            </button>
          </div>

          {/* Vitesse de lecture de la voix */}
          {settings.ttsEnabled && (
            <div className="space-y-1.5 pt-1.5 pl-11">
              <div className="flex justify-between text-[10px] text-slate-400 font-bold">
                <span>Vitesse de voix</span>
                <span>{settings.ttsRate || 1.0}x</span>
              </div>
              <input
                type="range"
                min="0.6"
                max="1.8"
                step="0.1"
                value={settings.ttsRate || 1.0}
                onChange={handleTtsRateChange}
                className="w-full h-1 bg-slate-200 dark:bg-slate-800 rounded-lg appearance-none cursor-pointer accent-blue-500"
              />
            </div>
          )}
        </div>

        {/* SECTION 4: NOTIFICATIONS */}
        <div className="bg-white dark:bg-slate-900 border border-slate-100 dark:border-slate-800/60 rounded-3xl p-5 space-y-4 android-shadow">
          <div className="flex items-center justify-between">
            <h3 className="text-[10px] font-black text-slate-400 tracking-wider uppercase">
              Alertes & Notifications de jeu
            </h3>
            <span className={`text-[9px] font-black px-2 py-0.5 rounded-full ${settings.notificationsEnabled ? "bg-emerald-100 text-emerald-600 dark:bg-emerald-950/20 dark:text-emerald-400" : "bg-slate-100 text-slate-400"}`}>
              {settings.notificationsEnabled ? "Actif" : "Inactif"}
            </span>
          </div>

          {/* Invitation de défis */}
          <div className="flex items-center justify-between py-1 opacity-90">
            <div>
              <span className="text-xs font-black text-slate-800 dark:text-slate-200">Invitations aux défis</span>
              <p className="text-[10px] text-slate-400 font-semibold">Quand un ami te défie en duel</p>
            </div>
            <button
              disabled={!settings.notificationsEnabled}
              onClick={() => handleNotificationPreferenceToggle("challengeInvites")}
              className={`w-9 h-5 rounded-full p-0.5 cursor-pointer transition-colors duration-200 disabled:opacity-30 ${
                settings.notificationsEnabled && currentPrefs.challengeInvites ? "bg-emerald-500" : "bg-slate-200 dark:bg-slate-800"
              }`}
            >
              <div
                className={`w-4 h-4 rounded-full bg-white transition-transform duration-200 ${
                  settings.notificationsEnabled && currentPrefs.challengeInvites ? "translate-x-4" : "translate-x-0"
                }`}
              />
            </button>
          </div>

          {/* Résultats de défis */}
          <div className="flex items-center justify-between py-1 opacity-90">
            <div>
              <span className="text-xs font-black text-slate-800 dark:text-slate-200">Résultats des défis</span>
              <p className="text-[10px] text-slate-400 font-semibold">Annonces de victoire ou de défaite</p>
            </div>
            <button
              disabled={!settings.notificationsEnabled}
              onClick={() => handleNotificationPreferenceToggle("challengeResults")}
              className={`w-9 h-5 rounded-full p-0.5 cursor-pointer transition-colors duration-200 disabled:opacity-30 ${
                settings.notificationsEnabled && currentPrefs.challengeResults ? "bg-emerald-500" : "bg-slate-200 dark:bg-slate-800"
              }`}
            >
              <div
                className={`w-4 h-4 rounded-full bg-white transition-transform duration-200 ${
                  settings.notificationsEnabled && currentPrefs.challengeResults ? "translate-x-4" : "translate-x-0"
                }`}
              />
            </button>
          </div>

          {/* Badges débloqués */}
          <div className="flex items-center justify-between py-1 opacity-90">
            <div>
              <span className="text-xs font-black text-slate-800 dark:text-slate-200">Nouveaux badges</span>
              <p className="text-[10px] text-slate-400 font-semibold">Quand un insigne d'honneur est débloqué</p>
            </div>
            <button
              disabled={!settings.notificationsEnabled}
              onClick={() => handleNotificationPreferenceToggle("badgeUnlocks")}
              className={`w-9 h-5 rounded-full p-0.5 cursor-pointer transition-colors duration-200 disabled:opacity-30 ${
                settings.notificationsEnabled && currentPrefs.badgeUnlocks ? "bg-emerald-500" : "bg-slate-200 dark:bg-slate-800"
              }`}
            >
              <div
                className={`w-4 h-4 rounded-full bg-white transition-transform duration-200 ${
                  settings.notificationsEnabled && currentPrefs.badgeUnlocks ? "translate-x-4" : "translate-x-0"
                }`}
              />
            </button>
          </div>

          {/* Rappel quotidien */}
          <div className="flex items-center justify-between py-1 opacity-90">
            <div>
              <span className="text-xs font-black text-slate-800 dark:text-slate-200">Rappels de série</span>
              <p className="text-[10px] text-slate-400 font-semibold">T'invite à entretenir ta flamme quotidienne</p>
            </div>
            <button
              disabled={!settings.notificationsEnabled}
              onClick={() => handleNotificationPreferenceToggle("dailyReminder")}
              className={`w-9 h-5 rounded-full p-0.5 cursor-pointer transition-colors duration-200 disabled:opacity-30 ${
                settings.notificationsEnabled && currentPrefs.dailyReminder ? "bg-emerald-500" : "bg-slate-200 dark:bg-slate-800"
              }`}
            >
              <div
                className={`w-4 h-4 rounded-full bg-white transition-transform duration-200 ${
                  settings.notificationsEnabled && currentPrefs.dailyReminder ? "translate-x-4" : "translate-x-0"
                }`}
              />
            </button>
          </div>
        </div>

        {/* SECTION 5: SÉCURITÉ & DONNÉES */}
        <div className="bg-white dark:bg-slate-900 border border-slate-100 dark:border-slate-800/60 rounded-3xl p-5 space-y-4 android-shadow">
          <h3 className="text-[10px] font-black text-slate-400 tracking-wider uppercase block">
            Sécurité, Données & À propos
          </h3>

          {/* Mode Privé */}
          <div className="flex items-center justify-between py-1">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-emerald-50 dark:bg-emerald-950/20 text-emerald-500 rounded-xl shrink-0">
                <Shield className="w-4 h-4" />
              </div>
              <div>
                <span className="text-xs font-black text-slate-800 dark:text-slate-200">Mode Confidentialité</span>
                <p className="text-[10px] text-slate-400 font-semibold">Masquer mon profil du classement mondial</p>
              </div>
            </div>

            <button
              onClick={togglePrivacyMode}
              className={`w-11 h-6 rounded-full p-1 cursor-pointer transition-colors duration-200 focus:outline-none ${
                settings.privacyMode ? "bg-blue-500" : "bg-slate-200 dark:bg-slate-800"
              }`}
            >
              <div
                className={`w-4 h-4 rounded-full bg-white transition-transform duration-200 ${
                  settings.privacyMode ? "translate-x-5" : "translate-x-0"
                }`}
              />
            </button>
          </div>

          <hr className="border-slate-100 dark:border-slate-800/60" />

          {/* Vider le cache */}
          <div className="flex items-center justify-between py-1">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-amber-50 dark:bg-amber-950/20 text-amber-500 rounded-xl shrink-0">
                <RefreshCw className="w-4 h-4" />
              </div>
              <div>
                <span className="text-xs font-black text-slate-800 dark:text-slate-200">Vider le cache local</span>
                <p className="text-[10px] text-slate-400 font-semibold">Supprime les brouillons temporaires</p>
              </div>
            </div>

            <button
              onClick={() => setIsResetConfirmOpen(true)}
              className="px-3 py-1.5 bg-slate-100 dark:bg-slate-800 hover:bg-amber-100 dark:hover:bg-amber-950/40 text-amber-600 dark:text-amber-400 rounded-xl text-[10px] font-extrabold transition-colors cursor-pointer"
            >
              Nettoyer
            </button>
          </div>

          <hr className="border-slate-100 dark:border-slate-800/60" />

          {/* À propos */}
          <div className="flex items-center justify-between py-1">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-slate-100 dark:bg-slate-800 text-slate-500 rounded-xl shrink-0">
                <Info className="w-4 h-4" />
              </div>
              <div>
                <span className="text-xs font-black text-slate-800 dark:text-slate-200">À propos de QuizMaster</span>
                <p className="text-[10px] text-slate-400 font-semibold">Version 2.4.0 (Production Build)</p>
              </div>
            </div>
            <span className="text-[10px] font-black text-emerald-500 bg-emerald-50 dark:bg-emerald-950/40 px-2.5 py-1 rounded-full">
              À jour
            </span>
          </div>
        </div>

        {/* Log Out Button */}
        <button
          onClick={onLogout}
          className="w-full py-4 bg-red-50 hover:bg-red-100 dark:bg-red-950/20 dark:hover:bg-red-950/40 text-red-600 rounded-2xl text-xs font-black flex items-center justify-center gap-2 border border-red-100 dark:border-red-950/30 cursor-pointer active:scale-98 transition-all"
        >
          <LogOut className="w-4 h-4" />
          Se déconnecter de mon profil
        </button>

      </div>

      {/* Edit Profile Modal */}
      {user && onUpdateUser && (
        <EditProfileModal
          user={user}
          isOpen={isEditModalOpen}
          onClose={() => setIsEditModalOpen(false)}
          onUpdateUser={onUpdateUser}
        />
      )}

      {/* Clear Cache Confirmation Modal */}
      {isResetConfirmOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/70 backdrop-blur-sm">
          <div className="bg-white dark:bg-slate-900 rounded-3xl p-6 w-full max-w-sm border border-slate-100 dark:border-slate-800 shadow-2xl space-y-4 text-center">
            <div className="w-12 h-12 rounded-2xl bg-amber-50 dark:bg-amber-950/40 text-amber-500 flex items-center justify-center mx-auto">
              <AlertTriangle className="w-6 h-6" />
            </div>
            <div>
              <h3 className="text-base font-black text-slate-900 dark:text-white">
                Nettoyer le cache local ?
              </h3>
              <p className="text-xs text-slate-400 mt-1 font-medium">
                Cette action supprimera les brouillons temporaires non enregistrés. Tes statistiques et ton niveau restent 100% sécurisés.
              </p>
            </div>
            <div className="flex gap-2 pt-2">
              <button
                onClick={() => setIsResetConfirmOpen(false)}
                className="flex-1 py-3 bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 rounded-2xl text-xs font-bold cursor-pointer"
              >
                Annuler
              </button>
              <button
                onClick={handleClearCache}
                className="flex-1 py-3 bg-amber-500 hover:bg-amber-600 text-white rounded-2xl text-xs font-black shadow-lg shadow-amber-500/20 cursor-pointer"
              >
                Confirmer
              </button>
            </div>
          </div>
        </div>
      )}

    </div>
  );
}
