
import React, { useRef, useEffect, useState } from 'react';
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
import VideoIcon from './icons/VideoIcon';
import UploadIcon from './icons/UploadIcon';

interface NodeProps {
  node: NodeData;
  connections: Connection[];
  nodes: NodeData[]; // All nodes for checking connection sources
  onDragStart: (nodeId: string, e: React.MouseEvent) => void;
  onUpdateData: (nodeId: string, data: Partial<NodeData['data']>) => void;
  onGenerateImage: (nodeId: string) => void;
  onEditImage: (nodeId: string) => void;
  onGenerateVideo: (nodeId: string) => void;
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
  nodes,
  onDragStart,
  onUpdateData,
  onGenerateImage,
  onEditImage,
  onGenerateVideo,
  onImageClick,
  onOutputMouseDown,
  onInputMouseDown,
  onInputMouseUp,
  onDelete,
  onToggleMinimize,
  dimensions
}) => {
  const { styles } = useTheme();
  const isMinimized = !!node.data.isMinimized;
  const [isDraggingOver, setIsDraggingOver] = useState(false);

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
      } else if (nodeType === NodeType.VideoGenerator) {
        onGenerateVideo(node.id);
      }
    }
  };

  const isInputConnected = connections.some(c => c.toNodeId === node.id);
  const isOutputConnected = connections.some(c => c.fromNodeId === node.id);
  
  const nodeRef = useRef<HTMLDivElement>(null);
  const imageUploadRef = useRef<HTMLInputElement>(null);
  const charGenInputRef = useRef<HTMLDivElement>(null);
  const imgEditorInputRef = useRef<HTMLDivElement>(null);
  const videoGenInputRef = useRef<HTMLDivElement>(null);
  const imgNodeOutputRef = useRef<HTMLDivElement>(null);
  const charGenOutputRef = useRef<HTMLDivElement>(null);
  const imgEditorOutputRef = useRef<HTMLDivElement>(null);
  const videoGenOutputRef = useRef<HTMLDivElement>(null);
  const minimizedImageRef = useRef<HTMLImageElement>(null);
  const minimizedVideoRef = useRef<HTMLVideoElement>(null);

  const previewImage = node.data.imageUrl || node.data.inputImageUrl;
  const previewVideo = node.data.videoUrl;
  const hasVisuals = !!(previewImage || previewVideo);

  // Effect for calculating minimized node's preview height
  useEffect(() => {
    if (!isMinimized) {
        if (node.data.minimizedHeight !== undefined) {
            onUpdateData(node.id, { minimizedHeight: undefined });
        }
        return;
    }

    let isMounted = true;
    let element: HTMLImageElement | HTMLVideoElement | null = null;
    let eventName: 'load' | 'loadedmetadata' = 'load';

    const setHeightFromElement = () => {
        if (!isMounted || !element) return;
        const naturalWidth = (element as HTMLImageElement).naturalWidth || (element as HTMLVideoElement).videoWidth;
        const naturalHeight = (element as HTMLImageElement).naturalHeight || (element as HTMLVideoElement).videoHeight;
        if (naturalWidth > 0) {
            const newHeight = (dimensions.width * naturalHeight) / naturalWidth;
            if (node.data.minimizedHeight !== newHeight) {
                onUpdateData(node.id, { minimizedHeight: newHeight });
            }
        }
    };

    const calculateHeight = () => {
      if (hasVisuals) {
        // Priority 1: Use explicit aspect ratio from CharacterGenerator
        if (node.type === NodeType.CharacterGenerator && node.data.aspectRatio) {
            const [w, h] = node.data.aspectRatio.split(':').map(Number);
            if (w && h) {
                const newHeight = (dimensions.width * h) / w;
                if (node.data.minimizedHeight !== newHeight) {
                    onUpdateData(node.id, { minimizedHeight: newHeight });
                }
                return;
            }
        }
        
        // Priority 2: Calculate from media element ref
        element = previewVideo ? minimizedVideoRef.current : minimizedImageRef.current;
        eventName = previewVideo ? 'loadedmetadata' : 'load';

        if (element) {
            const isReady = (element as HTMLImageElement).complete || (element as HTMLVideoElement).readyState >= 1;
            if (isReady) {
                setHeightFromElement();
            } else {
                element.addEventListener(eventName, setHeightFromElement, { once: true });
            }
        }
      } else {
          // No visuals, use default height for text/placeholder
          if (node.data.minimizedHeight !== 64) {
              onUpdateData(node.id, { minimizedHeight: 64 });
          }
      }
    };

    // Run after a delay to ensure refs are populated
    const timeoutId = setTimeout(calculateHeight, 0);

    return () => {
        isMounted = false;
        clearTimeout(timeoutId);
        if (element) {
            element.removeEventListener(eventName, setHeightFromElement);
        }
    };
  }, [isMinimized, hasVisuals, previewImage, previewVideo, node.type, node.data.aspectRatio, dimensions.width, node.id, onUpdateData, node.data.minimizedHeight]);

  // Effect for calculating INPUT handle positions
  useEffect(() => {
    if (!nodeRef.current || isMinimized) return;
    const nodeElement = nodeRef.current;
  
    let targetRef: React.RefObject<HTMLElement> | null = null;
    if (node.type === NodeType.CharacterGenerator) targetRef = charGenInputRef;
    if (node.type === NodeType.ImageEditor) targetRef = imgEditorInputRef;
    if (node.type === NodeType.VideoGenerator) targetRef = videoGenInputRef;
    
    if (targetRef?.current) {
        const targetElement = targetRef.current;
        const nodeRect = nodeElement.getBoundingClientRect();
        const targetRect = targetElement.getBoundingClientRect();
        const yPosition = (targetRect.top - nodeRect.top) + (targetRect.height / 2);

        if (Math.abs((node.data.inputHandleYOffset || 0) - yPosition) > 1) {
            onUpdateData(node.id, { inputHandleYOffset: yPosition });
        }
    }
  }, [node.id, node.type, onUpdateData, node.data.isMinimized]);

  // Effect for calculating OUTPUT handle positions
  useEffect(() => {
    if (!nodeRef.current || isMinimized) return;
    const nodeElement = nodeRef.current;

    let targetRef: React.RefObject<HTMLElement> | null = null;
    if (node.type === NodeType.Text) targetRef = nodeRef; // For text node, use the node itself
    if (node.type === NodeType.Image) targetRef = imgNodeOutputRef;
    if (node.type === NodeType.CharacterGenerator) targetRef = charGenOutputRef;
    if (node.type === NodeType.ImageEditor) targetRef = imgEditorOutputRef;
    
    if (targetRef?.current) {
        const targetElement = targetRef.current;
        const nodeRect = nodeElement.getBoundingClientRect();
        const targetRect = targetElement.getBoundingClientRect();
        const yPosition = (targetRect.top - nodeRect.top) + (targetRect.height / 2);
        
        if (Math.abs((node.data.outputHandleYOffset || 0) - yPosition) > 1) {
            onUpdateData(node.id, { outputHandleYOffset: yPosition });
        }
    }
  }, [node.id, node.type, node.data.imageUrl, node.data.isLoading, node.data.error, node.data.text, onUpdateData, node.data.isMinimized]);

  const handleTextNodeTransitionEnd = () => {
    // This fires after the collapse/expand animation. We only want to act after an expansion.
    if (node.type === NodeType.Text && !isMinimized && nodeRef.current) {
        const nodeRect = nodeRef.current.getBoundingClientRect();
        const yPosition = nodeRect.height / 2;
        
        // Only update if the position has meaningfully changed to avoid re-renders.
        if (Math.abs((node.data.outputHandleYOffset || 0) - yPosition) > 1) {
            onUpdateData(node.id, { outputHandleYOffset: yPosition });
        }
    }
  };
  
    const handleFileChange = (file: File | null) => {
        if (file && file.type.startsWith('image/')) {
            const reader = new FileReader();
            reader.onload = (e) => {
                if (e.target?.result) {
                    onUpdateData(node.id, { imageUrl: e.target.result as string });
                }
            };
            reader.readAsDataURL(file);
        }
    };

    const handleDragOver = (e: React.DragEvent) => {
        e.preventDefault();
        setIsDraggingOver(true);
    };

    const handleDragLeave = (e: React.DragEvent) => {
        e.preventDefault();
        setIsDraggingOver(false);
    };

    const handleDrop = (e: React.DragEvent) => {
        e.preventDefault();
        setIsDraggingOver(false);
        if (e.dataTransfer.files && e.dataTransfer.files[0]) {
            handleFileChange(e.dataTransfer.files[0]);
        }
    };
    
  const getMinimizedHandleTop = () => {
    const headerHeight = 40; // from Canvas.tsx MINIMIZED_NODE_HEADER_HEIGHT
    const previewHeight = node.data.minimizedHeight || 64;
    return headerHeight + (previewHeight / 2);
  };

  return (
    <div
      ref={nodeRef}
      className={`absolute ${styles.node.bg} border ${styles.node.border} rounded-lg flex flex-col transition-all duration-300 ease-in-out`}
      style={{
        left: node.position.x,
        top: node.position.y,
        width: `${dimensions.width}px`,
        height: dimensions.height && !isMinimized ? `${dimensions.height}px` : undefined,
      }}
      onMouseDownCapture={handleMouseDown}
    >
      {node.type === NodeType.Text && (
        <>
            <NodeHeader 
                title='Text Node'
                icon={<TextIcon className="w-4 h-4 text-yellow-400" />}
                isMinimized={isMinimized}
                onToggleMinimize={() => onToggleMinimize(node.id)}
                onDelete={() => onDelete(node.id)}
            />
            <div
                onTransitionEnd={handleTextNodeTransitionEnd}
                className={`transition-all duration-300 ease-in-out overflow-hidden ${isMinimized ? 'max-h-0' : 'max-h-96'}`}>
                <div className="p-2">
                    <textarea
                        value={node.data.text || ''}
                        onChange={(e) => onUpdateData(node.id, { text: e.target.value })}
                        onMouseDown={(e) => e.stopPropagation()}
                        className={textAreaClassName()}
                        placeholder="Enter text..."
                    />
                </div>
            </div>
            
            {isMinimized && (
              <div className={`p-2 h-16 text-xs italic ${styles.node.labelText} truncate rounded-b-md flex items-center border-t ${styles.node.border}`}>
                  {node.data.text || "Empty text..."}
              </div>
            )}

            <NodeHandle
                onMouseDown={() => onOutputMouseDown(node.id)}
                isConnected={isOutputConnected}
                style={{
                    right: '-8px',
                    top: isMinimized ? '20px' : `${node.data.outputHandleYOffset || '50%'}`,
                    transform: 'translateY(-50%)',
                    transition: 'none',
                }}
            />
        </>
      )}
      
      {node.type === NodeType.Image && (
        <>
            <NodeHeader 
                title='Image Node'
                icon={<UploadIcon className="w-4 h-4 text-orange-400" />}
                isMinimized={isMinimized}
                onToggleMinimize={() => onToggleMinimize(node.id)}
                onDelete={() => onDelete(node.id)}
            />
            <div className={`transition-all duration-300 ease-in-out overflow-hidden ${isMinimized ? 'max-h-0 opacity-0' : 'max-h-[1000px] opacity-100'}`}>
                <div className="p-2">
                    <div ref={imgNodeOutputRef}>
                        <label className={labelClassName}>Source Image</label>
                        <div 
                            className={`${imagePreviewBaseClassName} h-40 cursor-pointer ${isDraggingOver ? `ring-2 ring-offset-2 ${styles.node.inputFocusRing}` : ''}`}
                            onClick={() => imageUploadRef.current?.click()}
                            onDragOver={handleDragOver}
                            onDragLeave={handleDragLeave}
                            onDrop={handleDrop}
                        >
                            <input
                                ref={imageUploadRef}
                                type="file"
                                accept="image/*"
                                className="hidden"
                                onChange={(e) => handleFileChange(e.target.files ? e.target.files[0] : null)}
                            />
                            {node.data.imageUrl ? (
                                <img
                                    src={node.data.imageUrl}
                                    alt="Uploaded"
                                    className="w-full h-full object-cover rounded-md"
                                />
                            ) : (
                                <div className="text-center">
                                    <UploadIcon className={`w-8 h-8 ${styles.node.imagePlaceholderIcon} mx-auto mb-1`} />
                                    <span className="text-xs">Click or drag & drop</span>
                                </div>
                            )}
                        </div>
                    </div>
                </div>
            </div>
            
            {isMinimized && (
              <div 
                  className={`w-full ${styles.node.imagePlaceholderBg} rounded-b-md flex items-center justify-center border-t ${styles.node.imagePlaceholderBorder} transition-all duration-300 ease-in-out overflow-hidden`}
                  style={{ height: node.data.minimizedHeight ? `${node.data.minimizedHeight}px` : '64px' }}
              >
                  {node.data.imageUrl ? 
                      <img key={node.data.imageUrl} ref={minimizedImageRef} src={node.data.imageUrl} alt="Preview" className="w-full h-full object-contain" />
                      : <ImageIcon className={`w-8 h-8 ${styles.node.imagePlaceholderIcon}`} />
                  }
              </div>
            )}

            {node.data.imageUrl && (
                <NodeHandle
                    onMouseDown={() => onOutputMouseDown(node.id)}
                    isConnected={isOutputConnected}
                    style={{
                        right: '-8px',
                        top: isMinimized ? `${getMinimizedHandleTop()}px` : `${node.data.outputHandleYOffset || 108}px`,
                        transform: 'translateY(-50%)',
                        transition: 'none',
                    }}
                />
            )}
        </>
      )}

      {node.type === NodeType.CharacterGenerator && (
        <>
          <NodeHeader 
            title='Character Generator'
            icon={<ImageIcon className="w-4 h-4 text-cyan-400" />}
            isMinimized={isMinimized}
            onToggleMinimize={() => onToggleMinimize(node.id)}
            onDelete={() => onDelete(node.id)}
          />
          <div className={`transition-all duration-300 ease-in-out overflow-hidden ${isMinimized ? 'max-h-0 opacity-0' : 'max-h-[1000px] opacity-100'}`}>
            <div className="p-2 space-y-2">
              <div ref={charGenInputRef}>
                <label htmlFor={`desc-${node.id}`} className={labelClassName}>Character Description</label>
                <textarea
                  id={`desc-${node.id}`}
                  value={node.data.characterDescription || ''}
                  onChange={(e) => onUpdateData(node.id, { characterDescription: e.target.value })}
                  onKeyDown={(e) => handleTextAreaKeyDown(e, NodeType.CharacterGenerator)}
                  onMouseDown={(e) => e.stopPropagation()}
                  className={textAreaClassName(isInputConnected)}
                  disabled={isInputConnected}
                  placeholder="e.g., A cat astronaut on Mars"
                />
              </div>
              <div>
                <label htmlFor={`style-${node.id}`} className={labelClassName}>Style</label>
                <select
                  id={`style-${node.id}`}
                  className={selectClassName}
                  value={node.data.style}
                  onChange={(e) => onUpdateData(node.id, { style: e.target.value })}
                  onMouseDown={(e) => e.stopPropagation()}
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
                <label htmlFor={`layout-${node.id}`} className={labelClassName}>Layout</label>
                <select
                  id={`layout-${node.id}`}
                  className={selectClassName}
                  value={node.data.layout}
                  onChange={(e) => onUpdateData(node.id, { layout: e.target.value })}
                  onMouseDown={(e) => e.stopPropagation()}
                >
                  <option>4-panel grid</option>
                  <option>6-panel grid</option>
                  <option>T-pose reference sheet</option>
                </select>
              </div>
              <div>
                <label htmlFor={`aspect-${node.id}`} className={labelClassName}>Aspect Ratio</label>
                <select
                  id={`aspect-${node.id}`}
                  className={selectClassName}
                  value={node.data.aspectRatio}
                  onChange={(e) => onUpdateData(node.id, { aspectRatio: e.target.value })}
                  onMouseDown={(e) => e.stopPropagation()}
                >
                  <option value="1:1">1:1 (Square)</option>
                  <option value="16:9">16:9 (Widescreen)</option>
                  <option value="9:16">9:16 (Portrait)</option>
                  <option value="4:3">4:3 (Standard)</option>
                  <option value="3:4">3:4 (Standard Portrait)</option>
                </select>
              </div>
              <div ref={charGenOutputRef}>
                <label className={labelClassName}>Output Image</label>
                <div className={`${imagePreviewBaseClassName} h-40`}>
                  {node.data.isLoading ? (
                    <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-cyan-400"></div>
                  ) : node.data.error ? (
                    <div className="text-red-400 text-xs p-2 text-center">{node.data.error}</div>
                  ) : node.data.imageUrl ? (
                    <img
                      src={node.data.imageUrl}
                      alt="Generated character"
                      className="w-full h-full object-cover rounded-md cursor-zoom-in"
                      onClick={() => onImageClick(node.data.imageUrl!)}
                    />
                  ) : (
                    <ImageIcon className={`w-8 h-8 ${styles.node.imagePlaceholderIcon}`} />
                  )}
                </div>
              </div>
              <button
                onClick={() => onGenerateImage(node.id)}
                disabled={node.data.isLoading}
                className={`w-full flex items-center justify-center p-2 ${node.data.isLoading ? 'bg-gray-600' : 'bg-cyan-600 hover:bg-cyan-500'} text-white font-bold rounded-md transition-colors text-sm disabled:cursor-not-allowed`}
              >
                <SparklesIcon className={`w-4 h-4 mr-2 ${node.data.isLoading ? 'animate-pulse' : ''}`} />
                {node.data.isLoading ? 'Generating...' : 'Generate Image'}
              </button>
            </div>
          </div>
          {isMinimized && (
              <div 
                  className={`w-full ${styles.node.imagePlaceholderBg} rounded-b-md flex items-center justify-center border-t ${styles.node.imagePlaceholderBorder} transition-all duration-300 ease-in-out overflow-hidden`}
                  style={{ height: node.data.minimizedHeight ? `${node.data.minimizedHeight}px` : '64px' }}
              >
                  {hasVisuals ? 
                      <img key={previewImage} ref={minimizedImageRef} src={previewImage!} alt="Preview" className="w-full h-full object-contain" />
                      : <ImageIcon className={`w-8 h-8 ${styles.node.imagePlaceholderIcon}`} />
                  }
              </div>
          )}
          
          <NodeHandle
            onMouseDown={(e) => onInputMouseDown(node.id)}
            onMouseUp={() => onInputMouseUp(node.id)}
            isConnected={isInputConnected}
            style={{
              left: '-8px',
              top: isMinimized ? `${getMinimizedHandleTop()}px` : `${node.data.inputHandleYOffset || 228}px`,
              transform: 'translateY(-50%)',
              transition: 'none',
            }}
          />
          {node.data.imageUrl && !node.data.isLoading && (
            <NodeHandle
              onMouseDown={() => onOutputMouseDown(node.id)}
              isConnected={isOutputConnected}
              style={{
                right: '-8px',
                top: isMinimized ? `${getMinimizedHandleTop()}px` : `${node.data.outputHandleYOffset || 368}px`,
                transform: 'translateY(-50%)',
                transition: 'none',
              }}
            />
          )}
        </>
      )}
      
      {node.type === NodeType.ImageEditor && (
        <>
            <NodeHeader 
                title='Image Editor'
                icon={<EditIcon className="w-4 h-4 text-purple-400" />}
                isMinimized={isMinimized}
                onToggleMinimize={() => onToggleMinimize(node.id)}
                onDelete={() => onDelete(node.id)}
            />
            <div className={`transition-all duration-300 ease-in-out overflow-hidden ${isMinimized ? 'max-h-0 opacity-0' : 'max-h-[1000px] opacity-100'}`}>
              <div className="p-2 space-y-2">
                <div ref={imgEditorInputRef}>
                    <label className={labelClassName}>Input Image</label>
                    <div className={`${imagePreviewBaseClassName} h-32`}>
                        {node.data.inputImageUrl ? (
                            <img src={node.data.inputImageUrl} alt="Input for editing" className="w-full h-full object-cover rounded-md" />
                        ) : (
                            <ImageIcon className={`w-8 h-8 ${styles.node.imagePlaceholderIcon}`} />
                        )}
                    </div>
                </div>
                <div>
                    <label htmlFor={`edit-desc-${node.id}`} className={labelClassName}>Edit Description</label>
                    <textarea
                        id={`edit-desc-${node.id}`}
                        value={node.data.editDescription || ''}
                        onChange={(e) => onUpdateData(node.id, { editDescription: e.target.value })}
                        onKeyDown={(e) => handleTextAreaKeyDown(e, NodeType.ImageEditor)}
                        onMouseDown={(e) => e.stopPropagation()}
                        className={textAreaClassName()}
                        placeholder="e.g., Add a golden crown to the subject"
                    />
                </div>
                <div ref={imgEditorOutputRef}>
                    <label className={labelClassName}>Output Image</label>
                    <div className={`${imagePreviewBaseClassName} h-40`}>
                        {node.data.isLoading ? (
                            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-purple-400"></div>
                        ) : node.data.error ? (
                            <div className="text-red-400 text-xs p-2 text-center">{node.data.error}</div>
                        ) : node.data.imageUrl ? (
                            <img
                                src={node.data.imageUrl}
                                alt="Edited image"
                                className="w-full h-full object-cover rounded-md cursor-zoom-in"
                                onClick={() => onImageClick(node.data.imageUrl!)}
                            />
                        ) : (
                            <ImageIcon className={`w-8 h-8 ${styles.node.imagePlaceholderIcon}`} />
                        )}
                    </div>
                </div>
                <button
                    onClick={() => onEditImage(node.id)}
                    disabled={node.data.isLoading}
                    className={`w-full flex items-center justify-center p-2 ${node.data.isLoading ? 'bg-gray-600' : 'bg-purple-600 hover:bg-purple-500'} text-white font-bold rounded-md transition-colors text-sm disabled:cursor-not-allowed`}
                >
                    <SparklesIcon className={`w-4 h-4 mr-2 ${node.data.isLoading ? 'animate-pulse' : ''}`} />
                    {node.data.isLoading ? 'Editing...' : 'Edit Image'}
                </button>
              </div>
            </div>
            {isMinimized && (
                <div 
                    className={`w-full ${styles.node.imagePlaceholderBg} rounded-b-md flex items-center justify-center border-t ${styles.node.imagePlaceholderBorder} transition-all duration-300 ease-in-out overflow-hidden`}
                    style={{ height: node.data.minimizedHeight ? `${node.data.minimizedHeight}px` : '64px' }}
                >
                    {hasVisuals ? 
                        <img key={previewImage} ref={minimizedImageRef} src={previewImage!} alt="Preview" className="w-full h-full object-contain" />
                        : <ImageIcon className={`w-8 h-8 ${styles.node.imagePlaceholderIcon}`} />
                    }
                </div>
            )}
            
            <NodeHandle
                onMouseDown={(e) => onInputMouseDown(node.id)}
                onMouseUp={() => onInputMouseUp(node.id)}
                isConnected={isInputConnected}
                style={{
                    left: '-8px',
                    top: isMinimized ? `${getMinimizedHandleTop()}px` : `${node.data.inputHandleYOffset || 78}px`,
                    transform: 'translateY(-50%)',
                    transition: 'none',
                }}
            />
            {node.data.imageUrl && !node.data.isLoading && (
                <NodeHandle
                    onMouseDown={() => onOutputMouseDown(node.id)}
                    isConnected={isOutputConnected}
                    style={{
                        right: '-8px',
                        top: isMinimized ? `${getMinimizedHandleTop()}px` : `${node.data.outputHandleYOffset || 428}px`,
                        transform: 'translateY(-50%)',
                        transition: 'none',
                    }}
                />
            )}
        </>
      )}

      {node.type === NodeType.VideoGenerator && (
        <>
            <NodeHeader 
                title='Video Generator'
                icon={<VideoIcon className="w-4 h-4 text-green-400" />}
                isMinimized={isMinimized}
                onToggleMinimize={() => onToggleMinimize(node.id)}
                onDelete={() => onDelete(node.id)}
            />
            <div className={`transition-all duration-300 ease-in-out overflow-hidden ${isMinimized ? 'max-h-0 opacity-0' : 'max-h-[1000px] opacity-100'}`}>
              <div className="p-2 space-y-2">
                <div ref={videoGenInputRef}>
                    <label className={labelClassName}>Input Image (Optional)</label>
                    <div className={`${imagePreviewBaseClassName} h-32`}>
                        {node.data.inputImageUrl ? (
                            <img src={node.data.inputImageUrl} alt="Input for video" className="w-full h-full object-cover rounded-md" />
                        ) : (
                            <ImageIcon className={`w-8 h-8 ${styles.node.imagePlaceholderIcon}`} />
                        )}
                    </div>
                </div>
                <div>
                    <label htmlFor={`video-model-${node.id}`} className={labelClassName}>Video Model</label>
                    <select
                        id={`video-model-${node.id}`}
                        className={selectClassName}
                        value={node.data.videoModel || 'veo-2.0-generate-001'}
                        onChange={(e) => onUpdateData(node.id, { videoModel: e.target.value })}
                        onMouseDown={(e) => e.stopPropagation()}
                    >
                        <option value="veo-2.0-generate-001">Veo 2 (Standard)</option>
                        <option value="veo-3.0-fast-generate-001">Veo 3 (Fast)</option>
                    </select>
                </div>
                <div>
                    <label htmlFor={`prompt-${node.id}`} className={labelClassName}>Video Prompt</label>
                    <textarea
                        id={`prompt-${node.id}`}
                        value={node.data.editDescription || ''}
                        onChange={(e) => onUpdateData(node.id, { editDescription: e.target.value })}
                        onKeyDown={(e) => handleTextAreaKeyDown(e, NodeType.VideoGenerator)}
                        onMouseDown={(e) => e.stopPropagation()}
                        className={textAreaClassName()}
                        placeholder="e.g., A majestic eagle soaring over mountains"
                    />
                </div>
                <div ref={videoGenOutputRef}>
                    <label className={labelClassName}>Output Video</label>
                    <div className={`${imagePreviewBaseClassName} h-40`}>
                        {node.data.isLoading ? (
                            <div className="flex flex-col items-center justify-center text-center p-2">
                                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-cyan-400 mb-2"></div>
                                <span className="text-xs text-gray-400">{node.data.generationProgressMessage || 'Generating...'}</span>
                            </div>
                        ) : node.data.error ? (
                            <div className="text-red-400 text-xs p-2 text-center">{node.data.error}</div>
                        ) : node.data.videoUrl ? (
                            <video src={node.data.videoUrl} controls className="w-full h-full object-cover rounded-md" />
                        ) : (
                            <VideoIcon className={`w-8 h-8 ${styles.node.imagePlaceholderIcon}`} />
                        )}
                    </div>
                </div>
                <button
                    onClick={() => onGenerateVideo(node.id)}
                    disabled={node.data.isLoading}
                    className={`w-full flex items-center justify-center p-2 ${node.data.isLoading ? 'bg-gray-600' : 'bg-green-600 hover:bg-green-500'} text-white font-bold rounded-md transition-colors text-sm disabled:cursor-not-allowed`}
                >
                    <SparklesIcon className={`w-4 h-4 mr-2 ${node.data.isLoading ? 'animate-pulse' : ''}`} />
                    {node.data.isLoading ? 'Generating...' : 'Generate Video'}
                </button>
              </div>
            </div>
            {isMinimized && (
              <div 
                  className={`w-full ${styles.node.imagePlaceholderBg} rounded-b-md flex items-center justify-center border-t ${styles.node.imagePlaceholderBorder} transition-all duration-300 ease-in-out overflow-hidden`}
                  style={{ height: node.data.minimizedHeight ? `${node.data.minimizedHeight}px` : '64px' }}
              >
                  {!hasVisuals ? 
                      <VideoIcon className={`w-8 h-8 ${styles.node.imagePlaceholderIcon}`} /> :
                      previewVideo ? (
                          <video key={previewVideo} ref={minimizedVideoRef} src={previewVideo} controls className="w-full h-full object-contain" />
                      ) : (
                          <img key={previewImage} ref={minimizedImageRef} src={previewImage!} alt="Preview" className="w-full h-full object-contain" />
                      )
                  }
              </div>
            )}
            
            <NodeHandle
                onMouseDown={(e) => onInputMouseDown(node.id)}
                onMouseUp={() => onInputMouseUp(node.id)}
                isConnected={isInputConnected}
                style={{
                    left: '-8px',
                    top: isMinimized ? `${getMinimizedHandleTop()}px` : `${node.data.inputHandleYOffset || 78}px`,
                    transform: 'translateY(-50%)',
                    transition: 'none',
                }}
            />
        </>
      )}
    </div>
  );
};

export default Node;
