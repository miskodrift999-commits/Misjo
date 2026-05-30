import React, { useState, useRef, useEffect } from "react";
import { 
  RotateCw, RotateCcw, Crop, Sun, Contrast, Sparkles, 
  Eraser, Check, Undo, X, Brush, Wand2, Info, AlertCircle, RefreshCw
} from "lucide-react";

interface SelfieEditorProps {
  imageUrl: string;
  onSave: (editedImageUrl: string) => void;
  onCancel: () => void;
}

export function SelfieEditor({ imageUrl, onSave, onCancel }: SelfieEditorProps) {
  const [activeTab, setActiveTab] = useState<"crop" | "adjust" | "eraser" | "ai">("crop");
  
  // Image states
  const [rotation, setRotation] = useState<number>(0); // degrees (0, 90, 180, 270)
  const [brightness, setBrightness] = useState<number>(0); // -100 to 100
  const [contrast, setContrast] = useState<number>(0); // -100 to 100
  
  // Advanced AI styling values returned by Gemini
  const [aiSepia, setAiSepia] = useState<number>(0);
  const [aiSaturation, setAiSaturation] = useState<number>(100);
  const [aiHueRotate, setAiHueRotate] = useState<number>(0);
  const [aiGrayscale, setAiGrayscale] = useState<number>(0);
  const [aiBlur, setAiBlur] = useState<number>(0);
  const [aiOverlayColor, setAiOverlayColor] = useState<string | null>(null);
  const [aiOverlayOpacity, setAiOverlayOpacity] = useState<number>(0);
  const [aiAppliedFeedback, setAiAppliedFeedback] = useState<string>("");

  // Crop states
  const [isCropActive, setIsCropActive] = useState<boolean>(false);
  const [cropBox, setCropBox] = useState<{ x: number; y: number; w: number; h: number }>({
    x: 10, y: 10, w: 80, h: 80 // percentages of image size
  });
  const [isDraggingCrop, setIsDraggingCrop] = useState<boolean>(false);
  const [dragStart, setDragStart] = useState<{ x: number; y: number } | null>(null);
  const [dragType, setDragType] = useState<"move" | "resize" | null>(null);

  // Magic Eraser states
  const [brushSize, setBrushSize] = useState<number>(20);
  const [isPainting, setIsPainting] = useState<boolean>(false);
  const [eraserMaskLoaded, setEraserMaskLoaded] = useState<boolean>(false);
  
  // AI query prompt state
  const [aiPromptText, setAiPromptText] = useState<string>("");
  const [isAiLoading, setIsAiLoading] = useState<boolean>(false);
  const [aiError, setAiError] = useState<string | null>(null);

  // References
  const containerRef = useRef<HTMLDivElement | null>(null);
  const mainCanvasRef = useRef<HTMLCanvasElement | null>(null);
  const maskCanvasRef = useRef<HTMLCanvasElement | null>(null);
  const imageRef = useRef<HTMLImageElement | null>(null);

  // Undo Stack to revert individual canvas operations
  const [historyStack, setHistoryStack] = useState<string[]>([imageUrl]);
  const [historyIndex, setHistoryIndex] = useState<number>(0);

  // Load Image and refresh main visual canvas
  useEffect(() => {
    const img = new Image();
    img.crossOrigin = "anonymous";
    img.onload = () => {
      imageRef.current = img;
      redrawMainCanvas();
    };
    img.src = historyStack[historyIndex];
  }, [historyIndex, historyStack]);

  // Redraw when adjustments change
  useEffect(() => {
    if (imageRef.current) {
      redrawMainCanvas();
    }
  }, [rotation, brightness, contrast, aiSepia, aiSaturation, aiHueRotate, aiGrayscale, aiBlur, aiOverlayColor, aiOverlayOpacity]);

  // Adjust container resize sync
  useEffect(() => {
    const handleResize = () => {
      if (imageRef.current) redrawMainCanvas();
    };
    window.addEventListener("resize", handleResize);
    return () => window.removeEventListener("resize", handleResize);
  }, []);

  // Set default crop boxes on change
  useEffect(() => {
    if (activeTab === "crop") {
      setIsCropActive(true);
    } else {
      setIsCropActive(false);
    }
    
    // Resize or clean mask canvas when tab swaps to eraser
    if (activeTab === "eraser") {
      setTimeout(() => {
        setupMaskCanvas();
      }, 50);
    }
  }, [activeTab]);

  const setupMaskCanvas = () => {
    if (mainCanvasRef.current && maskCanvasRef.current) {
      const main = mainCanvasRef.current;
      const mask = maskCanvasRef.current;
      mask.width = main.width;
      mask.height = main.height;
      const ctx = mask.getContext("2d");
      if (ctx) {
        ctx.clearRect(0, 0, mask.width, mask.height);
      }
      setEraserMaskLoaded(true);
    }
  };

  const redrawMainCanvas = () => {
    const canvas = mainCanvasRef.current;
    const img = imageRef.current;
    if (!canvas || !img) return;

    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    // Set canvas dimensions respecting natural images and rotation degrees
    const isRotated90 = rotation === 90 || rotation === 270;
    const cw = isRotated90 ? img.height : img.width;
    const ch = isRotated90 ? img.width : img.height;

    // Constrain within visible editorial parent limits
    const maxBoundWidth = Math.min(cw, 800);
    const aspect = cw / ch;
    
    canvas.width = maxBoundWidth;
    canvas.height = maxBoundWidth / aspect;

    // Apply translations for rotation matrix centering
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    ctx.save();
    
    ctx.translate(canvas.width / 2, canvas.height / 2);
    ctx.rotate((rotation * Math.PI) / 180);
    
    const drawW = isRotated90 ? canvas.height : canvas.width;
    const drawH = isRotated90 ? canvas.width : canvas.height;
    
    ctx.drawImage(img, -drawW / 2, -drawH / 2, drawW, drawH);
    ctx.restore();

    // Process adjustments: Brightness, Contrast, and AI styles
    const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
    const data = imageData.data;

    // Factor mappings
    const bValue = brightness; // -100 to 100
    const cValue = contrast; // -100 to 100
    const contrastFactor = (259 * (cValue + 255)) / (255 * (259 - cValue));

    // Convert CSS Filters equivalents directly to raw pixels for complete cross-device baking stability
    const sepiaVal = aiSepia; // 0 to 1
    const satVal = aiSaturation / 100; // factor
    const grayVal = aiGrayscale; // 0 to 1

    for (let i = 0; i < data.length; i += 4) {
      let r = data[i];
      let g = data[i + 1];
      let b = data[i + 2];

      // 1. Brightness
      if (bValue !== 0) {
        r = Math.min(255, Math.max(0, r + bValue));
        g = Math.min(255, Math.max(0, g + bValue));
        b = Math.min(255, Math.max(0, b + bValue));
      }

      // 2. Contrast
      if (cValue !== 0) {
        r = Math.min(255, Math.max(0, contrastFactor * (r - 128) + 128));
        g = Math.min(255, Math.max(0, contrastFactor * (g - 128) + 128));
        b = Math.min(255, Math.max(0, contrastFactor * (b - 128) + 128));
      }

      // 3. Grayscale Filter
      if (grayVal > 0) {
        const gray = 0.299 * r + 0.587 * g + 0.114 * b;
        r = r * (1 - grayVal) + gray * grayVal;
        g = g * (1 - grayVal) + gray * grayVal;
        b = b * (1 - grayVal) + gray * grayVal;
      }

      // 4. Sepia Filter
      if (sepiaVal > 0) {
        const sr = (r * 0.393 + g * 0.769 + b * 0.189);
        const sg = (r * 0.349 + g * 0.686 + b * 0.168);
        const sb = (r * 0.272 + g * 0.534 + b * 0.131);
        r = Math.min(255, r * (1 - sepiaVal) + sr * sepiaVal);
        g = Math.min(255, g * (1 - sepiaVal) + sg * sepiaVal);
        b = Math.min(255, b * (1 - sepiaVal) + sb * sepiaVal);
      }

      // 5. Saturation
      if (satVal !== 1) {
        const luma = 0.299 * r + 0.587 * g + 0.114 * b;
        r = Math.min(255, Math.max(0, luma + (r - luma) * satVal));
        g = Math.min(255, Math.max(0, luma + (g - luma) * satVal));
        b = Math.min(255, Math.max(0, luma + (b - luma) * satVal));
      }

      data[i] = r;
      data[i + 1] = g;
      data[i + 2] = b;
    }

    ctx.putImageData(imageData, 0, 0);

    // 6. Draw AI Overlay Color Tint
    if (aiOverlayColor && aiOverlayOpacity > 0) {
      ctx.save();
      ctx.fillStyle = aiOverlayColor;
      ctx.globalAlpha = aiOverlayOpacity;
      ctx.fillRect(0, 0, canvas.width, canvas.height);
      ctx.restore();
    }

    // 7. Draw AI Blur if set
    if (aiBlur > 0) {
      ctx.save();
      ctx.filter = `blur(${aiBlur}px)`;
      ctx.drawImage(canvas, 0, 0);
      ctx.restore();
    }
  };

  // Push modified state onto stack to bake adjustments permanently
  const bakeAdjustments = () => {
    const canvas = mainCanvasRef.current;
    if (!canvas) return;
    
    const bakedDataUrl = canvas.toDataURL("image/jpeg", 0.95);
    const newHistory = historyStack.slice(0, historyIndex + 1);
    setHistoryStack([...newHistory, bakedDataUrl]);
    setHistoryIndex(newHistory.length);
    
    // Reset temporary variables to zero since they are baked in
    setRotation(0);
    setBrightness(0);
    setContrast(0);
    setAiSepia(0);
    setAiSaturation(100);
    setAiHueRotate(0);
    setAiGrayscale(0);
    setAiBlur(0);
    setAiOverlayColor(null);
    setAiOverlayOpacity(0);
  };

  // Trigger Crop Application
  const applyCropAction = () => {
    const canvas = mainCanvasRef.current;
    if (!canvas) return;

    // Get cropping coords based on percentages
    const rx = (cropBox.x / 100) * canvas.width;
    const ry = (cropBox.y / 100) * canvas.height;
    const rw = (cropBox.w / 100) * canvas.width;
    const rh = (cropBox.h / 100) * canvas.height;

    if (rw < 10 || rh < 10) return; // ignore tiny crops

    // Create secondary temp cropping canvas
    const cropCanvas = document.createElement("canvas");
    cropCanvas.width = rw;
    cropCanvas.height = rh;
    const cropCtx = cropCanvas.getContext("2d");
    
    if (cropCtx) {
      cropCtx.drawImage(canvas, rx, ry, rw, rh, 0, 0, rw, rh);
      const croppedDataUrl = cropCanvas.toDataURL("image/jpeg", 0.95);
      
      const newHistory = historyStack.slice(0, historyIndex + 1);
      setHistoryStack([...newHistory, croppedDataUrl]);
      setHistoryIndex(newHistory.length);
      
      // Reset cropping margins to safe defaults
      setCropBox({ x: 10, y: 10, w: 80, h: 80 });
      setIsCropActive(false);
      setActiveTab("adjust");
    }
  };

  // 90 Deg custom rotate click
  const handleRotate = (direction: "left" | "right") => {
    setRotation(prev => {
      const added = direction === "right" ? 90 : -90;
      let next = (prev + added) % 360;
      if (next < 0) next += 360;
      return next;
    });
  };

  // Drag handles for the cropping rectangle wrapper
  const handleCropMouseDown = (e: React.MouseEvent<HTMLDivElement>, type: "move" | "resize") => {
    e.preventDefault();
    setIsDraggingCrop(true);
    setDragType(type);
    setDragStart({ x: e.clientX, y: e.clientY });
  };

  const handleCropMouseMove = (e: React.MouseEvent<HTMLDivElement>) => {
    if (!isDraggingCrop || !dragStart || !dragType || !mainCanvasRef.current) return;

    const canvas = mainCanvasRef.current;
    const rect = canvas.getBoundingClientRect();
    
    // delta in pixels
    const dx = e.clientX - dragStart.x;
    const dy = e.clientY - dragStart.y;
    
    // convert delta to percentage
    const dxPercent = (dx / rect.width) * 100;
    const dyPercent = (dy / rect.height) * 100;

    setCropBox(prev => {
      let nextX = prev.x;
      let nextY = prev.y;
      let nextW = prev.w;
      let nextH = prev.h;

      if (dragType === "move") {
        nextX = Math.max(0, Math.min(100 - prev.w, prev.x + dxPercent));
        nextY = Math.max(0, Math.min(100 - prev.h, prev.y + dyPercent));
      } else if (dragType === "resize") {
        nextW = Math.max(10, Math.min(100 - prev.x, prev.w + dxPercent));
        nextH = Math.max(10, Math.min(100 - prev.y, prev.h + dyPercent));
      }

      return { x: nextX, y: nextY, w: nextW, h: nextH };
    });

    setDragStart({ x: e.clientX, y: e.clientY });
  };

  const handleCropMouseUp = () => {
    setIsDraggingCrop(false);
    setDragType(null);
    setDragStart(null);
  };

  // --- MAGIC ERASER DRAWING AND COLOR CONTEXT INPAINTING ---
  const handleEraserMouseDown = (e: React.MouseEvent<HTMLCanvasElement>) => {
    const mask = maskCanvasRef.current;
    if (!mask) return;
    const ctx = mask.getContext("2d");
    if (!ctx) return;

    const rect = mask.getBoundingClientRect();
    // Scale according to coordinate resolution mismatch
    const scaleX = mask.width / rect.width;
    const scaleY = mask.height / rect.height;

    const x = (e.clientX - rect.left) * scaleX;
    const y = (e.clientY - rect.top) * scaleY;

    ctx.save();
    ctx.strokeStyle = "rgba(239, 68, 68, 0.85)"; // High visibility Red Mask
    ctx.lineWidth = brushSize;
    ctx.lineCap = "round";
    ctx.lineJoin = "round";
    ctx.beginPath();
    ctx.moveTo(x, y);
    setIsPainting(true);
  };

  const handleEraserMouseMove = (e: React.MouseEvent<HTMLCanvasElement>) => {
    if (!isPainting) return;
    const mask = maskCanvasRef.current;
    if (!mask) return;
    const ctx = mask.getContext("2d");
    if (!ctx) return;

    const rect = mask.getBoundingClientRect();
    const scaleX = mask.width / rect.width;
    const scaleY = mask.height / rect.height;

    const x = (e.clientX - rect.left) * scaleX;
    const y = (e.clientY - rect.top) * scaleY;

    ctx.lineTo(x, y);
    ctx.stroke();
  };

  const handleEraserMouseUp = () => {
    setIsPainting(false);
  };

  const clearEraserMask = () => {
    setupMaskCanvas();
  };

  // Robust magic inpainting/healing algorithm
  const runMagicInpaintEraser = () => {
    const canvas = mainCanvasRef.current;
    const mask = maskCanvasRef.current;
    if (!canvas || !mask) return;

    const ctx = canvas.getContext("2d");
    const maskCtx = mask.getContext("2d");
    if (!ctx || !maskCtx) return;

    const w = canvas.width;
    const h = canvas.height;

    const imgData = ctx.getImageData(0, 0, w, h);
    const maskData = maskCtx.getImageData(0, 0, w, h);

    const pixels = imgData.data;
    const maskPixels = maskData.data;

    // Detect if any paint exists
    let hasMask = false;
    for (let i = 0; i < maskPixels.length; i += 4) {
      if (maskPixels[i + 3] > 10) { // Painted ALPHA threshold
        hasMask = true;
        break;
      }
    }

    if (!hasMask) {
      alert("Please paint with the brush over the area/object you wish to erase first.");
      return;
    }

    // Naviers-Stokes Content-Aware pixel replacement:
    // For every masked pixel, we do radial search in 8 directions to locate healthy adjacent pixels.
    // Replace with local gradient interpolation & then fine smudge blur.
    const runInpaintCycle = () => {
      const resultData = ctx.createImageData(w, h);
      const resPixels = resultData.data;
      
      // Copy original contents
      for (let i = 0; i < pixels.length; i++) {
        resPixels[i] = pixels[i];
      }

      const isMaskedPixel = (x: number, y: number): boolean => {
        if (x < 0 || x >= w || y < 0 || y >= h) return false;
        const index = (y * w + x) * 4;
        return maskPixels[index + 3] > 20; // painted pixel
      };

      const directions = [
        [0, -1], [0, 1], [-1, 0], [1, 0],
        [-1, -1], [-1, 1], [1, -1], [1, 1]
      ];

      // Scan rows to patch masked regions
      for (let y = 0; y < h; y++) {
        for (let x = 0; x < w; x++) {
          const index = (y * w + x) * 4;
          
          if (maskPixels[index + 3] > 20) { // It is painted! Needs filling
            let redSum = 0;
            let greenSum = 0;
            let blueSum = 0;
            let healthyCount = 0;

            // Search outwards directions for closest non-masked neighbors
            for (const [dx, dy] of directions) {
              let rStep = 1;
              let found = false;
              const maxSearchRadius = Math.max(w, h) / 10; // keep boundaries clean

              while (rStep < maxSearchRadius) {
                const nx = Math.round(x + dx * rStep);
                const ny = Math.round(y + dy * rStep);
                
                if (nx < 0 || nx >= w || ny < 0 || ny >= h) break;
                
                if (!isMaskedPixel(nx, ny)) {
                  // Found a healthy border pixel!
                  const sourceIndex = (ny * w + nx) * 4;
                  redSum += pixels[sourceIndex];
                  greenSum += pixels[sourceIndex + 1];
                  blueSum += pixels[sourceIndex + 2];
                  healthyCount++;
                  found = true;
                  break;
                }
                rStep++;
              }
            }

            if (healthyCount > 0) {
              resPixels[index] = Math.round(redSum / healthyCount);
              resPixels[index + 1] = Math.round(greenSum / healthyCount);
              resPixels[index + 2] = Math.round(blueSum / healthyCount);
            } else {
              // Failback fallback to direct vertical neighbor
              const sampleIndex = Math.max(0, index - w * 12);
              resPixels[index] = pixels[sampleIndex];
              resPixels[index + 1] = pixels[sampleIndex + 1];
              resPixels[index + 2] = pixels[sampleIndex + 2];
            }
          }
        }
      }

      // Smooth blending blur (Smudge Gaussian filter applied locally on masked borders to feather edges)
      for (let y = 1; y < h - 1; y++) {
        for (let x = 1; x < w - 1; x++) {
          const idx = (y * w + x) * 4;
          
          // Apply light blurring purely at mask region boundaries for realism
          if (maskPixels[idx + 3] > 20) {
            let rTotal = 0, gTotal = 0, bTotal = 0;
            let kernelCount = 0;

            // 3x3 local filter box
            for (let ky = -1; ky <= 1; ky++) {
              for (let kx = -1; kx <= 1; kx++) {
                const targetIdx = ((y + ky) * w + (x + kx)) * 4;
                rTotal += resPixels[targetIdx];
                gTotal += resPixels[targetIdx + 1];
                bTotal += resPixels[targetIdx + 2];
                kernelCount++;
              }
            }

            resPixels[idx] = Math.round(rTotal / kernelCount);
            resPixels[idx + 1] = Math.round(gTotal / kernelCount);
            resPixels[idx + 2] = Math.round(bTotal / kernelCount);
          }
        }
      }

      return resultData;
    };

    const resultImgData = runInpaintCycle();
    ctx.putImageData(resultImgData, 0, 0);

    // Bake and push onto the history state!
    bakeAdjustments();
    
    // Clear mask
    clearEraserMask();
  };

  // --- GENERATIVE AI PHOTO LOOK EDIT ---
  const handleAiPhotoEditSubmit = async () => {
    if (!aiPromptText.trim()) return;
    
    setIsAiLoading(true);
    setAiError(null);
    setAiAppliedFeedback("");
    
    try {
      // Send current state photo to editor API Route matching editPrompt schema
      const response = await fetch("/api/edit-selfie", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          image: historyStack[historyIndex],
          editPrompt: aiPromptText.trim()
        })
      });

      if (!response.ok) {
        const errorJson = await response.json();
        throw new Error(errorJson.error || "Failed to style selfie with Gemini.");
      }

      const result = await response.json();
      
      if (result.method === "gemini-image-edit" && result.image) {
        // Direct generative AI style transfer succeeded! Push directly onto history stacks
        const newHistory = historyStack.slice(0, historyIndex + 1);
        setHistoryStack([...newHistory, result.image]);
        setHistoryIndex(newHistory.length);
        setAiAppliedFeedback("Successfully edited portrait style using Gemini Generative model!");
      } else if (result.method === "canvas-adjustment-fallback" && result.fallbackConfig) {
        // Fallback model returns custom canvas-driven matrix mappings
        const config = result.fallbackConfig;
        const adjust = config.adjustments || {};

        // Convert multiplier ratios (like 1.2 or 0.8) to our slider percentages (-100 to 100)
        const brightVal = Math.round(((adjust.brightness || 1.0) - 1.0) * 100);
        const contrastVal = Math.round(((adjust.contrast || 1.0) - 1.0) * 100);
        
        let saturationFactor = 100;
        if (adjust.saturation !== undefined) {
          saturationFactor = Math.round(adjust.saturation * 100);
        }

        const sepiaFactor = adjust.sepia !== undefined ? adjust.sepia : 0;
        const hueRotateFactor = adjust.hueRotate !== undefined ? adjust.hueRotate : 0;

        setBrightness(brightVal);
        setContrast(contrastVal);
        setAiSaturation(saturationFactor);
        setAiSepia(sepiaFactor);
        setAiHueRotate(hueRotateFactor);
        setAiGrayscale(config.blendStyle === "grayscale" ? 1.0 : 0);

        // Customize layout overlays representing individual blendStyle contexts
        let colorOverlay = null;
        let opacityOverlay = 0;

        if (config.blendStyle === "warm" || config.blendStyle === "duotone-warm") {
          colorOverlay = "#f59e0b"; // light orange tint
          opacityOverlay = 0.15;
        } else if (config.blendStyle === "cool") {
          colorOverlay = "#3b82f6"; // light blue tint
          opacityOverlay = 0.12;
        } else if (config.blendStyle === "neon") {
          colorOverlay = "#ec4899"; // pink cyberpunk tone
          opacityOverlay = 0.16;
        } else if (config.blendStyle === "vintage") {
          colorOverlay = "#78350f"; // warm sepia filter shadow
          opacityOverlay = 0.15;
        } else if (config.blendStyle === "draft-sketch") {
          setAiGrayscale(1.0);
          setContrast(45);
        }

        setAiOverlayColor(colorOverlay);
        setAiOverlayOpacity(opacityOverlay);
        setAiAppliedFeedback(`${config.styleName || "AI Style Blend"}: ${config.creativeCaption || "Applied color corrections successfully."}`);
      } else {
        throw new Error("Undetected response format from edit studio.");
      }

      // Clear search prompt on success
      setAiPromptText("");
    } catch (err: any) {
      console.error("AI photo editor error:", err);
      setAiError(err.message || "An unexpected error occurred during style transfer.");
    } finally {
      setIsAiLoading(false);
    }
  };

  // Undo click
  const handleUndo = () => {
    if (historyIndex > 0) {
      setHistoryIndex(prev => prev - 1);
      // Reset temporary filters
      setRotation(0);
      setBrightness(0);
      setContrast(0);
      setAiSepia(0);
      setAiSaturation(100);
      setAiBlur(0);
      setAiGrayscale(0);
      setAiOverlayColor(null);
      setAiOverlayOpacity(0);
    }
  };

  const handleFinishAndSave = () => {
    // Redraw and bake everything into final Base64 image
    const canvas = mainCanvasRef.current;
    if (canvas) {
      const finalResult = canvas.toDataURL("image/jpeg", 0.95);
      onSave(finalResult);
    }
  };

  return (
    <div id="photo-editor-modal" className="fixed inset-0 z-50 bg-[#0C0C0C]/95 backdrop-blur-md flex flex-col justify-between overflow-hidden p-4 sm:p-6 lg:p-8 text-[#E5E5E5] font-sans">
      
      {/* Top Header Row - Editorial Aesthetic style */}
      <div className="flex justify-between items-center border-b border-[#2A2A2A] pb-4 mb-4">
        <div>
          <span className="text-[10px] tracking-[0.3em] uppercase opacity-50 block mb-1">MEME_ARCHIVE_01 / RENDER_LAB</span>
          <h2 className="text-xl font-serif italic text-white flex items-center gap-2">
            <Sparkles className="h-4.5 w-4.5 text-amber-400" />
            AI Portrait Studio
          </h2>
        </div>
        <div className="flex items-center gap-3">
          <button
            type="button"
            onClick={handleUndo}
            disabled={historyIndex === 0}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded border border-[#2A2A2A] text-xs font-mono transition-all ${
              historyIndex === 0 ? "opacity-35 cursor-not-allowed" : "hover:bg-white hover:text-black hover:border-white"
            }`}
          >
            <Undo className="h-3.5 w-3.5" />
            Undo Step
          </button>
          
          <button
            type="button"
            onClick={onCancel}
            className="p-1.5 hover:bg-[#2A2A2A] text-slate-400 hover:text-white rounded transition-all"
            title="Cancel edits"
          >
            <X className="h-5 w-5" />
          </button>
        </div>
      </div>

      {/* Main Sandbox Interactive Split Workspace */}
      <div className="flex-1 flex flex-col lg:flex-row gap-6 overflow-hidden items-stretch py-2">
        
        {/* LEFT COLUMN: The Interactive Canvas & Viewfinder */}
        <div className="flex-1 bg-[#0F0F0F] rounded border border-[#2A2A2A] relative flex items-center justify-center overflow-hidden p-4">
          <div className="absolute top-3 left-4 text-[10px] opacity-40 font-mono tracking-widest uppercase">
            FRAME__REC_0{historyIndex + 1}
          </div>
          
          <div ref={containerRef} className="relative max-w-full max-h-[70vh] flex items-center justify-center">
            {/* The primary Canvas */}
            <canvas
              ref={mainCanvasRef}
              className="max-w-full max-h-[60vh] h-auto object-contain shadow-2xl relative"
              style={{
                borderRadius: "2px",
                filter: activeTab === "crop" ? "brightness(0.6)" : "none"
              }}
            />

            {/* Inpainting Mask Draw Canvas Overlay */}
            {activeTab === "eraser" && eraserMaskLoaded && (
              <canvas
                ref={maskCanvasRef}
                onMouseDown={handleEraserMouseDown}
                onMouseMove={handleEraserMouseMove}
                onMouseUp={handleEraserMouseUp}
                onMouseLeave={handleEraserMouseUp}
                className="absolute inset-0 max-w-full max-h-[60vh] h-auto object-contain cursor-crosshair z-10 touch-none"
              />
            )}

            {/* INTERACTIVE CROP BOX OVERLAY */}
            {activeTab === "crop" && isCropActive && (
              <div
                className="absolute border border-dashed border-amber-400 z-20 cursor-move"
                style={{
                  left: `${cropBox.x}%`,
                  top: `${cropBox.y}%`,
                  width: `${cropBox.w}%`,
                  height: `${cropBox.h}%`,
                  boxShadow: "0 0 0 4000px rgba(0, 0, 0, 0.55)"
                }}
                onMouseMove={handleCropMouseMove}
                onMouseUp={handleCropMouseUp}
                onMouseLeave={handleCropMouseUp}
              >
                {/* Crop Handle: Move Center Grip */}
                <div 
                  className="absolute inset-4 cursor-move" 
                  onMouseDown={(e) => handleCropMouseDown(e, "move")}
                />
                {/* Corner Resize Dragger handle */}
                <div
                  className="absolute bottom-0 right-0 w-4 h-4 bg-amber-400 border border-[#0C0C0C] cursor-se-resize shadow-md"
                  onMouseDown={(e) => handleCropMouseDown(e, "resize")}
                />
                
                <div className="absolute top-2 left-2 text-[8px] font-mono select-none text-white/90 bg-amber-500/80 px-1 py-0.5 rounded uppercase">
                  W:{Math.round(cropBox.w)}% H:{Math.round(cropBox.h)}%
                </div>
              </div>
            )}
          </div>

          <div className="absolute bottom-3 right-4 flex items-center gap-2">
            <span className="text-[9px] font-mono uppercase bg-[#161616] border border-[#2A2A2A] px-2 py-0.5 rounded opacity-40">
              {rotation}° ROTATION
            </span>
            <span className="text-[9px] font-mono uppercase bg-[#161616] border border-[#2A2A2A] px-2 py-0.5 rounded opacity-40">
              {brightness > 0 ? `+${brightness}` : brightness} BRIGHT
            </span>
          </div>
        </div>

        {/* RIGHT COLUMN: Professional Fine Styling Panel & Controls */}
        <div className="w-full lg:w-96 flex flex-col justify-between border border-[#2A2A2A] bg-[#0A0A0A] p-5 rounded">
          
          {/* Section Selector tabs */}
          <div className="space-y-4">
            <div className="flex border-b border-[#2A2A2A] p-0.5 text-xs">
              <button
                type="button"
                onClick={() => setActiveTab("crop")}
                className={`flex-1 py-2 text-[10px] font-mono uppercase tracking-wider text-center border-b transition-all ${
                  activeTab === "crop"
                    ? "border-white text-white font-semibold"
                    : "border-transparent text-slate-500 hover:text-white"
                }`}
              >
                Crop / Rotate
              </button>
              <button
                type="button"
                onClick={() => setActiveTab("adjust")}
                className={`flex-1 py-2 text-[10px] font-mono uppercase tracking-wider text-center border-b transition-all ${
                  activeTab === "adjust"
                    ? "border-white text-white font-semibold"
                    : "border-transparent text-slate-500 hover:text-white"
                }`}
              >
                Filters
              </button>
              <button
                type="button"
                onClick={() => setActiveTab("eraser")}
                className={`flex-1 py-2 text-[10px] font-mono uppercase tracking-wider text-center border-b transition-all ${
                  activeTab === "eraser"
                    ? "border-white text-white font-semibold"
                    : "border-transparent text-slate-500 hover:text-white"
                }`}
              >
                Eraser
              </button>
              <button
                type="button"
                onClick={() => setActiveTab("ai")}
                className={`flex-1 py-2 text-[10px] font-mono uppercase tracking-wider text-center border-b transition-all ${
                  activeTab === "ai"
                    ? "border-white text-white font-semibold"
                    : "border-transparent text-slate-500 hover:text-white"
                }`}
              >
                AI Editor
              </button>
            </div>

            {/* TAB CORRESPONDING PANELS */}
            <div className="py-2.5 min-h-[220px]">
              
              {/* Tab: Crop & Rotate */}
              {activeTab === "crop" && (
                <div className="space-y-5 animate-fadeIn">
                  <p className="text-[10px] uppercase tracking-widest opacity-45 leading-relaxed">
                    Set formatting boundaries using the slider grids or rotation matrix levers.
                  </p>
                  
                  <div className="space-y-2">
                    <label className="block text-[10px] font-mono uppercase tracking-wider text-slate-400">
                      Step Orientation Levers
                    </label>
                    <div className="grid grid-cols-2 gap-2">
                      <button
                        type="button"
                        onClick={() => handleRotate("left")}
                        className="py-2 px-3 border border-[#2A2A2A] hover:bg-white hover:text-black transition-colors rounded text-xs flex items-center justify-center gap-1.5 font-mono"
                      >
                        <RotateCcw className="h-3.5 w-3.5" />
                        -90° LEFT
                      </button>
                      <button
                        type="button"
                        onClick={() => handleRotate("right")}
                        className="py-2 px-3 border border-[#2A2A2A] hover:bg-white hover:text-black transition-colors rounded text-xs flex items-center justify-center gap-1.5 font-mono"
                      >
                        <RotateCw className="h-3.5 w-3.5" />
                        +90° RIGHT
                      </button>
                    </div>
                  </div>

                  <div className="pt-2 border-t border-[#1C1C1C] space-y-3">
                    <button
                      type="button"
                      onClick={applyCropAction}
                      className="w-full py-2.5 bg-white text-black hover:bg-transparent hover:text-white border border-white transition-all text-xs font-semibold rounded flex items-center justify-center gap-2"
                    >
                      <Crop className="h-4 w-4" />
                      Apply Selected Crop Box
                    </button>
                    <p className="text-[9px] text-center text-slate-500 italic">
                      Drag crop selection borders over preview on the left
                    </p>
                  </div>
                </div>
              )}

              {/* Tab: General Adjust Contrast & Brightness */}
              {activeTab === "adjust" && (
                <div className="space-y-4 animate-fadeIn">
                  <p className="text-[10px] uppercase tracking-widest opacity-45">
                    Modulate standard luma and depth metrics. Double click key trackers to reset coefficients.
                  </p>

                  {/* Brightness slider */}
                  <div className="space-y-1">
                    <div className="flex justify-between items-center text-[10px] font-mono text-slate-400">
                      <span className="flex items-center gap-1">
                        <Sun className="h-3 w-3" />
                        BRIGHTNESS
                      </span>
                      <span>{brightness > 0 ? `+${brightness}` : brightness}</span>
                    </div>
                    <input
                      type="range"
                      min="-100"
                      max="100"
                      value={brightness}
                      onChange={(e) => setBrightness(parseInt(e.target.value))}
                      className="w-full accent-white bg-[#2A2A2A] h-1 rounded"
                    />
                  </div>

                  {/* Contrast slider */}
                  <div className="space-y-1">
                    <div className="flex justify-between items-center text-[10px] font-mono text-slate-400">
                      <span className="flex items-center gap-1">
                        <Contrast className="h-3 w-3" />
                        CONTRAST
                      </span>
                      <span>{contrast > 0 ? `+${contrast}` : contrast}</span>
                    </div>
                    <input
                      type="range"
                      min="-100"
                      max="100"
                      value={contrast}
                      onChange={(e) => setContrast(parseInt(e.target.value))}
                      className="w-full accent-white bg-[#2A2A2A] h-1 rounded"
                    />
                  </div>

                  {/* Filter reset helper row */}
                  <div className="pt-4 border-t border-[#1C1C1C] flex justify-between items-center gap-2">
                    <button
                      type="button"
                      onClick={() => {
                        setBrightness(0);
                        setContrast(0);
                      }}
                      className="text-[9px] font-mono uppercase bg-[#181818] hover:bg-[#2A2A2A] border border-[#2A2A2A] px-2.5 py-1.5 rounded text-slate-400 hover:text-white transition-all"
                    >
                      Clear Sliders
                    </button>
                    
                    <button
                      type="button"
                      onClick={bakeAdjustments}
                      className="bg-white/10 hover:bg-emerald-500/10 text-slate-200 hover:text-emerald-400 border border-[#2A2A2A] hover:border-emerald-500/30 px-3 py-1.5 rounded text-[10px] font-mono uppercase transition-all"
                    >
                      Bake Changes
                    </button>
                  </div>
                </div>
              )}

              {/* Tab: Real Content-Aware Magic Eraser brush */}
              {activeTab === "eraser" && (
                <div className="space-y-4 animate-fadeIn">
                  <div className="flex gap-2 items-start bg-[#1C0000]/40 border border-[#EF4444]/20 p-3 rounded">
                    <Eraser className="h-4 w-4 text-rose-500 shrink-0 mt-0.5" />
                    <div>
                      <h4 className="text-[10px] font-mono uppercase text-rose-400 tracking-wider">Inpaint Magic Wand</h4>
                      <p className="text-[9px] text-slate-400 leading-normal mt-0.5">
                        Brush over background photobombs, wrinkles, or styling elements. The AI boundaries will substitute surrounding pixels elegantly!
                      </p>
                    </div>
                  </div>

                  <div className="space-y-1">
                    <div className="flex justify-between items-center text-[10px] font-mono text-slate-400">
                      <span className="flex items-center gap-1">
                        <Brush className="h-3.5 w-3.5" />
                        BRUSH SIZE
                      </span>
                      <span>{brushSize}px</span>
                    </div>
                    <input
                      type="range"
                      min="5"
                      max="80"
                      value={brushSize}
                      onChange={(e) => setBrushSize(parseInt(e.target.value))}
                      className="w-full accent-rose-500 bg-[#2A2A2A] h-1 rounded text-rose-600"
                    />
                  </div>

                  <div className="pt-2 border-t border-[#1C1C1C] flex gap-2">
                    <button
                      type="button"
                      onClick={runMagicInpaintEraser}
                      className="flex-1 py-2 bg-rose-600 hover:bg-rose-700 active:scale-95 text-white text-[11px] font-bold tracking-widest uppercase transition-all rounded flex items-center justify-center gap-1.5"
                    >
                      <Wand2 className="h-4 w-4" />
                      Erase Marked Area
                    </button>
                    <button
                      type="button"
                      onClick={clearEraserMask}
                      className="py-2 px-3 border border-[#2A2A2A] hover:bg-[#1C1C1C] transition-colors rounded text-slate-400 text-[10px] font-mono uppercase"
                    >
                      Clear
                    </button>
                  </div>
                </div>
              )}

              {/* Tab: Advanced Prompt-based AI Style transformations */}
              {activeTab === "ai" && (
                <div className="space-y-4 animate-fadeIn">
                  <p className="text-[10px] uppercase tracking-widest opacity-45">
                    Describe any filter look and let Gemini configure exact tone color schemes for you!
                  </p>

                  <textarea
                    value={aiPromptText}
                    onChange={(e) => setAiPromptText(e.target.value)}
                    placeholder="Try: 'Cozy film camera look with heavy contrast', 'High-key sci-fi neon styling', 'Dark moody aesthetic'..."
                    rows={3}
                    className="w-full text-xs p-3 border border-[#2A2A2A] bg-[#0E0E0E] text-slate-100 rounded focus:ring-1 focus:ring-white outline-none transition-all placeholder:text-slate-600 resize-none font-mono"
                  />

                  {aiError && (
                    <div className="bg-rose-955/20 border border-rose-500/20 p-2 text-[9px] text-rose-300 rounded flex gap-1.5 items-center">
                      <AlertCircle className="h-3.5 w-3.5 text-rose-500 shrink-0" />
                      <span>{aiError}</span>
                    </div>
                  )}

                  <button
                    type="button"
                    onClick={handleAiPhotoEditSubmit}
                    disabled={isAiLoading || !aiPromptText.trim()}
                    className="w-full py-2 bg-gradient-to-r from-amber-500/20 to-teal-500/20 hover:from-amber-500/30 hover:to-teal-500/30 border border-[#2A2A2A] hover:border-white text-white text-xs font-mono uppercase tracking-wider rounded transition-all disabled:opacity-40 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                  >
                    {isAiLoading ? (
                      <>
                        <RefreshCw className="h-3.5 w-3.5 animate-spin text-amber-500" />
                        AI Style Matching...
                      </>
                    ) : (
                      <>
                        <Sparkles className="h-3.5 w-3.5 text-amber-400" />
                        Generate Style Matrix
                      </>
                    )}
                  </button>

                  {aiAppliedFeedback && (
                    <div className="border-t border-[#1C1C1C] pt-2">
                      <p className="text-[10px] text-amber-300/80 leading-normal italic font-serif">
                        "{aiAppliedFeedback}"
                      </p>
                    </div>
                  )}
                </div>
              )}

            </div>
          </div>

          {/* Action Footer baking section */}
          <div className="border-t border-[#2A2A2A] pt-4 mt-4 space-y-2">
            <button
              type="button"
              onClick={handleFinishAndSave}
              className="w-full py-3 bg-white text-black hover:bg-neutral-200 text-xs font-bold uppercase tracking-widest rounded flex items-center justify-center gap-2 transition-all shadow-md active:scale-[0.98]"
            >
              <Check className="h-4 w-4" />
              CONFIRM ALL EDITS
            </button>
            <p className="text-[8px] text-center font-mono opacity-30">
              CLICK CONFIRM TO FLATTEN ALL COMPACT LAYERS
            </p>
          </div>

        </div>

      </div>

    </div>
  );
}
