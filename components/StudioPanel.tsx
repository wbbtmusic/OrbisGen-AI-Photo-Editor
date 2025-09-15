/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
*/

import React, { useState } from 'react';
import AiSuggestions from './AiSuggestions';

interface StudioPanelProps {
  onApplyStudioEffect: (prompt: string) => void;
  isLoading: boolean;
}

const StudioPanel: React.FC<StudioPanelProps> = ({ onApplyStudioEffect, isLoading }) => {
  const [customPrompt, setCustomPrompt] = useState('');

  const presets = [
    { name: 'Add Soft Shadow', prompt: 'Analyze the lighting on the main subject and add a soft, realistic drop shadow on the surface beneath it, consistent with the existing light source.' },
    { name: 'Place on Marble', prompt: 'Realistically place the main subject on a clean, white marble surface. Adjust lighting and add subtle reflections to match the new surface.' },
    { name: 'White Backdrop', prompt: 'Place the main subject against a seamless, professional, clean white studio backdrop with perfect, even lighting.' },
    { name: 'Clean Reflections', prompt: 'Subtly remove distracting reflections from glossy surfaces on the main subject, such as glasses or product packaging, while maintaining a realistic look.' },
    { name: 'Reflective Floor', prompt: 'Place the main subject on a highly polished, dark, reflective surface, creating a clear mirror image below it.' },
    { name: 'Neon Outline', prompt: 'Add a vibrant, glowing neon outline around the silhouette of the main subject.' },
    { name: 'Cinematic Light', prompt: 'Relight the subject with dramatic, cinematic lighting, creating strong highlights and deep shadows for a moody feel.' },
    { name: 'On a Pedestal', prompt: 'Place the main subject on top of a clean, minimalist stone or concrete pedestal to elevate it.' },
  ];

  const handleApply = (prompt: string) => {
    if (prompt) {
        onApplyStudioEffect(prompt);
    }
  };

  return (
    <div className="w-full flex flex-col gap-4 animate-fade-in">
      <p className="text-sm text-center text-zinc-400">Apply a professional studio effect to the image.</p>
      
      <div className="grid grid-cols-2 gap-2">
        {presets.map(preset => (
          <button
            key={preset.name}
            onClick={() => handleApply(preset.prompt)}
            disabled={isLoading}
            className="w-full text-center font-semibold py-3 px-3 rounded-lg transition-colors duration-200 ease-in-out bg-zinc-700 text-zinc-200 hover:bg-zinc-600 active:scale-95 text-xs disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {preset.name}
          </button>
        ))}
      </div>

      <div className="w-full flex flex-col items-center gap-2 pt-2">
        <textarea
            value={customPrompt}
            onChange={(e) => setCustomPrompt(e.target.value)}
            placeholder="Or describe a studio effect, e.g., 'place the object on a wooden table'"
            className="flex-grow bg-zinc-800 border border-zinc-700 text-zinc-100 rounded-lg p-2 text-sm focus:ring-1 focus:ring-yellow-400 focus:outline-none transition w-full disabled:cursor-not-allowed disabled:opacity-60"
            rows={2}
            disabled={isLoading}
        />
        <button 
            onClick={() => handleApply(customPrompt)}
            className="w-full bg-white text-black font-semibold py-2 px-4 text-sm rounded-lg transition-colors hover:bg-zinc-200 active:bg-zinc-300 disabled:bg-zinc-700 disabled:text-zinc-500 disabled:cursor-not-allowed"
            disabled={isLoading || !customPrompt.trim()}
        >
            Apply Custom Effect
        </button>
      </div>

      <hr className="border-zinc-700/50 my-2" />
      <AiSuggestions
        toolContext="Studio Effects"
        onApplySuggestion={onApplyStudioEffect}
        isLoading={isLoading}
      />
    </div>
  );
};

export default StudioPanel;