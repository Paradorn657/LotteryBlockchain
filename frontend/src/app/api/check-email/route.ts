// app/api/check-email/route.ts
import { prisma } from "@/libs/db";
import { NextRequest, NextResponse } from "next/server";

export async function GET(request: NextRequest) {
    try {
        const { searchParams } = new URL(request.url);
        const email = searchParams.get("email");

        if (!email) {
            return NextResponse.json(
                { error: "Email parameter is required" },
                { status: 400 }
            );
        }

        // Check if email exists in the database
        const existingUser = await prisma.user.findUnique({
            where: {
                email: email,
            },
            select: {
                id: true,
            },
        });

        return NextResponse.json({
            available: !existingUser,
        });
    } catch (error) {
        console.error("Error checking email:", error);
        return NextResponse.json(
            { error: "Internal server error" },
            { status: 500 }
        );
    }
}