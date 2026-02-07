import React from 'react';

export const Select = ({ children, value, onChange, placeholder, className = "", ...props }) => (
  <select
    value={value}
    onChange={onChange}
    className={`w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition-all duration-200 ${className}`}
    {...props}
  >
    {placeholder && <option value="">{placeholder}</option>}
    {children}
  </select>
);

export const SelectItem = ({ children, value, ...props }) => (
  <option value={value} {...props}>{children}</option>
);

export default Select;