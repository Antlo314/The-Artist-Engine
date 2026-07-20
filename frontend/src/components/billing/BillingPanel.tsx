import { useState } from 'react';
import { Link } from 'react-router-dom';
import { apiJson } from '../../lib/api';
import { useAuth } from '../../lib/auth';

export default function BillingPanel() {
    const { me, refreshMe } = useAuth();
    const [code, setCode] = useState('');
    const [msg, setMsg] = useState<string | null>(null);
    const [err, setErr] = useState<string | null>(null);
    const [busy, setBusy] = useState(false);

    const credits = me?.credits?.balance ?? 0;
    const plan = me?.plan;
    const promo = me?.promo;

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
            setMsg(res.message || 'Promo applied');
            await refreshMe();
        } catch (e: any) {
            setErr(e?.message || 'Redeem failed');
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
            setMsg(res.message || 'Credits added');
            await refreshMe();
        } catch (e: any) {
            setErr(e?.message || 'Purchase failed');
        } finally {
            setBusy(false);
        }
    };

    return (
        <div className="space-y-6">
            <div className="grid sm:grid-cols-3 gap-3">
                <div className="glass-obsidian border border-white/10 rounded-xl p-5">
                    <p className="font-mono text-[9px] tracking-widest uppercase text-ink-500">Plan</p>
                    <p className="font-display text-2xl mt-1">{plan?.name || me?.plan_id || 'Spark'}</p>
                    {promo && (
                        <span className="inline-block mt-2 font-mono text-[9px] tracking-widest uppercase px-2 py-0.5 rounded-full border border-ember-500/40 bg-ember-500/10 text-ember-400">
                            Investor Pilot ×{promo.multiplier}
                        </span>
                    )}
                </div>
                <div className="glass-obsidian border border-white/10 rounded-xl p-5">
                    <p className="font-mono text-[9px] tracking-widest uppercase text-ink-500">Credits</p>
                    <p className="font-display text-2xl tabular-nums mt-1 text-ember-400">{credits}</p>
                    <p className="text-[10px] text-ink-500 mt-1">period grant {me?.credits?.period_grant ?? 0}</p>
                </div>
                <div className="glass-obsidian border border-white/10 rounded-xl p-5">
                    <p className="font-mono text-[9px] tracking-widest uppercase text-ink-500">Masters today</p>
                    <p className="font-display text-2xl tabular-nums mt-1">
                        {me?.usage?.master?.used ?? 0}/{me?.usage?.master?.limit ?? 0}
                    </p>
                </div>
            </div>

            <div className="glass-obsidian border border-white/10 rounded-2xl p-5">
                <h3 className="font-display text-lg mb-3">Promo code</h3>
                <div className="flex flex-col sm:flex-row gap-2">
                    <input
                        value={code}
                        onChange={(e) => setCode(e.target.value)}
                        placeholder="engine26!"
                        className="flex-1 bg-ink-900 border border-white/10 rounded-lg px-3 py-2 text-sm font-mono"
                    />
                    <button
                        type="button"
                        disabled={busy}
                        onClick={redeem}
                        className="px-5 py-2 rounded-full bg-ember-600 text-white font-mono text-[10px] tracking-widest uppercase"
                    >
                        Redeem
                    </button>
                </div>
                {msg && <p className="text-sm text-emerald-400 mt-2">{msg}</p>}
                {err && <p className="text-sm text-amber-400 mt-2">{err}</p>}
            </div>

            <div className="glass-obsidian border border-white/10 rounded-2xl p-5">
                <div className="flex items-center justify-between mb-3">
                    <h3 className="font-display text-lg">Credit packs</h3>
                    <Link to="/pricing" className="font-mono text-[10px] tracking-widest uppercase text-ember-400">
                        Full pricing →
                    </Link>
                </div>
                <div className="grid grid-cols-2 gap-2">
                    {[
                        { id: 'boost', label: 'Boost 100', price: 9 },
                        { id: 'session', label: 'Session 400', price: 29 },
                        { id: 'tour', label: 'Tour 1.5k', price: 89 },
                        { id: 'label_pack', label: 'Label 5k', price: 249 },
                    ].map((p) => (
                        <button
                            key={p.id}
                            type="button"
                            disabled={busy}
                            onClick={() => buyPack(p.id)}
                            className="text-left p-3 rounded-xl border border-white/10 hover:border-ember-500/30 transition-colors"
                        >
                            <div className="font-mono text-[10px] text-ink-400 uppercase tracking-widest">{p.label}</div>
                            <div className="text-sm mt-1">${p.price}</div>
                        </button>
                    ))}
                </div>
            </div>
        </div>
    );
}
