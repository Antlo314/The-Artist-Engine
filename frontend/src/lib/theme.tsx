import {
    createContext,
    useCallback,
    useContext,
    useEffect,
    useMemo,
    useState,
    type ReactNode,
} from 'react';

export type ThemeMode = 'dark' | 'light';

const STORAGE_KEY = 'engine_theme';

type ThemeCtx = {
    theme: ThemeMode;
    toggle: () => void;
    setTheme: (t: ThemeMode) => void;
    isLight: boolean;
};

const Ctx = createContext<ThemeCtx | null>(null);

function applyTheme(theme: ThemeMode) {
    const root = document.documentElement;
    root.setAttribute('data-theme', theme);
    // Helps native form controls / scrollbars
    root.style.colorScheme = theme;
}

export function ThemeProvider({ children }: { children: ReactNode }) {
    const [theme, setThemeState] = useState<ThemeMode>(() => {
        if (typeof window === 'undefined') return 'dark';
        const saved = localStorage.getItem(STORAGE_KEY) as ThemeMode | null;
        if (saved === 'light' || saved === 'dark') return saved;
        return 'dark';
    });

    useEffect(() => {
        applyTheme(theme);
        try {
            localStorage.setItem(STORAGE_KEY, theme);
        } catch {
            /* ignore */
        }
    }, [theme]);

    const setTheme = useCallback((t: ThemeMode) => setThemeState(t), []);
    const toggle = useCallback(() => {
        setThemeState((t) => (t === 'dark' ? 'light' : 'dark'));
    }, []);

    const value = useMemo(
        () => ({ theme, toggle, setTheme, isLight: theme === 'light' }),
        [theme, toggle, setTheme]
    );

    return <Ctx.Provider value={value}>{children}</Ctx.Provider>;
}

export function useTheme() {
    const ctx = useContext(Ctx);
    if (!ctx) throw new Error('useTheme must be used within ThemeProvider');
    return ctx;
}
