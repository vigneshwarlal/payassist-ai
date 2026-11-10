import React, { useState, useEffect, useRef } from 'react';
import { Send, X, Bot, Sparkles, RefreshCw, ChevronRight, Mic, MicOff, Volume2, VolumeX } from 'lucide-react';
import MessageBubble from './MessageBubble.jsx';
import { sendChatMessage } from '../../utils/api.js';

const INITIAL_MESSAGES = [
  {
    id: 'welcome-1',
    sender: 'bot',
    text: "Welcome to **PayAssist AI**, your autonomous commerce copilot powered by PayPal. How may I assist your financial operations today?",
    timestamp: new Date().toISOString(),
  },
];

const SUGGESTION_CHIPS = [
  'Show revenue summary',
  'Create an invoice',
  'Who are my top customers?',
  'Business health check',
];

export default function ChatPanel({ isOpen, onClose, onNavigate }) {
  const [messages, setMessages] = useState(INITIAL_MESSAGES);
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [isListening, setIsListening] = useState(false);
  const [voiceEnabled, setVoiceEnabled] = useState(true);
  const messagesEndRef = useRef(null);
  const inputRef = useRef(null);
  const recognitionRef = useRef(null);

  // Initialize Speech Recognition if supported
  useEffect(() => {
    const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
    if (SpeechRecognition) {
      const recognition = new SpeechRecognition();
      recognition.continuous = false;
      recognition.interimResults = false;
      recognition.lang = 'en-US';

      recognition.onresult = (event) => {
        const transcript = event.results[0][0].transcript;
        if (transcript) {
          setInput(transcript);
          handleSend(transcript);
        }
        setIsListening(false);
      };

      recognition.onerror = () => {
        setIsListening(false);
      };

      recognition.onend = () => {
        setIsListening(false);
      };

      recognitionRef.current = recognition;
    }
  }, []);

  const toggleVoiceListen = () => {
    if (!recognitionRef.current) {
      alert('Speech recognition is not supported in this browser. Please use Chrome or Edge.');
      return;
    }

    if (isListening) {
      recognitionRef.current.stop();
      setIsListening(false);
    } else {
      setIsListening(true);
      try {
        recognitionRef.current.start();
      } catch (err) {
        setIsListening(false);
      }
    }
  };

  const speakText = (text) => {
    if (!voiceEnabled || !window.speechSynthesis) return;
    window.speechSynthesis.cancel();
    // Clean markdown symbols for cleaner voice
    const clean = text.replace(/[*#_`]/g, '').slice(0, 160);
    const utterance = new SpeechSynthesisUtterance(clean);
    utterance.rate = 1.05;
    window.speechSynthesis.speak(utterance);
  };

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    if (isOpen) {
      setTimeout(() => {
        inputRef.current?.focus();
        scrollToBottom();
      }, 100);
    }
  }, [isOpen]);

  useEffect(() => {
    scrollToBottom();
  }, [messages, isLoading]);

  const handleSend = async (textToSend) => {
    const prompt = (textToSend || input).trim();
    if (!prompt || isLoading) return;

    const userMessage = {
      id: `usr-${Date.now()}`,
      sender: 'user',
      text: prompt,
      timestamp: new Date().toISOString(),
    };

    setMessages((prev) => [...prev, userMessage]);
    setInput('');
    setIsLoading(true);

    try {
      const history = messages.map((m) => ({
        role: m.sender === 'user' ? 'user' : 'model',
        parts: [{ text: m.text }],
      }));

      const res = await sendChatMessage(prompt, history);

      const botMessage = {
        id: `bot-${Date.now()}`,
        sender: 'bot',
        text: res.reply || res.text || res.message || 'I processed your request.',
        action: res.action || null,
        timestamp: res.timestamp || new Date().toISOString(),
      };

      setMessages((prev) => [...prev, botMessage]);
      speakText(botMessage.text);
    } catch (err) {
      const errorMessage = {
        id: `err-${Date.now()}`,
        sender: 'bot',
        text: "I couldn't reach the agent backend. Please check your connection or try again.",
        timestamp: new Date().toISOString(),
      };
      setMessages((prev) => [...prev, errorMessage]);
    } finally {
      setIsLoading(false);
    }
  };

  const handleKeyDown = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  const handleActionClick = (action) => {
    if (!action) return;
    if (action.type === 'invoice_created' && onNavigate) {
      onNavigate('/invoices');
    } else if (action.type === 'explore_data' && onNavigate) {
      onNavigate('/customers');
    }
  };

  const handleResetChat = () => {
    setMessages(INITIAL_MESSAGES);
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 pointer-events-none flex justify-end">
      {/* Backdrop overlay on small screens */}
      <div
        className="fixed inset-0 bg-slate-900/30 backdrop-blur-sm pointer-events-auto transition-opacity md:hidden"
        onClick={onClose}
      />

      {/* Slide-out Drawer */}
      <aside
        className="relative pointer-events-auto w-full max-w-md h-full bg-white shadow-2xl border-l border-gray-200 flex flex-col z-50 animate-slide-in-right overflow-hidden"
      >
        {/* Header */}
        <div className="px-5 py-4 border-b border-gray-200 bg-gradient-to-r from-slate-900 via-[#001c64] to-[#003087] text-white flex items-center justify-between shadow-sm">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-white/10 backdrop-blur-md flex items-center justify-center text-white border border-white/20 shadow-inner">
              <Bot className="w-5 h-5 text-sky-300" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="font-semibold text-base tracking-tight text-white">PayAssist AI</h3>
                <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
              </div>
              <p className="text-xs text-sky-200/80">Autonomous Commerce Co-Pilot</p>
            </div>
          </div>

          <div className="flex items-center gap-1.5">
            <button
              type="button"
              onClick={() => setVoiceEnabled(!voiceEnabled)}
              title={voiceEnabled ? 'Mute voice responses' : 'Enable voice responses'}
              className="p-1.5 rounded-lg text-white/70 hover:text-white hover:bg-white/10 transition-colors"
            >
              {voiceEnabled ? <Volume2 className="w-4 h-4 text-emerald-300" /> : <VolumeX className="w-4 h-4" />}
            </button>
            <button
              type="button"
              onClick={handleResetChat}
              title="Reset conversation"
              className="p-1.5 rounded-lg text-white/70 hover:text-white hover:bg-white/10 transition-colors"
            >
              <RefreshCw className="w-4 h-4" />
            </button>
            <button
              type="button"
              onClick={onClose}
              title="Close chat"
              className="p-1.5 rounded-lg text-white/70 hover:text-white hover:bg-white/10 transition-colors"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Message Area */}
        <div className="flex-1 overflow-y-auto p-4 chat-scroll bg-slate-50/60">
          {messages.map((message) => (
            <MessageBubble key={message.id} message={message} onActionClick={handleActionClick} />
          ))}

          {/* Typing Indicator */}
          {isLoading && (
            <div className="flex items-center gap-2 mb-4 animate-chat-slide-up">
              <div className="w-7 h-7 rounded-full bg-gradient-to-tr from-sky-500 to-[#009cde] flex items-center justify-center text-white text-xs">
                <Bot className="w-4 h-4" />
              </div>
              <div className="bg-white border border-gray-200 px-4 py-3 rounded-2xl rounded-tl-none shadow-sm flex items-center gap-1.5">
                <span className="w-2 h-2 rounded-full bg-blue-600 typing-dot-1" />
                <span className="w-2 h-2 rounded-full bg-sky-500 typing-dot-2" />
                <span className="w-2 h-2 rounded-full bg-[#009cde] typing-dot-3" />
                <span className="text-xs text-gray-400 font-medium ml-1.5">PayAssist is thinking...</span>
              </div>
            </div>
          )}

          <div ref={messagesEndRef} />
        </div>

        {/* Suggestion Chips */}
        <div className="p-3 bg-white border-t border-gray-100 flex gap-2 overflow-x-auto no-scrollbar">
          {SUGGESTION_CHIPS.map((chip) => (
            <button
              key={chip}
              type="button"
              disabled={isLoading}
              onClick={() => handleSend(chip)}
              className="shrink-0 text-xs text-slate-700 bg-slate-100 hover:bg-sky-50 hover:text-[#003087] hover:border-sky-300 border border-slate-200 px-3 py-1.5 rounded-full transition-all flex items-center gap-1.5 active:scale-95 disabled:opacity-50"
            >
              <Sparkles className="w-3 h-3 text-[#009cde]" />
              <span>{chip}</span>
            </button>
          ))}
        </div>

        {/* Input Bar */}
        <div className="p-3 bg-white border-t border-gray-200">
          <form
            onSubmit={(e) => {
              e.preventDefault();
              handleSend();
            }}
            className="flex items-center gap-2"
          >
            <input
              ref={inputRef}
              type="text"
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={handleKeyDown}
              placeholder="Ask PayAssist to draft invoice, analyze sales..."
              className="flex-1 bg-slate-50 border border-gray-200 focus:border-[#003087] focus:ring-2 focus:ring-blue-100 text-sm rounded-xl px-4 py-2.5 outline-none transition-all text-gray-800 placeholder-gray-400"
              disabled={isLoading}
            />

            <button
              type="button"
              onClick={toggleVoiceListen}
              title={isListening ? 'Stop listening' : 'Speak to PayAssist'}
              className={`p-2.5 rounded-xl transition-all shadow-sm flex items-center justify-center shrink-0 active:scale-95 ${
                isListening
                  ? 'bg-rose-500 text-white animate-pulse ring-4 ring-rose-200'
                  : 'bg-slate-100 hover:bg-slate-200 text-slate-700'
              }`}
            >
              {isListening ? <MicOff className="w-4 h-4" /> : <Mic className="w-4 h-4" />}
            </button>

            <button
              type="submit"
              disabled={!input.trim() || isLoading}
              className="bg-[#003087] hover:bg-[#001c64] disabled:opacity-40 disabled:hover:bg-[#003087] text-white p-2.5 rounded-xl transition-all shadow-sm flex items-center justify-center shrink-0 active:scale-95"
            >
              <Send className="w-4 h-4" />
            </button>
          </form>

          <div className="flex items-center justify-between mt-2 px-1 text-[11px] text-gray-400">
            <span>Powered by Gemini & PayPal Complete Payments</span>
            <span className="flex items-center gap-1 font-mono text-[10px]">
              <kbd className="px-1 py-0.5 bg-gray-100 rounded border border-gray-200 text-gray-600">Enter</kbd> to send
            </span>
          </div>
        </div>
      </aside>
    </div>
  );
}
