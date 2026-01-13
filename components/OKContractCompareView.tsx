
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

// Map field keys to display names for the sidebar logic
const FIELD_NAMES: Record<keyof CostDetail, string> = {
  labor: '人工费',
  material: '材料(设备)费',
  machinery: '机械费',
  management: '管理费',
  profit: '利润',
  subtotal: '小计',
  total: '合计(元)'
};

const MOCK_DATA: ComparisonRow[] = [
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
  {
    id: 'row-4', index: '4', code: '12-16换', name: '保护墙外侧20厚DP15.0干混防水砂浆防潮层', unit: 'm2', quantity: 60.75,
    contract: { labor: 11.65, material: 11.75, machinery: 0.22, management: 1.97, profit: 0.96, subtotal: 27.47, total: 1669 },
    audit: { labor: 11.58, material: 11.75, machinery: 0.22, management: 1.95, profit: 0.96, subtotal: 27.37, total: 1663 },
  },
  {
    id: 'row-4-sub', index: '', code: '9-43换', name: '防水砂浆立面~干混抹灰砂浆DP M15.0', unit: '100m2', quantity: '0.60752322', isSubRow: true,
    contract: { labor: 1165.27, material: 1175.2, machinery: 21.65, management: 196.67, profit: 96.14, subtotal: 2746.73, total: 1669 },
    audit: { labor: 1157.55, material: 1175.2, machinery: 21.65, management: 195.39, profit: 95.52, subtotal: 2736.51, total: 1662 },
  },
  {
    id: 'row-5', index: '5', code: '4-68', name: '聚氨酯 (PU) 发泡剂嵌缝', unit: 'm', quantity: 26.3,
    contract: { labor: 4.23, material: 6.43, machinery: 0, management: 0.7, profit: 0.34, subtotal: 12.03, total: 316 },
    audit: { labor: 4.2, material: 6.43, machinery: 0, management: 0.7, profit: 0.34, subtotal: 11.99, total: 315 },
  },
  {
    id: 'row-5-sub', index: '', code: '4-68', name: '聚氨酯 (PU) 发泡剂嵌缝', unit: '100m', quantity: 0.263, isSubRow: true,
    contract: { labor: 422.8, material: 642.84, machinery: 0, management: 70.06, profit: 34.25, subtotal: 1202.65, total: 316 },
    audit: { labor: 420, material: 642.84, machinery: 0, management: 69.59, profit: 34.02, subtotal: 1198.93, total: 315 },
  },
  { id: 'h-0105', index: '', code: '', name: '0105 混凝土及钢筋混凝土工程', unit: '', quantity: '', contract: {} as any, audit: {} as any, isHeader: true },
  {
    id: 'row-6', index: '6', code: '5-1换', name: 'C20商品砼基础垫层浇捣', unit: 'm3', quantity: 89.21,
    contract: { labor: 45.72, material: 525.36, machinery: 0.64, management: 7.68, profit: 3.76, subtotal: 586.75, total: 52344 },
    audit: { labor: 45.42, material: 525.36, machinery: 0.64, management: 7.63, profit: 3.73, subtotal: 586.34, total: 52307 },
  }
];

const OKContractCompareView: React.FC = () => {
  const [isComparing, setIsComparing] = useState(false);
  const [showResults, setShowResults] = useState(false);
  const [showCoinAnim, setShowCoinAnim] = useState(false);
  const [highlightedRow, setHighlightedRow] = useState<string | null>(null);
  const [contractFile, setContractFile] = useState<string | null>(null);
  const [auditFile, setAuditFile] = useState<string | null>(null);
  
  const [isSidebarCollapsed, setIsSidebarCollapsed] = useState(false);
  const [activeTab, setActiveTab] = useState<'contract' | 'audit'>('contract');
  
  const tableRef = useRef<HTMLDivElement>(null);

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

  const scrollToRow = (id: string, tab: 'contract' | 'audit') => {
    setActiveTab(tab);
    setHighlightedRow(id);
    setTimeout(() => {
      const element = document.getElementById(id);
      if (element) {
        element.scrollIntoView({ behavior: 'smooth', block: 'center' });
      }
    }, 100);
    setTimeout(() => setHighlightedRow(null), 3000);
  };

  const renderCell = (valCurrent: number, valOther: number) => {
    if (valCurrent === undefined) return '';
    const isDiff = valCurrent !== valOther;
    return (
      <span className={`inline-block px-2 py-1 rounded transition-colors ${isDiff ? 'bg-red-50 text-red-600 font-bold' : 'text-slate-600'}`}>
        {valCurrent === 0 && valOther === 0 ? '' : valCurrent.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
      </span>
    );
  };

  const renderTable = (type: 'contract' | 'audit') => {
    return (
      <div className="flex-1 overflow-auto bg-white custom-scrollbar">
        <table className="w-full text-left border-collapse min-w-[1400px]">
          <thead className="sticky top-0 z-20 shadow-sm">
            <tr className="bg-slate-50 border-b border-slate-300">
              <th rowSpan={2} className="px-3 py-3 text-xs font-black text-slate-700 border-r border-slate-300 text-center w-12">清单序号</th>
              <th rowSpan={2} className="px-3 py-3 text-xs font-black text-slate-700 border-r border-slate-300 w-28">项目编码(定额编码)</th>
              <th rowSpan={2} className="px-3 py-3 text-xs font-black text-slate-700 border-r border-slate-300 w-[400px]">清单(定额)项目名称</th>
              <th rowSpan={2} className="px-3 py-3 text-xs font-black text-slate-700 border-r border-slate-300 text-center w-20">计量单位</th>
              <th rowSpan={2} className="px-3 py-3 text-xs font-black text-slate-700 border-r border-slate-300 text-right w-24">数量</th>
              <th colSpan={6} className="px-3 py-2 text-xs font-black text-slate-700 text-center border-b border-slate-300 border-r border-slate-300">
                综合单价 (元)
              </th>
              <th rowSpan={2} className="px-3 py-3 text-xs font-black text-slate-700 text-right w-28">合计(元)</th>
            </tr>
            <tr className="bg-slate-50 border-b border-slate-300">
              <th className="px-3 py-2 text-[10px] font-bold text-slate-600 text-right w-24 border-r border-slate-200">人工费</th>
              <th className="px-3 py-2 text-[10px] font-bold text-slate-600 text-right w-24 border-r border-slate-200">材料(设备)费</th>
              <th className="px-3 py-2 text-[10px] font-bold text-slate-600 text-right w-24 border-r border-slate-200">机械费</th>
              <th className="px-3 py-2 text-[10px] font-bold text-slate-600 text-right w-24 border-r border-slate-200">管理费</th>
              <th className="px-3 py-2 text-[10px] font-bold text-slate-600 text-right w-24 border-r border-slate-200">利润</th>
              <th className="px-3 py-2 text-[10px] font-bold text-slate-600 text-right w-24 border-r border-slate-300">小计</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-200">
            {MOCK_DATA.map((row) => {
              if (row.isHeader) {
                return (
                  <tr key={row.id} className="bg-slate-50/80">
                    <td className="px-3 py-2 border-r border-slate-200"></td>
                    <td className="px-3 py-2 border-r border-slate-200"></td>
                    <td colSpan={10} className="px-4 py-2 text-xs font-black text-slate-800 tracking-wide uppercase">{row.name}</td>
                  </tr>
                );
              }
              const current = type === 'contract' ? row.contract : row.audit;
              const other = type === 'contract' ? row.audit : row.contract;
              return (
                <tr 
                  key={row.id} 
                  id={row.id}
                  className={`hover:bg-blue-50/40 transition-all duration-300 ${row.isSubRow ? 'bg-slate-50/20' : 'bg-white'} ${highlightedRow === row.id ? 'bg-yellow-50 ring-2 ring-yellow-400 z-10' : ''}`}
                >
                  <td className="px-3 py-3 text-xs text-center font-bold text-slate-500 border-r border-slate-100">{row.index}</td>
                  <td className="px-3 py-3 text-xs font-medium text-slate-600 border-r border-slate-100">{row.code}</td>
                  <td className={`px-4 py-3 text-xs font-bold text-slate-800 border-r border-slate-100 leading-relaxed ${row.isSubRow ? 'pl-10 font-medium text-slate-600' : ''}`}>
                    {row.name}
                  </td>
                  <td className="px-3 py-3 text-xs text-center text-slate-500 border-r border-slate-100">{row.unit}</td>
                  <td className="px-3 py-3 text-xs text-right font-medium text-slate-700 border-r border-slate-100">{row.quantity}</td>
                  <td className="px-3 py-3 text-xs text-right border-r border-slate-100">{renderCell(current.labor, other.labor)}</td>
                  <td className="px-3 py-3 text-xs text-right border-r border-slate-100">{renderCell(current.material, other.material)}</td>
                  <td className="px-3 py-3 text-xs text-right border-r border-slate-100">{renderCell(current.machinery, other.machinery)}</td>
                  <td className="px-3 py-3 text-xs text-right border-r border-slate-100">{renderCell(current.management, other.management)}</td>
                  <td className="px-3 py-3 text-xs text-right border-r border-slate-100">{renderCell(current.profit, other.profit)}</td>
                  <td className="px-3 py-3 text-xs text-right border-r border-slate-200 bg-slate-50/30">{renderCell(current.subtotal, other.subtotal)}</td>
                  <td className="px-3 py-3 text-xs text-right font-black text-slate-900 bg-slate-50/10">
                    {renderCell(current.total, other.total)}
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    );
  };

  return (
    <div className="flex flex-col h-full bg-[#f0f2f5] overflow-hidden relative font-sans text-slate-900">
      {/* 金币入库全屏动画 */}
      {showCoinAnim && (
        <div className="fixed inset-0 z-[999] flex items-center justify-center bg-black/20 backdrop-blur-[2px] pointer-events-none animate-in fade-in duration-200">
          <div className="bg-white rounded-[40px] p-12 shadow-2xl flex flex-col items-center animate-in zoom-in-50 duration-300 border-[6px] border-yellow-400 relative">
            <div className="absolute inset-0 bg-yellow-400/5 rounded-[34px] animate-pulse"></div>
            <div className="relative mb-8">
              <div className="w-28 h-28 bg-gradient-to-tr from-yellow-600 via-yellow-400 to-yellow-200 rounded-full flex items-center justify-center animate-gold shadow-[0_0_30px_rgba(234,179,8,0.5)]">
                <Icon name="Coins" size={56} className="text-white drop-shadow-md" />
              </div>
              {[...Array(8)].map((_, i) => (
                <div key={i} className={`absolute top-0 left-0 animate-ping`} style={{ animationDelay: `${i * 100}ms`, transform: `translate(${Math.sin(i) * 60}px, ${Math.cos(i) * 60}px)` }}>
                  <Icon name="CircleDollarSign" size={20} className="text-yellow-500 opacity-60" />
                </div>
              ))}
            </div>
            <div className="text-center relative z-10">
              <h2 className="text-4xl font-black text-slate-800 mb-2 tracking-tight">对比任务完成!</h2>
              <div className="flex items-center justify-center space-x-3 bg-yellow-50 px-6 py-3 rounded-2xl border border-yellow-100">
                <span className="text-5xl font-black text-yellow-600 drop-shadow-sm">+3</span>
                <div className="text-left">
                  <div className="text-lg font-black text-yellow-700 leading-tight">COINS</div>
                  <div className="text-[10px] font-bold text-yellow-600 uppercase">Deposited</div>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* 顶部输入区 */}
      <div className="bg-white border-b border-slate-200 px-6 py-4 flex items-center justify-between shrink-0 shadow-sm z-10">
        <div className="flex items-center space-x-6 flex-1">
          <div className="flex items-center space-x-3 bg-slate-50 p-2 rounded-2xl border border-slate-100">
             <div className="px-4 py-1.5 text-sm font-bold text-slate-700 bg-white rounded-xl shadow-sm">合同价 (原始文件)</div>
             <button 
               onClick={() => setContractFile('合同价_2024.xlsx')}
               className={`px-4 py-1.5 rounded-xl text-xs font-black transition-all ${contractFile ? 'bg-emerald-500 text-white shadow-md' : 'bg-blue-600 text-white hover:bg-blue-700 active:scale-95 shadow-lg shadow-blue-500/20'}`}
             >
               {contractFile ? '已导入' : '导入按钮'}
             </button>
          </div>
          <div className="flex items-center space-x-3 bg-slate-50 p-2 rounded-2xl border border-slate-100">
             <div className="px-4 py-1.5 text-sm font-bold text-slate-700 bg-white rounded-xl shadow-sm">送审价 (被审文件)</div>
             <button 
               onClick={() => setAuditFile('送审价_V2.xlsx')}
               className={`px-4 py-1.5 rounded-xl text-xs font-black transition-all ${auditFile ? 'bg-emerald-500 text-white shadow-md' : 'bg-blue-600 text-white hover:bg-blue-700 active:scale-95 shadow-lg shadow-blue-500/20'}`}
             >
               {auditFile ? '已导入' : '导入按钮'}
             </button>
          </div>
        </div>

        <button 
          onClick={handleCompare}
          disabled={!contractFile || !auditFile || isComparing}
          className="ml-8 px-10 py-3 bg-blue-600 text-white font-black text-sm rounded-2xl shadow-xl shadow-blue-500/20 hover:bg-blue-700 transition-all active:scale-95 disabled:grayscale disabled:opacity-50"
        >
          {isComparing ? <Icon name="Loader2" className="animate-spin" /> : '价格对比按钮'}
        </button>
      </div>

      <div className="flex-1 flex overflow-hidden relative">
        {/* 对比记录栏 */}
        <div className={`bg-white border-r border-slate-200 flex flex-col shrink-0 transition-all duration-300 ${isSidebarCollapsed ? 'w-12' : 'w-56'}`}>
          <div className="px-4 py-4 border-b border-slate-100 flex items-center justify-between overflow-hidden">
            {!isSidebarCollapsed && <span className="text-xs font-black text-slate-400 uppercase tracking-widest whitespace-nowrap">对比记录栏</span>}
            <button 
              onClick={() => setIsSidebarCollapsed(!isSidebarCollapsed)}
              className="p-1 hover:bg-slate-50 rounded-lg text-slate-300 transition-colors"
            >
              <Icon name={isSidebarCollapsed ? 'PanelLeftOpen' : 'PanelLeftClose'} size={16} />
            </button>
          </div>
          {!isSidebarCollapsed && (
            <div className="flex-1 overflow-y-auto p-3 space-y-2 animate-in fade-in duration-300">
              {['记录1: 2#-g地块地下室', '记录2: 1#楼主体', '记录3: 景观绿化'].map((rec, i) => (
                <div key={i} className="group p-3 rounded-xl border border-transparent hover:border-blue-100 hover:bg-blue-50/30 cursor-pointer transition-all">
                  <p className="text-xs font-bold text-slate-700 group-hover:text-blue-600">{rec}</p>
                  <p className="text-[10px] text-slate-400 mt-1">2024-05-20 14:00</p>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* 主对比显示区 */}
        <div className="flex-1 flex flex-col overflow-hidden">
          {!showResults ? (
            <div className="flex-1 flex flex-col items-center justify-center text-slate-400 space-y-4">
              <div className="w-20 h-20 bg-white rounded-3xl flex items-center justify-center border-2 border-dashed border-slate-200">
                <Icon name="Layout" size={40} className="opacity-20" />
              </div>
              <p className="font-bold text-sm">请先导入文件并点击“价格对比按钮”</p>
            </div>
          ) : (
            <div className="flex-1 flex flex-col overflow-hidden animate-in fade-in slide-in-from-bottom-4 duration-700">
              {/* Tab Container */}
              <div className="bg-white border-b border-slate-200 px-6 py-4 flex items-center space-x-3 shrink-0">
                <button 
                  onClick={() => setActiveTab('contract')}
                  className={`px-8 py-2.5 text-sm font-black transition-all rounded-2xl flex items-center space-x-2 ${
                    activeTab === 'contract' 
                      ? 'bg-blue-600 text-white shadow-xl shadow-blue-500/30' 
                      : 'bg-slate-50 text-slate-500 hover:bg-slate-100 hover:text-slate-700'
                  }`}
                >
                  <Icon name="FileText" size={16} />
                  <span>合同价 (原始)</span>
                </button>
                <button 
                  onClick={() => setActiveTab('audit')}
                  className={`px-8 py-2.5 text-sm font-black transition-all rounded-2xl flex items-center space-x-2 ${
                    activeTab === 'audit' 
                      ? 'bg-blue-600 text-white shadow-xl shadow-blue-500/30' 
                      : 'bg-slate-50 text-slate-500 hover:bg-slate-100 hover:text-slate-700'
                  }`}
                >
                  <Icon name="FileCheck" size={16} />
                  <span>送审价 (比对)</span>
                </button>
              </div>

              {/* Red box section removed per user request */}
              
              <div ref={tableRef} className="flex-1 flex flex-col overflow-hidden">
                {activeTab === 'contract' ? renderTable('contract') : renderTable('audit')}
              </div>
            </div>
          )}
        </div>

        {/* AI 差异分析 Sidebar */}
        {showResults && (
          <div className="w-80 bg-white border-l border-slate-200 flex flex-col shrink-0 animate-in fade-in slide-in-from-right-4 duration-500">
            <div className="p-4 bg-slate-50 border-b border-slate-200 flex items-center justify-between">
              <div className="flex items-center space-x-2">
                <Icon name="BrainCircuit" size={20} className="text-blue-600" />
                <span className="font-bold text-sm text-slate-800">AI 差异分析</span>
              </div>
            </div>

            <div className="flex-1 overflow-y-auto custom-scrollbar bg-white p-4 space-y-4">
               <div className="bg-blue-50/50 rounded-2xl p-4 border border-blue-100 mb-2">
                  <h4 className="text-xs font-black text-blue-600 mb-2">对比摘要</h4>
                  <div className="space-y-2">
                     <div className="flex justify-between text-xs">
                        <span className="text-slate-500">总差异项</span>
                        <span className="font-black text-red-600">8 项</span>
                     </div>
                     <div className="flex justify-between text-xs">
                        <span className="text-slate-500">累计核减</span>
                        <span className="font-black text-emerald-600">¥ 158.00</span>
                     </div>
                  </div>
               </div>

               <div className="space-y-4">
                  <h4 className="text-[11px] font-black text-slate-400 uppercase tracking-widest mb-3">差异明细定位</h4>
                  {MOCK_DATA.filter(r => !r.isHeader && r.contract.total !== r.audit.total).map((row, i) => {
                    // Find the first field that differs to show in the sidebar
                    const diffField = (Object.keys(row.contract) as Array<keyof CostDetail>).find(
                      key => row.contract[key] !== row.audit[key]
                    ) || 'total';
                    const fieldName = FIELD_NAMES[diffField];
                    const diffVal = (row.contract[diffField] - row.audit[diffField]).toFixed(2);

                    return (
                      <div 
                        key={row.id}
                        className="group border border-slate-100 rounded-xl overflow-hidden bg-white hover:border-blue-200 shadow-sm transition-all"
                      >
                        {/* Header Item Name */}
                        <div className="p-3 bg-slate-50/50 border-b border-slate-100">
                          <p className="text-[11px] font-bold text-slate-800 leading-tight">
                            <span className="text-blue-500 mr-2">{row.code}</span>
                            {row.name}
                          </p>
                        </div>

                        {/* Contract Row */}
                        <button 
                          onClick={() => scrollToRow(row.id, 'contract')}
                          className="w-full text-left px-3 py-2 flex items-center border-l-4 border-l-blue-400 hover:bg-blue-50/50 transition-colors"
                        >
                          <span className="text-[10px] text-slate-500 flex-1 truncate">合同价: {fieldName}</span>
                          <span className="text-[11px] font-black text-slate-700">¥ {row.contract[diffField].toFixed(2)}</span>
                        </button>

                        {/* Audit Row */}
                        <button 
                          onClick={() => scrollToRow(row.id, 'audit')}
                          className="w-full text-left px-3 py-2 flex items-center border-l-4 border-l-emerald-400 hover:bg-emerald-50/50 transition-colors border-t border-slate-50"
                        >
                          <span className="text-[10px] text-slate-500 flex-1 truncate">送审价: {fieldName}</span>
                          <span className="text-[11px] font-black text-slate-700">¥ {row.audit[diffField].toFixed(2)}</span>
                        </button>

                        {/* Difference Row */}
                        <div className="px-3 py-2 flex items-center border-l-4 border-l-red-400 bg-red-50/30 border-t border-slate-50">
                          <span className="text-[10px] text-red-500 font-bold flex-1">差异值</span>
                          <span className="text-[11px] font-black text-red-600">¥ {diffVal}</span>
                        </div>
                      </div>
                    );
                  })}
               </div>
            </div>
          </div>
        )}
      </div>
      
      {/* 底部状态栏 */}
      <div className="h-10 bg-white border-t border-slate-200 px-6 flex items-center justify-between shrink-0">
        <div className="flex items-center space-x-8">
          <div className="flex items-center space-x-2 text-[10px] font-bold text-slate-400">
            <div className="w-4 h-2 bg-red-50 border border-red-200 rounded shadow-sm"></div>
            <span>存在差异项 (红字红底)</span>
          </div>
          <div className="flex items-center space-x-2 text-[10px] font-bold text-slate-400">
            <div className="flex space-x-1">
              <div className="w-2 h-2 bg-blue-400 rounded-full"></div>
              <div className="w-2 h-2 bg-emerald-400 rounded-full"></div>
              <div className="w-2 h-2 bg-red-400 rounded-full"></div>
            </div>
            <span>点击差异项可跳转定位</span>
          </div>
        </div>
        <div className="text-[10px] font-black text-slate-300 italic uppercase tracking-widest">
          HUIZAOJIA AI AUDIT ENGINE V3.0
        </div>
      </div>
    </div>
  );
};

export default OKContractCompareView;
