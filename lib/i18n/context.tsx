'use client';

import React, { createContext, useContext, useEffect, useState } from 'react';
import { Language, defaultLanguage, getTranslation } from './index';

interface I18nContextType {
  language: Language;
  setLanguage: (lang: Language) => void;
  t: (key: string, variables?: Record<string, string | number>) => string;
}

const I18nContext = createContext<I18nContextType | undefined>(undefined);

const LANGUAGE_STORAGE_KEY = 'papope_lang';

/**
 * I18nProvider wraps the app and provides translation context.
 * Reads initial language from localStorage, defaults to English.
 */
export function I18nProvider({ children }: { children: React.ReactNode }) {
  const [language, setLanguageState] = useState<Language>(defaultLanguage);
  const [mounted, setMounted] = useState(false);

  // Load language from localStorage on mount (client-side only)
  useEffect(() => {
    const stored = localStorage.getItem(LANGUAGE_STORAGE_KEY);
    if (stored === 'en' || stored === 'fr') {
      setLanguageState(stored);
    }
    setMounted(true);
  }, []);

  // Persist language changes to localStorage
  const setLanguage = (lang: Language) => {
    setLanguageState(lang);
    localStorage.setItem(LANGUAGE_STORAGE_KEY, lang);
  };

  // Translation function
  const t = (key: string, variables?: Record<string, string | number>) => {
    return getTranslation(key, language, variables);
  };

  // Provide context immediately to avoid "useI18n must be used inside an I18nProvider" errors
  // The language will be defaultLanguage until mounted, then switch to stored preference if available
  const contextValue = { language, setLanguage, t };

  return (
    <I18nContext.Provider value={contextValue}>
      {children}
    </I18nContext.Provider>
  );
}

/**
 * Hook to access i18n context.
 * Must be used inside an I18nProvider.
 */
export function useI18n(): I18nContextType {
  const context = useContext(I18nContext);
  if (!context) {
    throw new Error('useI18n must be used inside an I18nProvider');
  }
  return context;
}
