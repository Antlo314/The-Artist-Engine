import { motion } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import { Shield, Zap, Target, ArrowRight } from 'lucide-react';
import MarketingNav from '../components/MarketingNav';

export default function LandingPage() {
    const navigate = useNavigate();

    return (
        <div className="min-h-screen bg-black text-white overflow-hidden relative selection:bg-red-500/30">
            {/* Ambient Background */}
            <div className="absolute inset-0 z-0 pointer-events-none bg-black overflow-hidden relative">
                {/* Cinematic Letterbox - Top */}
                <div className="absolute top-0 left-0 w-full h-[12vh] bg-black z-20 shadow-[0_20px_50px_rgba(0,0,0,1)]" />

                <div className="absolute inset-0 flex items-center justify-center opacity-60 mix-blend-screen">
                    <video
                        autoPlay
                        loop
                        muted
                        playsInline
                        webkit-playsinline="true"
                        className="w-[100vw] h-[100vh] lg:w-full lg:min-h-full object-cover contrast-[1.2]"
                    >
                        <source src="/site/core_engine.mp4" type="video/mp4" />
                        <source src="/site/core_engine.webm" type="video/webm" />
                    </video>
                </div>

                {/* Cinematic Letterbox - Bottom */}
                <div className="absolute bottom-0 left-0 w-full h-[12vh] bg-black z-20 shadow-[0_-20px_50px_rgba(0,0,0,1)] flex items-end justify-center pb-4">
                     <span className="font-mono text-[10px] text-gray-800 tracking-widest uppercase hidden md:block">System Link Established</span>
                </div>
            </div>

            {/* Fog / Grain Overlay */}
            <div className="absolute inset-0 bg-[url('data:image/svg+xml;base64,PHN2ZyB2aWV3Qm94PSIwIDAgMjAwIDIwMCIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj4KICA8ZmlsdGVyIGlkPSJub2lzZUZpbHRlciI+CiAgICA8ZmVUdXJidWxlbmNlIHR5cGU9ImZyYWN0YWxOb2lzZSIgYmFzZUZyZXF1ZW5jeT0iMC42NSIgbnVtT2N0YXZlcz0iMyIgc3RpdGNoVGlsZXM9InN0aXRjaCIvPgogIDwvZmlsdGVyPgogIDxyZWN0IHdpZHRoPSIxMDAlIiBoZWlnaHQ9IjEwMCUiIGZpbHRlcj0idXJsKCNub2lzZUZpbHRlcikiIG9wYWNpdHk9IjAuMDgiLz4KPC9zdmc+')] z-10 pointer-events-none opacity-30" />

            <MarketingNav />

            <main className="relative z-20 flex flex-col items-center justify-center min-h-screen px-4 text-center">
                
                <motion.div
                    initial={{ opacity: 0, y: 30 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 1.2, ease: "easeOut" }}
                    className="flex flex-col items-center"
                >
                    <div className="mb-6 flex items-center justify-center space-x-3">
                        <div className="w-12 h-12 border border-red-500/30 rounded-lg flex items-center justify-center bg-black/40 backdrop-blur-md shadow-[0_0_15px_rgba(220,38,38,0.2)]">
                            <img src="/site/favicon.png" alt="Engine Logo" className="w-8 h-8 object-contain" />
                        </div>
                        <span className="font-mono text-[10px] tracking-[0.3em] text-red-500 uppercase font-bold border border-red-900/50 px-3 py-1 bg-red-900/10 rounded-full">
                            System Live
                        </span>
                    </div>

                    <h1 className="font-cinzel text-5xl md:text-8xl font-black tracking-widest text-transparent bg-clip-text bg-gradient-to-b from-white to-gray-500 drop-shadow-[0_0_30px_rgba(255,255,255,0.2)] mb-2">
                        THE ARTIST
                    </h1>
                    <h2 className="font-mono text-2xl md:text-4xl text-red-600 tracking-[0.5em] font-bold drop-shadow-[0_0_15px_rgba(220,38,38,0.6)] mb-8">
                        ENGINE.OS
                    </h2>

                    <p className="font-mono text-xs md:text-sm text-gray-400 max-w-2xl leading-relaxed tracking-widest uppercase mb-12 border-l-2 border-r-2 border-red-900/30 px-8 py-2">
                        The fully autonomous operational framework for sovereign creators. 
                        Targeting routing, secure communications, and acoustic mastering in a single tactical dashboard.
                    </p>

                    <div className="flex flex-col sm:flex-row gap-6">
                        <button
                            onClick={() => navigate('/engine')}
                            className="group relative px-8 py-4 bg-transparent overflow-hidden rounded-sm border border-red-500/50 hover:border-red-400 transition-colors"
                        >
                            <div className="absolute inset-0 bg-red-600/10 translate-y-[100%] group-hover:translate-y-0 transition-transform duration-300 ease-in-out" />
                            <div className="relative flex items-center gap-3 font-mono tracking-widest text-sm text-red-50 font-bold uppercase drop-shadow-md">
                                Enter The Engine <ArrowRight size={16} className="group-hover:translate-x-1 transition-transform" />
                            </div>
                        </button>

                        <button
                            onClick={() => navigate('/features')}
                            className="px-8 py-4 bg-transparent border border-gray-700 hover:border-gray-500 transition-colors rounded-sm font-mono tracking-widest text-sm text-gray-300 hover:text-white uppercase"
                        >
                            View Architecture
                        </button>
                    </div>
                </motion.div>

                {/* Tactical Features Strip */}
                <motion.div 
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    transition={{ delay: 1, duration: 1 }}
                    className="absolute bottom-12 w-full max-w-5xl px-4 grid grid-cols-1 md:grid-cols-3 gap-8"
                >
                    <div className="flex flex-col items-center opacity-60 hover:opacity-100 transition-opacity">
                        <Target className="text-red-500 mb-2" size={20} />
                        <span className="font-mono text-[9px] tracking-[0.2em] text-gray-400 uppercase">Multi-Vector Gig Radar</span>
                    </div>
                    <div className="flex flex-col items-center opacity-60 hover:opacity-100 transition-opacity">
                        <Shield className="text-purple-500 mb-2" size={20} />
                        <span className="font-mono text-[9px] tracking-[0.2em] text-gray-400 uppercase">Zion Protocol Defense</span>
                    </div>
                    <div className="flex flex-col items-center opacity-60 hover:opacity-100 transition-opacity">
                        <Zap className="text-cyan-500 mb-2" size={20} />
                        <span className="font-mono text-[9px] tracking-[0.2em] text-gray-400 uppercase">Neural Audio Mastering</span>
                    </div>
                </motion.div>
            </main>
        </div>
    );
}
