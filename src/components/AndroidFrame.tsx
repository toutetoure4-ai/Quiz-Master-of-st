import React, { useState, useEffect } from "react";
import { Wifi, Battery, Signal } from "lucide-react";

interface AndroidFrameProps {
  children: React.ReactNode;
  darkMode: boolean;
}

export default function AndroidFrame({ children, darkMode }: AndroidFrameProps) {
  const [time, setTime] = useState("");

  useEffect(() => {
    const updateTime = () => {
      const now = new Date();
      const hours = String(now.getHours()).padStart(2, "0");
      const minutes = String(now.getMinutes()).padStart(2, "0");
      setTime(`${hours}:${minutes}`);
    };
    updateTime();
    const interval = setInterval(updateTime, 60000);
    return () => clearInterval(interval);
  }, []);

  return (
    <div className={`min-h-screen w-full flex items-center justify-center p-0 md:p-6 bg-slate-200 dark:bg-slate-900 transition-colors duration-300`}>
      {/* Container Device Wrapper for Desktop */}
      <div 
        id="android-device-frame"
        className="relative w-full max-w-md h-screen md:h-[860px] md:rounded-[48px] md:border-[12px] md:border-slate-800 dark:md:border-slate-800 bg-white dark:bg-slate-950 flex flex-col overflow-hidden md:shadow-2xl transition-all duration-300"
      >
        {/* Android Punch Hole Camera Notch (Only on desktop frame) */}
        <div className="absolute top-3 left-1/2 -translate-x-1/2 w-32 h-6 bg-slate-800 dark:bg-slate-800 rounded-full z-50 hidden md:flex items-center justify-center">
          <div className="w-3 h-3 rounded-full bg-slate-900 border border-slate-700"></div>
        </div>

        {/* Status Bar */}
        <div className="w-full h-11 px-6 pt-2 pb-1 flex items-center justify-between text-xs font-semibold select-none z-40 bg-white/90 dark:bg-slate-950/90 backdrop-blur-sm text-slate-800 dark:text-slate-100 transition-colors duration-300 shrink-0">
          <span className="font-sans text-[13px]">{time}</span>
          <div className="flex items-center gap-1.5">
            <Signal className="w-3.5 h-3.5" />
            <Wifi className="w-3.5 h-3.5" />
            <Battery className="w-4 h-4 rotate-90 ml-0.5" />
          </div>
        </div>

        {/* Active Screen Viewport */}
        <div className="flex-1 w-full flex flex-col overflow-hidden relative">
          {children}
        </div>

        {/* Android Navigation Home Bar (Only on desktop frame) */}
        <div className="w-full h-6 pb-2 flex items-center justify-center bg-white dark:bg-slate-950 transition-colors duration-300 shrink-0 z-40">
          <div className="w-32 h-1 bg-slate-300 dark:bg-slate-700 rounded-full"></div>
        </div>
      </div>
    </div>
  );
}
