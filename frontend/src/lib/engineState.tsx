import { createContext, useContext, useEffect, useReducer, type ReactNode } from 'react';
import { apiJson, getStoredToken } from './api';

/* ============================================================
   Engine v2 — central telemetry store.
   Every number the dashboard shows is the trace of a real user
   action recorded here. React Context + useReducer, persisted to
   localStorage. Zero external deps.
   ============================================================ */

export type LeadStage = 'scouted' | 'pitched' | 'negotiating' | 'booked' | 'dead';
export type ActivityKind = 'master' | 'scout' | 'pitch' | 'scan' | 'pipeline' | 'system';
export type Accent = 'audio' | 'radar' | 'zion' | 'shark' | 'ember';

export interface Lead {
    id: string;
    venueName: string;
    city: string;
    stage: LeadStage;
    reputationScore?: number;
    payoutModel?: string;
    grossPotential?: number;
    verifiedLive?: boolean;
    addedAt: number;
    updatedAt: number;
}

export interface ActivityEvent {
    id: string;
    ts: number;
    kind: ActivityKind;
    label: string;
    accent?: Accent;
}

export interface EngineStats {
    mastersCompleted: number;
    venuesScouted: number;
    pitchesDrafted: number;
    contractsScanned: number;
    threatsFlagged: number;
}

export interface EngineState {
    version: 1;
    stats: EngineStats;
    pipeline: Lead[];
    activity: ActivityEvent[];
}

const STORAGE_KEY = 'engine_state_v1';
const ACTIVITY_CAP = 50;

const initialState: EngineState = {
    version: 1,
    stats: {
        mastersCompleted: 0,
        venuesScouted: 0,
        pitchesDrafted: 0,
        contractsScanned: 0,
        threatsFlagged: 0,
    },
    pipeline: [],
    activity: [],
};

function loadState(): EngineState {
    try {
        const raw = localStorage.getItem(STORAGE_KEY);
        if (!raw) return initialState;
        const parsed = JSON.parse(raw);
        if (parsed?.version !== 1) return initialState;
        // Merge defensively so a partial/old blob can't crash the app.
        return {
            version: 1,
            stats: { ...initialState.stats, ...(parsed.stats || {}) },
            pipeline: Array.isArray(parsed.pipeline) ? parsed.pipeline : [],
            activity: Array.isArray(parsed.activity) ? parsed.activity.slice(0, ACTIVITY_CAP) : [],
        };
    } catch {
        return initialState;
    }
}

/* ---- Actions ---- */
type Action =
    | { type: 'MASTER'; filename: string; format: string }
    | { type: 'SCOUT'; city: string; genre: string; venues: any[] }
    | { type: 'PITCH'; venueName: string; outreach: string }
    | { type: 'SCAN'; flagCount: number; integrityScore?: number }
    | { type: 'MOVE_LEAD'; id: string; stage: LeadStage }
    | { type: 'CLEAR_ACTIVITY' }
    | { type: 'HYDRATE'; pipeline?: Lead[]; activity?: ActivityEvent[] }
    | { type: 'IMPORT_PIPELINE'; pipeline: Lead[] };

// Deterministic id without a uuid dependency. `now` is passed in so the
// reducer stays pure-ish and testable; collisions are avoided with a suffix.
function makeId(prefix: string, now: number, extra = '') {
    return `${prefix}-${now}-${extra}`.replace(/\s+/g, '_');
}

function pushActivity(state: EngineState, ev: ActivityEvent): ActivityEvent[] {
    return [ev, ...state.activity].slice(0, ACTIVITY_CAP);
}

function reducer(state: EngineState, action: Action): EngineState {
    const now = Date.now();
    switch (action.type) {
        case 'MASTER': {
            return {
                ...state,
                stats: { ...state.stats, mastersCompleted: state.stats.mastersCompleted + 1 },
                activity: pushActivity(state, {
                    id: makeId('act', now, 'master'),
                    ts: now,
                    kind: 'master',
                    label: `Mastered ${action.filename} (${action.format.toUpperCase()} · −1.0 dBTP)`,
                    accent: 'audio',
                }),
            };
        }
        case 'SCOUT': {
            const existing = new Set(state.pipeline.map((l) => l.venueName.toLowerCase()));
            const fresh: Lead[] = [];
            for (const v of action.venues) {
                const name = v?.name;
                if (!name || existing.has(String(name).toLowerCase())) continue;
                existing.add(String(name).toLowerCase());
                fresh.push({
                    id: makeId('lead', now, name),
                    venueName: name,
                    city: v.city || action.city,
                    stage: 'scouted',
                    reputationScore: numOr(v.reputation_score),
                    payoutModel: v.payout_model,
                    grossPotential: numOr(v.gross_potential_usd),
                    verifiedLive: !!v.verified_live,
                    addedAt: now,
                    updatedAt: now,
                });
            }
            return {
                ...state,
                stats: { ...state.stats, venuesScouted: state.stats.venuesScouted + action.venues.length },
                pipeline: [...fresh, ...state.pipeline],
                activity: pushActivity(state, {
                    id: makeId('act', now, 'scout'),
                    ts: now,
                    kind: 'scout',
                    label: `Scouted ${action.venues.length} venues — ${action.genre} in ${action.city}`,
                    accent: 'radar',
                }),
            };
        }
        case 'PITCH': {
            const pipeline = state.pipeline.map((l) =>
                l.venueName.toLowerCase() === action.venueName.toLowerCase() && l.stage === 'scouted'
                    ? { ...l, stage: 'pitched' as LeadStage, updatedAt: now }
                    : l
            );
            return {
                ...state,
                stats: { ...state.stats, pitchesDrafted: state.stats.pitchesDrafted + 1 },
                pipeline,
                activity: pushActivity(state, {
                    id: makeId('act', now, 'pitch'),
                    ts: now,
                    kind: 'pitch',
                    label: `Pitched ${action.venueName} via ${action.outreach}`,
                    accent: 'shark',
                }),
            };
        }
        case 'SCAN': {
            return {
                ...state,
                stats: {
                    ...state.stats,
                    contractsScanned: state.stats.contractsScanned + 1,
                    threatsFlagged: state.stats.threatsFlagged + action.flagCount,
                },
                activity: pushActivity(state, {
                    id: makeId('act', now, 'scan'),
                    ts: now,
                    kind: 'scan',
                    label:
                        `Scanned contract — ${action.flagCount} threat${action.flagCount === 1 ? '' : 's'} flagged` +
                        (action.integrityScore != null ? ` · integrity ${action.integrityScore}/100` : ''),
                    accent: 'zion',
                }),
            };
        }
        case 'MOVE_LEAD': {
            let moved: Lead | undefined;
            const pipeline = state.pipeline.map((l) => {
                if (l.id === action.id) {
                    moved = { ...l, stage: action.stage, updatedAt: now };
                    return moved;
                }
                return l;
            });
            if (!moved) return state;
            return {
                ...state,
                pipeline,
                activity: pushActivity(state, {
                    id: makeId('act', now, 'pipe'),
                    ts: now,
                    kind: 'pipeline',
                    label: `${moved.venueName} → ${action.stage}`,
                    accent: 'ember',
                }),
            };
        }
        case 'CLEAR_ACTIVITY':
            return { ...state, activity: [] };
        case 'HYDRATE': {
            // Server CRM wins when it has more leads; otherwise keep local.
            const serverPipe = action.pipeline || [];
            const pipeline =
                serverPipe.length >= state.pipeline.length
                    ? serverPipe
                    : mergeLeads(state.pipeline, serverPipe);
            const activity =
                (action.activity && action.activity.length)
                    ? action.activity
                    : state.activity;
            return { ...state, pipeline, activity };
        }
        case 'IMPORT_PIPELINE':
            return { ...state, pipeline: mergeLeads(state.pipeline, action.pipeline) };
        default:
            return state;
    }
}

function mergeLeads(a: Lead[], b: Lead[]): Lead[] {
    const map = new Map<string, Lead>();
    for (const l of [...a, ...b]) {
        const key = (l.venueName || '').toLowerCase();
        if (!key) continue;
        const prev = map.get(key);
        if (!prev || (l.updatedAt || 0) >= (prev.updatedAt || 0)) map.set(key, l);
    }
    return Array.from(map.values()).sort((x, y) => (y.updatedAt || 0) - (x.updatedAt || 0));
}

function numOr(v: any): number | undefined {
    const n = Number(v);
    return Number.isFinite(n) ? n : undefined;
}

/* ---- Context ---- */
interface EngineContextValue {
    state: EngineState;
    record: {
        master: (filename: string, format: string) => void;
        scout: (city: string, genre: string, venues: any[]) => void;
        pitch: (venueName: string, outreach: string) => void;
        scan: (flagCount: number, integrityScore?: number) => void;
        moveLead: (id: string, stage: LeadStage) => void;
        clearActivity: () => void;
    };
}

const EngineContext = createContext<EngineContextValue | null>(null);

export function EngineProvider({ children }: { children: ReactNode }) {
    const [state, dispatch] = useReducer(reducer, undefined, loadState);

    useEffect(() => {
        try {
            localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
        } catch {
            /* quota / private mode — non-fatal */
        }
    }, [state]);

    // Hydrate pipeline from server CRM (multi-device) when signed in
    useEffect(() => {
        if (!getStoredToken()) return;
        let cancelled = false;
        (async () => {
            try {
                const data = await apiJson<any>('/api/crm/state');
                if (cancelled || data?.status !== 'success') return;
                const pipeline: Lead[] = (data.leads || []).map((l: any) => ({
                    id: l.id,
                    venueName: l.venueName,
                    city: l.city || '',
                    stage: l.stage || 'scouted',
                    reputationScore: l.reputationScore,
                    payoutModel: l.payoutModel,
                    grossPotential: l.grossPotential,
                    verifiedLive: !!l.verifiedLive,
                    addedAt: l.addedAt || Date.now(),
                    updatedAt: l.updatedAt || Date.now(),
                }));
                const activity: ActivityEvent[] = (data.activity || []).map((a: any) => ({
                    id: a.id,
                    ts: a.ts || Date.now(),
                    kind: a.kind || 'system',
                    label: a.label,
                    accent: a.accent,
                }));
                dispatch({ type: 'HYDRATE', pipeline, activity });
                // Push local-only leads up once
                if (pipeline.length === 0) {
                    const local = loadState().pipeline;
                    if (local.length) {
                        await apiJson('/api/crm/leads/bulk', {
                            method: 'POST',
                            headers: { 'Content-Type': 'application/json' },
                            body: JSON.stringify({ leads: local }),
                        }).catch(() => null);
                    }
                }
            } catch {
                /* offline / backend cold — keep localStorage */
            }
        })();
        return () => {
            cancelled = true;
        };
    }, []);

    const record: EngineContextValue['record'] = {
        master: (filename, format) => dispatch({ type: 'MASTER', filename, format }),
        scout: (city, genre, venues) => {
            dispatch({ type: 'SCOUT', city, genre, venues });
            // Best-effort CRM sync
            if (getStoredToken()) {
                const now = Date.now();
                const leads = (venues || []).map((v: any) => ({
                    venueName: v.name,
                    city: v.city || city,
                    stage: 'scouted',
                    reputationScore: Number(v.reputation_score) || undefined,
                    payoutModel: v.payout_model,
                    grossPotential: Number(v.gross_potential_usd) || undefined,
                    verifiedLive: !!v.verified_live,
                    addedAt: now,
                    updatedAt: now,
                }));
                apiJson('/api/crm/leads/bulk', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ leads }),
                }).catch(() => null);
            }
        },
        pitch: (venueName, outreach) => {
            dispatch({ type: 'PITCH', venueName, outreach });
            if (getStoredToken()) {
                apiJson('/api/crm/pitches', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ venueName, outreach }),
                }).catch(() => null);
            }
        },
        scan: (flagCount, integrityScore) => dispatch({ type: 'SCAN', flagCount, integrityScore }),
        moveLead: (id, stage) => {
            dispatch({ type: 'MOVE_LEAD', id, stage });
            if (getStoredToken()) {
                apiJson(`/api/crm/leads/${id}`, {
                    method: 'PATCH',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ stage }),
                }).catch(() => null);
            }
        },
        clearActivity: () => dispatch({ type: 'CLEAR_ACTIVITY' }),
    };

    return <EngineContext.Provider value={{ state, record }}>{children}</EngineContext.Provider>;
}

export function useEngine(): EngineContextValue {
    const ctx = useContext(EngineContext);
    if (!ctx) throw new Error('useEngine must be used within <EngineProvider>');
    return ctx;
}

/** Relative time helper for the activity feed. */
export function relTime(ts: number, now: number = Date.now()): string {
    const s = Math.max(0, Math.floor((now - ts) / 1000));
    if (s < 60) return `${s}s ago`;
    const m = Math.floor(s / 60);
    if (m < 60) return `${m}m ago`;
    const h = Math.floor(m / 60);
    if (h < 24) return `${h}h ago`;
    return `${Math.floor(h / 24)}d ago`;
}
