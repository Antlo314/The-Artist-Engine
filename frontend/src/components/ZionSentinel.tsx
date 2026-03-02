import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Scale, FileText, Activity, AlertOctagon, TrendingUp, ShieldAlert, CheckCircle2 } from 'lucide-react';
import { codexEntries } from './TheCodex';

export default function ZionSentinel() {
    const [contractText, setContractText] = useState('');
    const [isScanning, setIsScanning] = useState(false);
    const [analysis, setAnalysis] = useState<any>(null);

    const handleScan = async () => {
        setIsScanning(true);
        setAnalysis(null);
        try {
            const formData = new FormData();
            formData.append('text', contractText);

            const res = await fetch('http://localhost:8000/api/analyze-contract', {
                method: 'POST',
                body: formData
            });
            const data = await res.json();
            if (data.status === 'success') {
                setAnalysis(data.analysis);
            } else {
                throw new Error("Failed to parse contract logic.");
            }
        } catch (err) {
            console.error(err);
        } finally {
            setIsScanning(false);
        }
    };

    const ScoreGauge = ({ score }: { score: number }) => {
        const color = score > 75 ? 'emerald' : score > 40 ? 'yellow' : 'red';
        const strokeColor = score > 75 ? '#10b981' : score > 40 ? '#eab308' : '#ef4444';
        return (
            <div className="relative flex flex-col items-center justify-center p-6 border border-white/5 rounded-2xl bg-black/40">
                <svg viewBox="0 0 100 50" className="w-32 h-16 overflow-visible mb-4">
                    {/* Background Arc */}
                    <path d="M 10 50 A 40 40 0 0 1 90 50" fill="none" stroke="#1f2937" strokeWidth="12" strokeLinecap="round" />
                    {/* Foreground Arc */}
                    <motion.path
                        d="M 10 50 A 40 40 0 0 1 90 50"
                        fill="none"
                        stroke={strokeColor}
                        strokeWidth="12"
                        strokeLinecap="round"
                        strokeDasharray="125.6"
                        initial={{ strokeDashoffset: 125.6 }}
                        animate={{ strokeDashoffset: 125.6 - (125.6 * (score / 100)) }}
                        transition={{ duration: 1.5, ease: "easeOut" }}
                    />
                </svg>
                <div className="absolute top-12 font-mono text-3xl font-bold text-white drop-shadow-[0_0_10px_rgba(255,255,255,0.5)]">
                    {score}
                </div>
                <div className={`mt-2 font-mono text-[10px] uppercase tracking-widest px-2 py-1 rounded bg-${color}-900/30 text-${color}-400 border border-${color}-500/30`}>
                    Integrity Score
                </div>
            </div>
        );
    };

    const renderWithCodex = (text: string) => {
        if (!text) return text;

        let elements: (string | React.ReactNode)[] = [text];

        codexEntries.forEach(entry => {
            const regex = new RegExp(`(${entry.term})`, 'gi');

            elements = elements.flatMap((part, partIdx) => {
                if (typeof part !== 'string') return [part];

                const splitParts = part.split(regex);
                return splitParts.map((subPart, i) => {
                    // Even indices are non-matches, odd indices are matches
                    if (i % 2 === 0) return subPart;

                    return (
                        <span key={`${entry.term}-${partIdx}-${i}`} className="relative inline-block group cursor-help border-b border-dashed border-red-500 text-red-400 font-bold bg-red-900/20 px-1 rounded mx-0.5">
                            {subPart}
                            <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 w-64 p-3 bg-black border border-red-500/50 rounded-lg shadow-2xl opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none z-50 flex flex-col gap-1">
                                <span className="font-mono text-[10px] text-red-500 tracking-widest uppercase border-b border-red-900/50 pb-1 mb-1">{entry.term}</span>
                                <span className="font-inter text-xs text-gray-200 leading-tight">"{entry.translation}"</span>
                                <span className="font-mono text-[9px] text-gray-400 leading-tight mt-1 bg-white/5 p-1 rounded border border-white/5">{entry.meaning}</span>
                            </div>
                        </span>
                    );
                });
            });
        });

        return <>{elements}</>;
    };

    return (
        <div className="space-y-6">
            <div className="flex items-end justify-between border-b border-white/10 pb-4">
                <div>
                    <h2 className="font-cinzel text-3xl font-bold text-white tracking-widest flex items-center gap-3">
                        <Scale className="text-emerald-500 drop-shadow-[0_0_10px_rgba(16,185,129,0.8)]" />
                        ZION SENTINEL
                    </h2>
                    <p className="font-mono text-xs text-gray-400 mt-1 tracking-widest uppercase">
                        Automated Legal Forensics // Clause Neutralization
                    </p>
                </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">

                {/* Document Ingest Box */}
                <div className="glass-card rounded-2xl flex flex-col border border-emerald-900/30 relative overflow-hidden group focus-within:border-emerald-500/50 transition-colors shadow-2xl">
                    <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-emerald-600 to-transparent" />
                    <div className="p-4 border-b border-white/5 bg-black/40 flex justify-between items-center">
                        <span className="font-mono text-xs text-gray-400 tracking-widest flex items-center gap-2">
                            <FileText size={14} className="text-emerald-500" /> RAW CONTRACT FEED
                        </span>
                        <span className="flex h-2 w-2 relative">
                            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75" />
                            <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500" />
                        </span>
                    </div>

                    <textarea
                        className="flex-1 bg-transparent p-6 text-sm font-mono text-gray-300 focus:outline-none resize-none placeholder-gray-700 min-h-[400px]"
                        placeholder="PASTE CONTRACT TEXT HERE FOR FORENSIC REVIEW..."
                        value={contractText}
                        onChange={e => setContractText(e.target.value)}
                    />

                    <div className="p-4 bg-black/60 border-t border-white/5 flex justify-between items-center">
                        <p className="text-[10px] font-mono text-gray-500 tracking-widest">Supports .txt, .pdf, or raw paste</p>
                        <button
                            onClick={handleScan}
                            disabled={!contractText || isScanning}
                            className="bg-emerald-900/30 text-emerald-500 border border-emerald-500/50 hover:bg-emerald-500 hover:text-black hover:shadow-[0_0_20px_rgba(16,185,129,0.4)] px-8 py-3 rounded tracking-widest font-mono text-xs uppercase font-bold transition-all disabled:opacity-50 flex items-center gap-2 relative overflow-hidden"
                        >
                            {isScanning && <div className="absolute inset-0 bg-emerald-500/20 w-fit pointer-events-none origin-left flex animate-pulse" />}
                            {isScanning ? <Activity size={16} className="animate-spin relative z-10" /> : <Scale size={16} />}
                            <span className="relative z-10">{isScanning ? "EXECUTING FORENSICS..." : "INITIATE SCAN"}</span>
                        </button>
                    </div>
                </div>

                {/* Analysis Output Container */}
                <div className="flex flex-col h-full gap-4 relative">

                    {!analysis && !isScanning && (
                        <div className="flex-1 glass-card border-dashed border-white/10 rounded-2xl flex items-center justify-center p-8 text-center bg-black/20">
                            <p className="font-mono text-sm text-gray-600 tracking-widest uppercase">
                                Awaiting legal payload for structural breakdown.
                            </p>
                        </div>
                    )}

                    {isScanning && (
                        <motion.div
                            initial={{ opacity: 0 }} animate={{ opacity: 1 }}
                            className="flex-1 glass-card border-emerald-500/20 rounded-2xl flex flex-col items-center justify-center p-8 text-center relative overflow-hidden"
                        >
                            <div className="absolute inset-0 bg-[linear-gradient(rgba(16,185,129,0.05)_1px,transparent_1px)] bg-[size:100%_4px] animate-pulse" />
                            <Scale size={48} className="text-emerald-500 mb-6 drop-shadow-[0_0_15px_rgba(16,185,129,0.8)]" />
                            <h3 className="font-cinzel text-xl text-white tracking-widest">DEPLOYING ZION ENGINES</h3>
                            <p className="font-mono text-xs text-emerald-400 mt-2 tracking-widest font-bold">Hunting Predatory Signatures...</p>

                            <div className="mt-8 flex gap-2">
                                {[0, 1, 2].map(i => (
                                    <motion.div
                                        key={i}
                                        className="h-2 w-8 bg-emerald-500/50 rounded"
                                        animate={{ opacity: [0.3, 1, 0.3] }}
                                        transition={{ duration: 1.5, repeat: Infinity, delay: i * 0.2 }}
                                    />
                                ))}
                            </div>
                        </motion.div>
                    )}

                    {analysis && (
                        <motion.div
                            key="result"
                            initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }}
                            className="flex-1 flex flex-col gap-4 overflow-y-auto pr-2 custom-scrollbar"
                        >
                            {/* Top Row: Score & Parties */}
                            <div className="grid grid-cols-3 gap-4">
                                <ScoreGauge score={analysis.integrity_score || 50} />
                                <div className="col-span-2 glass-card p-6 border-white/5 rounded-2xl flex flex-col justify-center">
                                    <h4 className="font-mono text-xs uppercase tracking-widest text-emerald-500 mb-2 drop-shadow-md border-b border-emerald-900/30 pb-2 flex items-center gap-2">
                                        <TrendingUp size={12} /> Strategic Summary
                                    </h4>
                                    <p className="text-xs font-inter text-gray-300 leading-relaxed font-bold">
                                        {renderWithCodex(analysis.summary)}
                                    </p>
                                </div>
                            </div>

                            {/* Red Flags List */}
                            {analysis.red_flags && analysis.red_flags.length > 0 && (
                                <div className="glass-card rounded-2xl border border-red-900/30 overflow-hidden relative">
                                    <div className="absolute top-0 right-0 p-4 opacity-10 pointer-events-none">
                                        <AlertOctagon size={100} className="text-red-500" />
                                    </div>
                                    <div className="bg-red-950/40 p-4 border-b border-red-900/50 flex items-center justify-between">
                                        <h3 className="font-cinzel text-lg text-white font-bold tracking-widest flex items-center gap-2">
                                            <ShieldAlert className="text-red-500" /> THREATS DETECTED: {analysis.red_flags.length}
                                        </h3>
                                    </div>
                                    <div className="p-4 space-y-4">
                                        {analysis.red_flags.map((flag: any, idx: number) => (
                                            <div key={idx} className="bg-black/60 border border-red-500/20 rounded p-4 relative overflow-hidden group">
                                                <div className="w-1 h-full bg-red-500 absolute left-0 top-0" />
                                                <p className="text-xs font-mono text-gray-400 italic mb-2 border-l-2 border-red-500/30 pl-2">
                                                    "...{renderWithCodex(flag.clause)}..."
                                                </p>
                                                <p className="text-sm font-inter text-red-100 font-bold mb-1">
                                                    RISK: {renderWithCodex(flag.risk)}
                                                </p>
                                                <p className="text-sm font-inter text-emerald-400 flex items-start gap-2 mt-3 bg-emerald-950/20 p-2 rounded">
                                                    <CheckCircle2 size={16} className="mt-0.5 shrink-0" /> <span><span className="font-mono text-[10px] text-emerald-600 tracking-widest uppercase block mb-1">Recommended Fix</span>{renderWithCodex(flag.fix)}</span>
                                                </p>
                                            </div>
                                        ))}
                                    </div>
                                </div>
                            )}

                            {/* Legal Rebuttal */}
                            <div className="glass-card p-6 rounded-2xl border border-emerald-900/30 mt-4 relative">
                                <h4 className="font-cinzel text-lg text-white tracking-widest border-b border-emerald-900/50 pb-2 mb-4 flex items-center justify-between">
                                    SOVEREIGN REBUTTAL
                                    <button className="font-mono text-[10px] bg-white/5 border border-white/10 px-3 py-1 rounded text-gray-400 hover:text-white transition-colors">COPY</button>
                                </h4>
                                <div className="text-sm font-inter text-gray-300 leading-relaxed whitespace-pre-wrap bg-black/40 p-4 rounded border border-white/5">
                                    {analysis.shark_rebuttal}
                                </div>
                            </div>
                        </motion.div>
                    )}
                </div>
            </div>
        </div>
    );
}
