/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
*/
import React, { useState, useEffect, useCallback } from 'react';
import { UploadIcon } from './icons';
import { AddPersonOptions } from '../types';

interface AddPersonControlsProps {
  onOptionsChange: (options: Partial<AddPersonOptions>) => void;
  disabled: boolean;
}

const AddPersonControls: React.FC<AddPersonControlsProps> = ({ onOptionsChange, disabled }) => {
  const [personRefImage, setPersonRefImage] = useState<File | null>(null);
  const [prompt, setPrompt] = useState('');
  const [placement, setPlacement] = useState<AddPersonOptions['placement']>('center');
  const [familiarity, setFamiliarity] = useState<string>('Pose the person to be standing naturally and respectfully within the scene.');
  const [gazeDirection, setGazeDirection] = useState<AddPersonOptions['gazeDirection']>('looking at camera');
  const [faceDirection, setFaceDirection] = useState<AddPersonOptions['faceDirection']>('facing camera');
  const [preview, setPreview] = useState<string | null>(null);
  const [isDraggingOver, setIsDraggingOver] = useState(false);

  useEffect(() => {
    onOptionsChange({
      prompt,
      personRefImage,
      placement,
      familiarity,
      gazeDirection,
      faceDirection,
    });
  }, [prompt, personRefImage, placement, familiarity, gazeDirection, faceDirection, onOptionsChange]);

  useEffect(() => {
    if (!personRefImage) {
      setPreview(null);
      return;
    }
    const objectUrl = URL.createObjectURL(personRefImage);
    setPreview(objectUrl);
    return () => URL.revokeObjectURL(objectUrl);
  }, [personRefImage]);

  const handleFileChange = (files: FileList | null) => {
    if (files && files.length > 0) {
      setPersonRefImage(files[0]);
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
      setPersonRefImage(e.dataTransfer.files[0]);
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
            type="file"
            id="person-ref-upload-controls"
            className="hidden"
            accept="image/*"
            onChange={(e) => handleFileChange(e.target.files)}
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
          {preview ? (
            <>
              <img src={preview} alt="Person reference preview" className="absolute inset-1 w-[calc(100%-0.5rem)] h-[calc(100%-0.5rem)] object-contain rounded" />
              <button
                onClick={(e) => {
                  e.preventDefault();
                  e.stopPropagation();
                  setPersonRefImage(null);
                }}
                className="absolute top-1 right-1 z-10 p-1 bg-black/50 rounded-full text-white hover:bg-black/80 transition-colors"
                aria-label="Remove image"
              >
                <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" /></svg>
              </button>
            </>
          ) : (
            <div className="flex flex-col items-center justify-center text-center text-zinc-400">
              <UploadIcon className="w-6 h-6 mb-1" />
              <span className="text-xs font-semibold">Upload Reference Image</span>
            </div>
          )}
        </label>
      </div>
    </div>
  );
};

export default AddPersonControls;