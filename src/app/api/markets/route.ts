import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";

export async function GET() {
    try {
        const markets = await prisma.politicalMarket.findMany({
            orderBy: { volume: "desc" },
        });

        const formatted = markets.map((m) => ({
            id: m.id,
            title: m.title,
            description: m.description,
            category: m.category,
            region: m.region,
            probability: m.probability,
            volume: m.volume,
            totalTraders: m.totalTraders,
            status: m.status,
            resolution: m.resolution,
            endDate: m.endDate.toISOString(),
            createdAt: m.createdAt.toISOString(),
        }));

        return NextResponse.json({ markets: formatted });
    } catch (err) {
        console.error("GET /api/markets:", err);
        return NextResponse.json(
            { message: "Failed to fetch markets" },
            { status: 500 }
        );
    }
}
