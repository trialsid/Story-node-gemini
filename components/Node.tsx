import React from 'react';
import { NodeData } from '../types';
import ImageIcon from './icons/ImageIcon';
import SparklesIcon from './icons/SparklesIcon';

interface NodeProps {
  node: NodeData;
  onDragStart: (nodeId: string, e: React.MouseEvent) => void;
  onUpdateData: (nodeId: string, data: Partial<NodeData['data']>) => void;
  onGenerateImage: (nodeId: string) => void;
  onImageClick: (imageUrl: string) => void;
  dimensions: { width: number; height: number };
}

const NodeHeader: React.FC<{ title: string; icon: React.ReactNode }> = ({ title, icon }) => (
  <div className="flex items-center space-x-2 p-2 bg-gray-700 rounded-t-lg cursor-move">
    {icon}
    <span className="font-bold text-sm">{title}</span>
  </div>
);

const selectClassName = "w-full p-1 bg-gray-900 border border-gray-600 rounded-md text-sm text-gray-200 focus:outline-none focus:ring-2 focus:ring-cyan-500";
const labelClassName = "text-xs font-semibold text-gray-400";

const Node: React.FC<NodeProps> = ({
  node,
  onDragStart,
  onUpdateData,
  onGenerateImage,
  onImageClick,
  dimensions
}) => {
  const handleMouseDown = (e: React.MouseEvent) => {
    onDragStart(node.id, e);
  };
  
  const handleTextAreaKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.ctrlKey && e.key === 'Enter') {
      e.preventDefault();
      onGenerateImage(node.id);
    }
  };

  return (
    <div
      className="absolute bg-gray-800 border border-gray-700 rounded-lg shadow-xl flex flex-col"
      style={{
        left: node.position.x,
        top: node.position.y,
        width: `${dimensions.width}px`,
        height: `${dimensions.height}px`
      }}
    >
        <div onMouseDown={handleMouseDown}>
            <NodeHeader 
                title='Image Generator'
                icon={<ImageIcon className="w-4 h-4 text-cyan-400" />}
            />
        </div>

        <div className="flex-grow p-2 space-y-2 overflow-y-auto">
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
                className="w-full h-20 p-1 bg-gray-900 border border-gray-600 rounded-md text-sm text-gray-200 focus:outline-none focus:ring-2 focus:ring-cyan-500 resize-none"
                placeholder="e.g., A brave knight with a scar..."
              />
          </div>
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
            disabled={node.data.isLoading}
            className="w-full flex items-center justify-center space-x-2 bg-cyan-600 hover:bg-cyan-500 disabled:bg-gray-600 disabled:cursor-not-allowed text-white font-semibold py-2 px-4 rounded-md transition-colors text-sm"
          >
            <SparklesIcon className="w-4 h-4" />
            <span>{node.data.isLoading ? 'Generating...' : 'Generate (Ctrl+Enter)'}</span>
          </button>
        </div>
    </div>
  );
};

export default Node;
