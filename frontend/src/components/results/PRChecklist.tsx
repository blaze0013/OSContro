import { useState } from 'react';

interface PRChecklistProps {
  items: string[];
}

export function PRChecklist({ items }: PRChecklistProps) {
  const [checkedItems, setCheckedItems] = useState<Set<number>>(new Set());
  const [copied, setCopied] = useState(false);

  const toggleItem = (index: number) => {
    const newChecked = new Set(checkedItems);
    if (newChecked.has(index)) {
      newChecked.delete(index);
    } else {
      newChecked.add(index);
    }
    setCheckedItems(newChecked);
  };

  const copyAsMarkdown = () => {
    const text = items.map((item, i) => `- [${checkedItems.has(i) ? 'x' : ' '}] ${item}`).join('\n');
    navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const progress = Math.round((checkedItems.size / items.length) * 100) || 0;

  return (
    <div className="bg-[var(--color-surface)] rounded-[12px] border border-[var(--color-border-strong)] shadow-[var(--shadow-warm)] overflow-hidden" id="checklist">
      <div className="p-6 border-b border-[var(--color-border-strong)] bg-[var(--color-raised)] flex items-center justify-between">
        <div>
          <h2 className="text-xl font-bold text-[var(--color-text-primary)] flex items-center">
            <svg className="w-5 h-5 mr-2 text-[var(--color-accent)]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-6 9l2 2 4-4" />
            </svg>
            First PR Checklist
          </h2>
        </div>
        
        <button
          onClick={copyAsMarkdown}
          className="inline-flex items-center text-xs font-semibold text-[var(--color-text-primary)] bg-[var(--color-page)] border border-[var(--color-border-soft)] hover:bg-[var(--color-border-soft)] px-3 py-1.5 rounded-[6px] transition-colors shadow-sm"
        >
          {copied ? (
            <>
              <svg className="w-4 h-4 mr-1.5 text-[var(--color-badge-beginner-text)]" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
              </svg>
              Copied!
            </>
          ) : (
            <>
              <svg className="w-4 h-4 mr-1.5 text-[var(--color-text-secondary)]" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z" />
              </svg>
              Copy as Markdown
            </>
          )}
        </button>
      </div>

      <div className="p-6">
        <div className="mb-4 flex items-center justify-between text-sm">
          <span className="text-[var(--color-text-secondary)] font-medium">Progress</span>
          <span className="font-semibold text-[var(--color-text-primary)]">{checkedItems.size} of {items.length} completed</span>
        </div>
        <div className="w-full bg-[var(--color-page)] border border-[var(--color-border-soft)] rounded-full h-2 mb-6 overflow-hidden">
          <div className="bg-[var(--color-accent)] h-full transition-all duration-300" style={{ width: `${progress}%` }}></div>
        </div>

        <ul className="space-y-3">
          {items.map((item, index) => {
            const isChecked = checkedItems.has(index);
            return (
              <li key={index} className="flex items-start">
                <div className="flex items-center h-5">
                  <input
                    id={`checklist-${index}`}
                    type="checkbox"
                    checked={isChecked}
                    onChange={() => toggleItem(index)}
                    className="w-4 h-4 rounded border-[var(--color-border-strong)] bg-[var(--color-page)] text-[var(--color-accent)] focus:ring-[var(--color-accent)] focus:ring-offset-[var(--color-surface)] cursor-pointer"
                  />
                </div>
                <label
                  htmlFor={`checklist-${index}`}
                  className={`ml-3 text-sm cursor-pointer transition-colors ${isChecked ? 'text-[var(--color-text-secondary)] line-through' : 'text-[var(--color-text-primary)] hover:text-[var(--color-accent)]'}`}
                >
                  {item}
                </label>
              </li>
            );
          })}
        </ul>
      </div>
    </div>
  );
}
