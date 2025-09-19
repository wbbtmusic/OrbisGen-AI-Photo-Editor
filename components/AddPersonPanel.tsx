/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
*/

import React, { useState, useEffect, useCallback, useRef } from 'react';
import { UploadIcon } from './icons';
import { AddPersonOptions } from '../types';
import { fileToDataURL } from '../lib/utils';

interface AddPersonPanelProps {
  onApplyAddPerson: () => void;
  isLoading: boolean;
  options: AddPersonOptions;
  onOptionsChange: React.Dispatch<React.SetStateAction<AddPersonOptions>>;
}

const familiarityOptions: { label: string; value: string }[] = [
    { label: 'Stranger', value: `Pose the person as a background individual or stranger in the scene, maintaining a natural and respectful distance. They should not be interacting directly with the main subject. CRITICAL: The main subject's core characteristics MUST be preserved.` },
    { label: 'With a Celebrity', value: `Pose the person for a classic "fan photo" with a celebrity. The pose should be friendly but respectful (e.g., side-by-side, professional arm-around-shoulder). This is for a planned photo opportunity, not a candid interaction. CRITICAL: The main subject's core characteristics MUST be perfectly preserved.` },
    { label: 'Casual Friend', value: `Pose the person as a casual friend, standing comfortably side-by-side at a natural, relaxed distance. The interaction should be friendly and authentic, but not overly intimate. CRITICAL: The main subject's core characteristics MUST be perfectly preserved.` },
    { label: 'Close Friend', value: `Pose the person as a close friend, showing comfortable and familiar camaraderie, such as a gentle arm around the shoulder, standing very close, or sharing a laugh. The connection should feel genuine. CRITICAL: The main subject's core characteristics MUST be perfectly preserved.` },
    { label: 'Best Friend', value: `Pose the person as a best friend, with a very close, comfortable, and fun interaction. This could involve a tight side hug, leaning heads together, making funny faces, or a playful gesture. The interaction should feel deeply familiar. CRITICAL: The main subject's core characteristics MUST be perfectly preserved.` },
    { label: 'Family Member', value: `Pose the person as a family member, with a warm, relaxed, and physically close connection that signifies a familial bond. CRITICAL: The main subject's core characteristics MUST be perfectly preserved.` },
    { label: 'Casual Couple', value: `Pose the person as a romantic couple in a casual, relaxed way. They should be standing close together, perhaps with a head resting on a shoulder or a hand on an arm, showing subtle affection. CRITICAL: The main subject's core characteristics MUST be perfectly preserved.` },
    { label: 'Partner (Romantic)', value: `Pose the person as a romantic partner, with clear intimacy and affection, such as a gentle embrace, holding hands, or looking lovingly at each other. CRITICAL: The main subject's core characteristics MUST be perfectly preserved.` },
    { label: 'Hugging', value: `Pose the person giving a full, warm, and genuine hug. The embrace should look natural and convey a strong sense of connection. CRITICAL: The main subject's core characteristics MUST be perfectly preserved.` },
    { label: 'Side Hug', value: `Pose the person giving a friendly side hug, with one arm around the other person's shoulder or waist. The pose should be casual and friendly. CRITICAL: The main subject's core characteristics MUST be perfectly preserved.` },
    { label: 'Playful', value: `Pose the person being playful, using a lighthearted gesture like making a peace sign, sticking their tongue out, or another fun, non-verbal interaction. CRITICAL: The main subject's core characteristics MUST be perfectly preserved.` },
    { label: 'Back-to-Back', value: `Pose the person standing back-to-back with the main subject, often with arms crossed, in a cool, confident, or playful manner. CRITICAL: The main subject's core characteristics MUST be perfectly preserved.` },
    { label: 'Gaming (Gamepad)', value: `Pose the person playing a video game with a controller, focused and engaged with a screen that is out of frame. Their posture should reflect concentration on the game. CRITICAL: The main subject's core characteristics MUST be perfectly preserved.` },
    { label: 'Gaming (PC)', value: `Pose the person playing a PC game, with one hand on a keyboard and the other on a mouse, focused on a screen that is out of frame. Their posture should be typical of a PC gamer. CRITICAL: The main subject's core characteristics MUST be perfectly preserved.` },
    { label: 'Just Kissing', value: `Pose the person sharing a gentle and affectionate kiss on the cheek or lips. The interaction should be sweet and intimate. CRITICAL: The main subject's core characteristics MUST be perfectly preserved.` },
];


const AddPersonPanel: React.FC<AddPersonPanelProps> = ({ onApplyAddPerson, isLoading, options, onOptionsChange }) => {
  const [preview, setPreview] = useState<string | null>(null);
  const [isDraggingOver, setIsDraggingOver] = useState(false);
  const [isProcessingPreview, setIsProcessingPreview] = useState(false);
  
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (!options.personRefImage) {
      setPreview(null);
      return;
    }
    setIsProcessingPreview(true);
    let isCancelled = false;
    fileToDataURL(options.personRefImage).then(dataUrl => {
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
  }, [options.personRefImage]);
  
  useEffect(() => {
    const handlePaste = (event: ClipboardEvent) => {
        if (isLoading) return;
        const file = event.clipboardData?.files?.[0];
        if (file && file.type.startsWith('image/')) {
            event.preventDefault();
            onOptionsChange(prevOptions => ({ ...prevOptions, personRefImage: file }));
        }
    };
    document.addEventListener('paste', handlePaste);
    return () => {
        document.removeEventListener('paste', handlePaste);
    };
  }, [isLoading, onOptionsChange]);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (inputRef.current) {
        inputRef.current.blur();
    }
    if (file) {
        requestAnimationFrame(() => {
            onOptionsChange({ ...options, personRefImage: file });
        });
    }
  };

  const handleApply = () => {
    if (options.prompt.trim() || options.personRefImage || options.style === 'surprise') {
      onApplyAddPerson();
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
            onOptionsChange({ ...options, personRefImage: file });
        });
    }
  }, [options, onOptionsChange]);

  const handleRemoveFile = useCallback((e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    requestAnimationFrame(() => {
        onOptionsChange({ ...options, personRefImage: null });
    });
    if (inputRef.current) {
        inputRef.current.value = '';
    }
  }, [options, onOptionsChange]);


  const canApply = !isLoading && ((options.prompt.trim() || options.personRefImage) || options.style === 'surprise');

  return (
    <div className="w-full flex flex-col gap-4 animate-fade-in">
      <p className="text-sm text-center text-zinc-400">
         Describe the person to add, or upload an image.
      </p>
      
      <div className="flex flex-col gap-4">
        {options.style !== 'surprise' && (
          <fieldset className="border border-zinc-800 rounded-xl p-4 space-y-3">
            <legend className="text-sm font-medium text-zinc-400 px-1">Person Source</legend>
            <textarea
                value={options.prompt}
                onChange={(e) => onOptionsChange({ ...options, prompt: e.target.value })}
                placeholder="e.g., 'a smiling woman with blonde hair'"
                className="flex-grow bg-zinc-800 border border-zinc-700 text-zinc-100 rounded-lg p-2 text-sm focus:ring-1 focus:ring-blue-500 focus:outline-none transition w-full disabled:cursor-not-allowed disabled:opacity-60"
                rows={2}
                disabled={isLoading}
            />
            
            <p className="text-xs text-center text-zinc-500 -my-1">OR (Optional)</p>
        
            <input
                ref={inputRef}
                type="file"
                id="person-ref-upload"
                className="hidden"
                accept="image/*"
                onChange={handleFileChange}
                disabled={isLoading}
            />
            <label
              htmlFor="person-ref-upload"
              onDragEnter={handleDragEvents}
              onDragLeave={handleDragEvents}
              onDragOver={handleDragEvents}
              onDrop={handleDrop}
              className={`relative flex flex-col items-center justify-center w-full h-24 rounded-lg border-2 border-dashed transition-colors duration-200 cursor-pointer bg-zinc-900
                ${isDraggingOver ? 'border-blue-500 bg-zinc-800' : 'border-zinc-700 hover:border-zinc-600'}
                ${isLoading ? 'cursor-not-allowed opacity-60' : ''}
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
              {!options.personRefImage && !isProcessingPreview && (
                <div className="flex flex-col items-center justify-center text-center text-zinc-400">
                  <UploadIcon className="w-6 h-6 mb-1" />
                  <span className="text-xs font-semibold">Upload / Paste Reference</span>
                </div>
              )}
            </label>
          </fieldset>
        )}
        
        <fieldset className="border border-zinc-800 rounded-xl p-4">
            <legend className="text-sm font-medium text-zinc-400 px-1">Generation Style</legend>
            <div className="grid grid-cols-3 gap-2">
                {(['normal', 'realistic', 'surprise'] as const).map(s => (
                    <button 
                        key={s} 
                        onClick={() => onOptionsChange({ ...options, style: s })} 
                        disabled={isLoading}
                        className={`px-2 py-1.5 rounded-lg text-xs font-semibold capitalize transition-colors disabled:opacity-50 ${options.style === s ? 'bg-zinc-200 text-black' : 'bg-zinc-800 hover:bg-zinc-700 text-zinc-200'}`}
                    >
                        {s}
                    </button>
                ))}
            </div>
        </fieldset>
        
        <fieldset className="border border-zinc-800 rounded-xl p-4 space-y-4">
            <legend className="text-sm font-medium text-zinc-400 px-1">Details & Pose</legend>

            <div className='flex flex-col gap-2'>
                <label className="text-xs font-medium text-zinc-400">Placement</label>
                <div className="grid grid-cols-3 gap-2">
                    {(['left', 'center', 'right'] as const).map(p => (
                        <button key={p} onClick={() => onOptionsChange({ ...options, placement: p })} disabled={isLoading} className={`px-2 py-1.5 rounded-lg text-xs font-semibold capitalize transition-colors disabled:opacity-50 ${options.placement === p ? 'bg-zinc-200 text-black' : 'bg-zinc-800 hover:bg-zinc-700 text-zinc-200'}`}>{p}</button>
                    ))}
                </div>
            </div>

            <div className='flex flex-col gap-2'>
                <label className="text-xs font-medium text-zinc-400">Interaction / Relationship</label>
                 <select disabled={isLoading} value={options.familiarity} onChange={(e) => onOptionsChange({ ...options, familiarity: e.target.value })} className="bg-zinc-800 border border-zinc-700 text-white text-sm rounded-lg px-2 py-1.5 focus:outline-none focus:ring-1 focus:ring-blue-500 disabled:opacity-50">
                    {familiarityOptions.map(opt => (
                      <option key={opt.value} value={opt.value}>{opt.label}</option>
                    ))}
                </select>
            </div>
            
            <div className='flex flex-col gap-2'>
                <label className="text-xs font-medium text-zinc-400">Gaze Direction</label>
                <div className="grid grid-cols-2 gap-2">
                    <button onClick={() => onOptionsChange({ ...options, gazeDirection: 'looking at camera' })} disabled={isLoading} className={`px-2 py-1.5 rounded-lg text-xs font-semibold capitalize transition-colors disabled:opacity-50 ${options.gazeDirection === 'looking at camera' ? 'bg-zinc-200 text-black' : 'bg-zinc-800 hover:bg-zinc-700 text-zinc-200'}`}>At Camera</button>
                    <button onClick={() => onOptionsChange({ ...options, gazeDirection: 'looking away from camera' })} disabled={isLoading} className={`px-2 py-1.5 rounded-lg text-xs font-semibold capitalize transition-colors disabled:opacity-50 ${options.gazeDirection === 'looking away from camera' ? 'bg-zinc-200 text-black' : 'bg-zinc-800 hover:bg-zinc-700 text-zinc-200'}`}>Away</button>
                </div>
            </div>

            <div className='flex flex-col gap-2'>
                <label className="text-xs font-medium text-zinc-400">Face Direction</label>
                <div className="grid grid-cols-3 gap-2">
                    <button onClick={() => onOptionsChange({ ...options, faceDirection: 'facing camera' })} disabled={isLoading} className={`px-2 py-1.5 rounded-lg text-xs font-semibold capitalize transition-colors disabled:opacity-50 ${options.faceDirection === 'facing camera' ? 'bg-zinc-200 text-black' : 'bg-zinc-800 hover:bg-zinc-700 text-zinc-200'}`}>Camera</button>
                    <button onClick={() => onOptionsChange({ ...options, faceDirection: 'facing main subject' })} disabled={isLoading} className={`px-2 py-1.5 rounded-lg text-xs font-semibold capitalize transition-colors disabled:opacity-50 ${options.faceDirection === 'facing main subject' ? 'bg-zinc-200 text-black' : 'bg-zinc-800 hover:bg-zinc-700 text-zinc-200'}`}>Subject</button>
                    <button onClick={() => onOptionsChange({ ...options, faceDirection: 'facing away' })} disabled={isLoading} className={`px-2 py-1.5 rounded-lg text-xs font-semibold capitalize transition-colors disabled:opacity-50 ${options.faceDirection === 'facing away' ? 'bg-zinc-200 text-black' : 'bg-zinc-800 hover:bg-zinc-700 text-zinc-200'}`}>Away</button>
                </div>
            </div>
            
             <div className='flex flex-col gap-2'>
                <label className="text-xs font-medium text-zinc-400">Lighting Integration</label>
                <div className="grid grid-cols-2 gap-2">
                    <button 
                        onClick={() => onOptionsChange({ ...options, lightingMatch: 'match' })} 
                        disabled={isLoading}
                        className={`px-2 py-1.5 rounded-lg text-xs font-semibold capitalize transition-colors disabled:opacity-50 ${options.lightingMatch === 'match' ? 'bg-zinc-200 text-black' : 'bg-zinc-800 hover:bg-zinc-700 text-zinc-200'}`}
                    >
                        Match Lighting
                    </button>
                    <button 
                        onClick={() => onOptionsChange({ ...options, lightingMatch: 'keep' })} 
                        disabled={isLoading}
                        className={`px-2 py-1.5 rounded-lg text-xs font-semibold capitalize transition-colors disabled:opacity-50 ${options.lightingMatch === 'keep' ? 'bg-zinc-200 text-black' : 'bg-zinc-800 hover:bg-zinc-700 text-zinc-200'}`}
                    >
                        Keep Original
                    </button>
                </div>
            </div>

            <div className='flex flex-col gap-3'>
                <div className="flex items-start gap-3 p-3 rounded-lg bg-zinc-900/50">
                    <input 
                        type="checkbox" 
                        id="preserve-pose-checkbox" 
                        checked={options.preserveMainSubjectPose}
                        onChange={(e) => onOptionsChange({ ...options, preserveMainSubjectPose: e.target.checked })}
                        disabled={isLoading}
                        className="w-4 h-4 accent-blue-500 mt-0.5 flex-shrink-0"
                    />
                    <label htmlFor="preserve-pose-checkbox" className="text-xs text-zinc-300">
                        <span className="font-bold">Preserve Pose of Main Subject.</span> When checked, prevents the AI from changing the person already in your photo. Uncheck to allow minor adjustments for more natural interactions.
                    </label>
                </div>
                <label className="text-xs font-medium text-zinc-400">Pose & Interaction Prompt</label>
                <textarea
                    value={options.posePrompt}
                    onChange={(e) => onOptionsChange({ ...options, posePrompt: e.target.value })}
                    placeholder="e.g., 'waving at the camera', 'laughing together'"
                    className="flex-grow bg-zinc-800 border border-zinc-700 text-zinc-100 rounded-lg p-2 text-sm focus:ring-1 focus:ring-blue-500 focus:outline-none transition w-full disabled:cursor-not-allowed disabled:opacity-60"
                    rows={2}
                    disabled={isLoading}
                />
            </div>
        </fieldset>

        <button
          onClick={handleApply}
          className="w-full bg-blue-600 text-white font-semibold py-2 px-4 text-sm rounded-xl transition-all shadow-md shadow-blue-600/20 hover:bg-blue-500 hover:shadow-lg hover:shadow-blue-500/40 active:bg-blue-700 disabled:bg-zinc-800 disabled:text-zinc-500 disabled:cursor-not-allowed"
          disabled={!canApply}
        >
          Add Person
        </button>
      </div>

      <p className="text-xs text-center text-zinc-500 mt-1">
        AI will add the person, matching lighting and perspective. The canvas may expand to fit them.
      </p>
    </div>
  );
};

export default AddPersonPanel;