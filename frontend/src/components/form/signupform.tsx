"use client";
import { z } from "zod";
import Link from "next/link";
import { on } from "events";
import { useRouter } from "next/navigation";
import { useState } from "react";

const FormSchema = z.object({
    username: z.string().min(1, "Username is requried").max(100),
    address: z.string().min(1, "Address is requried").max(100),
    email: z.string().min(1,"Email is required").email('invalid email'),
    password:z
        .string()
        .min(1,'password is required')
        .min(8,'password must have than 8 characters'),
})

export default function SignUpForm() {
    
    // .refine((data) => data.password === data.confirmPassword, {
    //     path: ["confirmPassword"],
    //     message: "Passwords do not match",
    // });

    // const onSubmit = async (value: z.infer<typeof FormSchema>) => {
    //     const response = await fetch("/auth/",{
    //         method: "POST",
    //         headers: {
    //             "Content-Type": "application/json",
    //         },
    //         body: JSON.stringify({
    //             username: value.username,
    //             email: value.email,
    //             password: value.password,
    //         })
    //     })
    //     if(response.ok){
    //         // const data = await response.json();
    //         // console.log(data);
    //         router.push("/login");
    //     }
    //     else{
    //         // const data = await response.json();
    //         console.error("An error occurred");
    //     }
    // }

    const [username,setUsername] = useState("");
    const [email,setEmail] = useState("");
    const [password,setPassword] = useState("");
    const [address,setAddress] = useState("")
    const router = useRouter();

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        const validated = FormSchema.safeParse({ username, email, password,address });
        if (!validated.success) {
            console.error(validated.error);
            return;
        }
        const response = await fetch('/api/signup', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify(validated.data),
        });
        if (response.ok) {
            router.push('/login');
        } else {
            console.error('An error occurred');
        }
    };

    return (
        <div className="flex min-h-screen items-center justify-center bg-gray-100">
            <div className="w-full max-w-md p-8 space-y-6 bg-white shadow-lg rounded-2xl">
                <h1 className="text-3xl font-semibold text-center text-gray-800">Sign Up</h1>
                <form onSubmit={handleSubmit} className="space-y-6">
                    <div>
                        <label htmlFor="username" className="block text-sm font-medium text-gray-700">
                            Username
                        </label>
                        <input
                            id="username"
                            name="username"
                            type="text"
                            value={username}
                            onChange={(e) => setUsername(e.target.value)}
                            required
                            className="w-full mt-1 px-4 py-2 border rounded-lg shadow-sm focus:ring-2 focus:ring-blue-400 focus:outline-none"
                        />
                    </div>
                    <div>
                        <label htmlFor="username" className="block text-sm font-medium text-gray-700">
                            Address
                        </label>
                        <input
                            id="address"
                            name="address"
                            type="text"
                            value={address}
                            onChange={(e) => setAddress(e.target.value)}
                            required
                            className="w-full mt-1 px-4 py-2 border rounded-lg shadow-sm focus:ring-2 focus:ring-blue-400 focus:outline-none"
                        />
                    </div>
                    <div>
                        <label htmlFor="email" className="block text-sm font-medium text-gray-700">
                            Email
                        </label>
                        <input
                            id="email"
                            name="email"
                            type="email"
                            value={email}
                            onChange={(e) => setEmail(e.target.value)}
                            required
                            className="w-full mt-1 px-4 py-2 border rounded-lg shadow-sm focus:ring-2 focus:ring-blue-400 focus:outline-none"
                        />
                    </div>
                    <div>
                        <label htmlFor="password" className="block text-sm font-medium text-gray-700">
                            Password
                        </label>
                        <input
                            id="password"
                            name="password"
                            type="password"
                            value={password}
                            onChange={(e) => setPassword(e.target.value)}
                            required
                            className="w-full mt-1 px-4 py-2 border rounded-lg shadow-sm focus:ring-2 focus:ring-blue-400 focus:outline-none"
                        />
                    </div>
                    <button
                        type="submit"
                        className="w-full px-4 py-2 text-white bg-blue-600 rounded-lg hover:bg-blue-700 focus:ring-2 focus:ring-blue-400"
                    >
                        Sign Up
                    </button>
                    <div className="text-center text-sm text-gray-600">
                        Already have an account? <Link href="/login" className="text-blue-600 hover:underline">Sign In</Link>
                    </div>
                </form>
            </div>
        </div>
    );
}
