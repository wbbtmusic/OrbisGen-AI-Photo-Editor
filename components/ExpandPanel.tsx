/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
*/
import React, { useState } from 'react';

type AspectRatioKey = '1:1' | '16:9' | '9:16' | '4:3' | '3:4';

interface ExpandPanelProps {
  onApplyExpand: (aspectRatio: number, prompt: string) => void;
  isLoading: boolean;
}

const ExpandPanel: React.FC<ExpandPanelProps> = ({ onApplyExpand, isLoading }) => {
  const [prompt, setPrompt] = useState('');
  const [selectedAspect, setSelectedAspect] = useState<number | null>(null);

  const aspects: { name: AspectRatioKey, value: number }[] = [
    { name: '1:1', value: 1 / 1 },
    { name: '16:9', value: 16 / 9 },
    { name: '9:16', value: 9 / 16 },
    { name: '4:3', value: 4 / 3 },
    { name: '3:4', value: 3 / 4 },
  ];

  const handleApply = () => {
    if (selectedAspect) {
      onApplyExpand(selectedAspect, prompt);
    }
  };

  return (
    <div className="w-full flex flex-col gap-4 animate-fade-in">
      <p className="text-sm text-center text-zinc-400">Expand the canvas and let AI fill the new space.</p>

      <div className="flex flex-col gap-3">
        <label className="text-xs font-medium text-zinc-400">1. Choose New Aspect Ratio</label>
        <div className="grid grid-cols-3 gap-2">
            {aspects.map(({ name, value }) => (
            <button
                key={name}
                onClick={() => setSelectedAspect(value)}
                disabled={isLoading}
                className={`px-3 py-2 rounded-lg text-xs font-semibold transition-colors duration-200 active:scale-95 disabled:opacity-50 ${
                selectedAspect === value
                ? 'bg-zinc-200 text-black'
                : 'bg-zinc-800 hover:bg-zinc-700 text-zinc-200'
                }`}
            >
                {name}
            </button>
            ))}
        </div>
      </div>
      
      <div className="flex flex-col gap-2">
        <label className="text-xs font-medium text-zinc-400">2. Guide the AI (Optional)</label>
        <textarea
          value={prompt}
          onChange={(e) => setPrompt(e.target.value)}
          placeholder="e.g., 'continue the sandy beach scene with waves'"
          className="flex-grow bg-zinc-800 border border-zinc-700 text-zinc-100 rounded-lg p-2 text-sm focus:ring-1 focus:ring-blue-500 focus:outline-none transition w-full disabled:cursor-not-allowed disabled:opacity-60"
          rows={2}
          disabled={isLoading}
        />
      </div>

      <button
        onClick={handleApply}
        disabled={isLoading || !selectedAspect}
        className="w-full mt-2 bg-blue-600 text-white font-semibold py-2 px-4 rounded-xl transition-all shadow-md shadow-blue-600/20 hover:bg-blue-500 hover:shadow-lg hover:shadow-blue-500/40 active:bg-blue-700 disabled:bg-zinc-800 disabled:text-zinc-500 disabled:cursor-not-allowed"
      >
        Apply Expand
      </button>

      <p className="text-xs text-center text-zinc-500 mt-1">
        AI will fill the new areas based on the existing image content.
      </p>
    </div>
  );
};

export default ExpandPanel;
