import React from 'react';
import { FileText, ScrollText, Edit3, Users as UsersIcon, PenTool, ImagePlus, Wand2, Layers, Clapperboard, UserCog, Sparkles, Film, Box, ChevronsRight } from 'lucide-react';

export interface NodeMenuCallbacks {
  onAddTextNode: () => void;
  onAddTextGeneratorNode: () => void;
  onAddImageNode: () => void;
  onAddImageGeneratorNode: () => void;
  onAddCharacterGeneratorNode: () => void;
  onAddStoryCharacterCreatorNode: () => void;
  onAddCharacterPortfolioNode: () => void;
  onAddStoryExpanderNode: () => void;
  onAddShortStoryWriterNode: () => void;
  onAddScreenplayWriterNode: () => void;
  onAddImageEditorNode: () => void;
  onAddImageMixerNode: () => void;
  onAddVideoGeneratorNode: () => void;
  onAddVideoInterpolatorNode: () => void;
  onAddVideoComposerNode: () => void;
  onAddVideoExtenderNode: () => void;
}

export interface NodeMenuItem {
  label: string;
  icon: React.ReactNode;
  action: () => void;
}

export interface NodeMenuCategory {
  title: string;
  items: NodeMenuItem[];
}

export const buildStoryToolsCategories = (callbacks: NodeMenuCallbacks): NodeMenuCategory[] => [
  {
    title: 'Story Writing',
    items: [
      { label: 'Screenplay Writer', icon: <Clapperboard className="w-5 h-5 text-purple-400" />, action: callbacks.onAddScreenplayWriterNode },
      { label: 'Short Story Writer', icon: <PenTool className="w-5 h-5 text-yellow-300" />, action: callbacks.onAddShortStoryWriterNode },
      { label: 'Story Expander', icon: <ScrollText className="w-5 h-5 text-purple-400" />, action: callbacks.onAddStoryExpanderNode },
    ],
  },
  {
    title: 'Character Tools',
    items: [
      { label: 'Character Extractor', icon: <UserCog className="w-5 h-5 text-teal-400" />, action: callbacks.onAddStoryCharacterCreatorNode },
      { label: 'Character Portfolio', icon: <Sparkles className="w-5 h-5 text-emerald-300" />, action: callbacks.onAddCharacterPortfolioNode },
      { label: 'Character Viz', icon: <UsersIcon className="w-5 h-5 text-cyan-400" />, action: callbacks.onAddCharacterGeneratorNode },
    ],
  },
];

export const buildNodeMenuCategories = (callbacks: NodeMenuCallbacks): NodeMenuCategory[] => [
  {
    title: 'Basic Inputs',
    items: [
      { label: 'Text', icon: <FileText className="w-5 h-5 text-yellow-400" />, action: callbacks.onAddTextNode },
      { label: 'Text Generator', icon: <PenTool className="w-5 h-5 text-indigo-400" />, action: callbacks.onAddTextGeneratorNode },
      { label: 'Image', icon: <ImagePlus className="w-5 h-5 text-orange-400" />, action: callbacks.onAddImageNode },
    ],
  },
  {
    title: 'Image Tools',
    items: [
      { label: 'Image Generator', icon: <Wand2 className="w-5 h-5 text-blue-400" />, action: callbacks.onAddImageGeneratorNode },
      { label: 'Image Editor', icon: <Edit3 className="w-5 h-5 text-purple-400" />, action: callbacks.onAddImageEditorNode },
      { label: 'Image Mixer', icon: <Layers className="w-5 h-5 text-pink-400" />, action: callbacks.onAddImageMixerNode },
    ],
  },
  {
    title: 'Video Tools',
    items: [
      { label: 'Video Generator', icon: <Clapperboard className="w-5 h-5 text-green-400" />, action: callbacks.onAddVideoGeneratorNode },
      { label: 'Video Interpolator', icon: <Film className="w-5 h-5 text-teal-400" />, action: callbacks.onAddVideoInterpolatorNode },
      { label: 'Video Composer', icon: <Box className="w-5 h-5 text-purple-400" />, action: callbacks.onAddVideoComposerNode },
      { label: 'Video Extender', icon: <ChevronsRight className="w-5 h-5 text-emerald-400" />, action: callbacks.onAddVideoExtenderNode },
    ],
  },
];

export const buildAllNodeMenuCategories = (callbacks: NodeMenuCallbacks): NodeMenuCategory[] => [
  {
    title: 'Basic Inputs',
    items: [
      { label: 'Text', icon: <FileText className="w-5 h-5 text-yellow-400" />, action: callbacks.onAddTextNode },
      { label: 'Text Generator', icon: <PenTool className="w-5 h-5 text-indigo-400" />, action: callbacks.onAddTextGeneratorNode },
      { label: 'Image', icon: <ImagePlus className="w-5 h-5 text-orange-400" />, action: callbacks.onAddImageNode },
    ],
  },
  ...buildStoryToolsCategories(callbacks),
  {
    title: 'Image Tools',
    items: [
      { label: 'Image Generator', icon: <Wand2 className="w-5 h-5 text-blue-400" />, action: callbacks.onAddImageGeneratorNode },
      { label: 'Image Editor', icon: <Edit3 className="w-5 h-5 text-purple-400" />, action: callbacks.onAddImageEditorNode },
      { label: 'Image Mixer', icon: <Layers className="w-5 h-5 text-pink-400" />, action: callbacks.onAddImageMixerNode },
    ],
  },
  {
    title: 'Video Tools',
    items: [
      { label: 'Video Generator', icon: <Clapperboard className="w-5 h-5 text-green-400" />, action: callbacks.onAddVideoGeneratorNode },
      { label: 'Video Interpolator', icon: <Film className="w-5 h-5 text-teal-400" />, action: callbacks.onAddVideoInterpolatorNode },
      { label: 'Video Composer', icon: <Box className="w-5 h-5 text-purple-400" />, action: callbacks.onAddVideoComposerNode },
      { label: 'Video Extender', icon: <ChevronsRight className="w-5 h-5 text-emerald-400" />, action: callbacks.onAddVideoExtenderNode },
    ],
  },
];
