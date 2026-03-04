import React, { useState, useMemo, useEffect, useRef } from 'react';
import Icon from './Icon';

type Step = 'upload' | 'mapping' | 'analyzing' | 'result';
type TabType = 'diff' | 'layer';
type DiffFilter = 'all' | 'add' | 'delete' | 'modify';

interface UploadedFile {
  id: string;
  name: string;
  size?: string;
}

interface CadLayer {
  id: string;
  name: string;
  visibleBase: boolean;
  visibleCompare: boolean;
  color: string;
}

interface DiffItem {
  id: string;
  category: '墙体' | '门窗' | '标注' | '梁柱';
  type: 'add' | 'delete' | 'modify';
  name: string;
  location: string;
  details: {
    property: string;
    oldVal: string;
    newVal: string;
  }[];
  status: 'pending' | 'checked';
  pos: { x: number; y: number };
}

interface DiffHistoryItem {
  id: string;
  baseName: string;
  compareName: string;
  createTime: string;
}

const MOCK_LAYERS: CadLayer[] = [
  { id: 'l1', name: 'WALL (墙体层)', visibleBase: true, visibleCompare: true, color: '#64748b' },
  { id: 'l2', name: 'DOOR_WINDOW (门窗层)', visibleBase: true, visibleCompare: true, color: '#0ea5e9' },
  { id: 'l3', name: 'AXIS (轴线层)', visibleBase: true, visibleCompare: true, color: '#ef4444' },
  { id: 'l4', name: 'TEXT (文字标注)', visibleBase: true, visibleCompare: true, color: '#f59e0b' },
  { id: 'l5', name: 'FURNITURE (家具装饰)', visibleBase: false, visibleCompare: false, color: '#10b981' },
  { id: 'l6', name: 'HATCH (填充层)', visibleBase: true, visibleCompare: true, color: '#94a3b8' },
];

const MOCK_DIFFS: DiffItem[] = [
  { 
    id: '1', category: '门窗', type: 'modify', name: 'C1521 塑钢窗', location: '1-5/A轴', 
    details: [
      { property: '宽度', oldVal: '1500mm', newVal: '1800mm' },
      { property: '高度', oldVal: '2100mm', newVal: '2100mm' }
    ],
    status: 'pending', pos: { x: 35, y: 42 }
  },
  { 
    id: '2', category: '墙体', type: 'add', name: '填充墙', location: '2-3/C轴', 
    details: [{ property: '长度', oldVal: '-', newVal: '3250mm' }],
    status: 'checked', pos: { x: 60, y: 30 }
  },
  { 
    id: '3', category: '梁柱', type: 'delete', name: 'KZ-5 框架柱', location: '4-B轴', 
    details: [{ property: '截面', oldVal: '600x600', newVal: '-' }],
    status: 'pending', pos: { x: 20, y: 65 }
  },
  { 
    id: '4', category: '标注', type: 'modify', name: '开间尺寸标注', location: '1-2轴', 
    details: [{ property: '数值', oldVal: '4200', newVal: '4500' }],
    status: 'pending', pos: { x: 45, y: 78 }
  }
];

const MOCK_HISTORY: DiffHistoryItem[] = [
  { id: 'h1', baseName: '1#楼主体结构施工图.dwg', compareName: '1#楼结构变更图_R1.dwg', createTime: '2024-05-22 14:20' },
  { id: 'h2', baseName: '地下室建筑图纸-初版.dwg', compareName: '地下室建筑图纸-修改稿.dwg', createTime: '2024-05-20 09:15' },
  { id: 'h3', baseName: '景观绿化施工图_v1.dwg', compareName: '景观绿化施工图_v2.dwg', createTime: '2024-05-18 16:45' },
];

interface AICadDiffViewProps {
  onBack?: () => void;
}

const AICadDiffView: React.FC<AICadDiffViewProps> = ({ onBack }) => {
  const [currentStep, setCurrentStep] = useState<Step>('upload');
  const [rightTab, setRightTab] = useState<TabType>('diff');
  const [activeTool, setActiveTool] = useState<string | null>(null);
  const [diffFilter, setDiffFilter] = useState<DiffFilter>('all');
  
  const [fileList, setFileList] = useState<UploadedFile[]>([]);
  const [baseFileId, setBaseFileId] = useState<string | null>(null);
  const [compareFileId, setCompareFileId] = useState<string | null>(null);

  const [activeDiffId, setActiveDiffId] = useState<string | null>(null);
  const [isLocating, setIsLocating] = useState(false); 
  const [layers, setLayers] = useState<CadLayer[]>(MOCK_LAYERS);
  const [diffs, setDiffs] = useState<DiffItem[]>(MOCK_DIFFS);
  const [isLayerLinked, setIsLayerLinked] = useState(true);
  const [layerSearch, setLayerSearch] = useState('');
  const [globalOpacity, setGlobalOpacity] = useState(100);
  const [isFileMenuOpen, setIsFileMenuOpen] = useState(false);
  const [isUploadModalOpen, setIsUploadModalOpen] = useState(false);
  
  const [pendingFiles, setPendingFiles] = useState<UploadedFile[]>([]);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [isDiffSidebarCollapsed, setIsDiffSidebarCollapsed] = useState(false); 
  const [isHistoryCollapsed, setIsHistoryCollapsed] = useState(false); 
  
  const locateTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const baseFile = fileList.find(f => f.id === baseFileId);
  const compareFile = fileList.find(f => f.id === compareFileId);

  const handleStartAnalysis = () => {
    setIsFileMenuOpen(false);
    setCurrentStep('analyzing');
    setTimeout(() => setCurrentStep('result'), 2000);
  };

  const handleResetComparison = () => {
    setBaseFileId(null);
    setCompareFileId(null);
    setFileList([]);
    setCurrentStep('upload');
    setActiveDiffId(null);
    setIsLocating(false);
    setIsDiffSidebarCollapsed(false);
    setIsHistoryCollapsed(false);
    setRightTab('diff');
    setIsFullscreen(false);
  };

  const filteredLayers = useMemo(() => {
    return layers.filter(l => l.name.toLowerCase().includes(layerSearch.toLowerCase()));
  }, [layers, layerSearch]);

  const activeDiff = useMemo(() => diffs.find(d => d.id === activeDiffId), [diffs, activeDiffId]);

  const filteredDiffs = useMemo(() => {
    if (diffFilter === 'all') return diffs;
    return diffs.filter(d => d.type === diffFilter);
  }, [diffs, diffFilter]);

  const handleSelectDiff = (id: string) => {
    setActiveDiffId(id);
    setIsLocating(true);
    if (locateTimerRef.current) clearTimeout(locateTimerRef.current);
    locateTimerRef.current = setTimeout(() => {
      setIsLocating(false);
    }, 4000); 
  };

  const toggleDiffStatus = (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    setDiffs(prev => prev.map(d => 
      d.id === id ? { ...d, status: d.status === 'pending' ? 'checked' : 'pending' } : d
    ));
  };

  useEffect(() => {
    const handleEsc = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && isFullscreen) setIsFullscreen(false);
    };
    window.addEventListener('keydown', handleEsc);
    return () => {
      window.removeEventListener('keydown', handleEsc);
      if (locateTimerRef.current) clearTimeout(locateTimerRef.current);
    };
  }, [isFullscreen]);

  const toggleLayer = (layerId: string, side: 'base' | 'compare') => {
    setLayers(prev => prev.map(l => {
      if (l.id === layerId) {
        if (isLayerLinked) {
          const newState = side === 'base' ? !l.visibleBase : !l.visibleCompare;
          return { ...l, visibleBase: newState, visibleCompare: newState };
        }
        return side === 'base' ? { ...l, visibleBase: !l.visibleBase } : { ...l, visibleCompare: !l.visibleCompare };
      }
      return l;
    }));
  };

  const handleToolClick = (toolId: string) => {
    if (toolId === 'fullscreen-toggle') {
      setIsFullscreen(!isFullscreen);
      return;
    }
    setActiveTool(prev => prev === toolId ? null : toolId);
  };

  const handlePickFiles = () => {
    const newFiles: UploadedFile[] = [
      { id: `new-${Date.now()}-1`, name: '1#楼主体结构施工图.dwg', size: '4.2MB' },
      { id: `new-${Date.now()}-2`, name: '1#楼结构变更设计图_R1.dwg', size: '5.8MB' },
    ];
    setPendingFiles(prev => [...prev, ...newFiles]);
  };

  const handleConfirmUpload = () => {
    if (pendingFiles.length > 0) {
      setFileList(prev => [...prev, ...pendingFiles]);
      setPendingFiles([]);
    }
    setIsUploadModalOpen(false);
  };

  const handleSlotClick = (side: 'base' | 'compare') => {
    if (fileList.length < 2) {
      const newFile: UploadedFile = { 
        id: `auto-${Date.now()}`, 
        name: side === 'base' ? '1#楼主体结构施工图.dwg' : '1#楼结构变更设计图_R1.dwg', 
        size: '5.2MB' 
      };
      setFileList(prev => [...prev, newFile]);
      if (side === 'base') setBaseFileId(newFile.id);
      else setCompareFileId(newFile.id);
    } else {
      setIsFileMenuOpen(true);
    }
  };

  const removeFileFromSlot = (side: 'base' | 'compare', e: React.MouseEvent) => {
    e.stopPropagation();
    if (side === 'base') setBaseFileId(null);
    else setCompareFileId(null);
  };

  const renderUploadModal = () => {
    if (!isUploadModalOpen) return null;
    return (
      <div className="fixed inset-0 z-[200] flex items-center justify-center bg-black/45 backdrop-blur-sm p-4 animate-in fade-in duration-200">
        <div className="bg-white rounded-[40px] shadow-2xl w-full max-w-2xl overflow-hidden flex flex-col animate-in zoom-in-95 duration-300">
          <div className="px-8 py-6 border-b border-slate-100 flex items-center justify-between bg-white">
            <div className="flex items-center space-x-4">
              <div className="w-12 h-12 bg-blue-50 text-blue-600 rounded-2xl flex items-center justify-center shadow-inner">
                <Icon name="UploadCloud" size={28} />
              </div>
              <div>
                <h3 className="text-xl font-black text-slate-800">导入图纸文件</h3>
                <p className="text-[11px] text-slate-400 font-bold uppercase tracking-widest">Support DWG, DXF, PDF Formats</p>
              </div>
            </div>
            <button onClick={() => { setIsUploadModalOpen(false); setPendingFiles([]); }} className="text-slate-300 hover:text-slate-600 transition-colors">
              <Icon name="X" size={28} />
            </button>
          </div>
          <div className="p-8 space-y-6">
            <div onClick={handlePickFiles} className="w-full border-2 border-dashed border-slate-200 rounded-[32px] py-12 flex flex-col items-center justify-center space-y-4 hover:bg-blue-50 hover:border-blue-400 transition-all cursor-pointer group">
              <div className="w-16 h-16 bg-slate-50 rounded-full flex items-center justify-center text-slate-300 group-hover:bg-blue-100 group-hover:text-blue-600 transition-all"><Icon name="Plus" size={32} strokeWidth={3} /></div>
              <div className="text-center"><p className="text-base font-black text-slate-700">点击或将文件拖拽至此处</p><p className="text-xs text-slate-400 mt-1 font-medium">支持多选，单文件最大 50MB</p></div>
            </div>
            {pendingFiles.length > 0 && (
              <div className="space-y-2">
                <h4 className="text-[10px] font-black text-slate-400 uppercase tracking-widest px-1">准备导入 ({pendingFiles.length})</h4>
                <div className="max-h-48 overflow-y-auto custom-scrollbar pr-2 space-y-2">
                  {pendingFiles.map(f => (
                    <div key={f.id} className="bg-slate-50 rounded-xl p-3 flex items-center justify-between group">
                      <div className="flex items-center space-x-3"><Icon name="FileCode" size={16} className="text-blue-500" /><span className="text-xs font-bold text-slate-700 truncate max-w-[300px]">{f.name}</span><span className="text-[10px] text-slate-400 font-medium">{f.size}</span></div>
                      <button onClick={() => setPendingFiles(prev => prev.filter(p => p.id !== f.id))} className="text-slate-300 hover:text-rose-500 transition-colors"><Icon name="XCircle" size={16} /></button>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
          <div className="px-8 py-6 border-t border-slate-100 bg-slate-50/50 flex items-center justify-end space-x-4">
            <button onClick={() => { setIsUploadModalOpen(false); setPendingFiles([]); }} className="px-8 py-3 rounded-2xl text-sm font-black text-slate-500 hover:bg-slate-100 transition-all">取消</button>
            <button onClick={handleConfirmUpload} disabled={pendingFiles.length === 0} className="px-10 py-3 bg-blue-600 text-white rounded-2xl text-sm font-black shadow-xl shadow-blue-500/20 hover:bg-blue-700 transition-all active:scale-95 disabled:opacity-30">确认导入</button>
          </div>
        </div>
      </div>
    );
  };

  const renderIntegratedHeader = () => (
    <div className="relative px-8 py-4 border-b border-slate-100 flex items-center justify-between shrink-0 bg-white shadow-sm z-[110]">
      <div className="flex items-center space-x-4">
        <button onClick={onBack} className="p-2 text-slate-400 hover:text-blue-600 hover:bg-blue-50 rounded-xl transition-all" title="返回模块选择"><Icon name="ArrowLeft" size={24} /></button>
        <div className="flex items-center space-x-3">
          <div className="w-10 h-10 bg-blue-50 text-blue-600 rounded-xl flex items-center justify-center"><Icon name="Dna" size={20} /></div>
          <h1 className="text-lg font-black text-slate-800 tracking-tight">AI图纸对比</h1>
        </div>
      </div>
      <div className="flex items-center space-x-2">
        <div className="relative">
          <button onClick={() => setIsFileMenuOpen(!isFileMenuOpen)} className={`flex items-center space-x-2 px-4 py-2 rounded-xl text-xs font-black transition-all border ${isFileMenuOpen ? 'bg-blue-50 border-blue-200 text-blue-600 shadow-inner' : 'bg-white border-slate-200 text-slate-600 hover:border-blue-400'}`}>
            <Icon name="Files" size={16} />
            <span>图纸列表</span>
            {fileList.length > 0 && <span className="bg-blue-100 text-blue-600 px-1.5 py-0.5 rounded text-[10px] font-black">{fileList.length}</span>}
            <Icon name="ChevronDown" size={14} className={`transition-transform duration-300 ${isFileMenuOpen ? 'rotate-180' : ''}`} />
          </button>
          {isFileMenuOpen && (
            <>
              <div className="fixed inset-0 z-[120]" onClick={() => setIsFileMenuOpen(false)}></div>
              <div className="absolute top-full right-0 mt-3 w-[380px] bg-white rounded-[32px] shadow-[0_25px_65px_-12px_rgba(0,0,0,0.2)] border border-slate-100 p-6 z-[130] animate-in fade-in zoom-in-95 duration-200">
                <div className="space-y-4">
                  <div className="flex items-center justify-between px-1">
                    <div className="flex items-center space-x-2">
                      <Icon name="LayoutGrid" size={14} className="text-slate-400" />
                      <h3 className="text-[11px] font-black text-slate-400 uppercase tracking-widest">管理图纸</h3>
                    </div>
                    <button className="text-[11px] font-black text-blue-500 hover:text-blue-600 transition-colors" onClick={() => setIsUploadModalOpen(true)}>+ 导入新图纸</button>
                  </div>
                  <div className="space-y-3 max-h-[440px] overflow-y-auto custom-scrollbar px-1 pb-2">
                    {fileList.map((file) => {
                      const isBase = baseFileId === file.id;
                      const isCompare = compareFileId === file.id;
                      return (
                        <div key={file.id} className="p-1.5">
                          <div className={`bg-white border rounded-[22px] p-4 flex flex-col space-y-4 transition-all group ${isBase ? 'border-rose-400 ring-4 ring-rose-50 shadow-md' : isCompare ? 'border-emerald-400 ring-4 ring-emerald-50 shadow-md' : 'border-slate-100 hover:border-blue-200 hover:shadow-sm'}`}>
                            <div className="flex items-center justify-between">
                              <div className="flex items-center space-x-3 min-w-0">
                                  <div className={`w-9 h-9 rounded-xl flex items-center justify-center shrink-0 ${isBase ? 'bg-rose-50 text-rose-500' : isCompare ? 'bg-emerald-50 text-emerald-500' : 'bg-slate-50 text-slate-400'}`}>
                                    <Icon name="FileText" size={18} />
                                  </div>
                                  <div className="min-w-0">
                                    <p className={`text-[12px] font-bold truncate ${isBase || isCompare ? 'text-slate-900' : 'text-slate-700'}`}>{file.name}</p>
                                    <p className="text-[10px] text-slate-400 font-medium">{file.size}</p>
                                  </div>
                              </div>
                              <button onClick={() => { setFileList(prev => prev.filter(f => f.id !== file.id)); if (isBase) setBaseFileId(null); if (isCompare) setCompareFileId(null); }} className="p-2 text-slate-300 hover:text-rose-500 hover:bg-rose-50 rounded-lg transition-all shrink-0"><Icon name="Trash2" size={14} /></button>
                            </div>
                            <div className="flex items-center space-x-3">
                               <button 
                                onClick={() => setBaseFileId(isBase ? null : file.id)} 
                                className={`flex-1 h-9 flex items-center justify-center rounded-xl text-[11px] font-black transition-all border ${isBase ? 'bg-rose-500 border-rose-500 text-white shadow-lg shadow-rose-200' : 'bg-white border-slate-200 text-slate-500 hover:bg-rose-50 hover:text-rose-600 hover:border-rose-200'}`}
                               >
                                {isBase ? '基准图 (L)' : '设为基准'}
                               </button>
                               <button 
                                onClick={() => setCompareFileId(isCompare ? null : file.id)} 
                                className={`flex-1 h-9 flex items-center justify-center rounded-xl text-[11px] font-black transition-all border ${isCompare ? 'bg-emerald-500 border-emerald-500 text-white shadow-lg shadow-emerald-200' : 'bg-white border-slate-200 text-slate-500 hover:bg-emerald-50 hover:text-emerald-600 hover:border-emerald-200'}`}
                               >
                                {isCompare ? '对比图 (R)' : '设为对比'}
                               </button>
                            </div>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              </div>
            </>
          )}
        </div>
        <button onClick={() => setIsUploadModalOpen(true)} className="flex items-center space-x-2 px-4 py-2 bg-white border border-slate-200 text-slate-700 rounded-xl text-xs font-black shadow-sm hover:border-emerald-400 transition-all active:scale-95"><Icon name="PlusCircle" size={16} /><span>导入文件</span></button>
        <button disabled={!baseFileId || !compareFileId} onClick={handleStartAnalysis} className="flex items-center space-x-2 px-5 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-xs font-black shadow-lg shadow-blue-900/10 transition-all active:scale-95 disabled:opacity-30 disabled:grayscale"><Icon name="ArrowRightLeft" size={16} strokeWidth={2.5} /><span>开始对比</span></button>
        <button onClick={handleResetComparison} className="flex items-center space-x-2 px-4 py-2 bg-white border border-slate-200 text-slate-600 hover:text-rose-500 hover:border-rose-200 rounded-xl text-xs font-black transition-all active:scale-95 shadow-sm">
          <Icon name="RotateCcw" size={16} />
          <span>重置对比</span>
        </button>
      </div>
    </div>
  );

  const renderHistorySidebar = () => (
    <div className={`${isHistoryCollapsed ? 'w-16' : 'w-64'} bg-white border-r border-slate-200 flex flex-col shrink-0 transition-all duration-300 overflow-hidden relative z-20`}>
      <div className="p-5 border-b border-slate-50 flex items-center justify-between bg-slate-50/50 shrink-0">
        {!isHistoryCollapsed && <h2 className="text-xs font-black text-slate-400 uppercase tracking-widest">历史任务</h2>}
        <div className="flex items-center space-x-2">
            <button onClick={() => setIsHistoryCollapsed(!isHistoryCollapsed)} className="p-1.5 text-slate-400 hover:text-blue-600 rounded-lg transition-colors">
              <Icon name={isHistoryCollapsed ? "PanelLeftOpen" : "PanelLeftClose"} size={16} />
            </button>
          </div>
      </div>
      <div className="flex-1 overflow-y-auto p-3 space-y-2 custom-scrollbar">
        {MOCK_HISTORY.map(h => (
          <div key={h.id} className={`p-3 rounded-xl border transition-all cursor-pointer ${!isHistoryCollapsed ? 'bg-white border-slate-100 hover:border-blue-200' : 'flex justify-center text-blue-600'}`}>
            {!isHistoryCollapsed ? (
                <>
                  <p className="text-sm font-bold text-slate-700 truncate mb-1">{h.baseName}</p>
                  <div className="flex items-center text-[10px] text-slate-400 font-medium italic">
                    <Icon name="Calendar" size={10} className="mr-1" />
                    {h.createTime}
                  </div>
                </>
            ) : <Icon name="Folder" size={20} />}
          </div>
        ))}
      </div>
    </div>
  );

  const renderUpload = () => (
    <div className="flex-1 flex flex-col bg-white animate-in fade-in duration-500 overflow-hidden">
      {renderIntegratedHeader()}
      <div className="flex-1 flex overflow-hidden relative">
        {renderHistorySidebar()}

        <div className="flex-1 flex flex-col items-center justify-center p-12 bg-slate-50/30">
          <div className="w-full max-w-5xl grid grid-cols-2 gap-8 animate-in fade-in slide-in-from-bottom-6 duration-500">
            <div onClick={() => handleSlotClick('base')} className={`group border-2 rounded-[40px] p-12 text-center transition-all duration-500 cursor-pointer relative overflow-hidden flex flex-col items-center space-y-6 ${baseFileId ? 'bg-white border-rose-100 shadow-2xl shadow-rose-500/5' : 'bg-slate-50/50 border-slate-100 hover:border-rose-400 hover:bg-white hover:shadow-xl'}`}>
              {baseFileId && <button onClick={(e) => removeFileFromSlot('base', e)} className="absolute top-4 right-4 p-2 bg-slate-50 text-slate-400 hover:text-rose-500 hover:bg-rose-50 rounded-full transition-all z-20 border border-slate-100 shadow-sm"><Icon name="X" size={14} strokeWidth={2.5} /></button>}
              <div className={`px-5 py-1.5 rounded-full text-[10px] font-black uppercase tracking-widest border transition-colors ${baseFileId ? 'bg-rose-50 text-rose-500 border-rose-100' : 'bg-slate-100 text-slate-400 border-slate-200 group-hover:bg-rose-50 group-hover:text-rose-500 group-hover:border-rose-100'}`}>基准图纸 (L)</div>
              <div className={`w-24 h-24 rounded-3xl flex items-center justify-center shadow-inner transition-all ${baseFileId ? 'bg-rose-50 text-rose-500' : 'bg-slate-100 text-slate-300 group-hover:bg-rose-50 group-hover:text-rose-400'}`}><Icon name={baseFileId ? "FileCode" : "Plus"} size={baseFileId ? 48 : 32} strokeWidth={baseFileId ? 2 : 3} /></div>
              <div><h4 className={`text-lg font-black truncate max-w-[280px] transition-colors ${baseFileId ? 'text-slate-800' : 'text-slate-400 group-hover:text-slate-700'}`}>{baseFile?.name || '点击选择基准图...'}</h4></div>
            </div>
            <div onClick={() => handleSlotClick('compare')} className={`group border-2 rounded-[40px] p-12 text-center transition-all duration-500 cursor-pointer relative overflow-hidden flex flex-col items-center space-y-6 ${compareFileId ? 'bg-white border-emerald-100 shadow-2xl shadow-emerald-500/5' : 'bg-slate-50/50 border-slate-100 hover:border-emerald-400 hover:bg-white hover:shadow-xl'}`}>
              {compareFileId && <button onClick={(e) => removeFileFromSlot('compare', e)} className="absolute top-4 right-4 p-2 bg-slate-50 text-slate-400 hover:text-emerald-500 hover:bg-rose-50 rounded-full transition-all z-20 border border-slate-100 shadow-sm"><Icon name="X" size={14} strokeWidth={2.5} /></button>}
              <div className={`px-5 py-1.5 rounded-full text-[10px] font-black uppercase tracking-widest border transition-colors ${compareFileId ? 'bg-emerald-50 text-emerald-600 border-emerald-100' : 'bg-slate-100 text-slate-400 border-slate-200 group-hover:bg-emerald-50 group-hover:text-emerald-600 group-hover:border-emerald-100'}`}>对比图纸 (R)</div>
              <div className={`w-24 h-24 rounded-3xl flex items-center justify-center shadow-inner transition-all ${compareFileId ? 'bg-emerald-50 text-emerald-600' : 'bg-slate-100 text-slate-300 group-hover:bg-emerald-50 group-hover:text-emerald-400'}`}><Icon name={compareFileId ? "FileSearch" : "Plus"} size={compareFileId ? 48 : 32} strokeWidth={compareFileId ? 2 : 3} /></div>
              <div><h4 className={`text-lg font-black truncate max-w-[280px] transition-colors ${compareFileId ? 'text-slate-800' : 'text-slate-400 group-hover:text-slate-700'}`}>{compareFile?.name || '点击选择对比图...'}</h4></div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );

  const renderAnalyzing = () => (
    <div className="flex-1 flex flex-col items-center justify-center bg-white">
      <div className="relative w-40 h-40 mb-8"><div className="absolute inset-0 rounded-full border-4 border-blue-50"></div><div className="absolute inset-0 rounded-full border-4 border-blue-600 border-t-transparent animate-spin"></div><div className="absolute inset-0 flex items-center justify-center text-blue-600 animate-pulse"><Icon name="Cpu" size={48} /></div></div>
      <h2 className="text-2xl font-black text-slate-800">深度像素比对中...</h2>
      <p className="text-slate-400 text-sm mt-2">正在分析差异点</p>
    </div>
  );

  const renderResult = () => {
    // 动态定位样式配置
    const getLocalizationStyles = (item: DiffItem, side: 'base' | 'compare') => {
      const typeStyles = {
        add: {
          border: 'border-emerald-500', // 新增绿色
          bg: 'bg-emerald-500',
          shadow: 'shadow-[0_0_80px_rgba(16,185,129,0.6)]',
          ping: 'border-emerald-400',
          // 基准图不存在新增项（虚线），对比图存在（实线）
          borderStyle: side === 'base' ? 'border-dashed' : 'border-solid'
        },
        delete: {
          border: 'border-rose-500', // 删除红色
          bg: 'bg-rose-500',
          shadow: 'shadow-[0_0_80px_rgba(244,63,94,0.6)]',
          ping: 'border-rose-400',
          // 基准图存在删除项（实线），对比图已移除（虚线）
          borderStyle: side === 'base' ? 'border-solid' : 'border-dashed'
        },
        modify: {
          border: 'border-amber-500', // 修改黄色/琥珀色
          bg: 'bg-amber-500',
          shadow: 'shadow-[0_0_80px_rgba(245,158,11,0.6)]',
          ping: 'border-amber-400',
          borderStyle: 'border-solid'
        }
      };
      
      return typeStyles[item.type];
    };

    return (
      <div className={`flex-1 flex flex-col overflow-hidden animate-in fade-in slide-in-from-bottom-2 duration-700 relative ${isFullscreen ? 'fixed inset-0 z-[150] bg-white' : ''}`}>
        {renderIntegratedHeader()}
        <div className="flex-1 flex overflow-hidden relative">
          {!isFullscreen && renderHistorySidebar()}

          <div className={`flex-1 flex flex-col bg-slate-50 relative overflow-hidden transition-all duration-300 ${activeTool ? 'cursor-crosshair' : ''}`}>
            {/* 测量工具栏 */}
            <div className="absolute top-4 left-1/2 -translate-x-1/2 flex bg-white/95 backdrop-blur-xl border border-slate-200 rounded-xl p-0.5 shadow-2xl z-40 animate-in slide-in-from-top-4 duration-500 overflow-hidden">
               <div className="flex items-center space-x-0.5">
                 <button onClick={() => handleToolClick('align')} className={`flex items-center space-x-1.5 px-3 py-1 rounded-lg transition-all ${activeTool === 'align' ? 'bg-blue-600 text-white shadow-md' : 'text-slate-600 hover:text-blue-600 hover:bg-blue-50'}`}><Icon name="Ruler" size={13} /><span className="text-[10px] font-black uppercase tracking-widest whitespace-nowrap">对齐</span></button>
                 <button onClick={() => handleToolClick('linear')} className={`flex items-center space-x-1.5 px-3 py-1 rounded-lg transition-all ${activeTool === 'linear' ? 'bg-blue-600 text-white shadow-md' : 'text-slate-600 hover:text-blue-600 hover:bg-blue-50'}`}><Icon name="MoveHorizontal" size={13} /><span className="text-[10px] font-black uppercase tracking-widest whitespace-nowrap">线性</span></button>
                 <button onClick={() => handleToolClick('area')} className={`flex items-center space-x-1.5 px-3 py-1 rounded-lg transition-all ${activeTool === 'area' ? 'bg-blue-600 text-white shadow-md' : 'text-slate-600 hover:text-blue-600 hover:bg-blue-50'}`}><Icon name="Triangle" size={13} /><span className="text-[10px] font-black uppercase tracking-widest whitespace-nowrap">面积</span></button>
                 <button onClick={() => handleToolClick('rect')} className={`flex items-center space-x-1.5 px-3 py-1 rounded-lg transition-all ${activeTool === 'rect' ? 'bg-blue-600 text-white shadow-md' : 'text-slate-600 hover:text-blue-600 hover:bg-blue-50'}`}><Icon name="Square" size={13} /><span className="text-[10px] font-black uppercase tracking-widest whitespace-nowrap">矩形面积</span></button>
                 <button onClick={() => handleToolClick('coord')} className={`flex items-center space-x-1.5 px-3 py-1 rounded-lg transition-all ${activeTool === 'coord' ? 'bg-blue-600 text-white shadow-md' : 'text-slate-600 hover:text-blue-600 hover:bg-blue-50'}`}><Icon name="Crosshair" size={13} /><span className="text-[10px] font-black uppercase tracking-widest whitespace-nowrap">坐标标注</span></button>
                 <div className="w-px h-4 bg-slate-200 mx-1"></div>
                 <button onClick={() => handleToolClick('scaling')} className={`flex items-center space-x-1.5 px-3 py-1 rounded-lg transition-all ${activeTool === 'scaling' ? 'bg-blue-600 text-white shadow-md' : 'text-slate-600 hover:text-blue-600 hover:bg-blue-50'}`}><Icon name="Scaling" size={13} /><span className="text-[10px] font-black uppercase tracking-widest whitespace-nowrap">设置比例</span></button>
               </div>
            </div>

            {/* 全屏/退出全屏 按钮 */}
            <div className="absolute top-4 right-8 flex bg-white/95 backdrop-blur-xl border border-slate-200 rounded-xl p-0.5 shadow-2xl z-40 animate-in slide-in-from-top-4 duration-500 overflow-hidden">
               <button onClick={() => setIsFullscreen(!isFullscreen)} className={`flex items-center space-x-1.5 px-3 py-1 rounded-lg transition-all ${isFullscreen ? 'bg-blue-600 text-white shadow-md' : 'text-blue-600 hover:bg-blue-50'}`}>
                  <Icon name={isFullscreen ? "Minimize2" : "Maximize2"} size={13} />
                  <span className="text-[10px] font-black uppercase tracking-widest whitespace-nowrap">{isFullscreen ? '退出全屏' : '全屏对比'}</span>
               </button>
            </div>

            <div className={`flex-1 flex overflow-hidden p-4 space-x-4 ${isFullscreen ? 'pt-20 pb-4' : 'pt-16'}`}>
              {/* 基准图 (左) */}
              <div className="relative bg-[#0d0d0d] rounded-[32px] border border-slate-800 shadow-2xl flex flex-col overflow-hidden flex-1 group">
                 <div className="absolute top-4 left-4 bg-rose-600/80 backdrop-blur-md text-white px-3 py-1 rounded-full text-[9px] font-black z-20 border border-white/5 uppercase tracking-widest">基准</div>
                 <div className="flex-1 relative flex items-center justify-center p-8 overflow-hidden">
                    <img src="https://img.js.design/assets/static/f5869e594d216d97e7488031d2797e59?x-oss-process=image/resize,w_1500/format,webp" className={`max-w-full max-h-full object-contain filter transition-all duration-700 ${isLocating ? 'scale-105 blur-[1.5px]' : ''}`} style={{ opacity: (globalOpacity / 100) * (isLocating ? 0.35 : 0.5) }} alt="base" />
                    {isLocating && activeDiff && (
                      <div 
                        className={`absolute w-40 h-40 border-[4px] rounded-3xl animate-in zoom-in-50 duration-300 flex items-center justify-center pointer-events-none transition-all ${getLocalizationStyles(activeDiff, 'base').border} ${getLocalizationStyles(activeDiff, 'base').shadow} ${getLocalizationStyles(activeDiff, 'base').borderStyle}`} 
                        style={{ left: `${activeDiff.pos.x}%`, top: `${activeDiff.pos.y}%`, transform: 'translate(-50%, -50%)' }}
                      >
                          <div className={`text-white px-3 py-1 rounded-full text-[10px] font-black absolute -top-12 shadow-lg whitespace-nowrap animate-bounce ${getLocalizationStyles(activeDiff, 'base').bg}`}>定位: {activeDiff.name}</div>
                          <div className={`w-10 h-10 border-2 rounded-full animate-ping opacity-75 ${getLocalizationStyles(activeDiff, 'base').ping}`}></div>
                      </div>
                    )}
                 </div>
              </div>

              {/* 对比图 (右) */}
              <div className="relative bg-[#0d0d0d] rounded-[32px] border border-slate-800 shadow-2xl flex flex-col overflow-hidden flex-1 group">
                 <div className="absolute top-4 left-4 bg-emerald-600/80 backdrop-blur-md text-white px-3 py-1 rounded-full text-[9px] font-black z-20 border border-white/5 uppercase tracking-widest">对比</div>
                 <div className="flex-1 relative flex items-center justify-center p-8 overflow-hidden">
                    <img src="https://img.js.design/assets/static/f5869e594d216d97e7488031d2797e59?x-oss-process=image/resize,w_1500/format,webp" className={`max-w-full max-h-full object-contain filter transition-all duration-700 hue-rotate-15 ${isLocating ? 'scale-105 blur-[1.5px]' : ''}`} style={{ opacity: (globalOpacity / 100) * (isLocating ? 0.35 : 0.5) }} alt="compare" />
                    {isLocating && activeDiff && (
                      <div 
                        className={`absolute w-40 h-40 border-[4px] rounded-3xl animate-in zoom-in-50 duration-300 flex items-center justify-center pointer-events-none transition-all ${getLocalizationStyles(activeDiff, 'compare').border} ${getLocalizationStyles(activeDiff, 'compare').shadow} ${getLocalizationStyles(activeDiff, 'compare').borderStyle}`} 
                        style={{ left: `${activeDiff.pos.x}%`, top: `${activeDiff.pos.y}%`, transform: 'translate(-50%, -50%)' }}
                      >
                          <div className={`text-white px-3 py-1 rounded-full text-[10px] font-black absolute -top-12 shadow-lg whitespace-nowrap animate-bounce ${getLocalizationStyles(activeDiff, 'compare').bg}`}>定位: {activeDiff.name}</div>
                          <div className={`w-10 h-10 border-2 rounded-full animate-ping opacity-75 ${getLocalizationStyles(activeDiff, 'compare').ping}`}></div>
                      </div>
                    )}
                 </div>
              </div>
            </div>
          </div>

          <div className={`absolute top-1/2 z-[160] transition-all duration-300 transform -translate-y-1/2 ${isDiffSidebarCollapsed ? 'right-0' : 'right-80'}`}>
            <button 
              onClick={() => setIsDiffSidebarCollapsed(!isDiffSidebarCollapsed)}
              className="w-4 h-16 bg-white border border-slate-200 border-r-0 rounded-l-xl shadow-[-2px_0_8px_rgba(0,0,0,0.05)] text-slate-300 hover:text-blue-600 hover:bg-slate-50 flex items-center justify-center transition-all group outline-none"
              title={isDiffSidebarCollapsed ? "展开差异" : "收起差异"}
            >
              <Icon name={isDiffSidebarCollapsed ? 'ChevronLeft' : 'ChevronRight'} size={12} strokeWidth={4} />
            </button>
          </div>

          <div className={`bg-white border-l border-slate-100 flex flex-col shrink-0 z-[155] overflow-hidden relative transition-all duration-300 ${isDiffSidebarCollapsed ? 'w-0' : 'w-80'}`}>
            <div className="flex border-b border-slate-50 bg-slate-50/30 p-1 shrink-0">
               <button onClick={() => setRightTab('diff')} className={`flex-1 py-3 text-[11px] font-black uppercase tracking-widest transition-all rounded-lg flex items-center justify-center space-x-2 ${rightTab === 'diff' ? 'bg-white text-blue-600 shadow-sm' : 'text-slate-400 hover:text-slate-600'}`}><Icon name="ListFilter" size={14} /><span>差异列表</span></button>
               <button onClick={() => setRightTab('layer')} className={`flex-1 py-3 text-[11px] font-black uppercase tracking-widest transition-all rounded-lg flex items-center justify-center space-x-2 ${rightTab === 'layer' ? 'bg-white text-blue-600 shadow-sm' : 'text-slate-400 hover:text-slate-600'}`}><Icon name="Layers" size={14} /><span>图层管理</span></button>
            </div>
            
            <div className="flex-1 overflow-y-auto custom-scrollbar">
              {rightTab === 'diff' ? (
                <div className="p-3 space-y-1.5 animate-in fade-in duration-300">
                  <div className="flex bg-slate-100/50 p-1.5 rounded-2xl mb-1.5">
                    {[{ id: 'all', label: '全部', icon: 'LayoutGrid' }, { id: 'modify', label: '修改', icon: 'Edit3' }, { id: 'add', label: '新增', icon: 'PlusCircle' }, { id: 'delete', label: '删除', icon: 'MinusCircle' }].map((f) => (
                      <button key={f.id} onClick={() => setDiffFilter(f.id as DiffFilter)} className={`flex-1 py-2 rounded-xl text-[11px] font-black transition-all flex items-center justify-center space-x-1.5 ${diffFilter === f.id ? 'bg-white text-blue-600 shadow-sm ring-1 ring-slate-200' : 'text-slate-400 hover:text-slate-600'}`}><Icon name={f.icon} size={12} strokeWidth={3} /><span className="hidden sm:inline">{f.label}</span></button>
                    ))}
                  </div>
                  {filteredDiffs.map((diff) => (
                    <div key={diff.id} onClick={() => handleSelectDiff(diff.id)} className={`p-4 rounded-2xl border transition-all cursor-pointer group relative overflow-hidden ${activeDiffId === diff.id ? 'bg-blue-50 border-blue-200 ring-1 ring-blue-100' : 'bg-white border-slate-50 hover:border-slate-200'}`}>
                        <div className={`absolute top-0 left-0 w-1 h-full ${diff.type === 'add' ? 'bg-emerald-500' : diff.type === 'delete' ? 'bg-rose-500' : 'bg-amber-500'}`}></div>
                        <div className="flex items-center justify-between mb-2">
                          <span className={`text-[9px] font-black px-1.5 py-0.5 rounded uppercase tracking-wider ${diff.type === 'add' ? 'bg-emerald-50 text-emerald-600' : diff.type === 'delete' ? 'bg-rose-50 text-rose-600' : 'bg-amber-50 text-amber-600'}`}>{diff.type === 'add' ? '新增' : diff.type === 'delete' ? '删除' : '修改'}</span>
                          <div onClick={(e) => toggleDiffStatus(diff.id, e)} className="cursor-pointer">
                            <Icon name={diff.status === 'checked' ? "CheckCircle2" : "Circle"} size={16} className={diff.status === 'checked' ? 'text-emerald-500' : 'text-slate-300'} />
                          </div>
                        </div>
                        <p className={`text-xs font-bold truncate ${activeDiffId === diff.id ? 'text-blue-700' : 'text-slate-700'}`}>{diff.name}</p>
                        <p className="text-[10px] text-slate-400 mt-1 font-medium italic">位置: {diff.location}</p>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="p-0 animate-in fade-in duration-300">
                  <div className="p-4 border-b border-slate-50 space-y-4">
                    <div className="relative group"><Icon name="Search" size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-300 group-focus-within:text-blue-500" /><input type="text" value={layerSearch} onChange={(e) => setLayerSearch(e.target.value)} placeholder="搜索图层名称..." className="w-full bg-slate-50 border border-slate-100 rounded-xl py-2 pl-9 pr-4 text-[11px] font-bold outline-none focus:bg-white focus:border-blue-400 transition-all shadow-sm" /></div>
                    <div className="space-y-3 bg-slate-50/50 p-3 rounded-2xl border border-slate-100"><div className="flex items-center justify-between"><span className="text-[10px] font-black text-slate-500 uppercase tracking-widest">图层联动</span><div onClick={() => setIsLayerLinked(!isLayerLinked)} className={`w-9 h-5 rounded-full p-0.5 cursor-pointer transition-all relative ${isLayerLinked ? 'bg-blue-600' : 'bg-slate-300'}`}><div className={`w-4 h-4 bg-white rounded-full shadow-sm transition-all transform ${isLayerLinked ? 'translate-x-4' : 'translate-x-0'}`} /></div></div><div className="space-y-1.5"><div className="flex items-center justify-between"><span className="text-[10px] font-black text-slate-500 uppercase tracking-widest">全局透明度</span><span className="text-[10px] font-black text-blue-600">{globalOpacity}%</span></div><div className="flex items-center space-x-2"><input type="range" min="0" max="100" value={globalOpacity} onChange={(e) => setGlobalOpacity(parseInt(e.target.value))} className="flex-1 h-1.5 bg-slate-200 rounded-lg appearance-none cursor-pointer accent-blue-600" /></div></div></div>
                  </div>
                  <table className="w-full border-collapse">
                    <tbody className="divide-y divide-slate-50">
                      {filteredLayers.map(layer => (
                        <tr key={layer.id} className="hover:bg-slate-50/50 group">
                          <td className="px-4 py-3.5">
                            <div className="flex items-center space-x-2">
                              <div className="w-2.5 h-2.5 rounded-sm shrink-0" style={{ backgroundColor: layer.color }}></div>
                              <span className="text-[11px] font-bold text-slate-600 truncate">{layer.name}</span>
                            </div>
                          </td>
                          <td className="px-4 py-3.5 text-right space-x-1">
                             <button onClick={() => toggleLayer(layer.id, 'base')} className={`p-1.5 rounded-lg transition-colors ${layer.visibleBase ? 'text-blue-600 bg-blue-50' : 'text-slate-300 hover:text-slate-400'}`}><Icon name={layer.visibleBase ? 'Eye' : 'EyeOff'} size={14} /></button>
                             <button onClick={() => toggleLayer(layer.id, 'compare')} className={`p-1.5 rounded-lg transition-colors ${layer.visibleCompare ? 'text-emerald-600 bg-emerald-50' : 'text-slate-300 hover:text-slate-400'}`}><Icon name={layer.visibleCompare ? 'Eye' : 'EyeOff'} size={14} /></button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    );
  };

  const renderContent = () => {
    switch (currentStep) {
      case 'analyzing': return renderAnalyzing();
      case 'result': return renderResult();
      default: return renderUpload();
    }
  };

  return (
    <div className="flex-1 flex flex-col h-full bg-white overflow-hidden relative">
      {renderContent()}
      {renderUploadModal()}
    </div>
  );
};

export default AICadDiffView;