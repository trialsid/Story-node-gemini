import React, { useEffect, useState } from 'react';
import { useTheme } from '../contexts/ThemeContext';
import CloseIcon from './icons/CloseIcon';
import SettingsIcon from './icons/SettingsIcon';
import KeyboardIcon from './icons/KeyboardIcon';

interface SettingsModalProps {
  isOpen: boolean;
  onClose: () => void;
  showWelcomeOnStartup: boolean;
  onShowWelcomeOnStartupChange: (value: boolean) => void;
}

const ToggleSwitch: React.FC<{
  checked: boolean;
  onChange: (checked: boolean) => void;
  labelId: string;
}> = ({ checked, onChange, labelId }) => {
  const { styles } = useTheme();

  return (
    <button
      type="button"
      role="switch"
      aria-checked={checked}
      aria-labelledby={labelId}
      onClick={() => onChange(!checked)}
      // Thin, modern, rectangular container.
      className={`relative inline-flex items-center flex-shrink-0 h-4 w-9 border-2 border-transparent rounded cursor-pointer transition-colors ease-in-out duration-200 focus:outline-none focus:ring-2 focus:ring-offset-2 ${styles.node.inputFocusRing} ${styles.modal.focusRingOffset} ${checked ? styles.switch.bgOn : styles.switch.bgOff}`}
    >
      <span className="sr-only">Use setting</span>
      <span
        aria-hidden="true"
        // The rectangular thumb that slides.
        className={`pointer-events-none inline-block h-3 w-3 rounded-sm ${styles.switch.thumb} shadow-lg transform ring-0 transition ease-in-out duration-200 ${
          checked ? 'translate-x-5' : 'translate-x-0.5'
        }`}
      />
    </button>
  );
};

const SettingsModal: React.FC<SettingsModalProps> = ({ 
  isOpen, 
  onClose,
  showWelcomeOnStartup,
  onShowWelcomeOnStartupChange
}) => {
  const { styles } = useTheme();
  const [activeTab, setActiveTab] = useState('general');

  useEffect(() => {
    if (!isOpen) return;
    const handleKeyDown = (e: KeyboardEvent) => {
        if (e.key === 'Escape') {
            onClose();
        }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, onClose]);

  if (!isOpen) {
    return null;
  }

  const Shortcut: React.FC<{ keys: string[]; description: string }> = ({ keys, description }) => (
    <div className={`flex items-center justify-between py-2.5 border-b ${styles.modal.border} last:border-b-0`}>
      <p className={`${styles.modal.messageText}`}>{description}</p>
      <div className="flex items-center space-x-1">
        {keys.map((key, i) => (
          <React.Fragment key={key}>
            <kbd className={`px-2 py-1 text-xs font-semibold ${styles.node.bg} ${styles.toolbar.border} border rounded-md`}>
              {key}
            </kbd>
            {i < keys.length - 1 && <span className="text-gray-400 font-sans">+</span>}
          </React.Fragment>
        ))}
      </div>
    </div>
  );

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
    general: {
      title: 'General',
      component: (
        <div className={`p-4 rounded-lg ${styles.toolbar.buttonBg} border ${styles.toolbar.border}`}>
            <div className="flex items-center justify-between">
                <span id="show-on-startup-label" className={`${styles.modal.messageText}`}>
                    Show welcome screen on startup
                </span>
                <ToggleSwitch
                    checked={showWelcomeOnStartup}
                    onChange={onShowWelcomeOnStartupChange}
                    labelId="show-on-startup-label"
                />
            </div>
        </div>
      )
    },
    shortcuts: {
      title: 'Keyboard Shortcuts',
      component: (
        <div className={`p-4 rounded-lg ${styles.toolbar.buttonBg} border ${styles.toolbar.border}`}>
            <div className="space-y-1">
                <Shortcut keys={['Ctrl/Cmd', 'Z']} description="Undo last action" />
                <Shortcut keys={['Ctrl/Cmd', 'Shift', 'Z']} description="Redo last action" />
                <Shortcut keys={['Ctrl', 'Y']} description="Redo last action (Windows)" />
                <Shortcut keys={['Ctrl', 'Enter']} description="Generate from selected node" />
                <Shortcut keys={['Right Click']} description="Open node creation menu" />
            </div>
        </div>
      )
    }
  };

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-labelledby="settings-title"
      className={`fixed inset-0 z-50 flex items-center justify-center p-4 ${styles.modal.overlay} backdrop-blur-sm transition-opacity duration-300 ease-in-out`}
      onClick={onClose}
    >
      <div
        onClick={(e) => e.stopPropagation()}
        className={`${styles.modal.bg} rounded-xl shadow-2xl w-full max-w-4xl border ${styles.modal.border} flex overflow-hidden`}
        style={{ height: 'min(600px, 85vh)' }}
      >
        {/* Sidebar */}
        <nav className={`w-56 flex-shrink-0 ${styles.sidebar.bg} p-4`}>
          <div className="space-y-2">
            <SidebarItem label="General" icon={<SettingsIcon className="w-5 h-5" />} tabName="general" />
            <SidebarItem label="Keyboard" icon={<KeyboardIcon className="w-5 h-5" />} tabName="shortcuts" />
          </div>
        </nav>

        {/* Content */}
        <div className="flex-1 flex flex-col relative">
            <button 
                onClick={onClose}
                className="absolute top-3 right-3 p-2 rounded-full text-gray-400 hover:bg-gray-600/50 hover:text-white transition-colors z-10"
                aria-label="Close settings"
            >
                <CloseIcon className="w-5 h-5" />
            </button>
            <main className="flex-grow p-8 overflow-y-auto custom-scrollbar">
                <h1 id="settings-title" className={`text-2xl font-bold ${styles.modal.text} mb-6`}>
                    {content[activeTab as keyof typeof content].title}
                </h1>
                {content[activeTab as keyof typeof content].component}
            </main>
        </div>
      </div>
    </div>
  );
};

export default SettingsModal;