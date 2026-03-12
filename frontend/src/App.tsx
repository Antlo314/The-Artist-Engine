import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { ShieldCheck, Activity, BarChart2, Mic2, Briefcase, Scale, Radio, DollarSign, ArrowUpRight, AlertTriangle, Fingerprint } from 'lucide-react';

// Components placeholders - will be implemented individually
import Dashboard from './components/Dashboard';
import GigRadar from './components/GigRadar';
import StudioCore from './components/StudioCore';
import LegalCore from './components/LegalCore';
import ArtistProfile from './components/ArtistProfile';

export default function App() {
    const [activeView, setActiveView] = useState('dashboard');
    const [systemStatus, setSystemStatus] = useState<any>(null);

    // Sovereign User Context (Persistent Global Profile)
    const [profile, setProfile] = useState(() => {
        const saved = localStorage.getItem('sovereign_identity');
        if (saved) return JSON.parse(saved);
        return {
            artistAlias: 'ECHOVELOCITY',
            agentName: 'Alex Chen',
            agentEmail: '',
            agentPhone: '',
            agentSocial: '',
            treasuryBalance: '42500.00'
        };
    });

    // Save changes automatically
    useEffect(() => {
        localStorage.setItem('sovereign_identity', JSON.stringify(profile));
    }, [profile]);

    useEffect(() => {
        // Simulate Backend Online Status for static deployment
        setSystemStatus({ status: 'online' });
    }, []);

    const navItems = [
        { id: 'radar', label: 'Gig Radar', icon: Radio },
        { id: 'legal', label: 'Legal War Room', icon: Scale },
        { id: 'studio', label: 'PureTone Audio Lab', icon: Mic2 },
        { id: 'profile', label: 'Profile', icon: ShieldCheck },
    ];

    const renderActiveView = () => {
        switch (activeView) {
            case 'dashboard': return <Dashboard />;
            case 'radar': return <GigRadar profile={profile} />;
            case 'legal': return <LegalCore />;
            case 'studio': return <StudioCore />;
            case 'profile': return <ArtistProfile profile={profile} setProfile={setProfile} />;
            default: return <Dashboard />;
        }
    };

    return (
        <div className="flex h-screen w-full bg-slate-50 overflow-hidden relative selection:bg-white/50">

            {/* Global Video Background */}
            <img
                src="/site/light_abstract_bg_1773233140940.png"
                alt="Background"
                className="absolute inset-0 w-full h-full object-cover opacity-80 pointer-events-none z-0 mix-blend-normal"
            />

            {/* Glassmorphic Layer Over Video */}
            <div className="absolute inset-0 bg-white/5 backdrop-blur-[10px] shadow-[inset_0_0_100px_rgba(255,255,255,0.05)] pointer-events-none z-0" />

            {/* Background Ambient Glows */}
            <div className="absolute top-0 left-1/4 w-[500px] h-[500px] bg-sky-200/40 rounded-full blur-[120px] pointer-events-none z-0 mix-blend-normal" />
            <div className="absolute bottom-0 right-1/4 w-[600px] h-[600px] bg-white/60 rounded-full blur-[150px] pointer-events-none z-0 mix-blend-normal" />

            {/* Mobile Header (Tactical Density) */}
            <div className="md:hidden fixed top-0 w-full glass-panel z-50 flex items-center justify-between p-4 border-b border-gray-300/40 bg-[#ffffff]/90 backdrop-blur-2xl shadow-[0_10px_30px_rgba(0,0,0,0.05)]">
                <div className="flex items-center gap-2">
                    <div className="h-7 w-7 rounded bg-white border border-gray-400/50 flex items-center justify-center shadow-[0_0_10px_rgba(0,0,0,0.1)] overflow-hidden">
                        <img src="/site/favicon.png" alt="Logo" className="w-full h-full object-cover" />
                    </div>
                    <div className="flex flex-col">
                        <h1 className="font-cinzel text-[13px] font-bold tracking-widest text-black leading-tight cursor-pointer hover:text-red-700 transition-colors" onClick={() => setActiveView('dashboard')}>THE ARTIST</h1>
                        <span className="font-mono text-[8px] text-gray-800 tracking-[0.3em] uppercase leading-none">ENGINE.OS</span>
                    </div>
                </div>
                <div className="font-mono text-[9px] tracking-widest text-gray-800 flex items-center gap-1.5 bg-gray-200/50 px-2 py-1 border border-gray-400/50 rounded drop-shadow-[0_0_8px_rgba(0,0,0,0.1)]">
                    <span className="w-1.5 h-1.5 rounded-full bg-red-600 animate-pulse" /> SYNCED
                </div>
            </div>

            {/* Mobile Bottom Navigation */}
            <nav className="md:hidden fixed bottom-0 left-0 right-0 w-full z-50 border-t border-gray-300/30 flex justify-between px-2 pb-4 bg-[#ffffff]/95 backdrop-blur-3xl shadow-[0_-10px_40px_rgba(0,0,0,0.05)]">
                {navItems.map((item) => (
                    <button
                        key={item.id}
                        onClick={() => setActiveView(item.id)}
                        className={`flex flex-col items-center justify-center gap-1.5 py-3 px-1 w-1/4 transition-all duration-300 relative group
                            ${activeView === item.id ? 'text-red-700' : 'text-gray-800 hover:text-red-700'}`}
                    >
                        <item.icon size={24} className={`transition-all duration-300 ${activeView === item.id ? 'drop-shadow-[0_0_10px_rgba(220,38,38,0.4)] -translate-y-1 scale-110' : ''}`} />
                        <span className={`text-[9px] sm:text-[10px] text-center leading-tight font-mono tracking-widest uppercase transition-all duration-300 ${activeView === item.id ? 'font-bold opacity-100' : 'opacity-70'}`}>
                            {item.label}
                        </span>
                        {activeView === item.id && (
                            <motion.div layoutId="mobile-nav-indicator" className="absolute top-0 w-10 h-[2px] bg-red-600 rounded-full shadow-[0_0_8px_rgba(220,38,38,0.5)]" />
                        )}
                    </button>
                ))}
            </nav>

            {/* Sidebar Navigation (Desktop) */}
            <nav className="hidden md:flex relative z-40 h-full w-64 glass-panel border-r border-slate-200 flex-col transition-transform duration-300">

                {/* Brand Header */}
                <div className="p-6 border-b border-slate-200">
                    <div className="flex items-center gap-3 mb-2">
                        <div className="h-8 w-8 rounded bg-white border border-gray-400/50 flex items-center justify-center shadow-[0_0_10px_rgba(0,0,0,0.1)] overflow-hidden">
                            <img src="/site/favicon.png" alt="Logo" className="w-full h-full object-cover" />
                        </div>
                        <div>
                            <h1 className="font-cinzel text-lg font-bold text-black tracking-widest leading-none cursor-pointer hover:text-red-700 transition-colors" onClick={() => setActiveView('dashboard')}>THE ARTIST</h1>
                            <span className="font-cinzel text-xs text-gray-800 tracking-[0.2em]">ENGINE.OS</span>
                        </div>
                    </div>

                    <div className="mt-4 flex items-center justify-between text-[10px] font-mono tracking-widest text-gray-800">
                        <span>SYSTEM ALIGNMENT</span>
                        {systemStatus ? (
                            <span className="text-gray-800 flex items-center gap-1 drop-shadow-[0_0_4px_rgba(0,0,0,0.1)]"><span className="w-1.5 h-1.5 rounded-full bg-red-600 animate-pulse" /> OMEGA TIER</span>
                        ) : (
                            <span className="text-red-600 flex items-center gap-1"><span className="w-1.5 h-1.5 rounded-full bg-red-600" /> OFFLINE</span>
                        )}
                    </div>
                </div>

                {/* Nav Links */}
                <div className="flex-1 py-6 px-4 space-y-2 overflow-y-auto">
                    <div className="text-[10px] font-mono tracking-widest text-gray-600 mb-4 px-2 uppercase">Core Modules</div>
                    {navItems.map((item) => (
                        <button
                            key={item.id}
                            onClick={() => setActiveView(item.id)}
                            className={`w-full flex items-center gap-3 px-3 py-3 rounded-lg text-sm font-medium transition-all duration-300 relative group
                ${activeView === item.id
                                    ? 'bg-gradient-to-r from-red-100/40 to-transparent text-red-700 border-l-2 border-red-500'
                                    : 'text-gray-800 hover:text-red-700 hover:bg-slate-100 border-l-2 border-transparent'
                                }`}
                        >
                            <item.icon size={18} className={activeView === item.id ? 'text-red-600' : 'text-gray-800 group-hover:text-red-600'} />
                            <span className="tracking-wide">{item.label}</span>
                            {activeView === item.id && (
                                <motion.div layoutId="nav-pill" className="absolute inset-0 bg-red-500/5 rounded-lg -z-10" />
                            )}
                        </button>
                    ))}
                </div>

                {/* User / Meta Footer */}
                <div className="p-4 border-t border-slate-200 bg-slate-100/50">
                    <div className="flex items-center justify-between">
                        <div>
                            <div className="text-xs font-bold text-black tracking-wider uppercase">{profile.artistAlias}</div>
                            <div className="text-[10px] font-mono text-gray-600 flex items-center gap-1 mt-1 uppercase">
                                <Activity size={10} className="text-red-600" /> SYSTEM ID: {profile.agentName}
                            </div>
                        </div>
                        <div className="h-8 w-8 rounded-full bg-gradient-to-br from-gray-800 to-black border border-gray-700 flex items-center justify-center overflow-hidden">
                            {localStorage.getItem('sovereign_avatar') ? (
                                <img src={localStorage.getItem('sovereign_avatar')!} alt="Avatar" className="w-full h-full object-cover" />
                            ) : (
                                <span className="font-cinzel text-xs text-white">
                                    {profile.artistAlias.substring(0, 2).toUpperCase()}
                                </span>
                            )}
                        </div>
                    </div>
                </div>
            </nav>

            {/* Main Content Area */}
            <main className="flex-1 overflow-hidden flex flex-col relative z-10 md:pt-0 pt-16">
                {/* Top StatusBar for Desktop */}
                <header className="hidden md:flex h-14 glass-panel border-b border-slate-200 items-center justify-between px-8">
                    <div className="flex items-center gap-4">
                        <button
                            onClick={() => setActiveView('dashboard')}
                            className={`flex items-center gap-2 px-3 py-1.5 rounded transition-all duration-300 font-mono text-xs tracking-widest uppercase ${activeView === 'dashboard' ? 'bg-sky-50 text-red-700 border border-red-300' : 'text-gray-800 hover:text-red-700 hover:bg-slate-100 border border-transparent'}`}
                        >
                            <BarChart2 size={14} className={activeView === 'dashboard' ? 'text-red-600' : 'text-gray-800'} /> CMD Center
                        </button>
                        <div className="font-mono text-xs text-gray-600 tracking-widest">
                            LOC: // SECTOR-7G / {activeView.toUpperCase()} / MODULE-READY
                        </div>
                    </div>
                    <div className="flex items-center gap-6">
                        <div className="flex items-center gap-6 border border-gray-400/30 p-1.5 rounded-lg bg-white/20 shadow-[inset_0_0_10px_rgba(255,255,255,0.5)]">
                            {/* FIAT WALLET */}
                            <div className="flex flex-col items-end px-2">
                                <span className="text-[9px] font-mono text-gray-700 tracking-widest uppercase mb-0.5">FIAT (STRIPE)</span>
                                <div className="flex items-center gap-2 text-sm text-black font-mono font-bold">
                                    <DollarSign size={14} className="text-red-700 drop-shadow-[0_0_3px_rgba(220,38,38,0.4)]" />
                                    {(() => {
                                        const bal = profile.treasuryBalance || '42500.00';
                                        const parts = bal.split('.');
                                        return <>{Number(parts[0]).toLocaleString()}<span className="text-gray-500 text-xs">.{parts[1] || '00'}</span></>;
                                    })()} USD
                                </div>
                            </div>

                            <div className="h-8 w-[1px] bg-gray-400/50 hidden sm:block" />

                            {/* CRYPTO WALLET */}
                            <div className="hidden sm:flex flex-col items-start px-2 bg-gradient-to-r from-yellow-500/10 to-transparent rounded">
                                <span className="text-[9px] font-mono text-yellow-900 tracking-widest uppercase mb-0.5 flex items-center gap-1">
                                    <Fingerprint size={10} className="text-yellow-700" /> CRYPTO (ON-CHAIN)
                                </span>
                                <div className="flex items-center gap-2 text-sm text-black font-mono font-bold">
                                    <span className="text-yellow-700 font-sans font-bold">Ξ</span>
                                    {(() => {
                                        const cryptoBal = profile.cryptoBalance || '14.50';
                                        const parts = cryptoBal.split('.');
                                        return <>{parts[0]}<span className="text-gray-600 text-xs">.{parts[1] || '00'}</span></>;
                                    })()} ETH
                                </div>
                            </div>
                        </div>

                        <div className="flex flex-col items-end gap-1">
                            <div className="flex items-center gap-2 text-[10px] font-mono text-green-800 font-bold bg-green-500/20 px-2 py-1 rounded border border-green-500/30">
                                <ArrowUpRight size={12} className="text-green-700" /> +12% M/M
                            </div>
                        </div>
                    </div>
                </header>

                {/* View Container */}
                <div className="flex-1 overflow-y-auto w-full p-4 md:p-8 pb-24 md:pb-8 custom-scrollbar">
                    <AnimatePresence mode="wait">
                        <motion.div
                            key={activeView}
                            initial={{ opacity: 0, y: 10, filter: 'blur(4px)' }}
                            animate={{ opacity: 1, y: 0, filter: 'blur(0px)' }}
                            exit={{ opacity: 0, scale: 0.98, filter: 'blur(4px)' }}
                            transition={{ duration: 0.4, ease: "easeOut" }}
                            className="max-w-7xl mx-auto w-full"
                        >
                            {/* Desktop View */}
                            <div className={`${['studio'].includes(activeView) ? 'hidden md:block' : 'block'}`}>
                                {renderActiveView()}
                            </div>

                            {/* Mobile Lockdown Overlay */}
                            {['studio'].includes(activeView) && (
                                <div className="md:hidden flex flex-col items-center justify-center min-h-[50vh] text-center px-4 mt-12">
                                    <div className="glass-card p-8 rounded-2xl border border-red-400/30 flex flex-col items-center bg-white/60 shadow-[0_0_50px_rgba(220,38,38,0.1)] relative overflow-hidden w-full">
                                        <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-red-500 to-transparent" />
                                        <AlertTriangle size={48} className="text-red-500 mb-6 drop-shadow-[0_0_15px_rgba(220,38,38,0.8)] animate-pulse" />
                                        <h2 className="font-cinzel text-xl text-red-700 font-bold tracking-widest mb-2">MOBILE LOCKDOWN</h2>
                                        <h3 className="font-mono text-[10px] text-red-600 tracking-widest uppercase mb-6 font-bold bg-sky-50/80 px-3 py-1 rounded inline-block">Protocol Engaged</h3>
                                        <p className="font-mono text-xs text-gray-600 leading-relaxed uppercase border-t border-slate-200 pt-6">
                                            Desktop Terminal Required.<br /><br />
                                            Data density exceeds safe mobile display protocols.
                                        </p>
                                    </div>
                                </div>
                            )}
                        </motion.div>
                    </AnimatePresence>
                </div>
            </main>

        </div>
    );
}
