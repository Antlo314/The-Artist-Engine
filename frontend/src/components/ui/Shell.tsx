import { type ReactNode, useEffect, useRef, useState } from 'react';

/* ============================================================
   Engine UI v3 — "Clarity Protocol" shared primitives.
   One card look, one input look, one button hierarchy.
   Cinematic video lives in PageHeader bands, never as wallpaper.
   ============================================================ */

/* ---- PageHeader: cinematic ambient band (themed engine videos) ---- */
const HEADER_MEDIA: Record<string, { video: string | null; poster: string | null }> = {
    dashboard: { video: '/site/header-dashboard.mp4', poster: '/site/header-dashboard.jpg' },
    radar: { video: '/site/header-radar.mp4', poster: '/site/header-radar.jpg' },
    studio: { video: '/site/header-studio.mp4', poster: '/site/header-studio.jpg' },
    legal: { video: '/site/header-legal.mp4', poster: '/site/header-legal.jpg' },
    profile: { video: null, poster: '/site/light_abstract_bg_1773233140940.png' },
};

/** Lazy-load header video only when visible — poster paints instantly. */
function LazyHeaderVideo({ src, poster }: { src: string; poster?: string | null }) {
    const ref = useRef<HTMLDivElement>(null);
    const [active, setActive] = useState(false);

    useEffect(() => {
        const el = ref.current;
        if (!el) return;
        if (typeof IntersectionObserver === 'undefined') {
            setActive(true);
            return;
        }
        const io = new IntersectionObserver(
            ([entry]) => {
                if (entry.isIntersecting) {
                    setActive(true);
                    io.disconnect();
                }
            },
            { rootMargin: '160px' }
        );
        io.observe(el);
        return () => io.disconnect();
    }, []);

    return (
        <div ref={ref} className="absolute inset-0 theme-header-media">
            {poster && (
                <div
                    className="absolute inset-0 bg-cover bg-center opacity-50 md:opacity-40 scale-105"
                    style={{ backgroundImage: `url('${poster}')` }}
                />
            )}
            {active && (
                <video
                    autoPlay
                    loop
                    muted
                    playsInline
                    preload="metadata"
                    poster={poster || undefined}
                    className="absolute inset-0 w-full h-full object-cover object-center opacity-55 md:opacity-45"
                >
                    <source src={src} type="video/mp4" />
                </video>
            )}
            {!active && !poster && <div className="absolute inset-0 bg-ink-900 opacity-40" />}
        </div>
    );
}

export function PageHeader({
    view, accent, module, title, desc, children, speedHint,
}: {
    view: keyof typeof HEADER_MEDIA;
    accent: string;
    module: string;
    title: string;
    desc: string;
    children?: ReactNode;
    /** Optional live-speed chip, e.g. "~8s venue scan" */
    speedHint?: string;
}) {
    const media = HEADER_MEDIA[view] || { video: null, poster: null };
    return (
        <div className="theme-page-header hud-corners relative overflow-hidden rounded-xl md:rounded-2xl border border-white/10 mb-4 md:mb-8 h-[156px] sm:h-[168px] md:h-[188px] group">
            {media.video ? (
                <LazyHeaderVideo src={media.video} poster={media.poster} />
            ) : (
                <div
                    className="absolute inset-0 bg-cover bg-center opacity-35 md:opacity-28"
                    style={{ backgroundImage: `url('${media.poster || '/site/light_abstract_bg_1773233140940.png'}')` }}
                />
            )}
            {/* Legible scrim — theme-aware; stronger on mobile so type stays readable over video */}
            <div className="theme-header-scrim absolute inset-0 bg-gradient-to-r from-ink-950 via-ink-950/90 to-ink-950/45 md:via-ink-950/85 md:to-ink-950/35" />
            <div className="theme-header-fade absolute inset-x-0 bottom-0 h-20 md:h-24 bg-gradient-to-t from-ink-950 to-transparent" />

            <div className="relative z-10 h-full flex items-end justify-between p-4 sm:p-6 md:p-8 gap-3">
                <div className="min-w-0">
                    <div className="flex flex-wrap items-center gap-2 mb-1 sm:mb-2">
                        <p
                            className="font-mono text-[9px] sm:text-[10px] tracking-[0.2em] sm:tracking-[0.3em] uppercase truncate"
                            style={{ color: accent }}
                        >
                            {module}
                        </p>
                        {speedHint && (
                            <span
                                className="font-mono text-[8px] sm:text-[9px] tracking-widest uppercase px-2 py-0.5 rounded-full border shrink-0"
                                style={{ color: accent, borderColor: `${accent}55`, backgroundColor: `${accent}14` }}
                            >
                                {speedHint}
                            </span>
                        )}
                    </div>
                    <h1 className="font-display text-2xl sm:text-3xl md:text-4xl font-semibold text-ink-50 tracking-tight leading-tight">
                        {title}
                    </h1>
                    <p className="text-ink-200 font-normal text-xs sm:text-sm mt-1 max-w-xl leading-relaxed line-clamp-2 md:line-clamp-none drop-shadow-[0_1px_8px_rgba(0,0,0,0.75)]">
                        {desc}
                    </p>
                </div>
                {children && <div className="shrink-0 hidden sm:block">{children}</div>}
            </div>

            <div className="absolute bottom-0 inset-x-0 h-px bg-white/10 z-10">
                <div className="h-full w-1/5 transition-all duration-700 group-hover:w-2/5" style={{ backgroundColor: accent }} />
            </div>
        </div>
    );
}

/* ---- Panel: the one card ---- */
export function Panel({
    title, sub, accent, actions, hud = false, sheen = true, className = '', children,
}: {
    title?: string;
    sub?: string;
    accent?: string;
    actions?: ReactNode;
    hud?: boolean;
    sheen?: boolean;
    className?: string;
    children: ReactNode;
}) {
    return (
        <div className={`glass-obsidian rounded-2xl border border-white/10 ${sheen ? 'sheen' : ''} ${hud ? 'hud-corners' : ''} ${className}`}>
            {(title || actions) && (
                <div className="flex items-center justify-between gap-3 px-5 md:px-6 pt-5 pb-4 border-b border-white/10">
                    <div className="min-w-0">
                        {title && <h3 className="font-display text-base text-ink-50 tracking-wide truncate">{title}</h3>}
                        {sub && (
                            <p
                                className="font-mono text-[10px] tracking-[0.2em] uppercase mt-0.5 truncate text-ink-400"
                                style={accent ? { color: accent } : undefined}
                            >
                                {sub}
                            </p>
                        )}
                    </div>
                    {actions && <div className="shrink-0">{actions}</div>}
                </div>
            )}
            <div className="p-5 md:p-6">{children}</div>
        </div>
    );
}

/* ---- Field: labelled input wrapper ---- */
export function Field({
    label, hint, children,
}: {
    label: string;
    hint?: string;
    children: ReactNode;
}) {
    return (
        <label className="flex flex-col gap-1.5">
            <span className="font-mono text-[10px] tracking-[0.2em] uppercase text-ink-400">{label}</span>
            {children}
            {hint && <span className="text-[11px] text-ink-400 leading-snug">{hint}</span>}
        </label>
    );
}

/** Shared input/select className recipe. Pass an accent hex for focus ring color. */
export function inputCls(accent = '#dc2626') {
    // accent only tints focus; kept as inline style at call sites where needed.
    void accent;
    return 'bg-ink-900 border border-white/10 rounded-lg px-3.5 py-2.5 text-ink-50 placeholder:text-ink-500 text-sm focus:outline-none focus:border-white/30 transition-colors w-full';
}

/* ---- Btn: one button hierarchy ---- */
export function Btn({
    variant = 'primary', size = 'md', accent, className = '', children, ...rest
}: {
    variant?: 'primary' | 'accent' | 'ghost' | 'danger-ghost';
    size?: 'sm' | 'md';
    accent?: string;
    className?: string;
    children: ReactNode;
} & React.ButtonHTMLAttributes<HTMLButtonElement>) {
    const sizes = size === 'sm' ? 'px-4 py-2 text-xs' : 'px-6 py-3 text-sm';
    const base = `inline-flex items-center justify-center gap-2 rounded-full font-display font-medium transition-colors disabled:opacity-40 disabled:cursor-not-allowed ${sizes} ${className}`;
    if (variant === 'accent') {
        return (
            <button
                className={`${base} text-ink-950`}
                style={{ backgroundColor: accent || '#dc2626' }}
                {...rest}
            >
                {children}
            </button>
        );
    }
    if (variant === 'ghost') {
        return <button className={`${base} border border-white/10 hover:border-white/25 text-ink-200 hover:text-ink-50`} {...rest}>{children}</button>;
    }
    if (variant === 'danger-ghost') {
        return <button className={`${base} border border-red-500/30 hover:border-red-500/60 text-red-300`} {...rest}>{children}</button>;
    }
    return <button className={`${base} bg-ember-600 hover:bg-ember-500 text-white`} {...rest}>{children}</button>;
}

/* ---- EmptyState ---- */
export function EmptyState({
    icon, title, hint, cta,
}: {
    icon: ReactNode;
    title: string;
    hint: string;
    cta?: ReactNode;
}) {
    return (
        <div className="flex flex-col items-center justify-center text-center py-12 border border-dashed border-white/10 rounded-xl">
            <div className="text-ink-400 mb-4">{icon}</div>
            <p className="text-ink-50 text-sm mb-1">{title}</p>
            <p className="font-mono text-[10px] text-ink-400 tracking-widest uppercase mb-5 max-w-xs leading-relaxed">{hint}</p>
            {cta}
        </div>
    );
}

/* ---- StepHint: "1 → 2 → 3" flow guide ---- */
export function StepHint({ steps, accent = '#dc2626' }: { steps: string[]; accent?: string }) {
    return (
        <div className="flex flex-wrap items-center gap-x-3 gap-y-1 font-mono text-[10px] tracking-widest uppercase text-ink-400">
            {steps.map((s, i) => (
                <span key={i} className="flex items-center gap-3">
                    <span className="flex items-center gap-1.5">
                        <span className="font-bold" style={{ color: accent }}>{i + 1}</span>
                        {s}
                    </span>
                    {i < steps.length - 1 && <span className="text-ink-700">→</span>}
                </span>
            ))}
        </div>
    );
}

/* ---- Segmented control ---- */
export function Segmented<T extends string>({
    options, value, onChange, accent = '#dc2626',
}: {
    options: { value: T; label: string }[];
    value: T;
    onChange: (v: T) => void;
    accent?: string;
}) {
    return (
        <div className="w-full overflow-x-auto no-scrollbar -mx-0.5 px-0.5">
            <div className="inline-flex min-w-full sm:min-w-0 bg-white/5 rounded-xl sm:rounded-full p-1 gap-1">
                {options.map((o) => {
                    const active = o.value === value;
                    return (
                        <button
                            key={o.value}
                            type="button"
                            onClick={() => onChange(o.value)}
                            className={`flex-1 sm:flex-none whitespace-nowrap px-3 sm:px-4 py-2.5 sm:py-1.5 rounded-lg sm:rounded-full text-[12px] sm:text-[11px] font-medium sm:font-mono sm:tracking-widest sm:uppercase transition-colors min-h-[44px] sm:min-h-0 ${
                                active ? 'text-ink-950' : 'text-ink-400 hover:text-ink-50'
                            }`}
                            style={active ? { backgroundColor: accent } : undefined}
                        >
                            {o.label}
                        </button>
                    );
                })}
            </div>
        </div>
    );
}
