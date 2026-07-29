import { useState, useEffect } from 'react';
import { AlertTriangle, Activity, Download } from 'lucide-react';
import { motion } from 'framer-motion';
import { Panel, Field, Btn } from './ui/Shell';

const ACCENT = 'var(--color-zion)';

export default function RecoupmentSandbox() {
    // Standard Deal Terms
    const [advance, setAdvance] = useState<number>(100000);
    const [royaltyRate, setRoyaltyRate] = useState<number>(15);
    const [streamPayout] = useState<number>(0.00318);

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

    const exportScenario = () => {
        const lines = [
            'ADVANCE CALCULATOR — The Artist Engine',
            `Worked out on: ${new Date().toISOString()}`,
            '',
            'WHAT YOU PUT IN',
            `Advance (cash up front): $${advance.toLocaleString()}`,
            `Your share of the money: ${royaltyRate}%`,
            `Marketing spend you pay back: $${marketingBudget.toLocaleString()}`,
            `Music video budget you pay back: $${videoBudget.toLocaleString()}`,
            `Money you make touring and selling merch: $${tourMerchIncome.toLocaleString()}`,
            `Share the label takes of that: ${threeSixtyCut}%`,
            `Assumed pay per stream: $${streamPayout}`,
            '',
            'WHAT IT ADDS UP TO',
            `Total you have to pay back first: $${totalDebt.toLocaleString()}`,
            `Streams needed before you earn a dollar (approx): ${streamsNeeded.toLocaleString()}`,
            `Money the label collects along the way: $${labelGross.toLocaleString()}`,
            `Taken out of your tour and merch money: $${crossCollateralizationLoss.toLocaleString()}`,
            `What you end up with (rough estimate): $${artistNet.toLocaleString()}`,
            '',
            'An example to learn from, not financial or legal advice.',
        ];
        const blob = new Blob([lines.join('\n')], { type: 'text/plain;charset=utf-8' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = 'recoupment-scenario.txt';
        a.click();
        URL.revokeObjectURL(url);
    };

    return (
        <div className="space-y-6">
            <div className="flex flex-wrap items-start justify-between gap-3">
                <div>
                    <h2 className="font-display text-xl lg:text-2xl font-semibold text-ink-50 flex items-center gap-2 lg:gap-3">
                        <Activity className="text-ink-400 w-5 h-5 lg:w-6 lg:h-6" />
                        Advance calculator
                    </h2>
                    <p className="font-mono text-[10px] text-ink-400 mt-1 tracking-[0.2em] uppercase">
                        Work out when an advance is finally paid off
                    </p>
                </div>
                <Btn variant="ghost" size="sm" onClick={exportScenario}>
                    <Download size={14} /> Download these numbers
                </Btn>
            </div>

            <div className="rounded-lg border border-white/10 bg-white/[0.03] px-4 py-3 text-sm font-inter text-ink-200 leading-relaxed">
                <strong className="text-ink-50">If a label gives you an advance, how long until you actually see
                money?</strong> An advance is not a gift — it is money lent against your future royalties. The label
                keeps your share of the earnings until the advance, and most of what they spent on you, is paid back.
                That is what people mean by <em>recoupment</em>: paying the advance back out of your royalties. Move the
                sliders to see how big that hole is.
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
                {/* Inputs Column */}
                <div className="lg:col-span-5 space-y-6 overflow-y-auto max-h-[80vh] custom-scrollbar pr-2 pb-10">

                    {/* Core Deal */}
                    <Panel title="What they offer you" sub="The advance and your cut" accent="#10b981">
                        <div className="space-y-4">
                            <Field label="Advance (cash up front)" hint={`$${advance.toLocaleString()} — you pay this back out of your royalties`}>
                                <input type="range" min="10000" max="2000000" step="10000" value={advance} onChange={(e) => setAdvance(Number(e.target.value))} className="w-full accent-emerald-500" />
                            </Field>
                            <Field label="Your share of the money" hint={`${royaltyRate}% of what the music earns goes toward paying it back`}>
                                <input type="range" min="5" max="50" step="1" value={royaltyRate} onChange={(e) => setRoyaltyRate(Number(e.target.value))} className="w-full accent-emerald-500" />
                            </Field>
                        </div>
                    </Panel>

                    {/* Hidden Debt */}
                    <Panel
                        title="Costs they add to your tab"
                        sub="Spent on you — but you pay it back"
                        accent="var(--color-ember-500)"
                        actions={<AlertTriangle size={16} className="text-red-400" />}
                    >
                        <div className="space-y-4">
                            <Field label="Marketing spend" hint={`$${marketingBudget.toLocaleString()} — the label spends this promoting you, then adds it to what you owe`}>
                                <input type="range" min="0" max="1000000" step="10000" value={marketingBudget} onChange={(e) => setMarketingBudget(Number(e.target.value))} className="w-full accent-red-500" />
                            </Field>
                            <Field label="Music video budget" hint={`$${videoBudget.toLocaleString()} — same deal: their money up front, your royalties pay it off`}>
                                <input type="range" min="0" max="500000" step="5000" value={videoBudget} onChange={(e) => setVideoBudget(Number(e.target.value))} className="w-full accent-red-500" />
                            </Field>
                        </div>
                    </Panel>

                    {/* 360 Cross-Collateralization */}
                    <Panel title="If it is a 360 deal" sub="They also take from touring and merch" accent={ACCENT}>
                        <div className="space-y-4">
                            <Field label="Money you make touring and selling merch" hint={`$${tourMerchIncome.toLocaleString()} — money you earn on your own, off the records`}>
                                <input type="range" min="0" max="2000000" step="25000" value={tourMerchIncome} onChange={(e) => setTourMerchIncome(Number(e.target.value))} className="w-full accent-purple-500" />
                            </Field>
                            <Field label="Share the label takes of that" hint={`${threeSixtyCut}% — in a 360 deal the label takes a cut of income it never paid for`}>
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
                            <p className="font-mono text-[10px] text-ink-400 tracking-widest uppercase">Total you have to pay back first</p>
                            <h2 className="font-mono text-2xl lg:text-3xl text-red-400 font-bold mb-4 lg:mb-6">${totalDebt.toLocaleString()}</h2>

                            <div className="h-px w-full bg-white/10 my-4 lg:my-6" />

                            <p className="font-mono text-[10px] sm:text-xs text-ink-400 tracking-widest uppercase">Streams needed before you earn a dollar</p>
                            <motion.h1
                                key={streamsNeeded}
                                initial={{ opacity: 0, y: 10 }}
                                animate={{ opacity: 1, y: 0 }}
                                className="font-display text-3xl sm:text-5xl md:text-7xl font-bold text-ink-50 tracking-tight"
                            >
                                {formatNumber(streamsNeeded)}
                            </motion.h1>
                            <p className="font-inter text-sm text-ink-200 mt-2">
                                With a {royaltyRate}% share, your music pays you $0 until it passes this many streams.
                                Everything before that goes to paying the advance back.
                            </p>
                        </div>
                    </div>

                    {/* The Reality Bar Breakdown */}
                    <Panel title="Where the money actually goes" accent={ACCENT}>
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
                                {debtPct > 10 ? 'PAID BACK' : ''}
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
                                <p className="font-mono text-[10px] text-emerald-400 tracking-widest uppercase mb-1">Label collects</p>
                                <p className="font-mono text-xl text-emerald-300 font-bold">${formatNumber(labelGross)}</p>
                            </div>
                            <div className="bg-white/[0.03] border border-red-500/30 p-4 rounded-lg">
                                <p className="font-mono text-[10px] text-red-400 tracking-widest uppercase mb-1">Taken from your tour money</p>
                                <p className="font-mono text-xl text-red-400 font-bold">-${formatNumber(crossCollateralizationLoss)}</p>
                            </div>
                            <div className="bg-white/[0.03] border border-cyan-500/30 p-4 rounded-lg">
                                <p className="font-mono text-[10px] text-cyan-400 tracking-widest uppercase mb-1">You take home</p>
                                <p className="font-mono text-xl text-cyan-300 font-bold">${formatNumber(artistNet)}</p>
                            </div>
                        </div>

                        <div className="mt-6 p-4 bg-ink-900 border border-white/10 rounded-lg text-sm font-inter text-ink-200 leading-relaxed">
                            <strong className="text-ink-50">In plain English:</strong> your music has to earn the label <span className="text-emerald-400 font-bold">${formatNumber(labelGross)}</span> just to clear the <span className="text-red-400 font-bold">${totalDebt.toLocaleString()}</span> you owe them. On top of that, their {threeSixtyCut}% cut of your touring and merch takes another <span className="text-red-400 font-bold">${crossCollateralizationLoss.toLocaleString()}</span> — money you earned on the road, without them. What you actually keep is the cash advance plus whatever is left of your own touring money: <span className="text-cyan-400 font-bold">${formatNumber(artistNet)}</span>. The records themselves pay you nothing until the whole balance is cleared.
                        </div>
                    </Panel>

                </div>
            </div>
        </div>
    );
}
