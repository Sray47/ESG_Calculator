import React, { useState, useEffect, createContext, useContext } from 'react';
import ReactDOM from 'react-dom/client';
import { BrowserRouter as Router, Routes, Route, Navigate, Outlet, useLocation } from 'react-router-dom';
import App from './App';
import './index.css';
import LoginPage from './pages/LoginPage';
import RegisterPage from './pages/RegisterPage';
import ProfilePage from './pages/ProfilePage';
import EditDisclosuresPage from './pages/EditDisclosuresPage';
import NewReportPage from './pages/NewReportPage';
import PreviousReportsPage from './pages/PreviousReportsPage';
import ProtectedRoute from './components/ProtectedRoute';
import { supabase } from './services/supabaseClient';
import { setSession, clearSession } from './services/authService';

export const AuthContext = createContext(null);

function AppRouter() {
    const [session, setSessionState] = useState(null);
    const [loadingAuth, setLoadingAuth] = useState(true);

    useEffect(() => {
        console.log('[AppRouter] useEffect started. Initializing auth state...');
        const fetchInitialSession = async () => {
            console.log('[AppRouter] Fetching initial Supabase session...');
            try {
                const { data: { session: supabaseSession }, error } = await supabase.auth.getSession();
                if (error) {
                    console.error('[AppRouter] Error fetching initial session:', error);
                    setSessionState(null);
                    await clearSession();
                } else {
                    console.log('[AppRouter] Initial Supabase session fetched:', supabaseSession);
                    setSession(supabaseSession);
                    setSessionState(supabaseSession);
                }
            } catch (e) {
                console.error('[AppRouter] Exception during initial session fetch:', e);
                setSessionState(null);
                await clearSession();
            } finally {
                setLoadingAuth(false);
                console.log('[AppRouter] Initial auth loading complete. loadingAuth set to false.');
            }
        };

        fetchInitialSession();

        const { data: authListener } = supabase.auth.onAuthStateChange(
            async (_event, currentSession) => {
                console.log('[AppRouter] onAuthStateChange triggered. Event:', _event, 'Session:', currentSession);
                if (currentSession) {
                    setSession(currentSession);
                } else {
                    await clearSession();
                }
                setSessionState(currentSession);
                if (loadingAuth && (_event === 'INITIAL_SESSION' || _event === 'SIGNED_IN' || _event === 'SIGNED_OUT')) {
                    setLoadingAuth(false);
                    console.log('[AppRouter] onAuthStateChange set loadingAuth to false. Event:', _event);
                }
            }
        );
        console.log('[AppRouter] Supabase onAuthStateChange listener attached.');

        return () => {
            if (authListener && authListener.subscription) {
                console.log('[AppRouter] Unsubscribing from onAuthStateChange.');
                authListener.subscription.unsubscribe();
            }
        };
    }, []);

    if (loadingAuth) {
        console.log('[AppRouter] Rendering loading state (outer)...');
        return (
            <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100vh', backgroundColor:'#333', color:'white' }}>
                <h2>Loading application...</h2>
            </div>
        );
    }
    console.log('[AppRouter] Auth loading finished. Rendering Router. Current session state:', session);

    return (
        <AuthContext.Provider value={{ session, loadingAuth }}>
            <Router>
                <Routes>
                    <Route path="/" element={<App />}>
                        <Route index element={<Navigate to={session ? "/profile" : "/login"} replace />} />
                        <Route path="login" element={session ? <Navigate to="/profile" replace /> : <LoginPage />} />
                        <Route path="register" element={session ? <Navigate to="/profile" replace /> : <RegisterPage />} />
                        <Route element={<ProtectedRoute />}>
                            <Route path="profile" element={<ProfilePage />} />
                            <Route path="profile/edit-disclosures" element={<EditDisclosuresPage />} />
                            <Route path="reports/new" element={<NewReportPage />} />
                            <Route path="reports/history" element={<PreviousReportsPage />} />
                        </Route>
                        <Route path="*" element={<Navigate to="/" replace />} />
                    </Route>
                </Routes>
            </Router>
        </AuthContext.Provider>
    );
}

ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <AppRouter />
  </React.StrictMode>,
);