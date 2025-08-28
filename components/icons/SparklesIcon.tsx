
import React from 'react';

const SparklesIcon: React.FC<{className?: string}> = ({ className }) => (
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
      d="M5 3v4M3 5h4M6 17v4m-2-2h4m5-16l2.293 2.293a1 1 0 010 1.414L10 16l-4 4-4-4 5.293-5.293a1 1 0 011.414 0L10 12m0 0l2.293 2.293a1 1 0 010 1.414L10 16m-2-2l2.293-2.293a1 1 0 011.414 0L10 12m10-5l-2.293 2.293a1 1 0 01-1.414 0L14 7m2-2l2.293 2.293a1 1 0 010 1.414L16 12m-2-2l2.293-2.293a1 1 0 011.414 0L20 10"
    />
  </svg>
);

export default SparklesIcon;
