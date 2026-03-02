import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { ShieldCheck, Activity, BarChart2, Mic2, Briefcase, Scale, Radio, DollarSign, ArrowUpRight, AlertTriangle } from 'lucide-react';

// Components placeholders - will be implemented individually
import Dashboard from './components/Dashboard';
import GigRadar from './components/GigRadar';
import StudioCore from './components/StudioCore';
import LegalCore from './components/LegalCore';

export default function App() {
    const [activeView, setActiveView] = useState('dashboard');
    const [systemStatus, setSystemStatus] = useState<any>(null);

    // Sovereign User Context
    const [agentName, setAgentName] = useState('Alex Chen');
    const [artistAlias, setArtistAlias] = useState('ECHOVELOCITY');

    useEffect(() => {
        // Simulate Backend Online Status for static deployment
        setSystemStatus({ status: 'online' });
    }, []);

    const navItems = [
        { id: 'dashboard', label: 'CMD Center', icon: BarChart2 },
        { id: 'radar', label: 'Gig Radar', icon: Radio },
        { id: 'legal', label: 'Legal War Room', icon: Scale },
        { id: 'studio', label: 'Audio Core', icon: Mic2 },
    ];

    const renderActiveView = () => {
        switch (activeView) {
            case 'dashboard': return <Dashboard />;
            case 'radar': return <GigRadar agentName={agentName} artistAlias={artistAlias} />;
            case 'legal': return <LegalCore />;
            case 'studio': return <StudioCore />;
            default: return <Dashboard />;
        }
    };

    return (
        <div className="flex h-screen w-full bg-[#050505] overflow-hidden relative selection:bg-cyan-900/50">

            {/* Background Ambient Glows */}
            <div className="absolute top-0 left-1/4 w-[500px] h-[500px] bg-cyan-900/10 rounded-full blur-[120px] pointer-events-none" />
            <div className="absolute bottom-0 right-1/4 w-[600px] h-[600px] bg-emerald-900/5 rounded-full blur-[150px] pointer-events-none" />

            {/* Mobile Header */}
            <div className="md:hidden fixed top-0 w-full glass-panel z-50 flex items-center justify-between p-4 border-b border-white/5">
                <div className="flex items-center gap-2">
                    <div className="h-6 w-6 rounded border border-cyan-500/50 flex items-center justify-center bg-cyan-500/10">
                        <Activity size={12} className="text-cyan-400" />
                    </div>
                    <h1 className="font-cinzel text-sm font-bold tracking-widest text-white">THE ARTIST ENGINE</h1>
                </div>
                <div className="font-mono text-[10px] tracking-widest text-emerald-500 flex items-center gap-1">
                    <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" /> LIVE
                </div>
            </div>

            {/* Mobile Bottom Navigation */}
            <nav className="md:hidden fixed bottom-0 w-full glass-panel z-50 border-t border-white/10 flex justify-around p-2 pb-safe bg-black/80 backdrop-blur-xl">
                {navItems.map((item) => (
                    <button
                        key={item.id}
                        onClick={() => setActiveView(item.id)}
                        className={`flex flex-col items-center gap-1.5 p-2 rounded-lg transition-colors ${activeView === item.id ? 'text-cyan-400' : 'text-gray-500 hover:text-gray-300'
                            }`}
                    >
                        <item.icon size={20} className={activeView === item.id ? 'drop-shadow-[0_0_8px_rgba(6,182,212,0.8)]' : ''} />
                        <span className="text-[8px] font-mono tracking-widest uppercase">{item.label}</span>
                    </button>
                ))}
            </nav>

            {/* Sidebar Navigation (Desktop) */}
            <nav className="hidden md:flex relative z-40 h-full w-64 glass-panel border-r border-white/5 flex-col transition-transform duration-300">

                {/* Brand Header */}
                <div className="p-6 border-b border-white/5">
                    <div className="flex items-center gap-3 mb-2">
                        <div className="h-8 w-8 rounded bg-black border border-cyan-500/50 flex items-center justify-center shadow-[0_0_15px_rgba(0,240,255,0.2)]">
                            <ShieldCheck size={16} className="text-cyan-400" />
                        </div>
                        <div>
                            <h1 className="font-cinzel text-lg font-bold text-white tracking-widest leading-none">THE ARTIST</h1>
                            <span className="font-cinzel text-xs text-cyan-400 tracking-[0.2em]">ENGINE.OS</span>
                        </div>
                    </div>

                    <div className="mt-4 flex items-center justify-between text-[10px] font-mono tracking-widest text-gray-500">
                        <span>SYSTEM ALIGNMENT</span>
                        {systemStatus ? (
                            <span className="text-emerald-400 flex items-center gap-1"><span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" /> OMEGA TIER</span>
                        ) : (
                            <span className="text-red-400 flex items-center gap-1"><span className="w-1.5 h-1.5 rounded-full bg-red-400" /> OFFLINE</span>
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
                                    ? 'bg-gradient-to-r from-cyan-900/40 to-transparent text-white border-l-2 border-cyan-400'
                                    : 'text-gray-400 hover:text-white hover:bg-white/5 border-l-2 border-transparent'
                                }`}
                        >
                            <item.icon size={18} className={activeView === item.id ? 'text-cyan-400' : 'text-gray-500 group-hover:text-gray-300'} />
                            <span className="tracking-wide">{item.label}</span>
                            {activeView === item.id && (
                                <motion.div layoutId="nav-pill" className="absolute inset-0 bg-cyan-500/5 rounded-lg -z-10" />
                            )}
                        </button>
                    ))}
                </div>

                {/* User / Meta Footer */}
                <div className="p-4 border-t border-white/5 bg-black/20">
                    <div className="flex items-center justify-between">
                        <div>
                            <div className="text-xs font-bold text-white tracking-wider">SOVEREIGN ARTIST</div>
                            <div className="text-[10px] font-mono text-gray-500 flex items-center gap-1 mt-1">
                                <Activity size={10} className="text-cyan-500" /> ID: AE-9402
                            </div>
                        </div>
                        <div className="h-8 w-8 rounded-full bg-gradient-to-br from-gray-800 to-black border border-gray-700 flex items-center justify-center">
                            <span className="font-cinzel text-xs text-white">SA</span>
                        </div>
                    </div>
                </div>
            </nav>

            {/* Main Content Area */}
            <main className="flex-1 overflow-hidden flex flex-col relative z-10 md:pt-0 pt-16">
                {/* Top StatusBar for Desktop */}
                <header className="hidden md:flex h-14 glass-panel border-b border-white/5 items-center justify-between px-8">
                    <div className="font-mono text-xs text-gray-500 tracking-widest">
                        LOC: // SECTOR-7G / {activeView.toUpperCase()} / MODULE-READY
                    </div>
                    <div className="flex items-center gap-6">
                        <div className="flex flex-col items-end">
                            <span className="text-[10px] font-mono text-gray-500 tracking-widest uppercase mb-0.5">TREASURY BALANCE</span>
                            <div className="flex items-center gap-2 text-sm text-white font-mono font-bold">
                                <DollarSign size={14} className="text-emerald-400" />
                                42,050.<span className="text-gray-500 text-xs">00</span> USD
                            </div>
                        </div>
                        <div className="h-6 w-[1px] bg-white/10" />
                        <div className="flex items-center gap-2 text-xs font-mono text-cyan-400 bg-cyan-900/20 px-3 py-1.5 rounded border border-cyan-500/20">
                            <ArrowUpRight size={14} /> +12% M/M
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
                            <div className={`${['legal', 'studio', 'radar'].includes(activeView) ? 'hidden md:block' : 'block'}`}>
                                {renderActiveView()}
                            </div>

                            {/* Mobile Lockdown Overlay */}
                            {['legal', 'studio', 'radar'].includes(activeView) && (
                                <div className="md:hidden flex flex-col items-center justify-center min-h-[50vh] text-center px-4 mt-12">
                                    <div className="glass-card p-8 rounded-2xl border border-red-500/30 flex flex-col items-center bg-black/60 shadow-[0_0_50px_rgba(239,68,68,0.1)] relative overflow-hidden w-full">
                                        <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-red-600 to-transparent" />
                                        <AlertTriangle size={48} className="text-red-500 mb-6 drop-shadow-[0_0_15px_rgba(239,68,68,0.8)] animate-pulse" />
                                        <h2 className="font-cinzel text-xl text-white font-bold tracking-widest mb-2">MOBILE LOCKDOWN</h2>
                                        <h3 className="font-mono text-[10px] text-red-500 tracking-widest uppercase mb-6 font-bold bg-red-900/20 px-3 py-1 rounded inline-block">Protocol Engaged</h3>
                                        <p className="font-mono text-xs text-gray-400 leading-relaxed uppercase border-t border-white/10 pt-6">
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
