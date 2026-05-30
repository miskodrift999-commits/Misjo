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
    <header id="app-header" className="border-b border-[#2A2A2A] bg-[#0C0C0C]/90 backdrop-blur-md sticky top-0 z-50 transition-all duration-300">
      <div className="max-w-6xl mx-auto px-4 py-4 sm:px-6 lg:px-8 flex flex-col sm:flex-row items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="h-10 w-10 rounded-lg border border-[#2A2A2A] bg-[#0F0F0F] flex items-center justify-center text-[#E5E5E5] shadow-inner">
            <Camera className="h-5 w-5 opacity-80" />
          </div>
          <div>
            <div className="flex items-center gap-3">
              <h1 className="text-xl sm:text-2xl font-serif italic tracking-wide text-white">
                Selfie Journal
              </h1>
              <span className="inline-flex items-center gap-1.5 bg-[#141414] text-[#A3A3A3] text-[10px] uppercase tracking-widest px-2.5 py-1 rounded-sm border border-[#2A2A2A]">
                <Sparkles className="h-3 w-3 text-amber-400" />
                VIBE ANALYST
              </span>
            </div>
            <p className="text-[11px] uppercase tracking-[0.2em] text-[#737373] mt-0.5 font-sans">
              A curated photographic log of identity & style analysis
            </p>
          </div>
        </div>

        <div className="flex items-center gap-4 text-xs font-mono">
          {/* Current Time Clock */}
          <div className="bg-[#0F0F0F] border border-[#2A2A2A] px-3 py-1.5 rounded-sm text-[#A3A3A3] flex items-center gap-1.5 shadow-sm">
            <span className="h-1.5 w-1.5 rounded-full bg-amber-400 animate-ping"></span>
            <span>{time || "14:04:29"}</span>
          </div>

          {/* Stats Summary Counter */}
          <div className="bg-[#0F0F0F] border border-[#2A2A2A] px-3 py-1.5 rounded-sm text-[#A3A3A3] flex items-center gap-1.5 shadow-sm">
            <Heart className="h-3.5 w-3.5 text-zinc-400 fill-zinc-800" />
            <span className="uppercase tracking-widest text-[10px]">
              <strong className="text-white font-semibold">{totalCount}</strong> {totalCount === 1 ? "EXHIBIT" : "EXHIBITS"}
            </span>
          </div>
        </div>
      </div>
    </header>
  );
}
