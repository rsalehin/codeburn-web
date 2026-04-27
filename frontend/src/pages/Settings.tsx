import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { fetchSettings, updatePlan, updateCurrency, addModelAlias, removeModelAlias } from '../lib/api';

const PLANS = ['none', 'claude_pro', 'claude_max', 'cursor_pro', 'custom'];
const CURRENCIES = ['USD', 'EUR', 'GBP', 'JPY', 'AUD', 'CAD', 'CHF', 'CNY', 'SEK', 'NZD', 'MXN', 'SGD', 'HKD', 'NOK', 'KRW', 'TRY', 'RUB', 'INR', 'BRL', 'ZAR'];

export default function Settings() {
    const queryClient = useQueryClient();
    const { data } = useQuery({ queryKey: ['settings'], queryFn: fetchSettings });

    const planMutation = useMutation({
        mutationFn: (args: { plan: string; monthlyUsd?: number }) => updatePlan(args.plan, args.monthlyUsd),
        onSuccess: () => queryClient.invalidateQueries({ queryKey: ['settings'] }),
    });

    const currencyMutation = useMutation({
        mutationFn: (currency: string) => updateCurrency(currency),
        onSuccess: () => queryClient.invalidateQueries({ queryKey: ['settings'] }),
    });

    const aliasAddMutation = useMutation({
        mutationFn: (args: { from: string; to: string }) => addModelAlias(args.from, args.to),
        onSuccess: () => queryClient.invalidateQueries({ queryKey: ['settings'] }),
    });

    const aliasRemoveMutation = useMutation({
        mutationFn: (from: string) => removeModelAlias(from),
        onSuccess: () => queryClient.invalidateQueries({ queryKey: ['settings'] }),
    });

    const [newAliasFrom, setNewAliasFrom] = useState('');
    const [newAliasTo, setNewAliasTo] = useState('');

    return (
        <div className="p-6 max-w-lg mx-auto space-y-8">
            <h1 className="text-xl font-semibold">Settings</h1>

            {/* Plan */}
            <section>
                <h2 className="text-sm text-muted mb-2">Subscription Plan</h2>
                <select
                    value={data?.plan || 'none'}
                    onChange={e => planMutation.mutate({ plan: e.target.value })}
                    className="w-full bg-surface border border-border rounded px-3 py-1.5 text-sm text-text mb-2"
                >
                    {PLANS.map(p => (
                        <option key={p} value={p}>{p}</option>
                    ))}
                </select>
                {data?.plan === 'custom' && (
                    <input
                        type="number"
                        placeholder="Monthly USD"
                        value={data.monthlyUsd || ''}
                        onChange={e => planMutation.mutate({ plan: 'custom', monthlyUsd: Number(e.target.value) })}
                        className="w-full bg-surface border border-border rounded px-3 py-1.5 text-sm text-text"
                    />
                )}
            </section>

            {/* Currency */}
            <section>
                <h2 className="text-sm text-muted mb-2">Display Currency</h2>
                <select
                    value={data?.currency || 'USD'}
                    onChange={e => currencyMutation.mutate(e.target.value)}
                    className="w-full bg-surface border border-border rounded px-3 py-1.5 text-sm text-text"
                >
                    {CURRENCIES.map(c => (
                        <option key={c} value={c}>{c}</option>
                    ))}
                </select>
            </section>

            {/* Model Aliases */}
            <section>
                <h2 className="text-sm text-muted mb-2">Model Aliases</h2>
                {data?.modelAliases && Object.keys(data.modelAliases).length > 0 ? (
                    <ul className="space-y-1 mb-4">
                        {Object.entries(data.modelAliases).map(([from, to]) => (
                            <li key={from} className="flex items-center justify-between text-sm bg-surface border border-border rounded px-3 py-1.5">
                                <span>{from} → {to}</span>
                                <button
                                    onClick={() => aliasRemoveMutation.mutate(from)}
                                    className="text-muted hover:text-red-400 ml-4"
                                >
                                    Remove
                                </button>
                            </li>
                        ))}
                    </ul>
                ) : (
                    <p className="text-muted text-sm mb-3">No aliases defined.</p>
                )}
                <div className="flex gap-2">
                    <input
                        placeholder="from model"
                        value={newAliasFrom}
                        onChange={e => setNewAliasFrom(e.target.value)}
                        className="flex-1 bg-surface border border-border rounded px-3 py-1.5 text-sm text-text"
                    />
                    <input
                        placeholder="to model"
                        value={newAliasTo}
                        onChange={e => setNewAliasTo(e.target.value)}
                        className="flex-1 bg-surface border border-border rounded px-3 py-1.5 text-sm text-text"
                    />
                    <button
                        onClick={() => {
                            if (newAliasFrom && newAliasTo) {
                                aliasAddMutation.mutate({ from: newAliasFrom, to: newAliasTo });
                                setNewAliasFrom('');
                                setNewAliasTo('');
                            }
                        }}
                        className="bg-primary text-white text-sm px-4 py-1.5 rounded hover:opacity-90"
                    >
                        Add
                    </button>
                </div>
            </section>
        </div>
    );
}