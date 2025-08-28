import React from 'react';
import { NodeData, NodeType } from '../types';
import TextIcon from './icons/TextIcon';
import ImageIcon from './icons/ImageIcon';
import SparklesIcon from './icons/SparklesIcon';

interface NodeProps {
  node: NodeData;
  onDragStart: (nodeId: string, e: React.MouseEvent) => void;
  onStartConnection: (fromNodeId: string, fromHandleId: string, e: React.MouseEvent) => void;
  onCompleteConnection: (toNodeId: string, toHandleId: string) => void;
  onUpdateData: (nodeId: string, data: Partial<NodeData['data']>) => void;
  onGenerateImage: (nodeId: string) => void;
  onImageClick: (imageUrl: string) => void;
  onTriggerGenerationFromNode: (nodeId: string) => void;
  isInputConnected: boolean;
  dimensions: { width: number; height: number };
}

const NodeHeader: React.FC<{ title: string; icon: React.ReactNode }> = ({ title, icon }) => (
  <div className="flex items-center space-x-2 p-2 bg-gray-700 rounded-t-lg cursor-move">
    {icon}
    <span className="font-bold text-sm">{title}</span>
  </div>
);

const ConnectionHandle: React.FC<{
    isInput?: boolean;
    onMouseDown?: (e: React.MouseEvent) => void;
    onMouseUp?: () => void;
}> = ({ isInput = false, onMouseDown, onMouseUp }) => {
    const positionClass = isInput ? '-left-2' : '-right-2';
    return (
        <div
            className={`absolute top-1/2 -translate-y-1/2 ${positionClass} w-4 h-4 rounded-full bg-gray-600 border-2 border-gray-900 hover:bg-cyan-400 transition-colors cursor-crosshair`}
            onMouseDown={onMouseDown}
            onMouseUp={onMouseUp}
        />
    );
};

const selectClassName = "w-full p-1 bg-gray-900 border border-gray-600 rounded-md text-sm text-gray-200 focus:outline-none focus:ring-2 focus:ring-cyan-500";
const labelClassName = "text-xs font-semibold text-gray-400";

const Node: React.FC<NodeProps> = ({
  node,
  onDragStart,
  onStartConnection,
  onCompleteConnection,
  onUpdateData,
  onGenerateImage,
  onImageClick,
  onTriggerGenerationFromNode,
  isInputConnected,
  dimensions
}) => {
  const handleMouseDown = (e: React.MouseEvent) => {
    onDragStart(node.id, e);
  };
  
  const handleTextAreaKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.ctrlKey && e.key === 'Enter') {
      e.preventDefault();
      onTriggerGenerationFromNode(node.id);
    }
  };

  const renderContent = () => {
    switch (node.type) {
      case NodeType.CharacterSheet:
        return (
          <div className="p-2 space-y-2">
            <div>
                <label className={labelClassName}>Style</label>
                <select 
                    value={node.data.style || 'Studio Portrait Photo'} 
                    onChange={(e) => onUpdateData(node.id, { style: e.target.value })}
                    className={selectClassName}
                >
                    <option>Studio Portrait Photo</option>
                    <option>Cinematic Film Still</option>
                    <option>Action Shot Photo</option>
                    <option>Golden Hour Portrait</option>
                    <option>Fashion Magazine Shot</option>
                    <option>Candid Photo</option>
                    <option>Black and White Photo</option>
                    <option>Documentary Style Photo</option>
                </select>
            </div>
            <div>
                <label className={labelClassName}>Layout</label>
                <select 
                    value={node.data.layout || '4-panel grid'} 
                    onChange={(e) => onUpdateData(node.id, { layout: e.target.value })}
                    className={selectClassName}
                >
                    <option value="4-panel grid">4-Panel Grid</option>
                    <option value="6-panel grid">6-Panel Grid</option>
                    <option value="T-pose reference sheet">T-Pose Sheet</option>
                </select>
            </div>
             <div>
                <label className={labelClassName}>Aspect Ratio</label>
                <select 
                    value={node.data.aspectRatio || '1:1'}
                    onChange={(e) => onUpdateData(node.id, { aspectRatio: e.target.value })}
                    className={selectClassName}
                >
                    <option value="1:1">1:1 (Square)</option>
                    <option value="4:3">4:3 (Landscape)</option>
                    <option value="3:4">3:4 (Portrait)</option>
                    <option value="16:9">16:9 (Widescreen)</option>
                    <option value="9:16">9:16 (Portrait)</option>
                </select>
            </div>
            <div>
                <label className={labelClassName}>Character Description</label>
                <textarea
                  value={node.data.characterDescription || ''}
                  onChange={(e) => onUpdateData(node.id, { characterDescription: e.target.value })}
                  onKeyDown={handleTextAreaKeyDown}
                  className="w-full h-24 p-1 bg-gray-900 border border-gray-600 rounded-md text-sm text-gray-200 focus:outline-none focus:ring-2 focus:ring-cyan-500 resize-none"
                  placeholder="e.g., A brave knight with a scar..."
                />
            </div>
          </div>
        );
      case NodeType.ImageGenerator:
        return (
          <div className="p-2 flex flex-col items-center justify-between h-full">
            <div className="w-full h-[256px] bg-gray-900/50 rounded-md flex items-center justify-center border border-dashed border-gray-600">
              {node.data.isLoading && <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-cyan-400"></div>}
              {node.data.error && <p className="text-xs text-red-400 p-2 text-center">{node.data.error}</p>}
              {node.data.imageUrl && !node.data.isLoading && (
                <img 
                  src={node.data.imageUrl} 
                  alt="Generated" 
                  className="object-contain w-full h-full rounded-md cursor-pointer hover:opacity-80 transition-opacity"
                  onClick={() => onImageClick(node.data.imageUrl!)} 
                />
              )}
              {!node.data.imageUrl && !node.data.isLoading && !node.data.error && <ImageIcon className="w-10 h-10 text-gray-600" />}
            </div>
            <button
              onClick={() => onGenerateImage(node.id)}
              disabled={!isInputConnected || node.data.isLoading}
              className="mt-2 w-full flex items-center justify-center space-x-2 bg-cyan-600 hover:bg-cyan-500 disabled:bg-gray-600 disabled:cursor-not-allowed text-white font-semibold py-2 px-4 rounded-md transition-colors text-sm"
            >
              <SparklesIcon className="w-4 h-4" />
              <span>{node.data.isLoading ? 'Generating...' : 'Generate'}</span>
            </button>
          </div>
        );
      default:
        return null;
    }
  };

  return (
    <div
      className="absolute bg-gray-800 border border-gray-700 rounded-lg shadow-xl"
      style={{
        left: node.position.x,
        top: node.position.y,
        width: `${dimensions.width}px`,
        height: `${dimensions.height}px`
      }}
    >
        {node.type === NodeType.ImageGenerator && <ConnectionHandle isInput onMouseUp={() => onCompleteConnection(node.id, 'input')} />}
        {node.type === NodeType.CharacterSheet && <ConnectionHandle onMouseDown={(e) => onStartConnection(node.id, 'output', e)} />}
        
        <div onMouseDown={handleMouseDown}>
            <NodeHeader 
                title={node.type === NodeType.CharacterSheet ? 'Character Sheet' : 'Image Generator'}
                icon={node.type === NodeType.CharacterSheet ? <TextIcon className="w-4 h-4 text-cyan-400" /> : <ImageIcon className="w-4 h-4 text-cyan-400" />}
            />
        </div>

        <div className="h-[calc(100%-36px)] overflow-y-auto">
            {renderContent()}
        </div>
    </div>
  );
};

export default Node;