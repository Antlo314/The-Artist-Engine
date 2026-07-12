import { useState } from 'react';
import { Link, Navigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { useAuth } from '../lib/auth';
import { ApiError } from '../lib/api';
import ThemeToggle from '../components/ThemeToggle';
import BrandMark from '../components/BrandMark';

export default function LoginPage() {
    const { ready, isSignedIn, canUseEngine, login, register } = useAuth();
    const [mode, setMode] = useState<'login' | 'register' | 'reset'>('login');
    const [name, setName] = useState('');
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [resetCode, setResetCode] = useState('');
    const [busy, setBusy] = useState(false);
    const [err, setErr] = useState<string | null>(null);
    const [info, setInfo] = useState<string | null>(null);

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
                            : 'Enter with name, email, and password. Your session is saved so you stay signed in.'}
                    </p>

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
                    </div>

                    <form onSubmit={submit} className="space-y-4">
                        {mode === 'register' && (
                            <label className="block">
                                <span className="font-mono text-[10px] tracking-widest uppercase text-ink-400">Name</span>
                                <input
                                    required
                                    value={name}
                                    onChange={(e) => setName(e.target.value)}
                                    className="mt-1.5 w-full bg-ink-900 border border-white/10 rounded-lg px-3.5 py-2.5 text-sm text-ink-50 focus:outline-none focus:border-white/30"
                                    placeholder="Your artist / DJ name"
                                    autoComplete="name"
                                />
                            </label>
                        )}
                        <label className="block">
                            <span className="font-mono text-[10px] tracking-widest uppercase text-ink-400">Email</span>
                            <input
                                required
                                type="email"
                                value={email}
                                onChange={(e) => setEmail(e.target.value)}
                                className="mt-1.5 w-full bg-ink-900 border border-white/10 rounded-lg px-3.5 py-2.5 text-sm text-ink-50 focus:outline-none focus:border-white/30"
                                placeholder="you@email.com"
                                autoComplete="email"
                            />
                        </label>
                        {mode === 'reset' && resetCode && (
                            <label className="block">
                                <span className="font-mono text-[10px] tracking-widest uppercase text-ink-400">Reset code</span>
                                <input
                                    required
                                    value={resetCode}
                                    onChange={(e) => setResetCode(e.target.value)}
                                    className="mt-1.5 w-full bg-ink-900 border border-white/10 rounded-lg px-3.5 py-2.5 text-sm text-ink-50 focus:outline-none focus:border-white/30"
                                    placeholder="6-digit code"
                                />
                            </label>
                        )}
                        {(mode !== 'reset' || !!resetCode) && (
                            <label className="block">
                                <span className="font-mono text-[10px] tracking-widest uppercase text-ink-400">
                                    {mode === 'reset' ? 'New password' : 'Password'}
                                </span>
                                <input
                                    required={mode !== 'reset' || !!resetCode}
                                    type="password"
                                    value={password}
                                    onChange={(e) => setPassword(e.target.value)}
                                    className="mt-1.5 w-full bg-ink-900 border border-white/10 rounded-lg px-3.5 py-2.5 text-sm text-ink-50 focus:outline-none focus:border-white/30"
                                    placeholder={mode === 'register' || mode === 'reset' ? 'At least 6 characters' : 'Your password'}
                                    autoComplete={mode === 'register' || mode === 'reset' ? 'new-password' : 'current-password'}
                                    minLength={mode === 'reset' && !resetCode ? undefined : 6}
                                />
                            </label>
                        )}

                        {err && (
                            <p className="text-sm text-red-400 bg-red-500/10 border border-red-500/30 rounded-lg px-3 py-2">
                                {err}
                            </p>
                        )}
                        {info && (
                            <p className="text-sm text-ink-200 bg-white/5 border border-white/10 rounded-lg px-3 py-2">
                                {info}
                            </p>
                        )}

                        <button
                            type="submit"
                            disabled={busy}
                            className="w-full rounded-full bg-ember-600 hover:bg-ember-500 text-white font-display font-medium py-3.5 transition-colors disabled:opacity-50"
                        >
                            {busy
                                ? 'Working…'
                                : mode === 'register'
                                    ? 'Create account & enter'
                                    : mode === 'reset'
                                        ? resetCode
                                            ? 'Set new password'
                                            : 'Email me a code'
                                        : 'Sign in & enter'}
                        </button>
                    </form>

                    {mode !== 'reset' ? (
                        <button
                            type="button"
                            onClick={() => { setMode('reset'); setErr(null); setInfo(null); setResetCode(''); }}
                            className="mt-4 w-full font-mono text-[10px] tracking-widest uppercase text-ink-400 hover:text-ink-50"
                        >
                            Forgot password?
                        </button>
                    ) : (
                        <button
                            type="button"
                            onClick={() => { setMode('login'); setErr(null); setInfo(null); }}
                            className="mt-4 w-full font-mono text-[10px] tracking-widest uppercase text-ink-400 hover:text-ink-50"
                        >
                            ← Back to sign in
                        </button>
                    )}

                    <p className="mt-6 font-mono text-[9px] text-ink-500 tracking-wide text-center leading-relaxed">
                        Fair-use daily limits apply after you sign in so the engine stays fast for everyone.
                    </p>
                </motion.div>
            </main>
        </div>
    );
}
