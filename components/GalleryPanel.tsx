import React, { useId, useMemo, useState } from 'react';
import { useTheme } from '../contexts/ThemeContext';
import { ChevronUp, ChevronDown, Video, Star, Trash2, Sparkles, RefreshCcw } from 'lucide-react';
import { GalleryItem, GalleryStatus } from '../types';

type GalleryTab = 'history' | 'starred';

interface GalleryPanelProps {
  items: GalleryItem[];
  status: GalleryStatus;
  onDeleteItem: (id: string) => void;
  onRefresh: () => void;
  onSelectItem: (item: GalleryItem) => void;
  isLoading: boolean;
  errorMessage?: string | null;
  videoAutoplayEnabled: boolean;
}

const formatRelativeTime = (timestamp: number): string => {
  const diffMs = Date.now() - timestamp;
  const diffSeconds = Math.floor(diffMs / 1000);

  if (diffSeconds < 60) return 'Just now';
  const diffMinutes = Math.floor(diffSeconds / 60);
  if (diffMinutes < 60) return `${diffMinutes}m ago`;
  const diffHours = Math.floor(diffMinutes / 60);
  if (diffHours < 24) return `${diffHours}h ago`;
  const diffDays = Math.floor(diffHours / 24);
  if (diffDays < 7) return `${diffDays}d ago`;
  const diffWeeks = Math.floor(diffDays / 7);
  if (diffWeeks < 4) return `${diffWeeks}w ago`;

  return new Date(timestamp).toLocaleDateString();
};

const getMediaTypeLabel = (type: GalleryItem['type']) => (type === 'video' ? 'Video' : 'Image');

const GalleryPanel: React.FC<GalleryPanelProps> = ({
  items,
  status,
  onDeleteItem,
  onRefresh,
  onSelectItem,
  isLoading,
  errorMessage,
  videoAutoplayEnabled,
}) => {
  const [isMinimized, setIsMinimized] = useState(true);
  const [activeTab, setActiveTab] = useState<GalleryTab>('history');
  const panelBodyId = useId();
  const { styles } = useTheme();

  const historyItems = useMemo(() => items, [items]);
  const starredItems: GalleryItem[] = [];
  const mediaToShow = activeTab === 'history' ? historyItems : starredItems;
  const historyCount = historyItems.length;
  const starredCount = starredItems.length;
  const isRefreshing = isLoading || status === 'loading';

  const statusContent = useMemo(() => {
    if (status === 'loading') {
      return (
        <div className={`flex flex-col items-center justify-center h-48 ${styles.node.bg} border ${styles.toolbar.border} rounded-lg space-y-2`}>
          <div className={`animate-spin rounded-full h-8 w-8 border-2 border-transparent border-b-2 ${styles.gallery.spinnerBorder}`} />
          <p className={`${styles.node.labelText} text-xs`}>Loading gallery…</p>
        </div>
      );
    }

    if (status === 'error') {
      return (
        <div className={`space-y-3 p-4 border ${styles.toolbar.border} rounded-lg ${styles.node.bg}`} role="alert">
          <p className={`${styles.node.labelText} text-sm`}>{errorMessage || 'Unable to load gallery history.'}</p>
          <button
            onClick={(event) => {
              event.stopPropagation();
              onRefresh();
            }}
            className={`w-full flex items-center justify-center gap-2 p-2 ${styles.toolbar.buttonBg} border ${styles.toolbar.border} rounded-md text-sm font-semibold transition`}
          >
            <RefreshCcw className="w-4 h-4" />
            Try Again
          </button>
        </div>
      );
    }

    return null;
  }, [errorMessage, onRefresh, status, styles.gallery.spinnerBorder, styles.node.bg, styles.node.labelText, styles.toolbar.border, styles.toolbar.buttonBg]);

  const renderMediaPreview = (item: GalleryItem, compact = false) => {
    if (!item.url) {
      return (
        <div className={`flex items-center justify-center h-full w-full ${styles.node.imagePlaceholderBg} rounded-md`}>
          <Sparkles className={`w-5 h-5 ${styles.gallery.accentText}`} />
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
            autoPlay={videoAutoplayEnabled}
            className="w-full h-full object-contain bg-black/40 rounded-md pointer-events-none"
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
        className="w-full h-full object-contain bg-black/40 rounded-md pointer-events-none"
        loading="lazy"
      />
    );
  };

  const renderGalleryContent = () => {
    if (status !== 'ready') {
      return statusContent;
    }

    if (mediaToShow.length === 0) {
      return (
        <div className={`flex flex-col items-center justify-center h-48 text-center px-6 ${styles.node.labelText}`}>
          <Star className={`w-8 h-8 mx-auto mb-2 ${styles.gallery.accentText}`} />
          <p className="text-xs font-semibold">
            {activeTab === 'history' ? 'No history yet' : 'Starred items coming soon'}
          </p>
          {activeTab === 'history' && <p className="text-xs mt-1">Generate media to populate your gallery.</p>}
        </div>
      );
    }

    return (
      <div className="grid grid-cols-2 gap-2 overflow-y-auto max-h-[calc(100vh-340px)] custom-scrollbar px-1 pb-1">
        {mediaToShow.map((item) => (
          <div
            key={`${item.id}-${videoAutoplayEnabled}`}
            role="button"
            tabIndex={0}
            draggable={true}
            onDragStart={(event) => {
              event.dataTransfer.effectAllowed = 'copy';
              event.dataTransfer.setData('application/json', JSON.stringify({
                type: item.type === 'image' ? 'gallery-image' : 'gallery-video',
                fileName: item.fileName,
                url: item.url,
                itemType: item.type,
                veoVideoObject: item.veoVideoObject,
                veoModel: item.veoModel,
              }));
            }}
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
            aria-label={`Open ${item.fileName}`}
            className={`group relative rounded-lg ${styles.node.imagePlaceholderBg} flex aspect-square overflow-hidden border ${styles.node.imagePlaceholderBorder} hover:ring-2 focus-visible:outline-none focus-visible:ring-2 transition ${styles.gallery.itemHoverRing} ${styles.gallery.itemFocusRing} ${styles.gallery.itemHoverShadow} ${item.type === 'image' ? 'cursor-grab active:cursor-grabbing' : ''}`}
          >
            {renderMediaPreview(item)}
            {!isMinimized && (
              <>
                <div
                  className={`absolute top-1 left-1 px-2 py-0.5 rounded-full text-[10px] font-semibold uppercase tracking-wide transition-opacity duration-150 ${styles.gallery.accentBadge} opacity-0 group-hover:opacity-100 group-focus-within:opacity-100`}
                >
                  {formatRelativeTime(item.createdAt)}
                </div>
                <div className="absolute inset-x-0 bottom-0 flex items-center justify-between gap-2 px-2 py-1 text-[10px] font-medium bg-black/60 text-white/90 backdrop-blur-sm transition-opacity duration-150 opacity-0 group-hover:opacity-100 group-focus-within:opacity-100">
                  <span className="truncate">{item.fileName}</span>
                  <span className={`flex items-center gap-1 uppercase tracking-wide ${styles.gallery.accentText}`}>
                    {item.type === 'video' ? <Video className="w-3 h-3" /> : <Sparkles className="w-3 h-3" />}
                    {getMediaTypeLabel(item.type)}
                  </span>
                </div>
              </>
            )}
            <button
              onClick={(event) => {
                event.stopPropagation();
                onDeleteItem(item.id);
              }}
              className="absolute top-1 right-1 p-1 rounded-full bg-black/50 text-white hover:bg-black/70 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white/80"
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
            <div className={`animate-spin rounded-full h-4 w-4 border border-transparent border-b-2 ${styles.gallery.spinnerBorder}`} />
            <span className="text-xs">Loading…</span>
          </div>
        </div>
      );
    }

    if (status !== 'ready' || mediaToShow.length === 0) {
      return (
        <div className="flex items-center justify-center h-16 text-center">
          <div className={`${styles.node.labelText}`}>
            <Star className={`w-6 h-6 mx-auto mb-1 ${styles.gallery.accentText}`} />
            <p className="text-xs">History will appear here</p>
          </div>
        </div>
      );
    }

    return (
      <div
        className="flex space-x-2 overflow-x-auto pb-2 px-1 custom-scrollbar"
        onWheel={(event) => {
          if (event.deltaY !== 0 && event.deltaX === 0) {
            event.preventDefault();
            event.currentTarget.scrollLeft += event.deltaY;
          }
        }}
      >
        {mediaToShow.slice(0, 12).map((item) => (
          <button
            key={`${item.id}-${videoAutoplayEnabled}`}
            type="button"
            draggable={true}
            onDragStart={(event) => {
              event.dataTransfer.effectAllowed = 'copy';
              event.dataTransfer.setData('application/json', JSON.stringify({
                type: item.type === 'image' ? 'gallery-image' : 'gallery-video',
                fileName: item.fileName,
                url: item.url,
                itemType: item.type,
                veoVideoObject: item.veoVideoObject,
                veoModel: item.veoModel,
              }));
            }}
            onClick={(event) => {
              event.stopPropagation();
              onSelectItem(item);
            }}
            className={`group relative w-12 h-12 flex-shrink-0 rounded-md overflow-hidden ${styles.node.imagePlaceholderBg} border ${styles.node.imagePlaceholderBorder} hover:ring-2 focus-visible:outline-none focus-visible:ring-2 transition ${styles.gallery.itemHoverRing} ${styles.gallery.itemFocusRing} cursor-grab active:cursor-grabbing`}
            aria-label={`Preview ${item.fileName}`}
          >
            {renderMediaPreview(item, true)}
          </button>
        ))}
      </div>
    );
  };

  const handleRefresh = (event: React.MouseEvent<HTMLButtonElement>) => {
    event.stopPropagation();
    if (!isRefreshing) {
      onRefresh();
    }
  };

  return (
    <aside
      className={`absolute top-20 right-4 z-20 w-64 ${styles.toolbar.bg} backdrop-blur-sm border ${styles.toolbar.border} rounded-lg shadow-lg flex flex-col transition-all duration-300 ease-in-out`}
      aria-label="Gallery"
    >
      <div className="flex items-center justify-between p-2 gap-2">
        <button
          type="button"
          onClick={() => setIsMinimized((prev) => !prev)}
          aria-expanded={!isMinimized}
          aria-controls={panelBodyId}
          className="flex items-center gap-3 flex-1 text-left p-1 rounded-md hover:bg-white/5 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white/30"
        >
          <div className="flex flex-col">
            <span className="font-semibold text-sm">Gallery</span>
            <span className={`text-[11px] uppercase tracking-wide ${styles.gallery.accentText}`}>
              {activeTab === 'history' ? `${historyCount} in history` : `${starredCount} starred`}
            </span>
          </div>
          <span className="ml-auto text-gray-400">
            {isMinimized ? <ChevronDown className="w-4 h-4" /> : <ChevronUp className="w-4 h-4" />}
          </span>
        </button>
        <button
          type="button"
          onClick={handleRefresh}
          disabled={isRefreshing}
          className={`p-2 rounded-md border ${styles.toolbar.border} ${styles.toolbar.buttonBg} flex-shrink-0 text-xs font-semibold flex items-center gap-1 transition disabled:opacity-60 disabled:cursor-not-allowed`}
          aria-label="Refresh gallery"
        >
          <RefreshCcw className={`w-4 h-4 ${isRefreshing ? 'animate-spin' : ''}`} />
        </button>
      </div>

      <div
        id={panelBodyId}
        className={`transition-all duration-300 ease-in-out overflow-hidden ${isMinimized ? 'max-h-0 opacity-0 pointer-events-none' : 'max-h-[1000px] opacity-100'}`}
      >
        <div className={`px-2 pt-2 pb-1 border-t ${styles.toolbar.border}`}>
          <div className={`flex p-0.5 rounded-md ${styles.node.bg} gap-1`}> 
            <button
              onClick={(event) => {
                event.stopPropagation();
                setActiveTab('history');
              }}
              className={`flex-1 text-xs font-semibold py-1 rounded transition-colors flex items-center justify-center gap-1 ${activeTab === 'history'
                ? `${styles.sidebar.itemActiveBg} ${styles.sidebar.itemActiveText}`
                : `${styles.sidebar.itemText} ${styles.sidebar.itemHoverBg}`}`}
            >
              History
              <span className={`text-[10px] px-1.5 py-0.5 rounded-full ${styles.gallery.accentBadge}`}>
                {historyCount}
              </span>
            </button>
            <button
              onClick={(event) => {
                event.stopPropagation();
                setActiveTab('starred');
              }}
              className={`flex-1 text-xs font-semibold py-1 rounded transition-colors flex items-center justify-center gap-1 ${activeTab === 'starred'
                ? `${styles.sidebar.itemActiveBg} ${styles.sidebar.itemActiveText}`
                : `${styles.sidebar.itemText} ${styles.sidebar.itemHoverBg}`}`}
            >
              Starred
              <span className={`text-[10px] px-1.5 py-0.5 rounded-full ${styles.gallery.accentBadge}`}>
                {starredCount}
              </span>
            </button>
          </div>
        </div>
        <div className="p-2 space-y-3 relative">
          {isLoading && (
            <div className="absolute inset-0 bg-black/30 backdrop-blur-sm flex items-center justify-center rounded-lg z-10">
              <div className={`animate-spin rounded-full h-8 w-8 border border-transparent border-b-2 ${styles.gallery.spinnerBorder}`} />
            </div>
          )}
          {renderGalleryContent()}
          {status === 'ready' && (
            <button
              onClick={(event) => {
                event.stopPropagation();
                onRefresh();
              }}
              disabled={isRefreshing}
              className={`w-full text-xs font-semibold p-2 border ${styles.toolbar.border} rounded-md ${styles.toolbar.buttonBg} ${isRefreshing ? 'opacity-60 cursor-not-allowed' : 'hover:opacity-90 transition'}`}
            >
              {isRefreshing ? 'Refreshing…' : 'Refresh Gallery'}
            </button>
          )}
        </div>
      </div>

      <div className={`transition-all duration-300 ease-in-out overflow-hidden ${!isMinimized ? 'max-h-0 opacity-0 pointer-events-none' : 'max-h-24 opacity-100'}`}>
        <div className={`p-2 border-t ${styles.toolbar.border}`}>
          {minimizedContent()}
        </div>
      </div>
    </aside>
  );
};

export default GalleryPanel;
