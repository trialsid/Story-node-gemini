import React from 'react';
import ImageIcon from './icons/ImageIcon';
import TextIcon from './icons/TextIcon';
import EditIcon from './icons/EditIcon';

interface ToolbarProps {
  onAddNode: () => void;
  onAddTextNode: () => void;
  onAddImageEditorNode: () => void;
}

const ToolbarButton: React.FC<{ onClick: () => void; children: React.ReactNode; }> = ({ onClick, children }) => (
    <button
        onClick={onClick}
        className="flex items-center space-x-2 px-3 py-2 bg-gray-700 hover:bg-gray-600 rounded-md transition-colors text-sm font-medium"
    >
        {children}
    </button>
)

const Toolbar: React.FC<ToolbarProps> = ({ onAddNode, onAddTextNode, onAddImageEditorNode }) => {
  return (
    <div className="absolute top-4 left-4 z-20 p-2 bg-gray-800/80 backdrop-blur-sm border border-gray-700 rounded-lg shadow-lg">
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