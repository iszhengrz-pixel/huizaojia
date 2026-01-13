
import React, { useState } from 'react';
import Icon from './Icon';

interface VisionTool {
  id: string;
  name: string;
  description: string;
  icon: string;
  color: string;
  gradient: string;
}

const VISION_TOOLS: VisionTool[] = [
  {
    id: 'civil',
    name: '土建识图',
    description: '智能识别基础、柱、梁、板、墙等主体结构工程量',
    icon: 'Building2',
    color: 'text-blue-600',
    gradient: 'from-blue-50 to-indigo-50',
  },
  {
    id: 'interior',
    name: '精装修识图',
    description: '快速提取房间面积、天棚、墙面、地面铺装数据',
    icon: 'Paintbrush',
    color: 'text-emerald-600',
    gradient: 'from-emerald-50 to-teal-50',
  },
  {
    id: 'facade',
    name: '门窗幕墙栏杆',
    description: '专项识别各类门窗、幕墙构件及栏杆扶手长度数量',
    icon: 'Grid3X3',
    color: 'text-amber-600',
    gradient: 'from-amber-50 to-orange-50',
  },
  {
    id: 'landscape',
    name: '景观识图',
    description: '针对园林绿化、铺装、景观构筑物的专项算量模型',
    icon: 'Trees',
    color: 'text-lime-600',
    gradient: 'from-lime-50 to-green-50',
  },
  {
    id: 'municipal',
    name: '市政识图',
    description: '道路、管网、桥梁等市政基础设施的自动化算量',
    icon: 'Navigation',
    color: 'text-purple-600',
    gradient: 'from-purple-50 to-fuchsia-50',
  },
  {
    id: 'installation',
    name: '安装识图',
    description: '强弱电、给排水、暖通空调及工艺管路综合识别',
    icon: 'Wrench',
    color: 'text-rose-600',
    gradient: 'from-rose-50 to-pink-50',
  }
];

interface RoomData {
  id: number;
  name: string;
  floorArea: number;
  wallArea: number;
  ceilingArea: number;
  perimeter: number;
}

const MOCK_ROOMS: RoomData[] = [
  { id: 1, name: '客厅', floorArea: 32.5, wallArea: 58.2, ceilingArea: 32.5, perimeter: 22.4 },
  { id: 2, name: '主卧', floorArea: 18.2, wallArea: 42.6, ceilingArea: 18.2, perimeter: 17.2 },
  { id: 3, name: '次卧', floorArea: 14.5, wallArea: 38.4, ceilingArea: 14.5, perimeter: 15.4 },
  { id: 4, name: '厨房', floorArea: 8.4, wallArea: 26.8, ceilingArea: 8.4, perimeter: 11.6 },
  { id: 5, name: '卫生间', floorArea: 6.2, wallArea: 22.4, ceilingArea: 6.2, perimeter: 10.0 },
  { id: 6, name: '玄关', floorArea: 4.8, wallArea: 18.5, ceilingArea: 4.8, perimeter: 8.8 },
];

const AIVisionView: React.FC = () => {
  const [selectedToolId, setSelectedToolId] = useState<string | null>(null);
  const [isAnalysing, setIsAnalysing] = useState(false);
  const [showResults, setShowResults] = useState(false);

  const selectedTool = VISION_TOOLS.find(t => t.id === selectedToolId);

  const startAnalysis = () => {
    setIsAnalysing(true);
    // Simulate API call
    setTimeout(() => {
      setIsAnalysing(false);
      setShowResults(true);
    }, 2500);
  };

  const reset = () => {
    setSelectedToolId(null);
    setShowResults(false);
    setIsAnalysing(false);
  };

  const renderSelectionGrid = () => (
    <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
      <div className="flex flex-col space-y-2">
        <div className="flex items-center space-x-3">
          <div className="w-1.5 h-6 bg-blue-600 rounded-full"></div>
          <h2 className="text-xl font-bold text-slate-800">第一步：请选择识图类型</h2>
        </div>
        <p className="text-slate-500 text-sm ml-4">针对不同工程类别，我们采用专项优化的 AI 算法模型以保证最高的识别准确率。</p>
      </div>
      
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {VISION_TOOLS.map((tool) => (
          <div 
            key={tool.id} 
            onClick={() => setSelectedToolId(tool.id)}
            className="group bg-white rounded-[32px] p-6 border border-slate-100 shadow-sm hover:shadow-2xl hover:shadow-blue-500/10 hover:border-blue-300 transition-all duration-500 cursor-pointer flex flex-col h-full active:scale-95"
          >
            <div className={`w-14 h-14 rounded-2xl bg-gradient-to-br ${tool.gradient} flex items-center justify-center ${tool.color} mb-6 transition-transform group-hover:scale-110`}>
              <Icon name={tool.icon} size={28} />
            </div>
            <h3 className="text-xl font-bold text-slate-800 mb-3 group-hover:text-blue-600 transition-colors">{tool.name}</h3>
            <p className="text-slate-500 text-sm leading-relaxed flex-1">{tool.description}</p>
            <div className="mt-8 flex items-center justify-between">
              <span className="text-xs font-black text-slate-300 uppercase tracking-widest group-hover:text-blue-400 transition-colors">点击选择模式</span>
              <div className="w-10 h-10 bg-slate-50 rounded-full flex items-center justify-center text-slate-400 group-hover:bg-blue-600 group-hover:text-white transition-all">
                <Icon name="ArrowRight" size={18} />
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );

  const renderResults = () => (
    <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-4">
          <button 
            onClick={() => setShowResults(false)}
            className="p-2 bg-white rounded-xl border border-slate-200 text-slate-500 hover:text-blue-600 transition-colors"
          >
            <Icon name="ArrowLeft" size={20} />
          </button>
          <div>
            <h2 className="text-2xl font-black text-slate-900">识别结果：房间面积清单</h2>
            <p className="text-slate-500 text-sm">共识别出 {MOCK_ROOMS.length} 个房间区域</p>
          </div>
        </div>
        <div className="flex space-x-3">
          <button className="flex items-center space-x-2 bg-emerald-600 text-white px-5 py-2.5 rounded-xl font-bold hover:bg-emerald-700 transition-all shadow-lg shadow-emerald-500/20">
            <Icon name="FileSpreadsheet" size={18} />
            <span>导出 Excel</span>
          </button>
          <button className="flex items-center space-x-2 bg-slate-900 text-white px-5 py-2.5 rounded-xl font-bold hover:bg-slate-800 transition-all">
            <Icon name="Printer" size={18} />
            <span>打印报表</span>
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
        <div className="lg:col-span-3">
          <div className="bg-white rounded-[32px] overflow-hidden border border-slate-100 shadow-sm">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-slate-50 border-b border-slate-100">
                  <th className="px-6 py-4 text-xs font-black text-slate-400 uppercase tracking-widest">房间名称</th>
                  <th className="px-6 py-4 text-xs font-black text-slate-400 uppercase tracking-widest text-right">地面面积 (m²)</th>
                  <th className="px-6 py-4 text-xs font-black text-slate-400 uppercase tracking-widest text-right">墙面面积 (m²)</th>
                  <th className="px-6 py-4 text-xs font-black text-slate-400 uppercase tracking-widest text-right">天棚面积 (m²)</th>
                  <th className="px-6 py-4 text-xs font-black text-slate-400 uppercase tracking-widest text-right">周长 (m)</th>
                </tr>
              </thead>
              <tbody>
                {MOCK_ROOMS.map((room) => (
                  <tr key={room.id} className="border-b border-slate-50 hover:bg-blue-50/30 transition-colors group">
                    <td className="px-6 py-4 font-bold text-slate-700">{room.name}</td>
                    <td className="px-6 py-4 text-right text-slate-600 font-medium">{room.floorArea.toFixed(2)}</td>
                    <td className="px-6 py-4 text-right text-slate-600 font-medium">{room.wallArea.toFixed(2)}</td>
                    <td className="px-6 py-4 text-right text-slate-600 font-medium">{room.ceilingArea.toFixed(2)}</td>
                    <td className="px-6 py-4 text-right text-slate-600 font-medium">{room.perimeter.toFixed(2)}</td>
                  </tr>
                ))}
              </tbody>
              <tfoot>
                <tr className="bg-blue-50/50">
                  <td className="px-6 py-4 font-black text-blue-600">汇总</td>
                  <td className="px-6 py-4 text-right font-black text-blue-600">
                    {MOCK_ROOMS.reduce((acc, r) => acc + r.floorArea, 0).toFixed(2)}
                  </td>
                  <td className="px-6 py-4 text-right font-black text-blue-600">
                    {MOCK_ROOMS.reduce((acc, r) => acc + r.wallArea, 0).toFixed(2)}
                  </td>
                  <td className="px-6 py-4 text-right font-black text-blue-600">
                    {MOCK_ROOMS.reduce((acc, r) => acc + r.ceilingArea, 0).toFixed(2)}
                  </td>
                  <td className="px-6 py-4 text-right font-black text-blue-600">
                    {MOCK_ROOMS.reduce((acc, r) => acc + r.perimeter, 0).toFixed(2)}
                  </td>
                </tr>
              </tfoot>
            </table>
          </div>
        </div>
        
        <div className="space-y-6">
          <div className="bg-white p-6 rounded-[32px] border border-slate-100 shadow-sm">
            <h4 className="text-sm font-black text-slate-400 uppercase tracking-widest mb-4">面积占比</h4>
            <div className="space-y-4">
              {MOCK_ROOMS.slice(0, 4).map(room => (
                <div key={room.id}>
                  <div className="flex items-center justify-between text-xs font-bold text-slate-600 mb-1.5">
                    <span>{room.name}</span>
                    <span>{Math.round((room.floorArea / 104.6) * 100)}%</span>
                  </div>
                  <div className="w-full h-1.5 bg-slate-100 rounded-full overflow-hidden">
                    <div 
                      className="h-full bg-blue-500 rounded-full" 
                      style={{ width: `${(room.floorArea / 32.5) * 100}%` }}
                    ></div>
                  </div>
                </div>
              ))}
            </div>
          </div>

          <div className="bg-gradient-to-br from-blue-600 to-indigo-700 p-6 rounded-[32px] text-white shadow-xl shadow-blue-500/20">
            <h4 className="text-xs font-black text-white/60 uppercase tracking-widest mb-4">总建筑面积 (估)</h4>
            <div className="flex items-baseline space-x-2">
              <span className="text-4xl font-black">115.4</span>
              <span className="text-lg font-bold opacity-80">m²</span>
            </div>
            <p className="text-xs text-blue-100 mt-4 leading-relaxed opacity-70">基于各房间识别结果综合计算得出，含墙体投影面积。</p>
          </div>
        </div>
      </div>
    </div>
  );

  const renderUploadZone = () => (
    <div className="space-y-8 animate-in fade-in zoom-in-95 duration-500">
      <div className="flex items-center justify-between">
        <button 
          onClick={() => setSelectedToolId(null)}
          className="flex items-center space-x-2 text-slate-400 hover:text-blue-600 transition-colors font-bold text-sm bg-white px-4 py-2 rounded-xl shadow-sm border border-slate-100"
        >
          <Icon name="ArrowLeft" size={16} />
          <span>返回重新选择类型</span>
        </button>
        <div className="flex items-center space-x-2 bg-blue-50 px-4 py-2 rounded-xl border border-blue-100">
          <Icon name={selectedTool?.icon || 'Zap'} size={18} className="text-blue-600" />
          <span className="text-blue-700 font-bold text-sm">当前模式：{selectedTool?.name}</span>
        </div>
      </div>

      <div className="bg-white border-2 border-dashed border-blue-200 rounded-[40px] p-16 text-center group hover:border-blue-500 transition-all duration-500 hover:bg-blue-50/30 cursor-pointer relative overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-b from-transparent to-blue-50/20 opacity-0 group-hover:opacity-100 transition-opacity"></div>
        <div className="relative z-10 flex flex-col items-center">
          {isAnalysing ? (
            <div className="flex flex-col items-center py-10">
              <div className="relative w-24 h-24 mb-8">
                <div className="absolute inset-0 rounded-full border-4 border-blue-100"></div>
                <div className="absolute inset-0 rounded-full border-4 border-blue-600 border-t-transparent animate-spin"></div>
                <div className="absolute inset-0 flex items-center justify-center text-blue-600">
                  <Icon name="SearchCode" size={32} />
                </div>
              </div>
              <h3 className="text-2xl font-black text-slate-800 mb-2">AI 深度分析中...</h3>
              <p className="text-slate-400">正在通过算量大模型提取构件特征并计算面积</p>
              <div className="mt-8 flex space-x-2">
                <div className="w-2 h-2 bg-blue-600 rounded-full animate-bounce [animation-delay:-0.3s]"></div>
                <div className="w-2 h-2 bg-blue-600 rounded-full animate-bounce [animation-delay:-0.15s]"></div>
                <div className="w-2 h-2 bg-blue-600 rounded-full animate-bounce"></div>
              </div>
            </div>
          ) : (
            <>
              <div className="w-24 h-24 bg-blue-50 rounded-full flex items-center justify-center text-blue-600 mb-6 group-hover:scale-110 transition-transform shadow-inner">
                <Icon name="CloudUpload" size={48} />
              </div>
              <h3 className="text-3xl font-black text-slate-800 mb-3">上传 {selectedTool?.name} 涉及图纸</h3>
              <p className="text-slate-500 mb-10 max-w-lg mx-auto">请上传清晰的 PDF、CAD (DWG) 或高清照片。针对 {selectedTool?.name} 建议优先提供矢量 CAD 文件以获得更高精度的结果。</p>
              <div className="flex flex-col sm:flex-row gap-4 justify-center w-full max-w-md">
                <button className="flex-1 bg-blue-600 text-white px-8 py-4 rounded-2xl font-bold hover:bg-blue-700 shadow-xl shadow-blue-500/20 transition-all active:scale-95 flex items-center justify-center space-x-2">
                  <Icon name="Plus" size={20} />
                  <span>添加文件</span>
                </button>
                <button 
                  onClick={startAnalysis}
                  className="flex-1 bg-slate-900 text-white px-8 py-4 rounded-2xl font-bold hover:bg-slate-800 transition-all active:scale-95"
                >
                  开始分析识别
                </button>
              </div>
            </>
          )}
        </div>
      </div>

      {!isAnalysing && (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="bg-white p-6 rounded-3xl border border-slate-100 shadow-sm flex items-start space-x-4">
            <div className="w-10 h-10 bg-blue-50 rounded-xl flex items-center justify-center text-blue-600 shrink-0">
              <Icon name="ShieldCheck" size={20} />
            </div>
            <div>
              <h4 className="font-bold text-slate-800 text-sm mb-1">隐私加密</h4>
              <p className="text-xs text-slate-500">您的图纸经过端到端加密，识别完成后自动销毁，确保企业秘密安全。</p>
            </div>
          </div>
          <div className="bg-white p-6 rounded-3xl border border-slate-100 shadow-sm flex items-start space-x-4">
            <div className="w-10 h-10 bg-emerald-50 rounded-xl flex items-center justify-center text-emerald-600 shrink-0">
              <Icon name="Zap" size={20} />
            </div>
            <div>
              <h4 className="font-bold text-slate-800 text-sm mb-1">极速识别</h4>
              <p className="text-xs text-slate-500">采用云端并行计算，即便是复杂的超高层图纸也仅需数分钟即可完成。</p>
            </div>
          </div>
          <div className="bg-white p-6 rounded-3xl border border-slate-100 shadow-sm flex items-start space-x-4">
            <div className="w-10 h-10 bg-amber-50 rounded-xl flex items-center justify-center text-amber-600 shrink-0">
              <Icon name="Target" size={20} />
            </div>
            <div>
              <h4 className="font-bold text-slate-800 text-sm mb-1">精度保障</h4>
              <p className="text-xs text-slate-500">自研大模型针对中国造价标准专项优化，构件漏识率低于 0.5%。</p>
            </div>
          </div>
        </div>
      )}
    </div>
  );

  return (
    <div className="flex-1 overflow-y-auto bg-slate-50 p-6 lg:p-10">
      <div className="max-w-6xl mx-auto space-y-10">
        {/* Header Section */}
        {!showResults && (
          <div className="flex flex-col md:flex-row md:items-end justify-between gap-6">
            <div className="space-y-2">
              <div className="flex items-center space-x-3">
                <div className="w-12 h-12 bg-blue-600 rounded-2xl flex items-center justify-center text-white shadow-xl shadow-blue-500/20">
                  <Icon name="ScanSearch" size={28} />
                </div>
                <h1 className="text-3xl font-black text-slate-900 tracking-tight">AI 识图算量</h1>
              </div>
              <p className="text-slate-500 text-lg ml-15">基于深度学习技术，自动识别 PDF/CAD/照片中的工程构件并计算工程量</p>
            </div>
            <div className="flex bg-white p-1 rounded-2xl border border-slate-200 shadow-sm">
              <button 
                onClick={reset}
                className="px-6 py-2 bg-slate-900 text-white rounded-xl text-sm font-bold shadow-lg"
              >
                工具模式
              </button>
              <button className="px-6 py-2 text-slate-500 hover:text-slate-800 rounded-xl text-sm font-bold">历史记录</button>
            </div>
          </div>
        )}

        {/* Dynamic Content Switching */}
        {showResults 
          ? renderResults() 
          : !selectedToolId 
            ? renderSelectionGrid() 
            : renderUploadZone()
        }

        {/* Static Feature Highlights (Only shown in grid view) */}
        {!selectedToolId && !showResults && (
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 pt-8">
            <div className="bg-slate-900 rounded-[40px] p-8 text-white relative overflow-hidden flex flex-col justify-center min-h-[220px]">
              <div className="absolute top-0 right-0 w-64 h-64 bg-white/5 rounded-full -mr-32 -mt-32"></div>
              <div className="relative z-10">
                <h3 className="text-2xl font-bold mb-4">精准识别，告别繁琐</h3>
                <ul className="space-y-3">
                  <li className="flex items-center space-x-3 text-slate-300 text-sm">
                    <Icon name="CheckCircle2" size={18} className="text-emerald-400 shrink-0" />
                    <span>毫秒级构件定位与几何参数提取</span>
                  </li>
                  <li className="flex items-center space-x-3 text-slate-300 text-sm">
                    <Icon name="CheckCircle2" size={18} className="text-emerald-400 shrink-0" />
                    <span>支持模糊手绘图纸辅助识别</span>
                  </li>
                  <li className="flex items-center space-x-3 text-slate-300 text-sm">
                    <Icon name="CheckCircle2" size={18} className="text-emerald-400 shrink-0" />
                    <span>自动关联定额与清单编码</span>
                  </li>
                </ul>
              </div>
            </div>
            <div className="bg-indigo-600 rounded-[40px] p-8 text-white relative overflow-hidden flex flex-col justify-center min-h-[220px]">
               <div className="absolute bottom-0 right-0 w-64 h-64 bg-black/10 rounded-full -mr-32 -mb-32"></div>
               <div className="relative z-10 text-center">
                 <div className="inline-block px-4 py-1 bg-white/20 rounded-lg text-[10px] font-black tracking-widest uppercase mb-4">效率飞跃</div>
                 <h3 className="text-4xl font-black mb-2">效率提升 800%</h3>
                 <p className="text-indigo-100 opacity-80 text-sm">人工算量需 3 天的工作，AI 仅需 15 分钟</p>
                 <button className="mt-6 bg-white text-indigo-600 px-8 py-2.5 rounded-2xl font-bold shadow-xl hover:bg-indigo-50 transition-all active:scale-95">了解算量大模型</button>
               </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default AIVisionView;
