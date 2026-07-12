/** Shared Source Engine mark + wordmark for nav, login, engine shell, footers. */

type BrandMarkProps = {
    /** visual density */
    size?: 'sm' | 'md' | 'lg';
    /** show wordmark next to icon */
    showWordmark?: boolean;
    /** compact = SOURCE.ENGINE · full = THE SOURCE ENGINE · stacked = two-line */
    variant?: 'compact' | 'full' | 'stacked';
    className?: string;
    onClick?: () => void;
};

const sizes = {
    sm: { box: 'h-7 w-7', img: 'h-full w-full', word: 'text-sm', sub: 'text-[9px]' },
    md: { box: 'h-8 w-8', img: 'h-full w-full', word: 'text-sm sm:text-base', sub: 'text-[10px]' },
    lg: { box: 'h-10 w-10', img: 'h-full w-full', word: 'text-lg', sub: 'text-[10px]' },
};

function Wordmark({
    variant,
    word,
    sub,
}: {
    variant: 'compact' | 'full' | 'stacked';
    word: string;
    sub: string;
}) {
    if (variant === 'compact') {
        return (
            <span className={`font-display font-semibold tracking-[0.18em] text-ink-50 truncate ${word}`}>
                SOURCE
                <span className="text-ember-500">.</span>
                <span className="text-ink-200 font-medium">ENGINE</span>
            </span>
        );
    }
    if (variant === 'full') {
        return (
            <span className={`font-display font-semibold tracking-widest text-ink-50 truncate ${word}`}>
                THE SOURCE ENGINE
            </span>
        );
    }
    return (
        <div className="text-left min-w-0">
            <div className={`font-display font-semibold text-ink-50 tracking-widest leading-none ${word}`}>
                THE SOURCE
            </div>
            <div className={`font-mono text-ink-400 tracking-[0.28em] mt-1 ${sub}`}>
                ENGINE
            </div>
        </div>
    );
}

export default function BrandMark({
    size = 'md',
    showWordmark = true,
    variant = 'compact',
    className = '',
    onClick,
}: BrandMarkProps) {
    const s = sizes[size];
    const body = (
        <>
            <div
                className={`${s.box} rounded-lg bg-black border border-white/10 overflow-hidden shrink-0 shadow-[0_0_20px_rgba(220,38,38,0.18)]`}
            >
                <img
                    src="/site/logo.png"
                    alt="The Source Engine"
                    className={`${s.img} object-cover`}
                    width={40}
                    height={40}
                />
            </div>
            {showWordmark && <Wordmark variant={variant} word={s.word} sub={s.sub} />}
        </>
    );

    const base = `flex items-center gap-2.5 min-w-0 ${className}`;

    if (onClick) {
        return (
            <button
                type="button"
                onClick={onClick}
                className={`${base} cursor-pointer group`}
                aria-label="The Source Engine"
            >
                {body}
            </button>
        );
    }

    return (
        <div className={base} aria-label="The Source Engine">
            {body}
        </div>
    );
}
