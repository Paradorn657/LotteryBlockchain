"use client"

import { connectWalletToDB } from "@/features/connectWallet";
import { ethers } from "ethers";
import { useSession } from "next-auth/react";
import { useState } from "react";


export default function ConnectWallet() {
    const { data: session, update } = useSession();
    const [walletAddress, setWalletAddress] = useState("");

    async function connectWallet() {
        if ((window as any).ethereum) {
            const provider = new ethers.BrowserProvider((window as any).ethereum);
            const signer = await provider.getSigner();
            const address = await signer.getAddress();
            setWalletAddress(address);
            await connectWalletToDB(session?.user.id || "", address);
            await update({
                ...session,
                user: {
                    ...session?.user,
                    address: address
                }
            });
        } else {
            alert("Please install MetaMask!");
        }
    }

    async function disconnectWallet() {
        setWalletAddress("");
        await connectWalletToDB(session?.user.id || "", ""); // Remove wallet from DB
        await update({
            ...session,
            user: {
                ...session?.user,
                address: ""
            }
        });
    }


    return (
        <div className="p-4">
            {session?.user && (
                session.user.address ? (
                    <button onClick={disconnectWallet} className="btn btn-secondary">
                        Disconnect Wallet
                    </button>
                ) : (
                    <button onClick={connectWallet} className="btn btn-primary">
                        Connect Wallet
                    </button>
                )
            )}
        </div>
    )
}
