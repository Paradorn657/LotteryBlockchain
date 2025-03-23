"use client"

import { ethers } from "ethers";
import { useState } from "react";


export default function Page() {
    const [recipient, setRecipient] = useState("");
    const [amount, setAmount] = useState("");
    const [status, setStatus] = useState("");

    async function checkBalance() {
        const provider = new ethers.BrowserProvider(window.ethereum);
        const signer = await provider.getSigner();
        const balance = await provider.getBalance(signer.address);
        console.log("Wallet Balance:", ethers.formatEther(balance), "ETH");
      }

    async function sendTransaction() {
        if (!window.ethereum) {
            alert("Please install MetaMask!");
            return;
        }

        try {
            const provider = new ethers.BrowserProvider(window.ethereum);
            const signer = await provider.getSigner();

            const tx = await signer.sendTransaction({
                to: recipient,
                value: ethers.parseEther(amount), // Convert ETH to Wei
            });

            setStatus("Transaction sent! Waiting for confirmation...");
            await tx.wait(); // Wait for transaction confirmation
            setStatus(`Transaction confirmed! Hash: ${tx.hash}`);
        } catch (error) {
            console.error(error);
            setStatus("Transaction failed!");
        }
    }
    return (
        <div className="p-4">
            <button onClick={checkBalance}>get balance</button>
            <h2 className="text-xl font-bold">Send Crypto</h2>
            <input
                type="text"
                placeholder="Recipient Address"
                value={recipient}
                onChange={(e) => setRecipient(e.target.value)}
                className="border p-2 rounded w-full"
            />
            <input
                type="text"
                placeholder="Amount (ETH)"
                value={amount}
                onChange={(e) => setAmount(e.target.value)}
                className="border p-2 rounded w-full mt-2"
            />
            <button
                onClick={sendTransaction}
                className="bg-blue-500 text-white px-4 py-2 rounded mt-2"
            >
                Send
            </button>
            {status && <p className="mt-2">{status}</p>}
        </div>
    )
}
