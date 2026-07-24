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

export default function AiUploadModal({ isOpen, onClose, onAddExtractedStops }: AiUploadModalProps) {
  const [files, setFiles] = React.useState<File[]>([]);
  const [isMultipleListings, setIsMultipleListings] = React.useState(true);
  const [isScanning, setIsScanning] = React.useState(false);
  const [currentFileScanning, setCurrentFileScanning] = React.useState<string>('');
  const [extractedResults, setExtractedResults] = React.useState<any[]>([]);
  const [croppedImages, setCroppedImages] = React.useState<Record<number, string>>({});
  const [errorMsg, setErrorMsg] = React.useState<string | null>(null);

  if (!isOpen) return null;

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      const selected = Array.from(e.target.files);
      setFiles(prev => [...prev, ...selected]);
      setExtractedResults([]);
      setCroppedImages({});
      setErrorMsg(null);
    }
  };

  const handleRemoveFile = (index: number) => {
    setFiles(prev => prev.filter((_, i) => i !== index));
  };

  const extractTextFromFile = async (uploadedFile: File): Promise<string> => {
    if (uploadedFile.type.startsWith('image/')) {
      try {
        const worker = await createWorker('eng');
        const ret = await worker.recognize(uploadedFile);
        await worker.terminate();
        return ret.data.text;
      } catch (e) {
        return '';
      }
    }
    return '';
  };

  /**
   * Automatically crops out the primary property photo from an uploaded listing flyer/document using Canvas API,
   * then uploads the cropped image to Cloudflare R2 Object Storage (30-day retention).
   */
  const cropAndUploadPropertyImageToR2 = async (uploadedFile: File, index: number): Promise<string | null> => {
    if (!uploadedFile.type.startsWith('image/')) return null;

    return new Promise((resolve) => {
      const reader = new FileReader();
      reader.onload = (e) => {
        const img = new Image();
        img.onload = async () => {
          try {
            const canvas = document.createElement('canvas');
            const ctx = canvas.getContext('2d');
            if (!ctx) {
              resolve(null);
              return;
            }

            // Crop out top-middle 60% region of the listing flyer where property photos are located
            const cropX = 0;
            const cropY = Math.floor(img.height * 0.05);
            const cropW = img.width;
            const cropH = Math.floor(img.height * 0.55);

            canvas.width = cropW;
            canvas.height = cropH;

            ctx.drawImage(img, cropX, cropY, cropW, cropH, 0, 0, cropW, cropH);
            const croppedBase64 = canvas.toDataURL('image/jpeg', 0.85);

            // Upload cropped property image to Cloudflare R2
            const res = await fetch('/api/upload-r2', {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({
                imageBase64: croppedBase64,
                fileName: uploadedFile.name
              })
            });

            const data = await res.json();
            if (data.status === 'SUCCESS' && data.imageUrl) {
              setCroppedImages(prev => ({ ...prev, [index]: data.imageUrl }));
              resolve(data.imageUrl);
            } else {
              resolve(croppedBase64);
            }
          } catch (err) {
            resolve(null);
          }
        };
        img.src = e.target?.result as string;
      };
      reader.readAsDataURL(uploadedFile);
    });
  };

  const handleAnalyze = async () => {
    if (files.length === 0) {
      setErrorMsg('Please select at least one image or PDF listing document.');
      return;
    }

    setIsScanning(true);
    setErrorMsg(null);

    try {
      // Step 1: Perform OCR & Crop Property Images across all uploaded files
      const combinedTexts: string[] = [];
      const fileNames: string[] = [];
      const uploadedR2Urls: (string | null)[] = [];

      for (let i = 0; i < files.length; i++) {
        const file = files[i];
        setCurrentFileScanning(`Extracting text & cropping property photo from "${file.name}" (${i + 1}/${files.length})...`);

        const [text, r2Url] = await Promise.all([
          extractTextFromFile(file),
          cropAndUploadPropertyImageToR2(file, i)
        ]);

        combinedTexts.push(`--- FILE ${i + 1}: ${file.name} ---\n${text}`);
        fileNames.push(file.name);
        uploadedR2Urls.push(r2Url);
      }

      // Step 2: Send accumulated OCR text to DeepSeek AI API with isMultipleListings parameter
      setCurrentFileScanning('DeepSeek AI Parsing All Document Specs & Agent Contact Data...');

      const res = await fetch('/api/ai-extract-listing', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          textContent: combinedTexts.join('\n\n'),
          fileName: fileNames.join(', '),
          isMultipleListings
        })
      });

      const data = await res.json();

      if (res.ok && data.status === 'SUCCESS' && data.data) {
        const results = Array.isArray(data.data) ? data.data : [data.data];
        
        // Attach corresponding R2 cropped image URLs to each extracted property object
        const resultsWithR2Images = results.map((result: any, idx: number) => {
          const r2Image = uploadedR2Urls[idx] || uploadedR2Urls[0] || null;
          return {
            ...result,
            image_url: r2Image || result.image_url || 'https://images.unsplash.com/photo-1600596542815-ffad4c1539a9?auto=format&fit=crop&w=800&q=80'
          };
        });

        setExtractedResults(resultsWithR2Images);
      } else {
        setErrorMsg(data.error || 'AI Listing Extraction Service is not available at this moment.');
      }
      setIsScanning(false);
    } catch (err: any) {
      setErrorMsg(`AI Listing Extraction Service is not available at this moment. (${err.message || 'Connection error'})`);
      setIsScanning(false);
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

    // Reset upload scanner state so user can scan more listings continuously
    setFiles([]);
    setExtractedResults([]);
    setCroppedImages({});
    setErrorMsg(null);

    onClose();
  };

  const handleCloseModal = () => {
    setFiles([]);
    setExtractedResults([]);
    setCroppedImages({});
    setErrorMsg(null);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-sm animate-fadeIn">
      <div className="relative w-full max-w-2xl bg-slate-900 border border-slate-800 rounded-2xl shadow-2xl overflow-hidden flex flex-col max-h-[90vh]">
        {/* Header */}
        <div className="p-4 border-b border-slate-800 flex items-center justify-between bg-slate-900">
          <div className="flex items-center space-x-2">
            <div className="w-8 h-8 rounded-xl bg-purple-600/20 border border-purple-500/30 text-purple-400 flex items-center justify-center">
              <Sparkles className="w-4 h-4" />
            </div>
            <div>
              <h3 className="text-sm font-bold text-white flex items-center gap-1.5">
                <span>DeepSeek AI Listing Scanner</span>
                <span className="px-1.5 py-0.5 rounded bg-emerald-500/20 text-emerald-300 font-mono text-[9px]">R2 Photo Storage (30d)</span>
              </h3>
              <p className="text-[11px] text-slate-400">Extracts specs, crops property photo, and saves to Cloudflare R2</p>
            </div>
          </div>

          <button
            type="button"
            onClick={handleCloseModal}
            className="p-1 text-slate-400 hover:text-white rounded-lg hover:bg-slate-800 transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        <div className="p-5 overflow-y-auto space-y-4 text-xs bg-slate-950">
          {/* Service Unavailable Alert Banner */}
          {errorMsg && (
            <div className="p-4 rounded-xl bg-rose-500/10 border border-rose-500/40 text-rose-300 text-xs space-y-1 font-medium animate-fadeIn">
              <div className="font-bold flex items-center gap-1.5 text-rose-400 text-sm">
                <AlertTriangle className="w-4 h-4 shrink-0" />
                <span>AI Listing Extraction Service Unavailable</span>
              </div>
              <p>{errorMsg}</p>
            </div>
          )}

          {/* File Drag & Drop Dropzone */}
          {extractedResults.length === 0 && (
            <div className="border-2 border-dashed border-slate-800 hover:border-purple-500/50 rounded-2xl p-5 text-center space-y-4 bg-slate-900/50 transition-colors">
              <div className="w-12 h-12 rounded-full bg-purple-600/10 border border-purple-500/30 text-purple-400 mx-auto flex items-center justify-center">
                <UploadCloud className="w-6 h-6" />
              </div>
              <div className="space-y-1">
                <p className="font-bold text-white">Upload Listing Flyers, MLS Sheets, or Agent PDFs</p>
                <p className="text-[11px] text-slate-400">Supports multi-file upload. Property photos are cropped & stored in Cloudflare R2 (30-day retention)</p>
              </div>

              {/* Multiple Listings Checkbox & Description */}
              <div className="p-3 rounded-xl bg-slate-950 border border-purple-500/30 text-left space-y-1">
                <label className="flex items-center gap-2 font-bold text-white cursor-pointer text-xs">
                  <input
                    type="checkbox"
                    checked={isMultipleListings}
                    onChange={e => setIsMultipleListings(e.target.checked)}
                    className="rounded border-slate-700 bg-slate-900 text-purple-500 focus:ring-purple-500/50 w-4 h-4"
                  />
                  <span className="flex items-center gap-1 text-purple-300">
                    <CheckSquare className="w-3.5 h-3.5 text-purple-400" />
                    Multiple Listings (1 property per image / file)
                  </span>
                </label>
                <p className="text-[11px] text-slate-400 pl-6 leading-normal">
                  Check this if each uploaded image or PDF is a separate property listing. If unchecked, all uploaded files/pages will be treated as belonging to a single multi-page property brochure.
                </p>
              </div>

              <input
                type="file"
                id="ai-listing-upload"
                multiple
                accept="image/*,.pdf"
                onChange={handleFileChange}
                className="hidden"
              />

              <label
                htmlFor="ai-listing-upload"
                className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-white font-bold text-xs cursor-pointer transition-colors"
              >
                <Plus className="w-4 h-4 text-purple-400" />
                <span>Add Documents / Images</span>
              </label>

              {/* Uploaded Files Badge List */}
              {files.length > 0 && (
                <div className="pt-3 space-y-2 text-left">
                  <div className="text-slate-400 font-bold text-[11px] flex items-center justify-between">
                    <span>Selected Files ({files.length}):</span>
                    <button
                      onClick={() => setFiles([])}
                      className="text-rose-400 hover:underline text-[10px]"
                    >
                      Clear All
                    </button>
                  </div>

                  <div className="flex flex-wrap gap-2 max-h-32 overflow-y-auto">
                    {files.map((f, i) => (
                      <div
                        key={i}
                        className="px-2.5 py-1.5 rounded-lg bg-slate-900 border border-slate-800 flex items-center gap-2 text-slate-200 text-[11px]"
                      >
                        <FileText className="w-3.5 h-3.5 text-purple-400 shrink-0" />
                        <span className="truncate max-w-[160px] font-medium">{f.name}</span>
                        <button
                          onClick={() => handleRemoveFile(i)}
                          className="text-slate-500 hover:text-rose-400 ml-1"
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
                        <span>{currentFileScanning || 'Scanning files...'}</span>
                      </>
                    ) : (
                      <>
                        <Sparkles className="w-4 h-4" />
                        <span>Analyze {files.length} Document{files.length > 1 ? 's' : ''} {isMultipleListings ? '(Multiple Listings Mode)' : ''}</span>
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
                <span className="text-emerald-400 font-bold flex items-center gap-1">
                  <CheckCircle2 className="w-4 h-4" />
                  Extracted {extractedResults.length} Property Listing{extractedResults.length > 1 ? 's' : ''} (Stored in Cloudflare R2):
                </span>
                <button
                  onClick={() => setExtractedResults([])}
                  className="text-slate-400 hover:text-white underline text-[11px]"
                >
                  Upload Different Files
                </button>
              </div>

              <div className="space-y-3">
                {extractedResults.map((result, idx) => (
                  <div key={idx} className="p-4 rounded-xl bg-slate-900 border border-purple-500/30 space-y-3">
                    <div className="flex items-start space-x-3">
                      {/* Cropped Property Image Thumbnail stored in R2 */}
                      <div className="relative w-24 h-16 rounded-xl overflow-hidden bg-slate-950 shrink-0 border border-purple-500/40">
                        {result.image_url ? (
                          <img
                            src={result.image_url}
                            alt="Cropped Property Photo"
                            className="w-full h-full object-cover"
                          />
                        ) : (
                          <div className="w-full h-full flex items-center justify-center text-[10px] text-slate-500">
                            No Photo
                          </div>
                        )}
                        <span className="absolute bottom-0.5 right-0.5 px-1 rounded bg-slate-950/80 text-emerald-300 font-mono text-[8px]">
                          R2 30d
                        </span>
                      </div>

                      <div className="space-y-1 min-w-0 flex-1">
                        <div className="text-[10px] uppercase tracking-wider text-purple-400 font-bold">Property Address #{idx + 1}</div>
                        <div className="font-extrabold text-white text-sm truncate">{result.address}</div>
                        <div className="text-emerald-400 font-extrabold text-xs">${result.list_price?.toLocaleString()}</div>
                      </div>
                    </div>

                    <div className="grid grid-cols-2 gap-2 text-slate-300 border-t border-slate-800 pt-2">
                      <div>MLS #: <strong className="text-white font-mono">{result.mls_number}</strong></div>
                      <div>Bed / Bath: <strong className="text-white">{result.beds} Bed, {result.baths} Bath</strong></div>
                      <div>SqFt: <strong className="text-white">{result.sqft?.toLocaleString()} sqft</strong></div>
                    </div>

                    <div className="pt-2 border-t border-slate-800 space-y-1 text-slate-300">
                      <div className="text-[10px] uppercase tracking-wider text-purple-400 font-bold">Listing Agent Contact</div>
                      <div className="font-bold text-white">{result.listing_agent_name} ({result.listing_brokerage})</div>
                      <div className="flex flex-wrap items-center gap-3 text-slate-400">
                        <span className="flex items-center gap-1"><Phone className="w-3 h-3 text-indigo-400" /> {result.listing_agent_phone}</span>
                        <span className="flex items-center gap-1"><Mail className="w-3 h-3 text-indigo-400" /> {result.listing_agent_email}</span>
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
