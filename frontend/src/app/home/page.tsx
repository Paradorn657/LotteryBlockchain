"use client"
import { useState, useEffect } from "react";
import { Ticket, CircleDollarSign, Loader2 } from "lucide-react";

export async function getTickets(roundId) {
  const res = await fetch(`http://localhost:5000/api/tickets/${roundId}`);
  const data = await res.json();
  return data.tickets || []; // Ensure it returns an empty array if no tickets are found
}

export async function getLatestRound() {
  const res = await fetch(`http://localhost:5000/api/latest-round`);
  const data = await res.json();
  return data.roundId;
}

export default function Home() {
  const [tickets, setTickets] = useState([]);
  const [roundId, setRoundId] = useState(null);
  const [loading, setLoading] = useState(true);

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

  return (
    <div className="min-h-screen bg-gradient-to-b from-blue-50 to-purple-50">
      <div className="container mx-auto px-4 py-8">
        {/* Header section */}
        <div className="text-center mb-12">
          <h1 className="text-4xl font-bold text-blue-800 mb-2">ลอตเตอรี่ออนไลน์</h1>
          <p className="text-lg text-gray-600">เลือกเลขที่คุณชื่นชอบและลุ้นรับรางวัลใหญ่</p>
        </div>

        {/* Round info card */}
        <div className="bg-white rounded-lg shadow-lg p-6 mb-8">
          <div className="flex items-center justify-between">
            <div className="flex items-center">
              <CircleDollarSign className="w-8 h-8 text-green-500 mr-3" />
              <div>
                <h2 className="text-2xl font-semibold text-gray-800">งวดที่ {roundId}</h2>
                <p className="text-sm text-gray-500">วันที่ออกรางวัล: 16 มีนาคม 2568</p>
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
              {tickets.length > 0 ? (
                <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4">
                  {tickets.map((ticket, index) => (
                    <div key={index} className="bg-blue-50 border border-blue-200 rounded-lg p-4 text-center hover:shadow-md transition">
                      <p className="text-sm text-gray-500 mb-1">เลขที่ตั๋ว</p>
                      <p className="text-xl font-bold text-blue-700">{ticket}</p>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="bg-gray-50 border border-gray-200 rounded-lg p-8 text-center">
                  <p className="text-gray-600 mb-4">คุณยังไม่มีตั๋วสำหรับงวดนี้</p>
                  <button className="bg-green-600 text-white py-2 px-6 rounded-md shadow hover:bg-green-700 transition">
                    ซื้อตั๋วเดี๋ยวนี้
                  </button>
                </div>
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