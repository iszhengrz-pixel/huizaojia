
import React, { useState, useMemo } from 'react';
import Icon from './Icon';

interface Role {
  id: string;
  name: string;
  code: string;
  createTime: string;
}

interface PermissionNode {
  id: string;
  label: string;
  children?: PermissionNode[];
}

const MOCK_ROLES: Role[] = [
  { id: '1', name: '管理员', code: 'admin', createTime: '2024-05-20 10:00:00' },
  { id: '2', name: '测试', code: 'test', createTime: '2024-05-20 11:30:00' },
];

const PERMISSION_DATA: PermissionNode[] = [
  { id: 'profile', label: '个人中心' },
  { 
    id: 'system', 
    label: '系统管理',
    children: [
      { 
        id: 'user-mgt', 
        label: '用户管理',
        children: [
          { id: 'user-edit', label: '修改权限' },
          { id: 'user-add', label: '新增权限' },
          { id: 'user-delete', label: '删除权限' }
        ]
      },
      { id: 'role-mgt', label: '角色管理' },
      { id: 'menu-mgt', label: '菜单管理' }
    ]
  },
  { 
    id: 'app-mgt', 
    label: '应用管理',
    children: [
      { id: 'app-list', label: '应用列表' },
      { id: 'app-audit', label: '审批流配置' }
    ]
  },
];

const RoleManagementView: React.FC = () => {
  const [roleName, setRoleName] = useState('');
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [currentRole, setCurrentRole] = useState<Role | null>(null);

  // 树状态管理
  const [expandedIds, setExpandedIds] = useState<Set<string>>(new Set(['system', 'user-mgt']));
  const [checkedIds, setCheckedIds] = useState<Set<string>>(new Set(['profile', 'role-mgt', 'menu-mgt']));

  // 递归获取所有子节点ID
  const getAllChildIds = (node: PermissionNode): string[] => {
    let ids = [node.id];
    if (node.children) {
      node.children.forEach(child => {
        ids = [...ids, ...getAllChildIds(child)];
      });
    }
    return ids;
  };

  // 递归检查节点状态：'checked' | 'unchecked' | 'indeterminate'
  const getNodeState = (node: PermissionNode): 'checked' | 'unchecked' | 'indeterminate' => {
    if (!node.children || node.children.length === 0) {
      return checkedIds.has(node.id) ? 'checked' : 'unchecked';
    }

    const childStates = node.children.map(child => getNodeState(child));
    const allChecked = childStates.every(s => s === 'checked');
    const allUnchecked = childStates.every(s => s === 'unchecked');

    if (allChecked) return 'checked';
    if (allUnchecked) return checkedIds.has(node.id) ? 'indeterminate' : 'unchecked';
    return 'indeterminate';
  };

  const toggleExpand = (id: string) => {
    const newExpanded = new Set(expandedIds);
    if (newExpanded.has(id)) {
      newExpanded.delete(id);
    } else {
      newExpanded.add(id);
    }
    setExpandedIds(newExpanded);
  };

  const handleCheck = (node: PermissionNode) => {
    const currentState = getNodeState(node);
    const newChecked = new Set(checkedIds);
    const allIds = getAllChildIds(node);

    if (currentState === 'checked') {
      // 当前是全选，则取消全选
      allIds.forEach(id => newChecked.delete(id));
    } else {
      // 当前是未选或半选，则改为全选
      allIds.forEach(id => newChecked.add(id));
    }
    setCheckedIds(newChecked);
  };

  const handleEdit = (role: Role) => {
    setCurrentRole({ ...role });
    setIsEditModalOpen(true);
  };

  const handleCloseModal = () => {
    setIsEditModalOpen(false);
    setCurrentRole(null);
  };

  // 递归渲染树节点
  const renderTreeNode = (node: PermissionNode, level: number = 0) => {
    const isExpanded = expandedIds.has(node.id);
    const hasChildren = node.children && node.children.length > 0;
    const state = getNodeState(node);

    return (
      <div key={node.id} className="select-none">
        <div 
          className={`flex items-center py-1.5 px-2 rounded-md transition-colors group ${level === 0 ? 'mt-1' : ''} hover:bg-slate-50`}
          style={{ marginLeft: `${level * 24}px` }}
        >
          {/* 展开/收起图标 */}
          <div 
            className={`w-6 h-6 flex items-center justify-center cursor-pointer transition-transform ${hasChildren ? 'visible' : 'invisible'}`}
            onClick={() => toggleExpand(node.id)}
          >
            <Icon 
              name={isExpanded ? 'ChevronDown' : 'ChevronRight'} 
              size={14} 
              className="text-slate-400 group-hover:text-slate-600" 
            />
          </div>

          {/* 自定义复选框 */}
          <div 
            className={`w-4 h-4 rounded flex items-center justify-center cursor-pointer transition-all border shrink-0 ${
              state === 'checked' ? 'bg-blue-500 border-blue-500' : 
              state === 'indeterminate' ? 'bg-blue-500 border-blue-500' : 
              'bg-white border-slate-300 group-hover:border-blue-400'
            }`}
            onClick={() => handleCheck(node)}
          >
            {state === 'checked' && <Icon name="Check" size={12} className="text-white" strokeWidth={3} />}
            {state === 'indeterminate' && <Icon name="Minus" size={12} className="text-white" strokeWidth={4} />}
          </div>

          {/* 标签文字 */}
          <span 
            className={`ml-3 text-sm cursor-pointer transition-colors ${
              state !== 'unchecked' ? 'text-slate-800 font-medium' : 'text-slate-600'
            }`}
            onClick={() => handleCheck(node)}
          >
            {node.label}
          </span>
        </div>

        {/* 子节点递归渲染 */}
        {hasChildren && isExpanded && (
          <div className="animate-in fade-in slide-in-from-top-1 duration-200">
            {node.children!.map(child => renderTreeNode(child, level + 1))}
          </div>
        )}
      </div>
    );
  };

  return (
    <div className="flex-1 flex flex-col h-full bg-white overflow-hidden p-6 relative">
      {/* 搜索区域 */}
      <div className="flex items-center space-x-4 mb-8 shrink-0">
        <div className="flex items-center space-x-2">
          <label className="text-sm font-medium text-slate-700 whitespace-nowrap">角色名称</label>
          <input
            type="text"
            placeholder="请输入角色名称"
            value={roleName}
            onChange={(e) => setRoleName(e.target.value)}
            className="border border-slate-200 rounded-md py-1.5 px-3 text-sm focus:outline-none focus:border-blue-400 min-w-[180px]"
          />
        </div>
        <button className="flex items-center space-x-1 bg-blue-500 hover:bg-blue-600 text-white px-4 py-1.5 rounded-md text-sm transition-colors shadow-sm">
          <Icon name="Search" size={16} />
          <span>搜索</span>
        </button>
        <button className="flex items-center space-x-1 bg-white border border-slate-200 hover:bg-slate-50 text-slate-700 px-4 py-1.5 rounded-md text-sm transition-colors">
          <Icon name="RotateCw" size={16} />
          <span>重置</span>
        </button>
        <button className="flex items-center space-x-1 bg-[#e6f7ff] border border-[#91d5ff] hover:bg-[#bae7ff] text-blue-500 px-4 py-1.5 rounded-md text-sm transition-colors">
          <Icon name="Plus" size={16} />
          <span>新增</span>
        </button>
      </div>

      {/* 表格区域 */}
      <div className="flex-1 border border-slate-100 rounded-md overflow-hidden flex flex-col shadow-sm">
        <div className="overflow-x-auto flex-1">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-[#f2f4f7] border-b border-slate-100">
                <th className="px-6 py-3 text-sm font-bold text-slate-700">角色名称</th>
                <th className="px-6 py-3 text-sm font-bold text-slate-700">角色编码</th>
                <th className="px-6 py-3 text-sm font-bold text-slate-700">创建时间</th>
                <th className="px-6 py-3 text-sm font-bold text-slate-700">操作</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-50">
              {MOCK_ROLES.map((role) => (
                <tr key={role.id} className="hover:bg-slate-50/50 transition-colors group">
                  <td className="px-6 py-4 text-sm text-slate-600">{role.name}</td>
                  <td className="px-6 py-4 text-sm text-slate-600">{role.code}</td>
                  <td className="px-6 py-4 text-sm text-slate-600">{role.createTime}</td>
                  <td className="px-6 py-4">
                    <div className="flex items-center space-x-6">
                      <button 
                        onClick={() => handleEdit(role)}
                        className="flex items-center space-x-1 text-emerald-500 hover:text-emerald-600 transition-colors text-sm font-medium"
                      >
                        <Icon name="FileEdit" size={14} />
                        <span>修改</span>
                      </button>
                      <button className="flex items-center space-x-1 text-rose-400 hover:text-rose-500 transition-colors text-sm font-medium">
                        <Icon name="Trash2" size={14} />
                        <span>删除</span>
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* 分页组件 */}
        <div className="px-6 py-4 bg-white border-t border-slate-100 flex items-center justify-end space-x-4 text-sm text-slate-500">
          <span>共 {MOCK_ROLES.length} 条</span>
          <div className="flex items-center border border-slate-200 rounded px-2 py-1 space-x-2 cursor-pointer hover:bg-slate-50">
            <span>10条/页</span>
            <Icon name="ChevronDown" size={14} />
          </div>
          <div className="flex items-center space-x-1">
            <button className="p-1 text-slate-300 cursor-not-allowed"><Icon name="ChevronLeft" size={18} /></button>
            <button className="w-8 h-8 bg-blue-500 text-white rounded flex items-center justify-center font-medium shadow-sm">1</button>
            <button className="p-1 text-slate-300 cursor-not-allowed"><Icon name="ChevronRight" size={18} /></button>
          </div>
          <div className="flex items-center space-x-2">
            <span>前往</span>
            <input type="text" defaultValue="1" className="w-10 border border-slate-200 rounded text-center py-1 focus:outline-none focus:border-blue-400" />
            <span>页</span>
          </div>
        </div>
      </div>

      {/* 修改角色弹窗 */}
      {isEditModalOpen && currentRole && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/45 backdrop-blur-sm p-4 animate-in fade-in duration-200">
          <div className="bg-white rounded-lg shadow-2xl w-full max-w-[600px] overflow-hidden flex flex-col animate-in zoom-in-95 duration-200">
            {/* 弹窗头部 */}
            <div className="px-6 py-4 border-b border-slate-100 flex items-center justify-between">
              <h3 className="text-lg font-medium text-slate-700">修改角色</h3>
              <button onClick={handleCloseModal} className="text-slate-400 hover:text-slate-600 transition-colors">
                <Icon name="X" size={20} />
              </button>
            </div>

            {/* 弹窗主体 */}
            <div className="flex-1 overflow-y-auto p-8 space-y-6">
              <div className="flex items-center">
                <label className="w-20 text-slate-600 text-sm text-right pr-4 shrink-0"><span className="text-red-500 mr-1">*</span>角色名称</label>
                <input
                  type="text"
                  value={currentRole.name}
                  onChange={(e) => setCurrentRole({...currentRole, name: e.target.value})}
                  className="flex-1 border border-slate-200 rounded-md py-2 px-3 text-sm focus:outline-none focus:border-blue-400"
                />
              </div>
              <div className="flex items-center">
                <label className="w-20 text-slate-600 text-sm text-right pr-4 shrink-0"><span className="text-red-500 mr-1">*</span>权限字符</label>
                <input
                  type="text"
                  value={currentRole.code}
                  onChange={(e) => setCurrentRole({...currentRole, code: e.target.value})}
                  className="flex-1 border border-slate-200 rounded-md py-2 px-3 text-sm focus:outline-none focus:border-blue-400"
                />
              </div>

              {/* 菜单权限树 */}
              <div className="flex items-start">
                <label className="w-20 text-slate-600 text-sm text-right pr-4 pt-2 shrink-0">菜单权限</label>
                <div className="flex-1 bg-white border border-slate-200 rounded-md p-4 min-h-[300px] max-h-[400px] overflow-y-auto shadow-inner">
                  {PERMISSION_DATA.map(node => renderTreeNode(node))}
                </div>
              </div>
            </div>

            {/* 弹窗底部 */}
            <div className="px-6 py-4 border-t border-slate-50 flex items-center justify-end space-x-3">
              <button 
                onClick={handleCloseModal}
                className="px-6 py-2 border border-slate-200 rounded text-sm text-slate-600 hover:bg-slate-50 transition-colors"
              >
                取消
              </button>
              <button 
                onClick={() => {
                  alert('角色权限更新成功');
                  handleCloseModal();
                }}
                className="px-6 py-2 bg-blue-500 text-white rounded text-sm hover:bg-blue-600 shadow-sm transition-colors font-medium"
              >
                确定
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default RoleManagementView;
