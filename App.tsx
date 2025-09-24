import React, { useState, useCallback, useRef, useEffect } from 'react';
import { NodeData, NodeType, Connection, CanvasState, HandleType } from './types';
import Canvas from './components/Canvas';
import Toolbar from './components/Toolbar';
import ImageModal from './components/ImageModal';
import ConfirmationModal from './components/ConfirmationModal';
import { generateCharacterSheet, editImageWithPrompt, generateVideoFromPrompt, generateTextFromPrompt, generateImages, mixImagesWithPrompt } from './services/geminiService';
import { useTheme } from './contexts/ThemeContext';
import ThemeSwitcher from './components/ThemeSwitcher';
import GalleryPanel from './components/GalleryPanel';
import WelcomeModal from './components/WelcomeModal';
import { templates } from './utils/templates';
import ContextMenu, { ContextMenuAction } from './components/ContextMenu';
import ImageIcon from './components/icons/ImageIcon';
import TextIcon from './components/icons/TextIcon';
import EditIcon from './components/icons/EditIcon';
import VideoIcon from './components/icons/VideoIcon';
import UploadIcon from './components/icons/UploadIcon';
import SettingsModal from './components/SettingsModal';
import SettingsIcon from './components/icons/SettingsIcon';
import { useHistory } from './hooks/useHistory';
import { NODE_SPEC, areHandlesCompatible } from './utils/node-spec';
import BotIcon from './components/icons/BotIcon';
import MixerIcon from './components/icons/MixerIcon';


const NODE_DIMENSIONS: { [key in NodeType]: { width: number; height?: number } } = {
  [NodeType.CharacterGenerator]: { width: 256 },
  [NodeType.ImageGenerator]: { width: 256 },
  [NodeType.Text]: { width: 256 },
  [NodeType.ImageEditor]: { width: 256 },
  [NodeType.VideoGenerator]: { width: 256 },
  [NodeType.Image]: { width: 256 },
  [NodeType.TextGenerator]: { width: 256 },
  [NodeType.ImageMixer]: { width: 256 },
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

  const [showWelcomeOnStartup, setShowWelcomeOnStartup] = useState(() => {
    const setting = localStorage.getItem('showWelcomeOnStartup');
    return setting === null || setting === 'true';
  });


  const { styles } = useTheme();

  useEffect(() => {
    localStorage.setItem('showWelcomeOnStartup', String(showWelcomeOnStartup));
  }, [showWelcomeOnStartup]);

  useEffect(() => {
    if (showWelcomeOnStartup) {
      setShowWelcomeModal(true);
    }
  }, []);

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
        
        if ((fromNode.type === NodeType.Text || fromNode.type === NodeType.TextGenerator) && 'text' in fromNode.data) {
          if (toNode.type === NodeType.CharacterGenerator && conn.toHandleId === 'description_input') {
              dataToUpdate = { characterDescription: fromNode.data.text };
          } else if (toNode.type === NodeType.ImageGenerator && conn.toHandleId === 'prompt_input') {
              dataToUpdate = { prompt: fromNode.data.text };
          } else if (toNode.type === NodeType.VideoGenerator && conn.toHandleId === 'prompt_input') {
              dataToUpdate = { editDescription: fromNode.data.text };
          } else if (toNode.type === NodeType.TextGenerator && conn.toHandleId === 'prompt_input') {
              dataToUpdate = { prompt: fromNode.data.text };
          }
        }
        
        if ((fromNode.type === NodeType.CharacterGenerator || fromNode.type === NodeType.ImageEditor || fromNode.type === NodeType.Image) && 'imageUrl' in fromNode.data) {
          if ((toNode.type === NodeType.ImageEditor || toNode.type === NodeType.VideoGenerator || toNode.type === NodeType.ImageMixer) && conn.toHandleId === 'image_input') {
              dataToUpdate = { inputImageUrl: fromNode.data.imageUrl };
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
      data: {
        characterDescription: 'A brave knight with a scar over his left eye',
        style: 'Studio Portrait Photo',
        layout: 'T-pose reference sheet',
        aspectRatio: '1:1',
      },
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
      data: {
        prompt: 'A photorealistic cat astronaut on Mars',
        numberOfImages: 1,
        aspectRatio: '1:1',
      },
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
      data: { text: 'A futuristic cityscape at dusk.' },
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
      data: { },
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
      data: { editDescription: 'Add a golden crown' },
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
      data: { editDescription: 'A photorealistic blend of the input images' },
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
      data: {
        editDescription: 'A majestic eagle soaring over mountains',
        videoModel: 'veo-2.0-generate-001',
      },
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
      data: { prompt: 'Write a short story about a robot who discovers music.' },
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

  const updateNodeData = useCallback((nodeId: string, data: Partial<NodeData['data']>) => {
    setCanvasState((prevState) => {
        let newNodes = [...prevState.nodes];
        const nodeIndex = newNodes.findIndex(n => n.id === nodeId);
        if (nodeIndex === -1) return prevState;
        
        const updatedNode = { ...newNodes[nodeIndex], data: { ...newNodes[nodeIndex].data, ...data } };
        newNodes[nodeIndex] = updatedNode;

        prevState.connections.forEach(conn => {
            if (conn.fromNodeId === nodeId) {
                const toNodeIndex = newNodes.findIndex(n => n.id === conn.toNodeId);
                if (toNodeIndex === -1) return;

                const toNode = newNodes[toNodeIndex];
                let dataToUpdate: Partial<NodeData['data']> = {};
                
                if ((updatedNode.type === NodeType.Text || updatedNode.type === NodeType.TextGenerator) && 'text' in data) {
                    if (toNode.type === NodeType.CharacterGenerator && conn.toHandleId === 'description_input') {
                        dataToUpdate = { characterDescription: data.text };
                    } else if (toNode.type === NodeType.ImageGenerator && conn.toHandleId === 'prompt_input') {
                        dataToUpdate = { prompt: data.text };
                    } else if (toNode.type === NodeType.VideoGenerator && conn.toHandleId === 'prompt_input') {
                        dataToUpdate = { editDescription: data.text };
                    } else if (toNode.type === NodeType.TextGenerator && conn.toHandleId === 'prompt_input') {
                      dataToUpdate = { prompt: data.text };
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

                if (Object.keys(dataToUpdate).length > 0) {
                    newNodes[toNodeIndex] = { ...toNode, data: { ...toNode.data, ...dataToUpdate }};
                }
            }
        });
        return { ...prevState, nodes: newNodes };
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
    const handleSpec = NODE_SPEC[node.type].outputs.find(h => h.id === handleId);
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
        const fromHandleSpec = NODE_SPEC[fromNode.type].outputs.find(h => h.id === connection.fromHandleId);
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

    const toHandleSpec = NODE_SPEC[toNode.type].inputs.find(h => h.id === toHandleId);
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

            if ((fromNode.type === NodeType.Text || fromNode.type === NodeType.TextGenerator) && 'text' in fromNode.data) {
                if (toNode.type === NodeType.CharacterGenerator && toHandleId === 'description_input') {
                    dataToUpdate = { characterDescription: fromNode.data.text };
                } else if (toNode.type === NodeType.ImageGenerator && toHandleId === 'prompt_input') {
                    dataToUpdate = { prompt: fromNode.data.text };
                } else if (toNode.type === NodeType.VideoGenerator && toHandleId === 'prompt_input') {
                    dataToUpdate = { editDescription: fromNode.data.text };
                } else if (toNode.type === NodeType.TextGenerator && toHandleId === 'prompt_input') {
                    dataToUpdate = { prompt: fromNode.data.text };
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
    } catch (error) {
      console.error(error);
      const errorMessage = error instanceof Error ? error.message : String(error);
      updateNodeData(nodeId, { error: errorMessage, isLoading: false });
    }
  }, [nodes, updateNodeData]);
  
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
    } catch (error) {
        console.error(error);
        const errorMessage = error instanceof Error ? error.message : String(error);
        updateNodeData(nodeId, { error: errorMessage, isLoading: false });
    }
  }, [nodes, updateNodeData]);

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
    } catch (error) {
        console.error(error);
        const errorMessage = error instanceof Error ? error.message : String(error);
        updateNodeData(nodeId, { error: errorMessage, isLoading: false });
    }
  }, [nodes, connections, updateNodeData]);

  const handleGenerateVideo = useCallback(async (nodeId: string) => {
    const sourceNode = nodes.find(n => n.id === nodeId);
    if (!sourceNode || sourceNode.type !== NodeType.VideoGenerator) return;
  
    const { inputImageUrl, editDescription, videoModel } = sourceNode.data;
    
    if (!editDescription) {
        updateNodeData(nodeId, { error: 'Please provide a video prompt.' });
        return;
    }
  
    updateNodeData(nodeId, { isLoading: true, error: undefined, videoUrl: undefined, generationProgressMessage: 'Initializing...'});
  
    try {
        const onProgress = (message: string) => {
            updateNodeData(nodeId, { generationProgressMessage: message });
        };
        const videoUrl = await generateVideoFromPrompt(editDescription, inputImageUrl, videoModel || 'veo-2.0-generate-001', onProgress);
        updateNodeData(nodeId, { videoUrl, isLoading: false, generationProgressMessage: undefined });
    } catch (error) {
        console.error(error);
        const errorMessage = error instanceof Error ? error.message : String(error);
        updateNodeData(nodeId, { error: errorMessage, isLoading: false, generationProgressMessage: undefined });
    }
  }, [nodes, updateNodeData]);

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

  const handleImageClick = useCallback((imageUrl: string) => setModalImageUrl(imageUrl), []);
  const handleCloseModal = useCallback(() => setModalImageUrl(null), []);

  const isDragging = draggingNodeId !== null || tempConnectionInfo !== null;

  const contextMenuActions: ContextMenuAction[] = contextMenu ? [
    // Basic Input
    {
      label: 'Text',
      icon: <TextIcon className="w-5 h-5 text-yellow-400" />,
      action: () => addTextNode({ x: contextMenu.canvasX, y: contextMenu.canvasY }),
    },
    {
      label: 'Text Generator',
      icon: <BotIcon className="w-5 h-5 text-indigo-400" />,
      action: () => addTextGeneratorNode({ x: contextMenu.canvasX, y: contextMenu.canvasY }),
    },
    // Image-related
    {
      label: 'Image',
      icon: <UploadIcon className="w-5 h-5 text-orange-400" />,
      action: () => addImageNode({ x: contextMenu.canvasX, y: contextMenu.canvasY }),
    },
    {
      label: 'Image Gen',
      icon: <ImageIcon className="w-5 h-5 text-blue-400" />,
      action: () => addImageGeneratorNode({ x: contextMenu.canvasX, y: contextMenu.canvasY }),
    },
    {
      label: 'Character Gen',
      icon: <ImageIcon className="w-5 h-5 text-cyan-400" />,
      action: () => addNode({ x: contextMenu.canvasX, y: contextMenu.canvasY }),
    },
    {
      label: 'Image Editor',
      icon: <EditIcon className="w-5 h-5 text-purple-400" />,
      action: () => addImageEditorNode({ x: contextMenu.canvasX, y: contextMenu.canvasY }),
    },
    {
        label: 'Image Mixer',
        icon: <MixerIcon className="w-5 h-5 text-pink-400" />,
        action: () => addImageMixerNode({ x: contextMenu.canvasX, y: contextMenu.canvasY }),
    },
    // Video-related
    {
      label: 'Video Gen',
      icon: <VideoIcon className="w-5 h-5 text-green-400" />,
      action: () => addVideoGeneratorNode({ x: contextMenu.canvasX, y: contextMenu.canvasY }),
    },
  ] : [];

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
        onAddNode={() => addNode()}
        onAddImageGeneratorNode={() => addImageGeneratorNode()}
        onAddTextNode={() => addTextNode()}
        onAddTextGeneratorNode={() => addTextGeneratorNode()}
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
          <SettingsIcon className="w-6 h-6" />
        </button>
      </div>
      <GalleryPanel />
      {isSettingsModalOpen && <SettingsModal 
        isOpen={isSettingsModalOpen} 
        onClose={handleCloseSettingsModal}
        showWelcomeOnStartup={showWelcomeOnStartup}
        onShowWelcomeOnStartupChange={setShowWelcomeOnStartup}
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
        onEditImage={handleEditImage}
        onMixImages={handleMixImages}
        onGenerateVideo={handleGenerateVideo}
        onImageClick={handleImageClick}
        onOutputMouseDown={handleOutputMouseDown}
        onInputMouseDown={handleInputMouseDown}
        onInputMouseUp={handleInputMouseUp}
        onDeleteNode={requestDeleteNode}
        onToggleNodeMinimization={toggleNodeMinimization}
        nodeDimensions={NODE_DIMENSIONS}
        canvasOffset={canvasOffset}
        zoom={zoom}
        tempConnectionInfo={tempConnectionInfo}
        mousePosition={mousePosition}
        hoveredInputHandle={hoveredInputHandle}
        setHoveredInputHandle={setHoveredInputHandle}
      />

      {modalImageUrl && <ImageModal imageUrl={modalImageUrl} onClose={handleCloseModal} />}
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
        <ContextMenu 
          isOpen={contextMenu.isOpen} 
          position={{ x: contextMenu.x, y: contextMenu.y }} 
          actions={contextMenuActions} 
          onClose={handleCloseContextMenu}
        />
      )}
    </div>
  );
};

export default App;