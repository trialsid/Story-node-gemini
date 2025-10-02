import React, { useState, useRef, useEffect, useMemo } from 'react';
import { useTheme } from '../contexts/ThemeContext';
import { Home, Eraser, Undo2, Redo2, FileDown, FileUp, Plus, ChevronDown, ScrollText, FolderKanban, Trash2, Save, Copy, Upload, Download } from 'lucide-react';
import { buildNodeMenuCategories, buildStoryToolsCategories } from '../utils/nodeMenuConfig';
import { ProjectMetadata } from '../types';

interface ToolbarProps {
  onNavigateHome: () => void;
  onClearCanvas: () => void;
  onExportProject: () => void | Promise<void> | Promise<boolean>;
  onImportProject: () => void | Promise<void> | Promise<boolean>;
  onSaveProject: () => void | Promise<void> | Promise<boolean>;
  onSaveProjectAs: () => void | Promise<void> | Promise<boolean>;
  onDeleteProject: () => void | Promise<void> | Promise<boolean>;
  onClearCurrentProject: () => void | Promise<void> | Promise<boolean>;
  onSelectProject: (projectId: string) => void | Promise<void> | Promise<boolean>;
  projects: ProjectMetadata[];
  currentProject: ProjectMetadata | null;
  hasUnsavedChanges: boolean;
  isProjectBusy: boolean;
  isProjectListLoading: boolean;
  projectError: string | null;
  onAddCharacterGeneratorNode: () => void;
  onAddImageGeneratorNode: () => void;
  onAddTextNode: () => void;
  onAddTextGeneratorNode: () => void;
  onAddStoryCharacterCreatorNode: () => void;
  onAddCharacterPortfolioNode: () => void;
  onAddStoryExpanderNode: () => void;
  onAddShortStoryWriterNode: () => void;
  onAddScreenplayWriterNode: () => void;
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
    onExportProject,
    onImportProject,
    onCreateProject,
    onSaveProject,
    onSaveProjectAs,
    onDeleteProject,
    onClearCurrentProject,
    onSelectProject,
    projects,
    currentProject,
    hasUnsavedChanges,
    isProjectBusy,
    isProjectListLoading,
    projectError,
    onAddCharacterGeneratorNode, 
    onAddImageGeneratorNode,
    onAddTextNode,
    onAddTextGeneratorNode,
    onAddStoryCharacterCreatorNode,
    onAddCharacterPortfolioNode,
    onAddStoryExpanderNode,
    onAddShortStoryWriterNode,
    onAddScreenplayWriterNode,
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
  const [isProjectMenuOpen, setIsProjectMenuOpen] = useState(false);
  const [isAddMenuOpen, setIsAddMenuOpen] = useState(false);
  const [isStoryToolsMenuOpen, setIsStoryToolsMenuOpen] = useState(false);
  const projectMenuRef = useRef<HTMLDivElement>(null);
  const addMenuRef = useRef<HTMLDivElement>(null);
  const storyToolsMenuRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
        if (projectMenuRef.current && !projectMenuRef.current.contains(event.target as Node)) {
            setIsProjectMenuOpen(false);
        }
        if (addMenuRef.current && !addMenuRef.current.contains(event.target as Node)) {
            setIsAddMenuOpen(false);
        }
        if (storyToolsMenuRef.current && !storyToolsMenuRef.current.contains(event.target as Node)) {
            setIsStoryToolsMenuOpen(false);
        }
    };

    const handleKeyDown = (event: KeyboardEvent) => {
        // Check if user is typing in an input field
        const target = event.target as HTMLElement;
        if (target.tagName === 'INPUT' || target.tagName === 'TEXTAREA' || target.isContentEditable) {
            return;
        }

        // Ctrl+S - Save
        if (event.ctrlKey && !event.shiftKey && event.key === 's') {
            event.preventDefault();
            if (!isProjectBusy) {
                onSaveProject();
            }
        }
        // Ctrl+Shift+S - Save As
        else if (event.ctrlKey && event.shiftKey && event.key === 'S') {
            event.preventDefault();
            if (!isProjectBusy) {
                onSaveProjectAs();
            }
        }
        // Ctrl+N - New Project
        else if (event.ctrlKey && !event.shiftKey && event.key === 'n') {
            event.preventDefault();
            if (!isProjectBusy) {
                onClearCurrentProject();
            }
        }
    };

    document.addEventListener('mousedown', handleClickOutside);
    document.addEventListener('keydown', handleKeyDown);
    return () => {
        document.removeEventListener('mousedown', handleClickOutside);
        document.removeEventListener('keydown', handleKeyDown);
    };
  }, [isProjectBusy, onSaveProject, onSaveProjectAs, onClearCurrentProject]);

  const menuCategories = useMemo(() => buildNodeMenuCategories({
    onAddTextNode,
    onAddTextGeneratorNode,
    onAddImageNode,
    onAddImageGeneratorNode,
    onAddCharacterGeneratorNode,
    onAddStoryCharacterCreatorNode,
    onAddCharacterPortfolioNode,
    onAddStoryExpanderNode,
    onAddShortStoryWriterNode,
    onAddScreenplayWriterNode,
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
    onAddCharacterPortfolioNode,
    onAddStoryExpanderNode,
    onAddShortStoryWriterNode,
    onAddScreenplayWriterNode,
    onAddImageEditorNode,
    onAddImageMixerNode,
    onAddVideoGeneratorNode,
  ]);

  const storyToolsCategories = useMemo(() => buildStoryToolsCategories({
    onAddTextNode,
    onAddTextGeneratorNode,
    onAddImageNode,
    onAddImageGeneratorNode,
    onAddCharacterGeneratorNode,
    onAddStoryCharacterCreatorNode,
    onAddCharacterPortfolioNode,
    onAddStoryExpanderNode,
    onAddShortStoryWriterNode,
    onAddScreenplayWriterNode,
    onAddImageEditorNode,
    onAddImageMixerNode,
    onAddVideoGeneratorNode,
  }), [
    onAddCharacterGeneratorNode,
    onAddStoryCharacterCreatorNode,
    onAddCharacterPortfolioNode,
    onAddStoryExpanderNode,
    onAddShortStoryWriterNode,
    onAddScreenplayWriterNode,
  ]);

  const createProjectActionHandler = (action: () => void | boolean | Promise<void | boolean>) => () => {
    try {
      const result = action();
      if (result && typeof (result as Promise<unknown>).then === 'function') {
        (result as Promise<boolean | void>)
          .then((value) => {
            if (value !== false) {
              setIsProjectMenuOpen(false);
            }
          })
          .catch(() => {
            setIsProjectMenuOpen(false);
          });
      } else if ((result as boolean | void) !== false) {
        setIsProjectMenuOpen(false);
      }
    } catch (error) {
      console.error('Project action failed', error);
      setIsProjectMenuOpen(false);
    }
  };

  return (
    <div className={`absolute top-4 left-4 z-20 p-2 ${styles.toolbar.bg} border ${styles.toolbar.border} rounded-lg shadow-lg`}>
      <div className="flex items-center space-x-1.5">
        {/* Group 1: Projects & Canvas */}
        <div className="relative" ref={projectMenuRef}>
          <button
            onClick={() => setIsProjectMenuOpen(prev => !prev)}
            className={`flex items-center space-x-2 px-3 py-2 ${styles.toolbar.buttonBg} ${styles.toolbar.buttonHoverBg} rounded-md transition-colors text-sm font-medium group`}
            title={currentProject ? currentProject.name : 'Unsaved'}
          >
            <FolderKanban className={`w-5 h-5 ${styles.gallery.accentText}`} />
            <span className={`max-w-[120px] truncate ${styles.toolbar.text}`}>
              {currentProject ? currentProject.name : 'Unsaved'}
              {hasUnsavedChanges && '*'}
            </span>
            <ChevronDown className={`w-4 h-4 ${styles.toolbar.iconColor} transition-transform duration-200 ${isProjectMenuOpen ? 'rotate-180' : ''}`} />
          </button>
          {isProjectMenuOpen && (
            <div
              className={`absolute top-full mt-2 w-64 p-1 ${styles.toolbar.bg} backdrop-blur-sm border ${styles.toolbar.border} rounded-lg shadow-lg z-20`}
              role="menu"
            >
              <div className="px-3 py-2 border-b border-gray-600/40">
                <div className={`text-xs uppercase tracking-wide ${styles.modal.messageText}`}>Current Project</div>
                <div className={`mt-1 flex items-center justify-between text-sm ${styles.toolbar.text}`}>
                  <span className="truncate">
                    {currentProject ? currentProject.name : 'None'}
                  </span>
                  {hasUnsavedChanges && <span className="ml-2 text-amber-400 text-xs">Unsaved</span>}
                </div>
                {isProjectBusy && (
                  <div className={`mt-1 text-xs ${styles.modal.messageText}`}>Working…</div>
                )}
                {projectError && (
                  <div className="mt-1 text-xs text-red-400">{projectError}</div>
                )}
              </div>

              <button
                onClick={createProjectActionHandler(onSaveProject)}
                disabled={isProjectBusy}
                className={`w-full flex items-center justify-between px-3 py-2 text-left ${styles.toolbar.buttonHoverBg} rounded-md transition-colors text-sm font-medium disabled:opacity-50 disabled:cursor-not-allowed ${styles.toolbar.text}`}
              >
                <div className="flex items-center space-x-3">
                  <Save className={`w-4 h-4 ${styles.gallery.accentText}`} />
                  <span>Save{hasUnsavedChanges ? '*' : ''}</span>
                </div>
                <span className={`text-xs ${styles.modal.messageText}`}>Ctrl+S</span>
              </button>
              <button
                onClick={createProjectActionHandler(onSaveProjectAs)}
                disabled={isProjectBusy}
                className={`w-full flex items-center justify-between px-3 py-2 text-left ${styles.toolbar.buttonHoverBg} rounded-md transition-colors text-sm font-medium disabled:opacity-50 disabled:cursor-not-allowed ${styles.toolbar.text}`}
              >
                <div className="flex items-center space-x-3">
                  <Copy className={`w-4 h-4 ${styles.gallery.accentText}`} />
                  <span>Save As…</span>
                </div>
                <span className={`text-xs ${styles.modal.messageText}`}>Ctrl+Shift+S</span>
              </button>
              <button
                onClick={createProjectActionHandler(onClearCurrentProject)}
                disabled={isProjectBusy}
                className={`w-full flex items-center justify-between px-3 py-2 text-left ${styles.toolbar.buttonHoverBg} rounded-md transition-colors text-sm font-medium disabled:opacity-50 disabled:cursor-not-allowed ${styles.toolbar.text}`}
              >
                <div className="flex items-center space-x-3">
                  <Plus className={`w-4 h-4 ${styles.gallery.accentText}`} />
                  <span>New Project</span>
                </div>
                <span className={`text-xs ${styles.modal.messageText}`}>Ctrl+N</span>
              </button>

              <div className="border-t border-gray-600/40 my-1" />

              <button
                onClick={createProjectActionHandler(onExportProject)}
                className={`w-full flex items-center space-x-3 px-3 py-2 text-left ${styles.toolbar.buttonHoverBg} rounded-md transition-colors text-sm font-medium ${styles.toolbar.text}`}
              >
                <Download className={`w-4 h-4 ${styles.toolbar.iconColor}`} />
                <span>Export to File</span>
              </button>
              <button
                onClick={createProjectActionHandler(onImportProject)}
                className={`w-full flex items-center space-x-3 px-3 py-2 text-left ${styles.toolbar.buttonHoverBg} rounded-md transition-colors text-sm font-medium ${styles.toolbar.text}`}
              >
                <Upload className={`w-4 h-4 ${styles.toolbar.iconColor}`} />
                <span>Import from File</span>
              </button>
              <button
                onClick={createProjectActionHandler(onDeleteProject)}
                disabled={!currentProject || isProjectBusy}
                className="w-full flex items-center space-x-3 px-3 py-2 text-left rounded-md transition-colors text-sm font-medium text-red-400 hover:bg-red-500/20 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                <Trash2 className="w-4 h-4" />
                <span>Delete Project</span>
              </button>

              <div className="border-t border-gray-600/40 my-1" />

              <div className={`px-3 py-1 text-xs uppercase tracking-wide ${styles.modal.messageText}`}>
                Switch Project
              </div>
              <div className="max-h-48 overflow-y-auto custom-scrollbar">
                {isProjectListLoading ? (
                  <div className={`px-3 py-2 text-sm ${styles.modal.messageText}`}>Loading projects…</div>
                ) : projects.length === 0 ? (
                  <div className={`px-3 py-2 text-sm ${styles.modal.messageText}`}>No saved projects yet.</div>
                ) : (
                  projects.map(project => (
                    <button
                      key={project.id}
                      onClick={createProjectActionHandler(() => onSelectProject(project.id))}
                      disabled={isProjectBusy}
                      className={`w-full flex items-center justify-between px-3 py-2 text-left ${styles.toolbar.buttonHoverBg} rounded-md transition-colors text-sm font-medium ${currentProject?.id === project.id ? styles.gallery.accentText : styles.toolbar.text} disabled:opacity-50 disabled:cursor-not-allowed`}
                    >
                      <span className="truncate">{project.name}</span>
                      {currentProject?.id === project.id && <span className="text-xs">Current</span>}
                    </button>
                  ))
                )}
              </div>
            </div>
          )}
        </div>
        <ToolbarButton onClick={onNavigateHome} tooltip="Home" className={`${styles.gallery.accentText === 'text-cyan-300' ? 'hover:bg-cyan-500/20' : styles.gallery.accentText === 'text-blue-600' ? 'hover:bg-blue-500/20' : 'hover:bg-amber-500/20'}`}>
            <Home className={`w-5 h-5 ${styles.gallery.accentText}`} />
        </ToolbarButton>
        <ToolbarButton onClick={onClearCanvas} tooltip="Clear Canvas">
            <Eraser className="w-5 h-5 text-red-400" />
        </ToolbarButton>

        <div className="w-px h-6 bg-gray-500/30 mx-1" />

        {/* Group 2: History */}
        <ToolbarButton onClick={onUndo} disabled={!canUndo} tooltip="Undo (Ctrl+Z)">
            <Undo2 className={`w-5 h-5 ${styles.toolbar.iconColor}`} />
        </ToolbarButton>
        <ToolbarButton onClick={onRedo} disabled={!canRedo} tooltip="Redo (Ctrl+Shift+Z)">
            <Redo2 className={`w-5 h-5 ${styles.toolbar.iconColor}`} />
        </ToolbarButton>
        
        <div className="w-px h-6 bg-gray-500/30 mx-1" />

        {/* Group 3: Story Tools Dropdown */}
        <div className="relative" ref={storyToolsMenuRef}>
            <button
                onClick={() => setIsStoryToolsMenuOpen(!isStoryToolsMenuOpen)}
                className={`flex items-center space-x-2 px-3 py-2 ${styles.toolbar.buttonBg} ${styles.toolbar.buttonHoverBg} rounded-md transition-colors text-sm font-medium`}
            >
                <ScrollText className="w-5 h-5 text-purple-500" />
                <span className={styles.toolbar.text}>Story Tools</span>
                <ChevronDown className={`w-4 h-4 ${styles.toolbar.iconColor} transition-transform duration-200 ${isStoryToolsMenuOpen ? 'rotate-180' : ''}`} />
            </button>
            {isStoryToolsMenuOpen && (
                <div
                    className={`absolute top-full mt-2 w-56 p-1 ${styles.toolbar.bg} backdrop-blur-sm border ${styles.toolbar.border} rounded-lg shadow-lg z-10`}
                    role="menu"
                >
                    {storyToolsCategories.map((category, categoryIndex) => (
                        <div key={category.title}>
                            <div className={`px-3 py-1 text-xs font-semibold uppercase tracking-wide ${styles.modal.messageText}`}>
                                {category.title}
                            </div>
                            {category.items.map((item) => (
                                <button
                                    key={item.label}
                                    onClick={() => {
                                        item.action();
                                        setIsStoryToolsMenuOpen(false);
                                    }}
                                    className={`w-full flex items-center space-x-3 px-3 py-2 text-left ${styles.toolbar.buttonHoverBg} rounded-md transition-colors text-sm font-medium ${styles.toolbar.text}`}
                                    role="menuitem"
                                >
                                    {item.icon}
                                    <span>{item.label}</span>
                                </button>
                            ))}
                            {categoryIndex < storyToolsCategories.length - 1 && (
                                <div className="h-px bg-gray-500/20 my-1" aria-hidden="true" />
                            )}
                        </div>
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
                <Plus className={`w-5 h-5 ${styles.toolbar.iconColor}`} />
                <span className={styles.toolbar.text}>Add Node</span>
                <ChevronDown className={`w-4 h-4 ${styles.toolbar.iconColor} transition-transform duration-200 ${isAddMenuOpen ? 'rotate-180' : ''}`} />
            </button>
            {isAddMenuOpen && (
                <div 
                    className={`absolute top-full mt-2 w-56 p-1 ${styles.toolbar.bg} backdrop-blur-sm border ${styles.toolbar.border} rounded-lg shadow-lg z-10`}
                    role="menu"
                >
                    {menuCategories.map((category, categoryIndex) => (
                        <div key={category.title}>
                            <div className={`px-3 py-1 text-xs font-semibold uppercase tracking-wide ${styles.modal.messageText}`}>
                                {category.title}
                            </div>
                            {category.items.map((item) => (
                                <button
                                    key={item.label}
                                    onClick={() => {
                                        item.action();
                                        setIsAddMenuOpen(false);
                                    }}
                                    className={`w-full flex items-center space-x-3 px-3 py-2 text-left ${styles.toolbar.buttonHoverBg} rounded-md transition-colors text-sm font-medium ${styles.toolbar.text}`}
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
