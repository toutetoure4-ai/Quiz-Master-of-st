export type Language = "fr" | "en" | "es";

export const translations: Record<Language, Record<string, string>> = {
  fr: {
    // Nav
    nav_home: "Accueil",
    nav_levels: "Niveaux IA",
    nav_explore: "Explorer",
    nav_create: "Créer",
    nav_social: "Social",
    nav_leaderboard: "Classement",
    nav_profile: "Profil",
    nav_settings: "Paramètres",

    // Home
    welcome: "Bienvenue",
    hello: "Salut",
    current_level: "Niveau actuel",
    total_xp: "Total XP",
    xp_to_next: "XP pour Niv.",
    mode_progression_ia: "MODE PROGRESSION IA",
    mode_levels_title: "Mode Niveaux IA (De + en + difficile)",
    mode_levels_desc: "Questions inédites à chaque palier. Débloque tous les niveaux !",
    quizzes_played: "Quiz joués",
    success_rate: "Taux réussite",
    daily_missions: "Missions Quotidiennes",
    claim: "Récupérer",
    claimed: "Récupéré",
    reward: "Récompense",
    continue_quiz: "Continuer le défi",
    popular_categories: "Catégories populaires",
    see_all: "Voir tout",
    popular_quizzes: "Quiz Populaires",
    recent_quizzes: "Derniers Quiz Ajoutés",

    // Unavailable Mode Message
    mode_unavailable_title: "En cours de développement",
    mode_unavailable_desc: "Ce mode n'est pas encore disponible. Le jeu est en cours de développement.",
    back_to_home: "Retour à l'accueil",

    // Profile & Settings
    edit_profile: "Éditer Profil",
    my_profile_title: "Mon Profil & Identité",
    system_prefs: "Préférences système & Affichage",
    dark_mode: "Mode Sombre",
    dark_mode_desc: "Réduit la fatigue oculaire la nuit",
    sound_fx: "Effets sonores & Bruitages",
    sound_fx_desc: "Sons lors des bonnes réponses et victoires",
    app_language: "Langue de l'application",
    app_language_desc: "Sélectionne ton langage préféré",
    text_size: "Taille du texte",
    text_size_desc: "Ajuster la taille de police des questions",
    tts_auto: "Lecture audio automatique",
    tts_auto_desc: "Lit la question dès qu'elle apparaît",
    voice_speed: "Vitesse de voix",
    notifications_title: "Alertes & Notifications de jeu",
    challenge_invites: "Invitations aux défis",
    challenge_results: "Résultats des défis",
    new_badges: "Nouveaux badges",
    daily_reminders: "Rappels de série",
    privacy_mode: "Mode Confidentialité",
    privacy_mode_desc: "Masquer mon profil du classement mondial",
    clear_cache: "Vider le cache local",
    clear_cache_desc: "Supprime les brouillons temporaires",
    about_app: "À propos de QuizMaster",
    logout: "Se déconnecter de mon profil",
    save: "Enregistrer",
    cancel: "Annuler",
    change_avatar_pseudo: "Changer de Pseudo & Avatar",

    // Explorer & Create
    search_placeholder: "Rechercher un quiz ou sujet...",
    all_categories: "Toutes les catégories",
    create_quiz_title: "Créer un nouveau Quiz",
    publish_quiz: "Publier le Quiz",

    // Quiz Player
    question: "Question",
    time_left: "Temps restant",
    next_question: "Question suivante",
    finish_quiz: "Terminer le Quiz",
    quiz_completed: "Quiz Terminé !"
  },
  en: {
    // Nav
    nav_home: "Home",
    nav_levels: "AI Levels",
    nav_explore: "Explore",
    nav_create: "Create",
    nav_social: "Social",
    nav_leaderboard: "Leaderboard",
    nav_profile: "Profile",
    nav_settings: "Settings",

    // Home
    welcome: "Welcome",
    hello: "Hi",
    current_level: "Current Level",
    total_xp: "Total XP",
    xp_to_next: "XP to Lvl",
    mode_progression_ia: "AI PROGRESSION MODE",
    mode_levels_title: "AI Levels Mode (Increasing difficulty)",
    mode_levels_desc: "Unique questions at every level. Unlock all levels!",
    quizzes_played: "Quizzes Played",
    success_rate: "Success Rate",
    daily_missions: "Daily Missions",
    claim: "Claim",
    claimed: "Claimed",
    reward: "Reward",
    continue_quiz: "Continue Challenge",
    popular_categories: "Popular Categories",
    see_all: "See all",
    popular_quizzes: "Popular Quizzes",
    recent_quizzes: "Recently Added Quizzes",

    // Unavailable Mode Message
    mode_unavailable_title: "Under Development",
    mode_unavailable_desc: "Ce mode n'est pas encore disponible. Le jeu est en cours de développement.",
    back_to_home: "Back to Home",

    // Profile & Settings
    edit_profile: "Edit Profile",
    my_profile_title: "My Profile & Identity",
    system_prefs: "System & Display Preferences",
    dark_mode: "Dark Mode",
    dark_mode_desc: "Reduces eye strain at night",
    sound_fx: "Sound Effects & Audio",
    sound_fx_desc: "Sounds for correct answers and victories",
    app_language: "App Language",
    app_language_desc: "Select your preferred language",
    text_size: "Text Size",
    text_size_desc: "Adjust question font size",
    tts_auto: "Auto Text-To-Speech",
    tts_auto_desc: "Reads questions automatically",
    voice_speed: "Voice Speed",
    notifications_title: "Game Alerts & Notifications",
    challenge_invites: "Challenge Invites",
    challenge_results: "Challenge Results",
    new_badges: "New Badges",
    daily_reminders: "Streak Reminders",
    privacy_mode: "Privacy Mode",
    privacy_mode_desc: "Hide profile from global leaderboard",
    clear_cache: "Clear Local Cache",
    clear_cache_desc: "Deletes temporary drafts",
    about_app: "About QuizMaster",
    logout: "Log Out",
    save: "Save",
    cancel: "Cancel",
    change_avatar_pseudo: "Change Username & Avatar",

    // Explorer & Create
    search_placeholder: "Search quiz or topic...",
    all_categories: "All Categories",
    create_quiz_title: "Create a New Quiz",
    publish_quiz: "Publish Quiz",

    // Quiz Player
    question: "Question",
    time_left: "Time Left",
    next_question: "Next Question",
    finish_quiz: "Finish Quiz",
    quiz_completed: "Quiz Completed!"
  },
  es: {
    // Nav
    nav_home: "Inicio",
    nav_levels: "Niveles IA",
    nav_explore: "Explorar",
    nav_create: "Crear",
    nav_social: "Social",
    nav_leaderboard: "Clasificación",
    nav_profile: "Perfil",
    nav_settings: "Ajustes",

    // Home
    welcome: "Bienvenido",
    hello: "Hola",
    current_level: "Nivel Actual",
    total_xp: "Total XP",
    xp_to_next: "XP para Niv.",
    mode_progression_ia: "MODO PROGRESIÓN IA",
    mode_levels_title: "Modo Niveles IA (Dificultad creciente)",
    mode_levels_desc: "Preguntas únicas en cada nivel. ¡Desbloquea todos!",
    quizzes_played: "Quizzes jugados",
    success_rate: "Tasa de éxito",
    daily_missions: "Misiones Diarias",
    claim: "Reclamar",
    claimed: "Reclamado",
    reward: "Recompensa",
    continue_quiz: "Continuar Desafío",
    popular_categories: "Categorías Populares",
    see_all: "Ver todo",
    popular_quizzes: "Quizzes Populares",
    recent_quizzes: "Últimos Quizzes Añadidos",

    // Unavailable Mode Message
    mode_unavailable_title: "En Desarrollo",
    mode_unavailable_desc: "Ce mode n'est pas encore disponible. Le jeu est en cours de développement.",
    back_to_home: "Volver al Inicio",

    // Profile & Settings
    edit_profile: "Editar Perfil",
    my_profile_title: "Mi Perfil e Identidad",
    system_prefs: "Preferencias del Sistema y Pantalla",
    dark_mode: "Modo Oscuro",
    dark_mode_desc: "Reduce la fatiga visual de noche",
    sound_fx: "Efectos de Sonido",
    sound_fx_desc: "Sonidos en respuestas correctas y victorias",
    app_language: "Idioma de la Aplicación",
    app_language_desc: "Selecciona tu idioma preferido",
    text_size: "Tamaño del Texto",
    text_size_desc: "Ajustar el tamaño de letra de las preguntas",
    tts_auto: "Lectura de Voz Automática",
    tts_auto_desc: "Lee las preguntas automáticamente",
    voice_speed: "Velocidad de Voz",
    notifications_title: "Alertas y Notificaciones",
    challenge_invites: "Invitaciones a Desafíos",
    challenge_results: "Resultados de Desafíos",
    new_badges: "Nuevas Insignias",
    daily_reminders: "Recordatorios de Racha",
    privacy_mode: "Modo Privacidad",
    privacy_mode_desc: "Ocultar perfil de la clasificación global",
    clear_cache: "Limpiar Caché Local",
    clear_cache_desc: "Elimina borradores temporales",
    about_app: "Acerca de QuizMaster",
    logout: "Cerrar Sesión",
    save: "Guardar",
    cancel: "Cancelar",
    change_avatar_pseudo: "Cambiar Nombre y Avatar",

    // Explorer & Create
    search_placeholder: "Buscar quiz o tema...",
    all_categories: "Todas las Categorías",
    create_quiz_title: "Crear un Nuevo Quiz",
    publish_quiz: "Publicar Quiz",

    // Quiz Player
    question: "Pregunta",
    time_left: "Tiempo restante",
    next_question: "Siguiente Pregunta",
    finish_quiz: "Finalizar Quiz",
    quiz_completed: "¡Quiz Completado!"
  }
};

export function t(key: string, lang: Language = "fr"): string {
  const dictionary = translations[lang] || translations.fr;
  return dictionary[key] || translations.fr[key] || key;
}
