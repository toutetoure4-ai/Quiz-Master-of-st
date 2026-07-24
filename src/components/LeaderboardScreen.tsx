import React from "react";
import ModeInDevelopmentScreen from "./ModeInDevelopmentScreen";
import { UserProfile } from "../types";

interface LeaderboardScreenProps {
  user: UserProfile;
  onBack?: () => void;
}

export default function LeaderboardScreen({ onBack }: LeaderboardScreenProps) {
  return (
    <ModeInDevelopmentScreen 
      title="Classement Mondial & Défis" 
      icon="leaderboard" 
      onBack={onBack} 
    />
  );
}
