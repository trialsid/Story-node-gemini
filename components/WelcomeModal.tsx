import React, { useState, useEffect } from 'react';
import { useTheme } from '../contexts/ThemeContext';
import { templates } from '../utils/templates';
import ImageIcon from './icons/ImageIcon';
import TextIcon from './icons/TextIcon';
import VideoIcon from './icons/VideoIcon';
import PlusIcon from './icons/PlusIcon';
import CloseIcon from './icons/CloseIcon';

interface WelcomeModalProps {
  onStartFresh: () => void;
  onLoadTemplate: (templateKey: keyof typeof templates) => void;
  onClose: () => void;
}

const WelcomeModal: React.FC<WelcomeModalProps> = ({ onStartFresh, onLoadTemplate, onClose }) => {
  const { styles } = useTheme();
  const [showOnStartup, setShowOnStartup] = useState(() => {
    const setting = localStorage.getItem('showWelcomeOnStartup');
    return setting === null || setting === 'true';
  });

  useEffect(() => {
    localStorage.setItem('showWelcomeOnStartup', String(showOnStartup));
  }, [showOnStartup]);

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
    characterConcept: <ImageIcon className="w-6 h-6 text-cyan-400" />,
    quickVideo: <VideoIcon className="w-6 h-6 text-green-400" />,
    textToVideo: <TextIcon className="w-6 h-6 text-yellow-400" />,
  };

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-labelledby="welcome-title"
      className={`fixed inset-0 z-50 flex items-center justify-center p-4 ${styles.modal.overlay} backdrop-blur-sm transition-opacity duration-300 ease-in-out`}
      onClick={onClose}
    >
      <div
        onClick={(e) => e.stopPropagation()}
        className={`${styles.modal.bg} rounded-lg shadow-2xl w-full max-w-4xl border ${styles.modal.border} flex flex-col overflow-hidden relative`}
        style={{ height: 'min(650px, 90vh)' }}
      >
        <button 
          onClick={onClose}
          className="absolute top-4 right-4 p-2 rounded-full text-gray-400 hover:bg-gray-600/50 hover:text-white transition-colors z-10"
          aria-label="Close welcome screen"
        >
            <CloseIcon className="w-5 h-5" />
        </button>

        <header className={`p-6 border-b ${styles.modal.border}`}>
          <h1 id="welcome-title" className={`text-2xl font-bold ${styles.modal.text}`}>Welcome to Gemini Node Canvas</h1>
          <p className={`${styles.modal.messageText} mt-1`}>Visually craft your AI-powered creations.</p>
        </header>
        
        <main className="flex-grow p-6 grid md:grid-cols-2 gap-6 overflow-y-auto custom-scrollbar">
          {/* Start Section */}
          <section>
            <h2 className={`text-lg font-semibold ${styles.modal.text} mb-4`}>Start</h2>
            <div className="space-y-3">
              <button
                onClick={onStartFresh}
                className={`w-full text-left p-4 rounded-lg flex items-center space-x-4 transition-colors ${styles.toolbar.buttonBg} ${styles.toolbar.buttonHoverBg}`}
              >
                <div className={`p-3 rounded-md ${styles.node.bg}`}>
                  <PlusIcon className="w-6 h-6" />
                </div>
                <div>
                  <p className="font-semibold">New Blank Canvas</p>
                  <p className={`text-sm ${styles.node.labelText}`}>Begin with an empty workspace.</p>
                </div>
              </button>
              
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
          </section>

          {/* Recent Section */}
          <section>
             <h2 className={`text-lg font-semibold ${styles.modal.text} mb-4`}>Recent</h2>
             <div className={`w-full h-full flex items-center justify-center text-center border-2 border-dashed ${styles.node.imagePlaceholderBorder} rounded-lg p-4`}>
                <div>
                  <p className={`${styles.node.labelText}`}>Your recent projects will appear here.</p>
                  <p className={`text-xs ${styles.node.labelText} mt-1`}>(Feature coming soon)</p>
                </div>
             </div>
          </section>
        </main>

        <footer className={`p-4 border-t ${styles.modal.border} mt-auto`}>
          <div className="flex items-center">
            <input
              type="checkbox"
              id="show-on-startup"
              checked={showOnStartup}
              onChange={(e) => setShowOnStartup(e.target.checked)}
              className="h-4 w-4 rounded border-gray-300 text-cyan-600 focus:ring-cyan-500"
            />
            <label htmlFor="show-on-startup" className="ml-2 text-sm">
              Show on startup
            </label>
          </div>
        </footer>

      </div>
    </div>
  );
};

export default WelcomeModal;
