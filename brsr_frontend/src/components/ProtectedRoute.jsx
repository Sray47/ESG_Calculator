import React, { useContext } from 'react';
import { Navigate, useLocation, Outlet } from 'react-router-dom'; // Added Outlet
import { AuthContext } from '../main'; // Ensure correct import path

const ProtectedRoute = () => { // Removed children prop as it's not used with element={<ProtectedRoute />}
    const { session, loadingAuth } = useContext(AuthContext);
    const location = useLocation();

    if (loadingAuth) {
        // You might want a more sophisticated loading spinner or UI here
        return (
            <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100vh', backgroundColor:'#f0f0f0', color:'#333' }}>
                <h2>Loading authentication...</h2>
            </div>
        );
    }

    if (!session) {
        return <Navigate to="/login" state={{ from: location }} replace />;
    }

    return <Outlet />; // Render the child routes defined within this route in main.jsx
};

export default ProtectedRoute;
