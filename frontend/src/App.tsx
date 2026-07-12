import { Suspense, lazy } from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';

// Route-level code splitting: landing no longer downloads Studio/WaveSurfer/etc.
const LandingPage = lazy(() => import('./pages/LandingPage'));
const FeaturesPage = lazy(() => import('./pages/FeaturesPage'));
const EngineCore = lazy(() => import('./pages/EngineCore'));

function RouteFallback() {
    return (
        <div className="min-h-screen w-full bg-ink-950 flex items-center justify-center">
            <div className="font-mono text-[11px] tracking-[0.3em] uppercase text-ink-400 animate-pulse">
                Loading Engine…
            </div>
        </div>
    );
}

export default function App() {
    return (
        <Router>
            <Suspense fallback={<RouteFallback />}>
                <Routes>
                    <Route path="/" element={<LandingPage />} />
                    <Route path="/features" element={<FeaturesPage />} />
                    <Route path="/engine" element={<EngineCore />} />
                </Routes>
            </Suspense>
        </Router>
    );
}
