/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
*/
import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { AddPersonOptions, CosplayOptions, GeneratedImage, AestheticState, Theme, Tool, Layer, CameraAnglesState, GeneratedAngleImage, OutfitLayer, WardrobeItem, TimeTravelerState, GeneratedTimeTravelerImage, CosplayState, GeneratedCosplayImage } from '../types';
import { toolCategories, ToolDefinition } from './Toolbar';
import { CloseIcon } from './icons';

// Import all panel components directly
import AdjustmentPanel from './AdjustmentPanel';
import CropPanel from './CropPanel';
import FilterPanel from './FilterPanel';
import ReplaceBackgroundPanel from './ReplaceBackgroundPanel';
import PortraitPanel from './PortraitPanel';
import StudioPanel from './StudioPanel';
import TextGenPanel from './TextGenPanel';
import SkyPanel from './SkyPanel';
import InsertPanel from './InsertPanel';
import ColorGradePanel from './ColorGradePanel';
import FaceFusionPanel from './FaceFusionPanel';
import StyleTransferPanel from './StyleTransferPanel';
import FaceSwapPanel from './FaceSwapPanel';
import AddPersonPanel from './AddPersonPanel';
import MakeupTransferPanel from './MakeupTransferPanel';
import FashionPanel from './FashionPanel';
import MakeupPanel from './MakeupPanel';
import RandomizePanel from './RandomizePanel';
import AestheticPanel from './PersonaPanel';
import LayersPanel from './LayersPanel';
import CameraAnglesPanel from './CameraAnglesPanel';
import ExpandPanel from './ExpandPanel';
import TimeTravelerPanel from './TimeTravelerPanel';
import ProjectorPanel from './ProjectorPanel';
import CosplayPanel from './CosplayPanel';


export const toolDisplayName: Record<Tool, string> = {
  retouch: 'Retouch',
  crop: 'Crop & Resize',
  adjust: 'Adjustments',
  filters: 'Artistic Filters',
  replaceBg: 'Replace Background',
  portrait: 'Portrait AI',
  studio: 'Studio AI',
  textGen: 'Generative Text',
  sky: 'Replace Sky',
  insert: 'Insert Object',
  generativeExpand: 'Expand Canvas',
  colorGrade: 'Color Grade',
  faceFusion: 'Face Fusion',
  clothingTransfer: 'Clothing Transfer',
  faceSwap: 'Face Swap',
  addPerson: 'Add Person',
  makeupTransfer: 'Makeup Transfer',
  fashion: 'Fashion AI',
  makeup: 'Makeup AI',
  randomize: 'Randomize',
  aestheticAI: 'Aesthetic AI',
  cameraAngles: 'Camera Angles',
  layers: 'Layers',
  timeTraveler: 'Time Traveler',
  projector: 'Projector AI',
  cosplay: 'Cosplay AI',
  none: 'No Tool',
};

// Flatten all tools into a single array for searching, ensuring no duplicates.
export const allTools = toolCategories.flatMap(category => category.tools).reduce((acc, tool) => {
    if (!acc.find(t => t.name === tool.name)) {
        acc.push(tool);
    }
    return acc;
}, [] as ToolDefinition[]);

// Define the props for the unified ToolOptions component
export interface ToolOptionsProps {
    activeTool: Tool;
    isLoading: boolean;
    hasSelection: boolean;
    onApplyGenerativeEdit: (prompt: string) => void;
    onApplyCrop: () => void;
    onSetAspect: (aspect: number | undefined) => void;
    isCropping: boolean;
    onApplyAdjustment: (prompt: string) => void;
    onApplyFilter: (prompt: string) => void;
    onApplyReplaceBackground: (prompt: string, harmonize: boolean) => void;
    onApplyStudioEffect: (prompt: string) => void;
    onApplyText: (text: string, style: string) => void;
    onApplySky: (prompt: string) => void;
    onApplyInsert: (prompt: string) => void;
    onApplyColorGrade: (styleImage: File) => void;
    onApplyFaceFusion: (faceRefImage: File) => void;
    onApplyClothingTransfer: (styleRefImage: File) => void;
    onApplyFaceSwap: (faceRefImage: File) => void;
    onApplyAddPerson: () => void;
    addPersonOptions: AddPersonOptions;
    onAddPersonOptionsChange: React.Dispatch<React.SetStateAction<AddPersonOptions>>;
    onApplyMakeupTransfer: (makeupRefImage: File) => void;
    
    // Fashion AI Props
    fashionState: {
        modelImageUrl: string | null;
        outfitHistory: OutfitLayer[];
        currentOutfitIndex: number;
        currentPoseIndex: number;
        wardrobe: WardrobeItem[];
        status: 'create_model' | 'dressing_room';
    };
    onCreateModel: () => void;
    onGarmentSelect: (file: File, info: WardrobeItem) => void;
    onRemoveLastGarment: () => void;
    onResetFashion: () => void;
    onFinishFashion: () => void;
    loadingMessage: string;
    error: string | null;


    onApplyMakeup: (prompt: string) => void;
    onApplyRandomize: () => void;
    onApplyExpand: (aspectRatio: number, prompt: string) => void;
    onApplyProjection: (patternFile: File, scale: number, strength: number, prompt: string) => void;
    originalImageFile: File | null;
    onGenerateAesthetics: (theme: Theme, categories:string[]) => void;
    onUseGeneratedImageInEditor: (imageUrl: string) => void;
    aestheticState: AestheticState;
    setAestheticState: React.Dispatch<React.SetStateAction<AestheticState>>;
    generatedImages: Record<string, GeneratedImage>;
    onGenerateCameraAngles: (prompts: { name: string, prompt: string }[]) => void;
    cameraAnglesState: CameraAnglesState;
    setCameraAnglesState: React.Dispatch<React.SetStateAction<CameraAnglesState>>;
    generatedAngleImages: Record<string, GeneratedAngleImage>;
    onGenerateTimeTravelerImages: (prompts: { name: string, prompt: string }[]) => void;
    timeTravelerState: TimeTravelerState;
    setTimeTravelerState: React.Dispatch<React.SetStateAction<TimeTravelerState>>;
    generatedTimeTravelerImages: Record<string, GeneratedTimeTravelerImage>;
    layers: Layer[];
    onAddLayer: (file: File) => void;
    onUpdateLayer: (id: string, updates: Partial<Omit<Layer, 'id' | 'name' | 'imageUrl'>>) => void;
    onRemoveLayer: (id: string) => void;
    onFlattenLayers: () => void;
    onGenerateCosplayImages: () => void;
    cosplayState: CosplayState;
    setCosplayState: React.Dispatch<React.SetStateAction<CosplayState>>;
    generatedCosplayImages: Record<string, GeneratedCosplayImage>;
    cosplayOptions: CosplayOptions;
    onCosplayOptionsChange: React.Dispatch<React.SetStateAction<CosplayOptions>>;
    onClose: () => void;
}

const ToolOptions: React.FC<ToolOptionsProps> = (props) => {
  const { activeTool, isLoading, hasSelection, onClose } = props;
  const title = toolDisplayName[activeTool] || 'Options';

  const renderActiveToolPanel = () => {
    switch (activeTool) {
        case 'adjust':
          return <AdjustmentPanel onApplyAdjustment={props.onApplyAdjustment} isLoading={isLoading} />;
        case 'crop':
          return <CropPanel onApplyCrop={props.onApplyCrop} onSetAspect={props.onSetAspect} isLoading={isLoading} isCropping={props.isCropping} />;
        case 'filters':
          return <FilterPanel onApplyFilter={props.onApplyFilter} isLoading={isLoading} />;
        case 'replaceBg':
          return <ReplaceBackgroundPanel onApplyReplaceBackground={props.onApplyReplaceBackground} isLoading={isLoading} />;
        case 'retouch':
        case 'portrait':
          return <PortraitPanel onApplyGenerativeEdit={props.onApplyGenerativeEdit} hasSelection={hasSelection} isLoading={isLoading} />;
        case 'studio':
          return <StudioPanel onApplyStudioEffect={props.onApplyStudioEffect} isLoading={isLoading} />;
        case 'textGen':
          return <TextGenPanel onApply={props.onApplyText} isLoading={isLoading} hasSelection={hasSelection} />;
        case 'sky':
          return <SkyPanel onApply={props.onApplySky} isLoading={isLoading} />;
        case 'insert':
          return <InsertPanel onApply={props.onApplyInsert} isLoading={isLoading} hasSelection={hasSelection} />;
        case 'generativeExpand':
          return <ExpandPanel onApplyExpand={props.onApplyExpand} isLoading={isLoading} />;
        case 'colorGrade':
          return <ColorGradePanel onApplyColorGrade={props.onApplyColorGrade} isLoading={isLoading} />;
        case 'projector':
          return <ProjectorPanel onApply={props.onApplyProjection} isLoading={isLoading} hasSelection={hasSelection} />;
        case 'faceFusion':
          return <FaceFusionPanel onApplyFaceFusion={props.onApplyFaceFusion} isLoading={isLoading} />;
        case 'clothingTransfer':
          return <StyleTransferPanel onApplyClothingTransfer={props.onApplyClothingTransfer} isLoading={isLoading} />;
        case 'faceSwap':
          return <FaceSwapPanel onApplyFaceSwap={props.onApplyFaceSwap} isLoading={isLoading} />;
        case 'addPerson':
          return <AddPersonPanel
            onApplyAddPerson={props.onApplyAddPerson}
            isLoading={isLoading}
            options={props.addPersonOptions}
            onOptionsChange={props.onAddPersonOptionsChange}
            />;
        case 'makeupTransfer':
          return <MakeupTransferPanel onApplyMakeupTransfer={props.onApplyMakeupTransfer} isLoading={isLoading} />;
        case 'fashion':
          return <FashionPanel 
                    originalImageFile={props.originalImageFile}
                    fashionState={props.fashionState}
                    isLoading={props.isLoading}
                    loadingMessage={props.loadingMessage}
                    error={props.error}
                    onCreateModel={props.onCreateModel}
                    onGarmentSelect={props.onGarmentSelect}
                    onRemoveLastGarment={props.onRemoveLastGarment}
                    onReset={props.onResetFashion}
                    onFinish={props.onFinishFashion}
                 />;
        case 'makeup':
          return <MakeupPanel onApplyMakeup={props.onApplyMakeup} isLoading={isLoading} />;
        case 'randomize':
          return <RandomizePanel onApplyRandomize={props.onApplyRandomize} isLoading={isLoading} />;
        case 'layers':
          return <LayersPanel
              layers={props.layers}
              onAddLayer={props.onAddLayer}
              onUpdateLayer={props.onUpdateLayer}
              onRemoveLayer={props.onRemoveLayer}
              onFlatten={props.onFlattenLayers}
              isLoading={isLoading}
          />;
        case 'aestheticAI':
          return <AestheticPanel onGenerate={props.onGenerateAesthetics} />;
        case 'cameraAngles':
          return <CameraAnglesPanel onGenerate={props.onGenerateCameraAngles} isLoading={isLoading} />;
        case 'timeTraveler':
          return <TimeTravelerPanel onGenerate={props.onGenerateTimeTravelerImages} isLoading={isLoading} />;
        case 'cosplay':
            return <CosplayPanel
                onGenerateCosplay={props.onGenerateCosplayImages}
                isLoading={isLoading}
                options={props.cosplayOptions}
                onOptionsChange={props.onCosplayOptionsChange}
            />;
        default:
          return <div className="p-4 text-center text-sm text-zinc-400">Select a tool from the toolbar to see its options.</div>;
    }
  };

  return (
    <div className="w-full h-full border-l border-zinc-800 flex flex-col">
        <div className="flex items-center justify-between px-4 sm:px-6 border-b border-zinc-800 flex-shrink-0 h-14">
            <h2 className="text-lg font-semibold text-white">{title}</h2>
            <button onClick={onClose} className="p-2 -mr-2 text-zinc-400 hover:text-white hover:bg-zinc-800 rounded-full transition-colors" aria-label="Close options">
                <CloseIcon className="w-6 h-6" />
            </button>
        </div>
        <div className="flex-1 p-4 overflow-y-auto">
           <AnimatePresence mode="wait">
                <motion.div
                    key={activeTool}
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -10 }}
                    transition={{ duration: 0.2 }}
                >
                    {renderActiveToolPanel()}
                </motion.div>
           </AnimatePresence>
        </div>
        <div className="p-4 border-t border-zinc-800 flex-shrink-0">
            <p className="text-xs text-zinc-500 text-center">
                The user is solely responsible for any legal violations, copyright infringements, or other illicit activities that may arise from the use of these tools.
            </p>
        </div>
    </div>
  );
};

export default ToolOptions;