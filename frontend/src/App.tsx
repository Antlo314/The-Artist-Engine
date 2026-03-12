import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import LandingPage from './pages/LandingPage';
import FeaturesPage from './pages/FeaturesPage';
import EngineCore from './pages/EngineCore';

export default function App() {
    return (
        <Router>
            <Routes>
                <Route path="/" element={<LandingPage />} />
                <Route path="/features" element={<FeaturesPage />} />
                <Route path="/engine" element={<EngineCore />} />
            </Routes>
        </Router>
    );
}
