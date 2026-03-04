
import React, { useState, useMemo } from 'react';
import Icon from './Icon';

interface ConvertFile {
  id: string;
  name: string;
  size: string;
  status: 'ready' | 'processing' | 'completed' | 'error';
  progress: number;
  targetFormat: string;
  targetVersion?: string;
}

const CAD_VERSIONS = ['AutoCAD 2018', 'AutoCAD 2013', 'AutoCAD 2010', 'AutoCAD 2007', 'AutoCAD 2004', 'AutoCAD 2000'];
const IMAGE_FORMATS = ['PDF (高清文档)', 'PNG (透明背景)', 'JPG (标准图片)', 'SVG (矢量绘图)'];

interface AICadConvertViewProps {
  onBack?: () => void;
}

const AICadConvertView: React.FC<AICadConvertViewProps> = ({ onBack }) => {
  const [files, setFiles] = useState<ConvertFile[]>([]);
  const [targetMode, setTargetMode] = useState<'version' | 'format'>('version');
  const [selectedVersion, setSelectedVersion] = useState(CAD_VERSIONS[2]);
  const [selectedFormat, setSelectedFormat] = useState(IMAGE_FORMATS[0]);
  const [isConverting, setIsConverting] = useState(false);

  // 弹窗相关状态
  const [isUploadModalOpen, setIsUploadModalOpen] = useState(false);
  const [pendingFiles, setPendingFiles] = useState<ConvertFile[]>([]);

  const handleOpenUploadModal = () => {
    setIsUploadModalOpen(true);
    setPendingFiles([]);
  };

  const handlePickFiles = () => {
    const newFiles: ConvertFile[] = [
      { 
        id: Date.now().toString() + '-p1', 
        name: '首层建筑平面图_v2025.dwg', 
        size: '12.4MB', 
        status: 'ready', 
        progress: 0, 
        targetFormat: 'DWG' 
      },
      { 
        id: Date.now().toString() + '-p2', 
        name: '地下室给排水大样.dxf', 
        size: '5.8MB', 
        status: 'ready', 
        progress: 0, 
        targetFormat: 'DWG' 
      },
    ];
    setPendingFiles(prev => [...prev, ...newFiles]);
  };

  const handleConfirmUpload = () => {
    if (pendingFiles.length > 0) {
      setFiles(prev => [...prev, ...pendingFiles]);
    }
    setIsUploadModalOpen(false);
    setPendingFiles([]);
  };

  const startConversion = () => {
    setIsConverting(true);
    setFiles(prev => prev.map(f => ({ ...f, status: 'processing', progress: 0 })));

    // 模拟转换进度
    files.forEach((file, index) => {
      let prog = 0;
      const interval = setInterval(() => {
        prog += Math.random() * 30;
        if (prog >= 100) {
          prog = 100;
          clearInterval(interval);
          setFiles(current => current.map(f => f.id === file.id ? { ...f, status: 'completed', progress: 100 } : f));
          if (index === files.length - 1) setIsConverting(false);
        } else {
          setFiles(current => current.map(f => f.id === file.id ? { ...f, progress: Math.floor(prog) } : f));
        }
      }, 400);
    });
  };

  const clearList = () => {
    setFiles([]);
    setIsConverting(false);
  };

  const renderUploadModal = () => {
    if (!isUploadModalOpen) return null;
    return (
      <div className="fixed inset-0 z-[200] flex items-center justify-center bg-black/60 backdrop-blur-sm p-4 animate-in fade-in duration-200">
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
            <div 
              onClick={handlePickFiles}
              className="w-full border-2 border-dashed border-slate-200 rounded-[32px] py-12 flex flex-col items-center justify-center space-y-4 hover:bg-emerald-50 hover:border-emerald-400 transition-all cursor-pointer group"
            >
              <div className="w-16 h-16 bg-slate-50 rounded-full flex items-center justify-center text-slate-300 group-hover:bg-emerald-100 group-hover:text-emerald-600 transition-all">
                <Icon name="Plus" size={32} strokeWidth={3} />
              </div>
              <div className="text-center">
                <p className="text-base font-black text-slate-700">点击或将文件拖拽至此处</p>
                <p className="text-xs text-slate-400 mt-1 font-medium">支持多选，单文件最大 50MB</p>
              </div>
            </div>

            {pendingFiles.length > 0 && (
              <div className="space-y-2">
                <h4 className="text-[10px] font-black text-slate-400 uppercase tracking-widest px-1">准备导入 ({pendingFiles.length})</h4>
                <div className="max-h-48 overflow-y-auto custom-scrollbar pr-2 space-y-2">
                  {pendingFiles.map(f => (
                    <div key={f.id} className="bg-slate-50 rounded-xl p-3 flex items-center justify-between group">
                      <div className="flex items-center space-x-3">
                        <Icon name="FileCode" size={16} className="text-blue-500" />
                        <span className="text-xs font-bold text-slate-700 truncate max-w-[300px]">{f.name}</span>
                        <span className="text-[10px] text-slate-400 font-medium">{f.size}</span>
                      </div>
                      <button 
                        onClick={() => setPendingFiles(prev => prev.filter(p => p.id !== f.id))}
                        className="text-slate-300 hover:text-rose-500 transition-colors"
                      >
                        <Icon name="XCircle" size={16} />
                      </button>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>

          <div className="px-8 py-6 border-t border-slate-100 bg-slate-50/50 flex items-center justify-end space-x-4">
            <button onClick={() => { setIsUploadModalOpen(false); setPendingFiles([]); }} className="px-8 py-3 rounded-2xl text-sm font-black text-slate-500 hover:bg-slate-100 transition-all">取消</button>
            <button 
              onClick={handleConfirmUpload}
              disabled={pendingFiles.length === 0}
              className="px-10 py-3 bg-blue-600 text-white rounded-2xl text-sm font-black shadow-xl shadow-blue-500/20 hover:bg-blue-700 transition-all active:scale-95 disabled:opacity-30"
            >
              确认导入
            </button>
          </div>
        </div>
      </div>
    );
  };

  return (
    <div className="flex-1 flex flex-col h-full bg-[#f8fafc] overflow-hidden animate-in fade-in duration-500">
      {/* 顶部页头 */}
      <div className="px-8 py-4 border-b border-slate-100 flex items-center justify-between shrink-0 bg-white shadow-sm z-30">
        <div className="flex items-center space-x-4">
          <button 
            onClick={onBack}
            className="p-2 text-slate-400 hover:text-emerald-600 hover:bg-emerald-50 rounded-xl transition-all"
            title="返回模块选择"
          >
            <Icon name="ArrowLeft" size={24} />
          </button>
          <div className="flex items-center space-x-3">
            <div className="w-10 h-10 bg-emerald-50 text-emerald-600 rounded-xl flex items-center justify-center">
              <Icon name="ArrowLeftRight" size={20} />
            </div>
            <div>
              <h1 className="text-lg font-black text-slate-800 tracking-tight">CAD格式转换</h1>
              <p className="text-[10px] text-slate-400 font-bold uppercase tracking-widest">Version Down-grade & Format Conversion</p>
            </div>
          </div>
        </div>

        <div className="flex items-center space-x-3">
           {files.length > 0 && (
             <button 
               onClick={clearList}
               className="px-5 py-2 text-slate-400 hover:text-rose-500 font-bold text-xs transition-colors"
             >
               清空列表
             </button>
           )}
        </div>
      </div>

      <div className="flex-1 flex overflow-hidden">
        {/* 左侧配置面板 */}
        <div className="w-80 bg-white border-r border-slate-100 flex flex-col shrink-0 z-20">
           <div className="p-6 space-y-8">
              {/* 转换模式切换 */}
              <div className="space-y-3">
                <label className="text-[11px] font-black text-slate-400 uppercase tracking-widest px-1">转换目标类型</label>
                <div className="grid grid-cols-2 gap-2 bg-slate-50 p-1.5 rounded-[20px] border border-slate-100">
                  <button 
                    onClick={() => setTargetMode('version')}
                    className={`py-3 rounded-2xl text-[11px] font-black transition-all ${targetMode === 'version' ? 'bg-white text-emerald-600 shadow-sm ring-1 ring-slate-100' : 'text-slate-400 hover:text-slate-600'}`}
                  >
                    版本降级
                  </button>
                  <button 
                    onClick={() => setTargetMode('format')}
                    className={`py-3 rounded-2xl text-[11px] font-black transition-all ${targetMode === 'format' ? 'bg-white text-emerald-600 shadow-sm ring-1 ring-slate-100' : 'text-slate-400 hover:text-slate-600'}`}
                  >
                    格式转图
                  </button>
                </div>
              </div>

              {/* 详细选项 */}
              <div className="space-y-4">
                 <div className="flex items-center space-x-2 px-1">
                    <div className="w-1 h-4 bg-emerald-500 rounded-full"></div>
                    <h4 className="text-sm font-black text-slate-700">{targetMode === 'version' ? '选择目标 CAD 版本' : '选择导出格式'}</h4>
                 </div>
                 
                 <div className="space-y-2">
                    {(targetMode === 'version' ? CAD_VERSIONS : IMAGE_FORMATS).map(item => (
                      <button 
                        key={item}
                        onClick={() => targetMode === 'version' ? setSelectedVersion(item) : setSelectedFormat(item)}
                        className={`w-full text-left p-4 rounded-2xl border transition-all flex items-center justify-between group ${
                          (targetMode === 'version' ? selectedVersion : selectedFormat) === item 
                          ? 'bg-emerald-50 border-emerald-200 ring-2 ring-emerald-50' 
                          : 'bg-white border-slate-100 hover:border-emerald-200 hover:bg-slate-50/50'
                        }`}
                      >
                         <span className={`text-xs font-bold ${ (targetMode === 'version' ? selectedVersion : selectedFormat) === item ? 'text-emerald-700' : 'text-slate-600'}`}>{item}</span>
                         {(targetMode === 'version' ? selectedVersion : selectedFormat) === item && (
                            <Icon name="CheckCircle2" size={16} className="text-emerald-500" />
                         )}
                      </button>
                    ))}
                 </div>
              </div>
           </div>
        </div>

        {/* 右侧主工作区 */}
        <div className="flex-1 flex flex-col bg-slate-50 relative overflow-hidden">
            <div className="flex-1 flex flex-col overflow-hidden p-8 animate-in slide-in-from-bottom-2 duration-500">
               <div className="flex items-center justify-between mb-8">
                  <div className="flex items-center space-x-4">
                    <div className="flex items-baseline space-x-2">
                      <h2 className="text-2xl font-black text-slate-900">待转换任务</h2>
                      <span className="text-slate-400 font-bold text-sm">{files.length > 0 ? `已添加 ${files.length} 个项目` : '暂无项目'}</span>
                    </div>
                    <button 
                       onClick={handleOpenUploadModal}
                       className="flex items-center space-x-2 px-6 py-2 bg-white border border-slate-200 text-slate-700 rounded-xl text-xs font-black shadow-sm hover:border-emerald-400 transition-all active:scale-95"
                    >
                       <Icon name="Plus" size={16} />
                       <span>添加图纸</span>
                    </button>
                  </div>
                  {files.length > 0 && (
                    <button 
                      onClick={startConversion}
                      disabled={isConverting}
                      className="px-10 py-4 bg-blue-600 text-white rounded-[24px] font-black text-sm shadow-2xl shadow-blue-500/20 hover:bg-blue-700 transition-all active:scale-95 disabled:opacity-50 flex items-center space-x-3"
                    >
                      {isConverting ? (
                        <Icon name="Loader2" size={18} className="animate-spin" />
                      ) : (
                        <Icon name="Zap" size={18} fill="currentColor" />
                      )}
                      <span>开始批量转换任务</span>
                    </button>
                  )}
               </div>

               <div className="flex-1 bg-white border border-slate-100 rounded-[40px] shadow-sm overflow-hidden flex flex-col">
                  {files.length === 0 ? (
                    <div className="flex-1 flex flex-col items-center justify-center text-slate-300 space-y-4">
                       <Icon name="Inbox" size={64} strokeWidth={1} />
                       <p className="font-bold text-sm">任务列表为空，请点击“添加图纸”开始</p>
                    </div>
                  ) : (
                    <div className="overflow-x-auto flex-1 custom-scrollbar">
                      <table className="w-full border-collapse">
                        <thead className="bg-slate-50/80 sticky top-0 z-10 border-b border-slate-100">
                            <tr className="text-[11px] font-black text-slate-400 uppercase tracking-widest text-left">
                              <th className="px-8 py-5">图纸文件信息</th>
                              <th className="px-6 py-5">目标配置</th>
                              <th className="px-6 py-5">转换状态</th>
                              <th className="px-8 py-5 text-right">操作</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-50">
                            {files.map(file => (
                              <tr key={file.id} className="group hover:bg-slate-50/50 transition-colors">
                                <td className="px-8 py-6">
                                    <div className="flex items-center space-x-4">
                                      <div className="w-12 h-12 rounded-2xl bg-blue-50 text-blue-500 flex items-center justify-center shadow-sm">
                                          <Icon name="FileCode" size={24} />
                                      </div>
                                      <div className="min-w-0">
                                          <p className="text-sm font-bold text-slate-700 truncate mb-0.5">{file.name}</p>
                                          <p className="text-[11px] text-slate-400 font-medium">{file.size}</p>
                                      </div>
                                    </div>
                                </td>
                                <td className="px-6 py-6">
                                    <div className="flex flex-col space-y-1">
                                      <span className="text-[10px] font-black text-emerald-600 uppercase">Target: {targetMode === 'version' ? 'Version Down' : 'Format'}</span>
                                      <span className="text-xs font-bold text-slate-600">{targetMode === 'version' ? selectedVersion : selectedFormat}</span>
                                    </div>
                                </td>
                                <td className="px-6 py-6">
                                    <div className="max-w-[140px] space-y-2">
                                      <div className="flex items-center justify-between">
                                          <span className={`text-[10px] font-black uppercase ${
                                            file.status === 'completed' ? 'text-emerald-500' : 
                                            file.status === 'processing' ? 'text-blue-500' : 'text-slate-300'
                                          }`}>
                                            {file.status === 'completed' ? '已完成' : 
                                            file.status === 'processing' ? `处理中 ${file.progress}%` : '等待中'}
                                          </span>
                                          {file.status === 'completed' && <Icon name="Check" size={12} className="text-emerald-500" strokeWidth={4} />}
                                      </div>
                                      <div className="w-full h-1.5 bg-slate-100 rounded-full overflow-hidden">
                                          <div 
                                            className={`h-full transition-all duration-500 ${
                                              file.status === 'completed' ? 'bg-emerald-500' : 'bg-blue-500'
                                            }`} 
                                            style={{ width: `${file.progress}%` }} 
                                          />
                                      </div>
                                    </div>
                                </td>
                                <td className="px-8 py-6 text-right">
                                    {file.status === 'completed' ? (
                                      <button className="inline-flex items-center space-x-2 px-5 py-2 bg-emerald-50 text-emerald-600 rounded-xl text-xs font-black hover:bg-emerald-600 hover:text-white transition-all shadow-sm">
                                          <Icon name="Download" size={14} />
                                          <span>下载结果</span>
                                      </button>
                                    ) : (
                                      <button 
                                        onClick={() => setFiles(prev => prev.filter(f => f.id !== file.id))}
                                        disabled={isConverting}
                                        className="p-2.5 text-slate-300 hover:text-rose-500 transition-colors disabled:opacity-0"
                                      >
                                        <Icon name="Trash2" size={18} />
                                      </button>
                                    )}
                                </td>
                              </tr>
                            ))}
                        </tbody>
                      </table>
                    </div>
                  )}

                  {/* 底部汇总动作 */}
                  {files.some(f => f.status === 'completed') && (
                    <div className="p-8 bg-slate-50/50 border-t border-slate-100 flex items-center justify-between">
                       <p className="text-xs font-bold text-slate-500">
                         完成转换：<span className="text-emerald-600">{files.filter(f => f.status === 'completed').length}</span> / {files.length}
                       </p>
                       <div className="flex items-center space-x-3">
                         <button className="px-8 py-2.5 bg-emerald-600 text-white rounded-2xl text-xs font-black shadow-xl shadow-emerald-500/20 hover:bg-emerald-700 transition-all flex items-center space-x-2">
                           <Icon name="Package" size={16} />
                           <span>全部打包下载</span>
                         </button>
                       </div>
                    </div>
                  )}
               </div>
            </div>
        </div>
      </div>
      {renderUploadModal()}
    </div>
  );
};

export default AICadConvertView;
