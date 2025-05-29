import React, { useState, useEffect } from 'react';
import { useOutletContext } from 'react-router-dom';
import { deepMerge } from '../../utils/objectUtils'; // Assuming objectUtils.js has deepMerge

// Essential Indicators for Principle 6
const initialP6EssentialIndicators = {
    env_policy_link_or_details: '', // Renamed from environmental_policy
    env_impact_assessments_details: '',

    // Energy
    total_energy_consumed_gj: null, // Renamed from energy_consumption
    total_renewable_energy_consumed_gj: null, // Renamed from renewable_energy_consumption
    energy_intensity_details: '', // e.g., per rupee of turnover, per unit of production

    // Water
    total_water_withdrawal_kl: null, // Renamed from water_withdrawal, changed unit
    total_water_consumption_kl: null,
    water_intensity_details: '', // e.g., per rupee of turnover, per unit of production
    water_discharge_by_destination_and_treatment: [
        // { destination: '', treatment_level: '', quantity_kl: null, standards_met: '' }
    ],
    water_stress_areas_operations_details: '',

    // Air Emissions
    ghg_emissions_scope1_tonnes: null, // Renamed from emissions_co2 (assuming it was Scope 1)
    ghg_emissions_scope2_tonnes: null,
    ghg_emissions_scope3_tonnes: null, // If available
    ghg_intensity_details: '', // e.g., per rupee of turnover, per unit of production
    nox_emissions_tonnes: null,
    sox_emissions_tonnes: null,
    pm_emissions_tonnes: null,
    other_air_emissions_details: '', // Renamed from emissions_other

    // Waste Management
    total_waste_generated_metric_tonnes: null, // Renamed from waste_generated
    total_hazardous_waste_generated_metric_tonnes: null,
    total_non_hazardous_waste_generated_metric_tonnes: null,
    waste_management_practices: [
        // { waste_type: '', disposal_method: '', quantity_mt: null, is_recycled_or_reused: false }
    ],
    plastic_waste_details: '', // Details of plastic waste management
    ewaste_details: '', // Details of e-waste management

    // Biodiversity
    operations_in_or_near_biodiversity_hotspots: '', // Renamed from biodiversity_impacts

    // Environmental Incidents
    significant_environmental_incidents_details: '',
    // total_noise_pollution_db: null, // User added, keeping for now but might be too specific for BRSR essential
};
// Leadership Indicators for Principle 6
const initialP6LeadershipIndicators = {
    // Life Cycle Assessments (LCA)
    lca_conducted_details: '',
    // Water Management in Value Chain
    value_chain_water_management_initiatives: '',
    // GHG Emissions Reduction Targets
    ghg_reduction_targets_and_progress: '', // Renamed from environmental_targets
    // Climate Adaptation and Mitigation Strategies
    climate_adaptation_mitigation_strategies: '',
    // Biodiversity Conservation Programs
    biodiversity_conservation_programs_details: '',
    // Business Continuity and Disaster Management Plan for Environment
    env_business_continuity_disaster_plan: '',
    // Supply Chain Environmental Performance
    supply_chain_env_performance_details: '', // Combines policy, training, incidents
    // Environmental initiatives beyond compliance (already exists, keeping)
    environmental_initiatives: '',
};

const initialSectionCPrinciple6Data = {
    essential_indicators: initialP6EssentialIndicators,
    leadership_indicators: initialP6LeadershipIndicators,
};

function SectionCPrinciple6Form() {
    const { reportData, handleSaveProgress, isSubmitted, isLoadingSave, setError: setWizardError } = useOutletContext();
    const [formData, setFormData] = useState(initialSectionCPrinciple6Data);
    const [localError, setLocalError] = useState('');
    const [localSuccess, setLocalSuccess] = useState('');

    useEffect(() => {
        if (reportData?.sc_p6_environment_protection) {
            const sourceData = reportData.sc_p6_environment_protection;
            let mergedEssential = { ...initialP6EssentialIndicators, ...(sourceData.essential_indicators || {}) };
            let mergedLeadership = { ...initialP6LeadershipIndicators, ...(sourceData.leadership_indicators || {}) };

            // --- Start Manual Migration from old structure (if necessary) ---
            // This is an example. Adjust based on how old data was structured vs new.
            if (sourceData.essential_indicators) {
                const oldEI = sourceData.essential_indicators;
                if (oldEI.environmental_policy) mergedEssential.env_policy_link_or_details = oldEI.environmental_policy;
                if (oldEI.energy_consumption) mergedEssential.total_energy_consumed_gj = oldEI.energy_consumption;
                if (oldEI.renewable_energy_consumption) mergedEssential.total_renewable_energy_consumed_gj = oldEI.renewable_energy_consumption;
                if (oldEI.water_withdrawal) mergedEssential.total_water_withdrawal_kl = oldEI.water_withdrawal;
                // Assuming emissions_co2 was Scope 1
                if (oldEI.emissions_co2) mergedEssential.ghg_emissions_scope1_tonnes = oldEI.emissions_co2;
                if (oldEI.emissions_other) mergedEssential.other_air_emissions_details = oldEI.emissions_other;
                if (oldEI.waste_generated) mergedEssential.total_waste_generated_metric_tonnes = oldEI.waste_generated;
                if (oldEI.biodiversity_impacts) mergedEssential.operations_in_or_near_biodiversity_hotspots = oldEI.biodiversity_impacts;
                // Clean up old fields if they are not in the new structure to avoid them being saved
                const oldKeys = ['environmental_policy', 'energy_consumption', 'renewable_energy_consumption', 'water_withdrawal', 'water_recycled', 'emissions_co2', 'emissions_other', 'waste_generated', 'waste_recycled', 'biodiversity_impacts', 'total_noise_pollution_db'];
                oldKeys.forEach(key => delete mergedEssential[key]);
            }
            if (sourceData.leadership_indicators) {
                const oldLI = sourceData.leadership_indicators;
                if (oldLI.environmental_targets) mergedLeadership.ghg_reduction_targets_and_progress = oldLI.environmental_targets;
                if (oldLI.supply_chain_environmental_policy || oldLI.supply_chain_environmental_training || oldLI.supply_chain_environmental_incidents) {
                    mergedLeadership.supply_chain_env_performance_details = 
                        `Policy: ${oldLI.supply_chain_environmental_policy || 'N/A'}\nTraining: ${oldLI.supply_chain_environmental_training || 'N/A'}\nIncidents: ${oldLI.supply_chain_environmental_incidents || 'N/A'}`;
                }
                 const oldLKeys = ['environmental_targets', 'supply_chain_environmental_policy', 'supply_chain_environmental_training', 'supply_chain_environmental_incidents'];
                oldLKeys.forEach(key => delete mergedLeadership[key]);
            }
            // --- End Manual Migration ---

            setFormData(prev => deepMerge(initialSectionCPrinciple6Data, { 
                essential_indicators: mergedEssential, 
                leadership_indicators: mergedLeadership 
            }));
        } else {
            setFormData(initialSectionCPrinciple6Data);
        }
    }, [reportData]);

    const handleArrayChange = (indicatorType, arrayName, index, field, value) => {
        setFormData(prev => {
            const newArray = [...(prev[indicatorType][arrayName] || [])];
            newArray[index] = { ...newArray[index], [field]: value };
            return {
                ...prev,
                [indicatorType]: {
                    ...prev[indicatorType],
                    [arrayName]: newArray,
                },
            };
        });
    };

    const addArrayItem = (indicatorType, arrayName, itemTemplate) => {
        setFormData(prev => ({
            ...prev,
            [indicatorType]: {
                ...prev[indicatorType],
                [arrayName]: [...(prev[indicatorType][arrayName] || []), { ...itemTemplate }],
            },
        }));
    };

    const removeArrayItem = (indicatorType, arrayName, index) => {
        setFormData(prev => ({
            ...prev,
            [indicatorType]: {
                ...prev[indicatorType],
                [arrayName]: prev[indicatorType][arrayName].filter((_, i) => i !== index),
            },
        }));
    };

    // Helper to check if a value is an object (and not null or an array)
    const isObject = (value) => value && typeof value === 'object' && !Array.isArray(value);

    const handleChange = (path, value, type, checked) => {
        setFormData(prevData => {
            const keys = path.split('.');
            let current = { ...prevData };
            let objRef = current;
            for (let i = 0; i < keys.length - 1; i++) {
                // Ensure nested objects exist, create if not
                objRef[keys[i]] = isObject(objRef[keys[i]]) ? { ...objRef[keys[i]] } : {};
                objRef = objRef[keys[i]];
            }
            // Parse numbers or booleans if type is specific
            if (type === 'number') {
                objRef[keys[keys.length - 1]] = parseFloat(value) || null; // Use parseFloat for numbers, handle empty string as null
            } else if (type === 'checkbox') {
                objRef[keys[keys.length - 1]] = checked;
            } else {
                objRef[keys[keys.length - 1]] = value;
            }
            return current;
        });
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setLocalError('');
        setLocalSuccess('');
        setWizardError('');

        const payload = {
            // The key here must match the JSONB column name in your database table
            sc_p6_environment_protection: formData,
        };

        const success = await handleSaveProgress(payload);
        if (success) {
            setLocalSuccess('Section C, Principle 6 saved successfully!');
        } else {
            setLocalError('Failed to save Section C, Principle 6. Check wizard errors or console.');
        }
    };

    if (!reportData) return <p>Loading Section C, Principle 6 data...</p>;
    const disabled = isSubmitted || isLoadingSave;

    return (
        <form onSubmit={handleSubmit} className="profile-form section-c-form">
            <h3>Section C: Principle-wise Performance</h3>
            <h4>Principle 6: Businesses should respect and make efforts to protect and restore the environment.</h4>
            {localError && <p className="error-message" style={{color: 'red'}}>{localError}</p>}
            {localSuccess && <p className="success-message" style={{color: 'green'}}>{localSuccess}</p>}

            <h5>Essential Indicators</h5>
            <div className="form-group">
                <label>1. Details of environmental policy, web link if available.</label>
                <textarea value={formData.essential_indicators.env_policy_link_or_details || ''} onChange={e => handleChange('essential_indicators.env_policy_link_or_details', e.target.value)} disabled={disabled} rows={3} />
            </div>
            <div className="form-group">
                <label>2. Details of Environmental Impact Assessments (EIAs) conducted.</label>
                <textarea value={formData.essential_indicators.env_impact_assessments_details || ''} onChange={e => handleChange('essential_indicators.env_impact_assessments_details', e.target.value)} disabled={disabled} rows={3} />
            </div>

            <h6>Energy</h6>
            <div className="form-group">
                <label>3. Total energy consumed (GJ) during the financial year.</label>
                <input type="number" value={formData.essential_indicators.total_energy_consumed_gj ?? ''} onChange={e => handleChange('essential_indicators.total_energy_consumed_gj', e.target.value, 'number')} disabled={disabled} />
            </div>
            <div className="form-group">
                <label>4. Total renewable energy consumed (GJ) and as a percentage of total energy.</label>
                <input type="number" value={formData.essential_indicators.total_renewable_energy_consumed_gj ?? ''} onChange={e => handleChange('essential_indicators.total_renewable_energy_consumed_gj', e.target.value, 'number')} disabled={disabled} />
            </div>
            <div className="form-group">
                <label>5. Energy intensity (e.g., per rupee of turnover, per unit of production). Provide details.</label>
                <textarea value={formData.essential_indicators.energy_intensity_details || ''} onChange={e => handleChange('essential_indicators.energy_intensity_details', e.target.value)} disabled={disabled} rows={2} />
            </div>

            <h6>Water</h6>
            <div className="form-group">
                <label>6. Total water withdrawal (KL) and consumption (KL) during the financial year.</label>
                <div><label>Total Withdrawal (KL):</label> <input type="number" value={formData.essential_indicators.total_water_withdrawal_kl ?? ''} onChange={e => handleChange('essential_indicators.total_water_withdrawal_kl', e.target.value, 'number')} disabled={disabled} /></div>
                <div><label>Total Consumption (KL):</label> <input type="number" value={formData.essential_indicators.total_water_consumption_kl ?? ''} onChange={e => handleChange('essential_indicators.total_water_consumption_kl', e.target.value, 'number')} disabled={disabled} /></div>
            </div>
            <div className="form-group">
                <label>7. Water intensity (e.g., per rupee of turnover, per unit of production). Provide details.</label>
                <textarea value={formData.essential_indicators.water_intensity_details || ''} onChange={e => handleChange('essential_indicators.water_intensity_details', e.target.value)} disabled={disabled} rows={2} />
            </div>
            <div className="form-group">
                <label>8. Water discharge by destination and treatment level (KL). Add rows as needed.</label>
                {(formData.essential_indicators.water_discharge_by_destination_and_treatment || []).map((item, index) => (
                    <div key={index} className="array-item">
                        <input type="text" placeholder="Destination (e.g., River, STP)" value={item.destination || ''} onChange={e => handleArrayChange('essential_indicators', 'water_discharge_by_destination_and_treatment', index, 'destination', e.target.value)} disabled={disabled} />
                        <input type="text" placeholder="Treatment Level (e.g., Tertiary)" value={item.treatment_level || ''} onChange={e => handleArrayChange('essential_indicators', 'water_discharge_by_destination_and_treatment', index, 'treatment_level', e.target.value)} disabled={disabled} />
                        <input type="number" placeholder="Quantity (KL)" value={item.quantity_kl ?? ''} onChange={e => handleArrayChange('essential_indicators', 'water_discharge_by_destination_and_treatment', index, 'quantity_kl', parseFloat(e.target.value) || null)} disabled={disabled} />
                        <input type="text" placeholder="Standards Met (e.g., CPCB)" value={item.standards_met || ''} onChange={e => handleArrayChange('essential_indicators', 'water_discharge_by_destination_and_treatment', index, 'standards_met', e.target.value)} disabled={disabled} />
                        {!disabled && <button type="button" onClick={() => removeArrayItem('essential_indicators', 'water_discharge_by_destination_and_treatment', index)} className="remove-button">Remove</button>}
                    </div>
                ))}
                {!disabled && <button type="button" onClick={() => addArrayItem('essential_indicators', 'water_discharge_by_destination_and_treatment', { destination: '', treatment_level: '', quantity_kl: null, standards_met: '' })} className="add-button">Add Discharge Info</button>}
            </div>
            <div className="form-group">
                <label>9. Details of operations in water-stressed areas.</label>
                <textarea value={formData.essential_indicators.water_stress_areas_operations_details || ''} onChange={e => handleChange('essential_indicators.water_stress_areas_operations_details', e.target.value)} disabled={disabled} rows={3} />
            </div>

            <h6>Air Emissions</h6>
            <div className="form-group">
                <label>10. GHG Emissions (tonnes of CO2 equivalent):</label>
                <div><label>Scope 1:</label> <input type="number" value={formData.essential_indicators.ghg_emissions_scope1_tonnes ?? ''} onChange={e => handleChange('essential_indicators.ghg_emissions_scope1_tonnes', e.target.value, 'number')} disabled={disabled} /></div>
                <div><label>Scope 2:</label> <input type="number" value={formData.essential_indicators.ghg_emissions_scope2_tonnes ?? ''} onChange={e => handleChange('essential_indicators.ghg_emissions_scope2_tonnes', e.target.value, 'number')} disabled={disabled} /></div>
                <div><label>Scope 3 (if available):</label> <input type="number" value={formData.essential_indicators.ghg_emissions_scope3_tonnes ?? ''} onChange={e => handleChange('essential_indicators.ghg_emissions_scope3_tonnes', e.target.value, 'number')} disabled={disabled} /></div>
            </div>
            <div className="form-group">
                <label>11. GHG intensity (e.g., per rupee of turnover, per unit of production). Provide details.</label>
                <textarea value={formData.essential_indicators.ghg_intensity_details || ''} onChange={e => handleChange('essential_indicators.ghg_intensity_details', e.target.value)} disabled={disabled} rows={2} />
            </div>
            <div className="form-group">
                <label>12. Other significant air emissions (tonnes/year):</label>
                <div><label>NOx:</label> <input type="number" value={formData.essential_indicators.nox_emissions_tonnes ?? ''} onChange={e => handleChange('essential_indicators.nox_emissions_tonnes', e.target.value, 'number')} disabled={disabled} /></div>
                <div><label>SOx:</label> <input type="number" value={formData.essential_indicators.sox_emissions_tonnes ?? ''} onChange={e => handleChange('essential_indicators.sox_emissions_tonnes', e.target.value, 'number')} disabled={disabled} /></div>
                <div><label>Particulate Matter (PM):</label> <input type="number" value={formData.essential_indicators.pm_emissions_tonnes ?? ''} onChange={e => handleChange('essential_indicators.pm_emissions_tonnes', e.target.value, 'number')} disabled={disabled} /></div>
                <div><label>Other (specify):</label> <textarea value={formData.essential_indicators.other_air_emissions_details || ''} onChange={e => handleChange('essential_indicators.other_air_emissions_details', e.target.value)} disabled={disabled} rows={2} /></div>
            </div>

            <h6>Waste Management</h6>
            <div className="form-group">
                <label>13. Total waste generated (metric tonnes):</label>
                <div><label>Total Waste:</label> <input type="number" value={formData.essential_indicators.total_waste_generated_metric_tonnes ?? ''} onChange={e => handleChange('essential_indicators.total_waste_generated_metric_tonnes', e.target.value, 'number')} disabled={disabled} /></div>
                <div><label>Total Hazardous Waste:</label> <input type="number" value={formData.essential_indicators.total_hazardous_waste_generated_metric_tonnes ?? ''} onChange={e => handleChange('essential_indicators.total_hazardous_waste_generated_metric_tonnes', e.target.value, 'number')} disabled={disabled} /></div>
                <div><label>Total Non-Hazardous Waste:</label> <input type="number" value={formData.essential_indicators.total_non_hazardous_waste_generated_metric_tonnes ?? ''} onChange={e => handleChange('essential_indicators.total_non_hazardous_waste_generated_metric_tonnes', e.target.value, 'number')} disabled={disabled} /></div>
            </div>
            <div className="form-group">
                <label>14. Waste management practices. Add rows as needed.</label>
                {(formData.essential_indicators.waste_management_practices || []).map((item, index) => (
                    <div key={index} className="array-item">
                        <input type="text" placeholder="Waste Type (e.g., Fly Ash, Plastic)" value={item.waste_type || ''} onChange={e => handleArrayChange('essential_indicators', 'waste_management_practices', index, 'waste_type', e.target.value)} disabled={disabled} />
                        <input type="text" placeholder="Disposal Method (e.g., Landfill, Recycle)" value={item.disposal_method || ''} onChange={e => handleArrayChange('essential_indicators', 'waste_management_practices', index, 'disposal_method', e.target.value)} disabled={disabled} />
                        <input type="number" placeholder="Quantity (MT)" value={item.quantity_mt ?? ''} onChange={e => handleArrayChange('essential_indicators', 'waste_management_practices', index, 'quantity_mt', parseFloat(e.target.value) || null)} disabled={disabled} />
                        <label><input type="checkbox" checked={item.is_recycled_or_reused || false} onChange={e => handleArrayChange('essential_indicators', 'waste_management_practices', index, 'is_recycled_or_reused', e.target.checked)} disabled={disabled} /> Recycled/Reused?</label>
                        {!disabled && <button type="button" onClick={() => removeArrayItem('essential_indicators', 'waste_management_practices', index)} className="remove-button">Remove</button>}
                    </div>
                ))}
                {!disabled && <button type="button" onClick={() => addArrayItem('essential_indicators', 'waste_management_practices', { waste_type: '', disposal_method: '', quantity_mt: null, is_recycled_or_reused: false })} className="add-button">Add Waste Practice</button>}
            </div>
            <div className="form-group">
                <label>15. Details of plastic waste management (collection, recycling, disposal).</label>
                <textarea value={formData.essential_indicators.plastic_waste_details || ''} onChange={e => handleChange('essential_indicators.plastic_waste_details', e.target.value)} disabled={disabled} rows={3} />
            </div>
            <div className="form-group">
                <label>16. Details of E-waste management (collection, recycling, disposal).</label>
                <textarea value={formData.essential_indicators.ewaste_details || ''} onChange={e => handleChange('essential_indicators.ewaste_details', e.target.value)} disabled={disabled} rows={3} />
            </div>

            <h6>Biodiversity</h6>
            <div className="form-group">
                <label>17. Details of operations in or near ecologically sensitive areas/biodiversity hotspots.</label>
                <textarea value={formData.essential_indicators.operations_in_or_near_biodiversity_hotspots || ''} onChange={e => handleChange('essential_indicators.operations_in_or_near_biodiversity_hotspots', e.target.value)} disabled={disabled} rows={3} />
            </div>

            <h6>Environmental Incidents</h6>
            <div className="form-group">
                <label>18. Details of any significant environmental incidents during the year.</label>
                <textarea value={formData.essential_indicators.significant_environmental_incidents_details || ''} onChange={e => handleChange('essential_indicators.significant_environmental_incidents_details', e.target.value)} disabled={disabled} rows={3} />
            </div>

            {/* User added field - keep if still desired, or remove if not part of standard BRSR */}
            <div className="form-group">
                <label>Total Noise Pollution (dB, averaged over the year):</label>
                <input 
                    type="number" 
                    step="0.01" 
                    value={formData.essential_indicators.total_noise_pollution_db ?? ''} 
                    onChange={e => handleChange('essential_indicators.total_noise_pollution_db', e.target.value, 'number')} 
                    disabled={disabled} 
                    placeholder="e.g., 70.5"
                />
            </div>

            <h5>Leadership Indicators</h5>
            <div className="form-group">
                <label>1. Details of Life Cycle Assessments (LCAs) conducted and their outcomes.</label>
                <textarea value={formData.leadership_indicators.lca_conducted_details || ''} onChange={e => handleChange('leadership_indicators.lca_conducted_details', e.target.value)} disabled={disabled} rows={3} />
            </div>
            <div className="form-group">
                <label>2. Initiatives for water management in the value chain.</label>
                <textarea value={formData.leadership_indicators.value_chain_water_management_initiatives || ''} onChange={e => handleChange('leadership_indicators.value_chain_water_management_initiatives', e.target.value)} disabled={disabled} rows={3} />
            </div>
            <div className="form-group">
                <label>3. GHG emissions reduction targets, baseline, and progress made.</label>
                <textarea value={formData.leadership_indicators.ghg_reduction_targets_and_progress || ''} onChange={e => handleChange('leadership_indicators.ghg_reduction_targets_and_progress', e.target.value)} disabled={disabled} rows={3} />
            </div>
            <div className="form-group">
                <label>4. Climate adaptation and mitigation strategies.</label>
                <textarea value={formData.leadership_indicators.climate_adaptation_mitigation_strategies || ''} onChange={e => handleChange('leadership_indicators.climate_adaptation_mitigation_strategies', e.target.value)} disabled={disabled} rows={3} />
            </div>
            <div className="form-group">
                <label>5. Biodiversity conservation and restoration programs (details, outcomes).</label>
                <textarea value={formData.leadership_indicators.biodiversity_conservation_programs_details || ''} onChange={e => handleChange('leadership_indicators.biodiversity_conservation_programs_details', e.target.value)} disabled={disabled} rows={3} />
            </div>
            <div className="form-group">
                <label>6. Business continuity and disaster management plan for environmental aspects.</label>
                <textarea value={formData.leadership_indicators.env_business_continuity_disaster_plan || ''} onChange={e => handleChange('leadership_indicators.env_business_continuity_disaster_plan', e.target.value)} disabled={disabled} rows={3} />
            </div>
            <div className="form-group">
                <label>7. Details of environmental performance of value chain partners (policy, training, incidents).</label>
                <textarea value={formData.leadership_indicators.supply_chain_env_performance_details || ''} onChange={e => handleChange('leadership_indicators.supply_chain_env_performance_details', e.target.value)} disabled={disabled} rows={3} />
            </div>
            <div className="form-group">
                <label>8. Details of any environmental initiatives beyond statutory compliance.</label>
                <textarea value={formData.leadership_indicators.environmental_initiatives || ''} onChange={e => handleChange('leadership_indicators.environmental_initiatives', e.target.value)} disabled={disabled} rows={3} />
            </div>

            <hr />
            {!isSubmitted && (
                <button type="submit" className="form-button" disabled={isLoadingSave}>
                    {isLoadingSave ? 'Saving...' : 'Save Principle 6'}
                </button>
            )}
            {isSubmitted && <p>This section is part of a submitted report and cannot be edited.</p>}
        </form>
    );
}

export default SectionCPrinciple6Form;