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
            include: { agents: { select: { id: true, name: true } } },
        });
        if (!user || user.agents.length === 0) {
            return NextResponse.json({ trades: [] });
        }

        const agentIds = user.agents.map((a) => a.id);
        const agentNames = Object.fromEntries(
            user.agents.map((a) => [a.id, a.name])
        );

        const trades = await prisma.trade.findMany({
            where: { agentId: { in: agentIds } },
            include: { market: true },
            orderBy: { timestamp: "desc" },
            take: 20,
        });

        const formatted = trades.map((t) => ({
            id: t.id,
            agentId: t.agentId,
            agentName: agentNames[t.agentId] ?? "",
            marketId: t.marketId,
            marketTitle: t.market.title,
            direction: t.direction,
            amount: t.amount,
            price: t.price,
            txHash: t.txHash ?? "",
            status: t.status,
            pnl: t.pnl,
            gasUsed: t.gasUsed ?? "0",
            blockNumber: t.blockNumber ?? 0,
            timestamp: t.timestamp.toISOString(),
        }));

        return NextResponse.json({ trades: formatted });
    } catch (err) {
        console.error("GET /api/portfolio/trades:", err);
        return NextResponse.json(
            { message: "Failed to fetch trades" },
            { status: 500 }
        );
    }
}
