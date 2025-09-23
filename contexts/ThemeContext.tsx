import React, { createContext, useContext, useState, useMemo, ReactNode } from 'react';

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
    },
    node: {
      bg: 'bg-gray-800',
      border: 'border-gray-700',
      headerBg: 'bg-gray-700',
      text: 'text-gray-200',
      labelText: 'text-gray-400',
      inputBg: 'bg-gray-900',
      inputBorder: 'border-gray-600',
      inputFocusRing: 'focus:ring-cyan-500',
      imagePlaceholderBg: 'bg-gray-900/50',
      imagePlaceholderBorder: 'border-gray-600',
      imagePlaceholderIcon: 'text-gray-600',
    },
    connector: {
      color: '#2DD4BF',
      tempColor: '#F6E05E',
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
    },
    handle: {
      bg: 'bg-gray-600',
      border: 'border-gray-400',
      hoverBg: 'hover:bg-cyan-500',
      hoverBorder: 'hover:border-cyan-400',
      connectedBg: 'bg-cyan-500',
      connectedBorder: 'border-cyan-400',
    },
    scrollbar: {
      thumb: '#718096',
      thumbHover: '#A0AEC0',
      track: 'transparent',
    },
    switch: {
      bgOn: 'bg-cyan-600',
      bgOff: 'bg-gray-600',
      thumb: 'bg-white',
    },
    sidebar: {
      bg: 'bg-gray-900/50',
      itemText: 'text-gray-300',
      itemHoverBg: 'hover:bg-gray-700/50',
      itemActiveText: 'text-white',
      itemActiveBg: 'bg-cyan-600',
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
    },
    connector: {
      color: '#3B82F6',
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
    },
    handle: {
      bg: 'bg-white',
      border: 'border-gray-400',
      hoverBg: 'hover:bg-blue-500',
      hoverBorder: 'hover:border-blue-400',
      connectedBg: 'bg-blue-500',
      connectedBorder: 'border-blue-400',
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
    },
    connector: {
      color: '#f59e0b',
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
    },
    handle: {
      bg: 'bg-stone-600',
      border: 'border-stone-400',
      hoverBg: 'hover:bg-amber-500',
      hoverBorder: 'hover:border-amber-400',
      connectedBg: 'bg-amber-500',
      connectedBorder: 'border-amber-400',
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

export const ThemeProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
    const [theme, setTheme] = useState<Theme>('dark');
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
