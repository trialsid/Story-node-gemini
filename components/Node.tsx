import React, { useRef, useEffect, useState, useLayoutEffect } from 'react';
import { NodeData, NodeType, Connection, HandleType } from '../types';
import { FileText, ScrollText, Users as UsersIcon, UserCog, PenTool, PenSquare, Edit3, Image, ImagePlus, Wand2, Sparkles, Trash2, ChevronDown, ChevronUp, Video, Clapperboard, Upload, Bot, Shuffle, Layers } from 'lucide-react';
import NodeHandle from './NodeHandle';
import { useTheme } from '../contexts/ThemeContext';
import { areHandlesCompatible, NodeHandleSpec } from '../utils/node-spec';
import ExpandableTextArea from './ExpandableTextArea';
import { getHandlesForSide, getMinimizedHandleY, SLICE_HEIGHT_PX, DEFAULT_MINIMIZED_PREVIEW_HEIGHT } from '../utils/handlePositions';
import NodeContextMenu from './NodeContextMenu';

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
  onNodeClick: (nodeId: string, e: React.MouseEvent) => void;
  isSelected: boolean;
  selectedNodeIds: Set<string>;
  onUpdateSelection: (nodeIds: Set<string>) => void;
  onUpdateData: (nodeId: string, data: Partial<NodeData['data']>) => void;
  onGenerateCharacterImage: (nodeId: string) => void;
  onGenerateImages: (nodeId: string) => void;
  onEditImage: (nodeId: string) => void;
  onMixImages: (nodeId: string) => void;
  onGenerateVideo: (nodeId: string) => void;
  onGenerateText: (nodeId: string) => void;
  onGenerateCharacters: (nodeId: string) => void;
  onGenerateCharacterSheets: (nodeId: string) => void;
  onExpandStory: (nodeId: string) => void;
  onGenerateShortStory: (nodeId: string) => void;
  onGenerateScreenplay: (nodeId: string) => void;
  onOpenTextModal: (title: string, text: string) => void;
  onImageClick: (imageUrl: string) => void;
  onOutputMouseDown: (nodeId: string, handleId: string) => void;
  onInputMouseDown: (nodeId: string, handleId: string) => void;
  onInputMouseUp: (nodeId: string, handleId: string) => void;
  onDelete: (nodeId: string) => void;
  onDeleteDirectly: (nodeId: string) => void;
  onDuplicate: (nodeId: string) => string | null;
  onDuplicateMany: (nodeIds: string[]) => string[];
  onReset: (nodeId: string) => void;
  onToggleMinimize: (nodeId: string) => void;
  dimensions: { width: number; height?: number };
  tempConnectionInfo: TempConnectionInfo | null;
  hoveredInputHandle: HoveredInputInfo | null;
  setHoveredInputHandle: (info: HoveredInputInfo | null) => void;
  zoom: number;
  canvasOffset: { x: number; y: number };
}

interface NodeHeaderProps {
  title: string;
  icon: React.ReactNode;
  isMinimized: boolean;
  onToggleMinimize: () => void;
  onDelete: () => void;
  onShowDeleteConfirmation: (e: React.MouseEvent) => void;
  onMouseDown: (e: React.MouseEvent) => void;
  onContextMenu: (e: React.MouseEvent) => void;
}

const NodeHeader: React.FC<NodeHeaderProps> = ({ title, icon, isMinimized, onToggleMinimize, onDelete, onShowDeleteConfirmation, onMouseDown, onContextMenu }) => {
  const { styles } = useTheme();
  return (
    <div
      className={`flex items-center justify-between p-2 ${styles.node.headerBg} rounded-t-lg cursor-move`}
      onMouseDown={onMouseDown}
      onContextMenu={onContextMenu}
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
          {isMinimized ? <ChevronDown className="w-4 h-4" /> : <ChevronUp className="w-4 h-4" />}
        </button>
        <button
          onMouseDown={(e) => e.stopPropagation()}
          onClick={onShowDeleteConfirmation}
          className="p-1 rounded-full text-gray-400 hover:bg-red-500/50 hover:text-white transition-colors z-10"
          aria-label="Delete node"
        >
          <Trash2 className="w-4 h-4" />
        </button>
      </div>
    </div>
  );
};

const formatDuration = (ms?: number | null) => {
  if (ms === undefined || ms === null || Number.isNaN(ms)) {
    return '--:--';
  }
  const totalSeconds = Math.max(0, Math.floor(ms / 1000));
  const seconds = totalSeconds % 60;
  const minutes = Math.floor(totalSeconds / 60);

  if (minutes >= 60) {
    const hours = Math.floor(minutes / 60);
    const remainingMinutes = minutes % 60;
    return `${hours}:${String(remainingMinutes).padStart(2, '0')}:${String(seconds).padStart(2, '0')}`;
  }

  return `${String(minutes).padStart(2, '0')}:${String(seconds).padStart(2, '0')}`;
};

const CHARACTER_BLOCK_HEIGHT_PX = 128;

const Node: React.FC<NodeProps> = ({
  node,
  allNodes,
  connections,
  onDragStart,
  onNodeClick,
  isSelected,
  selectedNodeIds,
  onUpdateSelection,
  onUpdateData,
  onGenerateCharacterImage,
  onGenerateImages,
  onEditImage,
  onMixImages,
  onGenerateVideo,
  onGenerateText,
  onGenerateCharacters,
  onGenerateCharacterSheets,
  onExpandStory,
  onGenerateShortStory,
  onGenerateScreenplay,
  onOpenTextModal,
  onImageClick,
  onOutputMouseDown,
  onInputMouseDown,
  onInputMouseUp,
  onDelete,
  onDeleteDirectly,
  onDuplicate,
  onDuplicateMany,
  onReset,
  onToggleMinimize,
  dimensions,
  tempConnectionInfo,
  hoveredInputHandle,
  setHoveredInputHandle,
  zoom,
  canvasOffset,
}) => {
  const { styles } = useTheme();
  const isMinimized = !!node.data.isMinimized;
  const [isDraggingOver, setIsDraggingOver] = useState(false);
  const [videoElapsedMs, setVideoElapsedMs] = useState<number | null>(null);
  const inputHandles = getHandlesForSide(node, 'input');
  const outputHandles = getHandlesForSide(node, 'output');
  const [contextMenuPosition, setContextMenuPosition] = useState<{ x: number; y: number } | null>(null);
  const [contextMenuStartsWithDelete, setContextMenuStartsWithDelete] = useState(false);

  const selectClassName = `w-full p-1 ${styles.node.inputBg} border ${styles.node.inputBorder} rounded-md text-sm ${styles.node.text} focus:outline-none focus:ring-2 ${styles.node.inputFocusRing}`;
  const labelClassName = `text-xs font-semibold ${styles.node.labelText}`;
  const imagePreviewBaseClassName = `w-full ${styles.node.imagePlaceholderBg} rounded-md flex items-center justify-center border border-dashed ${styles.node.imagePlaceholderBorder}`;
  const textAreaClassName = (isDisabled = false) => `w-full p-1 ${isDisabled ? 'bg-gray-700/50 text-gray-400' : styles.node.inputBg} border ${styles.node.inputBorder} rounded-md text-sm ${isDisabled ? '' : styles.node.text} focus:outline-none focus:ring-2 ${styles.node.inputFocusRing} resize-none`;
  
  const handleHeaderMouseDown = (e: React.MouseEvent) => {
    onDragStart(node.id, e);
  };

  const handleHeaderContextMenu = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();

    // If right-clicking a non-selected node when there's a selection, clear selection first
    if (selectedNodeIds.size > 0 && !selectedNodeIds.has(node.id)) {
      onNodeClick(node.id, { ...e, ctrlKey: false, metaKey: false } as React.MouseEvent);
    }

    setContextMenuPosition({ x: e.clientX, y: e.clientY });
    setContextMenuStartsWithDelete(false);
  };

  const closeContextMenu = () => {
    setContextMenuPosition(null);
    setContextMenuStartsWithDelete(false);
  };

  const handleDuplicate = () => {
    // If this node is part of a selection, duplicate all selected nodes
    if (selectedNodeIds.has(node.id) && selectedNodeIds.size > 1) {
      const idsToDuplicate = Array.from(selectedNodeIds);
      const newIds = onDuplicateMany(idsToDuplicate);
      if (newIds.length > 0) {
        requestAnimationFrame(() => {
          onUpdateSelection(new Set(newIds));
        });
      }
    } else {
      const newId = onDuplicate(node.id);
      if (newId) {
        requestAnimationFrame(() => {
          onUpdateSelection(new Set([newId]));
        });
      }
    }
    closeContextMenu();
  };

  const handleReset = () => {
    // If this node is part of a selection, reset all selected nodes
    if (selectedNodeIds.has(node.id) && selectedNodeIds.size > 1) {
      selectedNodeIds.forEach(nodeId => onReset(nodeId));
    } else {
      onReset(node.id);
    }
    closeContextMenu();
  };

  const handleDelete = () => {
    // If this node is part of a selection, delete all selected nodes
    if (selectedNodeIds.has(node.id) && selectedNodeIds.size > 1) {
      selectedNodeIds.forEach(nodeId => onDelete(nodeId));
    } else {
      onDelete(node.id);
    }
    closeContextMenu();
  };

  const handleShowDeleteConfirmation = (e: React.MouseEvent) => {
    // Position the context menu near the delete button
    const buttonRect = (e.currentTarget as HTMLElement).getBoundingClientRect();
    setContextMenuPosition({
      x: buttonRect.right + 8,
      y: buttonRect.top
    });
    setContextMenuStartsWithDelete(true);
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
      } else if (nodeType === NodeType.StoryCharacterCreator) {
        onGenerateCharacters(node.id);
      } else if (nodeType === NodeType.StoryCharacterSheet) {
        onGenerateCharacterSheets(node.id);
      } else if (nodeType === NodeType.StoryExpander) {
        onExpandStory(node.id);
      } else if (nodeType === NodeType.ScreenplayWriter) {
        onGenerateScreenplay(node.id);
      }
    }
  };

  const nodeRef = useRef<HTMLDivElement>(null);
  const imageUploadRef = useRef<HTMLInputElement>(null);

  // Refs for handle anchor elements
  const handleAnchorRefs = useRef<{ [handleId: string]: HTMLElement | null }>({});
  const minimizedHandleAnchorRefs = useRef<{ [handleId: string]: HTMLElement | null }>({});
  const minimizedCharactersPreviewRef = useRef<HTMLDivElement | null>(null);
  const minimizedImageRef = useRef<HTMLImageElement>(null);
  const minimizedVideoRef = useRef<HTMLVideoElement>(null);
  const prevIsMinimizedRef = useRef(isMinimized);

  const previewImage = node.data.imageUrl || node.data.inputImageUrl || node.data.imageUrls?.[0];
  const previewVideo = node.data.videoUrl;
  const hasVisuals = !!(previewImage || previewVideo);

  useEffect(() => {
    if (node.type !== NodeType.VideoGenerator) {
      setVideoElapsedMs(null);
      return;
    }

    const startTime = node.data.generationStartTimeMs;
    if (node.data.isLoading && startTime) {
      const tick = () => setVideoElapsedMs(Date.now() - startTime);
      tick();
      const interval = window.setInterval(tick, 1000);
      return () => window.clearInterval(interval);
    }

    setVideoElapsedMs(null);
  }, [node.type, node.data.isLoading, node.data.generationStartTimeMs]);

  // Effect for calculating minimized node's preview height
  useLayoutEffect(() => {
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

    if (node.type === NodeType.StoryCharacterCreator) {
        let resizeObserver: ResizeObserver | null = null;

        const updateHeight = () => {
          const container = minimizedCharactersPreviewRef.current;
          const characterCount = node.data.characters?.length ?? 0;
          const measuredHeight = container
            ? container.scrollHeight
            : characterCount > 0
              ? characterCount * 48
              : DEFAULT_MINIMIZED_PREVIEW_HEIGHT;
          const clampedHeight = Math.max(DEFAULT_MINIMIZED_PREVIEW_HEIGHT, measuredHeight);
          if (Math.abs((node.data.minimizedHeight ?? 0) - clampedHeight) > 0.5) {
              onUpdateData(node.id, { minimizedHeight: clampedHeight });
          }
        };

        const ensureObserver = () => {
          if (resizeObserver || typeof ResizeObserver === 'undefined') return;
          const container = minimizedCharactersPreviewRef.current;
          if (!container) return;
          resizeObserver = new ResizeObserver(() => updateHeight());
          resizeObserver.observe(container);
        };

        const measure = () => {
          updateHeight();
          ensureObserver();
        };

        const rafId = window.requestAnimationFrame(measure);
        const timeoutId = window.setTimeout(measure, 0);
        ensureObserver();

        return () => {
          window.cancelAnimationFrame(rafId);
          window.clearTimeout(timeoutId);
          resizeObserver?.disconnect();
        };
    }

    if (node.type === NodeType.StoryCharacterSheet && node.data.characterSheets) {
        const sheetsWithImages = node.data.characterSheets.filter(sheet => sheet?.imageUrl).length;
        if (sheetsWithImages > 0) {
            // Calculate height: padding (8px top + 8px bottom) + slices + gaps between slices (8px each)
            const newHeight = 16 + (sheetsWithImages * SLICE_HEIGHT_PX) + ((sheetsWithImages - 1) * 8);
            if (node.data.minimizedHeight !== newHeight) {
                onUpdateData(node.id, { minimizedHeight: newHeight });
            }
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
  }, [isMinimized, hasVisuals, previewImage, previewVideo, node.type, node.data.aspectRatio, dimensions.width, node.id, onUpdateData, node.data.minimizedHeight, node.data.imageUrls, node.data.numberOfImages, node.data.characters]);

  // Effect for calculating handle positions
  useLayoutEffect(() => {
    const wasMinimized = prevIsMinimizedRef.current;
    prevIsMinimizedRef.current = isMinimized;

    if (!nodeRef.current || isMinimized) return;

    const calculateOffsets = () => {
      if (!nodeRef.current) return;
      const nodeElement = nodeRef.current;

      const nodeRect = nodeElement.getBoundingClientRect();
      let needsUpdate = false;
      const newOffsets: { [handleId: string]: number } = {};

      [...inputHandles, ...outputHandles].forEach(handle => {
        const handleElement = handleAnchorRefs.current[handle.id];
        if (!handleElement) return;

        const targetRect = handleElement.getBoundingClientRect();
        const yPosition = ((targetRect.top - nodeRect.top) + (targetRect.height / 2)) / zoom;

        newOffsets[handle.id] = yPosition;
        if (Math.abs((node.data.handleYOffsets?.[handle.id] || 0) - yPosition) > 0.5) {
          needsUpdate = true;
        }
      });

      if (needsUpdate) {
        onUpdateData(node.id, { handleYOffsets: { ...node.data.handleYOffsets, ...newOffsets } });
      }
    };

    let rafId: number | null = null;
    const scheduleMeasure = () => {
      if (rafId !== null) return;
      rafId = window.requestAnimationFrame(() => {
        rafId = null;
        calculateOffsets();
      });
    };

    let cleanupTimeout: number | null = null;
    if (wasMinimized && !isMinimized) {
      cleanupTimeout = window.setTimeout(scheduleMeasure, 320);
    } else {
      scheduleMeasure();
    }

    let resizeObserver: ResizeObserver | null = null;
    if (typeof ResizeObserver !== 'undefined') {
      resizeObserver = new ResizeObserver(scheduleMeasure);
      resizeObserver.observe(nodeRef.current);
    }

    return () => {
      if (cleanupTimeout) {
        window.clearTimeout(cleanupTimeout);
      }
      if (rafId !== null) {
        window.cancelAnimationFrame(rafId);
      }
      resizeObserver?.disconnect();
    };

  }, [node.id, node.type, onUpdateData, isMinimized, inputHandles, outputHandles, node.data.handleYOffsets, node.data.text, node.data.imageUrl, node.data.imageUrls, node.data.prompt, node.data.numberOfImages, node.data.characters, node.data.characterSheets, zoom]);

  useLayoutEffect(() => {
    if (!nodeRef.current || !isMinimized) return;

    if (node.type === NodeType.StoryCharacterCreator || node.type === NodeType.StoryCharacterSheet) {
      if (node.data.minimizedHandleYOffsets) {
        onUpdateData(node.id, { minimizedHandleYOffsets: undefined });
      }
      return;
    }

    const nodeElement = nodeRef.current;

    const calculateMinimizedOffsets = () => {
      const nodeRect = nodeElement.getBoundingClientRect();
      let needsUpdate = false;
      const newOffsets: { [handleId: string]: number } = {};

      outputHandles.forEach(handle => {
        const anchor = minimizedHandleAnchorRefs.current[handle.id];
        if (!anchor) return;

        const anchorRect = anchor.getBoundingClientRect();
        const yPosition = ((anchorRect.top - nodeRect.top) + (anchorRect.height / 2)) / zoom;

        newOffsets[handle.id] = yPosition;
        if (Math.abs((node.data.minimizedHandleYOffsets?.[handle.id] || 0) - yPosition) > 0.5) {
          needsUpdate = true;
        }
      });

      if (needsUpdate) {
        onUpdateData(node.id, {
          minimizedHandleYOffsets: {
            ...node.data.minimizedHandleYOffsets,
            ...newOffsets,
          },
        });
      }
    };

    let rafId: number | null = null;
    const scheduleMeasure = () => {
      if (rafId !== null) return;
      rafId = window.requestAnimationFrame(() => {
        rafId = null;
        calculateMinimizedOffsets();
      });
    };

    scheduleMeasure();

    let resizeObserver: ResizeObserver | null = null;
    if (typeof ResizeObserver !== 'undefined') {
      resizeObserver = new ResizeObserver(scheduleMeasure);
      resizeObserver.observe(nodeElement);
    }

    return () => {
      if (rafId !== null) {
        window.cancelAnimationFrame(rafId);
      }
      resizeObserver?.disconnect();
    };

  }, [isMinimized, node.id, node.type, node.data.characters, node.data.characterSheets, node.data.minimizedHandleYOffsets, outputHandles, onUpdateData, zoom]);
  
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
            top: isMinimized
              ? (node.data.minimizedHandleYOffsets?.[handle.id] ?? getMinimizedHandleY(node, handle.id, side))
              : (node.data.handleYOffsets?.[handle.id] ?? '50%'),
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
      className={`absolute ${styles.node.bg} border ${(contextMenuPosition || isSelected) ? `${styles.node.focusBorder} ${styles.node.focusRing}` : styles.node.border} rounded-lg flex flex-col`}
      style={{
        left: node.position.x,
        top: node.position.y,
        width: `${dimensions.width}px`,
        height: dimensions.height && !isMinimized ? `${dimensions.height}px` : undefined,
      }}
      onClick={(e) => {
        // Only trigger selection if clicking on node body (not interactive elements)
        const target = e.target as HTMLElement;
        const isInteractive = target.tagName === 'INPUT' || target.tagName === 'TEXTAREA' ||
                              target.tagName === 'BUTTON' || target.tagName === 'SELECT' ||
                              target.closest('button') || target.closest('textarea') ||
                              target.closest('input') || target.closest('select');
        if (!isInteractive) {
          onNodeClick(node.id, e);
        }
      }}
    >
      {renderHandles(inputHandles, 'input')}
      {renderHandles(outputHandles, 'output')}
      
      {node.type === NodeType.Text && (
        <>
            <NodeHeader
                title='Text Node'
                icon={<FileText className="w-4 h-4 text-yellow-400" />}
                isMinimized={isMinimized}
                onToggleMinimize={() => onToggleMinimize(node.id)}
                onDelete={handleDelete}
                onShowDeleteConfirmation={handleShowDeleteConfirmation}
                onMouseDown={handleHeaderMouseDown}
                onContextMenu={handleHeaderContextMenu}
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
                icon={<PenTool className="w-4 h-4 text-indigo-400" />}
                isMinimized={isMinimized}
                onToggleMinimize={() => onToggleMinimize(node.id)}
                onDelete={handleDelete}
                onShowDeleteConfirmation={handleShowDeleteConfirmation}
                onMouseDown={handleHeaderMouseDown}
                onContextMenu={handleHeaderContextMenu}
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
                          : <ExpandableTextArea
                                value={node.data.text || ''}
                                placeholder="Output will appear here..."
                                className={`w-full h-full p-1 bg-transparent border-0 focus:outline-none focus:ring-0 resize-none custom-scrollbar`}
                                title="Generated Text"
                                containerClassName="w-full h-full"
                                onOpenModal={onOpenTextModal}
                            />
                          }
                        </div>
                    </div>
                    <button onClick={() => onGenerateText(node.id)} disabled={node.data.isLoading} className={`w-full flex items-center justify-center p-2 ${node.data.isLoading ? 'bg-gray-600' : 'bg-indigo-600 hover:bg-indigo-500'} text-white font-bold rounded-md transition-colors text-sm disabled:cursor-not-allowed`} >
                      <Sparkles className={`w-4 h-4 mr-2 ${node.data.isLoading ? 'animate-pulse' : ''}`} />
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

      {node.type === NodeType.StoryCharacterCreator && (
        <>
          <NodeHeader
            title='Character Extractor'
            icon={<UserCog className="w-4 h-4 text-teal-400" />}
            isMinimized={isMinimized}
            onToggleMinimize={() => onToggleMinimize(node.id)}
            onDelete={handleDelete}
            onShowDeleteConfirmation={handleShowDeleteConfirmation}
            onMouseDown={handleHeaderMouseDown}
            onContextMenu={handleHeaderContextMenu}
          />
          <div className={`transition-all duration-300 ease-in-out overflow-hidden ${isMinimized ? 'max-h-0 opacity-0' : 'max-h-[1200px] opacity-100'}`}>
            <div className="p-2 space-y-3">
              <div ref={el => handleAnchorRefs.current['prompt_input'] = el}>
                <label htmlFor={`story-prompt-${node.id}`} className={labelClassName}>Story Prompt</label>
                <textarea
                  id={`story-prompt-${node.id}`}
                  value={node.data.storyPrompt || ''}
                  onChange={(e) => onUpdateData(node.id, { storyPrompt: e.target.value })}
                  onKeyDown={(e) => handleTextAreaKeyDown(e, NodeType.StoryCharacterCreator)}
                  onMouseDown={(e) => e.stopPropagation()}
                  className={`${textAreaClassName(connections.some(c => c.toNodeId === node.id && c.toHandleId === 'prompt_input'))} h-28`}
                  disabled={connections.some(c => c.toNodeId === node.id && c.toHandleId === 'prompt_input')}
                  placeholder="Describe the story beats, characters, or setting..."
                />
              </div>

              <div>
                <label className={labelClassName}>Generated Characters</label>
                <div className="space-y-3">
                  {node.data.isLoading ? (
                    <div className="flex items-center justify-center py-6 border rounded-md border-dashed border-teal-400/60">
                      <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-teal-400"></div>
                    </div>
                  ) : node.data.error ? (
                    <div className="text-red-400 text-xs text-center px-2 py-4 border rounded-md border-red-500/40" role="alert">
                      {node.data.error}
                    </div>
                  ) : node.data.characters && node.data.characters.length > 0 ? (
                    node.data.characters.map((character, index) => (
                      <div
                        key={index}
                        ref={el => handleAnchorRefs.current[`character_output_${index + 1}`] = el}
                        className={`rounded-md border ${styles.node.border} ${styles.node.inputBg} p-2 flex flex-col`}
                        style={{ height: `${CHARACTER_BLOCK_HEIGHT_PX}px` }}
                        onMouseDown={(e) => e.stopPropagation()}
                      >
                        <p className="text-sm font-semibold mb-1 truncate" title={character.name}>{character.name || `Character ${index + 1}`}</p>
                        <div
                          className="flex-1 overflow-y-auto text-xs leading-relaxed opacity-80 whitespace-pre-wrap pr-1 custom-scrollbar"
                          onWheel={(e) => {
                            if (e.currentTarget.scrollHeight > e.currentTarget.clientHeight) {
                              e.stopPropagation();
                            }
                          }}
                        >
                          {character.description}
                        </div>
                      </div>
                    ))
                  ) : (
                    <div className="text-xs text-center italic opacity-70 py-6 border rounded-md border-dashed">
                      Character names and descriptions will appear here.
                    </div>
                  )}
                </div>
              </div>

              <button
                onClick={() => onGenerateCharacters(node.id)}
                disabled={node.data.isLoading}
                className={`w-full flex items-center justify-center p-2 ${node.data.isLoading ? 'bg-gray-600' : 'bg-teal-600 hover:bg-teal-500'} text-white font-bold rounded-md transition-colors text-sm disabled:cursor-not-allowed`}
              >
                <Sparkles className={`w-4 h-4 mr-2 ${node.data.isLoading ? 'animate-pulse' : ''}`} />
                {node.data.isLoading ? 'Extracting Characters...' : 'Generate Characters'}
              </button>
            </div>
          </div>
          {isMinimized && (
            <div
              ref={minimizedCharactersPreviewRef}
              className={`w-full ${styles.node.imagePlaceholderBg} rounded-b-md border-t ${styles.node.imagePlaceholderBorder} transition-all duration-300 ease-in-out overflow-hidden p-2`}
              style={{
                height: node.data.minimizedHeight
                  ? `${Math.max(node.data.minimizedHeight, DEFAULT_MINIMIZED_PREVIEW_HEIGHT)}px`
                  : `${DEFAULT_MINIMIZED_PREVIEW_HEIGHT}px`,
              }}
            >
              {node.data.characters && node.data.characters.length > 0 ? (
                <div className="text-xs space-y-1">
                  {node.data.characters.map((character, index) => (
                    <div
                      key={index}
                      ref={el => { minimizedHandleAnchorRefs.current[`character_output_${index + 1}`] = el; }}
                      className="truncate"
                      title={`${character.name || `Character ${index + 1}`}: ${character.description}`}
                    >
                      <span className="font-semibold">{character.name || `Character ${index + 1}`}:</span> {character.description}
                    </div>
                  ))}
                </div>
              ) : (
                <div className="h-full flex items-center justify-center text-xs italic opacity-70">
                  No characters generated yet.
                </div>
              )}
            </div>
          )}
        </>
      )}

      {node.type === NodeType.StoryCharacterSheet && (
        <>
          <NodeHeader
            title='Character Sheets'
            icon={<Sparkles className="w-4 h-4 text-emerald-300" />}
            isMinimized={isMinimized}
            onToggleMinimize={() => onToggleMinimize(node.id)}
            onDelete={handleDelete}
            onShowDeleteConfirmation={handleShowDeleteConfirmation}
            onMouseDown={handleHeaderMouseDown}
            onContextMenu={handleHeaderContextMenu}
          />
          <div className={`transition-all duration-300 ease-in-out overflow-hidden ${isMinimized ? 'max-h-0 opacity-0' : 'max-h-[1600px] opacity-100'}`}>
            <div className="p-2 space-y-3">
              <div ref={el => handleAnchorRefs.current['prompt_input'] = el}>
                <label htmlFor={`story-prompt-${node.id}`} className={labelClassName}>Story Prompt</label>
                <textarea
                  id={`story-prompt-${node.id}`}
                  value={node.data.storyPrompt || ''}
                  onChange={(e) => onUpdateData(node.id, { storyPrompt: e.target.value })}
                  onKeyDown={(e) => handleTextAreaKeyDown(e, NodeType.StoryCharacterSheet)}
                  onMouseDown={(e) => e.stopPropagation()}
                  className={`${textAreaClassName(connections.some(c => c.toNodeId === node.id && c.toHandleId === 'prompt_input'))} h-28`}
                  disabled={connections.some(c => c.toNodeId === node.id && c.toHandleId === 'prompt_input')}
                  placeholder="Paste your story here to build instant character sheets..."
                />
              </div>

              <div>
                <label className={labelClassName}>Character Sheets</label>
                <div className="space-y-3">
                  {node.data.error ? (
                    <div className="text-red-400 text-xs text-center px-2 py-4 border rounded-md border-red-500/40" role="alert">
                      {node.data.error}
                    </div>
                  ) : node.data.characterSheets && node.data.characterSheets.length > 0 ? (
                    node.data.characterSheets.map((sheet, index) => {
                      const hasImage = !!sheet.imageUrl;
                      return (
                        <div
                          key={index}
                          ref={el => {
                            handleAnchorRefs.current[`character_sheet_output_${index + 1}`] = hasImage ? el : null;
                          }}
                          className={`rounded-md border ${styles.node.border} ${styles.node.inputBg} p-2 flex flex-col`}
                          onMouseDown={(e) => e.stopPropagation()}
                        >
                          <div className="flex items-center justify-between">
                            <p className="text-sm font-semibold truncate" title={sheet.name || `Character ${index + 1}`}>
                              {sheet.name || `Character ${index + 1}`}
                            </p>
                            {node.data.isLoading && !hasImage && (
                              <span className="text-[10px] uppercase tracking-wide opacity-60">Generating…</span>
                            )}
                          </div>
                          <div className={`${imagePreviewBaseClassName} h-48 mt-2`}>
                            {hasImage ? (
                              <img
                                src={sheet.imageUrl!}
                                alt={`${sheet.name || `Character ${index + 1}`} character sheet`}
                                className="w-full h-full object-contain rounded-md cursor-zoom-in"
                                onClick={() => onImageClick(sheet.imageUrl!)}
                              />
                            ) : (
                              <div className="flex flex-col items-center justify-center text-xs opacity-70">
                                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-emerald-300 mb-2"></div>
                                <span>Creating sheet…</span>
                              </div>
                            )}
                          </div>
                        </div>
                      );
                    })
                  ) : node.data.isLoading ? (
                    <div className="flex items-center justify-center py-6 border rounded-md border-dashed border-emerald-300/60">
                      <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-emerald-300"></div>
                    </div>
                  ) : (
                    <div className="text-xs text-center italic opacity-70 py-6 border rounded-md border-dashed">
                      Character sheets will appear here after generation.
                    </div>
                  )}
                </div>
              </div>

              <button
                onClick={() => onGenerateCharacterSheets(node.id)}
                disabled={node.data.isLoading}
                className={`w-full flex items-center justify-center p-2 ${node.data.isLoading ? 'bg-gray-600' : 'bg-emerald-600 hover:bg-emerald-500'} text-white font-bold rounded-md transition-colors text-sm disabled:cursor-not-allowed`}
              >
                <Sparkles className={`w-4 h-4 mr-2 ${node.data.isLoading ? 'animate-pulse' : ''}`} />
                {node.data.isLoading ? 'Building Sheets…' : 'Generate Character Sheets'}
              </button>
            </div>
          </div>
          {isMinimized && (
            node.data.characterSheets && node.data.characterSheets.filter(sheet => sheet.imageUrl).length > 0 ? (
              <div
                className={`w-full ${styles.node.imagePlaceholderBg} rounded-b-md border-t ${styles.node.imagePlaceholderBorder} transition-all duration-300 ease-in-out overflow-hidden p-2 space-y-2`}
                style={{ height: node.data.minimizedHeight ? `${node.data.minimizedHeight}px` : 'auto' }}
              >
                {node.data.characterSheets
                  .filter(sheet => sheet.imageUrl)
                  .map((sheet, filteredIndex) => {
                    const originalIndex = node.data.characterSheets!.findIndex(s => s === sheet);
                    return (
                      <div
                        key={originalIndex}
                        ref={el => {
                          minimizedHandleAnchorRefs.current[`character_sheet_output_${originalIndex + 1}`] = el;
                        }}
                        className="w-full rounded-md overflow-hidden"
                        style={{ height: `${SLICE_HEIGHT_PX}px` }}
                      >
                        <img
                          src={sheet.imageUrl!}
                          alt={`Preview of ${sheet.name || `Character ${originalIndex + 1}`} sheet`}
                          className="w-full h-full object-contain cursor-zoom-in"
                          onClick={() => onImageClick(sheet.imageUrl!)}
                        />
                      </div>
                    );
                  })}
              </div>
            ) : (
              <div
                className={`w-full ${styles.node.imagePlaceholderBg} rounded-b-md flex items-center justify-center border-t ${styles.node.imagePlaceholderBorder} transition-all duration-300 ease-in-out overflow-hidden`}
                style={{ height: node.data.minimizedHeight ? `${node.data.minimizedHeight}px` : '64px' }}
              >
                <div className="text-xs italic opacity-70 text-center px-2">
                  {node.data.isLoading ? 'Generating character sheets…' : 'No character sheets yet.'}
                </div>
              </div>
            )
          )}
        </>
      )}

      {node.type === NodeType.StoryExpander && (
        <>
          <NodeHeader
            title='Story Expander'
            icon={<ScrollText className="w-4 h-4 text-purple-400" />}
            isMinimized={isMinimized}
            onToggleMinimize={() => onToggleMinimize(node.id)}
            onDelete={handleDelete}
            onShowDeleteConfirmation={handleShowDeleteConfirmation}
            onMouseDown={handleHeaderMouseDown}
            onContextMenu={handleHeaderContextMenu}
          />
          <div className={`transition-all duration-300 ease-in-out overflow-hidden ${isMinimized ? 'max-h-0 opacity-0' : 'max-h-[1200px] opacity-100'}`}>
            <div className="p-2 space-y-3">
              <div ref={el => handleAnchorRefs.current['premise_input'] = el}>
                <label htmlFor={`premise-${node.id}`} className={labelClassName}>Story Premise</label>
                <textarea
                  id={`premise-${node.id}`}
                  value={node.data.premise || ''}
                  onChange={(e) => onUpdateData(node.id, { premise: e.target.value })}
                  onKeyDown={(e) => handleTextAreaKeyDown(e, NodeType.StoryExpander)}
                  onMouseDown={(e) => e.stopPropagation()}
                  className={`${textAreaClassName(connections.some(c => c.toNodeId === node.id && c.toHandleId === 'premise_input'))} h-20`}
                  disabled={connections.some(c => c.toNodeId === node.id && c.toHandleId === 'premise_input')}
                  placeholder="e.g., A detective finds a mysterious key"
                />
              </div>

              <div className='flex space-x-2'>
                <div className='flex-1'>
                  <label htmlFor={`length-${node.id}`} className={labelClassName}>Length</label>
                  <select
                    id={`length-${node.id}`}
                    className={selectClassName}
                    value={node.data.length || 'short'}
                    onChange={(e) => onUpdateData(node.id, { length: e.target.value as 'short' | 'medium' })}
                    onMouseDown={(e) => e.stopPropagation()}
                  >
                    <option value="short">Short (400-600 words)</option>
                    <option value="medium">Medium (800-1200 words)</option>
                  </select>
                </div>
                <div className='flex-1'>
                  <label htmlFor={`genre-${node.id}`} className={labelClassName}>Genre</label>
                  <select
                    id={`genre-${node.id}`}
                    className={selectClassName}
                    value={node.data.genre || 'any'}
                    onChange={(e) => onUpdateData(node.id, { genre: e.target.value })}
                    onMouseDown={(e) => e.stopPropagation()}
                  >
                    <option value="any">Any Genre</option>
                    <option value="sci-fi">Sci-Fi</option>
                    <option value="fantasy">Fantasy</option>
                    <option value="mystery">Mystery</option>
                    <option value="thriller">Thriller</option>
                    <option value="romance">Romance</option>
                    <option value="horror">Horror</option>
                    <option value="drama">Drama</option>
                  </select>
                </div>
              </div>

              <div ref={el => handleAnchorRefs.current['story_output'] = el}>
                <label className={labelClassName}>Generated Story</label>
                <div className={`${imagePreviewBaseClassName} h-64 items-start`}>
                  {node.data.isLoading ? (
                    <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-purple-400 mt-28"></div>
                  ) : node.data.error ? (
                    <div className="text-red-400 text-xs p-2 text-center">{node.data.error}</div>
                  ) : (
                    <ExpandableTextArea
                      value={node.data.text || ''}
                      placeholder="Your expanded story will appear here..."
                      className={`w-full h-full p-2 bg-transparent border-0 focus:outline-none focus:ring-0 resize-none custom-scrollbar text-xs leading-relaxed`}
                      title="Generated Story"
                      containerClassName="w-full h-full"
                      onOpenModal={onOpenTextModal}
                    />
                  )}
                </div>
              </div>

              <button
                onClick={() => onExpandStory(node.id)}
                disabled={node.data.isLoading}
                className={`w-full flex items-center justify-center p-2 ${node.data.isLoading ? 'bg-gray-600' : 'bg-purple-600 hover:bg-purple-500'} text-white font-bold rounded-md transition-colors text-sm disabled:cursor-not-allowed`}
              >
                <Sparkles className={`w-4 h-4 mr-2 ${node.data.isLoading ? 'animate-pulse' : ''}`} />
                {node.data.isLoading ? 'Expanding Story...' : 'Expand Story'}
              </button>
            </div>
          </div>

          {isMinimized && (
            <div className={`p-2 h-16 text-xs italic ${styles.node.labelText} truncate rounded-b-md flex items-center border-t ${styles.node.border}`}>
              {node.data.text || "No expanded story."}
            </div>
          )}
        </>
      )}

      {node.type === NodeType.ShortStoryWriter && (
        <>
          <NodeHeader
            title='Short Story Writer'
            icon={<PenTool className="w-4 h-4 text-yellow-300" />}
            isMinimized={isMinimized}
            onToggleMinimize={() => onToggleMinimize(node.id)}
            onDelete={handleDelete}
            onShowDeleteConfirmation={handleShowDeleteConfirmation}
            onMouseDown={handleHeaderMouseDown}
            onContextMenu={handleHeaderContextMenu}
          />
          <div className={`transition-all duration-300 ease-in-out overflow-hidden ${isMinimized ? 'max-h-0 opacity-0' : 'max-h-[1000px] opacity-100'}`}>
            <div className="p-2 space-y-2">
              <div ref={el => handleAnchorRefs.current['premise_input'] = el}>
                <label htmlFor={`premise-${node.id}`} className={labelClassName}>Story Premise</label>
                <textarea
                  id={`premise-${node.id}`}
                  value={node.data.storyPremise || ''}
                  onChange={(e) => onUpdateData(node.id, { storyPremise: e.target.value })}
                  onKeyDown={(e) => handleTextAreaKeyDown(e, NodeType.ShortStoryWriter)}
                  onMouseDown={(e) => e.stopPropagation()}
                  className={`${textAreaClassName(connections.some(c => c.toNodeId === node.id && c.toHandleId === 'premise_input'))} h-24`}
                  disabled={connections.some(c => c.toNodeId === node.id && c.toHandleId === 'premise_input')}
                  placeholder="A lonely lighthouse keeper finds a mysterious creature washed ashore..."
                />
              </div>

              <div>
                <label htmlFor={`pov-${node.id}`} className={labelClassName}>Point of View</label>
                <select
                  id={`pov-${node.id}`}
                  value={node.data.pointOfView || 'Third-person limited'}
                  onChange={(e) => onUpdateData(node.id, { pointOfView: e.target.value })}
                  onMouseDown={(e) => e.stopPropagation()}
                  className={selectClassName}
                >
                  <option>Third-person limited</option>
                  <option>First-person</option>
                  <option>Third-person omniscient</option>
                </select>
              </div>

              <div ref={el => handleAnchorRefs.current['story_output'] = el}>
                <label className={labelClassName}>Full Story</label>
                <div className={`${imagePreviewBaseClassName} h-40 items-start`}>
                  {node.data.isLoading ? <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-yellow-300 mt-16"></div>
                    : node.data.error ? <div className="text-red-400 text-xs p-2 text-center">{node.data.error}</div>
                      : <textarea
                        readOnly
                        value={node.data.fullStory || ''}
                        className={`w-full h-full p-1 bg-transparent border-0 focus:outline-none focus:ring-0 resize-none custom-scrollbar`}
                        placeholder="Expanded story will appear here..."
                      />
                  }
                </div>
              </div>
              <button onClick={() => onGenerateShortStory(node.id)} disabled={node.data.isLoading} className={`w-full flex items-center justify-center p-2 ${node.data.isLoading ? 'bg-gray-600' : 'bg-yellow-600 hover:bg-yellow-500'} text-white font-bold rounded-md transition-colors text-sm disabled:cursor-not-allowed`} >
                <Sparkles className={`w-4 h-4 mr-2 ${node.data.isLoading ? 'animate-pulse' : ''}`} />
                {node.data.isLoading ? 'Generating...' : 'Generate Story'}
              </button>
            </div>
          </div>

          {isMinimized && (
            <div className={`p-2 h-16 text-xs italic ${styles.node.labelText} truncate rounded-b-md flex items-center border-t ${styles.node.border}`}>
              {node.data.fullStory || "No story generated."}
            </div>
          )}
        </>
      )}

      {node.type === NodeType.ScreenplayWriter && (
        <>
          <NodeHeader
            title='Screenplay Writer'
            icon={<Clapperboard className="w-4 h-4 text-purple-400" />}
            isMinimized={isMinimized}
            onToggleMinimize={() => onToggleMinimize(node.id)}
            onDelete={handleDelete}
            onShowDeleteConfirmation={handleShowDeleteConfirmation}
            onMouseDown={handleHeaderMouseDown}
            onContextMenu={handleHeaderContextMenu}
          />
          <div className={`transition-all duration-300 ease-in-out overflow-hidden ${isMinimized ? 'max-h-0 opacity-0' : 'max-h-[1000px] opacity-100'}`}>
            <div className="p-2 space-y-2">
              <div>
                <label htmlFor={`screenplay-mode-${node.id}`} className={labelClassName}>Mode</label>
                <select
                  id={`screenplay-mode-${node.id}`}
                  className={selectClassName}
                  value={node.data.screenplayMode || 'default'}
                  onChange={(e) => onUpdateData(node.id, { screenplayMode: e.target.value as 'default' | 'qt' })}
                  onMouseDown={(e) => e.stopPropagation()}
                >
                  <option value="default">Default</option>
                  <option value="qt">QT Mode (Tarantino)</option>
                </select>
              </div>

              <div ref={el => handleAnchorRefs.current['prompt_input'] = el}>
                <label htmlFor={`screenplay-prompt-${node.id}`} className={labelClassName}>Story Prompt</label>
                <textarea
                  id={`screenplay-prompt-${node.id}`}
                  value={node.data.storyPrompt || ''}
                  onChange={(e) => onUpdateData(node.id, { storyPrompt: e.target.value })}
                  onKeyDown={(e) => handleTextAreaKeyDown(e, NodeType.ScreenplayWriter)}
                  onMouseDown={(e) => e.stopPropagation()}
                  className={`${textAreaClassName(connections.some(c => c.toNodeId === node.id && c.toHandleId === 'prompt_input'))} h-24`}
                  disabled={connections.some(c => c.toNodeId === node.id && c.toHandleId === 'prompt_input')}
                  placeholder="e.g., A detective finds a hidden library beneath the city..."
                />
              </div>

              {node.data.isLoading ? (
                <div className={`${imagePreviewBaseClassName} h-48 flex items-center justify-center`}>
                  <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-purple-400"></div>
                </div>
              ) : node.data.error ? (
                <div className={`${textAreaClassName(true)} p-2 text-red-400 text-xs text-center`}>{node.data.error}</div>
              ) : (
                <>
                  <div ref={el => handleAnchorRefs.current['pitch_output'] = el}>
                    <label className={labelClassName}>Director's Pitch</label>
                    <div className={`${textAreaClassName(true)} min-h-[5rem] max-h-40 custom-scrollbar overflow-y-auto`}>
                      <p className="text-xs break-words whitespace-pre-wrap">
                        {node.data.pitch || 'Pitch will appear here...'}
                      </p>
                    </div>
                  </div>

                  <div ref={el => handleAnchorRefs.current['screenplay_output'] = el}>
                    <label className={labelClassName}>Screenplay Scene</label>
                    <textarea
                      readOnly
                      value={node.data.screenplayText || 'Screenplay will appear here...'}
                      className={`${textAreaClassName(true)} h-64 custom-scrollbar text-xs font-mono`}
                    />
                  </div>
                </>
              )}

              <button
                onClick={() => onGenerateScreenplay(node.id)}
                disabled={node.data.isLoading}
                className={`w-full flex items-center justify-center p-2 ${node.data.isLoading ? 'bg-gray-600' : 'bg-purple-600 hover:bg-purple-500'} text-white font-bold rounded-md transition-colors text-sm disabled:cursor-not-allowed`}
              >
                <Sparkles className={`w-4 h-4 mr-2 ${node.data.isLoading ? 'animate-pulse' : ''}`} />
                {node.data.isLoading ? 'Generating...' : 'Generate Screenplay'}
              </button>
            </div>
          </div>

          {isMinimized && (
            <div className={`p-2 h-16 text-xs italic ${styles.node.labelText} truncate rounded-b-md flex items-center border-t ${styles.node.border}`}>
              {node.data.pitch ? 'Pitch & screenplay generated.' : 'No screenplay generated.'}
            </div>
          )}
        </>
      )}

      {node.type === NodeType.Image && (
        <>
            <NodeHeader
                title='Image Node'
                icon={<ImagePlus className="w-4 h-4 text-orange-400" />}
                isMinimized={isMinimized}
                onToggleMinimize={() => onToggleMinimize(node.id)}
                onDelete={handleDelete}
                onShowDeleteConfirmation={handleShowDeleteConfirmation}
                onMouseDown={handleHeaderMouseDown}
                onContextMenu={handleHeaderContextMenu}
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
                                    <Upload className={`w-8 h-8 ${styles.node.imagePlaceholderIcon} mx-auto mb-1`} />
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
                      : <Image className={`w-8 h-8 ${styles.node.imagePlaceholderIcon}`} />
                  }
              </div>
            )}
        </>
      )}
      
      {node.type === NodeType.ImageGenerator && (
        <>
          <NodeHeader
            title='Image Generator'
            icon={<Wand2 className="w-4 h-4 text-blue-400" />}
            isMinimized={isMinimized}
            onToggleMinimize={() => onToggleMinimize(node.id)}
            onDelete={handleDelete}
            onShowDeleteConfirmation={handleShowDeleteConfirmation}
            onMouseDown={handleHeaderMouseDown}
            onContextMenu={handleHeaderContextMenu}
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
                                            <Image className={`w-8 h-8 ${styles.node.imagePlaceholderIcon}`} />
                                        </div>
                                    )}
                                </div>
                            );
                        })
                    )}
                </div>
              </div>

              <button onClick={() => onGenerateImages(node.id)} disabled={node.data.isLoading} className={`w-full flex items-center justify-center p-2 ${node.data.isLoading ? 'bg-gray-600' : 'bg-blue-600 hover:bg-blue-500'} text-white font-bold rounded-md transition-colors text-sm disabled:cursor-not-allowed`} >
                <Sparkles className={`w-4 h-4 mr-2 ${node.data.isLoading ? 'animate-pulse' : ''}`} />
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
                        {previewImage ? <img key={previewImage} ref={minimizedImageRef} src={previewImage} alt="Preview" className="w-full h-full object-contain" /> : <Image className={`w-8 h-8 ${styles.node.imagePlaceholderIcon}`} />}
                    </div>
                )
            )}
        </>
      )}

      {node.type === NodeType.CharacterGenerator && (
        <>
          <NodeHeader
            title='Character Viz'
            icon={<UsersIcon className="w-4 h-4 text-cyan-400" />}
            isMinimized={isMinimized}
            onToggleMinimize={() => onToggleMinimize(node.id)}
            onDelete={handleDelete}
            onShowDeleteConfirmation={handleShowDeleteConfirmation}
            onMouseDown={handleHeaderMouseDown}
            onContextMenu={handleHeaderContextMenu}
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
                  : <Image className={`w-8 h-8 ${styles.node.imagePlaceholderIcon}`} />}
                </div>
              </div>
              <button onClick={() => onGenerateCharacterImage(node.id)} disabled={node.data.isLoading} className={`w-full flex items-center justify-center p-2 ${node.data.isLoading ? 'bg-gray-600' : 'bg-cyan-600 hover:bg-cyan-500'} text-white font-bold rounded-md transition-colors text-sm disabled:cursor-not-allowed`} >
                <Sparkles className={`w-4 h-4 mr-2 ${node.data.isLoading ? 'animate-pulse' : ''}`} />
                {node.data.isLoading ? 'Generating...' : 'Generate Image'}
              </button>
            </div>
          </div>
          {isMinimized && ( <div className={`w-full ${styles.node.imagePlaceholderBg} rounded-b-md flex items-center justify-center border-t ${styles.node.imagePlaceholderBorder} transition-all duration-300 ease-in-out overflow-hidden`} style={{ height: node.data.minimizedHeight ? `${node.data.minimizedHeight}px` : '64px' }} >
              {hasVisuals ? <img key={previewImage} ref={minimizedImageRef} src={previewImage!} alt="Preview" className="w-full h-full object-contain" /> : <Image className={`w-8 h-8 ${styles.node.imagePlaceholderIcon}`} />}
          </div> )}
        </>
      )}
      
      {node.type === NodeType.ImageEditor && (
        <>
            <NodeHeader
                title='Image Editor'
                icon={<Edit3 className="w-4 h-4 text-purple-400" />}
                isMinimized={isMinimized}
                onToggleMinimize={() => onToggleMinimize(node.id)}
                onDelete={handleDelete}
                onShowDeleteConfirmation={handleShowDeleteConfirmation}
                onMouseDown={handleHeaderMouseDown}
                onContextMenu={handleHeaderContextMenu}
            />
            <div className={`transition-all duration-300 ease-in-out overflow-hidden ${isMinimized ? 'max-h-0 opacity-0' : 'max-h-[1000px] opacity-100'}`}>
              <div className="p-2 space-y-2">
                <div ref={el => handleAnchorRefs.current['image_input'] = el}>
                    <label className={labelClassName}>Input Image</label>
                    <div className={`${imagePreviewBaseClassName} h-32`}>
                        {node.data.inputImageUrl ? <img src={node.data.inputImageUrl} alt="Input for editing" className="w-full h-full object-cover rounded-md" /> : <Image className={`w-8 h-8 ${styles.node.imagePlaceholderIcon}`} />}
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
                        : <Image className={`w-8 h-8 ${styles.node.imagePlaceholderIcon}`} />}
                    </div>
                </div>
                <button onClick={() => onEditImage(node.id)} disabled={node.data.isLoading} className={`w-full flex items-center justify-center p-2 ${node.data.isLoading ? 'bg-gray-600' : 'bg-purple-600 hover:bg-purple-500'} text-white font-bold rounded-md transition-colors text-sm disabled:cursor-not-allowed`} >
                    <Sparkles className={`w-4 h-4 mr-2 ${node.data.isLoading ? 'animate-pulse' : ''}`} />
                    {node.data.isLoading ? 'Editing...' : 'Edit Image'}
                </button>
              </div>
            </div>
            {isMinimized && ( <div className={`w-full ${styles.node.imagePlaceholderBg} rounded-b-md flex items-center justify-center border-t ${styles.node.imagePlaceholderBorder} transition-all duration-300 ease-in-out overflow-hidden`} style={{ height: node.data.minimizedHeight ? `${node.data.minimizedHeight}px` : '64px' }} >
                {hasVisuals ? <img key={previewImage} ref={minimizedImageRef} src={previewImage!} alt="Preview" className="w-full h-full object-contain" /> : <Image className={`w-8 h-8 ${styles.node.imagePlaceholderIcon}`} /> }
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
            } else if (sourceNode.type === NodeType.StoryCharacterSheet && sourceNode.data.characterSheets) {
              const match = conn.fromHandleId.match(/character_sheet_output_(\d+)$/);
              if (match) {
                const sheetIndex = parseInt(match[1], 10) - 1;
                const sheet = sourceNode.data.characterSheets[sheetIndex];
                return sheet?.imageUrl ? [sheet.imageUrl] : [];
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
                icon={<Layers className="w-4 h-4 text-pink-400" />}
                isMinimized={isMinimized}
                onToggleMinimize={() => onToggleMinimize(node.id)}
                onDelete={handleDelete}
                onShowDeleteConfirmation={handleShowDeleteConfirmation}
                onMouseDown={handleHeaderMouseDown}
                onContextMenu={handleHeaderContextMenu}
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
                        <Image className={`w-8 h-8 ${styles.node.imagePlaceholderIcon}`} />
                      )}
                    </div>
                  </div>
                  <div>
                    <label htmlFor={`mixer-aspect-${node.id}`} className={labelClassName}>Aspect Ratio</label>
                    <select id={`mixer-aspect-${node.id}`} className={selectClassName} value={node.data.aspectRatio || '1:1'} onChange={(e) => onUpdateData(node.id, { aspectRatio: e.target.value })} onMouseDown={(e) => e.stopPropagation()} >
                      <option value="1:1">1:1 (Square)</option>
                      <option value="16:9">16:9 (Widescreen)</option>
                      <option value="9:16">9:16 (Portrait)</option>
                      <option value="4:3">4:3 (Standard)</option>
                      <option value="3:4">3:4 (Standard Portrait)</option>
                      <option value="2:3">2:3 (Portrait)</option>
                      <option value="3:2">3:2 (Landscape)</option>
                      <option value="4:5">4:5 (Portrait)</option>
                      <option value="5:4">5:4 (Landscape)</option>
                      <option value="21:9">21:9 (Ultrawide)</option>
                    </select>
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
                      : <Image className={`w-8 h-8 ${styles.node.imagePlaceholderIcon}`} />}
                    </div>
                  </div>
                  <button onClick={() => onMixImages(node.id)} disabled={node.data.isLoading} className={`w-full flex items-center justify-center p-2 ${node.data.isLoading ? 'bg-gray-600' : 'bg-pink-600 hover:bg-pink-500'} text-white font-bold rounded-md transition-colors text-sm disabled:cursor-not-allowed`} >
                    <Sparkles className={`w-4 h-4 mr-2 ${node.data.isLoading ? 'animate-pulse' : ''}`} />
                    {node.data.isLoading ? 'Mixing...' : 'Mix Images'}
                  </button>
                </div>
              </div>
              {isMinimized && (
                <div className={`w-full ${styles.node.imagePlaceholderBg} rounded-b-md flex items-center justify-center border-t ${styles.node.imagePlaceholderBorder} transition-all duration-300 ease-in-out overflow-hidden`} style={{ height: node.data.minimizedHeight ? `${node.data.minimizedHeight}px` : '64px' }}>
                  {mixerHasVisuals ? <img key={mixerPreviewImage} ref={minimizedImageRef} src={mixerPreviewImage!} alt="Preview" className="w-full h-full object-contain" /> : <Shuffle className={`w-8 h-8 ${styles.node.imagePlaceholderIcon}`} />}
                </div>
              )}
            </>
          )
      })()}

      {node.type === NodeType.VideoGenerator && (
        <>
            <NodeHeader
                title='Video Generator'
                icon={<Clapperboard className="w-4 h-4 text-green-400" />}
                isMinimized={isMinimized}
                onToggleMinimize={() => onToggleMinimize(node.id)}
                onDelete={handleDelete}
                onShowDeleteConfirmation={handleShowDeleteConfirmation}
                onMouseDown={handleHeaderMouseDown}
                onContextMenu={handleHeaderContextMenu}
            />
            <div className={`transition-all duration-300 ease-in-out overflow-hidden ${isMinimized ? 'max-h-0 opacity-0' : 'max-h-[1000px] opacity-100'}`}>
              <div className="p-2 space-y-2">
                <div ref={el => handleAnchorRefs.current['image_input'] = el}>
                    <label className={labelClassName}>Input Image (Optional)</label>
                    <div className={`${imagePreviewBaseClassName} h-24`}>
                        {node.data.inputImageUrl ? <img src={node.data.inputImageUrl} alt="Input for video" className="w-full h-full object-cover rounded-md" /> : <Image className={`w-8 h-8 ${styles.node.imagePlaceholderIcon}`} />}
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
                                <p className="text-xs mt-1 text-gray-300">Elapsed: {formatDuration(videoElapsedMs)}</p>
                            </div>
                        )
                        : node.data.error ? <div className="text-red-400 text-xs p-2 text-center">{node.data.error}</div>
                        : node.data.videoUrl ? <video src={node.data.videoUrl} controls autoPlay muted loop className="w-full h-full object-cover rounded-md" />
                        : <Video className={`w-8 h-8 ${styles.node.imagePlaceholderIcon}`} />}
                    </div>
                    {!node.data.isLoading && node.data.generationElapsedMs !== undefined && !node.data.error && (
                        <p className="text-xs mt-1 text-center text-gray-300">Completed in {formatDuration(node.data.generationElapsedMs)}</p>
                    )}
                    {!node.data.isLoading && node.data.generationElapsedMs !== undefined && node.data.error && (
                        <p className="text-xs mt-1 text-center text-gray-300">Attempt took {formatDuration(node.data.generationElapsedMs)}</p>
                    )}
                </div>
                <button onClick={() => onGenerateVideo(node.id)} disabled={node.data.isLoading} className={`w-full flex items-center justify-center p-2 ${node.data.isLoading ? 'bg-gray-600' : 'bg-green-600 hover:bg-green-500'} text-white font-bold rounded-md transition-colors text-sm disabled:cursor-not-allowed`} >
                    <Sparkles className={`w-4 h-4 mr-2 ${node.data.isLoading ? 'animate-pulse' : ''}`} />
                    {node.data.isLoading ? 'Generating...' : 'Generate Video'}
                </button>
              </div>
            </div>
             {isMinimized && ( <div className={`w-full ${styles.node.imagePlaceholderBg} rounded-b-md flex items-center justify-center border-t ${styles.node.imagePlaceholderBorder} transition-all duration-300 ease-in-out overflow-hidden`} style={{ height: node.data.minimizedHeight ? `${node.data.minimizedHeight}px` : '64px' }} >
                {previewVideo ? <video key={previewVideo} ref={minimizedVideoRef} src={previewVideo} muted loop autoPlay playsInline className="w-full h-full object-contain" />
                : previewImage ? <img key={previewImage} ref={minimizedImageRef} src={previewImage} alt="Preview" className="w-full h-full object-contain" />
                : <Video className={`w-8 h-8 ${styles.node.imagePlaceholderIcon}`} />}
            </div> )}
        </>
      )}
      {contextMenuPosition && (
        <NodeContextMenu
          position={contextMenuPosition}
          nodeId={node.id}
          selectedNodeIds={selectedNodeIds}
          onClose={closeContextMenu}
          onDuplicate={handleDuplicate}
          onReset={handleReset}
          onDeleteDirectly={(nodeId) => {
            // If this node is part of a selection, delete all selected nodes
            if (selectedNodeIds.has(nodeId) && selectedNodeIds.size > 1) {
              selectedNodeIds.forEach(id => onDeleteDirectly(id));
            } else {
              onDeleteDirectly(nodeId);
            }
          }}
          startWithDeleteConfirmation={contextMenuStartsWithDelete}
        />
      )}
    </div>
  );
};

export default Node;
