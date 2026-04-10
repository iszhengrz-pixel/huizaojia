import React, { useState } from 'react';
import Icon from './Icon';
import NewRebiddingProjectView from './NewRebiddingProjectView';

interface FileItem {
  id: string;
  name: string;
  size: string;
  uploadTime: string;
}

interface ProjectRecord {
  id: string;
  name: string;
  fileCount: number;
  round: '一轮回标' | '二轮回标' | '三轮回标' | '四轮回标';
  createTime: string;
  files: FileItem[];
}

const MOCK_FILES: FileItem[] = [
  { id: 'f1', name: '投标报价清单-一标段.xlsx', size: '2.4MB', uploadTime: '2026-03-20 10:00' },
  { id: 'f2', name: '商务标文件.pdf', size: '5.1MB', uploadTime: '2026-03-20 10:05' },
  { id: 'f3', name: '技术标文件.pdf', size: '12.8MB', uploadTime: '2026-03-20 10:10' },
];

const MOCK_PROJECTS: ProjectRecord[] = [
  { id: '1', name: '某市市民中心建设工程一期', fileCount: 3, round: '一轮回标', createTime: '2026-03-20 09:30', files: MOCK_FILES },
  { id: '2', name: '高新区科技产业园B区厂房', fileCount: 5, round: '二轮回标', createTime: '2026-03-18 14:15', files: MOCK_FILES },
  { id: '3', name: '轨道交通3号线机电安装工程', fileCount: 2, round: '一轮回标', createTime: '2026-03-15 11:20', files: MOCK_FILES.slice(0, 2) },
  { id: '4', name: '市第一人民医院门诊楼扩建', fileCount: 8, round: '三轮回标', createTime: '2026-03-10 16:45', files: MOCK_FILES },
  { id: '5', name: '南部新城地下综合管廊项目', fileCount: 4, round: '四轮回标', createTime: '2026-03-05 08:50', files: MOCK_FILES },
];

const RebiddingAnalysisView: React.FC = () => {
  const [currentView, setCurrentView] = useState<'list' | 'new' | 'edit'>('list');
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedRound, setSelectedRound] = useState<string>('');
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');

  const [selectedProjectFiles, setSelectedProjectFiles] = useState<ProjectRecord | null>(null);

  // 过滤数据
  const filteredProjects = MOCK_PROJECTS.filter(p => {
    const matchName = p.name.includes(searchTerm);
    const matchRound = selectedRound ? p.round === selectedRound : true;
    const matchStartDate = startDate ? p.createTime >= startDate : true;
    const matchEndDate = endDate ? p.createTime <= endDate + ' 23:59:59' : true;
    return matchName && matchRound && matchStartDate && matchEndDate;
  });

  if (currentView === 'new') {
    return <NewRebiddingProjectView onBack={() => setCurrentView('list')} onReturnToList={() => setCurrentView('list')} mode="new" />;
  }
  
  if (currentView === 'edit') {
    return <NewRebiddingProjectView onBack={() => setCurrentView('list')} onReturnToList={() => setCurrentView('list')} mode="edit" />;
  }

  return (
    <div className="flex-1 flex flex-col bg-slate-50 overflow-hidden">
      <div className="flex-1 overflow-auto p-6">
        <div className="bg-white rounded-2xl shadow-sm border border-slate-100 overflow-hidden">
          {/* 筛选区域 */}
          <div className="p-5 border-b border-slate-100 bg-white space-y-4">
            <div className="flex flex-wrap items-center gap-4">
              <div className="flex items-center space-x-2">
                <span className="text-sm font-medium text-slate-800">项目名称</span>
                <div className="relative">
                  <input
                    type="text"
                    placeholder="输入关键词"
                    className="w-48 h-9 pl-3 pr-8 border border-slate-200 rounded-[4px] text-sm text-slate-800 placeholder-slate-400 hover:border-blue-500 focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 outline-none transition-all"
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                  />
                  <div className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400">
                    <Icon name="Search" size={14} />
                  </div>
                </div>
              </div>

              <div className="flex items-center space-x-2">
                <span className="text-sm font-medium text-slate-800">回标轮次</span>
                <select
                  className="w-36 h-9 px-3 border border-slate-200 rounded-[4px] text-sm text-slate-800 bg-white hover:border-blue-500 focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 outline-none transition-all"
                  value={selectedRound}
                  onChange={(e) => setSelectedRound(e.target.value)}
                >
                  <option value="">全部轮次</option>
                  <option value="一轮回标">一轮回标</option>
                  <option value="二轮回标">二轮回标</option>
                  <option value="三轮回标">三轮回标</option>
                  <option value="四轮回标">四轮回标</option>
                </select>
              </div>

              <div className="flex items-center space-x-2">
                <span className="text-sm font-medium text-slate-800">创建时间</span>
                <div className="flex items-center space-x-2">
                  <input
                    type="date"
                    className="h-9 px-3 border border-slate-200 rounded-[4px] text-sm text-slate-800 hover:border-blue-500 focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 outline-none transition-all"
                    value={startDate}
                    onChange={(e) => setStartDate(e.target.value)}
                  />
                  <span className="text-slate-400">-</span>
                  <input
                    type="date"
                    className="h-9 px-3 border border-slate-200 rounded-[4px] text-sm text-slate-800 hover:border-blue-500 focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 outline-none transition-all"
                    value={endDate}
                    onChange={(e) => setEndDate(e.target.value)}
                  />
                </div>
              </div>
              
              <div className="flex-1"></div>
              
              <div className="flex items-center space-x-3">
                <button 
                  onClick={() => {
                    // Placeholder for search action if needed
                  }}
                  className="h-9 px-4 border border-blue-600 bg-blue-50 text-blue-600 rounded-[4px] font-medium text-sm hover:bg-blue-100 transition-colors"
                >
                  查询
                </button>
                <button 
                  onClick={() => {
                    setSearchTerm('');
                    setSelectedRound('');
                    setStartDate('');
                    setEndDate('');
                  }}
                  className="h-9 px-4 border border-slate-300 text-slate-600 rounded-[4px] font-medium text-sm hover:bg-slate-50 transition-colors"
                >
                  重置
                </button>
                <button 
                  onClick={() => setCurrentView('new')}
                  className="h-9 px-4 bg-blue-600 text-white rounded-[4px] font-medium text-sm hover:bg-blue-700 transition-colors flex items-center space-x-1"
                >
                  <Icon name="Plus" size={16} />
                  <span>新建项目</span>
                </button>
              </div>
            </div>
          </div>

          {/* 表格区域 */}
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-slate-50 border-b border-slate-200">
                  <th className="px-6 py-4 text-[14px] font-semibold text-slate-800">项目名称</th>
                  <th className="px-6 py-4 text-[14px] font-semibold text-slate-800">上传文件数</th>
                  <th className="px-6 py-4 text-[14px] font-semibold text-slate-800">回标轮次</th>
                  <th className="px-6 py-4 text-[14px] font-semibold text-slate-800">创建时间</th>
                  <th className="px-6 py-4 text-[14px] font-semibold text-slate-800 text-right">操作</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-200">
                {filteredProjects.length > 0 ? (
                  filteredProjects.map((project) => (
                    <tr key={project.id} className="hover:bg-slate-50 transition-colors">
                      <td className="px-6 py-4 text-[14px] text-slate-800">{project.name}</td>
                      <td className="px-6 py-4">
                        <button 
                          onClick={() => setSelectedProjectFiles(project)}
                          className="text-blue-600 hover:text-blue-700 font-medium text-[14px] hover:underline"
                        >
                          {project.fileCount} 份
                        </button>
                      </td>
                      <td className="px-6 py-4">
                        <span className="inline-flex items-center px-2.5 py-1 rounded-full text-xs font-medium bg-blue-50 text-blue-700 border border-blue-100">
                          {project.round}
                        </span>
                      </td>
                      <td className="px-6 py-4 text-[14px] text-slate-500">{project.createTime}</td>
                      <td className="px-6 py-4 text-right space-x-3">
                        <button onClick={() => setCurrentView('edit')} className="text-blue-600 hover:text-blue-700 font-medium text-[14px]">清标分析</button>
                        <button className="text-red-500 hover:text-red-600 font-medium text-[14px]">删除</button>
                      </td>
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td colSpan={5} className="px-6 py-12 text-center text-slate-400 text-[14px]">
                      暂无符合条件的项目数据
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
          
          {/* 分页(仅占位) */}
          <div className="p-4 border-t border-slate-100 flex justify-end">
            <div className="flex items-center space-x-2 text-sm text-slate-500">
              <span>共 {filteredProjects.length} 条记录</span>
            </div>
          </div>
        </div>
      </div>

      {/* 文件列表弹窗 */}
      {selectedProjectFiles && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center">
          <div className="absolute inset-0 bg-slate-900/40 backdrop-blur-sm" onClick={() => setSelectedProjectFiles(null)}></div>
          <div className="relative bg-white rounded-xl shadow-2xl w-full max-w-2xl flex flex-col max-h-[80vh] animate-in zoom-in-95 duration-200">
            <div className="flex items-center justify-between px-6 py-4 border-b border-slate-100 shrink-0">
              <h3 className="text-lg font-black text-slate-800 flex items-center space-x-2">
                <Icon name="FileText" size={20} className="text-blue-500" />
                <span>已上传文件列表</span>
                <span className="text-sm font-normal text-slate-500 ml-2">({selectedProjectFiles.name})</span>
              </h3>
              <button 
                onClick={() => setSelectedProjectFiles(null)}
                className="w-8 h-8 flex items-center justify-center rounded-full text-slate-400 hover:bg-slate-100 hover:text-slate-600 transition-colors"
              >
                <Icon name="X" size={18} />
              </button>
            </div>
            
            <div className="flex-1 overflow-auto p-6">
              {selectedProjectFiles.files.length > 0 ? (
                <div className="border border-slate-100 rounded-lg overflow-hidden">
                  <table className="w-full text-left border-collapse">
                    <thead className="bg-slate-50 border-b border-slate-200">
                      <tr>
                        <th className="px-4 py-3 text-[13px] font-semibold text-slate-800">文件名</th>
                        <th className="px-4 py-3 text-[13px] font-semibold text-slate-800">上传时间</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100">
                      {selectedProjectFiles.files.map(file => (
                        <tr key={file.id} className="hover:bg-slate-50">
                          <td className="px-4 py-3 text-[13px] text-slate-800 flex items-center space-x-2">
                            <Icon name="File" size={14} className="text-slate-400" />
                            <span>{file.name}</span>
                          </td>
                          <td className="px-4 py-3 text-[13px] text-slate-500">{file.uploadTime}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              ) : (
                <div className="text-center py-12 text-slate-400 text-sm">暂无上传的文件</div>
              )}
            </div>
            
            <div className="p-4 border-t border-slate-100 flex justify-end shrink-0 bg-slate-50 rounded-b-xl">
              <button 
                onClick={() => setSelectedProjectFiles(null)}
                className="h-9 px-6 bg-white border border-slate-200 text-slate-800 rounded-[4px] font-medium text-sm hover:border-blue-600 hover:text-blue-600 transition-colors"
              >
                关闭
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default RebiddingAnalysisView;
