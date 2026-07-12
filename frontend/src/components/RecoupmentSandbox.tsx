import { useState, useEffect } from 'react';
import { AlertTriangle, Activity } from 'lucide-react';
import { motion } from 'framer-motion';
import { Panel, Field } from './ui/Shell';

const ACCENT = '#a78bfa';

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
            <div>
                <h2 className="font-display text-xl lg:text-2xl font-semibold text-ink-50 flex items-center gap-2 lg:gap-3">
                    <Activity className="text-ink-400 w-5 h-5 lg:w-6 lg:h-6" />
                    Recoupment Calculator
                </h2>
                <p className="font-mono text-[10px] text-ink-400 mt-1 tracking-[0.2em] uppercase">
                    Model your deal — advances, hidden debt, and the 360 cut
                </p>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
                {/* Inputs Column */}
                <div className="lg:col-span-5 space-y-6 overflow-y-auto max-h-[80vh] custom-scrollbar pr-2 pb-10">

                    {/* Core Deal */}
                    <Panel title="The 'Bait'" sub="ADVANCE & ROYALTIES" accent="#10b981">
                        <div className="space-y-4">
                            <Field label="Cash Advance" hint={`$${advance.toLocaleString()}`}>
                                <input type="range" min="10000" max="2000000" step="10000" value={advance} onChange={(e) => setAdvance(Number(e.target.value))} className="w-full accent-emerald-500" />
                            </Field>
                            <Field label="Artist Royalty Rate" hint={`${royaltyRate}%`}>
                                <input type="range" min="5" max="50" step="1" value={royaltyRate} onChange={(e) => setRoyaltyRate(Number(e.target.value))} className="w-full accent-emerald-500" />
                            </Field>
                        </div>
                    </Panel>

                    {/* Hidden Debt */}
                    <Panel
                        title="100% Recoupable Debt"
                        sub="HIDDEN DEBT ENGINE"
                        accent="#ef4444"
                        actions={<AlertTriangle size={16} className="text-red-400" />}
                    >
                        <div className="space-y-4">
                            <Field label="Marketing Budget (Loan)" hint={`$${marketingBudget.toLocaleString()}`}>
                                <input type="range" min="0" max="1000000" step="10000" value={marketingBudget} onChange={(e) => setMarketingBudget(Number(e.target.value))} className="w-full accent-red-500" />
                            </Field>
                            <Field label="Music Video Budget (Loan)" hint={`$${videoBudget.toLocaleString()}`}>
                                <input type="range" min="0" max="500000" step="5000" value={videoBudget} onChange={(e) => setVideoBudget(Number(e.target.value))} className="w-full accent-red-500" />
                            </Field>
                        </div>
                    </Panel>

                    {/* 360 Cross-Collateralization */}
                    <Panel title="360 Deal" sub="CROSS-COLLATERALIZATION" accent={ACCENT}>
                        <div className="space-y-4">
                            <Field label="Independent Tour/Merch Income" hint={`$${tourMerchIncome.toLocaleString()}`}>
                                <input type="range" min="0" max="2000000" step="25000" value={tourMerchIncome} onChange={(e) => setTourMerchIncome(Number(e.target.value))} className="w-full accent-purple-500" />
                            </Field>
                            <Field label="Label's 360 Cut (%)" hint={`${threeSixtyCut}%`}>
                                <input type="range" min="0" max="50" step="5" value={threeSixtyCut} onChange={(e) => setThreeSixtyCut(Number(e.target.value))} className="w-full accent-purple-500" />
                            </Field>
                        </div>
                    </Panel>

                </div>

                {/* Data Visualizer Engine */}
                <div className="lg:col-span-7 flex flex-col space-y-6">

                    {/* The Big Number */}
                    <div className="glass-obsidian rounded-xl border border-white/10 border-l-4 border-l-red-500 p-6 lg:p-8 relative overflow-hidden">
                        <div className="relative z-10 space-y-2">
                            <p className="font-mono text-[10px] text-ink-400 tracking-widest uppercase">Total Debt To Recoup</p>
                            <h2 className="font-mono text-2xl lg:text-3xl text-red-400 font-bold mb-4 lg:mb-6">${totalDebt.toLocaleString()}</h2>

                            <div className="h-px w-full bg-white/10 my-4 lg:my-6" />

                            <p className="font-mono text-[10px] sm:text-xs text-ink-400 tracking-widest uppercase">Streams Required to Break Even</p>
                            <motion.h1
                                key={streamsNeeded}
                                initial={{ opacity: 0, y: 10 }}
                                animate={{ opacity: 1, y: 0 }}
                                className="font-display text-3xl sm:text-5xl md:text-7xl font-bold text-ink-50 tracking-tight"
                            >
                                {formatNumber(streamsNeeded)}
                            </motion.h1>
                            <p className="font-inter text-sm text-ink-200 mt-2">
                                At a {royaltyRate}% share, you earn exactly $0 on record sales until you hit this number.
                            </p>
                        </div>
                    </div>

                    {/* The Reality Bar Breakdown */}
                    <Panel title="The Reality Matrix" accent={ACCENT}>
                        {/* Stacked Progress Bar */}
                        <div className="h-10 w-full bg-white/5 rounded-full flex overflow-hidden mb-6">
                            <motion.div
                                className="h-full bg-emerald-500 flex items-center justify-center font-mono text-[10px] text-black font-bold"
                                initial={{ width: 0 }} animate={{ width: `${labelPct}%` }} transition={{ duration: 0.5 }}
                            >
                                {labelPct > 10 ? 'LABEL KEEPS' : ''}
                            </motion.div>
                            <motion.div
                                className="h-full bg-red-500 flex items-center justify-center font-mono text-[10px] text-white font-bold opacity-90"
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
                            <div className="bg-white/[0.03] border border-emerald-500/30 p-4 rounded-lg">
                                <p className="font-mono text-[10px] text-emerald-400 tracking-widest uppercase mb-1">Label Grosses</p>
                                <p className="font-mono text-xl text-emerald-300 font-bold">${formatNumber(labelGross)}</p>
                            </div>
                            <div className="bg-white/[0.03] border border-red-500/30 p-4 rounded-lg">
                                <p className="font-mono text-[10px] text-red-400 tracking-widest uppercase mb-1">360 Deal Theft</p>
                                <p className="font-mono text-xl text-red-400 font-bold">-${formatNumber(crossCollateralizationLoss)}</p>
                            </div>
                            <div className="bg-white/[0.03] border border-cyan-500/30 p-4 rounded-lg">
                                <p className="font-mono text-[10px] text-cyan-400 tracking-widest uppercase mb-1">Artist Takes Home</p>
                                <p className="font-mono text-xl text-cyan-300 font-bold">${formatNumber(artistNet)}</p>
                            </div>
                        </div>

                        <div className="mt-6 p-4 bg-ink-900 border border-white/10 rounded-lg text-sm font-inter text-ink-200 leading-relaxed">
                            <strong className="text-ink-50">Summary:</strong> The label generated <span className="text-emerald-400 font-bold">${formatNumber(labelGross)}</span> from your music to pay off your <span className="text-red-400 font-bold">${totalDebt.toLocaleString()}</span> total debt. Furthermore, because of your {threeSixtyCut}% 360-Deal, they siphoned <span className="text-red-400 font-bold">${crossCollateralizationLoss.toLocaleString()}</span> of the income you made independently on the road. You took home the initial cash advance plus whatever was left of your tour money, netting <span className="text-cyan-400 font-bold">${formatNumber(artistNet)}</span> while the label walked away with millions.
                        </div>
                    </Panel>

                </div>
            </div>
        </div>
    );
}
