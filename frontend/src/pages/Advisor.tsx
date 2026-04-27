import { useState } from 'react';
import { useMutation } from '@tanstack/react-query';
import { fetchAdvisor } from '../lib/api';

export default function Advisor() {
    const [query, setQuery] = useState('');
    const [answers, setAnswers] = useState<string[]>([]);

    const mutation = useMutation({
        mutationFn: (q: string) => fetchAdvisor(q),
        onSuccess: (text) => {
            setAnswers(prev => [...prev, text]);
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
                        if (e.key === 'Enter' && query.trim()) {
                            mutation.mutate(query.trim());
                        }
                    }}
                    placeholder="e.g. Where am I wasting the most money?"
                    className="flex-1 bg-surface border border-border rounded px-4 py-2 text-sm text-text"
                    disabled={mutation.isPending}
                />
                <button
                    onClick={() => mutation.mutate(query.trim())}
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

            {/* Answers */}
            <div className="space-y-4">
                {answers.map((a, i) => (
                    <div key={i} className="bg-surface border border-border rounded-lg p-4">
                        <pre className="text-sm text-text whitespace-pre-wrap font-sans">{a}</pre>
                    </div>
                ))}
            </div>
        </div>
    );
}