import React, { useState, useMemo, useEffect } from 'react';
import Icon from './Icon';

interface LaborRow {
  id: string;
  categoryName: string; // "一类人工", "二类人工" 等
  qty: number;         // 工程量
  unit: string;
  basePrice: number;
  avgPrice: number;
  monthlyQuantities: Record<string, number>; // 存储各月份值
  isConsistent: boolean | null;
}

interface LaborGroup {
  id: string;
  partName: string; // 楼栋/部位名称
  isExpanded: boolean;
  rows: LaborRow[];
}

interface QuoteItem {
  id: string;
  projectName: string;
  tableName: string;
  updateTime: string;
  config: {
    riskRate: number;
    baseRegion: string;
    baseDate: string;
    startDate: string;
    endDate: string;
  };
}

interface Props {
  projectName: string;
  onBack: () => void;
}

const LaborAdjustmentDetailView: React.FC<Props> = ({ projectName, onBack }) => {
  const [hasChanges, setHasChanges] = useState(false);
  const [showExitConfirm, setShowExitConfirm] = useState(false);
  const [searchKeyword, setSearchKeyword] = useState('');
  const [isMonthlyExpanded, setIsMonthlyExpanded] = useState(false);
  const [showSuccessToast, setShowSuccessToast] = useState(false);

  // 模拟初始化数据
  const createDefaultRows = (): LaborRow[] => [
    { id: `r-${Date.now()}-1`, categoryName: '一类人工', qty: 4189.23, unit: '工日', basePrice: 140, avgPrice: 142.33, monthlyQuantities: {}, isConsistent: true },
    { id: `r-${Date.now()}-2`, categoryName: '二类人工', qty: 104413.13, unit: '工日', basePrice: 152, avgPrice: 153.67, monthlyQuantities: {}, isConsistent: true },
    { id: `r-${Date.now()}-3`, categoryName: '三类人工', qty: 1327.42, unit: '工日', basePrice: 174, avgPrice: 176.67, monthlyQuantities: {}, isConsistent: true },
  ];

  const [groups, setGroups] = useState<LaborGroup[]>(
    Array.from({ length: 3 }).map((_, i) => ({
      id: `group-${i}`,
      partName: `${i + 1}#楼`,
      isExpanded: true,
      rows: createDefaultRows()
    }))
  );

  const [rules, setRules] = useState({
    riskRate: 3,
    baseRegion: '市区',
    baseDate: '2021.5',
    startDate: '2021-09',
    endDate: '2022-06'
  });

  const [isRulesModalOpen, setIsRulesModalOpen] = useState(false);
  const [isQuoteModalOpen, setIsQuoteModalOpen] = useState(false);
  const [quoteProjectFilter, setQuoteProjectFilter] = useState('全部');

  // 模拟已设置信息价的明细表列表
  const mockQuoteList: QuoteItem[] = [
    { id: 'q1', projectName: '海港城2#-G地块', tableName: '1#楼人工调差表', updateTime: '2024-05-20 10:30', config: { riskRate: 3, baseRegion: '市区', baseDate: '2021.5', startDate: '2021-09', endDate: '2022-06' } },
    { id: 'q2', projectName: '西溪首座办公楼', tableName: '幕墙人工费核算', updateTime: '2024-05-18 14:20', config: { riskRate: 5, baseRegion: '余杭区', baseDate: '2023.1', startDate: '2023-01', endDate: '2023-12' } },
    { id: 'q3', projectName: '西溪首座办公楼', tableName: '地下室土建人工', updateTime: '2024-05-15 09:12', config: { riskRate: 2, baseRegion: '市区', baseDate: '2022.10', startDate: '2022-10', endDate: '2023-05' } },
  ];

  const projectNames = useMemo(() => ['全部', ...Array.from(new Set(mockQuoteList.map(item => item.projectName)))], []);

  const filteredQuoteList = useMemo(() => {
    if (quoteProjectFilter === '全部') return mockQuoteList;
    return mockQuoteList.filter(item => item.projectName === quoteProjectFilter);
  }, [quoteProjectFilter]);

  const handleSelectQuote = (item: QuoteItem) => {
    setRules(item.config);
    setIsQuoteModalOpen(false);
    setHasChanges(true);
    setShowSuccessToast(true);
    setTimeout(() => setShowSuccessToast(false), 3000);
  };

  const monthColumns = useMemo(() => {
    const months = [];
    let current = new Date(rules.startDate + '-01');
    const end = new Date(rules.endDate + '-01');
    while (current <= end) {
      const y = current.getFullYear();
      const m = current.getMonth() + 1;
      months.push(`${y}.${m}`);
      current.setMonth(current.getMonth() + 1);
    }
    return months;
  }, [rules.startDate, rules.endDate]);

  const filteredGroups = useMemo(() => {
    if (!searchKeyword.trim()) return groups;
    const kw = searchKeyword.toLowerCase();
    return groups.filter(g => g.partName.toLowerCase().includes(kw));
  }, [groups, searchKeyword]);

  const totalSum = useMemo(() => {
    return groups.reduce((acc, group) => {
      return acc + group.rows.reduce((gSum, row) => {
        const diff = (row.avgPrice || 0) - (row.basePrice || 0);
        return gSum + (diff * (row.qty || 0));
      }, 0);
    }, 0);
  }, [groups]);

  const handleSave = () => {
    alert('人工调差明细数据已保存');
    setHasChanges(false);
  };

  const handleBackAttempt = () => {
    if (hasChanges) setShowExitConfirm(true);
    else onBack();
  };

  const handleAddGroup = () => {
    const newGroup: LaborGroup = {
      id: `group-${Date.now()}`,
      partName: '新楼栋/部位',
      isExpanded: true,
      rows: createDefaultRows()
    };
    setGroups([...groups, newGroup]);
    setHasChanges(true);
  };

  const handleAddLaborRow = (groupId: string, e: React.MouseEvent) => {
    e.stopPropagation();
    setGroups(prev => prev.map(g => {
      if (g.id === groupId) {
        const newRow: LaborRow = {
          id: `row-${Date.now()}`,
          categoryName: `新人工种类`,
          qty: 0,
          unit: '工日',
          basePrice: 0,
          avgPrice: 0,
          monthlyQuantities: {},
          isConsistent: null
        };
        return { ...g, rows: [...g.rows, newRow], isExpanded: true };
      }
      return g;
    }));
    setHasChanges(true);
  };

  const updateGroupName = (id: string, name: string) => {
    setGroups(groups.map(g => g.id === id ? { ...g, partName: name } : g));
    setHasChanges(true);
  };

  const toggleGroup = (id: string) => {
    setGroups(groups.map(g => g.id === id ? { ...g, isExpanded: !g.isExpanded } : g));
  };

  const updateRowValue = (groupId: string, rowId: string, field: keyof LaborRow, val: any) => {
    setGroups(prev => prev.map(g => {
      if (g.id === groupId) {
        return {
          ...g,
          rows: g.rows.map(r => r.id === rowId ? { ...r, [field]: val } : r)
        };
      }
      return g;
    }));
    setHasChanges(true);
  };

  const deleteRow = (groupId: string, rowId: string) => {
    if (confirm('确定删除该行人工数据吗？')) {
      setGroups(prev => prev.map(g => {
        if (g.id === groupId) {
          return { ...g, rows: g.rows.filter(r => r.id !== rowId) };
        }
        return g;
      }));
      setHasChanges(true);
    }
  };

  return (
    <div className="flex-1 flex flex-col h-full bg-white overflow-hidden animate-in fade-in duration-500 relative">
      {/* 成功引用提示 Toast */}
      {showSuccessToast && (
        <div className="absolute top-20 left-1/2 -translate-x-1/2 z-[300] bg-slate-800 text-white px-6 py-2.5 rounded-full shadow-2xl flex items-center space-x-2 animate-in slide-in-from-top-2 duration-300">
          <Icon name="CheckCircle" size={16} className="text-emerald-400" />
          <span className="text-sm font-bold tracking-tight">信息价设置已引用成功</span>
        </div>
      )}

      {/* 顶部标题栏 */}
      <div className="bg-white border-b border-slate-100 px-8 py-4 shrink-0 flex items-center justify-between shadow-sm z-20">
        <div className="flex items-center space-x-4 text-left">
          <button onClick={handleBackAttempt} className="p-2 text-slate-400 hover:text-blue-600 hover:bg-blue-50 rounded-xl transition-all outline-none">
            <Icon name="ArrowLeft" size={20} />
          </button>
          <div>
            <h1 className="text-lg font-black text-slate-800 tracking-tight">人工调差明细</h1>
            <p className="text-[11px] text-slate-400 font-bold uppercase tracking-widest mt-0.5 italic">项目：{projectName}</p>
          </div>
        </div>
        <div className="flex items-center space-x-3">
          <button className="flex items-center space-x-2 px-4 py-2 bg-white border border-slate-200 text-slate-600 rounded-xl text-xs font-black hover:border-blue-400 transition-all outline-none">
            <Icon name="FileUp" size={16} />
            <span>导入材料表</span>
          </button>
          <button className="flex items-center space-x-2 px-4 py-2 bg-blue-50 text-blue-600 rounded-xl text-xs font-black hover:bg-blue-100 transition-all border border-blue-100 outline-none">
            <Icon name="RefreshCw" size={16} />
            <span>更新信息价</span>
          </button>
          <button 
            onClick={() => setIsQuoteModalOpen(true)}
            className="flex items-center space-x-2 px-4 py-2 bg-blue-50 text-blue-600 rounded-xl text-xs font-black hover:bg-blue-100 transition-all border border-blue-100 outline-none"
          >
            <Icon name="Copy" size={16} />
            <span>引用信息价设置</span>
          </button>
          <button onClick={handleSave} className="flex items-center space-x-2 px-6 py-2 bg-blue-600 text-white rounded-xl text-xs font-black hover:bg-blue-700 transition-all shadow-lg shadow-blue-500/20 active:scale-95 outline-none">
            <Icon name="Save" size={16} />
            <span>保存数据</span>
          </button>
          <button onClick={handleBackAttempt} className="px-6 py-2 bg-slate-100 text-slate-600 rounded-xl text-xs font-black hover:bg-slate-200 transition-all border border-slate-200 outline-none">
            <span>返回汇总表</span>
          </button>
        </div>
      </div>

      {/* 规则与搜索工具栏 */}
      <div className="px-8 py-4 bg-slate-50/50 border-b border-slate-100 flex items-center justify-between shrink-0">
        <div className="flex items-center space-x-6">
          <div className="relative group min-w-[320px]">
            <Icon name="Search" size={14} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400 group-focus-within:text-blue-500 transition-colors" />
            <input 
              type="text" 
              placeholder="搜索楼号或部位关键词..."
              value={searchKeyword}
              onChange={(e) => setSearchKeyword(e.target.value)}
              className="w-full h-10 bg-white border border-slate-200 rounded-xl pl-10 pr-4 text-xs font-bold text-slate-700 focus:border-blue-400 focus:ring-4 focus:ring-blue-500/5 transition-all outline-none shadow-sm"
            />
          </div>
          <div className="flex items-center space-x-8 text-[11px] font-black text-slate-500 uppercase tracking-wider">
            <div className="flex items-center space-x-2"><Icon name="ShieldCheck" size={14} className="text-blue-500" /><span>不调差风险率: {rules.riskRate}%</span></div>
            <div className="flex items-center space-x-2"><Icon name="MapPin" size={14} className="text-blue-500" /><span>基期信息价: {rules.baseRegion} ({rules.baseDate})</span></div>
            <div className="flex items-center space-x-2"><Icon name="Calendar" size={14} className="text-blue-500" /><span>调差区间: {rules.startDate} ~ {rules.endDate}</span></div>
          </div>
        </div>
        <div className="flex items-center space-x-3">
          <button onClick={() => setIsRulesModalOpen(true)} className="flex items-center space-x-2 px-4 py-2 bg-white border border-slate-200 text-slate-700 rounded-xl text-[11px] font-black hover:border-blue-400 transition-all shadow-sm outline-none">
            <Icon name="SlidersHorizontal" size={14} />
            <span>信息价设置</span>
          </button>

          <button 
            onClick={handleAddGroup} 
            className="flex items-center space-x-2 px-6 py-2 bg-blue-600 text-white rounded-xl text-[11px] font-black hover:bg-blue-700 transition-all shadow-lg shadow-blue-500/20 active:scale-95 outline-none"
          >
            <Icon name="Plus" size={14} strokeWidth={3} />
            <span>新增楼栋/部位</span>
          </button>
        </div>
      </div>

      {/* 表格内容区 */}
      <div className="flex-1 overflow-auto custom-scrollbar">
        <table className="w-full border-separate border-spacing-0 text-left min-w-[2200px]">
          <thead className="sticky top-0 z-30 bg-white shadow-sm">
            <tr className="bg-white border-b border-slate-200 text-[11px] font-black text-slate-400 uppercase tracking-widest text-center">
              <th rowSpan={isMonthlyExpanded ? 2 : 1} className="px-4 py-3 border-b border-r border-slate-100 w-20 sticky left-0 bg-white z-40 shadow-[1px_0_0_rgba(0,0,0,0.05)]">操作</th>
              <th rowSpan={isMonthlyExpanded ? 2 : 1} className="px-4 py-3 border-b border-r border-slate-100 w-48 sticky left-20 bg-white z-40 text-left shadow-[1px_0_0_rgba(0,0,0,0.05)]">人工类型</th>
              <th rowSpan={isMonthlyExpanded ? 2 : 1} className="px-4 py-3 border-b border-r border-slate-100 w-32 bg-white">工程量</th>
              <th rowSpan={isMonthlyExpanded ? 2 : 1} className="px-4 py-3 border-b border-r border-slate-100 w-32 bg-white">基期信息价 ({rules.baseDate})</th>
              <th rowSpan={isMonthlyExpanded ? 2 : 1} className="px-4 py-3 border-b border-r border-slate-100 w-32 bg-white">基期信息价+{rules.riskRate}%</th>
              <th rowSpan={isMonthlyExpanded ? 2 : 1} className="px-4 py-3 border-b border-r border-slate-100 w-32 bg-white">基期信息价-{rules.riskRate}%</th>
              
              <th 
                colSpan={isMonthlyExpanded ? monthColumns.length : 1}
                className={`px-4 py-3 border-b border-r border-slate-100 cursor-pointer transition-all ${isMonthlyExpanded ? 'bg-blue-50 text-blue-700 font-black' : 'bg-blue-50/30 text-blue-600 font-black'}`} 
                onClick={() => setIsMonthlyExpanded(!isMonthlyExpanded)}
              >
                <div className="flex items-center justify-center space-x-2">
                   <span className="whitespace-nowrap uppercase tracking-widest text-[10px]">每月调差明细</span>
                   <Icon name={isMonthlyExpanded ? "ChevronLeft" : "ChevronRight"} size={14} />
                </div>
              </th>

              <th rowSpan={isMonthlyExpanded ? 2 : 1} className="px-4 py-3 border-b border-r border-slate-100 w-32 bg-white">调差平均价</th>
              <th rowSpan={isMonthlyExpanded ? 2 : 1} className="px-4 py-3 border-b border-r border-slate-100 w-28 text-center bg-white">差价</th>
              <th rowSpan={isMonthlyExpanded ? 2 : 1} className="px-4 py-3 border-b border-r border-slate-100 w-36 text-right bg-white">调差总额</th>
              <th rowSpan={isMonthlyExpanded ? 2 : 1} className="px-4 py-3 border-b border-r border-slate-100 w-32 text-center bg-white">信息价一致性</th>
              <th rowSpan={isMonthlyExpanded ? 2 : 1} className="px-4 py-3 border-b border-slate-100 w-24 text-center bg-white">操作</th>
            </tr>
            {isMonthlyExpanded && (
              <tr className="bg-blue-50/10 text-[10px] font-black text-slate-400 uppercase tracking-widest text-center">
                {monthColumns.map(m => <th key={m} className="px-2 py-3 border-b border-r border-slate-100 w-28 font-mono">{m}</th>)}
              </tr>
            )}
          </thead>
          <tbody className="divide-y divide-slate-100">
            {filteredGroups.map((group) => (
              <React.Fragment key={group.id}>
                {/* 分组头行 */}
                <tr className="bg-slate-50/80 group">
                  <td className="px-4 py-3 border-r border-slate-200 sticky left-0 z-20 bg-slate-50 text-center">
                    <button 
                      onClick={() => toggleGroup(group.id)}
                      className="p-1 text-slate-400 hover:text-blue-600 hover:bg-white rounded transition-all outline-none"
                    >
                      <Icon name={group.isExpanded ? "ChevronDown" : "ChevronRight"} size={16} strokeWidth={3} />
                    </button>
                  </td>
                  <td className="px-4 py-3 border-r border-slate-200 sticky left-20 z-20 bg-slate-50 shadow-[1px_0_0_rgba(0,0,0,0.05)]">
                    <input 
                      type="text" 
                      value={group.partName} 
                      onChange={(e) => updateGroupName(group.id, e.target.value)}
                      className="bg-transparent border-none text-[13px] font-black text-slate-800 outline-none focus:bg-white rounded px-2 py-1 transition-all w-full"
                    />
                  </td>
                  <td className="px-4 py-3 border-r border-slate-100 text-center">
                    <button 
                      onClick={(e) => handleAddLaborRow(group.id, e)}
                      className="flex items-center justify-center space-x-1 px-3 py-1 bg-white border border-blue-200 text-blue-600 rounded-lg text-[10px] font-black hover:bg-blue-600 hover:text-white transition-all shadow-sm mx-auto"
                    >
                      <Icon name="Plus" size={10} strokeWidth={4} />
                      <span>新增人工种类</span>
                    </button>
                  </td>
                  <td colSpan={isMonthlyExpanded ? monthColumns.length + 8 : 9} className="bg-slate-50/20 border-r border-slate-100"></td>
                </tr>

                {/* 分组子行 */}
                {group.isExpanded && group.rows.map((row, idx) => {
                  const diff = (row.avgPrice || 0) - (row.basePrice || 0);
                  const rowTotalAdjustment = diff * (row.qty || 0);
                  const isConsistent = row.isConsistent;

                  return (
                    <tr key={row.id} className="group hover:bg-blue-50/10 transition-colors">
                      <td className="px-4 py-4 text-center text-xs font-bold text-slate-300 sticky left-0 z-10 bg-white group-hover:bg-slate-50 border-r border-slate-100 transition-colors shadow-[1px_0_0_rgba(0,0,0,0.05)]">
                        {idx + 1}
                      </td>
                      <td className="px-4 py-4 sticky left-20 z-10 bg-white group-hover:bg-slate-50 border-r border-slate-100 transition-colors shadow-[1px_0_0_rgba(0,0,0,0.05)]">
                        <input 
                          type="text" 
                          value={row.categoryName}
                          onChange={(e) => updateRowValue(group.id, row.id, 'categoryName', e.target.value)}
                          className="w-full bg-transparent border-none text-[12px] font-black text-slate-700 outline-none focus:bg-blue-50/50 rounded px-1" 
                        />
                      </td>
                      <td className="px-4 py-4 border-r border-slate-100 text-center">
                        <input 
                          type="number" 
                          value={row.qty || ''}
                          onChange={(e) => updateRowValue(group.id, row.id, 'qty', parseFloat(e.target.value) || 0)}
                          className="w-full bg-transparent border-none text-center text-[12px] font-black text-slate-600 outline-none" 
                        />
                      </td>
                      <td className="px-4 py-4 text-right border-r border-slate-100 text-[12px] text-slate-500 font-bold">
                        ¥ {row.basePrice.toLocaleString()}
                      </td>
                      <td className="px-4 py-4 text-right font-medium text-slate-400 border-r border-slate-100 text-[11px]">
                        {(row.basePrice * (1 + rules.riskRate/100)).toFixed(2)}
                      </td>
                      <td className="px-4 py-4 text-right font-medium text-slate-400 border-r border-slate-100 text-[11px]">
                        {(row.basePrice * (1 - rules.riskRate/100)).toFixed(2)}
                      </td>
                      
                      {isMonthlyExpanded ? monthColumns.map(m => (
                        <td key={m} className="px-2 py-4 border-r border-slate-100 bg-blue-50/5">
                          <input 
                            type="number" 
                            className="w-full bg-transparent text-right text-[11px] font-black text-blue-600 outline-none" 
                            placeholder="0.00" 
                          />
                        </td>
                      )) : (
                        <td className="w-10 bg-blue-50/5 border-r border-slate-100"></td>
                      )}
                      
                      <td className="px-4 py-4 border-r border-slate-100 text-right text-[12px] font-bold text-slate-600">¥ {row.avgPrice.toLocaleString()}</td>
                      <td className={`px-4 py-4 border-r border-slate-100 text-right text-[12px] font-black ${diff < 0 ? 'text-rose-500' : 'text-emerald-600'}`}>{diff.toFixed(2)}</td>
                      <td className={`px-4 py-4 border-r border-slate-100 text-right text-[13px] font-black ${rowTotalAdjustment < 0 ? 'text-rose-600' : 'text-blue-600'}`}>
                        ¥ {rowTotalAdjustment.toLocaleString(undefined, { minimumFractionDigits: 2 })}
                      </td>
                      <td className="px-4 py-4 text-center border-r border-slate-100">
                         <span className={`px-3 py-1 rounded-full text-[10px] font-black border ${isConsistent !== false ? 'bg-emerald-50 text-emerald-600 border-emerald-100' : 'bg-rose-50 text-rose-600 border-rose-100'}`}>
                            {isConsistent !== false ? '一致' : '不一致'}
                         </span>
                      </td>
                      <td className="px-4 py-4 text-center">
                        <button onClick={() => deleteRow(group.id, row.id)} className="p-1.5 text-slate-300 hover:text-rose-500 hover:bg-rose-50 rounded-lg transition-all">
                          <Icon name="Trash2" size={14} />
                        </button>
                      </td>
                    </tr>
                  );
                })}
              </React.Fragment>
            ))}

            {/* 底部空状态 */}
            {filteredGroups.length === 0 && (
              <tr>
                <td colSpan={isMonthlyExpanded ? monthColumns.length + 11 : 12} className="py-20 text-center text-slate-300">
                  <Icon name="Inbox" size={64} className="mx-auto mb-4 opacity-20" />
                  <p className="font-black text-sm">暂无楼栋/部位数据，请点击右上角「新增楼栋/部位」</p>
                </td>
              </tr>
            )}
          </tbody>
          
          <tfoot className="sticky bottom-0 z-40 shadow-[0_-10px_30px_rgba(0,0,0,0.05)]">
            <tr className="bg-white text-slate-800 font-black text-[12px] text-center border-t border-slate-200">
              <td colSpan={2} className="px-4 py-5 sticky left-0 bg-white border-r border-slate-200 z-50 text-left pl-8 uppercase tracking-widest">
                合计汇总
              </td>
              <td className="px-4 py-5 border-r border-slate-100 text-blue-600 text-[14px]">
                {groups.reduce((acc, g) => acc + g.rows.reduce((s, r) => s + (r.qty || 0), 0), 0).toLocaleString(undefined, { minimumFractionDigits: 2 })}
              </td>
              <td colSpan={3} className="bg-slate-50/30 border-r border-slate-100"></td>
              <td className={`border-r border-slate-100 bg-slate-50/30 transition-all ${isMonthlyExpanded ? 'px-4' : 'w-10 px-0'}`}>
                {isMonthlyExpanded && monthColumns.map((_, i) => i === 0 ? <span key={i} className="text-slate-300 italic">每月分项汇总</span> : null)}
              </td>
              {isMonthlyExpanded && monthColumns.slice(1).map((m) => (
                <td key={m} className="px-2 py-5 border-r border-slate-100 bg-slate-50/30"></td>
              ))}
              <td className="px-4 py-5 border-r border-slate-100 bg-slate-50/30">-</td>
              <td className="px-4 py-5 border-r border-slate-100 bg-slate-50/30">-</td>
              <td className="px-4 py-5 border-r border-slate-100 text-xl font-black tracking-tight text-blue-700 bg-blue-50/20">
                ¥ {totalSum.toLocaleString(undefined, { minimumFractionDigits: 2 })}
              </td>
              <td className="px-4 py-5 border-r border-slate-100 bg-white"></td>
              <td className="px-4 py-5 bg-white"></td>
            </tr>
          </tfoot>
        </table>
      </div>

      {/* 引用信息价设置弹窗 */}
      {isQuoteModalOpen && (
        <div className="fixed inset-0 z-[200] flex items-center justify-center bg-black/50 backdrop-blur-sm p-4 animate-in fade-in duration-200">
          <div className="bg-white rounded-[32px] shadow-2xl w-full max-w-3xl overflow-hidden flex flex-col animate-in zoom-in-95 border border-slate-200 text-left h-[70vh]">
            <div className="px-8 py-6 border-b border-slate-100 flex items-center justify-between shrink-0 bg-white">
              <h3 className="text-xl font-black text-slate-800 tracking-tight">引用信息价设置</h3>
              <button onClick={() => setIsQuoteModalOpen(false)} className="text-slate-300 hover:text-rose-500 transition-colors outline-none"><Icon name="X" size={24} /></button>
            </div>
            
            <div className="p-6 bg-slate-50/30 border-b border-slate-100 flex items-center space-x-4">
              <span className="text-xs font-black text-slate-400 uppercase tracking-widest">筛选项目：</span>
              <div className="relative min-w-[240px]">
                <select 
                  value={quoteProjectFilter}
                  onChange={(e) => setQuoteProjectFilter(e.target.value)}
                  className="w-full h-10 bg-white border border-slate-200 rounded-xl px-4 text-xs font-bold text-slate-700 outline-none appearance-none cursor-pointer focus:border-blue-400 shadow-sm"
                >
                  {projectNames.map(name => <option key={name} value={name}>{name}</option>)}
                </select>
                <Icon name="ChevronDown" size={14} className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none" />
              </div>
            </div>

            <div className="flex-1 overflow-auto custom-scrollbar">
              <table className="w-full border-collapse">
                <thead className="sticky top-0 bg-white shadow-sm z-10">
                  <tr className="bg-slate-50/80 text-[10px] font-black text-slate-400 uppercase tracking-widest text-left">
                    <th className="px-8 py-4">项目名称</th>
                    <th className="px-6 py-4">明细表名称</th>
                    <th className="px-6 py-4">设置时间</th>
                    <th className="px-8 py-4 text-center">操作</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {filteredQuoteList.map((item) => (
                    <tr key={item.id} className="hover:bg-blue-50/10 transition-colors group">
                      <td className="px-8 py-4 text-xs font-bold text-slate-600">{item.projectName}</td>
                      <td className="px-6 py-4 text-[13px] font-black text-slate-800">{item.tableName}</td>
                      <td className="px-6 py-4 text-[11px] font-bold text-slate-400">{item.updateTime}</td>
                      <td className="px-8 py-4 text-center">
                        <button 
                          onClick={() => handleSelectQuote(item)}
                          className="px-4 py-1.5 bg-blue-50 text-blue-600 rounded-xl text-[11px] font-black hover:bg-blue-100 transition-all border border-blue-100 outline-none"
                        >
                          选择
                        </button>
                      </td>
                    </tr>
                  ))}
                  {filteredQuoteList.length === 0 && (
                    <tr>
                      <td colSpan={4} className="py-20 text-center text-slate-300">
                        <Icon name="Inbox" size={48} className="mx-auto mb-2 opacity-20" />
                        <p className="text-sm font-bold">暂无已保存的设置</p>
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>

            <div className="px-8 py-6 border-t border-slate-100 bg-slate-50/50 flex items-center justify-end shrink-0">
               <button onClick={() => setIsQuoteModalOpen(false)} className="px-8 py-2.5 bg-white border border-slate-200 text-slate-600 rounded-xl text-sm font-bold hover:bg-slate-50 transition-all outline-none">取消</button>
            </div>
          </div>
        </div>
      )}

      {/* 信息价设置弹窗 */}
      {isRulesModalOpen && (
        <div className="fixed inset-0 z-[200] flex items-center justify-center bg-black/50 backdrop-blur-sm p-4 animate-in fade-in duration-200">
          <div className="bg-white rounded-[32px] shadow-2xl w-full max-w-lg overflow-hidden flex flex-col animate-in zoom-in-95 border border-slate-200 text-left">
            <div className="px-8 py-6 border-b border-slate-100 flex items-center justify-between shrink-0 bg-white">
              <h3 className="text-xl font-black text-slate-800 tracking-tight">信息价设置</h3>
              <button onClick={() => setIsRulesModalOpen(false)} className="text-slate-300 hover:text-slate-600 transition-colors outline-none"><Icon name="X" size={24} /></button>
            </div>
            <div className="p-8 space-y-6">
               <div className="space-y-2">
                  <label className="text-xs font-black text-slate-500 uppercase tracking-widest ml-1">不调差风险率</label>
                  <div className="flex items-center">
                    <input 
                      type="number" 
                      value={rules.riskRate} 
                      onChange={e => { setRules({...rules, riskRate: parseFloat(e.target.value) || 0}); setHasChanges(true); }} 
                      className="flex-1 h-12 bg-white border border-slate-200 rounded-l-[18px] px-5 text-sm font-black text-slate-700 outline-none focus:border-blue-400 transition-all shadow-sm" 
                    />
                    <div className="h-12 w-16 bg-slate-100 border border-l-0 border-slate-200 rounded-r-[18px] flex items-center justify-center text-xs font-black text-slate-400">%</div>
                  </div>
               </div>
               <div className="space-y-2">
                  <label className="text-xs font-black text-slate-500 uppercase tracking-widest ml-1">基期信息价设定</label>
                  <div className="grid grid-cols-2 gap-4">
                    <div className="relative">
                      <select 
                        value={rules.baseRegion} 
                        onChange={e => { setRules({...rules, baseRegion: e.target.value}); setHasChanges(true); }} 
                        className="w-full h-12 bg-white border border-slate-200 rounded-[18px] px-5 text-sm font-bold text-slate-700 outline-none focus:border-blue-400 transition-all shadow-sm appearance-none cursor-pointer"
                      >
                        <option>市区</option><option>萧山区</option><option>余杭区</option>
                      </select>
                      <Icon name="ChevronDown" size={16} className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-300 pointer-events-none" />
                    </div>
                    <input 
                      type="text" 
                      value={rules.baseDate} 
                      onChange={e => { setRules({...rules, baseDate: e.target.value}); setHasChanges(true); }} 
                      className="h-12 bg-white border border-slate-200 rounded-[18px] px-5 text-sm font-bold text-slate-700 outline-none focus:border-blue-400 transition-all shadow-sm" 
                    />
                  </div>
               </div>
               <div className="space-y-2">
                  <label className="text-xs font-black text-slate-500 uppercase tracking-widest ml-1">调差区间</label>
                  <div className="grid grid-cols-2 gap-4">
                    <input 
                      type="month" 
                      value={rules.startDate} 
                      onChange={e => { setRules({...rules, startDate: e.target.value}); setHasChanges(true); }} 
                      className="h-12 bg-white border border-slate-200 rounded-[18px] px-5 text-sm font-bold text-slate-700 outline-none focus:border-blue-400 transition-all shadow-sm" 
                    />
                    <input 
                      type="month" 
                      value={rules.endDate} 
                      onChange={e => { setRules({...rules, endDate: e.target.value}); setHasChanges(true); }} 
                      className="h-12 bg-white border border-slate-200 rounded-[18px] px-5 text-sm font-bold text-slate-700 outline-none focus:border-blue-400 transition-all shadow-sm" 
                    />
                  </div>
               </div>
            </div>
            <div className="px-8 py-6 border-t border-slate-100 bg-slate-50/50 flex items-center justify-end space-x-3 shrink-0">
               <button onClick={() => setIsRulesModalOpen(false)} className="px-10 py-2.5 bg-blue-600 text-white rounded-xl text-sm font-black shadow-lg hover:bg-blue-700 transition-all active:scale-95">确定</button>
            </div>
          </div>
        </div>
      )}

      {/* 退出确认弹窗 */}
      {showExitConfirm && (
        <div className="fixed inset-0 z-[300] flex items-center justify-center bg-black/60 backdrop-blur-sm p-4 animate-in fade-in duration-200">
           <div className="bg-white rounded-[32px] shadow-2xl w-full max-w-sm p-8 flex flex-col items-center border border-slate-200 animate-in zoom-in-95">
              <div className="w-16 h-16 bg-amber-50 text-amber-500 rounded-2xl flex items-center justify-center mb-6 shadow-inner"><Icon name="AlertCircle" size={32} /></div>
              <h3 className="text-xl font-black text-slate-800 mb-2">未保存修改</h3>
              <p className="text-sm font-bold text-slate-500 mb-8 text-center">是否保存当前人工调差修改的内容？</p>
              <div className="w-full flex flex-col space-y-2">
                 <button onClick={() => { handleSave(); onBack(); }} className="w-full py-3.5 bg-blue-600 text-white rounded-2xl font-black text-sm shadow-xl hover:bg-blue-700 transition-all">保存并退出</button>
                 <button onClick={() => onBack()} className="w-full py-3.5 bg-slate-100 text-slate-600 rounded-2xl font-black text-sm hover:bg-slate-200 transition-all">不保存退出</button>
                 <button onClick={() => setShowExitConfirm(false)} className="w-full py-3.5 bg-white border border-slate-200 text-slate-400 rounded-2xl font-black text-sm hover:bg-slate-50 transition-all">取消</button>
              </div>
           </div>
        </div>
      )}
    </div>
  );
};

export default LaborAdjustmentDetailView;