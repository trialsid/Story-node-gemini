
import React from 'react';
import { NodeData, NodeType, Connection } from '../types';
import ImageIcon from './icons/ImageIcon';
import SparklesIcon from './icons/SparklesIcon';
import TextIcon from './icons/TextIcon';
import EditIcon from './icons/EditIcon';
import TrashIcon from './icons/TrashIcon';
import NodeHandle from './NodeHandle';

interface NodeProps {
  node: NodeData;
  connections: Connection[];
  onDragStart: (nodeId: string, e: React.MouseEvent) => void;
  onUpdateData: (nodeId: string, data: Partial<NodeData['data']>) => void;
  onGenerateImage: (nodeId: string) => void;
  onEditImage: (nodeId: string) => void;
  onImageClick: (imageUrl: string) => void;
  onOutputMouseDown: (nodeId: string) => void;
  onInputMouseDown: (nodeId: string) => void;
  onInputMouseUp: (nodeId: string) => void;
  onDelete: (nodeId: string) => void;
  dimensions: { width: number; height: number };
}

interface NodeHeaderProps {
  title: string;
  icon: React.ReactNode;
  onDelete: () => void;
}

const NodeHeader: React.FC<NodeHeaderProps> = ({ title, icon, onDelete }) => (
  <div className="flex items-center justify-between p-2 bg-gray-700 rounded-t-lg cursor-move">
    <div className="flex items-center space-x-2">
      {icon}
      <span className="font-bold text-sm">{title}</span>
    </div>
    <button
      onMouseDown={(e) => e.stopPropagation()}
      onClick={onDelete}
      className="p-1 rounded-full text-gray-400 hover:bg-red-500/50 hover:text-white transition-colors z-10"
      aria-label="Delete node"
    >
      <TrashIcon className="w-4 h-4" />
    </button>
  </div>
);

const selectClassName = "w-full p-1 bg-gray-900 border border-gray-600 rounded-md text-sm text-gray-200 focus:outline-none focus:ring-2 focus:ring-cyan-500";
const labelClassName = "text-xs font-semibold text-gray-400";
const imagePreviewClassName = "w-full h-[128px] bg-gray-900/50 rounded-md flex items-center justify-center border border-dashed border-gray-600";

const Node: React.FC<NodeProps> = ({
  node,
  connections,
  onDragStart,
  onUpdateData,
  onGenerateImage,
  onEditImage,
  onImageClick,
  onOutputMouseDown,
  onInputMouseDown,
  onInputMouseUp,
  onDelete,
  dimensions
}) => {
  const handleMouseDown = (e: React.MouseEvent) => {
    if ((e.target as HTMLElement).closest('.cursor-move')) {
        onDragStart(node.id, e);
    }
  };
  
  const handleTextAreaKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>, nodeType: NodeType) => {
    if (e.ctrlKey && e.key === 'Enter') {
      e.preventDefault();
      if (nodeType === NodeType.CharacterGenerator) {
        onGenerateImage(node.id);
      } else if (nodeType === NodeType.ImageEditor) {
        onEditImage(node.id);
      }
    }
  };

  const isInputConnected = connections.some(c => c.toNodeId === node.id);
  const isOutputConnected = connections.some(c => c.fromNodeId === node.id);

  return (
    <div
      className="absolute bg-gray-800 border border-gray-700 rounded-lg shadow-xl flex flex-col"
      style={{
        left: node.position.x,
        top: node.position.y,
        width: `${dimensions.width}px`,
        height: `${dimensions.height}px`
      }}
      onMouseDownCapture={handleMouseDown}
    >
      {node.type === NodeType.Text && (
        <>
            <NodeHeader 
                title='Text Node'
                icon={<TextIcon className="w-4 h-4 text-yellow-400" />}
                onDelete={() => onDelete(node.id)}
            />
            <div className="flex-grow p-2 space-y-2">
                <label className={labelClassName}>Text Output</label>
                <textarea
                    value={node.data.text || ''}
                    onChange={(e) => onUpdateData(node.id, { text: e.target.value })}
                    className="w-full h-24 p-1 bg-gray-900 border border-gray-600 rounded-md text-sm text-gray-200 focus:outline-none focus:ring-2 focus:ring-yellow-500 resize-none"
                    placeholder="Type your text here..."
                />
            </div>
            <NodeHandle
                onMouseDown={() => onOutputMouseDown(node.id)}
                isConnected={isOutputConnected}
                style={{ right: -8, top: '50%', transform: 'translateY(-50%)' }}
            />
        </>
      )}

      {node.type === NodeType.CharacterGenerator && (
        <>
            <NodeHandle
                onMouseDown={() => onInputMouseDown(node.id)}
                onMouseUp={() => onInputMouseUp(node.id)}
                isConnected={isInputConnected}
                style={{ left: -8, top: 220 }}
            />
            <NodeHeader 
                title='Character Generator'
                icon={<ImageIcon className="w-4 h-4 text-cyan-400" />}
                onDelete={() => onDelete(node.id)}
            />
            <div className="flex-grow p-2 space-y-2 overflow-y-auto">
                <div>
                    <label className={labelClassName}>Style</label>
                    <select value={node.data.style || 'Studio Portrait Photo'} onChange={(e) => onUpdateData(node.id, { style: e.target.value })} className={selectClassName}>
                        <option>Studio Portrait Photo</option><option>Cinematic Film Still</option><option>Action Shot Photo</option><option>Golden Hour Portrait</option><option>Fashion Magazine Shot</option><option>Candid Photo</option><option>Black and White Photo</option><option>Documentary Style Photo</option>
                    </select>
                </div>
                <div>
                    <label className={labelClassName}>Layout</label>
                    <select value={node.data.layout || '4-panel grid'} onChange={(e) => onUpdateData(node.id, { layout: e.target.value })} className={selectClassName}>
                        <option value="4-panel grid">4-Panel Grid</option><option value="6-panel grid">6-Panel Grid</option><option value="T-pose reference sheet">T-Pose Sheet</option>
                    </select>
                </div>
                <div>
                    <label className={labelClassName}>Aspect Ratio</label>
                    <select value={node.data.aspectRatio || '1:1'} onChange={(e) => onUpdateData(node.id, { aspectRatio: e.target.value })} className={selectClassName}>
                        <option value="1:1">1:1 (Square)</option><option value="4:3">4:3 (Landscape)</option><option value="3:4">3:4 (Portrait)</option><option value="16:9">16:9 (Widescreen)</option><option value="9:16">9:16 (Portrait)</option>
                    </select>
                </div>
                <div>
                    <label className={labelClassName}>Character Description</label>
                    <textarea
                        value={node.data.characterDescription || ''}
                        onChange={(e) => onUpdateData(node.id, { characterDescription: e.target.value })}
                        onKeyDown={(e) => handleTextAreaKeyDown(e, node.type)}
                        className={`w-full h-20 p-1 bg-gray-900 border border-gray-600 rounded-md text-sm text-gray-200 focus:outline-none focus:ring-2 focus:ring-cyan-500 resize-none ${isInputConnected ? 'bg-gray-700 text-gray-400' : ''}`}
                        placeholder={isInputConnected ? "Controlled by connection" : "e.g., A brave knight..."}
                        disabled={isInputConnected}
                    />
                </div>
                <div className="w-full h-[256px] bg-gray-900/50 rounded-md flex items-center justify-center border border-dashed border-gray-600 relative">
                    {node.data.isLoading && <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-cyan-400"></div>}
                    {node.data.error && <p className="text-xs text-red-400 p-2 text-center">{node.data.error}</p>}
                    {node.data.imageUrl && !node.data.isLoading && (
                        <>
                          <img src={node.data.imageUrl} alt="Generated" className="object-contain w-full h-full rounded-md cursor-pointer hover:opacity-80 transition-opacity" onClick={() => onImageClick(node.data.imageUrl!)} />
                          <NodeHandle
                              onMouseDown={() => onOutputMouseDown(node.id)}
                              isConnected={isOutputConnected}
                              style={{ right: -8, top: '50%', transform: 'translateY(-50%)' }}
                          />
                        </>
                    )}
                    {!node.data.imageUrl && !node.data.isLoading && !node.data.error && <ImageIcon className="w-10 h-10 text-gray-600" />}
                </div>
                <button onClick={() => onGenerateImage(node.id)} disabled={node.data.isLoading} className="w-full flex items-center justify-center space-x-2 bg-cyan-600 hover:bg-cyan-500 disabled:bg-gray-600 disabled:cursor-not-allowed text-white font-semibold py-2 px-4 rounded-md transition-colors text-sm">
                    <SparklesIcon className="w-4 h-4" />
                    <span>{node.data.isLoading ? 'Generating...' : 'Generate (Ctrl+Enter)'}</span>
                </button>
            </div>
        </>
      )}
      
      {node.type === NodeType.ImageEditor && (
        <>
            <NodeHandle
                onMouseDown={() => onInputMouseDown(node.id)}
                onMouseUp={() => onInputMouseUp(node.id)}
                isConnected={isInputConnected}
                style={{ left: -8, top: 70 }}
            />
            <NodeHeader 
                title='Image Editor'
                icon={<EditIcon className="w-4 h-4 text-purple-400" />}
                onDelete={() => onDelete(node.id)}
            />
            <div className="flex-grow p-2 space-y-2 overflow-y-auto">
                <div>
                    <label className={labelClassName}>Input Image</label>
                    <div className={imagePreviewClassName}>
                        {node.data.inputImageUrl ? (
                             <img src={node.data.inputImageUrl} alt="Input" className="object-contain w-full h-full rounded-md" />
                        ) : (
                            <div className="text-center text-gray-500 text-xs">
                                <ImageIcon className="w-8 h-8 mx-auto mb-1" />
                                <p>Connect an image output</p>
                            </div>
                        )}
                    </div>
                </div>
                 <div>
                    <label className={labelClassName}>Edit Description</label>
                    <textarea
                        value={node.data.editDescription || ''}
                        onChange={(e) => onUpdateData(node.id, { editDescription: e.target.value })}
                        onKeyDown={(e) => handleTextAreaKeyDown(e, node.type)}
                        className={`w-full h-20 p-1 bg-gray-900 border border-gray-600 rounded-md text-sm text-gray-200 focus:outline-none focus:ring-2 focus:ring-purple-500 resize-none`}
                        placeholder={"e.g., Add a futuristic helmet..."}
                    />
                </div>
                 <div className="w-full h-[256px] bg-gray-900/50 rounded-md flex items-center justify-center border border-dashed border-gray-600">
                    {node.data.isLoading && <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-purple-400"></div>}
                    {node.data.error && <p className="text-xs text-red-400 p-2 text-center">{node.data.error}</p>}
                    {node.data.imageUrl && !node.data.isLoading && (
                        <img src={node.data.imageUrl} alt="Edited" className="object-contain w-full h-full rounded-md cursor-pointer hover:opacity-80 transition-opacity" onClick={() => onImageClick(node.data.imageUrl!)} />
                    )}
                    {!node.data.imageUrl && !node.data.isLoading && !node.data.error && <ImageIcon className="w-10 h-10 text-gray-600" />}
                </div>
                <button onClick={() => onEditImage(node.id)} disabled={node.data.isLoading || !node.data.inputImageUrl} className="w-full flex items-center justify-center space-x-2 bg-purple-600 hover:bg-purple-500 disabled:bg-gray-600 disabled:cursor-not-allowed text-white font-semibold py-2 px-4 rounded-md transition-colors text-sm">
                    <SparklesIcon className="w-4 h-4" />
                    <span>{node.data.isLoading ? 'Generating...' : 'Generate (Ctrl+Enter)'}</span>
                </button>
            </div>
        </>
      )}
    </div>
  );
};

export default Node;
