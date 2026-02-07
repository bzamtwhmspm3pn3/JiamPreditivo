import React from 'react';

export const Input = ({ className = "", type = "text", ...props }) => (
  <input
    type={type}
    className={`w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition-all duration-200 ${className}`}
    {...props}
  />
);

export const Label = ({ children, htmlFor, className = "", ...props }) => (
  <label
    htmlFor={htmlFor}
    className={`block text-sm font-medium text-gray-700 mb-1 ${className}`}
    {...props}
  >
    {children}
  </label>
);

export default Input;