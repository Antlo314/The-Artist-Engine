import React, { useState, useRef } from 'react';
import { motion } from 'framer-motion';
import { Scale, FileText, Activity, TrendingUp, ShieldAlert, CheckCircle2, UploadCloud, X, Copy, Download } from 'lucide-react';
import { codexEntries } from './TheCodex';
import LoadingProgressBar from './LoadingProgressBar';
import { useEngine } from '../lib/engineState';
import { apiFetch } from '../lib/api';
import { useAuth } from '../lib/auth';
import { Panel, Btn, Segmented, EmptyState } from './ui/Shell';

const ACCENT = 'var(--color-zion)';

const SCAN_TYPE_OPTIONS: { value: 'contract' | 'offer'; label: string }[] = [
    { value: 'contract', label: 'Contract' },
    { value: 'offer', label: 'Gig offer' },
];

type ZionProps = {
    onOpenCodexTerm?: (term: string) => void;
    onScanComplete?: () => void;
};

export default function ZionSentinel({ onOpenCodexTerm, onScanComplete }: ZionProps) {
    const { record } = useEngine();
    const { refreshMe } = useAuth();
    const [contractText, setContractText] = useState('');
    const [file, setFile] = useState<File | null>(null);
    const [scanType, setScanType] = useState<'contract' | 'offer'>('contract');
    const [isDragging, setIsDragging] = useState(false);
    const [isScanning, setIsScanning] = useState(false);
    const [analysis, setAnalysis] = useState<any>(null);
    const [scanError, setScanError] = useState<string | null>(null);
    const [rebuttalCopied, setRebuttalCopied] = useState(false);
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
        setScanError(null);
        try {
            const formData = new FormData();
            if (file) formData.append('file', file);
            if (contractText) formData.append('text', contractText);
            formData.append('scan_type', scanType);

            const response = await apiFetch('/api/analyze-contract', {
                method: 'POST',
                body: formData
            });
            const data = await response.json().catch(() => ({}));
            if (!response.ok) {
                const detail = data?.detail;
                throw new Error(
                    typeof detail === 'object' ? detail.message || JSON.stringify(detail) : detail || `Status ${response.status}`
                );
            }

            if (data.status === 'success') {
                setAnalysis({
                    ...data.analysis,
                    linter: data.linter || data.analysis?.linter,
                    disclaimer: data.disclaimer || data.analysis?.disclaimer,
                });
                const flags = Array.isArray(data.analysis?.red_flags) ? data.analysis.red_flags.length : 0;
                const lintHits = data.linter?.counts?.total || 0;
                record.scan(Math.max(flags, lintHits), data.analysis?.integrity_score);
                refreshMe();
                onScanComplete?.();
            } else {
                throw new Error(data.error || 'We could not read that document.');
            }
        } catch (err: any) {
            console.error(err);
            setScanError(err?.message || 'That check did not finish. Make sure you are signed in, then try again.');
        } finally {
            setIsScanning(false);
        }
    };

    const handleCopyRebuttal = () => {
        if (!analysis?.shark_rebuttal) return;
        navigator.clipboard.writeText(analysis.shark_rebuttal);
        setRebuttalCopied(true);
        setTimeout(() => setRebuttalCopied(false), 2000);
    };

    const handleDownloadAnalysis = () => {
        if (!analysis) return;

        const lines: string[] = [];
        lines.push('CONTRACT CHECK — WHAT THIS DEAL SAYS');
        lines.push('='.repeat(40));
        lines.push('');
        lines.push('This is a fast first read, not legal advice.');
        lines.push("For anything you're about to sign, have a lawyer look at it.");
        lines.push('');

        if (analysis.parties) {
            lines.push('WHO IS INVOLVED');
            lines.push(analysis.parties);
            lines.push('');
        }
        if (analysis.obligations) {
            lines.push('WHAT EACH SIDE HAS TO DO');
            lines.push(analysis.obligations);
            lines.push('');
        }
        if (typeof analysis.integrity_score !== 'undefined') {
            lines.push(`FAIRNESS SCORE: ${analysis.integrity_score} out of 100 (higher is fairer to you)`);
            lines.push('');
        }
        if (Array.isArray(analysis.red_flags) && analysis.red_flags.length > 0) {
            lines.push(
                `THINGS TO PUSH BACK ON (${analysis.red_flags.length})`
            );
            lines.push('-'.repeat(40));
            analysis.red_flags.forEach((flag: any, idx: number) => {
                lines.push(`${idx + 1}. What the contract says: ${flag.clause || 'N/A'}`);
                lines.push(`   What this means for you: ${flag.risk || 'N/A'}`);
                lines.push(`   How to push back: ${flag.fix || 'N/A'}`);
                lines.push('');
            });
        }
        if (analysis.summary) {
            lines.push('THE DEAL IN PLAIN ENGLISH');
            lines.push(analysis.summary);
            lines.push('');
        }
        if (analysis.shark_rebuttal) {
            lines.push('YOUR REPLY, DRAFTED');
            lines.push(analysis.shark_rebuttal);
            lines.push('');
        }

        const blob = new Blob([lines.join('\n')], { type: 'text/plain;charset=utf-8' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = 'contract-analysis.txt';
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        URL.revokeObjectURL(url);
    };

    const ScoreGauge = ({ score }: { score: number }) => {
        const color = score > 75 ? 'emerald' : score > 40 ? 'yellow' : 'red';
        const strokeColor = score > 75 ? '#047857' : score > 40 ? '#a16207' : 'var(--color-ember-500)';
        return (
            <div className="relative flex flex-col items-center justify-center p-6 glass-obsidian rounded-xl border border-white/10">
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
                <div className="absolute top-12 font-mono text-3xl font-bold text-ink-50">
                    {score}
                </div>
                <div className={`mt-2 font-mono text-[10px] uppercase tracking-widest px-2 py-1 rounded bg-${color}-900/30 text-${color}-400 border border-${color}-500/30`}>
                    Fairness score
                </div>
                <p className="mt-2 text-[10px] text-ink-400 leading-snug text-center">
                    0–100. Higher means the contract treats you more fairly.
                </p>
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
            <div className="flex flex-wrap items-center justify-between gap-3">
                <div>
                    <h2 className="font-display text-xl lg:text-2xl font-semibold text-ink-50">Scan a contract</h2>
                    <p className="font-mono text-[10px] text-ink-400 mt-1 tracking-[0.2em] uppercase">Find out what it really says before you sign</p>
                </div>
                <Segmented
                    options={SCAN_TYPE_OPTIONS}
                    value={scanType}
                    onChange={setScanType}
                    accent={scanType === 'offer' ? 'var(--color-ember-500)' : ACCENT}
                />
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">

                {/* Document Ingest Box */}
                <div className={`glass-obsidian rounded-xl flex flex-col border transition-colors overflow-hidden ${isDragging ? 'border-purple-400/60' : 'border-white/10'}`}>
                    <div
                        className="flex-1 flex flex-col relative"
                        onDragOver={(e) => { e.preventDefault(); setIsDragging(true); }}
                        onDragLeave={() => setIsDragging(false)}
                        onDrop={handleDrop}
                    >
                        {file ? (
                            <div className="flex-1 flex flex-col items-center justify-center p-4 lg:p-8 min-h-[250px] lg:min-h-[380px]">
                                <FileText size={40} className="text-ink-400 mb-4" />
                                <span className="font-mono text-xs lg:text-sm text-ink-50 text-center break-all px-4">{file.name}</span>
                                <span className="font-mono text-[10px] text-ink-400 mt-2">{(file.size / 1024 / 1024).toFixed(2)} MB</span>
                                <Btn variant="danger-ghost" size="sm" className="mt-6" onClick={() => setFile(null)}>
                                    <X size={14} /> Remove file
                                </Btn>
                            </div>
                        ) : (
                            <>
                                <textarea
                                    className="flex-1 bg-transparent p-4 lg:p-6 text-xs lg:text-sm font-mono text-ink-200 focus:outline-none resize-none placeholder:text-ink-700 min-h-[250px] lg:min-h-[380px] z-10 relative custom-scrollbar leading-relaxed"
                                    placeholder={`Paste or drag your ${scanType === 'contract' ? 'contract (.pdf, .docx, .txt)' : 'gig or venue offer'} here...\n\n(Up to about 15 pages / 7,500 words at a time)`}
                                    value={contractText}
                                    onChange={e => setContractText(e.target.value)}
                                />
                                {contractText.length === 0 && (
                                    <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none z-0 opacity-50 px-4 text-center">
                                        <UploadCloud size={40} className="mb-3 text-ink-700" />
                                        <span className="font-display text-sm sm:text-base lg:text-lg text-ink-400">Drag a document here</span>
                                        <span className="font-mono text-[10px] text-ink-700 mt-2 tracking-widest uppercase">or paste the text — about 15 pages max</span>
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

                    <div className="p-4 border-t border-white/10 flex flex-col md:flex-row gap-3 justify-between items-center">
                        <Btn variant="ghost" size="sm" onClick={() => fileInputRef.current?.click()}>
                            <UploadCloud size={12} /> Browse files (.pdf, .docx)
                        </Btn>
                        <Btn
                            variant="accent"
                            accent={scanType === 'offer' ? 'var(--color-ember-500)' : ACCENT}
                            onClick={handleScan}
                            disabled={(!contractText && !file) || isScanning}
                        >
                            {isScanning ? <Activity size={16} className="animate-spin" /> : <Scale size={16} />}
                            {isScanning ? 'Reading…' : 'Check this contract'}
                        </Btn>
                    </div>
                </div>

                {/* Analysis Output Container */}
                <div className="flex flex-col h-full gap-4 relative">

                    {scanError && (
                        <div className="rounded-lg border border-red-500/30 bg-red-500/10 px-3 py-2 text-sm text-red-300">
                            {scanError}
                        </div>
                    )}

                    {!analysis && !isScanning && (
                        <EmptyState
                            icon={<Scale size={32} />}
                            title="Nothing checked yet"
                            hint="Paste or drop a contract on the left and we will read it for you"
                        />
                    )}

                    {isScanning && (
                        <div className="flex-1 flex flex-col items-center justify-center">
                            <LoadingProgressBar
                                active={isScanning}
                                message="Reading your contract"
                                subMessage="Going through it line by line. Usually about 3 seconds."
                                colorClass="violet"
                                estimatedDurationMs={3000}
                                speedLabel="~3s live"
                            />
                        </div>
                    )}

                    {analysis && (
                        <motion.div
                            key="result"
                            initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }}
                            className="flex-1 flex flex-col gap-4 overflow-y-auto pr-2 custom-scrollbar"
                        >
                            {/* Toolbar */}
                            <div className="flex justify-end">
                                <Btn variant="ghost" size="sm" onClick={handleDownloadAnalysis}>
                                    <Download size={12} /> Download this report (.txt)
                                </Btn>
                            </div>

                            <div className="rounded-lg border border-amber-500/30 bg-amber-500/10 px-3 py-2 text-[11px] text-ink-200 leading-relaxed">
                                {analysis.disclaimer ||
                                    "This is a fast first read, not legal advice. For anything you're about to sign, have a lawyer look at it."}
                            </div>

                            {/* Top Row: Score & Summary */}
                            <div className="grid grid-cols-3 gap-4">
                                <ScoreGauge score={analysis.integrity_score || 50} />
                                <Panel className="col-span-2 flex flex-col justify-center" accent={ACCENT}>
                                    <h4 className="font-mono text-[10px] uppercase tracking-widest text-ink-400 mb-2 border-b border-white/10 pb-2 flex items-center gap-2">
                                        <TrendingUp size={12} /> The deal in plain English
                                    </h4>
                                    {/* div, not p: codex terms render as <details>, which is
                                        not valid inside a <p> and gets auto-closed by the parser. */}
                                    <div className="text-xs font-inter text-ink-200 leading-relaxed">
                                        {renderWithCodex(analysis.summary)}
                                    </div>
                                </Panel>
                            </div>

                            {analysis.linter?.findings?.length > 0 && (
                                <Panel
                                    title={`Quick check · ${analysis.linter.counts?.total || analysis.linter.findings.length} spotted`}
                                    sub="Free instant check — no AI needed"
                                    accent={ACCENT}
                                >
                                    <div className="space-y-2 max-h-48 overflow-y-auto">
                                        {analysis.linter.findings.slice(0, 12).map((f: any, i: number) => (
                                            <div key={i} className="text-xs border border-white/10 rounded-lg p-2">
                                                <div className="flex items-center justify-between gap-2 mb-1">
                                                    <span className="font-mono text-[10px] uppercase tracking-widest text-ink-50">{f.label}</span>
                                                    <span className="font-mono text-[9px] uppercase text-ink-400">{f.severity}</span>
                                                </div>
                                                <p className="text-ink-400 italic text-[11px] mb-1">“{f.clause_snippet}”</p>
                                                <p className="text-ink-200">{f.risk}</p>
                                            </div>
                                        ))}
                                    </div>
                                </Panel>
                            )}

                            {/* Red Flags List */}
                            {analysis.red_flags && analysis.red_flags.length > 0 && (
                                <Panel
                                    title={`${analysis.red_flags.length} thing${analysis.red_flags.length === 1 ? '' : 's'} to push back on`}
                                    accent="var(--color-ember-500)"
                                    actions={<ShieldAlert className="text-red-400" size={18} />}
                                >
                                    <div className="space-y-4 -m-1">
                                        {analysis.red_flags.map((flag: any, idx: number) => {
                                            const clauseText = String(flag.clause || flag.risk || '');
                                            const matched = codexEntries.find((e) =>
                                                clauseText.toLowerCase().includes(e.term.toLowerCase())
                                            );
                                            return (
                                            <div key={idx} className="glass-obsidian border border-white/10 border-l-4 border-l-red-500 rounded-lg p-4 relative">
                                                {/* divs, not p: codex terms render as <details>, which the
                                                    HTML parser will not allow inside a <p>. */}
                                                <div className="text-xs font-mono text-ink-400 italic mb-2 border-l-2 border-red-500/50 pl-2">
                                                    "...{renderWithCodex(flag.clause)}..."
                                                </div>
                                                <div className="text-sm font-inter text-red-400 font-semibold mb-1">
                                                    What this means for you: {renderWithCodex(flag.risk)}
                                                </div>
                                                <div className="text-sm font-inter text-emerald-400 flex items-start gap-2 mt-3 bg-emerald-900/20 p-2 rounded-lg border border-emerald-500/30">
                                                    <CheckCircle2 size={16} className="mt-0.5 shrink-0 text-emerald-400" /> <span><span className="font-mono text-[10px] text-emerald-300 tracking-widest uppercase block mb-1">How to push back</span>{renderWithCodex(flag.fix)}</span>
                                                </div>
                                                {matched && onOpenCodexTerm && (
                                                    <button
                                                        type="button"
                                                        onClick={() => onOpenCodexTerm(matched.term)}
                                                        className="mt-3 font-mono text-[10px] tracking-widest uppercase text-violet-300 hover:text-violet-200 underline-offset-2 hover:underline"
                                                    >
                                                        What does “{matched.term}” mean? →
                                                    </button>
                                                )}
                                            </div>
                                            );
                                        })}
                                    </div>
                                </Panel>
                            )}

                            {/* Drafted reply the artist can send back */}
                            <Panel
                                title="Your reply, drafted"
                                sub="A firm, polite way to raise these points"
                                accent={ACCENT}
                                actions={
                                    <Btn
                                        variant="ghost"
                                        size="sm"
                                        onClick={handleCopyRebuttal}
                                        className={rebuttalCopied ? '!border-emerald-500/50 !text-emerald-400' : ''}
                                    >
                                        <Copy size={12} /> {rebuttalCopied ? 'Copied!' : 'Copy reply'}
                                    </Btn>
                                }
                            >
                                <div className="text-sm font-inter text-ink-200 leading-relaxed whitespace-pre-wrap bg-ink-900 p-4 rounded-lg border border-white/10">
                                    {analysis.shark_rebuttal}
                                </div>
                            </Panel>
                        </motion.div>
                    )}
                </div>
            </div>
        </div>
    );
}
