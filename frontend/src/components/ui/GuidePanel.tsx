import { useEffect, useState } from 'react';
import { createPortal } from 'react-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { X, BookOpen, Lightbulb, ChevronDown, RotateCcw } from 'lucide-react';
import { getGuide } from '../../lib/guides';

type Props = {
    viewId: string;
    open: boolean;
    onClose: () => void;
    /** Optional: replay the first-visit tour for this area */
    onReplayTour?: () => void;
};

/**
 * "How this works" — the plain-language help tab available on every screen.
 * Desktop: right slide-over. Mobile: bottom sheet.
 */
export default function GuidePanel({ viewId, open, onClose, onReplayTour }: Props) {
    const guide = getGuide(viewId);
    const [openFaq, setOpenFaq] = useState<number | null>(null);
    const reduceMotion =
        typeof window !== 'undefined' &&
        window.matchMedia('(prefers-reduced-motion: reduce)').matches;

    useEffect(() => {
        setOpenFaq(null);
    }, [viewId, open]);

    useEffect(() => {
        if (!open) return;
        const onKey = (e: KeyboardEvent) => {
            if (e.key === 'Escape') onClose();
        };
        document.addEventListener('keydown', onKey);
        return () => document.removeEventListener('keydown', onKey);
    }, [open, onClose]);

    if (typeof document === 'undefined' || !guide) return null;
    const accent = guide.accent;

    return createPortal(
        <AnimatePresence>
            {open && (
                <motion.div
                    className="fixed inset-0 z-[90]"
                    initial={reduceMotion ? false : { opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={reduceMotion ? undefined : { opacity: 0 }}
                >
                    <button
                        type="button"
                        aria-label="Close guide"
                        className="absolute inset-0 bg-ink-950/70 backdrop-blur-sm"
                        onClick={onClose}
                    />
                    <motion.aside
                        role="dialog"
                        aria-modal="true"
                        aria-label={`Guide: ${guide.title}`}
                        className="absolute inset-x-0 bottom-0 max-h-[86dvh] rounded-t-2xl md:inset-x-auto md:right-0 md:top-0 md:bottom-0 md:max-h-none md:w-[400px] md:rounded-none glass-obsidian border-t md:border-t-0 md:border-l border-white/10 flex flex-col overflow-hidden"
                        initial={reduceMotion ? false : { y: '100%' }}
                        animate={{ y: 0 }}
                        exit={reduceMotion ? undefined : { y: '100%' }}
                        transition={{ type: 'spring', stiffness: 320, damping: 34 }}
                        style={{ paddingBottom: 'env(safe-area-inset-bottom, 0px)' }}
                    >
                        {/* Header */}
                        <div className="shrink-0 px-5 pt-4 pb-4 border-b border-white/10 flex items-start justify-between gap-3">
                            <div className="min-w-0">
                                <p
                                    className="flex items-center gap-1.5 font-mono text-[10px] tracking-[0.25em] uppercase mb-1"
                                    style={{ color: accent }}
                                >
                                    <BookOpen size={12} /> How this works
                                </p>
                                <h2 className="font-display text-xl text-ink-50 tracking-tight">{guide.title}</h2>
                                <p className="text-xs text-ink-400 mt-0.5 leading-snug">{guide.tagline}</p>
                            </div>
                            <button
                                type="button"
                                onClick={onClose}
                                aria-label="Close"
                                className="w-9 h-9 rounded-lg border border-white/10 flex items-center justify-center text-ink-400 hover:text-ink-50 hover:bg-white/5 shrink-0"
                            >
                                <X size={16} />
                            </button>
                        </div>

                        {/* Body */}
                        <div className="flex-1 overflow-y-auto custom-scrollbar px-5 py-5 space-y-6">
                            {/* What this does */}
                            <section>
                                <h3 className="text-sm font-medium text-ink-50 mb-1.5">What this does</h3>
                                <p className="text-[13px] text-ink-200 leading-relaxed">{guide.what}</p>
                            </section>

                            {/* Steps */}
                            {guide.steps.length > 0 && (
                                <section>
                                    <h3 className="text-sm font-medium text-ink-50 mb-2.5">Step by step</h3>
                                    <ol className="space-y-3">
                                        {guide.steps.map((s, i) => (
                                            <li key={i} className="flex gap-3">
                                                <span
                                                    className="shrink-0 w-6 h-6 rounded-full border flex items-center justify-center font-display text-xs"
                                                    style={{ color: accent, borderColor: accent, opacity: 0.95 }}
                                                >
                                                    {i + 1}
                                                </span>
                                                <div className="min-w-0">
                                                    <p className="text-[13px] text-ink-50 font-medium leading-snug">{s.title}</p>
                                                    <p className="text-[12px] text-ink-300 leading-relaxed mt-0.5">{s.detail}</p>
                                                </div>
                                            </li>
                                        ))}
                                    </ol>
                                </section>
                            )}

                            {/* Tips */}
                            {guide.tips.length > 0 && (
                                <section>
                                    <h3 className="flex items-center gap-1.5 text-sm font-medium text-ink-50 mb-2">
                                        <Lightbulb size={14} style={{ color: accent }} /> Good to know
                                    </h3>
                                    <ul className="space-y-1.5">
                                        {guide.tips.map((t, i) => (
                                            <li key={i} className="flex gap-2 text-[12px] text-ink-300 leading-relaxed">
                                                <span className="shrink-0 mt-[7px] h-1 w-1 rounded-full" style={{ backgroundColor: accent }} />
                                                <span>{t}</span>
                                            </li>
                                        ))}
                                    </ul>
                                </section>
                            )}

                            {/* FAQ */}
                            {guide.faq.length > 0 && (
                                <section>
                                    <h3 className="text-sm font-medium text-ink-50 mb-2">Common questions</h3>
                                    <div className="space-y-1.5">
                                        {guide.faq.map((f, i) => {
                                            const isOpen = openFaq === i;
                                            return (
                                                <div key={i} className="rounded-lg border border-white/10 bg-white/[0.03]">
                                                    <button
                                                        type="button"
                                                        onClick={() => setOpenFaq(isOpen ? null : i)}
                                                        aria-expanded={isOpen}
                                                        className="w-full flex items-center justify-between gap-2 px-3 py-2.5 text-left"
                                                    >
                                                        <span className="text-[12.5px] text-ink-50 font-medium leading-snug">{f.q}</span>
                                                        <ChevronDown
                                                            size={14}
                                                            className={`shrink-0 text-ink-400 transition-transform ${isOpen ? 'rotate-180' : ''}`}
                                                        />
                                                    </button>
                                                    {isOpen && (
                                                        <p className="px-3 pb-3 text-[12px] text-ink-300 leading-relaxed">{f.a}</p>
                                                    )}
                                                </div>
                                            );
                                        })}
                                    </div>
                                </section>
                            )}
                        </div>

                        {/* Footer */}
                        {onReplayTour && (
                            <div className="shrink-0 px-5 py-3 border-t border-white/10">
                                <button
                                    type="button"
                                    onClick={() => {
                                        onClose();
                                        onReplayTour();
                                    }}
                                    className="inline-flex items-center gap-2 text-[12px] text-ink-300 hover:text-ink-50 transition-colors"
                                >
                                    <RotateCcw size={13} /> Replay the intro tour
                                </button>
                            </div>
                        )}
                    </motion.aside>
                </motion.div>
            )}
        </AnimatePresence>,
        document.body
    );
}
