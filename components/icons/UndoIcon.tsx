import React from 'react';

const UndoIcon: React.FC<{className?: string}> = ({ className }) => (
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
      d="M11 15l-3-3m0 0l3-3m-3 3h8a5 5 0 000-10H9"
    />
  </svg>
);

export default UndoIcon;
