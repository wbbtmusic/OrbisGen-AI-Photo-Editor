/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
*/
import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { createAiTheme } from '../services/geminiService';

interface AiThemeGeneratorProps {
    onThemeCreated: (theme: { title: string; description: string; categories: string[] }) => void;
    setLoading: (isLoading: boolean) => void;
}

const AiThemeGenerator: React.FC<AiThemeGeneratorProps> = ({ onThemeCreated, setLoading }) => {
    const [themeIdea, setThemeIdea] = useState('');
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);

    const handleGenerateTheme = async () => {
        if (!themeIdea.trim()) {
            setError("Please enter a theme idea.");
            return;
        }
        setIsLoading(true);
        setLoading(true);
        setError(null);

        try {
            const newTheme = await createAiTheme(themeIdea);
            onThemeCreated(newTheme);
            setThemeIdea('');
        } catch (err) {
            const errorMessage = err instanceof Error ? err.message : "An unknown error occurred.";
            setError(`Failed to create theme. Error: ${errorMessage}`);
            console.error("AI theme generation failed:", err);
        } finally {
            setIsLoading(false);
            setLoading(false);
        }
    };

    return (
        <div
            className="w-full bg-yellow-400/10 border border-dashed border-yellow-400/50 rounded-lg p-3 text-center"
        >
            <h3 className="font-permanent-marker text-lg text-yellow-400">AI Theme Forge</h3>
            <p className="text-zinc-300 text-xs mt-1">Let Gemini create a custom theme!</p>

            <div className="flex flex-col gap-2 mt-3">
                <input
                    type="text"
                    value={themeIdea}
                    onChange={(e) => setThemeIdea(e.target.value)}
                    placeholder="e.g., Viking Warriors"
                    className="flex-grow bg-zinc-800 border border-zinc-700 text-white text-xs rounded-md px-3 py-1.5 focus:outline-none focus:ring-1 focus:ring-yellow-400"
                    disabled={isLoading}
                />
                <button
                    onClick={handleGenerateTheme}
                    disabled={isLoading}
                    className="font-permanent-marker text-sm text-center text-black bg-yellow-400 py-1.5 px-4 rounded-sm transform transition-colors duration-200 hover:bg-yellow-300 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center"
                >
                    {isLoading ? (
                         <>
                            <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-black" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                            </svg>
                            Creating...
                        </>
                    ) : (
                        'Generate'
                    )}
                </button>
            </div>
            {error && <p className="text-red-400 mt-2 text-xs">{error}</p>}
        </div>
    );
};

export default AiThemeGenerator;