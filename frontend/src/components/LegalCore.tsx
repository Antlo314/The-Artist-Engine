import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import ZionSentinel from './ZionSentinel';
import TheCodex from './TheCodex';
import RecoupmentSandbox from './RecoupmentSandbox';
import SplitSheetGenerator from './SplitSheetGenerator';
import { PageHeader, Segmented, StepHint, Btn } from './ui/Shell';
import Walkthrough from './ui/Walkthrough';
import CoachPrompt from './ui/CoachPrompt';
import { shouldOpenViewTour } from '../lib/onboarding';

const LEGAL_ACCENT = 'var(--color-zion)';

type LegalTab = 'zion' | 'codex' | 'recoupment' | 'splits';

export default function LegalCore() {
    const [activeTab, setActiveTab] = useState<LegalTab>('zion');
    const [codexQuery, setCodexQuery] = useState('');
    const [showLegalTour, setShowLegalTour] = useState(() => shouldOpenViewTour('legal'));
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
                module="KNOW WHAT YOU'RE SIGNING"
                title="Contracts"
                desc="Paste a contract and see what it really says, in plain English, in seconds."
                speedHint="~3s"
            />
            <StepHint
                steps={['Scan a contract', 'Look up a word', 'Do the money math', 'Write down splits']}
                accent={LEGAL_ACCENT}
            />
            <div className="rounded-lg border border-amber-500/30 bg-amber-500/10 px-3 py-2 text-[11px] text-ink-200 leading-relaxed">
                This is a fast first read, not legal advice. For anything you&apos;re about to sign, have a lawyer look
                at it.
            </div>
            <CoachPrompt id="legal-flow-tip" accent={LEGAL_ACCENT} title="Where to start">
                Paste a contract or an offer into the first tab. Tap any highlighted word to see what it means. Then
                work out the money, or write down who wrote what.
            </CoachPrompt>

            {journeyHint && activeTab === 'zion' && (
                <div className="flex flex-wrap items-center justify-between gap-2 rounded-xl border border-violet-500/25 bg-violet-500/10 px-3 py-2.5">
                    <p className="text-xs text-ink-200">Done — next, work out the money or look up a word you didn&apos;t know.</p>
                    <div className="flex gap-2">
                        <Btn variant="ghost" size="sm" onClick={() => setActiveTab('recoupment')}>
                            Advance calculator
                        </Btn>
                        <Btn variant="ghost" size="sm" onClick={() => setActiveTab('codex')}>
                            Dictionary
                        </Btn>
                    </div>
                </div>
            )}

            <div className="flex flex-col flex-1 min-h-0 space-y-4 md:space-y-6">
                <Segmented
                    options={[
                        { value: 'zion' as LegalTab, label: 'Scan a contract' },
                        { value: 'codex' as LegalTab, label: 'Dictionary' },
                        { value: 'recoupment' as LegalTab, label: 'Advance calculator' },
                        { value: 'splits' as LegalTab, label: 'Split sheet' },
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
                primaryLabel="Scan a contract"
                steps={[
                    {
                        title: 'Start with a contract',
                        body: 'Paste the text or drop in a PDF or Word file. Say whether it is a contract or a gig offer. In a few seconds you get a fairness score and a list of things worth pushing back on.',
                        bullets: [
                            'A fast first read, not legal advice',
                            'Download the report and take it to a lawyer',
                        ],
                    },
                    {
                        title: 'Look up any word',
                        body: 'The Dictionary explains the words that show up in music contracts — in perpetuity, 360 deal, recoupment. Tap a highlighted word in your results to jump straight to it.',
                        bullets: ['Each word is marked walk away, push back, read closely or good for you'],
                    },
                    {
                        title: 'Money and songwriting credit',
                        body: 'The advance calculator shows how long it takes to pay an advance back out of your royalties. The split sheet records who wrote what percentage of a song.',
                        bullets: ['Download your numbers as a text file', 'Fill in every writer before you share it'],
                    },
                ]}
            />
        </div>
    );
}
