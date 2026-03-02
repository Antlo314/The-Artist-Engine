import { useState } from 'react';
import { motion } from 'framer-motion';
import { FileSignature, Plus, Trash2, Download } from 'lucide-react';

export default function SplitSheetGenerator() {
    const [songTitle, setSongTitle] = useState('');
    const [writers, setWriters] = useState([
        { name: '', role: 'Writer', pro: '', ipi: '', split: 50 },
        { name: '', role: 'Producer', pro: '', ipi: '', split: 50 }
    ]);

    const addWriter = () => {
        setWriters([...writers, { name: '', role: 'Writer', pro: '', ipi: '', split: 0 }]);
    };

    const removeWriter = (index: number) => {
        const newWriters = [...writers];
        newWriters.splice(index, 1);
        setWriters(newWriters);
    };

    const updateWriter = (index: number, field: string, value: string | number) => {
        const newWriters = [...writers];
        (newWriters[index] as any)[field] = value;
        setWriters(newWriters);
    };

    const totalSplit = writers.reduce((acc, curr) => acc + curr.split, 0);

    return (
        <div className="space-y-6">
            <div className="flex items-end justify-between border-b border-white/10 pb-4">
                <div>
                    <h2 className="font-cinzel text-3xl font-bold text-white tracking-widest flex items-center gap-3">
                        <FileSignature className="text-cyan-500 drop-shadow-[0_0_10px_rgba(6,182,212,0.8)]" />
                        SPLIT SHEET CACHE
                    </h2>
                    <p className="font-mono text-xs text-gray-400 mt-1 tracking-widest uppercase">
                        Instant Publishing Ownership & Collaboration Agreements
                    </p>
                </div>
            </div>

            <div className="glass-card p-6 md:p-8 rounded-2xl border border-white/5 space-y-8">

                {/* Header Information */}
                <div>
                    <label className="block font-mono text-[10px] text-gray-500 tracking-widest uppercase mb-2">Track Title</label>
                    <input
                        type="text"
                        placeholder="e.g. OMEGA PROTOCOL (feat. The Architect)"
                        value={songTitle}
                        onChange={(e) => setSongTitle(e.target.value)}
                        className="w-full bg-black/40 border border-white/10 p-4 rounded-xl text-white font-cinzel text-xl focus:border-cyan-500/50 outline-none transition-colors"
                    />
                </div>

                {/* Writers List */}
                <div className="space-y-4">
                    <div className="flex justify-between items-end border-b border-white/10 pb-2">
                        <h3 className="font-mono text-xs text-cyan-400 tracking-widest uppercase">Collaborators</h3>
                        <div className={`font-mono text-xs font-bold ${totalSplit === 100 ? 'text-emerald-500' : 'text-red-500'}`}>
                            TOTAL SPLIT: {totalSplit}% {totalSplit !== 100 && '(MUST EQUAL 100%)'}
                        </div>
                    </div>

                    <div className="space-y-2">
                        {writers.map((writer, idx) => (
                            <motion.div
                                key={idx}
                                initial={{ opacity: 0, x: -10 }}
                                animate={{ opacity: 1, x: 0 }}
                                className="grid grid-cols-12 gap-2 bg-black/20 p-2 rounded-lg border border-white/5 items-center"
                            >
                                <div className="col-span-3">
                                    <input
                                        type="text" placeholder="Legal Name" value={writer.name}
                                        onChange={(e) => updateWriter(idx, 'name', e.target.value)}
                                        className="w-full bg-transparent border border-white/10 p-2 rounded text-xs font-mono text-white focus:border-cyan-500/50 outline-none"
                                    />
                                </div>
                                <div className="col-span-2">
                                    <select
                                        value={writer.role}
                                        onChange={(e) => updateWriter(idx, 'role', e.target.value)}
                                        className="w-full bg-transparent border border-white/10 p-2 rounded text-xs font-mono text-gray-300 focus:border-cyan-500/50 outline-none appearance-none"
                                    >
                                        <option className="bg-gray-900">Writer</option>
                                        <option className="bg-gray-900">Producer</option>
                                        <option className="bg-gray-900">Feature</option>
                                    </select>
                                </div>
                                <div className="col-span-2">
                                    <input
                                        type="text" placeholder="PRO (e.g. ASCAP)" value={writer.pro}
                                        onChange={(e) => updateWriter(idx, 'pro', e.target.value)}
                                        className="w-full bg-transparent border border-white/10 p-2 rounded text-xs font-mono text-white focus:border-cyan-500/50 outline-none"
                                    />
                                </div>
                                <div className="col-span-2">
                                    <input
                                        type="text" placeholder="IPI #" value={writer.ipi}
                                        onChange={(e) => updateWriter(idx, 'ipi', e.target.value)}
                                        className="w-full bg-transparent border border-white/10 p-2 rounded text-xs font-mono text-white focus:border-cyan-500/50 outline-none"
                                    />
                                </div>
                                <div className="col-span-2 flex items-center gap-1">
                                    <input
                                        type="number" min="0" max="100" value={writer.split}
                                        onChange={(e) => updateWriter(idx, 'split', Number(e.target.value))}
                                        className="w-full bg-cyan-900/20 border border-cyan-500/30 p-2 rounded text-xs font-mono text-cyan-400 font-bold focus:border-cyan-500 outline-none text-center"
                                    />
                                    <span className="text-gray-500 font-mono text-xs">%</span>
                                </div>
                                <div className="col-span-1 flex justify-center">
                                    <button onClick={() => removeWriter(idx)} className="text-gray-600 hover:text-red-500 transition-colors">
                                        <Trash2 size={16} />
                                    </button>
                                </div>
                            </motion.div>
                        ))}
                    </div>

                    <button
                        onClick={addWriter}
                        className="w-full border border-dashed border-white/10 rounded-lg py-3 flex items-center justify-center gap-2 font-mono text-xs text-gray-500 hover:text-white hover:border-white/30 hover:bg-white/5 transition-all"
                    >
                        <Plus size={14} /> ADD COLLABORATOR
                    </button>
                </div>

                <div className="pt-6 border-t border-white/10 flex justify-end">
                    <button
                        disabled={totalSplit !== 100 || !songTitle}
                        className="bg-cyan-500 text-black px-6 py-3 rounded uppercase font-mono text-xs font-bold tracking-widest shadow-[0_0_15px_rgba(6,182,212,0.4)] hover:bg-white transition-all flex items-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                        <Download size={16} />
                        EXPORT PDF LOG
                    </button>
                </div>

            </div>
        </div>
    );
}
