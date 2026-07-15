import { useState } from 'react';
import { Lightbulb, X } from 'lucide-react';
import { dismissCoach, hasDismissedCoach } from '../../lib/onboarding';

type Props = {
    id: string;
    title?: string;
    children: React.ReactNode;
    accent?: string;
    className?: string;
};

/** Dismissible inline tip — survives across sessions once dismissed. */
export default function CoachPrompt({
    id,
    title = 'Tip',
    children,
    accent = 'var(--color-ember-400)',
    className = '',
}: Props) {
    const [hidden, setHidden] = useState(() => hasDismissedCoach(id));

    if (hidden) return null;

    return (
        <div
            className={`relative flex gap-3 rounded-xl border border-white/10 bg-white/[0.03] px-3.5 py-3 ${className}`}
        >
            <div
                className="w-8 h-8 rounded-lg flex items-center justify-center shrink-0 border border-white/10"
                style={{ color: accent, backgroundColor: `${accent}18` }}
            >
                <Lightbulb size={14} />
            </div>
            <div className="min-w-0 flex-1 pt-0.5">
                <p
                    className="font-mono text-[9px] tracking-[0.2em] uppercase mb-0.5"
                    style={{ color: accent }}
                >
                    {title}
                </p>
                <div className="text-xs text-ink-200 leading-relaxed">{children}</div>
            </div>
            <button
                type="button"
                aria-label="Dismiss tip"
                className="shrink-0 w-8 h-8 rounded-lg flex items-center justify-center text-ink-500 hover:text-ink-200 hover:bg-white/5"
                onClick={() => {
                    dismissCoach(id);
                    setHidden(true);
                }}
            >
                <X size={14} />
            </button>
        </div>
    );
}
