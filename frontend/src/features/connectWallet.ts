"use server"

import prisma from "@/libs/prisma"

export async function connectWalletToDB(id: string, address: string) {
    try {
        await prisma.user.update({
            where: { id },
            data: { address }
        })
    } catch (error) {
        console.log(error)
    }
}