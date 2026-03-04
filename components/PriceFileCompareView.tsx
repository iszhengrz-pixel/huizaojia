import React, { useState, useMemo } from 'react';
import Icon from './Icon';

interface UploadRecord {
  id: string;
  name: string;
  time: string;
}

interface SheetPair {
  id: string;
  submissionName: string;
  auditName: string;
}

interface DetailedCompareRow {
  id: string;
  // 送审
  subCode: string;
  subName: string;
  subUnit: string;
  subQty: number;
  subUnitPrice: number;
  subTotalPrice: number;
  subLabor?: number;
  subMaterial?: number;
  subMachinery?: number;
  // 审核
  auditCode: string;
  auditName: string;
  auditUnit: string;
  auditQty: number;
  auditUnitPrice: number;
  auditTotalPrice: number;
  auditLabor?: number;
  auditMaterial?: number;
  auditMachinery?: number;
  // 结果
  diffQty: number;
  diffPrice: number;
  diffTotal: number;
  reductionRate: string;
  auditType: string;
  adjustType: string;
  remarks?: string; // 增减说明
}

const MOCK_RECORDS: UploadRecord[] = [
  { id: '1', name: '记录1: 2#-g地块地下室', time: '2024-05-20 14:00' },
  { id: '2', name: '记录2: 1#楼主体', time: '2024-05-20 14:00' },
];

const MOCK_SHEET_PAIRS: SheetPair[] = [
  { id: 's1', submissionName: '表10.2.2-16 分部分项工程清单与计价表【平时电气】', auditName: '表10.2.2-16 分部分项工程...' },
  { id: 's2', submissionName: '表10.2.2-16 分部分项工程清单与计价表【战时电气】', auditName: '表10.2.2-16 分部分项工程...' },
  { id: 's3', submissionName: '表10.2.2-17 措施项目清单与计价表', auditName: '表10.2.2-16 分部分项工程...' },
  { id: 's4', submissionName: '表10.2.2-18 其他项目清单与计价表', auditName: '表10.2.2-16 分部分项工程...' },
  { id: 's5', submissionName: '表10.2.2-19 规费、税金项目计价表', auditName: '表10.2.2-16 分部分项工程...' },
];

const INITIAL_DETAILED_DATA: DetailedCompareRow[] = [
  {
    id: 'row_1',
    subCode: '50102001001', subName: '栽植填朴T 胸径φ30cm', subUnit: '株', subQty: 2, subUnitPrice: 16435.9, subTotalPrice: 32871.80,
    subLabor: 2000, subMaterial: 14000, subMachinery: 435.9,
    auditCode: '50102001001', auditName: '栽植填朴T 胸径φ30cm', auditUnit: '株', auditQty: 1, auditUnitPrice: 16435.9, auditTotalPrice: 16435.90,
    auditLabor: 2000, auditMaterial: 14000, auditMachinery: 435.9,
    diffQty: -1, diffPrice: 0, diffTotal: -16435.90, reductionRate: '-50.00%', auditType: '修改', adjustType: '调量',
    remarks: '根据现场实际栽植数量核减'
  },
  {
    id: 'row_2',
    subCode: '50102001002', subName: '栽植蓝花楹T 胸径φ30cm', subUnit: '株', subQty: 5, subUnitPrice: 21000.9, subTotalPrice: 105004.50,
    subLabor: 3000, subMaterial: 17500, subMachinery: 500.9,
    auditCode: '50102001002', auditName: '栽植蓝花楹T 胸径φ30cm', auditUnit: '株', auditQty: 4, auditUnitPrice: 18000, auditTotalPrice: 72000.00,
    auditLabor: 2500, auditMaterial: 15000, auditMachinery: 500,
    diffQty: -1, diffPrice: -3000.9, diffTotal: -33004.50, reductionRate: '-31.43%', auditType: '修改', adjustType: '调量+调价',
    remarks: '市场询价下调单价'
  },
  {
    id: 'row_3',
    subCode: '', subName: '', subUnit: '', subQty: 0, subUnitPrice: 0, subTotalPrice: 0,
    auditCode: '50102001003', auditName: '新增苗木项示例', auditUnit: '株', auditQty: 10, auditUnitPrice: 500, auditTotalPrice: 5000,
    auditLabor: 100, auditMaterial: 350, auditMachinery: 50,
    diffQty: 10, diffPrice: 500, diffTotal: 5000, reductionRate: '0.00%', auditType: '新增', adjustType: '新增项',
    remarks: '补充设计变更增加项'
  },
  {
    id: 'row_4',
    subCode: '50102001004', subName: '已删除的大乔木', subUnit: '株', subQty: 2, subUnitPrice: 800, subTotalPrice: 1600,
    subLabor: 150, subMaterial: 600, subMachinery: 50,
    auditCode: '', auditName: '', auditUnit: '', auditQty: 0, auditUnitPrice: 0, auditTotalPrice: 0,
    diffQty: -2, diffPrice: -800, diffTotal: -1600, reductionRate: '-100.00%', auditType: '删除', adjustType: '删除项',
    remarks: '取消该区域景观布置'
  },
  {
    id: 'row_5',
    subCode: '50102001005', subName: '未变动项示例', subUnit: '株', subQty: 10, subUnitPrice: 100, subTotalPrice: 1000,
    subLabor: 20, subMaterial: 75, subMachinery: 5,
    auditCode: '50102001005', auditName: '未变动项示例', auditUnit: '株', auditQty: 10, auditUnitPrice: 100, auditTotalPrice: 1000,
    auditLabor: 20, auditMaterial: 75, auditMachinery: 5,
    diffQty: 0, diffPrice: 0, diffTotal: 0, reductionRate: '0.00%', auditType: '不变', adjustType: '-',
    remarks: ''
  }
];

// 定义可选列结构
const COLUMN_OPTIONS = [
  { id: 'code', label: '项目编码' },
  { id: 'name', label: '项目名称' },
  { id: 'unit', label: '单位' },
  { id: 'qty', label: '工程量' },
  { 
    id: 'unitPrice', 
    label: '综合单价', 
    children: [
      { id: 'labor', label: '人工费' },
      { id: 'material', label: '材料费' },
      { id: 'machinery', label: '机械费' },
    ] 
  },
  { id: 'totalPrice', label: '合价' },
];

const PriceFileCompareView: React.FC = () => {
  const [file1, setFile1] = useState<string | null>(null);
  const [file2, setFile2] = useState<string | null>(null);
  const [isComparing, setIsComparing] = useState(false);
  const [showResult, setShowResult] = useState(false);
  
  const [isHistoryCollapsed, setIsHistoryCollapsed] = useState(false);
  const [isSheetListCollapsed, setIsSheetListCollapsed] = useState(false);
  const [isSummaryCollapsed, setIsSummaryCollapsed] = useState(false);
  const [activeRecordId, setActiveRecordId] = useState<string | null>(null);
  
  const [isSheetModalOpen, setIsSheetModalOpen] = useState(false);
  const [isMappingModalOpen, setIsMappingModalOpen] = useState(false);
  const [isCustomCompareOpen, setIsCustomCompareOpen] = useState(false);
  
  // 汇总分类筛选
  const [summaryActiveTab, setSummaryActiveTab] = useState<'全部' | '修改' | '新增' | '删除'>('全部');

  // 增减说明编辑相关
  const [isRemarksModalOpen, setIsRemarksModalOpen] = useState(false);
  const [editingRowId, setEditingRowId] = useState<string | null>(null);
  const [tempRemarks, setTempRemarks] = useState('');

  const [auditTypeFilter, setAuditTypeFilter] = useState('全部');
  const [isAnalysisExpanded, setIsAnalysisExpanded] = useState(false);

  // 记录展开的汇总节点
  const [expandedSummaryNodes, setExpandedSummaryNodes] = useState<Set<string>>(new Set(['b1', 'b1-p1', 'b1-p1-t1']));

  // 自定义列选择状态
  const [selectedSubKeys, setSelectedSubKeys] = useState<Set<string>>(new Set(['code', 'name', 'unit', 'qty', 'unitPrice', 'totalPrice']));
  const [selectedAuditKeys, setSelectedAuditKeys] = useState<Set<string>>(new Set(['code', 'name', 'unit', 'qty', 'unitPrice', 'totalPrice']));
  const [isUnitPriceExpanded, setIsUnitPriceExpanded] = useState(true);

  const [effectiveOverrides, setEffectiveOverrides] = useState<Record<string, boolean>>({});
  
  const [sheetSearch, setSheetSearch] = useState('');
  const [expandedFolders, setExpandedFolders] = useState<Set<string>>(new Set(['f2']));
  const [selectedSheetIds, setSelectedSheetIds] = useState<Set<string>>(new Set(['s1']));

  const [selectedSubmissionIds, setSelectedSubmissionIds] = useState<Set<string>>(new Set(MOCK_SHEET_PAIRS.map(p => p.id)));
  const [selectedAuditIds, setSelectedAuditIds] = useState<Set<string>>(new Set(MOCK_SHEET_PAIRS.map(p => p.id)));
  
  const [records] = useState<UploadRecord[]>(MOCK_RECORDS);
  const [detailedData, setDetailedData] = useState<DetailedCompareRow[]>(INITIAL_DETAILED_DATA);

  // 拖拽相关状态
  const [mappingSubData, setMappingSubData] = useState<DetailedCompareRow[]>(INITIAL_DETAILED_DATA);
  const [mappingAuditData, setMappingAuditData] = useState<DetailedCompareRow[]>(INITIAL_DETAILED_DATA.filter(r => r.auditName));
  const [dragInfo, setDragInfo] = useState<{ index: number, side: 'sub' | 'audit' } | null>(null);

  const filteredDetailedData = useMemo(() => {
    if (auditTypeFilter === '全部') return detailedData;
    return detailedData.filter(row => row.auditType === auditTypeFilter);
  }, [auditTypeFilter, detailedData]);

  const handleStartCompare = () => {
    if (!file1 || !file2) return;
    setIsSheetModalOpen(true);
  };

  const handleConfirmCompare = () => {
    setIsSheetModalOpen(false);
    setIsComparing(true);
    setTimeout(() => {
      setIsComparing(false);
      setShowResult(true);
      if (activeRecordId === null) setActiveRecordId(records[0]?.id || null);
    }, 1500);
  };

  const toggleSummaryNode = (id: string) => {
    const next = new Set(expandedSummaryNodes);
    if (next.has(id)) next.delete(id);
    else next.add(id);
    setExpandedSummaryNodes(next);
  };

  const handleLocateRow = (rowId: string) => {
    const element = document.getElementById(rowId);
    if (element) {
      element.scrollIntoView({ behavior: 'smooth', block: 'center' });
      // 增加醒目高亮动画
      element.style.transition = 'background-color 0.3s ease';
      element.style.backgroundColor = '#dbeafe'; // 蓝色
      setTimeout(() => {
        element.style.backgroundColor = '';
      }, 1500);
    }
  };

  const toggleFolder = (id: string) => {
    const next = new Set(expandedFolders);
    if (next.has(id)) next.delete(id);
    else next.add(id);
    setExpandedFolders(next);
  };

  const toggleSheetSelection = (id: string) => {
    const next = new Set(selectedSheetIds);
    if (next.has(id)) next.delete(id);
    else next.add(id);
    setSelectedSheetIds(next);
  };

  const toggleFolderSelection = (folderId: string, e: React.MouseEvent) => {
    e.stopPropagation();
    if (folderId !== 'f2') return;

    const allSheetIds = MOCK_SHEET_PAIRS.map(s => s.id);
    const selectedInFolder = allSheetIds.filter(id => selectedSheetIds.has(id));
    const isAllSelected = selectedInFolder.length === allSheetIds.length;

    const next = new Set(selectedSheetIds);
    if (isAllSelected) {
      allSheetIds.forEach(id => next.delete(id));
    } else {
      allSheetIds.forEach(id => next.add(id));
    }
    setSelectedSheetIds(next);
  };

  const getFolderSelectionState = (folderId: string) => {
    if (folderId !== 'f2') return 'none';
    const allSheetIds = MOCK_SHEET_PAIRS.map(s => s.id);
    const selectedInFolder = allSheetIds.filter(id => selectedSheetIds.has(id));
    
    if (selectedInFolder.length === 0) return 'none';
    if (selectedInFolder.length === allSheetIds.length) return 'all';
    return 'indeterminate';
  };

  const toggleEffective = (rowId: string, defaultValue: boolean) => {
    setEffectiveOverrides(prev => {
      const current = prev[rowId] ?? defaultValue;
      return { ...prev, [rowId]: !current };
    });
  };

  const toggleSubKey = (id: string, side: 'sub' | 'audit') => {
    const keys = side === 'sub' ? selectedSubKeys : selectedAuditKeys;
    const setKeys = side === 'sub' ? setSelectedSubKeys : setSelectedAuditKeys;
    const next = new Set(keys);
    
    if (id.includes('.')) {
      if (next.has(id)) {
        next.delete(id);
      } else {
        next.add(id);
        next.add(id.split('.')[0]);
      }
    } else {
      if (next.has(id)) {
        next.delete(id);
        const parent = COLUMN_OPTIONS.find(o => o.id === id);
        parent?.children?.forEach(c => next.delete(`${id}.${c.id}`));
      } else {
        next.add(id);
        const parent = COLUMN_OPTIONS.find(o => o.id === id);
        parent?.children?.forEach(c => next.add(`${id}.${c.id}`));
      }
    }
    setKeys(next);
  };

  const handleOpenRemarksModal = (row: DetailedCompareRow) => {
    setEditingRowId(row.id);
    setTempRemarks(row.remarks || '');
    setIsRemarksModalOpen(true);
  };

  const handleSaveRemarks = () => {
    if (!editingRowId) return;
    setDetailedData(prev => prev.map(row => 
      row.id === editingRowId ? { ...row, remarks: tempRemarks } : row
    ));
    setIsRemarksModalOpen(false);
    setEditingRowId(null);
    setTempRemarks('');
  };

  const renderFileSlot = (label: string, value: string | null, setter: (val: string | null) => void, placeholder: string) => {
    return (
      <div className="flex-1 bg-slate-50/50 border border-slate-100 rounded-2xl p-2 flex items-center space-x-3">
        <span className="text-[11px] font-black text-slate-400 uppercase tracking-widest px-2 shrink-0">{label}</span>
        <div className="flex-1 h-9 bg-white border border-slate-200 rounded-xl px-4 flex items-center shadow-sm overflow-hidden relative group">
          <span className={`text-xs font-bold truncate pr-6 ${value ? 'text-slate-700' : 'text-slate-300 italic'}`}>
            {value || placeholder}
          </span>
          {value && (
            <button onClick={() => setter(null)} className="absolute right-2 text-slate-300 hover:text-rose-500 transition-colors" title="清除文件">
              <Icon name="Trash2" size={14} />
            </button>
          )}
        </div>
        <button onClick={() => setter(`${label}_示例.xlsx`)} className="bg-blue-600 text-white px-5 py-1.5 rounded-xl text-xs font-black shadow-lg shadow-blue-500/20 hover:bg-blue-700 transition-all active:scale-95 shrink-0">
          导入
        </button>
      </div>
    );
  };

  const getRowBgColor = (type: string) => {
    switch (type) {
      case '新增': return 'bg-[#ecfdf5]';
      case '删除': return 'bg-[#fff1f2]';
      case '修改': return 'bg-[#fffbeb]';
      case '不变': return 'bg-white';
      default: return 'bg-white';
    }
  };

  const handleMappingRowDragStart = (index: number, side: 'sub' | 'audit') => {
    setDragInfo({ index, side });
  };

  const handleMappingRowDrop = (targetIndex: number, side: 'sub' | 'audit') => {
    if (!dragInfo || dragInfo.side !== side) return;
    
    const isSub = side === 'sub';
    const list = isSub ? [...mappingSubData] : [...mappingAuditData];
    const item = list.splice(dragInfo.index, 1)[0];
    list.splice(targetIndex, 0, item);
    
    if (isSub) setMappingSubData(list);
    else setMappingAuditData(list);
    
    setDragInfo(null);
  };

  const renderDetailedTable = () => {
    const showSubCode = selectedSubKeys.has('code');
    const showSubName = selectedSubKeys.has('name');
    const showSubUnit = selectedSubKeys.has('unit');
    const showSubQty = selectedSubKeys.has('qty');
    const showSubUnitPrice = selectedSubKeys.has('unitPrice');
    const showSubLabor = selectedSubKeys.has('unitPrice.labor');
    const showSubMaterial = selectedSubKeys.has('unitPrice.material');
    const showSubMachinery = selectedSubKeys.has('unitPrice.machinery');
    const showSubTotal = selectedSubKeys.has('totalPrice');

    const showAuditCode = selectedAuditKeys.has('code');
    const showAuditName = selectedAuditKeys.has('name');
    const showAuditUnit = selectedAuditKeys.has('unit');
    const showAuditQty = selectedAuditKeys.has('qty');
    const showAuditUnitPrice = selectedAuditKeys.has('unitPrice');
    const showAuditLabor = selectedAuditKeys.has('unitPrice.labor');
    const showAuditMaterial = selectedAuditKeys.has('unitPrice.material');
    const showAuditMachinery = selectedAuditKeys.has('unitPrice.machinery');
    const showAuditTotal = selectedAuditKeys.has('totalPrice');

    const showDiffQty = showSubQty && showAuditQty;
    const showDiffPrice = showSubUnitPrice && showAuditUnitPrice;
    const showDiffTotal = showSubTotal && showAuditTotal;

    const subColsCount = (showSubCode?1:0)+(showSubName?1:0)+(showSubUnit?1:0)+(showSubQty?1:0)+(showSubUnitPrice?1:0)+(showSubLabor?1:0)+(showSubMaterial?1:0)+(showSubMachinery?1:0)+(showSubTotal?1:0);
    const auditColsCount = (showAuditCode?1:0)+(showAuditName?1:0)+(showAuditUnit?1:0)+(showAuditQty?1:0)+(showAuditUnitPrice?1:0)+(showAuditLabor?1:0)+(showAuditMaterial?1:0)+(showAuditMachinery?1:0)+(showAuditTotal?1:0);
    const resultColsCount = (showDiffQty?1:0)+(showDiffPrice?1:0)+(showDiffTotal?1:0)+1+2; 

    return (
      <div className="flex-1 bg-white flex flex-col min-w-0 overflow-hidden relative">
        <div className="px-4 py-2 border-b border-slate-100 bg-slate-50/30 flex items-center justify-end space-x-3 shrink-0">
          <button 
            onClick={() => {
              setMappingSubData(detailedData);
              setMappingAuditData(detailedData.filter(r => r.auditName));
              setIsMappingModalOpen(true);
            }}
            className="flex items-center space-x-1.5 px-4 py-1.5 bg-white border border-slate-200 text-slate-600 rounded-xl text-xs font-bold hover:bg-slate-50 hover:border-blue-300 transition-all shadow-sm outline-none"
          >
            <Icon name="Link2" size={14} />
            <span>数据对应</span>
          </button>
          <button 
            onClick={() => setIsCustomCompareOpen(true)}
            className="flex items-center space-x-1.5 px-4 py-1.5 bg-white border border-[#40a9ff] text-[#40a9ff] rounded-xl text-xs font-black hover:bg-blue-50 transition-all shadow-sm outline-none"
            style={{ borderWidth: '1px' }}
          >
            <Icon name="Settings2" size={14} />
            <span>自定义对比</span>
          </button>
          <button 
            onClick={() => alert('正在导出对比表格...')}
            className="flex items-center space-x-1.5 px-5 py-1.5 bg-blue-600 text-white rounded-xl text-xs font-black hover:bg-blue-700 transition-all shadow-md shadow-blue-500/20 active:scale-95 outline-none"
          >
            <Icon name="Download" size={14} />
            <span>导出对比表格</span>
          </button>
        </div>

        <div className="flex-1 overflow-x-auto overflow-y-auto custom-scrollbar">
          <table className={`border-collapse text-[11px] border-l border-t border-slate-200 transition-all duration-300 ${isAnalysisExpanded ? 'min-w-[2300px]' : 'min-w-[1200px]'}`} style={{ tableLayout: 'fixed' }}>
            <thead>
              <tr className="bg-slate-50 border-b border-slate-200 font-bold text-slate-600 text-center">
                <th rowSpan={2} className="w-[40px] border-r border-slate-200 bg-white sticky left-0 z-20"></th>
                {subColsCount > 0 && <th colSpan={subColsCount} className="px-3 py-2 border-r border-slate-200">送审工程</th>}
                {auditColsCount > 0 && <th colSpan={auditColsCount} className="px-3 py-2 border-r border-slate-200">审核工程</th>}
                <th colSpan={resultColsCount} className="px-3 py-2 border-r border-slate-200 bg-blue-100">审核结果</th>
                <th 
                  colSpan={isAnalysisExpanded ? 5 : 1} 
                  className="px-3 py-2 bg-[#E1F5FE] text-blue-700 border-r border-slate-200 cursor-pointer hover:bg-[#D1E9F6] transition-colors relative"
                  onClick={() => setIsAnalysisExpanded(!isAnalysisExpanded)}
                >
                  <div className="flex items-center justify-center space-x-1">
                    <span>增减分析</span>
                    <Icon name={isAnalysisExpanded ? "ChevronLeft" : "ChevronRight"} size={14} className="text-blue-400" />
                  </div>
                </th>
              </tr>
              <tr className="bg-slate-50 border-b border-slate-200 font-bold text-slate-500 text-center">
                {showSubCode && <th className="w-[100px] px-3 py-2 border-r border-slate-200 truncate">项目编码</th>}
                {showSubName && <th className="w-[180px] px-3 py-2 border-r border-slate-200 truncate">项目名称</th>}
                {showSubUnit && <th className="w-[48px] px-3 py-2 border-r border-slate-200 truncate">单位</th>}
                {showSubQty && <th className="w-[64px] px-3 py-2 border-r border-slate-200 truncate">工程量</th>}
                {showSubLabor && <th className="w-[80px] px-3 py-2 border-r border-slate-200 truncate text-blue-400">人工费</th>}
                {showSubMaterial && <th className="w-[80px] px-3 py-2 border-r border-slate-200 truncate text-blue-400">材料费</th>}
                {showSubMachinery && <th className="w-[80px] px-3 py-2 border-r border-slate-200 truncate text-blue-400">机械费</th>}
                {showSubUnitPrice && <th className="w-[100px] px-3 py-2 border-r border-slate-200 truncate">综合单价</th>}
                {showSubTotal && <th className="w-[100px] px-3 py-2 border-r border-slate-200 truncate">合价</th>}

                {showAuditCode && <th className="w-[100px] px-3 py-2 border-r border-slate-200 truncate">项目编码</th>}
                {showAuditName && <th className="w-[180px] px-3 py-2 border-r border-slate-200 truncate">项目名称</th>}
                {showAuditUnit && <th className="w-[48px] px-3 py-2 border-r border-slate-200 truncate">单位</th>}
                {showAuditQty && <th className="w-[64px] px-3 py-2 border-r border-slate-200 truncate">工程量</th>}
                {showAuditLabor && <th className="w-[80px] px-3 py-2 border-r border-slate-200 truncate text-emerald-400">人工费</th>}
                {showAuditMaterial && <th className="w-[80px] px-3 py-2 border-r border-slate-200 truncate text-emerald-400">材料费</th>}
                {showAuditMachinery && <th className="w-[80px] px-3 py-2 border-r border-slate-200 truncate text-emerald-400">机械费</th>}
                {showAuditUnitPrice && <th className="w-[100px] px-3 py-2 border-r border-slate-200 truncate">综合单价</th>}
                {showAuditTotal && <th className="w-[100px] px-3 py-2 border-r border-slate-200 truncate">合价</th>}

                {showDiffQty && <th className="w-[80px] px-3 py-2 border-r border-slate-200 bg-blue-50 truncate">量差</th>}
                {showDiffPrice && <th className="w-[90px] px-3 py-2 border-r border-slate-200 bg-blue-50 truncate">价差</th>}
                {showDiffTotal && <th className="w-[100px] px-3 py-2 border-r border-slate-200 bg-blue-50 truncate">合价差</th>}
                {showDiffTotal && <th className="w-[80px] px-3 py-2 border-r border-slate-200 bg-blue-50 truncate">审减率</th>}
                <th className="w-[96px] px-3 py-2 border-r border-slate-200 bg-blue-50 truncate">审核类型</th>
                <th className="w-[100px] px-3 py-2 border-r border-slate-200 bg-blue-50 truncate">调整类型</th>

                {isAnalysisExpanded ? (
                  <>
                    <th className="w-[90px] px-3 py-2 border-r border-blue-200 bg-[#E1F5FE] text-blue-700 truncate">核增额</th>
                    <th className="w-[100px] px-3 py-2 border-r border-blue-200 bg-[#E1F5FE] text-blue-700 truncate">有效核增</th>
                    <th className="w-[90px] px-3 py-2 border-r border-blue-200 bg-[#E1F5FE] text-blue-700 truncate">核减额</th>
                    <th className="w-[80px] px-3 py-2 border-r border-blue-200 bg-[#E1F5FE] text-blue-700 truncate">核减率</th>
                    <th className="w-[150px] px-3 py-2 bg-[#E1F5FE] text-blue-700 truncate">增减说明</th>
                  </>
                ) : (
                  <th className="w-[20px] px-1 py-2 bg-slate-50 border-slate-200"></th>
                )}
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {filteredDetailedData.map((row, index) => {
                const isAdded = row.auditType === '新增';
                const isDeleted = row.auditType === '删除';
                const strikeClass = isDeleted ? 'line-through decoration-slate-400 text-slate-400' : 'text-slate-600';
                const nameStrikeClass = isDeleted ? 'line-through decoration-slate-400 text-slate-400 opacity-70' : 'font-bold text-slate-800';
                const totalStrikeClass = isDeleted ? 'line-through decoration-slate-400 text-slate-400' : 'text-slate-800 font-bold';
                const increaseAmt = row.diffTotal > 0 ? row.diffTotal : 0;
                const decreaseAmt = row.diffTotal < 0 ? Math.abs(row.diffTotal) : 0;
                const defaultEffective = row.diffQty > 0 || row.diffPrice > 0 || row.diffTotal > 0;
                const isEffective = effectiveOverrides[row.id] ?? defaultEffective;

                return (
                  <tr key={row.id} id={row.id} className={`${getRowBgColor(row.auditType)} hover:bg-blue-50 group transition-colors`}>
                    <td className={`text-center font-bold border-r border-slate-200 sticky left-0 z-10 ${getRowBgColor(row.auditType)} group-hover:bg-blue-100 text-slate-400 transition-colors`}>
                      {index + 1}
                    </td>
                    {showSubCode && <td className={`px-3 py-2 border-r border-slate-100 font-mono truncate ${strikeClass}`}>{isAdded ? '' : row.subCode}</td>}
                    {showSubName && <td className={`px-3 py-2 border-r border-slate-100 truncate ${nameStrikeClass}`}>{isAdded ? '' : row.subName}</td>}
                    {showSubUnit && <td className={`px-3 py-2 border-r border-slate-100 text-center truncate ${strikeClass}`}>{isAdded ? '' : row.subUnit}</td>}
                    {showSubQty && <td className={`px-3 py-2 border-r border-slate-100 text-center truncate ${strikeClass}`}>{isAdded ? '' : row.subQty}</td>}
                    {showSubLabor && <td className={`px-3 py-2 border-r border-slate-100 text-right truncate text-blue-400/80 ${strikeClass}`}>{isAdded ? '' : row.subLabor?.toLocaleString()}</td>}
                    {showSubMaterial && <td className={`px-3 py-2 border-r border-slate-100 text-right truncate text-blue-400/80 ${strikeClass}`}>{isAdded ? '' : row.subMaterial?.toLocaleString()}</td>}
                    {showSubMachinery && <td className={`px-3 py-2 border-r border-slate-100 text-right truncate text-blue-400/80 ${strikeClass}`}>{isAdded ? '' : row.subMachinery?.toLocaleString()}</td>}
                    {showSubUnitPrice && <td className={`px-3 py-2 border-r border-slate-100 text-right truncate ${strikeClass}`}>{isAdded ? '' : row.subUnitPrice.toLocaleString()}</td>}
                    {showSubTotal && <td className={`px-3 py-2 border-r border-slate-200 text-right truncate ${totalStrikeClass}`}>{isAdded ? '' : row.subTotalPrice.toLocaleString(undefined, { minimumFractionDigits: 2 })}</td>}

                    {showAuditCode && <td className="px-3 py-2 border-r border-slate-100 font-mono text-slate-600 truncate">{row.auditCode}</td>}
                    {showAuditName && <td className="px-3 py-2 border-r border-slate-100 font-bold text-slate-800 truncate">{row.auditName}</td>}
                    {showAuditUnit && <td className="px-3 py-2 border-r border-slate-100 text-center text-slate-500 truncate">{row.auditUnit}</td>}
                    {showAuditQty && <td className="px-3 py-2 border-r border-slate-100 text-center text-slate-700 truncate">{row.auditQty}</td>}
                    {showAuditLabor && <td className="px-3 py-2 border-r border-slate-100 text-right truncate text-emerald-400/80">{row.auditLabor?.toLocaleString()}</td>}
                    {showAuditMaterial && <td className="px-3 py-2 border-r border-slate-100 text-right truncate text-emerald-400/80">{row.auditMaterial?.toLocaleString()}</td>}
                    {showAuditMachinery && <td className="px-3 py-2 border-r border-slate-100 text-right truncate text-emerald-400/80">{row.auditMachinery?.toLocaleString()}</td>}
                    {showAuditUnitPrice && <td className="px-3 py-2 border-r border-slate-100 text-right text-slate-600 truncate">{row.auditUnitPrice.toLocaleString()}</td>}
                    {showAuditTotal && <td className="px-3 py-2 border-r border-slate-200 text-right font-bold text-slate-800 truncate">{row.auditTotalPrice.toLocaleString(undefined, { minimumFractionDigits: 2 })}</td>}

                    {showDiffQty && <td className={`px-3 py-2 border-r border-slate-100 text-center font-black truncate ${isDeleted ? 'line-through decoration-slate-400 opacity-60 text-slate-400' : (row.diffQty < 0 ? 'text-rose-500' : row.diffQty > 0 ? 'text-emerald-600' : 'text-slate-600')}`}>{row.diffQty}</td>}
                    {showDiffPrice && <td className={`px-3 py-2 border-r border-slate-100 text-right font-black truncate ${isDeleted ? 'line-through decoration-slate-400 opacity-60 text-slate-400' : (row.diffPrice < 0 ? 'text-rose-500' : row.diffPrice > 0 ? 'text-emerald-600' : 'text-slate-600')}`}>{row.diffPrice.toLocaleString()}</td>}
                    {showDiffTotal && <td className={`px-3 py-2 border-r border-slate-100 text-right font-black truncate ${isDeleted ? 'line-through decoration-slate-400 opacity-60 text-slate-400' : (row.diffTotal < 0 ? 'text-rose-500' : row.diffTotal > 0 ? 'text-emerald-600' : 'text-slate-600')}`}>{row.diffTotal.toLocaleString(undefined, { minimumFractionDigits: 2 })}</td>}
                    {showDiffTotal && <td className={`px-3 py-2 border-r border-slate-100 text-center font-bold bg-rose-50/30 truncate ${isDeleted ? 'line-through decoration-slate-400 opacity-60 text-rose-400' : 'text-rose-500'}`}>{row.reductionRate}</td>}
                    
                    <td className={`px-3 py-2 border-r border-slate-100 text-center ${isDeleted ? 'opacity-60' : ''}`}>
                      <span className={`px-2 py-0.5 rounded text-[10px] font-black uppercase ${
                        row.auditType === '新增' ? 'bg-emerald-100 text-emerald-700' :
                        row.auditType === '删除' ? 'bg-rose-100 text-rose-700 line-through decoration-rose-400' :
                        row.auditType === '修改' ? 'bg-amber-100 text-amber-700' :
                        'bg-slate-100 text-slate-500'
                      }`}>{row.auditType}</span>
                    </td>
                    <td className={`px-3 py-2 border-r border-slate-100 text-center truncate ${isDeleted ? 'line-through decoration-slate-400 opacity-60 text-slate-400' : 'text-slate-500'}`}>{row.adjustType}</td>
                    
                    {isAnalysisExpanded ? (
                      <>
                        <td className="px-3 py-2 border-r border-slate-100 text-right font-bold text-emerald-600 truncate">{increaseAmt > 0 ? increaseAmt.toLocaleString(undefined, { minimumFractionDigits: 2 }) : ''}</td>
                        <td onClick={() => toggleEffective(row.id, defaultEffective)} className="px-3 py-2 border-r border-slate-100 text-center font-bold cursor-pointer select-none"><div className="flex items-center justify-center"><div className={`w-4 h-4 border rounded flex items-center justify-center transition-all ${isEffective ? 'bg-emerald-500 border-emerald-500' : 'border-slate-300 bg-white'}`}>{isEffective && <Icon name="Check" size={12} className="text-white" strokeWidth={5} />}</div></div></td>
                        <td className="px-3 py-2 border-r border-slate-100 text-right font-bold text-rose-600 truncate">{decreaseAmt > 0 ? decreaseAmt.toLocaleString(undefined, { minimumFractionDigits: 2 }) : ''}</td>
                        <td className="px-3 py-2 border-r border-slate-100 text-center font-bold text-rose-600 truncate">{decreaseAmt > 0 ? row.reductionRate : ''}</td>
                        <td 
                          onClick={() => handleOpenRemarksModal(row)}
                          className="px-3 py-2 text-slate-500 cursor-pointer hover:bg-blue-100/50 transition-colors"
                        >
                          <div className="flex items-center space-x-1">
                            <span className="truncate flex-1 min-w-0">{row.remarks || <span className="text-slate-300 italic">点击输入...</span>}</span>
                            <Icon name="Edit3" size={12} className="text-slate-300 group-hover:text-blue-500" />
                          </div>
                        </td>
                      </>
                    ) : (
                      <td className="px-1 py-2 text-center text-slate-300">...</td>
                    )}
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>
    );
  };

  return (
    <div className="flex flex-col h-full bg-white overflow-hidden font-sans text-slate-900">
      <div className="p-5 border-b border-slate-100 flex items-center space-x-6 shrink-0 bg-white shadow-sm z-[100]">
        <div className="flex-1 flex items-center space-x-4">
          {renderFileSlot('送审文件', file1, setFile1, '请导入送审计价文件')}
          {renderFileSlot('审核文件', file2, setFile2, '请导入审核计价文件')}
        </div>
        <button 
          onClick={handleStartCompare}
          disabled={!file1 || !file2 || isComparing}
          className="px-10 py-3.5 bg-blue-600 text-white font-black text-sm rounded-[20px] shadow-xl shadow-blue-500/20 hover:bg-blue-700 transition-all active:scale-95 disabled:grayscale disabled:opacity-50 tracking-widest uppercase shrink-0"
        >
          {isComparing ? (
            <div className="flex items-center space-x-2">
              <Icon name="Loader2" size={16} className="animate-spin" />
              <span>对比中</span>
            </div>
          ) : '开始对比'}
        </button>
      </div>

      <div className="flex-1 flex overflow-hidden">
        {/* 左侧侧边栏：历史任务 */}
        <div className={`${isHistoryCollapsed ? 'w-16' : 'w-64'} bg-white border-r border-slate-200 flex flex-col shrink-0 transition-all duration-300 z-50`}>
          <div className="p-5 border-b border-slate-50 flex items-center justify-between bg-slate-50/50 shrink-0">
            {!isHistoryCollapsed && <h2 className="text-xs font-black text-slate-400 uppercase tracking-widest">历史任务</h2>}
            <button onClick={() => setIsHistoryCollapsed(!isHistoryCollapsed)} className="p-1.5 text-slate-400 hover:text-blue-600 rounded-lg transition-colors">
              <Icon name={isHistoryCollapsed ? "PanelLeftOpen" : "PanelLeftClose"} size={16} />
            </button>
          </div>
          <div className="flex-1 overflow-y-auto p-3 space-y-2 custom-scrollbar">
            {records.map(record => (
              <div 
                key={record.id} 
                onClick={() => { setActiveRecordId(record.id); if (!showResult) setShowResult(true); }}
                className={`p-3 rounded-xl border cursor-pointer transition-all ${activeRecordId === record.id ? 'bg-blue-50 border-blue-200 ring-1 ring-blue-100' : 'bg-white border-slate-100 hover:border-blue-200'}`}
              >
                {!isHistoryCollapsed ? (
                  <>
                    <p className={`text-sm font-bold truncate mb-1 ${activeRecordId === record.id ? 'text-blue-700' : 'text-slate-700'}`}>{record.name}</p>
                    <div className="flex items-center text-[10px] text-slate-400 font-medium whitespace-nowrap"><Icon name="Calendar" size={10} className="mr-1" />{record.time}</div>
                  </>
                ) : <div className="flex justify-center text-blue-600"><Icon name="Folder" size={20} /></div>}
              </div>
            ))}
          </div>
        </div>

        {showResult && (
          <div className={`${isSheetListCollapsed ? 'w-0' : 'w-72'} bg-[#fdfdfd] border-r border-slate-200 flex flex-col shrink-0 transition-all duration-300 relative z-40`}>
            <button onClick={() => setIsSheetListCollapsed(!isSheetListCollapsed)} className="absolute top-1/2 -right-3 -translate-y-1/2 w-6 h-12 bg-white border border-slate-200 rounded-full shadow-md text-slate-400 hover:text-blue-600 flex items-center justify-center transition-all z-30 outline-none"><Icon name={isSheetListCollapsed ? "ChevronRight" : "ChevronLeft"} size={14} /></button>
            <div className={`flex flex-col h-full overflow-hidden transition-opacity duration-300 ${isSheetListCollapsed ? 'opacity-0' : 'opacity-100'}`}>
              <div className="p-4 border-b border-slate-50 bg-slate-50/20 h-14 flex items-center shrink-0"><h3 className="text-xs font-black text-slate-500 uppercase tracking-widest whitespace-nowrap">页签列表</h3></div>
              <div className="p-4"><div className="relative group"><Icon name="Search" size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-300 group-focus-within:text-blue-500" /><input type="text" placeholder="搜索Sheet名称" value={sheetSearch} onChange={(e) => setSheetSearch(e.target.value)} className="w-full h-9 bg-white border border-slate-200 rounded-lg pl-9 pr-3 text-xs text-slate-600 focus:outline-none focus:border-blue-400 transition-all placeholder-slate-300 shadow-sm" /></div></div>
              <div className="flex-1 overflow-y-auto custom-scrollbar px-1 pb-4">
                <div className="mb-1">
                  <div onClick={() => toggleFolder('f2')} className="flex items-center px-3 py-2.5 space-x-2 hover:bg-slate-50 cursor-pointer group rounded-lg mx-2 transition-colors"><Icon name={expandedFolders.has('f2') ? "ChevronDown" : "ChevronRight"} size={14} className="text-slate-300 group-hover:text-blue-500 shrink-0" /><div onClick={(e) => toggleFolderSelection('f2', e)} className={`w-4 h-4 border rounded flex items-center justify-center transition-all ${getFolderSelectionState('f2') === 'all' ? 'bg-blue-600 border-blue-600' : getFolderSelectionState('f2') === 'indeterminate' ? 'bg-blue-600 border-blue-600' : 'border-slate-200 bg-white'}`}>{getFolderSelectionState('f2') === 'all' && <Icon name="Check" size={10} className="text-white" strokeWidth={5} />}{getFolderSelectionState('f2') === 'indeterminate' && <Icon name="Minus" size={10} className="text-white" strokeWidth={5} />}</div><Icon name="Folder" size={16} className="text-blue-400 shrink-0" fill="currentColor" /><span className="text-[12px] font-bold text-slate-700 truncate flex-1">项目 Sheet 列表</span></div>
                  {expandedFolders.has('f2') && (
                    <div className="mt-0.5 space-y-0.5">
                      {MOCK_SHEET_PAIRS.map(sheet => (
                        <div key={sheet.id} onClick={() => toggleSheetSelection(sheet.id)} className={`flex items-center pl-11 pr-4 py-2.5 space-x-3 cursor-pointer transition-all ${selectedSheetIds.has(sheet.id) ? 'bg-blue-50/80 border-r-2 border-blue-500' : 'hover:bg-slate-50'}`}><div className={`w-4 h-4 border-2 rounded flex items-center justify-center transition-all ${selectedSheetIds.has(sheet.id) ? 'bg-blue-600 border-blue-600' : 'border-slate-200 bg-white'}`}>{selectedSheetIds.has(sheet.id) && <Icon name="Check" size={10} className="text-white" strokeWidth={5} />}</div><Icon name="FileText" size={14} className={`shrink-0 ${selectedSheetIds.has(sheet.id) ? 'text-blue-500' : 'text-slate-300'}`} /><span className={`text-[12px] truncate flex-1 ${selectedSheetIds.has(sheet.id) ? 'text-blue-600 font-black' : 'text-slate-600 font-medium'}`}>{sheet.submissionName}</span></div>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>
        )}

        <div className="flex-1 flex flex-col bg-white overflow-hidden relative">
          {!showResult ? (
            <div className="flex-1 flex flex-col items-center justify-center space-y-4 animate-in fade-in zoom-in-95 duration-500 opacity-60"><Icon name="Layout" size={100} strokeWidth={1} className="text-slate-200" /><p className="text-slate-300 font-black text-base">请先导入并点击“开始对比”以查看差异报表</p></div>
          ) : renderDetailedTable()}
        </div>

        {/* 右侧侧边栏：差异汇总 */}
        {showResult && (
          <div className={`${isSummaryCollapsed ? 'w-0' : 'w-80'} bg-white border-l border-slate-200 flex flex-col shrink-0 transition-all duration-300 z-50 relative shadow-[-4px_0_15px_rgba(0,0,0,0.02)]`}>
            {/* 折叠切换按钮 */}
            <button onClick={() => setIsSummaryCollapsed(!isSummaryCollapsed)} className="absolute top-1/2 -left-3 -translate-y-1/2 w-6 h-12 bg-white border border-slate-200 rounded-full shadow-md text-slate-400 hover:text-blue-600 flex items-center justify-center transition-all z-[60] outline-none">
              <Icon name={isSummaryCollapsed ? "ChevronLeft" : "ChevronRight"} size={14} />
            </button>
            
            <div className={`flex flex-col h-full overflow-hidden transition-all duration-300 ${isSummaryCollapsed ? 'opacity-0 pointer-events-none' : 'opacity-100'}`}>
              <div className="px-6 py-4 border-b border-slate-100 bg-slate-50/20 h-14 flex items-center shrink-0">
                <h3 className="text-xs font-black text-slate-800 uppercase tracking-widest whitespace-nowrap">差异汇总栏</h3>
              </div>
              
              {/* 汇总分类 Tab */}
              <div className="px-3 py-3 border-b border-slate-50 bg-white">
                <div className="flex bg-slate-100/60 p-0.5 rounded-lg">
                  {['全部', '修改', '新增', '删除'].map(tab => (
                    <button 
                      key={tab} 
                      onClick={() => setSummaryActiveTab(tab as any)} 
                      className={`flex-1 px-2 py-1.5 text-[11px] font-black rounded-md transition-all outline-none ${summaryActiveTab === tab ? 'bg-white text-blue-600 shadow-sm' : 'text-slate-500 hover:text-slate-700'}`}
                    >
                      {tab}
                    </button>
                  ))}
                </div>
              </div>

              <div className="flex-1 overflow-y-auto custom-scrollbar bg-slate-50/20">
                <div className="p-3 space-y-4">
                  {/* 一级：1#楼 */}
                  <div className="bg-white border border-slate-200 rounded-2xl shadow-sm overflow-hidden animate-in slide-in-from-right-4 duration-300">
                    <div 
                      onClick={() => toggleSummaryNode('b1')} 
                      className="px-4 py-3.5 flex items-center justify-between cursor-pointer hover:bg-slate-50 transition-colors border-b border-slate-100"
                    >
                      <div className="flex items-center space-x-3">
                        <div className={`transition-transform duration-300 ${expandedSummaryNodes.has('b1') ? 'rotate-0' : '-rotate-90'}`}>
                          <Icon name="ChevronDown" size={14} className="text-slate-400" />
                        </div>
                        <span className="text-[13px] font-black text-slate-800">1# 楼</span>
                      </div>
                      <div className="flex items-center space-x-2">
                        <span className="text-[9px] font-black text-slate-400 uppercase tracking-tighter">差异概览</span>
                        <span className="bg-rose-50 text-rose-500 px-2 py-0.5 rounded-full text-[10px] font-black border border-rose-100">55条差异</span>
                      </div>
                    </div>

                    {expandedSummaryNodes.has('b1') && (
                      <div className="bg-slate-50/30">
                        {/* 二级：1#楼土建工程 */}
                        <div className="pl-4">
                          <div 
                            onClick={() => toggleSummaryNode('b1-p1')}
                            className="px-4 py-3 flex items-center justify-between cursor-pointer hover:bg-blue-50/50 transition-colors border-b border-slate-100 group"
                          >
                            <div className="flex items-center space-x-2">
                              <div className={`transition-transform duration-300 ${expandedSummaryNodes.has('b1-p1') ? 'rotate-0' : '-rotate-90'}`}>
                                <Icon name="ChevronDown" size={12} className="text-blue-400" />
                              </div>
                              <span className="text-[12px] font-bold text-slate-600 group-hover:text-blue-600">1# 楼土建工程</span>
                            </div>
                          </div>

                          {expandedSummaryNodes.has('b1-p1') && (
                            <div className="divide-y divide-slate-100 pl-4 bg-white/50">
                              {/* 三级：调量 */}
                              {(summaryActiveTab === '全部' || summaryActiveTab === '修改') && (
                                <div>
                                  <div 
                                    onClick={() => toggleSummaryNode('b1-p1-t1')}
                                    className="px-4 py-2.5 flex items-center justify-between cursor-pointer hover:bg-slate-50 group transition-colors"
                                  >
                                    <div className="flex items-center space-x-2">
                                      <Icon name={expandedSummaryNodes.has('b1-p1-t1') ? "ChevronDown" : "ChevronRight"} size={10} className="text-slate-300" />
                                      <span className="bg-amber-100 text-amber-700 px-1.5 py-0.5 rounded text-[10px] font-black group-hover:shadow-sm">修改</span>
                                      <span className="text-[11px] font-bold text-slate-500 group-hover:text-blue-600">调量</span>
                                    </div>
                                    <span className="text-[10px] font-black text-slate-400 group-hover:text-blue-500">15条</span>
                                  </div>
                                  {expandedSummaryNodes.has('b1-p1-t1') && (
                                    <div className="px-4 pb-3 space-y-2 animate-in fade-in duration-200">
                                      {detailedData.filter(r => r.adjustType === '调量').map(row => (
                                        <div 
                                          key={row.id} 
                                          onClick={() => handleLocateRow(row.id)}
                                          className="p-3 bg-white border border-slate-100 rounded-xl hover:border-blue-300 hover:shadow-md cursor-pointer transition-all group/item"
                                        >
                                          <div className="text-[9px] font-mono text-slate-400 mb-1 group-hover/item:text-blue-400">
                                            {row.subCode || row.auditCode || '-'}
                                          </div>
                                          <div className="text-[11px] font-bold text-slate-700 leading-snug group-hover/item:text-blue-600 truncate">
                                            {row.subName || row.auditName || '未知项'}
                                          </div>
                                        </div>
                                      ))}
                                    </div>
                                  )}
                                </div>
                              )}

                              {/* 三级：调价 */}
                              {(summaryActiveTab === '全部' || summaryActiveTab === '修改') && (
                                <div>
                                  <div 
                                    onClick={() => toggleSummaryNode('b1-p1-t2')}
                                    className="px-4 py-2.5 flex items-center justify-between cursor-pointer hover:bg-slate-50 group transition-colors"
                                  >
                                    <div className="flex items-center space-x-2">
                                      <Icon name={expandedSummaryNodes.has('b1-p1-t2') ? "ChevronDown" : "ChevronRight"} size={10} className="text-slate-300" />
                                      <span className="bg-amber-100 text-amber-700 px-1.5 py-0.5 rounded text-[10px] font-black">修改</span>
                                      <span className="text-[11px] font-bold text-slate-500 group-hover:text-blue-600">调价</span>
                                    </div>
                                    <span className="text-[10px] font-black text-slate-400 group-hover:text-blue-500">5条</span>
                                  </div>
                                  {expandedSummaryNodes.has('b1-p1-t2') && (
                                    <div className="px-4 pb-3 space-y-2 animate-in fade-in duration-200">
                                      <div className="p-3 bg-white border border-slate-100 rounded-xl hover:border-blue-300 hover:shadow-md cursor-pointer transition-all group/item">
                                        <div className="text-[9px] font-mono text-slate-400 mb-1">50102001002</div>
                                        <div className="text-[11px] font-bold text-slate-700 leading-snug">载植蓝花楹T 胸径φ30cm</div>
                                      </div>
                                    </div>
                                  )}
                                </div>
                              )}

                              {/* 三级：调量+调价 */}
                              {(summaryActiveTab === '全部' || summaryActiveTab === '修改') && (
                                <div>
                                  <div 
                                    onClick={() => toggleSummaryNode('b1-p1-t3')}
                                    className="px-4 py-2.5 flex items-center justify-between cursor-pointer hover:bg-slate-50 group transition-colors"
                                  >
                                    <div className="flex items-center space-x-2">
                                      <Icon name={expandedSummaryNodes.has('b1-p1-t3') ? "ChevronDown" : "ChevronRight"} size={10} className="text-slate-300" />
                                      <span className="bg-amber-100 text-amber-700 px-1.5 py-0.5 rounded text-[10px] font-black">修改</span>
                                      <span className="text-[11px] font-bold text-slate-500 group-hover:text-blue-600">调量+调价</span>
                                    </div>
                                    <span className="text-[10px] font-black text-slate-400 group-hover:text-blue-500">30条</span>
                                  </div>
                                  {expandedSummaryNodes.has('b1-p1-t3') && (
                                    <div className="px-4 pb-3 space-y-2 animate-in fade-in duration-200">
                                      <div className="p-3 bg-white border border-slate-100 rounded-xl hover:border-blue-300 hover:shadow-md cursor-pointer transition-all group/item">
                                        <div className="text-[9px] font-mono text-slate-400 mb-1">50102001XXX</div>
                                        <div className="text-[11px] font-bold text-slate-700 leading-snug">混合调整项示例项目</div>
                                      </div>
                                    </div>
                                  )}
                                </div>
                              )}

                              {/* 三级：新增 */}
                              {(summaryActiveTab === '全部' || summaryActiveTab === '新增') && (
                                <div>
                                  <div 
                                    onClick={() => toggleSummaryNode('b1-p1-t4')}
                                    className="px-4 py-2.5 flex items-center justify-between cursor-pointer hover:bg-slate-50 group transition-colors"
                                  >
                                    <div className="flex items-center space-x-2">
                                      <Icon name={expandedSummaryNodes.has('b1-p1-t4') ? "ChevronDown" : "ChevronRight"} size={10} className="text-slate-300" />
                                      <span className="bg-emerald-100 text-emerald-700 px-1.5 py-0.5 rounded text-[10px] font-black uppercase">新增</span>
                                      <span className="text-[11px] font-bold text-slate-500 group-hover:text-blue-600">新增项</span>
                                    </div>
                                    <span className="text-[10px] font-black text-slate-400 group-hover:text-blue-500">1条</span>
                                  </div>
                                  {expandedSummaryNodes.has('b1-p1-t4') && (
                                    <div className="px-4 pb-3 space-y-2 animate-in fade-in duration-200">
                                      {detailedData.filter(r => r.auditType === '新增').map(row => (
                                        <div 
                                          key={row.id} 
                                          onClick={() => handleLocateRow(row.id)}
                                          className="p-3 bg-white border border-slate-100 rounded-xl hover:border-blue-300 hover:shadow-md cursor-pointer transition-all group/item"
                                        >
                                          <div className="text-[9px] font-mono text-slate-400 mb-1 group-hover/item:text-blue-400">
                                            {row.auditCode || '-'}
                                          </div>
                                          <div className="text-[11px] font-bold text-slate-700 leading-snug group-hover/item:text-blue-600 truncate">
                                            {row.auditName}
                                          </div>
                                        </div>
                                      ))}
                                    </div>
                                  )}
                                </div>
                              )}

                              {/* 三级：删除 */}
                              {(summaryActiveTab === '全部' || summaryActiveTab === '删除') && (
                                <div>
                                  <div 
                                    onClick={() => toggleSummaryNode('b1-p1-t5')}
                                    className="px-4 py-2.5 flex items-center justify-between cursor-pointer hover:bg-slate-50 group transition-colors"
                                  >
                                    <div className="flex items-center space-x-2">
                                      <Icon name={expandedSummaryNodes.has('b1-p1-t5') ? "ChevronDown" : "ChevronRight"} size={10} className="text-slate-300" />
                                      <span className="bg-rose-100 text-rose-700 px-1.5 py-0.5 rounded text-[10px] font-black uppercase">删除</span>
                                      <span className="text-[11px] font-bold text-slate-500 group-hover:text-blue-600">删除项</span>
                                    </div>
                                    <span className="text-[10px] font-black text-slate-400 group-hover:text-blue-500">1条</span>
                                  </div>
                                  {expandedSummaryNodes.has('b1-p1-t5') && (
                                    <div className="px-4 pb-3 space-y-2 animate-in fade-in duration-200">
                                      {detailedData.filter(r => r.auditType === '删除').map(row => (
                                        <div 
                                          key={row.id} 
                                          onClick={() => handleLocateRow(row.id)}
                                          className="p-3 bg-white border border-slate-100 rounded-xl hover:border-blue-300 hover:shadow-md cursor-pointer transition-all group/item"
                                        >
                                          <div className="text-[9px] font-mono text-slate-400 mb-1 group-hover/item:text-blue-400">
                                            {row.subCode || '-'}
                                          </div>
                                          <div className="text-[11px] font-bold text-slate-700 leading-snug group-hover/item:text-blue-600 truncate">
                                            {row.subName}
                                          </div>
                                        </div>
                                      ))}
                                    </div>
                                  )}
                                </div>
                              )}
                            </div>
                          )}
                        </div>
                      </div>
                    )}
                  </div>

                  {/* 一级：2#楼 演示 */}
                  <div className="bg-white border border-slate-200 rounded-2xl shadow-sm overflow-hidden opacity-80 group/b2 animate-in slide-in-from-right-4 duration-500 delay-75">
                    <div 
                      onClick={() => toggleSummaryNode('b2')} 
                      className="px-4 py-3.5 flex items-center justify-between cursor-pointer hover:bg-slate-50 transition-colors"
                    >
                      <div className="flex items-center space-x-3">
                        <Icon name="ChevronRight" size={14} className="text-slate-400" />
                        <span className="text-[13px] font-black text-slate-800">2# 楼</span>
                      </div>
                      <div className="flex items-center space-x-2">
                        <span className="bg-slate-100 text-slate-500 px-2 py-0.5 rounded-full text-[10px] font-black border border-slate-200">100条差异</span>
                      </div>
                    </div>
                    {expandedSummaryNodes.has('b2') && (
                      <div className="bg-slate-50/50 pl-4 divide-y divide-slate-100">
                        <div className="px-4 py-3 flex items-center justify-between cursor-pointer hover:bg-blue-50/30 transition-colors">
                          <span className="text-[12px] font-bold text-slate-600">2# 楼土建工程</span>
                          <span className="text-[10px] font-black text-slate-400">50条调量</span>
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* 自定义对比弹窗 */}
      {isCustomCompareOpen && (
        <div className="fixed inset-0 z-[160] flex items-center justify-center bg-black/50 backdrop-blur-sm p-4 animate-in fade-in duration-200">
           <div className="bg-white rounded-[24px] shadow-2xl w-full max-w-[1000px] h-[70vh] flex flex-col animate-in zoom-in-95 duration-300 border border-slate-200 overflow-hidden">
             <div className="px-6 py-4 border-b border-slate-100 flex items-center justify-between shrink-0 bg-white">
                <div className="flex items-center space-x-3">
                  <h3 className="text-lg font-black text-slate-800">自定义对比列设置</h3>
                  <span className="text-sm font-medium text-slate-400">请选择需要在表格中展示的列（每侧至少选一项）</span>
                </div>
                <button onClick={() => setIsCustomCompareOpen(false)} className="text-slate-300 hover:text-slate-600 transition-colors p-1"><Icon name="X" size={24} /></button>
             </div>

             <div className="flex-1 flex overflow-hidden">
                {/* 送审列选择 */}
                <div className="flex-1 border-r border-slate-100 flex flex-col">
                   <div className="bg-slate-50/50 p-3 flex items-center space-x-2 shrink-0">
                     <div className="w-2 h-2 bg-blue-500 rounded-full"></div>
                     <span className="text-[11px] font-black text-slate-400 uppercase tracking-widest">送审工程展示列</span>
                   </div>
                   <div className="flex-1 overflow-y-auto p-4 space-y-1 custom-scrollbar">
                      {COLUMN_OPTIONS.map(opt => (
                        <div key={opt.id}>
                          <div 
                            onClick={() => toggleSubKey(opt.id, 'sub')}
                            className={`flex items-center space-x-3 p-3 rounded-xl cursor-pointer transition-all ${selectedSubKeys.has(opt.id) ? 'bg-blue-50/50' : 'hover:bg-slate-50'}`}
                          >
                             <div className={`w-5 h-5 rounded border-2 flex items-center justify-center transition-all ${selectedSubKeys.has(opt.id) ? 'bg-blue-600 border-blue-600' : 'border-slate-200'}`}>
                                {selectedSubKeys.has(opt.id) && <Icon name="Check" size={12} className="text-white" strokeWidth={5} />}
                             </div>
                             <span className={`text-sm font-bold ${selectedSubKeys.has(opt.id) ? 'text-blue-700' : 'text-slate-600'}`}>{opt.label}</span>
                             {opt.children && (
                               <button 
                                 onClick={(e) => { e.stopPropagation(); setIsUnitPriceExpanded(!isUnitPriceExpanded); }}
                                 className="ml-auto p-1 text-slate-300 hover:text-blue-500"
                               >
                                 <Icon name={isUnitPriceExpanded ? 'ChevronDown' : 'ChevronRight'} size={14} />
                               </button>
                             )}
                          </div>
                          {opt.children && isUnitPriceExpanded && (
                            <div className="ml-8 space-y-1 mt-1 pb-2">
                               {opt.children.map(child => (
                                 <div 
                                   key={`${opt.id}.${child.id}`}
                                   onClick={() => toggleSubKey(`${opt.id}.${child.id}`, 'sub')}
                                   className={`flex items-center space-x-3 p-2.5 rounded-lg cursor-pointer transition-all ${selectedSubKeys.has(`${opt.id}.${child.id}`) ? 'bg-blue-50/30' : 'hover:bg-slate-50'}`}
                                 >
                                    <div className={`w-4 h-4 rounded border flex items-center justify-center transition-all ${selectedSubKeys.has(`${opt.id}.${child.id}`) ? 'bg-blue-500 border-blue-500' : 'border-slate-200'}`}>
                                       {selectedSubKeys.has(`${opt.id}.${child.id}`) && <Icon name="Check" size={10} className="text-white" strokeWidth={5} />}
                                    </div>
                                    <span className={`text-xs font-bold ${selectedSubKeys.has(`${opt.id}.${child.id}`) ? 'text-blue-600' : 'text-slate-500'}`}>{child.label}</span>
                                 </div>
                               ))}
                            </div>
                          )}
                        </div>
                      ))}
                   </div>
                </div>

                {/* 审核列选择 */}
                <div className="flex-1 flex flex-col">
                   <div className="bg-slate-50/50 p-3 flex items-center space-x-2 shrink-0">
                     <div className="w-2 h-2 bg-emerald-500 rounded-full"></div>
                     <span className="text-[11px] font-black text-slate-400 uppercase tracking-widest">审核工程展示列</span>
                   </div>
                   <div className="flex-1 overflow-y-auto p-4 space-y-1 custom-scrollbar">
                      {COLUMN_OPTIONS.map(opt => (
                        <div key={opt.id}>
                          <div 
                            onClick={() => toggleSubKey(opt.id, 'audit')}
                            className={`flex items-center space-x-3 p-3 rounded-xl cursor-pointer transition-all ${selectedAuditKeys.has(opt.id) ? 'bg-emerald-50/50' : 'hover:bg-slate-50'}`}
                          >
                             <div className={`w-5 h-5 rounded border-2 flex items-center justify-center transition-all ${selectedAuditKeys.has(opt.id) ? 'bg-emerald-600 border-emerald-600' : 'border-slate-200'}`}>
                                {selectedAuditKeys.has(opt.id) && <Icon name="Check" size={12} className="text-white" strokeWidth={5} />}
                             </div>
                             <span className={`text-sm font-bold ${selectedAuditKeys.has(opt.id) ? 'text-emerald-700' : 'text-slate-600'}`}>{opt.label}</span>
                             {opt.children && (
                               <button 
                                 onClick={(e) => { e.stopPropagation(); setIsUnitPriceExpanded(!isUnitPriceExpanded); }}
                                 className="ml-auto p-1 text-slate-300 hover:text-blue-500"
                               >
                                 <Icon name={isUnitPriceExpanded ? 'ChevronDown' : 'ChevronRight'} size={14} />
                               </button>
                             )}
                          </div>
                          {opt.children && isUnitPriceExpanded && (
                            <div className="ml-8 space-y-1 mt-1 pb-2">
                               {opt.children.map(child => (
                                 <div 
                                   key={`${opt.id}.${child.id}`}
                                   onClick={() => toggleSubKey(`${opt.id}.${child.id}`, 'audit')}
                                   className={`flex items-center space-x-3 p-2.5 rounded-lg cursor-pointer transition-all ${selectedAuditKeys.has(`${opt.id}.${child.id}`) ? 'bg-emerald-50/30' : 'hover:bg-slate-50'}`}
                                 >
                                    <div className={`w-4 h-4 rounded border flex items-center justify-center transition-all ${selectedAuditKeys.has(`${opt.id}.${child.id}`) ? 'bg-emerald-500 border-emerald-500' : 'border-slate-200'}`}>
                                       {selectedAuditKeys.has(`${opt.id}.${child.id}`) && <Icon name="Check" size={10} className="text-white" strokeWidth={5} />}
                                    </div>
                                    <span className={`text-xs font-bold ${selectedAuditKeys.has(`${opt.id}.${child.id}`) ? 'text-emerald-600' : 'text-slate-500'}`}>{child.label}</span>
                                 </div>
                               ))}
                            </div>
                          )}
                        </div>
                      ))}
                   </div>
                </div>
             </div>

             <div className="px-8 py-4 border-t border-slate-100 flex items-center justify-between shrink-0 bg-white">
                <div className="text-[11px] font-bold text-slate-400">
                  送审选中: {selectedSubKeys.size} 项 / 审核选中: {selectedAuditKeys.size} 项
                </div>
                <div className="flex items-center space-x-3">
                  <button onClick={() => setIsCustomCompareOpen(false)} className="px-8 py-2 bg-white border border-slate-200 rounded-lg text-sm font-black text-slate-500 hover:bg-slate-50 transition-all outline-none">取消</button>
                  <button 
                    disabled={selectedSubKeys.size === 0 || selectedAuditKeys.size === 0}
                    onClick={() => setIsCustomCompareOpen(false)} 
                    className="px-10 py-2 bg-blue-600 text-white rounded-lg text-sm font-black shadow-lg shadow-blue-500/20 hover:bg-blue-700 transition-all outline-none disabled:opacity-50"
                  >
                    确认应用
                  </button>
                </div>
             </div>
           </div>
        </div>
      )}

      {/* 增减说明编辑弹窗 */}
      {isRemarksModalOpen && (
        <div className="fixed inset-0 z-[200] flex items-center justify-center bg-black/50 backdrop-blur-sm p-4 animate-in fade-in duration-200">
          <div className="bg-white rounded-[32px] shadow-2xl w-full max-w-md p-8 flex flex-col animate-in zoom-in-95 duration-200">
             <div className="flex items-center justify-between mb-6">
                <div className="flex items-center space-x-3">
                   <div className="w-10 h-10 bg-blue-50 text-blue-600 rounded-xl flex items-center justify-center">
                      <Icon name="Edit3" size={24} />
                   </div>
                   <h3 className="text-xl font-black text-slate-800">编辑增减说明</h3>
                </div>
                <button onClick={() => setIsRemarksModalOpen(false)} className="text-slate-400 hover:text-slate-600 transition-colors">
                  <Icon name="X" size={24} />
                </button>
             </div>
             
             <textarea 
               autoFocus
               value={tempRemarks}
               onChange={(e) => setTempRemarks(e.target.value)}
               placeholder="请输入增减分析说明或备注..."
               className="w-full h-40 bg-slate-50 border border-slate-100 rounded-2xl p-4 text-sm font-medium outline-none focus:bg-white focus:border-blue-400 transition-all resize-none shadow-inner mb-6"
             />
             
             <div className="flex space-x-3">
                <button onClick={() => setIsRemarksModalOpen(false)} className="flex-1 py-3 bg-slate-100 text-slate-600 rounded-2xl font-bold text-sm hover:bg-slate-200 transition-all outline-none">取消</button>
                <button 
                  onClick={handleSaveRemarks}
                  className="flex-1 py-3 bg-blue-600 text-white rounded-2xl font-bold text-sm hover:bg-blue-700 transition-all shadow-lg shadow-blue-500/20 outline-none"
                >
                  确认保存
                </button>
             </div>
          </div>
        </div>
      )}

      {/* 数据对应弹窗 */}
      {isMappingModalOpen && (
        <div className="fixed inset-0 z-[150] flex items-center justify-center bg-black/50 backdrop-blur-sm p-4 animate-in fade-in duration-200">
          <div className="bg-white rounded-[24px] shadow-2xl w-full max-w-[1200px] h-[75vh] flex flex-col animate-in zoom-in-95 duration-300 border border-slate-200 overflow-hidden">
            <div className="px-6 py-4 border-b border-slate-100 flex items-center justify-between shrink-0 bg-white rounded-t-[24px]">
              <div className="flex items-center space-x-3">
                <h3 className="text-lg font-black text-slate-800">数据对应</h3>
                <span className="text-sm font-medium text-slate-400">拖拽数据行完成数据对应</span>
              </div>
              <button onClick={() => setIsMappingModalOpen(false)} className="text-slate-300 hover:text-slate-600 transition-colors p-1"><Icon name="X" size={24} /></button>
            </div>
            
            <div className="flex-1 flex overflow-hidden">
               <div className="flex-1 border-r border-slate-100 flex flex-col">
                  <div className="bg-slate-50/50 p-3 flex items-center space-x-2 shrink-0">
                    <Icon name="ChevronRight" size={14} className="text-slate-400" />
                    <span className="text-[11px] font-black text-slate-400 uppercase tracking-widest">送审清单库</span>
                  </div>
                  <div className="flex-1 overflow-auto custom-scrollbar">
                    <table className="w-full border-collapse">
                      <thead className="sticky top-0 z-10 bg-blue-50 border-b border-slate-200">
                        <tr className="text-[11px] font-black text-slate-600">
                          <th className="px-3 py-3 border-r border-slate-200 text-left">项目编码_送审</th>
                          <th className="px-3 py-3 border-r border-slate-200 text-left">项目名称_送审</th>
                          <th className="px-3 py-3 text-right">综合单价_送审</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-50">
                        {mappingSubData.map((row, index) => (
                          <tr 
                            key={row.id} 
                            draggable
                            onDragStart={() => handleMappingRowDragStart(index, 'sub')}
                            onDragOver={(e) => e.preventDefault()}
                            onDrop={() => handleMappingRowDrop(index, 'sub')}
                            className="hover:bg-blue-50/20 text-[11px] cursor-move transition-colors"
                          >
                            <td className="px-3 py-3 font-mono text-slate-500 border-r border-slate-50 flex items-center space-x-2">
                               <Icon name="GripVertical" size={10} className="text-slate-300" />
                               <span>{row.subCode || '-'}</span>
                            </td>
                            <td className="px-3 py-3 font-bold text-slate-700 border-r border-slate-50 truncate max-w-[200px]">{row.subName || '缺失'}</td>
                            <td className="px-3 py-3 text-right font-black text-slate-800">{row.subUnitPrice.toLocaleString()}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
               </div>

               <div className="flex-1 flex flex-col">
                  <div className="bg-slate-50/50 p-3 flex items-center space-x-2 shrink-0">
                    <Icon name="ChevronRight" size={14} className="text-slate-400" />
                    <span className="text-[11px] font-black text-slate-400 uppercase tracking-widest">审核清单库</span>
                  </div>
                  <div className="flex-1 overflow-auto custom-scrollbar bg-emerald-50/10">
                    <table className="w-full border-collapse">
                      <thead className="sticky top-0 z-10 bg-emerald-50 border-b border-slate-200">
                        <tr className="text-[11px] font-black text-slate-600">
                          <th className="px-3 py-3 border-r border-slate-200 text-left">项目编码_审核</th>
                          <th className="px-3 py-3 border-r border-slate-200 text-left">项目名称_审核</th>
                          <th className="px-3 py-3 text-right">综合单价_审核</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-50">
                        {mappingAuditData.map((row, index) => (
                          <tr 
                            key={`audit-${row.id}`} 
                            draggable
                            onDragStart={() => handleMappingRowDragStart(index, 'audit')}
                            onDragOver={(e) => e.preventDefault()}
                            onDrop={() => handleMappingRowDrop(index, 'audit')}
                            className="hover:bg-emerald-50/30 text-[11px] cursor-move group transition-colors"
                          >
                            <td className="px-3 py-3 font-mono text-slate-500 border-r border-slate-50 flex items-center space-x-2">
                               <Icon name="GripVertical" size={10} className="text-slate-300 group-hover:text-emerald-500 transition-colors" />
                               <span>{row.auditCode}</span>
                            </td>
                            <td className="px-3 py-3 font-bold text-slate-700 border-r border-slate-50 truncate max-w-[200px]">{row.auditName}</td>
                            <td className="px-3 py-3 text-right font-black text-slate-800">{row.auditUnitPrice.toLocaleString()}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
               </div>
            </div>

            <div className="px-8 py-4 border-t border-slate-100 flex items-center justify-end shrink-0 bg-white rounded-b-[24px]">
               <div className="flex items-center space-x-3">
                 <button onClick={() => setIsMappingModalOpen(false)} className="px-8 py-2 bg-white border border-slate-200 rounded-lg text-sm font-black text-slate-500 hover:bg-slate-50 transition-all outline-none">取消</button>
                 <button onClick={() => setIsMappingModalOpen(false)} className="px-10 py-2 bg-blue-600 text-white rounded-lg text-sm font-black shadow-lg shadow-blue-500/20 hover:bg-blue-700 transition-all outline-none">确定</button>
               </div>
            </div>
          </div>
        </div>
      )}

      {isSheetModalOpen && (
        <div className="fixed inset-0 z-[200] flex items-center justify-center bg-black/45 backdrop-blur-sm p-4 animate-in fade-in duration-200">
          <div className="bg-white rounded-[40px] shadow-2xl w-full max-w-4xl overflow-hidden flex flex-col animate-in zoom-in-95 duration-200 border border-white/20">
            <div className="px-8 py-6 border-b border-slate-100 flex items-center justify-between bg-white shrink-0">
              <h3 className="text-xl font-bold text-slate-800">比对配置</h3>
              <button onClick={() => setIsSheetModalOpen(false)} className="text-slate-300 hover:text-slate-600 transition-colors p-1"><Icon name="X" size={28} /></button>
            </div>
            <div className="flex-1 overflow-y-auto custom-scrollbar">
              <table className="w-full border-collapse">
                <thead className="sticky top-0 z-10 bg-slate-50 border-b border-slate-200">
                  <tr className="text-[11px] font-black text-slate-400 uppercase tracking-widest">
                    <th className="px-6 py-4 text-left border-r border-slate-100">送审文件</th>
                    <th className="px-6 py-4 text-left">审核文件</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-50">
                  {MOCK_SHEET_PAIRS.map((pair) => (
                    <tr key={pair.id} className="group hover:bg-slate-50/50 transition-all">
                      <td className={`px-6 py-4 text-sm font-bold border-r border-slate-100 cursor-pointer ${selectedSubmissionIds.has(pair.id) ? 'text-blue-700 bg-blue-50/20' : 'text-slate-700'}`} onClick={() => { const next = new Set(selectedSubmissionIds); if (next.has(pair.id)) next.delete(pair.id); else next.add(pair.id); setSelectedSubmissionIds(next); }}>
                        <div className="flex items-center space-x-3"><div className={`w-5 h-5 rounded border-2 flex items-center justify-center transition-all ${selectedSubmissionIds.has(pair.id) ? 'bg-blue-600 border-blue-600' : 'border-slate-200 bg-white group-hover:border-blue-400'}`}>{selectedSubmissionIds.has(pair.id) && <Icon name="Check" size={14} className="text-white" strokeWidth={4} />}</div><span>{pair.submissionName}</span></div>
                      </td>
                      <td className={`px-6 py-4 text-sm font-bold cursor-pointer ${selectedAuditIds.has(pair.id) ? 'text-blue-700 bg-blue-50/20' : 'text-slate-700'}`} onClick={() => { const next = new Set(selectedAuditIds); if (next.has(pair.id)) next.delete(pair.id); else next.add(pair.id); setSelectedAuditIds(next); }}>
                        <div className="flex items-center space-x-3"><div className={`w-5 h-5 rounded border-2 flex items-center justify-center transition-all ${selectedAuditIds.has(pair.id) ? 'bg-blue-600 border-blue-600' : 'border-slate-200 bg-white group-hover:border-blue-400'}`}>{selectedAuditIds.has(pair.id) && <Icon name="Check" size={14} className="text-white" strokeWidth={4} />}</div><span>{pair.auditName}</span></div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            <div className="px-8 py-6 border-t border-slate-100 bg-slate-50/50 flex items-center justify-end space-x-4 shrink-0">
               <button onClick={() => setIsSheetModalOpen(false)} className="px-8 py-3 rounded-2xl text-sm font-black text-slate-500 hover:text-slate-800 transition-colors">取消</button>
               <button onClick={handleConfirmCompare} disabled={selectedSubmissionIds.size === 0 && selectedAuditIds.size === 0} className="px-12 py-3 bg-blue-600 text-white rounded-2xl text-sm font-black shadow-xl shadow-blue-500/20 hover:bg-blue-700 hover:scale-105 active:scale-95 transition-all">开始比对</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default PriceFileCompareView;