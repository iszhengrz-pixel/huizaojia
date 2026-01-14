
import React, { useState } from 'react';
import { NAVIGATION_MENU } from '../constants';
import Icon from './Icon';

interface SidebarProps {
  activeId: string;
  activeSubId: string;
  onSelect: (id: string, subId?: string) => void;
}

const Sidebar: React.FC<SidebarProps> = ({ activeId, activeSubId, onSelect }) => {
  const [expandedMenus, setExpandedMenus] = useState<Record<string, boolean>>({
    'ai-qa': false,
    'quantity': false,
    'pricing': false,
    'general': false,
    'settings': false
  });

  const toggleMenu = (id: string) => {
    setExpandedMenus(prev => ({
      ...prev,
      [id]: !prev[id]
    }));
  };

  return (
    <div className="w-64 bg-white border-r border-slate-200 flex flex-col h-full shrink-0">
      <nav className="flex-1 overflow-y-auto px-4 py-6 custom-scrollbar">
        {NAVIGATION_MENU.map((item) => (
          <div key={item.id} className="mb-1">
            <button
              onClick={() => {
                if (item.children) {
                  toggleMenu(item.id);
                } else {
                  onSelect(item.id);
                }
              }}
              className={`w-full flex items-center justify-between px-3 py-2.5 rounded-lg transition-all duration-200 group ${
                activeId === item.id 
                  ? 'bg-blue-50 text-blue-600' 
                  : 'text-slate-600 hover:bg-slate-50'
              }`}
            >
              <div className="flex items-center space-x-3">
                <Icon name={item.icon} size={20} className={activeId === item.id ? 'text-blue-600' : 'text-slate-400 group-hover:text-slate-600'} />
                <span className="font-medium text-sm">{item.label}</span>
              </div>
              {item.children && (
                <Icon 
                  name={expandedMenus[item.id] ? 'ChevronDown' : 'ChevronRight'} 
                  size={14} 
                  className="text-slate-400" 
                />
              )}
            </button>

            {item.children && expandedMenus[item.id] && (
              <div className="mt-1 ml-9 flex flex-col space-y-1">
                {item.children.map((sub) => (
                  <button
                    key={sub.id}
                    onClick={() => onSelect(item.id, sub.id)}
                    className={`text-left px-3 py-1.5 rounded-md text-sm transition-colors ${
                      activeSubId === sub.id 
                        ? 'text-blue-600 font-medium' 
                        : 'text-slate-500 hover:text-slate-800 hover:bg-slate-50'
                    }`}
                  >
                    {sub.label}
                  </button>
                ))}
              </div>
            )}
          </div>
        ))}
      </nav>
    </div>
  );
};

export default Sidebar;
