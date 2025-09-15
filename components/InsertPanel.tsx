/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
*/
import React, { useState } from 'react';

interface InsertPanelProps {
  onApply: (prompt: string) => void;
  isLoading: boolean;
  hasSelection: boolean;
}

const InsertPanel: React.FC<InsertPanelProps> = ({ onApply, isLoading, hasSelection }) => {
  const [prompt, setPrompt] = useState('');

  const handleApply = () => {
    if (prompt.trim()) {
      onApply(prompt);
    }
  };

  return (
    <div className="w-full flex flex-col gap-4 animate-fade-in">
      <p className="text-sm text-center text-zinc-400">
        {hasSelection ? 'Describe the object to add.' : 'Select an area on the image where you want to add something.'}
      </p>

      <div className="flex flex-col gap-3">
        <textarea
          value={prompt}
          onChange={(e) => setPrompt(e.target.value)}
          placeholder={hasSelection ? "e.g., 'a small cat sitting on the ground'" : "Select an area on the image first"}
          className="flex-grow bg-zinc-800 border border-zinc-700 text-zinc-100 rounded-lg p-2 text-sm focus:ring-1 focus:ring-blue-500 focus:outline-none transition w-full disabled:cursor-not-allowed disabled:opacity-60"
          rows={3}
          disabled={isLoading || !hasSelection}
        />
      </div>

      <button
        onClick={handleApply}
        className="w-full bg-blue-600 text-white font-semibold py-2 px-4 text-sm rounded-xl transition-all shadow-md shadow-blue-600/20 hover:bg-blue-500 hover:shadow-lg hover:shadow-blue-500/40 active:bg-blue-700 disabled:bg-zinc-800 disabled:text-zinc-500 disabled:cursor-not-allowed"
        disabled={isLoading || !prompt.trim() || !hasSelection}
      >
        Generate Object
      </button>

      <p className="text-xs text-center text-zinc-500 mt-1">
        AI will add the object to the selected area, matching the scene's lighting, perspective, and scale.
      </p>
    </div>
  );
};

export default InsertPanel;