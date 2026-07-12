import { useAuth } from '../lib/auth';

export default function FoundingBadge({ compact = false }: { compact?: boolean }) {
    const { me, refreshMe, signOut, displayName, email, isSignedIn } = useAuth();

    if (!isSignedIn) {
        return (
            <span className="font-mono text-[9px] tracking-widest uppercase text-ink-500 border border-white/10 rounded-full px-2.5 py-1">
                Guest
            </span>
        );
    }

    const u = me?.usage || {};
    const chips: { key: string; label: string }[] = [
        { key: 'master', label: 'Masters' },
        { key: 'scout', label: 'Scouts' },
        { key: 'pitch', label: 'Pitches' },
        { key: 'contract', label: 'Contracts' },
    ];
    const hours = Math.max(0, Math.floor((me?.resets_in_seconds || 0) / 3600));
    const badge = me?.user?.badge || (me?.user?.role === 'admin' ? 'Admin' : 'Member');

    if (compact) {
        return (
            <div className="flex items-center gap-2 min-w-0">
                <span className="font-mono text-[8px] tracking-widest uppercase px-2 py-0.5 rounded-full border border-ember-500/40 bg-ember-500/10 text-ember-400 shrink-0">
                    {badge}
                </span>
                <button
                    onClick={() => signOut()}
                    className="font-mono text-[8px] tracking-widest uppercase text-ink-500 hover:text-ink-200 shrink-0"
                >
                    Out
                </button>
            </div>
        );
    }

    return (
        <div className="flex flex-col items-end gap-1.5 max-w-[min(100vw-2rem,28rem)]">
            <div className="flex items-center gap-2">
                <span className="font-mono text-[9px] tracking-widest uppercase px-2 py-0.5 rounded-full border border-ember-500/40 bg-ember-500/10 text-ember-400">
                    {badge}
                </span>
                <span className="font-mono text-[9px] text-ink-400 truncate max-w-[9rem]" title={email || ''}>
                    {displayName || email}
                </span>
                <button
                    onClick={() => refreshMe()}
                    className="font-mono text-[9px] tracking-widest uppercase text-ink-500 hover:text-ink-200"
                    title="Refresh usage"
                >
                    ↻
                </button>
                <button
                    onClick={() => signOut()}
                    className="font-mono text-[9px] tracking-widest uppercase text-ink-500 hover:text-ink-200"
                >
                    Out
                </button>
            </div>
            {me && me.user?.role !== 'admin' && (
                <div className="flex flex-wrap justify-end gap-1.5">
                    {chips.map(({ key, label }) => {
                        const b = u[key];
                        if (!b) return null;
                        const hot = b.remaining <= 2;
                        return (
                            <span
                                key={key}
                                className={`font-mono text-[8px] tracking-wide uppercase px-2 py-0.5 rounded-full border tabular-nums ${
                                    hot
                                        ? 'border-amber-500/40 text-amber-300 bg-amber-500/10'
                                        : 'border-white/10 text-ink-400 bg-white/5'
                                }`}
                                title={`${label} today · resets in ~${hours}h`}
                            >
                                {label} {b.used}/{b.limit}
                            </span>
                        );
                    })}
                </div>
            )}
        </div>
    );
}
