import { type ReactNode } from 'react';

/* ============================================================
   Engine UI v3 — "Clarity Protocol" shared primitives.
   One card look, one input look, one button hierarchy.
   Cinematic video lives in PageHeader bands, never as wallpaper.
   ============================================================ */

/* ---- PageHeader: cinematic ambient band ---- */
const HEADER_VIDEO: Record<string, string | null> = {
    dashboard: '/site/soverein_server.mp4',
    radar: '/gig-radar.mp4',
    studio: '/audio-core.mp4',
    legal: '/legal-war.mp4',
    profile: null, // uses a still image instead
};

export function PageHeader({
    view, accent, module, title, desc, children,
}: {
    view: keyof typeof HEADER_VIDEO;
    accent: string;
    module: string;
    title: string;
    desc: string;
    children?: ReactNode;
}) {
    const video = HEADER_VIDEO[view];
    return (
        <div className="hud-corners relative overflow-hidden rounded-2xl border border-white/10 mb-8 h-[140px] md:h-[180px]">
            {video ? (
                <video
                    autoPlay
                    loop
                    muted
                    playsInline
                    className="absolute inset-0 w-full h-full object-cover opacity-35"
                >
                    <source src={video} type="video/mp4" />
                </video>
            ) : (
                <div
                    className="absolute inset-0 bg-cover bg-center opacity-20"
                    style={{ backgroundImage: "url('/site/light_abstract_bg_1773233140940.png')" }}
                />
            )}
            {/* Cinematic masking */}
            <div className="absolute inset-0 bg-gradient-to-r from-ink-950 via-ink-950/80 to-ink-950/30" />
            <div className="absolute inset-x-0 bottom-0 h-20 bg-gradient-to-t from-ink-950 to-transparent" />

            <div className="relative z-10 h-full flex items-end justify-between p-6 md:p-8 gap-4">
                <div className="min-w-0">
                    <p className="font-mono text-[10px] tracking-[0.3em] uppercase mb-2" style={{ color: accent }}>
                        {module}
                    </p>
                    <h1 className="font-display text-3xl md:text-4xl font-semibold text-ink-50 tracking-tight">{title}</h1>
                    <p className="text-ink-200 font-light text-sm mt-1.5 max-w-xl">{desc}</p>
                </div>
                {children && <div className="shrink-0 hidden sm:block">{children}</div>}
            </div>

            {/* HUD meter line */}
            <div className="absolute bottom-0 inset-x-0 h-px bg-white/10 z-10">
                <div className="h-full w-1/5" style={{ backgroundColor: accent }} />
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
                            <p className="font-mono text-[10px] tracking-[0.2em] uppercase mt-0.5 truncate" style={{ color: accent || '#8a8a93' }}>
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
            {hint && <span className="text-[11px] text-ink-700">{hint}</span>}
        </label>
    );
}

/** Shared input/select className recipe. Pass an accent hex for focus ring color. */
export function inputCls(accent = '#dc2626') {
    // accent only tints focus; kept as inline style at call sites where needed.
    void accent;
    return 'bg-ink-900 border border-white/10 rounded-lg px-3.5 py-2.5 text-ink-50 placeholder:text-ink-700 text-sm focus:outline-none focus:border-white/30 transition-colors w-full';
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
            <div className="text-ink-700 mb-4">{icon}</div>
            <p className="text-ink-200 text-sm mb-1">{title}</p>
            <p className="font-mono text-[10px] text-ink-700 tracking-widest uppercase mb-5 max-w-xs">{hint}</p>
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
        <div className="inline-flex bg-white/5 rounded-full p-1 gap-1">
            {options.map((o) => {
                const active = o.value === value;
                return (
                    <button
                        key={o.value}
                        onClick={() => onChange(o.value)}
                        className={`px-4 py-1.5 rounded-full font-mono text-[11px] tracking-widest uppercase transition-colors ${active ? 'text-ink-950' : 'text-ink-400 hover:text-ink-50'}`}
                        style={active ? { backgroundColor: accent } : undefined}
                    >
                        {o.label}
                    </button>
                );
            })}
        </div>
    );
}
