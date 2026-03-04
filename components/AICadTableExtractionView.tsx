
import React, { useState, useMemo, useEffect } from 'react';
import Icon from './Icon';

interface AICadTableExtractionViewProps {
  isEmbedded?: boolean;
}

interface Project {
  id: string;
  name: string;
  createTime: string;
  files: string[];
}

interface CadDataRow {
  id: string;
  building: string;
  type: string;
  serial: string;
  width: number;
  height: number;
  // 分层工程量
  q1f: number;
  q2f: number;
  q3f: number;
  q4_17f: number;
  q18f: number;
  qMf: number;
  coords?: { x: number; y: number };
}

const MOCK_DATA: CadDataRow[] = [
  { id: '1', building: '16#', type: '平开窗', serial: 'PC06’ 13’', width: 650, height: 1350, q1f: 12, q2f: 12, q3f: 12, q4_17f: 168, q18f: 12, qMf: 2, coords: { x: 20, y: 30 } },
  { id: '2', building: '16#', type: '平开窗', serial: 'PC06’ 13’ M', width: 650, height: 1350, q1f: 4, q2f: 4, q3f: 4, q4_17f: 56, q18f: 4, qMf: 0, coords: { x: 40, y: 30 } },
  { id: '3', building: '17#', type: '推拉门', serial: 'TLM2124', width: 2100, height: 2400, q1f: 2, q2f: 2, q3f: 2, q4_17f: 28, q18f: 2, qMf: 0, coords: { x: 60, y: 30 } },
  { id: '4', building: '18#', type: '普通窗', serial: 'C1515', width: 1500, height: 1500, q1f: 8, q2f: 8, q3f: 8, q4_17f: 112, q18f: 8, qMf: 0, coords: { x: 80, y: 30 } },
  { id: '5', building: '18#', type: '百叶窗', serial: 'BY0606', width: 600, height: 600, q1f: 1, q2f: 1, q3f: 1, q4_17f: 14, q18f: 1, qMf: 4, coords: { x: 30, y: 60 } },
];

const AICadTableExtractionView: React.FC<AICadTableExtractionViewProps> = ({ isEmbedded = false }) => {
  const [projects, setProjects] = useState<Project[]>([]);
  const [activeProjectId, setActiveProjectId] = useState<string | null>(null);
  const [isRecognized, setIsRecognized] = useState(false);
  const [isRecognizing, setIsRecognizing] = useState(false);
  const [isSidebarCollapsed, setIsSidebarCollapsed] = useState(false);
  
  // 全屏状态模式: 'none' | 'preview' | 'table'
  const [fullscreenMode, setFullscreenMode] = useState<'none' | 'preview' | 'table'>('none');
  
  // 预览区选择状态
  const [selectedBuilding, setSelectedBuilding] = useState('全部');
  const [selectedFloor, setSelectedFloor] = useState('全部');
  
  const [locatingItemId, setLocatingItemId] = useState<string | null>(null);
  
  const [isNewProjectModalOpen, setIsNewProjectModalOpen] = useState(false);
  const [isAppendFilesModalOpen, setIsAppendFilesModalOpen] = useState(false);
  const [isExportPreviewOpen, setIsExportPreviewOpen] = useState(false);
  const [activeExportSheet, setActiveExportSheet] = useState('门窗报价汇总表');

  const [previewTypeFilter, setPreviewTypeFilter] = useState('全部');
  const [previewSerialFilter, setPreviewSerialFilter] = useState('全部');
  const [currentMatchIndex, setCurrentMatchIndex] = useState(0);

  // 手动添加门窗相关状态
  const [isManualAddMode, setIsManualAddMode] = useState(false);
  const [selectionStart, setSelectionStart] = useState<{ x: number; y: number } | null>(null);
  const [selectionEnd, setSelectionEnd] = useState<{ x: number; y: number } | null>(null);
  const [isDrawing, setIsDrawing] = useState(false);
  const [isManualAddModalOpen, setIsManualAddModalOpen] = useState(false);
  const [manualAddData, setManualAddData] = useState({
    building: '',
    floor: '',
    type: '',
    serial: ''
  });
  const [activeDropdown, setActiveDropdown] = useState<string | null>(null);

  const [newProjName, setNewProjName] = useState('');
  const [tempFiles, setTempFiles] = useState<string[]>([]);

  const [tableData, setTableData] = useState<CadDataRow[]>([]);
  const [filters, setFilters] = useState({ building: '全部', type: '全部' });
  const [currentPreviewFile, setCurrentPreviewFile] = useState<string>('');

  const activeProject = projects.find(p => p.id === activeProjectId);

  // 监听 Esc 退出全屏
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && fullscreenMode !== 'none') {
        setFullscreenMode('none');
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [fullscreenMode]);

  useEffect(() => {
    if (activeProject && activeProject.files.length > 0) {
      if (!currentPreviewFile || !activeProject.files.includes(currentPreviewFile)) {
        setCurrentPreviewFile(activeProject.files[0]);
      }
    } else {
      setCurrentPreviewFile('');
    }
  }, [activeProjectId, activeProject?.files]);

  const handleConfirmNewProject = () => {
    if (!newProjName.trim()) return alert("请输入项目名称");
    const proj: Project = {
      id: Date.now().toString(),
      name: newProjName,
      createTime: new Date().toLocaleString('zh-CN', { hour12: false }),
      files: tempFiles
    };
    setProjects(prev => [proj, ...prev]);
    setActiveProjectId(proj.id);
    setIsRecognized(false);
    setNewProjName('');
    setTempFiles([]);
    setIsNewProjectModalOpen(false);
  };

  const handleConfirmAppendFiles = () => {
    if (!activeProjectId || tempFiles.length === 0) return setIsAppendFilesModalOpen(false);
    setProjects(prev => prev.map(p => 
      p.id === activeProjectId 
        ? { ...p, files: [...p.files, ...tempFiles] } 
        : p
    ));
    setTempFiles([]);
    setIsAppendFilesModalOpen(false);
  };

  const startRecognition = () => {
    setIsRecognizing(true);
    setTimeout(() => {
      setIsRecognizing(false);
      setIsRecognized(true);
      setTableData([...MOCK_DATA]);
    }, 1500);
  };

  const handleLocateItem = (id: string) => {
    setLocatingItemId(id);
    setTimeout(() => setLocatingItemId(null), 3000);
  };

  const filteredData = useMemo(() => {
    return tableData.filter(row => {
      const matchB = filters.building === '全部' || row.building === filters.building;
      const matchT = filters.type === '全部' || row.type === filters.type;
      return matchB && matchT;
    });
  }, [tableData, filters]);

  const uniqueTypes = ['全部', ...Array.from(new Set(tableData.map(r => r.type)))];

  const availablePreviewSerials = useMemo(() => {
    const serials = tableData
      .filter(r => {
        const matchB = selectedBuilding === '全部' || r.building === selectedBuilding;
        let matchF = true;
        if (selectedFloor === '1F') matchF = r.q1f > 0;
        else if (selectedFloor === '2F') matchF = r.q2f > 0;
        else if (selectedFloor === '3F') matchF = r.q3f > 0;
        const matchType = previewTypeFilter === '全部' || r.type === previewTypeFilter;
        return matchB && matchF && matchType;
      })
      .map(r => r.serial);
    return ['全部', ...Array.from(new Set(serials))];
  }, [tableData, selectedBuilding, selectedFloor, previewTypeFilter]);

  const previewMatches = useMemo(() => {
    return tableData.filter(row => {
      const matchB = selectedBuilding === '全部' || row.building === selectedBuilding;
      let matchF = true;
      if (selectedFloor === '1F') matchF = row.q1f > 0;
      else if (selectedFloor === '2F') matchF = row.q2f > 0;
      else if (selectedFloor === '3F') matchF = row.q3f > 0;
      const matchType = previewTypeFilter === '全部' || row.type === previewTypeFilter;
      const matchSerial = previewSerialFilter === '全部' || row.serial === previewSerialFilter;
      return matchB && matchF && matchType && matchSerial;
    });
  }, [tableData, selectedBuilding, selectedFloor, previewTypeFilter, previewSerialFilter]);

  const locateNextMatch = () => {
    if (previewMatches.length === 0) return;
    const nextIdx = (currentMatchIndex + 1) % previewMatches.length;
    setCurrentMatchIndex(nextIdx);
    handleLocateItem(previewMatches[nextIdx].id);
  };

  useEffect(() => {
    setCurrentMatchIndex(0);
  }, [selectedBuilding, selectedFloor, previewTypeFilter, previewSerialFilter]);

  const handleCellEdit = (id: string, field: keyof CadDataRow, val: any) => {
    setTableData(prev => prev.map(row => row.id === id ? { ...row, [field]: val } : row));
  };

  // 手动添加逻辑
  const handleMouseDown = (e: React.MouseEvent<HTMLDivElement>) => {
    if (!isManualAddMode || isManualAddModalOpen || (selectionStart && selectionEnd && !isDrawing)) return;
    
    const rect = e.currentTarget.getBoundingClientRect();
    const x = ((e.clientX - rect.left) / rect.width) * 100;
    const y = ((e.clientY - rect.top) / rect.height) * 100;
    
    setSelectionStart({ x, y });
    setSelectionEnd({ x, y });
    setIsDrawing(true);
  };

  const handleMouseMove = (e: React.MouseEvent<HTMLDivElement>) => {
    if (!isDrawing || !selectionStart) return;
    
    const rect = e.currentTarget.getBoundingClientRect();
    const x = ((e.clientX - rect.left) / rect.width) * 100;
    const y = ((e.clientY - rect.top) / rect.height) * 100;
    
    setSelectionEnd({ x, y });
  };

  const handleMouseUp = () => {
    if (isDrawing) {
      setIsDrawing(false);
    }
  };

  const cancelSelection = () => {
    setSelectionStart(null);
    setSelectionEnd(null);
    setIsDrawing(false);
  };

  const confirmSelection = () => {
    setManualAddData({
      building: selectedBuilding !== '全部' ? selectedBuilding : '16#',
      floor: selectedFloor !== '全部' ? selectedFloor : '1F',
      type: '',
      serial: ''
    });
    setIsManualAddModalOpen(true);
  };

  const handleSaveManualAdd = () => {
    if (!manualAddData.building || !manualAddData.floor || !manualAddData.type || !manualAddData.serial) {
      alert("请填写完整信息");
      return;
    }

    const newRow: CadDataRow = {
      id: Date.now().toString(),
      building: manualAddData.building,
      type: manualAddData.type,
      serial: manualAddData.serial,
      width: 0,
      height: 0,
      q1f: manualAddData.floor === '1F' ? 1 : 0,
      q2f: manualAddData.floor === '2F' ? 1 : 0,
      q3f: manualAddData.floor === '3F' ? 1 : 0,
      q4_17f: 0,
      q18f: 0,
      qMf: 0,
      coords: selectionStart && selectionEnd ? {
        x: (selectionStart.x + selectionEnd.x) / 2,
        y: (selectionStart.y + selectionEnd.y) / 2
      } : undefined
    };

    setTableData(prev => [...prev, newRow]);
    setIsManualAddModalOpen(false);
    setIsManualAddMode(false);
    cancelSelection();
  };

  const currentLocatingRow = tableData.find(r => r.id === locatingItemId);

  const renderExportPreviewModal = () => {
    if (!isExportPreviewOpen) return null;
    const exportSheets = ['门窗报价汇总表', '16#18#楼', '17#楼'];
    let sheetData = tableData;

    return (
      <div className="fixed inset-0 z-[150] flex items-center justify-center bg-black/60 backdrop-blur-md p-6 animate-in fade-in duration-200">
        <div className="bg-white rounded-[40px] shadow-2xl w-full max-w-7xl h-[85vh] flex flex-col animate-in zoom-in-95 duration-200 overflow-hidden border border-slate-200">
          <div className="px-8 py-6 border-b border-slate-100 flex items-center justify-between shrink-0 bg-white">
            <h3 className="text-xl font-black text-slate-800">导出预览 - {activeProject?.name}</h3>
            <div className="flex items-center space-x-4">
               <button onClick={() => setIsExportPreviewOpen(false)} className="px-6 py-2.5 rounded-2xl text-sm font-black text-slate-500 hover:bg-slate-50 transition-all">取消</button>
               <button onClick={() => { alert('正在生成 Excel 文件...'); setIsExportPreviewOpen(false); }} className="px-10 py-2.5 bg-emerald-600 text-white rounded-2xl text-sm font-black shadow-xl shadow-emerald-500/20 hover:bg-emerald-700 transition-all flex items-center space-x-2">
                 <Icon name="Download" size={16} />
                 <span>确认导出</span>
               </button>
            </div>
          </div>
          <div className="flex-1 overflow-auto bg-[#eef1f5] p-6 relative">
             <div className="bg-white mx-auto shadow-xl rounded-sm min-w-[1000px] border border-slate-300">
                <div className="p-8 text-center border-b border-slate-200">
                   <h2 className="text-2xl font-serif font-black text-slate-800 tracking-widest">{activeExportSheet}</h2>
                </div>
                <table className="w-full border-collapse">
                   <thead>
                      <tr className="bg-slate-50 text-[11px] font-black text-slate-600 text-center border-b border-slate-300">
                         <th className="px-3 py-4 border-r border-slate-200 w-12">序号</th>
                         <th className="px-3 py-4 border-r border-slate-200">楼栋号</th>
                         <th className="px-3 py-4 border-r border-slate-200">门窗类型</th>
                         <th className="px-3 py-4 border-r border-slate-100">门窗编号</th>
                         <th className="px-3 py-4 border-r border-slate-200 w-20">宽(MM)</th>
                         <th className="px-3 py-4 border-r border-slate-200 w-20">高(MM)</th>
                         <th className="px-3 py-4 border-r border-slate-200 w-24">合计数量(樘)</th>
                      </tr>
                   </thead>
                   <tbody className="divide-y divide-slate-200 text-center">
                      {sheetData.map((row, idx) => (
                        <tr key={row.id} className="text-[12px] text-slate-700">
                           <td className="px-3 py-3.5 border-r border-slate-100">{idx + 1}</td>
                           <td className="px-3 py-3.5 border-r border-slate-100 font-bold">{row.building}</td>
                           <td className="px-3 py-3.5 border-r border-slate-100">{row.type}</td>
                           <td className="px-3 py-3.5 border-r border-slate-100 font-mono text-blue-600 font-bold">{row.serial}</td>
                           <td className="px-3 py-3.5 border-r border-slate-100 text-right">{row.width}</td>
                           <td className="px-3 py-3.5 border-r border-slate-100 text-right">{row.height}</td>
                           <td className="px-3 py-3.5 border-r border-slate-100 font-black text-blue-600">{row.q1f + row.q2f + row.q3f + row.q4_17f + row.q18f + row.qMf}</td>
                        </tr>
                      ))}
                   </tbody>
                </table>
             </div>
          </div>
          <div className="px-6 py-2 bg-[#f8fafc] border-t border-slate-200 flex items-center space-x-0.5 shrink-0">
             {exportSheets.map(s => (
                <button key={s} onClick={() => setActiveExportSheet(s)} className={`px-6 py-2 text-[11px] font-black border-t-2 ${activeExportSheet === s ? 'bg-white border-blue-500 text-blue-600' : 'bg-slate-100 border-transparent text-slate-400 hover:bg-slate-50 transition-all'}`}>
                  {s}
                </button>
             ))}
          </div>
        </div>
      </div>
    );
  };

  return (
    <div className="flex flex-1 h-full bg-[#f8fafc] overflow-hidden">
      <div className={`${isSidebarCollapsed ? 'w-16' : 'w-64'} bg-white border-r border-slate-200 flex flex-col shrink-0 transition-all duration-300`}>
        <div className="p-5 border-b border-slate-50 flex items-center justify-between bg-slate-50/50 shrink-0">
          {!isSidebarCollapsed && <h2 className="text-xs font-black text-slate-400 uppercase tracking-widest">历史任务</h2>}
          <div className="flex items-center space-x-2">
            <button onClick={() => setIsSidebarCollapsed(!isSidebarCollapsed)} className="p-1.5 text-slate-400 hover:text-blue-600 rounded-lg transition-colors">
              <Icon name={isSidebarCollapsed ? "PanelLeftOpen" : "PanelLeftClose"} size={16} />
            </button>
            {!isSidebarCollapsed && (
              <button onClick={() => setIsNewProjectModalOpen(true)} className="w-7 h-7 bg-blue-600 text-white rounded-lg flex items-center justify-center hover:bg-blue-700 shadow-md shadow-blue-500/20 transition-all">
                <Icon name="Plus" size={14} strokeWidth={3} />
              </button>
            )}
          </div>
        </div>
        <div className="flex-1 overflow-y-auto p-3 space-y-2 custom-scrollbar">
          {projects.map(p => (
            <div key={p.id} onClick={() => { setActiveProjectId(p.id); setIsRecognized(false); setLocatingItemId(null); }} className={`p-3 rounded-xl border cursor-pointer transition-all ${activeProjectId === p.id ? 'bg-blue-50 border-blue-200 ring-1 ring-blue-100' : 'bg-white border-slate-100 hover:border-blue-200'}`}>
              {!isSidebarCollapsed ? (
                <>
                  <p className={`text-sm font-bold truncate mb-1 ${activeProjectId === p.id ? 'text-blue-700' : 'text-slate-700'}`}>{p.name}</p>
                  <div className="flex items-center text-[10px] text-slate-400 font-medium whitespace-nowrap"><Icon name="Calendar" size={10} className="mr-1" />{p.createTime}</div>
                </>
              ) : <div className="flex justify-center text-blue-600"><Icon name="Folder" size={20} /></div>}
            </div>
          ))}
        </div>
      </div>

      <div className="flex-1 flex flex-col overflow-hidden relative">
        {!activeProjectId ? (
          <div className="flex-1 flex flex-col items-center justify-center p-10">
            <div className="w-24 h-24 bg-blue-50 rounded-[40px] flex items-center justify-center text-blue-500 mb-8 animate-in zoom-in-95 duration-500 shadow-inner">
               <Icon name="Layers" size={48} strokeWidth={1} />
            </div>
            <h2 className="text-2xl font-black text-slate-800 mb-3">门窗智能识别</h2>
            <button onClick={() => setIsNewProjectModalOpen(true)} className="bg-blue-600 text-white px-10 py-3.5 rounded-[20px] font-black text-sm shadow-xl shadow-blue-500/20 hover:scale-105 active:scale-95 transition-all">上传图纸开始任务</button>
          </div>
        ) : (
          <>
            <div className="bg-white border-b border-slate-200 px-8 py-4 flex items-center justify-between shrink-0">
               <div className="flex items-center space-x-4">
                 <h1 className="text-lg font-black text-slate-800">{activeProject?.name}</h1>
                 <div className="flex items-center space-x-2">
                   <span className="bg-slate-100 text-slate-500 px-3 py-1 rounded-full text-[10px] font-black">{activeProject?.files.length} 个文件</span>
                   {activeProject && activeProject.files.length > 0 && (
                      <div className="relative group/fileselect">
                        <select 
                          value={currentPreviewFile}
                          onChange={(e) => setCurrentPreviewFile(e.target.value)}
                          className="bg-white border border-slate-200 rounded-xl py-1.5 pl-3 pr-8 text-[11px] font-bold text-slate-600 outline-none appearance-none cursor-pointer focus:border-blue-400 transition-all shadow-sm"
                        >
                          {activeProject.files.map(f => <option key={f} value={f}>{f}</option>)}
                        </select>
                        <Icon name="ChevronDown" size={12} className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none group-focus-within/fileselect:text-blue-500 transition-colors" />
                      </div>
                   )}
                 </div>
               </div>
               {!isRecognized && (
                 <button onClick={startRecognition} disabled={isRecognizing || (activeProject?.files.length === 0)} className="bg-slate-900 text-white px-8 py-2.5 rounded-2xl font-black text-sm shadow-xl transition-all disabled:opacity-50 active:scale-95">
                   {isRecognizing ? <Icon name="Loader2" size={16} className="animate-spin mr-2 inline" /> : <Icon name="ScanLine" size={18} className="mr-2 inline" />}
                   开始 AI 智能识别
                 </button>
               )}
            </div>

            {isRecognized ? (
              <div className="flex-1 flex overflow-hidden p-1.5 space-x-1.5 animate-in fade-in slide-in-from-bottom-2 duration-500">
                {/* 预览区 (7/10 比例) */}
                <div 
                  className={`transition-all duration-500 bg-[#0d0d0d] rounded-xl border border-slate-800 shadow-2xl relative overflow-hidden flex flex-col shrink-0 ${
                    fullscreenMode === 'preview' 
                      ? 'fixed inset-0 z-[100] m-0 rounded-none' 
                      : 'flex-[0.7]'
                  }`}
                >
                  <div className="flex items-center justify-between p-3 shrink-0 bg-black/60 backdrop-blur-xl z-20 border-b border-white/5">
                     <div className="flex items-center space-x-4">
                        <span className="text-[10px] font-black text-slate-500 uppercase tracking-widest whitespace-nowrap">图纸预览</span>
                        <div className="flex items-center space-x-2">
                           <div className="relative group/select">
                              <select 
                                value={selectedBuilding} 
                                onChange={(e) => setSelectedBuilding(e.target.value)} 
                                className="bg-slate-900 border border-slate-700 rounded-xl py-1 pl-3 pr-8 text-[10px] font-black text-white outline-none appearance-none cursor-pointer focus:border-blue-500 transition-all min-w-[70px]"
                              >
                                {['全部', '16#', '17#', '18#'].map(b => <option key={b} value={b}>{b === '全部' ? '全部楼栋' : b}</option>)}
                              </select>
                              <Icon name="ChevronDown" size={12} className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-500 pointer-events-none group-focus-within/select:text-blue-500 transition-colors" />
                           </div>
                           <div className="relative group/select">
                              <select 
                                value={selectedFloor} 
                                onChange={(e) => setSelectedFloor(e.target.value)} 
                                className="bg-slate-900 border border-slate-700 rounded-xl py-1 pl-3 pr-8 text-[10px] font-black text-white outline-none appearance-none cursor-pointer focus:border-blue-500 transition-all min-w-[70px]"
                              >
                                {['全部', '1F', '2F', '3F'].map(f => <option key={f} value={f}>{f === '全部' ? '全部楼层' : f}</option>)}
                              </select>
                              <Icon name="ChevronDown" size={12} className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-500 pointer-events-none group-focus-within/select:text-blue-500 transition-colors" />
                           </div>
                           
                           <div className="w-px h-4 bg-slate-700 mx-1"></div>

                           {/* 门窗类型筛选 */}
                           <div className="relative group/select">
                              <select 
                                value={previewTypeFilter} 
                                onChange={(e) => {
                                  setPreviewTypeFilter(e.target.value);
                                  setPreviewSerialFilter('全部');
                                }} 
                                className="bg-slate-900 border border-slate-700 rounded-xl py-1 pl-3 pr-8 text-[10px] font-black text-white outline-none appearance-none cursor-pointer focus:border-blue-500 transition-all min-w-[90px]"
                              >
                                {uniqueTypes.map(t => <option key={t} value={t}>{t === '全部' ? '全部类型' : t}</option>)}
                              </select>
                              <Icon name="ChevronDown" size={12} className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-500 pointer-events-none group-focus-within/select:text-blue-500 transition-colors" />
                           </div>

                           {/* 门窗编号筛选 */}
                           <div className="relative group/select">
                              <select 
                                value={previewSerialFilter} 
                                onChange={(e) => setPreviewSerialFilter(e.target.value)} 
                                className="bg-slate-900 border border-slate-700 rounded-xl py-1 pl-3 pr-8 text-[10px] font-black text-white outline-none appearance-none cursor-pointer focus:border-blue-500 transition-all min-w-[90px]"
                              >
                                {availablePreviewSerials.map(s => <option key={s} value={s}>{s === '全部' ? '全部编号' : s}</option>)}
                              </select>
                              <Icon name="ChevronDown" size={12} className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-500 pointer-events-none group-focus-within/select:text-blue-500 transition-colors" />
                           </div>

                           {/* 结果数与定位 */}
                           <div className="flex items-center bg-blue-600/20 border border-blue-500/30 rounded-xl px-2 py-1 space-x-2 animate-in fade-in zoom-in-95 duration-300">
                             <span className="text-[10px] font-black text-blue-400">结果: {previewMatches.length}</span>
                             {previewMatches.length > 0 && (
                             <div className="flex items-center space-x-1 text-[10px] font-black text-white">
                               <button 
                                 onClick={locateNextMatch}
                                 className="flex items-center space-x-1 hover:text-blue-300 transition-colors"
                               >
                                 <Icon name="LocateFixed" size={10} />
                                 <span>定位</span>
                               </button>
                               {previewMatches.length > 0 && (
                                 <div className="flex items-center text-slate-500 bg-black/20 rounded-lg px-1 ml-1 border border-white/5">
                                   <button 
                                     onClick={(e) => {
                                       e.stopPropagation();
                                       const prevIdx = (currentMatchIndex - 1 + previewMatches.length) % previewMatches.length;
                                       setCurrentMatchIndex(prevIdx);
                                       handleLocateItem(previewMatches[prevIdx].id);
                                     }}
                                     className="p-0.5 hover:text-blue-400 transition-colors"
                                   >
                                     <Icon name="ChevronLeft" size={10} />
                                   </button>
                                   <input 
                                     type="text"
                                     value={currentMatchIndex + 1}
                                     onChange={(e) => {
                                       const val = parseInt(e.target.value);
                                       if (!isNaN(val)) {
                                         const safeVal = Math.max(1, Math.min(val, previewMatches.length));
                                         setCurrentMatchIndex(safeVal - 1);
                                         handleLocateItem(previewMatches[safeVal - 1].id);
                                       }
                                     }}
                                     className="w-4 bg-transparent border-none text-center focus:ring-0 p-0 text-blue-400 font-black text-[9px]"
                                   />
                                   <span className="text-[9px] opacity-40">/</span>
                                   <span className="text-[9px] px-0.5 opacity-60">{previewMatches.length}</span>
                                   <button 
                                     onClick={(e) => {
                                       e.stopPropagation();
                                       const nextIdx = (currentMatchIndex + 1) % previewMatches.length;
                                       setCurrentMatchIndex(nextIdx);
                                       handleLocateItem(previewMatches[nextIdx].id);
                                     }}
                                     className="p-0.5 hover:text-blue-400 transition-colors"
                                   >
                                     <Icon name="ChevronRight" size={10} />
                                   </button>
                                 </div>
                               )}
                             </div>
                             )}
                           </div>
                        </div>
                     </div>
                      <div className="flex items-center space-x-2">
                        <button 
                          onClick={() => setFullscreenMode(fullscreenMode === 'preview' ? 'none' : 'preview')}
                          className="p-1.5 text-slate-400 hover:text-white transition-colors"
                          title={fullscreenMode === 'preview' ? "退出全屏" : "全屏查看图纸"}
                        >
                          <Icon name={fullscreenMode === 'preview' ? "Minimize2" : "Maximize2"} size={16} />
                        </button>
                      </div>
                  </div>
                  <div 
                    className={`flex-1 relative overflow-hidden flex items-center justify-center p-2 ${isManualAddMode ? 'cursor-crosshair' : ''}`}
                    onMouseDown={handleMouseDown}
                    onMouseMove={handleMouseMove}
                    onMouseUp={handleMouseUp}
                  >
                    <img 
                      src="https://img.js.design/assets/static/f5869e594d216d97e7488031d2797e59?x-oss-process=image/resize,w_1500/format,webp" 
                      className={`max-w-full max-h-full transition-all duration-700 ease-out select-none pointer-events-none ${
                        fullscreenMode === 'preview' ? 'scale-[1.15] object-contain w-full h-full' : 'object-contain scale-100'
                      } ${locatingItemId ? 'scale-110 blur-[1px] opacity-40' : 'opacity-80'}`} 
                      alt="CAD" 
                    />
                    
                    {/* 框选区域渲染 */}
                    {selectionStart && selectionEnd && (
                      <div 
                        className="absolute border-2 border-blue-500 bg-blue-500/10 z-30 pointer-events-none"
                        style={{
                          left: `${Math.min(selectionStart.x, selectionEnd.x)}%`,
                          top: `${Math.min(selectionStart.y, selectionEnd.y)}%`,
                          width: `${Math.abs(selectionStart.x - selectionEnd.x)}%`,
                          height: `${Math.abs(selectionStart.y - selectionEnd.y)}%`
                        }}
                      >
                        {!isDrawing && (
                          <div className="absolute -right-2 -bottom-12 flex items-center space-x-2 pointer-events-auto">
                            <button 
                              onClick={(e) => { e.stopPropagation(); confirmSelection(); }}
                              className="w-8 h-8 bg-emerald-500 text-white rounded-full flex items-center justify-center shadow-lg hover:bg-emerald-600 transition-all active:scale-90"
                            >
                              <Icon name="Check" size={18} />
                            </button>
                            <button 
                              onClick={(e) => { e.stopPropagation(); cancelSelection(); }}
                              className="w-8 h-8 bg-rose-500 text-white rounded-full flex items-center justify-center shadow-lg hover:bg-rose-600 transition-all active:scale-90"
                            >
                              <Icon name="X" size={18} />
                            </button>
                          </div>
                        )}
                      </div>
                    )}

                    {locatingItemId && currentLocatingRow?.coords && (
                        <div className="absolute w-40 h-40 border-[4px] border-emerald-500 rounded-3xl shadow-[0_0_80px_rgba(16,185,129,0.6)] animate-in zoom-in-50 duration-300 flex items-center justify-center pointer-events-none" style={{ left: `${currentLocatingRow.coords.x}%`, top: `${currentLocatingRow.coords.y}%`, transform: 'translate(-50%, -50%)' }}>
                            <div className="bg-emerald-50 text-emerald-700 px-3 py-1 rounded-full text-[10px] font-black absolute -top-10 shadow-lg whitespace-nowrap">正在聚焦: {currentLocatingRow.serial}</div>
                            <div className="w-10 h-10 border-2 border-emerald-400 rounded-full animate-ping opacity-75"></div>
                        </div>
                    )}

                    {/* 手动添加按钮 - 居中底部 */}
                    <div className="absolute bottom-6 left-1/2 -translate-x-1/2 z-40">
                      <button 
                        onClick={() => {
                          setIsManualAddMode(!isManualAddMode);
                          cancelSelection();
                        }}
                        className={`flex items-center space-x-2 px-6 py-2.5 rounded-2xl text-xs font-black transition-all active:scale-95 shadow-2xl backdrop-blur-md ${
                          isManualAddMode 
                            ? 'bg-rose-600 text-white ring-4 ring-rose-500/20' 
                            : 'bg-white/10 text-white border border-white/20 hover:bg-white/20'
                        }`}
                      >
                        <Icon name={isManualAddMode ? "MousePointer2" : "BoxSelect"} size={16} />
                        <span>{isManualAddMode ? '退出框选模式' : '手动添加门窗'}</span>
                      </button>
                    </div>
                  </div>
                </div>

                {/* 数据表格区 (3/10 比例) */}
                <div className={`transition-all duration-500 bg-white rounded-xl border border-slate-200 shadow-sm flex flex-col overflow-hidden min-h-0 ${fullscreenMode === 'table' ? 'fixed inset-0 z-[100] m-0 rounded-none' : 'flex-[0.3]'}`}>
                   <div className="p-3 border-b border-slate-100 flex items-center justify-between bg-slate-50/50 shrink-0 text-slate-800">
                      <div className="flex items-center space-x-2">
                        <select value={filters.building} onChange={(e) => setFilters({...filters, building: e.target.value})} className="bg-white border border-slate-200 rounded-lg text-[10px] font-bold text-slate-700 px-2 py-1 focus:border-blue-400 outline-none shadow-sm">
                            <option value="全部">全部楼栋</option>
                            <option value="16#">16#</option>
                            <option value="17#">17#</option>
                            <option value="18#">18#</option>
                        </select>
                        <select value={filters.type} onChange={(e) => setFilters({...filters, type: e.target.value})} className="bg-white border border-slate-200 rounded-lg text-[10px] font-bold text-slate-700 px-2 py-1 focus:border-blue-400 outline-none shadow-sm">
                            {uniqueTypes.map(t => <option key={t} value={t}>{t}</option>)}
                        </select>
                      </div>
                      <div className="flex items-center space-x-1.5 shrink-0">
                        <button 
                          onClick={() => setIsExportPreviewOpen(true)} 
                          className="px-2.5 py-1.5 bg-emerald-600 text-white rounded-lg text-[10px] font-black hover:bg-emerald-700 shadow-sm transition-all active:scale-95 whitespace-nowrap min-w-[60px]"
                        >
                          导出清单
                        </button>
                        <button 
                          onClick={() => setFullscreenMode(fullscreenMode === 'table' ? 'none' : 'table')}
                          className="p-1.5 text-slate-400 hover:text-blue-600 transition-all outline-none"
                          title={fullscreenMode === 'table' ? "退出全屏" : "全屏查看表格"}
                        >
                          <Icon name={fullscreenMode === 'table' ? "Minimize2" : "Maximize2"} size={16} />
                        </button>
                      </div>
                   </div>
                   {/* 支持左右滑动查看 */}
                   <div className="flex-1 overflow-auto custom-scrollbar">
                      <table className="w-full border-separate border-spacing-0 min-w-[800px]">
                        <thead className="sticky top-0 z-30">
                          <tr className="text-[11px] font-bold text-slate-500 text-center bg-white">
                            <th rowSpan={2} className="px-4 py-3 border-b border-r border-slate-200 bg-white sticky left-0 z-40">类型</th>
                            <th rowSpan={2} className="px-4 py-3 border-b border-r border-slate-200 bg-white">编号</th>
                            <th rowSpan={2} className="px-4 py-3 border-b border-r border-slate-200 bg-white">宽(MM)</th>
                            <th rowSpan={2} className="px-4 py-3 border-b border-r border-slate-200 bg-white">高(MM)</th>
                            <th colSpan={6} className="px-4 py-2 border-b border-r border-slate-200 bg-blue-50/40 text-blue-700">数量 (樘)</th>
                            <th rowSpan={2} className="px-3 py-3 border-b border-slate-200 bg-blue-50/80 text-blue-800 font-black">合</th>
                          </tr>
                          <tr className="text-[10px] font-bold text-slate-400 bg-white text-center">
                            <th className="px-2 py-2 border-b border-r border-slate-100">1F</th>
                            <th className="px-2 py-2 border-b border-r border-slate-100">2F</th>
                            <th className="px-2 py-2 border-b border-r border-slate-100">3F</th>
                            <th className="px-2 py-2 border-b border-r border-slate-100">4-17F</th>
                            <th className="px-2 py-2 border-b border-r border-slate-100">18F</th>
                            <th className="px-2 py-2 border-b border-r border-slate-200">机房层</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-100">
                          {filteredData.map(row => {
                            const total = row.q1f + row.q2f + row.q3f + row.q4_17f + row.q18f + row.qMf;
                            return (
                              <tr key={row.id} className={`hover:bg-blue-50/30 transition-all ${locatingItemId === row.id ? 'bg-emerald-50/50 ring-2 ring-inset ring-emerald-300' : 'bg-white'}`}>
                                <td className="px-4 py-2 text-center border-r border-slate-100 sticky left-0 z-10 bg-inherit font-medium text-slate-700">
                                  <div 
                                    className="w-full bg-transparent border-none focus:ring-1 focus:ring-blue-400 rounded px-1 py-1 outline-none text-xs text-center transition-all" 
                                  >
                                    {row.type}
                                  </div>
                                </td>
                                <td className="px-4 py-2 border-r border-slate-100">
                                  <div className="flex items-center justify-center group/cell">
                                    <div 
                                      className="w-full bg-transparent border-none focus:ring-1 focus:ring-blue-400 rounded px-1 py-1 outline-none font-mono text-[10px] text-blue-600 font-bold transition-all text-center" 
                                    >
                                      {row.serial}
                                    </div>
                                  </div>
                                </td>
                                <td className="px-2 py-2 text-center border-r border-slate-100">
                                  <input 
                                    type="number" 
                                    value={row.width} 
                                    onChange={(e) => handleCellEdit(row.id, 'width', parseInt(e.target.value) || 0)} 
                                    className="w-full bg-transparent border-none focus:ring-1 focus:ring-blue-400 rounded px-1 py-1 outline-none text-center text-[11px] font-medium text-slate-600 transition-all" 
                                  />
                                </td>
                                <td className="px-2 py-2 text-center border-r border-slate-100">
                                  <input 
                                    type="number" 
                                    value={row.height} 
                                    onChange={(e) => handleCellEdit(row.id, 'height', parseInt(e.target.value) || 0)} 
                                    className="w-full bg-transparent border-none focus:ring-1 focus:ring-blue-400 rounded px-1 py-1 outline-none text-center text-[11px] font-medium text-slate-600 transition-all" 
                                  />
                                </td>
                                <td className="px-1 py-2 text-center border-r border-slate-50 bg-blue-50/5"><div className="w-full bg-transparent border-none focus:ring-1 focus:ring-blue-400 text-center text-[11px] text-slate-600 outline-none">{row.q1f}</div></td>
                                <td className="px-1 py-2 text-center border-r border-slate-50 bg-blue-50/5"><div className="w-full bg-transparent border-none focus:ring-1 focus:ring-blue-400 text-center text-[11px] text-slate-600 outline-none">{row.q2f}</div></td>
                                <td className="px-1 py-2 text-center border-r border-slate-50 bg-blue-50/5"><div className="w-full bg-transparent border-none focus:ring-1 focus:ring-blue-400 text-center text-[11px] text-slate-600 outline-none">{row.q3f}</div></td>
                                <td className="px-1 py-2 text-center border-r border-slate-50 bg-blue-50/5"><div className="w-full bg-transparent border-none focus:ring-1 focus:ring-blue-400 text-center text-[11px] text-slate-600 outline-none">{row.q4_17f}</div></td>
                                <td className="px-1 py-2 text-center border-r border-slate-50 bg-blue-50/5"><div className="w-full bg-transparent border-none focus:ring-1 focus:ring-blue-400 text-center text-[11px] text-slate-600 outline-none">{row.q18f}</div></td>
                                <td className="px-1 py-2 text-center border-r border-slate-200 bg-blue-50/5"><div className="w-full bg-transparent border-none focus:ring-1 focus:ring-blue-400 text-center text-[11px] text-slate-600 outline-none">{row.qMf}</div></td>
                                <td className="px-3 py-2 text-center font-black text-blue-600 text-xs bg-blue-100/30">{total}</td>
                              </tr>
                            );
                          })}
                        </tbody>
                      </table>
                   </div>
                </div>
              </div>
            ) : (
              <div className="flex-1 overflow-y-auto p-10 bg-slate-50">
                <div className="max-w-4xl mx-auto bg-white rounded-[32px] p-8 border border-slate-100 shadow-sm animate-in slide-in-from-bottom-4 duration-500">
                   <div className="flex items-center space-x-3 mb-6"><div className="w-1.5 h-6 bg-blue-600 rounded-full"></div><h2 className="text-xl font-black text-slate-800">上传 DWG 图纸</h2></div>
                   <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                      {activeProject?.files.map((f, i) => (
                        <div key={i} className={`bg-white border rounded-2xl p-4 flex items-center space-x-4 cursor-pointer hover:border-blue-200 hover:shadow-lg transition-all group ${filters.building === f ? 'border-blue-500 bg-blue-50/10' : 'border-slate-100'}`} onClick={() => setFilters({...filters, building: f})}>
                           <div className={`w-12 h-12 rounded-xl flex items-center justify-center shrink-0 transition-all ${filters.building === f ? 'bg-blue-600 text-white' : 'bg-blue-50 text-blue-500 group-hover:bg-blue-600 group-hover:text-white'}`}><Icon name="FileCode" size={24} /></div>
                           <p className={`text-sm font-bold truncate ${filters.building === f ? 'text-blue-700' : 'text-slate-700'}`}>{f}</p>
                        </div>
                      ))}
                      <div onClick={() => setIsAppendFilesModalOpen(true)} className="border-2 border-dashed border-slate-200 rounded-2xl p-4 flex flex-col items-center justify-center text-slate-400 hover:border-blue-400 hover:bg-white transition-all cursor-pointer group">
                         <Icon name="Plus" size={24} className="mb-1 group-hover:scale-110 transition-transform" />
                         <span className="text-xs font-bold">追加图纸</span>
                      </div>
                   </div>
                </div>
              </div>
            )}
          </>
        )}
      </div>

      {renderExportPreviewModal()}

      {isNewProjectModalOpen && (
        <div className="fixed inset-0 z-[200] flex items-center justify-center bg-black/50 backdrop-blur-sm p-4 animate-in fade-in duration-200">
          <div className="bg-white rounded-[32px] shadow-2xl w-full max-w-lg overflow-hidden flex flex-col animate-in zoom-in-95 border border-slate-200">
            <div className="px-8 py-6 border-b border-slate-100 flex items-center justify-between shrink-0 bg-white">
               <h3 className="text-xl font-black text-slate-800 tracking-tight text-left">新建提取任务</h3>
               <button onClick={() => setIsNewProjectModalOpen(false)} className="text-slate-300 hover:text-rose-500 transition-colors outline-none">
                 <Icon name="X" size={24} />
               </button>
            </div>
            <div className="p-8 space-y-6 text-left flex-1 overflow-y-auto custom-scrollbar">
              <div className="space-y-2">
                <label className="text-xs font-black text-slate-500 uppercase tracking-widest ml-1">任务名称</label>
                <input 
                  type="text" 
                  value={newProjName} 
                  onChange={(e) => setNewProjName(e.target.value)} 
                  placeholder="请输入项目或标段名称" 
                  className="w-full h-12 bg-white border border-slate-200 rounded-[18px] px-5 text-sm font-bold text-slate-700 outline-none focus:border-blue-400 transition-all" 
                />
              </div>
              <div className="space-y-3">
                <label className="text-xs font-black text-slate-500 uppercase tracking-widest ml-1">导入图纸 ({tempFiles.length})</label>
                <div 
                  onClick={() => setTempFiles([...tempFiles, `图纸_${tempFiles.length + 1}.dwg`])} 
                  className="w-full border-2 border-dashed border-slate-200 rounded-[24px] py-10 flex flex-col items-center justify-center space-y-3 hover:bg-blue-50 hover:border-blue-400 transition-all cursor-pointer group shadow-sm"
                >
                   <div className="w-14 h-14 bg-slate-100 rounded-full flex items-center justify-center text-slate-400 group-hover:bg-blue-600 group-hover:text-white transition-all shadow-inner">
                      <Icon name="UploadCloud" size={28} />
                   </div>
                   <div className="text-center">
                      <p className="text-sm font-black text-slate-500 group-hover:text-blue-600 transition-colors">点击上传 CAD 文件</p>
                      <p className="text-[10px] text-slate-300 font-bold mt-1">支持 DWG, DXF, PDF 格式</p>
                   </div>
                </div>

                {tempFiles.length > 0 && (
                  <div className="space-y-2 max-h-40 overflow-y-auto custom-scrollbar pr-1 mt-4">
                    {tempFiles.map((fileName, index) => (
                      <div key={index} className="flex items-center justify-between bg-slate-50 p-3 rounded-xl border border-slate-100 group animate-in slide-in-from-top-1">
                        <div className="flex items-center space-x-3 overflow-hidden">
                          <Icon name="FileCode" size={16} className="text-blue-500 shrink-0" />
                          <span className="text-xs font-bold text-slate-600 truncate">{fileName}</span>
                        </div>
                        <button 
                          onClick={() => setTempFiles(prev => prev.filter((_, i) => i !== index))}
                          className="p-1.5 text-slate-300 hover:text-rose-500 hover:bg-rose-50 rounded-lg transition-all"
                        >
                          <Icon name="Trash2" size={14} />
                        </button>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
            <div className="px-8 py-6 border-t border-slate-100 bg-slate-50/50 flex items-center justify-end space-x-3 shrink-0">
               <button onClick={() => setIsNewProjectModalOpen(false)} className="px-8 py-2.5 bg-white border border-slate-200 text-slate-600 rounded-xl text-sm font-bold hover:bg-slate-100 transition-all outline-none">取消</button>
               <button onClick={handleConfirmNewProject} className="px-10 py-2.5 bg-blue-600 text-white rounded-xl text-sm font-black shadow-lg hover:bg-blue-700 transition-all active:scale-95 outline-none">确定开启任务</button>
            </div>
          </div>
        </div>
      )}

      {isAppendFilesModalOpen && (
        <div className="fixed inset-0 z-[200] flex items-center justify-center bg-black/50 backdrop-blur-sm p-4 animate-in fade-in duration-200">
          <div className="bg-white rounded-[32px] shadow-2xl w-full max-w-lg overflow-hidden flex flex-col animate-in zoom-in-95 border border-slate-200">
            <div className="px-8 py-6 border-b border-slate-100 flex items-center justify-between shrink-0 bg-white">
               <h3 className="text-xl font-black text-slate-800 tracking-tight text-left">追加图纸</h3>
               <button onClick={() => setIsAppendFilesModalOpen(false)} className="text-slate-300 hover:text-rose-500 transition-colors outline-none">
                 <Icon name="X" size={24} />
               </button>
            </div>
            <div className="p-8 space-y-6 text-left flex-1 overflow-y-auto custom-scrollbar">
               <div 
                  onClick={() => setTempFiles([...tempFiles, `追加图纸_${tempFiles.length + 1}.dwg`])} 
                  className="w-full border-2 border-dashed border-slate-200 rounded-[24px] py-12 flex flex-col items-center justify-center space-y-4 hover:bg-emerald-50 hover:border-emerald-400 transition-all cursor-pointer group shadow-sm"
                >
                   <div className="w-16 h-16 bg-slate-100 rounded-full flex items-center justify-center text-slate-400 group-hover:bg-emerald-600 group-hover:text-white transition-all shadow-inner">
                      <Icon name="UploadCloud" size={32} />
                   </div>
                   <div className="text-center">
                      <p className="text-base font-black text-slate-500 group-hover:text-emerald-600 transition-colors">点击上传图纸文件 ({tempFiles.length})</p>
                      <p className="text-xs text-slate-300 font-bold mt-1">支持多选文件导入</p>
                   </div>
                </div>

                {tempFiles.length > 0 && (
                  <div className="space-y-2 max-h-40 overflow-y-auto custom-scrollbar pr-1 mt-2">
                    {tempFiles.map((fileName, index) => (
                      <div key={index} className="flex items-center justify-between bg-emerald-50/30 p-3 rounded-xl border border-emerald-100 group animate-in slide-in-from-top-1">
                        <div className="flex items-center space-x-3 overflow-hidden">
                          <Icon name="FileCode" size={16} className="text-emerald-600 shrink-0" />
                          <span className="text-xs font-bold text-slate-600 truncate">{fileName}</span>
                        </div>
                        <button 
                          onClick={() => setTempFiles(prev => prev.filter((_, i) => i !== index))}
                          className="p-1.5 text-slate-300 hover:text-rose-500 hover:bg-rose-50 rounded-lg transition-all"
                        >
                          <Icon name="Trash2" size={14} />
                        </button>
                      </div>
                    ))}
                  </div>
                )}
            </div>
            <div className="px-8 py-6 border-t border-slate-100 bg-slate-50/50 flex items-center justify-end space-x-3 shrink-0">
               <button onClick={() => setIsAppendFilesModalOpen(false)} className="px-8 py-2.5 bg-white border border-slate-200 text-slate-600 rounded-xl text-sm font-bold hover:bg-slate-100 transition-all outline-none">取消</button>
               <button onClick={handleConfirmAppendFiles} className="px-10 py-2.5 bg-emerald-600 text-white rounded-xl text-sm font-black shadow-lg hover:bg-emerald-700 transition-all active:scale-95 outline-none">确认追加</button>
            </div>
          </div>
        </div>
      )}
      {isManualAddModalOpen && (
        <div className="fixed inset-0 z-[300] flex items-center justify-center bg-black/60 backdrop-blur-md p-4 animate-in fade-in duration-200">
          <div className="bg-white rounded-[32px] shadow-2xl w-full max-w-md h-[600px] overflow-hidden flex flex-col animate-in zoom-in-95 border border-slate-200">
            <div className="px-8 py-6 border-b border-slate-100 flex items-center justify-between shrink-0 bg-white">
               <h3 className="text-xl font-black text-slate-800 tracking-tight">新增门窗信息</h3>
               <button onClick={() => setIsManualAddModalOpen(false)} className="text-slate-300 hover:text-rose-500 transition-colors outline-none">
                 <Icon name="X" size={24} />
               </button>
            </div>
            <div className="p-8 space-y-5 text-left flex-1 overflow-y-auto custom-scrollbar relative">
              {activeDropdown && (
                <div className="fixed inset-0 z-[340]" onClick={() => setActiveDropdown(null)} />
              )}
              {[
                { label: '所属楼栋', key: 'building', options: ['16#', '17#', '18#'] },
                { label: '所属楼层', key: 'floor', options: ['1F', '2F', '3F', '4-17F', '18F', '机房层'] },
                { label: '门窗类型', key: 'type', options: ['平开窗', '推拉门', '普通窗', '百叶窗'] },
                { label: '门窗编号', key: 'serial', options: ['PC06’ 13’', 'TLM2124', 'C1515', 'BY0606'] }
              ].map((field, index, array) => (
                <div key={field.key} className="space-y-2 relative">
                  <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">{field.label}</label>
                  <div className="relative group">
                    <input 
                      value={manualAddData[field.key as keyof typeof manualAddData]}
                      onChange={(e) => setManualAddData({ ...manualAddData, [field.key]: e.target.value })}
                      onFocus={() => setActiveDropdown(field.key)}
                      placeholder={`请选择或输入${field.label}`}
                      className="w-full h-11 bg-white border border-slate-200 rounded-xl px-4 pr-10 text-sm font-bold text-slate-700 outline-none focus:border-blue-400 transition-all"
                    />
                    <div 
                      className="absolute right-0 inset-y-0 w-10 flex items-center justify-center cursor-pointer text-slate-400 group-focus-within:text-blue-500"
                      onClick={(e) => {
                        e.stopPropagation();
                        setActiveDropdown(activeDropdown === field.key ? null : field.key);
                      }}
                    >
                      <Icon name="ChevronDown" size={16} />
                    </div>
                    
                    {activeDropdown === field.key && (
                      <div className={`absolute ${index >= array.length - 2 ? 'bottom-full mb-1' : 'top-full mt-1'} left-0 right-0 bg-white border border-slate-200 rounded-xl shadow-xl z-[350] overflow-hidden animate-in fade-in slide-in-from-top-1 duration-200`}>
                        <div className="max-h-40 overflow-y-auto custom-scrollbar py-1">
                          {field.options.map(opt => (
                            <div 
                              key={opt} 
                              onClick={(e) => {
                                e.stopPropagation();
                                setManualAddData({ ...manualAddData, [field.key]: opt });
                                setActiveDropdown(null);
                              }}
                              className="px-4 py-2.5 text-sm font-bold text-slate-600 hover:bg-blue-50 hover:text-blue-600 cursor-pointer transition-colors"
                            >
                              {opt}
                            </div>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              ))}
            </div>
            <div className="px-8 py-6 border-t border-slate-100 bg-slate-50/50 flex items-center justify-end space-x-3 shrink-0">
               <button onClick={() => setIsManualAddModalOpen(false)} className="px-8 py-2.5 bg-white border border-slate-200 text-slate-600 rounded-xl text-sm font-bold hover:bg-slate-100 transition-all outline-none">取消</button>
               <button onClick={handleSaveManualAdd} className="px-10 py-2.5 bg-blue-600 text-white rounded-xl text-sm font-black shadow-lg hover:bg-blue-700 transition-all active:scale-95 outline-none">确认添加</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default AICadTableExtractionView;
