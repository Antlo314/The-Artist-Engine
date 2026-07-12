import { Link, Navigate } from 'react-router-dom';
import { SignIn, SignedIn, SignedOut } from '@clerk/clerk-react';
import { motion } from 'framer-motion';
import { useAuth, isAuthEnabled } from '../lib/auth';

export default function LoginPage() {
    const { ready, canUseEngine, waitlisted, meError, email, authEnabled } = useAuth();

    if (!ready) {
        return (
            <div className="min-h-screen bg-ink-950 flex items-center justify-center font-mono text-[11px] tracking-[0.3em] uppercase text-ink-400">
                Loading…
            </div>
        );
    }

    // No Clerk key → open engine
    if (!authEnabled || !isAuthEnabled()) {
        return <Navigate to="/engine" replace />;
    }

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
                    ← Back
                </Link>
            </header>

            <main className="relative z-10 flex-1 flex items-center justify-center p-6">
                <motion.div
                    initial={{ opacity: 0, y: 16 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="w-full max-w-md"
                >
                    <div className="mb-6 text-center">
                        <p className="font-mono text-[10px] tracking-[0.3em] uppercase text-ember-500 mb-2">
                            Founding access
                        </p>
                        <h1 className="font-display text-3xl font-semibold tracking-tight mb-2">Sign in</h1>
                        <p className="text-sm text-ink-200">
                            One-click Google. We remember you next time.
                        </p>
                    </div>

                    <SignedOut>
                        <div className="flex justify-center clerk-dark">
                            <SignIn
                                routing="hash"
                                fallbackRedirectUrl="/engine"
                                forceRedirectUrl="/engine"
                                appearance={{
                                    variables: {
                                        colorPrimary: '#dc2626',
                                        colorBackground: '#0c0c0e',
                                        colorText: '#f4f4f5',
                                        colorInputBackground: '#18181b',
                                        colorInputText: '#f4f4f5',
                                        borderRadius: '0.75rem',
                                    },
                                    elements: {
                                        rootBox: 'w-full',
                                        card: 'bg-ink-950 border border-white/10 shadow-2xl',
                                    },
                                }}
                            />
                        </div>
                    </SignedOut>

                    <SignedIn>
                        {waitlisted ? (
                            <div className="glass-obsidian border border-amber-500/30 rounded-2xl p-6 text-sm">
                                <p className="font-medium text-amber-200 mb-2">Signed in — not on the list yet</p>
                                <p className="text-ink-200 text-xs leading-relaxed mb-3">
                                    {meError ||
                                        'Your Google account is signed in, but this email isn’t invited. Ask the team to add you to FOUNDING_EMAILS on the server.'}
                                </p>
                                <p className="font-mono text-[10px] text-ink-400">{email}</p>
                                <Link
                                    to="/engine"
                                    className="mt-4 inline-block font-mono text-[10px] tracking-widest uppercase text-ink-500"
                                >
                                    Try engine anyway →
                                </Link>
                            </div>
                        ) : canUseEngine ? (
                            <Navigate to="/engine" replace />
                        ) : (
                            <div className="text-center">
                                <Link
                                    to="/engine"
                                    className="inline-flex rounded-full bg-ember-600 px-8 py-3 font-display text-sm font-medium hover:bg-ember-500"
                                >
                                    Enter Engine
                                </Link>
                            </div>
                        )}
                    </SignedIn>
                </motion.div>
            </main>
        </div>
    );
}
