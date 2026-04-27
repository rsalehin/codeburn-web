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