import { Quiz, QuizDifficulty, Badge, LeaderboardEntry } from "./types";

export interface CategoryItem {
  id: string;
  name: string;
  icon: string;
  color: string;
  gradient: string;
  description: string;
}

export const CATEGORIES: CategoryItem[] = [
  {
    id: "culture-generale",
    name: "Culture générale",
    icon: "Globe",
    color: "#3b82f6", // Blue
    gradient: "from-blue-500 to-indigo-600",
    description: "Teste tes connaissances générales sur divers sujets."
  },
  {
    id: "sciences",
    name: "Sciences",
    icon: "Atom",
    color: "#10b981", // Green
    gradient: "from-emerald-500 to-teal-600",
    description: "Physique, chimie, biologie et mystères de la nature."
  },
  {
    id: "mathematiques",
    name: "Mathématiques",
    icon: "Binary",
    color: "#f59e0b", // Amber
    gradient: "from-amber-500 to-orange-600",
    description: "Énigmes logiques, calculs et théorèmes célèbres."
  },
  {
    id: "histoire",
    name: "Histoire",
    icon: "BookOpen",
    color: "#84cc16", // Lime
    gradient: "from-lime-500 to-emerald-600",
    description: "Voyage à travers les époques et les civilisations."
  },
  {
    id: "geographie",
    name: "Géographie",
    icon: "Map",
    color: "#06b6d4", // Cyan
    gradient: "from-cyan-500 to-blue-600",
    description: "Pays, capitales, fleuves et merveilles du monde."
  },
  {
    id: "sport",
    name: "Sport",
    icon: "Trophy",
    color: "#ef4444", // Red
    gradient: "from-red-500 to-rose-600",
    description: "Football, JO, athlétisme et légendes du sport."
  },
  {
    id: "technologie",
    name: "Technologie",
    icon: "Cpu",
    color: "#8b5cf6", // Violet
    gradient: "from-violet-500 to-purple-600",
    description: "Innovations, gadgets, intelligence artificielle et web."
  },
  {
    id: "langues",
    name: "Langues",
    icon: "Languages",
    color: "#ec4899", // Pink
    gradient: "from-pink-500 to-rose-600",
    description: "Grammaire, vocabulaire et origines des langues."
  },
  {
    id: "cinema",
    name: "Cinéma",
    icon: "Film",
    color: "#f43f5e", // Rose
    gradient: "from-rose-500 to-red-600",
    description: "Films cultes, acteurs, réalisateurs et répliques."
  },
  {
    id: "musique",
    name: "Musique",
    icon: "Music",
    color: "#14b8a6", // Teal
    gradient: "from-teal-500 to-emerald-600",
    description: "Classique, rock, pop, rap et artistes célèbres."
  },
  {
    id: "religion",
    name: "Religion",
    icon: "Compass",
    color: "#d97706", // Amber-700
    gradient: "from-amber-600 to-yellow-700",
    description: "Mythologies, croyances, textes sacrés et histoire."
  },
  {
    id: "informatique",
    name: "Informatique",
    icon: "Code2",
    color: "#6366f1", // Indigo
    gradient: "from-indigo-500 to-blue-700",
    description: "Programmation, réseaux, cybersécurité et OS."
  },
  {
    id: "business",
    name: "Business",
    icon: "TrendingUp",
    color: "#475569", // Slate
    gradient: "from-slate-600 to-slate-800",
    description: "Économie, marketing, startups et grandes entreprises."
  },
  {
    id: "sante",
    name: "Santé",
    icon: "Heart",
    color: "#10b981", // Emerald
    gradient: "from-emerald-400 to-green-600",
    description: "Corps humain, nutrition, médecine et bien-être."
  },
  {
    id: "jeux-video",
    name: "Jeux vidéo",
    icon: "Gamepad2",
    color: "#a855f7", // Purple
    gradient: "from-purple-500 to-fuchsia-600",
    description: "Consoles rétro, hits modernes, e-sport et lore."
  }
];

export const INITIAL_BADGES: Badge[] = [
  {
    id: "badge-1",
    title: "Premier Pas",
    description: "Terminer ton tout premier quiz sur QuizMaster.",
    iconName: "Compass",
    color: "#3b82f6"
  },
  {
    id: "badge-2",
    title: "Sans Faute",
    description: "Obtenir un score parfait de 100% sur un quiz.",
    iconName: "CheckCircle",
    color: "#10b981"
  },
  {
    id: "badge-3",
    title: "Flash",
    description: "Répondre en moyenne en moins de 4 secondes par question.",
    iconName: "Zap",
    color: "#f97316"
  },
  {
    id: "badge-4",
    title: "Créateur",
    description: "Créer et enregistrer ton propre quiz personnalisé.",
    iconName: "PlusCircle",
    color: "#8b5cf6"
  },
  {
    id: "badge-5",
    title: "Génie Scientifique",
    description: "Finir un quiz de la catégorie Sciences en difficulté Difficile.",
    iconName: "Atom",
    color: "#06b6d4"
  },
  {
    id: "badge-6",
    title: "Champion de la Ligue",
    description: "Atteindre le top 3 du classement mondial.",
    iconName: "Trophy",
    color: "#eab308"
  }
];

export const DEFAULT_QUIZZES: Quiz[] = [
  {
    id: "quiz-culture-generale",
    title: "Super Quiz de Culture Générale",
    description: "Un parcours varié à travers l'art, la littérature, la géographie et l'actualité.",
    category: "Culture générale",
    difficulty: QuizDifficulty.MOYEN,
    playsCount: 1245,
    createdAt: "2026-05-15T10:00:00Z",
    questions: [
      {
        id: "cg-q1",
        questionText: "Quel est le plus grand océan de la Terre ?",
        options: [
          "L'océan Atlantique",
          "L'océan Pacifique",
          "L'océan Indien",
          "L'océan Arctique"
        ],
        correctAnswerIndex: 1,
        explanation: "L'océan Pacifique est de loin le plus vaste des océans, couvrant environ un tiers de la surface de la Terre.",
        type: "qcm_single",
        difficulty: QuizDifficulty.FACILE,
        recommendedTime: 15,
        category: "Culture générale"
      },
      {
        id: "cg-q2",
        questionText: "Qui a peint la célèbre fresque de la chapelle Sixtine ?",
        options: [
          "Léonard de Vinci",
          "Michel-Ange",
          "Raphaël",
          "Donatello"
        ],
        correctAnswerIndex: 1,
        explanation: "Michel-Ange a passé quatre ans (de 1508 à 1512) suspendu sur des échafaudages pour peindre la voûte de la chapelle Sixtine au Vatican.",
        type: "qcm_single",
        difficulty: QuizDifficulty.MOYEN,
        recommendedTime: 20,
        category: "Culture générale"
      },
      {
        id: "cg-q3",
        questionText: "Quels pays faisaient partie des membres fondateurs de la CEE en 1957 ? (Plusieurs réponses possibles)",
        options: [
          "La France",
          "L'Espagne",
          "L'Italie",
          "L'Allemagne de l'Ouest"
        ],
        correctAnswerIndices: [0, 2, 3],
        explanation: "Les six pays fondateurs de l'Union européenne étaient la France, l'Allemagne de l'Ouest, l'Italie, la Belgique, les Pays-Bas et le Luxembourg.",
        type: "qcm_multi",
        difficulty: QuizDifficulty.DIFFICILE,
        recommendedTime: 30,
        category: "Culture générale"
      },
      {
        id: "cg-q4",
        questionText: "Quel pays a offert la Statue de la Liberté aux États-Unis ?",
        options: [
          "Le Royaume-Uni",
          "La France",
          "L'Espagne",
          "L'Italie"
        ],
        correctAnswerIndex: 1,
        explanation: "La Statue de la Liberté a été offerte par le peuple français aux États-Unis en signe d'amitié entre les deux nations, pour célébrer le centenaire de la déclaration d'indépendance.",
        type: "qcm_single",
        difficulty: QuizDifficulty.FACILE,
        recommendedTime: 15,
        category: "Culture générale"
      }
    ]
  },
  {
    id: "quiz-histoire-fr",
    title: "Les Secrets de l'Histoire de France",
    description: "Redécouvre les événements marquants et les personnages clés de l'histoire de France.",
    category: "Histoire",
    difficulty: QuizDifficulty.DIFFICILE,
    playsCount: 890,
    createdAt: "2026-06-01T14:30:00Z",
    questions: [
      {
        id: "hist-q1",
        questionText: "Le roi de France Henri IV a promulgué l'Édit de Nantes pour mettre fin aux guerres de religion.",
        options: [
          "Vrai",
          "Faux"
        ],
        correctAnswerIndex: 0,
        explanation: "Vrai. Henri IV a signé l'Édit de Nantes en 1598, accordant des droits de culte et d'accès civils aux protestants huguenots pour ramener la paix religieuse.",
        type: "vrai_faux",
        difficulty: QuizDifficulty.FACILE,
        recommendedTime: 15,
        category: "Histoire"
      },
      {
        id: "hist-q2",
        questionText: "Quel roi de France était surnommé le 'Roi-Soleil' ?",
        options: [
          "François Ier",
          "Henri IV",
          "Louis XIV",
          "Louis XVI"
        ],
        correctAnswerIndex: 2,
        explanation: "Louis XIV a régné pendant 72 ans et s'est choisi le Soleil comme emblème, symbole de puissance, de rayonnement et d'ordre.",
        type: "qcm_single",
        difficulty: QuizDifficulty.MOYEN,
        recommendedTime: 15,
        category: "Histoire"
      },
      {
        id: "hist-q3",
        questionText: "En quelle année s'est déroulée la prise de la Bastille ? (Entrer l'année sous forme de 4 chiffres)",
        options: [],
        correctFreeText: "1789",
        explanation: "La prise de la Bastille, événement emblématique marquant le début de la Révolution française, s'est déroulée le 14 juillet 1789 à Paris.",
        type: "libre",
        difficulty: QuizDifficulty.MOYEN,
        recommendedTime: 20,
        category: "Histoire"
      },
      {
        id: "hist-q4",
        questionText: "Quelle célèbre bataille a vu la défaite finale de Napoléon Ier en 1815 ?",
        options: [
          "La bataille d'Austerlitz",
          "La bataille d'Iéna",
          "La bataille de Waterloo",
          "La bataille de Trafalgar"
        ],
        correctAnswerIndex: 2,
        explanation: "La bataille de Waterloo s'est soldée par une défaite de l'armée française face à la coalition britannique et prussienne, marquant la fin du Premier Empire.",
        type: "qcm_single",
        difficulty: QuizDifficulty.DIFFICILE,
        recommendedTime: 20,
        category: "Histoire"
      }
    ]
  },
  {
    id: "quiz-tech-ia",
    title: "L'Intelligence Artificielle & La Tech",
    description: "Un quiz passionnant sur l'histoire de l'informatique, des algorithmes et de l'IA moderne.",
    category: "Technologie",
    difficulty: QuizDifficulty.MOYEN,
    playsCount: 2310,
    createdAt: "2026-06-20T08:15:00Z",
    questions: [
      {
        id: "tech-q1",
        questionText: "Qui est considéré comme le père fondateur de l'informatique et de l'intelligence artificielle ?",
        options: [
          "Bill Gates",
          "Alan Turing",
          "Steve Jobs",
          "Ada Lovelace"
        ],
        correctAnswerIndex: 1,
        explanation: "Alan Turing a conceptualisé la machine de Turing et a proposé le 'Test de Turing' pour évaluer la capacité d'une machine à faire preuve d'intelligence.",
        type: "qcm_single",
        difficulty: QuizDifficulty.MOYEN,
        recommendedTime: 15,
        category: "Technologie"
      },
      {
        id: "tech-q2",
        questionText: "De quel composant matériel s'agit-il sur cette image ?",
        options: [
          "Disque dur SSD",
          "Processeur (CPU)",
          "Barrette de RAM",
          "Carte graphique (GPU)"
        ],
        correctAnswerIndex: 1,
        explanation: "Il s'agit d'un microprocesseur (CPU), le cerveau de l'ordinateur responsable de l'exécution des instructions des programmes.",
        imageUrl: "https://images.unsplash.com/photo-1591799264318-7e6ef8ddb7ea?auto=format&fit=crop&w=600&q=80",
        type: "qcm_single",
        difficulty: QuizDifficulty.FACILE,
        recommendedTime: 15,
        category: "Technologie"
      },
      {
        id: "tech-q3",
        questionText: "Que signifie l'acronyme GPT dans 'ChatGPT' ?",
        options: [
          "General Processing Tool",
          "Generative Pre-trained Transformer",
          "Global Program Technological",
          "Graphical Path Tracing"
        ],
        correctAnswerIndex: 1,
        explanation: "'Generative Pre-trained Transformer' fait référence à l'architecture de réseau de neurones 'Transformer' qui a été pré-entraînée sur un immense corpus de textes.",
        type: "qcm_single",
        difficulty: QuizDifficulty.MOYEN,
        recommendedTime: 20,
        category: "Technologie"
      }
    ]
  },
  {
    id: "quiz-jeux-video",
    title: "Culture Gaming & Légendes",
    description: "Es-tu un vrai gamer ? Prouve-le avec ces questions sur l'histoire des jeux vidéo !",
    category: "Jeux vidéo",
    difficulty: QuizDifficulty.FACILE,
    playsCount: 3410,
    createdAt: "2026-07-01T12:00:00Z",
    questions: [
      {
        id: "jv-q1",
        questionText: "Quel est le jeu vidéo le plus vendu de tous les temps ?",
        options: [
          "Minecraft",
          "Grand Theft Auto V",
          "Tetris",
          "Wii Sports"
        ],
        correctAnswerIndex: 0,
        explanation: "Minecraft s'est vendu à plus de 300 millions d'exemplaires toutes plateformes confondues, dépassant Tetris et GTA V.",
        type: "qcm_single",
        difficulty: QuizDifficulty.FACILE,
        recommendedTime: 15,
        category: "Jeux vidéo"
      },
      {
        id: "jv-q2",
        questionText: "Écoute attentivement cette mélodie iconique. De quelle saga mythique provient ce morceau joué au violon ?",
        options: [
          "The Legend of Zelda",
          "Super Mario Bros",
          "Final Fantasy",
          "Skyrim"
        ],
        correctAnswerIndex: 0,
        explanation: "Il s'agit du thème principal de 'The Legend of Zelda', composé par Koji Kondo. Une œuvre d'art intemporelle de la musique de jeu vidéo.",
        audioUrl: "https://www.soundhelix.com/examples/mp3/SoundHelix-Song-1.mp3",
        type: "qcm_single",
        difficulty: QuizDifficulty.MOYEN,
        recommendedTime: 20,
        category: "Jeux vidéo"
      },
      {
        id: "jv-q3",
        questionText: "Quel personnage de jeu vidéo a été créé en s'inspirant d'un gorille et d'un plombier italien ?",
        options: [
          "Luigi",
          "Donkey Kong",
          "Mario",
          "Bowser"
        ],
        correctAnswerIndex: 2,
        explanation: "Mario est né sous le nom de 'Jumpman' dans le jeu Donkey Kong en 1981, avant de devenir le plombier le plus célèbre du monde.",
        type: "qcm_single",
        difficulty: QuizDifficulty.FACILE,
        recommendedTime: 15,
        category: "Jeux vidéo"
      }
    ]
  }
];

export const DEFAULT_LEADERBOARD: LeaderboardEntry[] = [
  {
    uid: "u-1",
    pseudo: "Aline_LaGagnante",
    avatarUrl: "https://api.dicebear.com/7.x/pixel-art/svg?seed=aline",
    xp: 28400,
    level: 42
  },
  {
    uid: "u-2",
    pseudo: "JeanQuiz",
    avatarUrl: "https://api.dicebear.com/7.x/pixel-art/svg?seed=jean",
    xp: 24150,
    level: 38
  },
  {
    uid: "u-3",
    pseudo: "MasterMind",
    avatarUrl: "https://api.dicebear.com/7.x/pixel-art/svg?seed=mind",
    xp: 21900,
    level: 35
  },
  {
    uid: "u-4",
    pseudo: "TuringFan",
    avatarUrl: "https://api.dicebear.com/7.x/pixel-art/svg?seed=turing",
    xp: 18500,
    level: 29
  },
  {
    uid: "u-5",
    pseudo: "Geekette_99",
    avatarUrl: "https://api.dicebear.com/7.x/pixel-art/svg?seed=geek",
    xp: 15120,
    level: 24
  },
  {
    uid: "u-6",
    pseudo: "Marie_Curie_Acolyte",
    avatarUrl: "https://api.dicebear.com/7.x/pixel-art/svg?seed=marie",
    xp: 12900,
    level: 21
  }
];
