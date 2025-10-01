import React from 'react';
import { FileText, ScrollText, Edit3, Users as UsersIcon, PenTool, ImagePlus, Wand2, Layers, Clapperboard, UserCog, BookOpen, ListChecks, LayoutPanelTop, Sparkles, Film } from 'lucide-react';

export interface NodeMenuCallbacks {
  onAddTextNode: () => void;
  onAddTextGeneratorNode: () => void;
  onAddImageNode: () => void;
  onAddImageGeneratorNode: () => void;
  onAddCharacterGeneratorNode: () => void;
  onAddStoryCharacterCreatorNode: () => void;
  onAddStoryExpanderNode: () => void;
  onAddShortStoryWriterNode: () => void;
  onAddScreenplayWriterNode: () => void;
  onAddWorldBibleNode: () => void;
  onAddSceneBeatPlannerNode: () => void;
  onAddShotStoryboardNode: () => void;
  onAddImageEditorNode: () => void;
  onAddImageMixerNode: () => void;
  onAddVideoGeneratorNode: () => void;
  onAddVideoKeyframeInitializerNode: () => void;
  onAddVideoSequencePlannerNode: () => void;
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

export const buildStoryToolsCategory = (callbacks: NodeMenuCallbacks): NodeMenuCategory => ({
  title: 'Story Tools',
  items: [
    { label: 'World Bible', icon: <BookOpen className="w-5 h-5 text-sky-300" />, action: callbacks.onAddWorldBibleNode },
    { label: 'Scene Beat Planner', icon: <ListChecks className="w-5 h-5 text-emerald-300" />, action: callbacks.onAddSceneBeatPlannerNode },
    { label: 'Shot Storyboard', icon: <LayoutPanelTop className="w-5 h-5 text-pink-300" />, action: callbacks.onAddShotStoryboardNode },
    { label: 'Screenplay Writer', icon: <Clapperboard className="w-5 h-5 text-purple-400" />, action: callbacks.onAddScreenplayWriterNode },
    { label: 'Short Story Writer', icon: <PenTool className="w-5 h-5 text-yellow-300" />, action: callbacks.onAddShortStoryWriterNode },
    { label: 'Story Expander', icon: <ScrollText className="w-5 h-5 text-purple-400" />, action: callbacks.onAddStoryExpanderNode },
    { label: 'Character Extractor', icon: <UserCog className="w-5 h-5 text-teal-400" />, action: callbacks.onAddStoryCharacterCreatorNode },
    { label: 'Character Viz', icon: <UsersIcon className="w-5 h-5 text-cyan-400" />, action: callbacks.onAddCharacterGeneratorNode },
  ],
});

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
      { label: 'Video Keyframe Init', icon: <Sparkles className="w-5 h-5 text-amber-300" />, action: callbacks.onAddVideoKeyframeInitializerNode },
    ],
  },
  {
    title: 'Video Tools',
    items: [
      { label: 'Video Generator', icon: <Clapperboard className="w-5 h-5 text-green-400" />, action: callbacks.onAddVideoGeneratorNode },
      { label: 'Video Sequence Planner', icon: <Film className="w-5 h-5 text-indigo-300" />, action: callbacks.onAddVideoSequencePlannerNode },
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
  buildStoryToolsCategory(callbacks),
  {
    title: 'Image Tools',
    items: [
      { label: 'Image Generator', icon: <Wand2 className="w-5 h-5 text-blue-400" />, action: callbacks.onAddImageGeneratorNode },
      { label: 'Image Editor', icon: <Edit3 className="w-5 h-5 text-purple-400" />, action: callbacks.onAddImageEditorNode },
      { label: 'Image Mixer', icon: <Layers className="w-5 h-5 text-pink-400" />, action: callbacks.onAddImageMixerNode },
      { label: 'Video Keyframe Init', icon: <Sparkles className="w-5 h-5 text-amber-300" />, action: callbacks.onAddVideoKeyframeInitializerNode },
    ],
  },
  {
    title: 'Video Tools',
    items: [
      { label: 'Video Generator', icon: <Clapperboard className="w-5 h-5 text-green-400" />, action: callbacks.onAddVideoGeneratorNode },
      { label: 'Video Sequence Planner', icon: <Film className="w-5 h-5 text-indigo-300" />, action: callbacks.onAddVideoSequencePlannerNode },
    ],
  },
];
