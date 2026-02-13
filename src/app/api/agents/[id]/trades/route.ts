import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";

export async function GET(
    _request: NextRequest,
    { params }: { params: Promise<{ id: string }> }
) {
    try {
        const { id } = await params;
        const trades = await prisma.trade.findMany({
            where: { agentId: id },
            include: { market: true },
            orderBy: { timestamp: "desc" },
        });

        const formatted = trades.map((t) => ({
            id: t.id,
            agentId: t.agentId,
            agentName: "", // Will be joined if needed
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

        // Fetch agent name for display
        const agent = await prisma.agent.findUnique({
            where: { id },
            select: { name: true },
        });
        const tradesWithAgent = formatted.map((t) => ({
            ...t,
            agentName: agent?.name ?? "",
        }));

        return NextResponse.json({ trades: tradesWithAgent });
    } catch (err) {
        console.error("GET /api/agents/[id]/trades:", err);
        return NextResponse.json(
            { message: "Failed to fetch trades" },
            { status: 500 }
        );
    }
}
