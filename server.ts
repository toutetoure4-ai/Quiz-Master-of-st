import express from "express";
import path from "path";
import { createServer as createViteServer } from "vite";
import { GoogleGenAI, Type } from "@google/genai";
import dotenv from "dotenv";

dotenv.config();

async function startServer() {
  const app = express();
  const PORT = 3000;

  app.use(express.json());

  // Initialisation sécurisée du SDK Google GenAI (Gemini)
  const apiKey = process.env.GEMINI_API_KEY;
  const ai = new GoogleGenAI({
    apiKey: apiKey || "MOCK_KEY",
    httpOptions: {
      headers: {
        'User-Agent': 'aistudio-build',
      }
    }
  });

  // Cache en mémoire pour optimiser les performances
  const quizCache = new Map<string, any>();

  // Helper pour mapper le sujet ou énoncé à un indice visuel Unsplash
  function topicKeyword(text: string, category: string): string {
    const t = (text + " " + category).toLowerCase();
    if (t.includes("planète") || t.includes("espace") || t.includes("astronomie") || t.includes("galaxie") || t.includes("nasa")) return "space";
    if (t.includes("ordinateur") || t.includes("programmation") || t.includes("ia") || t.includes("web") || t.includes("tech") || t.includes("numérique")) return "technology";
    if (t.includes("physique") || t.includes("chimie") || t.includes("biologie") || t.includes("atome") || t.includes("science") || t.includes("laboratoire")) return "science";
    if (t.includes("math") || t.includes("nombre") || t.includes("calcul") || t.includes("géométrie") || t.includes("équation")) return "math";
    if (t.includes("histoire") || t.includes("siècle") || t.includes("guerre") || t.includes("roi") || t.includes("empire") || t.includes("révolution")) return "history";
    if (t.includes("pays") || t.includes("carte") || t.includes("capitale") || t.includes("fleuve") || t.includes("montagne") || t.includes("continent")) return "geography";
    if (t.includes("sport") || t.includes("football") || t.includes("jeux olympiques") || t.includes("tennis") || t.includes("athlète")) return "sport";
    if (t.includes("film") || t.includes("cinéma") || t.includes("acteur") || t.includes("série") || t.includes("réalisateur")) return "cinema";
    if (t.includes("musique") || t.includes("chanson") || t.includes("guitare") || t.includes("piano") || t.includes("chanteur") || t.includes("orchestre")) return "music";
    if (t.includes("jeu") || t.includes("console") || t.includes("gaming") || t.includes("nintendo") || t.includes("playstation") || t.includes("xbox")) return "games";
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

  // Fonction de validation et auto-correction du schéma pour garantir la cohérence
  function validateAndFixQuiz(data: any, defaultCategory: string, defaultDifficulty: string, topic: string): any {
    if (!data) throw new Error("Données de quiz invalides.");

    const quiz = {
      title: data.title || `Quiz sur ${topic}`,
      description: data.description || `Explore tes connaissances sur ${topic} avec ce quiz généré par IA en français.`,
      category: data.category || defaultCategory,
      difficulty: data.difficulty || defaultDifficulty,
      questions: [] as any[]
    };

    const sourceQuestions = Array.isArray(data.questions) ? data.questions : [];

    quiz.questions = sourceQuestions.map((q: any, idx: number) => {
      const type = q.type || "qcm_single";
      const questionText = q.questionText || "Question éducative ?";
      const explanation = q.explanation || "Explication intéressante de la réponse.";
      const difficulty = q.difficulty || defaultDifficulty;
      const recommendedTime = Number(q.recommendedTime) || 15;
      
      let options = Array.isArray(q.options) ? q.options.filter(Boolean) : [];
      let correctAnswerIndex = typeof q.correctAnswerIndex === "number" ? q.correctAnswerIndex : 0;
      let correctAnswerIndices = Array.isArray(q.correctAnswerIndices) ? q.correctAnswerIndices.map(Number) : [];
      let correctFreeText = q.correctFreeText ? String(q.correctFreeText).trim() : "";

      if (type === "vrai_faux") {
        options = ["Vrai", "Faux"];
        if (correctAnswerIndex !== 0 && correctAnswerIndex !== 1) {
          correctAnswerIndex = 0;
        }
      } else if (type === "libre") {
        options = [];
        if (!correctFreeText) {
          correctFreeText = "La réponse";
        }
      } else if (type === "qcm_multi") {
        if (options.length < 2) {
          options = ["Option A", "Option B", "Option C", "Option D"];
        }
        if (correctAnswerIndices.length === 0) {
          correctAnswerIndices = [0];
        }
        correctAnswerIndices = correctAnswerIndices.filter(i => i >= 0 && i < options.length);
      } else { // qcm_single
        if (options.length < 2) {
          options = ["Option A", "Option B", "Option C", "Option D"];
        }
        if (correctAnswerIndex < 0 || correctAnswerIndex >= options.length) {
          correctAnswerIndex = 0;
        }
      }

      // Sélection d'une image d'illustration élégante sur Unsplash
      const keyword = (q.imageSearchKeyword || q.keyword || topicKeyword(questionText, defaultCategory)).toLowerCase();
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

  // Bibliothèque complète de questions hors-ligne en cas de panne d'API ou de clé manquante
  const fallbackQuizzes: Record<string, any> = {
    "sciences_facile": {
      title: "Quiz Découverte des Sciences",
      description: "Les notions scientifiques essentielles de notre monde quotidien.",
      questions: [
        {
          type: "vrai_faux",
          questionText: "L'eau bout à 100 degrés Celsius au niveau de la mer.",
          options: ["Vrai", "Faux"],
          correctAnswerIndex: 0,
          explanation: "Vrai. À la pression atmosphérique standard, le point d'ébullition de l'eau est exactement de 100 °C.",
          recommendedTime: 15,
          imageSearchKeyword: "science"
        },
        {
          type: "qcm_single",
          questionText: "Quelle planète est surnommée la planète rouge ?",
          options: ["Vénus", "Mars", "Jupiter", "Saturne"],
          correctAnswerIndex: 1,
          explanation: "Mars doit sa couleur rouge caractéristique à l'abondance d'oxyde de fer (rouille) sur sa surface.",
          recommendedTime: 15,
          imageSearchKeyword: "space"
        },
        {
          type: "libre",
          questionText: "Quelle formule chimique désigne l'eau pure ? (Entrer la formule)",
          options: [],
          correctFreeText: "H2O",
          explanation: "Chaque molécule d'eau est composée de deux atomes d'hydrogène reliés à un atome d'oxygène.",
          recommendedTime: 15,
          imageSearchKeyword: "science"
        }
      ]
    },
    "sciences_moyen": {
      title: "Quiz Exploration Scientifique",
      description: "Un quiz intermédiaire pour tester tes connaissances en biologie et physique.",
      questions: [
        {
          type: "qcm_single",
          questionText: "Quelle force maintient les planètes en orbite autour du Soleil ?",
          options: ["La force magnétique", "La gravité", "La force centrifuge", "La force nucléaire forte"],
          correctAnswerIndex: 1,
          explanation: "La gravité est la force d'attraction mutuelle qui s'exerce entre tous les corps massifs.",
          recommendedTime: 15,
          imageSearchKeyword: "space"
        },
        {
          type: "qcm_multi",
          questionText: "Quels sont les états fondamentaux courants de la matière dans notre quotidien ? (Plusieurs réponses)",
          options: ["Liquide", "Gazeux", "Plasma", "Solide"],
          correctAnswerIndices: [0, 1, 3],
          explanation: "Les trois états de la matière les plus courants sur Terre sont l'état solide, liquide et gazeux.",
          recommendedTime: 20,
          imageSearchKeyword: "science"
        }
      ]
    },
    "sciences_difficile": {
      title: "Quiz Sciences Avancées",
      description: "Un défi de haut niveau pour les amateurs de physique quantique et de biologie cellulaire.",
      questions: [
        {
          type: "qcm_single",
          questionText: "Quelle particule élémentaire porte une charge électrique négative ?",
          options: ["Le proton", "Le neutron", "L'électron", "Le quark"],
          correctAnswerIndex: 2,
          explanation: "L'électron est une particule élémentaire stable de charge négative qui gravite autour du noyau atomique.",
          recommendedTime: 15,
          imageSearchKeyword: "science"
        },
        {
          type: "libre",
          questionText: "Quel physicien a formulé la théorie de la Relativité Générale en 1915 ? (Nom de famille)",
          options: [],
          correctFreeText: "Einstein",
          explanation: "Albert Einstein a révolutionné la physique en décrivant la gravité comme une courbure de l'espace-temps.",
          recommendedTime: 25,
          imageSearchKeyword: "science"
        }
      ]
    },
    "history_moyen": {
      title: "Quiz Voyage dans l'Histoire",
      description: "Teste tes connaissances sur les grands empires et dates historiques.",
      questions: [
        {
          type: "qcm_single",
          questionText: "Qui était le premier empereur des Romains ?",
          options: ["Jules César", "Auguste", "Néron", "Marc Aurèle"],
          correctAnswerIndex: 1,
          explanation: "Auguste (né Octave) est devenu le premier empereur romain en 27 avant J.-C., marquant la fin de la République.",
          recommendedTime: 15,
          imageSearchKeyword: "history"
        },
        {
          type: "vrai_faux",
          questionText: "La Première Guerre mondiale s'est terminée par un armistice le 11 novembre 1918.",
          options: ["Vrai", "Faux"],
          correctAnswerIndex: 0,
          explanation: "Vrai. L'armistice a été signé dans un wagon dans la forêt de Compiègne à 5h du matin.",
          recommendedTime: 15,
          imageSearchKeyword: "history"
        }
      ]
    },
    "general_default": {
      title: "Quiz Culture Générale Infini",
      description: "Un quiz varié conçu pour stimuler ton cerveau sur différents sujets d'actualité.",
      questions: [
        {
          type: "qcm_single",
          questionText: "Combien de pays composent l'Union Européenne actuellement ?",
          options: ["25", "27", "28", "30"],
          correctAnswerIndex: 1,
          explanation: "L'Union Européenne compte 27 États membres depuis le départ officiel du Royaume-Uni (Brexit) en 2020.",
          recommendedTime: 15,
          imageSearchKeyword: "geography"
        },
        {
          type: "vrai_faux",
          questionText: "Le mont Blanc est le plus haut sommet de toute l'Europe.",
          options: ["Vrai", "Faux"],
          correctAnswerIndex: 1,
          explanation: "Faux. Le plus haut sommet d'Europe est le mont Elbrouz situé dans le Caucase russe (5642 mètres).",
          recommendedTime: 15,
          imageSearchKeyword: "geography"
        },
        {
          type: "libre",
          questionText: "Quel est le nom de la monnaie unique européenne ? (Entrer son nom)",
          options: [],
          correctFreeText: "Euro",
          explanation: "L'Euro est entré en circulation fiduciaire le 1er janvier 2002.",
          recommendedTime: 15,
          imageSearchKeyword: "general"
        }
      ]
    }
  };

  // API Route pour Génération de Quiz par IA
  app.post("/api/gemini/generate-quiz", async (req, res) => {
    try {
      const { 
        topic, 
        category = "Culture générale", 
        difficulty = "Moyen", 
        count = 5,
        playedQuestionIds = [],
        failedQuestionIds = [],
        userPerformance = "",
        questionTypes = ["qcm_single", "qcm_multi", "vrai_faux", "libre"]
      } = req.body;

      if (!topic) {
        return res.status(400).json({ error: "Le sujet du quiz est requis." });
      }

      // Recherche en cache d'abord pour optimiser les performances
      const cacheKey = `${topic.trim().toLowerCase()}_${category}_${difficulty}_${count}`;
      if (quizCache.has(cacheKey)) {
        console.log(`[Cache Hit] Quiz trouvé pour la clé: ${cacheKey}`);
        return res.json(quizCache.get(cacheKey));
      }

      // Fallback local instantané si pas de clé API
      if (!process.env.GEMINI_API_KEY) {
        console.warn("[API Key Missing] Utilisation de la bibliothèque locale de repli.");
        const key = `${category.toLowerCase() === "sciences" ? "sciences" : "history"}_${difficulty.toLowerCase() === "facile" ? "facile" : difficulty.toLowerCase() === "difficile" ? "difficile" : "moyen"}`;
        const defaultQuiz = fallbackQuizzes[key] || fallbackQuizzes["general_default"];
        const customQuiz = validateAndFixQuiz(defaultQuiz, category, difficulty, topic);
        return res.json(customQuiz);
      }

      // Prompt de conception enrichi
      const prompt = `Crée un quiz éducatif, précis, passionnant et entièrement rédigé en français sur le thème : "${topic}".
Détails de configuration :
- Catégorie : "${category}"
- Difficulté adaptée impérativement pour le niveau : "${difficulty}" (Facile, Moyen, Difficile, Expert)
- Nombre de questions requis : exactement ${count} questions.
- Types de questions autorisés : ${questionTypes.join(", ")}. Tu dois varier au maximum entre ces différents formats :
  1. "qcm_single" : Question à choix unique. Tu dois fournir l'array "options" de 4 choix et l'index correct de 0 à 3 "correctAnswerIndex".
  2. "qcm_multi" : Question à choix multiple. Tu dois fournir "options" de 4 choix, et un array "correctAnswerIndices" listant tous les index des bonnes réponses.
  3. "vrai_faux" : Question Vrai/Faux. L'array "options" doit être exactement ["Vrai", "Faux"], "correctAnswerIndex" doit être 0 ou 1.
  4. "libre" : Question à réponse libre courte et claire. Tu ne fournis aucun array "options", mais tu dois renseigner "correctFreeText" avec la réponse attendue en un ou deux mots.

Informations utilisateur (Personnalisation et Mémoire) :
${userPerformance ? `- Adaptabilité : L'utilisateur rencontre des difficultés sur : "${userPerformance}". Formule des questions ou des explications clarifiant ces points.` : ""}
${playedQuestionIds.length > 0 ? `- Évite absolument les thèmes et questions similaires aux identifiants suivants pour maximiser la variété et la nouveauté : ${playedQuestionIds.slice(0, 10).join(", ")}` : ""}

Consignes de qualité et de vérification :
- Fournis une explication intéressante, détaillée, pédagogique et motivante en français ("explanation") de 2 à 3 phrases pour chaque question.
- Choisis un mot-clé précis en anglais pour l'image ("imageSearchKeyword") parmi : "space", "technology", "science", "math", "history", "geography", "sport", "cinema", "music", "games", "general".
- S'assurer de la cohérence stricte de la bonne réponse avec l'explication. Pas de réponses ambiguës.`;

      // Tentative de génération avec gestion des pannes et réessais automatiques
      let text = "";
      let attempts = 0;
      const maxAttempts = 3;
      let lastError = null;

      // Modèles à essayer en cascade pour maximiser la disponibilité
      const modelsToTry = ["gemini-3.1-flash-lite", "gemini-3.5-flash"];

      while (attempts < maxAttempts && !text) {
        attempts++;
        const currentModel = modelsToTry[(attempts - 1) % modelsToTry.length];
        try {
          console.log(`[Gemini Engine] Tentative de génération (${attempts}/${maxAttempts}) avec le modèle: ${currentModel}...`);
          
          const response = await ai.models.generateContent({
            model: currentModel,
            contents: prompt,
            config: {
              systemInstruction: "Tu es le moteur d'intelligence artificielle ultime pour QuizMaster. Tu rédiges de superbes quiz entièrement en français. Tu réponds impérativement au format JSON valide conforme au schéma demandé, sans aucun texte d'enrobage.",
              responseMimeType: "application/json",
              responseSchema: {
                type: Type.OBJECT,
                properties: {
                  title: { type: Type.STRING, description: "Titre dynamique et attrayant en français" },
                  description: { type: Type.STRING, description: "Description pédagogique stimulante en français" },
                  category: { type: Type.STRING, description: "Catégorie exacte" },
                  difficulty: { type: Type.STRING, description: "Difficulté" },
                  questions: {
                    type: Type.ARRAY,
                    items: {
                      type: Type.OBJECT,
                      properties: {
                        type: { type: Type.STRING, description: "L'un de : qcm_single, qcm_multi, vrai_faux, libre" },
                        questionText: { type: Type.STRING, description: "Texte de la question" },
                        options: {
                          type: Type.ARRAY,
                          items: { type: Type.STRING },
                          description: "Choix de réponse. Vide pour libre."
                        },
                        correctAnswerIndex: { type: Type.INTEGER, description: "Pour qcm_single et vrai_faux. Index de 0 à 3." },
                        correctAnswerIndices: {
                          type: Type.ARRAY,
                          items: { type: Type.INTEGER },
                          description: "Pour qcm_multi seulement."
                        },
                        correctFreeText: { type: Type.STRING, description: "Pour libre seulement. La réponse exacte." },
                        explanation: { type: Type.STRING, description: "Explication pédagogique en français" },
                        recommendedTime: { type: Type.INTEGER, description: "Temps recommandé en secondes (entre 10 et 30)" },
                        imageSearchKeyword: { type: Type.STRING, description: "Mot-clé parmi : space, technology, science, math, history, geography, sport, cinema, music, games, general" }
                      },
                      required: ["type", "questionText", "explanation", "recommendedTime", "imageSearchKeyword"]
                    }
                  }
                },
                required: ["title", "description", "category", "difficulty", "questions"]
              }
            }
          });

          text = response.text || "";
        } catch (err: any) {
          lastError = err;
          console.warn(`[Gemini Error] Échec de la tentative ${attempts}:`, err.message || err);
          // Attendre un court instant avant de réessayer en cas d'erreur de charge (503 / 429)
          await new Promise(resolve => setTimeout(resolve, 800));
        }
      }

      // Si toutes les tentatives ont échoué, on utilise la bibliothèque de secours locale
      if (!text) {
        console.error("[Gemini Overload] Tous les essais de l'IA ont échoué. Chargement des questions de secours.");
        const key = `${category.toLowerCase() === "sciences" ? "sciences" : "history"}_${difficulty.toLowerCase() === "facile" ? "facile" : difficulty.toLowerCase() === "difficile" ? "difficile" : "moyen"}`;
        const defaultQuiz = fallbackQuizzes[key] || fallbackQuizzes["general_default"];
        const customQuiz = validateAndFixQuiz(defaultQuiz, category, difficulty, topic);
        return res.json(customQuiz);
      }

      // Analyse et auto-correction du JSON généré pour une robustesse ultime
      const rawQuiz = JSON.parse(text.trim());
      const finalizedQuiz = validateAndFixQuiz(rawQuiz, category, difficulty, topic);

      // Enregistrement en cache pour les futures requêtes similaires
      quizCache.set(cacheKey, finalizedQuiz);

      res.json(finalizedQuiz);
    } catch (error: any) {
      console.error("Erreur critique de génération dans le moteur de quiz:", error);
      // En cas de crash inattendu, on renvoie un quiz générique sans crasher le serveur
      try {
        const fallback = fallbackQuizzes["general_default"];
        const fallbackQuiz = validateAndFixQuiz(fallback, req.body.category || "Culture générale", req.body.difficulty || "Moyen", req.body.topic || "IA");
        res.json(fallbackQuiz);
      } catch (innerErr) {
        res.status(500).json({ error: "Erreur fatale de génération de quiz." });
      }
    }
  });

  // =========================================================================
  // SERVEUR BACKEND POUR LES FONCTIONNALITÉS SOCIALES, COMPÉTITIVES & MULTIJOUEUR
  // =========================================================================

  // Bases de données en mémoire partagées en temps réel
  const usersDb = new Map<string, any>();
  const friendRequests: any[] = [];
  const friendsMap = new Map<string, Set<string>>(); // uid -> set of friend uids
  const challengesList: any[] = [];
  const multiplayerRooms = new Map<string, any>(); // roomId -> Room state
  const notificationsMap = new Map<string, any[]>(); // uid -> NotificationItem[]

  // ÉCONOMIE DU JEU SERVEUR (SÉCURISÉE)
  const serverTransactions: any[] = [];
  const serverAdminSettings = {
    facile: 50,
    moyen: 100,
    difficile: 500,
    expert: 1000,
    premiumPrice: 5000
  };

  // Seeding initial du classement
  const defaultProfiles = [
    { uid: "u-1", email: "aline@example.com", pseudo: "Aline_LaGagnante", fullName: "Aline Bernard", avatarUrl: "https://api.dicebear.com/7.x/pixel-art/svg?seed=aline", level: 42, xp: 28400, quizzesPlayedCount: 89, quizzesFinishedCount: 85, successRate: 88, averageResponseTime: 4.2, badges: [], joinDate: new Date().toISOString(), country: "France", totalScore: 245000, bestStreak: 18, history: [] },
    { uid: "u-2", email: "jean@example.com", pseudo: "JeanQuiz", fullName: "Jean Dupont", avatarUrl: "https://api.dicebear.com/7.x/pixel-art/svg?seed=jean", level: 38, xp: 24150, quizzesPlayedCount: 76, quizzesFinishedCount: 74, successRate: 82, averageResponseTime: 5.1, badges: [], joinDate: new Date().toISOString(), country: "Belgique", totalScore: 198000, bestStreak: 14, history: [] },
    { uid: "u-3", email: "mind@example.com", pseudo: "MasterMind", fullName: "Elena Rostova", avatarUrl: "https://api.dicebear.com/7.x/pixel-art/svg?seed=mind", level: 35, xp: 21900, quizzesPlayedCount: 65, quizzesFinishedCount: 65, successRate: 91, averageResponseTime: 3.8, badges: [], joinDate: new Date().toISOString(), country: "Suisse", totalScore: 182000, bestStreak: 22, history: [] },
    { uid: "u-4", email: "turing@example.com", pseudo: "TuringFan", fullName: "Alan Turing Fan", avatarUrl: "https://api.dicebear.com/7.x/pixel-art/svg?seed=turing", level: 29, xp: 18500, quizzesPlayedCount: 54, quizzesFinishedCount: 52, successRate: 79, averageResponseTime: 6.2, badges: [], joinDate: new Date().toISOString(), country: "Canada", totalScore: 145000, bestStreak: 11, history: [] },
    { uid: "u-5", email: "geek@example.com", pseudo: "Geekette_99", fullName: "Sarah Connor", avatarUrl: "https://api.dicebear.com/7.x/pixel-art/svg?seed=geek", level: 24, xp: 15120, quizzesPlayedCount: 43, quizzesFinishedCount: 40, successRate: 76, averageResponseTime: 4.9, badges: [], joinDate: new Date().toISOString(), country: "Sénégal", totalScore: 112000, bestStreak: 13, history: [] },
    { uid: "u-6", email: "marie@example.com", pseudo: "Marie_Curie_Acolyte", fullName: "Marie Fan", avatarUrl: "https://api.dicebear.com/7.x/pixel-art/svg?seed=marie", level: 21, xp: 12900, quizzesPlayedCount: 35, quizzesFinishedCount: 35, successRate: 85, averageResponseTime: 5.4, badges: [], joinDate: new Date().toISOString(), country: "Maroc", totalScore: 98000, bestStreak: 12, history: [] }
  ];

  defaultProfiles.forEach(p => {
    const fullProfile = {
      ...p,
      quizCoins: p.uid === "u-1" ? 12000 : p.uid === "u-3" ? 6500 : 1500,
      isPremium: p.uid === "u-1" || p.uid === "u-3",
      quizCoinsEarned: p.uid === "u-1" ? 17000 : p.uid === "u-3" ? 11500 : 3500,
    };
    usersDb.set(p.uid, fullProfile);
    friendsMap.set(p.uid, new Set<string>());
  });

  // Helper de notifications en temps réel
  function triggerNotification(uid: string, notification: any) {
    if (!notificationsMap.has(uid)) {
      notificationsMap.set(uid, []);
    }
    const userNotifs = notificationsMap.get(uid)!;
    userNotifs.unshift({
      id: `notif-${Date.now()}-${Math.floor(Math.random() * 1000)}`,
      timestamp: new Date().toISOString(),
      isRead: false,
      ...notification
    });
    // Limiter à 50 notifications max par utilisateur
    if (userNotifs.length > 50) userNotifs.pop();
  }

  // --- API USER SYNC ---
  app.post("/api/user/sync", (req, res) => {
    const { profile } = req.body;
    if (!profile || !profile.uid) {
      return res.status(400).json({ error: "Profil utilisateur invalide" });
    }
    const current = usersDb.get(profile.uid) || {};
    
    // RÈGLES DE SÉCURITÉ : Conserver le solde de pièces et le statut premium validés par le serveur
    const updated = {
      ...current,
      ...profile,
      uid: profile.uid,
      quizCoins: current.quizCoins !== undefined ? current.quizCoins : (profile.quizCoins !== undefined ? profile.quizCoins : 1000),
      isPremium: current.isPremium !== undefined ? current.isPremium : (profile.isPremium || false),
      quizCoinsEarned: current.quizCoinsEarned !== undefined ? current.quizCoinsEarned : (profile.quizCoinsEarned !== undefined ? profile.quizCoinsEarned : 1000),
      country: profile.country || current.country || "France",
      totalScore: profile.totalScore !== undefined ? profile.totalScore : (current.totalScore || 0),
      bestStreak: profile.bestStreak !== undefined ? profile.bestStreak : (current.bestStreak || 0),
    };
    usersDb.set(profile.uid, updated);
    if (!friendsMap.has(profile.uid)) {
      friendsMap.set(profile.uid, new Set());
    }
    res.json({ success: true, profile: updated });
  });

  // --- API SECURE SCORE VALIDATION (ANTI-CHEAT) ---
  app.post("/api/quiz/validate-score", (req, res) => {
    const { 
      uid, 
      quizId, 
      score, 
      accuracy, 
      xpEarned, 
      responseTimes = [], 
      correctAnswersCount, 
      totalQuestions,
      bestStreak = 0,
      category = "Culture générale"
    } = req.body;

    if (!uid || !quizId || typeof score !== "number" || typeof totalQuestions !== "number") {
      return res.status(400).json({ error: "Paramètres de score invalides" });
    }

    const user = usersDb.get(uid);
    if (!user) {
      return res.status(404).json({ error: "Utilisateur introuvable" });
    }

    // --- RÈGLES DE SÉCURITÉ & ANTI-TRICHE SERVEUR ---
    
    // 1. Validation de la cohérence mathématique du score
    // Max XP par quiz standard est ~1000 XP (200 XP par bonne réponse + bonus)
    const maxPossibleScore = totalQuestions * 150; // Max 150 pts par question avec bonus de temps
    if (score > maxPossibleScore || score < 0) {
      return res.status(403).json({ 
        error: "Tentative de triche détectée : Score mathématiquement impossible pour ce nombre de questions.",
        suspicious: true
      });
    }

    // 2. Triche sur la vitesse de réponse (Script Bots)
    // Le temps de réflexe de lecture humain minimum absolu est d'environ 200ms (0.2s)
    const roboticAnswers = responseTimes.filter((t: number) => t < 0.2);
    if (roboticAnswers.length > 0 && correctAnswersCount > 0) {
      return res.status(403).json({
        error: "Tentative de triche détectée : Temps de réponse inhumains (réponses instantanées de type bot).",
        suspicious: true
      });
    }

    // 3. Validation de la cohérence de l'accuracy
    if (accuracy > 100 || accuracy < 0) {
      return res.status(403).json({ error: "Précision invalide" });
    }

    // Calcul légitime de l'XP à attribuer (Capped à 1000 XP par quiz pour éviter l'abus)
    const validatedXp = Math.min(xpEarned, totalQuestions * 250);

    // Calcul sécurisé des QuizCoins gagnés selon la difficulté
    const difficultyStr = req.body.difficulty || "Moyen";
    const diffLower = String(difficultyStr).toLowerCase();
    let coinsReward = 100;
    if (diffLower === "facile") coinsReward = serverAdminSettings.facile;
    else if (diffLower === "moyen") coinsReward = serverAdminSettings.moyen;
    else if (diffLower === "difficile") coinsReward = serverAdminSettings.difficile;
    else if (diffLower === "expert") coinsReward = serverAdminSettings.expert;

    // Mettre à jour les statistiques de l'utilisateur et le portefeuille
    user.xp = (user.xp || 0) + validatedXp;
    user.totalScore = (user.totalScore || 0) + score;
    user.quizzesPlayedCount = (user.quizzesPlayedCount || 0) + 1;
    user.quizzesFinishedCount = (user.quizzesFinishedCount || 0) + 1;
    user.bestStreak = Math.max(user.bestStreak || 0, bestStreak);
    user.quizCoins = (user.quizCoins || 0) + coinsReward;
    user.quizCoinsEarned = (user.quizCoinsEarned || 0) + coinsReward;

    // Enregistrer la transaction sécurisée sur le serveur
    const transactionId = `tx-${Date.now()}-${Math.floor(Math.random() * 1000)}`;
    const newTx = {
      id: transactionId,
      userId: uid,
      type: "gain",
      montant: coinsReward,
      raison: `Victoire Quiz (${difficultyStr}) 🏆`,
      date: new Date().toISOString()
    };
    serverTransactions.push(newTx);

    // Recalcul du taux de réussite moyen
    const totalCorrect = (user.history || []).reduce((acc: number, h: any) => acc + (h.correctAnswersCount || 0), 0) + correctAnswersCount;
    const totalQuest = (user.history || []).reduce((acc: number, h: any) => acc + (h.totalQuestions || 0), 0) + totalQuestions;
    user.successRate = totalQuest > 0 ? Math.round((totalCorrect / totalQuest) * 100) : accuracy;

    // Calcul du niveau (Formule : Level = Math.floor(sqrt(XP / 100)) + 1)
    const oldLevel = user.level || 1;
    user.level = Math.floor(Math.sqrt(user.xp / 100)) + 1;

    // Ajouter à l'historique
    const historyItem = {
      id: `hist-${Date.now()}-${Math.floor(Math.random() * 1000)}`,
      quizId,
      quizTitle: req.body.quizTitle || "Quiz",
      category,
      score,
      totalQuestions,
      xpEarned: validatedXp,
      date: new Date().toISOString(),
      accuracy,
      correctAnswersCount,
    };
    user.history = user.history || [];
    user.history.unshift(historyItem);

    usersDb.set(uid, user);

    // Déclencher une notification de félicitations pour niveau supérieur
    if (user.level > oldLevel) {
      triggerNotification(uid, {
        title: "🎉 Niveau supérieur !",
        body: `Félicitations ! Tu as atteint le niveau ${user.level} ! Continue comme ça.`,
        type: "badge_earned"
      });
    }

    res.json({
      success: true,
      profile: user,
      levelUp: user.level > oldLevel,
      newLevel: user.level,
      coinsReward: coinsReward
    });
  });

  // --- API LEADERBOARD MULTI-CRITÈRES ---
  app.get("/api/leaderboard", (req, res) => {
    const { type = "world", country, category, uid, search } = req.query;

    let entries = Array.from(usersDb.values()).map(u => ({
      uid: u.uid,
      pseudo: u.pseudo,
      avatarUrl: u.avatarUrl,
      xp: u.xp || 0,
      level: u.level || 1,
      country: u.country || "France",
      totalScore: u.totalScore || 0,
      quizzesFinished: u.quizzesFinishedCount || 0,
      successRate: u.successRate || 0,
      bestStreak: u.bestStreak || 0,
      isPremium: u.isPremium || false,
      quizCoinsEarned: u.quizCoinsEarned || 0,
      lastUpdated: u.history && u.history[0] ? u.history[0].date : u.joinDate
    }));

    // Recherche par pseudo
    if (search) {
      const q = String(search).toLowerCase();
      entries = entries.filter(e => e.pseudo.toLowerCase().includes(q));
    }

    // Filtrer par type
    if (type === "country" && country) {
      entries = entries.filter(e => e.country.toLowerCase() === String(country).toLowerCase());
    } else if (type === "friends" && uid) {
      const userFriends = friendsMap.get(String(uid)) || new Set<string>();
      entries = entries.filter(e => e.uid === String(uid) || userFriends.has(e.uid));
    } else if (type === "category" && category) {
      // Pour la catégorie, on trie les joueurs qui ont joué à cette catégorie
      // Ici on simule ou ordonne par rapport à leur score moyen dans la catégorie dans l'historique
      entries = entries.filter(e => {
        const profile = usersDb.get(e.uid);
        return profile && profile.history && profile.history.some((h: any) => h.category === category);
      });
    } else if (type === "daily") {
      // Filtrer les scores mis à jour au cours des dernières 24 heures
      const yesterday = Date.now() - 24 * 60 * 60 * 1000;
      entries = entries.filter(e => new Date(e.lastUpdated).getTime() > yesterday);
    } else if (type === "weekly") {
      const lastWeek = Date.now() - 7 * 24 * 60 * 60 * 1000;
      entries = entries.filter(e => new Date(e.lastUpdated).getTime() > lastWeek);
    } else if (type === "monthly") {
      const lastMonth = Date.now() - 30 * 24 * 60 * 60 * 1000;
      entries = entries.filter(e => new Date(e.lastUpdated).getTime() > lastMonth);
    }

    // Tri par XP décroissante par défaut
    entries.sort((a, b) => b.xp - a.xp);

    // Assigner les rangs
    const ranked = entries.map((e, idx) => ({
      ...e,
      rank: idx + 1,
      isCurrentUser: uid ? e.uid === String(uid) : false
    }));

    res.json(ranked);
  });

  // =========================================================================
  // --- SECURE ECONOMY & WALLET SYSTEM API ---
  // =========================================================================

  // 1. Get transactions for a user
  app.get("/api/user/transactions", (req, res) => {
    const { uid } = req.query;
    if (!uid) return res.status(400).json({ error: "UID requis" });
    const list = serverTransactions.filter(t => t.userId === uid).sort((a, b) => b.date.localeCompare(a.date));
    res.json(list);
  });

  // 2. Buy Premium with QuizCoins
  app.post("/api/premium/buy", (req, res) => {
    const { uid } = req.body;
    if (!uid) return res.status(400).json({ error: "UID requis" });
    
    const user = usersDb.get(uid);
    if (!user) return res.status(404).json({ error: "Utilisateur introuvable" });
    
    if (user.isPremium) {
      return res.status(400).json({ error: "Déjà Premium !" });
    }
    
    const price = serverAdminSettings.premiumPrice;
    if ((user.quizCoins || 0) < price) {
      const missing = price - (user.quizCoins || 0);
      return res.status(400).json({ error: `Fonds insuffisants. Il te manque ${missing} QuizCoins.` });
    }
    
    // Deduct and activate
    user.quizCoins = (user.quizCoins || 0) - price;
    user.isPremium = true;
    
    // Log transaction
    const newTx = {
      id: `tx-${Date.now()}-${Math.floor(Math.random() * 1000)}`,
      userId: uid,
      type: "depense",
      montant: price,
      raison: "Achat Abonnement Premium ✨",
      date: new Date().toISOString()
    };
    serverTransactions.push(newTx);
    
    usersDb.set(uid, user);
    res.json({ success: true, profile: user });
  });

  // 3. Purchase item from shop
  app.post("/api/shop/buy", (req, res) => {
    const { uid, itemId, itemPrice, itemName } = req.body;
    if (!uid || !itemId || !itemPrice || !itemName) {
      return res.status(400).json({ error: "Paramètres manquants" });
    }
    
    const user = usersDb.get(uid);
    if (!user) return res.status(404).json({ error: "Utilisateur introuvable" });
    
    if ((user.quizCoins || 0) < itemPrice) {
      const missing = itemPrice - (user.quizCoins || 0);
      return res.status(400).json({ error: `Fonds insuffisants. Il te manque ${missing} QuizCoins.` });
    }
    
    // Deduct coins
    user.quizCoins = (user.quizCoins || 0) - itemPrice;
    
    // Log transaction
    const newTx = {
      id: `tx-${Date.now()}-${Math.floor(Math.random() * 1000)}`,
      userId: uid,
      type: "depense",
      montant: itemPrice,
      raison: `Achat Boutique : ${itemName} 🛍️`,
      date: new Date().toISOString()
    };
    serverTransactions.push(newTx);
    
    usersDb.set(uid, user);
    res.json({ success: true, profile: user });
  });

  // 4. Claim daily mission
  app.post("/api/missions/claim", (req, res) => {
    const { uid, missionId, rewardCoins, missionTitle } = req.body;
    if (!uid || !missionId || !rewardCoins) {
      return res.status(400).json({ error: "Paramètres manquants" });
    }
    
    const user = usersDb.get(uid);
    if (!user) return res.status(404).json({ error: "Utilisateur introuvable" });
    
    user.quizCoins = (user.quizCoins || 0) + rewardCoins;
    user.quizCoinsEarned = (user.quizCoinsEarned || 0) + rewardCoins;
    
    // Log transaction
    const newTx = {
      id: `tx-${Date.now()}-${Math.floor(Math.random() * 1000)}`,
      userId: uid,
      type: "gain",
      montant: rewardCoins,
      raison: `Mission quotidienne : ${missionTitle || "Réussie"} 🌟`,
      date: new Date().toISOString()
    };
    serverTransactions.push(newTx);
    
    usersDb.set(uid, user);
    res.json({ success: true, profile: user });
  });

  // 5. Admin Settings - GET & POST
  app.get("/api/admin/settings", (req, res) => {
    res.json(serverAdminSettings);
  });

  app.post("/api/admin/settings", (req, res) => {
    const { facile, moyen, difficile, expert, premiumPrice } = req.body;
    if (typeof facile === "number") serverAdminSettings.facile = facile;
    if (typeof moyen === "number") serverAdminSettings.moyen = moyen;
    if (typeof difficile === "number") serverAdminSettings.difficile = difficile;
    if (typeof expert === "number") serverAdminSettings.expert = expert;
    if (typeof premiumPrice === "number") serverAdminSettings.premiumPrice = premiumPrice;
    res.json({ success: true, settings: serverAdminSettings });
  });

  // 6. Admin Players List
  app.get("/api/admin/players", (req, res) => {
    const players = Array.from(usersDb.values());
    res.json(players);
  });

  // 7. Admin Modify Coins manually
  app.post("/api/admin/modify-coins", (req, res) => {
    const { uid, amount, isAdding, raison } = req.body;
    if (!uid || typeof amount !== "number") {
      return res.status(400).json({ error: "Paramètres invalides" });
    }
    const user = usersDb.get(uid);
    if (!user) return res.status(404).json({ error: "Joueur introuvable" });
    
    if (isAdding) {
      user.quizCoins = (user.quizCoins || 0) + amount;
      user.quizCoinsEarned = (user.quizCoinsEarned || 0) + amount;
    } else {
      user.quizCoins = Math.max(0, (user.quizCoins || 0) - amount);
    }
    
    // Log transaction
    const newTx = {
      id: `tx-${Date.now()}-${Math.floor(Math.random() * 1000)}`,
      userId: uid,
      type: isAdding ? "gain" : "depense",
      montant: amount,
      raison: `Ajustement Admin : ${raison || "Ajustement de solde"} ⚙️`,
      date: new Date().toISOString()
    };
    serverTransactions.push(newTx);
    
    usersDb.set(uid, user);
    res.json({ success: true, profile: user });
  });

  // 8. Admin view all transactions
  app.get("/api/admin/transactions", (req, res) => {
    res.json(serverTransactions.sort((a, b) => b.date.localeCompare(a.date)));
  });

  // --- API SYSTÈME D'AMIS ---
  app.get("/api/friends/list", (req, res) => {
    const { uid } = req.query;
    if (!uid) return res.status(400).json({ error: "UID requis" });

    const friendsUids = friendsMap.get(String(uid)) || new Set<string>();
    const list = Array.from(friendsUids).map(friendUid => {
      const f = usersDb.get(friendUid);
      if (!f) return null;
      return {
        uid: f.uid,
        pseudo: f.pseudo,
        avatarUrl: f.avatarUrl,
        level: f.level || 1,
        xp: f.xp || 0,
        status: multiplayerRooms.size > 0 ? "online" : "offline", // Dynamisme simulé
        successRate: f.successRate || 0,
        bestStreak: f.bestStreak || 0
      };
    }).filter(Boolean);

    res.json(list);
  });

  app.get("/api/friends/requests", (req, res) => {
    const { uid } = req.query;
    if (!uid) return res.status(400).json({ error: "UID requis" });

    const requests = friendRequests.filter(r => r.toUid === uid && r.status === "pending");
    res.json(requests);
  });

  app.post("/api/friends/request", (req, res) => {
    const { fromUid, toPseudo } = req.body;
    if (!fromUid || !toPseudo) return res.status(400).json({ error: "Paramètres manquants" });

    const sender = usersDb.get(fromUid);
    if (!sender) return res.status(404).json({ error: "Expéditeur introuvable" });

    // Trouver le destinataire par son pseudo
    const receiver = Array.from(usersDb.values()).find(u => u.pseudo.toLowerCase() === toPseudo.trim().toLowerCase());
    if (!receiver) {
      return res.status(404).json({ error: "Utilisateur avec ce pseudo introuvable." });
    }

    if (receiver.uid === fromUid) {
      return res.status(400).json({ error: "Tu ne peux pas t'ajouter toi-même en ami." });
    }

    // Vérifier si déjà amis
    const currentFriends = friendsMap.get(fromUid);
    if (currentFriends && currentFriends.has(receiver.uid)) {
      return res.status(400).json({ error: "Vous êtes déjà amis !" });
    }

    // Vérifier si demande déjà envoyée
    const existing = friendRequests.find(r => r.fromUid === fromUid && r.toUid === receiver.uid && r.status === "pending");
    if (existing) {
      return res.status(400).json({ error: "Demande d'ami déjà en cours." });
    }

    const newRequest = {
      id: `req-${Date.now()}-${Math.floor(Math.random() * 1000)}`,
      fromUid,
      fromPseudo: sender.pseudo,
      fromAvatarUrl: sender.avatarUrl,
      toUid: receiver.uid,
      toPseudo: receiver.pseudo,
      timestamp: new Date().toISOString(),
      status: "pending"
    };

    friendRequests.push(newRequest);

    // Déclencher une notification en direct pour le destinataire
    triggerNotification(receiver.uid, {
      title: "👥 Nouvelle demande d'ami",
      body: `${sender.pseudo} souhaite t'ajouter à sa liste d'amis !`,
      type: "challenge_invite"
    });

    res.json({ success: true, message: "Demande d'ami envoyée avec succès !" });
  });

  app.post("/api/friends/respond", (req, res) => {
    const { requestId, status } = req.body; // status: "accepted" ou "declined"
    if (!requestId || !status) return res.status(400).json({ error: "Paramètres manquants" });

    const reqIdx = friendRequests.findIndex(r => r.id === requestId);
    if (reqIdx === -1) return res.status(404).json({ error: "Demande introuvable" });

    const request = friendRequests[reqIdx];
    request.status = status;

    if (status === "accepted") {
      // Ajouter aux listes d'amis respectives
      if (!friendsMap.has(request.fromUid)) friendsMap.set(request.fromUid, new Set());
      if (!friendsMap.has(request.toUid)) friendsMap.set(request.toUid, new Set());

      friendsMap.get(request.fromUid)!.add(request.toUid);
      friendsMap.get(request.toUid)!.add(request.fromUid);

      // Notifier le demandeur original
      triggerNotification(request.fromUid, {
        title: "👥 Demande d'ami acceptée !",
        body: `${request.toPseudo} a accepté ta demande d'ami.`,
        type: "badge_earned"
      });
    }

    // Retirer de la liste des demandes en suspens
    friendRequests.splice(reqIdx, 1);

    res.json({ success: true, message: `Demande d'ami ${status === "accepted" ? "acceptée" : "refusée"} !` });
  });

  app.delete("/api/friends/remove", (req, res) => {
    const { uid, friendUid } = req.body;
    if (!uid || !friendUid) return res.status(400).json({ error: "Paramètres manquants" });

    if (friendsMap.has(uid)) friendsMap.get(uid)!.delete(friendUid);
    if (friendsMap.has(friendUid)) friendsMap.get(friendUid)!.delete(uid);

    res.json({ success: true, message: "Ami supprimé de ta liste." });
  });

  // --- API DE DÉFIS ENTRE AMIS ---
  app.get("/api/challenges/list", (req, res) => {
    const { uid } = req.query;
    if (!uid) return res.status(400).json({ error: "UID requis" });

    // Filtrer les défis impliquant cet utilisateur
    const list = challengesList.filter(c => c.creatorUid === uid || c.targetUid === uid);
    res.json(list);
  });

  app.post("/api/challenges/create", (req, res) => {
    const { creatorUid, targetUid, quizId, quizTitle, category, difficulty } = req.body;
    if (!creatorUid || !targetUid || !quizId) {
      return res.status(400).json({ error: "Informations de défi incomplètes" });
    }

    const creator = usersDb.get(creatorUid);
    const target = usersDb.get(targetUid);
    if (!creator || !target) {
      return res.status(404).json({ error: "Créateur ou cible du défi introuvable" });
    }

    const newChallenge = {
      id: `chal-${Date.now()}-${Math.floor(Math.random() * 1000)}`,
      creatorUid,
      creatorPseudo: creator.pseudo,
      creatorAvatarUrl: creator.avatarUrl,
      targetUid,
      targetPseudo: target.pseudo,
      quizId,
      quizTitle,
      category,
      difficulty,
      status: "pending",
      timestamp: new Date().toISOString()
    };

    challengesList.unshift(newChallenge);

    // Notifier l'ami défié
    triggerNotification(targetUid, {
      title: "⚔️ Nouveau défi !",
      body: `${creator.pseudo} t'a défié sur le quiz : "${quizTitle}" !`,
      type: "challenge_invite",
      payload: { challengeId: newChallenge.id }
    });

    res.json({ success: true, challenge: newChallenge });
  });

  app.post("/api/challenges/respond", (req, res) => {
    const { challengeId, status } = req.body; // status: "accepted", "declined"
    if (!challengeId || !status) return res.status(400).json({ error: "Paramètres requis" });

    const challenge = challengesList.find(c => c.id === challengeId);
    if (!challenge) return res.status(404).json({ error: "Défi introuvable" });

    challenge.status = status;

    if (status === "accepted") {
      // Notifier le créateur que le défi est relevé
      triggerNotification(challenge.creatorUid, {
        title: "⚔️ Défi accepté !",
        body: `${challenge.targetPseudo} a accepté ton défi sur : "${challenge.quizTitle}" !`,
        type: "challenge_result"
      });
    } else {
      // Retirer si refusé
      const idx = challengesList.findIndex(c => c.id === challengeId);
      if (idx !== -1) challengesList.splice(idx, 1);
    }

    res.json({ success: true, challenge });
  });

  app.post("/api/challenges/complete", (req, res) => {
    const { challengeId, uid, score, accuracy } = req.body;
    if (!challengeId || !uid) return res.status(400).json({ error: "Données manquantes" });

    const challenge = challengesList.find(c => c.id === challengeId);
    if (!challenge) return res.status(404).json({ error: "Défi introuvable" });

    if (challenge.creatorUid === uid) {
      challenge.creatorScore = score;
      challenge.creatorAccuracy = accuracy;
    } else if (challenge.targetUid === uid) {
      challenge.targetScore = score;
      challenge.targetAccuracy = accuracy;
    }

    // Si les deux ont terminé, on désigne le vainqueur
    if (challenge.creatorScore !== undefined && challenge.targetScore !== undefined) {
      challenge.status = "completed";
      
      let winnerUid = "";
      let winnerPseudo = "Égalité";

      if (challenge.creatorScore > challenge.targetScore) {
        winnerUid = challenge.creatorUid;
        winnerPseudo = challenge.creatorPseudo;
      } else if (challenge.targetScore > challenge.creatorScore) {
        winnerUid = challenge.targetUid;
        winnerPseudo = challenge.targetPseudo;
      } else {
        // En cas d'égalité au score, départage par la précision
        if (challenge.creatorAccuracy > challenge.targetAccuracy) {
          winnerUid = challenge.creatorUid;
          winnerPseudo = challenge.creatorPseudo;
        } else if (challenge.targetAccuracy > challenge.creatorAccuracy) {
          winnerUid = challenge.targetUid;
          winnerPseudo = challenge.targetPseudo;
        }
      }

      challenge.winnerUid = winnerUid || "equality";

      // Notifier les deux joueurs du résultat final
      triggerNotification(challenge.creatorUid, {
        title: "🏆 Défi terminé !",
        body: winnerUid === challenge.creatorUid 
          ? `Victoire ! Tu as battu ${challenge.targetPseudo} (${challenge.creatorScore} vs ${challenge.targetScore} pts) !` 
          : winnerUid === "equality" ? "Égalité parfaite !" : `Dommage ! ${challenge.targetPseudo} a remporté le défi !`,
        type: "challenge_result"
      });

      triggerNotification(challenge.targetUid, {
        title: "🏆 Défi terminé !",
        body: winnerUid === challenge.targetUid 
          ? `Victoire ! Tu as battu ${challenge.creatorPseudo} (${challenge.targetScore} vs ${challenge.creatorScore} pts) !` 
          : winnerUid === "equality" ? "Égalité parfaite !" : `Dommage ! ${challenge.creatorPseudo} a remporté le défi !`,
        type: "challenge_result"
      });
    }

    res.json({ success: true, challenge });
  });

  // --- API MULTIJOUEUR EN TEMPS RÉEL (SALLES SYNCHRONISÉES) ---
  app.post("/api/multiplayer/room/create", (req, res) => {
    const { hostUid, hostPseudo, hostAvatarUrl, hostLevel, quiz } = req.body;
    if (!hostUid || !quiz) return res.status(400).json({ error: "Hôte ou quiz manquant" });

    // Générer un code de salle unique à 6 chiffres
    let roomId = "";
    do {
      roomId = Math.floor(100000 + Math.random() * 900000).toString();
    } while (multiplayerRooms.has(roomId));

    const newRoom = {
      id: roomId,
      hostUid,
      hostPseudo,
      quiz,
      players: [{
        uid: hostUid,
        pseudo: hostPseudo,
        avatarUrl: hostAvatarUrl,
        level: hostLevel || 1,
        score: 0,
        correctCount: 0,
        isReady: true,
        hasAnswered: false
      }],
      status: "lobby", // lobby, playing, finished
      currentQuestionIdx: 0,
      questionActive: false,
      timerLeft: 15,
      answersSubmitted: 0,
      questionStartTime: 0,
      timestamp: new Date().toISOString()
    };

    multiplayerRooms.set(roomId, newRoom);
    res.json({ success: true, room: newRoom });
  });

  app.post("/api/multiplayer/room/join", (req, res) => {
    const { roomId, uid, pseudo, avatarUrl, level } = req.body;
    if (!roomId || !uid) return res.status(400).json({ error: "Champs requis manquants" });

    const room = multiplayerRooms.get(String(roomId).trim());
    if (!room) {
      return res.status(404).json({ error: "Code de salle invalide ou inexistant." });
    }

    if (room.status !== "lobby") {
      return res.status(400).json({ error: "La partie a déjà commencé dans cette salle." });
    }

    // Éviter les doublons
    const exists = room.players.some((p: any) => p.uid === uid);
    if (!exists) {
      room.players.push({
        uid,
        pseudo,
        avatarUrl,
        level: level || 1,
        score: 0,
        correctCount: 0,
        isReady: false,
        hasAnswered: false
      });
    }

    res.json({ success: true, room });
  });

  app.post("/api/multiplayer/room/ready", (req, res) => {
    const { roomId, uid, isReady } = req.body;
    const room = multiplayerRooms.get(String(roomId));
    if (!room) return res.status(404).json({ error: "Salle introuvable" });

    const player = room.players.find((p: any) => p.uid === uid);
    if (player) {
      player.isReady = isReady;
    }

    // Si tous les joueurs sont prêts et que l'hôte lance
    res.json({ success: true, room });
  });

  app.post("/api/multiplayer/room/start", (req, res) => {
    const { roomId, uid } = req.body;
    const room = multiplayerRooms.get(String(roomId));
    if (!room) return res.status(404).json({ error: "Salle introuvable" });

    if (room.hostUid !== uid) {
      return res.status(403).json({ error: "Seul l'hôte peut lancer la partie." });
    }

    room.status = "playing";
    room.currentQuestionIdx = 0;
    room.questionActive = true;
    room.answersSubmitted = 0;
    
    const currentQ = room.quiz.questions[0];
    room.timerLeft = currentQ ? (currentQ.recommendedTime || 15) : 15;
    room.questionStartTime = Date.now();

    // Réinitialiser les états de réponse des joueurs
    room.players.forEach((p: any) => {
      p.hasAnswered = false;
      p.currentAnswerIdx = null;
    });

    res.json({ success: true, room });
  });

  app.post("/api/multiplayer/room/submit-answer", (req, res) => {
    const { roomId, uid, selectedOptionIdx, isCorrect, responseTime } = req.body;
    const room = multiplayerRooms.get(String(roomId));
    if (!room) return res.status(404).json({ error: "Salle introuvable" });

    const player = room.players.find((p: any) => p.uid === uid);
    if (!player) return res.status(404).json({ error: "Joueur introuvable dans cette salle" });

    if (!room.questionActive) {
      return res.status(400).json({ error: "Le temps est écoulé pour cette question." });
    }

    if (player.hasAnswered) {
      return res.status(400).json({ error: "Tu as déjà soumis ta réponse !" });
    }

    player.hasAnswered = true;
    player.currentAnswerIdx = selectedOptionIdx;
    
    if (isCorrect) {
      player.correctCount += 1;
      // Calcul des points dynamique avec bonus de rapidité
      // Max 100 points de base, plus jusqu'à 50 points bonus de rapidité
      const currentQ = room.quiz.questions[room.currentQuestionIdx];
      const recommended = currentQ ? (currentQ.recommendedTime || 15) : 15;
      const timeBonus = Math.max(0, Math.round((recommended - (responseTime || 5)) * 3));
      player.score += 100 + timeBonus;
    }

    room.answersSubmitted += 1;

    // Si tout le monde a répondu, on désactive immédiatement la question pour afficher les résultats de la manche
    const activePlayersCount = room.players.length;
    if (room.answersSubmitted >= activePlayersCount) {
      room.questionActive = false;
    }

    res.json({ success: true, room });
  });

  // Host force la question suivante
  app.post("/api/multiplayer/room/next-question", (req, res) => {
    const { roomId, uid } = req.body;
    const room = multiplayerRooms.get(String(roomId));
    if (!room) return res.status(404).json({ error: "Salle introuvable" });

    if (room.hostUid !== uid) {
      return res.status(403).json({ error: "Seul l'hôte peut passer à l'étape suivante." });
    }

    // Soit on passe de "résultats de manche" à "question suivante"
    if (!room.questionActive && room.currentQuestionIdx < room.quiz.questions.length - 1) {
      room.currentQuestionIdx += 1;
      room.questionActive = true;
      room.answersSubmitted = 0;
      
      const nextQ = room.quiz.questions[room.currentQuestionIdx];
      room.timerLeft = nextQ ? (nextQ.recommendedTime || 15) : 15;
      room.questionStartTime = Date.now();

      // Réinitialiser les états de réponse des joueurs
      room.players.forEach((p: any) => {
        p.hasAnswered = false;
        p.currentAnswerIdx = null;
      });
    } else {
      // Fin du jeu
      room.status = "finished";
      room.questionActive = false;
    }

    res.json({ success: true, room });
  });

  // Polling du statut de la salle (Vérification et décompte dynamique côté serveur)
  app.get("/api/multiplayer/room/status", (req, res) => {
    const { roomId } = req.query;
    const room = multiplayerRooms.get(String(roomId));
    if (!room) return res.status(404).json({ error: "Salle introuvable" });

    // Si le jeu est en cours, on calcule dynamiquement le temps restant
    if (room.status === "playing" && room.questionActive) {
      const currentQ = room.quiz.questions[room.currentQuestionIdx];
      const limit = currentQ ? (currentQ.recommendedTime || 15) : 15;
      const elapsed = Math.floor((Date.now() - room.questionStartTime) / 1000);
      
      room.timerLeft = Math.max(0, limit - elapsed);

      // Si le temps est écoulé, on clôture la question
      if (room.timerLeft <= 0) {
        room.questionActive = false;
      }
    }

    res.json(room);
  });

  // --- API NOTIFICATIONS ---
  app.get("/api/notifications/list", (req, res) => {
    const { uid } = req.query;
    if (!uid) return res.status(400).json({ error: "UID requis" });
    res.json(notificationsMap.get(String(uid)) || []);
  });

  app.post("/api/notifications/mark-read", (req, res) => {
    const { uid, notifId } = req.body;
    if (!uid) return res.status(400).json({ error: "UID requis" });

    const list = notificationsMap.get(uid) || [];
    if (notifId) {
      const item = list.find(n => n.id === notifId);
      if (item) item.isRead = true;
    } else {
      // Tout marquer comme lu
      list.forEach(n => n.isRead = true);
    }

    res.json({ success: true });
  });

  // API POUR SEEDER OU OBTENIR UN JOUEUR PUBLIC (Utile pour voir le profil des autres)
  app.get("/api/user/public", (req, res) => {
    const { uid } = req.query;
    if (!uid) return res.status(400).json({ error: "UID requis" });

    const user = usersDb.get(String(uid));
    if (!user) return res.status(404).json({ error: "Utilisateur introuvable" });

    // Ne renvoyer que les infos publiques
    res.json({
      uid: user.uid,
      pseudo: user.pseudo,
      fullName: user.fullName,
      avatarUrl: user.avatarUrl,
      level: user.level || 1,
      xp: user.xp || 0,
      quizzesPlayedCount: user.quizzesPlayedCount || 0,
      quizzesFinishedCount: user.quizzesFinishedCount || 0,
      successRate: user.successRate || 0,
      averageResponseTime: user.averageResponseTime || 5.0,
      badges: user.badges || [],
      joinDate: user.joinDate,
      country: user.country || "France",
      totalScore: user.totalScore || 0,
      bestStreak: user.bestStreak || 0,
      history: (user.history || []).slice(0, 5) // Renvoyer seulement les 5 derniers quiz
    });
  });

  // Configuration de l'environnement de développement ou production
  if (process.env.NODE_ENV !== "production") {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), "dist");
    app.use(express.static(distPath));
    app.get("*", (req, res) => {
      res.sendFile(path.join(distPath, "index.html"));
    });
  }

  app.listen(PORT, "0.0.0.0", () => {
    console.log(`[QuizMaster Server] Serveur démarré sur http://0.0.0.0:${PORT}`);
  });
}

startServer().catch((err) => {
  console.error("Erreur au démarrage du serveur QuizMaster:", err);
});
