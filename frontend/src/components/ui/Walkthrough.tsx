import { useEffect, useState } from 'react';
import { createPortal } from 'react-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { X, ChevronRight, ChevronLeft } from 'lucide-react';
import { markTourSeen, type TourId } from '../../lib/onboarding';
import { Btn } from './Shell';

export type WalkthroughStep = {
    title: string;
    body: string;
    bullets?: string[];
};

type Props = {
    tourId: TourId;
    open: boolean;
    steps: WalkthroughStep[];
    accent?: string;
    onClose: () => void;
    /** Called when user finishes or skips — always marks seen if markOnClose */
    markOnClose?: boolean;
    primaryLabel?: string;
    onPrimary?: () => void;
};

export default function Walkthrough({
    tourId,
    open,
    steps,
    accent = 'var(--color-ember-500)',
    onClose,
    markOnClose = true,
    primaryLabel,
    onPrimary,
}: Props) {
    const [step, setStep] = useState(0);
    const reduceMotion =
        typeof window !== 'undefined' &&
        window.matchMedia('(prefers-reduced-motion: reduce)').matches;

    useEffect(() => {
        if (open) setStep(0);
    }, [open, tourId]);

    const finish = (runPrimary?: boolean) => {
        if (markOnClose) markTourSeen(tourId);
        if (runPrimary && onPrimary) onPrimary();
        onClose();
    };

    if (typeof document === 'undefined') return null;

    const current = steps[step];
    const isLast = step >= steps.length - 1;

    return createPortal(
        <AnimatePresence>
            {open && current && (
                <motion.div
                    className="fixed inset-0 z-[80] flex items-end sm:items-center justify-center p-3 sm:p-6"
                    initial={reduceMotion ? false : { opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={reduceMotion ? undefined : { opacity: 0 }}
                >
                    <button
                        type="button"
                        aria-label="Close walkthrough"
                        className="absolute inset-0 bg-ink-950/80 backdrop-blur-sm"
                        onClick={() => finish(false)}
                    />
                    <motion.div
                        role="dialog"
                        aria-modal="true"
                        aria-labelledby={`walkthrough-${tourId}-title`}
                        className="relative w-full max-w-md glass-obsidian sheen hud-corners rounded-2xl border border-white/10 p-5 sm:p-6 shadow-2xl"
                        initial={reduceMotion ? false : { opacity: 0, y: 24, scale: 0.97 }}
                        animate={{ opacity: 1, y: 0, scale: 1 }}
                        exit={reduceMotion ? undefined : { opacity: 0, y: 12 }}
                        transition={{ type: 'spring', stiffness: 280, damping: 28 }}
                    >
                        <div className="flex items-start justify-between gap-3 mb-4">
                            <div>
                                <p
                                    className="font-mono text-[9px] tracking-[0.25em] uppercase mb-1"
                                    style={{ color: accent }}
                                >
                                    Quick start · {step + 1}/{steps.length}
                                </p>
                                <h2
                                    id={`walkthrough-${tourId}-title`}
                                    className="font-display text-xl text-ink-50 tracking-tight"
                                >
                                    {current.title}
                                </h2>
                            </div>
                            <button
                                type="button"
                                onClick={() => finish(false)}
                                className="w-9 h-9 rounded-lg border border-white/10 flex items-center justify-center text-ink-400 hover:text-ink-50 hover:bg-white/5"
                            >
                                <X size={16} />
                            </button>
                        </div>

                        <p className="text-sm text-ink-200 leading-relaxed mb-3">{current.body}</p>
                        {current.bullets && current.bullets.length > 0 && (
                            <ul className="space-y-1.5 mb-5">
                                {current.bullets.map((b) => (
                                    <li
                                        key={b}
                                        className="flex gap-2 text-xs text-ink-300 font-mono leading-relaxed"
                                    >
                                        <span style={{ color: accent }} className="shrink-0">
                                            →
                                        </span>
                                        <span>{b}</span>
                                    </li>
                                ))}
                            </ul>
                        )}

                        <div className="flex items-center gap-1.5 mb-5">
                            {steps.map((_, i) => (
                                <div
                                    key={i}
                                    className="h-1 flex-1 rounded-full transition-colors"
                                    style={{
                                        backgroundColor:
                                            i <= step ? accent : 'rgba(255,255,255,0.1)',
                                    }}
                                />
                            ))}
                        </div>

                        <div className="flex flex-wrap items-center justify-between gap-2">
                            <button
                                type="button"
                                className="font-mono text-[10px] tracking-widest uppercase text-ink-500 hover:text-ink-300"
                                onClick={() => finish(false)}
                            >
                                Don&apos;t show again
                            </button>
                            <div className="flex items-center gap-2">
                                {step > 0 && (
                                    <Btn variant="ghost" size="sm" onClick={() => setStep((s) => s - 1)}>
                                        <ChevronLeft size={14} className="mr-1" /> Back
                                    </Btn>
                                )}
                                {!isLast ? (
                                    <Btn variant="accent" size="sm" accent={accent} onClick={() => setStep((s) => s + 1)}>
                                        Next <ChevronRight size={14} className="ml-1" />
                                    </Btn>
                                ) : (
                                    <Btn variant="accent" size="sm" accent={accent} onClick={() => finish(true)}>
                                        {primaryLabel || 'Got it'}
                                    </Btn>
                                )}
                            </div>
                        </div>
                    </motion.div>
                </motion.div>
            )}
        </AnimatePresence>,
        document.body
    );
}
