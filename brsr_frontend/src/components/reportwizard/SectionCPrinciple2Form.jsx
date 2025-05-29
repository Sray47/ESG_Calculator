import React, { useState, useEffect } from 'react';
import { useOutletContext } from 'react-router-dom';
import { deepMerge, setNestedValue } from "../../utils/objectUtils";

const initialPrinciple2Data = {
    // Essential Indicators
    // Image 1, Q1: R&D and Capex Investments (Percentages)
    p2_essential_rd_capex_percentages: {
        rd_percentage_current_fy: null, // e.g., 2022-23 from image
        capex_percentage_current_fy: null,
        rd_improvements_details: '', // Details of improvements for R&D
        capex_improvements_details: '', // Details of improvements for Capex
    },
    // Image 1, Q2: Sustainable Sourcing
    p2_essential_sustainable_sourcing: {
        has_procedures: null, // Yes/No for "a. Does the entity have procedures..."
        percentage_inputs_sourced_sustainably: null, // For "b. If yes, what percentage..."
    },
    // Image 1, Q3: Reclaim Processes (Descriptive)
    p2_essential_reclaim_processes_description: {
        plastics: '', // Description for plastics
        e_waste: '',  // Description for e-waste
        hazardous_waste: '', // Description for hazardous waste
        other_waste: '', // Description for other waste
    },
    // Image 2, Top Q4: Extended Producer Responsibility (EPR)
    p2_essential_epr_status: {
        is_epr_applicable: null, // Yes/No
        is_collection_plan_in_line_with_epr: null, // Yes/No, if EPR is applicable
        steps_to_address_epr_gap: '', // Text, if collection plan is not in line
    },

    // Leadership Indicators
    // Image 2, Bottom Q1: Life Cycle Assessment (LCA)
    p2_leadership_lca_details: {
        conducted: null, // Yes/No
        assessments: [], // Array of LCA assessments
        // Each assessment object: { nic_code: '', product_service_name: '', turnover_percentage: null, lca_boundary: '', conducted_by_external_agency: null /* Yes/No */, results_communicated_publicly: null /* Yes/No */, lca_summary_weblink: '' }
    },
    // Image 3, Q2: Significant social or environmental concerns/risks
    p2_leadership_product_risks: [], // Array of risks
    // Each risk object: { product_service_name: '', risk_description: '', action_taken: '' }

    // Image 3, Q3: Percentage of recycled or reused input material (by value)
    p2_leadership_recycled_input_value_percentage: [], // Array of input materials
    // Each input object: { input_material_category: '', percentage_by_value_current_fy: null }

    // Image 3, Q4: Products and packaging reclaimed at end of life (metric tonnes)
    p2_leadership_reclaimed_waste_quantities: {
        plastics: { current_fy_reused_mt: null, current_fy_recycled_mt: null, current_fy_safely_disposed_mt: null },
        e_waste: { current_fy_reused_mt: null, current_fy_recycled_mt: null, current_fy_safely_disposed_mt: null },
        hazardous_waste: { current_fy_reused_mt: null, current_fy_recycled_mt: null, current_fy_safely_disposed_mt: null },
        other_waste: { current_fy_reused_mt: null, current_fy_recycled_mt: null, current_fy_safely_disposed_mt: null },
    },
    // Image 3, Q5: Reclaimed products and their packaging materials (as percentage of products sold)
    p2_leadership_reclaimed_products_as_percentage_sold: [], // Array of product categories
    // Each category object: { product_category: '', reclaimed_as_percentage_of_sold: null }
};

function SectionCPrinciple2Form() {
    const { reportData, handleSaveProgress, isSubmitted, isLoadingSave, setError: setWizardError } = useOutletContext();
    // Initialize with a deep copy of the new structure
    const [formData, setFormData] = useState(() => JSON.parse(JSON.stringify(initialPrinciple2Data)));
    const [localError, setLocalError] = useState('');
    const [localSuccess, setLocalSuccess] = useState('');

    useEffect(() => {
        if (reportData && reportData.section_c_data && reportData.section_c_data.principle_2) {
            // Use deepMerge to populate formData, ensuring new fields are present
            // Create a fresh initial state object to merge into, preserving all keys from initialPrinciple2Data
            const freshInitialData = JSON.parse(JSON.stringify(initialPrinciple2Data));
            const mergedData = deepMerge(freshInitialData, reportData.section_c_data.principle_2);
            setFormData(mergedData);
        } else if (reportData) { // reportData exists but principle_2 data might be missing or empty
            setFormData(JSON.parse(JSON.stringify(initialPrinciple2Data)));
        }
    }, [reportData]);

    const handleChange = (e) => {
        const { name, value, type, checked } = e.target;
        const keys = name.split('.');
        let newFormData = { ...formData };

        if (type === 'radio') {
            if (value === 'yes') setNestedValue(newFormData, keys, true);
            else if (value === 'no') setNestedValue(newFormData, keys, false);
            else setNestedValue(newFormData, keys, value);
        } else {
            setNestedValue(newFormData, keys, type === 'checkbox' ? checked : (type === 'number' ? (value === '' ? null : parseFloat(value)) : value));
        }
        setFormData(newFormData);
    };    

    const handleArrayChange = (arrayPath, index, fieldName, value, type = 'text', checked = false) => {
        const keys = arrayPath.split('.');
        let newFormData = { ...formData }; 
    
        let currentLevel = newFormData;
        for (let i = 0; i < keys.length -1; i++) {
            if (!currentLevel[keys[i]] || typeof currentLevel[keys[i]] !== 'object') { 
                currentLevel[keys[i]] = {}; 
            }
            currentLevel = currentLevel[keys[i]];
        }
        
        let currentArray = currentLevel[keys[keys.length -1]] ? [...currentLevel[keys[keys.length -1]]] : [];
    
        if (index >= currentArray.length) { 
            console.error("Index out of bounds in handleArrayChange for path:", arrayPath, "index:", index);
            // Optionally, add the item if it's a new item being added to an empty array at index 0
            if (index === 0 && currentArray.length === 0) {
                currentArray.push({}); // Add an empty object to modify
            } else {
                return; // Or handle error more gracefully
            }
        }
    
        currentArray[index] = {
            ...currentArray[index],
            [fieldName]: type === 'checkbox' ? checked : (type === 'number' ? (value === '' ? null : parseFloat(value)) : value)
        };
        
        currentLevel[keys[keys.length -1]] = currentArray;
        setFormData(newFormData);
    };
    
    const addArrayItem = (arrayPath, itemStructure) => {
        const keys = arrayPath.split('.');
        let newFormData = { ...formData }; 
    
        let currentLevel = newFormData;
        for (let i = 0; i < keys.length - 1; i++) {
            if (!currentLevel[keys[i]] || typeof currentLevel[keys[i]] !== 'object') { 
                currentLevel[keys[i]] = {}; 
            }
            currentLevel = currentLevel[keys[i]];
        }
        
        const currentArray = currentLevel[keys[keys.length - 1]] ? [...currentLevel[keys[keys.length - 1]]] : [];
        currentArray.push({ ...itemStructure });
        currentLevel[keys[keys.length - 1]] = currentArray;
        
        setFormData(newFormData);
    };
    
    const removeArrayItem = (arrayPath, index) => {
        const keys = arrayPath.split('.');
        let newFormData = { ...formData };
    
        let currentLevel = newFormData;
        for (let i = 0; i < keys.length - 1; i++) {
            if (!currentLevel[keys[i]]) {
                console.error("Path does not exist for removal:", arrayPath);
                return; 
            }
            currentLevel = currentLevel[keys[i]];
        }
    
        let currentArray = currentLevel[keys[keys.length - 1]] ? [...currentLevel[keys[keys.length - 1]]] : [];
        if (index < 0 || index >= currentArray.length) {
            console.error("Index out of bounds for removal:", arrayPath, "index:", index);
            return; 
        }
    
        currentArray.splice(index, 1);
        currentLevel[keys[keys.length - 1]] = currentArray;
        
        setFormData(newFormData);
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setLocalError('');
        setLocalSuccess('');
        if (setWizardError) setWizardError(''); 

        const payload = { section_c_data: { principle_2: formData } };
        const success = await handleSaveProgress(payload);
        if (success) {
            setLocalSuccess('Principle 2 data saved successfully!');
        } else {
            setLocalError('Failed to save Principle 2 data. Check wizard errors or console.');
        }
    };

    // Helper to safely get nested values, especially for tables
    const getSafeTableValue = (path, defaultValue = null) => {
        const keys = path.split('.');
        let current = formData;
        for (const key of keys) {
            if (current && typeof current === 'object' && key in current && current[key] !== undefined) {
                current = current[key];
            } else {
                return defaultValue;
            }
        }
        return current === null ? defaultValue : current; // Return defaultValue if final value is null but a non-null default was provided
    };
    
    const getSafe = (path, defaultValue = '') => {
        const keys = path.split('.');
        let current = formData;
        for (const key of keys) {
            if (current && typeof current === 'object' && key in current && current[key] !== null && current[key] !== undefined) {
                current = current[key];
            } else {
                return defaultValue;
            }
        }
        // If current is null or undefined at the end, but not an object/array that was expected, return default
        if (current === null && defaultValue !== null) return defaultValue;
        return current;
    };


    if (!reportData) return <p>Loading Principle 2 data...</p>;
    const disabled = isSubmitted || isLoadingSave;

    return (
        <form onSubmit={handleSubmit} className="profile-form">
            <h3>Principle 2: Sustainable and Safe Goods & Services</h3>
            <p>Businesses should provide goods and services in a manner that is sustainable and safe.</p>

            {localError && <p className="error-message" style={{ color: 'red' }}>{localError}</p>}
            {localSuccess && <p className="success-message" style={{ color: 'green' }}>{localSuccess}</p>}

            <h4>Essential Indicators</h4>

            {/* EI Q1: R&D and Capex Investments (Image 1, Q1) */}
            <div className="form-section">
                <h5>1. Percentage of R&D and capital expenditure (capex) investments in specific technologies to improve the environmental and social impacts of product and processes to total R&D and capex investments made by the entity, respectively.</h5>
                <table>
                    <thead>
                        <tr>
                            <th>Investment Type</th>
                            <th>Current FY (%) (e.g., 2022-23)</th>
                        </tr>
                    </thead>
                    <tbody>
                        <tr>
                            <td>R&D</td>
                            <td><input type="number" step="0.01" name="p2_essential_rd_capex_percentages.rd_percentage_current_fy" value={getSafe('p2_essential_rd_capex_percentages.rd_percentage_current_fy', null) ?? ''} onChange={handleChange} disabled={disabled} /></td>
                        </tr>
                        <tr>
                            <td>Capex</td>
                            <td><input type="number" step="0.01" name="p2_essential_rd_capex_percentages.capex_percentage_current_fy" value={getSafe('p2_essential_rd_capex_percentages.capex_percentage_current_fy', null) ?? ''} onChange={handleChange} disabled={disabled} /></td>
                        </tr>
                    </tbody>
                </table>
                <label>Details of improvements in environmental and social impacts for R&D:</label>
                <textarea name="p2_essential_rd_capex_percentages.rd_improvements_details" value={getSafe('p2_essential_rd_capex_percentages.rd_improvements_details')} onChange={handleChange} disabled={disabled} rows={3}></textarea>
                
                <label>Details of improvements in environmental and social impacts for Capex:</label>
                <textarea name="p2_essential_rd_capex_percentages.capex_improvements_details" value={getSafe('p2_essential_rd_capex_percentages.capex_improvements_details')} onChange={handleChange} disabled={disabled} rows={3}></textarea>
            </div>

            {/* EI Q2: Sustainable Sourcing (Image 1, Q2) */}
            <div className="form-section">
                <h5>2. Sustainable Sourcing:</h5>
                <label>a. Does the entity have procedures in place for sustainable sourcing?</label>
                <div className="radio-group">
                    <label><input type="radio" name="p2_essential_sustainable_sourcing.has_procedures" value="yes" checked={getSafe('p2_essential_sustainable_sourcing.has_procedures', null) === true} onChange={handleChange} disabled={disabled} /> Yes</label>
                    <label><input type="radio" name="p2_essential_sustainable_sourcing.has_procedures" value="no" checked={getSafe('p2_essential_sustainable_sourcing.has_procedures', null) === false} onChange={handleChange} disabled={disabled} /> No</label>
                </div>
                {getSafe('p2_essential_sustainable_sourcing.has_procedures', null) === true && (
                    <>
                        <label>b. If yes, what percentage of inputs were sourced sustainably?</label>
                        <input type="number" step="0.01" name="p2_essential_sustainable_sourcing.percentage_inputs_sourced_sustainably" value={getSafe('p2_essential_sustainable_sourcing.percentage_inputs_sourced_sustainably', null) ?? ''} onChange={handleChange} disabled={disabled} /> %
                    </>
                )}
            </div>

            {/* EI Q3: Reclaim Processes (Description) (Image 1, Q3) */}
            <div className="form-section">
                <h5>3. Describe the processes in place to safely reclaim your products for reusing, recycling and disposing at the end of life, for:</h5>
                <label>a. Plastics (including packaging):</label>
                <textarea name="p2_essential_reclaim_processes_description.plastics" value={getSafe('p2_essential_reclaim_processes_description.plastics')} onChange={handleChange} disabled={disabled} rows={2}></textarea>
                <label>b. E-waste:</label>
                <textarea name="p2_essential_reclaim_processes_description.e_waste" value={getSafe('p2_essential_reclaim_processes_description.e_waste')} onChange={handleChange} disabled={disabled} rows={2}></textarea>
                <label>c. Hazardous waste:</label>
                <textarea name="p2_essential_reclaim_processes_description.hazardous_waste" value={getSafe('p2_essential_reclaim_processes_description.hazardous_waste')} onChange={handleChange} disabled={disabled} rows={2}></textarea>
                <label>d. Other waste:</label>
                <textarea name="p2_essential_reclaim_processes_description.other_waste" value={getSafe('p2_essential_reclaim_processes_description.other_waste')} onChange={handleChange} disabled={disabled} rows={2}></textarea>
            </div>

            {/* EI Q4: Extended Producer Responsibility (EPR) (Image 2, Top Q4) */}
            <div className="form-section">
                <h5>4. Extended Producer Responsibility (EPR):</h5>
                <label>a. Whether Extended Producer Responsibility (EPR) is applicable to the entity’s activities?</label>
                <div className="radio-group">
                    <label><input type="radio" name="p2_essential_epr_status.is_epr_applicable" value="yes" checked={getSafe('p2_essential_epr_status.is_epr_applicable', null) === true} onChange={handleChange} disabled={disabled} /> Yes</label>
                    <label><input type="radio" name="p2_essential_epr_status.is_epr_applicable" value="no" checked={getSafe('p2_essential_epr_status.is_epr_applicable', null) === false} onChange={handleChange} disabled={disabled} /> No</label>
                </div>
                {getSafe('p2_essential_epr_status.is_epr_applicable', null) === true && (
                    <>
                        <label>b. If yes, whether the waste collection plan is in line with the Extended Producer Responsibility (EPR) plan submitted to Pollution Control Boards?</label>
                        <div className="radio-group">
                            <label><input type="radio" name="p2_essential_epr_status.is_collection_plan_in_line_with_epr" value="yes" checked={getSafe('p2_essential_epr_status.is_collection_plan_in_line_with_epr', null) === true} onChange={handleChange} disabled={disabled} /> Yes</label>
                            <label><input type="radio" name="p2_essential_epr_status.is_collection_plan_in_line_with_epr" value="no" checked={getSafe('p2_essential_epr_status.is_collection_plan_in_line_with_epr', null) === false} onChange={handleChange} disabled={disabled} /> No</label>
                        </div>
                        {getSafe('p2_essential_epr_status.is_collection_plan_in_line_with_epr', null) === false && (
                             <>
                                <label>c. If not, provide steps taken to address the same:</label>
                                <textarea name="p2_essential_epr_status.steps_to_address_epr_gap" value={getSafe('p2_essential_epr_status.steps_to_address_epr_gap')} onChange={handleChange} disabled={disabled} rows={3}></textarea>
                             </>
                        )}
                    </>
                )}
            </div>

            <h4>Leadership Indicators</h4>

            {/* LI Q1: Life Cycle Assessment (LCA) (Image 2, Bottom Q1) */}
            <div className="form-section">
                <h5>1. Has the entity conducted Life Cycle Perspective / Assessments (LCA) for any of its products (for manufacturing industry) or services (for service industry)?</h5>
                <div className="radio-group">
                    <label><input type="radio" name="p2_leadership_lca_details.conducted" value="yes" checked={getSafe('p2_leadership_lca_details.conducted', null) === true} onChange={handleChange} disabled={disabled} /> Yes</label>
                    <label><input type="radio" name="p2_leadership_lca_details.conducted" value="no" checked={getSafe('p2_leadership_lca_details.conducted', null) === false} onChange={handleChange} disabled={disabled} /> No</label>
                </div>
                {getSafe('p2_leadership_lca_details.conducted', null) === true && (
                    <>
                        <p>If yes, provide details in the following format:</p>
                        {(getSafe('p2_leadership_lca_details.assessments', []) || []).map((item, index) => (
                            <div key={index} className="array-item lca-item">
                                <input type="text" placeholder="NIC Code" value={item.nic_code || ''} onChange={e => handleArrayChange('p2_leadership_lca_details.assessments', index, 'nic_code', e.target.value)} disabled={disabled} />
                                <input type="text" placeholder="Name of Product/Service" value={item.product_service_name || ''} onChange={e => handleArrayChange('p2_leadership_lca_details.assessments', index, 'product_service_name', e.target.value)} disabled={disabled} />
                                <input type="number" step="0.01" placeholder="% of total Turnover" value={item.turnover_percentage ?? ''} onChange={e => handleArrayChange('p2_leadership_lca_details.assessments', index, 'turnover_percentage', e.target.value, 'number')} disabled={disabled} />
                                <input type="text" placeholder="Boundary for LCA" value={item.lca_boundary || ''} onChange={e => handleArrayChange('p2_leadership_lca_details.assessments', index, 'lca_boundary', e.target.value)} disabled={disabled} />
                                <label>Conducted by independent external agency?
                                    <select value={item.conducted_by_external_agency === null ? '' : (item.conducted_by_external_agency ? 'yes' : 'no')} onChange={e => handleArrayChange('p2_leadership_lca_details.assessments', index, 'conducted_by_external_agency', e.target.value === 'yes' ? true : (e.target.value === 'no' ? false : null))} disabled={disabled}>
                                        <option value="">Select</option><option value="yes">Yes</option><option value="no">No</option>
                                    </select>
                                </label>
                                <label>Results communicated in public domain?
                                     <select value={item.results_communicated_publicly === null ? '' : (item.results_communicated_publicly ? 'yes' : 'no')} onChange={e => handleArrayChange('p2_leadership_lca_details.assessments', index, 'results_communicated_publicly', e.target.value === 'yes' ? true : (e.target.value === 'no' ? false : null))} disabled={disabled}>
                                        <option value="">Select</option><option value="yes">Yes</option><option value="no">No</option>
                                    </select>
                                </label>
                                {item.results_communicated_publicly && <input type="url" placeholder="Weblink for LCA summary" value={item.lca_summary_weblink || ''} onChange={e => handleArrayChange('p2_leadership_lca_details.assessments', index, 'lca_summary_weblink', e.target.value)} disabled={disabled} />}
                                {!disabled && <button type="button" onClick={() => removeArrayItem('p2_leadership_lca_details.assessments', index)}>Remove Assessment</button>}
                            </div>
                        ))}
                        {!disabled && <button type="button" onClick={() => addArrayItem('p2_leadership_lca_details.assessments', { nic_code: '', product_service_name: '', turnover_percentage: null, lca_boundary: '', conducted_by_external_agency: null, results_communicated_publicly: null, lca_summary_weblink: '' })}>Add LCA Assessment</button>}
                    </>
                )}
            </div>

            {/* LI Q2: Significant social or environmental concerns/risks (Image 3, Q2) */}
            <div className="form-section">
                <h5>2. If there are any significant social or environmental concerns and/or risks arising from production or disposal of your products / services, as identified in the Life Cycle Perspective / Assessments (LCA) or through any other means, briefly describe the same along-with action taken to mitigate the same.</h5>
                {(getSafe('p2_leadership_product_risks', []) || []).map((item, index) => (
                    <div key={index} className="array-item product-risk-item">
                        <input type="text" placeholder="Name of Product/Service" value={item.product_service_name || ''} onChange={e => handleArrayChange('p2_leadership_product_risks', index, 'product_service_name', e.target.value)} disabled={disabled} />
                        <textarea placeholder="Description of the risk/concern" value={item.risk_description || ''} onChange={e => handleArrayChange('p2_leadership_product_risks', index, 'risk_description', e.target.value)} disabled={disabled} rows={2}></textarea>
                        <textarea placeholder="Action Taken" value={item.action_taken || ''} onChange={e => handleArrayChange('p2_leadership_product_risks', index, 'action_taken', e.target.value)} disabled={disabled} rows={2}></textarea>
                        {!disabled && <button type="button" onClick={() => removeArrayItem('p2_leadership_product_risks', index)}>Remove Risk Entry</button>}
                    </div>
                ))}
                {!disabled && <button type="button" onClick={() => addArrayItem('p2_leadership_product_risks', { product_service_name: '', risk_description: '', action_taken: '' })}>Add Product Risk Entry</button>}
            </div>
            
            {/* LI Q3: Percentage of recycled or reused input material (by value) (Image 3, Q3) */}
            <div className="form-section">
                <h5>3. Percentage of recycled or reused input material to total material (by value) used in production (for manufacturing industry) or providing services (for service industry).</h5>
                <table>
                    <thead>
                        <tr>
                            <th>Indicate input material</th>
                            <th>FY Current Financial Year (% by value)</th>
                            {!disabled && <th>Action</th>}
                        </tr>
                    </thead>
                    <tbody>
                        {(getSafe('p2_leadership_recycled_input_value_percentage', []) || []).map((item, index) => (
                            <tr key={index}>
                                <td><input type="text" value={item.input_material_category || ''} onChange={e => handleArrayChange('p2_leadership_recycled_input_value_percentage', index, 'input_material_category', e.target.value)} disabled={disabled} /></td>
                                <td><input type="number" step="0.01" value={item.percentage_by_value_current_fy ?? ''} onChange={e => handleArrayChange('p2_leadership_recycled_input_value_percentage', index, 'percentage_by_value_current_fy', e.target.value, 'number')} disabled={disabled} /></td>
                                {!disabled && <td><button type="button" onClick={() => removeArrayItem('p2_leadership_recycled_input_value_percentage', index)}>Remove</button></td>}
                            </tr>
                        ))}
                    </tbody>
                </table>
                {!disabled && <button type="button" onClick={() => addArrayItem('p2_leadership_recycled_input_value_percentage', { input_material_category: '', percentage_by_value_current_fy: null })}>Add Input Material</button>}
            </div>

            {/* LI Q4: Products and packaging reclaimed at end of life (metric tonnes) (Image 3, Q4) */}
            <div className="form-section">
                <h5>4. Of the products and packaging reclaimed at end of life of products, amount (in metric tonnes) reused, recycled, and safely disposed, as per the following format:</h5>
                {['plastics', 'e_waste', 'hazardous_waste', 'other_waste'].map(category => (
                    <div key={category} className="waste-category-section">
                        <h6>{category.replace('_', ' ').replace(/\b\w/g, l => l.toUpperCase())} {category === 'plastics' ? '(including packaging)' : ''}</h6>
                        <table>
                            <thead>
                                <tr>
                                    <th>FY Current Financial Year</th>
                                    <th>Re-Used (MT)</th>
                                    <th>Recycled (MT)</th>
                                    <th>Safely Disposed (MT)</th>
                                </tr>
                            </thead>
                            <tbody>
                                <tr>
                                    <td>Current Financial Year</td>
                                    <td><input type="number" name={`p2_leadership_reclaimed_waste_quantities.${category}.current_fy_reused_mt`} value={getSafeTableValue(`p2_leadership_reclaimed_waste_quantities.${category}.current_fy_reused_mt`) ?? ''} onChange={handleChange} disabled={disabled} /></td>
                                    <td><input type="number" name={`p2_leadership_reclaimed_waste_quantities.${category}.current_fy_recycled_mt`} value={getSafeTableValue(`p2_leadership_reclaimed_waste_quantities.${category}.current_fy_recycled_mt`) ?? ''} onChange={handleChange} disabled={disabled} /></td>
                                    <td><input type="number" name={`p2_leadership_reclaimed_waste_quantities.${category}.current_fy_safely_disposed_mt`} value={getSafeTableValue(`p2_leadership_reclaimed_waste_quantities.${category}.current_fy_safely_disposed_mt`) ?? ''} onChange={handleChange} disabled={disabled} /></td>
                                </tr>
                            </tbody>
                        </table>
                    </div>
                ))}
            </div>
            
            {/* LI Q5: Reclaimed products and their packaging materials (as percentage of products sold) (Image 3, Q5) */}
            <div className="form-section">
                <h5>5. Reclaimed products and their packaging materials (as percentage of products sold) for each product category.</h5>
                 <table>
                    <thead>
                        <tr>
                            <th>Indicate product category</th>
                            <th>Reclaimed products and their packaging materials as % of total products sold in respective category</th>
                            {!disabled && <th>Action</th>}
                        </tr>
                    </thead>
                    <tbody>
                        {(getSafe('p2_leadership_reclaimed_products_as_percentage_sold', []) || []).map((item, index) => (
                            <tr key={index}>
                                <td><input type="text" value={item.product_category || ''} onChange={e => handleArrayChange('p2_leadership_reclaimed_products_as_percentage_sold', index, 'product_category', e.target.value)} disabled={disabled} /></td>
                                <td><input type="number" step="0.01" value={item.reclaimed_as_percentage_of_sold ?? ''} onChange={e => handleArrayChange('p2_leadership_reclaimed_products_as_percentage_sold', index, 'reclaimed_as_percentage_of_sold', e.target.value, 'number')} disabled={disabled} /></td>
                                {!disabled && <td><button type="button" onClick={() => removeArrayItem('p2_leadership_reclaimed_products_as_percentage_sold', index)}>Remove</button></td>}
                            </tr>
                        ))}
                    </tbody>
                </table>
                {!disabled && <button type="button" onClick={() => addArrayItem('p2_leadership_reclaimed_products_as_percentage_sold', { product_category: '', reclaimed_as_percentage_of_sold: null })}>Add Product Category</button>}
            </div>

            <hr />
            {!isSubmitted && (
                <button type="submit" className="form-button" disabled={isLoadingSave}>
                    {isLoadingSave ? 'Saving...' : 'Save Principle 2'}
                </button>
            )}
            {isSubmitted && <p>This section is part of a submitted report and cannot be edited.</p>}
        </form>
    );
}

export default SectionCPrinciple2Form;