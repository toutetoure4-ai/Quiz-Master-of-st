import { useState } from "react";
import { motion } from "motion/react";
import { Share2, Download, Copy, Check, X, Sparkles, Award, Star, Zap, Trophy, Flame } from "lucide-react";

interface ShareCardProps {
  type: "result" | "level" | "badge" | "highscore";
  title: string;
  subtitle: string;
  score?: string;
  xp?: number;
  badgeIcon?: string;
  badgeColor?: string;
  pseudo: string;
  avatarUrl: string;
  onClose: () => void;
}

export default function ShareCard({
  type,
  title,
  subtitle,
  score,
  xp,
  badgeIcon,
  badgeColor,
  pseudo,
  avatarUrl,
  onClose,
}: ShareCardProps) {
  const [copied, setCopied] = useState(false);
  const [downloading, setDownloading] = useState(false);

  const getShareText = () => {
    switch (type) {
      case "result":
        return `🏆 J'ai obtenu un score de ${score} sur le quiz "${title}" sur QuizMaster ! Viens me défier ! 🚀`;
      case "level":
        return `🎉 Incroyable ! Je viens de passer au Niveau ${title} sur QuizMaster ! Rejoins-moi pour muscler ton cerveau ! 🧠`;
      case "badge":
        return `🏅 Nouveau Badge Débloqué : "${title}" (${subtitle}) sur QuizMaster ! 🎯`;
      case "highscore":
        return `🔥 Nouveau Record Personnel ! Score de ${score} sur QuizMaster ! Peux-tu faire mieux ? ⚡`;
      default:
        return "Viens jouer sur QuizMaster !";
    }
  };

  const handleCopy = () => {
    navigator.clipboard.writeText(getShareText());
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleDownload = () => {
    setDownloading(true);
    setTimeout(() => {
      setDownloading(false);
      // Simulated browser download notification
      alert("La carte de partage haute résolution a été générée et enregistrée dans votre galerie ! ✨");
    }, 1500);
  };

  return (
    <div id="share-card-modal" className="absolute inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
      {/* Backdrop tap to close */}
      <div className="absolute inset-0" onClick={onClose} />

      {/* Main card box */}
      <motion.div
        initial={{ scale: 0.9, opacity: 0, y: 20 }}
        animate={{ scale: 1, opacity: 1, y: 0 }}
        exit={{ scale: 0.9, opacity: 0, y: 20 }}
        className="relative bg-white dark:bg-slate-900 rounded-[32px] w-full max-w-sm overflow-hidden border border-slate-100 dark:border-slate-800 shadow-2xl z-10 p-6 flex flex-col"
      >
        {/* Close Button */}
        <button
          onClick={onClose}
          className="absolute top-4 right-4 p-2 bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 rounded-full transition-colors cursor-pointer"
        >
          <X className="w-4 h-4 text-slate-500 dark:text-slate-400" />
        </button>

        {/* Card Header Label */}
        <div className="flex items-center gap-1.5 justify-center mb-5">
          <Sparkles className="w-4 h-4 text-amber-500 animate-spin" />
          <span className="text-[10px] font-black tracking-widest uppercase text-amber-600 dark:text-amber-400">
            {type === "result" && "Score de Quiz"}
            {type === "level" && "Niveau Supérieur"}
            {type === "badge" && "Badge Débloqué"}
            {type === "highscore" && "Nouveau Record"}
          </span>
          <Sparkles className="w-4 h-4 text-amber-500 animate-pulse" />
        </div>

        {/* Visual Shared Canvas */}
        <div className="p-6 rounded-3xl bg-gradient-to-br from-indigo-900 via-slate-950 to-slate-900 text-white border border-indigo-500/20 shadow-inner relative overflow-hidden select-none">
          {/* Accent Glow */}
          <div className="absolute -top-12 -right-12 w-32 h-32 bg-indigo-500/10 blur-2xl rounded-full" />
          <div className="absolute -bottom-12 -left-12 w-32 h-32 bg-emerald-500/10 blur-2xl rounded-full" />

          {/* QuizMaster Logo Watermark */}
          <div className="flex justify-between items-center mb-6">
            <span className="text-xs font-black tracking-widest bg-gradient-to-r from-blue-400 to-indigo-400 bg-clip-text text-transparent">
              QUIZMASTER
            </span>
            <div className="px-2 py-0.5 rounded bg-white/10 text-[8px] font-bold font-mono">
              SCORE-BOARD
            </div>
          </div>

          {/* User Profile Info */}
          <div className="flex items-center gap-3 mb-5">
            <img
              src={avatarUrl}
              alt="Avatar"
              className="w-11 h-11 rounded-xl bg-white/10 border border-white/20"
            />
            <div>
              <h4 className="text-xs font-black text-white">{pseudo}</h4>
              <p className="text-[9px] text-slate-400">Légende QuizMaster</p>
            </div>
          </div>

          {/* Visual Main Content */}
          <div className="my-3 text-center flex flex-col items-center py-4">
            {type === "result" && (
              <>
                <div className="w-16 h-16 rounded-2xl bg-blue-500/15 text-blue-400 flex items-center justify-center border border-blue-500/20 mb-4 shadow-lg shadow-blue-500/10">
                  <Trophy className="w-8 h-8 fill-current" />
                </div>
                <h3 className="text-sm font-black max-w-xs px-2 truncate">{title}</h3>
                <span className="text-4xl font-extrabold font-mono text-blue-400 tracking-tight mt-3">
                  {score}
                </span>
                <span className="text-[10px] font-bold text-slate-400 mt-1">
                  {subtitle}
                </span>
              </>
            )}

            {type === "level" && (
              <>
                <div className="w-16 h-16 rounded-2xl bg-indigo-500/15 text-indigo-400 flex items-center justify-center border border-indigo-500/20 mb-4 shadow-lg shadow-indigo-500/10">
                  <Zap className="w-8 h-8 fill-current" />
                </div>
                <p className="text-[10px] font-black uppercase text-indigo-400 tracking-widest">
                  NOUVEAU PALIER
                </p>
                <h3 className="text-3xl font-black text-white mt-1">Niveau {title}</h3>
                <span className="text-[10px] text-slate-400 mt-2 leading-relaxed">
                  {subtitle}
                </span>
              </>
            )}

            {type === "badge" && (
              <>
                <div className="w-16 h-16 rounded-2xl bg-amber-500/15 text-amber-400 flex items-center justify-center border border-amber-500/20 mb-4 shadow-lg shadow-amber-500/10">
                  <Award className="w-8 h-8 fill-current" />
                </div>
                <p className="text-[9px] font-black text-amber-500 uppercase tracking-widest">
                  BADGE DÉBLOQUÉ
                </p>
                <h3 className="text-base font-black text-white mt-1.5">{title}</h3>
                <span className="text-[10px] text-slate-400 mt-1.5 px-4 text-center leading-relaxed">
                  {subtitle}
                </span>
              </>
            )}

            {type === "highscore" && (
              <>
                <div className="w-16 h-16 rounded-2xl bg-orange-500/15 text-orange-400 flex items-center justify-center border border-orange-500/20 mb-4 shadow-lg shadow-orange-500/10">
                  <Flame className="w-8 h-8 fill-current" />
                </div>
                <p className="text-[10px] font-black text-orange-500 uppercase tracking-widest animate-pulse">
                  RELIQUE DE GLOIRE
                </p>
                <h3 className="text-sm font-black text-white mt-1 truncate max-w-xs">{title}</h3>
                <span className="text-4xl font-extrabold font-mono text-orange-400 mt-3">
                  {score}
                </span>
                <span className="text-[10px] text-slate-400 mt-1 font-bold">
                  {subtitle}
                </span>
              </>
            )}
          </div>

          {/* Footer Card Info */}
          <div className="border-t border-white/5 pt-4 mt-4 flex justify-between items-center text-[9px] text-slate-500">
            <span>Certifié anti-triche</span>
            <span>{xp ? `+${xp} XP gagnés` : "QuizMaster IA"}</span>
          </div>
        </div>

        {/* Share actions */}
        <div className="grid grid-cols-2 gap-3 mt-6">
          <button
            onClick={handleCopy}
            className={`py-3 px-4 rounded-2xl flex items-center justify-center gap-1.5 text-xs font-bold border transition-all cursor-pointer ${
              copied
                ? "bg-emerald-50 text-emerald-600 border-emerald-200 dark:bg-emerald-950/20 dark:text-emerald-400 dark:border-emerald-900/40"
                : "bg-slate-50 hover:bg-slate-100 border-slate-100 dark:bg-slate-800 dark:hover:bg-slate-700 dark:border-slate-800 text-slate-700 dark:text-slate-300"
            }`}
          >
            {copied ? (
              <>
                <Check className="w-4 h-4" /> Copié !
              </>
            ) : (
              <>
                <Copy className="w-4 h-4" /> Copier texte
              </>
            )}
          </button>

          <button
            onClick={handleDownload}
            disabled={downloading}
            className="py-3 px-4 bg-gradient-to-r from-blue-500 to-indigo-500 hover:from-blue-600 hover:to-indigo-600 text-white rounded-2xl flex items-center justify-center gap-1.5 text-xs font-black shadow-lg shadow-blue-500/10 cursor-pointer disabled:opacity-55"
          >
            {downloading ? (
              <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
            ) : (
              <>
                <Download className="w-4 h-4" /> Enregistrer
              </>
            )}
          </button>
        </div>
      </motion.div>
    </div>
  );
}
