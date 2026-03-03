import { useState } from 'react';
import { motion } from 'framer-motion';
import { FileSignature, Plus, Trash2, Download, AlertCircle, Building2 } from 'lucide-react';

interface Writer {
    name: string;
    role: string;
    pro: string;
    ipi: string;
    split: number;
    hasPublisher: boolean;
    publisherName: string;
}

export default function SplitSheetGenerator() {
    const [songTitle, setSongTitle] = useState('OMEGA PROTOCOL');
    const [date, setDate] = useState(new Date().toISOString().split('T')[0]);
    const [writers, setWriters] = useState<Writer[]>([
        { name: 'John Doe', role: 'Writer', pro: 'ASCAP', ipi: '123456789', split: 50, hasPublisher: false, publisherName: '' },
        { name: 'Jane Smith', role: 'Producer', pro: 'BMI', ipi: '987654321', split: 50, hasPublisher: true, publisherName: 'Sony Music Publishing' }
    ]);

    const addWriter = () => {
        setWriters([...writers, { name: '', role: 'Writer', pro: '', ipi: '', split: 0, hasPublisher: false, publisherName: '' }]);
    };

    const removeWriter = (index: number) => {
        const newWriters = [...writers];
        newWriters.splice(index, 1);
        setWriters(newWriters);
    };

    const updateWriter = (index: number, field: keyof Writer, value: string | number | boolean) => {
        const newWriters = [...writers];
        (newWriters[index] as any)[field] = value;
        setWriters(newWriters);
    };

    const totalSplit = writers.reduce((acc, curr) => acc + curr.split, 0);

    // Document Generation Logic
    const generateLegalText = () => {
        let text = `MUSIC COMPOSITION & SOUND RECORDING SPLIT AGREEMENT\n`;
        text += `====================================================\n\n`;
        text += `DATE: ${date}\n`;
        text += `TITLE OF ORIGINAL WORK: "${songTitle.toUpperCase()}"\n\n`;
        text += `This document serves as a binding declaration of copyright ownership and revenue splits \n`;
        text += `for the musical composition and sound recording referenced above.\n\n`;
        text += `--- OWNERSHIP DECLARATION ---\n\n`;

        writers.forEach((w, i) => {
            text += `[COLLABORATOR ${i + 1}]\n`;
            text += `Legal Name: ${w.name || '[PENDING]'}\n`;
            text += `Role: ${w.role.toUpperCase()}\n`;
            text += `PRO Affiliation: ${w.pro || '[PENDING]'} | IPI #: ${w.ipi || '[PENDING]'}\n`;
            text += `Total Ownership Share: ${w.split}%\n`;

            if (w.hasPublisher && w.publisherName) {
                text += `>> Administered By: ${w.publisherName}\n`;
                text += `>> Writer's Share: ${w.split / 2}% | Publisher's Share: ${w.split / 2}%\n`;
            } else {
                text += `>> Writer's Share: ${w.split / 2}% | Publisher's Share: ${w.split / 2}% (Self-Published)\n`;
            }
            text += `\n`;
        });

        text += `--- TERMS & CONDITIONS ---\n`;
        text += `1. The parties agree that the splits defined above apply to all worldwide revenue generated\n`;
        text += `by the Composition, including but not limited to mechanical royalties, performance royalties,\n`;
        text += `and synchronization licensing.\n`;
        text += `2. Total splits must equal precisely 100%. Current Calculation: ${totalSplit}%\n\n\n`;

        writers.forEach((w) => {
            text += `Signature: ______________________ Date: _________ (${w.name})\n\n`;
        });

        return text;
    };

    return (
        <div className="space-y-6">
            <div className="flex items-end justify-between border-b border-white/10 pb-4">
                <div>
                    <h2 className="font-cinzel text-3xl font-bold text-white tracking-widest flex items-center gap-3">
                        <FileSignature className="text-cyan-500 drop-shadow-[0_0_10px_rgba(6,182,212,0.8)]" />
                        SPLIT SHEET CACHE v2.0
                    </h2>
                    <p className="font-mono text-xs text-gray-400 mt-1 tracking-widest uppercase">
                        Interactive Publishing Mathematics & Legal Rendering
                    </p>
                </div>
            </div>

            <div className="grid grid-cols-1 xl:grid-cols-12 gap-8">

                {/* Left Column: Interactive Form */}
                <div className="xl:col-span-7 space-y-6 overflow-y-auto max-h-[80vh] custom-scrollbar pr-2 pb-10">

                    <div className="glass-card p-6 rounded-2xl border border-white/5 space-y-4">
                        <h3 className="font-mono text-xs text-cyan-400 tracking-widest uppercase border-b border-white/10 pb-2 mb-4">Master Metadata</h3>
                        <div className="grid grid-cols-2 gap-4">
                            <div>
                                <label className="block font-mono text-[10px] text-gray-500 tracking-widest uppercase mb-1">Track Title</label>
                                <input type="text" value={songTitle} onChange={(e) => setSongTitle(e.target.value)} className="w-full bg-black/40 border border-white/10 p-3 rounded text-white font-cinzel text-lg focus:border-cyan-500/50 outline-none transition-colors" />
                            </div>
                            <div>
                                <label className="block font-mono text-[10px] text-gray-500 tracking-widest uppercase mb-1">Date of Creation</label>
                                <input type="date" value={date} onChange={(e) => setDate(e.target.value)} className="w-full bg-black/40 border border-white/10 p-3 rounded text-gray-300 font-mono text-sm focus:border-cyan-500/50 outline-none transition-colors" />
                            </div>
                        </div>
                    </div>

                    <div className="glass-card p-6 rounded-2xl border border-white/5 space-y-4">
                        <div className="flex justify-between items-end border-b border-white/10 pb-2 mb-4">
                            <h3 className="font-mono text-xs text-cyan-400 tracking-widest uppercase">The Math (Ownership Grid)</h3>
                            <div className={`font-mono text-xs font-bold ${totalSplit === 100 ? 'text-emerald-500 shadow-[0_0_10px_rgba(16,185,129,0.5)]' : 'text-red-500 shadow-[0_0_10px_rgba(239,68,68,0.5)]'} bg-black p-1 px-3 rounded`}>
                                TOTAL PIE: {totalSplit}% {totalSplit !== 100 && '(MUST EQUAL 100%)'}
                            </div>
                        </div>

                        <div className="space-y-4">
                            {writers.map((writer, idx) => (
                                <motion.div key={idx} initial={{ opacity: 0, scale: 0.98 }} animate={{ opacity: 1, scale: 1 }} className={`bg-black/60 p-4 rounded-xl border ${writer.role === 'Feature' ? 'border-orange-500/50 relative overflow-hidden' : 'border-white/10'}`}>
                                    {writer.role === 'Feature' && (
                                        <div className="absolute top-0 right-0 bg-orange-500 text-black font-mono text-[8px] font-bold px-2 py-0.5 rounded-bl tracking-widest flex items-center gap-1">
                                            <AlertCircle size={10} /> FEATURE EXTORTION WARNING
                                        </div>
                                    )}

                                    <div className="grid grid-cols-12 gap-3 mb-3">
                                        <div className="col-span-4">
                                            <input type="text" placeholder="Legal Name" value={writer.name} onChange={(e) => updateWriter(idx, 'name', e.target.value)} className="w-full bg-transparent border-b border-white/10 p-1 text-sm font-inter text-white focus:border-cyan-500 outline-none" />
                                        </div>
                                        <div className="col-span-3">
                                            <select value={writer.role} onChange={(e) => updateWriter(idx, 'role', e.target.value)} className={`w-full bg-transparent border-b border-white/10 p-1 text-xs font-mono focus:border-cyan-500 outline-none appearance-none ${writer.role === 'Feature' ? 'text-orange-400 font-bold' : 'text-gray-300'}`}>
                                                <option className="bg-gray-900 text-white">Writer</option>
                                                <option className="bg-gray-900 text-white">Producer</option>
                                                <option className="bg-gray-900 text-orange-400 font-bold">Feature</option>
                                            </select>
                                        </div>
                                        <div className="col-span-2">
                                            <input type="text" placeholder="PRO" value={writer.pro} onChange={(e) => updateWriter(idx, 'pro', e.target.value)} className="w-full bg-transparent border-b border-white/10 p-1 text-xs font-mono text-gray-400 focus:border-cyan-500 outline-none uppercase" />
                                        </div>
                                        <div className="col-span-3 flex items-center gap-1">
                                            <input type="number" min="0" max="100" value={writer.split} onChange={(e) => updateWriter(idx, 'split', Number(e.target.value))} className="w-full bg-cyan-950/30 border border-cyan-500/50 p-2 rounded text-lg font-cinzel text-cyan-400 font-bold focus:border-cyan-400 outline-none text-center" />
                                        </div>
                                    </div>

                                    {/* Publisher Expansion */}
                                    <div className="grid grid-cols-12 gap-3 items-center bg-white/5 p-2 rounded border border-white/5 mt-2">
                                        <div className="col-span-4 flex items-center gap-2">
                                            <button
                                                onClick={() => updateWriter(idx, 'hasPublisher', !writer.hasPublisher)}
                                                className={`w-8 h-4 rounded-full p-0.5 transition-colors ${writer.hasPublisher ? 'bg-purple-500' : 'bg-gray-700'}`}
                                            >
                                                <motion.div animate={{ x: writer.hasPublisher ? 16 : 0 }} className="w-3 h-3 bg-white rounded-full shadow" />
                                            </button>
                                            <span className="font-mono text-[9px] text-gray-500 uppercase tracking-widest flex items-center gap-1">
                                                <Building2 size={10} className={writer.hasPublisher ? 'text-purple-400' : ''} /> Admin Deal
                                            </span>
                                        </div>

                                        {writer.hasPublisher ? (
                                            <div className="col-span-8 flex items-center gap-3">
                                                <input type="text" placeholder="Publisher Entity (e.g. Sony/ATV)" value={writer.publisherName} onChange={(e) => updateWriter(idx, 'publisherName', e.target.value)} className="flex-1 bg-black/50 border border-purple-500/30 p-1.5 rounded text-xs font-mono text-purple-300 focus:border-purple-400 outline-none" />
                                                <div className="font-mono text-[9px] text-gray-400 flex flex-col items-end">
                                                    <span>Writer: <span className="text-emerald-400 font-bold">{writer.split / 2}%</span></span>
                                                    <span>Pub: <span className="text-red-400 font-bold">{writer.split / 2}%</span></span>
                                                </div>
                                            </div>
                                        ) : (
                                            <div className="col-span-8 flex justify-end">
                                                <span className="font-mono text-[9px] text-emerald-500/50 uppercase tracking-widest">100% Artist Controlled (Self-Published)</span>
                                            </div>
                                        )}
                                    </div>

                                    <div className="flex justify-end mt-2">
                                        <button onClick={() => removeWriter(idx)} className="text-gray-600 hover:text-red-500 transition-colors bg-black/40 p-1.5 rounded-full border border-white/5">
                                            <Trash2 size={12} />
                                        </button>
                                    </div>
                                </motion.div>
                            ))}
                        </div>

                        <button onClick={addWriter} className="w-full border border-dashed border-cyan-500/30 bg-cyan-950/10 rounded-xl py-4 flex items-center justify-center gap-2 font-mono text-xs text-cyan-500 hover:text-cyan-300 hover:border-cyan-400 hover:bg-cyan-900/30 transition-all shadow-[inset_0_0_20px_rgba(6,182,212,0.05)]">
                            <Plus size={14} /> ADD COLLABORATOR TO AGREEMENT
                        </button>
                    </div>
                </div>

                {/* Right Column: Real-Time Legal Preview */}
                <div className="xl:col-span-5 h-[80vh] flex flex-col">
                    <div className="bg-zinc-900 border border-zinc-700 rounded-t-xl p-3 flex items-center justify-between shadow-lg z-10">
                        <div className="flex gap-2">
                            <div className="w-3 h-3 rounded-full bg-red-500" />
                            <div className="w-3 h-3 rounded-full bg-yellow-500" />
                            <div className="w-3 h-3 rounded-full bg-green-500" />
                        </div>
                        <div className="font-mono text-[10px] text-zinc-400 tracking-widest">LIVE_CONTRACT_RENDER.pdf</div>
                        <div>
                            <button disabled={totalSplit !== 100 || !songTitle} className="bg-cyan-500 text-black px-3 py-1 rounded text-[10px] font-bold tracking-widest flex items-center gap-1 disabled:opacity-50 hover:bg-white transition-colors">
                                <Download size={12} /> EXPORT
                            </button>
                        </div>
                    </div>
                    <div className="flex-1 bg-[#fdfdfd] text-zinc-800 p-8 font-serif text-[11px] md:text-xs leading-relaxed overflow-y-auto rounded-b-xl border border-t-0 border-zinc-700 shadow-2xl relative">
                        {totalSplit !== 100 && (
                            <div className="absolute inset-0 bg-red-500/5 flex items-center justify-center pointer-events-none z-0">
                                <div className="text-4xl md:text-6xl font-black text-red-500/10 rotate-[-45deg] tracking-widest font-mono">INVALID SPLIT</div>
                            </div>
                        )}
                        <pre className="whitespace-pre-wrap font-serif relative z-10 selection:bg-cyan-200">
                            {generateLegalText()}
                        </pre>
                    </div>
                </div>

            </div>
        </div>
    );
}
