import React, { useEffect, useMemo, useRef, useState } from 'react';
import Icon from './Icon';

type DocumentStatus = '识别中' | '识别完成' | '识别失败' | '待确认' | '待识别';

interface DocumentRecord {
  id: string;
  taskName: string;
  fileName: string;
  createdAt: string;
  status: DocumentStatus;
  startPage: number;
  uploadCount: number;
  pages: number;
  size: string;
  owner: string;
  resultCount: number;
}

type CellMarkType = 'field' | 'seal' | 'startRow';
type ConversionMode = 'manual' | 'mergeHeader';
type TaskFileStatus = '上传中' | '上传失败' | '待解析' | '转换中' | '转换失败' | '转换成功';

interface CellMark {
  type: CellMarkType;
  label: string;
}

interface ParsedCell {
  id: string;
  ref: string;
  value: string;
  colSpan?: number;
  rowSpan?: number;
}

interface TaskUploadFile {
  id: string;
  fileName: string;
  fileType: string;
  status: TaskFileStatus;
  progress: number;
  message?: string;
}

interface HistoryScheme {
  id: string;
  name: string;
  creator: string;
  updatedAt: string;
  usageCount: number;
  startPage: string;
  mappingFields: string[];
  cellMarks: Record<string, CellMark[]>;
}

const INITIAL_DOCUMENTS: DocumentRecord[] = [
  { id: 'doc-001', taskName: '杭政储出18号地块招标文件识别任务', fileName: '杭政储出〔2026〕18号地块招标文件.pdf', createdAt: '2026-06-12 10:24', status: '识别完成', startPage: 1, uploadCount: 4, pages: 128, size: '12.6MB', owner: '王工', resultCount: 3 },
  { id: 'doc-002', taskName: '幕墙工程商务标清单解析任务', fileName: '幕墙工程商务标清单扫描件.xlsx', createdAt: '2026-06-12 09:46', status: '识别中', startPage: 2, uploadCount: 2, pages: 42, size: '6.8MB', owner: '李工', resultCount: 0 },
  { id: 'doc-003', taskName: 'EPC合同专用条款结构化任务', fileName: 'EPC总承包合同专用条款.docx', createdAt: '2026-06-11 18:12', status: '待确认', startPage: 3, uploadCount: 3, pages: 76, size: '4.1MB', owner: '陈工', resultCount: 2 },
  { id: 'doc-004', taskName: '地下室安装控制价说明识别任务', fileName: '地下室安装工程控制价说明.pdf', createdAt: '2026-06-11 15:37', status: '识别失败', startPage: 1, uploadCount: 1, pages: 19, size: '2.4MB', owner: '周工', resultCount: 0 },
  { id: 'doc-005', taskName: '智能化材料品牌表转换任务', fileName: '智能化系统材料品牌表.pdf', createdAt: '2026-06-10 14:08', status: '识别完成', startPage: 1, uploadCount: 2, pages: 33, size: '3.7MB', owner: '赵工', resultCount: 1 }
];

const INITIAL_TASK_FILES: Record<string, TaskUploadFile[]> = {
  'doc-001': [
    { id: 'file-001-1', fileName: '18号地块工程量确认单-01.pdf', fileType: '工程量确认单', status: '转换成功', progress: 100 },
    { id: 'file-001-2', fileName: '18号地块工程量确认单-02.pdf', fileType: '工程量确认单', status: '转换成功', progress: 100 }
  ],
  'doc-002': [
    { id: 'file-002-1', fileName: '幕墙工程商务标清单-01.pdf', fileType: '商务标清单', status: '转换中', progress: 62 }
  ],
  'doc-003': [
    { id: 'file-003-1', fileName: 'EPC合同专用条款-01.pdf', fileType: '合同条款', status: '待解析', progress: 100 }
  ]
};

const STATUS_OPTIONS = ['识别完成', '识别中', '待确认', '识别失败'];
const CONVERSION_MODE_OPTIONS: Array<{ value: ConversionMode; label: string }> = [
  { value: 'manual', label: '映射转换' },
  { value: 'mergeHeader', label: '仅合并表头转换' }
];

const CONVERSION_MODE_DESCRIPTIONS: Record<ConversionMode, string> = {
  manual: '浅灰文字为原始单元格坐标，粗体为解析内容；可把字段、印章拖到对应单元格完成标注',
  mergeHeader: '仅合并表头模式不会设置映射字段与印章'
};

const DEFAULT_MAPPING_FIELDS = ['工程名称', '建设单位', '工程内容', '桩径', '桩数', '备注'];
const UPLOAD_FILES_PAGE_SIZE = 10;
const FILE_STATUS_FILTER_OPTIONS: Array<TaskFileStatus | ''> = ['', '上传中', '上传失败', '待解析', '转换中', '转换失败', '转换成功'];
const FIELD_VALUE_TYPE_OPTIONS = ['文本', '数字', '符号', '符号+数字', '日期', '时间', '日期+时间'];
const normalizeFieldValueType = (value?: string) => {
  if (!value) return '文本';
  if (['年月日', '月日年'].includes(value)) return '日期';
  if (['时分', '时分秒'].includes(value)) return '时间';
  if (['年月日时分', '年月日时分秒'].includes(value)) return '日期+时间';
  return FIELD_VALUE_TYPE_OPTIONS.includes(value) ? value : '文本';
};
const DEFAULT_FIELD_TEST_TEXT = '6月19日 12:08\n6月19日 14:05';

const getMockUploadCount = (item: DocumentRecord) => item.uploadCount || Math.max(1, Math.min(5, item.resultCount + 1));
const getTaskName = (item: DocumentRecord) => item.taskName || `${item.fileName.replace(/\.[^.]+$/, '')}识别任务`;
const UPLOAD_STATUS_STYLES: Record<string, string> = {
  上传中: 'bg-blue-50 text-blue-700 border-blue-100',
  上传失败: 'bg-red-50 text-red-600 border-red-100',
  待解析: 'bg-amber-50 text-amber-700 border-amber-100',
  转换中: 'bg-blue-50 text-blue-700 border-blue-100',
  转换失败: 'bg-red-50 text-red-600 border-red-100',
  转换成功: 'bg-emerald-50 text-emerald-700 border-emerald-100'
};
const isUploadStatusLoading = (status: string) => ['上传中', '转换中'].includes(status);

const STATUS_STYLES: Record<DocumentStatus, string> = {
  识别完成: 'bg-emerald-50 text-emerald-700 border-emerald-100',
  识别中: 'bg-blue-50 text-blue-700 border-blue-100',
  待确认: 'bg-amber-50 text-amber-700 border-amber-100',
  待识别: 'bg-amber-50 text-amber-700 border-amber-100',
  识别失败: 'bg-red-50 text-red-600 border-red-100'
};

const getStatusLabel = (status: DocumentStatus) => (status === '待识别' ? '待确认' : status);
const getMockTaskProgress = (item: DocumentRecord) => 35 + (item.id.charCodeAt(item.id.length - 1) % 55);
const getMockUploadProgress = (index: number, item: DocumentRecord) => 18 + ((index + item.id.length) * 17) % 74;

const PARSED_TABLE_ROWS: ParsedCell[][] = [
  [
    { id: 'a1', ref: 'A1', value: '工程名称' },
    { id: 'b1', ref: 'B1, C1, D1, E1, F1', value: '越城区全域低空新基建 期项目', colSpan: 5 }
  ],
  [
    { id: 'a2', ref: 'A2', value: '建设单位' },
    { id: 'b2', ref: 'B2, C2, D2, E2, F2', value: '绍兴鉴水科技城开发建设有限公司', colSpan: 5 }
  ],
  [
    { id: 'a3', ref: 'A3', value: '监理单位' },
    { id: 'b3', ref: 'B3, C3, D3, E3, F3', value: '浙江永宁工程管理有限公司', colSpan: 5 }
  ],
  [
    { id: 'a4', ref: 'A4', value: '施工单位' },
    { id: 'b4', ref: 'B4, C4, D4, E4, F4', value: '浙江绿宇建设发展有限公司', colSpan: 5 }
  ],
  [
    { id: 'a5', ref: 'A5', value: '桩基单位' },
    { id: 'b5', ref: 'B5, C5, D5, E5, F5', value: '浙江牛伟岩土集团有限公司', colSpan: 5 }
  ],
  [
    { id: 'a6', ref: 'A6', value: '工程内容' },
    { id: 'b6', ref: 'B6, C6, D6, E6, F6', value: '钻孔灌注桩工程桩、围护桩、立柱桩、支座桩、塔吊', colSpan: 5 }
  ],
  [
    { id: 'a7', ref: 'A7, A8, A9, A10, A11, A12, A13, A14, A15, A16', value: '完成 工程量', rowSpan: 10 },
    { id: 'b7', ref: 'B7', value: '楼号' },
    { id: 'c7', ref: 'C7', value: '桩径（mm）' },
    { id: 'd7', ref: 'D7', value: '标号' },
    { id: 'e7', ref: 'E7', value: '桩数（根）' },
    { id: 'f7', ref: 'F7', value: '备注' }
  ],
  [
    { id: 'b8', ref: 'B8, B9, B10, B11, B12, B13', value: '地下室', rowSpan: 6 },
    { id: 'c8', ref: 'C8', value: '600' },
    { id: 'd8', ref: 'D8', value: 'c40' },
    { id: 'e8', ref: 'E8', value: '3' },
    { id: 'f8', ref: 'F8', value: '试桩' }
  ],
  [
    { id: 'c9', ref: 'C9', value: '600' },
    { id: 'd9', ref: 'D9', value: 'c35' },
    { id: 'e9', ref: 'E9', value: '66' },
    { id: 'f9', ref: 'F9', value: '' }
  ],
  [
    { id: 'c10', ref: 'C10', value: '800/600' },
    { id: 'd10', ref: 'D10', value: 'c35' },
    { id: 'e10', ref: 'E10', value: '3' },
    { id: 'f10', ref: 'F10', value: '工程桩兼支撑' }
  ],
  [
    { id: 'c11', ref: 'C11', value: '700' },
    { id: 'd11', ref: 'D11', value: 'c40' },
    { id: 'e11', ref: 'E11', value: '13' },
    { id: 'f11', ref: 'F11', value: '试桩' }
  ],
  [
    { id: 'c12', ref: 'C12', value: '700' },
    { id: 'd12', ref: 'D12', value: 'c35' },
    { id: 'e12', ref: 'E12', value: '243' },
    { id: 'f12', ref: 'F12', value: '' }
  ],
  [
    { id: 'c13', ref: 'C13', value: '800/700' },
    { id: 'd13', ref: 'D13', value: 'c35' },
    { id: 'e13', ref: 'E13', value: '15' },
    { id: 'f13', ref: 'F13', value: '工程桩兼支撑' }
  ],
  [
    { id: 'b14', ref: 'B14', value: '小计' },
    { id: 'c14', ref: 'C14', value: '' },
    { id: 'd14', ref: 'D14', value: '' },
    { id: 'e14', ref: 'E14', value: '343' },
    { id: 'f14', ref: 'F14', value: '' }
  ],
  [
    { id: 'b15', ref: 'B15', value: '围护桩' },
    { id: 'c15', ref: 'C15', value: '700' },
    { id: 'd15', ref: 'D15', value: 'c30' },
    { id: 'e15', ref: 'E15', value: '2' },
    { id: 'f15', ref: 'F15', value: '' }
  ],
  [
    { id: 'b16', ref: 'B16', value: '立柱桩' },
    { id: 'c16', ref: 'C16', value: '800' },
    { id: 'd16', ref: 'D16', value: 'c30' },
    { id: 'e16', ref: 'E16', value: '39' },
    { id: 'f16', ref: 'F16', value: '' }
  ],
  [
    { id: 'a17', ref: 'A17', value: '塔吊' },
    { id: 'b17', ref: 'B17', value: '600' },
    { id: 'c17', ref: 'C17', value: 'c30' },
    { id: 'd17', ref: 'D17', value: '16' },
    { id: 'e17', ref: 'E17', value: '' },
    { id: 'f17', ref: 'F17', value: '' }
  ],
  [
    { id: 'a18', ref: 'A18', value: '支座桩' },
    { id: 'b18', ref: 'B18', value: '600' },
    { id: 'c18', ref: 'C18', value: 'c35' },
    { id: 'd18', ref: 'D18', value: '4' },
    { id: 'e18', ref: 'E18', value: '' },
    { id: 'f18', ref: 'F18', value: '' }
  ],
  [
    { id: 'a19', ref: 'A19', value: '合计' },
    { id: 'b19', ref: 'B19', value: '' },
    { id: 'c19', ref: 'C19', value: '' },
    { id: 'd19', ref: 'D19', value: '404' },
    { id: 'e19', ref: 'E19', value: '' },
    { id: 'f19', ref: 'F19', value: '' }
  ],
  [
    { id: 'a20', ref: 'A20', value: '备注' },
    { id: 'b20', ref: 'B20, C20, D20, E20, F20', value: '1、本工程进场GPS-10 型桩机16 台、冲击钻1 台、挖机4 台、输头机1 台。2、试桩共制作10 个，其中700 抗压试桩3 根：89、215、70 #桩；600 抗压试桩3 根：163、232、327 #桩；支座桩4 个。700 抗拔试桩5 根：95、248、305、261、280 #桩。', colSpan: 5 }
  ],
  [
    { id: 'a21', ref: 'A21', value: '建设单位' },
    { id: 'b21', ref: 'B21', value: '监理单位' },
    { id: 'c21', ref: 'C21', value: '陈峰涛.' },
    { id: 'd21', ref: 'D21', value: '浙江绿宇建设发展有限公司越城区金城江区科技城一期中建技术有限公司' },
    { id: 'e21', ref: 'E21', value: '桩司基础单' },
    { id: 'f21', ref: 'F21', value: '第1次验收' }
  ]
];

const HISTORY_SCHEMES: HistoryScheme[] = [
  {
    id: 'scheme-001',
    name: '桩基工程量表标准映射',
    creator: '王工',
    updatedAt: '2026-06-15 16:35',
    usageCount: 18,
    startPage: '1',
    mappingFields: ['工程名称', '建设单位', '工程内容', '桩径', '桩数', '备注'],
    cellMarks: {
      a1: [{ type: 'field', label: '工程名称' }],
      a2: [{ type: 'field', label: '建设单位' }],
      a6: [{ type: 'field', label: '工程内容' }],
      c7: [{ type: 'field', label: '桩径' }],
      e7: [{ type: 'field', label: '桩数' }],
      f7: [{ type: 'field', label: '备注' }],
      f21: [{ type: 'seal', label: '印章' }]
    }
  },
  {
    id: 'scheme-002',
    name: '商务标清单扫描件映射',
    creator: '李工',
    updatedAt: '2026-06-14 10:18',
    usageCount: 9,
    startPage: '2',
    mappingFields: ['工程名称', '建设单位', '施工单位', '楼号', '桩径', '桩数', '备注'],
    cellMarks: {
      a1: [{ type: 'field', label: '工程名称' }],
      a2: [{ type: 'field', label: '建设单位' }],
      a4: [{ type: 'field', label: '施工单位' }],
      b7: [{ type: 'field', label: '楼号' }],
      c7: [{ type: 'field', label: '桩径' }],
      e7: [{ type: 'field', label: '桩数' }],
      f7: [{ type: 'field', label: '备注' }]
    }
  }
];

const DocumentExtractionView: React.FC = () => {
  const [documents, setDocuments] = useState<DocumentRecord[]>(INITIAL_DOCUMENTS);
  const [taskFilesByDocument, setTaskFilesByDocument] = useState<Record<string, TaskUploadFile[]>>(INITIAL_TASK_FILES);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedStatus, setSelectedStatus] = useState<string>('');
  const [isStatusOpen, setIsStatusOpen] = useState(false);
  const [selectedDocument, setSelectedDocument] = useState<DocumentRecord | null>(null);
  const [uploadFilesDocument, setUploadFilesDocument] = useState<DocumentRecord | null>(null);
  const [parsingDocument, setParsingDocument] = useState<DocumentRecord | null>(null);
  const [cellMarks, setCellMarks] = useState<Record<string, CellMark[]>>({});
  const [mappingFields, setMappingFields] = useState<string[]>(DEFAULT_MAPPING_FIELDS);
  const [isFieldInputOpen, setIsFieldInputOpen] = useState(false);
  const [fieldInput, setFieldInput] = useState('');
  const [conversionMode, setConversionMode] = useState<ConversionMode>('manual');
  const [isModeOpen, setIsModeOpen] = useState(false);
  const [pendingConversionMode, setPendingConversionMode] = useState<ConversionMode | null>(null);
  const [dataStartRow, setDataStartRow] = useState('');
  const [isHistorySchemeOpen, setIsHistorySchemeOpen] = useState(false);
  const [historySchemeKeyword, setHistorySchemeKeyword] = useState('');
  const [selectedHistorySchemeId, setSelectedHistorySchemeId] = useState<string>(HISTORY_SCHEMES[0]?.id || '');
  const [isSaveSchemeOpen, setIsSaveSchemeOpen] = useState(false);
  const [saveSchemeName, setSaveSchemeName] = useState('');
  const [isUploadSettingOpen, setIsUploadSettingOpen] = useState(false);
  const [newTaskName, setNewTaskName] = useState('');
  const [parseStartPages, setParseStartPages] = useState<Record<string, string>>({});
  const [uploadFilePages, setUploadFilePages] = useState<Record<string, number>>({});
  const [fileStatusFilters, setFileStatusFilters] = useState<Record<string, TaskFileStatus | ''>>({});
  const [openFileStatusFilterId, setOpenFileStatusFilterId] = useState<string | null>(null);
  const [fieldValueTypes, setFieldValueTypes] = useState<Record<string, string>>({});
  const [fieldTestTextDrafts, setFieldTestTextDrafts] = useState<Record<string, string>>({});
  const [fieldTestTextSelections, setFieldTestTextSelections] = useState<Record<string, number[]>>({});
  const [openValueTypeKey, setOpenValueTypeKey] = useState<string | null>(null);
  const [activeTagKey, setActiveTagKey] = useState<string | null>(null);
  const modeDropdownRef = useRef<HTMLDivElement>(null);
  const onlyMergeHeader = conversionMode === 'mergeHeader';

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (modeDropdownRef.current && !modeDropdownRef.current.contains(event.target as Node)) {
        setIsModeOpen(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const filteredDocuments = useMemo(() => {
    const keyword = searchTerm.trim().toLowerCase();

    return documents.filter(item => {
      const matchKeyword = keyword
        ? getTaskName(item).toLowerCase().includes(keyword) || item.fileName.toLowerCase().includes(keyword) || item.owner.toLowerCase().includes(keyword)
        : true;
      const matchStatus = selectedStatus ? getStatusLabel(item.status) === selectedStatus : true;
      return matchKeyword && matchStatus;
    });
  }, [documents, searchTerm, selectedStatus]);

  const handleDelete = (id: string) => {
    const target = documents.find(item => item.id === id);
    if (!target) return;

    if (window.confirm(`确定删除“${getTaskName(target)}”吗？`)) {
      setDocuments(prev => prev.filter(item => item.id !== id));
      setSelectedDocument(prev => (prev?.id === id ? null : prev));
    }
  };

  const handleUploadDocument = () => {
    setNewTaskName('');
    setIsUploadSettingOpen(true);
  };

  const handleConfirmUpload = () => {
    const taskName = newTaskName.trim() || '新建文档识别任务';
    const now = new Date();
    const createdAt = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-${String(now.getDate()).padStart(2, '0')} ${String(now.getHours()).padStart(2, '0')}:${String(now.getMinutes()).padStart(2, '0')}`;
    const nextDocument: DocumentRecord = {
      id: `doc-${Date.now()}`,
      taskName,
      fileName: `${taskName}.pdf`,
      createdAt,
      status: '识别中',
      startPage: 1,
      uploadCount: 1,
      pages: 24,
      size: '3.2MB',
      owner: '管理员',
      resultCount: 0
    };

    setDocuments(prev => [nextDocument, ...prev]);
    setTaskFilesByDocument(prev => ({ ...prev, [nextDocument.id]: [] }));
    setIsUploadSettingOpen(false);
    setNewTaskName('');
    setParsingDocument(nextDocument);
    setUploadFilesDocument(nextDocument);
  };

  const getTaskFiles = (documentId: string) => taskFilesByDocument[documentId] || [];
  const isDocumentConversionLocked = (documentId: string) => getTaskFiles(documentId).some(file => file.status === '转换中');
  const getParseStartPage = (document: DocumentRecord) => parseStartPages[document.id] || String(document.startPage || 1);
  const handleParseStartPageChange = (documentId: string, value: string) => {
    const nextValue = value.replace(/[^\d]/g, '').slice(0, 3);
    setParseStartPages(prev => ({ ...prev, [documentId]: nextValue }));
  };

  const handleUploadTaskFiles = (document: DocumentRecord) => {
    const currentFiles = getTaskFiles(document.id);
    if (currentFiles.some(file => !['上传中', '上传失败'].includes(file.status))) return;

    const batchCount = currentFiles.length === 0 ? 2 : 1;
    const now = Date.now();
    const nextFiles: TaskUploadFile[] = Array.from({ length: batchCount }).map((_, index) => ({
      id: `file-${now}-${index}`,
      fileName: `${getTaskName(document)}-${String(currentFiles.length + index + 1).padStart(2, '0')}.pdf`,
      fileType: '工程文件',
      status: '上传中',
      progress: 35 + index * 20
    }));

    setTaskFilesByDocument(prev => ({
      ...prev,
      [document.id]: [...currentFiles, ...nextFiles]
    }));
    setDocuments(prev => prev.map(item => (
      item.id === document.id ? { ...item, uploadCount: currentFiles.length + nextFiles.length } : item
    )));
    setParsingDocument(prev => (prev?.id === document.id ? { ...prev, uploadCount: currentFiles.length + nextFiles.length } : prev));
  };

  const handleStartParseTask = (document: DocumentRecord) => {
    const currentFiles = getTaskFiles(document.id);
    if (currentFiles.length === 0 || currentFiles.some(file => !['上传中', '上传失败'].includes(file.status))) return;

    const startPage = Math.max(1, Number(getParseStartPage(document)) || 1);

    setTaskFilesByDocument(prev => ({
      ...prev,
      [document.id]: currentFiles.map(file => {
        if (file.status === '上传失败') return file;
        return { ...file, status: '待解析', progress: 100, message: undefined };
      })
    }));

    setDocuments(prev => prev.map(item => (
      item.id === document.id ? { ...item, status: '待确认', startPage } : item
    )));
    setParsingDocument(prev => (prev?.id === document.id ? { ...prev, status: '待确认', startPage } : prev));
    setUploadFilesDocument(null);
    setParsingDocument({ ...document, status: '待确认', startPage });
  };

  const handleDeleteTaskFile = (document: DocumentRecord, fileId: string) => {
    const nextFiles = getTaskFiles(document.id).filter(file => file.id !== fileId);

    setTaskFilesByDocument(prev => ({
      ...prev,
      [document.id]: nextFiles
    }));
    setDocuments(prev => prev.map(item => (
      item.id === document.id ? { ...item, uploadCount: nextFiles.length } : item
    )));
    setParsingDocument(prev => (prev?.id === document.id ? { ...prev, uploadCount: nextFiles.length } : prev));
  };

  const handleOpenDetail = (item: DocumentRecord) => {
    setParsingDocument(item);
  };

  const handleStartConversion = (document: DocumentRecord) => {
    const nextDocument = { ...document, status: '识别中' as DocumentStatus };

    setActiveTagKey(null);
    setOpenValueTypeKey(null);
    setIsFieldInputOpen(false);
    setIsHistorySchemeOpen(false);
    setPendingConversionMode(null);
    setDocuments(prev => prev.map(item => (
      item.id === document.id ? nextDocument : item
    )));
    setParsingDocument(prev => (prev?.id === document.id ? nextDocument : prev));
    setUploadFilesDocument(nextDocument);
    setTaskFilesByDocument(prev => ({
      ...prev,
      [document.id]: (prev[document.id] || []).map(file => (
        file.status === '上传失败' || file.status === '转换失败' ? file : { ...file, status: '转换中', progress: Math.max(file.progress, 72) }
      ))
    }));
  };

  const openUploadFilesModal = (item: DocumentRecord) => {
    setUploadFilesDocument(item);
  };

  const handleAddFields = () => {
    if (parsingDocument && isDocumentConversionLocked(parsingDocument.id)) return;
    if (onlyMergeHeader) return;

    const nextFields = fieldInput
      .split(/[\s,，、;；\n]+/)
      .map(item => item.trim())
      .filter(Boolean);

    if (nextFields.length === 0) return;

    setMappingFields(prev => Array.from(new Set([...prev, ...nextFields])));
    setFieldInput('');
    setIsFieldInputOpen(false);
  };

  const handleDeleteField = (field: string) => {
    if (parsingDocument && isDocumentConversionLocked(parsingDocument.id)) return;
    setMappingFields(prev => prev.filter(item => item !== field));
    setCellMarks(prev => {
      const next = Object.fromEntries(
        getCellMarkEntries(prev)
          .map(([cellId, marks]) => [cellId, marks.filter(mark => mark.label !== field)])
          .filter(([, marks]) => (marks as CellMark[]).length > 0)
      ) as Record<string, CellMark[]>;

      return next;
    });
  };

  const clearMappingSettings = () => {
    setCellMarks({});
    setDataStartRow('');
    setFieldInput('');
    setMappingFields(DEFAULT_MAPPING_FIELDS);
    setIsFieldInputOpen(false);
  };

  const hasMappingSettings =
    Object.keys(cellMarks).length > 0 ||
    Boolean(dataStartRow) ||
    fieldInput.trim().length > 0 ||
    mappingFields.length !== DEFAULT_MAPPING_FIELDS.length ||
    mappingFields.some((field, index) => field !== DEFAULT_MAPPING_FIELDS[index]);

  const handleConversionModeChange = (mode: ConversionMode) => {
    if (parsingDocument && isDocumentConversionLocked(parsingDocument.id)) return;
    if (mode !== conversionMode) {
      if (hasMappingSettings) {
        setPendingConversionMode(mode);
        setIsModeOpen(false);
        return;
      }

      clearMappingSettings();
    }
    setConversionMode(mode);
    setIsModeOpen(false);
  };

  const handleConfirmModeChange = () => {
    if (parsingDocument && isDocumentConversionLocked(parsingDocument.id)) return;
    if (!pendingConversionMode) return;

    clearMappingSettings();
    setConversionMode(pendingConversionMode);
    setPendingConversionMode(null);
  };

  const handleDragStart = (event: React.DragEvent<HTMLElement>, mark: CellMark) => {
    if (parsingDocument && isDocumentConversionLocked(parsingDocument.id)) {
      event.preventDefault();
      return;
    }

    if (onlyMergeHeader && mark.type !== 'startRow') {
      event.preventDefault();
      return;
    }

    event.dataTransfer.setData('application/json', JSON.stringify(mark));
    event.dataTransfer.effectAllowed = 'copy';
  };

  const getCellRowNumber = (cellId: string) => cellId.match(/\d+/)?.[0] || '';

  const handleDropOnCell = (event: React.DragEvent<HTMLTableCellElement>, cellId: string) => {
    event.preventDefault();
    if (parsingDocument && isDocumentConversionLocked(parsingDocument.id)) return;
    setActiveTagKey(null);

    try {
      const mark = JSON.parse(event.dataTransfer.getData('application/json')) as CellMark;
      if (!mark.type || !mark.label) return;
      if (onlyMergeHeader && mark.type !== 'startRow') return;

      if (mark.type === 'startRow') {
        setDataStartRow(getCellRowNumber(cellId));
        return;
      }

      setCellMarks(prev => {
        const withoutSameTag = mark.type === 'field'
          ? Object.fromEntries(
              getCellMarkEntries(prev)
                .map(([currentCellId, marks]) => [
                  currentCellId,
                  marks.filter(item => !(item.type === mark.type && item.label === mark.label))
                ])
                .filter(([, marks]) => (marks as CellMark[]).length > 0)
            ) as Record<string, CellMark[]>
          : prev;
        const currentMarks = withoutSameTag[cellId] || [];
        const nextMarks =
          mark.type === 'field'
            ? [...currentMarks.filter(item => item.type !== 'field'), mark]
            : [...currentMarks.filter(item => !(item.type === mark.type && item.label === mark.label)), mark];

        return {
          ...withoutSameTag,
          [cellId]: nextMarks
        };
      });
    } catch {
      // Ignore invalid drag payloads from outside this page.
    }
  };

  const handleRemoveCellMark = (cellId: string, mark: CellMark) => {
    if (parsingDocument && isDocumentConversionLocked(parsingDocument.id)) return;
    setCellMarks(prev => {
      const nextMarks = (prev[cellId] || []).filter(item => !(item.type === mark.type && item.label === mark.label));
      const next = { ...prev };

      if (nextMarks.length > 0) {
        next[cellId] = nextMarks;
      } else {
        delete next[cellId];
      }

      return next;
    });
  };

  const handleDataStartRowChange = (value: string) => {
    if (parsingDocument && isDocumentConversionLocked(parsingDocument.id)) return;
    setDataStartRow(value.replace(/[^\d]/g, '').slice(0, 3));
  };

  const getFieldTestTextValue = (field: string) => fieldTestTextDrafts[field] ?? DEFAULT_FIELD_TEST_TEXT;

  const getFieldTestTextLines = (field: string) =>
    getFieldTestTextValue(field)
      .split(/\n+/)
      .map(item => item.trim())
      .filter(Boolean);

  const getFieldTestTextSelection = (field: string) => fieldTestTextSelections[field] || [];

  const formatTestTextSelectionSummary = (field: string) => {
    const selectedIndices = getFieldTestTextSelection(field);

    if (selectedIndices.length === 0) return '请选择一个或多个匹配文本行';

    return selectedIndices
      .map(index => `第${index + 1}条`)
      .join('、');
  };

  const updateFieldTestTextValue = (field: string, value: string) => {
    if (parsingDocument && isDocumentConversionLocked(parsingDocument.id)) return;
    setFieldTestTextDrafts(prev => ({ ...prev, [field]: value }));
    setFieldTestTextSelections(prev => ({ ...prev, [field]: [] }));
  };

  const toggleFieldTestTextIndex = (field: string, index: number) => {
    if (parsingDocument && isDocumentConversionLocked(parsingDocument.id)) return;
    const lines = getFieldTestTextLines(field);
    if (!lines[index]) return;

    setFieldTestTextSelections(prev => {
      const current = prev[field] || [];
      const next = current.includes(index)
        ? current.filter(item => item !== index)
        : [...current, index];

      return {
        ...prev,
        [field]: next.sort((a, b) => a - b)
      };
    });
  };

  const selectAllFieldTestText = (field: string) => {
    if (parsingDocument && isDocumentConversionLocked(parsingDocument.id)) return;
    const lines = getFieldTestTextLines(field);
    if (lines.length === 0) return;

    setFieldTestTextSelections(prev => ({
      ...prev,
      [field]: lines.map((_, index) => index)
    }));
  };

  const clearFieldTestTextSelection = (field: string) => {
    if (parsingDocument && isDocumentConversionLocked(parsingDocument.id)) return;
    setFieldTestTextSelections(prev => ({
      ...prev,
      [field]: []
    }));
  };

  const isParsedRowStartRow = (row: ParsedCell[]) =>
    Boolean(dataStartRow) && row.some(cell => getCellRowNumber(cell.id) === dataStartRow);

  const getCellRefLabel = (cellId: string) => {
    const cell = PARSED_TABLE_ROWS.flat().find(item => item.id === cellId);
    if (!cell) return '';
    return cell.ref;
  };

  const getCellMarkEntries = (marks: Record<string, CellMark[]>) => Object.entries(marks) as [string, CellMark[]][];

  const getMarkBindingRef = (mark: CellMark) => {
    const boundCellIds = getCellMarkEntries(cellMarks)
      .filter(([, marks]) => marks.some(item => item.type === mark.type && item.label === mark.label))
      .map(([cellId]) => cellId);

    return boundCellIds.map(getCellRefLabel).join('、');
  };

  const getTagKey = (mark: CellMark) => `${mark.type}:${mark.label}`;

  const getFieldTestTextSelectionState = (field: string) => {
    const lines = getFieldTestTextLines(field);
    const selectedIndices = getFieldTestTextSelection(field);
    const selectedCount = selectedIndices.length;

    return {
      lines,
      selectedIndices,
      selectedCount,
      allSelected: lines.length > 0 && selectedCount === lines.length,
      partialSelected: selectedCount > 0 && selectedCount < lines.length
    };
  };

  const renderUntitledCheckbox = (state: 'checked' | 'indeterminate' | 'unchecked') => {
    const isActive = state !== 'unchecked';

    return (
      <span className={`flex h-4 w-4 shrink-0 items-center justify-center rounded-[4px] border transition-colors ${
        isActive ? 'border-blue-600 bg-blue-600' : 'border-[#D0D5DD] bg-white'
      }`}>
        {state === 'checked' && <Icon name="Check" size={12} className="text-white" strokeWidth={3} />}
        {state === 'indeterminate' && <Icon name="Minus" size={12} className="text-white" strokeWidth={3} />}
      </span>
    );
  };

  const filteredHistorySchemes = useMemo(() => {
    const keyword = historySchemeKeyword.trim().toLowerCase();
    if (!keyword) return HISTORY_SCHEMES;

    return HISTORY_SCHEMES.filter(item => item.name.toLowerCase().includes(keyword));
  }, [historySchemeKeyword]);

  const selectedHistoryScheme =
    filteredHistorySchemes.find(item => item.id === selectedHistorySchemeId) ||
    filteredHistorySchemes[0] ||
    null;

  const openHistorySchemeModal = () => {
    setHistorySchemeKeyword('');
    setSelectedHistorySchemeId(HISTORY_SCHEMES[0]?.id || '');
    setIsHistorySchemeOpen(true);
  };

  const applyHistoryScheme = (mode: 'fields' | 'all') => {
    if (parsingDocument && isDocumentConversionLocked(parsingDocument.id)) return;
    if (!selectedHistoryScheme) return;

    if (hasMappingSettings) {
      const confirmed = window.confirm('导入历史方案后，当前已标记内容将被覆盖，是否继续？');
      if (!confirmed) return;
    }

    setMappingFields(selectedHistoryScheme.mappingFields);
    setFieldInput('');
    setActiveTagKey(null);

    if (mode === 'all') {
      setCellMarks(selectedHistoryScheme.cellMarks);
      setDataStartRow('');
    } else {
      setCellMarks({});
      setDataStartRow('');
    }

    setIsHistorySchemeOpen(false);
  };

  const renderUploadFilesPanel = (document: DocumentRecord, compact = false) => {
    const taskFiles = getTaskFiles(document.id);
    const selectedFileStatus = fileStatusFilters[document.id] || '';
    const filteredTaskFiles = selectedFileStatus
      ? taskFiles.filter(file => file.status === selectedFileStatus)
      : taskFiles;
    const hasStartedParsing = taskFiles.some(file => !['上传中', '上传失败'].includes(file.status));
    const totalPages = Math.max(1, Math.ceil(filteredTaskFiles.length / UPLOAD_FILES_PAGE_SIZE));
    const currentPage = Math.min(uploadFilePages[document.id] || 1, totalPages);
    const pagedFiles = filteredTaskFiles.slice(
      (currentPage - 1) * UPLOAD_FILES_PAGE_SIZE,
      currentPage * UPLOAD_FILES_PAGE_SIZE
    );

    return (
      <div className="space-y-3">
        <div className="space-y-3">
          <div className="flex flex-wrap items-center gap-2">
            <button
              onClick={() => handleUploadTaskFiles(document)}
              disabled={hasStartedParsing}
              className="h-8 px-3 rounded-[4px] bg-blue-600 text-white text-sm font-medium hover:bg-blue-700 transition-colors inline-flex items-center gap-1.5 disabled:bg-slate-100 disabled:text-slate-300 disabled:cursor-not-allowed"
            >
              <Icon name="Upload" size={15} />
              <span>上传文件</span>
            </button>
            <div className="relative">
              <button
                type="button"
                onClick={() => setOpenFileStatusFilterId(openFileStatusFilterId === document.id ? null : document.id)}
                className="h-8 w-36 px-3 rounded-[4px] border border-slate-200 bg-white text-sm text-slate-700 hover:border-blue-500 focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 outline-none transition-all flex items-center justify-between"
              >
                <span>{selectedFileStatus || '全部状态'}</span>
                <Icon name="ChevronDown" size={15} className={`text-slate-400 transition-transform ${openFileStatusFilterId === document.id ? 'rotate-180' : ''}`} />
              </button>
              {openFileStatusFilterId === document.id && (
                <div className="absolute left-0 top-full z-30 mt-2 w-36 rounded-lg border border-slate-200 bg-white p-1 shadow-lg">
                  {FILE_STATUS_FILTER_OPTIONS.map(option => {
                    const label = option || '全部状态';
                    const isSelected = selectedFileStatus === option;

                    return (
                      <button
                        key={label}
                        type="button"
                        onClick={() => {
                          setFileStatusFilters(prev => ({ ...prev, [document.id]: option }));
                          setUploadFilePages(prev => ({ ...prev, [document.id]: 1 }));
                          setOpenFileStatusFilterId(null);
                        }}
                        className={`flex h-9 w-full items-center justify-between rounded-md px-3 text-left text-sm transition-colors ${
                          isSelected ? 'bg-blue-50 text-blue-700 font-medium' : 'text-slate-700 hover:bg-slate-50'
                        }`}
                      >
                        <span>{label}</span>
                        {isSelected && <Icon name="Check" size={14} className="text-blue-600" />}
                      </button>
                    );
                  })}
                </div>
              )}
            </div>
            <div className="ml-auto flex items-center gap-1 text-sm text-slate-600">
              <span>从第</span>
              <input
                value={getParseStartPage(document)}
                onChange={(event) => handleParseStartPageChange(document.id, event.target.value)}
                inputMode="numeric"
                disabled={hasStartedParsing}
                className="h-8 w-14 rounded-[4px] border border-slate-200 bg-white px-2 text-center text-sm text-slate-800 outline-none transition-all hover:border-blue-500 focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 disabled:bg-slate-50 disabled:text-slate-400 disabled:cursor-not-allowed"
              />
              <span>页开始</span>
            </div>
            <button
              onClick={() => handleStartParseTask(document)}
              disabled={taskFiles.length === 0 || hasStartedParsing}
              className="h-8 px-3 rounded-[4px] bg-blue-600 text-white text-sm font-medium hover:bg-blue-700 transition-colors disabled:bg-slate-100 disabled:text-slate-300 disabled:cursor-not-allowed"
            >
              解析
            </button>
          </div>
        </div>

        {filteredTaskFiles.length > 0 ? (
          <div className="flex min-h-[618px] flex-col overflow-hidden rounded-xl border border-slate-100">
            <table className="w-full text-left border-collapse">
              <thead className="bg-slate-50 border-b border-slate-100">
                <tr>
                  <th className="px-4 py-3 text-sm font-semibold text-slate-800">文件名称</th>
                  <th className="px-4 py-3 text-sm font-semibold text-slate-800">状态</th>
                  <th className="px-4 py-3 text-sm font-semibold text-slate-800 text-right">操作</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {pagedFiles.map(file => (
                  <tr key={file.id} className="h-14 hover:bg-slate-50">
                    <td className="px-4 py-3 text-sm text-slate-700">{file.fileName}</td>
                    <td className="px-4 py-3">
                      <span className={`inline-flex items-center rounded-full border px-2.5 py-1 text-xs font-medium ${UPLOAD_STATUS_STYLES[file.status]}`}>
                        {isUploadStatusLoading(file.status) && <Icon name="Loader2" size={12} className="mr-1.5 animate-spin" />}
                        {file.status}
                        {isUploadStatusLoading(file.status) && <span className="ml-1">{file.progress}%</span>}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-right">
                      <div className="inline-flex items-center gap-3">
                        {file.status === '待解析' && (
                          <button
                            onClick={() => {
                              setUploadFilesDocument(null);
                              handleOpenDetail(document);
                            }}
                            className="text-sm font-medium text-blue-600 hover:text-blue-700"
                          >
                            去设置
                          </button>
                        )}
                        {file.status === '转换成功' && (
                          <button className="text-sm font-medium text-blue-600 hover:text-blue-700">
                            下载结果
                          </button>
                        )}
                        <button
                          onClick={() => handleDeleteTaskFile(document, file.id)}
                          className="text-sm font-medium text-red-500 hover:text-red-600"
                        >
                          删除
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
            <div className="mt-auto flex items-center justify-end border-t border-slate-100 px-4 py-3">
              <div className="flex items-center gap-2 text-sm text-slate-500">
                <span>共 {filteredTaskFiles.length} 条</span>
                <button
                  onClick={() => setUploadFilePages(prev => ({ ...prev, [document.id]: Math.max(1, currentPage - 1) }))}
                  disabled={currentPage === 1}
                  className="flex h-8 w-8 items-center justify-center rounded-lg border border-slate-200 text-slate-500 transition-colors hover:border-blue-500 hover:text-blue-600 disabled:cursor-not-allowed disabled:text-slate-300 disabled:hover:border-slate-200"
                >
                  <Icon name="ChevronLeft" size={16} />
                </button>
                {Array.from({ length: totalPages }, (_, index) => index + 1).map(page => (
                  <button
                    key={page}
                    onClick={() => setUploadFilePages(prev => ({ ...prev, [document.id]: page }))}
                    className={`flex h-8 min-w-8 items-center justify-center rounded-lg px-2 text-sm font-medium transition-colors ${
                      currentPage === page
                        ? 'bg-blue-600 text-white'
                        : 'border border-slate-200 text-slate-600 hover:border-blue-500 hover:text-blue-600'
                    }`}
                  >
                    {page}
                  </button>
                ))}
                <button
                  onClick={() => setUploadFilePages(prev => ({ ...prev, [document.id]: Math.min(totalPages, currentPage + 1) }))}
                  disabled={currentPage === totalPages}
                  className="flex h-8 w-8 items-center justify-center rounded-lg border border-slate-200 text-slate-500 transition-colors hover:border-blue-500 hover:text-blue-600 disabled:cursor-not-allowed disabled:text-slate-300 disabled:hover:border-slate-200"
                >
                  <Icon name="ChevronRight" size={16} />
                </button>
                <span className="ml-2">前往</span>
                <input
                  value={currentPage}
                  onChange={(event) => {
                    const nextPage = Math.min(totalPages, Math.max(1, Number(event.target.value.replace(/[^\d]/g, '')) || 1));
                    setUploadFilePages(prev => ({ ...prev, [document.id]: nextPage }));
                  }}
                  className="h-8 w-10 rounded-lg border border-slate-200 text-center text-sm text-slate-700 outline-none transition-colors focus:border-blue-500"
                />
                <span>页</span>
              </div>
            </div>
          </div>
        ) : (
          <div className="rounded-xl border border-slate-100 overflow-hidden min-h-[618px]">
            <table className="w-full text-left border-collapse">
              <thead className="bg-slate-50 border-b border-slate-100">
                <tr>
                  <th className="px-4 py-3 text-sm font-semibold text-slate-800">文件名称</th>
                  <th className="px-4 py-3 text-sm font-semibold text-slate-800 text-right">操作</th>
                </tr>
              </thead>
              <tbody>
                <tr>
                  <td colSpan={2} className="h-[560px] px-4 text-center text-sm text-slate-400">
                    {taskFiles.length === 0 ? '暂无上传文件' : '当前状态下暂无文件'}
                  </td>
                </tr>
              </tbody>
            </table>
          </div>
        )}
      </div>
    );
  };

  const renderUploadFilesModal = () => uploadFilesDocument ? (
    <div className="fixed inset-0 z-[120] flex items-center justify-center p-4">
      <div
        className="absolute inset-0 bg-slate-900/40 backdrop-blur-sm"
        onClick={() => {
          setUploadFilesDocument(null);
          setOpenFileStatusFilterId(null);
        }}
      ></div>
      <div className="relative w-full max-w-[920px] max-h-[92vh] overflow-hidden rounded-2xl bg-white shadow-2xl animate-in zoom-in-95 duration-200">
        <div className="px-6 py-4 border-b border-slate-100 flex items-start justify-between gap-4">
          <div className="min-w-0">
            <h3 className="text-lg font-black text-slate-800">文件列表 ({getTaskFiles(uploadFilesDocument.id).length})</h3>
            <p className="mt-1 text-xs text-slate-500">上传文件、查看解析状态与下载转换结果都在这里完成。</p>
          </div>
          <button
            onClick={() => {
              setUploadFilesDocument(null);
              setOpenFileStatusFilterId(null);
            }}
            className="w-8 h-8 flex items-center justify-center rounded-full text-slate-400 hover:bg-slate-100 hover:text-slate-600 transition-colors"
          >
            <Icon name="X" size={18} />
          </button>
        </div>
        <div className="max-h-[calc(92vh-73px)] overflow-auto p-6">
          {renderUploadFilesPanel(uploadFilesDocument)}
        </div>
      </div>
    </div>
  ) : null;

  const renderParsingResultView = (document: DocumentRecord) => (
    (() => {
      const isConversionLocked = isDocumentConversionLocked(document.id);

      return (
    <div className="flex-1 flex flex-col bg-slate-50 overflow-hidden">
      <div className="px-6 py-4 bg-white border-b border-slate-100 flex items-center justify-between shrink-0">
        <div className="flex items-center space-x-3 min-w-0">
          <button
            onClick={() => setParsingDocument(null)}
            className="w-9 h-9 rounded-lg text-slate-400 hover:bg-slate-50 hover:text-blue-600 transition-colors flex items-center justify-center"
          >
            <Icon name="ArrowLeft" size={18} />
          </button>
          <div className="min-w-0">
            <h2 className="text-base font-black text-slate-900 truncate">{getTaskName(document)}</h2>
            <p className="mt-1 text-xs text-slate-500 truncate">在下方设置表格映射关系，若内容无需调整可直接转换文件</p>
          </div>
        </div>
	        <div className="flex items-center space-x-3 shrink-0">
            <button
              onClick={() => openUploadFilesModal(document)}
              className="h-9 px-4 border border-slate-300 text-slate-700 rounded-[4px] font-medium text-sm hover:border-blue-600 hover:text-blue-600 transition-colors"
            >
              文件列表 ({getTaskFiles(document.id).length})
            </button>
	          <button
	            onClick={() => handleStartConversion(document)}
	            disabled={(onlyMergeHeader && !dataStartRow) || getTaskFiles(document.id).length === 0 || isConversionLocked}
	            className={`h-9 px-4 rounded-[4px] font-medium text-sm transition-colors ${
	              (onlyMergeHeader && !dataStartRow) || getTaskFiles(document.id).length === 0 || isConversionLocked
	                ? 'bg-slate-100 text-slate-300 cursor-not-allowed'
	                : 'bg-blue-600 text-white hover:bg-blue-700'
	            }`}
	          >
	            转换文件
	          </button>
	        </div>
      </div>

      <div className="flex-1 overflow-auto pb-6" onClick={() => {
        setActiveTagKey(null);
        setOpenValueTypeKey(null);
      }}>
        {getTaskFiles(document.id).some(file => file.status !== '上传失败') && (
        <div className="sticky top-0 z-[70] bg-white border-b border-slate-100 overflow-visible">
          <div className="px-6 py-3 flex flex-col gap-3">
            <div className="flex flex-wrap items-center gap-3">
              <span className="text-sm font-bold text-slate-900">转换模式</span>
	              <div className="relative" ref={modeDropdownRef}>
                <button
                  type="button"
                  onClick={() => {
                    if (isConversionLocked) return;
                    setIsModeOpen(prev => !prev);
                  }}
                  disabled={isConversionLocked}
                  className="h-8 w-44 px-3 border border-slate-200 rounded-lg bg-white text-sm text-slate-700 hover:border-blue-500 focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 outline-none transition-all flex items-center justify-between disabled:bg-slate-50 disabled:text-slate-400 disabled:cursor-not-allowed"
                >
                  <span>{CONVERSION_MODE_OPTIONS.find(item => item.value === conversionMode)?.label}</span>
                  <Icon name="ChevronDown" size={15} className={`text-slate-400 transition-transform ${isModeOpen ? 'rotate-180' : ''}`} />
                </button>
                {isModeOpen && (
                  <div className="absolute top-full left-0 mt-2 w-44 bg-white border border-slate-200 rounded-lg z-50 p-1">
                    {CONVERSION_MODE_OPTIONS.map(option => {
                      const isActive = conversionMode === option.value;
                      return (
                        <button
                          key={option.value}
	                          type="button"
	                          onClick={() => {
	                            handleConversionModeChange(option.value);
	                          }}
                          className={`w-full h-9 px-3 rounded-md text-left text-sm transition-colors flex items-center justify-between ${
                            isActive ? 'bg-blue-50 text-blue-700 font-medium' : 'text-slate-700 hover:bg-slate-50'
                          }`}
                        >
                          <span>{option.label}</span>
                          {isActive && <Icon name="Check" size={14} className="text-blue-600" />}
                        </button>
                      );
                    })}
                  </div>
	                )}
	              </div>
	              <span className="text-xs text-slate-400">{CONVERSION_MODE_DESCRIPTIONS[conversionMode]}</span>
	            </div>

            <div className="flex min-w-0 flex-wrap items-center gap-2">
              {conversionMode === 'manual' && (
                <>
		                <button
		                  onClick={() => setIsFieldInputOpen(true)}
		                  disabled={isConversionLocked}
		                  className="h-8 px-3 rounded-[4px] font-medium text-sm transition-colors flex items-center space-x-1 bg-blue-600 text-white hover:bg-blue-700 disabled:bg-slate-100 disabled:text-slate-300 disabled:cursor-not-allowed"
                >
		                  <Icon name="Plus" size={15} />
		                  <span>添加映射字段</span>
		                </button>
                    <button
                      onClick={openHistorySchemeModal}
                      disabled={isConversionLocked}
                      className="h-8 px-3 border border-slate-300 text-slate-700 rounded-[4px] font-medium text-sm hover:border-blue-600 hover:text-blue-600 transition-colors flex items-center gap-1.5 disabled:bg-slate-50 disabled:text-slate-300 disabled:border-slate-200 disabled:cursor-not-allowed"
                    >
                      <Icon name="History" size={15} />
                      <span>导入历史方案</span>
                    </button>
                    <button
                      onClick={() => {
                        setSaveSchemeName('');
                        setIsSaveSchemeOpen(true);
                      }}
                      className="h-8 px-3 border border-slate-300 text-slate-700 rounded-[4px] font-medium text-sm hover:border-blue-600 hover:text-blue-600 transition-colors flex items-center gap-1.5"
                    >
                      <Icon name="Save" size={15} />
                      <span>保存方案</span>
                    </button>
		                </>
		              )}

              {conversionMode === 'mergeHeader' && (
                <>
                <span className="text-sm font-medium text-slate-800">数据起始行</span>
                <input
                  value={dataStartRow}
                  onChange={(event) => handleDataStartRowChange(event.target.value)}
                  placeholder="1"
                  inputMode="numeric"
                  disabled={isConversionLocked}
                  className="w-20 h-8 px-3 border border-slate-200 rounded-lg text-sm text-slate-800 placeholder-slate-400 bg-white hover:border-blue-500 focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 outline-none transition-all disabled:bg-slate-50 disabled:text-slate-400 disabled:cursor-not-allowed"
                />
                <div
                  draggable={!isConversionLocked}
                  onDragStart={(event) => handleDragStart(event, { type: 'startRow', label: '数据起始行' })}
                  className={`h-8 px-3 rounded-[4px] border border-dashed flex items-center gap-1.5 text-sm font-medium transition-colors ${
                    isConversionLocked
                      ? 'border-slate-200 bg-slate-50 text-slate-300 cursor-not-allowed'
                      : 'border-blue-300 bg-blue-50 text-blue-600 cursor-grab active:cursor-grabbing hover:bg-blue-100'
                  }`}
                >
                  <Icon name="Rows3" size={15} />
                  <span>拖拽设置</span>
	                </div>
	                {!dataStartRow && <span className="text-xs text-amber-600">请选择或输入一行</span>}
	                <span className="text-xs text-slate-400">输入数据起始行，也可拖拽到对应单元格完成标注</span>
	                </>
	              )}

	            </div>
	            {conversionMode === 'manual' && (
	              <div className="rounded-lg border border-slate-100 bg-slate-50/60 px-3 py-2">
	                <div className="mb-2 flex items-center gap-3">
                    <span className="text-sm font-bold text-slate-900">字段</span>
                    <span className="text-xs text-slate-400">√为该字段已标记单元格，点击字段名称可定义取值字段，默认为文本取值</span>
                  </div>
		                <div className="flex flex-wrap items-center gap-2">
                      {(() => {
                        const sealBindingRef = getMarkBindingRef({ type: 'seal', label: '印章' });
                        const sealTagKey = getTagKey({ type: 'seal', label: '印章' });
                        return (
	                          <span
	                            draggable={!isConversionLocked}
	                            onClick={(event) => {
                                event.stopPropagation();
                                if (isConversionLocked) return;
                                setActiveTagKey(activeTagKey === sealTagKey ? null : sealTagKey);
                              }}
	                            onDragStart={(event) => handleDragStart(event, { type: 'seal', label: '印章' })}
                            className={`relative inline-flex items-center gap-1 rounded-full border border-red-100 bg-red-50 px-2.5 py-0.5 text-xs font-medium text-red-600 ${isConversionLocked ? 'cursor-not-allowed opacity-70' : 'cursor-pointer'}`}
                          >
                            {sealBindingRef && <Icon name="Check" size={11} className="text-red-500" />}
                            <span>印章</span>
                            {activeTagKey === sealTagKey && (
                              <span className="absolute left-0 top-full z-40 mt-2 whitespace-nowrap rounded-lg border border-slate-200 bg-white px-3 py-2 text-xs font-medium text-slate-600 shadow-lg">
                                {sealBindingRef ? `已标记：${sealBindingRef}` : '暂未标记单元格'}
                              </span>
                            )}
                          </span>
                        );
                      })()}
		                  {mappingFields.map(field => {
                        const bindingRef = getMarkBindingRef({ type: 'field', label: field });
                        const fieldTagKey = getTagKey({ type: 'field', label: field });
                        const selectedValueType = normalizeFieldValueType(fieldValueTypes[field]);

                        return (
                          <span
	                            key={field}
	                            draggable={!isConversionLocked}
	                            onClick={(event) => {
                                event.stopPropagation();
                                if (isConversionLocked) return;
                                setActiveTagKey(activeTagKey === fieldTagKey ? null : fieldTagKey);
                              }}
	                            onDragStart={(event) => handleDragStart(event, { type: 'field', label: field })}
                            className={`relative inline-flex items-center gap-1 rounded-full border border-blue-100 bg-[#DBEAFE] px-2.5 py-0.5 text-xs font-medium text-blue-700 ${isConversionLocked ? 'cursor-not-allowed opacity-70' : 'cursor-pointer'}`}
                          >
                            {bindingRef && <Icon name="Check" size={11} className="text-blue-500" />}
                            <span>{field}</span>
                            {activeTagKey === fieldTagKey && (
                              <span
                                onClick={(event) => event.stopPropagation()}
                                className="absolute left-0 top-full z-[80] mt-2 block w-[420px] overflow-visible rounded-xl border border-slate-200 bg-white text-left text-sm text-slate-700 shadow-xl"
                              >
                                <span className="block border-b border-slate-100 px-4 py-3 text-base font-bold text-slate-900">
                                  字段取值方式：{field}
                                </span>
                              <span className="block max-h-[70vh] space-y-3 overflow-visible p-4">
                                <span className="grid grid-cols-1 gap-3">
                                  <label className="block">
                                    <span className="mb-1.5 block text-xs font-medium text-slate-500">取值方式</span>
                                      <span className="relative block">
                                        <button
                                          type="button"
                                          onClick={(event) => {
                                            event.stopPropagation();
                                            if (isConversionLocked) return;
                                            setOpenValueTypeKey(openValueTypeKey === fieldTagKey ? null : fieldTagKey);
                                          }}
                                          disabled={isConversionLocked}
                                          className="flex h-9 w-full items-center justify-between rounded-lg border border-slate-200 bg-white px-3 text-sm text-slate-800 outline-none transition-all hover:border-blue-500 focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 disabled:bg-slate-50 disabled:text-slate-400 disabled:cursor-not-allowed"
                                        >
                                          <span>{selectedValueType}</span>
                                          <Icon name="ChevronDown" size={16} className={`text-slate-400 transition-transform ${openValueTypeKey === fieldTagKey ? 'rotate-180' : ''}`} />
                                        </button>
                                        {openValueTypeKey === fieldTagKey && (
                                          <span className="absolute left-0 top-full z-[120] mt-1 block w-full overflow-hidden rounded-lg border border-slate-200 bg-white p-1 shadow-lg">
                                            {FIELD_VALUE_TYPE_OPTIONS.map(option => {
                                              const isSelected = selectedValueType === option;
                                              return (
                                                <button
                                                  key={option}
                                                  type="button"
                                                  onClick={(event) => {
                                                    event.stopPropagation();
                                                    if (isConversionLocked) return;
                                                    setFieldValueTypes(prev => ({ ...prev, [field]: option }));
                                                    setOpenValueTypeKey(null);
                                                  }}
                                                  className={`flex h-9 w-full items-center justify-between rounded-md px-3 text-left text-sm transition-colors ${
                                                    isSelected ? 'bg-blue-50 text-blue-700 font-medium' : 'text-slate-700 hover:bg-slate-50'
                                                  }`}
                                                >
                                                  <span>{option}</span>
                                                  {isSelected && <Icon name="Check" size={14} className="text-blue-600" />}
                                                </button>
                                              );
                                            })}
                                          </span>
                                        )}
                                      </span>
                                    </label>
                                  </span>
                                  {selectedValueType === '文本' && (
                                    <div className="block">
                                      <span className="mb-1.5 block text-xs font-medium text-slate-500">匹配文本</span>
                                      {bindingRef ? (
                                        <textarea
                                          value={getFieldTestTextValue(field)}
                                          onChange={(event) => {
                                            event.stopPropagation();
                                            updateFieldTestTextValue(field, event.target.value);
                                          }}
                                          disabled={isConversionLocked}
                                          rows={3}
                                          className="w-full resize-none rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm leading-6 text-slate-800 outline-none transition-all hover:border-blue-500 focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 disabled:bg-slate-50 disabled:text-slate-400 disabled:cursor-not-allowed"
                                          placeholder="请输入匹配文本"
                                        />
                                      ) : (
                                        <div className="rounded-lg border border-dashed border-slate-200 bg-white px-3 py-4 text-sm text-slate-400">
                                          暂未标记单元格
                                        </div>
                                      )}
                                    </div>
                                  )}
                                  {selectedValueType !== '文本' && (
                                    <div className="block">
                                      <span className="mb-1.5 block text-xs font-medium text-slate-500">匹配文本</span>
                                      <div className="rounded-lg border border-slate-200 bg-slate-50/70">
                                        {(() => {
                                          const { lines: sourceLines, selectedIndices: sourceSelectedIndices, allSelected: sourceAllSelected, partialSelected: sourcePartialSelected } = getFieldTestTextSelectionState(field);
                                          const lines = bindingRef ? sourceLines : [];
                                          const selectedIndices = bindingRef ? sourceSelectedIndices : [];
                                          const allSelected = bindingRef ? sourceAllSelected : false;
                                          const partialSelected = bindingRef ? sourcePartialSelected : false;

                                          return (
                                            <>
                                              <div className="flex items-center justify-between border-b border-slate-200 px-3 py-2">
                                                <button
                                                  type="button"
                                                  onClick={(event) => {
                                                    event.stopPropagation();
                                                    if (isConversionLocked) return;
                                                    if (allSelected) {
                                                      clearFieldTestTextSelection(field);
                                                    } else {
                                                      selectAllFieldTestText(field);
                                                    }
                                                  }}
                                                  className="flex items-center gap-2 rounded-md px-2 py-1 text-xs font-medium text-slate-600 transition-colors hover:bg-white hover:text-blue-600"
                                                  disabled={isConversionLocked}
                                                >
                                                  {renderUntitledCheckbox(allSelected ? 'checked' : partialSelected ? 'indeterminate' : 'unchecked')}
                                                  <span>{allSelected ? '取消全选' : '全选'}</span>
                                                </button>
                                                <span className="text-[11px] font-medium text-slate-400">
                                                  已选 {selectedIndices.length} / {lines.length || 0}
                                                </span>
                                              </div>
                                              <div className="max-h-44 overflow-auto p-2">
                                                {!bindingRef ? (
                                                  <div className="rounded-md border border-dashed border-slate-200 bg-white px-3 py-4 text-sm text-slate-400">
                                                    暂未标记单元格
                                                  </div>
                                                ) : lines.length === 0 ? (
                                                  <div className="rounded-md border border-dashed border-slate-200 bg-white px-3 py-4 text-sm text-slate-400">
                                                    暂无匹配文本，请先在上方输入
                                                  </div>
                                                ) : (
                                                  <div className="space-y-1">
                                                    {lines.map((line, index) => {
                                                      const checked = selectedIndices.includes(index);

                                                      return (
                                                        <button
                                                          key={`${field}-${index}-${line}`}
                                                          type="button"
                                                          onClick={(event) => {
                                                            event.stopPropagation();
                                                            if (isConversionLocked) return;
                                                            toggleFieldTestTextIndex(field, index);
                                                          }}
                                                          className={`flex w-full items-start gap-3 rounded-md border px-3 py-2 text-left text-sm transition-all ${
                                                            checked
                                                              ? 'border-blue-200 bg-blue-50 text-blue-700 shadow-sm'
                                                              : 'border-transparent bg-white text-slate-700 hover:border-slate-200 hover:bg-slate-50'
                                                          }`}
                                                        >
                                                          <span className="mt-0.5">{renderUntitledCheckbox(checked ? 'checked' : 'unchecked')}</span>
                                                          <span className="mt-0.5 w-16 shrink-0 text-xs font-medium text-slate-400">第{index + 1}条</span>
                                                          <span className="flex-1 leading-6">{line}</span>
                                                        </button>
                                                      );
                                                    })}
                                                  </div>
                                                )}
                                              </div>
                                            </>
                                          );
                                        })()}
                                      </div>
                                    </div>
                                  )}
                                  <span className="block rounded-lg border border-orange-200 bg-orange-50 px-3 py-2 text-sm leading-6 text-slate-800">
                                    <span className="block">可直接测试</span>
                                    <span className="block font-medium">来源单元格：{bindingRef || '暂未标记单元格'}</span>
                                  </span>
                                </span>
                                <span className="flex justify-end gap-2 border-t border-slate-100 bg-slate-50/60 px-4 py-3">
                                  <button
                                    type="button"
                                    onClick={(event) => {
                                      event.stopPropagation();
                                      setOpenValueTypeKey(null);
                                      setActiveTagKey(null);
                                    }}
                                    className="h-9 rounded-lg border border-slate-200 bg-white px-4 text-sm font-medium text-slate-700 hover:bg-slate-50"
                                  >
                                    取消
                                  </button>
                                  <button
                                    type="button"
                                    className="h-9 rounded-lg border border-slate-200 bg-white px-4 text-sm font-medium text-slate-700 hover:bg-slate-50"
                                  >
                                    测试
                                  </button>
                                  <button
                                    type="button"
                                    onClick={(event) => {
                                      event.stopPropagation();
                                      if (isConversionLocked) return;
                                      setOpenValueTypeKey(null);
                                      setActiveTagKey(null);
                                    }}
                                    disabled={isConversionLocked}
                                    className="h-9 rounded-lg bg-blue-600 px-4 text-sm font-medium text-white hover:bg-blue-700 disabled:bg-slate-100 disabled:text-slate-300 disabled:cursor-not-allowed"
                                  >
                                    保存
                                  </button>
                                </span>
                              </span>
                            )}
                            <button
                              type="button"
                              onClick={(event) => {
                                event.stopPropagation();
                                if (isConversionLocked) return;
                                setActiveTagKey(null);
                                handleDeleteField(field);
                              }}
                              disabled={isConversionLocked}
                              className="rounded-full p-0.5 text-blue-400 hover:bg-blue-100 hover:text-blue-700 transition-colors cursor-pointer disabled:text-slate-300 disabled:hover:bg-transparent disabled:cursor-not-allowed"
                            >
                              <Icon name="X" size={11} />
                            </button>
                          </span>
                        );
                      })}
		                </div>
	              </div>
	            )}
	          </div>

	        </div>
        )}

        <div className="px-6 pt-2">
        {getTaskFiles(document.id).some(file => file.status !== '上传失败') ? (
          <div className="bg-white rounded-2xl border border-slate-100 overflow-hidden">
            <div className="overflow-auto p-4">
              <table className="w-full min-w-[1180px] border-collapse table-fixed">
                <tbody>
	                  {PARSED_TABLE_ROWS.map((row, rowIndex) => {
	                    const rowIsStartRow = isParsedRowStartRow(row);

                    return (
                      <tr key={rowIndex}>
	                        {row.map((cell, cellIndex) => (
                          (() => {
                            const cellHasMarks = (cellMarks[cell.id]?.length || 0) > 0 && !onlyMergeHeader;
                            return (
	                          <td
	                            key={cell.id}
                            colSpan={cell.colSpan}
                            rowSpan={cell.rowSpan}
                            onDragOver={(event) => {
                              if (!isConversionLocked) event.preventDefault();
                            }}
                            onDrop={(event) => handleDropOnCell(event, cell.id)}
	                            className={`relative border border-[#D6E4E0] align-top px-3 py-2 min-h-[54px] text-sm transition-colors hover:bg-blue-50/40 ${
	                              rowIsStartRow || cellHasMarks ? 'bg-blue-50' : 'bg-white'
	                            }`}
                          >
                            {rowIsStartRow && cellIndex === 0 && (
                              <span className="absolute right-2 top-2 inline-flex items-center rounded-full border border-blue-100 bg-white px-2 py-0.5 text-[11px] font-medium text-blue-700">
                                数据起始行
                              </span>
                            )}
                            <div className="text-xs font-medium text-slate-400 leading-5">{cell.ref}</div>
                            <div className="mt-0.5 min-h-5 font-semibold text-slate-800 leading-5 whitespace-pre-wrap">{cell.value}</div>
	                            {cellMarks[cell.id]?.length > 0 && !onlyMergeHeader && (
                              <div className="mt-2 flex flex-wrap gap-1.5">
	                                {cellMarks[cell.id].map(mark => (
	                                  <span
	                                    key={`${mark.type}-${mark.label}`}
	                                    className={`inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-[11px] font-medium border ${
	                                      mark.type === 'field'
	                                        ? 'bg-[#DBEAFE] text-blue-700 border-blue-100'
	                                        : mark.type === 'seal'
	                                          ? 'bg-red-50 text-red-600 border-red-100'
                                          : 'bg-emerald-50 text-emerald-700 border-emerald-100'
	                                    }`}
	                                  >
	                                    <span>{mark.label}</span>
                                      <button
                                        type="button"
                                        onClick={(event) => {
                                          event.stopPropagation();
                                          if (isConversionLocked) return;
                                          handleRemoveCellMark(cell.id, mark);
                                        }}
                                        disabled={isConversionLocked}
                                        className={`rounded-full p-0.5 transition-colors ${
                                          isConversionLocked
                                            ? 'text-slate-300 cursor-not-allowed'
                                            : mark.type === 'seal'
                                            ? 'text-red-400 hover:bg-red-100 hover:text-red-700'
                                            : 'text-blue-400 hover:bg-blue-100 hover:text-blue-700'
                                        }`}
                                      >
                                        <Icon name="X" size={10} />
                                      </button>
	                                  </span>
	                                ))}
                              </div>
	                            )}
	                          </td>
                            );
                          })()
	                        ))}
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
	          </div>
        ) : (
          <div className="bg-white rounded-2xl border border-slate-100 overflow-hidden">
            <div className="flex min-h-[360px] flex-col items-center justify-center px-6 py-16 text-center">
              <div className="mb-4 flex h-14 w-14 items-center justify-center rounded-full bg-blue-50 text-blue-600">
                <Icon name="FileSearch" size={26} />
              </div>
              <div className="text-base font-bold text-slate-900">暂无解析内容</div>
              <div className="mt-2 text-sm text-slate-500">请先上传文件并点击解析，完成表格结构解析后在此处进行映射设置。</div>
              <button
                onClick={() => openUploadFilesModal(document)}
                className="mt-5 h-9 px-4 rounded-[4px] bg-blue-600 text-white text-sm font-medium hover:bg-blue-700 transition-colors inline-flex items-center gap-1.5"
              >
                <Icon name="Upload" size={16} />
                <span>上传文件</span>
              </button>
            </div>
          </div>
        )}
        </div>
	      </div>

        {isFieldInputOpen && (
          <div className="fixed inset-0 z-[120] flex items-center justify-center">
            <div
              className="absolute inset-0 bg-slate-900/40 backdrop-blur-sm"
              onClick={() => {
                setIsFieldInputOpen(false);
                setFieldInput('');
              }}
            ></div>
            <form
              onSubmit={(event) => {
                event.preventDefault();
                handleAddFields();
              }}
              className="relative bg-white rounded-xl shadow-2xl w-full max-w-[500px] overflow-hidden animate-in zoom-in-95 duration-200"
            >
              <div className="px-6 py-4 border-b border-slate-100 flex items-center justify-between">
                <div>
                  <h3 className="text-lg font-black text-slate-800">添加映射字段</h3>
                  <p className="mt-1 text-xs text-slate-500">支持输入多个字段，使用逗号、空格或换行分隔。</p>
                </div>
                <button
                  type="button"
                  onClick={() => {
                    setIsFieldInputOpen(false);
                    setFieldInput('');
                  }}
                  className="w-8 h-8 flex items-center justify-center rounded-full text-slate-400 hover:bg-slate-100 hover:text-slate-600 transition-colors"
                >
                  <Icon name="X" size={18} />
                </button>
              </div>

              <div className="px-6 pt-4 pb-5">
                <textarea
                  value={fieldInput}
                  onChange={(event) => setFieldInput(event.target.value)}
                  placeholder="例如：合同编号、项目经理、验收日期"
                  rows={5}
                  className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm text-slate-800 placeholder-slate-400 bg-white hover:border-blue-500 focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 outline-none transition-all resize-none"
                />
              </div>

              <div className="px-6 py-3 bg-slate-50 border-t border-slate-100 flex items-center justify-end space-x-3">
                <button
                  type="button"
                  onClick={() => {
                    setIsFieldInputOpen(false);
                    setFieldInput('');
                  }}
                  className="h-9 px-5 border border-slate-300 text-slate-600 rounded-[4px] font-medium text-sm hover:bg-slate-50 transition-colors"
                >
                  取消
                </button>
                <button
                  type="submit"
                  disabled={!fieldInput.trim()}
                  className="h-9 px-5 bg-blue-600 text-white rounded-[4px] font-medium text-sm hover:bg-blue-700 transition-colors disabled:bg-slate-100 disabled:text-slate-300 disabled:cursor-not-allowed"
                >
                  确认添加
                </button>
              </div>
            </form>
          </div>
        )}

        {isHistorySchemeOpen && (
          <div className="fixed inset-0 z-[120] flex items-center justify-center p-4">
            <div
              className="absolute inset-0 bg-slate-900/40 backdrop-blur-sm"
              onClick={() => setIsHistorySchemeOpen(false)}
            ></div>
            <div className="relative w-full max-w-[980px] rounded-2xl bg-white shadow-2xl overflow-hidden animate-in zoom-in-95 duration-200">
              <div className="px-6 py-5 border-b border-slate-100 flex items-start justify-between gap-4">
                <div>
                  <h3 className="text-lg font-black text-slate-800">导入历史方案</h3>
                  <p className="mt-1 text-sm text-slate-500">选择已保存的映射方案，可快速复用字段、印章、数据起始页等标记设置</p>
                </div>
                <button
                  onClick={() => setIsHistorySchemeOpen(false)}
                  className="w-8 h-8 flex items-center justify-center rounded-full text-slate-400 hover:bg-slate-100 hover:text-slate-600 transition-colors"
                >
                  <Icon name="X" size={18} />
                </button>
              </div>

              <div className="grid grid-cols-[340px,minmax(0,1fr)] min-h-[560px] max-h-[78vh]">
                <div className="border-r border-slate-100 flex flex-col min-h-0">
                  <div className="p-5 border-b border-slate-100">
                    <div className="relative">
                      <Icon name="Search" size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                      <input
                        value={historySchemeKeyword}
                        onChange={(event) => setHistorySchemeKeyword(event.target.value)}
                        placeholder="搜索方案名称"
                        className="w-full h-10 pl-9 pr-3 border border-slate-200 rounded-lg text-sm text-slate-800 placeholder-slate-400 hover:border-blue-500 focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 outline-none transition-all"
                      />
                    </div>
                  </div>

                  <div className="flex-1 overflow-auto p-4 space-y-3 bg-slate-50/60">
                    {filteredHistorySchemes.length > 0 ? (
                      filteredHistorySchemes.map(item => {
                        const isActive = item.id === (selectedHistoryScheme?.id || '');
                        return (
                          <button
                            key={item.id}
                            onClick={() => setSelectedHistorySchemeId(item.id)}
                            className={`w-full text-left rounded-xl border p-4 transition-all ${
                              isActive
                                ? 'border-blue-500 bg-blue-50 shadow-sm'
                                : 'border-slate-200 bg-white hover:border-blue-300 hover:bg-blue-50/40'
                            }`}
                          >
                            <div className="min-w-0">
                              <div className="text-sm font-bold text-slate-800 truncate">{item.name}</div>
                            </div>
                            <div className="mt-2 text-xs text-slate-400">最近使用：{item.updatedAt}</div>
                          </button>
                        );
                      })
                    ) : (
                      <div className="h-full min-h-[320px] rounded-xl border border-dashed border-slate-200 bg-white flex flex-col items-center justify-center px-6 text-center">
                        <Icon name="FolderSearch" size={26} className="text-slate-300" />
                        <div className="mt-3 text-sm font-medium text-slate-700">未找到匹配的历史方案</div>
                        <div className="mt-1 text-xs text-slate-400">可尝试更换关键词，或先保存当前映射方案。</div>
                      </div>
                    )}
                  </div>
                </div>

                <div className="flex flex-col min-h-0">
                  <div className="flex-1 overflow-auto p-6">
                    {selectedHistoryScheme ? (
                      <div className="space-y-5">
                        <div>
                          <div className="text-lg font-black text-slate-800">{selectedHistoryScheme.name}</div>
                          <div className="mt-2 flex items-center flex-wrap gap-2 text-xs">
                            <span className="rounded-full bg-slate-100 px-2.5 py-1 text-slate-500">最近使用：{selectedHistoryScheme.updatedAt}</span>
                          </div>
                        </div>

                        <div className="grid grid-cols-3 gap-3">
                          <div className="rounded-xl border border-slate-100 bg-white px-4 py-3">
                            <div className="text-xs text-slate-400">字段数量</div>
                            <div className="mt-2 text-lg font-bold text-slate-800">{selectedHistoryScheme.mappingFields.length}</div>
                          </div>
                          <div className="rounded-xl border border-slate-100 bg-white px-4 py-3">
                            <div className="text-xs text-slate-400">标记单元格</div>
                            <div className="mt-2 text-lg font-bold text-slate-800">{Object.keys(selectedHistoryScheme.cellMarks).length}</div>
                          </div>
                          <div className="rounded-xl border border-slate-100 bg-white px-4 py-3">
                            <div className="text-xs text-slate-400">起始页</div>
                            <div className="mt-2 text-lg font-bold text-slate-800">{selectedHistoryScheme.startPage || '-'}</div>
                          </div>
                        </div>

                        <div className="rounded-2xl border border-slate-100 overflow-hidden">
                          <div className="px-5 py-4 bg-slate-50 border-b border-slate-100 flex items-center justify-between">
                            <div className="text-sm font-bold text-slate-800">映射预览</div>
                            <div className="text-xs text-slate-400">点击导入后可直接引用到当前表格</div>
                          </div>
                          <div className="p-5 grid grid-cols-2 gap-4">
                            {selectedHistoryScheme.mappingFields.map(field => {
                              const ref = getCellMarkEntries(selectedHistoryScheme.cellMarks)
                                .find(([, marks]) => marks.some(mark => mark.type === 'field' && mark.label === field))?.[0];

                              return (
                                <div key={field} className="rounded-xl border border-slate-100 bg-white px-4 py-3">
                                  <div className="text-sm font-medium text-slate-800">{field}</div>
                                  <div className="mt-1 text-xs text-slate-500">{ref ? `绑定单元格：${getCellRefLabel(ref)}` : '未绑定单元格'}</div>
                                </div>
                              );
                            })}
                          </div>
                        </div>
                      </div>
                    ) : (
                      <div className="h-full min-h-[420px] flex flex-col items-center justify-center text-center">
                        <Icon name="FileStack" size={28} className="text-slate-300" />
                        <div className="mt-3 text-sm font-medium text-slate-700">请选择一个历史方案</div>
                        <div className="mt-1 text-xs text-slate-400">选择后可在右侧查看字段和标记预览。</div>
                      </div>
                    )}
                  </div>

                  <div className="px-6 py-4 border-t border-slate-100 bg-slate-50 flex items-center justify-between">
                    <div className="text-xs text-slate-400">
                      {hasMappingSettings ? '当前页面已有映射设置，导入历史方案将覆盖当前内容。' : '导入后可继续拖拽调整当前表格标记。'}
                    </div>
                    <div className="flex items-center gap-3">
                      <button
                        onClick={() => setIsHistorySchemeOpen(false)}
                        className="h-9 px-5 border border-slate-300 text-slate-600 rounded-[4px] font-medium text-sm hover:bg-slate-50 transition-colors"
                      >
                        取消
                      </button>
                      <button
                        onClick={() => applyHistoryScheme('fields')}
                        disabled={!selectedHistoryScheme}
                        className="h-9 px-5 border border-blue-200 text-blue-600 rounded-[4px] font-medium text-sm hover:bg-blue-50 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                      >
                        仅导入字段
                      </button>
                      <button
                        onClick={() => applyHistoryScheme('all')}
                        disabled={!selectedHistoryScheme}
                        className="h-9 px-5 bg-blue-600 text-white rounded-[4px] font-medium text-sm hover:bg-blue-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                      >
                        导入全部标记
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}

        {isSaveSchemeOpen && (
          <div className="fixed inset-0 z-[120] flex items-center justify-center p-4">
            <div
              className="absolute inset-0 bg-slate-900/40 backdrop-blur-sm"
              onClick={() => {
                setIsSaveSchemeOpen(false);
                setSaveSchemeName('');
              }}
            ></div>
            <div className="relative w-full max-w-[460px] rounded-xl bg-white shadow-2xl overflow-hidden animate-in zoom-in-95 duration-200">
              <div className="px-6 py-4 border-b border-slate-100 flex items-center justify-between">
                <h3 className="text-lg font-black text-slate-800">保存方案</h3>
                <button
                  onClick={() => {
                    setIsSaveSchemeOpen(false);
                    setSaveSchemeName('');
                  }}
                  className="w-8 h-8 flex items-center justify-center rounded-full text-slate-400 hover:bg-slate-100 hover:text-slate-600 transition-colors"
                >
                  <Icon name="X" size={18} />
                </button>
              </div>

              <div className="p-6 space-y-3">
                <label className="block text-sm font-medium text-slate-800">方案名称</label>
                <input
                  value={saveSchemeName}
                  onChange={(event) => setSaveSchemeName(event.target.value)}
                  placeholder="请输入方案名称"
                  className="w-full h-10 px-3 border border-slate-200 rounded-lg text-sm text-slate-800 placeholder-slate-400 bg-white hover:border-blue-500 focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 outline-none transition-all"
                />
              </div>

              <div className="px-6 py-4 bg-slate-50 border-t border-slate-100 flex items-center justify-end space-x-3">
                <button
                  onClick={() => {
                    setIsSaveSchemeOpen(false);
                    setSaveSchemeName('');
                  }}
                  className="h-9 px-5 border border-slate-300 text-slate-600 rounded-[4px] font-medium text-sm hover:bg-slate-50 transition-colors"
                >
                  取消
                </button>
                <button
                  onClick={() => {
                    setIsSaveSchemeOpen(false);
                    setSaveSchemeName('');
                  }}
                  disabled={!saveSchemeName.trim()}
                  className="h-9 px-5 bg-blue-600 text-white rounded-[4px] font-medium text-sm hover:bg-blue-700 transition-colors disabled:bg-slate-100 disabled:text-slate-300 disabled:cursor-not-allowed"
                >
                  确认保存
                </button>
              </div>
            </div>
          </div>
        )}

        {pendingConversionMode && (
          <div className="fixed inset-0 z-[120] flex items-center justify-center bg-black/45 backdrop-blur-sm p-4 animate-in fade-in duration-200">
	            <div className="bg-white rounded-[24px] shadow-2xl w-full max-w-[440px] overflow-hidden border border-slate-100 animate-in zoom-in-95 duration-200">
	              <div className="px-6 py-5 border-b border-slate-100 flex items-start justify-between gap-4">
	                <div>
	                  <h3 className="text-lg font-black text-slate-800">切换转换模式</h3>
	                  <p className="mt-2 text-sm leading-6 text-slate-500">
	                    当前已有映射设置，切换模式将清空当前设置，是否继续？
	                  </p>
	                </div>
                  <button
                    onClick={() => setPendingConversionMode(null)}
                    className="w-8 h-8 flex items-center justify-center rounded-full text-slate-300 hover:bg-slate-100 hover:text-slate-600 transition-colors shrink-0"
                  >
                    <Icon name="X" size={18} />
                  </button>
	              </div>
              <div className="px-6 py-4 bg-slate-50/50 flex items-center justify-end space-x-3">
                <button
                  onClick={() => setPendingConversionMode(null)}
                  className="px-5 py-2.5 bg-white border border-slate-200 text-slate-600 rounded-xl text-sm font-bold hover:bg-slate-50 transition-all"
                >
                  取消
                </button>
                <button
                  onClick={handleConfirmModeChange}
                  className="px-6 py-2.5 bg-blue-600 text-white rounded-xl text-sm font-black shadow-lg shadow-blue-500/20 hover:bg-blue-700 transition-all active:scale-95"
                >
                  确认切换
                </button>
              </div>
            </div>
          </div>
        )}
        {renderUploadFilesModal()}
		    </div>
	  );
    })()
  );

  if (parsingDocument) {
    return renderParsingResultView(parsingDocument);
  }

  return (
    <div className="flex-1 flex flex-col bg-slate-50 overflow-hidden">
      <div className="flex-1 overflow-auto p-6">
        <div className="bg-white rounded-2xl shadow-sm border border-slate-100 overflow-hidden">
          <div className="p-5 border-b border-slate-100 bg-white space-y-4">
            <div className="flex flex-wrap items-center gap-4">
              <div className="flex items-center space-x-2">
                <span className="text-sm font-medium text-slate-800">任务名称</span>
                <div className="relative">
                  <div className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-slate-400">
                    <Icon name="Search" size={16} />
                  </div>
                  <input
                    type="text"
                    placeholder="搜索任务名称"
                    className="w-64 h-9 pl-9 pr-3 border border-slate-200 rounded-lg text-sm text-slate-800 placeholder-slate-400 bg-white hover:border-blue-500 focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 outline-none transition-all"
                    value={searchTerm}
                    onChange={(event) => setSearchTerm(event.target.value)}
                  />
                </div>
              </div>

              <div className="flex items-center space-x-2">
                <span className="text-sm font-medium text-slate-800">状态</span>
                <div className="relative">
                  <button
                    type="button"
                    onClick={() => setIsStatusOpen(prev => !prev)}
                    className="w-36 h-9 px-3 border border-slate-200 rounded-lg bg-white text-sm text-slate-700 hover:border-blue-500 focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 outline-none transition-all flex items-center justify-between"
                  >
                    <span>{selectedStatus || '全部状态'}</span>
                    <Icon name="ChevronDown" size={16} className={`text-slate-400 transition-transform ${isStatusOpen ? 'rotate-180' : ''}`} />
                  </button>
                  {isStatusOpen && (
                    <div className="absolute top-full left-0 mt-2 w-36 bg-white border border-slate-200 rounded-lg z-20 p-1">
                      {['', ...STATUS_OPTIONS].map(option => {
                        const label = option || '全部状态';
                        const isActive = selectedStatus === option;
                        return (
                          <button
                            key={label}
                            type="button"
                            onClick={() => {
                              setSelectedStatus(option);
                              setIsStatusOpen(false);
                            }}
                            className={`w-full h-9 px-3 rounded-md text-left text-sm transition-colors flex items-center justify-between ${
                              isActive ? 'bg-blue-50 text-blue-700 font-medium' : 'text-slate-700 hover:bg-slate-50'
                            }`}
                          >
                            <span>{label}</span>
                            {isActive && <Icon name="Check" size={14} className="text-blue-600" />}
                          </button>
                        );
                      })}
                    </div>
                  )}
                </div>
              </div>

              <div className="flex-1"></div>

	              <div className="flex items-center space-x-3">
	                <button
	                  onClick={handleUploadDocument}
	                  className="h-9 px-4 bg-blue-600 text-white rounded-[4px] font-medium text-sm hover:bg-blue-700 transition-colors flex items-center space-x-1"
	                >
                  <Icon name="Plus" size={16} />
                  <span>新建任务</span>
                </button>
              </div>
            </div>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-slate-50 border-b border-slate-200">
	                  <th className="px-6 py-4 text-[14px] font-semibold text-slate-800">任务名称</th>
	                  <th className="px-6 py-4 text-[14px] font-semibold text-slate-800">上传文件数</th>
	                  <th className="px-6 py-4 text-[14px] font-semibold text-slate-800">状态</th>
	                  <th className="px-6 py-4 text-[14px] font-semibold text-slate-800">创建时间</th>
	                  <th className="px-6 py-4 text-[14px] font-semibold text-slate-800 text-right">操作</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-200">
                {filteredDocuments.length > 0 ? (
                  filteredDocuments.map(item => (
                    <tr key={item.id} className="hover:bg-slate-50 transition-colors">
                      <td className="px-6 py-4">
                        <div className="flex items-center space-x-3">
                          <div className="min-w-0">
                            <div className="text-[14px] font-medium text-slate-800 truncate">{getTaskName(item)}</div>
                          </div>
                        </div>
	                      </td>
	                      <td className="px-6 py-4 whitespace-nowrap">
                          <button
                            onClick={() => openUploadFilesModal(item)}
                            className="inline-flex h-7 items-center gap-1.5 rounded-full border border-blue-100 bg-blue-50 px-2.5 text-[13px] font-semibold text-blue-700 hover:border-blue-200 hover:bg-blue-100 transition-colors"
                          >
                            <Icon name="Paperclip" size={13} />
                            <span>{getTaskFiles(item.id).length || getMockUploadCount(item)} 个</span>
                          </button>
                        </td>
	                      <td className="px-6 py-4">
	                        <button
                            onClick={() => openUploadFilesModal(item)}
                            className={`inline-flex items-center px-2.5 py-1 rounded-full text-xs font-medium border transition-all hover:shadow-sm ${STATUS_STYLES[item.status]}`}
                          >
	                          {item.status === '识别中' && (
	                            <Icon name="Loader2" size={12} className="mr-1.5 animate-spin" />
	                          )}
                          {getStatusLabel(item.status) === '待确认' && (
                            <Icon name="CircleDashed" size={12} className="mr-1.5" />
                          )}
		                          {getStatusLabel(item.status)}
                              {item.status === '识别中' && (
                                <span className="ml-1">{getMockTaskProgress(item)}%</span>
                              )}
		                        </button>
	                      </td>
                      <td className="px-6 py-4 text-[14px] text-slate-500 whitespace-nowrap">{item.createdAt}</td>
	                      <td className="px-6 py-4 text-right space-x-3 whitespace-nowrap">
                        <button onClick={() => handleOpenDetail(item)} className="text-blue-600 hover:text-blue-700 font-medium text-[14px]">详情</button>
                        <button onClick={() => openUploadFilesModal(item)} className="text-blue-600 hover:text-blue-700 font-medium text-[14px]">文件列表</button>
	                        <button onClick={() => handleDelete(item.id)} className="text-red-500 hover:text-red-600 font-medium text-[14px]">删除</button>
                      </td>
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td colSpan={5} className="px-6 py-12 text-center text-slate-400 text-[14px]">
                      暂无符合条件的文档数据
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>

          <div className="p-4 border-t border-slate-100 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            <div className="text-sm text-slate-500">
              共 {filteredDocuments.length} 条记录
            </div>
            <div className="flex items-center space-x-2">
              <button className="h-8 px-3 border border-slate-200 rounded-lg text-sm font-medium text-slate-600 hover:bg-slate-50 hover:border-blue-500 hover:text-blue-600 transition-colors">
                上一页
              </button>
              {[1, 2, 3].map(page => (
                <button
                  key={page}
                  className={`h-8 min-w-8 px-3 rounded-lg text-sm font-medium transition-colors ${
                    page === 1
                      ? 'bg-blue-600 text-white'
                      : 'border border-slate-200 text-slate-600 hover:bg-slate-50 hover:border-blue-500 hover:text-blue-600'
                  }`}
                >
                  {page}
                </button>
              ))}
              <span className="px-1 text-sm text-slate-400">...</span>
              <button className="h-8 min-w-8 px-3 border border-slate-200 rounded-lg text-sm font-medium text-slate-600 hover:bg-slate-50 hover:border-blue-500 hover:text-blue-600 transition-colors">
                10
              </button>
              <button className="h-8 px-3 border border-slate-200 rounded-lg text-sm font-medium text-slate-600 hover:bg-slate-50 hover:border-blue-500 hover:text-blue-600 transition-colors">
                下一页
              </button>
            </div>
          </div>
        </div>
      </div>

      {isUploadSettingOpen && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center">
	          <div
              className="absolute inset-0 bg-slate-900/40 backdrop-blur-sm"
              onClick={() => {
                setIsUploadSettingOpen(false);
                setNewTaskName('');
              }}
            ></div>
          <div className="relative bg-white rounded-xl shadow-2xl w-full max-w-[460px] overflow-hidden animate-in zoom-in-95 duration-200">
	            <div className="px-6 py-4 border-b border-slate-100 flex items-center justify-between">
	              <div>
	                <h3 className="text-lg font-black text-slate-800">新建任务</h3>
	                <p className="mt-1 text-xs text-slate-500">请输入任务名称，创建后可继续上传文件并开始识别。</p>
	              </div>
	              <button
	                onClick={() => {
                    setIsUploadSettingOpen(false);
                    setNewTaskName('');
                  }}
	                className="w-8 h-8 flex items-center justify-center rounded-full text-slate-400 hover:bg-slate-100 hover:text-slate-600 transition-colors"
	              >
                <Icon name="X" size={18} />
              </button>
            </div>

	            <div className="p-6 space-y-3">
	              <label className="block text-sm font-medium text-slate-800">任务名称</label>
                <input
                  value={newTaskName}
                  onChange={(event) => setNewTaskName(event.target.value)}
                  placeholder="请输入任务名称"
                  className="w-full h-10 px-3 border border-slate-200 rounded-lg text-sm text-slate-800 placeholder-slate-400 bg-white hover:border-blue-500 focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 outline-none transition-all"
                />
              <p className="text-xs text-slate-400">例如：幕墙工程商务标清单解析任务。</p>
            </div>

            <div className="px-6 py-4 bg-slate-50 border-t border-slate-100 flex items-center justify-end space-x-3">
	              <button
	                onClick={() => {
                    setIsUploadSettingOpen(false);
                    setNewTaskName('');
                  }}
	                className="h-9 px-5 border border-slate-300 text-slate-600 rounded-[4px] font-medium text-sm hover:bg-slate-50 transition-colors"
	              >
                取消
              </button>
              <button
                onClick={handleConfirmUpload}
                className="h-9 px-5 bg-blue-600 text-white rounded-[4px] font-medium text-sm hover:bg-blue-700 transition-colors"
              >
                确认新建
              </button>
            </div>
          </div>
        </div>
      )}

      {renderUploadFilesModal()}

      {selectedDocument && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center">
          <div className="absolute inset-0 bg-slate-900/40 backdrop-blur-sm" onClick={() => setSelectedDocument(null)}></div>
          <div className="relative bg-white rounded-xl shadow-2xl w-full max-w-xl flex flex-col max-h-[80vh] animate-in zoom-in-95 duration-200">
            <div className="flex items-center justify-between px-6 py-4 border-b border-slate-100 shrink-0">
              <h3 className="text-lg font-black text-slate-800 flex items-center space-x-2">
                <Icon name="FileText" size={20} className="text-blue-500" />
                <span>文档详情</span>
              </h3>
              <button
                onClick={() => setSelectedDocument(null)}
                className="w-8 h-8 flex items-center justify-center rounded-full text-slate-400 hover:bg-slate-100 hover:text-slate-600 transition-colors"
              >
                <Icon name="X" size={18} />
              </button>
            </div>

            <div className="flex-1 overflow-auto p-6 space-y-5">
              <div className="p-4 rounded-lg bg-slate-50 border border-slate-100">
                <div className="text-sm font-bold text-slate-800">{selectedDocument.fileName}</div>
                <div className="mt-2 text-xs text-slate-500">负责人：{selectedDocument.owner}</div>
              </div>
              <div className="grid grid-cols-2 gap-4 text-sm">
                <div className="rounded-lg border border-slate-100 p-4">
                  <div className="text-slate-400 text-xs mb-1">创建时间</div>
                  <div className="text-slate-800 font-medium">{selectedDocument.createdAt}</div>
                </div>
                <div className="rounded-lg border border-slate-100 p-4">
                  <div className="text-slate-400 text-xs mb-1">文件页数</div>
                  <div className="text-slate-800 font-medium">{selectedDocument.pages}</div>
                </div>
                <div className="rounded-lg border border-slate-100 p-4">
                  <div className="text-slate-400 text-xs mb-1">文件大小</div>
                  <div className="text-slate-800 font-medium">{selectedDocument.size}</div>
                </div>
                <div className="rounded-lg border border-slate-100 p-4">
                  <div className="text-slate-400 text-xs mb-1">解析起始页</div>
                  <div className="text-slate-800 font-medium">第 {selectedDocument.startPage} 页</div>
                </div>
                <div className="rounded-lg border border-slate-100 p-4">
                  <div className="text-slate-400 text-xs mb-1">识别状态</div>
                  <span className={`inline-flex items-center px-2.5 py-1 rounded-full text-xs font-medium border ${STATUS_STYLES[selectedDocument.status]}`}>
                    {selectedDocument.status === '识别中' && (
                      <Icon name="Loader2" size={12} className="mr-1.5 animate-spin" />
                    )}
                    {getStatusLabel(selectedDocument.status) === '待确认' && (
                      <Icon name="CircleDashed" size={12} className="mr-1.5" />
                    )}
                    {getStatusLabel(selectedDocument.status)}
                    {selectedDocument.status === '识别中' && (
                      <span className="ml-1">{getMockTaskProgress(selectedDocument)}%</span>
                    )}
                  </span>
                </div>
              </div>
            </div>

            <div className="p-4 border-t border-slate-100 flex justify-end shrink-0 bg-slate-50 rounded-b-xl">
              <button
                onClick={() => setSelectedDocument(null)}
                className="h-9 px-6 bg-white border border-slate-200 text-slate-800 rounded-[4px] font-medium text-sm hover:border-blue-600 hover:text-blue-600 transition-colors"
              >
                关闭
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default DocumentExtractionView;

