export interface DailyBar {
    date: string;
    cost: number;
    calls: number;
}

export interface ModelBreakdown {
    model: string;
    calls: number;
    cost: number;
    tokens: number;
}

export interface ActivityBreakdown {
    category: string;
    cost: number;
    calls: number;
    oneShotRate: number;
    retries: number;
}

export interface DashboardData {
    overview: {
        totalCost: number;
        totalCalls: number;
        totalSessions: number;
    };
    daily: DailyBar[];
    models: ModelBreakdown[];
    activities: ActivityBreakdown[];
    projects: {
        name: string;
        cost: number;
        sessions: number;
        calls: number;
    }[];
}

export async function fetchReport(provider: string = 'claude'): Promise<DashboardData> {
    const res = await fetch(`/api/report?provider=${provider}`);
    if (!res.ok) throw new Error(await res.text());
    return res.json();
}

// Compare types
export interface ComparisonRow {
    metric: string;
    modelA: string | number;
    modelB: string | number;
    better: 'A' | 'B' | 'tie';
}

export interface CategoryComparison {
    category: string;
    modelA_oneShotRate: number;
    modelB_oneShotRate: number;
    modelA_calls: number;
    modelB_calls: number;
}

export interface WorkingStyleRow {
    metric: string;
    modelA: string | number;
    modelB: string | number;
}

export interface CompareData {
    modelA: { model: string; calls: number; totalCost: number };
    modelB: { model: string; calls: number; totalCost: number };
    comparison: ComparisonRow[];
    categoryComparison: CategoryComparison[];
    workingStyle: WorkingStyleRow[];
}

export async function fetchCompare(
    modelA: string,
    modelB: string,
    provider: string = 'claude'
): Promise<CompareData> {
    const res = await fetch(
        `/api/compare?provider=${provider}&model_a=${encodeURIComponent(modelA)}&model_b=${encodeURIComponent(modelB)}`
    );
    if (!res.ok) throw new Error(await res.text());
    return res.json();
}