import { useQuery } from '@tanstack/react-query';
import { fetchReport } from '../lib/api';
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer } from 'recharts';

export default function Dashboard() {
    const { data, isLoading, error } = useQuery({
        queryKey: ['report', 'claude'],
        queryFn: () => fetchReport('claude'),
        refetchInterval: 30_000,
    });

    if (isLoading) return <div className="p-6">Loading…</div>;
    if (error) return <div className="p-6 text-red-400">Failed to load data</div>;
    if (!data) return null;

    return (
        <div className="p-6 space-y-8 max-w-6xl mx-auto">
            {/* Overview */}
            <div className="grid grid-cols-3 gap-4">
                <div className="bg-surface border border-border rounded-lg p-4">
                    <div className="text-muted text-sm">Total Cost</div>
                    <div className="text-2xl font-semibold mt-1">${data.overview.totalCost.toFixed(2)}</div>
                </div>
                <div className="bg-surface border border-border rounded-lg p-4">
                    <div className="text-muted text-sm">API Calls</div>
                    <div className="text-2xl font-semibold mt-1">{data.overview.totalCalls}</div>
                </div>
                <div className="bg-surface border border-border rounded-lg p-4">
                    <div className="text-muted text-sm">Sessions</div>
                    <div className="text-2xl font-semibold mt-1">{data.overview.totalSessions}</div>
                </div>
            </div>

            {/* Daily Chart */}
            <div className="bg-surface border border-border rounded-lg p-4">
                <h2 className="text-base font-medium mb-3">Daily Cost</h2>
                <ResponsiveContainer width="100%" height={240}>
                    <BarChart data={data.daily}>
                        <XAxis dataKey="date" stroke="#8e8e93" fontSize={12} />
                        <YAxis stroke="#8e8e93" fontSize={12} />
                        <Tooltip
                            contentStyle={{ background: '#2c2c2e', border: '1px solid #3a3a3c', borderRadius: 8 }}
                            labelStyle={{ color: '#f2f2f7' }}
                        />
                        <Bar dataKey="cost" fill="#0a84ff" radius={[4, 4, 0, 0]} />
                    </BarChart>
                </ResponsiveContainer>
            </div>

            {/* Two-column tables */}
            <div className="grid grid-cols-2 gap-4">
                {/* Models */}
                <div className="bg-surface border border-border rounded-lg p-4">
                    <h2 className="text-base font-medium mb-2">Models</h2>
                    <table className="w-full text-sm">
                        <thead>
                            <tr className="text-muted border-b border-border">
                                <th className="text-left py-1">Model</th>
                                <th className="text-right py-1">Cost</th>
                                <th className="text-right py-1">Calls</th>
                            </tr>
                        </thead>
                        <tbody>
                            {data.models.map(m => (
                                <tr key={m.model} className="border-b border-border/50">
                                    <td className="py-1.5">{m.model}</td>
                                    <td className="text-right">${m.cost.toFixed(2)}</td>
                                    <td className="text-right">{m.calls}</td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>

                {/* Activities */}
                <div className="bg-surface border border-border rounded-lg p-4">
                    <h2 className="text-base font-medium mb-2">Activity</h2>
                    <table className="w-full text-sm">
                        <thead>
                            <tr className="text-muted border-b border-border">
                                <th className="text-left py-1">Category</th>
                                <th className="text-right py-1">Cost</th>
                                <th className="text-right py-1">1‑Shot</th>
                            </tr>
                        </thead>
                        <tbody>
                            {data.activities.map(a => (
                                <tr key={a.category} className="border-b border-border/50">
                                    <td className="py-1.5">{a.category}</td>
                                    <td className="text-right">${a.cost.toFixed(2)}</td>
                                    <td className="text-right">
                                        <span className={
                                            a.oneShotRate >= 0.9 ? 'text-green-400' :
                                            a.oneShotRate >= 0.7 ? 'text-yellow-400' : 'text-red-400'
                                        }>
                                            {(a.oneShotRate * 100).toFixed(0)}%
                                        </span>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            </div>
        </div>
    );
}