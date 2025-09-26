import React from 'react';
import TextIcon from '../components/icons/TextIcon';
import BotIcon from '../components/icons/BotIcon';
import UploadIcon from '../components/icons/UploadIcon';
import UsersIcon from '../components/icons/UsersIcon';
import ImageIcon from '../components/icons/ImageIcon';
import EditIcon from '../components/icons/EditIcon';
import MixerIcon from '../components/icons/MixerIcon';
import VideoIcon from '../components/icons/VideoIcon';

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
      { label: 'Text', icon: <TextIcon className="w-5 h-5 text-yellow-400" />, action: callbacks.onAddTextNode },
      { label: 'Text Generator', icon: <BotIcon className="w-5 h-5 text-indigo-400" />, action: callbacks.onAddTextGeneratorNode },
      { label: 'Image', icon: <UploadIcon className="w-5 h-5 text-orange-400" />, action: callbacks.onAddImageNode },
    ],
  },
  {
    title: 'Story Tools',
    items: [
      { label: 'Story Expander', icon: <TextIcon className="w-5 h-5 text-purple-400" />, action: callbacks.onAddStoryExpanderNode },
      { label: 'Story Character Creator', icon: <UsersIcon className="w-5 h-5 text-teal-400" />, action: callbacks.onAddStoryCharacterCreatorNode },
      { label: 'Character Generator', icon: <ImageIcon className="w-5 h-5 text-cyan-400" />, action: callbacks.onAddCharacterGeneratorNode },
    ],
  },
  {
    title: 'Image Tools',
    items: [
      { label: 'Image Generator', icon: <ImageIcon className="w-5 h-5 text-blue-400" />, action: callbacks.onAddImageGeneratorNode },
      { label: 'Image Editor', icon: <EditIcon className="w-5 h-5 text-purple-400" />, action: callbacks.onAddImageEditorNode },
      { label: 'Image Mixer', icon: <MixerIcon className="w-5 h-5 text-pink-400" />, action: callbacks.onAddImageMixerNode },
    ],
  },
  {
    title: 'Video Tools',
    items: [
      { label: 'Video Generator', icon: <VideoIcon className="w-5 h-5 text-green-400" />, action: callbacks.onAddVideoGeneratorNode },
    ],
  },
];
