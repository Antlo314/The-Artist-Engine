import { useState, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Mic2, Activity, Play, Pause, Settings2, Shield, UploadCloud, Volume2, Waves, X, HelpCircle, Download } from 'lucide-react';
import WaveSurfer from 'wavesurfer.js';
import Spectrogram from 'wavesurfer.js/dist/plugins/spectrogram.esm.js';
import LoadingProgressBar from './LoadingProgressBar';

export default function StudioCore() {
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

    const Knob = ({ label, value, onChange }: any) => (
        <div className="flex flex-col items-center gap-3">
            <div className="relative w-16 h-16 rounded-full bg-black border-2 border-emerald-900 shadow-[inset_0_0_10px_rgba(0,0,0,0.8)] flex items-center justify-center group">
                <div
                    className="w-1 h-3 bg-emerald-400 absolute top-1 origin-[50%_28px] rounded-full shadow-[0_0_5px_rgba(16,185,129,0.8)] transition-transform duration-300 group-hover:bg-white"
                    style={{ transform: `rotate(${(value / 100) * 270 - 135}deg)` }}
                />
                <div className="text-white font-mono text-xs">{value}%</div>
            </div>
            <span className="font-mono text-[10px] text-gray-400 tracking-widest uppercase text-center leading-tight">
                {label}
            </span>
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
            <div className="flex flex-col gap-2 bg-black/40 p-4 rounded border border-white/5 relative">
                <div className="flex justify-between items-center z-10">
                    <span className="font-mono text-[10px] uppercase tracking-widest" style={{ color }}>{title}</span>
                    <button
                        onClick={() => wavesurferRef.current?.playPause()}
                        className="w-6 h-6 rounded-full bg-white/10 flex items-center justify-center hover:bg-white/20 transition-colors"
                    >
                        <Play size={10} className="text-white ml-0.5" />
                    </button>
                </div>
                <div ref={containerRef} className="w-full relative z-10" />
                {renderHeatmap && (
                    <div className="w-full mt-2 relative z-0 border-t border-white/10 pt-2">
                        <span className="font-mono text-[8px] text-gray-500 uppercase tracking-widest absolute -top-1 left-0 bg-black/50 px-1 rounded z-20">Acoustic Heatmap</span>
                        <div ref={spectrogramRef} className="w-full rounded overflow-hidden opacity-80" />
                    </div>
                )}
            </div>
        );
    };

    return (
        <div className="space-y-6">
            {/* Global Header */}
            <div className="flex items-end justify-between border-b border-white/10 pb-4">
                <div>
                    <h2 className="font-cinzel text-3xl font-bold text-white tracking-widest text-glow flex items-center gap-3">
                        <Mic2 className="text-emerald-400" />
                        AUDIO MASTER CORE
                    </h2>
                    <p className="font-mono text-xs text-gray-500 tracking-widest uppercase mt-1 text-emerald-500/50 drop-shadow-md">
                        Neural Processing Engine // Matchering Framework
                    </p>
                </div>
                <div className="hidden md:flex flex-col items-end">
                    <div className="flex items-center gap-2 mb-1">
                        <span className="text-[10px] font-mono text-emerald-400 border border-emerald-500/30 px-2 rounded">
                            LUFS OMEGA
                        </span>
                    </div>
                    <span className="font-mono text-[10px] text-gray-500 tracking-widest uppercase">
                        AI Models: ACTIVE
                    </span>
                </div>
            </div>

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
                            className={`md:col-span-2 glass-card rounded-2xl p-10 flex flex-col items-center justify-center border-dashed border-2 hover:border-emerald-400/50 transition-all min-h-[400px] relative overflow-hidden group ${isDragging ? 'border-emerald-400 bg-emerald-900/20 shadow-[0_0_30px_rgba(16,185,129,0.2)]' : 'border-emerald-900/50 hover:bg-emerald-900/5 cursor-default'}`}
                        >
                            <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,rgba(16,185,129,0.05)_0%,transparent_60%)] opacity-0 group-hover:opacity-100 transition-opacity z-0" />
                            {/* Audio Core Ambient Soundwaves Video Background */}
                            <video
                                autoPlay
                                loop
                                muted
                                playsInline
                                className="absolute inset-0 w-full h-full object-cover opacity-50 mix-blend-screen z-0 group-hover:opacity-75 transition-opacity duration-1000"
                            >
                                <source src="/audio-core.mp4" type="video/mp4" />
                            </video>

                            <div className="w-20 h-20 rounded-full border-2 border-dashed border-emerald-500/50 flex items-center justify-center mb-6 group-hover:rotate-180 transition-transform duration-1000 ease-in-out">
                                <UploadCloud size={32} className="text-emerald-400" />
                            </div>
                            <h3 className="font-cinzel text-2xl text-white mb-2 tracking-wider">INITIATE INGEST SEQUENCE</h3>
                            <p className="font-mono text-gray-500 text-sm tracking-widest text-center max-w-sm mb-8">
                                Drag and drop unmastered multitrack payload here. Max payload size: 2.5GB.
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
                                    className={`flex items-center justify-between w-full py-3 px-4 rounded border transition-all cursor-pointer ${targetFile ? 'bg-emerald-900/40 border-emerald-400 shadow-[inset_0_0_10px_rgba(16,185,129,0.2)]' : 'border-white/10 hover:border-white/30 hover:bg-white/5'}`}
                                >
                                    <div className="flex items-center gap-3 overflow-hidden">
                                        <div className={`w-8 h-8 rounded flex items-center justify-center shrink-0 ${targetFile ? 'bg-emerald-500/20 text-emerald-400' : 'bg-white/5 text-gray-500'}`}>
                                            <Mic2 size={14} />
                                        </div>
                                        <div className="flex flex-col truncate">
                                            <span className={`font-mono text-[10px] tracking-widest uppercase ${targetFile ? 'text-emerald-500' : 'text-gray-500'}`}>Target Payload</span>
                                            <span className={`font-mono text-xs truncate ${targetFile ? 'text-white' : 'text-gray-600'}`}>
                                                {targetFile ? targetFile.name : 'Select Unmastered Mix...'}
                                            </span>
                                        </div>
                                    </div>
                                    {targetFile && (
                                        <div className="flex items-center gap-2 shrink-0">
                                            <button
                                                onClick={(e) => { e.stopPropagation(); togglePreview('target', targetFile); }}
                                                className="w-8 h-8 rounded-full border border-emerald-500/50 flex items-center justify-center text-emerald-400 hover:bg-emerald-500/20 hover:scale-105 transition-all"
                                                title="Preview Payload"
                                            >
                                                {playingPreview === 'target' ? <Pause size={12} /> : <Play size={12} className="ml-1" />}
                                            </button>
                                            <button
                                                onClick={removeTargetFile}
                                                className="w-8 h-8 rounded-full border border-red-500/50 flex items-center justify-center text-red-500 hover:bg-red-500/20 hover:scale-105 transition-all"
                                                title="Remove Payload"
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
                                    className={`flex items-center justify-between w-full py-3 px-4 rounded border transition-all cursor-pointer ${refFile ? 'bg-emerald-900/40 border-emerald-400 shadow-[inset_0_0_10px_rgba(16,185,129,0.2)]' : 'border-white/10 hover:border-white/30 hover:bg-white/5'}`}
                                >
                                    <div className="flex items-center gap-3 overflow-hidden">
                                        <div className={`w-8 h-8 rounded flex items-center justify-center shrink-0 ${refFile ? 'bg-emerald-500/20 text-emerald-400' : 'bg-white/5 text-gray-500'}`}>
                                            <Volume2 size={14} />
                                        </div>
                                        <div className="flex flex-col truncate">
                                            <span className={`font-mono text-[10px] tracking-widest uppercase ${refFile ? 'text-emerald-500' : 'text-gray-500'}`}>Acoustic Reference</span>
                                            <span className={`font-mono text-xs truncate ${refFile ? 'text-white' : 'text-gray-600'}`}>
                                                {refFile ? refFile.name : 'Select Professional Reference...'}
                                            </span>
                                        </div>
                                    </div>
                                    {refFile && (
                                        <div className="flex items-center gap-2 shrink-0">
                                            <button
                                                onClick={(e) => { e.stopPropagation(); togglePreview('ref', refFile); }}
                                                className="w-8 h-8 rounded-full border border-emerald-500/50 flex items-center justify-center text-emerald-400 hover:bg-emerald-500/20 hover:scale-105 transition-all"
                                                title="Preview Reference"
                                            >
                                                {playingPreview === 'ref' ? <Pause size={12} /> : <Play size={12} className="ml-1" />}
                                            </button>
                                            <button
                                                onClick={removeRefFile}
                                                className="w-8 h-8 rounded-full border border-red-500/50 flex items-center justify-center text-red-500 hover:bg-red-500/20 hover:scale-105 transition-all"
                                                title="Remove Reference"
                                            >
                                                <X size={12} />
                                            </button>
                                        </div>
                                    )}
                                </div>
                            </div>

                            <div className="mt-6 flex flex-col items-center gap-2 relative z-10 w-full">
                                <label className="font-mono text-[10px] text-gray-500 tracking-widest uppercase">Export Format</label>
                                <div className="flex gap-2">
                                    {['wav', 'mp3', 'flac'].map(fmt => (
                                        <button
                                            key={fmt}
                                            onClick={() => setOutputFormat(fmt)}
                                            className={`px-3 py-1 text-xs font-mono uppercase tracking-widest rounded border transition-colors ${outputFormat === fmt ? 'bg-white/10 border-white text-white' : 'border-white/10 text-gray-500 hover:border-white/30'}`}
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
                                    className="mt-8 px-12 py-3 bg-white text-black font-cinzel font-bold tracking-widest rounded shadow-[0_0_30px_rgba(255,255,255,0.3)] hover:scale-105 transition-transform z-10"
                                >
                                    GENERATE MASTER
                                </motion.button>
                            )}
                        </div>

                        {/* Sidebar Info - Oracle Engine Mode */}
                        <div className="md:col-span-1 glass-card rounded-2xl p-6 flex flex-col gap-4 relative overflow-hidden">
                            <h3 className="font-mono text-[11px] tracking-widest text-emerald-400 border-b border-emerald-900/50 pb-2 flex items-center justify-between">
                                <span className="flex items-center gap-2"><Activity size={14} /> ORACLE ANALYTICS</span>
                                {isOracleScanning && <span className="animate-pulse bg-emerald-900/50 text-emerald-300 px-2 rounded">SCANNING OMEGA CORE...</span>}
                            </h3>

                            <div className="flex-1 overflow-y-auto custom-scrollbar flex flex-col gap-4">
                                {isOracleScanning && (
                                    <div className="mt-4">
                                        <LoadingProgressBar
                                            active={isOracleScanning}
                                            message="SCANNING OMEGA CORE"
                                            subMessage="Extracting acoustic topology signatures via AI. Engine requires up to 30s-40s."
                                            colorClass="emerald"
                                            estimatedDurationMs={25000}
                                        />
                                    </div>
                                )}

                                {targetFile && !oracleData && !isOracleScanning && (
                                    <button
                                        onClick={handleOracleScan}
                                        className="w-full py-4 mt-2 bg-emerald-900/20 text-emerald-400 border border-emerald-500/30 rounded font-mono text-xs tracking-widest hover:bg-emerald-800/40 transition-colors shadow-[0_0_15px_rgba(16,185,129,0.1)] shrink-0"
                                    >
                                        [ DEPLOY ORACLE SCAN ]
                                    </button>
                                )}

                                {oracleData && !isOracleApplied && (
                                    <motion.div
                                        initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}
                                        className="flex flex-col gap-4 mt-2"
                                    >
                                        <div className="bg-black/60 p-4 rounded border border-white/5 max-h-[140px] overflow-y-auto">
                                            <p className="font-mono text-[11px] text-emerald-100/80 leading-relaxed tracking-wider">
                                                {oracleData.analysis}
                                            </p>
                                        </div>
                                        <div className="bg-black/40 p-2 flex justify-between rounded border border-white/5 font-mono text-[10px] text-gray-400">
                                            <span>SUP: {oracleData.knobs.sub}</span>
                                            <span>AIR: {oracleData.knobs.air}</span>
                                            <span>SNAP: {oracleData.knobs.snap}</span>
                                            <span>WID: {oracleData.knobs.width}</span>
                                        </div>
                                        <button
                                            onClick={() => {
                                                setKnobs(oracleData.knobs);
                                                setIsOracleApplied(true);
                                            }}
                                            className="w-full py-3 bg-emerald-500 text-black font-bold border border-emerald-400 rounded font-mono text-xs tracking-widest hover:scale-[1.02] transition-transform shadow-[0_0_20px_rgba(16,185,129,0.3)] hover:shadow-[0_0_30px_rgba(16,185,129,0.5)] shrink-0"
                                        >
                                            [ APPLY SETTINGS ]
                                        </button>
                                    </motion.div>
                                )}

                                {isOracleApplied && (
                                    <motion.div
                                        initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }}
                                        className="flex flex-col items-center justify-center gap-4 mt-2 border border-emerald-500/30 bg-emerald-900/10 rounded p-6 shadow-[inset_0_0_20px_rgba(16,185,129,0.1)] shrink-0"
                                    >
                                        <Shield size={32} className="text-emerald-400 drop-shadow-md" />
                                        <div className="flex flex-col items-center">
                                            <h4 className="font-cinzel text-emerald-400 font-bold tracking-widest mb-1">TARGET ACQUIRED</h4>
                                            <p className="font-mono text-[10px] text-emerald-200/60 uppercase tracking-widest text-center">
                                                DSP topology auto-locked to Oracle AI parameters.
                                            </p>
                                        </div>
                                    </motion.div>
                                )}

                                {/* NEURAL STEM COMPONENT */}
                                {targetFile && (
                                    <div className="mt-auto border-t border-emerald-900/50 pt-4 pb-2">
                                        <h3 className="font-mono text-[11px] tracking-widest text-emerald-400 mb-4 flex items-center gap-2">
                                            <svg className="w-3 h-3 text-emerald-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19.428 15.428a2 2 0 00-1.022-.547l-2.387-.477a6 6 0 00-3.86.517l-.318.158a6 6 0 01-3.86.517L6.05 15.21a2 2 0 00-1.806.547M8 4h8l-1 1v5.172a2 2 0 00.586 1.414l5 5c1.26 1.26.367 3.414-1.415 3.414H4.828c-1.782 0-2.674-2.154-1.414-3.414l5-5A2 2 0 009 10.172V5L8 4z" />
                                            </svg>
                                            NEURAL STEM EXTRACTION
                                        </h3>

                                        {!isExtractingStems && !stemsData && (
                                            <button
                                                onClick={handleExtractStems}
                                                className="w-full py-3 bg-white/5 text-gray-300 border border-white/10 rounded font-mono text-[10px] tracking-widest hover:bg-white/10 hover:border-emerald-500/50 hover:text-emerald-400 transition-colors shrink-0"
                                            >
                                                SPLIT BASS / DRUMS / ACA / SYNTH
                                            </button>
                                        )}

                                        {isExtractingStems && (
                                            <LoadingProgressBar
                                                active={isExtractingStems}
                                                message="DEMUXING AUDIO MATRIX"
                                                colorClass="emerald"
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
                                                        className="flex items-center gap-2 justify-center py-2 bg-emerald-900/30 text-emerald-300 font-mono text-[9px] uppercase tracking-widest border border-emerald-500/20 rounded hover:bg-emerald-800/50 hover:border-emerald-400 transition-colors"
                                                    >
                                                        <Download size={10} /> {key}
                                                    </a>
                                                ))}
                                            </motion.div>
                                        )}
                                    </div>
                                )}

                                {!targetFile && (
                                    <div className="flex-1 flex items-center justify-center font-mono text-xs text-gray-600 tracking-widest h-32">
                                        [ AWAITING PAYLOAD ]
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
                        className="glass-card rounded-2xl h-[400px] flex flex-col items-center justify-center border-emerald-500 bg-emerald-900/5 relative overflow-hidden"
                    >
                        {/* Audio Processing Video Background */}
                        <video
                            autoPlay
                            loop
                            muted
                            playsInline
                            className="absolute inset-0 w-full h-full object-cover opacity-80 pointer-events-none z-0 mix-blend-screen hue-rotate-[110deg]"
                        >
                            <source src="/the_sine_wave.mp4" type="video/mp4" />
                        </video>

                        <div className="relative z-10 flex flex-col items-center">
                            <div className="relative flex items-center justify-center p-10">
                                <div className="absolute inset-0 border-t-2 border-emerald-400 rounded-full animate-spin [animation-duration:3s]" />
                                <div className="absolute inset-4 border-r-2 border-emerald-200 rounded-full animate-spin [animation-duration:2s] [animation-direction:reverse]" />
                                <Mic2 size={48} className="text-emerald-400 animate-pulse" />
                            </div>
                            <div className="w-full max-w-sm mt-8">
                                <LoadingProgressBar
                                    active={phase === 'processing'}
                                    message="FORGING SOVEREIGN MASTER"
                                    subMessage="Running neural DSP Matchering algorithms. Comparing target topology to reference... Engine may take 30-60s to initiate."
                                    colorClass="emerald"
                                    estimatedDurationMs={45000}
                                />
                            </div>
                        </div>
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
                        <div className="glass-card p-6 flex items-center justify-between rounded-2xl border-emerald-900 shadow-[0_0_30px_rgba(16,185,129,0.1)]">
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
                                    className="h-16 w-16 bg-white rounded-full flex items-center justify-center hover:scale-105 transition-transform text-black shadow-[0_0_20px_rgba(255,255,255,0.3)] disabled:opacity-50 relative z-10 shrink-0"
                                >
                                    {isPlaying ? <Pause size={24} /> : <Play size={24} className="ml-1" />}
                                </button>

                                {isPlaying && (
                                    <div className="flex items-center gap-1 h-8 px-2 absolute left-24">
                                        {[1, 2, 3, 4, 5, 6, 7].map((i) => (
                                            <motion.div
                                                key={i}
                                                className="w-1 bg-emerald-400 rounded-full"
                                                animate={{ height: ['20%', '100%', '20%'] }}
                                                transition={{ duration: Math.random() * 0.5 + 0.3, repeat: Infinity, ease: 'easeInOut' }}
                                            />
                                        ))}
                                    </div>
                                )}

                                <div className={`transition-all duration-500 ${isPlaying ? 'ml-16' : 'ml-0'}`}>
                                    <h3 className="font-cinzel text-2xl text-white font-bold tracking-widest mb-1">FINAL_RENDER_AE94.wav</h3>
                                    <div className="flex items-center gap-4 font-mono text-xs text-emerald-400 uppercase tracking-widest drop-shadow-md">
                                        <Shield size={12} /> LUFS: -14.0 | TRUE PEAK: -1.0dB
                                    </div>
                                </div>
                            </div>

                            {/* Sovereign Master Toggle */}
                            <div className="flex items-center gap-4 bg-black/60 p-2 pr-6 rounded-full border border-white/10">
                                <button
                                    onClick={() => setIsSovereignMaster(!isSovereignMaster)}
                                    className={`w-12 h-6 rounded-full p-1 transition-colors ${isSovereignMaster ? 'bg-emerald-500 shadow-[0_0_15px_rgba(16,185,129,0.5)]' : 'bg-gray-700'}`}
                                >
                                    <motion.div
                                        className="bg-white w-4 h-4 rounded-full"
                                        animate={{ x: isSovereignMaster ? 24 : 0 }}
                                    />
                                </button>
                                <div className="flex flex-col">
                                    <span className="font-cinzel text-xs text-white font-bold -mb-1">SOVEREIGN MODE</span>
                                    <span className="font-mono text-[9px] text-emerald-400 tracking-widest uppercase">A/B Testing Active</span>
                                </div>
                            </div>
                        </div>

                        {/* Fine-Tuning Console */}
                        <div className="glass-card p-8 rounded-2xl relative overflow-hidden">
                            <div className="absolute top-0 right-0 p-8 opacity-5">
                                <Settings2 size={200} className="text-emerald-400 mix-blend-screen" />
                            </div>

                            <h3 className="font-cinzel text-xl text-white tracking-widest mb-8 border-b border-white/10 pb-4 inline-block pr-12">
                                FINE-TUNING CONSOLE
                            </h3>

                            <div className="grid grid-cols-2 md:grid-cols-4 gap-8 relative z-10 w-full max-w-3xl mx-auto mb-6">
                                <Knob label="SUB-HARMONIC DRIVE" value={knobs.sub} onChange={(v: any) => setKnobs({ ...knobs, sub: v })} />
                                <Knob label="VOCAL AIR (10kHz+)" value={knobs.air} onChange={(v: any) => setKnobs({ ...knobs, air: v })} />
                                <Knob label="TRANSIENT SNAP" value={knobs.snap} onChange={(v: any) => setKnobs({ ...knobs, snap: v })} />
                                <Knob label="STEREO WIDTH" value={knobs.width} onChange={(v: any) => setKnobs({ ...knobs, width: v })} />
                            </div>

                            <div className="flex justify-center mt-12 gap-8 flex-wrap">
                                {masterAudioUrl && (
                                    <>
                                        <button
                                            onClick={handleDownload}
                                            className="font-mono text-xs text-emerald-400 hover:text-white border-b border-emerald-600 pb-1 tracking-widest uppercase transition-colors flex items-center gap-2"
                                        >
                                            [CHOOSE OUTPUT DESTINATION]
                                        </button>
                                        <button
                                            onClick={initiateBlindTest}
                                            className="font-mono text-xs text-orange-400 hover:text-orange-300 border-b border-orange-600 pb-1 tracking-widest uppercase transition-colors flex items-center gap-2 drop-shadow-[0_0_8px_rgba(251,146,60,0.5)]"
                                        >
                                            <HelpCircle size={14} /> [BLIND TEST VALIDATOR]
                                        </button>
                                    </>
                                )}
                                <button
                                    onClick={() => setShowAnalytics(true)}
                                    className="font-mono text-xs text-emerald-400 hover:text-white border-b border-emerald-600 pb-1 tracking-widest uppercase transition-colors flex items-center gap-2"
                                >
                                    <Waves size={14} /> [WAVEFORM ANALYTICS]
                                </button>
                                <button
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
                                    className="font-mono text-xs text-gray-500 hover:text-white border-b border-gray-600 pb-1 tracking-widest uppercase transition-colors"
                                >
                                    [X] TERMINATE SESSION
                                </button>
                            </div>
                        </div>
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
                            className="bg-gray-900 w-full max-w-4xl border border-emerald-500/30 shadow-[0_0_50px_rgba(16,185,129,0.15)] rounded-2xl overflow-hidden flex flex-col max-h-[90vh]"
                        >
                            <div className="p-4 border-b border-white/10 flex justify-between items-center bg-black/40">
                                <h2 className="font-cinzel text-xl font-bold text-white tracking-widest flex items-center gap-3">
                                    <Waves className="text-emerald-400" />
                                    TOPOLOGY COMPARISON MATRIX
                                </h2>
                                <div className="flex items-center gap-4">
                                    <button
                                        onClick={() => setShowHeatmap(!showHeatmap)}
                                        className={`font-mono text-[9px] uppercase tracking-widest py-1 px-3 border rounded transition-colors ${showHeatmap ? 'bg-emerald-500/20 text-emerald-400 border-emerald-500/50' : 'bg-transparent text-gray-500 border-gray-600'}`}
                                    >
                                        Toggle Heatmap {showHeatmap ? '[ON]' : '[OFF]'}
                                    </button>
                                    <button onClick={() => setShowAnalytics(false)} className="text-gray-400 hover:text-white transition-colors">
                                        <X size={24} />
                                    </button>
                                </div>
                            </div>

                            <div className="p-6 overflow-y-auto custom-scrollbar flex flex-col gap-6">
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                    <div className="flex flex-col gap-4">
                                        <WaveformViewer url={targetUrl} title="Original Unmastered Source" color="#9ca3af" renderHeatmap={showHeatmap} />
                                        <WaveformViewer url={refUrl} title="Acoustic Reference Goal" color="#10b981" renderHeatmap={showHeatmap} />
                                    </div>
                                    <div className="flex flex-col h-full bg-black/40 border border-white/5 rounded p-6">
                                        <h3 className="font-mono text-xs text-emerald-400 tracking-widest uppercase mb-4 flex items-center gap-2">
                                            <Activity size={14} /> Neural DSP Decision Log
                                        </h3>
                                        <div className="text-xs font-mono text-gray-300 space-y-3 flex-1">
                                            <p className="border-l-2 border-emerald-500 pl-2">
                                                <span className="text-emerald-400 font-bold block mb-1">Phase 1: LUFS & RMS Alignment</span>
                                                Matchering Engine successfully aligned target crest factor with the reference goal track. Global dynamic range reduction: -3.2dB.
                                            </p>
                                            <p className="border-l-2 border-emerald-500 pl-2">
                                                <span className="text-emerald-400 font-bold block mb-1">Phase 2: Sovereign Clarity Polish</span>
                                                Gemini Oracle detected excessive low-mid mud. Applied High-Shelf Air injection at 10kHz (+{(knobs.air - 50) / 10}dB) to prevent algorithm muffling.
                                            </p>
                                            <p className="border-l-2 border-red-500 pl-2">
                                                <span className="text-red-400 font-bold block mb-1">Phase 3: Transient Restoration</span>
                                                Parallel compression snap applied to kick/snare transients to maintain punch alongside the reference.
                                            </p>
                                        </div>
                                    </div>
                                </div>
                                <div className="mt-4 border border-emerald-500/50 rounded-lg p-1 bg-emerald-900/10">
                                    <WaveformViewer url={masterAudioUrl} title="FINAL SOVEREIGN MASTER" color="#10b981" renderHeatmap={showHeatmap} />
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
                            className="bg-gray-900 w-full max-w-2xl border border-orange-500/30 shadow-[0_0_80px_rgba(251,146,60,0.15)] rounded-2xl overflow-hidden flex flex-col relative"
                        >
                            <div className="absolute top-0 right-0 p-4 opacity-10 pointer-events-none">
                                <HelpCircle size={150} className="text-orange-400" />
                            </div>

                            <div className="p-6 border-b border-white/10 flex justify-between items-center relative z-10">
                                <h2 className="font-cinzel text-2xl font-bold text-orange-400 tracking-widest flex items-center gap-3 drop-shadow-md">
                                    <HelpCircle className="text-orange-400" />
                                    BLIND TEST VALIDATOR
                                </h2>
                                <button
                                    onClick={() => {
                                        setShowBlindTest(false);
                                        if (blindTestAudioRef) blindTestAudioRef.pause();
                                        setBlindTestPlaying(null);
                                    }}
                                    className="text-gray-400 hover:text-white transition-colors"
                                >
                                    <X size={24} />
                                </button>
                            </div>

                            <div className="p-8 flex flex-col gap-8 relative z-10">
                                <p className="font-mono text-sm text-gray-400 text-center leading-relaxed max-w-lg mx-auto">
                                    {blindTestWinner
                                        ? "Validation complete. Placebo effect neutralized. The Sovereign Engine's true impact is revealed below."
                                        : "Objective analysis engaged. The Master and the Original have been scrambled. Listen precisely and select the superior topography."
                                    }
                                </p>

                                <div className="grid grid-cols-2 gap-8">
                                    {/* Source A */}
                                    <div className="flex flex-col gap-4">
                                        <button
                                            onClick={() => toggleBlindTestPlay('A')}
                                            className={`h-24 rounded-2xl flex items-center justify-center border-2 transition-all shadow-lg group ${blindTestPlaying === 'A' ? 'bg-orange-500/20 border-orange-400 shadow-[inset_0_0_30px_rgba(251,146,60,0.3)]' : 'bg-black/40 border-white/10 hover:border-orange-500/50 hover:bg-black/60'}`}
                                        >
                                            {blindTestPlaying === 'A' ? <Pause size={32} className="text-orange-400" /> : <Play size={32} className="text-gray-400 group-hover:text-orange-400 ml-2" />}
                                        </button>

                                        {!blindTestWinner ? (
                                            <button
                                                onClick={() => handleBlindTestVote('A')}
                                                className="py-3 bg-white/5 border border-white/10 text-white font-mono text-xs tracking-widest uppercase hover:bg-orange-600 hover:border-orange-400 transition-colors rounded shadow-md"
                                            >
                                                [ VOTE SOURCE A ]
                                            </button>
                                        ) : (
                                            <div className={`p-4 rounded border font-mono tracking-widest text-center text-xs uppercase ${isSovereignA ? 'bg-emerald-900/30 border-emerald-500 text-emerald-400' : 'bg-red-900/30 border-red-500 text-red-500'}`}>
                                                {isSovereignA ? "🏆 SOVEREIGN MASTER" : "❌ ORIGINAL UNMASTERED"}
                                                {blindTestWinner === 'A' && <div className="mt-2 text-[9px] text-white">YOUR SELECTION</div>}
                                            </div>
                                        )}
                                    </div>

                                    {/* Source B */}
                                    <div className="flex flex-col gap-4">
                                        <button
                                            onClick={() => toggleBlindTestPlay('B')}
                                            className={`h-24 rounded-2xl flex items-center justify-center border-2 transition-all shadow-lg group ${blindTestPlaying === 'B' ? 'bg-orange-500/20 border-orange-400 shadow-[inset_0_0_30px_rgba(251,146,60,0.3)]' : 'bg-black/40 border-white/10 hover:border-orange-500/50 hover:bg-black/60'}`}
                                        >
                                            {blindTestPlaying === 'B' ? <Pause size={32} className="text-orange-400" /> : <Play size={32} className="text-gray-400 group-hover:text-orange-400 ml-2" />}
                                        </button>

                                        {!blindTestWinner ? (
                                            <button
                                                onClick={() => handleBlindTestVote('B')}
                                                className="py-3 bg-white/5 border border-white/10 text-white font-mono text-xs tracking-widest uppercase hover:bg-orange-600 hover:border-orange-400 transition-colors rounded shadow-md"
                                            >
                                                [ VOTE SOURCE B ]
                                            </button>
                                        ) : (
                                            <div className={`p-4 rounded border font-mono tracking-widest text-center text-xs uppercase ${!isSovereignA ? 'bg-emerald-900/30 border-emerald-500 text-emerald-400' : 'bg-red-900/30 border-red-500 text-red-500'}`}>
                                                {!isSovereignA ? "🏆 SOVEREIGN MASTER" : "❌ ORIGINAL UNMASTERED"}
                                                {blindTestWinner === 'B' && <div className="mt-2 text-[9px] text-white">YOUR SELECTION</div>}
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
