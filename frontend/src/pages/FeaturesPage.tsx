import { motion } from 'framer-motion';
import { Shield, Zap, Target, ArrowRight, Check, X } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import MarketingNav from '../components/MarketingNav';

export default function FeaturesPage() {
    const navigate = useNavigate();

    const features = [
        {
            icon: Target,
            title: "MULTI-VECTOR ARRAY: THE GIG RADAR",
            tagline: "Total Market Omniscience",
            desc: "Stop hunting. Start executing. The Multi-Vector Array autonomously scrapes high-yield platforms (ZipRecruiter, LinkedIn) and cross-references them with deep Reddit acoustic profiling. It identifies immediate pain points and matches them to your exact sonic capabilities.",
            bullets: [
                "Automated lead generation across 50+ platforms",
                "Psychographic profiling of potential clients",
                "Real-time alerts for high-value contract opportunities",
                "Automated first-touch outreach sequencing"
            ],
            color: "text-red-500",
            bg: "bg-red-950/10",
            border: "border-red-500/30",
            image: "/site/gig_radar_mockup.png"
        },
        {
            icon: Shield,
            title: "ZION PROTOCOL: LEGAL WAR ROOM",
            tagline: "Cryptographic IP Defense",
            desc: "The industry is built to trap you. The Zion Protocol is your impenetrable shield. Upload any contract, and the Engine immediately forensically dissects it for hidden AI voice-cloning clauses, perpetual licensing traps, and exploitative revenue shares.",
            bullets: [
                "Instant detection of predatory legal language",
                "Automated generation of 'Sovereign Rebuttals'",
                "AI-driven counter-offer drafting and negotiation playbooks",
                "Zero-Trust Document Verification"
            ],
            color: "text-purple-500",
            bg: "bg-purple-950/10",
            border: "border-purple-500/30",
            image: "/site/zion_defense_mockup.png",
            reverse: true
        },
        {
            icon: Zap,
            title: "PURETONE AUDIO LAB: NEURAL MASTERY",
            tagline: "Platinum Fidelity on Command",
            desc: "Why pay a mastering house thousands when you have a neural network in your browser? Drag and drop your unmastered mix, select a platinum reference track, and the Engine applies a bespoke DSP topology to match the exact spectral fingerprint.",
            bullets: [
                "1-Click Neural EQ Matching",
                "Dynamic spatial expansion and limiting",
                "Export targets for Spotify, Apple Music & Vinyl",
                "100% Client-side processing (Your stems never leave your machine)"
            ],
            color: "text-cyan-500",
            bg: "bg-cyan-950/10",
            border: "border-cyan-500/30",
            image: "/site/neural_audio_mockup.png"
        }
    ];

    return (
        <div className="min-h-screen bg-black text-white overflow-hidden relative selection:bg-red-500/30">
            <MarketingNav />
            
            {/* Ambient Background (Video + Glows) */}
            <div className="absolute inset-0 z-0 pointer-events-none overflow-hidden">
                <div 
                    className="absolute inset-0 w-full h-full mix-blend-screen opacity-10"
                    dangerouslySetInnerHTML={{
                        __html: `
                        <video
                            autoplay
                            loop
                            muted
                            playsinline
                            class="w-full h-full object-cover"
                        >
                            <source src="/site/data_stream.mp4" type="video/mp4" />
                        </video>
                        `
                    }}
                />
                <div className="absolute top-[20%] left-[10%] w-[800px] h-[800px] bg-red-900/20 rounded-full blur-[120px]" />
                <div className="absolute bottom-[20%] right-[10%] w-[800px] h-[800px] bg-cyan-900/20 rounded-full blur-[120px]" />
            </div>

            <main className="relative z-20 container mx-auto px-4 pt-40 pb-24">
                
                {/* Hero Section */}
                <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.8 }}
                    className="text-center mb-32"
                >
                    <span className="font-mono text-sm tracking-[0.3em] text-red-500 uppercase font-bold border border-red-900/50 px-4 py-2 bg-red-900/10 rounded-full mb-8 inline-block">
                        System Architecture V2.1
                    </span>
                    <h1 className="font-cinzel text-3xl md:text-7xl font-black tracking-widest text-transparent bg-clip-text bg-gradient-to-b from-white to-gray-500 drop-shadow-[0_0_20px_rgba(255,255,255,0.2)] mb-4 md:mb-8">
                        THE SOVEREIGN PLAYBOOK.
                    </h1>
                    <p className="font-mono text-xs md:text-base text-gray-400 tracking-widest max-w-3xl mx-auto uppercase leading-relaxed">
                        The Artist Engine isn't just software. It's a localized, autonomous agency replacement. You no longer need a manager, a lawyer, or a mastering engineer. You only need the Engine.
                    </p>
                </motion.div>

                {/* Deep Dive Features */}
                <div className="space-y-40 max-w-7xl mx-auto">
                    {features.map((feat, idx) => (
                        <motion.div
                            key={idx}
                            initial={{ opacity: 0, y: 50 }}
                            whileInView={{ opacity: 1, y: 0 }}
                            viewport={{ once: true, margin: "-100px" }}
                            transition={{ duration: 0.8 }}
                            className={`flex flex-col ${feat.reverse ? 'lg:flex-row-reverse' : 'lg:flex-row'} items-center gap-8 lg:gap-16`}
                        >
                            {/* Visual Asset (Mockup) */}
                            <div className="w-full lg:w-1/2 relative group">
                                <div className={`absolute inset-0 ${feat.bg} blur-3xl opacity-50 group-hover:opacity-80 transition-opacity duration-700`} />
                                <div className={`relative rounded-tl-[4rem] rounded-br-[4rem] border border-gray-800 p-2 bg-gradient-to-b from-gray-900 to-black overflow-hidden shadow-[0_0_50px_rgba(0,0,0,0.8)]`}>
                                    <img 
                                        src={feat.image} 
                                        alt={feat.title} 
                                        className="w-full h-auto object-cover rounded-tl-[3.5rem] rounded-br-[3.5rem] opacity-90 group-hover:opacity-100 transition-opacity duration-500 saturate-150 contrast-125"
                                    />
                                    {/* Glass reflection overlay */}
                                    <div className="absolute inset-0 bg-gradient-to-tr from-white/5 to-transparent pointer-events-none rounded-tl-[3.5rem] rounded-br-[3.5rem]" />
                                </div>
                            </div>

                            {/* Copy & Selling Points */}
                            <div className="w-full lg:w-1/2 space-y-8">
                                <div className="flex items-center gap-3 md:gap-4">
                                    <feat.icon className={`${feat.color} w-8 h-8 md:w-10 md:h-10`} />
                                    <h2 className="font-cinzel text-2xl md:text-5xl font-bold tracking-widest text-white uppercase drop-shadow-lg">
                                        {feat.title.split(':')[0]}
                                    </h2>
                                </div>
                                <h3 className={`font-mono text-sm md:text-lg tracking-[0.2em] ${feat.color} uppercase font-bold`}>
                                    // {feat.tagline}
                                </h3>
                                <p className="font-mono text-xs md:text-base text-gray-400 leading-relaxed uppercase tracking-wider">
                                    {feat.desc}
                                </p>

                                <ul className="space-y-4 mt-8">
                                    {feat.bullets.map((bullet, i) => (
                                        <li key={i} className="flex items-start gap-4">
                                            <div className={`mt-1 p-1 rounded-full ${feat.bg} border ${feat.border}`}>
                                                <Check size={14} className={feat.color} />
                                            </div>
                                            <span className="font-mono text-sm text-gray-300 tracking-wide">{bullet}</span>
                                        </li>
                                    ))}
                                </ul>
                            </div>
                        </motion.div>
                    ))}
                </div>

                {/* The Brutal Reality (Comparison Table) */}
                <motion.div
                    initial={{ opacity: 0, y: 50 }}
                    whileInView={{ opacity: 1, y: 0 }}
                    viewport={{ once: true }}
                    transition={{ duration: 0.8 }}
                    className="mt-48 max-w-5xl mx-auto"
                >
                    <div className="text-center mb-16">
                        <h2 className="font-cinzel text-4xl font-bold tracking-widest text-white mb-4">THE BRUTAL REALITY</h2>
                        <p className="font-mono text-sm text-gray-400 tracking-widest uppercase">The old industry model vs. The Artist Engine</p>
                    </div>

                    <div className="border border-gray-800 rounded-3xl overflow-hidden bg-black/80 backdrop-blur-3xl shadow-[0_0_80px_rgba(0,0,0,0.8)]">
                        <div className="grid grid-cols-1 md:grid-cols-3 divide-y md:divide-y-0 md:divide-x divide-gray-800">
                            
                            {/* Feature Column */}
                            <div className="p-8 hidden md:block">
                                <h3 className="font-cinzel text-xl font-bold text-gray-700 text-left mb-12 tracking-widest border-b border-gray-800 pb-2">CAPABILITY</h3>
                                <div className="space-y-8">
                                    <div className="font-mono text-xs text-gray-500 uppercase tracking-widest h-12 flex items-center">Client Acquisition</div>
                                    <div className="font-mono text-xs text-gray-500 uppercase tracking-widest h-12 flex items-center">Legal Defense</div>
                                    <div className="font-mono text-xs text-gray-500 uppercase tracking-widest h-12 flex items-center">Audio Processing</div>
                                    <div className="font-mono text-xs text-gray-500 uppercase tracking-widest h-12 flex items-center">Revenue Split</div>
                                </div>
                            </div>

                            {/* Traditional Model */}
                            <div className="p-8 bg-black/80">
                                <h3 className="font-cinzel text-xl font-bold text-gray-500 text-center mb-12 tracking-widest">TRADITIONAL AGENCY</h3>
                                <div className="space-y-8">
                                    <div className="flex flex-col h-12 justify-center">
                                        <span className="md:hidden font-mono text-[10px] text-gray-600 mb-1">Acquisition</span>
                                        <div className="flex items-center gap-3 text-sm font-mono text-gray-400"><X size={16} className="text-red-900"/> Manual Outreach / Cold Emails</div>
                                    </div>
                                    <div className="flex flex-col h-12 justify-center">
                                         <span className="md:hidden font-mono text-[10px] text-gray-600 mb-1">Legal</span>
                                        <div className="flex items-center gap-3 text-sm font-mono text-gray-400"><X size={16} className="text-red-900"/> $450/hr Retainer Attorney</div>
                                    </div>
                                    <div className="flex flex-col h-12 justify-center">
                                         <span className="md:hidden font-mono text-[10px] text-gray-600 mb-1">Audio</span>
                                        <div className="flex items-center gap-3 text-sm font-mono text-gray-400"><X size={16} className="text-red-900"/> $150/track Mastering House</div>
                                    </div>
                                    <div className="flex flex-col h-12 justify-center">
                                         <span className="md:hidden font-mono text-[10px] text-gray-600 mb-1">Revenue</span>
                                        <div className="flex items-center gap-3 text-sm font-mono text-red-500 font-bold"><X size={16} className="text-red-900"/> 15-20% Gross Cut Trapped</div>
                                    </div>
                                </div>
                            </div>

                            {/* The Artist Engine */}
                            <div className="p-8 relative overflow-hidden">
                                <div className="absolute inset-0 bg-red-900/10 pointer-events-none" />
                                <div className="absolute top-0 left-0 w-full h-[2px] bg-red-500 shadow-[0_0_20px_rgba(220,38,38,1)]" />
                                
                                <h3 className="font-cinzel text-xl font-bold text-white text-center mb-12 tracking-widest drop-shadow-[0_0_10px_rgba(220,38,38,0.5)]">ENGINE.OS</h3>
                                <div className="space-y-8 relative z-10">
                                    <div className="flex flex-col h-12 justify-center">
                                        <span className="md:hidden font-mono text-[10px] text-red-400 mb-1">Acquisition</span>
                                        <div className="flex items-center gap-3 text-sm font-mono text-white"><Check size={16} className="text-red-500"/> Multi-Vector Automated Scraping</div>
                                    </div>
                                    <div className="flex flex-col h-12 justify-center">
                                         <span className="md:hidden font-mono text-[10px] text-red-400 mb-1">Legal</span>
                                        <div className="flex items-center gap-3 text-sm font-mono text-white"><Check size={16} className="text-red-500"/> Instant Zion Protocol Analytics</div>
                                    </div>
                                    <div className="flex flex-col h-12 justify-center">
                                         <span className="md:hidden font-mono text-[10px] text-red-400 mb-1">Audio</span>
                                        <div className="flex items-center gap-3 text-sm font-mono text-white"><Check size={16} className="text-red-500"/> Neural AI DSP Reference Matching</div>
                                    </div>
                                    <div className="flex flex-col h-12 justify-center">
                                         <span className="md:hidden font-mono text-[10px] text-red-400 mb-1">Revenue</span>
                                        <div className="flex items-center gap-3 text-sm font-mono text-red-400 font-bold"><Check size={16} className="text-red-500"/> 0% Cut. 100% Sovereign.</div>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                </motion.div>

                {/* Final CTA */}
                <motion.div 
                    initial={{ opacity: 0 }}
                    whileInView={{ opacity: 1 }}
                    viewport={{ once: true }}
                    transition={{ delay: 0.2 }}
                    className="mt-48 text-center"
                >
                    <button
                        onClick={() => navigate('/engine')}
                        className="group relative px-16 py-6 bg-transparent overflow-hidden border border-red-500/50 hover:border-red-400 transition-colors mx-auto"
                    >
                        <div className="absolute inset-0 bg-red-600/20 translate-y-[100%] group-hover:translate-y-0 transition-transform duration-300 ease-in-out" />
                        <div className="relative flex items-center justify-center gap-4 font-mono tracking-[0.2em] text-lg text-white font-bold uppercase drop-shadow-md">
                            Initialize The Engine <ArrowRight size={24} className="group-hover:translate-x-2 transition-transform" />
                        </div>
                    </button>
                    <p className="mt-8 font-mono text-xs text-gray-500 tracking-widest uppercase">
                        System ready for deployment. Bypassing Legacy Gatekeepers.
                    </p>
                </motion.div>

            </main>
        </div>
    );
}
