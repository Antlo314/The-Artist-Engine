import React, { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';

interface LoadingProgressBarProps {
    message: string;
    subMessage?: string;
    active: boolean;
    colorClass?: string;
    estimatedDurationMs?: number;
}

export default function LoadingProgressBar({
    message,
    subMessage,
    active,
    colorClass = 'violet',
    estimatedDurationMs = 30000 // Default 30s to account for Render cold starts
}: LoadingProgressBarProps) {
    const [progress, setProgress] = useState(0);

    useEffect(() => {
        let startTime: number;
        let animationFrameId: number;

        if (active) {
            setProgress(0);
            startTime = Date.now();

            const animateProgress = () => {
                const elapsed = Date.now() - startTime;

                // Slow down progress as it approaches 95% to allow for variable network times
                // It will quickly get to 80%, then slowly crawl to 95% without hitting 100% until finished
                let currentProgress = 0;

                if (elapsed < estimatedDurationMs * 0.5) {
                    // First 50% of time: linearly go to 60% progress
                    currentProgress = (elapsed / (estimatedDurationMs * 0.5)) * 60;
                } else if (elapsed < estimatedDurationMs) {
                    // Second 50% of time: go from 60% to 90%
                    const remainingRatio = (elapsed - estimatedDurationMs * 0.5) / (estimatedDurationMs * 0.5);
                    currentProgress = 60 + (remainingRatio * 30);
                } else {
                    // Past estimated time: slowly asymptotic towards 98%
                    const overtimeRatio = Math.min((elapsed - estimatedDurationMs) / (estimatedDurationMs * 2), 1); // Cap at 2x time
                    currentProgress = 90 + (overtimeRatio * 8);
                }

                setProgress(currentProgress);
                animationFrameId = requestAnimationFrame(animateProgress);
            };

            animationFrameId = requestAnimationFrame(animateProgress);
        } else {
            // When not active anymore (completed), instantly jump to 100% before disappearing
            setProgress(100);
        }

        return () => cancelAnimationFrame(animationFrameId);
    }, [active, estimatedDurationMs]);

    return (
        <AnimatePresence>
            {active && (
                <motion.div
                    initial={{ opacity: 0, height: 0, y: -10 }}
                    animate={{ opacity: 1, height: 'auto', y: 0 }}
                    exit={{ opacity: 0, height: 0, y: -10 }}
                    className="w-full mt-4 flex flex-col items-center justify-center overflow-hidden"
                >
                    <div className="w-full max-w-md bg-black/60 border border-white/5 rounded-lg p-4 custom-scrollbar">
                        <div className="flex justify-between items-end mb-2">
                            <span className={`font-mono text-xs tracking-widest uppercase font-bold text-${colorClass}-400 animate-pulse`}>
                                {message}
                            </span>
                            <span className="font-mono text-[10px] text-gray-500">
                                {Math.floor(progress)}%
                            </span>
                        </div>

                        {/* The Progress Bar Track */}
                        <div className={`w-full h-1.5 bg-black rounded-full overflow-hidden border border-${colorClass}-500/20`}>
                            {/* The Progress Indicator */}
                            <motion.div
                                className={`h-full bg-${colorClass}-500 shadow-[0_0_10px_currentColor]`}
                                initial={{ width: "0%" }}
                                animate={{ width: `${progress}%` }}
                                transition={{ ease: "linear", duration: 0.1 }}
                            />
                        </div>

                        {subMessage && (
                            <motion.p
                                initial={{ opacity: 0 }}
                                animate={{ opacity: 1 }}
                                transition={{ delay: 1.5 }} // wait a bit before showing submessage
                                className="font-mono text-[9px] text-gray-500 mt-3 tracking-widest uppercase text-center"
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
