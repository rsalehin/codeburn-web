import { Routes, Route, Link } from 'react-router-dom';
import Dashboard from './pages/Dashboard';
import Optimize from './pages/Optimize';
import Compare from './pages/Compare';

function App() {
    return (
        <div className="min-h-screen bg-background text-text">
            <nav className="border-b border-border px-6 py-3 flex items-center gap-6">
                <Link to="/" className="font-semibold">CodeBurn</Link>
                <Link to="/" className="text-muted hover:text-text text-sm">Dashboard</Link>
                <Link to="/optimize" className="text-muted hover:text-text text-sm">Optimize</Link>
                <Link to="/compare" className="text-muted hover:text-text text-sm">Compare</Link>
            </nav>
            <Routes>
                <Route path="/" element={<Dashboard />} />
                <Route path="/optimize" element={<Optimize />} />
                <Route path="/compare" element={<Compare />} />
            </Routes>
        </div>
    );
}

export default App;