import React, { useMemo, useRef, useState } from 'react';
import { Play, SkipBack, SkipForward, Scissors, Film } from 'lucide-react';
import { Theme, useTheme } from '../contexts/ThemeContext';

const markersInSeconds = [0, 5, 10, 15, 20, 24];
const TOTAL_DURATION = 24; // seconds
const PLAYHEAD_TIME = 12; // seconds

interface TimelineSegment {
  label: string;
  duration: number;
}

interface TimelineTrack {
  label: string;
  color: string;
  segments: TimelineSegment[];
}

type TimelineTrackWithPositions = Omit<TimelineTrack, 'segments'> & {
  segments: Array<TimelineSegment & { start: number }>;
};

const SEGMENT_GAP = 6; // px gap between adjacent clips

const timelineTracks: TimelineTrack[] = [
  {
    label: 'Video 1',
    color: 'bg-sky-500/70 border-sky-400/70',
    segments: [
      { label: 'Intro', duration: 6 },
      { label: 'Main Shot', duration: 10 },
      { label: 'B-Roll', duration: 8 },
    ],
  },
  {
    label: 'Audio',
    color: 'bg-emerald-500/70 border-emerald-400/70',
    segments: [
      { label: 'Narration', duration: 12 },
      { label: 'Ambience', duration: 12 },
    ],
  },
  {
    label: 'Captions',
    color: 'bg-amber-500/70 border-amber-400/70',
    segments: [
      { label: 'Line 1', duration: 6 },
      { label: 'Line 2', duration: 8 },
      { label: 'Line 3', duration: 10 },
    ],
  },
];

interface VideoEditorMockProps {
  className?: string;
}

const themePalette: Record<Theme, {
  surfaceBg: string;
  previewLabel: string;
  previewSubtext: string;
  timelineLabel: string;
  chipBg: string;
  chipText: string;
  markerText: string;
  dividerColor: string;
  trackBg: string;
  trackBorder: string;
  playheadColor: string;
  playheadHeadBg: string;
  playheadHeadBorder: string;
}> = {
  dark: {
    surfaceBg: 'bg-slate-950',
    previewLabel: 'text-gray-400',
    previewSubtext: 'text-gray-300',
    timelineLabel: 'text-gray-400',
    chipBg: 'bg-slate-800/70',
    chipText: 'text-gray-200',
    markerText: 'text-gray-500',
    dividerColor: 'border-white/10',
    trackBg: 'bg-white/5',
    trackBorder: 'border border-white/10',
    playheadColor: 'bg-cyan-400',
    playheadHeadBg: 'bg-cyan-400',
    playheadHeadBorder: 'border-white/40',
  },
  modern: {
    surfaceBg: 'bg-white',
    previewLabel: 'text-gray-500',
    previewSubtext: 'text-gray-700',
    timelineLabel: 'text-gray-500',
    chipBg: 'bg-gray-100',
    chipText: 'text-gray-600',
    markerText: 'text-gray-500',
    dividerColor: 'border-gray-200',
    trackBg: 'bg-gray-100',
    trackBorder: 'border border-gray-200',
    playheadColor: 'bg-blue-500',
    playheadHeadBg: 'bg-blue-500',
    playheadHeadBorder: 'border-blue-200/70',
  },
  elegant: {
    surfaceBg: 'bg-stone-900',
    previewLabel: 'text-amber-200',
    previewSubtext: 'text-stone-100',
    timelineLabel: 'text-amber-200',
    chipBg: 'bg-stone-800/80',
    chipText: 'text-amber-100',
    markerText: 'text-amber-200',
    dividerColor: 'border-amber-500/40',
    trackBg: 'bg-stone-900/40',
    trackBorder: 'border border-amber-500/30',
    playheadColor: 'bg-amber-400',
    playheadHeadBg: 'bg-amber-400',
    playheadHeadBorder: 'border-amber-200/60',
  },
};

const VideoEditorMock: React.FC<VideoEditorMockProps> = ({ className = '' }) => {
  const { styles, theme } = useTheme();
  const palette = themePalette[theme];
  const MIN_PIXELS_PER_SECOND = 20;
  const MAX_PIXELS_PER_SECOND = 140;
  const [pixelsPerSecond, setPixelsPerSecond] = useState(40);
  const timelineScrollRef = useRef<HTMLDivElement>(null);

  const computedTracks = useMemo<TimelineTrackWithPositions[]>(() => {
    return timelineTracks.map((track) => {
      let current = 0;
      const segmentsWithStart = track.segments.map((segment) => {
        const withStart = { ...segment, start: current };
        current += segment.duration;
        return withStart;
      });
      return { ...track, segments: segmentsWithStart };
    });
  }, []);

  const timelineWidth = TOTAL_DURATION * pixelsPerSecond;
  const playheadPosition = Math.min(PLAYHEAD_TIME, TOTAL_DURATION) * pixelsPerSecond;

  const clamp = (value: number, min: number, max: number) => Math.min(max, Math.max(min, value));

  const handleTimelineWheel = (event: React.WheelEvent<HTMLDivElement>) => {
    event.preventDefault();
    if (!timelineScrollRef.current) return;
    const container = timelineScrollRef.current;
    const rect = container.getBoundingClientRect();
    const offsetX = event.clientX - rect.left;
    const scrollLeft = container.scrollLeft;
    const cursorTime = (scrollLeft + offsetX) / pixelsPerSecond;
    const zoomFactor = event.deltaY < 0 ? 1.1 : 0.9;

    setPixelsPerSecond((prev) => {
      const next = clamp(prev * zoomFactor, MIN_PIXELS_PER_SECOND, MAX_PIXELS_PER_SECOND);
      requestAnimationFrame(() => {
        if (timelineScrollRef.current) {
          const newScrollLeft = Math.max(0, cursorTime * next - offsetX);
          timelineScrollRef.current.scrollLeft = newScrollLeft;
        }
      });
      return next;
    });
  };

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60)
      .toString()
      .padStart(2, '0');
    const secs = Math.floor(seconds % 60)
      .toString()
      .padStart(2, '0');
    return `${mins}:${secs}`;
  };

  return (
    <div className={`w-full h-full flex flex-col ${className}`}>
      <div className="flex flex-col gap-4 h-full overflow-hidden">
        <div
          className={`flex-1 rounded-xl border ${styles.toolbar.border} ${styles.toolbar.bg} backdrop-blur-sm relative overflow-hidden min-h-[360px]`}
        >
          <div className={`absolute inset-0 ${palette.surfaceBg}`} />
          <div className="relative z-10 h-full flex items-center justify-center p-6">
            <div className="w-full max-w-4xl aspect-video bg-black rounded-lg border border-white/10 relative overflow-hidden">
              <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-black/20 to-transparent" />
              <div className="absolute inset-0 flex flex-col justify-between p-6">
                <div className="text-center space-y-2">
                  <p className={`text-xs uppercase tracking-[0.4em] ${palette.previewLabel}`}>Preview</p>
                  <h1 className="text-3xl font-semibold text-white">City Night Run</h1>
                  <p className={`text-sm ${palette.previewSubtext}`}>Muted · 4K · 24 fps</p>
                </div>
                <div className="flex flex-col items-center gap-3 text-sm text-white">
                  <div className="text-center">
                    <p className={`text-xs uppercase tracking-[0.3em] ${palette.previewLabel}`}>Timeline</p>
                    <p className="text-lg font-medium text-white">00:12 / 00:24</p>
                  </div>
                  <div className="flex items-center gap-4">
                    <button className="p-2 rounded-full bg-white/10 border border-white/20 text-white">
                      <SkipBack className="w-4 h-4" />
                    </button>
                    <button className="p-3 rounded-full bg-white text-gray-900 shadow-lg shadow-cyan-500/20">
                      <Play className="w-4 h-4" />
                    </button>
                    <button className="p-2 rounded-full bg-white/10 border border-white/20 text-white">
                      <SkipForward className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

        <div className={`rounded-xl border ${styles.toolbar.border} ${styles.toolbar.bg} backdrop-blur-sm px-4 py-4`}>
          <div className={`flex items-center justify-between text-xs ${palette.timelineLabel}`}>
            <div className="flex items-center gap-2">
              <Scissors className="w-4 h-4" /> Blade
              <span className={`px-2 py-0.5 rounded-full text-[11px] ${palette.chipBg} ${palette.chipText}`}>Snap On</span>
              <span className={`px-2 py-0.5 rounded-full text-[11px] ${palette.chipBg} ${palette.chipText}`}>Ripple</span>
            </div>
            <div className="flex items-center gap-2">
              <Film className="w-4 h-4" /> 24 fps
              <span className={`px-2 py-0.5 rounded-full text-[11px] ${palette.chipBg} ${palette.chipText}`}>00:24</span>
            </div>
          </div>
          <div className={`mt-4 border-t pt-3 space-y-2 relative ${palette.dividerColor}`}>
            <div className="flex items-center justify-between text-[11px] uppercase tracking-wide">
              <span className={`${palette.markerText}`}>Timeline Zoom</span>
              <span className={`${palette.markerText}`}>{pixelsPerSecond.toFixed(0)} px/s</span>
            </div>
            <div
              className="relative overflow-x-auto custom-scrollbar"
              ref={timelineScrollRef}
              onWheel={handleTimelineWheel}
            >
              <div className="relative pb-4" style={{ width: `${timelineWidth}px` }}>
                <div className={`flex justify-between text-[11px] ${palette.markerText}`}>
                  {markersInSeconds.map((marker) => (
                    <span key={marker}>{formatTime(marker)}</span>
                  ))}
                </div>
                <div className="mt-4 space-y-4">
                  {computedTracks.map((track) => (
                    <div key={track.label} className="flex items-center gap-3">
                      <div className={`w-24 text-xs uppercase tracking-wide ${palette.timelineLabel}`}>{track.label}</div>
                      <div
                        className={`relative h-12 rounded-xl ${palette.trackBg} ${palette.trackBorder} overflow-visible`}
                        style={{ width: `${timelineWidth}px` }}
                      >
                        {track.segments.map((segment, index) => (
                          <div
                            key={`${track.label}-${segment.label}`}
                            className={`absolute top-1 bottom-1 rounded-lg border px-3 flex items-center text-xs font-medium whitespace-nowrap ${track.color}`}
                            style={{
                              left: `${segment.start * pixelsPerSecond + index * SEGMENT_GAP}px`,
                              width: `${Math.max(segment.duration * pixelsPerSecond - SEGMENT_GAP, SEGMENT_GAP * 2)}px`,
                            }}
                          >
                            <span className="truncate">{segment.label}</span>
                          </div>
                        ))}
                      </div>
                    </div>
                  ))}
                </div>
                <div
                  className="absolute top-0 bottom-0 flex flex-col items-center pointer-events-none"
                  style={{ left: `${playheadPosition}px` }}
                >
                  <div className={`w-6 h-4 rounded-sm border ${palette.playheadHeadBorder} ${palette.playheadHeadBg} shadow shadow-black/30`} />
                  <div className={`flex-1 w-px ${palette.playheadColor}`} />
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default VideoEditorMock;
