/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
*/
import React, { useState } from 'react';
import AiSuggestions from './AiSuggestions';

interface SkyPanelProps {
  onApply: (prompt: string) => void;
  isLoading: boolean;
}

const SkyPanel: React.FC<SkyPanelProps> = ({ onApply, isLoading }) => {
  const [customPrompt, setCustomPrompt] = useState('');

  const presets = [
    { name: 'Sunset', prompt: 'A beautiful, dramatic golden hour sunset sky.' },
    { name: 'Blue Sky', prompt: 'A clear, bright blue sky with a few fluffy white clouds.' },
    { name: 'Stormy', prompt: 'A dark, dramatic, and stormy sky with ominous clouds.' },
    { name: 'Night Sky', prompt: 'A clear night sky full of brilliant stars and the milky way galaxy.' },
    { name: 'Aurora', prompt: 'A vibrant aurora borealis (northern lights) dancing in the night sky.' },
    { name: 'Galaxy', prompt: 'A breathtaking view of the Andromeda galaxy in the night sky.' },
    { name: 'Fireworks', prompt: 'A vibrant display of colorful fireworks exploding in the night sky.' },
    { name: 'Surreal Clouds', prompt: 'A surreal, dreamlike sky with fantastically shaped, pastel-colored clouds.' },
    { name: 'Van Gogh\'s Starry Night', prompt: 'the sky from Vincent Van Gogh\'s painting The Starry Night' },
    { name: 'Retro Futurism', prompt: 'a retro-futuristic sky with two moons and distant ringed planets' },
  ];
  
  const activePrompt = customPrompt;

  const handleApply = (promptToApply: string) => {
    if (promptToApply.trim()) {
      onApply(promptToApply);
    }
  };

  return (
    <div className="w-full flex flex-col gap-4 animate-fade-in">
      <p className="text-sm text-center text-zinc-400">Replace the sky and relight the entire scene.</p>
      
      <div className="grid grid-cols-2 gap-2">
        {presets.map(preset => (
          <button
            key={preset.name}
            onClick={() => {
                setCustomPrompt(preset.prompt);
                handleApply(preset.prompt);
            }}
            disabled={isLoading}
            className="w-full text-center font-semibold py-3 px-3 rounded-lg transition-colors duration-200 ease-in-out bg-zinc-800 text-zinc-200 hover:bg-zinc-700 active:scale-95 text-xs disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {preset.name}
          </button>
        ))}
      </div>

      <div className="flex flex-col items-center gap-2 pt-2">
        <textarea
            value={customPrompt}
            onChange={(e) => setCustomPrompt(e.target.value)}
            placeholder="Or describe a custom sky..."
            className="flex-grow bg-zinc-800 border border-zinc-700 text-zinc-100 rounded-lg p-2 text-sm focus:ring-1 focus:ring-blue-500 focus:outline-none transition w-full disabled:cursor-not-allowed disabled:opacity-60"
            rows={2}
            disabled={isLoading}
        />
        <button 
            onClick={() => handleApply(activePrompt)}
            className="w-full bg-blue-600 text-white font-semibold py-2 px-4 text-sm rounded-xl transition-all shadow-md shadow-blue-600/20 hover:bg-blue-500 hover:shadow-lg hover:shadow-blue-500/40 active:bg-blue-700 disabled:bg-zinc-800 disabled:text-zinc-500 disabled:cursor-not-allowed"
            disabled={isLoading || !activePrompt.trim()}
        >
            Apply Custom Sky
        </button>
      </div>
      <p className="text-xs text-center text-zinc-500 mt-1">
        The AI will not only replace the sky, but also adjust the lighting of the foreground to match.
      </p>

      <hr className="border-zinc-800 my-2" />
      <AiSuggestions
        toolContext="Sky Replacement"
        onApplySuggestion={onApply}
        isLoading={isLoading}
      />
    </div>
  );
};

export default SkyPanel;