
import React, { useState, useRef, useEffect } from 'react';
import { askAI } from '../services/geminiService';
import { ChatMessage } from '../types';
import Icon from './Icon';

interface AIChatViewProps {
  initialTag?: string;
}

const AIChatView: React.FC<AIChatViewProps> = ({ initialTag = '' }) => {
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [selectedTag, setSelectedTag] = useState(initialTag);
  const scrollRef = useRef<HTMLDivElement>(null);

  const tags = ['清单定额', '材价指标', '材料品牌'];

  useEffect(() => {
    setSelectedTag(initialTag);
  }, [initialTag]);

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages]);

  const handleSend = async () => {
    if (!input.trim() || isLoading) return;

    const userMsg: ChatMessage = { role: 'user', content: input };
    setMessages(prev => [...prev, userMsg]);
    setInput('');
    setIsLoading(true);

    const context = selectedTag ? `[${selectedTag}] ` : '';
    const response = await askAI(input, context || '通用造价咨询');
    const assistantMsg: ChatMessage = { role: 'assistant', content: response };
    
    setMessages(prev => [...prev, assistantMsg]);
    setIsLoading(false);
  };

  const toggleTag = (tag: string) => {
    setSelectedTag(prev => prev === tag ? '' : tag);
  };

  return (
    <div className="flex flex-col h-full bg-slate-50">
      <div className="bg-white border-b border-slate-200 px-6 py-4 flex items-center justify-between">
        <div className="flex items-center space-x-3">
          <div className="w-10 h-10 bg-blue-100 rounded-full flex items-center justify-center text-blue-600">
            <Icon name="BrainCircuit" size={24} />
          </div>
          <div>
            <h2 className="text-lg font-bold text-slate-800">AI 智能问答</h2>
            <p className="text-xs text-slate-500">
              {selectedTag ? `正在为您解答: ${selectedTag}` : '正在为您解答: 通用造价咨询'}
            </p>
          </div>
        </div>
      </div>

      <div ref={scrollRef} className="flex-1 overflow-y-auto p-6 space-y-6">
        {messages.length === 0 && (
          <div className="flex flex-col items-center justify-center h-full text-center space-y-4">
            <div className="bg-white p-8 rounded-3xl shadow-sm border border-slate-100 max-w-md">
              <Icon name="MessageSquareText" size={48} className="text-blue-500 mx-auto mb-4" />
              <h3 className="text-xl font-bold text-slate-800 mb-2">欢迎使用 AI 造价助手</h3>
              <p className="text-slate-500 text-sm">
                您可以询问任何专业问题。{selectedTag && `当前已选择：${selectedTag}`}
              </p>
            </div>
          </div>
        )}

        {messages.map((msg, i) => (
          <div key={i} className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}>
            <div className={`max-w-[80%] rounded-2xl p-4 shadow-sm ${
              msg.role === 'user' 
                ? 'bg-blue-600 text-white rounded-br-none' 
                : 'bg-white text-slate-800 border border-slate-100 rounded-bl-none'
            }`}>
              <p className="text-sm whitespace-pre-wrap leading-relaxed">{msg.content}</p>
            </div>
          </div>
        ))}

        {isLoading && (
          <div className="flex justify-start">
            <div className="bg-white border border-slate-100 rounded-2xl rounded-bl-none p-4 shadow-sm flex items-center space-x-2">
              <div className="flex space-x-1">
                <div className="w-2 h-2 bg-blue-400 rounded-full animate-bounce"></div>
                <div className="w-2 h-2 bg-blue-400 rounded-full animate-bounce delay-100"></div>
                <div className="w-2 h-2 bg-blue-400 rounded-full animate-bounce delay-200"></div>
              </div>
              <span className="text-xs text-slate-400">AI 正在思考...</span>
            </div>
          </div>
        )}
      </div>

      <div className="p-6 bg-white border-t border-slate-200">
        <div className="max-w-4xl mx-auto space-y-4">
          <div className="flex items-center space-x-2 overflow-x-auto no-scrollbar">
            {tags.map(tag => (
              <button
                key={tag}
                onClick={() => toggleTag(tag)}
                className={`px-4 py-1.5 rounded-full text-xs font-bold transition-all outline-none border ${
                  selectedTag === tag
                    ? 'bg-blue-600 border-blue-600 text-white shadow-md'
                    : 'bg-slate-50 border-slate-100 text-slate-500 hover:border-blue-200 hover:text-blue-600'
                }`}
              >
                {tag}
              </button>
            ))}
          </div>
          <div className="relative">
            <textarea
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === 'Enter' && !e.shiftKey) {
                  e.preventDefault();
                  handleSend();
                }
              }}
              placeholder="请输入您的问题..."
              className="w-full bg-slate-50 border border-slate-200 rounded-2xl py-3 pl-4 pr-16 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all resize-none h-24 text-sm"
            />
            <button
              onClick={handleSend}
              disabled={!input.trim() || isLoading}
              className="absolute bottom-4 right-4 bg-blue-600 text-white p-2 rounded-xl hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
            >
              <Icon name="Send" size={20} />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default AIChatView;
