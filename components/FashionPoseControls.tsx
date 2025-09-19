/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
*/
import React from 'react';
import { ChevronLeftIcon, ChevronRightIcon } from './icons';

export const POSE_INSTRUCTIONS = [
  "Full frontal view, hands on hips",
  "Slightly turned, 3/4 view",
  "Side profile view",
  "Jumping in the air, mid-action shot",
  "Walking towards camera",
  "Leaning against a wall",
];

interface FashionPoseControlsProps {
  currentPoseIndex: number;
  onSelectPose: (index: number) => void;
  isLoading: boolean;
}

const FashionPoseControls: React.FC<FashionPoseControlsProps> = ({ currentPoseIndex, onSelectPose, isLoading }) => {
  const handlePrevious = () => {
    const newIndex = (currentPoseIndex - 1 + POSE_INSTRUCTIONS.length) % POSE_INSTRUCTIONS.length;
    onSelectPose(newIndex);
  };
  
  const handleNext = () => {
    const newIndex = (currentPoseIndex + 1) % POSE_INSTRUCTIONS.length;
    onSelectPose(newIndex);
  };

  return (
    <div className="flex items-center justify-center gap-1 bg-black/60 backdrop-blur-sm rounded-full p-1 border border-zinc-700/50">
        <button onClick={handlePrevious} disabled={isLoading} className="p-1.5 rounded-full hover:bg-zinc-700 active:scale-90 transition-all disabled:opacity-50">
            <ChevronLeftIcon className="w-4 h-4 text-white" />
        </button>
        <span className="text-xs text-white w-32 text-center truncate px-1" title={POSE_INSTRUCTIONS[currentPoseIndex]}>
            {POSE_INSTRUCTIONS[currentPoseIndex]}
        </span>
        <button onClick={handleNext} disabled={isLoading} className="p-1.5 rounded-full hover:bg-zinc-700 active:scale-90 transition-all disabled:opacity-50">
            <ChevronRightIcon className="w-4 h-4 text-white" />
        </button>
    </div>
  );
};

export default FashionPoseControls;