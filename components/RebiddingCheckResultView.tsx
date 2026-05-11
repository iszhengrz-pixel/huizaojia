import React, { useEffect, useRef, useState } from 'react';
import { createPortal } from 'react-dom';
import { renderAsync } from 'docx-preview';
import Icon from './Icon';

interface RebiddingCheckResultViewProps {
  onBack: () => void;
  onReturnToList?: () => void; // 新增属性，用于跨级返回列表页
  mode?: 'new' | 'edit';
  checkSettings?: any;
}

interface UnitCompareItem {
  id: string;
  level: number;
  index: string;
  name: string;
  area: number;
  standard: number;
  bidders: Record<string, number>;
}

interface CompareDrawerData {
  visible: boolean;
  view: 'price' | 'deviation';
  activeTab?: 'data' | 'reason'; // 新增的 Tab 状态
  bidder: string;
  itemCode: string;
  itemName: string;
  unit: string;
  controlPrice: number;
  bidderPrice: number;
  diffPercent: number;
  samePriceBidders?: string[];
  biddersPrices?: Record<string, number>;
  fromDrawer?: string;
  unbalancedBasePriceName?: string;
}

interface ProblemDetailDrawerData {
  visible: boolean;
  title: string;
  bidder: string;
  type?: 'default' | 'samePrice' | 'unbalanced'; // 添加不平衡报价类型
  samePriceBidders?: string[]; // 涉及相同单价的投标单位名称列表
  isRegularError?: boolean; // 标识是否为固定差额的规律性错误
  view?: 'list' | 'breakdown'; // 控制抽屉内部的视图（列表或单价明细对比）
  selectedItem?: any; // 选中的清单项数据，用于明细对比
}

interface FilePreviewData {
  visible: boolean;
  problemDescription: string;
  tabs: string[];
  activeTab: string;
}

const RebiddingCheckResultView: React.FC<RebiddingCheckResultViewProps> = ({ onBack, onReturnToList, mode = 'new', checkSettings }) => {
  const projectTitle = '宁波住宅项目-清标检查';
  const [currentStep, setCurrentStep] = useState<2 | 3>(2);
  const [maxReachedStep, setMaxReachedStep] = useState<number>(2);
  const [activeTab, setActiveTab] = useState('summary');
  const [activeComplianceTab, setActiveComplianceTab] = useState('wrong');
  const [activeArithmeticTab, setActiveArithmeticTab] = useState('emptyZero');
  const [activeCollusionTab, setActiveCollusionTab] = useState('attr');
  const [activeSameListGroupTab, setActiveSameListGroupTab] = useState('default'); // 新增用于相同清单的对比组 tab
  const [showOnlyProblem, setShowOnlyProblem] = useState(false);
  const [showSettingsModal, setShowSettingsModal] = useState(false);
  const [showHeaderSettingsModal, setShowHeaderSettingsModal] = useState(false);
  const [compareSearchKeyword, setCompareSearchKeyword] = useState('');
  const [activeCompareSheetTab, setActiveCompareSheetTab] = useState('sheet1'); // 清标对比表的 sheet 页签
  const [filePreviewData, setFilePreviewData] = useState<FilePreviewData>({
    visible: false,
    problemDescription: '',
    tabs: [],
    activeTab: ''
  });
  const [problemDetailDrawer, setProblemDetailDrawer] = useState<ProblemDetailDrawerData>({
    visible: false,
    title: '',
    bidder: ''
  });
  const [compareDrawerData, setCompareDrawerData] = useState<CompareDrawerData>({
    visible: false,
    view: 'price',
    activeTab: 'data',
    bidder: '',
    itemCode: '',
    itemName: '',
    unit: '',
    controlPrice: 0,
    bidderPrice: 0,
    diffPercent: 0
  });
  const [highlightedRowId, setHighlightedRowId] = useState<string | null>(null);
  const [unbalancedSettings, setUnbalancedSettings] = useState({
    quoteType: 'controlPrice', // 控制价、投标均价、投标最低价、投标均价-移除最高价最低价
    floatRange: '15'
  });

  const availableHeaders = ['序号', '项目编码', '名称', '项目特征', '单位', '工程量', '单价', '合价', '综合单价', '暂估价', '备注'];
  // 默认AI识别的表头
  const defaultAIHeaders = ['序号', '项目编码', '名称', '项目特征', '单位'];
  const [selectedHeaders, setSelectedHeaders] = useState<string[]>(defaultAIHeaders);
  const [showSummaryHeaderSettingsModal, setShowSummaryHeaderSettingsModal] = useState(false);
  const [showExportModal, setShowExportModal] = useState(false);
  const [exportSelection, setExportSelection] = useState<string[]>(['summary', 'compare', 'unit']);
  
  // 导出报告预览相关状态
  const [showReportPreviewModal, setShowReportPreviewModal] = useState(false);
  const [reportContent, setReportContent] = useState('');
  const [reportHtml, setReportHtml] = useState('');
  const [isTemplateStyleLoading, setIsTemplateStyleLoading] = useState(false);
  const [showTemplateSelectBubble, setShowTemplateSelectBubble] = useState(false);
  const [selectedReportTemplate, setSelectedReportTemplate] = useState('default');
  const [draftReportTemplate, setDraftReportTemplate] = useState('default');
  const [isTemplateDropdownOpen, setIsTemplateDropdownOpen] = useState(false);
  const [showSwitchTemplateConfirm, setShowSwitchTemplateConfirm] = useState(false);
  const [pendingTemplateId, setPendingTemplateId] = useState<string | null>(null);
  const reportEditorRef = useRef<HTMLDivElement | null>(null);
  const templateProbeRef = useRef<HTMLDivElement | null>(null);
  const REPORT_TEMPLATE_OPTIONS = [
    { id: 'default', label: '默认模板' },
    { id: 'jianfa', label: '建发地产模板' },
    { id: 'lvcheng', label: '绿城地产模板' },
    { id: 'zhaoshang', label: '招商地产模板' }
  ];
  const templateDocxUrlMap: Record<string, string> = {
    default: new URL('../AIBAOGAO.docx', import.meta.url).href,
    jianfa: new URL('../AIBAOGAO.docx', import.meta.url).href,
    lvcheng: new URL('../AIBAOGAO.docx', import.meta.url).href,
    zhaoshang: new URL('../AIBAOGAO.docx', import.meta.url).href
  };
  const templateDocxUrl = templateDocxUrlMap[selectedReportTemplate];

  const toggleExportSelection = (id: string) => {
    setExportSelection(prev => 
      prev.includes(id) ? prev.filter(item => item !== id) : [...prev, id]
    );
  };
  const availableSummaryHeaders = ['序号', '项目名称'];
  const [selectedSummaryHeaders, setSelectedSummaryHeaders] = useState<string[]>(availableSummaryHeaders);

  const toggleHeader = (header: string) => {
    setSelectedHeaders(prev => 
      prev.includes(header) ? prev.filter(h => h !== header) : [...prev, header]
    );
  };

  const toggleSummaryHeader = (header: string) => {
    setSelectedSummaryHeaders(prev =>
      prev.includes(header) ? prev.filter(h => h !== header) : [...prev, header]
    );
  };
  
  const generateReportTemplate = () => {
    const d = new Date();
    const dateStr = `${d.getFullYear()}年${d.getMonth() + 1}月${d.getDate()}日`;
    
    let content = `AI清标报告

项目名称：宁波住宅项目
招标人：
开标日期：2026年05月11日
清标日期：${dateStr}

汇能优算科技（浙江）有限公司
中国·宁波

清 标 报 告 目 录
1. 项目概况
2. 投标文件符合性与响应性检查结果
3. 算术性错误复核结果与修正建议
4. 报价合理性与不平衡报价分析
5. 商务标相似度检查结果
6. 清标结论与风险建议

1.项目基本信息
项目名称：宁波住宅项目
建设地点：
招标方式：
招标范围：
最高投标限价（招标控制价）：1,000,000.00
工期要求：
有效投标单位数量：5

2.投标文件符合性与响应性检查结果
`;

    // 简单提取几个表格的数据作为文本展示
    content += `2.1 错项、增项、漏项检查结果\n`;
    MOCK_RESULTS.forEach((r, i) => {
      content += `${i+1}. 投标人: ${r.bidder} | 错项: ${r.compliance.wrong==='error'?'异常':'正常'} | 增项: ${r.compliance.added==='error'?'异常':'正常'} | 漏项: ${r.compliance.missing==='error'?'异常':'正常'}\n`;
    });

    content += `\n2.2 相同清单/材料价格一致性检查\n`;
    MOCK_RESULTS.forEach((r, i) => {
      content += `${i+1}. 投标人: ${r.bidder} | 清单价格: ${r.compliance.sameList==='error'?'异常':'正常'} | 材料价格: ${r.compliance.sameMaterial==='error'?'异常':'正常'}\n`;
    });

    content += `
分析说明：
投标人 XXX、XXX 等 XX 家单位，投标清单的项目编码、项目名称、项目特征、计量单位、工程量与招标清单完全一致，无缺项、漏项、增项、错项问题，符合招标文件实质性要求；
投标人 XXX 存在招标清单缺项 XX 项、擅自增项 XX 项，项目特征描述与招标清单不符 XX 项，不符合招标文件“不得修改招标清单实质性内容”的要求；
投标人 XXX 存在 XX 项清单工程量擅自修改，与招标清单给定工程量不一致，偏离幅度 XX%，涉嫌不响应招标文件实质性要求。

3.算术性错误复核结果与修正建议
`;
    MOCK_RESULTS.forEach((r, i) => {
      content += `${i+1}. 投标人: ${r.bidder} | 单价为零/空/负数: ${r.arithmetic.emptyZero==='error'?'异常':'正常'} | 合价检查: ${r.arithmetic.total==='warning'||r.arithmetic.total==='error'?'异常':'正常'}\n`;
    });

    content += `
分析说明：
投标人 XXX、XXX 等 XX 家单位，投标报价无算术性计算错误，单价 × 工程量 = 合价、各分项合价汇总 = 总价计算逻辑准确无误；
投标人 XXX 存在算术性错误 XX 处，其中合价计算错误 XX 处，总价汇总偏差 XX 元，偏差幅度 XX%；单价遗漏 / 为负 / 为零 XX 项，涉及金额 XX 元；
投标人 XXX 存在小数点进位错误、税率计取错误 XX 处，导致总价与分项汇总金额不符，偏差幅度 XX%。

4.报价合理性与不平衡报价分析
分析说明：
投标人 XXX、XXX 等 XX 家单位，清单综合单价无显著异常，整体报价水平合理，未发现严重不平衡报价情形；
投标人 XXX 存在 XX 项清单综合单价异常偏高，最高偏离基准值 XX%，XX 项清单综合单价异常偏低，最低偏离基准值 XX%，超出招标文件约定的合理偏差范围，构成严重不平衡报价；
投标人 XXX 主要分部分项工程单价与市场公允价格存在显著偏离，其中 XX 项清单单价低于成本价嫌疑，提请评标委员会重点关注。

5.商务标相似度检查结果
分析说明：
投标人XXX、XXX 等 XX 家单位，文本相似度均低于招标文件约定的雷同阈值，无围标串标嫌疑情形；
投标人 XXX 与投标人 XXX 的技术标文本相似度达 XX%，商务标报价呈规律性差异，涉嫌串通投标，提请评标委员会按招标文件及相关法律法规审议判定。

6.清标结论与风险建议
经系统核查与人工复核，总体结论如下：
1.本次清标共核查投标文件 5 份，其中 XX 份投标文件未发现重大偏差，清单响应性、计价合规性符合招标文件实质性要求；
2.XX 份投标文件存在细微偏差 / 算术性错误 / 报价异常等问题，均不构成对招标文件的实质性偏离，具体问题详见分项核查结论及问题明细；
3.XX 份投标文件存在重大偏差嫌疑，涉嫌不符合招标文件实质性要求，具体情况详见分项核查结论，提请评标委员会重点审议判定。
`;

    return content;
  };

  const escapeHtml = (value: string) =>
    value
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;')
      .replace(/'/g, '&#39;');

  const buildStyledReportHtml = (
    text: string,
    styles?: {
      title: string;
      heading: string;
      body: string;
    }
  ) => {
    const titleStyle = styles?.title || 'font-size: 24px; font-weight: 700; text-align: center; color: #333333; line-height: 1.6; margin: 0 0 24px;';
    const headingStyle = styles?.heading || 'font-size: 18px; font-weight: 700; color: #333333; line-height: 1.6; margin: 24px 0 12px;';
    const bodyStyle = styles?.body || 'font-size: 14px; font-weight: 400; color: #333333; line-height: 1.9; margin: 0 0 10px; text-align: justify;';

    const lines = text.split('\n');
    const html: string[] = [];

    lines.forEach((rawLine, index) => {
      const line = rawLine.trim();
      if (!line) {
        html.push('<p style="height: 12px; margin: 0;"></p>');
        return;
      }

      const escaped = escapeHtml(line);

      if (index === 0) {
        html.push(`<p style="${titleStyle}">${escaped}</p>`);
        return;
      }

      if (/^\d+(\.\d+)*[.．]/.test(line) || /^分析说明[:：]?$/.test(line) || /^经系统核查与人工复核/.test(line)) {
        html.push(`<p style="${headingStyle}">${escaped}</p>`);
        return;
      }

      html.push(`<p style="${bodyStyle}">${escaped}</p>`);
    });

    return html.join('');
  };

  useEffect(() => {
    if (!showReportPreviewModal || !templateProbeRef.current) return;

    let cancelled = false;

    const loadTemplateStyles = async () => {
      setIsTemplateStyleLoading(true);
      try {
        const response = await fetch(templateDocxUrl);
        const buffer = await response.arrayBuffer();
        if (!templateProbeRef.current || cancelled) return;

        templateProbeRef.current.innerHTML = '';
        await renderAsync(buffer, templateProbeRef.current);
        if (cancelled || !templateProbeRef.current) return;

        const paragraphs = Array.from(templateProbeRef.current.querySelectorAll('p')) as HTMLParagraphElement[];
        const meaningfulParagraphs = paragraphs.filter((p) => (p.textContent || '').trim() !== '');
        const titleNode = meaningfulParagraphs[0];
        const bodyNode = meaningfulParagraphs[1] || meaningfulParagraphs[0];

        const getStyleText = (node: HTMLElement | undefined, fallback: string) => {
          if (!node) return fallback;
          const computed = window.getComputedStyle(node);
          return [
            `font-size: ${computed.fontSize}`,
            `font-weight: ${computed.fontWeight}`,
            `font-family: ${computed.fontFamily}`,
            `line-height: ${computed.lineHeight}`,
            `letter-spacing: ${computed.letterSpacing}`,
            `text-align: ${computed.textAlign}`,
            `color: ${computed.color}`,
            `margin: ${computed.marginTop} 0 ${computed.marginBottom}`,
            'white-space: pre-wrap'
          ].join('; ');
        };

        const titleStyle = getStyleText(
          titleNode,
          'font-size: 24px; font-weight: 700; text-align: center; color: #333333; line-height: 1.6; margin: 0 0 24px; white-space: pre-wrap'
        );
        const bodyStyle = getStyleText(
          bodyNode,
          'font-size: 14px; font-weight: 400; color: #333333; line-height: 1.9; margin: 0 0 10px; text-align: justify; white-space: pre-wrap'
        );
        const headingStyle = [
          bodyStyle,
          'font-size: 18px',
          'font-weight: 700',
          'margin: 24px 0 12px',
          'text-align: left'
        ].join('; ');

        const templateHtml = templateProbeRef.current.innerHTML;
        if (templateHtml && templateHtml.trim() !== '') {
          setReportHtml(templateHtml);
        } else {
          setReportHtml(
            buildStyledReportHtml(reportContent, {
              title: titleStyle,
              heading: headingStyle,
              body: bodyStyle
            })
          );
        }
      } catch {
        if (!cancelled) {
          setReportHtml(buildStyledReportHtml(reportContent));
        }
      } finally {
        if (!cancelled) {
          setIsTemplateStyleLoading(false);
        }
      }
    };

    loadTemplateStyles();

    return () => {
      cancelled = true;
    };
  }, [showReportPreviewModal, reportContent, templateDocxUrl]);

  const openReportPreview = () => {
    const nextContent = generateReportTemplate();
    setReportContent(nextContent);
    setReportHtml(buildStyledReportHtml(nextContent));
    setShowExportModal(false);
    setShowTemplateSelectBubble(false);
    setIsTemplateDropdownOpen(false);
    setShowReportPreviewModal(true);
  };

  const handleExportReport = () => {
    setDraftReportTemplate(selectedReportTemplate);
    setShowTemplateSelectBubble(true);
  };

  const handleConfirmTemplateSelection = () => {
    setSelectedReportTemplate(draftReportTemplate);
    openReportPreview();
  };

  const handleSwitchReportTemplate = (templateId: string) => {
    if (templateId === selectedReportTemplate) {
      setIsTemplateDropdownOpen(false);
      return;
    }

    setPendingTemplateId(templateId);
    setShowSwitchTemplateConfirm(true);
    setIsTemplateDropdownOpen(false);
  };

  const confirmSwitchTemplate = () => {
    if (!pendingTemplateId) return;

    setSelectedReportTemplate(pendingTemplateId);
    setIsTemplateDropdownOpen(false);
    setShowReportPreviewModal(false);
    setShowSwitchTemplateConfirm(false);
    setPendingTemplateId(null);
    setTimeout(() => {
      openReportPreview();
    }, 0);
  };

  const downloadWordDocument = () => {
    // 简单的 HTML 转换为 Word doc 的方式
    const header = "<html xmlns:o='urn:schemas-microsoft-com:office:office' xmlns:w='urn:schemas-microsoft-com:office:word' xmlns='http://www.w3.org/TR/REC-html40'><head><meta charset='utf-8'><title>清标报告</title></head><body>";
    const footer = "</body></html>";
    const htmlContent = reportEditorRef.current?.innerHTML || reportHtml;
    const sourceHTML = header + htmlContent + footer;
    
    const source = 'data:application/vnd.ms-word;charset=utf-8,' + encodeURIComponent(sourceHTML);
    const fileDownload = document.createElement("a");
    document.body.appendChild(fileDownload);
    fileDownload.href = source;
    fileDownload.download = 'AI清标报告.doc';
    fileDownload.click();
    document.body.removeChild(fileDownload);
    
    setShowReportPreviewModal(false);
  };

  const [taxAmountType, setTaxAmountType] = useState<'tax' | 'noTax'>('noTax');
  const [showTaxAmountSettingsDropdown, setShowTaxAmountSettingsDropdown] = useState(false);

  // AI 整体分析状态
  const [aiAnalysisStatus, setAiAnalysisStatus] = useState<'idle' | 'analyzing' | 'done'>('idle');
  const [aiAnalysisProgress, setAiAnalysisProgress] = useState(0);
  const [showAiAnalysisModal, setShowAiAnalysisModal] = useState(false);
  const [hasGeneratedReport, setHasGeneratedReport] = useState(false);
  const aiAnalysisIntervalRef = useRef<NodeJS.Timeout | null>(null);

  const handleStartAiAnalysis = (forceReanalyze = false) => {
    if (hasGeneratedReport && !forceReanalyze) {
      setAiAnalysisStatus('done');
      setShowAiAnalysisModal(true);
      return;
    }

    setAiAnalysisStatus('analyzing');
    setAiAnalysisProgress(0);
    setShowAiAnalysisModal(true);

    let progress = 0;
    if (aiAnalysisIntervalRef.current) {
      clearInterval(aiAnalysisIntervalRef.current);
    }
    
    aiAnalysisIntervalRef.current = setInterval(() => {
      progress += Math.floor(Math.random() * 15) + 5;
      if (progress >= 100) {
        progress = 100;
        if (aiAnalysisIntervalRef.current) {
          clearInterval(aiAnalysisIntervalRef.current);
        }
        setTimeout(() => {
          setAiAnalysisStatus('done');
          setHasGeneratedReport(true);
        }, 500);
      }
      setAiAnalysisProgress(progress);
    }, 400);
  };

  const handleCancelAiAnalysis = () => {
    if (aiAnalysisIntervalRef.current) {
      clearInterval(aiAnalysisIntervalRef.current);
    }
    setAiAnalysisStatus('idle');
    setShowAiAnalysisModal(false);
    setAiAnalysisProgress(0);
  };

  // AI 偏差原因分析状态
  const [aiReasonAnalysisStatus, setAiReasonAnalysisStatus] = useState<'idle' | 'analyzing' | 'done'>('idle');
  const [aiReasonAnalysisProgress, setAiReasonAnalysisProgress] = useState(0);
  const [showAiReasonAnalysisModal, setShowAiReasonAnalysisModal] = useState(false);
  const [hasGeneratedReasonReport, setHasGeneratedReasonReport] = useState(false);
  const aiReasonAnalysisIntervalRef = useRef<NodeJS.Timeout | null>(null);

  const handleStartAiReasonAnalysis = (forceReanalyze = false) => {
    if (hasGeneratedReasonReport && !forceReanalyze) {
      setAiReasonAnalysisStatus('done');
      // 直接在抽屉里显示结果，不需要弹窗
      return;
    }

    setAiReasonAnalysisStatus('analyzing');
    setAiReasonAnalysisProgress(0);
    setShowAiReasonAnalysisModal(true);

    let progress = 0;
    if (aiReasonAnalysisIntervalRef.current) {
      clearInterval(aiReasonAnalysisIntervalRef.current);
    }
    
    aiReasonAnalysisIntervalRef.current = setInterval(() => {
      progress += Math.floor(Math.random() * 20) + 10;
      if (progress >= 100) {
        progress = 100;
        if (aiReasonAnalysisIntervalRef.current) {
          clearInterval(aiReasonAnalysisIntervalRef.current);
        }
        setTimeout(() => {
          setAiReasonAnalysisStatus('done');
          setHasGeneratedReasonReport(true);
          setShowAiReasonAnalysisModal(false); // 分析完关闭进度弹窗
        }, 500);
      }
      setAiReasonAnalysisProgress(progress);
    }, 300);
  };

  const handleCancelAiReasonAnalysis = () => {
    if (aiReasonAnalysisIntervalRef.current) {
      clearInterval(aiReasonAnalysisIntervalRef.current);
    }
    setAiReasonAnalysisStatus('idle');
    setShowAiReasonAnalysisModal(false);
    setAiReasonAnalysisProgress(0);
  };

  const TABS = currentStep === 2 ? [
    { id: 'summary', label: '结果汇总' },
    { id: 'compliance', label: '符合性检查' },
    { id: 'arithmetic', label: '算术性错误检查' },
    { id: 'unbalanced', label: '不平衡报价检查' },
    { id: 'collusion', label: '串标检查' }
  ] : [
    { id: 'summaryCompare', label: '汇总对比表' },
    { id: 'compare', label: '清标对比表' },
    { id: 'unitCompare', label: '单方对比表' }
  ];

  const COMPLIANCE_TABS = [
    { id: 'wrong', label: '错项检查' },
    { id: 'added', label: '增项检查' },
    { id: 'missing', label: '漏项检查' },
    { id: 'sameList', label: '相同清单价格一致性检查' },
    { id: 'sameMaterial', label: '相同材料价格一致性检查' },
    { id: 'noCompete', label: '不可竞争金额是否有改动' },
    { id: 'exceedLimit', label: '投标价突破投标限价检查' }
  ];

  const ARITHMETIC_TABS = [
    { id: 'emptyZero', label: '单价为零、空、负数检查' },
    { id: 'total', label: '合价检查' }
  ];

  const COLLUSION_TABS = [
    { id: 'attr', label: '电子文件属性信息雷同' },
    { id: 'samePrice', label: '单价相同/相似检查' },
    { id: 'typos', label: '规律性错误检查' }
  ];

  // 相同清单的对比组（从 checkSettings 提取，过滤掉名称或页签为空的，如果不存在则提供默认兜底）
  const sameListGroups = (checkSettings?.compliance?.sameListGroups || [])
    .filter((g: any) => g.name && g.name.trim() !== '' && g.sheets && g.sheets.length > 0);

  // 如果过滤后为空，则使用默认的
  const finalSameListGroups = sameListGroups.length > 0 ? sameListGroups : [
    { id: 'default', name: '默认对比组', sheets: ['全部文件-全部页签'] }
  ];

  // 模拟检查结果数据
  const MOCK_RESULTS = [
    { 
      id: '1', 
      bidder: 'A', 
      problemCount: 2,
      compliance: { wrong: 'ok', added: 'ok', missing: 'ok', sameList: 'ok', sameMaterial: 'error', noCompete: 'ok', exceedLimit: 'ok' },
      arithmetic: { emptyZero: 'ok', total: 'warning' },
      collusion: { unbalanced: 'ok', attr: 'ok', samePrice: 'error', typos: 'ok' }
    },
    { 
      id: '2', 
      bidder: 'B', 
      problemCount: 1,
      compliance: { wrong: 'ok', added: 'ok', missing: 'ok', sameList: 'ok', sameMaterial: 'ok', noCompete: 'ok', exceedLimit: 'ok' },
      arithmetic: { emptyZero: 'ok', total: 'ok' },
      collusion: { unbalanced: 'ok', attr: 'ok', samePrice: 'error', typos: 'ok' }
    },
    { 
      id: '3', 
      bidder: 'C', 
      problemCount: 1,
      compliance: { wrong: 'ok', added: 'ok', missing: 'error', sameList: 'ok', sameMaterial: 'ok', noCompete: 'ok', exceedLimit: 'ok' },
      arithmetic: { emptyZero: 'ok', total: 'ok' },
      collusion: { unbalanced: 'warning', attr: 'ok', samePrice: 'ok', typos: 'ok' }
    },
    { 
      id: '4', 
      bidder: 'D', 
      problemCount: 1,
      compliance: { wrong: 'ok', added: 'ok', missing: 'ok', sameList: 'ok', sameMaterial: 'ok', noCompete: 'ok', exceedLimit: 'ok' },
      arithmetic: { emptyZero: 'ok', total: 'ok' },
      collusion: { unbalanced: 'ok', attr: 'ok', samePrice: 'error', typos: 'ok' }
    },
    { 
      id: '5', 
      bidder: 'E', 
      problemCount: 1,
      compliance: { wrong: 'ok', added: 'ok', missing: 'ok', sameList: 'ok', sameMaterial: 'ok', noCompete: 'ok', exceedLimit: 'ok' },
      arithmetic: { emptyZero: 'ok', total: 'ok' },
      collusion: { unbalanced: 'ok', attr: 'ok', samePrice: 'error', typos: 'ok' }
    }
  ];

  // 汇总对比表数据
  const MOCK_SUMMARY_COMPARE_DATA = [
    { id: '1', index: 1, name: '分部分项工程', controlPrice: 1000000.00, bidders: { '投标单位1 (一轮)': 1050000.00, '投标单位1 (二轮)': 1020000.00, '投标单位2 (一轮)': 980000.00, '投标单位2 (二轮)': 970000.00, '评标基准价/平均价': 1015000.00 } },
    { id: '2', index: 2, name: '措施项目', controlPrice: 150000.00, bidders: { '投标单位1 (一轮)': 160000.00, '投标单位1 (二轮)': 155000.00, '投标单位2 (一轮)': 145000.00, '投标单位2 (二轮)': 140000.00, '评标基准价/平均价': 152500.00 } },
    { id: '3', index: 3, name: '其他项目', controlPrice: 50000.00, bidders: { '投标单位1 (一轮)': 50000.00, '投标单位1 (二轮)': 49000.00, '投标单位2 (一轮)': 48000.00, '投标单位2 (二轮)': 48000.00, '评标基准价/平均价': 49000.00 } },
    { id: '4', index: 4, name: '规费', controlPrice: 30000.00, bidders: { '投标单位1 (一轮)': 31500.00, '投标单位1 (二轮)': 30600.00, '投标单位2 (一轮)': 29400.00, '投标单位2 (二轮)': 29100.00, '评标基准价/平均价': 30450.00 } },
    { id: '5', index: 5, name: '税金', controlPrice: 100000.00, bidders: { '投标单位1 (一轮)': 105000.00, '投标单位1 (二轮)': 102000.00, '投标单位2 (一轮)': 98000.00, '投标单位2 (二轮)': 97000.00, '评标基准价/平均价': 101500.00 } }
  ];

  const COMPARE_SHEET_TABS = [
    { id: 'sheet1', label: '1-土石方工程' },
    { id: 'sheet2', label: '2-基坑支护工程' },
    { id: 'sheet3', label: '3-桩基工程' }
  ];

  // 清标对比表数据
  const MOCK_COMPARE_DATA = [
    { id: '1', code: '010101001001', name: '平整场地', feature: '这些根据不同的标底清单内容进行调整', unit: 'm2', quantity: 15, controlPrice: 15.5, bidders: { '投标单位1 (一轮)': 16.2, '投标单位1 (二轮)': 15.8, '投标单位2 (一轮)': 16.2, '投标单位2 (二轮)': 15.5, '评标基准价/平均价': 15.0 } },
    { id: '2', code: '010101002001', name: '挖沟槽土方', feature: '-', unit: 'm3', quantity: 12, controlPrice: 28.0, bidders: { '投标单位1 (一轮)': 29.5, '投标单位1 (二轮)': 28.5, '投标单位2 (一轮)': 29.5, '投标单位2 (二轮)': 28.0, '评标基准价/平均价': 26.8 } },
    { id: '3', code: '010103001001', name: '回填方', feature: '-', unit: 'm3', quantity: 18, controlPrice: 22.0, bidders: { '投标单位1 (一轮)': 21.0, '投标单位1 (二轮)': 20.5, '投标单位2 (一轮)': 23.5, '投标单位2 (二轮)': 22.5, '评标基准价/平均价': 22.5 } },
    { id: '4', code: '010401001001', name: '砖基础', feature: '-', unit: 'm3', quantity: 9, controlPrice: 380.0, bidders: { '投标单位1 (一轮)': 395.0, '投标单位1 (二轮)': 385.0, '投标单位2 (一轮)': 375.0, '投标单位2 (二轮)': 370.0, '评标基准价/平均价': 382.0 } },
    { id: '5', code: '010501001001', name: '垫层', feature: '-', unit: 'm3', quantity: 11, controlPrice: 450.0, bidders: { '投标单位1 (一轮)': 460.0, '投标单位1 (二轮)': 450.0, '投标单位2 (一轮)': 445.0, '投标单位2 (二轮)': 440.0, '评标基准价/平均价': 455.0 } },
  ];
  
  // 提取需要渲染的真实投标单位列表（排除标底、基准价等特殊列）
  const compareBidderKeys = Object.keys(MOCK_COMPARE_DATA[0]?.bidders || {}).filter(k => k.startsWith('投标单位'));
  const benchmarkBidder = '评标基准价/平均价';

  const [sortedBidderKeys, setSortedBidderKeys] = useState<string[]>(compareBidderKeys);

  const handleDragStart = (e: React.DragEvent, bidder: string) => {
    e.dataTransfer.setData('text/plain', bidder);
    e.dataTransfer.effectAllowed = 'move';
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    e.dataTransfer.dropEffect = 'move';
  };

  const handleDrop = (e: React.DragEvent, targetBidder: string) => {
    e.preventDefault();
    const sourceBidder = e.dataTransfer.getData('text/plain');
    if (sourceBidder === targetBidder) return;

    const newKeys = [...sortedBidderKeys];
    const sourceIndex = newKeys.indexOf(sourceBidder);
    const targetIndex = newKeys.indexOf(targetBidder);

    if (sourceIndex !== -1 && targetIndex !== -1) {
      newKeys.splice(sourceIndex, 1);
      newKeys.splice(targetIndex, 0, sourceBidder);
      setSortedBidderKeys(newKeys);
    }
  };

  const [showBenchmarkModal, setShowBenchmarkModal] = useState(false);
  const [appliedBenchmarkSettings, setAppliedBenchmarkSettings] = useState<{
    type: 'none' | 'benchmark' | 'average';
    formula: string;
    selectedBidders: string[];
  }>({
    type: 'none',
    formula: '1',
    selectedBidders: []
  });
  const [tempBenchmarkSettings, setTempBenchmarkSettings] = useState(appliedBenchmarkSettings);

  const handleOpenBenchmarkModal = () => {
    setTempBenchmarkSettings({
      ...appliedBenchmarkSettings,
      selectedBidders: appliedBenchmarkSettings.selectedBidders.length > 0 
        ? appliedBenchmarkSettings.selectedBidders 
        : compareBidderKeys
    });
    setShowBenchmarkModal(true);
  };

  const getCalculatedBenchmarkPrice = (biddersData: Record<string, number>) => {
    if (appliedBenchmarkSettings.type === 'none') return 0;
    
    if (appliedBenchmarkSettings.type === 'average') {
      const selected = appliedBenchmarkSettings.selectedBidders.length > 0 ? appliedBenchmarkSettings.selectedBidders : compareBidderKeys;
      if (selected.length === 0) return 0;
      const sum = selected.reduce((acc, bidder) => acc + (biddersData[bidder] || 0), 0);
      return sum / selected.length;
    }
    
    if (appliedBenchmarkSettings.type === 'benchmark') {
      const prices = compareBidderKeys.map(k => biddersData[k]).filter(p => typeof p === 'number');
      if (prices.length === 0) return 0;
      
      const avg = prices.reduce((a, b) => a + b, 0) / prices.length;
      const sorted = [...prices].sort((a, b) => a - b);
      const secondLowest = sorted.length > 1 ? sorted[1] : sorted[0];
      
      switch(appliedBenchmarkSettings.formula) {
        case '1': return avg;
        case '2': return avg * 0.6 + secondLowest * 0.4;
        case '3': return avg * 0.95;
        case '4': return (avg + secondLowest) / 2;
        case '5': {
          const belowAvg = prices.filter(p => p < avg);
          if (belowAvg.length === 0) return avg;
          return belowAvg.reduce((a, b) => a + b, 0) / belowAvg.length;
        }
        case '6': return sorted[0];
        default: return avg;
      }
    }
    return 0;
  };

  // 公共的轮次标签渲染函数
  const renderBidderLabel = (bidderName: string) => {
    const nameMatch = bidderName.match(/^(.*?)\s*\((.*?)\)$/);
    if (nameMatch) {
      return (
        <div className="flex items-center justify-center space-x-1">
          <span>{nameMatch[1]}</span>
          <span className="px-1.5 py-0.5 bg-blue-100 text-blue-700 rounded text-xs whitespace-nowrap">{nameMatch[2]}</span>
        </div>
      );
    }
    return bidderName;
  };

  // 单方对比汇总数据
  const [unitCompareData, setUnitCompareData] = useState<UnitCompareItem[]>([
    { id: '1', level: 0, index: '一', name: '土建工程量清单', area: 192672.80, standard: 355282762.95, bidders: { '投标单位1 (一轮)': 334975149.49, '投标单位1 (二轮)': 329049049.40, '投标单位2 (一轮)': 351688581.52, '投标单位2 (二轮)': 341688581.52 } },
    { id: '2', level: 1, index: '1', name: '支护工程(含管井及单体坑基围护)', area: 192672.80, standard: 61491676.89, bidders: { '投标单位1 (一轮)': 64598653.40, '投标单位1 (二轮)': 62878044.10, '投标单位2 (一轮)': 62321145.59, '投标单位2 (二轮)': 61321145.59 } },
    { id: '3', level: 1, index: '2', name: '地下室土建', area: 55000.00, standard: 112019654.09, bidders: { '投标单位1 (一轮)': 113199759.70, '投标单位1 (二轮)': 102651587.40, '投标单位2 (一轮)': 113282547.49, '投标单位2 (二轮)': 111282547.49 } },
    { id: '4', level: 1, index: '3', name: '地上土建', area: 137672.80, standard: 155495020.47, bidders: { '投标单位1 (一轮)': 136238138.80, '投标单位1 (二轮)': 142069300.89, '投标单位2 (一轮)': 150710646.54, '投标单位2 (二轮)': 145710646.54 } },
    { id: '5', level: 0, index: '二', name: '安装工程量清单', area: 192673.00, standard: 18922636.73, bidders: { '投标单位1 (一轮)': 23104787.59, '投标单位1 (二轮)': 22567236.60, '投标单位2 (一轮)': 20700666.45, '投标单位2 (二轮)': 19700666.45 } },
    { id: '6', level: 1, index: '1', name: '地下室安装', area: 55000.00, standard: 5294389.32, bidders: { '投标单位1 (一轮)': 6039742.01, '投标单位1 (二轮)': 5705120.62, '投标单位2 (一轮)': 5582316.91, '投标单位2 (二轮)': 5182316.91 } },
    { id: '7', level: 0, index: '三', name: '包干措施费清单', area: 192673.00, standard: 50105782.04, bidders: { '投标单位1 (一轮)': 38879494.60, '投标单位1 (二轮)': 56656806.07, '投标单位2 (一轮)': 51618147.40, '投标单位2 (二轮)': 50618147.40 } },
    { id: '8', level: 0, index: '四', name: '投标报价总计(一+二+三)', area: 0, standard: 424311181.72, bidders: { '投标单位1 (一轮)': 396959431.68, '投标单位1 (二轮)': 408273092.07, '投标单位2 (一轮)': 424007395.37, '投标单位2 (二轮)': 412007395.37 } },
  ]);

  const handleUnitCompareAreaChange = (id: string, value: string) => {
    setUnitCompareData(prev => prev.map(item => {
      if (item.id === id) {
        return { ...item, area: parseFloat(value) || 0 };
      }
      return item;
    }));
  };

  const getCalculatedTotalUnitCost = (isStandard: boolean, bidderName?: string) => {
    let total = 0;
    let hasValidData = false;
    unitCompareData.forEach(d => {
      if (d.level === 0 && d.index !== '四' && d.area > 0) {
        let amount = 0;
        if (isStandard) {
          amount = d.standard;
        } else if (bidderName && d.bidders && bidderName in d.bidders) {
          amount = (d.bidders as Record<string, number>)[bidderName];
        }
        total += amount / d.area;
        hasValidData = true;
      }
    });
    return hasValidData ? total.toFixed(2) : '-';
  };

  const scrollToAvoidDrawer = (tr: HTMLElement | null) => {
    if (!tr) return;
    
    // 延迟以等待抽屉渲染并触发布局变化
    setTimeout(() => {
      const scrollContainer = document.getElementById('scrollable-content');
      const drawer = document.getElementById('bottom-drawer');
      
      if (tr) {
        // 计算元素在滚动容器中的相对位置
        const trRect = tr.getBoundingClientRect();
        
        // 抽屉实际高度，如果未渲染出来则提供默认值
        const drawerHeight = drawer ? drawer.offsetHeight : window.innerHeight * 0.6;
        // 可视区域的底部安全线 (留出80px边距，确保整行清晰可见)
        const safeBottom = window.innerHeight - drawerHeight - 80;

        // 如果元素的底部低于安全线，说明会被抽屉遮挡，需要滚动
        if (trRect.bottom > safeBottom) {
          const scrollDistance = trRect.bottom - safeBottom;
          
          if (scrollContainer && scrollContainer.scrollHeight > scrollContainer.clientHeight) {
            scrollContainer.scrollBy({
              top: scrollDistance,
              behavior: 'smooth'
            });
          } else {
            // fallback
            window.scrollBy({
              top: scrollDistance,
              behavior: 'smooth'
            });
          }
        }
      }
    }, 150); // 增加一点延迟确保 padding 已经应用并且抽屉 DOM 存在
  };

  const openCompareDrawer = (
    view: 'price' | 'deviation',
    item: { id?: string; code: string; name: string; unit: string; controlPrice: number; bidders?: Record<string, number> },
    bidder: string,
    bidderPrice: number,
    event: React.MouseEvent,
    samePriceBidders?: string[],
    fromDrawer?: string,
    unbalancedBasePriceName?: string
  ) => {
    const tr = (event.target as HTMLElement).closest('tr');
    
    // 偏差原因分析视图使用新的动态基准价
    let basePrice = item.controlPrice;
    if (item.bidders) {
      if (unbalancedSettings.quoteType === 'bidAvg') {
        const allPrices = Object.keys(item.bidders).filter(k => k.startsWith('投标单位')).map(k => item.bidders![k as keyof typeof item.bidders] as number);
        basePrice = allPrices.reduce((a, b) => a + b, 0) / allPrices.length;
      } else if (unbalancedSettings.quoteType === 'bidLowest') {
        const allPrices = Object.keys(item.bidders).filter(k => k.startsWith('投标单位')).map(k => item.bidders![k as keyof typeof item.bidders] as number);
        basePrice = Math.min(...allPrices);
      } else if (unbalancedSettings.quoteType === 'bidHighestLowestAvg') {
        const allPrices = Object.keys(item.bidders).filter(k => k.startsWith('投标单位')).map(k => item.bidders![k as keyof typeof item.bidders] as number);
        if (allPrices.length > 2) {
          allPrices.sort((a, b) => a - b);
          allPrices.shift(); // 移除最低
          allPrices.pop(); // 移除最高
        }
        basePrice = allPrices.reduce((a, b) => a + b, 0) / allPrices.length;
      }
    }

    const diffPercent = basePrice > 0 ? ((bidderPrice - basePrice) / basePrice) * 100 : 0;
    setCompareDrawerData({
      visible: true,
      view,
      activeTab: 'data', // 每次打开重置为数据明细 Tab
      bidder,
      itemCode: item.code,
      itemName: item.name,
      unit: item.unit,
      controlPrice: basePrice, // 将 controlPrice 更新为实际比较的 basePrice 以供明细抽屉使用
      bidderPrice,
      diffPercent,
      samePriceBidders,
      biddersPrices: item.bidders,
      fromDrawer,
      unbalancedBasePriceName
    });

    // 如果是从不平衡报价明细抽屉中打开的，不需要高亮背景行，也不需要滚动底层页面
    if (fromDrawer === 'unbalanced') {
      return;
    }

    if (item.id) {
      setHighlightedRowId(item.id);
      
      // 如果是从明细抽屉跳转过来的，等待DOM渲染后再滚动到对应行
      setTimeout(() => {
        const row = document.getElementById(`compare-row-${item.id}`);
        const scrollContainer = document.getElementById('scrollable-content');
        const drawer = document.getElementById('bottom-drawer');
        
        if (row && scrollContainer) {
          const rowRect = row.getBoundingClientRect();
          const containerRect = scrollContainer.getBoundingClientRect();
          const drawerHeight = drawer ? drawer.offsetHeight : window.innerHeight * 0.6;
          
          // 我们希望行显示在抽屉上方、可见区域中间
          const visibleTop = containerRect.top;
          const visibleBottom = window.innerHeight - drawerHeight;
          const visibleHeight = visibleBottom - visibleTop;
          
          // 目标位置：让行的顶部等于可见区域的中心点附近
          const targetY = visibleTop + visibleHeight / 2 - rowRect.height / 2;
          
          const scrollDistance = rowRect.top - targetY;
          
          scrollContainer.scrollBy({ top: scrollDistance, behavior: 'smooth' });
        } else {
          scrollToAvoidDrawer(tr);
        }
      }, 300);
    } else {
      scrollToAvoidDrawer(tr);
    }
  };

  const closeCompareDrawer = () => {
    setCompareDrawerData(prev => ({ ...prev, visible: false }));
    setHighlightedRowId(null);
  };

  const priceBreakdownRows = [
    { label: '人工费', ratio: 0.34 },
    { label: '材料费', ratio: 0.46 },
    { label: '机械费', ratio: 0.12 },
    { label: '管理及措施费', ratio: 0.08 }
  ];

  const renderStatusIcon = (status: string) => {
    switch(status) {
      case 'ok':
        return <Icon name="Check" size={16} className="text-green-500 mx-auto" />;
      case 'error':
        return <Icon name="X" size={16} className="text-red-500 mx-auto" />;
      case 'warning':
        return <Icon name="X" size={16} className="text-red-500 mx-auto" />;
      default:
        return null;
    }
  };

  const renderComplianceStatusText = (status: string) => {
    switch(status) {
      case 'ok':
        return <span className="text-slate-600">正常</span>;
      case 'error':
      case 'warning':
        return <span className="text-red-500">异常</span>;
      default:
        return <span className="text-slate-400">-</span>;
    }
  };

  const displayResults = showOnlyProblem ? MOCK_RESULTS.filter(r => r.problemCount > 0) : MOCK_RESULTS;

  const handleTabChange = (tabId: string) => {
    setActiveTab(tabId);
    if (tabId !== 'compare') {
      setHighlightedRowId(null);
    }
    if (compareDrawerData.visible) {
      closeCompareDrawer();
    }
    if (problemDetailDrawer.visible) {
      setProblemDetailDrawer(prev => ({ ...prev, visible: false }));
    }
  };

  const handleSummaryCellClick = (mainTabId: string, subTabId?: string) => {
    handleTabChange(mainTabId);
    if (subTabId) {
      if (mainTabId === 'compliance') {
        setActiveComplianceTab(subTabId);
      } else if (mainTabId === 'arithmetic') {
        setActiveArithmeticTab(subTabId);
      } else if (mainTabId === 'collusion') {
        setActiveCollusionTab(subTabId);
      }
    }
  };

  const openProblemDetailDrawer = (title: string, bidder: string, event: React.MouseEvent, type: 'default' | 'samePrice' | 'unbalanced' = 'default', samePriceBidders?: string[], isRegularError?: boolean) => {
    const tr = (event.target as HTMLElement).closest('tr');
    setProblemDetailDrawer({
      visible: true,
      title,
      bidder,
      type,
      samePriceBidders,
      isRegularError,
      view: 'list',
      selectedItem: undefined
    });
    
    scrollToAvoidDrawer(tr);
  };

  const closeProblemDetailDrawer = () => {
    setProblemDetailDrawer(prev => ({ ...prev, visible: false }));
  };

  const openFilePreview = (problemDescription: string, tabs: string[]) => {
    setFilePreviewData({
      visible: true,
      problemDescription,
      tabs,
      activeTab: tabs.length > 0 ? tabs[0] : ''
    });
  };

  const closeFilePreview = () => {
    setFilePreviewData(prev => ({ ...prev, visible: false }));
  };

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
          <div className="min-w-0 leading-tight">
            <h2 className="text-lg font-black text-slate-800">查看检查结果</h2>
            <p className="text-xs text-slate-500 truncate">项目名称：{projectTitle}</p>
          </div>
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
              const isCompleted = currentStep > step.id;
              const isActive = currentStep === step.id;
              // 只要当前处于该步骤，或者该步骤已经被达到过，就被视为“可到达”的状态，但是已完成的步骤保持绿色对勾，仅仅是为了控制悬浮交互和点击权限
              const isClickable = step.id <= maxReachedStep;
              
              const barColor = isCompleted ? 'bg-[#00C48C]' : isActive ? 'bg-blue-600' : 'bg-[#E5E6EB]';
              const textColor = isCompleted ? 'text-[#333333] group-hover:text-green-600' : isActive ? 'text-blue-600 font-semibold' : 'text-[#999999]';

              const handleClick = () => {
                if (step.id === 1) {
                  onBack();
                } else if (step.id === 2 && currentStep !== 2 && isClickable) {
                  setCurrentStep(2);
                  setActiveTab('summary');
                  closeCompareDrawer();
                  closeProblemDetailDrawer();
                } else if (step.id === 3 && currentStep !== 3 && isClickable) {
                  setCurrentStep(3);
                  setActiveTab('summaryCompare');
                }
              };

              return (
                <button 
                  key={step.id}
                  onClick={handleClick}
                  className={`flex flex-col flex-1 text-left group ${isClickable ? 'cursor-pointer' : 'cursor-default'}`}
                >
                  {/* Top Bar */}
                  <div className={`h-1 w-full rounded-full transition-colors ${barColor}`}></div>
                  {/* Content */}
                  <div className={`flex items-center mt-2 p-1.5 rounded-md transition-colors ${isCompleted ? 'group-hover:bg-green-50' : isClickable && !isActive ? 'group-hover:bg-blue-50' : ''}`}>
                    {isCompleted ? (
                      <svg className="w-4 h-4 text-[#00C48C] group-hover:text-green-600 transition-colors" viewBox="0 0 24 24" fill="currentColor">
                        <path fillRule="evenodd" clipRule="evenodd" d="M12 22c5.523 0 10-4.477 10-10S17.523 2 12 2 2 6.477 2 12s4.477 10 10 10zm-1.177-5.177L17.53 10.12l-1.414-1.414-5.293 5.293-2.828-2.828-1.414 1.414 4.242 4.242z" />
                      </svg>
                    ) : isActive ? (
                      <div className="flex items-center justify-center w-4 h-4 rounded-full border-2 border-blue-600">
                        <div className="w-2 h-2 rounded-full bg-blue-600"></div>
                      </div>
                    ) : (
                      <div className={`w-4 h-4 rounded-full border-2 transition-colors ${isClickable ? 'border-blue-300 group-hover:border-blue-400' : 'border-[#E5E6EB]'}`}></div>
                    )}
                    <span className={`ml-2 text-sm transition-colors ${textColor} ${isClickable && !isActive && !isCompleted ? 'group-hover:text-blue-500' : ''}`}>{step.label}</span>
                  </div>
                </button>
              )
            })}
          </div>
        </div>

        <div className="flex items-center space-x-3 w-1/4 justify-end">
          <button 
            onClick={() => {
              if (currentStep === 3) {
                setCurrentStep(2);
                setActiveTab('summary');
                closeCompareDrawer();
                closeProblemDetailDrawer();
              } else {
                onBack();
              }
            }} 
            className="px-5 py-2 text-sm font-medium text-slate-600 bg-white border border-slate-300 rounded-md hover:bg-slate-50 transition-colors flex items-center space-x-1"
          >
             <span>上一步</span>
          </button>
          <button 
            onClick={() => {
              if (currentStep === 2) {
                setCurrentStep(3);
                setActiveTab('summaryCompare');
                setMaxReachedStep(Math.max(maxReachedStep, 3));
              } else {
                handleExportReport();
              }
            }} 
            className="px-5 py-2 text-sm font-medium text-white bg-blue-600 rounded-md hover:bg-blue-700 transition-colors shadow-sm shadow-blue-600/20"
          >
            {currentStep === 2 ? '查看对比表' : '导出报告'}
          </button>
          {currentStep === 3 && (
            <button 
              onClick={() => {
                // 模拟回标轮次+1并返回列表页的逻辑
                alert('本轮回标已完成，即将返回列表页。下次操作将进入新一轮回标。');
                if (onReturnToList) {
                  onReturnToList();
                } else {
                  onBack();
                }
              }}
              className="px-5 py-2 text-sm font-medium text-blue-600 bg-blue-50 border border-blue-200 rounded-md hover:bg-blue-100 transition-colors shadow-sm"
            >
              完成本轮回标
            </button>
          )}
        </div>
      </div>

      <div id="scrollable-content" className="flex-1 overflow-auto p-4 relative">
        <div className={`space-y-4 ${problemDetailDrawer.visible || compareDrawerData.visible ? 'pb-[70vh]' : ''}`}>
          
          <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden flex flex-col">
            {/* Tabs */}
            <div className="flex bg-blue-50/50 border-b border-slate-200 px-2 pt-2 items-center justify-between">
              <div className="flex">
                {TABS.map(tab => (
                  <button
                    key={tab.id}
                    onClick={() => handleTabChange(tab.id)}
                    className={`px-6 py-2.5 text-sm font-medium rounded-t-lg transition-colors ${
                      activeTab === tab.id 
                        ? 'bg-white text-slate-800 border border-slate-200 border-b-white relative top-[1px]' 
                        : 'text-slate-500 hover:text-slate-700 hover:bg-slate-100/50'
                    }`}
                  >
                    {tab.label}
                  </button>
                ))}
              </div>
              {currentStep === 3 && (
                <div className="pr-4 pb-1 flex items-center space-x-2">
                  <div className="relative">
                    <button 
                      onClick={() => setShowTaxAmountSettingsDropdown(!showTaxAmountSettingsDropdown)} 
                      className="px-3 py-1 text-sm font-medium text-blue-600 bg-white border border-blue-200 rounded hover:bg-blue-50 transition-colors flex items-center space-x-1"
                    >
                      <Icon name="Settings" size={14} />
                      <span>金额设置</span>
                    </button>
                    {showTaxAmountSettingsDropdown && (
                      <>
                        <div className="fixed inset-0 z-[100]" onClick={() => setShowTaxAmountSettingsDropdown(false)}></div>
                        <div className="absolute right-0 mt-1 w-48 bg-white border border-slate-200 rounded-lg shadow-lg z-[101] py-2 text-sm animate-in fade-in slide-in-from-top-2 duration-200">
                          <div className="px-4 py-2 text-slate-500 text-xs border-b border-slate-100 mb-1">显示设置</div>
                          <label className="w-full text-left px-4 py-2 hover:bg-slate-50 flex items-center space-x-3 cursor-pointer">
                            <input 
                              type="radio" 
                              name="taxAmountType" 
                              value="tax" 
                              checked={taxAmountType === 'tax'} 
                              onChange={() => { setTaxAmountType('tax'); setShowTaxAmountSettingsDropdown(false); }}
                              className="w-4 h-4 text-blue-600 border-slate-300 focus:ring-blue-500"
                            />
                            <span className="text-slate-700">含税金额</span>
                          </label>
                          <label className="w-full text-left px-4 py-2 hover:bg-slate-50 flex items-center space-x-3 cursor-pointer">
                            <input 
                              type="radio" 
                              name="taxAmountType" 
                              value="noTax" 
                              checked={taxAmountType === 'noTax'} 
                              onChange={() => { setTaxAmountType('noTax'); setShowTaxAmountSettingsDropdown(false); }}
                              className="w-4 h-4 text-blue-600 border-slate-300 focus:ring-blue-500"
                            />
                            <span className="text-slate-700">不含税金额</span>
                          </label>
                        </div>
                      </>
                    )}
                  </div>
                  <button onClick={() => setShowSettingsModal(true)} className="px-3 py-1 text-sm font-medium text-blue-600 bg-white border border-blue-200 rounded hover:bg-blue-50 transition-colors flex items-center space-x-1">
                    <Icon name="Settings" size={14} />
                    <span>不平衡报价设置</span>
                  </button>
                  <button onClick={handleStartAiAnalysis} className="px-3 py-1 text-sm font-medium text-white bg-blue-600 rounded hover:bg-blue-700 transition-colors flex items-center space-x-1 shadow-sm">
                    <Icon name="Sparkles" size={14} />
                    <span>AI整体分析</span>
                  </button>
                  <button onClick={handleExportReport} className="px-3 py-1 text-sm font-medium text-blue-600 bg-blue-50 border border-blue-200 rounded hover:bg-blue-100 transition-colors flex items-center space-x-1">
                    <Icon name="Download" size={14} />
                    <span>导出报表</span>
                  </button>
                </div>
              )}
            </div>

            {activeTab === 'summary' && (
              <div className="flex items-center justify-between p-4 border-b border-slate-100 bg-white">
                <div className="text-sm text-slate-500 flex items-center">
                  <Icon name="Info" size={14} className="mr-1 text-slate-400" />
                  温馨提示：鼠标点击 <Icon name="X" size={14} className="text-red-500 mx-1" /> 或 <Icon name="Check" size={14} className="text-green-500 mx-1" /> ，可直接跳转到具体的检查
                </div>
                <label className="flex items-center space-x-2 cursor-pointer">
                  <input 
                    type="checkbox" 
                    checked={showOnlyProblem} 
                    onChange={e => setShowOnlyProblem(e.target.checked)}
                    className="w-4 h-4 text-blue-600 rounded border-slate-300 focus:ring-blue-500" 
                  />
                  <span className="text-sm text-slate-700">只显示有问题单位</span>
                </label>
              </div>
            )}

            {/* Table Area */}
            <div className="overflow-x-auto bg-white p-4">
              {activeTab === 'summary' && (
                <table className="w-full text-center border-collapse border border-slate-200 min-w-[1200px]">
                  <thead className="bg-slate-50 text-[13px] text-slate-700 font-semibold">
                    <tr>
                      <th className="border border-slate-200 py-3 px-2 w-12" rowSpan={2}>序号</th>
                      <th className="border border-slate-200 py-3 px-4 w-32" rowSpan={2}>投标单位</th>
                      <th className="border border-slate-200 py-3 px-4 w-24" rowSpan={2}>问题数量</th>
                      <th className="border border-slate-200 py-2" colSpan={7}>符合性检查</th>
                      <th className="border border-slate-200 py-2" colSpan={2}>算术性错误检查</th>
                      <th className="border border-slate-200 py-2 w-32" rowSpan={2}>不平衡报价检查</th>
                      <th className="border border-slate-200 py-2" colSpan={3}>串标嫌疑检查</th>
                    </tr>
                    <tr className="bg-slate-50 text-[12px] text-slate-600 font-medium">
                      {/* 符合性检查 */}
                      <th className="border border-slate-200 py-2 px-2 font-normal">错项检查</th>
                      <th className="border border-slate-200 py-2 px-2 font-normal">增项检查</th>
                      <th className="border border-slate-200 py-2 px-2 font-normal">漏项检查</th>
                      <th className="border border-slate-200 py-2 px-2 font-normal">相同清单价格<br/>一致性检查</th>
                      <th className="border border-slate-200 py-2 px-2 font-normal">相同材料价格<br/>一致性检查</th>
                      <th className="border border-slate-200 py-2 px-2 font-normal">不可竞争金额<br/>是否有改动</th>
                      <th className="border border-slate-200 py-2 px-2 font-normal">投标价突破投<br/>标限价检查</th>
                      
                      {/* 算术性错误检查 */}
                      <th className="border border-slate-200 py-2 px-2 font-normal">单价为零、空<br/>、负数检查</th>
                      <th className="border border-slate-200 py-2 px-2 font-normal">合价检查</th>
                      
                      {/* 串标嫌疑检查 */}
                      <th className="border border-slate-200 py-2 px-2 font-normal">电子文件属<br/>性信息雷同</th>
                      <th className="border border-slate-200 py-2 px-2 font-normal">单价相同/相<br/>似检查</th>
                      <th className="border border-slate-200 py-2 px-2 font-normal">规律性错误检查</th>
                    </tr>
                  </thead>
                  <tbody>
                    {displayResults.map((result, index) => (
                      <tr key={result.id} className="bg-white hover:bg-slate-50/50 transition-colors">
                        <td className="border border-slate-200 py-3 text-sm text-slate-500">{index + 1}</td>
                        <td className="border border-slate-200 py-3 text-sm text-slate-800 font-medium">{result.bidder}</td>
                        <td className="border border-slate-200 py-3 text-sm text-red-500 font-medium">{result.problemCount > 0 ? result.problemCount : ''}</td>
                        
                        {/* 符合性检查数据 */}
                        <td className="border border-slate-200 py-3 cursor-pointer hover:bg-slate-100" onClick={() => handleSummaryCellClick('compliance', 'wrong')}>{renderStatusIcon(result.compliance.wrong)}</td>
                        <td className="border border-slate-200 py-3 cursor-pointer hover:bg-slate-100" onClick={() => handleSummaryCellClick('compliance', 'added')}>{renderStatusIcon(result.compliance.added)}</td>
                        <td className="border border-slate-200 py-3 cursor-pointer hover:bg-slate-100" onClick={() => handleSummaryCellClick('compliance', 'missing')}>{renderStatusIcon(result.compliance.missing)}</td>
                        <td className="border border-slate-200 py-3 cursor-pointer hover:bg-slate-100" onClick={() => handleSummaryCellClick('compliance', 'sameList')}>{renderStatusIcon(result.compliance.sameList)}</td>
                        <td className="border border-slate-200 py-3 cursor-pointer hover:bg-slate-100" onClick={() => handleSummaryCellClick('compliance', 'sameMaterial')}>{renderStatusIcon(result.compliance.sameMaterial)}</td>
                        <td className="border border-slate-200 py-3 cursor-pointer hover:bg-slate-100" onClick={() => handleSummaryCellClick('compliance', 'noCompete')}>{renderStatusIcon(result.compliance.noCompete)}</td>
                        <td className="border border-slate-200 py-3 cursor-pointer hover:bg-slate-100" onClick={() => handleSummaryCellClick('compliance', 'exceedLimit')}>{renderStatusIcon(result.compliance.exceedLimit)}</td>
                        
                        {/* 算术性错误检查数据 */}
                        <td className="border border-slate-200 py-3 cursor-pointer hover:bg-slate-100" onClick={() => handleSummaryCellClick('arithmetic', 'emptyZero')}>{renderStatusIcon(result.arithmetic.emptyZero)}</td>
                        <td className="border border-slate-200 py-3 cursor-pointer hover:bg-slate-100" onClick={() => handleSummaryCellClick('arithmetic', 'total')}>{renderStatusIcon(result.arithmetic.total)}</td>
                        
                        {/* 不平衡报价 */}
                        <td className="border border-slate-200 py-3 cursor-pointer hover:bg-slate-100" onClick={() => handleSummaryCellClick('unbalanced')}>{renderStatusIcon(result.collusion.unbalanced)}</td>
                        
                        {/* 串标嫌疑检查数据 */}
                        <td className="border border-slate-200 py-3 cursor-pointer hover:bg-slate-100" onClick={() => handleSummaryCellClick('collusion', 'attr')}>{renderStatusIcon(result.collusion.attr)}</td>
                        <td className="border border-slate-200 py-3 cursor-pointer hover:bg-slate-100" onClick={() => handleSummaryCellClick('collusion', 'samePrice')}>{renderStatusIcon(result.collusion.samePrice)}</td>
                        <td className="border border-slate-200 py-3 cursor-pointer hover:bg-slate-100" onClick={() => handleSummaryCellClick('collusion', 'typos')}>{renderStatusIcon(result.collusion.typos)}</td>
                      </tr>
                    ))}
                    {displayResults.length === 0 && (
                      <tr>
                        <td colSpan={15} className="border border-slate-200 py-12 text-slate-400 text-sm">
                          没有发现问题记录
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              )}
              {activeTab === 'compliance' && (
                <div className="space-y-4">
                  {/* 二级导航 */}
                  <div className="flex items-center justify-between border-b border-slate-200">
                    <div className="flex space-x-1">
                      {COMPLIANCE_TABS.map(tab => (
                        <button
                          key={tab.id}
                          onClick={() => setActiveComplianceTab(tab.id)}
                          className={`px-4 py-2 text-sm transition-colors border-b-2 ${
                            activeComplianceTab === tab.id 
                              ? 'border-blue-600 text-blue-600 font-medium' 
                              : 'border-transparent text-slate-500 hover:text-slate-800'
                          }`}
                        >
                          {tab.label}
                        </button>
                      ))}
                    </div>
                    <button onClick={handleExportReport} className="px-3 py-1.5 text-sm font-medium text-blue-600 bg-blue-50 border border-blue-200 rounded hover:bg-blue-100 transition-colors flex items-center space-x-1 mb-2">
                      <Icon name="Download" size={14} />
                      <span>导出报表</span>
                    </button>
                  </div>
                  {activeComplianceTab === 'sameList' && finalSameListGroups.length > 0 && (
                    <div className="flex items-center space-x-2 overflow-x-auto">
                      {finalSameListGroups.map((group: any) => (
                        <button
                          key={group.id}
                          onClick={() => setActiveSameListGroupTab(group.id)}
                          className={`px-4 py-1.5 rounded-full text-sm font-medium transition-colors shrink-0 ${
                            activeSameListGroupTab === group.id
                              ? 'bg-blue-100 text-blue-700 border border-blue-200'
                              : 'bg-slate-50 text-slate-600 border border-slate-200 hover:bg-slate-100'
                          }`}
                        >
                          {group.name}
                        </button>
                      ))}
                    </div>
                  )}
                  
                  {/* 符合性检查表格 */}
                  <table className="w-full text-center border-collapse border border-slate-200">
                    <thead className="bg-slate-50 text-[13px] text-slate-700 font-semibold">
                      <tr>
                        <th className="border border-slate-200 py-3 px-4 w-16">序号</th>
                        <th className="border border-slate-200 py-3 px-4 w-48">投标人名称</th>
                        <th className="border border-slate-200 py-3 px-4 w-24">错误量</th>
                        <th className="border border-slate-200 py-3 px-4 w-24">结果</th>
                        <th className="border border-slate-200 py-3 px-4 text-left">说明</th>
                        <th className="border border-slate-200 py-3 px-4 w-24">操作</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100 text-sm">
                      {MOCK_RESULTS.map((result, index) => {
                        // 简单模拟根据不同二级tab展示错误数量和说明
                        const hasError = result.compliance[activeComplianceTab as keyof typeof result.compliance] === 'error';
                        const errorCount = hasError ? Math.floor(Math.random() * 3) + 1 : 0;
                        
                        return (
                          <tr key={result.id} className="bg-white hover:bg-blue-50/30 transition-colors">
                            <td className="border border-slate-200 py-3 px-4 text-slate-500">{index + 1}</td>
                            <td className="border border-slate-200 py-3 px-4 text-slate-800">{result.bidder}</td>
                            <td className={`border border-slate-200 py-3 px-4 ${errorCount > 0 ? 'text-red-500 font-medium' : 'text-slate-600'}`}>
                              {errorCount > 0 ? errorCount : '-'}
                            </td>
                            <td className={`border border-slate-200 py-3 px-4 ${errorCount > 0 ? 'text-red-500' : 'text-green-600'}`}>
                              {errorCount > 0 ? '异常' : '正常'}
                            </td>
                            <td className="border border-slate-200 py-3 px-4 text-left text-slate-600 truncate max-w-md">
                              {errorCount > 0 
                                ? <span className="text-red-500">{`${errorCount}项投标部分项清单与招标部分项清单不一致; 1项投标总价措施项目...`}</span> 
                                : '-'}
                            </td>
                            <td className="border border-slate-200 py-3 px-4">
                              <button 
                                onClick={(e) => openProblemDetailDrawer(COMPLIANCE_TABS.find(t => t.id === activeComplianceTab)?.label || '问题明细', result.bidder, e)}
                                className="text-blue-600 hover:text-blue-700 font-medium"
                              >
                                查看明细
                              </button>
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              )}
              {activeTab === 'arithmetic' && (
                <div className="space-y-4">
                  {/* 二级导航 */}
                  <div className="flex items-center justify-between border-b border-slate-200">
                    <div className="flex space-x-1">
                      {ARITHMETIC_TABS.map(tab => (
                        <button
                          key={tab.id}
                          onClick={() => setActiveArithmeticTab(tab.id)}
                          className={`px-4 py-2 text-sm transition-colors border-b-2 ${
                            activeArithmeticTab === tab.id 
                              ? 'border-blue-600 text-blue-600 font-medium' 
                              : 'border-transparent text-slate-500 hover:text-slate-800'
                          }`}
                        >
                          {tab.label}
                        </button>
                      ))}
                    </div>
                    <button onClick={handleExportReport} className="px-3 py-1.5 text-sm font-medium text-blue-600 bg-blue-50 border border-blue-200 rounded hover:bg-blue-100 transition-colors flex items-center space-x-1 mb-2">
                      <Icon name="Download" size={14} />
                      <span>导出报表</span>
                    </button>
                  </div>
                  
                  {/* 算术性错误检查表格 */}
                  <table className="w-full text-center border-collapse border border-slate-200">
                    <thead className="bg-slate-50 text-[13px] text-slate-700 font-semibold">
                      <tr>
                        <th className="border border-slate-200 py-3 px-4 w-16">序号</th>
                        <th className="border border-slate-200 py-3 px-4 w-48">投标人名称</th>
                        <th className="border border-slate-200 py-3 px-4 w-24">错误量</th>
                        <th className="border border-slate-200 py-3 px-4 w-24">结果</th>
                        <th className="border border-slate-200 py-3 px-4 text-left">说明</th>
                        <th className="border border-slate-200 py-3 px-4 w-24">操作</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100 text-sm">
                      {MOCK_RESULTS.map((result, index) => {
                        const hasError = result.arithmetic[activeArithmeticTab as keyof typeof result.arithmetic] === 'error' || result.arithmetic[activeArithmeticTab as keyof typeof result.arithmetic] === 'warning';
                        const errorCount = hasError ? Math.floor(Math.random() * 5) + 1 : 0;
                        
                        return (
                          <tr key={result.id} className="bg-white hover:bg-blue-50/30 transition-colors">
                            <td className="border border-slate-200 py-3 px-4 text-slate-500">{index + 1}</td>
                            <td className="border border-slate-200 py-3 px-4 text-slate-800">{result.bidder}</td>
                            <td className={`border border-slate-200 py-3 px-4 ${errorCount > 0 ? 'text-red-500 font-medium' : 'text-slate-600'}`}>
                              {errorCount > 0 ? errorCount : '-'}
                            </td>
                            <td className={`border border-slate-200 py-3 px-4 ${errorCount > 0 ? 'text-red-500' : 'text-green-600'}`}>
                              {errorCount > 0 ? '异常' : '正常'}
                            </td>
                            <td className="border border-slate-200 py-3 px-4 text-left text-slate-600 truncate max-w-md">
                              {errorCount > 0 
                                ? <span className="text-red-500">{`${errorCount}项清单计算结果存在算术性错误...`}</span> 
                                : '-'}
                            </td>
                            <td className="border border-slate-200 py-3 px-4">
                              <button 
                                onClick={(e) => openProblemDetailDrawer(ARITHMETIC_TABS.find(t => t.id === activeArithmeticTab)?.label || '问题明细', result.bidder, e)}
                                className="text-blue-600 hover:text-blue-700 font-medium"
                              >
                                查看明细
                              </button>
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              )}
              {activeTab === 'unbalanced' && (
                <div className="space-y-4">
                  {/* 顶部操作区 */}
                  <div className="flex items-center justify-between border-b border-slate-200 pb-2">
                    <div className="text-sm text-slate-500">
                      超出设定的基准值部分被认定为不平衡报价
                    </div>
                    <div className="flex items-center space-x-3">
                      <button onClick={() => setShowSettingsModal(true)} className="px-3 py-1.5 text-sm font-medium text-blue-600 bg-white border border-blue-200 rounded hover:bg-blue-50 transition-colors flex items-center space-x-1">
                        <Icon name="Settings" size={14} />
                        <span>参数设置</span>
                      </button>
                      <button onClick={handleExportReport} className="px-3 py-1.5 text-sm font-medium text-blue-600 bg-blue-50 border border-blue-200 rounded hover:bg-blue-100 transition-colors flex items-center space-x-1">
                        <Icon name="Download" size={14} />
                        <span>导出报表</span>
                      </button>
                    </div>
                  </div>
                  
                  {/* 不平衡报价检查表格 */}
                  <table className="w-full text-center border-collapse border border-slate-200">
                    <thead className="bg-slate-50 text-[13px] text-slate-700 font-semibold">
                      <tr>
                        <th className="border border-slate-200 py-3 px-4 w-16">序号</th>
                        <th className="border border-slate-200 py-3 px-4 w-48">投标人名称</th>
                        <th className="border border-slate-200 py-3 px-4">投标总报价</th>
                        <th className="border border-slate-200 py-3 px-4">不平衡清单合价</th>
                        <th className="border border-slate-200 py-3 px-4">占总报价百分比</th>
                        <th className="border border-slate-200 py-3 px-4 w-24">结果</th>
                        <th className="border border-slate-200 py-3 px-4 text-left">说明</th>
                        <th className="border border-slate-200 py-3 px-4 w-24">操作</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100 text-sm">
                      {MOCK_RESULTS.map((result, index) => {
                        // 简单模拟不同投标单位的数据状态
                        const isWarning = index === 1; // 模拟第二行是警告状态
                        const totalBid = isWarning ? 100 : 10000;
                        const unbalancedTotal = isWarning ? 15 : 7746.82;
                        const percentage = isWarning ? '15%' : '77.47%';
                        
                        return (
                          <tr key={result.id} className="bg-white hover:bg-blue-50/30 transition-colors">
                            <td className="border border-slate-200 py-3 px-4 text-slate-500">{index + 1}</td>
                            <td className="border border-slate-200 py-3 px-4 text-slate-800">{result.bidder}</td>
                            <td className="border border-slate-200 py-3 px-4 text-slate-600">{totalBid}</td>
                            <td className="border border-slate-200 py-3 px-4 text-slate-600">{unbalancedTotal}</td>
                            <td className="border border-slate-200 py-3 px-4 text-slate-600">{percentage}</td>
                            <td className={`border border-slate-200 py-3 px-4 ${isWarning ? 'text-amber-500' : 'text-red-500'}`}>
                              {isWarning ? '警告' : '异常'}
                            </td>
                            <td className={`border border-slate-200 py-3 px-4 text-left truncate max-w-md ${isWarning ? 'text-amber-500' : 'text-red-500'}`}>
                              6条清单单价与均价偏差在30.0%以上，...
                            </td>
                            <td className="border border-slate-200 py-3 px-4">
                              <button 
                                onClick={(e) => openProblemDetailDrawer('不平衡报价明细', result.bidder, e, 'unbalanced')}
                                className="text-blue-600 hover:text-blue-700 font-medium"
                              >
                                查看明细
                              </button>
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              )}
              {activeTab === 'collusion' && (
                <div className="space-y-4">
                  {/* 二级导航 */}
                  <div className="flex items-center justify-between border-b border-slate-200">
                    <div className="flex space-x-1">
                      {COLLUSION_TABS.map(tab => (
                        <button
                          key={tab.id}
                          onClick={() => setActiveCollusionTab(tab.id)}
                          className={`px-4 py-2 text-sm transition-colors border-b-2 ${
                            activeCollusionTab === tab.id 
                              ? 'border-blue-600 text-blue-600 font-medium' 
                              : 'border-transparent text-slate-500 hover:text-slate-800'
                          }`}
                        >
                          {tab.label}
                        </button>
                      ))}
                    </div>
                    <button onClick={handleExportReport} className="px-3 py-1.5 text-sm font-medium text-blue-600 bg-blue-50 border border-blue-200 rounded hover:bg-blue-100 transition-colors flex items-center space-x-1 mb-2">
                      <Icon name="Download" size={14} />
                      <span>导出报表</span>
                    </button>
                  </div>
                  
                  {/* 串标检查表格 */}
                  <table className="w-full text-center border-collapse border border-slate-200">
                      <thead className="bg-slate-50 text-[13px] text-slate-700 font-semibold sticky top-0 shadow-sm z-10">
                        <tr>
                          <th className="border border-slate-200 py-3 px-4 w-16">序号</th>
                          <th className="border border-slate-200 py-3 px-4 w-32">投标单位</th>
                          <th className="border border-slate-200 py-3 px-4 w-24 whitespace-nowrap">嫌疑项数量</th>
                          <th className="border border-slate-200 py-3 px-4 w-24">结果</th>
                          <th className="border border-slate-200 py-3 px-4 text-left">说明</th>
                          <th className="border border-slate-200 py-3 px-4 w-24">操作</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-100 text-sm">
                      {MOCK_RESULTS.map((result, index) => {
                        const hasError = result.collusion[activeCollusionTab as keyof typeof result.collusion] === 'error' || result.collusion[activeCollusionTab as keyof typeof result.collusion] === 'warning';
                        const errorCount = hasError ? Math.floor(Math.random() * 3) + 1 : 0;
                        
                        return (
                          <tr key={result.id} className="bg-white hover:bg-blue-50/30 transition-colors">
                            <td className="border border-slate-200 py-3 px-4 text-slate-500">{index + 1}</td>
                            <td className="border border-slate-200 py-3 px-4 text-slate-800">{result.bidder}</td>
                            <td className={`border border-slate-200 py-3 px-4 ${errorCount > 0 ? 'text-red-500 font-medium' : 'text-slate-600'}`}>
                              {errorCount > 0 ? errorCount : '-'}
                            </td>
                            <td className={`border border-slate-200 py-3 px-4 ${errorCount > 0 ? 'text-red-500' : 'text-green-600'}`}>
                              {errorCount > 0 ? '异常' : '正常'}
                            </td>
                            <td className="border border-slate-200 py-3 px-4 text-left text-slate-600 truncate max-w-md">
                              {errorCount > 0 
                                ? <span className="text-red-500">
                                    {activeCollusionTab === 'samePrice' && (result.bidder === 'D' || result.bidder === 'E')
                                      ? "D和E每个单价只差了10块"
                                      : `存在${errorCount}项${COLLUSION_TABS.find(t => t.id === activeCollusionTab)?.label}嫌疑...`
                                    }
                                  </span> 
                                : '-'}
                            </td>
                            <td className="border border-slate-200 py-3 px-4">
                              <button 
                                onClick={(e) => {
                                  const tabLabel = COLLUSION_TABS.find(t => t.id === activeCollusionTab)?.label || '问题明细';
                                  if (activeCollusionTab === 'samePrice') {
                                    if (result.bidder === 'D' || result.bidder === 'E') {
                                      // 模拟 D 和 E 规律性错误（固定差额）放到单价相同相似检查中
                                      openProblemDetailDrawer(tabLabel, result.bidder, e, 'samePrice', ['投标单位1', '投标单位2'], true);
                                    } else {
                                      let involvedBidders = [result.bidder];
                                      if (result.bidder === 'A' || result.bidder === 'B') {
                                        // 映射到 MOCK_COMPARE_DATA 中的实际单位名称
                                        involvedBidders = ['投标单位1', '投标单位2'];
                                      } else {
                                        const otherBidder = MOCK_RESULTS.find(r => r.id !== result.id && r.id !== '4' && r.id !== '5')?.bidder || '其他单位';
                                        involvedBidders = [result.bidder, otherBidder];
                                      }
                                      openProblemDetailDrawer(tabLabel, result.bidder, e, 'samePrice', involvedBidders);
                                    }
                                  } else {
                                    openProblemDetailDrawer(tabLabel, result.bidder, e);
                                  }
                                }}
                                className="text-blue-600 hover:text-blue-700 font-medium"
                              >
                                查看明细
                              </button>
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              )}
              {activeTab === 'summaryCompare' && (
                <div className="space-y-4">
                  {/* 顶部操作区 */}
                  <div className="flex items-center justify-between border-b border-slate-200 pb-2">
                    <div className="text-sm text-slate-500">
                      各投标单位及标底的汇总对比分析，可直观查看各部分费用的偏差情况
                    </div>
                    <div className="flex items-center space-x-3">
                      <button onClick={() => setShowSummaryHeaderSettingsModal(true)} className="px-3 py-1.5 text-sm font-medium text-blue-600 bg-white border border-blue-200 rounded hover:bg-blue-50 transition-colors flex items-center space-x-1">
                        <Icon name="Columns" size={14} />
                        <span>表头设置</span>
                      </button>
                    </div>
                  </div>
                  
                  {/* 对比表格 */}
                  <div className="overflow-x-auto">
                    <table className="w-full text-center border-collapse border border-slate-200 min-w-[1200px]">
                      <thead className="bg-slate-50 text-[13px] text-slate-700 font-semibold">
                        <tr>
                          {selectedSummaryHeaders.includes('序号') && <th className="border border-slate-200 py-3 px-2 w-16" rowSpan={2}>序号</th>}
                          {selectedSummaryHeaders.includes('项目名称') && <th className="border border-slate-200 py-3 px-4 min-w-[200px]" rowSpan={2}>项目名称</th>}
                          <th className="border border-slate-200 py-2 px-4 bg-blue-50 text-blue-700" colSpan={taxAmountType === 'both' ? 2 : 1}>标底</th>
                          {sortedBidderKeys.map(bidder => (
                            <th 
                              key={bidder} 
                              className="border border-slate-200 py-2 px-4 cursor-grab active:cursor-grabbing hover:bg-slate-100 transition-colors group relative" 
                              colSpan={taxAmountType === 'both' ? 3 : 2}
                              draggable
                              onDragStart={(e) => handleDragStart(e, bidder)}
                              onDragOver={handleDragOver}
                              onDrop={(e) => handleDrop(e, bidder)}
                            >
                              <div className="flex items-center justify-center space-x-2">
                                {renderBidderLabel(bidder)}
                                <Icon name="GripVertical" size={14} className="text-slate-300 opacity-0 group-hover:opacity-100 transition-opacity absolute right-2" />
                              </div>
                            </th>
                          ))}
                        </tr>
                        <tr className="bg-slate-50 text-[12px] text-slate-600 font-medium">
                          {(taxAmountType === 'both' || taxAmountType === 'noTax') && <th className="border border-slate-200 py-2 px-4 font-normal bg-blue-50/50">不含税金额(元)</th>}
                          {(taxAmountType === 'both' || taxAmountType === 'tax') && <th className="border border-slate-200 py-2 px-4 font-normal bg-blue-50/50">含税金额(元)</th>}
                          {sortedBidderKeys.map(bidder => (
                            <React.Fragment key={bidder}>
                              {(taxAmountType === 'both' || taxAmountType === 'noTax') && <th className="border border-slate-200 py-2 px-4 font-normal">不含税金额(元)</th>}
                              {(taxAmountType === 'both' || taxAmountType === 'tax') && <th className="border border-slate-200 py-2 px-4 font-normal">含税金额(元)</th>}
                              <th className="border border-slate-200 py-2 px-4 font-normal">偏差百分比</th>
                            </React.Fragment>
                          ))}
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-200 text-sm text-slate-600 bg-white">
                        {MOCK_SUMMARY_COMPARE_DATA.map((item) => (
                          <tr key={item.id} className="hover:bg-blue-50/30 transition-colors">
                            {selectedSummaryHeaders.includes('序号') && <td className="border border-slate-200 py-2 px-2">{item.index}</td>}
                            {selectedSummaryHeaders.includes('项目名称') && <td className="border border-slate-200 py-2 px-4 text-left">{item.name}</td>}
                            {(taxAmountType === 'both' || taxAmountType === 'noTax') && <td className="border border-slate-200 py-2 px-4 font-mono text-right text-blue-700 bg-blue-50/30">{(item.controlPrice * 0.91).toFixed(2)}</td>}
                            {(taxAmountType === 'both' || taxAmountType === 'tax') && <td className="border border-slate-200 py-2 px-4 font-mono text-right text-blue-700 bg-blue-50/30">{item.controlPrice.toFixed(2)}</td>}
                            {sortedBidderKeys.map(bidder => {
                              const price = item.bidders[bidder as keyof typeof item.bidders] as number;
                              
                              // 计算不平衡报价的基准价
                              let basePrice = item.controlPrice;
                              if (unbalancedSettings.quoteType === 'bidAvg') {
                                const allPrices = Object.keys(item.bidders).filter(k => k.startsWith('投标单位')).map(k => item.bidders[k as keyof typeof item.bidders] as number);
                                basePrice = allPrices.reduce((a, b) => a + b, 0) / allPrices.length;
                              } else if (unbalancedSettings.quoteType === 'bidLowest') {
                                const allPrices = Object.keys(item.bidders).filter(k => k.startsWith('投标单位')).map(k => item.bidders[k as keyof typeof item.bidders] as number);
                                basePrice = Math.min(...allPrices);
                              } else if (unbalancedSettings.quoteType === 'bidHighestLowestAvg') {
                                const allPrices = Object.keys(item.bidders).filter(k => k.startsWith('投标单位')).map(k => item.bidders[k as keyof typeof item.bidders] as number);
                                if (allPrices.length > 2) {
                                  allPrices.sort((a, b) => a - b);
                                  allPrices.shift(); // 移除最低
                                  allPrices.pop(); // 移除最高
                                }
                                basePrice = allPrices.reduce((a, b) => a + b, 0) / allPrices.length;
                              }

                              const diffPercent = basePrice > 0 ? ((price - basePrice) / basePrice) * 100 : 0;
                              const floatRange = parseFloat(unbalancedSettings.floatRange) || 0;
                              const isExceeding = Math.abs(diffPercent) > floatRange;
                              const diffClass = diffPercent > 0 ? 'text-red-500' : diffPercent < 0 ? 'text-green-500' : 'text-slate-600';
                              
                              return (
                                <React.Fragment key={bidder}>
                                  {(taxAmountType === 'both' || taxAmountType === 'noTax') && <td className="border border-slate-200 py-2 px-4 font-mono text-right">{(price * 0.91).toFixed(2)}</td>}
                                  {(taxAmountType === 'both' || taxAmountType === 'tax') && <td className="border border-slate-200 py-2 px-4 font-mono text-right">{price.toFixed(2)}</td>}
                                  <td className={`border border-slate-200 py-2 px-4 font-mono text-right ${diffClass} ${isExceeding ? 'bg-red-50/50' : ''}`}>
                                    <button
                                      type="button"
                                      onClick={(e) => openCompareDrawer('deviation', { ...item, code: '-', unit: '项' }, bidder, price, e)}
                                      className="w-full text-right hover:underline"
                                    >
                                      {diffPercent > 0 ? '+' : ''}{diffPercent.toFixed(2)}%
                                    </button>
                                  </td>
                                </React.Fragment>
                              );
                            })}
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              )}
              {activeTab === 'compare' && (
                <div className="space-y-4">
                  {/* Sheet 页签 */}
                  <div className="flex border-b border-slate-200">
                    {COMPARE_SHEET_TABS.map(tab => (
                      <button
                        key={tab.id}
                        onClick={() => setActiveCompareSheetTab(tab.id)}
                        className={`px-4 py-2 text-sm font-medium transition-colors relative ${
                          activeCompareSheetTab === tab.id
                            ? 'text-blue-600'
                            : 'text-slate-500 hover:text-slate-700 hover:bg-slate-50'
                        }`}
                      >
                        {tab.label}
                        {activeCompareSheetTab === tab.id && (
                          <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-blue-600" />
                        )}
                      </button>
                    ))}
                  </div>
                  
                  {/* 顶部操作区 */}
                  <div className="flex items-center justify-between border-b border-slate-200 pb-2">
                    <div className="relative w-80">
                      <Icon name="Search" size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                      <input 
                        type="text" 
                        placeholder="请输入项目编码/名称/项目特征等..." 
                        value={compareSearchKeyword}
                        onChange={(e) => setCompareSearchKeyword(e.target.value)}
                        className="w-full pl-9 pr-4 py-1.5 text-sm border border-slate-300 rounded-md focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500 transition-colors" 
                      />
                    </div>
                    <div className="flex items-center space-x-3">
                      <button onClick={() => setShowHeaderSettingsModal(true)} className="px-3 py-1.5 text-sm font-medium text-blue-600 bg-white border border-blue-200 rounded hover:bg-blue-50 transition-colors flex items-center space-x-1">
                        <Icon name="Columns" size={14} />
                        <span>表头设置</span>
                      </button>
                      <button onClick={handleOpenBenchmarkModal} className="px-3 py-1.5 text-sm font-medium text-blue-600 bg-white border border-blue-200 rounded hover:bg-blue-50 transition-colors flex items-center space-x-1">
                        <Icon name="Settings" size={14} />
                        <span>评标价设置</span>
                      </button>
                    </div>
                  </div>
                  
                  {/* 对比表格 */}
                  <div className="overflow-x-auto">
                    <table className="w-full min-w-[1900px] text-center border-collapse border border-slate-200">
                      <thead className="bg-slate-50 text-[13px] text-slate-700 font-semibold">
                        <tr>
                          {selectedHeaders.includes('序号') && <th className="border border-slate-200 py-3 px-4 w-16 bg-slate-100 text-slate-700 whitespace-nowrap" rowSpan={2}>序号</th>}
                          {selectedHeaders.includes('项目编码') && <th className="border border-slate-200 py-3 px-4 bg-slate-100 text-slate-700" rowSpan={2}>项目编码</th>}
                          {selectedHeaders.includes('名称') && <th className="border border-slate-200 py-3 px-4 bg-slate-100 text-slate-700 whitespace-nowrap" rowSpan={2}>名称</th>}
                          {selectedHeaders.includes('项目特征') && <th className="border border-slate-200 py-3 px-4 bg-slate-100 text-slate-700" rowSpan={2}>项目特征</th>}
                          {selectedHeaders.includes('单位') && <th className="border border-slate-200 py-3 px-4 w-16 bg-slate-100 text-slate-700 whitespace-nowrap" rowSpan={2}>单位</th>}
                          {selectedHeaders.includes('工程量') && <th className="border border-slate-200 py-3 px-4 w-24 bg-slate-100 text-slate-700 whitespace-nowrap" rowSpan={2}>工程量</th>}
                          {selectedHeaders.includes('单价') && <th className="border border-slate-200 py-3 px-4 w-24 bg-slate-100 text-slate-700" rowSpan={2}>单价</th>}
                          {selectedHeaders.includes('合价') && <th className="border border-slate-200 py-3 px-4 w-24 bg-slate-100 text-slate-700" rowSpan={2}>合价</th>}
                          {selectedHeaders.includes('综合单价') && <th className="border border-slate-200 py-3 px-4 w-24 bg-slate-100 text-slate-700" rowSpan={2}>综合单价</th>}
                          {selectedHeaders.includes('暂估价') && <th className="border border-slate-200 py-3 px-4 w-24 bg-slate-100 text-slate-700" rowSpan={2}>暂估价</th>}
                          {selectedHeaders.includes('备注') && <th className="border border-slate-200 py-3 px-4 bg-slate-100 text-slate-700" rowSpan={2}>备注</th>}
                          <th className="border border-slate-200 py-2 px-4 bg-blue-50 text-blue-700" colSpan={3}>标底</th>
                          {sortedBidderKeys.map(bidder => (
                            <th 
                              key={bidder} 
                              className="border border-slate-200 py-2 px-4 bg-slate-50 text-slate-700 cursor-grab active:cursor-grabbing hover:bg-slate-100 transition-colors group relative" 
                              colSpan={4}
                              draggable
                              onDragStart={(e) => handleDragStart(e, bidder)}
                              onDragOver={handleDragOver}
                              onDrop={(e) => handleDrop(e, bidder)}
                            >
                              <div className="flex items-center justify-center space-x-2">
                                {renderBidderLabel(bidder)}
                                <Icon name="GripVertical" size={14} className="text-slate-300 opacity-0 group-hover:opacity-100 transition-opacity absolute right-2" />
                              </div>
                            </th>
                          ))}
                          {appliedBenchmarkSettings.type === 'benchmark' && <th className="border border-slate-200 py-2 px-4 bg-slate-50 text-slate-700" colSpan={3}>评标基准价</th>}
                          {appliedBenchmarkSettings.type === 'average' && <th className="border border-slate-200 py-2 px-4 bg-slate-50 text-slate-700" colSpan={3}>评标平均价</th>}
                        </tr>
                        <tr className="bg-slate-50 text-[12px] text-slate-600">
                          <th className="border border-slate-200 py-2 px-4 font-normal bg-blue-50/50 whitespace-nowrap">工程量</th>
                          <th className="border border-slate-200 py-2 px-4 font-normal bg-blue-50/50">单价</th>
                          <th className="border border-slate-200 py-2 px-4 font-normal bg-blue-50/50">合价</th>
                          {sortedBidderKeys.map(bidder => (
                            <React.Fragment key={bidder}>
                              <th className="border border-slate-200 py-2 px-4 font-normal whitespace-nowrap">工程量</th>
                              <th className="border border-slate-200 py-2 px-4 font-normal">单价</th>
                              <th className="border border-slate-200 py-2 px-4 font-normal">合价</th>
                              <th className="border border-slate-200 py-2 px-4 font-normal">偏差百分比</th>
                            </React.Fragment>
                          ))}
                          {appliedBenchmarkSettings.type !== 'none' && (
                            <>
                              <th className="border border-slate-200 py-2 px-4 font-normal whitespace-nowrap">工程量</th>
                              <th className="border border-slate-200 py-2 px-4 font-normal">单价</th>
                              <th className="border border-slate-200 py-2 px-4 font-normal">合价</th>
                            </>
                          )}
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-200 text-sm text-slate-600 bg-white">
                        {MOCK_COMPARE_DATA.filter(item => 
                          item.code.includes(compareSearchKeyword) || 
                          item.name.includes(compareSearchKeyword) || 
                          item.feature.includes(compareSearchKeyword)
                        ).map((item, index) => (
                          <tr 
                            key={item.id} 
                            id={`compare-row-${item.id}`}
                            className={`transition-colors ${highlightedRowId === item.id ? 'bg-amber-50/70 hover:bg-amber-100/70' : 'bg-white hover:bg-blue-50/30'}`}
                          >
                            {selectedHeaders.includes('序号') && <td className="border border-slate-200 py-3 px-4 whitespace-nowrap">{index + 1}</td>}
                            {selectedHeaders.includes('项目编码') && <td className="border border-slate-200 py-3 px-4 font-mono">{item.code}</td>}
                            {selectedHeaders.includes('名称') && <td className="border border-slate-200 py-3 px-4 text-left whitespace-nowrap">{item.name}</td>}
                            {selectedHeaders.includes('项目特征') && <td className="border border-slate-200 py-3 px-4 text-left whitespace-nowrap">{item.feature}</td>}
                            {selectedHeaders.includes('单位') && <td className="border border-slate-200 py-3 px-4 whitespace-nowrap">{item.unit}</td>}
                            {selectedHeaders.includes('工程量') && <td className="border border-slate-200 py-3 px-4 font-mono text-right whitespace-nowrap">{item.quantity}</td>}
                            {selectedHeaders.includes('单价') && <td className="border border-slate-200 py-3 px-4 font-mono text-right">-</td>}
                            {selectedHeaders.includes('合价') && <td className="border border-slate-200 py-3 px-4 font-mono text-right">-</td>}
                            {selectedHeaders.includes('综合单价') && <td className="border border-slate-200 py-3 px-4 font-mono text-right">-</td>}
                            {selectedHeaders.includes('暂估价') && <td className="border border-slate-200 py-3 px-4 font-mono text-right">-</td>}
                            {selectedHeaders.includes('备注') && <td className="border border-slate-200 py-3 px-4 text-left">-</td>}
                            <td className="border border-slate-200 py-3 px-4 bg-slate-50/60 font-mono text-right">{item.quantity}</td>
                            <td className="border border-slate-200 py-3 px-4 font-mono text-right">
                              <button
                                type="button"
                                onClick={(e) => openCompareDrawer('price', item, '标底', item.controlPrice, e)}
                                className="w-full text-right hover:underline text-blue-600"
                              >
                                {item.controlPrice.toFixed(2)}
                              </button>
                            </td>
                            <td className="border border-slate-200 py-3 px-4 font-mono text-right">{(item.quantity * item.controlPrice).toFixed(2)}</td>
                            {sortedBidderKeys.map((bidder) => {
                              const price = item.bidders[bidder as keyof typeof item.bidders] as number;
                              const diffPercent = ((price - item.controlPrice) / item.controlPrice) * 100;
                              const diffClass = diffPercent >= 0 ? 'text-red-500' : 'text-green-500';
                              return (
                                <React.Fragment key={bidder}>
                                  <td className="border border-slate-200 py-3 px-4 bg-blue-50/30 font-mono text-right">{item.quantity}</td>
                                  <td className="border border-slate-200 py-3 px-4 font-mono text-right">
                                    <button
                                      type="button"
                                      onClick={(e) => openCompareDrawer('price', item, bidder, price, e)}
                                      className="w-full text-right hover:underline text-blue-600"
                                    >
                                      {price.toFixed(2)}
                                    </button>
                                  </td>
                                  <td className="border border-slate-200 py-3 px-4 font-mono text-right">{(item.quantity * price).toFixed(2)}</td>
                                  <td className={`border border-slate-200 py-3 px-4 font-mono text-right ${diffClass}`}>
                                    <button
                                      type="button"
                                      onClick={(e) => openCompareDrawer('deviation', item, bidder, price, e)}
                                      className="w-full text-right hover:underline"
                                    >
                                      {diffPercent >= 0 ? '+' : ''}{diffPercent.toFixed(1)}%
                                    </button>
                                  </td>
                                </React.Fragment>
                              );
                            })}
                            {appliedBenchmarkSettings.type !== 'none' && (() => {
                              const benchmarkCalculatedPrice = getCalculatedBenchmarkPrice(item.bidders as Record<string, number>);
                              return (
                                <>
                                  <td className="border border-slate-200 py-3 px-4 bg-blue-50/30 font-mono text-right">{item.quantity}</td>
                                  <td className="border border-slate-200 py-3 px-4 font-mono text-right">
                                    <button
                                      type="button"
                                      onClick={(e) => openCompareDrawer('price', item, appliedBenchmarkSettings.type === 'average' ? '评标平均价' : '评标基准价', benchmarkCalculatedPrice, e)}
                                      className="w-full text-right hover:underline text-blue-600"
                                    >
                                      {benchmarkCalculatedPrice.toFixed(2)}
                                    </button>
                                  </td>
                                  <td className="border border-slate-200 py-3 px-4 font-mono text-right">
                                    {(item.quantity * benchmarkCalculatedPrice).toFixed(2)}
                                  </td>
                                </>
                              );
                            })()}
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              )}
              {activeTab === 'unitCompare' && (
                <div className="space-y-4">
                  {/* 对比表格 */}
                  <div className="overflow-x-auto">
                    <table className="w-full text-center border-collapse border border-slate-200 min-w-[1200px]">
                      <thead className="bg-slate-50 text-[13px] text-slate-700 font-semibold">
                        <tr>
                          <th className="border border-slate-200 py-3 px-2 w-16" rowSpan={2}>序号</th>
                          <th className="border border-slate-200 py-3 px-4 min-w-[200px]" rowSpan={2}>项目名称</th>
                          <th className="border border-slate-200 py-3 px-4 w-32" rowSpan={2}>建筑面积<br/>(m2)</th>
                          <th className="border border-slate-200 py-2 px-4 bg-blue-50 text-blue-700" colSpan={2}>标底</th>
                          {sortedBidderKeys.map(bidder => (
                            <th 
                              key={bidder} 
                              className="border border-slate-200 py-2 px-4 cursor-grab active:cursor-grabbing hover:bg-slate-100 transition-colors group relative" 
                              colSpan={2}
                              draggable
                              onDragStart={(e) => handleDragStart(e, bidder)}
                              onDragOver={handleDragOver}
                              onDrop={(e) => handleDrop(e, bidder)}
                            >
                              <div className="flex items-center justify-center space-x-2">
                                {renderBidderLabel(bidder)}
                                <Icon name="GripVertical" size={14} className="text-slate-300 opacity-0 group-hover:opacity-100 transition-opacity absolute right-2" />
                              </div>
                            </th>
                          ))}
                        </tr>
                        <tr className="bg-slate-50 text-[12px] text-slate-600 font-medium">
                          <th className="border border-slate-200 py-2 px-4 font-normal bg-blue-50/50">不含税金额<br/>(元)</th>
                          <th className="border border-slate-200 py-2 px-4 font-normal text-blue-700 bg-blue-50/50">单方<br/>(元/㎡)</th>
                          {sortedBidderKeys.map(bidder => (
                            <React.Fragment key={bidder}>
                              <th className="border border-slate-200 py-2 px-4 font-normal bg-emerald-50/50">不含税金额<br/>(元)</th>
                              <th className="border border-slate-200 py-2 px-4 font-normal text-emerald-600 bg-emerald-50/50">单方<br/>(元/㎡)</th>
                            </React.Fragment>
                          ))}
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-200 text-sm text-slate-600 bg-white">
                        {unitCompareData.map((item) => (
                          <tr key={item.id} className={`hover:bg-blue-50/30 transition-colors ${item.level === 0 ? 'bg-slate-50/50 font-medium text-slate-800' : ''}`}>
                            <td className="border border-slate-200 py-2 px-2">{item.index}</td>
                            <td className={`border border-slate-200 py-2 px-4 text-left ${item.level > 0 ? 'pl-8' : ''}`}>{item.name}</td>
                            <td className="border border-slate-200 py-1 px-2">
                              {item.index === '四' ? (
                                <span className="text-slate-400">-</span>
                              ) : (
                                <input 
                                  type="number" 
                                  value={item.area || ''} 
                                  onChange={(e) => handleUnitCompareAreaChange(item.id, e.target.value)}
                                  className="w-full h-8 px-2 text-center border border-transparent hover:border-slate-300 focus:border-blue-500 focus:ring-1 focus:ring-blue-500 rounded bg-transparent focus:bg-white outline-none transition-all font-mono text-blue-600 font-medium"
                                  placeholder="输入面积"
                                />
                              )}
                            </td>
                            <td className="border border-slate-200 py-2 px-4 font-mono text-right">{item.standard.toFixed(2)}</td>
                            <td className="border border-slate-200 py-2 px-4 font-mono text-right text-blue-600 font-medium bg-blue-50/30">
                              {item.index === '四' 
                                ? getCalculatedTotalUnitCost(true)
                                : (item.area > 0 ? (item.standard / item.area).toFixed(2) : '-')}
                            </td>
                            {sortedBidderKeys.map(bidder => {
                              const amount = item.bidders[bidder as keyof typeof item.bidders] as number;
                              return (
                                <React.Fragment key={bidder}>
                                  <td className="border border-slate-200 py-2 px-4 font-mono text-right">{amount.toFixed(2)}</td>
                                  <td className="border border-slate-200 py-2 px-4 font-mono text-right text-emerald-600 font-medium bg-emerald-50/30">
                                    {item.index === '四'
                                      ? getCalculatedTotalUnitCost(false, bidder)
                                      : (item.area > 0 ? (amount / item.area).toFixed(2) : '-')}
                                  </td>
                                </React.Fragment>
                              );
                            })}
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              )}
              {activeTab !== 'summary' && activeTab !== 'compliance' && activeTab !== 'unbalanced' && activeTab !== 'compare' && activeTab !== 'unitCompare' && activeTab !== 'arithmetic' && activeTab !== 'collusion' && activeTab !== 'summaryCompare' && (
                <div className="py-12 text-center text-slate-500 text-sm border border-slate-200 rounded">
                  {TABS.find(t => t.id === activeTab)?.label} 详细数据加载中...
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* 抽屉：问题明细 */}
      {problemDetailDrawer.visible && (
        <div id="bottom-drawer" className="absolute inset-x-0 bottom-0 z-[190] bg-white rounded-t-2xl shadow-[0_-8px_30px_rgba(0,0,0,0.12)] border-t border-slate-200 h-[60vh] flex flex-col animate-in slide-in-from-bottom-full duration-300">
          <div className="flex items-center justify-between px-6 py-4 border-b border-slate-200 shrink-0">
            <div className="flex items-center space-x-3 min-w-0">
              {problemDetailDrawer.view === 'breakdown' && (
                <button 
                  onClick={() => setProblemDetailDrawer(prev => ({ ...prev, view: 'list', selectedItem: undefined }))}
                  className="text-slate-400 hover:text-slate-600 transition-colors p-1"
                >
                  <Icon name="ArrowLeft" size={18} />
                </button>
              )}
              <div className="min-w-0">
                <h3 className="text-base font-bold text-slate-800">
                  {problemDetailDrawer.view === 'breakdown' ? '单价明细对比' : `${problemDetailDrawer.title}明细`}
                </h3>
                <p className="text-xs text-slate-500 mt-1 truncate">
                  {problemDetailDrawer.view === 'breakdown'
                    ? `${problemDetailDrawer.selectedItem?.code} ${problemDetailDrawer.selectedItem?.name}`
                    : problemDetailDrawer.type === 'samePrice' 
                      ? `涉及单位：${problemDetailDrawer.samePriceBidders?.join('、')}`
                      : `投标单位：${problemDetailDrawer.bidder}`
                  }
                </p>
              </div>
            </div>
            <button onClick={closeProblemDetailDrawer} className="text-slate-400 hover:text-slate-600 transition-colors">
              <Icon name="X" size={18} />
            </button>
          </div>
          <div className="p-6 overflow-auto flex-1 bg-slate-50/50">
            {problemDetailDrawer.view === 'breakdown' ? (
              problemDetailDrawer.type === 'unbalanced' ? (() => {
                const item = problemDetailDrawer.selectedItem;
                if (!item) return null;

                const controlPrice = Number(item.controlPrice ?? 0);
                const bidders = (item.bidders ?? {}) as Record<string, number>;
                let basePrice = controlPrice;
                if (Object.keys(bidders).length > 0) {
                  const prices = Object.values(bidders) as number[];
                  if (prices.length > 0) {
                    if (unbalancedSettings.quoteType === 'bidAvg') {
                      basePrice = prices.reduce((a, b) => a + b, 0) / prices.length;
                    } else if (unbalancedSettings.quoteType === 'bidLowest') {
                      basePrice = Math.min(...prices);
                    } else if (unbalancedSettings.quoteType === 'bidHighestLowestAvg') {
                      if (prices.length > 2) {
                        const sorted = [...prices].sort((a, b) => a - b);
                        const trimmed = sorted.slice(1, -1);
                        basePrice = trimmed.reduce((a, b) => a + b, 0) / trimmed.length;
                      } else {
                        basePrice = prices.reduce((a, b) => a + b, 0) / prices.length;
                      }
                    }
                  }
                }

                // 获取当前投标单位单价
                const bidderPrice = bidders[problemDetailDrawer.bidder || ''] ?? controlPrice;
                
                const basePriceName = unbalancedSettings.quoteType === 'controlPrice' ? '控制价' : 
                                      unbalancedSettings.quoteType === 'bidAvg' ? '投标均价' : 
                                      unbalancedSettings.quoteType === 'bidLowest' ? '投标最低价' : '去极值均价';

                return (
                  <table className="w-full text-center border-collapse border border-slate-200 bg-white">
                    <thead className="bg-slate-50 text-[13px] text-slate-700 font-semibold sticky top-0 shadow-sm z-10">
                      <tr>
                        <th className="border border-slate-200 py-3 px-3 whitespace-nowrap">费用构成</th>
                        <th className="border border-slate-200 py-3 px-3 whitespace-nowrap">{basePriceName}</th>
                        <th className="border border-slate-200 py-3 px-3 whitespace-nowrap">{problemDetailDrawer.bidder || '投标人'}</th>
                        <th className="border border-slate-200 py-3 px-3 whitespace-nowrap text-slate-700">差额</th>
                        <th className="border border-slate-200 py-3 px-3 whitespace-nowrap text-slate-700">偏差百分比</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100 text-sm">
                      {priceBreakdownRows.map((row, idx) => {
                        const basePriceRow = basePrice * row.ratio;
                        const bidderPriceRow = bidderPrice * row.ratio;
                        const diffRow = bidderPriceRow - basePriceRow;
                        const diffPercentRow = basePriceRow > 0 ? (diffRow / basePriceRow) * 100 : 0;
                        return (
                          <tr key={idx} className="hover:bg-blue-50/30 transition-colors bg-white">
                            <td className="border border-slate-200 py-2 px-3 font-medium text-slate-700 whitespace-nowrap">{row.label}</td>
                            <td className="border border-slate-200 py-2 px-3">
                              <div className="flex items-center justify-end space-x-2">
                                <span className="font-mono">{basePriceRow.toFixed(2)}</span>
                                <span className="inline-flex items-center px-1.5 py-0.5 rounded text-[10px] font-medium bg-slate-100 text-slate-500 w-10 justify-center">
                                  {(row.ratio * 100).toFixed(0)}%
                                </span>
                              </div>
                            </td>
                            <td className="border border-slate-200 py-2 px-3">
                              <div className="flex items-center justify-end space-x-2">
                                <span className="font-mono">{bidderPriceRow.toFixed(2)}</span>
                                <span className="inline-flex items-center px-1.5 py-0.5 rounded text-[10px] font-medium bg-slate-100 text-slate-500 w-10 justify-center">
                                  {(row.ratio * 100).toFixed(0)}%
                                </span>
                              </div>
                            </td>
                            <td className="border border-slate-200 py-2 px-3 text-right">
                              <span className={`font-mono ${diffRow > 0 ? 'text-red-500' : diffRow < 0 ? 'text-green-500' : 'text-slate-600'}`}>
                                {diffRow > 0 ? '+' : ''}{diffRow.toFixed(2)}
                              </span>
                            </td>
                            <td className="border border-slate-200 py-2 px-3 text-right">
                              <span className={`font-mono ${diffPercentRow > 0 ? 'text-red-500' : diffPercentRow < 0 ? 'text-green-500' : 'text-slate-600'}`}>
                                {diffPercentRow > 0 ? '+' : ''}{diffPercentRow.toFixed(2)}%
                              </span>
                            </td>
                          </tr>
                        );
                      })}
                      <tr className="bg-slate-50 font-medium text-slate-800">
                        <td className="border border-slate-200 py-3 px-3 whitespace-nowrap text-center">综合单价</td>
                        <td className="border border-slate-200 py-3 px-3 text-right font-mono pr-14">{basePrice.toFixed(2)}</td>
                        <td className="border border-slate-200 py-3 px-3 text-right font-mono pr-14">{bidderPrice.toFixed(2)}</td>
                        <td className="border border-slate-200 py-3 px-3 text-right font-mono">
                          {(() => {
                            const diff = bidderPrice - basePrice;
                            return (
                              <span className={diff > 0 ? 'text-red-500' : diff < 0 ? 'text-green-500' : 'text-slate-600'}>
                                {diff > 0 ? '+' : ''}{diff.toFixed(2)}
                              </span>
                            );
                          })()}
                        </td>
                        <td className="border border-slate-200 py-3 px-3 text-right font-mono">
                          {(() => {
                            const diffPercent = basePrice > 0 ? ((bidderPrice - basePrice) / basePrice) * 100 : 0;
                            return (
                              <span className={diffPercent > 0 ? 'text-red-500' : diffPercent < 0 ? 'text-green-500' : 'text-slate-600'}>
                                {diffPercent > 0 ? '+' : ''}{diffPercent.toFixed(2)}%
                              </span>
                            );
                          })()}
                        </td>
                      </tr>
                    </tbody>
                  </table>
                );
              })() : (
              <table className="w-full text-center border-collapse border border-slate-200 bg-white">
                <thead className="bg-slate-50 text-[13px] text-slate-700 font-semibold sticky top-0 shadow-sm z-10">
                  <tr>
                    <th className="border border-slate-200 py-3 px-3 w-16">序号</th>
                    <th className="border border-slate-200 py-3 px-3 w-32">费用名称</th>
                    {problemDetailDrawer.samePriceBidders?.map(bidder => (
                      <th key={bidder} className="border border-slate-200 py-3 px-3 w-48 text-right pr-14">{bidder}</th>
                    ))}
                    {/* 单价明细对比新增差额列表头 */}
                    {problemDetailDrawer.samePriceBidders && problemDetailDrawer.samePriceBidders.length === 2 && (
                      <th className="border border-slate-200 py-3 px-3 w-32 text-right pr-14">差额</th>
                    )}
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 text-sm">
                  {priceBreakdownRows.map((row, idx) => (
                    <tr key={idx} className="hover:bg-blue-50/30 transition-colors bg-white">
                      <td className="border border-slate-200 py-2 px-3 text-slate-600">{idx + 1}</td>
                      <td className="border border-slate-200 py-2 px-3 text-slate-600">{row.label}</td>
                      {problemDetailDrawer.samePriceBidders?.map(bidder => {
                        const actualBidderPrice = problemDetailDrawer.selectedItem?.bidders?.[bidder] || 0;
                        return (
                          <td key={bidder} className="border border-slate-200 py-2 px-3">
                            <div className="flex items-center justify-end space-x-2">
                              <span className="font-mono">{(actualBidderPrice * row.ratio).toFixed(2)}</span>
                              <span className="inline-flex items-center px-1.5 py-0.5 rounded text-[10px] font-medium bg-slate-100 text-slate-500 w-10 justify-center">
                                {(row.ratio * 100).toFixed(0)}%
                              </span>
                            </div>
                          </td>
                        );
                      })}
                      {/* 单价明细对比新增差额列内容 */}
                      {problemDetailDrawer.samePriceBidders && problemDetailDrawer.samePriceBidders.length === 2 && (
                        <td className="border border-slate-200 py-2 px-3">
                          <div className="flex items-center justify-end space-x-2">
                            {(() => {
                              const b1 = problemDetailDrawer.samePriceBidders[0];
                              const b2 = problemDetailDrawer.samePriceBidders[1];
                              const p1 = problemDetailDrawer.selectedItem?.bidders?.[b1] || 0;
                              const p2 = problemDetailDrawer.selectedItem?.bidders?.[b2] || 0;
                              const diff = (p1 * row.ratio) - (p2 * row.ratio);
                              return (
                                <span className={`font-mono ${diff > 0 ? 'text-red-500' : diff < 0 ? 'text-green-500' : 'text-slate-600'}`}>
                                  {diff > 0 ? '+' : ''}{diff.toFixed(2)}
                                </span>
                              );
                            })()}
                          </div>
                        </td>
                      )}
                    </tr>
                  ))}
                  <tr className="bg-slate-50 font-medium text-slate-800">
                    <td className="border border-slate-200 py-3 px-3 whitespace-nowrap text-center">-</td>
                    <td className="border border-slate-200 py-3 px-3 whitespace-nowrap">综合单价</td>
                    {problemDetailDrawer.samePriceBidders?.map(bidder => {
                       const finalPrice = problemDetailDrawer.selectedItem?.bidders?.[bidder] || 0;
                       return (
                         <td key={bidder} className="border border-slate-200 py-3 px-3 text-right font-mono pr-14">
                           {finalPrice.toFixed(2)}
                         </td>
                       )
                    })}
                    {/* 单价明细对比新增差额列汇总 */}
                    {problemDetailDrawer.samePriceBidders && problemDetailDrawer.samePriceBidders.length === 2 && (
                      <td className="border border-slate-200 py-3 px-3 text-right font-mono pr-14">
                        {(() => {
                          const b1 = problemDetailDrawer.samePriceBidders[0];
                          const b2 = problemDetailDrawer.samePriceBidders[1];
                          const p1 = problemDetailDrawer.selectedItem?.bidders?.[b1] || 0;
                          const p2 = problemDetailDrawer.selectedItem?.bidders?.[b2] || 0;
                          const diff = p1 - p2;
                          return (
                            <span className={diff > 0 ? 'text-red-500' : diff < 0 ? 'text-green-500' : 'text-slate-600'}>
                              {diff > 0 ? '+' : ''}{diff.toFixed(2)}
                            </span>
                          );
                        })()}
                      </td>
                    )}
                  </tr>
                </tbody>
              </table>
            )) : problemDetailDrawer.type === 'samePrice' || problemDetailDrawer.type === 'unbalanced' ? (
              <table className="w-full text-center border-collapse border border-slate-200 bg-white">
                <thead className="bg-slate-50 text-[13px] text-slate-700 font-semibold sticky top-0 shadow-sm z-10">
                  <tr>
                    {selectedHeaders.includes('序号') && <th className="border border-slate-200 py-3 px-4 w-16 bg-slate-100 text-slate-700" rowSpan={2}>序号</th>}
                    {selectedHeaders.includes('项目编码') && <th className="border border-slate-200 py-3 px-4 w-32 bg-slate-100 text-slate-700" rowSpan={2}>项目编码</th>}
                    {selectedHeaders.includes('名称') && <th className="border border-slate-200 py-3 px-4 text-left w-48 bg-slate-100 text-slate-700" rowSpan={2}>名称</th>}
                    {selectedHeaders.includes('项目特征') && <th className="border border-slate-200 py-3 px-4 text-left min-w-[200px] bg-slate-100 text-slate-700" rowSpan={2}>项目特征</th>}
                    {selectedHeaders.includes('单位') && <th className="border border-slate-200 py-3 px-4 w-16 bg-slate-100 text-slate-700" rowSpan={2}>单位</th>}
                    {selectedHeaders.includes('工程量') && <th className="border border-slate-200 py-3 px-4 w-24 bg-slate-100 text-slate-700" rowSpan={2}>工程量</th>}
                    {selectedHeaders.includes('单价') && <th className="border border-slate-200 py-3 px-4 w-24 bg-slate-100 text-slate-700" rowSpan={2}>单价</th>}
                    {selectedHeaders.includes('合价') && <th className="border border-slate-200 py-3 px-4 w-24 bg-slate-100 text-slate-700" rowSpan={2}>合价</th>}
                    {selectedHeaders.includes('综合单价') && <th className="border border-slate-200 py-3 px-4 w-24 bg-slate-100 text-slate-700" rowSpan={2}>综合单价</th>}
                    {selectedHeaders.includes('暂估价') && <th className="border border-slate-200 py-3 px-4 w-24 bg-slate-100 text-slate-700" rowSpan={2}>暂估价</th>}
                    {selectedHeaders.includes('备注') && <th className="border border-slate-200 py-3 px-4 bg-slate-100 text-slate-700" rowSpan={2}>备注</th>}
                    
                    {/* 单价相同相似检查隐藏标底列，其他检查展示 */}
                    {problemDetailDrawer.type !== 'samePrice' && (
                      <th className="border border-slate-200 py-2 px-4 w-24 bg-slate-50 text-slate-700">
                        {problemDetailDrawer.type === 'unbalanced' 
                          ? (unbalancedSettings.quoteType === 'controlPrice' ? '控制价' : 
                             unbalancedSettings.quoteType === 'bidAvg' ? '投标均价' : 
                             unbalancedSettings.quoteType === 'bidLowest' ? '投标最低价' : '去极值均价')
                          : '标底'}
                      </th>
                    )}
                    
                    {problemDetailDrawer.type === 'samePrice' && problemDetailDrawer.samePriceBidders?.map(bidder => (
                      <th key={bidder} className="border border-slate-200 py-2 px-4 w-32 bg-slate-50 text-slate-700">{renderBidderLabel(bidder)}</th>
                    ))}

                    {/* 单价相同相似检查，新增一列差额列（当仅有两家单位对比时） */}
                    {problemDetailDrawer.type === 'samePrice' && problemDetailDrawer.samePriceBidders && problemDetailDrawer.samePriceBidders.length === 2 && (
                       <>
                         <th className="border border-slate-200 py-2 px-4 w-24 bg-slate-50 text-slate-700" rowSpan={2}>差额</th>
                         <th className="border border-slate-200 py-2 px-4 w-24 bg-slate-50 text-slate-700" rowSpan={2}>偏差百分比</th>
                       </>
                    )}
                    
                    {problemDetailDrawer.type === 'unbalanced' && (
                      <th className="border border-slate-200 py-2 px-4 w-32 bg-slate-50 text-slate-700">{problemDetailDrawer.bidder}</th>
                    )}
                    
                    {/* 不平衡报价检查偏差列 */}
                    {problemDetailDrawer.type === 'unbalanced' && (
                      <th className="border border-slate-200 py-2 px-4 w-24 bg-slate-50 text-slate-700 whitespace-nowrap" rowSpan={2}>差额</th>
                    )}
                    {problemDetailDrawer.type === 'unbalanced' && (
                      <th className="border border-slate-200 py-2 px-4 w-24 bg-slate-50 text-slate-700 whitespace-nowrap" rowSpan={2}>偏差百分比</th>
                    )}
                  </tr>
                  <tr className="bg-slate-50 text-[12px] text-slate-600">
                    {/* 单价相同相似检查隐藏标底列，其他检查展示 */}
                    {problemDetailDrawer.type !== 'samePrice' && (
                      <th className="border border-slate-200 py-2 px-4 font-normal whitespace-nowrap">单价</th>
                    )}
                    
                    {problemDetailDrawer.type === 'samePrice' && problemDetailDrawer.samePriceBidders?.map(bidder => (
                      <th key={bidder} className="border border-slate-200 py-2 px-4 font-normal whitespace-nowrap">单价</th>
                    ))}
                    
                    {problemDetailDrawer.type === 'unbalanced' && (
                      <th className="border border-slate-200 py-2 px-4 font-normal whitespace-nowrap">单价</th>
                    )}
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 text-sm">
                  {MOCK_COMPARE_DATA.map((item, idx) => {
                    // 为了演示规律性错误，如果是这个检查，强行让价格差额等于10
                    let displayItem = { ...item };
                    if (problemDetailDrawer.isRegularError && problemDetailDrawer.samePriceBidders && problemDetailDrawer.samePriceBidders.length === 2) {
                       const b1 = problemDetailDrawer.samePriceBidders[0];
                       const b2 = problemDetailDrawer.samePriceBidders[1];
                       // 基于该项的标底价，模拟其中一家相差10元
                       const basePrice = item.controlPrice || 20; 
                       displayItem = {
                         ...item,
                         bidders: {
                           ...item.bidders,
                           [b1]: basePrice + 10,
                           [b2]: basePrice
                         }
                       }
                    }

                    // 计算基准价（根据不平衡报价参数设置）
                    let basePrice = displayItem.controlPrice;
                    if (problemDetailDrawer.type === 'unbalanced' && displayItem.bidders) {
                      const prices = Object.values(displayItem.bidders);
                      if (prices.length > 0) {
                        if (unbalancedSettings.quoteType === 'bidAvg') {
                          basePrice = prices.reduce((a, b) => a + b, 0) / prices.length;
                        } else if (unbalancedSettings.quoteType === 'bidLowest') {
                          basePrice = Math.min(...prices);
                        } else if (unbalancedSettings.quoteType === 'bidHighestLowestAvg') {
                          if (prices.length > 2) {
                            const sorted = [...prices].sort((a, b) => a - b);
                            const trimmed = sorted.slice(1, -1);
                            basePrice = trimmed.reduce((a, b) => a + b, 0) / trimmed.length;
                          } else {
                            basePrice = prices.reduce((a, b) => a + b, 0) / prices.length;
                          }
                        }
                      }
                    }

                    // 不平衡报价时获取对应投标单位的单价和偏差
                    const unbalancedBidderPrice = problemDetailDrawer.type === 'unbalanced' 
                      ? ((displayItem.bidders as Record<string, number>)[problemDetailDrawer.bidder] || displayItem.controlPrice * (1 + (Math.random() * 0.4 - 0.2))) // 随机模拟一个偏差
                      : 0;
                    const unbalancedDiffPercent = ((unbalancedBidderPrice - basePrice) / basePrice) * 100;
                    const floatRange = parseFloat(unbalancedSettings.floatRange) || 15;
                    const isExceeding = Math.abs(unbalancedDiffPercent) > floatRange;
                    const diffClass = unbalancedDiffPercent >= 0 ? 'text-red-500' : 'text-green-500';

                    return (
                    <tr key={idx} className={`hover:bg-blue-50/30 transition-colors ${problemDetailDrawer.type === 'unbalanced' && isExceeding ? 'bg-red-50/20' : ''}`}>
                      {selectedHeaders.includes('序号') && <td className="border border-slate-200 py-3 px-4 text-slate-500">1-{idx + 1}</td>}
                      {selectedHeaders.includes('项目编码') && <td className="border border-slate-200 py-3 px-4 text-slate-500 font-mono">{displayItem.code}</td>}
                      {selectedHeaders.includes('名称') && <td className="border border-slate-200 py-3 px-4 text-left font-medium text-slate-800">{displayItem.name}</td>}
                      {selectedHeaders.includes('项目特征') && <td className="border border-slate-200 py-3 px-4 text-left text-slate-600 text-xs leading-relaxed">{displayItem.feature}</td>}
                      {selectedHeaders.includes('单位') && <td className="border border-slate-200 py-3 px-4 text-slate-600">{displayItem.unit}</td>}
                      {selectedHeaders.includes('工程量') && <td className="border border-slate-200 py-3 px-4 font-mono">{displayItem.quantity}</td>}
                      {selectedHeaders.includes('单价') && <td className="border border-slate-200 py-3 px-4 font-mono text-right">-</td>}
                      {selectedHeaders.includes('合价') && <td className="border border-slate-200 py-3 px-4 font-mono text-right">-</td>}
                      {selectedHeaders.includes('综合单价') && <td className="border border-slate-200 py-3 px-4 font-mono text-right">-</td>}
                      {selectedHeaders.includes('暂估价') && <td className="border border-slate-200 py-3 px-4 font-mono text-right">-</td>}
                      {selectedHeaders.includes('备注') && <td className="border border-slate-200 py-3 px-4 text-left">-</td>}
                      
                      {problemDetailDrawer.type !== 'samePrice' && (
                        <td className="border border-slate-200 py-3 px-4 font-mono text-slate-500">
                          {problemDetailDrawer.type === 'unbalanced' ? (
                            <span className="w-full block text-right">{basePrice.toFixed(2)}</span>
                          ) : (
                            <button
                              type="button"
                              onClick={(e) => {
                                setCurrentStep(3);
                                setActiveTab('compare');
                                closeProblemDetailDrawer();
                                openCompareDrawer('price', displayItem, '标底', basePrice, e, problemDetailDrawer.samePriceBidders);
                              }}
                              className="w-full text-right hover:underline text-blue-600"
                            >
                              {basePrice.toFixed(2)}
                            </button>
                          )}
                        </td>
                      )}
                      
                      {problemDetailDrawer.type === 'samePrice' && problemDetailDrawer.samePriceBidders?.map((bidder, bIdx, arr) => {
                        const price = (displayItem.bidders as Record<string, number>)[bidder] || displayItem.controlPrice;
                        return (
                          <React.Fragment key={bidder}>
                            <td className="border border-slate-200 py-3 px-4 font-mono text-red-500 font-medium">
                              <button
                                type="button"
                                onClick={(e) => {
                                  setProblemDetailDrawer(prev => ({
                                    ...prev,
                                    view: 'breakdown',
                                    selectedItem: displayItem
                                  }));
                                }}
                                className="w-full text-right hover:underline text-blue-600"
                              >
                                {price.toFixed(2)}
                              </button>
                            </td>
                          </React.Fragment>
                        );
                      })}
                      
                      {/* 单价相同相似检查：差额列及偏差百分比列 */}
                      {problemDetailDrawer.type === 'samePrice' && problemDetailDrawer.samePriceBidders && problemDetailDrawer.samePriceBidders.length === 2 && (
                         <>
                           <td className="border border-slate-200 py-3 px-4 font-mono font-medium">
                             {(() => {
                               const p1 = (displayItem.bidders as Record<string, number>)[problemDetailDrawer.samePriceBidders[0]] || 0;
                               const p2 = (displayItem.bidders as Record<string, number>)[problemDetailDrawer.samePriceBidders[1]] || 0;
                               const diff = p1 - p2;
                               return (
                                 <span className={diff > 0 ? 'text-red-500' : diff < 0 ? 'text-green-500' : 'text-slate-600'}>
                                   {diff > 0 ? '+' : ''}{diff.toFixed(2)}
                                 </span>
                               );
                             })()}
                           </td>
                           <td className="border border-slate-200 py-3 px-4 font-mono font-medium">
                             {(() => {
                               const p1 = (displayItem.bidders as Record<string, number>)[problemDetailDrawer.samePriceBidders[0]] || displayItem.controlPrice;
                               const p2 = (displayItem.bidders as Record<string, number>)[problemDetailDrawer.samePriceBidders[1]] || displayItem.controlPrice;
                               const diffPercent = (((p2 - p1) / p1) * 100);
                               const diffClass = diffPercent > 0 ? 'text-red-500' : diffPercent < 0 ? 'text-green-500' : 'text-slate-600';
                               return (
                                 <span className={`w-full text-right ${diffClass}`}>
                                   {diffPercent > 0 ? '+' : ''}{diffPercent.toFixed(2)}%
                                 </span>
                               );
                             })()}
                           </td>
                         </>
                      )}
                      
                      {problemDetailDrawer.type === 'unbalanced' && (
                        <td className="border border-slate-200 py-3 px-4 font-mono font-medium">
                          <button
                            type="button"
                            onClick={(e) => {
                              e.stopPropagation();
                              setProblemDetailDrawer(prev => ({
                                ...prev,
                                view: 'breakdown',
                                selectedItem: displayItem
                              }));
                            }}
                            className={`w-full text-right hover:underline text-blue-600 ${Math.abs(unbalancedDiffPercent) > floatRange ? 'text-red-500' : 'text-slate-700'}`}
                          >
                            {unbalancedBidderPrice.toFixed(2)}
                          </button>
                        </td>
                      )}

                      {/* 不平衡报价检查：差额列 */}
                    {problemDetailDrawer.type === 'unbalanced' && (
                      <td className="border border-slate-200 py-3 px-4 font-mono font-medium">
                        <span className={unbalancedBidderPrice - basePrice > 0 ? 'text-red-500' : unbalancedBidderPrice - basePrice < 0 ? 'text-green-500' : 'text-slate-600'}>
                          {unbalancedBidderPrice - basePrice > 0 ? '+' : ''}{(unbalancedBidderPrice - basePrice).toFixed(2)}
                        </span>
                      </td>
                    )}

                      {/* 规律性错误检查中原来的红色差额列，将其移除，因为我们已经统一添加了差额列 */}
                      
                      {problemDetailDrawer.type === 'unbalanced' && (
                        <td className={`border border-slate-200 py-3 px-4 font-mono font-medium ${diffClass} ${isExceeding ? 'bg-red-50' : ''}`}>
                          <span>
                            {unbalancedDiffPercent >= 0 ? '+' : ''}{unbalancedDiffPercent.toFixed(1)}%
                          </span>
                        </td>
                      )}
                    </tr>
                  )})}
                </tbody>
              </table>
            ) : (
              <table className="w-full text-center border-collapse border border-slate-200 bg-white">
                <thead className="bg-slate-50 text-[13px] text-slate-700 font-semibold sticky top-0 shadow-sm">
                  <tr>
                    <th className="border border-slate-200 py-3 px-4 w-16">序号</th>
                    <th className="border border-slate-200 py-3 px-4 min-w-[200px]">文件名称</th>
                    <th className="border border-slate-200 py-3 px-4 w-48">页签名称</th>
                    <th className="border border-slate-200 py-3 px-4 text-left">问题说明</th>
                    <th className="border border-slate-200 py-3 px-4 w-24">操作</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 text-sm">
                  {/* 模拟几条明细数据 */}
                  {[1, 2, 3].map((idx) => (
                    <tr key={idx} className="hover:bg-blue-50/30 transition-colors">
                      <td className="border border-slate-200 py-3 px-4 text-slate-500">{idx}</td>
                      <td className="border border-slate-200 py-3 px-4 text-slate-800">宁波住宅项目施工总承包工程.xml</td>
                      <td className="border border-slate-200 py-3 px-4 text-slate-600">
                        {idx === 1 ? '分部分项工程和单价措施项目清单与计价表' : '-'}
                      </td>
                      <td className="border border-slate-200 py-3 px-4 text-left text-slate-600">
                        <span className="text-red-500 mr-1">异常:</span>
                        项目编码 010101001001 对应数量与招标控制价不一致。
                      </td>
                      <td className="border border-slate-200 py-3 px-4">
                        <button 
                          onClick={() => {
                            const problemDescription = "项目编码 010101001001 对应数量与招标控制价不一致。";
                            const tabs = idx === 1 
                              ? ['宁波住宅项目施工总承包工程.xml', '宁波住宅项目补充文件.xml'] 
                              : ['宁波住宅项目施工总承包工程.xml'];
                            openFilePreview(problemDescription, tabs);
                          }}
                          className="text-blue-600 hover:text-blue-700 font-medium"
                        >
                          查看
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </div>
        </div>
      )}

      {/* 抽屉：单价明细 / 偏差明细 */}
      {compareDrawerData.visible && (
        <div id="compare-drawer" className="absolute inset-x-0 bottom-0 z-[200] bg-white rounded-t-2xl shadow-[0_-8px_30px_rgba(0,0,0,0.12)] border-t border-slate-200 max-h-[70vh] flex flex-col animate-in slide-in-from-bottom-full duration-300">
          <div className="flex items-center justify-between px-6 py-4 border-b border-slate-200 shrink-0">
            <div className="flex items-center space-x-3 min-w-0">
              {compareDrawerData.fromDrawer === 'unbalanced' && (
                <button 
                  onClick={closeCompareDrawer}
                  className="text-slate-400 hover:text-slate-600 transition-colors p-1"
                >
                  <Icon name="ArrowLeft" size={18} />
                </button>
              )}
              <div className="min-w-0">
                <h3 className="text-base font-bold text-slate-800">
                  {compareDrawerData.view === 'price' ? '单价明细' : '偏差明细'}
                </h3>
                <p className="text-xs text-slate-500 mt-1 flex items-center space-x-1 truncate">
                  <span>{compareDrawerData.itemCode} / {compareDrawerData.itemName} /</span>
                  {renderBidderLabel(compareDrawerData.bidder)}
                </p>
              </div>
            </div>
            <button onClick={closeCompareDrawer} className="text-slate-400 hover:text-slate-600 transition-colors">
              <Icon name="X" size={18} />
            </button>
          </div>
          
          {compareDrawerData.view === 'deviation' && (
            <div className="px-6 pt-3 border-b border-slate-200 shrink-0 bg-slate-50/50">
              <div className="flex space-x-6">
                <button
                  onClick={() => setCompareDrawerData(prev => ({ ...prev, activeTab: 'data' }))}
                  className={`pb-3 text-sm font-medium transition-colors relative ${
                    compareDrawerData.activeTab === 'data' 
                      ? 'text-blue-600' 
                      : 'text-slate-500 hover:text-slate-700'
                  }`}
                >
                  数据明细
                  {compareDrawerData.activeTab === 'data' && (
                    <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-blue-600 rounded-t-full" />
                  )}
                </button>
                <button
                  onClick={() => setCompareDrawerData(prev => ({ ...prev, activeTab: 'reason' }))}
                  className={`pb-3 text-sm font-medium transition-colors relative ${
                    compareDrawerData.activeTab === 'reason' 
                      ? 'text-blue-600' 
                      : 'text-slate-500 hover:text-slate-700'
                  }`}
                >
                  原因分析
                  {compareDrawerData.activeTab === 'reason' && (
                    <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-blue-600 rounded-t-full" />
                  )}
                </button>
              </div>
            </div>
          )}

          <div className="p-6 overflow-auto flex-1">
            {compareDrawerData.view === 'price' ? (
              compareDrawerData.fromDrawer === 'unbalanced' ? (
                <div className="space-y-4 w-full overflow-x-auto">
                  <table className="w-full text-center border-collapse border border-slate-200 min-w-[600px]">
                    <thead className="bg-slate-50 text-[13px] text-slate-700 font-semibold sticky top-0">
                      <tr>
                        <th className="border border-slate-200 py-2 px-3 whitespace-nowrap bg-slate-50">费用构成</th>
                        <th className="border border-slate-200 py-2 px-3 whitespace-nowrap bg-slate-50">{compareDrawerData.unbalancedBasePriceName || '控制价'}</th>
                        <th className="border border-slate-200 py-2 px-3 whitespace-nowrap bg-slate-50">{compareDrawerData.bidder}</th>
                        <th className="border border-slate-200 py-2 px-3 whitespace-nowrap bg-slate-50 text-slate-700">差额</th>
                        <th className="border border-slate-200 py-2 px-3 whitespace-nowrap bg-slate-50 text-slate-700">偏差百分比</th>
                      </tr>
                    </thead>
                    <tbody className="text-sm text-slate-600">
                      {priceBreakdownRows.map((row) => {
                        const basePriceRow = compareDrawerData.controlPrice * row.ratio;
                        const bidderPriceRow = compareDrawerData.bidderPrice * row.ratio;
                        const diffRow = bidderPriceRow - basePriceRow;
                        const diffPercentRow = basePriceRow > 0 ? (diffRow / basePriceRow) * 100 : 0;
                        return (
                          <tr key={row.label} className="hover:bg-slate-50/70 transition-colors">
                            <td className="border border-slate-200 py-2 px-3 font-medium text-slate-700 whitespace-nowrap">{row.label}</td>
                            <td className="border border-slate-200 py-2 px-3">
                              <div className="flex items-center justify-end space-x-2">
                                <span className="font-mono">{basePriceRow.toFixed(2)}</span>
                                <span className="inline-flex items-center px-1.5 py-0.5 rounded text-[10px] font-medium bg-slate-100 text-slate-500 w-10 justify-center">
                                  {(row.ratio * 100).toFixed(0)}%
                                </span>
                              </div>
                            </td>
                            <td className="border border-slate-200 py-2 px-3">
                              <div className="flex items-center justify-end space-x-2">
                                <span className="font-mono">{bidderPriceRow.toFixed(2)}</span>
                                <span className="inline-flex items-center px-1.5 py-0.5 rounded text-[10px] font-medium bg-slate-100 text-slate-500 w-10 justify-center">
                                  {(row.ratio * 100).toFixed(0)}%
                                </span>
                              </div>
                            </td>
                            <td className="border border-slate-200 py-2 px-3 text-right">
                              <span className={`font-mono ${diffRow > 0 ? 'text-red-500' : diffRow < 0 ? 'text-green-500' : 'text-slate-600'}`}>
                                {diffRow > 0 ? '+' : ''}{diffRow.toFixed(2)}
                              </span>
                            </td>
                            <td className="border border-slate-200 py-2 px-3 text-right">
                              <span className={`font-mono ${diffPercentRow > 0 ? 'text-red-500' : diffPercentRow < 0 ? 'text-green-500' : 'text-slate-600'}`}>
                                {diffPercentRow > 0 ? '+' : ''}{diffPercentRow.toFixed(2)}%
                              </span>
                            </td>
                          </tr>
                        );
                      })}
                      <tr className="bg-slate-50 font-medium text-slate-800">
                        <td className="border border-slate-200 py-3 px-3 whitespace-nowrap">综合单价</td>
                        <td className="border border-slate-200 py-3 px-3 text-right font-mono pr-14">{compareDrawerData.controlPrice.toFixed(2)}</td>
                        <td className="border border-slate-200 py-3 px-3 text-right font-mono pr-14">{compareDrawerData.bidderPrice.toFixed(2)}</td>
                        <td className="border border-slate-200 py-3 px-3 text-right font-mono">
                          {(() => {
                            const diff = compareDrawerData.bidderPrice - compareDrawerData.controlPrice;
                            return (
                              <span className={diff > 0 ? 'text-red-500' : diff < 0 ? 'text-green-500' : 'text-slate-600'}>
                                {diff > 0 ? '+' : ''}{diff.toFixed(2)}
                              </span>
                            );
                          })()}
                        </td>
                        <td className="border border-slate-200 py-3 px-3 text-right font-mono">
                          <span className={compareDrawerData.diffPercent > 0 ? 'text-red-500' : compareDrawerData.diffPercent < 0 ? 'text-green-500' : 'text-slate-600'}>
                            {compareDrawerData.diffPercent > 0 ? '+' : ''}{compareDrawerData.diffPercent.toFixed(2)}%
                          </span>
                        </td>
                      </tr>
                    </tbody>
                  </table>
                </div>
              ) : (
              <div className="space-y-4 w-full overflow-x-auto">
                <table className="w-full text-center border-collapse border border-slate-200 min-w-[600px]">
                  <thead className="bg-slate-50 text-[13px] text-slate-700 font-semibold sticky top-0">
                    <tr>
                      <th className="border border-slate-200 py-2 px-3 whitespace-nowrap bg-slate-50">费用构成</th>
                      <th className="border border-slate-200 py-2 px-3 whitespace-nowrap bg-slate-50">标底</th>
                      {/* 这里假设默认展示3家投标单位的数据对比，如果没有传入则默认用所有单位名 */}
                      {(compareDrawerData.samePriceBidders || compareBidderKeys.slice(0, 3)).map(bidder => (
                        <th key={bidder} className="border border-slate-200 py-2 px-3 whitespace-nowrap bg-slate-50">
                          {renderBidderLabel(bidder)}
                        </th>
                      ))}
                      {/* 如果正好是比较两家单位，新增一列差额列 */}
                      {compareDrawerData.samePriceBidders && compareDrawerData.samePriceBidders.length === 2 && (
                        <th className="border border-slate-200 py-2 px-3 whitespace-nowrap bg-slate-50 text-slate-700">差额</th>
                      )}
                    </tr>
                  </thead>
                  <tbody className="text-sm text-slate-600">
                    {priceBreakdownRows.map((row) => (
                      <tr key={row.label} className="hover:bg-slate-50/70 transition-colors">
                        <td className="border border-slate-200 py-2 px-3 font-medium text-slate-700 whitespace-nowrap">{row.label}</td>
                        <td className="border border-slate-200 py-2 px-3">
                          <div className="flex items-center justify-end space-x-2">
                            <span className="font-mono">{(compareDrawerData.controlPrice * row.ratio).toFixed(2)}</span>
                            <span className="inline-flex items-center px-1.5 py-0.5 rounded text-[10px] font-medium bg-slate-100 text-slate-500 w-10 justify-center">
                              {(row.ratio * 100).toFixed(0)}%
                            </span>
                          </div>
                        </td>
                        {(compareDrawerData.samePriceBidders || compareBidderKeys.slice(0, 3)).map(bidder => {
                          // 使用传入的biddersPrices以保证价格一致，否则使用当前bidderPrice做基础浮动
                          const actualBidderPrice = compareDrawerData.biddersPrices?.[bidder] ?? (compareDrawerData.bidderPrice * (1 + (Math.random() * 0.1 - 0.05)));
                          return (
                            <td key={bidder} className="border border-slate-200 py-2 px-3">
                              <div className="flex items-center justify-end space-x-2">
                                <span className="font-mono">{(actualBidderPrice * row.ratio).toFixed(2)}</span>
                                <span className="inline-flex items-center px-1.5 py-0.5 rounded text-[10px] font-medium bg-slate-100 text-slate-500 w-10 justify-center">
                                  {(row.ratio * 100).toFixed(0)}%
                                </span>
                              </div>
                            </td>
                          );
                        })}
                        {/* 差额列渲染数据 */}
                        {compareDrawerData.samePriceBidders && compareDrawerData.samePriceBidders.length === 2 && (
                          <td className="border border-slate-200 py-2 px-3 text-right">
                            {(() => {
                              const b1 = compareDrawerData.samePriceBidders[0];
                              const b2 = compareDrawerData.samePriceBidders[1];
                              const p1 = compareDrawerData.biddersPrices?.[b1] ?? (compareDrawerData.bidderPrice * (1 + (Math.random() * 0.1 - 0.05)));
                              const p2 = compareDrawerData.biddersPrices?.[b2] ?? (compareDrawerData.bidderPrice * (1 + (Math.random() * 0.1 - 0.05)));
                              const diff = (p1 * row.ratio) - (p2 * row.ratio);
                              return (
                                <span className={`font-mono ${diff > 0 ? 'text-red-500' : diff < 0 ? 'text-green-500' : 'text-slate-600'}`}>
                                  {diff > 0 ? '+' : ''}{diff.toFixed(2)}
                                </span>
                              );
                            })()}
                          </td>
                        )}
                      </tr>
                    ))}
                    <tr className="bg-slate-50 font-medium text-slate-800">
                      <td className="border border-slate-200 py-3 px-3 whitespace-nowrap">综合单价</td>
                      <td className="border border-slate-200 py-3 px-3 text-right font-mono pr-14">{compareDrawerData.controlPrice.toFixed(2)}</td>
                      {(compareDrawerData.samePriceBidders || compareBidderKeys.slice(0, 3)).map((bidder, idx) => {
                         const finalPrice = compareDrawerData.biddersPrices?.[bidder] ?? (idx === 0 ? compareDrawerData.bidderPrice : compareDrawerData.bidderPrice * (1 + (idx * 0.05)));
                         return (
                           <td key={bidder} className="border border-slate-200 py-3 px-3 text-right font-mono pr-14">
                             {finalPrice.toFixed(2)}
                           </td>
                         )
                      })}
                      {/* 差额列综合单价汇总 */}
                      {compareDrawerData.samePriceBidders && compareDrawerData.samePriceBidders.length === 2 && (
                         <td className="border border-slate-200 py-3 px-3 text-right font-mono">
                           {(() => {
                              const b1 = compareDrawerData.samePriceBidders[0];
                              const b2 = compareDrawerData.samePriceBidders[1];
                              const final1 = compareDrawerData.biddersPrices?.[b1] ?? compareDrawerData.bidderPrice;
                              const final2 = compareDrawerData.biddersPrices?.[b2] ?? compareDrawerData.bidderPrice;
                              const diff = final1 - final2;
                              return (
                                <span className={diff > 0 ? 'text-red-500' : diff < 0 ? 'text-green-500' : 'text-slate-600'}>
                                  {diff > 0 ? '+' : ''}{diff.toFixed(2)}
                                </span>
                              );
                           })()}
                         </td>
                      )}
                    </tr>
                  </tbody>
                </table>
              </div>
              )
            ) : (
              <div className="space-y-4 text-sm w-full overflow-x-auto">
                {compareDrawerData.activeTab === 'data' ? (
                  <div className="border border-slate-200 rounded-lg overflow-hidden">
                    <table className="w-full text-center border-collapse">
                      <thead className="bg-slate-50 text-[13px] text-slate-700 font-semibold">
                        <tr>
                          <th className="border-b border-slate-200 py-3 px-4 w-32 bg-slate-50">费用构成</th>
                          <th className="border-b border-slate-200 py-3 px-4 bg-slate-50">
                            {unbalancedSettings.quoteType === 'controlPrice' ? '控制价' : 
                             unbalancedSettings.quoteType === 'bidAvg' ? '投标均价' : 
                             unbalancedSettings.quoteType === 'bidLowest' ? '投标最低价' : '去极值均价'}
                          </th>
                          <th className="border-b border-slate-200 py-3 px-4 bg-slate-50">
                            {renderBidderLabel(compareDrawerData.bidder)}
                          </th>
                          <th className="border-b border-slate-200 py-3 px-4 bg-slate-50">差价</th>
                          <th className="border-b border-slate-200 py-3 px-4 bg-slate-50">差价百分比</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-100 text-sm">
                        {priceBreakdownRows.map((row) => {
                          const basePriceValue = compareDrawerData.controlPrice * row.ratio;
                          const bidderPriceValue = compareDrawerData.bidderPrice * row.ratio;
                          const diff = bidderPriceValue - basePriceValue;
                          const diffPercent = basePriceValue > 0 ? (diff / basePriceValue) * 100 : 0;
                          
                          return (
                            <tr key={row.label} className="hover:bg-slate-50/70 transition-colors">
                              <td className="py-3 px-4 font-medium text-slate-700">{row.label}</td>
                              <td className="py-3 px-4 font-mono text-slate-600">{basePriceValue.toFixed(2)}</td>
                              <td className="py-3 px-4 font-mono text-slate-800">{bidderPriceValue.toFixed(2)}</td>
                              <td className={`py-3 px-4 font-mono ${diff > 0 ? 'text-red-500' : diff < 0 ? 'text-green-500' : 'text-slate-600'}`}>
                                {diff > 0 ? '+' : ''}{diff.toFixed(2)}
                              </td>
                              <td className={`py-3 px-4 font-mono ${diff > 0 ? 'text-red-500' : diff < 0 ? 'text-green-500' : 'text-slate-600'}`}>
                                {diff > 0 ? '+' : ''}{diffPercent.toFixed(2)}%
                              </td>
                            </tr>
                          );
                        })}
                        <tr className="bg-slate-50 font-medium text-slate-800">
                          <td className="py-3 px-4">综合单价</td>
                          <td className="py-3 px-4 font-mono text-slate-600">{compareDrawerData.controlPrice.toFixed(2)}</td>
                          <td className="py-3 px-4 font-mono">{compareDrawerData.bidderPrice.toFixed(2)}</td>
                          <td className={`py-3 px-4 font-mono ${compareDrawerData.bidderPrice - compareDrawerData.controlPrice > 0 ? 'text-red-500' : compareDrawerData.bidderPrice - compareDrawerData.controlPrice < 0 ? 'text-green-500' : 'text-slate-600'}`}>
                            {compareDrawerData.bidderPrice - compareDrawerData.controlPrice > 0 ? '+' : ''}{(compareDrawerData.bidderPrice - compareDrawerData.controlPrice).toFixed(2)}
                          </td>
                          <td className={`py-3 px-4 font-mono ${compareDrawerData.diffPercent > 0 ? 'text-red-500' : compareDrawerData.diffPercent < 0 ? 'text-green-500' : 'text-slate-600'}`}>
                            {compareDrawerData.diffPercent > 0 ? '+' : ''}{compareDrawerData.diffPercent.toFixed(2)}%
                          </td>
                        </tr>
                      </tbody>
                    </table>
                  </div>
                ) : (
                  <div className="space-y-2 relative">
                    <div className="flex items-center justify-between mb-4">
                      <div className="font-medium text-slate-800">AI 分析结果</div>
                      {aiReasonAnalysisStatus === 'idle' || aiReasonAnalysisStatus === 'analyzing' ? (
                        <button 
                          onClick={() => handleStartAiReasonAnalysis(false)}
                          className="px-2 py-1 text-xs font-medium text-white bg-blue-600 rounded hover:bg-blue-700 transition-colors shadow-sm flex items-center space-x-1"
                        >
                          <Icon name="Sparkles" size={12} />
                          <span>AI分析</span>
                        </button>
                      ) : (
                        <button 
                          onClick={() => handleStartAiReasonAnalysis(true)}
                          className="px-2 py-1 text-xs font-medium text-blue-600 bg-blue-50 border border-blue-200 rounded hover:bg-blue-100 transition-colors shadow-sm flex items-center space-x-1"
                        >
                          <Icon name="RefreshCw" size={12} />
                          <span>重新分析</span>
                        </button>
                      )}
                    </div>
                    
                    {aiReasonAnalysisStatus === 'done' ? (
                      <div className="space-y-3 bg-slate-50/50 p-4 rounded border border-slate-100 text-slate-700 leading-relaxed text-sm">
                        <p><strong>1. 主要材料价格差异：</strong>当前投标单位在“钢筋”和“商品混凝土”等主材上的报价，相较于基准价偏低约 8%，这是导致综合单价产生负偏差的核心原因。</p>
                        <p><strong>2. 措施费与管理费策略：</strong>该单位的企业管理费率设定为 3.5%，低于基准均值（约5%），体现了其在本次投标中采取了较为激进的价格竞争策略。</p>
                        <p><strong>3. 潜在风险提示：</strong>单价大幅下浮可能存在“不平衡报价”中“前轻后重”的策略，或者后期施工过程中的材料质量降级风险。建议在清标报告中重点标记，并在讲标环节要求施工方提供主材供应商的承诺函或价格证明。</p>
                      </div>
                    ) : (
                      <div className="flex items-center justify-center py-12 bg-slate-50/50 rounded border border-slate-100 border-dashed text-slate-400">
                        <div className="flex flex-col items-center space-y-3">
                          <Icon name="Bot" size={32} className="text-slate-300" />
                          <span className="text-sm">点击上方“AI分析”按钮获取智能原因洞察</span>
                        </div>
                      </div>
                    )}
                  </div>
                )}
              </div>
            )}
          </div>
        </div>
      )}

      {/* 表头设置弹窗 */}
      {showHeaderSettingsModal && typeof document !== 'undefined' && createPortal(
        <div className="fixed inset-0 z-[200] flex items-center justify-center bg-black/40">
          <div className="bg-white rounded-lg shadow-xl w-[600px] overflow-hidden">
            <div className="flex items-center justify-between px-6 py-4 border-b border-slate-200">
              <h3 className="text-base font-bold text-slate-800">表头设置</h3>
              <button onClick={() => setShowHeaderSettingsModal(false)} className="text-slate-400 hover:text-slate-600 transition-colors">
                <Icon name="X" size={20} />
              </button>
            </div>
            
            <div className="p-6">
              <div className="text-sm text-slate-600 mb-6">请手动选择或确认原文件识别出来的前几列表头项。若存在识别错误、漏识别或多识别，可在此调整。</div>
              <div className="grid grid-cols-3 gap-4">
                {availableHeaders.map(header => (
                  <label key={header} className="flex items-center space-x-2 cursor-pointer">
                    <input 
                      type="checkbox" 
                      checked={selectedHeaders.includes(header)}
                      onChange={() => toggleHeader(header)}
                      className="w-4 h-4 text-blue-600 rounded border-slate-300 focus:ring-blue-500" 
                    />
                    <div className="flex items-center space-x-1.5">
                      <span className="text-sm text-slate-700">{header}</span>
                      {defaultAIHeaders.includes(header) && (
                        <span className="inline-flex items-center px-1.5 py-0.5 rounded text-[10px] font-medium bg-blue-50 text-blue-600 border border-blue-200/50">
                          AI识别
                        </span>
                      )}
                    </div>
                  </label>
                ))}
              </div>
            </div>

            <div className="flex items-center justify-end px-6 py-4 border-t border-slate-200 bg-slate-50 space-x-3">
              <button 
                onClick={() => setShowHeaderSettingsModal(false)}
                className="px-4 py-2 text-sm font-medium text-slate-600 bg-white border border-slate-300 rounded hover:bg-slate-50 transition-colors"
              >
                取消
              </button>
              <button 
                onClick={() => setShowHeaderSettingsModal(false)}
                className="px-4 py-2 text-sm font-medium text-white bg-blue-600 rounded hover:bg-blue-700 transition-colors shadow-sm"
              >
                确定
              </button>
            </div>
          </div>
        </div>,
        document.body
      )}

      {/* 汇总对比表表头设置弹窗 */}
      {showSummaryHeaderSettingsModal && typeof document !== 'undefined' && createPortal(
        <div className="fixed inset-0 z-[200] flex items-center justify-center bg-black/40">
          <div className="bg-white rounded-lg shadow-xl w-[600px] overflow-hidden">
            <div className="flex items-center justify-between px-6 py-4 border-b border-slate-200">
              <h3 className="text-base font-bold text-slate-800">表头设置</h3>
              <button onClick={() => setShowSummaryHeaderSettingsModal(false)} className="text-slate-400 hover:text-slate-600 transition-colors">
                <Icon name="X" size={20} />
              </button>
            </div>
            
            <div className="p-6">
              <div className="text-sm text-slate-600 mb-6">请手动选择或确认原文件识别出来的前几列表头项。若存在识别错误、漏识别或多识别，可在此调整。</div>
              <div className="grid grid-cols-3 gap-4">
                {availableSummaryHeaders.map(header => (
                  <label key={header} className="flex items-center space-x-2 cursor-pointer">
                    <input 
                      type="checkbox" 
                      checked={selectedSummaryHeaders.includes(header)}
                      onChange={() => toggleSummaryHeader(header)}
                      className="w-4 h-4 text-blue-600 rounded border-slate-300 focus:ring-blue-500" 
                    />
                    <div className="flex items-center space-x-1.5">
                      <span className="text-sm text-slate-700">{header}</span>
                    </div>
                  </label>
                ))}
              </div>
            </div>

            <div className="flex items-center justify-end px-6 py-4 border-t border-slate-200 bg-slate-50 space-x-3">
              <button 
                onClick={() => setShowSummaryHeaderSettingsModal(false)}
                className="px-4 py-2 text-sm font-medium text-slate-600 bg-white border border-slate-300 rounded hover:bg-slate-50 transition-colors"
              >
                取消
              </button>
              <button 
                onClick={() => setShowSummaryHeaderSettingsModal(false)}
                className="px-4 py-2 text-sm font-medium text-white bg-blue-600 rounded hover:bg-blue-700 transition-colors shadow-sm"
              >
                确定
              </button>
            </div>
          </div>
        </div>,
        document.body
      )}

      {/* 参数设置弹窗 */}
      {showSettingsModal && typeof document !== 'undefined' && createPortal(
        <div className="fixed inset-0 z-[200] flex items-center justify-center bg-black/40">
          <div className="bg-white rounded-lg shadow-xl w-[600px] overflow-hidden">
            <div className="flex items-center justify-between px-6 py-4 border-b border-slate-200">
              <h3 className="text-base font-bold text-slate-800">不平衡报价设置</h3>
              <button onClick={() => setShowSettingsModal(false)} className="text-slate-400 hover:text-slate-600 transition-colors">
                <Icon name="X" size={20} />
              </button>
            </div>

            
            <div className="p-6">
              <div className="text-sm text-slate-600 mb-6">设置基准的超出比例阈值，超出部分将被认定为不平衡报价</div>
              <div className="flex items-center space-x-4">
                <div className="flex-1">
                  <label className="block text-sm font-medium text-slate-700 mb-2">报价类型</label>
                  <div className="relative">
                    <select 
                      value={unbalancedSettings.quoteType}
                      onChange={(e) => setUnbalancedSettings(prev => ({ ...prev, quoteType: e.target.value }))}
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
                      value={unbalancedSettings.floatRange} 
                      onChange={(e) => setUnbalancedSettings(prev => ({ ...prev, floatRange: e.target.value }))} 
                      className="w-full h-10 pl-8 pr-3 border border-slate-300 rounded-md focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 outline-none transition-all text-sm" 
                      placeholder="例如: 15" 
                    />
                  </div>
                </div>
              </div>
            </div>

            <div className="flex items-center justify-end px-6 py-4 border-t border-slate-200 bg-slate-50 space-x-3">
              <button 
                onClick={() => setShowSettingsModal(false)}
                className="px-4 py-2 text-sm font-medium text-slate-600 bg-white border border-slate-300 rounded hover:bg-slate-50 transition-colors"
              >
                取消
              </button>
              <button 
                onClick={() => setShowSettingsModal(false)}
                className="px-4 py-2 text-sm font-medium text-white bg-blue-600 rounded hover:bg-blue-700 transition-colors shadow-sm"
              >
                确定
              </button>
            </div>
          </div>
        </div>,
        document.body
      )}

      {/* AI 偏差原因分析进度弹窗 */}
      {showAiReasonAnalysisModal && typeof document !== 'undefined' && createPortal(
        <div className="fixed inset-0 z-[250] flex items-center justify-center bg-black/40 backdrop-blur-sm">
          <div className="bg-white rounded-xl shadow-2xl w-[480px] p-8 flex flex-col items-center justify-center animate-in fade-in zoom-in-95 duration-200">
            <div className="w-16 h-16 bg-blue-50 rounded-full flex items-center justify-center mb-6">
              <Icon name="Loader" size={32} className="text-blue-600 animate-spin" />
            </div>
            <h3 className="text-lg font-bold text-slate-800 mb-2">正在智能分析单价明细...</h3>
            <p className="text-sm text-slate-500 mb-8 text-center leading-relaxed">
              AI 正在提取该清单项下各费用构成的具体偏离情况<br/>请您耐心等待
            </p>
            
            <div className="w-full space-y-2 mb-6">
              <div className="flex justify-between text-xs font-medium text-slate-600">
                <span>分析进度</span>
                <span className="text-blue-600">{aiReasonAnalysisProgress}%</span>
              </div>
              <div className="w-full h-2 bg-slate-100 rounded-full overflow-hidden">
                <div 
                  className="h-full bg-blue-600 rounded-full transition-all duration-300 ease-out"
                  style={{ width: `${aiReasonAnalysisProgress}%` }}
                />
              </div>
            </div>

            <button 
              onClick={handleCancelAiReasonAnalysis}
              className="px-6 py-2 text-sm font-medium text-slate-500 bg-white border border-slate-300 rounded-full hover:bg-slate-50 hover:text-slate-700 transition-colors"
            >
              取消分析
            </button>
          </div>
        </div>,
        document.body
      )}

      {/* AI整体分析弹窗 */}
      {showAiAnalysisModal && typeof document !== 'undefined' && createPortal(
        <div className="fixed inset-0 z-[250] flex items-center justify-center bg-black/40 backdrop-blur-sm">
          {aiAnalysisStatus === 'analyzing' ? (
            <div className="bg-white rounded-xl shadow-2xl w-[480px] p-8 flex flex-col items-center justify-center animate-in fade-in zoom-in-95 duration-200">
              <div className="w-16 h-16 bg-blue-50 rounded-full flex items-center justify-center mb-6">
                <Icon name="Loader" size={32} className="text-blue-600 animate-spin" />
              </div>
              <h3 className="text-lg font-bold text-slate-800 mb-2">全力分析中...</h3>
              <p className="text-sm text-slate-500 mb-8 text-center leading-relaxed">
                AI整体分析数据量较大，耗时久<br/>请您耐心等待
              </p>
              
              <div className="w-full space-y-2 mb-6">
                <div className="flex justify-between text-xs font-medium text-slate-600">
                  <span>分析进度</span>
                  <span className="text-blue-600">{aiAnalysisProgress}%</span>
                </div>
                <div className="w-full h-2 bg-slate-100 rounded-full overflow-hidden">
                  <div 
                    className="h-full bg-blue-600 rounded-full transition-all duration-300 ease-out"
                    style={{ width: `${aiAnalysisProgress}%` }}
                  />
                </div>
              </div>

              <button 
                onClick={handleCancelAiAnalysis}
                className="px-6 py-2 text-sm font-medium text-slate-500 bg-white border border-slate-300 rounded-full hover:bg-slate-50 hover:text-slate-700 transition-colors"
              >
                取消分析
              </button>
            </div>
          ) : aiAnalysisStatus === 'done' ? (
            <div className="bg-white rounded-xl shadow-2xl w-[800px] max-h-[85vh] flex flex-col overflow-hidden animate-in slide-in-from-bottom-4 duration-300">
              <div className="flex items-center justify-between px-6 py-4 border-b border-slate-200 bg-slate-50">
                <div className="flex items-center space-x-2">
                  <h3 className="text-base font-bold text-slate-800">AI 整体分析报告</h3>
                </div>
                <button onClick={() => setShowAiAnalysisModal(false)} className="text-slate-400 hover:text-slate-600 transition-colors p-1 rounded-md hover:bg-slate-200">
                  <Icon name="X" size={20} />
                </button>
              </div>
              
              <div className="flex-1 overflow-y-auto p-6 bg-slate-50/50">
                <div className="bg-white p-6 rounded-lg border border-slate-200 shadow-sm text-sm text-slate-700 leading-relaxed space-y-4">
                  <p>本次清标检查共分析了2家投标单位的报价数据，整体结论如下：</p>
                  
                  <p className="font-semibold text-slate-800">一、 整体偏差情况</p>
                  <ul className="list-disc pl-5 space-y-2">
                    <li><strong>投标单位1</strong>：综合偏差率为 <span className="text-red-500 font-medium">+4.5%</span>，整体报价高于控制价，需重点关注其高价项是否存在前期多拿工程款的意图。</li>
                    <li><strong>投标单位2</strong>：综合偏差率为 <span className="text-green-500 font-medium">-2.1%</span>，偏离基准处于合理下浮区间。</li>
                  </ul>

                  <p className="font-semibold text-slate-800 mt-6">二、 高风险异常项说明</p>
                  <ul className="list-decimal pl-5 space-y-3">
                    <li>
                      <strong>挖沟槽土方 (010101002001)</strong><br/>
                      两家投标单位的报价均显著高于控制价（偏离度达+5.4%）。此项作为前期工程，存在典型的不平衡报价（前重后轻）特征，建议专家复核现场实际土方工程量，防范超付风险。
                    </li>
                    <li>
                      <strong>回填方 (010103001001)</strong><br/>
                      投标单位之间报价离散度较高。投标单位1单价 21.00 元，投标单位2单价 23.50 元，差异率超过 10%。可能存在对图纸理解不一致、施工方案选用差异或材料运距考量不同的情况。
                    </li>
                    <li>
                      <strong>措施项目及规费</strong><br/>
                      措施费整体下浮比例处于正常范围，但系统检测到“投标单位2”的规费计取费率与标底存在微小差异。建议在“符合性检查”环节仔细核对不可竞争费用的计取基数及费率标准。
                    </li>
                  </ul>

                  <p className="font-semibold text-slate-800 mt-6">三、 综合建议</p>
                  <p>建议在后续评标及商务谈判中，重点要求“投标单位1”就土方类高价项提供详细的单价分析表及组价依据；要求“投标单位2”复核不可竞争费用的合规性。</p>
                </div>
              </div>
              
              <div className="flex items-center justify-between px-6 py-4 border-t border-slate-200 bg-white">
                <div className="text-xs text-slate-500 flex items-center space-x-1">
                  <Icon name="Info" size={14} />
                  <span>AI 分析结果仅供参考，最终结论请以专家复核为准</span>
                </div>
                <div className="flex items-center space-x-3">
                  <button 
                    onClick={() => setShowAiAnalysisModal(false)}
                    className="px-4 py-2 text-sm font-medium text-slate-600 bg-white border border-slate-300 rounded hover:bg-slate-50 transition-colors"
                  >
                    关闭
                  </button>
                  <button 
                    onClick={() => {
                      handleStartAiAnalysis(true);
                    }}
                    className="px-4 py-2 text-sm font-medium text-blue-600 bg-blue-50 border border-blue-200 rounded hover:bg-blue-100 transition-colors shadow-sm flex items-center space-x-1"
                  >
                    <Icon name="RefreshCw" size={14} />
                    <span>重新分析</span>
                  </button>
                  <button 
                    onClick={() => {
                      alert('正在生成并下载 PDF 分析报告...');
                      setShowAiAnalysisModal(false);
                    }}
                    className="px-4 py-2 text-sm font-medium text-white bg-blue-600 rounded hover:bg-blue-700 transition-colors shadow-sm flex items-center space-x-1"
                  >
                    <Icon name="Download" size={16} />
                    <span>下载报告</span>
                  </button>
                </div>
              </div>
            </div>
          ) : null}
        </div>,
        document.body
      )}

      {/* 评标价设置弹窗 */}
      {showBenchmarkModal && typeof document !== 'undefined' && createPortal(
        <div className="fixed inset-0 z-[250] flex items-center justify-center bg-black/40 backdrop-blur-sm">
          <div className="bg-white rounded-xl shadow-2xl w-[520px] flex flex-col overflow-hidden animate-in zoom-in-95 duration-200">
            <div className="flex items-center justify-between px-6 py-4 border-b border-slate-200 bg-slate-50">
              <h3 className="text-base font-bold text-slate-800 flex items-center space-x-2">
                <Icon name="Settings" size={18} className="text-blue-600" />
                <span>评标价设置</span>
              </h3>
              <button onClick={() => setShowBenchmarkModal(false)} className="text-slate-400 hover:text-slate-600 transition-colors p-1 rounded-md hover:bg-slate-200">
                <Icon name="X" size={20} />
              </button>
            </div>
            
            <div className="p-6 space-y-6">
              <div className="flex items-center space-x-4">
                <label className={`flex items-center space-x-2 px-4 py-2.5 rounded-md border cursor-pointer transition-colors ${tempBenchmarkSettings.type === 'none' ? 'border-blue-600 bg-blue-50/30' : 'border-slate-200 hover:bg-slate-50'}`}>
                  <input 
                    type="radio" 
                    checked={tempBenchmarkSettings.type === 'none'}
                    onChange={() => setTempBenchmarkSettings({...tempBenchmarkSettings, type: 'none'})}
                    className="w-4 h-4 text-blue-600 border-slate-300 focus:ring-blue-500"
                  />
                  <span className="text-sm text-slate-700">不显示</span>
                </label>
                <label className={`flex items-center space-x-2 px-4 py-2.5 rounded-md border cursor-pointer transition-colors ${tempBenchmarkSettings.type === 'benchmark' ? 'border-blue-600 bg-blue-50/30' : 'border-slate-200 hover:bg-slate-50'}`}>
                  <input 
                    type="radio" 
                    checked={tempBenchmarkSettings.type === 'benchmark'}
                    onChange={() => setTempBenchmarkSettings({...tempBenchmarkSettings, type: 'benchmark'})}
                    className="w-4 h-4 text-blue-600 border-slate-300 focus:ring-blue-500"
                  />
                  <span className="text-sm text-slate-700">显示基准价</span>
                </label>
                <label className={`flex items-center space-x-2 px-4 py-2.5 rounded-md border cursor-pointer transition-colors ${tempBenchmarkSettings.type === 'average' ? 'border-blue-600 bg-blue-50/30' : 'border-slate-200 hover:bg-slate-50'}`}>
                  <input 
                    type="radio" 
                    checked={tempBenchmarkSettings.type === 'average'}
                    onChange={() => setTempBenchmarkSettings({...tempBenchmarkSettings, type: 'average'})}
                    className="w-4 h-4 text-blue-600 border-slate-300 focus:ring-blue-500"
                  />
                  <span className="text-sm text-slate-700">显示平均价</span>
                </label>
              </div>

              {tempBenchmarkSettings.type === 'benchmark' && (
                <div className="space-y-3 p-4 bg-slate-50 rounded-lg border border-slate-200">
                  <div className="text-sm font-medium text-slate-800">基准价公式</div>
                  <select 
                    value={tempBenchmarkSettings.formula}
                    onChange={(e) => setTempBenchmarkSettings({...tempBenchmarkSettings, formula: e.target.value})}
                    className="w-full h-9 px-3 text-sm border border-slate-300 rounded focus:border-blue-500 focus:ring-1 focus:ring-blue-500 outline-none bg-white"
                  >
                    <option value="1">公式一：算术平均法</option>
                    <option value="2">公式二：算术平均 × 权重 B1 + 次低价 × 权重 B2（B1/B2 随机抽取）</option>
                    <option value="3">公式三：算术平均 ×(1−C)（C 随机）</option>
                    <option value="4">公式四：（算术平均 + 次低价）÷2</option>
                    <option value="5">公式五：低于算术平均的报价再平均</option>
                    <option value="6">公式六：经评审的最低有效价</option>
                  </select>
                </div>
              )}

              {tempBenchmarkSettings.type === 'average' && (
                <div className="space-y-3 p-4 bg-slate-50 rounded-lg border border-slate-200">
                  <div className="text-sm font-medium text-slate-800 flex justify-between">
                    <span>参与计算的投标单位</span>
                    <button 
                      onClick={() => setTempBenchmarkSettings({...tempBenchmarkSettings, selectedBidders: compareBidderKeys})}
                      className="text-blue-600 hover:text-blue-700 text-xs font-medium"
                    >
                      全选
                    </button>
                  </div>
                  <div className="grid grid-cols-2 gap-2 max-h-40 overflow-y-auto pt-2 border-t border-slate-200">
                    {compareBidderKeys.map(bidder => (
                      <label key={bidder} className="flex items-center space-x-2 cursor-pointer p-1.5 hover:bg-white rounded">
                        <input 
                          type="checkbox" 
                          checked={tempBenchmarkSettings.selectedBidders.includes(bidder)}
                          onChange={(e) => {
                            const newSelected = e.target.checked 
                              ? [...tempBenchmarkSettings.selectedBidders, bidder]
                              : tempBenchmarkSettings.selectedBidders.filter(b => b !== bidder);
                            setTempBenchmarkSettings({...tempBenchmarkSettings, selectedBidders: newSelected});
                          }}
                          className="w-4 h-4 text-blue-600 border-slate-300 rounded focus:ring-blue-500"
                        />
                        <span className="text-xs text-slate-700 truncate" title={bidder}>{bidder}</span>
                      </label>
                    ))}
                  </div>
                </div>
              )}
            </div>

            <div className="flex items-center justify-end space-x-3 px-6 py-4 border-t border-slate-200 bg-slate-50">
              <button 
                onClick={() => setShowBenchmarkModal(false)}
                className="px-4 py-2 text-sm font-medium text-slate-600 bg-white border border-slate-300 rounded hover:bg-slate-50 transition-colors"
              >
                取消
              </button>
              <button 
                onClick={() => {
                  setAppliedBenchmarkSettings(tempBenchmarkSettings);
                  setShowBenchmarkModal(false);
                }}
                className="px-4 py-2 text-sm font-medium text-white bg-blue-600 rounded hover:bg-blue-700 transition-colors shadow-sm"
              >
                确认
              </button>
            </div>
          </div>
        </div>,
        document.body
      )}

      {/* 导出报表弹窗 */}
      {showExportModal && typeof document !== 'undefined' && createPortal(
        <div className="fixed inset-0 z-[250] flex items-center justify-center bg-black/40 backdrop-blur-sm">
          <div className="bg-white rounded-xl shadow-2xl w-[480px] flex flex-col overflow-hidden animate-in zoom-in-95 duration-200">
            <div className="flex items-center justify-between px-6 py-4 border-b border-slate-200 bg-slate-50">
              <h3 className="text-base font-bold text-slate-800 flex items-center space-x-2">
                <Icon name="Download" size={18} className="text-blue-600" />
                <span>导出报表</span>
              </h3>
              <button onClick={() => setShowExportModal(false)} className="text-slate-400 hover:text-slate-600 transition-colors p-1 rounded-md hover:bg-slate-200">
                <Icon name="X" size={20} />
              </button>
            </div>
            
            <div className="p-6">
              <div className="text-sm text-slate-600 mb-4">请选择需要导出的报表内容（支持多选）：</div>
              <div className="space-y-3">
                <label className={`flex items-center space-x-3 p-4 rounded-lg border cursor-pointer transition-colors ${exportSelection.includes('summary') ? 'border-blue-600 bg-blue-50/30' : 'border-slate-200 hover:bg-slate-50'}`}>
                  <input 
                    type="checkbox" 
                    checked={exportSelection.includes('summary')}
                    onChange={() => toggleExportSelection('summary')}
                    className="w-4 h-4 text-blue-600 border-slate-300 rounded focus:ring-blue-500"
                  />
                  <div className="flex flex-col">
                    <span className="text-sm font-medium text-slate-800">汇总对比表</span>
                    <span className="text-xs text-slate-500 mt-1">包含各单位工程及总造价的对比数据</span>
                  </div>
                </label>

                <label className={`flex items-center space-x-3 p-4 rounded-lg border cursor-pointer transition-colors ${exportSelection.includes('compare') ? 'border-blue-600 bg-blue-50/30' : 'border-slate-200 hover:bg-slate-50'}`}>
                  <input 
                    type="checkbox" 
                    checked={exportSelection.includes('compare')}
                    onChange={() => toggleExportSelection('compare')}
                    className="w-4 h-4 text-blue-600 border-slate-300 rounded focus:ring-blue-500"
                  />
                  <div className="flex flex-col">
                    <span className="text-sm font-medium text-slate-800">清标对比表</span>
                    <span className="text-xs text-slate-500 mt-1">包含各专业工程的清单项详细比对</span>
                  </div>
                </label>

                <label className={`flex items-center space-x-3 p-4 rounded-lg border cursor-pointer transition-colors ${exportSelection.includes('unit') ? 'border-blue-600 bg-blue-50/30' : 'border-slate-200 hover:bg-slate-50'}`}>
                  <input 
                    type="checkbox" 
                    checked={exportSelection.includes('unit')}
                    onChange={() => toggleExportSelection('unit')}
                    className="w-4 h-4 text-blue-600 border-slate-300 rounded focus:ring-blue-500"
                  />
                  <div className="flex flex-col">
                    <span className="text-sm font-medium text-slate-800">单方对比表</span>
                    <span className="text-xs text-slate-500 mt-1">包含建筑面积及单方造价的分析数据</span>
                  </div>
                </label>
              </div>
            </div>

            <div className="flex items-center justify-between px-6 py-4 border-t border-slate-200 bg-slate-50">
              <div className="text-sm text-slate-500">
                已选择 <span className="font-bold text-blue-600">{exportSelection.length}</span> 个报表
              </div>
              <div className="flex space-x-3">
                <button 
                  onClick={() => setShowExportModal(false)}
                  className="px-4 py-2 text-sm font-medium text-slate-600 bg-white border border-slate-300 rounded hover:bg-slate-50 transition-colors"
                >
                  取消
                </button>
                <button 
                  onClick={() => {
                    if (exportSelection.length === 0) {
                      alert('请至少选择一个报表进行导出');
                      return;
                    }
                    alert(`正在打包导出以下报表...\n${exportSelection.join(', ')}`);
                    setShowExportModal(false);
                  }}
                  className="px-4 py-2 text-sm font-medium text-white bg-blue-600 rounded hover:bg-blue-700 transition-colors shadow-sm disabled:opacity-50 disabled:cursor-not-allowed"
                  disabled={exportSelection.length === 0}
                >
                  确认导出
                </button>
              </div>
            </div>
          </div>
        </div>,
        document.body
      )}

      {/* 原文件预览弹窗 */}
      {filePreviewData.visible && typeof document !== 'undefined' && createPortal(
        <div className="fixed inset-0 z-[250] flex items-center justify-center bg-black/60 backdrop-blur-sm">
          <div className="bg-white rounded-xl shadow-2xl w-[90vw] h-[90vh] flex flex-col overflow-hidden animate-in zoom-in-95 duration-200">
            {/* Header */}
            <div className="flex items-center justify-between px-6 py-4 border-b border-slate-200 shrink-0 bg-slate-50">
              <div className="flex items-center space-x-2">
                <Icon name="AlertCircle" size={20} className="text-amber-500" />
                <h3 className="text-lg font-bold text-slate-800">{filePreviewData.problemDescription}</h3>
              </div>
              <button onClick={closeFilePreview} className="text-slate-400 hover:text-slate-600 transition-colors p-1 rounded-md hover:bg-slate-200">
                <Icon name="X" size={20} />
              </button>
            </div>
            
            {/* Tabs */}
            {filePreviewData.tabs.length > 1 && (
              <div className="flex bg-slate-50 border-b border-slate-200 px-4 pt-2 shrink-0 overflow-x-auto hide-scrollbar">
                {filePreviewData.tabs.map(tab => (
                  <button
                    key={tab}
                    onClick={() => setFilePreviewData(prev => ({ ...prev, activeTab: tab }))}
                    className={`px-4 py-2.5 text-sm font-medium rounded-t-lg transition-colors whitespace-nowrap flex items-center space-x-1.5 ${
                      filePreviewData.activeTab === tab 
                        ? 'bg-white text-blue-600 border border-slate-200 border-b-white relative top-[1px]' 
                        : 'text-slate-600 hover:text-slate-800 hover:bg-slate-200/50'
                    }`}
                  >
                    <Icon name="FileText" size={14} className={filePreviewData.activeTab === tab ? 'text-blue-600' : 'text-slate-400'} />
                    <span>{tab}</span>
                  </button>
                ))}
              </div>
            )}

            {/* Content (Mock Spreadsheet View) */}
            <div className="flex-1 bg-white overflow-auto p-6">
              <div className="border border-slate-200 rounded-lg h-full flex flex-col overflow-hidden">
                <div className="bg-slate-100 border-b border-slate-200 p-2 text-sm font-medium text-slate-700 flex items-center space-x-2">
                  <Icon name="Table" size={16} className="text-slate-500" />
                  <span>{filePreviewData.activeTab || '预览内容'}</span>
                </div>
                <div className="flex-1 p-4 flex items-center justify-center bg-slate-50/50">
                  <div className="text-center space-y-3">
                    <Icon name="FileSearch" size={48} className="mx-auto text-slate-300" />
                    <p className="text-slate-600 font-medium">正在预览原文件数据</p>
                    <p className="text-sm text-slate-400 max-w-md mx-auto">
                      当前文件: {filePreviewData.activeTab} <br/>
                      此处将展示解析后的电子表格或清单详细数据，并高亮显示与问题相关的内容
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>,
        document.body
      )}

      {/* Export Report Preview Modal */}
      {showReportPreviewModal && createPortal(
        <div className="fixed inset-0 z-[200] flex items-center justify-center bg-slate-900/40 backdrop-blur-sm">
          <div className="bg-white w-[1100px] h-[92vh] rounded-xl shadow-2xl flex flex-col animate-in zoom-in-95 duration-200">
            <div className="px-6 py-4 border-b border-slate-100 shrink-0">
              <div className="flex items-start justify-between">
                <div>
                  <h3 className="text-lg font-bold text-slate-800">报告预览与编辑</h3>
                  <p className="mt-2 text-sm text-slate-500">
                    系统已基于您的模板和清标数据生成了报告内容。您可以在下方直接修改内容，修改后点击导出即可生成 Word 文档。
                  </p>
                </div>
                <button 
                  onClick={() => setShowReportPreviewModal(false)}
                  className="w-8 h-8 flex items-center justify-center rounded-full text-slate-400 hover:bg-slate-100 hover:text-slate-600 transition-colors shrink-0"
                >
                  <Icon name="X" size={20} />
                </button>
              </div>
            </div>
            
            <div className="flex-1 px-6 py-5 overflow-hidden flex flex-col bg-white">
              <style>{`
                .report-editor-host .docx-wrapper {
                  background: transparent !important;
                  padding: 0 !important;
                }
                .report-editor-host .docx {
                  background: transparent !important;
                  box-shadow: none !important;
                  margin: 0 0 24px 0 !important;
                  width: auto !important;
                  min-height: auto !important;
                  padding: 0 !important;
                }
                .report-editor-host .docx section,
                .report-editor-host section.docx {
                  background: transparent !important;
                  box-shadow: none !important;
                  margin: 0 0 24px 0 !important;
                }
                .report-editor-host table {
                  border-collapse: collapse !important;
                }
              `}</style>
              <div className="report-editor-host flex-1 overflow-auto bg-white">
                <div
                  ref={reportEditorRef}
                  contentEditable
                  suppressContentEditableWarning
                  onBlur={(e) => {
                    setReportHtml((e.currentTarget as HTMLDivElement).innerHTML);
                    setReportContent((e.currentTarget as HTMLDivElement).innerText);
                  }}
                  className="min-h-full w-full outline-none text-slate-700"
                  style={{ fontFamily: '"Microsoft YaHei", "PingFang SC", Inter, sans-serif' }}
                  dangerouslySetInnerHTML={{ __html: reportHtml }}
                />
              </div>
            </div>
            
            <div className="px-6 py-4 border-t border-slate-100 flex items-center justify-between bg-white shrink-0 rounded-b-xl">
              <div className="relative">
                <button
                  onClick={() => setIsTemplateDropdownOpen(prev => !prev)}
                  className="min-w-[180px] px-4 py-2 text-sm font-medium text-slate-700 bg-white border border-slate-300 rounded-lg hover:border-blue-400 hover:bg-slate-50 transition-colors flex items-center justify-between space-x-3"
                >
                  <span>{REPORT_TEMPLATE_OPTIONS.find(item => item.id === selectedReportTemplate)?.label || '默认模板'}</span>
                  <Icon name="ChevronDown" size={16} className={`text-slate-400 transition-transform ${isTemplateDropdownOpen ? 'rotate-180' : ''}`} />
                </button>
                {isTemplateDropdownOpen && (
                  <div className="absolute left-0 bottom-full mb-2 w-[220px] bg-white border border-slate-200 rounded-lg shadow-lg overflow-hidden z-10">
                    {REPORT_TEMPLATE_OPTIONS.map(option => (
                      <button
                        key={option.id}
                        onClick={() => handleSwitchReportTemplate(option.id)}
                        className={`w-full px-4 py-3 text-sm text-left transition-colors ${
                          option.id === selectedReportTemplate
                            ? 'bg-blue-50 text-blue-600 font-medium'
                            : 'text-slate-700 hover:bg-slate-50'
                        }`}
                      >
                        {option.label}
                      </button>
                    ))}
                  </div>
                )}
              </div>
              <div className="flex items-center space-x-3">
                <button 
                  onClick={() => {
                    setShowReportPreviewModal(false);
                    setIsTemplateDropdownOpen(false);
                  }}
                  className="px-6 py-2 text-sm font-medium text-slate-600 bg-white border border-slate-300 rounded-lg hover:bg-slate-50 transition-colors"
                >
                  取消
                </button>
                <button 
                  onClick={downloadWordDocument}
                  className="px-6 py-2 text-sm font-medium text-white bg-blue-600 rounded-lg hover:bg-blue-700 transition-colors shadow-sm shadow-blue-600/20 flex items-center space-x-2"
                >
                  <Icon name="Download" size={16} />
                  <span>确认导出 (Word)</span>
                </button>
              </div>
            </div>
          </div>
        </div>,
        document.body
      )}
      {showSwitchTemplateConfirm && createPortal(
        <div className="fixed inset-0 z-[300] flex items-center justify-center bg-black/40 backdrop-blur-sm">
          <div className="bg-white rounded-lg shadow-xl w-[400px] overflow-hidden">
            <div className="flex items-center justify-between px-6 py-4 border-b border-slate-200">
              <h3 className="text-base font-bold text-slate-800">切换模板提醒</h3>
              <button 
                onClick={() => {
                  setShowSwitchTemplateConfirm(false);
                  setPendingTemplateId(null);
                }} 
                className="text-slate-400 hover:text-slate-600 transition-colors"
              >
                <Icon name="X" size={20} />
              </button>
            </div>
            <div className="p-6">
              <p className="text-sm text-slate-600 text-center">
                确定要切换报告模板吗？<br />当前正在编辑的报告内容将会丢失。
              </p>
            </div>
            <div className="flex items-center justify-end px-6 py-4 border-t border-slate-200 bg-slate-50 space-x-3">
              <button 
                onClick={() => {
                  setShowSwitchTemplateConfirm(false);
                  setPendingTemplateId(null);
                }} 
                className="px-4 py-2 text-sm font-medium text-slate-600 bg-white border border-slate-300 rounded hover:bg-slate-50 transition-colors"
              >
                取消
              </button>
              <button 
                onClick={confirmSwitchTemplate} 
                className="px-4 py-2 text-sm font-medium text-white bg-blue-600 rounded hover:bg-blue-700 transition-colors shadow-sm"
              >
                确定切换
              </button>
            </div>
          </div>
        </div>,
        document.body
      )}
      {showTemplateSelectBubble && createPortal(
        <div className="fixed inset-0 z-[210] flex items-center justify-center bg-black/20">
          <div className="w-[420px] bg-white rounded-xl shadow-2xl border border-slate-200 overflow-hidden animate-in zoom-in-95 duration-200">
            <div className="px-5 py-4 border-b border-slate-100">
              <div className="text-base font-bold text-slate-800">选择报告模板</div>
              <div className="mt-1 text-sm text-slate-500">请选择要套用的报告模板，确认后进入编辑预览弹窗。</div>
            </div>
            <div className="p-4 space-y-2">
              {REPORT_TEMPLATE_OPTIONS.map(option => (
                <label
                  key={option.id}
                  className={`flex items-center space-x-3 p-3 rounded-lg border cursor-pointer transition-colors ${
                    draftReportTemplate === option.id
                      ? 'border-blue-600 bg-blue-50/40'
                      : 'border-slate-200 hover:bg-slate-50'
                  }`}
                >
                  <input
                    type="radio"
                    name="report-template"
                    checked={draftReportTemplate === option.id}
                    onChange={() => setDraftReportTemplate(option.id)}
                    className="w-4 h-4 text-blue-600 border-slate-300 focus:ring-blue-500"
                  />
                  <span className={`text-sm ${draftReportTemplate === option.id ? 'text-blue-600 font-medium' : 'text-slate-700'}`}>{option.label}</span>
                </label>
              ))}
            </div>
            <div className="px-5 py-4 border-t border-slate-100 bg-slate-50 flex items-center justify-end space-x-3">
              <button
                onClick={() => setShowTemplateSelectBubble(false)}
                className="px-4 py-2 text-sm font-medium text-slate-600 bg-white border border-slate-300 rounded-lg hover:bg-slate-50 transition-colors"
              >
                取消
              </button>
              <button
                onClick={handleConfirmTemplateSelection}
                className="px-4 py-2 text-sm font-medium text-white bg-blue-600 rounded-lg hover:bg-blue-700 transition-colors shadow-sm shadow-blue-600/20"
              >
                确定
              </button>
            </div>
          </div>
        </div>,
        document.body
      )}
      <div ref={templateProbeRef} className="fixed left-[-99999px] top-0 h-0 w-0 overflow-hidden opacity-0 pointer-events-none" />

    </div>
  );
};

export default RebiddingCheckResultView;
