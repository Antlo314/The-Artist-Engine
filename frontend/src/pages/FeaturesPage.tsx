import { motion } from 'framer-motion';
import { ArrowRight, Check, X, Radar, Scale, AudioWaveform, Handshake, Users } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import MarketingNav from '../components/MarketingNav';
import { useSmoothScroll } from '../lib/useSmoothScroll';

/* ============================================================
   FEATURES — the five rooms, in plain language.
   Every claim below is accurate to the shipped product.
============================================================ */

const FEATURES = [
    {
        icon: Radar,
        accent: 'var(--color-radar)',
        title: 'FIND GIGS',
        tagline: 'Real venues. Not rumors.',
        desc: 'Tell it your city, your genre, and how big a room you want to play. It searches live ticketing data for venues actually booking music like yours right now — not a scraped list or a stale directory. Then it adds what each room is likely to pay, who to talk to, and how far ahead they book.',
        bullets: [
            'Live ticketing data — venues marked "verified" are really selling tickets',
            'A plain-English read on how each venue pays and treats artists',
            'A contact name or booking link wherever we can find one',
            'Every venue is saved to your pipeline so nothing gets lost',
            'A full search takes about 8 seconds',
        ],
        image: '/site/gig_radar_mockup.png',
    },
    {
        icon: Handshake,
        accent: 'var(--color-shark)',
        title: 'PITCH & DEALS',
        tagline: 'Ask for the gig. Understand the offer.',
        desc: 'Your negotiation desk. Write a booking email, a call script, or a DM for any venue — carrying your bio, your city, and your streaming links automatically. Paste in an offer and get a plain-word read on what it actually costs you. Put two offers side by side and see which one treats you better.',
        bullets: [
            'Pitches drafted in about 2 seconds — email, call script, or DM',
            'Send it your way: open in your mail app, download it, or just copy',
            'Any offer read clause by clause, with a suggested way to push back',
            'Two offers compared side by side, with a fairness score on each',
        ],
        image: null,
        mock: {
            label: 'An offer, read out loud',
            lines: [
                { tone: 'quiet', text: 'They offered: “Great exposure. $100 flat. You cover travel.”' },
                { tone: 'warn', text: 'Heads up — “exposure” plus a flat fee below the going rate is a common lowball.' },
                { tone: 'warn', text: 'This room holds 350 people at about $18 a ticket. That is roughly $6,300 through the door.' },
                { tone: 'good', text: 'Suggested reply: ask for $350 guaranteed, plus 20% of the door after 150 tickets.' },
            ],
        },
        reverse: true,
    },
    {
        icon: AudioWaveform,
        accent: 'var(--color-audio)',
        title: 'STUDIO',
        tagline: 'Streaming-ready, in under a minute.',
        desc: 'Upload a finished mix and the Studio masters it — balancing the tone, evening out the volume, and bringing it up to the loudness Spotify and Apple Music expect. It listens first and tells you in plain words what it would change. Optionally point it at a favorite record and it will aim for that sound.',
        bullets: [
            'An honest read on your mix before you commit — about 7 seconds',
            'Simple controls: more or less bass, sparkle, punch, width, warmth',
            'Flip between your original and the master to hear exactly what changed',
            'Split a song into vocals, drums, bass, and everything else',
            'A full-song master takes about 35 seconds',
        ],
        image: '/site/neural_audio_mockup.png',
        reverse: false,
    },
    {
        icon: Scale,
        accent: 'var(--color-zion)',
        title: 'CONTRACTS',
        tagline: 'Know what it says before you sign it.',
        desc: 'Upload a contract as a PDF, a Word file, or pasted text. It reads the whole thing clause by clause and flags the terms that commonly work against artists — signing away your recordings forever, paying the label back out of your own share, payouts that never quite arrive. Each one is explained in plain words.',
        bullets: [
            'A full scan in about 3 seconds; a free instant check with no AI at all',
            'A fairness score, plus what each risky clause means for you',
            'A dictionary of 32 music-business terms, written for humans',
            'Work out how long an advance really takes to pay back',
            'Make a split sheet so songwriting royalties reach the right people',
        ],
        image: '/site/zion_defense_mockup.png',
        reverse: true,
    },
    {
        icon: Users,
        accent: 'var(--color-ember-500)',
        title: 'ROSTER',
        tagline: 'Everyone you know, in one place.',
        desc: 'Your address book and to-do list. Every venue you find lands here as a lead you can move from found, to pitched, to talking, to booked. Add the booker you met at a show by hand. Keep a task list tied to specific venues. And build a press kit from your public releases when someone asks for one.',
        bullets: [
            'A four-stage pipeline that reflects what is really happening',
            'Add your own contacts — not everything comes from a search',
            'A to-do list you can tie to a specific venue',
            'A press kit built from your public releases and cover art',
            'Export everything as a spreadsheet or a backup file, any time',
        ],
        image: null,
        mock: {
            label: 'Your pipeline, honestly',
            lines: [
                { tone: 'quiet', text: 'Found — The Echo Room, Atlanta · 350 cap' },
                { tone: 'quiet', text: 'Pitched — Blue Room, Nashville · emailed Tuesday' },
                { tone: 'warn', text: 'Talking — The Hall, Charlotte · they asked for a date' },
                { tone: 'good', text: 'Booked — Bell House, Richmond · March 14' },
            ],
        },
        reverse: false,
    },
];

const COMPARISON = [
    {
        capability: 'Finding shows',
        old: 'Googling venues, cold emails, contact lists from 2019',
        engine: 'Live-verified venues, what they pay, and who to ask',
    },
    {
        capability: 'Reading contracts',
        old: '$450/hr lawyer, days of waiting, still confusing',
        engine: 'A plain-language read in about 3 seconds',
    },
    {
        capability: 'Mastering',
        old: '$100–500 per track, weeks of back-and-forth',
        engine: 'A streaming-ready master in about 35 seconds',
    },
    {
        capability: 'Negotiating',
        old: 'Take the offer or lose the room',
        engine: 'Every offer explained, with a reply drafted for you',
    },
    {
        capability: 'What it costs you',
        old: '15–20% of everything, to management, forever',
        engine: 'A flat plan. You keep 100% of your money and masters.',
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
                        Everything it does
                    </p>
                    <h1 className="text-cinema text-5xl md:text-7xl max-w-4xl mb-8">
                        Five rooms.<br />One workspace.
                    </h1>
                    <p className="max-w-2xl text-ink-200 font-light leading-relaxed text-base md:text-lg">
                        Being an independent artist is five jobs at once: finding shows, finishing the music,
                        asking for the money, reading the paperwork, and remembering who everyone is. The Source
                        Engine does all five in one place — in plain language, with no manager taking a cut.
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
                                        <div className="glass-obsidian glass-obsidian-hover rounded-2xl p-6 md:p-7">
                                            <p
                                                className="text-[10px] tracking-[0.25em] uppercase mb-5"
                                                style={{ color: feat.accent }}
                                            >
                                                {feat.mock?.label}
                                            </p>
                                            <div className="space-y-3.5">
                                                {(feat.mock?.lines || []).map((line) => (
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

                {/* ===== Free stack vs coming soon (investor honesty) ===== */}
                <motion.div
                    initial={{ opacity: 0, y: 40 }}
                    whileInView={{ opacity: 1, y: 0 }}
                    viewport={{ once: true }}
                    className="mt-28 md:mt-40 grid md:grid-cols-2 gap-6"
                >
                    <div className="glass-obsidian rounded-2xl p-6 md:p-8">
                        <p className="font-mono text-[10px] tracking-[0.35em] text-ember-500 uppercase mb-3">Working today</p>
                        <h3 className="font-display text-2xl md:text-3xl text-ink-50 mb-4">All of this is live</h3>
                        <ul className="space-y-2 text-sm text-ink-200">
                            {[
                                'Mastering, loudness metering, and stem splitting',
                                'Venue search across live ticketing and touring data',
                                'Press kits built from public release data',
                                'Tour routing that puts your cities in the right order',
                                'Contract scanning — instant free check plus a full AI read',
                                'Contacts, tasks, pipeline, and exports you own',
                                'Accounts, fair daily limits, light and dark, installs like an app',
                            ].map((t) => (
                                <li key={t} className="flex gap-2">
                                    <Check size={14} className="text-ember-500 shrink-0 mt-0.5" />
                                    {t}
                                </li>
                            ))}
                        </ul>
                    </div>
                    <div className="glass-obsidian rounded-2xl p-6 md:p-8 border border-white/5">
                        <p className="font-mono text-[10px] tracking-[0.35em] text-ink-400 uppercase mb-3">Roadmap</p>
                        <h3 className="font-display text-2xl md:text-3xl text-ink-50 mb-4">Coming later</h3>
                        <p className="text-sm text-ink-400 mb-4 leading-relaxed">
                            Honest about what we have not built yet. These need paid services or partners, so we list
                            them rather than fake them.
                        </p>
                        <ul className="space-y-2 text-sm text-ink-400">
                            {[
                                'Your streaming and social numbers, all on one screen',
                                'Signing contracts in the app, with version history',
                                'Getting paid straight to your bank',
                                'Sending pitches from here and tracking who replied',
                                'Higher-quality stem splitting for every plan',
                                'Registering songs with your PRO and sending music to stores',
                            ].map((t) => (
                                <li key={t} className="flex gap-2">
                                    <span className="font-mono text-[9px] uppercase tracking-widest text-ink-500 shrink-0 mt-0.5">Soon</span>
                                    {t}
                                </li>
                            ))}
                        </ul>
                    </div>
                </motion.div>

                {/* ===== Comparison ===== */}
                <motion.div
                    initial={{ opacity: 0, y: 50 }}
                    whileInView={{ opacity: 1, y: 0 }}
                    viewport={{ once: true }}
                    transition={{ duration: 0.8 }}
                    className="mt-32 md:mt-44"
                >
                    <div className="mb-14">
                        <p className="font-mono text-[10px] tracking-[0.35em] text-ember-500 uppercase mb-4">The difference</p>
                        <h2 className="text-cinema text-4xl md:text-6xl">
                            How this used to<br />work.
                        </h2>
                    </div>

                    <div className="glass-obsidian rounded-2xl overflow-hidden">
                        {/* Header row */}
                        <div className="hidden md:grid grid-cols-[1.2fr_2fr_2fr] border-b hairline">
                            <div className="p-5 font-mono text-[10px] tracking-[0.3em] uppercase text-ink-400">The job</div>
                            <div className="p-5 font-mono text-[10px] tracking-[0.3em] uppercase text-ink-400 border-l hairline">The old way</div>
                            <div className="p-5 font-mono text-[10px] tracking-[0.3em] uppercase text-ember-500 border-l hairline">The Source Engine</div>
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
                        Run your own career.
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
