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

export default async function Nav() {
    const session = await auth();
    if (session) {
        console.log(session.user);
    }
    console.log(session?.user.address)
    const userTicketsData = await getUserTickets(session?.user.address)
    console.log(userTicketsData)

    return (
        <nav className="bg-gradient-to-r from-blue-800 to-blue-400 text-white shadow-lg">
            <div className="flex justify-between items-center px-4 py-2">
                <div className="flex items-center space-x-4">
                    {/* Brand/logo */}
                    <a href="/home" className="text-xl font-black tracking-wider px-3 py-2 rounded-md hover:bg-blue-800/20 transition-colors">
                        หวยครัว
                    </a>
                    {/* Links on the left side next to "DOLLARS" */}
                    <ul className="hidden lg:flex items-center space-x-2">
                        <li>
                            <a href="/bot" className="flex items-center px-3 py-2 rounded-md font-semibold hover:bg-blue-400/20 transition-colors">
                                <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9.75 17L9 20l-1 1h8l-1-1-.75-3M3 13h18M5 17h14a2 2 0 002-2V5a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                                </svg>
                                Bot
                            </a>
                        </li>
                        <li>
                            <a href="/accounts" className="flex items-center px-3 py-2 rounded-md font-semibold hover:bg-red-600/20 transition-colors">
                                <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M3 6l3 1m0 0l-3 9a5.002 5.002 0 006.001 0M6 7l3 9M6 7l6-2m6 2l3-1m-3 1l-3 9a5.002 5.002 0 006.001 0M18 7l3 9m-3-9l-6-2m0-2v2m0 16V5m0 16H9m3 0h3" />
                                </svg>
                                Accounts
                            </a>
                        </li>
                        <li>
                            <a href="/payment" className="flex items-center px-3 py-2 rounded-md font-semibold hover:bg-red-600/20 transition-colors">
                                <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M3 10h18M7 15h1m4 0h1m-7 4h12a3 3 0 003-3V8a3 3 0 00-3-3H6a3 3 0 00-3 3v8a3 3 0 003 3z" />
                                </svg>
                                Payment
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
                
                <div className="modal-box max-w-3xl w-full mt-4 ">
                    <h3 className="font-bold text-xl text-center text-blue-900 mb-4">
                        My Lottery Tickets
                    </h3>
                    
                    <div className="py-2">
                        {userTicketsData && userTicketsData.length > 0 ? (
                            <div className="space-y-4">
                                {userTicketsData.map((roundData, index) => (
                                    <div 
                                        key={index} 
                                        className="border-2 border-blue-200 rounded-xl p-4 bg-blue-50/50 hover:bg-blue-100/50 transition-colors duration-200"
                                    >
                                        <div className="flex justify-between items-center mb-3">
                                            <h4 className="font-semibold text-lg text-blue-800">
                                                Round {roundData.roundId}
                                            </h4>
                                        </div>

                                        <div className="mb-4">
                                            <h5 className="text-md font-medium text-gray-700 mb-2 flex items-center">
                                                <svg 
                                                    xmlns="http://www.w3.org/2000/svg" 
                                                    className="h-5 w-5 mr-2 text-blue-600" 
                                                    viewBox="0 0 20 20" 
                                                    fill="currentColor"
                                                >
                                                    <path d="M9 2a1 1 0 000 2h2a1 1 0 100-2H9z"/>
                                                    <path fillRule="evenodd" d="M4 5a2 2 0 012-2 3 3 0 003 3h2a3 3 0 003-3 2 2 0 012 2v11a2 2 0 01-2 2H6a2 2 0 01-2-2V5zm3 4a1 1 0 000 2h.01a1 1 0 100-2H7zm3 0a1 1 0 000 2h3a1 1 0 100-2h-3zm-3 4a1 1 0 000 2h.01a1 1 0 100-2H7zm3 0a1 1 0 000 2h3a1 1 0 100-2h-3z" clipRule="evenodd"/>
                                                </svg>
                                                Single Lottery (หวยเดี่ยว)
                                            </h5>
                                            {roundData.single && roundData.single.length > 0 ? (
                                                <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-5 gap-2">
                                                    {roundData.single.map((ticket, ticketIndex) => (
                                                        <div 
                                                            key={ticketIndex} 
                                                            className="bg-gradient-to-br from-blue-900 to-blue-700 p-3 rounded-lg shadow-md text-center font-mono text-white hover:scale-105 transition-transform"
                                                        >
                                                            {ticket}
                                                        </div>
                                                    ))}
                                                </div>
                                            ) : (
                                                <p className="text-gray-500 italic text-center">No single lottery tickets</p>
                                            )}
                                        </div>

                                        <div>
                                            <h5 className="text-md font-medium text-gray-700 mb-2 flex items-center">
                                                <svg 
                                                    xmlns="http://www.w3.org/2000/svg" 
                                                    className="h-5 w-5 mr-2 text-green-600" 
                                                    viewBox="0 0 20 20" 
                                                    fill="currentColor"
                                                >
                                                    <path fillRule="evenodd" d="M4 2a2 2 0 00-2 2v11a3 3 0 106 0V4a2 2 0 00-2-2H4zm1 14a1 1 0 100-2 1 1 0 000 2zm5-1.758l4.564-4.02a2 2 0 00.436-2.279l-1.627-3.254a1 1 0 00-1.591-.301L10 9.5 6.177 6.389a1 1 0 00-1.59.3L2.96 9.944a2 2 0 00.435 2.28L8 16.243z" clipRule="evenodd"/>
                                                </svg>
                                                Pair Lottery (หวยชุด)
                                            </h5>
                                            {roundData.pair && roundData.pair.length > 0 ? (
                                                <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-5 gap-2">
                                                    {roundData.pair.map((ticket, ticketIndex) => (
                                                        <div 
                                                            key={ticketIndex} 
                                                            className="bg-gradient-to-br from-green-900 to-green-700 p-3 rounded-lg shadow-md text-center font-mono text-white hover:scale-105 transition-transform"
                                                        >
                                                            {ticket}
                                                        </div>
                                                    ))}
                                                </div>
                                            ) : (
                                                <p className="text-gray-500 italic text-center">No pair lottery tickets</p>
                                            )}
                                        </div>
                                    </div>
                                ))}
                            </div>
                        ) : (
                            <div className="text-center py-8 bg-gray-50 rounded-xl">
                                <svg 
                                    xmlns="http://www.w3.org/2000/svg" 
                                    className="h-16 w-16 mx-auto mb-4 text-gray-400" 
                                    fill="none" 
                                    viewBox="0 0 24 24" 
                                    stroke="currentColor"
                                >
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                                </svg>
                                <p className="text-gray-600 mb-4">You don't have any lottery tickets yet.</p>
                                <a 
                                    href="/buy-tickets" 
                                    className="btn btn-primary btn-wide hover:btn-accent transition-colors"
                                >
                                    Buy Tickets
                                </a>
                            </div>
                        )}
                    </div>

                    <div className="modal-action mt-4">
                        <label 
                            htmlFor="tickets-modal" 
                            className="btn btn-ghost bg-amber-200 text-black hover:bg-gray-200 transition-colors"
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