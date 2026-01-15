import React, { useState, useRef, useEffect, useMemo } from 'react';
import Icon from './Icon';

interface CostDetail {
  labor: number;
  material: number;
  machinery: number;
  management: number;
  profit: number;
  subtotal: number;
  total: number;
}

interface ComparisonRow {
  id: string;
  index: string;
  code: string;
  name: string;
  unit: string;
  quantity: string | number;
  contract: CostDetail;
  audit: CostDetail;
  isSubRow?: boolean;
  isHeader?: boolean;
  markedColors?: Record<string, string>; // 记录每个单元格的标记颜色 key: field_side, value: colorClass
}

interface ComparisonGroup {
  id: string;
  originalFile: string;
  originalSheet: string;
  auditFile: string;
  auditSheet: string;
}

const MOCK_FILES = ['文件1.xlsx', '文件2.xlsx', '1#楼主体.xlsx', '景观绿化.xlsx'];
const MOCK_SHEETS = ['分部分项', '措施项目', '其他项目', '规费税金'];

const MASONRY_MOCK_DATA: ComparisonRow[] = [
  { id: 'h-0104', index: '', code: '', name: '0104 砌筑工程', unit: '', quantity: '', contract: {} as any, audit: {} as any, isHeader: true },
  {
    id: 'row-1', index: '1', code: '4-1换', name: 'MU20混凝土实心砖基础 DMM20砂浆砌筑(砖胎膜)', unit: 'm3', quantity: 7.65,
    contract: { labor: 127.04, material: 513.2, machinery: 2.54, management: 21.47, profit: 10.5, subtotal: 684.77, total: 5238 },
    audit: { labor: 126.2, material: 513.2, machinery: 2.54, management: 21.33, profit: 10.43, subtotal: 683.66, total: 5230 },
  },
  {
    id: 'row-1-sub', index: '', code: '4-1换', name: '混凝土实心砖基础墙厚1砖~混凝土实心砖240×115×53 MU20', unit: '10m3', quantity: 0.765, isSubRow: true,
    contract: { labor: 1270.39, material: 5132.04, machinery: 25.37, management: 214.71, profit: 104.96, subtotal: 6847.68, total: 5238 },
    audit: { labor: 1261.98, material: 5132.04, machinery: 25.37, management: 213.31, profit: 104.28, subtotal: 6836.54, total: 5230 },
  },
  {
    id: 'row-2', index: '2', code: '12-1', name: '砖胎膜内侧20mm干混抹灰砂浆 DS15.0抹平(砖胎膜)', unit: 'm2', quantity: 180.74,
    contract: { labor: 9.89, material: 12.75, machinery: 0.2, management: 1.67, profit: 0.82, subtotal: 26.11, total: 4719 },
    audit: { labor: 9.89, material: 12.75, machinery: 0.2, management: 1.67, profit: 0.82, subtotal: 26.11, total: 4719 },
  }
];

const CONCRETE_MOCK_DATA: ComparisonRow[] = [
  { id: 'h-0105', index: '', code: '', name: '0105 混凝土及钢筋混凝土工程', unit: '', quantity: '', contract: {} as any, audit: {} as any, isHeader: true },
  {
    id: 'row-6', index: '6', code: '5-1换', name: 'C20商品砼基础垫层浇捣', unit: 'm3', quantity: 89.21,
    contract: { labor: 45.72, material: 525.36, machinery: 0.64, management: 7.68, profit: 3.76, subtotal: 586.75, total: 52344 },
    audit: { labor: 45.42, material: 525.36, machinery: 0.64, management: 7.63, profit: 3.73, subtotal: 586.34, total: 52307 },
  },
  {
    id: 'row-5-1', index: '', code: '5-1 换', name: '垫层~泵送商品混凝土C20', unit: '10m3', quantity: 8.921,
    contract: { labor: 457.23, material: 5253.62, machinery: 6.4, management: 76.82, profit: 37.55, subtotal: 5867.48, total: 52344 },
    audit: { labor: 454.2, material: 5253.62, machinery: 6.4, management: 76.32, profit: 37.31, subtotal: 5863.47, total: 52308 },
  },
  {
    id: 'row-7', index: '7', code: '5-97', name: '基础垫层模板', unit: 'm2', quantity: 41.76,
    contract: { labor: 38.05, material: 15.55, machinery: 1.13, management: 6.49, profit: 3.17, subtotal: 67.42, total: 2815 },
    audit: { labor: 37.8, material: 15.55, machinery: 1.13, management: 6.45, profit: 3.15, subtotal: 67.09, total: 2802 },
  }
];

const MARKER_COLORS = [
  { name: '清除', class: '' },
  { name: '黄色', class: 'bg-yellow-100' },
  { name: '绿色', class: 'bg-emerald-100' },
  { name: '蓝色', class: 'bg-blue-100' },
  { name: '红色', class: 'bg-rose-100' },
];

const CascadingSelect: React.FC<{
  file: string;
  sheet: string;
  onChange: (file: string, sheet: string) => void;
  placeholder?: string;
}> = ({ file, sheet, onChange, placeholder }) => {
  const [isOpen, setIsOpen] = useState(false);
  const [hoveredFile, setHoveredFile] = useState(file || MOCK_FILES[0]);

  return (
    <div className="relative">
      <button 
        onClick={(e) => { e.stopPropagation(); setIsOpen(!isOpen); }}
        className="w-full bg-slate-50 border border-slate-200 rounded-xl py-2.5 px-4 text-xs font-bold text-slate-700 flex items-center justify-between hover:border-blue-400 transition-all outline-none"
      >
        <span className="truncate pr-2">{file ? `${file} / ${sheet}` : placeholder}</span>
        <Icon name="ChevronDown" size={14} className={`text-slate-400 shrink-0 transition-transform ${isOpen ? 'rotate-180' : ''}`} />
      </button>

      {isOpen && (
        <>
          <div className="fixed inset-0 z-[110]" onClick={() => setIsOpen(false)}></div>
          <div className="absolute top-full left-0 mt-2 z-[120] bg-white border border-slate-200 rounded-2xl shadow-[0_20px_50px_rgba(0,0,0,0.15)] flex overflow-hidden min-w-[340px] animate-in fade-in zoom-in-95 duration-200" onClick={e => e.stopPropagation()}>
            <div className="w-1/2 border-r border-slate-100 bg-slate-50/50 p-2 max-h-72 overflow-y-auto custom-scrollbar">
              <div className="px-2 py-1.5 mb-1 text-[10px] font-black text-slate-400 uppercase tracking-widest">选择文件</div>
              {MOCK_FILES.map(f => (
                <div 
                  key={f}
                  onMouseEnter={() => setHoveredFile(f)}
                  className={`px-3 py-2.5 rounded-lg text-xs font-bold cursor-pointer transition-all flex items-center justify-between mb-0.5 ${hoveredFile === f ? 'bg-blue-600 text-white shadow-md' : 'text-slate-600 hover:bg-slate-200/50'}`}
                >
                  <span className="truncate">{f}</span>
                  <Icon name="ChevronRight" size={10} className={hoveredFile === f ? 'text-blue-200' : 'text-slate-300'} />
                </div>
              ))}
            </div>
            <div className="w-1/2 p-2 max-h-72 overflow-y-auto custom-scrollbar bg-white">
              <div className="px-2 py-1.5 mb-1 text-[10px] font-black text-slate-400 uppercase tracking-widest">选择页签</div>
              {MOCK_SHEETS.map(s => (
                <div 
                  key={s}
                  onClick={() => {
                    onChange(hoveredFile, s);
                    setIsOpen(false);
                  }}
                  className={`px-3 py-2.5 rounded-lg text-xs font-bold cursor-pointer transition-all mb-0.5 ${file === hoveredFile && sheet === s ? 'text-blue-600 bg-blue-50 border border-blue-100' : 'text-slate-600 hover:bg-slate-50 border border-transparent'}`}
                >
                  {s}
                </div>
              ))}
            </div>
          </div>
        </>
      )}
    </div>
  );
};

const OKContractCompareView: React.FC = () => {
  const [data, setData] = useState<ComparisonRow[]>(() => [...MASONRY_MOCK_DATA, ...CONCRETE_MOCK_DATA]);
  const [searchKeyword, setSearchKeyword] = useState('');
  const [isComparing, setIsComparing] = useState(false);
  const [showResults, setShowResults] = useState(false);
  const [showCoinAnim, setShowCoinAnim] = useState(false);
  const [showConfigModal, setShowConfigModal] = useState(false);
  const [showResetConfirm, setShowResetConfirm] = useState<{ side: 1 | 2 | null }>({ side: null });
  const [highlightedRow, setHighlightedRow] = useState<string | null>(null);
  const [file1Name, setFile1Name] = useState<string | null>(null);
  const [file2Name, setFile2Name] = useState<string | null>(null);
  const [file1Changed, setFile1Changed] = useState(false);
  const [file2Changed, setFile2Changed] = useState(false);
  const [isSidebarCollapsed, setIsSidebarCollapsed] = useState(false);
  const [showAnalysisSidebar, setShowAnalysisSidebar] = useState(true);
  
  // 核心：控制唯一的展开菜单
  const [menuOpenId, setMenuOpenId] = useState<string | null>(null);

  const [activeTabId, setActiveTabId] = useState<string | null>(null);
  const [confirmedGroups, setConfirmedGroups] = useState<ComparisonGroup[]>([]);
  const [configGroups, setConfigGroups] = useState<ComparisonGroup[]>([]);
  
  // 筛选项默认全部不勾选
  const [visibleFields, setVisibleFields] = useState({
    labor: false, material: false, machinery: false, management: false, profit: false
  });

  const [isDragging, setIsDragging] = useState(false);
  const [selectedCells, setSelectedCells] = useState<Set<string>>(new Set());
  const [contextMenu, setContextMenu] = useState<{ x: number; y: number; rowId: string; cellKey: string } | null>(null);

  const toggleField = (field: keyof typeof visibleFields) => setVisibleFields(prev => ({ ...prev, [field]: !prev[field] }));
  const setFieldVisible = (field: keyof typeof visibleFields, visible: boolean) => setVisibleFields(prev => ({ ...prev, [field]: visible }));
  const activeFieldsCount = Object.values(visibleFields).filter(Boolean).length;
  const tableContainerRef = useRef<HTMLDivElement>(null);

  const selectionSummary = useMemo(() => {
    let sum = 0;
    let count = 0;
    selectedCells.forEach(cid => {
      const [rowId, field, side] = cid.split('|');
      const row = data.find(r => r.id === rowId);
      if (row) {
        const val = (row as any)[side]?.[field];
        if (typeof val === 'number') {
          sum += val;
          count++;
        }
      }
    });
    return { sum, count };
  }, [selectedCells, data]);

  const handleCellMouseDown = (rowId: string, field: string, side: string) => {
    setIsDragging(true);
    const cellKey = `${rowId}|${field}|${side}`;
    setSelectedCells(new Set([cellKey]));
    setContextMenu(null);
    setMenuOpenId(null); // 点击表格区域关闭筛选菜单
  };

  const handleCellMouseEnter = (rowId: string, field: string, side: string) => {
    if (!isDragging) return;
    const cellKey = `${rowId}|${field}|${side}`;
    setSelectedCells(prev => {
      const next = new Set(prev);
      next.add(cellKey);
      return next;
    });
  };

  useEffect(() => {
    const handleMouseUp = () => setIsDragging(false);
    const handleGlobalClick = () => setMenuOpenId(null);
    window.addEventListener('mouseup', handleMouseUp);
    window.addEventListener('click', handleGlobalClick);
    return () => {
      window.removeEventListener('mouseup', handleMouseUp);
      window.removeEventListener('click', handleGlobalClick);
    };
  }, []);

  const handleCellContextMenu = (e: React.MouseEvent, rowId: string, field: string, side: string) => {
    e.preventDefault();
    setContextMenu({ x: e.clientX, y: e.clientY, rowId, cellKey: `${field}_${side}` });
    setMenuOpenId(null);
  };

  const applyMarkColor = (colorClass: string) => {
    if (!contextMenu) return;
    setData(prev => prev.map(r => {
      if (r.id === contextMenu.rowId) {
        return { 
          ...r, 
          markedColors: { ...(r.markedColors || {}), [contextMenu.cellKey]: colorClass } 
        };
      }
      return r;
    }));
    setContextMenu(null);
  };

  const handleDeleteRow = (id: string) => {
    setData(prev => prev.filter(r => r.id !== id));
  };

  const handleCellEdit = (rowId: string, side: 'contract' | 'audit', field: keyof CostDetail, value: string) => {
    const numVal = parseFloat(value) || 0;
    if (side === 'contract') setFile1Changed(true);
    else setFile2Changed(true);

    setData(prev => prev.map(row => {
      if (row.id === rowId) {
        const targetSide = { ...row[side] };
        (targetSide as any)[field] = numVal;
        targetSide.subtotal = targetSide.labor + targetSide.material + targetSide.machinery + targetSide.management + targetSide.profit;
        const qty = typeof row.quantity === 'string' ? parseFloat(row.quantity) || 0 : row.quantity;
        targetSide.total = Math.round(targetSide.subtotal * (typeof qty === 'number' ? qty : 0));
        return { ...row, [side]: targetSide };
      }
      return row;
    }));
  };

  const handleImport = (side: 1 | 2) => {
    if (showResults) {
      setShowResetConfirm({ side });
      return;
    }
    performImport(side);
  };

  const performImport = (side: 1 | 2) => {
    if (side === 1) {
      setFile1Name('文件1.xlsx');
      setFile1Changed(false);
    } else {
      setFile2Name('文件2.xlsx');
      setFile2Changed(false);
    }
    if (showResults) {
      setShowResults(false);
      setData([...MASONRY_MOCK_DATA, ...CONCRETE_MOCK_DATA]);
    }
    setShowResetConfirm({ side: null });
  };

  const handleDeleteFile = (side: 1 | 2, e: React.MouseEvent) => {
    e.stopPropagation();
    if (showResults) {
      setShowResetConfirm({ side });
      return;
    }
    if (side === 1) {
      setFile1Name(null);
      setFile1Changed(false);
    } else {
      setFile2Name(null);
      setFile2Changed(false);
    }
  };

  const startConfig = () => {
    if (!file1Name || !file2Name) return;
    const defaultGroups = MOCK_SHEETS.map((sheet, index) => ({
      id: (Date.now() + index).toString(),
      originalFile: file1Name!,
      originalSheet: sheet,
      auditFile: file2Name!,
      auditSheet: sheet
    }));
    setConfigGroups(defaultGroups);
    setShowConfigModal(true);
  };

  const handleConfirmCompare = () => {
    setShowConfigModal(false);
    setIsComparing(true);
    setTimeout(() => {
      setIsComparing(false);
      setConfirmedGroups([...configGroups]);
      setActiveTabId(configGroups[0]?.id || null);
      setShowResults(true);
      setShowCoinAnim(true);
      setTimeout(() => setShowCoinAnim(false), 1750);
    }, 1200);
  };

  const updateConfigGroup = (id: string, field: keyof ComparisonGroup, value: any) => {
    setConfigGroups(configGroups.map(g => g.id === id ? { ...g, [field]: value } : g));
  };

  const scrollToSide = (id: string, side: 'contract' | 'audit', field?: keyof typeof visibleFields) => {
    const performScroll = () => {
      const targetId = field ? `${id}_${String(field)}_${side}` : `${id}_${side}`;
      setHighlightedRow(targetId);
      const element = document.getElementById(targetId);
      if (element) element.scrollIntoView({ behavior: 'smooth', block: 'center', inline: 'center' });
      setTimeout(() => setHighlightedRow(null), 3000);
    };
    if (field && !visibleFields[field]) {
      setFieldVisible(field, true);
      setTimeout(performScroll, 50);
    } else {
      performScroll();
    }
  };

  const renderCell = (valCurrent: number, valOther: number, isEditable: boolean = false, rowId?: string, side?: 'contract' | 'audit', field?: string) => {
    if (valCurrent === undefined) return '';
    const isDiff = Math.abs(valCurrent - valOther) > 0.001;
    const cellKey = rowId && field && side ? `${rowId}|${field}|${side}` : null;
    const isSelected = cellKey && selectedCells.has(cellKey);

    if (isEditable && rowId && side && field) {
      return (
        <input 
          type="number"
          value={valCurrent || ''}
          onChange={(e) => handleCellEdit(rowId, side, field as keyof CostDetail, e.target.value)}
          className={`w-full bg-transparent border-none outline-none text-right focus:ring-1 focus:ring-blue-400 rounded transition-all [appearance:textfield] whitespace-nowrap px-2 text-xs ${isSelected ? 'text-white' : isDiff ? 'text-red-600 font-bold' : 'text-slate-600'}`}
        />
      );
    }
    return (
      <span className={`inline-block w-full px-2 py-1 rounded transition-colors whitespace-nowrap text-right text-xs ${isSelected ? 'text-white' : isDiff ? 'bg-red-50 text-red-600 font-bold' : 'text-slate-600'}`}>
        {valCurrent === 0 && valOther === 0 ? '0.00' : valCurrent.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
      </span>
    );
  };

  const renderFilterMenu = () => (
    <div 
      onClick={e => e.stopPropagation()} 
      className="absolute top-full right-0 mt-2 z-[60] bg-white border border-slate-200 rounded-2xl shadow-[0_15px_40px_rgba(0,0,0,0.15)] p-4 w-48 animate-in fade-in zoom-in-95 duration-200 text-left"
    >
      <div className="flex items-center space-x-2 mb-3 px-1">
        <Icon name="Filter" size={12} className="text-blue-500" />
        <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">科目筛选</p>
      </div>
      <div className="space-y-2">
        {[{ key: 'labor', label: '人工费' }, { key: 'material', label: '材料费' }, { key: 'machinery', label: '机械费' }, { key: 'management', label: '管理费' }, { key: 'profit', label: '利润' }].map(item => (
          <label key={item.key} className="flex items-center space-x-3 cursor-pointer group px-1 py-0.5 rounded-lg hover:bg-slate-50 transition-colors">
            <div className={`w-4 h-4 rounded border flex items-center justify-center transition-all ${visibleFields[item.key as keyof typeof visibleFields] ? 'bg-blue-600 border-blue-600' : 'border-slate-300 group-hover:border-blue-400'}`}>
              {visibleFields[item.key as keyof typeof visibleFields] && <Icon name="Check" size={10} className="text-white" strokeWidth={4} />}
            </div>
            <input 
              type="checkbox" 
              className="hidden" 
              checked={visibleFields[item.key as keyof typeof visibleFields]} 
              onChange={() => toggleField(item.key as keyof typeof visibleFields)} 
            />
            <span className={`text-xs font-bold transition-colors ${visibleFields[item.key as keyof typeof visibleFields] ? 'text-blue-600' : 'text-slate-500 group-hover:text-slate-800'}`}>{item.label}</span>
          </label>
        ))}
      </div>
    </div>
  );

  const renderUnifiedTable = (tableData: ComparisonRow[], tableId: string) => {
    const feeColSpan = activeFieldsCount + 1;
    const contractTotalCols = feeColSpan + 1;
    const auditTotalCols = feeColSpan + 1;
    const totalCols = 6 + contractTotalCols + auditTotalCols + 2; 

    if (tableData.length === 0 || (tableData.length === 1 && tableData[0].isHeader)) return null;
    
    return (
      <table className="w-auto text-left border-collapse table-auto bg-white rounded-2xl shadow-sm overflow-hidden mb-12">
        <thead className="sticky top-0 z-10 shadow-sm">
          <tr className="bg-slate-100 border-b border-slate-300">
            <th className="px-3 py-2 border-r border-slate-200"></th>
            <th colSpan={5} className="px-3 py-2 text-xs font-black text-slate-500 border-r border-slate-200">单位（专业）工程名称：2#-g地块-地下室</th>
            <th colSpan={contractTotalCols} className="px-3 py-2 text-center text-xs font-black text-blue-800 bg-blue-50 border-r-2 border-r-blue-200 uppercase tracking-widest">文件1</th>
            <th colSpan={auditTotalCols} className="px-3 py-2 text-center text-xs font-black text-emerald-800 bg-emerald-50 border-r-2 border-r-emerald-200 uppercase tracking-widest">文件2</th>
            <th colSpan={2} className="px-3 py-2 text-center text-xs font-black text-red-800 bg-red-50 uppercase tracking-widest">对比差异统计</th>
          </tr>
          <tr className="bg-slate-50 border-b border-slate-300">
            <th rowSpan={2} className="px-3 py-3 text-xs font-black text-slate-700 border-r border-slate-200 text-center whitespace-nowrap">操作</th>
            <th rowSpan={2} className="px-3 py-3 text-xs font-black text-slate-700 border-r border-slate-200 text-center whitespace-nowrap">清单序号</th>
            <th rowSpan={2} className="px-3 py-3 text-xs font-black text-slate-700 border-r border-slate-200 whitespace-nowrap">项目编码</th>
            <th rowSpan={2} className="px-3 py-3 text-xs font-black text-slate-700 border-r border-slate-300 whitespace-nowrap min-w-[200px]">项目名称</th>
            <th rowSpan={2} className="px-3 py-3 text-xs font-black text-slate-700 border-r border-slate-200 text-center whitespace-nowrap">单位</th>
            <th rowSpan={2} className="px-3 py-3 text-xs font-black text-slate-700 border-r-2 border-r-slate-300 text-right whitespace-nowrap">数量</th>
            <th colSpan={feeColSpan} className="px-3 py-2 text-[10px] font-black text-blue-600 text-center border-b border-slate-200 border-r border-slate-200 bg-blue-50/30">
              <div className="relative flex items-center justify-center space-x-1">
                <span>综合单价 (元)</span>
                <button 
                  onClick={(e) => { e.stopPropagation(); setMenuOpenId(menuOpenId === `contract-${tableId}` ? null : `contract-${tableId}`); }} 
                  className={`p-0.5 rounded transition-all outline-none ${menuOpenId === `contract-${tableId}` ? 'bg-blue-600 text-white' : 'hover:bg-blue-100 text-blue-600'}`}
                >
                  <Icon name="Settings2" size={12} />
                </button>
                {menuOpenId === `contract-${tableId}` && renderFilterMenu()}
              </div>
            </th>
            <th rowSpan={2} className="px-3 py-3 text-xs font-black text-slate-700 text-right border-r-2 border-r-blue-200 bg-blue-50/30 min-w-[120px]">合计(元)</th>
            <th colSpan={feeColSpan} className="px-3 py-2 text-[10px] font-black text-emerald-600 text-center border-b border-slate-200 border-r border-slate-200 bg-emerald-50/30">
              <div className="relative flex items-center justify-center space-x-1">
                <span>综合单价 (元)</span>
                <button 
                  onClick={(e) => { e.stopPropagation(); setMenuOpenId(menuOpenId === `audit-${tableId}` ? null : `audit-${tableId}`); }} 
                  className={`p-0.5 rounded transition-all outline-none ${menuOpenId === `audit-${tableId}` ? 'bg-emerald-600 text-white' : 'hover:bg-emerald-100 text-emerald-600'}`}
                >
                  <Icon name="Settings2" size={12} />
                </button>
                {menuOpenId === `audit-${tableId}` && renderFilterMenu()}
              </div>
            </th>
            <th rowSpan={2} className="px-3 py-3 text-xs font-black text-slate-700 text-right border-r-2 border-r-emerald-200 bg-emerald-50/30 min-w-[120px]">合计(元)</th>
            <th rowSpan={2} className="px-3 py-2 text-xs font-bold text-slate-600 text-right border-r border-slate-200 bg-red-50/50 min-w-[100px]">小计差异</th>
            <th rowSpan={2} className="px-3 py-2 text-xs font-bold text-slate-600 text-right bg-red-50/50 min-w-[100px]">合计差异</th>
          </tr>
          <tr className="bg-slate-50 border-b border-slate-300 text-right">
            {Object.entries(visibleFields).filter(([_, v]) => v).map(([k, _]) => <th key={k} className="px-2 py-2 text-[10px] font-bold text-slate-400 border-r border-slate-100 bg-blue-50/10 min-w-[105px] text-center">{k === 'labor' ? '人工' : k === 'material' ? '材料' : k === 'machinery' ? '机械' : k === 'management' ? '管理' : '利润'}</th>)}
            <th className="px-3 py-2 text-[10px] font-bold text-slate-500 border-r border-slate-200 bg-blue-100/30 min-w-[120px] text-center">小计</th>
            {Object.entries(visibleFields).filter(([_, v]) => v).map(([k, _]) => <th key={k} className="px-2 py-2 text-[10px] font-bold text-slate-400 border-r border-slate-100 bg-emerald-50/10 min-w-[105px] text-center">{k === 'labor' ? '人工' : k === 'material' ? '材料' : k === 'machinery' ? '机械' : k === 'management' ? '管理' : '利润'}</th>)}
            <th className="px-3 py-2 text-[10px] font-bold text-slate-500 border-r border-slate-200 bg-emerald-100/30 min-w-[120px] text-center">小计</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-slate-200">
          {tableData.map((row) => (
            row.isHeader ? (
              <tr key={row.id} className="bg-slate-100/80"><td colSpan={totalCols} className="px-4 py-2 text-[11px] font-black text-slate-800 tracking-wide uppercase border-r border-slate-300 whitespace-nowrap">{row.name}</td></tr>
            ) : (
              <tr key={row.id} className={`hover:bg-blue-50/20 transition-all duration-300 ${row.isSubRow ? 'bg-slate-50/30' : 'bg-white'}`}>
                <td className="px-3 py-3 border-r border-slate-100 text-center">
                  <button onClick={(e) => { e.stopPropagation(); handleDeleteRow(row.id); }} className="p-1.5 text-slate-300 hover:text-rose-500 transition-colors rounded-lg"><Icon name="Trash2" size={14} /></button>
                </td>
                <td className="px-3 py-3 text-xs text-center font-bold text-slate-400 border-r border-slate-100">{row.index}</td>
                <td className="px-3 py-3 text-xs font-medium text-slate-500 border-r border-slate-100">{row.code}</td>
                <td className={`px-4 py-3 text-xs font-bold text-slate-800 border-r border-slate-300 ${row.isSubRow ? 'pl-10 font-medium text-slate-600 italic' : ''}`}>{row.name}</td>
                <td className="px-3 py-3 text-xs text-center text-slate-400 border-r border-slate-100">{row.unit}</td>
                <td className="px-3 py-3 text-xs text-right font-medium text-slate-700 border-r-2 border-r-slate-300">{row.quantity}</td>
                {Object.keys(visibleFields).map(k => visibleFields[k as keyof typeof visibleFields] && (
                  <td 
                    key={k} 
                    id={`${row.id}_${k}_contract`} 
                    onMouseDown={() => handleCellMouseDown(row.id, k, 'contract')}
                    onMouseEnter={() => handleCellMouseEnter(row.id, k, 'contract')}
                    onContextMenu={(e) => handleCellContextMenu(e, row.id, k, 'contract')}
                    className={`px-1 py-3 text-right border-r border-slate-100 select-none cursor-cell transition-all ${selectedCells.has(`${row.id}|${k}|contract`) ? 'bg-blue-500 ring-2 ring-blue-400 z-10' : row.markedColors?.[`${k}_contract`] || ''} ${highlightedRow === `${row.id}_${k}_contract` ? 'ring-2 ring-blue-300' : ''}`}
                  >
                    {renderCell((row.contract as any)[k], (row.audit as any)[k], true, row.id, 'contract', k)}
                  </td>
                ))}
                <td className="px-3 py-3 text-xs text-right border-r border-slate-200 bg-slate-50/30 font-medium text-slate-600">{renderCell(row.contract.subtotal, row.audit.subtotal)}</td>
                <td className="px-3 py-3 text-xs text-right font-black text-slate-900 border-r-2 border-r-blue-200 bg-blue-50/10">{renderCell(row.contract.total, row.audit.total)}</td>
                {Object.keys(visibleFields).map(k => visibleFields[k as keyof typeof visibleFields] && (
                  <td 
                    key={k} 
                    id={`${row.id}_${k}_audit`} 
                    onMouseDown={() => handleCellMouseDown(row.id, k, 'audit')}
                    onMouseEnter={() => handleCellMouseEnter(row.id, k, 'audit')}
                    onContextMenu={(e) => handleCellContextMenu(e, row.id, k, 'audit')}
                    className={`px-1 py-3 text-right border-r border-slate-100 select-none cursor-cell transition-all ${selectedCells.has(`${row.id}|${k}|audit`) ? 'bg-emerald-500 ring-2 ring-emerald-400 z-10' : row.markedColors?.[`${k}_audit`] || ''} ${highlightedRow === `${row.id}_${k}_audit` ? 'ring-2 ring-emerald-300' : ''}`}
                  >
                    {renderCell((row.audit as any)[k], (row.contract as any)[k], true, row.id, 'audit', k)}
                  </td>
                ))}
                <td className="px-3 py-3 text-xs text-right border-r border-slate-200 bg-slate-50/30 font-medium text-slate-600">{renderCell(row.audit.subtotal, row.contract.subtotal)}</td>
                <td className="px-3 py-3 text-xs text-right font-black text-slate-900 border-r-2 border-r-emerald-200 bg-emerald-50/10">{renderCell(row.audit.total, row.audit.total)}</td>
                <td className="px-3 py-3 text-xs text-right border-r border-slate-200 font-black bg-red-50/10 text-red-600">{(row.audit.subtotal - row.contract.subtotal).toFixed(2)}</td>
                <td className="px-3 py-3 text-xs text-right font-black bg-red-50/10 text-red-600">{(row.audit.total - row.contract.total).toFixed(2)}</td>
              </tr>
            )
          ))}
        </tbody>
      </table>
    );
  };

  const renderFileRow = (side: 1 | 2) => {
    const fileName = side === 1 ? file1Name : file2Name;
    const isChanged = side === 1 ? file1Changed : file2Changed;
    const label = `文件${side}`;
    return (
      <div className="flex items-center space-x-3 bg-slate-50 p-1.5 rounded-2xl border border-slate-100 flex-1 min-w-[320px]">
        <div className="px-4 py-1.5 text-xs font-black text-slate-400 bg-slate-100/50 rounded-xl uppercase tracking-widest shrink-0">{label}</div>
        <div className="flex-1 flex items-center px-4 py-1.5 text-sm font-bold text-slate-700 bg-white rounded-xl shadow-sm border border-slate-100 h-9 overflow-hidden">
          {fileName ? (
            <div className="flex items-center justify-between w-full">
              <div className="flex items-center space-x-2 truncate">
                <Icon name="FileText" size={14} className="text-blue-500 shrink-0" />
                <span className="truncate">{fileName}</span>
                {isChanged && <span className="bg-red-500 text-white text-[10px] px-1.5 py-0.5 rounded font-black animate-pulse shrink-0">变动</span>}
              </div>
              <button onClick={(e) => handleDeleteFile(side, e)} className="ml-2 text-slate-300 hover:text-red-500 transition-colors shrink-0"><Icon name="Trash2" size={14} /></button>
            </div>
          ) : <span className="text-slate-300 italic font-medium whitespace-nowrap">请导入文件</span>}
        </div>
        <button 
          onClick={() => fileName ? alert(`模拟下载导出: ${fileName}`) : handleImport(side)} 
          className={`px-5 py-1.5 rounded-xl text-xs font-black transition-all shrink-0 ${fileName ? 'bg-blue-50 text-blue-600 hover:bg-blue-100 border border-blue-200 shadow-sm' : 'bg-blue-600 text-white hover:bg-blue-700 shadow-lg shadow-blue-500/20'}`}
        >
          {fileName ? '导出' : '导入'}
        </button>
      </div>
    );
  };

  const filterByKeyword = (rows: ComparisonRow[]) => {
    if (!searchKeyword.trim()) return rows;
    const keyword = searchKeyword.toLowerCase();
    const result: ComparisonRow[] = [];
    let currentHeader: ComparisonRow | null = null;
    let headerMatches = false;
    let pendingRows: ComparisonRow[] = [];
    rows.forEach(row => {
      if (row.isHeader) {
        if (currentHeader && (headerMatches || pendingRows.length > 0)) result.push(currentHeader, ...pendingRows);
        currentHeader = row;
        headerMatches = row.name.toLowerCase().includes(keyword);
        pendingRows = [];
      } else {
        if (row.name.toLowerCase().includes(keyword) || row.code.toLowerCase().includes(keyword)) pendingRows.push(row);
      }
    });
    if (currentHeader && (headerMatches || pendingRows.length > 0)) result.push(currentHeader, ...pendingRows);
    return result;
  };

  const masonryRows = filterByKeyword(data.filter(r => MASONRY_MOCK_DATA.some(m => m.id === r.id)));
  const concreteRows = filterByKeyword(data.filter(r => CONCRETE_MOCK_DATA.some(c => c.id === r.id)));

  return (
    <div className="flex flex-col h-full bg-[#f0f2f5] overflow-hidden relative font-sans text-slate-900" onClick={() => setSelectedCells(new Set())}>
      {/* 右键标记菜单 */}
      {contextMenu && (
        <div 
          className="fixed z-[200] bg-white border border-slate-200 rounded-2xl shadow-2xl p-2 w-36 animate-in fade-in zoom-in-95 duration-200"
          style={{ left: contextMenu.x, top: contextMenu.y }}
          onClick={(e) => e.stopPropagation()}
        >
          <p className="px-3 py-2 text-[10px] font-black text-slate-400 uppercase tracking-widest border-b border-slate-50 mb-1">标记单元格</p>
          {MARKER_COLORS.map(c => (
            <button 
              key={c.name}
              onClick={() => applyMarkColor(c.class)}
              className="w-full text-left px-3 py-2 rounded-lg hover:bg-slate-50 flex items-center space-x-2 group transition-colors"
            >
              <div className={`w-3 h-3 rounded-full border border-slate-200 ${c.class || 'bg-white'}`}></div>
              <span className="text-xs font-bold text-slate-600 group-hover:text-blue-600">{c.name}</span>
            </button>
          ))}
        </div>
      )}

      {/* 选区汇总浮窗 */}
      {selectedCells.size > 1 && (
        <div className="fixed bottom-12 left-1/2 -translate-x-1/2 z-[100] bg-slate-900 text-white px-8 py-4 rounded-full shadow-2xl border border-white/10 flex items-center space-x-8 animate-in slide-in-from-bottom-4 duration-300">
          <div className="flex items-center space-x-2">
            <Icon name="Calculator" size={16} className="text-blue-400" />
            <span className="text-[10px] font-black text-blue-200 uppercase tracking-widest">选区实时汇总</span>
          </div>
          <div className="h-6 w-px bg-white/20"></div>
          <div className="flex items-center space-x-6">
            <div><span className="text-[10px] text-slate-400 mr-2 uppercase">数量</span><span className="text-lg font-black">{selectionSummary.count}</span></div>
            <div><span className="text-[10px] text-slate-400 mr-2 uppercase">汇总值</span><span className="text-2xl font-black text-emerald-400">¥ {selectionSummary.sum.toLocaleString(undefined, { minimumFractionDigits: 2 })}</span></div>
          </div>
          <button onClick={(e) => { e.stopPropagation(); setSelectedCells(new Set()); }} className="p-1 hover:bg-white/10 rounded-full transition-colors"><Icon name="X" size={16} /></button>
        </div>
      )}

      {/* Reset Confirmation Modal */}
      {showResetConfirm.side !== null && (
        <div className="fixed inset-0 z-[120] flex items-center justify-center bg-black/50 backdrop-blur-sm p-4 animate-in fade-in duration-200">
          <div className="bg-white rounded-[32px] w-full max-w-md p-8 shadow-2xl animate-in zoom-in-95 duration-300 text-center" onClick={e => e.stopPropagation()}>
            <div className="w-16 h-16 bg-amber-50 text-amber-500 rounded-full flex items-center justify-center mx-auto mb-6"><Icon name="AlertTriangle" size={32} /></div>
            <h3 className="text-xl font-black text-slate-800 mb-4">确定重新导入吗？</h3>
            <p className="text-slate-500 text-sm leading-relaxed mb-8">当前已有比对结果。重新导入文件将清空当前的对比数据和所有手动修改项，需要重新点击“开始对比”生成结果。</p>
            <div className="flex space-x-3">
              <button onClick={() => setShowResetConfirm({ side: null })} className="flex-1 px-6 py-3 border border-slate-200 rounded-2xl text-sm font-bold text-slate-600 hover:bg-slate-50">返回</button>
              <button onClick={() => performImport(showResetConfirm.side as any)} className="flex-1 px-6 py-3 bg-red-500 text-white rounded-2xl text-sm font-bold hover:bg-red-600">确定导入</button>
            </div>
          </div>
        </div>
      )}

      {/* Config Modal */}
      {showConfigModal && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/45 backdrop-blur-sm p-4 animate-in fade-in duration-200" onClick={() => setShowConfigModal(false)}>
          <div className="bg-white rounded-lg shadow-2xl w-full max-w-5xl overflow-hidden flex flex-col animate-in zoom-in-95 duration-300" onClick={e => e.stopPropagation()}>
             <div className="px-6 py-4 border-b border-slate-100 flex items-center justify-between"><h3 className="text-lg font-medium text-slate-700">比对配置</h3><button onClick={() => setShowConfigModal(false)} className="text-slate-400 hover:text-slate-600"><Icon name="X" size={20} /></button></div>
             <div className="flex-1 overflow-y-auto p-8 max-h-[70vh] custom-scrollbar">
                <table className="w-full text-left border-collapse">
                   <thead><tr className="border-b border-slate-200 text-slate-400 text-xs font-black uppercase tracking-widest"><th className="pb-4 pl-4 w-20">组别</th><th className="pb-4 px-4">原始文件选择</th><th className="pb-4 px-4">比对文件选择</th><th className="pb-4 pr-4 text-right">操作</th></tr></thead>
                   <tbody className="divide-y divide-slate-100">
                      {configGroups.map((group, idx) => (
                        <tr key={group.id} className="group"><td className="py-6 pl-4 align-top"><span className="inline-flex items-center justify-center w-12 h-8 bg-blue-50 text-blue-600 rounded-lg text-xs font-black">组{idx+1}</span></td><td className="py-6 px-4 align-top"><CascadingSelect file={group.originalFile} sheet={group.originalSheet} onChange={(f, s) => { updateConfigGroup(group.id, 'originalFile', f); updateConfigGroup(group.id, 'originalSheet', s); }} placeholder="选择页签" /></td><td className="py-6 px-4 align-top"><CascadingSelect file={group.auditFile} sheet={group.auditSheet} onChange={(f, s) => { updateConfigGroup(group.id, 'auditFile', f); updateConfigGroup(group.id, 'auditSheet', s); }} placeholder="选择页签" /></td><td className="py-6 pr-4 align-top text-right"><button className="p-2 text-rose-400 hover:text-rose-600"><Icon name="Trash2" size={18} /></button></td></tr>
                      ))}
                   </tbody>
                </table>
             </div>
             <div className="px-8 py-6 border-t border-slate-100 bg-slate-50/50 flex items-center justify-end space-x-4"><button onClick={() => setShowConfigModal(false)} className="px-8 py-2.5 border border-slate-200 bg-white rounded-xl text-xs font-black text-slate-600">取消</button><button onClick={handleConfirmCompare} className="px-10 py-2.5 bg-blue-600 text-white rounded-xl text-xs font-black shadow-lg">确定比对</button></div>
          </div>
        </div>
      )}

      {showCoinAnim && (
        <div className="fixed inset-0 z-[110] flex items-center justify-center bg-black/20 backdrop-blur-[2px] pointer-events-none animate-in fade-in duration-200">
          <div className="bg-white rounded-[40px] p-12 shadow-2xl flex flex-col items-center animate-in zoom-in-50 duration-300 border-[6px] border-yellow-400 relative">
            <div className="absolute inset-0 bg-yellow-400/5 rounded-[34px] animate-pulse"></div>
            <div className="relative mb-8"><div className="w-28 h-28 bg-gradient-to-tr from-yellow-600 via-yellow-400 to-yellow-200 rounded-full flex items-center justify-center animate-gold shadow-[0_0_30px_rgba(234,179,8,0.5)]"><Icon name="Coins" size={56} className="text-white drop-shadow-md" /></div></div>
            <div className="text-center relative z-10"><h2 className="text-4xl font-black text-slate-800 mb-2 tracking-tight">对比任务完成!</h2></div>
          </div>
        </div>
      )}

      {/* Main Header with Rows side-by-side */}
      <div className="bg-white border-b border-slate-200 px-6 py-5 flex items-center justify-between shrink-0 shadow-sm z-30">
        <div className="flex items-center space-x-4 flex-1">
          {renderFileRow(1)}
          {renderFileRow(2)}
        </div>
        <div className="ml-8 flex flex-col items-end shrink-0">
          <button 
            onClick={(e) => { e.stopPropagation(); startConfig(); }} 
            disabled={!file1Name || !file2Name || isComparing} 
            className="px-10 py-3.5 bg-blue-600 text-white font-black text-sm rounded-[20px] shadow-xl shadow-blue-500/30 hover:bg-blue-700 transition-all active:scale-95 disabled:grayscale disabled:opacity-50 tracking-widest uppercase"
          >
            {isComparing ? <Icon name="Loader2" className="animate-spin" /> : '开始对比'}
          </button>
        </div>
      </div>

      <div className="flex-1 flex overflow-hidden relative">
        {/* Sidebar */}
        <div className={`bg-white border-r border-slate-200 flex flex-col shrink-0 transition-all duration-300 ${isSidebarCollapsed ? 'w-12' : 'w-56'}`}>
          <div className="px-4 py-4 border-b border-slate-100 flex items-center justify-between overflow-hidden">
            {!isSidebarCollapsed && <span className="text-xs font-black text-slate-400 uppercase tracking-widest">对比记录栏</span>}
            <button onClick={(e) => { e.stopPropagation(); setIsSidebarCollapsed(!isSidebarCollapsed); }} className="p-1 hover:bg-slate-50 rounded-lg text-slate-300"><Icon name={isSidebarCollapsed ? 'PanelLeftOpen' : 'PanelLeftClose'} size={16} /></button>
          </div>
          {!isSidebarCollapsed && (
            <div className="flex-1 overflow-y-auto p-3 space-y-4">
              {['记录1: 2#-g地块地下室', '记录2: 1#楼主体'].map((rec, i) => (
                <div key={i} className="group p-3 rounded-xl border border-transparent hover:border-blue-100 hover:bg-blue-50/30 cursor-pointer transition-all">
                  <p className="text-xs font-bold text-slate-700 group-hover:text-blue-600 truncate mb-1">{rec}</p>
                  <p className="text-[10px] text-slate-400 font-medium">2024-05-20 14:00</p>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Content */}
        <div className="flex-1 flex flex-col overflow-hidden relative bg-white">
          {!showResults ? (
            <div className="flex-1 flex flex-col items-center justify-center text-slate-400 space-y-4 opacity-40"><Icon name="Layout" size={64} /><p className="font-bold text-base">请先导入并点击“开始对比”以查看差异报表</p></div>
          ) : (
            <>
              <div className="px-4 py-2 bg-slate-50 border-b border-slate-200 flex items-center justify-between shrink-0 overflow-x-auto no-scrollbar">
                 <div className="flex items-center space-x-2">
                   {confirmedGroups.map((group) => (
                     <button key={group.id} onClick={(e) => { e.stopPropagation(); setActiveTabId(group.id); }} className={`px-4 py-2 rounded-xl text-xs font-black transition-all border shrink-0 ${activeTabId === group.id ? 'bg-white border-blue-200 text-blue-600 shadow-sm ring-1 ring-blue-50' : 'bg-transparent border-transparent text-slate-400 hover:text-slate-600'}`}>{group.originalFile.split('.')[0]}-{group.originalSheet}</button>
                   ))}
                 </div>
                 
                 {/* 搜索框与筛选设置 */}
                 <div className="flex items-center px-4 shrink-0 space-x-3">
                    <div className="relative group">
                        <Icon name="Search" size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 group-focus-within:text-blue-500 transition-colors" />
                        <input 
                          type="text" 
                          value={searchKeyword}
                          onChange={(e) => setSearchKeyword(e.target.value)}
                          placeholder="搜索清单/定额名称..." 
                          className="w-64 bg-white border border-slate-200 rounded-xl py-1.5 pl-9 pr-8 text-xs font-bold text-slate-700 focus:outline-none focus:ring-4 focus:ring-blue-500/10 focus:border-blue-400 transition-all outline-none"
                        />
                        {searchKeyword && (
                          <button 
                            onClick={(e) => { e.stopPropagation(); setSearchKeyword(''); }}
                            className="absolute right-2 top-1/2 -translate-y-1/2 text-slate-300 hover:text-slate-500"
                          >
                            <Icon name="X" size={14} />
                          </button>
                        )}
                    </div>
                    {/* 工具栏筛选按钮 */}
                    <div className="relative">
                        <button 
                          onClick={(e) => { e.stopPropagation(); setMenuOpenId(menuOpenId === 'toolbar' ? null : 'toolbar'); }}
                          className={`w-10 h-10 border rounded-xl flex items-center justify-center transition-all ${menuOpenId === 'toolbar' ? 'bg-blue-600 text-white border-blue-600' : 'bg-white border-slate-100 text-slate-400 hover:bg-slate-50 hover:text-blue-500'}`}
                        >
                            <Icon name="Settings2" size={18} />
                        </button>
                        {menuOpenId === 'toolbar' && renderFilterMenu()}
                    </div>
                 </div>
              </div>
              <div ref={tableContainerRef} className="flex-1 overflow-auto bg-slate-100 p-6 animate-in fade-in slide-in-from-bottom-2 duration-500 relative">
                <div className="max-w-[1600px] mx-auto space-y-4">
                   {(masonryRows.length === 0 && concreteRows.length === 0) ? (
                     <div className="bg-white rounded-3xl p-20 flex flex-col items-center justify-center text-slate-300 shadow-sm border border-slate-100">
                        <Icon name="SearchX" size={48} className="mb-4 opacity-20" />
                        <p className="font-bold text-sm">未找到与“{searchKeyword}”相关的清单项</p>
                        <button onClick={() => setSearchKeyword('')} className="mt-4 text-blue-500 text-xs font-black underline hover:text-blue-700">清空搜索条件</button>
                     </div>
                   ) : (
                     <>
                       <div className="min-w-full inline-block align-middle animate-in fade-in slide-in-from-top-2 duration-300">
                         {renderUnifiedTable(masonryRows, 'table-1')}
                       </div>
                       <div className="min-w-full inline-block align-middle animate-in fade-in slide-in-from-top-2 duration-300">
                         {renderUnifiedTable(concreteRows, 'table-2')}
                       </div>
                     </>
                   )}
                </div>
                
                {!showAnalysisSidebar && (
                  <div className="absolute right-0 top-1/2 -translate-y-1/2 z-40">
                    <button 
                      onClick={(e) => { e.stopPropagation(); setShowAnalysisSidebar(true); }}
                      className="flex items-center justify-center w-8 h-12 bg-white border border-r-0 border-slate-200 rounded-l-xl shadow-lg text-slate-400 hover:text-blue-600 transition-all"
                      title="展开差异分布概览"
                    >
                      <Icon name="PanelRightOpen" size={18} />
                    </button>
                  </div>
                )}
              </div>
            </>
          )}
        </div>

        {/* Analysis Sidebar */}
        {showResults && (
          <div className={`bg-white border-l border-slate-200 flex flex-col shrink-0 transition-all duration-300 ${showAnalysisSidebar ? 'w-80' : 'w-0 overflow-hidden'}`}>
            <div className="p-4 bg-slate-50 border-b border-slate-200 flex items-center justify-between shrink-0"><span className="font-bold text-sm text-slate-800 truncate">单位（专业）工程名称：2#-G地块-地下室</span><button onClick={(e) => { e.stopPropagation(); setShowAnalysisSidebar(false); }} className="p-1.5 hover:bg-slate-200 rounded-lg text-slate-400"><Icon name="PanelRightClose" size={18} /></button></div>
            <div className="flex-1 overflow-y-auto custom-scrollbar p-4 space-y-6">
               <div className="bg-blue-50/50 rounded-2xl p-4 border border-blue-100 mb-2 shadow-sm">
                  <h4 className="text-xs font-black text-blue-600 mb-3 border-b border-blue-100 pb-2">对比摘要</h4>
                  <div className="space-y-2">
                    <div className="flex justify-between text-xs items-center">
                      <span className="text-slate-500 font-bold">总差异项</span>
                      <span className="font-black text-red-600 text-sm">{data.filter(r => !r.isHeader && Math.abs(r.contract.labor - r.audit.labor) > 0.01).length} 项</span>
                    </div>
                    <div className="flex justify-between text-xs items-center">
                      <span className="text-slate-500 font-bold">累计核减</span>
                      <span className="font-black text-emerald-600 text-sm">¥ {(data.filter(r => !r.isHeader).reduce((acc, r) => acc + (r.contract.total - r.audit.total), 0)).toFixed(2)}</span>
                    </div>
                  </div>
               </div>
               <div className="space-y-5">
                  <h4 className="text-[11px] font-black text-slate-400 uppercase tracking-widest mb-4">差异明细定位</h4>
                  {data.filter(r => !r.isHeader && (Math.abs(r.contract.labor - r.audit.labor) > 0.1)).map((row) => {
                    const diff = row.contract.labor - row.audit.labor;
                    return (
                      <div key={row.id} className="border border-slate-100 rounded-xl overflow-hidden bg-white shadow-sm flex flex-col group/item mb-1">
                          <div className="p-4 border-b border-slate-50 bg-white">
                            <p className="text-[12px] font-bold text-slate-800 leading-snug">
                              <span className="text-blue-600 mr-2">{row.code}</span>
                              {row.name}
                            </p>
                          </div>
                          <div onClick={(e) => { e.stopPropagation(); scrollToSide(row.id, 'contract', 'labor'); }} className="flex items-center justify-between px-4 py-3 border-l-[4px] border-l-blue-500 hover:bg-blue-50 cursor-pointer transition-colors">
                            <span className="text-[12px] font-medium text-slate-500">原始人工费</span>
                            <span className="text-[12px] font-bold text-slate-800">¥ {row.contract.labor.toFixed(2)}</span>
                          </div>
                          <div onClick={(e) => { e.stopPropagation(); scrollToSide(row.id, 'audit', 'labor'); }} className="flex items-center justify-between px-4 py-3 border-l-[4px] border-l-emerald-500 border-t border-t-slate-50 hover:bg-emerald-50 cursor-pointer transition-colors">
                            <span className="text-[12px] font-medium text-slate-500">比对人工费</span>
                            <span className="text-[12px] font-bold text-slate-800">¥ {row.audit.labor.toFixed(2)}</span>
                          </div>
                          <div className="flex items-center justify-between px-4 py-3 border-l-[4px] border-l-red-500 border-t border-t-slate-50 bg-red-50/50">
                            <span className="text-[12px] font-bold text-red-600">差异值</span>
                            <span className="text-[12px] font-black text-red-600">¥ {Math.abs(diff).toFixed(2)}</span>
                          </div>
                      </div>
                    );
                  })}
               </div>
            </div>
          </div>
        )}
      </div>
      
      <div className="h-10 bg-white border-t border-slate-200 px-6 flex items-center justify-between shrink-0 text-[10px] font-bold text-slate-400">
        <div className="flex items-center space-x-6">
          <div className="flex items-center space-x-1"><div className="w-2 h-2 bg-red-400 rounded-full"></div><span>差异标红</span></div>
          <div className="flex items-center space-x-1"><div className="w-2 h-2 bg-blue-400 rounded-full"></div><span>左键拖拽汇总</span></div>
          <div className="flex items-center space-x-1"><div className="w-2 h-2 bg-emerald-400 rounded-full"></div><span>右键标记颜色</span></div>
        </div>
        <div className="text-[10px] font-black text-slate-300 italic uppercase tracking-widest">HUIZAOJIA AI AUDIT ENGINE V3.0</div>
      </div>
    </div>
  );
};

export default OKContractCompareView;