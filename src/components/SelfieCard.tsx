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
  AlertCircle,
  Download
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

  const handleDownload = (e: React.MouseEvent) => {
    e.stopPropagation();
    const link = document.createElement("a");
    link.href = photo.url;
    link.download = `style_portrait_${photo.id.slice(0, 8)}.jpg`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const analysis = photo.analysis;

  return (
    <motion.article 
      id={`selfie-card-${photo.id}`}
      layout
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, scale: 0.95 }}
      transition={{ duration: 0.4, ease: "easeOut" }}
      className={`bg-white/80 dark:bg-slate-950/70 border transition-all duration-300 rounded-sm overflow-hidden flex flex-col group cursor-pointer shadow-sm text-zinc-800 dark:text-zinc-200 ${
        isSelected 
          ? "border-[#005BFE] dark:border-indigo-400 ring-1 ring-[#005BFE]/30 dark:ring-indigo-500/30" 
          : "border-blue-100/80 dark:border-indigo-950/40 hover:border-blue-300 dark:hover:border-indigo-800/80"
      }`}
      onClick={() => onSelect?.()}
    >
      {/* Visual Frame */}
      <div className="relative aspect-[4/5] bg-blue-50/50 dark:bg-[#070611]/30 overflow-hidden select-none">
        {/* Monochromatic state with transition into full color on hover */}
        <img
          src={photo.url}
          alt={analysis?.mood || "Captured Selfie Snapshot"}
          className="w-full h-full object-cover transition-all duration-700 ease-out group-hover:scale-105 group-hover:grayscale-0 grayscale-[20%]"
        />

        {/* Framing borders overlay mimicking old vintage glass negatives */}
        <div className="absolute inset-4 border border-blue-100/10 pointer-events-none transition-all duration-500 group-hover:border-[#005BFE]/20 dark:group-hover:border-indigo-500/25"></div>
        
        {/* Index Serial indicator tag */}
        <div className="absolute top-4 left-4 bg-white/80 dark:bg-[#070611]/85 backdrop-blur-sm border border-blue-100 dark:border-indigo-950/50 text-[9px] font-mono text-[#005BFE] dark:text-indigo-400 font-bold px-2 py-0.5 tracking-widest uppercase shadow-sm">
          FRAME_{photo.id.slice(-4).toUpperCase()}
        </div>

        {/* Hover Vibes Percentage Badge */}
        {analysis?.vibesRating && (
          <div className="absolute top-4 right-4 bg-[#FF7830] text-white font-mono font-bold text-[10px] tracking-widest px-2.5 py-1 rounded-sm shadow-md flex items-center gap-1">
            <Heart className="h-3 w-3 fill-current text-white animate-pulse" />
            {analysis.vibesRating}% GLOW
          </div>
        )}

        {/* Quick control overlays at the base */}
        <div className="absolute bottom-4 inset-x-4 flex justify-between gap-2 z-10 translate-y-3 opacity-0 group-hover:translate-y-0 group-hover:opacity-100 transition-all duration-300">
          <button
            type="button"
            onClick={(e) => { e.stopPropagation(); onEdit(photo); }}
            className="flex-1 py-1.5 bg-[#005BFE] text-white hover:bg-[#0046C7] text-[9px] font-mono font-bold tracking-widest uppercase rounded-sm flex items-center justify-center gap-1 shadow-md transition-all active:scale-95 cursor-pointer"
          >
            <Edit3 className="h-3 w-3" />
            Edit Look
          </button>
          
          <button
            type="button"
            onClick={handleDownload}
            className="px-2.5 py-1.5 bg-white/95 dark:bg-zinc-900 text-zinc-650 dark:text-zinc-300 hover:text-[#005BFE] dark:hover:text-indigo-400 hover:bg-blue-50 dark:hover:bg-indigo-950 rounded-sm shadow-md transition-all border border-blue-100 dark:border-indigo-950 cursor-pointer"
            title="Download full quality photo"
          >
            <Download className="h-3.5 w-3.5" />
          </button>

          <button
            type="button"
            onClick={(e) => { e.stopPropagation(); onDelete(photo.id); }}
            className="px-2.5 py-1.5 bg-white/95 dark:bg-zinc-900 text-rose-600 dark:text-rose-450 hover:text-rose-500 hover:bg-rose-50 dark:hover:bg-rose-950/30 rounded-sm shadow-md transition-all border border-blue-100 dark:border-indigo-950 cursor-pointer"
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
          <div className="flex items-center justify-between text-[10px] font-mono text-zinc-400 dark:text-zinc-500 mb-1.5 font-bold">
            <span className="flex items-center gap-1">
              <Calendar className="h-3 w-3" />
              {dateStr}
            </span>
            <span className="text-zinc-400 dark:text-zinc-500 tracking-widest">
              SERIES_{photo.analysis ? "ANALYZED" : "UNPROCESSED"}
            </span>
          </div>

          {/* User Note Diary content block */}
          {photo.note ? (
            <p className="text-xs text-zinc-700 dark:text-zinc-300 font-sans leading-relaxed border-l-2 border-[#005BFE]/40 dark:border-indigo-500/40 pl-2.5 italic my-2">
              "{photo.note}"
            </p>
          ) : (
            <p className="text-xs text-zinc-400 dark:text-zinc-500 font-mono italic my-2 text-center py-1 bg-blue-50/20 dark:bg-indigo-950/20">
              No attached commentary.
            </p>
          )}
        </div>

        {/* Gemini Feedback Details */}
        {photo.isAnalyzing ? (
          <div className="bg-blue-50/50 dark:bg-[#070611]/60 border border-blue-100/50 dark:border-indigo-950/40 p-4 text-center space-y-2 rounded-sm py-6 shadow-inner transition-colors">
            <RefreshCw className="h-5 w-5 animate-spin mx-auto text-[#005BFE] dark:text-indigo-400" />
            <p className="text-[10px] font-mono uppercase tracking-[0.2em] text-[#005BFE] dark:text-indigo-400 font-bold animate-pulse">
              Consulting Style Oracle...
            </p>
          </div>
        ) : photo.error ? (
          <div className="bg-rose-50 dark:bg-[#200A10]/40 border border-rose-100 dark:border-rose-950/40 p-3.5 text-xs text-rose-700 dark:text-rose-300 rounded-sm shadow-sm transition-colors">
            <div className="flex items-start gap-1.5">
              <AlertCircle className="h-4 w-4 text-rose-500 flex-shrink-0 mt-0.5" />
              <div>
                <p className="font-semibold font-mono text-[10px] uppercase tracking-widest text-rose-800 dark:text-rose-400">
                  Oracle Desync Error
                </p>
                <p className="text-[10px] opacity-90 mt-1 leading-relaxed text-rose-650 dark:text-rose-400">
                  {photo.error}
                </p>
                <button
                  type="button"
                  onClick={() => onReAnalyze(photo.id)}
                  className="mt-2 text-[9px] font-mono uppercase text-[#005BFE] dark:text-[#818CF8] hover:text-[#0046C7] dark:hover:text-[#a5b4fc] flex items-center gap-1 transition-all font-bold cursor-pointer"
                >
                  <RefreshCw className="h-3 w-3" />
                  Retry Vision Call
                </button>
              </div>
            </div>
          </div>
        ) : analysis ? (
          <div className="space-y-4 pt-3 border-t border-blue-50 dark:border-indigo-950/40">
            
            {/* Primary Vibe/Mood */}
            <div>
              <p className="text-[9px] font-mono uppercase tracking-widest text-zinc-400 dark:text-zinc-500">
                ASTRON_ENERGY_VIBE
              </p>
              <h4 className="text-sm font-semibold font-sans text-[#005BFE] dark:text-indigo-400 mt-0.5 flex items-center gap-1.5">
                <Sparkles className="h-3.5 w-3.5 text-[#FF7830]" />
                {analysis.mood}
              </h4>
            </div>

            {/* Glowing friendly confidence booster */}
            <div className="bg-[#FF7830]/10 dark:bg-[#FF7830]/5 border-l-2 border-[#FF7830] p-3 rounded-r-sm transition-colors">
              <p className="text-[9px] font-mono uppercase text-[#FF7830] font-bold tracking-widest flex items-center gap-1">
                <Compass className="h-3.5 w-3.5 text-[#FF7830]" /> Style confidence oracle
              </p>
              <p className="text-xs font-serif italic text-zinc-800 dark:text-zinc-200 leading-relaxed mt-1">
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
                  <p className="text-[9px] font-mono uppercase tracking-widest text-zinc-400 dark:text-zinc-500 mb-0.5 font-bold">
                    OUTFIT_COORDS
                  </p>
                  <p className="text-zinc-650 dark:text-zinc-400 font-sans font-medium">
                    {analysis.outfitDescription}
                  </p>
                </div>

                {/* Style Feedback */}
                <div>
                  <p className="text-[9px] font-mono uppercase tracking-widest text-zinc-400 dark:text-zinc-500 mb-0.5 font-bold">
                    RESONANCE_METRICS
                  </p>
                  <p className="text-zinc-650 dark:text-zinc-400 font-sans font-medium">
                    {analysis.styleFeedback}
                  </p>
                </div>

                {/* Custom extracted color palettes */}
                {analysis.dominantColors && analysis.dominantColors.length > 0 && (
                  <div>
                    <p className="text-[9px] font-mono uppercase tracking-widest text-[#005BFE] dark:text-indigo-400 font-bold mb-1.5 flex items-center gap-1">
                      <Palette className="h-3.5 w-3.5" />
                      Extracted Tone Chart
                    </p>
                    <div className="flex flex-wrap items-center gap-2">
                      {analysis.dominantColors.map((color, i) => (
                        <div 
                          key={i} 
                          className="flex items-center gap-1 bg-white dark:bg-[#070611] border border-blue-50 dark:border-indigo-950/60 pr-1.5 py-0.5 rounded-full cursor-copy shadow-sm hover:border-[#FF7830] transition-colors"
                          title={`Click to copy color hex ${color}`}
                          onClick={(e) => {
                            e.stopPropagation();
                            navigator.clipboard.writeText(color);
                          }}
                        >
                          <span 
                            className="h-3 w-3 rounded-full border border-blue-100 block" 
                            style={{ backgroundColor: color }}
                          />
                          <span className="text-[9px] font-mono text-zinc-500 dark:text-zinc-400 font-bold">
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
                className="text-[9px] font-mono uppercase text-nowrap tracking-wider text-zinc-500 dark:text-zinc-400 hover:text-[#005BFE] dark:hover:text-indigo-400 transition-all underline decoration-[#005BFE]/30 dark:decoration-indigo-500/30 decoration-dashed underline-offset-4 cursor-pointer"
              >
                {isExpanding ? "Collapse Details" : "Inspect Analytics →"}
              </button>

              <div className="flex items-center gap-1 flex-wrap justify-end">
                {analysis.tags?.slice(0, 2).map((tag, i) => (
                  <span 
                    key={i} 
                    className="text-[8px] font-mono uppercase tracking-widest text-[#005BFE] dark:text-indigo-300 bg-[#005BFE]/10 dark:bg-[#4F46E5]/15 px-2 py-0.5 rounded-sm border border-blue-100 dark:border-indigo-950/50 flex items-center gap-0.5 font-bold"
                  >
                    <Tag className="h-2 w-2 text-[#005BFE]/70" />
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
              className="w-full py-2 bg-[#005BFE] border border-blue-100 dark:border-indigo-950/40 hover:bg-[#0046C7] dark:hover:bg-indigo-900/60 text-white text-[10px] font-mono uppercase tracking-widest rounded-sm transition-all flex items-center justify-center gap-2 font-bold shadow-sm cursor-pointer"
            >
              <Sparkles className="h-3.5 w-3.5 text-[#FF7830]" />
              Perform Vision Scan
            </button>
          </div>
        )}

      </div>
    </motion.article>
  );
}
