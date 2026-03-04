import React, { useState, useMemo, useEffect, useRef } from 'react';
import Icon from './Icon';

interface CadFile {
  id: string;
  name: string;
  size: string;
}

interface CadLayer {
  id: string;
  name: string;
  visible: boolean;
  color: string;
}

interface TextSearchResult {
  id: string;
  text: string;
  location: string;
  pos: { x: number; y: number };
}

interface RecognitionResult {
  id: string;
  type: 'text' | 'table';
  title: string;
  summary: string;
  details: any;
}

const MOCK_FILES: CadFile[] = [
  { id: 'f1', name: '16#楼一层建筑平面图.dwg', size: '4.2MB' },
  { id: 'f2', name: '18#楼基础详图.dxf', size: '5.8MB' },
  { id: 'f3', name: '地下室人防区排布.dwg', size: '12.4MB' },
];

const MOCK_LAYERS: CadLayer[] = [
  { id: 'l1', name: 'WALL (墙体层)', visible: true, color: '#64748b' },
  { id: 'l2', name: 'DOOR_WINDOW (门窗层)', visible: true, color: '#0ea5e9' },
  { id: 'l3', name: 'AXIS (轴线层)', visible: true, color: '#ef4444' },
  { id: 'l4', name: 'TEXT (文字标注)', visible: true, color: '#f59e0b' },
  { id: 'l5', name: 'FURNITURE (家具装饰)', visible: false, color: '#10b981' },
  { id: 'l6', name: 'HATCH (填充层)', visible: true, color: '#94a3b8' },
];

const MOCK_TEXT_RESULTS: TextSearchResult[] = [
  { id: 't1', text: 'C1521', location: '1-5/A轴 客厅窗口', pos: { x: 30, y: 40 } },
  { id: 't2', text: 'C1521', location: '1-8/B轴 卧室窗口', pos: { x: 55, y: 35 } },
  { id: 't3', text: 'KL-1(2)', location: '2-C轴 框架梁', pos: { x: 40, y: 60 } },
  { id: 't4', text: '1000x2100', location: 'M1021 门洞口', pos: { x: 70, y: 50 } },
  { id: 't5', text: '±0.000', location: '楼梯间标高', pos: { x: 20, y: 80 } },
];

const RECOGNITION_DATA: RecognitionResult[] = [
  { 
    id: 'r1', type: 'table', title: '门窗表-W1', summary: '包含12个构件，识别准确率99%', 
    details: [
      { code: 'C1', name: '平开窗', spec: '1500*2100', qty: 5 },
      { code: 'C2', name: '固定窗', spec: '1200*1800', qty: 8 },
      { code: 'M1', name: '入户门', spec: '1000*2100', qty: 3 }
    ]
  },
  { 
    id: 'r2', type: 'text', title: '结构说明-通用条款', summary: '识别到混凝土强度等级及保护层厚度', 
    details: '本工程结构设计使用年限为50年。基础设计等级为乙级。混凝土强度等级：梁板C30，柱C35，垫层C15。钢筋保护层厚度：梁25mm，板15mm。' 
  },
  { 
    id: 'r3', type: 'table', title: '梁配筋明细-1层', summary: '识别到KL-1至KL-15配筋数据', 
    details: [
      { id: 'KL1', steel: '2Φ25;3Φ25', stirrup: 'Φ8@100/200(2)' },
      { id: 'KL2', steel: '2Φ22;4Φ25', stirrup: 'Φ10@100/200(4)' }
    ]
  },
  { 
    id: 'r4', type: 'text', title: '图纸变更注记', summary: '检测到手工修改痕迹', 
    details: '2024-05-20：根据暖通专业反馈，3-C轴处梁高由600修改为550，请相关专业注意对齐。' 
  }
];

const EXPORT_FORMATS = [
  { id: 'pdf', name: 'PDF (高清文档)', icon: 'FileText', color: 'text-rose-500', bg: 'bg-rose-50' },
  { id: 'png', name: 'PNG (透明图片)', icon: 'Image', color: 'text-emerald-500', bg: 'bg-emerald-50' },
  { id: 'jpg', name: 'JPG (标准图片)', icon: 'Image', color: 'text-blue-500', bg: 'bg-blue-50' },
  { id: 'dwg-2018', name: 'AutoCAD 2018 (DWG)', icon: 'History', color: 'text-amber-500', bg: 'bg-amber-50' },
  { id: 'dwg-2010', name: 'AutoCAD 2010 (DWG)', icon: 'History', color: 'text-orange-500', bg: 'bg-orange-50' },
];

interface AICadViewerViewProps {
  onBack?: () => void;
}

const AICadViewerView: React.FC<AICadViewerViewProps> = ({ onBack }) => {
  const [activeSideTab, setActiveSideTab] = useState<'files' | 'layers' | 'search'>('files');
  const [fileList, setFileList] = useState<CadFile[]>(MOCK_FILES);
  const [layers, setLayers] = useState<CadLayer[]>(MOCK_LAYERS);
  const [activeTool, setActiveTool] = useState<string | null>(null);
  const [isSidebarCollapsed, setIsSidebarCollapsed] = useState(false);
  
  // 搜索相关状态
  const [searchQuery, setSearchQuery] = useState('');
  const [layerSearchQuery, setLayerSearchQuery] = useState('');
  const [isSearching, setIsSearching] = useState(false);
  const [searchResults, setSearchResults] = useState<TextSearchResult[]>([]);
  const [locatingTextId, setLocatingTextId] = useState<string | null>(null);
  
  // 识别弹窗相关状态
  const [isIdentifyModalOpen, setIsIdentifyModalOpen] = useState(false);
  const [selectedResultIds, setSelectedResultIds] = useState<Set<string>>(new Set());
  const [previewResultId, setPreviewResultId] = useState<string | null>(RECOGNITION_DATA[0].id);
  const [isProcessing, setIsProcessing] = useState(false);

  // 格式转换弹窗状态
  const [isConvertModalOpen, setIsConvertModalOpen] = useState(false);
  const [selectedExportFormat, setSelectedExportFormat] = useState(EXPORT_FORMATS[0].id);

  // 鼠标交互状态
  const [mouseCoord, setMouseCoord] = useState({ x: 0, y: 0 });
  const [currentHoverLayer, setCurrentHoverLayer] = useState<string>('0 (默认图层)');
  const [isHoveringPreview, setIsHoveringPreview] = useState(false);
  
  // 已打开的页签 ID 列表
  const [openFileIds, setOpenFileIds] = useState<string[]>(['f1']);
  const [activeFileId, setActiveFileId] = useState<string | null>('f1');
  
  // 导入文件状态
  const [isUploadModalOpen, setIsUploadModalOpen] = useState(false);
  const [pendingFiles, setPendingFiles] = useState<CadFile[]>([]);

  const locateTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const previewRef = useRef<HTMLDivElement>(null);

  // 处理全选逻辑
  const handleToggleSelectAll = () => {
    if (selectedResultIds.size === RECOGNITION_DATA.length) {
      setSelectedResultIds(new Set());
    } else {
      setSelectedResultIds(new Set(RECOGNITION_DATA.map(r => r.id)));
    }
  };

  const handleToggleResult = (e: React.MouseEvent, id: string) => {
    e.stopPropagation();
    const next = new Set(selectedResultIds);
    if (next.has(id)) next.delete(id);
    else next.add(id);
    setSelectedResultIds(next);
  };

  // 模拟识别过程
  const handleIdentifyFile = () => {
    setIsProcessing(true);
    setTimeout(() => {
      setIsProcessing(false);
      setIsIdentifyModalOpen(true);
    }, 1500);
  };

  // 处理图层过滤
  const filteredLayers = useMemo(() => {
    return layers.filter(l => l.name.toLowerCase().includes(layerSearchQuery.toLowerCase()));
  }, [layers, layerSearchQuery]);

  // 处理全局搜索
  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    if (!searchQuery.trim()) return;
    
    setIsSearching(true);
    setTimeout(() => {
      const results = MOCK_TEXT_RESULTS.filter(r => 
        r.text.toLowerCase().includes(searchQuery.toLowerCase()) || 
        r.location.toLowerCase().includes(searchQuery.toLowerCase())
      );
      setSearchResults(results);
      setIsSearching(false);
    }, 600);
  };

  // 定位文本
  const handleLocateText = (id: string) => {
    setLocatingTextId(id);
    if (locateTimerRef.current) clearTimeout(locateTimerRef.current);
    locateTimerRef.current = setTimeout(() => {
      setLocatingTextId(null);
    }, 3000);
  };

  // 坐标与图层监听
  const handleMouseMove = (e: React.MouseEvent) => {
    if (!previewRef.current) return;
    const rect = previewRef.current.getBoundingClientRect();
    
    // 模拟 CAD 坐标系
    const x = Math.round((e.clientX - rect.left) * 10);
    const y = Math.round((rect.bottom - e.clientY) * 10);
    setMouseCoord({ x, y });

    // 模拟图层感知逻辑
    if (x % 500 < 100) {
      setCurrentHoverLayer('WALL (墙体层)');
    } else if (x % 500 < 200) {
      setCurrentHoverLayer('DOOR_WINDOW (门窗层)');
    } else if (x % 500 < 300) {
      setCurrentHoverLayer('AXIS (轴线层)');
    } else {
      setCurrentHoverLayer('0 (默认图层)');
    }
  };

  // 打开文件
  const handleOpenFile = (id: string) => {
    if (!openFileIds.includes(id)) {
      setOpenFileIds(prev => [...prev, id]);
    }
    setActiveFileId(id);
  };

  // 移除文件
  const handleRemoveFileFromList = (e: React.MouseEvent, id: string) => {
    e.stopPropagation();
    setFileList(prev => prev.filter(f => f.id !== id));
    const newOpenIds = openFileIds.filter(oid => oid !== id);
    setOpenFileIds(newOpenIds);
    if (activeFileId === id) {
      setActiveFileId(newOpenIds.length > 0 ? newOpenIds[newOpenIds.length - 1] : null);
    }
  };

  // 关闭页签
  const handleCloseTab = (e: React.MouseEvent, id: string) => {
    e.stopPropagation();
    const newOpenIds = openFileIds.filter(oid => oid !== id);
    setOpenFileIds(newOpenIds);
    if (activeFileId === id) {
      setActiveFileId(newOpenIds.length > 0 ? newOpenIds[newOpenIds.length - 1] : null);
    }
  };

  const handleToolClick = (toolId: string) => {
    setActiveTool(prev => prev === toolId ? null : toolId);
  };

  const handlePickFiles = () => {
    const newFiles: CadFile[] = [
      { id: `new-${Date.now()}-1`, name: '结构变更图纸_v2.dwg', size: '4.2MB' },
      { id: `new-${Date.now()}-2`, name: '基础底板配筋图.dwg', size: '5.8MB' },
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

  const handleExport = () => {
    const format = EXPORT_FORMATS.find(f => f.id === selectedExportFormat);
    alert(`正在导出图纸为：${format?.name}`);
    setIsConvertModalOpen(false);
  };

  const renderIntegratedHeader = () => (
    <div className="px-8 h-14 border-b border-slate-100 flex items-center justify-between shrink-0 bg-white shadow-sm z-30">
      <div className="flex items-center space-x-4 shrink-0">
        <button 
          onClick={onBack}
          className="p-1.5 text-slate-400 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-all outline-none"
          title="返回模块选择"
        >
          <Icon name="ArrowLeft" size={20} />
        </button>
        <div className="flex items-center space-x-2.5">
          <div className="w-8 h-8 bg-blue-50 text-blue-600 rounded-lg flex items-center justify-center">
            <Icon name="Maximize" size={16} />
          </div>
          <h1 className="text-base font-black text-slate-800 tracking-tight whitespace-nowrap">CAD智能看图</h1>
        </div>
      </div>
      <div className="flex-1"></div>
      <div className="flex items-center space-x-2 shrink-0">
        <button 
          onClick={() => setIsConvertModalOpen(true)}
          disabled={!activeFileId}
          className="flex items-center space-x-2 px-4 h-9 bg-white border border-slate-200 text-slate-600 rounded-xl text-xs font-black shadow-sm hover:border-blue-400 hover:text-blue-600 transition-all active:scale-95 outline-none disabled:opacity-30"
        >
          <Icon name="RefreshCcw" size={14} />
          <span>文件格式转换</span>
        </button>
        <button 
          onClick={() => setIsUploadModalOpen(true)}
          className="flex items-center space-x-2 px-5 h-9 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-xs font-black shadow-md shadow-blue-500/20 transition-all active:scale-95 outline-none"
        >
          <Icon name="PlusCircle" size={14} />
          <span>导入文件</span>
        </button>
      </div>
    </div>
  );

  const renderSidebar = () => (
    <div className={`bg-white border-l border-slate-100 flex flex-col shrink-0 z-20 overflow-hidden transition-all duration-300 relative ${isSidebarCollapsed ? 'w-0' : 'w-72'}`}>
      {/* 收起/展开切换手柄 */}
      <div className={`absolute top-1/2 left-0 -translate-x-full z-30 transition-all duration-300 transform -translate-y-1/2`}>
        <button 
          onClick={() => setIsSidebarCollapsed(!isSidebarCollapsed)}
          className="w-4 h-16 bg-white border border-slate-200 border-r-0 rounded-l-xl shadow-[-2px_0_8px_rgba(0,0,0,0.05)] text-slate-300 hover:text-blue-600 hover:bg-slate-50 flex items-center justify-center transition-all group outline-none"
          title={isSidebarCollapsed ? "展开" : "收起"}
        >
          <Icon name={isSidebarCollapsed ? 'ChevronLeft' : 'ChevronRight'} size={12} strokeWidth={4} />
        </button>
      </div>

      <div className="flex border-b border-slate-50 bg-slate-50/30 p-1 shrink-0">
        <button 
          onClick={() => setActiveSideTab('files')}
          className={`flex-1 py-2.5 text-[10px] font-black uppercase tracking-widest transition-all rounded-lg flex items-center justify-center space-x-1.5 ${activeSideTab === 'files' ? 'bg-white text-blue-600 shadow-sm' : 'text-slate-400 hover:text-slate-600'}`}
        >
          <Icon name="Files" size={12} />
          <span>图纸</span>
        </button>
        <button 
          onClick={() => setActiveSideTab('layers')}
          className={`flex-1 py-2.5 text-[10px] font-black uppercase tracking-widest transition-all rounded-lg flex items-center justify-center space-x-1.5 ${activeSideTab === 'layers' ? 'bg-white text-blue-600 shadow-sm' : 'text-slate-400 hover:text-slate-600'}`}
        >
          <Icon name="Layers" size={12} />
          <span>图层</span>
        </button>
        <button 
          onClick={() => setActiveSideTab('search')}
          className={`flex-1 py-2.5 text-[10px] font-black uppercase tracking-widest transition-all rounded-lg flex items-center justify-center space-x-1.5 ${activeSideTab === 'search' ? 'bg-white text-blue-600 shadow-sm' : 'text-slate-400 hover:text-slate-600'}`}
        >
          <Icon name="TextSearch" size={12} />
          <span>搜索</span>
        </button>
      </div>

      <div className="flex-1 overflow-y-auto custom-scrollbar">
        {activeSideTab === 'files' ? (
          <div className="p-3 space-y-2">
            {fileList.map(file => (
              <div 
                key={file.id}
                onClick={() => handleOpenFile(file.id)}
                className={`p-3 rounded-xl border transition-all cursor-pointer group flex items-center space-x-3 relative ${activeFileId === file.id ? 'bg-blue-50 border-blue-200 ring-1 ring-blue-100' : 'bg-white border-slate-100 hover:border-blue-200'}`}
              >
                <div className={`w-9 h-9 rounded-lg flex items-center justify-center shrink-0 ${activeFileId === file.id ? 'bg-blue-600 text-white shadow-md' : 'bg-slate-50 text-slate-400 group-hover:text-blue-500'}`}>
                  <Icon name="FileCode" size={18} />
                </div>
                <div className="min-w-0 flex-1 pr-6">
                  <p className={`text-[11px] font-bold truncate ${activeFileId === file.id ? 'text-blue-700' : 'text-slate-700'}`}>{file.name}</p>
                  <span className="text-[9px] text-slate-400 font-medium">{file.size}</span>
                </div>
                <button 
                  onClick={(e) => handleRemoveFileFromList(e, file.id)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 p-1 rounded-lg text-slate-300 hover:text-rose-500 hover:bg-rose-50 transition-all opacity-0 group-hover:opacity-100"
                >
                  <Icon name="X" size={12} />
                </button>
              </div>
            ))}
          </div>
        ) : activeSideTab === 'layers' ? (
          <div className="p-0">
             <div className="p-3 border-b border-slate-50">
               <div className="relative group">
                  <div className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-300 group-focus-within:text-blue-500 transition-colors">
                    <Icon name="Search" size={14} />
                  </div>
                  <input 
                    type="text"
                    value={layerSearchQuery}
                    onChange={(e) => setLayerSearchQuery(e.target.value)}
                    placeholder="搜索图层名称..."
                    className="w-full bg-slate-50 border border-slate-100 rounded-xl py-2 pl-9 pr-4 text-[11px] font-bold outline-none focus:bg-white focus:border-blue-400 transition-all shadow-sm"
                  />
               </div>
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
                     <td className="px-4 py-3.5 text-right">
                        <button 
                          onClick={() => setLayers(prev => prev.map(l => l.id === layer.id ? { ...l, visible: !l.visible } : l))}
                          className={`p-1.5 rounded-lg transition-colors ${layer.visible ? 'text-blue-600 bg-blue-50' : 'text-slate-300 hover:text-slate-400'}`}
                        >
                           <Icon name={layer.visible ? 'Eye' : 'EyeOff'} size={14} />
                        </button>
                     </td>
                   </tr>
                 ))}
               </tbody>
             </table>
          </div>
        ) : (
          <div className="flex flex-col h-full animate-in fade-in duration-300">
             <div className="p-3 border-b border-slate-50">
               <form onSubmit={handleSearch} className="relative group">
                  <div className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-300 group-focus-within:text-blue-500 transition-colors">
                    <Icon name="Search" size={14} />
                  </div>
                  <input 
                    type="text"
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    placeholder="全局文本搜索..."
                    className="w-full bg-slate-50 border border-slate-100 rounded-xl py-2 pl-9 pr-8 text-[11px] font-bold outline-none focus:bg-white focus:border-blue-400 transition-all shadow-sm"
                  />
                  {searchQuery && (
                    <button 
                      type="button"
                      onClick={() => { setSearchQuery(''); setSearchResults([]); }}
                      className="absolute right-2 top-1/2 -translate-y-1/2 text-slate-300 hover:text-slate-500"
                    >
                      <Icon name="XCircle" size={14} />
                    </button>
                  )}
               </form>
             </div>
             <div className="p-4 bg-slate-50/50 border-b border-slate-100 flex items-center justify-between">
                <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">搜索结果 ({searchResults.length})</span>
             </div>
             <div className="flex-1 overflow-y-auto custom-scrollbar p-3 space-y-2">
                {isSearching ? (
                  <div className="py-12 flex flex-col items-center justify-center text-slate-400 space-y-3">
                    <Icon name="Loader2" size={24} className="animate-spin" />
                    <p className="text-[10px] font-black uppercase tracking-widest">正在检索图纸内容...</p>
                  </div>
                ) : searchResults.length > 0 ? (
                  searchResults.map(res => (
                    <div 
                      key={res.id}
                      onClick={() => handleLocateText(res.id)}
                      className={`p-4 rounded-2xl border transition-all cursor-pointer group ${locatingTextId === res.id ? 'bg-blue-600 border-blue-600 shadow-lg scale-[1.02]' : 'bg-white border-slate-100 hover:border-blue-300 hover:shadow-md'}`}
                    >
                       <div className="flex items-start justify-between mb-1.5">
                          <h4 className={`text-xs font-black transition-colors ${locatingTextId === res.id ? 'text-white' : 'text-slate-800'}`}>{res.text}</h4>
                          <Icon name="Target" size={12} className={`transition-colors ${locatingTextId === res.id ? 'text-white/60' : 'text-slate-300 group-hover:text-blue-500'}`} />
                       </div>
                       <p className={`text-[10px] font-medium leading-relaxed transition-colors ${locatingTextId === res.id ? 'text-blue-100' : 'text-slate-400'}`}>
                         {res.location}
                       </p>
                    </div>
                  ))
                ) : (
                  <div className="py-12 flex flex-col items-center justify-center text-slate-300 opacity-60 text-center px-6">
                    <Icon name="MousePointer2" size={32} className="mb-2" />
                    <p className="text-[10px] font-black uppercase tracking-widest leading-relaxed">请输入搜索内容并按回车键开始查找</p>
                  </div>
                )}
             </div>
          </div>
        )}
      </div>

      {/* 识别文件按钮 */}
      <div className="p-4 border-t border-slate-100 bg-slate-50/30 shrink-0">
        <button 
          onClick={handleIdentifyFile}
          disabled={isProcessing}
          className="w-full flex items-center justify-center space-x-3 h-14 bg-white border-2 border-blue-500 text-blue-600 rounded-2xl font-black text-sm hover:bg-blue-50 transition-all active:scale-[0.98] shadow-sm group"
        >
          {isProcessing ? (
            <Icon name="Loader2" size={18} className="animate-spin" />
          ) : (
            <Icon name="Scan" size={18} className="group-hover:scale-110 transition-transform" />
          )}
          <span className="whitespace-nowrap">{isProcessing ? '深度识别中...' : '识别文件'}</span>
        </button>
      </div>
    </div>
  );

  const renderTabs = () => (
    <div className="flex items-center bg-white border-b border-slate-100 px-4 space-x-1 shrink-0 overflow-x-auto no-scrollbar shadow-sm">
      {openFileIds.map(id => {
        const file = fileList.find(f => f.id === id);
        if (!file) return null;
        const isActive = activeFileId === id;
        return (
          <div 
            key={id}
            onClick={() => setActiveFileId(id)}
            className={`group h-10 px-4 flex items-center space-x-2 cursor-pointer border-b-2 transition-all relative whitespace-nowrap ${isActive ? 'border-blue-600 bg-blue-50/30' : 'border-transparent hover:bg-slate-50 text-slate-400'}`}
          >
            <Icon name="FileCode" size={14} className={isActive ? 'text-blue-600' : 'text-slate-300'} />
            <span className={`text-[11px] font-bold transition-colors ${isActive ? 'text-blue-700' : 'text-slate-500 group-hover:text-slate-700'}`}>{file.name}</span>
            <button 
              onClick={(e) => handleCloseTab(e, id)}
              className={`p-1 rounded-md transition-all hover:bg-slate-200/60 ${isActive ? 'text-blue-400 hover:text-blue-600' : 'text-slate-300 hover:text-slate-500'}`}
            >
              <Icon name="X" size={12} />
            </button>
          </div>
        );
      })}
    </div>
  );

  const renderPreview = () => (
    <div className="flex-1 flex flex-col bg-slate-100 overflow-hidden relative group">
      {!activeFileId ? (
        <div className="flex-1 flex flex-col items-center justify-center text-slate-300 space-y-4">
          <Icon name="FileSearch" size={80} strokeWidth={1} />
          <p className="font-bold text-sm">请在图纸列表点击或导入文件开始查看</p>
        </div>
      ) : (
        <div 
          ref={previewRef}
          onMouseMove={handleMouseMove}
          onMouseEnter={() => setIsHoveringPreview(true)}
          onMouseLeave={() => setIsHoveringPreview(false)}
          className={`flex-1 relative flex items-center justify-center bg-[#0d0d0d] m-4 rounded-[32px] overflow-hidden border border-slate-800 shadow-2xl group/preview ${activeTool ? 'cursor-crosshair' : ''}`}
        >
          
          {/* 测量工具栏 */}
          <div className="absolute top-4 left-1/2 -translate-x-1/2 flex bg-white/95 backdrop-blur-xl border border-slate-200 rounded-xl p-0.5 shadow-2xl z-40 animate-in slide-in-from-top-4 duration-500 overflow-hidden">
             <div className="flex items-center space-x-0.5">
               <button onClick={() => handleToolClick('align')} className={`flex items-center space-x-1.5 px-3 py-1 rounded-lg transition-all ${activeTool === 'align' ? 'bg-blue-600 text-white' : 'text-slate-600 hover:bg-blue-50'}`}><Icon name="Ruler" size={13} /><span className="text-[10px] font-black uppercase tracking-widest whitespace-nowrap">对齐</span></button>
               <button onClick={() => handleToolClick('linear')} className={`flex items-center space-x-1.5 px-3 py-1 rounded-lg transition-all ${activeTool === 'linear' ? 'bg-blue-600 text-white' : 'text-slate-600 hover:bg-blue-50'}`}><Icon name="MoveHorizontal" size={13} /><span className="text-[10px] font-black uppercase tracking-widest whitespace-nowrap">线性</span></button>
               <button onClick={() => handleToolClick('area')} className={`flex items-center space-x-1.5 px-3 py-1 rounded-lg transition-all ${activeTool === 'area' ? 'bg-blue-600 text-white' : 'text-slate-600 hover:bg-blue-50'}`}><Icon name="Triangle" size={13} /><span className="text-[10px] font-black uppercase tracking-widest whitespace-nowrap">面积</span></button>
               <button onClick={() => handleToolClick('rect')} className={`flex items-center space-x-1.5 px-3 py-1 rounded-lg transition-all ${activeTool === 'rect' ? 'bg-blue-600 text-white' : 'text-slate-600 hover:bg-blue-50'}`}><Icon name="Square" size={13} /><span className="text-[10px] font-black uppercase tracking-widest whitespace-nowrap">矩形面积</span></button>
               <button onClick={() => handleToolClick('coord')} className={`flex items-center space-x-1.5 px-3 py-1 rounded-lg transition-all ${activeTool === 'coord' ? 'bg-blue-600 text-white' : 'text-slate-600 hover:bg-blue-50'}`}><Icon name="Crosshair" size={13} /><span className="text-[10px] font-black uppercase tracking-widest whitespace-nowrap">坐标标注</span></button>
               <div className="w-px h-4 bg-slate-200 mx-1"></div>
               <button onClick={() => handleToolClick('scaling')} className={`flex items-center space-x-1.5 px-3 py-1 rounded-lg transition-all ${activeTool === 'scaling' ? 'bg-blue-600 text-white' : 'text-slate-600 hover:bg-blue-50'}`}><Icon name="Scaling" size={13} /><span className="text-[10px] font-black uppercase tracking-widest whitespace-nowrap">设置比例</span></button>
             </div>
          </div>

          {/* 浮动控制栏 */}
          <div className="absolute top-4 right-8 flex bg-white/10 backdrop-blur-md rounded-xl p-0.5 border border-white/10 z-40 group-hover/preview:opacity-100 opacity-0 transition-opacity">
            <button className="p-1.5 text-white/80 hover:text-white hover:bg-white/10 rounded-lg transition-all"><Icon name="ZoomIn" size={16} /></button>
            <button className="p-1.5 text-white/80 hover:text-white hover:bg-white/10 rounded-lg transition-all"><Icon name="ZoomOut" size={16} /></button>
            <button className="p-1.5 text-white/80 hover:text-white hover:bg-white/10 rounded-lg transition-all"><Icon name="Maximize" size={16} /></button>
          </div>

          {/* 实时坐标悬浮窗 */}
          {isHoveringPreview && (
            <div className="absolute bottom-6 right-8 bg-white/90 backdrop-blur-xl border border-slate-200/60 px-5 py-3 rounded-2xl text-slate-800 shadow-[0_8px_30px_rgb(0,0,0,0.12)] z-40 pointer-events-none flex flex-col space-y-2.5 min-w-[180px] animate-in fade-in zoom-in-95 duration-200">
               <div className="flex items-center justify-between space-x-6 border-b border-slate-100 pb-2">
                  <div className="flex items-center space-x-2">
                    <span className="text-[10px] font-black text-slate-400">X</span>
                    <span className="font-mono text-[11px] font-bold">{mouseCoord.x.toLocaleString()}</span>
                  </div>
                  <div className="flex items-center space-x-2">
                    <span className="text-[10px] font-black text-slate-400">Y</span>
                    <span className="font-mono text-[11px] font-bold">{mouseCoord.y.toLocaleString()}</span>
                  </div>
               </div>
               <div className="flex items-center space-x-2">
                  <Icon name="Layers" size={12} className="text-blue-500" />
                  <div className="flex flex-col">
                     <span className="text-[9px] font-black text-slate-400 uppercase tracking-tighter leading-none mb-0.5">Current Layer</span>
                     <span className="text-[11px] font-black text-slate-700 truncate max-w-[140px]">{currentHoverLayer}</span>
                  </div>
               </div>
            </div>
          )}

          {/* 定位高亮 */}
          {locatingTextId && (
            <div 
              className="absolute w-48 h-48 border-[4px] border-blue-500 rounded-[40px] shadow-[0_0_100px_rgba(59,130,246,0.6)] animate-in zoom-in-50 duration-300 flex items-center justify-center z-20 pointer-events-none"
              style={{ 
                left: `${searchResults.find(r => r.id === locatingTextId)?.pos.x}%`, 
                top: `${searchResults.find(r => r.id === locatingTextId)?.pos.y}%`,
                transform: 'translate(-50%, -50%)'
              }}
            >
               <div className="bg-blue-600 text-white px-4 py-1.5 rounded-full text-xs font-black absolute -top-12 shadow-xl whitespace-nowrap animate-bounce">
                  找到文本: {searchResults.find(r => r.id === locatingTextId)?.text}
               </div>
               <div className="w-16 h-16 border-[6px] border-blue-400/30 rounded-full animate-ping"></div>
            </div>
          )}

          <img 
            src="https://img.js.design/assets/static/f5869e594d216d97e7488031d2797e59?x-oss-process=image/resize,w_1500/format,webp" 
            className={`max-w-full max-h-full object-contain transition-all duration-700 ${locatingTextId ? 'opacity-40 scale-110 blur-[1px]' : 'opacity-80'}`} 
            alt="CAD Drawing" 
          />
        </div>
      )}
    </div>
  );

  const renderIdentifyModal = () => {
    if (!isIdentifyModalOpen) return null;
    const currentPreviewResult = RECOGNITION_DATA.find(r => r.id === previewResultId);

    return (
      <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/50 backdrop-blur-sm p-4 animate-in fade-in duration-200">
        <div className="bg-white rounded-[32px] shadow-2xl w-full max-w-6xl h-[85vh] flex flex-col animate-in zoom-in-95 duration-200 overflow-hidden border border-slate-200">
          <div className="px-8 py-6 border-b border-slate-100 flex items-center justify-between shrink-0 bg-white">
            <div className="flex items-center space-x-4">
               <div className="w-12 h-12 bg-blue-50 text-blue-600 rounded-2xl flex items-center justify-center shadow-inner">
                  <Icon name="ScanLine" size={28} />
               </div>
               <div>
                  <h3 className="text-xl font-black text-slate-800">图纸智能识别结果</h3>
                  <p className="text-[11px] text-slate-400 font-bold uppercase tracking-widest">AI Recognition Results Inventory</p>
               </div>
            </div>
            <button onClick={() => setIsIdentifyModalOpen(false)} className="p-2 text-slate-300 hover:text-slate-600 transition-colors">
              <Icon name="X" size={28} />
            </button>
          </div>

          <div className="flex-1 flex overflow-hidden">
            <div className="w-96 border-r border-slate-100 flex flex-col shrink-0 bg-slate-50/30">
               <div className="p-4 border-b border-slate-100 flex items-center justify-between bg-white shrink-0">
                  <label className="flex items-center space-x-2 cursor-pointer group">
                    <div 
                      onClick={handleToggleSelectAll}
                      className={`w-5 h-5 rounded-md border-2 flex items-center justify-center transition-all ${selectedResultIds.size === RECOGNITION_DATA.length ? 'bg-blue-600 border-blue-600' : 'border-slate-200 bg-white group-hover:border-blue-400'}`}
                    >
                      {selectedResultIds.size === RECOGNITION_DATA.length ? <Icon name="Check" size={14} className="text-white" strokeWidth={4} /> : null}
                    </div>
                    <span className="text-[11px] font-black text-slate-500 uppercase tracking-widest">全选 ({selectedResultIds.size})</span>
                  </label>
               </div>
               <div className="flex-1 overflow-y-auto custom-scrollbar p-3 space-y-2">
                  {RECOGNITION_DATA.map(result => (
                    <div 
                      key={result.id}
                      onClick={() => setPreviewResultId(result.id)}
                      className={`p-4 rounded-2xl border transition-all cursor-pointer group flex items-start space-x-3 relative ${previewResultId === result.id ? 'bg-white border-blue-200 shadow-md ring-1 ring-blue-50' : 'bg-transparent border-transparent hover:bg-white hover:border-slate-200'}`}
                    >
                       <div 
                        onClick={(e) => handleToggleResult(e, result.id)}
                        className={`mt-1 shrink-0 w-4 h-4 rounded border-2 flex items-center justify-center transition-all ${selectedResultIds.has(result.id) ? 'bg-blue-600 border-blue-600' : 'border-slate-200 bg-white group-hover:border-blue-400'}`}
                       >
                         {selectedResultIds.has(result.id) && <Icon name="Check" size={10} className="text-white" strokeWidth={5} />}
                       </div>
                       <div className="flex-1 min-w-0">
                          <div className="flex items-center space-x-2 mb-1">
                             <Icon name={result.type === 'table' ? 'Table2' : 'Type'} size={12} className={previewResultId === result.id ? 'text-blue-500' : 'text-slate-400'} />
                             <h4 className={`text-xs font-black truncate ${previewResultId === result.id ? 'text-blue-700' : 'text-slate-700'}`}>{result.title}</h4>
                          </div>
                          <p className="text-[10px] text-slate-400 font-medium line-clamp-1">{result.summary}</p>
                       </div>
                    </div>
                  ))}
               </div>
            </div>
            <div className="flex-1 flex flex-col bg-white overflow-hidden relative">
               <div className="p-8 flex flex-col h-full">
                  <div className="flex items-center space-x-3 mb-8 shrink-0">
                     <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${currentPreviewResult?.type === 'table' ? 'bg-emerald-50 text-emerald-600' : 'bg-blue-50 text-blue-600'}`}>
                        <Icon name={currentPreviewResult?.type === 'table' ? 'Table2' : 'Type'} size={20} />
                     </div>
                     <div>
                        <h4 className="text-lg font-black text-slate-800">{currentPreviewResult?.title}</h4>
                        <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Detail Preview Content</p>
                     </div>
                  </div>
                  <div className="flex-1 bg-slate-50/50 rounded-[32px] border border-slate-100 p-8 overflow-y-auto custom-scrollbar shadow-inner">
                     {currentPreviewResult?.type === 'table' ? (
                        <div className="bg-white rounded-2xl border border-slate-200 overflow-hidden shadow-sm">
                           <table className="w-full text-left border-collapse">
                              <thead className="bg-slate-50 border-b border-slate-100">
                                 <tr className="text-[10px] font-black text-slate-400 uppercase tracking-widest">
                                    {Object.keys(currentPreviewResult.details[0]).map(key => (
                                       <th key={key} className="px-6 py-4">{key === 'code' ? '编码' : key === 'name' ? '名称' : key === 'spec' ? '规格' : key === 'qty' ? '数量' : key === 'steel' ? '钢筋' : key === 'stirrup' ? '箍筋' : key}</th>
                                    ))}
                                 </tr>
                              </thead>
                              <tbody className="divide-y divide-slate-50">
                                 {currentPreviewResult.details.map((row: any, i: number) => (
                                    <tr key={i} className="hover:bg-blue-50/30 transition-colors">
                                       {Object.values(row).map((val: any, j: number) => (
                                          <td key={j} className="px-6 py-4 text-xs font-bold text-slate-600">{val}</td>
                                       ))}
                                    </tr>
                                 ))}
                              </tbody>
                           </table>
                        </div>
                     ) : (
                        <div className="bg-white rounded-2xl border border-slate-200 p-8 shadow-sm">
                           <p className="text-sm text-slate-600 leading-loose font-medium whitespace-pre-wrap italic">{currentPreviewResult?.details}</p>
                        </div>
                     )}
                  </div>
               </div>
            </div>
          </div>
          <div className="px-8 py-6 border-t border-slate-100 bg-slate-50/50 flex items-center justify-end shrink-0">
             <button onClick={() => alert(`已成功导出选中的 ${selectedResultIds.size} 个识别文件`)} disabled={selectedResultIds.size === 0} className="px-12 py-3 bg-blue-600 text-white rounded-2xl text-sm font-black shadow-xl shadow-blue-500/20 hover:bg-blue-700 transition-all active:scale-95 disabled:opacity-40 disabled:grayscale">导出选中的文件</button>
          </div>
        </div>
      </div>
    );
  };

  const renderConvertModal = () => {
    if (!isConvertModalOpen) return null;
    const activeFile = fileList.find(f => f.id === activeFileId);
    return (
      <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/50 backdrop-blur-sm p-4 animate-in fade-in duration-200">
        <div className="bg-white rounded-[32px] shadow-2xl w-full max-w-lg p-8 flex flex-col animate-in zoom-in-95 duration-200 border border-slate-200 overflow-hidden relative">
          <div className="flex items-center justify-between mb-8">
            <div className="flex items-center space-x-4">
              <div className="w-12 h-12 bg-blue-50 text-blue-600 rounded-2xl flex items-center justify-center shadow-inner"><Icon name="RefreshCcw" size={24} /></div>
              <h3 className="text-xl font-black text-slate-800">文件格式转换</h3>
            </div>
            <button onClick={() => setIsConvertModalOpen(false)} className="text-slate-300 hover:text-slate-600 p-1"><Icon name="X" size={24} /></button>
          </div>
          <div className="bg-slate-50 p-4 rounded-2xl border border-slate-100 mb-8 flex items-center space-x-3">
             <Icon name="FileCode" size={16} className="text-blue-500 shrink-0" />
             <p className="text-xs font-bold text-slate-600 truncate flex-1">当前文件：{activeFile?.name || '未选择'}</p>
          </div>
          <div className="space-y-3 mb-10">
            <p className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] ml-1 mb-2">选择导出格式</p>
            <div className="grid grid-cols-1 gap-2.5">
              {EXPORT_FORMATS.map(fmt => (
                <label key={fmt.id} onClick={() => setSelectedExportFormat(fmt.id)} className={`flex items-center justify-between p-4 rounded-2xl border-2 transition-all cursor-pointer group ${selectedExportFormat === fmt.id ? 'border-blue-500 bg-blue-50 shadow-md ring-2 ring-blue-50' : 'border-slate-50 bg-slate-50/50 hover:border-blue-200'}`}>
                  <div className="flex items-center space-x-4">
                    <div className={`w-8 h-8 rounded-lg ${fmt.bg} ${fmt.color} flex items-center justify-center`}><Icon name={fmt.icon} size={16} /></div>
                    <span className={`text-xs font-black ${selectedExportFormat === fmt.id ? 'text-blue-700' : 'text-slate-500'}`}>{fmt.name}</span>
                  </div>
                  <div className={`w-5 h-5 rounded-full border-2 flex items-center justify-center transition-all ${selectedExportFormat === fmt.id ? 'border-blue-500 bg-blue-500' : 'border-slate-200'}`}>{selectedExportFormat === fmt.id && <div className="w-1.5 h-1.5 bg-white rounded-full"></div>}</div>
                </label>
              ))}
            </div>
          </div>
          <div className="flex space-x-4">
             <button onClick={() => setIsConvertModalOpen(false)} className="flex-none w-28 py-3.5 bg-slate-100 text-slate-900 rounded-2xl font-black text-sm hover:bg-slate-200 transition-all">取消</button>
             <button onClick={handleExport} className="flex-1 py-3.5 bg-blue-600 text-white rounded-2xl font-black text-sm shadow-xl shadow-blue-500/20 hover:bg-blue-700 transition-all active:scale-95">确认转换并导出</button>
          </div>
        </div>
      </div>
    );
  };

  const renderUploadModal = () => {
    if (!isUploadModalOpen) return null;
    return (
      <div className="fixed inset-0 z-[200] flex items-center justify-center bg-black/60 backdrop-blur-sm p-4 animate-in fade-in duration-200">
        <div className="bg-white rounded-[40px] shadow-2xl w-full max-w-2xl overflow-hidden flex flex-col animate-in zoom-in-95 duration-300">
          <div className="px-8 py-6 border-b border-slate-100 flex items-center justify-between bg-white">
            <div className="flex items-center space-x-4">
              <div className="w-12 h-12 bg-blue-50 text-blue-600 rounded-2xl flex items-center justify-center shadow-inner"><Icon name="UploadCloud" size={28} /></div>
              <div><h3 className="text-xl font-black text-slate-800">导入图纸文件</h3><p className="text-[11px] text-slate-400 font-bold uppercase tracking-widest">Support DWG, DXF, PDF Formats</p></div>
            </div>
            <button onClick={() => { setIsUploadModalOpen(false); setPendingFiles([]); }} className="text-slate-300 hover:text-slate-600 transition-colors"><Icon name="X" size={28} /></button>
          </div>
          <div className="p-8 space-y-6">
            <div onClick={handlePickFiles} className="w-full border-2 border-dashed border-slate-200 rounded-[32px] py-12 flex flex-col items-center justify-center space-y-4 hover:bg-blue-50 hover:border-blue-400 transition-all cursor-pointer group"><div className="w-16 h-16 bg-slate-50 rounded-full flex items-center justify-center text-slate-300 group-hover:bg-blue-100 group-hover:text-blue-600 transition-all"><Icon name="Plus" size={32} strokeWidth={3} /></div><div className="text-center"><p className="text-base font-black text-slate-700">点击或将文件拖拽至此处</p><p className="text-xs text-slate-400 mt-1 font-medium">支持多选，单文件最大 50MB</p></div></div>
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

  return (
    <div className="flex-1 flex flex-col h-full bg-white overflow-hidden">
      {renderIntegratedHeader()}
      <div className="flex-1 flex overflow-hidden">
        {/* 左侧主图区域 */}
        <div className="flex-1 flex flex-col overflow-hidden relative">
          {renderTabs()}
          {renderPreview()}
        </div>
        
        {/* 右侧侧边栏 */}
        {renderSidebar()}
      </div>
      {renderIdentifyModal()}
      {renderUploadModal()}
      {renderConvertModal()}
    </div>
  );
};

export default AICadViewerView;