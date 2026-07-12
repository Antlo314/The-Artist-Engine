import { useState } from 'react';
import { motion } from 'framer-motion';
import { FileSignature, Plus, Trash2, Download, AlertCircle, Building2 } from 'lucide-react';
import { Panel, Field, Btn, inputCls } from './ui/Shell';

const ACCENT = 'var(--color-zion)';

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
            <div>
                <h2 className="font-display text-xl lg:text-2xl font-semibold text-ink-50 flex items-center gap-2 lg:gap-3">
                    <FileSignature className="text-ink-400 w-5 h-5 lg:w-6 lg:h-6" />
                    Split Sheets
                </h2>
                <p className="font-mono text-[10px] text-ink-400 mt-1 tracking-[0.2em] uppercase">
                    Interactive publishing math & live document preview
                </p>
            </div>

            <div className="grid grid-cols-1 xl:grid-cols-12 gap-6">

                {/* Left Column: Interactive Form */}
                <div className="xl:col-span-7 space-y-6 overflow-y-auto max-h-[80vh] custom-scrollbar pr-2 pb-10">

                    <Panel title="Master Metadata" accent={ACCENT}>
                        <div className="grid grid-cols-2 gap-4">
                            <Field label="Track Title">
                                <input type="text" value={songTitle} onChange={(e) => setSongTitle(e.target.value)} className={inputCls()} />
                            </Field>
                            <Field label="Date of Creation">
                                <input type="date" value={date} onChange={(e) => setDate(e.target.value)} className={`${inputCls()} [color-scheme:dark]`} />
                            </Field>
                        </div>
                    </Panel>

                    <Panel
                        title="The Math"
                        sub="OWNERSHIP GRID"
                        accent={ACCENT}
                        actions={
                            <div className={`font-mono text-xs font-bold px-3 py-1 rounded-full border ${totalSplit === 100 ? 'text-emerald-400 border-emerald-500/40 bg-emerald-900/20' : 'text-red-400 border-red-500/40 bg-red-900/20'}`}>
                                TOTAL: {totalSplit}% {totalSplit !== 100 && '(must equal 100%)'}
                            </div>
                        }
                    >
                        <div className="space-y-4">
                            {writers.map((writer, idx) => (
                                <motion.div key={idx} initial={{ opacity: 0, scale: 0.98 }} animate={{ opacity: 1, scale: 1 }} className={`glass-obsidian rounded-lg border p-4 relative ${writer.role === 'Feature' ? 'border-orange-500/40' : 'border-white/10'}`}>
                                    {writer.role === 'Feature' && (
                                        <div className="absolute top-0 right-0 bg-orange-500 text-ink-950 font-mono text-[8px] font-bold px-2 py-0.5 rounded-bl tracking-widest flex items-center gap-1">
                                            <AlertCircle size={10} /> Feature — negotiate carefully
                                        </div>
                                    )}

                                    <div className="grid grid-cols-12 gap-3 mb-3">
                                        <div className="col-span-4">
                                            <input type="text" placeholder="Legal Name" value={writer.name} onChange={(e) => updateWriter(idx, 'name', e.target.value)} className="w-full bg-transparent border-b border-white/10 p-1 text-sm font-inter text-ink-50 focus:border-purple-400 outline-none placeholder:text-ink-700" />
                                        </div>
                                        <div className="col-span-3">
                                            <select value={writer.role} onChange={(e) => updateWriter(idx, 'role', e.target.value)} className={`w-full bg-transparent border-b border-white/10 p-1 text-xs font-mono focus:border-purple-400 outline-none appearance-none ${writer.role === 'Feature' ? 'text-orange-400' : 'text-ink-50'}`}>
                                                <option className="bg-ink-900 text-ink-50">Writer</option>
                                                <option className="bg-ink-900 text-ink-50">Producer</option>
                                                <option className="bg-ink-900 text-orange-400">Feature</option>
                                            </select>
                                        </div>
                                        <div className="col-span-2">
                                            <input type="text" placeholder="PRO" value={writer.pro} onChange={(e) => updateWriter(idx, 'pro', e.target.value)} className="w-full bg-transparent border-b border-white/10 p-1 text-xs font-mono text-ink-400 focus:border-purple-400 outline-none uppercase placeholder:text-ink-700" />
                                        </div>
                                        <div className="col-span-3 flex items-center gap-1">
                                            <input type="number" min="0" max="100" value={writer.split} onChange={(e) => updateWriter(idx, 'split', Number(e.target.value))} className="w-full bg-ink-900 border border-white/10 p-2 rounded-lg text-lg font-display text-ink-50 focus:border-purple-400 outline-none text-center" />
                                        </div>
                                    </div>

                                    {/* Publisher Expansion */}
                                    <div className="grid grid-cols-12 gap-3 items-center bg-white/[0.03] p-2 rounded-lg border border-white/10 mt-2">
                                        <div className="col-span-4 flex items-center gap-2">
                                            <button
                                                onClick={() => updateWriter(idx, 'hasPublisher', !writer.hasPublisher)}
                                                className={`w-8 h-4 rounded-full p-0.5 transition-colors ${writer.hasPublisher ? 'bg-purple-500' : 'bg-white/15'}`}
                                            >
                                                <motion.div animate={{ x: writer.hasPublisher ? 16 : 0 }} className="w-3 h-3 bg-white rounded-full shadow" />
                                            </button>
                                            <span className="font-mono text-[9px] text-ink-400 uppercase tracking-widest flex items-center gap-1">
                                                <Building2 size={10} className={writer.hasPublisher ? 'text-purple-400' : ''} /> Admin Deal
                                            </span>
                                        </div>

                                        {writer.hasPublisher ? (
                                            <div className="col-span-8 flex items-center gap-3">
                                                <input type="text" placeholder="Publisher Entity (e.g. Sony/ATV)" value={writer.publisherName} onChange={(e) => updateWriter(idx, 'publisherName', e.target.value)} className="flex-1 bg-ink-900 border border-white/10 p-1.5 rounded-lg text-xs font-mono text-ink-50 focus:border-purple-400 outline-none placeholder:text-ink-700" />
                                                <div className="font-mono text-[9px] text-ink-400 flex flex-col items-end">
                                                    <span>Writer: <span className="text-emerald-400 font-bold">{writer.split / 2}%</span></span>
                                                    <span>Pub: <span className="text-red-400 font-bold">{writer.split / 2}%</span></span>
                                                </div>
                                            </div>
                                        ) : (
                                            <div className="col-span-8 flex justify-end">
                                                <span className="font-mono text-[9px] text-emerald-400/80 uppercase tracking-widest">100% Artist Controlled (Self-Published)</span>
                                            </div>
                                        )}
                                    </div>

                                    <div className="flex justify-end mt-2">
                                        <button onClick={() => removeWriter(idx)} className="text-ink-400 hover:text-red-400 hover:border-red-500/40 transition-colors bg-white/[0.03] p-1.5 rounded-full border border-white/10">
                                            <Trash2 size={12} />
                                        </button>
                                    </div>
                                </motion.div>
                            ))}
                        </div>

                        <button onClick={addWriter} className="w-full border border-dashed border-white/15 rounded-xl py-4 flex items-center justify-center gap-2 font-mono text-xs text-ink-400 hover:text-ink-50 hover:border-white/30 transition-colors mt-4">
                            <Plus size={14} /> Add collaborator
                        </button>
                    </Panel>
                </div>

                {/* Right Column: Real-Time Legal Preview */}
                <div className="xl:col-span-5 h-[80vh] flex flex-col">
                    <div className="glass-obsidian rounded-t-xl border border-white/10 border-b-0 p-3 flex items-center justify-between">
                        <div className="flex gap-2">
                            <div className="w-2.5 h-2.5 rounded-full bg-red-500/70" />
                            <div className="w-2.5 h-2.5 rounded-full bg-yellow-500/70" />
                            <div className="w-2.5 h-2.5 rounded-full bg-green-500/70" />
                        </div>
                        <div className="font-mono text-[10px] text-ink-400 tracking-widest">split_sheet_preview.pdf</div>
                        <Btn variant="accent" accent="var(--color-audio)" size="sm" disabled={totalSplit !== 100 || !songTitle}>
                            <Download size={12} /> Export
                        </Btn>
                    </div>
                    <div className="flex-1 bg-[#fdfdfd] text-zinc-800 p-8 font-serif text-[11px] md:text-xs leading-relaxed overflow-y-auto rounded-b-xl border border-t-0 border-white/10 relative">
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
