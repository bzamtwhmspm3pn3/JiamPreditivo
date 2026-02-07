import React from 'react';

export const TabList = ({ children, className = '' }) => {
  return (
    <div className={`flex border-b border-gray-200 ${className}`}>
      {children}
    </div>
  );
};

export const Tab = ({ children, isActive, onClick, icon, value }) => {
  return (
    <button
      onClick={() => onClick(value)}
      className={`px-4 py-2 font-medium flex items-center gap-2 ${
        isActive 
          ? 'border-b-2 border-blue-500 text-blue-600' 
          : 'text-gray-500 hover:text-gray-700'
      }`}
    >
      {icon && <span>{icon}</span>}
      {children}
    </button>
  );
};

export const TabPanels = ({ children, className = '' }) => {
  return (
    <div className={`mt-4 ${className}`}>
      {children}
    </div>
  );
};

export const TabPanel = ({ children, isActive }) => {
  if (!isActive) return null;
  return <div>{children}</div>;
};

export default function Tabs({ children, value, onChange }) {
  const childrenArray = React.Children.toArray(children);
  
  // Encontrar TabList e TabPanels
  const tabListChild = childrenArray.find(child => 
    React.isValidElement(child) && child.type === TabList
  );
  
  const tabPanelsChild = childrenArray.find(child => 
    React.isValidElement(child) && child.type === TabPanels
  );

  // Renderizar TabList com tabs ativas
  const renderTabList = () => {
    if (!tabListChild) return null;
    
    return React.cloneElement(tabListChild, {
      children: React.Children.map(tabListChild.props.children, (tab) => {
        if (!React.isValidElement(tab) || tab.type !== Tab) return tab;
        
        return React.cloneElement(tab, {
          isActive: tab.props.value === value,
          onClick: onChange
        });
      })
    });
  };

  // Renderizar TabPanels com painéis ativos
  const renderTabPanels = () => {
    if (!tabPanelsChild) return null;
    
    return React.cloneElement(tabPanelsChild, {
      children: React.Children.map(tabPanelsChild.props.children, (panel) => {
        if (!React.isValidElement(panel) || panel.type !== TabPanel) return panel;
        
        return React.cloneElement(panel, {
          isActive: panel.props.value === value
        });
      })
    });
  };

  return (
    <div>
      {renderTabList()}
      {renderTabPanels()}
    </div>
  );
}