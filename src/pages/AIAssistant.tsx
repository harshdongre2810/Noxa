import React, { useState, useEffect, useRef } from 'react';
import { useStore } from '../store/useStore';
import { noxaAI } from '../services/aiService';
import { Send, Bot, User, Sparkles, Heart, Zap, MessageSquare } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import clsx from 'clsx';

interface AIMessage {
  role: 'user' | 'model';
  text: string;
  timestamp: number;
}

export default function AIAssistant() {
  const [input, setInput] = useState('');
  const [messages, setMessages] = useState<AIMessage[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const theme = useStore((state) => state.theme);
  const user = useStore((state) => state.user);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  useEffect(() => {
    if (user) {
      fetch(`/api/ai/history/${user.id}`)
        .then(res => res.json())
        .then(data => {
          if (Array.isArray(data)) {
            const historyMessages: AIMessage[] = data.reverse().flatMap(h => [
              { role: 'user', text: h.message, timestamp: h.timestamp },
              { role: 'model', text: h.ai_response, timestamp: h.timestamp }
            ]);
            setMessages(historyMessages);
          }
        })
        .catch(err => console.error('Failed to load AI history:', err));
    }
  }, [user]);

  const handleSend = async () => {
    if (!input.trim() || isLoading) return;

    const userMsg: AIMessage = { role: 'user', text: input, timestamp: Date.now() };
    setMessages(prev => [...prev, userMsg]);
    setInput('');
    setIsLoading(true);

    try {
      const history = messages.map(m => ({
        role: m.role,
        parts: [{ text: m.text }]
      }));

      const response = await noxaAI.generateResponse(input, history);
      const aiMsg: AIMessage = { role: 'model', text: response || "I'm sorry, I couldn't process that.", timestamp: Date.now() };
      setMessages(prev => [...prev, aiMsg]);

      // Save to backend history
      if (user) {
        fetch('/api/ai/save', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ userId: user.id, message: input, aiResponse: response })
        }).catch(err => console.error('Failed to save AI history:', err));
      }
    } catch (error) {
      console.error('AI Error:', error);
      const errorMsg: AIMessage = { role: 'model', text: "I'm having a bit of trouble connecting right now. Let's try again in a moment!", timestamp: Date.now() };
      setMessages(prev => [...prev, errorMsg]);
    } finally {
      setIsLoading(false);
    }
  };

  const quickActions = [
    { label: "Give me motivation", icon: Heart, color: "text-rose-400" },
    { label: "Help me write a message", icon: MessageSquare, color: "text-indigo-400" },
    { label: "Summarize my day", icon: Zap, color: "text-amber-400" },
  ];

  return (
    <div className={clsx(
      "flex-1 flex flex-col h-full transition-colors duration-200",
      theme === 'light' ? 'bg-zinc-50' : 'bg-black'
    )}>
      {/* Header */}
      <div className="px-6 py-4 bg-zinc-900/50 backdrop-blur-xl border-b border-zinc-800/50 flex items-center gap-4">
        <div className="w-12 h-12 bg-indigo-500/20 rounded-2xl flex items-center justify-center border border-indigo-500/30">
          <Bot className="w-7 h-7 text-indigo-400" />
        </div>
        <div>
          <h1 className="text-xl font-bold text-white tracking-tight">Noxa AI</h1>
          <div className="flex items-center gap-1.5">
            <div className="w-2 h-2 bg-emerald-500 rounded-full animate-pulse" />
            <p className="text-[10px] text-zinc-500 uppercase tracking-widest font-bold">Your Caring Companion</p>
          </div>
        </div>
      </div>

      {/* Messages */}
      <div className="flex-1 overflow-y-auto p-6 space-y-6">
        {messages.length === 0 && (
          <div className="h-full flex flex-col items-center justify-center text-center space-y-8">
            <motion.div
              initial={{ scale: 0.8, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              className="w-24 h-24 bg-indigo-500/10 rounded-3xl flex items-center justify-center border border-indigo-500/20"
            >
              <Sparkles className="w-12 h-12 text-indigo-400" />
            </motion.div>
            <div className="space-y-2">
              <h2 className="text-2xl font-bold text-white">Hello, I'm Noxa</h2>
              <p className="text-zinc-500 max-w-xs mx-auto">I'm here to listen, support, and help you with anything you need. How are you feeling today?</p>
            </div>
            <div className="grid grid-cols-1 gap-3 w-full max-w-xs">
              {quickActions.map((action, idx) => (
                <button
                  key={idx}
                  onClick={() => setInput(action.label)}
                  className="flex items-center gap-3 p-4 bg-zinc-900/50 border border-zinc-800 rounded-2xl hover:bg-zinc-800 transition-all group"
                >
                  <action.icon className={clsx("w-5 h-5", action.color)} />
                  <span className="text-sm text-zinc-300 group-hover:text-white">{action.label}</span>
                </button>
              ))}
            </div>
          </div>
        )}

        {messages.map((msg, idx) => (
          <motion.div
            key={idx}
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            className={clsx(
              "flex gap-4",
              msg.role === 'user' ? "flex-row-reverse" : "flex-row"
            )}
          >
            <div className={clsx(
              "w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0 border",
              msg.role === 'user' ? "bg-zinc-800 border-zinc-700" : "bg-indigo-500/20 border-indigo-500/30"
            )}>
              {msg.role === 'user' ? <User className="w-5 h-5 text-zinc-400" /> : <Bot className="w-5 h-5 text-indigo-400" />}
            </div>
            <div className={clsx(
              "max-w-[80%] p-4 rounded-2xl text-sm leading-relaxed",
              msg.role === 'user' ? "bg-indigo-600 text-white rounded-tr-none" : "bg-zinc-900 border border-zinc-800 text-zinc-200 rounded-tl-none"
            )}>
              {msg.text}
            </div>
          </motion.div>
        ))}
        {isLoading && (
          <div className="flex gap-4">
            <div className="w-10 h-10 bg-indigo-500/20 border border-indigo-500/30 rounded-xl flex items-center justify-center">
              <Bot className="w-5 h-5 text-indigo-400" />
            </div>
            <div className="bg-zinc-900 border border-zinc-800 p-4 rounded-2xl rounded-tl-none">
              <div className="flex gap-1">
                <div className="w-1.5 h-1.5 bg-indigo-500 rounded-full animate-bounce" />
                <div className="w-1.5 h-1.5 bg-indigo-500 rounded-full animate-bounce [animation-delay:0.2s]" />
                <div className="w-1.5 h-1.5 bg-indigo-500 rounded-full animate-bounce [animation-delay:0.4s]" />
              </div>
            </div>
          </div>
        )}
        <div ref={messagesEndRef} />
      </div>

      {/* Input */}
      <div className="p-6 bg-zinc-900/50 backdrop-blur-xl border-t border-zinc-800/50">
        <div className="relative">
          <input
            type="text"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyPress={(e) => e.key === 'Enter' && handleSend()}
            placeholder="Talk to Noxa..."
            className="w-full bg-black border border-zinc-800 rounded-2xl pl-4 pr-14 py-4 text-white placeholder-zinc-500 focus:outline-none focus:ring-2 focus:ring-indigo-500/50 transition-all"
          />
          <button
            onClick={handleSend}
            disabled={!input.trim() || isLoading}
            className="absolute right-2 top-1/2 -translate-y-1/2 w-10 h-10 bg-indigo-600 hover:bg-indigo-500 disabled:bg-zinc-800 disabled:text-zinc-600 text-white rounded-xl flex items-center justify-center transition-all shadow-lg shadow-indigo-600/20"
          >
            <Send className="w-5 h-5" />
          </button>
        </div>
      </div>
    </div>
  );
}
