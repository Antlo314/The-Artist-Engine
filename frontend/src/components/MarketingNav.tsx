import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Download, LogIn } from 'lucide-react';
import { useNavigate, useLocation } from 'react-router-dom';
import ThemeToggle from './ThemeToggle';
import BrandMark from './BrandMark';

export default function MarketingNav() {
    const navigate = useNavigate();
    const location = useLocation();
    const [deferredPrompt, setDeferredPrompt] = useState<any>(null);
    const [isInstallable, setIsInstallable] = useState(false);

    useEffect(() => {
        const handleBeforeInstallPrompt = (e: any) => {
            e.preventDefault();
            setDeferredPrompt(e);
            setIsInstallable(true);
        };
        window.addEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
        return () => window.removeEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
    }, []);

    const handleInstallClick = async () => {
        if (!deferredPrompt) return;
        deferredPrompt.prompt();
        const { outcome } = await deferredPrompt.userChoice;
        if (outcome === 'accepted') setIsInstallable(false);
        setDeferredPrompt(null);
    };

    return (
        <nav className="theme-nav fixed top-0 w-full z-50 px-4 sm:px-6 py-3 sm:py-4 flex items-center justify-between border-b backdrop-blur-lg">
            <BrandMark
                size="md"
                variant="compact"
                onClick={() => navigate('/')}
            />

            <div className="flex items-center gap-2 sm:gap-3 shrink-0">
                <button
                    onClick={() => navigate('/features')}
                    className={`hidden sm:block font-mono text-xs tracking-widest uppercase transition-colors ${
                        location.pathname === '/features'
                            ? 'text-ink-50 font-bold'
                            : 'text-ink-400 hover:text-ink-50'
                    }`}
                >
                    Architecture
                </button>

                <button
                    onClick={() => navigate('/pricing')}
                    className={`hidden sm:block font-mono text-xs tracking-widest uppercase transition-colors ${
                        location.pathname === '/pricing'
                            ? 'text-ink-50 font-bold'
                            : 'text-ink-400 hover:text-ink-50'
                    }`}
                >
                    Pricing
                </button>

                <ThemeToggle />

                <button
                    onClick={() => navigate('/login')}
                    className="inline-flex items-center gap-1.5 sm:gap-2 px-3.5 sm:px-5 py-2 sm:py-2.5 rounded-full bg-ember-600 hover:bg-ember-500 text-white font-mono text-[10px] sm:text-xs tracking-widest uppercase shadow-[0_0_20px_rgba(220,38,38,0.28)] transition-colors"
                >
                    <LogIn size={14} />
                    <span>Login</span>
                </button>

                {isInstallable && (
                    <motion.button
                        initial={{ opacity: 0, scale: 0.9 }}
                        animate={{ opacity: 1, scale: 1 }}
                        onClick={handleInstallClick}
                        className="hidden sm:flex items-center gap-2 px-4 py-2 rounded-full font-mono text-xs tracking-widest uppercase border theme-chip"
                    >
                        <Download size={14} /> Install
                    </motion.button>
                )}
            </div>
        </nav>
    );
}
