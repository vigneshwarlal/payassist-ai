import React from 'react';
import ReactMarkdown from 'react-markdown';
import { User, Bot } from 'lucide-react';
import ActionCard from './ActionCard.jsx';

export default function MessageBubble({ message, onActionClick }) {
  const isUser = message.sender === 'user';
  const timeString = message.timestamp
    ? new Date(message.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
    : new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });

  return (
    <div
      className={`flex items-start gap-2.5 mb-4 animate-chat-slide-up ${
        isUser ? 'flex-row-reverse self-end' : 'flex-row self-start'
      }`}
    >
      {/* Avatar */}
      <div
        className={`w-7 h-7 rounded-full flex items-center justify-center shrink-0 text-xs font-semibold shadow-xs ${
          isUser
            ? 'bg-[#003087] text-white ring-2 ring-blue-200'
            : 'bg-gradient-to-tr from-sky-500 to-[#009cde] text-white shadow-sm ring-2 ring-sky-100'
        }`}
      >
        {isUser ? <User className="w-4 h-4" /> : <Bot className="w-4 h-4" />}
      </div>

      {/* Bubble Container */}
      <div className={`max-w-[85%] flex flex-col ${isUser ? 'items-end' : 'items-start'}`}>
        <div
          className={`px-4 py-3 rounded-2xl text-sm leading-relaxed transition-all shadow-sm ${
            isUser
              ? 'bg-[#003087] text-white rounded-tr-none'
              : 'bg-white text-gray-800 border border-gray-200/80 rounded-tl-none shadow-xs'
          }`}
        >
          {isUser ? (
            <p className="whitespace-pre-wrap">{message.text}</p>
          ) : (
            <div className="prose prose-sm max-w-none text-gray-800 leading-normal prose-headings:font-semibold prose-headings:text-gray-900 prose-headings:my-1.5 prose-p:my-1 prose-ul:my-1 prose-li:my-0.5 prose-strong:text-gray-900 prose-code:text-[#003087] prose-code:bg-blue-50 prose-code:px-1 prose-code:py-0.5 prose-code:rounded prose-code:text-xs">
              <ReactMarkdown>{message.text}</ReactMarkdown>
            </div>
          )}

          {/* Action Card if triggered */}
          {!isUser && message.action && (
            <ActionCard action={message.action} onActionClick={onActionClick} />
          )}
        </div>

        {/* Timestamp */}
        <span className={`text-[10px] text-gray-400 mt-1 px-1 flex items-center gap-1 font-medium`}>
          {isUser ? 'You' : 'PayAssist AI'} • {timeString}
        </span>
      </div>
    </div>
  );
}
