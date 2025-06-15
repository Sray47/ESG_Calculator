import React from 'react';
import { useFormContext } from 'react-hook-form';
import { FormFieldControlled, Button } from '../shared';

const ProductsServicesTableControlled = ({ control, onAdd, onRemove }) => {
    const { watch } = useFormContext();
    const products = watch('sectionAData.sa_product_services_turnover') || [];

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
                    Add Product/Service
                </Button>
            </div>
            
            {products.map((_, index) => (
                <div key={index} style={{ border: '1px solid #ddd', borderRadius: 4, padding: 16, marginBottom: 16 }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 }}>
                        <h4 style={{ margin: 0 }}>Product/Service {index + 1}</h4>
                        {products.length > 1 && (
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
                            name={`sectionAData.sa_product_services_turnover.${index}.product_service`}
                            control={control}
                            label="Product/Service"
                            required
                            placeholder="Describe the product or service"
                        />
                    </div>
                    
                    <div className="form-row">
                        <div className="form-group">
                            <FormFieldControlled
                                name={`sectionAData.sa_product_services_turnover.${index}.nic_code`}
                                control={control}
                                label="NIC Code"
                                required
                                placeholder="e.g., 2011"
                            />
                        </div>
                        <div className="form-group">
                            <FormFieldControlled
                                name={`sectionAData.sa_product_services_turnover.${index}.turnover_contributed`}
                                control={control}
                                label="% of Total Turnover Contributed"
                                required
                                placeholder="e.g., 45%"
                            />
                        </div>
                    </div>
                </div>
            ))}
        </div>
    );
};

export default ProductsServicesTableControlled;
