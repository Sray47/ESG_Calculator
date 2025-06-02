import React, { useState, useEffect, createContext, useContext } from 'react';
import ReactDOM from 'react-dom/client';
import { BrowserRouter as Router, Routes, Route, Navigate, Outlet, useLocation } from 'react-router-dom';
import App from './App';
import './index.css';
import './styles/shared.css';
import './styles/components.css';
import './styles/form-elements.css';
import './styles/responsive.css';
import LoginPage from './pages/LoginPage';
import RegisterPage from './pages/RegisterPage';
import ProfilePage from './pages/ProfilePage';
import EditDisclosuresPage from './pages/EditDisclosuresPage';
import NewReportPage from './pages/NewReportPage';
import PreviousReportsPage from './pages/PreviousReportsPage';
import ProtectedRoute from './components/ProtectedRoute';
import { supabase } from './services/supabaseClient';
import { setSession, clearSession } from './services/authService';
import ReportWizardPage from './pages/ReportWizardPage'; // Import the new wizard page
import SectionAForm from './components/reportwizard/SectionAForm'; // Import SectionAForm
import SectionBForm from './components/reportwizard/SectionBForm'; // Import SectionBForm
import SectionCPrinciple1Form from './components/reportwizard/SectionCPrinciple1Form';
import SectionCPrinciple2Form from './components/reportwizard/SectionCPrinciple2Form';
import SectionCPrinciple3Form from './components/reportwizard/SectionCPrinciple3Form';
import SectionCPrinciple4Form from './components/reportwizard/SectionCPrinciple4Form';
import SectionCPrinciple5Form from './components/reportwizard/SectionCPrinciple5Form';
import SectionCPrinciple6Form from './components/reportwizard/SectionCPrinciple6Form';
import SectionCPrinciple7Form from './components/reportwizard/SectionCPrinciple7Form';
import SectionCPrinciple8Form from './components/reportwizard/SectionCPrinciple8Form';
import SectionCPrinciple9Form from './components/reportwizard/SectionCPrinciple9Form';
import ReviewSubmitPage from './components/reportwizard/ReviewSubmitPage';

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
                    console.log('[AppRouter] Initial Supabase session fetched:', supabaseSession ? 'valid session' : 'no session');
                    if (supabaseSession) {
                        setSession(supabaseSession);
                    }
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

        // Set up auth state change listener
        const { data: authListener } = supabase.auth.onAuthStateChange(
            async (event, currentSession) => {
                console.log('[AppRouter] onAuthStateChange triggered. Event:', event, 'Session:', currentSession ? 'exists' : 'null');
                
                // Update session state based on the event
                if (currentSession) {
                    setSession(currentSession);
                    setSessionState(currentSession);
                } else {
                    await clearSession();
                    setSessionState(null);
                }
                
                // Mark auth loading as complete for certain events
                if (loadingAuth && (event === 'INITIAL_SESSION' || event === 'SIGNED_IN' || event === 'SIGNED_OUT')) {
                    setLoadingAuth(false);
                    console.log('[AppRouter] onAuthStateChange set loadingAuth to false. Event:', event);
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
    }, []); // Remove dependency on loadingAuth to prevent infinite loops

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
                            {/* Route for the report wizard with a section parameter */}
                            <Route path="report-wizard/:reportId" element={<ReportWizardPage />}>
                                <Route index element={<Navigate to="section-a" replace />} /> {/* Default to section-a */}
                                <Route path="section-a" element={<SectionAForm />} />
                                <Route path="section-b" element={<SectionBForm />} /> {/* Add route for SectionBForm */}
                                <Route path="section-c-p1" element={<SectionCPrinciple1Form />} />
                                <Route path="section-c-p2" element={<SectionCPrinciple2Form />} />
                                <Route path="section-c-p3" element={<SectionCPrinciple3Form />} />
                                <Route path="section-c-p4" element={<SectionCPrinciple4Form />} />
                                <Route path="section-c-p5" element={<SectionCPrinciple5Form />} />
                                <Route path="section-c-p6" element={<SectionCPrinciple6Form />} />
                                <Route path="section-c-p7" element={<SectionCPrinciple7Form />} />
                                <Route path="section-c-p8" element={<SectionCPrinciple8Form />} />
                                <Route path="section-c-p9" element={<SectionCPrinciple9Form />} />
                                <Route path="review-submit" element={<ReviewSubmitPage />} />
                            </Route>
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