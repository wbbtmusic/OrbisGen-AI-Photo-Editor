/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
*/
import React, { useState, useEffect, useCallback, useRef } from 'react';
import { UploadIcon } from './icons';
import { AddPersonOptions } from '../types';
import { fileToDataURL } from '../lib/utils';


interface AddPersonControlsProps {
  onOptionsChange: (options: { person: Partial<AddPersonOptions>, posePrompt: string }) => void;
  disabled: boolean;
}

const AddPersonControls: React.FC<AddPersonControlsProps> = ({ onOptionsChange, disabled }) => {
  const [personRefImage, setPersonRefImage] = useState<File | null>(null);
  const [prompt, setPrompt] = useState('');
  const [posePrompt, setPosePrompt] = useState('');
  const [preview, setPreview] = useState<string | null>(null);
  const [isDraggingOver, setIsDraggingOver] = useState(false);
  const [isProcessingPreview, setIsProcessingPreview] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    onOptionsChange({
      person: {
        prompt,
        personRefImage,
      },
      posePrompt,
    });
  }, [prompt, personRefImage, posePrompt, onOptionsChange]);

  useEffect(() => {
    if (!personRefImage) {
      setPreview(null);
      return;
    }
    setIsProcessingPreview(true);
    let isCancelled = false;
    fileToDataURL(personRefImage).then(dataUrl => {
      if (!isCancelled) {
        setPreview(dataUrl);
        setIsProcessingPreview(false);
      }
    }).catch(() => {
        if (!isCancelled) {
          setIsProcessingPreview(false);
        }
    });
    return () => { isCancelled = true; };
  }, [personRefImage]);
  
  useEffect(() => {
    const handlePaste = (event: ClipboardEvent) => {
        if(disabled) return;
        const file = event.clipboardData?.files?.[0];
        if (file && file.type.startsWith('image/')) {
            event.preventDefault();
            setPersonRefImage(file);
        }
    };
    document.addEventListener('paste', handlePaste);
    return () => {
        document.removeEventListener('paste', handlePaste);
    };
  }, [disabled]);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (inputRef.current) {
        inputRef.current.blur();
    }
    if (file) {
      requestAnimationFrame(() => {
        setPersonRefImage(file);
      });
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
      requestAnimationFrame(() => {
        setPersonRefImage(file);
      });
    }
  }, []);

  const handleRemoveFile = useCallback((e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    requestAnimationFrame(() => {
      setPersonRefImage(null);
    });
    if (inputRef.current) {
      inputRef.current.value = '';
    }
  }, []);

  return (
    <div className="w-full flex flex-col gap-4 border border-zinc-700 rounded-lg p-3 bg-zinc-800/50">
      <div className="space-y-3">
        <textarea
            value={prompt}
            onChange={(e) => setPrompt(e.target.value)}
            placeholder="Describe person (e.g., 'a man with a beard')"
            className="flex-grow bg-zinc-800 border border-zinc-700 text-zinc-100 rounded-lg p-2 text-sm focus:ring-1 focus:ring-yellow-400 focus:outline-none transition w-full disabled:cursor-not-allowed disabled:opacity-60"
            rows={2}
            disabled={disabled}
        />
        
        <p className="text-xs text-center text-zinc-500 -my-1">OR (Optional)</p>
    
        <input
            ref={inputRef}
            type="file"
            id="person-ref-upload-controls"
            className="hidden"
            accept="image/*"
            onChange={handleFileChange}
            disabled={disabled}
        />
        <label
          htmlFor="person-ref-upload-controls"
          onDragEnter={handleDragEvents}
          onDragLeave={handleDragEvents}
          onDragOver={handleDragEvents}
          onDrop={handleDrop}
          className={`relative flex flex-col items-center justify-center w-full h-24 rounded-lg border-2 border-dashed transition-colors duration-200 cursor-pointer bg-zinc-800
            ${isDraggingOver ? 'border-yellow-400 bg-zinc-700' : 'border-zinc-700 hover:border-zinc-600'}
            ${disabled ? 'cursor-not-allowed opacity-60' : ''}
            ${preview ? 'border-solid p-1' : ''}
          `}
        >
          {preview && !isProcessingPreview && (
            <>
              <img src={preview} alt="Person reference preview" className="absolute inset-1 w-[calc(100%-0.5rem)] h-[calc(100%-0.5rem)] object-contain rounded" />
              <button
                onClick={handleRemoveFile}
                className="absolute top-1 right-1 z-10 p-1 bg-black/50 rounded-full text-white hover:bg-black/80 transition-colors"
                aria-label="Remove image"
              >
                <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" /></svg>
              </button>
            </>
          )}
          {isProcessingPreview && (
            <div className="flex flex-col items-center justify-center text-center text-zinc-400">
                <svg className="animate-spin h-5 w-5" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                </svg>
            </div>
          )}
          {!personRefImage && !isProcessingPreview && (
            <div className="flex flex-col items-center justify-center text-center text-zinc-400">
              <UploadIcon className="w-6 h-6 mb-1" />
              <span className="text-xs font-semibold">Upload / Paste Reference</span>
            </div>
          )}
        </label>
        <textarea
            value={posePrompt}
            onChange={(e) => setPosePrompt(e.target.value)}
            placeholder="Describe pose & action (e.g. 'waving')"
            className="flex-grow bg-zinc-800 border border-zinc-700 text-zinc-100 rounded-lg p-2 text-sm focus:ring-1 focus:ring-yellow-400 focus:outline-none transition w-full disabled:cursor-not-allowed disabled:opacity-60"
            rows={2}
            disabled={disabled}
        />
      </div>
    </div>
  );
};

export default AddPersonControls;