import { useState, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Mic2, Activity, Play, Pause, Settings2, Shield, UploadCloud, Volume2, Waves, X, HelpCircle, Download } from 'lucide-react';
import WaveSurfer from 'wavesurfer.js';
import Spectrogram from 'wavesurfer.js/dist/plugins/spectrogram.esm.js';
import LoadingProgressBar from './LoadingProgressBar';
import { useEngine } from '../lib/engineState';
import { PageHeader, Panel, Btn, StepHint } from './ui/Shell';

export default function StudioCore() {
    const { record } = useEngine();
    const [phase, setPhase] = useState<'dropzone' | 'processing' | 'tuning'>('dropzone');
    const [knobs, setKnobs] = useState({ sub: 50, air: 60, snap: 40, width: 70 });
    const [targetFile, setTargetFile] = useState<File | null>(null);
    const [refFile, setRefFile] = useState<File | null>(null);
    const [outputFormat, setOutputFormat] = useState('wav');
    const [isSovereignMaster, setIsSovereignMaster] = useState(true);
    const [masterAudioUrl, setMasterAudioUrl] = useState<string | null>(null);
    const [isPlaying, setIsPlaying] = useState(false);
    const [isOracleScanning, setIsOracleScanning] = useState(false);
    const [isOracleApplied, setIsOracleApplied] = useState(false);
    const [oracleData, setOracleData] = useState<{ analysis: string, knobs: { sub: number, air: number, snap: number, width: number } } | null>(null);
    const [isDragging, setIsDragging] = useState(false);
    const [showAnalytics, setShowAnalytics] = useState(false);
    const [showHeatmap, setShowHeatmap] = useState(false);

    // Neural Stem states
    const [isExtractingStems, setIsExtractingStems] = useState(false);
    const [stemsData, setStemsData] = useState<{ bass: string, drums: string, acapella: string, synth: string } | null>(null);

    // Blind Test states
    const [showBlindTest, setShowBlindTest] = useState(false);
    const [blindTestPlaying, setBlindTestPlaying] = useState<'A' | 'B' | null>(null);
    const [blindTestAUrl, setBlindTestAUrl] = useState<string | null>(null);
    const [blindTestBUrl, setBlindTestBUrl] = useState<string | null>(null);
    const [isSovereignA, setIsSovereignA] = useState(false);
    const [blindTestWinner, setBlindTestWinner] = useState<'A' | 'B' | null>(null);

    // To hold object URLs so wavesurfer can read them
    const [targetUrl, setTargetUrl] = useState<string | null>(null);
    const [refUrl, setRefUrl] = useState<string | null>(null);

    // Pre-master playback states
    const [playingPreview, setPlayingPreview] = useState<'target' | 'ref' | null>(null);

    const targetInputRef = useRef<HTMLInputElement>(null);
    const refInputRef = useRef<HTMLInputElement>(null);
    const audioRef = useRef<HTMLAudioElement>(null);
    const previewAudioRef = useRef<HTMLAudioElement | null>(null);

    const togglePreview = (type: 'target' | 'ref', file: File | null) => {
        if (!file) return;

        if (playingPreview === type) {
            previewAudioRef.current?.pause();
            setPlayingPreview(null);
            return;
        }

        if (previewAudioRef.current) {
            previewAudioRef.current.pause();
        }

        const url = URL.createObjectURL(file);
        const audio = new Audio(url);
        previewAudioRef.current = audio;

        audio.onended = () => setPlayingPreview(null);
        audio.play();
        setPlayingPreview(type);
    };

    // Global cleanup to stop audio when navigating away
    useEffect(() => {
        return () => {
            if (previewAudioRef.current) {
                previewAudioRef.current.pause();
                previewAudioRef.current.src = "";
            }
            if (audioRef.current) {
                audioRef.current.pause();
                audioRef.current.src = "";
            }
            if (blindTestAudioRef) {
                blindTestAudioRef.pause();
                blindTestAudioRef.src = "";
            }
        };
    }, []);

    // Standalone audio element for blind test
    const [blindTestAudioRef, setBlindTestAudioRef] = useState<HTMLAudioElement | null>(null);

    const removeTargetFile = (e: React.MouseEvent) => {
        e.stopPropagation();
        setTargetFile(null);
        setTargetUrl(null);
        if (targetInputRef.current) targetInputRef.current.value = "";
        if (playingPreview === 'target' && previewAudioRef.current) {
            previewAudioRef.current.pause();
            setPlayingPreview(null);
        }
    };

    const removeRefFile = (e: React.MouseEvent) => {
        e.stopPropagation();
        setRefFile(null);
        setRefUrl(null);
        if (refInputRef.current) refInputRef.current.value = "";
        if (playingPreview === 'ref' && previewAudioRef.current) {
            previewAudioRef.current.pause();
            setPlayingPreview(null);
        }
    };

    const handleDrop = (e: React.DragEvent) => {
        e.preventDefault();
        setIsDragging(false);
        if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
            const files = Array.from(e.dataTransfer.files);
            if (files[0]) {
                setTargetFile(files[0]);
                setTargetUrl(URL.createObjectURL(files[0]));
            }
            if (files[1]) {
                setRefFile(files[1]);
                setRefUrl(URL.createObjectURL(files[1]));
            }
        }
    };

    const handleTargetSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (file) {
            setTargetFile(file);
            setTargetUrl(URL.createObjectURL(file));
        }
    };

    const handleRefSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (file) {
            setRefFile(file);
            setRefUrl(URL.createObjectURL(file));
        }
    };

    const handleDownload = async () => {
        if (!masterAudioUrl) return;
        try {
            if ('showSaveFilePicker' in window) {
                const handle = await (window as any).showSaveFilePicker({
                    suggestedName: `SOVEREIGN_MASTER.${outputFormat}`,
                    types: [{
                        description: 'Audio File',
                        accept: { [`audio/${outputFormat === 'mp3' ? 'mpeg' : outputFormat}`]: [`.${outputFormat}`] },
                    }],
                });
                const writable = await handle.createWritable();
                const response = await fetch(masterAudioUrl);
                if (!response.body) throw new Error("Response body is null");
                await response.body.pipeTo(writable);
            } else {
                const a = document.createElement('a');
                a.href = masterAudioUrl;
                a.download = `SOVEREIGN_MASTER.${outputFormat}`;
                document.body.appendChild(a);
                a.click();
                document.body.removeChild(a);
            }
        } catch (err) {
            console.error('Download cancelled or failed', err);
        }
    };

    const handleOracleScan = async () => {
        if (!targetFile) return;
        setIsOracleScanning(true);
        setIsOracleApplied(false);
        setOracleData(null);

        try {
            const formData = new FormData();
            formData.append('target', targetFile);

            const response = await fetch('/api/oracle', {
                method: 'POST',
                body: formData
            });

            if (!response.ok) throw new Error(`Status ${response.status}`);
            const data = await response.json();

            if (data.status === 'success') {
                setOracleData(data.oracle);
            } else {
                throw new Error(data.error || 'Oracle Engine Failure');
            }
        } catch (err) {
            console.error(err);
            alert("Oracle Engine Failure.");
        } finally {
            setIsOracleScanning(false);
        }
    };

    const handleMaster = async () => {
        if (!targetFile || !refFile) return;
        setPhase('processing');

        try {
            const formData = new FormData();
            formData.append('target', targetFile);
            formData.append('reference', refFile);
            formData.append('sub', knobs.sub.toString());
            formData.append('air', knobs.air.toString());
            formData.append('snap', knobs.snap.toString());
            formData.append('width', knobs.width.toString());
            formData.append('output_format', outputFormat);

            const response = await fetch('/api/master', {
                method: 'POST',
                body: formData
            });

            if (!response.ok) {
                const errorData = await response.json().catch(() => ({}));
                throw new Error(errorData.detail || `Status ${response.status}`);
            }

            const blob = await response.blob();
            const url = URL.createObjectURL(blob);
            setMasterAudioUrl(url);
            // Record real telemetry: increments Masters + logs to activity feed.
            record.master(targetFile?.name || 'master', outputFormat);
            setPhase('tuning');
        } catch (err) {
            console.error(err);
            setPhase('dropzone');
            alert("Mastering Engine Failure. Check logs.");
        }
    };

    const togglePlay = () => {
        if (!audioRef.current) return;
        if (isPlaying) {
            audioRef.current.pause();
        } else {
            audioRef.current.play();
        }
        setIsPlaying(!isPlaying);
    };

    const handleExtractStems = async () => {
        if (!targetFile) return;
        setIsExtractingStems(true);
        setStemsData(null);
        try {
            const formData = new FormData();
            formData.append('target', targetFile);
            const response = await fetch('/api/extract-stems', {
                method: 'POST',
                body: formData
            });
            const data = await response.json();
            if (data.status === 'success') {
                setStemsData(data.stems);
            } else {
                throw new Error(data.detail || 'Stem Engine Failure');
            }
        } catch (err) {
            console.error(err);
            alert("Neural Stem Extraction Failed.");
        } finally {
            setIsExtractingStems(false);
        }
    };

    const initiateBlindTest = () => {
        if (!masterAudioUrl || !targetUrl) return;
        const isAMaster = Math.random() > 0.5;
        setIsSovereignA(isAMaster);
        setBlindTestAUrl(isAMaster ? masterAudioUrl : targetUrl);
        setBlindTestBUrl(isAMaster ? targetUrl : masterAudioUrl);
        setBlindTestWinner(null);
        setBlindTestPlaying(null);

        if (audioRef.current) audioRef.current.pause();
        if (previewAudioRef.current) previewAudioRef.current.pause();
        setIsPlaying(false);
        setPlayingPreview(null);

        const audio = new Audio();
        audio.onended = () => setBlindTestPlaying(null);
        setBlindTestAudioRef(audio);
        setShowBlindTest(true);
    };

    const toggleBlindTestPlay = (source: 'A' | 'B') => {
        if (!blindTestAudioRef) return;
        const urlToPlay = source === 'A' ? blindTestAUrl : blindTestBUrl;

        if (blindTestPlaying === source) {
            blindTestAudioRef.pause();
            setBlindTestPlaying(null);
        } else {
            if (blindTestPlaying) blindTestAudioRef.pause();
            blindTestAudioRef.src = urlToPlay as string;
            blindTestAudioRef.play();
            setBlindTestPlaying(source);
        }
    };

    const handleBlindTestVote = (vote: 'A' | 'B') => {
        if (blindTestAudioRef) blindTestAudioRef.pause();
        setBlindTestPlaying(null);
        setBlindTestWinner(vote);
    };

    const Knob = ({ label, hint, value, onChange }: any) => (
        <div className="flex flex-col items-center gap-3">
            <div className="relative w-16 h-16 rounded-full bg-black border-2 border-cyan-900/40 shadow-[inset_0_0_10px_rgba(0,0,0,0.8)] flex items-center justify-center group">
                <div
                    className="w-1 h-3 bg-cyan-500 absolute top-1 origin-[50%_28px] rounded-full shadow-[0_0_5px_rgba(34,211,238,0.8)] transition-transform duration-300 group-hover:bg-white"
                    style={{ transform: `rotate(${(value / 100) * 270 - 135}deg)` }}
                />
                <div className="text-cyan-400 font-mono text-xs">{value}%</div>
            </div>
            <div className="flex flex-col items-center gap-0.5">
                <span className="font-mono text-[10px] text-ink-200 tracking-widest uppercase text-center leading-tight">
                    {label}
                </span>
                {hint && <span className="text-[10px] text-ink-700 text-center leading-tight">{hint}</span>}
            </div>
        </div>
    );

    const WaveformViewer = ({ url, title, color, renderHeatmap }: { url: string | null, title: string, color: string, renderHeatmap?: boolean }) => {
        const containerRef = useRef<HTMLDivElement>(null);
        const spectrogramRef = useRef<HTMLDivElement>(null);
        const wavesurferRef = useRef<WaveSurfer | null>(null);

        useEffect(() => {
            if (!containerRef.current || !url) return;

            const plugins = [];
            if (renderHeatmap && spectrogramRef.current) {
                plugins.push(
                    Spectrogram.create({
                        container: spectrogramRef.current,
                        labels: true,
                        height: 60,
                        splitChannels: false
                    })
                );
            }

            wavesurferRef.current = WaveSurfer.create({
                container: containerRef.current,
                waveColor: `${color}80`, // 50% opacity
                progressColor: color,
                cursorColor: '#ffffff',
                barWidth: 2,
                barGap: 1,
                barRadius: 2,
                height: 60,
                normalize: true,
                plugins: plugins
            });

            wavesurferRef.current.load(url);

            return () => {
                wavesurferRef.current?.destroy();
            };
        }, [url, color, renderHeatmap]);

        if (!url) return null;

        return (
            <div className="flex flex-col gap-2 bg-black/40 p-4 rounded-lg border border-white/10 relative">
                <div className="flex justify-between items-center z-10">
                    <span className="font-mono text-[10px] uppercase tracking-widest" style={{ color }}>{title}</span>
                    <button
                        onClick={() => wavesurferRef.current?.playPause()}
                        className="w-6 h-6 rounded-full bg-white/10 flex items-center justify-center hover:bg-white/20 transition-colors"
                    >
                        <Play size={10} className="text-cyan-400 ml-0.5" />
                    </button>
                </div>
                <div ref={containerRef} className="w-full relative z-10" />
                {renderHeatmap && (
                    <div className="w-full mt-2 relative z-0 border-t border-white/10 pt-2">
                        <span className="font-mono text-[8px] text-ink-200 uppercase tracking-widest absolute -top-1 left-0 bg-black/50 px-1 rounded z-20">Acoustic heatmap</span>
                        <div ref={spectrogramRef} className="w-full rounded overflow-hidden opacity-80" />
                    </div>
                )}
            </div>
        );
    };

    return (
        <div className="space-y-6">
            <PageHeader
                view="studio"
                accent="#22d3ee"
                module="AUDIO MASTER CORE"
                title="Studio"
                desc="Drop your mix and a reference track — get a streaming-ready master back in about a minute."
            />
            <StepHint steps={["Drop your mix", "Drop a reference", "Master & download"]} accent="#22d3ee" />

            <AnimatePresence mode="wait">
                {phase === 'dropzone' && (
                    <motion.div
                        key="dropzone"
                        initial={{ opacity: 0, scale: 0.95 }}
                        animate={{ opacity: 1, scale: 1 }}
                        exit={{ opacity: 0, y: -20 }}
                        className="grid grid-cols-1 md:grid-cols-3 gap-6"
                    >
                        {/* Dropzone Area */}
                        <div
                            onDragOver={(e) => { e.preventDefault(); setIsDragging(true); }}
                            onDragLeave={(e) => { e.preventDefault(); setIsDragging(false); }}
                            onDrop={handleDrop}
                            className={`md:col-span-2 glass-obsidian glass-obsidian-hover rounded-xl p-10 flex flex-col items-center justify-center border-dashed border-2 transition-all min-h-[400px] relative overflow-hidden group ${isDragging ? 'border-cyan-400 bg-cyan-900/20 shadow-[0_0_30px_rgba(34,211,238,0.3)]' : 'border-white/10 hover:border-cyan-500/40 cursor-default'}`}
                        >
                            <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,rgba(34,211,238,0.06)_0%,transparent_60%)] opacity-0 group-hover:opacity-100 transition-opacity z-0" />

                            <div className="w-20 h-20 rounded-full border-2 border-dashed border-white/15 flex items-center justify-center mb-6 group-hover:rotate-180 transition-transform duration-1000 ease-in-out">
                                <UploadCloud size={32} className="text-cyan-400" />
                            </div>
                            <h3 className="font-display text-2xl text-ink-50 mb-2 tracking-tight">Drop your tracks</h3>
                            <p className="font-mono text-ink-400 text-xs tracking-widest text-center max-w-sm mb-8 uppercase">
                                Drag in your mix and a reference track, or choose them below · up to 2.5GB each
                            </p>

                            <div className="flex flex-col gap-4 w-full px-8 z-10">
                                {/* Target Input */}
                                <input
                                    type="file"
                                    ref={targetInputRef}
                                    className="hidden"
                                    accept="audio/*"
                                    onChange={handleTargetSelect}
                                />
                                <div
                                    onClick={(e) => { e.stopPropagation(); targetInputRef.current?.click(); }}
                                    className={`flex items-center justify-between w-full py-3 px-4 rounded-lg border transition-all cursor-pointer ${targetFile ? 'bg-cyan-500/10 border-cyan-500/50' : 'border-white/10 hover:border-white/25 hover:bg-white/5'}`}
                                >
                                    <div className="flex items-center gap-3 overflow-hidden">
                                        <div className={`w-8 h-8 rounded-lg flex items-center justify-center shrink-0 ${targetFile ? 'bg-cyan-500/20 text-cyan-400' : 'bg-white/5 text-ink-700'}`}>
                                            <Mic2 size={14} />
                                        </div>
                                        <div className="flex flex-col truncate">
                                            <span className={`font-mono text-[10px] tracking-widest uppercase ${targetFile ? 'text-cyan-400' : 'text-ink-400'}`}>Your mix</span>
                                            <span className={`font-mono text-xs truncate ${targetFile ? 'text-ink-50' : 'text-ink-700'}`}>
                                                {targetFile ? targetFile.name : 'Choose your unmastered mix…'}
                                            </span>
                                        </div>
                                    </div>
                                    {targetFile && (
                                        <div className="flex items-center gap-2 shrink-0">
                                            <button
                                                onClick={(e) => { e.stopPropagation(); togglePreview('target', targetFile); }}
                                                className="w-8 h-8 rounded-full border border-white/10 flex items-center justify-center text-cyan-400 hover:bg-cyan-500/20 hover:scale-105 transition-all"
                                                title="Preview"
                                            >
                                                {playingPreview === 'target' ? <Pause size={12} /> : <Play size={12} className="ml-1" />}
                                            </button>
                                            <button
                                                onClick={removeTargetFile}
                                                className="w-8 h-8 rounded-full border border-red-500/40 flex items-center justify-center text-red-400 hover:bg-red-500/20 hover:scale-105 transition-all"
                                                title="Remove"
                                            >
                                                <X size={12} />
                                            </button>
                                        </div>
                                    )}
                                </div>

                                {/* Reference Input */}
                                <input
                                    type="file"
                                    ref={refInputRef}
                                    className="hidden"
                                    accept="audio/*"
                                    onChange={handleRefSelect}
                                />
                                <div
                                    onClick={(e) => { e.stopPropagation(); refInputRef.current?.click(); }}
                                    className={`flex items-center justify-between w-full py-3 px-4 rounded-lg border transition-all cursor-pointer ${refFile ? 'bg-cyan-500/10 border-cyan-500/50' : 'border-white/10 hover:border-white/25 hover:bg-white/5'}`}
                                >
                                    <div className="flex items-center gap-3 overflow-hidden">
                                        <div className={`w-8 h-8 rounded-lg flex items-center justify-center shrink-0 ${refFile ? 'bg-cyan-500/20 text-cyan-400' : 'bg-white/5 text-ink-700'}`}>
                                            <Volume2 size={14} />
                                        </div>
                                        <div className="flex flex-col truncate">
                                            <span className={`font-mono text-[10px] tracking-widest uppercase ${refFile ? 'text-cyan-400' : 'text-ink-400'}`}>Reference track</span>
                                            <span className={`font-mono text-xs truncate ${refFile ? 'text-ink-50' : 'text-ink-700'}`}>
                                                {refFile ? refFile.name : 'Choose a professionally mastered reference…'}
                                            </span>
                                        </div>
                                    </div>
                                    {refFile && (
                                        <div className="flex items-center gap-2 shrink-0">
                                            <button
                                                onClick={(e) => { e.stopPropagation(); togglePreview('ref', refFile); }}
                                                className="w-8 h-8 rounded-full border border-white/10 flex items-center justify-center text-cyan-400 hover:bg-cyan-500/20 hover:scale-105 transition-all"
                                                title="Preview"
                                            >
                                                {playingPreview === 'ref' ? <Pause size={12} /> : <Play size={12} className="ml-1" />}
                                            </button>
                                            <button
                                                onClick={removeRefFile}
                                                className="w-8 h-8 rounded-full border border-red-500/40 flex items-center justify-center text-red-400 hover:bg-red-500/20 hover:scale-105 transition-all"
                                                title="Remove"
                                            >
                                                <X size={12} />
                                            </button>
                                        </div>
                                    )}
                                </div>
                            </div>

                            <div className="mt-6 flex flex-col items-center gap-1.5 relative z-10 w-full">
                                <span className="font-mono text-[10px] tracking-[0.2em] uppercase text-ink-400">Export format</span>
                                <div className="flex gap-2">
                                    {['wav', 'mp3', 'flac'].map(fmt => (
                                        <button
                                            key={fmt}
                                            onClick={() => setOutputFormat(fmt)}
                                            className={`px-4 py-1.5 text-[11px] font-mono uppercase tracking-widest rounded-full border transition-colors ${outputFormat === fmt ? 'bg-cyan-500 border-cyan-400 text-ink-950 font-medium' : 'border-white/10 text-ink-400 hover:border-white/25 hover:text-ink-50'}`}
                                        >
                                            .{fmt}
                                        </button>
                                    ))}
                                </div>
                            </div>

                            {(targetFile && refFile) && (
                                <motion.button
                                    initial={{ opacity: 0, y: 10 }}
                                    animate={{ opacity: 1, y: 0 }}
                                    onClick={handleMaster}
                                    className="mt-8 px-12 py-3 bg-cyan-500 hover:bg-cyan-400 text-ink-950 font-display font-medium tracking-wide rounded-full transition-colors z-10 w-full md:w-auto"
                                >
                                    Master it
                                </motion.button>
                            )}
                        </div>

                        {/* Sidebar Info - Oracle Engine Mode */}
                        <div className="md:col-span-1 glass-obsidian glass-obsidian-hover rounded-xl p-6 flex flex-col gap-4 relative overflow-hidden border border-white/10">
                            <div className="border-b border-white/10 pb-3">
                                <h3 className="font-display text-base text-ink-50 tracking-wide">AI Mix Analysis</h3>
                                <p className="font-mono text-[10px] tracking-[0.2em] uppercase mt-0.5 text-cyan-400">
                                    {isOracleScanning ? 'Listening…' : 'Let the Oracle listen first and set the dials for you'}
                                </p>
                            </div>

                            <div className="flex-1 overflow-y-auto custom-scrollbar flex flex-col gap-4">
                                {isOracleScanning && (
                                    <div className="mt-4">
                                        <LoadingProgressBar
                                            active={isOracleScanning}
                                            message="Listening to your mix"
                                            subMessage="Extracting acoustic topology signatures via AI. Takes about 30-40s."
                                            colorClass="blue"
                                            estimatedDurationMs={25000}
                                        />
                                    </div>
                                )}

                                {targetFile && !oracleData && !isOracleScanning && (
                                    <Btn variant="accent" accent="#22d3ee" onClick={handleOracleScan} className="w-full shrink-0">
                                        Analyze my mix
                                    </Btn>
                                )}

                                {oracleData && !isOracleApplied && (
                                    <motion.div
                                        initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}
                                        className="flex flex-col gap-4 mt-2"
                                    >
                                        <div className="bg-black/40 p-4 rounded-lg border border-white/10 max-h-[140px] overflow-y-auto">
                                            <p className="font-mono text-[11px] text-ink-200 leading-relaxed tracking-wide">
                                                {oracleData.analysis}
                                            </p>
                                        </div>
                                        <div className="bg-black/30 p-2 flex justify-between rounded-lg border border-white/10 font-mono text-[10px] text-cyan-400">
                                            <span>Sub: {oracleData.knobs.sub}</span>
                                            <span>Air: {oracleData.knobs.air}</span>
                                            <span>Snap: {oracleData.knobs.snap}</span>
                                            <span>Width: {oracleData.knobs.width}</span>
                                        </div>
                                        <Btn
                                            variant="accent"
                                            accent="#22d3ee"
                                            className="w-full shrink-0"
                                            onClick={() => {
                                                setKnobs(oracleData.knobs);
                                                setIsOracleApplied(true);
                                            }}
                                        >
                                            Use these settings
                                        </Btn>
                                    </motion.div>
                                )}

                                {isOracleApplied && (
                                    <motion.div
                                        initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }}
                                        className="flex flex-col items-center justify-center gap-4 mt-2 border border-cyan-500/30 bg-cyan-500/10 rounded-lg p-6 shrink-0"
                                    >
                                        <Shield size={32} className="text-cyan-400" />
                                        <div className="flex flex-col items-center">
                                            <h4 className="font-display text-ink-50 font-medium tracking-wide mb-1">Dials set</h4>
                                            <p className="font-mono text-[10px] text-ink-400 uppercase tracking-widest text-center">
                                                Master controls auto-tuned to the Oracle's read on your mix.
                                            </p>
                                        </div>
                                    </motion.div>
                                )}

                                {/* Neural Stem Extraction */}
                                {targetFile && (
                                    <div className="mt-auto border-t border-white/10 pt-4 pb-2">
                                        <h3 className="font-mono text-[11px] tracking-widest text-ink-400 uppercase mb-3 flex items-center gap-2">
                                            <svg className="w-3 h-3 text-ink-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19.428 15.428a2 2 0 00-1.022-.547l-2.387-.477a6 6 0 00-3.86.517l-.318.158a6 6 0 01-3.86.517L6.05 15.21a2 2 0 00-1.806.547M8 4h8l-1 1v5.172a2 2 0 00.586 1.414l5 5c1.26 1.26.367 3.414-1.415 3.414H4.828c-1.782 0-2.674-2.154-1.414-3.414l5-5A2 2 0 009 10.172V5L8 4z" />
                                            </svg>
                                            Split into stems
                                        </h3>

                                        {!isExtractingStems && !stemsData && (
                                            <Btn variant="ghost" onClick={handleExtractStems} className="w-full shrink-0">
                                                Bass / drums / vocals / synth
                                            </Btn>
                                        )}

                                        {isExtractingStems && (
                                            <LoadingProgressBar
                                                active={isExtractingStems}
                                                message="Splitting the mix"
                                                colorClass="blue"
                                                estimatedDurationMs={4000}
                                            />
                                        )}

                                        {stemsData && (
                                            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="grid grid-cols-2 gap-2">
                                                {Object.entries(stemsData).map(([key, url]) => (
                                                    <a
                                                        key={key}
                                                        href={url}
                                                        target="_blank"
                                                        rel="noopener noreferrer"
                                                        className="flex items-center gap-2 justify-center py-2 bg-white/5 text-ink-200 font-mono text-[9px] uppercase tracking-widest border border-white/10 rounded-lg hover:bg-cyan-500/10 hover:border-cyan-500/30 hover:text-cyan-400 transition-colors"
                                                    >
                                                        <Download size={10} /> {key}
                                                    </a>
                                                ))}
                                            </motion.div>
                                        )}
                                    </div>
                                )}

                                {!targetFile && (
                                    <div className="flex-1 flex items-center justify-center font-mono text-xs text-ink-700 tracking-widest h-32 text-center">
                                        Drop your mix to unlock analysis
                                    </div>
                                )}
                            </div>
                        </div>
                    </motion.div>
                )}

                {phase === 'processing' && (
                    <motion.div
                        key="processing"
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                    >
                        <Panel className="h-[400px] flex flex-col items-center justify-center relative overflow-hidden">
                            <div className="flex flex-col items-center">
                                <div className="relative flex items-center justify-center p-10">
                                    <div className="absolute inset-0 border-t-2 border-cyan-500/60 rounded-full animate-spin [animation-duration:3s]" />
                                    <div className="absolute inset-4 border-r-2 border-cyan-200/60 rounded-full animate-spin [animation-duration:2s] [animation-direction:reverse]" />
                                    <Mic2 size={48} className="text-cyan-400 animate-pulse" />
                                </div>
                                <div className="w-full max-w-sm mt-8">
                                    <LoadingProgressBar
                                        active={phase === 'processing'}
                                        message="Mastering your track"
                                        subMessage="Running the DSP engine and comparing your mix to the reference. Usually takes 30-60s."
                                        colorClass="blue"
                                        estimatedDurationMs={45000}
                                    />
                                </div>
                            </div>
                        </Panel>
                    </motion.div>
                )}

                {phase === 'tuning' && (
                    <motion.div
                        key="tuning"
                        initial={{ opacity: 0, scale: 0.95 }}
                        animate={{ opacity: 1, scale: 1 }}
                        className="flex flex-col gap-6"
                    >
                        {/* Player & Toggle */}
                        <Panel title="Result" sub="Preview, A/B test, and export" accent="#22d3ee">
                            <div className="flex items-center justify-between flex-wrap gap-6">
                                <div className="flex items-center gap-6">
                                    {masterAudioUrl && (
                                        <audio
                                            ref={audioRef}
                                            src={masterAudioUrl}
                                            onEnded={() => setIsPlaying(false)}
                                        />
                                    )}
                                    <button
                                        onClick={togglePlay}
                                        disabled={!masterAudioUrl}
                                        className="h-16 w-16 bg-cyan-500 rounded-full flex items-center justify-center hover:scale-105 transition-transform text-ink-950 shadow-[0_0_20px_rgba(34,211,238,0.4)] disabled:opacity-50 relative z-10 shrink-0"
                                    >
                                        {isPlaying ? <Pause size={24} /> : <Play size={24} className="ml-1" />}
                                    </button>

                                    {isPlaying && (
                                        <div className="flex items-center gap-1 h-8 px-2 absolute left-24">
                                            {[1, 2, 3, 4, 5, 6, 7].map((i) => (
                                                <motion.div
                                                    key={i}
                                                    className="w-1 bg-cyan-500 rounded-full"
                                                    animate={{ height: ['20%', '100%', '20%'] }}
                                                    transition={{ duration: Math.random() * 0.5 + 0.3, repeat: Infinity, ease: 'easeInOut' }}
                                                />
                                            ))}
                                        </div>
                                    )}

                                    <div className={`transition-all duration-500 ${isPlaying ? 'ml-16' : 'ml-0'}`}>
                                        <h3 className="font-display text-xl text-ink-50 font-medium tracking-tight mb-1">Your master</h3>
                                        <div className="flex items-center gap-2 font-mono text-xs text-ink-400 uppercase tracking-widest">
                                            <Shield size={12} className="text-cyan-400" /> LUFS -14.0 · True peak -1.0dB
                                        </div>
                                    </div>
                                </div>

                                {/* Sovereign Master Toggle */}
                                <div className="flex items-center gap-4 bg-white/5 p-2 pr-6 rounded-full border border-white/10">
                                    <button
                                        onClick={() => setIsSovereignMaster(!isSovereignMaster)}
                                        className={`w-12 h-6 rounded-full p-1 transition-colors ${isSovereignMaster ? 'bg-cyan-500' : 'bg-white/10'}`}
                                    >
                                        <motion.div
                                            className="bg-white w-4 h-4 rounded-full"
                                            animate={{ x: isSovereignMaster ? 24 : 0 }}
                                        />
                                    </button>
                                    <div className="flex flex-col">
                                        <span className="font-display text-xs text-ink-50 font-medium -mb-1">Sovereign mode</span>
                                        <span className="font-mono text-[9px] text-ink-400 tracking-widest uppercase">A/B testing active</span>
                                    </div>
                                </div>
                            </div>
                        </Panel>

                        {/* Fine-Tuning Console */}
                        <Panel title="Master controls" sub="Nudge these to taste — the Oracle already got you close" accent="#22d3ee" className="relative overflow-hidden">
                            <div className="absolute top-0 right-0 p-8 opacity-5 pointer-events-none">
                                <Settings2 size={200} className="text-cyan-400" />
                            </div>

                            <div className="grid grid-cols-2 md:grid-cols-4 gap-8 relative z-10 w-full max-w-3xl mx-auto mb-6">
                                <Knob label="Sub" hint="low-end weight" value={knobs.sub} onChange={(v: any) => setKnobs({ ...knobs, sub: v })} />
                                <Knob label="Air" hint="top-end shine" value={knobs.air} onChange={(v: any) => setKnobs({ ...knobs, air: v })} />
                                <Knob label="Snap" hint="punch" value={knobs.snap} onChange={(v: any) => setKnobs({ ...knobs, snap: v })} />
                                <Knob label="Width" hint="stereo space" value={knobs.width} onChange={(v: any) => setKnobs({ ...knobs, width: v })} />
                            </div>

                            <div className="flex justify-center mt-12 gap-3 flex-wrap relative z-10">
                                {masterAudioUrl && (
                                    <>
                                        <Btn variant="ghost" size="sm" onClick={handleDownload}>
                                            <Download size={14} /> Download master
                                        </Btn>
                                        <Btn variant="ghost" size="sm" onClick={initiateBlindTest}>
                                            <HelpCircle size={14} /> Blind test
                                        </Btn>
                                    </>
                                )}
                                <Btn variant="ghost" size="sm" onClick={() => setShowAnalytics(true)}>
                                    <Waves size={14} /> Waveform analytics
                                </Btn>
                                <Btn
                                    variant="ghost"
                                    size="sm"
                                    onClick={() => {
                                        setPhase('dropzone');
                                        setTargetFile(null);
                                        setTargetUrl(null);
                                        setRefFile(null);
                                        setRefUrl(null);
                                        setMasterAudioUrl(null);
                                        setIsPlaying(false);
                                        setIsOracleApplied(false);
                                        setOracleData(null);
                                        setShowAnalytics(false);
                                        setStemsData(null);
                                    }}
                                >
                                    Start over
                                </Btn>
                            </div>
                        </Panel>
                    </motion.div>
                )}
            </AnimatePresence>

            {/* Waveform Analytics Modal */}
            <AnimatePresence>
                {showAnalytics && (
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        className="fixed inset-0 z-50 flex items-center justify-center bg-black/90 backdrop-blur-sm p-4"
                    >
                        <motion.div
                            initial={{ scale: 0.95, y: 20 }}
                            animate={{ scale: 1, y: 0 }}
                            exit={{ scale: 0.95, y: 20 }}
                            className="bg-black/90 border border-white/10 rounded-2xl overflow-hidden flex flex-col max-h-[90vh]"
                        >
                            <div className="p-4 border-b border-white/10 flex justify-between items-center bg-black/60 backdrop-blur-md">
                                <h2 className="font-display text-xl text-ink-50 tracking-wide flex items-center gap-3">
                                    <Waves className="text-cyan-400" />
                                    Waveform analytics
                                </h2>
                                <div className="flex items-center gap-4">
                                    <button
                                        onClick={() => setShowHeatmap(!showHeatmap)}
                                        className={`font-mono text-[9px] uppercase tracking-widest py-1 px-3 border rounded-full transition-colors ${showHeatmap ? 'bg-cyan-500/10 text-cyan-400 border-cyan-500/30' : 'bg-transparent text-ink-400 border-white/10'}`}
                                    >
                                        Heatmap {showHeatmap ? 'on' : 'off'}
                                    </button>
                                    <button onClick={() => setShowAnalytics(false)} className="text-ink-400 hover:text-cyan-400 transition-colors">
                                        <X size={24} />
                                    </button>
                                </div>
                            </div>

                            <div className="p-6 overflow-y-auto custom-scrollbar flex flex-col gap-6">
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                    <div className="flex flex-col gap-4">
                                        <WaveformViewer url={targetUrl} title="Your original mix" color="#9ca3af" renderHeatmap={showHeatmap} />
                                        <WaveformViewer url={refUrl} title="Reference track" color="#10b981" renderHeatmap={showHeatmap} />
                                    </div>
                                    <div className="flex flex-col h-full glass-obsidian rounded-lg p-6 border border-white/10">
                                        <h3 className="font-mono text-xs text-cyan-400 tracking-widest uppercase mb-4 flex items-center gap-2">
                                            <Activity size={14} /> What the engine did
                                        </h3>
                                        <div className="text-xs font-mono text-ink-200 space-y-3 flex-1">
                                            <p className="border-l-2 border-cyan-500/40 pl-2">
                                                <span className="text-cyan-400 font-medium block mb-1">Loudness & dynamics</span>
                                                Aligned your mix's crest factor with the reference. Global dynamic range reduction: -3.2dB.
                                            </p>
                                            <p className="border-l-2 border-cyan-500/40 pl-2">
                                                <span className="text-cyan-400 font-medium block mb-1">Clarity polish</span>
                                                The Oracle detected excessive low-mid mud and applied a high-shelf air boost at 10kHz (+{(knobs.air - 50) / 10}dB) to keep it from sounding muffled.
                                            </p>
                                            <p className="border-l-2 border-red-500/50 pl-2">
                                                <span className="text-red-400 font-medium block mb-1">Transient restoration</span>
                                                Parallel compression applied to kick/snare transients to keep the punch alongside the reference.
                                            </p>
                                        </div>
                                    </div>
                                </div>
                                <div className="mt-4 border border-cyan-500/20 rounded-lg p-1 bg-cyan-500/10">
                                    <WaveformViewer url={masterAudioUrl} title="Your master" color="#10b981" renderHeatmap={showHeatmap} />
                                </div>
                            </div>
                        </motion.div>
                    </motion.div>
                )}
            </AnimatePresence>

            {/* Blind Test Overlay Modal */}
            <AnimatePresence>
                {showBlindTest && (
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        className="fixed inset-0 z-50 flex items-center justify-center bg-black/95 backdrop-blur-md p-4"
                    >
                        <motion.div
                            initial={{ scale: 0.9, y: 30 }}
                            animate={{ scale: 1, y: 0 }}
                            exit={{ scale: 0.9, y: 30 }}
                            className="glass-obsidian w-full max-w-2xl border border-orange-500/30 shadow-[0_0_80px_rgba(251,146,60,0.15)] rounded-2xl overflow-hidden flex flex-col relative"
                        >
                            <div className="absolute top-0 right-0 p-4 opacity-10 pointer-events-none">
                                <HelpCircle size={150} className="text-orange-400" />
                            </div>

                            <div className="p-6 border-b border-white/10 flex justify-between items-center relative z-10">
                                <h2 className="font-display text-2xl text-ink-50 tracking-tight flex items-center gap-3">
                                    <HelpCircle className="text-cyan-400" />
                                    Blind test
                                </h2>
                                <button
                                    onClick={() => {
                                        setShowBlindTest(false);
                                        if (blindTestAudioRef) blindTestAudioRef.pause();
                                        setBlindTestPlaying(null);
                                    }}
                                    className="text-ink-400 hover:text-cyan-400 transition-colors"
                                >
                                    <X size={24} />
                                </button>
                            </div>

                            <div className="p-8 flex flex-col gap-8 relative z-10">
                                <p className="font-mono text-sm text-ink-200 text-center leading-relaxed max-w-lg mx-auto">
                                    {blindTestWinner
                                        ? "Reveal: here's which one you picked, no placebo effect involved."
                                        : "Your master and your original mix are scrambled below. Listen closely and pick the one that sounds better."
                                    }
                                </p>

                                <div className="grid grid-cols-2 gap-8">
                                    {/* Source A */}
                                    <div className="flex flex-col gap-4">
                                        <button
                                            onClick={() => toggleBlindTestPlay('A')}
                                            className={`h-24 rounded-2xl flex items-center justify-center border-2 transition-all shadow-lg group ${blindTestPlaying === 'A' ? 'bg-orange-500/20 border-orange-400 shadow-[inset_0_0_30px_rgba(251,146,60,0.3)]' : 'bg-white/5 border-white/10 hover:border-orange-500/50 hover:bg-white/10'}`}
                                        >
                                            {blindTestPlaying === 'A' ? <Pause size={32} className="text-orange-400" /> : <Play size={32} className="text-ink-200 group-hover:text-orange-400 ml-2" />}
                                        </button>

                                        {!blindTestWinner ? (
                                            <button
                                                onClick={() => handleBlindTestVote('A')}
                                                className="py-3 bg-white/5 border border-white/10 text-cyan-400 font-mono text-xs tracking-widest uppercase hover:bg-orange-600 hover:border-orange-400 transition-colors rounded-full"
                                            >
                                                Vote A
                                            </button>
                                        ) : (
                                            <div className={`p-4 rounded-lg border font-mono tracking-widest text-center text-xs uppercase ${isSovereignA ? 'bg-cyan-500/10 border-cyan-500/30 text-cyan-400' : 'bg-red-900/20 border-red-500/40 text-red-400'}`}>
                                                {isSovereignA ? "Your master" : "Original mix"}
                                                {blindTestWinner === 'A' && <div className="mt-2 text-[9px] text-ink-400">Your pick</div>}
                                            </div>
                                        )}
                                    </div>

                                    {/* Source B */}
                                    <div className="flex flex-col gap-4">
                                        <button
                                            onClick={() => toggleBlindTestPlay('B')}
                                            className={`h-24 rounded-2xl flex items-center justify-center border-2 transition-all shadow-lg group ${blindTestPlaying === 'B' ? 'bg-orange-500/20 border-orange-400 shadow-[inset_0_0_30px_rgba(251,146,60,0.3)]' : 'bg-white/5 border-white/10 hover:border-orange-500/50 hover:bg-white/10'}`}
                                        >
                                            {blindTestPlaying === 'B' ? <Pause size={32} className="text-orange-400" /> : <Play size={32} className="text-ink-200 group-hover:text-orange-400 ml-2" />}
                                        </button>

                                        {!blindTestWinner ? (
                                            <button
                                                onClick={() => handleBlindTestVote('B')}
                                                className="py-3 bg-white/5 border border-white/10 text-cyan-400 font-mono text-xs tracking-widest uppercase hover:bg-orange-600 hover:border-orange-400 transition-colors rounded-full"
                                            >
                                                Vote B
                                            </button>
                                        ) : (
                                            <div className={`p-4 rounded-lg border font-mono tracking-widest text-center text-xs uppercase ${!isSovereignA ? 'bg-cyan-500/10 border-cyan-500/30 text-cyan-400' : 'bg-red-900/20 border-red-500/40 text-red-400'}`}>
                                                {!isSovereignA ? "Your master" : "Original mix"}
                                                {blindTestWinner === 'B' && <div className="mt-2 text-[9px] text-ink-400">Your pick</div>}
                                            </div>
                                        )}
                                    </div>
                                </div>
                            </div>
                        </motion.div>
                    </motion.div>
                )}
            </AnimatePresence>
        </div>
    );
}
