import React, { forwardRef } from 'react';
import { NodeData } from '../types';
import Node from './Node';

interface CanvasProps {
  nodes: NodeData[];
  onMouseMove: (e: React.MouseEvent) => void;
  onMouseUp: (e: React.MouseEvent) => void;
  onNodeDragStart: (nodeId: string, e: React.MouseEvent) => void;
  onUpdateNodeData: (nodeId: string, data: Partial<NodeData['data']>) => void;
  onGenerateImage: (nodeId: string) => void;
  onImageClick: (imageUrl: string) => void;
  nodeDimensions: {
      NODE_WIDTH: number;
      NODE_HEIGHT: number;
  };
}

const Canvas = forwardRef<HTMLDivElement, CanvasProps>(({
  nodes,
  onMouseMove,
  onMouseUp,
  onNodeDragStart,
  onUpdateNodeData,
  onGenerateImage,
  onImageClick,
  nodeDimensions
}, ref) => {

  return (
    <div
      ref={ref}
      className="flex-grow relative w-full h-full cursor-grab active:cursor-grabbing"
      style={{
        backgroundImage: 'radial-gradient(circle at 1px 1px, #4A5568 1px, transparent 0)',
        backgroundSize: '24px 24px',
      }}
      onMouseMove={onMouseMove}
      onMouseUp={onMouseUp}
    >
      {nodes.map((node) => (
        <Node
          key={node.id}
          node={node}
          onDragStart={onNodeDragStart}
          onUpdateData={onUpdateNodeData}
          onGenerateImage={onGenerateImage}
          onImageClick={onImageClick}
          dimensions={{
              width: nodeDimensions.NODE_WIDTH,
              height: nodeDimensions.NODE_HEIGHT
          }}
        />
      ))}
    </div>
  );
});

Canvas.displayName = "Canvas";

export default Canvas;
