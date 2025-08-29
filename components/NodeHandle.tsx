
import React from 'react';

interface NodeHandleProps {
  onMouseDown?: (e: React.MouseEvent) => void;
  onMouseUp?: (e: React.MouseEvent) => void;
  isConnected: boolean;
  style: React.CSSProperties;
}

const NodeHandle: React.FC<NodeHandleProps> = ({ onMouseDown, onMouseUp, isConnected, style }) => {
  const baseClasses = "absolute w-4 h-4 rounded-full border-2 border-gray-400 bg-gray-600 hover:bg-cyan-500 hover:border-cyan-400 transition-colors cursor-crosshair z-10";
  const connectedClasses = isConnected ? 'bg-cyan-500 border-cyan-400' : '';

  return (
    <div
      className={`${baseClasses} ${connectedClasses}`}
      style={style}
      onMouseDown={(e) => {
        e.stopPropagation();
        onMouseDown?.(e);
      }}
      onMouseUp={(e) => {
        e.stopPropagation();
        onMouseUp?.(e);
      }}
      aria-label="Node handle"
    />
  );
};

export default NodeHandle;
