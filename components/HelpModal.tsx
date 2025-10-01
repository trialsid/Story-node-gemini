import React, { useEffect } from 'react';
import { useTheme } from '../contexts/ThemeContext';
import { X, MousePointer, Layers, Image, Clapperboard, Users, Type, Sparkles, Move, Copy, RotateCcw, Minimize2 } from 'lucide-react';

interface HelpModalProps {
  isOpen: boolean;
  onClose: () => void;
}

const HelpModal: React.FC<HelpModalProps> = ({ isOpen, onClose }) => {
  const { styles } = useTheme();

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        onClose();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [onClose]);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4">
      <div className={`${styles.modal.bg} border ${styles.modal.border} rounded-xl shadow-2xl w-full max-w-3xl max-h-[90vh] overflow-hidden flex flex-col`}>
        {/* Header */}
        <div className={`flex items-center justify-between p-6 border-b ${styles.modal.border}`}>
          <div>
            <h2 className={`text-2xl font-bold ${styles.modal.text}`}>Help & Guide</h2>
            <p className={`text-sm ${styles.modal.messageText} mt-1`}>Learn how to use Gemini Node Canvas</p>
          </div>
          <button
            onClick={onClose}
            className={`p-2 rounded-lg ${styles.toolbar.buttonBg} ${styles.toolbar.text} ${styles.toolbar.buttonHoverBg} transition-colors`}
            aria-label="Close help"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content */}
        <div className="overflow-y-auto flex-1 p-6 space-y-8 custom-scrollbar">
          {/* Getting Started */}
          <section>
            <h3 className={`text-xl font-semibold ${styles.modal.text} mb-4 flex items-center gap-2`}>
              <Sparkles className="w-5 h-5" />
              Getting Started
            </h3>
            <div className={`space-y-3 ${styles.modal.messageText}`}>
              <p>Welcome to Gemini Node Canvas! This is a visual workflow builder for AI-powered creative projects.</p>
              <ul className="list-disc list-inside space-y-2 ml-2">
                <li><strong>Canvas Navigation:</strong> Click and drag the background to pan, use mouse wheel to zoom</li>
                <li><strong>Adding Nodes:</strong> Right-click on the canvas to open the context menu and select a node type</li>
                <li><strong>Connecting Nodes:</strong> Click and drag from an output handle (right side) to an input handle (left side)</li>
                <li><strong>Node Operations:</strong> Right-click on a node to access delete, duplicate, reset, and minimize options</li>
              </ul>
            </div>
          </section>

          {/* Node Types */}
          <section>
            <h3 className={`text-xl font-semibold ${styles.modal.text} mb-4 flex items-center gap-2`}>
              <Layers className="w-5 h-5" />
              Node Types
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className={`p-4 rounded-lg ${styles.node.bg} border ${styles.node.border}`}>
                <div className="flex items-center gap-2 mb-2">
                  <Type className="w-5 h-5 text-blue-400" />
                  <h4 className={`font-semibold ${styles.modal.text}`}>Text Node</h4>
                </div>
                <p className={`text-sm ${styles.modal.messageText}`}>Store and edit text content for prompts, descriptions, or stories.</p>
              </div>

              <div className={`p-4 rounded-lg ${styles.node.bg} border ${styles.node.border}`}>
                <div className="flex items-center gap-2 mb-2">
                  <Image className="w-5 h-5 text-purple-400" />
                  <h4 className={`font-semibold ${styles.modal.text}`}>Image Node</h4>
                </div>
                <p className={`text-sm ${styles.modal.messageText}`}>Generate, edit, or mix images. Upload or drag images from gallery.</p>
              </div>

              <div className={`p-4 rounded-lg ${styles.node.bg} border ${styles.node.border}`}>
                <div className="flex items-center gap-2 mb-2">
                  <Clapperboard className="w-5 h-5 text-pink-400" />
                  <h4 className={`font-semibold ${styles.modal.text}`}>Video Node</h4>
                </div>
                <p className={`text-sm ${styles.modal.messageText}`}>Generate videos from images or text prompts using AI.</p>
              </div>

              <div className={`p-4 rounded-lg ${styles.node.bg} border ${styles.node.border}`}>
                <div className="flex items-center gap-2 mb-2">
                  <Users className="w-5 h-5 text-green-400" />
                  <h4 className={`font-semibold ${styles.modal.text}`}>Character Node</h4>
                </div>
                <p className={`text-sm ${styles.modal.messageText}`}>Generate character descriptions and portraits for your stories.</p>
              </div>
            </div>
          </section>

          {/* Features */}
          <section>
            <h3 className={`text-xl font-semibold ${styles.modal.text} mb-4 flex items-center gap-2`}>
              <Sparkles className="w-5 h-5" />
              Key Features
            </h3>
            <div className={`space-y-3 ${styles.modal.messageText}`}>
              <div>
                <h4 className="font-semibold mb-1">Gallery Panel</h4>
                <p className="text-sm">View all generated media in the gallery panel (top right). Drag images directly onto the canvas to create Image nodes.</p>
              </div>
              <div>
                <h4 className="font-semibold mb-1">Multi-Select</h4>
                <p className="text-sm">Hold Ctrl/Cmd and click nodes to select multiple. Right-click to duplicate or delete selected nodes.</p>
              </div>
              <div>
                <h4 className="font-semibold mb-1">Projects</h4>
                <p className="text-sm">Your work auto-saves. Access projects from the Launcher screen or load templates to get started quickly.</p>
              </div>
              <div>
                <h4 className="font-semibold mb-1">Themes</h4>
                <p className="text-sm">Switch between Dark, Modern, and Elegant themes using the theme switcher (top right).</p>
              </div>
            </div>
          </section>

          {/* Keyboard Shortcuts */}
          <section>
            <h3 className={`text-xl font-semibold ${styles.modal.text} mb-4 flex items-center gap-2`}>
              <MousePointer className="w-5 h-5" />
              Keyboard Shortcuts
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              <div className={`flex items-center justify-between p-3 rounded-lg ${styles.node.bg} border ${styles.node.border}`}>
                <span className={`text-sm ${styles.modal.messageText}`}>Pan Canvas</span>
                <kbd className={`px-2 py-1 text-xs font-semibold ${styles.node.bg} ${styles.node.text} border ${styles.toolbar.border} rounded`}>Click + Drag</kbd>
              </div>
              <div className={`flex items-center justify-between p-3 rounded-lg ${styles.node.bg} border ${styles.node.border}`}>
                <span className={`text-sm ${styles.modal.messageText}`}>Zoom</span>
                <kbd className={`px-2 py-1 text-xs font-semibold ${styles.node.bg} ${styles.node.text} border ${styles.toolbar.border} rounded`}>Mouse Wheel</kbd>
              </div>
              <div className={`flex items-center justify-between p-3 rounded-lg ${styles.node.bg} border ${styles.node.border}`}>
                <span className={`text-sm ${styles.modal.messageText}`}>Multi-Select</span>
                <kbd className={`px-2 py-1 text-xs font-semibold ${styles.node.bg} ${styles.node.text} border ${styles.toolbar.border} rounded`}>Ctrl/Cmd + Click</kbd>
              </div>
              <div className={`flex items-center justify-between p-3 rounded-lg ${styles.node.bg} border ${styles.node.border}`}>
                <span className={`text-sm ${styles.modal.messageText}`}>Context Menu</span>
                <kbd className={`px-2 py-1 text-xs font-semibold ${styles.node.bg} ${styles.node.text} border ${styles.toolbar.border} rounded`}>Right Click</kbd>
              </div>
            </div>
          </section>

          {/* Node Actions */}
          <section>
            <h3 className={`text-xl font-semibold ${styles.modal.text} mb-4 flex items-center gap-2`}>
              <Move className="w-5 h-5" />
              Node Actions
            </h3>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
              <div className={`flex flex-col items-center text-center p-3 rounded-lg ${styles.node.bg} border ${styles.node.border}`}>
                <Move className={`w-6 h-6 mb-2 ${styles.gallery.accentText}`} />
                <span className={`text-xs font-semibold ${styles.modal.text}`}>Move</span>
                <span className={`text-xs ${styles.modal.messageText} mt-1`}>Drag node</span>
              </div>
              <div className={`flex flex-col items-center text-center p-3 rounded-lg ${styles.node.bg} border ${styles.node.border}`}>
                <Copy className={`w-6 h-6 mb-2 ${styles.gallery.accentText}`} />
                <span className={`text-xs font-semibold ${styles.modal.text}`}>Duplicate</span>
                <span className={`text-xs ${styles.modal.messageText} mt-1`}>Right-click</span>
              </div>
              <div className={`flex flex-col items-center text-center p-3 rounded-lg ${styles.node.bg} border ${styles.node.border}`}>
                <RotateCcw className={`w-6 h-6 mb-2 ${styles.gallery.accentText}`} />
                <span className={`text-xs font-semibold ${styles.modal.text}`}>Reset</span>
                <span className={`text-xs ${styles.modal.messageText} mt-1`}>Clear data</span>
              </div>
              <div className={`flex flex-col items-center text-center p-3 rounded-lg ${styles.node.bg} border ${styles.node.border}`}>
                <Minimize2 className={`w-6 h-6 mb-2 ${styles.gallery.accentText}`} />
                <span className={`text-xs font-semibold ${styles.modal.text}`}>Minimize</span>
                <span className={`text-xs ${styles.modal.messageText} mt-1`}>Compact view</span>
              </div>
            </div>
          </section>

          {/* Tips & Tricks */}
          <section>
            <h3 className={`text-xl font-semibold ${styles.modal.text} mb-4 flex items-center gap-2`}>
              <Sparkles className="w-5 h-5" />
              Tips & Tricks
            </h3>
            <div className={`space-y-2 ${styles.modal.messageText}`}>
              <ul className="list-disc list-inside space-y-2 ml-2">
                <li><strong>Chain Nodes:</strong> Connect multiple nodes to create complex workflows (e.g., Text → Character → Image → Video)</li>
                <li><strong>Reuse Content:</strong> One output can connect to multiple inputs - perfect for reusing characters or settings</li>
                <li><strong>Gallery Workflow:</strong> Drag images from the gallery directly onto the canvas to continue editing them</li>
                <li><strong>Minimize Nodes:</strong> Keep your canvas clean by minimizing nodes you're not actively working on</li>
                <li><strong>Templates:</strong> Start with pre-built templates from the Launcher screen to learn common workflows</li>
              </ul>
            </div>
          </section>
        </div>

        {/* Footer */}
        <div className={`flex items-center justify-between p-4 border-t ${styles.modal.border}`}>
          <p className={`text-xs ${styles.modal.messageText}`}>Press <kbd className={`px-1.5 py-0.5 text-xs ${styles.node.bg} ${styles.node.text} border ${styles.toolbar.border} rounded`}>Esc</kbd> to close</p>
          <button
            onClick={onClose}
            className={`px-4 py-2 rounded-lg ${styles.toolbar.buttonBg} ${styles.toolbar.text} ${styles.toolbar.buttonHoverBg} font-semibold transition-colors`}
          >
            Got it!
          </button>
        </div>
      </div>
    </div>
  );
};

export default HelpModal;
