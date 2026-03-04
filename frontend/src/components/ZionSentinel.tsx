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

            const response = await fetch('https://the-artist-engine.onrender.com/api/analyze-contract', {
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
            <div className="relative flex flex-col items-center justify-center p-6 border border-purple-900/10 rounded-2xl bg-white/40">
                <svg viewBox="0 0 100 50" className="w-32 h-16 overflow-visible mb-4">
                    {/* Background Arc */}
                    <path d="M 10 50 A 40 40 0 0 1 90 50" fill="none" stroke="#e2e8f0" strokeWidth="12" strokeLinecap="round" />
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
                <div className="absolute top-12 font-mono text-3xl font-bold text-purple-900 drop-shadow-[0_0_10px_rgba(168,85,247,0.5)]">
                    {score}
                </div>
                <div className={`mt-2 font-mono text-[10px] uppercase tracking-widest px-2 py-1 rounded bg-${color}-100/50 text-${color}-700 border border-${color}-500/30`}>
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
                                case 'HIGH': return { text: 'text-purple-400', border: 'border-purple-500', bg: 'bg-purple-900/20', hover: 'hover:text-purple-300', panelBorder: 'border-purple-500/50', panelHeader: 'text-purple-500', borderBottom: 'border-purple-900/50' };
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
                                <div className={`absolute top-full left-0 mt-2 w-64 p-3 bg-white/90 backdrop-blur-md border ${c.panelBorder} rounded-lg shadow-[0_10px_30px_rgba(0,0,0,0.1)] z-[100] flex flex-col gap-1 text-left font-normal cursor-default`}>
                                    <span className={`font-mono text-[10px] ${c.panelHeader} tracking-widest uppercase border-b ${c.borderBottom} pb-1 mb-1 flex justify-between items-center`}>
                                        {entry.term}
                                    </span>
                                    <span className="font-inter text-xs text-gray-800 leading-tight">"{entry.translation}"</span>
                                    <span className="font-mono text-[9px] text-gray-600 leading-tight mt-1 bg-purple-900/5 p-1 rounded border border-purple-900/10">{entry.meaning}</span>
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
            <div className="flex items-end justify-between border-b border-purple-900/10 pb-4">
                <div>
                    <h2 className="font-cinzel text-3xl font-bold text-purple-900 tracking-widest flex items-center gap-3">
                        <Scale className="text-purple-600 drop-shadow-[0_0_10px_rgba(168,85,247,0.5)]" />
                        ZION SHARK PROTOCOL
                    </h2>
                    <p className="font-mono text-xs text-purple-900/60 mt-1 tracking-widest uppercase">
                        Automated Legal Analysis & Strategic Offer Negotiations
                    </p>
                </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">

                {/* Document Ingest Box */}
                <div className={`glass-card rounded-2xl flex flex-col border transition-colors shadow-xl relative overflow-hidden group focus-within:border-purple-500/50 ${isDragging ? 'border-purple-400 bg-purple-100/30' : 'border-purple-900/10'}`}>
                    <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-purple-400 to-transparent" />

                    {/* Toggle Switch */}
                    <div className="p-4 border-b border-purple-900/10 bg-white/40 flex justify-between items-center gap-4">
                        <div className="flex bg-white/50 border border-purple-900/10 rounded-lg p-1 w-full max-w-xs">
                            <button
                                onClick={() => setScanType('contract')}
                                className={`flex-1 py-1.5 px-3 rounded text-[10px] font-mono tracking-widest uppercase transition-colors flex items-center justify-center gap-2 ${scanType === 'contract' ? 'bg-purple-100/80 text-purple-900 border border-purple-500/50 shadow-sm' : 'text-purple-900/50 hover:text-purple-900'}`}
                            >
                                <Scale size={12} /> Contract Scan
                            </button>
                            <button
                                onClick={() => setScanType('offer')}
                                className={`flex-1 py-1.5 px-3 rounded text-[10px] font-mono tracking-widest uppercase transition-colors flex items-center justify-center gap-2 ${scanType === 'offer' ? 'bg-red-100/80 text-red-900 border border-red-500/50 shadow-sm' : 'text-purple-900/50 hover:text-purple-900'}`}
                            >
                                <Sword size={12} /> Offer Negot.
                            </button>
                        </div>
                        <span className="flex h-2 w-2 relative">
                            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-purple-400 opacity-75" />
                            <span className="relative inline-flex rounded-full h-2 w-2 bg-purple-500" />
                        </span>
                    </div>

                    <div
                        className="flex-1 flex flex-col relative"
                        onDragOver={(e) => { e.preventDefault(); setIsDragging(true); }}
                        onDragLeave={() => setIsDragging(false)}
                        onDrop={handleDrop}
                    >
                        {file ? (
                            <div className="flex-1 flex flex-col items-center justify-center p-8 bg-purple-50/50 min-h-[400px]">
                                <FileText size={48} className="text-purple-400 mb-4" />
                                <span className="font-mono text-sm text-purple-900">{file.name}</span>
                                <span className="font-mono text-[10px] text-purple-900/60 mt-2">{(file.size / 1024 / 1024).toFixed(2)} MB</span>
                                <button
                                    onClick={() => setFile(null)}
                                    className="mt-6 text-xs font-mono text-red-600 border border-red-200 bg-red-50 px-4 py-2 rounded hover:bg-red-100 transition-colors flex items-center gap-2"
                                >
                                    <X size={14} /> REMOVE FILE
                                </button>
                            </div>
                        ) : (
                            <>
                                <textarea
                                    className="flex-1 bg-transparent p-6 text-sm font-mono text-gray-900 focus:outline-none resize-none placeholder-gray-500 min-h-[400px] z-10 relative"
                                    placeholder={`PASTE OR DRAG ${scanType === 'contract' ? 'CONTRACT TEXT (.pdf, .docx, .txt)' : 'VENUE OFFER'} HERE FOR FORENSIC REVIEW...`}
                                    value={contractText}
                                    onChange={e => setContractText(e.target.value)}
                                />
                                {contractText.length === 0 && (
                                    <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none z-0 opacity-20">
                                        <UploadCloud size={64} className="mb-4 text-purple-400" />
                                        <span className="font-cinzel text-xl tracking-widest text-purple-900/60">DRAG & DROP MODULE</span>
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

                    <div className="p-4 bg-white/40 border-t border-purple-900/10 flex flex-col md:flex-row gap-4 justify-between items-center">
                        <button
                            onClick={() => fileInputRef.current?.click()}
                            className="text-[10px] font-mono text-purple-900/60 hover:text-purple-900 transition-colors flex items-center gap-2 tracking-widest bg-purple-900/5 px-3 py-1.5 rounded border border-purple-900/10 shadow-sm"
                        >
                            <UploadCloud size={12} /> BROWSE LOCAL FILES (.PDF, .DOCX)
                        </button>
                        <button
                            onClick={handleScan}
                            disabled={(!contractText && !file) || isScanning}
                            className={`px-8 py-3 rounded tracking-widest font-mono text-xs uppercase font-bold transition-all disabled:opacity-50 flex items-center gap-2 relative overflow-hidden shadow-sm ${scanType === 'offer' ? 'bg-red-100/80 text-red-700 border border-red-500/50 hover:bg-red-500 hover:text-white hover:shadow-[0_0_20px_rgba(239,68,68,0.3)]' : 'bg-purple-100/80 text-purple-700 border border-purple-500/50 hover:bg-purple-500 hover:text-white hover:shadow-[0_0_20px_rgba(168,85,247,0.3)]'}`}
                        >
                            {isScanning && <div className={`absolute inset-0 ${scanType === 'offer' ? 'bg-red-300/30' : 'bg-purple-300/30'} w-fit pointer-events-none origin-left flex animate-pulse`} />}
                            {isScanning ? <Activity size={16} className="animate-spin relative z-10" /> : <Scale size={16} />}
                            <span className="relative z-10">{isScanning ? "EXECUTING PROTOCOL..." : "INITIATE SCAN"}</span>
                        </button>
                    </div>
                </div>

                {/* Analysis Output Container */}
                <div className="flex flex-col h-full gap-4 relative">

                    {!analysis && !isScanning && (
                        <div className="flex-1 glass-card border-dashed border-purple-900/10 rounded-2xl flex items-center justify-center p-8 text-center bg-white/40">
                            <p className="font-mono text-sm text-purple-900/60 tracking-widest uppercase">
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
                                <div className="col-span-2 glass-card p-6 border-purple-900/10 rounded-2xl flex flex-col justify-center bg-white/40">
                                    <h4 className="font-mono text-xs uppercase tracking-widest text-purple-600 mb-2 drop-shadow-sm border-b border-purple-900/10 pb-2 flex items-center gap-2">
                                        <TrendingUp size={12} /> Strategic Summary
                                    </h4>
                                    <p className="text-xs font-inter text-gray-800 leading-relaxed font-bold">
                                        {renderWithCodex(analysis.summary)}
                                    </p>
                                </div>
                            </div>

                            {/* Red Flags List */}
                            {analysis.red_flags && analysis.red_flags.length > 0 && (
                                <div className="glass-card rounded-2xl border border-red-500/20 overflow-hidden relative">
                                    <div className="absolute top-0 right-0 p-4 opacity-5 pointer-events-none">
                                        <AlertOctagon size={100} className="text-red-500" />
                                    </div>
                                    <div className="bg-red-50 p-4 border-b border-red-500/20 flex items-center justify-between">
                                        <h3 className="font-cinzel text-lg text-red-900 font-bold tracking-widest flex items-center gap-2">
                                            <ShieldAlert className="text-red-500" /> THREATS DETECTED: {analysis.red_flags.length}
                                        </h3>
                                    </div>
                                    <div className="p-4 space-y-4 bg-white/40">
                                        {analysis.red_flags.map((flag: any, idx: number) => (
                                            <div key={idx} className="bg-white/60 border border-red-500/20 rounded p-4 relative group shadow-sm">
                                                <div className="w-1 h-full bg-red-400 absolute left-0 top-0 overflow-hidden rounded-l" />
                                                <p className="text-xs font-mono text-gray-700 italic mb-2 border-l-2 border-red-500/30 pl-2">
                                                    "...{renderWithCodex(flag.clause)}..."
                                                </p>
                                                <p className="text-sm font-inter text-red-900 font-bold mb-1 relative z-10">
                                                    RISK: {renderWithCodex(flag.risk)}
                                                </p>
                                                <p className="text-sm font-inter text-purple-700 flex items-start gap-2 mt-3 bg-purple-50/80 p-2 rounded border border-purple-100 relative z-10">
                                                    <CheckCircle2 size={16} className="mt-0.5 shrink-0" /> <span><span className="font-mono text-[10px] text-purple-600 tracking-widest uppercase block mb-1">Recommended Fix</span>{renderWithCodex(flag.fix)}</span>
                                                </p>
                                            </div>
                                        ))}
                                    </div>
                                </div>
                            )}

                            {/* Legal Rebuttal */}
                            <div className="glass-card p-6 rounded-2xl border border-purple-900/10 bg-white/40 mt-4 relative">
                                <h4 className="font-cinzel text-lg text-purple-900 tracking-widest border-b border-purple-900/20 pb-2 mb-4 flex items-center justify-between">
                                    SOVEREIGN REBUTTAL
                                    <button
                                        onClick={(e) => {
                                            navigator.clipboard.writeText(analysis.shark_rebuttal);
                                            const btn = e.currentTarget;
                                            btn.innerText = 'COPIED!';
                                            btn.classList.add('text-emerald-600', 'border-emerald-500/50', 'bg-emerald-50');
                                            setTimeout(() => {
                                                btn.innerText = 'COPY';
                                                btn.classList.remove('text-emerald-600', 'border-emerald-500/50', 'bg-emerald-50');
                                            }, 2000);
                                        }}
                                        className="font-mono text-[10px] bg-purple-900/5 border border-purple-900/10 px-3 py-1 rounded text-purple-900/60 hover:text-purple-900 transition-colors shadow-sm"
                                    >
                                        COPY
                                    </button>
                                </h4>
                                <div className="text-sm font-inter text-gray-800 leading-relaxed whitespace-pre-wrap bg-white/60 p-4 rounded border border-purple-900/10">
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
