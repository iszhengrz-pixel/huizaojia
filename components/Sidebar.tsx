
import React, { useState } from 'react';
import { NAVIGATION_MENU } from '../constants';
import Icon from './Icon';

interface SidebarProps {
  activeId: string;
  activeSubId: string;
  onSelect: (id: string, subId?: string) => void;
}

const Sidebar: React.FC<SidebarProps> = ({ activeId, activeSubId, onSelect }) => {
  const [isCollapsed, setIsCollapsed] = useState(false);
  const [expandedMenus, setExpandedMenus] = useState<Record<string, boolean>>({
    'ai-qa': false,
    'quantity': false,
    'pricing': false,
    'general': false,
    'settings': false
  });

  const toggleMenu = (id: string) => {
    // 如果是收起状态，点击菜单先展开侧边栏
    if (isCollapsed) {
      setIsCollapsed(false);
      setExpandedMenus(prev => ({ ...prev, [id]: true }));
      return;
    }
    setExpandedMenus(prev => ({
      ...prev,
      [id]: !prev[id]
    }));
  };

  return (
    <div className={`bg-white border-r border-slate-100 flex flex-col h-full shrink-0 transition-all duration-300 ease-in-out relative ${isCollapsed ? 'w-[72px]' : 'w-64'}`}>
      {/* 顶部菜单列表 */}
      <nav className="flex-1 overflow-y-auto px-3 py-6 custom-scrollbar overflow-x-hidden">
        {NAVIGATION_MENU.map((item) => (
          <div key={item.id} className="mb-1.5">
            <button
              onClick={() => {
                if (item.children) {
                  toggleMenu(item.id);
                } else {
                  onSelect(item.id);
                }
              }}
              className={`w-full flex items-center px-3 py-3 rounded-xl transition-all duration-200 group relative ${
                activeId === item.id 
                  ? 'bg-blue-50 text-blue-600' 
                  : 'text-slate-600 hover:bg-slate-50'
              } ${isCollapsed ? 'justify-center' : 'justify-between'}`}
              title={isCollapsed ? item.label : undefined}
            >
              <div className="flex items-center space-x-3">
                <Icon 
                  name={item.icon} 
                  size={22} 
                  className={`transition-colors ${activeId === item.id ? 'text-blue-600' : 'text-slate-400 group-hover:text-slate-600'}`} 
                />
                {!isCollapsed && (
                  <span className="font-bold text-[14px] whitespace-nowrap animate-in fade-in duration-300">
                    {item.label}
                  </span>
                )}
              </div>
              
              {!isCollapsed && item.children && (
                <Icon 
                  name={expandedMenus[item.id] ? 'ChevronDown' : 'ChevronRight'} 
                  size={14} 
                  className="text-slate-300 group-hover:text-slate-500 transition-all" 
                />
              )}

              {/* 收起状态下的激活标识线 */}
              {isCollapsed && activeId === item.id && (
                <div className="absolute left-0 top-1/2 -translate-y-1/2 w-1 h-6 bg-blue-600 rounded-r-full"></div>
              )}
            </button>

            {/* 子菜单 - 仅在非收起状态且展开时显示 */}
            {!isCollapsed && item.children && expandedMenus[item.id] && (
              <div className="mt-1 ml-9 flex flex-col space-y-1 pl-3">
                {item.children.map((sub) => (
                  <button
                    key={sub.id}
                    onClick={() => onSelect(item.id, sub.id)}
                    className={`text-left py-2 rounded-lg text-sm transition-all duration-200 whitespace-nowrap ${
                      activeSubId === sub.id 
                        ? 'text-blue-600 font-bold' 
                        : 'text-slate-500 hover:text-slate-900 hover:pl-1'
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

      {/* 底部收起按钮 */}
      <div className="p-3 border-t border-slate-50">
        <button
          onClick={() => setIsCollapsed(!isCollapsed)}
          className="w-full h-10 flex items-center justify-center text-slate-400 hover:text-blue-600 hover:bg-blue-50 rounded-xl transition-all"
        >
          <Icon 
            name={isCollapsed ? 'PanelLeftOpen' : 'PanelLeftClose'} 
            size={20} 
            className="transition-transform duration-300"
          />
          {!isCollapsed && <span className="ml-3 text-sm font-bold animate-in fade-in duration-300">收起导航</span>}
        </button>
      </div>
    </div>
  );
};

export default Sidebar;
