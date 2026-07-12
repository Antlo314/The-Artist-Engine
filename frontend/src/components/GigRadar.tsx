import { useState, useMemo } from 'react';
import { createPortal } from 'react-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { Target, MapPin, Activity, DollarSign, BrainCircuit, Search, AlertTriangle, Users, Calendar, Send, X, ShieldAlert, Link as LinkIcon, Instagram, Twitter, Facebook, Globe, Download } from 'lucide-react';
import LoadingProgressBar from './LoadingProgressBar';
import { useEngine } from '../lib/engineState';
import { apiFetch } from '../lib/api';
import { useAuth } from '../lib/auth';
import { PageHeader, Panel, Field, Btn, EmptyState, StepHint, Segmented, inputCls } from './ui/Shell';
import { openMailto, downloadEml, cachePitch } from '../lib/exportUtils';

interface GigRadarProps {
    profile: any;
}

const OUTREACH_OPTIONS: { value: 'email' | 'call_script' | 'dm'; label: string }[] = [
    { value: 'email', label: 'Email' },
    { value: 'call_script', label: 'Call script' },
    { value: 'dm', label: 'DM' },
];

type SortMode = 'best' | 'reputation' | 'gross' | 'capacity';

const SORT_OPTIONS: { value: SortMode; label: string }[] = [
    { value: 'best', label: 'Best odds' },
    { value: 'reputation', label: 'Reputation' },
    { value: 'gross', label: 'Gross $' },
    { value: 'capacity', label: 'Capacity' },
];

const CSV_COLUMNS: { key: string; label: string }[] = [
    { key: 'name', label: 'name' },
    { key: 'city', label: 'city' },
    { key: 'contact', label: 'contact' },
    { key: 'contact_persona', label: 'contact_persona' },
    { key: 'payout_model', label: 'payout_model' },
    { key: 'lead_time', label: 'lead_time' },
    { key: 'reputation_score', label: 'reputation_score' },
    { key: 'capacity', label: 'capacity' },
    { key: 'avg_ticket_price_usd', label: 'avg_ticket_price_usd' },
    { key: 'gross_potential_usd', label: 'gross_potential_usd' },
    { key: 'website_url', label: 'website_url' },
    { key: 'social_media_url', label: 'social_media_url' },
];

const csvEscape = (val: any) => {
    const s = val === null || val === undefined ? '' : String(val);
    return `"${s.replace(/"/g, '""')}"`;
};

export default function GigRadar({ profile }: GigRadarProps) {
    const { record } = useEngine();
    const { refreshMe } = useAuth();
    // Search State
    const [city, setCity] = useState(profile?.homeCity || 'Chicago');
    const [genre, setGenre] = useState(profile?.primaryGenre || 'Deep House');
    const [tier, setTier] = useState('Mid-Size Touring (250-1000 cap)');
    const [radius, setRadius] = useState('50 miles');
    const [timeframe, setTimeframe] = useState('Fall 2026');

    // UI State
    const [isScouting, setIsScouting] = useState(false);
    const [gigs, setGigs] = useState<any[]>([]);
    const [error, setError] = useState<string | null>(null);

    // Results toolbar state
    const [sortMode, setSortMode] = useState<SortMode>('best');
    const [verifiedOnly, setVerifiedOnly] = useState(false);

    // Pitch Modal State
    const [pitchModal, setPitchModal] = useState<any | null>(null);
    const [pitchRoutingTo, setPitchRoutingTo] = useState<string>('');
    const [generatedPitch, setGeneratedPitch] = useState<string>('');
    const [isDrafting, setIsDrafting] = useState(false);
    const [outreachType, setOutreachType] = useState<'email' | 'call_script' | 'dm'>('email');

    // Reputation Modal State
    const [repModal, setRepModal] = useState<any | null>(null);

    const handleScout = async () => {
        setIsScouting(true);
        setError(null);
        setGigs([]);
        try {
            const response = await apiFetch('/api/scout', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ city, genre, tier, radius, timeframe })
            });
            const data = await response.json().catch(() => ({}));
            if (!response.ok) {
                const detail = data?.detail;
                throw new Error(
                    typeof detail === 'object'
                        ? detail.message || JSON.stringify(detail)
                        : detail || `Status ${response.status}`
                );
            }
            if (data.status === 'success') {
                const results = data.gigs.venues ? data.gigs.venues : (Array.isArray(data.gigs) ? data.gigs : []);
                setGigs(results);
                if (results.length) record.scout(city, genre, results);
                refreshMe();
            } else {
                throw new Error(data.error || 'API Error');
            }
        } catch (err: any) {
            console.error(err);
            setError(err.message || 'Scan failed');
        } finally {
            setIsScouting(false);
        }
    };

    const handleEngageShark = async (targetGig: any, type: 'email' | 'call_script' | 'dm' = 'email') => {
        setPitchModal(targetGig);
        setOutreachType(type);
        setPitchRoutingTo(type === 'dm' ? targetGig.social_media_url || 'Unknown Social Link' : targetGig.contact || '');
        setGeneratedPitch('');
        setIsDrafting(true);

        const safeString = (val: any, fallback: string) => (val && typeof val === 'string' && val.trim().length > 0) ? val : fallback;

        try {
            const response = await apiFetch('/api/draft-pitch', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    venue_name: safeString(targetGig.name, 'Unknown Venue'),
                    venue_tier: safeString(targetGig.tier, tier),
                    genre: safeString(genre, 'Unknown Genre'),
                    contact_persona: safeString(targetGig.contact_persona, targetGig.contact ? targetGig.contact : 'Booking Team'),
                    payout_model: safeString(targetGig.payout_model, 'Standard Target'),
                    artist_name: safeString(profile.artistAlias, 'The Artist'),
                    agent_name: safeString(profile.agentName, 'The Manager'),
                    agent_email: profile.agentEmail || null,
                    agent_phone: profile.agentPhone || null,
                    agent_social: profile.agentSocial || null,
                    outreach_type: type
                })
            });
            const data = await response.json().catch(() => ({}));
            if (!response.ok) {
                const detail = data?.detail;
                throw new Error(
                    typeof detail === 'object' ? detail.message || JSON.stringify(detail) : detail || `Status ${response.status}`
                );
            }
            if (data.status === 'success') {
                setGeneratedPitch(data.pitch);
                refreshMe();
            } else {
                throw new Error(data.error);
            }
        } catch (err: any) {
            setGeneratedPitch(`ERROR GENERATING PITCH: ${err.message}. ${err.message.includes('Failed to fetch') ? '(Is the Python backend running?)' : 'MANUAL OVERRIDE REQUIRED.'}`);
        } finally {
            setIsDrafting(false);
        }
    };

    const handleDeployPitch = (gigIdx: number, mode: 'mailto' | 'eml' | 'copy' = 'mailto') => {
        const gig = gigs[gigIdx];
        if (!gig) return;
        const body = generatedPitch || '';
        const subject = `Booking inquiry — ${profile?.artistAlias || profile?.agentName || 'Artist'} × ${gig.name}`;
        const rawTo = pitchRoutingTo || gig.contact || '';
        const to = rawTo.includes('@') ? rawTo : '';

        cachePitch({ venue: gig.name, body, outreach: outreachType });
        if (mode === 'mailto') openMailto({ to, subject, body });
        else if (mode === 'eml') {
            downloadEml(`pitch-${String(gig.name).replace(/\s+/g, '_')}.eml`, {
                to,
                subject,
                body,
                from: profile?.agentEmail,
            });
        } else if (mode === 'copy') {
            navigator.clipboard?.writeText(body).catch(() => null);
        }

        const newGigs = [...gigs];
        newGigs[gigIdx].pipeline_status = 'PITCHED';
        setGigs(newGigs);
        if (newGigs[gigIdx]?.name) record.pitch(newGigs[gigIdx].name, outreachType);
        setPitchModal(null);
    };

    const getScoreColor = (scoreStr: string) => {
        const score = parseInt(scoreStr, 10);
        if (isNaN(score)) return 'text-ink-50';
        if (score >= 80) return 'text-green-400';
        if (score >= 50) return 'text-fuchsia-400';
        return 'text-red-500';
    };

    const getSocialIcon = (url: string | undefined | null) => {
        if (!url) return <LinkIcon size={14} />;
        const lurl = url.toLowerCase();
        if (lurl.includes('instagram.com')) return <Instagram size={14} />;
        if (lurl.includes('twitter.com') || lurl.includes('x.com')) return <Twitter size={14} />;
        if (lurl.includes('facebook.com')) return <Facebook size={14} />;
        return <Globe size={14} />;
    };

    // The "alpha target" (best-odds venue) is always computed off the full,
    // unfiltered gigs list so the "Best odds" badge stays consistent no
    // matter how the results are currently sorted/filtered for display.
    const alphaIndex = useMemo(() => {
        let maxScore = -1;
        let idx = -1;
        gigs.forEach((g, i) => {
            const rep = parseInt(g.reputation_score) || 0;
            const activeBonus = g.active_search_signal ? 20 : 0;
            const total = rep + activeBonus;
            if (total > maxScore) {
                maxScore = total;
                idx = i;
            }
        });
        return idx;
    }, [gigs]);

    // Derived (sorted + filtered) list for rendering/export. Never mutates `gigs`.
    const displayedGigs = useMemo(() => {
        const num = (v: any) => {
            const n = Number(v);
            return isNaN(n) ? 0 : n;
        };

        let list = gigs.map((gig, originalIndex) => ({ gig, originalIndex }));

        if (verifiedOnly) {
            list = list.filter(({ gig }) => !!gig.verified_live);
        }

        if (sortMode === 'reputation') {
            list = [...list].sort((a, b) => num(b.gig.reputation_score) - num(a.gig.reputation_score));
        } else if (sortMode === 'gross') {
            list = [...list].sort((a, b) => num(b.gig.gross_potential_usd) - num(a.gig.gross_potential_usd));
        } else if (sortMode === 'capacity') {
            list = [...list].sort((a, b) => num(b.gig.capacity) - num(a.gig.capacity));
        } else {
            // Best odds (default): alpha target first, then by reputation desc.
            list = [...list].sort((a, b) => {
                if (a.originalIndex === alphaIndex) return -1;
                if (b.originalIndex === alphaIndex) return 1;
                return num(b.gig.reputation_score) - num(a.gig.reputation_score);
            });
        }

        return list;
    }, [gigs, sortMode, verifiedOnly, alphaIndex]);

    const handleExportCsv = () => {
        const header = CSV_COLUMNS.map((c) => csvEscape(c.label)).join(',');
        const rows = displayedGigs.map(({ gig }) =>
            CSV_COLUMNS.map((c) => csvEscape(gig[c.key])).join(',')
        );
        const csv = [header, ...rows].join('\r\n');
        const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
        const url = URL.createObjectURL(blob);
        const link = document.createElement('a');
        link.href = url;
        link.download = `gig-radar-${(city || 'export').trim().replace(/\s+/g, '_')}.csv`;
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        URL.revokeObjectURL(url);
    };

    return (
        <div className="space-y-4 md:space-y-8">
            <PageHeader
                view="radar"
                accent="var(--color-radar)"
                module="GIG RADAR"
                title="Find Gigs"
                desc="Live venues + payout intel. Scans measure ~8 seconds."
                speedHint="~8s"
            />

            <div className="hidden md:block">
                <StepHint steps={['Set your search', 'Review verified venues', 'Send the pitch']} accent="var(--color-radar)" />
            </div>

            <Panel title="Search" accent="var(--color-radar)">
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-3 md:gap-4">
                    <Field label="City">
                        <div className="relative">
                            <MapPin size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-ink-700 pointer-events-none" />
                            <input
                                type="text"
                                value={city}
                                onChange={(e) => setCity(e.target.value)}
                                placeholder="Atlanta or 30301"
                                className={`${inputCls()} pl-9 min-h-[44px]`}
                            />
                        </div>
                    </Field>

                    <Field label="Genre">
                        <select value={genre} onChange={(e) => setGenre(e.target.value)} className={`${inputCls()} min-h-[44px]`}>
                            <option>House</option>
                            <option>Deep House</option>
                            <option>Techno</option>
                            <option>Trance</option>
                            <option>Drum & Bass</option>
                            <option>Dubstep</option>
                            <option>Trap</option>
                            <option>Hip Hop</option>
                            <option>R&B</option>
                            <option>Pop</option>
                            <option>Rock</option>
                            <option>Metal</option>
                            <option>Country</option>
                            <option>Jazz</option>
                            <option>Afrobeat</option>
                            <option>Reggaeton</option>
                            <option>Acoustic / Live Instrumentation</option>
                        </select>
                    </Field>

                    <Field label="Venue tier">
                        <select value={tier} onChange={(e) => setTier(e.target.value)} className={`${inputCls()} min-h-[44px]`}>
                            <option>Grassroots / Mom & Pop (50-250 cap)</option>
                            <option>Mid-Size Touring (250-1000 cap)</option>
                            <option>Top-Tier Theater (1000-3000 cap)</option>
                            <option>Arena / Stadium (3000+ cap)</option>
                        </select>
                    </Field>

                    <Field label="Radius">
                        <select value={radius} onChange={(e) => setRadius(e.target.value)} className={`${inputCls()} min-h-[44px]`}>
                            <option>Exact City</option>
                            <option>10 miles</option>
                            <option>50 miles</option>
                            <option>250 miles</option>
                        </select>
                    </Field>

                    <Field label="Timeframe">
                        <select value={timeframe} onChange={(e) => setTimeframe(e.target.value)} className={`${inputCls()} min-h-[44px]`}>
                            <option>Active Now</option>
                            <option>Summer 2026</option>
                            <option>Fall 2026</option>
                            <option>Q1 2027</option>
                        </select>
                    </Field>
                </div>

                <div className="mt-4 md:mt-5 flex md:justify-end">
                    <Btn variant="accent" accent="var(--color-radar)" onClick={handleScout} disabled={isScouting} className="w-full md:w-auto min-h-[48px]">
                        {isScouting ? (
                            <><Activity size={16} className="animate-spin" /> Scanning venues…</>
                        ) : (
                            <><Target size={16} /> Scan for venues</>
                        )}
                    </Btn>
                </div>
            </Panel>

            {error && (
                <div className="flex items-center gap-3 px-4 py-3 rounded-lg border border-red-500/30 bg-red-500/10 text-red-300 text-sm">
                    <ShieldAlert size={16} className="shrink-0" />
                    Search failed — backend may be cold-starting. Retry once; warm scans land in ~8 seconds.
                </div>
            )}

            {/* Results toolbar */}
            {gigs.length > 0 && (
                <div className="flex flex-wrap items-center justify-between gap-3">
                    <div className="flex flex-wrap items-center gap-3">
                        <Segmented
                            options={SORT_OPTIONS}
                            value={sortMode}
                            onChange={setSortMode}
                            accent="var(--color-radar)"
                        />
                        <button
                            onClick={() => setVerifiedOnly((v) => !v)}
                            className={`px-4 py-1.5 rounded-full font-mono text-[11px] tracking-widest uppercase transition-colors border ${verifiedOnly ? 'bg-orange-500/15 text-orange-400 border-orange-500/40' : 'border-white/10 text-ink-400 hover:text-ink-50 hover:border-white/25'}`}
                        >
                            Verified only
                        </button>
                    </div>
                    <Btn variant="ghost" size="sm" onClick={handleExportCsv}>
                        <Download size={14} /> Export CSV
                    </Btn>
                </div>
            )}

            {/* Results */}
            <div className="grid grid-cols-1 xl:grid-cols-2 gap-6 items-start">
                <AnimatePresence>
                    {!isScouting && gigs.length === 0 && !error && (
                        <motion.div
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            className="col-span-full"
                        >
                            <EmptyState
                                icon={<Search size={40} />}
                                title="No venues yet"
                                hint="Run a search above to find venues booking your genre."
                            />
                        </motion.div>
                    )}

                    {isScouting && (
                        <div className="col-span-full w-full max-w-lg mx-auto py-16 px-4">
                            <LoadingProgressBar
                                active={isScouting}
                                message="Scanning for venues"
                                subMessage="Live ticketing grid + AI payout intel. Measured ~8s on production."
                                colorClass="orange"
                                estimatedDurationMs={8000}
                                speedLabel="~8s live"
                            />
                        </div>
                    )}
                    {(() => {
                        if (isScouting || gigs.length === 0) return null;

                        if (displayedGigs.length === 0) {
                            return (
                                <div className="col-span-full">
                                    <EmptyState
                                        icon={<Search size={40} />}
                                        title="No verified venues"
                                        hint="Turn off 'Verified only' to see all scanned venues."
                                    />
                                </div>
                            );
                        }

                        return displayedGigs.map(({ gig, originalIndex }, idx) => {
                            const isAlpha = originalIndex === alphaIndex;

                            return (
                                <motion.div
                                    key={idx}
                                    initial={{ opacity: 0, y: 30, scale: 0.95 }}
                                    animate={{ opacity: 1, y: 0, scale: 1 }}
                                    transition={{ delay: Math.min(idx * 0.04, 0.35), type: 'spring', stiffness: 320, damping: 28 }}
                                    whileHover={{ y: -2 }}
                                    className={`glass-obsidian rounded-xl border p-5 md:p-6 flex flex-col gap-5 group transition-colors ${gig.pipeline_status === 'PITCHED' ? 'border-white/10 opacity-70' : isAlpha ? 'border-orange-500/40 ring-1 ring-orange-500/40' : 'border-white/10 hover:border-orange-500/30'}`}
                                >
                                    {/* Header */}
                                    <div className="flex items-start justify-between gap-3">
                                        <div className="min-w-0">
                                            <div className="flex items-center gap-2 flex-wrap">
                                                <h3 className="font-display text-lg text-ink-50 truncate">{gig.name}</h3>
                                                {gig.social_media_url && (
                                                    <a href={gig.social_media_url} target="_blank" rel="noopener noreferrer" className="text-ink-400 hover:text-orange-400 transition-colors">
                                                        {getSocialIcon(gig.social_media_url)}
                                                    </a>
                                                )}
                                                {gig.website_url && (
                                                    <a href={gig.website_url} target="_blank" rel="noopener noreferrer" className="text-ink-400 hover:text-orange-400 transition-colors">
                                                        <Globe size={14} />
                                                    </a>
                                                )}
                                            </div>
                                            <p className="font-mono text-[10px] text-ink-400 uppercase tracking-widest mt-1 truncate">{gig.tier || tier}</p>
                                        </div>
                                        <div className="flex flex-col items-end gap-2 shrink-0">
                                            <div className="flex items-center gap-1.5 flex-wrap justify-end">
                                                {gig.pipeline_status === 'PITCHED' && (
                                                    <span className="font-mono text-[9px] tracking-widest uppercase px-2 py-0.5 rounded-full bg-white/5 text-ink-400 border border-white/10">
                                                        Pitch sent
                                                    </span>
                                                )}
                                                {isAlpha && (
                                                    <span className="font-mono text-[9px] tracking-widest uppercase px-2 py-0.5 rounded-full bg-orange-500/15 text-orange-400 border border-orange-500/40">
                                                        Best odds
                                                    </span>
                                                )}
                                                {gig.active_search_signal && (
                                                    <span className="font-mono text-[9px] tracking-widest uppercase px-2 py-0.5 rounded-full bg-white/5 text-ink-200 border border-white/10">
                                                        Live
                                                    </span>
                                                )}
                                            </div>
                                            <button
                                                onClick={() => setRepModal(gig)}
                                                className={`font-mono text-[11px] tracking-wide flex items-center gap-1 rounded-full border border-white/10 bg-white/5 px-2.5 py-1 hover:border-white/25 transition-colors ${getScoreColor(gig.reputation_score)}`}
                                            >
                                                Rep {gig.reputation_score || 'N/A'} <Search size={10} className="opacity-60" />
                                            </button>
                                        </div>
                                    </div>

                                    {/* Meta grid */}
                                    <div className="grid grid-cols-2 gap-3">
                                        <div className="bg-white/5 rounded-lg border border-white/10 p-3 flex flex-col gap-1">
                                            <span className="font-mono text-[9px] text-ink-400 uppercase tracking-widest flex items-center gap-1"><DollarSign size={10} /> Payout</span>
                                            <span className="text-sm text-ink-50 truncate">{gig.payout_model || 'Unknown'}</span>
                                        </div>
                                        <div className="bg-white/5 rounded-lg border border-white/10 p-3 flex flex-col gap-1">
                                            <span className="font-mono text-[9px] text-ink-400 uppercase tracking-widest flex items-center gap-1"><Calendar size={10} /> Lead time</span>
                                            <span className="text-sm text-ink-50 truncate">{gig.lead_time || 'N/A'}</span>
                                        </div>
                                        <div className="bg-white/5 rounded-lg border border-white/10 p-3 flex flex-col gap-1">
                                            <span className="font-mono text-[9px] text-ink-400 uppercase tracking-widest flex items-center justify-between gap-1">
                                                <span className="flex items-center gap-1"><Activity size={10} /> Contact</span>
                                                {gig.contact_source && <span className="text-orange-400/80 normal-case truncate">{gig.contact_source}</span>}
                                            </span>
                                            <span className="text-sm text-ink-50 truncate">{gig.contact_persona || gig.contact || 'Not listed'}</span>
                                        </div>
                                        <div className="bg-white/5 rounded-lg border border-white/10 p-3 flex flex-col gap-1">
                                            <span className="font-mono text-[9px] text-ink-400 uppercase tracking-widest flex items-center gap-1"><Users size={10} /> Similar acts</span>
                                            <span className="text-sm text-ink-50 line-clamp-1 group-hover:line-clamp-none transition-all">{gig.similar_acts ? (Array.isArray(gig.similar_acts) ? gig.similar_acts.join(', ') : gig.similar_acts) : 'None extracted'}</span>
                                        </div>
                                    </div>

                                    {/* Financial strip */}
                                    <div className="flex items-center justify-between bg-black/20 border border-white/10 rounded-lg p-3">
                                        <div className="flex flex-col items-center text-center flex-1 border-r border-white/10">
                                            <span className="font-mono text-[9px] text-ink-400 uppercase tracking-widest mb-1">Capacity</span>
                                            <span className="font-display text-base text-ink-50">{gig.capacity || 'N/A'}</span>
                                        </div>
                                        <div className="flex flex-col items-center text-center flex-1 border-r border-white/10">
                                            <span className="font-mono text-[9px] text-ink-400 uppercase tracking-widest mb-1">Avg ticket</span>
                                            <span className="font-display text-base text-ink-50">{gig.avg_ticket_price_usd ? `$${gig.avg_ticket_price_usd}` : 'N/A'}</span>
                                        </div>
                                        <div className="flex flex-col items-center text-center flex-1">
                                            <span className="font-mono text-[9px] text-orange-400 uppercase tracking-widest mb-1">Gross potential</span>
                                            <span className="font-display text-lg text-orange-400">{gig.gross_potential_usd ? `$${gig.gross_potential_usd.toLocaleString()}` : 'N/A'}</span>
                                        </div>
                                    </div>

                                    {/* Leverage + strategy */}
                                    <div className="space-y-3 border-t border-white/10 pt-4">
                                        {gig.leverage_point && (
                                            <div className="border-l-2 border-orange-500/50 pl-3 py-0.5">
                                                <div className="flex items-center gap-1.5 font-mono text-[10px] text-orange-400 uppercase tracking-widest mb-1">
                                                    <AlertTriangle size={12} /> Leverage
                                                </div>
                                                <p className="text-xs text-ink-200 italic leading-snug">"{gig.leverage_point}"</p>
                                            </div>
                                        )}
                                        <div>
                                            <div className="flex items-center gap-1.5 font-mono text-[10px] text-ink-400 uppercase tracking-widest mb-1.5">
                                                <BrainCircuit size={12} /> Negotiation strategy
                                            </div>
                                            <p className="text-sm text-ink-200 leading-relaxed line-clamp-2 md:line-clamp-3 group-hover:line-clamp-none transition-all duration-300">
                                                {gig.strategy}
                                            </p>
                                        </div>
                                    </div>

                                    {/* Footer */}
                                    <Btn
                                        variant="accent"
                                        accent="var(--color-radar)"
                                        onClick={() => handleEngageShark(gig)}
                                        disabled={gig.pipeline_status === 'PITCHED'}
                                        className="w-full"
                                    >
                                        {gig.pipeline_status === 'PITCHED' ? 'Pitch sent' : <><Send size={14} /> Draft pitch</>}
                                    </Btn>
                                </motion.div>
                            );
                        });
                    })()}
                </AnimatePresence>
            </div>

            {/* Auto-Pitch Terminal Modal */}
            {typeof window !== 'undefined' && createPortal(
                <AnimatePresence>
                    {pitchModal && (
                        <motion.div
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            exit={{ opacity: 0 }}
                            className="fixed inset-0 z-[99999] flex items-center justify-center bg-black/70 backdrop-blur-md p-4"
                        >
                            <motion.div
                                initial={{ scale: 0.95, y: 20 }}
                                animate={{ scale: 1, y: 0 }}
                                exit={{ scale: 0.95, y: 20 }}
                                className="glass-obsidian border border-white/10 rounded-2xl w-full max-w-3xl max-h-[90vh] flex flex-col overflow-hidden"
                            >
                                {/* Modal Header */}
                                <div className="p-5 border-b border-white/10 flex items-center justify-between gap-4">
                                    <div className="min-w-0">
                                        <h3 className="font-display text-lg text-ink-50">Draft pitch</h3>
                                        <p className="font-mono text-[10px] text-orange-400 tracking-widest uppercase mt-1 truncate">
                                            {pitchModal.name} · {pitchModal.contact_persona || 'Booking contact'}
                                        </p>
                                    </div>
                                    <button onClick={() => setPitchModal(null)} className="text-ink-400 hover:text-ink-50 transition-colors p-2 shrink-0">
                                        <X size={22} />
                                    </button>
                                </div>

                                {/* Modal Body */}
                                <div className="p-6 overflow-y-auto flex-1 custom-scrollbar">
                                    {isDrafting ? (
                                        <div className="py-16 w-full flex items-center justify-center">
                                            <LoadingProgressBar
                                                active={isDrafting}
                                                message={`Writing your ${outreachType === 'call_script' ? 'call script' : outreachType === 'dm' ? 'DM' : 'email'}`}
                                                subMessage="Venue-tier pitch in your manager's voice. Measured ~2 seconds live."
                                                colorClass="orange"
                                                estimatedDurationMs={2000}
                                                speedLabel="~2s live"
                                            />
                                        </div>
                                    ) : (
                                        <div className="space-y-4">
                                            <Segmented
                                                options={OUTREACH_OPTIONS}
                                                value={outreachType}
                                                onChange={(v) => handleEngageShark(pitchModal, v)}
                                                accent="var(--color-radar)"
                                            />

                                            <Field label="Sending to">
                                                <input
                                                    type="text"
                                                    value={pitchRoutingTo}
                                                    onChange={(e) => setPitchRoutingTo(e.target.value)}
                                                    placeholder="Add an email, phone, or handle"
                                                    className={inputCls()}
                                                />
                                            </Field>

                                            <div className="bg-ink-900/50 rounded-lg border border-white/10">
                                                <textarea
                                                    value={generatedPitch}
                                                    onChange={(e) => setGeneratedPitch(e.target.value)}
                                                    className="w-full h-72 bg-transparent text-ink-200 text-sm p-4 outline-none resize-none custom-scrollbar leading-relaxed"
                                                />
                                            </div>
                                        </div>
                                    )}
                                </div>

                                {/* Modal Footer */}
                                {!isDrafting && (
                                    <div className="p-4 border-t border-white/10 flex flex-wrap justify-end gap-2">
                                        <Btn variant="ghost" onClick={() => setPitchModal(null)}>Cancel</Btn>
                                        <Btn variant="ghost" onClick={() => handleDeployPitch(gigs.indexOf(pitchModal), 'copy')}>
                                            Copy
                                        </Btn>
                                        <Btn variant="ghost" onClick={() => handleDeployPitch(gigs.indexOf(pitchModal), 'eml')}>
                                            <Download size={14} /> .eml
                                        </Btn>
                                        <Btn variant="accent" accent="var(--color-radar)" onClick={() => handleDeployPitch(gigs.indexOf(pitchModal), 'mailto')}>
                                            <Send size={14} /> Open mail
                                        </Btn>
                                    </div>
                                )}
                            </motion.div>
                        </motion.div>
                    )}
                </AnimatePresence>,
                document.body
            )}

            {/* Reputation Explanation Modal */}
            {typeof window !== 'undefined' && createPortal(
                <AnimatePresence>
                    {repModal && (
                        <motion.div
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            exit={{ opacity: 0 }}
                            className="fixed inset-0 z-[99999] flex items-center justify-center bg-black/70 backdrop-blur-sm p-4"
                        >
                            <motion.div
                                initial={{ scale: 0.95, y: 20 }}
                                animate={{ scale: 1, y: 0 }}
                                exit={{ scale: 0.95, y: 20 }}
                                className="glass-obsidian border border-white/10 rounded-2xl w-full max-w-md flex flex-col overflow-hidden"
                            >
                                <div className="p-4 border-b border-white/10 flex items-center justify-between">
                                    <h3 className="font-mono text-xs tracking-widest text-orange-400 uppercase flex items-center gap-2">
                                        <Search size={14} /> Reputation
                                    </h3>
                                    <button onClick={() => setRepModal(null)} className="text-ink-400 hover:text-ink-50 transition-colors p-1">
                                        <X size={18} />
                                    </button>
                                </div>
                                <div className="p-6">
                                    <div className="flex items-center justify-between gap-3 mb-4">
                                        <h4 className="font-display text-lg text-ink-50 truncate">{repModal.name}</h4>
                                        <span className={`font-mono text-xs uppercase px-3 py-1 rounded-full border shrink-0 ${repModal.reputation_score >= 80 ? 'bg-green-500/10 text-green-400 border-green-500/30' : repModal.reputation_score >= 50 ? 'bg-fuchsia-500/10 text-fuchsia-400 border-fuchsia-500/30' : 'bg-red-500/10 text-red-400 border-red-500/30'}`}>
                                            Score: {repModal.reputation_score}
                                        </span>
                                    </div>
                                    <div className="bg-white/5 rounded-lg border border-white/10 p-4">
                                        <p className="text-sm text-ink-200 leading-relaxed">
                                            {repModal.reputation_explanation || 'No detailed reputation notes yet for this venue.'}
                                        </p>
                                    </div>
                                </div>
                                <div className="p-4 border-t border-white/10">
                                    <Btn variant="ghost" className="w-full" onClick={() => setRepModal(null)}>Got it</Btn>
                                </div>
                            </motion.div>
                        </motion.div>
                    )}
                </AnimatePresence>,
                document.body
            )}
        </div>
    );
}
