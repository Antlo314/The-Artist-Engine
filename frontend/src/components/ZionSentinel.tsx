import React, { useState, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Scale, FileText, Activity, AlertOctagon, TrendingUp, ShieldAlert, CheckCircle2, UploadCloud, Sword, X } from 'lucide-react';
import { codexEntries } from './TheCodex';
import LoadingProgressBar from './LoadingProgressBar';

export default function ZionSentinel() {
    const [contractText, setContractText] = useState('');
    const [file, setFile] = useState<File | null>(null);
    const [scanType, setScanType] = useState<'contract' | 'offer'>('contract');
    const [isDragging, setIsDragging] = useState(false);
    const [isScanning, setIsScanning] = useState(false);
    const [analysis, setAnalysis] = useState<any>(null);
    const fileInputRef = useRef<HTMLInputElement>(null);

    const handleDrop = (e: React.DragEvent) => {
        e.preventDefault();
        setIsDragging(false);
        if (e.dataTransfer.files && e.dataTransfer.files[0]) {
            setFile(e.dataTransfer.files[0]);
            setContractText('');
        }
    };

    const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
        if (e.target.files && e.target.files[0]) {
            setFile(e.target.files[0]);
            setContractText('');
        }
    };

    const handleScan = async () => {
        setIsScanning(true);
        setAnalysis(null);
        try {
            const formData = new FormData();
            if (file) formData.append('file', file);
            if (contractText) formData.append('text', contractText);
            formData.append('scan_type', scanType);

            const response = await fetch('/api/analyze-contract', {
                method: 'POST',
                body: formData
            });

            if (!response.ok) throw new Error(`Status ${response.status}`);
            const data = await response.json();

            if (data.status === 'success') {
                setAnalysis(data.analysis);
            } else {
                throw new Error(data.error || 'Legal Scan Failed');
            }
        } catch (err) {
            console.error(err);
            alert("Forensic scan failed. Check console.");
        } finally {
            setIsScanning(false);
        }
    };

    const ScoreGauge = ({ score }: { score: number }) => {
        const color = score > 75 ? 'emerald' : score > 40 ? 'yellow' : 'red';
        const strokeColor = score > 75 ? '#10b981' : score > 40 ? '#eab308' : '#ef4444';
        return (
            <div className="relative flex flex-col items-center justify-center p-6 border border-white/10 rounded-2xl glass-obsidian shadow-[inset_0_0_20px_rgba(168,85,247,0.1)]">
                <svg viewBox="0 0 100 50" className="w-32 h-16 overflow-visible mb-4">
                    {/* Background Arc */}
                    <path d="M 10 50 A 40 40 0 0 1 90 50" fill="none" stroke="#1f1f26" strokeWidth="12" strokeLinecap="round" />
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
                <div className="absolute top-12 font-mono text-3xl font-bold text-purple-400 drop-shadow-[0_0_10px_rgba(168,85,247,0.8)]">
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

        let elements: React.ReactNode[] = [text];

        codexEntries.forEach(entry => {
            const regex = new RegExp(`(${entry.term})`, 'gi');

            const newElements: React.ReactNode[] = [];
            elements.forEach((part, partIdx) => {
                if (typeof part !== 'string') {
                    newElements.push(part);
                    return;
                }

                const splitParts = part.split(regex);
                splitParts.forEach((subPart, i) => {
                    // Even indices are non-matches, odd indices are matches
                    if (i % 2 === 0) {
                        newElements.push(subPart);
                    } else {
                        // Tailwind requires explicit class names for JIT compilation; cannot build dynamically with string templates
                        const getColors = (level: string) => {
                            switch (level) {
                                case 'CRITICAL': return { text: 'text-red-400', border: 'border-red-500', bg: 'bg-red-900/20', hover: 'hover:text-red-300', panelBorder: 'border-red-500/50', panelHeader: 'text-red-500', borderBottom: 'border-red-900/50' };
                                case 'HIGH': return { text: 'text-purple-400', border: 'border-purple-500', bg: 'bg-purple-900/20', hover: 'hover:text-purple-300', panelBorder: 'border-purple-500/50', panelHeader: 'text-purple-400', borderBottom: 'border-purple-900/50' };
                                case 'WARNING': return { text: 'text-orange-400', border: 'border-orange-500', bg: 'bg-orange-900/20', hover: 'hover:text-orange-300', panelBorder: 'border-orange-500/50', panelHeader: 'text-orange-500', borderBottom: 'border-orange-900/50' };
                                default: return { text: 'text-emerald-400', border: 'border-emerald-500', bg: 'bg-emerald-900/20', hover: 'hover:text-emerald-300', panelBorder: 'border-emerald-500/50', panelHeader: 'text-emerald-500', borderBottom: 'border-emerald-900/50' };
                            }
                        };
                        const c = getColors(entry.dangerLevel || 'CRITICAL');

                        // Use a details/summary approach for pure CSS collapse without needing complex React state mapping for every word
                        newElements.push(
                            <details key={`${entry.term}-${partIdx}-${i}`} className={`inline-block group cursor-pointer border-b border-dashed ${c.border} ${c.text} font-bold ${c.bg} px-1 rounded mx-0.5 relative align-bottom`}>
                                <summary className={`list-none ${c.hover} transition-colors focus:outline-none flex items-center gap-1 inline-flex`}>
                                    {subPart} <span className="text-[8px] opacity-50">▼</span>
                                </summary>
                                <div className={`absolute top-full left-0 mt-2 w-64 p-3 bg-ink-900/90 backdrop-blur-md border ${c.panelBorder} rounded-lg shadow-[0_0_30px_rgba(168,85,247,0.3)] z-[100] flex flex-col gap-1 text-left font-normal cursor-default`}>
                                    <span className={`font-mono text-[10px] ${c.panelHeader} tracking-widest uppercase border-b ${c.borderBottom} pb-1 mb-1 flex justify-between items-center`}>
                                        {entry.term}
                                    </span>
                                    <span className="font-inter text-xs text-ink-200 leading-tight">"{entry.translation}"</span>
                                    <span className="font-mono text-[9px] text-ink-400 leading-tight mt-1 bg-purple-900/20 p-1 rounded border border-white/10">{entry.meaning}</span>
                                </div>
                            </details>
                        );
                    }
                });
            });
            elements = newElements;
        });

        return <>{elements}</>;
    };

    return (
        <div className="space-y-6">
            <div className="flex items-end justify-between border-b border-white/10 pb-2 lg:pb-4">
                <div>
                    <h2 className="font-display text-xl lg:text-3xl font-bold text-purple-400 tracking-widest flex items-center gap-2 lg:gap-3 drop-shadow-[0_0_10px_rgba(168,85,247,0.8)]">
                        <Scale className="text-purple-400 drop-shadow-[0_0_10px_rgba(168,85,247,0.8)] w-5 h-5 lg:w-8 lg:h-8" />
                        ZION SHARK PROTOCOL
                    </h2>
                    <p className="font-mono text-xs text-purple-300/80 mt-1 tracking-widest uppercase drop-shadow-md hidden sm:block">
                        Automated Legal Analysis & Strategic Offer Negotiations
                    </p>
                </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">

                {/* Document Ingest Box */}
                <div className={`glass-obsidian glass-obsidian-hover rounded-2xl flex flex-col border transition-colors shadow-xl relative overflow-hidden group focus-within:border-purple-500/50 ${isDragging ? 'border-purple-500 bg-purple-900/10' : 'border-white/10'}`}>
                    <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-purple-800 to-transparent" />

                    {/* Toggle Switch */}
                    <div className="p-4 border-b border-white/10 glass-obsidian flex justify-between items-center gap-4">
                        <div className="flex bg-ink-900 border border-white/10 rounded-lg p-1 w-full max-w-xs shadow-inner">
                            <button
                                onClick={() => setScanType('contract')}
                                className={`flex-1 py-1.5 px-3 rounded text-[10px] font-mono tracking-widest uppercase transition-colors flex items-center justify-center gap-2 ${scanType === 'contract' ? 'bg-purple-900/40 text-purple-300 border border-purple-500/50 shadow-[0_0_15px_rgba(168,85,247,0.3)]' : 'text-purple-400/50 hover:text-purple-300 hover:bg-purple-900/20 text-glow'}`}
                            >
                                <Scale size={12} /> Contract Scan
                            </button>
                            <button
                                onClick={() => setScanType('offer')}
                                className={`flex-1 py-1.5 px-3 rounded text-[10px] font-mono tracking-widest uppercase transition-colors flex items-center justify-center gap-2 ${scanType === 'offer' ? 'bg-red-900/40 text-red-400 border border-red-500/50 shadow-[0_0_15px_rgba(239,68,68,0.3)]' : 'text-purple-400/50 hover:text-purple-300 hover:bg-purple-900/20 text-glow'}`}
                            >
                                <Sword size={12} /> Offer Negot.
                            </button>
                        </div>
                        <span className="flex h-2 w-2 relative">
                            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-purple-400 opacity-75 shadow-[0_0_10px_rgba(168,85,247,0.8)]" />
                            <span className="relative inline-flex rounded-full h-2 w-2 bg-purple-500 shadow-[0_0_10px_rgba(168,85,247,0.8)]" />
                        </span>
                    </div>

                    <div
                        className="flex-1 flex flex-col relative"
                        onDragOver={(e) => { e.preventDefault(); setIsDragging(true); }}
                        onDragLeave={() => setIsDragging(false)}
                        onDrop={handleDrop}
                    >
                        {file ? (
                            <div className="flex-1 flex flex-col items-center justify-center p-4 lg:p-8 glass-obsidian min-h-[250px] lg:min-h-[400px]">
                                <FileText size={48} className="text-purple-400 mb-4 drop-shadow-[0_0_15px_rgba(168,85,247,0.8)]" />
                                <span className="font-mono text-xs lg:text-sm text-purple-300 drop-shadow-md text-center break-all px-4">{file.name}</span>
                                <span className="font-mono text-[10px] text-purple-400/60 mt-2">{(file.size / 1024 / 1024).toFixed(2)} MB</span>
                                <button
                                    onClick={() => setFile(null)}
                                    className="mt-6 text-xs font-mono text-red-400 border border-red-500/50 bg-red-900/20 px-4 py-2 rounded hover:bg-red-900/40 transition-colors flex items-center gap-2 shadow-[0_0_15px_rgba(239,68,68,0.2)]"
                                >
                                    <X size={14} /> REMOVE FILE
                                </button>
                            </div>
                        ) : (
                            <>
                                <textarea
                                    className="flex-1 bg-transparent p-4 lg:p-6 text-xs lg:text-sm font-mono text-ink-200 focus:outline-none resize-none placeholder:text-ink-400 min-h-[250px] lg:min-h-[400px] z-10 relative custom-scrollbar leading-relaxed"
                                    placeholder={`PASTE OR DRAG ${scanType === 'contract' ? 'CONTRACT TEXT (.pdf, .docx, .txt)' : 'VENUE OFFER'} HERE FOR FORENSIC REVIEW...\\n\\n(MAX LIMIT: ~15 PAGES / 7,500 WORDS PER SCAN)`}
                                    value={contractText}
                                    onChange={e => setContractText(e.target.value)}
                                />
                                {contractText.length === 0 && (
                                    <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none z-0 opacity-40 px-4 text-center">
                                        <UploadCloud size={48} className="mb-2 lg:mb-4 lg:w-16 lg:h-16 text-purple-500 drop-shadow-[0_0_20px_rgba(168,85,247,0.5)]" />
                                        <span className="font-display text-sm sm:text-base lg:text-xl tracking-widest text-purple-400 drop-shadow-[0_0_10px_rgba(168,85,247,0.7)] text-glow">DRAG & DROP MODULE</span>
                                        <span className="font-mono text-[10px] text-purple-300/60 mt-2 tracking-widest drop-shadow-md">NEXUS LIMIT: ~15 PAGES OR 7,500 WORDS</span>
                                    </div>
                                )}
                            </>
                        )}
                        <input
                            type="file"
                            ref={fileInputRef}
                            className="hidden"
                            accept=".pdf,.txt,.docx"
                            onChange={handleFileSelect}
                        />
                    </div>

                    <div className="p-4 bg-ink-900 border-t border-white/10 flex flex-col md:flex-row gap-4 justify-between items-center backdrop-blur-md">
                        <button
                            onClick={() => fileInputRef.current?.click()}
                            className="text-[10px] font-mono text-purple-400/80 hover:text-purple-300 transition-colors flex items-center gap-2 tracking-widest bg-purple-900/20 px-3 py-1.5 rounded border border-white/10 shadow-sm drop-shadow-md text-glow"
                        >
                            <UploadCloud size={12} /> BROWSE LOCAL FILES (.PDF, .DOCX)
                        </button>
                        <button
                            onClick={handleScan}
                            disabled={(!contractText && !file) || isScanning}
                            className={`px-8 py-3 rounded tracking-widest font-mono text-xs uppercase font-bold transition-all disabled:opacity-50 flex items-center gap-2 relative overflow-hidden shadow-[0_0_15px_rgba(168,85,247,0.3)] ${scanType === 'offer' ? 'bg-red-900/40 text-red-400 border border-red-500/50 hover:bg-red-600 hover:text-black hover:shadow-[0_0_30px_rgba(239,68,68,0.5)]' : 'bg-purple-900/30 text-purple-400 border border-purple-500/50 hover:bg-purple-600 hover:text-black hover:shadow-[0_0_30px_rgba(168,85,247,0.5)]'}`}
                        >
                            {isScanning && <div className={`absolute inset-0 ${scanType === 'offer' ? 'bg-red-300/30' : 'bg-purple-700/30'} w-fit pointer-events-none origin-left flex animate-pulse`} />}
                            {isScanning ? <Activity size={16} className="animate-spin relative z-10" /> : <Scale size={16} />}
                            <span className="relative z-10">{isScanning ? "EXECUTING PROTOCOL..." : "INITIATE SCAN"}</span>
                        </button>
                    </div>
                </div>

                {/* Analysis Output Container */}
                <div className="flex flex-col h-full gap-4 relative">

                    {!analysis && !isScanning && (
                        <div className="flex-1 glass-obsidian border-dashed border-white/10 rounded-2xl flex items-center justify-center p-8 text-center">
                            <p className="font-mono text-sm text-purple-300/60 tracking-widest uppercase">
                                Awaiting legal payload for structural breakdown.
                            </p>
                        </div>
                    )}

                    {isScanning && (
                        <div className="flex-1 flex flex-col items-center justify-center">
                            <LoadingProgressBar
                                active={isScanning}
                                message="DEPLOYING ZION ENGINES"
                                subMessage="Hunting Predatory Signatures. Engine may take 30-40s to respond."
                                colorClass="emerald"
                                estimatedDurationMs={25000}
                            />
                        </div>
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
                                <div className="col-span-2 glass-obsidian p-6 border-white/10 rounded-2xl flex flex-col justify-center relative overflow-hidden">
                                    <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_right,rgba(168,85,247,0.1),transparent_50%)] pointer-events-none" />
                                    <h4 className="font-mono text-xs uppercase tracking-widest text-purple-400 mb-2 drop-shadow-md border-b border-white/10 pb-2 flex items-center gap-2">
                                        <TrendingUp size={12} /> Strategic Summary
                                    </h4>
                                    <p className="text-xs font-inter text-ink-200 leading-relaxed z-10">
                                        {renderWithCodex(analysis.summary)}
                                    </p>
                                </div>
                            </div>

                            {/* Red Flags List */}
                            {analysis.red_flags && analysis.red_flags.length > 0 && (
                                <div className="glass-obsidian rounded-2xl border border-red-500/30 overflow-hidden relative shadow-[0_0_20px_rgba(239,68,68,0.1)]">
                                    <div className="absolute top-0 right-0 p-4 opacity-5 pointer-events-none">
                                        <AlertOctagon size={100} className="text-red-500" />
                                    </div>
                                    <div className="bg-red-900/20 p-4 border-b border-red-500/30 flex items-center justify-between">
                                        <h3 className="font-display text-lg text-red-500 font-bold tracking-widest flex items-center gap-2 drop-shadow-[0_0_8px_rgba(239,68,68,0.8)]">
                                            <ShieldAlert className="text-red-500" /> THREATS DETECTED: {analysis.red_flags.length}
                                        </h3>
                                    </div>
                                    <div className="p-4 space-y-4 bg-ink-900">
                                        {analysis.red_flags.map((flag: any, idx: number) => (
                                            <div key={idx} className="bg-ink-800 border border-red-500/30 rounded p-4 relative group shadow-sm">
                                                <div className="w-1 h-full bg-red-500 absolute left-0 top-0 overflow-hidden rounded-l shadow-[0_0_10px_rgba(239,68,68,0.8)]" />
                                                <p className="text-xs font-mono text-ink-400 italic mb-2 border-l-2 border-red-500/50 pl-2">
                                                    "...{renderWithCodex(flag.clause)}..."
                                                </p>
                                                <p className="text-sm font-inter text-red-400 font-bold mb-1 relative z-10 drop-shadow-md">
                                                    RISK: {renderWithCodex(flag.risk)}
                                                </p>
                                                <p className="text-sm font-inter text-emerald-400 flex items-start gap-2 mt-3 bg-emerald-900/20 p-2 rounded border border-emerald-500/30 relative z-10 shadow-[inset_0_0_15px_rgba(16,185,129,0.1)]">
                                                    <CheckCircle2 size={16} className="mt-0.5 shrink-0 text-emerald-400 drop-shadow-[0_0_5px_rgba(16,185,129,0.8)]" /> <span><span className="font-mono text-[10px] text-emerald-300 tracking-widest uppercase block mb-1">Recommended Fix</span>{renderWithCodex(flag.fix)}</span>
                                                </p>
                                            </div>
                                        ))}
                                    </div>
                                </div>
                            )}

                            {/* Legal Rebuttal */}
                            <div className="glass-obsidian p-6 rounded-2xl border border-white/10 mt-4 relative shadow-[inset_0_0_20px_rgba(168,85,247,0.1)]">
                                <h4 className="font-display text-lg text-purple-400 tracking-widest border-b border-white/10 pb-2 mb-4 flex items-center justify-between drop-shadow-[0_0_8px_rgba(168,85,247,0.8)]">
                                    SOVEREIGN REBUTTAL
                                    <button
                                        onClick={(e) => {
                                            navigator.clipboard.writeText(analysis.shark_rebuttal);
                                            const btn = e.currentTarget;
                                            btn.innerText = 'COPIED!';
                                            btn.classList.add('text-emerald-400', 'border-emerald-500/50', 'bg-emerald-900/20', 'shadow-[0_0_10px_rgba(16,185,129,0.5)]');
                                            setTimeout(() => {
                                                btn.innerText = 'COPY';
                                                btn.classList.remove('text-emerald-400', 'border-emerald-500/50', 'bg-emerald-900/20', 'shadow-[0_0_10px_rgba(16,185,129,0.5)]');
                                            }, 2000);
                                        }}
                                        className="font-mono text-[10px] bg-purple-900/20 border border-white/10 px-3 py-1 rounded text-purple-400/80 hover:text-purple-300 transition-colors shadow-sm text-glow"
                                    >
                                        COPY
                                    </button>
                                </h4>
                                <div className="text-sm font-inter text-ink-200 leading-relaxed whitespace-pre-wrap bg-ink-900 p-4 rounded border border-white/10 shadow-inner">
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
