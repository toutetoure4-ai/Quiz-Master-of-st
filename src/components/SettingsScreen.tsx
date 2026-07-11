import React from "react";
import { AppSettings, NotificationPreferences } from "../types";
import { 
  ArrowLeft, Moon, Sun, Bell, Shield, Info, LogOut, ChevronRight, 
  Globe2, Type, Volume2, Sparkles 
} from "lucide-react";

interface SettingsScreenProps {
  settings: AppSettings;
  onChangeSettings: (settings: AppSettings) => void;
  onLogout: () => void;
  onBack: () => void;
}

export default function SettingsScreen({ 
  settings, 
  onChangeSettings, 
  onLogout, 
  onBack 
}: SettingsScreenProps) {
  
  const toggleDarkMode = () => {
    onChangeSettings({ ...settings, darkMode: !settings.darkMode });
  };

  const toggleNotifications = () => {
    onChangeSettings({ ...settings, notificationsEnabled: !settings.notificationsEnabled });
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

  const currentPrefs = settings.notificationPreferences || {
    challengeInvites: true,
    challengeResults: true,
    badgeUnlocks: true,
    dailyReminder: true,
    popularQuizzes: true,
  };

  return (
    <div className="flex-1 flex flex-col bg-slate-50 dark:bg-slate-950 overflow-hidden">
      
      {/* Header */}
      <div className="p-5 pb-3 border-b border-slate-100 dark:border-slate-800/60 shrink-0 bg-white dark:bg-slate-950 flex items-center gap-3">
        <button
          onClick={onBack}
          className="p-2 hover:bg-slate-100 dark:hover:bg-slate-900 rounded-xl cursor-pointer text-slate-700 dark:text-slate-300"
        >
          <ArrowLeft className="w-5 h-5" />
        </button>
        <div>
          <h2 className="text-xl font-extrabold font-display text-slate-950 dark:text-white">Paramètres</h2>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">Personnalise ton expérience de jeu</p>
        </div>
      </div>

      {/* Settings list scroller */}
      <div className="flex-1 overflow-y-auto p-5 space-y-5">
        
        {/* Preference Settings */}
        <div className="bg-white dark:bg-slate-900 border border-slate-100 dark:border-slate-800/60 rounded-3xl p-5 space-y-4 android-shadow">
          <h3 className="text-[10px] font-black text-slate-400 tracking-wider uppercase block">
            Préférences système
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

            {/* Switch slider */}
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

          {/* Langue (static) */}
          <div className="flex items-center justify-between py-1">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-indigo-50 dark:bg-indigo-950/20 text-indigo-500 rounded-xl shrink-0">
                <Globe2 className="w-4 h-4" />
              </div>
              <div>
                <span className="text-xs font-black text-slate-800 dark:text-slate-200">Langue de l'application</span>
                <p className="text-[10px] text-slate-400 font-semibold">Supporte le Français</p>
              </div>
            </div>
            <span className="text-[11px] font-bold text-slate-400 bg-slate-100 dark:bg-slate-800 px-2.5 py-1 rounded-lg">
              Français (FR)
            </span>
          </div>
        </div>

        {/* ACCESSIBILITY SETTINGS SECTION */}
        <div className="bg-white dark:bg-slate-900 border border-slate-100 dark:border-slate-800/60 rounded-3xl p-5 space-y-4 android-shadow">
          <h3 className="text-[10px] font-black text-slate-400 tracking-wider uppercase block">
            Accessibilité & Audio (TTS)
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
                    {size === "small" && "A"}
                    {size === "medium" && "A+"}
                    {size === "large" && "A++"}
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

        {/* GRANULAR NOTIFICATION SETTINGS */}
        <div className="bg-white dark:bg-slate-900 border border-slate-100 dark:border-slate-800/60 rounded-3xl p-5 space-y-4 android-shadow">
          <div className="flex items-center justify-between">
            <h3 className="text-[10px] font-black text-slate-400 tracking-wider uppercase">
              Alertes & Notifications de jeu
            </h3>
            {/* Global switch indicator */}
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

        {/* Security & Support */}
        <div className="bg-white dark:bg-slate-900 border border-slate-100 dark:border-slate-800/60 rounded-3xl p-5 space-y-4 android-shadow">
          <h3 className="text-[10px] font-black text-slate-400 tracking-wider uppercase block">
            Sécurité & Informations
          </h3>

          {/* Mode Privé */}
          <div className="flex items-center justify-between py-1">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-emerald-50 dark:bg-emerald-950/20 text-emerald-500 rounded-xl shrink-0">
                <Shield className="w-4 h-4" />
              </div>
              <div>
                <span className="text-xs font-black text-slate-800 dark:text-slate-200">Confidentialité</span>
                <p className="text-[10px] text-slate-400 font-semibold">Masquer mon profil du classement mondial</p>
              </div>
            </div>

            {/* Switch slider */}
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

          {/* À propos */}
          <div className="flex items-center justify-between py-1 cursor-pointer group">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-slate-100 dark:bg-slate-800 text-slate-500 rounded-xl shrink-0">
                <Info className="w-4 h-4" />
              </div>
              <div>
                <span className="text-xs font-black text-slate-800 dark:text-slate-200">À propos de QuizMaster</span>
                <p className="text-[10px] text-slate-400 font-semibold">Version 1.0.0 (Production)</p>
              </div>
            </div>
            <ChevronRight className="w-4.5 h-4.5 text-slate-400 group-hover:text-slate-600 transition-colors" />
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

    </div>
  );
}
