/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
*/
import React, { useState } from 'react';
import { generateAiSuggestions } from '../services/geminiService';
import { SparklesIcon } from './icons';

interface AiSuggestionsProps {
  toolContext: string;
  onApplySuggestion: (prompt: string) => void;
  isLoading: boolean;
}

interface Suggestion {
  name: string;
  prompt: string;
}

const AiSuggestions: React.FC<AiSuggestionsProps> = ({ toolContext, onApplySuggestion, isLoading }) => {
  const [suggestions, setSuggestions] = useState<Suggestion[]>([]);
  const [isGenerating, setIsGenerating] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleGenerate = async () => {
    setIsGenerating(true);
    setError(null);
    try {
      const newSuggestions = await generateAiSuggestions(toolContext);
      setSuggestions(newSuggestions);
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to get suggestions.';
      setError(errorMessage);
    } finally {
      setIsGenerating(false);
    }
  };

  return (
    <div className="flex flex-col gap-3 pt-3">
      <h3 className="text-sm font-semibold text-zinc-300 flex items-center gap-2">
        <SparklesIcon className="w-5 h-5 text-blue-400" />
        <span>AI Suggestions</span>
      </h3>
      {suggestions.length === 0 ? (
        <button
          onClick={handleGenerate}
          disabled={isLoading || isGenerating}
          className="w-full text-center font-semibold py-2 px-4 rounded-lg transition-colors duration-200 ease-in-out bg-zinc-800 text-blue-400 hover:bg-zinc-700 active:scale-95 text-xs disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
        >
          {isGenerating ? (
            <>
              <svg className="animate-spin h-4 w-4" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24"><circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle><path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"></path></svg>
              <span>Generating...</span>
            </>
          ) : 'Generate 4 ideas'}
        </button>
      ) : (
        <div className="grid grid-cols-2 gap-2">
          {suggestions.map((suggestion, index) => (
            <button
              key={index}
              onClick={() => onApplySuggestion(suggestion.prompt)}
              disabled={isLoading || isGenerating}
              className="w-full text-center font-semibold py-2 px-2 rounded-lg transition-colors duration-200 ease-in-out bg-zinc-800 text-zinc-200 hover:bg-zinc-700 active:scale-95 text-xs disabled:opacity-50 disabled:cursor-not-allowed"
              title={suggestion.prompt}
            >
              {suggestion.name}
            </button>
          ))}
        </div>
      )}
      {error && <p className="text-xs text-red-400 text-center">{error}</p>}
    </div>
  );
};

export default AiSuggestions;