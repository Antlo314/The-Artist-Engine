import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Search, BookOpen } from 'lucide-react';
import { EmptyState } from './ui/Shell';

export const codexEntries = [
    {
        term: "In Perpetuity",
        translation: "Forever. There is no end date.",
        dangerLevel: "CRITICAL",
        meaning: "If a label owns your recordings 'in perpetuity', they own them forever — not for ten years, not until the deal ends. Forever. You can never get those songs back, and neither can your kids. Only worth considering if the money on the table changes your life."
    },
    {
        term: "Cross-Collateralization",
        translation: "Money you make gets used to cover money you lost.",
        dangerLevel: "CRITICAL",
        meaning: "Say your first album loses the label $50,000 and your second one does great. You still get paid nothing on the second album until it has earned back that $50,000. They treat all your projects as one big tab, so their risk goes down and yours goes up."
    },
    {
        term: "360 Deal",
        translation: "The label takes a cut of everything you earn, not just music.",
        dangerLevel: "CRITICAL",
        meaning: "The label takes a percentage of your ticket sales, merch, sponsorships, sometimes even acting work — even though the only thing they paid for was the recording. Only accept it if they are genuinely doing work in those areas and can prove it."
    },
    {
        term: "Work For Hire",
        translation: "You are treated as staff, not as the owner of the song.",
        dangerLevel: "CRITICAL",
        meaning: "Signing this says that legally you never owned the song or recording at all — the label or producer counts as the creator from the moment it was made. You get paid a fee and that's it. No ownership, no future royalties from it."
    },
    {
        term: "Recoupment",
        translation: "Paying the advance back out of your royalties.",
        dangerLevel: "CRITICAL",
        meaning: "An advance is not a gift, it's money lent against your future earnings. Until it is paid off, your share of the money goes straight back to the label and you see nothing. Recording and marketing costs usually get added to that tab too. Check whether they also take from your live shows."
    },
    {
        term: "Leaving Member Clause",
        translation: "What happens to each of you if the band splits up.",
        dangerLevel: "CRITICAL",
        meaning: "If the band breaks up, this lets the label keep whoever they want, drop whoever they want, and often drag the person who left into a solo deal on the same bad terms. It means you can't escape a bad contract just by walking away from the band."
    },
    {
        term: "Controlled Composition",
        translation: "A forced discount on the money you're owed as the songwriter.",
        dangerLevel: "HIGH",
        meaning: "If you wrote the song, you are owed a set amount every time it is sold or streamed. This clause cuts that payment down (usually to 75% of the normal rate) and often only pays you for ten songs per album no matter how many you wrote. It is money taken straight out of your songwriting income."
    },
    {
        term: "Net Profits",
        translation: "Profit left over after they subtract whatever they like.",
        dangerLevel: "HIGH",
        meaning: "Never agree to a percentage of 'net profits'. The label subtracts marketing, packaging, distribution and other costs first, and there is always a way to make that leftover number come out at zero. Ask for a percentage of the money coming in instead."
    },
    {
        term: "Black Box Royalties",
        translation: "Money owed to somebody that nobody claimed.",
        dangerLevel: "HIGH",
        meaning: "Royalties that pile up because the company holding them can't work out who to pay — usually because paperwork was never filed. After a while it gets shared out among the biggest labels and publishers instead. Registering your songs properly is how you stop your money ending up here."
    },
    {
        term: "Exploitation",
        translation: "Their right to make money from your music however they choose.",
        dangerLevel: "HIGH",
        meaning: "In a contract, 'exploit' just means 'earn money from'. The problem is how wide the wording is: it can let them put your song in a political ad or a commercial you hate. Ask for a clause saying they need your written OK first."
    },
    {
        term: "Moral Rights",
        translation: "Your right to stop your work being twisted into something else.",
        dangerLevel: "HIGH",
        meaning: "This is the right not to have your music chopped up, remixed or used in a way that makes you look bad. Most US contracts ask you to sign that right away, which lets them change your music however they want without asking you."
    },
    {
        term: "Option Periods",
        translation: "They can choose to keep you. You can't choose to leave.",
        dangerLevel: "WARNING",
        meaning: "An option lets the label decide later whether to make another album with you — they are not required to. If you take off, they keep you at the old price. If you don't, they drop you. Push for fewer options, or for a firm promise of a second album."
    },
    {
        term: "Right of First Refusal",
        translation: "You have to bring them any other offer first.",
        dangerLevel: "WARNING",
        meaning: "If someone else offers you a publishing or merch deal, you must show it to your current label first. If they match the offer, you have to go with them. It makes other companies less likely to bid for you at all, because they know they can be outmatched at the last second."
    },
    {
        term: "Packaging Deduction",
        translation: "A charge for physical packaging that doesn't exist anymore.",
        dangerLevel: "WARNING",
        meaning: "An old clause that takes 20-25% off your royalties to cover the cost of the CD case or vinyl sleeve. Plenty of contracts still apply it to streams and downloads, where there is nothing to package. Ask for it to be struck out."
    },
    {
        term: "Minimum Delivery Commitment",
        translation: "How much music you're required to hand in.",
        dangerLevel: "WARNING",
        meaning: "The number of finished recordings you owe them before the deal is satisfied. Watch for wording that says the music must be 'commercially satisfactory' — that lets them reject what you turn in and say you still owe them, keeping you stuck in the deal."
    },
    {
        term: "Indemnification",
        translation: "If someone sues them over your music, you pay the bill.",
        dangerLevel: "WARNING",
        meaning: "You promise to cover the label's legal costs for any claim about your music — most commonly a sample you used without permission. That money comes out of your own pocket or your royalties. Clear every sample before you turn anything in."
    },
    {
        term: "Force Majeure",
        translation: "Emergencies that put the deal on pause.",
        dangerLevel: "WARNING",
        meaning: "It pauses everyone's obligations during things nobody controls — war, a pandemic, a strike. The risk is a pause with no end date, which leaves you signed to a label doing nothing for you. Ask for a hard limit, like six months, after which you can walk."
    },
    {
        term: "Territory",
        translation: "Which parts of the world this deal covers.",
        dangerLevel: "WARNING",
        meaning: "Most contracts claim the whole world by default. If a US label is signing you but you already have a following in, say, Japan, try to limit them to the US. Then you can make a separate deal for Japan and get paid twice."
    },
    {
        term: "Administration Deal",
        translation: "They do your paperwork and chase your money. You keep ownership.",
        dangerLevel: "SAFE",
        meaning: "A publishing arrangement where you still own your songs outright. The company registers them everywhere, collects what you're owed around the world, and takes a small fee (usually 10-20%) for a set number of years (usually 3-5). The friendliest kind of publishing deal."
    },
    {
        term: "Co-Publishing Deal",
        translation: "You hand over part of the song income in exchange for cash up front.",
        dangerLevel: "SAFE",
        meaning: "Song income is normally split into two halves: the writer's half, which is always yours, and the publisher's half. In this deal you give away half of that publisher half — a quarter of the total — and keep the rest, plus an advance. Better than a full publishing deal, not as good as an admin deal."
    },
    {
        term: "Sync Licensing",
        translation: "Getting your song used in a TV show, film, ad or game.",
        dangerLevel: "SAFE",
        meaning: "You get a one-off fee for allowing the song to be used, which can be big, and then you get paid again every time that show or film is broadcast. One of the most reliable ways for an independent artist to make real money."
    },
    {
        term: "Key Man Clause",
        translation: "If the person who believed in you leaves, you can leave too.",
        dangerLevel: "SAFE",
        meaning: "Names the specific person at the label who signed you and gets your vision. If they quit or get fired, this clause lets you end the contract. Without it, you can end up stuck at a company where nobody knows who you are."
    },
    {
        term: "Reversion Clause",
        translation: "Your recordings come back to you after a set number of years.",
        dangerLevel: "SAFE",
        meaning: "Says that a set time after the deal ends — often 7 or 10 years — ownership of the recordings passes from the label back to you. This is the single most valuable thing you can win in a record deal. Ask for it every time."
    },
    {
        term: "Mutual Consent",
        translation: "They can't do it unless you say yes in writing.",
        dangerLevel: "SAFE",
        meaning: "Means the label can't make big calls on your behalf — putting you with a brand, releasing a remix, publishing photos you haven't approved — without your written OK. This is how you keep control of how you look and sound."
    },
    {
        term: "Audit Rights",
        translation: "Your right to check their numbers.",
        dangerLevel: "SAFE",
        meaning: "Lets you hire your own accountant to go through the label's books and confirm they've paid you correctly. Underpayment is common and usually not deliberate. Ask to be allowed to check once a year, with two or three years to raise a problem with any statement."
    },
    {
        term: "Gross Revenue",
        translation: "The money coming in, before anyone takes costs out.",
        dangerLevel: "SAFE",
        meaning: "If your percentage is based on the money as it arrives, rather than on what's left after expenses, the label can't shrink your payment by adding costs. Always try to be paid on this rather than on 'net profits'."
    },
    {
        term: "Pay or Play",
        translation: "They pay you even if they decide not to release the record.",
        dangerLevel: "SAFE",
        meaning: "If the label changes its mind and never records or releases your album, this makes them pay you an agreed amount anyway and let you out of the contract, so you're free to sign somewhere else instead of sitting on the shelf."
    },
    {
        term: "Release Commitment",
        translation: "They actually have to put the music out.",
        dangerLevel: "SAFE",
        meaning: "Sets a deadline — say 120 days after you hand the album in — by which the label has to release it. Miss the deadline and you can ask to be let out of the deal. Without this, a label can sign you and then just sit on your music."
    },
    {
        term: "Escalations",
        translation: "Your percentage goes up as the song sells more.",
        dangerLevel: "SAFE",
        meaning: "Your share automatically rises once you pass certain sales points. For example: 15% to start, 16% after 500,000 sales, 17% after a million. It costs the label nothing unless you succeed, so it's an easy thing to ask for."
    },
    {
        term: "Favored Nations",
        translation: "Nobody else on the project gets a better deal than you.",
        dangerLevel: "SAFE",
        meaning: "If another person on the record — a guest artist, a co-writer — negotiates a better percentage than yours, your deal automatically rises to match. It stops you finding out later that you were the only one who took less."
    },
    {
        term: "Sunset Clause",
        translation: "An old manager's cut shrinks to nothing over a few years.",
        dangerLevel: "SAFE",
        meaning: "When you part ways with a manager, they usually keep earning from deals they set up. This shrinks that over time — say 20% the first year, 10% the second, nothing after that — so you aren't paying an old manager and a new one at once, forever."
    },
    {
        term: "Cure Period",
        translation: "A warning and a chance to fix it before you're in real trouble.",
        dangerLevel: "SAFE",
        meaning: "If you break a term of the deal — turning an album in late, for example — this makes them tell you in writing and give you a set amount of time, often 30 days, to put it right before they can sue you or end the contract."
    }
];

const DANGER_STYLES: Record<string, { bar: string; badge: string }> = {
    CRITICAL: { bar: 'bg-red-500', badge: 'text-red-400 border-red-500/50' },
    HIGH: { bar: 'bg-purple-500', badge: 'text-purple-400 border-purple-500/50' },
    WARNING: { bar: 'bg-orange-500', badge: 'text-orange-400 border-orange-500/50' },
    SAFE: { bar: 'bg-emerald-500', badge: 'text-emerald-400 border-emerald-500/50' },
};

type CodexProps = {
    initialQuery?: string;
    onQueryConsumed?: () => void;
};

export default function TheCodex({ initialQuery = '', onQueryConsumed }: CodexProps) {
    const [query, setQuery] = useState(initialQuery || '');
    const [levelFilter, setLevelFilter] = useState<string | null>(null);

    useEffect(() => {
        if (initialQuery) {
            setQuery(initialQuery);
            onQueryConsumed?.();
        }
    }, [initialQuery, onQueryConsumed]);

    const filteredEntries = codexEntries.filter(entry => {
        if (levelFilter && entry.dangerLevel !== levelFilter) return false;
        const q = query.trim().toLowerCase();
        if (!q) return true;
        return (
            entry.term.toLowerCase().includes(q) ||
            entry.translation.toLowerCase().includes(q) ||
            entry.meaning.toLowerCase().includes(q)
        );
    });

    return (
        <div className="space-y-6">
            <div>
                <h2 className="font-display text-xl lg:text-2xl font-semibold text-ink-50 flex items-center gap-2 lg:gap-3">
                    <BookOpen className="text-ink-400 w-5 h-5 lg:w-6 lg:h-6" />
                    Term Codex
                </h2>
                <p className="font-mono text-[10px] text-ink-400 mt-1 tracking-[0.2em] uppercase">
                    Entertainment law dictionary — predatory terminology, translated
                </p>
            </div>

            <div className="flex flex-col gap-2">
                <div className="flex items-center gap-3">
                    <Search className="text-ink-400 shrink-0" size={18} />
                    <input
                        type="text"
                        placeholder="Search legal jargon... (e.g. Recoupment, Gross Revenue)"
                        value={query}
                        onChange={(e) => setQuery(e.target.value)}
                        className="bg-ink-900 border border-white/10 rounded-lg px-3.5 py-2.5 text-ink-50 placeholder:text-ink-700 text-sm focus:outline-none focus:border-violet-400/60 transition-colors w-full min-h-[44px]"
                    />
                </div>
                <div className="flex flex-wrap items-center justify-between gap-2">
                    <div className="flex flex-wrap gap-1.5">
                        {[null, 'CRITICAL', 'HIGH', 'WARNING', 'SAFE'].map((lvl) => (
                            <button
                                key={String(lvl)}
                                type="button"
                                onClick={() => setLevelFilter(lvl)}
                                className={`font-mono text-[9px] tracking-widest uppercase px-2.5 py-1 rounded-full border transition-colors ${
                                    levelFilter === lvl
                                        ? 'border-violet-400/50 text-violet-300 bg-violet-500/15'
                                        : 'border-white/10 text-ink-400 hover:border-white/25'
                                }`}
                            >
                                {lvl || 'All'}
                            </button>
                        ))}
                    </div>
                    <span className="font-mono text-[10px] text-ink-400 tracking-widest uppercase">
                        {filteredEntries.length} of {codexEntries.length} terms
                    </span>
                </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 overflow-y-auto pb-8 custom-scrollbar">
                <AnimatePresence>
                    {filteredEntries.map((entry, idx) => {
                        const style = DANGER_STYLES[entry.dangerLevel] || DANGER_STYLES.SAFE;
                        return (
                            <motion.div
                                key={entry.term}
                                initial={{ opacity: 0, y: 20 }}
                                animate={{ opacity: 1, y: 0 }}
                                exit={{ opacity: 0, scale: 0.95 }}
                                transition={{ delay: Math.min(idx * 0.03, 0.3) }}
                                className="glass-obsidian sheen rounded-2xl border border-white/10 p-6 relative overflow-hidden"
                            >
                                <div className={`absolute top-0 left-0 w-1 h-full ${style.bar}`} />

                                <div className="flex justify-between items-start mb-4 pl-3">
                                    <h3 className="font-display text-lg text-ink-50 font-semibold tracking-wide">{entry.term}</h3>
                                    <span className={`font-mono text-[10px] tracking-widest px-2 py-1 rounded border ${style.badge}`}>
                                        {entry.dangerLevel}
                                    </span>
                                </div>

                                <p className="font-inter text-sm text-ink-200 mb-2 pl-3">"{entry.translation}"</p>
                                <p className="font-mono text-xs text-ink-400 leading-relaxed pl-3 bg-white/[0.03] p-3 rounded-lg border border-white/10">
                                    {entry.meaning}
                                </p>
                            </motion.div>
                        );
                    })}
                </AnimatePresence>
                {filteredEntries.length === 0 && (
                    <div className="col-span-full">
                        <EmptyState
                            icon={<Search size={32} />}
                            title="No codex entries found"
                            hint="Try another keyword or clear the danger filter."
                        />
                    </div>
                )}
            </div>
        </div>
    );
}
