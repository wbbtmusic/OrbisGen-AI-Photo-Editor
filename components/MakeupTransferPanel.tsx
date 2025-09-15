/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
*/

import React, { useState, useRef, useCallback } from 'react';
import { UploadIcon } from './icons';

interface MakeupTransferPanelProps {
  onApplyMakeupTransfer: (makeupRefImage: File) => void;
  isLoading: boolean;
}

const MakeupTransferPanel: React.FC<MakeupTransferPanelProps> = ({ onApplyMakeupTransfer, isLoading }) => {
  const [makeupRefFile, setMakeupRefFile] = useState<File | null>(null);
  const [isDraggingOver, setIsDraggingOver] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (inputRef.current) {
        inputRef.current.blur();
    }
    if (file) {
      requestAnimationFrame(() => {
        setMakeupRefFile(file);
      });
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
    const file = e.dataTransfer.files?.[0];
    if (file) {
      requestAnimationFrame(() => {
        setMakeupRefFile(file);
      });
    }
  }, []);

  const handleRemoveFile = useCallback((e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    requestAnimationFrame(() => {
      setMakeupRefFile(null);
    });
    if (inputRef.current) {
      inputRef.current.value = '';
    }
  }, []);

  return (
    <div className="w-full flex flex-col gap-4 animate-fade-in">
      <p className="text-sm text-center text-zinc-400">Upload an image with a makeup style to transfer.</p>
      
      <div className="flex flex-col gap-4">
        <input
            ref={inputRef}
            type="file"
            id="makeup-ref-upload"
            className="hidden"
            accept="image/*"
            onChange={handleFileChange}
            disabled={isLoading}
        />
        <label
          htmlFor="makeup-ref-upload"
          onDragEnter={handleDragEvents}
          onDragLeave={handleDragEvents}
          onDragOver={handleDragEvents}
          onDrop={handleDrop}
          className={`relative w-full h-32 rounded-lg border-2 border-dashed transition-colors duration-200 cursor-pointer bg-zinc-800
            ${isDraggingOver ? 'border-blue-500 bg-zinc-700' : 'border-zinc-700 hover:border-zinc-600'}
            ${isLoading ? 'cursor-not-allowed opacity-60' : ''}
            ${makeupRefFile ? 'border-solid' : ''}
          `}
        >
          {makeupRefFile ? (
            <div className="flex flex-col items-center justify-center text-center text-zinc-400 w-full h-full p-2">
                <p className="text-sm font-semibold text-zinc-200 truncate w-full px-2" title={makeupRefFile.name}>{makeupRefFile.name}</p>
                <button
                    onClick={handleRemoveFile}
                    className="mt-2 text-xs text-red-400 hover:text-red-300"
                    aria-label="Remove file"
                >
                    Remove
                </button>
            </div>
          ) : (
            <div className="flex flex-col items-center justify-center text-center text-zinc-400 w-full h-full">
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
