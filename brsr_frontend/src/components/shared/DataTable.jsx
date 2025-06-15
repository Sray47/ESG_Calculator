import React from 'react';

/**
 * Reusable data table component for displaying and managing arrays of data
 */
const DataTable = ({
  title,
  data = [],
  columns = [],
  onAdd,
  onRemove,
  onUpdate,
  addButtonText = 'Add Row',
  removeButtonText = 'Remove',
  disabled = false,
  maxRows,
  minRows = 1,
  showAddButton = true,
  showRemoveButton = true,
  style,
  className,
  ...props
}) => {
  const tableStyle = {
    width: '100%',
    borderCollapse: 'collapse',
    marginBottom: 16,
    background: '#fff',
    border: '1px solid #e0e0e0',
    borderRadius: 4,
    overflow: 'hidden',
    ...style
  };

  const headerStyle = {
    background: '#f8f9fa',
    fontWeight: 600,
    padding: 12,
    textAlign: 'left',
    borderBottom: '2px solid #dee2e6',
    color: '#495057'
  };

  const cellStyle = {
    padding: 12,
    borderBottom: '1px solid #dee2e6',
    verticalAlign: 'top'
  };

  const inputStyle = {
    width: '100%',
    padding: '6px 8px',
    border: '1px solid #ced4da',
    borderRadius: 3,
    fontSize: '0.9rem'
  };

  const buttonStyle = {
    background: '#007bff',
    color: '#fff',
    border: 'none',
    borderRadius: 4,
    padding: '6px 12px',
    fontSize: '0.875rem',
    cursor: 'pointer',
    marginRight: 8,
    marginBottom: 8
  };

  const removeButtonStyle = {
    ...buttonStyle,
    background: '#dc3545'
  };

  const handleCellChange = (rowIndex, columnKey, value) => {
    if (onUpdate) {
      onUpdate(rowIndex, columnKey, value);
    }
  };

  const handleAddRow = () => {
    if (onAdd && (!maxRows || data.length < maxRows)) {
      onAdd();
    }
  };

  const handleRemoveRow = (index) => {
    if (onRemove && data.length > minRows) {
      onRemove(index);
    }
  };

  const renderCell = (row, column, rowIndex) => {
    const value = row[column.key] || '';
    
    if (column.type === 'select') {
      return (
        <select
          value={value}
          onChange={(e) => handleCellChange(rowIndex, column.key, e.target.value)}
          disabled={disabled}
          style={inputStyle}
        >
          {column.options?.map((option, index) => (
            <option key={index} value={option.value || option}>
              {option.label || option}
            </option>
          ))}
        </select>
      );
    }
    
    if (column.type === 'number') {
      return (
        <input
          type="number"
          value={value}
          onChange={(e) => handleCellChange(rowIndex, column.key, e.target.value)}
          disabled={disabled}
          min={column.min}
          max={column.max}
          step={column.step}
          style={inputStyle}
        />
      );
    }
    
    if (column.type === 'textarea') {
      return (
        <textarea
          value={value}
          onChange={(e) => handleCellChange(rowIndex, column.key, e.target.value)}
          disabled={disabled}
          rows={2}
          style={{ ...inputStyle, minHeight: '60px' }}
        />
      );
    }
    
    // Default to text input
    return (
      <input
        type="text"
        value={value}
        onChange={(e) => handleCellChange(rowIndex, column.key, e.target.value)}
        disabled={disabled}
        placeholder={column.placeholder}
        style={inputStyle}
      />
    );
  };

  return (
    <div className={`data-table ${className || ''}`} {...props}>
      {title && (
        <h4 style={{ marginBottom: 16, fontSize: '1.1rem', fontWeight: 600, color: '#333' }}>
          {title}
        </h4>
      )}
      
      <table style={tableStyle}>
        <thead>
          <tr>
            {columns.map((column, index) => (
              <th key={index} style={headerStyle}>
                {column.label || column.key}
                {column.required && <span style={{ color: '#dc3545', marginLeft: 4 }}>*</span>}
              </th>
            ))}
            {showRemoveButton && <th style={headerStyle}>Actions</th>}
          </tr>
        </thead>
        <tbody>
          {data.map((row, rowIndex) => (
            <tr key={rowIndex}>
              {columns.map((column, colIndex) => (
                <td key={colIndex} style={cellStyle}>
                  {renderCell(row, column, rowIndex)}
                </td>
              ))}
              {showRemoveButton && (
                <td style={cellStyle}>
                  <button
                    type="button"
                    onClick={() => handleRemoveRow(rowIndex)}
                    disabled={disabled || data.length <= minRows}
                    style={removeButtonStyle}
                  >
                    {removeButtonText}
                  </button>
                </td>
              )}
            </tr>
          ))}
        </tbody>
      </table>
      
      {showAddButton && (
        <button
          type="button"
          onClick={handleAddRow}
          disabled={disabled || (maxRows && data.length >= maxRows)}
          style={buttonStyle}
        >
          {addButtonText}
        </button>
      )}
    </div>
  );
};

export default DataTable;
