
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
    'pricing': true, // 默认展开计价，方便查看新结构
    'general': false,
    'settings': false
  });
  
  // 追踪二级菜单的展开状态
  const [expandedSubMenus, setExpandedSubMenus] = useState<Record<string, boolean>>({});

  const toggleMenu = (id: string) => {
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

  const toggleSubMenu = (e: React.MouseEvent, id: string) => {
    e.stopPropagation();
    setExpandedSubMenus(prev => ({
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

              {isCollapsed && activeId === item.id && (
                <div className="absolute left-0 top-1/2 -translate-y-1/2 w-1 h-6 bg-blue-600 rounded-r-full"></div>
              )}
            </button>

            {/* 子菜单渲染逻辑 */}
            {!isCollapsed && item.children && expandedMenus[item.id] && (
              <div className="mt-1 flex flex-col space-y-1">
                {item.children.map((sub) => (
                  <div key={sub.id}>
                    {sub.children ? (
                      // 具有三级菜单的二级菜单项
                      <div className="flex flex-col">
                        <button
                          onClick={(e) => toggleSubMenu(e, sub.id)}
                          className={`w-full flex items-center justify-between pl-12 pr-3 py-2 rounded-lg text-sm transition-all duration-200 whitespace-nowrap ${
                            expandedSubMenus[sub.id] ? 'text-slate-900 font-bold' : 'text-slate-500 hover:text-slate-900 hover:bg-slate-50'
                          }`}
                        >
                          <span>{sub.label}</span>
                          <Icon 
                            name={expandedSubMenus[sub.id] ? 'ChevronDown' : 'ChevronRight'} 
                            size={12} 
                            className="text-slate-300" 
                          />
                        </button>
                        
                        {/* 三级菜单列表 */}
                        {expandedSubMenus[sub.id] && (
                          <div className="mt-0.5 ml-12 border-l border-slate-100 flex flex-col space-y-1 pl-4 animate-in fade-in slide-in-from-top-1 duration-200">
                            {sub.children.map((deepChild) => (
                              <button
                                key={deepChild.id}
                                onClick={() => onSelect(item.id, deepChild.id)}
                                className={`text-left py-1.5 pr-3 rounded-lg text-[13px] transition-all duration-200 whitespace-nowrap ${
                                  activeSubId === deepChild.id 
                                    ? 'text-blue-600 font-bold' 
                                    : 'text-slate-400 hover:text-blue-600 hover:pl-1'
                                }`}
                              >
                                {deepChild.label}
                              </button>
                            ))}
                          </div>
                        )}
                      </div>
                    ) : (
                      // 普通二级菜单项
                      <button
                        onClick={() => onSelect(item.id, sub.id)}
                        className={`text-left py-2 pl-12 pr-3 rounded-lg text-sm transition-all duration-200 whitespace-nowrap ${
                          activeSubId === sub.id || (sub.id === 'list-optimization' && ['ok-contract', 'price-file-compare', 'price-file-compare-2', 'material-price-consistency'].includes(activeSubId))
                            ? 'text-blue-600 font-bold' 
                            : 'text-slate-500 hover:text-slate-900 hover:bg-slate-50 hover:pl-13'
                        }`}
                      >
                        {sub.label}
                      </button>
                    )}
                  </div>
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
