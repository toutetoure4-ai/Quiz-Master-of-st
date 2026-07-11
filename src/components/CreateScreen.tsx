import React, { useState } from "react";
import { motion, AnimatePresence } from "motion/react";
import { Quiz, QuizDifficulty, Question, UserProfile } from "../types";
import { CATEGORIES, CategoryItem } from "../data";
import { Sparkles, Plus, Check, Save, Trash2, ArrowRight, BookOpen, BrainCircuit, X, Palette, Compass } from "lucide-react";

interface CreateScreenProps {
  user: UserProfile;
  onCreateQuiz: (quiz: Quiz) => void;
  categories: CategoryItem[];
  onAddCategory: (category: CategoryItem) => void;
}

export default function CreateScreen({ user, onCreateQuiz, categories, onAddCategory }: CreateScreenProps) {
  const [mode, setMode] = useState<"manual" | "ai">("ai");

  // Shared metadata
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [category, setCategory] = useState(categories[0]?.name || "Culture générale");
  const [difficulty, setDifficulty] = useState<QuizDifficulty>(QuizDifficulty.MOYEN);

  // Manual creation states
  const [questions, setQuestions] = useState<Question[]>([]);
  const [currentQText, setCurrentQText] = useState("");
  const [options, setOptions] = useState<string[]>(["", "", "", ""]);
  const [correctIndex, setCorrectIndex] = useState<number>(0);
  const [explanation, setExplanation] = useState("");

  // AI creation states
  const [aiTopic, setAiTopic] = useState("");
  const [aiQuestionsCount, setAiQuestionsCount] = useState<number>(5);
  const [aiQuestionFormat, setAiQuestionFormat] = useState<"mixte" | "qcm" | "vrai_faux" | "libre">("mixte");
  const [isGenerating, setIsGenerating] = useState(false);
  const [aiGeneratedQuiz, setAiGeneratedQuiz] = useState<Quiz | null>(null);
  const [aiError, setAiError] = useState("");

  // Custom Category Addition states
  const [showAddCategory, setShowAddCategory] = useState(false);
  const [newCatName, setNewCatName] = useState("");
  const [newCatColor, setNewCatColor] = useState("#3b82f6");
  const [newCatIcon, setNewCatIcon] = useState("Compass");

  // Handle adding a manual question
  const handleAddQuestion = () => {
    if (!currentQText.trim()) return;
    if (options.some(opt => !opt.trim())) return;

    const newQ: Question = {
      id: `q-manual-${Date.now()}-${questions.length}`,
      questionText: currentQText,
      options: [...options],
      correctAnswerIndex: correctIndex,
      explanation: explanation || "Explication standard."
    };

    setQuestions([...questions, newQ]);
    
    // Clear question inputs
    setCurrentQText("");
    setOptions(["", "", "", ""]);
    setCorrectIndex(0);
    setExplanation("");
  };

  const handleRemoveQuestion = (index: number) => {
    setQuestions(questions.filter((_, i) => i !== index));
  };

  const handleSaveManualQuiz = (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim() || !description.trim() || questions.length === 0) {
      alert("Veuillez remplir le titre, la description et ajouter au moins une question.");
      return;
    }

    const newQuiz: Quiz = {
      id: `quiz-manual-${Date.now()}`,
      title,
      description,
      category,
      difficulty,
      questions,
      playsCount: 0,
      createdAt: new Date().toISOString(),
      creatorId: user.uid
    };

    onCreateQuiz(newQuiz);
    
    // Reset form
    setTitle("");
    setDescription("");
    setQuestions([]);
  };

  // Submission handler for custom category creation
  const handleAddCustomCategory = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newCatName.trim()) return;

    const newId = `cat-custom-${Date.now()}`;
    const newCategory: CategoryItem = {
      id: newId,
      name: newCatName.trim(),
      icon: newCatIcon,
      color: newCatColor,
      gradient: `from-[${newCatColor}] to-slate-800`,
      description: `Quiz personnalisés pour la catégorie ${newCatName.trim()}`
    };

    onAddCategory(newCategory);
    setCategory(newCategory.name); // Auto-select the newly added category
    setNewCatName("");
    setShowAddCategory(false);
  };

  // Connect to Express server's Gemini API route!
  const handleGenerateAIQuiz = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!aiTopic.trim()) return;

    setIsGenerating(true);
    setAiError("");
    setAiGeneratedQuiz(null);

    // Map AI question format to active backend questionTypes list
    let questionTypes = ["qcm_single", "qcm_multi", "vrai_faux", "libre"];
    if (aiQuestionFormat === "qcm") {
      questionTypes = ["qcm_single", "qcm_multi"];
    } else if (aiQuestionFormat === "vrai_faux") {
      questionTypes = ["vrai_faux"];
    } else if (aiQuestionFormat === "libre") {
      questionTypes = ["libre"];
    }

    // Capture user performance history to customize and personalize
    const playedIds = user.history.map(h => h.quizId);
    const failedIds = user.failedQuestionIds || [];
    const weakCategory = user.history.length > 0 ? 
      user.history.sort((a,b) => a.score - b.score)[0]?.category : "";
    const performanceContext = weakCategory 
      ? `L'utilisateur a des difficultés particulières en "${weakCategory}" (taux de réussite bas).` 
      : `L'utilisateur a un taux de réussite de ${user.successRate || 75}%.`;

    try {
      const res = await fetch("/api/gemini/generate-quiz", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          topic: aiTopic,
          category,
          difficulty,
          count: aiQuestionsCount,
          playedQuestionIds: playedIds,
          failedQuestionIds: failedIds,
          userPerformance: performanceContext,
          questionTypes
        })
      });

      if (!res.ok) {
        throw new Error("Impossible de générer le quiz. Veuillez réessayer.");
      }

      const data = await res.json();
      
      // Structure into Quiz object
      const generatedQuiz: Quiz = {
        id: `quiz-ai-${Date.now()}`,
        title: data.title || `Quiz sur ${aiTopic}`,
        description: data.description || `Quiz généré automatiquement par l'IA sur ${aiTopic}`,
        category: data.category || category,
        difficulty: (data.difficulty as QuizDifficulty) || difficulty,
        questions: data.questions.map((q: any, idx: number) => ({
          id: `q-ai-${idx}-${Date.now()}-${Math.floor(Math.random() * 1000)}`,
          questionText: q.questionText,
          type: q.type || "qcm_single",
          options: q.options || [],
          correctAnswerIndex: q.correctAnswerIndex,
          correctAnswerIndices: q.correctAnswerIndices || [],
          correctFreeText: q.correctFreeText || "",
          explanation: q.explanation || "",
          recommendedTime: q.recommendedTime || 15,
          imageUrl: q.imageUrl || "",
          category: data.category || category,
          difficulty: (data.difficulty as QuizDifficulty) || difficulty
        })),
        playsCount: 0,
        createdAt: new Date().toISOString(),
        creatorId: user.uid
      };

      setAiGeneratedQuiz(generatedQuiz);
    } catch (err: any) {
      console.error(err);
      setAiError(err.message || "Une erreur est survenue lors de l'appel au serveur.");
    } finally {
      setIsGenerating(false);
    }
  };

  const handleSaveAIGeneratedQuiz = () => {
    if (!aiGeneratedQuiz) return;
    onCreateQuiz(aiGeneratedQuiz);
    setAiGeneratedQuiz(null);
    setAiTopic("");
  };

  return (
    <div className="flex-1 flex flex-col bg-slate-50 dark:bg-slate-950 overflow-hidden">
      
      {/* Header */}
      <div className="p-5 pb-3 border-b border-slate-100 dark:border-slate-800/60 shrink-0 bg-white dark:bg-slate-950">
        <h2 className="text-xl font-extrabold font-display text-slate-950 dark:text-white">Créer un Quiz</h2>
        <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">Rédige un défi manuellement ou laisse l'IA de Gemini le concevoir.</p>

        {/* Toggle Segment Bar */}
        <div className="flex bg-slate-100 dark:bg-slate-900 rounded-2xl p-1 mt-4">
          <button
            onClick={() => setMode("ai")}
            className={`flex-1 py-2.5 rounded-xl text-xs font-bold flex items-center justify-center gap-1.5 transition-all cursor-pointer ${
              mode === "ai"
                ? "bg-white dark:bg-slate-800 text-blue-500 shadow-sm font-black"
                : "text-slate-500 dark:text-slate-400"
            }`}
          >
            <Sparkles className="w-3.5 h-3.5 fill-current" />
            IA Générative
          </button>
          <button
            onClick={() => setMode("manual")}
            className={`flex-1 py-2.5 rounded-xl text-xs font-bold flex items-center justify-center gap-1.5 transition-all cursor-pointer ${
              mode === "manual"
                ? "bg-white dark:bg-slate-800 text-blue-500 shadow-sm font-black"
                : "text-slate-500 dark:text-slate-400"
            }`}
          >
            <Plus className="w-3.5 h-3.5" />
            Manuel
          </button>
        </div>
      </div>

      {/* Main Form Scroller */}
      <div className="flex-1 overflow-y-auto p-5 space-y-5">
        
        {/* ================= MODE IA ================= */}
        {mode === "ai" && (
          <div className="space-y-4">
            {!aiGeneratedQuiz && !isGenerating && (
              <form onSubmit={handleGenerateAIQuiz} className="space-y-4">
                
                {/* Topic field */}
                <div className="space-y-2">
                  <label className="text-xs font-black text-slate-500 dark:text-slate-400 uppercase tracking-wider">
                    Sujet du quiz
                  </label>
                  <input
                    type="text"
                    value={aiTopic}
                    onChange={(e) => setAiTopic(e.target.value)}
                    placeholder="Ex: Les récifs coralliens, La conquête de l'espace, Harry Potter..."
                    className="w-full px-4 py-3.5 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl text-xs font-semibold focus:outline-none focus:ring-2 focus:ring-blue-500 text-slate-900 dark:text-white transition-all"
                    required
                  />
                </div>

                 {/* Category selection */}
                <div className="space-y-2">
                  <div className="flex justify-between items-center">
                    <label className="text-xs font-black text-slate-500 dark:text-slate-400 uppercase tracking-wider">
                      Catégorie associée
                    </label>
                    <button
                      type="button"
                      onClick={() => setShowAddCategory(!showAddCategory)}
                      className="text-[10px] font-black text-blue-500 dark:text-blue-400 hover:underline flex items-center gap-1 cursor-pointer"
                    >
                      {showAddCategory ? "Annuler" : "➕ Créer une catégorie"}
                    </button>
                  </div>

                  <AnimatePresence>
                    {showAddCategory && (
                      <motion.div
                        initial={{ opacity: 0, height: 0 }}
                        animate={{ opacity: 1, height: "auto" }}
                        exit={{ opacity: 0, height: 0 }}
                        className="p-4 bg-slate-100 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl space-y-3 overflow-hidden mb-2"
                      >
                        <h4 className="text-[11px] font-black uppercase text-slate-700 dark:text-slate-300 flex items-center gap-1.5">
                          <Palette className="w-3.5 h-3.5 text-blue-500" />
                          Nouvelle catégorie personnalisée
                        </h4>
                        <div className="space-y-2">
                          <input
                            type="text"
                            value={newCatName}
                            onChange={(e) => setNewCatName(e.target.value)}
                            placeholder="Ex: Espace, Harry Potter, Langues..."
                            className="w-full px-3 py-2.5 bg-white dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl text-xs font-semibold focus:outline-none focus:ring-1 focus:ring-blue-500 text-slate-900 dark:text-white"
                          />
                          <div className="flex gap-2 items-center">
                            <span className="text-[10px] font-bold text-slate-500">Couleur:</span>
                            {["#3b82f6", "#10b981", "#ef4444", "#f59e0b", "#8b5cf6", "#ec4899", "#14b8a6"].map(c => (
                              <button
                                key={c}
                                type="button"
                                onClick={() => setNewCatColor(c)}
                                className={`w-5 h-5 rounded-full border cursor-pointer transition-transform ${newCatColor === c ? "scale-115 border-slate-900 dark:border-white" : "border-transparent"}`}
                                style={{ backgroundColor: c }}
                              />
                            ))}
                          </div>
                          <button
                            type="button"
                            onClick={handleAddCustomCategory}
                            disabled={!newCatName.trim()}
                            className="w-full py-2 bg-blue-500 hover:bg-blue-600 disabled:opacity-50 text-white font-bold rounded-xl text-xs cursor-pointer"
                          >
                            Ajouter cette catégorie
                          </button>
                        </div>
                      </motion.div>
                    )}
                  </AnimatePresence>

                  <select
                    value={category}
                    onChange={(e) => setCategory(e.target.value)}
                    className="w-full px-4 py-3.5 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl text-xs font-bold focus:outline-none focus:ring-2 focus:ring-blue-500 text-slate-900 dark:text-white cursor-pointer"
                  >
                    {categories.map(cat => (
                      <option key={cat.id} value={cat.name}>{cat.name}</option>
                    ))}
                  </select>
                </div>

                {/* Grid for Difficulty, Question Count & Format */}
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <label className="text-xs font-black text-slate-500 dark:text-slate-400 uppercase tracking-wider">
                      Difficulté
                    </label>
                    <select
                      value={difficulty}
                      onChange={(e) => setDifficulty(e.target.value as QuizDifficulty)}
                      className="w-full px-4 py-3.5 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl text-xs font-bold focus:outline-none focus:ring-2 focus:ring-blue-500 text-slate-900 dark:text-white cursor-pointer"
                    >
                      <option value={QuizDifficulty.FACILE}>Facile</option>
                      <option value={QuizDifficulty.MOYEN}>Moyen</option>
                      <option value={QuizDifficulty.DIFFICILE}>Difficile</option>
                      <option value={QuizDifficulty.EXPERT}>Expert</option>
                    </select>
                  </div>

                  <div className="space-y-2">
                    <label className="text-xs font-black text-slate-500 dark:text-slate-400 uppercase tracking-wider">
                      Questions
                    </label>
                    <select
                      value={aiQuestionsCount}
                      onChange={(e) => setAiQuestionsCount(Number(e.target.value))}
                      className="w-full px-4 py-3.5 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl text-xs font-bold focus:outline-none focus:ring-2 focus:ring-blue-500 text-slate-900 dark:text-white cursor-pointer"
                    >
                      <option value={3}>3 Questions</option>
                      <option value={5}>5 Questions</option>
                      <option value={8}>8 Questions</option>
                    </select>
                  </div>
                </div>

                {/* AI Question Format selection */}
                <div className="space-y-2">
                  <label className="text-xs font-black text-slate-500 dark:text-slate-400 uppercase tracking-wider">
                    Format des questions
                  </label>
                  <select
                    value={aiQuestionFormat}
                    onChange={(e) => setAiQuestionFormat(e.target.value as any)}
                    className="w-full px-4 py-3.5 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl text-xs font-bold focus:outline-none focus:ring-2 focus:ring-blue-500 text-slate-900 dark:text-white cursor-pointer"
                  >
                    <option value="mixte">Mixte (QCM, Vrai/Faux, Réponse libre)</option>
                    <option value="qcm">QCM uniquement (Choix uniques & multiples)</option>
                    <option value="vrai_faux">Vrai / Faux uniquement</option>
                    <option value="libre">Réponse libre uniquement</option>
                  </select>
                </div>

                {aiError && (
                  <div className="p-3 bg-red-50 dark:bg-red-950/20 text-red-500 rounded-xl text-xs font-semibold border border-red-100 dark:border-red-900/40">
                    {aiError}
                  </div>
                )}

                {/* Run Generator CTA */}
                <button
                  type="submit"
                  className="w-full py-4 bg-gradient-to-r from-blue-500 to-indigo-600 hover:from-blue-600 hover:to-indigo-700 text-white rounded-2xl text-xs font-black flex items-center justify-center gap-2 shadow-lg shadow-blue-500/10 cursor-pointer transition-all active:scale-98"
                >
                  <BrainCircuit className="w-4 h-4 fill-current" />
                  Générer le quiz avec l'IA
                </button>
              </form>
            )}

            {/* AI Generation Loader state */}
            {isGenerating && (
              <div className="flex flex-col items-center justify-center text-center py-16 px-4 space-y-5">
                <div className="relative">
                  <div className="w-16 h-16 rounded-full border-4 border-slate-100 border-t-blue-500 animate-spin"></div>
                  <Sparkles className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-6 h-6 text-indigo-500 fill-current animate-pulse" />
                </div>
                <div>
                  <h3 className="text-sm font-extrabold text-slate-900 dark:text-white">Création en cours...</h3>
                  <p className="text-xs text-slate-500 dark:text-slate-400 mt-1 max-w-xs leading-relaxed">
                    Gemini est en train de rédiger des questions captivantes et des explications en français. Veuillez patienter quelques secondes.
                  </p>
                </div>
              </div>
            )}

            {/* AI Result Review State */}
            {aiGeneratedQuiz && (
              <motion.div 
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                className="space-y-4"
              >
                <div className="p-4 bg-emerald-50 dark:bg-emerald-950/20 border border-emerald-100 dark:border-emerald-900/40 rounded-2xl">
                  <div className="flex gap-2 items-center text-emerald-600 dark:text-emerald-400 text-xs font-black">
                    <Check className="w-4 h-4" />
                    Quiz généré avec succès !
                  </div>
                </div>

                {/* Generated Quiz summary Card */}
                <div className="p-5 bg-white dark:bg-slate-900 rounded-3xl border border-slate-100 dark:border-slate-800/60 android-shadow">
                  <span className="text-[9px] font-black uppercase text-blue-500 px-2 py-0.5 rounded-md bg-blue-50 dark:bg-blue-950/40">
                    {aiGeneratedQuiz.category} • {aiGeneratedQuiz.difficulty}
                  </span>
                  <h3 className="text-base font-black text-slate-900 dark:text-white mt-2">
                    {aiGeneratedQuiz.title}
                  </h3>
                  <p className="text-xs text-slate-500 dark:text-slate-400 mt-1 leading-relaxed">
                    {aiGeneratedQuiz.description}
                  </p>

                  <div className="border-t border-slate-100 dark:border-slate-800/60 pt-3 mt-4 space-y-2">
                    <span className="text-xs font-black text-slate-400 uppercase tracking-wider block">
                      Aperçu des questions ({aiGeneratedQuiz.questions.length})
                    </span>
                    <div className="space-y-2">
                      {aiGeneratedQuiz.questions.map((q, idx) => (
                        <div key={q.id} className="text-xs text-slate-700 dark:text-slate-300 flex gap-2">
                          <span className="font-extrabold text-blue-500">{idx + 1}.</span>
                          <span className="font-medium truncate">{q.questionText}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>

                <div className="flex gap-3">
                  <button
                    onClick={() => setAiGeneratedQuiz(null)}
                    className="flex-1 py-4 bg-slate-100 dark:bg-slate-900 text-slate-700 dark:text-slate-300 text-xs font-bold rounded-2xl cursor-pointer transition-all active:scale-98"
                  >
                    Recommencer
                  </button>
                  <button
                    onClick={handleSaveAIGeneratedQuiz}
                    className="flex-1 py-4 bg-blue-500 hover:bg-blue-600 text-white text-xs font-black rounded-2xl flex items-center justify-center gap-1.5 shadow-lg shadow-blue-500/10 cursor-pointer transition-all active:scale-98"
                  >
                    <Save className="w-4 h-4" />
                    Enregistrer
                  </button>
                </div>
              </motion.div>
            )}

          </div>
        )}

        {/* ================= MODE MANUEL ================= */}
        {mode === "manual" && (
          <form onSubmit={handleSaveManualQuiz} className="space-y-5">
            
            {/* Metadata segment */}
            <div className="space-y-4 p-5 bg-white dark:bg-slate-900 rounded-3xl border border-slate-100 dark:border-slate-800/60 android-shadow">
              <h3 className="text-xs font-black text-slate-400 uppercase tracking-wider flex items-center gap-1.5">
                <BookOpen className="w-4 h-4 text-blue-500" />
                Informations du quiz
              </h3>

              {/* Title input */}
              <div className="space-y-1.5">
                <label className="text-[10px] font-black text-slate-500 uppercase tracking-wider">
                  Titre du quiz
                </label>
                <input
                  type="text"
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  placeholder="Ex: Mon Super Quiz d'Histoire"
                  className="w-full px-4 py-3 bg-slate-50 dark:bg-slate-950 border border-slate-100 dark:border-slate-800 rounded-2xl text-xs font-semibold focus:outline-none focus:ring-2 focus:ring-blue-500"
                  required
                />
              </div>

              {/* Description input */}
              <div className="space-y-1.5">
                <label className="text-[10px] font-black text-slate-500 uppercase tracking-wider">
                  Description
                </label>
                <textarea
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  placeholder="Explique brièvement de quoi parle ton quiz..."
                  rows={2}
                  className="w-full px-4 py-3 bg-slate-50 dark:bg-slate-950 border border-slate-100 dark:border-slate-800 rounded-2xl text-xs font-semibold focus:outline-none focus:ring-2 focus:ring-blue-500 resize-none"
                  required
                />
              </div>

              {/* Dropdowns row */}
              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1.5">
                  <label className="text-[10px] font-black text-slate-500 uppercase tracking-wider">
                    Catégorie
                  </label>
                  <select
                    value={category}
                    onChange={(e) => setCategory(e.target.value)}
                    className="w-full px-3 py-3 bg-slate-50 dark:bg-slate-950 border border-slate-100 dark:border-slate-800 rounded-2xl text-xs font-bold focus:outline-none focus:ring-2 focus:ring-blue-500 cursor-pointer"
                  >
                    {categories.map(cat => (
                      <option key={cat.id} value={cat.name}>{cat.name}</option>
                    ))}
                  </select>
                </div>

                <div className="space-y-1.5">
                  <label className="text-[10px] font-black text-slate-500 uppercase tracking-wider">
                    Difficulté
                  </label>
                  <select
                    value={difficulty}
                    onChange={(e) => setDifficulty(e.target.value as QuizDifficulty)}
                    className="w-full px-3 py-3 bg-slate-50 dark:bg-slate-950 border border-slate-100 dark:border-slate-800 rounded-2xl text-xs font-bold focus:outline-none focus:ring-2 focus:ring-blue-500 cursor-pointer"
                  >
                    <option value={QuizDifficulty.FACILE}>Facile</option>
                    <option value={QuizDifficulty.MOYEN}>Moyen</option>
                    <option value={QuizDifficulty.DIFFICILE}>Difficile</option>
                    <option value={QuizDifficulty.EXPERT}>Expert</option>
                  </select>
                </div>
              </div>
            </div>

            {/* Questions list preview */}
            {questions.length > 0 && (
              <div className="space-y-2">
                <span className="text-[10px] font-black text-slate-400 uppercase tracking-wider block">
                  Questions ajoutées ({questions.length})
                </span>
                <div className="space-y-2">
                  {questions.map((q, idx) => (
                    <div 
                      key={q.id}
                      className="p-3 bg-white dark:bg-slate-900 rounded-2xl border border-slate-100 dark:border-slate-800/60 android-shadow flex items-center justify-between"
                    >
                      <div className="overflow-hidden pr-3">
                        <p className="text-xs font-extrabold text-slate-800 dark:text-slate-200 truncate">
                          {idx + 1}. {q.questionText}
                        </p>
                        <span className="text-[9px] font-bold text-emerald-500 block mt-0.5">
                          Correct: Option {q.correctAnswerIndex + 1}
                        </span>
                      </div>
                      <button
                        type="button"
                        onClick={() => handleRemoveQuestion(idx)}
                        className="text-red-500 hover:text-red-600 p-1 rounded-lg hover:bg-red-50 dark:hover:bg-red-950/20 shrink-0 cursor-pointer"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Build Single Question Block */}
            <div className="p-5 bg-white dark:bg-slate-900 rounded-3xl border border-slate-100 dark:border-slate-800/60 android-shadow space-y-4">
              <h3 className="text-xs font-black text-blue-500 uppercase tracking-wider">
                Nouvelle Question
              </h3>

              {/* Question text */}
              <div className="space-y-1.5">
                <label className="text-[10px] font-black text-slate-500 uppercase tracking-wider">
                  Texte de la question
                </label>
                <input
                  type="text"
                  value={currentQText}
                  onChange={(e) => setCurrentQText(e.target.value)}
                  placeholder="Saisis ta question ici..."
                  className="w-full px-4 py-3 bg-slate-50 dark:bg-slate-950 border border-slate-100 dark:border-slate-800 rounded-2xl text-xs font-semibold focus:outline-none"
                />
              </div>

              {/* Options list */}
              <div className="space-y-2">
                <label className="text-[10px] font-black text-slate-500 uppercase tracking-wider block">
                  Options (4 choix obligatoires)
                </label>
                {options.map((opt, oIdx) => (
                  <div key={oIdx} className="flex gap-2">
                    <button
                      type="button"
                      onClick={() => setCorrectIndex(oIdx)}
                      className={`w-9 h-9 rounded-xl border font-bold text-xs shrink-0 cursor-pointer flex items-center justify-center transition-all ${
                        correctIndex === oIdx
                          ? "bg-emerald-500 text-white border-emerald-500"
                          : "bg-slate-50 dark:bg-slate-950 border-slate-200 dark:border-slate-800 text-slate-400"
                      }`}
                    >
                      {correctIndex === oIdx ? <Check className="w-4 h-4" /> : oIdx + 1}
                    </button>
                    <input
                      type="text"
                      value={opt}
                      onChange={(e) => {
                        const nextOpts = [...options];
                        nextOpts[oIdx] = e.target.value;
                        setOptions(nextOpts);
                      }}
                      placeholder={`Option ${oIdx + 1}`}
                      className="flex-1 px-4 py-2 bg-slate-50 dark:bg-slate-950 border border-slate-100 dark:border-slate-800 rounded-2xl text-xs font-semibold focus:outline-none"
                    />
                  </div>
                ))}
              </div>

              {/* Explanation */}
              <div className="space-y-1.5">
                <label className="text-[10px] font-black text-slate-500 uppercase tracking-wider">
                  Explication de la bonne réponse
                </label>
                <input
                  type="text"
                  value={explanation}
                  onChange={(e) => setExplanation(e.target.value)}
                  placeholder="Pourquoi cette réponse est-elle correcte ?"
                  className="w-full px-4 py-3 bg-slate-50 dark:bg-slate-950 border border-slate-100 dark:border-slate-800 rounded-2xl text-xs font-semibold focus:outline-none"
                />
              </div>

              <button
                type="button"
                onClick={handleAddQuestion}
                className="w-full py-3 bg-slate-100 dark:bg-slate-950 hover:bg-slate-200 text-blue-500 text-xs font-extrabold rounded-2xl flex items-center justify-center gap-1.5 cursor-pointer border border-dashed border-blue-500/20 transition-colors"
              >
                <Plus className="w-4 h-4" />
                Ajouter la question au quiz
              </button>
            </div>

            {/* Save Whole Quiz Button */}
            <button
              type="submit"
              disabled={questions.length === 0}
              className={`w-full py-4 rounded-2xl text-xs font-black flex items-center justify-center gap-2 shadow-md cursor-pointer transition-all ${
                questions.length === 0
                  ? "bg-slate-200 dark:bg-slate-800 text-slate-400 cursor-not-allowed"
                  : "bg-blue-500 hover:bg-blue-600 text-white shadow-blue-500/10 active:scale-98"
              }`}
            >
              <Save className="w-4 h-4" />
              Finaliser et Publier le Quiz
            </button>
          </form>
        )}

      </div>

    </div>
  );
}
