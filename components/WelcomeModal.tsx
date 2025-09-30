import React, { useState, useEffect } from 'react';
import { useTheme } from '../contexts/ThemeContext';
import { templates } from '../utils/templates';
import { ProjectMetadata } from '../types';
import { Image, Clapperboard, Users as UsersIcon, Layers, Plus, X, Settings, Home, Clock, BookOpen, Palette, Trash2, Loader2 } from 'lucide-react';

interface WelcomeModalProps {
  onStartFresh: () => void;
  onLoadTemplate: (templateKey: keyof typeof templates) => void;
  onClose: () => void;
  showOnStartup: boolean;
  onShowOnStartupChange: (value: boolean) => void;
  projects: ProjectMetadata[];
  isLoadingProjects: boolean;
  onLoadProject: (projectId: string) => void;
  onDeleteProject: (projectId: string) => void;
}

const WelcomeModal: React.FC<WelcomeModalProps> = ({
  onStartFresh,
  onLoadTemplate,
  onClose,
  showOnStartup,
  onShowOnStartupChange,
  projects,
  isLoadingProjects,
  onLoadProject,
  onDeleteProject
}) => {
  const { styles } = useTheme();
  const [activeTab, setActiveTab] = useState('start');
  const [projectToDelete, setProjectToDelete] = useState<string | null>(null);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
        if (e.key === 'Escape') {
            onClose();
        }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [onClose]);

  const formatDate = (timestamp: number) => {
    const date = new Date(timestamp);
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffMins = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(diffMs / 3600000);
    const diffDays = Math.floor(diffMs / 86400000);

    if (diffMins < 1) return 'Just now';
    if (diffMins < 60) return `${diffMins}m ago`;
    if (diffHours < 24) return `${diffHours}h ago`;
    if (diffDays < 7) return `${diffDays}d ago`;

    return date.toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: 'numeric' });
  };

  const handleLoadProject = (projectId: string) => {
    onLoadProject(projectId);
    onClose();
  };

  const handleDeleteClick = (e: React.MouseEvent, projectId: string) => {
    e.stopPropagation();
    setProjectToDelete(projectId);
  };

  const confirmDelete = () => {
    if (projectToDelete) {
      onDeleteProject(projectToDelete);
      setProjectToDelete(null);
    }
  };

  const cancelDelete = () => {
    setProjectToDelete(null);
  };
  
  const templateIcons: { [key in keyof typeof templates]: React.ReactNode } = {
    storyCharacterPipeline: <BookOpen className="w-6 h-6 text-teal-300" />,
    cinematicStoryboard: <Clapperboard className="w-6 h-6 text-indigo-300" />,
    worldMoodboard: <Palette className="w-6 h-6 text-fuchsia-300" />,
  };

  const SidebarItem: React.FC<{
    label: string;
    icon: React.ReactNode;
    tabName: string;
  }> = ({ label, icon, tabName }) => (
    <button
      onClick={() => setActiveTab(tabName)}
      className={`w-full flex items-center space-x-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-colors ${activeTab === tabName ? `${styles.sidebar.itemActiveBg} ${styles.sidebar.itemActiveText}` : `${styles.sidebar.itemText} ${styles.sidebar.itemHoverBg}`}`}
    >
      {icon}
      <span>{label}</span>
    </button>
  );

  const content = {
    start: {
      title: 'Start a New Project',
      description: 'Visually craft your AI-powered creations.',
      component: (
        <>
          <button
            onClick={onStartFresh}
            className={`w-full text-left p-4 rounded-lg flex items-center space-x-4 transition-colors ${styles.toolbar.buttonBg} ${styles.toolbar.buttonHoverBg}`}
          >
            <div className={`p-3 rounded-md ${styles.node.bg}`}>
              <Plus className="w-6 h-6" />
            </div>
            <div>
              <p className="font-semibold">New Project</p>
              <p className={`text-sm ${styles.node.labelText}`}>Start a new project in draft mode.</p>
            </div>
          </button>
          
          <h3 className={`text-base font-semibold ${styles.modal.text} mt-8 mb-4`}>Or start from a template</h3>
          
          <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-4">
            {Object.entries(templates).map(([key, template]) => (
              <button
                key={key}
                onClick={() => onLoadTemplate(key as keyof typeof templates)}
                className={`w-full text-left p-4 rounded-lg flex flex-col gap-3 transition-colors ${styles.toolbar.buttonBg} ${styles.toolbar.buttonHoverBg} focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:ring-offset-transparent ${styles.gallery.itemFocusRing}`}
              >
                <div className="flex items-start gap-3 h-[3rem]">
                  <div className={`p-3 rounded-md ${styles.node.bg} flex-shrink-0`}>
                    {templateIcons[key as keyof typeof templates]}
                  </div>
                  <p className="font-bold text-sm leading-tight">{template.name}</p>
                </div>
                <p className={`text-sm ${styles.node.labelText} leading-relaxed`}>{template.description}</p>
              </button>
            ))}
          </div>
        </>
      )
    },
    recent: {
      title: 'Recent Projects',
      description: 'Open a project you recently worked on.',
      component: (
        <>
          {isLoadingProjects ? (
            <div className="w-full h-48 flex items-center justify-center">
              <Loader2 className="w-8 h-8 animate-spin text-cyan-400" />
            </div>
          ) : projects.length === 0 ? (
            <div className={`w-full h-48 flex items-center justify-center text-center border-2 border-dashed ${styles.node.imagePlaceholderBorder} rounded-lg p-4 mt-4`}>
              <div>
                <p className={`${styles.node.labelText}`}>No projects yet.</p>
                <p className={`text-xs ${styles.node.labelText} mt-1`}>Create your first project to get started!</p>
              </div>
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-4">
              {projects.slice(0, 10).map((project) => (
                <div
                  key={project.id}
                  role="button"
                  tabIndex={0}
                  onClick={() => handleLoadProject(project.id)}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter' || e.key === ' ') {
                      e.preventDefault();
                      handleLoadProject(project.id);
                    }
                  }}
                  className={`w-full text-left p-4 rounded-lg flex flex-col gap-3 transition-colors cursor-pointer ${styles.toolbar.buttonBg} ${styles.toolbar.buttonHoverBg} focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:ring-offset-transparent ${styles.gallery.itemFocusRing}`}
                >
                  <div className="flex-1 min-w-0">
                    <p className="font-bold text-base truncate mb-2">{project.name}</p>
                    <p className={`text-xs ${styles.node.labelText}`}>Created {formatDate(project.createdAt)}</p>
                  </div>
                  <div className={`pt-3 border-t ${styles.toolbar.border} flex items-center justify-between gap-3`}>
                    <span className={`text-[10px] font-bold uppercase tracking-wider px-2.5 py-1 rounded ${styles.gallery.accentBadge}`}>
                      Updated {formatDate(project.updatedAt)}
                    </span>
                    <button
                      type="button"
                      onClick={(e) => handleDeleteClick(e, project.id)}
                      className={`inline-flex items-center gap-1.5 px-2.5 py-1.5 text-xs font-medium rounded transition-colors ${styles.toolbar.buttonBg} ${styles.toolbar.buttonHoverBg} ${styles.gallery.accentText} hover:text-red-400 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:ring-offset-transparent ${styles.gallery.itemFocusRing}`}
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                      Remove
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </>
      )
    }
  };


  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-labelledby="welcome-title-main"
      className={`fixed inset-0 z-50 flex items-center justify-center p-4 ${styles.modal.overlay} backdrop-blur-sm transition-opacity duration-300 ease-in-out`}
      onClick={onClose}
    >
      <div
        onClick={(e) => e.stopPropagation()}
        className={`${styles.modal.bg} rounded-xl shadow-2xl w-full max-w-4xl border ${styles.modal.border} flex overflow-hidden`}
        style={{ height: 'min(600px, 85vh)' }}
      >
        {/* Sidebar */}
        <nav className={`w-56 flex-shrink-0 ${styles.sidebar.bg} p-4 flex flex-col`}>
          <div>
            <div className="px-3 py-1.5">
                <h1 className={`text-lg font-bold ${styles.modal.text}`}>Gemini Node Canvas</h1>
            </div>
            <div className="mt-6 space-y-2">
                <SidebarItem label="Start" icon={<Home className="w-5 h-5" />} tabName="start" />
                <SidebarItem label="Recent" icon={<Clock className="w-5 h-5" />} tabName="recent" />
            </div>
          </div>
          <div className="mt-auto p-3">
            <div className="flex items-center mb-4">
              <input
                type="checkbox"
                id="show-on-startup"
                checked={showOnStartup}
                onChange={(e) => onShowOnStartupChange(e.target.checked)}
                className={`h-4 w-4 rounded ${styles.node.inputBorder} text-cyan-600 focus:ring-cyan-500 bg-transparent`}
              />
              <label htmlFor="show-on-startup" className={`ml-2 text-sm ${styles.modal.messageText}`}>
                Show on startup
              </label>
            </div>
            <div className="flex items-center space-x-1.5 text-xs text-gray-400">
              <span>Access settings via the</span>
              <div className={`${styles.toolbar.buttonBg} p-1 rounded-sm`}>
                  <Settings className="w-3 h-3" />
              </div>
              <span>icon.</span>
            </div>
          </div>
        </nav>

        {/* Content */}
        <div className="flex-1 flex flex-col relative">
            <button 
                onClick={onClose}
                className="absolute top-3 right-3 p-2 rounded-full text-gray-400 hover:bg-gray-600/50 hover:text-white transition-colors z-10"
                aria-label="Close welcome screen"
            >
                <X className="w-5 h-5" />
            </button>
            <main className="flex-grow p-8 overflow-y-auto custom-scrollbar">
                <h1 id="welcome-title-main" className={`text-2xl font-bold ${styles.modal.text} mb-1`}>
                    {content[activeTab as keyof typeof content].title}
                </h1>
                <p className={`${styles.modal.messageText} mb-6`}>{content[activeTab as keyof typeof content].description}</p>
                <div className="mx-auto max-w-3xl space-y-8">
                  {content[activeTab as keyof typeof content].component}
                </div>
            </main>
        </div>
      </div>

      {/* Delete Confirmation Dialog */}
      {projectToDelete && (
        <div className="absolute inset-0 flex items-center justify-center bg-black/50 backdrop-blur-sm z-50">
          <div className={`${styles.modal.bg} rounded-lg shadow-xl p-6 border ${styles.modal.border} max-w-md w-full mx-4`}>
            <h3 className={`text-lg font-semibold ${styles.modal.text} mb-2`}>Delete Project</h3>
            <p className={`${styles.modal.messageText} mb-6`}>
              Are you sure you want to delete this project? This action cannot be undone.
            </p>
            <div className="flex justify-end space-x-3">
              <button
                onClick={cancelDelete}
                className={`px-4 py-2 rounded-md ${styles.toolbar.buttonBg} ${styles.toolbar.buttonHoverBg} transition-colors`}
              >
                Cancel
              </button>
              <button
                onClick={confirmDelete}
                className="px-4 py-2 rounded-md bg-red-500/20 hover:bg-red-500/30 text-red-400 transition-colors"
              >
                Delete
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default WelcomeModal;
