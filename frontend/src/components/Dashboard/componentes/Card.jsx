import React from 'react';

export const Card = ({ children, className = "", ...props }) => (
  <div className={`bg-white rounded-xl shadow-lg border border-gray-200 ${className}`} {...props}>
    {children}
  </div>
);

export const CardHeader = ({ children, className = "", ...props }) => (
  <div className={`p-6 border-b border-gray-200 ${className}`} {...props}>
    {children}
  </div>
);

export const CardTitle = ({ children, className = "", ...props }) => (
  <h3 className={`text-xl font-bold text-gray-800 ${className}`} {...props}>
    {children}
  </h3>
);

export const CardDescription = ({ children, className = "", ...props }) => (
  <p className={`text-sm text-gray-600 ${className}`} {...props}>
    {children}
  </p>
);

export const CardContent = ({ children, className = "", ...props }) => (
  <div className={`p-6 ${className}`} {...props}>
    {children}
  </div>
);

export default Card;