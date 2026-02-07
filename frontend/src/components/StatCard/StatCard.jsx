// src/components/StatCard/StatCard.jsx
import React from 'react';
import { FaDatabase, FaChartBar, FaTable, FaFileExcel, FaFileCsv, FaFileAlt } from 'react-icons/fa';

const iconMap = {
  database: FaDatabase,
  chart: FaChartBar,
  table: FaTable,
  excel: FaFileExcel,
  csv: FaFileCsv,
  file: FaFileAlt
};

export default function StatCard({ title, value, icon, color, trend, description }) {
  const IconComponent = iconMap[icon] || FaDatabase;
  
  const colorClasses = {
    blue: 'bg-blue-50 border-blue-200 text-blue-700',
    green: 'bg-green-50 border-green-200 text-green-700',
    purple: 'bg-purple-50 border-purple-200 text-purple-700',
    orange: 'bg-orange-50 border-orange-200 text-orange-700',
    red: 'bg-red-50 border-red-200 text-red-700'
  };

  return (
    <div className={`p-4 rounded-lg border ${colorClasses[color] || colorClasses.blue}`}>
      <div className="flex items-center justify-between">
        <div>
          <p className="text-sm font-medium opacity-75">{title}</p>
          <p className="text-2xl font-bold mt-1">{value}</p>
          {description && (
            <p className="text-xs mt-1 opacity-75">{description}</p>
          )}
        </div>
        <div className={`p-3 rounded-full ${colorClasses[color].replace('50', '100').replace('border', '')}`}>
          <IconComponent className="text-xl" />
        </div>
      </div>
      {trend && (
        <div className="mt-2 text-xs flex items-center">
          <span className={`px-2 py-1 rounded ${
            trend.direction === 'up' ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'
          }`}>
            {trend.direction === 'up' ? '↑' : '↓'} {trend.value}
          </span>
          <span className="ml-2 opacity-75">{trend.label}</span>
        </div>
      )}
    </div>
  );
}