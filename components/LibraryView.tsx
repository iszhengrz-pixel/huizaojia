import React, { useState, useMemo } from 'react';
import Icon from './Icon';

interface LibraryFile {
  id: string;
  name: string;
  type: string;
  category: '清单' | '定额' | '真题';
  examType?: string; // 针对真题文库的细分类型
  region: string;
  year: string;
  size: string;
  downloadCount: number;
}

const EXAM_TYPES = ['全部', '一级造价师', '二级造价师', '一级建造师', '二级建造师', '注册咨询师', '监理工程师'];
const REGIONS = ['全部', '全国', '浙江', '江苏', '广东', '上海', '四川', '北京', '湖北', '山东', '福建'];
const YEARS = ['全部', '2024', '2023', '2022', '2021', '2020', '2019', '2018'];

interface LibraryViewProps {
  activeSubId: string;
  onReadFile?: (file: LibraryFile) => void;
}

const LibraryView: React.FC<LibraryViewProps> = ({ activeSubId, onReadFile }) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedRegion, setSelectedRegion] = useState('全部');
  const [selectedYear, setSelectedYear] = useState('全部');
  const [selectedExamType, setSelectedExamType] = useState('全部');

  const currentCategory = useMemo(() => {
    if (activeSubId === 'lib-list') return '清单';
    if (activeSubId === 'lib-quota') return '定额';
    if (activeSubId === 'lib-exam') return '真题';
    return '清单';
  }, [activeSubId]);

  const filteredFiles = useMemo(() => {
    return MOCK_FILES.filter(file => {
      const matchCategory = file.category === currentCategory;
      const matchSearch = file.name.toLowerCase().includes(searchQuery.toLowerCase());
      const matchRegion = selectedRegion === '全部' || file.region === selectedRegion;
      const matchYear = selectedYear === '全部' || file.year === selectedYear;
      const matchExamType = currentCategory !== '真题' || selectedExamType === '全部' || file.examType === selectedExamType;
      
      return matchCategory && matchSearch && matchRegion && matchYear && matchExamType;
    });
  }, [currentCategory, searchQuery, selectedRegion, selectedYear, selectedExamType]);

  const renderDropdown = (label: string, value: string, options: string[], onChange: (val: string) => void) => (
    <div className="flex items-center space-x-3 group">
      <span className="text-slate-400 uppercase tracking-widest text-[10px] font-black shrink-0">{label}：</span>
      <div className="relative min-w-[120px]">
        <select 
          value={value} 
          onChange={(e) => onChange(e.target.value)}
          className="w-full bg-white border border-slate-200 rounded-xl py-2 pl-4 pr-10 text-xs font-bold text-slate-700 focus:border-blue-400 outline-none appearance-none cursor-pointer shadow-sm hover:border-slate-300 transition-all"
        >
          {options.map(opt => <option key={opt} value={opt}>{opt}</option>)}
        </select>
        <Icon name="ChevronDown" size={14} className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none group-focus-within:text-blue-500 transition-colors" />
      </div>
    </div>
  );

  return (
    <div className="flex-1 flex flex-col h-full bg-slate-50 overflow-hidden animate-in fade-in duration-500">
      {/* Search Header */}
      <div className="bg-white border-b border-slate-200 px-8 py-6 shrink-0 z-10">
        <div className="max-w-4xl mx-auto space-y-6">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-4">
              <div className="w-12 h-12 bg-blue-600 rounded-2xl flex items-center justify-center text-white shadow-lg shadow-blue-500/10 transition-transform hover:scale-105">
                <Icon name={activeSubId === 'lib-exam' ? 'GraduationCap' : activeSubId === 'lib-quota' ? 'FileBarChart' : 'ClipboardList'} size={24} />
              </div>
              <div>
                <h1 className="text-xl font-black text-slate-900">{currentCategory}文库</h1>
                <p className="text-sm text-slate-400 font-medium">提供权威、实时的{currentCategory}文件查询与阅读</p>
              </div>
            </div>
          </div>

          <div className="relative group">
            <div className="absolute inset-y-0 left-4 flex items-center pointer-events-none text-slate-400 group-focus-within:text-blue-500">
              <Icon name="Search" size={18} />
            </div>
            <input
              type="text"
              placeholder={`在 ${currentCategory}文库 中搜索文档名称、关键字...`}
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full bg-slate-50 border border-slate-100 rounded-2xl py-3.5 pl-12 pr-4 outline-none focus:ring-4 focus:ring-blue-500/10 focus:border-blue-400 focus:bg-white transition-all font-medium text-slate-700 shadow-sm"
            />
          </div>

          <div className="flex flex-wrap items-center gap-x-10 gap-y-4">
            {currentCategory === '真题' && renderDropdown('类型', selectedExamType, EXAM_TYPES, setSelectedExamType)}
            {renderDropdown('地区', selectedRegion, REGIONS, setSelectedRegion)}
            {renderDropdown('年份', selectedYear, YEARS, setSelectedYear)}
            
            <button 
              onClick={() => {
                setSearchQuery('');
                setSelectedRegion('全部');
                setSelectedYear('全部');
                setSelectedExamType('全部');
              }}
              className="px-3 bg-slate-100 hover:bg-slate-200 text-slate-900 text-[10px] font-black uppercase tracking-widest rounded-xl flex items-center transition-colors h-9 shadow-sm active:scale-95"
            >
              <Icon name="RotateCcw" size={12} className="mr-1.5" />
              重置筛选
            </button>
          </div>
        </div>
      </div>

      {/* Results List */}
      <div className="flex-1 overflow-y-auto p-8 custom-scrollbar">
        <div className="max-w-5xl mx-auto space-y-4">
          {filteredFiles.map(file => (
            <div key={file.id} className="bg-white rounded-2xl p-5 border border-slate-100 shadow-sm hover:shadow-xl hover:shadow-blue-500/5 transition-all group flex items-center justify-between animate-in slide-in-from-bottom-2 duration-300">
              <div className="flex items-center space-x-5">
                <div className={`w-14 h-14 rounded-2xl flex items-center justify-center shrink-0 ${file.type === 'PDF' ? 'bg-rose-50 text-rose-500' : 'bg-emerald-50 text-emerald-500'}`}>
                   <Icon name={file.type === 'PDF' ? 'FileText' : 'FileSpreadsheet'} size={28} />
                </div>
                <div>
                  <div className="flex items-center space-x-2 mb-1">
                    <h3 className="text-[15px] font-black text-slate-800 group-hover:text-blue-600 transition-colors">{file.name}</h3>
                    {file.examType && (
                      <span className="bg-blue-50 text-blue-500 text-[9px] px-1.5 py-0.5 rounded font-black uppercase tracking-wider border border-blue-100/50">{file.examType}</span>
                    )}
                  </div>
                  <div className="flex items-center space-x-4 text-[11px] font-bold text-slate-400">
                    <span className="flex items-center"><Icon name="MapPin" size={12} className="mr-1" /> {file.region}</span>
                    <span className="flex items-center"><Icon name="Calendar" size={12} className="mr-1" /> {file.year}年</span>
                    <span className="flex items-center"><Icon name="HardDrive" size={12} className="mr-1" /> {file.size}</span>
                    <span className="flex items-center"><Icon name="Eye" size={12} className="mr-1" /> {file.downloadCount.toLocaleString()} 次阅读</span>
                  </div>
                </div>
              </div>
              <div className="flex items-center space-x-3">
                <button 
                  onClick={() => onReadFile?.(file)}
                  className="px-5 py-2 bg-blue-600 text-white rounded-xl text-xs font-black hover:bg-blue-700 transition-all shadow-lg shadow-blue-500/20 active:scale-95"
                >
                  阅读全文
                </button>
                {/* 仅真题文库允许下载 */}
                {file.category === '真题' && (
                  <button className="p-2.5 bg-slate-50 text-slate-400 rounded-xl hover:bg-blue-50 hover:text-blue-600 border border-transparent hover:border-blue-100 transition-all">
                    <Icon name="Download" size={18} />
                  </button>
                )}
              </div>
            </div>
          ))}

          {filteredFiles.length === 0 && (
            <div className="py-20 flex flex-col items-center justify-center text-slate-300 opacity-60">
              <Icon name="SearchX" size={64} className="mb-4" />
              <p className="text-sm font-bold tracking-tight text-slate-400">未找到匹配的文档，请尝试更换搜索词或筛选条件</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

const MOCK_FILES: LibraryFile[] = [
  { id: 'f1', name: '建设工程工程量清单计价标准(2024)', type: 'PDF', category: '清单', region: '全国', year: '2024', size: '12.5MB', downloadCount: 15200 },
  { id: 'f2', name: '浙江省建筑工程预算定额(2018)', type: 'PDF', category: '定额', region: '浙江', year: '2018', size: '45.2MB', downloadCount: 8900 },
  { id: 'f3', name: '2023年一级造价工程师《案例分析》真题', type: 'PDF', category: '真题', examType: '一级造价师', region: '全国', year: '2023', size: '3.8MB', downloadCount: 24000 },
  { id: 'f4', name: '房建工程清单常用特征描述库', type: 'Excel', category: '清单', region: '全国', year: '2024', size: '1.2MB', downloadCount: 5600 },
  { id: 'f5', name: '市政工程消耗量定额(2021)', type: 'PDF', category: '定额', region: '广东', year: '2021', size: '38.0MB', downloadCount: 4200 },
  { id: 'f6', name: '2022年二级造价工程师《计价控制》真题', type: 'PDF', category: '真题', examType: '二级造价师', region: '江苏', year: '2022', size: '2.5MB', downloadCount: 12000 },
  { id: 'f7', name: '2023年一级建造师《建设工程经济》真题', type: 'PDF', category: '真题', examType: '一级建造师', region: '全国', year: '2023', size: '4.1MB', downloadCount: 18500 },
  { id: 'f8', name: '2022年监理工程师《投资控制》真题', type: 'PDF', category: '真题', examType: '监理工程师', region: '全国', year: '2022', size: '3.2MB', downloadCount: 9600 },
  { id: 'f9', name: '2023年注册咨询师《宏观经济政策》真题', type: 'PDF', category: '真题', examType: '注册咨询师', region: '全国', year: '2023', size: '2.9MB', downloadCount: 5400 },
];

export default LibraryView;