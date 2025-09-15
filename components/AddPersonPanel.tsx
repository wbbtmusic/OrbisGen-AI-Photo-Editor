/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
*/

import React, { useState, useEffect, useCallback, useRef } from 'react';
import { UploadIcon } from './icons';
import { AddPersonOptions } from '../types';
import { fileToDataURL } from '../lib/utils';

interface AddPersonPanelProps {
  onApplyAddPerson: (options: AddPersonOptions) => void;
  isLoading: boolean;
}

const familiarityOptions: { label: string; value: string }[] = [
    { label: 'Stranger', value: `Pose the person as a stranger, maintaining a polite and respectful distance. CRITICAL: The main subject's expression and clothing MUST be perfectly preserved.` },
    { label: 'With a Celebrity', value: `Pose the person as if taking a photo with a celebrity. The pose should be friendly but respectful, like a fan meet-and-greet photo, often side-by-side with a small gap or a professional arm-around-the-shoulder pose. CRITICAL: The main subject's expression and clothing MUST be perfectly preserved. The main subject's facial symmetry and identity must not be altered.` },
    { label: 'Casual Friend', value: `Pose the person as a casual friend, standing comfortably side-by-side at a natural, relaxed distance. CRITICAL: The main subject's expression and clothing MUST be perfectly preserved.` },
    { label: 'Close Friend', value: `Pose the person as a close friend, showing comfortable camaraderie like a gentle arm around the shoulder or standing very close. CRITICAL: The main subject's expression and clothing MUST be perfectly preserved.` },
    { label: 'Best Friend', value: `Pose the person as a best friend, with a very close, comfortable, and fun interaction. This could involve a tight side hug, leaning heads together, making funny faces, or a playful gesture. The interaction should feel genuine and deeply familiar. CRITICAL: The main subject's expression and clothing MUST be perfectly preserved. The main subject's facial symmetry and identity must not be altered.` },
    { label: 'Family Member', value: `Pose the person as a family member, with a warm, relaxed, and physically close connection. CRITICAL: The main subject's expression and clothing MUST be perfectly preserved.` },
    { label: 'Casual Couple', value: `Pose the person as a romantic couple in a casual, relaxed way, standing close together, perhaps with a head resting on a shoulder or a hand on an arm. CRITICAL: The main subject's expression and clothing MUST be perfectly preserved.` },
    { label: 'Partner (Romantic)', value: `Pose the person as a romantic partner, with clear intimacy like a gentle embrace, holding hands, or looking affectionately at each other. CRITICAL: The main subject's expression and clothing MUST be perfectly preserved.` },
    { label: 'Hugging', value: `Pose the person giving a full, warm, and genuine hug. CRITICAL: The main subject's expression and clothing MUST be perfectly preserved.` },
    { label: 'Side Hug', value: `Pose the person giving a friendly side hug, with one arm around the other person. CRITICAL: The main subject's expression and clothing MUST be perfectly preserved.` },
    { label: 'Playful', value: `Pose the person being playful, using a lighthearted gesture like making a peace sign. CRITICAL: The main subject's expression and clothing MUST be perfectly preserved.` },
    { label: 'Back-to-Back', value: `Pose the person standing back-to-back in a cool or confident way. CRITICAL: The main subject's expression and clothing MUST be perfectly preserved.` },
    { label: 'Gaming (Gamepad)', value: `Pose the person playing a video game with a controller, focused and engaged with a screen that is out of frame. CRITICAL: The main subject's expression and clothing MUST be perfectly preserved.` },
    { label: 'Gaming (PC)', value: `Pose the person playing a PC game, one using a keyboard and the other a mouse, focused on a screen that is out of frame. CRITICAL: The main subject's expression and clothing MUST be perfectly preserved.` },
    { label: 'Just Kissing', value: `Pose the person sharing a gentle and affectionate kiss on the cheek or lips. CRITICAL: The main subject's expression and clothing MUST be perfectly preserved.` },
];

const AddPersonPanel: React.FC<AddPersonPanelProps> = ({ onApplyAddPerson, isLoading }) => {
  const [personRefImage, setPersonRefImage] = useState<File | null>(null);
  const [prompt, setPrompt] = useState('');
  const [placement, setPlacement] = useState<AddPersonOptions['placement']>('center');
  const [familiarity, setFamiliarity] = useState<string>(familiarityOptions[0].value);
  const [gazeDirection, setGazeDirection] = useState<AddPersonOptions['gazeDirection']>('looking at camera');
  const [faceDirection, setFaceDirection] = useState<AddPersonOptions['faceDirection']>('facing camera');
  const [preview, setPreview] = useState<string | null>(null);
  const [isDraggingOver, setIsDraggingOver] = useState(false);
  const [preserveMainSubjectPose, setPreserveMainSubjectPose] = useState(true);
  const [isProcessingPreview, setIsProcessingPreview] = useState(false);
  
  const [style, setStyle] = useState<AddPersonOptions['style']>('normal');
  const [posePrompt, setPosePrompt] = useState('');
  const [lightingMatch, setLightingMatch] = useState<AddPersonOptions['lightingMatch']>('match');
  const inputRef = useRef<HTMLInputElement>(null);

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

  const handleApply = () => {
    if (prompt.trim() || personRefImage || style === 'surprise') {
      onApplyAddPerson({ 
        prompt: prompt,
        personRefImage: personRefImage, 
        placement, 
        familiarity,
        gazeDirection,
        faceDirection,
        preserveMainSubjectPose,
        style,
        posePrompt,
        lightingMatch,
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


  const canApply = !isLoading && ((prompt.trim() || personRefImage) || style === 'surprise');

  return (
    <div className="w-full flex flex-col gap-4 animate-fade-in">
      <p className="text-sm text-center text-zinc-400">
         Describe the person to add, or upload an image.
      </p>
      
      <div className="flex flex-col gap-4">
        {style !== 'surprise' && (
          <fieldset className="border border-zinc-800 rounded-xl p-4 space-y-3">
            <legend className="text-sm font-medium text-zinc-400 px-1">Person Source</legend>
            <textarea
                value={prompt}
                onChange={(e) => setPrompt(e.target.value)}
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
              {!personRefImage && !isProcessingPreview && (
                <div className="flex flex-col items-center justify-center text-center text-zinc-400">
                  <UploadIcon className="w-6 h-6 mb-1" />
                  <span className="text-xs font-semibold">Upload Reference Image</span>
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
                        onClick={() => setStyle(s)} 
                        disabled={isLoading}
                        className={`px-2 py-1.5 rounded-lg text-xs font-semibold capitalize transition-colors disabled:opacity-50 ${style === s ? 'bg-zinc-200 text-black' : 'bg-zinc-800 hover:bg-zinc-700 text-zinc-200'}`}
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
                        <button key={p} onClick={() => setPlacement(p)} disabled={isLoading} className={`px-2 py-1.5 rounded-lg text-xs font-semibold capitalize transition-colors disabled:opacity-50 ${placement === p ? 'bg-zinc-200 text-black' : 'bg-zinc-800 hover:bg-zinc-700 text-zinc-200'}`}>{p}</button>
                    ))}
                </div>
            </div>

            <div className='flex flex-col gap-2'>
                <label className="text-xs font-medium text-zinc-400">Interaction / Relationship</label>
                 <select disabled={isLoading} value={familiarity} onChange={(e) => setFamiliarity(e.target.value)} className="bg-zinc-800 border border-zinc-700 text-white text-sm rounded-lg px-2 py-1.5 focus:outline-none focus:ring-1 focus:ring-blue-500 disabled:opacity-50">
                    {familiarityOptions.map(opt => (
                      <option key={opt.value} value={opt.value}>{opt.label}</option>
                    ))}
                </select>
            </div>
            
            <div className='flex flex-col gap-2'>
                <label className="text-xs font-medium text-zinc-400">Gaze Direction</label>
                <div className="grid grid-cols-2 gap-2">
                    <button onClick={() => setGazeDirection('looking at camera')} disabled={isLoading} className={`px-2 py-1.5 rounded-lg text-xs font-semibold capitalize transition-colors disabled:opacity-50 ${gazeDirection === 'looking at camera' ? 'bg-zinc-200 text-black' : 'bg-zinc-800 hover:bg-zinc-700 text-zinc-200'}`}>At Camera</button>
                    <button onClick={() => setGazeDirection('looking away from camera')} disabled={isLoading} className={`px-2 py-1.5 rounded-lg text-xs font-semibold capitalize transition-colors disabled:opacity-50 ${gazeDirection === 'looking away from camera' ? 'bg-zinc-200 text-black' : 'bg-zinc-800 hover:bg-zinc-700 text-zinc-200'}`}>Away</button>
                </div>
            </div>

            <div className='flex flex-col gap-2'>
                <label className="text-xs font-medium text-zinc-400">Face Direction</label>
                <div className="grid grid-cols-3 gap-2">
                    <button onClick={() => setFaceDirection('facing camera')} disabled={isLoading} className={`px-2 py-1.5 rounded-lg text-xs font-semibold capitalize transition-colors disabled:opacity-50 ${faceDirection === 'facing camera' ? 'bg-zinc-200 text-black' : 'bg-zinc-800 hover:bg-zinc-700 text-zinc-200'}`}>Camera</button>
                    <button onClick={() => setFaceDirection('facing main subject')} disabled={isLoading} className={`px-2 py-1.5 rounded-lg text-xs font-semibold capitalize transition-colors disabled:opacity-50 ${faceDirection === 'facing main subject' ? 'bg-zinc-200 text-black' : 'bg-zinc-800 hover:bg-zinc-700 text-zinc-200'}`}>Subject</button>
                    <button onClick={() => setFaceDirection('facing away')} disabled={isLoading} className={`px-2 py-1.5 rounded-lg text-xs font-semibold capitalize transition-colors disabled:opacity-50 ${faceDirection === 'facing away' ? 'bg-zinc-200 text-black' : 'bg-zinc-800 hover:bg-zinc-700 text-zinc-200'}`}>Away</button>
                </div>
            </div>
            
             <div className='flex flex-col gap-2'>
                <label className="text-xs font-medium text-zinc-400">Lighting Integration</label>
                <div className="grid grid-cols-2 gap-2">
                    <button 
                        onClick={() => setLightingMatch('match')} 
                        disabled={isLoading}
                        className={`px-2 py-1.5 rounded-lg text-xs font-semibold capitalize transition-colors disabled:opacity-50 ${lightingMatch === 'match' ? 'bg-zinc-200 text-black' : 'bg-zinc-800 hover:bg-zinc-700 text-zinc-200'}`}
                    >
                        Match Lighting
                    </button>
                    <button 
                        onClick={() => setLightingMatch('keep')} 
                        disabled={isLoading}
                        className={`px-2 py-1.5 rounded-lg text-xs font-semibold capitalize transition-colors disabled:opacity-50 ${lightingMatch === 'keep' ? 'bg-zinc-200 text-black' : 'bg-zinc-800 hover:bg-zinc-700 text-zinc-200'}`}
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
                        checked={preserveMainSubjectPose}
                        onChange={(e) => setPreserveMainSubjectPose(e.target.checked)}
                        disabled={isLoading}
                        className="w-4 h-4 accent-blue-500 mt-0.5 flex-shrink-0"
                    />
                    <label htmlFor="preserve-pose-checkbox" className="text-xs text-zinc-300">
                        <span className="font-bold">Preserve Pose of Main Subject.</span> When checked, prevents the AI from changing the person already in your photo. Uncheck to allow minor adjustments for more natural interactions.
                    </label>
                </div>
                <label className="text-xs font-medium text-zinc-400">Pose & Interaction Prompt</label>
                <textarea
                    value={posePrompt}
                    onChange={(e) => setPosePrompt(e.target.value)}
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
