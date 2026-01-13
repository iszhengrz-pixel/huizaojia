
import React, { useState, useRef } from 'react';
import Icon from './Icon';

type TabType = 'info' | 'password';

const ProfileView: React.FC = () => {
  const [activeTab, setActiveTab] = useState<TabType>('info');
  const fileInputRef = useRef<HTMLInputElement>(null);
  
  // 个人信息状态
  const [nickname, setNickname] = useState('管理员');
  const [phone, setPhone] = useState('18888888888');
  const [gender, setGender] = useState('男');
  const [avatar, setAvatar] = useState<string | null>(null);

  // 密码修改状态
  const [oldPassword, setOldPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');

  const handleUpdate = () => {
    // 模拟更新逻辑
    const btnId = activeTab === 'info' ? 'update-info-btn' : 'update-pwd-btn';
    const btn = document.getElementById(btnId);
    if (btn) {
      const originalText = btn.innerText;
      btn.innerText = '正在处理...';
      setTimeout(() => {
        btn.innerText = '操作成功';
        setTimeout(() => btn.innerText = originalText, 2000);
      }, 1000);
    }
  };

  const handleAvatarClick = () => {
    fileInputRef.current?.click();
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        setAvatar(reader.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  return (
    <div className="flex-1 flex flex-col h-full bg-white overflow-hidden">
      {/* 隐藏的文件上传控件 */}
      <input 
        type="file" 
        ref={fileInputRef} 
        className="hidden" 
        accept="image/*"
        onChange={handleFileChange}
      />

      {/* 顶部 Tab 切换 */}
      <div className="bg-white border-b border-slate-100 shrink-0 px-8">
        <div className="flex space-x-12">
          <button
            onClick={() => setActiveTab('info')}
            className={`py-4 text-sm font-medium transition-all relative ${
              activeTab === 'info' ? 'text-blue-500' : 'text-slate-800 hover:text-blue-500'
            }`}
          >
            个人信息
            {activeTab === 'info' && (
              <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-blue-500"></div>
            )}
          </button>
          <button
            onClick={() => setActiveTab('password')}
            className={`py-4 text-sm font-medium transition-all relative ${
              activeTab === 'password' ? 'text-blue-500' : 'text-slate-800 hover:text-blue-500'
            }`}
          >
            修改密码
            {activeTab === 'password' && (
              <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-blue-500"></div>
            )}
          </button>
        </div>
      </div>

      <div className="flex-1 overflow-y-auto p-8 flex flex-col items-center pt-16">
        <div className="w-full max-w-4xl flex flex-col items-center">
          
          {activeTab === 'info' ? (
            <div className="w-full flex flex-col items-center animate-in fade-in slide-in-from-bottom-2 duration-300">
              {/* 头像区域：黑色圆角矩形，点击更换 */}
              <div className="mb-12 group relative cursor-pointer" onClick={handleAvatarClick}>
                <div className="w-24 h-24 bg-black rounded-[24px] shadow-sm overflow-hidden flex items-center justify-center transition-transform hover:scale-105 active:scale-95 duration-200">
                  {avatar ? (
                    <img src={avatar} alt="Avatar" className="w-full h-full object-cover" />
                  ) : (
                    <Icon name="User" size={32} className="text-white opacity-20" />
                  )}
                  
                  {/* 悬停遮罩层 */}
                  <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex flex-col items-center justify-center rounded-[24px]">
                    <Icon name="Camera" size={24} className="text-white mb-1" />
                    <span className="text-white text-[10px] font-bold">更换头像</span>
                  </div>
                </div>
                {/* 装饰性的小图标 */}
                <div className="absolute -bottom-1 -right-1 w-6 h-6 bg-blue-500 rounded-lg border-2 border-white flex items-center justify-center text-white shadow-sm">
                  <Icon name="Plus" size={14} />
                </div>
              </div>

              {/* 表单区域 */}
              <div className="w-full max-w-xl space-y-6">
                <div className="flex items-center">
                  <label className="w-16 text-slate-500 text-sm shrink-0">昵称</label>
                  <input
                    type="text"
                    value={nickname}
                    onChange={(e) => setNickname(e.target.value)}
                    className="flex-1 bg-white border border-slate-200 rounded-md py-2 px-4 focus:outline-none focus:border-blue-400 text-slate-700 text-sm"
                  />
                </div>

                <div className="flex items-center">
                  <label className="w-16 text-slate-500 text-sm shrink-0">用户名</label>
                  <input
                    type="text"
                    value="admin"
                    disabled
                    className="flex-1 bg-slate-50 border border-slate-100 rounded-md py-2 px-4 text-slate-300 text-sm cursor-not-allowed"
                  />
                </div>

                <div className="flex items-center">
                  <label className="w-16 text-slate-500 text-sm shrink-0">手机号</label>
                  <input
                    type="text"
                    value={phone}
                    onChange={(e) => setPhone(e.target.value)}
                    className="flex-1 bg-white border border-slate-200 rounded-md py-2 px-4 focus:outline-none focus:border-blue-400 text-slate-700 text-sm"
                  />
                </div>

                <div className="flex items-center">
                  <label className="w-16 text-slate-500 text-sm shrink-0">性别</label>
                  <div className="flex-1 relative">
                    <select
                      value={gender}
                      onChange={(e) => setGender(e.target.value)}
                      className="w-full appearance-none bg-white border border-slate-200 rounded-md py-2 px-4 focus:outline-none focus:border-blue-400 text-slate-700 text-sm cursor-pointer"
                    >
                      <option value="男">男</option>
                      <option value="女">女</option>
                      <option value="保密">保密</option>
                    </select>
                    <div className="absolute right-4 top-1/2 -translate-y-1/2 pointer-events-none text-slate-400">
                      <Icon name="ChevronDown" size={14} />
                    </div>
                  </div>
                </div>
              </div>

              <button
                id="update-info-btn"
                onClick={handleUpdate}
                className="mt-12 px-10 bg-[#4dabf7] hover:bg-blue-500 text-white font-medium py-2 rounded-md shadow-sm transition-all active:scale-95 transform"
              >
                更新
              </button>
            </div>
          ) : (
            <div className="w-full flex flex-col items-center animate-in fade-in slide-in-from-bottom-2 duration-300">
              {/* 大字标题 */}
              <h2 className="text-4xl font-semibold text-blue-400 mb-12 tracking-tight">修改密码</h2>

              <div className="w-full max-w-xl space-y-6">
                <div className="flex items-center">
                  <label className="w-20 text-slate-500 text-sm shrink-0">旧密码</label>
                  <input
                    type="password"
                    value={oldPassword}
                    onChange={(e) => setOldPassword(e.target.value)}
                    className="flex-1 bg-white border border-slate-200 rounded-md py-2 px-4 focus:outline-none focus:border-blue-400 text-slate-700 text-sm"
                  />
                </div>

                <div className="flex items-center">
                  <label className="w-20 text-slate-500 text-sm shrink-0">新密码</label>
                  <input
                    type="password"
                    value={newPassword}
                    onChange={(e) => setNewPassword(e.target.value)}
                    className="flex-1 bg-white border border-slate-200 rounded-md py-2 px-4 focus:outline-none focus:border-blue-400 text-slate-700 text-sm"
                  />
                </div>

                <div className="flex items-center">
                  <label className="w-20 text-slate-500 text-sm shrink-0">确认密码</label>
                  <input
                    type="password"
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    className="flex-1 bg-white border border-slate-200 rounded-md py-2 px-4 focus:outline-none focus:border-blue-400 text-slate-700 text-sm"
                  />
                </div>
              </div>

              <button
                id="update-pwd-btn"
                onClick={handleUpdate}
                className="mt-12 px-10 bg-[#4dabf7] hover:bg-blue-500 text-white font-medium py-2 rounded-md shadow-sm transition-all active:scale-95 transform"
              >
                修改密码
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default ProfileView;
