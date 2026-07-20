import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Check, Sparkles, Zap } from 'lucide-react';
import BrandMark from '../components/BrandMark';
import ThemeToggle from '../components/ThemeToggle';
import { apiJson } from '../lib/api';
import { useAuth } from '../lib/auth';

type Plan = {
    id: string;
    name: string;
    price_monthly: number;
    price_annual: number;
    monthly_credits: number;
    daily: Record<string, number>;
    max_lead_count: number;
    max_scout_cities: number;
    features: Record<string, unknown>;
    seats: number;
};

type Pack = {
    id: string;
    credits: number;
    price_usd: number;
    label: string;
};

const FALLBACK_PLANS: Plan[] = [
    {
        id: 'spark',
        name: 'Spark',
        price_monthly: 0,
        price_annual: 0,
        monthly_credits: 30,
        daily: { master: 1, scout: 2, pitch: 3, contract: 1, oracle: 2, stems: 0 },
        max_lead_count: 10,
        max_scout_cities: 1,
        features: {},
        seats: 1,
    },
    {
        id: 'creator',
        name: 'Creator',
        price_monthly: 19,
        price_annual: 180,
        monthly_credits: 200,
        daily: { master: 5, scout: 8, pitch: 20, contract: 5, oracle: 10, stems: 2 },
        max_lead_count: 100,
        max_scout_cities: 2,
        features: {},
        seats: 1,
    },
    {
        id: 'pro',
        name: 'Pro',
        price_monthly: 49,
        price_annual: 468,
        monthly_credits: 800,
        daily: { master: 15, scout: 20, pitch: 50, contract: 15, oracle: 25, stems: 8 },
        max_lead_count: 1000,
        max_scout_cities: 3,
        features: {},
        seats: 1,
    },
    {
        id: 'label',
        name: 'Label',
        price_monthly: 129,
        price_annual: 1188,
        monthly_credits: 3000,
        daily: { master: 40, scout: 50, pitch: 120, contract: 40, oracle: 60, stems: 20 },
        max_lead_count: 50000,
        max_scout_cities: 5,
        features: {},
        seats: 5,
    },
];

const FALLBACK_PACKS: Pack[] = [
    { id: 'boost', credits: 100, price_usd: 9, label: 'Boost' },
    { id: 'session', credits: 400, price_usd: 29, label: 'Session' },
    { id: 'tour', credits: 1500, price_usd: 89, label: 'Tour' },
    { id: 'label_pack', credits: 5000, price_usd: 249, label: 'Label Pack' },
];

function planBullets(p: Plan): string[] {
    return [
        `${p.daily?.master ?? 0} masters / day`,
        `${p.monthly_credits} credits / mo`,
        `${p.max_scout_cities} scout cities`,
        `${p.max_lead_count >= 10000 ? 'Unlimited' : p.max_lead_count} CRM leads`,
        p.id === 'spark' ? 'Pure master (no reference)' : 'Reference + pure master',
        p.id === 'spark' ? 'Starter Radar + Legal' : 'Full Studio · Radar · Zion',
    ];
}

export default function PricingPage() {
    const { isSignedIn, me, refreshMe } = useAuth();
    const [annual, setAnnual] = useState(false);
    const [plans, setPlans] = useState<Plan[]>(FALLBACK_PLANS);
    const [packs, setPacks] = useState<Pack[]>(FALLBACK_PACKS);
    const [promo, setPromo] = useState('');
    const [promoMsg, setPromoMsg] = useState<string | null>(null);
    const [promoErr, setPromoErr] = useState<string | null>(null);
    const [busy, setBusy] = useState<string | null>(null);

    useEffect(() => {
        (async () => {
            try {
                const data = await apiJson<any>('/api/plans');
                if (data.plans?.length) setPlans(data.plans);
                if (data.credit_packs?.length) setPacks(data.credit_packs);
            } catch {
                /* fallback catalog */
            }
        })();
    }, []);

    const checkout = async (mode: 'subscription' | 'payment', plan_id?: string, pack_id?: string) => {
        if (!isSignedIn) {
            window.location.href = '/login';
            return;
        }
        setBusy(plan_id || pack_id || 'x');
        try {
            const res = await apiJson<any>('/api/billing/checkout', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    mode,
                    plan_id,
                    pack_id,
                    interval: annual ? 'year' : 'month',
                }),
            });
            if (res.url && !res.mock) {
                window.location.href = res.url;
                return;
            }
            await refreshMe();
            setPromoMsg(res.message || 'Updated successfully.');
        } catch (e: any) {
            setPromoErr(e?.message || 'Checkout failed');
        } finally {
            setBusy(null);
        }
    };

    const redeem = async () => {
        if (!isSignedIn) {
            window.location.href = '/login';
            return;
        }
        setPromoErr(null);
        setPromoMsg(null);
        setBusy('promo');
        try {
            const res = await apiJson<any>('/api/promo/redeem', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ code: promo }),
            });
            setPromoMsg(res.message || 'Promo applied.');
            await refreshMe();
        } catch (e: any) {
            setPromoErr(e?.message || 'Could not redeem code');
        } finally {
            setBusy(null);
        }
    };

    const currentPlan = me?.plan_id || me?.plan?.id || 'spark';

    return (
        <div className="min-h-screen bg-ink-950 text-ink-50 relative overflow-hidden">
            <div className="absolute inset-0 pointer-events-none grain bg-[radial-gradient(ellipse_at_top,_#12070a_0%,_#08080a_50%,_#060607_100%)]" />
            <header className="relative z-10 flex items-center justify-between px-6 py-5 max-w-6xl mx-auto">
                <Link to="/" className="inline-flex">
                    <BrandMark size="md" variant="full" />
                </Link>
                <div className="flex items-center gap-3">
                    <ThemeToggle />
                    <Link to="/features" className="font-mono text-[10px] tracking-widest uppercase text-ink-400 hover:text-ink-50">
                        Features
                    </Link>
                    {isSignedIn ? (
                        <Link
                            to="/engine"
                            className="font-mono text-[10px] tracking-widest uppercase px-3 py-1.5 rounded-full border border-ember-500/40 text-ember-400 hover:bg-ember-500/10"
                        >
                            Engine
                        </Link>
                    ) : (
                        <Link
                            to="/login"
                            className="font-mono text-[10px] tracking-widest uppercase px-3 py-1.5 rounded-full bg-ember-600 text-white"
                        >
                            Sign in
                        </Link>
                    )}
                </div>
            </header>

            <main className="relative z-10 max-w-6xl mx-auto px-6 pb-24">
                <div className="text-center pt-8 pb-10">
                    <p className="font-mono text-[10px] tracking-[0.3em] uppercase text-ember-500 mb-3">Pricing · 2026</p>
                    <h1 className="font-display text-4xl md:text-5xl font-semibold tracking-tight mb-3">
                        One OS. Clear tiers.
                    </h1>
                    <p className="text-ink-200 max-w-xl mx-auto text-sm leading-relaxed">
                        Master tracks, scout venues, defend contracts, and run your pipeline — free to start, credits when you scale.
                    </p>
                    <div className="mt-6 inline-flex items-center gap-1 p-1 rounded-full border border-white/10 bg-white/5">
                        <button
                            type="button"
                            onClick={() => setAnnual(false)}
                            className={`px-4 py-1.5 rounded-full font-mono text-[10px] tracking-widest uppercase ${
                                !annual ? 'bg-ember-600 text-white' : 'text-ink-400'
                            }`}
                        >
                            Monthly
                        </button>
                        <button
                            type="button"
                            onClick={() => setAnnual(true)}
                            className={`px-4 py-1.5 rounded-full font-mono text-[10px] tracking-widest uppercase ${
                                annual ? 'bg-ember-600 text-white' : 'text-ink-400'
                            }`}
                        >
                            Annual · save ~20%
                        </button>
                    </div>
                </div>

                <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-4">
                    {plans.map((p) => {
                        const featured = p.id === 'pro';
                        const price = annual
                            ? Math.round((p.price_annual || p.price_monthly * 12) / 12)
                            : p.price_monthly;
                        const isCurrent = currentPlan === p.id;
                        return (
                            <motion.div
                                key={p.id}
                                initial={{ opacity: 0, y: 16 }}
                                animate={{ opacity: 1, y: 0 }}
                                className={`glass-obsidian sheen rounded-2xl p-6 flex flex-col relative ${
                                    featured ? 'hud-corners border-ember-500/40 shadow-[0_0_40px_rgba(220,38,38,0.12)]' : 'border border-white/10'
                                }`}
                            >
                                {featured && (
                                    <span className="absolute -top-2.5 left-1/2 -translate-x-1/2 font-mono text-[9px] tracking-widest uppercase px-2.5 py-0.5 rounded-full bg-ember-600 text-white">
                                        Most chosen
                                    </span>
                                )}
                                <div className="flex items-center gap-2 mb-1">
                                    {p.id === 'spark' ? <Zap size={14} className="text-ink-400" /> : <Sparkles size={14} className="text-ember-400" />}
                                    <h2 className="font-display text-xl font-semibold">{p.name}</h2>
                                </div>
                                <div className="mb-4">
                                    <span className="font-display text-3xl tabular-nums">${price}</span>
                                    <span className="text-ink-400 text-sm">/mo</span>
                                    {annual && p.price_monthly > 0 && (
                                        <p className="font-mono text-[9px] text-ink-500 mt-0.5">billed annually</p>
                                    )}
                                </div>
                                <ul className="space-y-2 mb-6 flex-1">
                                    {planBullets(p).map((b) => (
                                        <li key={b} className="flex items-start gap-2 text-xs text-ink-200">
                                            <Check size={14} className="text-emerald-400 shrink-0 mt-0.5" />
                                            <span>{b}</span>
                                        </li>
                                    ))}
                                </ul>
                                <button
                                    type="button"
                                    disabled={busy === p.id || (isCurrent && p.id !== 'spark')}
                                    onClick={() => (p.price_monthly === 0 ? (window.location.href = isSignedIn ? '/engine' : '/login') : checkout('subscription', p.id))}
                                    className={`w-full py-2.5 rounded-full font-mono text-[10px] tracking-widest uppercase transition-colors ${
                                        featured
                                            ? 'bg-ember-600 hover:bg-ember-500 text-white'
                                            : 'border border-white/15 hover:border-ember-500/40 text-ink-100'
                                    } disabled:opacity-50`}
                                >
                                    {isCurrent ? 'Current plan' : p.price_monthly === 0 ? 'Start free' : busy === p.id ? '…' : 'Upgrade'}
                                </button>
                            </motion.div>
                        );
                    })}
                </div>

                {/* Credits */}
                <section className="mt-16">
                    <h2 className="font-display text-2xl font-semibold mb-2">Buy more credits</h2>
                    <p className="text-sm text-ink-200 mb-6 max-w-lg leading-relaxed">
                        Masters, stems, scouts, pitches, and contract AI burn credits. Packs never expire. Available on every tier after login.
                    </p>
                    <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-3">
                        {packs.map((pack) => (
                            <div key={pack.id} className="glass-obsidian border border-white/10 rounded-xl p-5 flex flex-col">
                                <p className="font-mono text-[10px] tracking-widest uppercase text-ink-400 mb-1">{pack.label}</p>
                                <p className="font-display text-2xl tabular-nums mb-1">{pack.credits.toLocaleString()}</p>
                                <p className="text-xs text-ink-400 mb-4">credits · ${pack.price_usd}</p>
                                <button
                                    type="button"
                                    disabled={busy === pack.id}
                                    onClick={() => checkout('payment', undefined, pack.id)}
                                    className="mt-auto w-full py-2 rounded-full border border-white/15 font-mono text-[10px] tracking-widest uppercase hover:border-ember-500/40"
                                >
                                    {busy === pack.id ? '…' : 'Buy pack'}
                                </button>
                            </div>
                        ))}
                    </div>
                </section>

                {/* Promo */}
                <section className="mt-16 glass-obsidian hud-corners border border-ember-500/20 rounded-2xl p-6 md:p-8">
                    <h2 className="font-display text-xl font-semibold mb-2">Investor pilot code</h2>
                    <p className="text-sm text-ink-200 mb-4 max-w-xl leading-relaxed">
                        Have the investor code? Sign in first, then redeem to multiply daily limits and monthly credits by ×5 for 90 days.
                    </p>
                    <div className="flex flex-col sm:flex-row gap-3 max-w-md">
                        <input
                            value={promo}
                            onChange={(e) => setPromo(e.target.value)}
                            placeholder="Enter promo code"
                            className="flex-1 bg-ink-900 border border-white/10 rounded-lg px-4 py-2.5 text-sm font-mono focus:outline-none focus:border-ember-500/50"
                        />
                        <button
                            type="button"
                            onClick={redeem}
                            disabled={busy === 'promo'}
                            className="px-6 py-2.5 rounded-full bg-ember-600 hover:bg-ember-500 text-white font-mono text-[10px] tracking-widest uppercase"
                        >
                            Redeem
                        </button>
                    </div>
                    {promoMsg && <p className="mt-3 text-sm text-emerald-400">{promoMsg}</p>}
                    {promoErr && <p className="mt-3 text-sm text-amber-400">{promoErr}</p>}
                    {me?.promo && (
                        <p className="mt-3 font-mono text-[10px] tracking-widest uppercase text-ember-400">
                            Active · ×{me.promo.multiplier} · until {me.promo.expires_at ? new Date(me.promo.expires_at).toLocaleDateString() : '—'}
                        </p>
                    )}
                </section>

                <p className="mt-12 text-center text-xs text-ink-500">
                    Command / enterprise seats available on request. Mix & master jobs are metered server-side — no soft honor system.
                </p>
            </main>
        </div>
    );
}
