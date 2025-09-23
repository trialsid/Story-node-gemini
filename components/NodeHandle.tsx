import React from 'react';
import { useTheme } from '../contexts/ThemeContext';
import { HandleType } from '../types';

interface NodeHandleProps {
  onMouseDown?: (e: React.MouseEvent) => void;
  onMouseUp?: (e: React.MouseEvent) => void;
  onMouseEnter?: (e: React.MouseEvent) => void;
  onMouseLeave?: (e: React.MouseEvent) => void;
  isConnected: boolean;
  style: React.CSSProperties;
  type: HandleType;
  isBeingDraggedOver: boolean;
  isValidTarget: boolean;
}

const NodeHandle: React.FC<NodeHandleProps> = ({
  onMouseDown,
  onMouseUp,
  onMouseEnter,
  onMouseLeave,
  isConnected,
  style,
  type,
  isBeingDraggedOver,
  isValidTarget,
}) => {
  const { styles } = useTheme();
  
  const baseClasses = `absolute w-4 h-4 rounded-full transition-all duration-150 ease-in-out z-10`;

  const typeColorClasses = styles.handle.typeColors[type];
  
  let stateClasses = '';

  if (isBeingDraggedOver) {
    if (isValidTarget) {
      // Valid target: glow effect
      stateClasses = `ring-4 ring-green-500/50 scale-125 ${typeColorClasses}`;
    } else {
      // Invalid target: dimmed, no interactions
      stateClasses = `bg-gray-600 border-2 border-gray-500 opacity-50 cursor-not-allowed`;
    }
  } else if (isConnected) {
    // Connected: solid color
    stateClasses = `border-2 ${typeColorClasses} cursor-crosshair`;
  } else {
    // Unconnected (default): hollow
    stateClasses = `bg-transparent border-2 ${typeColorClasses.split(' ')[1]} hover:${typeColorClasses.split(' ')[0]} cursor-crosshair`;
  }

  return (
    <div
      className={`${baseClasses} ${stateClasses}`}
      style={style}
      onMouseDown={(e) => {
        if (isBeingDraggedOver && !isValidTarget) return;
        e.stopPropagation();
        onMouseDown?.(e);
      }}
      onMouseUp={(e) => {
        if (isBeingDraggedOver && !isValidTarget) return;
        e.stopPropagation();
        onMouseUp?.(e);
      }}
      onMouseEnter={(e) => {
        if (isBeingDraggedOver && !isValidTarget) return;
        onMouseEnter?.(e);
      }}
      onMouseLeave={(e) => {
        onMouseLeave?.(e);
      }}
      aria-label="Node handle"
    />
  );
};

export default NodeHandle;
