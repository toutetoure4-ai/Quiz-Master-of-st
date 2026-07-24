import React from "react";
import ModeInDevelopmentScreen from "./ModeInDevelopmentScreen";
import { UserProfile, Quiz } from "../types";

interface SocialHubScreenProps {
  user: UserProfile;
  quizzes: Quiz[];
  onBack?: () => void;
  onPlayQuiz?: (quiz: Quiz) => void;
}

export default function SocialHubScreen({ onBack }: SocialHubScreenProps) {
  return (
    <ModeInDevelopmentScreen 
      title="Espace Social & Multijoueur" 
      icon="social" 
      onBack={onBack} 
    />
  );
}
