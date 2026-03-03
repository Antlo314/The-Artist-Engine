import React, { useState, useRef } from 'react';
import { motion } from 'framer-motion';
import { Upload, Star, TrendingUp, ShieldAlert, Award, ChevronRight, Fingerprint, Lock, Zap, Save, CheckCircle } from 'lucide-react';

interface ArtistProfileProps {
    profile: any;
    setProfile: React.Dispatch<React.SetStateAction<any>>;
}

export default function ArtistProfile({ profile, setProfile }: ArtistProfileProps) {
    const [avatarPreview, setAvatarPreview] = useState<string | null>(localStorage.getItem('sovereign_avatar'));
    const [isSaved, setIsSaved] = useState(false);
    const fileInputRef = useRef<HTMLInputElement>(null);

    const handleAvatarUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (file) {
            const reader = new FileReader();
            reader.onloadend = () => {
                const base64String = reader.result as string;
                localStorage.setItem('sovereign_avatar', base64String);
                setAvatarPreview(base64String);
            };
            reader.readAsDataURL(file);
        }
    };

    const handleSave = () => {
        setIsSaved(true);
        setTimeout(() => setIsSaved(false), 3000);
    };

    return (
        <div className="h-full flex flex-col p-6 lg:p-12 overflow-hidden relative group">
            {/* Base Background Image */}
            <div
                className="absolute inset-0 bg-cover bg-center opacity-20 mix-blend-luminosity z-0 group-hover:opacity-30 transition-opacity duration-1000"
                style={{ backgroundImage: "url('/dashboard_bg.png')" }}
            />

            <div className="z-10 relative flex flex-col h-full space-y-8">
                {/* Header */}
                <div className="flex flex-col border-b border-white/10 pb-6">
                    <h1 className="font-cinzel text-4xl lg:text-5xl font-bold text-white tracking-[0.2em] uppercase flex items-center gap-4">
                        <Fingerprint className="text-yellow-500" size={36} />
                        SOVEREIGN IDENTITY
                    </h1>
                    <div className="mt-2 flex flex-col sm:flex-row sm:items-center gap-3">
                        <div className="h-px w-12 bg-yellow-500/50 hidden sm:block" />
                        <p className="font-mono text-[10px] lg:text-xs text-yellow-300/70 tracking-[0.3em] uppercase">
                            Artist Profile & Ecosystem Telemetry
                        </p>
                    </div>
                </div>

                {/* Main Content Grid */}
                <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 flex-1 overflow-y-auto custom-scrollbar pr-2 pb-24 lg:pb-0">

                    {/* LEFT PANE: Identity Card & Basic Info */}
                    <motion.div
                        initial={{ opacity: 0, x: -20 }}
                        animate={{ opacity: 1, x: 0 }}
                        transition={{ duration: 0.5 }}
                        className="lg:col-span-4 flex flex-col gap-6"
                    >
                        <div className="glass-panel p-8 rounded-2xl border-yellow-500/30 flex flex-col items-center justify-center text-center relative overflow-hidden group/card shadow-[0_0_30px_rgba(234,179,8,0.05)]">
                            <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top,_var(--tw-gradient-stops))] from-yellow-900/20 via-black/0 to-black/0 opacity-0 group-hover/card:opacity-100 transition-opacity duration-700" />

                            {/* Avatar Dropzone */}
                            <div
                                className="relative w-40 h-40 rounded-full border-2 border-dashed border-yellow-500/50 mb-6 flex items-center justify-center overflow-hidden group-hover/card:border-yellow-400 transition-colors cursor-pointer"
                                onClick={() => fileInputRef.current?.click()}
                            >
                                {avatarPreview ? (
                                    <img src={avatarPreview} alt="Artist Avatar" className="w-full h-full object-cover" />
                                ) : (
                                    <div className="flex flex-col items-center gap-2 text-yellow-500/50 group-hover/card:text-yellow-400 transition-colors">
                                        <Upload size={32} />
                                        <span className="font-mono text-[10px] tracking-widest uppercase">UPLOAD</span>
                                    </div>
                                )}
                                {/* Overlay on hover */}
                                <div className="absolute inset-0 bg-black/60 flex items-center justify-center opacity-0 hover:opacity-100 transition-opacity">
                                    <span className="font-mono text-xs text-white tracking-widest">CHANGE</span>
                                </div>
                                <input
                                    type="file"
                                    ref={fileInputRef}
                                    onChange={handleAvatarUpload}
                                    className="hidden"
                                    accept="image/*"
                                />
                            </div>

                            {/* Alias Input */}
                            <div className="w-full relative z-10 space-y-4 text-left">
                                <div>
                                    <label className="font-mono text-[9px] text-yellow-500/70 uppercase tracking-widest pl-2 mb-1 block">Artist / Project Alias</label>
                                    <input
                                        type="text"
                                        value={profile.artistAlias}
                                        onChange={(e) => setProfile({ ...profile, artistAlias: e.target.value })}
                                        placeholder="ECHOVELOCITY"
                                        className="w-full bg-black/50 border-b border-yellow-500/30 text-white font-cinzel text-xl text-center py-2 px-4 focus:outline-none focus:border-yellow-400 focus:bg-yellow-900/10 transition-all placeholder:text-gray-600 tracking-widest"
                                    />
                                </div>
                                <div className="grid grid-cols-2 gap-4">
                                    <div>
                                        <label className="font-mono text-[9px] text-yellow-500/70 uppercase tracking-widest pl-2 mb-1 block">Manager Name</label>
                                        <input
                                            type="text"
                                            value={profile.agentName}
                                            onChange={(e) => setProfile({ ...profile, agentName: e.target.value })}
                                            placeholder="Alex Chen"
                                            className="w-full bg-black/50 border border-yellow-500/20 text-white font-inter text-sm py-2 px-3 rounded focus:outline-none focus:border-yellow-400 focus:bg-yellow-900/10 transition-all placeholder:text-gray-600"
                                        />
                                    </div>
                                    <div>
                                        <label className="font-mono text-[9px] text-yellow-500/70 uppercase tracking-widest pl-2 mb-1 block">Primary Phone</label>
                                        <input
                                            type="text"
                                            value={profile.agentPhone}
                                            onChange={(e) => setProfile({ ...profile, agentPhone: e.target.value })}
                                            placeholder="+1 (555) 000-0000"
                                            className="w-full bg-black/50 border border-yellow-500/20 text-white font-inter text-sm py-2 px-3 rounded focus:outline-none focus:border-yellow-400 focus:bg-yellow-900/10 transition-all placeholder:text-gray-600"
                                        />
                                    </div>
                                </div>
                                <div>
                                    <label className="font-mono text-[9px] text-yellow-500/70 uppercase tracking-widest pl-2 mb-1 block">Routing Email</label>
                                    <input
                                        type="email"
                                        value={profile.agentEmail}
                                        onChange={(e) => setProfile({ ...profile, agentEmail: e.target.value })}
                                        placeholder="mgmt@echovelocity.com"
                                        className="w-full bg-black/50 border border-yellow-500/20 text-white font-inter text-sm py-2 px-3 rounded focus:outline-none focus:border-yellow-400 focus:bg-yellow-900/10 transition-all placeholder:text-gray-600"
                                    />
                                </div>
                                <div>
                                    <label className="font-mono text-[9px] text-yellow-500/70 uppercase tracking-widest pl-2 mb-1 block">Primary Web/Social Link</label>
                                    <input
                                        type="text"
                                        value={profile.agentSocial}
                                        onChange={(e) => setProfile({ ...profile, agentSocial: e.target.value })}
                                        placeholder="https://instagram.com/artist"
                                        className="w-full bg-black/50 border border-yellow-500/20 text-white font-inter text-sm py-2 px-3 rounded focus:outline-none focus:border-yellow-400 focus:bg-yellow-900/10 transition-all placeholder:text-gray-600"
                                    />
                                </div>

                                <button
                                    onClick={handleSave}
                                    className="w-full mt-4 bg-yellow-900/30 hover:bg-yellow-500 hover:text-black border border-yellow-500/50 text-yellow-500 transition-all py-3 rounded uppercase font-mono text-xs tracking-widest font-bold flex items-center justify-center gap-2"
                                >
                                    {isSaved ? <><CheckCircle size={14} /> IDENTITY SAVED</> : <><Save size={14} /> SAVE IDENTITY</>}
                                </button>
                            </div>

                            {/* Status Pill */}
                            <div className="mt-6 inline-flex items-center gap-2 bg-yellow-900/20 border border-yellow-500/30 px-3 py-1 rounded-full">
                                <div className="w-2 h-2 rounded-full bg-yellow-400 animate-pulse shadow-[0_0_8px_rgba(234,179,8,0.8)]" />
                                <span className="font-mono text-[10px] text-yellow-500 tracking-widest uppercase">Ecosystem Linked</span>
                            </div>
                        </div>

                        {/* Quick Stats Summary */}
                        <div className="glass-panel p-6 rounded-2xl border-white/5 space-y-4">
                            <h3 className="font-mono text-xs text-gray-400 tracking-widest uppercase mb-4 border-b border-white/10 pb-2">
                                Identity Verification
                            </h3>
                            <div className="flex items-center justify-between text-sm">
                                <span className="font-mono text-gray-500">Tier Status:</span>
                                <span className="font-cinzel text-white tracking-wider flex items-center gap-1">
                                    <Star size={14} className="text-yellow-500" /> OMEGA
                                </span>
                            </div>
                            <div className="flex items-center justify-between text-sm">
                                <span className="font-mono text-gray-500">Member Since:</span>
                                <span className="font-mono text-white tracking-widest">2026.03</span>
                            </div>
                            <div className="flex items-center justify-between text-sm">
                                <span className="font-mono text-gray-500">Network Sync:</span>
                                <span className="font-mono text-green-400 tracking-widest">100% SECURE</span>
                            </div>
                        </div>
                    </motion.div>

                    {/* RIGHT PANE: Telemetry & Premium Arsenal */}
                    <div className="lg:col-span-8 flex flex-col gap-8">

                        {/* Aggregated Telemetry Row */}
                        <motion.div
                            initial={{ opacity: 0, y: 20 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ duration: 0.5, delay: 0.2 }}
                            className="grid grid-cols-1 sm:grid-cols-2 gap-4"
                        >
                            <div className="glass-card p-6 rounded-xl border-l-2 border-yellow-500 flex flex-col justify-between group/stat hover:bg-yellow-900/10 transition-colors">
                                <div className="flex justify-between items-start mb-4">
                                    <h4 className="font-mono text-xs text-gray-400 tracking-widest uppercase">Total Gigs Secured</h4>
                                    <TrendingUp size={16} className="text-yellow-500" />
                                </div>
                                <div className="flex items-baseline gap-2">
                                    <span className="font-cinzel text-4xl text-white">124</span>
                                    <span className="font-mono text-xs text-green-400">+12%</span>
                                </div>
                            </div>

                            <div className="glass-card p-6 rounded-xl border-l-2 border-yellow-500 flex flex-col justify-between group/stat hover:bg-yellow-900/10 transition-colors">
                                <div className="flex justify-between items-start mb-4">
                                    <h4 className="font-mono text-xs text-gray-400 tracking-widest uppercase">Contracts Nullified</h4>
                                    <ShieldAlert size={16} className="text-yellow-500" />
                                </div>
                                <div className="flex items-baseline gap-2">
                                    <span className="font-cinzel text-4xl text-white">8</span>
                                    <span className="font-mono text-[10px] text-gray-500 uppercase tracking-widest">Via Zion Sentinel</span>
                                </div>
                            </div>
                        </motion.div>

                        {/* Premium Arsenal (Locked Features Teaser) */}
                        <motion.div
                            initial={{ opacity: 0, y: 20 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ duration: 0.5, delay: 0.4 }}
                            className="glass-panel rounded-2xl border-white/5 flex-1 p-8 relative overflow-hidden flex flex-col"
                        >
                            <div className="absolute top-0 right-0 p-12 opacity-5 pointer-events-none">
                                <Award size={200} className="text-yellow-500" />
                            </div>

                            <div className="flex items-center gap-3 mb-8">
                                <Award className="text-yellow-500" size={24} />
                                <h3 className="font-cinzel text-2xl text-white tracking-[0.1em] uppercase">Premium Arsenal</h3>
                            </div>

                            <p className="font-mono text-xs text-gray-400 tracking-widest uppercase mb-8 leading-relaxed max-w-2xl">
                                Access elite-tier tools and global industry intelligence. Unlock the full potential of the Sovereign Ecosystem.
                            </p>

                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 flex-1">
                                {/* Locked Feature 1 */}
                                <div className="bg-black/40 border border-white/5 rounded-xl p-6 relative group/locked overflow-hidden">
                                    <div className="absolute inset-0 bg-yellow-900/0 group-hover/locked:bg-yellow-900/10 transition-colors duration-300" />
                                    <div className="relative z-10 flex flex-col h-full">
                                        <div className="flex justify-between items-start mb-4">
                                            <div className="w-10 h-10 rounded-lg bg-white/5 flex items-center justify-center">
                                                <Fingerprint className="text-gray-500" size={20} />
                                            </div>
                                            <Lock size={16} className="text-gray-600" />
                                        </div>
                                        <h4 className="font-cinzel text-lg text-white mb-2">Global Routing Intelligence</h4>
                                        <p className="font-mono text-[10px] text-gray-500 leading-relaxed mb-6 flex-1">
                                            AI-driven tour routing analyzing regional Spotify listener density and venue history.
                                        </p>
                                        <button className="flex items-center justify-between w-full font-mono text-xs text-yellow-500 hover:text-yellow-400 uppercase tracking-widest group/btn">
                                            <span>Learn More</span>
                                            <ChevronRight size={14} className="transform group-hover/btn:translate-x-1 transition-transform" />
                                        </button>
                                    </div>
                                </div>

                                {/* Locked Feature 2 */}
                                <div className="bg-black/40 border border-white/5 rounded-xl p-6 relative group/locked overflow-hidden">
                                    <div className="absolute inset-0 bg-yellow-900/0 group-hover/locked:bg-yellow-900/10 transition-colors duration-300" />
                                    <div className="relative z-10 flex flex-col h-full">
                                        <div className="flex justify-between items-start mb-4">
                                            <div className="w-10 h-10 rounded-lg bg-white/5 flex items-center justify-center">
                                                <Zap className="text-gray-500" size={20} />
                                            </div>
                                            <Lock size={16} className="text-gray-600" />
                                        </div>
                                        <h4 className="font-cinzel text-lg text-white mb-2">Sync Licensing Oracle</h4>
                                        <p className="font-mono text-[10px] text-gray-500 leading-relaxed mb-6 flex-1">
                                            Automated pitch engine directly connecting your master catalog to Netflix, HBO, and gaming supervisors.
                                        </p>
                                        <button className="flex items-center justify-between w-full font-mono text-xs text-yellow-500 hover:text-yellow-400 uppercase tracking-widest group/btn">
                                            <span>Learn More</span>
                                            <ChevronRight size={14} className="transform group-hover/btn:translate-x-1 transition-transform" />
                                        </button>
                                    </div>
                                </div>
                            </div>

                            <div className="mt-8 pt-6 border-t border-white/5 flex justify-center">
                                <button className="px-8 py-3 bg-white/5 hover:bg-yellow-500 hover:text-black text-yellow-500 border border-yellow-500/50 hover:border-yellow-500 transition-all font-cinzel tracking-widest text-sm rounded-lg shadow-[0_0_15px_rgba(234,179,8,0)] hover:shadow-[0_0_20px_rgba(234,179,8,0.4)] block w-full sm:w-auto text-center font-bold">
                                    UPGRADE TO OMEGA TIER
                                </button>
                            </div>
                        </motion.div>

                    </div>
                </div>
            </div>
        </div>
    );
}
