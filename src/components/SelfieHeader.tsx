import React, { useState, useEffect } from "react";
import { Camera, Sparkles, Heart, Sun, Moon } from "lucide-react";

interface SelfieHeaderProps {
  totalCount: number;
  theme: "light" | "dark";
  onToggleTheme: () => void;
}

export function SelfieHeader({ totalCount, theme, onToggleTheme }: SelfieHeaderProps) {
  const [time, setTime] = useState<string>("");

  useEffect(() => {
    const updateTime = () => {
      // Use UTC format or standard local time formatted elegantly
      const now = new Date();
      setTime(
        now.toLocaleTimeString("en-US", {
          hour: "2-digit",
          minute: "2-digit",
          second: "2-digit",
          hour12: true,
        })
      );
    };

    updateTime();
    const interval = setInterval(updateTime, 1000);
    return () => clearInterval(interval);
  }, []);

  return (
    <header id="app-header" className="border-b border-blue-100 dark:border-indigo-950/50 bg-white/70 dark:bg-[#070611]/85 backdrop-blur-md sticky top-0 z-50 transition-all duration-300">
      <div className="max-w-6xl mx-auto px-4 py-4 sm:px-6 lg:px-8 flex flex-col sm:flex-row items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="h-10 w-10 rounded-lg border border-blue-100 dark:border-indigo-900/50 bg-white dark:bg-zinc-900 flex items-center justify-center text-[#005BFE] dark:text-indigo-400 shadow-sm transition-all duration-300">
            <Camera className="h-5 w-5 opacity-90" />
          </div>
          <div>
            <div className="flex items-center gap-3">
              <h1 className="text-xl sm:text-2xl font-serif italic tracking-wide text-zinc-900 dark:text-slate-100">
                Selfie Journal
              </h1>
              <span className="inline-flex items-center gap-1.5 bg-[#005BFE]/10 dark:bg-[#4F46E5]/15 text-[#005BFE] dark:text-indigo-300 text-[10px] font-mono tracking-widest px-2.5 py-1 rounded-sm border border-blue-100/50 dark:border-indigo-950/40 font-bold">
                <Sparkles className="h-3 w-3 text-[#FF7830]" />
                VIBE ANALYST
              </span>
            </div>
            <p className="text-[11px] uppercase tracking-[0.2em] text-zinc-500 dark:text-zinc-400 mt-0.5 font-sans">
              A curated photographic log of identity & style analysis
            </p>
          </div>
        </div>

        <div className="flex items-center gap-4 text-xs font-mono">
          {/* Theme Switcher Toggle button */}
          <button
            type="button"
            onClick={onToggleTheme}
            className="flex items-center gap-2 px-3 py-1.5 border rounded-sm text-xs font-mono font-bold tracking-wider transition-all duration-300 shadow-sm cursor-pointer hover:scale-[1.02] active:scale-[0.98]
              bg-white/80 dark:bg-slate-900/60 border-blue-100 dark:border-indigo-950/65 
              text-[#005BFE] dark:text-indigo-350 hover:bg-blue-50/50 dark:hover:bg-indigo-950/80"
            title={`Switch to ${theme === "light" ? "Midnight Velvet" : "Iridescent Light"}`}
          >
            {theme === "light" ? (
              <>
                <Moon className="h-3.5 w-3.5 text-[#005BFE] fill-[#005BFE]/15" />
                <span className="hidden md:inline uppercase tracking-widest text-[9px] text-[#005BFE]">Midnight Velvet</span>
              </>
            ) : (
              <>
                <Sun className="h-3.5 w-3.5 text-[#FF7830] animate-pulse" />
                <span className="hidden md:inline uppercase tracking-widest text-[9px] text-[#FF7830]">Iridescent Deck</span>
              </>
            )}
          </button>

          {/* Current Time Clock */}
          <div className="bg-white/80 dark:bg-[#070611]/60 border border-blue-100 dark:border-indigo-950/65 px-3 py-1.5 rounded-sm text-[#005BFE] dark:text-indigo-400 flex items-center gap-1.5 shadow-sm font-semibold transition-all duration-350">
            <span className="h-1.5 w-1.5 rounded-full bg-[#FF7830] animate-ping"></span>
            <span>{time || "14:04:29"}</span>
          </div>

          {/* Stats Summary Counter */}
          <div className="bg-white/80 dark:bg-[#070611]/60 border border-blue-100 dark:border-indigo-950/65 px-3 py-1.5 rounded-sm text-zinc-650 dark:text-zinc-350 flex items-center gap-1.5 shadow-sm font-semibold transition-all duration-350">
            <Heart className="h-3.5 w-3.5 text-[#FF7830] fill-[#FF7830]/20" />
            <span className="uppercase tracking-widest text-[10px]">
              <strong className="text-[#005BFE] dark:text-indigo-300 font-bold">{totalCount}</strong> {totalCount === 1 ? "EXHIBIT" : "EXHIBITS"}
            </span>
          </div>
        </div>
      </div>
    </header>
  );
}
