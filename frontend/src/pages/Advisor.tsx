import { useState } from 'react';
import { useMutation } from '@tanstack/react-query';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import { fetchAdvisor } from '../lib/api';

function MarkdownRenderer({ content }: { content: string }) {
    return (
        <ReactMarkdown
            remarkPlugins={[remarkGfm]}
            components={{
                h1: ({ children }) => <h1 className="text-lg font-semibold mt-6 mb-2 first:mt-0">{children}</h1>,
                h2: ({ children }) => <h2 className="text-base font-semibold mt-5 mb-2 first:mt-0">{children}</h2>,
                h3: ({ children }) => <h3 className="text-sm font-semibold mt-4 mb-1.5 first:mt-0 text-text">{children}</h3>,
                p: ({ children }) => <p className="text-sm leading-relaxed mb-2 last:mb-0">{children}</p>,
                ul: ({ children }) => <ul className="list-disc pl-5 mb-2 space-y-0.5 text-sm">{children}</ul>,
                ol: ({ children }) => <ol className="list-decimal pl-5 mb-2 space-y-0.5 text-sm">{children}</ol>,
                li: ({ children }) => <li className="text-sm">{children}</li>,
                strong: ({ children }) => <strong className="font-semibold text-text">{children}</strong>,
                em: ({ children }) => <em className="italic">{children}</em>,
                code: ({ className, children, ...props }: any) => {
                    const isInline = !className;
                    return isInline ? (
                        <code className="bg-background border border-border rounded px-1.5 py-0.5 text-xs font-mono" {...props}>
                            {children}
                        </code>
                    ) : (
                        <code className={`block bg-background border border-border rounded p-3 text-xs font-mono overflow-x-auto my-2 ${className || ''}`} {...props}>
                            {children}
                        </code>
                    );
                },
                pre: ({ children }) => <pre className="bg-background border border-border rounded p-3 text-xs font-mono overflow-x-auto my-2">{children}</pre>,
                blockquote: ({ children }) => (
                    <blockquote className="border-l-2 border-primary pl-3 my-2 text-sm text-muted italic">{children}</blockquote>
                ),
                hr: () => <hr className="border-border my-4" />,
                a: ({ href, children }) => (
                    <a href={href} className="text-primary hover:underline text-sm" target="_blank" rel="noopener noreferrer">
                        {children}
                    </a>
                ),
                table: ({ children }) => (
                    <div className="overflow-x-auto my-3">
                        <table className="w-full text-sm border border-border rounded">{children}</table>
                    </div>
                ),
                thead: ({ children }) => <thead className="bg-surface">{children}</thead>,
                th: ({ children }) => <th className="text-left px-3 py-1.5 border-b border-border font-medium text-muted">{children}</th>,
                td: ({ children }) => <td className="px-3 py-1.5 border-b border-border/50">{children}</td>,
                tr: ({ children }) => <tr className="border-b border-border/30 last:border-0">{children}</tr>,
            }}
        >
            {content}
        </ReactMarkdown>
    );
}

export default function Advisor() {
    const [query, setQuery] = useState('');
    const [qa, setQA] = useState<{ question: string; answer: string }[]>([]);

    const mutation = useMutation({
        mutationFn: (q: string) => fetchAdvisor(q),
        onSuccess: (text, question) => {
            setQA(prev => [...prev, { question, answer: text }]);
            setQuery('');
        },
    });

    return (
        <div className="p-6 max-w-3xl mx-auto space-y-6">
            <h1 className="text-xl font-semibold">Cost Advisor</h1>
            <p className="text-muted text-sm">
                Ask anything about your spending, efficiency, or waste — Claude answers with specifics from your data.
            </p>

            {/* Input area */}
            <div className="flex gap-2">
                <input
                    value={query}
                    onChange={e => setQuery(e.target.value)}
                    onKeyDown={e => {
                        if (e.key === 'Enter' && query.trim() && !mutation.isPending) {
                            mutation.mutate(query.trim());
                        }
                    }}
                    placeholder="e.g. Where am I wasting the most money?"
                    className="flex-1 bg-surface border border-border rounded px-4 py-2 text-sm text-text"
                    disabled={mutation.isPending}
                />
                <button
                    onClick={() => query.trim() && mutation.mutate(query.trim())}
                    disabled={mutation.isPending || !query.trim()}
                    className="bg-primary text-white text-sm px-4 py-2 rounded hover:opacity-90 disabled:opacity-50"
                >
                    {mutation.isPending ? 'Thinking…' : 'Ask'}
                </button>
            </div>

            {mutation.error && (
                <div className="text-red-400 text-sm bg-surface border border-red-500/20 rounded p-3">
                    {mutation.error instanceof Error ? mutation.error.message : 'Unknown error'}
                </div>
            )}

            {/* Q&A history */}
            <div className="space-y-6">
                {qa.map((item, i) => (
                    <div key={i} className="space-y-3">
                        <div className="bg-surface border border-primary/20 rounded-lg p-3">
                            <div className="text-xs text-muted mb-1">You asked</div>
                            <p className="text-sm">{item.question}</p>
                        </div>
                        <div className="bg-surface border border-border rounded-lg p-4">
                            <div className="text-xs text-muted mb-2">Advisor response</div>
                            <MarkdownRenderer content={item.answer} />
                        </div>
                    </div>
                ))}

                {mutation.isPending && (
                    <div className="bg-surface border border-border rounded-lg p-4">
                        <div className="flex items-center gap-2 text-muted text-sm">
                            <div className="w-2 h-2 bg-primary rounded-full animate-pulse" />
                            Analyzing your data…
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
}