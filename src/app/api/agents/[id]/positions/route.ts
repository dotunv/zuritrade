import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";

export async function GET(
    _request: NextRequest,
    { params }: { params: Promise<{ id: string }> }
) {
    try {
        const { id } = await params;
        const positions = await prisma.position.findMany({
            where: { agentId: id },
            include: { market: true },
            orderBy: { openedAt: "desc" },
        });

        const formatted = positions.map((p) => ({
            id: p.id,
            agentId: p.agentId,
            marketId: p.marketId,
            marketTitle: p.market.title,
            direction: p.direction,
            entryPrice: p.entryPrice,
            currentPrice: p.currentPrice,
            amount: p.amount,
            unrealizedPnl: p.unrealizedPnl,
            unrealizedPnlPercent: p.unrealizedPnlPercent,
            status: p.status,
            openedAt: p.openedAt.toISOString(),
            closedAt: p.closedAt?.toISOString() ?? null,
        }));

        return NextResponse.json({ positions: formatted });
    } catch (err) {
        console.error("GET /api/agents/[id]/positions:", err);
        return NextResponse.json(
            { message: "Failed to fetch positions" },
            { status: 500 }
        );
    }
}
