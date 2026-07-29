/**
 * Roster — your contacts, your to-do list, and your press kit.
 * Backed by /api/crm/* (leads + tasks) and /api/epk (MusicBrainz press kit).
 * Falls back to the local pipeline when signed out or offline.
 */
import { useCallback, useEffect, useMemo, useState } from 'react';
import {
    Users, Plus, CheckCircle2, Circle, Newspaper, Download,
    Search, ArrowRight, Archive, ListTodo,
} from 'lucide-react';
import { useEngine, type LeadStage } from '../lib/engineState';
import { apiJson, getStoredToken } from '../lib/api';
import { downloadCsv, downloadText } from '../lib/exportUtils';
import { PageHeader, Panel, Field, Btn, Segmented, EmptyState, inputCls, StepHint } from './ui/Shell';
import Walkthrough from './ui/Walkthrough';
import CoachPrompt from './ui/CoachPrompt';
import HelpTip from './ui/HelpTip';
import { shouldOpenViewTour } from '../lib/onboarding';

const ACCENT = 'var(--color-ember-500)';

type Tab = 'contacts' | 'tasks' | 'presskit';

const TAB_OPTIONS: { value: Tab; label: string }[] = [
    { value: 'contacts', label: 'Contacts' },
    { value: 'tasks', label: 'To-do list' },
    { value: 'presskit', label: 'Press kit' },
];

/** Plain-language names for the four pipeline stages. */
const STAGE_LABEL: Record<LeadStage, string> = {
    scouted: 'Found',
    pitched: 'Pitched',
    negotiating: 'Talking',
    booked: 'Booked',
    dead: 'Archived',
};

const NEXT_STAGE: Record<LeadStage, LeadStage | null> = {
    scouted: 'pitched',
    pitched: 'negotiating',
    negotiating: 'booked',
    booked: null,
    dead: null,
};

export default function Roster({ profile }: { profile: any }) {
    const [tab, setTab] = useState<Tab>('contacts');
    const [showTour, setShowTour] = useState(() => shouldOpenViewTour('roster'));

    return (
        <div className="space-y-4 md:space-y-8">
            <PageHeader
                view="profile"
                accent={ACCENT}
                module="EVERYONE YOU WORK WITH"
                title="Roster"
                desc="Your contacts, what you owe them, and the press kit you send them."
            />

            <StepHint steps={['Keep contacts current', 'Track what is due', 'Share your press kit']} accent={ACCENT} />

            <Segmented options={TAB_OPTIONS} value={tab} onChange={setTab} accent={ACCENT} />

            {tab === 'contacts' && <ContactsTab />}
            {tab === 'tasks' && <TasksTab />}
            {tab === 'presskit' && <PressKitTab profile={profile} />}

            <Walkthrough
                tourId="roster"
                open={showTour}
                accent={ACCENT}
                onClose={() => setShowTour(false)}
                primaryLabel="Open my contacts"
                steps={[
                    {
                        title: 'Everyone in one place',
                        body: 'Every venue you find becomes a contact here. Add the people you meet in person too — a booker’s name on a napkin belongs in your roster, not your pocket.',
                        bullets: ['Four simple stages: Found → Pitched → Talking → Booked', 'Archive the ones that go quiet'],
                    },
                    {
                        title: 'Never drop a follow-up',
                        body: 'The to-do list holds the small promises that win gigs — "call The Echo back Thursday". Tie a task to a contact so you remember why.',
                        bullets: ['Tick tasks off as you go', 'Done tasks stay visible so you can see your week'],
                    },
                    {
                        title: 'Your press kit, built for you',
                        body: 'Type your artist name and the Engine pulls your public releases and cover art into a one-pager you can send to any booker.',
                        bullets: ['Free — sourced from MusicBrainz', 'Download it as text and paste it anywhere'],
                    },
                ]}
            />
        </div>
    );
}

/* ============================ Contacts ============================ */

function ContactsTab() {
    const { state, record } = useEngine();
    const { pipeline } = state;
    const [query, setQuery] = useState('');
    const [showArchived, setShowArchived] = useState(false);
    const [adding, setAdding] = useState(false);
    const [newName, setNewName] = useState('');
    const [newCity, setNewCity] = useState('');
    const [busy, setBusy] = useState(false);
    const [err, setErr] = useState<string | null>(null);
    const [cap, setCap] = useState<{ count: number; max: number } | null>(null);

    useEffect(() => {
        if (!getStoredToken()) return;
        apiJson<any>('/api/crm/state')
            .then((d) => {
                if (d?.status === 'success') setCap({ count: d.lead_count ?? 0, max: d.max_leads ?? 0 });
            })
            .catch(() => null);
    }, [pipeline.length]);

    const filtered = useMemo(() => {
        const q = query.trim().toLowerCase();
        return pipeline
            .filter((l) => (showArchived ? l.stage === 'dead' : l.stage !== 'dead'))
            .filter((l) => !q || `${l.venueName} ${l.city}`.toLowerCase().includes(q));
    }, [pipeline, query, showArchived]);

    const addContact = async () => {
        const name = newName.trim();
        if (!name) {
            setErr('Give the contact a name.');
            return;
        }
        setBusy(true);
        setErr(null);
        try {
            record.addLead(name, newCity.trim());
            setNewName('');
            setNewCity('');
            setAdding(false);
        } catch (e: any) {
            setErr(e?.message || 'Could not add that contact.');
        } finally {
            setBusy(false);
        }
    };

    return (
        <div className="space-y-4">
            <CoachPrompt id="roster-contacts-tip" accent={ACCENT} title="Keep it honest">
                Move a contact along the moment something happens. The numbers on Home are only useful because they
                reflect what really happened.
            </CoachPrompt>

            <Panel
                title="Your contacts"
                sub={cap ? `${cap.count} of ${cap.max === 99999 ? 'unlimited' : cap.max} saved` : 'Venues and people you are working'}
                accent={ACCENT}
                actions={
                    <div className="flex flex-wrap gap-2">
                        <Btn variant="ghost" size="sm" onClick={() => setAdding((v) => !v)}>
                            <Plus size={13} /> Add contact
                        </Btn>
                        <Btn
                            variant="ghost"
                            size="sm"
                            onClick={() =>
                                downloadCsv(
                                    'roster-contacts.csv',
                                    filtered.map((l) => ({
                                        name: l.venueName,
                                        city: l.city,
                                        stage: STAGE_LABEL[l.stage],
                                        reputation: l.reputationScore ?? '',
                                        payout: l.payoutModel ?? '',
                                        estimated_gross: l.grossPotential ?? '',
                                    }))
                                )
                            }
                        >
                            <Download size={13} /> Export
                        </Btn>
                    </div>
                }
            >
                {adding && (
                    <div className="mb-4 grid grid-cols-1 sm:grid-cols-[1fr_1fr_auto] gap-3 items-end rounded-xl border border-white/10 bg-white/[0.03] p-3">
                        <Field label="Name">
                            <input
                                value={newName}
                                onChange={(e) => setNewName(e.target.value)}
                                placeholder="The Echo Room"
                                className={`${inputCls()} min-h-[44px]`}
                            />
                        </Field>
                        <Field label="City">
                            <input
                                value={newCity}
                                onChange={(e) => setNewCity(e.target.value)}
                                placeholder="Nashville"
                                className={`${inputCls()} min-h-[44px]`}
                            />
                        </Field>
                        <Btn variant="accent" accent={ACCENT} onClick={addContact} disabled={busy} className="min-h-[44px]">
                            {busy ? 'Saving…' : 'Save'}
                        </Btn>
                    </div>
                )}

                <div className="flex flex-wrap items-center gap-3 mb-4">
                    <div className="relative flex-1 min-w-[180px]">
                        <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-ink-500 pointer-events-none" />
                        <input
                            value={query}
                            onChange={(e) => setQuery(e.target.value)}
                            placeholder="Search by name or city"
                            className={`${inputCls()} pl-9 min-h-[44px]`}
                        />
                    </div>
                    <button
                        type="button"
                        onClick={() => setShowArchived((v) => !v)}
                        className={`px-4 py-2 rounded-full text-[12px] transition-colors border min-h-[44px] ${
                            showArchived
                                ? 'bg-white/10 text-ink-50 border-white/25'
                                : 'border-white/10 text-ink-400 hover:text-ink-50'
                        }`}
                    >
                        <Archive size={13} className="inline mr-1.5 -mt-0.5" />
                        {showArchived ? 'Showing archived' : 'Show archived'}
                    </button>
                    <HelpTip text="Archived contacts stay in your account but no longer count as active leads. Nothing is deleted." />
                </div>

                {err && <p className="text-sm text-red-400 mb-3">{err}</p>}

                {filtered.length === 0 ? (
                    <EmptyState
                        icon={<Users size={36} />}
                        title={showArchived ? 'Nothing archived' : 'No contacts yet'}
                        hint={
                            showArchived
                                ? 'Contacts you archive will appear here.'
                                : 'Find venues in Find Gigs, or add someone you already know with the button above.'
                        }
                    />
                ) : (
                    <div className="grid grid-cols-1 lg:grid-cols-2 gap-3">
                        {filtered.map((l) => {
                            const next = NEXT_STAGE[l.stage];
                            return (
                                <div key={l.id} className="rounded-xl border border-white/10 bg-white/[0.03] p-4">
                                    <div className="flex items-start justify-between gap-3">
                                        <div className="min-w-0">
                                            <p className="text-sm font-medium text-ink-50 leading-tight break-words">{l.venueName}</p>
                                            <p className="text-[11px] text-ink-400 mt-0.5">{l.city || 'City not set'}</p>
                                        </div>
                                        <span className="shrink-0 text-[10px] uppercase tracking-wide px-2 py-1 rounded-full border border-white/15 text-ink-300">
                                            {STAGE_LABEL[l.stage]}
                                        </span>
                                    </div>

                                    <div className="mt-3 flex flex-wrap items-center gap-2 text-[11px] text-ink-400">
                                        {typeof l.reputationScore === 'number' && <span>Reputation {l.reputationScore}/100</span>}
                                        {l.payoutModel && <span>· {l.payoutModel}</span>}
                                        {typeof l.grossPotential === 'number' && l.grossPotential > 0 && (
                                            <span className="text-emerald-400">· ~${l.grossPotential.toLocaleString()} potential</span>
                                        )}
                                    </div>

                                    <div className="mt-3 flex items-center gap-2">
                                        {next ? (
                                            <button
                                                type="button"
                                                onClick={() => record.moveLead(l.id, next)}
                                                className="flex-1 inline-flex items-center justify-center gap-1.5 text-[12px] text-ember-400 border border-ember-500/30 hover:bg-ember-500/10 rounded-lg px-3 py-2 transition-colors min-h-[40px]"
                                            >
                                                Mark as {STAGE_LABEL[next].toLowerCase()} <ArrowRight size={12} />
                                            </button>
                                        ) : (
                                            <span className="flex-1 inline-flex items-center justify-center gap-1.5 text-[12px] text-emerald-400 min-h-[40px]">
                                                <CheckCircle2 size={13} /> {STAGE_LABEL[l.stage]}
                                            </span>
                                        )}
                                        {l.stage !== 'dead' && (
                                            <button
                                                type="button"
                                                onClick={() => record.moveLead(l.id, 'dead')}
                                                title="Archive this contact"
                                                aria-label={`Archive ${l.venueName}`}
                                                className="w-10 h-10 rounded-lg border border-white/10 flex items-center justify-center text-ink-500 hover:text-red-400 transition-colors"
                                            >
                                                <Archive size={14} />
                                            </button>
                                        )}
                                    </div>
                                </div>
                            );
                        })}
                    </div>
                )}
            </Panel>
        </div>
    );
}

/* ============================ To-do list ============================ */

type Task = { id: string; lead_id?: string | null; body: string; due_at?: number | null; done: boolean; created_at?: number };

function TasksTab() {
    const { state } = useEngine();
    const [tasks, setTasks] = useState<Task[]>([]);
    const [loading, setLoading] = useState(true);
    const [body, setBody] = useState('');
    const [leadId, setLeadId] = useState('');
    const [busy, setBusy] = useState(false);
    const [err, setErr] = useState<string | null>(null);

    const signedIn = !!getStoredToken();

    const load = useCallback(async () => {
        if (!signedIn) {
            setLoading(false);
            return;
        }
        try {
            const d = await apiJson<any>('/api/crm/tasks');
            setTasks(Array.isArray(d?.tasks) ? d.tasks : []);
        } catch {
            setErr('Could not load your list. Check your connection.');
        } finally {
            setLoading(false);
        }
    }, [signedIn]);

    useEffect(() => {
        load();
    }, [load]);

    const addTask = async () => {
        const text = body.trim();
        if (!text) return;
        setBusy(true);
        setErr(null);
        try {
            await apiJson('/api/crm/tasks', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ body: text, lead_id: leadId || null }),
            });
            setBody('');
            setLeadId('');
            await load();
        } catch (e: any) {
            setErr(e?.message || 'Could not add that task.');
        } finally {
            setBusy(false);
        }
    };

    const toggle = async (t: Task) => {
        setTasks((prev) => prev.map((x) => (x.id === t.id ? { ...x, done: !x.done } : x)));
        try {
            await apiJson(`/api/crm/tasks/${t.id}?done=${!t.done}`, { method: 'PATCH' });
        } catch {
            setTasks((prev) => prev.map((x) => (x.id === t.id ? { ...x, done: t.done } : x)));
        }
    };

    const leadName = (id?: string | null) =>
        id ? state.pipeline.find((l) => l.id === id)?.venueName : undefined;

    const open = tasks.filter((t) => !t.done);
    const done = tasks.filter((t) => t.done);

    if (!signedIn) {
        return (
            <Panel title="To-do list" accent={ACCENT}>
                <EmptyState icon={<ListTodo size={36} />} title="Sign in to keep a list" hint="Your to-do list is saved to your account so it follows you between devices." />
            </Panel>
        );
    }

    return (
        <div className="space-y-4">
            <Panel title="What's next" sub={`${open.length} open · ${done.length} done`} accent={ACCENT}>
                <div className="grid grid-cols-1 sm:grid-cols-[1fr_auto_auto] gap-3 items-end mb-5">
                    <Field label="Add something to do">
                        <input
                            value={body}
                            onChange={(e) => setBody(e.target.value)}
                            onKeyDown={(e) => {
                                if (e.key === 'Enter') addTask();
                            }}
                            placeholder="Follow up with The Echo on Friday"
                            className={`${inputCls()} min-h-[44px]`}
                        />
                    </Field>
                    <Field label="About (optional)">
                        <select value={leadId} onChange={(e) => setLeadId(e.target.value)} className={`${inputCls()} min-h-[44px]`}>
                            <option value="">No one in particular</option>
                            {state.pipeline
                                .filter((l) => l.stage !== 'dead')
                                .map((l) => (
                                    <option key={l.id} value={l.id}>
                                        {l.venueName}
                                    </option>
                                ))}
                        </select>
                    </Field>
                    <Btn variant="accent" accent={ACCENT} onClick={addTask} disabled={busy} className="min-h-[44px]">
                        <Plus size={14} /> Add
                    </Btn>
                </div>

                {err && <p className="text-sm text-red-400 mb-3">{err}</p>}

                {loading ? (
                    <p className="text-sm text-ink-400">Loading your list…</p>
                ) : tasks.length === 0 ? (
                    <EmptyState
                        icon={<ListTodo size={36} />}
                        title="Nothing on your list"
                        hint="Add the small follow-ups that actually win gigs — they are easy to forget and expensive to miss."
                    />
                ) : (
                    <ul className="space-y-2">
                        {[...open, ...done].map((t) => (
                            <li
                                key={t.id}
                                className="flex items-start gap-3 rounded-lg border border-white/10 bg-white/[0.03] px-3 py-3"
                            >
                                <button
                                    type="button"
                                    onClick={() => toggle(t)}
                                    aria-label={t.done ? 'Mark as not done' : 'Mark as done'}
                                    className="shrink-0 mt-0.5 text-ink-400 hover:text-emerald-400 transition-colors"
                                >
                                    {t.done ? <CheckCircle2 size={18} className="text-emerald-400" /> : <Circle size={18} />}
                                </button>
                                <div className="min-w-0 flex-1">
                                    <p className={`text-sm leading-snug ${t.done ? 'text-ink-500 line-through' : 'text-ink-50'}`}>
                                        {t.body}
                                    </p>
                                    {leadName(t.lead_id) && (
                                        <p className="text-[11px] text-ink-400 mt-0.5">About {leadName(t.lead_id)}</p>
                                    )}
                                </div>
                            </li>
                        ))}
                    </ul>
                )}
            </Panel>
        </div>
    );
}

/* ============================ Press kit ============================ */

function PressKitTab({ profile }: { profile: any }) {
    const [name, setName] = useState(profile?.artistAlias || '');
    const [pack, setPack] = useState<any | null>(() => {
        try {
            return JSON.parse(localStorage.getItem('source_epk_cache') || 'null');
        } catch {
            return null;
        }
    });
    const [busy, setBusy] = useState(false);
    const [err, setErr] = useState<string | null>(null);

    const build = async () => {
        const q = name.trim();
        if (!q) {
            setErr('Type your artist name first.');
            return;
        }
        setBusy(true);
        setErr(null);
        try {
            const data = await apiJson<any>(`/api/epk?q=${encodeURIComponent(q)}`);
            setPack(data);
            try {
                localStorage.setItem('source_epk_cache', JSON.stringify(data));
            } catch {
                /* storage full — not fatal */
            }
        } catch (e: any) {
            setErr(e?.message || 'Could not build your press kit. Try again in a moment.');
        } finally {
            setBusy(false);
        }
    };

    const releases: any[] = pack?.releases || pack?.release_groups || [];

    const exportText = () => {
        const lines = [
            `PRESS KIT — ${pack?.artist?.name || name}`,
            '',
            profile?.bio || profile?.oneLiner || '',
            '',
            profile?.homeCity ? `Based in: ${profile.homeCity}` : '',
            profile?.primaryGenre ? `Genre: ${profile.primaryGenre}` : '',
            '',
            'LISTEN',
            profile?.spotifyUrl ? `Spotify: ${profile.spotifyUrl}` : '',
            profile?.appleUrl ? `Apple Music: ${profile.appleUrl}` : '',
            profile?.youtubeUrl ? `YouTube: ${profile.youtubeUrl}` : '',
            '',
            'RELEASES',
            ...releases.slice(0, 20).map((r: any) => `· ${r.title}${r.date ? ` (${String(r.date).slice(0, 4)})` : ''}`),
            '',
            'CONTACT',
            profile?.agentName ? `${profile.agentName}` : '',
            profile?.agentEmail || '',
            profile?.agentPhone || '',
        ].filter((l) => l !== '');
        downloadText(`press-kit-${(pack?.artist?.name || name).replace(/\s+/g, '_')}.txt`, lines.join('\n'));
    };

    return (
        <div className="space-y-4">
            <CoachPrompt id="roster-epk-tip" accent={ACCENT} title="What is a press kit?">
                It is the one-pager bookers and press ask for: who you are, what you have released, and how to reach
                you. The Engine builds the skeleton from public release data — you add the personality in Profile.
            </CoachPrompt>

            <Panel title="Build your press kit" sub="Free — pulls from MusicBrainz, the public music database" accent={ACCENT}>
                <div className="grid grid-cols-1 sm:grid-cols-[1fr_auto] gap-3 items-end">
                    <Field label="Your artist name" hint="Spell it the way it appears on your releases.">
                        <input
                            value={name}
                            onChange={(e) => setName(e.target.value)}
                            placeholder="Your artist or band name"
                            className={`${inputCls()} min-h-[44px]`}
                        />
                    </Field>
                    <Btn variant="accent" accent={ACCENT} onClick={build} disabled={busy} className="min-h-[44px]">
                        <Newspaper size={14} /> {busy ? 'Building…' : 'Build press kit'}
                    </Btn>
                </div>
                {err && <p className="text-sm text-red-400 mt-3">{err}</p>}
            </Panel>

            {pack && (
                <Panel
                    title={pack?.artist?.name || name}
                    sub={`${releases.length} release${releases.length === 1 ? '' : 's'} found`}
                    accent={ACCENT}
                    actions={
                        <Btn variant="ghost" size="sm" onClick={exportText}>
                            <Download size={13} /> Download
                        </Btn>
                    }
                >
                    {(profile?.bio || profile?.oneLiner) && (
                        <p className="text-sm text-ink-200 leading-relaxed mb-4">{profile.bio || profile.oneLiner}</p>
                    )}

                    {releases.length === 0 ? (
                        <EmptyState
                            icon={<Newspaper size={32} />}
                            title="No releases found under that name"
                            hint="Your music may not be listed on MusicBrainz yet. It is free to add at musicbrainz.org — then try again."
                        />
                    ) : (
                        <ul className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                            {releases.slice(0, 24).map((r: any, i: number) => (
                                <li key={r.id || i} className="flex items-center gap-3 rounded-lg border border-white/10 bg-white/[0.03] p-2.5">
                                    {r.cover_art_url ? (
                                        <img src={r.cover_art_url} alt="" className="w-11 h-11 rounded object-cover shrink-0" loading="lazy" />
                                    ) : (
                                        <div className="w-11 h-11 rounded bg-white/5 border border-white/10 shrink-0" />
                                    )}
                                    <div className="min-w-0">
                                        <p className="text-[13px] text-ink-50 truncate">{r.title}</p>
                                        <p className="text-[11px] text-ink-400">
                                            {r.date ? String(r.date).slice(0, 4) : 'Year unknown'}
                                            {r.type ? ` · ${r.type}` : ''}
                                        </p>
                                    </div>
                                </li>
                            ))}
                        </ul>
                    )}

                    {pack.disclaimer && <p className="text-[10px] text-ink-400 leading-relaxed mt-4">{pack.disclaimer}</p>}
                </Panel>
            )}

            {!pack && !busy && (
                <EmptyState
                    icon={<Newspaper size={36} />}
                    title="No press kit yet"
                    hint="Type your artist name above and press Build — it takes a couple of seconds."
                />
            )}
        </div>
    );
}
