/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
*/

import React, { useState, useRef, useCallback, useEffect } from 'react';
import { UploadIcon } from './icons';

interface ProjectorPanelProps {
  onApply: (patternFile: File, scale: number, strength: number, prompt: string) => void;
  isLoading: boolean;
  hasSelection: boolean;
}

const ProjectorPanel: React.FC<ProjectorPanelProps> = ({ onApply, isLoading, hasSelection }) => {
  const [patternFile, setPatternFile] = useState<File | null>(null);
  const [isDraggingOver, setIsDraggingOver] = useState(false);
  const [scale, setScale] = useState(100);
  const [strength, setStrength] = useState(100);
  const [prompt, setPrompt] = useState('');
  const inputRef = useRef<HTMLInputElement>(null);
  
  useEffect(() => {
    const handlePaste = (event: ClipboardEvent) => {
        if (isLoading) return;
        const file = event.clipboardData?.files?.[0];
        if (file && file.type.startsWith('image/')) {
            event.preventDefault();
            setPatternFile(file);
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
      setPatternFile(file);
    }
  };

  const handleApply = () => {
    if (patternFile) {
      onApply(patternFile, scale, strength, prompt);
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
      setPatternFile(file);
    }
  }, []);

  const handleRemoveFile = useCallback((e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setPatternFile(null);
    if (inputRef.current) {
      inputRef.current.value = '';
    }
  }, []);

  return (
    <div className="w-full flex flex-col gap-4 animate-fade-in">
      <p className="text-sm text-center text-zinc-400">
        {hasSelection ? 'Upload a pattern to project.' : 'Select an area on the image to project a pattern onto.'}
      </p>
      
      <div className="flex flex-col gap-4">
        <input
            ref={inputRef}
            type="file"
            id="pattern-upload"
            className="hidden"
            accept="image/*"
            onChange={handleFileChange}
            disabled={isLoading || !hasSelection}
        />
        <label
          htmlFor="pattern-upload"
          onDragEnter={handleDragEvents}
          onDragLeave={handleDragEvents}
          onDragOver={handleDragEvents}
          onDrop={handleDrop}
          className={`relative w-full h-32 rounded-lg border-2 border-dashed transition-colors duration-200 cursor-pointer bg-zinc-800
            ${!hasSelection ? 'cursor-not-allowed opacity-50' : ''}
            ${isDraggingOver ? 'border-blue-500 bg-zinc-700' : 'border-zinc-700 hover:border-zinc-600'}
            ${isLoading ? 'cursor-not-allowed opacity-60' : ''}
            ${patternFile ? 'border-solid' : ''}
          `}
        >
          {patternFile ? (
            <div className="flex flex-col items-center justify-center text-center text-zinc-400 w-full h-full p-2">
                <img src={URL.createObjectURL(patternFile)} alt="Pattern preview" className="absolute inset-1 w-[calc(100%-0.5rem)] h-[calc(100%-0.5rem)] object-contain rounded-md" />
                <button
                    onClick={handleRemoveFile}
                    className="absolute top-1 right-1 z-10 p-1 bg-black/50 rounded-full text-white hover:bg-black/80 transition-colors"
                    aria-label="Remove pattern"
                >
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" /></svg>
                </button>
            </div>
          ) : (
            <div className="flex flex-col items-center justify-center text-center text-zinc-400 w-full h-full">
              <UploadIcon className="w-8 h-8 mb-2" />
              <span className="text-xs font-semibold">Upload Pattern</span>
              <span className="text-xs">or drag & drop / paste</span>
            </div>
          )}
        </label>

        <div className="flex flex-col gap-2">
            <label htmlFor="projector-prompt" className="text-xs font-medium text-zinc-400">
                Describe the Pattern (Optional)
            </label>
            <input
                id="projector-prompt"
                type="text"
                value={prompt}
                onChange={(e) => setPrompt(e.target.value)}
                placeholder="e.g., 'a brick wall texture', 'glowing embers'"
                className="flex-grow bg-zinc-800 border border-zinc-700 text-zinc-100 rounded-lg p-2 text-sm focus:ring-1 focus:ring-blue-500 focus:outline-none transition w-full disabled:cursor-not-allowed disabled:opacity-60"
                disabled={isLoading || !hasSelection}
            />
        </div>

        <div className="flex flex-col gap-2">
          <label htmlFor="scale-slider" className="text-xs font-medium text-zinc-400">Pattern Scale: {scale}%</label>
          <input
            id="scale-slider"
            type="range"
            min="25"
            max="200"
            step="1"
            value={scale}
            onChange={(e) => setScale(Number(e.target.value))}
            className="w-full h-2 bg-zinc-700 rounded-lg appearance-none cursor-pointer accent-blue-500"
            disabled={isLoading || !hasSelection}
          />
        </div>

        <div className="flex flex-col gap-2">
          <label htmlFor="strength-slider" className="text-xs font-medium text-zinc-400">Effect Strength: {strength}%</label>
          <input
            id="strength-slider"
            type="range"
            min="10"
            max="100"
            step="1"
            value={strength}
            onChange={(e) => setStrength(Number(e.target.value))}
            className="w-full h-2 bg-zinc-700 rounded-lg appearance-none cursor-pointer accent-blue-500"
            disabled={isLoading || !hasSelection}
          />
        </div>
        
        <button
          onClick={handleApply}
          className="w-full bg-blue-600 text-white font-semibold py-2 px-4 text-sm rounded-xl transition-all shadow-md shadow-blue-600/20 hover:bg-blue-500 hover:shadow-lg hover:shadow-blue-500/40 active:bg-blue-700 disabled:bg-zinc-800 disabled:text-zinc-500 disabled:cursor-not-allowed"
          disabled={isLoading || !patternFile || !hasSelection}
        >
          Apply Projection
        </button>
      </div>

      <p className="text-xs text-center text-zinc-500 mt-1">
        AI will wrap the pattern around the selected object, matching perspective and lighting.
      </p>
    </div>
  );
};

export default ProjectorPanel;
