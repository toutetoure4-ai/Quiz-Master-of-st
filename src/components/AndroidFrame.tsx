import React from "react";

interface AndroidFrameProps {
  children: React.ReactNode;
  darkMode: boolean;
}

export default function AndroidFrame({ children, darkMode }: AndroidFrameProps) {
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

        {/* Active Screen Viewport */}
        <div className="flex-1 w-full flex flex-col overflow-hidden relative">
          {children}
        </div>
      </div>
    </div>
  );
}
