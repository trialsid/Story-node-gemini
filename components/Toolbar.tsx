import React from 'react';
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

interface ToolbarProps {
  onNavigateHome: () => void;
  onClearCanvas: () => void;
  onSaveProject: () => void;
  onLoadProject: () => void;
  onAddNode: () => void;
  onAddTextNode: () => void;
  onAddGeminiTextNode: () => void;
  onAddImageNode: () => void;
  onAddImageEditorNode: () => void;
  onAddVideoGeneratorNode: () => void;
  onUndo: () => void;
  onRedo: () => void;
  canUndo: boolean;
  canRedo: boolean;
}

const ToolbarButton: React.FC<{ onClick: () => void; children: React.ReactNode; isHome?: boolean; disabled?: boolean; }> = ({ onClick, children, isHome = false, disabled = false }) => {
    const { styles } = useTheme();
    return (
        <button
            onClick={onClick}
            disabled={disabled}
            className={`flex items-center space-x-2 px-3 py-2 ${styles.toolbar.buttonBg} ${isHome ? 'hover:bg-cyan-500/20' : styles.toolbar.buttonHoverBg} rounded-md transition-colors text-sm font-medium disabled:opacity-50 disabled:cursor-not-allowed`}
        >
            {children}
        </button>
    )
}

const Toolbar: React.FC<ToolbarProps> = ({ 
    onNavigateHome, 
    onClearCanvas, 
    onSaveProject,
    onLoadProject,
    onAddNode, 
    onAddTextNode, 
    onAddGeminiTextNode,
    onAddImageNode, 
    onAddImageEditorNode, 
    onAddVideoGeneratorNode,
    onUndo,
    onRedo,
    canUndo,
    canRedo,
}) => {
  const { styles } = useTheme();
  return (
    <div className={`absolute top-4 left-4 z-20 p-2 ${styles.toolbar.bg} backdrop-blur-sm border ${styles.toolbar.border} rounded-lg shadow-lg`}>
      <div className="flex items-center space-x-2">
        <ToolbarButton onClick={onNavigateHome} isHome>
            <HomeIcon className="w-5 h-5 text-cyan-400" />
            <span>Home</span>
        </ToolbarButton>
        <ToolbarButton onClick={onSaveProject}>
            <SaveIcon className="w-5 h-5 text-gray-300" />
            <span>Save</span>
        </ToolbarButton>
        <ToolbarButton onClick={onLoadProject}>
            <LoadIcon className="w-5 h-5 text-gray-300" />
            <span>Load</span>
        </ToolbarButton>
        <ToolbarButton onClick={onClearCanvas}>
            <ClearCanvasIcon className="w-5 h-5 text-red-400" />
            <span>Clear</span>
        </ToolbarButton>
        <div className="w-px h-6 bg-gray-500/30" />
        <ToolbarButton onClick={onUndo} disabled={!canUndo}>
            <UndoIcon className="w-5 h-5 text-gray-300" />
            <span>Undo</span>
        </ToolbarButton>
        <ToolbarButton onClick={onRedo} disabled={!canRedo}>
            <RedoIcon className="w-5 h-5 text-gray-300" />
            <span>Redo</span>
        </ToolbarButton>
        <div className="w-px h-6 bg-gray-500/30" />
        <ToolbarButton onClick={onAddNode}>
            <ImageIcon className="w-5 h-5 text-cyan-400" />
            <span>Character Gen</span>
        </ToolbarButton>
        <ToolbarButton onClick={onAddGeminiTextNode}>
            <BotIcon className="w-5 h-5 text-indigo-400" />
            <span>Gemini Text</span>
        </ToolbarButton>
        <ToolbarButton onClick={onAddTextNode}>
            <TextIcon className="w-5 h-5 text-yellow-400" />
            <span>Text</span>
        </ToolbarButton>
        <ToolbarButton onClick={onAddImageNode}>
            <UploadIcon className="w-5 h-5 text-orange-400" />
            <span>Image</span>
        </ToolbarButton>
        <ToolbarButton onClick={onAddImageEditorNode}>
            <EditIcon className="w-5 h-5 text-purple-400" />
            <span>Image Editor</span>
        </ToolbarButton>
        <ToolbarButton onClick={onAddVideoGeneratorNode}>
            <VideoIcon className="w-5 h-5 text-green-400" />
            <span>Video Gen</span>
        </ToolbarButton>
      </div>
    </div>
  );
};

export default Toolbar;