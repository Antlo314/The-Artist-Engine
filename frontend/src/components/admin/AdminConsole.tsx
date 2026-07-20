import { useEffect, useState } from 'react';
import { apiJson } from '../../lib/api';
import { useAuth } from '../../lib/auth';

type AdminUser = {
    id: string;
    email: string;
    name: string;
    role: string;
    status: string;
    plan_id?: string;
    credits?: number;
    promo_multiplier?: number;
    promo_expires_at?: number;
    auth_provider?: string;
    cohort_tags?: string;
    created_at?: string;
    last_login_at?: string;
};

export default function AdminConsole() {
    const { me, refreshMe } = useAuth();
    const [users, setUsers] = useState<AdminUser[]>([]);
    const [promo, setPromo] = useState<{ redemptions?: number; code?: string } | null>(null);
    const [q, setQ] = useState('');
    const [err, setErr] = useState<string | null>(null);
    const [msg, setMsg] = useState<string | null>(null);
    const [busy, setBusy] = useState(false);

    const load = async () => {
        setErr(null);
        try {
            const data = await apiJson<any>('/api/admin/users');
            setUsers(data.users || []);
            setPromo(data.promo || null);
        } catch (e: any) {
            setErr(e?.message || 'Failed to load admin data');
        }
    };

    useEffect(() => {
        if (me?.user?.role === 'admin') load();
    }, [me?.user?.role]);

    if (me?.user?.role !== 'admin') {
        return (
            <div className="glass-obsidian border border-white/10 rounded-2xl p-8 text-center text-sm text-ink-400">
                Admin only.
            </div>
        );
    }

    const filtered = users.filter((u) => {
        if (!q.trim()) return true;
        const s = q.toLowerCase();
        return (
            u.email?.toLowerCase().includes(s) ||
            u.name?.toLowerCase().includes(s) ||
            u.plan_id?.toLowerCase().includes(s) ||
            u.cohort_tags?.toLowerCase().includes(s)
        );
    });

    const investorCohort = users.filter((u) => (u.cohort_tags || '').includes('investor') || (u.promo_multiplier || 1) > 1);

    const setPlan = async (userId: string, plan_id: string) => {
        setBusy(true);
        setMsg(null);
        try {
            await apiJson('/api/admin/plan', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ user_id: userId, plan_id }),
            });
            setMsg(`Plan → ${plan_id}`);
            await load();
        } catch (e: any) {
            setErr(e?.message || 'Plan update failed');
        } finally {
            setBusy(false);
        }
    };

    const grantCredits = async (userId: string, delta: number) => {
        setBusy(true);
        try {
            await apiJson('/api/admin/credits', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ user_id: userId, delta, reason: 'admin_console' }),
            });
            setMsg(`Credits ${delta > 0 ? '+' : ''}${delta}`);
            await load();
            await refreshMe();
        } catch (e: any) {
            setErr(e?.message || 'Credit adjust failed');
        } finally {
            setBusy(false);
        }
    };

    const exportCsv = () => {
        const header = ['id', 'email', 'name', 'plan', 'credits', 'promo_x', 'cohort', 'provider', 'created'];
        const rows = filtered.map((u) =>
            [u.id, u.email, u.name, u.plan_id || 'spark', u.credits ?? 0, u.promo_multiplier || 1, u.cohort_tags || '', u.auth_provider || '', u.created_at || ''].join(',')
        );
        const blob = new Blob([[header.join(','), ...rows].join('\n')], { type: 'text/csv' });
        const a = document.createElement('a');
        a.href = URL.createObjectURL(blob);
        a.download = `engine-users-${Date.now()}.csv`;
        a.click();
    };

    const seedDemo = async () => {
        setBusy(true);
        setErr(null);
        setMsg(null);
        try {
            const res = await apiJson<any>('/api/admin/seed-demo', { method: 'POST' });
            setMsg(
                `Seeded ${(res.seeded || []).length} demo artists. Password: DemoArtist1! · ${JSON.stringify(
                    (res.seeded || []).map((a: any) => a.email)
                )}`
            );
            await load();
        } catch (e: any) {
            setErr(e?.message || 'Seed failed');
        } finally {
            setBusy(false);
        }
    };

    return (
        <div className="space-y-6">
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
                <div className="glass-obsidian border border-white/10 rounded-xl p-4">
                    <p className="font-mono text-[9px] tracking-widest uppercase text-ink-500">Users</p>
                    <p className="font-display text-2xl tabular-nums mt-1">{users.length}</p>
                </div>
                <div className="glass-obsidian border border-white/10 rounded-xl p-4">
                    <p className="font-mono text-[9px] tracking-widest uppercase text-ink-500">Investor cohort</p>
                    <p className="font-display text-2xl tabular-nums mt-1 text-ember-400">{investorCohort.length}</p>
                </div>
                <div className="glass-obsidian border border-white/10 rounded-xl p-4">
                    <p className="font-mono text-[9px] tracking-widest uppercase text-ink-500">Promo redemptions</p>
                    <p className="font-display text-2xl tabular-nums mt-1">{promo?.redemptions ?? 0}</p>
                </div>
                <div className="glass-obsidian border border-ember-500/20 rounded-xl p-4">
                    <p className="font-mono text-[9px] tracking-widest uppercase text-ink-500">Pilot code</p>
                    <p className="font-mono text-sm mt-2 text-ember-400">{promo?.code || 'engine26!'}</p>
                </div>
            </div>

            <div className="flex flex-wrap gap-3 items-center">
                <input
                    value={q}
                    onChange={(e) => setQ(e.target.value)}
                    placeholder="Search email, plan, cohort…"
                    className="flex-1 min-w-[12rem] bg-ink-900 border border-white/10 rounded-lg px-3 py-2 text-sm"
                />
                <button type="button" onClick={load} className="font-mono text-[10px] tracking-widest uppercase px-3 py-2 border border-white/10 rounded-full">
                    Refresh
                </button>
                <button type="button" onClick={exportCsv} className="font-mono text-[10px] tracking-widest uppercase px-3 py-2 border border-white/10 rounded-full">
                    Export CSV
                </button>
                <button
                    type="button"
                    disabled={busy}
                    onClick={seedDemo}
                    className="font-mono text-[10px] tracking-widest uppercase px-3 py-2 border border-ember-500/40 text-ember-400 rounded-full hover:bg-ember-500/10"
                >
                    Seed demo artists
                </button>
            </div>

            {err && <p className="text-sm text-amber-400">{err}</p>}
            {msg && <p className="text-sm text-emerald-400">{msg}</p>}

            <div className="glass-obsidian border border-white/10 rounded-2xl overflow-hidden">
                <div className="overflow-x-auto">
                    <table className="w-full text-left text-xs">
                        <thead className="font-mono text-[9px] tracking-widest uppercase text-ink-500 border-b border-white/10">
                            <tr>
                                <th className="p-3">User</th>
                                <th className="p-3">Plan</th>
                                <th className="p-3">Credits</th>
                                <th className="p-3">Promo</th>
                                <th className="p-3">Cohort</th>
                                <th className="p-3">Actions</th>
                            </tr>
                        </thead>
                        <tbody>
                            {filtered.map((u) => (
                                <tr key={u.id} className="border-b border-white/5 hover:bg-white/[0.02]">
                                    <td className="p-3">
                                        <div className="font-medium text-ink-100">{u.name || '—'}</div>
                                        <div className="text-ink-500 font-mono text-[10px]">{u.email}</div>
                                        <div className="text-ink-600 font-mono text-[9px]">{u.auth_provider || 'password'} · {u.role}</div>
                                    </td>
                                    <td className="p-3">
                                        <select
                                            disabled={busy}
                                            value={u.plan_id || 'spark'}
                                            onChange={(e) => setPlan(u.id, e.target.value)}
                                            className="bg-ink-900 border border-white/10 rounded px-2 py-1 text-[11px]"
                                        >
                                            <option value="spark">Spark</option>
                                            <option value="creator">Creator</option>
                                            <option value="pro">Pro</option>
                                            <option value="label">Label</option>
                                        </select>
                                    </td>
                                    <td className="p-3 tabular-nums">{u.credits ?? 0}</td>
                                    <td className="p-3">
                                        {(u.promo_multiplier || 1) > 1 ? (
                                            <span className="text-ember-400 font-mono">×{u.promo_multiplier}</span>
                                        ) : (
                                            <span className="text-ink-600">—</span>
                                        )}
                                    </td>
                                    <td className="p-3 max-w-[8rem] truncate font-mono text-[10px] text-ink-400">
                                        {u.cohort_tags || '—'}
                                    </td>
                                    <td className="p-3 space-x-1 whitespace-nowrap">
                                        <button
                                            type="button"
                                            disabled={busy}
                                            onClick={() => grantCredits(u.id, 100)}
                                            className="px-2 py-1 rounded border border-white/10 font-mono text-[9px] uppercase hover:border-emerald-500/40"
                                        >
                                            +100
                                        </button>
                                        <button
                                            type="button"
                                            disabled={busy}
                                            onClick={() => grantCredits(u.id, -50)}
                                            className="px-2 py-1 rounded border border-white/10 font-mono text-[9px] uppercase hover:border-amber-500/40"
                                        >
                                            −50
                                        </button>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            </div>
        </div>
    );
}
