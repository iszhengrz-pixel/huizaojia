import React, { useState, useRef, useEffect } from 'react';
import { createPortal } from 'react-dom';
import Icon from './Icon';
import RebiddingCheckResultView from './RebiddingCheckResultView';

interface FileItem {
  id: string;
  name: string;
  size: string;
  uploadTime: string;
}

interface NewRebiddingProjectViewProps {
  onBack: () => void;
  mode?: 'new' | 'edit';
}

const NewRebiddingProjectView: React.FC<NewRebiddingProjectViewProps> = ({ onBack, mode = 'new' }) => {
  const [projectName, setProjectName] = useState('');
  const [showResultView, setShowResultView] = useState(false);
  
  // 文件导入相关状态
  const [controlPrice, setControlPrice] = useState('');
  const [floatRangeDown, setFloatRangeDown] = useState('');
  const [floatRangeUp, setFloatRangeUp] = useState('');
  const [floatSignDown, setFloatSignDown] = useState<'-' | '+'>('-');
  const [floatSignUp, setFloatSignUp] = useState<'-' | '+'>('-');
  const [limitRangeMin, setLimitRangeMin] = useState('');
  const [limitRangeMax, setLimitRangeMax] = useState('');

  // 联动计算逻辑
  const handleControlPriceChange = (val: string) => {
    setControlPrice(val);
    calculateLimitRange(val, floatRangeDown, floatSignDown, floatRangeUp, floatSignUp);
  };

  const handleFloatRangeChange = (type: 'down' | 'up', val: string, sign: '-' | '+') => {
    if (type === 'down') {
      setFloatRangeDown(val);
      setFloatSignDown(sign);
      calculateLimitRange(controlPrice, val, sign, floatRangeUp, floatSignUp);
    } else {
      setFloatRangeUp(val);
      setFloatSignUp(sign);
      calculateLimitRange(controlPrice, floatRangeDown, floatSignDown, val, sign);
    }
  };

  const handleLimitRangeChange = (type: 'min' | 'max', val: string) => {
    if (type === 'min') {
      setLimitRangeMin(val);
      calculateFloatRange(controlPrice, val, limitRangeMax);
    } else {
      setLimitRangeMax(val);
      calculateFloatRange(controlPrice, limitRangeMin, val);
    }
  };

  const calculateLimitRange = (cp: string, fd: string, fsd: string, fu: string, fsu: string) => {
    const cpNum = parseFloat(cp);
    if (isNaN(cpNum) || cpNum === 0) {
      setLimitRangeMin('');
      setLimitRangeMax('');
      return;
    }
    
    const fdNum = parseFloat(fd);
    if (!isNaN(fdNum)) {
      const multiplier = fsd === '-' ? (1 - fdNum / 100) : (1 + fdNum / 100);
      setLimitRangeMin((cpNum * multiplier).toFixed(2));
    } else {
      setLimitRangeMin('');
    }

    const fuNum = parseFloat(fu);
    if (!isNaN(fuNum)) {
      const multiplier = fsu === '-' ? (1 - fuNum / 100) : (1 + fuNum / 100);
      setLimitRangeMax((cpNum * multiplier).toFixed(2));
    } else {
      setLimitRangeMax('');
    }
  };

  const calculateFloatRange = (cp: string, min: string, max: string) => {
    const cpNum = parseFloat(cp);
    if (isNaN(cpNum) || cpNum === 0) {
      setFloatRangeDown('');
      setFloatRangeUp('');
      return;
    }

    const minNum = parseFloat(min);
    if (!isNaN(minNum)) {
      const diff = minNum - cpNum;
      const percent = Math.abs((diff / cpNum) * 100);
      setFloatSignDown(diff >= 0 ? '+' : '-');
      setFloatRangeDown(percent.toFixed(2));
    } else {
      setFloatRangeDown('');
    }

    const maxNum = parseFloat(max);
    if (!isNaN(maxNum)) {
      const diff = maxNum - cpNum;
      const percent = Math.abs((diff / cpNum) * 100);
      setFloatSignUp(diff >= 0 ? '+' : '-');
      setFloatRangeUp(percent.toFixed(2));
    } else {
      setFloatRangeUp('');
    }
  };

  const [biddingFiles, setBiddingFiles] = useState<FileItem[]>([]);
  const [controlFiles, setControlFiles] = useState<FileItem[]>([]);
  const [tenderFiles, setTenderFiles] = useState<FileItem[]>([]);

  // 检查项相关状态
  const [checkSettings, setCheckSettings] = useState({
    compliance: {
      wrongItem: true, addedItem: true, missingItem: true,
      sameListPrice: true, sameMaterialPrice: true,
      nonCompetitiveChanged: true, exceedLimit: true
    },
    arithmetic: {
      emptyZeroNegative: true,
      totalPrice: true
    },
    unbalanced: {
      enabled: true,
      quoteType: 'controlPrice', // 控制价、投标均价、投标最低价、投标均价-移除最高价最低价
      floatRange: '15'
    },
    collusion: {
      sameSaver: true, sameUnitPrice: true, sameRatio: true, sameDiff: true, regularError: true
    }
  });

  const [activeCheckTab, setActiveCheckTab] = useState('compliance');
  
  // 检查项配置数据
  const CHECK_CATEGORIES = [
    { id: 'compliance', label: '符合性检查' },
    { id: 'arithmetic', label: '算术性错误检查' },
    { id: 'unbalanced', label: '不平衡报价检查' },
    { id: 'collusion', label: '串标检查' }
  ];

  const getCategoryStatus = (categoryId: string) => {
    if (categoryId === 'unbalanced') {
      return checkSettings.unbalanced.enabled ? 'all' : 'none';
    }
    
    const categoryData = (checkSettings as any)[categoryId];
    if (!categoryData) return 'none';
    
    const keys = Object.keys(categoryData).filter(k => typeof categoryData[k] === 'boolean');
    const allSelected = keys.every(k => categoryData[k]);
    const someSelected = keys.some(k => categoryData[k]);
    
    if (allSelected) return 'all';
    if (someSelected) return 'partial';
    return 'none';
  };
  
  const [activeFileTab, setActiveFileTab] = useState<'bidding' | 'control' | 'tender'>('bidding');
  
  // 编辑文件状态
  const [editingFileId, setEditingFileId] = useState<string | null>(null);
  const [editingFileName, setEditingFileName] = useState('');

  const [previewFile, setPreviewFile] = useState<FileItem | null>(null);
  
  // 分页状态
  const [currentPage, setCurrentPage] = useState(1);
  const pageSize = 5;

  const handleFileUpload = (type: 'bidding' | 'control' | 'tender', max: number) => {
    let currentFiles = type === 'bidding' ? biddingFiles : type === 'control' ? controlFiles : tenderFiles;
    if (currentFiles.length >= max) {
      alert(`超出限制，最多只能上传 ${max} 份文件`);
      return;
    }
    
    // 模拟文件上传
    const now = new Date();
    const timeString = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-${String(now.getDate()).padStart(2, '0')} ${String(now.getHours()).padStart(2, '0')}:${String(now.getMinutes()).padStart(2, '0')}`;
    const newFile = { 
      id: Date.now().toString(), 
      name: `示例文件_${Date.now()}.xlsx`, 
      size: '2.5MB',
      uploadTime: timeString
    };
    if (type === 'bidding') setBiddingFiles([newFile]);
    if (type === 'control') setControlFiles([newFile]);
    if (type === 'tender') setTenderFiles([...tenderFiles, newFile]);
  };

  const removeFile = (type: 'bidding' | 'control' | 'tender', id: string) => {
    if (type === 'bidding') setBiddingFiles(biddingFiles.filter(f => f.id !== id));
    if (type === 'control') setControlFiles(controlFiles.filter(f => f.id !== id));
    if (type === 'tender') setTenderFiles(tenderFiles.filter(f => f.id !== id));
  };


  const saveEditing = (type: 'bidding' | 'control' | 'tender', id: string) => {
    if (!editingFileName.trim()) return;
    
    if (confirm('确认保存修改的文件名吗？')) {
      const updateFn = (files: FileItem[]) => files.map(f => f.id === id ? { ...f, name: editingFileName } : f);
      if (type === 'bidding') setBiddingFiles(updateFn(biddingFiles));
      if (type === 'control') setControlFiles(updateFn(controlFiles));
      if (type === 'tender') setTenderFiles(updateFn(tenderFiles));
      setEditingFileId(null);
    }
  };

  const cancelEditing = () => {
    setEditingFileId(null);
  };

  const renderFileListTable = (type: 'bidding' | 'control' | 'tender', files: FileItem[]) => {
    // 计算分页数据
    const totalItems = files.length;
    const totalPages = Math.ceil(totalItems / pageSize);
    
    // 如果当前页超过了总页数（例如删除了最后一页的最后一个文件），则调整当前页
    if (currentPage > totalPages && totalPages > 0) {
      setCurrentPage(totalPages);
    }
    
    const startIndex = (currentPage - 1) * pageSize;
    const endIndex = Math.min(startIndex + pageSize, totalItems);
    const currentFiles = files.slice(startIndex, endIndex);

    return (
      <div className="border border-slate-200 rounded-lg overflow-hidden mt-4">
        <table className="w-full text-left border-collapse">
          <thead className="bg-slate-50 border-b border-slate-200">
            <tr>
              <th className="px-4 py-2.5 text-[13px] font-semibold text-slate-800">文件名</th>
              <th className="px-4 py-2.5 text-[13px] font-semibold text-slate-800 w-32">大小</th>
              <th className="px-4 py-2.5 text-[13px] font-semibold text-slate-800 w-40">上传时间</th>
              <th className="px-4 py-2.5 text-[13px] font-semibold text-slate-800 w-32 text-right">操作</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {currentFiles.length > 0 ? (
              currentFiles.map(file => (
                <tr key={file.id} className="hover:bg-slate-50 transition-colors group">
                  <td className="px-4 py-2.5 text-[13px] text-slate-800">
                    <div className="flex items-center space-x-2">
                      <Icon name="FileText" size={16} className="text-blue-500 shrink-0" />
                      {editingFileId === file.id ? (
                        <input 
                          type="text" 
                          value={editingFileName}
                          onChange={(e) => setEditingFileName(e.target.value)}
                          className="flex-1 h-7 px-2 border border-blue-400 rounded text-sm outline-none"
                          autoFocus
                        />
                      ) : (
                        <span className="truncate" title={file.name}>{file.name}</span>
                      )}
                    </div>
                  </td>
                  <td className="px-4 py-2.5 text-[13px] text-slate-500">{file.size}</td>
                  <td className="px-4 py-2.5 text-[13px] text-slate-500">{file.uploadTime || '-'}</td>
                  <td className="px-4 py-2.5 text-[13px] text-right space-x-2">
                    {editingFileId === file.id ? (
                      <div className="flex justify-end space-x-3">
                        <button onClick={() => saveEditing(type, file.id)} className="text-blue-600 hover:text-blue-700 font-medium whitespace-nowrap">保存</button>
                        <button onClick={cancelEditing} className="text-slate-500 hover:text-slate-700 font-medium whitespace-nowrap">取消</button>
                      </div>
                    ) : (
                      <div className="flex justify-end space-x-3">
                        <button onClick={() => setPreviewFile(file)} className="text-blue-600 hover:text-blue-700 font-medium whitespace-nowrap">
                          查看
                        </button>
                        <button onClick={() => removeFile(type, file.id)} className="text-red-500 hover:text-red-600 font-medium whitespace-nowrap">
                          删除
                        </button>
                      </div>
                    )}
                  </td>
                </tr>
              ))
            ) : (
              <tr>
                <td colSpan={4} className="px-4 py-8 text-center text-slate-400 text-[13px]">
                  暂无上传文件
                </td>
              </tr>
            )}
          </tbody>
        </table>
        
        {/* 分页控件 */}
        {totalPages > 1 && (
          <div className="flex items-center justify-between px-4 py-3 border-t border-slate-200 bg-slate-50">
            <div className="text-[13px] text-slate-500">
              共 <span className="font-medium text-slate-800">{totalItems}</span> 项数据
            </div>
            <div className="flex items-center space-x-2">
              <button 
                onClick={() => setCurrentPage(prev => Math.max(prev - 1, 1))}
                disabled={currentPage === 1}
                className={`w-7 h-7 flex items-center justify-center rounded border ${currentPage === 1 ? 'border-slate-200 text-slate-300 cursor-not-allowed' : 'border-slate-300 text-slate-600 hover:border-blue-500 hover:text-blue-600 bg-white'} transition-colors`}
              >
                <Icon name="ChevronLeft" size={14} />
              </button>
              
              <div className="flex items-center space-x-1">
                {Array.from({ length: totalPages }, (_, i) => i + 1).map(page => (
                  <button
                    key={page}
                    onClick={() => setCurrentPage(page)}
                    className={`w-7 h-7 flex items-center justify-center rounded text-[13px] font-medium transition-colors ${
                      currentPage === page 
                        ? 'bg-blue-600 text-white border border-blue-600' 
                        : 'border border-transparent text-slate-600 hover:bg-slate-200'
                    }`}
                  >
                    {page}
                  </button>
                ))}
              </div>

              <button 
                onClick={() => setCurrentPage(prev => Math.min(prev + 1, totalPages))}
                disabled={currentPage === totalPages}
                className={`w-7 h-7 flex items-center justify-center rounded border ${currentPage === totalPages ? 'border-slate-200 text-slate-300 cursor-not-allowed' : 'border-slate-300 text-slate-600 hover:border-blue-500 hover:text-blue-600 bg-white'} transition-colors`}
              >
                <Icon name="ChevronRight" size={14} />
              </button>
            </div>
          </div>
        )}
      </div>
    );
  };

  const renderCheckboxes = (category: string, items: {key: string, label: string}[]) => {
    return (
      <div className="space-y-3">
        {items.map(item => {
          const isSelected = (checkSettings as any)[category][item.key];
          return (
            <label key={item.key} className={`flex items-start p-4 rounded-lg border-2 cursor-pointer transition-all ${isSelected ? 'border-blue-100 bg-blue-50/30' : 'border-slate-100 bg-white hover:border-slate-200'}`}>
              <div className="pt-0.5 mr-4 shrink-0">
                <div className={`w-5 h-5 rounded border flex items-center justify-center transition-colors ${isSelected ? 'bg-blue-600 border-blue-600' : 'border-slate-300 bg-white'}`}>
                  {isSelected && <Icon name="Check" size={14} className="text-white" />}
                </div>
                <input type="checkbox" className="sr-only" checked={isSelected} onChange={(e) => setCheckSettings(prev => ({ ...prev, [category]: { ...(prev as any)[category], [item.key]: e.target.checked } }))} />
              </div>
              <div className={`text-[14px] leading-relaxed ${isSelected ? 'text-slate-800 font-medium' : 'text-slate-600'}`}>{item.label}</div>
            </label>
          );
        })}
      </div>
    );
  };

  const renderArithmeticItem = (mainKey: string, mainLabel: string) => {
    const isSelected = (checkSettings.arithmetic as any)[mainKey];
    
    return (
      <div className={`flex flex-col p-4 rounded-lg border-2 transition-all ${isSelected ? 'border-blue-100 bg-blue-50/30' : 'border-slate-100 bg-white hover:border-slate-200'}`}>
        <label className="flex items-start cursor-pointer">
          <div className="pt-0.5 mr-4 shrink-0">
            <div className={`w-5 h-5 rounded border flex items-center justify-center transition-colors ${isSelected ? 'bg-blue-600 border-blue-600' : 'border-slate-300 bg-white'}`}>
              {isSelected && <Icon name="Check" size={14} className="text-white" />}
            </div>
            <input type="checkbox" className="sr-only" checked={isSelected} onChange={(e) => setCheckSettings(prev => ({ ...prev, arithmetic: { ...prev.arithmetic, [mainKey]: e.target.checked } }))} />
          </div>
          <div className={`text-[14px] leading-relaxed flex-1 ${isSelected ? 'text-slate-800 font-medium' : 'text-slate-600'}`}>{mainLabel}</div>
        </label>
      </div>
    );
  };

  const renderCheckTabContent = () => {
    switch (activeCheckTab) {
      case 'compliance':
        return renderCheckboxes('compliance', [
          { key: 'wrongItem', label: '错项检查' },
          { key: 'addedItem', label: '增项检查' },
          { key: 'missingItem', label: '漏项检查' },
          { key: 'sameListPrice', label: '相同清单价一致检查' },
          { key: 'sameMaterialPrice', label: '相同材料价一致检查' },
          { key: 'nonCompetitiveChanged', label: '不可竞争金额是否改动' },
          { key: 'exceedLimit', label: '投标价是否突破限价' }
        ]);
      case 'arithmetic':
        return (
          <div className="space-y-4">
            {renderArithmeticItem('emptyZeroNegative', '单价为空 / 零 / 负数检查')}
            {renderArithmeticItem('totalPrice', '合价检查')}
          </div>
        );
      case 'unbalanced':
        return (
          <div className="space-y-6">
            <label className={`flex items-start p-4 rounded-lg border-2 cursor-pointer transition-all ${checkSettings.unbalanced.enabled ? 'border-blue-100 bg-blue-50/30' : 'border-slate-100 bg-white hover:border-slate-200'}`}>
              <div className="pt-0.5 mr-4 shrink-0">
                <div className={`w-5 h-5 rounded border flex items-center justify-center transition-colors ${checkSettings.unbalanced.enabled ? 'bg-blue-600 border-blue-600' : 'border-slate-300 bg-white'}`}>
                  {checkSettings.unbalanced.enabled && <Icon name="Check" size={14} className="text-white" />}
                </div>
                <input type="checkbox" className="sr-only" checked={checkSettings.unbalanced.enabled} onChange={(e) => setCheckSettings(prev => ({ ...prev, unbalanced: { ...prev.unbalanced, enabled: e.target.checked } }))} />
              </div>
              <div className={`text-[14px] leading-relaxed flex-1 ${checkSettings.unbalanced.enabled ? 'text-slate-800 font-medium' : 'text-slate-600'}`}>
                开启不平衡报价检查
              </div>
            </label>
            
            {checkSettings.unbalanced.enabled && (
              <div className="p-6 rounded-lg border border-blue-100 bg-white shadow-sm space-y-5 animate-in fade-in slide-in-from-top-2 duration-300">
                <div className="text-sm text-slate-600">设置基准的超出比例阈值，超出部分将被认定为不平衡报价</div>
                <div className="flex items-center space-x-4 max-w-xl">
                  <div className="flex-1">
                    <label className="block text-sm font-medium text-slate-700 mb-2">报价类型</label>
                    <div className="relative">
                      <select 
                        value={checkSettings.unbalanced.quoteType}
                        onChange={(e) => setCheckSettings(prev => ({ ...prev, unbalanced: { ...prev.unbalanced, quoteType: e.target.value } }))}
                        className="w-full h-10 px-3 pr-10 border border-slate-300 rounded-md focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 outline-none transition-all text-sm appearance-none bg-white"
                      >
                        <option value="controlPrice">控制价</option>
                        <option value="bidAvg">投标均价</option>
                        <option value="bidLowest">投标最低价</option>
                        <option value="bidHighestLowestAvg">投标均价-移除最高价最低价</option>
                      </select>
                      <div className="absolute inset-y-0 right-0 flex items-center px-2 pointer-events-none text-slate-500">
                        <Icon name="ChevronDown" size={16} />
                      </div>
                    </div>
                  </div>
                  <div className="w-48">
                    <label className="block text-sm font-medium text-slate-700 mb-2">浮动金额区间 (%)</label>
                    <div className="relative">
                      <span className="absolute inset-y-0 left-0 flex items-center pl-3 text-slate-500 text-sm">±</span>
                      <input 
                        type="number" 
                        value={checkSettings.unbalanced.floatRange} 
                        onChange={(e) => setCheckSettings(prev => ({ ...prev, unbalanced: { ...prev.unbalanced, floatRange: e.target.value } }))} 
                        className="w-full h-10 pl-8 pr-3 border border-slate-300 rounded-md focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 outline-none transition-all text-sm" 
                        placeholder="例如: 15" 
                      />
                    </div>
                  </div>
                </div>
              </div>
            )}
          </div>
        );
      case 'collusion':
        return renderCheckboxes('collusion', [
          { key: 'sameSaver', label: '文件最后保存人一致' },
          { key: 'sameUnitPrice', label: '单价相同' },
          { key: 'sameRatio', label: '单价比例相同' },
          { key: 'sameDiff', label: '单价差额相同' },
          { key: 'regularError', label: '规律性错误' }
        ]);
      default:
        return null;
    }
  };

  if (showResultView) {
    return <RebiddingCheckResultView onBack={() => setShowResultView(false)} mode={mode} />;
  }

  return (
    <div className="flex-1 flex flex-col bg-slate-50 overflow-hidden relative animate-in slide-in-from-right-8 duration-300">
      {/* 顶部栏 */}
      <div className="h-16 bg-white border-b border-slate-200 flex items-center justify-between px-6 shrink-0 z-10">
        <div className="flex items-center space-x-4 w-1/4">
          <button 
            onClick={onBack}
            className="w-8 h-8 flex items-center justify-center rounded-full text-slate-500 hover:bg-slate-100 transition-colors"
          >
            <Icon name="ArrowLeft" size={20} />
          </button>
          <h2 className="text-lg font-black text-slate-800">{mode === 'new' ? '新建清标项目' : '编辑清标项目'}</h2>
        </div>
        
        {/* 进度条区域 */}
        <div className="flex-1 flex justify-center items-center">
          <div className="flex items-center space-x-2">
            {/* Step 1 */}
            <div className="flex items-center">
              <div className="flex items-center justify-center w-6 h-6 rounded-full bg-blue-600 text-white text-xs font-bold">1</div>
              <span className="ml-2 text-sm font-medium text-blue-600">{mode === 'new' ? '新建项目' : '编辑项目'}</span>
            </div>
            
            {/* Divider */}
            <div className="w-12 h-[1px] bg-slate-300 mx-2"></div>
            
            {/* Step 2 */}
            <div className="flex items-center">
              <div className="flex items-center justify-center w-6 h-6 rounded-full bg-slate-100 text-slate-400 text-xs font-bold border border-slate-200">2</div>
              <span className="ml-2 text-sm font-medium text-slate-500">清标检查</span>
            </div>
            
            {/* Divider */}
            <div className="w-12 h-[1px] bg-slate-300 mx-2"></div>
            
            {/* Step 3 */}
            <div className="flex items-center">
              <div className="flex items-center justify-center w-6 h-6 rounded-full bg-slate-100 text-slate-400 text-xs font-bold border border-slate-200">3</div>
              <span className="ml-2 text-sm font-medium text-slate-500">查看对比表</span>
            </div>

            {/* Divider */}
            <div className="w-12 h-[1px] bg-slate-300 mx-2"></div>
            
            {/* Step 4 */}
            <div className="flex items-center">
              <div className="flex items-center justify-center w-6 h-6 rounded-full bg-slate-100 text-slate-400 text-xs font-bold border border-slate-200">4</div>
              <span className="ml-2 text-sm font-medium text-slate-500">导出报告</span>
            </div>
          </div>
        </div>

        <div className="flex items-center space-x-3 w-1/4 justify-end">
          <button onClick={onBack} className="px-5 py-2 text-sm font-medium text-slate-600 bg-white border border-slate-300 rounded-md hover:bg-slate-50 transition-colors">
            取消
          </button>
          <button onClick={() => setShowResultView(true)} className="px-5 py-2 text-sm font-medium text-white bg-blue-600 rounded-md hover:bg-blue-700 transition-colors shadow-sm shadow-blue-600/20">
            开始清标
          </button>
        </div>
      </div>

      <div className="flex-1 overflow-auto p-4">
        <div className="max-w-5xl mx-auto space-y-4">
          
          {/* 基本信息 */}
          <section className="bg-white rounded-2xl shadow-sm border border-slate-200 p-5">
            <h2 className="text-lg font-bold text-slate-800 mb-4 flex items-center space-x-2">
              <span className="w-1 h-5 bg-blue-600 rounded-full"></span>
              <span>基本信息</span>
            </h2>
            <div className="max-w-md">
              <label className="block text-sm font-medium text-slate-700 mb-2">项目名称 <span className="text-red-500">*</span></label>
              <input 
                type="text" 
                value={projectName}
                onChange={e => setProjectName(e.target.value)}
                placeholder="请输入项目名称"
                className="w-full h-10 px-3 border border-slate-300 rounded-md focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 outline-none transition-all"
              />
            </div>
          </section>

          {/* 文件导入区域 */}
          <section className="bg-white rounded-2xl shadow-sm border border-slate-200 p-5 space-y-4">
            <div className="flex items-center justify-between">
              <h2 className="text-lg font-bold text-slate-800 flex items-center space-x-2">
                <span className="w-1 h-5 bg-blue-600 rounded-full"></span>
                <span>文件导入</span>
              </h2>
            </div>
            
            <div className="flex space-x-1 border-b border-slate-200">
              {[
                { id: 'bidding', label: '招标文件' },
                { id: 'control', label: '控制价文件' },
                { id: 'tender', label: '投标文件' }
              ].map(tab => (
                <button
                  key={tab.id}
                  onClick={() => setActiveFileTab(tab.id as any)}
                  className={`px-6 py-3 text-sm font-medium border-b-2 transition-colors ${
                    activeFileTab === tab.id 
                      ? 'border-blue-600 text-blue-600' 
                      : 'border-transparent text-slate-500 hover:text-slate-800 hover:border-slate-300'
                  }`}
                >
                  {tab.label}
                </button>
              ))}
            </div>

            <div className="min-h-[200px]">
              {/* 招标文件 */}
              {activeFileTab === 'bidding' && (
                <div className="animate-in fade-in duration-300 mt-4 space-y-6">
                  <div className="flex justify-end mb-4">
                    <button 
                      onClick={() => handleFileUpload('bidding', 1)}
                      className="h-8 px-4 bg-white border border-blue-600 text-blue-600 rounded text-sm font-medium hover:bg-blue-50 transition-colors flex items-center space-x-1"
                    >
                      <Icon name="UploadCloud" size={14} />
                      <span>上传文件</span>
                    </button>
                  </div>

                  {renderFileListTable('bidding', biddingFiles)}

                  {/* 手动限价设置区（跟在文件列表下方） */}
                  <div className="bg-slate-50 rounded-xl p-5 border border-slate-200 mt-6">
                    <h3 className="text-[15px] font-bold text-slate-800 mb-4 flex items-center space-x-2">
                      <Icon name="Settings" size={16} className="text-blue-600" />
                      <span>手动限价设置</span>
                    </h3>
                    
                    <div className="grid grid-cols-2 gap-x-12 gap-y-6 max-w-4xl">
                      {/* 控制价 */}
                      <div className="col-span-2 sm:col-span-1">
                        <label className="block text-sm font-medium text-slate-700 mb-2">控制价 (元)</label>
                        <input 
                          type="number" 
                          value={controlPrice} 
                          onChange={e => handleControlPriceChange(e.target.value)} 
                          className="w-full h-10 px-3 text-sm border border-slate-300 rounded-md focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 outline-none transition-all" 
                          placeholder="输入控制价" 
                        />
                      </div>
                      <div className="hidden sm:block"></div> {/* 占位 */}

                      {/* 投标浮动区间 */}
                      <div className="col-span-2 sm:col-span-1">
                        <label className="block text-sm font-medium text-slate-700 mb-2">投标浮动区间 (%)</label>
                        <div className="flex items-center space-x-2">
                          <div className="relative flex-1 flex items-center">
                            <button 
                              onClick={() => handleFloatRangeChange('down', floatRangeDown, floatSignDown === '-' ? '+' : '-')}
                              className="absolute left-0 top-0 bottom-0 px-3 flex items-center justify-center text-slate-500 hover:text-blue-600 hover:bg-slate-100 rounded-l-md transition-colors border-r border-slate-300"
                            >
                              {floatSignDown}
                            </button>
                            <input 
                              type="number" 
                              value={floatRangeDown} 
                              onChange={e => handleFloatRangeChange('down', e.target.value, floatSignDown)} 
                              className="w-full h-10 pl-10 pr-3 text-sm border border-slate-300 rounded-md focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 outline-none transition-all" 
                              placeholder="下限" 
                            />
                          </div>
                          <span className="text-slate-400">至</span>
                          <div className="relative flex-1 flex items-center">
                            <button 
                              onClick={() => handleFloatRangeChange('up', floatRangeUp, floatSignUp === '-' ? '+' : '-')}
                              className="absolute left-0 top-0 bottom-0 px-3 flex items-center justify-center text-slate-500 hover:text-blue-600 hover:bg-slate-100 rounded-l-md transition-colors border-r border-slate-300"
                            >
                              {floatSignUp}
                            </button>
                            <input 
                              type="number" 
                              value={floatRangeUp} 
                              onChange={e => handleFloatRangeChange('up', e.target.value, floatSignUp)} 
                              className="w-full h-10 pl-10 pr-3 text-sm border border-slate-300 rounded-md focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 outline-none transition-all" 
                              placeholder="上限" 
                            />
                          </div>
                        </div>
                      </div>

                      {/* 金额区间 */}
                      <div className="col-span-2 sm:col-span-1">
                        <label className="block text-sm font-medium text-slate-700 mb-2">金额区间 (元)</label>
                        <div className="flex items-center space-x-2">
                          <input 
                            type="number" 
                            value={limitRangeMin} 
                            onChange={e => handleLimitRangeChange('min', e.target.value)} 
                            className="w-full h-10 px-3 text-sm border border-slate-300 rounded-md focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 outline-none transition-all flex-1" 
                            placeholder="最低限价" 
                          />
                          <span className="text-slate-400">至</span>
                          <input 
                            type="number" 
                            value={limitRangeMax} 
                            onChange={e => handleLimitRangeChange('max', e.target.value)} 
                            className="w-full h-10 px-3 text-sm border border-slate-300 rounded-md focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 outline-none transition-all flex-1" 
                            placeholder="最高限价" 
                          />
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {/* 控制价文件 */}
              {activeFileTab === 'control' && (
                <div className="animate-in fade-in duration-300 mt-4">
                  <div className="mb-4 flex justify-end">
                    <button 
                      onClick={() => handleFileUpload('control', 1)}
                      className="h-8 px-4 bg-white border border-blue-600 text-blue-600 rounded text-sm font-medium hover:bg-blue-50 transition-colors flex items-center space-x-1"
                    >
                      <Icon name="UploadCloud" size={14} />
                      <span>上传文件</span>
                    </button>
                  </div>
                  {renderFileListTable('control', controlFiles)}
                </div>
              )}

              {/* 投标文件 */}
              {activeFileTab === 'tender' && (
                <div className="animate-in fade-in duration-300 mt-4">
                  <div className="mb-4 flex justify-end">
                    <button 
                      onClick={() => handleFileUpload('tender', 99)}
                      className="h-8 px-4 bg-white border border-blue-600 text-blue-600 rounded text-sm font-medium hover:bg-blue-50 transition-colors flex items-center space-x-1"
                    >
                      <Icon name="UploadCloud" size={14} />
                      <span>上传文件</span>
                    </button>
                  </div>
                  {renderFileListTable('tender', tenderFiles)}
                </div>
              )}
            </div>
          </section>

          {/* 检查项设置区域 */}
          <section className="bg-white rounded-2xl shadow-sm border border-slate-200 overflow-hidden flex flex-col min-h-[600px]">
            <div className="flex items-center justify-between p-5 border-b border-slate-200 bg-white">
              <h2 className="text-lg font-bold text-slate-800 flex items-center space-x-2">
                <span className="w-1 h-5 bg-blue-600 rounded-full"></span>
                <span>检查项设置</span>
              </h2>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-slate-400">
                  <Icon name="Search" size={16} />
                </div>
                <input 
                  type="text" 
                  placeholder="搜索检查项..." 
                  className="h-9 pl-9 pr-4 w-64 border border-slate-200 rounded-md text-sm outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500 bg-slate-50 focus:bg-white transition-all"
                />
              </div>
            </div>

            <div className="flex flex-1 overflow-hidden">
              {/* 左侧导航栏 */}
              <div className="w-64 border-r border-slate-200 bg-slate-50/50 overflow-y-auto">
                <div className="py-2">
                  {CHECK_CATEGORIES.map(category => {
                    const status = getCategoryStatus(category.id);
                    return (
                      <button
                        key={category.id}
                        onClick={() => setActiveCheckTab(category.id)}
                        className={`w-full flex items-center justify-between px-6 py-3.5 text-sm transition-colors relative ${
                          activeCheckTab === category.id 
                            ? 'bg-white text-blue-600 font-medium before:absolute before:left-0 before:top-0 before:bottom-0 before:w-1 before:bg-blue-600' 
                            : 'text-slate-600 hover:bg-slate-100/80'
                        }`}
                      >
                        <span>{category.label}</span>
                        <div className={`w-4 h-4 rounded border flex items-center justify-center ${
                          status === 'all' ? 'bg-blue-600 border-blue-600' :
                          status === 'partial' ? 'bg-blue-600 border-blue-600' :
                          'border-slate-300 bg-white'
                        }`}>
                          {status === 'all' && <Icon name="Check" size={12} className="text-white" />}
                          {status === 'partial' && <div className="w-2 h-0.5 bg-white rounded-full"></div>}
                        </div>
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* 右侧内容区 */}
              <div className="flex-1 bg-white p-6 overflow-y-auto">
                <div className="max-w-4xl">
                  <h3 className="text-base font-bold text-blue-600 mb-6 pb-2 border-b border-blue-100">
                    {CHECK_CATEGORIES.find(c => c.id === activeCheckTab)?.label || '检查项'}
                  </h3>
                  
                  {renderCheckTabContent()}
                </div>
              </div>
            </div>
          </section>
          
          {/* 底部留白 */}
          <div className="h-10"></div>
        </div>
      </div>

      {/* 预览/编辑弹窗 */}
      {previewFile && typeof document !== 'undefined' && createPortal(
        <div className="fixed inset-0 z-[200] flex items-center justify-center">
          <div className="absolute inset-0 bg-slate-900/40 backdrop-blur-sm" onClick={() => setPreviewFile(null)}></div>
          <div className="relative bg-white w-full h-full md:w-[90vw] md:h-[90vh] md:rounded-2xl shadow-2xl flex flex-col animate-in zoom-in-95 duration-200 overflow-hidden">
            <div className="flex items-center justify-between px-6 py-4 border-b border-slate-100 shrink-0 bg-slate-50/50">
              <div className="flex items-center space-x-3">
                <div className="w-8 h-8 bg-blue-100 text-blue-600 rounded-lg flex items-center justify-center">
                  <Icon name="Table" size={18} />
                </div>
                <div>
                  <h3 className="text-base font-bold text-slate-800">{previewFile.name}</h3>
                  <p className="text-xs text-slate-500">在线预览与编辑</p>
                </div>
              </div>
              <div className="flex items-center space-x-4">
                <button className="h-8 px-4 bg-blue-600 text-white rounded text-sm font-medium hover:bg-blue-700 transition-colors">
                  保存修改
                </button>
                <button 
                  onClick={() => setPreviewFile(null)}
                  className="w-8 h-8 flex items-center justify-center rounded-full text-slate-400 hover:bg-slate-200 hover:text-slate-600 transition-colors"
                >
                  <Icon name="X" size={18} />
                </button>
              </div>
            </div>
            
            <div className="flex-1 overflow-auto bg-slate-100 p-6">
              <div className="bg-white rounded-xl shadow-sm border border-slate-200 h-full overflow-hidden flex flex-col">
                {/* 模拟表格工具栏 */}
                <div className="h-12 border-b border-slate-200 flex items-center px-4 space-x-4 bg-slate-50 shrink-0">
                  <div className="flex items-center space-x-1 border-r border-slate-200 pr-4">
                    <button className="p-1.5 text-slate-500 hover:bg-slate-200 rounded"><Icon name="Undo" size={16} /></button>
                    <button className="p-1.5 text-slate-500 hover:bg-slate-200 rounded"><Icon name="Redo" size={16} /></button>
                  </div>
                  <div className="flex items-center space-x-1 border-r border-slate-200 pr-4">
                    <button className="p-1.5 text-slate-700 font-bold hover:bg-slate-200 rounded text-sm px-2">B</button>
                    <button className="p-1.5 text-slate-700 italic hover:bg-slate-200 rounded text-sm px-2">I</button>
                    <button className="p-1.5 text-slate-700 underline hover:bg-slate-200 rounded text-sm px-2">U</button>
                  </div>
                  <div className="text-sm text-slate-500 flex items-center space-x-2">
                    <Icon name="Search" size={14} />
                    <input type="text" placeholder="在表格中搜索..." className="bg-transparent border-none outline-none w-48" />
                  </div>
                </div>
                
                {/* 模拟表格内容 */}
                <div className="flex-1 overflow-auto p-4">
                  <table className="w-full text-left border-collapse border border-slate-200">
                    <thead>
                      <tr className="bg-slate-100">
                        <th className="border border-slate-200 px-3 py-2 text-xs font-bold text-slate-600 text-center w-12">行号</th>
                        <th className="border border-slate-200 px-3 py-2 text-xs font-bold text-slate-600">项目编码</th>
                        <th className="border border-slate-200 px-3 py-2 text-xs font-bold text-slate-600">项目名称</th>
                        <th className="border border-slate-200 px-3 py-2 text-xs font-bold text-slate-600">项目特征描述</th>
                        <th className="border border-slate-200 px-3 py-2 text-xs font-bold text-slate-600 w-16">计量单位</th>
                        <th className="border border-slate-200 px-3 py-2 text-xs font-bold text-slate-600 w-24">工程量</th>
                        <th className="border border-slate-200 px-3 py-2 text-xs font-bold text-slate-600 w-24">综合单价</th>
                        <th className="border border-slate-200 px-3 py-2 text-xs font-bold text-slate-600 w-24">合价</th>
                      </tr>
                    </thead>
                    <tbody>
                      {[1, 2, 3, 4, 5, 6, 7, 8, 9, 10].map(i => (
                        <tr key={i} className="hover:bg-blue-50/30">
                          <td className="border border-slate-200 px-3 py-2 text-xs text-slate-400 text-center bg-slate-50">{i}</td>
                          <td className="border border-slate-200 px-3 py-2 text-xs text-slate-700 outline-none focus:bg-blue-50 focus:ring-1 ring-inset ring-blue-500" contentEditable suppressContentEditableWarning>01010100100{i}</td>
                          <td className="border border-slate-200 px-3 py-2 text-xs text-slate-700 outline-none focus:bg-blue-50 focus:ring-1 ring-inset ring-blue-500" contentEditable suppressContentEditableWarning>平整场地</td>
                          <td className="border border-slate-200 px-3 py-2 text-xs text-slate-700 outline-none focus:bg-blue-50 focus:ring-1 ring-inset ring-blue-500" contentEditable suppressContentEditableWarning>1.土壤类别:三类土 2.弃土运距:自行考虑</td>
                          <td className="border border-slate-200 px-3 py-2 text-xs text-slate-700 outline-none focus:bg-blue-50 focus:ring-1 ring-inset ring-blue-500 text-center" contentEditable suppressContentEditableWarning>m2</td>
                          <td className="border border-slate-200 px-3 py-2 text-xs text-slate-700 outline-none focus:bg-blue-50 focus:ring-1 ring-inset ring-blue-500 text-right font-mono" contentEditable suppressContentEditableWarning>{(150.5 * i).toFixed(2)}</td>
                          <td className="border border-slate-200 px-3 py-2 text-xs text-slate-700 outline-none focus:bg-blue-50 focus:ring-1 ring-inset ring-blue-500 text-right font-mono" contentEditable suppressContentEditableWarning>{(12.5).toFixed(2)}</td>
                          <td className="border border-slate-200 px-3 py-2 text-xs text-slate-700 outline-none focus:bg-blue-50 focus:ring-1 ring-inset ring-blue-500 text-right font-mono" contentEditable suppressContentEditableWarning>{(150.5 * i * 12.5).toFixed(2)}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          </div>
        </div>,
        document.body
      )}
    </div>
  );
};

export default NewRebiddingProjectView;