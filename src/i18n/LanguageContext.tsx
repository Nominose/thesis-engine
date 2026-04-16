import {
  createContext,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from 'react';
import { dictionaries, type Lang, type TranslationKey } from './dictionaries';

const STORAGE_KEY = 'thesis-engine-lang';

interface LanguageContextValue {
  lang: Lang;
  setLang: (lang: Lang) => void;
  toggle: () => void;
  t: (key: TranslationKey) => string;
}

const LanguageContext = createContext<LanguageContextValue | null>(null);

function detectInitialLang(): Lang {
  if (typeof window === 'undefined') return 'en';
  const stored = window.localStorage.getItem(STORAGE_KEY);
  if (stored === 'en' || stored === 'zh') return stored;
  // Default: English (matches README & demo), but fall back to zh for zh-* browsers
  const nav = window.navigator.language?.toLowerCase() ?? '';
  return nav.startsWith('zh') ? 'zh' : 'en';
}

export function LanguageProvider({ children }: { children: ReactNode }) {
  const [lang, setLangState] = useState<Lang>(detectInitialLang);

  useEffect(() => {
    window.localStorage.setItem(STORAGE_KEY, lang);
    document.documentElement.lang = lang === 'zh' ? 'zh-HK' : 'en';
  }, [lang]);

  const value = useMemo<LanguageContextValue>(() => {
    const dict = dictionaries[lang];
    return {
      lang,
      setLang: setLangState,
      toggle: () => setLangState((prev) => (prev === 'en' ? 'zh' : 'en')),
      t: (key: TranslationKey) => dict[key] ?? key,
    };
  }, [lang]);

  return (
    <LanguageContext.Provider value={value}>{children}</LanguageContext.Provider>
  );
}

export function useLang(): LanguageContextValue {
  const ctx = useContext(LanguageContext);
  if (!ctx) {
    throw new Error('useLang must be used inside <LanguageProvider>');
  }
  return ctx;
}
