
import React, { forwardRef } from 'react';
import { NodeData, Connection, NodeType } from '../types';
import Node from './Node';
import Connector from './Connector';

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
  nodeDimensions: { [key in NodeType]: { width: number; height: number } };
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
  nodeDimensions,
  canvasOffset,
  zoom,
  tempConnectionStartNodeId,
  mousePosition,
}, ref) => {

  const baseGridSize = 24;

  const getNodeHandlePosition = (node: NodeData, handleType: 'input' | 'output'): { x: number; y: number } => {
    const dims = nodeDimensions[node.type];
    if (handleType === 'output') {
        if (node.type === NodeType.Text) {
            return { x: node.position.x + dims.width, y: node.position.y + dims.height / 2 };
        }
        if (node.type === NodeType.CharacterGenerator) {
            // Vertically centered on the output image preview
            return { x: node.position.x + dims.width, y: node.position.y + 434 + 8 };
        }
    }
    
    if (handleType === 'input') {
        if (node.type === NodeType.CharacterGenerator) {
            // Aligned with the "Character Description" textarea
            return { x: node.position.x, y: node.position.y + 220 + 8 };
        }
        if (node.type === NodeType.ImageEditor) {
            // Aligned with the "Input Image" preview
            return { x: node.position.x, y: node.position.y + 70 + 8 };
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
    tempConnectionPath = <Connector from={fromPos} to={toPos} isTemporary />;
  }

  return (
    <div
      ref={ref}
      className="flex-grow relative w-full h-full cursor-grab active:cursor-grabbing overflow-hidden"
      style={{
        backgroundImage: 'radial-gradient(circle at 1px 1px, #4A5568 1px, transparent 0)',
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
                  return <Connector key={conn.id} from={fromPos} to={toPos} />;
              })}
              {tempConnectionPath}
          </g>
      </svg>
    </div>
  );
});

Canvas.displayName = "Canvas";

export default Canvas;