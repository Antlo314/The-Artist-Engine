import { Suspense, lazy } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider, useAuth } from './lib/auth';

const LandingPage = lazy(() => import('./pages/LandingPage'));
const FeaturesPage = lazy(() => import('./pages/FeaturesPage'));
const EngineCore = lazy(() => import('./pages/EngineCore'));
const LoginPage = lazy(() => import('./pages/LoginPage'));

function RouteFallback() {
    return (
        <div className="min-h-screen w-full bg-ink-950 flex items-center justify-center">
            <div className="font-mono text-[11px] tracking-[0.3em] uppercase text-ink-400 animate-pulse">
                Loading Engine…
            </div>
        </div>
    );
}

/** Gate /engine behind Google founding auth when Supabase is configured. */
function RequireFounding({ children }: { children: React.ReactNode }) {
    const { ready, authEnabled, session, canUseEngine, waitlisted } = useAuth();

    if (!ready) return <RouteFallback />;

    // Local / unconfigured deploy stays open
    if (!authEnabled) return <>{children}</>;

    if (!session) return <Navigate to="/login" replace />;
    if (waitlisted || !canUseEngine) return <Navigate to="/login" replace />;

    return <>{children}</>;
}

export default function App() {
    return (
        <AuthProvider>
            <Router>
                <Suspense fallback={<RouteFallback />}>
                    <Routes>
                        <Route path="/" element={<LandingPage />} />
                        <Route path="/features" element={<FeaturesPage />} />
                        <Route path="/login" element={<LoginPage />} />
                        <Route
                            path="/engine"
                            element={
                                <RequireFounding>
                                    <EngineCore />
                                </RequireFounding>
                            }
                        />
                    </Routes>
                </Suspense>
            </Router>
        </AuthProvider>
    );
}
