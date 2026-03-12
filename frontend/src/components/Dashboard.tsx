import { motion } from 'framer-motion';
import { Activity, Zap, TrendingUp, Music, BarChart, ShieldAlert } from 'lucide-react';

export default function Dashboard() {
    const stats = [
        { label: 'ACTIVE STREAMS', value: '1.24M', icon: Music, color: 'text-red-600' },
        { label: 'REVENUE BALANCE', value: '$42,050', icon: TrendingUp, color: 'text-red-600' },
        { label: 'THREATS NEUTRALIZED', value: '14', icon: ShieldAlert, color: 'text-red-700' },
        { label: 'GLOBAL REACH', value: '88.4K', icon: Zap, color: 'text-red-500' }
    ];

    return (
        <div className="space-y-6">

            {/* Header */}
            <div className="flex items-end justify-between border-b border-red-900/10 pb-4">
                <div>
                    <h2 className="font-cinzel text-3xl font-bold text-red-700 tracking-widest text-glow">COMMAND CENTER</h2>
                    <p className="font-mono text-xs text-red-900/60 tracking-widest uppercase mt-1">Holistic View // System Nomimal // Level 4 Access</p>
                </div>
                <div className="hidden md:flex items-center gap-2">
                    <span className="relative flex h-3 w-3">
                        <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-green-400 opacity-75"></span>
                        <span className="relative inline-flex rounded-full h-3 w-3 bg-green-500"></span>
                    </span>
                    <span className="font-mono text-[10px] tracking-widest text-green-400 bg-green-900/30 px-2 py-1 border border-green-500/50 rounded drop-shadow-[0_0_8px_rgba(74,222,128,0.5)]">
                        LIVE TELEMETRY
                    </span>
                </div>
            </div>

            {/* Hero Sparklines */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                {stats.map((stat, i) => (
                    <motion.div
                        initial={{ opacity: 0, scale: 0.95 }}
                        animate={{ opacity: 1, scale: 1 }}
                        transition={{ delay: i * 0.1 }}
                        key={i}
                        className="glass-card p-6 rounded-xl flex flex-col justify-between group"
                    >
                        <div className="flex items-start justify-between">
                            <stat.icon size={20} className={`${stat.color} mb-4 group-hover:scale-110 transition-transform`} />
                            <Activity size={14} className="text-red-900/20" />
                        </div>

                        <div>
                            <div className="text-xs sm:text-[10px] font-mono text-red-900/60 tracking-widest uppercase mb-1">{stat.label}</div>
                            {stat.label === 'REVENUE BALANCE' ? (
                                <div className="flex flex-col gap-1">
                                    <div className="font-mono text-3xl font-bold text-red-800 tracking-tight leading-none">{stat.value}</div>
                                    <div className="font-mono text-sm text-yellow-700 tracking-tight font-bold flex items-center gap-1 drop-shadow-sm">
                                        <span className="font-sans font-bold text-yellow-600">Ξ</span> 14.50 ETH
                                    </div>
                                </div>
                            ) : (
                                <div className="font-mono text-3xl font-bold text-red-800 tracking-tight">
                                    {stat.value}
                                </div>
                            )}
                        </div>

                        {/* Sparkline decoration */}
                        <div className="w-full h-1 bg-sky-800/10 rounded-full mt-4 overflow-hidden relative">
                            <motion.div
                                className="absolute left-0 top-0 h-full bg-red-500/50"
                                initial={{ width: 0 }}
                                animate={{ width: `${(i * 25 + 35) % 60 + 20}%` }}
                                transition={{ duration: 1.5, delay: i * 0.2 }}
                            />
                        </div>
                    </motion.div>
                ))}
            </div>

            {/* Main Graph Area */}
            <div className="glass-card p-4 md:p-8 rounded-xl min-h-[300px] md:min-h-[400px] border-glow flex flex-col relative overflow-hidden group border-red-400/30 shadow-[0_0_40px_rgba(220,38,38,0.05)]">
                {/* Background Art - Blended and Resized */}
                <div
                    className="absolute inset-0 bg-contain bg-center bg-no-repeat opacity-[0.05] z-0 group-hover:opacity-10 transition-all duration-700 pointer-events-none mix-blend-multiply"
                    style={{ backgroundImage: "url('/site/favicon.png')" }}
                />

                <div className="absolute top-0 right-0 p-4 z-10">
                    <div className="h-4 w-4 rounded-sm border border-red-400/20 bg-sky-800/10 flex items-center justify-center">
                        <BarChart size={10} className="text-red-500" />
                    </div>
                </div>

                <h3 className="font-cinzel text-lg md:text-xl text-red-700 tracking-widest mb-1 relative z-10">REVENUE VELOCITY</h3>
                <p className="font-mono text-[9px] md:text-[10px] text-red-900/60 tracking-widest uppercase relative z-10">7-Day Trajectory Overview</p>

                <div className="flex-1 flex items-center justify-center mt-8 border border-red-900/10 bg-white/40 rounded-lg relative overflow-hidden">
                    {/* Fake Graph Lines - Tron style */}
                    <div className="absolute inset-0 bg-[linear-gradient(to_right,rgba(220,38,38,0.05)_1px,transparent_1px),linear-gradient(to_bottom,rgba(220,38,38,0.05)_1px,transparent_1px)] bg-[size:40px_40px]" />
                    <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,rgba(220,38,38,0.1),transparent_70%)]" />
                    <div className="text-red-700 font-mono text-xs sm:text-sm tracking-widest flex items-center gap-2 relative z-10 shadow-[0_0_20px_rgba(220,38,38,0.2)] bg-white/95 backdrop-blur-md px-4 py-3 sm:py-2 border border-red-400/30 rounded">
                        <Activity size={16} className="text-red-600 animate-pulse" />
                        AWAITING DATA SYNC...
                    </div>
                </div>
            </div>
        </div>
    );
}
