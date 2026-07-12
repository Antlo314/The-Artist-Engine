import { useEffect, useRef, Suspense, lazy } from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowRight, ArrowDown, Radar, Scale, AudioWaveform, Swords } from 'lucide-react';
import MarketingNav from '../components/MarketingNav';
// Three.js vinyl is heavy — load after first paint so LCP isn't blocked.
const VinylScene = lazy(() => import('../components/three/VinylScene'));
import { useSmoothScroll, gsap, ScrollTrigger } from '../lib/useSmoothScroll';

/* ============================================================
   THE ARTIST ENGINE — Landing v2 "SOVEREIGN CINEMA"
   Dark cinematic hero (procedural 3D vinyl) + scroll story.
============================================================ */

const PILLARS = [
    {
        id: '01',
        icon: AudioWaveform,
        accent: '#22d3ee',
        name: 'AUDIO MASTER CORE',
        headline: 'Commercial masters. ~35 seconds.',
        copy: 'Reference-matched mastering driven by real DSP — RMS, EQ curve, loudness and stereo field matched to any record you point it at. Full songs measure ~35s live — faster than typical online mastering waits.',
        bullets: ['Reference-match engine', 'Sub / Air / Snap / Width controls', 'WAV · MP3 · FLAC in ~35s'],
        image: '/site/neural_audio_mockup.png',
    },
    {
        id: '02',
        icon: Radar,
        accent: '#fb923c',
        name: 'GIG RADAR ARRAY',
        headline: 'Real venues. Verified in ~8s.',
        copy: 'The war room scans live ticketing data for rooms actively booking your genre — then layers AI strategy on every verified target: payout models, reputation scores, leverage angles, and who to talk to. Full scans measure ~8 seconds live.',
        bullets: ['Ticketmaster-verified targets', 'Reputation + payout intel', 'Pitches in ~2s — email, call, DM'],
        image: '/site/gig_radar_mockup.png',
    },
    {
        id: '03',
        icon: Swords,
        accent: '#f4f4f5',
        name: 'SHARK PROTOCOL',
        headline: 'Every offer, countered.',
        copy: 'An AI negotiator trained on predatory industry tactics reads every promoter offer, prices your leverage, and drafts the counter — email, call script, or DM — in your voice, before you lose the room. Counters land in ~2–3 seconds.',
        bullets: ['Offer decomposition', 'Leverage-priced counters', 'Email · Call · DM in ~2s'],
        image: null,
    },
    {
        id: '04',
        icon: Scale,
        accent: '#a78bfa',
        name: 'ZION LEGAL SENTINEL',
        headline: 'Predatory clauses, flagged in ~3s.',
        copy: 'Forensic contract analysis across PDF, DOCX, or raw text. Recoupment traps, perpetuity grabs, and 180-day payout games get flagged and translated into plain language — before you sign. Measured ~3 seconds live.',
        bullets: ['PDF / DOCX / text ingestion', 'Clause-level risk flags', 'Plain-language in ~3s'],
        image: '/site/zion_defense_mockup.png',
    },
];

const STATS = [
    { value: 230, suffix: 'K+', label: 'live events searchable' },
    { value: 35, suffix: 's', label: 'avg full-song master' },
    { value: 8, suffix: 's', label: 'avg venue scan' },
    { value: 2, suffix: 's', label: 'avg call script' },
];

const MARQUEE = ['MASTER', 'SCOUT', 'NEGOTIATE', 'PROTECT'];

export default function LandingPage() {
    const navigate = useNavigate();
    const root = useRef<HTMLDivElement>(null);
    useSmoothScroll();

    useEffect(() => {
        const ctx = gsap.context(() => {
            // Hero entrance — staggered word reveal
            gsap.fromTo('.hero-word',
                { yPercent: 110, opacity: 0 },
                { yPercent: 0, opacity: 1, duration: 1.1, stagger: 0.08, ease: 'power4.out', delay: 0.15 }
            );
            gsap.fromTo('.hero-fade',
                { y: 24, opacity: 0 },
                { y: 0, opacity: 1, duration: 0.9, stagger: 0.12, ease: 'power3.out', delay: 0.7 }
            );

            // Pillar sections — content + image reveals
            gsap.utils.toArray<HTMLElement>('.pillar-section').forEach((section) => {
                gsap.fromTo(section.querySelectorAll('.pillar-reveal'),
                    { y: 60, opacity: 0 },
                    {
                        y: 0, opacity: 1, duration: 1, stagger: 0.12, ease: 'power3.out',
                        scrollTrigger: { trigger: section, start: 'top 65%' },
                    }
                );
                const img = section.querySelector('.pillar-visual');
                if (img) {
                    gsap.fromTo(img,
                        { yPercent: 10, scale: 0.96 },
                        {
                            yPercent: -10, scale: 1, ease: 'none',
                            scrollTrigger: { trigger: section, start: 'top bottom', end: 'bottom top', scrub: 1.2 },
                        }
                    );
                }
            });

            // Stats counters
            gsap.utils.toArray<HTMLElement>('.stat-num').forEach((el) => {
                const target = Number(el.dataset.value || 0);
                const obj = { n: 0 };
                gsap.to(obj, {
                    n: target, duration: 1.8, ease: 'power2.out',
                    scrollTrigger: { trigger: el, start: 'top 85%' },
                    onUpdate: () => { el.textContent = String(Math.round(obj.n)); },
                });
            });

            // Finale headline
            gsap.fromTo('.finale-reveal',
                { y: 50, opacity: 0 },
                {
                    y: 0, opacity: 1, duration: 1, stagger: 0.1, ease: 'power3.out',
                    scrollTrigger: { trigger: '.finale-section', start: 'top 70%' },
                }
            );
        }, root);

        // Recalculate positions after fonts/images settle
        const t = setTimeout(() => ScrollTrigger.refresh(), 600);
        return () => { clearTimeout(t); ctx.revert(); };
    }, []);

    return (
        <div ref={root} className="min-h-screen bg-ink-950 text-ink-50 overflow-x-hidden relative">
            <MarketingNav />

            {/* ============ HERO ============ */}
            <section className="relative h-[100svh] min-h-[640px] grain overflow-hidden">
                {/* 3D scene */}
                <div className="absolute inset-0 md:left-[28%] z-0 opacity-80 md:opacity-100">
                    <Suspense fallback={<div className="absolute inset-0 bg-ink-950" />}>
                        <VinylScene />
                    </Suspense>
                </div>
                {/* Cinematic gradients over the scene */}
                <div className="absolute inset-0 z-[1] pointer-events-none bg-gradient-to-r from-ink-950 via-ink-950/70 to-transparent md:via-ink-950/40" />
                <div className="absolute inset-x-0 bottom-0 h-40 z-[1] pointer-events-none bg-gradient-to-t from-ink-950 to-transparent" />
                <div className="absolute inset-x-0 top-0 h-24 z-[1] pointer-events-none bg-gradient-to-b from-ink-950/90 to-transparent" />

                {/* Copy */}
                <div className="relative z-10 h-full max-w-7xl mx-auto px-6 md:px-10 flex flex-col justify-center">
                    <div className="hero-fade mb-8 flex items-center gap-3">
                        <span className="inline-flex h-2 w-2 rounded-full bg-ember-500 animate-pulse" />
                        <span className="font-mono text-[10px] tracking-[0.35em] text-ink-400 uppercase">
                            Sovereign Protocol · v3 · Live
                        </span>
                    </div>

                    <h1 className="text-cinema text-[clamp(3.2rem,9.5vw,8.5rem)] text-ink-50 max-w-5xl">
                        <span className="block overflow-hidden pb-1">
                            <span className="hero-word inline-block">The&nbsp;operating</span>
                        </span>
                        <span className="block overflow-hidden pb-1">
                            <span className="hero-word inline-block">system&nbsp;for</span>
                        </span>
                        <span className="block overflow-hidden pb-2">
                            <span className="hero-word inline-block text-transparent bg-clip-text bg-gradient-to-br from-ember-400 via-ember-500 to-ember-600">
                                sovereign&nbsp;artists.
                            </span>
                        </span>
                    </h1>

                    <p className="hero-fade mt-8 max-w-xl text-ink-200 text-base md:text-lg font-light leading-relaxed">
                        Master your records. Find real rooms. Counter every offer.
                        Kill predatory contracts. One engine — no middlemen.
                    </p>

                    <div className="hero-fade mt-10 flex flex-col sm:flex-row gap-4">
                        <button
                            onClick={() => navigate('/login')}
                            className="group relative overflow-hidden rounded-full bg-ember-600 hover:bg-ember-500 transition-colors px-8 py-4 halo-ember"
                        >
                            <span className="relative flex items-center justify-center gap-3 font-display font-medium tracking-wide text-white">
                                Enter the Engine
                                <ArrowRight size={18} className="group-hover:translate-x-1.5 transition-transform" />
                            </span>
                        </button>
                        <button
                            onClick={() => navigate('/features')}
                            className="rounded-full border hairline hover:border-ink-400/60 transition-colors px-8 py-4 font-display font-medium tracking-wide text-ink-200 hover:text-white"
                        >
                            View Architecture
                        </button>
                    </div>
                </div>

                {/* Scroll cue */}
                <div className="hero-fade absolute bottom-8 left-1/2 -translate-x-1/2 z-10 flex flex-col items-center gap-2 text-ink-400">
                    <span className="font-mono text-[9px] tracking-[0.3em] uppercase">Scroll</span>
                    <ArrowDown size={14} className="animate-bounce" />
                </div>
            </section>

            {/* ============ MARQUEE ============ */}
            <section className="relative border-y hairline bg-ink-900/60 py-5 overflow-hidden">
                <div className="marquee-track">
                    {[0, 1].map((dup) => (
                        <div key={dup} className="flex items-center shrink-0">
                            {Array.from({ length: 4 }).flatMap((_, rep) =>
                                MARQUEE.map((word, i) => (
                                    <span key={`${dup}-${rep}-${i}`} className="flex items-center">
                                        <span className="font-display font-semibold text-2xl md:text-3xl tracking-tight text-ink-50/90 px-6">
                                            {word}
                                        </span>
                                        <span className="text-ember-600 text-xl">✦</span>
                                    </span>
                                ))
                            )}
                        </div>
                    ))}
                </div>
            </section>

            {/* ============ PILLARS ============ */}
            <section className="relative max-w-7xl mx-auto px-6 md:px-10 pt-28 pb-8">
                <p className="font-mono text-[10px] tracking-[0.35em] text-ember-500 uppercase mb-4">The four pillars</p>
                <h2 className="text-cinema text-4xl md:text-6xl max-w-3xl">
                    An entire back office,<br />running autonomously.
                </h2>
            </section>

            {PILLARS.map((p, idx) => {
                const Icon = p.icon;
                const flip = idx % 2 === 1;
                return (
                    <section key={p.id} className="pillar-section relative max-w-7xl mx-auto px-6 md:px-10 py-20 md:py-28">
                        <div className={`grid md:grid-cols-2 gap-10 md:gap-16 items-center ${flip ? 'md:[direction:rtl]' : ''}`}>
                            {/* Copy */}
                            <div className="[direction:ltr]">
                                <div className="pillar-reveal flex items-center gap-4 mb-6">
                                    <span className="font-mono text-xs text-ink-400">{p.id}</span>
                                    <span className="h-px w-10" style={{ backgroundColor: p.accent }} />
                                    <span className="font-mono text-[10px] tracking-[0.3em] uppercase" style={{ color: p.accent }}>
                                        {p.name}
                                    </span>
                                </div>
                                <h3 className="pillar-reveal text-cinema text-3xl md:text-5xl mb-6">{p.headline}</h3>
                                <p className="pillar-reveal text-ink-200 font-light leading-relaxed max-w-lg mb-8">{p.copy}</p>
                                <ul className="pillar-reveal space-y-3">
                                    {p.bullets.map((b) => (
                                        <li key={b} className="flex items-center gap-3 text-sm text-ink-200">
                                            <span className="h-1.5 w-1.5 rounded-full" style={{ backgroundColor: p.accent }} />
                                            {b}
                                        </li>
                                    ))}
                                </ul>
                            </div>

                            {/* Visual */}
                            <div className="[direction:ltr] pillar-reveal">
                                {p.image ? (
                                    <div className="pillar-visual glass-obsidian glass-obsidian-hover rounded-2xl overflow-hidden p-2">
                                        <img
                                            src={p.image}
                                            alt={p.name}
                                            loading="lazy"
                                            className="rounded-xl w-full object-cover"
                                        />
                                    </div>
                                ) : (
                                    /* Shark Protocol — live terminal card */
                                    <div className="pillar-visual glass-obsidian glass-obsidian-hover rounded-2xl p-6 font-mono text-xs leading-relaxed">
                                        <div className="flex items-center gap-2 mb-4">
                                            <span className="h-2.5 w-2.5 rounded-full bg-ember-600" />
                                            <span className="h-2.5 w-2.5 rounded-full bg-ink-700" />
                                            <span className="h-2.5 w-2.5 rounded-full bg-ink-700" />
                                            <span className="ml-3 text-ink-400 tracking-widest uppercase text-[9px]">shark_protocol.exe</span>
                                        </div>
                                        <p className="text-ink-400">&gt; OFFER RECEIVED — “$150 flat, 90-min set, merch cut 30%”</p>
                                        <p className="text-ember-400 mt-3">&gt; ANALYSIS: below market for verified 450-cap room.</p>
                                        <p className="text-ember-400">&gt; LEVERAGE: Thursday cancellation. They need you.</p>
                                        <p className="text-ink-50 mt-3">&gt; COUNTER DRAFTED: $400 guarantee + door split after 200
                                            <span className="inline-block w-2 h-4 bg-ember-500 ml-1 animate-pulse align-middle" />
                                        </p>
                                        <div className="mt-6 flex items-center justify-between border-t hairline pt-4">
                                            <div className="flex items-center gap-2 text-ink-400 text-[10px] tracking-widest uppercase">
                                                <Icon size={13} style={{ color: p.accent }} /> Negotiation Core
                                            </div>
                                            <span className="text-[10px] text-ember-500 tracking-widest uppercase">Armed</span>
                                        </div>
                                    </div>
                                )}
                            </div>
                        </div>
                    </section>
                );
            })}

            {/* ============ STATS ============ */}
            <section className="relative border-y hairline bg-ink-900/60">
                <div className="max-w-7xl mx-auto px-6 md:px-10 py-16 grid grid-cols-2 md:grid-cols-4 gap-10">
                    {STATS.map((s) => (
                        <div key={s.label} className="text-center md:text-left">
                            <div className="font-display font-semibold text-4xl md:text-5xl text-ink-50 tracking-tight">
                                <span className="stat-num" data-value={s.value}>0</span>
                                <span className="text-ember-500">{s.suffix}</span>
                            </div>
                            <p className="mt-2 font-mono text-[10px] tracking-[0.25em] uppercase text-ink-400">{s.label}</p>
                        </div>
                    ))}
                </div>
            </section>

            {/* ============ FINALE ============ */}
            <section className="finale-section relative py-32 md:py-44 grain overflow-hidden">
                <div className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 w-[700px] h-[700px] rounded-full bg-ember-600/10 blur-[120px] pointer-events-none" />
                <div className="relative max-w-4xl mx-auto px-6 text-center">
                    <p className="finale-reveal font-mono text-[10px] tracking-[0.35em] text-ember-500 uppercase mb-6">
                        No label. No leash.
                    </p>
                    <h2 className="finale-reveal text-cinema text-5xl md:text-7xl mb-10">
                        Run your empire<br />from one engine.
                    </h2>
                    <div className="finale-reveal flex flex-col sm:flex-row justify-center gap-4">
                        <button
                            onClick={() => navigate('/login')}
                            className="group relative overflow-hidden rounded-full bg-ember-600 hover:bg-ember-500 transition-colors px-10 py-5 halo-ember"
                        >
                            <span className="relative flex items-center justify-center gap-3 font-display font-medium tracking-wide text-white text-lg">
                                Enter the Engine
                                <ArrowRight size={20} className="group-hover:translate-x-1.5 transition-transform" />
                            </span>
                        </button>
                    </div>
                </div>
            </section>

            {/* ============ FOOTER ============ */}
            <footer className="border-t hairline py-8">
                <div className="max-w-7xl mx-auto px-6 md:px-10 flex flex-col md:flex-row items-center justify-between gap-4">
                    <div className="flex items-center gap-3">
                        <img src="/site/favicon.png" alt="Logo" className="w-6 h-6 object-contain" />
                        <span className="font-display font-medium tracking-wide text-ink-200">THE ARTIST ENGINE</span>
                    </div>
                    <p className="font-mono text-[9px] tracking-[0.3em] uppercase text-ink-400">
                        © 2026 · Sovereign Protocol · All rights reserved
                    </p>
                </div>
            </footer>
        </div>
    );
}
