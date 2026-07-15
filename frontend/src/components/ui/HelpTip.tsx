import { useEffect, useId, useRef, useState } from 'react';
import { HelpCircle } from 'lucide-react';

type Props = {
    text: string;
    label?: string;
};

/** Lightweight field-level ? popover (no external tooltip lib). */
export default function HelpTip({ text, label = 'More info' }: Props) {
    const [open, setOpen] = useState(false);
    const id = useId();
    const ref = useRef<HTMLDivElement>(null);

    useEffect(() => {
        if (!open) return;
        const onDoc = (e: MouseEvent) => {
            if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
        };
        const onKey = (e: KeyboardEvent) => {
            if (e.key === 'Escape') setOpen(false);
        };
        document.addEventListener('mousedown', onDoc);
        document.addEventListener('keydown', onKey);
        return () => {
            document.removeEventListener('mousedown', onDoc);
            document.removeEventListener('keydown', onKey);
        };
    }, [open]);

    return (
        <div className="relative inline-flex" ref={ref}>
            <button
                type="button"
                aria-label={label}
                aria-expanded={open}
                aria-controls={id}
                onClick={() => setOpen((v) => !v)}
                className="w-5 h-5 rounded-full border border-white/15 text-ink-500 hover:text-ink-200 hover:border-white/30 flex items-center justify-center"
            >
                <HelpCircle size={12} />
            </button>
            {open && (
                <div
                    id={id}
                    role="tooltip"
                    className="absolute z-40 left-1/2 -translate-x-1/2 bottom-full mb-2 w-56 max-w-[70vw] rounded-lg border border-white/10 bg-ink-900/95 backdrop-blur-md p-2.5 shadow-xl text-[11px] text-ink-200 leading-relaxed font-mono"
                >
                    {text}
                    <div className="absolute left-1/2 -translate-x-1/2 top-full w-2 h-2 rotate-45 bg-ink-900 border-r border-b border-white/10 -mt-1" />
                </div>
            )}
        </div>
    );
}
