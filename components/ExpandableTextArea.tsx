import React, { useRef, useEffect, useState } from 'react';
import { useTheme } from '../contexts/ThemeContext';
import ExpandIcon from './icons/ExpandIcon';

interface ExpandableTextAreaProps {
  value: string;
  placeholder: string;
  className: string;
  title: string;
  containerClassName?: string;
  onOpenModal: (title: string, text: string) => void;
}

const ExpandableTextArea: React.FC<ExpandableTextAreaProps> = ({
  value,
  placeholder,
  className,
  title,
  containerClassName = '',
  onOpenModal,
}) => {
  const { styles } = useTheme();
  const [hasScroll, setHasScroll] = useState(false);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  // Check if textarea has scrollable content
  useEffect(() => {
    const checkScroll = () => {
      if (textareaRef.current && value) {
        const { scrollHeight, clientHeight } = textareaRef.current;
        setHasScroll(scrollHeight > clientHeight);
      } else {
        setHasScroll(false);
      }
    };

    checkScroll();
    // Re-check when content changes
    const timeout = setTimeout(checkScroll, 100);
    return () => clearTimeout(timeout);
  }, [value]);

  const handleExpandClick = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    onOpenModal(title, value);
  };

  return (
    <div className={`relative ${containerClassName}`}>
      <textarea
        ref={textareaRef}
        readOnly
        value={value}
        className={className}
        placeholder={placeholder}
      />

      {/* Expand button - only show if there's scrollable content */}
      {hasScroll && (
        <button
          onClick={handleExpandClick}
          className={`absolute bottom-1 left-1 p-1 ${styles.node.inputBg} hover:${styles.node.inputBorder} border ${styles.node.border} rounded opacity-70 hover:opacity-100 transition-opacity`}
          title={`Expand ${title.toLowerCase()}`}
        >
          <ExpandIcon className="w-3 h-3 text-gray-400" />
        </button>
      )}

    </div>
  );
};

export default ExpandableTextArea;