/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
*/
import React, { useState, useEffect } from 'react';
import Spinner from './Spinner';
import { generateImageFromText, compositePersonIntoScene } from '../services/geminiService';
import { dataURLtoFile } from '../lib/utils';
import { type AspectRatio, type DesignStudioPersonaOptions, type AddPersonOptions } from '../types';
import AddPersonControls from './AddPersonControls';
import { 
    AspectRatio1x1Icon, AspectRatio16x9Icon, AspectRatio9x16Icon, AspectRatio4x3Icon, AspectRatio3x4Icon,
    UndoIcon, RedoIcon, DownloadIcon,
} from './icons';

interface DesignStudioProps {
  onExit: () => void;
  onUseInEditor: (file: File) => void;
}

type DesignStudioHistoryEntry = {
    bgUrl: string | null;
    finalUrl: string | null;
    // We store the options too so regenerating background doesn't lose persona settings
    personaOptions: DesignStudioPersonaOptions;
    scratchPrompt: string;
    scratchAspectRatio: AspectRatio;
};

const inspirationPrompts = [
    "A photorealistic portrait of an astronaut on Mars, detailed suit, red planet background, cinematic lighting.",
    "A vibrant watercolor painting of a bustling Parisian street cafe scene.",
    "A logo for a coffee shop called 'The Daily Grind', minimalist, with a coffee bean icon.",
    "A sleek, futuristic sports car driving on a neon-lit highway at night, long exposure effect.",
    "A cute, fluffy baby dragon sleeping on a pile of gold coins, fantasy art style.",
    "An epic landscape of a mysterious floating island with waterfalls cascading into the clouds.",
];

const initialPersonaOptions: DesignStudioPersonaOptions = {
    backgroundPrompt: '',
    aspectRatio: '1:1',
    person: {
        prompt: '',
        personRefImage: null,
        placement: 'center',
        familiarity: 'Pose the person to be standing naturally and respectfully within the scene.',
        gazeDirection: 'looking at camera',
        faceDirection: 'facing camera',
        preserveMainSubjectPose: false,
    },
    posePrompt: '',
};

const aspectRatios: { key: AspectRatio; icon: React.FC<{ className?: string }> }[] = [
    { key: '1:1', icon: AspectRatio1x1Icon },
    { key: '16:9', icon: AspectRatio16x9Icon },
    { key: '9:16', icon: AspectRatio9x16Icon },
    { key: '4:3', icon: AspectRatio4x3Icon },
    { key: '3:4', icon: AspectRatio3x4Icon },
];

const DesignStudio: React.FC<DesignStudioProps> = ({ onExit, onUseInEditor }) => {
    const [mode, setMode] = useState<'scratch' | 'persona'>('scratch');
    
    // UI State reflecting the current history point
    const [scratchPrompt, setScratchPrompt] = useState('');
    const [scratchAspectRatio, setScratchAspectRatio] = useState<AspectRatio>('1:1');
    const [personaOptions, setPersonaOptions] = useState<DesignStudioPersonaOptions>(initialPersonaOptions);
    const [generatedBackgroundUrl, setGeneratedBackgroundUrl] = useState<string | null>(null);
    const [generatedImageUrl, setGeneratedImageUrl] = useState<string | null>(null);
    const [generationStep, setGenerationStep] = useState<'setup' | 'background-generated'>('setup');
    
    // History State
    const [history, setHistory] = useState<DesignStudioHistoryEntry[]>([]);
    const [historyIndex, setHistoryIndex] = useState(-1);

    // General State
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);

    // Initialize history
    useEffect(() => {
        const initialState: DesignStudioHistoryEntry = {
            bgUrl: null,
            finalUrl: null,
            personaOptions: initialPersonaOptions,
            scratchPrompt: '',
            scratchAspectRatio: '1:1',
        };
        setHistory([initialState]);
        setHistoryIndex(0);
    }, []);

    const updateStateAndHistory = (newState: Partial<DesignStudioHistoryEntry>) => {
        const currentState = history[historyIndex];
        const nextState: DesignStudioHistoryEntry = { ...currentState, ...newState };

        // Update UI state
        setPersonaOptions(nextState.personaOptions);
        setScratchPrompt(nextState.scratchPrompt);
        setScratchAspectRatio(nextState.scratchAspectRatio);
        setGeneratedBackgroundUrl(nextState.bgUrl);
        setGeneratedImageUrl(nextState.finalUrl);
        setGenerationStep(nextState.bgUrl && !nextState.finalUrl ? 'background-generated' : 'setup');

        // Update history
        const newHistory = history.slice(0, historyIndex + 1);
        setHistory([...newHistory, nextState]);
        setHistoryIndex(newHistory.length);
    };

    const handleUndo = () => {
        if (historyIndex > 0) {
            const newIndex = historyIndex - 1;
            const prevState = history[newIndex];
            setHistoryIndex(newIndex);
            
            // Restore UI state from history
            setPersonaOptions(prevState.personaOptions);
            setScratchPrompt(prevState.scratchPrompt);
            setScratchAspectRatio(prevState.scratchAspectRatio);
            setGeneratedBackgroundUrl(prevState.bgUrl);
            setGeneratedImageUrl(prevState.finalUrl);
            setGenerationStep(prevState.bgUrl && !prevState.finalUrl ? 'background-generated' : 'setup');
            setError(null);
        }
    };
    
    const handleRedo = () => {
        if (historyIndex < history.length - 1) {
            const newIndex = historyIndex + 1;
            const nextState = history[newIndex];
            setHistoryIndex(newIndex);
            
            // Restore UI state from history
            setPersonaOptions(nextState.personaOptions);
            setScratchPrompt(nextState.scratchPrompt);
            setScratchAspectRatio(nextState.scratchAspectRatio);
            setGeneratedBackgroundUrl(nextState.bgUrl);
            setGeneratedImageUrl(nextState.finalUrl);
            setGenerationStep(nextState.bgUrl && !nextState.finalUrl ? 'background-generated' : 'setup');
            setError(null);
        }
    };

    const handleDownload = () => {
        const urlToDownload = generatedImageUrl || generatedBackgroundUrl;
        if (urlToDownload) {
            const link = document.createElement('a');
            link.href = urlToDownload;
            link.download = `orbisgen-design-${Date.now()}.jpg`;
            document.body.appendChild(link);
            link.click();
            document.body.removeChild(link);
        }
    };


    const handleInspireMe = () => {
        const randomPrompt = inspirationPrompts[Math.floor(Math.random() * inspirationPrompts.length)];
        if (mode === 'scratch') {
            setScratchPrompt(randomPrompt);
        } else {
            setPersonaOptions(prev => ({ ...prev, backgroundPrompt: randomPrompt }));
        }
    };

    const handleGenerateScratch = async () => {
        if (!scratchPrompt.trim()) return;
        setIsLoading(true);
        setError(null);
        try {
            const imageUrl = await generateImageFromText(scratchPrompt, scratchAspectRatio);
            updateStateAndHistory({ finalUrl: imageUrl, scratchPrompt, scratchAspectRatio, bgUrl: null });
        } catch (err) {
            const errorMessage = err instanceof Error ? err.message : 'An unknown error occurred.';
            setError(`Failed to generate image. ${errorMessage}`);
        } finally {
            setIsLoading(false);
        }
    };

    const handleGeneratePersona = async () => {
        if (!personaOptions.backgroundPrompt.trim()) return;
        setIsLoading(true);
        setError(null);
        try {
            const backgroundUrl = await generateImageFromText(personaOptions.backgroundPrompt, personaOptions.aspectRatio);
            updateStateAndHistory({ bgUrl: backgroundUrl, finalUrl: null, personaOptions });
        } catch (err) {
            const errorMessage = err instanceof Error ? err.message : 'An unknown error occurred.';
            setError(`Failed to generate background. ${errorMessage}`);
        } finally {
            setIsLoading(false);
        }
    };

    const handleContinuePersona = async () => {
        if (!generatedBackgroundUrl) return;
        setIsLoading(true);
        setError(null);
        try {
            const backgroundFile = dataURLtoFile(generatedBackgroundUrl, 'background.jpg');
            const finalImageUrl = await compositePersonIntoScene(backgroundFile, personaOptions.person, personaOptions.posePrompt);
            updateStateAndHistory({ finalUrl: finalImageUrl, personaOptions });
        } catch (err) {
            const errorMessage = err instanceof Error ? err.message : 'An unknown error occurred.';
            setError(`Failed to add person to scene. ${errorMessage}`);
        } finally {
            setIsLoading(false);
        }
    };
    
    const handleUseInEditor = () => {
        const urlToUse = generatedImageUrl || generatedBackgroundUrl;
        if (urlToUse) {
            const file = dataURLtoFile(urlToUse, `design-studio-${Date.now()}.jpg`);
            onUseInEditor(file);
        }
    };

    const isScratchMode = mode === 'scratch';
    const canGenerateScratch = !isLoading && scratchPrompt.trim();
    const canGeneratePersona = !isLoading && personaOptions.backgroundPrompt.trim() && generationStep === 'setup';
    const canContinuePersona = !isLoading && generationStep === 'background-generated';
    const canUndo = historyIndex > 0;
    const canRedo = historyIndex < history.length - 1;


    const renderMainContent = () => {
        if (isLoading) {
            return (
                <div className="flex flex-col items-center gap-4 text-center">
                    <Spinner />
                    <p className="text-zinc-400">
                        {generationStep === 'setup' ? 'Creating your scene...' : 'Adding your persona...'}
                    </p>
                </div>
            );
        }
        if (error) {
            return (
                <div className="text-center text-red-400 max-w-md p-4 bg-red-900/20 border border-red-500/30 rounded-lg">
                    <h3 className="font-bold mb-2">Generation Failed</h3>
                    <p className="text-sm">{error}</p>
                </div>
            );
        }
        
        const imageToDisplay = generatedImageUrl || generatedBackgroundUrl;

        if (imageToDisplay) {
            return (
                <div className="relative w-full h-full flex items-center justify-center">
                    <img src={imageToDisplay} alt="Generated content" className="max-w-full max-h-full object-contain rounded-md animate-fade-in" />
                    <button
                        onClick={handleDownload}
                        className="absolute top-4 right-4 z-10 p-2.5 bg-black/60 backdrop-blur-sm rounded-lg text-zinc-200 hover:bg-zinc-700 hover:text-white transition-colors shadow-lg"
                        aria-label="Download Image"
                        title="Download Image"
                    >
                        <DownloadIcon className="w-6 h-6" />
                    </button>
                </div>
            );
        }
        return <div className="text-center text-zinc-600"><p>Your generated image will appear here.</p></div>;
    };

    return (
        <div className="w-full h-screen bg-zinc-950 flex flex-col p-4 sm:p-6 lg:p-8 overflow-hidden animate-fade-in">
            <header className="flex-shrink-0 flex items-center justify-between mb-6 gap-4">
                <div className="flex-1 min-w-0">
                    <h1 className="text-3xl font-bold text-white truncate">Design Studio</h1>
                    <p className="text-zinc-400 truncate">Generate anything with the power of AI.</p>
                </div>
                <div className="flex items-center gap-2">
                     <button 
                        onClick={handleUndo} 
                        disabled={!canUndo || isLoading}
                        className="p-2 rounded-lg text-zinc-400 hover:bg-zinc-800 hover:text-white transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                        aria-label="Undo"
                    >
                        <UndoIcon className="w-6 h-6" />
                    </button>
                    <button 
                        onClick={handleRedo} 
                        disabled={!canRedo || isLoading}
                        className="p-2 rounded-lg text-zinc-400 hover:bg-zinc-800 hover:text-white transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                        aria-label="Redo"
                    >
                        <RedoIcon className="w-6 h-6" />
                    </button>
                    <button onClick={onExit} className="p-2 rounded-lg text-zinc-400 hover:text-white transition-colors">
                        <svg xmlns="http://www.w3.org/2000/svg" className="h-7 w-7" fill="none" viewBox="0 0 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" /></svg>
                    </button>
                </div>
            </header>

            <div className="flex-1 flex flex-col md:flex-row gap-6 overflow-hidden">
                <aside className="w-full md:w-[420px] flex-shrink-0 flex flex-col bg-zinc-900 rounded-lg">
                    <div className="flex-shrink-0 p-4">
                        <div className="grid grid-cols-2 gap-2 p-1 bg-zinc-800 rounded-lg">
                            <button onClick={() => setMode('scratch')} className={`px-2 py-1.5 rounded-md text-sm font-semibold transition-colors ${isScratchMode ? 'bg-white text-black' : 'text-zinc-300 hover:bg-zinc-700'}`}>Generate from Scratch</button>
                            <button onClick={() => setMode('persona')} className={`px-2 py-1.5 rounded-md text-sm font-semibold transition-colors ${!isScratchMode ? 'bg-white text-black' : 'text-zinc-300 hover:bg-zinc-700'}`}>Create with Persona</button>
                        </div>
                    </div>

                    <div className="flex-1 overflow-y-auto p-4 space-y-4">
                        {isScratchMode ? (
                            <>
                                <div className="flex flex-col gap-2">
                                    <label htmlFor="scratch-prompt" className="text-sm font-medium text-zinc-300">Prompt</label>
                                    <textarea id="scratch-prompt" value={scratchPrompt} onChange={(e) => setScratchPrompt(e.target.value)} placeholder="A photorealistic raccoon in a business suit..." className="h-36 bg-zinc-800 border border-zinc-700 rounded-lg p-2 text-sm text-zinc-100 focus:outline-none focus:ring-1 focus:ring-yellow-400 transition-colors" disabled={isLoading} />
                                </div>
                                <div>
                                    <label className="text-sm font-medium text-zinc-300 mb-2 block">Aspect Ratio</label>
                                    <div className="grid grid-cols-5 gap-2">
                                        {aspectRatios.map(({key, icon: Icon}) => (
                                            <button key={key} onClick={() => setScratchAspectRatio(key)} disabled={isLoading} className={`py-2 rounded-lg text-xs font-semibold transition-colors disabled:opacity-50 flex flex-col items-center gap-1 ${scratchAspectRatio === key ? 'bg-white text-black' : 'bg-zinc-800 hover:bg-zinc-700 text-zinc-200'}`}><Icon className="w-5 h-5"/><span>{key}</span></button>
                                        ))}
                                    </div>
                                </div>
                            </>
                        ) : (
                            <>
                                <div className="flex flex-col gap-2">
                                    <label htmlFor="bg-prompt" className="text-sm font-medium text-zinc-300">1. Background Prompt</label>
                                    <textarea id="bg-prompt" value={personaOptions.backgroundPrompt} onChange={(e) => setPersonaOptions(p => ({ ...p, backgroundPrompt: e.target.value }))} placeholder="A futuristic city street at night..." className="h-24 bg-zinc-800 border border-zinc-700 rounded-lg p-2 text-sm text-zinc-100 focus:outline-none focus:ring-1 focus:ring-yellow-400 transition-colors" disabled={isLoading || generationStep !== 'setup'} />
                                </div>
                                <div>
                                    <label className="text-sm font-medium text-zinc-300 mb-2 block">Aspect Ratio</label>
                                    <div className="grid grid-cols-5 gap-2">
                                        {aspectRatios.map(({key, icon: Icon}) => (
                                            <button key={key} onClick={() => setPersonaOptions(p => ({ ...p, aspectRatio: key }))} disabled={isLoading || generationStep !== 'setup'} className={`py-2 rounded-lg text-xs font-semibold transition-colors disabled:opacity-50 flex flex-col items-center gap-1 ${personaOptions.aspectRatio === key ? 'bg-white text-black' : 'bg-zinc-800 hover:bg-zinc-700 text-zinc-200'}`}><Icon className="w-5 h-5"/><span>{key}</span></button>
                                        ))}
                                    </div>
                                </div>
                                <div className="flex flex-col gap-2">
                                    <label className="text-sm font-medium text-zinc-300">2. Add & Pose Person</label>
                                     <AddPersonControls 
                                        onOptionsChange={({ person, posePrompt }) => setPersonaOptions(p => ({ 
                                            ...p, 
                                            person: {...p.person, ...person},
                                            posePrompt,
                                        }))} 
                                        disabled={isLoading || generationStep !== 'setup'} 
                                    />
                                </div>
                            </>
                        )}
                    </div>
                    
                    <div className="flex-shrink-0 p-4 border-t border-zinc-800 space-y-2">
                        <button onClick={handleInspireMe} disabled={isLoading} className="w-full text-center text-sm font-semibold py-2 px-4 rounded-lg transition-colors bg-zinc-800 text-yellow-400 hover:bg-zinc-700 disabled:opacity-50">Inspire Me!</button>
                        {isScratchMode ? (
                            <button onClick={handleGenerateScratch} disabled={!canGenerateScratch} className="w-full bg-white text-black font-bold py-3 px-4 rounded-lg transition-colors hover:bg-zinc-200 disabled:bg-zinc-800 disabled:text-zinc-500 disabled:cursor-not-allowed">Generate</button>
                        ) : generationStep === 'setup' ? (
                            <button onClick={handleGeneratePersona} disabled={!canGeneratePersona} className="w-full bg-white text-black font-bold py-3 px-4 rounded-lg transition-colors hover:bg-zinc-200 disabled:bg-zinc-800 disabled:text-zinc-500 disabled:cursor-not-allowed">Generate Background</button>
                        ) : (
                            <div className="grid grid-cols-2 gap-2">
                                <button onClick={handleGeneratePersona} disabled={isLoading} className="w-full bg-zinc-700 text-zinc-200 font-semibold py-3 px-4 rounded-lg transition-colors hover:bg-zinc-600 disabled:opacity-50">Regenerate</button>
                                <button onClick={handleContinuePersona} disabled={!canContinuePersona} className="w-full bg-white text-black font-bold py-3 px-4 rounded-lg transition-colors hover:bg-zinc-200 disabled:opacity-50">Continue</button>
                            </div>
                        )}
                        {(generatedImageUrl || (generatedBackgroundUrl && !generatedImageUrl)) && (
                            <button onClick={handleUseInEditor} className="w-full bg-zinc-300 text-black font-semibold py-2 px-4 text-sm rounded-lg transition-colors hover:bg-white animate-fade-in">Use in Editor</button>
                        )}
                    </div>
                </aside>
                
                <main className="flex-1 bg-zinc-900 rounded-lg flex items-center justify-center p-4 relative overflow-hidden">
                    {renderMainContent()}
                </main>
            </div>
        </div>
    );
};

export default DesignStudio;