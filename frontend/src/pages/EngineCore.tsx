import { useState, useEffect, Suspense, lazy } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { ShieldCheck, Mic2, Scale, Radio, BarChart2, Monitor } from 'lucide-react';

const Dashboard = lazy(() => import('../components/Dashboard'));
const GigRadar = lazy(() => import('../components/GigRadar'));
const StudioCore = lazy(() => import('../components/StudioCore'));
const LegalCore = lazy(() => import('../components/LegalCore'));
const ArtistProfile = lazy(() => import('../components/ArtistProfile'));
import FoundingBadge from '../components/FoundingBadge';
import { EngineProvider } from '../lib/engineState';

/**
 * Mobile: Home · Gigs · Legal · Profile
 * Desktop: + Studio (waveforms / mastering)
 */
const NAV = [
    { id: 'dashboard', label: 'Dashboard', short: 'Home', desc: 'Overview & pipeline', icon: BarChart2, mobile: true },
    { id: 'radar', label: 'Find Gigs', short: 'Gigs', desc: 'Live venue scouting', icon: Radio, mobile: true },
    { id: 'studio', label: 'Studio', short: 'Studio', desc: 'Mastering & analysis', icon: Mic2, mobile: false },
    { id: 'legal', label: 'Legal', short: 'Legal', desc: 'Contracts & splits', icon: Scale, mobile: true },
    { id: 'profile', label: 'Profile', short: 'You', desc: 'Identity & settings', icon: ShieldCheck, mobile: true },
] as const;

const DESKTOP_ONLY = ['studio'];
const MOBILE_NAV = NAV.filter((n) => n.mobile);

export default function EngineCore() {
    return (
        <EngineProvider>
            <EngineCoreInner />
        </EngineProvider>
    );
}

function EngineCoreInner() {
    const [activeView, setActiveView] = useState('dashboard');

    const [profile, setProfile] = useState(() => {
        const saved = localStorage.getItem('sovereign_identity');
        if (saved) return JSON.parse(saved);
        return {
            artistAlias: 'ECHOVELOCITY',
            agentName: 'Alex Chen',
            agentEmail: '',
            agentPhone: '',
            agentSocial: '',
            treasuryBalance: '42500.00',
        };
    });

    useEffect(() => {
        localStorage.setItem('sovereign_identity', JSON.stringify(profile));
    }, [profile]);

    // Never land on Studio on a phone-sized viewport
    useEffect(() => {
        const mq = window.matchMedia('(max-width: 767px)');
        const guard = () => {
            if (mq.matches && DESKTOP_ONLY.includes(activeView)) {
                setActiveView('dashboard');
            }
        };
        guard();
        mq.addEventListener?.('change', guard);
        return () => mq.removeEventListener?.('change', guard);
    }, [activeView]);

    const current = NAV.find((n) => n.id === activeView) || NAV[0];
    const avatar = localStorage.getItem('sovereign_avatar');

    const renderActiveView = () => {
        const view = (() => {
            switch (activeView) {
                case 'dashboard': return <Dashboard onNavigate={setActiveView} />;
                case 'radar': return <GigRadar profile={profile} />;
                case 'legal': return <LegalCore />;
                case 'studio': return <StudioCore />;
                case 'profile': return <ArtistProfile profile={profile} setProfile={setProfile} />;
                default: return <Dashboard onNavigate={setActiveView} />;
            }
        })();
        return (
            <Suspense
                fallback={
                    <div className="py-24 text-center font-mono text-[11px] tracking-[0.3em] uppercase text-ink-400 animate-pulse">
                        Loading module…
                    </div>
                }
            >
                {view}
            </Suspense>
        );
    };

    return (
        <div className="flex h-[100dvh] h-screen w-full bg-ink-950 overflow-hidden relative engine-fluid">
            <div className="absolute inset-0 z-0 pointer-events-none grain bg-[radial-gradient(ellipse_at_top,_#12070a_0%,_#08080a_45%,_#060607_100%)]" />

            {/* ===== Mobile top bar — logo + page title only (no scrunched badge row) ===== */}
            <header
                className="md:hidden fixed top-0 inset-x-0 z-50 glass-obsidian border-b border-white/10"
                style={{ paddingTop: 'max(0.5rem, env(safe-area-inset-top))' }}
            >
                <div className="h-12 flex items-center justify-between px-4 gap-3">
                    <button
                        type="button"
                        onClick={() => setActiveView('dashboard')}
                        className="flex items-center gap-2.5 min-w-0"
                    >
                        <div className="h-8 w-8 rounded-lg bg-ink-800 border border-white/10 overflow-hidden shrink-0">
                            <img src="/site/favicon.png" alt="" className="w-full h-full object-cover" />
                        </div>
                        <div className="min-w-0 text-left">
                            <div className="font-display text-sm font-semibold tracking-widest text-ink-50 leading-none">
                                ENGINE.OS
                            </div>
                            <div className="font-mono text-[9px] tracking-widest uppercase text-ink-400 mt-0.5 truncate">
                                {current.label}
                            </div>
                        </div>
                    </button>
                    <button
                        type="button"
                        onClick={() => setActiveView('profile')}
                        className="h-9 w-9 rounded-full bg-ink-800 border border-white/15 flex items-center justify-center overflow-hidden shrink-0"
                        aria-label="Profile"
                    >
                        {avatar ? (
                            <img src={avatar} alt="" className="w-full h-full object-cover" />
                        ) : (
                            <span className="font-display text-[10px] text-ink-200">
                                {(profile.artistAlias || 'U').substring(0, 2).toUpperCase()}
                            </span>
                        )}
                    </button>
                </div>
            </header>

            {/* ===== Mobile bottom nav — equal columns, big touch targets ===== */}
            <nav
                className="md:hidden fixed bottom-0 inset-x-0 z-50 glass-obsidian border-t border-white/10"
                style={{ paddingBottom: 'max(0.35rem, env(safe-area-inset-bottom))' }}
            >
                <div className="grid grid-cols-4 h-16">
                    {MOBILE_NAV.map((item) => {
                        const active = activeView === item.id;
                        return (
                            <button
                                key={item.id}
                                type="button"
                                onClick={() => setActiveView(item.id)}
                                className={`relative flex flex-col items-center justify-center gap-1 min-h-[44px] transition-colors ${
                                    active ? 'text-ember-400' : 'text-ink-400'
                                }`}
                            >
                                {active && (
                                    <span className="absolute top-0 left-1/2 -translate-x-1/2 w-8 h-0.5 rounded-full bg-ember-500" />
                                )}
                                <item.icon size={22} strokeWidth={active ? 2.25 : 1.75} />
                                <span className="text-[10px] font-medium tracking-wide leading-none">
                                    {item.short}
                                </span>
                            </button>
                        );
                    })}
                </div>
            </nav>

            {/* ===== Desktop sidebar ===== */}
            <nav className="hidden md:flex relative z-40 h-full w-64 glass-obsidian border-r border-white/10 flex-col">
                <div className="p-6 border-b border-white/10">
                    <div className="flex items-center gap-3 cursor-pointer" onClick={() => setActiveView('dashboard')}>
                        <div className="h-8 w-8 rounded bg-ink-800 border border-white/10 overflow-hidden">
                            <img src="/site/favicon.png" alt="Logo" className="w-full h-full object-cover" />
                        </div>
                        <div>
                            <h1 className="font-display text-lg font-semibold text-ink-50 tracking-widest leading-none">THE ARTIST</h1>
                            <span className="font-mono text-[10px] text-ink-400 tracking-[0.3em]">ENGINE.OS</span>
                        </div>
                    </div>
                </div>

                <div className="flex-1 py-6 px-3 space-y-1 overflow-y-auto">
                    <div className="text-[10px] font-mono tracking-widest text-ink-700 mb-3 px-3 uppercase">Workspace</div>
                    {NAV.map((item) => {
                        const active = activeView === item.id;
                        return (
                            <button
                                key={item.id}
                                type="button"
                                onClick={() => setActiveView(item.id)}
                                className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-lg transition-colors relative border-l-2 ${
                                    active
                                        ? 'bg-white/5 border-ember-500 text-ink-50'
                                        : 'border-transparent text-ink-400 hover:text-ink-50 hover:bg-white/5'
                                }`}
                            >
                                <item.icon size={18} className={active ? 'text-ember-500' : ''} />
                                <div className="text-left min-w-0">
                                    <div className="text-sm font-medium leading-tight">{item.label}</div>
                                    <div className="font-mono text-[9px] text-ink-700 tracking-wide truncate">{item.desc}</div>
                                </div>
                            </button>
                        );
                    })}
                </div>

                <button
                    type="button"
                    onClick={() => setActiveView('profile')}
                    className="p-4 border-t border-white/10 flex items-center gap-3 hover:bg-white/5 transition-colors text-left"
                >
                    <div className="h-9 w-9 rounded-full bg-ink-800 border border-white/10 flex items-center justify-center overflow-hidden shrink-0">
                        {avatar ? (
                            <img src={avatar} alt="Avatar" className="w-full h-full object-cover" />
                        ) : (
                            <span className="font-display text-xs text-ink-200">
                                {profile.artistAlias.substring(0, 2).toUpperCase()}
                            </span>
                        )}
                    </div>
                    <div className="min-w-0">
                        <div className="text-sm font-medium text-ink-50 truncate">{profile.artistAlias}</div>
                        <div className="font-mono text-[9px] text-ink-400 tracking-wide truncate">{profile.agentName}</div>
                    </div>
                </button>
            </nav>

            {/* ===== Main ===== */}
            <main className="flex-1 overflow-hidden flex flex-col relative z-10 min-w-0">
                <header className="hidden md:flex h-14 glass-obsidian border-b border-white/10 items-center justify-between px-6 lg:px-8 shrink-0 gap-4">
                    <div className="font-mono text-[11px] text-ink-400 tracking-widest shrink-0">
                        <span className="text-ink-700">Engine</span> <span className="text-ink-700">/</span> {current.label}
                    </div>
                    <div className="flex items-center gap-4 min-w-0">
                        <FoundingBadge />
                        <button
                            type="button"
                            onClick={() => setActiveView('profile')}
                            className="flex items-center gap-2.5 rounded-full pl-1 pr-3 py-1 hover:bg-white/5 transition-colors shrink-0"
                        >
                            <div className="h-7 w-7 rounded-full bg-ink-800 border border-white/10 flex items-center justify-center overflow-hidden">
                                {avatar ? (
                                    <img src={avatar} alt="Avatar" className="w-full h-full object-cover" />
                                ) : (
                                    <span className="font-display text-[10px] text-ink-200">
                                        {profile.artistAlias.substring(0, 2).toUpperCase()}
                                    </span>
                                )}
                            </div>
                            <span className="text-xs text-ink-200 font-medium">{profile.artistAlias}</span>
                        </button>
                    </div>
                </header>

                {/* Content: reserved space for mobile chrome so nothing hides under nav */}
                <div
                    className="flex-1 overflow-y-auto w-full custom-scrollbar overscroll-contain"
                    style={{
                        // header ~3rem + safe top; footer ~4rem + safe bottom
                        paddingTop: undefined,
                    }}
                >
                    <div className="md:hidden h-[calc(3rem+max(0.5rem,env(safe-area-inset-top)))]" aria-hidden />
                    <div className="px-3 sm:px-4 md:px-8 py-3 md:py-8 pb-[calc(5rem+env(safe-area-inset-bottom))] md:pb-8">
                        <AnimatePresence mode="wait">
                            <motion.div
                                key={activeView}
                                initial={{ opacity: 0, y: 6 }}
                                animate={{ opacity: 1, y: 0 }}
                                exit={{ opacity: 0 }}
                                transition={{ duration: 0.18 }}
                                className="max-w-7xl mx-auto w-full"
                            >
                                <div className={DESKTOP_ONLY.includes(activeView) ? 'hidden md:block' : 'block'}>
                                    {renderActiveView()}
                                </div>

                                {DESKTOP_ONLY.includes(activeView) && (
                                    <div className="md:hidden flex flex-col items-center justify-center min-h-[50vh] text-center px-2">
                                        <div className="glass-obsidian p-6 sm:p-8 rounded-2xl border border-white/10 flex flex-col items-center w-full max-w-sm">
                                            <Monitor size={36} className="text-ember-500 mb-4" />
                                            <h2 className="font-display text-lg text-ink-50 font-semibold mb-2">
                                                Studio is desktop-only
                                            </h2>
                                            <p className="text-sm text-ink-200 leading-relaxed mb-5">
                                                Mastering needs a larger screen. On mobile use Gigs, Legal, Home, and Profile.
                                            </p>
                                            <button
                                                type="button"
                                                onClick={() => setActiveView('radar')}
                                                className="rounded-full bg-ember-600 text-white text-sm font-medium px-6 py-2.5"
                                            >
                                                Open Find Gigs
                                            </button>
                                        </div>
                                    </div>
                                )}
                            </motion.div>
                        </AnimatePresence>
                    </div>
                </div>
            </main>
        </div>
    );
}
