/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
*/

import React, { useState } from 'react';

interface PortraitPanelProps {
  onApplyGenerativeEdit: (prompt: string) => void;
  hasSelection: boolean;
  isLoading: boolean;
}

const PortraitPanel: React.FC<PortraitPanelProps> = ({ onApplyGenerativeEdit, hasSelection, isLoading }) => {
  const [customPrompt, setCustomPrompt] = useState('');

  const presets = [
    { name: 'Smooth Skin', prompt: 'Subtly and realistically smooth the skin texture, removing minor blemishes while retaining natural pores and character. Do not make the skin look plastic or overly airbrushed.' },
    { name: 'Enhance Eyes', prompt: 'Subtly enhance the eyes. Make the irises slightly brighter and more vibrant, and add a small, natural-looking catchlight. Do not change the eye color.' },
    { name: 'Whiten Teeth', prompt: 'Naturally whiten the teeth, removing yellow tint. The result should be a healthy, realistic white, not an artificial, glowing white.' },
    { name: 'Remove Flyaways', prompt: 'Clean up distracting stray hairs and flyaways around the head and face for a cleaner, more professional look.' },
    { name: 'Reduce Wrinkles', prompt: 'Subtly soften the appearance of wrinkles and fine lines, particularly around the eyes and mouth, for a more youthful yet natural look.' },
    { name: 'Gothic Makeup', prompt: 'Apply a dramatic gothic makeup style with dark lipstick, heavy black eyeliner, and pale skin. Keep the user\'s facial features.' },
    { name: 'Smokey Eyes', prompt: 'Apply a classic, elegant smokey eye makeup effect with blended dark eyeshadow and defined lashes.' },
    { name: 'Bold Red Lips', prompt: 'Apply a vibrant, bold red lipstick with clean, sharp edges to the lips.' },
  ];

  const handleApply = (prompt: string) => {
    if (prompt) {
      onApplyGenerativeEdit(prompt);
    }
  };

  return (
    <div className="w-full flex flex-col gap-4 animate-fade-in">
      <p className="text-sm text-center text-zinc-400">
        {hasSelection ? 'Select a portrait enhancement.' : 'Select an area on the face to apply an effect.'}
      </p>
      
      <div className="grid grid-cols-2 gap-2">
        {presets.map(preset => (
          <button
            key={preset.name}
            onClick={() => handleApply(preset.prompt)}
            disabled={isLoading || !hasSelection}
            className="w-full text-center font-semibold py-2 px-2 rounded-lg transition-colors duration-200 ease-in-out bg-zinc-800 text-zinc-200 hover:bg-zinc-700 active:scale-95 text-xs disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {preset.name}
          </button>
        ))}
      </div>

      <div className="w-full flex flex-col items-center gap-2 pt-2">
        <textarea
            value={customPrompt}
            onChange={(e) => setCustomPrompt(e.target.value)}
            placeholder={hasSelection ? "Or describe a specific change, e.g., 'change hair to red'" : "Select an area on the image first"}
            className="flex-grow bg-zinc-800 border border-zinc-700 text-zinc-100 rounded-lg p-2 text-sm focus:ring-1 focus:ring-blue-500 focus:outline-none transition w-full disabled:cursor-not-allowed disabled:opacity-60"
            rows={2}
            disabled={isLoading || !hasSelection}
        />
        <button 
            onClick={() => handleApply(customPrompt)}
            className="w-full bg-blue-600 text-white font-semibold py-2 px-4 text-sm rounded-xl transition-all shadow-md shadow-blue-600/20 hover:bg-blue-500 hover:shadow-lg hover:shadow-blue-500/40 active:bg-blue-700 disabled:bg-zinc-800 disabled:text-zinc-500 disabled:cursor-not-allowed"
            disabled={isLoading || !customPrompt.trim() || !hasSelection}
        >
            Apply Custom Effect
        </button>
    </div>
       <p className="text-xs text-center text-zinc-500 mt-2">
        AI will apply realistic and subtle enhancements to the selected area.
      </p>
    </div>
  );
};

export default PortraitPanel;