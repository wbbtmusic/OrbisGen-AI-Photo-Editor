/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
*/

import React, { useState } from 'react';
import AiSuggestions from './AiSuggestions';

interface ReplaceBackgroundPanelProps {
  onApplyReplaceBackground: (prompt: string, harmonizeLighting: boolean) => void;
  isLoading: boolean;
}

const ReplaceBackgroundPanel: React.FC<ReplaceBackgroundPanelProps> = ({ onApplyReplaceBackground, isLoading }) => {
  const [customPrompt, setCustomPrompt] = useState('');
  const [harmonizeLighting, setHarmonizeLighting] = useState(true);

  const presets = [
    { name: 'Beach Sunset', prompt: 'A beautiful, serene tropical beach at sunset with calm waves and palm trees.' },
    { name: 'City Night', prompt: 'A bustling city street at night with neon lights and light trails from traffic.' },
    { name: 'Mountains', prompt: 'The peak of a majestic, snow-capped mountain range under a clear blue sky.' },
    { name: 'Studio Backdrop', prompt: 'A professional photography studio with a solid dark gray backdrop and studio lighting.' },
    { name: 'Enchanted Forest', prompt: 'A magical, enchanted forest at twilight with glowing mushrooms and mystical light rays.' },
    { name: 'Sci-Fi Bridge', prompt: 'The command bridge of a futuristic starship overlooking a nebula.' },
    { name: 'Baroque Hall', prompt: 'An opulent, grand hall in a Baroque palace with ornate decorations and dramatic lighting.' },
    { name: 'Ancient Library', prompt: 'A vast, ancient library with towering, dusty bookshelves, scrolls, and a mystical atmosphere.' },
  ];

  const handleApply = () => {
    if (customPrompt) {
      onApplyReplaceBackground(customPrompt, harmonizeLighting);
    }
  };
  
  const handleTransparent = () => {
      const prompt = 'transparent background';
      setCustomPrompt(prompt);
      onApplyReplaceBackground(prompt, true); // Harmonization doesn't apply, but pass true for consistency.
  }
  
  const handleApplySuggestion = (prompt: string) => {
      setCustomPrompt(prompt);
      onApplyReplaceBackground(prompt, harmonizeLighting);
  }

  const handlePresetClick = (prompt: string) => {
    setCustomPrompt(prompt);
  }

  return (
    <div className="w-full flex flex-col gap-4 animate-fade-in">
      <p className="text-sm text-center text-zinc-400">Describe the new background, or select a preset.</p>

      <div className="grid grid-cols-2 gap-2">
        {presets.map(preset => (
            <button
                key={preset.name}
                onClick={() => handlePresetClick(preset.prompt)}
                disabled={isLoading}
                className={`w-full text-center font-semibold py-2 px-2 rounded-lg transition-colors duration-200 ease-in-out hover:bg-zinc-700 active:scale-95 text-xs disabled:opacity-50 disabled:cursor-not-allowed ${customPrompt === preset.prompt ? 'bg-zinc-200 text-black' : 'bg-zinc-800 text-zinc-200'}`}
            >
                {preset.name}
            </button>
        ))}
      </div>
      
      <textarea
        value={customPrompt}
        onChange={(e) => setCustomPrompt(e.target.value)}
        placeholder="e.g., 'a beautiful beach at sunset' or 'a professional office setting'"
        className="flex-grow bg-zinc-800 border border-zinc-700 text-zinc-100 rounded-lg p-2 text-sm focus:ring-1 focus:ring-blue-500 focus:outline-none transition w-full disabled:cursor-not-allowed disabled:opacity-60"
        rows={3}
        disabled={isLoading}
      />

      <div className="flex flex-col gap-2">
        <div className="flex items-start gap-3 p-3 rounded-lg bg-zinc-900/50">
            <input 
                type="checkbox" 
                id="harmonize-lighting-checkbox" 
                checked={harmonizeLighting}
                onChange={(e) => setHarmonizeLighting(e.target.checked)}
                disabled={isLoading}
                className="w-4 h-4 accent-blue-500 mt-0.5 flex-shrink-0"
            />
            <label htmlFor="harmonize-lighting-checkbox" className="text-xs text-zinc-300">
                <span className="font-bold">Harmonize Lighting.</span> Adjusts the subject's color and lighting to match the new background for a more realistic look.
            </label>
        </div>
        <button
          onClick={handleApply}
          className="w-full bg-blue-600 text-white font-semibold py-2 px-4 text-sm rounded-xl transition-all shadow-md shadow-blue-600/20 hover:bg-blue-500 hover:shadow-lg hover:shadow-blue-500/40 active:bg-blue-700 disabled:bg-zinc-800 disabled:text-zinc-500 disabled:cursor-not-allowed"
          disabled={isLoading || !customPrompt.trim()}
        >
          Replace Background
        </button>
         <button
          onClick={handleTransparent}
          className="w-full bg-zinc-800 text-zinc-200 font-semibold py-2 px-4 text-sm rounded-xl transition-colors hover:bg-zinc-700 active:scale-95 disabled:bg-zinc-800 disabled:text-zinc-500 disabled:cursor-not-allowed"
          disabled={isLoading}
        >
          Make Transparent
        </button>
      </div>

      <hr className="border-zinc-800 my-2" />
      <AiSuggestions
        toolContext="Background Replacement"
        onApplySuggestion={handleApplySuggestion}
        isLoading={isLoading}
      />
    </div>
  );
};

export default ReplaceBackgroundPanel;