import React, { useState, useCallback, useRef, useEffect } from 'react';
import { NodeData, NodeType, Connection } from './types';
import Canvas from './components/Canvas';
import Toolbar from './components/Toolbar';
import ImageModal from './components/ImageModal';
import ConfirmationModal from './components/ConfirmationModal';
import { generateImageFromPrompt, editImageWithPrompt, generateVideoFromPrompt } from './services/geminiService';
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

const NODE_DIMENSIONS: { [key in NodeType]: { width: number; height?: number } } = {
  [NodeType.CharacterGenerator]: { width: 256 },
  [NodeType.Text]: { width: 256 },
  [NodeType.ImageEditor]: { width: 256 },
  [NodeType.VideoGenerator]: { width: 256 },
  [NodeType.Image]: { width: 256 },
};

interface DragStartInfo {
  startMouseX: number;
  startMouseY: number;
  startNodeX: number;
  startNodeY: number;
}

const App: React.FC = () => {
  const [nodes, setNodes] = useState<NodeData[]>([]);
  const [connections, setConnections] = useState<Connection[]>([]);
  const [draggingNodeId, setDraggingNodeId] = useState<string | null>(null);
  const [dragStartInfo, setDragStartInfo] = useState<DragStartInfo | null>(null);
  const [modalImageUrl, setModalImageUrl] = useState<string | null>(null);
  const [tempConnectionStartNodeId, setTempConnectionStartNodeId] = useState<string | null>(null);
  const [mousePosition, setMousePosition] = useState({ x: 0, y: 0 });
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


  const { styles } = useTheme();

  useEffect(() => {
    const setting = localStorage.getItem('showWelcomeOnStartup');
    if (setting === null || setting === 'true') {
      setShowWelcomeModal(true);
    }
  }, []);

  const handleStartFresh = useCallback(() => {
    setNodes([]);
    setConnections([]);
    setShowWelcomeModal(false);
  }, []);
  
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
            id: `conn_${newFromId}_${newToId}`,
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
        
        if (fromNode.type === NodeType.Text && 'text' in fromNode.data) {
          if (toNode.type === NodeType.CharacterGenerator) dataToUpdate = { characterDescription: fromNode.data.text };
          else if (toNode.type === NodeType.VideoGenerator) dataToUpdate = { editDescription: fromNode.data.text };
        }
        
        if ((fromNode.type === NodeType.CharacterGenerator || fromNode.type === NodeType.ImageEditor || fromNode.type === NodeType.Image) && 'imageUrl' in fromNode.data) {
          if (toNode.type === NodeType.ImageEditor || toNode.type === NodeType.VideoGenerator) dataToUpdate = { inputImageUrl: fromNode.data.imageUrl };
        }

        if (Object.keys(dataToUpdate).length > 0) {
            propagatedNodes[toNodeIndex] = { ...toNode, data: { ...toNode.data, ...dataToUpdate } };
        }
      });
      return propagatedNodes;
    };
    
    const finalNodes = propagateInitialData(newNodes, newConnections);
    setNodes(finalNodes);
    setConnections(newConnections);
    setShowWelcomeModal(false);
  }, []);

  const handleNavigateHome = useCallback(() => {
    if (nodes.length > 0) {
        setIsNavigatingHome(true);
    } else {
        setShowWelcomeModal(true);
    }
  }, [nodes.length]);

  const confirmNavigateHome = () => {
    setNodes([]);
    setConnections([]);
    setShowWelcomeModal(true);
    setIsNavigatingHome(false);
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
    setNodes([]);
    setConnections([]);
    setIsClearingCanvas(false);
  };

  const cancelClearCanvas = () => {
    setIsClearingCanvas(false);
  };

  const addNode = useCallback((pos?: { x: number; y: number }) => {
    const newNode: NodeData = {
      id: `node_${Date.now()}_${Math.random().toString(36).substring(2, 9)}`,
      type: NodeType.CharacterGenerator,
      position: pos || { x: (150 - canvasOffset.x) / zoom, y: (150 - canvasOffset.y) / zoom },
      data: {
        characterDescription: 'A brave knight with a scar over his left eye',
        style: 'Studio Portrait Photo',
        layout: 'T-pose reference sheet',
        aspectRatio: '1:1',
      },
    };
    setNodes((prevNodes) => [...prevNodes, newNode]);
  }, [canvasOffset, zoom]);

  const addTextNode = useCallback((pos?: { x: number; y: number }) => {
    const newNode: NodeData = {
      id: `node_${Date.now()}_${Math.random().toString(36).substring(2, 9)}`,
      type: NodeType.Text,
      position: pos || { x: (150 - canvasOffset.x) / zoom, y: (150 - canvasOffset.y) / zoom },
      data: { text: 'A futuristic cityscape at dusk.' },
    };
    setNodes((prevNodes) => [...prevNodes, newNode]);
  }, [canvasOffset, zoom]);
  
  const addImageNode = useCallback((pos?: { x: number; y: number }) => {
    const newNode: NodeData = {
      id: `node_${Date.now()}_${Math.random().toString(36).substring(2, 9)}`,
      type: NodeType.Image,
      position: pos || { x: (150 - canvasOffset.x) / zoom, y: (150 - canvasOffset.y) / zoom },
      data: { },
    };
    setNodes((prevNodes) => [...prevNodes, newNode]);
  }, [canvasOffset, zoom]);

  const addImageEditorNode = useCallback((pos?: { x: number; y: number }) => {
    const newNode: NodeData = {
      id: `node_${Date.now()}_${Math.random().toString(36).substring(2, 9)}`,
      type: NodeType.ImageEditor,
      position: pos || { x: (150 - canvasOffset.x) / zoom, y: (150 - canvasOffset.y) / zoom },
      data: { editDescription: 'Add a golden crown' },
    };
    setNodes((prevNodes) => [...prevNodes, newNode]);
  }, [canvasOffset, zoom]);

  const addVideoGeneratorNode = useCallback((pos?: { x: number; y: number }) => {
    const newNode: NodeData = {
      id: `node_${Date.now()}_${Math.random().toString(36).substring(2, 9)}`,
      type: NodeType.VideoGenerator,
      position: pos || { x: (150 - canvasOffset.x) / zoom, y: (150 - canvasOffset.y) / zoom },
      data: {
        editDescription: 'A majestic eagle soaring over mountains',
        videoModel: 'veo-2.0-generate-001',
      },
    };
    setNodes((prevNodes) => [...prevNodes, newNode]);
  }, [canvasOffset, zoom]);
  
  const toggleNodeMinimization = useCallback((nodeId: string) => {
    setNodes(prevNodes =>
      prevNodes.map(node =>
        node.id === nodeId
          ? { ...node, data: { ...node.data, isMinimized: !node.data.isMinimized } }
          : node
      )
    );
  }, []);

  const updateNodeData = useCallback((nodeId: string, data: Partial<NodeData['data']>) => {
    setNodes((currentNodes) => {
        let newNodes = [...currentNodes];
        const nodeIndex = newNodes.findIndex(n => n.id === nodeId);
        if (nodeIndex === -1) return currentNodes;
        
        const updatedNode = { ...newNodes[nodeIndex], data: { ...newNodes[nodeIndex].data, ...data } };
        newNodes[nodeIndex] = updatedNode;

        connections.forEach(conn => {
            if (conn.fromNodeId === nodeId) {
                const toNodeIndex = newNodes.findIndex(n => n.id === conn.toNodeId);
                if (toNodeIndex === -1) return;

                const toNode = newNodes[toNodeIndex];
                
                // Propagate text
                if (updatedNode.type === NodeType.Text && 'text' in data) {
                  if (toNode.type === NodeType.CharacterGenerator) {
                      newNodes[toNodeIndex] = { ...toNode, data: { ...toNode.data, characterDescription: data.text } };
                  } else if (toNode.type === NodeType.VideoGenerator) {
                      newNodes[toNodeIndex] = { ...toNode, data: { ...toNode.data, editDescription: data.text } };
                  }
                }
                
                // Propagate image
                if ((updatedNode.type === NodeType.CharacterGenerator || updatedNode.type === NodeType.ImageEditor || updatedNode.type === NodeType.Image) && 'imageUrl' in data) {
                  if (toNode.type === NodeType.ImageEditor || toNode.type === NodeType.VideoGenerator) {
                      newNodes[toNodeIndex] = { ...toNode, data: { ...toNode.data, inputImageUrl: data.imageUrl } };
                  }
                }
            }
        });
        return newNodes;
    });
  }, [connections]);

  const handleNodeDragStart = useCallback((nodeId: string, e: React.MouseEvent) => {
    setDraggingNodeId(nodeId);
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
      setNodes((prevNodes) =>
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
    setDraggingNodeId(null);
    setDragStartInfo(null);
    setIsPanning(false);
    setTempConnectionStartNodeId(null); // Cancel connection on mouse up
  }, []);
  
  const handleCanvasMouseDown = useCallback((e: React.MouseEvent) => {
    if (contextMenu?.isOpen) {
      setContextMenu(null);
    }
    if (e.target === e.currentTarget) {
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

  const handleOutputMouseDown = useCallback((nodeId: string) => {
    setConnections(prev => prev.filter(c => c.fromNodeId !== nodeId));
    setTempConnectionStartNodeId(nodeId);
  }, []);

  const handleInputMouseDown = useCallback((nodeId: string) => {
    const connection = connections.find(c => c.toNodeId === nodeId);
    if (connection) {
        setConnections(prev => prev.filter(c => c.id !== connection.id));
        setTempConnectionStartNodeId(connection.fromNodeId);
    }
  }, [connections]);

  const handleInputMouseUp = useCallback((toNodeId: string) => {
    if (!tempConnectionStartNodeId) return;

    const fromNode = nodes.find(n => n.id === tempConnectionStartNodeId);
    const toNode = nodes.find(n => n.id === toNodeId);

    if (!fromNode || !toNode || fromNode.id === toNode.id) {
        setTempConnectionStartNodeId(null);
        return;
    }

    // Connection validation
    const isTextToCharGen = fromNode.type === NodeType.Text && toNode.type === NodeType.CharacterGenerator;
    const isCharGenToImageEditor = fromNode.type === NodeType.CharacterGenerator && toNode.type === NodeType.ImageEditor;
    const isImageEditorToImageEditor = fromNode.type === NodeType.ImageEditor && toNode.type === NodeType.ImageEditor;
    const isImageToVideoGen = (fromNode.type === NodeType.CharacterGenerator || fromNode.type === NodeType.ImageEditor || fromNode.type === NodeType.Image) && toNode.type === NodeType.VideoGenerator;
    const isImageToImageEditor = fromNode.type === NodeType.Image && toNode.type === NodeType.ImageEditor;
    const isTextToVideoGen = fromNode.type === NodeType.Text && toNode.type === NodeType.VideoGenerator;

    if (!isTextToCharGen && !isCharGenToImageEditor && !isImageEditorToImageEditor && !isImageToVideoGen && !isTextToVideoGen && !isImageToImageEditor) {
        setTempConnectionStartNodeId(null);
        return;
    }
    
    if(connections.some(c => c.toNodeId === toNodeId)){
        setTempConnectionStartNodeId(null);
        return;
    }

    const newConnection: Connection = {
      id: `conn_${tempConnectionStartNodeId}_${toNodeId}`,
      fromNodeId: tempConnectionStartNodeId,
      toNodeId: toNodeId,
    };
    
    setConnections(prev => [...prev.filter(c => c.toNodeId !== toNodeId && c.fromNodeId !== tempConnectionStartNodeId), newConnection]);
    
    // Update target node's data immediately based on connection type
    if (isTextToCharGen) {
      updateNodeData(toNodeId, { characterDescription: fromNode.data.text });
    } else if (isImageToVideoGen || isCharGenToImageEditor || isImageEditorToImageEditor || isImageToImageEditor) {
        updateNodeData(toNodeId, { inputImageUrl: fromNode.data.imageUrl });
    } else if (isTextToVideoGen) {
        updateNodeData(toNodeId, { editDescription: fromNode.data.text });
    }
    
    setTempConnectionStartNodeId(null);
  }, [tempConnectionStartNodeId, nodes, connections, updateNodeData]);

  const handleGenerateImage = useCallback(async (nodeId: string) => {
    const sourceNode = nodes.find(n => n.id === nodeId);
    if (!sourceNode || sourceNode.type !== NodeType.CharacterGenerator || !sourceNode.data.characterDescription) {
      updateNodeData(nodeId, { error: 'Character description cannot be empty.' });
      return;
    }

    updateNodeData(nodeId, { isLoading: true, error: undefined, imageUrl: undefined });
    try {
      const { characterDescription, style, layout, aspectRatio } = sourceNode.data;
      const imageUrl = await generateImageFromPrompt(characterDescription!, style!, layout!, aspectRatio!);
      updateNodeData(nodeId, { imageUrl, isLoading: false });
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

  const requestDeleteNode = (nodeId: string) => {
    setNodeToDelete(nodeId);
  };

  const cancelDeleteNode = () => {
    setNodeToDelete(null);
  };

  const confirmDeleteNode = () => {
    if (!nodeToDelete) return;
    setNodes(prevNodes => prevNodes.filter(n => n.id !== nodeToDelete));
    setConnections(prevConnections =>
      prevConnections.filter(c => c.fromNodeId !== nodeToDelete && c.toNodeId !== nodeToDelete)
    );
    setNodeToDelete(null);
  };

  const handleImageClick = useCallback((imageUrl: string) => setModalImageUrl(imageUrl), []);
  const handleCloseModal = useCallback(() => setModalImageUrl(null), []);

  const isDragging = draggingNodeId !== null || tempConnectionStartNodeId !== null;

  const contextMenuActions: ContextMenuAction[] = contextMenu ? [
    {
      label: 'Character Gen',
      icon: <ImageIcon className="w-5 h-5 text-cyan-400" />,
      action: () => addNode({ x: contextMenu.canvasX, y: contextMenu.canvasY }),
    },
    {
      label: 'Text',
      icon: <TextIcon className="w-5 h-5 text-yellow-400" />,
      action: () => addTextNode({ x: contextMenu.canvasX, y: contextMenu.canvasY }),
    },
    {
      label: 'Image',
      icon: <UploadIcon className="w-5 h-5 text-orange-400" />,
      action: () => addImageNode({ x: contextMenu.canvasX, y: contextMenu.canvasY }),
    },
    {
      label: 'Image Editor',
      icon: <EditIcon className="w-5 h-5 text-purple-400" />,
      action: () => addImageEditorNode({ x: contextMenu.canvasX, y: contextMenu.canvasY }),
    },
    {
      label: 'Video Gen',
      icon: <VideoIcon className="w-5 h-5 text-green-400" />,
      action: () => addVideoGeneratorNode({ x: contextMenu.canvasX, y: contextMenu.canvasY }),
    },
  ] : [];

  return (
    <div className={`w-screen h-screen ${styles.app.bg} ${styles.app.text} overflow-hidden flex flex-col font-sans ${isDragging ? 'select-none' : ''}`}>
      {showWelcomeModal && <WelcomeModal onStartFresh={handleStartFresh} onLoadTemplate={handleLoadTemplate} onClose={() => setShowWelcomeModal(false)} />}
      <Toolbar 
        onNavigateHome={handleNavigateHome}
        onClearCanvas={handleClearCanvasRequest}
        onAddNode={() => addNode()} 
        onAddTextNode={() => addTextNode()} 
        onAddImageNode={() => addImageNode()} 
        onAddImageEditorNode={() => addImageEditorNode()} 
        onAddVideoGeneratorNode={() => addVideoGeneratorNode()} 
      />
      <ThemeSwitcher />
      <GalleryPanel />
      <Canvas
        ref={canvasRef}
        nodes={nodes}
        connections={connections}
        onMouseDown={handleCanvasMouseDown}
        onMouseMove={handleMouseMove}
        onMouseUp={handleMouseUp}
        onWheel={handleWheel}
        onContextMenu={handleContextMenu}
        onNodeDragStart={handleNodeDragStart}
        onUpdateNodeData={updateNodeData}
        onGenerateImage={handleGenerateImage}
        onEditImage={handleEditImage}
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
        tempConnectionStartNodeId={tempConnectionStartNodeId}
        mousePosition={mousePosition}
      />
      <ContextMenu
        isOpen={!!contextMenu?.isOpen}
        position={{ x: contextMenu?.x || 0, y: contextMenu?.y || 0 }}
        actions={contextMenuActions}
        onClose={handleCloseContextMenu}
      />
      <ImageModal imageUrl={modalImageUrl} onClose={handleCloseModal} />
      <ConfirmationModal
        isOpen={!!nodeToDelete}
        onConfirm={confirmDeleteNode}
        onCancel={cancelDeleteNode}
        title="Delete Node"
        message="Are you sure you want to delete this node and all of its connections? This action cannot be undone."
      />
      <ConfirmationModal
        isOpen={isNavigatingHome}
        onConfirm={confirmNavigateHome}
        onCancel={cancelNavigateHome}
        title="Start a New Project?"
        message="Returning to the home screen will clear your current canvas. Are you sure you want to continue?"
        confirmText="Continue"
        confirmButtonClass="bg-cyan-600 hover:bg-cyan-500"
      />
      <ConfirmationModal
        isOpen={isClearingCanvas}
        onConfirm={confirmClearCanvas}
        onCancel={cancelClearCanvas}
        title="Clear Canvas?"
        message="This will remove all nodes and connections from your canvas. This action cannot be undone. Are you sure you want to proceed?"
        confirmText="Clear"
      />
    </div>
  );
};

export default App;
