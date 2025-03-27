// "use client";
// import { signIn } from "next-auth/react";
// import Link from "next/link";
// import { useRouter } from "next/navigation";
// import { useState } from "react";

// export default function SignInForm() {
//     const [email, setEmail] = useState("");
//     const [password, setPassword] = useState("");
//     const router = useRouter();

//     // const handleSubmit = async (e: React.FormEvent) => {
//     //     e.preventDefault();
//     //     const response = await fetch('/api/signin', {
//     //         method: 'POST',
//     //         headers: {
//     //             'Content-Type': 'application/json',
//     //         },
//     //         body: JSON.stringify({ email, password }),
//     //     });
//     //     console.log(response);
//     //     const data = await response.json();
//     //     if (response.ok) {
//     //         router.push('/');
//     //     } else {
//     //         console.error(data.message);
//     //     }
//     // };
    
//     const handleSubmit = async (e: React.FormEvent) => {
//         e.preventDefault();
//         console.log(email, password);
//         const sigInData = await signIn('credentials', {
//             email: email,
//             password: password,
//             redirect: false,
//         })
//         console.log(sigInData?.url)
//         if (sigInData?.error) {
//             console.log(sigInData.error);
//         } else {
//             console.log(sigInData);
//             router.push('/');
//             router.refresh();
//         }
//     }

//     return (
//         <div className="flex min-h-screen items-center justify-center bg-gray-100">
//             <div className="w-full max-w-md p-8 space-y-6 bg-white shadow-lg rounded-2xl">
//                 <h1 className="text-3xl font-semibold text-center text-gray-800">Sign In</h1>
//                 <form onSubmit={handleSubmit} className="space-y-4">
//                     <div>
//                         <label className="block text-sm font-medium text-gray-700">Email</label>
//                         <input
//                             type="email"
//                             value={email}
//                             onChange={(e) => setEmail(e.target.value)}
//                             required
//                             className="w-full mt-1 px-4 py-2 border rounded-lg shadow-sm focus:ring-2 focus:ring-blue-400 focus:outline-none"
//                         />
//                     </div>
//                     <div>
//                         <label className="block text-sm font-medium text-gray-700">Password</label>
//                         <input
//                             type="password"
//                             value={password}
//                             onChange={(e) => setPassword(e.target.value)}
//                             required
//                             className="w-full mt-1 px-4 py-2 border rounded-lg shadow-sm focus:ring-2 focus:ring-blue-400 focus:outline-none"
//                         />
//                     </div>
//                     <button
//                         type="submit"
//                         className="w-full px-4 py-2 text-white bg-blue-600 rounded-lg hover:bg-blue-700 focus:ring-2 focus:ring-blue-400"
//                     >
//                         Sign In
//                     </button>
//                     <div className="text-center text-sm text-gray-600">
//                         Don't have an account? <Link href="/register" className="text-blue-600 hover:underline">Sign Up</Link>
//                     </div>
//                 </form>
//             </div>
//         </div>
//     );
// }

"use client";
import { signIn } from "next-auth/react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { useState, useEffect } from "react";

export default function SignInForm() {
    const [email, setEmail] = useState("");
    const [password, setPassword] = useState("");
    const [error, setError] = useState("");
    const [isLoading, setIsLoading] = useState(false);
    const router = useRouter();
    const searchParams = useSearchParams();

    // Check for registration success message
    useEffect(() => {
        const registered = searchParams.get("registered");
        if (registered === "true") {
            setError("Account created successfully! Please sign in.");
        }
    }, [searchParams]);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setError("");
        setIsLoading(true);

        try {
            const signInData = await signIn('credentials', {
                email: email,
                password: password,
                redirect: false,
            });

            if (signInData?.error) {
                // Handle different error types
                if (signInData.error === "CredentialsSignin") {
                    setError("Invalid email or password. Please try again.");
                } else if (signInData.error.includes("email")) {
                    setError("Email not found. Please check your email address.");
                } else if (signInData.error.includes("password")) {
                    setError("Incorrect password. Please try again.");
                } else {
                    setError("Sign in failed. Please try again.");
                }
            } else {
                // Successful login
                router.push('/');
                router.refresh();
            }
        } catch (err) {
            console.error("Sign in error:", err);
            setError("An unexpected error occurred. Please try again.");
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <div className="flex min-h-screen items-center justify-center bg-gray-100">
            <div className="w-full max-w-md p-8 space-y-6 bg-white shadow-lg rounded-2xl">
                <h1 className="text-3xl font-semibold text-center text-gray-800">Sign In</h1>

                {error && (
                    <div className={`p-3 text-sm rounded ${error.includes("created successfully")
                            ? "bg-green-100 text-green-700 border border-green-400"
                            : "bg-red-100 text-red-700 border border-red-400"
                        }`}>
                        {error}
                    </div>
                )}

                <form onSubmit={handleSubmit} className="space-y-4">
                    <div>
                        <label className="block text-sm font-medium text-gray-700">Email</label>
                        <input
                            type="email"
                            value={email}
                            onChange={(e) => setEmail(e.target.value)}
                            required
                            disabled={isLoading}
                            className="w-full mt-1 px-4 py-2 border rounded-lg shadow-sm focus:ring-2 focus:ring-blue-400 focus:outline-none"
                        />
                    </div>
                    <div>
                        <label className="block text-sm font-medium text-gray-700">Password</label>
                        <input
                            type="password"
                            value={password}
                            onChange={(e) => setPassword(e.target.value)}
                            required
                            disabled={isLoading}
                            className="w-full mt-1 px-4 py-2 border rounded-lg shadow-sm focus:ring-2 focus:ring-blue-400 focus:outline-none"
                        />
                        {/* <div className="flex justify-end mt-1">
                            <Link href="/forgot-password" className="text-xs text-blue-600 hover:underline">
                                Forgot password?
                            </Link>
                        </div> */}
                    </div>
                    <button
                        type="submit"
                        disabled={isLoading}
                        className={`w-full px-4 py-2 text-white rounded-lg focus:ring-2 focus:ring-blue-400 ${isLoading
                                ? "bg-blue-400 cursor-not-allowed"
                                : "bg-blue-600 hover:bg-blue-700"
                            }`}
                    >
                        {isLoading ? "Signing In..." : "Sign In"}
                    </button>
                    <div className="text-center text-sm text-gray-600">
                        Don't have an account? <Link href="/register" className="text-blue-600 hover:underline">Sign Up</Link>
                    </div>
                </form>
            </div>
        </div>
    );
}