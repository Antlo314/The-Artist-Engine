import { useAuth } from '../lib/auth';

/** Compact founding identity + usage meters for the Engine chrome. */
export default function FoundingBadge() {
    const { authEnabled, me, refreshMe, signOut, user } = useAuth();

    if (!authEnabled) {
        return (
            <span className="font-mono text-[9px] tracking-widest uppercase text-ink-500 border border-white/10 rounded-full px-2.5 py-1">
                Dev open mode
            </span>
        );
    }

    if (!me) {
        return (
            <span className="font-mono text-[9px] tracking-widest uppercase text-ink-500">
                {user?.email || 'Signed out'}
            </span>
        );
    }

    const u = me.usage || {};
    const chips: { key: string; label: string }[] = [
        { key: 'master', label: 'Masters' },
        { key: 'scout', label: 'Scouts' },
        { key: 'pitch', label: 'Pitches' },
        { key: 'contract', label: 'Contracts' },
    ];

    const hours = Math.max(0, Math.floor((me.resets_in_seconds || 0) / 3600));

    return (
        <div className="flex flex-col items-end gap-1.5 max-w-[min(100vw-2rem,28rem)]">
            <div className="flex items-center gap-2">
                <span className="font-mono text-[9px] tracking-widest uppercase px-2 py-0.5 rounded-full border border-ember-500/40 bg-ember-500/10 text-ember-400">
                    {me.user.badge || 'Founding Member'}
                </span>
                <span className="font-mono text-[9px] text-ink-400 truncate max-w-[10rem]" title={me.user.email}>
                    {me.user.display_name || me.user.email}
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
        </div>
    );
}
