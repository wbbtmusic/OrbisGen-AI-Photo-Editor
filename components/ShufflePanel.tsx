/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
*/
import React, { useState, useRef, useCallback, useEffect } from 'react';
import { UploadIcon } from './icons';

interface ShufflePanelProps {
  onApplyShuffle: (influenceImage: File) => void;
  isLoading: boolean;
}

const ShufflePanel: React.FC<ShufflePanelProps> = ({ onApplyShuffle, isLoading }) => {
  const [influenceFile, setInfluenceFile] = useState<File | null>(null);
  const [isDraggingOver, setIsDraggingOver] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);
  
  useEffect(() => {
    const handlePaste = (event: ClipboardEvent) => {
        if (isLoading) return;
        const file = event.clipboardData?.files?.[0];
        if (file && file.type.startsWith('image/')) {
            event.preventDefault();
            setInfluenceFile(file);
        }
    };
    document.addEventListener('paste', handlePaste);
    return () => {
        document.removeEventListener('paste', handlePaste);
    };
  }, [isLoading]);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setInfluenceFile(file);
    }
    if (inputRef.current) {
        inputRef.current.value = '';
    }
  };

  const handleApply = () => {
    if (influenceFile) {
      onApplyShuffle(influenceFile);
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
    const file = e.dataTransfer.files?.[0];
    if (file) {
      setInfluenceFile(file);
    }
  }, []);

  const handleRemoveFile = useCallback((e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setInfluenceFile(null);
    if (inputRef.current) {
      inputRef.current.value = '';
    }
  }, []);

  return (
    <div className="w-full flex flex-col gap-4 animate-fade-in">
      <p className="text-sm text-center text-zinc-400">Upload an 'influence' image to shuffle its style with your photo.</p>
      
      <div className="flex flex-col gap-4">
        <input
            ref={inputRef}
            type="file"
            id="influence-upload"
            className="hidden"
            accept="image/*"
            onChange={handleFileChange}
            disabled={isLoading}
        />
        <label
          htmlFor="influence-upload"
          onDragEnter={handleDragEvents}
          onDragLeave={handleDragEvents}
          onDragOver={handleDragEvents}
          onDrop={handleDrop}
          className={`relative w-full h-32 rounded-lg border-2 border-dashed transition-colors duration-200 cursor-pointer bg-zinc-800
            ${isDraggingOver ? 'border-blue-500 bg-zinc-700' : 'border-zinc-700 hover:border-zinc-600'}
            ${isLoading ? 'cursor-not-allowed opacity-60' : ''}
            ${influenceFile ? 'border-solid p-1' : ''}
          `}
        >
          {influenceFile ? (
            <div className="relative w-full h-full">
                <img src={URL.createObjectURL(influenceFile)} alt="Influence preview" className="w-full h-full object-contain rounded-md" />
                <button
                    onClick={handleRemoveFile}
                    className="absolute top-1 right-1 z-10 p-1 bg-black/50 rounded-full text-white hover:bg-black/80 transition-colors"
                    aria-label="Remove influence image"
                >
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" /></svg>
                </button>
            </div>
          ) : (
            <div className="flex flex-col items-center justify-center text-center text-zinc-400 w-full h-full">
              <UploadIcon className="w-8 h-8 mb-2" />
              <span className="text-xs font-semibold">Upload Influence Image</span>
              <span className="text-xs">or drag & drop / paste</span>
            </div>
          )}
        </label>
        
        <button
          onClick={handleApply}
          className="w-full bg-blue-600 text-white font-semibold py-2 px-4 text-sm rounded-xl transition-all shadow-md shadow-blue-600/20 hover:bg-blue-500 hover:shadow-lg hover:shadow-blue-500/40 active:bg-blue-700 disabled:bg-zinc-800 disabled:text-zinc-500 disabled:cursor-not-allowed"
          disabled={isLoading || !influenceFile}
        >
          Shuffle Images
        </button>
      </div>

      <p className="text-xs text-center text-zinc-500 mt-1">
        AI will blend the style, colors, and mood of the influence image with your main photo while preserving the original subject.
      </p>
    </div>
  );
};

export default ShufflePanel;