
import React, { useState, useRef } from 'react';
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
}

const INITIAL_MOCK_DATA: ComparisonRow[] = [
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
  },
  {
    id: 'row-2-sub', index: '', code: '12-1换', name: '墙面一般抹灰 内墙14+6~干混抹灰砂浆 DP M15.0~抹灰遍数2遍', unit: '100m2', quantity: 1.8074, isSubRow: true,
    contract: { labor: 989.06, material: 1274.84, machinery: 20.14, management: 167.22, profit: 81.75, subtotal: 2611.06, total: 4719 },
    audit: { labor: 989.06, material: 1274.84, machinery: 20.14, management: 167.22, profit: 81.75, subtotal: 2611.06, total: 4719 },
  },
  {
    id: 'row-3', index: '3', code: '4-62', name: '蒸压砂加气混凝土砌块(B07 A5.0) 厚200mm以内，DM7.5专用配套砂浆砌筑', unit: 'm3', quantity: 18.6,
    contract: { labor: 117.03, material: 467.02, machinery: 0.92, management: 19.54, profit: 9.55, subtotal: 623.18, total: 11591 },
    audit: { labor: 116.25, material: 467.02, machinery: 0.92, management: 19.42, profit: 9.49, subtotal: 622.16, total: 11572 },
  },
  {
    id: 'row-3-sub', index: '', code: '4-62换', name: '蒸压加气混凝土砌块墙厚 (mm以内) 200砂浆~蒸压砂加气混凝土砌块B07 A5.0', unit: '10m3', quantity: 1.86, isSubRow: true,
    contract: { labor: 1170.25, material: 4670.15, machinery: 9.19, management: 195.43, profit: 95.53, subtotal: 6231.77, total: 11591 },
    audit: { labor: 1162.5, material: 4670.15, machinery: 9.19, management: 194.15, profit: 94.91, subtotal: 6221.52, total: 11572 },
  },
  { id: 'h-0105', index: '', code: '', name: '0105 混凝土及钢筋混凝土工程', unit: '', quantity: '', contract: {} as any, audit: {} as any, isHeader: true },
  {
    id: 'row-6', index: '6', code: '5-1换', name: 'C20商品砼基础垫层浇捣', unit: 'm3', quantity: 89.21,
    contract: { labor: 45.72, material: 525.36, machinery: 0.64, management: 7.68, profit: 3.76, subtotal: 586.75, total: 52344 },
    audit: { labor: 45.42, material: 525.36, machinery: 0.64, management: 7.63, profit: 3.73, subtotal: 586.34, total: 52307 },
  }
];

const OKContractCompareView: React.FC = () => {
  const [data, setData] = useState<ComparisonRow[]>(INITIAL_MOCK_DATA);
  const [isComparing, setIsComparing] = useState(false);
  const [showResults, setShowResults] = useState(false);
  const [showCoinAnim, setShowCoinAnim] = useState(false);
  const [highlightedRow, setHighlightedRow] = useState<string | null>(null);
  const [contractFile, setContractFile] = useState<string | null>(null);
  const [auditFile, setAuditFile] = useState<string | null>(null);
  
  const [isSidebarCollapsed, setIsSidebarCollapsed] = useState(false);
  const [showAnalysisSidebar, setShowAnalysisSidebar] = useState(true);
  const [menuOpenSide, setMenuOpenSide] = useState<'contract' | 'audit' | null>(null);

  const [visibleFields, setVisibleFields] = useState({
    labor: true,
    material: false,
    machinery: false,
    management: false,
    profit: false
  });

  const toggleField = (field: keyof typeof visibleFields) => {
    setVisibleFields(prev => ({ ...prev, [field]: !prev[field] }));
  };

  const activeFieldsCount = Object.values(visibleFields).filter(Boolean).length;
  const tableContainerRef = useRef<HTMLDivElement>(null);

  const handleCellEdit = (rowId: string, side: 'contract' | 'audit', field: keyof CostDetail, value: string) => {
    const numVal = parseFloat(value) || 0;
    setData(prev => prev.map(row => {
      if (row.id === rowId) {
        const targetSide = { ...row[side] };
        (targetSide as any)[field] = numVal;
        targetSide.subtotal = targetSide.labor + targetSide.material + targetSide.machinery + targetSide.management + targetSide.profit;
        const qty = typeof row.quantity === 'string' ? parseFloat(row.quantity) || 0 : row.quantity;
        targetSide.total = Math.round(targetSide.subtotal * qty);
        return { ...row, [side]: targetSide };
      }
      return row;
    }));
  };

  const handleCompare = () => {
    if (!contractFile || !auditFile) return;
    setIsComparing(true);
    setTimeout(() => {
      setIsComparing(false);
      setShowResults(true);
      setShowCoinAnim(true);
      setTimeout(() => setShowCoinAnim(false), 1750);
    }, 1200);
  };

  const scrollToSide = (id: string, side: 'contract' | 'audit' | 'diff') => {
    const targetId = `${id}_${side}`;
    setHighlightedRow(targetId);
    const element = document.getElementById(targetId);
    if (element) {
      element.scrollIntoView({ behavior: 'smooth', block: 'center', inline: 'center' });
    }
    setTimeout(() => setHighlightedRow(null), 3000);
  };

  const renderCell = (
    valCurrent: number, 
    valOther: number, 
    isEditable: boolean = false, 
    rowId?: string, 
    side?: 'contract' | 'audit', 
    field?: keyof CostDetail
  ) => {
    if (valCurrent === undefined) return '';
    const isDiff = Math.abs(valCurrent - valOther) > 0.001;
    
    if (isEditable && rowId && side && field) {
      return (
        <input 
          type="number"
          value={valCurrent || ''}
          onChange={(e) => handleCellEdit(rowId, side, field, e.target.value)}
          className={`w-full bg-transparent border-none outline-none text-right focus:ring-1 focus:ring-blue-400 rounded transition-all [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none whitespace-nowrap px-1 text-xs ${isDiff ? 'text-red-600 font-bold' : 'text-slate-600'}`}
        />
      );
    }

    return (
      <span className={`inline-block w-full px-1 py-1 rounded transition-colors whitespace-nowrap text-right text-xs ${isDiff ? 'bg-red-50 text-red-600 font-bold' : 'text-slate-600'}`}>
        {valCurrent === 0 && valOther === 0 ? '0.00' : valCurrent.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
      </span>
    );
  };

  const renderFilterMenu = (side: 'contract' | 'audit') => (
    <>
      <div className="fixed inset-0 z-40 bg-transparent" onClick={(e) => { e.stopPropagation(); setMenuOpenSide(null); }}></div>
      <div 
        className="absolute top-full left-1/2 -translate-x-1/2 mt-2 z-50 bg-white border border-slate-200 rounded-2xl shadow-[0_15px_40px_rgba(0,0,0,0.15)] p-4 w-48 animate-in fade-in zoom-in-95 duration-200"
        onClick={e => e.stopPropagation()}
      >
        <div className="flex items-center space-x-2 mb-3 px-1">
          <Icon name="Filter" size={12} className="text-blue-500" />
          <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">科目筛选</p>
        </div>
        <div className="space-y-2">
          {[
            { key: 'labor', label: '人工费' },
            { key: 'material', label: '材料费' },
            { key: 'machinery', label: '机械费' },
            { key: 'management', label: '管理费' },
            { key: 'profit', label: '利润' }
          ].map(item => (
            <label key={item.key} className="flex items-center space-x-3 cursor-pointer group px-1 py-0.5 rounded-lg hover:bg-slate-50 transition-colors">
              <div className={`w-4 h-4 rounded border flex items-center justify-center transition-all ${visibleFields[item.key as keyof typeof visibleFields] ? 'bg-blue-600 border-blue-600' : 'border-slate-300 group-hover:border-blue-400'}`}>
                {visibleFields[item.key as keyof typeof visibleFields] && <Icon name="Check" size={10} className="text-white" strokeWidth={4} />}
              </div>
              <input type="checkbox" className="hidden" checked={visibleFields[item.key as keyof typeof visibleFields]} onChange={() => toggleField(item.key as keyof typeof visibleFields)} />
              <span className={`text-xs font-bold transition-colors ${visibleFields[item.key as keyof typeof visibleFields] ? 'text-blue-600' : 'text-slate-500 group-hover:text-slate-800'}`}>{item.label}</span>
            </label>
          ))}
        </div>
      </div>
    </>
  );

  const renderUnifiedTable = () => {
    const feeColSpan = activeFieldsCount + 1; // 子科目 + 小计
    const contractTotalCols = feeColSpan + 1; // 合计列
    const auditTotalCols = feeColSpan + 1;
    const totalCols = 5 + contractTotalCols + auditTotalCols + 2; 

    return (
      <table className="w-auto text-left border-collapse table-auto bg-white rounded-2xl shadow-sm">
        <thead className="sticky top-0 z-20 shadow-sm">
          {/* 第一层表头 */}
          <tr className="bg-slate-100 border-b border-slate-300">
            <th colSpan={5} className="px-3 py-2 text-xs font-black text-slate-500 border-r border-slate-200">项目基础信息</th>
            <th colSpan={contractTotalCols} className="px-3 py-2 text-center text-xs font-black text-blue-800 bg-blue-50 border-r-2 border-r-blue-200 uppercase tracking-widest">合同价 (原始)</th>
            <th colSpan={auditTotalCols} className="px-3 py-2 text-center text-xs font-black text-emerald-800 bg-emerald-50 border-r-2 border-r-emerald-200 uppercase tracking-widest">送审价 (比对)</th>
            <th colSpan={2} className="px-3 py-2 text-center text-xs font-black text-red-800 bg-red-50 uppercase tracking-widest">对比差异统计</th>
          </tr>
          {/* 第二层表头 */}
          <tr className="bg-slate-50 border-b border-slate-300">
            <th rowSpan={2} className="px-3 py-3 text-xs font-black text-slate-700 border-r border-slate-200 text-center whitespace-nowrap">清单序号</th>
            <th rowSpan={2} className="px-3 py-3 text-xs font-black text-slate-700 border-r border-slate-200 whitespace-nowrap">项目编码</th>
            <th rowSpan={2} className="px-3 py-3 text-xs font-black text-slate-700 border-r border-slate-300 whitespace-nowrap min-w-[200px]">项目名称</th>
            <th rowSpan={2} className="px-3 py-3 text-xs font-black text-slate-700 border-r border-slate-200 text-center whitespace-nowrap">单位</th>
            <th rowSpan={2} className="px-3 py-3 text-xs font-black text-slate-700 border-r-2 border-r-slate-300 text-right whitespace-nowrap">数量</th>
            
            {/* 合同价子项头 */}
            <th colSpan={feeColSpan} className="px-3 py-2 text-[10px] font-black text-blue-600 text-center border-b border-slate-200 border-r border-slate-200 relative whitespace-nowrap bg-blue-50/30">
              <div className="flex items-center justify-center space-x-1">
                <span>综合单价 (元)</span>
                <button onClick={() => setMenuOpenSide(menuOpenSide === 'contract' ? null : 'contract')} className={`p-0.5 rounded transition-colors outline-none ${menuOpenSide === 'contract' ? 'bg-blue-600 text-white' : 'hover:bg-blue-100 text-blue-600'}`}>
                  <Icon name="Settings2" size={12} />
                </button>
              </div>
              {menuOpenSide === 'contract' && renderFilterMenu('contract')}
            </th>
            <th rowSpan={2} className="px-3 py-3 text-xs font-black text-slate-700 text-right border-r-2 border-r-blue-200 whitespace-nowrap bg-blue-50/30">合计(元)</th>

            {/* 送审价子项头 */}
            <th colSpan={feeColSpan} className="px-3 py-2 text-[10px] font-black text-emerald-600 text-center border-b border-slate-200 border-r border-slate-200 relative whitespace-nowrap bg-emerald-50/30">
              <div className="flex items-center justify-center space-x-1">
                <span>综合单价 (元)</span>
                <button onClick={() => setMenuOpenSide(menuOpenSide === 'audit' ? null : 'audit')} className={`p-0.5 rounded transition-colors outline-none ${menuOpenSide === 'audit' ? 'bg-emerald-600 text-white' : 'hover:bg-emerald-100 text-emerald-600'}`}>
                  <Icon name="Settings2" size={12} />
                </button>
              </div>
              {menuOpenSide === 'audit' && renderFilterMenu('audit')}
            </th>
            <th rowSpan={2} className="px-3 py-3 text-xs font-black text-slate-700 text-right border-r-2 border-r-emerald-200 whitespace-nowrap bg-emerald-50/30">合计(元)</th>

            {/* 差异统计头 */}
            <th rowSpan={2} className="px-3 py-2 text-xs font-bold text-slate-600 text-right border-r border-slate-200 whitespace-nowrap bg-red-50/50">小计差异</th>
            <th rowSpan={2} className="px-3 py-2 text-xs font-bold text-slate-600 text-right bg-red-50/50">合计差异</th>
          </tr>
          {/* 第三层：明细科目表头 */}
          <tr className="bg-slate-50 border-b border-slate-300 text-right">
            {/* 合同子科目头 */}
            {visibleFields.labor && <th className="w-[80px] px-2 py-2 text-[10px] font-bold text-slate-400 border-r border-slate-100 whitespace-nowrap bg-blue-50/10">人工费</th>}
            {visibleFields.material && <th className="w-[80px] px-2 py-2 text-[10px] font-bold text-slate-400 border-r border-slate-100 whitespace-nowrap bg-blue-50/10">材料费</th>}
            {visibleFields.machinery && <th className="w-[80px] px-2 py-2 text-[10px] font-bold text-slate-400 border-r border-slate-100 whitespace-nowrap bg-blue-50/10">机械费</th>}
            {visibleFields.management && <th className="w-[80px] px-2 py-2 text-[10px] font-bold text-slate-400 border-r border-slate-100 whitespace-nowrap bg-blue-50/10">管理费</th>}
            {visibleFields.profit && <th className="w-[80px] px-2 py-2 text-[10px] font-bold text-slate-400 border-r border-slate-100 whitespace-nowrap bg-blue-50/10">利润</th>}
            <th className="px-3 py-2 text-[10px] font-bold text-slate-500 border-r border-slate-200 whitespace-nowrap bg-blue-100/30">小计</th>

            {/* 送审子科目头 */}
            {visibleFields.labor && <th className="w-[80px] px-2 py-2 text-[10px] font-bold text-slate-400 border-r border-slate-100 whitespace-nowrap bg-emerald-50/10">人工费</th>}
            {visibleFields.material && <th className="w-[80px] px-2 py-2 text-[10px] font-bold text-slate-400 border-r border-slate-100 whitespace-nowrap bg-emerald-50/10">材料费</th>}
            {visibleFields.machinery && <th className="w-[80px] px-2 py-2 text-[10px] font-bold text-slate-400 border-r border-slate-100 whitespace-nowrap bg-emerald-50/10">机械费</th>}
            {visibleFields.management && <th className="w-[80px] px-2 py-2 text-[10px] font-bold text-slate-400 border-r border-slate-100 whitespace-nowrap bg-emerald-50/10">管理费</th>}
            {visibleFields.profit && <th className="w-[80px] px-2 py-2 text-[10px] font-bold text-slate-400 border-r border-slate-100 whitespace-nowrap bg-emerald-50/10">利润</th>}
            <th className="px-3 py-2 text-[10px] font-bold text-slate-500 border-r border-slate-200 whitespace-nowrap bg-emerald-100/30">小计</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-slate-200">
          {data.map((row) => {
            if (row.isHeader) {
              return (
                <tr key={row.id} className="bg-slate-100/80">
                  <td colSpan={totalCols} className="px-4 py-2 text-[11px] font-black text-slate-800 tracking-wide uppercase border-r border-slate-300 whitespace-nowrap">{row.name}</td>
                </tr>
              );
            }

            const diffSubtotal = row.audit.subtotal - row.contract.subtotal;
            const diffTotal = row.audit.total - row.contract.total;

            return (
              <tr key={row.id} className={`hover:bg-blue-50/20 transition-all duration-300 ${row.isSubRow ? 'bg-slate-50/30' : 'bg-white'}`}>
                {/* 基础信息组 */}
                <td className="px-3 py-3 text-xs text-center font-bold text-slate-400 border-r border-slate-100 whitespace-nowrap">{row.index}</td>
                <td className="px-3 py-3 text-xs font-medium text-slate-500 border-r border-slate-100 whitespace-nowrap">{row.code}</td>
                <td className={`px-4 py-3 text-xs font-bold text-slate-800 border-r border-slate-300 leading-relaxed whitespace-nowrap ${row.isSubRow ? 'pl-10 font-medium text-slate-600 italic' : ''}`}>{row.name}</td>
                <td className="px-3 py-3 text-xs text-center text-slate-400 border-r border-slate-100 whitespace-nowrap">{row.unit}</td>
                <td className="px-3 py-3 text-xs text-right font-medium text-slate-700 border-r-2 border-r-slate-300 whitespace-nowrap">{row.quantity}</td>

                {/* 合同价子项数据 */}
                {visibleFields.labor && <td className={`w-[80px] px-1 py-3 text-right border-r border-slate-100 whitespace-nowrap ${highlightedRow === `${row.id}_contract` ? 'bg-blue-100 ring-2 ring-blue-400 z-10' : ''}`}>{renderCell(row.contract.labor, row.audit.labor, true, row.id, 'contract', 'labor')}</td>}
                {visibleFields.material && <td className="w-[80px] px-1 py-3 text-right border-r border-slate-100 whitespace-nowrap">{renderCell(row.contract.material, row.audit.material, true, row.id, 'contract', 'material')}</td>}
                {visibleFields.machinery && <td className="w-[80px] px-1 py-3 text-right border-r border-slate-100 whitespace-nowrap">{renderCell(row.contract.machinery, row.audit.machinery, true, row.id, 'contract', 'machinery')}</td>}
                {visibleFields.management && <td className="w-[80px] px-1 py-3 text-right border-r border-slate-100 whitespace-nowrap">{renderCell(row.contract.management, row.audit.management, true, row.id, 'contract', 'management')}</td>}
                {visibleFields.profit && <td className="w-[80px] px-1 py-3 text-right border-r border-slate-100 whitespace-nowrap">{renderCell(row.contract.profit, row.audit.profit, true, row.id, 'contract', 'profit')}</td>}
                <td className="px-3 py-3 text-xs text-right border-r border-slate-200 bg-slate-50/30 whitespace-nowrap font-medium text-slate-600">{renderCell(row.contract.subtotal, row.audit.subtotal)}</td>
                <td className="px-3 py-3 text-xs text-right font-black text-slate-900 border-r-2 border-r-blue-200 whitespace-nowrap bg-blue-50/10">{renderCell(row.contract.total, row.audit.total)}</td>

                {/* 送审价子项数据 */}
                {visibleFields.labor && <td className={`w-[80px] px-1 py-3 text-right border-r border-slate-100 whitespace-nowrap ${highlightedRow === `${row.id}_audit` ? 'bg-emerald-100 ring-2 ring-emerald-400 z-10' : ''}`}>{renderCell(row.audit.labor, row.contract.labor, true, row.id, 'audit', 'labor')}</td>}
                {visibleFields.material && <td className="w-[80px] px-1 py-3 text-right border-r border-slate-100 whitespace-nowrap">{renderCell(row.audit.material, row.contract.material, true, row.id, 'audit', 'material')}</td>}
                {visibleFields.machinery && <td className="w-[80px] px-1 py-3 text-right border-r border-slate-100 whitespace-nowrap">{renderCell(row.audit.machinery, row.contract.machinery, true, row.id, 'audit', 'machinery')}</td>}
                {visibleFields.management && <td className="w-[80px] px-1 py-3 text-right border-r border-slate-100 whitespace-nowrap">{renderCell(row.audit.management, row.contract.management, true, row.id, 'audit', 'management')}</td>}
                {visibleFields.profit && <td className="w-[80px] px-1 py-3 text-right border-r border-slate-100 whitespace-nowrap">{renderCell(row.audit.profit, row.contract.profit, true, row.id, 'audit', 'profit')}</td>}
                <td className="px-3 py-3 text-xs text-right border-r border-slate-200 bg-slate-50/30 whitespace-nowrap font-medium text-slate-600">{renderCell(row.audit.subtotal, row.contract.subtotal)}</td>
                <td className="px-3 py-3 text-xs text-right font-black text-slate-900 border-r-2 border-r-emerald-200 whitespace-nowrap bg-emerald-50/10">{renderCell(row.audit.total, row.contract.total)}</td>

                {/* 差异统计数据 */}
                <td id={`${row.id}_diff`} className={`px-3 py-3 text-xs text-right border-r border-slate-200 font-black whitespace-nowrap ${highlightedRow === `${row.id}_diff` ? 'bg-red-50 ring-2 ring-red-400 z-10 shadow-sm' : 'bg-red-50/10'}`}>
                   <span className={Math.abs(diffSubtotal) > 0.001 ? 'text-red-600' : 'text-slate-400'}>
                     {diffSubtotal.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                   </span>
                </td>
                <td className="px-3 py-3 text-xs text-right font-black whitespace-nowrap bg-red-50/10">
                   <span className={Math.abs(diffTotal) > 0.001 ? 'text-red-600' : 'text-slate-400'}>
                     {diffTotal.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                   </span>
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>
    );
  };

  return (
    <div className="flex flex-col h-full bg-[#f0f2f5] overflow-hidden relative font-sans text-slate-900">
      {showCoinAnim && (
        <div className="fixed inset-0 z-[999] flex items-center justify-center bg-black/20 backdrop-blur-[2px] pointer-events-none animate-in fade-in duration-200">
          <div className="bg-white rounded-[40px] p-12 shadow-2xl flex flex-col items-center animate-in zoom-in-50 duration-300 border-[6px] border-yellow-400 relative">
            <div className="absolute inset-0 bg-yellow-400/5 rounded-[34px] animate-pulse"></div>
            <div className="relative mb-8"><div className="w-28 h-28 bg-gradient-to-tr from-yellow-600 via-yellow-400 to-yellow-200 rounded-full flex items-center justify-center animate-gold shadow-[0_0_30px_rgba(234,179,8,0.5)]"><Icon name="Coins" size={56} className="text-white drop-shadow-md" /></div></div>
            <div className="text-center relative z-10"><h2 className="text-4xl font-black text-slate-800 mb-2 tracking-tight">对比任务完成!</h2></div>
          </div>
        </div>
      )}

      <div className="bg-white border-b border-slate-200 px-6 py-4 flex items-center justify-between shrink-0 shadow-sm z-30">
        <div className="flex items-center space-x-6 flex-1">
          <div className="flex items-center space-x-3 bg-slate-50 p-2 rounded-2xl border border-slate-100">
             <div className="px-4 py-1.5 text-sm font-bold text-slate-700 bg-white rounded-xl shadow-sm">合同价 (原始文件)</div>
             <button onClick={() => setContractFile('合同价.xlsx')} className={`px-4 py-1.5 rounded-xl text-xs font-black transition-all ${contractFile ? 'bg-emerald-500 text-white shadow-md' : 'bg-blue-600 text-white hover:bg-blue-700 active:scale-95 shadow-lg shadow-blue-500/20'}`}>{contractFile ? '已导入' : '导入'}</button>
          </div>
          <div className="flex items-center space-x-3 bg-slate-50 p-2 rounded-2xl border border-slate-100">
             <div className="px-4 py-1.5 text-sm font-bold text-slate-700 bg-white rounded-xl shadow-sm">送审价 (被审文件)</div>
             <button onClick={() => setAuditFile('送审价.xlsx')} className={`px-4 py-1.5 rounded-xl text-xs font-black transition-all ${auditFile ? 'bg-emerald-500 text-white shadow-md' : 'bg-blue-600 text-white hover:bg-blue-700 active:scale-95 shadow-lg shadow-blue-500/20'}`}>{auditFile ? '已导入' : '导入'}</button>
          </div>
        </div>
        <button onClick={handleCompare} disabled={!contractFile || !auditFile || isComparing} className="ml-8 px-10 py-3 bg-blue-600 text-white font-black text-sm rounded-2xl shadow-xl shadow-blue-500/20 hover:bg-blue-700 transition-all active:scale-95 disabled:grayscale disabled:opacity-50 tracking-widest uppercase">{isComparing ? <Icon name="Loader2" className="animate-spin" /> : '开始对比'}</button>
      </div>

      <div className="flex-1 flex overflow-hidden relative">
        <div className={`bg-white border-r border-slate-200 flex flex-col shrink-0 transition-all duration-300 ${isSidebarCollapsed ? 'w-12' : 'w-56'}`}>
          <div className="px-4 py-4 border-b border-slate-100 flex items-center justify-between overflow-hidden">
            {!isSidebarCollapsed && <span className="text-xs font-black text-slate-400 uppercase tracking-widest whitespace-nowrap">对比记录栏</span>}
            <button onClick={() => setIsSidebarCollapsed(!isSidebarCollapsed)} className="p-1 hover:bg-slate-50 rounded-lg text-slate-300 transition-colors">
              <Icon name={isSidebarCollapsed ? 'PanelLeftOpen' : 'PanelLeftClose'} size={16} />
            </button>
          </div>
          {!isSidebarCollapsed && (
            <div className="flex-1 overflow-y-auto p-3 space-y-4 animate-in fade-in duration-300">
              {[
                { name: '记录1: 2#-g地块地下室', time: '2024-05-20 14:00' },
                { name: '记录2: 1#楼主体', time: '2024-05-20 14:00' },
                { name: '记录3: 景观绿化', time: '2024-05-20 14:00' }
              ].map((rec, i) => (
                <div key={i} className="group p-3 rounded-xl border border-transparent hover:border-blue-100 hover:bg-blue-50/30 cursor-pointer transition-all">
                  <p className="text-xs font-bold text-slate-700 group-hover:text-blue-600 truncate mb-1">{rec.name}</p>
                  <p className="text-[10px] text-slate-400 group-hover:text-blue-400 font-medium">{rec.time}</p>
                </div>
              ))}
            </div>
          )}
        </div>

        <div className="flex-1 flex flex-col overflow-hidden relative">
          {!showResults ? (
            <div className="flex-1 flex flex-col items-center justify-center text-slate-400 space-y-4"><Icon name="Layout" size={40} className="opacity-20" /><p className="font-bold text-sm">请先导入文件并点击“开始对比”</p></div>
          ) : (
            <div ref={tableContainerRef} className="flex-1 overflow-auto custom-scrollbar bg-slate-100 p-4 animate-in fade-in slide-in-from-bottom-4 duration-700">
              <div className="min-w-full inline-block align-middle">
                 {renderUnifiedTable()}
              </div>
            </div>
          )}
        </div>

        {showResults && (
          <div className={`bg-white border-l border-slate-200 flex flex-col shrink-0 transition-all duration-300 ${showAnalysisSidebar ? 'w-80' : 'w-0 overflow-hidden'}`}>
            <div className="p-4 bg-slate-50 border-b border-slate-200 flex items-center justify-between shrink-0">
              <div className="flex items-center space-x-2 overflow-hidden">
                <Icon name="BrainCircuit" size={20} className="text-blue-600 shrink-0" />
                <span className="font-bold text-sm text-slate-800 whitespace-nowrap uppercase tracking-tight">AI 差异分析</span>
              </div>
              <button onClick={() => setShowAnalysisSidebar(false)} className="p-1.5 hover:bg-slate-200 rounded-lg text-slate-400">
                <Icon name="PanelRightClose" size={18} />
              </button>
            </div>
            <div className="flex-1 overflow-y-auto custom-scrollbar bg-white p-4 space-y-6">
               <div className="bg-blue-50/50 rounded-2xl p-4 border border-blue-100 mb-2 shadow-sm">
                  <h4 className="text-xs font-black text-blue-600 mb-3 border-b border-blue-100 pb-2">对比摘要</h4>
                  <div className="space-y-2">
                    <div className="flex justify-between text-xs"><span className="text-slate-500 font-bold">总差异项</span><span className="font-black text-red-600">8 项</span></div>
                    <div className="flex justify-between text-xs"><span className="text-slate-500 font-bold">累计核减</span><span className="font-black text-emerald-600">¥ 158.00</span></div>
                  </div>
               </div>
               <div className="space-y-4">
                  <h4 className="text-[11px] font-black text-slate-400 uppercase tracking-widest mb-4">差异明细定位</h4>
                  {data.filter(r => !r.isHeader && (Math.abs(r.contract.labor - r.audit.labor) > 0.1)).map((row) => {
                    const diffValue = row.contract.labor - row.audit.labor;
                    return (
                      <div key={row.id} className="border border-slate-100 rounded-xl overflow-hidden bg-white shadow-sm transition-all relative flex flex-col group/item">
                        <div className="p-4 border-b border-slate-50">
                           <p className="text-[11px] font-bold text-slate-800 leading-tight truncate">
                              <span className="text-blue-500 mr-2">{row.code}</span>
                              {row.name}
                           </p>
                        </div>
                        <div onClick={() => scrollToSide(row.id, 'contract')} className="flex items-center justify-between px-4 py-3 border-l-4 border-l-blue-500 hover:bg-blue-50 cursor-pointer transition-colors">
                           <span className="text-[11px] font-medium text-slate-500">合同价定位</span>
                           <span className="text-[11px] font-black text-slate-800">¥ {row.contract.labor.toFixed(2)}</span>
                        </div>
                        <div onClick={() => scrollToSide(row.id, 'audit')} className="flex items-center justify-between px-4 py-3 border-l-4 border-l-emerald-500 border-t border-t-slate-50 hover:bg-emerald-50 cursor-pointer transition-colors">
                           <span className="text-[11px] font-medium text-slate-500">送审价定位</span>
                           <span className="text-[11px] font-black text-slate-800">¥ {row.audit.labor.toFixed(2)}</span>
                        </div>
                        <div onClick={() => scrollToSide(row.id, 'diff')} className="flex items-center justify-between px-4 py-3 border-l-4 border-l-red-500 border-t border-t-slate-50 bg-red-50 hover:bg-red-100 cursor-pointer transition-colors">
                           <span className="text-[11px] font-bold text-red-500 uppercase tracking-tighter">差异值定位</span>
                           <span className="text-[11px] font-black text-red-600">¥ {Math.abs(diffValue).toFixed(2)}</span>
                        </div>
                      </div>
                    );
                  })}
               </div>
            </div>
          </div>
        )}
        
        {!showAnalysisSidebar && showResults && (
           <button onClick={() => setShowAnalysisSidebar(true)} className="absolute right-0 top-1/2 -translate-y-1/2 w-8 h-20 bg-white border border-slate-200 border-r-0 rounded-l-xl shadow-lg flex items-center justify-center text-slate-400 hover:text-blue-600 transition-all z-40">
             <Icon name="PanelRightOpen" size={18} />
           </button>
        )}
      </div>
      
      <div className="h-10 bg-white border-t border-slate-200 px-6 flex items-center justify-between shrink-0">
        <div className="flex items-center space-x-6 text-[10px] font-bold text-slate-400">
          <div className="flex items-center space-x-1"><div className="w-2 h-2 bg-red-400 rounded-full"></div><span>存在差异项 (红字对比)</span></div>
          <div className="flex items-center space-x-1"><Icon name="Keyboard" size={12} className="text-blue-400" /><span>支持单元格内数值实时修改与动态重算</span></div>
        </div>
        <div className="text-[10px] font-black text-slate-300 italic uppercase tracking-widest">HUIZAOJIA AI AUDIT ENGINE V3.0</div>
      </div>
    </div>
  );
};

export default OKContractCompareView;
