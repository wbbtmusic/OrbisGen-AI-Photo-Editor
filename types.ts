/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
*/

import { type PixelCrop } from 'react-image-crop';

export type Tool = 
  | 'retouch'
  | 'crop'
  | 'adjust'
  | 'filters'
  | 'replaceBg'
  | 'portrait'
  | 'studio'
  | 'textGen'
  | 'sky'
  | 'insert'
  | 'generativeExpand'
  | 'colorGrade'
  | 'faceFusion'
  | 'clothingTransfer'
  | 'faceSwap'
  | 'addPerson'
  | 'makeupTransfer'
  | 'fashion'
  | 'makeup'
  | 'randomize'
  | 'aestheticAI'
  | 'layers'
  | 'cameraAngles'
  | 'timeTraveler'
  | 'projector'
  | 'none';

export interface HistoryEntry {
  imageUrl: string;
  crop?: PixelCrop;
}

export interface AddPersonOptions {
  prompt: string;
  personRefImage: File | null;
  placement: 'left' | 'center' | 'right';
  familiarity: string;
  gazeDirection: 'looking at camera' | 'looking away from camera';
  faceDirection: 'facing camera' | 'facing main subject' | 'facing away';
  preserveMainSubjectPose: boolean;
  style: 'normal' | 'realistic' | 'surprise';
  posePrompt: string;
  lightingMatch: 'match' | 'keep';
}

export interface RecentProject {
  id: number;
  name: string;
  thumbnailUrl: string;
  imageUrl: string;
}

// Fix: Add missing types for Persona feature
export interface Theme {
  key: string;
  title: string;
  description: string;
  categories: string[];
  getPrompt: (category: string) => string;
}

export type AestheticStatus = 'theme-selection' | 'generating' | 'results-shown';

export interface AestheticState {
  status: AestheticStatus;
  selectedTheme: Theme | null;
  generationCategories: string[];
}

export type ImageGenerationStatus = 'pending' | 'done' | 'error';

export interface GeneratedImage {
  url?: string;
  status: ImageGenerationStatus;
  error?: string;
}

export interface Layer {
  id: string;
  name: string;
  imageUrl: string;
  opacity: number;
  visible: boolean;
}

export type AspectRatio = '1:1' | '16:9' | '9:16' | '4:3' | '3:4';

export interface DesignStudioPersonaOptions {
  backgroundPrompt: string;
  aspectRatio: AspectRatio;
  person: Partial<AddPersonOptions>;
  posePrompt: string;
}

// New types for Camera Angles feature
export type CameraAnglesStatus = 'selection' | 'generating' | 'results-shown';

export interface CameraAnglesState {
  status: CameraAnglesStatus;
  generationPrompts: { name: string, prompt: string }[];
}

export interface GeneratedAngleImage {
  url?: string;
  status: ImageGenerationStatus;
  error?: string;
}

// New types for Time Traveler feature
export type TimeTravelerStatus = 'selection' | 'generating' | 'results-shown';

export interface TimeTravelerState {
    status: TimeTravelerStatus;
    generationPrompts: { name: string, prompt: string }[];
}

export type GeneratedTimeTravelerImage = GeneratedImage;


// Types for new Fashion AI / Virtual Try-On tool
export interface WardrobeItem {
  id: string;
  name: string;
  url: string;
}

export interface OutfitLayer {
  garment: WardrobeItem | null; // null represents the base model layer
  poseImages: Record<string, string>; // Maps pose instruction to image URL
}