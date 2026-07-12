import { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import {
    Activity, Mic2, Radar as RadarIcon, Send, ShieldAlert, FileWarning,
    ArrowRight, Radio, CheckCircle2, Trash2, Cpu
} from 'lucide-react';
import { useEngine, relTime, type Lead, type LeadStage } from '../lib/engineState';
import { PageHeader, Btn } from './ui/Shell';
import { apiJson, getStoredToken } from '../lib/api';
import { downloadCsv, downloadJson } from '../lib/exportUtils';
import FreeOps from './FreeOps';

interface DashboardProps {
    onNavigate: (view: string) => void;
}

const container = { hidden: {}, show: { transition: { staggerChildren: 0.04 } } };
const tile = {
    hidden: { opacity: 0, y: 16, scale: 0.98 },
    show: { opacity: 1, y: 0, scale: 1, transition: { type: 'spring' as const, stiffness: 320, damping: 28 } },
};

const STAT_DEFS = [
    { key: 'mastersCompleted', label: 'Masters', icon: Mic2, accent: 'var(--color-audio)' },
    { key: 'venuesScouted', label: 'Venues Scouted', icon: RadarIcon, accent: 'var(--color-radar)' },
    { key: 'pitchesDrafted', label: 'Pitches', icon: Send, accent: 'var(--color-shark)' },
    { key: 'contractsScanned', label: 'Contracts Scanned', icon: FileWarning, accent: 'var(--color-zion)' },
    { key: 'threatsFlagged', label: 'Threats Flagged', icon: ShieldAlert, accent: 'var(--color-ember-500)' },
] as const;

const STAGES: { key: LeadStage; label: string }[] = [
    { key: 'scouted', label: 'Scouted' },
    { key: 'pitched', label: 'Pitched' },
    { key: 'negotiating', label: 'Negotiating' },
    { key: 'booked', label: 'Booked' },
];

const NEXT: Record<LeadStage, LeadStage | null> = {
    scouted: 'pitched',
    pitched: 'negotiating',
    negotiating: 'booked',
    booked: null,
    dead: null,
};

const ACCENT_HEX: Record<string, string> = {
    audio: 'var(--color-audio)',
    radar: 'var(--color-radar)',
    zion: 'var(--color-zion)',
    shark: 'var(--color-shark)',
    ember: 'var(--color-ember-500)',
};

export default function Dashboard({ onNavigate }: DashboardProps) {
    const { state, record } = useEngine();
    const { stats, pipeline, activity } = state;

    // Live system telemetry (real backend status; handles Render cold starts).
    const [sys, setSys] = useState<'checking' | 'online' | 'offline'>('checking');
    const [keyVerified, setKeyVerified] = useState<boolean>(false);
    useEffect(() => {
        let alive = true;
        const ctrl = new AbortController();
        const t = setTimeout(() => ctrl.abort(), 8000);
        fetch('/api/system-status', { signal: ctrl.signal })
            .then((r) => r.json())
            .then((d) => { if (alive) { setSys('online'); setKeyVerified(!!d.key_verified); } })
            .catch(() => { if (alive) setSys('offline'); })
            .finally(() => clearTimeout(t));
        return () => { alive = false; ctrl.abort(); clearTimeout(t); };
    }, []);

    const activeLeads = pipeline.filter((l) => l.stage !== 'dead');
    const deadCount = pipeline.length - activeLeads.length;
    const bookedCount = pipeline.filter((l) => l.stage === 'booked').length;
    const tmLive = pipeline.some((l) => l.verifiedLive);
    const hasAnyActivity = activity.length > 0;

    return (
        <div className="space-y-4 md:space-y-6">

            <PageHeader
                view="dashboard"
                accent="var(--color-ember-500)"
                module="COMMAND CENTER"
                title="Dashboard"
                desc="Live ops board — real numbers only. Gigs ~8s · pitches ~2s · masters ~35s. CRM syncs to server when online."
                speedHint="live"
            />

            {/* Quick actions — always useful; emphasized on small screens */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                {[
                    { id: 'radar', label: 'Find Gigs', sub: 'Scan live venues · ~8s', accent: 'var(--color-radar)' },
                    { id: 'legal', label: 'Scan a contract', sub: 'Flag predatory clauses · ~3s', accent: 'var(--color-zion)' },
                ].map((a) => (
                    <button
                        key={a.id}
                        type="button"
                        onClick={() => onNavigate(a.id)}
                        className="rounded-2xl border border-white/10 bg-white/[0.06] px-4 py-4 text-left active:scale-[0.99] transition-transform min-h-[72px]"
                    >
                        <div className="font-display text-base font-semibold text-ink-50">{a.label}</div>
                        <div className="text-xs mt-1" style={{ color: a.accent }}>{a.sub}</div>
                    </button>
                ))}
            </div>

            <div className="flex flex-wrap gap-2">
                <Btn
                    variant="ghost"
                    size="sm"
                    onClick={() =>
                        downloadCsv(
                            'source-pipeline.csv',
                            pipeline.map((l) => ({
                                venue: l.venueName,
                                city: l.city,
                                stage: l.stage,
                                reputation: l.reputationScore ?? '',
                                payout: l.payoutModel ?? '',
                                gross: l.grossPotential ?? '',
                                verified: l.verifiedLive ? 'yes' : 'no',
                            }))
                        )
                    }
                >
                    Export pipeline CSV
                </Btn>
                <Btn
                    variant="ghost"
                    size="sm"
                    onClick={async () => {
                        if (getStoredToken()) {
                            try {
                                const data = await apiJson('/api/crm/export');
                                downloadJson(`source-crm-${Date.now()}.json`, data);
                                return;
                            } catch {
                                /* fall through local */
                            }
                        }
                        downloadJson(`source-local-${Date.now()}.json`, { pipeline, activity, stats });
                    }}
                >
                    Export JSON
                </Btn>
                <label className="inline-flex">
                    <input
                        type="file"
                        accept="application/json,.json"
                        className="hidden"
                        onChange={async (e) => {
                            const f = e.target.files?.[0];
                            if (!f) return;
                            try {
                                const text = await f.text();
                                const data = JSON.parse(text);
                                if (getStoredToken()) {
                                    await apiJson('/api/crm/import', {
                                        method: 'POST',
                                        headers: { 'Content-Type': 'application/json' },
                                        body: JSON.stringify({
                                            leads: data.leads || data.pipeline || [],
                                            pitches: data.pitches || [],
                                        }),
                                    });
                                    alert('Imported to server CRM. Refresh to hydrate.');
                                } else {
                                    alert('Sign in to import into server CRM.');
                                }
                            } catch (err: any) {
                                alert(err?.message || 'Import failed');
                            }
                            e.target.value = '';
                        }}
                    />
                    <span className="inline-flex items-center justify-center gap-2 rounded-full font-display font-medium transition-colors px-4 py-2 text-xs border border-white/10 hover:border-white/25 text-ink-200 hover:text-ink-50 cursor-pointer">
                        Import JSON
                    </span>
                </label>
            </div>

            {/* ===== Animated bento grid ===== */}
            <motion.div
                variants={container}
                initial="hidden"
                animate="show"
                className="grid grid-cols-2 lg:grid-cols-6 gap-2.5 sm:gap-4 auto-rows-[minmax(88px,auto)] sm:auto-rows-[minmax(104px,auto)]"
            >
                {/* Row 1 — 5 stat tiles */}
                {STAT_DEFS.map((s) => {
                    const value = stats[s.key];
                    const Icon = s.icon;
                    const empty = value === 0;
                    const isThreat = s.key === 'threatsFlagged' && value > 0;
                    return (
                        <motion.div
                            key={s.key}
                            variants={tile}
                            whileHover={{ y: -4 }}
                            className="glass-obsidian sheen rounded-xl sm:rounded-2xl p-3.5 sm:p-5 flex flex-col justify-between min-h-[88px]"
                        >
                            <div className="flex items-center justify-between">
                                <Icon size={16} style={{ color: isThreat ? 'var(--color-ember-500)' : 'var(--color-ink-400)' }} />
                                <span className="h-1.5 w-1.5 rounded-full" style={{ backgroundColor: empty ? 'var(--color-ink-700)' : isThreat ? 'var(--color-ember-500)' : 'var(--color-ink-400)' }} />
                            </div>
                            <div>
                                <div
                                    className="font-display font-bold text-2xl sm:text-3xl tracking-tight tabular-nums leading-none"
                                    style={{ color: empty ? 'var(--color-ink-700)' : isThreat ? 'var(--color-ember-400)' : 'var(--color-ink-50)' }}
                                >
                                    {empty ? '—' : value.toLocaleString()}
                                </div>
                                <div className="text-[11px] sm:font-mono sm:text-[10px] sm:tracking-[0.2em] sm:uppercase text-ink-400 mt-1 sm:mt-1.5 leading-snug">
                                    {s.label}
                                </div>
                            </div>
                        </motion.div>
                    );
                })}

                {/* Row 1 — System tile */}
                <motion.div
                    variants={tile}
                    whileHover={{ y: -4 }}
                    className="glass-obsidian sheen hud-corners rounded-2xl p-5 flex flex-col justify-between"
                >
                    <div className="flex items-center gap-2">
                        <span
                            className={`h-2 w-2 rounded-full ${sys === 'online' ? 'dot-breathe' : ''}`}
                            style={{ backgroundColor: sys === 'online' ? '#16a34a' : sys === 'offline' ? 'var(--color-ember-400)' : 'var(--color-ink-400)' }}
                        />
                        <span className="font-mono text-[10px] tracking-[0.2em] uppercase text-ink-400">System</span>
                    </div>
                    <div className="space-y-1.5">
                        <div className="text-sm font-medium" style={{ color: sys === 'online' ? 'var(--color-ink-50)' : sys === 'offline' ? 'var(--color-ember-400)' : 'var(--color-ink-400)' }}>
                            {sys === 'checking' ? 'Checking…' : sys === 'online' ? 'Engine online' : 'Offline'}
                        </div>
                        <div className="flex items-center gap-1.5 font-mono text-[9px] tracking-wide text-ink-400">
                            <Cpu size={10} /> AI {sys !== 'online' ? '—' : keyVerified ? 'ready' : 'no key'}
                        </div>
                        <div className="flex items-center gap-1.5 font-mono text-[9px] tracking-wide" style={{ color: tmLive ? '#4ade80' : '#8a8a93' }}>
                            <RadarIcon size={10} /> Ticketmaster {tmLive ? 'live' : 'standby'}
                        </div>
                    </div>
                </motion.div>

                {/* Rows 2-3 — Pipeline hero */}
                <motion.div
                    variants={tile}
                    className="col-span-2 lg:col-span-4 lg:row-span-2 glass-obsidian sheen hud-corners rounded-2xl p-5 flex flex-col"
                >
                    <div className="flex items-center justify-between mb-5">
                        <div>
                            <h3 className="font-display text-lg text-ink-50 tracking-wide">Booking Pipeline</h3>
                            <p className="font-mono text-[10px] text-ink-400 tracking-widest uppercase mt-0.5">
                                {activeLeads.length} active · {bookedCount} booked{deadCount > 0 ? ` · ${deadCount} archived` : ''}
                            </p>
                        </div>
                        <RadarIcon size={16} className="text-orange-400" />
                    </div>

                    {activeLeads.length === 0 ? (
                        <div className="flex-1 flex flex-col items-center justify-center text-center py-14 border border-dashed border-white/10 rounded-lg">
                            <RadarIcon size={30} className="text-ink-700 mb-4" />
                            <p className="text-ink-400 text-sm mb-1">Pipeline empty</p>
                            <p className="font-mono text-[10px] text-ink-700 tracking-widest uppercase mb-5">Run a scout to populate real leads</p>
                            <button
                                onClick={() => onNavigate('radar')}
                                className="group flex items-center gap-2 rounded-full bg-orange-500/90 hover:bg-orange-500 transition-colors px-5 py-2.5 font-display font-medium text-sm text-ink-950"
                            >
                                Open Gig Radar
                                <ArrowRight size={15} className="group-hover:translate-x-1 transition-transform" />
                            </button>
                        </div>
                    ) : (
                        <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
                            {STAGES.map((col) => {
                                const leads = activeLeads.filter((l) => l.stage === col.key);
                                return (
                                    <div key={col.key} className="flex flex-col">
                                        <div className="flex items-center justify-between mb-2 px-1">
                                            <span className="font-mono text-[9px] tracking-widest uppercase text-ink-400">{col.label}</span>
                                            <span className="font-mono text-[9px] text-ink-700 tabular-nums">{leads.length}</span>
                                        </div>
                                        <div className="space-y-2 min-h-[40px]">
                                            {leads.map((l) => (
                                                <LeadCard key={l.id} lead={l} onMove={record.moveLead} />
                                            ))}
                                        </div>
                                    </div>
                                );
                            })}
                        </div>
                    )}
                </motion.div>

                {/* Rows 2-3 — Activity feed */}
                <motion.div
                    variants={tile}
                    className="col-span-2 lg:row-span-2 glass-obsidian sheen rounded-2xl p-5 flex flex-col"
                >
                    <div className="flex items-center justify-between mb-4">
                        <div className="flex items-center gap-2">
                            <Activity size={15} className="text-red-500" />
                            <h3 className="font-display text-lg text-ink-50 tracking-wide">Activity</h3>
                        </div>
                        {hasAnyActivity && (
                            <button
                                onClick={record.clearActivity}
                                className="font-mono text-[9px] tracking-widest uppercase text-ink-700 hover:text-ink-400 transition-colors"
                            >
                                Clear
                            </button>
                        )}
                    </div>

                    {!hasAnyActivity ? (
                        <div className="flex-1 flex flex-col items-center justify-center text-center py-10">
                            <Radio size={24} className="text-ink-700 mb-3" />
                            <p className="font-mono text-[10px] text-ink-700 tracking-widest uppercase">No operations logged yet</p>
                        </div>
                    ) : (
                        <div className="space-y-3 overflow-y-auto max-h-[420px] pr-1 custom-scrollbar">
                            {activity.map((ev) => (
                                <div key={ev.id} className="flex gap-3">
                                    <span
                                        className="mt-1.5 h-2 w-2 rounded-full shrink-0"
                                        style={{ backgroundColor: ACCENT_HEX[ev.accent || 'ember'] }}
                                    />
                                    <div className="min-w-0">
                                        <p className="text-sm text-ink-200 leading-snug break-words">{ev.label}</p>
                                        <p className="font-mono text-[9px] text-ink-700 tracking-widest uppercase mt-0.5">
                                            {relTime(ev.ts)}
                                        </p>
                                    </div>
                                </div>
                            ))}
                        </div>
                    )}
                </motion.div>
            </motion.div>

            {/* Investor free-max tools + coming-soon hints */}
            <FreeOps />
        </div>
    );
}

function LeadCard({ lead, onMove }: { lead: Lead; onMove: (id: string, stage: LeadStage) => void }) {
    const next = NEXT[lead.stage];
    return (
        <div className="bg-ink-900 border border-white/10 rounded-lg p-3 group">
            <div className="flex items-start justify-between gap-2">
                <span className="text-[13px] text-ink-50 font-medium leading-tight break-words">{lead.venueName}</span>
                {lead.verifiedLive && (
                    <span className="shrink-0 flex items-center gap-1 font-mono text-[8px] tracking-widest uppercase text-emerald-400 border border-emerald-500/30 rounded px-1 py-0.5">
                        <CheckCircle2 size={9} /> Live
                    </span>
                )}
            </div>
            <div className="mt-1 font-mono text-[9px] text-ink-400 tracking-wide truncate">{lead.city}</div>
            <div className="mt-2 flex items-center gap-2 flex-wrap">
                {typeof lead.reputationScore === 'number' && (
                    <span className="font-mono text-[9px] text-ink-200 bg-white/5 rounded px-1.5 py-0.5 tabular-nums">
                        REP {lead.reputationScore}
                    </span>
                )}
                {typeof lead.grossPotential === 'number' && lead.grossPotential > 0 && (
                    <span className="font-mono text-[9px] text-emerald-400/80 tabular-nums">
                        ${lead.grossPotential.toLocaleString()}
                    </span>
                )}
            </div>
            <div className="mt-3 flex items-center gap-2 opacity-60 group-hover:opacity-100 transition-opacity">
                {next ? (
                    <button
                        onClick={() => onMove(lead.id, next)}
                        className="flex-1 font-mono text-[9px] tracking-widest uppercase text-orange-300 border border-orange-500/30 hover:bg-orange-500/10 rounded px-2 py-1 transition-colors"
                    >
                        → {next}
                    </button>
                ) : (
                    <span className="flex-1 flex items-center justify-center gap-1 font-mono text-[9px] tracking-widest uppercase text-emerald-400">
                        <CheckCircle2 size={10} /> Booked
                    </span>
                )}
                <button
                    onClick={() => onMove(lead.id, 'dead')}
                    title="Archive lead"
                    className="text-ink-700 hover:text-red-500 transition-colors p-1"
                >
                    <Trash2 size={12} />
                </button>
            </div>
        </div>
    );
}

