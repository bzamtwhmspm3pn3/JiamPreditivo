// componentes/Checkbox.js
import React from 'react';

export default function Checkbox({ id, checked, onChange, disabled, label, className = '' }) {
  return (
    <div className={`flex items-center ${className}`}>
      <input
        type="checkbox"
        id={id}
        checked={checked}
        onChange={onChange}
        disabled={disabled}
        className="h-4 w-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
      />
      {label && (
        <label 
          htmlFor={id} 
          className={`ml-2 text-sm ${disabled ? 'text-gray-400' : 'text-gray-700'}`}
        >
          {label}
        </label>
      )}
    </div>
  );
}