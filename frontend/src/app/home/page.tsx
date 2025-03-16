"use client"
import { useState, useEffect } from "react";
import { Ticket, CircleDollarSign, Loader2 } from "lucide-react";

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
  
    return { singleTickets, pairTickets };
  }
  

export async function getLatestRound() {
  const res = await fetch(`http://localhost:5000/api/latest-round`);
  const data = await res.json();
  return data.roundId;
}

export async function buyTicket(roundId: number, ticketNumber: number, buyerAddress: string) {
    buyerAddress = "0x9EF52e5b719d832F9aF3D3df7032bA4D1A9CE5Aa"
    const res = await fetch("http://localhost:5000/api/buy-tickets", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ roundId, ticketNumbers: ticketNumber, userAddress: buyerAddress }),
    });
    const data = await res.json();
    console.log(data)
    if (data.txHash) {
      return `Transaction successful: ${data.txHash}`;
    } else {
      throw new Error(data.error);
    }
  }

export default function Home() {
  const [tickets, setTickets] = useState({ singleTickets: [], pairTickets: [] });
  const [roundId, setRoundId] = useState(null);
  const [loading, setLoading] = useState(true);
  const [buyerAddress, setBuyerAddress] = useState("");

  useEffect(() => {
    async function fetchData() {
      setLoading(true);
      try {
        const latestRound = await getLatestRound();
        setRoundId(latestRound);
        const ticketData = await getTickets(latestRound);
        setTickets(ticketData);
      } catch (error) {
        console.error("Error fetching data:", error);
      } finally {
        setLoading(false);
      }
    }
    fetchData();
  }, []);

  const handleBuyTicket = async (ticketNumber: never) => {
    try {
      const txMessage = await buyTicket(roundId, ticketNumber, buyerAddress);
      console.log(txMessage);
    } catch (error) {
    console.log(`Error purchasing ticket: ${error.message}`);
    } 
  };

  return (
    <div className="min-h-screen bg-gradient-to-b from-blue-50 to-purple-50">
      <div className="container mx-auto px-4 py-8">
        {/* Header section */}
        <div className="text-center mb-12">
          <h1 className="text-4xl font-bold text-blue-800 mb-2">ลอตเตอรี่ออนไลน์</h1>
          <p className="text-lg text-gray-600">
            เลือกเลขที่คุณชื่นชอบและลุ้นรับรางวัลใหญ่
          </p>
        </div>

        {/* Round info card */}
        <div className="bg-white rounded-lg shadow-lg p-6 mb-8">
          <div className="flex items-center justify-between">
            <div className="flex items-center">
              <CircleDollarSign className="w-8 h-8 text-green-500 mr-3" />
              <div>
                <h2 className="text-2xl font-semibold text-gray-800">
                  งวดที่ {roundId}
                </h2>
                <p className="text-sm text-gray-500">
                  วันที่ออกรางวัล: 16 มีนาคม 2568
                </p>
              </div>
            </div>
            <div className="bg-blue-600 text-white py-2 px-4 rounded-md shadow-md hover:bg-blue-700 transition">
              ซื้อตั๋ว
            </div>
          </div>
        </div>

        {/* Tickets section */}
        <div className="bg-white rounded-lg shadow-lg p-6">
          <h2 className="text-xl font-semibold text-gray-800 mb-4 flex items-center">
            <Ticket className="w-5 h-5 text-blue-500 mr-2" />
            ตั๋วของคุณ
          </h2>

          {loading ? (
            <div className="flex flex-col items-center justify-center py-12">
              <Loader2 className="w-12 h-12 text-blue-500 animate-spin mb-4" />
              <p className="text-gray-600">กำลังโหลดข้อมูลตั๋ว...</p>
            </div>
          ) : (
            <div>
              {/* Display Single Tickets */}
              <h3 className="text-lg font-medium text-gray-700 mb-2">
                หวยเดี่ยว
              </h3>
              {tickets.singleTickets.length > 0 ? (
                <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4 mb-6">
                  {tickets.singleTickets.map((ticket, index) => (
                     <div
                     key={`ticket-${index}`}
                     className="bg-white border-2 border-blue-300 rounded-lg p-5 text-center hover:shadow-lg transition hover:border-blue-500"
                   >
                     <div className="flex justify-between mb-2 text-xs text-gray-500">
                       <span>สำนักงานสลากกินแบ่งรัฐบาล</span>
                       <span>80 บาท</span>
                     </div>
                     
                     {/* <p className="text-sm text-gray-500 mb-1">เลขที่สลาก</p> */}
                     <p className="text-3xl font-bold text-blue-700 tracking-wider">
                       {ticket}
                     </p>

                     <button
                        className="bg-green-600 text-white py-2 px-6 rounded-md shadow hover:bg-green-700 transition mt-4"
                        onClick={() => handleBuyTicket(ticket)}
                        // disabled={buyingTicket}
                      >
                        ซื้อ
                      </button>
                     
                     
                   </div>
                  ))}
                </div>
              ) : (
                <p className="text-gray-600 mb-4">ไม่มีหวยเดี่ยว</p>
              )}

              {/* Display Pair Tickets */}
              <h3 className="text-lg font-medium text-gray-700 mb-2">
                หวยชุด
              </h3>
              {tickets.pairTickets.length > 0 ? (
                <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4">
                  {tickets.pairTickets.map((ticket, index) => (
                    <div
                      key={`pair-${index}`}
                      className="bg-green-50 border border-green-200 rounded-lg p-4 text-center hover:shadow-md transition"
                    >
                      
                     <div className="flex justify-between mb-2 text-xs text-gray-500">
                       <span>สำนักงานสลากกินแบ่งรัฐบาล</span>
                       <span>80 บาท</span>
                     </div>
                     
                     {/* <p className="text-sm text-gray-500 mb-1">เลขที่สลาก</p> */}
                     <p className="text-3xl font-bold text-blue-700 tracking-wider">
                       {ticket}
                     </p>

                     <button
                        className="bg-green-600 text-white py-2 px-6 rounded-md shadow hover:bg-green-700 transition mt-4"
                        onClick={() => handleBuyTicket(ticket)}
                        // disabled={buyingTicket}
                      >
                        ซื้อ
                      </button>
                     
                     
                   </div>
                  ))}
                </div>
              ) : (
                <p className="text-gray-600">ไม่มีหวยชุด</p>
              )}
            </div>
          )}
        </div>

        {/* Footer section */}
        <div className="mt-12 text-center text-sm text-gray-500">
          <p>© 2025 ลอตเตอรี่ออนไลน์. สงวนลิขสิทธิ์.</p>
        </div>
      </div>
    </div>
  );
}
