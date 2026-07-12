import { motion } from 'framer-motion';
import { ArrowRight, Check, X, Radar, Scale, AudioWaveform, Swords } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import MarketingNav from '../components/MarketingNav';
import { useSmoothScroll } from '../lib/useSmoothScroll';

/* ============================================================
   FEATURES — "SOVEREIGN PLAYBOOK" (Design System v2)
   All claims below are accurate to the shipped product.
============================================================ */

const FEATURES = [
    {
        icon: Radar,
        accent: 'var(--color-radar)',
        title: 'GIG RADAR ARRAY',
        tagline: 'Verified rooms. Not rumors.',
        desc: 'The Radar pulls live ticketing data to find venues actively booking your genre — real rooms with real upcoming shows, not scraped lists or stale directories. An AI strategy layer then prices every target: payout structure, artist-fairness reputation, booking lead time, and the leverage angle for your pitch.',
        bullets: [
            'Live Ticketmaster event data — every target verified active',
            'Reputation scores + payout models on every venue',
            'Leverage angles referencing real upcoming dates',
            'One-tap pitch drafts: email, call script, or DM (~2s)',
            'Full venue scan measured ~8s on production',
        ],
        image: '/site/gig_radar_mockup.png',
    },
    {
        icon: Swords,
        accent: 'var(--color-shark)',
        title: 'SHARK PROTOCOL',
        tagline: 'Your negotiator never sleeps.',
        desc: 'Trained on the predatory tactics promoters actually use, the Shark reads every offer, prices your leverage against the room, and drafts the counter before you lose momentum. Flat-fee lowballs, merch-cut grabs, and pay-to-play packages get named and countered — in your voice.',
        bullets: [
            'Offer decomposition against venue economics',
            'Counters drafted in ~2s — email, call script, or DM',
            'Tone-calibrated: firm, professional, no bridges burned',
            'Paired with Radar intel for maximum leverage',
        ],
        image: null,
        reverse: true,
    },
    {
        icon: AudioWaveform,
        accent: 'var(--color-audio)',
        title: 'AUDIO MASTER CORE',
        tagline: 'Platinum fidelity on command.',
        desc: 'Drop your mix and a reference record. The Core matches RMS, EQ curve, loudness and stereo field to the reference with real DSP — then finishes through a Sub / Air / Snap / Width control stage and a true-peak limiter at streaming standard. The Oracle listens first and recommends the exact settings your mix needs.',
        bullets: [
            'Reference-matched mastering engine (real DSP, not presets)',
            'Oracle mix analysis in ~7s with recommended settings',
            'True-peak limiting at −1.0 dBTP streaming standard',
            'Full-song masters measured ~35s live',
        ],
        image: '/site/neural_audio_mockup.png',
        reverse: false,
    },
    {
        icon: Scale,
        accent: 'var(--color-zion)',
        title: 'ZION LEGAL SENTINEL',
        tagline: 'Read the trap before you sign it.',
        desc: 'Upload any contract — PDF, DOCX, or pasted text. Zion forensically dissects it clause by clause: recoupment traps, perpetual licensing grabs, delayed-payout games, and AI voice-cloning rights get flagged and translated into plain language, with the industry codex built in.',
        bullets: [
            'Clause-level predatory-language detection (~3s live)',
            'PDF / DOCX / raw text ingestion',
            'Plain-language translation of legalese',
            '32-term industry codex + recoupment sandbox',
        ],
        image: '/site/zion_defense_mockup.png',
        reverse: true,
    },
];

const COMPARISON = [
    {
        capability: 'Booking Intelligence',
        old: 'Manual research, cold emails, stale contact lists',
        engine: 'Live-verified venues + AI leverage intel + drafted pitches',
    },
    {
        capability: 'Legal Defense',
        old: '$450/hr retainer attorney, days of turnaround',
        engine: 'Forensic contract scan in ~3s, plain-language flags',
    },
    {
        capability: 'Mastering',
        old: '$100–500 per track, weeks of back-and-forth',
        engine: 'Reference-matched full master in ~35s live',
    },
    {
        capability: 'Negotiation',
        old: 'Take the offer or lose the room',
        engine: 'Every offer decomposed and countered in ~2–3s',
    },
    {
        capability: 'Revenue Split',
        old: '15–20% to management, forever',
        engine: '100% yours. The Engine takes nothing.',
    },
];

export default function FeaturesPage() {
    const navigate = useNavigate();
    useSmoothScroll();

    return (
        <div className="min-h-screen bg-ink-950 text-ink-50 overflow-x-hidden relative">
            <MarketingNav />

            {/* Ambient glows */}
            <div className="absolute inset-0 z-0 pointer-events-none overflow-hidden">
                <div className="absolute top-[8%] left-[8%] w-[700px] h-[700px] bg-ember-600/10 rounded-full blur-[140px]" />
                <div className="absolute bottom-[15%] right-[5%] w-[700px] h-[700px] bg-audio/5 rounded-full blur-[140px]" />
            </div>

            <main className="relative z-10 max-w-7xl mx-auto px-6 md:px-10 pt-36 md:pt-44 pb-24">

                {/* ===== Hero ===== */}
                <motion.div
                    initial={{ opacity: 0, y: 24 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.8, ease: 'easeOut' }}
                    className="mb-28 md:mb-36"
                >
                    <p className="font-mono text-[10px] tracking-[0.35em] text-ember-500 uppercase mb-5">
                        System architecture · v3
                    </p>
                    <h1 className="text-cinema text-5xl md:text-7xl max-w-4xl mb-8">
                        The sovereign<br />playbook.
                    </h1>
                    <p className="max-w-2xl text-ink-200 font-light leading-relaxed text-base md:text-lg">
                        The Artist Engine is an autonomous agency replacement — booking intelligence,
                        negotiation, legal defense, and mastering in one system. No manager, no retainer,
                        no percentage. You keep the masters and the money.
                    </p>
                </motion.div>

                {/* ===== Feature deep-dives ===== */}
                <div className="space-y-28 md:space-y-40">
                    {FEATURES.map((feat) => {
                        const Icon = feat.icon;
                        return (
                            <motion.div
                                key={feat.title}
                                initial={{ opacity: 0, y: 50 }}
                                whileInView={{ opacity: 1, y: 0 }}
                                viewport={{ once: true, margin: '-100px' }}
                                transition={{ duration: 0.8, ease: 'easeOut' }}
                                className={`flex flex-col ${feat.reverse ? 'lg:flex-row-reverse' : 'lg:flex-row'} items-center gap-10 lg:gap-20`}
                            >
                                {/* Visual */}
                                <div className="w-full lg:w-1/2">
                                    {feat.image ? (
                                        <div className="glass-obsidian glass-obsidian-hover rounded-2xl overflow-hidden p-2">
                                            <img
                                                src={feat.image}
                                                alt={feat.title}
                                                loading="lazy"
                                                className="rounded-xl w-full object-cover"
                                            />
                                        </div>
                                    ) : (
                                        <div className="glass-obsidian glass-obsidian-hover rounded-2xl p-6 font-mono text-xs leading-relaxed">
                                            <div className="flex items-center gap-2 mb-4">
                                                <span className="h-2.5 w-2.5 rounded-full bg-ember-600" />
                                                <span className="h-2.5 w-2.5 rounded-full bg-ink-700" />
                                                <span className="h-2.5 w-2.5 rounded-full bg-ink-700" />
                                                <span className="ml-3 text-ink-400 tracking-widest uppercase text-[9px]">shark_protocol.exe</span>
                                            </div>
                                            <p className="text-ink-400">&gt; INBOUND — “Exposure gig. $100 flat. You cover travel.”</p>
                                            <p className="text-ember-400 mt-3">&gt; PATTERN MATCH: “exposure” + sub-market flat = predatory class 2.</p>
                                            <p className="text-ember-400">&gt; ROOM ECONOMICS: 350 cap × $18 avg = $6,300 gross potential.</p>
                                            <p className="text-ink-50 mt-3">&gt; COUNTER: $350 guarantee + 20% door after 150 heads. Sent.
                                                <span className="inline-block w-2 h-4 bg-ember-500 ml-1 animate-pulse align-middle" />
                                            </p>
                                        </div>
                                    )}
                                </div>

                                {/* Copy */}
                                <div className="w-full lg:w-1/2">
                                    <div className="flex items-center gap-4 mb-6">
                                        <Icon size={22} style={{ color: feat.accent }} />
                                        <span className="font-mono text-[10px] tracking-[0.3em] uppercase" style={{ color: feat.accent }}>
                                            {feat.title}
                                        </span>
                                    </div>
                                    <h2 className="text-cinema text-3xl md:text-5xl mb-6">{feat.tagline}</h2>
                                    <p className="text-ink-200 font-light leading-relaxed mb-8">{feat.desc}</p>
                                    <ul className="space-y-3.5">
                                        {feat.bullets.map((b) => (
                                            <li key={b} className="flex items-start gap-3 text-sm text-ink-200">
                                                <Check size={15} className="mt-0.5 shrink-0" style={{ color: feat.accent }} />
                                                {b}
                                            </li>
                                        ))}
                                    </ul>
                                </div>
                            </motion.div>
                        );
                    })}
                </div>

                {/* ===== Comparison ===== */}
                <motion.div
                    initial={{ opacity: 0, y: 50 }}
                    whileInView={{ opacity: 1, y: 0 }}
                    viewport={{ once: true }}
                    transition={{ duration: 0.8 }}
                    className="mt-32 md:mt-44"
                >
                    <div className="mb-14">
                        <p className="font-mono text-[10px] tracking-[0.35em] text-ember-500 uppercase mb-4">The brutal reality</p>
                        <h2 className="text-cinema text-4xl md:text-6xl">
                            The old model,<br />retired.
                        </h2>
                    </div>

                    <div className="glass-obsidian rounded-2xl overflow-hidden">
                        {/* Header row */}
                        <div className="hidden md:grid grid-cols-[1.2fr_2fr_2fr] border-b hairline">
                            <div className="p-5 font-mono text-[10px] tracking-[0.3em] uppercase text-ink-400">Capability</div>
                            <div className="p-5 font-mono text-[10px] tracking-[0.3em] uppercase text-ink-400 border-l hairline">Traditional agency</div>
                            <div className="p-5 font-mono text-[10px] tracking-[0.3em] uppercase text-ember-500 border-l hairline">The Artist Engine</div>
                        </div>
                        {COMPARISON.map((row, i) => (
                            <div
                                key={row.capability}
                                className={`grid md:grid-cols-[1.2fr_2fr_2fr] ${i < COMPARISON.length - 1 ? 'border-b hairline' : ''}`}
                            >
                                <div className="p-5 pb-1 md:pb-5 font-display font-medium text-ink-50">{row.capability}</div>
                                <div className="p-5 py-2 md:py-5 md:border-l hairline flex items-start gap-3 text-sm text-ink-400">
                                    <X size={15} className="mt-0.5 shrink-0 text-ink-700" />
                                    {row.old}
                                </div>
                                <div className="p-5 pt-2 md:pt-5 md:border-l hairline flex items-start gap-3 text-sm text-ink-200">
                                    <Check size={15} className="mt-0.5 shrink-0 text-ember-500" />
                                    {row.engine}
                                </div>
                            </div>
                        ))}
                    </div>
                </motion.div>

                {/* ===== CTA ===== */}
                <motion.div
                    initial={{ opacity: 0, y: 30 }}
                    whileInView={{ opacity: 1, y: 0 }}
                    viewport={{ once: true }}
                    transition={{ duration: 0.8 }}
                    className="mt-32 md:mt-44 text-center relative"
                >
                    <div className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 w-[560px] h-[560px] rounded-full bg-ember-600/10 blur-[110px] pointer-events-none" />
                    <h2 className="relative text-cinema text-4xl md:text-6xl mb-10">
                        Fire your middlemen.
                    </h2>
                    <button
                        onClick={() => navigate('/login')}
                        className="group relative overflow-hidden rounded-full bg-ember-600 hover:bg-ember-500 transition-colors px-10 py-5 halo-ember"
                    >
                        <span className="relative flex items-center justify-center gap-3 font-display font-medium tracking-wide text-white text-lg">
                            Log in / Sign up
                            <ArrowRight size={20} className="group-hover:translate-x-1.5 transition-transform" />
                        </span>
                    </button>
                </motion.div>
            </main>

            {/* Footer */}
            <footer className="relative z-10 border-t hairline py-8">
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
