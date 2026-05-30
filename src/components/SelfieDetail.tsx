import React, { useState } from "react";
import { Sparkles, Heart, FileText, Palette, Smile, ClipboardCheck, Clipboard, ExternalLink, Download } from "lucide-react";
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

  const downloadPhoto = () => {
    const link = document.createElement("a");
    link.href = photo.url;
    link.download = `style_portrait_${photo.id.slice(0, 8)}.jpg`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
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
    <div id="selfie-detail-view" className="bg-white/70 backdrop-blur-md border border-blue-100 overflow-hidden sticky top-24 shadow-md rounded-sm">
      {/* Decorative Serial ID */}
      <div className="border-b border-blue-100 px-5 py-3 flex justify-between items-center bg-blue-50/50">
        <span className="text-[10px] font-mono tracking-[0.3em] text-[#005BFE] uppercase font-bold">
          SPECTRA_LOG / {photo.id.slice(0, 8).toUpperCase()}
        </span>
        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={downloadPhoto}
            className="flex items-center gap-1.5 px-3 py-1 bg-[#005BFE] text-white hover:bg-[#0046C7] text-[10px] font-mono font-bold tracking-widest uppercase rounded-sm shadow-sm transition-all active:scale-95 cursor-pointer"
            title="Download full quality photo"
          >
            <Download className="h-3 w-3" />
            Download
          </button>
          <span className="text-[9px] font-mono tracking-widest text-[#FF7830] bg-[#FF7830]/10 border border-[#FF7830]/20 px-2 py-0.5 font-bold">
            STABLE_RECORD
          </span>
        </div>
      </div>

      {/* Main image presentation */}
      <div className="relative bg-blue-50/20 aspect-[4/3] flex items-center justify-center overflow-hidden border-b border-blue-100">
        <img
          src={photo.url}
          alt={photo.note || "Active Selfie Analysis"}
          className="w-full h-full object-cover"
        />

        {/* Dynamic Vignette / Highlight border */}
        <div className="absolute inset-0 pointer-events-none border-[12px] border-white/5 opacity-40"></div>
      </div>

      <div className="p-6 space-y-6">
        {/* User raw note */}
        {photo.note && (
          <div className="space-y-1 block border-l-2 border-[#005BFE]/40 pl-4">
            <span className="text-[9px] font-mono tracking-widest uppercase text-zinc-500 block font-bold">
              Mindset Note
            </span>
            <p className="text-xs text-zinc-700 italic font-medium">
              "{photo.note}"
            </p>
          </div>
        )}

        {/* Loading of analysis details */}
        {photo.isAnalyzing ? (
          <div className="py-12 flex flex-col items-center justify-center text-center space-y-4 bg-white/40 border border-dashed border-blue-100">
            <div className="h-6 w-6 border-2 border-[#005BFE] border-t-transparent rounded-full animate-spin"></div>
            <div className="space-y-1.5">
              <h3 className="text-sm font-serif italic text-zinc-800">Refracting Style Dimensions</h3>
              <p className="text-[9px] uppercase tracking-[0.2em] text-[#005BFE] font-mono font-bold">
                Running server-side style analyzer...
              </p>
            </div>
          </div>
        ) : photo.analysis ? (
          <div className="space-y-6 animate-fadeIn">
            {/* Vibe Profile mood header */}
            <div className="space-y-2">
              <div className="flex justify-between items-end">
                <div>
                  <span className="text-[9px] font-mono uppercase tracking-[0.3em] text-zinc-400 block font-bold">
                    Style Atmosphere
                  </span>
                  <h3 className="text-2xl font-serif text-[#005BFE] italic tracking-wide mt-1 font-bold">
                    {photo.analysis.mood}
                  </h3>
                </div>

                {/* Rating score badge */}
                <div className="text-right">
                  <span className="text-[9px] font-mono uppercase tracking-widest text-zinc-400 block font-bold">
                    Vibe Synergy
                  </span>
                  <div className="flex items-center gap-1 mt-0.5 justify-end">
                    <Heart className="h-3.5 w-3.5 text-[#FF7830] fill-[#FF7830] animate-pulse" />
                    <span className="text-lg font-mono font-bold text-[#FF7830]">
                      {photo.analysis.vibesRating}%
                    </span>
                  </div>
                </div>
              </div>

              {/* Progress Bar meter */}
              <div className="w-full h-1 bg-blue-50 rounded-none overflow-hidden">
                <div
                  className="h-full bg-gradient-to-r from-[#005BFE] to-[#FF7830] transition-all duration-1000"
                  style={{ width: `${photo.analysis.vibesRating}%` }}
                />
              </div>
            </div>

            {/* Glowing Confidence Booster highlight */}
            <div className="bg-[#FF7830]/10 border border-[#FF7830]/20 p-5 relative overflow-hidden rounded-sm">
              <div className="absolute top-3 right-3 opacity-15">
                <Sparkles className="h-10 w-10 text-[#FF7830]" />
              </div>
              <h4 className="text-[9px] font-mono uppercase tracking-widest text-[#FF7830] mb-2.5 font-bold">
                EXCERPT_AFFIRMATION
              </h4>
              <blockquote className="text-sm font-serif italic text-zinc-800 leading-relaxed pr-6 font-semibold">
                "{photo.analysis.confidenceBooster}"
              </blockquote>
            </div>

            {/* Structured details: Style description vs accessories */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-1.5">
              <div className="space-y-1.5">
                <span className="text-[9px] font-mono uppercase tracking-widest text-zinc-400 block font-bold">
                  Outfitting Coordinates
                </span>
                <p className="text-xs text-zinc-650 leading-relaxed font-sans font-medium">
                  {photo.analysis.outfitDescription}
                </p>
              </div>

              <div className="space-y-1.5">
                <span className="text-[9px] font-mono uppercase tracking-widest text-zinc-400 block font-bold">
                  Aesthetic Synthesis
                </span>
                <p className="text-xs text-zinc-650 leading-relaxed font-sans font-medium">
                  {photo.analysis.styleFeedback}
                </p>
              </div>
            </div>

            {/* Dominant analysis colors */}
            {photo.analysis.dominantColors && photo.analysis.dominantColors.length > 0 && (
              <div className="space-y-2.5 pt-2">
                <span className="text-[9px] font-mono uppercase tracking-[0.25em] text-zinc-400 block font-bold">
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
                        className="aspect-square w-full border border-blue-100 transition-transform group-hover/swatch:scale-105 active:scale-95 shadow-sm relative flex items-center justify-center rounded-sm overflow-hidden"
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
                      <span className="block text-[10px] font-mono text-zinc-500 font-bold">
                        {hex.toUpperCase()}
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Footnote meta */}
            <div className="border-t border-blue-50 pt-4 flex flex-col sm:flex-row sm:items-center justify-between text-[10px] font-mono text-zinc-400 gap-2">
              <span className="uppercase tracking-widest font-semibold">
                Timestamp: {photo.timestamp}
              </span>
              <span className="uppercase truncate max-w-xs text-right font-semibold">
                {formattedDate}
              </span>
            </div>
          </div>
        ) : (
          <div className="py-8 text-center text-zinc-500 text-xs font-mono space-y-4">
            <p className="uppercase tracking-widest font-bold">Failed to retrieve analyze report</p>
            {photo.error && (
              <p className="text-rose-700 font-sans border border-rose-100 bg-rose-50 p-3 text-[11px] leading-relaxed rounded-sm shadow-sm">
                {photo.error}
              </p>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
