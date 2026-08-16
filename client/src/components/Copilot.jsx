import React, { useEffect, useRef, useState } from 'react';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import useResumeStore from '../store/resumeStore';
import { ArrowDown, Bot, Send, Sparkles, Trash2, User } from 'lucide-react';

export const Copilot = () => {
  const { copilotMessages, sendCopilotMessage, clearCopilot, copilotLoading } = useResumeStore();
  const [input, setInput] = useState('');
  const [isNearBottom, setIsNearBottom] = useState(true);
  const messagesRef = useRef(null);
  const endRef = useRef(null);

  const scrollToLatest = (smooth = true) => endRef.current?.scrollIntoView({ behavior: smooth ? 'smooth' : 'auto', block: 'end' });
  const handleScroll = () => {
    const element = messagesRef.current;
    if (!element) return;
    setIsNearBottom(element.scrollHeight - element.scrollTop - element.clientHeight < 80);
  };

  useEffect(() => {
    if (isNearBottom) scrollToLatest();
  }, [copilotMessages, copilotLoading, isNearBottom]);

  const submit = () => {
    const message = input.trim();
    if (!message || copilotLoading) return;
    setInput('');
    setIsNearBottom(true);
    sendCopilotMessage(message);
  };

  const handleSubmit = (event) => { event.preventDefault(); submit(); };
  const handleKeyDown = (event) => {
    if (event.key === 'Enter' && !event.shiftKey) {
      event.preventDefault();
      submit();
    }
  };

  const starterPrompts = ['How can I improve my summary?', 'Why is my ATS score low?', 'Which skills match this JD?', 'Improve this experience bullet.'];

  return (
    <aside className="flex h-full min-h-0 flex-col overflow-hidden bg-white font-sans" aria-label="Resume Copilot">
      <header className="flex shrink-0 items-center justify-between border-b border-slate-100 px-4 py-3">
        <div className="flex items-center gap-2"><Sparkles className="h-4 w-4 text-indigo-600" /><div><h2 className="text-sm font-bold text-slate-800">Resume Copilot</h2><p className="text-[10px] text-slate-400">Grounded in your active resume</p></div></div>
        {copilotMessages.length > 0 && <button type="button" onClick={clearCopilot} className="rounded p-1.5 text-slate-400 hover:bg-slate-100 hover:text-rose-500" title="Clear chat"><Trash2 className="h-4 w-4" /></button>}
      </header>

      <div ref={messagesRef} onScroll={handleScroll} className="relative min-h-0 flex-1 overflow-y-auto p-4">
        {copilotMessages.length === 0 ? (
          <div className="flex min-h-full flex-col items-center justify-center px-3 text-center">
            <div className="mb-3 flex h-10 w-10 items-center justify-center rounded-full border border-indigo-100 bg-indigo-50"><Bot className="h-5 w-5 text-indigo-600" /></div>
            <h3 className="text-sm font-bold text-slate-700">Ask me anything about your resume.</h3>
            <p className="mt-1 max-w-xs text-xs leading-5 text-slate-400">I can help refine your story, explain ATS gaps, and identify relevant experience.</p>
            <div className="mt-5 grid w-full max-w-sm gap-2 text-left">
            {starterPrompts.map((prompt) => <button key={prompt} type="button" disabled={copilotLoading} onClick={() => { setInput(prompt); }} className="rounded-lg border border-slate-100 bg-slate-50 px-3 py-2 text-xs text-slate-600 hover:border-indigo-100 hover:bg-indigo-50 disabled:opacity-50">{prompt}</button>)}
            </div>
          </div>
        ) : (
          <div className="flex flex-col gap-4">
            {copilotMessages.map((message, index) => {
              const isUser = message.role === 'user';
              return <div key={`${message.role}-${index}`} className={`flex max-w-[94%] gap-2.5 ${isUser ? 'ml-auto flex-row-reverse' : 'mr-auto'}`}>
                <div className={`mt-0.5 flex h-7 w-7 shrink-0 items-center justify-center rounded-full border ${isUser ? 'border-slate-200 bg-slate-100 text-slate-600' : 'border-indigo-100 bg-indigo-50 text-indigo-600'}`}>{isUser ? <User className="h-3.5 w-3.5" /> : <Sparkles className="h-3.5 w-3.5" />}</div>
                <div className={`min-w-0 rounded-2xl px-3 py-2.5 text-xs leading-5 ${isUser ? 'rounded-tr-sm bg-slate-900 text-white' : 'rounded-tl-sm bg-slate-100 text-slate-700'}`}>
                  {isUser ? <p className="whitespace-pre-wrap">{message.content}</p> : <ReactMarkdown remarkPlugins={[remarkGfm]} components={{ p: ({ children }) => <p className="mb-2 last:mb-0">{children}</p>, h1: ({ children }) => <h3 className="mb-2 text-sm font-bold">{children}</h3>, h2: ({ children }) => <h4 className="mb-2 text-xs font-bold">{children}</h4>, ul: ({ children }) => <ul className="mb-2 list-disc space-y-1 pl-4 last:mb-0">{children}</ul>, ol: ({ children }) => <ol className="mb-2 list-decimal space-y-1 pl-4 last:mb-0">{children}</ol>, a: ({ ...props }) => <a {...props} target="_blank" rel="noreferrer" className="text-indigo-600 underline" />, code: ({ className, children, ...props }) => className ? <code {...props} className="my-2 block overflow-x-auto rounded bg-slate-900 p-2 font-mono text-[11px] text-slate-100">{children}</code> : <code {...props} className="rounded bg-slate-200 px-1 font-mono text-[11px]">{children}</code> }}>{message.content}</ReactMarkdown>}
                </div>
              </div>;
            })}
            {copilotLoading && <div className="flex items-center gap-2.5"><div className="flex h-7 w-7 items-center justify-center rounded-full border border-indigo-100 bg-indigo-50"><Sparkles className="h-3.5 w-3.5 animate-pulse text-indigo-600" /></div><div className="rounded-2xl rounded-tl-sm bg-slate-100 px-3 py-2 text-xs text-slate-500">Thinking…</div></div>}
            <div ref={endRef} />
          </div>
        )}
        {!isNearBottom && copilotMessages.length > 0 && <button type="button" onClick={() => { setIsNearBottom(true); scrollToLatest(); }} className="sticky bottom-2 mx-auto flex items-center gap-1 rounded-full border border-slate-200 bg-white px-3 py-1.5 text-[10px] font-semibold text-slate-600 shadow-sm"><ArrowDown className="h-3 w-3" />Jump to latest</button>}
      </div>

      <form onSubmit={handleSubmit} className="shrink-0 border-t border-slate-100 bg-white p-3">
        <div className="flex items-end gap-2 rounded-xl border border-slate-200 bg-slate-50 p-2 focus-within:ring-2 focus-within:ring-indigo-500">
          <textarea value={input} onChange={(event) => setInput(event.target.value)} onKeyDown={handleKeyDown} disabled={copilotLoading} rows={2} placeholder="Ask Copilot…" className="min-h-10 flex-1 resize-none bg-transparent px-1 py-1 text-xs leading-5 outline-none disabled:cursor-not-allowed" />
          <button type="submit" disabled={copilotLoading || !input.trim()} className="rounded-lg bg-indigo-600 p-2 text-white hover:bg-indigo-500 disabled:cursor-not-allowed disabled:opacity-50" aria-label="Send message"><Send className="h-4 w-4" /></button>
        </div>
        <p className="mt-1.5 text-[10px] text-slate-400">Enter to send · Shift + Enter for a new line</p>
      </form>
    </aside>
  );
};
