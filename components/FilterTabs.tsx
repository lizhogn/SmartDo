import React from 'react';
import { FilterType } from '../types';

interface FilterTabsProps {
  currentFilter: FilterType;
  setFilter: (filter: FilterType) => void;
  counts: {
    all: number;
    active: number;
    completed: number;
  };
}

export const FilterTabs: React.FC<FilterTabsProps> = ({ currentFilter, setFilter, counts }) => {
  const tabs = [
    { type: FilterType.ALL, label: 'All', count: counts.all },
    { type: FilterType.ACTIVE, label: 'Active', count: counts.active },
    { type: FilterType.COMPLETED, label: 'Done', count: counts.completed },
  ];

  return (
    <div className="inline-flex p-1 bg-gray-100/80 rounded-lg">
      {tabs.map((tab) => (
        <button
          key={tab.type}
          onClick={() => setFilter(tab.type)}
          className={`relative px-2 sm:px-4 py-1.5 text-xs sm:text-sm font-medium rounded-md transition-all duration-200 ${
            currentFilter === tab.type
              ? 'bg-white text-gray-900 shadow-sm'
              : 'text-gray-500 hover:text-gray-700'
          }`}
        >
          {tab.label}
          <span className={`ml-1.5 sm:ml-2 text-[10px] sm:text-xs py-0.5 px-1.5 rounded-full ${
             currentFilter === tab.type ? 'bg-gray-100 text-gray-900' : 'bg-gray-200 text-gray-500'
          }`}>
            {tab.count}
          </span>
        </button>
      ))}
    </div>
  );
};