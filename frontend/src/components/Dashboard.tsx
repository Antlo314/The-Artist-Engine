import { useEffect, useState } from 'react';
import {
    Activity, Mic2, Radar as RadarIcon, Send, ShieldAlert, FileWarning,
    ArrowRight, Radio, CheckCircle2, Trash2, Wifi, WifiOff, Cpu
} from 'lucide-react';
import { useEngine, relTime, type Lead, type LeadStage } from '../lib/engineState';
import { PageHeader } from './ui/Shell';

interface DashboardProps {
    onNavigate: (view: string) => void;
}

const STAT_DEFS = [
    { key: 'mastersCompleted', label: 'Masters', icon: Mic2, accent: '#22d3ee' },
    { key: 'venuesScouted', label: 'Venues Scouted', icon: RadarIcon, accent: '#fb923c' },
    { key: 'pitchesDrafted', label: 'Pitches', icon: Send, accent: '#f4f4f5' },
    { key: 'contractsScanned', label: 'Contracts Scanned', icon: FileWarning, accent: '#a78bfa' },
    { key: 'threatsFlagged', label: 'Threats Flagged', icon: ShieldAlert, accent: '#ef4444' },
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
    audio: '#22d3ee', radar: '#fb923c', zion: '#a78bfa', shark: '#f4f4f5', ember: '#ef4444',
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
        <div className="space-y-6">

            <PageHeader
                view="dashboard"
                accent="#ef4444"
                module="Command Center"
                title="Dashboard"
                desc="Your operation at a glance — every number here is something you actually did."
            />

            {/* ===== Stat row (real counters) ===== */}
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-4">
                {STAT_DEFS.map((s) => {
                    const value = stats[s.key];
                    const Icon = s.icon;
                    const empty = value === 0;
                    const isThreat = s.key === 'threatsFlagged' && value > 0;
                    return (
                        <div key={s.key} className="glass-obsidian glass-obsidian-hover p-5 rounded-xl relative overflow-hidden">
                            <div className="flex items-center justify-between mb-3">
                                <Icon size={18} style={{ color: isThreat ? '#ef4444' : s.accent }} />
                                <span className="h-1.5 w-1.5 rounded-full" style={{ backgroundColor: empty ? '#333' : s.accent }} />
                            </div>
                            <div
                                className="font-display font-bold text-3xl tracking-tight tabular-nums"
                                style={{ color: empty ? '#55555e' : isThreat ? '#f87171' : '#f4f4f5' }}
                            >
                                {empty ? '—' : value.toLocaleString()}
                            </div>
                            <div className="font-mono text-[10px] tracking-[0.2em] uppercase text-ink-400 mt-1">{s.label}</div>
                            {empty && <div className="font-mono text-[9px] text-ink-700 mt-0.5">awaiting first op</div>}
                        </div>
                    );
                })}
            </div>

            {/* ===== Pipeline + Activity ===== */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">

                {/* Booking Pipeline board */}
                <div className="lg:col-span-2 glass-obsidian rounded-xl p-5 border border-white/10">
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
                        <div className="flex flex-col items-center justify-center text-center py-14 border border-dashed border-white/10 rounded-lg">
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
                </div>

                {/* Activity feed */}
                <div className="glass-obsidian rounded-xl p-5 border border-white/10 flex flex-col">
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
                        <div className="space-y-3 overflow-y-auto max-h-[360px] pr-1 custom-scrollbar">
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
                </div>
            </div>

            {/* ===== System telemetry strip ===== */}
            <div className="glass-obsidian rounded-xl px-5 py-4 border border-white/10 flex flex-col sm:flex-row items-start sm:items-center gap-4 sm:gap-8">
                <TelemetryItem
                    icon={sys === 'online' ? Wifi : WifiOff}
                    label="Engine Core"
                    value={sys === 'checking' ? 'Checking…' : sys === 'online' ? 'Online' : 'Offline — cold start likely, retry in 60s'}
                    tone={sys === 'online' ? 'good' : sys === 'offline' ? 'bad' : 'idle'}
                />
                <TelemetryItem
                    icon={Cpu}
                    label="AI Core"
                    value={sys !== 'online' ? '—' : keyVerified ? 'Key verified' : 'Key missing'}
                    tone={sys !== 'online' ? 'idle' : keyVerified ? 'good' : 'bad'}
                />
                <TelemetryItem
                    icon={RadarIcon}
                    label="Ticketmaster Grid"
                    value={tmLive ? 'Live — verified venues returned' : 'Standby'}
                    tone={tmLive ? 'good' : 'idle'}
                />
            </div>
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

function TelemetryItem({
    icon: Icon, label, value, tone,
}: { icon: any; label: string; value: string; tone: 'good' | 'bad' | 'idle' }) {
    const color = tone === 'good' ? '#4ade80' : tone === 'bad' ? '#f87171' : '#8a8a93';
    return (
        <div className="flex items-center gap-3">
            <Icon size={16} style={{ color }} />
            <div>
                <div className="font-mono text-[9px] tracking-widest uppercase text-ink-400">{label}</div>
                <div className="text-[13px]" style={{ color }}>{value}</div>
            </div>
        </div>
    );
}
