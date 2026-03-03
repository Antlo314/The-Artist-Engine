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
    }
];

export default function TheCodex() {
    const [searchTerm, setSearchTerm] = useState('');

    const filteredEntries = codexEntries.filter(entry =>
        entry.term.toLowerCase().includes(searchTerm.toLowerCase()) ||
        entry.translation.toLowerCase().includes(searchTerm.toLowerCase())
    );

    return (
        <div className="space-y-6">
            <div className="flex items-end justify-between border-b border-white/10 pb-4">
                <div>
                    <h2 className="font-cinzel text-3xl font-bold text-white tracking-widest flex items-center gap-3">
                        <BookOpen className="text-amber-500 drop-shadow-[0_0_10px_rgba(245,158,11,0.8)]" />
                        THE CODEX
                    </h2>
                    <p className="font-mono text-xs text-gray-400 mt-1 tracking-widest uppercase">
                        Entertainment Law Dictionary & Predatory Terminology Translations
                    </p>
                </div>
            </div>

            <div className="glass-card p-4 flex items-center gap-4 rounded-xl border border-white/5 bg-black/40">
                <Search className="text-amber-500" size={20} />
                <input
                    type="text"
                    placeholder="Search predatory jargon... (e.g., 'Recoupment', 'Gross')"
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="flex-1 bg-transparent text-white font-mono text-sm focus:outline-none placeholder-gray-600"
                />
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 overflow-y-auto pb-8 custom-scrollbar">
                <AnimatePresence>
                    {filteredEntries.map((entry, idx) => (
                        <motion.div
                            key={entry.term}
                            initial={{ opacity: 0, y: 20 }}
                            animate={{ opacity: 1, y: 0 }}
                            exit={{ opacity: 0, scale: 0.95 }}
                            transition={{ delay: idx * 0.05 }}
                            className="glass-card p-6 rounded-2xl border border-white/5 hover:border-amber-500/30 transition-colors relative overflow-hidden group"
                        >
                            <div className={`absolute top-0 left-0 w-1 h-full 
                                ${entry.dangerLevel === 'CRITICAL' ? 'bg-red-500' :
                                    entry.dangerLevel === 'HIGH' ? 'bg-purple-500' :
                                        entry.dangerLevel === 'WARNING' ? 'bg-orange-500' :
                                            'bg-emerald-500'}`}
                            />

                            <div className="flex justify-between items-start mb-4">
                                <h3 className="font-cinzel text-xl text-white font-bold tracking-widest pl-3">{entry.term}</h3>
                                <span className={`font-mono text-[10px] tracking-widest px-2 py-1 rounded bg-black/40 border
                                    ${entry.dangerLevel === 'CRITICAL' ? 'text-red-400 border-red-500/30' :
                                        entry.dangerLevel === 'HIGH' ? 'text-purple-400 border-purple-500/30' :
                                            entry.dangerLevel === 'WARNING' ? 'text-orange-400 border-orange-500/30' :
                                                'text-emerald-400 border-emerald-500/30'}`}>
                                    {entry.dangerLevel}
                                </span>
                            </div>

                            <p className="font-inter text-sm text-gray-300 font-bold mb-2 pl-3">"{entry.translation}"</p>
                            <p className="font-mono text-xs text-gray-500 leading-relaxed pl-3 bg-white/5 p-3 rounded-md">
                                {entry.meaning}
                            </p>
                        </motion.div>
                    ))}
                </AnimatePresence>
                {filteredEntries.length === 0 && (
                    <div className="col-span-full py-12 text-center text-gray-500 font-mono text-sm tracking-widest">
                        NO CODEX ENTRIES FOUND. YOU ARE IN UNCHARTED TERRITORY.
                    </div>
                )}
            </div>
        </div>
    );
}
