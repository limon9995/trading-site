import React, { createContext, useContext, useState, useEffect } from 'react';

const ThemeContext = createContext(null);

const readTheme = () => {
  try {
    return localStorage.getItem('theme');
  } catch {
    return null;
  }
};

const writeTheme = (value) => {
  try {
    localStorage.setItem('theme', value);
  } catch {}
};

export const ThemeProvider = ({ children }) => {
  const [isDark, setIsDark] = useState(() => {
    return readTheme() !== 'light';
  });

  useEffect(() => {
    document.documentElement.classList.toggle('dark', isDark);
    writeTheme(isDark ? 'dark' : 'light');
  }, [isDark]);

  const toggleTheme = () => setIsDark((prev) => !prev);

  return (
    <ThemeContext.Provider value={{ isDark, toggleTheme }}>
      {children}
    </ThemeContext.Provider>
  );
};

export const useTheme = () => useContext(ThemeContext);
