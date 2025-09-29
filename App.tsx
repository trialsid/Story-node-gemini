import React, { useState, useCallback, useRef, useEffect, useMemo } from 'react';
import { NodeData, NodeType, Connection, CanvasState, HandleType, GalleryItem, GalleryStatus } from './types';
import Canvas from './components/Canvas';
import Toolbar from './components/Toolbar';
import ImageModal from './components/ImageModal';
import ConfirmationModal from './components/ConfirmationModal';
import TextModal from './components/TextModal';
import { generateCharacterSheet, editImageWithPrompt, generateVideoFromPrompt, generateTextFromPrompt, generateImages, mixImagesWithPrompt, generateCharactersFromStory, expandStoryFromPremise } from './services/geminiService';
import { useTheme } from './contexts/ThemeContext';
import ThemeSwitcher from './components/ThemeSwitcher';
import GalleryPanel from './components/GalleryPanel';
import GalleryPreviewModal from './components/GalleryPreviewModal';
import WelcomeModal from './components/WelcomeModal';
import { templates } from './utils/templates';
import ContextMenuWithSubmenu from './components/ContextMenuWithSubmenu';
import SettingsModal from './components/SettingsModal';
import { Settings } from 'lucide-react';
import { useHistory } from './hooks/useHistory';
import { areHandlesCompatible } from './utils/node-spec';
import { fetchGalleryItems, createGalleryItem, deleteGalleryItem } from './services/galleryApi';
import { getHandleSpec } from './utils/handlePositions';
import { buildAllNodeMenuCategories } from './utils/nodeMenuConfig';


const NODE_DIMENSIONS: { [key in NodeType]: { width: number; height?: number } } = {
  [NodeType.CharacterGenerator]: { width: 256 },
  [NodeType.ImageGenerator]: { width: 256 },
  [NodeType.Text]: { width: 256 },
  [NodeType.ImageEditor]: { width: 256 },
  [NodeType.VideoGenerator]: { width: 256 },
  [NodeType.Image]: { width: 256 },
  [NodeType.TextGenerator]: { width: 256 },
  [NodeType.ImageMixer]: { width: 256 },
  [NodeType.StoryCharacterCreator]: { width: 256 },
  [NodeType.StoryExpander]: { width: 256 },
};

interface DragStartInfo {
  startMouseX: number;
  startMouseY: number;
  startNodeX: number;
  startNodeY: number;
}

interface TempConnectionInfo {
  startNodeId: string;
  startHandleId: string;
  startHandleType: HandleType;
}

interface HoveredInputInfo {
  nodeId: string;
  handleId: string;
}

const createDefaultDataForType = (type: NodeType): NodeData['data'] => {
  switch (type) {
    case NodeType.CharacterGenerator:
      return {
        characterDescription: 'A brave knight with a scar over his left eye',
        style: 'Candid Photo',
        layout: '6-panel grid',
        aspectRatio: '16:9',
      } as NodeData['data'];
    case NodeType.ImageGenerator:
      return {
        prompt: 'A photorealistic cat astronaut on Mars',
        numberOfImages: 1,
        aspectRatio: '1:1',
      } as NodeData['data'];
    case NodeType.Text:
      return { text: 'A futuristic cityscape at dusk.' } as NodeData['data'];
    case NodeType.Image:
      return {} as NodeData['data'];
    case NodeType.ImageEditor:
      return { editDescription: 'Add a golden crown' } as NodeData['data'];
    case NodeType.ImageMixer:
      return { editDescription: 'A photorealistic blend of the input images' } as NodeData['data'];
    case NodeType.VideoGenerator:
      return {
        editDescription: 'A majestic eagle soaring over mountains',
        videoModel: 'veo-3.0-fast-generate-001',
      } as NodeData['data'];
    case NodeType.TextGenerator:
      return { prompt: 'Write a short story about a robot who discovers music.' } as NodeData['data'];
    case NodeType.StoryCharacterCreator:
      return {
        storyPrompt: 'A brave knight and a wise dragon meet in a forest to discuss an ancient prophecy.',
      } as NodeData['data'];
    case NodeType.StoryExpander:
      return {
        premise: 'A detective finds a mysterious key',
        length: 'short',
        genre: 'any',
      } as NodeData['data'];
    default:
      return {} as NodeData['data'];
  }
};

const sanitizeNodeDataForDuplication = (node: NodeData): NodeData['data'] => {
  const clone = JSON.parse(JSON.stringify(node.data || {})) as NodeData['data'];

  delete (clone as any).isLoading;
  delete (clone as any).error;
  delete (clone as any).generationProgressMessage;
  delete (clone as any).generationElapsedMs;
  delete (clone as any).generationStartTimeMs;
  delete (clone as any).minimizedHeight;
  delete (clone as any).handleYOffsets;
  delete (clone as any).minimizedHandleYOffsets;

  switch (node.type) {
    case NodeType.CharacterGenerator:
    case NodeType.ImageEditor:
    case NodeType.ImageMixer:
      delete (clone as any).imageUrl;
      break;
    case NodeType.ImageGenerator:
      delete (clone as any).imageUrls;
      delete (clone as any).imageUrl;
      break;
    case NodeType.VideoGenerator:
      delete (clone as any).videoUrl;
      break;
    case NodeType.TextGenerator:
    case NodeType.StoryExpander:
      delete (clone as any).text;
      break;
    case NodeType.StoryCharacterCreator:
      delete (clone as any).characters;
      break;
    default:
      break;
  }

  return clone;
};

const App: React.FC = () => {
  const {
    state: canvasState,
    set: setCanvasState,
    undo,
    redo,
    reset: resetHistory,
    canUndo,
    canRedo,
  } = useHistory<CanvasState>({ nodes: [], connections: [] });

  const { nodes, connections } = canvasState;

  // State for real-time dragging feedback without polluting history
  const [localNodes, setLocalNodes] = useState<NodeData[]>([]);
  const [draggingNodeId, setDraggingNodeId] = useState<string | null>(null);
  const [dragStartInfo, setDragStartInfo] = useState<DragStartInfo | null>(null);
  const [modalImageUrl, setModalImageUrl] = useState<string | null>(null);
  const [textModalData, setTextModalData] = useState<{ title: string; text: string } | null>(null);
  const [tempConnectionInfo, setTempConnectionInfo] = useState<TempConnectionInfo | null>(null);
  const [mousePosition, setMousePosition] = useState({ x: 0, y: 0 });
  const [hoveredInputHandle, setHoveredInputHandle] = useState<HoveredInputInfo | null>(null);
  const canvasRef = useRef<HTMLDivElement>(null);
  const [nodeToDelete, setNodeToDelete] = useState<string | null>(null);

  // State for canvas transform
  const [isPanning, setIsPanning] = useState(false);
  const [panStart, setPanStart] = useState({ x: 0, y: 0 });
  const [canvasOffset, setCanvasOffset] = useState({ x: 50, y: 50 });
  const [zoom, setZoom] = useState(1);
  const [showWelcomeModal, setShowWelcomeModal] = useState(false);
  const [isNavigatingHome, setIsNavigatingHome] = useState(false);
  const [isClearingCanvas, setIsClearingCanvas] = useState(false);
  const [contextMenu, setContextMenu] = useState<{ isOpen: boolean; x: number; y: number; canvasX: number; canvasY: number; } | null>(null);
  const [isSettingsModalOpen, setIsSettingsModalOpen] = useState(false);
  
  // New state for project loading
  const [isLoadingProject, setIsLoadingProject] = useState(false);
  const [projectFileContent, setProjectFileContent] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [lastAddedNodePosition, setLastAddedNodePosition] = useState<{ x: number, y: number } | null>(null);
  const [galleryItems, setGalleryItems] = useState<GalleryItem[]>([]);
  const [galleryStatus, setGalleryStatus] = useState<GalleryStatus>('loading');
  const [galleryError, setGalleryError] = useState<string | null>(null);
  const [isGalleryLoading, setIsGalleryLoading] = useState(false);
  const [selectedGalleryItem, setSelectedGalleryItem] = useState<GalleryItem | null>(null);

  const [showWelcomeOnStartup, setShowWelcomeOnStartup] = useState(() => {
    const setting = localStorage.getItem('showWelcomeOnStartup');
    return setting === null || setting === 'true';
  });

  const [videoAutoplayEnabled, setVideoAutoplayEnabled] = useState(() => {
    const setting = localStorage.getItem('videoAutoplayEnabled');
    return setting === null || setting === 'true';
  });


  const { styles } = useTheme();

  const updateGalleryState = useCallback((updater: GalleryItem[] | ((prev: GalleryItem[]) => GalleryItem[])) => {
    setGalleryItems(prevItems => (
      typeof updater === 'function'
        ? (updater as (items: GalleryItem[]) => GalleryItem[])(prevItems)
        : updater
    ));
  }, []);

  useEffect(() => {
    localStorage.setItem('showWelcomeOnStartup', String(showWelcomeOnStartup));
  }, [showWelcomeOnStartup]);

  useEffect(() => {
    localStorage.setItem('videoAutoplayEnabled', String(videoAutoplayEnabled));
  }, [videoAutoplayEnabled]);

  useEffect(() => {
    if (showWelcomeOnStartup) {
      setShowWelcomeModal(true);
    }
  }, []);

  useEffect(() => {
    if (!selectedGalleryItem) return;
    const updated = galleryItems.find(item => item.id === selectedGalleryItem.id);
    if (!updated) {
      setSelectedGalleryItem(null);
    } else if (updated !== selectedGalleryItem) {
      setSelectedGalleryItem(updated);
    }
  }, [galleryItems, selectedGalleryItem]);

  // Sync localNodes with history state when not dragging
  useEffect(() => {
    if (!draggingNodeId) {
      setLocalNodes(nodes);
    }
  }, [nodes, draggingNodeId]);

  // Keyboard shortcuts for undo/redo
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
        if (e.ctrlKey || e.metaKey) {
            if (e.key === 'z') {
                if (e.shiftKey) {
                    if (canRedo) redo();
                } else {
                    if (canUndo) undo();
                }
                e.preventDefault();
            } else if (e.key === 'y') {
                if (canRedo) redo();
                e.preventDefault();
            }
        }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [undo, redo, canUndo, canRedo]);

  const handleOpenSettingsModal = () => setIsSettingsModalOpen(true);
  const handleCloseSettingsModal = () => setIsSettingsModalOpen(false);

  const handleGalleryError = useCallback((error: unknown) => {
    console.error('Gallery error', error);
    setGalleryStatus('error');
    setGalleryError(error instanceof Error ? error.message : 'Unknown error occurred.');
    setIsGalleryLoading(false);
  }, []);

  const handleDeleteGalleryItem = useCallback(async (id: string) => {
    try {
      await deleteGalleryItem(id);
      updateGalleryState(prevItems => prevItems.filter(item => item.id !== id));
      setSelectedGalleryItem(prev => (prev && prev.id === id ? null : prev));
    } catch (error) {
      handleGalleryError(error);
    }
  }, [handleGalleryError, updateGalleryState]);

  const refreshGalleryItems = useCallback(async () => {
    setGalleryStatus('loading');
    setIsGalleryLoading(true);
    setGalleryError(null);
    try {
      const items = await fetchGalleryItems();
      updateGalleryState(items);
      setGalleryStatus('ready');
      setGalleryError(null);
    } catch (error) {
      handleGalleryError(error);
    } finally {
      setIsGalleryLoading(false);
    }
  }, [handleGalleryError, updateGalleryState]);

  const persistGalleryItem = useCallback(async (params: {
    dataUrl: string;
    type: 'image' | 'video';
    prompt?: string;
    nodeType?: NodeType;
    nodeId?: string;
  }) => {
    try {
      const item = await createGalleryItem(params);
      updateGalleryState(prevItems => [item, ...prevItems]);
      setGalleryStatus('ready');
      setGalleryError(null);
    } catch (error) {
      handleGalleryError(error);
    }
  }, [handleGalleryError, updateGalleryState]);

  const handleSelectGalleryItem = useCallback((item: GalleryItem) => {
    setSelectedGalleryItem(item);
  }, []);

  const handleCloseGalleryItem = useCallback(() => {
    setSelectedGalleryItem(null);
  }, []);

  useEffect(() => {
    refreshGalleryItems();
  }, [refreshGalleryItems]);

  const handleStartFresh = useCallback(() => {
    resetHistory({ nodes: [], connections: [] });
    setShowWelcomeModal(false);
    setLastAddedNodePosition(null);
  }, [resetHistory]);
  
  const handleLoadTemplate = useCallback((templateKey: keyof typeof templates) => {
    const template = templates[templateKey];
    const idMap = new Map<string, string>();
    
    const newNodes = template.nodes.map(node => {
      const newId = `node_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
      idMap.set(node.id, newId);
      return { ...node, id: newId };
    });
    
    const newConnections = template.connections.map(conn => {
        const newFromId = idMap.get(conn.fromNodeId);
        const newToId = idMap.get(conn.toNodeId);
        if (!newFromId || !newToId) {
            console.error("Failed to map connection IDs for template:", template.name);
            return null;
        }
        return {
            ...conn,
            id: `conn_${newFromId}_${conn.fromHandleId}_${newToId}_${conn.toHandleId}`,
            fromNodeId: newFromId,
            toNodeId: newToId,
        };
    }).filter((c): c is Connection => c !== null);
  
    const propagateInitialData = (initialNodes: NodeData[], initialConnections: Connection[]) => {
      let propagatedNodes = [...initialNodes];
      initialConnections.forEach(conn => {
        const fromNodeIndex = propagatedNodes.findIndex(n => n.id === conn.fromNodeId);
        const toNodeIndex = propagatedNodes.findIndex(n => n.id === conn.toNodeId);
        if (fromNodeIndex === -1 || toNodeIndex === -1) return;

        const fromNode = propagatedNodes[fromNodeIndex];
        const toNode = propagatedNodes[toNodeIndex];
        let dataToUpdate: Partial<NodeData['data']> = {};
        
        const fromNodeProducesText =
          (fromNode.type === NodeType.Text ||
            fromNode.type === NodeType.TextGenerator ||
            fromNode.type === NodeType.StoryExpander);

        if (fromNodeProducesText && 'text' in fromNode.data) {
          if (toNode.type === NodeType.CharacterGenerator && conn.toHandleId === 'description_input') {
              dataToUpdate = { characterDescription: fromNode.data.text };
          } else if (toNode.type === NodeType.ImageGenerator && conn.toHandleId === 'prompt_input') {
              dataToUpdate = { prompt: fromNode.data.text };
          } else if (toNode.type === NodeType.VideoGenerator && conn.toHandleId === 'prompt_input') {
              dataToUpdate = { editDescription: fromNode.data.text };
          } else if (toNode.type === NodeType.TextGenerator && conn.toHandleId === 'prompt_input') {
              dataToUpdate = { prompt: fromNode.data.text };
          } else if (toNode.type === NodeType.StoryCharacterCreator && conn.toHandleId === 'prompt_input') {
              dataToUpdate = { storyPrompt: fromNode.data.text };
          } else if (toNode.type === NodeType.StoryExpander && conn.toHandleId === 'premise_input') {
              dataToUpdate = { premise: fromNode.data.text };
          }
        }
        
        if ((fromNode.type === NodeType.CharacterGenerator || fromNode.type === NodeType.ImageEditor || fromNode.type === NodeType.Image) && 'imageUrl' in fromNode.data) {
          if ((toNode.type === NodeType.ImageEditor || toNode.type === NodeType.VideoGenerator || toNode.type === NodeType.ImageMixer) && conn.toHandleId === 'image_input') {
              dataToUpdate = { inputImageUrl: fromNode.data.imageUrl };
          }
        }

        if (fromNode.type === NodeType.StoryCharacterCreator && Array.isArray(fromNode.data.characters)) {
          const match = conn.fromHandleId.match(/^character_output_(\d+)$/);
          if (match) {
            const characterIndex = parseInt(match[1], 10) - 1;
            const characterDescription = fromNode.data.characters[characterIndex]?.description;
            if (characterDescription && toNode.type === NodeType.CharacterGenerator && conn.toHandleId === 'description_input') {
              dataToUpdate = { characterDescription };
            }
          }
        }

        if (Object.keys(dataToUpdate).length > 0) {
            propagatedNodes[toNodeIndex] = { ...toNode, data: { ...toNode.data, ...dataToUpdate } };
        }
      });
      return propagatedNodes;
    };
    
    const finalNodes = propagateInitialData(newNodes, newConnections);
    resetHistory({ nodes: finalNodes, connections: newConnections });
    setShowWelcomeModal(false);
    setLastAddedNodePosition(null);
  }, [resetHistory]);

  const handleNavigateHome = useCallback(() => {
    if (nodes.length > 0) {
        setIsNavigatingHome(true);
    } else {
        setShowWelcomeModal(true);
    }
  }, [nodes.length]);

  const confirmNavigateHome = () => {
    resetHistory({ nodes: [], connections: [] });
    setShowWelcomeModal(true);
    setIsNavigatingHome(false);
    setLastAddedNodePosition(null);
  };

  const cancelNavigateHome = () => {
    setIsNavigatingHome(false);
  };

  const handleClearCanvasRequest = useCallback(() => {
    if (nodes.length > 0) {
        setIsClearingCanvas(true);
    }
  }, [nodes.length]);

  const confirmClearCanvas = () => {
    resetHistory({ nodes: [], connections: [] });
    setIsClearingCanvas(false);
    setLastAddedNodePosition(null);
  };

  const cancelClearCanvas = () => {
    setIsClearingCanvas(false);
  };

  const handleSaveProject = useCallback(() => {
    const stateToSave: CanvasState = { nodes, connections };
    const jsonString = JSON.stringify(stateToSave, null, 2);
    const blob = new Blob([jsonString], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
    a.download = `gemini-node-canvas-project-${timestamp}.json`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  }, [nodes, connections]);

  const loadProject = useCallback((jsonString: string) => {
    try {
      const loadedState = JSON.parse(jsonString) as CanvasState;
      if (Array.isArray(loadedState.nodes) && Array.isArray(loadedState.connections)) {
        resetHistory(loadedState);
        setLastAddedNodePosition(null);
      } else {
        throw new Error('Invalid project file format: Missing nodes or connections array.');
      }
    } catch (error) {
      console.error("Failed to load project:", error);
      const errorMessage = error instanceof Error ? error.message : String(error);
      alert(`Failed to load project file. It may be corrupted or in an invalid format.\n\nError: ${errorMessage}`);
    }
  }, [resetHistory]);
  
  const confirmLoadProject = useCallback(() => {
    if (projectFileContent) {
      loadProject(projectFileContent);
    }
    setIsLoadingProject(false);
    setProjectFileContent(null);
  }, [projectFileContent, loadProject]);

  const cancelLoadProject = () => {
    setIsLoadingProject(false);
    setProjectFileContent(null);
  };

  const handleFileSelected = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;
  
    const reader = new FileReader();
    reader.onload = (e) => {
      const text = e.target?.result;
      if (typeof text === 'string') {
        if (nodes.length > 0 || connections.length > 0) {
          setProjectFileContent(text);
          setIsLoadingProject(true);
        } else {
          loadProject(text);
        }
      }
    };
    reader.onerror = () => {
      alert('Error reading file.');
    };
    reader.readAsText(file);
    event.target.value = ''; // Reset to allow loading same file again
  };
  
  const handleLoadProject = () => {
    fileInputRef.current?.click();
  };

  const addNode = useCallback((pos?: { x: number; y: number }) => {
    let newNodePosition: { x: number, y: number };
    if (pos) {
        newNodePosition = pos;
        setLastAddedNodePosition(null);
    } else {
        const nextPos = lastAddedNodePosition
            ? { x: lastAddedNodePosition.x + 32, y: lastAddedNodePosition.y + 32 }
            : { x: (150 - canvasOffset.x) / zoom, y: (150 - canvasOffset.y) / zoom };
        newNodePosition = nextPos;
        setLastAddedNodePosition(nextPos);
    }

    const newNode: NodeData = {
      id: `node_${Date.now()}_${Math.random().toString(36).substring(2, 9)}`,
      type: NodeType.CharacterGenerator,
      position: newNodePosition,
      data: createDefaultDataForType(NodeType.CharacterGenerator),
    };
    setCanvasState(prevState => ({ ...prevState, nodes: [...prevState.nodes, newNode] }));
  }, [canvasOffset, zoom, setCanvasState, lastAddedNodePosition]);

  const addImageGeneratorNode = useCallback((pos?: { x: number; y: number }) => {
    let newNodePosition: { x: number, y: number };
    if (pos) {
        newNodePosition = pos;
        setLastAddedNodePosition(null);
    } else {
        const nextPos = lastAddedNodePosition
            ? { x: lastAddedNodePosition.x + 32, y: lastAddedNodePosition.y + 32 }
            : { x: (150 - canvasOffset.x) / zoom, y: (150 - canvasOffset.y) / zoom };
        newNodePosition = nextPos;
        setLastAddedNodePosition(nextPos);
    }
    const newNode: NodeData = {
      id: `node_${Date.now()}_${Math.random().toString(36).substring(2, 9)}`,
      type: NodeType.ImageGenerator,
      position: newNodePosition,
      data: createDefaultDataForType(NodeType.ImageGenerator),
    };
    setCanvasState(prevState => ({ ...prevState, nodes: [...prevState.nodes, newNode] }));
  }, [canvasOffset, zoom, setCanvasState, lastAddedNodePosition]);

  const addTextNode = useCallback((pos?: { x: number; y: number }) => {
    let newNodePosition: { x: number, y: number };
    if (pos) {
        newNodePosition = pos;
        setLastAddedNodePosition(null);
    } else {
        const nextPos = lastAddedNodePosition
            ? { x: lastAddedNodePosition.x + 32, y: lastAddedNodePosition.y + 32 }
            : { x: (150 - canvasOffset.x) / zoom, y: (150 - canvasOffset.y) / zoom };
        newNodePosition = nextPos;
        setLastAddedNodePosition(nextPos);
    }
    const newNode: NodeData = {
      id: `node_${Date.now()}_${Math.random().toString(36).substring(2, 9)}`,
      type: NodeType.Text,
      position: newNodePosition,
      data: createDefaultDataForType(NodeType.Text),
    };
    setCanvasState(prevState => ({ ...prevState, nodes: [...prevState.nodes, newNode] }));
  }, [canvasOffset, zoom, setCanvasState, lastAddedNodePosition]);
  
  const addImageNode = useCallback((pos?: { x: number; y: number }) => {
    let newNodePosition: { x: number, y: number };
    if (pos) {
        newNodePosition = pos;
        setLastAddedNodePosition(null);
    } else {
        const nextPos = lastAddedNodePosition
            ? { x: lastAddedNodePosition.x + 32, y: lastAddedNodePosition.y + 32 }
            : { x: (150 - canvasOffset.x) / zoom, y: (150 - canvasOffset.y) / zoom };
        newNodePosition = nextPos;
        setLastAddedNodePosition(nextPos);
    }
    const newNode: NodeData = {
      id: `node_${Date.now()}_${Math.random().toString(36).substring(2, 9)}`,
      type: NodeType.Image,
      position: newNodePosition,
      data: createDefaultDataForType(NodeType.Image),
    };
    setCanvasState(prevState => ({ ...prevState, nodes: [...prevState.nodes, newNode] }));
  }, [canvasOffset, zoom, setCanvasState, lastAddedNodePosition]);

  const addImageEditorNode = useCallback((pos?: { x: number; y: number }) => {
    let newNodePosition: { x: number, y: number };
    if (pos) {
        newNodePosition = pos;
        setLastAddedNodePosition(null);
    } else {
        const nextPos = lastAddedNodePosition
            ? { x: lastAddedNodePosition.x + 32, y: lastAddedNodePosition.y + 32 }
            : { x: (150 - canvasOffset.x) / zoom, y: (150 - canvasOffset.y) / zoom };
        newNodePosition = nextPos;
        setLastAddedNodePosition(nextPos);
    }
    const newNode: NodeData = {
      id: `node_${Date.now()}_${Math.random().toString(36).substring(2, 9)}`,
      type: NodeType.ImageEditor,
      position: newNodePosition,
      data: createDefaultDataForType(NodeType.ImageEditor),
    };
    setCanvasState(prevState => ({ ...prevState, nodes: [...prevState.nodes, newNode] }));
  }, [canvasOffset, zoom, setCanvasState, lastAddedNodePosition]);

  const addImageMixerNode = useCallback((pos?: { x: number; y: number }) => {
    let newNodePosition: { x: number, y: number };
    if (pos) {
        newNodePosition = pos;
        setLastAddedNodePosition(null);
    } else {
        const nextPos = lastAddedNodePosition
            ? { x: lastAddedNodePosition.x + 32, y: lastAddedNodePosition.y + 32 }
            : { x: (150 - canvasOffset.x) / zoom, y: (150 - canvasOffset.y) / zoom };
        newNodePosition = nextPos;
        setLastAddedNodePosition(nextPos);
    }
    const newNode: NodeData = {
      id: `node_${Date.now()}_${Math.random().toString(36).substring(2, 9)}`,
      type: NodeType.ImageMixer,
      position: newNodePosition,
      data: createDefaultDataForType(NodeType.ImageMixer),
    };
    setCanvasState(prevState => ({ ...prevState, nodes: [...prevState.nodes, newNode] }));
  }, [canvasOffset, zoom, setCanvasState, lastAddedNodePosition]);

  const addVideoGeneratorNode = useCallback((pos?: { x: number; y: number }) => {
    let newNodePosition: { x: number, y: number };
    if (pos) {
        newNodePosition = pos;
        setLastAddedNodePosition(null);
    } else {
        const nextPos = lastAddedNodePosition
            ? { x: lastAddedNodePosition.x + 32, y: lastAddedNodePosition.y + 32 }
            : { x: (150 - canvasOffset.x) / zoom, y: (150 - canvasOffset.y) / zoom };
        newNodePosition = nextPos;
        setLastAddedNodePosition(nextPos);
    }
    const newNode: NodeData = {
      id: `node_${Date.now()}_${Math.random().toString(36).substring(2, 9)}`,
      type: NodeType.VideoGenerator,
      position: newNodePosition,
      data: createDefaultDataForType(NodeType.VideoGenerator),
    };
    setCanvasState(prevState => ({ ...prevState, nodes: [...prevState.nodes, newNode] }));
  }, [canvasOffset, zoom, setCanvasState, lastAddedNodePosition]);
  
  const addTextGeneratorNode = useCallback((pos?: { x: number; y: number }) => {
    let newNodePosition: { x: number, y: number };
    if (pos) {
        newNodePosition = pos;
        setLastAddedNodePosition(null);
    } else {
        const nextPos = lastAddedNodePosition
            ? { x: lastAddedNodePosition.x + 32, y: lastAddedNodePosition.y + 32 }
            : { x: (150 - canvasOffset.x) / zoom, y: (150 - canvasOffset.y) / zoom };
        newNodePosition = nextPos;
        setLastAddedNodePosition(nextPos);
    }
    const newNode: NodeData = {
      id: `node_${Date.now()}_${Math.random().toString(36).substring(2, 9)}`,
      type: NodeType.TextGenerator,
      position: newNodePosition,
      data: createDefaultDataForType(NodeType.TextGenerator),
    };
    setCanvasState(prevState => ({ ...prevState, nodes: [...prevState.nodes, newNode] }));
  }, [canvasOffset, zoom, setCanvasState, lastAddedNodePosition]);

  const addStoryCharacterCreatorNode = useCallback((pos?: { x: number; y: number }) => {
    let newNodePosition: { x: number, y: number };
    if (pos) {
        newNodePosition = pos;
        setLastAddedNodePosition(null);
    } else {
        const nextPos = lastAddedNodePosition
            ? { x: lastAddedNodePosition.x + 32, y: lastAddedNodePosition.y + 32 }
            : { x: (150 - canvasOffset.x) / zoom, y: (150 - canvasOffset.y) / zoom };
        newNodePosition = nextPos;
        setLastAddedNodePosition(nextPos);
    }

    const newNode: NodeData = {
      id: `node_${Date.now()}_${Math.random().toString(36).substring(2, 9)}`,
      type: NodeType.StoryCharacterCreator,
      position: newNodePosition,
      data: createDefaultDataForType(NodeType.StoryCharacterCreator),
    };
    setCanvasState(prevState => ({ ...prevState, nodes: [...prevState.nodes, newNode] }));
  }, [canvasOffset, zoom, setCanvasState, lastAddedNodePosition]);

  const addStoryExpanderNode = useCallback((pos?: { x: number; y: number }) => {
    let newNodePosition: { x: number, y: number };
    if (pos) {
        newNodePosition = pos;
        setLastAddedNodePosition(null);
    } else {
        const nextPos = lastAddedNodePosition
            ? { x: lastAddedNodePosition.x + 32, y: lastAddedNodePosition.y + 32 }
            : { x: (150 - canvasOffset.x) / zoom, y: (150 - canvasOffset.y) / zoom };
        newNodePosition = nextPos;
        setLastAddedNodePosition(nextPos);
    }
    const newNode: NodeData = {
      id: `node_${Date.now()}_${Math.random().toString(36).substring(2, 9)}`,
      type: NodeType.StoryExpander,
      position: newNodePosition,
      data: createDefaultDataForType(NodeType.StoryExpander),
    };
    setCanvasState(prevState => ({ ...prevState, nodes: [...prevState.nodes, newNode] }));
  }, [canvasOffset, zoom, setCanvasState, lastAddedNodePosition]);

  const toggleNodeMinimization = useCallback((nodeId: string) => {
    setCanvasState(prevState => ({
        ...prevState,
        nodes: prevState.nodes.map(node =>
            node.id === nodeId
            ? { ...node, data: { ...node.data, isMinimized: !node.data.isMinimized } }
            : node
        ),
    }));
  }, [setCanvasState]);

  const duplicateNode = useCallback((nodeId: string) => {
    let duplicatedPosition: { x: number; y: number } | null = null;

    setCanvasState(prevState => {
      const node = prevState.nodes.find(n => n.id === nodeId);
      if (!node) return prevState;

      const newId = `node_${Date.now()}_${Math.random().toString(36).substring(2, 9)}`;
      const position = {
        x: node.position.x + 48,
        y: node.position.y + 48,
      };
      duplicatedPosition = position;

      const duplicatedNode: NodeData = {
        ...node,
        id: newId,
        position,
        data: sanitizeNodeDataForDuplication(node),
      };

      return {
        ...prevState,
        nodes: [...prevState.nodes, duplicatedNode],
      };
    });

    if (duplicatedPosition) {
      setLastAddedNodePosition(duplicatedPosition);
    }
  }, [setCanvasState, setLastAddedNodePosition]);

  const resetNode = useCallback((nodeId: string) => {
    setCanvasState(prevState => {
      const nodeIndex = prevState.nodes.findIndex(n => n.id === nodeId);
      if (nodeIndex === -1) return prevState;

      const node = prevState.nodes[nodeIndex];
      const defaultData = createDefaultDataForType(node.type);
      const preservedState = node.data.isMinimized !== undefined ? { isMinimized: node.data.isMinimized } : {};

      const updatedNodes = [...prevState.nodes];
      updatedNodes[nodeIndex] = {
        ...node,
        data: {
          ...defaultData,
          ...preservedState,
        },
      };

      return {
        ...prevState,
        nodes: updatedNodes,
      };
    });
  }, [setCanvasState]);

  const updateNodeData = useCallback((nodeId: string, data: Partial<NodeData['data']>) => {
    setCanvasState((prevState) => {
        let newNodes = [...prevState.nodes];
        const nodeIndex = newNodes.findIndex(n => n.id === nodeId);
        if (nodeIndex === -1) return prevState;
        
        const updatedNode = { ...newNodes[nodeIndex], data: { ...newNodes[nodeIndex].data, ...data } };
        newNodes[nodeIndex] = updatedNode;

        let newConnections = prevState.connections;

        prevState.connections.forEach(conn => {
            if (conn.fromNodeId === nodeId) {
                const toNodeIndex = newNodes.findIndex(n => n.id === conn.toNodeId);
                if (toNodeIndex === -1) return;

                const toNode = newNodes[toNodeIndex];
                let dataToUpdate: Partial<NodeData['data']> = {};
                
                const updatedNodeProducesText =
                  (updatedNode.type === NodeType.Text ||
                    updatedNode.type === NodeType.TextGenerator ||
                    updatedNode.type === NodeType.StoryExpander);

                if (updatedNodeProducesText && 'text' in data) {
                    if (toNode.type === NodeType.CharacterGenerator && conn.toHandleId === 'description_input') {
                        dataToUpdate = { characterDescription: data.text };
                    } else if (toNode.type === NodeType.ImageGenerator && conn.toHandleId === 'prompt_input') {
                        dataToUpdate = { prompt: data.text };
                    } else if (toNode.type === NodeType.VideoGenerator && conn.toHandleId === 'prompt_input') {
                        dataToUpdate = { editDescription: data.text };
                    } else if (toNode.type === NodeType.TextGenerator && conn.toHandleId === 'prompt_input') {
                      dataToUpdate = { prompt: data.text };
                    } else if (toNode.type === NodeType.StoryCharacterCreator && conn.toHandleId === 'prompt_input') {
                        dataToUpdate = { storyPrompt: data.text };
                    } else if (toNode.type === NodeType.StoryExpander && conn.toHandleId === 'premise_input') {
                        dataToUpdate = { premise: data.text };
                    }
                }
                
                if ((updatedNode.type === NodeType.CharacterGenerator || updatedNode.type === NodeType.ImageEditor || updatedNode.type === NodeType.Image || updatedNode.type === NodeType.ImageMixer) && 'imageUrl' in data) {
                  if ((toNode.type === NodeType.ImageEditor || toNode.type === NodeType.VideoGenerator) && conn.toHandleId === 'image_input') {
                      dataToUpdate = { inputImageUrl: data.imageUrl };
                  }
                }
                
                if (updatedNode.type === NodeType.ImageGenerator && 'imageUrls' in data && Array.isArray(data.imageUrls)) {
                    const match = conn.fromHandleId.match(/_(\d+)$/);
                    if (match) {
                        const imageIndex = parseInt(match[1], 10) - 1;
                        const imageUrlToPropagate = data.imageUrls?.[imageIndex];
        
                        if (imageUrlToPropagate && (toNode.type === NodeType.ImageEditor || toNode.type === NodeType.VideoGenerator) && conn.toHandleId === 'image_input') {
                            dataToUpdate = { inputImageUrl: imageUrlToPropagate };
                        }
                    }
                }

                if (updatedNode.type === NodeType.StoryCharacterCreator && 'characters' in data && Array.isArray(data.characters)) {
                    const match = conn.fromHandleId.match(/^character_output_(\d+)$/);
                    if (match) {
                        const characterIndex = parseInt(match[1], 10) - 1;
                        const characterDescription = data.characters?.[characterIndex]?.description;
                        if (characterDescription && toNode.type === NodeType.CharacterGenerator && conn.toHandleId === 'description_input') {
                            dataToUpdate = { characterDescription };
                        }
                    }
                }

                if (Object.keys(dataToUpdate).length > 0) {
                    newNodes[toNodeIndex] = { ...toNode, data: { ...toNode.data, ...dataToUpdate }};
                }
            }
        });

        if (updatedNode.type === NodeType.StoryCharacterCreator && 'characters' in data && Array.isArray(data.characters)) {
            const validHandles = new Set(data.characters.map((_, index) => `character_output_${index + 1}`));
            newConnections = newConnections.filter(conn => {
                if (conn.fromNodeId !== nodeId) return true;
                return validHandles.has(conn.fromHandleId);
            });
        }
        return { ...prevState, nodes: newNodes, connections: newConnections };
    });
  }, [setCanvasState]);

  const handleNodeDragStart = useCallback((nodeId: string, e: React.MouseEvent) => {
    setDraggingNodeId(nodeId);
    setLastAddedNodePosition(null);
    const node = nodes.find(n => n.id === nodeId);
    if (node) {
        setDragStartInfo({
            startMouseX: e.clientX,
            startMouseY: e.clientY,
            startNodeX: node.position.x,
            startNodeY: node.position.y,
        });
    }
  }, [nodes]);

  const handleMouseMove = useCallback((e: React.MouseEvent) => {
    setMousePosition({ x: e.clientX, y: e.clientY });

    if (draggingNodeId && dragStartInfo) {
      const dx = e.clientX - dragStartInfo.startMouseX;
      const dy = e.clientY - dragStartInfo.startMouseY;
      const x = dragStartInfo.startNodeX + dx / zoom;
      const y = dragStartInfo.startNodeY + dy / zoom;
      setLocalNodes((prevNodes) =>
        prevNodes.map((node) =>
          node.id === draggingNodeId ? { ...node, position: { x, y } } : node
        )
      );
    } else if (isPanning) {
      const dx = e.clientX - panStart.x;
      const dy = e.clientY - panStart.y;
      setCanvasOffset(prev => ({ x: prev.x + dx, y: prev.y + dy }));
      setPanStart({ x: e.clientX, y: e.clientY });
    }
  }, [draggingNodeId, dragStartInfo, isPanning, panStart, zoom]);

  const handleMouseUp = useCallback(() => {
    if (draggingNodeId) {
      // Commit the final position to history
      setCanvasState(prevState => ({ ...prevState, nodes: localNodes }));
    }
    setDraggingNodeId(null);
    setDragStartInfo(null);
    setIsPanning(false);
    setTempConnectionInfo(null); // Cancel connection on mouse up
    setHoveredInputHandle(null);
  }, [draggingNodeId, localNodes, setCanvasState]);
  
  const handleCanvasMouseDown = useCallback((e: React.MouseEvent) => {
    if (contextMenu?.isOpen) {
      setContextMenu(null);
    }
    if (e.target === e.currentTarget) {
        setLastAddedNodePosition(null);
        setIsPanning(true);
        setPanStart({ x: e.clientX, y: e.clientY });
    }
  }, [contextMenu?.isOpen]);

  const handleContextMenu = useCallback((e: React.MouseEvent) => {
    e.preventDefault();
    // Only open context menu on canvas background, not on nodes
    if (e.target !== e.currentTarget) return;

    const canvasX = (e.clientX - canvasOffset.x) / zoom;
    const canvasY = (e.clientY - canvasOffset.y) / zoom;
    setContextMenu({
        isOpen: true,
        x: e.clientX,
        y: e.clientY,
        canvasX,
        canvasY,
    });
  }, [canvasOffset.x, canvasOffset.y, zoom]);

  const handleCloseContextMenu = () => {
    setContextMenu(null);
  };

  const handleWheel = useCallback((e: React.WheelEvent) => {
    const target = e.target as HTMLElement;
    // Check if the scroll event is happening inside a textarea with a scrollbar
    if (target.tagName.toLowerCase() === 'textarea') {
      const textarea = target as HTMLTextAreaElement;
      if (textarea.scrollHeight > textarea.clientHeight) {
        // If the textarea is scrollable, let the browser handle the scroll
        // and don't zoom the canvas.
        return;
      }
    }
    
    // If not scrolling in a scrollable textarea, zoom the canvas.
    e.preventDefault();
    const zoomSpeed = 0.1;
    const direction = e.deltaY > 0 ? -1 : 1;
    const newZoom = Math.max(0.2, Math.min(2, zoom + direction * zoomSpeed));
    if (newZoom === zoom) return;
    const mouseX = e.clientX;
    const mouseY = e.clientY;
    const zoomRatio = newZoom / zoom;
    const newOffsetX = mouseX - zoomRatio * (mouseX - canvasOffset.x);
    const newOffsetY = mouseY - zoomRatio * (mouseY - canvasOffset.y);
    setZoom(newZoom);
    setCanvasOffset({ x: newOffsetX, y: newOffsetY });
  }, [zoom, canvasOffset]);

  const handleOutputMouseDown = useCallback((nodeId: string, handleId: string) => {
    const node = nodes.find(n => n.id === nodeId);
    if (!node) return;
    const handleSpec = getHandleSpec(node, handleId, 'output');
    if (!handleSpec) return;

    setCanvasState(prev => ({ ...prev, connections: prev.connections.filter(c => !(c.fromNodeId === nodeId && c.fromHandleId === handleId)) }));

    setTempConnectionInfo({
      startNodeId: nodeId,
      startHandleId: handleId,
      startHandleType: handleSpec.type,
    });
  }, [nodes, setCanvasState]);

  const handleInputMouseDown = useCallback((nodeId: string, handleId: string) => {
    const clickedNode = nodes.find(n => n.id === nodeId);
    const isMixerMultiInput = clickedNode?.type === NodeType.ImageMixer && handleId === 'image_input';

    if (isMixerMultiInput) {
        // Just break all connections to this input, don't start a new temp connection
        setCanvasState(prev => ({
            ...prev,
            connections: prev.connections.filter(c => !(c.toNodeId === nodeId && c.toHandleId === handleId))
        }));
        setTempConnectionInfo(null);
        return;
    }

    const connection = connections.find(c => c.toNodeId === nodeId && c.toHandleId === handleId);
    if (connection) {
        setCanvasState(prev => ({ ...prev, connections: prev.connections.filter(c => c.id !== connection.id) }));
        
        const fromNode = nodes.find(n => n.id === connection.fromNodeId);
        if (!fromNode) return;
        const fromHandleSpec = getHandleSpec(fromNode, connection.fromHandleId, 'output');
        if (!fromHandleSpec) return;

        setTempConnectionInfo({
            startNodeId: connection.fromNodeId,
            startHandleId: connection.fromHandleId,
            startHandleType: fromHandleSpec.type,
        });
    }
  }, [connections, setCanvasState, nodes]);

  const handleInputMouseUp = useCallback((toNodeId: string, toHandleId: string) => {
    if (!tempConnectionInfo) return;
    setHoveredInputHandle(null);

    const { startNodeId, startHandleId, startHandleType } = tempConnectionInfo;

    const toNode = nodes.find(n => n.id === toNodeId);
    if (!toNode || startNodeId === toNode.id) {
        setTempConnectionInfo(null);
        return;
    }

    const toHandleSpec = getHandleSpec(toNode, toHandleId, 'input');
    if (!toHandleSpec || !areHandlesCompatible(startHandleType, toHandleSpec.type)) {
        setTempConnectionInfo(null);
        return;
    }
    
    const newConnection: Connection = {
      id: `conn_${startNodeId}_${startHandleId}_${toNodeId}_${toHandleId}`,
      fromNodeId: startNodeId,
      fromHandleId: startHandleId,
      toNodeId: toNodeId,
      toHandleId: toHandleId,
    };
    
    setCanvasState(prevState => {
        const isMixerMultiInput = toNode.type === NodeType.ImageMixer && toHandleId === 'image_input';

        let connectionsToKeep = prevState.connections;
        if (!isMixerMultiInput) {
            // Default behavior: filter out any existing connections to this input
            connectionsToKeep = connectionsToKeep.filter(c => !(c.toNodeId === toNodeId && c.toHandleId === toHandleId));
        }

        const newConnections = [...connectionsToKeep, newConnection];
        let newNodes = [...prevState.nodes];
        
        const fromNode = newNodes.find(n => n.id === startNodeId);
        const toNodeIndex = newNodes.findIndex(n => n.id === toNodeId);
        
        // Data propagation (except for mixer, which resolves inputs at generation time)
        if (fromNode && toNodeIndex !== -1 && !isMixerMultiInput) {
            let dataToUpdate: Partial<NodeData['data']> = {};
            const toNode = newNodes[toNodeIndex];

            const fromNodeProducesText =
              (fromNode.type === NodeType.Text ||
                fromNode.type === NodeType.TextGenerator ||
                fromNode.type === NodeType.StoryExpander);

            if (fromNodeProducesText && 'text' in fromNode.data) {
                if (toNode.type === NodeType.CharacterGenerator && toHandleId === 'description_input') {
                    dataToUpdate = { characterDescription: fromNode.data.text };
                } else if (toNode.type === NodeType.ImageGenerator && toHandleId === 'prompt_input') {
                    dataToUpdate = { prompt: fromNode.data.text };
                } else if (toNode.type === NodeType.VideoGenerator && toHandleId === 'prompt_input') {
                    dataToUpdate = { editDescription: fromNode.data.text };
                } else if (toNode.type === NodeType.TextGenerator && toHandleId === 'prompt_input') {
                    dataToUpdate = { prompt: fromNode.data.text };
                } else if (toNode.type === NodeType.StoryCharacterCreator && toHandleId === 'prompt_input') {
                    dataToUpdate = { storyPrompt: fromNode.data.text };
                } else if (toNode.type === NodeType.StoryExpander && toHandleId === 'premise_input') {
                    dataToUpdate = { premise: fromNode.data.text };
                }
            } else if ((fromNode.type === NodeType.CharacterGenerator || fromNode.type === NodeType.ImageEditor || fromNode.type === NodeType.Image) && 'imageUrl' in fromNode.data) {
                 if ((toNode.type === NodeType.ImageEditor || toNode.type === NodeType.VideoGenerator) && toHandleId === 'image_input') {
                    dataToUpdate = { inputImageUrl: fromNode.data.imageUrl };
                }
            } else if (fromNode.type === NodeType.ImageGenerator && fromNode.data.imageUrls) {
                const match = startHandleId.match(/_(\d+)$/);
                if (match) {
                    const imageIndex = parseInt(match[1], 10) - 1;
                    const imageUrlToPropagate = fromNode.data.imageUrls?.[imageIndex];
                    if (imageUrlToPropagate && (toNode.type === NodeType.ImageEditor || toNode.type === NodeType.VideoGenerator) && toHandleId === 'image_input') {
                        dataToUpdate = { inputImageUrl: imageUrlToPropagate };
                    }
                }
            } else if (fromNode.type === NodeType.StoryCharacterCreator && fromNode.data.characters) {
                const match = startHandleId.match(/^character_output_(\d+)$/);
                if (match) {
                    const characterIndex = parseInt(match[1], 10) - 1;
                    const characterDescription = fromNode.data.characters[characterIndex]?.description;
                    if (characterDescription && toNode.type === NodeType.CharacterGenerator && toHandleId === 'description_input') {
                        dataToUpdate = { characterDescription };
                    }
                }
            }
            if (Object.keys(dataToUpdate).length > 0) {
                newNodes[toNodeIndex] = { ...toNode, data: { ...toNode.data, ...dataToUpdate }};
            }
        }
        return { nodes: newNodes, connections: newConnections };
    });
    
    setTempConnectionInfo(null);
  }, [tempConnectionInfo, nodes, setCanvasState]);

  const handleGenerateCharacterImage = useCallback(async (nodeId: string) => {
    const sourceNode = nodes.find(n => n.id === nodeId);
    if (!sourceNode || sourceNode.type !== NodeType.CharacterGenerator || !sourceNode.data.characterDescription) {
      updateNodeData(nodeId, { error: 'Character description cannot be empty.' });
      return;
    }

    updateNodeData(nodeId, { isLoading: true, error: undefined, imageUrl: undefined });
    try {
      const { characterDescription, style, layout, aspectRatio } = sourceNode.data;
      const imageUrl = await generateCharacterSheet(characterDescription!, style!, layout!, aspectRatio!);
      updateNodeData(nodeId, { imageUrl, isLoading: false });
      await persistGalleryItem({
        dataUrl: imageUrl,
        type: 'image',
        prompt: characterDescription,
        nodeType: NodeType.CharacterGenerator,
        nodeId,
      });
    } catch (error) {
      console.error(error);
      const errorMessage = error instanceof Error ? error.message : String(error);
      updateNodeData(nodeId, { error: errorMessage, isLoading: false });
    }
  }, [nodes, updateNodeData, persistGalleryItem]);
  
  const handleGenerateImages = useCallback(async (nodeId: string) => {
    const sourceNode = nodes.find(n => n.id === nodeId);
    if (!sourceNode || sourceNode.type !== NodeType.ImageGenerator || !sourceNode.data.prompt) {
      updateNodeData(nodeId, { error: 'Prompt cannot be empty.' });
      return;
    }

    updateNodeData(nodeId, { isLoading: true, error: undefined, imageUrls: [] });
    try {
      const { prompt, numberOfImages, aspectRatio } = sourceNode.data;
      const imageUrls = await generateImages(prompt, numberOfImages || 1, aspectRatio || '1:1');
      updateNodeData(nodeId, { imageUrls, isLoading: false });
      for (const imageUrl of imageUrls) {
        await persistGalleryItem({
          dataUrl: imageUrl,
          type: 'image',
          prompt,
          nodeType: NodeType.ImageGenerator,
          nodeId,
        });
      }
    } catch (error) {
      console.error(error);
      const errorMessage = error instanceof Error ? error.message : String(error);
      updateNodeData(nodeId, { error: errorMessage, isLoading: false });
    }
  }, [nodes, updateNodeData, persistGalleryItem]);

  const handleGenerateCharacters = useCallback(async (nodeId: string) => {
    const sourceNode = nodes.find(n => n.id === nodeId);
    if (!sourceNode || sourceNode.type !== NodeType.StoryCharacterCreator) {
      return;
    }

    const storyPrompt = sourceNode.data.storyPrompt?.trim();
    if (!storyPrompt) {
      updateNodeData(nodeId, { error: 'Story prompt cannot be empty.' });
      return;
    }

    updateNodeData(nodeId, { isLoading: true, error: undefined, characters: [] });

    try {
      const characters = await generateCharactersFromStory(storyPrompt);
      updateNodeData(nodeId, { characters, isLoading: false });
    } catch (error) {
      console.error(error);
      const errorMessage = error instanceof Error ? error.message : String(error);
      updateNodeData(nodeId, { error: errorMessage, isLoading: false });
    }
  }, [nodes, updateNodeData]);

  const handleExpandStory = useCallback(async (nodeId: string) => {
    const sourceNode = nodes.find(n => n.id === nodeId);
    if (!sourceNode || sourceNode.type !== NodeType.StoryExpander) {
      return;
    }

    const premise = sourceNode.data.premise?.trim();
    if (!premise) {
      updateNodeData(nodeId, { error: 'Story premise cannot be empty.' });
      return;
    }

    updateNodeData(nodeId, { isLoading: true, error: undefined, text: undefined });

    try {
      const expandedStory = await expandStoryFromPremise(
        premise,
        sourceNode.data.length || 'short',
        sourceNode.data.genre
      );
      updateNodeData(nodeId, { text: expandedStory, isLoading: false });
    } catch (error) {
      console.error(error);
      const errorMessage = error instanceof Error ? error.message : String(error);
      updateNodeData(nodeId, { error: errorMessage, isLoading: false });
    }
  }, [nodes, updateNodeData]);

  const handleEditImage = useCallback(async (nodeId: string) => {
    const sourceNode = nodes.find(n => n.id === nodeId);
    if (!sourceNode || sourceNode.type !== NodeType.ImageEditor) return;

    const { inputImageUrl, editDescription } = sourceNode.data;

    if (!inputImageUrl) {
        updateNodeData(nodeId, { error: 'Please connect an input image.' });
        return;
    }
    if (!editDescription) {
        updateNodeData(nodeId, { error: 'Please provide an edit description.' });
        return;
    }

    updateNodeData(nodeId, { isLoading: true, error: undefined, imageUrl: undefined });
    try {
        const editedImageUrl = await editImageWithPrompt(inputImageUrl, editDescription);
        updateNodeData(nodeId, { imageUrl: editedImageUrl, isLoading: false });
        await persistGalleryItem({
          dataUrl: editedImageUrl,
          type: 'image',
          prompt: editDescription,
          nodeType: NodeType.ImageEditor,
          nodeId,
        });
    } catch (error) {
        console.error(error);
        const errorMessage = error instanceof Error ? error.message : String(error);
        updateNodeData(nodeId, { error: errorMessage, isLoading: false });
    }
  }, [nodes, updateNodeData, persistGalleryItem]);

  const handleMixImages = useCallback(async (nodeId: string) => {
    const sourceNode = nodes.find(n => n.id === nodeId);
    if (!sourceNode || sourceNode.type !== NodeType.ImageMixer) return;

    const { editDescription } = sourceNode.data;
    if (!editDescription) {
        updateNodeData(nodeId, { error: 'Please provide a mixing prompt.' });
        return;
    }
    
    // Dynamically find all connected image URLs
    const inputConnections = connections.filter(c => c.toNodeId === nodeId && c.toHandleId === 'image_input');
    const inputImageUrls = inputConnections.flatMap(conn => {
        const sourceNode = nodes.find(n => n.id === conn.fromNodeId);
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

    if (inputImageUrls.length === 0) {
        updateNodeData(nodeId, { error: 'Please connect at least one input image.' });
        return;
    }

    updateNodeData(nodeId, { isLoading: true, error: undefined, imageUrl: undefined });
    try {
        const mixedImageUrl = await mixImagesWithPrompt(inputImageUrls, editDescription);
        updateNodeData(nodeId, { imageUrl: mixedImageUrl, isLoading: false });
        await persistGalleryItem({
          dataUrl: mixedImageUrl,
          type: 'image',
          prompt: editDescription,
          nodeType: NodeType.ImageMixer,
          nodeId,
        });
    } catch (error) {
        console.error(error);
        const errorMessage = error instanceof Error ? error.message : String(error);
        updateNodeData(nodeId, { error: errorMessage, isLoading: false });
    }
  }, [nodes, connections, updateNodeData, persistGalleryItem]);

  const handleGenerateVideo = useCallback(async (nodeId: string) => {
    const sourceNode = nodes.find(n => n.id === nodeId);
    if (!sourceNode || sourceNode.type !== NodeType.VideoGenerator) return;
  
    const { inputImageUrl, editDescription, videoModel } = sourceNode.data;
    
    if (!editDescription) {
        updateNodeData(nodeId, { error: 'Please provide a video prompt.' });
        return;
    }

    const startTime = Date.now();
    updateNodeData(nodeId, {
        isLoading: true,
        error: undefined,
        videoUrl: undefined,
        generationProgressMessage: 'Initializing...',
        generationStartTimeMs: startTime,
        generationElapsedMs: undefined,
    });

    try {
        const onProgress = (message: string) => {
            updateNodeData(nodeId, { generationProgressMessage: message });
        };
        const videoUrl = await generateVideoFromPrompt(editDescription, inputImageUrl, videoModel || 'veo-2.0-generate-001', onProgress);
        const elapsed = Date.now() - startTime;
        updateNodeData(nodeId, {
            videoUrl,
            isLoading: false,
            generationProgressMessage: undefined,
            generationElapsedMs: elapsed,
            generationStartTimeMs: undefined,
        });
        await persistGalleryItem({
          dataUrl: videoUrl,
          type: 'video',
          prompt: editDescription,
          nodeType: NodeType.VideoGenerator,
          nodeId,
        });
    } catch (error) {
        console.error(error);
        const errorMessage = error instanceof Error ? error.message : String(error);
        const elapsed = Date.now() - startTime;
        updateNodeData(nodeId, {
            error: errorMessage,
            isLoading: false,
            generationProgressMessage: undefined,
            generationElapsedMs: elapsed,
            generationStartTimeMs: undefined,
        });
    }
  }, [nodes, updateNodeData, persistGalleryItem]);

  const handleGenerateText = useCallback(async (nodeId: string) => {
    const sourceNode = nodes.find(n => n.id === nodeId);
    if (!sourceNode || sourceNode.type !== NodeType.TextGenerator || !sourceNode.data.prompt) {
      updateNodeData(nodeId, { error: 'Prompt cannot be empty.' });
      return;
    }
  
    updateNodeData(nodeId, { isLoading: true, error: undefined, text: undefined });
    try {
      const { prompt } = sourceNode.data;
      const resultText = await generateTextFromPrompt(prompt!);
      updateNodeData(nodeId, { text: resultText, isLoading: false });
    } catch (error) {
      console.error(error);
      const errorMessage = error instanceof Error ? error.message : String(error);
      updateNodeData(nodeId, { error: errorMessage, isLoading: false });
    }
  }, [nodes, updateNodeData]);

  const requestDeleteNode = (nodeId: string) => {
    setNodeToDelete(nodeId);
  };

  const cancelDeleteNode = () => {
    setNodeToDelete(null);
  };

  const confirmDeleteNode = () => {
    if (!nodeToDelete) return;
    setCanvasState(prevState => ({
        nodes: prevState.nodes.filter(n => n.id !== nodeToDelete),
        connections: prevState.connections.filter(c => c.fromNodeId !== nodeToDelete && c.toNodeId !== nodeToDelete)
    }));
    setNodeToDelete(null);
  };

  const deleteNodeDirectly = (nodeId: string) => {
    setCanvasState(prevState => ({
        nodes: prevState.nodes.filter(n => n.id !== nodeId),
        connections: prevState.connections.filter(c => c.fromNodeId !== nodeId && c.toNodeId !== nodeId)
    }));
  };

  const handleImageClick = useCallback((imageUrl: string) => setModalImageUrl(imageUrl), []);
  const handleCloseModal = useCallback(() => setModalImageUrl(null), []);

  const handleOpenTextModal = useCallback((title: string, text: string) => {
    setTextModalData({ title, text });
  }, []);

  const handleCloseTextModal = useCallback(() => setTextModalData(null), []);

  const isDragging = draggingNodeId !== null || tempConnectionInfo !== null;

  const contextMenuCategories = useMemo(() => {
    if (!contextMenu) {
      return [];
    }

    const position = { x: contextMenu.canvasX, y: contextMenu.canvasY };

    return buildAllNodeMenuCategories({
      onAddTextNode: () => addTextNode(position),
      onAddTextGeneratorNode: () => addTextGeneratorNode(position),
      onAddImageNode: () => addImageNode(position),
      onAddImageGeneratorNode: () => addImageGeneratorNode(position),
      onAddCharacterGeneratorNode: () => addNode(position),
      onAddStoryCharacterCreatorNode: () => addStoryCharacterCreatorNode(position),
      onAddStoryExpanderNode: () => addStoryExpanderNode(position),
      onAddImageEditorNode: () => addImageEditorNode(position),
      onAddImageMixerNode: () => addImageMixerNode(position),
      onAddVideoGeneratorNode: () => addVideoGeneratorNode(position),
    });
  }, [
    contextMenu,
    addTextNode,
    addTextGeneratorNode,
    addImageNode,
    addImageGeneratorNode,
    addNode,
    addStoryCharacterCreatorNode,
    addStoryExpanderNode,
    addImageEditorNode,
    addImageMixerNode,
    addVideoGeneratorNode,
  ]);

  return (
    <div className={`w-screen h-screen ${styles.app.bg} ${styles.app.text} overflow-hidden flex flex-col font-sans ${isDragging ? 'select-none' : ''}`}>
      {showWelcomeModal && <WelcomeModal 
        onStartFresh={handleStartFresh} 
        onLoadTemplate={handleLoadTemplate} 
        onClose={() => setShowWelcomeModal(false)}
        showOnStartup={showWelcomeOnStartup}
        onShowOnStartupChange={setShowWelcomeOnStartup}
      />}
      <Toolbar 
        onNavigateHome={handleNavigateHome}
        onSaveProject={handleSaveProject}
        onLoadProject={handleLoadProject}
        onClearCanvas={handleClearCanvasRequest}
        onAddCharacterGeneratorNode={() => addNode()}
        onAddImageGeneratorNode={() => addImageGeneratorNode()}
        onAddTextNode={() => addTextNode()}
        onAddTextGeneratorNode={() => addTextGeneratorNode()}
        onAddStoryCharacterCreatorNode={() => addStoryCharacterCreatorNode()}
        onAddStoryExpanderNode={() => addStoryExpanderNode()}
        onAddImageNode={() => addImageNode()}
        onAddImageEditorNode={() => addImageEditorNode()}
        onAddImageMixerNode={() => addImageMixerNode()}
        onAddVideoGeneratorNode={() => addVideoGeneratorNode()}
        onUndo={undo}
        onRedo={redo}
        canUndo={canUndo}
        canRedo={canRedo}
      />
       <input
        type="file"
        accept=".json,application/json"
        ref={fileInputRef}
        onChange={handleFileSelected}
        className="hidden"
        aria-hidden="true"
      />
      <div className="absolute top-4 right-4 z-20">
        <ThemeSwitcher />
      </div>
      <div className="absolute bottom-4 right-4 z-20">
        <button 
          onClick={handleOpenSettingsModal}
          className={`w-12 h-12 flex items-center justify-center ${styles.toolbar.bg} backdrop-blur-sm border ${styles.toolbar.border} rounded-full shadow-lg text-gray-400 ${styles.toolbar.buttonHoverBg}`}
          aria-label="Open settings"
        >
          <Settings className="w-6 h-6" />
        </button>
      </div>
      <GalleryPanel
        items={galleryItems}
        status={galleryStatus}
        onDeleteItem={handleDeleteGalleryItem}
        onRefresh={refreshGalleryItems}
        onSelectItem={handleSelectGalleryItem}
        isLoading={isGalleryLoading}
        errorMessage={galleryError}
        videoAutoplayEnabled={videoAutoplayEnabled}
      />
      {isSettingsModalOpen && <SettingsModal
        isOpen={isSettingsModalOpen}
        onClose={handleCloseSettingsModal}
        showWelcomeOnStartup={showWelcomeOnStartup}
        onShowWelcomeOnStartupChange={setShowWelcomeOnStartup}
        videoAutoplayEnabled={videoAutoplayEnabled}
        onVideoAutoplayEnabledChange={setVideoAutoplayEnabled}
      />}

      <Canvas
        ref={canvasRef}
        allNodes={localNodes}
        connections={connections}
        onMouseDown={handleCanvasMouseDown}
        onMouseMove={handleMouseMove}
        onMouseUp={handleMouseUp}
        onWheel={handleWheel}
        onContextMenu={handleContextMenu}
        onNodeDragStart={handleNodeDragStart}
        onUpdateNodeData={updateNodeData}
        onGenerateCharacterImage={handleGenerateCharacterImage}
        onGenerateImages={handleGenerateImages}
        onGenerateText={handleGenerateText}
        onGenerateCharacters={handleGenerateCharacters}
        onExpandStory={handleExpandStory}
        onOpenTextModal={handleOpenTextModal}
        onEditImage={handleEditImage}
        onMixImages={handleMixImages}
        onGenerateVideo={handleGenerateVideo}
        onImageClick={handleImageClick}
        onOutputMouseDown={handleOutputMouseDown}
        onInputMouseDown={handleInputMouseDown}
        onInputMouseUp={handleInputMouseUp}
        onDeleteNode={requestDeleteNode}
        onDeleteNodeDirectly={deleteNodeDirectly}
        onDuplicateNode={duplicateNode}
        onResetNode={resetNode}
        onToggleNodeMinimization={toggleNodeMinimization}
        nodeDimensions={NODE_DIMENSIONS}
        canvasOffset={canvasOffset}
        zoom={zoom}
        tempConnectionInfo={tempConnectionInfo}
        mousePosition={mousePosition}
        hoveredInputHandle={hoveredInputHandle}
        setHoveredInputHandle={setHoveredInputHandle}
      />

      <GalleryPreviewModal item={selectedGalleryItem} onClose={handleCloseGalleryItem} />
      {modalImageUrl && <ImageModal imageUrl={modalImageUrl} onClose={handleCloseModal} />}
      {textModalData && <TextModal isOpen={true} title={textModalData.title} text={textModalData.text} onClose={handleCloseTextModal} />}
      {nodeToDelete && (
        <ConfirmationModal
          isOpen={!!nodeToDelete}
          onConfirm={confirmDeleteNode}
          onCancel={cancelDeleteNode}
          title="Delete Node"
          message="Are you sure you want to delete this node? This action cannot be undone."
        />
      )}
      {isNavigatingHome && (
        <ConfirmationModal
            isOpen={isNavigatingHome}
            onConfirm={confirmNavigateHome}
            onCancel={cancelNavigateHome}
            title="Return Home"
            message="Are you sure you want to return to the home screen? All unsaved changes will be lost."
            confirmText="Return Home"
            confirmButtonClass="bg-cyan-600 hover:bg-cyan-500"
        />
      )}
      {isClearingCanvas && (
        <ConfirmationModal
            isOpen={isClearingCanvas}
            onConfirm={confirmClearCanvas}
            onCancel={cancelClearCanvas}
            title="Clear Canvas"
            message="Are you sure you want to clear the canvas? All unsaved changes will be lost."
            confirmText="Clear Canvas"
        />
      )}
       {isLoadingProject && (
        <ConfirmationModal
          isOpen={isLoadingProject}
          onConfirm={confirmLoadProject}
          onCancel={cancelLoadProject}
          title="Load Project"
          message="Loading a project will replace the current canvas and clear your undo/redo history. Are you sure you want to continue?"
          confirmText="Load Project"
          confirmButtonClass="bg-cyan-600 hover:bg-cyan-500"
        />
      )}
      {contextMenu && (
        <ContextMenuWithSubmenu
          isOpen={contextMenu.isOpen}
          position={{ x: contextMenu.x, y: contextMenu.y }}
          categories={contextMenuCategories}
          onClose={handleCloseContextMenu}
        />
      )}
    </div>
  );
};

export default App;
