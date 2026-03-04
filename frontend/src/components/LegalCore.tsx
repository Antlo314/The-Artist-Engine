import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Shield, BookOpen, Calculator, FileSignature, Sword } from 'lucide-react';
import ZionSentinel from './ZionSentinel';
import TheCodex from './TheCodex';
import RecoupmentSandbox from './RecoupmentSandbox';
import SplitSheetGenerator from './SplitSheetGenerator';

export default function LegalCore() {
    const [activeTab, setActiveTab] = useState('zion');

    const tabs = [
        { id: 'zion', label: 'ZION SHARK PROTOCOL', icon: Shield, color: 'text-purple-400' },
        { id: 'codex', label: 'THE CODEX', icon: BookOpen, color: 'text-purple-400' },
        { id: 'recoupment', label: 'RECOUPMENT HUB', icon: Calculator, color: 'text-purple-400' },
        { id: 'splits', label: 'SPLIT SHEETS', icon: FileSignature, color: 'text-purple-400' },
    ];

    return (
        <div className="h-full flex flex-col p-8 lg:p-12 overflow-hidden relative group">
            {/* Legal Protocol Vault Video Background */}
            <video
                autoPlay
                loop
                muted
                playsInline
                className="absolute inset-0 w-full h-full object-cover opacity-20 mix-blend-luminosity z-0 group-hover:opacity-30 transition-opacity duration-1000"
            >
                <source src="/legal-war.mp4" type="video/mp4" />
            </video>

            <div className="z-10 relative flex flex-col h-full space-y-8">
                {/* Header */}
                <div className="flex flex-col border-b border-purple-900/10 pb-6">
                    <h1 className="font-cinzel text-4xl lg:text-5xl font-bold text-purple-900 tracking-[0.2em] uppercase flex items-center gap-4">
                        <Shield className="text-purple-600" size={36} />
                        LEGAL WAR ROOM
                    </h1>
                    <div className="mt-2 flex items-center gap-3">
                        <div className="h-px w-12 bg-purple-500/50" />
                        <p className="font-mono text-[10px] lg:text-xs text-purple-900/70 tracking-[0.3em] uppercase">
                            Autonomous Legal Defense & Contract Nullification
                        </p>
                    </div>
                </div>

                <div className="flex flex-col lg:flex-row gap-8 flex-1 min-h-0">
                    {/* Vertical Navigation Tabs */}
                    <div className="flex lg:flex-col gap-2 bg-white/40 backdrop-blur-xl border border-purple-900/10 p-4 lg:pr-6 lg:rounded-l-2xl shadow-xl overflow-x-auto lg:overflow-x-visible lg:w-72 shrink-0 custom-scrollbar z-10 relative">
                        {tabs.map((tab) => {
                            const Icon = tab.icon;
                            const isActive = activeTab === tab.id;
                            return (
                                <button
                                    key={tab.id}
                                    onClick={() => setActiveTab(tab.id)}
                                    className={`relative px-4 lg:px-6 py-4 font-mono text-xs tracking-widest uppercase transition-all flex items-center gap-3 whitespace-nowrap lg:whitespace-normal text-left lg:rounded-l-lg lg:rounded-tr-none lg:border-r-2
                                    ${isActive ? 'text-purple-900 bg-purple-100/50 border-purple-500 shadow-[inset_4px_0_15px_rgba(168,85,247,0.15)]' : 'text-purple-900/60 hover:text-purple-900 hover:bg-purple-900/5 border-transparent rounded-lg lg:rounded-l-lg lg:rounded-r-none'}`}
                                >
                                    <Icon size={16} className={`${isActive ? 'text-purple-600 drop-shadow-[0_0_8px_rgba(168,85,247,0.5)]' : 'text-purple-900/40'}`} />
                                    {tab.label}
                                </button>
                            );
                        })}
                    </div>

                    {/* Content Area */}
                    <div className="flex-1 overflow-y-auto custom-scrollbar relative bg-white/40 rounded-2xl lg:rounded-tl-none border border-purple-900/10 p-4 lg:p-8 backdrop-blur-md hidden-scrollbar shadow-xl">
                        <AnimatePresence mode="wait">
                            <motion.div
                                key={activeTab}
                                initial={{ opacity: 0, x: 20 }}
                                animate={{ opacity: 1, x: 0 }}
                                exit={{ opacity: 0, x: -20 }}
                                transition={{ duration: 0.3 }}
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
        </div>
    );
}
