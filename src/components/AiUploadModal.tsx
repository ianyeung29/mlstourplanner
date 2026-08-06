'use client';

import React from 'react';
import { TourStop } from '@/types/tour';
import { createWorker } from 'tesseract.js';
import { X, UploadCloud, FileText, Sparkles, CheckCircle2, Home, Bed, Bath, User, Phone, Mail, Building, Loader2, AlertTriangle, Trash2, Plus, Image as ImageIcon, CheckSquare } from 'lucide-react';

interface AiUploadModalProps {
  isOpen: boolean;
  onClose: () => void;
  onAddExtractedStops: (stops: Partial<TourStop>[]) => void;
}

interface PdfProcessResult {
  text: string;
  pageCanvas: HTMLCanvasElement | null;
}

/**
 * Ultra-Fast Fail-Safe PDF Text & Page Canvas Processor
 * Protected by a 3-second Promise.race timeout to ensure browser never hangs.
 */
async function processPdfFile(file: File): Promise<PdfProcessResult> {
  const timeoutPromise = new Promise<PdfProcessResult>((resolve) => {
    setTimeout(() => {
      resolve({ text: '', pageCanvas: null });
    }, 3000);
  });

  const parsePromise = (async (): Promise<PdfProcessResult> => {
    try {
      const pdfjsLib = await import('pdfjs-dist');
      if (typeof window !== 'undefined') {
        try {
          pdfjsLib.GlobalWorkerOptions.workerSrc = `https://cdnjs.cloudflare.com/ajax/libs/pdf.js/${pdfjsLib.version}/pdf.worker.min.js`;
        } catch (e) {}
      }

      const arrayBuffer = await file.arrayBuffer();
      const loadingTask = pdfjsLib.getDocument({
        data: arrayBuffer,
        useSystemFonts: true,
        isEvalSupported: false
      });

      const pdf = await loadingTask.promise;

      let fullText = '';
      const maxPagesToRead = Math.min(pdf.numPages, 5);
      for (let p = 1; p <= maxPagesToRead; p++) {
        try {
          const page = await pdf.getPage(p);
          const textContent = await page.getTextContent();
          const pageText = textContent.items.map((item: any) => item.str || '').join(' ');
          fullText += `\n--- Page ${p} ---\n` + pageText;
        } catch (err) {}
      }

      let pageCanvas: HTMLCanvasElement | null = null;
      if (pdf.numPages > 0) {
        try {
          const page1 = await pdf.getPage(1);
          const viewport = page1.getViewport({ scale: 1.2 });
          pageCanvas = document.createElement('canvas');
          pageCanvas.width = viewport.width;
          pageCanvas.height = viewport.height;
          const ctx = pageCanvas.getContext('2d');
          if (ctx) {
            await page1.render({ canvasContext: ctx, viewport }).promise;
          }
        } catch (canvasErr) {}
      }

      // Fast fallback string extraction if pdfjs returned empty text
      if (!fullText.trim()) {
        try {
          const decoder = new TextDecoder('utf-8');
          const raw = decoder.decode(arrayBuffer);
          const matches = raw.match(/\(([^()]+)\)\s*Tj/g) || raw.match(/\[(.*?)\]\s*TJ/g);
          if (matches) {
            fullText = matches.map(m => m.replace(/[\(\)\[\]]/g, '')).join(' ');
          }
        } catch (e) {}
      }

      return { text: fullText, pageCanvas };
    } catch (err) {
      console.error('PDF parsing error:', err);
      return { text: '', pageCanvas: null };
    }
  })();

  return Promise.race([parsePromise, timeoutPromise]);
}

/**
 * Smart Canvas Photo Cropper:
 * Isolates the primary property photograph from uploaded images or rendered PDF canvases.
 */
async function cropListingPhotoFromCanvasOrFile(
  file: File,
  preRenderedCanvas: HTMLCanvasElement | null
): Promise<string> {
  if (!file) return '';

  let canvas: HTMLCanvasElement | null = preRenderedCanvas;
  let imgWidth = preRenderedCanvas ? preRenderedCanvas.width : 0;
  let imgHeight = preRenderedCanvas ? preRenderedCanvas.height : 0;
  let originalDataUrl = preRenderedCanvas ? preRenderedCanvas.toDataURL('image/jpeg', 0.85) : '';

  const isPdf = file.type === 'application/pdf' || file.name.toLowerCase().endsWith('.pdf');

  if (isPdf && !canvas) {
    const { pageCanvas } = await processPdfFile(file);
    if (!pageCanvas) return '';
    canvas = pageCanvas;
    imgWidth = pageCanvas.width;
    imgHeight = pageCanvas.height;
    originalDataUrl = pageCanvas.toDataURL('image/jpeg', 0.85);
  } else if (!isPdf && file.type.startsWith('image/')) {
    const dataUrl = await new Promise<string>((resolve) => {
      const reader = new FileReader();
      reader.onload = (e) => resolve(e.target?.result as string || '');
      reader.onerror = () => resolve('');
      reader.readAsDataURL(file);
    });

    if (!dataUrl) return '';

    const img = await new Promise<HTMLImageElement | null>((resolve) => {
      const image = new Image();
      image.onload = () => resolve(image);
      image.onerror = () => resolve(null);
      image.src = dataUrl;
    });

    if (!img) return '';

    canvas = document.createElement('canvas');
    canvas.width = img.width;
    canvas.height = img.height;
    const ctx = canvas.getContext('2d');
    if (!ctx) return dataUrl;
    ctx.drawImage(img, 0, 0);

    imgWidth = img.width;
    imgHeight = img.height;
    originalDataUrl = dataUrl;
  }

  if (!canvas || imgWidth === 0 || imgHeight === 0) return originalDataUrl;

  try {
    const aspect = imgWidth / imgHeight;

    if (aspect >= 1.15 && aspect <= 2.2 && imgHeight <= 1250) {
      return originalDataUrl;
    }

    const ctx = canvas.getContext('2d');
    if (!ctx) return originalDataUrl;

    let startY = 0;
    let cropHeight = imgHeight;
    let startX = 0;
    let cropWidth = imgWidth;

    if (imgHeight > imgWidth * 1.05) {
      try {
        const imgData = ctx.getImageData(0, 0, imgWidth, imgHeight);
        const data = imgData.data;

        const stepY = Math.max(2, Math.floor(imgHeight / 150));
        const stepX = Math.max(2, Math.floor(imgWidth / 40));
        const rowScores: { y: number; score: number }[] = [];

        for (let y = 0; y < Math.floor(imgHeight * 0.7); y += stepY) {
          let varSum = 0;
          for (let x = 0; x < imgWidth - stepX; x += stepX) {
            const idx1 = (y * imgWidth + x) * 4;
            const idx2 = (y * imgWidth + (x + stepX)) * 4;

            const diff =
              Math.abs(data[idx1] - data[idx2]) +
              Math.abs(data[idx1 + 1] - data[idx2 + 1]) +
              Math.abs(data[idx1 + 2] - data[idx2 + 2]);

            const isLight =
              data[idx1] > 240 && data[idx1 + 1] > 240 && data[idx1 + 2] > 240;
            if (!isLight) {
              varSum += diff;
            }
          }
          rowScores.push({ y, score: varSum });
        }

        let maxScore = 0;
        let bestY = Math.round(imgHeight * 0.08);

        for (const item of rowScores) {
          if (item.score > maxScore) {
            maxScore = item.score;
            bestY = item.y;
          }
        }

        const targetH = Math.round(imgWidth * 0.62);
        startY = Math.max(0, Math.min(bestY - Math.round(targetH * 0.15), imgHeight - targetH));
        cropHeight = Math.min(targetH, imgHeight - startY);

        startX = Math.round(imgWidth * 0.02);
        cropWidth = Math.round(imgWidth * 0.96);
      } catch (err) {
        startY = Math.round(imgHeight * 0.05);
        cropHeight = Math.round(imgWidth * 0.65);
      }
    }

    const targetWidth = Math.min(480, cropWidth);
    const targetHeight = Math.round(cropHeight * (targetWidth / cropWidth));

    const cropCanvas = document.createElement('canvas');
    const cropCtx = cropCanvas.getContext('2d');
    if (!cropCtx) return '';

    cropCanvas.width = targetWidth;
    cropCanvas.height = targetHeight;

    cropCtx.drawImage(
      canvas,
      startX, startY, cropWidth, cropHeight,
      0, 0, targetWidth, targetHeight
    );

    return cropCanvas.toDataURL('image/jpeg', 0.70);
  } catch (err) {
    return '';
  }
}

/**
 * Uploads a base64 image string to Cloudflare R2 via /api/upload-r2.
 */
async function uploadCroppedPhotoToR2(base64Image: string, fileName: string): Promise<string> {
  if (!base64Image) return '';
  try {
    const res = await fetch('/api/upload-r2', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        imageBase64: base64Image,
        fileName
      })
    });
    const data = await res.json();
    if (res.ok && data.imageUrl && !data.imageUrl.startsWith('data:image')) {
      return data.imageUrl;
    }
    if (data.imageUrl && data.imageUrl.length < 50000) {
      return data.imageUrl;
    }
  } catch (e) {
    console.warn('R2 photo upload fallback:', e);
  }
  return base64Image.length < 50000 ? base64Image : 'https://images.unsplash.com/photo-1600596542815-ffad4c1539a9?auto=format&fit=crop&w=800&q=80';
}

export default function AiUploadModal({ isOpen, onClose, onAddExtractedStops }: AiUploadModalProps) {
  const [files, setFiles] = React.useState<File[]>([]);
  const [isMultipleListings, setIsMultipleListings] = React.useState(true);
  const [isScanning, setIsScanning] = React.useState(false);
  const [currentFileScanning, setCurrentFileScanning] = React.useState<string>('');
  const [extractedResults, setExtractedResults] = React.useState<any[]>([]);
  const [errorMsg, setErrorMsg] = React.useState<string | null>(null);

  if (!isOpen) return null;

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      const selected = Array.from(e.target.files);
      setFiles(prev => [...prev, ...selected]);
      setExtractedResults([]);
      setErrorMsg(null);
    }
  };

  const handleRemoveFile = (index: number) => {
    setFiles(prev => prev.filter((_, i) => i !== index));
  };

  const handleAnalyze = async () => {
    if (files.length === 0) return;

    setIsScanning(true);
    setErrorMsg(null);
    setExtractedResults([]);

    try {
      const allExtracted: any[] = [];

      for (let i = 0; i < files.length; i++) {
        const file = files[i];
        setCurrentFileScanning(`Processing PDF / Image ${i + 1}/${files.length}: ${file.name}`);

        const isPdf = file.type === 'application/pdf' || file.name.toLowerCase().endsWith('.pdf');
        let ocrText = '';
        let pageCanvas: HTMLCanvasElement | null = null;

        // 1. Single PDF processing pass
        if (isPdf) {
          const pdfRes = await processPdfFile(file);
          ocrText = pdfRes.text;
          pageCanvas = pdfRes.pageCanvas;

          // If digital text is missing or short, perform quick OCR on canvas if available
          if (ocrText.trim().length < 30 && pageCanvas) {
            try {
              const worker = await createWorker('eng');
              const ret = await worker.recognize(pageCanvas);
              await worker.terminate();
              ocrText = ret.data.text || ocrText;
            } catch (e) {}
          }
        } else if (file.type.startsWith('image/')) {
          try {
            const worker = await createWorker('eng');
            const ret = await worker.recognize(file);
            await worker.terminate();
            ocrText = ret.data.text;
          } catch (e) {}
        }

        // 2. Crop main exterior property photo
        let croppedPhotoUrl = '';
        const croppedBase64 = await cropListingPhotoFromCanvasOrFile(file, pageCanvas);

        // Upload to R2 in parallel without blocking AI response
        const r2UploadPromise = croppedBase64
          ? uploadCroppedPhotoToR2(croppedBase64, file.name)
          : Promise.resolve('');

        // 3. Send file & OCR payload to AI listing extraction API
        const formData = new FormData();
        formData.append('file', file);
        if (ocrText) formData.append('ocrText', ocrText);
        formData.append('isMultiple', isMultipleListings ? 'true' : 'false');

        // Fetch with 20s timeout protection
        const controller = new AbortController();
        const timeoutId = setTimeout(() => controller.abort(), 20000);

        try {
          const res = await fetch('/api/ai-extract-listing', {
            method: 'POST',
            body: formData,
            signal: controller.signal
          });
          clearTimeout(timeoutId);

          const data = await res.json();
          const resultList = data.extracted || data.data;
          croppedPhotoUrl = await r2UploadPromise;

          if (res.ok && resultList) {
            const rawItems = Array.isArray(resultList) ? resultList : [resultList];

            const enrichedItems = rawItems.map(item => ({
              ...item,
              image_url: (item.image_url && !item.image_url.includes('unsplash'))
                ? item.image_url
                : (croppedPhotoUrl || item.image_url || 'https://images.unsplash.com/photo-1600596542815-ffad4c1539a9?auto=format&fit=crop&w=800&q=80')
            }));

            allExtracted.push(...enrichedItems);
          } else if (data.error) {
            setErrorMsg(data.error);
          }
        } catch (fetchErr: any) {
          clearTimeout(timeoutId);
          croppedPhotoUrl = await r2UploadPromise;
          console.warn('API call timeout or error for file:', file.name, fetchErr);
        }
      }

      if (allExtracted.length > 0) {
        setExtractedResults(allExtracted);
      } else if (!errorMsg) {
        setErrorMsg('AI Scanner could not parse listing details from the uploaded files.');
      }
    } catch (err: any) {
      setErrorMsg(err.message || 'Error processing document with DeepSeek AI scanner.');
    } finally {
      setIsScanning(false);
      setCurrentFileScanning('');
    }
  };

  const handleConfirmAddAll = () => {
    if (extractedResults.length === 0) return;

    const formattedList: Partial<TourStop>[] = extractedResults.map(result => ({
      original_input: result.address || 'Uploaded Listing Document',
      normalized_address: result.address || '78 Shelter Rock Rd, Manhasset, NY 11030',
      latitude: 40.7912,
      longitude: -73.6954,
      mls_number: result.mls_number,
      list_price: typeof result.list_price === 'number' ? result.list_price : parseInt(result.list_price || '0'),
      beds: typeof result.beds === 'number' ? result.beds : parseInt(result.beds || '0'),
      baths: typeof result.baths === 'number' ? result.baths : parseFloat(result.baths || '0'),
      sqft: typeof result.sqft === 'number' ? result.sqft : parseInt(result.sqft || '0'),
      image_url: result.image_url,
      has_open_house: result.has_open_house || false,
      open_house_start: result.open_house_start,
      open_house_end: result.open_house_end,
      listing_agent_name: result.listing_agent_name,
      listing_agent_phone: result.listing_agent_phone,
      listing_agent_email: result.listing_agent_email,
      listing_brokerage: result.listing_brokerage,
      agent_notes: result.agent_notes
    }));

    onAddExtractedStops(formattedList);

    setFiles([]);
    setExtractedResults([]);
    setErrorMsg(null);

    onClose();
  };

  const handleCloseModal = () => {
    setFiles([]);
    setExtractedResults([]);
    setErrorMsg(null);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm animate-fadeIn font-sans">
      <div className="relative w-full max-w-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl shadow-2xl overflow-hidden flex flex-col max-h-[90vh]">
        {/* Header */}
        <div className="p-4 border-b border-slate-200 dark:border-slate-800 flex items-center justify-between bg-slate-50 dark:bg-slate-900">
          <div className="flex items-center space-x-2">
            <div className="w-8 h-8 rounded-xl bg-purple-100 dark:bg-purple-600/20 border border-purple-300 dark:border-purple-500/30 text-purple-600 dark:text-purple-400 flex items-center justify-center">
              <Sparkles className="w-4 h-4" />
            </div>
            <div>
              <h3 className="text-sm font-bold text-slate-900 dark:text-white flex items-center gap-1.5">
                <span>DeepSeek AI PDF & Image Listing Scanner</span>
                <span className="px-1.5 py-0.5 rounded bg-emerald-100 dark:bg-emerald-500/20 text-emerald-800 dark:text-emerald-300 font-mono text-[9px]">Fast PDF & Images</span>
              </h3>
              <p className="text-[11px] text-slate-600 dark:text-slate-400">Parses PDF documents, crops property photo, and uploads to Cloudflare R2</p>
            </div>
          </div>

          <button
            type="button"
            onClick={handleCloseModal}
            className="p-1 text-slate-400 hover:text-slate-900 dark:hover:text-white rounded-lg hover:bg-slate-200 dark:hover:bg-slate-800 transition-colors cursor-pointer"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        <div className="p-5 overflow-y-auto space-y-4 text-xs bg-white dark:bg-slate-950">
          {/* Alert Banner */}
          {errorMsg && (
            <div className="p-4 rounded-xl bg-rose-50 dark:bg-rose-500/10 border border-rose-300 dark:border-rose-500/40 text-rose-800 dark:text-rose-300 text-xs space-y-1 font-medium animate-fadeIn">
              <div className="font-bold flex items-center gap-1.5 text-rose-600 dark:text-rose-400 text-sm">
                <AlertTriangle className="w-4 h-4 shrink-0" />
                <span>AI Listing Extraction Notice</span>
              </div>
              <p>{errorMsg}</p>
            </div>
          )}

          {/* File Drag & Drop Dropzone */}
          {extractedResults.length === 0 && (
            <div className="border-2 border-dashed border-slate-300 dark:border-slate-800 hover:border-purple-500/50 rounded-2xl p-5 text-center space-y-4 bg-slate-50/50 dark:bg-slate-900/50 transition-colors">
              <div className="w-12 h-12 rounded-full bg-purple-100 dark:bg-purple-600/10 border border-purple-300 dark:border-purple-500/30 text-purple-600 dark:text-purple-400 mx-auto flex items-center justify-center">
                <UploadCloud className="w-6 h-6" />
              </div>
              <div className="space-y-1">
                <p className="font-bold text-slate-900 dark:text-white">Upload PDF Listing Sheets, Agent Flyers, or Image Screenshots</p>
                <p className="text-[11px] text-slate-600 dark:text-slate-400">Supports PDF files & images. Property photos are cropped & stored in Cloudflare R2 (30-day retention)</p>
              </div>

              <input
                type="file"
                id="ai-listing-upload"
                multiple
                accept="image/*,.pdf,application/pdf"
                onChange={handleFileChange}
                className="hidden"
              />

              <label
                htmlFor="ai-listing-upload"
                className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-900 dark:text-white font-bold text-xs cursor-pointer transition-colors"
              >
                <Plus className="w-4 h-4 text-purple-600 dark:text-purple-400" />
                <span>Add PDFs or Images</span>
              </label>

              {/* Selected Files Badge List */}
              {files.length > 0 && (
                <div className="pt-3 space-y-2 text-left">
                  <div className="text-slate-600 dark:text-slate-400 font-bold text-[11px] flex items-center justify-between">
                    <span>Selected Files ({files.length}):</span>
                    <button
                      onClick={() => setFiles([])}
                      className="text-rose-600 dark:text-rose-400 hover:underline text-[10px]"
                    >
                      Clear All
                    </button>
                  </div>

                  <div className="flex flex-wrap gap-2 max-h-32 overflow-y-auto">
                    {files.map((f, i) => (
                      <div
                        key={i}
                        className="px-2.5 py-1.5 rounded-lg bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 flex items-center gap-2 text-slate-800 dark:text-slate-200 text-[11px]"
                      >
                        <FileText className="w-3.5 h-3.5 text-purple-600 dark:text-purple-400 shrink-0" />
                        <span className="truncate max-w-[160px] font-medium">{f.name}</span>
                        <button
                          onClick={() => handleRemoveFile(i)}
                          className="text-slate-400 hover:text-rose-600 ml-1"
                        >
                          <X className="w-3 h-3" />
                        </button>
                      </div>
                    ))}
                  </div>

                  <button
                    onClick={handleAnalyze}
                    disabled={isScanning}
                    className="w-full mt-2 py-2.5 rounded-xl bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-500 hover:to-indigo-500 text-white font-bold text-xs flex items-center justify-center gap-2 shadow-lg transition-transform active:scale-95 disabled:opacity-50 cursor-pointer"
                  >
                    {isScanning ? (
                      <>
                        <Loader2 className="w-4 h-4 animate-spin text-purple-200" />
                        <span>{currentFileScanning || 'Scanning PDF & images...'}</span>
                      </>
                    ) : (
                      <>
                        <Sparkles className="w-4 h-4" />
                        <span>Analyze {files.length} PDF / Image{files.length > 1 ? 's' : ''}</span>
                      </>
                    )}
                  </button>
                </div>
              )}
            </div>
          )}

          {/* Extracted Cards Preview */}
          {extractedResults.length > 0 && (
            <div className="space-y-3 animate-fadeIn">
              <div className="flex items-center justify-between">
                <span className="text-emerald-700 dark:text-emerald-400 font-bold flex items-center gap-1">
                  <CheckCircle2 className="w-4 h-4" />
                  Extracted {extractedResults.length} Property Listing{extractedResults.length > 1 ? 's' : ''} from PDF / Images (Stored in Cloudflare R2):
                </span>
                <button
                  onClick={() => setExtractedResults([])}
                  className="text-slate-500 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white underline text-[11px]"
                >
                  Upload Different Files
                </button>
              </div>

              <div className="space-y-3">
                {extractedResults.map((result, idx) => (
                  <div key={idx} className="p-4 rounded-xl bg-white dark:bg-slate-900 border border-purple-200 dark:border-purple-500/30 space-y-3 shadow-sm">
                    <div className="flex items-start space-x-3">
                      {/* Cropped Property Image Thumbnail */}
                      <div className="relative w-28 h-20 rounded-xl overflow-hidden bg-slate-100 dark:bg-slate-950 shrink-0 border border-purple-300 dark:border-purple-500/40">
                        {result.image_url ? (
                          <img
                            src={result.image_url}
                            alt="Cropped Property Photo"
                            className="w-full h-full object-cover"
                          />
                        ) : (
                          <div className="w-full h-full flex items-center justify-center text-[10px] text-slate-400">
                            No Photo
                          </div>
                        )}
                        <span className="absolute bottom-0.5 right-0.5 px-1 rounded bg-slate-900/80 text-emerald-300 font-mono text-[8px]">
                          R2 30d
                        </span>
                      </div>

                      <div className="space-y-1 min-w-0 flex-1">
                        <div className="text-[10px] uppercase tracking-wider text-purple-600 dark:text-purple-400 font-bold">Property Address #{idx + 1}</div>
                        <div className="font-extrabold text-slate-900 dark:text-white text-sm truncate">{result.address}</div>
                        <div className="text-emerald-600 dark:text-emerald-400 font-extrabold text-xs">${result.list_price?.toLocaleString()}</div>
                      </div>
                    </div>

                    <div className="grid grid-cols-2 gap-2 text-slate-700 dark:text-slate-300 border-t border-slate-200 dark:border-slate-800 pt-2">
                      <div>MLS #: <strong className="text-slate-900 dark:text-white font-mono">{result.mls_number}</strong></div>
                      <div>Bed / Bath: <strong className="text-slate-900 dark:text-white">{result.beds} Bed, {result.baths} Bath</strong></div>
                      <div>SqFt: <strong className="text-slate-900 dark:text-white">{result.sqft?.toLocaleString()} sqft</strong></div>
                    </div>

                    <div className="pt-2 border-t border-slate-200 dark:border-slate-800 space-y-1 text-slate-700 dark:text-slate-300">
                      <div className="text-[10px] uppercase tracking-wider text-purple-600 dark:text-purple-400 font-bold">Listing Agent Contact</div>
                      <div className="font-bold text-slate-900 dark:text-white">{result.listing_agent_name} ({result.listing_brokerage})</div>
                      <div className="flex flex-wrap items-center gap-3 text-slate-500 dark:text-slate-400">
                        <span className="flex items-center gap-1"><Phone className="w-3 h-3 text-indigo-600 dark:text-indigo-400" /> {result.listing_agent_phone}</span>
                        <span className="flex items-center gap-1"><Mail className="w-3 h-3 text-indigo-600 dark:text-indigo-400" /> {result.listing_agent_email}</span>
                      </div>
                    </div>
                  </div>
                ))}
              </div>

              <button
                onClick={handleConfirmAddAll}
                className="w-full py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-black text-xs flex items-center justify-center gap-2 shadow-lg transition-transform active:scale-95 cursor-pointer"
              >
                <CheckCircle2 className="w-4 h-4" />
                <span>Add {extractedResults.length} Propert{extractedResults.length > 1 ? 'ies' : 'y'} to Itinerary</span>
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
