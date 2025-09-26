import React, { useMemo, useState } from 'react';
import { useTheme } from '../contexts/ThemeContext';
import { ChevronUp, ChevronDown, Video, Star, Trash2, Sparkles } from 'lucide-react';
import { GalleryItem, GalleryStatus } from '../types';

interface GalleryPanelProps {
  items: GalleryItem[];
  status: GalleryStatus;
  onDeleteItem: (id: string) => void;
  onRefresh: () => void;
  onSelectItem: (item: GalleryItem) => void;
  isLoading: boolean;
  errorMessage?: string | null;
}

const GalleryPanel: React.FC<GalleryPanelProps> = ({
  items,
  status,
  onDeleteItem,
  onRefresh,
  onSelectItem,
  isLoading,
  errorMessage,
}) => {
  const [isMinimized, setIsMinimized] = useState(true);
  const [activeTab, setActiveTab] = useState<'history' | 'starred'>('history');
  const { styles } = useTheme();

  const historyItems = useMemo(() => items, [items]);
  const starredItems: GalleryItem[] = []; // Placeholder for future feature.
  const mediaToShow = activeTab === 'history' ? historyItems : starredItems;

  const statusContent = useMemo(() => {
    if (status === 'loading') {
      return (
        <div className={`flex flex-col items-center justify-center h-48 ${styles.node.bg} border ${styles.toolbar.border} rounded-lg space-y-2`}>
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-cyan-400" />
          <p className={`${styles.node.labelText} text-xs`}>Loading gallery…</p>
        </div>
      );
    }

    if (status === 'error') {
      return (
        <div className={`space-y-3 p-4 border ${styles.toolbar.border} rounded-lg ${styles.node.bg}`}>
          <p className={`${styles.node.labelText} text-sm`}>{errorMessage || 'Unable to load gallery history.'}</p>
          <button
            onClick={(event) => {
              event.stopPropagation();
              onRefresh();
            }}
            className={`w-full flex items-center justify-center p-2 ${styles.toolbar.buttonBg} border ${styles.toolbar.border} rounded-md text-sm font-semibold`}
          >
            Try Again
          </button>
        </div>
      );
    }

    return null;
  }, [errorMessage, onRefresh, status, styles.node.bg, styles.node.labelText, styles.toolbar.border, styles.toolbar.buttonBg]);

  const renderMediaPreview = (item: GalleryItem, compact = false) => {
    if (!item.url) {
      return (
        <div className={`flex items-center justify-center h-full w-full ${styles.node.imagePlaceholderBg} rounded-md`}>
          <Sparkles className="w-5 h-5 text-yellow-400" />
        </div>
      );
    }

    if (item.type === 'video') {
      return (
        <div className="relative w-full h-full">
          <video
            src={item.url}
            muted
            loop
            playsInline
            autoPlay
            className="w-full h-full object-contain bg-black/40 rounded-md"
          />
          {!compact && (
            <div className="absolute bottom-1 right-1 bg-black/60 p-1 rounded-full flex items-center justify-center text-white">
              <Video className="w-3 h-3" />
            </div>
          )}
        </div>
      );
    }

    return (
      <img
        src={item.url}
        alt={item.fileName}
        className="w-full h-full object-contain bg-black/40 rounded-md"
      />
    );
  };

  const renderGalleryContent = () => {
    if (status !== 'ready') {
      return statusContent;
    }

    if (mediaToShow.length === 0) {
      return (
        <div className={`flex items-center justify-center h-48 text-center ${styles.node.labelText}`}>
          <Star className="w-8 h-8 mx-auto mb-2 text-yellow-400" />
          <p className="text-xs font-semibold">{activeTab === 'history' ? 'No history yet' : 'Starred items coming soon'}</p>
          {activeTab === 'history' && <p className="text-xs mt-1">Generate media to populate your gallery.</p>}
        </div>
      );
    }

    return (
      <div className="grid grid-cols-2 gap-2 overflow-y-auto max-h-[calc(100vh-260px)] custom-scrollbar">
        {mediaToShow.map(item => (
          <div
            key={item.id}
            role="button"
            tabIndex={0}
            onClick={(event) => {
              event.stopPropagation();
              onSelectItem(item);
            }}
            onKeyDown={(event) => {
              if (event.key === 'Enter' || event.key === ' ') {
                event.preventDefault();
                onSelectItem(item);
              }
            }}
            className={`relative rounded-lg ${styles.node.imagePlaceholderBg} flex aspect-square overflow-hidden border ${styles.node.imagePlaceholderBorder} hover:ring-2 hover:ring-cyan-400 focus:outline-none focus:ring-2 focus:ring-cyan-400 transition`}
          >
            {renderMediaPreview(item)}
            <button
              onClick={(event) => {
                event.stopPropagation();
                onDeleteItem(item.id);
              }}
              className="absolute top-1 right-1 p-1 rounded-full bg-black/50 text-white hover:bg-black/70"
              aria-label="Delete from gallery"
              type="button"
            >
              <Trash2 className="w-3 h-3" />
            </button>
          </div>
        ))}
      </div>
    );
  };

  const minimizedContent = () => {
    if (status === 'loading') {
      return (
        <div className="flex items-center justify-center h-16 text-center">
          <div className={`${styles.node.labelText} flex items-center space-x-2`}>
            <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-cyan-400" />
            <span className="text-xs">Loading…</span>
          </div>
        </div>
      );
    }

    if (status !== 'ready' || mediaToShow.length === 0) {
      return (
        <div className="flex items-center justify-center h-16 text-center">
          <div className={`${styles.node.labelText}`}>
            <Star className="w-6 h-6 mx-auto mb-1 text-yellow-400" />
            <p className="text-xs">History will appear here</p>
          </div>
        </div>
      );
    }

    return (
      <div
        className="flex space-x-2 overflow-x-auto pb-2 custom-scrollbar"
        onWheel={(event) => {
          if (event.deltaY !== 0 && event.deltaX === 0) {
            event.preventDefault();
            event.currentTarget.scrollLeft += event.deltaY;
          }
        }}
      >
        {mediaToShow.slice(0, 12).map(item => (
          <button
            key={item.id}
            type="button"
            onClick={(event) => {
              event.stopPropagation();
              onSelectItem(item);
            }}
            className={`w-12 h-12 flex-shrink-0 rounded-md overflow-hidden ${styles.node.imagePlaceholderBg} hover:ring-2 hover:ring-cyan-400 transition`}
          >
            {renderMediaPreview(item, true)}
          </button>
        ))}
      </div>
    );
  };

  return (
    <div
      className={`absolute top-20 right-4 z-20 w-64 ${styles.toolbar.bg} backdrop-blur-sm border ${styles.toolbar.border} rounded-lg shadow-lg flex flex-col transition-all duration-300 ease-in-out`}
    >
      <div
        className={`flex items-center justify-between p-2 cursor-pointer select-none`}
        onClick={() => setIsMinimized(!isMinimized)}
      >
        <div>
          <h3 className="font-bold text-sm">Gallery</h3>
        </div>
        <button
          className="p-1 rounded-full text-gray-400 hover:bg-gray-600/50 hover:text-white transition-colors"
          aria-label={isMinimized ? 'Expand gallery' : 'Collapse gallery'}
        >
          {isMinimized ? <ChevronDown className="w-4 h-4" /> : <ChevronUp className="w-4 h-4" />}
        </button>
      </div>

      <div className={`transition-all duration-300 ease-in-out overflow-hidden ${isMinimized ? 'max-h-0 opacity-0' : 'max-h-[1000px] opacity-100'}`}>
        <div className={`px-2 pt-2 pb-1 border-t ${styles.toolbar.border}`}>
          <div className={`flex p-0.5 rounded-md ${styles.node.bg}`}>
            <button
              onClick={(event) => {
                event.stopPropagation();
                setActiveTab('history');
              }}
              className={`flex-1 text-xs font-semibold py-1 rounded transition-colors ${activeTab === 'history'
                ? `${styles.sidebar.itemActiveBg} ${styles.sidebar.itemActiveText}`
                : `${styles.sidebar.itemText} ${styles.sidebar.itemHoverBg}`}`}
            >
              History
            </button>
            <button
              onClick={(event) => {
                event.stopPropagation();
                setActiveTab('starred');
              }}
              className={`flex-1 text-xs font-semibold py-1 rounded transition-colors ${activeTab === 'starred'
                ? `${styles.sidebar.itemActiveBg} ${styles.sidebar.itemActiveText}`
                : `${styles.sidebar.itemText} ${styles.sidebar.itemHoverBg}`}`}
            >
              Starred
            </button>
          </div>
        </div>
        <div className={`p-2 space-y-3 relative`}>
          {isLoading && (
            <div className="absolute inset-0 bg-black/40 backdrop-blur-sm flex items-center justify-center rounded-lg z-10">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-cyan-400" />
            </div>
          )}
          {renderGalleryContent()}
          {status === 'ready' && (
            <button
              onClick={(event) => {
                event.stopPropagation();
                onRefresh();
              }}
              disabled={isLoading || status === 'loading'}
              className={`w-full text-xs font-semibold p-2 border ${styles.toolbar.border} rounded-md ${styles.toolbar.buttonBg} ${(isLoading || status === 'loading') ? 'opacity-60 cursor-not-allowed' : ''}`}
            >
              {isLoading || status === 'loading' ? 'Refreshing…' : 'Refresh Gallery'}
            </button>
          )}
        </div>
      </div>

      <div className={`transition-all duration-300 ease-in-out overflow-hidden ${!isMinimized ? 'max-h-0 opacity-0' : 'max-h-24 opacity-100'}`}>
        <div className={`p-2 border-t ${styles.toolbar.border}`}>
          {minimizedContent()}
        </div>
      </div>
    </div>
  );
};

export default GalleryPanel;
