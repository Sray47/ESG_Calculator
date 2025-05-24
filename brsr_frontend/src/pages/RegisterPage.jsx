// src/pages/RegisterPage.jsx
import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { registerCompanyAndCreateProfile } from '../services/authService.js'; // Updated service
import './AuthForm.css'; // Make sure this CSS file exists and is styled

function RegisterPage() {
    const initialActivity = { description_main: '', description_business: '', turnover_percentage: '' };
    const initialProduct = { product_service: '', nic_code: '', turnover_contributed: '' };    const [formData, setFormData] = useState({
        // Authentication fields (for Supabase)
        email: '', // This will be used for Supabase Auth
        password: '',
        // Company Profile fields
        cin: '',
        company_name: '',
        year_of_incorporation: '',
        registered_office_address: '',
        corporate_address: '',
        // email field is already there for auth
        telephone: '',
        website: '',
        stock_exchanges_listed: '', // Front-end name, will be sent as stock_exchange_listed to backend
        paid_up_capital: '',
        brsr_contact_person_name: '', // Will be sent as brsr_contact_name to backend
        brsr_contact_person_email: '', // Will be sent as brsr_contact_mail to backend
        brsr_contact_person_telephone: '', // Will be sent as brsr_contact_number to backend
        reporting_boundary: 'standalone',
        sa_business_activities_turnover: [{ description_main: '', description_business: '', turnover_percentage: '' }],
        sa_product_services_turnover: [{ product_service: '', nic_code: '', turnover_contributed: '' }], // Will be mapped to sa_product_services_turnover in DB
        sa_locations_plants_offices: { national_plants: 0, national_offices: 0, international_plants: 0, international_offices: 0 },
        sa_markets_served_locations: { national_states: 0, international_countries: 0 },
        sa_markets_served_exports_percentage: '',
        sa_markets_served_customer_types: '',
    });
    const [confirmPassword, setConfirmPassword] = useState(''); // For UI validation

    const [error, setError] = useState('');
    const [loading, setLoading] = useState(false);
    const navigate = useNavigate();

    const handleChange = (e) => {
        const { name, value, type, checked } = e.target;

        if (name.startsWith("sa_locations_plants_offices.")) {
            const key = name.split(".")[1];
            setFormData(prev => ({ ...prev, sa_locations_plants_offices: { ...prev.sa_locations_plants_offices, [key]: value }}));
        } else if (name.startsWith("sa_markets_served_locations.")) {
            const key = name.split(".")[1];
            setFormData(prev => ({ ...prev, sa_markets_served_locations: { ...prev.sa_markets_served_locations, [key]: value }}));
        } else {
            setFormData(prev => ({ ...prev, [name]: type === 'checkbox' ? checked : value }));
        }
    };

    // Handlers for Dynamic Table for Business Activities (Q14)
    const handleActivityChange = (index, e) => {
        const { name, value } = e.target;
        const list = [...formData.sa_business_activities_turnover];
        list[index][name] = value;
        setFormData(prev => ({ ...prev, sa_business_activities_turnover: list }));
    };
    const addActivity = () => {
        setFormData(prev => ({
            ...prev,
            sa_business_activities_turnover: [...prev.sa_business_activities_turnover, { ...initialActivity }]
        }));
    };
    const removeActivity = (index) => {
        const list = [...formData.sa_business_activities_turnover];
        list.splice(index, 1);
        setFormData(prev => ({ ...prev, sa_business_activities_turnover: list }));
    };

    // Handlers for Dynamic Table for Products/Services (Q15)
    const handleProductChange = (index, e) => {
        const { name, value } = e.target;
        const list = [...formData.sa_product_services_turnover];
        list[index][name] = value;
        setFormData(prev => ({ ...prev, sa_product_services_turnover: list }));
    };
    const addProduct = () => {
        setFormData(prev => ({
            ...prev,
            sa_product_services_turnover: [...prev.sa_product_services_turnover, { ...initialProduct }]
        }));
    };
    const removeProduct = (index) => {
        const list = [...formData.sa_product_services_turnover];
        list.splice(index, 1);
        setFormData(prev => ({ ...prev, sa_product_services_turnover: list }));
    };


    const handleSubmit = async (e) => {
        e.preventDefault();
        if (formData.password !== confirmPassword) { // UI validation for confirmPassword
            setError("Passwords do not match.");
            return;
        }
        setError('');
        setLoading(true);

        try {            const dataToSubmit = {
                // Fields for Supabase Auth
                email: formData.email,
                password: formData.password,
                // Fields for your backend /create-profile
                cin: formData.cin,
                company_name: formData.company_name,
                year_of_incorporation: formData.year_of_incorporation ? parseInt(formData.year_of_incorporation) : null,
                registered_office_address: formData.registered_office_address,
                corporate_address: formData.corporate_address,
                telephone: formData.telephone,
                website: formData.website,
                stock_exchange_listed: formData.stock_exchanges_listed ? formData.stock_exchanges_listed.split(',').map(s => s.trim()).filter(s => s) : [], // Parse to array here
                paid_up_capital: formData.paid_up_capital,
                brsr_contact_name: formData.brsr_contact_person_name, // Map to backend field name
                brsr_contact_mail: formData.brsr_contact_person_email, // Map to backend field name
                brsr_contact_number: formData.brsr_contact_person_telephone, // Map to backend field name
                reporting_boundary: formData.reporting_boundary,
                sa_business_activities_turnover: formData.sa_business_activities_turnover.filter(
                    act => act.description_main || act.description_business || act.turnover_percentage
                ).map(act => ({...act, turnover_percentage: parseFloat(act.turnover_percentage) || 0 })),
                sa_product_services_turnover: formData.sa_product_services_turnover.filter( // This gets mapped to sa_product_services_turnover in the database
                    prod => prod.product_service || prod.nic_code || prod.turnover_contributed
                ).map(prod => ({...prod, turnover_contributed: parseFloat(prod.turnover_contributed) || 0 })),
                sa_locations_plants_offices: {
                    national_plants: parseInt(formData.sa_locations_plants_offices.national_plants) || 0,
                    national_offices: parseInt(formData.sa_locations_plants_offices.national_offices) || 0,
                    international_plants: parseInt(formData.sa_locations_plants_offices.international_plants) || 0,
                    international_offices: parseInt(formData.sa_locations_plants_offices.international_offices) || 0,
                },
                sa_markets_served: {
                    locations: formData.sa_markets_served_locations,
                    exports_percentage: formData.sa_markets_served_exports_percentage,
                    customer_types: formData.sa_markets_served_customer_types
                },
            };

            await registerCompanyAndCreateProfile(dataToSubmit);
            // Supabase might require email confirmation.
            // Navigate to a page informing the user to check their email, or directly to login if auto-confirmed.
            navigate('/login', { state: { message: 'Registration successful! Please check your email for confirmation if required, then log in.', type: 'success' } });
        } catch (err) {
            setError(err.message || 'Failed to register. Please try again.');
            console.error("Registration Page Error:", err);
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="auth-container">
            <form onSubmit={handleSubmit} className="auth-form register-form">
                <h2>Company Registration</h2>
                {error && <p className="error-message">{error}</p>}

                {/* Authentication Info */}
                <h4>Authentication Credentials</h4>
                <div className="form-group">
                    <label htmlFor="email">Login Email (Q6):</label> {/* Use company email for login */}
                    <input type="email" id="email" name="email" value={formData.email} onChange={handleChange} required />
                </div>
                <div className="form-group">
                    <label htmlFor="password">Password:</label>
                    <input type="password" id="password" name="password" value={formData.password} onChange={handleChange} required />
                </div>
                <div className="form-group">
                    <label htmlFor="confirmPassword">Confirm Password:</label>
                    <input type="password" id="confirmPassword" name="confirmPassword" value={confirmPassword} onChange={(e) => setConfirmPassword(e.target.value)} required />
                </div>

                <h3>Section A: General Disclosures (Company Profile)</h3>
                {/* CIN is now a profile field, not primary auth identifier with password */}
                <div className="form-group">
                    <label htmlFor="cin">Corporate Identity Number (CIN) (Q1):</label>
                    <input type="text" id="cin" name="cin" value={formData.cin} onChange={handleChange} required />
                </div>

                <h4>2. Basic Company Details</h4>
                <div className="form-group">
                    <label htmlFor="company_name">Name of the Listed Entity (Q2):</label>
                    <input type="text" id="company_name" name="company_name" value={formData.company_name} onChange={handleChange} required />
                </div>
                <div className="form-group">
                    <label htmlFor="year_of_incorporation">Year of incorporation (Q3):</label>
                    <input type="number" placeholder="YYYY" id="year_of_incorporation" name="year_of_incorporation" value={formData.year_of_incorporation} onChange={handleChange} />
                </div>
                <div className="form-group">
                    <label htmlFor="registered_office_address">Registered office address (Q4):</label>
                    <textarea id="registered_office_address" name="registered_office_address" value={formData.registered_office_address} onChange={handleChange}></textarea>
                </div>
                <div className="form-group">
                    <label htmlFor="corporate_address">Corporate address (if different) (Q5):</label>
                    <textarea id="corporate_address" name="corporate_address" value={formData.corporate_address} onChange={handleChange}></textarea>
                </div>
                {/* Email is handled in Auth section */}
                <div className="form-group">
                    <label htmlFor="telephone">Telephone (Q7):</label>
                    <input type="tel" id="telephone" name="telephone" value={formData.telephone} onChange={handleChange} />
                </div>
                <div className="form-group">
                    <label htmlFor="website">Website (Q8):</label>
                    <input type="url" id="website" name="website" placeholder="https://example.com" value={formData.website} onChange={handleChange} />
                </div>
                {/* Q9 is Financial year for reporting - not part of static registration data */}
                <div className="form-group">
                    <label htmlFor="stock_exchanges_listed">Name of the Stock Exchange(s) where shares are listed (Q10) (comma-separated):</label>
                    <input type="text" id="stock_exchanges_listed" name="stock_exchanges_listed" value={formData.stock_exchanges_listed} onChange={handleChange} />
                </div>
                <div className="form-group">
                    <label htmlFor="paid_up_capital">Paid-up Capital (Q11):</label>
                    <input type="text" id="paid_up_capital" name="paid_up_capital" value={formData.paid_up_capital} onChange={handleChange} />
                </div>

                <h4>3. BRSR Contact & Reporting Boundary</h4>
                <div className="form-group">
                    <label htmlFor="brsr_contact_person_name">BRSR Contact Person Name (Q12):</label>
                    <input type="text" id="brsr_contact_person_name" name="brsr_contact_person_name" value={formData.brsr_contact_person_name} onChange={handleChange} />
                </div>
                <div className="form-group">
                    <label htmlFor="brsr_contact_person_email">BRSR Contact Person E-mail (Q12):</label>
                    <input type="email" id="brsr_contact_person_email" name="brsr_contact_person_email" value={formData.brsr_contact_person_email} onChange={handleChange} />
                </div>
                <div className="form-group">
                    <label htmlFor="brsr_contact_person_telephone">BRSR Contact Person Telephone (Q12):</label>
                    <input type="tel" id="brsr_contact_person_telephone" name="brsr_contact_person_telephone" value={formData.brsr_contact_person_telephone} onChange={handleChange} />
                </div>
                <div className="form-group">
                    <label htmlFor="reporting_boundary">Reporting boundary (Q13):</label>
                    <select id="reporting_boundary" name="reporting_boundary" value={formData.reporting_boundary} onChange={handleChange}>
                        <option value="standalone">Standalone</option>
                        <option value="consolidated">Consolidated</option>
                    </select>
                </div>

                <h4>4. Business Activities (Q14)</h4>
                <p className="form-hint">Details of business activities (accounting for 90% of the turnover)</p>
                {formData.sa_business_activities_turnover.map((activity, index) => (
                    <div key={index} className="dynamic-table-item">
                        <h5>Activity {index + 1}</h5>
                        <div className="form-group">
                            <label htmlFor={`activity_description_main_${index}`}>Description of Main Activity:</label>
                            <input type="text" id={`activity_description_main_${index}`} name="description_main" value={activity.description_main} onChange={(e) => handleActivityChange(index, e)} />
                        </div>
                        <div className="form-group">
                            <label htmlFor={`activity_description_business_${index}`}>Description of Business Activity:</label>
                            <input type="text" id={`activity_description_business_${index}`} name="description_business" value={activity.description_business} onChange={(e) => handleActivityChange(index, e)} />
                        </div>
                        <div className="form-group">
                            <label htmlFor={`activity_turnover_percentage_${index}`}>% of Turnover of the entity:</label>
                            <input type="number" step="0.01" id={`activity_turnover_percentage_${index}`} name="turnover_percentage" placeholder="e.g., 60.5" value={activity.turnover_percentage} onChange={(e) => handleActivityChange(index, e)} />
                        </div>
                        {formData.sa_business_activities_turnover.length > 1 && (
                            <button type="button" onClick={() => removeActivity(index)} className="remove-row-button">Remove Activity</button>
                        )}
                    </div>
                ))}
                <button type="button" onClick={addActivity} className="add-row-button">Add Business Activity</button>

                <h4>5. Products/Services Sold (Q15)</h4>
                <p className="form-hint">Products/Services sold by the entity (accounting for 90% of the entity’s Turnover)</p>
                 {formData.sa_product_services_turnover.map((product, index) => (
                    <div key={index} className="dynamic-table-item">
                        <h5>Product/Service {index + 1}</h5>
                        <div className="form-group">
                            <label htmlFor={`product_service_${index}`}>Product/Service:</label>
                            <input type="text" id={`product_service_${index}`} name="product_service" value={product.product_service} onChange={(e) => handleProductChange(index, e)} />
                        </div>
                        <div className="form-group">
                            <label htmlFor={`nic_code_${index}`}>NIC Code:</label>
                            <input type="text" id={`nic_code_${index}`} name="nic_code" value={product.nic_code} onChange={(e) => handleProductChange(index, e)} />
                        </div>
                        <div className="form-group">
                            <label htmlFor={`turnover_contributed_${index}`}>% of total Turnover contributed:</label>
                            <input type="number" step="0.01" id={`turnover_contributed_${index}`} name="turnover_contributed" placeholder="e.g., 30.0" value={product.turnover_contributed} onChange={(e) => handleProductChange(index, e)} />
                        </div>
                        {formData.sa_product_services_turnover.length > 1 && (
                            <button type="button" onClick={() => removeProduct(index)} className="remove-row-button">Remove Product/Service</button>
                        )}
                    </div>
                ))}
                <button type="button" onClick={addProduct} className="add-row-button">Add Product/Service</button>

                <h4>6. Locations (Q16)</h4>
                <p className="form-hint">Number of locations where plants and/or operations/offices are situated</p>
                <div className="form-group">
                    <label htmlFor="national_plants">National - Number of plants:</label>
                    <input type="number" id="national_plants" name="sa_locations_plants_offices.national_plants" value={formData.sa_locations_plants_offices.national_plants} onChange={handleChange} />
                </div>
                <div className="form-group">
                    <label htmlFor="national_offices">National - Number of offices:</label>
                    <input type="number" id="national_offices" name="sa_locations_plants_offices.national_offices" value={formData.sa_locations_plants_offices.national_offices} onChange={handleChange} />
                </div>
                <div className="form-group">
                    <label htmlFor="international_plants">International - Number of plants:</label>
                    <input type="number" id="international_plants" name="sa_locations_plants_offices.international_plants" value={formData.sa_locations_plants_offices.international_plants} onChange={handleChange} />
                </div>
                <div className="form-group">
                    <label htmlFor="international_offices">International - Number of offices:</label>
                    <input type="number" id="international_offices" name="sa_locations_plants_offices.international_offices" value={formData.sa_locations_plants_offices.international_offices} onChange={handleChange} />
                </div>

                <h4>7. Markets Served (Q17)</h4>
                <div className="form-group">
                     <label htmlFor="national_states">National (No. of States) (Q17a):</label>
                     <input type="number" id="national_states" name="sa_markets_served_locations.national_states" value={formData.sa_markets_served_locations.national_states} onChange={handleChange} />
                </div>
                <div className="form-group">
                     <label htmlFor="international_countries">International (No. of Countries) (Q17a):</label>
                     <input type="number" id="international_countries" name="sa_markets_served_locations.international_countries" value={formData.sa_markets_served_locations.international_countries} onChange={handleChange} />
                </div>
                <div className="form-group">
                    <label htmlFor="sa_markets_served_exports_percentage">Contribution of exports as % of total turnover (Q17b):</label>
                    <input type="number" step="0.01" id="sa_markets_served_exports_percentage" name="sa_markets_served_exports_percentage" value={formData.sa_markets_served_exports_percentage} onChange={handleChange} />
                </div>
                <div className="form-group">
                    <label htmlFor="sa_markets_served_customer_types">A brief on types of customers (Q17c):</label>
                    <textarea id="sa_markets_served_customer_types" name="sa_markets_served_customer_types" value={formData.sa_markets_served_customer_types} onChange={handleChange}></textarea>
                </div>

                <button type="submit" disabled={loading} className="auth-button">
                    {loading ? 'Registering...' : 'Register'}
                </button>
                <p className="switch-auth">
                    Already have an account? <Link to="/login">Login</Link>
                </p>
            </form>
        </div>
    );
}
export default RegisterPage;