/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
*/
import React, { useState } from 'react';

interface AlternateHistoryPanelProps {
  onApply: (prompt: string) => void;
  isLoading: boolean;
  hasSelection: boolean;
}

const AlternateHistoryPanel: React.FC<AlternateHistoryPanelProps> = ({ onApply, isLoading, hasSelection }) => {
  const [prompt, setPrompt] = useState('');

  const handleApply = () => {
    if (prompt.trim()) {
      onApply(prompt);
    }
  };

  return (
    <div className="w-full flex flex-col gap-4 animate-fade-in">
      <p className="text-sm text-center text-zinc-400">
        {hasSelection ? 'What if the selected object was something else?' : 'Select an object on the image to replace.'}
      </p>

      <div className="flex flex-col gap-3">
        <div className="flex items-center gap-2">
            <span className="text-sm text-zinc-400 font-medium">What if it was a...</span>
             <input
                type="text"
                value={prompt}
                onChange={(e) => setPrompt(e.target.value)}
                placeholder={hasSelection ? "a dragon" : "Select an area first"}
                className="flex-grow bg-zinc-800 border border-zinc-700 text-zinc-100 rounded-lg p-2 text-sm focus:ring-1 focus:ring-blue-500 focus:outline-none transition w-full disabled:cursor-not-allowed disabled:opacity-60"
                disabled={isLoading || !hasSelection}
                />
        </div>
      </div>

      <button
        onClick={handleApply}
        className="w-full bg-blue-600 text-white font-semibold py-2 px-4 text-sm rounded-xl transition-all shadow-md shadow-blue-600/20 hover:bg-blue-500 hover:shadow-lg hover:shadow-blue-500/40 active:bg-blue-700 disabled:bg-zinc-800 disabled:text-zinc-500 disabled:cursor-not-allowed"
        disabled={isLoading || !prompt.trim() || !hasSelection}
      >
        Generate
      </button>

      <p className="text-xs text-center text-zinc-500 mt-1">
        AI will replace the object and blend the surroundings to match the new context.
      </p>
    </div>
  );
};

export default AlternateHistoryPanel;
