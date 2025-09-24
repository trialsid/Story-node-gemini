import React, { useState, useRef, useEffect } from 'react';
import ImageIcon from './icons/ImageIcon';
import TextIcon from './icons/TextIcon';
import EditIcon from './icons/EditIcon';
import { useTheme } from '../contexts/ThemeContext';
import VideoIcon from './icons/VideoIcon';
import UploadIcon from './icons/UploadIcon';
import HomeIcon from './icons/HomeIcon';
import ClearCanvasIcon from './icons/ClearCanvasIcon';
import UndoIcon from './icons/UndoIcon';
import RedoIcon from './icons/RedoIcon';
import SaveIcon from './icons/SaveIcon';
import LoadIcon from './icons/LoadIcon';
import BotIcon from './icons/BotIcon';
import PlusIcon from './icons/PlusIcon';
import ChevronDownIcon from './icons/ChevronDownIcon';
import MixerIcon from './icons/MixerIcon';

interface ToolbarProps {
  onNavigateHome: () => void;
  onClearCanvas: () => void;
  onSaveProject: () => void;
  onLoadProject: () => void;
  onAddNode: () => void;
  onAddImageGeneratorNode: () => void;
  onAddTextNode: () => void;
  onAddTextGeneratorNode: () => void;
  onAddImageNode: () => void;
  onAddImageEditorNode: () => void;
  onAddImageMixerNode: () => void;
  onAddVideoGeneratorNode: () => void;
  onUndo: () => void;
  onRedo: () => void;
  canUndo: boolean;
  canRedo: boolean;
}

const ToolbarButton: React.FC<{ 
    onClick: () => void; 
    children: React.ReactNode; 
    tooltip: string; 
    disabled?: boolean; 
    className?: string;
}> = ({ onClick, children, tooltip, disabled = false, className = '' }) => {
    const { styles } = useTheme();
    return (
        <button
            onClick={onClick}
            disabled={disabled}
            className={`flex items-center justify-center p-2.5 ${styles.toolbar.buttonBg} ${styles.toolbar.buttonHoverBg} rounded-md transition-colors text-sm font-medium disabled:opacity-50 disabled:cursor-not-allowed relative group ${className}`}
            aria-label={tooltip}
        >
            {children}
            <span className="absolute top-full mt-2 w-max bg-gray-900 text-white text-xs rounded py-1 px-2 opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none z-10">
                {tooltip}
            </span>
        </button>
    )
};

const Toolbar: React.FC<ToolbarProps> = ({ 
    onNavigateHome, 
    onClearCanvas, 
    onSaveProject,
    onLoadProject,
    onAddNode, 
    onAddImageGeneratorNode,
    onAddTextNode, 
    onAddTextGeneratorNode,
    onAddImageNode, 
    onAddImageEditorNode, 
    onAddImageMixerNode,
    onAddVideoGeneratorNode,
    onUndo,
    onRedo,
    canUndo,
    canRedo,
}) => {
  const { styles } = useTheme();
  const [isAddMenuOpen, setIsAddMenuOpen] = useState(false);
  const addMenuRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
        if (addMenuRef.current && !addMenuRef.current.contains(event.target as Node)) {
            setIsAddMenuOpen(false);
        }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const nodeTypes = [
    // Basic Input
    { label: 'Text', icon: <TextIcon className="w-5 h-5 text-yellow-400" />, action: onAddTextNode },
    { label: 'Text Generator', icon: <BotIcon className="w-5 h-5 text-indigo-400" />, action: onAddTextGeneratorNode },
    // Image-related
    { label: 'Image', icon: <UploadIcon className="w-5 h-5 text-orange-400" />, action: onAddImageNode },
    { label: 'Image Gen', icon: <ImageIcon className="w-5 h-5 text-blue-400" />, action: onAddImageGeneratorNode },
    { label: 'Character Gen', icon: <ImageIcon className="w-5 h-5 text-cyan-400" />, action: onAddNode },
    { label: 'Image Editor', icon: <EditIcon className="w-5 h-5 text-purple-400" />, action: onAddImageEditorNode },
    { label: 'Image Mixer', icon: <MixerIcon className="w-5 h-5 text-pink-400" />, action: onAddImageMixerNode },
    // Video-related
    { label: 'Video Gen', icon: <VideoIcon className="w-5 h-5 text-green-400" />, action: onAddVideoGeneratorNode },
  ];

  return (
    <div className={`absolute top-4 left-4 z-20 p-2 ${styles.toolbar.bg} border ${styles.toolbar.border} rounded-lg shadow-lg`}>
      <div className="flex items-center space-x-1.5">
        {/* Group 1: Project & Canvas */}
        <ToolbarButton onClick={onNavigateHome} tooltip="Home" className="hover:bg-cyan-500/20">
            <HomeIcon className="w-5 h-5 text-cyan-400" />
        </ToolbarButton>
        <ToolbarButton onClick={onSaveProject} tooltip="Save Project">
            <SaveIcon className="w-5 h-5 text-gray-300" />
        </ToolbarButton>
        <ToolbarButton onClick={onLoadProject} tooltip="Load Project">
            <LoadIcon className="w-5 h-5 text-gray-300" />
        </ToolbarButton>
        <ToolbarButton onClick={onClearCanvas} tooltip="Clear Canvas">
            <ClearCanvasIcon className="w-5 h-5 text-red-400" />
        </ToolbarButton>
        
        <div className="w-px h-6 bg-gray-500/30 mx-1" />

        {/* Group 2: History */}
        <ToolbarButton onClick={onUndo} disabled={!canUndo} tooltip="Undo (Ctrl+Z)">
            <UndoIcon className="w-5 h-5 text-gray-300" />
        </ToolbarButton>
        <ToolbarButton onClick={onRedo} disabled={!canRedo} tooltip="Redo (Ctrl+Shift+Z)">
            <RedoIcon className="w-5 h-5 text-gray-300" />
        </ToolbarButton>
        
        <div className="w-px h-6 bg-gray-500/30 mx-1" />
        
        {/* Group 3: Add Node Dropdown */}
        <div className="relative" ref={addMenuRef}>
            <button
                onClick={() => setIsAddMenuOpen(!isAddMenuOpen)}
                className={`flex items-center space-x-2 px-3 py-2 ${styles.toolbar.buttonBg} ${styles.toolbar.buttonHoverBg} rounded-md transition-colors text-sm font-medium`}
            >
                <PlusIcon className="w-5 h-5 text-gray-300" />
                <span>Add Node</span>
                <ChevronDownIcon className={`w-4 h-4 text-gray-400 transition-transform duration-200 ${isAddMenuOpen ? 'rotate-180' : ''}`} />
            </button>
            {isAddMenuOpen && (
                <div 
                    className={`absolute top-full mt-2 w-56 p-1 ${styles.toolbar.bg} backdrop-blur-sm border ${styles.toolbar.border} rounded-lg shadow-lg z-10`}
                    role="menu"
                >
                    {nodeTypes.map((nodeType) => (
                        <button
                            key={nodeType.label}
                            onClick={() => {
                                nodeType.action();
                                setIsAddMenuOpen(false);
                            }}
                            className={`w-full flex items-center space-x-3 px-3 py-2 text-left ${styles.toolbar.buttonHoverBg} rounded-md transition-colors text-sm font-medium`}
                            role="menuitem"
                        >
                            {nodeType.icon}
                            <span>{nodeType.label}</span>
                        </button>
                    ))}
                </div>
            )}
        </div>
      </div>
    </div>
  );
};

export default Toolbar;