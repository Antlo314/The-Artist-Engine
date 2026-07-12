import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Download, LogIn } from 'lucide-react';
import { useNavigate, useLocation } from 'react-router-dom';

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
        <nav className="fixed top-0 w-full z-50 px-4 sm:px-6 py-3 sm:py-4 flex items-center justify-between border-b border-white/10 bg-black/60 backdrop-blur-lg">
            <div
                className="flex items-center gap-2 sm:gap-3 cursor-pointer group min-w-0"
                onClick={() => navigate('/')}
            >
                <div className="w-8 h-8 rounded bg-white shadow-[0_0_15px_rgba(255,255,255,0.2)] flex items-center justify-center p-1 shrink-0">
                    <img src="/site/favicon.png" alt="Logo" className="w-full h-full object-contain" />
                </div>
                <span className="font-display font-semibold text-white tracking-widest text-sm sm:text-base truncate">
                    ENGINE.OS
                </span>
            </div>

            <div className="flex items-center gap-2 sm:gap-4 shrink-0">
                <button
                    onClick={() => navigate('/features')}
                    className={`hidden sm:block font-mono text-xs tracking-widest uppercase transition-colors ${
                        location.pathname === '/features'
                            ? 'text-white font-bold'
                            : 'text-gray-400 hover:text-white'
                    }`}
                >
                    Architecture
                </button>

                {/* Always-visible login — was icon-only / easy to miss on mobile */}
                <button
                    onClick={() => navigate('/login')}
                    className="inline-flex items-center gap-1.5 sm:gap-2 px-3.5 sm:px-5 py-2 sm:py-2.5 rounded-full bg-ember-600 hover:bg-ember-500 text-white font-mono text-[10px] sm:text-xs tracking-widest uppercase shadow-[0_0_20px_rgba(220,38,38,0.35)] transition-colors"
                >
                    <LogIn size={14} />
                    <span>Login</span>
                </button>

                {isInstallable && (
                    <motion.button
                        initial={{ opacity: 0, scale: 0.9 }}
                        animate={{ opacity: 1, scale: 1 }}
                        onClick={handleInstallClick}
                        className="hidden sm:flex items-center gap-2 px-4 py-2 bg-white/10 hover:bg-white/15 text-white rounded-full font-mono text-xs tracking-widest uppercase border border-white/10"
                    >
                        <Download size={14} /> Install
                    </motion.button>
                )}
            </div>
        </nav>
    );
}
