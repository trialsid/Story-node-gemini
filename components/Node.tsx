
import React, { useRef, useEffect } from 'react';
import { NodeData, NodeType, Connection } from '../types';
import ImageIcon from './icons/ImageIcon';
import SparklesIcon from './icons/SparklesIcon';
import TextIcon from './icons/TextIcon';
import EditIcon from './icons/EditIcon';
import TrashIcon from './icons/TrashIcon';
import NodeHandle from './NodeHandle';
import { useTheme } from '../contexts/ThemeContext';
import ChevronDownIcon from './icons/ChevronDownIcon';
import ChevronUpIcon from './icons/ChevronUpIcon';

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
  onToggleMinimize: (nodeId: string) => void;
  dimensions: { width: number; height?: number };
}

interface NodeHeaderProps {
  title: string;
  icon: React.ReactNode;
  isMinimized: boolean;
  onToggleMinimize: () => void;
  onDelete: () => void;
}

const NodeHeader: React.FC<NodeHeaderProps> = ({ title, icon, isMinimized, onToggleMinimize, onDelete }) => {
  const { styles } = useTheme();
  return (
    <div className={`flex items-center justify-between p-2 ${styles.node.headerBg} rounded-t-lg cursor-move`}>
      <div className="flex items-center space-x-2">
        {icon}
        <span className="font-bold text-sm">{title}</span>
      </div>
      <div className="flex items-center space-x-1">
        <button
          onMouseDown={(e) => e.stopPropagation()}
          onClick={onToggleMinimize}
          className="p-1 rounded-full text-gray-400 hover:bg-gray-600/50 hover:text-white transition-colors z-10"
          aria-label={isMinimized ? 'Expand node' : 'Minimize node'}
        >
          {isMinimized ? <ChevronDownIcon className="w-4 h-4" /> : <ChevronUpIcon className="w-4 h-4" />}
        </button>
        <button
          onMouseDown={(e) => e.stopPropagation()}
          onClick={onDelete}
          className="p-1 rounded-full text-gray-400 hover:bg-red-500/50 hover:text-white transition-colors z-10"
          aria-label="Delete node"
        >
          <TrashIcon className="w-4 h-4" />
        </button>
      </div>
    </div>
  );
};

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
  onToggleMinimize,
  dimensions
}) => {
  const { styles } = useTheme();

  const selectClassName = `w-full p-1 ${styles.node.inputBg} border ${styles.node.inputBorder} rounded-md text-sm ${styles.node.text} focus:outline-none focus:ring-2 ${styles.node.inputFocusRing}`;
  const labelClassName = `text-xs font-semibold ${styles.node.labelText}`;
  const imagePreviewBaseClassName = `w-full ${styles.node.imagePlaceholderBg} rounded-md flex items-center justify-center border border-dashed ${styles.node.imagePlaceholderBorder}`;
  const textAreaClassName = (isDisabled = false) => `w-full h-20 p-1 ${isDisabled ? 'bg-gray-700 text-gray-400' : styles.node.inputBg} border ${styles.node.inputBorder} rounded-md text-sm ${isDisabled ? '' : styles.node.text} focus:outline-none focus:ring-2 ${styles.node.inputFocusRing} resize-none`;

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
  
  const nodeRef = useRef<HTMLDivElement>(null);
  const charGenInputRef = useRef<HTMLDivElement>(null);
  const charGenStyleRef = useRef<HTMLDivElement>(null);
  const imgEditorInputRef = useRef<HTMLDivElement>(null);
  const charGenOutputRef = useRef<HTMLDivElement>(null);
  const imgEditorOutputRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (node.type === NodeType.Text && nodeRef.current) {
        const totalHeight = nodeRef.current.offsetHeight;
        const yPosition = totalHeight / 2;
        if (Math.abs((node.data.outputHandleYOffset || 0) - yPosition) > 1) {
            onUpdateData(node.id, { outputHandleYOffset: yPosition });
        }
    }
  }, [node.type, node.data.isMinimized, onUpdateData, node.id]);

  useEffect(() => {
    const isCharGen = node.type === NodeType.CharacterGenerator;
    const inputRef = isCharGen
      ? (node.data.isMinimized ? charGenStyleRef : charGenInputRef)
      : imgEditorInputRef;

    if (inputRef.current?.parentElement?.parentElement) {
      const header = inputRef.current.parentElement.parentElement.querySelector(':scope > div:first-child');
      if (header) {
        const headerHeight = header.clientHeight;
        const contentPaddingTop = 8; // p-2
        const yPosition = headerHeight + contentPaddingTop + inputRef.current.offsetTop + (inputRef.current.offsetHeight * 0.25);

        if (Math.abs((node.data.inputHandleYOffset || 0) - yPosition) > 1) {
            onUpdateData(node.id, { inputHandleYOffset: yPosition });
        }
      }
    }
  }, [node.type, onUpdateData, node.id, node.data.inputHandleYOffset, node.data.isMinimized]);

  useEffect(() => {
    const outputRef = node.type === NodeType.CharacterGenerator ? charGenOutputRef : imgEditorOutputRef;
    if (outputRef.current?.parentElement?.parentElement) {
      const header = outputRef.current.parentElement.parentElement.querySelector(':scope > div:first-child');
      if (header) {
        const headerHeight = header.clientHeight;
        // The content div has p-2 (8px top padding)
        const contentPaddingTop = 8;
        const yPosition = headerHeight + contentPaddingTop + outputRef.current.offsetTop + outputRef.current.offsetHeight * 0.25;
        
        if (Math.abs((node.data.outputHandleYOffset || 0) - yPosition) > 1) {
            onUpdateData(node.id, { outputHandleYOffset: yPosition });
        }
      }
    }
  }, [node.type, node.data.imageUrl, node.data.isLoading, node.data.error, onUpdateData, node.id, node.data.outputHandleYOffset, node.data.isMinimized]);


  return (
    <div
      ref={nodeRef}
      className={`absolute ${styles.node.bg} border ${styles.node.border} rounded-lg flex flex-col`}
      style={{
        left: node.position.x,
        top: node.position.y,
        width: `${dimensions.width}px`,
        height: dimensions.height ? `${dimensions.height}px` : undefined,
      }}
      onMouseDownCapture={handleMouseDown}
    >
      {node.type === NodeType.Text && (
        <>
            <NodeHeader 
                title='Text Node'
                icon={<TextIcon className="w-4 h-4 text-yellow-400" />}
                isMinimized={!!node.data.isMinimized}
                onToggleMinimize={() => onToggleMinimize(node.id)}
                onDelete={() => onDelete(node.id)}
            />
            <div className="flex-grow p-2 space-y-2">
                {!node.data.isMinimized && <label className={labelClassName}>Text Output</label>}
                <textarea
                    value={node.data.text || ''}
                    onChange={(e) => onUpdateData(node.id, { text: e.target.value })}
                    className={`w-full h-24 p-1 ${styles.node.inputBg} border ${styles.node.inputBorder} rounded-md text-sm ${styles.node.text} focus:outline-none focus:ring-2 ${styles.node.inputFocusRing} resize-none`}
                    placeholder="Type your text here..."
                />
            </div>
            {!!node.data.outputHandleYOffset && (
                <NodeHandle
                    onMouseDown={() => onOutputMouseDown(node.id)}
                    isConnected={isOutputConnected}
                    style={{ right: -8, top: node.data.outputHandleYOffset - 8 }}
                />
            )}
        </>
      )}

      {node.type === NodeType.CharacterGenerator && (
        <>
            <NodeHandle
                onMouseDown={() => onInputMouseDown(node.id)}
                onMouseUp={() => onInputMouseUp(node.id)}
                isConnected={isInputConnected}
                style={{ left: -8, top: (node.data.inputHandleYOffset || 228) - 8 }}
            />
            {node.data.imageUrl && !node.data.isLoading && !!node.data.outputHandleYOffset && (
                <NodeHandle
                    onMouseDown={() => onOutputMouseDown(node.id)}
                    isConnected={isOutputConnected}
                    style={{ right: -8, top: node.data.outputHandleYOffset - 8 }}
                />
            )}
            <NodeHeader 
                title='Character Generator'
                icon={<ImageIcon className="w-4 h-4 text-cyan-400" />}
                isMinimized={!!node.data.isMinimized}
                onToggleMinimize={() => onToggleMinimize(node.id)}
                onDelete={() => onDelete(node.id)}
            />
            <div className="flex-grow p-2 space-y-2 overflow-y-auto">
                <div ref={charGenStyleRef}>
                    <label className={labelClassName}>Style</label>
                    <select value={node.data.style || 'Studio Portrait Photo'} onChange={(e) => onUpdateData(node.id, { style: e.target.value })} className={selectClassName}>
                        <option>Studio Portrait Photo</option><option>Cinematic Film Still</option><option>Action Shot Photo</option><option>Golden Hour Portrait</option><option>Fashion Magazine Shot</option><option>Candid Photo</option><option>Black and White Photo</option><option>Documentary Style Photo</option>
                    </select>
                </div>
                {!node.data.isMinimized && (
                    <>
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
                        <div ref={charGenInputRef}>
                            <label className={labelClassName}>Character Description</label>
                            <textarea
                                value={node.data.characterDescription || ''}
                                onChange={(e) => onUpdateData(node.id, { characterDescription: e.target.value })}
                                onKeyDown={(e) => handleTextAreaKeyDown(e, node.type)}
                                className={textAreaClassName(isInputConnected)}
                                placeholder={isInputConnected ? "Controlled by connection" : "e.g., A brave knight..."}
                                disabled={isInputConnected}
                            />
                        </div>
                    </>
                )}
                <div ref={charGenOutputRef} className={`${imagePreviewBaseClassName}`}>
                    {node.data.isLoading && <div className="w-full h-[128px] flex items-center justify-center"><div className="animate-spin rounded-full h-8 w-8 border-b-2 border-cyan-400"></div></div>}
                    {node.data.error && <div className="w-full h-[128px] flex items-center justify-center p-2"><p className="text-xs text-red-400 text-center">{node.data.error}</p></div>}
                    {node.data.imageUrl && !node.data.isLoading && (
                        <img src={node.data.imageUrl} alt="Generated" className="object-contain w-full rounded-md cursor-pointer hover:opacity-80 transition-opacity" onClick={() => onImageClick(node.data.imageUrl!)} />
                    )}
                    {!node.data.imageUrl && !node.data.isLoading && !node.data.error && <div className="w-full h-[128px] flex items-center justify-center"><ImageIcon className={`w-10 h-10 ${styles.node.imagePlaceholderIcon}`} /></div>}
                </div>
                {!node.data.isMinimized && (
                    <button onClick={() => onGenerateImage(node.id)} disabled={node.data.isLoading} className="w-full flex items-center justify-center space-x-2 bg-cyan-600 hover:bg-cyan-500 disabled:bg-gray-600 disabled:cursor-not-allowed text-white font-semibold py-2 px-4 rounded-md transition-colors text-sm">
                        <SparklesIcon className="w-4 h-4" />
                        <span>{node.data.isLoading ? 'Generating...' : 'Generate (Ctrl+Enter)'}</span>
                    </button>
                )}
            </div>
        </>
      )}
      
      {node.type === NodeType.ImageEditor && (
        <>
            <NodeHandle
                onMouseDown={() => onInputMouseDown(node.id)}
                onMouseUp={() => onInputMouseUp(node.id)}
                isConnected={isInputConnected}
                style={{ left: -8, top: (node.data.inputHandleYOffset || 78) - 8 }}
            />
            {node.data.imageUrl && !node.data.isLoading && !!node.data.outputHandleYOffset && (
                <NodeHandle
                    onMouseDown={() => onOutputMouseDown(node.id)}
                    isConnected={isOutputConnected}
                    style={{ right: -8, top: node.data.outputHandleYOffset - 8 }}
                />
            )}
            <NodeHeader 
                title='Image Editor'
                icon={<EditIcon className="w-4 h-4 text-purple-400" />}
                isMinimized={!!node.data.isMinimized}
                onToggleMinimize={() => onToggleMinimize(node.id)}
                onDelete={() => onDelete(node.id)}
            />
            <div className="flex-grow p-2 space-y-2 overflow-y-auto">
                <div ref={imgEditorInputRef}>
                    <label className={labelClassName}>Input Image</label>
                    <div className={imagePreviewBaseClassName}>
                        {node.data.inputImageUrl ? (
                             <img src={node.data.inputImageUrl} alt="Input" className="object-contain w-full rounded-md" />
                        ) : (
                            <div className={`text-center ${styles.node.labelText} text-xs w-full h-[128px] flex flex-col items-center justify-center`}>
                                <ImageIcon className={`w-8 h-8 mx-auto mb-1 ${styles.node.imagePlaceholderIcon}`} />
                                <p>Connect an image output</p>
                            </div>
                        )}
                    </div>
                </div>
                 {!node.data.isMinimized && (
                    <div>
                        <label className={labelClassName}>Edit Description</label>
                        <textarea
                            value={node.data.editDescription || ''}
                            onChange={(e) => onUpdateData(node.id, { editDescription: e.target.value })}
                            onKeyDown={(e) => handleTextAreaKeyDown(e, node.type)}
                            className={textAreaClassName()}
                            placeholder={"e.g., Add a futuristic helmet..."}
                        />
                    </div>
                 )}
                 <div ref={imgEditorOutputRef} className={`${imagePreviewBaseClassName}`}>
                    {node.data.isLoading && <div className="w-full h-[128px] flex items-center justify-center"><div className="animate-spin rounded-full h-8 w-8 border-b-2 border-purple-400"></div></div>}
                    {node.data.error && <div className="w-full h-[128px] flex items-center justify-center p-2"><p className="text-xs text-red-400 text-center">{node.data.error}</p></div>}
                    {node.data.imageUrl && !node.data.isLoading && (
                        <img src={node.data.imageUrl} alt="Edited" className="object-contain w-full rounded-md cursor-pointer hover:opacity-80 transition-opacity" onClick={() => onImageClick(node.data.imageUrl!)} />
                    )}
                    {!node.data.imageUrl && !node.data.isLoading && !node.data.error && <div className="w-full h-[128px] flex items-center justify-center"><ImageIcon className={`w-10 h-10 ${styles.node.imagePlaceholderIcon}`} /></div>}
                </div>
                {!node.data.isMinimized && (
                    <button onClick={() => onEditImage(node.id)} disabled={node.data.isLoading || !node.data.inputImageUrl} className="w-full flex items-center justify-center space-x-2 bg-purple-600 hover:bg-purple-500 disabled:bg-gray-600 disabled:cursor-not-allowed text-white font-semibold py-2 px-4 rounded-md transition-colors text-sm">
                        <SparklesIcon className="w-4 h-4" />
                        <span>{node.data.isLoading ? 'Generating...' : 'Generate (Ctrl+Enter)'}</span>
                    </button>
                )}
            </div>
        </>
      )}
    </div>
  );
};

export default Node;
