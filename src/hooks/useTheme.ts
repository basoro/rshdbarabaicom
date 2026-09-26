import { useState, useEffect } from 'react';

type Theme = 'light' | 'dark';

type UseThemeOptions = {
  storageKey?: string;
  defaultTheme?: Theme;
};

export function useTheme({ storageKey = 'theme', defaultTheme }: UseThemeOptions = {}) {
  const [theme, setTheme] = useState<Theme>(() => {
    const savedTheme = localStorage.getItem(storageKey);
    if (savedTheme === 'light' || savedTheme === 'dark') {
      return savedTheme;
    }
    if (defaultTheme) {
      return defaultTheme;
    }
    return window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light';
  });

  useEffect(() => {
    localStorage.setItem(storageKey, theme);
  }, [storageKey, theme]);

  const toggleTheme = () => {
    setTheme(prevTheme => prevTheme === 'light' ? 'dark' : 'light');
  };

  return {
    theme,
    toggleTheme,
    isDark: theme === 'dark'
  };
}
