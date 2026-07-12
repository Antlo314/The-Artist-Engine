/**
 * Free-max tools for investor demo: stack inventory, tour route, release checklist, offer compare.
 * Paid features only appear as Coming Soon hints.
 */
import { useEffect, useState } from 'react';
import { Check, Clock, Map, ListChecks, Scale, Sparkles } from 'lucide-react';
import { apiJson } from '../lib/api';
import { downloadText } from '../lib/exportUtils';
import { Panel, Btn, Field, inputCls } from './ui/Shell';

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
    const [offerA, setOfferA] = useState('');
    const [offerB, setOfferB] = useState('');
    const [compare, setCompare] = useState<any | null>(null);
    const [cmpBusy, setCmpBusy] = useState(false);
    const [err, setErr] = useState<string | null>(null);

    useEffect(() => {
        apiJson('/api/free/stack')
            .then(setStack)
            .catch(() =>
                setStack({
                    live_free_now: [],
                    coming_soon_paid_or_heavy: [],
                    philosophy: 'Free stack loads when API is online.',
                })
            );
        apiJson('/api/free/release-checklist')
            .then((d) => setChecklist(d.items || []))
            .catch(() => setChecklist([]));
    }, []);

    useEffect(() => {
        try {
            localStorage.setItem('source_release_checks', JSON.stringify(checks));
        } catch {
            /* ignore */
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
            setErr(e?.message || 'Tour route failed');
        } finally {
            setRouteBusy(false);
        }
    };

    const runCompare = async () => {
        setCmpBusy(true);
        setErr(null);
        try {
            const data = await apiJson('/api/free/offer-compare', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ offer_a: offerA, offer_b: offerB }),
            });
            setCompare(data);
        } catch (e: any) {
            setErr(e?.message || 'Compare failed');
        } finally {
            setCmpBusy(false);
        }
    };

    return (
        <div className="space-y-4 md:space-y-6">
            <div>
                <p className="font-mono text-[10px] tracking-[0.3em] uppercase text-ember-500 mb-1">Investor free stack</p>
                <h2 className="font-display text-2xl text-ink-50 tracking-tight">Max free. Hint the rest.</h2>
                <p className="text-sm text-ink-400 mt-1 max-w-2xl leading-relaxed">
                    {stack?.philosophy ||
                        'Everything below is free/open or free-tier. Paid rails are roadmap only for the demo.'}
                </p>
            </div>

            {err && (
                <p className="text-sm text-red-400 border border-red-500/30 bg-red-500/10 rounded-lg px-3 py-2">{err}</p>
            )}

            <div className="grid md:grid-cols-2 gap-4">
                <Panel title="Live free now" sub="Shipping on this demo" accent="var(--color-ember-500)" hud>
                    <ul className="space-y-2 max-h-72 overflow-y-auto">
                        {(stack?.live_free_now || []).map((item: any) => (
                            <li key={item.id} className="flex gap-2 text-sm">
                                <Check size={14} className="text-ember-500 shrink-0 mt-0.5" />
                                <div>
                                    <div className="text-ink-50 font-medium">{item.name}</div>
                                    <div className="font-mono text-[10px] text-ink-400 tracking-wide">{item.stack}</div>
                                </div>
                            </li>
                        ))}
                        {!stack?.live_free_now?.length && (
                            <li className="text-xs text-ink-400">Loading free inventory…</li>
                        )}
                    </ul>
                </Panel>

                <Panel title="Coming later" sub="Not free / needs partners — demo hints only" accent="#8a8a93">
                    <ul className="space-y-2 max-h-72 overflow-y-auto">
                        {(stack?.coming_soon_paid_or_heavy || []).map((item: any) => (
                            <li key={item.id} className="flex gap-2 text-sm">
                                <Clock size={14} className="text-ink-400 shrink-0 mt-0.5" />
                                <div>
                                    <div className="text-ink-200 font-medium">{item.name}</div>
                                    <div className="font-mono text-[10px] text-ink-400 tracking-wide">{item.why}</div>
                                    <span className="inline-block mt-1 font-mono text-[9px] uppercase tracking-widest px-2 py-0.5 rounded-full border border-white/10 text-ink-400">
                                        Coming soon
                                    </span>
                                </div>
                            </li>
                        ))}
                    </ul>
                </Panel>
            </div>

            <div className="grid lg:grid-cols-2 gap-4">
                <Panel title="Tour route (free OSM)" sub="Nearest-neighbor · OpenStreetMap" accent="var(--color-radar)">
                    <div className="flex items-center gap-2 mb-3 text-ink-400">
                        <Map size={14} />
                        <span className="font-mono text-[10px] tracking-widest uppercase">No Google Maps bill</span>
                    </div>
                    <Field label="Cities (comma-separated)">
                        <textarea
                            value={cities}
                            onChange={(e) => setCities(e.target.value)}
                            className={`${inputCls()} min-h-[88px]`}
                            placeholder="City A, City B, City C"
                        />
                    </Field>
                    <div className="mt-3 flex gap-2">
                        <Btn variant="accent" accent="var(--color-radar)" onClick={runRoute} disabled={routeBusy}>
                            {routeBusy ? 'Routing…' : 'Optimize order'}
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
                                            ...(route.legs_km || []).map(
                                                (l: any) => `${l.from} → ${l.to}: ${l.mi} mi`
                                            ),
                                            '',
                                            'Source: OpenStreetMap Nominatim (free)',
                                        ].join('\n')
                                    )
                                }
                            >
                                Export
                            </Btn>
                        )}
                    </div>
                    {route?.route && (
                        <div className="mt-4 space-y-2">
                            <p className="text-sm text-ink-50 font-medium">
                                {(route.route as string[]).join(' → ')}
                            </p>
                            <p className="font-mono text-[11px] text-ink-400">
                                ~{route.total_mi} mi · {route.total_km} km · {route.source}
                            </p>
                        </div>
                    )}
                </Panel>

                <Panel title="Release checklist" sub="Local · free" accent="var(--color-audio)">
                    <div className="flex items-center gap-2 mb-3 text-ink-400">
                        <ListChecks size={14} />
                        <span className="font-mono text-[10px] tracking-widest uppercase">
                            {Object.values(checks).filter(Boolean).length}/{checklist.length || '—'} done
                        </span>
                    </div>
                    <ul className="space-y-2 max-h-64 overflow-y-auto">
                        {checklist.map((item) => (
                            <li key={item.id}>
                                <label className="flex items-start gap-2 text-sm cursor-pointer">
                                    <input
                                        type="checkbox"
                                        className="mt-1"
                                        checked={!!checks[item.id]}
                                        onChange={(e) =>
                                            setChecks((c) => ({ ...c, [item.id]: e.target.checked }))
                                        }
                                    />
                                    <span className={checks[item.id] ? 'text-ink-400 line-through' : 'text-ink-200'}>
                                        {item.label}
                                    </span>
                                </label>
                            </li>
                        ))}
                    </ul>
                </Panel>
            </div>

            <Panel title="Offer compare (free)" sub="Dual linter + optional Gemini table" accent="var(--color-zion)">
                <div className="flex items-center gap-2 mb-3 text-ink-400">
                    <Scale size={14} />
                    <span className="font-mono text-[10px] tracking-widest uppercase">Not legal advice</span>
                </div>
                <div className="grid md:grid-cols-2 gap-3">
                    <Field label="Offer A">
                        <textarea
                            value={offerA}
                            onChange={(e) => setOfferA(e.target.value)}
                            className={`${inputCls()} min-h-[120px]`}
                            placeholder="Paste offer / deal text A"
                        />
                    </Field>
                    <Field label="Offer B">
                        <textarea
                            value={offerB}
                            onChange={(e) => setOfferB(e.target.value)}
                            className={`${inputCls()} min-h-[120px]`}
                            placeholder="Paste offer / deal text B"
                        />
                    </Field>
                </div>
                <div className="mt-3">
                    <Btn variant="accent" accent="var(--color-zion)" onClick={runCompare} disabled={cmpBusy}>
                        {cmpBusy ? 'Comparing…' : 'Compare offers'}
                    </Btn>
                </div>
                {compare && (
                    <div className="mt-4 space-y-3 text-sm">
                        <p className="text-ink-50 font-medium">{compare.winner_hint}</p>
                        <div className="grid md:grid-cols-2 gap-3">
                            <div className="border border-white/10 rounded-lg p-3">
                                <div className="font-mono text-[10px] uppercase text-ink-400 mb-1">A integrity hint</div>
                                <div className="text-2xl font-display text-ink-50">
                                    {compare.offer_a?.integrity_hint ?? '—'}
                                </div>
                                <div className="text-xs text-ink-400 mt-1">
                                    {compare.offer_a?.linter?.counts?.total ?? 0} rule hits
                                </div>
                            </div>
                            <div className="border border-white/10 rounded-lg p-3">
                                <div className="font-mono text-[10px] uppercase text-ink-400 mb-1">B integrity hint</div>
                                <div className="text-2xl font-display text-ink-50">
                                    {compare.offer_b?.integrity_hint ?? '—'}
                                </div>
                                <div className="text-xs text-ink-400 mt-1">
                                    {compare.offer_b?.linter?.counts?.total ?? 0} rule hits
                                </div>
                            </div>
                        </div>
                        {compare.ai_compare && (
                            <div className="border border-white/10 rounded-lg p-3 bg-white/[0.03]">
                                <div className="flex items-center gap-2 font-mono text-[10px] uppercase text-ink-400 mb-2">
                                    <Sparkles size={12} /> AI table (free tier)
                                </div>
                                <p className="text-ink-200 text-xs leading-relaxed mb-2">{compare.ai_compare.reason}</p>
                                <p className="font-mono text-[11px] text-ember-500">Prefer: {compare.ai_compare.prefer}</p>
                            </div>
                        )}
                        <p className="text-[10px] text-ink-400 leading-relaxed">{compare.disclaimer}</p>
                    </div>
                )}
            </Panel>
        </div>
    );
}
