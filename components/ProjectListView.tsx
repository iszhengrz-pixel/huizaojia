import React, { useState } from 'react';
import Icon from './Icon';
import ProjectDetailView from './ProjectDetailView';

interface ProjectRecord {
  id: string;
  name: string;
  contractPrice: number;
  creator: string;
  createTime: string;
}

const MOCK_PROJECTS: ProjectRecord[] = [
  { id: '1', name: '项目一：建筑工程清单', contractPrice: 1000000, creator: '张三', createTime: '2024-01-15 10:30:00' },
  { id: '2', name: '项目二：市政工程清单', contractPrice: 2500000, creator: '李四', createTime: '2024-01-16 14:20:00' },
  { id: '3', name: '项目三：园林工程清单', contractPrice: 800000, creator: '王五', createTime: '2024-01-17 09:15:00' },
  { id: '4', name: '项目四：装修工程清单', contractPrice: 500000, creator: '张三', createTime: '2024-01-18 11:20:00' },
  { id: '5', name: '项目五：安装工程清单', contractPrice: 1200000, creator: '李四', createTime: '2024-01-19 15:45:00' },
  { id: '6', name: '项目六：钢结构工程清单', contractPrice: 1800000, creator: '王五', createTime: '2024-01-20 16:30:00' },
  { id: '7', name: '项目七：土建工程清单', contractPrice: 3000000, creator: '张三', createTime: '2024-01-21 09:10:00' },
  { id: '8', name: '项目八：给排水工程清单', contractPrice: 900000, creator: '李四', createTime: '2024-01-22 10:00:00' },
];

const ProjectListView: React.FC = () => {
  const [searchTerm, setSearchTerm] = useState('');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [modalMode, setModalMode] = useState<'add' | 'edit'>('add');
  
  // 用于追踪当前查看详情的项目
  const [selectedProject, setSelectedProject] = useState<ProjectRecord | null>(null);
  
  // 弹窗表单状态
  const [projectForm, setProjectForm] = useState({
    id: '',
    name: '',
    price: ''
  });

  const handleOpenAddModal = () => {
    setModalMode('add');
    setProjectForm({ id: '', name: '', price: '' });
    setIsModalOpen(true);
  };

  const handleOpenEditModal = (project: ProjectRecord) => {
    setModalMode('edit');
    setProjectForm({ 
      id: project.id, 
      name: project.name, 
      price: project.contractPrice.toString() 
    });
    setIsModalOpen(true);
  };

  const handleCloseModal = () => {
    setIsModalOpen(false);
  };

  const handleSubmit = () => {
    if (!projectForm.name.trim() || !projectForm.price) {
      alert('请填写完整项目信息');
      return;
    }
    alert(modalMode === 'add' ? '项目创建成功' : '项目修改成功');
    setIsModalOpen(false);
  };

  // 如果有选中的项目，则渲染详情页
  if (selectedProject) {
    return (
      <ProjectDetailView 
        projectName={selectedProject.name} 
        onBack={() => setSelectedProject(null)} 
      />
    );
  }

  return (
    <div className="flex-1 flex flex-col h-full bg-white overflow-hidden p-8 animate-in fade-in duration-500">
      {/* 顶部标题与新增按钮 */}
      <div className="flex items-center justify-between mb-10">
        <div className="flex flex-col space-y-1">
          <h1 className="text-2xl font-black text-slate-800 tracking-tight">
            项目列表
          </h1>
          <p className="text-sm text-slate-400 font-medium">管理并追踪所有清单工程量超额调差对比任务</p>
        </div>
        <button 
          onClick={handleOpenAddModal}
          className="px-8 py-3 bg-blue-600 text-white rounded-2xl font-black text-sm shadow-xl shadow-blue-500/20 hover:bg-blue-700 transition-all active:scale-95 flex items-center space-x-2"
        >
          <Icon name="Plus" size={18} strokeWidth={3} />
          <span>新增项目</span>
        </button>
      </div>

      {/* 搜索筛选区 */}
      <div className="flex items-center justify-between mb-8 px-2">
        <div className="flex items-center space-x-8">
          <div className="flex items-center space-x-4">
            <label className="text-sm font-black text-slate-500 whitespace-nowrap uppercase tracking-widest">项目名称</label>
            <div className="relative group">
              <div className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-300 group-focus-within:text-blue-500 transition-colors">
                <Icon name="Search" size={16} />
              </div>
              <input 
                type="text" 
                placeholder="搜索项目名称、编号..." 
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-96 h-11 bg-white border border-slate-200 rounded-xl pl-10 pr-4 text-sm font-bold text-slate-700 focus:border-blue-400 focus:ring-4 focus:ring-blue-500/5 outline-none transition-all"
              />
            </div>
          </div>
          <div className="flex items-center space-x-3">
            <button className="px-8 h-11 bg-blue-600 text-white rounded-xl text-sm font-black shadow-lg shadow-blue-500/10 hover:bg-blue-700 transition-all active:scale-95">
              搜索
            </button>
            <button 
              onClick={() => setSearchTerm('')}
              className="px-8 h-11 bg-white border border-slate-200 text-slate-500 rounded-xl text-sm font-black hover:bg-slate-50 transition-all active:scale-95"
            >
              重置
            </button>
          </div>
        </div>
      </div>

      {/* 数据表格区 */}
      <div className="flex-1 border border-slate-100 rounded-[32px] overflow-hidden flex flex-col shadow-sm bg-white">
        <div className="overflow-x-auto flex-1 custom-scrollbar">
          <table className="w-full border-collapse text-left">
            <thead className="sticky top-0 z-10 bg-slate-50/80 backdrop-blur-md">
              <tr className="border-b border-slate-100">
                <th className="px-8 py-5 text-[11px] font-black text-slate-400 uppercase tracking-widest text-center w-20">序号</th>
                <th className="px-6 py-5 text-[11px] font-black text-slate-400 uppercase tracking-widest">项目名称</th>
                <th className="px-6 py-5 text-[11px] font-black text-slate-400 uppercase tracking-widest text-center">合同价 (元)</th>
                <th className="px-6 py-5 text-[11px] font-black text-slate-400 uppercase tracking-widest text-center">创建人</th>
                <th className="px-6 py-5 text-[11px] font-black text-slate-400 uppercase tracking-widest text-center">创建时间</th>
                <th className="px-8 py-5 text-[11px] font-black text-slate-400 uppercase tracking-widest text-center w-72">操作面板</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-50">
              {MOCK_PROJECTS.map((project, index) => (
                <tr key={project.id} className="hover:bg-blue-50/20 transition-all duration-300 group">
                  <td className="px-8 py-6 text-sm text-slate-400 text-center font-bold">{index + 1}</td>
                  <td className="px-6 py-6">
                    <button className="text-slate-800 font-black text-sm hover:text-blue-600 transition-colors truncate max-w-md text-left outline-none">
                      <span>{project.name}</span>
                    </button>
                  </td>
                  <td className="px-6 py-6 text-sm text-slate-600 text-center font-black">
                    {project.contractPrice.toLocaleString()}
                  </td>
                  <td className="px-6 py-6 text-sm text-slate-600 text-center font-medium">
                    <span>{project.creator}</span>
                  </td>
                  <td className="px-6 py-6 text-xs text-slate-400 text-center font-bold">{project.createTime}</td>
                  <td className="px-8 py-6">
                    <div className="flex items-center justify-center space-x-2.5">
                      <button 
                        onClick={() => setSelectedProject(project)}
                        className="px-4 py-2 bg-blue-600 text-white rounded-xl text-xs font-black shadow-md shadow-blue-500/10 hover:bg-blue-700 transition-all active:scale-95"
                      >
                        查看详情
                      </button>
                      <button 
                        onClick={() => handleOpenEditModal(project)}
                        className="px-4 py-2 bg-white border border-slate-200 text-slate-600 rounded-xl text-xs font-black shadow-sm hover:border-blue-300 hover:text-blue-600 transition-all active:scale-95"
                      >
                        编辑
                      </button>
                      <button className="p-2 bg-white border border-slate-200 text-slate-300 rounded-xl hover:border-rose-200 hover:text-rose-500 transition-all active:scale-95 shadow-sm">
                        <Icon name="Trash2" size={16} />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        
        {/* 分页 */}
        <div className="px-8 py-4 bg-slate-50/50 border-t border-slate-100 flex items-center justify-between">
           <p className="text-[11px] font-bold text-slate-400">共计显示 {MOCK_PROJECTS.length} 条数据</p>
           <div className="flex items-center space-x-2">
             <button className="w-8 h-8 rounded-lg border border-slate-200 flex items-center justify-center text-slate-400 hover:bg-white transition-all"><Icon name="ChevronLeft" size={14} /></button>
             <button className="w-8 h-8 rounded-lg bg-blue-600 text-white flex items-center justify-center text-xs font-black shadow-lg shadow-blue-500/20">1</button>
             <button className="w-8 h-8 rounded-lg border border-slate-200 flex items-center justify-center text-slate-400 hover:bg-white transition-all"><Icon name="ChevronRight" size={14} /></button>
           </div>
        </div>
      </div>

      {/* 项目弹窗 (新增/修改) */}
      {isModalOpen && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/45 backdrop-blur-sm p-4 animate-in fade-in duration-200">
          <div className="bg-white rounded-[24px] shadow-2xl w-full max-w-[580px] flex flex-col animate-in zoom-in-95 duration-200 overflow-hidden border border-slate-100">
            {/* 弹窗头部 */}
            <div className="px-8 py-6 border-b border-slate-50 flex items-center justify-between bg-white shrink-0">
               <h3 className="text-xl font-bold text-slate-800">{modalMode === 'add' ? '新增项目' : '修改项目'}</h3>
               <button 
                onClick={handleCloseModal}
                className="w-8 h-8 flex items-center justify-center text-slate-300 hover:text-rose-500 hover:bg-rose-50 rounded-full transition-all outline-none"
               >
                 <Icon name="X" size={20} />
               </button>
            </div>

            {/* 弹窗内容区 */}
            <div className="p-10 space-y-8">
               {/* 项目名称 */}
               <div className="space-y-3">
                 <div className="flex items-center justify-between">
                   <label className="text-sm font-bold text-slate-600 flex items-center">
                     <span className="text-rose-500 mr-1">*</span>项目名称
                   </label>
                 </div>
                 <div className="relative group">
                   <input 
                    type="text" 
                    maxLength={100}
                    value={projectForm.name}
                    onChange={(e) => setProjectForm({...projectForm, name: e.target.value})}
                    placeholder="请输入项目名称"
                    className="w-full h-11 bg-white border border-slate-200 rounded-xl px-4 pr-20 text-sm font-medium text-slate-700 focus:border-blue-400 focus:ring-4 focus:ring-blue-500/5 outline-none transition-all"
                   />
                   <div className="absolute right-4 top-1/2 -translate-y-1/2 text-[11px] font-bold text-slate-300 tracking-wider">
                     {projectForm.name.length} / 100
                   </div>
                 </div>
               </div>

               {/* 合同价 */}
               <div className="space-y-3">
                 <label className="text-sm font-bold text-slate-600 flex items-center">
                   <span className="text-rose-500 mr-1">*</span>合同价(元)
                 </label>
                 <div className="flex items-center">
                   <input 
                    type="number" 
                    value={projectForm.price}
                    onChange={(e) => setProjectForm({...projectForm, price: e.target.value})}
                    placeholder="请输入合同价"
                    className="flex-1 h-11 bg-white border border-slate-200 rounded-l-xl px-4 text-sm font-medium text-slate-700 focus:border-blue-400 focus:ring-4 focus:ring-blue-500/5 outline-none transition-all"
                   />
                   <div className="h-11 px-5 bg-slate-50 border border-l-0 border-slate-200 rounded-r-xl flex items-center justify-center text-xs font-black text-slate-400 select-none">
                     元
                   </div>
                 </div>
               </div>
            </div>

            {/* 弹窗底部操作 */}
            <div className="px-8 py-6 bg-slate-50/50 border-t border-slate-100 flex items-center justify-end space-x-4 shrink-0">
               <button 
                onClick={handleCloseModal}
                className="px-8 py-2.5 bg-white border border-slate-200 text-slate-600 rounded-xl text-sm font-bold hover:bg-slate-50 transition-all outline-none"
               >
                 取消
               </button>
               <button 
                onClick={handleSubmit}
                className="px-10 py-2.5 bg-blue-600 text-white rounded-xl text-sm font-black shadow-xl shadow-blue-500/20 hover:bg-blue-700 transition-all active:scale-95 outline-none"
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

export default ProjectListView;
