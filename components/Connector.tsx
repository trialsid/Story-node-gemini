
import React from 'react';

interface ConnectorProps {
  from: { x: number; y: number };
  to: { x: number; y: number };
  isTemporary?: boolean;
}

const Connector: React.FC<ConnectorProps> = ({ from, to, isTemporary = false }) => {
  const controlPointOffset = Math.max(75, Math.abs(to.x - from.x) * 0.4);
  const pathData = `M ${from.x} ${from.y} C ${from.x + controlPointOffset} ${from.y}, ${to.x - controlPointOffset} ${to.y}, ${to.x} ${to.y}`;

  return (
    <path
      d={pathData}
      stroke={isTemporary ? '#F6E05E' : '#2DD4BF'} // yellow-300 : teal-400
      strokeWidth="3"
      fill="none"
      strokeDasharray={isTemporary ? '4 4' : 'none'}
      style={{ animation: isTemporary ? 'dash 1s linear infinite' : 'none' }}
    />
  );
};

export default Connector;
