import React from 'react';
import { useFormContext } from 'react-hook-form';
import { FormFieldControlled, Button } from '../shared';

const BusinessActivitiesTableControlled = ({ control, onAdd, onRemove }) => {
    const { watch } = useFormContext();
    const activities = watch('sectionAData.sa_business_activities_turnover') || [];

    return (
        <div>
            <div style={{ marginBottom: 16 }}>
                <Button 
                    type="button"
                    onClick={onAdd}
                    style={{
                        background: '#28a745',
                        color: '#fff',
                        border: 'none',
                        borderRadius: 4,
                        padding: '8px 16px',
                        cursor: 'pointer'
                    }}
                >
                    Add Business Activity
                </Button>
            </div>
            
            {activities.map((_, index) => (
                <div key={index} style={{ border: '1px solid #ddd', borderRadius: 4, padding: 16, marginBottom: 16 }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 }}>
                        <h4 style={{ margin: 0 }}>Business Activity {index + 1}</h4>
                        {activities.length > 1 && (
                            <Button
                                type="button"
                                onClick={() => onRemove(index)}
                                style={{
                                    background: '#dc3545',
                                    color: '#fff',
                                    border: 'none',
                                    borderRadius: 4,
                                    padding: '4px 8px',
                                    cursor: 'pointer',
                                    fontSize: '0.875em'
                                }}
                            >
                                Remove
                            </Button>
                        )}
                    </div>
                    
                    <div className="form-group">
                        <FormFieldControlled
                            name={`sectionAData.sa_business_activities_turnover.${index}.description_main`}
                            control={control}
                            label="Main Activity"
                            required
                            placeholder="Describe the main business activity"
                        />
                    </div>
                    
                    <div className="form-group">
                        <FormFieldControlled
                            name={`sectionAData.sa_business_activities_turnover.${index}.description_business`}
                            control={control}
                            label="Business Description"
                            required
                            as="textarea"
                            rows={3}
                            placeholder="Provide detailed description of the business activity"
                        />
                    </div>
                    
                    <div className="form-group">
                        <FormFieldControlled
                            name={`sectionAData.sa_business_activities_turnover.${index}.turnover_percentage`}
                            control={control}
                            label="% of Turnover of the Entity"
                            required
                            placeholder="e.g., 65%"
                        />
                    </div>
                </div>
            ))}
        </div>
    );
};

export default BusinessActivitiesTableControlled;
