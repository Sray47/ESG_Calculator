// src/services/authService.js
import axios from 'axios';
import { supabase } from './supabaseClient';

const API_URL = 'http://localhost:3050/api/auth'; // For auth-related backend calls
const BACKEND_API_URL = 'http://localhost:3050/api'; // For other backend calls like company profile

// apiClient for general backend requests (e.g., company profile)
export const apiClient = axios.create({
    baseURL: BACKEND_API_URL, 
});

// Function to set Axios default headers for authenticated requests to your backend
export const setAuthHeader = (token) => {
    if (token) {
        apiClient.defaults.headers.common['Authorization'] = `Bearer ${token}`;
        console.log('[authService] Auth header set with token:', token.substring(0, 20) + '...');
    } else {
        delete apiClient.defaults.headers.common['Authorization'];
        console.log('[authService] Auth header cleared');
    }
};

// Session management functions
export const setSession = (session) => {
    console.log('[authService] setSession called with:', session ? 'valid session' : 'null session');
    if (session) {
        localStorage.setItem('session', JSON.stringify(session));
        setAuthHeader(session.access_token); 
        console.log('[authService] Session stored and auth header set');
    } else {
        localStorage.removeItem('session');
        setAuthHeader(null); 
        console.log('[authService] Session cleared and auth header removed');
    }
};

export const getSession = () => {
    const sessionStr = localStorage.getItem('session');
    if (!sessionStr) {
        return null;
    }
    try {
        const session = JSON.parse(sessionStr);
        return session;
    } catch (error) {
        console.error("Error parsing session from localStorage:", error);
        localStorage.removeItem('session'); 
        return null;
    }
};

export const clearSession = async () => { 
    localStorage.removeItem('session');
    localStorage.removeItem('supabaseUser'); 
    localStorage.removeItem('backendUserToken'); 
    setAuthHeader(null);
    const { error } = await supabase.auth.signOut();
    if (error) {
        console.error('Error logging out from Supabase:', error);
    }
};

export const initializeAuthHeader = () => {
    const session = getSession();
    if (session && session.access_token) {
        setAuthHeader(session.access_token);
    } else {
        setAuthHeader(null);
    }
};

// Initialize auth header on app start
initializeAuthHeader();

// --- Supabase onAuthStateChange Listener ---
// Only handle state changes, don't interfere with manual session management
supabase.auth.onAuthStateChange((event, session) => {
    console.log('[authService] onAuthStateChange:', event, session ? 'session exists' : 'no session');
    
    // Only update session for specific events, avoid conflicts with manual logins
    if (event === 'SIGNED_IN' && session) {
        console.log('[authService] User signed in, updating session');
        setSession(session); 
    } else if (event === 'SIGNED_OUT') {
        console.log('[authService] User signed out, clearing local session');
        // Clear local parts only, avoid calling supabase.auth.signOut() again
        localStorage.removeItem('session');
        localStorage.removeItem('supabaseUser');
        localStorage.removeItem('backendUserToken');
        setAuthHeader(null);
    } else if (event === 'TOKEN_REFRESHED' && session) {
        console.log('[authService] Token refreshed, updating session');
        setSession(session); 
    } else if (event === 'INITIAL_SESSION' && session) {
        console.log('[authService] Initial session detected, setting session');
        setSession(session);
    }
});


// --- API Calls ---

export const registerCompanyAndCreateProfile = async (registrationData) => {
    const { 
        email, 
        password, 
        company_name, 
        cin, 
        year_of_incorporation 
    } = registrationData;
    
    console.log("Starting registration process with Supabase");
    
    // Step 1: Sign up the user with Supabase
    const { data: supabaseData, error: supabaseError } = await supabase.auth.signUp({
        email,
        password,
        options: {
            emailRedirectTo: window.location.origin + '/login', // Redirect to login after email verification
        }
    });

    if (supabaseError) {
        console.error("Supabase signup error:", supabaseError);
        throw new Error(supabaseError.message || 'Supabase signup failed.');
    }

    console.log("Supabase signup response:", JSON.stringify(supabaseData));

    // When email confirmation is required, supabaseData will have user but no session
    // When auto-confirmation is enabled, both user and session should be present
    if (!supabaseData.user) {
        console.error("Supabase signup failed - no user object returned");
        throw new Error("Registration failed - user could not be created");
    }

    // Always attempt to sign in after signup to ensure we get a valid session
    // This is needed even if supabaseData.session exists, as it might not be properly initialized
    console.log("Signing in after signup to ensure valid session");
    const { data: signInData, error: signInError } = await supabase.auth.signInWithPassword({
        email,
        password
    });
    
    if (signInError) {
        console.error("Sign-in after signup failed:", signInError);
        if (supabaseData.session) {
            console.log("Using original session from signup since sign-in failed");
            // Keep using the original session
        } else {
            throw new Error("Account created, but you need to confirm your email before signing in.");
        }
    } else if (signInData && signInData.session) {
        console.log("Successfully created new session after signup");
        // Use the session from sign-in attempt
        supabaseData.session = signInData.session;
    } else {
        console.warn("Sign-in succeeded but no session was returned");
        if (!supabaseData.session) {
            throw new Error("Account created but no session was established. Please confirm your email if required.");
        }
    }
    
    // Double-check that we have both user and session
    const user = supabaseData.user;
    const session = supabaseData.session;

    if (!user) {
        console.error("User missing after signup/signin flow");
        throw new Error("Registration partially succeeded but user details are missing. Please try logging in later.");
    }
    
    if (!session) {
        console.error("Session missing after signup/signin flow - likely requires email confirmation");
        throw new Error("Registration successful! Please check your email to verify your account, then log in.");
    }      // Step 2: Create the profile in your backend PostgreSQL database
    const profileData = {
        auth_user_id: user.id, // Link to Supabase user
        email: user.email, // Already have from registrationData, but user.email is authoritative
        company_name,
        cin,
        year_of_incorporation,
        registered_office_address: registrationData.registered_office_address,
        corporate_address: registrationData.corporate_address,
        telephone: registrationData.telephone,
        website: registrationData.website, 
        stock_exchange_listed: registrationData.stock_exchange_listed,
        paid_up_capital: registrationData.paid_up_capital,
        brsr_contact_name: registrationData.brsr_contact_name,
        brsr_contact_mail: registrationData.brsr_contact_mail,
        brsr_contact_number: registrationData.brsr_contact_number,
        
        // BRSR Section A questions 13-17 - ensure these are properly formatted
        reporting_boundary: registrationData.reporting_boundary || 'standalone',
        
        // Make sure array data is properly formatted
        sa_business_activities_turnover: Array.isArray(registrationData.sa_business_activities_turnover) ? 
            registrationData.sa_business_activities_turnover.filter(item => 
                item.description_main || item.description_business || item.turnover_percentage) : [],
                
        sa_product_services_turnover: Array.isArray(registrationData.sa_product_services_turnover) ? 
            registrationData.sa_product_services_turnover.filter(item => 
                item.product_service || item.nic_code || item.turnover_contributed) : [],
                
        sa_locations_plants_offices: registrationData.sa_locations_plants_offices || 
            { national_plants: 0, national_offices: 0, international_plants: 0, international_offices: 0 },
            
        sa_markets_served: {
            locations: registrationData.sa_markets_served_locations || { national_states: 0, international_countries: 0 },
            exports_percentage: registrationData.sa_markets_served_exports_percentage || '0',
            customer_types: registrationData.sa_markets_served_customer_types || ''
        },
    };

    try {
        // Use the apiClient (configured with BACKEND_API_URL) and setAuthHeader for the token
        // The token from Supabase session is needed for this call        // Create a temporary client for this specific call
        const tempApiClient = axios.create({ baseURL: API_URL });
        
        // Ensure we're using the right token (JWT token is what the backend expects)
        tempApiClient.defaults.headers.common['Authorization'] = `Bearer ${session.access_token}`;

        console.log("Creating profile with token:", session.access_token.substring(0, 10) + '...');
        
        const response = await tempApiClient.post('/create-profile', profileData);
        
        // Explicitly set the session to ensure it's available immediately
        setSession(session); // This forces auth header to be set correctly for future requests

        return { supabaseData, backendProfile: response.data };
    } catch (backendError) {
        console.error("Backend profile creation error:", backendError.response?.data || backendError.message);
        // Optional: Attempt to clean up Supabase user if backend profile creation fails?
        // This can be complex (e.g., if user confirmed email in the meantime).
        // For now, throw an error indicating partial success.
        throw new Error(backendError.response?.data?.message || backendError.message || 'Backend profile creation failed after signup.');
    }
};

export const loginCompany = async (credentials) => {
    try {
        const { data, error } = await supabase.auth.signInWithPassword({
            email: credentials.email,
            password: credentials.password,
        });

        if (error) throw error;
        // onAuthStateChange will handle setSession(data.session)
        return data; 
    } catch (error) {
        const errorMessage = error.message || 'Login failed';
        console.error("Login error in authService:", errorMessage, error);
        throw new Error(errorMessage); 
    }
};

export const fetchCompanyProfile = async () => {
    const session = getSession(); 
    console.log('[authService] fetchCompanyProfile called. Session exists:', !!session);
    
    if (!session || !session.access_token) {
        console.warn('[authService] fetchCompanyProfile called without a session in localStorage.');
        throw new Error('Authentication required to fetch profile. Please log in again.');
    }
    
    // Ensure auth header is set before making the request
    setAuthHeader(session.access_token);
    
    try {
        console.log('[authService] Making API call to fetch company profile...');
        const response = await apiClient.get('/company/profile'); 
        console.log('[authService] Profile fetch successful:', response.data ? 'data received' : 'no data');
        return response.data;
    } catch(error) {
        const errorMessage = error.response?.data?.message || error.message || 'Failed to fetch profile';
        console.error("[authService] Fetch profile error:", {
            status: error.response?.status,
            statusText: error.response?.statusText,
            data: error.response?.data,
            message: errorMessage
        });
        
        if (error.response?.status === 401 || error.response?.status === 403) {
            console.warn('[authService] Backend auth failed for fetchCompanyProfile. Clearing session.');
            await clearSession(); 
            throw new Error('Session expired or invalid. Please log in again.'); 
        }
        throw new Error(errorMessage); 
    }
};

export const updateCompanyProfile = async (profileData) => {
    const session = getSession();
    if (!session || !session.access_token) {
        console.warn('[authService] updateCompanyProfile called without a session in localStorage.');
        throw new Error('Authentication required to update profile. Please log in again.');
    }
    try {
        const response = await apiClient.put('/company/profile', profileData); 
        return response.data;
    } catch (error) {
        const errorMessage = error.response?.data?.message || error.message || 'Failed to update profile';
        console.error("Update profile error in authService:", errorMessage, error);
         if (error.response?.status === 401 || error.response?.status === 403) {
             console.warn('[authService] Backend auth failed for updateCompanyProfile. Clearing session.');
             await clearSession(); 
             throw new Error('Session expired or invalid. Please log in again.');
        }
        throw new Error(errorMessage);
    }
};

// Function to initiate a new BRSR report
export const initiateBrSrReport = async (reportData) => {
    const session = getSession();
    if (!session || !session.access_token) {
        console.warn('[authService] initiateBrSrReport called without a session in localStorage.');
        throw new Error('Authentication required to initiate a report. Please log in again.');
    }
    // Ensure auth header is set for apiClient
    // initializeAuthHeader(); // Or rely on it being set during login/session restoration

    try {
        // The endpoint is /api/reports/initiate, so we use apiClient which is configured for /api
        const response = await apiClient.post('/reports/initiate', reportData);
        return response.data; // This should be the newly created report object with its ID
    } catch (error) {
        const errorMessage = error.response?.data?.message || error.message || 'Failed to initiate BRSR report';
        console.error("Initiate BRSR report error in authService:", errorMessage, error);
        if (error.response?.status === 401 || error.response?.status === 403) {
            console.warn('[authService] Backend auth failed for initiateBrSrReport. Clearing session.');
            await clearSession();
            throw new Error('Session expired or invalid. Please log in again.');
        }
        throw new Error(errorMessage);
    }
};

// Function to fetch BRSR report details
export const fetchBrSrReportDetails = async (reportId) => {
    const session = getSession();
    if (!session || !session.access_token) {
        console.warn('[authService] fetchBrSrReportDetails called without a session.');
        throw new Error('Authentication required. Please log in again.');
    }

    try {
        const response = await apiClient.get(`/reports/${reportId}`);
        return response.data;
    } catch (error) {
        const errorMessage = error.response?.data?.message || error.message || 'Failed to fetch BRSR report details';
        console.error("Fetch BRSR report details error in authService:", errorMessage, error);
        if (error.response?.status === 401 || error.response?.status === 403) {
            console.warn('[authService] Backend auth failed for fetchBrSrReportDetails. Clearing session.');
            await clearSession();
            throw new Error('Session expired or invalid. Please log in again.');
        }
        if (error.response?.status === 404) {
            throw new Error('Report not found.');
        }
        throw new Error(errorMessage);
    }
};

// Function to update an existing BRSR report (partial updates)
export const updateBrSrReport = async (reportId, updateData) => {
    const session = getSession();
    if (!session || !session.access_token) {
        console.warn('[authService] updateBrSrReport called without a session.');
        throw new Error('Authentication required. Please log in again.');
    }
    
    console.log('[authService] updateBrSrReport called with:', {
        reportId,
        updateDataKeys: Object.keys(updateData)
    });
      try {
        // Check if this is specifically section_a_data
        if (updateData && updateData.section_a_data) {
            console.log('[authService] Updating Section A data with dedicated endpoint');
            
            // Extract only the relevant fields from section_a_data
            // Don't include the full section_a_data object which doesn't exist as a column
            const sectionAData = {
                // Extract only the fields that match database columns
                sa_business_activities_turnover: updateData.section_a_data.sa_business_activities_turnover || [],
                sa_product_services_turnover: updateData.section_a_data.sa_product_services_turnover || [],
                sa_locations_plants_offices: updateData.section_a_data.sa_locations_plants_offices || {},
                sa_markets_served: updateData.section_a_data.sa_markets_served || {},
                sa_employee_details: updateData.section_a_data.sa_employee_details || {},
                sa_workers_details: updateData.section_a_data.sa_workers_details || {},
                sa_differently_abled_details: updateData.section_a_data.sa_differently_abled_details || {},
                sa_women_representation_details: updateData.section_a_data.sa_women_representation_details || {},
                sa_turnover_rate: updateData.section_a_data.sa_turnover_rate || {},
                sa_holding_subsidiary_associate_companies: updateData.section_a_data.sa_holding_subsidiary_associate_companies || [],
                sa_csr_applicable: updateData.section_a_data.sa_csr_applicable || false,
                sa_csr_turnover: updateData.section_a_data.sa_csr_turnover || '',
                sa_csr_net_worth: updateData.section_a_data.sa_csr_net_worth || '',
                sa_transparency_complaints: updateData.section_a_data.sa_transparency_complaints || {}
            };
              // Log the data being sent
            console.log('[authService] Section A data:', JSON.stringify(sectionAData, null, 2));            // Use the dedicated section-a-test endpoint for Section A data
            // The backend will extract and update only valid sa_ prefixed fields
            const response = await apiClient.post(`/reports/${reportId}/section-a-test`, sectionAData);
            return response.data; // Return the updated report object
        } else {
            // For all other updates, use the standard PUT endpoint
            console.log('[authService] Updating report with standard PUT endpoint');
            const response = await apiClient.put(`/reports/${reportId}`, updateData);
            return response.data;
        }
    } catch (error) {
        const errorMessage = error.response?.data?.message || error.message || 'Failed to update BRSR report';
        console.error("Update BRSR report error in authService:", errorMessage, error);
        if (error.response?.status === 401 || error.response?.status === 403) {
            console.warn('[authService] Backend auth failed for updateBrSrReport. Clearing session.');
            await clearSession();
            throw new Error('Session expired or invalid. Please log in again.');
        }
        if (error.response?.status === 404) {
            throw new Error('Report not found for update.');
        }
        throw new Error(errorMessage);
    }
};

 export const getCurrentUser = () => {
    const session = getSession(); 
    return session?.user || null; 
 };

 export const logoutCompany = async () => {
    await clearSession(); // This handles Supabase signout and local cleanup
    // Any additional app-specific cleanup can go here
};