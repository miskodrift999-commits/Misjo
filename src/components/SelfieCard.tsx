import React, { useState } from "react";
import { SelfiePhoto } from "../types";
import { 
  Heart, 
  Trash2, 
  Sparkles, 
  Calendar, 
  Tag, 
  Edit3, 
  RefreshCw, 
  Palette, 
  Compass, 
  AlertCircle 
} from "lucide-react";
import { motion } from "motion/react";

interface SelfieCardProps {
  photo: SelfiePhoto;
  onDelete: (id: string) => void;
  onEdit: (photo: SelfiePhoto) => void;
  onReAnalyze: (id: string) => void;
  isSelected?: boolean;
  onSelect?: () => void;
}

export function SelfieCard({ photo, onDelete, onEdit, onReAnalyze, isSelected = false, onSelect }: SelfieCardProps) {
  const [isExpanding, setIsExpanding] = useState(false);
  const dateStr = new Date(photo.timestamp).toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
    hour: "numeric",
    minute: "2-digit",
  });

  const analysis = photo.analysis;

  return (
    <motion.article 
      id={`selfie-card-${photo.id}`}
      layout
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, scale: 0.95 }}
      transition={{ duration: 0.4, ease: "easeOut" }}
      className={`bg-[#0F0F0F] border transition-all duration-300 rounded-sm overflow-hidden flex flex-col group cursor-pointer ${
        isSelected ? "border-white ring-1 ring-white" : "border-[#1F1F1F] hover:border-zinc-500"
      }`}
      onClick={() => onSelect?.()}
    >
      {/* Visual Frame */}
      <div className="relative aspect-[4/5] bg-neutral-950 overflow-hidden select-none">
        {/* Monochromatic state with transition into full color on hover */}
        <img
          src={photo.url}
          alt={analysis?.mood || "Captured Selfie Snapshot"}
          className="w-full h-full object-cover transition-all duration-700 ease-out group-hover:scale-105 group-hover:grayscale-0 grayscale"
        />

        {/* Framing borders overlay mimicking old vintage glass negatives */}
        <div className="absolute inset-4 border border-white/5 pointer-events-none transition-all duration-500 group-hover:border-white/10"></div>
        
        {/* Index Serial indicator tag */}
        <div className="absolute top-4 left-4 bg-black/65 backdrop-blur-sm border border-[#2A2A2A] text-[9px] font-mono text-neutral-400 px-2 py-0.5 tracking-widest uppercase">
          FRAME_{photo.id.slice(-4).toUpperCase()}
        </div>

        {/* Hover Vibes Percentage Badge */}
        {analysis?.vibesRating && (
          <div className="absolute top-4 right-4 bg-amber-500 text-black font-mono font-bold text-[10px] tracking-widest px-2.5 py-1 rounded-sm shadow-lg flex items-center gap-1">
            <Heart className="h-3 w-3 fill-current text-black animate-pulse" />
            {analysis.vibesRating}% GLOW
          </div>
        )}

        {/* Quick control overlays at the base */}
        <div className="absolute bottom-4 inset-x-4 flex justify-between gap-2 z-10 translate-y-3 opacity-0 group-hover:translate-y-0 group-hover:opacity-100 transition-all duration-300">
          <button
            type="button"
            onClick={(e) => { e.stopPropagation(); onEdit(photo); }}
            className="flex-1 py-1.5 bg-white text-black hover:bg-[#E5E5E5] text-[9px] font-mono font-bold tracking-widest uppercase rounded-sm flex items-center justify-center gap-1 shadow-md transition-all active:scale-95 cursor-pointer"
          >
            <Edit3 className="h-3 w-3" />
            Edit Look
          </button>
          
          <button
            type="button"
            onClick={(e) => { e.stopPropagation(); onDelete(photo.id); }}
            className="px-2.5 py-1.5 bg-black/85 text-rose-400 hover:text-rose-300 hover:bg-rose-950/20 rounded-sm shadow-md transition-all border border-[#2A2A2A] hover:border-rose-950/50 cursor-pointer"
            title="Remove from journal"
          >
            <Trash2 className="h-3.5 w-3.5" />
          </button>
        </div>
      </div>

      {/* Content Section */}
      <div className="p-4 sm:p-5 flex-1 flex flex-col justify-between space-y-4">
        
        {/* Meta Timeline Row */}
        <div>
          <div className="flex items-center justify-between text-[10px] font-mono text-neutral-500 mb-1.5">
            <span className="flex items-center gap-1">
              <Calendar className="h-3 w-3" />
              {dateStr}
            </span>
            <span className="text-neutral-500 tracking-widest">
              SERIES_{photo.analysis ? "ANALYZED" : "UNPROCESSED"}
            </span>
          </div>

          {/* User Note Diary content block */}
          {photo.note ? (
            <p className="text-xs text-neutral-300 font-sans leading-relaxed border-l border-neutral-700/50 pl-2.5 italic my-2">
              "{photo.note}"
            </p>
          ) : (
            <p className="text-xs text-neutral-500 font-mono italic my-2 text-center py-1">
              No attached commentary.
            </p>
          )}
        </div>

        {/* Gemini Feedback Details */}
        {photo.isAnalyzing ? (
          <div className="bg-[#121212] border border-[#222] p-4 text-center space-y-2 rounded-sm py-6">
            <RefreshCw className="h-5 w-5 animate-spin mx-auto text-amber-500" />
            <p className="text-[10px] font-mono uppercase tracking-[0.2em] text-neutral-400 animate-pulse">
              Consulting Gemini Style Oracle...
            </p>
          </div>
        ) : photo.error ? (
          <div className="bg-rose-950/10 border border-rose-900/30 p-3.5 text-xs text-rose-300 rounded-sm">
            <div className="flex items-start gap-1.5">
              <AlertCircle className="h-4 w-4 text-rose-400 flex-shrink-0 mt-0.5" />
              <div>
                <p className="font-semibold font-mono text-[10px] uppercase tracking-widest">
                  Oracle Desync Error
                </p>
                <p className="text-[10px] opacity-80 mt-1 leading-relaxed">
                  {photo.error}
                </p>
                <button
                  type="button"
                  onClick={() => onReAnalyze(photo.id)}
                  className="mt-2 text-[9px] font-mono uppercase text-amber-400 hover:text-amber-300 flex items-center gap-1 transition-all"
                >
                  <RefreshCw className="h-3 w-3" />
                  Retry Vision Call
                </button>
              </div>
            </div>
          </div>
        ) : analysis ? (
          <div className="space-y-4 pt-3 border-t border-[#1C1C1C]">
            
            {/* Primary Vibe/Mood */}
            <div>
              <p className="text-[9px] font-mono uppercase tracking-widest text-neutral-500">
                ASTRON_ENERGY_VIBE
              </p>
              <h4 className="text-sm font-semibold font-sans text-neutral-200 mt-0.5 flex items-center gap-1.5">
                <Sparkles className="h-3.5 w-3.5 text-amber-500" />
                {analysis.mood}
              </h4>
            </div>

            {/* Glowing friendly confidence booster */}
            <div className="bg-[#151515] border-l-2 border-amber-500 p-3 rounded-r-sm">
              <p className="text-[9px] font-mono uppercase text-amber-400/80 tracking-widest flex items-center gap-1">
                <Compass className="h-3.5 w-3.5 text-amber-500" /> Style confidence oracle
              </p>
              <p className="text-xs font-serif italic text-neutral-200 leading-relaxed mt-1">
                "{analysis.confidenceBooster}"
              </p>
            </div>

            {/* Collapsible deeper styling metrics */}
            {isExpanding && (
              <motion.div 
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: "auto" }}
                transition={{ duration: 0.25 }}
                className="space-y-3.5 pt-2 text-[11px] leading-relaxed"
              >
                {/* Outfit Description */}
                <div>
                  <p className="text-[9px] font-mono uppercase tracking-widest text-neutral-500 mb-0.5">
                    OUTFIT_COORDS
                  </p>
                  <p className="text-neutral-350 font-sans">
                    {analysis.outfitDescription}
                  </p>
                </div>

                {/* Style Feedback */}
                <div>
                  <p className="text-[9px] font-mono uppercase tracking-widest text-neutral-500 mb-0.5">
                    RESONANCE_METRICS
                  </p>
                  <p className="text-neutral-350 font-sans">
                    {analysis.styleFeedback}
                  </p>
                </div>

                {/* Custom extracted color palettes */}
                {analysis.dominantColors && analysis.dominantColors.length > 0 && (
                  <div>
                    <p className="text-[9px] font-mono uppercase tracking-widest text-neutral-500 mb-1.5 flex items-center gap-1">
                      <Palette className="h-3.5 w-3.5" />
                      Extracted Tone Chart
                    </p>
                    <div className="flex flex-wrap items-center gap-2">
                      {analysis.dominantColors.map((color, i) => (
                        <div 
                          key={i} 
                          className="flex items-center gap-1 bg-[#141414] border border-[#222] pr-1.5 py-0.5 rounded-full cursor-copy"
                          title={`Click to copy color hex ${color}`}
                          onClick={(e) => {
                            e.stopPropagation();
                            navigator.clipboard.writeText(color);
                          }}
                        >
                          <span 
                            className="h-3 w-3 rounded-full border border-white/10 block" 
                            style={{ backgroundColor: color }}
                          />
                          <span className="text-[9px] font-mono text-neutral-400">
                            {color}
                          </span>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </motion.div>
            )}

            {/* Collapsible toggle & tags */}
            <div className="flex items-center justify-between pt-1">
              <button
                type="button"
                onClick={(e) => { e.stopPropagation(); setIsExpanding(!isExpanding); }}
                className="text-[9px] font-mono uppercase text-nowrap tracking-wider text-neutral-400 hover:text-white transition-all underline decoration-neutral-700 decoration-dashed underline-offset-4 cursor-pointer"
              >
                {isExpanding ? "Collapse Details" : "Inspect Analytics →"}
              </button>

              <div className="flex items-center gap-1 flex-wrap justify-end">
                {analysis.tags?.slice(0, 2).map((tag, i) => (
                  <span 
                    key={i} 
                    className="text-[8px] font-mono uppercase tracking-widest text-[#AAA] bg-[#161616] px-2 py-0.5 rounded-sm border border-[#252525] flex items-center gap-0.5"
                  >
                    <Tag className="h-2 w-2 text-neutral-500" />
                    {tag.startsWith("#") ? tag : `#${tag}`}
                  </span>
                ))}
              </div>
            </div>

          </div>
        ) : (
          /* Process Selfie button fallback if no analysis existed */
          <div className="pt-2">
            <button
              type="button"
              onClick={() => onReAnalyze(photo.id)}
              className="w-full py-2 bg-neutral-900 border border-[#222] hover:border-neutral-500 hover:bg-neutral-850 text-neutral-300 text-[10px] font-mono uppercase tracking-widest rounded-sm transition-all flex items-center justify-center gap-2"
            >
              <Sparkles className="h-3.5 w-3.5 text-amber-500" />
              Perform Vision Scan
            </button>
          </div>
        )}

      </div>
    </motion.article>
  );
}
