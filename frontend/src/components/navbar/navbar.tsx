import { auth, signOut } from "@/libs/auth";
import Link from "next/link";
import SignOut from "./signout";
import ConnectWallet from "./connectWallet";

export async function getUserTickets(userAddress) {
    if (!userAddress) return [];

    const res = await fetch(`http://localhost:5000/api/user-tickets/${userAddress}`);
    const data = await res.json();
    return data.tickets || [];
}

export async function getWinners() {

    const res = await fetch(`http://localhost:5000/api/getWinningResults`);
    const data = await res.json();
    return data;
}

export default async function Nav() {
    const session = await auth();
    if (session) {
        console.log(session.user);
    }
    console.log(session?.user.address)
    const userTicketsData = await getUserTickets(session?.user.address)
    console.log(userTicketsData)

    const userAddress = session?.user?.address || "";


    const allwinner = (await getWinners())?.data || []; // ใช้ .data เพื่อเข้าถึง array จริง
    console.log("allwinner", allwinner);
    const userTicketsWithResults = userTicketsData.map((roundData: { pair: any[]; roundId: any; single: any[] }) => {
        return {
            ...roundData,
            // สำหรับหวยชุด (Pair Lottery)
            pair: roundData.pair.map((ticketNumber: any) => {
                // หา winner จาก allwinner
                const winner = allwinner.find(
                    (winner: { user: string; roundId: any; ticketNumber: any; }) =>
                        winner.user.toLowerCase() === session?.user?.address.toLowerCase() &&
                        winner.roundId === roundData.roundId &&
                        winner.ticketNumber === ticketNumber
                );

                // ถ้าพบผู้ชนะ ให้เพิ่มข้อมูล prizeRank
                const isWinner = winner ? true : false;
                const prizeRank = winner ? winner.prizeRank : null; // prizeRank จะเป็น null ถ้าไม่พบผู้ชนะ

                return {
                    number: ticketNumber,
                    isWinner,
                    prizeRank // เพิ่มข้อมูลรางวัล (prizeRank)
                };
            }),
            // สำหรับหวยเดี่ยว (Single Lottery)
            single: roundData.single.map((ticketNumber: any) => {
                // หา winner จาก allwinner
                const winner = allwinner.find(
                    (winner: { user: string; roundId: any; ticketNumber: any; }) =>
                        winner.user.toLowerCase() === session?.user?.address.toLowerCase() &&
                        winner.roundId === roundData.roundId &&
                        winner.ticketNumber === ticketNumber
                );

                // ถ้าพบผู้ชนะ ให้เพิ่มข้อมูล prizeRank
                const isWinner = winner ? true : false;
                const prizeRank = winner ? winner.prizeRank : null; // prizeRank จะเป็น null ถ้าไม่พบผู้ชนะ

                return {
                    number: ticketNumber,
                    isWinner,
                    prizeRank // เพิ่มข้อมูลรางวัล (prizeRank)
                };
            })
        };
    });



    console.log("userTicketsWithResults", userTicketsWithResults);



    return (
        <nav className="bg-gradient-to-r from-blue-800 to-blue-400 text-white shadow-lg">
            <div className="flex justify-between items-center px-4 py-2">
                <div className="flex items-center space-x-4">
                    {/* Brand/logo */}
                    <a href="/" className="text-xl font-black tracking-wider px-3 py-2 rounded-md hover:bg-blue-800/20 transition-colors">
                        LOTTORUAY
                    </a>
                    {/* Links on the left side next to "DOLLARS" */}
                    <ul className="hidden lg:flex items-center space-x-2">
                        {/* <li>
                            <a href="/checklottery" className="flex items-center px-3 py-2 rounded-md font-semibold hover:bg-blue-400/20 transition-colors">
                                <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9.75 17L9 20l-1 1h8l-1-1-.75-3M3 13h18M5 17h14a2 2 0 002-2V5a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                                </svg>
                                reward history
                            </a>
                        </li> */}
                        <li>
                            <a href="/checklottery" className="flex items-center px-3 py-2 rounded-md font-semibold hover:bg-blue-400/20 transition-colors">
                                <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M16 15v-1a4 4 0 00-4-4H8m0 0l3 3m-3-3l3-3m9 14V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16l4-2 4 2 4-2 4 2z" />
                                </svg>
                                reward history
                            </a>
                        </li>
                    </ul>
                </div>

                <div className="navbar-end">
                    <ConnectWallet />
                    {session?.user ? (
                        <div className="dropdown dropdown-end">
                            <div tabIndex={0} role="button" className="btn btn-ghost gap-2">
                                <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5.121 17.804A13.937 13.937 0 0112 16c2.5 0 4.847.655 6.879 1.804M15 10a3 3 0 11-6 0 3 3 0 016 0zm6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                                </svg>
                                <span className="font-semibold">{session.user.name}</span>
                                <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 9l-7 7-7-7" />
                                </svg>
                            </div>
                            <ul tabIndex={0} className="dropdown-content menu menu-sm z-[1] mt-3 w-52 rounded-box bg-base-100 shadow-lg p-2 text-neutral-800">
                                <li>
                                    <a className="flex items-center gap-2">
                                        <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                                        </svg>
                                        Profile
                                    </a>
                                </li>
                                <li>
                                    <label htmlFor="tickets-modal" className="flex items-center gap-2 cursor-pointer">
                                        <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 5v2m0 4v2m0 4v2M5 5a2 2 0 00-2 2v3a2 2 0 110 4v3a2 2 0 002 2h14a2 2 0 002-2v-3a2 2 0 110-4V7a2 2 0 00-2-2H5z" />
                                        </svg>
                                        My Tickets
                                    </label>
                                </li>
                                <li>
                                    <a className="flex items-center gap-2">
                                        <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                                        </svg>
                                        Settings
                                    </a>
                                </li>
                                <div className="divider my-1"></div>
                                <SignOut />
                            </ul>
                        </div>
                    ) : (
                        <a href="/login" className="btn btn-ghost gap-2 font-semibold hover:bg-blue-600/20">
                            <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M11 16l-4-4m0 0l4-4m-4 4h14m-5 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V6a3 3 0 013-3h5a3 3 0 013 3v1" />
                            </svg>
                            Login
                        </a>
                    )}
                </div>
            </div>

            {/* Tickets Modal */}
            <>
                <input type="checkbox" id="tickets-modal" className="modal-toggle" />
                <div className="modal">
                    <div className="modal-box max-w-4xl w-full mt-4 bg-white">
                        <h3 className="font-bold text-2xl text-center text-blue-900 mb-6">
                            My Lottery Tickets
                        </h3>

                        <div className="py-2">
                            {userTicketsWithResults && userTicketsWithResults.length > 0 ? (
                                <div className="space-y-6">
                                    {userTicketsWithResults.map((roundData, index) => (
                                        <div
                                            key={index}
                                            className="border border-blue-100 rounded-xl p-6 bg-white shadow-sm"
                                        >
                                            <div className="flex justify-between items-center mb-4">
                                                <h4 className="font-semibold text-xl text-blue-900">
                                                    Round {roundData.roundId}
                                                </h4>
                                            </div>

                                            <div className="mb-6">
                                                <h5 className="text-md font-medium text-gray-600 mb-4">
                                                    Single Lottery (หวยเดี่ยว)
                                                </h5>
                                                {roundData.single && roundData.single.length > 0 ? (
                                                    <div className="grid grid-cols-4 md:grid-cols-6 gap-3">
                                                        {roundData.single.map((ticket, ticketIndex) => (
                                                            <div
                                                                key={ticketIndex}
                                                                className={`relative rounded-lg p-3 text-center transition-all duration-300 ${ticket.isWinner
                                                                    ? (
                                                                        ticket.prizeRank === '0'
                                                                            ? 'bg-yellow-50 border-2 border-yellow-200 text-yellow-800'
                                                                            : ticket.prizeRank === '1'
                                                                                ? 'bg-gray-50 border-2 border-gray-200 text-gray-800'
                                                                                : ticket.prizeRank === '2'
                                                                                    ? 'bg-orange-50 border-2 border-orange-200 text-orange-800'
                                                                                    : 'bg-blue-50 border border-blue-100 text-blue-800'
                                                                    )
                                                                    : 'bg-blue-100 border border-blue-200 text-blue-900'
                                                                    }`}
                                                            >
                                                                {ticket.isWinner && (
                                                                    <div className={`absolute top-1 right-1 rounded-full px-2  text-xs font-semibold ${ticket.prizeRank === '0'
                                                                        ? 'bg-yellow-100 text-yellow-800'
                                                                        : ticket.prizeRank === '1'
                                                                            ? 'bg-gray-100 text-gray-800'
                                                                            : ticket.prizeRank === '2'
                                                                                ? 'bg-orange-100 text-orange-800'
                                                                                : 'bg-blue-100 text-blue-800'
                                                                        }`}>
                                                                        ถูกรางวัล!
                                                                    </div>
                                                                )}
                                                                <div className="text-lg font-bold">
                                                                    {ticket.number}
                                                                </div>
                                                                {ticket.isWinner && (
                                                                    <div className="text-xs font-medium mt-1">
                                                                        รางวัลที่ {Number(ticket.prizeRank) + 1}
                                                                    </div>
                                                                )}
                                                            </div>
                                                        ))}
                                                    </div>
                                                ) : (
                                                    <p className="text-gray-500 italic text-center text-sm">No single lottery tickets</p>
                                                )}
                                            </div>

                                            <div>
                                                <h5 className="text-md font-medium text-gray-600 mb-4">
                                                    Pair Lottery (หวยชุด)
                                                </h5>
                                                {roundData.pair && roundData.pair.length > 0 ? (
                                                    <div className="grid grid-cols-4 md:grid-cols-6 gap-3">
                                                        {roundData.pair.map((ticket, ticketIndex) => (
                                                            <div
                                                                key={ticketIndex}
                                                                className={`relative rounded-lg p-3 text-center transition-all duration-300 ${ticket.isWinner
                                                                    ? (
                                                                        ticket.prizeRank === '0'
                                                                            ? 'bg-yellow-50 border-2 border-yellow-200 text-yellow-800'
                                                                            : ticket.prizeRank === '1'
                                                                                ? 'bg-gray-50 border-2 border-gray-200 text-gray-800'
                                                                                : ticket.prizeRank === '2'
                                                                                    ? 'bg-orange-50 border-2 border-orange-200 text-orange-800'
                                                                                    : 'bg-green-50 border border-green-100 text-green-800'
                                                                    )
                                                                    : 'bg-green-100 border border-green-200 text-green-900'
                                                                    }`}
                                                            >
                                                                {ticket.isWinner && (
                                                                    <div className={`absolute top-1 right-1 rounded-full px-2  text-xs font-semibold ${ticket.prizeRank === '0'
                                                                        ? 'bg-yellow-100 text-yellow-800'
                                                                        : ticket.prizeRank === '1'
                                                                            ? 'bg-gray-100 text-gray-800'
                                                                            : ticket.prizeRank === '2'
                                                                                ? 'bg-orange-100 text-orange-800'
                                                                                : 'bg-green-100 text-green-800'
                                                                        }`}>
                                                                        ถูกรางวัล!
                                                                    </div>
                                                                )}
                                                                <div className="text-lg font-bold">
                                                                    {ticket.number}
                                                                </div>
                                                                {ticket.isWinner && (
                                                                    <div className="text-xs font-medium mt-1">
                                                                        รางวัลที่ {Number(ticket.prizeRank) + 1}
                                                                    </div>
                                                                )}
                                                            </div>
                                                        ))}
                                                    </div>
                                                ) : (
                                                    <p className="text-gray-500 italic text-center text-sm">No pair lottery tickets</p>
                                                )}
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            ) : (
                                <div className="text-center py-12 bg-gray-50 rounded-xl">
                                    <p className="text-gray-600 mb-6 text-xl">You don't have any lottery tickets yet.</p>
                                    <a href="/" className="btn btn-primary btn-wide">
                                        Buy Tickets
                                    </a>
                                </div>
                            )}
                        </div>

                        <div className="modal-action mt-6">
                            <label
                                htmlFor="tickets-modal"
                                className="btn btn-ghost bg-gray-200 text-black"
                            >
                                Close
                            </label>
                        </div>
                    </div>
                    <label className="modal-backdrop" htmlFor="tickets-modal"></label>
                </div>
            </>

        </nav>
    );
}