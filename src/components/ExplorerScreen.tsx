import { useState, useEffect } from "react";
import { Quiz } from "../types";
import { CATEGORIES } from "../data";
import IconHelper from "./IconHelper";
import { Search, ChevronRight, Gamepad2, Layers } from "lucide-react";

interface ExplorerScreenProps {
  quizzes: Quiz[];
  onSelectQuiz: (quiz: Quiz) => void;
  preselectedCategory: string | null;
  clearPreselectedCategory: () => void;
}

export default function ExplorerScreen({ 
  quizzes, 
  onSelectQuiz, 
  preselectedCategory,
  clearPreselectedCategory
}: ExplorerScreenProps) {
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedCategory, setSelectedCategory] = useState<string>("Tous");

  // Handle preselected category from home navigation
  useEffect(() => {
    if (preselectedCategory) {
      setSelectedCategory(preselectedCategory);
      // We clear it so it doesn't lock the category choice permanently
      clearPreselectedCategory();
    }
  }, [preselectedCategory, clearPreselectedCategory]);

  const filteredQuizzes = quizzes.filter((quiz) => {
    const matchesSearch = quiz.title.toLowerCase().includes(searchQuery.toLowerCase()) || 
                          quiz.description.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesCategory = selectedCategory === "Tous" || quiz.category === selectedCategory;
    return matchesSearch && matchesCategory;
  });

  return (
    <div className="flex-1 flex flex-col bg-slate-50 dark:bg-slate-950 overflow-hidden">
      
      {/* Header & Search */}
      <div className="p-5 pb-3 space-y-4 bg-white dark:bg-slate-950 border-b border-slate-100 dark:border-slate-800/60 shrink-0">
        <div>
          <h2 className="text-xl font-extrabold font-display text-slate-950 dark:text-white">Explorer les Quiz</h2>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">Parcours des centaines de quiz ou crée le tien !</p>
        </div>

        {/* Search Input bar */}
        <div className="relative">
          <span className="absolute inset-y-0 left-4 flex items-center text-slate-400">
            <Search className="w-4 h-4" />
          </span>
          <input
            type="text"
            placeholder="Rechercher un thème, mot-clé..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-11 pr-4 py-3 bg-slate-100 dark:bg-slate-900 border-none rounded-2xl text-xs font-semibold focus:outline-none focus:ring-2 focus:ring-blue-500/50 text-slate-900 dark:text-white transition-all"
          />
        </div>
      </div>

      {/* Category Chips - Horizontal Scroll */}
      <div className="py-3 px-5 overflow-x-auto flex gap-2 shrink-0 bg-white dark:bg-slate-950/40 border-b border-slate-100 dark:border-slate-800/20 select-none scrollbar-none">
        <button
          onClick={() => setSelectedCategory("Tous")}
          className={`px-4 py-2 rounded-xl text-xs font-bold transition-all shrink-0 cursor-pointer ${
            selectedCategory === "Tous"
              ? "bg-blue-500 text-white shadow-md shadow-blue-500/10"
              : "bg-slate-100 dark:bg-slate-900 text-slate-600 dark:text-slate-400 hover:bg-slate-200"
          }`}
        >
          Tous ({quizzes.length})
        </button>

        {CATEGORIES.map((cat) => {
          const categoryQuizzesCount = quizzes.filter(q => q.category === cat.name).length;
          return (
            <button
              key={cat.id}
              onClick={() => setSelectedCategory(cat.name)}
              className={`px-4 py-2 rounded-xl text-xs font-bold flex items-center gap-1.5 transition-all shrink-0 cursor-pointer ${
                selectedCategory === cat.name
                  ? "bg-blue-500 text-white shadow-md shadow-blue-500/10"
                  : "bg-slate-100 dark:bg-slate-900 text-slate-600 dark:text-slate-400 hover:bg-slate-200"
              }`}
            >
              <div 
                className="w-2 h-2 rounded-full" 
                style={{ backgroundColor: cat.color }}
              />
              {cat.name} ({categoryQuizzesCount})
            </button>
          );
        })}
      </div>

      {/* Quizzes List */}
      <div className="flex-1 overflow-y-auto px-5 py-4 space-y-4">
        {filteredQuizzes.length > 0 ? (
          filteredQuizzes.map((quiz) => {
            const matchedCategoryObj = CATEGORIES.find(c => c.name === quiz.category);
            return (
              <div
                key={quiz.id}
                onClick={() => onSelectQuiz(quiz)}
                className="p-4 bg-white dark:bg-slate-900 rounded-3xl border border-slate-100 dark:border-slate-800/60 android-shadow flex flex-col justify-between hover:border-blue-500/20 cursor-pointer active:scale-99 transition-all"
              >
                <div className="flex items-start justify-between gap-3">
                  <div className="flex items-start gap-3.5">
                    <div 
                      className="w-12 h-12 rounded-2xl flex items-center justify-center text-white shrink-0 shadow-sm"
                      style={{ backgroundColor: matchedCategoryObj?.color || "#3b82f6" }}
                    >
                      <IconHelper name={matchedCategoryObj?.icon || "Gamepad2"} className="w-5 h-5" />
                    </div>
                    <div>
                      <h3 className="text-sm font-black text-slate-900 dark:text-white leading-snug">
                        {quiz.title}
                      </h3>
                      <p className="text-xs text-slate-500 dark:text-slate-400 line-clamp-2 mt-1 font-medium leading-relaxed">
                        {quiz.description}
                      </p>
                    </div>
                  </div>
                </div>

                <div className="flex items-center justify-between border-t border-slate-50 dark:border-slate-800/30 pt-3 mt-3">
                  <div className="flex items-center gap-2">
                    <span className="text-[10px] font-black uppercase px-2 py-0.5 rounded-md text-slate-500 dark:text-slate-400 bg-slate-100 dark:bg-slate-800">
                      {quiz.questions.length} Questions
                    </span>
                    <span className={`text-[10px] font-black uppercase px-2 py-0.5 rounded-md ${
                      quiz.difficulty === "Facile" ? "text-emerald-600 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-950/30" :
                      quiz.difficulty === "Moyen" ? "text-amber-600 dark:text-amber-400 bg-amber-50 dark:bg-amber-950/30" :
                      "text-rose-600 dark:text-rose-400 bg-rose-50 dark:bg-rose-950/30"
                    }`}>
                      {quiz.difficulty}
                    </span>
                  </div>
                  <span className="text-[10px] text-slate-400 font-extrabold">
                    {quiz.playsCount} parties jouées
                  </span>
                </div>
              </div>
            );
          })
        ) : (
          <div className="flex flex-col items-center justify-center text-center py-12 px-6">
            <div className="w-16 h-16 rounded-full bg-slate-100 dark:bg-slate-900 flex items-center justify-center text-slate-400 mb-4">
              <Layers className="w-7 h-7" />
            </div>
            <h3 className="text-sm font-extrabold text-slate-900 dark:text-white">Aucun quiz trouvé</h3>
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-1 max-w-xs leading-relaxed">
              Nous n'avons pas trouvé de quiz correspondant à tes critères de recherche. Essaie d'autres termes !
            </p>
          </div>
        )}
      </div>

    </div>
  );
}
