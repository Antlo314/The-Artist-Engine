import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Download, MonitorPlay } from 'lucide-react';
import { useNavigate, useLocation } from 'react-router-dom';

export default function MarketingNav() {
    const navigate = useNavigate();
    const location = useLocation();
    const [deferredPrompt, setDeferredPrompt] = useState<any>(null);
    const [isInstallable, setIsInstallable] = useState(false);

    useEffect(() => {
        const handleBeforeInstallPrompt = (e: any) => {
            // Prevent Chrome 67 and earlier from automatically showing the prompt
            e.preventDefault();
            // Stash the event so it can be triggered later.
            setDeferredPrompt(e);
            setIsInstallable(true);
        };

        window.addEventListener('beforeinstallprompt', handleBeforeInstallPrompt);

        return () => {
            window.removeEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
        };
    }, []);

    const handleInstallClick = async () => {
        if (!deferredPrompt) return;
        // Show the install prompt
        deferredPrompt.prompt();
        // Wait for the user to respond to the prompt
        const { outcome } = await deferredPrompt.userChoice;
        if (outcome === 'accepted') {
            console.log('User accepted the PWA install prompt');
            setIsInstallable(false);
        } else {
            console.log('User dismissed the PWA install prompt');
        }
        setDeferredPrompt(null);
    };

    return (
        <nav className="fixed top-0 w-full z-50 px-6 py-4 flex items-center justify-between border-b border-gray-800/50 bg-black/50 backdrop-blur-lg">
            {/* Logo */}
            <div 
                className="flex items-center gap-3 cursor-pointer group"
                onClick={() => navigate('/')}
            >
                <div className="w-8 h-8 rounded bg-white shadow-[0_0_15px_rgba(255,255,255,0.2)] flex items-center justify-center p-1 group-hover:shadow-[0_0_20px_rgba(255,255,255,0.4)] transition-shadow">
                    <img src="/site/favicon.png" alt="Logo" className="w-full h-full object-contain" />
                </div>
                <span className="font-display font-semibold text-white tracking-widest">ENGINE.OS</span>
            </div>

            {/* Links & CTA */}
            <div className="flex items-center gap-6">
                <button 
                    onClick={() => navigate('/features')}
                    className={`hidden md:block font-mono text-xs tracking-widest uppercase transition-colors ${location.pathname === '/features' ? 'text-white font-bold drop-shadow-[0_0_5px_rgba(255,255,255,0.5)]' : 'text-gray-400 hover:text-white'}`}
                >
                    Architecture
                </button>
                <button 
                    onClick={() => navigate('/login')}
                    className="font-mono text-xs tracking-widest text-white hover:text-red-500 transition-colors uppercase flex items-center gap-2"
                >
                    <MonitorPlay size={14} /> <span className="hidden sm:inline">Founding Login</span>
                </button>

                {/* Optional Install Button if PWA event is ready */}
                {isInstallable && (
                    <motion.button
                        initial={{ opacity: 0, scale: 0.9 }}
                        animate={{ opacity: 1, scale: 1 }}
                        onClick={handleInstallClick}
                        className="flex items-center gap-2 px-4 py-2 bg-red-600 hover:bg-red-500 text-white rounded font-mono text-xs tracking-widest uppercase shadow-[0_0_15px_rgba(220,38,38,0.4)] hover:shadow-[0_0_25px_rgba(220,38,38,0.6)] transition-all"
                    >
                        <Download size={14} /> Install App
                    </motion.button>
                )}
            </div>
        </nav>
    );
}
