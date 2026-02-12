// ─── User ───
export interface User {
    id: string;
    email: string;
    walletAddress: string;
    displayName: string;
    avatarUrl?: string;
    createdAt: string;
}

// ─── Agent ───
export type StrategyType = "momentum" | "contrarian" | "balanced";
export type RiskLevel = "conservative" | "moderate" | "aggressive";
export type AgentStatus = "active" | "paused" | "deploying" | "stopped";
export type MarketRegion = "nigeria" | "south-africa" | "kenya" | "ghana" | "ethiopia" | "pan-african";
export type MarketCategory = "elections" | "policy" | "economics" | "diplomacy";

export interface Agent {
    id: string;
    userId: string;
    name: string;
    walletAddress: string;
    strategyType: StrategyType;
    riskLevel: RiskLevel;
    marketFocus: {
        regions: MarketRegion[];
        categories: MarketCategory[];
    };
    maxTradeSize: number;
    dailyLossLimit: number;
    positionLimit: number;
    capitalAllocated: number;
    capitalUsed: number;
    status: AgentStatus;
    pnl: number;
    pnlPercent: number;
    winRate: number;
    totalTrades: number;
    openPositions: number;
    lastTradeAt: string | null;
    deployedAt: string;
    createdAt: string;
}

// ─── Trade ───
export type TradeDirection = "buy" | "sell";
export type TradeStatus = "executed" | "pending" | "failed";

export interface Trade {
    id: string;
    agentId: string;
    agentName: string;
    marketId: string;
    marketTitle: string;
    direction: TradeDirection;
    amount: number;
    price: number;
    txHash: string;
    status: TradeStatus;
    pnl: number | null;
    gasUsed: string;
    blockNumber: number;
    timestamp: string;
}

// ─── Position ───
export type PositionStatus = "open" | "closed";

export interface Position {
    id: string;
    agentId: string;
    marketId: string;
    marketTitle: string;
    direction: TradeDirection;
    entryPrice: number;
    currentPrice: number;
    amount: number;
    unrealizedPnl: number;
    unrealizedPnlPercent: number;
    status: PositionStatus;
    openedAt: string;
    closedAt: string | null;
}

// ─── Market ───
export type MarketStatus = "active" | "resolved" | "upcoming";

export interface PoliticalMarket {
    id: string;
    title: string;
    description: string;
    category: MarketCategory;
    region: MarketRegion;
    probability: number;
    volume: number;
    totalTraders: number;
    status: MarketStatus;
    resolution: string | null;
    endDate: string;
    createdAt: string;
}

// ─── Performance ───
export interface PerformanceDataPoint {
    date: string;
    pnl: number;
    cumulative: number;
    trades: number;
}

// ─── Agent Config (for create form) ───
export interface AgentConfig {
    name: string;
    strategyType: StrategyType;
    riskLevel: RiskLevel;
    regions: MarketRegion[];
    categories: MarketCategory[];
    maxTradeSize: number;
    dailyLossLimit: number;
    positionLimit: number;
    capitalAllocated: number;
}
