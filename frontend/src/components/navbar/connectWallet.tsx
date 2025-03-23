"use client"

import { connectWalletToDB } from "@/features/connectWallet";
import { ethers } from "ethers";
import { useSession } from "next-auth/react";
import { useState } from "react";


export default function ConnectWallet() {
    const { data: session } = useSession();
    const [walletAddress, setWalletAddress] = useState("");

    async function connectWallet() {
        console.log("run")
        if (window.ethereum) {
            const provider = new ethers.BrowserProvider(window.ethereum);
            const signer = await provider.getSigner();
            const address = await signer.getAddress();
            setWalletAddress(address);
            await connectWalletToDB(session?.user.id || "", address);
        } else {
            alert("Please install MetaMask!");
        }
    }
    return (
        <div className="p-4">
            {session?.user && !session?.user.address &&
                <button onClick={connectWallet} className="btn btn-primary" >
                    Connect Wallet
                </button>
            }
        </div>
    )
}
