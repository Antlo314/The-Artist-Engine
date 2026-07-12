import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import ZionSentinel from './ZionSentinel';
import TheCodex from './TheCodex';
import RecoupmentSandbox from './RecoupmentSandbox';
import SplitSheetGenerator from './SplitSheetGenerator';
import { PageHeader, Segmented } from './ui/Shell';

const LEGAL_ACCENT = '#a78bfa';

type LegalTab = 'zion' | 'codex' | 'recoupment' | 'splits';

export default function LegalCore() {
    const [activeTab, setActiveTab] = useState<LegalTab>('zion');

    return (
        <div className="h-full flex flex-col space-y-4 md:space-y-6">
            <PageHeader
                view="legal"
                accent={LEGAL_ACCENT}
                module="ZION LEGAL"
                title="Legal"
                desc="Contract scans in ~3s — predatory clauses in plain language."
                speedHint="~3s"
            />

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
                            {activeTab === 'zion' && <ZionSentinel />}
                            {activeTab === 'codex' && <TheCodex />}
                            {activeTab === 'recoupment' && <RecoupmentSandbox />}
                            {activeTab === 'splits' && <SplitSheetGenerator />}
                        </motion.div>
                    </AnimatePresence>
                </div>
            </div>
        </div>
    );
}
