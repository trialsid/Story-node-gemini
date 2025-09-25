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
import MixerIcon from './icons/MixerIcon';

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
  allNodes: NodeData[];
  connections: Connection[];
  onDragStart: (nodeId: string, e: React.MouseEvent) => void;
  onUpdateData: (nodeId: string, data: Partial<NodeData['data']>) => void;
  onGenerateCharacterImage: (nodeId: string) => void;
  onGenerateImages: (nodeId: string) => void;
  onEditImage: (nodeId: string) => void;
  onMixImages: (nodeId: string) => void;
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

const SLICE_HEIGHT_PX = 32; // Corresponds to h-8 in TailwindCSS

const Node: React.FC<NodeProps> = ({
  node,
  allNodes,
  connections,
  onDragStart,
  onUpdateData,
  onGenerateCharacterImage,
  onGenerateImages,
  onEditImage,
  onMixImages,
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
      } else if (nodeType === NodeType.ImageMixer) {
        onMixImages(node.id);
      } else if (nodeType === NodeType.VideoGenerator) {
        onGenerateVideo(node.id);
      } else if (nodeType === NodeType.TextGenerator) {
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
    
    if (node.type === NodeType.ImageGenerator && node.data.imageUrls && (node.data.numberOfImages || 1) > 1) {
        const visibleSlices = (node.data.imageUrls || []).slice(0, node.data.numberOfImages || 1).length;
        const newHeight = visibleSlices * SLICE_HEIGHT_PX;
        if (node.data.minimizedHeight !== newHeight) {
            onUpdateData(node.id, { minimizedHeight: newHeight });
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
          if (node.data.minimizedHeight !== 64) {
              onUpdateData(node.id, { minimizedHeight: 64 });
          }
      }
    };

    const timeoutId = setTimeout(calculateHeight, 0);

    return () => {
        isMounted = false;
        clearTimeout(timeoutId);
        if (element) {
            element.removeEventListener(eventName, setHeightFromElement);
        }
    };
  }, [isMinimized, hasVisuals, previewImage, previewVideo, node.type, node.data.aspectRatio, dimensions.width, node.id, onUpdateData, node.data.minimizedHeight, node.data.imageUrls, node.data.numberOfImages]);

  // Effect for calculating handle positions
  useEffect(() => {
    const wasMinimized = prevIsMinimizedRef.current;
    prevIsMinimizedRef.current = isMinimized;

    if (!nodeRef.current || isMinimized) return;

    const calculateOffsets = () => {
      if (!nodeRef.current) return;
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
              if (Math.abs((node.data.handleYOffsets?.[handle.id] || 0) - yPosition) > 1) {
                  needsUpdate = true;
              }
          }
      });

      if (needsUpdate) {
          onUpdateData(node.id, { handleYOffsets: { ...node.data.handleYOffsets, ...newOffsets }});
      }
    };
    
    if (wasMinimized && !isMinimized) {
        const timeoutId = setTimeout(calculateOffsets, 310); // 300ms transition + 10ms buffer
        return () => clearTimeout(timeoutId);
    } else {
        calculateOffsets();
    }

  }, [node.id, node.type, onUpdateData, isMinimized, nodeSpec, node.data.handleYOffsets, node.data.text, node.data.imageUrl, node.data.imageUrls, node.data.prompt, node.data.numberOfImages]);
  
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
    const headerHeight = 40;
    
    const spec = NODE_SPEC[node.type];
    const allHandlesForSide = side === 'input' ? spec.inputs : spec.outputs;

    let visibleHandles: NodeHandleSpec[];
    if (node.type === NodeType.ImageGenerator && side === 'output') {
      visibleHandles = allHandlesForSide.slice(0, node.data.numberOfImages || 1);
    } else {
      visibleHandles = allHandlesForSide;
    }

    const totalVisibleHandles = visibleHandles.length;
    const currentHandleIndex = visibleHandles.findIndex(h => h.id === handleId);

    if (node.type === NodeType.ImageGenerator && side === 'output') {
        const generatedImagesCount = (node.data.imageUrls || []).length;
        
        // Use slice-based positioning ONLY if more than one image has been generated
        // AND all the expected (visible) images have also been generated.
        if (generatedImagesCount > 1 && generatedImagesCount >= totalVisibleHandles) {
            if (currentHandleIndex !== -1) {
                return headerHeight + (SLICE_HEIGHT_PX * currentHandleIndex) + (SLICE_HEIGHT_PX / 2);
            }
        }
    }

    // Fallback logic for all other cases (including single image, no images, or partially generated images)
    const previewHeight = node.data.minimizedHeight || 64;
    
    if (currentHandleIndex === -1 || totalVisibleHandles === 0) {
        return headerHeight + (previewHeight / 2);
    }
    
    return headerHeight + (previewHeight * (currentHandleIndex + 1)) / (totalVisibleHandles + 1);
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
            [side === 'input' ? 'left' : 'right']: '-8px',
            top: isMinimized ? getMinimizedHandleTop(handle.id, side) : (node.data.handleYOffsets?.[handle.id] ?? '50%'),
            transform: 'translateY(-50%)',
            transition: 'top 0.3s ease-in-out',
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
      
      {node.type === NodeType.TextGenerator && (
        <>
            <NodeHeader 
                title='Text Generator'
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
                          onKeyDown={(e) => handleTextAreaKeyDown(e, NodeType.TextGenerator)}
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
                    ) : (
                        Array.from({ length: node.data.numberOfImages || 1 }).map((_, index) => {
                            const imageUrl = node.data.imageUrls?.[index];
                            return (
                                <div key={index} className="relative" ref={el => { handleAnchorRefs.current[`image_output_${index + 1}`] = el; }}>
                                    {imageUrl ? (
                                        <img 
                                            src={imageUrl} 
                                            alt={`Generated image ${index + 1}`} 
                                            className="w-full h-auto object-cover rounded-md cursor-zoom-in" 
                                            onClick={() => onImageClick(imageUrl)} 
                                        />
                                    ) : (
                                        <div className={`${imagePreviewBaseClassName} h-40`}>
                                            <ImageIcon className={`w-8 h-8 ${styles.node.imagePlaceholderIcon}`} />
                                        </div>
                                    )}
                                </div>
                            );
                        })
                    )}
                </div>
              </div>

              <button onClick={() => onGenerateImages(node.id)} disabled={node.data.isLoading} className={`w-full flex items-center justify-center p-2 ${node.data.isLoading ? 'bg-gray-600' : 'bg-blue-600 hover:bg-blue-500'} text-white font-bold rounded-md transition-colors text-sm disabled:cursor-not-allowed`} >
                <SparklesIcon className={`w-4 h-4 mr-2 ${node.data.isLoading ? 'animate-pulse' : ''}`} />
                {node.data.isLoading ? 'Generating...' : 'Generate Images'}
              </button>
            </div>
          </div>
            {isMinimized && (
                (node.data.imageUrls || []).length > 1 && (node.data.imageUrls || []).length >= (node.data.numberOfImages || 1) ? (
                    <div 
                        className={`w-full ${styles.node.imagePlaceholderBg} rounded-b-md border-t ${styles.node.imagePlaceholderBorder} transition-all duration-300 ease-in-out overflow-hidden`}
                        style={{ height: node.data.minimizedHeight ? `${node.data.minimizedHeight}px` : 'auto' }}
                    >
                        {(node.data.imageUrls || []).slice(0, node.data.numberOfImages || 1).map((url, index) => (
                            <div
                                key={index}
                                className="w-full bg-cover bg-center"
                                style={{ backgroundImage: `url(${url})`, height: `${SLICE_HEIGHT_PX}px` }}
                                aria-label={`Preview slice of generated image ${index + 1}`}
                            />
                        ))}
                    </div>
                ) : (
                    <div className={`w-full ${styles.node.imagePlaceholderBg} rounded-b-md flex items-center justify-center border-t ${styles.node.imagePlaceholderBorder} transition-all duration-300 ease-in-out overflow-hidden`} style={{ height: node.data.minimizedHeight ? `${node.data.minimizedHeight}px` : '64px' }} >
                        {previewImage ? <img key={previewImage} ref={minimizedImageRef} src={previewImage} alt="Preview" className="w-full h-full object-contain" /> : <ImageIcon className={`w-8 h-8 ${styles.node.imagePlaceholderIcon}`} />}
                    </div>
                )
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

       {node.type === NodeType.ImageMixer && (() => {
          const inputConnections = connections.filter(c => c.toNodeId === node.id && c.toHandleId === 'image_input');
          const inputImageUrls = inputConnections.flatMap(conn => {
            const sourceNode = allNodes.find(n => n.id === conn.fromNodeId);
            if (!sourceNode) return [];

            if (sourceNode.type === NodeType.ImageGenerator && sourceNode.data.imageUrls) {
              const match = conn.fromHandleId.match(/_(\d+)$/);
              if (match) {
                const imageIndex = parseInt(match[1], 10) - 1;
                return sourceNode.data.imageUrls[imageIndex] ? [sourceNode.data.imageUrls[imageIndex]] : [];
              }
              return [];
            } else if (sourceNode.data.imageUrl) {
              return [sourceNode.data.imageUrl];
            }
            return [];
          });
          const mixerPreviewImage = node.data.imageUrl;
          const mixerHasVisuals = !!mixerPreviewImage;

          return (
            <>
              <NodeHeader 
                title='Image Mixer'
                icon={<MixerIcon className="w-4 h-4 text-pink-400" />}
                isMinimized={isMinimized}
                onToggleMinimize={() => onToggleMinimize(node.id)}
                onDelete={() => onDelete(node.id)}
                onMouseDown={handleHeaderMouseDown}
              />
              <div className={`transition-all duration-300 ease-in-out overflow-hidden ${isMinimized ? 'max-h-0 opacity-0' : 'max-h-[1000px] opacity-100'}`}>
                <div className="p-2 space-y-2">
                  <div ref={el => handleAnchorRefs.current['image_input'] = el}>
                    <label className={labelClassName}>Input Images ({inputImageUrls.length})</label>
                    <div className={`${imagePreviewBaseClassName} min-h-[5rem] p-2 flex-wrap gap-2`}>
                      {inputImageUrls.length > 0 ? (
                        inputImageUrls.map((url, index) => (
                          <img key={`${url}-${index}`} src={url} alt={`Input ${index + 1}`} className="w-16 h-16 object-cover rounded-md" />
                        ))
                      ) : (
                        <ImageIcon className={`w-8 h-8 ${styles.node.imagePlaceholderIcon}`} />
                      )}
                    </div>
                  </div>
                  <div>
                    <label htmlFor={`edit-desc-${node.id}`} className={labelClassName}>Mix Description</label>
                    <textarea id={`edit-desc-${node.id}`} value={node.data.editDescription || ''} onChange={(e) => onUpdateData(node.id, { editDescription: e.target.value })} onKeyDown={(e) => handleTextAreaKeyDown(e, NodeType.ImageMixer)} onMouseDown={(e) => e.stopPropagation()} className={`${textAreaClassName()} h-20`} placeholder="e.g., A photorealistic blend..." />
                  </div>
                  <div ref={el => handleAnchorRefs.current['image_output'] = el}>
                    <label className={labelClassName}>Output Image</label>
                    <div className={`${imagePreviewBaseClassName} h-40`}>
                      {node.data.isLoading ? <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-pink-400"></div>
                      : node.data.error ? <div className="text-red-400 text-xs p-2 text-center">{node.data.error}</div>
                      : node.data.imageUrl ? <img src={node.data.imageUrl} alt="Mixed image" className="w-full h-full object-cover rounded-md cursor-zoom-in" onClick={() => onImageClick(node.data.imageUrl!)} />
                      : <ImageIcon className={`w-8 h-8 ${styles.node.imagePlaceholderIcon}`} />}
                    </div>
                  </div>
                  <button onClick={() => onMixImages(node.id)} disabled={node.data.isLoading} className={`w-full flex items-center justify-center p-2 ${node.data.isLoading ? 'bg-gray-600' : 'bg-pink-600 hover:bg-pink-500'} text-white font-bold rounded-md transition-colors text-sm disabled:cursor-not-allowed`} >
                    <SparklesIcon className={`w-4 h-4 mr-2 ${node.data.isLoading ? 'animate-pulse' : ''}`} />
                    {node.data.isLoading ? 'Mixing...' : 'Mix Images'}
                  </button>
                </div>
              </div>
              {isMinimized && (
                <div className={`w-full ${styles.node.imagePlaceholderBg} rounded-b-md flex items-center justify-center border-t ${styles.node.imagePlaceholderBorder} transition-all duration-300 ease-in-out overflow-hidden`} style={{ height: node.data.minimizedHeight ? `${node.data.minimizedHeight}px` : '64px' }}>
                  {mixerHasVisuals ? <img key={mixerPreviewImage} ref={minimizedImageRef} src={mixerPreviewImage!} alt="Preview" className="w-full h-full object-contain" /> : <MixerIcon className={`w-8 h-8 ${styles.node.imagePlaceholderIcon}`} />}
                </div>
              )}
            </>
          )
      })()}

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
                    <select id={`video-model-${node.id}`} className={selectClassName} value={node.data.videoModel || 'veo-3.0-fast-generate-001'} onChange={(e) => onUpdateData(node.id, { videoModel: e.target.value })} onMouseDown={(e) => e.stopPropagation()} >
                        <option value="veo-3.0-fast-generate-001">Veo 3.0 (Fast)</option>
                        <option value="veo-2.0-generate-001">Veo 2.0</option>
                    </select>
                </div>
                <div ref={el => handleAnchorRefs.current['prompt_input'] = el}>
                    <label htmlFor={`video-desc-${node.id}`} className={labelClassName}>Video Prompt</label>
                    <textarea id={`video-desc-${node.id}`} value={node.data.editDescription || ''} onChange={(e) => onUpdateData(node.id, { editDescription: e.target.value })} onKeyDown={(e) => handleTextAreaKeyDown(e, NodeType.VideoGenerator)} onMouseDown={(e) => e.stopPropagation()} className={`${textAreaClassName(connections.some(c => c.toNodeId === node.id && c.toHandleId === 'prompt_input'))} h-20`} disabled={connections.some(c => c.toNodeId === node.id && c.toHandleId === 'prompt_input')} placeholder="e.g., A majestic eagle soaring" />
                </div>
                <div ref={el => handleAnchorRefs.current['video_output'] = el}>
                    <label className={labelClassName}>Output Video</label>
                    <div className={`${imagePreviewBaseClassName} h-40`}>
                        {node.data.isLoading ? (
                            <div className="text-center">
                                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-green-400 mx-auto"></div>
                                <p className="text-xs mt-2 text-green-300 animate-pulse">{node.data.generationProgressMessage || 'Generating...'}</p>
                            </div>
                        )
                        : node.data.error ? <div className="text-red-400 text-xs p-2 text-center">{node.data.error}</div>
                        : node.data.videoUrl ? <video src={node.data.videoUrl} controls autoPlay muted loop className="w-full h-full object-cover rounded-md" />
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
                {previewVideo ? <video key={previewVideo} ref={minimizedVideoRef} src={previewVideo} muted loop autoPlay playsInline className="w-full h-full object-contain" />
                : previewImage ? <img key={previewImage} ref={minimizedImageRef} src={previewImage} alt="Preview" className="w-full h-full object-contain" />
                : <VideoIcon className={`w-8 h-8 ${styles.node.imagePlaceholderIcon}`} />}
            </div> )}
        </>
      )}
    </div>
  );
};

export default Node;
