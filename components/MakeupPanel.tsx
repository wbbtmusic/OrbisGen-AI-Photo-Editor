/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
*/
import React, { useState } from 'react';
import AiSuggestions from './AiSuggestions';

interface MakeupPanelProps {
  onApplyMakeup: (prompt: string) => void;
  isLoading: boolean;
}

const MakeupPanel: React.FC<MakeupPanelProps> = ({ onApplyMakeup, isLoading }) => {
  const [prompt, setPrompt] = useState('');

  const presets = [
    'dramatic smokey eye makeup',
    'a natural, "no-makeup" look',
    'bold red lipstick and winged eyeliner',
    'colorful festival makeup with glitter',
    'gothic makeup with dark lipstick',
    '80s style makeup with bright eyeshadow',
  ];

  const handleApply = (promptToApply: string) => {
    if (promptToApply.trim()) {
      onApplyMakeup(promptToApply);
    }
  };

  return (
    <div className="w-full flex flex-col gap-4 animate-fade-in">
      <p className="text-sm text-center text-zinc-400">Describe the makeup style you want to apply.</p>

      <div className="flex flex-col gap-3">
        <textarea
          value={prompt}
          onChange={(e) => setPrompt(e.target.value)}
          placeholder="e.g., 'subtle eyeshadow and pink lipstick'"
          className="flex-grow bg-zinc-800 border border-zinc-700 text-zinc-100 rounded-lg p-2 text-sm focus:ring-1 focus:ring-blue-500 focus:outline-none transition w-full"
          rows={3}
          disabled={isLoading}
        />
      </div>

       <div className="grid grid-cols-2 gap-2">
        {presets.map(p => (
          <button
            key={p}
            onClick={() => { setPrompt(p); handleApply(p); }}
            disabled={isLoading}
            className="w-full text-center font-semibold py-2 px-2 rounded-lg transition-colors duration-200 ease-in-out bg-zinc-800 text-zinc-200 hover:bg-zinc-700 active:scale-95 text-xs disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {p}
          </button>
        ))}
      </div>

      <button
        onClick={() => handleApply(prompt)}
        className="w-full bg-blue-600 text-white font-semibold py-2 px-4 text-sm rounded-xl transition-all shadow-md shadow-blue-600/20 hover:bg-blue-500 hover:shadow-lg hover:shadow-blue-500/40 active:bg-blue-700 disabled:bg-zinc-800 disabled:text-zinc-500 disabled:cursor-not-allowed"
        disabled={isLoading || !prompt.trim()}
      >
        Apply Makeup
      </button>

      <p className="text-xs text-center text-zinc-500 mt-1">
        AI will apply the described makeup while preserving the person's facial features.
      </p>
      
      <hr className="border-zinc-800 my-2" />
      <AiSuggestions
        toolContext="Makeup Styles"
        onApplySuggestion={onApplyMakeup}
        isLoading={isLoading}
      />
    </div>
  );
};

export default MakeupPanel;