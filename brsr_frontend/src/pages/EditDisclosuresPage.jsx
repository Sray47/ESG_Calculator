import React, { useState, useEffect, useContext } from 'react'; // Added useContext
import { useNavigate } from 'react-router-dom';
import { fetchCompanyProfile, updateCompanyProfile } from '../services/authService'; // Ensure updateCompanyProfile is imported
import './AuthForm.css'; // Re-use some styles for now, or create a new CSS file
import { AuthContext } from '../main'; // Adjusted path for AuthContext

function EditDisclosuresPage() {
    const { session, loadingAuth } = useContext(AuthContext); // Get auth state
    const navigate = useNavigate();
    const [profile, setProfile] = useState(null);
    const [formData, setFormData] = useState({
        company_name: '',
        registered_office_address: '',
        corporate_address: '',
        telephone: '',
        website: '',
        paid_up_capital: '',
        stock_exchange_listed: [],
        brsr_contact_name: '',
        brsr_contact_number: '',
        brsr_contact_mail: '',
        brsr_report_data: {
            brsr_report_id: null,
            financial_year: '',
            reporting_boundary: 'Standalone',
            sa_business_activities_turnover: [],
            sa_product_services_turnover: [],
            sa_locations_plants_offices: { national_plants: 0, national_offices: 0, international_plants: 0, international_offices: 0 },
            sa_markets_served: { locations: { national_states: 0, international_countries: 0 }, exports_percentage: 0, customer_types: '' },
        }
    });
    const [loading, setLoading] = useState(true); // This is for profile data loading
    const [error, setError] = useState('');
    const [success, setSuccess] = useState('');

    // Define initial defaults for brsr_report_data separately for clarity
    const initialBrsrReportDataDefaults = {
        brsr_report_id: null,
        financial_year: '', // Or derive from current year
        reporting_boundary: 'Standalone',
        sa_business_activities_turnover: [],
        sa_product_services_turnover: [],
        sa_locations_plants_offices: { national_plants: 0, national_offices: 0, international_plants: 0, international_offices: 0 },
        sa_markets_served: { locations: { national_states: 0, international_countries: 0 }, exports_percentage: 0, customer_types: '' },
    };

    useEffect(() => {
        console.log('[EditDisclosuresPage] Auth check - loadingAuth:', loadingAuth, 'session:', session);
        if (!loadingAuth && !session) {
            console.log('[EditDisclosuresPage] No session found, redirecting to login');
            navigate('/login', { state: { message: 'You must be logged in to edit disclosures.' } });
        }
    }, [session, loadingAuth, navigate]);    useEffect(() => {
        console.log('[EditDisclosuresPage] Profile loading check - loadingAuth:', loadingAuth, 'session:', session);
        
        const loadProfile = async () => {
            if (session) { // Only load profile if user is authenticated
                try {
                    console.log('[EditDisclosuresPage] Loading profile data...');
                    setLoading(true);
                    setError(''); // Clear any previous errors
                    const data = await fetchCompanyProfile();
                    console.log('[EditDisclosuresPage] Profile data received:', data);
                    setProfile(data);                    
                    // More robust way to set formData, ensuring all company and BRSR fields are handled
                    setFormData(prevFormData => ({
                        ...prevFormData, // Start with previous state to preserve any structure not directly from 'data'
                        company_name: data.company_name || '',
                        registered_office_address: data.registered_office_address || '',
                        corporate_address: data.corporate_address || '',
                        telephone: data.telephone || '',
                        website: data.website || '',
                        paid_up_capital: data.paid_up_capital || '',
                        stock_exchange_listed: Array.isArray(data.stock_exchange_listed) 
                            ? data.stock_exchange_listed 
                            : (data.stock_exchange_listed ? String(data.stock_exchange_listed).split(',').map(s=>s.trim()).filter(s=>s) : []),
                        brsr_contact_name: data.brsr_contact_name || '',
                        brsr_contact_number: data.brsr_contact_number || '',
                        brsr_contact_mail: data.brsr_contact_mail || '',
                        brsr_report_data: {
                            ...initialBrsrReportDataDefaults,    // Ensure all keys from our defined defaults are present
                            ...(data.brsr_report_data || {}) // Spread fetched data; use empty object if brsr_report_data is null/undefined
                        }
                    }));
                    setError('');
                } catch (err) {
                    setError(err.message || 'Failed to load company profile.');
                    console.error("[EditDisclosuresPage] Error loading profile:", err);
                } finally {
                    setLoading(false);
                }
            } else if (!loadingAuth) { // If not loading auth and no session, means redirect should have happened or is happening
                console.log('[EditDisclosuresPage] No session and auth not loading, stopping profile load');
                setLoading(false); // Stop profile loading if no user
            }
        };
        
        if (!loadingAuth && session) { // Ensure auth is resolved and user exists before loading profile
            console.log('[EditDisclosuresPage] Auth resolved and session exists, loading profile');
            loadProfile();
        } else if (!loadingAuth && !session) {
            // If auth is resolved and no user, no need to attempt profile load,
            // the other useEffect will handle redirection.
            console.log('[EditDisclosuresPage] Auth resolved but no session, skipping profile load');
            setLoading(false);
        }
    }, [session, loadingAuth]); // Removed navigate from dependencies to prevent unnecessary re-runs

    const handleChange = (e) => {
        const { name, value, type, checked } = e.target;
        const [mainField, subField, subSubField] = name.split('.'); // For nested fields like brsr_report_data.locations.national_plants

        if (mainField === 'brsr_report_data') {
            setFormData(prev => ({
                ...prev,
                brsr_report_data: {
                    ...prev.brsr_report_data,
                    ...(subSubField ? 
                        { [subField]: { ...prev.brsr_report_data[subField], [subSubField]: type === 'number' ? parseFloat(value) : value } } :
                        { [subField]: type === 'number' ? parseFloat(value) : value }
                    )
                }
            })); 
        } else if (name === 'stock_exchange_listed') {
            // Assuming it's a comma-separated string input for simplicity, convert to array on submit or here
            setFormData(prev => ({ ...prev, [name]: value.split(',').map(s => s.trim()) }));
        } else {
            setFormData(prev => ({
                ...prev,
                [name]: type === 'checkbox' ? checked : (type === 'number' ? parseFloat(value) : value)
            }));
        }
    };

    // Helper to handle changes in array of objects (e.g., sa_business_activities_turnover)
    const handleArrayObjectChange = (arrayName, index, fieldName, value) => {
        setFormData(prev => ({
            ...prev,
            brsr_report_data: {
                ...prev.brsr_report_data,
                [arrayName]: prev.brsr_report_data[arrayName]?.map((item, i) => // Add optional chaining for safety
                    i === index ? { ...item, [fieldName]: value } : item
                ) || [] // Fallback to empty array if prev.brsr_report_data[arrayName] is null/undefined
            }
        }));
    };

    // Helper to add an item to an array field (e.g., for business activities)
    const addArrayItem = (arrayName, newItemTemplate) => {
        setFormData(prev => ({
            ...prev,
            brsr_report_data: {
                ...prev.brsr_report_data,
                [arrayName]: [...(prev.brsr_report_data[arrayName] || []), newItemTemplate] // Ensure array exists before spreading
            }
        }));
    };

    // Helper to remove an item from an array field
    const removeArrayItem = (arrayName, index) => {
        setFormData(prev => ({
            ...prev,
            brsr_report_data: {
                ...prev.brsr_report_data,
                [arrayName]: prev.brsr_report_data[arrayName]?.filter((_, i) => i !== index) || [] // Ensure array exists
            }
        }));
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setError('');
        setSuccess('');
        setLoading(true);
        try {
            // The formData already contains the nested brsr_report_data structure
            const updatedProfile = await updateCompanyProfile(formData);
            setProfile(updatedProfile.profile); // Assuming backend returns the updated profile under a 'profile' key
            // Re-initialize formData with the response to ensure consistency, especially with brsr_report_id
            setFormData({
                company_name: updatedProfile.profile.company_name || '',
                registered_office_address: updatedProfile.profile.registered_office_address || '',
                corporate_address: updatedProfile.profile.corporate_address || '',
                telephone: updatedProfile.profile.telephone || '',
                website: updatedProfile.profile.website || '',
                paid_up_capital: updatedProfile.profile.paid_up_capital || '',
                stock_exchange_listed: Array.isArray(updatedProfile.profile.stock_exchange_listed) ? updatedProfile.profile.stock_exchange_listed : (updatedProfile.profile.stock_exchange_listed ? String(updatedProfile.profile.stock_exchange_listed).split(',') : []),
                brsr_contact_name: updatedProfile.profile.brsr_contact_name || '',
                brsr_contact_number: updatedProfile.profile.brsr_contact_number || '',
                brsr_contact_mail: updatedProfile.profile.brsr_contact_mail || '',
                brsr_report_data: { // Ensure consistent handling after update
                    ...initialBrsrReportDataDefaults,
                    ...(updatedProfile.profile.brsr_report_data || {})
                }
            });
            setSuccess('Profile updated successfully!');
        } catch (err) {
            console.error("Error updating profile:", err);
            setError(err.response?.data?.message || err.message || 'Failed to update profile.');
        } finally {
            setLoading(false);
        }
    };

    if (loadingAuth || (loading && session)) { // Show loading if auth is loading OR if profile is loading AND user exists
        return <div className="form-container">Loading...</div>;
    }

    // If auth is done, no user, and redirect hasn't happened yet (or to prevent flash of content)
    if (!session) {
        return <div className="form-container">Redirecting to login...</div>; // Or null, or a more specific message
    }

    if (error && !profile) { // If initial load failed
        return <div className="form-container error-message">Error: {error}</div>;
    }
    
    if (!profile) {
        return <div className="form-container">No profile data found.</div>;
    }

    return (
        <div className="form-container" style={{ maxWidth: 700, margin: '40px auto', background: '#fff', borderRadius: 16, boxShadow: '0 2px 16px rgba(0,0,0,0.08)', padding: 32 }}>
            <h2>Edit General Disclosures</h2>
            <p>Update your company's general information. Fields like CIN, Email, and Year of Incorporation are non-editable.</p>
            
            {error && <p className="error-message">{error}</p>}
            {success && <p className="success-message">{success}</p>}

            <form onSubmit={handleSubmit}>
                <div className="form-group" style={{ marginBottom: 24 }}>
                    <label htmlFor="cin">Corporate Identification Number (CIN)</label>
                    <input type="text" id="cin" name="cin" value={profile.cin || ''} disabled />
                </div>
                <div className="form-group" style={{ marginBottom: 24 }}>
                    <label htmlFor="email">Registered Email</label>
                    <input type="email" id="email" name="email" value={profile.email || ''} disabled />
                </div>
                <div className="form-group" style={{ marginBottom: 24 }}>
                    <label htmlFor="year_of_incorporation">Year of Incorporation</label>
                    <input type="text" id="year_of_incorporation" name="year_of_incorporation" value={profile.year_of_incorporation || ''} disabled />
                </div>
                  <div className="form-group" style={{ marginBottom: 24 }}>
                    <label htmlFor="company_name">Company Name</label>
                    <input type="text" id="company_name" name="company_name" value={formData.company_name || ''} onChange={handleChange} required />
                </div>
                
                <div className="form-group" style={{ marginBottom: 24 }}>
                    <label htmlFor="registered_office_address">Registered Office Address</label>
                    <textarea id="registered_office_address" name="registered_office_address" value={formData.registered_office_address || ''} onChange={handleChange} />
                </div>
                
                <div className="form-group" style={{ marginBottom: 24 }}>
                    <label htmlFor="corporate_address">Corporate Address</label>
                    <textarea id="corporate_address" name="corporate_address" value={formData.corporate_address || ''} onChange={handleChange} />
                </div>
                
                <div className="form-group" style={{ marginBottom: 24 }}>
                    <label htmlFor="telephone">Telephone</label>
                    <input type="tel" id="telephone" name="telephone" value={formData.telephone || ''} onChange={handleChange} />
                </div>
                
                <div className="form-group" style={{ marginBottom: 24 }}>
                    <label htmlFor="website">Website</label>
                    <input type="url" id="website" name="website" value={formData.website || ''} onChange={handleChange} />
                </div>
                
                <div className="form-group" style={{ marginBottom: 24 }}>
                    <label htmlFor="paid_up_capital">Paid Up Capital</label>
                    <input type="text" id="paid_up_capital" name="paid_up_capital" value={formData.paid_up_capital || ''} onChange={handleChange} />
                </div>                <div className="form-group" style={{ marginBottom: 24 }}>
                    <label htmlFor="stock_exchange_listed">Stock Exchange Listed</label>
                    <input
                        type="text"
                        id="stock_exchange_listed"
                        name="stock_exchange_listed"
                        value={Array.isArray(formData.stock_exchange_listed) 
                            ? formData.stock_exchange_listed.join(', ') 
                            : formData.stock_exchange_listed || ''}
                        onChange={(e) => {
                            // Convert CSV string to array when saving to state
                            const exchangesList = e.target.value.split(',')
                                .map(item => item.trim())
                                .filter(item => item !== '');
                            setFormData(prev => ({
                                ...prev,
                                stock_exchange_listed: exchangesList
                            }));
                        }}
                        placeholder="Enter stock exchanges separated by commas (e.g., NSE, BSE, MSE)"
                    />
                    <small className="form-hint">Enter stock exchange names separated by commas (e.g., NSE, BSE)</small>
                </div>
                
                <div className="form-group" style={{ marginBottom: 24 }}>
                    <label htmlFor="brsr_contact_name">BRSR Contact Person Name</label>
                    <input type="text" id="brsr_contact_name" name="brsr_contact_name" value={formData.brsr_contact_name || ''} onChange={handleChange} />
                </div>
                
                <div className="form-group" style={{ marginBottom: 24 }}>
                    <label htmlFor="brsr_contact_number">BRSR Contact Number</label>
                    <input type="tel" id="brsr_contact_number" name="brsr_contact_number" value={formData.brsr_contact_number || ''} onChange={handleChange} />
                </div>
                
                <div className="form-group" style={{ marginBottom: 24 }}>
                    <label htmlFor="brsr_contact_mail">BRSR Contact Email</label>
                    <input type="email" id="brsr_contact_mail" name="brsr_contact_mail" value={formData.brsr_contact_mail || ''} onChange={handleChange} />
                </div>

                {/* BRSR Section A Fields */}
                <h3 className="form-section-header">BRSR Section A: Details of the Entity</h3>



                {/* Business Activities Turnover */}
                <div className="form-group">
                    <h4>Business Activities and Turnover</h4>
                    {formData.brsr_report_data?.sa_business_activities_turnover?.map((activity, index) => (
                        <div key={index} className="form-array-item">
                            <input 
                                type="text" 
                                name={`sa_business_activities_turnover[${index}].description_main`} 
                                value={activity.description_main} 
                                onChange={(e) => handleArrayObjectChange('sa_business_activities_turnover', index, 'description_main', e.target.value)} 
                                placeholder="Main Activity/Business Group" 
                            />
                            <input 
                                type="text" 
                                name={`sa_business_activities_turnover[${index}].description_business`} 
                                value={activity.description_business} 
                                onChange={(e) => handleArrayObjectChange('sa_business_activities_turnover', index, 'description_business', e.target.value)} 
                                placeholder="Business Activity Description" 
                            />
                            <input 
                                type="number" 
                                name={`sa_business_activities_turnover[${index}].turnover_percentage`} 
                                value={activity.turnover_percentage} 
                                onChange={(e) => handleArrayObjectChange('sa_business_activities_turnover', index, 'turnover_percentage', parseFloat(e.target.value))} 
                                placeholder="% of Turnover" 
                            />
                            <button type="button" onClick={() => removeArrayItem('sa_business_activities_turnover', index)} className="remove-item-button">Remove</button>
                        </div>
                    ))}
                    <button type="button" onClick={() => addArrayItem('sa_business_activities_turnover', { description_main: '', description_business: '', turnover_percentage: 0 })} className="add-item-button">Add Business Activity</button>
                </div>

                {/* Products/Services Turnover */}
                <div className="form-group">
                    <h4>Products/Services and Turnover</h4>
                    {formData.brsr_report_data?.sa_product_services_turnover?.map((product, index) => (
                        <div key={index} className="form-array-item">
                            <input 
                                type="text" 
                                name={`sa_product_services_turnover[${index}].product_service`} 
                                value={product.product_service} 
                                onChange={(e) => handleArrayObjectChange('sa_product_services_turnover', index, 'product_service', e.target.value)} 
                                placeholder="Product/Service Name" 
                            />
                            <input 
                                type="text" 
                                name={`sa_product_services_turnover[${index}].nic_code`} 
                                value={product.nic_code} 
                                onChange={(e) => handleArrayObjectChange('sa_product_services_turnover', index, 'nic_code', e.target.value)} 
                                placeholder="NIC Code" 
                            />
                            <input 
                                type="number" 
                                name={`sa_product_services_turnover[${index}].turnover_contributed`} 
                                value={product.turnover_contributed} 
                                onChange={(e) => handleArrayObjectChange('sa_product_services_turnover', index, 'turnover_contributed', parseFloat(e.target.value))} 
                                placeholder="% of Turnover Contributed" 
                            />
                            <button type="button" onClick={() => removeArrayItem('sa_product_services_turnover', index)} className="remove-item-button">Remove</button>
                        </div>
                    ))}
                    <button type="button" onClick={() => addArrayItem('sa_product_services_turnover', { product_service: '', nic_code: '', turnover_contributed: 0 })} className="add-item-button">Add Product/Service</button>
                </div>

                {/* Locations - Plants and Offices */}
                <div className="form-group">
                    <h4>Locations of Plants and Offices</h4>
                    <label htmlFor="sa_locations_plants_offices.national_plants">National Plants</label>
                    <input type="number" id="sa_locations_plants_offices.national_plants" name="brsr_report_data.sa_locations_plants_offices.national_plants" value={formData.brsr_report_data?.sa_locations_plants_offices?.national_plants || 0} onChange={handleChange} />
                    
                    <label htmlFor="sa_locations_plants_offices.national_offices">National Offices</label>
                    <input type="number" id="sa_locations_plants_offices.national_offices" name="brsr_report_data.sa_locations_plants_offices.national_offices" value={formData.brsr_report_data?.sa_locations_plants_offices?.national_offices || 0} onChange={handleChange} />
                    
                    <label htmlFor="sa_locations_plants_offices.international_plants">International Plants</label>
                    <input type="number" id="sa_locations_plants_offices.international_plants" name="brsr_report_data.sa_locations_plants_offices.international_plants" value={formData.brsr_report_data?.sa_locations_plants_offices?.international_plants || 0} onChange={handleChange} />
                    
                    <label htmlFor="sa_locations_plants_offices.international_offices">International Offices</label>
                    <input type="number" id="sa_locations_plants_offices.international_offices" name="brsr_report_data.sa_locations_plants_offices.international_offices" value={formData.brsr_report_data?.sa_locations_plants_offices?.international_offices || 0} onChange={handleChange} />
                </div>

                {/* Markets Served - Locations */}
                <div className="form-group">
                    <h4>Markets Served (Locations)</h4>
                    <label htmlFor="sa_markets_served.locations.national_states">National (No. of States)</label>
                    <input type="number" id="sa_markets_served.locations.national_states" name="brsr_report_data.sa_markets_served.locations.national_states" value={formData.brsr_report_data?.sa_markets_served?.locations?.national_states || 0} onChange={handleChange} />
                    
                    <label htmlFor="sa_markets_served.locations.international_countries">International (No. of Countries)</label>
                    <input type="number" id="sa_markets_served.locations.international_countries" name="brsr_report_data.sa_markets_served.locations.international_countries" value={formData.brsr_report_data?.sa_markets_served?.locations?.international_countries || 0} onChange={handleChange} />
                </div>

                <div className="form-group">
                    <label htmlFor="sa_markets_served.exports_percentage">Contribution of Exports to Total Turnover (%)</label>
                    <input type="number" id="sa_markets_served.exports_percentage" name="brsr_report_data.sa_markets_served.exports_percentage" value={formData.brsr_report_data?.sa_markets_served?.exports_percentage || ''} onChange={handleChange} placeholder="e.g., 40"/>
                </div>

                <div className="form-group">
                    <label htmlFor="sa_markets_served.customer_types">Customer Types</label>
                    <input type="text" id="sa_markets_served.customer_types" name="brsr_report_data.sa_markets_served.customer_types" value={formData.brsr_report_data?.sa_markets_served?.customer_types || ''} onChange={handleChange} placeholder="e.g., B2B, B2C, Government"/>
                </div>
                
                <button type="submit" className="form-button" style={{ borderRadius: 24, padding: '10px 32px', fontSize: 18, marginTop: 24 }}>Save Changes</button>
                <button type="button" className="form-button secondary" onClick={() => navigate('/profile')}>Cancel</button>
            </form>
        </div>
    );
}

export default EditDisclosuresPage;
