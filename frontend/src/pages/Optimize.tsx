import { useQuery } from '@tanstack/react-query';

interface Finding {
    title: string;
    explanation: string;
    impact: string;
    tokensSaved: number;
    fix: { label: string; text: string };
}

interface OptimizeResult {
    findings: Finding[];
    healthScore: number;
    healthGrade: string;
    sessionsAnalyzed: number;
}

async function fetchOptimize(): Promise<OptimizeResult> {
    const res = await fetch('/api/optimize?provider=claude');
    if (!res.ok) throw new Error(await res.text());
    return res.json();
}

export default function Optimize() {
    const { data, isLoading, error } = useQuery({
        queryKey: ['optimize'],
        queryFn: fetchOptimize,
    });

    if (isLoading) return <div className="p-6">Loading…</div>;
    if (error) return <div className="p-6 text-red-400">Failed to load data</div>;
    if (!data) return null;

    const gradeColor =
        data.healthGrade === 'A' ? 'text-green-400' :
        data.healthGrade === 'B' ? 'text-yellow-400' :
        data.healthGrade === 'C' ? 'text-orange-400' : 'text-red-400';

    return (
        <div className="p-6 max-w-4xl mx-auto space-y-6">
            <div className="flex items-center gap-4">
                <h1 className="text-xl font-semibold">Optimize</h1>
                <span className="text-muted text-sm">
                    {data.sessionsAnalyzed} sessions analyzed
                </span>
                <span className={`text-lg font-bold ${gradeColor}`}>
                    Grade {data.healthGrade}
                </span>
            </div>

            {data.findings.length === 0 && (
                <p className="text-muted">No waste detected — nice work.</p>
            )}

            {data.findings.map((f, i) => (
                <div key={i} className="bg-surface border border-border rounded-lg p-4">
                    <div className="flex items-start justify-between">
                        <div>
                            <h3 className="font-medium">{f.title}</h3>
                            <p className="text-muted text-sm mt-1">{f.explanation}</p>
                        </div>
                        <span className={`text-xs px-2 py-0.5 rounded border ${
                            f.impact === 'high' ? 'border-red-500/30 text-red-400' :
                            f.impact === 'medium' ? 'border-yellow-500/30 text-yellow-400' :
                            'border-green-500/30 text-green-400'
                        }`}>
                            {f.impact}
                        </span>
                    </div>
                    <div className="mt-3 flex items-center gap-4 text-sm text-muted">
                        <span>~{f.tokensSaved.toLocaleString()} tokens saved</span>
                    </div>
                    {f.fix && (
                        <div className="mt-3">
                            <div className="text-xs text-muted mb-1">{f.fix.label}</div>
                            <pre className="bg-background border border-border rounded p-2 text-xs overflow-x-auto">
                                {f.fix.text}
                            </pre>
                        </div>
                    )}
                </div>
            ))}
        </div>
    );
}