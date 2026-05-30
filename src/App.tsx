import React, { useState, useEffect } from "react";
import { SelfiePhoto, SelfieAnalysis } from "./types";
import { 
  getPhotosFromDB, 
  savePhotoToDB, 
  deletePhotoFromDB, 
  updatePhotoInDB 
} from "./db";
import { SelfieHeader } from "./components/SelfieHeader";
import { SelfieUpload } from "./components/SelfieUpload";
import { SelfieCard } from "./components/SelfieCard";
import { SelfieDetail } from "./components/SelfieDetail";
import { PhotoEditor } from "./components/PhotoEditor";
import { 
  Camera, 
  Sparkles, 
  Heart, 
  ChevronRight, 
  Compass, 
  Archive, 
  Layers, 
  Grid,
  Info,
  RefreshCw
} from "lucide-react";
import { AnimatePresence, motion } from "motion/react";

export default function App() {
  const [photos, setPhotos] = useState<SelfiePhoto[]>([]);
  const [activePhoto, setActivePhoto] = useState<SelfiePhoto | null>(null);
  
  // Modal tracking state for the custom PhotoEditor
  const [editingPhoto, setEditingPhoto] = useState<SelfiePhoto | null>(null);
  const [isRefreshingIndex, setIsRefreshingIndex] = useState(false);

  // Load photos from IndexedDB on initial mount
  useEffect(() => {
    async function loadInitialData() {
      setIsRefreshingIndex(true);
      try {
        const loaded = await getPhotosFromDB();
        setPhotos(loaded);
        if (loaded.length > 0) {
          setActivePhoto(loaded[0]);
        }
      } catch (err) {
        console.error("IndexedDB bootstrap error:", err);
      } finally {
        setIsRefreshingIndex(false);
      }
    }
    loadInitialData();
  }, []);

  // Analyze a photo using our server-side proxy
  const analyzeSelfie = async (id: string, imageUrl: string, userNote: string) => {
    try {
      const response = await fetch("/api/analyze-selfie", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          image: imageUrl,
          userNote: userNote,
        }),
      });

      const data = await response.json();

      if (response.ok && !data.error) {
        // Successfully retrieved analysis JSON schema
        const analysis: SelfieAnalysis = data;
        setPhotos((prev) => {
          const updated = prev.map((p) => {
            if (p.id === id) {
              const photoUpdate = { ...p, analysis, isAnalyzing: false, error: undefined };
              updatePhotoInDB(photoUpdate);
              // Update active photo view too if currently matching
              if (activePhoto?.id === id) {
                setActivePhoto(photoUpdate);
              }
              return photoUpdate;
            }
            return p;
          });
          return updated;
        });
      } else {
        throw new Error(data.error || "Server could not process image details.");
      }
    } catch (err: any) {
      console.error("Vibe analysis pipeline failed:", err);
      setPhotos((prev) => {
        const updated = prev.map((p) => {
          if (p.id === id) {
            const photoUpdate = { 
              ...p, 
              isAnalyzing: false, 
              error: err.message || "Oracle failed to respond. Retrying works best." 
            };
            updatePhotoInDB(photoUpdate);
            if (activePhoto?.id === id) {
              setActivePhoto(photoUpdate);
            }
            return photoUpdate;
          }
          return p;
        });
        return updated;
      });
    }
  };

  // Called when a new file or camera snapshot is saved
  const handlePhotoAdded = async (imageUrl: string, note: string) => {
    const newId = `photo_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    const newPhoto: SelfiePhoto = {
      id: newId,
      url: imageUrl,
      timestamp: Date.now(),
      note: note,
      isAnalyzing: true,
    };

    // Prepend immediately to support fluid feedback loop
    setPhotos((prev) => [newPhoto, ...prev]);
    setActivePhoto(newPhoto);
    await savePhotoToDB(newPhoto);

    // Call the server and compute analysis report
    analyzeSelfie(newId, imageUrl, note);
  };

  // Triggers photo edit screen
  const handleEditClick = (photo: SelfiePhoto) => {
    setEditingPhoto(photo);
  };

  // Saves updated custom-rendered canvas image and triggers a brand new matching style report
  const handleSaveEditedPhoto = async (newImageUrl: string) => {
    if (!editingPhoto) return;

    const updatedPhoto: SelfiePhoto = {
      ...editingPhoto,
      url: newImageUrl,
      isAnalyzing: true, // Re-trigger analysis for the cropped, rotated, or erased outcome
      analysis: undefined,
      error: undefined,
    };

    setPhotos((prev) =>
      prev.map((p) => (p.id === editingPhoto.id ? updatedPhoto : p))
    );
    setActivePhoto(updatedPhoto);
    await updatePhotoInDB(updatedPhoto);
    setEditingPhoto(null);

    // Run the analysis server-side on the altered snapshot details
    analyzeSelfie(editingPhoto.id, newImageUrl, updatedPhoto.note);
  };

  const handleDeletePhoto = async (id: string) => {
    const confirmDelete = window.confirm("Are you sure you want to remove this look from your permanent exhibition archive?");
    if (!confirmDelete) return;

    try {
      await deletePhotoFromDB(id);
      setPhotos((prev) => {
        const afterDelete = prev.filter((p) => p.id !== id);
        if (activePhoto?.id === id) {
          setActivePhoto(afterDelete.length > 0 ? afterDelete[0] : null);
        }
        return afterDelete;
      });
    } catch (err) {
      console.error("Removal failure:", err);
    }
  };

  const handleReAnalyzePhoto = (id: string) => {
    const target = photos.find((p) => p.id === id);
    if (!target) return;

    setPhotos((prev) =>
      prev.map((p) => (p.id === id ? { ...p, isAnalyzing: true, error: undefined } : p))
    );
    if (activePhoto?.id === id) {
      setActivePhoto((prev) => prev ? { ...prev, isAnalyzing: true, error: undefined } : null);
    }

    analyzeSelfie(id, target.url, target.note);
  };

  return (
    <div id="editorial-theme-vault" className="min-h-screen bg-[#0C0C0C] text-[#E5E5E5] flex flex-col font-sans transition-all duration-300">
      
      {/* Editorial aesthetic header with live time */}
      <SelfieHeader totalCount={photos.length} />

      {/* Main grid portfolio structure */}
      <main className="flex-1 w-full max-w-7xl mx-auto px-4 py-8 sm:px-6 lg:px-8 grid grid-cols-1 lg:grid-cols-12 gap-8">
        
        {/* Left column: Controls and Profile stats (LG: Col 1-4) */}
        <section className="lg:col-span-4 space-y-8 flex flex-col">
          
          {/* Aesthetic Brand Navigation (Static Index) */}
          <div className="hidden lg:block border-b border-[#2A2A2A] pb-6 pr-4">
            <h2 className="text-xs tracking-[0.3em] uppercase opacity-40 mb-6 font-mono">
              The Identity Vault
            </h2>
            <nav className="space-y-4">
              <div className="group cursor-pointer flex items-center justify-between">
                <div className="flex flex-col">
                  <span className="text-[10px] opacity-40 mb-0.5">01.</span>
                  <span className="text-base font-serif italic tracking-wide text-white">Exhibition</span>
                </div>
                <ChevronRight className="h-4 w-4 opacity-0 group-hover:opacity-100 text-amber-500 transition-all" />
              </div>
              <div className="group cursor-pointer border-[#2A2A2A] border-t pt-3 flex items-center justify-between">
                <div className="flex flex-col">
                  <span className="text-[10px] opacity-40 mb-0.5">02.</span>
                  <span className="text-base font-serif italic tracking-wide text-zinc-400 group-hover:text-white">Studio Archives</span>
                </div>
                <ChevronRight className="h-4 w-4 opacity-0 text-amber-500" />
              </div>
              <div className="group cursor-pointer border-[#2A2A2A] border-t pt-3 flex items-center justify-between">
                <div className="flex flex-col">
                  <span className="text-[10px] opacity-40 mb-0.5">03.</span>
                  <span className="text-base font-serif italic tracking-wide text-amber-500">Upload Deck</span>
                </div>
                <Layers className="h-4 w-4 text-amber-500 animate-pulse" />
              </div>
            </nav>
          </div>

          {/* New Photo Upload / Camera snap Studio module */}
          <div className="space-y-4">
            <div className="flex items-center gap-2 text-zinc-400">
              <span className="text-[10px] uppercase tracking-[0.3em] font-mono">
                Capture Station
              </span>
            </div>
            <SelfieUpload onPhotoAdded={handlePhotoAdded} />
          </div>

          {/* Educational metadata block */}
          <div className="p-4 border border-[#2A2A2A] bg-[#0F0F0F]/50 rounded-sm space-y-3 font-mono">
            <p className="text-[9px] uppercase tracking-widest text-zinc-500 flex items-center gap-1">
              <Info className="h-3 w-3" /> System Specs
            </p>
            <div className="w-full h-[1px] bg-[#2A2A2A]"></div>
            <ul className="text-[8.5px] uppercase text-zinc-400 space-y-1.5 leading-relaxed">
              <li>• API: Gemini-3.5-Flash (vision, mood, colors, tags)</li>
              <li>• Edit: Gemini-2.5-Flash-Image (presets & custom)</li>
              <li>• Workspace: local persistent indexedDB database</li>
              <li>• Theme: high fashion editorial minimalist monochrome</li>
            </ul>
          </div>
        </section>

        {/* Center/Right column: Main dynamic display area (LG: Col 5-12) */}
        <section className="lg:col-span-8 flex flex-col space-y-8">
          
          {/* Header series subtitle */}
          <div className="relative h-24 mb-2">
            <h1 className="absolute top-0 left-0 text-[64px] sm:text-[96px] font-serif leading-[0.8] tracking-tighter opacity-5 select-none font-bold">
              PORTRAIT
            </h1>
            <div className="relative z-10 pt-4 flex justify-between items-end border-b border-[#2A2A2A] pb-3">
              <div>
                <p className="text-[10px] uppercase tracking-[0.4em] text-zinc-500">
                  Current Coords Collection
                </p>
                <h3 className="text-xl sm:text-2xl font-serif italic text-white mt-1">
                  Series 04: The Expressive Portraiture
                </h3>
              </div>
              <div className="text-right hidden sm:block">
                <p className="text-[9px] uppercase tracking-widest text-[#737373] font-mono">
                  EXHIBITION_STATE
                </p>
                <p className="text-xs font-mono text-zinc-300">
                  ONLINE // LIVE
                </p>
              </div>
            </div>
          </div>

          {/* Interactive display block split into active selection panel & grid list */}
          <div className="grid grid-cols-1 xl:grid-cols-12 gap-6">
            
            {/* Active Highlight Detail view (XL: Col 1-6) */}
            <div className="xl:col-span-6 order-1 xl:order-2">
              <AnimatePresence mode="wait">
                {activePhoto ? (
                  <motion.div
                    key={activePhoto.id}
                    initial={{ opacity: 0, scale: 0.98 }}
                    animate={{ opacity: 1, scale: 1 }}
                    exit={{ opacity: 0, scale: 0.98 }}
                    transition={{ duration: 0.25 }}
                  >
                    <SelfieDetail photo={activePhoto} />
                  </motion.div>
                ) : (
                  <div className="bg-[#0F0F0F] border border-[#2A2A2A] p-10 text-center text-zinc-500 flex flex-col items-center justify-center py-20 rounded-sm">
                    <Grid className="h-8 w-8 text-zinc-700 mb-3" />
                    <p className="font-serif italic text-base text-zinc-400">
                      No portraits in showcase.
                    </p>
                    <p className="text-[10px] uppercase tracking-[0.2em] text-zinc-600 mt-1 max-w-xs leading-relaxed">
                      Capture snapshots or upload dynamic files to generate a personalized high-fashion analysis portfolio
                    </p>
                  </div>
                )}
              </AnimatePresence>
            </div>

            {/* Scrollable Gallery list of photos (XL: Col 1-6) */}
            <div className="xl:col-span-6 order-2 xl:order-1 space-y-4">
              <span className="block text-[10px] uppercase tracking-[0.3em] text-[#737373] font-mono">
                Index of Looks ({photos.length})
              </span>
              
              {isRefreshingIndex && photos.length === 0 && (
                <div className="text-center py-12 font-mono text-zinc-500 text-xs">
                  <RefreshCw className="h-5 w-5 animate-spin mx-auto mb-2" />
                  LOADING DB...
                </div>
              )}

              {photos.length === 0 && !isRefreshingIndex ? (
                <div className="p-8 border border-dashed border-[#333] text-center text-zinc-500 font-mono text-xs py-14">
                  INDEX IS EMPTY
                </div>
              ) : (
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 max-h-[640px] xl:max-h-[800px] overflow-y-auto pr-1">
                  {photos.map((p) => (
                    <div 
                      key={p.id} 
                      onClick={() => setActivePhoto(p)}
                      className={`cursor-pointer transition-all duration-200 ${
                        activePhoto?.id === p.id 
                          ? "ring-1 ring-amber-500/50 scale-[0.99] border-amber-500/50" 
                          : "opacity-85 hover:opacity-100"
                      }`}
                    >
                      <SelfieCard
                        photo={p}
                        onDelete={handleDeletePhoto}
                        onEdit={handleEditClick}
                        onReAnalyze={handleReAnalyzePhoto}
                      />
                    </div>
                  ))}
                </div>
              )}
            </div>

          </div>

        </section>

      </main>

      {/* Persistent Bottom Status Coordinates */}
      <footer className="border-t border-[#2A2A2A] bg-black/50 py-3 px-6 mt-16 flex flex-col sm:flex-row justify-between items-center gap-3 text-[10px] font-mono text-zinc-600">
        <div className="flex gap-4 sm:gap-6 uppercase tracking-widest text-[#737373]">
          <span>System: Secure</span>
          <span>Encryption: Active</span>
          <span>Aesthetic Version: Editorial v4.2</span>
        </div>
        <div>
          NESS_RECALL_001 // THE PORTRAIT DIALOGUE
        </div>
      </footer>

      {/* Render the Custom PhotoEditor overlay modal when active */}
      <AnimatePresence>
        {editingPhoto && (
          <PhotoEditor
            imageUrl={editingPhoto.url}
            onSave={handleSaveEditedPhoto}
            onClose={() => setEditingPhoto(null)}
          />
        )}
      </AnimatePresence>

    </div>
  );
}
