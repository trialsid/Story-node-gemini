import React from 'react';
import { FileText, PenSquare, Users as UsersIcon, Bot, Upload, Image, Shuffle, Video } from 'lucide-react';

export interface NodeMenuCallbacks {
  onAddTextNode: () => void;
  onAddTextGeneratorNode: () => void;
  onAddImageNode: () => void;
  onAddImageGeneratorNode: () => void;
  onAddCharacterGeneratorNode: () => void;
  onAddStoryCharacterCreatorNode: () => void;
  onAddStoryExpanderNode: () => void;
  onAddImageEditorNode: () => void;
  onAddImageMixerNode: () => void;
  onAddVideoGeneratorNode: () => void;
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

export const buildNodeMenuCategories = (callbacks: NodeMenuCallbacks): NodeMenuCategory[] => [
  {
    title: 'Basic Inputs',
    items: [
      { label: 'Text', icon: <FileText className="w-5 h-5 text-yellow-400" />, action: callbacks.onAddTextNode },
      { label: 'Text Generator', icon: <Bot className="w-5 h-5 text-indigo-400" />, action: callbacks.onAddTextGeneratorNode },
      { label: 'Image', icon: <Upload className="w-5 h-5 text-orange-400" />, action: callbacks.onAddImageNode },
    ],
  },
  {
    title: 'Story Tools',
    items: [
      { label: 'Story Expander', icon: <FileText className="w-5 h-5 text-purple-400" />, action: callbacks.onAddStoryExpanderNode },
      { label: 'Story Character Creator', icon: <UsersIcon className="w-5 h-5 text-teal-400" />, action: callbacks.onAddStoryCharacterCreatorNode },
      { label: 'Character Generator', icon: <Image className="w-5 h-5 text-cyan-400" />, action: callbacks.onAddCharacterGeneratorNode },
    ],
  },
  {
    title: 'Image Tools',
    items: [
      { label: 'Image Generator', icon: <Image className="w-5 h-5 text-blue-400" />, action: callbacks.onAddImageGeneratorNode },
      { label: 'Image Editor', icon: <PenSquare className="w-5 h-5 text-purple-400" />, action: callbacks.onAddImageEditorNode },
      { label: 'Image Mixer', icon: <Shuffle className="w-5 h-5 text-pink-400" />, action: callbacks.onAddImageMixerNode },
    ],
  },
  {
    title: 'Video Tools',
    items: [
      { label: 'Video Generator', icon: <Video className="w-5 h-5 text-green-400" />, action: callbacks.onAddVideoGeneratorNode },
    ],
  },
];
