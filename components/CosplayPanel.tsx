/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
*/

import React, { useState, useEffect, useCallback, useRef } from 'react';
import { UploadIcon } from './icons';
import { CosplayOptions } from '../types';
import { fileToDataURL } from '../lib/utils';
import { cn } from '../lib/utils';

interface CosplayPanelProps {
  onGenerateCosplay: () => void;
  isLoading: boolean;
  options: CosplayOptions;
  onOptionsChange: React.Dispatch<React.SetStateAction<CosplayOptions>>;
}

const environmentPresets = [
  { name: 'Sci-Fi Bridge', prompt: 'the command bridge of a futuristic starship overlooking a nebula' },
  { name: 'Enchanted Forest', prompt: 'a magical, enchanted forest at twilight with glowing mushrooms' },
  { name: 'Urban Alley', prompt: 'a gritty, neon-lit urban alley at night' },
  { name: 'Apocalyptic Wastes', prompt: 'a post-apocalyptic wasteland with ruined cityscapes under a dusty sky' },
];

export const cosplayPoses = [
  { name: 'Heroic Stance', prompt: 'Change the subject\'s pose to a confident heroic stance, with hands on hips and chest out, looking powerfully towards the camera.' },
  { name: 'Action Lunge', prompt: 'Change the subject\'s pose to a dynamic action lunge, as if in the middle of a battle or athletic move. The body should be low and tense.' },
  { name: 'Ready for Battle', prompt: 'Change the subject\'s pose to a "ready for battle" stance, holding an appropriate imaginary weapon (like a sword or blaster) if the character uses one. The expression should be determined and focused.' },
  { name: 'Casual Portrait', prompt: 'Change the subject\'s pose to a relaxed, casual portrait stance, slightly turned to the side with a natural, calm expression. This is a calm, character-in-repose look.' },
  { name: 'Iconic Pose', prompt: 'Analyze the provided character and change the subject\'s pose to the character\'s most famous or iconic pose. This is the highest priority pose instruction.' },
  { name: 'Crouching', prompt: 'Change the subject\'s pose to a low crouch, as if hiding or preparing to spring into action.' }
];

const CosplayPanel: React.FC<CosplayPanelProps> = ({ onGenerateCosplay, isLoading, options, onOptionsChange }) => {
  const [preview, setPreview] = useState<string | null>(null);
  const [isDraggingOver, setIsDraggingOver] = useState(false);
  const [isProcessingPreview, setIsProcessingPreview] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (!options.characterRefImage) {
      setPreview(null);
      return;
    }
    setIsProcessingPreview(true);
    let isCancelled = false;
    fileToDataURL(options.characterRefImage).then(dataUrl => {
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
  }, [options.characterRefImage]);
  
   useEffect(() => {
    const handlePaste = (event: ClipboardEvent) => {
        if (isLoading) return;
        const file = event.clipboardData?.files?.[0];
        if (file && file.type.startsWith('image/')) {
            event.preventDefault();
            onOptionsChange(prev => ({ ...prev, characterRefImage: file }));
        }
    };
    document.addEventListener('paste', handlePaste);
    return () => {
        document.removeEventListener('paste', handlePaste);
    };
  }, [isLoading, onOptionsChange]);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      onOptionsChange(prev => ({ ...prev, characterRefImage: file }));
    }
    if (inputRef.current) inputRef.current.value = '';
  };
  
  const handleDragEvents = useCallback((e: React.DragEvent<HTMLLabelElement>) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === "dragenter" || e.type === "dragover") setIsDraggingOver(true);
    else if (e.type === "dragleave") setIsDraggingOver(false);
  }, []);
  
  const handleDrop = useCallback((e: React.DragEvent<HTMLLabelElement>) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDraggingOver(false);
    const file = e.dataTransfer.files?.[0];
    if (file) {
      onOptionsChange(prev => ({ ...prev, characterRefImage: file }));
    }
  }, [onOptionsChange]);

  const handleRemoveFile = useCallback((e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    onOptionsChange(prev => ({ ...prev, characterRefImage: null }));
    if (inputRef.current) inputRef.current.value = '';
  }, [onOptionsChange]);

  const handleApply = () => {
    onGenerateCosplay();
  };

  const handlePresetClick = (prompt: string) => {
    onOptionsChange(prev => ({ ...prev, environmentOption: 'custom', environmentPrompt: prompt }));
  };
  
  const canApply = !isLoading && (options.characterName.trim() || options.characterRefImage);

  return (
    <div className="w-full flex flex-col gap-4 animate-fade-in">
      <p className="text-sm text-center text-zinc-400">
         Transform yourself into any character.
      </p>
      
      <div className="flex flex-col gap-4">
        <fieldset className="border border-zinc-800 rounded-xl p-4 space-y-3">
            <legend className="text-sm font-medium text-zinc-400 px-1">Character Source</legend>
            <textarea
                value={options.characterName}
                onChange={(e) => onOptionsChange({ ...options, characterName: e.target.value })}
                placeholder="e.g., 'Goku from Dragon Ball'"
                className="flex-grow bg-zinc-800 border border-zinc-700 text-zinc-100 rounded-lg p-2 text-sm focus:ring-1 focus:ring-blue-500 focus:outline-none transition w-full disabled:cursor-not-allowed disabled:opacity-60"
                rows={2}
                disabled={isLoading}
            />
            
            <p className="text-xs text-center text-zinc-500 -my-1">OR</p>
        
            <input
                ref={inputRef}
                type="file"
                id="character-ref-upload"
                className="hidden"
                accept="image/*"
                onChange={handleFileChange}
                disabled={isLoading}
            />
            <label
              htmlFor="character-ref-upload"
              onDragEnter={handleDragEvents}
              onDragLeave={handleDragEvents}
              onDragOver={handleDragEvents}
              onDrop={handleDrop}
              className={cn('relative flex flex-col items-center justify-center w-full h-24 rounded-lg border-2 border-dashed transition-colors duration-200 cursor-pointer bg-zinc-900',
                isDraggingOver ? 'border-blue-500 bg-zinc-800' : 'border-zinc-700 hover:border-zinc-600',
                isLoading ? 'cursor-not-allowed opacity-60' : '',
                preview ? 'border-solid p-1' : ''
              )}
            >
              {preview && !isProcessingPreview && (
                <>
                  <img src={preview} alt="Character reference preview" className="absolute inset-1 w-[calc(100%-0.5rem)] h-[calc(100%-0.5rem)] object-contain rounded" />
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
                    <svg className="animate-spin h-5 w-5" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24"><circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle><path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path></svg>
                 </div>
              )}
              {!options.characterRefImage && !isProcessingPreview && (
                <div className="flex flex-col items-center justify-center text-center text-zinc-400">
                  <UploadIcon className="w-6 h-6 mb-1" />
                  <span className="text-xs font-semibold">Upload Character Image</span>
                </div>
              )}
            </label>
        </fieldset>
        
        <fieldset className="border border-zinc-800 rounded-xl p-4 space-y-3">
          <legend className="text-sm font-medium text-zinc-400 px-1">Transfer Options</legend>
          <div className="grid grid-cols-3 gap-2">
            <div className="flex items-center gap-2 p-2 bg-zinc-800 rounded-lg">
              <input type="checkbox" id="transfer-hair" checked={options.transferHair} onChange={(e) => onOptionsChange({ ...options, transferHair: e.target.checked })} disabled={isLoading} className="w-4 h-4 accent-blue-500" />
              <label htmlFor="transfer-hair" className="text-xs text-zinc-300">Hair</label>
            </div>
            <div className="flex items-center gap-2 p-2 bg-zinc-800 rounded-lg">
              <input type="checkbox" id="transfer-clothing" checked={options.transferClothing} onChange={(e) => onOptionsChange({ ...options, transferClothing: e.target.checked })} disabled={isLoading} className="w-4 h-4 accent-blue-500" />
              <label htmlFor="transfer-clothing" className="text-xs text-zinc-300">Clothing</label>
            </div>
            <div className="flex items-center gap-2 p-2 bg-zinc-800 rounded-lg">
              <input type="checkbox" id="transfer-equipment" checked={options.transferEquipment} onChange={(e) => onOptionsChange({ ...options, transferEquipment: e.target.checked })} disabled={isLoading} className="w-4 h-4 accent-blue-500" />
              <label htmlFor="transfer-equipment" className="text-xs text-zinc-300">Equipment</label>
            </div>
          </div>
        </fieldset>

        <fieldset className="border border-zinc-800 rounded-xl p-4 space-y-3">
            <legend className="text-sm font-medium text-zinc-400 px-1">Pose</legend>
            
            <div className="flex items-start gap-3 p-3 rounded-lg bg-zinc-900/50">
                <input 
                    type="checkbox" 
                    id="preserve-original-pose-checkbox" 
                    checked={options.preserveOriginalPose}
                    onChange={(e) => onOptionsChange({ ...options, preserveOriginalPose: e.target.checked, copyPose: false })}
                    disabled={isLoading}
                    className="w-4 h-4 accent-blue-500 mt-0.5 flex-shrink-0"
                />
                <label htmlFor="preserve-original-pose-checkbox" className="text-xs text-zinc-300">
                    <span className="font-bold">Preserve Original Pose.</span> Overrides all other pose settings below.
                </label>
            </div>

            <div className="flex items-start gap-3 p-3 rounded-lg bg-zinc-900/50">
                <input 
                    type="checkbox" 
                    id="copy-pose-checkbox" 
                    checked={options.copyPose}
                    onChange={(e) => onOptionsChange({ ...options, copyPose: e.target.checked })}
                    disabled={isLoading || !options.characterRefImage || options.preserveOriginalPose}
                    className="w-4 h-4 accent-blue-500 mt-0.5 flex-shrink-0"
                />
                <label htmlFor="copy-pose-checkbox" className={cn("text-xs text-zinc-300", (!options.characterRefImage || options.preserveOriginalPose) && "text-zinc-500")}>
                    <span className="font-bold">Copy Pose from Reference.</span> Overrides manual selection below. Requires a reference image.
                </label>
            </div>
            <div className={cn("grid grid-cols-2 gap-2", (options.copyPose || options.preserveOriginalPose) && "opacity-50 pointer-events-none")}>
                {cosplayPoses.map(pose => (
                    <button
                        key={pose.name}
                        onClick={() => onOptionsChange({ ...options, pose: pose.prompt })}
                        disabled={isLoading || options.copyPose || options.preserveOriginalPose}
                        className={cn(
                            'w-full text-center font-semibold py-3 px-2 rounded-lg transition-colors duration-200 ease-in-out hover:bg-zinc-700 active:scale-95 text-xs disabled:opacity-50',
                            options.pose === pose.prompt && !options.copyPose && !options.preserveOriginalPose ? 'bg-zinc-200 text-black' : 'bg-zinc-800 text-zinc-200'
                        )}
                    >
                        {pose.name}
                    </button>
                ))}
            </div>
        </fieldset>
        
        <fieldset className="border border-zinc-800 rounded-xl p-4 space-y-3">
            <legend className="text-sm font-medium text-zinc-400 px-1">Environment</legend>
            <div className="grid grid-cols-3 gap-2">
                {(['original', 'auto', 'custom'] as const).map(opt => (
                    <button key={opt} onClick={() => onOptionsChange({ ...options, environmentOption: opt })} disabled={isLoading} className={cn('px-2 py-1.5 rounded-lg text-xs font-semibold capitalize transition-colors disabled:opacity-50', options.environmentOption === opt ? 'bg-zinc-200 text-black' : 'bg-zinc-800 hover:bg-zinc-700 text-zinc-200')}>
                        {opt === 'original' ? 'Keep Original' : opt === 'auto' ? 'Auto-Match' : 'Custom'}
                    </button>
                ))}
            </div>

            {options.environmentOption === 'custom' && (
                <div className="flex flex-col gap-3 pt-2">
                    <textarea
                        value={options.environmentPrompt}
                        onChange={(e) => onOptionsChange({ ...options, environmentPrompt: e.target.value })}
                        placeholder="e.g., 'a futuristic city', 'a mystical forest'"
                        className="flex-grow bg-zinc-800 border border-zinc-700 text-zinc-100 rounded-lg p-2 text-sm focus:ring-1 focus:ring-blue-500 focus:outline-none transition w-full disabled:cursor-not-allowed disabled:opacity-60"
                        rows={2}
                        disabled={isLoading}
                    />
                    <div className="grid grid-cols-2 gap-2">
                        {environmentPresets.map(preset => (
                            <button key={preset.name} onClick={() => handlePresetClick(preset.prompt)} disabled={isLoading} className="w-full text-center font-semibold py-2 px-2 rounded-lg transition-colors duration-200 ease-in-out bg-zinc-800 hover:bg-zinc-700 active:scale-95 text-xs disabled:opacity-50 disabled:cursor-not-allowed">
                                {preset.name}
                            </button>
                        ))}
                    </div>
                </div>
            )}
        </fieldset>

         <fieldset className="border border-zinc-800 rounded-xl p-4 space-y-2">
            <legend className="text-sm font-medium text-zinc-400 px-1">Output Settings</legend>
            <label htmlFor="outputs-slider" className="text-xs font-medium text-zinc-400">
                Number of Images: <span className="font-bold text-white">{options.numberOfOutputs}</span>
            </label>
            <input
                id="outputs-slider"
                type="range" min="1" max="4" step="1"
                value={options.numberOfOutputs}
                onChange={(e) => onOptionsChange({...options, numberOfOutputs: parseInt(e.target.value)})}
                className="w-full h-2 bg-zinc-700 rounded-lg appearance-none cursor-pointer accent-blue-500"
                disabled={isLoading}
            />
        </fieldset>
        
        <button
          onClick={handleApply}
          className="w-full bg-blue-600 text-white font-semibold py-2 px-4 text-sm rounded-xl transition-all shadow-md shadow-blue-600/20 hover:bg-blue-500 hover:shadow-lg hover:shadow-blue-500/40 active:bg-blue-700 disabled:bg-zinc-800 disabled:text-zinc-500 disabled:cursor-not-allowed"
          disabled={!canApply}
        >
          {`Generate ${options.numberOfOutputs} Image(s)`}
        </button>
        <p className="text-xs text-center text-zinc-500 mt-2 px-2">
            <span className="font-bold">Pro Tip:</span> For best results, use a high-quality, real-life cosplay photo as your character reference image.
        </p>
      </div>
    </div>
  );
};

export default CosplayPanel;