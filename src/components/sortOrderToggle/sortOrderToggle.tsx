import React from 'react';

interface SortOption {
  enabled: boolean;
  order: number | null;
}

interface SortOrderToggleProps {
  rows: SortOption;
  columns: SortOption;
  onToggle: (key: 'rows' | 'columns') => void;
}

export const SortOrderToggle: React.FC<SortOrderToggleProps> = ({ rows, columns, onToggle }) => {
  const renderButton = (key: 'rows' | 'columns', label: string, option: SortOption) => (
    <button
      onClick={() => onToggle(key)}
      style={{
        padding: '0.5rem 1rem',
        marginRight: '1rem',
        backgroundColor: option.enabled ? '#4caf50' : '#ccc',
        color: option.enabled ? 'white' : '#666',
        border: 'none',
        borderRadius: '5px',
        cursor: 'pointer',
      }}
    >
      {label} {option.enabled && option.order !== null ? `(${option.order})` : '(×)'}
    </button>
  );

  return (
    <div style={{ display: 'flex', alignItems: 'center' }}>
      {renderButton('rows', 'Rows', rows)}
      {renderButton('columns', 'Columns', columns)}
    </div>
  );
};
