/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
*/
import React from 'react';
import { RandomizeIcon } from './icons';

interface RandomizePanelProps {
  onApplyRandomize: () => void;
  isLoading: boolean;
}

const RandomizePanel: React.FC<RandomizePanelProps> = ({ onApplyRandomize, isLoading }) => {
  return (
    <div className="w-full flex flex-col items-center gap-4 animate-fade-in p-4 text-center">
      <RandomizeIcon className="w-16 h-16 text-yellow-400" />
      <h3 className="text-lg font-bold text-white">Feeling Lucky?</h3>
      <p className="text-sm text-zinc-400">
        Let the AI surprise you with a creative and unexpected transformation of your image.
      </p>
      
      <button
        onClick={onApplyRandomize}
        disabled={isLoading}
        className="w-full mt-4 bg-yellow-500 text-black font-bold py-3 px-4 rounded-lg transition-colors hover:bg-yellow-400 active:scale-95 disabled:bg-zinc-700 disabled:text-zinc-500 disabled:cursor-not-allowed flex items-center justify-center"
      >
        {isLoading ? 'Thinking...' : 'Randomize It!'}
      </button>
    </div>
  );
};

export default RandomizePanel;