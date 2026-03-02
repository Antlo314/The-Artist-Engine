import { useState, useEffect } from 'react';
import { Calculator, ArrowRight, DollarSign, TrendingDown } from 'lucide-react';
import { motion } from 'framer-motion';

export default function RecoupmentSandbox() {
    const [advance, setAdvance] = useState<number>(100000);
    const [royaltyRate, setRoyaltyRate] = useState<number>(15);
    const [streamPayout, setStreamPayout] = useState<number>(0.00318);

    const [streamsNeeded, setStreamsNeeded] = useState<number>(0);
    const [grossGenerated, setGrossGenerated] = useState<number>(0);

    useEffect(() => {
        // Calculation Logic:
        // Artist royalty percentage of the stream payout.
        const artistPerStream = streamPayout * (royaltyRate / 100);
        // How many streams needed to pay back the advance solely from the artist's royalty share
        const requiredStreams = advance / artistPerStream;
        // The total gross money those streams generated overall
        const totalGross = requiredStreams * streamPayout;

        setStreamsNeeded(Math.round(requiredStreams));
        setGrossGenerated(Math.round(totalGross));
    }, [advance, royaltyRate, streamPayout]);

    const formatNumber = (num: number) => {
        if (num >= 1000000000) return (num / 1000000000).toFixed(2) + 'B';
        if (num >= 1000000) return (num / 1000000).toFixed(1) + 'M';
        return num.toLocaleString();
    };

    return (
        <div className="space-y-6">
            <div className="flex items-end justify-between border-b border-white/10 pb-4">
                <div>
                    <h2 className="font-cinzel text-3xl font-bold text-white tracking-widest flex items-center gap-3">
                        <Calculator className="text-blue-500 drop-shadow-[0_0_10px_rgba(59,130,246,0.8)]" />
                        RECOUPMENT SANDBOX
                    </h2>
                    <p className="font-mono text-xs text-gray-400 mt-1 tracking-widest uppercase">
                        The reality matrix of record label advances.
                    </p>
                </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
                {/* Inputs */}
                <div className="lg:col-span-5 space-y-6 glass-card p-6 rounded-2xl border border-white/5">
                    <h3 className="font-mono text-xs text-blue-400 tracking-widest uppercase mb-4 border-b border-white/10 pb-2">Deal Terms</h3>

                    <div className="space-y-2">
                        <label className="flex justify-between font-mono text-xs text-gray-300">
                            <span>Record Advance</span>
                            <span className="text-white">${advance.toLocaleString()}</span>
                        </label>
                        <input
                            type="range" min="10000" max="2000000" step="10000"
                            value={advance} onChange={(e) => setAdvance(Number(e.target.value))}
                            className="w-full accent-blue-500"
                        />
                        <p className="font-mono text-[10px] text-gray-500">The loan you must pay back via royalties.</p>
                    </div>

                    <div className="space-y-2 mt-6">
                        <label className="flex justify-between font-mono text-xs text-gray-300">
                            <span>Artist Royalty Rate</span>
                            <span className="text-white">{royaltyRate}%</span>
                        </label>
                        <input
                            type="range" min="5" max="50" step="1"
                            value={royaltyRate} onChange={(e) => setRoyaltyRate(Number(e.target.value))}
                            className="w-full accent-emerald-500"
                        />
                        <p className="font-mono text-[10px] text-gray-500">Your specific percentage of total revenue.</p>
                    </div>

                    <div className="space-y-2 mt-6">
                        <label className="flex justify-between font-mono text-xs text-gray-300">
                            <span>Avg. Stream Payout (Spotify)</span>
                            <span className="text-white">${streamPayout.toFixed(5)}</span>
                        </label>
                        <input
                            type="range" min="0.001" max="0.015" step="0.0001"
                            value={streamPayout} onChange={(e) => setStreamPayout(Number(e.target.value))}
                            className="w-full accent-cyan-500"
                        />
                    </div>
                </div>

                {/* Data Visualizer */}
                <div className="lg:col-span-7 flex flex-col justify-center glass-card p-8 rounded-2xl border-l-[4px] border-l-red-500 relative overflow-hidden group hover:border-l-red-400 transition-colors">
                    <div className="absolute inset-0 bg-red-900/5 z-0" />
                    <div className="absolute top-4 right-4 animate-pulse z-10">
                        <TrendingDown className="text-red-500/50" size={100} />
                    </div>

                    <div className="relative z-10 space-y-8">
                        <div>
                            <p className="font-mono text-xs text-gray-500 tracking-widest uppercase mb-1">Streams Required to Break Even</p>
                            <motion.h1
                                key={streamsNeeded}
                                initial={{ opacity: 0, scale: 0.9 }}
                                animate={{ opacity: 1, scale: 1 }}
                                className="font-cinzel text-5xl md:text-7xl font-bold text-red-500 drop-shadow-[0_0_15px_rgba(239,68,68,0.5)]"
                            >
                                {formatNumber(streamsNeeded)}
                            </motion.h1>
                            <p className="font-mono text-sm text-gray-400 mt-2 border-l border-red-500/50 pl-2">
                                You earn $0 until you hit this number.
                            </p>
                        </div>

                        <div className="h-px w-full bg-gradient-to-r from-red-500/50 to-transparent" />

                        <div className="grid grid-cols-2 gap-4">
                            <div>
                                <p className="font-mono text-[10px] text-gray-500 tracking-widest uppercase">The Label Grosses</p>
                                <p className="font-mono text-2xl text-white font-bold">${formatNumber(grossGenerated)}</p>
                            </div>
                            <div className="flex items-center text-gray-500">
                                <ArrowRight className="hidden md:block mx-auto" />
                            </div>
                        </div>

                        <div className="bg-black/40 border border-red-900/40 p-4 rounded-xl">
                            <h4 className="font-mono text-xs text-red-400 tracking-widest uppercase mb-2 flex items-center gap-2">
                                <DollarSign size={14} /> The Reality Check
                            </h4>
                            <p className="font-inter text-sm text-gray-300">
                                To pay back your <strong>${advance.toLocaleString()}</strong> advance at a <strong>{royaltyRate}%</strong> rate, the music must generate <strong>${grossGenerated.toLocaleString()}</strong> in gross revenue for the label. They keep the difference.
                            </p>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}
