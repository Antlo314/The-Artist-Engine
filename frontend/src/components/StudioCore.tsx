import { useState, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Mic2, Activity, Play, Pause, Settings2, Shield, UploadCloud, Volume2, Waves, X, HelpCircle, Download } from 'lucide-react';
import WaveSurfer from 'wavesurfer.js';
import Spectrogram from 'wavesurfer.js/dist/plugins/spectrogram.esm.js';
import LoadingProgressBar from './LoadingProgressBar';
import { useEngine } from '../lib/engineState';
import { apiFetch } from '../lib/api';
import { useAuth } from '../lib/auth';
import { PageHeader, Panel, Btn, StepHint, Segmented } from './ui/Shell';
import Walkthrough from './ui/Walkthrough';
import CoachPrompt from './ui/CoachPrompt';
import { hasSeenTour } from '../lib/onboarding';

/** Practical limit for cloud master (Render RAM + laptop browser). Not multi-GB dumps. */
const MAX_AUDIO_UPLOAD_BYTES = 80 * 1024 * 1024; // 80 MB
const MAX_AUDIO_UPLOAD_LABEL = '80 MB';

function formatMasterError(status: number, detail: unknown): string {
    const asText = (d: unknown): string => {
        if (typeof d === 'string') return d;
        if (d && typeof d === 'object') {
            const o = d as Record<string, unknown>;
            if (typeof o.message === 'string') return o.message;
            if (typeof o.detail === 'string') return o.detail;
            try {
                return JSON.stringify(d);
            } catch {
                return '';
            }
        }
        return '';
    };
    const body = asText(detail);
    if (status === 401) {
        return 'Session expired or not signed in. Please log in again, then retry mastering.';
    }
    if (status === 429) {
        return body || 'Mastering limit reached (daily quota or one master at a time). Wait a moment or try tomorrow.';
    }
    if (status === 413) {
        return body || `File too large. Use a WAV/FLAC under ${MAX_AUDIO_UPLOAD_LABEL}.`;
    }
    if (status === 502 || status === 503 || status === 504) {
        return 'Mastering server is waking up or timed out (common after idle on free hosting). Wait 30–60s and try again with a shorter file or Pure mode (no reference).';
    }
    if (status === 0 || status === 408) {
        return 'Network timeout while mastering. Check Wi‑Fi, use a smaller file, or try Pure mode without a reference track.';
    }
    return body || `Mastering failed (HTTP ${status}). Check that you are signed in and the server is online.`;
}

function acceptAudioFile(file: File, kind: 'mix' | 'reference'): string | null {
    if (!file.type.startsWith('audio/') && !/\.(wav|mp3|flac|aiff?|m4a|ogg|aac)$/i.test(file.name)) {
        return `${kind === 'mix' ? 'Mix' : 'Reference'} must be an audio file (WAV, FLAC, MP3…).`;
    }
    if (file.size > MAX_AUDIO_UPLOAD_BYTES) {
        const mb = (file.size / (1024 * 1024)).toFixed(1);
        return `${kind === 'mix' ? 'Mix' : 'Reference'} is ${mb} MB. Max is ${MAX_AUDIO_UPLOAD_LABEL}. Export a shorter bounce or lower bit depth.`;
    }
    if (file.size < 256) {
        return `${kind === 'mix' ? 'Mix' : 'Reference'} file looks empty.`;
    }
    return null;
}

export default function StudioCore() {
    const { record } = useEngine();
    const { refreshMe } = useAuth();
    const [phase, setPhase] = useState<'dropzone' | 'processing' | 'tuning'>('dropzone');
    const [knobs, setKnobs] = useState({ sub: 50, air: 60, snap: 40, width: 70 });
    // New mastering options (v5): tone bands, mono-bass, loudness profile, blend.
    const [tone, setTone] = useState({ warmth: 50, presence: 50, demud: 50 });
    const [monoBass, setMonoBass] = useState(false);
    const [masterProfile, setMasterProfile] = useState<'streaming' | 'club' | 'podcast' | 'custom' | 'off'>('streaming');
    const [customLufs, setCustomLufs] = useState(-12);
    const [refInfluence, setRefInfluence] = useState(100);
    const [showMoreOptions, setShowMoreOptions] = useState(false);
    const [targetFile, setTargetFile] = useState<File | null>(null);
    const [refFile, setRefFile] = useState<File | null>(null);
    const [outputFormat, setOutputFormat] = useState('wav');

    const PROFILE_LUFS: Record<string, number | null> = {
        streaming: -14, club: -9, podcast: -16, off: null,
    };
    const resolvedLufs = () => (masterProfile === 'custom' ? customLufs : PROFILE_LUFS[masterProfile]);
    const [isSovereignMaster, setIsSovereignMaster] = useState(true);
    const [masterAudioUrl, setMasterAudioUrl] = useState<string | null>(null);
    const [isPlaying, setIsPlaying] = useState(false);
    const [isOracleScanning, setIsOracleScanning] = useState(false);
    const [isOracleApplied, setIsOracleApplied] = useState(false);
    const [oracleData, setOracleData] = useState<{ analysis: string, knobs: { sub: number, air: number, snap: number, width: number } } | null>(null);
    const [isDragging, setIsDragging] = useState(false);
    const [showAnalytics, setShowAnalytics] = useState(false);
    const [showHeatmap, setShowHeatmap] = useState(false);

    // Stem separation (open-source HPSS or Demucs)
    const [isExtractingStems, setIsExtractingStems] = useState(false);
    const [stemsData, setStemsData] = useState<Record<string, string> | null>(null);
    const [stemsMeta, setStemsMeta] = useState<{ method?: string; note?: string } | null>(null);
    const [masterMeters, setMasterMeters] = useState<any | null>(null);
    const [masterMode, setMasterMode] = useState<string | null>(null);
    const [knobsDirty, setKnobsDirty] = useState(false);
    const [sessionMasters, setSessionMasters] = useState<
        { id: string; label: string; url: string; mode: string; meters: any | null }[]
    >([]);
    const [showStudioTour, setShowStudioTour] = useState(() => !hasSeenTour('studio'));

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
    // Track blob URLs for reliable revoke on unmount (avoid stale closure)
    const targetUrlRef = useRef<string | null>(null);
    const refUrlRef = useRef<string | null>(null);
    const masterUrlRef = useRef<string | null>(null);

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

    // Keep refs in sync so unmount cleanup can revoke the latest blob URLs
    useEffect(() => {
        targetUrlRef.current = targetUrl;
    }, [targetUrl]);
    useEffect(() => {
        refUrlRef.current = refUrl;
    }, [refUrl]);
    useEffect(() => {
        masterUrlRef.current = masterAudioUrl;
    }, [masterAudioUrl]);

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
            if (targetUrlRef.current) URL.revokeObjectURL(targetUrlRef.current);
            if (refUrlRef.current) URL.revokeObjectURL(refUrlRef.current);
            if (masterUrlRef.current) URL.revokeObjectURL(masterUrlRef.current);
        };
        // eslint-disable-next-line react-hooks/exhaustive-deps -- unmount-only
    }, []);

    // Standalone audio element for blind test
    const [blindTestAudioRef, setBlindTestAudioRef] = useState<HTMLAudioElement | null>(null);

    const setTargetFromFile = (file: File) => {
        const err = acceptAudioFile(file, 'mix');
        if (err) {
            alert(err);
            return;
        }
        setTargetUrl((prev) => {
            if (prev) URL.revokeObjectURL(prev);
            return URL.createObjectURL(file);
        });
        setTargetFile(file);
    };

    const setRefFromFile = (file: File) => {
        const err = acceptAudioFile(file, 'reference');
        if (err) {
            alert(err);
            return;
        }
        setRefUrl((prev) => {
            if (prev) URL.revokeObjectURL(prev);
            return URL.createObjectURL(file);
        });
        setRefFile(file);
    };

    const removeTargetFile = (e: React.MouseEvent) => {
        e.stopPropagation();
        setTargetFile(null);
        setTargetUrl((prev) => {
            if (prev) URL.revokeObjectURL(prev);
            return null;
        });
        if (targetInputRef.current) targetInputRef.current.value = "";
        if (playingPreview === 'target' && previewAudioRef.current) {
            previewAudioRef.current.pause();
            setPlayingPreview(null);
        }
    };

    const removeRefFile = (e: React.MouseEvent) => {
        e.stopPropagation();
        setRefFile(null);
        setRefUrl((prev) => {
            if (prev) URL.revokeObjectURL(prev);
            return null;
        });
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
            if (files[0]) setTargetFromFile(files[0]);
            if (files[1]) setRefFromFile(files[1]);
        }
    };

    const handleTargetSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (file) setTargetFromFile(file);
    };

    const handleRefSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (file) setRefFromFile(file);
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

            const response = await apiFetch('/api/oracle', {
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
                setOracleData(data.oracle);
                refreshMe();
            } else {
                throw new Error(data.error || 'Oracle Engine Failure');
            }
        } catch (err: any) {
            console.error(err);
            alert(err?.message || 'Oracle Engine Failure.');
        } finally {
            setIsOracleScanning(false);
        }
    };

    const handleMaster = async () => {
        if (!targetFile) return; // reference is optional (Pure mode)

        const targetErr = acceptAudioFile(targetFile, 'mix');
        if (targetErr) {
            alert(targetErr);
            return;
        }
        if (refFile) {
            const refErr = acceptAudioFile(refFile, 'reference');
            if (refErr) {
                alert(refErr);
                return;
            }
        }

        setPhase('processing');

        try {
            const formData = new FormData();
            formData.append('target', targetFile);
            if (refFile) {
                formData.append('reference', refFile);
                formData.append('ref_influence', refInfluence.toString());
            }
            formData.append('sub', knobs.sub.toString());
            formData.append('air', knobs.air.toString());
            formData.append('snap', knobs.snap.toString());
            formData.append('width', knobs.width.toString());
            formData.append('warmth', tone.warmth.toString());
            formData.append('presence', tone.presence.toString());
            formData.append('demud', tone.demud.toString());
            formData.append('mono_bass', monoBass ? 'true' : 'false');
            const lufs = resolvedLufs();
            if (lufs !== null && lufs !== undefined) formData.append('lufs_target', lufs.toString());
            formData.append('output_format', outputFormat);

            const response = await apiFetch('/api/master', {
                method: 'POST',
                body: formData
            });

            if (!response.ok) {
                const errorData = await response.json().catch(() => ({}));
                const detail = errorData.detail ?? errorData;
                throw new Error(formatMasterError(response.status, detail));
            }

            let metersParsed: any | null = null;
            const metersHeader = response.headers.get('X-Master-Meters');
            if (metersHeader) {
                try {
                    metersParsed = JSON.parse(metersHeader);
                } catch {
                    metersParsed = null;
                }
            }
            setMasterMeters(metersParsed);
            const modeHdr = response.headers.get('X-Master-Mode') || (refFile ? 'reference' : 'pure');
            setMasterMode(modeHdr);
            const blob = await response.blob();
            const url = URL.createObjectURL(blob);
            // Keep previous masters in session list (cap 5); don't revoke until replaced out of list
            setSessionMasters((prev) => {
                const profileLabel =
                    masterProfile === 'custom'
                        ? `CUSTOM ${customLufs}`
                        : masterProfile.toUpperCase();
                const entry = {
                    id: `${Date.now()}`,
                    label: `v${prev.length + 1} · ${profileLabel}${refFile ? ' · ref' : ' · pure'}`,
                    url,
                    mode: modeHdr,
                    meters: metersParsed,
                };
                const next = [...prev, entry].slice(-5);
                prev.forEach((p) => {
                    if (!next.find((n) => n.id === p.id)) URL.revokeObjectURL(p.url);
                });
                return next;
            });
            setMasterAudioUrl(url);
            setKnobsDirty(false);
            record.master(targetFile?.name || 'master', outputFormat);
            refreshMe();
            setPhase('tuning');
        } catch (err: any) {
            console.error(err);
            setPhase('dropzone');
            const msg = err?.message || 'Mastering Engine Failure. Check logs.';
            // Fetch network failures often have TypeError / Failed to fetch
            if (/failed to fetch|networkerror|load failed/i.test(msg)) {
                alert(
                    'Could not reach the mastering server. If the site was idle, wait ~30s for cold start and retry. ' +
                    'Also confirm you are signed in and your mix is under ' + MAX_AUDIO_UPLOAD_LABEL + '.'
                );
            } else {
                alert(msg);
            }
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
            const response = await apiFetch('/api/extract-stems', {
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
                setStemsData(data.stems);
                setStemsMeta({ method: data.method, note: data.note });
                refreshMe();
            } else {
                throw new Error(data.detail || 'Stem Engine Failure');
            }
        } catch (err: any) {
            console.error(err);
            alert(err?.message || 'Stem extraction failed.');
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

    const Knob = ({
        label,
        hint,
        value,
        onChange,
    }: {
        label: string;
        hint?: string;
        value: number;
        onChange?: (v: number) => void;
    }) => (
        <div className="flex flex-col items-center gap-2 w-full max-w-[7.5rem]">
            <div className="relative w-16 h-16 rounded-full bg-black border-2 border-cyan-900/40 shadow-[inset_0_0_10px_rgba(0,0,0,0.8)] flex items-center justify-center group">
                <div
                    className="w-1 h-3 bg-cyan-500 absolute top-1 origin-[50%_28px] rounded-full shadow-[0_0_5px_rgba(34,211,238,0.8)] transition-transform duration-150 group-hover:bg-white pointer-events-none"
                    style={{ transform: `rotate(${(value / 100) * 270 - 135}deg)` }}
                />
                <div className="text-cyan-400 font-mono text-xs tabular-nums pointer-events-none">{value}</div>
            </div>
            <input
                type="range"
                min={0}
                max={100}
                value={value}
                disabled={!onChange}
                onChange={(e) => onChange?.(Number(e.target.value))}
                className="w-full accent-cyan-500 disabled:opacity-40"
                aria-label={label}
            />
            <div className="flex flex-col items-center gap-0.5">
                <span className="font-mono text-[10px] text-ink-200 tracking-widest uppercase text-center leading-tight">
                    {label}
                </span>
                {hint && <span className="text-[10px] text-ink-700 text-center leading-tight">{hint}</span>}
            </div>
        </div>
    );

    const OptionSlider = ({ label, hint, value, min = 0, max = 100, suffix = '', onChange }:
        { label: string; hint?: string; value: number; min?: number; max?: number; suffix?: string; onChange: (v: number) => void }) => (
        <div className="flex flex-col gap-1.5">
            <div className="flex items-center justify-between">
                <span className="font-mono text-[10px] tracking-widest uppercase text-ink-200">{label}</span>
                <span className="font-mono text-[10px] text-cyan-400 tabular-nums">{value}{suffix}</span>
            </div>
            <input
                type="range" min={min} max={max} value={value}
                onChange={(e) => onChange(Number(e.target.value))}
                className="w-full accent-cyan-500"
            />
            {hint && <span className="font-mono text-[9px] text-ink-700">{hint}</span>}
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
                accent="var(--color-audio)"
                module="AUDIO MASTER CORE"
                title="Studio"
                desc="Reference-matched commercial masters — Pure mode needs only your mix; add a reference for Matchering."
                speedHint="~30s–3m"
            />
            <StepHint steps={["Drop your mix", "Optional reference", "Master & download"]} accent="var(--color-audio)" />
            {phase === 'dropzone' && (
                <CoachPrompt id="studio-drop-tip" accent="var(--color-audio)" title="Studio tip">
                    Start with an unmastered WAV/FLAC under 80 MB. Reference is optional — skip it for a Pure master.
                    Stay signed in; long reference matches can take 1–3 minutes on first cold start.
                </CoachPrompt>
            )}

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
                            className={`md:col-span-2 glass-obsidian sheen hud-corners rounded-2xl p-8 md:p-10 flex flex-col items-center justify-center border-dashed border-2 transition-all min-h-[320px] md:min-h-[400px] relative overflow-hidden group ${isDragging ? 'border-cyan-400 bg-cyan-900/20 shadow-[0_0_30px_rgba(34,211,238,0.3)]' : 'border-white/10 hover:border-cyan-500/40 cursor-default'}`}
                        >
                            <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,rgba(34,211,238,0.06)_0%,transparent_60%)] opacity-0 group-hover:opacity-100 transition-opacity z-0" />

                            <div className="w-20 h-20 rounded-full border-2 border-dashed border-white/15 flex items-center justify-center mb-6 group-hover:rotate-180 transition-transform duration-1000 ease-in-out">
                                <UploadCloud size={32} className="text-cyan-400" />
                            </div>
                            <h3 className="font-display text-2xl text-ink-50 mb-2 tracking-tight">Drop your tracks</h3>
                            <p className="font-mono text-ink-400 text-xs tracking-widest text-center max-w-sm mb-8 uppercase">
                                Drag in your mix and optional reference · WAV/FLAC preferred · max {MAX_AUDIO_UPLOAD_LABEL} each
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
                                            <span className={`font-mono text-[10px] tracking-widest uppercase ${refFile ? 'text-cyan-400' : 'text-ink-400'}`}>Reference track <span className="text-ink-700 normal-case">(optional)</span></span>
                                            <span className={`font-mono text-xs truncate ${refFile ? 'text-ink-50' : 'text-ink-700'}`}>
                                                {refFile ? refFile.name : 'Optional — skip for a Pure master'}
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

                            {/* Master profile (loudness target) */}
                            {targetFile && (
                                <div className="mt-6 flex flex-col items-center gap-2 relative z-10 w-full">
                                    <span className="font-mono text-[10px] tracking-[0.2em] uppercase text-ink-400">Master profile</span>
                                    <Segmented
                                        accent="var(--color-audio)"
                                        value={masterProfile}
                                        onChange={setMasterProfile}
                                        options={[
                                            { value: 'streaming', label: 'Streaming' },
                                            { value: 'club', label: 'Club' },
                                            { value: 'podcast', label: 'Podcast' },
                                            { value: 'custom', label: 'Custom' },
                                            { value: 'off', label: 'Off' },
                                        ]}
                                    />
                                    <span className="font-mono text-[9px] text-ink-700 tracking-wide">
                                        {masterProfile === 'streaming' && 'Spotify / Apple standard · −14 LUFS'}
                                        {masterProfile === 'club' && 'DJ-loud for club systems · −9 LUFS'}
                                        {masterProfile === 'podcast' && 'Speech-optimized · −16 LUFS'}
                                        {masterProfile === 'off' && 'No loudness normalization'}
                                        {masterProfile === 'custom' && `Target ${customLufs} LUFS`}
                                    </span>
                                    {masterProfile === 'custom' && (
                                        <input
                                            type="range" min={-20} max={-8} step={0.5} value={customLufs}
                                            onChange={(e) => setCustomLufs(Number(e.target.value))}
                                            className="w-48 accent-cyan-500"
                                        />
                                    )}
                                </div>
                            )}

                            <div className="mt-5 flex flex-col items-center gap-1.5 relative z-10 w-full">
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

                            {/* More options (tone bands, mono-bass, reference blend) */}
                            {targetFile && (
                                <div className="mt-5 w-full max-w-md relative z-10">
                                    <button
                                        onClick={() => setShowMoreOptions(v => !v)}
                                        className="mx-auto flex items-center gap-2 font-mono text-[10px] tracking-widest uppercase text-ink-400 hover:text-ink-50 transition-colors"
                                    >
                                        {showMoreOptions ? '− Fewer options' : '+ More options'}
                                    </button>
                                    {showMoreOptions && (
                                        <motion.div
                                            initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: 'auto' }}
                                            className="mt-4 flex flex-col gap-4 bg-black/30 border border-white/10 rounded-xl p-4"
                                        >
                                            {refFile && (
                                                <OptionSlider label="Reference influence" hint="how hard to chase the reference" value={refInfluence} min={0} max={100} onChange={setRefInfluence} suffix="%" />
                                            )}
                                            <OptionSlider label="Warmth" hint="low-mid body" value={tone.warmth} onChange={(v) => setTone({ ...tone, warmth: v })} />
                                            <OptionSlider label="Presence" hint="vocal cut-through" value={tone.presence} onChange={(v) => setTone({ ...tone, presence: v })} />
                                            <OptionSlider label="De-mud" hint="clears 300Hz congestion" value={tone.demud} onChange={(v) => setTone({ ...tone, demud: v })} />
                                            <label className="flex items-center justify-between cursor-pointer">
                                                <div>
                                                    <span className="font-mono text-[10px] tracking-widest uppercase text-ink-200">Mono bass</span>
                                                    <span className="block font-mono text-[9px] text-ink-700">phase-tight lows for clubs</span>
                                                </div>
                                                <button
                                                    onClick={() => setMonoBass(v => !v)}
                                                    className={`w-10 h-5 rounded-full transition-colors relative ${monoBass ? 'bg-cyan-500' : 'bg-white/10'}`}
                                                >
                                                    <span className={`absolute top-0.5 h-4 w-4 rounded-full bg-white transition-all ${monoBass ? 'left-5' : 'left-0.5'}`} />
                                                </button>
                                            </label>
                                        </motion.div>
                                    )}
                                </div>
                            )}

                            {targetFile && (
                                <motion.button
                                    initial={{ opacity: 0, y: 10 }}
                                    animate={{ opacity: 1, y: 0 }}
                                    onClick={handleMaster}
                                    className="mt-8 px-12 py-3 bg-cyan-500 hover:bg-cyan-400 text-ink-950 font-display font-medium tracking-wide rounded-full transition-colors z-10 w-full md:w-auto"
                                >
                                    {refFile ? 'Master it' : 'Master it (Pure mode)'}
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
                                            subMessage="DSP topology + optional AI polish. Measured ~7 seconds live."
                                            colorClass="blue"
                                            estimatedDurationMs={7000}
                                            speedLabel="~7s live"
                                        />
                                    </div>
                                )}

                                {targetFile && !oracleData && !isOracleScanning && (
                                    <Btn variant="accent" accent="var(--color-audio)" onClick={handleOracleScan} className="w-full shrink-0">
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
                                            accent="var(--color-audio)"
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

                                {/* Open-source stem split (HPSS or Demucs) */}
                                {targetFile && (
                                    <div className="mt-auto border-t border-white/10 pt-4 pb-2">
                                        <h3 className="font-mono text-[11px] tracking-widest text-ink-400 uppercase mb-3 flex items-center gap-2">
                                            <svg className="w-3 h-3 text-ink-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19.428 15.428a2 2 0 00-1.022-.547l-2.387-.477a6 6 0 00-3.86.517l-.318.158a6 6 0 01-3.86.517L6.05 15.21a2 2 0 00-1.806.547M8 4h8l-1 1v5.172a2 2 0 00.586 1.414l5 5c1.26 1.26.367 3.414-1.415 3.414H4.828c-1.782 0-2.674-2.154-1.414-3.414l5-5A2 2 0 009 10.172V5L8 4z" />
                                            </svg>
                                            Split into stems
                                        </h3>
                                        <p className="text-[10px] text-ink-400 mb-3 leading-relaxed">
                                            Free open-source path: scipy HPSS by default; Demucs if installed on the server.
                                        </p>

                                        {!isExtractingStems && !stemsData && (
                                            <Btn variant="ghost" onClick={handleExtractStems} className="w-full shrink-0">
                                                Bass / drums / vocals / other
                                            </Btn>
                                        )}

                                        {isExtractingStems && (
                                            <LoadingProgressBar
                                                active={isExtractingStems}
                                                message="Splitting the mix"
                                                subMessage="Open-source separation. Longer on full songs."
                                                colorClass="blue"
                                                estimatedDurationMs={8000}
                                                speedLabel="open source"
                                            />
                                        )}

                                        {stemsData && stemsMeta?.note && (
                                            <p className="font-mono text-[9px] text-ink-400 mb-2 leading-relaxed">{stemsMeta.note}</p>
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
                                        subMessage={
                                            refFile
                                                ? 'Reference match + EQ + limiter. Full songs often take 1–3 minutes. Keep this tab open.'
                                                : 'Pure master (DSP + limiter). Usually under a minute for short mixes.'
                                        }
                                        colorClass="blue"
                                        estimatedDurationMs={refFile ? 120000 : 45000}
                                        speedLabel={refFile ? '~1–3 min with reference' : '~30–60s pure'}
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
                        <Panel title="Result" sub="Preview, A/B test, and export" accent="var(--color-audio)">
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
                                        <div className="flex flex-wrap items-center gap-2 mb-1">
                                            <h3 className="font-display text-xl text-ink-50 font-medium tracking-tight">Your master</h3>
                                            {masterMode && (
                                                <span
                                                    className={`font-mono text-[9px] tracking-widest uppercase px-2 py-0.5 rounded-full border ${
                                                        masterMode === 'pure-fallback'
                                                            ? 'border-amber-500/40 text-amber-300 bg-amber-500/10'
                                                            : masterMode === 'reference'
                                                              ? 'border-cyan-500/40 text-cyan-300 bg-cyan-500/10'
                                                              : 'border-white/15 text-ink-300 bg-white/5'
                                                    }`}
                                                >
                                                    {masterMode === 'pure-fallback'
                                                        ? 'Pure fallback'
                                                        : masterMode === 'reference'
                                                          ? 'Reference match'
                                                          : 'Pure master'}
                                                </span>
                                            )}
                                        </div>
                                        {masterMode === 'pure-fallback' && (
                                            <p className="text-[11px] text-amber-200/90 mb-2 max-w-md leading-relaxed">
                                                Reference matching failed on the server (memory or similar files). Delivered Pure DSP instead — try a shorter commercial reference next time.
                                            </p>
                                        )}
                                        {masterMeters && (
                                            <div className="mt-2 flex flex-wrap gap-2 font-mono text-[10px] tracking-wide">
                                                <span className="px-2 py-0.5 rounded border border-white/10 text-ink-200">
                                                    LUFS {masterMeters.lufs_integrated ?? '—'}
                                                </span>
                                                <span className="px-2 py-0.5 rounded border border-white/10 text-ink-200">
                                                    TP {masterMeters.true_peak_db ?? '—'} dB
                                                </span>
                                                <span className="px-2 py-0.5 rounded border border-white/10 text-ink-200">
                                                    Crest {masterMeters.crest_factor_db ?? '—'} dB
                                                </span>
                                                {masterMeters.streaming_ready && (
                                                    <span className="px-2 py-0.5 rounded border border-emerald-500/40 text-emerald-400">
                                                        Streaming-ready band
                                                    </span>
                                                )}
                                            </div>
                                        )}
                                        <div className="flex items-center gap-2 font-mono text-xs text-ink-400 uppercase tracking-widest mt-1">
                                            <Shield size={12} className="text-cyan-400" />
                                            Profile target {resolvedLufs() ?? 'off'} · limiter −1.0 dBTP
                                        </div>
                                        {sessionMasters.length > 1 && (
                                            <div className="mt-3 flex flex-wrap gap-1.5">
                                                <span className="font-mono text-[9px] text-ink-500 tracking-widest uppercase self-center mr-1">
                                                    This session
                                                </span>
                                                {sessionMasters.map((m) => (
                                                    <button
                                                        key={m.id}
                                                        type="button"
                                                        onClick={() => {
                                                            setMasterAudioUrl(m.url);
                                                            setMasterMode(m.mode);
                                                            setIsPlaying(false);
                                                        }}
                                                        className={`font-mono text-[9px] tracking-wide px-2 py-1 rounded-full border transition-colors ${
                                                            masterAudioUrl === m.url
                                                                ? 'border-cyan-500/50 text-cyan-300 bg-cyan-500/10'
                                                                : 'border-white/10 text-ink-400 hover:border-white/25'
                                                        }`}
                                                    >
                                                        {m.label}
                                                    </button>
                                                ))}
                                            </div>
                                        )}
                                    </div>
                                </div>

                                <div className="flex items-center gap-4 bg-white/5 p-2 pr-6 rounded-full border border-white/10">
                                    <button
                                        type="button"
                                        onClick={() => {
                                            if (!masterAudioUrl || !targetUrl) return;
                                            setIsSovereignMaster(!isSovereignMaster);
                                            // Toggle preview between master and original
                                            if (isSovereignMaster && audioRef.current && targetUrl) {
                                                audioRef.current.src = targetUrl;
                                            } else if (audioRef.current && masterAudioUrl) {
                                                audioRef.current.src = masterAudioUrl;
                                            }
                                            setIsPlaying(false);
                                        }}
                                        className={`w-12 h-6 rounded-full p-1 transition-colors ${isSovereignMaster ? 'bg-cyan-500' : 'bg-white/10'}`}
                                    >
                                        <motion.div
                                            className="bg-white w-4 h-4 rounded-full"
                                            animate={{ x: isSovereignMaster ? 24 : 0 }}
                                        />
                                    </button>
                                    <div className="flex flex-col">
                                        <span className="font-display text-xs text-ink-50 font-medium -mb-1">
                                            {isSovereignMaster ? 'Hearing master' : 'Hearing original'}
                                        </span>
                                        <span className="font-mono text-[9px] text-ink-400 tracking-widest uppercase">
                                            Toggle A/B preview
                                        </span>
                                    </div>
                                </div>
                            </div>
                        </Panel>

                        {/* Fine-Tuning Console */}
                        <Panel title="Master controls" sub="Adjust then remaster — knobs apply on the next run" accent="var(--color-audio)" className="relative overflow-hidden">
                            <div className="absolute top-0 right-0 p-8 opacity-5 pointer-events-none">
                                <Settings2 size={200} className="text-cyan-400" />
                            </div>

                            <div className="grid grid-cols-2 md:grid-cols-4 gap-6 md:gap-8 relative z-10 w-full max-w-3xl mx-auto mb-6">
                                <Knob
                                    label="Sub"
                                    hint="low-end weight"
                                    value={knobs.sub}
                                    onChange={(v) => {
                                        setKnobs({ ...knobs, sub: v });
                                        setKnobsDirty(true);
                                    }}
                                />
                                <Knob
                                    label="Air"
                                    hint="top-end shine"
                                    value={knobs.air}
                                    onChange={(v) => {
                                        setKnobs({ ...knobs, air: v });
                                        setKnobsDirty(true);
                                    }}
                                />
                                <Knob
                                    label="Snap"
                                    hint="punch"
                                    value={knobs.snap}
                                    onChange={(v) => {
                                        setKnobs({ ...knobs, snap: v });
                                        setKnobsDirty(true);
                                    }}
                                />
                                <Knob
                                    label="Width"
                                    hint="stereo space"
                                    value={knobs.width}
                                    onChange={(v) => {
                                        setKnobs({ ...knobs, width: v });
                                        setKnobsDirty(true);
                                    }}
                                />
                            </div>

                            <div className="flex justify-center mt-8 gap-3 flex-wrap relative z-10">
                                {knobsDirty && (
                                    <Btn variant="accent" accent="var(--color-audio)" size="sm" onClick={handleMaster}>
                                        Apply & remaster
                                    </Btn>
                                )}
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
                                        setTargetUrl((prev) => {
                                            if (prev) URL.revokeObjectURL(prev);
                                            return null;
                                        });
                                        setRefFile(null);
                                        setRefUrl((prev) => {
                                            if (prev) URL.revokeObjectURL(prev);
                                            return null;
                                        });
                                        setMasterAudioUrl(null);
                                        setMasterMode(null);
                                        setMasterMeters(null);
                                        setIsPlaying(false);
                                        setIsOracleApplied(false);
                                        setOracleData(null);
                                        setShowAnalytics(false);
                                        setStemsData(null);
                                        setKnobsDirty(false);
                                        setSessionMasters((prev) => {
                                            prev.forEach((p) => URL.revokeObjectURL(p.url));
                                            return [];
                                        });
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
                                                <span className="text-cyan-400 font-medium block mb-1">Measured meters</span>
                                                {masterMeters ? (
                                                    <>
                                                        Integrated LUFS: <strong className="text-ink-50">{masterMeters.lufs_integrated ?? 'n/a'}</strong>
                                                        {' · '}True peak: <strong className="text-ink-50">{masterMeters.true_peak_db ?? 'n/a'} dB</strong>
                                                        {' · '}Crest: <strong className="text-ink-50">{masterMeters.crest_factor_db ?? 'n/a'} dB</strong>
                                                        {masterMeters.lufs_method && (
                                                            <span className="block text-ink-500 mt-1">Method: {masterMeters.lufs_method}</span>
                                                        )}
                                                    </>
                                                ) : (
                                                    'Meters unavailable for this run — download and check in your DAW.'
                                                )}
                                            </p>
                                            <p className="border-l-2 border-cyan-500/40 pl-2">
                                                <span className="text-cyan-400 font-medium block mb-1">Tone knobs used</span>
                                                Sub {knobs.sub} · Air {knobs.air} · Snap {knobs.snap} · Width {knobs.width}
                                                {knobs.air !== 50 && (
                                                    <span className="block text-ink-500 mt-1">
                                                        High-shelf air ≈ {((knobs.air - 50) / 10).toFixed(1)} dB @ 10 kHz
                                                    </span>
                                                )}
                                            </p>
                                            <p className="border-l-2 border-white/20 pl-2">
                                                <span className="text-ink-300 font-medium block mb-1">Mode</span>
                                                {masterMode === 'reference'
                                                    ? 'Reference Matchering + Pedalboard chain + true-peak limiter.'
                                                    : masterMode === 'pure-fallback'
                                                      ? 'Reference match failed; Pure DSP chain + limiter only.'
                                                      : 'Pure master — DSP + limiter (no reference match).'}
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

            <Walkthrough
                tourId="studio"
                open={showStudioTour}
                accent="var(--color-audio)"
                onClose={() => setShowStudioTour(false)}
                primaryLabel="Open Studio"
                steps={[
                    {
                        title: 'Drop your mix',
                        body: 'Upload an unmastered WAV or FLAC (under 80 MB). That’s enough for a Pure commercial-style master.',
                        bullets: ['Stay signed in', 'Stable Wi‑Fi helps for larger files'],
                    },
                    {
                        title: 'Reference is optional',
                        body: 'Add a commercial track in the same genre for Matchering. If the server can’t match, you’ll still get a Pure master.',
                        bullets: ['Don’t upload the same file twice', 'Shorter refs process faster'],
                    },
                    {
                        title: 'Pick a loudness profile',
                        body: 'Streaming (−14 LUFS), Club, Podcast, or Off. Nudge Sub/Air/Snap/Width, then Master.',
                        bullets: ['After mastering, change knobs and hit Apply & remaster', 'Use Blind test to A/B honestly'],
                    },
                ]}
            />

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
