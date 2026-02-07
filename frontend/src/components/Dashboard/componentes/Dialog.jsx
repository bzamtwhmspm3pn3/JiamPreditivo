import React from 'react';

export const Dialog = ({ children, open, onOpenChange, ...props }) => {
  if (!open) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50 p-4">
      <div className="relative bg-white rounded-xl shadow-xl max-w-md w-full max-h-[90vh] overflow-y-auto">
        {React.Children.map(children, child =>
          React.isValidElement(child)
            ? React.cloneElement(child, { onClose: () => onOpenChange?.(false) })
            : child
        )}
      </div>
    </div>
  );
};

export const DialogContent = ({ children, className = "", onClose, ...props }) => (
  <div className={`p-6 ${className}`} {...props}>
    {children}
    <button
      onClick={onClose}
      className="absolute top-4 right-4 text-gray-400 hover:text-gray-600 text-xl"
    >
      ✕
    </button>
  </div>
);

export const DialogHeader = ({ children, className = "", ...props }) => (
  <div className={`mb-4 ${className}`} {...props}>
    {children}
  </div>
);

export const DialogTitle = ({ children, className = "", ...props }) => (
  <h3 className={`text-lg font-semibold text-gray-900 ${className}`} {...props}>
    {children}
  </h3>
);

export default Dialog;