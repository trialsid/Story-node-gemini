import React, { useState, useRef, useEffect, useMemo } from 'react';
import { useTheme } from '../contexts/ThemeContext';
import { Home, Eraser, Undo2, Redo2, FileDown, FileUp, Plus, ChevronDown, ScrollText } from 'lucide-react';
import { buildNodeMenuCategories, buildStoryToolsCategory } from '../utils/nodeMenuConfig';

interface ToolbarProps {
  onNavigateHome: () => void;
  onClearCanvas: () => void;
  onSaveProject: () => void;
  onLoadProject: () => void;
  onAddCharacterGeneratorNode: () => void;
  onAddImageGeneratorNode: () => void;
  onAddTextNode: () => void;
  onAddTextGeneratorNode: () => void;
  onAddStoryCharacterCreatorNode: () => void;
  onAddStoryExpanderNode: () => void;
  onAddShortStoryWriterNode: () => void;
  onAddImageNode: () => void;
  onAddImageEditorNode: () => void;
  onAddImageMixerNode: () => void;
  onAddVideoGeneratorNode: () => void;
  onUndo: () => void;
  onRedo: () => void;
  canUndo: boolean;
  canRedo: boolean;
}

const ToolbarButton: React.FC<{ 
    onClick: () => void; 
    children: React.ReactNode; 
    tooltip: string; 
    disabled?: boolean; 
    className?: string;
}> = ({ onClick, children, tooltip, disabled = false, className = '' }) => {
    const { styles } = useTheme();
    return (
        <button
            onClick={onClick}
            disabled={disabled}
            className={`flex items-center justify-center p-2.5 ${styles.toolbar.buttonBg} ${styles.toolbar.buttonHoverBg} rounded-md transition-colors text-sm font-medium disabled:opacity-50 disabled:cursor-not-allowed relative group ${className}`}
            aria-label={tooltip}
        >
            {children}
            <span className="absolute top-full mt-2 w-max bg-gray-900 text-white text-xs rounded py-1 px-2 opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none z-10">
                {tooltip}
            </span>
        </button>
    )
};

const Toolbar: React.FC<ToolbarProps> = ({ 
    onNavigateHome, 
    onClearCanvas, 
    onSaveProject,
    onLoadProject,
    onAddCharacterGeneratorNode, 
    onAddImageGeneratorNode,
    onAddTextNode,
    onAddTextGeneratorNode,
    onAddStoryCharacterCreatorNode,
    onAddStoryExpanderNode,
    onAddShortStoryWriterNode,
    onAddImageNode,
    onAddImageEditorNode, 
    onAddImageMixerNode,
    onAddVideoGeneratorNode,
    onUndo,
    onRedo,
    canUndo,
    canRedo,
}) => {
  const { styles } = useTheme();
  const [isAddMenuOpen, setIsAddMenuOpen] = useState(false);
  const [isStoryToolsMenuOpen, setIsStoryToolsMenuOpen] = useState(false);
  const addMenuRef = useRef<HTMLDivElement>(null);
  const storyToolsMenuRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
        if (addMenuRef.current && !addMenuRef.current.contains(event.target as Node)) {
            setIsAddMenuOpen(false);
        }
        if (storyToolsMenuRef.current && !storyToolsMenuRef.current.contains(event.target as Node)) {
            setIsStoryToolsMenuOpen(false);
        }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const menuCategories = useMemo(() => buildNodeMenuCategories({
    onAddTextNode,
    onAddTextGeneratorNode,
    onAddImageNode,
    onAddImageGeneratorNode,
    onAddCharacterGeneratorNode,
    onAddStoryCharacterCreatorNode,
    onAddStoryExpanderNode,
    onAddImageEditorNode,
    onAddImageMixerNode,
    onAddVideoGeneratorNode,
  }), [
    onAddTextNode,
    onAddTextGeneratorNode,
    onAddImageNode,
    onAddImageGeneratorNode,
    onAddCharacterGeneratorNode,
    onAddStoryCharacterCreatorNode,
    onAddStoryExpanderNode,
    onAddImageEditorNode,
    onAddImageMixerNode,
    onAddVideoGeneratorNode,
  ]);

  const storyToolsCategory = useMemo(() => buildStoryToolsCategory({
    onAddTextNode,
    onAddTextGeneratorNode,
    onAddImageNode,
    onAddImageGeneratorNode,
    onAddCharacterGeneratorNode,
    onAddStoryCharacterCreatorNode,
    onAddStoryExpanderNode,
    onAddShortStoryWriterNode,
    onAddImageEditorNode,
    onAddImageMixerNode,
    onAddVideoGeneratorNode,
  }), [
    onAddCharacterGeneratorNode,
    onAddStoryCharacterCreatorNode,
    onAddStoryExpanderNode,
    onAddShortStoryWriterNode,
  ]);

  return (
    <div className={`absolute top-4 left-4 z-20 p-2 ${styles.toolbar.bg} border ${styles.toolbar.border} rounded-lg shadow-lg`}>
      <div className="flex items-center space-x-1.5">
        {/* Group 1: Project & Canvas */}
        <ToolbarButton onClick={onNavigateHome} tooltip="Home" className="hover:bg-cyan-500/20">
            <Home className="w-5 h-5 text-cyan-400" />
        </ToolbarButton>
        <ToolbarButton onClick={onSaveProject} tooltip="Save Project">
            <FileDown className="w-5 h-5 text-gray-300" />
        </ToolbarButton>
        <ToolbarButton onClick={onLoadProject} tooltip="Load Project">
            <FileUp className="w-5 h-5 text-gray-300" />
        </ToolbarButton>
        <ToolbarButton onClick={onClearCanvas} tooltip="Clear Canvas">
            <Eraser className="w-5 h-5 text-red-400" />
        </ToolbarButton>
        
        <div className="w-px h-6 bg-gray-500/30 mx-1" />

        {/* Group 2: History */}
        <ToolbarButton onClick={onUndo} disabled={!canUndo} tooltip="Undo (Ctrl+Z)">
            <Undo2 className="w-5 h-5 text-gray-300" />
        </ToolbarButton>
        <ToolbarButton onClick={onRedo} disabled={!canRedo} tooltip="Redo (Ctrl+Shift+Z)">
            <Redo2 className="w-5 h-5 text-gray-300" />
        </ToolbarButton>
        
        <div className="w-px h-6 bg-gray-500/30 mx-1" />

        {/* Group 3: Story Tools Dropdown */}
        <div className="relative" ref={storyToolsMenuRef}>
            <button
                onClick={() => setIsStoryToolsMenuOpen(!isStoryToolsMenuOpen)}
                className={`flex items-center space-x-2 px-3 py-2 ${styles.toolbar.buttonBg} ${styles.toolbar.buttonHoverBg} rounded-md transition-colors text-sm font-medium`}
            >
                <ScrollText className="w-5 h-5 text-purple-400" />
                <span>Story Tools</span>
                <ChevronDown className={`w-4 h-4 text-gray-400 transition-transform duration-200 ${isStoryToolsMenuOpen ? 'rotate-180' : ''}`} />
            </button>
            {isStoryToolsMenuOpen && (
                <div
                    className={`absolute top-full mt-2 w-56 p-1 ${styles.toolbar.bg} backdrop-blur-sm border ${styles.toolbar.border} rounded-lg shadow-lg z-10`}
                    role="menu"
                >
                    <div className="px-3 py-1 text-xs font-semibold uppercase tracking-wide text-gray-400/80">
                        {storyToolsCategory.title}
                    </div>
                    {storyToolsCategory.items.map((item) => (
                        <button
                            key={item.label}
                            onClick={() => {
                                item.action();
                                setIsStoryToolsMenuOpen(false);
                            }}
                            className={`w-full flex items-center space-x-3 px-3 py-2 text-left ${styles.toolbar.buttonHoverBg} rounded-md transition-colors text-sm font-medium`}
                            role="menuitem"
                        >
                            {item.icon}
                            <span>{item.label}</span>
                        </button>
                    ))}
                </div>
            )}
        </div>

        {/* Group 4: Add Node Dropdown */}
        <div className="relative" ref={addMenuRef}>
            <button
                onClick={() => setIsAddMenuOpen(!isAddMenuOpen)}
                className={`flex items-center space-x-2 px-3 py-2 ${styles.toolbar.buttonBg} ${styles.toolbar.buttonHoverBg} rounded-md transition-colors text-sm font-medium`}
            >
                <Plus className="w-5 h-5 text-gray-300" />
                <span>Add Node</span>
                <ChevronDown className={`w-4 h-4 text-gray-400 transition-transform duration-200 ${isAddMenuOpen ? 'rotate-180' : ''}`} />
            </button>
            {isAddMenuOpen && (
                <div 
                    className={`absolute top-full mt-2 w-56 p-1 ${styles.toolbar.bg} backdrop-blur-sm border ${styles.toolbar.border} rounded-lg shadow-lg z-10`}
                    role="menu"
                >
                    {menuCategories.map((category, categoryIndex) => (
                        <div key={category.title}>
                            <div className="px-3 py-1 text-xs font-semibold uppercase tracking-wide text-gray-400/80">
                                {category.title}
                            </div>
                            {category.items.map((item) => (
                                <button
                                    key={item.label}
                                    onClick={() => {
                                        item.action();
                                        setIsAddMenuOpen(false);
                                    }}
                                    className={`w-full flex items-center space-x-3 px-3 py-2 text-left ${styles.toolbar.buttonHoverBg} rounded-md transition-colors text-sm font-medium`}
                                    role="menuitem"
                                >
                                    {item.icon}
                                    <span>{item.label}</span>
                                </button>
                            ))}
                            {categoryIndex < menuCategories.length - 1 && (
                                <div className="h-px bg-gray-500/20 my-1" aria-hidden="true" />
                            )}
                        </div>
                    ))}
                </div>
            )}
        </div>
      </div>
    </div>
  );
};

export default Toolbar;
