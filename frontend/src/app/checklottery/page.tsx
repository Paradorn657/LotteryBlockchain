"use client";
import { Calendar, Clock, Info, Medal, Trophy, Users, Ticket, Award } from "lucide-react";
import { useEffect, useState } from "react";

export async function getLatestRound() {
    try {
        const res = await fetch(`http://localhost:5000/api/latest-round`);
        if (!res.ok) throw new Error(`API request failed with status ${res.status}`);
        const data = await res.json();
        return data.roundId;
    } catch (error) {
        console.error("Error fetching latest round:", error);
        return 0;
    }
}

export async function getwinningNumberById(roundId) {
    try {
        const res = await fetch(`http://localhost:5000/api/winning-numbers?roundId=${roundId}`);
        if (!res.ok) throw new Error(`API request failed with status ${res.status}`);
        const data = await res.json();
        return data;
    } catch (error) {
        console.error(`Error fetching winning numbers for round ${roundId}:`, error);
        throw error;
    }
}

function parseLotteryResults(resultsString) {
    try {
        const roundMatch = resultsString.match(/Lottery Round (\d+) Results:/);
        const winningNumbersMatch = resultsString.match(/Winning Numbers: ([\d,\s]+)/);
        const userAddressMatch = resultsString.match(/User (0x[a-fA-F0-9]+):/);
        const participantsMatch = resultsString.match(/Total Participating Users: (\d+)/);
        const ticketsMatch = resultsString.match(/Total Tickets Sold: (\d+)/);
        const winningTicketsMatch = resultsString.match(/Total Winning Tickets: (\d+)/);

        if (!roundMatch || !winningNumbersMatch) return null;

        const participants = [];
        const userSection = resultsString.split(/User 0x[a-fA-F0-9]+:/)[1];
        
        const userTickets = [];
        const ticketMatches = userSection.match(/Ticket \d+ \(.*?\) - .*?\n/g) || [];
        
        ticketMatches.forEach(ticketLine => {
            const ticketNumberMatch = ticketLine.match(/Ticket (\d+)/);
            const ticketTypeMatch = ticketLine.match(/\((.*?)\)/);
            const prizeMatch = ticketLine.match(/- (.*?)$/);
            
            if (ticketNumberMatch && ticketTypeMatch && prizeMatch) {
                userTickets.push({
                    number: parseInt(ticketNumberMatch[1], 10),
                    type: ticketTypeMatch[1],
                    prize: prizeMatch[1]
                });
            }
        });

        return {
            roundNumber: parseInt(roundMatch[1], 10),
            winningNumbers: winningNumbersMatch[1].split(',').map(n => parseInt(n.trim(), 10)),
            participants: [{
                address: userAddressMatch ? userAddressMatch[1] : null,
                tickets: userTickets,
                totalTickets: userTickets.length,
                winningTickets: userTickets.filter(ticket => ticket.prize !== 'No Prize').length
            }],
            summary: {
                totalParticipatingUsers: participantsMatch ? parseInt(participantsMatch[1], 10) : 0,
                totalTicketsSold: ticketsMatch ? parseInt(ticketsMatch[1], 10) : 0,
                totalWinningTickets: winningTicketsMatch ? parseInt(winningTicketsMatch[1], 10) : 0
            }
        };
    } catch (error) {
        console.error("Error parsing lottery results:", error);
        return null;
    }
}


function extractWinners(resultsString: string) {
    const parsedResults = parseLotteryResults(resultsString);
    
    if (!parsedResults) return "No winners in this round.";

    const winners = parsedResults.participants
        .filter(participant => participant.winningTickets > 0)
        .map(participant => ({
            address: participant.address,
            winningTickets: participant.winningTickets
        }));

    return winners.length > 0 ? winners : "No winners in this round.";
}

export default function LotteryHistoryPage() {
    const [latestRound, setLatestRound] = useState(0);
    const [selectedRound, setSelectedRound] = useState(0);
    const [winningNumber, setWinningNumber] = useState(null);
    const [winnerData, setWinnerData] = useState(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState("");

    useEffect(() => {
        const fetchLatestRound = async () => {
            try {
                const roundId = await getLatestRound();
                setLatestRound(roundId);
                setSelectedRound(roundId > 1 ? roundId - 1 : roundId);
                setError(null);
            } catch (error) {
                console.error("Error fetching latest round:", error);
                setError("ไม่สามารถโหลดข้อมูลรอบล่าสุดได้");
                setLoading(false);
            }
        };

        fetchLatestRound();
    }, []);

    useEffect(() => {
        const fetchWinningNumbersAndWinner = async () => {
            if (selectedRound > 0) {
                setLoading(true);
                setError(null);
                try {
                    const result = await getwinningNumberById(selectedRound);

                    setWinningNumber(result);
                } catch (error) {
                    console.error("Error fetching data:", error);
                    setError(`ไม่สามารถโหลดข้อมูลรางวัลงวดที่ ${selectedRound} ได้`);
                    setWinningNumber(null);
                    setWinnerData(null);
                } finally {
                    setLoading(false);
                }
            }
        };

        fetchWinningNumbersAndWinner();
    }, [selectedRound]);

    const handleRoundChange = (e) => {
        setSelectedRound(parseInt(e.target.value));
    };

    const roundOptions = latestRound > 1
        ? Array.from({ length: latestRound - 1 }, (_, i) => latestRound - 1 - i)
        : [];

    return (
        <div className="max-w-7xl mx-auto p-4 md:p-6  mt-6">
            <div className="text-center mb-8">
                <h1 className="text-3xl md:text-4xl font-bold text-gray-800 mb-2">ประวัติผลรางวัลหวย</h1>
                <p className="text-gray-600">ตรวจผลรางวัลย้อนหลังได้ทุกงวด</p>
            </div>

            {/* Round Selection with improved UI */}
            {latestRound > 0 && (
                <div className="mb-8 bg-white p-5 rounded-xl shadow-md border border-gray-100 transform transition hover:shadow-lg">
                    <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                        <div className="flex items-center">
                            <Calendar className="w-5 h-5 text-yellow-500 mr-2" />
                            <label htmlFor="roundSelect" className="text-lg font-medium text-gray-700">
                                เลือกงวดที่ต้องการดู:
                            </label>
                        </div>
                        <div className="relative w-full md:w-64">
                            <select
                                id="roundSelect"
                                value={selectedRound}
                                onChange={handleRoundChange}
                                className="block w-full pl-4  py-3 text-base border border-gray-300 focus:outline-none focus:ring-2 focus:ring-yellow-500 focus:border-yellow-500 rounded-lg shadow-sm bg-white transition-all"
                            >
                                {roundOptions.map((round) => (
                                    <option key={round} value={round}>
                                        งวดที่ {round}
                                    </option>
                                ))}
                            </select>
                            
                        </div>
                    </div>
                </div>
            )}

            {/* Error Display with icon and animation */}
            {error && (
                <div className="bg-red-50 border-l-4 border-red-500 p-4 mb-8 rounded-r-lg animate-pulse">
                    <div className="flex items-center">
                        <div className="flex-shrink-0">
                            <svg className="h-5 w-5 text-red-500" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor">
                                <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
                            </svg>
                        </div>
                        <div className="ml-3">
                            <p className="text-sm font-medium text-red-700">{error}</p>
                        </div>
                    </div>
                </div>
            )}

            {/* Loading State with improved animation */}
            {loading ? (
                <div className="text-center py-16 bg-white rounded-xl shadow-md">
                    <div className="inline-block animate-spin rounded-full h-16 w-16 border-t-4 border-b-4 border-yellow-500"></div>
                    <p className="mt-6 text-lg text-gray-600">กำลังโหลดข้อมูล...</p>
                </div>
            ) : winningNumber ? (
                <div className="bg-white rounded-xl shadow-lg overflow-hidden border border-gray-100">
                    {/* Header with date and round info */}
                    <div className="bg-gradient-to-r from-yellow-500 to-amber-500 p-5 text-white">
                        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-3">
                            <div className="flex items-center">
                                <Trophy className="w-6 h-6 mr-3" />
                                <h2 className="text-xl md:text-2xl font-bold">ผลการออกรางวัล</h2>
                            </div>
                            <div className="flex flex-col md:flex-row md:items-center gap-2 md:gap-4">
                                <div className="flex items-center ">
                                    <p>งวดประจำวันที่ </p>
                                    <Calendar className="ml-2 w-5 h-5 mr-2" />
                                    <span className="font-medium">
                                        {new Date(Number(winningNumber.createdDate) * 1000).toLocaleString("th-TH", {
                                            day: "numeric",
                                            month: "long",
                                            year: "numeric",
                                        })}
                                    </span>
                                </div>
                                <div className="flex items-center">
                                    <Clock className="w-5 h-5 mr-2" />
                                    <span className="font-medium">
                                        {new Date(Number(winningNumber.createdDate) * 1000).toLocaleString("th-TH", {
                                            hour: "numeric",
                                            minute: "numeric",
                                        })}
                                    </span>
                                </div>
                                <div className="bg-white text-yellow-800 py-1 px-4 rounded-full text-sm font-bold">
                                    งวดที่ {winningNumber.roundId}
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Winning Numbers */}
                    <div className="p-6">
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                            {/* First Prize - enhanced */}
                            <div className="bg-gradient-to-br from-yellow-50 to-yellow-100 rounded-xl p-5 shadow-md border-2 border-yellow-400 transform transition hover:translate-y-1 hover:shadow-lg">
                                <div className="text-center">
                                    <div className="inline-flex items-center justify-center bg-yellow-500 text-white p-2 rounded-full mb-3">
                                        <Trophy className="h-6 w-6" />
                                    </div>
                                    <h3 className="text-xl font-bold mb-3 text-yellow-800">รางวัลที่ 1</h3>
                                    <div className="bg-white rounded-lg p-4 shadow-inner mb-3 border border-yellow-300">
                                        <p className="text-5xl font-bold text-yellow-600 tracking-wider">
                                            {winningNumber.winningNumbers[0]}
                                        </p>
                                    </div>
                                    <div className="flex items-center justify-center text-yellow-700">
                                        <Medal className="w-4 h-4 mr-1" />
                                        <p className="font-medium">มูลค่ารางวัล 6,000,000 บาท</p>
                                    </div>
                                </div>
                            </div>

                            {/* Second Prize - enhanced */}
                            <div className="bg-gradient-to-br from-gray-50 to-gray-100 rounded-xl p-5 shadow-md border-2 border-gray-300 transform transition hover:translate-y-1 hover:shadow-lg">
                                <div className="text-center">
                                    <div className="inline-flex items-center justify-center bg-gray-500 text-white p-2 rounded-full mb-3">
                                        <Medal className="h-6 w-6" />
                                    </div>
                                    <h3 className="text-xl font-bold mb-3 text-gray-700">รางวัลที่ 2</h3>
                                    <div className="bg-white rounded-lg p-4 shadow-inner mb-3 border border-gray-300">
                                        <p className="text-4xl font-bold text-gray-600 tracking-wider">
                                            {winningNumber.winningNumbers[1]}
                                        </p>
                                    </div>
                                    <div className="flex items-center justify-center text-gray-700">
                                        <Medal className="w-4 h-4 mr-1" />
                                        <p className="font-medium">มูลค่ารางวัล 200,000 บาท</p>
                                    </div>
                                </div>
                            </div>

                            {/* Third Prize - enhanced */}
                            <div className="bg-gradient-to-br from-amber-50 to-amber-100 rounded-xl p-5 shadow-md border-2 border-amber-400 transform transition hover:translate-y-1 hover:shadow-lg">
                                <div className="text-center">
                                    <div className="inline-flex items-center justify-center bg-amber-600 text-white p-2 rounded-full mb-3">
                                        <Medal className="h-6 w-6" />
                                    </div>
                                    <h3 className="text-xl font-bold mb-3 text-amber-800">รางวัลที่ 3</h3>
                                    <div className="bg-white rounded-lg p-4 shadow-inner mb-3 border border-amber-300">
                                        <p className="text-4xl font-bold text-amber-600 tracking-wider">
                                            {winningNumber.winningNumbers[2]}
                                        </p>
                                    </div>
                                    <div className="flex items-center justify-center text-amber-700">
                                        <Medal className="w-4 h-4 mr-1" />
                                        <p className="font-medium">มูลค่ารางวัล 80,000 บาท</p>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Footer with additional info */}
                    <div className="bg-gray-50 p-4 border-t border-gray-100">
                        <div className="flex items-center text-gray-600 text-sm">
                            <Info className="w-4 h-4 mr-2" />
                            <p>ข้อมูลนี้ใช้เพื่อการอ้างอิงเท่านั้น กรุณาตรวจสอบผลรางวัลอย่างเป็นทางการอีกครั้ง</p>
                        </div>
                    </div>
                </div>
            ) : !error && !loading ? (
                <div className="text-center py-16 bg-white rounded-xl shadow-md border border-gray-100">
                    <div className="inline-flex items-center justify-center bg-gray-200 p-4 rounded-full mb-4">
                        <Info className="w-8 h-8 text-gray-500" />
                    </div>
                    <p className="text-xl text-gray-600">ไม่พบข้อมูลผลรางวัล</p>
                    <p className="mt-2 text-gray-500">กรุณาเลือกงวดอื่น หรือลองใหม่อีกครั้งในภายหลัง</p>
                </div>
            ) : null}

            {/* Winner Details Section */}
            {!loading && winnerData && (
                <div className="mt-8 bg-white rounded-xl shadow-lg overflow-hidden border border-gray-100">
                    <div className="bg-gradient-to-r from-green-500 to-teal-500 p-5 text-white">
                        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-3">
                            <div className="flex items-center">
                                <Trophy className="w-6 h-6 mr-3" />
                                <h2 className="text-xl md:text-2xl font-bold">ผลผู้ชนะรางวัล</h2>
                            </div>
                            <div className="bg-white text-green-800 py-1 px-4 rounded-full text-sm font-bold">
                                งวดที่ {winnerData.roundNumber}
                            </div>
                        </div>
                    </div>

                    <div className="p-6 grid md:grid-cols-2 gap-6">
                        {/* Winning Numbers */}
                        <div className="bg-green-50 p-4 rounded-lg border border-green-200">
                            <h3 className="text-lg font-semibold text-green-800 mb-3 flex items-center">
                                <Award className="mr-2 w-5 h-5 text-green-600" />
                                หมายเลขรางวัล
                            </h3>
                            <div className="flex justify-center space-x-4">
                                {winnerData.winningNumbers.map((number, index) => (
                                    <div 
                                        key={index} 
                                        className="bg-white p-3 rounded-lg shadow-md border border-green-300 text-xl font-bold text-green-700"
                                    >
                                        {number}
                                    </div>
                                ))}
                            </div>
                        </div>

                        {/* Participant Details */}
                        <div className="bg-blue-50 p-4 rounded-lg border border-blue-200">
                            <h3 className="text-lg font-semibold text-blue-800 mb-3 flex items-center">
                                <Users className="mr-2 w-5 h-5 text-blue-600" />
                                รายละเอียดผู้เข้าร่วม
                            </h3>
                            <div className="space-y-2 text-blue-700">
                                <p>จำนวนผู้เข้าร่วม: {winnerData.summary.totalParticipatingUsers}</p>
                                <p>จำนวนตั๋วทั้งหมด: {winnerData.summary.totalTicketsSold}</p>
                                <p>ตั๋วรางวัล: {winnerData.summary.totalWinningTickets}</p>
                            </div>
                        </div>

                        {/* Winner Details */}
                        <div className="md:col-span-2 bg-yellow-50 p-4 rounded-lg border border-yellow-200">
                            <h3 className="text-lg font-semibold text-yellow-800 mb-3 flex items-center">
                                <Ticket className="mr-2 w-5 h-5 text-yellow-600" />
                                รายละเอียดผู้ชนะ
                            </h3>
                            <div className="grid md:grid-cols-2 gap-4 text-yellow-700">
                                <div>
                                    <p className="font-medium">ที่อยู่ผู้ชนะ:</p>
                                    <p className="bg-white p-2 rounded-md break-words">
                                        {winnerData.participants[0].address}
                                    </p>
                                </div>
                                <div>
                                    <p className="font-medium">ตั๋วรางวัล:</p>
                                    <p className="bg-white p-2 rounded-md">
                                        {winnerData.participants[0].tickets.length > 0 
                                            ? winnerData.participants[0].tickets[0].number 
                                            : 'ไม่มีตั๋วรางวัล'}
                                    </p>
                                </div>
                            </div>
                        </div>
                    </div>

                    <div className="bg-gray-50 p-4 text-center text-gray-600 border-t border-gray-200">
                        <p>ข้อมูลการออกรางวัลนี้เป็นเพียงการอ้างอิง กรุณาตรวจสอบข้อมูลกับแหล่งข้อมูลอย่างเป็นทางการ</p>
                    </div>
                </div>
            )}
        </div>
    );
}