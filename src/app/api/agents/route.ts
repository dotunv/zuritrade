import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";

export async function POST(request: NextRequest) {
    try {
        const body = await request.json();
        const {
            name,
            strategyType,
            riskLevel,
            regions,
            categories,
            maxTradeSize,
            dailyLossLimit,
            positionLimit,
            capitalAllocated,
            walletAddress,
            onChainAgentId,
        } = body;

        if (
            !name ||
            !walletAddress ||
            !strategyType ||
            !riskLevel ||
            !Array.isArray(regions) ||
            !Array.isArray(categories)
        ) {
            return NextResponse.json(
                { message: "Missing required fields" },
                { status: 400 }
            );
        }

        // Upsert user by wallet address
        const user = await prisma.user.upsert({
            where: { walletAddress },
            create: {
                walletAddress,
                displayName: walletAddress.slice(0, 6) + "..." + walletAddress.slice(-4),
            },
            update: {},
        });

        const agent = await prisma.agent.create({
            data: {
                userId: user.id,
                name,
                walletAddress,
                onChainAgentId: onChainAgentId != null ? BigInt(onChainAgentId) : null,
                strategyType,
                riskLevel,
                marketFocus: { regions, categories },
                maxTradeSize: Number(maxTradeSize) ?? 200,
                dailyLossLimit: Number(dailyLossLimit) ?? 100,
                positionLimit: Number(positionLimit) ?? 5,
                capitalAllocated: Number(capitalAllocated) ?? 1000,
                status: "deploying",
            },
        });

        return NextResponse.json({ id: agent.id });
    } catch (err) {
        console.error("POST /api/agents:", err);
        return NextResponse.json(
            { message: "Failed to create agent" },
            { status: 500 }
        );
    }
}

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
        });
        if (!user) {
            return NextResponse.json({ agents: [] });
        }

        const agents = await prisma.agent.findMany({
            where: { userId: user.id },
            orderBy: { createdAt: "desc" },
        });

        const agentsWithComputed = agents.map((a) => ({
            ...a,
            onChainAgentId: a.onChainAgentId != null ? String(a.onChainAgentId) : null,
            marketFocus: a.marketFocus as { regions: string[]; categories: string[] },
        }));

        return NextResponse.json({ agents: agentsWithComputed });
    } catch (err) {
        console.error("GET /api/agents:", err);
        return NextResponse.json(
            { message: "Failed to fetch agents" },
            { status: 500 }
        );
    }
}
