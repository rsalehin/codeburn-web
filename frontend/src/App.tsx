import { Routes, Route, Link } from 'react-router-dom';
import Dashboard from './pages/Dashboard';

function App() {
    return (
        <div className="min-h-screen bg-background text-foreground">
            <nav className="border-b p-4">
                <Link to="/" className="text-xl font-bold">CodeBurn Web</Link>
            </nav>
            <Routes>
                <Route path="/" element={<Dashboard />} />
            </Routes>
        </div>
    );
}

export default App;