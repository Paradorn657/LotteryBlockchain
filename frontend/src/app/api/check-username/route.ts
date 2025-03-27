// app/api/check-username/route.ts
import { prisma } from "@/libs/db";
import { NextRequest, NextResponse } from "next/server";

export async function GET(request: NextRequest) {
    try {
        const { searchParams } = new URL(request.url);
        const username = searchParams.get("username");

        if (!username) {
            return NextResponse.json(
                { error: "Username parameter is required" },
                { status: 400 }
            );
        }

        // Check if username exists in the database
        const existingUser = await prisma.user.findUnique({
            where: {
                name: username,
            },
            select: {
                id: true,
            },
        });

        return NextResponse.json({
            available: !existingUser,
        });
    } catch (error) {
        console.error("Error checking username:", error);
        return NextResponse.json(
            { error: "Internal server error" },
            { status: 500 }
        );
    }
}