import React, { useState, useMemo, useRef, useEffect } from 'react';
import Icon from './Icon';

interface DetailedCompareRow {
  id: string;
  index: number;
  // 基础数据
  unitPrice: number;
  totalPrice: number;
  // 审核结果
  diffQty: number;
  diffPrice: number;
  diffTotal: number;
  reductionRate: string;
  auditType: '修改' | '新增' | '删除' | '不变';
  adjustType: string;
  remarks: string;
  // 增减分析
  increaseAmt: number;
  isEffectiveIncrease: boolean;
  decreaseAmt: number;
  decreaseRate: string;
}

const MOCK_DATA: DetailedCompareRow[] = [
  {
    id: '1', index: 1,
    unitPrice: 16435.9, totalPrice: 16435.90,
    diffQty: -1, diffPrice: 0, diffTotal: -16435.90, reductionRate: '-50.00%', 
    auditType: '修改', adjustType: '调量', remarks: '根据现场实际栽植数量核减',
    increaseAmt: 0, isEffectiveIncrease: false, decreaseAmt: 16435.90, decreaseRate: '-50.00%'
  },
  {
    id: '2', index: 2,
    unitPrice: 18000, totalPrice: 72000.00,
    diffQty: -1, diffPrice: -3000.9, diffTotal: -33004.50, reductionRate: '-31.43%', 
    auditType: '修改', adjustType: '调量+调价', remarks: '市场询价下调单价',
    increaseAmt: 0, isEffectiveIncrease: false, decreaseAmt: 33004.50, decreaseRate: '-31.43%'
  },
  {
    id: '3', index: 3,
    unitPrice: 500, totalPrice: 5000.00,
    diffQty: 10, diffPrice: 500, diffTotal: 5000.00, reductionRate: '0.00%', 
    auditType: '新增', adjustType: '新增项', remarks: '补充设计变更增加项',
    increaseAmt: 5000.00, isEffectiveIncrease: true, decreaseAmt: 0, decreaseRate: '0.00%'
  },
  {
    id: '4', index: 4,
    unitPrice: 0, totalPrice: 0.00,
    diffQty: -2, diffPrice: -800, diffTotal: -1600.00, reductionRate: '-100.00%', 
    auditType: '删除', adjustType: '删除项', remarks: '取消该区域景观布置',
    increaseAmt: 0, isEffectiveIncrease: false, decreaseAmt: 1600.00, decreaseRate: '-100.00%'
  },
  {
    id: '5', index: 5,
    unitPrice: 100, totalPrice: 1000.00,
    diffQty: 0, diffPrice: 0, diffTotal: 0.00, reductionRate: '0.00%', 
    auditType: '不变', adjustType: '-', remarks: '',
    increaseAmt: 0, isEffectiveIncrease: false, decreaseAmt: 0, decreaseRate: '0.00%'
  }
];

const MODAL_SHEETS = [
  '表10.2.2-16 分部分项工程清单与计价表【1#楼】',
  '表10.2.2-16 分部分项工程清单与计价表【2#楼】',
  '表10.2.2-17 措施项目清单',
  '表10.2.2-18 其他项目清单',
  '表10.2.2-19 规费、税金清单'
];

interface DataRangeConfig {
  id: string;
  label: string;
  value: number;
}

interface ReportParam {
  id: string;
  name: string;
  content: string;
}

const AUDIT_TYPE_OPTIONS = ['新增', '删除', '修改', '不变'];

const PriceFileCompareView2: React.FC = () => {
  const [file1, setFile1] = useState<string | null>(null);
  const [file2, setFile2] = useState<string | null>(null);
  const [sheetSearch, setSheetSearch] = useState('');
  const [isSheetListCollapsed, setIsSheetListCollapsed] = useState(false);
  const [data, setData] = useState<DetailedCompareRow[]>(MOCK_DATA);
  
  // 弹窗状态
  const [isReportModalOpen, setIsReportModalOpen] = useState(false);
  const [modalSelectedSheets, setModalSelectedSheets] = useState<Set<number>>(new Set([0]));

  // 参数设置弹窗状态
  const [isConfigModalOpen, setIsConfigModalOpen] = useState(false);
  const [reportParams, setReportParams] = useState<ReportParam[]>([
    { id: '1', name: '调量', content: '[项目名称]送审工程量[X1][单位]，审核工程量[X2][单位]，工程量差[A1][单位]。送审合价[Y1]元，审核合价[Y2]元，合价差额约[B1]元;' },
    { id: '2', name: '调价', content: '[项目名称]送审单价[Z1]元，审核单价[Z2]元，单价差[C1]元。送审合价[Y1]元，审核合价[Y2]元，合价差额约[B1]元;' },
    { id: '3', name: '调量+调价', content: '[项目名称]送审工程量[X1][单位]，审核工程量[X2][单位]，工程量差[A1][单位]。送审单价[Z1]元，审核单价[Z2]元，单价差[C1]元。送审合价[Y1]元，审核合价[Y2]元，合价差额约[B1]元;' }
  ]);

  // 数据范围下拉状态
  const [isDataRangeOpen, setIsDataRangeOpen] = useState(false);
  const dataRangeRef = useRef<HTMLDivElement>(null);
  const [rangeConfigs, setRangeConfigs] = useState<DataRangeConfig[]>([
    { id: 'dec-p', label: '审减百分比 (%)', value: -1 },
    { id: 'inc-p', label: '审增百分比 (%)', value: 1 },
    { id: 'dec-a', label: '审减金额 (元)', value: -100 },
    { id: 'inc-a', label: '审增金额 (元)', value: 100 },
  ]);
  // 暂存值用于取消操作
  const [tempRangeConfigs, setTempRangeConfigs] = useState<DataRangeConfig[]>([]);

  // 审核类型下拉状态
  const [isAuditTypeDropdownOpen, setIsAuditTypeDropdownOpen] = useState(false);
  const auditTypeRef = useRef<HTMLDivElement>(null);
  const [selectedAuditTypes, setSelectedAuditTypes] = useState<Set<string>>(new Set(AUDIT_TYPE_OPTIONS));

  const updateRangeValue = (id: string, val: string) => {
    const num = parseFloat(val) || 0;
    setTempRangeConfigs(prev => prev.map(c => id === c.id ? { ...c, value: num } : c));
  };

  const handleOpenDataRange = () => {
    setTempRangeConfigs([...rangeConfigs]);
    setIsDataRangeOpen(true);
  };

  const applyDataRange = () => {
    setRangeConfigs([...tempRangeConfigs]);
    setIsDataRangeOpen(false);
    // 这里可以触发数据过滤逻辑
  };

  const toggleAuditType = (type: string) => {
    setSelectedAuditTypes(prev => {
      const next = new Set(prev);
      if (next.has(type)) next.delete(type);
      else next.add(type);
      return next;
    });
  };

  const toggleAllAuditTypes = () => {
    if (selectedAuditTypes.size === AUDIT_TYPE_OPTIONS.length) {
      setSelectedAuditTypes(new Set());
    } else {
      setSelectedAuditTypes(new Set(AUDIT_TYPE_OPTIONS));
    }
  };

  const handleReportParamChange = (id: string, val: string) => {
    setReportParams(prev => prev.map(p => p.id === id ? { ...p, content: val } : p));
  };

  // 点击外部关闭下拉
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dataRangeRef.current && !dataRangeRef.current.contains(event.target as Node)) {
        setIsDataRangeOpen(false);
      }
      if (auditTypeRef.current && !auditTypeRef.current.contains(event.target as Node)) {
        setIsAuditTypeDropdownOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const getAuditTypeStyles = (type: string) => {
    switch (type) {
      case '修改': return 'bg-[#fffbeb] text-[#b45309]';
      case '新增': return 'bg-[#ecfdf5] text-[#047857]';
      case '删除': return 'bg-[#fff1f2] text-[#be123c]';
      case '不变': return 'bg-slate-100 text-slate-500';
      default: return 'bg-slate-100 text-slate-500';
    }
  };

  const getRowBgColor = (type: string) => {
    switch (type) {
      case '修改': return 'bg-[#fffdf4]';
      case '新增': return 'bg-[#f7fffb]';
      case '删除': return 'bg-[#fff9fa]';
      default: return 'bg-white';
    }
  };

  const formatPrice = (p: number) => p === 0 ? '0.00' : p.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 });

  const toggleModalFolder = () => {
    if (modalSelectedSheets.size === MODAL_SHEETS.length) {
      setModalSelectedSheets(new Set());
    } else {
      setModalSelectedSheets(new Set(MODAL_SHEETS.map((_, i) => i)));
    }
  };

  const toggleModalSheet = (index: number) => {
    const next = new Set(modalSelectedSheets);
    if (next.has(index)) next.delete(index);
    else next.add(index);
    setModalSelectedSheets(next);
  };

  const renderConfigModal = () => {
    if (!isConfigModalOpen) return null;
    return (
      <div className="fixed inset-0 z-[300] flex items-center justify-center bg-black/45 backdrop-blur-sm p-4 animate-in fade-in duration-200">
        <div className="bg-white rounded-lg shadow-2xl w-full max-w-4xl overflow-hidden flex flex-col animate-in zoom-in-95 duration-200 border border-slate-200">
          <div className="px-6 py-4 border-b border-slate-100 flex items-center justify-between shrink-0 bg-white">
            <h3 className="text-lg font-bold text-slate-800">参数设置</h3>
            <button onClick={() => setIsConfigModalOpen(false)} className="text-slate-300 hover:text-slate-600 transition-colors"><Icon name="X" size={24} /></button>
          </div>
          <div className="flex-1 overflow-y-auto">
            <table className="w-full border-collapse">
              <thead className="sticky top-0 z-10 bg-slate-50 border-b border-slate-200">
                <tr className="text-xs font-black text-slate-500 text-center">
                  <th className="w-24 px-4 py-3 border-r border-slate-200">参数名称</th>
                  <th className="px-4 py-3">报告内容</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {reportParams.map((param) => (
                  <tr key={param.id} className="group">
                    <td className="px-6 py-4 border-r border-slate-100 text-sm font-bold text-slate-700 bg-slate-50/30">
                      <div className="flex items-center space-x-2">
                        <Icon name="ChevronRight" size={14} className="text-slate-300" />
                        <span>{param.name}</span>
                      </div>
                    </td>
                    <td className="p-0">
                      <textarea 
                        value={param.content}
                        onChange={(e) => handleReportParamChange(param.id, e.target.value)}
                        className="w-full h-24 p-4 text-[13px] leading-relaxed text-slate-900 font-medium bg-transparent focus:bg-blue-50/30 outline-none transition-all resize-none"
                      />
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <div className="px-8 py-6 border-t border-slate-100 flex items-center justify-end space-x-4 bg-slate-50/30">
             <button onClick={() => setIsConfigModalOpen(false)} className="px-8 py-2 bg-white border border-slate-200 rounded-lg text-sm font-bold text-slate-600 hover:bg-slate-100 transition-all">取消</button>
             <button onClick={() => { alert('参数已保存'); setIsConfigModalOpen(false); }} className="px-10 py-2 bg-blue-600 text-white rounded-lg text-sm font-black shadow-lg shadow-blue-500/20 hover:bg-blue-700 transition-all active:scale-95">确定</button>
          </div>
        </div>
      </div>
    );
  };

  const renderReportModal = () => {
    if (!isReportModalOpen) return null;
    const isAllSelected = modalSelectedSheets.size === MODAL_SHEETS.length;
    const isIndeterminate = modalSelectedSheets.size > 0 && modalSelectedSheets.size < MODAL_SHEETS.length;
    
    const isAllAuditSelected = selectedAuditTypes.size === AUDIT_TYPE_OPTIONS.length;
    const isAuditIndeterminate = selectedAuditTypes.size > 0 && selectedAuditTypes.size < AUDIT_TYPE_OPTIONS.length;

    return (
      <div className="fixed inset-0 z-[200] flex items-center justify-center bg-black/45 backdrop-blur-sm p-4 animate-in fade-in duration-200">
        <div className="bg-white rounded-[32px] shadow-2xl w-full max-w-7xl h-[88vh] flex flex-col animate-in zoom-in-95 duration-200 overflow-hidden border border-slate-200">
          <div className="px-10 py-5 border-b border-slate-100 flex items-center justify-between shrink-0 bg-white relative">
            <h2 className="text-xl font-black text-slate-800 tracking-tight">增减分析报告</h2>
            <button 
              onClick={() => setIsReportModalOpen(false)} 
              className="w-10 h-10 flex items-center justify-center text-slate-300 hover:text-rose-500 hover:bg-rose-50 rounded-full transition-all outline-none"
            >
              <Icon name="X" size={24} />
            </button>
          </div>

          <div className="flex-1 flex overflow-hidden">
            <div className="w-72 border-r border-slate-100 flex flex-col shrink-0 bg-[#fbfcfd]">
              <div className="p-6 pb-4">
                <h3 className="text-xs font-black text-slate-400 uppercase tracking-[0.2em] mb-4 ml-1">页签目录</h3>
                <div className="relative group">
                  <Icon name="Search" size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-300" />
                  <input 
                    type="text" 
                    placeholder="搜索Sheet名称" 
                    className="w-full h-9 bg-white border border-slate-200 rounded-xl pl-9 pr-3 text-xs font-bold focus:outline-none focus:border-blue-400 transition-all shadow-sm" 
                  />
                </div>
              </div>
              
              <div className="flex-1 overflow-y-auto custom-scrollbar p-3 pt-0 space-y-1">
                 <div 
                    onClick={toggleModalFolder}
                    className="flex items-center p-2.5 text-slate-600 space-x-3 bg-white/50 rounded-xl mb-1 cursor-pointer hover:bg-white group/folder"
                  >
                    <Icon name="ChevronDown" size={14} className="text-slate-400" />
                    <div className={`w-4 h-4 border-2 rounded flex items-center justify-center transition-all shrink-0 ${isAllSelected || isIndeterminate ? 'bg-blue-600 border-blue-600' : 'bg-white border-slate-300 group-hover/folder:border-blue-400'}`}>
                      {isAllSelected && <Icon name="Check" size={10} className="text-white" strokeWidth={5} />}
                      {isIndeterminate && <div className="w-2 h-[2px] bg-white rounded-full"></div>}
                    </div>
                    <Icon name="Folder" size={14} className="text-blue-500" fill="currentColor" />
                    <span className="text-xs font-black text-slate-700">项目 Sheet 列表</span>
                 </div>

                 <div className="pl-9 space-y-0.5">
                   {MODAL_SHEETS.map((name, i) => {
                     const isSelected = modalSelectedSheets.has(i);
                     return (
                       <div 
                         key={i} 
                         onClick={() => toggleModalSheet(i)}
                         className={`flex items-center p-2.5 space-x-3 rounded-xl cursor-pointer transition-all ${isSelected ? 'bg-blue-50 text-blue-600' : 'hover:bg-white text-slate-500'} group/sheet`}
                        >
                          <div className={`w-4 h-4 border-2 rounded flex items-center justify-center transition-all shrink-0 ${isSelected ? 'bg-blue-600 border-blue-600' : 'bg-white border-slate-300 group-hover/sheet:border-blue-400'}`}>
                            {isSelected && <Icon name="Check" size={10} className="text-white" strokeWidth={5} />}
                          </div>
                          <span className="text-[11px] font-bold truncate leading-none">{name}</span>
                       </div>
                     );
                   })}
                 </div>
              </div>
            </div>

            <div className="flex-1 flex flex-col bg-[#f5f7f9] overflow-hidden px-8 pt-4 pb-8 relative">
               <div className="flex items-center justify-end space-x-3 mb-3 shrink-0">
                  {/* 审核类型多选下拉 */}
                  <div className="relative" ref={auditTypeRef}>
                    <button 
                      onClick={() => setIsAuditTypeDropdownOpen(!isAuditTypeDropdownOpen)}
                      className={`flex items-center space-x-2 px-4 py-1.5 rounded-full text-[11px] font-black transition-all shadow-sm outline-none active:scale-95 ${isAuditTypeDropdownOpen ? 'bg-blue-600 text-white shadow-lg' : 'bg-white border border-blue-200 text-blue-600 hover:bg-blue-50 hover:border-blue-400'}`}
                    >
                      <Icon name="ListFilter" size={12} />
                      <span>审核类型</span>
                      <Icon name="ChevronDown" size={10} className={`transition-transform ${isAuditTypeDropdownOpen ? 'rotate-180' : ''}`} />
                    </button>

                    {isAuditTypeDropdownOpen && (
                      <div className="absolute top-full right-0 mt-2 w-48 bg-white rounded-xl shadow-2xl border border-slate-200 z-[210] overflow-hidden animate-in fade-in zoom-in-95 duration-200">
                        <div 
                          onClick={toggleAllAuditTypes}
                          className="flex items-center px-4 py-2.5 bg-slate-50 border-b border-slate-100 cursor-pointer hover:bg-slate-100 transition-colors group"
                        >
                          <div className={`w-4 h-4 rounded border-2 flex items-center justify-center transition-all shrink-0 ${isAllAuditSelected || isAuditIndeterminate ? 'bg-blue-600 border-blue-600' : 'bg-white border-slate-300'}`}>
                            {isAllAuditSelected && <Icon name="Check" size={10} className="text-white" strokeWidth={5} />}
                            {isAuditIndeterminate && <div className="w-2 h-[2px] bg-white rounded-full"></div>}
                          </div>
                          <span className="ml-3 text-[11px] font-black text-slate-500 uppercase tracking-widest">全选状态</span>
                        </div>
                        <div className="py-1">
                          {AUDIT_TYPE_OPTIONS.map((type) => (
                            <div 
                              key={type}
                              onClick={() => toggleAuditType(type)}
                              className="flex items-center px-4 py-2.5 hover:bg-slate-50 cursor-pointer transition-colors group"
                            >
                              <div className={`w-4 h-4 rounded border-2 flex items-center justify-center transition-all shrink-0 ${selectedAuditTypes.has(type) ? 'bg-blue-600 border-blue-600' : 'bg-white border-slate-300 group-hover:border-blue-400'}`}>
                                {selectedAuditTypes.has(type) && <Icon name="Check" size={10} className="text-white" strokeWidth={5} />}
                              </div>
                              <span className={`ml-3 text-xs font-bold ${selectedAuditTypes.has(type) ? 'text-blue-600' : 'text-slate-600'}`}>{type}</span>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>

                  {/* 数据范围下拉 */}
                  <div className="relative" ref={dataRangeRef}>
                    <button 
                      onClick={handleOpenDataRange}
                      className={`flex items-center space-x-2 px-4 py-1.5 rounded-full text-[11px] font-black transition-all shadow-sm outline-none active:scale-95 ${isDataRangeOpen ? 'bg-blue-600 text-white shadow-lg' : 'bg-white border border-blue-200 text-blue-600 hover:bg-blue-50 hover:border-blue-400'}`}
                    >
                      <Icon name="Database" size={12} />
                      <span>数据范围</span>
                      <Icon name="ChevronDown" size={10} className={`transition-transform ${isDataRangeOpen ? 'rotate-180' : ''}`} />
                    </button>

                    {isDataRangeOpen && (
                      <div className="absolute top-full right-0 mt-2 w-80 bg-white rounded-2xl shadow-2xl border border-slate-200 z-[210] overflow-hidden animate-in fade-in zoom-in-95 duration-200 flex flex-col">
                        <div className="flex bg-slate-50/80 border-b border-slate-100 shrink-0">
                          <div className="flex-1 px-5 py-3 text-[11px] font-black text-slate-400 uppercase tracking-widest flex items-center space-x-2">
                             <Icon name="Filter" size={12} className="text-blue-500" />
                             <span>条件名称</span>
                          </div>
                          <div className="w-24 px-5 py-3 text-[11px] font-black text-slate-400 uppercase tracking-widest text-center border-l border-slate-100">目标值</div>
                        </div>
                        <div className="divide-y divide-slate-50 flex-1 py-1">
                          {tempRangeConfigs.map((config) => (
                            <div 
                              key={config.id} 
                              className="flex items-center hover:bg-slate-50/50 transition-colors group"
                            >
                              <div className="flex-1 px-5 py-3.5">
                                <span className="text-xs font-bold text-slate-600 group-hover:text-blue-600 transition-colors">{config.label}</span>
                              </div>
                              <div className="w-24 px-3 flex items-center justify-center">
                                <div className="relative w-full">
                                  <input 
                                    type="number" 
                                    value={config.value} 
                                    onChange={(e) => updateRangeValue(config.id, e.target.value)}
                                    className={`w-full h-8 bg-white border border-slate-200 rounded-lg text-center text-[12px] font-black outline-none transition-all focus:border-blue-400 focus:ring-4 focus:ring-blue-500/5 ${config.id.startsWith('dec') ? 'text-rose-500 focus:text-rose-600' : 'text-emerald-600 focus:text-emerald-600'}`}
                                  />
                                </div>
                              </div>
                            </div>
                          ))}
                        </div>
                        <div className="px-5 py-4 border-t border-slate-100 bg-slate-50/80 flex items-center justify-end space-x-3">
                           <button 
                            onClick={() => setIsDataRangeOpen(false)}
                            className="px-5 py-2 bg-white border border-slate-200 rounded-xl text-[11px] font-black text-slate-500 hover:bg-slate-100 hover:text-slate-700 transition-all uppercase tracking-widest outline-none active:scale-95"
                           >
                            取消
                           </button>
                           <button 
                            onClick={applyDataRange}
                            className="px-6 py-2 bg-blue-600 text-white rounded-xl text-[11px] font-black shadow-lg shadow-blue-500/20 hover:bg-blue-700 transition-all uppercase tracking-widest outline-none active:scale-95"
                           >
                            应用筛选
                           </button>
                        </div>
                      </div>
                    )}
                  </div>

                  <button 
                    onClick={() => setIsConfigModalOpen(true)}
                    className="flex items-center space-x-2 px-4 py-1.5 bg-white border border-blue-200 text-blue-600 rounded-full text-[11px] font-black hover:bg-blue-50 hover:border-blue-400 transition-all shadow-sm outline-none active:scale-95"
                  >
                    <Icon name="Settings" size={12} />
                    <span>参数设置</span>
                  </button>
               </div>
               
               <div className="flex-1 bg-white border border-slate-200 rounded-[32px] p-8 overflow-y-auto custom-scrollbar shadow-[inset_0_2px_4px_rgba(0,0,0,0.02)]">
                  <div className="max-w-4xl mx-auto text-[14px] leading-[2.2] text-slate-700 whitespace-pre-wrap font-sans">
景观工程[安装工程]审核说明：
分部分项清单审增明细
PE给水管(热熔连接) DN65-0.8MPa送审工程量56.69m，审核工程量45.00m，工程量差-11.69m。送审合价2485.29元，审核合价1972.80元，合价差额约-512.49元;P给水管(热熔连接) DN50-0aMP。送审工程盘94543m,审核工程量80.0.m,工程量差:-1543m.送审单价13274元，审校单价2700元，单价-574元,送审合价395338元，审核合价22410.00元，合价港额约-654338元台水管(热熔连接) DN25-08MPa送审工屋量18.75m，审核工程量18.0.m,工程量差.0.75m。送审单价2031元，审核单价18:00元，单价-231元。送审合价138081元，审核合价32400元，合价差额约-5681元:PE花管(多孔布水)DN65 孔径425@100送审单价38.80元，审核单价35.90元，单价差-2.90元。送审合价42.29元，审核合价39.13元，合价差额约-3.16元;PE给水管(热熔连接)DN65-1.0MPa送审单价46.91元，审核单价46.00元，单价差-0.91元。送审合价103.67元，审核合价101.66元，合价差额约-2.01元;、PE给水管(热熔连接)DN80-0.8MPa送审工程量285.87m，审核工程量300.00m,工程量差14.13m。送审合价13607.41元，审核合价14280.00元，合价差额约672.59元:

主要材料审核明细：
04不锈钢挂件送审工程量106.00个，审核工程量100.00个，工程量差-6.00个。送审单价5.00元，审核单价5,00元，单价差5.00元。送审合价530.00元，审核合价:400.00元，合价差额约-130,00元，304不锈钢丝网，丝径0.mm,孔径6m送审工程量1.09m2,审技工程盘15.0m2,工程最差2.9m2.送审单价7.00元，审核单价7.00元，单价差7.00元。送审合价i84.63元，审核合价90.00元，台差额约5.37元,HDPE双壁波纹管 DN200)送审工程量491..m，审技工程量450.0.m,工程量差-41..m。送审单价:40.00元，审核单价40.00元，单价40.00元。送审合价1967600元，审核合价15750.00元，合价差额约-392600元

景观工程[绿化植物]审核说明：
部分项清单审增明细
栽植填朴T胸径430cm送审工程量2.00株，审核工程量1.00株，工程量差-1.00株。送审合价32871.80元，审核合价16435.90元,合价差额约-16435.90元;裁酒蓝安度T胸强4300m送工保量500栋，校工盘4.00栋,工程盘.1.00栋，送单价2100090元，校单价16:00.00元,单价-480.90元.送合价1050450元，年核合价64000元，台价要额约:-40204.50元栽植狐尾椰子A胸径430cm送审工程量13.00株，审核工程量12.00株，工程量差-1.00株。送审合价40311.70元，审核合价37210.80元，合价差额约-3100.90元;栽檀香樟A胸径422-23cm送审单价4390.22元，审核单价4200.00元，单价差-190.22元。送审合价79023.96元，审核合价75600.00元，合价差额约-3423.96元:
                  </div>
               </div>

               <div className="flex justify-end pt-6 shrink-0">
                 <button className="group relative px-12 py-3.5 bg-blue-600 text-white rounded-[20px] font-black text-sm shadow-xl hover:bg-blue-700 transition-all active:scale-95 uppercase tracking-widest flex items-center space-x-3">
                   <Icon name="Download" size={16} />
                   <span>导出报告</span>
                 </button>
               </div>
            </div>
          </div>
        </div>
      </div>
    );
  };

  return (
    <div className="flex flex-col h-full bg-white overflow-hidden text-slate-900">
      <div className="px-8 py-4 border-b border-slate-100 flex items-center justify-between bg-white shrink-0 z-20 shadow-sm">
        <div className="flex items-center space-x-6 flex-1 max-w-5xl">
          <div className="flex-1 flex items-center space-x-3 bg-slate-50/50 p-1.5 rounded-2xl border border-slate-100">
            <span className="text-[11px] font-black text-slate-400 uppercase tracking-widest px-2 shrink-0">送审文件</span>
            <div className="flex-1 h-9 bg-white border border-slate-200 rounded-xl px-4 flex items-center relative group overflow-hidden">
               <input 
                type="text" 
                placeholder="请输入送审计价文件" 
                value={file1 || ''}
                readOnly
                className="w-full h-full text-xs font-bold text-slate-700 outline-none bg-transparent"
               />
            </div>
            <button onClick={() => setFile1('示例工程_送审.xlsx')} className="px-5 py-1.5 bg-blue-600 text-white rounded-xl text-xs font-black shadow-lg hover:bg-blue-700 transition-all shrink-0">导入</button>
          </div>
          
          <div className="flex-1 flex items-center space-x-3 bg-slate-50/50 p-1.5 rounded-2xl border border-slate-100">
            <span className="text-[11px] font-black text-slate-400 uppercase tracking-widest px-2 shrink-0">审核文件</span>
            <div className="flex-1 h-9 bg-white border border-slate-200 rounded-xl px-4 flex items-center relative group overflow-hidden">
               <input 
                type="text" 
                placeholder="请输入审核计价文件" 
                value={file2 || ''}
                readOnly
                className="w-full h-full text-xs font-bold text-slate-700 outline-none bg-transparent"
               />
            </div>
            <button onClick={() => setFile2('示例工程_审核.xlsx')} className="px-5 py-1.5 bg-blue-600 text-white rounded-xl text-xs font-black shadow-lg hover:bg-blue-700 transition-all shrink-0">导入</button>
          </div>
        </div>
        
        <button className="ml-10 px-10 py-3.5 bg-slate-400 text-white font-black text-sm rounded-[20px] shadow-xl hover:bg-blue-600 transition-all active:scale-95 tracking-widest uppercase">
          开始对比
        </button>
      </div>

      <div className="flex-1 flex overflow-hidden">
        <div className={`${isSheetListCollapsed ? 'w-0' : 'w-64'} bg-[#fdfdfd] border-r border-slate-200 flex flex-col shrink-0 transition-all duration-300 relative z-10`}>
          <button onClick={() => setIsSheetListCollapsed(!isSheetListCollapsed)} className="absolute top-1/2 -right-3 -translate-y-1/2 w-6 h-12 bg-white border border-slate-200 rounded-full shadow-md text-slate-400 hover:text-blue-600 flex items-center justify-center transition-all z-20 outline-none">
            <Icon name={isSheetListCollapsed ? "ChevronRight" : "ChevronLeft"} size={14} />
          </button>
          <div className={`flex flex-col h-full overflow-hidden ${isSheetListCollapsed ? 'opacity-0' : 'opacity-100'}`}>
            <div className="p-4 border-b border-slate-50 bg-slate-50/20"><h3 className="text-xs font-black text-slate-800 uppercase tracking-widest">页签列表</h3></div>
            <div className="p-4">
              <div className="relative group">
                <Icon name="Search" size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-300 group-focus-within:text-blue-500" />
                <input type="text" placeholder="搜索Sheet名称" value={sheetSearch} onChange={(e) => setSheetSearch(e.target.value)} className="w-full h-9 bg-white border border-slate-200 rounded-lg pl-9 pr-3 text-xs focus:outline-none focus:border-blue-400 transition-all shadow-sm" />
              </div>
            </div>
            <div className="flex-1 overflow-y-auto p-2">
              <div className="flex items-center p-2 text-slate-600 space-x-2">
                <Icon name="ChevronDown" size={14} className="text-slate-400" />
                <Icon name="Folder" size={16} className="text-blue-400" fill="currentColor" />
                <span className="text-[12px] font-bold">项目 Sheet 列表</span>
              </div>
              <div className="pl-6 space-y-1">
                {['表10.2.2-16 分部分项...', '表10.2.2-16 分部分项...', '表10.2.2-17 措施项目...', '表10.2.2-18 其他项目...', '表10.2.2-19 规费、税金...'].map((name, i) => (
                  <div key={i} className={`flex items-center p-2.5 space-x-3 rounded-lg cursor-pointer ${i === 0 ? 'bg-blue-50/80 text-blue-600 font-bold border-r-2 border-blue-500' : 'text-slate-500 hover:bg-slate-50'}`}>
                    <div className={`w-4 h-4 border-2 rounded flex items-center justify-center ${i === 0 ? 'bg-blue-600 border-blue-600' : 'bg-white border-slate-200'}`}>
                      {i === 0 && <Icon name="Check" size={10} className="text-white" strokeWidth={5} />}
                    </div>
                    <Icon name="FileText" size={14} className={i === 0 ? 'text-blue-600' : 'text-slate-300'} />
                    <span className="text-[11px] truncate flex-1">{name}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>

        <div className="flex-1 flex flex-col bg-white overflow-hidden">
          <div className="px-4 py-2 border-b border-slate-100 bg-slate-50/30 flex items-center justify-end space-x-3 shrink-0">
             <button className="flex items-center space-x-1.5 px-4 py-1.5 bg-white border border-slate-200 text-slate-600 rounded-xl text-xs font-bold hover:bg-slate-50 transition-all shadow-sm outline-none">
                <Icon name="Link2" size={14} />
                <span>数据对应</span>
             </button>
             <button className="flex items-center space-x-1.5 px-4 py-1.5 bg-white border border-[#40a9ff] text-[#40a9ff] rounded-xl text-xs font-black hover:bg-blue-50 transition-all shadow-sm outline-none">
                <Icon name="Settings2" size={14} />
                <span>自定义对比</span>
             </button>
             <button className="flex items-center space-x-1.5 px-5 py-1.5 bg-blue-600 text-white rounded-xl text-xs font-black shadow-md hover:bg-blue-700 transition-all active:scale-95 outline-none">
                <Icon name="Download" size={14} />
                <span>导出对比表格</span>
             </button>
             <button 
                onClick={() => setIsReportModalOpen(true)}
                className="flex items-center space-x-1.5 px-5 py-1.5 bg-blue-600 text-white rounded-xl text-xs font-black shadow-md hover:bg-blue-700 transition-all active:scale-95 outline-none"
             >
                <Icon name="FileBarChart" size={14} />
                <span>增减分析报告</span>
             </button>
          </div>

          <div className="flex-1 overflow-auto custom-scrollbar">
             <table className="w-full border-collapse text-[11px] min-w-[1400px]">
                <thead>
                  <tr className="bg-slate-50 border-b border-slate-200 font-bold text-slate-600 text-center">
                    <th rowSpan={2} className="w-10 border-r border-slate-200 bg-white sticky left-0 z-20"></th>
                    <th colSpan={2} className="px-3 py-2 border-r border-slate-200">基础数据</th>
                    <th colSpan={7} className="px-3 py-2 border-r border-slate-200 bg-[#E8F5E9]/30">审核结果</th>
                    <th colSpan={4} className="px-3 py-2 bg-blue-50 text-blue-700">增减分析 <Icon name="ChevronLeft" size={12} className="inline ml-1 text-blue-400" /></th>
                  </tr>
                  <tr className="bg-slate-50 border-b border-slate-200 font-bold text-slate-500 text-center">
                    <th className="w-24 px-3 py-2 border-r border-slate-100">综合单价</th>
                    <th className="w-24 px-3 py-2 border-r border-slate-200">合价</th>
                    
                    <th className="w-20 px-3 py-2 border-r border-slate-100 bg-[#E8F5E9]/50">量差</th>
                    <th className="w-24 px-3 py-2 border-r border-slate-100 bg-[#E8F5E9]/50">价差</th>
                    <th className="w-24 px-3 py-2 border-r border-slate-100 bg-[#E8F5E9]/50">合价差</th>
                    <th className="w-24 px-3 py-2 border-r border-slate-100 bg-[#E8F5E9]/50">审减率</th>
                    <th className="w-20 px-3 py-2 border-r border-slate-100 bg-[#E8F5E9]/50">审核类型</th>
                    <th className="w-24 px-3 py-2 border-r border-slate-100 bg-[#E8F5E9]/50">调整类型</th>
                    <th className="w-48 px-3 py-2 border-r border-slate-200 bg-[#E8F5E9]/50">增减说明</th>

                    <th className="w-24 px-3 py-2 border-r border-blue-100 bg-blue-50 text-blue-700">核增额</th>
                    <th className="w-20 px-3 py-2 border-r border-blue-100 bg-blue-50 text-blue-700">有效核增</th>
                    <th className="w-24 px-3 py-2 border-r border-blue-100 bg-blue-50 text-blue-700">核减额</th>
                    <th className="w-20 px-3 py-2 bg-blue-50 text-blue-700">核减率</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {data.map((row) => (
                    <tr key={row.id} className={`${getRowBgColor(row.auditType)} hover:bg-blue-50/50 transition-colors group`}>
                      <td className="text-center font-bold border-r border-slate-200 sticky left-0 z-10 bg-white group-hover:bg-blue-50 text-slate-400">{row.index}</td>
                      <td className="px-3 py-3 border-r border-slate-100 text-right text-slate-700 font-medium">{formatPrice(row.unitPrice)}</td>
                      <td className="px-3 py-3 border-r border-slate-200 text-right text-slate-900 font-black">{formatPrice(row.totalPrice)}</td>
                      
                      <td className={`px-3 py-3 border-r border-slate-100 text-center font-black ${row.diffQty < 0 ? 'text-rose-500' : row.diffQty > 0 ? 'text-emerald-600' : 'text-slate-400'}`}>{row.diffQty || '0'}</td>
                      <td className={`px-3 py-3 border-r border-slate-100 text-right font-black ${row.diffPrice < 0 ? 'text-rose-500' : row.diffPrice > 0 ? 'text-emerald-600' : 'text-slate-400'}`}>{row.diffPrice === 0 ? '0' : formatPrice(row.diffPrice)}</td>
                      <td className={`px-3 py-3 border-r border-slate-100 text-right font-black ${row.diffTotal < 0 ? 'text-rose-500' : row.diffTotal > 0 ? 'text-emerald-600' : 'text-slate-400'}`}>{formatPrice(row.diffTotal)}</td>
                      <td className={`px-3 py-3 border-r border-slate-100 text-center font-bold ${row.reductionRate.startsWith('-') ? 'text-rose-500' : 'text-slate-400'}`}>{row.reductionRate}</td>
                      <td className="px-3 py-3 border-r border-slate-100 text-center">
                        <span className={`px-2 py-0.5 rounded text-[9px] font-black uppercase ${getAuditTypeStyles(row.auditType)}`}>{row.auditType}</span>
                      </td>
                      <td className="px-3 py-3 border-r border-slate-100 text-center text-slate-500 truncate">{row.adjustType}</td>
                      <td className="px-3 py-3 border-r border-slate-200 text-slate-600 group relative">
                        <div className="flex items-center space-x-1">
                          <span className="truncate flex-1">{row.remarks || <span className="text-slate-300 italic">点击输入...</span>}</span>
                          <Icon name="Edit3" size={12} className="text-slate-300 group-hover:text-blue-500 cursor-pointer" />
                        </div>
                      </td>

                      <td className="px-3 py-3 border-r border-blue-100 text-right font-black text-emerald-600 bg-blue-50/20">{row.increaseAmt > 0 ? formatPrice(row.increaseAmt) : ''}</td>
                      <td className="px-3 py-3 border-r border-blue-100 text-center bg-blue-50/20">
                        <div className="flex justify-center">
                          <div className={`w-4 h-4 border-2 rounded flex items-center justify-center transition-all ${row.isEffectiveIncrease ? 'bg-blue-600 border-blue-600' : 'bg-white border-slate-300 group-hover:border-blue-400'}`}>
                            {row.isEffectiveIncrease && <Icon name="Check" size={10} className="text-white" strokeWidth={5} />}
                          </div>
                        </div>
                      </td>
                      <td className="px-3 py-3 border-r border-blue-100 text-right font-black text-rose-500 bg-blue-50/20">{row.decreaseAmt > 0 ? formatPrice(row.decreaseAmt) : ''}</td>
                      <td className="px-3 py-3 text-center font-bold text-rose-500 bg-blue-50/20">{row.decreaseAmt > 0 ? row.decreaseRate : ''}</td>
                    </tr>
                  ))}
                </tbody>
             </table>
          </div>
        </div>
      </div>
      {renderReportModal()}
      {renderConfigModal()}
    </div>
  );
};

export default PriceFileCompareView2;