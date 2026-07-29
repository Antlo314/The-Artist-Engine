/**
 * Free extras — small tools that cost nothing and need no AI:
 * tour routing (OpenStreetMap) and a release checklist.
 * Offer comparison moved to Pitch & Deals, where the rest of the
 * negotiation tools live.
 */
import { useEffect, useState } from 'react';
import { Check, Clock, Map, ListChecks } from 'lucide-react';
import { apiJson } from '../lib/api';
import { downloadText } from '../lib/exportUtils';
import { Panel, Btn, Field, inputCls } from './ui/Shell';
import HelpTip from './ui/HelpTip';

export default function FreeOps() {
    const [stack, setStack] = useState<any | null>(null);
    const [cities, setCities] = useState('Atlanta, Nashville, Charlotte, Richmond');
    const [route, setRoute] = useState<any | null>(null);
    const [routeBusy, setRouteBusy] = useState(false);
    const [checklist, setChecklist] = useState<Array<{ id: string; label: string }>>([]);
    const [checks, setChecks] = useState<Record<string, boolean>>(() => {
        try {
            return JSON.parse(localStorage.getItem('source_release_checks') || '{}');
        } catch {
            return {};
        }
    });
    const [err, setErr] = useState<string | null>(null);

    useEffect(() => {
        apiJson('/api/free/stack')
            .then(setStack)
            .catch(() => setStack(null));
        apiJson('/api/free/release-checklist')
            .then((d) => setChecklist(d.items || []))
            .catch(() => setChecklist([]));
    }, []);

    useEffect(() => {
        try {
            localStorage.setItem('source_release_checks', JSON.stringify(checks));
        } catch {
            /* storage full — not fatal */
        }
    }, [checks]);

    const runRoute = async () => {
        setRouteBusy(true);
        setErr(null);
        try {
            const list = cities.split(/[,;\n]/).map((s) => s.trim()).filter(Boolean);
            const data = await apiJson('/api/free/tour-route', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ cities: list }),
            });
            setRoute(data);
        } catch (e: any) {
            setErr(e?.message || 'Could not work out a route. Check the city spellings.');
        } finally {
            setRouteBusy(false);
        }
    };

    const doneCount = Object.values(checks).filter(Boolean).length;

    return (
        <div className="space-y-4 md:space-y-6">
            <div>
                <h2 className="font-display text-2xl text-ink-50 tracking-tight">Free extras</h2>
                <p className="text-sm text-ink-400 mt-1 max-w-2xl leading-relaxed">
                    Small tools that cost nothing to run and never touch your daily limits.
                </p>
            </div>

            {err && (
                <p className="text-sm text-red-400 border border-red-500/30 bg-red-500/10 rounded-lg px-3 py-2">{err}</p>
            )}

            <div className="grid lg:grid-cols-2 gap-4">
                <Panel title="Plan a tour route" sub="Puts your cities in the order that drives least" accent="var(--color-radar)">
                    <div className="flex items-center gap-2 mb-3 text-ink-400">
                        <Map size={14} />
                        <span className="text-[11px]">Type the cities you want to play — order doesn't matter.</span>
                        <HelpTip text="We look up each city, then order them so the total drive is as short as we can make it. Distances are straight-line estimates, not turn-by-turn directions." />
                    </div>
                    <Field label="Cities">
                        <textarea
                            value={cities}
                            onChange={(e) => setCities(e.target.value)}
                            className={`${inputCls()} min-h-[88px]`}
                            placeholder="Atlanta, Nashville, Charlotte"
                        />
                    </Field>
                    <div className="mt-3 flex gap-2">
                        <Btn variant="accent" accent="var(--color-radar)" onClick={runRoute} disabled={routeBusy}>
                            {routeBusy ? 'Working it out…' : 'Put them in order'}
                        </Btn>
                        {route?.route && (
                            <Btn
                                variant="ghost"
                                onClick={() =>
                                    downloadText(
                                        'tour-route.txt',
                                        [
                                            `Route: ${(route.route || []).join(' → ')}`,
                                            `Total: ${route.total_mi} mi (${route.total_km} km)`,
                                            '',
                                            ...(route.legs_km || []).map((l: any) => `${l.from} → ${l.to}: ${l.mi} mi`),
                                            '',
                                            'Distances from OpenStreetMap.',
                                        ].join('\n')
                                    )
                                }
                            >
                                Download
                            </Btn>
                        )}
                    </div>
                    {route?.route && (
                        <div className="mt-4 space-y-2">
                            <p className="text-sm text-ink-50 font-medium">{(route.route as string[]).join(' → ')}</p>
                            <p className="text-[12px] text-ink-400">
                                About {route.total_mi} miles ({route.total_km} km) of driving in total.
                            </p>
                        </div>
                    )}
                </Panel>

                <Panel title="Release checklist" sub="The steps most artists forget" accent="var(--color-audio)">
                    <div className="flex items-center gap-2 mb-3 text-ink-400">
                        <ListChecks size={14} />
                        <span className="text-[11px]">
                            {doneCount} of {checklist.length || '—'} done — saved on this device
                        </span>
                    </div>
                    <ul className="space-y-2 max-h-64 overflow-y-auto custom-scrollbar">
                        {checklist.map((item) => (
                            <li key={item.id}>
                                <label className="flex items-start gap-2.5 text-sm cursor-pointer py-1">
                                    <input
                                        type="checkbox"
                                        className="mt-1"
                                        checked={!!checks[item.id]}
                                        onChange={(e) => setChecks((c) => ({ ...c, [item.id]: e.target.checked }))}
                                    />
                                    <span className={checks[item.id] ? 'text-ink-400 line-through' : 'text-ink-200'}>
                                        {item.label}
                                    </span>
                                </label>
                            </li>
                        ))}
                        {checklist.length === 0 && (
                            <li className="text-xs text-ink-400">Loading the checklist…</li>
                        )}
                    </ul>
                </Panel>
            </div>

            {stack && (
                <div className="grid md:grid-cols-2 gap-4">
                    <Panel title="What's working today" sub="Ready to use right now" accent="var(--color-ember-500)">
                        <ul className="space-y-2 max-h-60 overflow-y-auto custom-scrollbar">
                            {(stack?.live_free_now || []).map((item: any) => (
                                <li key={item.id} className="flex gap-2 text-sm">
                                    <Check size={14} className="text-ember-500 shrink-0 mt-0.5" />
                                    <span className="text-ink-200">{item.name}</span>
                                </li>
                            ))}
                        </ul>
                    </Panel>

                    <Panel title="Coming later" sub="On the roadmap, not built yet" accent="var(--color-ink-500)">
                        <ul className="space-y-2 max-h-60 overflow-y-auto custom-scrollbar">
                            {(stack?.coming_soon_paid_or_heavy || []).map((item: any) => (
                                <li key={item.id} className="flex gap-2 text-sm">
                                    <Clock size={14} className="text-ink-400 shrink-0 mt-0.5" />
                                    <span className="text-ink-300">{item.name}</span>
                                </li>
                            ))}
                        </ul>
                    </Panel>
                </div>
            )}
        </div>
    );
}
