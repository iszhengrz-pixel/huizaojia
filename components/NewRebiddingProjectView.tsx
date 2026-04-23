import React, { useState, useRef, useEffect } from 'react';
import { createPortal } from 'react-dom';
import Icon from './Icon';
import RebiddingCheckResultView from './RebiddingCheckResultView';

interface FileItem {
  id: string;
  name: string;
  size: string;
  uploadTime: string;
  round?: string;
}

interface NewRebiddingProjectViewProps {
  onBack: () => void;
  onReturnToList?: () => void; // 新增：直接返回到列表页
  mode?: 'new' | 'edit';
}

const NewRebiddingProjectView: React.FC<NewRebiddingProjectViewProps> = ({ onBack, onReturnToList, mode = 'new' }) => {
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

  const handleToggleCategorySelection = (categoryId: string) => {
    if (categoryId === 'unbalanced') {
      setCheckSettings(prev => ({
        ...prev,
        unbalanced: {
          ...prev.unbalanced,
          enabled: !prev.unbalanced.enabled
        }
      }));
      return;
    }

    setCheckSettings(prev => {
      const categoryData = (prev as any)[categoryId];
      if (!categoryData) return prev;
      const keys = Object.keys(categoryData).filter(k => typeof categoryData[k] === 'boolean');
      const allSelected = keys.every(k => categoryData[k]);
      const nextValue = !allSelected;
      const nextCategoryData = { ...categoryData };
      keys.forEach(k => {
        nextCategoryData[k] = nextValue;
      });
      return {
        ...prev,
        [categoryId]: nextCategoryData
      };
    });
  };
  
  const [activeFileTab, setActiveFileTab] = useState<'bidding' | 'control' | 'tender'>('bidding');
  
  // 编辑文件状态
  const [editingFileId, setEditingFileId] = useState<string | null>(null);
  const [editingFileName, setEditingFileName] = useState('');

  // 识别结果弹窗状态
  const [controlRuleFile, setControlRuleFile] = useState<FileItem | null>(null); // 控制价规则配置弹窗
  const [tenderMatchFile, setTenderMatchFile] = useState<FileItem | null>(null); // 投标文件匹配结果弹窗
  const [activeSheetIndex, setActiveSheetIndex] = useState(6); // 默认选中 3-桩基工程 (index 6)
  const [sheetRules, setSheetRules] = useState([
    { col: 'B', name: '项目编码', type: 'info', notEmpty: true, isNumber: true },
    { col: 'C', name: '项目名称', type: 'compare', notEmpty: true, isNumber: true },
  ]);
  const [rulePanelHeight, setRulePanelHeight] = useState(400); // 规则维护面板初始高度
  const [isRulePanelCollapsed, setIsRulePanelCollapsed] = useState(false); // 规则维护面板是否折叠

  // 处理拖拽改变高度
  const handleDragStart = (e: React.MouseEvent) => {
    e.preventDefault();
    const startY = e.clientY;
    const startHeight = rulePanelHeight;

    const handleDrag = (moveEvent: MouseEvent) => {
      if (isRulePanelCollapsed) return;
      // 鼠标向上移动，clientY变小，deltaY为负数，面板高度应该增加
      // 鼠标向下移动，clientY变大，deltaY为正数，面板高度应该减少
      const deltaY = moveEvent.clientY - startY; 
      const newHeight = Math.max(150, Math.min(startHeight - deltaY, window.innerHeight * 0.8)); // 限制最小150px，最大占屏幕80%
      setRulePanelHeight(newHeight);
    };

    const handleDragEnd = () => {
      document.removeEventListener('mousemove', handleDrag);
      document.removeEventListener('mouseup', handleDragEnd);
      document.body.style.cursor = 'default';
    };

    document.addEventListener('mousemove', handleDrag);
    document.addEventListener('mouseup', handleDragEnd);
    document.body.style.cursor = 'row-resize';
  };
  const [recognitionList, setRecognitionList] = useState([
    { name: '封面', rows: 5, field: '(单位盖章)', confidence: 5, isCompared: false, disabled: false },
    { name: '目录', rows: 19, field: '', confidence: 0, isCompared: false, disabled: false },
    { name: '编制说明', rows: 265, field: '', confidence: 0, isCompared: false, disabled: false },
    { name: '报价汇总表', rows: 21, field: '小计', confidence: 40, isCompared: false, disabled: false },
    { name: '1-土石方工程', rows: 15, isCompared: true, disabled: false, matched: true },
    { name: '2-基坑支护工程', rows: 80, isCompared: true, disabled: false, matched: true },
    { name: '3-桩基工程', rows: 46, isCompared: true, disabled: false, matched: true },
    { name: '4-土建工程综合单价分析表', rows: 387, confidence: 95, isCompared: true, disabled: false, matched: true },
    { name: '4.1-土建工程（地下室）', rows: 229, isCompared: true, disabled: false, matched: true },
  ]);
  
  // 分页状态
  const [currentPage, setCurrentPage] = useState(1);
  const pageSize = 5;

  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileUpload = (type: 'bidding' | 'control' | 'tender', max?: number) => {
    if (type === 'bidding' && biddingFiles.length >= 1) {
      alert('招标文件只能上传一份，如需更换请先删除现有文件。');
      return;
    }
    if (type === 'control' && controlFiles.length >= 1) {
      alert('控制价文件只能上传一份，如需更换请先删除现有文件。');
      return;
    }
    triggerSystemUpload(type);
  };

  const triggerSystemUpload = (type: 'bidding' | 'control' | 'tender') => {
    // 模拟打开文件选择框
    const input = document.createElement('input');
    input.type = 'file';
    input.multiple = true;
    input.accept = '.xml,.zbz,.czb,.gzb,.hzb,.bxzx,.zbx,.pdf,.doc,.docx,.xls,.xlsx';
    
    input.onchange = (e) => {
      const files = Array.from((e.target as HTMLInputElement).files || []);
      if (files.length === 0) return;
      
      const newFiles = files.map(file => ({
        id: Math.random().toString(36).substr(2, 9),
        name: file.name,
        size: (file.size / 1024 / 1024).toFixed(2) + ' MB',
        uploadTime: new Date().toLocaleString(),
        status: 'success' as const,
        round: mode === 'new' ? '一轮回标' : '二轮回标'
      }));
      
      if (type === 'bidding') {
        setBiddingFiles([...biddingFiles, ...newFiles]);
      } else if (type === 'control') {
        setControlFiles([...controlFiles, ...newFiles]);
        // 上传控制价文件后自动弹出规则配置弹窗
        setControlRuleFile(newFiles[0]);
      } else {
        setTenderFiles([...tenderFiles, ...newFiles]);
        // 上传投标文件后自动弹出匹配结果弹窗
        setTenderMatchFile(newFiles[0]);
      }
    };
    
    input.click();
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

  const MOCK_PREVIEW_DATA = [
    { id: 1, A: '总包工程量清单明细表——桩基工程', B: '', C: '', D: '', E: '', F: '', G: '', H: '', I: '', J: '', K: '' },
    { id: 2, A: '序号', B: '项目编码', C: '项目名称', D: '项目特征描述', E: '计量单位', F: '工作内容', G: '部位', H: '主材编码', I: '主材名称', J: '主材规格型号', K: '主材供货方式' },
    { id: 3, A: '', B: '', C: '', D: '', E: '', F: '', G: '', H: '', I: '', J: '', K: '' },
    { id: 4, A: '', B: '', C: '', D: '', E: '', F: '', G: '', H: '', I: '', J: '', K: '' },
    { id: 5, A: '一', B: '0103', C: '桩基工程', D: '', E: '', F: '', G: '', H: '', I: '', J: '', K: '' },
    { id: 6, A: '', B: '010301', C: '预制桩(方桩)', D: '', E: '', F: '', G: '', H: '', I: '', J: '', K: '' },
  ];

  const renderFileListTable = (type: 'bidding' | 'control' | 'tender', files: FileItem[]) => {
    // 计算分页数据
    const totalItems = files.length;
    const totalPages = Math.ceil(totalItems / pageSize) || 1;
    
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
              <th className="px-4 py-2.5 text-[13px] font-semibold text-slate-800 w-24 whitespace-nowrap">回标轮次</th>
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
                  <td className="px-4 py-2.5 text-[13px] text-slate-600">
                    <span className="inline-flex px-2 py-0.5 rounded bg-blue-50 text-blue-600 font-medium whitespace-nowrap">
                      {file.round || '-'}
                    </span>
                  </td>
                  <td className="px-4 py-2.5 text-[13px] text-slate-500">{file.uploadTime || '-'}</td>
                  <td className="px-4 py-2.5 text-[13px] text-right space-x-2">
                    {editingFileId === file.id ? (
                      <div className="flex justify-end space-x-3">
                        <button onClick={() => saveEditing(type, file.id)} className="text-blue-600 hover:text-blue-700 font-medium whitespace-nowrap">保存</button>
                        <button onClick={cancelEditing} className="text-slate-500 hover:text-slate-700 font-medium whitespace-nowrap">取消</button>
                      </div>
                    ) : (
                      <div className="flex justify-end space-x-3">
                        <button 
                          onClick={() => {
                            if (type === 'control') setControlRuleFile(file);
                            else if (type === 'tender') setTenderMatchFile(file);
                            else alert('预览功能开发中');
                          }} 
                          className="text-blue-600 hover:text-blue-700 font-medium whitespace-nowrap"
                        >
                          {type === 'control' ? '配置规则' : type === 'tender' ? '匹配结果' : '查看'}
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
                <input type="checkbox" className="hidden" checked={isSelected} onChange={(e) => setCheckSettings(prev => ({ ...prev, [category]: { ...(prev as any)[category], [item.key]: e.target.checked } }))} />
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
            <input type="checkbox" className="hidden" checked={isSelected} onChange={(e) => setCheckSettings(prev => ({ ...prev, arithmetic: { ...prev.arithmetic, [mainKey]: e.target.checked } }))} />
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
                <input type="checkbox" className="hidden" checked={checkSettings.unbalanced.enabled} onChange={(e) => setCheckSettings(prev => ({ ...prev, unbalanced: { ...prev.unbalanced, enabled: e.target.checked } }))} />
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
    return <RebiddingCheckResultView onBack={() => setShowResultView(false)} onReturnToList={onReturnToList || onBack} mode={mode} />;
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
        <div className="flex-1 flex justify-center items-center px-8">
          <div className="flex w-full max-w-3xl gap-2">
            {[
              { id: 1, label: mode === 'new' ? '新建项目' : '编辑项目' },
              { id: 2, label: '清标检查' },
              { id: 3, label: '查看对比表' },
              { id: 4, label: '导出报告' }
            ].map(step => {
              const isCompleted = 1 > step.id; // 在新建项目页面，当前固定在第一步，所以后面都没完成
              const isActive = 1 === step.id;
              
              const barColor = isCompleted ? 'bg-[#00C48C]' : isActive ? 'bg-blue-600' : 'bg-[#E5E6EB]';
              const textColor = isCompleted ? 'text-[#333333] group-hover:text-green-600' : isActive ? 'text-blue-600 font-semibold' : 'text-[#999999]';

              return (
                <button 
                  key={step.id}
                  className="flex flex-col flex-1 text-left cursor-default group"
                >
                  {/* Top Bar */}
                  <div className={`h-1 w-full rounded-full ${barColor}`}></div>
                  {/* Content */}
                  <div className={`flex items-center mt-2 p-1.5 rounded-md transition-colors ${isCompleted ? 'group-hover:bg-green-50' : ''}`}>
                    {isCompleted ? (
                      <Icon name="CheckCircle2" size={16} className="text-[#00C48C] group-hover:text-green-600 transition-colors" />
                    ) : isActive ? (
                      <div className="flex items-center justify-center w-4 h-4 rounded-full border-2 border-blue-600">
                        <div className="w-2 h-2 rounded-full bg-blue-600"></div>
                      </div>
                    ) : (
                      <div className="w-4 h-4 rounded-full border-2 border-[#E5E6EB]"></div>
                    )}
                    <span className={`ml-2 text-sm transition-colors ${textColor}`}>{step.label}</span>
                  </div>
                </button>
              )
            })}
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

            <div className="flex flex-1">
              {/* 左侧导航栏 */}
              <div className="w-64 border-r border-slate-200 bg-slate-50/50">
                <div className="py-2">
                  {CHECK_CATEGORIES.map(category => {
                    const status = getCategoryStatus(category.id);
                    return (
                      <div
                        key={category.id}
                        onClick={() => setActiveCheckTab(category.id)}
                        className={`w-full flex items-center justify-between px-6 py-3.5 text-sm transition-colors relative cursor-pointer ${
                          activeCheckTab === category.id 
                            ? 'bg-white text-blue-600 font-medium before:absolute before:left-0 before:top-0 before:bottom-0 before:w-1 before:bg-blue-600' 
                            : 'text-slate-600 hover:bg-slate-100/80'
                        }`}
                      >
                        <span>{category.label}</span>
                        <button
                          type="button"
                          onClick={(e) => {
                            e.stopPropagation();
                            handleToggleCategorySelection(category.id);
                          }}
                          className={`w-4 h-4 rounded border flex items-center justify-center transition-colors ${
                            status === 'all' ? 'bg-blue-600 border-blue-600' :
                            status === 'partial' ? 'bg-blue-600 border-blue-600' :
                            'border-slate-300 bg-white'
                          }`}
                        >
                          {status === 'all' && <Icon name="Check" size={12} className="text-white" />}
                          {status === 'partial' && <div className="w-2 h-0.5 bg-white rounded-full"></div>}
                        </button>
                      </div>
                    );
                  })}
                </div>
              </div>

              {/* 右侧内容区 */}
              <div className="flex-1 bg-white p-6">
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

      {/* 控制价规则配置弹窗 */}
      {controlRuleFile && typeof document !== 'undefined' && createPortal(
        <div className="fixed inset-0 z-[200] flex items-center justify-center bg-slate-900/40 backdrop-blur-sm">
          <div className="bg-white w-[95vw] h-[90vh] rounded-xl shadow-2xl flex overflow-hidden animate-in zoom-in-95 duration-200">
            {/* 左侧边栏：页签列表 */}
            <div className="w-72 bg-white border-r border-slate-200 flex flex-col shrink-0">
              <div className="p-5 border-b border-slate-200">
                <h2 className="text-lg font-bold text-slate-800">对比规则配置</h2>
                <p className="text-xs text-slate-500 mt-1">为每个页签配置表头行和对比规则</p>
                <div className="mt-6 pt-4 border-t border-slate-100">
                  <h3 className="text-sm font-semibold text-slate-700">控制价文件页签列表</h3>
                  <p className="text-xs text-slate-400 mt-1">点击选择页签进行规则配置</p>
                </div>
              </div>
              <div className="flex-1 overflow-y-auto p-3 space-y-2 bg-slate-50">
                {recognitionList.map((sheet, i) => (
                  <button
                    key={i}
                    onClick={() => setActiveSheetIndex(i)}
                    className={`w-full flex items-center px-4 py-3 rounded-lg text-sm font-medium transition-colors border ${
                      activeSheetIndex === i 
                        ? 'bg-blue-50 border-blue-200 text-blue-700 shadow-sm' 
                        : 'bg-white border-transparent text-slate-600 hover:bg-slate-100 hover:border-slate-200'
                    }`}
                  >
                    {sheet.isCompared ? (
                      <div className="mr-3 w-4 h-4 shrink-0 rounded-full bg-emerald-500 flex items-center justify-center">
                        <Icon name="Check" size={12} className="text-white" />
                      </div>
                    ) : (
                      <Icon name="FileText" size={16} className={`mr-3 shrink-0 ${activeSheetIndex === i ? 'text-blue-500' : 'text-slate-400'}`} />
                    )}
                    <span className="truncate flex-1 text-left">{sheet.name}</span>
                  </button>
                ))}
              </div>
            </div>

            {/* 右侧主体：预览和规则配置 */}
            <div className="flex-1 flex flex-col min-w-0 bg-slate-50 relative">
              {/* 右上角关闭按钮 */}
              <button 
                onClick={() => setControlRuleFile(null)}
                className="absolute top-4 right-4 z-10 w-8 h-8 flex items-center justify-center rounded-full bg-white border border-slate-200 text-slate-500 hover:bg-slate-100 hover:text-slate-700 transition-colors shadow-sm"
              >
                <Icon name="X" size={18} />
              </button>

              {/* 上半部分：页签内容预览 */}
              <div className="flex-1 flex flex-col bg-white min-h-0 border-b border-slate-200">
                <div className="px-6 py-4 flex items-center justify-between shrink-0 border-b border-slate-100 pr-16">
                  <h3 className="text-sm font-bold text-slate-800">页签内容预览: <span className="text-blue-600">{recognitionList[activeSheetIndex]?.name}</span></h3>
                  <span className="text-xs text-slate-500">共 {recognitionList[activeSheetIndex]?.rows} 行</span>
                </div>
                <div className="flex-1 overflow-auto bg-white">
                  <table className="w-full min-w-max border-collapse text-left text-[13px]">
                    <thead className="bg-orange-50/50 sticky top-0 z-10 shadow-sm">
                      <tr>
                        <th className="border border-slate-200 px-3 py-2 text-center text-slate-500 font-medium w-12 bg-slate-50">行号</th>
                        {['A', 'B', 'C', 'D', 'E', 'F', 'G', 'H', 'I', 'J', 'K'].map(col => (
                          <th key={col} className="border border-slate-200 px-4 py-2 text-center text-slate-600 font-medium bg-orange-50/30">列 {col}</th>
                        ))}
                      </tr>
                    </thead>
                    <tbody>
                      {MOCK_PREVIEW_DATA.map(row => (
                        <tr key={row.id} className="hover:bg-slate-50">
                          <td className="border border-slate-200 px-3 py-2 text-center text-slate-400 bg-slate-50/50">{row.id}</td>
                          {['A', 'B', 'C', 'D', 'E', 'F', 'G', 'H', 'I', 'J', 'K'].map(col => (
                            <td key={col} className="border border-slate-200 px-4 py-2 text-slate-700 truncate max-w-[200px]">
                              {row[col as keyof typeof row]}
                            </td>
                          ))}
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>

              {/* 下半部分：规则维护 */}
              <div 
                className={`flex flex-col bg-slate-50/50 shrink-0 relative transition-all duration-300 ease-in-out ${isRulePanelCollapsed ? 'h-[64px]' : ''}`}
                style={!isRulePanelCollapsed ? { height: `${rulePanelHeight}px` } : {}}
              >
                {/* 拖拽手柄 */}
                {!isRulePanelCollapsed && (
                  <div 
                    className="absolute top-0 left-0 right-0 h-1.5 cursor-row-resize hover:bg-blue-500/20 transition-colors z-20 flex items-center justify-center group"
                    onMouseDown={handleDragStart}
                  >
                    <div className="w-10 h-0.5 bg-slate-300 rounded-full group-hover:bg-blue-400 transition-colors"></div>
                  </div>
                )}
                
                <div className="px-6 py-4 shrink-0 border-t border-b border-slate-200 bg-white flex items-center justify-between">
                  <div className="flex items-center space-x-6">
                    <h3 className="text-base font-bold text-slate-800">规则维护</h3>
                    <div className="flex items-center space-x-2">
                      <span className="text-sm font-medium text-slate-700">本页签是否加入对比</span>
                      <button 
                        type="button"
                        onClick={() => {
                          const newList = [...recognitionList];
                          const newIsCompared = !newList[activeSheetIndex].isCompared;
                          newList[activeSheetIndex].isCompared = newIsCompared;
                          setRecognitionList(newList);
                          
                          // 选择否时自动收起面板，选择是时自动展开面板
                          setIsRulePanelCollapsed(!newIsCompared);
                        }}
                        className={`w-[46px] h-[22px] rounded-full relative transition-colors flex items-center ${recognitionList[activeSheetIndex]?.isCompared ? 'bg-blue-600' : 'bg-slate-300'}`}
                      >
                        <span className={`absolute text-[10px] font-medium text-white transition-opacity ${recognitionList[activeSheetIndex]?.isCompared ? 'left-2 opacity-100' : 'left-2 opacity-0'}`}>是</span>
                        <div className={`absolute top-[3px] w-4 h-4 bg-white rounded-full transition-transform ${recognitionList[activeSheetIndex]?.isCompared ? 'translate-x-[26px]' : 'translate-x-[3px]'}`}></div>
                        <span className={`absolute text-[10px] font-medium text-white transition-opacity ${recognitionList[activeSheetIndex]?.isCompared ? 'right-2 opacity-0' : 'right-2 opacity-100'}`}>否</span>
                      </button>
                    </div>
                  </div>
                  <button 
                    onClick={() => setIsRulePanelCollapsed(!isRulePanelCollapsed)}
                    className="w-8 h-8 flex items-center justify-center rounded-full text-slate-400 hover:bg-slate-100 hover:text-slate-600 transition-colors"
                  >
                    <Icon name={isRulePanelCollapsed ? "ChevronUp" : "ChevronDown"} size={20} />
                  </button>
                </div>

                {!isRulePanelCollapsed && (
                  <div className="flex-1 overflow-y-auto p-6">
                    {recognitionList[activeSheetIndex]?.isCompared ? (
                      <div className="w-full space-y-4 animate-in fade-in duration-300">
                        <div className="mb-4">
                          <label className="block text-sm text-slate-600 mb-2">填写表头所在行 (支持多行，逗号分隔，如4,5)</label>
                          <div className="flex items-center space-x-4">
                            <input type="text" defaultValue="2" className="flex-1 h-9 px-3 border border-slate-300 rounded focus:border-blue-500 focus:ring-1 focus:ring-blue-500 outline-none text-sm" />
                            <label className="flex items-center space-x-2 cursor-pointer">
                              <input type="checkbox" className="rounded border-slate-300 text-blue-600 focus:ring-blue-500" />
                              <span className="text-sm text-slate-600">覆盖现有配置</span>
                            </label>
                            <button className="h-9 px-5 bg-blue-600 hover:bg-blue-700 text-white text-sm font-medium rounded shadow-sm transition-colors">
                              解析表头
                            </button>
                          </div>
                        </div>

                        <div className="space-y-3">
                          {sheetRules.map((rule, idx) => (
                            <div key={idx} className="bg-white border border-slate-200 rounded-lg p-3 flex items-center shadow-sm">
                              <div className="w-14 h-14 bg-slate-50 rounded border border-slate-100 flex flex-col items-center justify-center shrink-0 mr-4">
                                <span className="text-[10px] text-slate-400 mb-0.5">列</span>
                                <span className="text-base font-bold text-slate-700">{rule.col}</span>
                              </div>
                              <div className="flex-1 mr-6">
                                <span className="text-xs text-slate-400 block mb-1">列名称</span>
                                <input 
                                  type="text" 
                                  value={rule.name}
                                  onChange={(e) => {
                                    const newRules = [...sheetRules];
                                    newRules[idx].name = e.target.value;
                                    setSheetRules(newRules);
                                  }}
                                  className="w-full h-9 bg-white border border-slate-200 rounded px-3 text-sm font-medium text-slate-800 outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500 transition-shadow"
                                />
                              </div>
                              <div className="flex items-start space-x-8">
                                {/* 列类型 */}
                                <div className="flex flex-col items-center">
                                  <div className="relative group flex items-center space-x-1 mb-1.5">
                                    <span className="text-xs text-blue-600 font-medium">列类型</span>
                                    <Icon name="HelpCircle" size={14} className="text-blue-500 cursor-help"/>
                                    {/* Tooltip */}
                                    <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 hidden group-hover:block w-64 bg-slate-800 text-white text-xs rounded-lg p-3 shadow-xl z-50">
                                      <div className="space-y-2">
                                        <div><span className="font-bold">展示列：</span>仅用于展示数据，不参与比对</div>
                                        <div><span className="font-bold text-blue-400">信息列：</span>用于判断是否为同一条数据</div>
                                        <div><span className="font-bold text-emerald-400">比对列：</span>检测该列内容/数值的变化</div>
                                      </div>
                                      <div className="absolute top-full left-1/2 -translate-x-1/2 border-4 border-transparent border-t-slate-800"></div>
                                    </div>
                                  </div>
                                  <div className="flex items-center space-x-1">
                                    <button 
                                      onClick={() => {
                                        const newRules = [...sheetRules];
                                        newRules[idx].type = 'display';
                                        setSheetRules(newRules);
                                      }}
                                      className={`px-3 py-1 text-xs font-medium rounded transition-colors ${rule.type === 'display' ? 'bg-slate-600 text-white shadow-sm' : 'bg-slate-100 text-slate-600 hover:bg-slate-200'}`}
                                    >展示列</button>
                                    <button 
                                      onClick={() => {
                                        const newRules = [...sheetRules];
                                        newRules[idx].type = 'info';
                                        setSheetRules(newRules);
                                      }}
                                      className={`px-3 py-1 text-xs font-medium rounded transition-colors ${rule.type === 'info' ? 'bg-blue-600 text-white shadow-sm' : 'bg-slate-100 text-slate-600 hover:bg-slate-200'}`}
                                    >信息列</button>
                                    <button 
                                      onClick={() => {
                                        const newRules = [...sheetRules];
                                        newRules[idx].type = 'compare';
                                        setSheetRules(newRules);
                                      }}
                                      className={`px-3 py-1 text-xs font-medium rounded transition-colors ${rule.type === 'compare' ? 'bg-emerald-500 text-white shadow-sm' : 'bg-slate-100 text-slate-600 hover:bg-slate-200'}`}
                                    >比对列</button>
                                  </div>
                                  <div className="text-[10px] text-slate-400 mt-1.5 h-3">
                                    {rule.type === 'display' && '仅展示，不参与比对'}
                                    {rule.type === 'info' && '判断同一条数据'}
                                    {rule.type === 'compare' && '判断值是否变化'}
                                  </div>
                                </div>

                                {/* 数据过滤 */}
                                <div className="flex flex-col">
                                  <div className="relative group flex items-center space-x-1 mb-1.5">
                                    <span className="text-xs text-blue-600 font-medium">数据过滤</span>
                                    <Icon name="HelpCircle" size={14} className="text-blue-500 cursor-help"/>
                                    {/* Data Filter Tooltip */}
                                    <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 hidden group-hover:block w-56 bg-slate-800 text-white text-xs rounded-lg p-3 shadow-xl z-50">
                                      <div className="space-y-2">
                                        <div><span className="font-bold text-blue-400">非空：</span>自动剔除该列为空的无效记录</div>
                                        <div><span className="font-bold text-emerald-400">数字：</span>要求该列必须为有效的数字</div>
                                      </div>
                                      <div className="absolute top-full left-1/2 -translate-x-1/2 border-4 border-transparent border-t-slate-800"></div>
                                    </div>
                                  </div>
                                  <div className="space-y-1.5">
                                    <label className="flex items-center space-x-2 cursor-pointer group/cb">
                                      <div className={`w-3.5 h-3.5 rounded flex items-center justify-center border transition-colors ${rule.notEmpty ? 'bg-blue-600 border-blue-600' : 'border-slate-300 bg-white group-hover/cb:border-blue-400'}`}>
                                        {rule.notEmpty && <Icon name="Check" size={10} className="text-white" />}
                                      </div>
                                      <input 
                                        type="checkbox" 
                                        checked={rule.notEmpty} 
                                        onChange={(e) => {
                                          const newRules = [...sheetRules];
                                          newRules[idx].notEmpty = e.target.checked;
                                          setSheetRules(newRules);
                                        }}
                                        className="hidden" 
                                      />
                                      <span className="text-xs font-medium text-slate-700">非空</span>
                                    </label>
                                    <label className="flex items-center space-x-2 cursor-pointer group/cb">
                                      <div className={`w-3.5 h-3.5 rounded flex items-center justify-center border transition-colors ${rule.isNumber ? 'bg-blue-600 border-blue-600' : 'border-slate-300 bg-white group-hover/cb:border-blue-400'}`}>
                                        {rule.isNumber && <Icon name="Check" size={10} className="text-white" />}
                                      </div>
                                      <input 
                                        type="checkbox" 
                                        checked={rule.isNumber} 
                                        onChange={(e) => {
                                          const newRules = [...sheetRules];
                                          newRules[idx].isNumber = e.target.checked;
                                          setSheetRules(newRules);
                                        }}
                                        className="hidden" 
                                      />
                                      <span className="text-xs font-medium text-slate-700">数字</span>
                                    </label>
                                  </div>
                                </div>

                                {/* 删除按钮 */}
                                <div className="flex flex-col justify-center h-[56px]">
                                  <button className="w-7 h-7 flex items-center justify-center text-slate-300 hover:text-red-500 hover:bg-red-50 rounded transition-colors ml-2">
                                    <Icon name="Trash2" size={16} />
                                  </button>
                                </div>
                              </div>
                            </div>
                          ))}
                        </div>
                      </div>
                    ) : (
                      <div className="h-full flex flex-col items-center justify-center text-slate-400">
                        <Icon name="Settings2" size={48} className="mb-4 text-slate-300" />
                        <p>开启“是否对比”后可配置该页签的规则</p>
                      </div>
                    )}
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>,
        document.body
      )}
      {/* 投标文件匹配结果弹窗 */}
      {tenderMatchFile && typeof document !== 'undefined' && createPortal(
        <div className="fixed inset-0 z-[200] flex items-center justify-center bg-slate-900/40 backdrop-blur-sm">
          <div className="relative bg-white w-[90vw] h-[90vh] rounded-2xl shadow-2xl flex flex-col animate-in zoom-in-95 duration-200 overflow-hidden">
            <div className="flex items-center justify-between px-6 py-4 border-b border-slate-100 shrink-0 bg-white">
              <div className="flex items-center space-x-3">
                <h3 className="text-lg font-bold text-slate-800">识别匹配结果</h3>
                <span className="px-3 py-1 bg-blue-50 text-blue-600 rounded-full text-xs font-medium">投标文件</span>
              </div>
              <button 
                onClick={() => setTenderMatchFile(null)} 
                className="w-8 h-8 flex items-center justify-center rounded-full text-slate-400 hover:bg-slate-100 hover:text-slate-600 transition-colors"
              >
                <Icon name="X" size={20} />
              </button>
            </div>
            
            <div className="flex-1 overflow-auto p-6 bg-slate-50/50">
              <div className="max-w-6xl mx-auto space-y-6">
                {/* File Info Card */}
                <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-5 flex items-start space-x-4">
                  <div className="w-12 h-12 bg-blue-50 text-blue-600 rounded-lg flex items-center justify-center shrink-0">
                    <Icon name="FileText" size={24} />
                  </div>
                  <div className="flex-1">
                    <h4 className="text-base font-bold text-slate-800 mb-1">{tenderMatchFile.name}</h4>
                    <p className="text-sm text-slate-500">基于控制价规则进行自动匹配，共 19 个页签，成功匹配 13 个对比规则</p>
                  </div>
                  <div className="shrink-0 flex space-x-8 text-sm">
                    <div className="flex flex-col items-end">
                      <span className="text-slate-500 mb-1">页签匹配度</span>
                      <span className="text-xl font-bold text-emerald-500">100%</span>
                    </div>
                    <div className="flex flex-col items-end">
                      <span className="text-slate-500 mb-1">表头匹配度</span>
                      <span className="text-xl font-bold text-blue-600">85%</span>
                    </div>
                  </div>
                </div>

                {/* Result Table */}
                <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden">
                  <table className="w-full text-left border-collapse">
                    <thead className="bg-slate-50 border-b border-slate-200">
                      <tr>
                        <th className="px-6 py-4 text-[13px] font-semibold text-slate-500 w-64">投标文件页签名称</th>
                        <th className="px-6 py-4 text-[13px] font-semibold text-slate-500 w-64">匹配控制价页签</th>
                        <th className="px-6 py-4 text-[13px] font-semibold text-slate-500 w-24 text-center">数据行数</th>
                        <th className="px-6 py-4 text-[13px] font-semibold text-slate-500">匹配的表头字段</th>
                        <th className="px-6 py-4 text-[13px] font-semibold text-slate-500 w-32">匹配置信度</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100">
                      {recognitionList.map((sheet, i) => (
                        <tr key={`sheet-${i}`} className="hover:bg-slate-50/50">
                          <td className="px-6 py-4">
                            <div className="flex items-center space-x-2">
                              {sheet.matched ? <Icon name="CheckCircle2" size={16} className="text-green-500" /> : <Icon name="AlertCircle" size={16} className="text-orange-400" />}
                              <span className={`text-sm ${sheet.matched ? 'font-medium text-slate-800' : 'text-slate-600'}`}>{sheet.name}</span>
                            </div>
                          </td>
                          <td className="px-6 py-4">
                            <div className="flex items-center space-x-2 text-sm">
                              {sheet.matched ? (
                                <span className="text-blue-600 font-medium bg-blue-50 px-2 py-1 rounded">{sheet.name}</span>
                              ) : (
                                <span className="text-slate-400">- 未匹配 -</span>
                              )}
                            </div>
                          </td>
                          <td className="px-6 py-4 text-sm text-slate-600 text-center">{sheet.rows}</td>
                          <td className="px-6 py-4">
                            <div className="flex flex-wrap gap-2">
                              {sheet.matched ? (
                                <>
                                  {['项目编码', '项目名称', '项目特征描述', '计量单位'].map(tag => (
                                    <span key={tag} className="inline-flex px-2 py-1 bg-green-50 text-green-600 text-xs font-medium rounded border border-green-100">
                                      {tag}
                                    </span>
                                  ))}
                                </>
                              ) : sheet.field ? (
                                <span className="inline-flex px-2 py-1 bg-orange-50 text-orange-600 text-xs font-medium rounded">
                                  {sheet.field} (未命中规则)
                                </span>
                              ) : <span className="text-xs text-slate-400">无规则要求</span>}
                            </div>
                          </td>
                          <td className="px-6 py-4">
                            <div className="flex items-center space-x-2">
                              <div className="flex-1 h-1.5 bg-slate-100 rounded-full overflow-hidden">
                                <div 
                                  className={`h-full rounded-full ${sheet.matched ? 'bg-green-500' : (sheet.confidence && sheet.confidence > 0 ? (sheet.confidence > 30 ? 'bg-orange-400' : 'bg-red-500') : '')}`} 
                                  style={{ width: `${sheet.confidence || (sheet.matched ? 100 : 0)}%` }}
                                ></div>
                              </div>
                              <span className="text-xs text-slate-500 w-8 text-right">{sheet.confidence || (sheet.matched ? 100 : 0)}%</span>
                            </div>
                          </td>
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
