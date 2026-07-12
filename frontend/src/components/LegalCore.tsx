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
        <div className="h-full flex flex-col p-4 lg:p-12 overflow-hidden relative group">
            {/* Legal Protocol Vault Video Background */}
            <video
                autoPlay
                loop
                muted
                playsInline
                className="absolute inset-0 w-full h-full object-cover opacity-60 mix-blend-luminosity z-0 group-hover:opacity-80 transition-opacity duration-1000"
            >
                <source src="/legal-war.mp4" type="video/mp4" />
            </video>

            <div className="z-10 relative flex flex-col h-full space-y-8">
                {/* Header */}
                <div className="flex flex-col border-b border-white/10 pb-4 lg:pb-6 relative z-10">
                    <h1 className="font-display text-2xl sm:text-3xl lg:text-5xl font-bold text-purple-400 tracking-[0.2em] uppercase flex items-center gap-2 lg:gap-4 drop-shadow-[0_0_15px_rgba(168,85,247,0.8)] glitch-hover cursor-pointer w-fit">
                        <Shield className="text-purple-400 w-6 h-6 lg:w-9 lg:h-9 shrink-0" />
                        LEGAL WAR ROOM
                    </h1>
                    <div className="mt-2 hidden sm:flex items-center gap-3">
                        <div className="h-px w-12 bg-purple-500/50" />
                        <p className="font-mono text-[10px] lg:text-xs text-purple-300/80 tracking-[0.3em] uppercase drop-shadow-md">
                            Autonomous Legal Defense & Contract Nullification
                        </p>
                    </div>
                </div>

                <div className="flex flex-col lg:flex-row gap-4 lg:gap-8 flex-1 min-h-0">
                    {/* Navigation Tabs - Grid on Mobile, Vertical on Desktop */}
                    <div className="relative z-10 shrink-0">
                        <div className="grid grid-cols-2 lg:flex lg:flex-col gap-2 glass-obsidian border border-white/10 p-2 lg:p-4 lg:pr-6 rounded-xl lg:rounded-l-2xl shadow-xl w-full lg:w-72">
                            {tabs.map((tab) => {
                                const Icon = tab.icon;
                                const isActive = activeTab === tab.id;
                                return (
                                    <button
                                        key={tab.id}
                                        onClick={() => setActiveTab(tab.id)}
                                        className={`relative px-2 py-3 lg:px-6 lg:py-4 font-mono text-[9px] sm:text-xs tracking-widest uppercase transition-all duration-300 flex flex-col sm:flex-row items-center justify-center lg:justify-start gap-2 text-center lg:text-left shape-cyber-leaf hover:scale-[1.02]
                                        ${isActive ? 'text-purple-300 bg-purple-900/30 border border-purple-400 shadow-[inset_4px_0_15px_rgba(168,85,247,0.3)] drop-shadow-[0_0_8px_rgba(168,85,247,0.8)]' : 'text-purple-400/60 hover:text-purple-300 hover:bg-white/5 border border-white/10'}`}
                                    >
                                        <Icon className={`w-4 h-4 sm:w-5 sm:h-5 lg:w-4 lg:h-4 shrink-0 ${isActive ? 'text-purple-400 drop-shadow-[0_0_8px_rgba(168,85,247,0.8)]' : 'text-purple-400/40'}`} />
                                        <span>{tab.label}</span>
                                    </button>
                                );
                            })}
                        </div>
                    </div>

                    {/* Content Area */}
                    <div className="flex-1 overflow-y-auto custom-scrollbar relative glass-obsidian rounded-2xl lg:rounded-tl-none border border-white/10 p-4 lg:p-8 hidden-scrollbar shadow-xl">
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
