import React from 'react';

const KeyboardIcon: React.FC<{className?: string}> = ({ className }) => (
  <svg
    xmlns="http://www.w3.org/2000/svg"
    className={className}
    fill="none"
    viewBox="0 0 24 24"
    stroke="currentColor"
    strokeWidth={2}
  >
    <path 
      strokeLinecap="round" 
      strokeLinejoin="round" 
      d="M8 17l4 4 4-4m-4-5v5m0 0l4-4m-4 4l-4-4m4-5V3a1 1 0 011-1h2a1 1 0 011 1v4m-3 2h2m-2 4h2M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" 
    />
  </svg>
);

export default KeyboardIcon;
