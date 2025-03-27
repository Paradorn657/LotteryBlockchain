"use client"
import { useState, useEffect } from "react";
import { Ticket, CircleDollarSign, Loader2, Trophy, Calendar, AlertCircle } from "lucide-react";
import { useSession } from "next-auth/react";
import { ethers } from "ethers";

export async function getTickets(roundId: any) {
    const res = await fetch(`http://localhost:5000/api/tickets/${roundId}`);
    const data = await res.json();

    // กรองเฉพาะหวยที่ยังไม่ได้ซื้อ (status === false)
    const singleTickets = data.singleTickets
        .map((ticket: any, index: string | number) => ({ number: ticket, status: data.singleTicketStatus[index] }))
        .filter((ticket: { status: any; }) => !ticket.status) // คัดเฉพาะที่ยังไม่ได้ซื้อ
        .map((ticket: { number: any; }) => ticket.number);

    const pairTickets = data.pairTickets
        .map((ticket: any, index: string | number) => ({ number: ticket, status: data.pairTicketStatus[index] }))
        .filter((ticket: { status: any; }) => !ticket.status) // คัดเฉพาะที่ยังไม่ได้ซื้อ
        .map((ticket: { number: any; }) => ticket.number);

    return { singleTickets, pairTickets, createdDate: data.createdDate };
}

export async function getLatestRound() {
    const res = await fetch(`http://localhost:5000/api/latest-round`);
    const data = await res.json();
    return data.roundId;
}

export async function getLastwinningNumber() {
    const res = await fetch(`http://localhost:5000/api/winning-numbers`);
    const data = await res.json();
    console.log(data);
    return data;
}
export async function getwinningNumberById(roundId: number) {
    const res = await fetch(`http://localhost:5000/api/winning-numbers/${roundId}`);
    const data = await res.json();
    console.log(data);
    return data;
}

export async function getUserTickets(userAddress) {
    if (!userAddress) return [];
    
    const res = await fetch(`http://localhost:5000/api/user-tickets/${userAddress}`);
    const data = await res.json();
    return data.tickets || [];
}

async function sendTransaction() {
    console.log("ส่ง")
    if (!window.ethereum) {
        alert("Please install MetaMask!");
        return;
    }

    try {
        console.log("wow")
        const provider = new ethers.BrowserProvider(window.ethereum);
        const signer = await provider.getSigner();

        const tx = await signer.sendTransaction({
            to: "0xDb2B36d8803354d4070b518b6876d37E75402746",
            value: ethers.parseEther("0.5"), // Convert ETH to Wei
        });
        // setStatus("Transaction sent! Waiting for confirmation...");
        await tx.wait(); // Wait for transaction confirmation
        // setStatus(`Transaction confirmed! Hash: ${tx.hash}`);
        return {
            status: "success",
            hash: tx.hash
        }
    } catch (error) {
        console.error(error);
        return {
            status: "failed"
        }
        // setStatus("Transaction failed!");
    }
}

export async function buyTicket(roundId: number, ticketNumber: number, buyerAddress: string) {
    console.log("buyticket")
    const result = await sendTransaction();
    if (!result?.hash) {
        return
    }

    const res = await fetch("http://localhost:5000/api/buy-tickets", {
        method: "POST",
        headers: {
            "Content-Type": "application/json",
        },
        body: JSON.stringify({ roundId, ticketNumbers: ticketNumber, userAddress: buyerAddress }),
    });
    const data = await res.json();
    console.log(data);
    if (data.txHash) {
        return `Transaction successful: ${data.txHash}`;
    } else {
        throw new Error(data.error);
    }
}

export default function Home() {
    const [tickets, setTickets] = useState<{ singleTickets: string[], pairTickets: string[], createdDate?: string }>({ singleTickets: [], pairTickets: [] });
    const [roundId, setRoundId] = useState(null);
    const [winningNumber, setWiningNumber] = useState<{ createdDate: string; roundId: number; winningNumbers: string[] } | null>(null);
    const [loading, setLoading] = useState(true);
    const [buying, setBuying] = useState(false);
    const [buyerAddress, setBuyerAddress] = useState("");
    const [notification, setNotification] = useState({ show: false, message: "", type: "" });
    const [userTickets, setUserTickets] = useState([]);
    const { data: session } = useSession();

    useEffect(() => {
        setBuyerAddress(session?.user.address || "")
    }, [session])

    useEffect(() => {
        async function fetchData() {
            setLoading(true);
            try {
                const latestRound = await getLatestRound();
                const winningNumber = await getLastwinningNumber();
                console.log(winningNumber);
                setWiningNumber(winningNumber);
                setRoundId(latestRound);
                const ticketData = await getTickets(latestRound);
                console.log("ticketdata", ticketData);
                setTickets(ticketData);
                
                // Fetch user tickets if session exists
                if (session?.user?.address) {
                    const userTicketsData = await getUserTickets(session.user.address);
                    setUserTickets(userTicketsData);
                }
            } catch (error) {
                console.error("Error fetching data:", error);
                setNotification({
                    show: true,
                    message: "เกิดข้อผิดพลาดในการโหลดข้อมูล กรุณาลองใหม่อีกครั้ง",
                    type: "error"
                });
            } finally {
                setLoading(false);
            }
        }
        fetchData();
    }, [session?.user?.address]);

    const handleBuyTicket = async (ticketNumber:number,type:string) => {
        console.log(buyerAddress)
        if (buyerAddress == "") {
            setNotification({
                show: true,
                message: "เกิดข้อผิดพลาดในการซื้อสลาก กรุณาลองใหม่อีกครั้ง",
                type: "error"
            });
            return
        }
        setBuying(true);
        try {
            const txMessage = await buyTicket(roundId, ticketNumber, buyerAddress);
            console.log(txMessage);
            setNotification({
                show: true,
                message: `ซื้อ${type=='single'?"เดี่ยว":"ชุด 2 ใบ"} เลข ${ticketNumber} เรียบร้อยแล้ว!`,
                type: "success"
            });
            
            // Refresh user tickets after successful purchase
            if (session?.user?.address) {
                const userTicketsData = await getUserTickets(session.user.address);
                setUserTickets(userTicketsData);
            }
            
            // Refresh available tickets after successful purchase
            const ticketData = await getTickets(roundId);
            setTickets(ticketData);
        } catch (error) {
            console.log(`Error purchasing ticket: ${error.message}`);
            setNotification({
                show: true,
                message: "เกิดข้อผิดพลาดในการซื้อสลาก กรุณาลองใหม่อีกครั้ง",
                type: "error"
            });
        } finally {
            setBuying(false);
        }
    };

    return (
        <div className="min-h-screen bg-gradient-to-b from-blue-100 to-purple-100">
            <div className="container mx-auto px-4 py-8">
                {/* Notification */}
                {notification.show && (
                    <div className={`fixed top-4 right-4 p-4 rounded-lg shadow-lg z-50 flex items-center ${notification.type === "success" ? "bg-green-500" : "bg-red-500"
                        } text-white`}>
                        <AlertCircle className="mr-2" />
                        <p>{notification.message}</p>
                        <button
                            className="ml-4 text-white"
                            onClick={() => setNotification({ ...notification, show: false })}
                        >
                            ✕
                        </button>
                    </div>
                )}

                {/* Header section */}
                <div className="text-center mb-8">
                    <h1 className="text-5xl font-bold text-blue-800 mb-2">ลอตเตอรี่ออนไลน์</h1>
                    <p className="text-lg text-gray-600">
                        เลือกเลขที่คุณชื่นชอบและลุ้นรับรางวัลใหญ่
                    </p>
                </div>

                Winning Numbers Section
                {winningNumber && winningNumber.winningNumbers ? (
                    <div className="bg-white rounded-xl shadow-lg p-6 mb-8 border-2 border-yellow-400">
                        <div className="flex items-center justify-between mb-4">
                            <h2 className="text-2xl font-bold text-gray-800 flex items-center">
                                <Trophy className="w-6 h-6 text-yellow-500 mr-2" />
                                <p>ผลการออกรางวัลงวดล่าสุดวันที่ {new Date(Number(winningNumber.createdDate) * 1000).toLocaleString("th-TH", {
                                    day: "numeric",
                                    month: "long",
                                    year: "numeric",
                                    hour: "numeric",
                                    minute: "numeric",
                                    second: "numeric",
                                })}</p>
                            </h2>
                            <div className="bg-yellow-100 text-yellow-800 py-1 px-3 rounded-full text-sm font-medium">
                                งวดที่ {winningNumber.roundId}
                            </div>
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                            {/* First Prize */}
                            <div className="bg-gradient-to-r from-yellow-500 to-yellow-400 rounded-lg p-4 shadow-md text-white">
                                <div className="text-center">
                                    <h3 className="text-xl font-bold mb-2">รางวัลที่ 1</h3>
                                    <div className="bg-white rounded-lg p-3 shadow-inner">
                                        <p className="text-4xl font-bold text-yellow-600 tracking-wider">
                                            {winningNumber.winningNumbers[0]}
                                        </p>
                                    </div>
                                    <p className="mt-2 text-sm">มูลค่ารางวัล 6,000,000 บาท</p>
                                </div>
                            </div>

                            {/* Second Prize */}
                            <div className="bg-gradient-to-r from-gray-200 to-gray-300 rounded-lg p-4 shadow-md">
                                <div className="text-center">
                                    <h3 className="text-xl font-bold mb-2 text-gray-700">รางวัลที่ 2</h3>
                                    <div className="bg-white rounded-lg p-3 shadow-inner">
                                        <p className="text-3xl font-bold text-gray-600 tracking-wider">
                                            {winningNumber.winningNumbers[1]}
                                        </p>
                                    </div>
                                    <p className="mt-2 text-sm text-gray-700">มูลค่ารางวัล 200,000 บาท</p>
                                </div>
                            </div>

                            {/* Third Prize */}
                            <div className="bg-gradient-to-r from-amber-700 to-amber-600 rounded-lg p-4 shadow-md text-white">
                                <div className="text-center">
                                    <h3 className="text-xl font-bold mb-2">รางวัลที่ 3</h3>
                                    <div className="bg-white rounded-lg p-3 shadow-inner">
                                        <p className="text-3xl font-bold text-amber-600 tracking-wider">
                                            {winningNumber.winningNumbers[2]}
                                        </p>
                                    </div>
                                    <p className="mt-2 text-sm">มูลค่ารางวัล 80,000 บาท</p>
                                </div>
                            </div>
                        </div>
                    </div>
                ) : (
                    <div className="bg-white rounded-xl shadow-lg p-6 mb-8 border-2 border-gray-300 text-center">
                        <p className="text-xl font-semibold text-gray-600">กำลังรอออกรางวัล...</p>
                    </div>
                )}


                {/* Round info card */}
                <div className="bg-white rounded-xl shadow-lg p-6 mb-8 border-l-4 border-blue-500">
                    <div className="flex items-center justify-between">
                        <div className="flex items-center">
                            <Calendar className="w-8 h-8 text-blue-500 mr-3" />
                            <div>
                                <h2 className="text-2xl font-semibold text-gray-800">
                                    งวดที่ {roundId} - วันที่ {new Date(Number(tickets.createdDate) * 1000).toLocaleString("th-TH", {
                                        day: "numeric",
                                        month: "long",
                                        year: "numeric",
                                        hour: "numeric",
                                        minute: "numeric",
                                        second: "numeric",
                                    })}
                                </h2>
                                <p className="text-sm text-gray-500">
                                    วันที่ออกรางวัล: 16 มีนาคม 2568
                                </p>
                            </div>
                        </div>
                        <div className="bg-blue-600 text-white py-2 px-4 rounded-lg shadow-md hover:bg-blue-700 transition cursor-pointer flex items-center">
                            <CircleDollarSign className="w-5 h-5 mr-2" />
                            ซื้อตั๋ว
                        </div>
                    </div>
                </div>

                {/* Tickets section */}
                <div className="bg-white rounded-xl shadow-lg p-6 mb-8">
                    <h2 className="text-xl font-semibold text-gray-800 mb-4 flex items-center">
                        <Ticket className="w-5 h-5 text-blue-500 mr-2" />
                        สลากกินแบ่งที่พร้อมจำหน่าย
                    </h2>

                    {loading ? (
                        <div className="flex flex-col items-center justify-center py-12">
                            <Loader2 className="w-12 h-12 text-blue-500 animate-spin mb-4" />
                            <p className="text-gray-600">กำลังโหลดข้อมูลสลาก...</p>
                        </div>
                    ) : (
                        <div>
                            {/* Display Single Tickets */}
                            <h3 className="text-lg font-medium text-gray-700 mb-4 mt-6 border-l-4 border-blue-500 pl-3">
                                หวยเดี่ยว
                            </h3>
                            {tickets.singleTickets.length > 0 ? (
                                <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4 mb-8">
                                    {tickets.singleTickets.map((ticket, index) => (
                                        <div
                                            key={`ticket-${index}`}
                                            className="bg-gradient-to-b from-white to-blue-50 border border-blue-200 rounded-xl p-4 text-center hover:shadow-lg transition hover:border-blue-400 transform hover:-translate-y-1"
                                        >
                                            <div className="flex justify-between mb-2 text-xs text-gray-500">
                                                <span>สำนักงานสลากฯ</span>
                                                <span>80 บาท</span>
                                            </div>

                                            <div className="bg-white p-3 rounded-lg shadow-inner mb-3">
                                                <p className="text-3xl font-bold text-blue-700 tracking-wider">
                                                    {ticket}
                                                </p>
                                            </div>

                                            <button
                                                className="bg-green-600 text-white py-2 px-6 rounded-lg shadow hover:bg-green-700 transition mt-2 w-full flex items-center justify-center"
                                                onClick={() => handleBuyTicket(Number(ticket),'single')}
                                                disabled={buying}
                                            >
                                                {buying ? (
                                                    <>
                                                        <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                                                        กำลังซื้อ...
                                                    </>
                                                ) : (
                                                    "ซื้อเลย"
                                                )}
                                            </button>
                                        </div>
                                    ))}
                                </div>
                            ) : (
                                <div className="bg-gray-50 rounded-lg p-8 text-center mb-6">
                                    <p className="text-gray-600">ขออภัย ไม่มีหวยเดี่ยวในขณะนี้</p>
                                </div>
                            )}

                            {/* Display Pair Tickets */}
                            <h3 className="text-lg font-medium text-gray-700 mb-4 mt-6 border-l-4 border-green-500 pl-3">
                                หวยชุด
                            </h3>
                            {tickets.pairTickets.length > 0 ? (
                                <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4">
                                    {tickets.pairTickets.map((ticket, index) => (
                                        <div
                                            key={`pair-${index}`}
                                            className="bg-gradient-to-b from-white to-green-50 border border-green-200 rounded-xl p-4 text-center hover:shadow-lg transition hover:border-green-400 transform hover:-translate-y-1"
                                        >
                                            <div className="flex justify-between mb-2 text-xs text-gray-500">
                                                <span>สำนักงานสลากฯ</span>
                                                <span>80 บาท</span>
                                            </div>

                                            <div className="bg-white p-3 rounded-lg shadow-inner mb-3">
                                                <p className="text-3xl font-bold text-green-700 tracking-wider">
                                                    {ticket}
                                                </p>
                                            </div>

                                            <button
                                                className="bg-green-600 text-white py-2 px-6 rounded-lg shadow hover:bg-green-700 transition mt-2 w-full flex items-center justify-center"
                                                onClick={() => handleBuyTicket(Number(ticket),'pair')}
                                                disabled={buying}
                                            >
                                                {buying ? (
                                                    <>
                                                        <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                                                        กำลังซื้อ...
                                                    </>
                                                ) : (
                                                    "ซื้อเลย"
                                                )}
                                            </button>
                                        </div>
                                    ))}
                                </div>
                            ) : (
                                <div className="bg-gray-50 rounded-lg p-8 text-center">
                                    <p className="text-gray-600">ขออภัย ไม่มีหวยชุดในขณะนี้</p>
                                </div>
                            )}
                        </div>
                    )}
                </div>

                {/* Footer section */}
                <div className="mt-12 text-center">
                    <div className="py-6 border-t border-gray-200">
                        <p className="text-gray-600">© 2025 ลอตเตอรี่ออนไลน์. สงวนลิขสิทธิ์.</p>
                        <p className="text-sm text-gray-500 mt-2">
                            เว็บไซต์นี้ดำเนินการโดยถูกต้องตามกฎหมาย
                        </p>
                    </div>
                </div>
            </div>
        </div>
    );
}