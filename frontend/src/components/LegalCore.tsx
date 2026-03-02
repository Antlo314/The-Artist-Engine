import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Shield, BookOpen, Calculator, FileSignature, Sword } from 'lucide-react';
import ZionSentinel from './ZionSentinel';
import SharkProtocol from './SharkProtocol';
import TheCodex from './TheCodex';
import RecoupmentSandbox from './RecoupmentSandbox';
import SplitSheetGenerator from './SplitSheetGenerator';

export default function LegalCore() {
    const [activeTab, setActiveTab] = useState('zion');

    const tabs = [
        { id: 'zion', label: 'ZION SENTINEL', icon: Shield, color: 'text-green-400' },
        { id: 'shark', label: 'SHARK PROTOCOL', icon: Sword, color: 'text-red-500' },
        { id: 'codex', label: 'THE CODEX', icon: BookOpen, color: 'text-amber-500' },
        { id: 'recoupment', label: 'RECOUPMENT SANDBOX', icon: Calculator, color: 'text-blue-500' },
        { id: 'splits', label: 'SPLIT SHEETS', icon: FileSignature, color: 'text-cyan-500' },
    ];

    return (
        <div className="h-full flex flex-col p-8 lg:p-12 overflow-hidden relative group">
            {/* Legal Protocol Vault Background */}
            <div
                className="absolute inset-0 bg-cover bg-center opacity-20 mix-blend-luminosity z-0 group-hover:opacity-30 transition-opacity duration-1000"
                style={{ backgroundImage: "url('/legal_protocol_vault.png')" }}
            />


            <div className="z-10 relative flex flex-col h-full space-y-8">
                {/* Header */}
                <div className="flex flex-col md:flex-row md:items-end justify-between border-b border-white/10 pb-6 gap-6">
                    <div>
                        <h1 className="font-cinzel text-5xl font-bold text-white tracking-[0.2em] uppercase flex items-center gap-4">
                            LEGAL WAR ROOM
                        </h1>
                        <div className="mt-2 flex items-center gap-3">
                            <div className="h-px w-12 bg-gray-500" />
                            <p className="font-mono text-xs text-gray-400 tracking-[0.3em] uppercase">
                                Autonomous Legal Defense & Contract Nullification
                            </p>
                        </div>
                    </div>
                </div>

                {/* Internal Navigation Tabs */}
                <div className="flex gap-2 border-b border-white/5 pb-0 overflow-x-auto custom-scrollbar">
                    {tabs.map((tab) => {
                        const Icon = tab.icon;
                        const isActive = activeTab === tab.id;
                        return (
                            <button
                                key={tab.id}
                                onClick={() => setActiveTab(tab.id)}
                                className={`relative px-6 py-4 font-mono text-xs tracking-widest uppercase transition-colors flex items-center gap-3 whitespace-nowrap
                                    ${isActive ? 'text-white bg-white/5 rounded-t-lg border-b-2 border-white' : 'text-gray-500 hover:text-gray-300 hover:bg-white/5 rounded-t-lg'}`}
                            >
                                <Icon size={16} className={`${isActive ? tab.color : 'text-gray-600'} drop-shadow-lg`} />
                                {tab.label}
                                {isActive && (
                                    <motion.div
                                        layoutId="activeTabIndicator"
                                        className="absolute bottom-[-2px] left-0 right-0 h-[2px] bg-white shadow-[0_0_10px_rgba(255,255,255,0.8)]"
                                    />
                                )}
                            </button>
                        );
                    })}
                </div>

                {/* Content Area */}
                <div className="flex-1 overflow-y-auto custom-scrollbar relative">
                    <AnimatePresence mode="wait">
                        <motion.div
                            key={activeTab}
                            initial={{ opacity: 0, y: 10 }}
                            animate={{ opacity: 1, y: 0 }}
                            exit={{ opacity: 0, y: -10 }}
                            transition={{ duration: 0.3 }}
                            className="h-full"
                        >
                            {activeTab === 'zion' && <ZionSentinel />}
                            {activeTab === 'shark' && <SharkProtocol />}
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
