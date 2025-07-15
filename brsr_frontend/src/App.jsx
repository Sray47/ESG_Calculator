// src/App.jsx
import { Outlet, useLocation } from 'react-router-dom';
import { logoutCompany } from './services/authService';
import './App.css';
// No longer need useEffect or initializeAuthHeader here

function App() {
    const location = useLocation();

    const handleLogout = async () => {
        try {
            await logoutCompany();
            window.location.href = '/login'; // Force page reload to clear all state
        } catch (error) {
            console.error('Logout error:', error);
            // Force clear everything even if logout fails
            localStorage.clear();
            window.location.href = '/login';
        }
    };

    const handleNuclearReset = () => {
        // Nuclear option: clear everything and reset
        localStorage.clear();
        sessionStorage.clear();
        
        // Clear any service worker caches if they exist
        if ('caches' in window) {
            caches.keys().then(names => {
                names.forEach(name => {
                    caches.delete(name);
                });
            });
        }
        
        // Force reload to completely reset the application
        window.location.href = '/login';
    };

    return (
        <div className="app-container">
            <header style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '0 20px' }}>
                <h1>BRSR Sustainability Hub</h1>
                {/* Temporary debug buttons */}
                <div style={{ display: 'flex', gap: '10px' }}>
                    <button 
                        onClick={handleLogout}
                        style={{
                            backgroundColor: '#dc3545',
                            color: 'white',
                            border: 'none',
                            padding: '8px 16px',
                            borderRadius: '4px',
                            cursor: 'pointer',
                            fontSize: '12px'
                        }}
                    >
                        Logout
                    </button>
                    <button 
                        onClick={handleNuclearReset}
                        style={{
                            backgroundColor: '#6f42c1',
                            color: 'white',
                            border: 'none',
                            padding: '8px 16px',
                            borderRadius: '4px',
                            cursor: 'pointer',
                            fontSize: '12px'
                        }}
                    >
                        Nuclear Reset
                    </button>
                </div>
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