import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { Theme } from './ThemeContext';

export interface UserPreferences {
  theme: Theme;
  showLauncherOnStartup: boolean;
  enableVideoAutoplayInGallery: boolean;
  showMinimap: boolean;
}

interface UserPreferencesContextType {
  preferences: UserPreferences;
  updatePreferences: (updates: Partial<UserPreferences>) => Promise<void>;
  isLoading: boolean;
}

const UserPreferencesContext = createContext<UserPreferencesContextType | undefined>(undefined);

export const UserPreferencesProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [preferences, setPreferences] = useState<UserPreferences>({
    theme: 'dark',
    showLauncherOnStartup: true,
    enableVideoAutoplayInGallery: false,
    showMinimap: true,
  });
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    // Load preferences on mount
    const loadPreferences = async () => {
      try {
        const response = await fetch('/api/user-preferences');
        if (response.ok) {
          const prefs = await response.json();
          setPreferences(prefs);
        }
      } catch (error) {
        console.error('Failed to load user preferences', error);
      } finally {
        setIsLoading(false);
      }
    };

    loadPreferences();
  }, []);

  const updatePreferences = async (updates: Partial<UserPreferences>) => {
    try {
      const newPreferences = { ...preferences, ...updates };
      const response = await fetch('/api/user-preferences', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(updates),
      });

      if (response.ok) {
        const savedPrefs = await response.json();
        setPreferences(savedPrefs);
      } else {
        throw new Error('Failed to save preferences');
      }
    } catch (error) {
      console.error('Failed to update user preferences', error);
      throw error;
    }
  };

  return (
    <UserPreferencesContext.Provider value={{ preferences, updatePreferences, isLoading }}>
      {children}
    </UserPreferencesContext.Provider>
  );
};

export const useUserPreferences = (): UserPreferencesContextType => {
  const context = useContext(UserPreferencesContext);
  if (!context) {
    throw new Error('useUserPreferences must be used within a UserPreferencesProvider');
  }
  return context;
};