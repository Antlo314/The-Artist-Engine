import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Radar, Target, MapPin, Activity, DollarSign, BrainCircuit, Search, Music2, AlertTriangle, Users, Calendar, Send, X, ShieldAlert } from 'lucide-react';

interface GigRadarProps {
    agentName?: string;
    artistAlias?: string;
}

export default function GigRadar({ agentName = "The Manager", artistAlias = "The Artist" }: GigRadarProps) {
    // Search State
    const [city, setCity] = useState('Chicago');
    const [genre, setGenre] = useState('Deep House');
    const [tier, setTier] = useState('Mid-Size Touring');
    const [radius, setRadius] = useState('50 miles');
    const [timeframe, setTimeframe] = useState('Fall 2026');

    // UI State
    const [isScouting, setIsScouting] = useState(false);
    const [scanPhase, setScanPhase] = useState(0);
    const [gigs, setGigs] = useState<any[]>([]);
    const [error, setError] = useState<string | null>(null);

    // Pitch Modal State
    const [pitchModal, setPitchModal] = useState<any | null>(null);
    const [pitchRoutingTo, setPitchRoutingTo] = useState<string>('');
    const [generatedPitch, setGeneratedPitch] = useState<string>('');
    const [isDrafting, setIsDrafting] = useState(false);

    // Reputation Modal State
    const [repModal, setRepModal] = useState<any | null>(null);

    React.useEffect(() => {
        let interval: NodeJS.Timeout;
        if (isScouting) {
            setScanPhase(0);
            interval = setInterval(() => {
                setScanPhase(prev => (prev < 3 ? prev + 1 : 0));
            }, 2500);
        }
        return () => clearInterval(interval);
    }, [isScouting]);

    const handleScout = async () => {
        setIsScouting(true);
        setError(null);
        setGigs([]);
        try {
            const response = await fetch('https://the-artist-engine.onrender.com/api/scout', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ city, genre, tier, radius, timeframe })
            });
            if (!response.ok) throw new Error(`Status ${response.status}`);
            const data = await response.json();
            if (data.status === 'success') {
                setGigs(data.gigs.venues || []);
            } else {
                throw new Error(data.error || 'API Error');
            }
        } catch (err: any) {
            console.error(err);
            setError(`Intercept Failed: ${err.message}`);
        } finally {
            setIsScouting(false);
        }
    };

    const handleEngageShark = async (targetGig: any) => {
        setPitchModal(targetGig);
        setPitchRoutingTo(targetGig.contact || '');
        setGeneratedPitch('');
        setIsDrafting(true);
        try {
            const response = await fetch('https://the-artist-engine.onrender.com/api/draft-pitch', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    venue_name: targetGig.name,
                    venue_tier: targetGig.tier || tier,
                    genre: genre,
                    contact_persona: targetGig.contact_persona || 'Booking Team',
                    payout_model: targetGig.payout_model || 'Standard',
                    artist_name: artistAlias,
                    agent_name: agentName
                })
            });
            if (!response.ok) throw new Error(`Status ${response.status}`);
            const data = await response.json();
            if (data.status === 'success') {
                setGeneratedPitch(data.pitch);
            } else {
                throw new Error(data.error);
            }
        } catch (err: any) {
            setGeneratedPitch('NETWORK ERROR GENERATING PITCH. OFFLINE MANUAL OVERRIDE REQUIRED.');
        } finally {
            setIsDrafting(false);
        }
    };

    const handleDeployPitch = (gigIdx: number) => {
        // Simulate sending pitch and update pipeline status
        const newGigs = [...gigs];
        newGigs[gigIdx].pipeline_status = 'PITCHED';
        setGigs(newGigs);
        setPitchModal(null);
    };

    const getScoreColor = (scoreStr: string) => {
        const score = parseInt(scoreStr, 10);
        if (isNaN(score)) return 'text-gray-400';
        if (score >= 80) return 'text-green-400';
        if (score >= 50) return 'text-amber-400';
        return 'text-red-500';
    };

    return (
        <div className="space-y-8 relative">

            <div className="flex flex-col lg:flex-row gap-8">
                {/* Target Logic Side Panel */}
                <div className="glass-card w-full lg:w-1/3 xl:w-1/4 p-6 rounded-2xl relative overflow-hidden group border border-orange-500/30 shadow-[0_0_40px_rgba(249,115,22,0.05)] flex flex-col h-fit sticky top-20">
                    {/* Background Video Layer - Cleaned Up */}
                    <video
                        autoPlay
                        loop
                        muted
                        playsInline
                        className="absolute inset-0 w-full h-full object-cover opacity-30 pointer-events-none z-0 mix-blend-screen"
                    >
                        <source src="/global_sync.mp4" type="video/mp4" />
                    </video>

                    <div className="absolute right-[-50px] top-[-50px] opacity-10 pointer-events-none z-10 mix-blend-overlay">
                        <Radar size={250} className="text-orange-500 rotate-45" />
                    </div>

                    <div className="flex flex-col gap-6 relative z-10">
                        <div>
                            <h2 className="font-cinzel text-2xl font-bold text-white tracking-widest flex items-center gap-3">
                                <Radar className="text-orange-500" size={24} />
                                GIG RADAR
                            </h2>
                            <p className="font-mono text-[10px] text-gray-400 mt-2 tracking-widest uppercase">
                                Multi-Vector Grounding<br />Autonomous Array
                            </p>
                        </div>

                        <div className="flex flex-col gap-4 bg-black/60 p-5 rounded-xl border border-orange-500/10 backdrop-blur-md">
                            {/* City */}
                            <div className="relative flex flex-col text-gray-400 bg-black/50 rounded-lg px-3 py-2 border border-white/5 focus-within:border-orange-500/50 focus-within:text-orange-400 transition-colors">
                                <span className="text-[9px] uppercase tracking-widest text-orange-500/80 mb-1">Target Point</span>
                                <div className="flex items-center">
                                    <MapPin size={14} className="mr-2 opacity-70" />
                                    <input placeholder="e.g., Brooklyn, NY" type="text" value={city} onChange={e => setCity(e.target.value)} className="bg-transparent border-none outline-none text-sm font-mono w-full text-white placeholder:text-gray-600" />
                                </div>
                            </div>

                            {/* Radius */}
                            <div className="relative flex flex-col text-gray-400 bg-black/50 rounded-lg px-3 py-2 border border-white/5 focus-within:border-orange-500/50 focus-within:text-orange-400 transition-colors">
                                <span className="text-[9px] uppercase tracking-widest text-orange-500/80 mb-1">Blast Radius</span>
                                <select value={radius} onChange={e => setRadius(e.target.value)} className="bg-transparent border-none outline-none text-sm font-mono w-full text-white appearance-none cursor-pointer">
                                    <option className="bg-[#050505] border-none">Exact City</option>
                                    <option className="bg-[#050505] border-none">10 miles</option>
                                    <option className="bg-[#050505] border-none">50 miles</option>
                                    <option className="bg-[#050505] border-none">250 miles</option>
                                </select>
                            </div>

                            {/* Genre */}
                            <div className="relative flex flex-col text-gray-400 bg-black/50 rounded-lg px-3 py-2 border border-white/5 focus-within:border-orange-500/50 focus-within:text-orange-400 transition-colors">
                                <span className="text-[9px] uppercase tracking-widest text-orange-500/80 mb-1">Sonic Vector</span>
                                <select value={genre} onChange={e => setGenre(e.target.value)} className="bg-transparent border-none outline-none text-sm font-mono w-full text-white appearance-none cursor-pointer">
                                    <option className="bg-[#050505] border-none">Deep House</option>
                                    <option className="bg-[#050505] border-none">Techno</option>
                                    <option className="bg-[#050505] border-none">Indie Electronic</option>
                                    <option className="bg-[#050505] border-none">Hip Hop</option>
                                    <option className="bg-[#050505] border-none">Live Instrumentation</option>
                                </select>
                            </div>

                            {/* Tier */}
                            <div className="relative flex flex-col text-gray-400 bg-black/50 rounded-lg px-3 py-2 border border-white/5 focus-within:border-orange-500/50 focus-within:text-orange-400 transition-colors">
                                <span className="text-[9px] uppercase tracking-widest text-orange-500/80 mb-1">Venue Tier</span>
                                <select value={tier} onChange={e => setTier(e.target.value)} className="bg-transparent border-none outline-none text-sm font-mono w-full text-white appearance-none cursor-pointer">
                                    <option className="bg-[#050505] border-none">Grassroots / Mom & Pop</option>
                                    <option className="bg-[#050505] border-none">Mid-Size Touring</option>
                                    <option className="bg-[#050505] border-none">Top-Tier Theater</option>
                                </select>
                            </div>

                            {/* Timeframe */}
                            <div className="relative flex flex-col text-gray-400 bg-black/50 rounded-lg px-3 py-2 border border-white/5 focus-within:border-orange-500/50 focus-within:text-orange-400 transition-colors">
                                <span className="text-[9px] uppercase tracking-widest text-orange-500/80 mb-1">Timeframe</span>
                                <select value={timeframe} onChange={e => setTimeframe(e.target.value)} className="bg-transparent border-none outline-none text-sm font-mono w-full text-white appearance-none cursor-pointer">
                                    <option className="bg-[#050505] border-none">Active Now</option>
                                    <option className="bg-[#050505] border-none">Summer 2026</option>
                                    <option className="bg-[#050505] border-none">Fall 2026</option>
                                    <option className="bg-[#050505] border-none">Q1 2027</option>
                                </select>
                            </div>
                        </div>

                        <button
                            onClick={handleScout}
                            disabled={isScouting}
                            className="w-full bg-orange-900/40 text-orange-400 border border-orange-500/50 hover:bg-orange-500 hover:text-black font-bold font-mono text-sm tracking-widest px-6 py-4 rounded-lg flex items-center justify-center gap-2 transition-all disabled:opacity-50 disabled:cursor-wait uppercase shadow-[0_0_20px_rgba(249,115,22,0.1)] hover:shadow-[0_0_25px_rgba(249,115,22,0.4)]"
                        >
                            {isScouting ? (
                                <><Activity size={18} className="animate-spin" /> EXECUTING SWEEP...</>
                            ) : (
                                <><Target size={18} /> DEPLOY SCAN</>
                            )}
                        </button>

                    </div>
                </div>

                {error && (
                    <div className="bg-red-900/20 border border-red-500/50 text-red-500 px-4 py-3 rounded-lg font-mono text-xs tracking-widest flex items-center gap-3 mt-4 w-[calc(100%-2rem)] mx-4 md:w-auto md:mx-0">
                        <ShieldAlert size={16} /> {error}
                    </div>
                )}

                {/* Grid of Intercepted Leads */}
                <div className="flex-1 grid grid-cols-1 xl:grid-cols-2 gap-6 pb-20 items-start">
                    <AnimatePresence>
                        {!isScouting && gigs.length === 0 && !error && (
                            <motion.div
                                initial={{ opacity: 0 }}
                                animate={{ opacity: 1 }}
                                className="col-span-full py-32 flex flex-col items-center justify-center text-gray-600 glass-card rounded-2xl border-dashed border-white/5"
                            >
                                <Search size={48} className="text-gray-800 mb-4" />
                                <p className="font-mono text-sm tracking-widest uppercase">Awaiting coordinates to deploy radar sweeps.</p>
                            </motion.div>
                        )}

                        {(() => {
                            let bestIdx = -1;
                            if (!isScouting && gigs.length > 0) {
                                let maxScore = -1;
                                gigs.forEach((g, i) => {
                                    const rep = parseInt(g.reputation_score) || 0;
                                    const activeBonus = g.active_search_signal ? 20 : 0;
                                    const total = rep + activeBonus;
                                    if (total > maxScore) {
                                        maxScore = total;
                                        bestIdx = i;
                                    }
                                });
                            }
                            return null; // Will just compute bestIdx
                        })()}

                        <motion.div
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            exit={{ opacity: 0 }}
                            className={`${isScouting ? 'col-span-full' : 'hidden'} py-32 flex flex-col items-center justify-center glass-card rounded-2xl border-orange-500/30 shadow-[inset_0_0_50px_rgba(249,115,22,0.05)] relative overflow-hidden`}
                        >
                            {/* Scanning Background FX */}
                            <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,rgba(249,115,22,0.1)_0,transparent_70%)] opacity-50 pulse-slow" />
                            <div className="absolute top-0 left-0 w-full h-[2px] bg-gradient-to-r from-transparent via-orange-500 to-transparent opacity-50" style={{ animation: 'scanline 2s linear infinite' }} />

                            <div className="relative w-32 h-32 flex items-center justify-center mb-8">
                                <Radar size={64} className="text-orange-500 z-10" />
                                <div className="absolute inset-0 border-[3px] border-orange-500/30 rounded-full animate-ping" />
                                <div className="absolute inset-4 border-[3px] border-orange-400/20 rounded-full animate-ping" style={{ animationDelay: '0.4s' }} />
                                <div className="absolute inset-8 border-[2px] border-orange-300/10 rounded-full animate-ping" style={{ animationDelay: '0.8s' }} />
                            </div>

                            <div className="font-mono text-center space-y-2 relative z-10 h-16">
                                <AnimatePresence mode="wait">
                                    <motion.div
                                        key={scanPhase}
                                        initial={{ opacity: 0, y: 10 }}
                                        animate={{ opacity: 1, y: 0 }}
                                        exit={{ opacity: 0, y: -10 }}
                                        className="text-orange-400 font-bold tracking-widest uppercase text-sm"
                                    >
                                        {scanPhase === 0 && "[1/4] Bypassing Localized Firewalls..."}
                                        {scanPhase === 1 && "[2/4] Intercepting Booking Calendars..."}
                                        {scanPhase === 2 && "[3/4] Cross-Referencing Payout Models..."}
                                        {scanPhase === 3 && "[4/4] Calculating Integrity Algorithms..."}
                                    </motion.div>
                                </AnimatePresence>
                                <p className="text-[10px] text-gray-500 tracking-[0.2em] uppercase mt-2">Target Point: {city.toUpperCase()}</p>
                            </div>
                        </motion.div>
                        {(() => {
                            let alphaGigId = -1;
                            if (!isScouting && gigs.length > 0) {
                                let maxScore = -1;
                                gigs.forEach((g, i) => {
                                    const rep = parseInt(g.reputation_score) || 0;
                                    const activeBonus = g.active_search_signal ? 20 : 0;
                                    const total = rep + activeBonus;
                                    if (total > maxScore) {
                                        maxScore = total;
                                        alphaGigId = i;
                                    }
                                });
                            }

                            return !isScouting && gigs.map((gig, idx) => {
                                const isAlpha = idx === alphaGigId;

                                return (
                                    <motion.div
                                        key={idx}
                                        initial={{ opacity: 0, y: 20 }}
                                        animate={{ opacity: 1, y: 0 }}
                                        transition={{ delay: idx * 0.1 }}
                                        className={`glass-card rounded-xl p-6 relative overflow-hidden group transition-all duration-300 ${gig.pipeline_status === 'PITCHED' ? 'border-orange-500/40 opacity-80' : isAlpha ? 'border-orange-400/80 shadow-[0_0_30px_rgba(249,115,22,0.15)] ring-1 ring-orange-400/50' : 'hover:border-orange-500/60'}`}
                                    >
                                        {/* BG Accents */}
                                        <div className="absolute -top-10 -right-10 w-32 h-32 bg-orange-900/20 rounded-full blur-[40px] opacity-0 group-hover:opacity-100 transition-opacity duration-700" />
                                        {isAlpha && <div className="absolute top-0 right-0 w-full h-full bg-[radial-gradient(circle_at_top_right,rgba(249,115,22,0.1),transparent_50%)] pointer-events-none" />}

                                        <div className="flex items-center justify-between mb-4 relative z-10">
                                            <div className="flex items-center gap-2">
                                                <span className={`font-mono text-[10px] tracking-widest uppercase font-bold px-2 py-0.5 rounded shadow-lg bg-orange-900/30 text-orange-400 border border-orange-500/30 ${gig.pipeline_status === 'INTERCEPTED' ? '' : 'opacity-80'}`}>
                                                    [{gig.pipeline_status}]
                                                </span>
                                                {isAlpha && (
                                                    <span className="font-mono text-[10px] tracking-widest uppercase font-bold px-2 py-0.5 rounded shadow-[0_0_15px_rgba(249,115,22,0.4)] bg-amber-900/40 text-amber-400 border border-amber-400/80 animate-pulse">
                                                        [ALPHA TARGET]
                                                    </span>
                                                )}
                                                {gig.active_search_signal && !isAlpha && (
                                                    <span className="font-mono text-[10px] tracking-widest uppercase font-bold px-2 py-0.5 rounded shadow-lg bg-orange-900/30 text-orange-300 border border-orange-500/30 animate-pulse">
                                                        [ACTIVE SEARCH]
                                                    </span>
                                                )}
                                            </div>
                                            <button
                                                onClick={() => setRepModal(gig)}
                                                className={`font-mono text-xs tracking-widest uppercase flex items-center gap-1 font-bold shadow-md bg-black/40 px-2 py-1 rounded cursor-pointer hover:scale-105 transition-transform border border-transparent hover:border-white/20 ${getScoreColor(gig.reputation_score)}`}
                                            >
                                                REP SCORE: {gig.reputation_score || 'N/A'} <Search size={10} className="ml-1 opacity-70" />
                                            </button>
                                        </div>

                                        <h3 className="font-cinzel font-bold text-2xl text-white mb-1 leading-tight relative z-10">{gig.name}</h3>
                                        <p className="font-mono text-xs text-gray-500 mb-4">{gig.tier || tier}</p>

                                        <div className="grid grid-cols-2 gap-3 mb-6 relative z-10">
                                            <div className="bg-black/40 p-3 rounded border border-white/5 flex flex-col gap-1">
                                                <span className="font-mono text-[9px] text-orange-500/70 uppercase tracking-widest flex items-center gap-1"><DollarSign size={10} /> Payout Model</span>
                                                <span className="font-inter text-sm text-gray-200 truncate">{gig.payout_model || 'Unknown'}</span>
                                            </div>
                                            <div className="bg-black/40 p-3 rounded border border-white/5 flex flex-col gap-1">
                                                <span className="font-mono text-[9px] text-orange-500/70 uppercase tracking-widest flex items-center gap-1"><Calendar size={10} /> Lead Time</span>
                                                <span className="font-inter text-sm text-gray-200 truncate">{gig.lead_time || 'N/A'}</span>
                                            </div>
                                            <div className="bg-black/40 p-3 rounded border border-white/5 flex flex-col gap-1">
                                                <span className="font-mono text-[9px] text-orange-500/70 uppercase tracking-widest flex items-center justify-between w-full">
                                                    <span className="flex items-center gap-1"><Activity size={10} /> Contact Persona</span>
                                                    {gig.contact_source && <span className="text-orange-500 opacity-80">[{gig.contact_source}]</span>}
                                                </span>
                                                <span className="font-inter text-sm text-gray-200 truncate">{gig.contact_persona || gig.contact || 'Generic Intel'}</span>
                                            </div>
                                            <div className="bg-black/40 p-3 rounded border border-white/5 flex flex-col gap-1">
                                                <span className="font-mono text-[9px] text-orange-500/70 uppercase tracking-widest flex items-center gap-1"><Users size={10} /> Similar Acts</span>
                                                <span className="font-inter text-sm text-gray-200 truncate truncate">{gig.similar_acts ? (Array.isArray(gig.similar_acts) ? gig.similar_acts.join(', ') : gig.similar_acts) : 'None extracted'}</span>
                                            </div>
                                        </div>

                                        {/* Financial Telemetry */}
                                        <div className="flex items-center justify-between bg-black/50 border border-white/5 rounded-lg p-3 mb-6 relative z-10 w-full">
                                            <div className="flex flex-col text-center w-1/3 border-r border-white/10">
                                                <span className="font-mono text-[9px] text-gray-500 uppercase tracking-widest mb-1">Capacity</span>
                                                <span className="font-cinzel text-lg font-bold text-gray-300">{gig.capacity || 'N/A'}</span>
                                            </div>
                                            <div className="flex flex-col text-center w-1/3 border-r border-white/10">
                                                <span className="font-mono text-[9px] text-gray-500 uppercase tracking-widest mb-1">Avg Ticket</span>
                                                <span className="font-cinzel text-lg font-bold text-gray-300">{gig.avg_ticket_price_usd ? `$${gig.avg_ticket_price_usd}` : 'N/A'}</span>
                                            </div>
                                            <div className="flex flex-col text-center w-1/3 px-2">
                                                <span className="font-mono text-[9px] text-orange-400/80 uppercase tracking-widest mb-1">Gross Potential</span>
                                                <span className="font-cinzel text-xl font-bold text-orange-400 drop-shadow-[0_0_8px_rgba(249,115,22,0.3)]">{gig.gross_potential_usd ? `$${gig.gross_potential_usd.toLocaleString()}` : 'N/A'}</span>
                                            </div>
                                        </div>

                                        <div className="border-t border-white/10 pt-4 pb-16 relative z-10">
                                            {gig.leverage_point && (
                                                <div className="mb-4 bg-orange-900/10 border border-orange-500/20 rounded p-3">
                                                    <div className="flex items-center gap-2 font-mono text-[10px] text-orange-500/80 mb-1 uppercase tracking-widest">
                                                        <AlertTriangle size={12} /> Tactical Leverage Point
                                                    </div>
                                                    <p className="text-xs text-orange-100/90 font-inter italic leading-snug">"{gig.leverage_point}"</p>
                                                </div>
                                            )}
                                            <div className="flex items-center gap-2 font-mono text-xs text-orange-400/80 mb-2 uppercase tracking-widest drop-shadow-md">
                                                <BrainCircuit size={12} /> Shark Negotiation Strategy
                                            </div>
                                            <p className="text-sm text-gray-300 font-inter leading-relaxed line-clamp-3 group-hover:line-clamp-none transition-all duration-300">
                                                {gig.strategy}
                                            </p>
                                        </div>

                                        <div className="absolute bottom-0 left-0 right-0 p-4 bg-gradient-to-t from-[#0a0a0a] via-[#0a0a0a]/90 to-transparent z-20 flex justify-center border-t border-white/5">
                                            <button
                                                onClick={() => handleEngageShark(gig)}
                                                disabled={gig.pipeline_status === 'PITCHED'}
                                                className="w-full bg-orange-900/20 text-orange-400 border border-orange-500/50 hover:bg-orange-500 hover:text-black font-bold font-mono text-xs tracking-widest px-4 py-3 rounded flex items-center justify-center gap-2 transition-all disabled:opacity-30 disabled:cursor-not-allowed uppercase shadow-[0_0_15px_rgba(249,115,22,0.1)] hover:shadow-[0_0_20px_rgba(249,115,22,0.4)]"
                                            >
                                                {gig.pipeline_status === 'PITCHED' ? 'PITCH DEPLOYED' : <><Send size={14} /> ONE-CLICK ENGAGE</>}
                                            </button>
                                        </div>
                                    </motion.div>
                                );
                            });
                        })()}
                    </AnimatePresence>
                </div>
            </div>

            {/* Auto-Pitch Terminal Modal */}
            <AnimatePresence>
                {pitchModal && (
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        className="fixed inset-0 z-[99999] flex items-center justify-center bg-black/80 backdrop-blur-md p-4"
                    >
                        <motion.div
                            initial={{ scale: 0.95, y: 20 }}
                            animate={{ scale: 1, y: 0 }}
                            exit={{ scale: 0.95, y: 20 }}
                            className="bg-[#050505] border border-orange-500/50 shadow-[0_0_50px_rgba(249,115,22,0.15)] rounded-2xl w-full max-w-3xl max-h-[90vh] flex flex-col overflow-hidden"
                        >
                            {/* Modal Header */}
                            <div className="p-4 border-b border-white/10 flex items-center justify-between bg-black/50">
                                <div>
                                    <h3 className="font-cinzel text-xl font-bold text-white flex items-center gap-2">
                                        <AlertTriangle size={20} className="text-orange-500" />
                                        AUTO-PITCH TERMINAL
                                    </h3>
                                    <p className="font-mono text-[10px] text-orange-400 tracking-widest uppercase mt-1">
                                        TARGET: {pitchModal.name} // PERSONA: {pitchModal.contact_persona || 'N/A'}
                                    </p>
                                </div>
                                <button onClick={() => setPitchModal(null)} className="text-gray-500 hover:text-white transition-colors p-2">
                                    <X size={24} />
                                </button>
                            </div>

                            {/* Modal Body */}
                            <div className="p-6 overflow-y-auto flex-1 custom-scrollbar">
                                {isDrafting ? (
                                    <div className="flex flex-col items-center justify-center py-20 text-orange-400">
                                        <BrainCircuit size={48} className="animate-pulse mb-4" />
                                        <p className="font-mono text-sm tracking-widest uppercase">Synthesizing Tactical Pitch...</p>
                                        <p className="font-mono text-[10px] text-gray-500 mt-2">Correlating Venue Tier with Psychological Triggers...</p>
                                    </div>
                                ) : (
                                    <div className="space-y-4">
                                        <div className="bg-black/60 rounded border border-white/10 p-4">
                                            <div className="font-mono text-[10px] text-gray-500 mb-2 uppercase tracking-widest">Routing To (Editable):</div>
                                            <input
                                                type="text"
                                                value={pitchRoutingTo}
                                                onChange={(e) => setPitchRoutingTo(e.target.value)}
                                                placeholder="UNKNOWN - REQUIRES MANUAL ENTRY"
                                                className="font-mono text-sm text-orange-400 bg-transparent w-full outline-none border-b border-orange-500/30 focus:border-orange-400 transition-colors py-1"
                                            />
                                        </div>
                                        <div className="bg-gray-900/50 rounded-lg border border-white/5 relative group">
                                            <div className="absolute top-0 right-0 px-3 py-1 bg-black/80 rounded-bl-lg border-l border-b border-white/10 font-mono text-[9px] text-gray-500 tracking-widest">
                                                EDITABLE BUFFER
                                            </div>
                                            <textarea
                                                value={generatedPitch}
                                                onChange={(e) => setGeneratedPitch(e.target.value)}
                                                className="w-full h-80 bg-transparent text-gray-300 font-inter text-sm p-4 outline-none resize-none focus:ring-1 ring-orange-500/50 rounded-lg custom-scrollbar leading-relaxed"
                                            />
                                        </div>
                                    </div>
                                )}
                            </div>

                            {/* Modal Footer */}
                            {!isDrafting && (
                                <div className="p-4 border-t border-white/10 bg-black/80 flex justify-end gap-3">
                                    <button
                                        onClick={() => setPitchModal(null)}
                                        className="px-6 py-2 rounded font-mono text-xs tracking-widest text-gray-400 hover:text-white transition-colors uppercase"
                                    >
                                        Abort
                                    </button>
                                    <button
                                        onClick={() => handleDeployPitch(gigs.indexOf(pitchModal))}
                                        className="bg-red-900/80 text-white border border-red-500/50 hover:bg-red-600 font-bold font-mono text-xs tracking-widest px-8 py-3 rounded flex items-center gap-2 transition-all uppercase shadow-[0_0_15px_rgba(239,68,68,0.2)] hover:shadow-[0_0_25px_rgba(239,68,68,0.6)]"
                                    >
                                        <Send size={14} /> DEPLOY PITCH
                                    </button>
                                </div>
                            )}

                        </motion.div>
                    </motion.div>
                )}
            </AnimatePresence>

            {/* Reputation Explanation Modal */}
            <AnimatePresence>
                {repModal && (
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        className="fixed inset-0 z-[99999] flex items-center justify-center bg-black/80 backdrop-blur-sm p-4"
                    >
                        <motion.div
                            initial={{ scale: 0.95, y: 20 }}
                            animate={{ scale: 1, y: 0 }}
                            exit={{ scale: 0.95, y: 20 }}
                            className="bg-[#050505] border border-orange-500/50 shadow-[0_0_50px_rgba(249,115,22,0.15)] rounded-2xl w-full max-w-md flex flex-col overflow-hidden"
                        >
                            <div className="p-4 border-b border-white/10 flex items-center justify-between bg-gradient-to-r from-black via-orange-900/20 to-black">
                                <h3 className="font-mono text-sm tracking-widest text-orange-400 font-bold flex items-center gap-2 uppercase">
                                    <Search size={16} /> REPUTATION ANALYSIS
                                </h3>
                                <button onClick={() => setRepModal(null)} className="text-gray-500 hover:text-white transition-colors p-1">
                                    <X size={18} />
                                </button>
                            </div>
                            <div className="p-6">
                                <div className="flex items-center justify-between mb-4">
                                    <h4 className="font-cinzel text-xl text-white font-bold">{repModal.name}</h4>
                                    <div className={`font-mono text-sm tracking-widest uppercase font-bold px-3 py-1 rounded shadow-md border ${repModal.reputation_score >= 80 ? 'bg-green-900/30 text-green-400 border-green-500/50' : repModal.reputation_score >= 50 ? 'bg-amber-900/30 text-amber-400 border-amber-500/50' : 'bg-red-900/30 text-red-500 border-red-500/50'}`}>
                                        SCORE: {repModal.reputation_score}
                                    </div>
                                </div>
                                <div className="bg-black/60 rounded-lg border border-white/10 p-5 mt-4">
                                    <p className="font-inter text-sm text-gray-300 leading-relaxed">
                                        {repModal.reputation_explanation || "Insufficient telemetry to generate a detailed reputation profile for this venue."}
                                    </p>
                                </div>
                            </div>
                            <div className="p-4 border-t border-white/10 bg-black/80">
                                <button
                                    onClick={() => setRepModal(null)}
                                    className="w-full bg-orange-900/20 text-orange-400 border border-orange-500/30 hover:bg-orange-500 hover:text-black font-bold font-mono text-xs tracking-widest py-3 rounded transition-all uppercase"
                                >
                                    Acknowledge
                                </button>
                            </div>
                        </motion.div>
                    </motion.div>
                )}
            </AnimatePresence>

        </div>
    );
}
