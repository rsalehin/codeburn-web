import type { ProjectSummary, SessionSummary, TaskCategory, CATEGORY_LABELS } from './core/types.js';

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

export function buildDashboardData(projects: ProjectSummary[]): DashboardData {
    const dailyMap = new Map<string, { cost: number; calls: number }>();
    const modelMap = new Map<string, { calls: number; cost: number; tokens: number }>();
    const activityMap = new Map<string, { cost: number; calls: number; oneShots: number; retries: number }>();
    let totalCost = 0;
    let totalCalls = 0;

    for (const project of projects) {
        for (const session of project.sessions) {
            totalCost += session.totalCostUSD;
            totalCalls += session.apiCalls;

            // Daily aggregation – use first session timestamp as date
            const date = session.firstTimestamp.slice(0, 10);
            if (!dailyMap.has(date)) dailyMap.set(date, { cost: 0, calls: 0 });
            const d = dailyMap.get(date)!;
            d.cost += session.totalCostUSD;
            d.calls += session.apiCalls;

            // Model breakdown
            for (const [model, info] of Object.entries(session.modelBreakdown)) {
                if (!modelMap.has(model)) modelMap.set(model, { calls: 0, cost: 0, tokens: 0 });
                const m = modelMap.get(model)!;
                m.calls += info.calls;
                m.cost += info.costUSD;
                m.tokens += info.tokens.inputTokens + info.tokens.outputTokens;
            }

            // Activity/category breakdown
            for (const [cat, info] of Object.entries(session.categoryBreakdown) as [string, any][]) {
                if (!activityMap.has(cat)) activityMap.set(cat, { cost: 0, calls: 0, oneShots: 0, retries: 0 });
                const a = activityMap.get(cat)!;
                a.cost += info.costUSD;
                a.calls += info.turns;
                a.oneShots += info.oneShotTurns;
                a.retries += info.retries;
            }
        }
    }

    return {
        overview: {
            totalCost,
            totalCalls,
            totalSessions: projects.reduce((s, p) => s + p.sessions.length, 0),
        },
        daily: [...dailyMap.entries()]
            .map(([date, v]) => ({ date, cost: v.cost, calls: v.calls }))
            .sort((a, b) => a.date.localeCompare(b.date)),
        models: [...modelMap.entries()]
            .map(([model, v]) => ({ model, ...v }))
            .sort((a, b) => b.cost - a.cost),
        activities: [...activityMap.entries()]
            .map(([category, v]) => ({
                category,
                cost: v.cost,
                calls: v.calls,
                oneShotRate: v.calls > 0 ? v.oneShots / v.calls : 0,
                retries: v.retries,
            }))
            .sort((a, b) => b.cost - a.cost),
        projects: projects
            .map(p => ({
                name: p.project,
                cost: p.totalCostUSD,
                sessions: p.sessions.length,
                calls: p.totalApiCalls,
            }))
            .sort((a, b) => b.cost - a.cost),
    };
}