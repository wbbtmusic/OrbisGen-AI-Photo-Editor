/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
*/
import React, { useState, useRef, useEffect, useCallback } from 'react';
import { type PixelCrop } from 'react-image-crop';
import { motion, AnimatePresence } from 'framer-motion';
import './index.css';

import { 
  generateEditedImage, 
  generateFilteredImage,
  generateAdjustedImage,
  generateReplacedBackgroundImage,
  generateStudioEffect,
  generateInscribedText,
  generateReplacedSky,
  generateInsertedObject,
  generateColorGradedImage,
  generateFusedFaceImage,
  generateStyleTransferredImage,
  generateSwappedFaceImage,
  generateCompositedPersonImage,
  generateMakeupTransferredImage,
  generateFashionImage,
  generateMakeup,
  expandImage,
  generateStyledImage,
  generateNewCameraAngle,
} from './services/geminiService';
import { saveRecentProject, rotateImage, flipImageHorizontal } from './lib/utils';
import { type Tool, type HistoryEntry, type AddPersonOptions, type PersonaState, type GeneratedImage, type Theme, type Layer, type CameraAnglesState, type GeneratedAngleImage } from './types';
import EditorCanvas, { type EditorCanvasRef } from './components/EditorCanvas';
import Toolbar from './components/Toolbar';
import Header from './components/Header';
import ToolOptions from './components/ToolOptions';
import HomeScreen from './components/HomeScreen';
import PersonaResultsView from './components/PersonaResultsView';
import ZoomControls from './components/ZoomControls';
import DesignStudio from './components/DesignStudio';
import { dataURLtoFile, fileToDataURL } from './lib/utils';

const loadingMessages = [
  'Painting pixels...',
  'Consulting the digital muse...',
  'This may take a moment...',
  'Great art needs time.',
  'Analyzing perspectives...',
  'Reticulating splines...',
  'Generating brilliance...',
];

const App: React.FC = () => {
  const [activeTool, setActiveTool] = useState<Tool>('none');
  const [originalImageFile, setOriginalImageFile] = useState<File | null>(null);
  const [history, setHistory] = useState<HistoryEntry[]>([]);
  const [historyIndex, setHistoryIndex] = useState(-1);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [appState, setAppState] = useState<'home' | 'editor' | 'design-studio'>('home');
  const [isOptionsPanelOpen, setIsOptionsPanelOpen] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [layers, setLayers] = useState<Layer[]>([]);
  const [loadingMessage, setLoadingMessage] = useState(loadingMessages[0]);

  const editorCanvasRef = useRef<EditorCanvasRef>(null);
  const [selection, setSelection] = useState<PixelCrop | null>(null);
  const [aspect, setAspect] = useState<number | undefined>(undefined);
  
  // Zoom & Pan state
  const [zoom, setZoom] = useState(1);
  const [pan, setPan] = useState({ x: 0, y: 0 });

  // AI Personas State
  const [personaState, setPersonaState] = useState<PersonaState>({
    status: 'theme-selection',
    selectedTheme: null,
    generationCategories: [],
  });
  const [generatedImages, setGeneratedImages] = useState<Record<string, GeneratedImage>>({});

  // Camera Angles State
  const [cameraAnglesState, setCameraAnglesState] = useState<CameraAnglesState>({
    status: 'selection',
    generationPrompts: [],
  });
  const [generatedAngleImages, setGeneratedAngleImages] = useState<Record<string, GeneratedAngleImage>>({});

  
  const currentImageUrl = history[historyIndex]?.imageUrl;
  
  useEffect(() => {
    let intervalId: number | undefined;
    if (isLoading) {
      intervalId = window.setInterval(() => {
        setLoadingMessage(prev => {
          const currentIndex = loadingMessages.indexOf(prev);
          const nextIndex = (currentIndex + 1) % loadingMessages.length;
          return loadingMessages[nextIndex];
        });
      }, 2500);
    }
    return () => {
      if (intervalId) {
        clearInterval(intervalId);
      }
    };
  }, [isLoading]);
  
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.ctrlKey || e.metaKey) && e.key === 'z' && !e.shiftKey) {
        e.preventDefault();
        handleUndo();
      }
      if ((e.ctrlKey || e.metaKey) && e.key === 'z' && e.shiftKey) {
        e.preventDefault();
        handleRedo();
      }
      if ((e.ctrlKey || e.metaKey) && e.key === 'd') {
        e.preventDefault();
        handleDeselect();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [historyIndex, history.length]);

  useEffect(() => {
    // When switching to a tool that doesn't have a panel, close it on mobile.
    if (activeTool === 'none' || activeTool === 'layers') {
        setIsOptionsPanelOpen(false);
    }
  }, [activeTool]);

  const updateHistory = (newImageUrl: string) => {
    const newHistory = history.slice(0, historyIndex + 1);
    setHistory([...newHistory, { imageUrl: newImageUrl }]);
    setHistoryIndex(newHistory.length);
  };

  const handleFileSelect = async (file: File) => {
    setOriginalImageFile(file);
    try {
        const imageUrl = await fileToDataURL(file);
        setHistory([{ imageUrl }]);
        setHistoryIndex(0);
        setLayers([]);
        setActiveTool('adjust'); 
        setIsOptionsPanelOpen(window.innerWidth >= 768); // Open panel on desktop
        setAppState('editor');
        saveRecentProject(file);
        setPersonaState({ status: 'theme-selection', selectedTheme: null, generationCategories: [] });
        setGeneratedImages({});
        setCameraAnglesState({ status: 'selection', generationPrompts: [] });
        setGeneratedAngleImages({});
    } catch (err) {
        console.error("Error converting file to data URL:", err);
        setError("Could not read the selected file. Please try again.");
    }
  };
  
  const handleGoHome = () => {
      setOriginalImageFile(null);
      setHistory([]);
      setHistoryIndex(-1);
      setLayers([]);
      setActiveTool('none');
      setAppState('home');
      setPersonaState({ status: 'theme-selection', selectedTheme: null, generationCategories: [] });
      setGeneratedImages({});
      setCameraAnglesState({ status: 'selection', generationPrompts: [] });
      setGeneratedAngleImages({});
      setIsOptionsPanelOpen(false);
  };

  const handleGoToDesignStudio = () => {
      setAppState('design-studio');
  };

  const handleUndo = () => {
    if (historyIndex > 0) {
      setHistoryIndex(historyIndex - 1);
    }
  };

  const handleRedo = () => {
    if (historyIndex < history.length - 1) {
      setHistoryIndex(historyIndex + 1);
    }
  };

  const handleDownload = () => {
    if (!currentImageUrl) return;
    const link = document.createElement('a');
    link.href = currentImageUrl;
    const filename = originalImageFile?.name.replace(/(\.[\w\d_-]+)$/i, '_edited$1') || 'edited-image.png';
    link.download = filename;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };
  
  const handleOpenFile = () => {
    const input = document.createElement('input');
    input.type = 'file';
    input.accept = 'image/*';
    input.onchange = (e) => {
        const target = e.target as HTMLInputElement;
        if (target.files && target.files.length > 0) {
            handleFileSelect(target.files[0]);
        }
    };
    input.click();
  };

  const handleToolSelect = (tool: Tool) => {
    if (activeTool === tool && window.innerWidth < 768) {
        setIsOptionsPanelOpen(prev => !prev);
    } else {
        setActiveTool(tool);
        if (tool !== 'none') {
            setIsOptionsPanelOpen(true);
        } else {
            setIsOptionsPanelOpen(false);
        }
    }
    setSearchTerm(''); // Clear search on any tool selection.
  };

  const runGenerativeTask = useCallback(async (
    task: (currentImageFile: File, ...args: any[]) => Promise<string>,
    ...args: any[]
  ) => {
    if (!currentImageUrl) return;
    setIsLoading(true);
    setError(null);

    try {
      const currentImageFile = dataURLtoFile(currentImageUrl, originalImageFile?.name || 'current-image.png');
      const newImageUrl = await task(currentImageFile, ...args);
      updateHistory(newImageUrl);
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'An unknown error occurred.';
      setError(errorMessage);
    } finally {
      setIsLoading(false);
    }
  }, [currentImageUrl, originalImageFile?.name]);

  const runCanvasTask = useCallback(async (
    task: (imageUrl: string, ...args: any[]) => Promise<string>,
    ...args: any[]
  ) => {
    if (!currentImageUrl) return;
    setIsLoading(true);
    setError(null);

    try {
      const newImageUrl = await task(currentImageUrl, ...args);
      updateHistory(newImageUrl);
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'An unknown error occurred.';
      setError(errorMessage);
    } finally {
      setIsLoading(false);
    }
  }, [currentImageUrl]);

  const handleRotate = (degrees: number) => {
    runCanvasTask(rotateImage, degrees);
  };

  const handleFlipHorizontal = () => {
    runCanvasTask(flipImageHorizontal);
  };

  const handleGeneratePersonas = useCallback(async (theme: Theme, categories: string[]) => {
    if (!originalImageFile) return;

    setIsLoading(true);
    setIsOptionsPanelOpen(false);
    setPersonaState({ status: 'generating', selectedTheme: theme, generationCategories: categories });
    setGeneratedImages(
      categories.reduce((acc, category) => ({ ...acc, [category]: { status: 'pending' } }), {})
    );

    await Promise.allSettled(categories.map(async (category) => {
      try {
        const prompt = theme.getPrompt(category);
        const newImageUrl = await generateStyledImage(originalImageFile, prompt);
        setGeneratedImages(prev => ({
          ...prev,
          [category]: { status: 'done', url: newImageUrl },
        }));
      } catch (err) {
        console.error(`Error generating persona for category "${category}":`, err);
        const errorMessage = err instanceof Error ? err.message : 'Generation failed.';
        setGeneratedImages(prev => ({
          ...prev,
          [category]: { status: 'error', error: errorMessage },
        }));
      }
    }));
    
    setIsLoading(false);
    setPersonaState(prev => ({ ...prev, status: 'results-shown' }));
  }, [originalImageFile]);

  const handleGenerateCameraAngles = useCallback(async (prompts: { name: string, prompt: string }[]) => {
    if (!originalImageFile) return;

    setIsLoading(true);
    setIsOptionsPanelOpen(false);
    setCameraAnglesState({ status: 'generating', generationPrompts: prompts });
    setGeneratedAngleImages(
      prompts.reduce((acc, p) => ({ ...acc, [p.name]: { status: 'pending' } }), {})
    );

    await Promise.allSettled(prompts.map(async (p) => {
      try {
        const newImageUrl = await generateNewCameraAngle(originalImageFile, p.prompt);
        setGeneratedAngleImages(prev => ({
          ...prev,
          [p.name]: { status: 'done', url: newImageUrl },
        }));
      } catch (err) {
        console.error(`Error generating camera angle for "${p.name}":`, err);
        const errorMessage = err instanceof Error ? err.message : 'Generation failed.';
        setGeneratedAngleImages(prev => ({
          ...prev,
          [p.name]: { status: 'error', error: errorMessage },
        }));
      }
    }));
    
    setIsLoading(false);
    setCameraAnglesState(prev => ({ ...prev, status: 'results-shown' }));
  }, [originalImageFile]);


  const handleUseGeneratedImageInEditor = (imageUrl: string) => {
      const newHistory = [{ imageUrl }];
      setHistory(newHistory);
      setHistoryIndex(0);
      
      const newFile = dataURLtoFile(imageUrl, originalImageFile?.name || 'generated.png');
      setOriginalImageFile(newFile);
      
      // Reset all generation states
      setPersonaState({ status: 'theme-selection', selectedTheme: null, generationCategories: [] });
      setGeneratedImages({});
      setCameraAnglesState({ status: 'selection', generationPrompts: [] });
      setGeneratedAngleImages({});
      
      setActiveTool('adjust');
      setIsOptionsPanelOpen(true);
  };

  const handleApplyCrop = () => {
    if (!editorCanvasRef.current || !selection || selection.width === 0) return;
    const croppedDataUrl = editorCanvasRef.current.getCroppedDataURL('image/png');
    if (croppedDataUrl) {
        updateHistory(croppedDataUrl);
        const croppedFile = dataURLtoFile(croppedDataUrl, originalImageFile?.name || 'cropped.png');
        setOriginalImageFile(croppedFile);
    }
    setActiveTool('adjust');
  };
  
  const handleApplyGenerativeAction = (
    generator: (image: File, prompt: string, selection?: PixelCrop) => Promise<string>,
    prompt: string
  ) => {
    if (!selection && ['retouch', 'portrait', 'textGen', 'insert'].includes(activeTool)) {
      setError("Please make a selection on the image first.");
      return;
    }
    const args = ['retouch', 'portrait', 'textGen', 'insert'].includes(activeTool) ? [prompt, selection] : [prompt];
    runGenerativeTask(generator as any, ...args);
  };

  // Layer Management
    const handleAddLayer = async (file: File) => {
        try {
            const imageUrl = await fileToDataURL(file);
            const newLayer: Layer = {
                id: `layer-${Date.now()}`,
                name: file.name,
                imageUrl,
                opacity: 1,
                visible: true,
            };
            setLayers(prev => [...prev, newLayer]);
        } catch (err) {
            setError("Could not read the selected file for the layer.");
        }
    };

    const handleUpdateLayer = (id: string, updates: Partial<Omit<Layer, 'id' | 'name' | 'imageUrl'>>) => {
        setLayers(prev => prev.map(l => l.id === id ? { ...l, ...updates } : l));
    };

    const handleRemoveLayer = (id: string) => {
        setLayers(prev => prev.filter(l => l.id !== id));
    };

    const handleFlattenLayers = async () => {
        if (!currentImageUrl) return;
        setIsLoading(true);

        const canvas = document.createElement('canvas');
        const ctx = canvas.getContext('2d');
        if (!ctx) {
            setError('Could not create canvas to flatten layers.');
            setIsLoading(false);
            return;
        }

        try {
            const baseImage = new Image();
            baseImage.crossOrigin = "anonymous";
            baseImage.src = currentImageUrl;
            await new Promise((res, rej) => { baseImage.onload = res; baseImage.onerror = rej; });

            canvas.width = baseImage.naturalWidth;
            canvas.height = baseImage.naturalHeight;

            ctx.drawImage(baseImage, 0, 0);

            for (const layer of layers) {
                if (layer.visible && layer.opacity > 0) {
                    const layerImage = new Image();
                    layerImage.crossOrigin = "anonymous";
                    layerImage.src = layer.imageUrl;
                    await new Promise((res, rej) => { layerImage.onload = res; layerImage.onerror = rej; });

                    ctx.globalAlpha = layer.opacity;

                    // Replicate object-contain behavior
                    const canvasAspect = canvas.width / canvas.height;
                    const layerAspect = layerImage.naturalWidth / layerImage.naturalHeight;
                    let sx=0, sy=0, sw=layerImage.naturalWidth, sh=layerImage.naturalHeight;
                    let dx=0, dy=0, dw=canvas.width, dh=canvas.height;

                    if (layerAspect > canvasAspect) {
                        dh = dw / layerAspect;
                        dy = (canvas.height - dh) / 2;
                    } else {
                        dw = dh * layerAspect;
                        dx = (canvas.width - dw) / 2;
                    }
                    
                    ctx.drawImage(layerImage, sx, sy, sw, sh, dx, dy, dw, dh);
                    ctx.globalAlpha = 1;
                }
            }

            const flattenedUrl = canvas.toDataURL('image/png');
            updateHistory(flattenedUrl);
            setLayers([]);
            setActiveTool('adjust');
        } catch (err) {
            console.error(err);
            setError('An error occurred while flattening the layers.');
        } finally {
            setIsLoading(false);
        }
    };
  
  const handleDeselect = () => {
    editorCanvasRef.current?.clearSelection();
  };


  if (appState === 'home') {
    return <HomeScreen onFileSelect={handleFileSelect} onGoToDesignStudio={handleGoToDesignStudio} />;
  }
  
  if (appState === 'design-studio') {
      return <DesignStudio onExit={handleGoHome} onUseInEditor={handleFileSelect} />;
  }

  const isPersonaResultsVisible = activeTool === 'personas' && 
    (personaState.status === 'generating' || personaState.status === 'results-shown');
  
  const isCameraAnglesResultsVisible = activeTool === 'cameraAngles' &&
    (cameraAnglesState.status === 'generating' || cameraAnglesState.status === 'results-shown');

  const isGenerationViewVisible = isPersonaResultsVisible || isCameraAnglesResultsVisible;


  const canUndo = historyIndex > 0;
  const canRedo = historyIndex < history.length - 1;

  return (
    <div className="w-screen h-screen bg-zinc-950 text-white flex flex-col overflow-hidden">
      <Header
        onGoHome={handleGoHome}
        onOpenFile={handleOpenFile}
        onDownload={handleDownload}
        onUndo={handleUndo}
        onRedo={handleRedo}
        canUndo={canUndo}
        canRedo={canRedo}
        hasImage={!!currentImageUrl}
        activeTool={activeTool}
        onRotate={() => handleRotate(90)}
        onFlipHorizontal={handleFlipHorizontal}
        searchTerm={searchTerm}
        onSearchTermChange={setSearchTerm}
        onSelectTool={handleToolSelect}
        onDeselect={handleDeselect}
      />
      <main className="flex-1 flex flex-col md:flex-row overflow-hidden">
        {/* Desktop Toolbar (Left) */}
        <div className="hidden md:flex flex-shrink-0">
          <Toolbar 
            activeTool={activeTool} 
            setActiveTool={handleToolSelect} 
            disabled={isLoading} 
          />
        </div>

        {/* Center Content (Canvas + Mobile Toolbar) */}
        <div className="flex-1 flex flex-col relative overflow-hidden bg-zinc-950">
          <div className="flex-1 relative flex items-center justify-center overflow-hidden">
            {isGenerationViewVisible ? (
              <PersonaResultsView 
                title={isPersonaResultsVisible ? 'AI Personas' : 'Camera Angles'}
                subtitle={isPersonaResultsVisible ? personaState.selectedTheme?.title : 'Generated from new perspectives'}
                generationCategories={isPersonaResultsVisible ? personaState.generationCategories : cameraAnglesState.generationPrompts.map(p => p.name)}
                generatedImages={isPersonaResultsVisible ? generatedImages : generatedAngleImages}
                onUseInEditor={handleUseGeneratedImageInEditor}
                onBack={() => {
                  if (isPersonaResultsVisible) {
                    setPersonaState({ status: 'theme-selection', selectedTheme: null, generationCategories: [] });
                    setGeneratedImages({});
                  } else {
                    setCameraAnglesState({ status: 'selection', generationPrompts: [] });
                    setGeneratedAngleImages({});
                  }
                  setIsOptionsPanelOpen(true);
                }}
                isGenerating={isLoading}
              />
            ) : currentImageUrl ? (
              <EditorCanvas
                  ref={editorCanvasRef}
                  imageUrl={currentImageUrl}
                  activeTool={activeTool}
                  aspect={aspect}
                  onSelectionChange={setSelection}
                  zoom={zoom}
                  setZoom={setZoom}
                  pan={pan}
                  setPan={setPan}
                  layers={layers}
              />
            ) : (
                <p>Upload an image to get started.</p>
            )}

            {currentImageUrl && !isGenerationViewVisible && (
              <ZoomControls
                zoom={zoom}
                setZoom={setZoom}
                onReset={() => { setZoom(1); setPan({ x: 0, y: 0 }); }}
              />
            )}

            {isLoading && !isGenerationViewVisible && (
              <div className="absolute inset-0 bg-black/60 flex flex-col items-center justify-center z-50 animate-fade-in-fast">
                <div className="loader"></div>
                <p className="mt-4 text-lg font-semibold">AI is thinking...</p>
                <p className="text-sm text-neutral-300">{loadingMessage}</p>
              </div>
            )}

            {error && (
                <div className="absolute bottom-4 left-4 right-4 bg-red-800/90 text-white p-4 rounded-lg shadow-lg z-50 animate-fade-in-fast flex justify-between items-center">
                    <div>
                        <p className="font-bold">Error</p>
                        <p className="text-sm">{error}</p>
                    </div>
                    <button onClick={() => setError(null)} className="p-1 rounded-full hover:bg-red-700">
                        <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" /></svg>
                    </button>
                </div>
            )}
          </div>
          
          {/* Mobile Toolbar */}
          <div className="md:hidden flex-shrink-0">
            {!isGenerationViewVisible && 
              <Toolbar 
                activeTool={activeTool} 
                setActiveTool={handleToolSelect} 
                disabled={isLoading} 
              />
            }
          </div>
        </div>

        {/* Right Side Panel (Desktop) / Bottom Sheet (Mobile) */}
        {!isGenerationViewVisible && (
            <div className="hidden md:flex md:w-80 md:flex-shrink-0">
                <ToolOptions
                    activeTool={activeTool} isLoading={isLoading} hasSelection={!!selection && selection.width > 0}
                    onApplyGenerativeEdit={(prompt) => handleApplyGenerativeAction(generateEditedImage, prompt)}
                    onApplyCrop={handleApplyCrop} onSetAspect={setAspect} isCropping={!!selection && selection.width > 0}
                    onApplyAdjustment={(prompt) => runGenerativeTask(generateAdjustedImage, prompt)}
                    onApplyFilter={(prompt) => runGenerativeTask(generateFilteredImage, prompt)}
                    onApplyReplaceBackground={(prompt) => runGenerativeTask(generateReplacedBackgroundImage, prompt)}
                    onApplyStudioEffect={(prompt) => runGenerativeTask(generateStudioEffect, prompt)}
                    onApplyText={(text, style) => runGenerativeTask(generateInscribedText, text, style, selection)}
                    onApplySky={(prompt) => runGenerativeTask(generateReplacedSky, prompt)}
                    onApplyInsert={(prompt) => handleApplyGenerativeAction(generateInsertedObject, prompt)}
                    onApplyColorGrade={(styleImage) => runGenerativeTask(generateColorGradedImage, styleImage)}
                    onApplyFaceFusion={(faceRefImage) => runGenerativeTask(generateFusedFaceImage, faceRefImage)}
                    onApplyClothingTransfer={(styleRefImage) => runGenerativeTask(generateStyleTransferredImage, styleRefImage)}
                    onApplyFaceSwap={(faceRefImage) => runGenerativeTask(generateSwappedFaceImage, faceRefImage)}
                    onApplyAddPerson={(options: AddPersonOptions) => runGenerativeTask(generateCompositedPersonImage, options)}
                    onApplyMakeupTransfer={(makeupRefImage) => runGenerativeTask(generateMakeupTransferredImage, makeupRefImage)}
                    onApplyFashion={(prompt) => runGenerativeTask(generateFashionImage, prompt)}
                    onApplyMakeup={(prompt) => runGenerativeTask(generateMakeup, prompt)}
                    onApplyRandomize={() => runGenerativeTask(expandImage, 'Be creative and completely transform this into a new, surprising image. Change the scene, style, and subject in an unexpected way.')}
                    originalImageFile={originalImageFile} onGeneratePersonas={handleGeneratePersonas} onUsePersonaInEditor={handleUseGeneratedImageInEditor}
                    personaState={personaState} setPersonaState={setPersonaState} generatedImages={generatedImages}
                    layers={layers} onAddLayer={handleAddLayer} onUpdateLayer={handleUpdateLayer} onRemoveLayer={handleRemoveLayer} onFlattenLayers={handleFlattenLayers}
                    onGenerateCameraAngles={handleGenerateCameraAngles} cameraAnglesState={cameraAnglesState} setCameraAnglesState={setCameraAnglesState} generatedAngleImages={generatedAngleImages}
                />
            </div>
        )}

        <AnimatePresence>
          {isOptionsPanelOpen && activeTool !== 'none' && !isGenerationViewVisible && (
            <motion.div
              initial={{ y: "100%" }}
              animate={{ y: "0%" }}
              exit={{ y: "100%" }}
              transition={{ type: "tween", duration: 0.3, ease: "easeInOut" }}
              className="md:hidden fixed bottom-20 left-0 right-0 z-40 bg-zinc-900 rounded-t-2xl shadow-[0_-10px_30px_-15px_rgba(0,0,0,0.3)] max-h-[60vh] flex flex-col"
            >
              <ToolOptions
                  activeTool={activeTool} isLoading={isLoading} hasSelection={!!selection && selection.width > 0}
                  onApplyGenerativeEdit={(prompt) => handleApplyGenerativeAction(generateEditedImage, prompt)}
                  onApplyCrop={handleApplyCrop} onSetAspect={setAspect} isCropping={!!selection && selection.width > 0}
                  onApplyAdjustment={(prompt) => runGenerativeTask(generateAdjustedImage, prompt)}
                  onApplyFilter={(prompt) => runGenerativeTask(generateFilteredImage, prompt)}
                  onApplyReplaceBackground={(prompt) => runGenerativeTask(generateReplacedBackgroundImage, prompt)}
                  onApplyStudioEffect={(prompt) => runGenerativeTask(generateStudioEffect, prompt)}
                  onApplyText={(text, style) => runGenerativeTask(generateInscribedText, text, style, selection)}
                  onApplySky={(prompt) => runGenerativeTask(generateReplacedSky, prompt)}
                  onApplyInsert={(prompt) => handleApplyGenerativeAction(generateInsertedObject, prompt)}
                  onApplyColorGrade={(styleImage) => runGenerativeTask(generateColorGradedImage, styleImage)}
                  onApplyFaceFusion={(faceRefImage) => runGenerativeTask(generateFusedFaceImage, faceRefImage)}
                  onApplyClothingTransfer={(styleRefImage) => runGenerativeTask(generateStyleTransferredImage, styleRefImage)}
                  onApplyFaceSwap={(faceRefImage) => runGenerativeTask(generateSwappedFaceImage, faceRefImage)}
                  onApplyAddPerson={(options: AddPersonOptions) => runGenerativeTask(generateCompositedPersonImage, options)}
                  onApplyMakeupTransfer={(makeupRefImage) => runGenerativeTask(generateMakeupTransferredImage, makeupRefImage)}
                  onApplyFashion={(prompt) => runGenerativeTask(generateFashionImage, prompt)}
                  onApplyMakeup={(prompt) => runGenerativeTask(generateMakeup, prompt)}
                  onApplyRandomize={() => runGenerativeTask(expandImage, 'Be creative and completely transform this into a new, surprising image. Change the scene, style, and subject in an unexpected way.')}
                  originalImageFile={originalImageFile} onGeneratePersonas={handleGeneratePersonas} onUsePersonaInEditor={handleUseGeneratedImageInEditor}
                  personaState={personaState} setPersonaState={setPersonaState} generatedImages={generatedImages}
                  onClose={() => setIsOptionsPanelOpen(false)}
                  layers={layers} onAddLayer={handleAddLayer} onUpdateLayer={handleUpdateLayer} onRemoveLayer={handleRemoveLayer} onFlattenLayers={handleFlattenLayers}
                  onGenerateCameraAngles={handleGenerateCameraAngles} cameraAnglesState={cameraAnglesState} setCameraAnglesState={setCameraAnglesState} generatedAngleImages={generatedAngleImages}
              />
            </motion.div>
          )}
        </AnimatePresence>
      </main>
    </div>
  );
};

export default App;