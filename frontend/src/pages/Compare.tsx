import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { fetchReport, fetchCompare } from '../lib/api';

export default function Compare() {
    const [modelA, setModelA] = useState('');
    const [modelB, setModelB] = useState('');

    const { data: report } = useQuery({
        queryKey: ['report', 'claude'],
        queryFn: () => fetchReport('claude'),
    });

    const models = report?.models.map(m => m.model) ?? [];

    const { data: compare, isLoading, error } = useQuery({
        queryKey: ['compare', modelA, modelB],
        queryFn: () => fetchCompare(modelA, modelB),
        enabled: modelA !== '' && modelB !== '' && modelA !== modelB,
    });

    return (
        <div className="p-6 max-w-4xl mx-auto space-y-6">
            <h1 className="text-xl font-semibold">Model Compare</h1>

            {models.length < 2 ? (
                <p className="text-muted">
                    Need data from two different models to compare.
                    Current data has {models.length === 0 ? 'no models' : `only ${models[0]}`}.
                </p>
            ) : (
                <>
                    <div className="flex items-center gap-4">
                        <select
                            value={modelA}
                            onChange={e => setModelA(e.target.value)}
                            className="bg-surface border border-border rounded px-3 py-1.5 text-sm text-text"
                        >
                            <option value="">Select model A…</option>
                            {models.map(m => (
                                <option key={m} value={m}>{m}</option>
                            ))}
                        </select>
                        <span className="text-muted text-sm">vs</span>
                        <select
                            value={modelB}
                            onChange={e => setModelB(e.target.value)}
                            className="bg-surface border border-border rounded px-3 py-1.5 text-sm text-text"
                        >
                            <option value="">Select model B…</option>
                            {models.map(m => (
                                <option key={m} value={m}>{m}</option>
                            ))}
                        </select>
                    </div>

                    {isLoading && <div>Loading comparison…</div>}
                    {error && <div className="text-red-400">Failed to compare</div>}

                    {compare && (
                        <div className="space-y-6">
                            {/* Summary cards */}
                            <div className="grid grid-cols-2 gap-4">
                                <div className="bg-surface border border-border rounded-lg p-4">
                                    <div className="text-muted text-sm">{compare.modelA.model}</div>
                                    <div className="text-lg font-semibold mt-1">${compare.modelA.totalCost.toFixed(2)}</div>
                                    <div className="text-muted text-sm">{compare.modelA.calls} calls</div>
                                </div>
                                <div className="bg-surface border border-border rounded-lg p-4">
                                    <div className="text-muted text-sm">{compare.modelB.model}</div>
                                    <div className="text-lg font-semibold mt-1">${compare.modelB.totalCost.toFixed(2)}</div>
                                    <div className="text-muted text-sm">{compare.modelB.calls} calls</div>
                                </div>
                            </div>

                            {/* Performance comparison */}
                            <div className="bg-surface border border-border rounded-lg p-4">
                                <h2 className="text-base font-medium mb-2">Performance</h2>
                                <table className="w-full text-sm">
                                    <thead>
                                        <tr className="text-muted border-b border-border">
                                            <th className="text-left py-1">Metric</th>
                                            <th className="text-right py-1">{compare.modelA.model}</th>
                                            <th className="text-right py-1">{compare.modelB.model}</th>
                                        </tr>
                                    </thead>
                                    <tbody>
                                        {compare.comparison.map((row, i) => (
                                            <tr key={i} className="border-b border-border/50">
                                                <td className="py-1.5">{row.metric}</td>
                                                <td className={`text-right ${row.better === 'A' ? 'text-green-400' : ''}`}>
                                                    {typeof row.modelA === 'number' ? row.modelA.toFixed(4) : row.modelA}
                                                </td>
                                                <td className={`text-right ${row.better === 'B' ? 'text-green-400' : ''}`}>
                                                    {typeof row.modelB === 'number' ? row.modelB.toFixed(4) : row.modelB}
                                                </td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            </div>

                            {/* Category comparison */}
                            <div className="bg-surface border border-border rounded-lg p-4">
                                <h2 className="text-base font-medium mb-2">One-Shot Rate by Category</h2>
                                <table className="w-full text-sm">
                                    <thead>
                                        <tr className="text-muted border-b border-border">
                                            <th className="text-left py-1">Category</th>
                                            <th className="text-right py-1">{compare.modelA.model}</th>
                                            <th className="text-right py-1">{compare.modelB.model}</th>
                                        </tr>
                                    </thead>
                                    <tbody>
                                        {compare.categoryComparison.map((row, i) => (
                                            <tr key={i} className="border-b border-border/50">
                                                <td className="py-1.5">{row.category}</td>
                                                <td className={`text-right ${row.modelA_oneShotRate >= 0.9 ? 'text-green-400' : row.modelA_oneShotRate >= 0.7 ? 'text-yellow-400' : 'text-red-400'}`}>
                                                    {(row.modelA_oneShotRate * 100).toFixed(0)}%
                                                </td>
                                                <td className={`text-right ${row.modelB_oneShotRate >= 0.9 ? 'text-green-400' : row.modelB_oneShotRate >= 0.7 ? 'text-yellow-400' : 'text-red-400'}`}>
                                                    {(row.modelB_oneShotRate * 100).toFixed(0)}%
                                                </td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            </div>

                            {/* Working style */}
                            <div className="bg-surface border border-border rounded-lg p-4">
                                <h2 className="text-base font-medium mb-2">Working Style</h2>
                                <table className="w-full text-sm">
                                    <thead>
                                        <tr className="text-muted border-b border-border">
                                            <th className="text-left py-1">Metric</th>
                                            <th className="text-right py-1">{compare.modelA.model}</th>
                                            <th className="text-right py-1">{compare.modelB.model}</th>
                                        </tr>
                                    </thead>
                                    <tbody>
                                        {compare.workingStyle.map((row, i) => (
                                            <tr key={i} className="border-b border-border/50">
                                                <td className="py-1.5">{row.metric}</td>
                                                <td className="text-right">{typeof row.modelA === 'number' ? row.modelA.toFixed(2) : row.modelA}</td>
                                                <td className="text-right">{typeof row.modelB === 'number' ? row.modelB.toFixed(2) : row.modelB}</td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            </div>
                        </div>
                    )}
                </>
            )}
        </div>
    );
}