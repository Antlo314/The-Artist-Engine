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
        { id: 'recoupment', label: 'RECOUPMENT SANDBOX', icon: Calculator, color: 'text-purple-400' },
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
                <div className="flex flex-col border-b border-white/10 pb-6">
                    <h1 className="font-cinzel text-4xl lg:text-5xl font-bold text-white tracking-[0.2em] uppercase flex items-center gap-4">
                        <Shield className="text-purple-500" size={36} />
                        LEGAL WAR ROOM
                    </h1>
                    <div className="mt-2 flex items-center gap-3">
                        <div className="h-px w-12 bg-purple-500/50" />
                        <p className="font-mono text-[10px] lg:text-xs text-purple-300/70 tracking-[0.3em] uppercase">
                            Autonomous Legal Defense & Contract Nullification
                        </p>
                    </div>
                </div>

                <div className="flex flex-col lg:flex-row gap-8 flex-1 min-h-0">
                    {/* Vertical Navigation Tabs */}
                    <div className="flex lg:flex-col gap-2 bg-black/80 backdrop-blur-xl border border-white/10 p-4 lg:pr-6 lg:rounded-l-2xl shadow-2xl overflow-x-auto lg:overflow-x-visible lg:w-72 shrink-0 custom-scrollbar z-10 relative">
                        {tabs.map((tab) => {
                            const Icon = tab.icon;
                            const isActive = activeTab === tab.id;
                            return (
                                <button
                                    key={tab.id}
                                    onClick={() => setActiveTab(tab.id)}
                                    className={`relative px-4 lg:px-6 py-4 font-mono text-xs tracking-widest uppercase transition-all flex items-center gap-3 whitespace-nowrap lg:whitespace-normal text-left lg:rounded-l-lg lg:rounded-tr-none lg:border-r-2
                                    ${isActive ? 'text-white bg-purple-900/30 border-purple-500 shadow-[inset_4px_0_15px_rgba(249,115,22,0.15)]' : 'text-gray-400 hover:text-white hover:bg-white/5 border-transparent rounded-lg lg:rounded-l-lg lg:rounded-r-none'}`}
                                >
                                    <Icon size={16} className={`${isActive ? 'text-purple-400 drop-shadow-[0_0_8px_rgba(249,115,22,0.5)]' : 'text-gray-500'}`} />
                                    {tab.label}
                                </button>
                            );
                        })}
                    </div>

                    {/* Content Area */}
                    <div className="flex-1 overflow-y-auto custom-scrollbar relative bg-black/60 rounded-2xl lg:rounded-tl-none border border-white/10 p-4 lg:p-8 backdrop-blur-md hidden-scrollbar shadow-2xl">
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
