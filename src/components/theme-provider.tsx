import {
  createContext,
  useContext,
  useEffect,
  useMemo,
  useState,
  type PropsWithChildren
} from 'react';

type Theme = 'dark' | 'light';

type ThemeContextValue = {
  theme: Theme;
  resolvedTheme: 'dark' | 'light';
  setTheme: (theme: Theme) => void;
  setForcedTheme: (theme: 'dark' | 'light' | null) => void;
};

const ThemeContext = createContext<ThemeContextValue | null>(null);

type ThemeProviderProps = PropsWithChildren<{
  defaultTheme?: Theme;
  storageKey?: string;
}>;

function isProtectedOfficePath(pathname: string) {
  return (
    pathname.startsWith('/member') ||
    pathname.startsWith('/admin') ||
    pathname.startsWith('/cashier') ||
    pathname.startsWith('/bod')
  );
}

function resolveInitialForcedTheme() {
  if (typeof window === 'undefined') {
    return null;
  }

  return isProtectedOfficePath(window.location.pathname) ? null : 'dark';
}

export function ThemeProvider({
  children,
  defaultTheme = 'light',
  storageKey = 'yor-ui-theme'
}: ThemeProviderProps) {
  const [theme, setThemeState] = useState<Theme>(() => {
    if (typeof window === 'undefined') {
      return defaultTheme;
    }

    const storedTheme = window.localStorage.getItem(storageKey);

    if (storedTheme === 'dark' || storedTheme === 'light') {
      return storedTheme;
    }

    return defaultTheme;
  });
  const [forcedTheme, setForcedTheme] = useState<'dark' | 'light' | null>(() => resolveInitialForcedTheme());

  const resolvedTheme = forcedTheme ?? theme;

  useEffect(() => {
    const root = window.document.documentElement;
    root.classList.remove('light', 'dark');
    root.classList.add(resolvedTheme);
  }, [resolvedTheme]);

  const value = useMemo<ThemeContextValue>(
    () => ({
      theme,
      resolvedTheme,
      setTheme: (nextTheme) => {
        window.localStorage.setItem(storageKey, nextTheme);
        setThemeState(nextTheme);
      },
      setForcedTheme
    }),
    [resolvedTheme, storageKey, theme]
  );

  return <ThemeContext.Provider value={value}>{children}</ThemeContext.Provider>;
}

export function useTheme() {
  const context = useContext(ThemeContext);

  if (!context) {
    throw new Error('useTheme must be used within ThemeProvider');
  }

  return context;
}
