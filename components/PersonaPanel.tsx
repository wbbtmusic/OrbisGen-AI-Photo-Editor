/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
*/
import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { createAiTheme, THEMES } from '../services/geminiService';
import AiThemeGenerator from './AiThemeGenerator';
import { type Theme } from '../types';

interface PersonaPanelProps {
    onGenerate: (theme: Theme, categories: string[]) => void;
}

interface CustomTheme {
    key: string;
    title: string;
    description: string;
    categories: string[];
}

const PersonaPanel: React.FC<PersonaPanelProps> = ({
    onGenerate,
}) => {
    const [imageCounts, setImageCounts] = useState<Record<string, number>>({});
    const [customThemes, setCustomThemes] = useState<CustomTheme[]>([]);
    const [isAiThemeLoading, setIsAiThemeLoading] = useState(false);
    
    useEffect(() => {
        const allThemes: Record<string, { categories: string[] }> = {...THEMES};
        customThemes.forEach(theme => {
            allThemes[theme.key] = theme;
        });

        const initialCounts: Record<string, number> = {};
        Object.entries(allThemes).forEach(([key, theme]) => {
            initialCounts[key] = Math.min(4, theme.categories.length);
        });
        setImageCounts(initialCounts);
    }, [customThemes]);

    const handleSelectTheme = async (themeKey: string, isCustom: boolean) => {
        let theme: Theme | undefined;
        if (isCustom) {
            const baseTheme = customThemes.find(t => t.key === themeKey);
            if (baseTheme) {
                theme = {
                    ...baseTheme,
                    getPrompt: (category: string) => `Reimagine the person in this photo in a striking ${category} style. This should include appropriate clothing, accessories, and setting for that aesthetic. The person's facial features and identity must be clearly preserved. The output must be a photorealistic image.`
                };
            }
        } else {
            const baseTheme = THEMES[themeKey as keyof typeof THEMES];
            if (baseTheme) {
                theme = {
                    ...baseTheme,
                    key: themeKey,
                };
            }
        }

        if (!theme) return;
        
        const imageCount = imageCounts[themeKey] || 2;
        const selectedCategories = theme.categories.slice(0, imageCount);
        
        onGenerate(theme, selectedCategories);
    };

    const handleAiThemeCreated = (theme: Omit<CustomTheme, 'key'>) => {
        const newTheme = {
            ...theme,
            key: `${theme.title.replace(/\s+/g, '-')}-${Date.now()}`
        };
        setCustomThemes(prev => [newTheme, ...prev]);
    }
    
    const allThemesForRender = [
        ...Object.entries(THEMES).map(([key, theme]) => ({ key, ...theme, isCustom: false })),
        ...customThemes.map(theme => ({ ...theme, isCustom: true }))
    ];

    return (
        <motion.div
            key="selection"
            initial={{ opacity: 0, x: 50 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -50 }}
            transition={{ duration: 0.3 }}
            className="h-full flex flex-col"
        >
            <div className="flex flex-col gap-4">
                <p className="text-sm text-center text-zinc-400">Discover alternate versions of yourself. Choose or create a theme to begin.</p>
                <AiThemeGenerator onThemeCreated={handleAiThemeCreated} setLoading={setIsAiThemeLoading} />

                <div className="space-y-4">
                    {allThemesForRender.map((theme) => (
                        <div key={theme.key} className="bg-zinc-800 rounded-lg p-3 flex flex-col group relative">
                            {theme.isCustom && <div className="absolute top-2 right-2 bg-yellow-400 text-black text-xs font-bold px-1.5 py-0.5 rounded font-permanent-marker">AI</div>}
                            <h3 className="font-permanent-marker text-lg text-yellow-400">{theme.title}</h3>
                            <p className="text-zinc-300 text-xs mt-1 mb-2 flex-grow">{theme.description}</p>
                            <div className="text-xs text-zinc-400 mb-1">
                                Images: <span className="font-bold text-white">{imageCounts[theme.key] || 0}</span>
                            </div>
                            <input
                                type="range"
                                min={2}
                                max={theme.categories.length}
                                value={imageCounts[theme.key] || 2}
                                onChange={(e) => setImageCounts(prev => ({ ...prev, [theme.key]: parseInt(e.target.value) }))}
                                className="w-full h-2 bg-zinc-700 rounded-lg appearance-none cursor-pointer accent-yellow-400"
                            />
                            <button 
                                onClick={() => handleSelectTheme(theme.key, theme.isCustom)}
                                disabled={isAiThemeLoading}
                                className="w-full mt-3 bg-white text-black font-semibold py-1.5 px-3 text-sm rounded-lg transition-colors hover:bg-zinc-200 active:bg-zinc-300 disabled:bg-zinc-700 disabled:text-zinc-500 disabled:cursor-not-allowed"
                            >
                                Generate
                            </button>
                        </div>
                    ))}
                </div>
            </div>
        </motion.div>
    );
};

export default PersonaPanel;