import React, { useState, useRef, useEffect, useMemo } from 'react';
import Icon from './Icon';
import ProjectFileUploadView from './ProjectFileUploadView';

interface ProjectFile {
  id: string;
  name: string;
  phase: '招标' | '结算';
  size: string;
  uploader: string;
  uploadTime: string;
}

const MOCK_FILES: ProjectFile[] = [
  { id: '1', name: '招标文件_20240115.xlsx', phase: '招标', size: '1.2MB', uploader: '张三', uploadTime: '2024-01-15 10:30:00' },
  { id: '2', name: '结算文件_最终版.xlsx', phase: '结算', size: '2.5MB', uploader: '李四', uploadTime: '2024-01-16 14:20:00' },
];

interface CompareDataItem {
  id: string;
  index: number;
  code: string;
  name: string;
  features: string;
  unit: string;
  bidQty: number;
  bidUnitPrice: number;
  bidTotalPrice: number;
  settleQty: number;
  settleUnitPrice: number;
  settleTotalPrice: number;
  contractRatio: number;
  adjustRatio: number;
}

const MOCK_COMPARE_DATA: CompareDataItem[] = [
  { id: 'c1', index: 1, code: '010101001001', name: '平整场地', features: '土壤类别：三类土，弃土运距：5km', unit: 'm²', bidQty: 1200.5, bidUnitPrice: 8.5, bidTotalPrice: 10204.25, settleQty: 1185.2, settleUnitPrice: 8.5, settleTotalPrice: 10074.2, contractRatio: 11.34, adjustRatio: -1.27 },
  { id: 'c2', index: 2, code: '010101002001', name: '挖沟槽土方', features: '土壤类别：二类土，挖土深度：2.5m', unit: 'm³', bidQty: 3560.8, bidUnitPrice: 28.6, bidTotalPrice: 101838.88, settleQty: 3680.5, settleUnitPrice: 28.6, settleTotalPrice: 105262.3, contractRatio: 113.15, adjustRatio: 3.36 },
  { id: 'c3', index: 3, code: '010103001001', name: '回填方', features: '填方材料：素土，碾压要求：夯实', unit: 'm³', bidQty: 2890.3, bidUnitPrice: 22.4, bidTotalPrice: 64742.72, settleQty: 2856.8, settleUnitPrice: 22.4, settleTotalPrice: 63992.32, contractRatio: 71.08, adjustRatio: -1.16 },
  { id: 'c4', index: 4, code: '010401001001', name: '砖基础', features: '砖品种、规格：MU10标准砖，砂浆：M5水泥砂浆', unit: 'm³', bidQty: 156.4, bidUnitPrice: 385.2, bidTotalPrice: 60245.28, settleQty: 160.2, settleUnitPrice: 385.2, settleTotalPrice: 61709.04, contractRatio: 68.58, adjustRatio: 2.43 },
  { id: 'c5', index: 5, code: '010401003001', name: '实心砖墙', features: '砖品种：MU10烧结普通砖，厚度：240mm，砂浆：M7.5混合砂浆', unit: 'm³', bidQty: 892.6, bidUnitPrice: 412.8, bidTotalPrice: 368461.28, settleQty: 885.3, settleUnitPrice: 412.8, settleTotalPrice: 365451.84, contractRatio: 409.4, adjustRatio: -0.82 },
  { id: 'c6', index: 6, code: '010301001001', name: '预制钢筋混凝土方桩', features: '桩长:12m，断面:400*400，混凝土强度等级:C30', unit: 'm', bidQty: 2400.0, bidUnitPrice: 185.0, bidTotalPrice: 444000.00, settleQty: 2424.0, settleUnitPrice: 185.0, settleTotalPrice: 448440.0, contractRatio: 524.3, adjustRatio: 1.0 },
  { id: 'c7', index: 7, code: '010501001001', name: '矩形柱', features: '混凝土强度等级:C35，截面尺寸:600*600', unit: 'm³', bidQty: 156.8, bidUnitPrice: 560.0, bidTotalPrice: 87808.00, settleQty: 158.5, settleUnitPrice: 560.0, settleTotalPrice: 88760.0, contractRatio: 98.6, adjustRatio: 1.08 },
  { id: 'c8', index: 8, code: '010503002001', name: '有梁板', features: '混凝土强度等级:C30，板厚:120mm', unit: 'm³', bidQty: 845.2, bidUnitPrice: 545.0, bidTotalPrice: 460634.00, settleQty: 832.6, settleUnitPrice: 545.0, settleTotalPrice: 453767.0, contractRatio: 498.2, adjustRatio: -1.49 },
  { id: 'c9', index: 9, code: '010515001001', name: '现浇构件钢筋', features: '钢筋种类、规格:HPB300', unit: 't', bidQty: 45.6, bidUnitPrice: 4850.0, bidTotalPrice: 221160.00, settleQty: 46.8, settleUnitPrice: 4850.0, settleTotalPrice: 226980.0, contractRatio: 245.8, adjustRatio: 2.63 },
  { id: 'c10', index: 10, code: '010902001001', name: '水泥砂浆找平层', features: '厚度:20mm，砂浆强度等级:M15水泥砂浆', unit: 'm²', bidQty: 3200.0, bidUnitPrice: 22.5, bidTotalPrice: 72000.00, settleQty: 3180.0, settleUnitPrice: 22.5, settleTotalPrice: 71550.0, contractRatio: 78.4, adjustRatio: -0.63 },
];

const COMPARE_SUB_TABS = [
  '土建', '精装修', '幕墙', '安装消防水', '安装消防电', '安装智能化', '安装水电', '安装暖通', '安装其他'
];

interface ProAssociationItem {
  id: string;
  name: string;
  type: '文件' | '页签' | '清单';
  level: number;
  associationPath?: string[];
  isExpanded?: boolean;
}

const MOCK_PRO_DATA: ProAssociationItem[] = [
  { id: 'f-1', name: '招标文件.xlsx', type: '文件', level: 0, isExpanded: true },
  { id: 's-1', name: 'Sheet1', type: '页签', level: 1, isExpanded: true },
  { id: 'q-1', name: '分部分项工程清单001', type: '清单', level: 2, associationPath: ['园林绿化', '土建工程'] },
  { id: 'q-2', name: '分部分项工程清单002', type: '清单', level: 2, associationPath: ['园林绿化', '安装工程'] },
  { id: 's-2', name: 'Sheet2', type: '页签', level: 1, isExpanded: true },
  { id: 'q-3', name: '分部分项工程清单003', type: '清单', level: 2, associationPath: ['市政工程', '道路工程'] },
];

interface SpecialtyOption {
  id: string;
  name: string;
  children?: SpecialtyOption[];
}

const SPECIALTY_TREE: SpecialtyOption[] = [
  { id: 'b', name: '建筑工程', children: [{ id: 'b-1', name: '土建工程' }, { id: 'b-2', name: '装饰工程' }, { id: 'b-3', name: '屋面防水' }] },
  { id: 'm', name: '市政工程', children: [{ id: 'm-1', name: '道路工程' }, { id: 'm-2', name: '桥梁工程' }, { id: 'm-3', name: '排水工程' }] },
  { id: 'l', name: '园林绿化', children: [{ id: 'l-1', name: '土建工程' }, { id: 'l-2', name: '安装工程' }, { id: 'l-3', name: '绿化种植' }, { id: 'l-4', name: '景观照明' }] },
  { id: 'i', name: '机电安装', children: [{ id: 'i-1', name: '强电工程' }, { id: 'i-2', name: '弱电工程' }] }
];

const ProCascader: React.FC<{ value?: string[]; onSelect: (path: string[]) => void }> = ({ value, onSelect }) => {
  const [isOpen, setIsOpen] = useState(false);
  const [hoveredL1, setHoveredL1] = useState<string | null>(null);
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  useEffect(() => {
    if (isOpen) {
      if (value && value.length > 0) {
        const found = SPECIALTY_TREE.find(opt => opt.name === value[0]);
        if (found) setHoveredL1(found.id);
      } else if (!hoveredL1) {
        setHoveredL1(SPECIALTY_TREE[0].id);
      }
    }
  }, [isOpen]);

  const activeChildren = useMemo(() => {
    return SPECIALTY_TREE.find(opt => opt.id === hoveredL1)?.children || [];
  }, [hoveredL1]);

  const handleSelectFinal = (l1Name: string, l2Name: string) => {
    onSelect([l1Name, l2Name]);
    setIsOpen(false);
  };

  const displayValue = value && value.length > 0 ? value.join(' / ') : '请选择专业';

  return (
    <div className="relative w-full" ref={containerRef}>
      <div 
        onClick={() => setIsOpen(!isOpen)}
        className={`w-full h-9 bg-white border rounded-xl px-4 flex items-center justify-between cursor-pointer transition-all hover:border-blue-400 ${isOpen ? 'border-blue-500 ring-4 ring-blue-500/5' : 'border-slate-200'}`}
      >
        <span className={`text-[12px] font-bold truncate ${value ? 'text-slate-800' : 'text-slate-400'}`}>
          {displayValue}
        </span>
        <Icon name="ChevronDown" size={14} className={`text-slate-300 transition-transform ${isOpen ? 'rotate-180 text-blue-500' : ''}`} />
      </div>

      {isOpen && (
        <div className="absolute top-full left-0 mt-2 bg-white rounded-2xl shadow-[0_15px_45px_rgba(0,0,0,0.15)] border border-slate-100 flex z-50 animate-in fade-in zoom-in-95 duration-200 min-w-[360px] h-auto max-h-[360px]">
          <div className="w-44 border-r border-slate-100 py-2 shrink-0 overflow-y-auto custom-scrollbar">
            {SPECIALTY_TREE.map((opt) => {
              const isPathActive = value && value[0] === opt.name;
              const isHovered = hoveredL1 === opt.id;
              return (
                <div key={opt.id} onMouseEnter={() => setHoveredL1(opt.id)} className={`flex items-center justify-between px-4 py-2.5 cursor-pointer transition-colors ${isHovered ? 'bg-slate-50' : ''}`}>
                  <span className={`text-[12px] font-bold ${isHovered ? 'text-blue-600' : isPathActive ? 'text-blue-500' : 'text-slate-600'}`}>{opt.name}</span>
                  <Icon name="ChevronRight" size={12} className={`${isHovered || isPathActive ? 'text-blue-400' : 'text-slate-300'}`} />
                </div>
              );
            })}
          </div>
          <div className="w-48 py-2 bg-white overflow-y-auto custom-scrollbar">
            {activeChildren.length > 0 ? (
              activeChildren.map((sub) => {
                const parent = SPECIALTY_TREE.find(o => o.id === hoveredL1);
                const isSelected = value && value[0] === parent?.name && value[1] === sub.name;
                return (
                  <div key={sub.id} onClick={() => handleSelectFinal(parent!.name, sub.name)} className={`flex items-center justify-between px-4 py-2.5 cursor-pointer transition-colors ${isSelected ? 'bg-blue-50/50' : 'hover:bg-slate-50'}`}>
                    <span className={`text-[12px] font-bold ${isSelected ? 'text-blue-600' : 'text-slate-600'}`}>{sub.name}</span>
                    <div className="w-5 flex justify-end shrink-0">{isSelected && <Icon name="Check" size={14} className="text-blue-600" strokeWidth={3} />}</div>
                  </div>
                );
              })
            ) : (
              <div className="flex flex-col items-center justify-center py-10 text-slate-300 opacity-40"><Icon name="Inbox" size={24} strokeWidth={1} /><span className="text-[10px] mt-1">无分类项</span></div>
            )}
          </div>
        </div>
      )}
    </div>
  );
};

interface ProjectDetailViewProps {
  projectName: string;
  onBack: () => void;
}

const ProjectDetailView: React.FC<ProjectDetailViewProps> = ({ projectName, onBack }) => {
  const [activeTab, setActiveTab] = useState<'file' | 'pro' | 'compare'>('file');
  const [isUploading, setIsUploading] = useState(false);
  const [uploadPhase, setUploadPhase] = useState<'招标' | '结算'>('招标');
  
  const [compareSubTab, setCompareSubTab] = useState('土建');
  const [contractPrice, setContractPrice] = useState('90000');
  const [qtyExceedLimitIn, setQtyExceedLimitIn] = useState('');
  const [qtyExceedLimitOut, setQtyExceedLimitOut] = useState('');
  const [isFireSplit, setIsFireSplit] = useState(false);

  const [tableData, setTableData] = useState<ProAssociationItem[]>(MOCK_PRO_DATA);

  const tabs = [
    { id: 'file', label: '文件维护' },
    { id: 'pro', label: '专业关联' },
    { id: 'compare', label: '对比关联' },
  ];

  const handleStartUpload = (phase: '招标' | '结算') => {
    setUploadPhase(phase);
    setIsUploading(true);
  };

  const updateAssociation = (id: string, path: string[]) => {
    setTableData(prev => prev.map(item => item.id === id ? { ...item, associationPath: path } : item));
  };

  const toggleRowExpansion = (id: string) => {
    setTableData(prev => prev.map(item => item.id === id ? { ...item, isExpanded: !item.isExpanded } : item));
  };

  const renderCompareTab = () => {
    return (
      <div className="flex flex-col animate-in fade-in slide-in-from-bottom-2 duration-500">
        {/* 配置参数区 - 横向一行排列 */}
        <div className="bg-white px-6 pt-2 pb-2 flex flex-wrap items-center gap-x-8 gap-y-4 shrink-0">
          <div className="flex items-center space-x-3">
            <label className="text-[11px] font-black text-slate-400 uppercase tracking-widest shrink-0">合同价</label>
            <div className="relative w-48">
               <input 
                type="text" 
                value={contractPrice} 
                onChange={(e) => setContractPrice(e.target.value)}
                className="w-full h-9 bg-white border border-slate-200 rounded-xl pl-4 pr-10 py-1.5 text-xs font-black text-slate-700 focus:border-blue-400 outline-none transition-all" 
               />
               <span className="absolute right-4 top-1/2 -translate-y-1/2 text-[10px] font-black text-slate-400">元</span>
            </div>
          </div>

          <div className="flex items-center space-x-3">
            <label className="text-[11px] font-black text-slate-400 uppercase tracking-widest shrink-0">2%以内工程量超出百分比</label>
            <div className="relative w-36">
              <input 
                type="text" 
                placeholder="请输入"
                value={qtyExceedLimitIn}
                onChange={(e) => setQtyExceedLimitIn(e.target.value)}
                className="w-full h-9 bg-white border border-slate-200 rounded-xl pl-4 pr-8 py-1.5 text-xs font-bold text-slate-700 focus:border-blue-400 outline-none transition-all" 
              />
              <span className="absolute right-4 top-1/2 -translate-y-1/2 text-[10px] font-black text-slate-400">%</span>
            </div>
          </div>

          <div className="flex items-center space-x-3">
            <label className="text-[11px] font-black text-slate-400 uppercase tracking-widest shrink-0">2%以外工程量超出百分比</label>
            <div className="relative w-36">
              <input 
                type="text" 
                placeholder="请输入"
                value={qtyExceedLimitOut}
                onChange={(e) => setQtyExceedLimitOut(e.target.value)}
                className="w-full h-9 bg-white border border-slate-200 rounded-xl pl-4 pr-8 py-1.5 text-xs font-bold text-slate-700 focus:border-blue-400 outline-none transition-all" 
              />
              <span className="absolute right-4 top-1/2 -translate-y-1/2 text-[10px] font-black text-slate-400">%</span>
            </div>
          </div>

          <div className="flex items-center space-x-4">
             <label className="text-[11px] font-black text-slate-400 uppercase tracking-widest shrink-0">消防水电是否拆开</label>
             <div className="flex items-center space-x-5">
                <label className="flex items-center space-x-2 cursor-pointer group">
                  <div onClick={() => setIsFireSplit(true)} className={`w-4 h-4 rounded-full border-2 flex items-center justify-center transition-all ${isFireSplit ? 'border-blue-500' : 'border-slate-200 group-hover:border-blue-300'}`}>
                    {isFireSplit && <div className="w-2 h-2 bg-blue-500 rounded-full animate-in zoom-in-50 duration-300"></div>}
                  </div>
                  <span className={`text-xs font-bold ${isFireSplit ? 'text-blue-600' : 'text-slate-500'}`}>是</span>
                </label>
                <label className="flex items-center space-x-2 cursor-pointer group">
                  <div onClick={() => setIsFireSplit(false)} className={`w-4 h-4 rounded-full border-2 flex items-center justify-center transition-all ${!isFireSplit ? 'border-blue-500' : 'border-slate-200 group-hover:border-blue-300'}`}>
                    {!isFireSplit && <div className="w-2 h-2 bg-blue-500 rounded-full animate-in zoom-in-50 duration-300"></div>}
                  </div>
                  <span className={`text-xs font-bold ${!isFireSplit ? 'text-blue-600' : 'text-slate-500'}`}>否</span>
                </label>
             </div>
          </div>
        </div>

        {/* 动作按钮 - 紧贴配置区 */}
        <div className="flex items-center space-x-4 shrink-0 px-6 pt-1 pb-1">
           <button className="flex items-center space-x-2 px-8 py-2 bg-blue-600 text-white rounded-xl text-[13px] font-black shadow-lg shadow-blue-500/20 hover:bg-blue-700 transition-all active:scale-95 outline-none">
             <Icon name="Zap" size={16} fill="currentColor" />
             <span>计算</span>
           </button>
           <button className="flex items-center space-x-2 px-8 py-2 bg-white border border-blue-600 text-blue-600 rounded-xl text-[13px] font-black shadow-sm hover:bg-blue-50 transition-all active:scale-95 outline-none">
             <Icon name="Download" size={16} />
             <span>导出</span>
           </button>
        </div>

        {/* 专业子标签 - 距离按钮 mt-8，距离表格 mb-4 */}
        <div className="bg-slate-100/60 p-1 rounded-[18px] flex flex-wrap gap-1 shrink-0 w-fit border border-slate-200/50 mx-6 mt-8 mb-4">
           {COMPARE_SUB_TABS.map(tab => (
             <button 
              key={tab} 
              onClick={() => setCompareSubTab(tab)}
              className={`px-5 py-2 rounded-2xl text-[12px] font-black transition-all ${compareSubTab === tab ? 'bg-white text-blue-600 shadow-sm ring-1 ring-slate-200/50' : 'text-slate-500 hover:text-slate-800'}`}
             >
               {tab}
             </button>
           ))}
        </div>

        {/* 对比关联表格 / 空状态 */}
        <div className="border border-slate-100 rounded-[32px] overflow-hidden flex flex-col shadow-sm bg-white min-h-[500px]">
          {compareSubTab === '土建' ? (
            <>
              <div className="overflow-x-auto custom-scrollbar relative">
                <table className="w-full border-separate border-spacing-0 text-left min-w-[1600px] table-fixed bg-white">
                  <thead className="sticky top-0 z-40">
                    <tr className="font-black text-slate-400 text-[12px] uppercase tracking-widest text-center">
                      <th style={{ width: '60px', left: '0px' }} className="px-2 py-5 sticky z-50 bg-[#f8fafc] border-b border-r border-slate-200">序号</th>
                      <th style={{ width: '150px', left: '60px' }} className="px-2 py-5 sticky z-50 bg-[#f8fafc] border-b border-r border-slate-200">项目编码</th>
                      <th style={{ width: '200px', left: '210px' }} className="px-4 py-5 sticky z-50 bg-[#f8fafc] border-b border-r border-slate-300 text-left shadow-[2px_0_0_rgba(0,0,0,0.05)]">项目名称</th>
                      <th className="w-[260px] px-4 py-5 border-b border-r border-slate-100 text-left bg-[#f8fafc]">项目特征</th>
                      <th className="w-[80px] px-2 py-5 border-b border-r border-slate-100 bg-[#f8fafc] text-center">计量单位</th>
                      <th className="w-[100px] px-2 py-5 border-b border-r border-slate-100 bg-[#f8fafc] text-center">招标工程量</th>
                      <th className="w-[100px] px-2 py-5 border-b border-r border-slate-100 bg-[#f8fafc] text-center">综合单价</th>
                      <th className="w-[120px] px-2 py-5 border-b border-r border-slate-200 bg-[#f8fafc] text-center">合价</th>
                      <th className="w-[100px] px-2 py-5 border-b border-r border-slate-100 bg-[#F1F6FE] text-center">结算工程量</th>
                      <th className="w-[100px] px-2 py-5 border-b border-r border-slate-100 bg-[#F1F6FE] text-center">综合单价</th>
                      <th className="w-[120px] px-2 py-5 border-b border-r border-slate-300 bg-[#F1F6FE] text-center">合价</th>
                      <th style={{ width: '110px', right: '130px' }} className="px-2 py-5 sticky z-50 bg-[#f8fafc] border-b border-l border-slate-200 shadow-[-2px_0_0_rgba(0,0,0,0.05)]">合同占比(%)</th>
                      <th style={{ width: '130px', right: '0px' }} className="px-2 py-5 sticky z-50 bg-[#f8fafc] border-b border-l border-slate-200">工程量调整比例(%)</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {MOCK_COMPARE_DATA.map((row) => (
                      <tr key={row.id} className="group">
                        <td style={{ left: '0px' }} className="px-2 py-4 text-[12px] text-center text-slate-400 font-bold sticky z-20 bg-white border-r border-slate-100 group-hover:bg-[#f0f7ff] transition-colors">{row.index}</td>
                        <td style={{ left: '60px' }} className="px-2 py-4 text-[12px] text-center text-slate-500 font-mono font-bold sticky z-20 bg-white border-r border-slate-100 group-hover:bg-[#f0f7ff] transition-colors">{row.code}</td>
                        <td style={{ left: '210px' }} className="px-4 py-4 text-[12px] font-black text-slate-800 sticky z-20 bg-white border-r border-slate-200 shadow-[2px_0_0_rgba(0,0,0,0.03)] group-hover:bg-[#f0f7ff] transition-colors">{row.name}</td>
                        <td className="px-4 py-4 text-[12px] text-slate-400 font-medium border-r border-slate-50 truncate group-hover:bg-[#f8fafc] transition-colors bg-white">{row.features}</td>
                        <td className="px-2 py-4 text-[12px] text-center text-slate-500 font-bold border-r border-slate-50 group-hover:bg-[#f8fafc] transition-colors bg-white">{row.unit}</td>
                        <td className="px-2 py-4 text-[12px] text-center text-slate-600 font-bold border-r border-slate-50 group-hover:bg-[#f8fafc] transition-colors bg-white">{row.bidQty.toLocaleString()}</td>
                        <td className="px-2 py-4 text-[12px] text-center text-slate-600 font-bold border-r border-slate-50 group-hover:bg-[#f8fafc] transition-colors bg-white">{row.bidUnitPrice.toLocaleString()}</td>
                        <td className="px-2 py-4 text-[12px] text-center text-slate-600 font-bold border-r border-slate-100 group-hover:bg-[#f8fafc] transition-colors bg-white">{row.bidTotalPrice.toLocaleString(undefined, { minimumFractionDigits: 2 })}</td>
                        <td className="px-2 py-4 text-[12px] text-center text-slate-800 font-black border-r border-slate-50 bg-white group-hover:bg-[#f0f7ff] transition-colors">{row.settleQty.toLocaleString()}</td>
                        <td className="px-2 py-4 text-[12px] text-center text-slate-600 font-bold border-r border-slate-50 bg-white group-hover:bg-[#f0f7ff] transition-colors">{row.settleUnitPrice.toLocaleString()}</td>
                        <td className="px-2 py-4 text-[12px] text-center text-slate-800 font-black border-r border-slate-100 bg-white group-hover:bg-[#f0f7ff] transition-colors">{row.settleTotalPrice.toLocaleString(undefined, { minimumFractionDigits: 2 })}</td>
                        <td style={{ right: '130px' }} className="px-2 py-4 text-[12px] text-center font-black text-blue-600 sticky z-20 bg-white border-l border-slate-100 shadow-[-2px_0_0_rgba(0,0,0,0.03)] group-hover:bg-[#f0f7ff] transition-colors">{row.contractRatio.toFixed(2)}</td>
                        <td style={{ right: '0px' }} className={`px-2 py-4 text-[12px] text-center font-black sticky z-20 bg-white border-l border-slate-100 group-hover:bg-[#f0f7ff] transition-colors ${row.adjustRatio > 0 ? 'text-rose-500' : 'text-emerald-500'}`}>
                          {row.adjustRatio > 0 ? `+${row.adjustRatio.toFixed(2)}` : row.adjustRatio.toFixed(2)}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
              <div className="px-8 py-5 bg-[#f8fafc] border-t border-slate-100 flex items-center justify-between shrink-0">
                 <p className="text-[11px] font-bold text-slate-400 uppercase tracking-widest">共计显示 {MOCK_COMPARE_DATA.length} 条对比数据</p>
                 <div className="flex items-center space-x-2">
                   <button className="w-8 h-8 rounded-lg border border-slate-200 flex items-center justify-center text-slate-300 hover:bg-white transition-all"><Icon name="ChevronLeft" size={14} /></button>
                   <button className="w-8 h-8 rounded-lg bg-blue-600 text-white flex items-center justify-center text-xs font-black shadow-lg shadow-blue-500/20">1</button>
                   <button className="w-8 h-8 rounded-lg border border-slate-200 flex items-center justify-center text-slate-300 hover:bg-white transition-all"><Icon name="ChevronRight" size={14} /></button>
                 </div>
              </div>
            </>
          ) : (
            <div className="flex-1 flex flex-col items-center justify-center text-slate-300 py-32 animate-in fade-in duration-500">
              <div className="relative mb-6">
                <div className="absolute inset-0 bg-blue-100/30 blur-2xl rounded-full scale-150"></div>
                <Icon name="Inbox" size={80} strokeWidth={1} className="text-slate-200 relative z-10" />
              </div>
              <h4 className="text-lg font-black text-slate-300 tracking-tight">暂无相关数据</h4>
              <p className="text-sm text-slate-400 mt-2 font-medium">当前分类下尚未进行结算文件解析或无匹配清单项</p>
            </div>
          )}
        </div>
      </div>
    );
  };

  const renderProTab = () => {
    const getVisibleData = () => {
      const visibleData: ProAssociationItem[] = [];
      const expandedMap = new Map<string, boolean>();
      tableData.forEach(item => expandedMap.set(item.id, !!item.isExpanded));

      const isItemVisible = (item: ProAssociationItem) => {
        if (item.level === 0) return true;
        const currentIndex = tableData.findIndex(d => d.id === item.id);
        for (let i = currentIndex - 1; i >= 0; i--) {
          const prev = tableData[i];
          if (prev.level < item.level) {
             if (!prev.isExpanded) return false;
             return isItemVisible(prev);
          }
        }
        return true;
      };
      return tableData.filter(isItemVisible);
    };

    const visibleRows = getVisibleData();

    return (
      <div className="flex flex-col space-y-6">
        <div className="flex items-center space-x-3 shrink-0">
          <div className="relative w-64">
            <div className="w-full h-10 bg-white border border-slate-200 rounded-xl px-4 flex items-center justify-between cursor-pointer transition-all hover:border-slate-300">
              <span className="text-xs font-bold text-slate-400">请选择搜索条件</span>
              <Icon name="ChevronDown" size={14} className="text-slate-300" />
            </div>
          </div>
          <button className="flex items-center space-x-2 px-6 h-10 bg-blue-500 text-white rounded-xl text-xs font-black shadow-lg shadow-blue-500/10 hover:bg-blue-600 transition-all active:scale-95">
            <Icon name="Search" size={14} strokeWidth={3} />
            <span>搜索</span>
          </button>
          <button className="flex items-center space-x-2 px-6 h-10 bg-white border border-blue-400 text-blue-500 rounded-xl text-xs font-black hover:bg-blue-50 transition-all active:scale-95">
            <Icon name="Filter" size={14} strokeWidth={3} />
            <span>筛选未关联</span>
          </button>
        </div>

        <div className="border border-slate-100 rounded-[32px] overflow-hidden flex flex-col shadow-sm bg-white">
          <div className="overflow-x-auto">
            <table className="w-full border-collapse text-left">
              <thead className="bg-slate-50/80">
                <tr className="border-b border-slate-100">
                  <th className="px-8 py-3.5 text-[11px] font-black text-slate-400 uppercase tracking-widest text-center w-20">序号</th>
                  <th className="px-6 py-3.5 text-[11px] font-black text-slate-400 uppercase tracking-widest w-[260px]">名称</th>
                  <th className="px-6 py-3.5 text-[11px] font-black text-slate-400 uppercase tracking-widest text-center w-32">类型</th>
                  <th className="px-8 py-3.5 text-[11px] font-black text-slate-400 uppercase tracking-widest text-center w-[500px]">专业关联</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-50">
                {visibleRows.map((item, index) => (
                  <tr key={item.id} className="hover:bg-blue-50/20 transition-all duration-300 group">
                    <td className="px-8 py-3 text-xs text-slate-400 text-center font-bold">
                      {index + 1}
                    </td>
                    <td className="px-6 py-3">
                      <div className="flex items-center" style={{ marginLeft: `${item.level * 24}px` }}>
                        {item.level < 2 && (item.id.includes('f') || item.id.includes('s')) ? (
                          <div 
                            onClick={() => toggleRowExpansion(item.id)}
                            className="mr-2 cursor-pointer text-slate-400 hover:text-blue-500 transition-colors"
                          >
                            <Icon 
                              name={item.isExpanded ? "ChevronDown" : "ChevronRight"} 
                              size={14} 
                              className={`transition-transform duration-200`} 
                            />
                          </div>
                        ) : (
                          <div className="w-5.5 mr-2"></div>
                        )}
                        <span className={`text-[12px] font-bold truncate max-w-[180px] ${item.level === 0 ? 'text-slate-800' : 'text-slate-600'}`}>
                          {item.name}
                        </span>
                      </div>
                    </td>
                    <td className="px-6 py-3 text-center">
                      <span className={`px-2.5 py-0.5 rounded text-[10px] font-black ${
                        item.type === '文件' ? 'bg-blue-50 text-blue-500' : 
                        item.type === '页签' ? 'bg-emerald-50 text-emerald-500' : 
                        'bg-amber-50 text-amber-500'
                      }`}>
                        {item.type}
                      </span>
                    </td>
                    <td className="px-8 py-3">
                      <ProCascader 
                        value={item.associationPath} 
                        onSelect={(path) => updateAssociation(item.id, path)} 
                      />
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          
          <div className="px-8 py-4 bg-slate-50/50 border-t border-slate-100 flex items-center justify-between">
            <p className="text-[11px] font-bold text-slate-400 uppercase tracking-widest">
              共计 {visibleRows.length} 条记录展示中
            </p>
          </div>
        </div>
      </div>
    );
  };

  if (isUploading) {
    return (
      <ProjectFileUploadView 
        phase={uploadPhase} 
        onBack={() => setIsUploading(false)} 
      />
    );
  }

  return (
    <div className="flex-1 flex flex-col h-full bg-white animate-in fade-in duration-500 overflow-hidden">
      <div className="px-8 py-4 border-b border-slate-100 shrink-0 bg-white z-10">
        <button 
          onClick={onBack}
          className="flex items-center space-x-2 px-4 py-2 bg-slate-50 text-slate-600 hover:text-blue-600 hover:bg-blue-50 border border-slate-200 rounded-xl text-sm font-black transition-all active:scale-95"
        >
          <Icon name="ArrowLeft" size={16} strokeWidth={3} />
          <span>返回列表</span>
        </button>
      </div>

      <div className="px-8 bg-slate-50/50 border-b border-slate-100 shrink-0">
        <div className="flex space-x-8">
          {tabs.map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id as any)}
              className={`relative py-4 text-sm font-black transition-all outline-none ${
                activeTab === tab.id ? 'text-blue-600' : 'text-slate-400 hover:text-slate-600'
              }`}
            >
              {tab.label}
              {activeTab === tab.id && (
                <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-blue-600 rounded-full"></div>
              )}
            </button>
          ))}
        </div>
      </div>

      <div className="flex-1 overflow-y-auto px-8 pb-8 pt-2 custom-scrollbar">
        <div className="max-w-[1600px] mx-auto">
          {activeTab === 'file' && (
            <div className="flex flex-col space-y-6 pt-6">
              <div className="flex items-center space-x-4 shrink-0">
                <button 
                  onClick={() => handleStartUpload('招标')}
                  className="flex items-center space-x-2 px-6 py-2.5 bg-blue-500 text-white rounded-xl text-sm font-black shadow-lg shadow-blue-500/20 hover:bg-blue-600 transition-all active:scale-95"
                >
                  <Icon name="Upload" size={16} strokeWidth={3} />
                  <span>招标上传</span>
                </button>
                <button 
                  onClick={() => handleStartUpload('结算')}
                  className="flex items-center space-x-2 px-6 py-2.5 bg-emerald-500 text-white rounded-xl text-sm font-black shadow-lg shadow-emerald-500/20 hover:bg-emerald-600 transition-all active:scale-95"
                >
                  <Icon name="Upload" size={16} strokeWidth={3} />
                  <span>结算上传</span>
                </button>
              </div>

              <div className="border border-slate-100 rounded-[32px] overflow-hidden flex flex-col shadow-sm bg-white">
                <div className="overflow-x-auto">
                  <table className="w-full border-collapse text-left">
                    <thead className="bg-slate-50/80">
                      <tr className="border-b border-slate-100">
                        <th className="px-8 py-5 text-[11px] font-black text-slate-400 uppercase tracking-widest text-center w-20">序号</th>
                        <th className="px-6 py-5 text-[11px] font-black text-slate-400 uppercase tracking-widest">名称</th>
                        <th className="px-6 py-5 text-[11px] font-black text-slate-400 uppercase tracking-widest text-center">阶段</th>
                        <th className="px-6 py-5 text-[11px] font-black text-slate-400 uppercase tracking-widest text-center">文件大小</th>
                        <th className="px-6 py-5 text-[11px] font-black text-slate-400 uppercase tracking-widest text-center">上传人</th>
                        <th className="px-6 py-5 text-[11px] font-black text-slate-400 uppercase tracking-widest text-center">上传时间</th>
                        <th className="px-8 py-5 text-[11px] font-black text-slate-400 uppercase tracking-widest text-center w-64">操作</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-50">
                      {MOCK_FILES.map((file, index) => (
                        <tr key={file.id} className="hover:bg-blue-50/20 transition-all duration-300 group">
                          <td className="px-8 py-5 text-sm text-slate-400 text-center font-bold">{index + 1}</td>
                          <td className="px-6 py-5">
                            <span className="text-slate-700 font-bold text-sm truncate max-w-xs">{file.name}</span>
                          </td>
                          <td className="px-6 py-5 text-center">
                            <span className={`px-3 py-1 rounded-lg text-[10px] font-black ${
                              file.phase === '招标' ? 'bg-blue-50 text-blue-600' : 'bg-emerald-50 text-emerald-600'
                            }`}>
                              {file.phase}
                            </span>
                          </td>
                          <td className="px-6 py-5 text-sm text-slate-500 text-center font-medium">{file.size}</td>
                          <td className="px-6 py-5 text-sm text-slate-600 text-center font-bold">{file.uploader}</td>
                          <td className="px-6 py-5 text-xs text-slate-400 text-center font-bold">{file.uploadTime}</td>
                          <td className="px-8 py-5">
                            <div className="flex items-center justify-center space-x-3">
                              <button className="px-4 py-2 bg-blue-600 text-white rounded-xl text-xs font-black shadow-md shadow-blue-500/10 hover:bg-blue-700 transition-all active:scale-95">
                                下载
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

                <div className="px-8 py-4 bg-slate-50/50 border-t border-slate-100 flex items-center justify-between">
                  <p className="text-[11px] font-bold text-slate-400">共计显示 {MOCK_FILES.length} 条数据</p>
                  <div className="flex items-center space-x-2">
                    <button className="w-8 h-8 rounded-lg border border-slate-200 flex items-center justify-center text-slate-300 hover:bg-white transition-all">
                      <Icon name="ChevronLeft" size={14} />
                    </button>
                    <button className="w-8 h-8 rounded-lg bg-blue-600 text-white flex items-center justify-center text-xs font-black shadow-lg shadow-blue-500/20">1</button>
                    <button className="w-8 h-8 rounded-lg border border-slate-200 flex items-center justify-center text-slate-300 hover:bg-white transition-all">
                      <Icon name="ChevronRight" size={14} />
                    </button>
                  </div>
                </div>
              </div>
            </div>
          )}

          {activeTab === 'pro' && renderProTab()}

          {activeTab === 'compare' && renderCompareTab()}
        </div>
      </div>
    </div>
  );
};

export default ProjectDetailView;