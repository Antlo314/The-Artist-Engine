import { useState } from 'react';
import { Link } from 'react-router-dom';
import { apiJson } from '../../lib/api';
import { useAuth } from '../../lib/auth';
import { PageHeader, Panel, Btn, Field, inputCls } from '../ui/Shell';
import CoachPrompt from '../ui/CoachPrompt';
import HelpTip from '../ui/HelpTip';

const ACCENT = 'var(--color-ember-500)';

/** The heavy tools that burn a daily allowance, in the user's words. */
const QUOTA_ROWS: { key: string; label: string; hint: string }[] = [
    { key: 'master', label: 'Tracks mastered', hint: 'Each finished master counts once.' },
    { key: 'scout', label: 'Gig searches', hint: 'Each search of a city and genre counts once.' },
    { key: 'pitch', label: 'Pitches written', hint: 'Each email, call script, or DM counts once.' },
    { key: 'contract', label: 'Contract reviews', hint: 'The instant rule check is free and unlimited.' },
];

const CREDIT_PACKS = [
    { id: 'boost', label: 'Boost', credits: 100, price: 9, blurb: 'A busy weekend' },
    { id: 'session', label: 'Session', credits: 400, price: 29, blurb: 'Finishing a release' },
    { id: 'tour', label: 'Tour', credits: 1500, price: 89, blurb: 'Booking a run of shows' },
    { id: 'label_pack', label: 'Label', credits: 5000, price: 249, blurb: 'Working several artists' },
];

export default function BillingPanel() {
    const { me, refreshMe } = useAuth();
    const [code, setCode] = useState('');
    const [msg, setMsg] = useState<string | null>(null);
    const [err, setErr] = useState<string | null>(null);
    const [busy, setBusy] = useState(false);

    const credits = me?.credits?.balance ?? 0;
    const plan = me?.plan;
    const promo = me?.promo;
    const usage: any = me?.usage || {};

    const redeem = async () => {
        setBusy(true);
        setErr(null);
        setMsg(null);
        try {
            const res = await apiJson<any>('/api/promo/redeem', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ code }),
            });
            setMsg(res.message || 'Code applied — your limits went up.');
            await refreshMe();
        } catch (e: any) {
            setErr(e?.message || "That code didn't work. Check the spelling and try again.");
        } finally {
            setBusy(false);
        }
    };

    const buyPack = async (pack_id: string) => {
        setBusy(true);
        setErr(null);
        try {
            const res = await apiJson<any>('/api/billing/checkout', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ mode: 'payment', pack_id }),
            });
            if (res.url && !res.mock) {
                window.location.href = res.url;
                return;
            }
            setMsg(res.message || 'Credits added to your account.');
            await refreshMe();
        } catch (e: any) {
            setErr(e?.message || "That purchase didn't go through. Nothing was charged.");
        } finally {
            setBusy(false);
        }
    };

    return (
        <div className="space-y-4 md:space-y-8">
            <PageHeader
                view="profile"
                accent={ACCENT}
                module="WHAT YOU GET AND WHAT'S LEFT"
                title="Plan & Credits"
                desc="Your plan sets how much you can do each day. Credits are a top-up for busy weeks."
            />

            <CoachPrompt id="plan-limits-tip" accent={ACCENT} title="About daily limits">
                Limits reset every day. Hitting one is never a charge — it just means come back tomorrow, spend
                credits, or move up a plan.
            </CoachPrompt>

            {/* Snapshot */}
            <div className="grid sm:grid-cols-3 gap-3">
                <div className="glass-obsidian border border-white/10 rounded-xl p-5">
                    <p className="text-[11px] text-ink-400">You're on</p>
                    <p className="font-display text-2xl mt-1 text-ink-50">{plan?.name || me?.plan_id || 'Spark'}</p>
                    {promo && (
                        <span className="inline-block mt-2 text-[10px] px-2 py-0.5 rounded-full border border-ember-500/40 bg-ember-500/10 text-ember-400">
                            Promo active — limits ×{promo.multiplier}
                        </span>
                    )}
                </div>
                <div className="glass-obsidian border border-white/10 rounded-xl p-5">
                    <p className="text-[11px] text-ink-400 flex items-center gap-1.5">
                        Credits
                        <HelpTip text="Credits are spent only when you run out of your daily allowance. They never expire." />
                    </p>
                    <p className="font-display text-2xl tabular-nums mt-1 text-ember-400">{credits}</p>
                    {(me?.credits?.period_grant ?? 0) > 0 && (
                        <p className="text-[11px] text-ink-400 mt-1">
                            {me?.credits?.period_grant} included with your plan each month
                        </p>
                    )}
                </div>
                <div className="glass-obsidian border border-white/10 rounded-xl p-5">
                    <p className="text-[11px] text-ink-400">Mastering today</p>
                    <p className="font-display text-2xl tabular-nums mt-1 text-ink-50">
                        {usage?.master?.used ?? 0}
                        <span className="text-base text-ink-400"> of {usage?.master?.limit ?? '—'}</span>
                    </p>
                </div>
            </div>

            {/* Today's allowance */}
            <Panel title="What's left today" sub="Resets every day at midnight" accent={ACCENT}>
                <div className="space-y-3">
                    {QUOTA_ROWS.map((row) => {
                        const used = usage?.[row.key]?.used ?? 0;
                        const limit = usage?.[row.key]?.limit ?? 0;
                        const pct = limit > 0 ? Math.min(100, Math.round((used / limit) * 100)) : 0;
                        const spent = limit > 0 && used >= limit;
                        return (
                            <div key={row.key}>
                                <div className="flex items-center justify-between gap-3 mb-1.5">
                                    <span className="text-[13px] text-ink-200 flex items-center gap-1.5">
                                        {row.label}
                                        <HelpTip text={row.hint} />
                                    </span>
                                    <span className={`text-[12px] tabular-nums ${spent ? 'text-ember-400' : 'text-ink-400'}`}>
                                        {used} of {limit || '—'} used
                                    </span>
                                </div>
                                <div className="h-1.5 rounded-full bg-white/8 overflow-hidden">
                                    <div
                                        className="h-full rounded-full transition-all"
                                        style={{
                                            width: `${pct}%`,
                                            backgroundColor: spent ? 'var(--color-ember-500)' : 'var(--color-brass-500)',
                                        }}
                                    />
                                </div>
                            </div>
                        );
                    })}
                </div>
                <p className="text-[11px] text-ink-400 mt-4 leading-relaxed">
                    The instant contract check, your contacts, your to-do list, tour routing, and the release checklist
                    are all free and don't count against anything.
                </p>
            </Panel>

            {/* Promo */}
            <Panel title="Got a code?" sub="Promo codes raise your limits for a while" accent={ACCENT}>
                <div className="flex flex-col sm:flex-row gap-2 sm:items-end">
                    <div className="flex-1">
                        <Field label="Promo code">
                            <input
                                value={code}
                                onChange={(e) => setCode(e.target.value)}
                                placeholder="Enter your code"
                                className={`${inputCls()} min-h-[44px]`}
                            />
                        </Field>
                    </div>
                    <Btn variant="accent" accent={ACCENT} onClick={redeem} disabled={busy || !code.trim()} className="min-h-[44px]">
                        {busy ? 'Checking…' : 'Apply code'}
                    </Btn>
                </div>
                {msg && <p className="text-sm text-emerald-400 mt-3">{msg}</p>}
                {err && <p className="text-sm text-amber-400 mt-3">{err}</p>}
            </Panel>

            {/* Credit packs */}
            <Panel
                title="Top up with credits"
                sub="One-off — no subscription, and they don't expire"
                accent={ACCENT}
                actions={
                    <Link to="/pricing" className="text-[12px] text-ember-400 hover:underline">
                        Compare plans →
                    </Link>
                }
            >
                <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
                    {CREDIT_PACKS.map((p) => (
                        <button
                            key={p.id}
                            type="button"
                            disabled={busy}
                            onClick={() => buyPack(p.id)}
                            className="text-left p-4 rounded-xl border border-white/10 hover:border-ember-500/40 transition-colors disabled:opacity-50 min-h-[104px] flex flex-col justify-between"
                        >
                            <div>
                                <div className="text-[13px] text-ink-50 font-medium">{p.label}</div>
                                <div className="text-[11px] text-ink-400 mt-0.5">{p.blurb}</div>
                            </div>
                            <div className="mt-3">
                                <div className="font-display text-lg text-ink-50">${p.price}</div>
                                <div className="text-[11px] text-ink-400">{p.credits.toLocaleString()} credits</div>
                            </div>
                        </button>
                    ))}
                </div>
            </Panel>
        </div>
    );
}
