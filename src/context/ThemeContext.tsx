'use client';

import React, { createContext, useContext, useEffect, useState } from 'react';
import { getUserProfile, saveUserProfile } from '@/services/storage';

type Theme = 'light' | 'dark';

interface ThemeContextType {
  theme: Theme;
  setTheme: (theme: Theme) => void;
  toggleTheme: () => void;
}

const ThemeContext = createContext<ThemeContextType | undefined>(undefined);

const STORAGE_KEY = 'mls_tour_planner_theme_v1';

export function ThemeProvider({ children }: { children: React.ReactNode }) {
  const [theme, setThemeState] = useState<Theme>('light');
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    // 1. Read theme preference from localStorage or user profile
    const savedLocalTheme = localStorage.getItem(STORAGE_KEY) as Theme | null;
    const profile = getUserProfile();
    const savedProfileTheme = profile?.theme_mode;

    const initialTheme: Theme = savedLocalTheme || savedProfileTheme || 'light';
    setThemeState(initialTheme);
    applyThemeToDocument(initialTheme);
    setMounted(true);
  }, []);

  const applyThemeToDocument = (newTheme: Theme) => {
    const root = document.documentElement;
    if (newTheme === 'dark') {
      root.classList.add('dark');
      root.classList.remove('light');
    } else {
      root.classList.add('light');
      root.classList.remove('dark');
    }
  };

  const setTheme = (newTheme: Theme) => {
    setThemeState(newTheme);
    localStorage.setItem(STORAGE_KEY, newTheme);
    applyThemeToDocument(newTheme);

    // Sync with UserProfile if logged in
    const profile = getUserProfile();
    if (profile && profile.id) {
      saveUserProfile({ ...profile, theme_mode: newTheme });
    }
  };

  const toggleTheme = () => {
    setTheme(theme === 'light' ? 'dark' : 'light');
  };

  return (
    <ThemeContext.Provider value={{ theme, setTheme, toggleTheme }}>
      {children}
    </ThemeContext.Provider>
  );
}

export function useTheme() {
  const context = useContext(ThemeContext);
  if (!context) {
    throw new Error('useTheme must be used within a ThemeProvider');
  }
  return context;
}
