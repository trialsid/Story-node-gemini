import React from 'react';
import { NodeType } from '../types';
import TextIcon from './icons/TextIcon';
import ImageIcon from './icons/ImageIcon';

interface ToolbarProps {
  onAddNode: (type: NodeType) => void;
}

const ToolbarButton: React.FC<{ onClick: () => void; children: React.ReactNode; }> = ({ onClick, children }) => (
    <button
        onClick={onClick}
        className="flex items-center space-x-2 px-3 py-2 bg-gray-700 hover:bg-gray-600 rounded-md transition-colors text-sm font-medium"
    >
        {children}
    </button>
)

const Toolbar: React.FC<ToolbarProps> = ({ onAddNode }) => {
  return (
    <div className="absolute top-4 left-4 z-10 p-2 bg-gray-800/80 backdrop-blur-sm border border-gray-700 rounded-lg shadow-lg">
      <div className="flex items-center space-x-2">
        <ToolbarButton onClick={() => onAddNode(NodeType.CharacterSheet)}>
            <TextIcon className="w-5 h-5 text-cyan-400" />
            <span>Add Character Sheet</span>
        </ToolbarButton>
        <ToolbarButton onClick={() => onAddNode(NodeType.ImageGenerator)}>
            <ImageIcon className="w-5 h-5 text-cyan-400" />
            <span>Add Image Node</span>
        </ToolbarButton>
      </div>
    </div>
  );
};

export default Toolbar;