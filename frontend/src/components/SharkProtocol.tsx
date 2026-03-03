import { useState } from 'react';
import { motion } from 'framer-motion';
import { Briefcase, AlertTriangle, ShieldCheck, Sword, MessageSquare, Target } from 'lucide-react';
import LoadingProgressBar from './LoadingProgressBar';

export default function SharkProtocol() {
    const [offerText, setOfferText] = useState('');
    const [isAnalyzing, setIsAnalyzing] = useState(false);
    const [result, setResult] = useState<any>(null);

    const handleNegotiate = async () => {
        setIsAnalyzing(true);
        setResult(null);
        try {
            const response = await fetch('https://the-artist-engine.onrender.com/api/negotiate', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ venue_offer: offerText })
            });

            if (!response.ok) throw new Error(`Status ${response.status}`);
            const data = await response.json();

            if (data.status === 'success') {
                setResult(JSON.parse(data.agent_response));
            } else {
                throw new Error(data.error || 'Negotiation Engine Failed');
            }
        } catch (err) {
            console.error(err);
            alert("Shark Protocol execution failed. Check console.");
        } finally {
            setIsAnalyzing(false);
        }
    };

    const formatMarkdown = (text: string) => {
        if (!text) return null;

        return text.split('\n').map((line, lineIndex) => {
            // Check for list items
            const isListItem = line.trim().startsWith('*');
            let formattedLine = line;

            if (isListItem) {
                formattedLine = line.replace(/^\*\s*/, '');
            }

            // Handle bold **text**
            const boldRegex = /\*\*(.*?)\*\*/g;
            const parts = [];
            let lastIndex = 0;
            let match;

            while ((match = boldRegex.exec(formattedLine)) !== null) {
                // Push text before the match
                if (match.index > lastIndex) {
                    parts.push(formattedLine.substring(lastIndex, match.index));
                }
                // Push the bolded match
                parts.push(<strong key={`${lineIndex}-${match.index}`} className="text-cyan-400 font-bold">{match[1]}</strong>);
                lastIndex = boldRegex.lastIndex;
            }

            // Push remaining text
            if (lastIndex < formattedLine.length) {
                parts.push(formattedLine.substring(lastIndex));
            }

            return (
                <div key={lineIndex} className={`${isListItem ? 'flex gap-3 mb-3' : 'mb-4'} ${!line.trim() ? 'h-2' : ''}`}>
                    {isListItem && <span className="text-cyan-500 shrink-0 mt-1">•</span>}
                    <div className="flex-1">
                        {parts.length > 0 ? parts : formattedLine}
                    </div>
                </div>
            );
        });
    };

    return (
        <div className="space-y-6">
            <div className="flex items-end justify-between border-b border-white/10 pb-4">
                <div>
                    <h2 className="font-cinzel text-3xl font-bold text-white tracking-widest flex items-center gap-3">
                        <Briefcase className="text-red-500 drop-shadow-[0_0_10px_rgba(239,68,68,0.8)]" />
                        SHARK PROTOCOL
                    </h2>
                    <p className="font-mono text-xs text-gray-400 mt-1 tracking-widest uppercase">
                        Hostile Offer Analysis // Tactical Rebuttal Engine
                    </p>
                </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">

                {/* Terminal Input */}
                <div className="glass-card rounded-2xl flex flex-col border border-red-900/40 relative overflow-hidden group focus-within:border-red-500/50 transition-colors shadow-2xl">
                    <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-red-600 to-transparent" />
                    <div className="p-4 border-b border-white/5 bg-black/40 flex justify-between items-center">
                        <span className="font-mono text-xs text-gray-400 tracking-widest flex items-center gap-2">
                            <MessageSquare size={14} className="text-red-500" /> PROMOTER TERMINAL
                        </span>
                        <span className="flex h-2 w-2 relative">
                            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-red-400 opacity-75" />
                            <span className="relative inline-flex rounded-full h-2 w-2 bg-red-500" />
                        </span>
                    </div>

                    <textarea
                        className="flex-1 bg-transparent p-6 text-sm font-mono text-gray-300 focus:outline-none resize-none placeholder-gray-700 min-h-[300px]"
                        placeholder="PASTE PREDATORY OFFER HERE...&#10;&#10;e.g. 'We can offer you a 30 minute slot. $50 pay, plus 2 drink tickets. You must bring 20 people otherwise no pay.'"
                        value={offerText}
                        onChange={e => setOfferText(e.target.value)}
                    />

                    <div className="p-4 bg-black/60 border-t border-white/5 flex justify-end">
                        <button
                            onClick={handleNegotiate}
                            disabled={!offerText || isAnalyzing}
                            className="bg-red-900/30 text-red-500 border border-red-500/50 hover:bg-red-500 hover:text-black hover:shadow-[0_0_20px_rgba(239,68,68,0.4)] px-8 py-3 rounded tracking-widest font-mono text-xs uppercase font-bold transition-all disabled:opacity-50 flex items-center gap-2"
                        >
                            {isAnalyzing ? <Target size={16} className="animate-spin" /> : <Sword size={16} />}
                            {isAnalyzing ? "FORMULATING COUNTER-OFFENSIVE..." : "UNLEASH SHARK"}
                        </button>
                    </div>
                </div>

                {/* Analysis Output Container */}
                <div className="flex flex-col h-full gap-4 relative">

                    {!result && !isAnalyzing && (
                        <div className="flex-1 glass-card border-dashed border-white/10 rounded-2xl flex items-center justify-center p-8 text-center bg-black/20">
                            <p className="font-mono text-sm text-gray-600 tracking-widest uppercase">
                                Awaiting target offer to begin forensic parsing.
                            </p>
                        </div>
                    )}

                    {isAnalyzing && (
                        <div className="flex-1 flex flex-col items-center justify-center">
                            <LoadingProgressBar
                                active={isAnalyzing}
                                message="DISSECTING LEVERAGE POINTS"
                                subMessage="Applying psychological pressure structures. Engine may take up to 30s to initiate."
                                colorClass="red"
                                estimatedDurationMs={20000}
                            />
                        </div>
                    )}

                    {result && (
                        <motion.div
                            key="result"
                            initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }}
                            className="flex-1 flex flex-col gap-4"
                        >
                            {/* Defensive Logic Box */}
                            <div className="glass-card p-6 rounded-2xl border-l-[4px] border-l-red-500 flex-1 relative group hover:bg-red-950/20 transition-colors">
                                <div className="flex items-center gap-2 mb-4 text-red-400 font-mono text-xs uppercase tracking-widest border-b border-red-900/30 pb-2">
                                    <AlertTriangle size={14} /> Internal Shark Logic
                                </div>
                                <p className="text-sm font-mono text-gray-300 leading-relaxed max-w-lg">
                                    {result.reasoning}
                                </p>
                            </div>

                            {/* Counter-Offer Email */}
                            <div className="glass-card p-6 rounded-2xl border-l-[4px] border-l-cyan-500 flex-1 relative">
                                <div className="absolute top-4 right-4 text-[10px] font-mono tracking-widest text-cyan-500 flex items-center gap-1 border border-cyan-500/20 px-2 py-1 rounded bg-cyan-900/20">
                                    <ShieldCheck size={12} /> READY TO DEPLOY
                                </div>
                                <div className="flex items-center gap-2 mb-4 text-cyan-400 font-mono text-xs uppercase tracking-widest border-b border-cyan-900/30 pb-2">
                                    <Sword size={14} /> Sovereign Counter-Offer
                                </div>
                                <div className="text-sm font-inter text-gray-200 leading-relaxed bg-black/40 p-6 rounded mt-4 border border-white/5 shadow-inner">
                                    {formatMarkdown(result.counter_offer)}
                                </div>
                                {/* Copy Button */}
                                <div className="mt-4 flex justify-end">
                                    <button className="font-mono text-[10px] tracking-widest uppercase text-white hover:text-cyan-400 bg-white/5 px-4 py-2 rounded transition-colors border border-white/10">
                                        [ COPY TO CLIPBOARD ]
                                    </button>
                                </div>
                            </div>
                        </motion.div>
                    )}
                </div>
            </div>
        </div>
    );
}
