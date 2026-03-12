import { motion } from 'framer-motion';
import { Shield, Zap, Target, ArrowRight } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import MarketingNav from '../components/MarketingNav';

export default function FeaturesPage() {
    const navigate = useNavigate();

    const features = [
        {
            icon: Target,
            title: "GIG RADAR / MULTI-VECTOR ARRAY",
            desc: "Autonomous scraping of high-yield platforms (ZipRecruiter, LinkedIn) with deep Reddit acoustic profiling.",
            color: "text-red-500",
            bg: "bg-red-950/20",
            border: "border-red-500/30"
        },
        {
            icon: Shield,
            title: "LEGAL WAR ROOM / ZION PROTOCOL",
            desc: "Instant forensic breakdown of contracts for hidden AI clauses. Generates sovereign rebuttals and counter-offers in seconds.",
            color: "text-purple-500",
            bg: "bg-purple-950/20",
            border: "border-purple-500/30"
        },
        {
            icon: Zap,
            title: "PURETONE AUDIO LAB / AI MATCHERING",
            desc: "Drag-and-drop neural mastery. Match your unmastered mix to any platinum reference track leveraging custom DSP topology.",
            color: "text-cyan-500",
            bg: "bg-cyan-950/20",
            border: "border-cyan-500/30"
        }
    ];

    return (
        <div className="min-h-screen bg-black text-white overflow-hidden relative selection:bg-red-500/30">
            <MarketingNav />
            
            <div className="absolute inset-0 z-0 pointer-events-none opacity-20">
                 <div className="absolute top-[20%] left-[10%] w-96 h-96 bg-red-900/30 rounded-full blur-[100px]" />
                 <div className="absolute bottom-[20%] right-[10%] w-96 h-96 bg-cyan-900/30 rounded-full blur-[100px]" />
            </div>

            <main className="relative z-20 container mx-auto px-4 pt-32 pb-24">
                <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="text-center mb-24"
                >
                    <h1 className="font-cinzel text-3xl md:text-6xl font-black tracking-widest text-transparent bg-clip-text bg-gradient-to-b from-white to-gray-500 drop-shadow-[0_0_15px_rgba(255,255,255,0.2)] mb-4">
                        SYSTEM ARCHITECTURE
                    </h1>
                    <p className="font-mono text-sm text-gray-400 tracking-widest max-w-2xl mx-auto uppercase">
                        The three tactical nodes comprising the Engine.OS framework. Built strictly for sovereign creators.
                    </p>
                </motion.div>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-8 max-w-6xl mx-auto">
                    {features.map((feat, idx) => (
                        <motion.div
                            key={idx}
                            initial={{ opacity: 0, y: 30 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ delay: idx * 0.2 }}
                            className={`p-8 ${feat.bg} border ${feat.border} backdrop-blur-md rounded-[2rem_0.25rem_2rem_0.25rem] hover:-translate-y-2 transition-transform duration-300 relative group`}
                        >
                            <div className="absolute inset-0 bg-white/5 opacity-0 group-hover:opacity-100 transition-opacity rounded-[2rem_0.25rem_2rem_0.25rem]" />
                            <feat.icon className={`${feat.color} mb-6 w-12 h-12`} />
                            <h3 className="font-cinzel text-xl font-bold tracking-widest text-white mb-4 uppercase drop-shadow-md">
                                {feat.title}
                            </h3>
                            <p className="font-mono text-xs text-gray-400 leading-relaxed uppercase tracking-wider relative z-10">
                                {feat.desc}
                            </p>
                        </motion.div>
                    ))}
                </div>

                <motion.div 
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    transition={{ delay: 0.8 }}
                    className="mt-24 text-center"
                >
                    <button
                        onClick={() => navigate('/engine')}
                        className="px-12 py-4 bg-white text-black font-mono font-bold tracking-widest uppercase hover:bg-gray-200 transition-colors drop-shadow-[0_0_20px_rgba(255,255,255,0.3)] shadow-[inset_0_0_10px_rgba(0,0,0,0.5)] flex items-center gap-3 mx-auto"
                    >
                        Initialize Engine <ArrowRight size={16} />
                    </button>
                </motion.div>

            </main>
        </div>
    );
}
