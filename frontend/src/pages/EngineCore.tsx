import { useState, useEffect, Suspense, lazy, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { ShieldCheck, Mic2, Scale, Radio, BarChart2, HelpCircle, CreditCard, LayoutDashboard } from 'lucide-react';
import { useAuth } from '../lib/auth';

const Dashboard = lazy(() => import('../components/Dashboard'));
const GigRadar = lazy(() => import('../components/GigRadar'));
const StudioCore = lazy(() => import('../components/StudioCore'));
const LegalCore = lazy(() => import('../components/LegalCore'));
const ArtistProfile = lazy(() => import('../components/ArtistProfile'));
const BillingPanel = lazy(() => import('../components/billing/BillingPanel'));
const AdminConsole = lazy(() => import('../components/admin/AdminConsole'));
import FoundingBadge from '../components/FoundingBadge';
import ThemeToggle from '../components/ThemeToggle';
import BrandMark from '../components/BrandMark';
import { EngineProvider } from '../lib/engineState';
import Walkthrough from '../components/ui/Walkthrough';
import { hasSeenTour, resetOnboarding } from '../lib/onboarding';

type ViewId = 'dashboard' | 'radar' | 'studio' | 'legal' | 'profile' | 'billing' | 'admin';

const ALL_NAV: {
    id: ViewId;
    label: string;
    short: string;
    desc: string;
    icon: typeof BarChart2;
    mobile: boolean;
    adminOnly?: boolean;
}[] = [
    { id: 'dashboard', label: 'Dashboard', short: 'Home', desc: 'Overview & pipeline', icon: BarChart2, mobile: true },
    { id: 'radar', label: 'Find Gigs', short: 'Gigs', desc: 'Live venue scouting', icon: Radio, mobile: true },
    { id: 'studio', label: 'Studio', short: 'Studio', desc: 'Mastering & analysis', icon: Mic2, mobile: true },
    { id: 'legal', label: 'Legal', short: 'Legal', desc: 'Contracts & splits', icon: Scale, mobile: true },
    { id: 'billing', label: 'Billing', short: 'Plan', desc: 'Credits & promo', icon: CreditCard, mobile: false },
    { id: 'admin', label: 'CRM Ops', short: 'Admin', desc: 'Platform CRM', icon: LayoutDashboard, mobile: false, adminOnly: true },
    { id: 'profile', label: 'Profile', short: 'You', desc: 'Identity & settings', icon: ShieldCheck, mobile: true },
];



function useIsMobile() {
    const [mobile, setMobile] = useState(() =>
        typeof window !== 'undefined' ? window.matchMedia('(max-width: 767px)').matches : true
    );
    useEffect(() => {
        const mq = window.matchMedia('(max-width: 767px)');
        const onChange = () => setMobile(mq.matches);
        onChange();
        mq.addEventListener('change', onChange);
        return () => mq.removeEventListener('change', onChange);
    }, []);
    return mobile;
}

function ViewLoader({
    activeView,
    profile,
    setProfile,
    onNavigate,
}: {
    activeView: ViewId;
    profile: any;
    setProfile: (p: any) => void;
    onNavigate: (id: ViewId) => void;
}) {
    const node = useMemo(() => {
        switch (activeView) {
            case 'dashboard':
                return <Dashboard onNavigate={(id) => onNavigate(id as ViewId)} />;
            case 'radar':
                return <GigRadar profile={profile} />;
            case 'legal':
                return <LegalCore />;
            case 'studio':
                return <StudioCore />;
            case 'billing':
                return <BillingPanel />;
            case 'admin':
                return <AdminConsole />;
            case 'profile':
                return <ArtistProfile profile={profile} setProfile={setProfile} />;
            default:
                return <Dashboard onNavigate={(id) => onNavigate(id as ViewId)} />;
        }
    }, [activeView, profile, setProfile, onNavigate]);

    return (
        <Suspense
            fallback={
                <div className="py-16 text-center text-sm text-ink-400">
                    Loading…
                </div>
            }
        >
            <AnimatePresence mode="wait">
                <motion.div
                    key={activeView}
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    transition={{ duration: 0.15 }}
                >
                    {node}
                </motion.div>
            </AnimatePresence>
        </Suspense>
    );
}

export default function EngineCore() {
    return (
        <EngineProvider>
            <EngineCoreInner />
        </EngineProvider>
    );
}

function defaultProfile() {
    return {
        artistAlias: '',
        agentName: '',
        agentEmail: '',
        agentPhone: '',
        agentSocial: '',
        treasuryBalance: '',
        cryptoBalance: '',
        cryptoAddress: '',
        homeCity: '',
        primaryGenre: '',
        bio: '',
        oneLiner: '',
        spotifyUrl: '',
        appleUrl: '',
        youtubeUrl: '',
        otherUrl: '',
        targetMarkets: '',
    };
}

function EngineCoreInner() {
    const isMobile = useIsMobile();
    const { me } = useAuth();
    const isAdmin = me?.user?.role === 'admin';
    const navItems = useMemo(
        () => ALL_NAV.filter((n) => !n.adminOnly || isAdmin),
        [isAdmin]
    );
    const mobileNav = useMemo(() => navItems.filter((n) => n.mobile), [navItems]);
    // Mobile opens on Find Gigs — the most useful phone feature
    const [activeView, setActiveView] = useState<ViewId>(() =>
        typeof window !== 'undefined' && window.matchMedia('(max-width: 767px)').matches
            ? 'radar'
            : 'dashboard'
    );

    const [profile, setProfile] = useState(() => {
        const saved = localStorage.getItem('sovereign_identity');
        if (saved) {
            try {
                return { ...defaultProfile(), ...JSON.parse(saved) };
            } catch {
                return defaultProfile();
            }
        }
        return defaultProfile();
    });
    const [showWelcome, setShowWelcome] = useState(() => !hasSeenTour('welcome'));

    useEffect(() => {
        localStorage.setItem('sovereign_identity', JSON.stringify(profile));
    }, [profile]);

    const current = navItems.find((n) => n.id === activeView) || navItems[0] || ALL_NAV[0];
    const avatar = localStorage.getItem('sovereign_avatar');

    const welcomeTour = (
        <Walkthrough
            tourId="welcome"
            open={showWelcome}
            accent="var(--color-ember-500)"
            onClose={() => setShowWelcome(false)}
            primaryLabel={isMobile ? 'Open Find Gigs' : 'Open Dashboard'}
            onPrimary={() => setActiveView(isMobile ? 'radar' : 'dashboard')}
            steps={[
                {
                    title: 'Welcome to the Engine',
                    body: 'One workspace for gigs, mastering, contracts, and your artist identity — built for independent artists.',
                    bullets: ['Daily quotas apply on heavy tools', 'Stay signed in for Studio & Legal'],
                },
                {
                    title: 'Four pillars',
                    body: 'Find Gigs scouts venues. Studio masters tracks. Legal flags predatory clauses. Profile powers pitches.',
                    bullets: ['Mobile opens on Find Gigs by default', 'Desktop opens on Dashboard'],
                },
                {
                    title: 'Guided along the way',
                    body: 'Each tool has a short first-visit tour and tips you can dismiss. Replay them anytime from Profile.',
                    bullets: ['WAV masters under 80 MB', 'Fill Profile for stronger pitch drafts'],
                },
            ]}
        />
    );

    // ===================== MOBILE: column layout only (no side-by-side chrome) =====================
    if (isMobile) {
        return (
            <div
                className="bg-ink-950 text-ink-50 flex flex-col"
                style={{
                    height: '100dvh',
                    maxHeight: '100dvh',
                    width: '100%',
                    overflow: 'hidden',
                }}
            >
                {welcomeTour}
                {/* Top bar */}
                <header
                    className="shrink-0 border-b border-white/10 bg-ink-950/95 backdrop-blur-md z-20"
                    style={{ paddingTop: 'env(safe-area-inset-top, 0px)' }}
                >
                    <div className="h-14 flex items-center justify-between px-4 gap-2">
                        <div className="flex items-center gap-2.5 min-w-0">
                            <BrandMark size="sm" showWordmark={false} />
                            <div className="min-w-0">
                                <div className="font-display text-sm font-semibold tracking-[0.14em] text-ink-50 leading-none">
                                    SOURCE<span className="text-ember-500">.</span>ENGINE
                                </div>
                                <div className="text-xs text-ink-400 mt-0.5 truncate">{current.label}</div>
                            </div>
                        </div>
                        <div className="flex items-center gap-1.5 shrink-0">
                            <ThemeToggle />
                            <button
                                type="button"
                                onClick={() => setActiveView('profile')}
                                className="h-9 w-9 rounded-full bg-ink-800 border border-white/15 overflow-hidden"
                                aria-label="Open profile"
                            >
                                {avatar ? (
                                    <img src={avatar} alt="" className="w-full h-full object-cover" />
                                ) : (
                                    <span className="flex h-full w-full items-center justify-center font-display text-[10px] text-ink-200">
                                        {(profile.artistAlias || profile.agentName || 'SE').substring(0, 2).toUpperCase()}
                                    </span>
                                )}
                            </button>
                        </div>
                    </div>
                </header>

                {/* Scrollable main content — THIS is what was missing / collapsed */}
                <main
                    className="flex-1 min-h-0 overflow-y-auto overflow-x-hidden bg-ink-950"
                    style={{ WebkitOverflowScrolling: 'touch' }}
                >
                    <div className="px-4 pt-4 pb-4">
                        <ViewLoader
                            activeView={activeView}
                            profile={profile}
                            setProfile={setProfile}
                            onNavigate={setActiveView}
                        />
                    </div>
                </main>

                {/* Bottom tabs — always 4 equal cells, never a side strip */}
                <nav
                    className="shrink-0 border-t border-white/10 bg-ink-950/98 backdrop-blur-md z-20"
                    style={{ paddingBottom: 'env(safe-area-inset-bottom, 0px)' }}
                >
                    <div className="grid grid-cols-5 h-[3.75rem]">
                        {mobileNav.map((item) => {
                            const active = activeView === item.id;
                            return (
                                <button
                                    key={item.id}
                                    type="button"
                                    onClick={() => setActiveView(item.id)}
                                    className={`flex flex-col items-center justify-center gap-0.5 ${
                                        active ? 'text-red-400' : 'text-zinc-500'
                                    }`}
                                >
                                    <item.icon size={22} strokeWidth={active ? 2.4 : 1.8} />
                                    <span className="text-[11px] font-medium leading-none">{item.short}</span>
                                </button>
                            );
                        })}
                    </div>
                </nav>
            </div>
        );
    }

    // ===================== DESKTOP =====================
    return (
        <div className="flex h-screen w-full bg-ink-950 overflow-hidden relative">
            <div className="absolute inset-0 z-0 pointer-events-none grain bg-[radial-gradient(ellipse_at_top,_#12070a_0%,_#08080a_45%,_#060607_100%)]" />

            <nav className="relative z-40 h-full w-64 glass-obsidian border-r border-white/10 flex flex-col shrink-0">
                <div className="p-6 border-b border-white/10">
                    <BrandMark
                        size="md"
                        variant="stacked"
                        onClick={() => setActiveView('dashboard')}
                    />
                </div>

                <div className="flex-1 py-6 px-3 space-y-1 overflow-y-auto">
                    <div className="text-[10px] font-mono tracking-widest text-ink-700 mb-3 px-3 uppercase">Workspace</div>
                    {navItems.map((item) => {
                        const active = activeView === item.id;
                        return (
                            <button
                                key={item.id}
                                type="button"
                                onClick={() => setActiveView(item.id)}
                                className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-lg transition-colors border-l-2 ${
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
                            <img src={avatar} alt="" className="w-full h-full object-cover" />
                        ) : (
                            <span className="font-display text-xs text-ink-200">
                                {(profile.artistAlias || profile.agentName || 'AE').substring(0, 2).toUpperCase()}
                            </span>
                        )}
                    </div>
                    <div className="min-w-0">
                        <div className="text-sm font-medium text-ink-50 truncate">{profile.artistAlias || 'Your artist'}</div>
                        <div className="font-mono text-[9px] text-ink-400 tracking-wide truncate">{profile.agentName || 'Manager'}</div>
                    </div>
                </button>
            </nav>

            <main className="flex-1 overflow-hidden flex flex-col relative z-10 min-w-0">
                <header className="flex h-14 glass-obsidian border-b border-white/10 items-center justify-between px-8 shrink-0 gap-4">
                    <div className="font-mono text-[11px] text-ink-400 tracking-widest">
                        Engine / {current.label}
                    </div>
                    <div className="flex items-center gap-3 min-w-0">
                        <button
                            type="button"
                            title="Help / welcome tour"
                            onClick={() => {
                                resetOnboarding();
                                setShowWelcome(true);
                            }}
                            className="w-9 h-9 rounded-lg border border-white/10 flex items-center justify-center text-ink-400 hover:text-ink-50 hover:bg-white/5"
                        >
                            <HelpCircle size={16} />
                        </button>
                        <ThemeToggle />
                        <FoundingBadge />
                    </div>
                </header>
                <div className="flex-1 overflow-y-auto p-8 custom-scrollbar">
                    <div className="max-w-7xl mx-auto w-full">
                        <ViewLoader
                            activeView={activeView}
                            profile={profile}
                            setProfile={setProfile}
                            onNavigate={setActiveView}
                        />
                    </div>
                </div>
            </main>
            {welcomeTour}
        </div>
    );
}
