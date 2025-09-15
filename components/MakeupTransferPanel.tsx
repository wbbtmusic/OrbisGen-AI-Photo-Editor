/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
*/

import React, { useState, useEffect, useCallback } from 'react';
import { UploadIcon } from './icons';

interface MakeupTransferPanelProps {
  onApplyMakeupTransfer: (makeupRefImage: File) => void;
  isLoading: boolean;
}

const MakeupTransferPanel: React.FC<MakeupTransferPanelProps> = ({ onApplyMakeupTransfer, isLoading }) => {
  const [makeupRefFile, setMakeupRefFile] = useState<File | null>(null);
  const [preview, setPreview] = useState<string | null>(null);
  const [isDraggingOver, setIsDraggingOver] = useState(false);

  useEffect(() => {
    if (!makeupRefFile) {
      setPreview(null);
      return;
    }
    const objectUrl = URL.createObjectURL(makeupRefFile);
    setPreview(objectUrl);
    return () => URL.revokeObjectURL(objectUrl);
  }, [makeupRefFile]);

  const handleFileChange = (files: FileList | null) => {
    if (files && files.length > 0) {
      setMakeupRefFile(files[0]);
    }
  };

  const handleApply = () => {
    if (makeupRefFile) {
      onApplyMakeupTransfer(makeupRefFile);
    }
  };

  const handleDragEvents = useCallback((e: React.DragEvent<HTMLLabelElement>) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === "dragenter" || e.type === "dragover") {
      setIsDraggingOver(true);
    } else if (e.type === "dragleave") {
      setIsDraggingOver(false);
    }
  }, []);
  
  const handleDrop = useCallback((e: React.DragEvent<HTMLLabelElement>) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDraggingOver(false);
    if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
      setMakeupRefFile(e.dataTransfer.files[0]);
    }
  }, []);

  return (
    <div className="w-full flex flex-col gap-4 animate-fade-in">
      <p className="text-sm text-center text-zinc-400">Upload an image with a makeup style to transfer.</p>
      
      <div className="flex flex-col gap-4">
        <input
            type="file"
            id="makeup-ref-upload"
            className="hidden"
            accept="image/*"
            onChange={(e) => handleFileChange(e.target.files)}
            disabled={isLoading}
        />
        <label
          htmlFor="makeup-ref-upload"
          onDragEnter={handleDragEvents}
          onDragLeave={handleDragEvents}
          onDragOver={handleDragEvents}
          onDrop={handleDrop}
          className={`relative flex flex-col items-center justify-center w-full h-32 rounded-lg border-2 border-dashed transition-colors duration-200 cursor-pointer bg-zinc-800
            ${isDraggingOver ? 'border-blue-500 bg-zinc-700' : 'border-zinc-700 hover:border-zinc-600'}
            ${isLoading ? 'cursor-not-allowed opacity-60' : ''}
            ${preview ? 'border-solid p-1' : ''}
          `}
        >
          {preview ? (
            <>
              <img src={preview} alt="Makeup reference preview" className="absolute inset-1 w-[calc(100%-0.5rem)] h-[calc(100%-0.5rem)] object-contain rounded" />
              <button
                onClick={(e) => {
                  e.preventDefault();
                  e.stopPropagation();
                  setMakeupRefFile(null);
                }}
                className="absolute top-1 right-1 z-10 p-1 bg-black/50 rounded-full text-white hover:bg-black/80 transition-colors"
                aria-label="Remove image"
              >
                <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" /></svg>
              </button>
            </>
          ) : (
            <div className="flex flex-col items-center justify-center text-center text-zinc-400">
              <UploadIcon className="w-8 h-8 mb-2" />
              <span className="text-xs font-semibold">Click to upload</span>
              <span className="text-xs">or drag & drop</span>
            </div>
          )}
        </label>
        
        <button
          onClick={handleApply}
          className="w-full bg-blue-600 text-white font-semibold py-2 px-4 text-sm rounded-xl transition-all shadow-md shadow-blue-600/20 hover:bg-blue-500 hover:shadow-lg hover:shadow-blue-500/40 active:bg-blue-700 disabled:bg-zinc-800 disabled:text-zinc-500 disabled:cursor-not-allowed"
          disabled={isLoading || !makeupRefFile}
        >
          Apply Makeup
        </button>
      </div>

      <p className="text-xs text-center text-zinc-500 mt-1">
        AI will apply the makeup from the reference image onto the person in your main photo.
      </p>
    </div>
  );
};

export default MakeupTransferPanel;