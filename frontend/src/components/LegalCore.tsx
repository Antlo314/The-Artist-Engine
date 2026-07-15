import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import ZionSentinel from './ZionSentinel';
import TheCodex from './TheCodex';
import RecoupmentSandbox from './RecoupmentSandbox';
import SplitSheetGenerator from './SplitSheetGenerator';
import { PageHeader, Segmented, StepHint, Btn } from './ui/Shell';
import Walkthrough from './ui/Walkthrough';
import CoachPrompt from './ui/CoachPrompt';
import { hasSeenTour } from '../lib/onboarding';

const LEGAL_ACCENT = 'var(--color-zion)';

type LegalTab = 'zion' | 'codex' | 'recoupment' | 'splits';

export default function LegalCore() {
    const [activeTab, setActiveTab] = useState<LegalTab>('zion');
    const [codexQuery, setCodexQuery] = useState('');
    const [showLegalTour, setShowLegalTour] = useState(() => !hasSeenTour('legal'));
    const [journeyHint, setJourneyHint] = useState(false);

    const openCodexTerm = (term: string) => {
        setCodexQuery(term);
        setActiveTab('codex');
    };

    return (
        <div className="h-full flex flex-col space-y-4 md:space-y-6">
            <PageHeader
                view="legal"
                accent={LEGAL_ACCENT}
                module="ZION LEGAL"
                title="Legal"
                desc="Contract scans in seconds — predatory clauses in plain language. Not legal advice."
                speedHint="~3s"
            />
            <StepHint
                steps={['Scan a deal', 'Look up terms', 'Model the money', 'Paper splits']}
                accent={LEGAL_ACCENT}
            />
            <div className="rounded-lg border border-amber-500/30 bg-amber-500/10 px-3 py-2 text-[11px] text-ink-200 leading-relaxed">
                Not legal advice and not an attorney–client relationship. Free rule linter + AI scan are educational —
                have a qualified entertainment lawyer review any deal before you sign.
            </div>
            <CoachPrompt id="legal-flow-tip" accent={LEGAL_ACCENT} title="Legal tip">
                Paste a contract or offer into Scanner first. Tap any red-flag term to open it in the Codex. Then model
                recoupment or generate a split sheet.
            </CoachPrompt>

            {journeyHint && activeTab === 'zion' && (
                <div className="flex flex-wrap items-center justify-between gap-2 rounded-xl border border-violet-500/25 bg-violet-500/10 px-3 py-2.5">
                    <p className="text-xs text-ink-200">Scan complete — next: model the economics or look up a term.</p>
                    <div className="flex gap-2">
                        <Btn variant="ghost" size="sm" onClick={() => setActiveTab('recoupment')}>
                            Open Recoup
                        </Btn>
                        <Btn variant="ghost" size="sm" onClick={() => setActiveTab('codex')}>
                            Open Codex
                        </Btn>
                    </div>
                </div>
            )}

            <div className="flex flex-col flex-1 min-h-0 space-y-4 md:space-y-6">
                <Segmented
                    options={[
                        { value: 'zion' as LegalTab, label: 'Scanner' },
                        { value: 'codex' as LegalTab, label: 'Codex' },
                        { value: 'recoupment' as LegalTab, label: 'Recoup' },
                        { value: 'splits' as LegalTab, label: 'Splits' },
                    ]}
                    value={activeTab}
                    onChange={setActiveTab}
                    accent={LEGAL_ACCENT}
                />

                <div className="flex-1 min-h-0">
                    <AnimatePresence mode="wait">
                        <motion.div
                            key={activeTab}
                            initial={{ opacity: 0, x: 20 }}
                            animate={{ opacity: 1, x: 0 }}
                            exit={{ opacity: 0, x: -20 }}
                            transition={{ duration: 0.22, ease: [0.22, 1, 0.36, 1] }}
                            className="h-full"
                        >
                            {activeTab === 'zion' && (
                                <ZionSentinel
                                    onOpenCodexTerm={openCodexTerm}
                                    onScanComplete={() => setJourneyHint(true)}
                                />
                            )}
                            {activeTab === 'codex' && (
                                <TheCodex initialQuery={codexQuery} onQueryConsumed={() => setCodexQuery('')} />
                            )}
                            {activeTab === 'recoupment' && <RecoupmentSandbox />}
                            {activeTab === 'splits' && <SplitSheetGenerator />}
                        </motion.div>
                    </AnimatePresence>
                </div>
            </div>

            <Walkthrough
                tourId="legal"
                open={showLegalTour}
                accent={LEGAL_ACCENT}
                onClose={() => setShowLegalTour(false)}
                primaryLabel="Open Scanner"
                steps={[
                    {
                        title: 'Scanner first',
                        body: 'Paste text or drop a PDF/DOCX. Choose Contract or Offer. Flags and integrity score land in seconds.',
                        bullets: ['Educational only — not a lawyer', 'Export rebuttal language for your attorney'],
                    },
                    {
                        title: 'Codex is your dictionary',
                        body: 'Search industry terms (in perpetuity, 360, recoupment). Tap a scanner flag to jump here.',
                        bullets: ['CRITICAL / HIGH / WARNING levels'],
                    },
                    {
                        title: 'Money & splits',
                        body: 'Recoup models advances and 360 cuts. Splits generates a clean writer share sheet for your files.',
                        bullets: ['Export scenarios as text', 'Fill writers before sharing'],
                    },
                ]}
            />
        </div>
    );
}
