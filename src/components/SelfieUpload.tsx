import React, { useState, useRef, useEffect } from "react";
import { Upload, Camera, Trash2, Check, RefreshCw, AlertCircle, Sparkles } from "lucide-react";
import { motion, AnimatePresence } from "motion/react";
import { SelfieEditor } from "./SelfieEditor";

interface SelfieUploadProps {
  onPhotoAdded: (imageUrl: string, note: string) => void;
}

export function SelfieUpload({ onPhotoAdded }: SelfieUploadProps) {
  const [activeTab, setActiveTab] = useState<"file" | "camera">("file");
  const [dragActive, setDragActive] = useState<boolean>(false);
  const [draftImage, setDraftImage] = useState<string | null>(null);
  const [noteText, setNoteText] = useState<string>("");
  const [isEditingPhoto, setIsEditingPhoto] = useState<boolean>(false);

  // Camera State
  const [cameraActive, setCameraActive] = useState<boolean>(false);
  const [cameraError, setCameraError] = useState<string | null>(null);

  const videoRef = useRef<HTMLVideoElement | null>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const fileInputRef = useRef<HTMLInputElement | null>(null);

  // Stop camera track stream
  const stopCamera = () => {
    if (streamRef.current) {
      streamRef.current.getTracks().forEach((track) => track.stop());
      streamRef.current = null;
    }
    setCameraActive(false);
  };

  // Start Camera
  const startCamera = async () => {
    setCameraError(null);
    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        video: { facingMode: "user" },
        audio: false,
      });
      streamRef.current = stream;
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
      }
      setCameraActive(true);
    } catch (err: any) {
      console.error("Camera access error:", err);
      setCameraError(
        "Could not access your camera. Please check system permissions, or upload an image file instead."
      );
      setActiveTab("file");
    }
  };

  // Watch for active tab updates
  useEffect(() => {
    if (activeTab === "camera" && !draftImage) {
      startCamera();
    } else {
      stopCamera();
    }
    return () => stopCamera();
  }, [activeTab, draftImage]);

  // Clean raw file sizes with FileReader
  const processFile = (file: File) => {
    if (!file.type.startsWith("image/")) {
      alert("Please upload an image file (PNG, JPEG, dynamic files, etc.)");
      return;
    }
    const reader = new FileReader();
    reader.onload = (e) => {
      if (e.target?.result) {
        setDraftImage(e.target.result as string);
        stopCamera();
      }
    };
    reader.readAsDataURL(file);
  };

  // Drag and drop events
  const handleDrag = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === "dragenter" || e.type === "dragover") {
      setDragActive(true);
    } else if (e.type === "dragleave") {
      setDragActive(false);
    }
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      processFile(e.dataTransfer.files[0]);
    }
  };

  // File picker handler
  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      processFile(e.target.files[0]);
    }
  };

  // Capture frame from active video
  const captureSelfieSnapshot = () => {
    if (videoRef.current) {
      const video = videoRef.current;
      const canvas = document.createElement("canvas");
      // Match incoming track properties or fallback
      canvas.width = video.videoWidth || 640;
      canvas.height = video.videoHeight || 480;

      const ctx = canvas.getContext("2d");
      if (ctx) {
        // Mirrored selfie capture
        ctx.translate(canvas.width, 0);
        ctx.scale(-1, 1);
        ctx.drawImage(video, 0, 0, canvas.width, canvas.height);

        const dataUrl = canvas.toDataURL("image/jpeg", 0.9);
        setDraftImage(dataUrl);
        stopCamera();
      }
    }
  };

  const handleSubmit = () => {
    if (draftImage) {
      onPhotoAdded(draftImage, noteText.trim());
      // Reset values
      setDraftImage(null);
      setNoteText("");
    }
  };

  const handleCancelDraft = () => {
    setDraftImage(null);
    setNoteText("");
    if (activeTab === "camera") {
      startCamera();
    }
  };

  return (
    <div id="selfie-uploader" className="bg-white/70 backdrop-blur-md rounded-sm border border-blue-100/80 overflow-hidden transition-all duration-300 hover:border-blue-200 shadow-sm">
      {/* Tab Switcher */}
      {!draftImage && (
        <div className="flex border-b border-blue-100 p-1 bg-blue-50/50">
          <button
            id="tab-btn-file"
            type="button"
            onClick={() => setActiveTab("file")}
            className={`flex-1 py-2.5 text-[10px] uppercase tracking-[0.2em] font-mono rounded-none flex items-center justify-center gap-2 transition-all duration-200 cursor-pointer ${
              activeTab === "file"
                ? "bg-[#005BFE] text-white font-bold shadow-sm"
                : "text-zinc-500 hover:text-[#005BFE] hover:bg-blue-50/30"
            }`}
          >
            <Upload className="h-3.5 w-3.5" />
            File Upload
          </button>
          <button
            id="tab-btn-camera"
            type="button"
            onClick={() => setActiveTab("camera")}
            className={`flex-1 py-2.5 text-[10px] uppercase tracking-[0.2em] font-mono rounded-none flex items-center justify-center gap-2 transition-all duration-200 cursor-pointer ${
              activeTab === "camera"
                ? "bg-[#005BFE] text-white font-bold shadow-sm"
                : "text-zinc-500 hover:text-[#005BFE] hover:bg-blue-50/30"
            }`}
          >
            <Camera className="h-3.5 w-3.5" />
            Snapshot Camera
          </button>
        </div>
      )}

      <div className="p-6">
        <AnimatePresence mode="wait">
          {!draftImage ? (
            <motion.div
              key={activeTab}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              transition={{ duration: 0.2 }}
            >
              {activeTab === "file" ? (
                /* Drag Drop Upload Target styled as Frame_088 studio */
                <div
                  id="drop-zone"
                  onDragEnter={handleDrag}
                  onDragOver={handleDrag}
                  onDragLeave={handleDrag}
                  onDrop={handleDrop}
                  onClick={() => fileInputRef.current?.click()}
                  className={`relative border border-dashed rounded-none p-10 flex flex-col items-center justify-center text-center cursor-pointer transition-all duration-300 min-h-[220px] ${
                    dragActive
                      ? "border-[#005BFE] bg-blue-100/10 scale-[0.99]"
                      : "border-blue-200 hover:border-[#005BFE] bg-white/40 hover:bg-white/80"
                  }`}
                >
                  <div className="absolute top-3 left-3 text-[9px] text-zinc-400 font-mono tracking-widest">RECORD_UNIT</div>
                  <input
                    ref={fileInputRef}
                    type="file"
                    accept="image/*"
                    onChange={handleFileChange}
                    className="hidden"
                  />
                  <div className="h-14 w-14 rounded-full border border-blue-100 bg-blue-50/70 flex items-center justify-center text-[#005BFE] mb-4 shadow-sm">
                    <Upload className="h-5 w-5" />
                  </div>
                  <h3 className="text-lg font-serif italic text-zinc-800 tracking-wide">
                    Upload a photograph of yourself
                  </h3>
                  <p className="text-[10px] uppercase tracking-[0.2em] text-zinc-500 mt-2 max-w-sm leading-relaxed">
                    Drag and drop or tap to select image file
                  </p>
                </div>
              ) : (
                /* Camera snapshot feed interface */
                <div className="relative rounded-none overflow-hidden bg-slate-900 border border-blue-100 flex flex-col items-center justify-center min-h-[280px]">
                  <div className="absolute top-3 left-3 text-[9px] text-zinc-400 font-mono tracking-widest z-10 font-bold">LENS_CAPTURE</div>
                  {cameraActive && (
                    <div className="relative w-full aspect-video">
                      <video
                        ref={videoRef}
                        autoPlay
                        playsInline
                        muted
                        className="w-full h-full object-cover scale-x-[-1]"
                      />
                      {/* Guides Overlay */}
                      <div className="absolute inset-0 pointer-events-none border border-dashed border-white/10 m-6 flex items-center justify-center">
                        <div className="w-40 h-40 rounded-full border border-dashed border-white/10"></div>
                      </div>
                    </div>
                  )}

                  {/* Camera Loader / Indicator */}
                  {!cameraActive && !cameraError && (
                    <div className="text-center p-6 text-zinc-400 text-xs font-mono">
                      <RefreshCw className="h-5 w-5 animate-spin mx-auto mb-3 text-zinc-400" />
                      INITIALIZING OPTICS...
                    </div>
                  )}

                  {cameraError && (
                    <div className="p-6 text-center max-w-md">
                      <AlertCircle className="h-8 w-8 text-rose-500 mx-auto mb-3" />
                      <p className="text-[11px] text-rose-400 leading-relaxed font-mono uppercase tracking-wider">
                        {cameraError}
                      </p>
                    </div>
                  )}

                  {/* Shutter Button Controls */}
                  {cameraActive && (
                    <div className="absolute bottom-4 left-1/2 transform -translate-x-1/2 z-10 flex gap-2">
                      <button
                        id="btn-selfie-shutter"
                        type="button"
                        onClick={captureSelfieSnapshot}
                        className="bg-[#005BFE] hover:bg-[#0046C7] active:scale-95 text-white text-[10px] uppercase tracking-[0.2em] font-bold px-5 py-3 rounded-none shadow-lg flex items-center gap-2 transition-all duration-150 cursor-pointer"
                      >
                        <Camera className="h-3.5 w-3.5" />
                        Capture Frame
                      </button>
                    </div>
                  )}
                </div>
              )}
            </motion.div>
          ) : (
            /* Review & Journal Note Writing Phase */
            <motion.div
              key="draft"
              initial={{ opacity: 0, scale: 0.99 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.99 }}
              className="space-y-4"
            >
              <div className="relative border border-blue-100 bg-slate-50 p-2">
                <img
                  src={draftImage}
                  alt="Draft Look"
                  className="w-full h-72 object-contain bg-white"
                />
                <button
                  type="button"
                  onClick={handleCancelDraft}
                  className="absolute top-4 right-4 bg-white/90 hover:bg-red-500 hover:text-white border border-blue-100 text-zinc-650 rounded-none p-2 transition-all active:scale-90 z-20 shadow-sm cursor-pointer"
                  title="Remove this draft"
                >
                  <Trash2 className="h-4 w-4" />
                </button>
                <div className="absolute bottom-4 left-4 bg-white/95 border border-blue-100 text-[9px] uppercase tracking-widest text-[#005BFE] px-2.5 py-1 font-mono font-bold shadow-sm">
                  EXHIBIT_DRAFT_STAGE
                </div>
                
                {/* AI Design Edit Trigger button */}
                <button
                  type="button"
                  onClick={() => setIsEditingPhoto(true)}
                  className="absolute bottom-4 right-4 bg-[#FF7830] hover:bg-[#E65F19] text-white border border-[#FF7830] text-[9px] uppercase tracking-widest px-3 py-1.5 font-mono flex items-center gap-1.5 transition-all shadow-md active:scale-95 z-20 cursor-pointer font-bold"
                >
                  <Sparkles className="h-3.5 w-3.5" />
                  Edit Photo / AI Styling
                </button>
              </div>

              {/* Note Journal Details */}
              <div className="space-y-1.5 pt-2">
                <label className="block text-[10px] uppercase tracking-[0.2em] font-mono text-zinc-550">
                  Write a journal note (optional)
                </label>
                <textarea
                  id="note-draft-textarea"
                  value={noteText}
                  onChange={(e) => setNoteText(e.target.value)}
                  placeholder="Record your mindset, focus elements, outfit selections, or vibe..."
                  rows={3}
                  className="w-full text-xs p-3.5 border border-blue-100 bg-white text-zinc-850 focus:border-[#005BFE] outline-none transition-all placeholder:text-zinc-400 font-sans tracking-wide rounded-none shadow-inner"
                />
              </div>

              {/* Submit triggers addition of the photo */}
              <div className="flex gap-2.5 pt-2">
                <button
                  id="btn-selfie-post"
                  type="button"
                  onClick={handleSubmit}
                  className="flex-1 bg-[#005BFE] hover:bg-[#0046C7] text-white text-[10px] uppercase tracking-[0.2em] font-bold py-3 px-4 rounded-none flex items-center justify-center gap-1.5 shadow-sm active:scale-[0.98] transition-all cursor-pointer"
                >
                  <Check className="h-4 w-4 text-white" />
                  Save Exhibit
                </button>
                <button
                  id="btn-selfie-retake"
                  type="button"
                  onClick={handleCancelDraft}
                  className="bg-transparent hover:bg-blue-50 text-[#005BFE] border border-blue-100 text-[10px] uppercase tracking-[0.2em] font-bold py-3 px-4 rounded-none active:scale-[0.98] transition-all flex items-center gap-1.5 cursor-pointer"
                >
                  <RefreshCw className="h-3.5 w-3.5" />
                  Discard
                </button>
              </div>

              {/* Toggle modal */}
              {isEditingPhoto && draftImage && (
                <SelfieEditor
                  imageUrl={draftImage}
                  onSave={(editedImageUrl) => {
                    setDraftImage(editedImageUrl);
                    setIsEditingPhoto(false);
                  }}
                  onCancel={() => setIsEditingPhoto(false)}
                />
              )}
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
}
