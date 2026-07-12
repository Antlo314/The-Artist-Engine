import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Search, BookOpen } from 'lucide-react';

export const codexEntries = [
    {
        term: "In Perpetuity",
        translation: "Forever. Literally until the end of time.",
        dangerLevel: "CRITICAL",
        meaning: "When a contract says they own your masters 'in perpetuity', it means your children's children will never see a dime from your creation. You surrender the copyright to the corporation forever. Never sign this without a massive, life-changing advance."
    },
    {
        term: "Cross-Collateralization",
        translation: "Your successes pay for your failures.",
        dangerLevel: "CRITICAL",
        meaning: "If Album 1 tanks and loses $50k, but Album 2 is a smash hit, you won't get paid for Album 2 until it earns enough to pay back the $50k you lost on Album 1. The label pools all your projects together to minimize their risk while maximizing yours."
    },
    {
        term: "360 Deal",
        translation: "The label takes a cut of EVERYTHING.",
        dangerLevel: "CRITICAL",
        meaning: "A Multiple Rights agreement where the label takes a percentage of your touring, merchandise, endorsements, and sometimes even acting gigs, despite only funding your recorded music. Avoid unless they are providing massive, proven infrastructure in those other areas."
    },
    {
        term: "Work For Hire",
        translation: "You are an employee, not an owner.",
        dangerLevel: "CRITICAL",
        meaning: "By signing a 'work for hire' clause, you legally declare that you never owned the copyright to begin with. The label or producer is considered the 'author' of the work from inception. Highly predatory for featured artists."
    },
    {
        term: "Recoupment",
        translation: "Paying back the loan before you make a profit.",
        dangerLevel: "CRITICAL",
        meaning: "An advance is not a gift; it is a loan. Recoupment is the process of the label keeping your royalties until that loan (and all recording/marketing expenses) is paid off. Standard, but watch out for 'All-In' recoupment where they take from live shows too."
    },
    {
        term: "Leaving Member Clause",
        translation: "Trap doors for band breakups.",
        dangerLevel: "CRITICAL",
        meaning: "If a band breaks up, this clause gives the label the right to keep the remaining members, drop the ones who left, or even force the leaving member into a solo deal under the same terrible terms. It prevents artists from escaping bad deals by disbanding."
    },
    {
        term: "Controlled Composition",
        translation: "A forced discount on your own mechanical royalties.",
        dangerLevel: "HIGH",
        meaning: "If you write your own songs, the label owes you mechanical royalties. This clause forcibly caps the amount they pay you (usually at 75% of the statutory rate) and limits it to only 10 songs per album. It steals your publishing revenue to save the label money."
    },
    {
        term: "Net Profits",
        translation: "Hollywood Accounting.",
        dangerLevel: "HIGH",
        meaning: "Never agree to a percentage of 'Net Profits'. The label will deduct 'marketing', 'breakage', 'packaging', and 'distribution' costs until the 'Net Profit' magically equals zero. Always fight for a percentage of 'Gross Revenue'."
    },
    {
        term: "Black Box Royalties",
        translation: "Unclaimed money the industry keeps.",
        dangerLevel: "HIGH",
        meaning: "Royalties that remain unclaimed (usually mechanicals) because the publisher or writer couldn't be located. After a certain time, societies distribute this money based on market share, meaning the biggest labels/publishers get your unclaimed cash."
    },
    {
        term: "Exploitation",
        translation: "The right to use your music however they want.",
        dangerLevel: "HIGH",
        meaning: "In legal terms, 'exploit' just means 'to make money from'. But broad exploitation clauses allow labels to use your music in ways you might hate (e.g., political campaigns, embarrassing commercials) unless you have Mutual Consent."
    },
    {
        term: "Moral Rights",
        translation: "The right to protect your artistic integrity.",
        dangerLevel: "HIGH",
        meaning: "The right to not have your work mutated, distorted, or used in a derogatory way. Many standard US contracts force you to waive your moral rights, allowing them to drastically alter your music without your permission."
    },
    {
        term: "Option Periods",
        translation: "The label can keep you, but you can't leave.",
        dangerLevel: "WARNING",
        meaning: "Options give the label the *right* but not the *obligation* to record more albums with you. If you blow up, they exercise the option and keep you cheaply. If you flop, they drop you. Always negotiate for firm commitments or fewer options."
    },
    {
        term: "Right of First Refusal",
        translation: "You must offer it to them before anyone else.",
        dangerLevel: "WARNING",
        meaning: "If you want to sign a publishing or merch deal elsewhere, you must bring the competing offer to your current label first. If they match it, you MUST sign with them. It kills your leverage in the open market."
    },
    {
        term: "Packaging Deduction",
        translation: "A fake fee from the CD era.",
        dangerLevel: "WARNING",
        meaning: "A legacy clause where labels deduct 20%-25% of your royalties for the 'cost of packaging' the CD/Vinyl. But they apply this deduction to digital streams and downloads too, where there is zero packaging cost. It's pure theft."
    },
    {
        term: "Minimum Delivery Commitment",
        translation: "The bare minimum you must provide.",
        dangerLevel: "WARNING",
        meaning: "The exact number of masters you must deliver to satisfy the term or option. Be careful: labels often stipulate that albums must be 'commercially satisfactory,' meaning they can reject your album and claim you haven't fulfilled your commitment."
    },
    {
        term: "Indemnification",
        translation: "If we get sued, YOU pay for it.",
        dangerLevel: "WARNING",
        meaning: "You agree to protect the label against any legal claims regarding your music (e.g., uncleared samples). If they get sued, this clause forces you to pay their legal fees out of your own pocket or royalties."
    },
    {
        term: "Force Majeure",
        translation: "Acts of God.",
        dangerLevel: "WARNING",
        meaning: "Suspends the contract during extraordinary events (war, pandemics, strikes). Labels use this to indefinitely pause their obligations to you. Ensure there is a hard time limit (e.g., 6 months) after which you can terminate if they still aren't functioning."
    },
    {
        term: "Territory",
        translation: "Where they control your rights.",
        dangerLevel: "WARNING",
        meaning: "Usually defined as 'The Universe'. If you have a strong following in Japan, but you are signing to a US indie label, restrict the territory to the US so you can license your music separately in Japan for a massive secondary advance."
    },
    {
        term: "Administration Deal",
        translation: "They handle the paperwork, you keep the copyright.",
        dangerLevel: "SAFE",
        meaning: "A publishing deal where you retain 100% of your copyright. The administrator simply registers your songs and collects the money worldwide for a small percentage (usually 10-20%) for a limited amount of time (3-5 years)."
    },
    {
        term: "Co-Publishing Deal",
        translation: "Splitting the pie.",
        dangerLevel: "SAFE",
        meaning: "The most common publishing deal for successful writers. You give up 50% of the publisher's share (so 25% of the total revenue), but you get an advance and keep the other 75%. Better than a full publishing deal, but worse than Admin."
    },
    {
        term: "Sync Licensing",
        translation: "Getting placed in TV, Movies, and Video Games.",
        dangerLevel: "SAFE",
        meaning: "Synchronization. When your music is synchronized to a visual medium. This pays a massive upfront fee AND generates ongoing performance royalties every time the show/movie airs. The holy grail of alternative income."
    },
    {
        term: "Key Man Clause",
        translation: "The parachute if your favorite executive leaves.",
        dangerLevel: "SAFE",
        meaning: "A clause that says if the specific A&R rep or President who signed you (and understands your vision) leaves the label, you have the right to terminate your contract. Without this, you could be stuck at a label where nobody cares about you."
    },
    {
        term: "Reversion Clause",
        translation: "Your masters eventually come back to you.",
        dangerLevel: "SAFE",
        meaning: "A highly sought-after clause stating that after a certain period (e.g., 7 or 10 years after the term ends), the copyright to the master recordings reverts from the label back to the artist. This is true generational wealth building."
    },
    {
        term: "Mutual Consent",
        translation: "They can't do it unless you agree.",
        dangerLevel: "SAFE",
        meaning: "Ensures the label cannot make major decisions—like pairing you with a brand, remixing a song, or releasing unapproved photos—without your explicit written approval. Crucial for protecting your brand identity."
    },
    {
        term: "Audit Rights",
        translation: "The right to investigate their math.",
        dangerLevel: "SAFE",
        meaning: "The legal right to hire an independent accountant to examine the label's books to ensure they are paying you correctly. You want the right to audit annually, with a long time window (2-3 years) to object to statements."
    },
    {
        term: "Gross Revenue",
        translation: "Money before the label touches it.",
        dangerLevel: "SAFE",
        meaning: "Income calculated *before* any expenses are deducted. If you negotiate a royalty based on 'Gross' or 'At Source', you are protecting yourself from the label inflating their overhead costs to drain your royalty pool."
    },
    {
        term: "Pay or Play",
        translation: "They pay you even if they shelf you.",
        dangerLevel: "SAFE",
        meaning: "If the label decides not to record or release your album, this clause forces them to pay you a union-scale settlement or a pre-agreed sum, and immediately releases you from the contract so you can sign elsewhere."
    },
    {
        term: "Release Commitment",
        translation: "They actually have to put the music out.",
        dangerLevel: "SAFE",
        meaning: "A clause forcing the label to commercially release your album within a specific timeframe (e.g., 120 days of delivery). If they fail to release it, you can demand to be released from the contract. Prevents getting 'shelved'."
    },
    {
        term: "Escalations",
        translation: "Your royalty rate goes up as you sell more.",
        dangerLevel: "SAFE",
        meaning: "A clause where your royalty percentage automatically increases based on sales thresholds. For example, your base rate is 15%, but escalates to 16% after 500k sales, and 17% after 1M sales. Always ask for escalations."
    },
    {
        term: "Favored Nations",
        translation: "Nobody gets a better deal than you.",
        dangerLevel: "SAFE",
        meaning: "A clause stating that if any other party on the project (like a featured artist or co-writer) negotiates a higher royalty rate or better terms, your contract automatically upgrades to match theirs. Ultimate equalization."
    },
    {
        term: "Sunset Clause",
        translation: "Phasing out your old manager's commission.",
        dangerLevel: "SAFE",
        meaning: "When you fire a manager, they are usually entitled to commissions on deals they brought you. A Sunset Clause phases this out over time (e.g., 20% year 1, 10% year 2, 0% year 3) so you aren't paying two managers forever."
    },
    {
        term: "Cure Period",
        translation: "A second chance to fix a mistake.",
        dangerLevel: "SAFE",
        meaning: "If you breach the contract (e.g., deliver an album late), a 'cure period' requires the label to send you a formal warning and give you a specific amount of time (e.g., 30 days) to fix the mistake before they can sue or terminate."
    }
];

const DANGER_STYLES: Record<string, { bar: string; badge: string }> = {
    CRITICAL: { bar: 'bg-red-500', badge: 'text-red-400 border-red-500/50' },
    HIGH: { bar: 'bg-purple-500', badge: 'text-purple-400 border-purple-500/50' },
    WARNING: { bar: 'bg-orange-500', badge: 'text-orange-400 border-orange-500/50' },
    SAFE: { bar: 'bg-emerald-500', badge: 'text-emerald-400 border-emerald-500/50' },
};

export default function TheCodex() {
    const [query, setQuery] = useState('');

    const filteredEntries = codexEntries.filter(entry => {
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
                        className="bg-ink-900 border border-white/10 rounded-lg px-3.5 py-2.5 text-ink-50 placeholder:text-ink-700 text-sm focus:outline-none focus:border-violet-400/60 transition-colors w-full"
                    />
                </div>
                <div className="flex justify-end">
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
                                transition={{ delay: idx * 0.05 }}
                                className="glass-obsidian rounded-xl border border-white/10 p-6 relative overflow-hidden"
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
                    <div className="col-span-full py-12 text-center text-ink-400 font-mono text-sm tracking-widest">
                        No codex entries found. You are in uncharted territory.
                    </div>
                )}
            </div>
        </div>
    );
}
