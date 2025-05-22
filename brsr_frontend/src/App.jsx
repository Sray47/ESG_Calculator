// src/App.jsx
import { Outlet, useLocation } from 'react-router-dom';
import './App.css';
// No longer need useEffect or initializeAuthHeader here

function App() {
    const location = useLocation();

    return (
        <div className="app-container">
            <header>
                {/* You can add a Navbar here later */}
                <h1>BRSR Sustainability Hub</h1>
            </header>
            <main>
                {location.state && location.state.message && (
                    <p className="success-message">{location.state.message}</p>
                )}
                <Outlet /> {/* This is where routed components will render */}
            </main>
            <footer>
                <p>© {new Date().getFullYear()} ESG Calculator</p>
            </footer>
        </div>
    );
}

export default App;