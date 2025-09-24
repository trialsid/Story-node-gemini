import React, { useRef, useEffect, useState } from 'react';
import { NodeData, NodeType, Connection, HandleType } from '../types';
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
import { NODE_SPEC, areHandlesCompatible, NodeHandleSpec } from '../utils/node-spec';
import BotIcon from './icons/BotIcon';

interface TempConnectionInfo {
  startNodeId: string;
  startHandleId: string;
  startHandleType: HandleType;
}
interface HoveredInputInfo {
  nodeId: string;
  handleId: string;
}
interface NodeProps {
  node: NodeData;
  connections: Connection[];
  onDragStart: (nodeId: string, e: React.MouseEvent) => void;
  onUpdateData: (nodeId: string, data: Partial<NodeData['data']>) => void;
  onGenerateCharacterImage: (nodeId: string) => void;
  onGenerateImages: (nodeId: string) => void;
  onEditImage: (nodeId: string) => void;
  onGenerateVideo: (nodeId: string) => void;
  onGenerateText: (nodeId: string) => void;
  onImageClick: (imageUrl: string) => void;
  onOutputMouseDown: (nodeId: string, handleId: string) => void;
  onInputMouseDown: (nodeId: string, handleId: string) => void;
  onInputMouseUp: (nodeId: string, handleId: string) => void;
  onDelete: (nodeId: string) => void;
  onToggleMinimize: (nodeId: string) => void;
  dimensions: { width: number; height?: number };
  tempConnectionInfo: TempConnectionInfo | null;
  hoveredInputHandle: HoveredInputInfo | null;
  setHoveredInputHandle: (info: HoveredInputInfo | null) => void;
}

interface NodeHeaderProps {
  title: string;
  icon: React.ReactNode;
  isMinimized: boolean;
  onToggleMinimize: () => void;
  onDelete: () => void;
  onMouseDown: (e: React.MouseEvent) => void;
}

const NodeHeader: React.FC<NodeHeaderProps> = ({ title, icon, isMinimized, onToggleMinimize, onDelete, onMouseDown }) => {
  const { styles } = useTheme();
  return (
    <div 
      className={`flex items-center justify-between p-2 ${styles.node.headerBg} rounded-t-lg cursor-move`}
      onMouseDown={onMouseDown}
    >
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
  onGenerateCharacterImage,
  onGenerateImages,
  onEditImage,
  onGenerateVideo,
  onGenerateText,
  onImageClick,
  onOutputMouseDown,
  onInputMouseDown,
  onInputMouseUp,
  onDelete,
  onToggleMinimize,
  dimensions,
  tempConnectionInfo,
  hoveredInputHandle,
  setHoveredInputHandle,
}) => {
  const { styles } = useTheme();
  const isMinimized = !!node.data.isMinimized;
  const [isDraggingOver, setIsDraggingOver] = useState(false);
  const nodeSpec = NODE_SPEC[node.type];

  const selectClassName = `w-full p-1 ${styles.node.inputBg} border ${styles.node.inputBorder} rounded-md text-sm ${styles.node.text} focus:outline-none focus:ring-2 ${styles.node.inputFocusRing}`;
  const labelClassName = `text-xs font-semibold ${styles.node.labelText}`;
  const imagePreviewBaseClassName = `w-full ${styles.node.imagePlaceholderBg} rounded-md flex items-center justify-center border border-dashed ${styles.node.imagePlaceholderBorder}`;
  const textAreaClassName = (isDisabled = false) => `w-full p-1 ${isDisabled ? 'bg-gray-700/50 text-gray-400' : styles.node.inputBg} border ${styles.node.inputBorder} rounded-md text-sm ${isDisabled ? '' : styles.node.text} focus:outline-none focus:ring-2 ${styles.node.inputFocusRing} resize-none`;
  
  const handleHeaderMouseDown = (e: React.MouseEvent) => {
    onDragStart(node.id, e);
  };

  const handleTextAreaKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>, nodeType: NodeType) => {
    if (e.ctrlKey && e.key === 'Enter') {
      e.preventDefault();
      if (nodeType === NodeType.CharacterGenerator) {
        onGenerateCharacterImage(node.id);
      } else if (nodeType === NodeType.ImageGenerator) {
        onGenerateImages(node.id);
      } else if (nodeType === NodeType.ImageEditor) {
        onEditImage(node.id);
      } else if (nodeType === NodeType.VideoGenerator) {
        onGenerateVideo(node.id);
      } else if (nodeType === NodeType.GeminiText) {
        onGenerateText(node.id);
      }
    }
  };

  const nodeRef = useRef<HTMLDivElement>(null);
  const imageUploadRef = useRef<HTMLInputElement>(null);

  // Refs for handle anchor elements
  const handleAnchorRefs = useRef<{ [handleId: string]: HTMLElement | null }>({});
  const minimizedImageRef = useRef<HTMLImageElement>(null);
  const minimizedVideoRef = useRef<HTMLVideoElement>(null);
  const prevIsMinimizedRef = useRef(isMinimized);

  const previewImage = node.data.imageUrl || node.data.inputImageUrl || node.data.imageUrls?.[0];
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
        if ((node.type === NodeType.CharacterGenerator || node.type === NodeType.ImageGenerator) && node.data.aspectRatio) {
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

  // Effect for calculating handle positions
  useEffect(() => {
    const wasMinimized = prevIsMinimizedRef.current;
    prevIsMinimizedRef.current = isMinimized;

    if (!nodeRef.current || isMinimized) return;

    const calculateOffsets = () => {
      if (!nodeRef.current) return; // Check again in case component unmounted
      const nodeElement = nodeRef.current;
      
      let needsUpdate = false;
      const newOffsets: { [handleId: string]: number } = {};

      [...nodeSpec.inputs, ...nodeSpec.outputs].forEach(handle => {
          const handleElement = handleAnchorRefs.current[handle.id];
          if (handleElement) {
              const nodeRect = nodeElement.getBoundingClientRect();
              const targetRect = handleElement.getBoundingClientRect();
              const yPosition = (targetRect.top - nodeRect.top) + (targetRect.height / 2);
              
              newOffsets[handle.id] = yPosition;
              // Only mark for update if there's a significant change to prevent infinite loops
              if (Math.abs((node.data.handleYOffsets?.[handle.id] || 0) - yPosition) > 1) {
                  needsUpdate = true;
              }
          }
      });

      if (needsUpdate) {
          // Create a merged object to avoid race conditions with other updates
          onUpdateData(node.id, { handleYOffsets: { ...node.data.handleYOffsets, ...newOffsets }});
      }
    };
    
    // If we just maximized the node, wait for the animation to finish
    if (wasMinimized && !isMinimized) {
        const timeoutId = setTimeout(calculateOffsets, 310); // 300ms transition + 10ms buffer
        return () => clearTimeout(timeoutId);
    } else {
        // Otherwise, calculate immediately (e.g., on initial render)
        calculateOffsets();
    }

  }, [node.id, node.type, onUpdateData, isMinimized, nodeSpec, node.data.handleYOffsets, node.data.text, node.data.imageUrl, node.data.imageUrls, node.data.prompt]);
  
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
  
  const getMinimizedHandleTop = (handleId: string, side: 'input' | 'output') => {
    const headerHeight = 40; // Corresponds to MINIMIZED_NODE_HEADER_HEIGHT
    const previewHeight = node.data.minimizedHeight || 64;

    const spec = NODE_SPEC[node.type];
    const handles = side === 'input' ? spec.inputs : spec.outputs;
    const handleIndex = handles.findIndex(h => h.id === handleId);
    const totalHandles = handles.length;

    if (handleIndex === -1 || totalHandles === 0) {
        return headerHeight + (previewHeight / 2);
    }
    
    return headerHeight + (previewHeight * (handleIndex + 1)) / (totalHandles + 1);
  };

  const renderHandles = (handles: NodeHandleSpec[], side: 'input' | 'output') => {
    return handles.map(handle => {
      const isConnected = connections.some(c =>
        (side === 'input' && c.toNodeId === node.id && c.toHandleId === handle.id) ||
        (side === 'output' && c.fromNodeId === node.id && c.fromHandleId === handle.id)
      );

      const isBeingDraggedOver = hoveredInputHandle?.nodeId === node.id && hoveredInputHandle?.handleId === handle.id;
      const isCompatible = tempConnectionInfo ? areHandlesCompatible(tempConnectionInfo.startHandleType, handle.type) : false;

      return (
        <NodeHandle
          key={handle.id}
          onMouseDown={() => side === 'input' ? onInputMouseDown(node.id, handle.id) : onOutputMouseDown(node.id, handle.id)}
          onMouseUp={() => side === 'input' ? onInputMouseUp(node.id, handle.id) : undefined}
          onMouseEnter={() => side === 'input' ? setHoveredInputHandle({ nodeId: node.id, handleId: handle.id }) : undefined}
          onMouseLeave={() => side === 'input' ? setHoveredInputHandle(null) : undefined}
          isConnected={isConnected}
          type={handle.type}
          isBeingDraggedOver={isBeingDraggedOver}
          isValidTarget={isCompatible}
          style={{
            [side === 'input' ? 'left' : 'right']: '-8px', // Position handle outside node border
            top: isMinimized ? getMinimizedHandleTop(handle.id, side) : (node.data.handleYOffsets?.[handle.id] ?? '50%'),
            transform: 'translateY(-50%)', // Vertically center the handle on its 'top' position
            // Animate position changes for a smoother experience
            transition: 'top 0.2s ease-in-out',
          }}
        />
      );
    });
  };

  return (
    <div
      ref={nodeRef}
      className={`absolute ${styles.node.bg} border ${styles.node.border} rounded-lg flex flex-col`}
      style={{
        left: node.position.x,
        top: node.position.y,
        width: `${dimensions.width}px`,
        height: dimensions.height && !isMinimized ? `${dimensions.height}px` : undefined,
      }}
    >
      {renderHandles(nodeSpec.inputs, 'input')}
      {node.type === NodeType.ImageGenerator ?
        renderHandles(nodeSpec.outputs.slice(0, node.data.numberOfImages || 1), 'output')
        : renderHandles(nodeSpec.outputs, 'output')
      }
      
      {node.type === NodeType.Text && (
        <>
            <NodeHeader 
                title='Text Node'
                icon={<TextIcon className="w-4 h-4 text-yellow-400" />}
                isMinimized={isMinimized}
                onToggleMinimize={() => onToggleMinimize(node.id)}
                onDelete={() => onDelete(node.id)}
                onMouseDown={handleHeaderMouseDown}
            />
            <div
                className={`transition-all duration-300 ease-in-out overflow-hidden ${isMinimized ? 'max-h-0' : 'max-h-96'}`}>
                <div className="p-2" ref={el => handleAnchorRefs.current['text_output'] = el}>
                    <textarea
                        value={node.data.text || ''}
                        onChange={(e) => onUpdateData(node.id, { text: e.target.value })}
                        onMouseDown={(e) => e.stopPropagation()}
                        className={`${textAreaClassName()} h-24`}
                        placeholder="Enter text..."
                    />
                </div>
            </div>
            
            {isMinimized && (
              <div className={`p-2 h-16 text-xs italic ${styles.node.labelText} truncate rounded-b-md flex items-center border-t ${styles.node.border}`}>
                  {node.data.text || "Empty text..."}
              </div>
            )}
        </>
      )}
      
      {node.type === NodeType.GeminiText && (
        <>
            <NodeHeader 
                title='Gemini Text'
                icon={<BotIcon className="w-4 h-4 text-indigo-400" />}
                isMinimized={isMinimized}
                onToggleMinimize={() => onToggleMinimize(node.id)}
                onDelete={() => onDelete(node.id)}
                onMouseDown={handleHeaderMouseDown}
            />
            <div className={`transition-all duration-300 ease-in-out overflow-hidden ${isMinimized ? 'max-h-0 opacity-0' : 'max-h-[1000px] opacity-100'}`}>
                <div className="p-2 space-y-2">
                    <div ref={el => handleAnchorRefs.current['prompt_input'] = el}>
                        <label htmlFor={`prompt-${node.id}`} className={labelClassName}>Prompt</label>
                        <textarea
                          id={`prompt-${node.id}`}
                          value={node.data.prompt || ''}
                          onChange={(e) => onUpdateData(node.id, { prompt: e.target.value })}
                          onKeyDown={(e) => handleTextAreaKeyDown(e, NodeType.GeminiText)}
                          onMouseDown={(e) => e.stopPropagation()}
                          className={`${textAreaClassName(connections.some(c => c.toNodeId === node.id && c.toHandleId === 'prompt_input'))} h-24`}
                          disabled={connections.some(c => c.toNodeId === node.id && c.toHandleId === 'prompt_input')}
                          placeholder="Your prompt here..."
                        />
                    </div>
                    
                    <div ref={el => handleAnchorRefs.current['text_output'] = el}>
                        <label className={labelClassName}>Generated Text</label>
                        <div className={`${imagePreviewBaseClassName} h-32 items-start`}>
                          {node.data.isLoading ? <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-indigo-400 mt-12"></div>
                          : node.data.error ? <div className="text-red-400 text-xs p-2 text-center">{node.data.error}</div>
                          : <textarea
                                readOnly
                                value={node.data.text || ''}
                                className={`w-full h-full p-1 bg-transparent border-0 focus:outline-none focus:ring-0 resize-none custom-scrollbar`}
                                placeholder="Output will appear here..."
                            />
                          }
                        </div>
                    </div>
                    <button onClick={() => onGenerateText(node.id)} disabled={node.data.isLoading} className={`w-full flex items-center justify-center p-2 ${node.data.isLoading ? 'bg-gray-600' : 'bg-indigo-600 hover:bg-indigo-500'} text-white font-bold rounded-md transition-colors text-sm disabled:cursor-not-allowed`} >
                      <SparklesIcon className={`w-4 h-4 mr-2 ${node.data.isLoading ? 'animate-pulse' : ''}`} />
                      {node.data.isLoading ? 'Generating...' : 'Generate Text'}
                    </button>
                </div>
            </div>
            
            {isMinimized && (
              <div className={`p-2 h-16 text-xs italic ${styles.node.labelText} truncate rounded-b-md flex items-center border-t ${styles.node.border}`}>
                  {node.data.text || "No generated text."}
              </div>
            )}
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
                onMouseDown={handleHeaderMouseDown}
            />
            <div className={`transition-all duration-300 ease-in-out overflow-hidden ${isMinimized ? 'max-h-0 opacity-0' : 'max-h-[1000px] opacity-100'}`}>
                <div className="p-2">
                    <div ref={el => handleAnchorRefs.current['image_output'] = el}>
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
        </>
      )}
      
      {node.type === NodeType.ImageGenerator && (
        <>
          <NodeHeader 
            title='Image Generator'
            icon={<ImageIcon className="w-4 h-4 text-blue-400" />}
            isMinimized={isMinimized}
            onToggleMinimize={() => onToggleMinimize(node.id)}
            onDelete={() => onDelete(node.id)}
            onMouseDown={handleHeaderMouseDown}
          />
          <div className={`transition-all duration-300 ease-in-out overflow-hidden ${isMinimized ? 'max-h-0 opacity-0' : 'max-h-[2000px] opacity-100'}`}>
            <div className="p-2 space-y-2">
              <div ref={el => handleAnchorRefs.current['prompt_input'] = el}>
                <label htmlFor={`prompt-${node.id}`} className={labelClassName}>Prompt</label>
                <textarea
                  id={`prompt-${node.id}`}
                  value={node.data.prompt || ''}
                  onChange={(e) => onUpdateData(node.id, { prompt: e.target.value })}
                  onKeyDown={(e) => handleTextAreaKeyDown(e, NodeType.ImageGenerator)}
                  onMouseDown={(e) => e.stopPropagation()}
                  className={textAreaClassName(connections.some(c => c.toNodeId === node.id && c.toHandleId === 'prompt_input'))}
                  disabled={connections.some(c => c.toNodeId === node.id && c.toHandleId === 'prompt_input')}
                  placeholder="e.g., A cat astronaut on Mars"
                />
              </div>
              <div className='flex space-x-2'>
                <div className='flex-1'>
                    <label htmlFor={`count-${node.id}`} className={labelClassName}>Images</label>
                    <select id={`count-${node.id}`} className={selectClassName} value={node.data.numberOfImages || 1} onChange={(e) => onUpdateData(node.id, { numberOfImages: parseInt(e.target.value) })} onMouseDown={(e) => e.stopPropagation()} >
                      {[1, 2, 3, 4].map(i => <option key={i} value={i}>{i}</option>)}
                    </select>
                </div>
                <div className='flex-1'>
                  <label htmlFor={`aspect-${node.id}`} className={labelClassName}>Aspect Ratio</label>
                  <select id={`aspect-${node.id}`} className={selectClassName} value={node.data.aspectRatio || '1:1'} onChange={(e) => onUpdateData(node.id, { aspectRatio: e.target.value })} onMouseDown={(e) => e.stopPropagation()} >
                    <option value="1:1">1:1 (Square)</option>
                    <option value="16:9">16:9 (Widescreen)</option>
                    <option value="9:16">9:16 (Portrait)</option>
                    <option value="4:3">4:3 (Standard)</option>
                    <option value="3:4">3:4 (Standard Portrait)</option>
                  </select>
                </div>
              </div>

              <div>
                <label className={labelClassName}>Output Images</label>
                <div className="space-y-2">
                    {node.data.isLoading ? (
                        <div className={`${imagePreviewBaseClassName} h-40`}>
                            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-400"></div>
                        </div>
                    ) : node.data.error ? (
                        <div className="text-red-400 text-xs p-2 text-center">{node.data.error}</div>
                    ) : node.data.imageUrls && node.data.imageUrls.length > 0 ? (
                        node.data.imageUrls.map((url, index) => (
                            <div key={index} className="relative" ref={el => (handleAnchorRefs.current[`image_output_${index + 1}`] = el)}>
                                <img src={url} alt={`Generated image ${index + 1}`} className="w-full h-auto object-cover rounded-md cursor-zoom-in" onClick={() => onImageClick(url)} />
                            </div>
                        ))
                    ) : (
                        <div className={`${imagePreviewBaseClassName} h-40`}>
                            <ImageIcon className={`w-8 h-8 ${styles.node.imagePlaceholderIcon}`} />
                        </div>
                    )}
                </div>
              </div>

              <button onClick={() => onGenerateImages(node.id)} disabled={node.data.isLoading} className={`w-full flex items-center justify-center p-2 ${node.data.isLoading ? 'bg-gray-600' : 'bg-blue-600 hover:bg-blue-500'} text-white font-bold rounded-md transition-colors text-sm disabled:cursor-not-allowed`} >
                <SparklesIcon className={`w-4 h-4 mr-2 ${node.data.isLoading ? 'animate-pulse' : ''}`} />
                {node.data.isLoading ? 'Generating...' : 'Generate Images'}
              </button>
            </div>
          </div>
          {isMinimized && ( <div className={`w-full ${styles.node.imagePlaceholderBg} rounded-b-md flex items-center justify-center border-t ${styles.node.imagePlaceholderBorder} transition-all duration-300 ease-in-out overflow-hidden`} style={{ height: node.data.minimizedHeight ? `${node.data.minimizedHeight}px` : '64px' }} >
              {previewImage ? <img key={previewImage} ref={minimizedImageRef} src={previewImage!} alt="Preview" className="w-full h-full object-contain" /> : <ImageIcon className={`w-8 h-8 ${styles.node.imagePlaceholderIcon}`} />}
          </div> )}
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
            onMouseDown={handleHeaderMouseDown}
          />
          <div className={`transition-all duration-300 ease-in-out overflow-hidden ${isMinimized ? 'max-h-0 opacity-0' : 'max-h-[1000px] opacity-100'}`}>
            <div className="p-2 space-y-2">
              <div ref={el => handleAnchorRefs.current['description_input'] = el}>
                <label htmlFor={`desc-${node.id}`} className={labelClassName}>Character Description</label>
                <textarea
                  id={`desc-${node.id}`}
                  value={node.data.characterDescription || ''}
                  onChange={(e) => onUpdateData(node.id, { characterDescription: e.target.value })}
                  onKeyDown={(e) => handleTextAreaKeyDown(e, NodeType.CharacterGenerator)}
                  onMouseDown={(e) => e.stopPropagation()}
                  className={textAreaClassName(connections.some(c => c.toNodeId === node.id && c.toHandleId === 'description_input'))}
                  disabled={connections.some(c => c.toNodeId === node.id && c.toHandleId === 'description_input')}
                  placeholder="e.g., A cat astronaut on Mars"
                />
              </div>
              <div>
                <label htmlFor={`style-${node.id}`} className={labelClassName}>Style</label>
                <select id={`style-${node.id}`} className={selectClassName} value={node.data.style} onChange={(e) => onUpdateData(node.id, { style: e.target.value })} onMouseDown={(e) => e.stopPropagation()} >
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
                <select id={`layout-${node.id}`} className={selectClassName} value={node.data.layout} onChange={(e) => onUpdateData(node.id, { layout: e.target.value })} onMouseDown={(e) => e.stopPropagation()} >
                  <option>4-panel grid</option>
                  <option>6-panel grid</option>
                  <option>T-pose reference sheet</option>
                </select>
              </div>
              <div>
                <label htmlFor={`aspect-${node.id}`} className={labelClassName}>Aspect Ratio</label>
                <select id={`aspect-${node.id}`} className={selectClassName} value={node.data.aspectRatio} onChange={(e) => onUpdateData(node.id, { aspectRatio: e.target.value })} onMouseDown={(e) => e.stopPropagation()} >
                  <option value="1:1">1:1 (Square)</option>
                  <option value="16:9">16:9 (Widescreen)</option>
                  <option value="9:16">9:16 (Portrait)</option>
                  <option value="4:3">4:3 (Standard)</option>
                  <option value="3:4">3:4 (Standard Portrait)</option>
                </select>
              </div>
              <div ref={el => handleAnchorRefs.current['image_output'] = el}>
                <label className={labelClassName}>Output Image</label>
                <div className={`${imagePreviewBaseClassName} h-40`}>
                  {node.data.isLoading ? <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-cyan-400"></div>
                  : node.data.error ? <div className="text-red-400 text-xs p-2 text-center">{node.data.error}</div>
                  : node.data.imageUrl ? <img src={node.data.imageUrl} alt="Generated character" className="w-full h-full object-cover rounded-md cursor-zoom-in" onClick={() => onImageClick(node.data.imageUrl!)} />
                  : <ImageIcon className={`w-8 h-8 ${styles.node.imagePlaceholderIcon}`} />}
                </div>
              </div>
              <button onClick={() => onGenerateCharacterImage(node.id)} disabled={node.data.isLoading} className={`w-full flex items-center justify-center p-2 ${node.data.isLoading ? 'bg-gray-600' : 'bg-cyan-600 hover:bg-cyan-500'} text-white font-bold rounded-md transition-colors text-sm disabled:cursor-not-allowed`} >
                <SparklesIcon className={`w-4 h-4 mr-2 ${node.data.isLoading ? 'animate-pulse' : ''}`} />
                {node.data.isLoading ? 'Generating...' : 'Generate Image'}
              </button>
            </div>
          </div>
          {isMinimized && ( <div className={`w-full ${styles.node.imagePlaceholderBg} rounded-b-md flex items-center justify-center border-t ${styles.node.imagePlaceholderBorder} transition-all duration-300 ease-in-out overflow-hidden`} style={{ height: node.data.minimizedHeight ? `${node.data.minimizedHeight}px` : '64px' }} >
              {hasVisuals ? <img key={previewImage} ref={minimizedImageRef} src={previewImage!} alt="Preview" className="w-full h-full object-contain" /> : <ImageIcon className={`w-8 h-8 ${styles.node.imagePlaceholderIcon}`} />}
          </div> )}
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
                onMouseDown={handleHeaderMouseDown}
            />
            <div className={`transition-all duration-300 ease-in-out overflow-hidden ${isMinimized ? 'max-h-0 opacity-0' : 'max-h-[1000px] opacity-100'}`}>
              <div className="p-2 space-y-2">
                <div ref={el => handleAnchorRefs.current['image_input'] = el}>
                    <label className={labelClassName}>Input Image</label>
                    <div className={`${imagePreviewBaseClassName} h-32`}>
                        {node.data.inputImageUrl ? <img src={node.data.inputImageUrl} alt="Input for editing" className="w-full h-full object-cover rounded-md" /> : <ImageIcon className={`w-8 h-8 ${styles.node.imagePlaceholderIcon}`} />}
                    </div>
                </div>
                <div>
                    <label htmlFor={`edit-desc-${node.id}`} className={labelClassName}>Edit Description</label>
                    <textarea id={`edit-desc-${node.id}`} value={node.data.editDescription || ''} onChange={(e) => onUpdateData(node.id, { editDescription: e.target.value })} onKeyDown={(e) => handleTextAreaKeyDown(e, NodeType.ImageEditor)} onMouseDown={(e) => e.stopPropagation()} className={`${textAreaClassName()} h-20`} placeholder="e.g., Add a golden crown to the subject" />
                </div>
                <div ref={el => handleAnchorRefs.current['image_output'] = el}>
                    <label className={labelClassName}>Output Image</label>
                    <div className={`${imagePreviewBaseClassName} h-40`}>
                        {node.data.isLoading ? <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-purple-400"></div>
                        : node.data.error ? <div className="text-red-400 text-xs p-2 text-center">{node.data.error}</div>
                        : node.data.imageUrl ? <img src={node.data.imageUrl} alt="Edited image" className="w-full h-full object-cover rounded-md cursor-zoom-in" onClick={() => onImageClick(node.data.imageUrl!)} />
                        : <ImageIcon className={`w-8 h-8 ${styles.node.imagePlaceholderIcon}`} />}
                    </div>
                </div>
                <button onClick={() => onEditImage(node.id)} disabled={node.data.isLoading} className={`w-full flex items-center justify-center p-2 ${node.data.isLoading ? 'bg-gray-600' : 'bg-purple-600 hover:bg-purple-500'} text-white font-bold rounded-md transition-colors text-sm disabled:cursor-not-allowed`} >
                    <SparklesIcon className={`w-4 h-4 mr-2 ${node.data.isLoading ? 'animate-pulse' : ''}`} />
                    {node.data.isLoading ? 'Editing...' : 'Edit Image'}
                </button>
              </div>
            </div>
            {isMinimized && ( <div className={`w-full ${styles.node.imagePlaceholderBg} rounded-b-md flex items-center justify-center border-t ${styles.node.imagePlaceholderBorder} transition-all duration-300 ease-in-out overflow-hidden`} style={{ height: node.data.minimizedHeight ? `${node.data.minimizedHeight}px` : '64px' }} >
                {hasVisuals ? <img key={previewImage} ref={minimizedImageRef} src={previewImage!} alt="Preview" className="w-full h-full object-contain" /> : <ImageIcon className={`w-8 h-8 ${styles.node.imagePlaceholderIcon}`} /> }
            </div> )}
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
                onMouseDown={handleHeaderMouseDown}
            />
            <div className={`transition-all duration-300 ease-in-out overflow-hidden ${isMinimized ? 'max-h-0 opacity-0' : 'max-h-[1000px] opacity-100'}`}>
              <div className="p-2 space-y-2">
                <div ref={el => handleAnchorRefs.current['image_input'] = el}>
                    <label className={labelClassName}>Input Image (Optional)</label>
                    <div className={`${imagePreviewBaseClassName} h-24`}>
                        {node.data.inputImageUrl ? <img src={node.data.inputImageUrl} alt="Input for video" className="w-full h-full object-cover rounded-md" /> : <ImageIcon className={`w-8 h-8 ${styles.node.imagePlaceholderIcon}`} />}
                    </div>
                </div>
                <div>
                    <label htmlFor={`video-model-${node.id}`} className={labelClassName}>Video Model</label>
                    <select id={`video-model-${node.id}`} className={selectClassName} value={node.data.videoModel || 'veo-2.0-generate-001'} onChange={(e) => onUpdateData(node.id, { videoModel: e.target.value })} onMouseDown={(e) => e.stopPropagation()} >
                        <option value="veo-2.0-generate-001">Veo 2 (Standard)</option>
                    </select>
                </div>
                <div ref={el => handleAnchorRefs.current['prompt_input'] = el}>
                    <label htmlFor={`prompt-${node.id}`} className={labelClassName}>Video Prompt</label>
                    <textarea id={`prompt-${node.id}`} value={node.data.editDescription || ''} onChange={(e) => onUpdateData(node.id, { editDescription: e.target.value })} onKeyDown={(e) => handleTextAreaKeyDown(e, NodeType.VideoGenerator)} onMouseDown={(e) => e.stopPropagation()} className={`${textAreaClassName(connections.some(c => c.toNodeId === node.id && c.toHandleId === 'prompt_input'))} h-20`} disabled={connections.some(c => c.toNodeId === node.id && c.toHandleId === 'prompt_input')} placeholder="e.g., A majestic eagle soaring over mountains" />
                </div>
                <div ref={el => handleAnchorRefs.current['video_output'] = el}>
                    <label className={labelClassName}>Output Video</label>
                    <div className={`${imagePreviewBaseClassName} h-40`}>
                        {node.data.isLoading ? <div className="flex flex-col items-center justify-center text-center p-2"><div className="animate-spin rounded-full h-8 w-8 border-b-2 border-cyan-400 mb-2"></div><span className="text-xs text-gray-400">{node.data.generationProgressMessage || 'Generating...'}</span></div>
                        : node.data.error ? <div className="text-red-400 text-xs p-2 text-center">{node.data.error}</div>
                        : node.data.videoUrl ? <video src={node.data.videoUrl} controls className="w-full h-full object-cover rounded-md" />
                        : <VideoIcon className={`w-8 h-8 ${styles.node.imagePlaceholderIcon}`} />}
                    </div>
                </div>
                <button onClick={() => onGenerateVideo(node.id)} disabled={node.data.isLoading} className={`w-full flex items-center justify-center p-2 ${node.data.isLoading ? 'bg-gray-600' : 'bg-green-600 hover:bg-green-500'} text-white font-bold rounded-md transition-colors text-sm disabled:cursor-not-allowed`} >
                    <SparklesIcon className={`w-4 h-4 mr-2 ${node.data.isLoading ? 'animate-pulse' : ''}`} />
                    {node.data.isLoading ? 'Generating...' : 'Generate Video'}
                </button>
              </div>
            </div>
            {isMinimized && ( <div className={`w-full ${styles.node.imagePlaceholderBg} rounded-b-md flex items-center justify-center border-t ${styles.node.imagePlaceholderBorder} transition-all duration-300 ease-in-out overflow-hidden`} style={{ height: node.data.minimizedHeight ? `${node.data.minimizedHeight}px` : '64px' }} >
                {!hasVisuals ? <VideoIcon className={`w-8 h-8 ${styles.node.imagePlaceholderIcon}`} /> :
                previewVideo ? <video key={previewVideo} ref={minimizedVideoRef} src={previewVideo} controls className="w-full h-full object-contain" />
                : <img key={previewImage} ref={minimizedImageRef} src={previewImage!} alt="Preview" className="w-full h-full object-contain" />}
            </div> )}
        </>
      )}
    </div>
  );
};

export default Node;