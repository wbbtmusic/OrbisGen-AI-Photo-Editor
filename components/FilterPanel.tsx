/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
*/

import React, { useState } from 'react';
import AiSuggestions from './AiSuggestions';

interface FilterPanelProps {
  onApplyFilter: (prompt: string) => void;
  isLoading: boolean;
}

const FilterPanel: React.FC<FilterPanelProps> = ({ onApplyFilter, isLoading }) => {
  const [selectedPresetPrompt, setSelectedPresetPrompt] = useState<string | null>(null);
  const [customPrompt, setCustomPrompt] = useState('');

  const presets = [
    { name: 'Synthwave', prompt: 'Apply a vibrant 80s synthwave aesthetic with neon magenta and cyan glows, and subtle scan lines.' },
    { name: 'Anime', prompt: 'Give the image a vibrant Japanese anime style, with bold outlines, cel-shading, and saturated colors.' },
    { name: 'Pop Art', prompt: 'Convert the image into a bold, vibrant pop art style, similar to the work of Andy Warhol, with high contrast and flat color areas.' },
    { name: 'Oil Painting', prompt: 'Transform the image to look like a classical oil painting with visible brushstrokes and a textured canvas effect.' },
    { name: 'Watercolor', prompt: 'Give the image the appearance of a soft, flowing watercolor painting with blended colors and a paper texture.' },
    { name: 'Pencil Sketch', prompt: 'Convert the image into a detailed, monochrome pencil sketch on textured paper.' },
    { name: 'Pixel Art', prompt: 'Transform the image into 16-bit era pixel art, with a limited color palette and blocky details.' },
    { name: 'Gothic', prompt: 'Apply a dark, gothic filter with high contrast, desaturated colors except for deep reds, and a mysterious, moody atmosphere.' },
    { name: 'Art Nouveau', prompt: 'Reimagine the image in the Art Nouveau style, with flowing, organic lines, decorative patterns, and a muted, elegant color palette reminiscent of Alphonse Mucha.' },
    { name: 'Technicolor Film', prompt: 'Apply a hyper-saturated, vibrant Technicolor film filter, reminiscent of classic Hollywood movies from the 1940s and 50s. Greatly enhance primary colors.' },
    { name: 'Daguerreotype', prompt: 'Give the image the look of an early Daguerreotype photograph from the 1840s, with a slightly metallic, reflective quality, high detail, and a monochrome or subtly toned appearance.' },
    { name: 'Noir Comic', prompt: 'Transform the image into a high-contrast, gritty noir comic book style, like Sin City. Use stark blacks and whites, with selective, dramatic splashes of a single color like red.' },
  ];
  
  const activePrompt = selectedPresetPrompt || customPrompt;

  const handlePresetClick = (prompt: string) => {
    setSelectedPresetPrompt(prompt);
    setCustomPrompt('');
  };
  
  const handleCustomChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setCustomPrompt(e.target.value);
    setSelectedPresetPrompt(null);
  };

  const handleApply = () => {
    if (activePrompt) {
      onApplyFilter(activePrompt);
    }
  };

  return (
    <div className="w-full flex flex-col gap-4 animate-fade-in">
      <p className="text-sm text-center text-zinc-400">Apply an artistic filter.</p>
      
      <div className="grid grid-cols-2 gap-2">
        {presets.map(preset => (
          <button
            key={preset.name}
            onClick={() => handlePresetClick(preset.prompt)}
            disabled={isLoading}
            className={`w-full text-center font-semibold py-2 px-2 rounded-lg transition-colors duration-200 ease-in-out hover:bg-zinc-700 active:scale-95 text-xs disabled:opacity-50 disabled:cursor-not-allowed ${selectedPresetPrompt === preset.prompt ? 'bg-zinc-200 text-black' : 'bg-zinc-800 text-zinc-200'}`}
          >
            {preset.name}
          </button>
        ))}
      </div>

      <input
        type="text"
        value={customPrompt}
        onChange={handleCustomChange}
        placeholder="Or describe a custom filter..."
        className="flex-grow bg-zinc-800 border border-zinc-700 text-zinc-100 rounded-lg p-2 text-sm focus:ring-1 focus:ring-blue-500 focus:outline-none transition w-full disabled:cursor-not-allowed disabled:opacity-60"
        disabled={isLoading}
      />
      
      {activePrompt && (
        <div className="animate-fade-in flex flex-col gap-4 pt-2">
          <button
            onClick={handleApply}
            className="w-full bg-blue-600 text-white font-semibold py-2 px-4 text-sm rounded-xl transition-all shadow-md shadow-blue-600/20 hover:bg-blue-500 hover:shadow-lg hover:shadow-blue-500/40 active:bg-blue-700 disabled:bg-zinc-800 disabled:text-zinc-500 disabled:cursor-not-allowed"
            disabled={isLoading || !activePrompt.trim()}
          >
            Apply Filter
          </button>
        </div>
      )}

      <hr className="border-zinc-800 my-2" />
      <AiSuggestions
        toolContext="Artistic Filters"
        onApplySuggestion={onApplyFilter}
        isLoading={isLoading}
      />
    </div>
  );
};

export default FilterPanel;