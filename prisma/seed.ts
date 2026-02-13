import "dotenv/config";
import { PrismaPg } from "@prisma/adapter-pg";
import { PrismaClient } from "../generated/prisma";

const connectionString = process.env.DATABASE_URL;
if (!connectionString) throw new Error("DATABASE_URL is required");

const adapter = new PrismaPg({ connectionString });
const prisma = new PrismaClient({ adapter });

const marketData = [
    {
        title: "Will APC win the 2027 Nigerian Presidential Election?",
        description:
            "Resolves YES if the All Progressives Congress candidate wins the 2027 Nigerian general election as declared by INEC.",
        category: "elections",
        region: "nigeria",
        probability: 0.42,
        volume: 2_450_000,
        totalTraders: 1_847,
        status: "active",
        resolution: null,
        endDate: new Date("2027-02-28T23:59:59Z"),
    },
    {
        title: "Will South Africa pass the NHI Bill into full law by Dec 2026?",
        description:
            "Resolves YES if the National Health Insurance Bill is fully enacted and gazetted by December 31, 2026.",
        category: "policy",
        region: "south-africa",
        probability: 0.35,
        volume: 1_120_000,
        totalTraders: 923,
        status: "active",
        resolution: null,
        endDate: new Date("2026-12-31T23:59:59Z"),
    },
    {
        title: "Will Kenya shilling trade above 150/USD by Q2 2026?",
        description:
            "Resolves YES if the KES/USD exchange rate exceeds 150 at any point during Q2 2026 per CBK official rates.",
        category: "economics",
        region: "kenya",
        probability: 0.58,
        volume: 890_000,
        totalTraders: 654,
        status: "active",
        resolution: null,
        endDate: new Date("2026-06-30T23:59:59Z"),
    },
    {
        title:
            "Will Ghana's new president serve full first 100 days without cabinet reshuffle?",
        description:
            "Resolves YES if no cabinet minister is replaced within the first 100 days of the new administration.",
        category: "policy",
        region: "ghana",
        probability: 0.67,
        volume: 340_000,
        totalTraders: 289,
        status: "active",
        resolution: null,
        endDate: new Date("2026-04-15T23:59:59Z"),
    },
    {
        title: "Will CBN hold interest rates above 20% through Q1 2026?",
        description:
            "Resolves YES if the Central Bank of Nigeria maintains the Monetary Policy Rate at or above 20% for all of Q1 2026.",
        category: "economics",
        region: "nigeria",
        probability: 0.73,
        volume: 1_560_000,
        totalTraders: 1_102,
        status: "active",
        resolution: null,
        endDate: new Date("2026-03-31T23:59:59Z"),
    },
    {
        title: "Will Ethiopia complete the GERD filling by end of 2026?",
        description:
            "Resolves YES if Ethiopia announces completion of the Grand Ethiopian Renaissance Dam reservoir filling by December 31, 2026.",
        category: "diplomacy",
        region: "ethiopia",
        probability: 0.29,
        volume: 670_000,
        totalTraders: 412,
        status: "active",
        resolution: null,
        endDate: new Date("2026-12-31T23:59:59Z"),
    },
    {
        title: "Will ANC retain majority in 2027 Gauteng provincial elections?",
        description:
            "Resolves YES if the African National Congress wins more than 50% of seats in the 2027 Gauteng provincial legislature elections.",
        category: "elections",
        region: "south-africa",
        probability: 0.18,
        volume: 980_000,
        totalTraders: 756,
        status: "active",
        resolution: null,
        endDate: new Date("2027-05-15T23:59:59Z"),
    },
    {
        title:
            "Will Kenya's Gen Z protests force a policy reversal on Finance Act 2026?",
        description:
            "Resolves YES if the Kenyan government withdraws or significantly amends the proposed Finance Act 2026 due to public pressure.",
        category: "policy",
        region: "kenya",
        probability: 0.51,
        volume: 1_230_000,
        totalTraders: 1_415,
        status: "active",
        resolution: null,
        endDate: new Date("2026-09-30T23:59:59Z"),
    },
];

async function main() {
    console.log("Seeding markets...");
    const count = await prisma.politicalMarket.count();
    if (count === 0) {
        await prisma.politicalMarket.createMany({
            data: marketData.map((m) => ({
                title: m.title,
                description: m.description,
                category: m.category,
                region: m.region,
                probability: m.probability,
                volume: m.volume,
                totalTraders: m.totalTraders,
                status: m.status,
                resolution: m.resolution,
                endDate: m.endDate,
            })),
        });
        console.log(`Created ${marketData.length} markets.`);
    } else {
        console.log(`Markets already exist (${count} records). Skipping.`);
    }
}

main()
    .catch((e) => {
        console.error(e);
        process.exit(1);
    })
    .finally(() => prisma.$disconnect());
