import React, { forwardRef } from 'react';
import { NodeData, Connection, NodeType, HandleType } from '../types';
import Node from './Node';
import Connector from './Connector';
import { useTheme } from '../contexts/ThemeContext';
import { NODE_SPEC } from '../utils/node-spec';

interface TempConnectionInfo {
  startNodeId: string;
  startHandleId: string;
  startHandleType: HandleType;
}

interface HoveredInputInfo {
  nodeId: string;
  handleId: string;
}

interface CanvasProps {
  nodes: NodeData[];
  connections: Connection[];
  onMouseDown: (e: React.MouseEvent) => void;
  onMouseMove: (e: React.MouseEvent) => void;
  onMouseUp: (e: React.MouseEvent) => void;
  onWheel: (e: React.WheelEvent) => void;
  onContextMenu: (e: React.MouseEvent) => void;
  onNodeDragStart: (nodeId: string, e: React.MouseEvent) => void;
  onUpdateNodeData: (nodeId: string, data: Partial<NodeData['data']>) => void;
  onGenerateImage: (nodeId: string) => void;
  onEditImage: (nodeId: string) => void;
  onGenerateVideo: (nodeId: string) => void;
  onImageClick: (imageUrl: string) => void;
  onOutputMouseDown: (nodeId: string, handleId: string) => void;
  onInputMouseDown: (nodeId: string, handleId: string) => void;
  onInputMouseUp: (nodeId: string, handleId: string) => void;
  onDeleteNode: (nodeId: string) => void;
  onToggleNodeMinimization: (nodeId: string) => void;
  nodeDimensions: { [key in NodeType]: { width: number; height?: number } };
  canvasOffset: { x: number; y: number };
  zoom: number;
  tempConnectionInfo: TempConnectionInfo | null;
  mousePosition: { x: number; y: number };
  hoveredInputHandle: HoveredInputInfo | null;
  setHoveredInputHandle: (info: HoveredInputInfo | null) => void;
}

// Define minimized node heights for consistent handle positioning
const MINIMIZED_NODE_HEADER_HEIGHT = 40; // Corresponds to p-2 padding and text size in NodeHeader


const Canvas = forwardRef<HTMLDivElement, CanvasProps>(({
  nodes,
  connections,
  onMouseDown,
  onMouseMove,
  onMouseUp,
  onWheel,
  onContextMenu,
  onNodeDragStart,
  onUpdateNodeData,
  onGenerateImage,
  onEditImage,
  onGenerateVideo,
  onImageClick,
  onOutputMouseDown,
  onInputMouseDown,
  onInputMouseUp,
  onDeleteNode,
  onToggleNodeMinimization,
  nodeDimensions,
  canvasOffset,
  zoom,
  tempConnectionInfo,
  mousePosition,
  hoveredInputHandle,
  setHoveredInputHandle,
}, ref) => {
  const { styles } = useTheme();
  const baseGridSize = 24;

  const getNodeHandlePosition = (node: NodeData, handleId: string, handleSide: 'input' | 'output'): { x: number; y: number } => {
    const dims = nodeDimensions[node.type];
    const isMinimized = node.data.isMinimized;
    const yOffset = node.data.handleYOffsets?.[handleId];

    const xPos = handleSide === 'input' ? node.position.x : node.position.x + dims.width;

    if (isMinimized) {
        const headerHeight = MINIMIZED_NODE_HEADER_HEIGHT;
        const previewHeight = node.data.minimizedHeight || 64;
        
        const spec = NODE_SPEC[node.type];
        const handles = handleSide === 'input' ? spec.inputs : spec.outputs;
        const handleIndex = handles.findIndex(h => h.id === handleId);
        const totalHandles = handles.length;

        if (handleIndex === -1 || totalHandles === 0) {
            return { x: xPos, y: node.position.y + headerHeight + (previewHeight / 2) };
        }

        const yPosition = headerHeight + (previewHeight * (handleIndex + 1)) / (totalHandles + 1);
        return { x: xPos, y: node.position.y + yPosition };
    }
    

    if (yOffset !== undefined) {
        return { x: xPos, y: node.position.y + yOffset };
    }
    
    // Fallback if offset is not calculated yet
    return { x: xPos, y: node.position.y + 100 };
  };

  const tempConnectionStartNode = nodes.find(n => n.id === tempConnectionInfo?.startNodeId);
  let tempConnectionPath = null;
  if (tempConnectionInfo && tempConnectionStartNode) {
    const fromPos = getNodeHandlePosition(tempConnectionStartNode, tempConnectionInfo.startHandleId, 'output');
    const toPos = {
      x: (mousePosition.x - canvasOffset.x) / zoom,
      y: (mousePosition.y - canvasOffset.y) / zoom,
    };
    tempConnectionPath = <Connector from={fromPos} to={toPos} isTemporary color={styles.connector.tempColor} />;
  }

  return (
    <div
      ref={ref}
      className="flex-grow relative w-full h-full cursor-grab active:cursor-grabbing overflow-hidden"
      style={{
        backgroundImage: `radial-gradient(circle at 1px 1px, ${styles.canvas.grid} 1px, transparent 0)`,
        backgroundSize: `${baseGridSize * zoom}px ${baseGridSize * zoom}px`,
        backgroundPosition: `${canvasOffset.x}px ${canvasOffset.y}px`,
      }}
      onMouseDown={onMouseDown}
      onMouseMove={onMouseMove}
      onMouseUp={onMouseUp}
      onWheel={onWheel}
      onContextMenu={onContextMenu}
    >
      <div 
        className="absolute top-0 left-0"
        style={{ 
          transform: `translate(${canvasOffset.x}px, ${canvasOffset.y}px) scale(${zoom})`,
          transformOrigin: '0 0',
        }}
      >
        {nodes.map((node) => (
          <Node
            key={node.id}
            node={node}
            connections={connections}
            onDragStart={onNodeDragStart}
            onUpdateData={onUpdateNodeData}
            onGenerateImage={onGenerateImage}
            onEditImage={onEditImage}
            onGenerateVideo={onGenerateVideo}
            onImageClick={onImageClick}
            onOutputMouseDown={onOutputMouseDown}
            onInputMouseDown={onInputMouseDown}
            onInputMouseUp={onInputMouseUp}
            onDelete={onDeleteNode}
            onToggleMinimize={onToggleNodeMinimization}
            dimensions={nodeDimensions[node.type]}
            tempConnectionInfo={tempConnectionInfo}
            hoveredInputHandle={hoveredInputHandle}
            setHoveredInputHandle={setHoveredInputHandle}
          />
        ))}
      </div>
      <svg className="absolute top-0 left-0 w-full h-full pointer-events-none z-0">
          <g style={{
              transform: `translate(${canvasOffset.x}px, ${canvasOffset.y}px) scale(${zoom})`,
              transformOrigin: '0 0',
          }}>
              {connections.map(conn => {
                  const fromNode = nodes.find(n => n.id === conn.fromNodeId);
                  const toNode = nodes.find(n => n.id === conn.toNodeId);
                  if (!fromNode || !toNode) return null;

                  const fromPos = getNodeHandlePosition(fromNode, conn.fromHandleId, 'output');
                  const toPos = getNodeHandlePosition(toNode, conn.toHandleId, 'input');
                  
                  const isPendingReplacement = tempConnectionInfo !== null &&
                    conn.toNodeId === hoveredInputHandle?.nodeId &&
                    conn.toHandleId === hoveredInputHandle?.handleId;

                  const fromHandleSpec = NODE_SPEC[fromNode.type].outputs.find(h => h.id === conn.fromHandleId);
                  if (!fromHandleSpec) return null;
                  const connectorColor = styles.handle.typeColors[fromHandleSpec.type].split(' ')[0].replace('bg-', 'border-');

                  return <Connector 
                            key={conn.id} 
                            from={fromPos} 
                            to={toPos} 
                            color={styles.connector.color}
                            isPendingReplacement={isPendingReplacement}
                         />;
              })}
              {tempConnectionPath}
          </g>
      </svg>
    </div>
  );
});

Canvas.displayName = "Canvas";

export default Canvas;