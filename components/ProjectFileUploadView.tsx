
import React, { useState } from 'react';
import Icon from './Icon';

interface ParsingResult {
  id: string;
  name: string;
  sheetName: string;
  count: number;
  exceptionCount: number;
}

interface DetailItem {
  id: string;
  code: string;
  name: string;
  features: string;
  unit: string;
  quantity: number;
  price: number;
}

const MOCK_RESULTS: ParsingResult[] = [
  { id: '1', name: '地下室-2标地下室桩基', sheetName: '表10.2.2-16 分部分项工程清单与计价表【2标地下室', count: 4, exceptionCount: 0 },
  { id: '2', name: '地下室-2标地下室桩基', sheetName: '表10.2.2-16 分部分项工程清单与计价表【2标地下室', count: 5, exceptionCount: 0 },
  { id: '3', name: '地下室-2标地下室桩基', sheetName: '表10.2.2-16 分部分项工程清单与计价表【2标地下室', count: 5, exceptionCount: 0 },
  { id: '4', name: '地下室-2标地下室桩基', sheetName: '表10.2.2-16 分部分项工程清单与计价表【2标地下室', count: 6, exceptionCount: 0 },
  { id: '5', name: '地下室-2标地下室土建工程（含土方工程）', sheetName: '表10.2.2-16 分部分项工程清单与计价表【2标地下室_1', count: 3, exceptionCount: 0 },
  { id: '6', name: '地下室-2标地下室土建工程（含土方工程）', sheetName: '表10.2.2-16 分部分项工程清单与计价表【2标地下室_1', count: 6, exceptionCount: 0 },
  { id: '7', name: '地下室-2标地下室土建工程（含土方工程）', sheetName: '表10.2.2-16 分部分项工程清单与计价表【2标地下室_1', count: 12, exceptionCount: 0 },
  { id: '8', name: '地下室-2标地下室土建工程（含土方工程）', sheetName: '表10.2.2-16 分部分项工程清单与计价表【2标地下室_1', count: 11, exceptionCount: 0 },
  { id: '9', name: '地下室-2标地下室土建工程（含土方工程）', sheetName: '表10.2.2-16 分部分项工程清单与计价表【2标地下室_1', count: 8, exceptionCount: 0 },
  { id: '10', name: '地下室-2标地下室土建工程（含土方工程）', sheetName: '表10.2.2-16 分部分项工程清单与计价表【2标地下室_1', count: 11, exceptionCount: 0 },
];

const MOCK_DETAILS: DetailItem[] = [
  { id: '1', code: '010302001005', name: '泥浆护壁成孔灌注桩', features: '泥浆护壁钻孔灌注桩成孔穿越碎卵石增加费：桩径600，工程量按浙江省房屋建筑与装饰工...', unit: 'm3', quantity: 529.63, price: 555.43 },
  { id: '2', code: '010302001006', name: '泥浆护壁成孔灌注桩', features: '泥浆护壁钻孔灌注桩成孔穿越碎卵石增加费：桩径700，工程量按浙江省房屋建筑与装饰工...', unit: 'm3', quantity: 809.70, price: 494.44 },
  { id: '3', code: '010302001007', name: '泥浆护壁成孔灌注桩', features: '泥浆护壁钻孔灌注桩入岩 1、桩径Φ600 Φ700 2、冲击成孔入岩 3、桩长综合考虑 4、工程量...', unit: 'm3', quantity: 174.59, price: 3230.86 },
  { id: '4', code: '010302001008', name: '泥浆护壁成孔灌注桩', features: '泥浆护壁钻孔灌注桩灌注混凝土：水下商砼C30混凝土;', unit: 'm3', quantity: 6544.12, price: 745.02 },
  { id: '5', code: '010302001009', name: '泥浆护壁成孔灌注桩', features: '泥浆护壁钻孔灌注桩灌注混凝土试桩：水下商砼C35混凝土;', unit: 'm3', quantity: 57.58, price: 763.02 },
];

interface ProjectFileUploadViewProps {
  onBack: () => void;
  phase: '招标' | '结算';
}

const ProjectFileUploadView: React.FC<ProjectFileUploadViewProps> = ({ onBack, phase }) => {
  const [selectedResult, setSelectedResult] = useState<ParsingResult | null>(null);

  const handleSubmit = () => {
    alert('提交成功');
    onBack();
  };

  const renderDetailModal = () => {
    if (!selectedResult) return null;
    return (
      <div className="fixed inset-0 z-[110] flex items-center justify-center bg-black/45 backdrop-blur-sm p-4 animate-in fade-in duration-200">
        <div className="bg-white rounded-[32px] shadow-2xl w-full max-w-[1200px] h-[85vh] flex flex-col animate-in zoom-in-95 duration-200 overflow-hidden border border-slate-100">
          {/* 弹窗头部 */}
          <div className="px-8 py-4 border-b border-slate-100 flex items-center justify-between bg-white shrink-0">
             <div className="flex items-center space-x-4">
                <button 
                  onClick={() => setSelectedResult(null)}
                  className="p-1.5 text-slate-400 hover:text-blue-600 transition-colors"
                >
                  <Icon name="ArrowLeft" size={20} />
                </button>
                <h3 className="text-lg font-black text-slate-800">清单详情</h3>
             </div>
             <button 
              onClick={() => setSelectedResult(null)}
              className="w-10 h-10 flex items-center justify-center text-slate-300 hover:text-rose-500 hover:bg-rose-50 rounded-full transition-all outline-none"
             >
               <Icon name="X" size={24} />
             </button>
          </div>

          {/* 弹窗内容区 */}
          <div className="flex-1 flex flex-col overflow-hidden">
            {/* 信息摘要区域 - 进一步缩小垂直间距(py-2.5)，确保字段纯文本展示且不换行 */}
            <div className="px-8 py-2.5 bg-slate-50 border-b border-slate-100 shrink-0">
              <div className="flex flex-wrap items-center gap-x-10 gap-y-1">
                <div className="flex items-center space-x-1 whitespace-nowrap">
                  <span className="text-[12px] font-bold text-slate-400">名称：</span>
                  <span className="text-[12px] font-bold text-slate-700">{selectedResult.name}</span>
                </div>
                <div className="flex items-center space-x-1 whitespace-nowrap">
                  <span className="text-[12px] font-bold text-slate-400">页签名称：</span>
                  <span className="text-[12px] font-bold text-slate-700">{selectedResult.sheetName}</span>
                </div>
                <div className="flex items-center space-x-1 whitespace-nowrap">
                  <span className="text-[12px] font-bold text-slate-400">清单数量：</span>
                  <span className="text-[12px] font-black text-blue-600">{selectedResult.count}</span>
                </div>
                <div className="flex items-center space-x-1 whitespace-nowrap">
                  <span className="text-[12px] font-bold text-slate-400">异常清单：</span>
                  <span className={`text-[12px] font-black ${selectedResult.exceptionCount > 0 ? 'text-rose-500' : 'text-emerald-600'}`}>
                    {selectedResult.exceptionCount}
                  </span>
                </div>
              </div>
            </div>

            {/* 列表标题部分 */}
            <div className="px-8 py-3 bg-white shrink-0">
              <div className="flex items-center space-x-2">
                 <div className="w-1 h-4 bg-blue-600 rounded-full"></div>
                 <h4 className="text-[13px] font-black text-slate-800">解析结果</h4>
              </div>
            </div>

            {/* 清单明细表格 */}
            <div className="flex-1 px-6 pb-6 overflow-hidden flex flex-col bg-white">
              <div className="flex-1 border border-slate-100 rounded-[24px] overflow-hidden flex flex-col shadow-sm bg-white">
                <div className="overflow-x-auto flex-1 custom-scrollbar">
                  <table className="w-full border-collapse text-left">
                    <thead className="bg-slate-50 sticky top-0 z-10 border-b border-slate-100">
                      <tr className="text-[10px] font-black text-slate-400 uppercase tracking-widest">
                        <th className="px-6 py-4 text-center w-16">序号</th>
                        <th className="px-6 py-4">项目编码</th>
                        <th className="px-6 py-4">项目名称</th>
                        <th className="px-6 py-4 max-w-xs">项目特征</th>
                        <th className="px-6 py-4 text-center">单位</th>
                        <th className="px-6 py-4 text-right">工程量</th>
                        <th className="px-6 py-4 text-right">综合单价 (元)</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-50">
                      {MOCK_DETAILS.map((item, idx) => (
                        <tr key={item.id} className="hover:bg-blue-50/20 transition-all duration-300">
                          <td className="px-6 py-4 text-xs text-slate-400 text-center font-bold">{idx + 1}</td>
                          <td className="px-6 py-4 font-mono text-[11px] text-slate-500 font-bold">{item.code}</td>
                          <td className="px-6 py-4 font-black text-slate-700 text-[12px]">{item.name}</td>
                          <td className="px-6 py-4 text-[11px] text-slate-400 font-medium leading-relaxed max-w-xs truncate">{item.features}</td>
                          <td className="px-6 py-4 text-center text-slate-500 font-bold">{item.unit}</td>
                          <td className="px-6 py-4 text-right font-black text-slate-700">{item.quantity.toLocaleString()}</td>
                          <td className="px-6 py-4 text-right font-black text-blue-600">{item.price.toLocaleString(undefined, { minimumFractionDigits: 2 })}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          </div>

          {/* 弹窗底部 */}
          <div className="px-8 py-4 bg-slate-50/50 border-t border-slate-100 flex items-center justify-end shrink-0">
             <button 
              onClick={() => setSelectedResult(null)}
              className="px-10 py-2 bg-white border border-slate-200 text-slate-600 rounded-xl text-sm font-bold hover:bg-slate-50 transition-all active:scale-95 shadow-sm"
             >
               关闭
             </button>
          </div>
        </div>
      </div>
    );
  };

  return (
    <div className="flex-1 flex flex-col h-full bg-white animate-in fade-in duration-500 overflow-hidden">
      {/* 顶部操作栏 */}
      <div className="px-8 py-4 border-b border-slate-100 shrink-0 bg-white flex items-center justify-between z-10 shadow-sm">
        <div className="flex items-center space-x-6 min-w-0 flex-1">
          {/* 标题 */}
          <div className="flex items-center space-x-3 shrink-0">
            <div className="w-9 h-9 bg-blue-50 text-blue-600 rounded-xl flex items-center justify-center">
              <Icon name="Upload" size={18} strokeWidth={3} />
            </div>
            <h2 className="text-lg font-black text-slate-800 whitespace-nowrap">{phase}上传</h2>
          </div>

          {/* 文件展示区域 - 添加灰色背景区分，移除图标 */}
          <div className="flex-1 max-w-xl">
            <div className="flex items-center justify-between group animate-in slide-in-from-left-2 duration-300 bg-slate-50 border border-slate-100 rounded-xl px-4 py-2">
              <div className="flex items-center min-w-0">
                <div className="min-w-0 flex items-baseline space-x-2">
                  <p className="text-sm font-bold text-slate-700 truncate">测试用例-清单-合同价.xlsx</p>
                  <p className="text-[10px] text-slate-400 font-bold uppercase tracking-widest shrink-0">1009.36 KB</p>
                </div>
              </div>
              <button className="w-8 h-8 flex items-center justify-center text-slate-300 hover:text-rose-500 rounded-lg transition-all ml-4 shrink-0">
                <Icon name="Trash2" size={14} strokeWidth={3} />
              </button>
            </div>
          </div>
        </div>

        {/* 按钮组 */}
        <div className="flex items-center space-x-2 shrink-0 ml-4">
          <button className="flex items-center space-x-2 px-4 py-2 bg-emerald-500 text-white rounded-xl text-xs font-black shadow-lg shadow-emerald-500/10 hover:bg-emerald-600 transition-all active:scale-95">
            <Icon name="Download" size={14} strokeWidth={3} />
            <span>导出数据</span>
          </button>
          <button 
            onClick={handleSubmit}
            className="px-6 py-2 bg-blue-600 text-white rounded-xl text-xs font-black shadow-lg shadow-blue-500/10 hover:bg-blue-700 transition-all active:scale-95"
          >
            提交
          </button>
          <button 
            onClick={onBack}
            className="px-6 py-2 bg-white text-slate-500 border border-slate-200 rounded-xl text-xs font-black hover:bg-slate-50 transition-all active:scale-95"
          >
            取消
          </button>
        </div>
      </div>

      <div className="flex-1 overflow-y-auto custom-scrollbar p-8 bg-slate-50/20">
        <div className="max-w-[1400px] mx-auto space-y-6">
          {/* 解析结果区域 */}
          <div className="space-y-4">
            <div className="flex items-center justify-between px-2">
              <div className="flex items-center space-x-3">
                <div className="w-1 h-5 bg-blue-600 rounded-full"></div>
                <h3 className="text-base font-black text-slate-800">解析结果</h3>
              </div>
              <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">
                共计 <span className="text-blue-600">824</span> 个表格
              </p>
            </div>

            {/* 数据表格 */}
            <div className="border border-slate-100 rounded-[32px] overflow-hidden flex flex-col shadow-sm bg-white min-h-[500px]">
              <div className="overflow-x-auto flex-1 custom-scrollbar">
                <table className="w-full border-collapse text-left">
                  <thead className="bg-slate-50 sticky top-0 z-10 border-b border-slate-100">
                    <tr className="text-[11px] font-black text-slate-400 uppercase tracking-widest">
                      <th className="px-8 py-5 text-center w-20">序号</th>
                      <th className="px-6 py-5">名称</th>
                      <th className="px-6 py-5">页签名称</th>
                      <th className="px-6 py-5 text-center">清单数量</th>
                      <th className="px-6 py-5 text-center">异常清单数量</th>
                      <th className="px-8 py-5 text-center w-40">操作</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-50">
                    {MOCK_RESULTS.map((row, index) => (
                      <tr key={row.id} className="hover:bg-blue-50/20 transition-all duration-300">
                        <td className="px-8 py-5 text-sm text-slate-400 text-center font-bold">{index + 1}</td>
                        <td className="px-6 py-5">
                          <span className="text-slate-700 font-bold text-sm">{row.name}</span>
                        </td>
                        <td className="px-6 py-5">
                          <span className="text-slate-500 font-medium text-[13px]">{row.sheetName}</span>
                        </td>
                        <td className="px-6 py-5 text-center font-black text-slate-700">{row.count}</td>
                        <td className="px-6 py-5 text-center">
                          <span className={`inline-flex px-3 py-1 rounded-lg text-xs font-black ${
                            row.exceptionCount > 0 ? 'bg-rose-50 text-rose-500' : 'bg-emerald-50 text-emerald-500'
                          }`}>
                            {row.exceptionCount}
                          </span>
                        </td>
                        <td className="px-8 py-5">
                          <div className="flex justify-center">
                            <button 
                              onClick={() => setSelectedResult(row)}
                              className="px-4 py-1.5 bg-blue-600 text-white rounded-xl text-[11px] font-black shadow-md hover:bg-blue-700 transition-all active:scale-95 whitespace-nowrap"
                            >
                              查看详情
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              {/* 表格底部翻页 */}
              <div className="px-8 py-4 bg-slate-50/50 border-t border-slate-100 flex items-center justify-between">
                <div className="flex items-center space-x-4">
                  <p className="text-[11px] font-bold text-slate-400 uppercase tracking-widest">共 20 条</p>
                  <div className="relative group">
                    <select className="bg-white border border-slate-200 rounded-lg py-1 pl-3 pr-8 text-[11px] font-black text-slate-600 outline-none appearance-none cursor-pointer shadow-sm">
                      <option>10条/页</option>
                      <option>20条/页</option>
                      <option>50条/页</option>
                    </select>
                    <Icon name="ChevronDown" size={10} className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400" />
                  </div>
                </div>
                <div className="flex items-center space-x-1.5">
                  <button className="w-8 h-8 rounded-lg border border-slate-200 flex items-center justify-center text-slate-300 hover:text-blue-500 transition-all">
                    <Icon name="ChevronLeft" size={14} />
                  </button>
                  <button className="w-8 h-8 rounded-lg bg-blue-600 text-white flex items-center justify-center text-xs font-black shadow-lg shadow-blue-500/20">1</button>
                  <button className="w-8 h-8 rounded-lg border border-slate-200 flex items-center justify-center text-slate-500 hover:bg-white hover:text-blue-600 transition-all font-black text-xs">2</button>
                  <button className="w-8 h-8 rounded-lg border border-slate-200 flex items-center justify-center text-slate-300 hover:text-blue-500 transition-all">
                    <Icon name="ChevronRight" size={14} />
                  </button>
                  <div className="flex items-center space-x-2 ml-4">
                    <span className="text-[11px] font-bold text-slate-400">前往</span>
                    <input type="text" className="w-10 h-8 border border-slate-200 rounded-lg text-center text-xs font-black focus:border-blue-400 outline-none" defaultValue="1" />
                    <span className="text-[11px] font-bold text-slate-400">页</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
      {renderDetailModal()}
    </div>
  );
};

export default ProjectFileUploadView;
