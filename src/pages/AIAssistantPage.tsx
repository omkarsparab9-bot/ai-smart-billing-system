import React, { useState, useEffect, useRef } from 'react';
import { api } from '../services/api';
import { Sparkles, Send, Bot, User, Key, CheckCircle, HelpCircle, RefreshCw } from 'lucide-react';

interface ChatMessage {
  id: string;
  sender: 'user' | 'assistant';
  text: string;
  timestamp: string;
  mode?: string;
  isConfigWarning?: boolean;
}

export const AIAssistantPage: React.FC = () => {
  const [messages, setMessages] = useState<ChatMessage[]>([
    {
      id: '1',
      sender: 'assistant',
      text: "Hello! I am your AI Business Assistant for this store. I have direct access to your SQLite sales and inventory records. You can ask me questions like:\n\n• **Which products are selling the most?**\n• **Which products need restocking?**\n• **Give me a summary of this month's sales.**\n• **Which customers have purchased the most?**\n\nHow can I help you today?",
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
    },
  ]);

  const [inputQuery, setInputQuery] = useState<string>('');
  const [isTyping, setIsTyping] = useState<boolean>(false);
  const [apiKeyActive, setApiKeyActive] = useState<boolean | null>(null);

  const messagesEndRef = useRef<HTMLDivElement>(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages, isTyping]);

  const quickPrompts = [
    "Which products are selling the most?",
    "Which products need restocking?",
    "Give me a summary of this month's sales.",
    "Which customers have purchased the most?",
    "What is the average transaction value?",
  ];

  const handleSendMessage = async (queryText?: string) => {
    const textToSend = queryText || inputQuery;
    if (!textToSend.trim() || isTyping) return;

    const userMsg: ChatMessage = {
      id: Date.now().toString(),
      sender: 'user',
      text: textToSend.trim(),
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
    };

    setMessages((prev) => [...prev, userMsg]);
    setInputQuery('');
    setIsTyping(true);

    try {
      const response = await api.askAI(textToSend.trim());
      setApiKeyActive(response.api_key_configured);

      const botMsg: ChatMessage = {
        id: (Date.now() + 1).toString(),
        sender: 'assistant',
        text: response.reply,
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
        mode: response.mode,
      };

      setMessages((prev) => [...prev, botMsg]);
    } catch (err: any) {
      const errorMsg: ChatMessage = {
        id: (Date.now() + 1).toString(),
        sender: 'assistant',
        text: `Error connecting to AI service: ${err.message || 'Check backend connection'}.`,
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      };
      setMessages((prev) => [...prev, errorMsg]);
    } finally {
      setIsTyping(false);
    }
  };

  const renderFormattedMarkdown = (text: string) => {
    // Basic Markdown format helper for bold, lists, and headings
    return text.split('\n').map((line, idx) => {
      if (line.startsWith('### ')) {
        return (
          <h4 key={idx} className="font-bold text-slate-900 text-sm mt-2 mb-1">
            {line.replace('### ', '')}
          </h4>
        );
      }
      if (line.startsWith('- ') || line.startsWith('• ')) {
        const itemContent = line.replace(/^[-•]\s*/, '');
        return (
          <li key={idx} className="ml-4 list-disc text-slate-700 text-xs my-0.5">
            <span dangerouslySetInnerHTML={{ __html: itemContent.replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>') }} />
          </li>
        );
      }
      if (line.match(/^\d+\.\s/)) {
        return (
          <li key={idx} className="ml-4 list-decimal text-slate-700 text-xs my-0.5">
            <span dangerouslySetInnerHTML={{ __html: line.replace(/^\d+\.\s*/, '').replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>') }} />
          </li>
        );
      }
      if (line.trim() === '') {
        return <div key={idx} className="h-1.5" />;
      }
      return (
        <p
          key={idx}
          className="text-slate-700 text-xs leading-relaxed my-0.5"
          dangerouslySetInnerHTML={{ __html: line.replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>') }}
        />
      );
    });
  };

  return (
    <div className="p-6 max-w-5xl mx-auto space-y-4 h-[calc(100vh-80px)] flex flex-col">
      {/* Header Bar */}
      <div className="bg-white rounded-xl border border-slate-200 p-4 shadow-2xs flex items-center justify-between shrink-0">
        <div className="flex items-center space-x-3">
          <div className="w-10 h-10 rounded-xl bg-indigo-600 text-white flex items-center justify-center shadow-md shadow-indigo-500/20">
            <Sparkles className="w-5 h-5" />
          </div>
          <div>
            <h1 className="text-base font-bold text-slate-800">
              Google Gemini AI Business Assistant
            </h1>
            <p className="text-xs text-slate-500">
              Natural language answers powered by your store's live SQLite billing & sales records
            </p>
          </div>
        </div>

        {/* Gemini API Status Badge */}
        <div className="flex items-center space-x-2 text-xs">
          <div className="flex items-center space-x-1.5 px-3 py-1 rounded-full border bg-slate-50 border-slate-200">
            <span className={`w-2 h-2 rounded-full ${apiKeyActive ? 'bg-emerald-500' : 'bg-indigo-500'}`} />
            <span className="font-medium text-slate-700">
              {apiKeyActive ? 'Gemini 2.5 Flash Connected' : 'Live Data Business Engine'}
            </span>
          </div>
        </div>
      </div>

      {/* API Key Instructions Note Banner */}
      <div className="bg-indigo-50/60 border border-indigo-100 rounded-lg p-3 text-xs text-indigo-900 flex items-start space-x-2 shrink-0">
        <Key className="w-4 h-4 text-indigo-600 shrink-0 mt-0.5" />
        <div>
          <span className="font-semibold">Gemini Configuration Guide:</span> To use Google Gemini Cloud LLM, add your API key in <code className="bg-indigo-100/70 px-1 py-0.5 rounded font-mono text-[11px]">.env</code> as <code className="bg-indigo-100/70 px-1 py-0.5 rounded font-mono text-[11px]">GEMINI_API_KEY=AIzaSy...</code>. The system automatically reads real inventory, customers, and invoice transactions directly from SQLite!
        </div>
      </div>

      {/* Chat Messages Container */}
      <div className="flex-1 bg-white rounded-xl border border-slate-200 shadow-2xs p-5 overflow-y-auto space-y-4">
        {messages.map((m) => {
          const isUser = m.sender === 'user';
          return (
            <div
              key={m.id}
              className={`flex items-start space-x-3 ${isUser ? 'flex-row-reverse space-x-reverse' : ''}`}
            >
              {/* Avatar */}
              <div
                className={`w-8 h-8 rounded-full flex items-center justify-center shrink-0 text-xs font-bold ${
                  isUser
                    ? 'bg-blue-600 text-white'
                    : 'bg-indigo-100 text-indigo-700 border border-indigo-200'
                }`}
              >
                {isUser ? <User className="w-4 h-4" /> : <Bot className="w-4 h-4" />}
              </div>

              {/* Message Bubble */}
              <div
                className={`max-w-[78%] rounded-2xl p-3.5 shadow-2xs ${
                  isUser
                    ? 'bg-blue-600 text-white rounded-tr-none'
                    : 'bg-slate-50 border border-slate-200/80 rounded-tl-none'
                }`}
              >
                <div className="flex items-center justify-between space-x-3 mb-1">
                  <span className={`text-[10px] font-bold uppercase tracking-wider ${isUser ? 'text-blue-100' : 'text-slate-500'}`}>
                    {isUser ? 'You' : 'Store Assistant'}
                  </span>
                  <span className={`text-[9px] ${isUser ? 'text-blue-200' : 'text-slate-400'}`}>
                    {m.timestamp}
                  </span>
                </div>

                <div className={isUser ? 'text-xs text-white' : ''}>
                  {isUser ? m.text : renderFormattedMarkdown(m.text)}
                </div>

                {m.mode && (
                  <div className="mt-2 pt-1 border-t border-slate-200/50 text-[9px] text-slate-400 font-mono">
                    Mode: {m.mode}
                  </div>
                )}
              </div>
            </div>
          );
        })}

        {isTyping && (
          <div className="flex items-center space-x-3">
            <div className="w-8 h-8 rounded-full bg-indigo-100 text-indigo-700 border border-indigo-200 flex items-center justify-center shrink-0">
              <Bot className="w-4 h-4" />
            </div>
            <div className="bg-slate-50 border border-slate-200 rounded-2xl rounded-tl-none p-3 shadow-2xs flex items-center space-x-2 text-xs text-slate-500">
              <RefreshCw className="w-3.5 h-3.5 animate-spin text-indigo-600" />
              <span>Analyzing SQLite store data & generating answer...</span>
            </div>
          </div>
        )}

        <div ref={messagesEndRef} />
      </div>

      {/* Suggested Quick Prompts */}
      <div className="flex items-center space-x-2 overflow-x-auto pb-1 shrink-0">
        <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 shrink-0">
          Suggested:
        </span>
        {quickPrompts.map((q, idx) => (
          <button
            key={idx}
            onClick={() => handleSendMessage(q)}
            className="px-2.5 py-1 bg-white hover:bg-slate-50 border border-slate-200 hover:border-blue-300 rounded-lg text-slate-700 text-xs whitespace-nowrap transition cursor-pointer shadow-2xs"
          >
            {q}
          </button>
        ))}
      </div>

      {/* Message Input Box */}
      <div className="bg-white rounded-xl border border-slate-200 p-2 shadow-2xs flex items-center space-x-2 shrink-0">
        <input
          type="text"
          placeholder="Ask about top selling products, low stock, revenue, or customer data..."
          value={inputQuery}
          onChange={(e) => setInputQuery(e.target.value)}
          onKeyDown={(e) => e.key === 'Enter' && handleSendMessage()}
          className="flex-1 px-3 py-2 text-xs text-slate-800 placeholder-slate-400 bg-transparent focus:outline-hidden"
        />
        <button
          onClick={() => handleSendMessage()}
          disabled={!inputQuery.trim() || isTyping}
          className="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 disabled:opacity-50 text-white rounded-lg text-xs font-semibold flex items-center space-x-1.5 transition cursor-pointer shadow-sm"
        >
          <Send className="w-3.5 h-3.5" />
          <span>Ask AI</span>
        </button>
      </div>
    </div>
  );
};
