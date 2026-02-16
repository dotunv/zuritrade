import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";

export async function GET(
    _request: NextRequest,
    { params }: { params: Promise<{ id: string }> }
) {
    try {
        const { id } = await params;
        const agent = await prisma.agent.findUnique({
            where: { id },
            include: { user: true },
        });
        if (!agent) {
            return NextResponse.json({ message: "Agent not found" }, { status: 404 });
        }
        return NextResponse.json({
            agent: {
                ...agent,
                onChainAgentId: agent.onChainAgentId != null ? String(agent.onChainAgentId) : null,
                marketFocus: agent.marketFocus as {
                    regions: string[];
                    categories: string[];
                },
            },
        });
    } catch (err) {
        console.error("GET /api/agents/[id]:", err);
        return NextResponse.json(
            { message: "Failed to fetch agent" },
            { status: 500 }
        );
    }
}
