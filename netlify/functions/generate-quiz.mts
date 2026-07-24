import { GoogleGenAI, Type } from "@google/genai";

// Cache basique ou fallback
const fallbackQuizzes: Record<string, any> = {
  "general_default": {
    title: "Quiz Culture Générale Infini",
    description: "Un quiz varié conçu pour stimuler ton cerveau sur différents sujets.",
    questions: [
      {
        type: "qcm_single",
        questionText: "Combien de pays composent l'Union Européenne actuellement ?",
        options: ["25", "27", "28", "30"],
        correctAnswerIndex: 1,
        explanation: "L'Union Européenne compte 27 États membres.",
        recommendedTime: 15,
        imageSearchKeyword: "geography"
      },
      {
        type: "vrai_faux",
        questionText: "Le mont Blanc est le plus haut sommet de toute l'Europe.",
        options: ["Vrai", "Faux"],
        correctAnswerIndex: 1,
        explanation: "Faux. Le plus haut sommet d'Europe est le mont Elbrouz.",
        recommendedTime: 15,
        imageSearchKeyword: "geography"
      }
    ]
  }
};

function topicKeyword(text: string, category: string): string {
  const t = (text + " " + category).toLowerCase();
  if (t.includes("planète") || t.includes("espace") || t.includes("astronomie")) return "space";
  if (t.includes("ordinateur") || t.includes("tech") || t.includes("ia")) return "technology";
  if (t.includes("physique") || t.includes("science")) return "science";
  if (t.includes("histoire")) return "history";
  if (t.includes("géographie") || t.includes("pays")) return "geography";
  if (t.includes("sport")) return "sport";
  if (t.includes("film") || t.includes("cinéma")) return "cinema";
  if (t.includes("musique")) return "music";
  if (t.includes("jeu") || t.includes("gaming")) return "games";
  return "general";
}

function mapKeywordToUnsplash(keyword: string): string {
  const images: Record<string, string> = {
    space: "https://images.unsplash.com/photo-1451187580459-43490279c0fa?w=600&auto=format&fit=crop&q=60",
    technology: "https://images.unsplash.com/photo-1518770660439-4636190af475?w=600&auto=format&fit=crop&q=60",
    science: "https://images.unsplash.com/photo-1507668077129-56e32842fceb?w=600&auto=format&fit=crop&q=60",
    math: "https://images.unsplash.com/photo-1635070041078-e363dbe005cb?w=600&auto=format&fit=crop&q=60",
    history: "https://images.unsplash.com/photo-1447069387593-a5de0862481e?w=600&auto=format&fit=crop&q=60",
    geography: "https://images.unsplash.com/photo-1524661135-423995f22d0b?w=600&auto=format&fit=crop&q=60",
    sport: "https://images.unsplash.com/photo-1461896836934-ffe607ba8211?w=600&auto=format&fit=crop&q=60",
    cinema: "https://images.unsplash.com/photo-1489599849927-2ee91cede3ba?w=600&auto=format&fit=crop&q=60",
    music: "https://images.unsplash.com/photo-1511671782779-c97d3d27a1d4?w=600&auto=format&fit=crop&q=60",
    games: "https://images.unsplash.com/photo-1538481199705-c710c4e965fc?w=600&auto=format&fit=crop&q=60",
    general: "https://images.unsplash.com/photo-1513001900722-370f803f498d?w=600&auto=format&fit=crop&q=60"
  };
  return images[keyword] || images.general;
}

function validateAndFixQuiz(data: any, defaultCategory: string, defaultDifficulty: string, topic: string): any {
  if (!data) throw new Error("Données invalides.");
  const quiz = {
    title: data.title || `Quiz sur ${topic}`,
    description: data.description || `Explore tes connaissances sur ${topic}.`,
    category: data.category || defaultCategory,
    difficulty: data.difficulty || defaultDifficulty,
    questions: [] as any[]
  };

  const sourceQuestions = Array.isArray(data.questions) ? data.questions : [];
  quiz.questions = sourceQuestions.map((q: any, idx: number) => {
    const type = q.type || "qcm_single";
    const questionText = q.questionText || "Question éducative ?";
    const explanation = q.explanation || "Explication intéressante.";
    const difficulty = q.difficulty || defaultDifficulty;
    const recommendedTime = Number(q.recommendedTime) || 15;
    let options = Array.isArray(q.options) ? q.options.filter(Boolean) : [];
    let correctAnswerIndex = typeof q.correctAnswerIndex === "number" ? q.correctAnswerIndex : 0;
    let correctAnswerIndices = Array.isArray(q.correctAnswerIndices) ? q.correctAnswerIndices.map(Number) : [];
    let correctFreeText = q.correctFreeText ? String(q.correctFreeText).trim() : "";

    if (type === "vrai_faux") {
      options = ["Vrai", "Faux"];
      if (correctAnswerIndex !== 0 && correctAnswerIndex !== 1) correctAnswerIndex = 0;
    } else if (type === "libre") {
      options = [];
      if (!correctFreeText) correctFreeText = "La réponse";
    } else if (type === "qcm_multi") {
      if (options.length < 2) options = ["Option A", "Option B", "Option C", "Option D"];
      if (correctAnswerIndices.length === 0) correctAnswerIndices = [0];
    } else {
      if (options.length < 2) options = ["Option A", "Option B", "Option C", "Option D"];
      if (correctAnswerIndex < 0 || correctAnswerIndex >= options.length) correctAnswerIndex = 0;
    }

    const keyword = (q.imageSearchKeyword || topicKeyword(questionText, defaultCategory)).toLowerCase();
    const imageUrl = mapKeywordToUnsplash(keyword);

    return {
      id: `q-ai-${idx}-${Date.now()}-${Math.floor(Math.random() * 1000)}`,
      questionText,
      type,
      options,
      correctAnswerIndex,
      correctAnswerIndices,
      correctFreeText,
      explanation,
      difficulty,
      recommendedTime,
      imageUrl,
      category: defaultCategory
    };
  });

  return quiz;
}

export default async (req: Request) => {
  if (req.method !== "POST") {
    return new Response(JSON.stringify({ error: "Méthode non autorisée" }), {
      status: 405,
      headers: { "Content-Type": "application/json" }
    });
  }

  try {
    const body = await req.json();
    const { 
      topic, 
      category = "Culture générale", 
      difficulty = "Moyen", 
      count = 5,
      level,
      questionTypes = ["qcm_single", "qcm_multi", "vrai_faux", "libre"]
    } = body;

    if (!topic) {
      return new Response(JSON.stringify({ error: "Sujet requis." }), { status: 400 });
    }

    const safeCategory = String(category || "Culture générale");
    const safeTopic = String(topic).trim();
    const safeLevel = level ? Math.max(1, Number(level) || 1) : null;
    
    let calcDifficulty = String(difficulty || "Moyen");
    if (safeLevel) {
      if (safeLevel <= 3) calcDifficulty = "Facile";
      else if (safeLevel <= 6) calcDifficulty = "Moyen";
      else if (safeLevel <= 9) calcDifficulty = "Difficile";
      else calcDifficulty = "Expert";
    }

    const rawApiKey = process.env.GEMINI_API_KEY;
    const apiKey = rawApiKey ? rawApiKey.trim().replace(/^['"]|['"]$/g, "") : undefined;

    if (!apiKey) {
      const fallback = validateAndFixQuiz(fallbackQuizzes.general_default, safeCategory, calcDifficulty, safeTopic);
      return new Response(JSON.stringify(fallback), {
        status: 200,
        headers: { "Content-Type": "application/json" }
      });
    }

    const ai = new GoogleGenAI({ apiKey });
    const prompt = `Crée un quiz éducatif et passionnant en français sur le thème : "${safeTopic}".
Catégorie : "${safeCategory}"
Difficulté : "${calcDifficulty}"
Nombre de questions : ${count}
Types autorisés : ${questionTypes.join(", ")}`;

    const modelsToTry = ["gemini-3.6-flash", "gemini-3.1-flash-lite", "gemini-flash-latest"];
    let text = "";

    for (const modelName of modelsToTry) {
      try {
        const response = await ai.models.generateContent({
          model: modelName,
          contents: prompt,
          config: {
            systemInstruction: "Tu es le moteur IA pour QuizMaster. Tu réponds uniquement en JSON valide.",
            responseMimeType: "application/json",
            responseSchema: {
              type: Type.OBJECT,
              properties: {
                title: { type: Type.STRING },
                description: { type: Type.STRING },
                category: { type: Type.STRING },
                difficulty: { type: Type.STRING },
                questions: {
                  type: Type.ARRAY,
                  items: {
                    type: Type.OBJECT,
                    properties: {
                      type: { type: Type.STRING },
                      questionText: { type: Type.STRING },
                      options: { type: Type.ARRAY, items: { type: Type.STRING } },
                      correctAnswerIndex: { type: Type.INTEGER },
                      correctAnswerIndices: { type: Type.ARRAY, items: { type: Type.INTEGER } },
                      correctFreeText: { type: Type.STRING },
                      explanation: { type: Type.STRING },
                      recommendedTime: { type: Type.INTEGER },
                      imageSearchKeyword: { type: Type.STRING }
                    },
                    required: ["type", "questionText", "options", "correctAnswerIndex", "correctAnswerIndices", "correctFreeText", "explanation", "recommendedTime", "imageSearchKeyword"]
                  }
                }
              },
              required: ["title", "description", "category", "difficulty", "questions"]
            }
          }
        });
        text = response.text || "";
        if (text) break;
      } catch (e) {
        // continue
      }
    }

    if (!text) {
      const fallback = validateAndFixQuiz(fallbackQuizzes.general_default, safeCategory, calcDifficulty, safeTopic);
      return new Response(JSON.stringify(fallback), { status: 200, headers: { "Content-Type": "application/json" } });
    }

    const rawQuiz = JSON.parse(text.trim());
    const finalizedQuiz = validateAndFixQuiz(rawQuiz, safeCategory, calcDifficulty, safeTopic);

    return new Response(JSON.stringify(finalizedQuiz), {
      status: 200,
      headers: { "Content-Type": "application/json" }
    });
  } catch (err: any) {
    return new Response(JSON.stringify({ error: err.message || "Erreur" }), {
      status: 500,
      headers: { "Content-Type": "application/json" }
    });
  }
};
