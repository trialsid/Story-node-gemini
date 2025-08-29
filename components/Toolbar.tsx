
import React from 'react';
import ImageIcon from './icons/ImageIcon';
import TextIcon from './icons/TextIcon';
import EditIcon from './icons/EditIcon';
import { useTheme } from '../contexts/ThemeContext';

interface ToolbarProps {
  onAddNode: () => void;
  onAddTextNode: () => void;
  onAddImageEditorNode: () => void;
}

const ToolbarButton: React.FC<{ onClick: () => void; children: React.ReactNode; }> = ({ onClick, children }) => {
    const { styles } = useTheme();
    return (
        <button
            onClick={onClick}
            className={`flex items-center space-x-2 px-3 py-2 ${styles.toolbar.buttonBg} ${styles.toolbar.buttonHoverBg} rounded-md transition-colors text-sm font-medium`}
        >
            {children}
        </button>
    )
}

const Toolbar: React.FC<ToolbarProps> = ({ onAddNode, onAddTextNode, onAddImageEditorNode }) => {
  const { styles } = useTheme();
  return (
    <div className={`absolute top-4 left-4 z-20 p-2 ${styles.toolbar.bg} backdrop-blur-sm border ${styles.toolbar.border} rounded-lg shadow-lg`}>
      <div className="flex items-center space-x-2">
        <ToolbarButton onClick={onAddNode}>
            <ImageIcon className="w-5 h-5 text-cyan-400" />
            <span>Add Character Generator</span>
        </ToolbarButton>
        <ToolbarButton onClick={onAddTextNode}>
            <TextIcon className="w-5 h-5 text-yellow-400" />
            <span>Add Text Node</span>
        </ToolbarButton>
        <ToolbarButton onClick={onAddImageEditorNode}>
            <EditIcon className="w-5 h-5 text-purple-400" />
            <span>Add Image Editor</span>
        </ToolbarButton>
      </div>
    </div>
  );
};

export default Toolbar;
