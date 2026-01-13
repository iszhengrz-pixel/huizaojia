
import React, { useState, useRef } from 'react';
import Icon from './Icon';

interface User {
  id: string;
  username: string;
  nickname: string;
  role: string;
  gender: string;
  avatar: string | 'black' | 'placeholder' | null;
}

const MOCK_USERS: User[] = [
  { id: '1', username: 'admin', nickname: '管理员', role: '管理员,测试1', gender: '男', avatar: 'black' },
  { id: '2', username: 'test', nickname: '测试1', role: '测试2', gender: '男', avatar: 'placeholder' },
  { id: '3', username: 'test1', nickname: '测试1', role: '普通用户', gender: '男', avatar: 'placeholder' },
];

const ROLES = ['管理员', '测试1', '测试2', '普通用户', '访客'];

const UserManagementView: React.FC = () => {
  const [searchTerm, setSearchTerm] = useState('');
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleEdit = (user: User) => {
    setCurrentUser({ ...user });
    setIsEditModalOpen(true);
  };

  const handleCloseModal = () => {
    setIsEditModalOpen(false);
    setCurrentUser(null);
  };

  const handleAvatarClick = () => {
    fileInputRef.current?.click();
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file && currentUser) {
      const reader = new FileReader();
      reader.onloadend = () => {
        setCurrentUser({ ...currentUser, avatar: reader.result as string });
      };
      reader.readAsDataURL(file);
    }
  };

  return (
    <div className="flex-1 flex flex-col h-full bg-white overflow-hidden p-6 relative">
      {/* 搜索与新增区域 */}
      <div className="flex items-center space-x-4 mb-8">
        <div className="flex items-center space-x-2">
          <label className="text-sm font-medium text-slate-700 whitespace-nowrap">用户名</label>
          <input
            type="text"
            placeholder="请输入用户名"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="border border-slate-200 rounded-md py-1.5 px-3 text-sm focus:outline-none focus:border-blue-400 min-w-[200px]"
          />
        </div>
        <button className="flex items-center space-x-1 bg-blue-500 hover:bg-blue-600 text-white px-4 py-1.5 rounded-md text-sm transition-colors">
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
                <th className="px-6 py-3 text-sm font-bold text-slate-700">用户名</th>
                <th className="px-6 py-3 text-sm font-bold text-slate-700">昵称</th>
                <th className="px-6 py-3 text-sm font-bold text-slate-700">角色</th>
                <th className="px-6 py-3 text-sm font-bold text-slate-700">性别</th>
                <th className="px-6 py-3 text-sm font-bold text-slate-700">头像</th>
                <th className="px-6 py-3 text-sm font-bold text-slate-700">操作</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-50">
              {MOCK_USERS.map((user) => (
                <tr key={user.id} className="hover:bg-slate-50/50 transition-colors group">
                  <td className="px-6 py-4 text-sm text-slate-600">{user.username}</td>
                  <td className="px-6 py-4 text-sm text-slate-600">{user.nickname}</td>
                  <td className="px-6 py-4 text-sm text-slate-600">{user.role}</td>
                  <td className="px-6 py-4 text-sm text-slate-600">{user.gender}</td>
                  <td className="px-6 py-4">
                    {user.avatar === 'black' ? (
                      <div className="w-10 h-10 bg-black rounded-full shadow-sm"></div>
                    ) : (user.avatar === 'placeholder' || !user.avatar) ? (
                      <div className="w-10 h-10 bg-slate-100 rounded-full border border-slate-200 flex items-center justify-center text-slate-400">
                         <Icon name="Image" size={18} />
                      </div>
                    ) : (
                      <img src={user.avatar} alt="avatar" className="w-10 h-10 rounded-full object-cover border border-slate-100" />
                    )}
                  </td>
                  <td className="px-6 py-4">
                    <div className="flex items-center space-x-4">
                      <button 
                        onClick={() => handleEdit(user)}
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

        {/* 分页区域 */}
        <div className="px-6 py-4 bg-white border-t border-slate-100 flex items-center justify-end space-x-4 text-sm text-slate-500">
          <span>共 0 条</span>
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

      {/* 修改弹窗 */}
      {isEditModalOpen && currentUser && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/45 backdrop-blur-sm p-4 animate-in fade-in duration-200">
          <div className="bg-white rounded-lg shadow-2xl w-full max-w-[500px] overflow-hidden flex flex-col animate-in zoom-in-95 duration-200">
            {/* 弹窗头部 */}
            <div className="px-6 py-4 border-b border-slate-100 flex items-center justify-between">
              <h3 className="text-lg font-medium text-slate-700">修改</h3>
              <button 
                onClick={handleCloseModal}
                className="text-slate-400 hover:text-slate-600 transition-colors"
              >
                <Icon name="X" size={20} />
              </button>
            </div>

            {/* 弹窗主体 */}
            <div className="flex-1 overflow-y-auto p-8 flex flex-col items-center">
              {/* 头像更换 */}
              <div 
                className="mb-8 group relative cursor-pointer"
                onClick={handleAvatarClick}
              >
                <input 
                  type="file" 
                  ref={fileInputRef} 
                  className="hidden" 
                  accept="image/*"
                  onChange={handleFileChange}
                />
                <div className="w-24 h-24 bg-black rounded-[28px] overflow-hidden flex items-center justify-center transition-transform group-hover:scale-105 active:scale-95 duration-200 shadow-lg">
                  {currentUser.avatar === 'black' ? (
                    <div className="w-full h-full bg-black"></div>
                  ) : (currentUser.avatar === 'placeholder' || !currentUser.avatar) ? (
                    <Icon name="User" size={32} className="text-white/20" />
                  ) : (
                    <img src={currentUser.avatar} alt="avatar" className="w-full h-full object-cover" />
                  )}
                  {/* 悬停遮罩 */}
                  <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex flex-col items-center justify-center rounded-[28px]">
                    <Icon name="Camera" size={20} className="text-white mb-1" />
                    <span className="text-white text-[10px] font-bold">更换头像</span>
                  </div>
                </div>
              </div>

              {/* 表单 */}
              <div className="w-full space-y-6">
                <div className="flex items-center">
                  <label className="w-20 text-slate-500 text-sm text-right pr-4">昵称</label>
                  <input
                    type="text"
                    value={currentUser.nickname}
                    onChange={(e) => setCurrentUser({...currentUser, nickname: e.target.value})}
                    className="flex-1 border border-slate-200 rounded-md py-2 px-3 text-sm focus:outline-none focus:border-blue-400 text-slate-700"
                  />
                </div>

                <div className="flex items-center">
                  <label className="w-20 text-slate-500 text-sm text-right pr-4">
                    <span className="text-red-500 mr-1">*</span>用户名
                  </label>
                  <input
                    type="text"
                    value={currentUser.username}
                    onChange={(e) => setCurrentUser({...currentUser, username: e.target.value})}
                    className="flex-1 border border-slate-200 rounded-md py-2 px-3 text-sm focus:outline-none focus:border-blue-400 text-slate-700"
                  />
                </div>

                <div className="flex items-center">
                  <label className="w-20 text-slate-500 text-sm text-right pr-4">性别</label>
                  <div className="flex-1 relative">
                    <select
                      value={currentUser.gender}
                      onChange={(e) => setCurrentUser({...currentUser, gender: e.target.value})}
                      className="w-full appearance-none border border-slate-200 rounded-md py-2 px-3 text-sm focus:outline-none focus:border-blue-400 text-slate-700 cursor-pointer"
                    >
                      <option value="男">男</option>
                      <option value="女">女</option>
                      <option value="保密">保密</option>
                    </select>
                    <div className="absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none text-slate-400">
                      <Icon name="ChevronDown" size={14} />
                    </div>
                  </div>
                </div>

                <div className="flex items-start pt-1">
                  <label className="w-20 text-slate-500 text-sm text-right pr-4 pt-2">
                    <span className="text-red-500 mr-1">*</span>角色
                  </label>
                  <div className="flex-1 border border-slate-200 rounded-md p-1.5 flex flex-wrap gap-2 items-center min-h-[40px] relative group/select cursor-pointer">
                    {/* 模拟已选中的角色标签 */}
                    <div className="bg-[#e6f7ff] border border-[#91d5ff] rounded px-2 py-0.5 flex items-center text-xs text-[#1890ff] font-medium">
                      管理员
                      <button className="ml-1.5 text-[#1890ff] hover:text-blue-700"><Icon name="X" size={10} /></button>
                    </div>
                    <div className="bg-[#e6f7ff] border border-[#91d5ff] rounded px-2 py-0.5 flex items-center text-xs text-[#1890ff] font-medium">
                      测试1
                      <button className="ml-1.5 text-[#1890ff] hover:text-blue-700"><Icon name="X" size={10} /></button>
                    </div>
                    
                    <div className="absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none text-slate-400">
                      <Icon name="ChevronDown" size={14} />
                    </div>

                    {/* 模拟下拉选项列表 (仅展示样式) */}
                    <div className="hidden group-hover/select:block absolute top-full left-0 right-0 mt-1 bg-white border border-slate-200 rounded-md shadow-lg z-[60] py-1">
                      {ROLES.map(role => (
                        <div key={role} className="px-4 py-2 text-sm text-slate-600 hover:bg-blue-50 transition-colors">
                          {role}
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* 弹窗底部 */}
            <div className="px-6 py-4 border-t border-slate-50 flex items-center justify-end space-x-3">
              <button 
                onClick={handleCloseModal}
                className="px-5 py-2 border border-slate-200 rounded text-sm text-slate-600 hover:bg-slate-50 transition-colors"
              >
                取消
              </button>
              <button 
                onClick={() => {
                  alert('保存成功');
                  handleCloseModal();
                }}
                className="px-5 py-2 bg-blue-500 text-white rounded text-sm hover:bg-blue-600 shadow-sm transition-colors"
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

export default UserManagementView;
