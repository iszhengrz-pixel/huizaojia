
import React, { useState, useMemo } from 'react';
import Icon from './Icon';

interface MenuData {
  id: string;
  name: string;
  icon: string;
  order: number;
  permKey: string;
  path: string;
  status: 'normal' | 'disabled';
  createTime: string;
  children?: MenuData[];
}

const MOCK_DATA: MenuData[] = [
  { id: '1', name: '个人中心', icon: '#', order: 1, permKey: '', path: '/index', status: 'normal', createTime: '2026-01-08 08:25:35' },
  { 
    id: '2', 
    name: '系统管理', 
    icon: '#', 
    order: 2, 
    permKey: '', 
    path: '', 
    status: 'normal', 
    createTime: '2026-01-08 06:31:29',
    children: [
      { 
        id: '21', 
        name: '用户管理', 
        icon: '#', 
        order: 1, 
        permKey: 'system:user:list', 
        path: 'user', 
        status: 'normal', 
        createTime: '2026-01-08 10:00:00',
        children: [
          { id: '211', name: '修改权限', icon: '#', order: 1, permKey: 'user:edit', path: '', status: 'normal', createTime: '2026-01-08 10:05:00' },
          { id: '212', name: '新增权限', icon: '#', order: 2, permKey: 'user:add', path: '', status: 'normal', createTime: '2026-01-08 10:06:00' },
        ]
      },
      { id: '22', name: '角色管理', icon: '#', order: 2, permKey: 'system:role:list', path: 'role', status: 'normal', createTime: '2026-01-08 11:00:00' },
      { id: '23', name: '菜单管理', icon: '#', order: 3, permKey: 'system:menu:list', path: 'menu', status: 'normal', createTime: '2026-01-08 11:30:00' },
    ]
  },
  { 
    id: '3', 
    name: '应用管理', 
    icon: '#', 
    order: 3, 
    permKey: '', 
    path: '', 
    status: 'normal', 
    createTime: '2026-01-12 09:27:37',
    children: [
      { 
        id: '31', 
        name: '汇通用', 
        icon: '#', 
        order: 1, 
        permKey: '', 
        path: '', 
        status: 'normal', 
        createTime: '2026-01-12 09:30:00',
        children: [
          { id: '311', name: '工期计算器', icon: '#', order: 1, permKey: 'app:calc:duration', path: '', status: 'normal', createTime: '2026-01-12 09:35:00' },
          { id: '312', name: '节假日信息维护', icon: '#', order: 2, permKey: 'app:holiday:mgt', path: '', status: 'normal', createTime: '2026-01-12 09:36:00' },
        ]
      }
    ]
  },
];

const MenuManagementView: React.FC = () => {
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [menuType, setMenuType] = useState<'catalog' | 'menu' | 'button'>('catalog');
  const [sortValue, setSortValue] = useState(1);
  const [expandedRows, setExpandedRows] = useState<Set<string>>(new Set(['2', '21', '3', '31']));
  const [sidebarSearch, setSidebarSearch] = useState('');
  const [selectedNodeId, setSelectedNodeId] = useState('211');

  const toggleRow = (id: string) => {
    const newExpanded = new Set(expandedRows);
    if (newExpanded.has(id)) newExpanded.delete(id);
    else newExpanded.add(id);
    setExpandedRows(newExpanded);
  };

  const renderSidebarTree = (nodes: MenuData[], level: number = 0) => {
    return nodes.map(node => {
      const hasChildren = node.children && node.children.length > 0;
      const isExpanded = expandedRows.has(node.id);
      const isSelected = selectedNodeId === node.id;
      
      const isMatch = sidebarSearch ? node.name.includes(sidebarSearch) : true;
      const hasMatchingChild = node.children?.some(child => 
        child.name.includes(sidebarSearch) || child.children?.some(c => c.name.includes(sidebarSearch))
      );

      if (sidebarSearch && !isMatch && !hasMatchingChild) return null;

      return (
        <div key={node.id} className="select-none">
          <div 
            onClick={() => setSelectedNodeId(node.id)}
            className={`flex items-center py-2 px-3 rounded cursor-pointer transition-colors group ${
              isSelected ? 'bg-slate-50 text-blue-600' : 'text-slate-600 hover:bg-slate-50'
            }`}
            style={{ paddingLeft: `${level * 16 + 8}px` }}
          >
            {hasChildren ? (
              <button 
                onClick={(e) => { e.stopPropagation(); toggleRow(node.id); }} 
                className="mr-1 text-slate-400 hover:text-blue-500"
              >
                <Icon name={isExpanded ? 'ChevronDown' : 'ChevronRight'} size={14} />
              </button>
            ) : <div className="w-4 mr-1"></div>}
            <span className={`text-sm ${isSelected ? 'font-medium' : ''}`}>{node.name}</span>
          </div>
          {hasChildren && isExpanded && (
            <div className="animate-in fade-in slide-in-from-top-1 duration-200">
              {renderSidebarTree(node.children!, level + 1)}
            </div>
          )}
        </div>
      );
    });
  };

  const renderTableRow = (menu: MenuData, level: number = 0) => {
    const hasChildren = menu.children && menu.children.length > 0;
    const isExpanded = expandedRows.has(menu.id);

    return (
      <React.Fragment key={menu.id}>
        <tr className="border-b border-slate-50 hover:bg-slate-50/50 transition-colors">
          <td className="px-6 py-4">
            <div className="flex items-center" style={{ paddingLeft: `${level * 24}px` }}>
              {hasChildren ? (
                <button onClick={() => toggleRow(menu.id)} className="mr-2 text-slate-400 hover:text-blue-500">
                  <Icon name={isExpanded ? 'ChevronDown' : 'ChevronRight'} size={14} />
                </button>
              ) : <div className="w-5.5 mr-2"></div>}
              <span className="text-sm text-slate-700 font-medium">{menu.name}</span>
            </div>
          </td>
          <td className="px-6 py-4 text-sm text-slate-500 text-center">{menu.icon}</td>
          <td className="px-6 py-4 text-sm text-slate-500 text-center">{menu.order}</td>
          <td className="px-6 py-4 text-sm text-slate-500">{menu.permKey || '-'}</td>
          <td className="px-6 py-4 text-sm text-slate-500">{menu.path || '-'}</td>
          <td className="px-6 py-4">
            <span className="bg-emerald-50 text-emerald-600 px-2 py-0.5 rounded text-[10px] font-bold">正常</span>
          </td>
          <td className="px-6 py-4 text-sm text-slate-500">{menu.createTime}</td>
          <td className="px-6 py-4">
            <div className="flex items-center space-x-3">
              <button className="text-blue-500 hover:text-blue-600 text-xs flex items-center"><Icon name="Edit" size={12} className="mr-1" /> 修改</button>
              <button className="text-blue-500 hover:text-blue-600 text-xs flex items-center"><Icon name="Plus" size={12} className="mr-1" /> 新增</button>
              <button className="text-rose-400 hover:text-rose-500 text-xs flex items-center"><Icon name="Trash2" size={12} className="mr-1" /> 删除</button>
            </div>
          </td>
        </tr>
        {hasChildren && isExpanded && menu.children!.map(child => renderTableRow(child, level + 1))}
      </React.Fragment>
    );
  };

  return (
    <div className="flex-1 flex bg-[#f8fafc] overflow-hidden">
      <div className="w-[260px] bg-white border-r border-slate-200 flex flex-col shrink-0">
        <div className="p-4 border-b border-slate-50">
          <div className="relative group">
            <div className="absolute inset-y-0 left-3 flex items-center pointer-events-none">
              <Icon name="Search" size={14} className="text-slate-300 group-focus-within:text-blue-400" />
            </div>
            <input 
              type="text" 
              placeholder="请输入菜单名称" 
              value={sidebarSearch}
              onChange={(e) => setSidebarSearch(e.target.value)}
              className="w-full pl-9 pr-3 py-1.5 bg-slate-50 border border-slate-100 rounded-md text-xs focus:outline-none focus:border-blue-300 focus:bg-white transition-all"
            />
          </div>
        </div>
        <div className="flex-1 overflow-y-auto p-2 custom-scrollbar">
          {renderSidebarTree(MOCK_DATA)}
        </div>
      </div>

      <div className="flex-1 flex flex-col h-full overflow-hidden p-6 relative">
        <div className="flex items-center space-x-6 mb-8 shrink-0">
          <div className="flex items-center space-x-2">
            <label className="text-sm font-medium text-slate-700 whitespace-nowrap">菜单名称</label>
            <input type="text" placeholder="请输入菜单名称" className="border border-slate-200 rounded-md py-1.5 px-3 text-sm focus:outline-none focus:border-blue-400 min-w-[180px]" />
          </div>
          <div className="flex items-center space-x-2">
            <label className="text-sm font-medium text-slate-700 whitespace-nowrap">状态</label>
            <div className="relative">
              <select className="appearance-none border border-slate-200 rounded-md py-1.5 px-3 pr-8 text-sm focus:outline-none focus:border-blue-400 min-w-[100px] bg-white">
                <option value="">请选择</option>
                <option value="normal">正常</option>
                <option value="disabled">停用</option>
              </select>
              <Icon name="ChevronDown" size={14} className="absolute right-2 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none" />
            </div>
          </div>
          <button className="flex items-center space-x-1 bg-blue-500 hover:bg-blue-600 text-white px-5 py-1.5 rounded-md text-sm transition-colors shadow-sm">
            <Icon name="Search" size={16} />
            <span>搜索</span>
          </button>
          <button className="flex items-center space-x-1 bg-white border border-slate-200 hover:bg-slate-50 text-slate-700 px-5 py-1.5 rounded-md text-sm transition-colors">
            <Icon name="RotateCw" size={16} />
            <span>重置</span>
          </button>
        </div>

        <div className="flex items-center space-x-3 mb-4 shrink-0">
          <button onClick={() => { setMenuType('catalog'); setIsAddModalOpen(true); }} className="flex items-center space-x-1 bg-[#e6f7ff] border border-[#91d5ff] hover:bg-[#bae7ff] text-blue-500 px-4 py-1.5 rounded-md text-sm transition-colors">
            <Icon name="Plus" size={16} />
            <span>新增</span>
          </button>
          <button className="flex items-center space-x-1 bg-white border border-slate-200 hover:bg-slate-50 text-slate-700 px-4 py-1.5 rounded-md text-sm transition-colors">
            <Icon name="ArrowDownUp" size={16} className="rotate-0" />
            <span>展开/折叠</span>
          </button>
        </div>

        <div className="flex-1 bg-white border border-slate-100 rounded-md overflow-hidden flex flex-col shadow-sm">
          <div className="overflow-x-auto flex-1">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-[#f8f9fb] border-b border-slate-100">
                  <th className="px-6 py-3 text-sm font-bold text-slate-700">菜单名称</th>
                  <th className="px-6 py-3 text-sm font-bold text-slate-700 text-center">图标</th>
                  <th className="px-6 py-3 text-sm font-bold text-slate-700 text-center">排序</th>
                  <th className="px-6 py-3 text-sm font-bold text-slate-700">权限标识</th>
                  <th className="px-6 py-3 text-sm font-bold text-slate-700">组件路径</th>
                  <th className="px-6 py-3 text-sm font-bold text-slate-700">状态</th>
                  <th className="px-6 py-3 text-sm font-bold text-slate-700">创建时间</th>
                  <th className="px-6 py-3 text-sm font-bold text-slate-700">操作</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-50">
                {MOCK_DATA.map(menu => renderTableRow(menu))}
              </tbody>
            </table>
          </div>
        </div>
      </div>

      {isAddModalOpen && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/45 backdrop-blur-sm p-4 animate-in fade-in duration-200">
          <div className="bg-white rounded-lg shadow-2xl w-full max-w-[700px] overflow-hidden flex flex-col animate-in zoom-in-95 duration-200">
            <div className="px-6 py-4 border-b border-slate-100 flex items-center justify-between">
              <h3 className="text-lg font-medium text-slate-700">添加菜单</h3>
              <button onClick={() => setIsAddModalOpen(false)} className="text-slate-400 hover:text-slate-600"><Icon name="X" size={20} /></button>
            </div>

            <div className="flex-1 overflow-y-auto p-8 space-y-6">
              {/* 上级菜单 */}
              <div className="flex items-center">
                <label className="w-24 text-slate-600 text-sm text-right pr-4 shrink-0">上级菜单</label>
                <div className="flex-1 relative">
                  <select className="w-full appearance-none border border-slate-200 rounded-md py-2 px-3 text-sm focus:outline-none focus:border-blue-400 bg-white">
                    <option>用户管理</option>
                    <option>系统管理</option>
                  </select>
                  <Icon name="ChevronDown" size={14} className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400" />
                </div>
              </div>

              {/* 菜单类型 */}
              <div className="flex items-center">
                <label className="w-24 text-slate-600 text-sm text-right pr-4 shrink-0">菜单类型</label>
                <div className="flex items-center space-x-6">
                  {(['catalog', 'menu', 'button'] as const).map(type => (
                    <label key={type} className="flex items-center space-x-2 cursor-pointer group">
                      <div className="relative flex items-center justify-center">
                        <input type="radio" name="menuType" checked={menuType === type} onChange={() => setMenuType(type)} className="peer sr-only" />
                        <div className="w-4 h-4 rounded-full border border-slate-300 peer-checked:border-blue-500 transition-colors"></div>
                        <div className="absolute w-2 h-2 rounded-full bg-blue-500 scale-0 peer-checked:scale-100 transition-transform"></div>
                      </div>
                      <span className="text-sm text-slate-600 group-hover:text-blue-500">{type === 'catalog' ? '目录' : type === 'menu' ? '菜单' : '按钮'}</span>
                    </label>
                  ))}
                </div>
              </div>

              {/* 菜单图标 - 按钮模式下隐藏 */}
              {menuType !== 'button' && (
                <div className="flex items-center">
                  <label className="w-24 text-slate-600 text-sm text-right pr-4 shrink-0">菜单图标</label>
                  <input type="text" placeholder="请输入图标名称" className="flex-1 border border-slate-200 rounded-md py-2 px-3 text-sm focus:outline-none focus:border-blue-400" />
                </div>
              )}

              {/* 菜单名称 & 显示排序 - 所有模式通用 */}
              <div className="grid grid-cols-2 gap-6">
                <div className="flex items-center">
                  <label className="w-24 text-slate-600 text-sm text-right pr-4 shrink-0"><span className="text-red-500 mr-1">*</span>菜单名称</label>
                  <input type="text" placeholder="请输入菜单名称" className="flex-1 border border-slate-200 rounded-md py-2 px-3 text-sm focus:outline-none focus:border-blue-400" />
                </div>
                <div className="flex items-center">
                  <label className="w-24 text-slate-600 text-sm text-right pr-4 shrink-0"><span className="text-red-500 mr-1">*</span>显示排序</label>
                  <div className="flex-1 flex items-center border border-slate-200 rounded-md overflow-hidden">
                    <input type="number" value={sortValue} onChange={e => setSortValue(parseInt(e.target.value) || 0)} className="flex-1 py-2 px-3 text-sm focus:outline-none" />
                    <div className="flex flex-col border-l border-slate-200">
                      <button onClick={() => setSortValue(v => v + 1)} className="px-2 py-0.5 hover:bg-slate-50 border-b border-slate-200"><Icon name="ChevronUp" size={12} /></button>
                      <button onClick={() => setSortValue(v => Math.max(0, v - 1))} className="px-2 py-0.5 hover:bg-slate-50"><Icon name="ChevronDown" size={12} /></button>
                    </div>
                  </div>
                </div>
              </div>

              {/* 权限字符 - 按钮模式下独立展示 */}
              {menuType === 'button' && (
                <div className="flex items-center">
                  <label className="w-24 text-slate-600 text-sm text-right pr-4 shrink-0 flex items-center justify-end">
                    <Icon name="HelpCircle" size={14} className="mr-1 text-slate-400" />
                    权限字符
                  </label>
                  <input type="text" placeholder="请输入权限标识" className="flex-1 border border-slate-200 rounded-md py-2 px-3 text-sm focus:outline-none focus:border-blue-400" />
                </div>
              )}

              {/* 仅目录和菜单模式可见的字段 */}
              {menuType !== 'button' && (
                <>
                  <div className="grid grid-cols-2 gap-6">
                    <div className="flex items-center">
                      <label className="w-24 text-slate-600 text-sm text-right pr-4 shrink-0 flex items-center justify-end"><Icon name="HelpCircle" size={14} className="mr-1 text-slate-400" />是否外链</label>
                      <div className="flex items-center space-x-4">
                        <label className="flex items-center space-x-2 cursor-pointer"><input type="radio" name="isLink" className="accent-blue-500" /> <span className="text-sm text-slate-600">是</span></label>
                        <label className="flex items-center space-x-2 cursor-pointer"><input type="radio" name="isLink" checked className="accent-blue-500" /> <span className="text-sm text-slate-600">否</span></label>
                      </div>
                    </div>
                    <div className="flex items-center">
                      <label className="w-24 text-slate-600 text-sm text-right pr-4 shrink-0 flex items-center justify-end"><span className="text-red-500 mr-1">*</span><Icon name="HelpCircle" size={14} className="mr-1 text-slate-400" />路由地址</label>
                      <input type="text" placeholder="请输入路由地址" className="flex-1 border border-slate-200 rounded-md py-2 px-3 text-sm focus:outline-none focus:border-blue-400" />
                    </div>
                  </div>

                  {menuType === 'menu' && (
                    <>
                      <div className="grid grid-cols-2 gap-6">
                        <div className="flex items-center">
                          <label className="w-24 text-slate-600 text-sm text-right pr-4 shrink-0 flex items-center justify-end"><Icon name="HelpCircle" size={14} className="mr-1 text-slate-400" />组件路径</label>
                          <input type="text" placeholder="请输入组件路径" className="flex-1 border border-slate-200 rounded-md py-2 px-3 text-sm focus:outline-none focus:border-blue-400" />
                        </div>
                        <div className="flex items-center">
                          <label className="w-24 text-slate-600 text-sm text-right pr-4 shrink-0 flex items-center justify-end"><Icon name="HelpCircle" size={14} className="mr-1 text-slate-400" />权限字符</label>
                          <input type="text" placeholder="请输入权限标识" className="flex-1 border border-slate-200 rounded-md py-2 px-3 text-sm focus:outline-none focus:border-blue-400" />
                        </div>
                      </div>
                      <div className="grid grid-cols-2 gap-6">
                        <div className="flex items-center">
                          <label className="w-24 text-slate-600 text-sm text-right pr-4 shrink-0 flex items-center justify-end"><Icon name="HelpCircle" size={14} className="mr-1 text-slate-400" />路由参数</label>
                          <input type="text" placeholder="请输入路由参数" className="flex-1 border border-slate-200 rounded-md py-2 px-3 text-sm focus:outline-none focus:border-blue-400" />
                        </div>
                        <div className="flex items-center">
                          <label className="w-24 text-slate-600 text-sm text-right pr-4 shrink-0 flex items-center justify-end"><Icon name="HelpCircle" size={14} className="mr-1 text-slate-400" />是否缓存</label>
                          <div className="flex items-center space-x-4">
                            <label className="flex items-center space-x-2 cursor-pointer"><input type="radio" name="cache" checked className="accent-blue-500" /> <span className="text-sm text-slate-600">缓存</span></label>
                            <label className="flex items-center space-x-2 cursor-pointer"><input type="radio" name="cache" className="accent-blue-500" /> <span className="text-sm text-slate-600">不缓存</span></label>
                          </div>
                        </div>
                      </div>
                    </>
                  )}

                  <div className="grid grid-cols-2 gap-6">
                    <div className="flex items-center">
                      <label className="w-24 text-slate-600 text-sm text-right pr-4 shrink-0 flex items-center justify-end"><Icon name="HelpCircle" size={14} className="mr-1 text-slate-400" />显示状态</label>
                      <div className="flex items-center space-x-4">
                        <label className="flex items-center space-x-2 cursor-pointer"><input type="radio" name="visible" checked className="accent-blue-500" /> <span className="text-sm text-slate-600">显示</span></label>
                        <label className="flex items-center space-x-2 cursor-pointer"><input type="radio" name="visible" className="accent-blue-500" /> <span className="text-sm text-slate-600">隐藏</span></label>
                      </div>
                    </div>
                    <div className="flex items-center">
                      <label className="w-24 text-slate-600 text-sm text-right pr-4 shrink-0 flex items-center justify-end"><Icon name="HelpCircle" size={14} className="mr-1 text-slate-400" />菜单状态</label>
                      <div className="flex items-center space-x-4">
                        <label className="flex items-center space-x-2 cursor-pointer"><input type="radio" name="mstatus" checked className="accent-blue-500" /> <span className="text-sm text-slate-600">正常</span></label>
                        <label className="flex items-center space-x-2 cursor-pointer"><input type="radio" name="mstatus" className="accent-blue-500" /> <span className="text-sm text-slate-600">停用</span></label>
                      </div>
                    </div>
                  </div>
                </>
              )}
            </div>

            <div className="px-6 py-4 border-t border-slate-50 flex items-center justify-end space-x-3">
              <button onClick={() => setIsAddModalOpen(false)} className="px-6 py-2 border border-slate-200 rounded text-sm text-slate-600 hover:bg-slate-50">取消</button>
              <button onClick={() => setIsAddModalOpen(false)} className="px-6 py-2 bg-blue-500 text-white rounded text-sm hover:bg-blue-600 shadow-sm font-medium">确定</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default MenuManagementView;
