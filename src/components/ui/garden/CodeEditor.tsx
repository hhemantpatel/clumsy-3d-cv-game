import React, { useCallback, useEffect, useLayoutEffect, useRef } from 'react';
import { useGardenSim, useGardenUI } from '../../../context/GardenContext';
import { tw } from '../kit/theme';

const LINE_H = 18; // px, editor line height (must match textarea styles below)
const PAD = 8; // px, editor vertical padding

// Log tones, tuned for the light paper log strip.
const LOG_COLORS: Record<string, string> = {
  info: 'text-[#6b4730]',
  success: 'text-[#355f25] font-bold',
  harvest: 'text-[#92400e] font-semibold',
  water: 'text-[#2b6f8f]',
  warn: 'text-[#c2410c] font-semibold',
  error: 'text-[#c43a4c] font-bold',
  print: 'text-[#7c5ba6]',
};

const focusRing = 'focus:outline-none focus-visible:ring-4 focus-visible:ring-[#fde68a]';

interface CodeEditorProps {
  /** Extra control rendered at the right of the editor's tab bar (pop-out / dock button). */
  headerAction?: React.ReactNode;
  /** Bigger text for the roomy stand-alone terminal window. */
  large?: boolean;
  /** Minimum editor height in px. */
  minHeight?: number;
}

/** The chalk-slate Python editor (gutter + running-line highlight) followed by the error panel. */
export const CodeEditor: React.FC<CodeEditorProps> = ({ headerAction, large = false, minHeight = 180 }) => {
  const { isRunning } = useGardenSim();
  const { code, setCode, error, currentLine, runScript } = useGardenUI();

  const lineH = large ? LINE_H + 3 : LINE_H;
  const textSize = large ? 'text-sm' : 'text-xs';
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const gutterInnerRef = useRef<HTMLDivElement>(null);
  const highlightInnerRef = useRef<HTMLDivElement>(null);
  const escapedRef = useRef(false);
  const lineCount = code.split('\n').length;

  const syncScroll = useCallback(() => {
    const ta = textareaRef.current;
    if (!ta) return;
    if (gutterInnerRef.current) gutterInnerRef.current.style.transform = `translateY(${-ta.scrollTop}px)`;
    if (highlightInnerRef.current) {
      highlightInnerRef.current.style.transform = `translate(${-ta.scrollLeft}px, ${-ta.scrollTop}px)`;
    }
  }, []);

  // Keep the executing / error line in view.
  const focusLine = currentLine ?? error?.line ?? null;
  useLayoutEffect(() => {
    const ta = textareaRef.current;
    if (!ta || !focusLine) return;
    const top = PAD + (focusLine - 1) * lineH;
    if (top < ta.scrollTop || top + lineH > ta.scrollTop + ta.clientHeight) {
      ta.scrollTop = Math.max(0, top - ta.clientHeight / 2);
      syncScroll();
    }
  }, [focusLine, lineH, syncScroll]);

  const replaceSelection = (ta: HTMLTextAreaElement, text: string, start: number, end: number, caret: number) => {
    const next = ta.value.slice(0, start) + text + ta.value.slice(end);
    setCode(next);
    requestAnimationFrame(() => {
      if (textareaRef.current) textareaRef.current.selectionStart = textareaRef.current.selectionEnd = caret;
    });
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    const ta = e.currentTarget;
    if (e.key === 'Escape') {
      // Escape, then Tab, moves focus out of the editor (keyboard trap escape hatch).
      escapedRef.current = true;
      return;
    }
    if (e.key === 'Tab') {
      if (escapedRef.current) {
        escapedRef.current = false;
        return; // let the browser move focus
      }
      e.preventDefault();
      const { selectionStart: start, selectionEnd: end, value } = ta;
      if (e.shiftKey) {
        const lineStart = value.lastIndexOf('\n', start - 1) + 1;
        const leading = /^ {1,4}/.exec(value.slice(lineStart))?.[0].length ?? 0;
        if (leading) replaceSelection(ta, '', lineStart, lineStart + leading, Math.max(lineStart, start - leading));
        return;
      }
      replaceSelection(ta, '    ', start, end, start + 4);
      return;
    }
    escapedRef.current = false;
    if (e.key === 'Enter' && !e.shiftKey && !e.ctrlKey && !e.metaKey) {
      e.preventDefault();
      const { selectionStart: start, selectionEnd: end, value } = ta;
      const lineStart = value.lastIndexOf('\n', start - 1) + 1;
      const current = value.slice(lineStart, start);
      let indent = /^[ \t]*/.exec(current)?.[0] ?? '';
      if (/:\s*(#.*)?$/.test(current)) indent += '    ';
      replaceSelection(ta, '\n' + indent, start, end, start + 1 + indent.length);
    } else if ((e.ctrlKey || e.metaKey) && e.key === 'Enter') {
      e.preventDefault();
      runScript();
    }
  };

  return (
    <>
      {/* Chalk slate in a wooden frame, gutter + line highlight overlay */}
      <div className="flex-1 flex flex-col p-1.5 sm:p-2 bg-[#9a6a43] border-y-[3px] border-[#2b1d16]" style={{ minHeight }}>
        <div className={`flex-1 min-h-0 flex flex-col rounded-xl border-[3px] border-[#2b1d16] bg-[#2f3a33] overflow-hidden font-mono ${textSize} shadow-[inset_0_2px_0_0_rgba(0,0,0,0.25)]`}>
          <div className="px-3 py-1 bg-[#26302a] border-b-2 border-[#1c241f] flex items-center justify-between gap-2 text-[11px] text-[#b7c4b2] shrink-0">
            <span className="flex items-center gap-1.5 font-bold text-[#e6efd8]">
              <span className={`w-2.5 h-2.5 rounded-full border border-[#1c241f] ${error ? 'bg-[#f0707e]' : 'bg-[#9fd27f]'}`} />
              program.py
            </span>
            <span className="hidden sm:inline truncate flex-1 text-right">Tab indents · Esc then Tab leaves · Ctrl+Enter runs</span>
            {headerAction}
          </div>
          <div className="relative flex-1 flex min-h-0">
            <div className="w-10 shrink-0 overflow-hidden bg-[#26302a] border-r-2 border-[#1c241f] text-right text-[#7f927f] select-none" aria-hidden="true">
              <div ref={gutterInnerRef} style={{ paddingTop: PAD, paddingBottom: PAD }}>
                {Array.from({ length: lineCount }, (_, i) => (
                  <div
                    key={i}
                    style={{ height: lineH, lineHeight: `${lineH}px` }}
                    className={`pr-1.5 text-[11px] ${
                      error?.line === i + 1 ? 'text-[#f0707e] font-bold' : currentLine === i + 1 ? 'text-[#fde68a] font-bold' : ''
                    }`}
                  >
                    {i + 1}
                  </div>
                ))}
              </div>
            </div>
            <div className="relative flex-1 min-w-0">
              <div className="absolute inset-0 overflow-hidden pointer-events-none" aria-hidden="true">
                <div ref={highlightInnerRef} className="relative">
                  {currentLine && (
                    <div className="absolute left-0 w-[4000px] bg-[#fde68a]/20 border-l-[3px] border-[#fde68a]" style={{ top: PAD + (currentLine - 1) * lineH, height: lineH }} />
                  )}
                  {error && error.line > 0 && (
                    <div className="absolute left-0 w-[4000px] bg-[#c43a4c]/35 border-l-[3px] border-[#f0707e]" style={{ top: PAD + (error.line - 1) * lineH, height: lineH }} />
                  )}
                </div>
              </div>
              <textarea
                ref={textareaRef}
                value={code}
                onChange={(e) => setCode(e.target.value)}
                onKeyDown={handleKeyDown}
                onScroll={syncScroll}
                readOnly={isRunning}
                spellCheck={false}
                autoCapitalize="off"
                autoCorrect="off"
                wrap="off"
                aria-label="Python program editor"
                style={{ lineHeight: `${lineH}px`, padding: `${PAD}px 10px`, tabSize: 4 }}
                className={`absolute inset-0 w-full h-full bg-transparent text-[#eef3e2] caret-[#fde68a] font-mono ${textSize} resize-none whitespace-pre overflow-auto focus:outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-[#fde68a]/70 selection:bg-[#d97706]/50 placeholder:text-[#7f927f] ${
                  isRunning ? 'cursor-default' : ''
                }`}
                placeholder="# Write Python farming instructions here..."
              />
            </div>
          </div>
        </div>
      </div>

      {error && (
        <div role="alert" className="px-3 py-2 bg-[#fde8ea] border-b-2 border-[#c43a4c] text-xs font-mono text-[#8a1f2d] whitespace-pre-wrap break-words shrink-0">
          <span className="font-black">{error.line > 0 ? `Line ${error.line}: ` : ''}</span>
          {error.message}
        </div>
      )}
    </>
  );
};

/** Paper-strip console log. */
export const LogPanel: React.FC<{ heightClass?: string }> = ({ heightClass = 'h-24' }) => {
  const { logs, clearLogs } = useGardenUI();
  const logRef = useRef<HTMLDivElement>(null);
  useEffect(() => {
    const el = logRef.current;
    if (el) el.scrollTop = el.scrollHeight;
  }, [logs]);

  return (
    <div className="shrink-0 px-2.5 pt-2 pb-2.5">
      <div className="relative rounded-xl border-2 border-[#2b1d16]/70 bg-[#fffdf6] bg-[repeating-linear-gradient(180deg,transparent_0px,transparent_15px,rgba(124,196,228,0.25)_15px,rgba(124,196,228,0.25)_16px)] shadow-[0_2px_0_0_rgba(43,29,22,0.7)]">
        <div className="flex items-center justify-between px-2.5 pt-1">
          <span className={tw.label}>📜 Log</span>
          <button
            onClick={clearLogs}
            aria-label="Clear console log"
            title="Clear log"
            className={`text-[11px] font-bold text-[#9a6a43] hover:text-[#2b1d16] rounded px-1 cursor-pointer ${focusRing}`}
          >
            clear
          </button>
        </div>
        <div ref={logRef} className={`${heightClass} overflow-y-auto px-2.5 pb-1.5 font-mono text-[11px] leading-4`} aria-live="polite" aria-label="Console log">
          {logs.map((l) => (
            <div key={l.id} className={`whitespace-pre-wrap break-words ${LOG_COLORS[l.tone] ?? 'text-[#6b4730]'}`}>
              {l.text}
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};
