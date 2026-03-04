import React, { useState, useRef } from 'react';
import Icon from './Icon';

interface LibraryDetailViewProps {
  file: {
    id: string;
    name: string;
    type: string;
    category: string;
    region: string;
    year: string;
  };
  onBack: () => void;
}

const LibraryDetailView: React.FC<LibraryDetailViewProps> = ({ file, onBack }) => {
  const [fontSize, setFontSize] = useState(16);
  const [isDarkMode, setIsDarkMode] = useState(false);
  const [readProgress, setReadProgress] = useState(0);
  const [showCatalog, setShowCatalog] = useState(true);
  const scrollRef = useRef<HTMLDivElement>(null);

  const mockChapters = [
    { title: "第一章 总则", text: "为了规范建设工程工程量清单计价行为，统一建设工程工程量清单的编制和计价方法，维护工程建设市场秩序，保护发、承包双方的合法权益，制定本标准。本标准适用于建设工程发承包及实施阶段的计价活动。建设工程造价咨询应当遵循客观、公正、诚实信用的原则。" },
    { title: "第二章 2024版新规解读", text: "2024版计价标准在原基础上强化了数字化交付的要求。要求所有造价咨询成果文件必须同步上传电子签名及行业统一的XML/JSON格式数据。对于AI辅助生成的算量成果，应在报告中明确标注算法版本及人工复核比例。此外，新增了关于碳配额交易、绿色建筑溢价取费的指导意见，确保造价核算紧跟国家战略导向。" },
    { title: "第三章 工程量计算要点", text: "工程量计算应当遵循完整性、准确性原则。项目特征描述应详尽，避免歧义导致后期纠纷。对于大型地下工程，应充分考虑地质风险补偿系数。2024版清单强化了“物料编码”与“定额编码”的解耦，建议采用行业统一的数字化标签，以便于大数据平台的造价指数分析。" }
  ];

  const handleScroll = () => {
    if (scrollRef.current) {
      const { scrollTop, scrollHeight, clientHeight } = scrollRef.current;
      const progress = Math.round((scrollTop / (scrollHeight - clientHeight)) * 100);
      setReadProgress(isNaN(progress) ? 0 : Math.min(100, progress));
    }
  };

  return (
    <div className={`flex flex-col h-full overflow-hidden transition-colors duration-300 ${isDarkMode ? 'bg-slate-900 text-slate-300' : 'bg-slate-50 text-slate-700'}`}>
      <header className={`h-16 px-6 border-b flex items-center justify-between shrink-0 z-50 transition-colors ${isDarkMode ? 'bg-slate-800 border-slate-700' : 'bg-white border-slate-200 shadow-sm'}`}>
        <div className="flex items-center space-x-4">
          <button onClick={onBack} className={`p-2 rounded-xl transition-all ${isDarkMode ? 'text-slate-400 hover:bg-slate-700' : 'text-slate-400 hover:bg-slate-100 hover:text-blue-600'}`}>
            <Icon name="ArrowLeft" size={20} />
          </button>
          <div className="w-px h-6 bg-slate-200 dark:bg-slate-700"></div>
          <div className="min-w-0">
            <h1 className={`text-sm font-black truncate max-w-[300px] md:max-w-[500px] ${isDarkMode ? 'text-white' : 'text-slate-900'}`}>{file.name}</h1>
            <div className="flex items-center space-x-2 text-[10px] font-bold text-slate-400 uppercase tracking-widest">
               <span>{file.category}</span><span>•</span><span>{file.region}</span><span>•</span><span>{file.year}年版</span>
            </div>
          </div>
        </div>
        <div className="flex items-center space-x-4">
          <div className="hidden md:flex items-center bg-slate-100 dark:bg-slate-700 rounded-full px-4 h-9">
            <span className="text-[10px] font-black text-slate-400 mr-3 tracking-widest">阅读进度</span>
            <div className="w-32 h-1.5 bg-slate-200 dark:bg-slate-600 rounded-full overflow-hidden">
               <div className="h-full bg-blue-500 transition-all duration-300" style={{ width: `${readProgress}%` }}></div>
            </div>
            <span className="text-[11px] font-black text-blue-500 ml-3">{readProgress}%</span>
          </div>
          {/* 仅真题文库允许下载全文 */}
          {file.category === '真题' && (
            <button className="flex items-center space-x-2 px-5 h-9 bg-blue-600 text-white rounded-xl text-xs font-black shadow-lg shadow-blue-500/20 transition-all">
              <Icon name="Download" size={14} />
              <span className="hidden sm:inline">下载全文</span>
            </button>
          )}
        </div>
      </header>
      <div className="flex-1 flex overflow-hidden">
        {showCatalog && (
          <aside className={`w-72 border-r flex flex-col shrink-0 animate-in slide-in-from-left duration-300 ${isDarkMode ? 'bg-slate-800 border-slate-700' : 'bg-white border-slate-100'}`}>
            <div className="p-6 border-b border-slate-50 dark:border-slate-700">
               <h3 className={`text-[11px] font-black uppercase tracking-widest ${isDarkMode ? 'text-slate-500' : 'text-slate-400'}`}>文档目录</h3>
            </div>
            <div className="flex-1 overflow-y-auto p-4 custom-scrollbar space-y-1">
               {mockChapters.map((item, idx) => (
                 <button key={idx} className={`w-full text-left p-3 rounded-xl text-xs font-bold transition-all ${isDarkMode ? 'text-slate-400 hover:bg-slate-700' : 'text-slate-600 hover:bg-blue-50 hover:text-blue-600'}`}>
                   {item.title}
                 </button>
               ))}
            </div>
          </aside>
        )}
        <main ref={scrollRef} onScroll={handleScroll} className="flex-1 overflow-y-auto custom-scrollbar p-6 lg:p-12 scroll-smooth">
          <div className="max-w-4xl mx-auto space-y-10 pb-40">
            {mockChapters.map((section, idx) => (
              <div key={idx} id={`chapter-${idx}`} className={`p-10 md:p-16 rounded-[40px] shadow-sm border transition-all duration-300 ${isDarkMode ? 'bg-slate-800 border-slate-700 text-slate-300' : 'bg-white border-slate-100 text-slate-700'}`}>
                <h2 className={`text-2xl font-black mb-10 border-b pb-6 ${isDarkMode ? 'text-white border-slate-700' : 'text-slate-900 border-slate-50'}`}>{section.title}</h2>
                <div className="leading-[2.4] font-serif tracking-wide text-justify" style={{ fontSize: `${fontSize}px` }}>{section.text}</div>
              </div>
            ))}
          </div>
        </main>
        <div className="fixed right-8 bottom-8 flex flex-col space-y-3 z-50">
           <div className={`p-2 rounded-[32px] border shadow-2xl flex flex-col space-y-2 ${isDarkMode ? 'bg-slate-800 border-slate-700' : 'bg-white border-slate-200'}`}>
              <button onClick={() => setFontSize(prev => Math.min(prev + 2, 32))} className={`p-3 rounded-2xl transition-all ${isDarkMode ? 'hover:bg-slate-700 text-white' : 'hover:bg-slate-100 text-slate-700'}`} title="放大字号"><Icon name="Plus" size={20} /></button>
              <button onClick={() => setFontSize(prev => Math.max(prev - 2, 12))} className={`p-3 rounded-2xl transition-all ${isDarkMode ? 'hover:bg-slate-700 text-white' : 'hover:bg-slate-100 text-slate-700'}`} title="缩小字号"><Icon name="Minus" size={20} /></button>
              <div className="h-px bg-slate-100 dark:bg-slate-700 mx-2"></div>
              <button onClick={() => setIsDarkMode(!isDarkMode)} className={`p-3 rounded-2xl transition-all ${isDarkMode ? 'text-amber-400 hover:bg-slate-700' : 'text-slate-400 hover:bg-slate-100'}`} title="切换模式"><Icon name={isDarkMode ? "Sun" : "Moon"} size={20} /></button>
           </div>
        </div>
      </div>
    </div>
  );
};

export default LibraryDetailView;