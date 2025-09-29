import React, { useState, useEffect } from 'react';
import { useTheme } from '../contexts/ThemeContext';
import { templates } from '../utils/templates';
import { Image, Clapperboard, Users as UsersIcon, Layers, Plus, X, Settings, Home, Clock, BookOpen, Palette } from 'lucide-react';

interface WelcomeModalProps {
  onStartFresh: () => void;
  onLoadTemplate: (templateKey: keyof typeof templates) => void;
  onClose: () => void;
  showOnStartup: boolean;
  onShowOnStartupChange: (value: boolean) => void;
}

const WelcomeModal: React.FC<WelcomeModalProps> = ({ onStartFresh, onLoadTemplate, onClose, showOnStartup, onShowOnStartupChange }) => {
  const { styles } = useTheme();
  const [activeTab, setActiveTab] = useState('start');

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
        if (e.key === 'Escape') {
            onClose();
        }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [onClose]);
  
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
          
          <div className="space-y-3">
            {Object.entries(templates).map(([key, template]) => (
                <button
                key={key}
                onClick={() => onLoadTemplate(key as keyof typeof templates)}
                className={`w-full text-left p-4 rounded-lg flex items-center space-x-4 transition-colors ${styles.toolbar.buttonBg} ${styles.toolbar.buttonHoverBg}`}
            >
                <div className={`p-3 rounded-md ${styles.node.bg}`}>
                    {templateIcons[key as keyof typeof templates]}
                </div>
                <div>
                    <p className="font-semibold">{template.name}</p>
                    <p className={`text-sm ${styles.node.labelText}`}>{template.description}</p>
                </div>
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
         <div className={`w-full h-full flex items-center justify-center text-center border-2 border-dashed ${styles.node.imagePlaceholderBorder} rounded-lg p-4 mt-4`}>
            <div>
              <p className={`${styles.node.labelText}`}>Your recent projects will appear here.</p>
              <p className={`text-xs ${styles.node.labelText} mt-1`}>(Feature coming soon)</p>
            </div>
         </div>
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
                {content[activeTab as keyof typeof content].component}
            </main>
        </div>
      </div>
    </div>
  );
};

export default WelcomeModal;
