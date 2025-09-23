
import React from 'react';
import { useTheme, themes } from '../contexts/ThemeContext';
import SunIcon from './icons/SunIcon';
import MoonIcon from './icons/MoonIcon';
import SparkleIcon from './icons/SparkleIcon';

const ThemeSwitcher: React.FC = () => {
  const { theme, setTheme, styles } = useTheme();

  const getButtonClasses = (buttonTheme: 'dark' | 'modern' | 'elegant') => {
    const isActive = theme === buttonTheme;
    let classes = 'p-2 rounded-md transition-colors ';
    
    if (isActive) {
        if (theme === 'dark') classes += 'bg-cyan-500 text-white';
        if (theme === 'modern') classes += 'bg-blue-500 text-white';
        if (theme === 'elegant') classes += 'bg-amber-500 text-white';
    } else {
        classes += `text-gray-400 ${styles.toolbar.buttonHoverBg}`;
    }
    return classes;
  };

  return (
    <div className={`p-1 ${styles.toolbar.bg} backdrop-blur-sm border ${styles.toolbar.border} rounded-lg shadow-lg flex items-center space-x-1`}>
      {Object.values(themes).map(themeOption => (
        <button
          key={themeOption.key}
          onClick={() => setTheme(themeOption.key)}
          className={getButtonClasses(themeOption.key)}
          aria-label={`Switch to ${themeOption.name} theme`}
          title={`Switch to ${themeOption.name} theme`}
        >
          {themeOption.key === 'dark' && <MoonIcon className="w-5 h-5" />}
          {themeOption.key === 'modern' && <SunIcon className="w-5 h-5" />}
          {themeOption.key === 'elegant' && <SparkleIcon className="w-5 h-5" />}
        </button>
      ))}
    </div>
  );
};

export default ThemeSwitcher;
