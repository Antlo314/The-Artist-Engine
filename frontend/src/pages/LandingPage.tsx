import { useEffect, useRef, Suspense, lazy } from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowRight, ArrowDown, Radar, Scale, AudioWaveform, Handshake, Users } from 'lucide-react';
import MarketingNav from '../components/MarketingNav';
// Three.js vinyl is heavy — load after first paint so LCP isn't blocked.
const VinylScene = lazy(() => import('../components/three/VinylScene'));
import { useSmoothScroll, gsap, ScrollTrigger } from '../lib/useSmoothScroll';

/* ============================================================
   THE SOURCE ENGINE — Landing · thesourceengine.com
   Dark cinematic hero (procedural 3D vinyl) + scroll story.
============================================================ */

const PILLARS = [
    {
        id: '01',
        icon: AudioWaveform,
        accent: 'var(--color-audio)',
        name: 'STUDIO',
        headline: 'Your mix, ready to release.',
        copy: 'Upload a finished mix and the Studio masters it — balancing the tone, evening out the volume, and bringing the track up to the loudness streaming services expect. It listens first and tells you in plain words what it would change. A full song takes about 35 seconds.',
        bullets: ['Simple sliders: bass, sparkle, punch, width', 'A/B your original against the master', 'WAV · MP3 · FLAC in about 35 seconds'],
        image: '/site/neural_audio_mockup.png',
    },
    {
        id: '02',
        icon: Radar,
        accent: 'var(--color-radar)',
        name: 'FIND GIGS',
        headline: 'Real venues, in about 8 seconds.',
        copy: 'Tell it your city, your genre, and how big a room you want to play. It searches live ticketing and touring data for venues actually booking your kind of music, then adds an estimate of what each room pays, how far ahead it books, and who to contact.',
        bullets: ['Live ticketing and touring data', 'Pay estimates and a contact where one is public', 'Every venue saved to your Roster'],
        image: '/site/gig_radar_mockup.png',
    },
    {
        id: '03',
        icon: Handshake,
        accent: 'var(--color-shark)',
        name: 'PITCH & DEALS',
        headline: 'The email, written. The offer, read.',
        copy: 'Pick a venue and get a booking email, call script, or DM drafted in your voice, with your bio and links already in it. Paste in an offer and get a plain-word read on it — including deals that quietly take more than they give. Put two offers side by side and see which one treats you better.',
        bullets: ['Email · call script · DM in about 2 seconds', 'A plain-word read on any offer you get', 'Two offers compared side by side'],
        image: null,
        mock: {
            label: 'An offer, read out loud',
            footer: 'Drafted for you in about 2 seconds',
            lines: [
                { tone: 'quiet', text: 'They offered: “$150 flat, 90-minute set, and we take 30% of your merch.”' },
                { tone: 'warn', text: 'That is below the going rate for a room this size — and a 30% merch cut is steep.' },
                { tone: 'warn', text: 'You have room to ask: they have a Thursday to fill.' },
                { tone: 'good', text: 'Suggested reply: $400 guaranteed, plus a share of the door after 200 tickets.' },
            ],
        },
    },
    {
        id: '04',
        icon: Scale,
        accent: 'var(--color-zion)',
        name: 'CONTRACTS',
        headline: 'Know what it says before you sign.',
        copy: 'Drop in a PDF, a Word file, or pasted text. It reads the contract clause by clause and flags the terms that commonly hurt artists — signing your recordings away forever, paying the label back out of your own share, long waits before money reaches you — and explains each one in plain words. It is a first read, not legal advice.',
        bullets: ['PDF · Word · pasted text', 'Clause-by-clause flags in about 3 seconds', 'Plain-English dictionary, advance calculator, split sheets'],
        image: '/site/zion_defense_mockup.png',
    },
    {
        id: '05',
        icon: Users,
        accent: 'var(--color-ember-500)',
        name: 'ROSTER',
        headline: 'Everyone you know, in one place.',
        copy: 'Your address book and your to-do list. Every venue you find lands here as a lead you can move from found, to pitched, to talking, to booked. Add the booker you met at a show by hand. And when someone asks for a press kit, build one from your public releases.',
        bullets: ['A pipeline that reflects what is really happening', 'Tasks tied to a specific venue', 'A press kit built from your releases'],
        image: null,
        mock: {
            label: 'Your pipeline, honestly',
            footer: 'Yours to export any time',
            lines: [
                { tone: 'quiet', text: 'Found — The Echo Room, Atlanta · holds 350' },
                { tone: 'quiet', text: 'Pitched — Blue Room, Nashville · emailed Tuesday' },
                { tone: 'warn', text: 'Talking — The Hall, Charlotte · they asked for a date' },
                { tone: 'good', text: 'Booked — Bell House, Richmond · March 14' },
            ],
        },
    },
];

const STATS = [
    { value: 230, suffix: 'K+', label: 'live events to search' },
    { value: 35, suffix: 's', label: 'to master a full song' },
    { value: 8, suffix: 's', label: 'to search for venues' },
    { value: 2, suffix: 's', label: 'to draft a pitch' },
];

const MARQUEE = ['GIGS', 'MASTERS', 'PITCHES', 'CONTRACTS', 'CONTACTS'];

export default function LandingPage() {
    const navigate = useNavigate();
    const root = useRef<HTMLDivElement>(null);
    useSmoothScroll();

    useEffect(() => {
        const ctx = gsap.context(() => {
            // Hero entrance — staggered word reveal
            gsap.fromTo('.hero-word',
                { yPercent: 40, opacity: 0 },
                { yPercent: 0, opacity: 1, duration: 0.9, stagger: 0.07, ease: 'power3.out', delay: 0.12 }
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
        <div ref={root} className="min-h-screen bg-ink-950 text-ink-50 overflow-x-hidden relative pb-20 md:pb-0">
            <MarketingNav />

            {/* ============ HERO ============ */}
            <section className="relative min-h-[100svh] min-h-[100dvh] grain overflow-x-hidden pt-20 pb-16 md:pb-10">
                {/* 3D scene — desktop only (heavy WebGL hurts mobile LCP) */}
                <div className="absolute inset-0 md:left-[28%] z-0 opacity-0 md:opacity-100 pointer-events-none hidden md:block">
                    <Suspense fallback={<div className="absolute inset-0 bg-ink-950" />}>
                        <VinylScene />
                    </Suspense>
                </div>
                {/* Mobile: static ember gradient instead of 3D */}
                <div className="theme-hero-mobile absolute inset-0 z-0 md:hidden bg-[radial-gradient(ellipse_at_70%_20%,_#3f0a0a_0%,_#08080a_55%,_#060607_100%)]" />
                {/* Cinematic gradients over the scene */}
                <div className="theme-hero-scrim absolute inset-0 z-[1] pointer-events-none bg-gradient-to-r from-ink-950 via-ink-950/80 to-ink-950/50 md:via-ink-950/40 md:to-transparent" />
                <div className="absolute inset-x-0 bottom-0 h-40 z-[1] pointer-events-none bg-gradient-to-t from-ink-950 to-transparent" />
                <div className="absolute inset-x-0 top-0 h-24 z-[1] pointer-events-none bg-gradient-to-b from-ink-950/90 to-transparent" />

                {/* Copy */}
                <div className="relative z-10 max-w-7xl mx-auto px-5 sm:px-6 md:px-10 flex flex-col justify-center min-h-[calc(100svh-5rem)]">
                    <div className="hero-fade mb-5 md:mb-8 flex items-center gap-3">
                        <span className="inline-flex h-2 w-2 rounded-full bg-ember-500 animate-pulse" />
                        <span className="font-mono text-[10px] tracking-[0.25em] md:tracking-[0.35em] text-ink-400 uppercase">
                            thesourceengine.com · Live
                        </span>
                    </div>

                    {/* line-height + padding fix: overflow-hidden + tight cinema tracking was clipping "artists" */}
                    <h1 className="font-display font-semibold tracking-[-0.03em] text-ink-50 max-w-5xl text-[clamp(2.35rem,8.5vw,8rem)] leading-[1.05] md:leading-[1.02]">
                        <span className="block overflow-visible pb-[0.12em]">
                            <span className="hero-word inline-block">The&nbsp;source</span>
                        </span>
                        <span className="block overflow-visible pb-[0.12em]">
                            <span className="hero-word inline-block">engine&nbsp;for</span>
                        </span>
                        <span className="block overflow-visible pb-[0.18em]">
                            <span className="hero-word inline-block text-transparent bg-clip-text bg-gradient-to-br from-ember-400 via-ember-500 to-ember-600">
                                independent
                            </span>
                        </span>
                        <span className="block overflow-visible pb-[0.2em]">
                            <span className="hero-word inline-block text-transparent bg-clip-text bg-gradient-to-br from-ember-400 via-ember-500 to-ember-600">
                                artists.
                            </span>
                        </span>
                    </h1>

                    <p className="hero-fade mt-6 md:mt-8 max-w-xl text-ink-200 text-[15px] md:text-lg font-light leading-relaxed">
                        Find real gigs, master your tracks, write the pitches, and read the
                        contracts — with your contacts and your to-do list right beside them.
                        One workspace, built for the actual job.
                    </p>

                    <div className="hero-fade mt-8 md:mt-10 flex flex-col sm:flex-row gap-3 sm:gap-4">
                        <button
                            onClick={() => navigate('/login')}
                            className="group relative overflow-hidden rounded-full bg-ember-600 hover:bg-ember-500 transition-colors px-8 py-4 halo-ember w-full sm:w-auto"
                        >
                            <span className="relative flex items-center justify-center gap-3 font-display font-medium tracking-wide text-white">
                                Log in / Sign up
                                <ArrowRight size={18} className="group-hover:translate-x-1.5 transition-transform" />
                            </span>
                        </button>
                        <button
                            onClick={() => navigate('/features')}
                            className="rounded-full border hairline hover:border-ink-400/60 transition-colors px-8 py-4 font-display font-medium tracking-wide text-ink-200 hover:text-ink-50 w-full sm:w-auto"
                        >
                            See what's inside
                        </button>
                    </div>
                </div>

                {/* Scroll cue — hide on short phones to avoid covering CTAs */}
                <div className="hero-fade absolute bottom-6 left-1/2 -translate-x-1/2 z-10 hidden sm:flex flex-col items-center gap-2 text-ink-400">
                    <span className="font-mono text-[9px] tracking-[0.3em] uppercase">Scroll</span>
                    <ArrowDown size={14} className="animate-bounce" />
                </div>
            </section>

            {/* Mobile sticky login CTA */}
            <div className="md:hidden fixed bottom-0 inset-x-0 z-40 p-3 pb-[max(0.75rem,env(safe-area-inset-bottom))] pointer-events-none">
                <button
                    onClick={() => navigate('/login')}
                    className="pointer-events-auto w-full rounded-full bg-ember-600 text-white font-display font-medium py-3.5 shadow-[0_8px_40px_rgba(220,38,38,0.45)] border border-ember-400/30"
                >
                    Log in / Sign up →
                </button>
            </div>

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
                <p className="font-mono text-[10px] tracking-[0.35em] text-ember-500 uppercase mb-4">What's inside</p>
                <h2 className="text-cinema text-4xl md:text-6xl max-w-3xl">
                    The whole job,<br />in one place.
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
                                    /* Plain-language sample card — no image needed */
                                    <div className="pillar-visual glass-obsidian glass-obsidian-hover rounded-2xl p-6 md:p-7">
                                        <p
                                            className="text-[10px] tracking-[0.25em] uppercase mb-5"
                                            style={{ color: p.accent }}
                                        >
                                            {p.mock?.label}
                                        </p>
                                        <div className="space-y-3.5">
                                            {(p.mock?.lines || []).map((line) => (
                                                <p
                                                    key={line.text}
                                                    className={`text-sm leading-relaxed pl-3 border-l-2 ${
                                                        line.tone === 'good'
                                                            ? 'text-emerald-300 border-emerald-500/50'
                                                            : line.tone === 'warn'
                                                            ? 'text-ink-50 border-ember-500/60'
                                                            : 'text-ink-300 border-white/10'
                                                    }`}
                                                >
                                                    {line.text}
                                                </p>
                                            ))}
                                        </div>
                                        <div className="mt-6 flex items-center gap-2 border-t hairline pt-4 text-ink-400 text-[11px]">
                                            <Icon size={13} style={{ color: p.accent }} /> {p.mock?.footer}
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
            <section className="finale-section relative py-28 md:py-44 grain overflow-hidden pb-28 md:pb-44">
                <div className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 w-[700px] h-[700px] rounded-full bg-ember-600/10 blur-[120px] pointer-events-none" />
                <div className="relative max-w-4xl mx-auto px-6 text-center">
                    <p className="finale-reveal font-mono text-[10px] tracking-[0.35em] text-ember-500 uppercase mb-6">
                        No label. No manager's cut.
                    </p>
                    <h2 className="finale-reveal text-cinema text-5xl md:text-7xl mb-10">
                        Run your own<br />career.
                    </h2>
                    <div className="finale-reveal flex flex-col sm:flex-row justify-center gap-4">
                        <button
                            onClick={() => navigate('/login')}
                            className="group relative overflow-hidden rounded-full bg-ember-600 hover:bg-ember-500 transition-colors px-10 py-5 halo-ember"
                        >
                            <span className="relative flex items-center justify-center gap-3 font-display font-medium tracking-wide text-white text-lg">
                                Log in / Sign up
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
                        <img src="/site/logo.png" alt="The Source Engine" className="w-7 h-7 rounded-md object-cover" />
                        <div>
                            <span className="font-display font-medium tracking-wide text-ink-200 block">THE SOURCE ENGINE</span>
                            <span className="font-mono text-[9px] tracking-[0.2em] uppercase text-ink-400">www.thesourceengine.com</span>
                        </div>
                    </div>
                    <p className="font-mono text-[9px] tracking-[0.3em] uppercase text-ink-400">
                        © 2026 · The Source Engine · All rights reserved
                    </p>
                </div>
            </footer>
        </div>
    );
}
