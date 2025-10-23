import React, { createContext, useContext, useState, useMemo, ReactNode } from 'react';
import { HandleType } from '../types';

export type Theme = 'dark' | 'modern' | 'elegant';

export const themes = {
  dark: {
    name: 'Dark',
    key: 'dark' as Theme,
    app: {
      bg: 'bg-gray-900',
      text: 'text-white',
    },
    canvas: {
      grid: '#4A5568',
    },
    toolbar: {
      bg: 'bg-gray-800/80',
      border: 'border-gray-700',
      buttonBg: 'bg-gray-700',
      buttonHoverBg: 'hover:bg-gray-600',
      text: 'text-gray-200',
      iconColor: 'text-gray-300',
    },
    node: {
      bg: 'bg-gray-800',
      border: 'border-gray-700',
      headerBg: 'bg-gray-700',
      text: 'text-gray-200',
      labelText: 'text-gray-400',
      inputBg: 'bg-gray-900',
      inputBorder: 'border-gray-600',
      inputFocusRing: 'focus:ring-sky-500',
      imagePlaceholderBg: 'bg-gray-900/50',
      imagePlaceholderBorder: 'border-gray-600',
      imagePlaceholderIcon: 'text-gray-600',
      focusBorder: 'border-sky-400',
      focusRing: 'ring-2 ring-sky-400/30',
    },
    connector: {
      color: '#A0AEC0',
      tempColor: '#FBBF24',
    },
    modal: {
      bg: 'bg-gray-800',
      border: 'border-gray-700',
      text: 'text-white',
      messageText: 'text-gray-300',
      overlay: 'bg-black bg-opacity-80',
      cancelButton: 'bg-gray-600 hover:bg-gray-500',
      cancelFocusRing: 'focus:ring-gray-500',
      focusRingOffset: 'focus:ring-offset-gray-800',
      saveButton: 'bg-teal-600 hover:bg-teal-500',
      saveFocusRing: 'focus:ring-teal-500',
      discardButton: 'bg-rose-600 hover:bg-rose-500',
      discardFocusRing: 'focus:ring-rose-500',
    },
    handle: {
      border: 'border-gray-400',
      typeColors: {
        [HandleType.Text]: 'bg-amber-400 border-amber-300',
        [HandleType.Image]: 'bg-indigo-400 border-indigo-300',
        [HandleType.Video]: 'bg-emerald-400 border-emerald-300',
      },
    },
    scrollbar: {
      thumb: '#475569',
      thumbHover: '#64748b',
      track: 'transparent',
    },
    switch: {
      bgOn: 'bg-blue-600',
      bgOff: 'bg-gray-600',
      thumb: 'bg-white',
    },
    gallery: {
      accentText: 'text-sky-300',
      accentBadge: 'bg-sky-500/15 text-sky-200',
      spinnerBorder: 'border-sky-400',
      itemHoverRing: 'hover:ring-sky-400',
      itemFocusRing: 'focus-visible:ring-sky-400',
      itemHoverShadow: 'hover:shadow-sky-500/20',
    },
    sidebar: {
      bg: 'bg-gray-900/50',
      itemText: 'text-gray-300',
      itemHoverBg: 'hover:bg-gray-700/50',
      itemActiveText: 'text-white',
      itemActiveBg: 'bg-blue-600',
    },
  },
  modern: {
    name: 'Modern',
    key: 'modern' as Theme,
    app: {
      bg: 'bg-gray-50',
      text: 'text-gray-800',
    },
    canvas: {
      grid: '#D1D5DB',
    },
    toolbar: {
      bg: 'bg-white/80',
      border: 'border-gray-200',
      buttonBg: 'bg-gray-200',
      buttonHoverBg: 'hover:bg-gray-300',
      text: 'text-gray-800',
      iconColor: 'text-gray-700',
    },
    node: {
      bg: 'bg-white',
      border: 'border-gray-200 shadow-lg',
      headerBg: 'bg-gray-100 border-b border-gray-200',
      text: 'text-gray-700',
      labelText: 'text-gray-500',
      inputBg: 'bg-gray-100',
      inputBorder: 'border-gray-300',
      inputFocusRing: 'focus:ring-blue-500',
      imagePlaceholderBg: 'bg-gray-100',
      imagePlaceholderBorder: 'border-gray-300',
      imagePlaceholderIcon: 'text-gray-400',
      focusBorder: 'border-blue-400',
      focusRing: 'ring-2 ring-blue-400/30',
    },
    connector: {
      color: '#9CA3AF',
      tempColor: '#F59E0B',
    },
    modal: {
      bg: 'bg-white',
      border: 'border-gray-200',
      text: 'text-gray-900',
      messageText: 'text-gray-600',
      overlay: 'bg-black bg-opacity-50',
      cancelButton: 'bg-gray-200 hover:bg-gray-300',
      cancelFocusRing: 'focus:ring-gray-400',
      focusRingOffset: 'focus:ring-offset-white',
      saveButton: 'bg-green-600 hover:bg-green-500',
      saveFocusRing: 'focus:ring-green-500',
      discardButton: 'bg-orange-600 hover:bg-orange-500',
      discardFocusRing: 'focus:ring-orange-500',
    },
    handle: {
      border: 'border-gray-400',
      typeColors: {
        [HandleType.Text]: 'bg-amber-400 border-amber-300',
        [HandleType.Image]: 'bg-blue-500 border-blue-400',
        [HandleType.Video]: 'bg-emerald-500 border-emerald-400',
      },
    },
    scrollbar: {
      thumb: '#CBD5E0',
      thumbHover: '#A0AEC0',
      track: 'transparent',
    },
    switch: {
      bgOn: 'bg-blue-500',
      bgOff: 'bg-gray-300',
      thumb: 'bg-white',
    },
    gallery: {
      accentText: 'text-blue-600',
      accentBadge: 'bg-blue-500/15 text-blue-600',
      spinnerBorder: 'border-blue-400',
      itemHoverRing: 'hover:ring-blue-400',
      itemFocusRing: 'focus-visible:ring-blue-400',
      itemHoverShadow: 'hover:shadow-blue-500/20',
    },
    sidebar: {
        bg: 'bg-gray-100',
        itemText: 'text-gray-600',
        itemHoverBg: 'hover:bg-gray-200',
        itemActiveText: 'text-white',
        itemActiveBg: 'bg-blue-500',
      },
  },
  elegant: {
    name: 'Elegant',
    key: 'elegant' as Theme,
    app: {
      bg: 'bg-stone-900',
      text: 'text-stone-200',
    },
    canvas: {
      grid: '#57534e',
    },
    toolbar: {
      bg: 'bg-stone-800/80',
      border: 'border-stone-700',
      buttonBg: 'bg-stone-700',
      buttonHoverBg: 'hover:bg-stone-600',
      text: 'text-stone-200',
      iconColor: 'text-stone-300',
    },
    node: {
      bg: 'bg-stone-800',
      border: 'border-amber-700',
      headerBg: 'bg-stone-700/50',
      text: 'text-stone-200',
      labelText: 'text-amber-200',
      inputBg: 'bg-stone-900',
      inputBorder: 'border-stone-600',
      inputFocusRing: 'focus:ring-amber-500',
      imagePlaceholderBg: 'bg-stone-900/50',
      imagePlaceholderBorder: 'border-stone-700',
      imagePlaceholderIcon: 'text-stone-600',
      focusBorder: 'border-amber-400',
      focusRing: 'ring-2 ring-amber-400/30',
    },
    connector: {
      color: '#a8a29e',
      tempColor: '#818cf8',
    },
    modal: {
      bg: 'bg-stone-800',
      border: 'border-stone-700',
      text: 'text-stone-100',
      messageText: 'text-stone-300',
      overlay: 'bg-black bg-opacity-80',
      cancelButton: 'bg-stone-600 hover:bg-stone-500',
      cancelFocusRing: 'focus:ring-stone-500',
      focusRingOffset: 'focus:ring-offset-stone-800',
      saveButton: 'bg-teal-600 hover:bg-teal-500',
      saveFocusRing: 'focus:ring-teal-500',
      discardButton: 'bg-amber-700 hover:bg-amber-600',
      discardFocusRing: 'focus:ring-amber-600',
    },
    handle: {
      border: 'border-stone-400',
      typeColors: {
        [HandleType.Text]: 'bg-amber-500 border-amber-400',
        [HandleType.Image]: 'bg-indigo-400 border-indigo-300',
        [HandleType.Video]: 'bg-teal-400 border-teal-300',
      },
    },
    scrollbar: {
      thumb: '#b45309',
      thumbHover: '#d97706',
      track: 'transparent',
    },
    switch: {
        bgOn: 'bg-amber-500',
        bgOff: 'bg-stone-600',
        thumb: 'bg-white',
    },
    gallery: {
        accentText: 'text-amber-300',
        accentBadge: 'bg-amber-500/20 text-amber-200',
        spinnerBorder: 'border-amber-400',
        itemHoverRing: 'hover:ring-amber-400',
        itemFocusRing: 'focus-visible:ring-amber-400',
        itemHoverShadow: 'hover:shadow-amber-500/20',
    },
    sidebar: {
        bg: 'bg-stone-900/60',
        itemText: 'text-stone-300',
        itemHoverBg: 'hover:bg-stone-700/50',
        itemActiveText: 'text-white',
        itemActiveBg: 'bg-amber-600',
    },
  },
};

type ThemeStyles = typeof themes.dark;

interface ThemeContextType {
    theme: Theme;
    setTheme: (theme: Theme) => void;
    styles: ThemeStyles;
}

const ThemeContext = createContext<ThemeContextType | undefined>(undefined);

interface ThemeProviderProps {
    children: ReactNode;
    initialTheme?: Theme;
}

export const ThemeProvider: React.FC<ThemeProviderProps> = ({ children, initialTheme = 'dark' }) => {
    const [theme, setTheme] = useState<Theme>(initialTheme);
    const styles = useMemo(() => themes[theme], [theme]);

    React.useEffect(() => {
        const root = window.document.documentElement;
        root.style.setProperty('--scrollbar-thumb-color', styles.scrollbar.thumb);
        root.style.setProperty('--scrollbar-thumb-hover-color', styles.scrollbar.thumbHover);
        root.style.setProperty('--scrollbar-track-color', styles.scrollbar.track);
    }, [styles]);

    return (
        <ThemeContext.Provider value={{ theme, setTheme, styles }}>
            {children}
        </ThemeContext.Provider>
    );
};

export const useTheme = (): ThemeContextType => {
    const context = useContext(ThemeContext);
    if (!context) {
        throw new Error('useTheme must be used within a ThemeProvider');
    }
    return context;
};
