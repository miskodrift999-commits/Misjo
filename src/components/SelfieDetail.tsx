import React, { useState } from "react";
import { Sparkles, Heart, FileText, Palette, Smile, ClipboardCheck, Clipboard, ExternalLink } from "lucide-react";
import { SelfiePhoto } from "../types";

interface SelfieDetailProps {
  photo: SelfiePhoto;
}

export function SelfieDetail({ photo }: SelfieDetailProps) {
  const [copiedColor, setCopiedColor] = useState<string | null>(null);

  const copyToClipboard = (hex: string) => {
    navigator.clipboard.writeText(hex);
    setCopiedColor(hex);
    setTimeout(() => setCopiedColor(null), 2500);
  };

  const formattedDate = new Date(photo.timestamp).toLocaleDateString("en-US", {
    weekday: "long",
    year: "numeric",
    month: "long",
    day: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });

  return (
    <div id="selfie-detail-view" className="bg-[#0F0F0F] border border-[#2A2A2A] overflow-hidden sticky top-24 shadow-2xl">
      {/* Decorative Serial ID */}
      <div className="border-b border-[#2A2A2A] px-5 py-3.5 flex justify-between items-center bg-[#0C0C0C]">
        <span className="text-[10px] font-mono tracking-[0.3em] text-zinc-500 uppercase">
          SPECTRA_LOG / {photo.id.slice(0, 8).toUpperCase()}
        </span>
        <span className="text-[9px] font-mono tracking-widest text-[#E5E5E5] bg-[#2A2A2A]/40 border border-[#2A2A2A] px-2 py-0.5">
          STABLE_RECORD
        </span>
      </div>

      {/* Main image presentation */}
      <div className="relative bg-zinc-950 aspect-[4/3] flex items-center justify-center overflow-hidden border-b border-[#2A2A2A]">
        <img
          src={photo.url}
          alt={photo.note || "Active Selfie Analysis"}
          className="w-full h-full object-cover"
        />

        {/* Dynamic Vignette / Highlight border */}
        <div className="absolute inset-0 pointer-events-none border-[12px] border-[#0F0F0F] opacity-90"></div>
      </div>

      <div className="p-6 space-y-6">
        {/* User raw note */}
        {photo.note && (
          <div className="space-y-1 block border-l border-zinc-700 pl-4">
            <span className="text-[9px] font-mono tracking-widest uppercase text-zinc-600 block">
              Mindset Note
            </span>
            <p className="text-xs text-zinc-400 italic">
              "{photo.note}"
            </p>
          </div>
        )}

        {/* Loading of analysis details */}
        {photo.isAnalyzing ? (
          <div className="py-12 flex flex-col items-center justify-center text-center space-y-4">
            <div className="h-6 w-6 border-2 border-zinc-500 border-t-white rounded-full animate-spin"></div>
            <div className="space-y-1.5">
              <h3 className="text-sm font-serif italic text-white">Refracting Style Dimensions</h3>
              <p className="text-[9px] uppercase tracking-[0.2em] text-zinc-500 font-mono">
                Running server-side Gemini 3.5 analyzer...
              </p>
            </div>
          </div>
        ) : photo.analysis ? (
          <div className="space-y-6 animate-fadeIn">
            {/* Vibe Profile mood header */}
            <div className="space-y-2">
              <div className="flex justify-between items-end">
                <div>
                  <span className="text-[9px] font-mono uppercase tracking-[0.3em] text-zinc-500 block">
                    Style Atmosphere
                  </span>
                  <h3 className="text-2xl font-serif text-white italic tracking-wide mt-1">
                    {photo.analysis.mood}
                  </h3>
                </div>

                {/* Rating score badge */}
                <div className="text-right">
                  <span className="text-[9px] font-mono uppercase tracking-widest text-zinc-500 block">
                    Vibe Synergy
                  </span>
                  <div className="flex items-center gap-1 mt-0.5 justify-end">
                    <Heart className="h-3.5 w-3.5 text-zinc-400 fill-zinc-400" />
                    <span className="text-lg font-mono font-bold text-white">
                      {photo.analysis.vibesRating}%
                    </span>
                  </div>
                </div>
              </div>

              {/* Progress Bar meter */}
              <div className="w-full h-1 bg-[#1A1A1A] rounded-none">
                <div
                  className="h-full bg-[#E5E5E5] transition-all duration-1000"
                  style={{ width: `${photo.analysis.vibesRating}%` }}
                />
              </div>
            </div>

            {/* Glowing Confidence Booster highlight */}
            <div className="bg-[#141414] border border-[#2A2A2A] p-5 relative overflow-hidden">
              <div className="absolute top-3 right-3 opacity-10">
                <Sparkles className="h-10 w-10 text-white" />
              </div>
              <h4 className="text-[9px] font-mono uppercase tracking-widest text-[#737373] mb-2.5">
                EXCERPT_AFFIRMATION
              </h4>
              <blockquote className="text-sm font-serif italic text-zinc-200 leading-relaxed pr-6">
                "{photo.analysis.confidenceBooster}"
              </blockquote>
            </div>

            {/* Structured details: Style description vs accessories */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-1.5">
              <div className="space-y-1.5">
                <span className="text-[9px] font-mono uppercase tracking-widest text-zinc-500 block">
                  Outfitting Coordinates
                </span>
                <p className="text-xs text-zinc-400 leading-relaxed font-sans">
                  {photo.analysis.outfitDescription}
                </p>
              </div>

              <div className="space-y-1.5">
                <span className="text-[9px] font-mono uppercase tracking-widest text-zinc-500 block">
                  Aesthetic Synthesis
                </span>
                <p className="text-xs text-zinc-400 leading-relaxed font-sans">
                  {photo.analysis.styleFeedback}
                </p>
              </div>
            </div>

            {/* Dominant analysis colors */}
            {photo.analysis.dominantColors && photo.analysis.dominantColors.length > 0 && (
              <div className="space-y-2.5 pt-2">
                <span className="text-[9px] font-mono uppercase tracking-[0.25em] text-zinc-500 block">
                  Harmonious Chromas
                </span>
                <div className="grid grid-cols-4 sm:grid-cols-5 gap-2.5">
                  {photo.analysis.dominantColors.map((hex) => (
                    <div
                      key={hex}
                      onClick={() => copyToClipboard(hex)}
                      className="group/swatch cursor-pointer text-center space-y-1.5"
                    >
                      <div
                        className="aspect-square w-full border border-zinc-800 transition-transform group-hover/swatch:scale-105 active:scale-95 shadow-lg relative flex items-center justify-center"
                        style={{ backgroundColor: hex }}
                      >
                        {copiedColor === hex ? (
                          <div className="absolute inset-0 bg-black/40 flex items-center justify-center text-xs text-white">
                            <ClipboardCheck className="h-4 w-4" />
                          </div>
                        ) : (
                          <div className="absolute inset-0 bg-black/0 group-hover/swatch:bg-black/20 flex items-center justify-center text-xs text-white opacity-0 group-hover/swatch:opacity-100 transition-all">
                            <Clipboard className="h-3 w-3" />
                          </div>
                        )}
                      </div>
                      <span className="block text-[10px] font-mono text-zinc-500">
                        {hex.toUpperCase()}
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Footnote meta */}
            <div className="border-t border-[#2A2A2A] pt-4 flex flex-col sm:flex-row sm:items-center justify-between text-[10px] font-mono text-zinc-600 gap-2">
              <span className="uppercase tracking-widest">
                Timestamp: {photo.timestamp}
              </span>
              <span className="uppercase truncate max-w-xs text-right">
                {formattedDate}
              </span>
            </div>
          </div>
        ) : (
          <div className="py-8 text-center text-zinc-500 text-xs font-mono space-y-4">
            <p className="uppercase tracking-widest">Failed to retrieve analyze report</p>
            {photo.error && (
              <p className="text-rose-400 font-sans border border-[#2A2A2A] p-3 text-[11px] leading-relaxed">
                {photo.error}
              </p>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
