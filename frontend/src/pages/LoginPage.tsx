import { useState } from 'react';
import { Link, Navigate, useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { useAuth } from '../lib/auth';

export default function LoginPage() {
    const { authEnabled, ready, session, canUseEngine, waitlisted, meError, signInWithGoogle, signOut, user } =
        useAuth();
    const [busy, setBusy] = useState(false);
    const [err, setErr] = useState<string | null>(null);
    const navigate = useNavigate();

    if (!ready) {
        return (
            <div className="min-h-screen bg-ink-950 flex items-center justify-center font-mono text-[11px] tracking-[0.3em] uppercase text-ink-400">
                Loading…
            </div>
        );
    }

    // Auth not configured → open engine (local / pre-Supabase deploy)
    if (!authEnabled) {
        return <Navigate to="/engine" replace />;
    }

    if (session && canUseEngine) {
        return <Navigate to="/engine" replace />;
    }

    const handleGoogle = async () => {
        setBusy(true);
        setErr(null);
        try {
            await signInWithGoogle();
        } catch (e: any) {
            setErr(e?.message || 'Google sign-in failed');
            setBusy(false);
        }
    };

    return (
        <div className="min-h-screen bg-ink-950 text-ink-50 flex flex-col relative overflow-hidden">
            <div className="absolute inset-0 pointer-events-none grain bg-[radial-gradient(ellipse_at_top,_#12070a_0%,_#08080a_45%,_#060607_100%)]" />

            <header className="relative z-10 flex items-center justify-between px-6 py-5">
                <Link to="/" className="flex items-center gap-2">
                    <div className="h-8 w-8 rounded bg-ink-800 border border-white/10 overflow-hidden">
                        <img src="/site/favicon.png" alt="" className="w-full h-full object-cover" />
                    </div>
                    <span className="font-display tracking-widest text-sm">THE ARTIST ENGINE</span>
                </Link>
                <Link to="/" className="font-mono text-[10px] tracking-widest uppercase text-ink-400 hover:text-ink-50">
                    ← Marketing site
                </Link>
            </header>

            <main className="relative z-10 flex-1 flex items-center justify-center p-6">
                <motion.div
                    initial={{ opacity: 0, y: 16 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="w-full max-w-md glass-obsidian border border-white/10 rounded-2xl p-8"
                >
                    <p className="font-mono text-[10px] tracking-[0.3em] uppercase text-ember-500 mb-3">
                        Founding cohort · 50 DJs
                    </p>
                    <h1 className="font-display text-3xl font-semibold tracking-tight mb-2">Sign in to Engine.OS</h1>
                    <p className="text-sm text-ink-200 leading-relaxed mb-6">
                        Google login keeps your masters, scouts, and pitches under a fair-use founding plan so the
                        engine stays fast for everyone.
                    </p>

                    {waitlisted && (
                        <div className="mb-6 rounded-xl border border-amber-500/30 bg-amber-500/10 p-4 text-sm text-amber-100">
                            <p className="font-medium mb-1">You're signed in, but not on the founding list yet.</p>
                            <p className="text-amber-100/80 text-xs leading-relaxed">
                                {meError ||
                                    'This beta is capped at 50 founding DJs. Ask the team to add your Google email to the allowlist.'}
                            </p>
                            <p className="mt-2 font-mono text-[10px] text-amber-200/70 tracking-wide">
                                {user?.email}
                            </p>
                            <button
                                onClick={() => signOut()}
                                className="mt-3 font-mono text-[10px] tracking-widest uppercase text-amber-200 underline"
                            >
                                Sign out
                            </button>
                        </div>
                    )}

                    {!session && (
                        <button
                            onClick={handleGoogle}
                            disabled={busy}
                            className="w-full flex items-center justify-center gap-3 rounded-full bg-white text-ink-950 font-display font-medium py-3.5 hover:bg-ink-200 transition-colors disabled:opacity-50"
                        >
                            <GoogleIcon />
                            {busy ? 'Redirecting…' : 'Continue with Google'}
                        </button>
                    )}

                    {session && !waitlisted && !canUseEngine && (
                        <button
                            onClick={() => navigate('/engine')}
                            className="w-full rounded-full bg-ember-600 text-white font-display py-3 hover:bg-ember-500"
                        >
                            Enter Engine
                        </button>
                    )}

                    {err && <p className="mt-4 text-sm text-red-400">{err}</p>}

                    <div className="mt-8 border-t border-white/10 pt-5 space-y-2">
                        <p className="font-mono text-[10px] tracking-widest uppercase text-ink-400">Daily fair-use</p>
                        <ul className="text-xs text-ink-200 space-y-1.5">
                            <li>15 masters · 15 venue scans · 40 pitches</li>
                            <li>15 contract scans · 20 Oracle reads · 1 master at a time</li>
                            <li>Limits reset every day — built to stop abuse, not your workflow</li>
                        </ul>
                    </div>
                </motion.div>
            </main>
        </div>
    );
}

function GoogleIcon() {
    return (
        <svg width="18" height="18" viewBox="0 0 48 48" aria-hidden>
            <path fill="#FFC107" d="M43.6 20.5H42V20H24v8h11.3C33.7 32.7 29.3 36 24 36c-6.6 0-12-5.4-12-12s5.4-12 12-12c3.1 0 5.8 1.2 8 3.1l5.7-5.7C34.2 6.1 29.4 4 24 4 12.9 4 4 12.9 4 24s8.9 20 20 20 20-8.9 20-20c0-1.3-.1-2.3-.4-3.5z" />
            <path fill="#FF3D00" d="M6.3 14.7l6.6 4.8C14.7 16 19 12 24 12c3.1 0 5.8 1.2 8 3.1l5.7-5.7C34.2 6.1 29.4 4 24 4 16.3 4 9.6 8.3 6.3 14.7z" />
            <path fill="#4CAF50" d="M24 44c5.2 0 10-2 13.6-5.2l-6.3-5.3C29.2 35.2 26.7 36 24 36c-5.3 0-9.7-3.3-11.3-8l-6.5 5C9.5 39.6 16.2 44 24 44z" />
            <path fill="#1976D2" d="M43.6 20.5H42V20H24v8h11.3c-1.1 3.2-3.5 5.7-6.6 7.1l.1.1 6.3 5.3C36.9 39.2 44 34 44 24c0-1.3-.1-2.3-.4-3.5z" />
        </svg>
    );
}
