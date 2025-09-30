/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
*/
import React, { useState, useRef, useEffect, useCallback, useMemo } from 'react';
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
  generateMakeup,
  expandImage,
  generateStyledImage,
  generateNewCameraAngle,
  generateModelImage,
  generateVirtualTryOnImage,
  generatePoseVariation,
  generativeExpand,
  generateTimeTraveledImage,
  generateProjectedTexture,
  generateCosplayImage,
  generateAlternateHistoryImage,
  generateShuffledImage
} from './services/geminiService';
import { saveRecentProject, rotateImage, flipImageHorizontal } from './lib/utils';
import { type Tool, type HistoryEntry, type AddPersonOptions, type AestheticState, type GeneratedImage, type Theme, type Layer, type CameraAnglesState, type GeneratedAngleImage, type OutfitLayer, type WardrobeItem, type TimeTravelerState, GeneratedTimeTravelerImage, type CosplayOptions, type CosplayState, type GeneratedCosplayImage } from './types';
import EditorCanvas, { type EditorCanvasRef } from './components/EditorCanvas';
import Toolbar from './components/Toolbar';
import Header from './components/Header';
import ToolOptions from './components/ToolOptions';
import HomeScreen from './components/HomeScreen';
import AestheticResultsView from './components/PersonaResultsView';
import ZoomControls from './components/ZoomControls';
import DesignStudio from './components/DesignStudio';
import DisclaimerModal from './components/DisclaimerModal';
import ApiKeyModal from './components/ApiKeyModal';
import { dataURLtoFile, fileToDataURL } from './lib/utils';
import { AdjustSlidersIcon } from './components/icons';
import { defaultWardrobe } from './lib/wardrobe';
import FashionPoseControls, { POSE_INSTRUCTIONS } from './components/FashionPoseControls';
import { cosplayPoses } from './components/CosplayPanel';

const loadingMessages = [
  'Painting pixels...',
  'Consulting the digital muse...',
  'This may take a moment...',
  'Great art needs time.',
  'Analyzing perspectives...',
  'Reticulating splines...',
  'Generating brilliance...',
];

const initialAddPersonOptions: AddPersonOptions = {
  prompt: '',
  personRefImage: null,
  placement: 'center',
  familiarity: `Pose the person as a stranger, maintaining a polite and respectful distance. CRITICAL: The main subject's expression and clothing MUST be perfectly preserved.`,
  gazeDirection: 'looking at camera',
  faceDirection: 'facing camera',
  preserveMainSubjectPose: false,
  style: 'normal',
  posePrompt: '',
  lightingMatch: 'match',
};

const initialCosplayOptions: CosplayOptions = {
  characterName: '',
  characterRefImage: null,
  pose: cosplayPoses[0].prompt, // Set a default pose
  environmentPrompt: '',
  environmentOption: 'original',
  numberOfOutputs: 1,
  transferHair: true,
  transferClothing: true,
  transferEquipment: true,
  copyPose: false,
  preserveOriginalPose: false,
};


const App: React.FC = () => {
  const [activeTool, setActiveTool] = useState<Tool>('none');
  const [originalImageFile, setOriginalImageFile] = useState<File | null>(null);
  const [history, setHistory] = useState<HistoryEntry[]>([]);
  const [historyIndex, setHistoryIndex] = useState(-1);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [appState, setAppState] = useState<'home' | 'editor' | 'design-studio'>('home');
  const [isToolPanelVisible, setIsToolPanelVisible] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [layers, setLayers] = useState<Layer[]>([]);
  const [loadingMessage, setLoadingMessage] = useState(loadingMessages[0]);
  const [showDisclaimer, setShowDisclaimer] = useState(false);
  const [showApiKeyModal, setShowApiKeyModal] = useState(false);

  const editorCanvasRef = useRef<EditorCanvasRef>(null);
  const [selection, setSelection] = useState<PixelCrop | null>(null);
  const [aspect, setAspect] = useState<number | undefined>(undefined);
  
  // Zoom & Pan state
  const [zoom, setZoom] = useState(1);
  const [pan, setPan] = useState({ x: 0, y: 0 });

  // Aesthetic AI State
  const [aestheticState, setAestheticState] = useState<AestheticState>({
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

  // Time Traveler State
  const [timeTravelerState, setTimeTravelerState] = useState<TimeTravelerState>({
    status: 'selection',
    generationPrompts: [],
  });
  const [generatedTimeTravelerImages, setGeneratedTimeTravelerImages] = useState<Record<string, GeneratedTimeTravelerImage>>({});
  
  // Cosplay AI State
  const [cosplayState, setCosplayState] = useState<CosplayState>({ status: 'setup' });
  const [generatedCosplayImages, setGeneratedCosplayImages] = useState<Record<string, GeneratedCosplayImage>>({});


  // Tool Options State
  const [addPersonOptions, setAddPersonOptions] = useState<AddPersonOptions>(initialAddPersonOptions);
  const [cosplayOptions, setCosplayOptions] = useState<CosplayOptions>(initialCosplayOptions);
  
  // Fashion AI State
  const [fashionState, setFashionState] = useState({
    modelImageUrl: null as string | null,
    outfitHistory: [] as OutfitLayer[],
    currentOutfitIndex: 0,
    currentPoseIndex: 0,
    wardrobe: defaultWardrobe,
    status: 'create_model' as 'create_model' | 'dressing_room',
  });

  const currentImageUrl = history[historyIndex]?.imageUrl;
  
  useEffect(() => {
    try {
      const hasAccepted = localStorage.getItem('orbisGenDisclaimerAccepted');
      if (hasAccepted !== 'true') {
        setShowDisclaimer(true);
      }
    } catch (error) {
      console.error("Could not access localStorage:", error);
      setShowDisclaimer(true); 
    }

    try {
        const hasEnvKey = !!process.env.API_KEY;
        const hasUserKey = !!localStorage.getItem('orbisGenUserApiKey');
        if (!hasEnvKey && !hasUserKey) {
            setShowApiKeyModal(true);
        }
    } catch (error) {
        console.error("Could not access localStorage for API key check:", error);
        if (!process.env.API_KEY) {
            setShowApiKeyModal(true);
        }
    }
  }, []);

  useEffect(() => {
    if (window.innerWidth < 768) {
      setIsToolPanelVisible(false);
    }
  }, []);

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

  const updateHistory = (newImageUrl: string) => {
    const newHistory = history.slice(0, historyIndex + 1);
    setHistory([...newHistory, { imageUrl: newImageUrl }]);
    setHistoryIndex(newHistory.length);
  };

  const handleFileSelect = async (file: File, initialTool?: Tool) => {
    setOriginalImageFile(file);
    try {
        const imageUrl = await fileToDataURL(file);
        setHistory([{ imageUrl }]);
        setHistoryIndex(0);
        setLayers([]);
        setActiveTool(initialTool || 'adjust'); 
        setIsToolPanelVisible(true);
        setAppState('editor');
        saveRecentProject(file);
        // Reset all tool-specific states
        setAestheticState({ status: 'theme-selection', selectedTheme: null, generationCategories: [] });
        setGeneratedImages({});
        setCameraAnglesState({ status: 'selection', generationPrompts: [] });
        setGeneratedAngleImages({});
        setTimeTravelerState({ status: 'selection', generationPrompts: [] });
        setGeneratedTimeTravelerImages({});
        setCosplayState({ status: 'setup' });
        setGeneratedCosplayImages({});
        setAddPersonOptions(initialAddPersonOptions);
        setCosplayOptions(initialCosplayOptions);
        setFashionState({ modelImageUrl: null, outfitHistory: [], currentOutfitIndex: 0, currentPoseIndex: 0, wardrobe: defaultWardrobe, status: 'create_model' });
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
      setAestheticState({ status: 'theme-selection', selectedTheme: null, generationCategories: [] });
      setGeneratedImages({});
      setCameraAnglesState({ status: 'selection', generationPrompts: [] });
      setGeneratedAngleImages({});
      setTimeTravelerState({ status: 'selection', generationPrompts: [] });
      setGeneratedTimeTravelerImages({});
      setCosplayState({ status: 'setup' });
      setGeneratedCosplayImages({});
      setAddPersonOptions(initialAddPersonOptions);
      setCosplayOptions(initialCosplayOptions);
      setFashionState({ modelImageUrl: null, outfitHistory: [], currentOutfitIndex: 0, currentPoseIndex: 0, wardrobe: defaultWardrobe, status: 'create_model' });
      setIsToolPanelVisible(false);
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

  const handleDownload = async () => {
    if (!currentImageUrl) return;
    const filename = originalImageFile?.name.replace(/(\.[\w\d_-]+)$/i, '_edited$1') || 'edited-image.png';
    try {
        const response = await fetch(currentImageUrl);
        const blob = await response.blob();
        const url = window.URL.createObjectURL(blob);
        const link = document.createElement('a');
        link.href = url;
        link.download = filename;
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        window.URL.revokeObjectURL(url);
    } catch (error) {
        console.error("Download failed, using fallback:", error);
        const link = document.createElement('a');
        link.href = currentImageUrl;
        link.download = filename;
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
    }
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
    setActiveTool(tool);
    setSearchTerm(''); // Clear search on any tool selection.
    setIsToolPanelVisible(true);
  };

  const runGenerativeTask = useCallback(async (
    task: (currentImageFile: File, ...args: any[]) => Promise<string>,
    ...args: any[]
  ) => {
    if (!currentImageUrl) return;
    setIsToolPanelVisible(false);
    setIsLoading(true);
    setError(null);

    try {
      const currentImageFile = dataURLtoFile(currentImageUrl, originalImageFile?.name || 'current-image.png');
      const newImageUrl = await task(currentImageFile, ...args);
      updateHistory(newImageUrl);
    } catch (err) {
      // FIX: Correctly handle unknown error from catch block by checking its type.
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
      // FIX: Correctly handle unknown error from catch block by checking its type.
      const errorMessage = err instanceof Error ? err.message : 'An unknown error occurred.';
      setError(errorMessage);
    } finally {
      setIsLoading(false);
    }
  }, [currentImageUrl]);

  // --- FASHION AI LOGIC ---
  const handleCreateModel = async () => {
    if (!originalImageFile) return;
    setIsLoading(true);
    setLoadingMessage('Creating your model...');
    setError(null);
    try {
      const generatedUrl = await generateModelImage(originalImageFile);
      setFashionState(prev => ({
        ...prev,
        modelImageUrl: generatedUrl,
        outfitHistory: [{ garment: null, poseImages: { [POSE_INSTRUCTIONS[0]]: generatedUrl } }],
        currentOutfitIndex: 0,
        status: 'dressing_room'
      }));
      updateHistory(generatedUrl);
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to create model';
      setError(errorMessage);
    } finally {
      setIsLoading(false);
    }
  };
  
  const handleGarmentSelect = useCallback(async (garmentFile: File, garmentInfo: WardrobeItem) => {
    if (!currentImageUrl || isLoading) return;
    
    const { outfitHistory, currentOutfitIndex, wardrobe } = fashionState;
    const nextLayer = outfitHistory[currentOutfitIndex + 1];
    if (nextLayer && nextLayer.garment?.id === garmentInfo.id) {
        setFashionState(prev => ({ ...prev, currentOutfitIndex: prev.currentOutfitIndex + 1, currentPoseIndex: 0 }));
        return;
    }

    setError(null);
    setIsLoading(true);
    setLoadingMessage(`Adding ${garmentInfo.name}...`);
    try {
      const currentImageFile = dataURLtoFile(currentImageUrl, 'current_model.png');
      const newImageUrl = await generateVirtualTryOnImage(currentImageFile, garmentFile);
      const newLayer: OutfitLayer = { 
        garment: garmentInfo, 
        poseImages: { [POSE_INSTRUCTIONS[0]]: newImageUrl } 
      };
      updateHistory(newImageUrl);
      
      const newOutfitHistory = [...outfitHistory.slice(0, currentOutfitIndex + 1), newLayer];
      const newWardrobe = !wardrobe.find(item => item.id === garmentInfo.id) ? [...wardrobe, garmentInfo] : wardrobe;

      setFashionState(prev => ({
        ...prev,
        outfitHistory: newOutfitHistory,
        currentOutfitIndex: prev.currentOutfitIndex + 1,
        currentPoseIndex: 0,
        wardrobe: newWardrobe
      }));
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to apply garment';
      setError(errorMessage);
    } finally {
      setIsLoading(false);
    }
  }, [currentImageUrl, isLoading, fashionState]);

  const handlePoseSelect = useCallback(async (newIndex: number) => {
    const { outfitHistory, currentOutfitIndex, currentPoseIndex } = fashionState;
    if (isLoading || outfitHistory.length === 0 || newIndex === currentPoseIndex) return;
    
    const poseInstruction = POSE_INSTRUCTIONS[newIndex];
    const currentLayer = outfitHistory[currentOutfitIndex];

    if (currentLayer.poseImages[poseInstruction]) {
        setFashionState(prev => ({ ...prev, currentPoseIndex: newIndex }));
        updateHistory(currentLayer.poseImages[poseInstruction]);
        return;
    }
    
    const baseImageForPoseChange = Object.values(currentLayer.poseImages)[0];
    if (!baseImageForPoseChange) return;

    setError(null);
    setIsLoading(true);
    setLoadingMessage('Changing pose...');
    
    const prevPoseIndex = currentPoseIndex;
    setFashionState(prev => ({ ...prev, currentPoseIndex: newIndex }));
    
    try {
      const baseImageFile = dataURLtoFile(baseImageForPoseChange, 'base_for_pose_change.png');
      const newImageUrl = await generatePoseVariation(baseImageFile, poseInstruction);
      setFashionState(prev => {
        const newHistory = [...prev.outfitHistory];
        newHistory[prev.currentOutfitIndex].poseImages[poseInstruction] = newImageUrl;
        return { ...prev, outfitHistory: newHistory };
      });
      updateHistory(newImageUrl);
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to change pose';
      setError(errorMessage);
      setFashionState(prev => ({ ...prev, currentPoseIndex: prevPoseIndex }));
    } finally {
      setIsLoading(false);
    }
  }, [isLoading, fashionState]);
  
  const handleRemoveLastGarment = () => {
    const { currentOutfitIndex, outfitHistory } = fashionState;
    if (currentOutfitIndex > 0) {
        const newIndex = currentOutfitIndex - 1;
        const previousLayer = outfitHistory[newIndex];
        const lastKnownImage = Object.values(previousLayer.poseImages)[0];
        
        setFashionState(prev => ({ ...prev, currentOutfitIndex: newIndex, currentPoseIndex: 0 }));
        if(lastKnownImage) {
            updateHistory(lastKnownImage);
        }
    }
  };
  
  const handleResetFashion = () => {
    setFashionState(prev => ({ ...prev, status: 'create_model', outfitHistory: [], currentOutfitIndex: 0, currentPoseIndex: 0 }));
    if(originalImageFile) {
        fileToDataURL(originalImageFile).then(url => updateHistory(url));
    }
  };
  // --- END FASHION AI LOGIC ---


  const handleRotate = (degrees: number) => {
    runCanvasTask(rotateImage, degrees);
  };

  const handleFlipHorizontal = () => {
    runCanvasTask(flipImageHorizontal);
  };

  const handleGenerateAesthetics = useCallback(async (theme: Theme, categories: string[]) => {
    if (!originalImageFile) return;
    
    setIsToolPanelVisible(false);
    setIsLoading(true);
    setAestheticState({ status: 'generating', selectedTheme: theme, generationCategories: categories });
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
        console.error(`Error generating aesthetic for category "${category}":`, err);
        const errorMessage = err instanceof Error ? err.message : 'Generation failed.';
        setGeneratedImages(prev => ({
          ...prev,
          [category]: { status: 'error', error: errorMessage },
        }));
      }
    }));
    
    setIsLoading(false);
    setAestheticState(prev => ({ ...prev, status: 'results-shown' }));
  }, [originalImageFile]);

  const handleGenerateCameraAngles = useCallback(async (prompts: { name: string, prompt: string }[]) => {
    if (!originalImageFile) return;
    
    setIsToolPanelVisible(false);
    setIsLoading(true);
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

  const handleGenerateTimeTravelerImages = useCallback(async (prompts: { name: string, prompt: string }[]) => {
    if (!originalImageFile) return;
    
    setIsToolPanelVisible(false);
    setIsLoading(true);
    setTimeTravelerState({ status: 'generating', generationPrompts: prompts });
    setGeneratedTimeTravelerImages(
      prompts.reduce((acc, p) => ({ ...acc, [p.name]: { status: 'pending' } }), {})
    );

    await Promise.allSettled(prompts.map(async (p) => {
      try {
        const newImageUrl = await generateTimeTraveledImage(originalImageFile, p.prompt);
        setGeneratedTimeTravelerImages(prev => ({
          ...prev,
          [p.name]: { status: 'done', url: newImageUrl },
        }));
      } catch (err) {
        console.error(`Error generating time traveler image for "${p.name}":`, err);
        const errorMessage = err instanceof Error ? err.message : 'Generation failed.';
        setGeneratedTimeTravelerImages(prev => ({
          ...prev,
          [p.name]: { status: 'error', error: errorMessage },
        }));
      }
    }));
    
    setIsLoading(false);
    setTimeTravelerState(prev => ({ ...prev, status: 'results-shown' }));
  }, [originalImageFile]);
  
  const handleGenerateCosplayImages = useCallback(async () => {
    if (!originalImageFile || (!cosplayOptions.characterName.trim() && !cosplayOptions.characterRefImage)) {
        setError("Please provide a character name or reference image.");
        return;
    }
    
    setIsToolPanelVisible(false);
    setIsLoading(true);
    setCosplayState({ status: 'generating', options: cosplayOptions });

    const generationTasks = [];
    const tempGeneratedImages: Record<string, GeneratedCosplayImage> = {};
    
    for (let i = 0; i < cosplayOptions.numberOfOutputs; i++) {
        const key = `${cosplayOptions.characterName || 'Character'} ${i + 1}`;
        tempGeneratedImages[key] = { status: 'pending' };
    }
    setGeneratedCosplayImages(tempGeneratedImages);
    
    const keys = Object.keys(tempGeneratedImages);
    for (const key of keys) {
        generationTasks.push(
            (async () => {
                try {
                    const newImageUrl = await generateCosplayImage(originalImageFile, cosplayOptions);
                    setGeneratedCosplayImages(prev => ({
                        ...prev,
                        [key]: { status: 'done', url: newImageUrl },
                    }));
                } catch (err) {
                    const errorMessage = err instanceof Error ? err.message : 'Generation failed.';
                    setGeneratedCosplayImages(prev => ({
                        ...prev,
                        [key]: { status: 'error', error: errorMessage },
                    }));
                }
            })()
        );
    }
  
    await Promise.allSettled(generationTasks);
    
    setIsLoading(false);
    setCosplayState(prev => ({ ...prev, status: 'results-shown' }));
  }, [originalImageFile, cosplayOptions]);


  const handleUseGeneratedImageInEditor = (imageUrl: string) => {
      const newHistory = [{ imageUrl }];
      setHistory(newHistory);
      setHistoryIndex(0);
      
      const newFile = dataURLtoFile(imageUrl, originalImageFile?.name || 'generated.png');
      setOriginalImageFile(newFile);
      
      // Reset all generation states
      setAestheticState({ status: 'theme-selection', selectedTheme: null, generationCategories: [] });
      setGeneratedImages({});
      setCameraAnglesState({ status: 'selection', generationPrompts: [] });
      setGeneratedAngleImages({});
      setTimeTravelerState({ status: 'selection', generationPrompts: [] });
      setGeneratedTimeTravelerImages({});
      setCosplayState({ status: 'setup' });
      setGeneratedCosplayImages({});
      
      setActiveTool('adjust');
      setIsToolPanelVisible(true);
  };

  const handleApplyCrop = () => {
    if (!editorCanvasRef.current || !selection || selection.width === 0) return;
    setIsToolPanelVisible(false);
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
    if (!selection && ['retouch', 'portrait', 'textGen', 'insert', 'projector', 'alternateHistory'].includes(activeTool)) {
      setError("Please make a selection on the image first.");
      return;
    }
    const args = ['retouch', 'portrait', 'textGen', 'insert', 'projector', 'alternateHistory'].includes(activeTool) ? [prompt, selection] : [prompt];
    runGenerativeTask(generator as any, ...args);
  };

  const handleApplyExpand = useCallback(async (aspectRatio: number, prompt: string) => {
    if (!currentImageUrl) return;

    setIsToolPanelVisible(false);
    setIsLoading(true);
    setError(null);

    try {
        const createPaddedImage = (imageUrl: string, targetAspect: number): Promise<File> => {
            return new Promise((resolve, reject) => {
                const img = new Image();
                img.crossOrigin = 'anonymous';
                img.onload = () => {
                    const canvas = document.createElement('canvas');
                    const ctx = canvas.getContext('2d');
                    if (!ctx) return reject(new Error('Could not get canvas context'));

                    const currentAspect = img.naturalWidth / img.naturalHeight;
                    let newWidth = img.naturalWidth;
                    let newHeight = img.naturalHeight;
                    let dx = 0;
                    let dy = 0;

                    if (targetAspect > currentAspect) {
                        newWidth = Math.round(img.naturalHeight * targetAspect);
                        dx = Math.round((newWidth - img.naturalWidth) / 2);
                    } else if (targetAspect < currentAspect) {
                        newHeight = Math.round(img.naturalWidth / targetAspect);
                        dy = Math.round((newHeight - img.naturalHeight) / 2);
                    } else {
                        resolve(dataURLtoFile(imageUrl, 'original.png'));
                        return;
                    }

                    canvas.width = newWidth;
                    canvas.height = newHeight;
                    ctx.drawImage(img, dx, dy);
                    const dataUrl = canvas.toDataURL('image/png');
                    const file = dataURLtoFile(dataUrl, 'padded-image.png');
                    resolve(file);
                };
                img.onerror = (err) => reject(err);
                img.src = imageUrl;
            });
        };

        const paddedImageFile = await createPaddedImage(currentImageUrl, aspectRatio);
        const newImageUrl = await generativeExpand(paddedImageFile, prompt); 
        
        updateHistory(newImageUrl);
        const expandedFile = dataURLtoFile(newImageUrl, originalImageFile?.name || 'expanded.png');
        setOriginalImageFile(expandedFile);

    } catch (err) {
        const errorMessage = err instanceof Error ? err.message : 'An unknown error occurred.';
        setError(errorMessage);
    } finally {
        setIsLoading(false);
    }
}, [currentImageUrl, originalImageFile?.name]);


    const handleApplyProjection = (patternFile: File, scale: number, strength: number, prompt: string) => {
        if (!selection) {
            setError("Please make a selection on the image first.");
            return;
        }
        runGenerativeTask(generateProjectedTexture, patternFile, selection, scale, strength, prompt);
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
        setIsToolPanelVisible(false);
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

  const handleAcceptDisclaimer = () => {
    try {
      localStorage.setItem('orbisGenDisclaimerAccepted', 'true');
      setShowDisclaimer(false);
    } catch (error) {
      console.error("Could not write to localStorage:", error);
      setShowDisclaimer(false);
    }
  };
  
  const handleSaveApiKey = (apiKey: string) => {
    try {
        localStorage.setItem('orbisGenUserApiKey', apiKey);
        setShowApiKeyModal(false);
    } catch (error) {
        console.error("Could not save API key to localStorage:", error);
        setError("Could not save your API key. Please ensure your browser allows site data to be saved.");
    }
  };

  if (appState === 'home') {
    return (
      <>
        <AnimatePresence>
          {showApiKeyModal && <ApiKeyModal onSave={handleSaveApiKey} />}
          {showDisclaimer && <DisclaimerModal onAccept={handleAcceptDisclaimer} />}
        </AnimatePresence>
        <HomeScreen onFileSelect={handleFileSelect} onGoToDesignStudio={handleGoToDesignStudio} />
      </>
    );
  }
  
  if (appState === 'design-studio') {
      return (
        <>
            <AnimatePresence>
                {showApiKeyModal && <ApiKeyModal onSave={handleSaveApiKey} />}
            </AnimatePresence>
            <DesignStudio onExit={handleGoHome} onUseInEditor={handleFileSelect} />
        </>
      );
  }

  const isAestheticResultsVisible = activeTool === 'aestheticAI' && 
    (aestheticState.status === 'generating' || aestheticState.status === 'results-shown');
  
  const isCameraAnglesResultsVisible = activeTool === 'cameraAngles' &&
    (cameraAnglesState.status === 'generating' || cameraAnglesState.status === 'results-shown');
  
  const isTimeTravelerResultsVisible = activeTool === 'timeTraveler' &&
    (timeTravelerState.status === 'generating' || timeTravelerState.status === 'results-shown');
    
  const isCosplayResultsVisible = activeTool === 'cosplay' &&
    (cosplayState.status === 'generating' || cosplayState.status === 'results-shown');

  const isGenerationViewVisible = isAestheticResultsVisible || isCameraAnglesResultsVisible || isTimeTravelerResultsVisible || isCosplayResultsVisible;
  
  const canUndo = historyIndex > 0;
  const canRedo = historyIndex < history.length - 1;

  const toolPanelProps = {
    activeTool, isLoading, hasSelection: !!selection && selection.width > 0,
    onApplyGenerativeEdit: (prompt: string) => handleApplyGenerativeAction(generateEditedImage, prompt),
    onApplyCrop: handleApplyCrop, onSetAspect: setAspect, isCropping: !!selection && selection.width > 0,
    onApplyAdjustment: (prompt: string) => runGenerativeTask(generateAdjustedImage, prompt),
    onApplyFilter: (prompt: string) => runGenerativeTask(generateFilteredImage, prompt),
    onApplyReplaceBackground: (prompt: string) => runGenerativeTask(generateReplacedBackgroundImage, prompt),
    onApplyStudioEffect: (prompt: string) => runGenerativeTask(generateStudioEffect, prompt),
    onApplyText: (text: string, style: string) => runGenerativeTask(generateInscribedText, text, style, selection),
    onApplySky: (prompt: string) => runGenerativeTask(generateReplacedSky, prompt),
    onApplyInsert: (prompt: string) => handleApplyGenerativeAction(generateInsertedObject, prompt),
    onApplyColorGrade: (styleImage: File) => runGenerativeTask(generateColorGradedImage, styleImage),
    onApplyFaceFusion: (faceRefImage: File) => runGenerativeTask(generateFusedFaceImage, faceRefImage),
    onApplyClothingTransfer: (styleRefImage: File) => runGenerativeTask(generateStyleTransferredImage, styleRefImage),
    onApplyFaceSwap: (faceRefImage: File) => runGenerativeTask(generateSwappedFaceImage, faceRefImage),
    onApplyAddPerson: () => runGenerativeTask(generateCompositedPersonImage, addPersonOptions),
    addPersonOptions: addPersonOptions,
    onAddPersonOptionsChange: setAddPersonOptions,
    onApplyMakeupTransfer: (makeupRefImage: File) => runGenerativeTask(generateMakeupTransferredImage, makeupRefImage),
    fashionState: fashionState,
    onCreateModel: handleCreateModel,
    onGarmentSelect: handleGarmentSelect,
    onRemoveLastGarment: handleRemoveLastGarment,
    onResetFashion: handleResetFashion,
    onFinishFashion: () => setActiveTool('adjust'),
    onApplyMakeup: (prompt: string) => runGenerativeTask(generateMakeup, prompt),
    onApplyRandomize: () => runGenerativeTask(expandImage, 'Be creative and completely transform this into a new, surprising image. Change the scene, style, and subject in an unexpected way.'),
    originalImageFile: originalImageFile, onGenerateAesthetics: handleGenerateAesthetics, onUseGeneratedImageInEditor: handleUseGeneratedImageInEditor,
    aestheticState: aestheticState, setAestheticState: setAestheticState, generatedImages: generatedImages,
    layers: layers, onAddLayer: handleAddLayer, onUpdateLayer: handleUpdateLayer, onRemoveLayer: handleRemoveLayer, onFlattenLayers: handleFlattenLayers,
    onGenerateCameraAngles: handleGenerateCameraAngles, cameraAnglesState: cameraAnglesState, setCameraAnglesState: setCameraAnglesState, generatedAngleImages: generatedAngleImages,
    onApplyExpand: handleApplyExpand,
    onApplyProjection: handleApplyProjection,
    onGenerateTimeTravelerImages: handleGenerateTimeTravelerImages, timeTravelerState: timeTravelerState, setTimeTravelerState: setTimeTravelerState, generatedTimeTravelerImages: generatedTimeTravelerImages,
    onApplyAlternateHistory: (prompt: string) => handleApplyGenerativeAction(generateAlternateHistoryImage, prompt),
    onApplyShuffle: (influenceImage: File) => runGenerativeTask(generateShuffledImage, influenceImage),
    onGenerateCosplayImages: handleGenerateCosplayImages,
    cosplayState: cosplayState, 
    setCosplayState: setCosplayState, 
    generatedCosplayImages: generatedCosplayImages,
    cosplayOptions: cosplayOptions,
    onCosplayOptionsChange: setCosplayOptions,
    loadingMessage: loadingMessage,
    error: error,
  };


  return (
    <div className="w-screen h-screen bg-zinc-950 text-white flex flex-col overflow-hidden">
       <AnimatePresence>
        {showApiKeyModal && <ApiKeyModal onSave={handleSaveApiKey} />}
        {showDisclaimer && <DisclaimerModal onAccept={handleAcceptDisclaimer} />}
      </AnimatePresence>
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
      <main className="flex-1 flex flex-row overflow-hidden relative">
        {/* Toolbar (Left) */}
        <div className="flex-shrink-0">
          <Toolbar 
            activeTool={activeTool} 
            setActiveTool={handleToolSelect} 
            disabled={isLoading} 
          />
        </div>

        {/* Center Content (Canvas) */}
        <div className="flex-1 flex flex-col relative overflow-hidden bg-zinc-950 min-w-0">
          <div className="flex-1 relative flex items-center justify-center overflow-hidden">
            {isGenerationViewVisible ? (
              <AestheticResultsView 
                title={
                  isAestheticResultsVisible ? 'Aesthetic AI' : 
                  isCameraAnglesResultsVisible ? 'Camera Angles' : 
                  isTimeTravelerResultsVisible ? 'Time Traveler' : 'Cosplay AI'
                }
                subtitle={
                  isAestheticResultsVisible ? aestheticState.selectedTheme?.title : 
                  isCameraAnglesResultsVisible ? 'Generated from new perspectives' : 
                  isTimeTravelerResultsVisible ? 'Images from across the timeline' : 
                  cosplayState.options?.characterName || 'Cosplay Generations'
                }
                generationCategories={
                  isAestheticResultsVisible ? aestheticState.generationCategories : 
                  isCameraAnglesResultsVisible ? cameraAnglesState.generationPrompts.map(p => p.name) : 
                  isTimeTravelerResultsVisible ? timeTravelerState.generationPrompts.map(p => p.name) :
                  Object.keys(generatedCosplayImages)
                }
                generatedImages={
                  isAestheticResultsVisible ? generatedImages :
                  isCameraAnglesResultsVisible ? generatedAngleImages : 
                  isTimeTravelerResultsVisible ? generatedTimeTravelerImages : generatedCosplayImages
                }
                onUseInEditor={handleUseGeneratedImageInEditor}
                onBack={() => {
                  if (isAestheticResultsVisible) {
                    setAestheticState({ status: 'theme-selection', selectedTheme: null, generationCategories: [] });
                    setGeneratedImages({});
                  } else if (isCameraAnglesResultsVisible) {
                    setCameraAnglesState({ status: 'selection', generationPrompts: [] });
                    setGeneratedAngleImages({});
                  } else if (isTimeTravelerResultsVisible) {
                    setTimeTravelerState({ status: 'selection', generationPrompts: [] });
                    setGeneratedTimeTravelerImages({});
                  } else if (isCosplayResultsVisible) {
                    setCosplayState({ status: 'setup' });
                    setGeneratedCosplayImages({});
                  }
                  setIsToolPanelVisible(true);
                }}
                isGenerating={isLoading}
              />
            ) : currentImageUrl ? (
              <>
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
                
                {/* Floating UI Controls */}
                <motion.div
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: 10 }}
                  transition={{ type: 'tween', duration: 0.2 }}
                  className="absolute bottom-4 right-4 z-30"
                >
                  <ZoomControls
                      zoom={zoom}
                      setZoom={setZoom}
                      onReset={() => { setZoom(1); setPan({ x: 0, y: 0 }); }}
                    />
                </motion.div>

                <AnimatePresence>
                  {activeTool === 'fashion' && fashionState.status === 'dressing_room' && (
                      <motion.div
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: 10 }}
                        transition={{ type: 'tween', duration: 0.2 }}
                        className="absolute bottom-8 left-1/2 -translate-x-[calc(50%+5rem)] z-30"
                      >
                        <FashionPoseControls 
                          currentPoseIndex={fashionState.currentPoseIndex}
                          onSelectPose={handlePoseSelect}
                          isLoading={isLoading}
                        />
                      </motion.div>
                  )}
                </AnimatePresence>

                <motion.div
                  initial={{ opacity: 0, x: 10 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: 10 }}
                  transition={{ type: 'tween', duration: 0.2 }}
                  className="absolute top-4 right-4 z-30"
                >
                    <button
                      onClick={() => setIsToolPanelVisible(!isToolPanelVisible)}
                      className={`p-2.5 rounded-lg transition-all duration-200 shadow-lg ${
                          isToolPanelVisible
                          ? 'bg-blue-600 text-white'
                          : 'bg-black/60 backdrop-blur-sm text-zinc-200 hover:bg-zinc-700'
                      }`}
                      aria-label="Toggle tool options"
                      title="Toggle tool options"
                    >
                        <AdjustSlidersIcon className="w-6 h-6" />
                    </button>
                </motion.div>
              </>
            ) : (
                <p>Upload an image to get started.</p>
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
                        {error.toLowerCase().includes('api key') && (
                            <button 
                                onClick={() => setShowApiKeyModal(true)}
                                className="mt-2 text-xs bg-red-600 px-2 py-1 rounded hover:bg-red-500"
                            >
                                Update API Key
                            </button>
                        )}
                    </div>
                    <button onClick={() => setError(null)} className="p-1 rounded-full hover:bg-red-700">
                        <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" /></svg>
                    </button>
                </div>
            )}
        </div>
        </div>

        {/* Tool Options (Right Panel) */}
        <AnimatePresence>
          {isToolPanelVisible && (
            <motion.div
              initial={{ x: '100%' }}
              animate={{ x: 0 }}
              exit={{ x: '100%' }}
              transition={{ type: 'tween', duration: 0.3, ease: 'easeInOut' }}
              className="absolute top-0 right-0 w-96 h-full bg-zinc-900 z-40"
            >
                <ToolOptions {...toolPanelProps} onClose={() => setIsToolPanelVisible(false)} />
            </motion.div>
          )}
        </AnimatePresence>
      </main>
    </div>
  );
};

export default App;