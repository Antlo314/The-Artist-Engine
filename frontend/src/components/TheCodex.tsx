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
        dangerLevel: "HIGH",
        meaning: "If Album 1 tanks and loses $50k, but Album 2 is a smash hit, you won't get paid for Album 2 until it earns enough to pay back the $50k you lost on Album 1. The label pools all your projects together to minimize their risk while maximizing yours."
    },
    {
        term: "Key Man Clause",
        translation: "The parachute if your favorite executive leaves.",
        dangerLevel: "MODERATE",
        meaning: "A clause that says if the specific A&R rep or President who signed you (and understands your vision) leaves the label, you have the right to terminate your contract. Without this, you could be stuck at a label where nobody cares about you."
    },
    {
        term: "Net Profits",
        translation: "Hollywood Accounting.",
        dangerLevel: "HIGH",
        meaning: "Never agree to a percentage of 'Net Profits'. The label will deduct 'marketing', 'breakage', 'packaging', and 'distribution' costs until the 'Net Profit' magically equals zero. Always fight for a percentage of 'Gross Revenue' (money before expenses are deducted)."
    },
    {
        term: "Controlled Composition",
        translation: "A forced discount on your own mechanical royalties.",
        dangerLevel: "HIGH",
        meaning: "If you write your own songs, the label owes you mechanical royalties. This clause forcibly caps the amount they have to pay you (usually at 75% of the statutory rate) and limits it to only 10 songs per album. It literally steals your publishing revenue to save the label money."
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
                                    entry.dangerLevel === 'HIGH' ? 'bg-purple-500' : 'bg-yellow-500'}`}
                            />

                            <div className="flex justify-between items-start mb-4">
                                <h3 className="font-cinzel text-xl text-white font-bold tracking-widest pl-3">{entry.term}</h3>
                                <span className={`font-mono text-[10px] tracking-widest px-2 py-1 rounded bg-black/40 border
                                    ${entry.dangerLevel === 'CRITICAL' ? 'text-red-400 border-red-500/30' :
                                        entry.dangerLevel === 'HIGH' ? 'text-purple-400 border-purple-500/30' : 'text-yellow-400 border-yellow-500/30'}`}>
                                    {entry.dangerLevel} RISK
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
