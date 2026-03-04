import React, { useState, useMemo } from 'react';
import Icon from './Icon';

interface MaterialItem {
  id: string;
  code: string;
  name: string;
  category: string;
  spec: string;
  unit: string;
  basePrice: number;
}

interface AdjustmentRow {
  id: string;
  materialName: string;
  spec: string;
  unit: string;
  contractQty: number;
  orderQty: number;
  basePrice: number;
  avgPrice: number; // 调差平均价
  isConsistent: boolean;
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

const CATEGORIES = [
  '全部',
  '金属材料',
  '橡胶、塑料及其他',
  '五金制品',
  '水泥、砖瓦、灰、砂石、混凝土及制品',
  '木、竹材及其制品',
  '彩色植草砖、玻璃及玻璃制品',
  '墙砖、地砖、地板、地毯类材料',
  '装饰、石材及石材制品',
  '墙面、顶棚及屋面饰面材料',
  '龙骨、龙骨配件',
  '门窗及楼梯制品'
];

const MOCK_MATERIALS: MaterialItem[] = [
  { id: 'm1', code: 'JS-001', name: '螺纹钢', category: '金属材料', spec: 'Φ20', unit: 't', basePrice: 3850 },
  { id: 'm2', code: 'SN-001', name: '普通硅酸盐水泥', category: '水泥、砖瓦、灰、砂石、混凝土及制品', spec: 'P.O 42.5', unit: 't', basePrice: 420 },
  { id: 'm3', code: 'HN-001', name: '商品混凝土', category: '水泥、砖瓦、灰、砂石、混凝土及制品', spec: 'C30', unit: 'm³', basePrice: 380 },
  { id: 'm4', code: 'WJ-001', name: '膨胀螺栓', category: '五金制品', spec: 'M10*100', unit: '套', basePrice: 1.5 },
  { id: 'm5', code: 'SC-001', name: '花岗岩板材', category: '装饰、石材及石材制品', spec: '600*600', unit: 'm²', basePrice: 260 },
  { id: 'm6', code: 'MC-001', name: '断桥铝合金窗', category: '门窗及楼梯制品', spec: '70系列', unit: 'm²', basePrice: 580 },
];

interface Props {
  projectName: string;
  onBack: () => void;
}

const MaterialAdjustmentDetailView: React.FC<Props> = ({ projectName, onBack }) => {
  const [hasChanges, setHasChanges] = useState(false);
  const [showExitConfirm, setShowExitConfirm] = useState(false);
  const [searchKeyword, setSearchKeyword] = useState('');
  const [showSuccessToast, setShowSuccessToast] = useState(false);
  
  const [rows, setRows] = useState<AdjustmentRow[]>(
    Array.from({ length: 10 }).map((_, i) => ({
      id: `row-${i}`,
      materialName: i === 0 ? '螺纹钢' : '', 
      spec: i === 0 ? 'Φ20' : '',
      unit: i === 0 ? 't' : '',
      contractQty: i === 0 ? 150.50 : 0,
      orderQty: i === 0 ? 25.00 : 0,
      basePrice: i === 0 ? 3850 : 0,
      avgPrice: i === 0 ? 4120 : 0,
      isConsistent: true
    }))
  );

  const [rules, setRules] = useState({
    riskRate: 0,
    baseRegion: '市区',
    baseDate: '2024-01',
    startDate: '2024-01',
    endDate: '2024-06'
  });

  const [isRulesModalOpen, setIsRulesModalOpen] = useState(false);
  const [isQuoteModalOpen, setIsQuoteModalOpen] = useState(false);
  const [quoteProjectFilter, setQuoteProjectFilter] = useState('全部');
  const [isMaterialModalOpen, setIsMaterialModalOpen] = useState(false);
  const [activeRowId, setActiveRowId] = useState<string | null>(null);
  const [materialSearch, setMaterialSearch] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('全部');
  const [isMonthlyExpanded, setIsMonthlyExpanded] = useState(false);

  // 模拟已设置信息价的明细表列表
  const mockQuoteList: QuoteItem[] = [
    { id: 'q1', projectName: '海港城2#-G地块', tableName: '地下部分材料调差表', updateTime: '2024-05-20 10:30', config: { riskRate: 3, baseRegion: '市区', baseDate: '2024-01', startDate: '2024-01', endDate: '2024-06' } },
    { id: 'q2', projectName: '西溪首座办公楼', tableName: '幕墙材料调差明细', updateTime: '2024-05-18 14:20', config: { riskRate: 5, baseRegion: '余杭区', baseDate: '2023-12', startDate: '2024-01', endDate: '2024-12' } },
    { id: 'q3', projectName: '西溪首座办公楼', tableName: '室内精装修材料调差', updateTime: '2024-05-15 09:12', config: { riskRate: 0, baseRegion: '市区', baseDate: '2024-03', startDate: '2024-03', endDate: '2024-05' } },
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

  const filteredRows = useMemo(() => {
    if (!searchKeyword.trim()) return rows;
    const kw = searchKeyword.toLowerCase();
    return rows.filter(r => 
      r.materialName.toLowerCase().includes(kw) || 
      r.spec.toLowerCase().includes(kw)
    );
  }, [rows, searchKeyword]);

  const totals = useMemo(() => {
    return filteredRows.reduce((acc, row) => {
      const diff = (row.avgPrice || 0) - (row.basePrice || 0);
      const totalQty = (row.contractQty || 0) + (row.orderQty || 0);
      const rowTotalAdjustment = diff * totalQty;

      acc.contractQty += (row.contractQty || 0);
      acc.orderQty += (row.orderQty || 0);
      acc.totalAdjustment += rowTotalAdjustment;
      return acc;
    }, { contractQty: 0, orderQty: 0, totalAdjustment: 0 });
  }, [filteredRows]);

  const handleSave = () => {
    alert('数据已保存，汇总页将同步更新');
    setHasChanges(false);
  };

  const handleBackAttempt = () => {
    if (hasChanges) setShowExitConfirm(true);
    else onBack();
  };

  const handleAddRow = () => {
    const newRow: AdjustmentRow = {
      id: `row-${Date.now()}`,
      materialName: '',
      spec: '',
      unit: '',
      contractQty: 0,
      orderQty: 0,
      basePrice: 0,
      avgPrice: 0,
      isConsistent: true
    };
    setRows([...rows, newRow]);
    setHasChanges(true);
  };

  const handleSelectMaterial = (m: MaterialItem) => {
    if (!activeRowId) return;
    setRows(rows.map(row => row.id === activeRowId ? {
      ...row,
      materialName: m.name,
      spec: m.spec,
      unit: m.unit,
      basePrice: m.basePrice,
      avgPrice: m.basePrice + 100, 
      isConsistent: true
    } : row));
    setHasChanges(true);
    setIsMaterialModalOpen(false);
    setActiveRowId(null);
    setMaterialSearch('');
  };

  const updateRowField = (id: string, field: keyof AdjustmentRow, value: any) => {
    setRows(rows.map(row => row.id === id ? { ...row, [field]: value } : row));
    setHasChanges(true);
  };

  const handleDeleteRow = (id: string) => {
    if (confirm('确定要删除此行数据吗？')) {
      setRows(rows.filter(r => r.id !== id));
      setHasChanges(true);
    }
  };

  const filteredLibrary = useMemo(() => {
    return MOCK_MATERIALS.filter(m => {
      const matchCat = selectedCategory === '全部' || m.category === selectedCategory;
      const matchSearch = m.name.includes(materialSearch) || m.code.includes(materialSearch) || m.spec.includes(materialSearch);
      return matchCat && matchSearch;
    });
  }, [selectedCategory, materialSearch]);

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
            <h1 className="text-lg font-black text-slate-800 tracking-tight">材料调差明细</h1>
            <p className="text-[11px] text-slate-400 font-bold uppercase tracking-widest mt-0.5 italic">当前项目：{projectName}</p>
          </div>
        </div>
        <div className="flex items-center space-x-3">
          <button className="flex items-center space-x-2 px-4 py-2 bg-white border border-slate-200 text-slate-600 rounded-xl text-xs font-black hover:border-blue-400 transition-all outline-none">
            <Icon name="FileUp" size={16} />
            <span>导入文件</span>
          </button>
          <button className="flex items-center space-x-2 px-4 py-2 bg-blue-50 text-blue-600 rounded-xl text-xs font-black hover:bg-blue-100 transition-all border border-blue-100 outline-none">
            <Icon name="RefreshCw" size={16} />
            <span>更新信息价</span>
          </button>
          {/* 新增：引用信息价设置按钮 */}
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
              placeholder="搜索材料名称、规格型号关键词..."
              value={searchKeyword}
              onChange={(e) => setSearchKeyword(e.target.value)}
              className="w-full h-10 bg-white border border-slate-200 rounded-xl pl-10 pr-4 text-xs font-bold text-slate-700 focus:border-blue-400 focus:ring-4 focus:ring-blue-500/5 transition-all outline-none"
            />
          </div>
          <div className="flex items-center space-x-8 text-[11px] font-black text-slate-500 uppercase tracking-wider">
            <div className="flex items-center space-x-2"><Icon name="ShieldCheck" size={14} className="text-blue-500" /><span>不调差风险率: {rules.riskRate}%</span></div>
            <div className="flex items-center space-x-2"><Icon name="MapPin" size={14} className="text-blue-500" /><span>基期信息价: {rules.baseRegion} ({rules.baseDate})</span></div>
            <div className="flex items-center space-x-2"><Icon name="Calendar" size={14} className="text-blue-500" /><span>调差区间: {rules.startDate} ~ {rules.endDate}</span></div>
          </div>
        </div>
        <div className="flex items-center space-x-2">
          <button onClick={() => setIsRulesModalOpen(true)} className="flex items-center space-x-2 px-4 py-2 bg-white border border-slate-200 text-slate-700 rounded-xl text-[11px] font-black hover:border-blue-400 transition-all shadow-sm outline-none">
            <Icon name="SlidersHorizontal" size={14} />
            <span>信息价设置</span>
          </button>
          <button onClick={handleAddRow} className="flex items-center space-x-2 px-4 py-2 bg-white border border-slate-200 text-blue-600 rounded-xl text-[11px] font-black hover:border-blue-400 transition-all shadow-sm outline-none">
            <Icon name="Plus" size={14} strokeWidth={3} />
            <span>新增行</span>
          </button>
        </div>
      </div>

      {/* 表格内容区 */}
      <div className="flex-1 overflow-auto custom-scrollbar">
        <table className="w-full border-separate border-spacing-0 text-left min-w-[1800px]">
          <thead className="sticky top-0 z-30 bg-white shadow-sm">
            <tr className="bg-white border-b border-slate-200 text-[11px] font-black text-slate-400 uppercase tracking-widest text-center">
              <th rowSpan={isMonthlyExpanded ? 2 : 1} className="px-4 py-3 border-b border-r border-slate-100 w-12 sticky left-0 bg-white z-40 shadow-[1px_0_0_rgba(0,0,0,0.05)]">序号</th>
              <th rowSpan={isMonthlyExpanded ? 2 : 1} className="px-4 py-3 border-b border-r border-slate-100 w-48 sticky left-12 bg-white z-40 text-left shadow-[1px_0_0_rgba(0,0,0,0.05)]">材料名称</th>
              <th rowSpan={isMonthlyExpanded ? 2 : 1} className="px-4 py-3 border-b border-r border-slate-100 w-32 bg-white">规格型号</th>
              <th rowSpan={isMonthlyExpanded ? 2 : 1} className="px-4 py-3 border-b border-r border-slate-100 w-20 bg-white">单位</th>
              <th rowSpan={isMonthlyExpanded ? 2 : 1} className="px-4 py-3 border-b border-r border-slate-100 w-32 bg-white">合同内工程量</th>
              <th rowSpan={isMonthlyExpanded ? 2 : 1} className="px-4 py-3 border-b border-r border-slate-100 w-32 bg-white">联系单工程量</th>
              <th rowSpan={isMonthlyExpanded ? 2 : 1} className="px-4 py-3 border-b border-r border-slate-100 w-32 bg-white">基期价格</th>
              <th rowSpan={isMonthlyExpanded ? 2 : 1} className="px-4 py-3 border-b border-r border-slate-100 w-32 bg-white">基期 + {rules.riskRate}%</th>
              <th rowSpan={isMonthlyExpanded ? 2 : 1} className="px-4 py-3 border-b border-r border-slate-100 w-32 bg-white">基期 - {rules.riskRate}%</th>
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
              <th rowSpan={isMonthlyExpanded ? 2 : 1} className="px-4 py-3 border-b border-r border-slate-100 w-28 bg-white">差价</th>
              <th rowSpan={isMonthlyExpanded ? 2 : 1} className="px-4 py-3 border-b border-r border-slate-100 w-36 bg-white">调差总额</th>
              <th rowSpan={isMonthlyExpanded ? 2 : 1} className="px-4 py-3 border-b border-r border-slate-100 w-32 bg-white">信息价一致性</th>
              <th rowSpan={isMonthlyExpanded ? 2 : 1} className="px-4 py-3 border-b border-slate-100 w-24 bg-white">操作</th>
            </tr>
            {isMonthlyExpanded && (
              <tr className="bg-blue-50/10 text-[10px] font-black text-slate-400 uppercase tracking-widest text-center">
                {monthColumns.map(m => <th key={m} className="px-2 py-3 border-b border-r border-slate-100 w-28 font-mono">{m}</th>)}
              </tr>
            )}
          </thead>
          <tbody className="divide-y divide-slate-100">
            {filteredRows.map((row, idx) => {
              const diff = (row.avgPrice || 0) - (row.basePrice || 0);
              const totalQty = (row.contractQty || 0) + (row.orderQty || 0);
              const rowTotalAdjustment = diff * totalQty;

              return (
                <tr key={row.id} id={row.id} className="group hover:bg-slate-50 transition-all">
                  <td className="px-4 py-4 text-center text-xs font-bold text-slate-400 sticky left-0 bg-white group-hover:bg-slate-50 border-r border-slate-100 z-10 transition-colors shadow-[1px_0_0_rgba(0,0,0,0.05)]">{idx + 1}</td>
                  <td 
                    onClick={() => { setActiveRowId(row.id); setIsMaterialModalOpen(true); }}
                    className="px-4 py-4 sticky left-12 bg-white group-hover:bg-slate-50 border-r border-slate-100 cursor-pointer z-10 transition-colors shadow-[1px_0_0_rgba(0,0,0,0.05)]"
                  >
                    <div className="flex items-center justify-between">
                      <span className={`text-[13px] font-black ${row.materialName ? 'text-slate-800' : 'text-slate-300 italic'}`}>{row.materialName || '点击选择材料'}</span>
                      <Icon name="Search" size={14} className="text-slate-200 group-hover:text-blue-500 transition-colors" />
                    </div>
                  </td>
                  <td className="px-4 py-4 text-[12px] text-slate-600 font-medium text-center border-r border-slate-100">{row.spec || '-'}</td>
                  <td className="px-4 py-4 text-[12px] text-slate-400 font-bold text-center border-r border-slate-100">{row.unit || '-'}</td>
                  <td className="px-4 py-4 border-r border-slate-100 text-center">
                    <input 
                      type="number" 
                      value={row.contractQty}
                      onChange={(e) => updateRowField(row.id, 'contractQty', parseFloat(e.target.value) || 0)}
                      className="w-full bg-transparent border-none text-center text-sm font-black text-slate-700 outline-none" 
                    />
                  </td>
                  <td className="px-4 py-4 border-r border-slate-100 text-center">
                    <input 
                      type="number" 
                      value={row.orderQty}
                      onChange={(e) => updateRowField(row.id, 'orderQty', parseFloat(e.target.value) || 0)}
                      className="w-full bg-transparent border-none text-center text-sm font-black text-slate-700 outline-none" 
                    />
                  </td>
                  <td className="px-4 py-4 text-right font-bold text-slate-500 border-r border-slate-100 text-[12px]">¥ {row.basePrice.toLocaleString()}</td>
                  <td className="px-4 py-4 text-right font-medium text-slate-400 border-r border-slate-100 text-[11px]">{(row.basePrice * (1 + rules.riskRate/100)).toFixed(2)}</td>
                  <td className="px-4 py-4 text-right font-medium text-slate-400 border-r border-slate-100 text-[11px]">{(row.basePrice * (1 - rules.riskRate/100)).toFixed(2)}</td>
                  
                  {isMonthlyExpanded && monthColumns.map(m => (
                    <td key={m} className="px-2 py-4 border-r border-slate-100 bg-blue-50/5">
                      <input 
                        type="number" 
                        className="w-full bg-transparent text-right text-[11px] font-bold text-blue-600 outline-none" 
                        placeholder="0.00" 
                        defaultValue="0.00" 
                      />
                    </td>
                  ))}
                  {!isMonthlyExpanded && <td className="w-10 bg-blue-50/5 border-r border-slate-100"></td>}
                  
                  <td className="px-4 py-4 border-r border-slate-100 text-right text-[12px] font-bold text-slate-600">¥ {row.avgPrice.toLocaleString()}</td>
                  <td className={`px-4 py-4 border-r border-slate-100 text-right text-[12px] font-black ${diff < 0 ? 'text-rose-500' : 'text-emerald-600'}`}>{diff.toFixed(2)}</td>
                  <td className={`px-4 py-4 border-r border-slate-100 text-right text-[13px] font-black ${rowTotalAdjustment < 0 ? 'text-rose-600' : 'text-blue-600'}`}>¥ {rowTotalAdjustment.toLocaleString(undefined, { minimumFractionDigits: 2 })}</td>
                  <td className="px-4 py-4 text-center border-r border-slate-100">
                    <span className={`px-3 py-1 rounded-full text-[10px] font-black border ${row.isConsistent ? 'bg-emerald-50 text-emerald-600 border-emerald-100' : 'bg-rose-50 text-rose-600 border-rose-100'}`}>
                      {row.isConsistent ? '一致' : '不一致'}
                    </span>
                  </td>
                  <td className="px-4 py-4 text-center">
                    <button onClick={() => handleDeleteRow(row.id)} className="p-1.5 text-slate-300 hover:text-rose-500 hover:bg-rose-50 rounded-lg transition-all">
                      <Icon name="Trash2" size={14} />
                    </button>
                  </td>
                </tr>
              );
            })}
          </tbody>
          <tfoot className="sticky bottom-0 z-30 shadow-[0_-8px_30px_rgba(0,0,0,0.06)]">
            <tr className="bg-white text-slate-800 font-black text-[12px] text-center border-t border-slate-200">
              <td className="px-4 py-5 sticky left-0 bg-white border-r border-slate-200 z-40 shadow-[1px_0_0_rgba(0,0,0,0.05)]">合计</td>
              <td className="px-4 py-5 sticky left-12 bg-white border-r border-slate-200 text-left z-40 shadow-[1px_0_0_rgba(0,0,0,0.05)]">
                <span className="text-[10px] text-slate-400 font-bold block mb-0.5">筛选统计</span>
                {filteredRows.length} 项材料
              </td>
              <td className="px-4 py-5 border-r border-slate-200">-</td>
              <td className="px-4 py-5 border-r border-slate-200">-</td>
              <td className="px-4 py-5 border-r border-slate-200 text-emerald-600 text-[14px]">
                {totals.contractQty.toLocaleString(undefined, { minimumFractionDigits: 2 })}
              </td>
              <td className="px-4 py-5 border-r border-slate-200 text-emerald-600 text-[14px]">
                {totals.orderQty.toLocaleString(undefined, { minimumFractionDigits: 2 })}
              </td>
              <td className="px-4 py-5 border-r border-slate-200">-</td>
              <td className="px-4 py-5 border-r border-slate-200">-</td>
              <td className="px-4 py-5 border-r border-slate-200">-</td>
              
              <td className={`border-r border-slate-200 transition-all duration-300 ${isMonthlyExpanded ? 'px-4 bg-slate-50/50' : 'w-10 px-0 bg-white'}`}></td>
              {isMonthlyExpanded && monthColumns.map(m => (
                <td key={m} className="px-2 py-5 border-r border-slate-200 bg-slate-50/50"></td>
              ))}
              
              <td className="px-4 py-5 border-r border-slate-200">-</td>
              <td className="px-4 py-5 border-r border-slate-200">-</td>
              <td className={`px-4 py-5 border-r border-slate-200 text-xl font-black tracking-tight ${totals.totalAdjustment < 0 ? 'text-rose-600' : 'text-blue-600'}`}>
                ¥ {totals.totalAdjustment.toLocaleString(undefined, { minimumFractionDigits: 2 })}
              </td>
              <td className="px-4 py-5 border-r border-slate-200">-</td>
              <td className="px-4 py-5">-</td>
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

      {/* 材料库弹窗 */}
      {isMaterialModalOpen && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/45 backdrop-blur-sm p-4 animate-in fade-in duration-200">
           <div className="bg-white rounded-[24px] shadow-2xl w-full max-w-6xl h-[80vh] flex flex-col border border-slate-200 animate-in zoom-in-95 overflow-hidden">
              <div className="px-8 py-5 border-b border-slate-100 flex items-center justify-between shrink-0 bg-white">
                 <h3 className="text-[15px] font-black text-slate-800">材料库选择</h3>
                 <button 
                  onClick={() => setIsMaterialModalOpen(false)} 
                  className="w-8 h-8 flex items-center justify-center text-slate-300 hover:text-rose-500 hover:bg-rose-50 rounded-full transition-all"
                 >
                   <Icon name="X" size={22} />
                 </button>
              </div>

              <div className="px-8 py-4 shrink-0 bg-white">
                 <div className="relative group">
                    <Icon name="Search" size={16} className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-300 group-focus-within:text-blue-500 transition-colors" />
                    <input 
                      type="text" 
                      value={materialSearch} 
                      onChange={(e) => setMaterialSearch(e.target.value)} 
                      placeholder="输入编码、名称、规格型号关键词搜索..." 
                      className="w-full h-11 bg-white border border-slate-200 rounded-xl pl-11 pr-4 text-xs font-bold text-slate-700 focus:border-blue-400 focus:ring-4 focus:ring-blue-500/5 transition-all outline-none" 
                    />
                 </div>
              </div>

              <div className="flex-1 flex overflow-hidden border-t border-slate-100">
                 <div className="w-64 border-r border-slate-100 bg-[#fbfcfd] overflow-y-auto custom-scrollbar p-1.5 space-y-0.5 shrink-0">
                    {CATEGORIES.map(c => (
                      <button 
                        key={c} 
                        onClick={() => setSelectedCategory(c)} 
                        className={`w-full text-left px-5 py-3 rounded-lg text-xs font-bold transition-all ${
                          selectedCategory === c 
                          ? 'text-blue-600 bg-blue-50/80 shadow-sm' 
                          : 'text-slate-500 hover:bg-white hover:text-slate-800'
                        }`}
                      >
                        {c}
                      </button>
                    ))}
                 </div>

                 <div className="flex-1 flex flex-col overflow-hidden bg-white">
                    <div className="flex-1 overflow-y-auto custom-scrollbar">
                       <table className="w-full border-collapse text-left">
                          <thead className="sticky top-0 z-10 bg-white shadow-[0_1px_0_rgba(0,0,0,0.05)]">
                             <tr className="text-[11px] font-black text-slate-400 uppercase tracking-widest">
                                <th className="px-6 py-4 font-bold">编码</th>
                                <th className="px-6 py-4 font-bold">类别</th>
                                <th className="px-6 py-4 font-bold">名称</th>
                                <th className="px-6 py-4 font-bold">规格型号</th>
                                <th className="px-6 py-4 font-bold text-center">单位</th>
                             </tr>
                          </thead>
                          <tbody className="divide-y divide-slate-50">
                             {filteredLibrary.map(m => (
                               <tr 
                                 key={m.id} 
                                 onClick={() => handleSelectMaterial(m)} 
                                 className="hover:bg-blue-50/20 cursor-pointer group transition-all"
                               >
                                  <td className="px-6 py-4 text-[12px] font-mono font-bold text-slate-400 group-hover:text-blue-500">{m.code}</td>
                                  <td className="px-6 py-4 text-[11px] text-slate-400 group-hover:text-slate-600">{m.category}</td>
                                  <td className="px-6 py-4 text-[13px] font-black text-slate-800 group-hover:text-blue-600 transition-colors">{m.name}</td>
                                  <td className="px-6 py-4 text-[12px] text-slate-600 group-hover:text-slate-900 font-medium">{m.spec}</td>
                                  <td className="px-6 py-4 text-[11px] font-black text-slate-400 group-hover:text-blue-600 text-center">{m.unit}</td>
                               </tr>
                             ))}
                             {filteredLibrary.length === 0 && (
                               <tr>
                                 <td colSpan={5} className="py-20 text-center text-slate-300">
                                   <Icon name="SearchX" size={48} className="mx-auto mb-4 opacity-20" />
                                   <p className="font-bold text-sm">未搜索到相关材料，请更换关键词</p>
                                 </td>
                               </tr>
                             )}
                          </tbody>
                       </table>
                    </div>
                 </div>
              </div>
           </div>
        </div>
      )}

      {/* 设置规则弹窗 */}
      {isRulesModalOpen && (
        <div className="fixed inset-0 z-[200] flex items-center justify-center bg-black/50 backdrop-blur-sm p-4 animate-in fade-in duration-200">
          <div className="bg-white rounded-[32px] shadow-2xl w-full max-w-lg overflow-hidden flex flex-col animate-in zoom-in-95 duration-200 border border-slate-200 text-left">
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
                      type="month" 
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

      {showExitConfirm && (
        <div className="fixed inset-0 z-[300] flex items-center justify-center bg-black/60 backdrop-blur-sm p-4 animate-in fade-in duration-200">
           <div className="bg-white rounded-[32px] shadow-2xl w-full max-w-sm p-8 flex flex-col items-center border border-slate-200 animate-in zoom-in-95">
              <div className="w-16 h-16 bg-amber-50 text-amber-500 rounded-2xl flex items-center justify-center mb-6 shadow-inner"><Icon name="AlertCircle" size={32} /></div>
              <h3 className="text-xl font-black text-slate-800 mb-2">未保存修改</h3>
              <p className="text-sm font-bold text-slate-500 mb-8 text-center">是否保存当前修改的内容？</p>
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

export default MaterialAdjustmentDetailView;