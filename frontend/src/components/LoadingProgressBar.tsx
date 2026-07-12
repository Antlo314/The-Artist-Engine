import { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';

interface LoadingProgressBarProps {
    message: string;
    subMessage?: string;
    active: boolean;
    colorClass?: string;
    /** Live-measured typical duration — drives the progress curve + ETA badge. */
    estimatedDurationMs?: number;
    /** Optional speed chip, e.g. "~8s live avg" — pinpoints speed as the asset. */
    speedLabel?: string;
}

export default function LoadingProgressBar({
    message,
    subMessage,
    active,
    colorClass = 'violet',
    estimatedDurationMs = 8000,
    speedLabel,
}: LoadingProgressBarProps) {
    const [progress, setProgress] = useState(0);
    const [elapsedMs, setElapsedMs] = useState(0);

    useEffect(() => {
        let startTime: number;
        let animationFrameId: number;

        if (active) {
            setProgress(0);
            setElapsedMs(0);
            startTime = Date.now();

            const animateProgress = () => {
                const elapsed = Date.now() - startTime;
                setElapsedMs(elapsed);

                let currentProgress = 0;
                if (elapsed < estimatedDurationMs * 0.5) {
                    currentProgress = (elapsed / (estimatedDurationMs * 0.5)) * 60;
                } else if (elapsed < estimatedDurationMs) {
                    const remainingRatio = (elapsed - estimatedDurationMs * 0.5) / (estimatedDurationMs * 0.5);
                    currentProgress = 60 + (remainingRatio * 30);
                } else {
                    const overtimeRatio = Math.min((elapsed - estimatedDurationMs) / (estimatedDurationMs * 2), 1);
                    currentProgress = 90 + (overtimeRatio * 8);
                }

                setProgress(currentProgress);
                animationFrameId = requestAnimationFrame(animateProgress);
            };

            animationFrameId = requestAnimationFrame(animateProgress);
        } else {
            setProgress(100);
        }

        return () => cancelAnimationFrame(animationFrameId);
    }, [active, estimatedDurationMs]);

    const etaSec = Math.max(0, Math.ceil((estimatedDurationMs - elapsedMs) / 1000));
    const elapsedSec = (elapsedMs / 1000).toFixed(1);
    const targetSec = Math.round(estimatedDurationMs / 1000);

    // Tailwind-safe solid colors (dynamic class names don't purge well).
    const accent =
        colorClass === 'orange' ? '#fb923c'
        : colorClass === 'blue' || colorClass === 'cyan' ? '#22d3ee'
        : colorClass === 'purple' || colorClass === 'violet' ? '#a78bfa'
        : colorClass === 'red' || colorClass === 'ember' ? '#ef4444'
        : '#a78bfa';

    return (
        <AnimatePresence>
            {active && (
                <motion.div
                    initial={{ opacity: 0, height: 0, y: -6 }}
                    animate={{ opacity: 1, height: 'auto', y: 0 }}
                    exit={{ opacity: 0, height: 0, y: -6 }}
                    transition={{ duration: 0.28, ease: [0.22, 1, 0.36, 1] }}
                    className="w-full mt-4 flex flex-col items-center justify-center overflow-hidden"
                >
                    <div className="w-full max-w-md glass-obsidian border border-white/10 rounded-xl p-4">
                        <div className="flex justify-between items-end mb-2 gap-3">
                            <span
                                className="font-mono text-xs tracking-widest uppercase font-bold animate-pulse"
                                style={{ color: accent }}
                            >
                                {message}
                            </span>
                            <div className="flex items-center gap-2 shrink-0">
                                {(speedLabel || targetSec > 0) && (
                                    <span
                                        className="font-mono text-[9px] tracking-widest uppercase px-2 py-0.5 rounded-full border"
                                        style={{
                                            color: accent,
                                            borderColor: `${accent}55`,
                                            backgroundColor: `${accent}14`,
                                        }}
                                    >
                                        {speedLabel || `~${targetSec}s live`}
                                    </span>
                                )}
                                <span className="font-mono text-[10px] text-ink-400 tabular-nums">
                                    {Math.floor(progress)}%
                                </span>
                            </div>
                        </div>

                        <div className="w-full h-1.5 bg-black/60 rounded-full overflow-hidden border border-white/10">
                            <motion.div
                                className="h-full rounded-full"
                                style={{
                                    backgroundColor: accent,
                                    boxShadow: `0 0 12px ${accent}`,
                                    width: `${progress}%`,
                                }}
                                transition={{ ease: 'linear', duration: 0.08 }}
                            />
                        </div>

                        <div className="mt-3 flex items-center justify-between gap-3 font-mono text-[9px] tracking-widest uppercase text-ink-400">
                            <span className="tabular-nums">{elapsedSec}s elapsed</span>
                            <span className="tabular-nums" style={{ color: accent }}>
                                {etaSec > 0 ? `~${etaSec}s left` : 'finishing…'}
                            </span>
                        </div>

                        {subMessage && (
                            <motion.p
                                initial={{ opacity: 0 }}
                                animate={{ opacity: 1 }}
                                transition={{ delay: 0.35 }}
                                className="font-mono text-[9px] text-ink-400 mt-2 tracking-wide text-center leading-relaxed normal-case"
                            >
                                {subMessage}
                            </motion.p>
                        )}
                    </div>
                </motion.div>
            )}
        </AnimatePresence>
    );
}
