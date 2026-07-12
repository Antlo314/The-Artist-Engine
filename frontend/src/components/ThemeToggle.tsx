import { Moon, Sun } from 'lucide-react';
import { useTheme } from '../lib/theme';

export default function ThemeToggle({ className = '' }: { className?: string }) {
    const { theme, toggle, isLight } = useTheme();

    return (
        <button
            type="button"
            onClick={toggle}
            aria-label={isLight ? 'Switch to dark mode' : 'Switch to light mode'}
            title={isLight ? 'Dark mode' : 'Light mode'}
            className={`theme-chip inline-flex items-center justify-center h-9 w-9 rounded-full border transition-colors ${className}`}
        >
            {theme === 'dark' ? <Sun size={16} /> : <Moon size={16} />}
        </button>
    );
}
