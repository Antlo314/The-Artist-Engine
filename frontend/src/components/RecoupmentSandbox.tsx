import { useState, useEffect } from 'react';
import { Calculator, ArrowRight, DollarSign, TrendingDown, AlertTriangle, Activity } from 'lucide-react';
import { motion } from 'framer-motion';

export default function RecoupmentSandbox() {
    // Standard Deal Terms
    const [advance, setAdvance] = useState<number>(100000);
    const [royaltyRate, setRoyaltyRate] = useState<number>(15);
    const [streamPayout, setStreamPayout] = useState<number>(0.00318);

    // V2.0: Hidden Debt Engine (100% Recoupable)
    const [marketingBudget, setMarketingBudget] = useState<number>(50000);
    const [videoBudget, setVideoBudget] = useState<number>(25000);

    // V2.0: 360 Deal Cross-Collateralization
    const [tourMerchIncome, setTourMerchIncome] = useState<number>(150000);
    const [threeSixtyCut, setThreeSixtyCut] = useState<number>(20); // Percentage the label takes from outside income

    // Calculated Matrix
    const [totalDebt, setTotalDebt] = useState<number>(0);
    const [streamsNeeded, setStreamsNeeded] = useState<number>(0);
    const [labelGross, setLabelGross] = useState<number>(0);
    const [crossCollateralizationLoss, setCrossCollateralizationLoss] = useState<number>(0);

    // The "Take Home"
    const [artistNet, setArtistNet] = useState<number>(0);

    // Bar Percentages
    const [labelPct, setLabelPct] = useState(0);
    const [debtPct, setDebtPct] = useState(0);
    const [artistPct, setArtistPct] = useState(0);

    useEffect(() => {
        // 1. Calculate the Total Loan out against the artist
        const totalRecoupableDebt = advance + marketingBudget + videoBudget;
        setTotalDebt(totalRecoupableDebt);

        // 2. Streams needed to pay off the ENTIRE debt based strictly on the Artist's royalty slice
        const artistPerStream = streamPayout * (royaltyRate / 100);
        const requiredStreams = totalRecoupableDebt / artistPerStream;
        setStreamsNeeded(Math.round(requiredStreams));

        // 3. What the Label actually grosed from those streams
        const totalRecordGross = requiredStreams * streamPayout;
        setLabelGross(Math.round(totalRecordGross));

        // 4. Calculate 360 Deal Theft (Money taken from touring/merch to pay off the label or just as a fee)
        const threeSixtyTheft = tourMerchIncome * (threeSixtyCut / 100);
        setCrossCollateralizationLoss(Math.round(threeSixtyTheft));

        // 5. The Artist's true net profit (Assuming they recoup exactly, their record profit is $0. They ONLY keep what's left of their tour money)
        const finalNet = (tourMerchIncome - threeSixtyTheft) + advance; // They got to keep the cash advance upfront
        setArtistNet(Math.round(finalNet));

        // 6. Calculate Reality Bar Percentages (Total Economy = Label Gross + Tour/Merch)
        const totalEconomy = totalRecordGross + tourMerchIncome;

        // Label keeps their Gross minus the debt they paid out (which is technically just reimbursing themselves), PLUS they keep the 360 cut
        const actualLabelTake = (totalRecordGross - totalRecoupableDebt) + threeSixtyTheft;

        setLabelPct((actualLabelTake / totalEconomy) * 100);
        setDebtPct((totalRecoupableDebt / totalEconomy) * 100); // Debt "burns up" in the economy
        setArtistPct((finalNet / totalEconomy) * 100);

    }, [advance, royaltyRate, streamPayout, marketingBudget, videoBudget, tourMerchIncome, threeSixtyCut]);

    const formatNumber = (num: number) => {
        if (isNaN(num) || !isFinite(num)) return "0";
        if (num >= 1000000000) return (num / 1000000000).toFixed(2) + 'B';
        if (num >= 1000000) return (num / 1000000).toFixed(1) + 'M';
        return num.toLocaleString(undefined, { maximumFractionDigits: 0 });
    };

    return (
        <div className="space-y-6">
            <div className="flex items-end justify-between border-b border-purple-900/40 pb-2 lg:pb-4">
                <div>
                    <h2 className="font-display text-xl lg:text-3xl font-bold text-purple-400 tracking-widest flex items-center gap-2 lg:gap-3 drop-shadow-[0_0_10px_rgba(168,85,247,0.8)]">
                        <Activity className="text-red-500 font-bold drop-shadow-[0_1px_1px_rgba(0,0,0,0.8)] drop-shadow-[0_0_10px_rgba(239,68,68,0.8)] w-5 h-5 lg:w-8 lg:h-8" />
                        RECOUPMENT SIMULATOR v2.0
                    </h2>
                    <p className="font-mono text-xs text-purple-300/80 font-bold drop-shadow-[0_1px_1px_rgba(0,0,0,0.8)] mt-1 tracking-widest uppercase drop-shadow-md hidden sm:block">
                        The horrifying reality matrix of major label contracts and hidden debt.
                    </p>
                </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
                {/* Inputs Column */}
                <div className="lg:col-span-5 space-y-6 overflow-y-auto max-h-[80vh] custom-scrollbar pr-2 pb-10">

                    {/* Core Deal */}
                    <div className="glass-obsidian-hover p-6 rounded-2xl border border-purple-900/40 bg-black/40 shadow-[0_0_20px_rgba(168,85,247,0.1)] backdrop-blur-md">
                        <h3 className="font-mono text-xs text-emerald-400 tracking-widest uppercase mb-4 border-b border-emerald-500/50 pb-2 drop-shadow-sm">The 'Bait' (Advance & Royalties)</h3>
                        <div className="space-y-4">
                            <div>
                                <label className="flex justify-between font-mono text-xs text-gray-300 mb-1">
                                    <span>Cash Advance</span>
                                    <span className="text-emerald-400 font-bold drop-shadow-[0_0_5px_rgba(16,185,129,0.8)]">${advance.toLocaleString()}</span>
                                </label>
                                <input type="range" min="10000" max="2000000" step="10000" value={advance} onChange={(e) => setAdvance(Number(e.target.value))} className="w-full accent-emerald-500 bg-gray-800" />
                            </div>
                            <div>
                                <label className="flex justify-between font-mono text-xs text-gray-300 mb-1">
                                    <span>Artist Royalty Rate</span>
                                    <span className="text-emerald-400 font-bold drop-shadow-[0_0_5px_rgba(16,185,129,0.8)]">{royaltyRate}%</span>
                                </label>
                                <input type="range" min="5" max="50" step="1" value={royaltyRate} onChange={(e) => setRoyaltyRate(Number(e.target.value))} className="w-full accent-emerald-500 bg-gray-800" />
                            </div>
                        </div>
                    </div>

                    {/* Hidden Debt */}
                    <div className="glass-obsidian-hover p-6 rounded-2xl border border-red-500/50 bg-red-900/20 shadow-[0_0_20px_rgba(239,68,68,0.15)] backdrop-blur-md">
                        <h3 className="font-mono text-xs text-red-500 font-bold drop-shadow-[0_1px_1px_rgba(0,0,0,0.8)] tracking-widest uppercase mb-4 border-b border-red-500/50 pb-2 flex items-center gap-2 drop-shadow-[0_0_5px_rgba(239,68,68,0.8)]">
                            <AlertTriangle size={14} className="text-red-500 font-bold drop-shadow-[0_1px_1px_rgba(0,0,0,0.8)]" /> 100% Recoupable Debt
                        </h3>
                        <div className="space-y-4">
                            <div>
                                <label className="flex justify-between font-mono text-xs text-gray-300 mb-1">
                                    <span>Marketing Budget (Loan)</span>
                                    <span className="text-red-400 font-bold drop-shadow-[0_1px_1px_rgba(0,0,0,0.8)] font-bold drop-shadow-[0_0_5px_rgba(239,68,68,0.8)]">${marketingBudget.toLocaleString()}</span>
                                </label>
                                <input type="range" min="0" max="1000000" step="10000" value={marketingBudget} onChange={(e) => setMarketingBudget(Number(e.target.value))} className="w-full accent-red-500 bg-gray-800" />
                            </div>
                            <div>
                                <label className="flex justify-between font-mono text-xs text-gray-300 mb-1">
                                    <span>Music Video Budget (Loan)</span>
                                    <span className="text-red-400 font-bold drop-shadow-[0_1px_1px_rgba(0,0,0,0.8)] font-bold drop-shadow-[0_0_5px_rgba(239,68,68,0.8)]">${videoBudget.toLocaleString()}</span>
                                </label>
                                <input type="range" min="0" max="500000" step="5000" value={videoBudget} onChange={(e) => setVideoBudget(Number(e.target.value))} className="w-full accent-red-500 bg-gray-800" />
                            </div>
                        </div>
                    </div>

                    {/* 360 Cross-Collateralization */}
                    <div className="glass-obsidian-hover p-6 rounded-2xl border border-purple-500/50 bg-purple-900/20 shadow-[0_0_20px_rgba(168,85,247,0.15)] backdrop-blur-md">
                        <h3 className="font-mono text-xs text-purple-400 font-bold drop-shadow-[0_1px_1px_rgba(0,0,0,0.8)] tracking-widest uppercase mb-4 border-b border-purple-500/50 pb-2 drop-shadow-[0_0_5px_rgba(168,85,247,0.8)]">360 Deal (Cross-Collateralization)</h3>
                        <div className="space-y-4">
                            <div>
                                <label className="flex justify-between font-mono text-xs text-gray-300 mb-1">
                                    <span>Independent Tour/Merch Income</span>
                                    <span className="text-purple-400 font-bold drop-shadow-[0_1px_1px_rgba(0,0,0,0.8)] font-bold drop-shadow-[0_0_5px_rgba(168,85,247,0.8)]">${tourMerchIncome.toLocaleString()}</span>
                                </label>
                                <input type="range" min="0" max="2000000" step="25000" value={tourMerchIncome} onChange={(e) => setTourMerchIncome(Number(e.target.value))} className="w-full accent-purple-500 bg-gray-800" />
                            </div>
                            <div>
                                <label className="flex justify-between font-mono text-xs text-gray-300 mb-1">
                                    <span>Label's 360 Cut (%)</span>
                                    <span className="text-purple-400 font-bold drop-shadow-[0_1px_1px_rgba(0,0,0,0.8)] font-bold drop-shadow-[0_0_5px_rgba(168,85,247,0.8)]">{threeSixtyCut}%</span>
                                </label>
                                <input type="range" min="0" max="50" step="5" value={threeSixtyCut} onChange={(e) => setThreeSixtyCut(Number(e.target.value))} className="w-full accent-purple-500 bg-gray-800" />
                            </div>
                        </div>
                    </div>

                </div>

                {/* Data Visualizer Engine */}
                <div className="lg:col-span-7 flex flex-col space-y-6">

                    {/* The Big Number */}
                    <div className="glass-obsidian p-8 rounded-2xl border-l-[4px] border-l-red-500 relative overflow-hidden shadow-md">
                        <div className="absolute inset-0 bg-red-500/5 z-0" />
                        <div className="relative z-10 space-y-2">
                            <p className="font-mono text-xs text-gray-700 tracking-widest uppercase">Total Debt To Recoup</p>
                            <h2 className="font-mono text-2xl lg:text-3xl text-red-600 font-bold drop-shadow-[0_1px_1px_rgba(0,0,0,0.8)] font-bold mb-4 lg:mb-6">${totalDebt.toLocaleString()}</h2>

                            <div className="h-px w-full bg-gradient-to-r from-red-500/30 to-transparent my-4 lg:my-6" />

                            <p className="font-mono text-[10px] sm:text-xs text-gray-700 tracking-widest uppercase">Streams Required to Break Even</p>
                            <motion.h1
                                key={streamsNeeded}
                                initial={{ opacity: 0, y: 10 }}
                                animate={{ opacity: 1, y: 0 }}
                                className="font-display text-3xl sm:text-5xl md:text-7xl font-bold text-red-400 tracking-wider"
                            >
                                {formatNumber(streamsNeeded)}
                            </motion.h1>
                            <p className="font-inter text-sm text-red-700 font-bold drop-shadow-[0_1px_1px_rgba(0,0,0,0.8)] font-bold mt-2">
                                At a {royaltyRate}% share, you earn exactly $0 on record sales until you hit this number.
                            </p>
                        </div>
                    </div>

                    {/* The Reality Bar Breakdown */}
                    <div className="glass-obsidian p-6 rounded-2xl border border-white/10 shadow-sm">
                        <h3 className="font-display text-xl text-purple-300 font-bold tracking-widest border-b border-white/10 pb-4 mb-6">THE REALITY MATRIX</h3>

                        {/* Stacked Progress Bar */}
                        <div className="h-10 w-full bg-gray-200 rounded-full flex overflow-hidden shadow-inner mb-6">
                            <motion.div
                                className="h-full bg-emerald-500 flex items-center justify-center font-mono text-[10px] text-black font-bold"
                                initial={{ width: 0 }} animate={{ width: `${labelPct}%` }} transition={{ duration: 0.5 }}
                            >
                                {labelPct > 10 ? 'LABEL KEEPS' : ''}
                            </motion.div>
                            <motion.div
                                className="h-full bg-red-500 flex items-center justify-center font-mono text-[10px] text-white font-bold stripe-pattern opacity-90"
                                initial={{ width: 0 }} animate={{ width: `${debtPct}%` }} transition={{ duration: 0.5 }}
                            >
                                {debtPct > 10 ? 'RECOUPED DEBT' : ''}
                            </motion.div>
                            <motion.div
                                className="h-full bg-cyan-400 flex items-center justify-center font-mono text-[10px] text-black font-bold"
                                initial={{ width: 0 }} animate={{ width: `${artistPct}%` }} transition={{ duration: 0.5 }}
                            >
                                {artistPct > 5 ? 'YOU' : ''}
                            </motion.div>
                        </div>

                        {/* Financial Ledger */}
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                            <div className="bg-emerald-900/10 border border-emerald-500/30 p-4 rounded-xl shadow-[inset_0_0_15px_rgba(16,185,129,0.05)]">
                                <p className="font-mono text-[10px] text-emerald-400 tracking-widest uppercase mb-1 drop-shadow-sm">Label Grosses</p>
                                <p className="font-mono text-xl text-emerald-300 font-bold drop-shadow-[0_0_8px_rgba(16,185,129,0.5)]">${formatNumber(labelGross)}</p>
                            </div>
                            <div className="bg-red-900/10 border border-red-500/30 p-4 rounded-xl shadow-[inset_0_0_15px_rgba(239,68,68,0.05)]">
                                <p className="font-mono text-[10px] text-red-500 font-bold drop-shadow-[0_1px_1px_rgba(0,0,0,0.8)] tracking-widest uppercase mb-1 drop-shadow-sm">360 Deal Theft</p>
                                <p className="font-mono text-xl text-red-400 font-bold drop-shadow-[0_1px_1px_rgba(0,0,0,0.8)] font-bold drop-shadow-[0_0_8px_rgba(239,68,68,0.5)]">-${formatNumber(crossCollateralizationLoss)}</p>
                            </div>
                            <div className="bg-cyan-900/10 border border-cyan-500/30 p-4 rounded-xl relative overflow-hidden group shadow-[inset_0_0_15px_rgba(6,182,212,0.05)]">
                                <div className="absolute inset-0 bg-cyan-500/20 opacity-0 group-hover:opacity-100 transition-opacity" />
                                <p className="font-mono text-[10px] text-cyan-400 font-bold drop-shadow-[0_1px_1px_rgba(0,0,0,0.8)] tracking-widest uppercase mb-1 drop-shadow-sm">Artist Takes Home</p>
                                <p className="font-mono text-xl text-cyan-300 font-bold drop-shadow-[0_1px_1px_rgba(0,0,0,0.8)] font-bold drop-shadow-[0_0_8px_rgba(6,182,212,0.5)]">${formatNumber(artistNet)}</p>
                            </div>
                        </div>

                        <div className="mt-6 p-4 bg-black/60 border border-purple-900/30 shadow-inner rounded-lg text-sm font-inter text-gray-300 leading-relaxed">
                            <strong>Summary:</strong> The label generated <span className="text-emerald-400 font-bold">${formatNumber(labelGross)}</span> from your music to pay off your <span className="text-red-400 font-bold drop-shadow-[0_1px_1px_rgba(0,0,0,0.8)] font-bold">${totalDebt.toLocaleString()}</span> total debt. Furthermore, because of your {threeSixtyCut}% 360-Deal, they siphoned <span className="text-red-400 font-bold drop-shadow-[0_1px_1px_rgba(0,0,0,0.8)] font-bold">${crossCollateralizationLoss.toLocaleString()}</span> of the income you made independently on the road. You took home the initial cash advance plus whatever was left of your tour money, netting <span className="text-cyan-400 font-bold drop-shadow-[0_1px_1px_rgba(0,0,0,0.8)] font-bold">${formatNumber(artistNet)}</span> while the label walked away with millions.
                        </div>
                    </div>

                </div>
            </div>
        </div>
    );
}
