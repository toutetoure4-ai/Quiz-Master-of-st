import { 
  Globe, 
  Atom, 
  Binary, 
  BookOpen, 
  Map, 
  Trophy, 
  Cpu, 
  Languages, 
  Film, 
  Music, 
  Compass, 
  Code2, 
  TrendingUp, 
  Heart, 
  Gamepad2,
  CheckCircle,
  Zap,
  PlusCircle,
  Star,
  Award,
  Bell,
  Shield,
  Info,
  Clock,
  LogOut,
  ChevronRight,
  User,
  Settings,
  XCircle,
  BookMarked
} from "lucide-react";

interface IconHelperProps {
  name: string;
  className?: string;
}

export default function IconHelper({ name, className = "w-5 h-5" }: IconHelperProps) {
  switch (name) {
    case "Globe": return <Globe className={className} />;
    case "Atom": return <Atom className={className} />;
    case "Binary": return <Binary className={className} />;
    case "BookOpen": return <BookOpen className={className} />;
    case "Map": return <Map className={className} />;
    case "Trophy": return <Trophy className={className} />;
    case "Cpu": return <Cpu className={className} />;
    case "Languages": return <Languages className={className} />;
    case "Film": return <Film className={className} />;
    case "Music": return <Music className={className} />;
    case "Compass": return <Compass className={className} />;
    case "Code2": return <Code2 className={className} />;
    case "TrendingUp": return <TrendingUp className={className} />;
    case "Heart": return <Heart className={className} />;
    case "Gamepad2": return <Gamepad2 className={className} />;
    case "CheckCircle": return <CheckCircle className={className} />;
    case "Zap": return <Zap className={className} />;
    case "PlusCircle": return <PlusCircle className={className} />;
    case "Star": return <Star className={className} />;
    case "Award": return <Award className={className} />;
    case "Bell": return <Bell className={className} />;
    case "Shield": return <Shield className={className} />;
    case "Info": return <Info className={className} />;
    case "Clock": return <Clock className={className} />;
    case "LogOut": return <LogOut className={className} />;
    case "ChevronRight": return <ChevronRight className={className} />;
    case "User": return <User className={className} />;
    case "Settings": return <Settings className={className} />;
    case "XCircle": return <XCircle className={className} />;
    case "BookMarked": return <BookMarked className={className} />;
    default: return <Globe className={className} />;
  }
}
