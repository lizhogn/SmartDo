import React from 'react';

export type GroupingType = 'day' | 'week' | 'month' | 'year';

interface GroupingTabsProps {
  currentGrouping: GroupingType;
  setGrouping: (g: GroupingType) => void;
}

export const GroupingTabs: React.FC<GroupingTabsProps> = ({ currentGrouping, setGrouping }) => {
    const tabs: { id: GroupingType; label: string; short: string }[] = [
        { id: 'day', label: 'Day', short: 'D' },
        { id: 'week', label: 'Week', short: 'W' },
        { id: 'month', label: 'Month', short: 'M' },
        { id: 'year', label: 'Year', short: 'Y' },
    ];

    return (
        <div className="flex p-1 bg-gray-100/80 rounded-lg ml-auto">
            {tabs.map(tab => (
                 <button
                    key={tab.id}
                    onClick={() => setGrouping(tab.id)}
                    className={`px-3 py-1.5 text-xs font-medium rounded-md transition-all duration-200 min-w-[32px] sm:min-w-0 ${
                        currentGrouping === tab.id
                        ? 'bg-white text-gray-900 shadow-sm'
                        : 'text-gray-500 hover:text-gray-700'
                    }`}
                    title={tab.label}
                >
                    <span className="hidden sm:inline">{tab.label}</span>
                    <span className="sm:hidden">{tab.short}</span>
                </button>
            ))}
        </div>
    );
};