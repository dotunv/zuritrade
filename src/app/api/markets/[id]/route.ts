import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";

export async function GET(
    _request: NextRequest,
    { params }: { params: Promise<{ id: string }> }
) {
    try {
        const { id } = await params;
        const market = await prisma.politicalMarket.findUnique({
            where: { id },
        });
        if (!market) {
            return NextResponse.json(
                { message: "Market not found" },
                { status: 404 }
            );
        }
        return NextResponse.json({
            market: {
                id: market.id,
                title: market.title,
                description: market.description,
                category: market.category,
                region: market.region,
                probability: market.probability,
                volume: market.volume,
                totalTraders: market.totalTraders,
                status: market.status,
                resolution: market.resolution,
                endDate: market.endDate.toISOString(),
                createdAt: market.createdAt.toISOString(),
            },
        });
    } catch (err) {
        console.error("GET /api/markets/[id]:", err);
        return NextResponse.json(
            { message: "Failed to fetch market" },
            { status: 500 }
        );
    }
}
