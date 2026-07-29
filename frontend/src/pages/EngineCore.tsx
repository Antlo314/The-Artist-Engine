import { useState, useEffect, Suspense, lazy, useMemo, useCallback } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import {
    Home as HomeIcon, Mic2, Scale, Radio, HelpCircle, CreditCard,
    LayoutDashboard, Handshake, Users, UserCircle2, BookOpen, MoreHorizontal, X,
} from 'lucide-react';
import { useAuth } from '../lib/auth';

const Dashboard = lazy(() => import('../components/Dashboard'));
const GigRadar = lazy(() => import('../components/GigRadar'));
const StudioCore = lazy(() => import('../components/StudioCore'));
const LegalCore = lazy(() => import('../components/LegalCore'));
const DealDesk = lazy(() => import('../components/DealDesk'));
const Roster = lazy(() => import('../components/Roster'));
const ArtistProfile = lazy(() => import('../components/ArtistProfile'));
const BillingPanel = lazy(() => import('../components/billing/BillingPanel'));
const AdminConsole = lazy(() => import('../components/admin/AdminConsole'));
import FoundingBadge from '../components/FoundingBadge';
import ThemeToggle from '../components/ThemeToggle';
import BrandMark from '../components/BrandMark';
import { EngineProvider } from '../lib/engineState';
import Walkthrough from '../components/ui/Walkthrough';
import GuidePanel from '../components/ui/GuidePanel';
import MobileExtras from '../components/ui/MobileExtras';
import { hasSeenTour, resetOnboarding } from '../lib/onboarding';

type ViewId =
    | 'home' | 'gigs' | 'studio' | 'deals' | 'contracts'
    | 'roster' | 'plan' | 'admin' | 'profile';

/** Old ids still deep-linked from bookmarks or older code paths. */
const LEGACY_IDS: Record<string, ViewId> = {
    dashboard: 'home',
    radar: 'gigs',
    legal: 'contracts',
    billing: 'plan',
};

const ALL_NAV: {
    id: ViewId;
    label: string;
    short: string;
    desc: string;
    icon: typeof HomeIcon;
    mobile: boolean;      // shows as a primary bottom tab
    adminOnly?: boolean;
}[] = [
    { id: 'home', label: 'Home', short: 'Home', desc: 'Your numbers & pipeline', icon: HomeIcon, mobile: true },
    { id: 'gigs', label: 'Find Gigs', short: 'Gigs', desc: 'Venues booking your genre', icon: Radio, mobile: true },
    { id: 'studio', label: 'Studio', short: 'Studio', desc: 'Master tracks, split stems', icon: Mic2, mobile: true },
    { id: 'deals', label: 'Pitch & Deals', short: 'Deals', desc: 'Write pitches, weigh offers', icon: Handshake, mobile: true },
    { id: 'contracts', label: 'Contracts', short: 'Legal', desc: 'Spot risky clauses fast', icon: Scale, mobile: false },
    { id: 'roster', label: 'Roster', short: 'Roster', desc: 'Contacts, tasks, press kit', icon: Users, mobile: false },
    { id: 'plan', label: 'Plan & Credits', short: 'Plan', desc: 'Limits, upgrades, promos', icon: CreditCard, mobile: false },
    { id: 'admin', label: 'Admin', short: 'Admin', desc: 'Users, plans, credits', icon: LayoutDashboard, mobile: false, adminOnly: true },
    { id: 'profile', label: 'Profile', short: 'You', desc: 'Your identity & links', icon: UserCircle2, mobile: false },
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
    onNavigate: (id: string) => void;
}) {
    const node = useMemo(() => {
        switch (activeView) {
            case 'home':
                return <Dashboard onNavigate={onNavigate} />;
            case 'gigs':
                return <GigRadar profile={profile} />;
            case 'studio':
                return <StudioCore />;
            case 'deals':
                return <DealDesk profile={profile} />;
            case 'contracts':
                return <LegalCore />;
            case 'roster':
                return <Roster profile={profile} />;
            case 'plan':
                return <BillingPanel />;
            case 'admin':
                return <AdminConsole />;
            case 'profile':
                return <ArtistProfile profile={profile} setProfile={setProfile} />;
            default:
                return <Dashboard onNavigate={onNavigate} />;
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
        usualFee: '',
        floorFee: '',
        payoutPreference: '',
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
    const navigate = useNavigate();
    const { view: viewParam } = useParams();
    const isAdmin = me?.user?.role === 'admin';

    const navItems = useMemo(
        () => ALL_NAV.filter((n) => !n.adminOnly || isAdmin),
        [isAdmin]
    );
    const mobilePrimary = useMemo(() => navItems.filter((n) => n.mobile), [navItems]);
    const mobileMore = useMemo(() => navItems.filter((n) => !n.mobile), [navItems]);

    // URL is the source of truth for the active view. /engine → default per device.
    const activeView: ViewId = useMemo(() => {
        const raw = (viewParam || '').toLowerCase();
        const mapped = (LEGACY_IDS[raw] || raw) as ViewId;
        if (ALL_NAV.some((n) => n.id === mapped && (!n.adminOnly || isAdmin))) return mapped;
        return isMobile ? 'gigs' : 'home';
    }, [viewParam, isMobile, isAdmin]);

    const onNavigate = useCallback(
        (id: string) => {
            const mapped = (LEGACY_IDS[id] || id) as ViewId;
            navigate(`/engine/${mapped}`);
        },
        [navigate]
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
    const [showGuide, setShowGuide] = useState(false);
    const [showMore, setShowMore] = useState(false);

    useEffect(() => {
        localStorage.setItem('sovereign_identity', JSON.stringify(profile));
    }, [profile]);

    useEffect(() => {
        setShowMore(false);
    }, [activeView]);

    const current = navItems.find((n) => n.id === activeView) || navItems[0] || ALL_NAV[0];
    const avatar = localStorage.getItem('sovereign_avatar');

    const welcomeTour = (
        <Walkthrough
            tourId="welcome"
            open={showWelcome}
            accent="var(--color-ember-500)"
            onClose={() => setShowWelcome(false)}
            primaryLabel={isMobile ? 'Open Find Gigs' : 'Open Home'}
            onPrimary={() => onNavigate(isMobile ? 'gigs' : 'home')}
            steps={[
                {
                    title: 'Welcome',
                    body: 'One workspace for the whole job of being an independent artist: find shows, finish your music, protect yourself on paper, and keep every contact in one place.',
                    bullets: ['Everything is written in plain language', 'Heavy tools have fair daily limits'],
                },
                {
                    title: 'Five rooms',
                    body: 'Find Gigs searches real venues. Studio masters your tracks. Pitch & Deals writes your outreach and weighs offers. Contracts flags risky clauses. Roster keeps your contacts, tasks, and press kit.',
                    bullets: ['Home ties it all together with real numbers', 'On your phone, the bottom bar gets you everywhere'],
                },
                {
                    title: 'Help is always one tap away',
                    body: 'Every screen has a Guide — plain words on what the tools do, how to use them, and answers to common questions.',
                    bullets: ['Look for the book icon in the top bar', 'Small ? buttons explain individual controls'],
                },
            ]}
        />
    );

    const guidePanel = (
        <GuidePanel
            viewId={activeView}
            open={showGuide}
            onClose={() => setShowGuide(false)}
            onReplayTour={() => {
                resetOnboarding();
                setShowWelcome(true);
            }}
        />
    );

    // ===================== MOBILE =====================
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
                {guidePanel}
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
                            <button
                                type="button"
                                onClick={() => setShowGuide(true)}
                                aria-label="Open the guide for this screen"
                                className="h-9 w-9 rounded-lg border border-white/15 flex items-center justify-center text-ink-300"
                            >
                                <BookOpen size={16} />
                            </button>
                            <ThemeToggle />
                            <button
                                type="button"
                                onClick={() => onNavigate('profile')}
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

                {/* Scrollable main content */}
                <main
                    className="flex-1 min-h-0 overflow-y-auto overflow-x-hidden bg-ink-950"
                    style={{ WebkitOverflowScrolling: 'touch' }}
                >
                    <div className="px-4 pt-4 pb-4">
                        <MobileExtras />
                        <ViewLoader
                            activeView={activeView}
                            profile={profile}
                            setProfile={setProfile}
                            onNavigate={onNavigate}
                        />
                    </div>
                </main>

                {/* "More" sheet — the rest of the rooms */}
                <AnimatePresence>
                    {showMore && (
                        <motion.div
                            className="fixed inset-0 z-30"
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            exit={{ opacity: 0 }}
                        >
                            <button
                                type="button"
                                aria-label="Close menu"
                                className="absolute inset-0 bg-ink-950/70 backdrop-blur-sm"
                                onClick={() => setShowMore(false)}
                            />
                            <motion.div
                                initial={{ y: '100%' }}
                                animate={{ y: 0 }}
                                exit={{ y: '100%' }}
                                transition={{ type: 'spring', stiffness: 340, damping: 34 }}
                                className="absolute inset-x-0 bottom-0 rounded-t-2xl glass-obsidian border-t border-white/10 p-4"
                                style={{ paddingBottom: 'calc(env(safe-area-inset-bottom, 0px) + 4.75rem)' }}
                            >
                                <div className="flex items-center justify-between mb-3">
                                    <span className="font-display text-sm text-ink-50">Everything else</span>
                                    <button
                                        type="button"
                                        aria-label="Close"
                                        onClick={() => setShowMore(false)}
                                        className="w-8 h-8 rounded-lg border border-white/10 flex items-center justify-center text-ink-400"
                                    >
                                        <X size={14} />
                                    </button>
                                </div>
                                <div className="grid grid-cols-2 gap-2">
                                    {mobileMore.map((item) => (
                                        <button
                                            key={item.id}
                                            type="button"
                                            onClick={() => {
                                                setShowMore(false);
                                                onNavigate(item.id);
                                            }}
                                            className={`flex items-center gap-3 rounded-xl border px-3 py-3 text-left min-h-[56px] ${
                                                activeView === item.id
                                                    ? 'border-ember-500/50 bg-white/5 text-ink-50'
                                                    : 'border-white/10 text-ink-200'
                                            }`}
                                        >
                                            <item.icon size={18} className={activeView === item.id ? 'text-ember-500' : 'text-ink-400'} />
                                            <div className="min-w-0">
                                                <div className="text-[13px] font-medium leading-tight">{item.label}</div>
                                                <div className="text-[10px] text-ink-400 truncate">{item.desc}</div>
                                            </div>
                                        </button>
                                    ))}
                                    <button
                                        type="button"
                                        onClick={() => {
                                            setShowMore(false);
                                            setShowGuide(true);
                                        }}
                                        className="flex items-center gap-3 rounded-xl border border-white/10 px-3 py-3 text-left min-h-[56px] text-ink-200"
                                    >
                                        <BookOpen size={18} className="text-ink-400" />
                                        <div className="min-w-0">
                                            <div className="text-[13px] font-medium leading-tight">Guide</div>
                                            <div className="text-[10px] text-ink-400 truncate">How this screen works</div>
                                        </div>
                                    </button>
                                </div>
                            </motion.div>
                        </motion.div>
                    )}
                </AnimatePresence>

                {/* Bottom tabs — 4 rooms + More */}
                <nav
                    className="shrink-0 border-t border-white/10 bg-ink-950/98 backdrop-blur-md z-40"
                    style={{ paddingBottom: 'env(safe-area-inset-bottom, 0px)' }}
                >
                    <div className="grid grid-cols-5 h-[3.75rem]">
                        {mobilePrimary.map((item) => {
                            const active = activeView === item.id;
                            return (
                                <button
                                    key={item.id}
                                    type="button"
                                    onClick={() => onNavigate(item.id)}
                                    className={`flex flex-col items-center justify-center gap-0.5 ${
                                        active ? 'text-ember-400' : 'text-ink-500'
                                    }`}
                                >
                                    <item.icon size={22} strokeWidth={active ? 2.4 : 1.8} />
                                    <span className="text-[11px] font-medium leading-none">{item.short}</span>
                                </button>
                            );
                        })}
                        <button
                            type="button"
                            onClick={() => setShowMore((v) => !v)}
                            className={`flex flex-col items-center justify-center gap-0.5 ${
                                showMore || mobileMore.some((m) => m.id === activeView)
                                    ? 'text-ember-400'
                                    : 'text-ink-500'
                            }`}
                        >
                            <MoreHorizontal size={22} strokeWidth={1.8} />
                            <span className="text-[11px] font-medium leading-none">More</span>
                        </button>
                    </div>
                </nav>
            </div>
        );
    }

    // ===================== DESKTOP =====================
    return (
        <div className="flex h-screen w-full bg-ink-950 overflow-hidden relative">
            <div className="absolute inset-0 z-0 pointer-events-none grain bg-[radial-gradient(ellipse_at_top,_#140b06_0%,_#0a0807_45%,_#070605_100%)]" />

            <nav className="relative z-40 h-full w-64 glass-obsidian border-r border-white/10 flex flex-col shrink-0">
                <div className="p-6 border-b border-white/10">
                    <BrandMark
                        size="md"
                        variant="stacked"
                        onClick={() => onNavigate('home')}
                    />
                </div>

                <div className="flex-1 py-6 px-3 space-y-1 overflow-y-auto">
                    <div className="text-[10px] font-mono tracking-widest text-ink-400 mb-3 px-3 uppercase">Your rooms</div>
                    {navItems.map((item) => {
                        const active = activeView === item.id;
                        return (
                            <button
                                key={item.id}
                                type="button"
                                onClick={() => onNavigate(item.id)}
                                className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-lg transition-colors border-l-2 ${
                                    active
                                        ? 'bg-white/5 border-ember-500 text-ink-50'
                                        : 'border-transparent text-ink-400 hover:text-ink-50 hover:bg-white/5'
                                }`}
                            >
                                <item.icon size={18} className={active ? 'text-ember-500' : ''} />
                                <div className="text-left min-w-0">
                                    <div className="text-sm font-medium leading-tight">{item.label}</div>
                                    <div className="text-[10px] text-ink-400 truncate">{item.desc}</div>
                                </div>
                            </button>
                        );
                    })}
                </div>

                <button
                    type="button"
                    onClick={() => onNavigate('profile')}
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
                        <div className="text-[10px] text-ink-400 truncate">{profile.agentName || 'Manager'}</div>
                    </div>
                </button>
            </nav>

            <main className="flex-1 overflow-hidden flex flex-col relative z-10 min-w-0">
                <header className="flex h-14 glass-obsidian border-b border-white/10 items-center justify-between px-8 shrink-0 gap-4">
                    <div className="text-[12px] text-ink-400">
                        {current.label} <span className="text-ink-500">— {current.desc}</span>
                    </div>
                    <div className="flex items-center gap-3 min-w-0">
                        <button
                            type="button"
                            onClick={() => setShowGuide(true)}
                            className="inline-flex items-center gap-2 h-9 px-3 rounded-lg border border-white/10 text-ink-300 hover:text-ink-50 hover:bg-white/5 text-xs font-medium"
                        >
                            <BookOpen size={14} /> Guide
                        </button>
                        <button
                            type="button"
                            title="Replay the welcome tour"
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
                            onNavigate={onNavigate}
                        />
                    </div>
                </div>
            </main>
            {welcomeTour}
            {guidePanel}
        </div>
    );
}
