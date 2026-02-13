import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";

export async function GET(request: NextRequest) {
    try {
        const { searchParams } = new URL(request.url);
        const walletAddress = searchParams.get("walletAddress");
        if (!walletAddress) {
            return NextResponse.json(
                { message: "walletAddress required" },
                { status: 400 }
            );
        }

        const user = await prisma.user.findUnique({
            where: { walletAddress },
            include: { agents: true },
        });
        if (!user || user.agents.length === 0) {
            return NextResponse.json({
                totalCapital: 0,
                totalPnl: 0,
                totalPnlPercent: 0,
                activeAgents: 0,
                totalAgents: 0,
                totalTrades: 0,
                avgWinRate: 0,
            });
        }

        const agents = user.agents;
        const totalCapital = agents.reduce((s, a) => s + a.capitalAllocated, 0);
        const totalPnl = agents.reduce((s, a) => s + a.pnl, 0);
        const totalPnlPercent =
            totalCapital > 0 ? (totalPnl / totalCapital) * 100 : 0;
        const activeAgents = agents.filter((a) => a.status === "active").length;
        const totalTrades = agents.reduce((s, a) => s + a.totalTrades, 0);
        const avgWinRate =
            agents.length > 0
                ? agents.reduce((s, a) => s + a.winRate, 0) / agents.length
                : 0;

        return NextResponse.json({
            totalCapital,
            totalPnl,
            totalPnlPercent,
            activeAgents,
            totalAgents: agents.length,
            totalTrades,
            avgWinRate,
        });
    } catch (err) {
        console.error("GET /api/portfolio/stats:", err);
        return NextResponse.json(
            { message: "Failed to fetch portfolio stats" },
            { status: 500 }
        );
    }
}
