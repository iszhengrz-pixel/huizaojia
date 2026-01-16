
import React, { useState } from 'react';
import Icon from './Icon';

interface UploadedFile {
  id: string;
  name: string;
  time: string;
  type: 'original' | 'audit';
  sheetCount: number;
  listCount: number;
}

interface SheetIdentification {
  id: string;
  name: string;
  isList: boolean;
  rowCount: number;
  matchedFields: string[];
  confidence: number;
  headerFields: string[];
  previewData: any[];
}

interface ComparisonItem {
  id: string;
  code: string;
  name: string;
  features: string;
  unit: string;
  min: number;
  max: number;
  diff: number;
  sourceCount: number;
  sources: {
    fileName: string;
    sheetName: string;
    price: number;
    isBaseline: boolean;
  }[];
}

// 初始模拟数据
const INITIAL_IDENTIFICATION_DATA: SheetIdentification[] = [
  {
    id: 's1',
    name: '清单封面',
    isList: false,
    rowCount: 12,
    matchedFields: ['建设单位：'],
    confidence: 5,
    headerFields: ['建设单位', '工程名称', '编制日期'],
    previewData: [{ c1: '建设单位：XXX公司', c2: '', c3: '' }]
  },
  {
    id: 's2',
    name: '单位工程费汇总表',
    isList: false,
    rowCount: 12,
    matchedFields: ['项目名称', '单位工程费汇总表'],
    confidence: 45,
    headerFields: ['序号', '项目名称', '金额(元)', '备注'],
    previewData: [
      { c1: '1', c2: '分部分项工程费', c3: '1,200,300.00', c4: '' },
      { c1: '2', c2: '措施项目费', c3: '85,000.00', c4: '' }
    ]
  },
  {
    id: 's3',
    name: '表10.2.2-16 分部分项工程清单与计价表【2标地下室',
    isList: true,
    rowCount: 49,
    matchedFields: ['项目编码', '项目特征', '计量单位', '工程量'],
    confidence: 60,
    headerFields: ['序号', '项目编码', '项目名称', '项目特征', '计量单位', '工程量', '金额（元）', '备注'],
    previewData: [
      { c1: '', c2: '', c3: '0103 桩基工程', c4: '', c5: '', c6: '', c7: '' },
      { c1: '1', c2: '010302001001', c3: '泥浆护壁成孔灌注桩', c4: '桩径Φ600 钢护筒埋设...', c5: 'm', c6: '698', c7: '90' }
    ]
  },
  {
    id: 's4',
    name: '±0.00以上分部分项工程量清单',
    isList: true,
    rowCount: 82,
    matchedFields: ['编码', '综合单价', '项目特征', '计量单位'],
    confidence: 100,
    headerFields: ['序号', '项目编码', '项目名称', '项目特征', '计量单位', '工程量', '金额（元）', '备注'],
    previewData: [
      { c1: '1', c2: '010302001001', c3: '泥浆护壁成孔灌注桩', c4: '桩径Φ600 钢护筒埋设...', c5: 'm', c6: '698', c7: '90' }
    ]
  }
];

const MOCK_COMPARISON_DATA: ComparisonItem[] = [
  {
    id: 'c1',
    code: '030404017001',
    name: '配电箱',
    features: '1、名称：成套配电箱安装...',
    unit: '台',
    min: 829.46,
    max: 18804.46,
    diff: 17975.00,
    sourceCount: 2,
    sources: [
      { fileName: '测试用例-清单-送审价.xlsx', sheetName: '表10.2.2-16 分部分项工程清单与计价表【地下室平时】', price: 829.46, isBaseline: true },
      { fileName: '测试用例-清单-合同价.xlsx', sheetName: '表10.2.2-16 分部分项工程清单与计价表【地下室平时】', price: 18804.46, isBaseline: false }
    ]
  }
];

const OKContractCompareView: React.FC = () => {
  const [viewState, setViewState] = useState<'upload' | 'results' | 'detail' | 'comparison'>('upload');
  const [files, setFiles] = useState<UploadedFile[]>([]);
  const [isComparing, setIsComparing] = useState(false);
  const [activeFile, setActiveFile] = useState<UploadedFile | null>(null);
  
  const [identificationData, setIdentificationData] = useState<SheetIdentification[]>(INITIAL_IDENTIFICATION_DATA);
  const [activeSheetId, setActiveSheetId] = useState<string | null>(null);
  const activeSheet = identificationData.find(s => s.id === activeSheetId);

  const [expandedSheetRows, setExpandedSheetRows] = useState<Set<string>>(new Set());
  const [expandedSidebarFiles, setExpandedSidebarFiles] = useState<Set<string>>(new Set());
  const [selectedSheets, setSelectedSheets] = useState<Set<string>>(new Set());

  const handleUpload = () => {
    const isFirst = files.length === 0;
    const newFile: UploadedFile = {
      id: isFirst ? 'original' : 'audit-' + Math.random().toString(36).substr(2, 4),
      name: isFirst ? '测试用例-清单-合同价.xlsx' : '测试用例-清单-送审价.xlsx',
      time: new Date().toLocaleString('zh-CN', { hour12: false }),
      type: isFirst ? 'original' : 'audit',
      sheetCount: 6,
      listCount: 1242
    };
    setFiles(prev => [...prev, newFile]);
  };

  const toggleSidebarFile = (fileId: string) => {
    const newExpanded = new Set(expandedSidebarFiles);
    if (newExpanded.has(fileId)) newExpanded.delete(fileId);
    else newExpanded.add(fileId);
    setExpandedSidebarFiles(newExpanded);
  };

  const toggleIsList = (id: string) => {
    setIdentificationData(prev => prev.map(s => s.id === id ? { ...s, isList: !s.isList } : s));
  };

  const startAnalysis = () => {
    if (files.length === 0) return;
    setIsComparing(true);
    const allSheetKeys = new Set<string>();
    const allFileIds = new Set<string>();
    files.forEach(file => {
      allFileIds.add(file.id);
      for (let i = 1; i <= file.sheetCount; i++) allSheetKeys.add(`${file.id}-${i}`);
    });
    setSelectedSheets(allSheetKeys);
    setExpandedSidebarFiles(allFileIds);

    setTimeout(() => {
      setIsComparing(false);
      // 按照用户需求，分析完成后进入识别结果页，默认查看最新上传的一个文件
      setActiveFile(files[files.length - 1]);
      setViewState('results');
    }, 1500);
  };

  const toggleSheetRow = (id: string) => {
    const newSet = new Set(expandedSheetRows);
    if (newSet.has(id)) newSet.delete(id);
    else newSet.add(id);
    setExpandedSheetRows(newSet);
  };

  // --- 视图: 识别结果列表 ---
  const renderResultsView = () => (
    <div className="flex-1 flex flex-col h-full bg-[#f8fafc] overflow-hidden animate-in fade-in duration-500">
      <div className="px-8 py-4 border-b border-slate-200 bg-white flex items-center justify-between shrink-0">
        <div className="flex items-center space-x-4">
          <button onClick={() => setViewState('upload')} className="p-2 text-slate-400 hover:text-blue-600 bg-white rounded-lg border border-slate-200 shadow-sm transition-all outline-none">
            <Icon name="ArrowLeft" size={18} />
          </button>
          <div>
            <div className="flex items-center space-x-3">
              <h1 className="text-lg font-black text-slate-900">识别结果</h1>
              <span className="text-xs bg-emerald-50 text-emerald-600 px-2 py-0.5 rounded-full font-bold border border-emerald-100">找到 {identificationData.filter(s => s.isList).length} 个清单</span>
            </div>
            <p className="text-[11px] text-slate-400 font-bold mt-0.5">文件: {activeFile?.name}</p>
          </div>
        </div>
      </div>

      <div className="flex-1 overflow-y-auto p-8 custom-scrollbar">
        <div className="max-w-6xl mx-auto">
          <div className="bg-white border border-slate-200 rounded-[24px] shadow-sm overflow-hidden">
            <table className="w-full border-collapse">
              <thead>
                <tr className="bg-slate-50/50 border-b border-slate-100">
                  <th className="w-12 px-4 py-4"></th>
                  <th className="px-4 py-4 text-xs font-black text-slate-400 text-left uppercase tracking-wider">Sheet名称</th>
                  <th className="px-4 py-4 text-xs font-black text-slate-400 text-center uppercase tracking-wider">是否清单</th>
                  <th className="px-4 py-4 text-xs font-black text-slate-400 text-center uppercase tracking-wider">数据行数</th>
                  <th className="px-4 py-4 text-xs font-black text-slate-400 text-left uppercase tracking-wider">匹配字段</th>
                  <th className="px-4 py-4 text-xs font-black text-slate-400 text-left uppercase tracking-wider">置信度</th>
                  <th className="px-4 py-4 text-xs font-black text-slate-400 text-center uppercase tracking-wider">操作</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-50">
                {identificationData.map(sheet => (
                  <React.Fragment key={sheet.id}>
                    <tr className={`hover:bg-blue-50/20 transition-all ${expandedSheetRows.has(sheet.id) ? 'bg-blue-50/10' : ''}`}>
                      <td className="px-4 py-4 text-center">
                        <button onClick={() => toggleSheetRow(sheet.id)} className="text-slate-300 hover:text-blue-500 transition-colors">
                          <Icon name={expandedSheetRows.has(sheet.id) ? 'ChevronDown' : 'ChevronRight'} size={14} />
                        </button>
                      </td>
                      <td className="px-4 py-4">
                        <div className="flex items-center space-x-2">
                          {sheet.isList && <Icon name="CheckCircle" size={14} className="text-emerald-500" />}
                          <span className="text-xs font-bold text-slate-700">{sheet.name}</span>
                        </div>
                      </td>
                      <td className="px-4 py-4">
                        <div className="flex items-center justify-center space-x-2">
                          <span className={`text-[10px] font-black transition-colors ${!sheet.isList ? 'text-blue-600' : 'text-slate-300'}`}>否</span>
                          <div 
                            onClick={() => toggleIsList(sheet.id)}
                            className={`w-8 h-4 rounded-full p-0.5 cursor-pointer transition-all ${sheet.isList ? 'bg-blue-500' : 'bg-slate-200'}`}
                          >
                            <div className={`w-3 h-3 bg-white rounded-full shadow-sm transition-all ${sheet.isList ? 'translate-x-4' : 'translate-x-0'}`} />
                          </div>
                          <span className={`text-[10px] font-black transition-colors ${sheet.isList ? 'text-blue-600' : 'text-slate-300'}`}>是</span>
                        </div>
                      </td>
                      <td className="px-4 py-4 text-center text-xs font-bold text-slate-500">{sheet.rowCount}</td>
                      <td className="px-4 py-4">
                        <div className="flex flex-wrap gap-1">
                          {sheet.matchedFields.map(f => (
                            <span key={f} className="text-[9px] bg-emerald-50 text-emerald-600 px-1.5 py-0.5 rounded border border-emerald-100 font-bold">{f}</span>
                          ))}
                        </div>
                      </td>
                      <td className="px-4 py-4">
                        <div className="flex items-center space-x-3 min-w-[100px]">
                          <div className="flex-1 h-1 bg-slate-100 rounded-full overflow-hidden">
                            <div className={`h-full transition-all duration-1000 ${sheet.confidence > 80 ? 'bg-emerald-500' : sheet.confidence > 30 ? 'bg-amber-500' : 'bg-rose-500'}`} style={{ width: `${sheet.confidence}%` }} />
                          </div>
                          <span className="text-[10px] font-black text-slate-400">{sheet.confidence}%</span>
                        </div>
                      </td>
                      <td className="px-4 py-4 text-center">
                        <button 
                          onClick={() => { setActiveSheetId(sheet.id); setViewState('detail'); }}
                          className="bg-blue-50 text-blue-600 px-3 py-1.5 rounded-lg text-[10px] font-black hover:bg-blue-100 border border-blue-100 transition-all"
                        >
                          查看明细
                        </button>
                      </td>
                    </tr>
                    {expandedSheetRows.has(sheet.id) && (
                      <tr className="bg-slate-50/50">
                        <td colSpan={7} className="px-12 py-6 border-b border-slate-100">
                          <div className="space-y-6 animate-in slide-in-from-top-2 duration-300">
                            <div>
                              <h4 className="text-[11px] font-black text-slate-400 uppercase tracking-widest mb-3">表头字段：</h4>
                              <div className="flex flex-wrap gap-2">
                                {sheet.headerFields.map(f => (
                                  <span key={f} className="text-[10px] bg-white border border-slate-200 text-slate-600 px-2 py-1 rounded-lg font-bold shadow-sm">{f}</span>
                                ))}
                              </div>
                            </div>
                            <div>
                              <h4 className="text-[11px] font-black text-slate-400 uppercase tracking-widest mb-3">数据预览：</h4>
                              <div className="bg-white border border-slate-100 rounded-xl shadow-sm overflow-hidden">
                                <table className="w-full text-left">
                                  <thead className="bg-slate-50/50 border-b border-slate-100">
                                    <tr className="text-[10px] font-black text-slate-400 uppercase">
                                      {sheet.headerFields.map(f => <th key={f} className="px-3 py-2 border-r border-slate-50 last:border-0">{f}</th>)}
                                    </tr>
                                  </thead>
                                  <tbody className="divide-y divide-slate-50">
                                    {sheet.previewData.map((row, idx) => (
                                      <tr key={idx} className="text-[10px] text-slate-600">
                                        {Object.values(row).map((val: any, i) => <td key={i} className="px-3 py-2 border-r border-slate-50 last:border-0">{val}</td>)}
                                      </tr>
                                    ))}
                                  </tbody>
                                </table>
                              </div>
                            </div>
                          </div>
                        </td>
                      </tr>
                    )}
                  </React.Fragment>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  );

  // --- 视图: Sheet 明细查看 ---
  const renderDetailView = () => (
    <div className="flex-1 flex flex-col h-full bg-[#f8fafc] overflow-hidden animate-in fade-in duration-500">
      <div className="px-8 py-4 border-b border-slate-200 bg-white flex items-center space-x-6 shrink-0">
        <button onClick={() => setViewState('results')} className="flex items-center space-x-2 text-slate-400 hover:text-blue-600 font-bold text-sm transition-colors">
          <Icon name="ArrowLeft" size={18} />
          <span>返回</span>
        </button>
        <div className="w-px h-6 bg-slate-200" />
        <h1 className="text-lg font-black text-slate-800">Sheet 明细查看</h1>
      </div>

      <div className="flex-1 overflow-y-auto p-8 custom-scrollbar">
        <div className="max-w-[1600px] mx-auto space-y-6">
          <div className="bg-white border border-slate-100 rounded-[24px] p-8 shadow-sm">
            <div className="flex items-center justify-between mb-8">
              <div className="flex items-center space-x-6">
                <h2 className="text-xl font-black text-slate-800">{activeSheet?.name}</h2>
                <div className="flex items-center bg-slate-50 rounded-2xl px-4 py-2 border border-slate-100 space-x-4">
                  <span className="text-xs font-black text-slate-500">是否清单</span>
                  <div className="flex items-center space-x-2">
                    <span className={`text-[11px] font-black transition-colors ${!activeSheet?.isList ? 'text-blue-600' : 'text-slate-300'}`}>否</span>
                    <div 
                      onClick={() => activeSheet && toggleIsList(activeSheet.id)}
                      className={`w-9 h-5 rounded-full p-0.5 cursor-pointer transition-all ${activeSheet?.isList ? 'bg-blue-500' : 'bg-slate-200'}`}
                    >
                      <div className={`w-4 h-4 bg-white rounded-full shadow-sm transition-all ${activeSheet?.isList ? 'translate-x-4' : 'translate-x-0'}`} />
                    </div>
                    <span className={`text-[11px] font-black transition-colors ${activeSheet?.isList ? 'text-blue-600' : 'text-slate-300'}`}>是</span>
                  </div>
                </div>
              </div>
            </div>
            <div className="grid grid-cols-3 gap-8">
              <div className="bg-slate-50/50 rounded-2xl p-5 border border-slate-100 flex items-center justify-between">
                <span className="text-xs font-bold text-slate-400">数据行数</span>
                <span className="text-xl font-black text-slate-700">{activeSheet?.rowCount}</span>
              </div>
              <div className="bg-slate-50/50 rounded-2xl p-5 border border-slate-100 space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold text-slate-400">置信度</span>
                  <span className="text-xs font-black text-amber-500">{activeSheet?.confidence}%</span>
                </div>
                <div className="w-full h-1.5 bg-slate-200 rounded-full overflow-hidden">
                  <div className="h-full bg-amber-500 transition-all duration-1000" style={{ width: `${activeSheet?.confidence}%` }} />
                </div>
              </div>
              <div className="bg-slate-50/50 rounded-2xl p-5 border border-slate-100 flex flex-col justify-between">
                <span className="text-xs font-bold text-slate-400 mb-2">匹配字段</span>
                <div className="flex flex-wrap gap-1.5">
                  {activeSheet?.matchedFields.map(f => (
                    <span key={f} className="text-[10px] bg-emerald-50 text-emerald-600 px-2 py-0.5 rounded font-black border border-emerald-100">{f}</span>
                  ))}
                </div>
              </div>
            </div>
          </div>

          <div className="bg-white border border-slate-100 rounded-[24px] overflow-hidden shadow-sm">
            <div className="px-8 py-5 border-b border-slate-50 flex items-center justify-between bg-white">
              <h3 className="text-sm font-black text-slate-800">完整数据 <span className="text-slate-400 ml-2 font-bold">共 {activeSheet?.rowCount} 行数据</span></h3>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full border-collapse text-left">
                <thead className="bg-[#f8fafc] border-b border-slate-200 sticky top-0 z-10 font-bold">
                  <tr className="text-[11px] text-slate-500 uppercase tracking-wider">
                    <th className="px-6 py-4 border-r border-slate-100 bg-slate-50/50">行号</th>
                    <th className="px-6 py-4 border-r border-slate-100">序号</th>
                    <th className="px-6 py-4 border-r border-slate-100">项目编码</th>
                    <th className="px-6 py-4 border-r border-slate-100 min-w-[200px]">项目名称</th>
                    <th className="px-6 py-4 border-r border-slate-100 min-w-[150px]">项目特征</th>
                    <th className="px-6 py-4 border-r border-slate-100 text-center">计量单位</th>
                    <th className="px-6 py-4 border-r border-slate-100 text-center">工程量</th>
                    <th className="px-6 py-4 border-r border-slate-100 text-right">金额（元）</th>
                    <th className="px-6 py-4">备注</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-50 text-[13px]">
                  <tr className="bg-blue-50/10">
                    <td className="px-6 py-3.5 text-xs font-bold text-slate-300 border-r border-slate-50">1</td>
                    <td className="px-6 py-3.5 border-r border-slate-50"></td>
                    <td className="px-6 py-3.5 border-r border-slate-50"></td>
                    <td className="px-6 py-3.5 font-black text-slate-800 border-r border-slate-50">0103 桩基工程</td>
                    <td className="px-6 py-3.5 border-r border-slate-50"></td>
                    <td className="px-6 py-3.5 border-r border-slate-50"></td>
                    <td className="px-6 py-3.5 border-r border-slate-50"></td>
                    <td className="px-6 py-3.5 text-right font-bold text-slate-900 border-r border-slate-50">12,728,148.12</td>
                    <td className="px-6 py-3.5"></td>
                  </tr>
                  <tr>
                    <td className="px-6 py-3.5 text-xs font-bold text-slate-300 border-r border-slate-50">2</td>
                    <td className="px-6 py-3.5 text-slate-600 border-r border-slate-50">1</td>
                    <td className="px-6 py-3.5 font-mono text-slate-500 border-r border-slate-50">010302001001</td>
                    <td className="px-6 py-3.5 font-bold text-slate-700 border-r border-slate-50">泥浆护壁成孔灌注桩</td>
                    <td className="px-6 py-3.5 text-[11px] text-slate-400 leading-relaxed border-r border-slate-50">桩径Φ600 钢护筒埋设及拆除...</td>
                    <td className="px-6 py-3.5 text-center text-slate-500 border-r border-slate-50">m</td>
                    <td className="px-6 py-3.5 text-center font-bold text-slate-700 border-r border-slate-50">698</td>
                    <td className="px-6 py-3.5 text-right font-black text-blue-600 border-r border-slate-50">63,636.66</td>
                    <td className="px-6 py-3.5 text-slate-300">-</td>
                  </tr>
                  <tr>
                    <td className="px-6 py-3.5 text-xs font-bold text-slate-300 border-r border-slate-50">3</td>
                    <td className="px-6 py-3.5 text-slate-600 border-r border-slate-50">2</td>
                    <td className="px-6 py-3.5 font-mono text-slate-500 border-r border-slate-50">010302001002</td>
                    <td className="px-6 py-3.5 font-bold text-slate-700 border-r border-slate-50">泥浆护壁成孔灌注桩</td>
                    <td className="px-6 py-3.5 text-[11px] text-slate-400 leading-relaxed border-r border-slate-50">桩径Φ700 钢护筒埋设及拆除...</td>
                    <td className="px-6 py-3.5 text-center text-slate-500 border-r border-slate-50">m</td>
                    <td className="px-6 py-3.5 text-center font-bold text-slate-700 border-r border-slate-50">784</td>
                    <td className="px-6 py-3.5 text-right font-black text-blue-600 border-r border-slate-50">93,554.72</td>
                    <td className="px-6 py-3.5 text-slate-300">-</td>
                  </tr>
                  {Array.from({ length: 15 }).map((_, idx) => (
                    <tr key={idx + 4} className="hover:bg-slate-50 transition-colors">
                      <td className="px-6 py-3 text-xs font-bold text-slate-200 border-r border-slate-50">{idx + 4}</td>
                      <td className="px-6 py-3 border-r border-slate-50">-</td>
                      <td className="px-6 py-3 border-r border-slate-50">-</td>
                      <td className="px-6 py-3 text-slate-400 italic border-r border-slate-50">...</td>
                      <td className="px-6 py-3 border-r border-slate-50">-</td>
                      <td className="px-6 py-3 border-r border-slate-50">-</td>
                      <td className="px-6 py-3 border-r border-slate-50">-</td>
                      <td className="px-6 py-3 text-right border-r border-slate-50">-</td>
                      <td className="px-6 py-3 text-slate-200">-</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      </div>
    </div>
  );

  // --- 视图: 比对主界面 ---
  const renderComparisonView = () => (
    <div className="flex-1 flex h-full bg-[#f8fafc] overflow-hidden animate-in fade-in duration-500">
      <div className="flex-1 flex flex-col items-center justify-center space-y-6">
        <div className="w-20 h-20 bg-emerald-50 text-emerald-500 rounded-[24px] flex items-center justify-center shadow-lg">
          <Icon name="CheckCircle" size={40} />
        </div>
        <div className="text-center">
          <h2 className="text-2xl font-black text-slate-800">比对任务已完成</h2>
          <p className="text-slate-400 mt-2">已成功生成智能比对报告</p>
        </div>
        <button onClick={() => setViewState('results')} className="bg-slate-900 text-white px-8 py-3 rounded-2xl font-bold hover:bg-slate-800 transition-all">返回查看识别结果</button>
      </div>
    </div>
  );

  const renderContent = () => {
    switch (viewState) {
      case 'comparison': return renderComparisonView();
      case 'results': return renderResultsView();
      case 'detail': return renderDetailView();
      default: return (
        <div className="flex-1 overflow-y-auto bg-[#f8fafc] p-6 space-y-6 custom-scrollbar">
          <div className="bg-white rounded-lg border border-slate-200 shadow-sm overflow-hidden">
            <div className="px-5 py-3 border-b border-slate-100"><h2 className="text-[14px] font-bold text-slate-800">Excel清单对比识别器</h2></div>
            <div className="p-4">
              <div onClick={handleUpload} className="border-2 border-dashed border-slate-100 rounded-xl py-6 flex flex-col items-center justify-center space-y-2 hover:bg-blue-50/30 hover:border-blue-300 transition-all cursor-pointer group">
                <div className="w-10 h-10 bg-[#40a9ff] rounded-full flex items-center justify-center text-white shadow-lg group-hover:scale-105 transition-transform"><Icon name="CloudUpload" size={20} /></div>
                <p className="text-[12px] text-slate-500">将Excel文件拖到此处，或<span className="text-blue-500 font-medium">点击上传</span></p>
              </div>
            </div>
          </div>
          <div className="bg-white rounded-lg border border-slate-200 shadow-sm overflow-hidden min-h-[450px]">
            <div className="px-5 py-3 border-b border-slate-100 flex items-center justify-between">
              <h2 className="text-[14px] font-bold text-slate-800">已上传文件 ({files.length})</h2>
              <button 
                onClick={startAnalysis} 
                disabled={files.length === 0 || isComparing} 
                className="bg-blue-600 disabled:bg-slate-300 text-white px-5 py-1.5 rounded-lg text-xs font-bold hover:bg-blue-700 shadow-lg shadow-blue-500/20 transition-all flex items-center space-x-2 outline-none"
              >
                {isComparing ? <Icon name="Loader2" size={14} className="animate-spin" /> : <Icon name="Zap" size={14} />}
                <span>开始智能对比分析</span>
              </button>
            </div>
            <div className="p-4 space-y-1.5">
              {files.map(file => (
                <div key={file.id} className="relative pl-8">
                  <div className="absolute left-[3px] top-1.5 bottom-[-10px] w-px bg-slate-100 last:hidden" />
                  <div className="absolute left-0 top-1.5 w-2 h-2 bg-slate-200 rounded-full border-2 border-white" />
                  <div className="space-y-1">
                    <p className="text-[10px] text-slate-400 font-medium">{file.time}</p>
                    <div className="bg-white border border-slate-100 rounded-xl p-2.5 flex items-center justify-between group hover:shadow-sm hover:border-blue-100 transition-all">
                      <div className="flex-1 flex items-center justify-between mr-4 min-w-0">
                        <div className="flex items-center space-x-2 truncate">
                          <div className={`w-7 h-7 rounded-lg flex items-center justify-center ${file.type === 'original' ? 'bg-blue-50 text-blue-500' : 'bg-emerald-50 text-emerald-500'}`}><Icon name={file.type === 'original' ? 'FileText' : 'FileCheck'} size={14} /></div>
                          <h3 className="text-xs font-bold text-slate-700 truncate">{file.name}</h3>
                        </div>
                        <div className="flex items-center space-x-2 shrink-0 ml-4">
                          <span className="bg-[#e6f7ff] text-[#1890ff] text-[10px] font-bold px-2 py-0.5 rounded">{file.sheetCount} Sheet</span>
                          <span className="bg-[#f6ffed] text-[#52c41a] text-[10px] font-bold px-2 py-0.5 rounded">{file.listCount} 清单</span>
                        </div>
                      </div>
                      <div className="flex items-center space-x-2 shrink-0">
                        <button onClick={() => { setActiveFile(file); setViewState('results'); }} className="px-3 py-1 bg-white border border-slate-200 rounded-lg text-[10px] font-bold text-slate-600 hover:bg-slate-50 transition-all">查看</button>
                        <button onClick={(e) => { e.stopPropagation(); setFiles(prev => prev.filter(f => f.id !== file.id)); }} className="px-3 py-1 bg-rose-500 text-white rounded-lg text-[10px] font-bold hover:bg-rose-600 transition-all shadow-sm">移除</button>
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      );
    }
  };

  return <div className="flex-1 flex flex-col h-full bg-white animate-in fade-in duration-300 overflow-hidden">{renderContent()}</div>;
};

export default OKContractCompareView;
