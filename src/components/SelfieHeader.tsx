import React, { useState, useEffect } from "react";
import { Camera, Sparkles, Heart } from "lucide-react";

interface SelfieHeaderProps {
  totalCount: number;
}

export function SelfieHeader({ totalCount }: SelfieHeaderProps) {
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
    <header id="app-header" className="border-b border-blue-100 bg-white/70 backdrop-blur-md sticky top-0 z-50 transition-all duration-300">
      <div className="max-w-6xl mx-auto px-4 py-4 sm:px-6 lg:px-8 flex flex-col sm:flex-row items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="h-10 w-10 rounded-lg border border-blue-100 bg-white flex items-center justify-center text-[#005BFE] shadow-sm">
            <Camera className="h-5 w-5 opacity-90" />
          </div>
          <div>
            <div className="flex items-center gap-3">
              <h1 className="text-xl sm:text-2xl font-serif italic tracking-wide text-zinc-900">
                Selfie Journal
              </h1>
              <span className="inline-flex items-center gap-1.5 bg-[#005BFE]/10 text-[#005BFE] text-[10px] font-mono tracking-widest px-2.5 py-1 rounded-sm border border-blue-100/50 font-bold">
                <Sparkles className="h-3 w-3 text-[#FF7830]" />
                VIBE ANALYST
              </span>
            </div>
            <p className="text-[11px] uppercase tracking-[0.2em] text-zinc-500 mt-0.5 font-sans">
              A curated photographic log of identity & style analysis
            </p>
          </div>
        </div>

        <div className="flex items-center gap-4 text-xs font-mono">
          {/* Current Time Clock */}
          <div className="bg-white/80 border border-blue-100 px-3 py-1.5 rounded-sm text-[#005BFE] flex items-center gap-1.5 shadow-sm font-semibold">
            <span className="h-1.5 w-1.5 rounded-full bg-[#FF7830] animate-ping"></span>
            <span>{time || "14:04:29"}</span>
          </div>

          {/* Stats Summary Counter */}
          <div className="bg-white/80 border border-blue-100 px-3 py-1.5 rounded-sm text-zinc-650 flex items-center gap-1.5 shadow-sm font-semibold">
            <Heart className="h-3.5 w-3.5 text-[#FF7830] fill-[#FF7830]/20" />
            <span className="uppercase tracking-widest text-[10px]">
              <strong className="text-[#005BFE] font-bold">{totalCount}</strong> {totalCount === 1 ? "EXHIBIT" : "EXHIBITS"}
            </span>
          </div>
        </div>
      </div>
    </header>
  );
}
