import React, { useState } from 'react';
import { useTheme } from '../contexts/ThemeContext';
import ChevronUpIcon from './icons/ChevronUpIcon';
import ChevronDownIcon from './icons/ChevronDownIcon';
import VideoIcon from './icons/VideoIcon';
import StarIcon from './icons/StarIcon';

const aspectRatios = ['1:1', '16:9', '9:16', '4:3', '3:4'];

const mockMedia = Array.from({ length: 15 }, (_, i) => {
    const id = i + 20;
    if (i % 4 === 0) { // Make every 4th item a video
        return {
            id: `vid-${id}`,
            type: 'video' as const,
            src: 'https://www.w3schools.com/html/mov_bbb.mp4',
            alt: `Mock video ${id}`,
        };
    } else { // The rest are images
        const ratio = aspectRatios[i % aspectRatios.length];
        const [w, h] = ratio.split(':').map(Number);
        return {
            id: `img-${id}`,
            type: 'image' as const,
            src: `https://picsum.photos/id/${id}/${400}/${Math.round(400 * h / w)}`,
            alt: `Mock image ${id} with aspect ratio ${ratio}`
        };
    }
});


const GalleryPanel: React.FC = () => {
    const [isMinimized, setIsMinimized] = useState(true);
    const [activeTab, setActiveTab] = useState<'history' | 'starred'>('history');
    const { styles } = useTheme();

    const handleMinimizedScroll = (e: React.WheelEvent<HTMLDivElement>) => {
        // Allow native horizontal scrolling (e.g., trackpad) to work.
        // Convert vertical scroll to horizontal scroll.
        if (e.deltaY !== 0 && e.deltaX === 0) {
            e.preventDefault();
            e.currentTarget.scrollLeft += e.deltaY;
        }
    };
    
    // Using existing mock media for History, empty for Starred as it's a mockup.
    const starredMedia: typeof mockMedia = [];
    const mediaToShow = activeTab === 'history' ? mockMedia : starredMedia;

    return (
        <div 
            className={`absolute top-20 right-4 z-20 w-64 ${styles.toolbar.bg} backdrop-blur-sm border ${styles.toolbar.border} rounded-lg shadow-lg flex flex-col transition-all duration-300 ease-in-out`}
        >
            {/* Header */}
            <div 
                className={`flex items-center justify-between p-2 cursor-pointer select-none`}
                onClick={() => setIsMinimized(!isMinimized)}
            >
                <h3 className="font-bold text-sm">Gallery</h3>
                <button
                    className="p-1 rounded-full text-gray-400 hover:bg-gray-600/50 hover:text-white transition-colors"
                    aria-label={isMinimized ? "Expand gallery" : "Collapse gallery"}
                >
                    {isMinimized ? <ChevronDownIcon className="w-4 h-4" /> : <ChevronUpIcon className="w-4 h-4" />}
                </button>
            </div>

            {/* Expanded Content */}
            <div className={`transition-all duration-300 ease-in-out overflow-hidden ${isMinimized ? 'max-h-0 opacity-0' : 'max-h-[calc(100vh-180px)] opacity-100'}`}>
                {/* Tabs */}
                <div className={`px-2 pt-2 pb-1 border-t ${styles.toolbar.border}`}>
                    <div className={`flex p-0.5 rounded-md ${styles.node.bg}`}>
                        <button onClick={(e) => { e.stopPropagation(); setActiveTab('history'); }} className={`flex-1 text-xs font-semibold py-1 rounded transition-colors ${activeTab === 'history' ? `${styles.sidebar.itemActiveBg} ${styles.sidebar.itemActiveText}` : `${styles.sidebar.itemText} ${styles.sidebar.itemHoverBg}`}`}>History</button>
                        <button onClick={(e) => { e.stopPropagation(); setActiveTab('starred'); }} className={`flex-1 text-xs font-semibold py-1 rounded transition-colors ${activeTab === 'starred' ? `${styles.sidebar.itemActiveBg} ${styles.sidebar.itemActiveText}` : `${styles.sidebar.itemText} ${styles.sidebar.itemHoverBg}`}`}>Starred</button>
                    </div>
                </div>

                {/* Content */}
                <div className={`p-2 ${mediaToShow.length === 0 ? 'h-48' : ''}`}>
                    {mediaToShow.length > 0 ? (
                        <div className="grid grid-cols-2 gap-2 overflow-y-auto max-h-[calc(100vh-260px)] custom-scrollbar">
                            {mediaToShow.map(media => (
                                 <div key={media.id} className={`relative group aspect-square rounded-md ${styles.node.imagePlaceholderBg} p-1 flex items-center justify-center`}>
                                    {media.type === 'image' ? <img src={media.src} alt={media.alt} className="max-w-full max-h-full object-contain rounded-sm" />
                                    : (
                                        <>
                                            <video src={media.src} muted loop autoPlay playsInline className="max-w-full max-h-full object-contain rounded-sm" />
                                            <div className="absolute bottom-1 right-1 bg-black/50 p-1 rounded-full">
                                                <VideoIcon className="w-3 h-3 text-white" />
                                            </div>
                                        </>
                                    )}
                                </div>
                            ))}
                        </div>
                    ) : (
                        <div className="flex items-center justify-center h-full text-center">
                            <div className={`${styles.node.labelText}`}>
                                <StarIcon className="w-8 h-8 mx-auto mb-2 text-yellow-400" />
                                <p className="text-xs font-semibold">No Starred Items</p>
                                <p className="text-xs mt-1">Your starred generations will appear here.</p>
                            </div>
                        </div>
                    )}
                </div>
            </div>

            {/* Minimized Content */}
            <div className={`transition-all duration-300 ease-in-out overflow-hidden ${!isMinimized ? 'max-h-0 opacity-0' : 'max-h-24 opacity-100'}`}>
                <div className={`p-2 border-t ${styles.toolbar.border}`}>
                    {mediaToShow.length > 0 ? (
                        <div 
                            className="flex space-x-2 overflow-x-auto pb-2 custom-scrollbar"
                            onWheel={handleMinimizedScroll}
                        >
                            {mediaToShow.map(media => (
                               <div key={media.id} className={`w-12 h-12 flex-shrink-0 rounded-md ${styles.node.imagePlaceholderBg} p-0.5 flex items-center justify-center overflow-hidden`}>
                                   {media.type === 'image' ? <img src={media.src} alt={media.alt} className="max-w-full max-h-full object-contain rounded-sm" />
                                   : <video src={media.src} muted loop autoPlay playsInline className="w-full h-full object-cover rounded-sm" />}
                                </div>
                            ))}
                        </div>
                    ) : (
                         <div className="flex items-center justify-center h-16 text-center">
                            <div className={`${styles.node.labelText}`}>
                                <StarIcon className="w-6 h-6 mx-auto mb-1 text-yellow-400" />
                                <p className="text-xs">No starred items</p>
                            </div>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
};

export default GalleryPanel;