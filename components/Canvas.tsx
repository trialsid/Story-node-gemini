
import React, { forwardRef } from 'react';
import { NodeData, Connection, NodeType } from '../types';
import Node from './Node';
import Connector from './Connector';
import { useTheme } from '../contexts/ThemeContext';

interface CanvasProps {
  nodes: NodeData[];
  connections: Connection[];
  onMouseDown: (e: React.MouseEvent) => void;
  onMouseMove: (e: React.MouseEvent) => void;
  onMouseUp: (e: React.MouseEvent) => void;
  onWheel: (e: React.WheelEvent) => void;
  onNodeDragStart: (nodeId: string, e: React.MouseEvent) => void;
  onUpdateNodeData: (nodeId: string, data: Partial<NodeData['data']>) => void;
  onGenerateImage: (nodeId: string) => void;
  onEditImage: (nodeId: string) => void;
  onImageClick: (imageUrl: string) => void;
  onOutputMouseDown: (nodeId: string) => void;
  onInputMouseDown: (nodeId: string) => void;
  onInputMouseUp: (nodeId: string) => void;
  onDeleteNode: (nodeId: string) => void;
  onToggleNodeMinimization: (nodeId: string) => void;
  nodeDimensions: { [key in NodeType]: { width: number; height?: number } };
  canvasOffset: { x: number; y: number };
  zoom: number;
  tempConnectionStartNodeId: string | null;
  mousePosition: { x: number; y: number };
}

const Canvas = forwardRef<HTMLDivElement, CanvasProps>(({
  nodes,
  connections,
  onMouseDown,
  onMouseMove,
  onMouseUp,
  onWheel,
  onNodeDragStart,
  onUpdateNodeData,
  onGenerateImage,
  onEditImage,
  onImageClick,
  onOutputMouseDown,
  onInputMouseDown,
  onInputMouseUp,
  onDeleteNode,
  onToggleNodeMinimization,
  nodeDimensions,
  canvasOffset,
  zoom,
  tempConnectionStartNodeId,
  mousePosition,
}, ref) => {
  const { styles } = useTheme();
  const baseGridSize = 24;

  const getNodeHandlePosition = (node: NodeData, handleType: 'input' | 'output'): { x: number; y: number } => {
    const dims = nodeDimensions[node.type];
    if (handleType === 'output') {
        if (node.type === NodeType.Text) {
            // Text node height is now dynamic, use calculated offset
            const yOffset = node.data.outputHandleYOffset || 90; // Fallback for initial render
            return { x: node.position.x + dims.width, y: node.position.y + yOffset };
        }
        if (node.type === NodeType.CharacterGenerator || node.type === NodeType.ImageEditor) {
            // The vertical offset is calculated dynamically in Node.tsx.
            // A fallback is provided for the initial render before the effect runs.
            const yOffset = node.data.outputHandleYOffset || (node.type === NodeType.CharacterGenerator ? 368 : 428);
            return { x: node.position.x + dims.width, y: node.position.y + yOffset };
        }
    }
    
    if (handleType === 'input') {
        if (node.type === NodeType.CharacterGenerator) {
            // Fallback aligns with the "Character Description" textarea
            const yOffset = node.data.inputHandleYOffset || 228;
            return { x: node.position.x, y: node.position.y + yOffset };
        }
        if (node.type === NodeType.ImageEditor) {
             // Fallback aligns with the "Input Image" preview
            const yOffset = node.data.inputHandleYOffset || 78;
            return { x: node.position.x, y: node.position.y + yOffset };
        }
    }
    return node.position;
  };

  const tempConnectionStartNode = nodes.find(n => n.id === tempConnectionStartNodeId);
  let tempConnectionPath = null;
  if (tempConnectionStartNode) {
    const fromPos = getNodeHandlePosition(tempConnectionStartNode, 'output');
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
            onImageClick={onImageClick}
            onOutputMouseDown={onOutputMouseDown}
            onInputMouseDown={onInputMouseDown}
            onInputMouseUp={onInputMouseUp}
            onDelete={onDeleteNode}
            onToggleMinimize={onToggleNodeMinimization}
            dimensions={nodeDimensions[node.type]}
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
                  const fromPos = getNodeHandlePosition(fromNode, 'output');
                  const toPos = getNodeHandlePosition(toNode, 'input');
                  return <Connector key={conn.id} from={fromPos} to={toPos} color={styles.connector.color} />;
              })}
              {tempConnectionPath}
          </g>
      </svg>
    </div>
  );
});

Canvas.displayName = "Canvas";

export default Canvas;
