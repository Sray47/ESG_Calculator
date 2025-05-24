import React, { useState, useEffect } from 'react';
import { useOutletContext } from 'react-router-dom';
import { deepMerge, setNestedValue } from "../../utils/objectUtils";

const initialPrinciple2Data = {
    // Essential Indicators
    p2_essential_rd_capex: {
        current_fy: {
            rd_investment_tech: null,
            capex_investment_tech: null,
            total_rd_investment: null,
            total_capex_investment: null,
        },
        previous_fy: {
            rd_investment_tech: null,
            capex_investment_tech: null,
            total_rd_investment: null,
            total_capex_investment: null,
        },
        improvements_details: '',
    },
    p2_essential_sustainable_sourcing: {
        has_procedures: null, // Yes/No
        percentage_inputs_sourced_sustainably: null,
        practices_details: '',
        value_chain_partner_processes: '',
    },
    p2_essential_reclaim_processes: {
        plastics: '',
        e_waste: '',
        hazardous_waste: '',
        other_waste: '',
    },
    p2_essential_epr_applicable: {
        is_applicable: null, // Yes/No
        epr_plan_details: '',
    },
    // Leadership Indicators
    p2_leadership_lca_conducted: {
        conducted: null, // Yes/No
        lca_details: [],
    },
    p2_leadership_significant_concerns: {
        sourcing_raw_materials_concerns: '',
        sourcing_raw_materials_mitigation: '',
        transport_raw_materials_concerns: '',
        transport_raw_materials_mitigation: '',
        production_manufacturing_concerns: '',
        production_manufacturing_mitigation: '',
        consumer_use_concerns: '',
        consumer_use_mitigation: '',
        consumer_disposal_concerns: '',
        consumer_disposal_mitigation: '',
    },
    p2_leadership_recycled_inputs: {
        current_fy: [],
        previous_fy: [],
    },
    p2_leadership_reduction_strategies: {
        virgin_raw_materials: '',
        toxic_hazardous_chemicals: '',
    },
    p2_leadership_positive_impact_products: [],
};

function SectionCPrinciple2Form() {
    const { reportData, handleSaveProgress, isSubmitted, isLoadingSave, setError: setWizardError } = useOutletContext();
    const [formData, setFormData] = useState(initialPrinciple2Data);
    const [localError, setLocalError] = useState('');
    const [localSuccess, setLocalSuccess] = useState('');

    useEffect(() => {
        if (reportData && reportData.section_c_data && reportData.section_c_data.principle_2) {
            const mergedData = deepMerge(initialPrinciple2Data, reportData.section_c_data.principle_2);
            setFormData(mergedData);
        } else if (reportData) {
            setFormData(deepMerge(initialPrinciple2Data, {})); 
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

    if (!reportData) return <p>Loading Principle 2 data...</p>;
    const disabled = isSubmitted || isLoadingSave;
    
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

    return (
        <form onSubmit={handleSubmit} className="profile-form">
            <h3>Principle 2: Sustainable and Safe Goods & Services</h3>
            <p>Businesses should provide goods and services in a manner that is sustainable and safe.</p>

            {localError && <p className="error-message" style={{ color: 'red' }}>{localError}</p>}
            {localSuccess && <p className="success-message" style={{ color: 'green' }}>{localSuccess}</p>}

            <h4>Essential Indicators</h4>

            {/* EI Q1: R&D and Capex Investments */}
            <div className="form-section">
                <h5>1. Percentage of R&D and capital expenditure (capex) investments in specific technologies to improve environmental/social impacts:</h5>
                <p>(Current FY | Previous FY)</p>
                <table>
                    <thead>
                        <tr>
                            <th>Indicator</th>
                            <th>Current FY (Amount in INR)</th>
                            <th>Previous FY (Amount in INR)</th>
                        </tr>
                    </thead>
                    <tbody>
                        <tr>
                            <td>R&D Investment in specific technologies</td>
                            <td><input type="number" name="p2_essential_rd_capex.current_fy.rd_investment_tech" value={getSafe('p2_essential_rd_capex.current_fy.rd_investment_tech', null) ?? ''} onChange={handleChange} disabled={disabled} /></td>
                            <td><input type="number" name="p2_essential_rd_capex.previous_fy.rd_investment_tech" value={getSafe('p2_essential_rd_capex.previous_fy.rd_investment_tech', null) ?? ''} onChange={handleChange} disabled={disabled} /></td>
                        </tr>
                        <tr>
                            <td>Capex Investment in specific technologies</td>
                            <td><input type="number" name="p2_essential_rd_capex.current_fy.capex_investment_tech" value={getSafe('p2_essential_rd_capex.current_fy.capex_investment_tech', null) ?? ''} onChange={handleChange} disabled={disabled} /></td>
                            <td><input type="number" name="p2_essential_rd_capex.previous_fy.capex_investment_tech" value={getSafe('p2_essential_rd_capex.previous_fy.capex_investment_tech', null) ?? ''} onChange={handleChange} disabled={disabled} /></td>
                        </tr>
                         <tr>
                            <td>Total R&D Investment</td>
                            <td><input type="number" name="p2_essential_rd_capex.current_fy.total_rd_investment" value={getSafe('p2_essential_rd_capex.current_fy.total_rd_investment', null) ?? ''} onChange={handleChange} disabled={disabled} /></td>
                            <td><input type="number" name="p2_essential_rd_capex.previous_fy.total_rd_investment" value={getSafe('p2_essential_rd_capex.previous_fy.total_rd_investment', null) ?? ''} onChange={handleChange} disabled={disabled} /></td>
                        </tr>
                        <tr>
                            <td>Total Capex Investment</td>
                            <td><input type="number" name="p2_essential_rd_capex.current_fy.total_capex_investment" value={getSafe('p2_essential_rd_capex.current_fy.total_capex_investment', null) ?? ''} onChange={handleChange} disabled={disabled} /></td>
                            <td><input type="number" name="p2_essential_rd_capex.previous_fy.total_capex_investment" value={getSafe('p2_essential_rd_capex.previous_fy.total_capex_investment', null) ?? ''} onChange={handleChange} disabled={disabled} /></td>
                        </tr>
                    </tbody>
                </table>
                <p>Total R&D for env/social as % of total R&D: { (getSafe('p2_essential_rd_capex.current_fy.total_rd_investment', 0) && parseFloat(getSafe('p2_essential_rd_capex.current_fy.total_rd_investment', 0)) !== 0 && getSafe('p2_essential_rd_capex.current_fy.rd_investment_tech', null) !== null) ? ((parseFloat(getSafe('p2_essential_rd_capex.current_fy.rd_investment_tech', 0)) / parseFloat(getSafe('p2_essential_rd_capex.current_fy.total_rd_investment', 1))) * 100).toFixed(2) + '%' : 'N/A'}</p>
                <p>Total Capex for env/social as % of total Capex: { (getSafe('p2_essential_rd_capex.current_fy.total_capex_investment', 0) && parseFloat(getSafe('p2_essential_rd_capex.current_fy.total_capex_investment', 0)) !== 0 && getSafe('p2_essential_rd_capex.current_fy.capex_investment_tech', null) !== null) ? ((parseFloat(getSafe('p2_essential_rd_capex.current_fy.capex_investment_tech', 0)) / parseFloat(getSafe('p2_essential_rd_capex.current_fy.total_capex_investment', 1))) * 100).toFixed(2) + '%' : 'N/A'}</p>
                <label>Details of improvements in environmental and social impacts:</label>
                <textarea name="p2_essential_rd_capex.improvements_details" value={getSafe('p2_essential_rd_capex.improvements_details')} onChange={handleChange} disabled={disabled} rows={3}></textarea>
            </div>

            {/* EI Q2: Sustainable Sourcing */}
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
                        <input type="number" name="p2_essential_sustainable_sourcing.percentage_inputs_sourced_sustainably" value={getSafe('p2_essential_sustainable_sourcing.percentage_inputs_sourced_sustainably', null) ?? ''} onChange={handleChange} disabled={disabled} /> %
                        <label>c. Provide details of the practices adopted for sustainable sourcing:</label>
                        <textarea name="p2_essential_sustainable_sourcing.practices_details" value={getSafe('p2_essential_sustainable_sourcing.practices_details')} onChange={handleChange} disabled={disabled} rows={3}></textarea>
                        <label>d. Provide the processes followed for ensuring that these are followed by the value chain partners:</label>
                        <textarea name="p2_essential_sustainable_sourcing.value_chain_partner_processes" value={getSafe('p2_essential_sustainable_sourcing.value_chain_partner_processes')} onChange={handleChange} disabled={disabled} rows={3}></textarea>
                    </>
                )}
            </div>

            {/* EI Q3: Reclaim Processes */}
            <div className="form-section">
                <h5>3. Describe the processes in place to safely reclaim your products for reusing, recycling and disposing at the end of life:</h5>
                <label>a. Plastics (including packaging):</label>
                <textarea name="p2_essential_reclaim_processes.plastics" value={getSafe('p2_essential_reclaim_processes.plastics')} onChange={handleChange} disabled={disabled} rows={2}></textarea>
                <label>b. E-waste:</label>
                <textarea name="p2_essential_reclaim_processes.e_waste" value={getSafe('p2_essential_reclaim_processes.e_waste')} onChange={handleChange} disabled={disabled} rows={2}></textarea>
                <label>c. Hazardous waste:</label>
                <textarea name="p2_essential_reclaim_processes.hazardous_waste" value={getSafe('p2_essential_reclaim_processes.hazardous_waste')} onChange={handleChange} disabled={disabled} rows={2}></textarea>
                <label>d. Other waste:</label>
                <textarea name="p2_essential_reclaim_processes.other_waste" value={getSafe('p2_essential_reclaim_processes.other_waste')} onChange={handleChange} disabled={disabled} rows={2}></textarea>
            </div>

            {/* EI Q4: Extended Producer Responsibility (EPR) */}
            <div className="form-section">
                <h5>4. Extended Producer Responsibility (EPR):</h5>
                <label>Is EPR applicable to the entity’s activities?</label>
                <div className="radio-group">
                    <label><input type="radio" name="p2_essential_epr_applicable.is_applicable" value="yes" checked={getSafe('p2_essential_epr_applicable.is_applicable', null) === true} onChange={handleChange} disabled={disabled} /> Yes</label>
                    <label><input type="radio" name="p2_essential_epr_applicable.is_applicable" value="no" checked={getSafe('p2_essential_epr_applicable.is_applicable', null) === false} onChange={handleChange} disabled={disabled} /> No</label>
                </div>
                {getSafe('p2_essential_epr_applicable.is_applicable', null) === true && (
                    <>
                        <label>If yes, provide details of EPR plan:</label>
                        <textarea name="p2_essential_epr_applicable.epr_plan_details" value={getSafe('p2_essential_epr_applicable.epr_plan_details')} onChange={handleChange} disabled={disabled} rows={3}></textarea>
                    </>
                )}
            </div>

            <h4>Leadership Indicators</h4>

            {/* LI Q1: Life Cycle Assessment (LCA) */}
            <div className="form-section">
                <h5>1. Has the entity conducted Life Cycle Assessment (LCA) for any of its products/services?</h5>
                <div className="radio-group">
                    <label><input type="radio" name="p2_leadership_lca_conducted.conducted" value="yes" checked={getSafe('p2_leadership_lca_conducted.conducted', null) === true} onChange={handleChange} disabled={disabled} /> Yes</label>
                    <label><input type="radio" name="p2_leadership_lca_conducted.conducted" value="no" checked={getSafe('p2_leadership_lca_conducted.conducted', null) === false} onChange={handleChange} disabled={disabled} /> No</label>
                </div>
                {getSafe('p2_leadership_lca_conducted.conducted', null) === true && (
                    <>
                        <p>Details of LCA conducted:</p>
                        {(getSafe('p2_leadership_lca_conducted.lca_details', []) || []).map((item, index) => (
                            <div key={index} className="array-item">
                                <input type="text" placeholder="Product/Service Name" value={item.product_service_name || ''} onChange={e => handleArrayChange('p2_leadership_lca_conducted.lca_details', index, 'product_service_name', e.target.value)} disabled={disabled} />
                                <input type="number" placeholder="% of total turnover" value={item.turnover_percentage ?? ''} onChange={e => handleArrayChange('p2_leadership_lca_conducted.lca_details', index, 'turnover_percentage', e.target.value, 'number')} disabled={disabled} />
                                <input type="text" placeholder="Boundary for LCA" value={item.lca_boundary || ''} onChange={e => handleArrayChange('p2_leadership_lca_conducted.lca_details', index, 'lca_boundary', e.target.value)} disabled={disabled} />
                                <input type="url" placeholder="Weblink for LCA summary" value={item.lca_summary_weblink || ''} onChange={e => handleArrayChange('p2_leadership_lca_conducted.lca_details', index, 'lca_summary_weblink', e.target.value)} disabled={disabled} />
                                {!disabled && <button type="button" onClick={() => removeArrayItem('p2_leadership_lca_conducted.lca_details', index)}>Remove</button>}
                            </div>
                        ))}
                        {!disabled && <button type="button" onClick={() => addArrayItem('p2_leadership_lca_conducted.lca_details', { product_service_name: '', turnover_percentage: null, lca_boundary: '', lca_summary_weblink: '' })}>Add LCA Detail</button>}
                    </>
                )}
            </div>

            {/* LI Q2: Significant Social or Environmental Concerns */}
            <div className="form-section">
                <h5>2. Significant social or environmental concerns and actions taken:</h5>
                <label>a. Sourcing of raw materials - Concerns:</label>
                <textarea name="p2_leadership_significant_concerns.sourcing_raw_materials_concerns" value={getSafe('p2_leadership_significant_concerns.sourcing_raw_materials_concerns')} onChange={handleChange} disabled={disabled} rows={2}></textarea>
                <label>Sourcing of raw materials - Mitigation actions:</label>
                <textarea name="p2_leadership_significant_concerns.sourcing_raw_materials_mitigation" value={getSafe('p2_leadership_significant_concerns.sourcing_raw_materials_mitigation')} onChange={handleChange} disabled={disabled} rows={2}></textarea>
                
                <label>b. Transport of raw materials - Concerns:</label>
                <textarea name="p2_leadership_significant_concerns.transport_raw_materials_concerns" value={getSafe('p2_leadership_significant_concerns.transport_raw_materials_concerns')} onChange={handleChange} disabled={disabled} rows={2}></textarea>
                <label>Transport of raw materials - Mitigation actions:</label>
                <textarea name="p2_leadership_significant_concerns.transport_raw_materials_mitigation" value={getSafe('p2_leadership_significant_concerns.transport_raw_materials_mitigation')} onChange={handleChange} disabled={disabled} rows={2}></textarea>

                <label>c. Production & manufacturing processes - Concerns:</label>
                <textarea name="p2_leadership_significant_concerns.production_manufacturing_concerns" value={getSafe('p2_leadership_significant_concerns.production_manufacturing_concerns')} onChange={handleChange} disabled={disabled} rows={2}></textarea>
                <label>Production & manufacturing processes - Mitigation actions:</label>
                <textarea name="p2_leadership_significant_concerns.production_manufacturing_mitigation" value={getSafe('p2_leadership_significant_concerns.production_manufacturing_mitigation')} onChange={handleChange} disabled={disabled} rows={2}></textarea>

                <label>d. Use of products by consumers - Concerns:</label>
                <textarea name="p2_leadership_significant_concerns.consumer_use_concerns" value={getSafe('p2_leadership_significant_concerns.consumer_use_concerns')} onChange={handleChange} disabled={disabled} rows={2}></textarea>
                <label>Use of products by consumers - Mitigation actions:</label>
                <textarea name="p2_leadership_significant_concerns.consumer_use_mitigation" value={getSafe('p2_leadership_significant_concerns.consumer_use_mitigation')} onChange={handleChange} disabled={disabled} rows={2}></textarea>

                <label>e. Disposal/recycle/reuse by consumers - Concerns:</label>
                <textarea name="p2_leadership_significant_concerns.consumer_disposal_concerns" value={getSafe('p2_leadership_significant_concerns.consumer_disposal_concerns')} onChange={handleChange} disabled={disabled} rows={2}></textarea>
                <label>Disposal/recycle/reuse by consumers - Mitigation actions:</label>
                <textarea name="p2_leadership_significant_concerns.consumer_disposal_mitigation" value={getSafe('p2_leadership_significant_concerns.consumer_disposal_mitigation')} onChange={handleChange} disabled={disabled} rows={2}></textarea>
            </div>

            {/* LI Q3: Percentage of inputs from recycled / reused sources */}
            <div className="form-section">
                <h5>3. Percentage of inputs from recycled / reused sources:</h5>
                <h6>Current FY:</h6>
                {(getSafe('p2_leadership_recycled_inputs.current_fy', []) || []).map((item, index) => (
                    <div key={index} className="array-item">
                        <input type="text" placeholder="Category of Input" value={item.category || ''} onChange={e => handleArrayChange('p2_leadership_recycled_inputs.current_fy', index, 'category', e.target.value)} disabled={disabled} />
                        <input type="number" placeholder="Absolute value (metric tonnes)" value={item.absolute_value_mt ?? ''} onChange={e => handleArrayChange('p2_leadership_recycled_inputs.current_fy', index, 'absolute_value_mt', e.target.value, 'number')} disabled={disabled} />
                        <input type="number" placeholder="% of total inputs" value={item.percentage_of_total ?? ''} onChange={e => handleArrayChange('p2_leadership_recycled_inputs.current_fy', index, 'percentage_of_total', e.target.value, 'number')} disabled={disabled} />
                        {!disabled && <button type="button" onClick={() => removeArrayItem('p2_leadership_recycled_inputs.current_fy', index)}>Remove</button>}
                    </div>
                ))}
                {!disabled && <button type="button" onClick={() => addArrayItem('p2_leadership_recycled_inputs.current_fy', { category: '', absolute_value_mt: null, percentage_of_total: null })}>Add Current FY Input</button>}
                
                <h6>Previous FY:</h6>
                 {(getSafe('p2_leadership_recycled_inputs.previous_fy', []) || []).map((item, index) => (
                    <div key={index} className="array-item">
                        <input type="text" placeholder="Category of Input" value={item.category || ''} onChange={e => handleArrayChange('p2_leadership_recycled_inputs.previous_fy', index, 'category', e.target.value)} disabled={disabled} />
                        <input type="number" placeholder="Absolute value (metric tonnes)" value={item.absolute_value_mt ?? ''} onChange={e => handleArrayChange('p2_leadership_recycled_inputs.previous_fy', index, 'absolute_value_mt', e.target.value, 'number')} disabled={disabled} />
                        <input type="number" placeholder="% of total inputs" value={item.percentage_of_total ?? ''} onChange={e => handleArrayChange('p2_leadership_recycled_inputs.previous_fy', index, 'percentage_of_total', e.target.value, 'number')} disabled={disabled} />
                        {!disabled && <button type="button" onClick={() => removeArrayItem('p2_leadership_recycled_inputs.previous_fy', index)}>Remove</button>}
                    </div>
                ))}
                {!disabled && <button type="button" onClick={() => addArrayItem('p2_leadership_recycled_inputs.previous_fy', { category: '', absolute_value_mt: null, percentage_of_total: null })}>Add Previous FY Input</button>}
            </div>

            {/* LI Q4: Strategies to reduce usage of virgin raw materials, toxic and hazardous chemicals */}
            <div className="form-section">
                <h5>4. Provide details of strategies / initiatives undertaken to reduce usage of:</h5>
                <label>a. Virgin raw materials:</label>
                <textarea name="p2_leadership_reduction_strategies.virgin_raw_materials" value={getSafe('p2_leadership_reduction_strategies.virgin_raw_materials')} onChange={handleChange} disabled={disabled} rows={3}></textarea>
                <label>b. Toxic and hazardous chemicals:</label>
                <textarea name="p2_leadership_reduction_strategies.toxic_hazardous_chemicals" value={getSafe('p2_leadership_reduction_strategies.toxic_hazardous_chemicals')} onChange={handleChange} disabled={disabled} rows={3}></textarea>
            </div>

            {/* LI Q5: Products/services with positive social or environmental impact */}
            <div className="form-section">
                <h5>5. Provide details of any products / services of the entity that have positive social or environmental impact:</h5>
                {(getSafe('p2_leadership_positive_impact_products', []) || []).map((item, index) => (
                    <div key={index} className="array-item">
                        <input type="text" placeholder="Product/Service Name" value={item.product_service_name || ''} onChange={e => handleArrayChange('p2_leadership_positive_impact_products', index, 'product_service_name', e.target.value)} disabled={disabled} />
                        <textarea placeholder="Positive Impact Details" value={item.positive_impact_details || ''} onChange={e => handleArrayChange('p2_leadership_positive_impact_products', index, 'positive_impact_details', e.target.value)} disabled={disabled} rows={2}></textarea>
                        {!disabled && <button type="button" onClick={() => removeArrayItem('p2_leadership_positive_impact_products', index)}>Remove</button>}
                    </div>
                ))}
                {!disabled && <button type="button" onClick={() => addArrayItem('p2_leadership_positive_impact_products', { product_service_name: '', positive_impact_details: '' })}>Add Product/Service</button>}
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