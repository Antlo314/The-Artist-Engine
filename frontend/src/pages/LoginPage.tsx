import { useEffect, useState } from 'react';
import { Link, Navigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { useAuth } from '../lib/auth';
import { ApiError } from '../lib/api';
import ThemeToggle from '../components/ThemeToggle';
import BrandMark from '../components/BrandMark';
import { isSupabaseConfigured, signInWithGoogleSupabase, getSupabase } from '../lib/supabase';

declare global {
    interface Window {
        google?: any;
    }
}

const GOOGLE_CLIENT_ID = (import.meta as any).env?.VITE_GOOGLE_CLIENT_ID || '';

export default function LoginPage() {
    const { ready, isSignedIn, canUseEngine, login, register, loginWithGoogle, loginWithSupabaseToken } = useAuth();
    const [mode, setMode] = useState<'login' | 'register' | 'reset'>('login');
    const [name, setName] = useState('');
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [resetCode, setResetCode] = useState('');
    const [busy, setBusy] = useState(false);
    const [err, setErr] = useState<string | null>(null);
    const [info, setInfo] = useState<string | null>(null);
    const [supabaseReady, setSupabaseReady] = useState(isSupabaseConfigured());

    // Complete Supabase OAuth redirect: exchange session → Engine token
    useEffect(() => {
        if (!isSupabaseConfigured()) return;
        const sb = getSupabase();
        if (!sb) return;

        let cancelled = false;
        (async () => {
            // Handle hash/query from Google redirect
            const { data } = await sb.auth.getSession();
            const token = data.session?.access_token;
            if (!token || cancelled) return;
            // Only bridge if we don't already have engine session
            try {
                setBusy(true);
                setInfo('Finishing Google sign-in…');
                await loginWithSupabaseToken(token);
            } catch (ex: any) {
                if (!cancelled) {
                    setErr(ex instanceof ApiError ? ex.message : ex?.message || 'Supabase bridge failed');
                }
            } finally {
                if (!cancelled) setBusy(false);
            }
        })();

        const { data: sub } = sb.auth.onAuthStateChange(async (event, session) => {
            if (event === 'SIGNED_IN' && session?.access_token) {
                try {
                    setBusy(true);
                    await loginWithSupabaseToken(session.access_token);
                } catch (ex: any) {
                    setErr(ex?.message || 'Could not complete Google login');
                } finally {
                    setBusy(false);
                }
            }
        });
        return () => {
            cancelled = true;
            sub.subscription.unsubscribe();
        };
    }, [loginWithSupabaseToken]);

    useEffect(() => {
        setSupabaseReady(isSupabaseConfigured());
        if (GOOGLE_CLIENT_ID && !isSupabaseConfigured()) {
            const existing = document.querySelector('script[data-google-gsi]');
            if (existing) return;
            const s = document.createElement('script');
            s.src = 'https://accounts.google.com/gsi/client';
            s.async = true;
            s.dataset.googleGsi = '1';
            document.head.appendChild(s);
        }
    }, []);

    if (!ready) {
        return (
            <div className="min-h-screen bg-ink-950 flex items-center justify-center font-mono text-[11px] tracking-[0.3em] uppercase text-ink-400">
                Loading…
            </div>
        );
    }

    if (isSignedIn && canUseEngine) {
        return <Navigate to="/engine" replace />;
    }

    const handleGoogleCredential = async (response: { credential?: string }) => {
        if (!response?.credential) return;
        setBusy(true);
        setErr(null);
        try {
            await loginWithGoogle(response.credential);
        } catch (ex: any) {
            setErr(ex instanceof ApiError ? ex.message : ex?.message || 'Google sign-in failed');
        } finally {
            setBusy(false);
        }
    };

    const startGoogle = async () => {
        setErr(null);
        setInfo(null);
        // Preferred: Supabase Google (project already connected)
        if (supabaseReady) {
            setBusy(true);
            try {
                await signInWithGoogleSupabase();
                // redirect happens — no further work
            } catch (ex: any) {
                setErr(ex?.message || 'Could not start Google via Supabase');
                setBusy(false);
            }
            return;
        }
        if (!GOOGLE_CLIENT_ID) {
            const mockEmail = window.prompt('Dev Google mock email', 'investor@example.com');
            if (!mockEmail) return;
            const mockName = window.prompt('Display name', 'Investor Pilot') || 'Investor Pilot';
            setBusy(true);
            loginWithGoogle(`mock:${mockEmail}:${mockName}`)
                .catch((ex: any) => setErr(ex?.message || 'Mock Google failed — set GOOGLE_AUTH_MOCK=1 on API or configure Supabase'))
                .finally(() => setBusy(false));
            return;
        }
        if (!window.google?.accounts?.id) {
            setErr('Google script still loading — try again in a second.');
            return;
        }
        window.google.accounts.id.initialize({
            client_id: GOOGLE_CLIENT_ID,
            callback: handleGoogleCredential,
        });
        window.google.accounts.id.prompt();
    };

    const submit = async (e: React.FormEvent) => {
        e.preventDefault();
        setBusy(true);
        setErr(null);
        setInfo(null);
        try {
            if (mode === 'register') {
                await register(name, email, password);
            } else if (mode === 'reset') {
                const { apiJson } = await import('../lib/api');
                if (!resetCode) {
                    const res = await apiJson<any>('/api/auth/forgot-password', {
                        method: 'POST',
                        headers: { 'Content-Type': 'application/json' },
                        body: JSON.stringify({ email }),
                    });
                    if (res.code) {
                        setResetCode(res.code);
                        setInfo(`Beta reset code: ${res.code} (also logged on server). Enter a new password and submit.`);
                    } else {
                        setInfo(res.message || 'If that email exists, a code was issued.');
                    }
                } else {
                    await apiJson('/api/auth/reset-password', {
                        method: 'POST',
                        headers: { 'Content-Type': 'application/json' },
                        body: JSON.stringify({ email, code: resetCode, new_password: password }),
                    });
                    setInfo('Password updated. Sign in with your new password.');
                    setMode('login');
                    setResetCode('');
                }
            } else {
                await login(email, password);
            }
        } catch (ex: any) {
            const msg =
                ex instanceof ApiError
                    ? typeof ex.payload === 'string'
                        ? ex.payload
                        : ex.message
                    : ex?.message || 'Sign-in failed';
            setErr(msg);
        } finally {
            setBusy(false);
        }
    };

    return (
        <div className="min-h-screen bg-ink-950 text-ink-50 flex flex-col relative overflow-hidden">
            <div className="absolute inset-0 pointer-events-none grain bg-[radial-gradient(ellipse_at_top,_#12070a_0%,_#08080a_45%,_#060607_100%)]" />

            <header className="relative z-10 flex items-center justify-between px-6 py-5">
                <Link to="/" className="inline-flex">
                    <BrandMark size="md" variant="full" />
                </Link>
                <div className="flex items-center gap-2">
                    <ThemeToggle />
                    <Link to="/pricing" className="font-mono text-[10px] tracking-widest uppercase text-ink-400 hover:text-ink-50">
                        Pricing
                    </Link>
                    <Link to="/" className="font-mono text-[10px] tracking-widest uppercase text-ink-400 hover:text-ink-50">
                        ← Back
                    </Link>
                </div>
            </header>

            <main className="relative z-10 flex-1 flex items-center justify-center p-6">
                <motion.div
                    initial={{ opacity: 0, y: 16 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="w-full max-w-md glass-obsidian border border-white/10 rounded-2xl p-8"
                >
                    <p className="font-mono text-[10px] tracking-[0.3em] uppercase text-ember-500 mb-3">
                        thesourceengine.com
                    </p>
                    <h1 className="font-display text-3xl font-semibold tracking-tight mb-2">
                        {mode === 'register' ? 'Create your account' : mode === 'reset' ? 'Reset password' : 'Sign in'}
                    </h1>
                    <p className="text-sm text-ink-200 leading-relaxed mb-6">
                        {mode === 'reset'
                            ? 'Free reset: we issue a 6-digit code (shown in beta without email SMTP).'
                            : supabaseReady
                              ? 'Continue with Google (Supabase Auth) — recommended. Email works as fallback.'
                              : 'Continue with Google when configured, or email & password.'}
                    </p>

                    {mode !== 'reset' && (
                        <div className="mb-5 space-y-3">
                            <button
                                type="button"
                                disabled={busy}
                                onClick={startGoogle}
                                className="w-full flex items-center justify-center gap-2 py-3 rounded-full border border-white/15 bg-white text-ink-950 font-medium text-sm hover:bg-ink-100 transition-colors disabled:opacity-50"
                            >
                                <svg width="18" height="18" viewBox="0 0 48 48" aria-hidden>
                                    <path fill="#FFC107" d="M43.6 20.5H42V20H24v8h11.3C33.7 32.7 29.3 36 24 36c-6.6 0-12-5.4-12-12s5.4-12 12-12c3 0 5.8 1.1 7.9 3l5.7-5.7C34.2 6.1 29.4 4 24 4 12.9 4 4 12.9 4 24s8.9 20 20 20 20-8.9 20-20c0-1.3-.1-2.5-.4-3.5z"/>
                                    <path fill="#FF3D00" d="M6.3 14.7l6.6 4.8C14.7 16 19 12 24 12c3 0 5.8 1.1 7.9 3l5.7-5.7C34.2 6.1 29.4 4 24 4 16.3 4 9.6 8.3 6.3 14.7z"/>
                                    <path fill="#4CAF50" d="M24 44c5.2 0 10-2 13.6-5.2l-6.3-5.3C29.3 35.1 26.8 36 24 36c-5.3 0-9.7-3.3-11.3-8l-6.5 5C9.5 39.6 16.2 44 24 44z"/>
                                    <path fill="#1976D2" d="M43.6 20.5H42V20H24v8h11.3c-.8 2.2-2.3 4.1-4.1 5.5l.1.1 6.3 5.3C39.1 37.1 44 32 44 24c0-1.3-.1-2.5-.4-3.5z"/>
                                </svg>
                                Continue with Google
                            </button>
                            {supabaseReady && (
                                <p className="font-mono text-[9px] tracking-widest uppercase text-emerald-500/80 text-center">
                                    via Supabase Auth
                                </p>
                            )}
                            <div className="flex items-center gap-3 text-[10px] font-mono uppercase tracking-widest text-ink-500">
                                <div className="flex-1 h-px bg-white/10" />
                                or email
                                <div className="flex-1 h-px bg-white/10" />
                            </div>
                        </div>
                    )}

                    <div className="flex gap-2 mb-6">
                        <button
                            type="button"
                            onClick={() => { setMode('register'); setErr(null); setInfo(null); }}
                            className={`flex-1 py-2 rounded-full font-mono text-[10px] tracking-widest uppercase border transition-colors ${
                                mode === 'register'
                                    ? 'bg-ember-600 border-ember-500 text-white'
                                    : 'border-white/10 text-ink-400 hover:text-ink-50'
                            }`}
                        >
                            Sign up
                        </button>
                        <button
                            type="button"
                            onClick={() => { setMode('login'); setErr(null); setInfo(null); }}
                            className={`flex-1 py-2 rounded-full font-mono text-[10px] tracking-widest uppercase border transition-colors ${
                                mode === 'login'
                                    ? 'bg-ember-600 border-ember-500 text-white'
                                    : 'border-white/10 text-ink-400 hover:text-ink-50'
                            }`}
                        >
                            Sign in
                        </button>
                        <button
                            type="button"
                            onClick={() => { setMode('reset'); setErr(null); setInfo(null); }}
                            className={`flex-1 py-2 rounded-full font-mono text-[10px] tracking-widest uppercase border transition-colors ${
                                mode === 'reset'
                                    ? 'bg-ember-600 border-ember-500 text-white'
                                    : 'border-white/10 text-ink-400 hover:text-ink-50'
                            }`}
                        >
                            Reset
                        </button>
                    </div>

                    <form onSubmit={submit} className="space-y-3">
                        {mode === 'register' && (
                            <input
                                value={name}
                                onChange={(e) => setName(e.target.value)}
                                placeholder="Name / artist alias"
                                className="w-full bg-ink-900 border border-white/10 rounded-lg px-4 py-2.5 text-sm focus:outline-none focus:border-ember-500/50"
                                required
                            />
                        )}
                        <input
                            type="email"
                            value={email}
                            onChange={(e) => setEmail(e.target.value)}
                            placeholder="Email"
                            className="w-full bg-ink-900 border border-white/10 rounded-lg px-4 py-2.5 text-sm focus:outline-none focus:border-ember-500/50"
                            required
                        />
                        {(mode !== 'reset' || resetCode) && (
                            <input
                                type="password"
                                value={password}
                                onChange={(e) => setPassword(e.target.value)}
                                placeholder={mode === 'reset' ? 'New password' : 'Password'}
                                className="w-full bg-ink-900 border border-white/10 rounded-lg px-4 py-2.5 text-sm focus:outline-none focus:border-ember-500/50"
                                required={mode !== 'reset' || Boolean(resetCode)}
                                minLength={6}
                            />
                        )}
                        {mode === 'reset' && resetCode && (
                            <input
                                value={resetCode}
                                onChange={(e) => setResetCode(e.target.value)}
                                placeholder="6-digit code"
                                className="w-full bg-ink-900 border border-white/10 rounded-lg px-4 py-2.5 text-sm font-mono focus:outline-none focus:border-ember-500/50"
                            />
                        )}
                        {err && <p className="text-sm text-amber-400">{err}</p>}
                        {info && <p className="text-sm text-emerald-400">{info}</p>}
                        <button
                            type="submit"
                            disabled={busy}
                            className="w-full py-3 rounded-full bg-ember-600 hover:bg-ember-500 text-white font-mono text-[11px] tracking-widest uppercase disabled:opacity-50"
                        >
                            {busy ? 'Working…' : mode === 'register' ? 'Create account' : mode === 'reset' ? (resetCode ? 'Set password' : 'Send code') : 'Sign in'}
                        </button>
                    </form>
                </motion.div>
            </main>
        </div>
    );
}
