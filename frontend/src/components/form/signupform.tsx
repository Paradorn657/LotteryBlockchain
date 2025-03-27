// "use client";
// import { z } from "zod";
// import Link from "next/link";
// import { on } from "events";
// import { useRouter } from "next/navigation";
// import { useState } from "react";

// const FormSchema = z.object({
//     username: z.string().min(1, "Username is requried").max(100),
//     // address: z.string().min(1, "Address is requried").max(100),
//     email: z.string().min(1,"Email is required").email('invalid email'),
//     password:z
//         .string()
//         .min(1,'password is required')
//         .min(8,'password must have than 8 characters'),
// })

// export default function SignUpForm() {

//     // .refine((data) => data.password === data.confirmPassword, {
//     //     path: ["confirmPassword"],
//     //     message: "Passwords do not match",
//     // });

//     // const onSubmit = async (value: z.infer<typeof FormSchema>) => {
//     //     const response = await fetch("/auth/",{
//     //         method: "POST",
//     //         headers: {
//     //             "Content-Type": "application/json",
//     //         },
//     //         body: JSON.stringify({
//     //             username: value.username,
//     //             email: value.email,
//     //             password: value.password,
//     //         })
//     //     })
//     //     if(response.ok){
//     //         // const data = await response.json();
//     //         // console.log(data);
//     //         router.push("/login");
//     //     }
//     //     else{
//     //         // const data = await response.json();
//     //         console.error("An error occurred");
//     //     }
//     // }

//     const [username,setUsername] = useState("");
//     const [email,setEmail] = useState("");
//     const [password,setPassword] = useState("");
//     const [address,setAddress] = useState("")
//     const router = useRouter();

//     const handleSubmit = async (e: React.FormEvent) => {
//         e.preventDefault();
//         const validated = FormSchema.safeParse({ username, email, password});
//         if (!validated.success) {
//             console.error(validated.error);
//             return;
//         }
//         const response = await fetch('/api/signup', {
//             method: 'POST',
//             headers: {
//                 'Content-Type': 'application/json',
//             },
//             body: JSON.stringify(validated.data),
//         });
//         if (response.ok) {
//             router.push('/login');
//         } else {
//             console.error('An error occurred');
//         }
//     };

//     return (
//         <div className="flex min-h-screen items-center justify-center bg-gray-100">
//             <div className="w-full max-w-md p-8 space-y-6 bg-white shadow-lg rounded-2xl">
//                 <h1 className="text-3xl font-semibold text-center text-gray-800">Sign Up</h1>
//                 <form onSubmit={handleSubmit} className="space-y-6">
//                     <div>
//                         <label htmlFor="username" className="block text-sm font-medium text-gray-700">
//                             Username
//                         </label>
//                         <input
//                             id="username"
//                             name="username"
//                             type="text"
//                             value={username}
//                             onChange={(e) => setUsername(e.target.value)}
//                             required
//                             className="w-full mt-1 px-4 py-2 border rounded-lg shadow-sm focus:ring-2 focus:ring-blue-400 focus:outline-none"
//                         />
//                     </div>
//                     {/* <div>
//                         <label htmlFor="username" className="block text-sm font-medium text-gray-700">
//                             Address
//                         </label>
//                         <input
//                             id="address"
//                             name="address"
//                             type="text"
//                             value={address}
//                             onChange={(e) => setAddress(e.target.value)}
//                             required
//                             className="w-full mt-1 px-4 py-2 border rounded-lg shadow-sm focus:ring-2 focus:ring-blue-400 focus:outline-none"
//                         />
//                     </div> */}
//                     <div>
//                         <label htmlFor="email" className="block text-sm font-medium text-gray-700">
//                             Email
//                         </label>
//                         <input
//                             id="email"
//                             name="email"
//                             type="email"
//                             value={email}
//                             onChange={(e) => setEmail(e.target.value)}
//                             required
//                             className="w-full mt-1 px-4 py-2 border rounded-lg shadow-sm focus:ring-2 focus:ring-blue-400 focus:outline-none"
//                         />
//                     </div>
//                     <div>
//                         <label htmlFor="password" className="block text-sm font-medium text-gray-700">
//                             Password
//                         </label>
//                         <input
//                             id="password"
//                             name="password"
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
//                         Sign Up
//                     </button>
//                     <div className="text-center text-sm text-gray-600">
//                         Already have an account? <Link href="/login" className="text-blue-600 hover:underline">Sign In</Link>
//                     </div>
//                 </form>
//             </div>
//         </div>
//     );
// }

"use client";
import { z } from "zod";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";

const FormSchema = z.object({
    username: z.string().min(1, "Username is required").max(100),
    email: z.string().min(1, "Email is required").email('Invalid email'),
    password: z
        .string()
        .min(1, 'Password is required')
        .min(8, 'Password must have at least 8 characters')
        .regex(/[A-Z]/, 'Password must contain at least one uppercase letter')
        .regex(/[a-z]/, 'Password must contain at least one lowercase letter')
        .regex(/[0-9]/, 'Password must contain at least one number'),
    confirmPassword: z.string().min(1, 'Please confirm your password'),
}).refine((data) => data.password === data.confirmPassword, {
    path: ["confirmPassword"],
    message: "Passwords do not match",
});

export default function SignUpForm() {
    const [username, setUsername] = useState("");
    const [email, setEmail] = useState("");
    const [password, setPassword] = useState("");
    const [confirmPassword, setConfirmPassword] = useState("");
    const [errors, setErrors] = useState<Record<string, string>>({});
    const [isChecking, setIsChecking] = useState(false);
    const [isSubmitting, setIsSubmitting] = useState(false);
    const router = useRouter();

    // Debounce function to prevent too many API calls
    const debounce = (func: Function, delay: number) => {
        let timeoutId: NodeJS.Timeout;
        return (...args: any[]) => {
            clearTimeout(timeoutId);
            timeoutId = setTimeout(() => func(...args), delay);
        };
    };

    // Check username availability
    const checkUsernameAvailability = debounce(async (username: string) => {
        if (username.length < 1) return;

        setIsChecking(true);
        try {
            const response = await fetch(`/api/check-username?username=${encodeURIComponent(username)}`);
            const data = await response.json();

            if (!data.available) {
                setErrors(prev => ({ ...prev, username: "Username is already taken" }));
            } else {
                setErrors(prev => {
                    const newErrors = { ...prev };
                    delete newErrors.username;
                    return newErrors;
                });
            }
        } catch (error) {
            console.error("Error checking username:", error);
        } finally {
            setIsChecking(false);
        }
    }, 500);

    // Check email availability
    const checkEmailAvailability = debounce(async (email: string) => {
        if (email.length < 1 || !email.includes('@')) return;

        setIsChecking(true);
        try {
            const response = await fetch(`/api/check-email?email=${encodeURIComponent(email)}`);
            const data = await response.json();

            if (!data.available) {
                setErrors(prev => ({ ...prev, email: "Email is already registered" }));
            } else {
                setErrors(prev => {
                    const newErrors = { ...prev };
                    delete newErrors.email;
                    return newErrors;
                });
            }
        } catch (error) {
            console.error("Error checking email:", error);
        } finally {
            setIsChecking(false);
        }
    }, 500);

    const validatePassword = (password: string) => {
        try {
            z.string()
                .min(8, 'Password must have at least 8 characters')
                .regex(/[A-Z]/, 'Password must contain at least one uppercase letter')
                .regex(/[a-z]/, 'Password must contain at least one lowercase letter')
                .regex(/[0-9]/, 'Password must contain at least one number')
                .parse(password);

            setErrors(prev => {
                const newErrors = { ...prev };
                delete newErrors.password;
                return newErrors;
            });
        } catch (error) {
            if (error instanceof z.ZodError) {
                setErrors(prev => ({ ...prev, password: error.errors[0].message }));
            }
        }
    };

    const validateConfirmPassword = (confirmPwd: string) => {
        if (confirmPwd !== password) {
            setErrors(prev => ({ ...prev, confirmPassword: "Passwords do not match" }));
        } else {
            setErrors(prev => {
                const newErrors = { ...prev };
                delete newErrors.confirmPassword;
                return newErrors;
            });
        }
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setIsSubmitting(true);

        try {
            // Validate all fields
            const validated = FormSchema.safeParse({ username, email, password, confirmPassword });

            if (!validated.success) {
                const fieldErrors: Record<string, string> = {};
                validated.error.errors.forEach(error => {
                    fieldErrors[error.path[0].toString()] = error.message;
                });
                setErrors(fieldErrors);
                return;
            }

            // Check for any existing errors before submission
            if (Object.keys(errors).length > 0) {
                return;
            }

            const response = await fetch('/api/signup', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    username: validated.data.username,
                    email: validated.data.email,
                    password: validated.data.password,
                }),
            });

            if (response.ok) {
                router.push('/login?registered=true');
            } else {
                const data = await response.json();
                setErrors({ form: data.message || 'Registration failed. Please try again.' });
            }
        } catch (error) {
            console.error('An error occurred during signup:', error);
            setErrors({ form: 'An unexpected error occurred. Please try again.' });
        } finally {
            setIsSubmitting(false);
        }
    };

    return (
        <div className="flex min-h-screen items-center justify-center bg-gray-100">
            <div className="w-full max-w-md p-8 space-y-6 bg-white shadow-lg rounded-2xl">
                <h1 className="text-3xl font-semibold text-center text-gray-800">Sign Up</h1>
                {errors.form && (
                    <div className="p-3 bg-red-100 border border-red-400 text-red-700 rounded">
                        {errors.form}
                    </div>
                )}
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
                            onChange={(e) => {
                                setUsername(e.target.value);
                                checkUsernameAvailability(e.target.value);
                            }}
                            required
                            className={`w-full mt-1 px-4 py-2 border rounded-lg shadow-sm focus:outline-none ${errors.username ? 'border-red-500 focus:ring-red-400' : 'focus:ring-2 focus:ring-blue-400'
                                }`}
                        />
                        {errors.username && (
                            <p className="mt-1 text-sm text-red-600">{errors.username}</p>
                        )}
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
                            onChange={(e) => {
                                setEmail(e.target.value);
                                checkEmailAvailability(e.target.value);
                            }}
                            required
                            className={`w-full mt-1 px-4 py-2 border rounded-lg shadow-sm focus:outline-none ${errors.email ? 'border-red-500 focus:ring-red-400' : 'focus:ring-2 focus:ring-blue-400'
                                }`}
                        />
                        {errors.email && (
                            <p className="mt-1 text-sm text-red-600">{errors.email}</p>
                        )}
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
                            onChange={(e) => {
                                setPassword(e.target.value);
                                validatePassword(e.target.value);
                                if (confirmPassword) {
                                    validateConfirmPassword(confirmPassword);
                                }
                            }}
                            required
                            className={`w-full mt-1 px-4 py-2 border rounded-lg shadow-sm focus:outline-none ${errors.password ? 'border-red-500 focus:ring-red-400' : 'focus:ring-2 focus:ring-blue-400'
                                }`}
                        />
                        {errors.password ? (
                            <p className="mt-1 text-sm text-red-600">{errors.password}</p>
                        ) : (
                            <p className="mt-1 text-xs text-gray-500">
                                Password must be at least 8 characters with uppercase, lowercase, and number
                            </p>
                        )}
                    </div>
                    <div>
                        <label htmlFor="confirmPassword" className="block text-sm font-medium text-gray-700">
                            Confirm Password
                        </label>
                        <input
                            id="confirmPassword"
                            name="confirmPassword"
                            type="password"
                            value={confirmPassword}
                            onChange={(e) => {
                                setConfirmPassword(e.target.value);
                                validateConfirmPassword(e.target.value);
                            }}
                            required
                            className={`w-full mt-1 px-4 py-2 border rounded-lg shadow-sm focus:outline-none ${errors.confirmPassword ? 'border-red-500 focus:ring-red-400' : 'focus:ring-2 focus:ring-blue-400'
                                }`}
                        />
                        {errors.confirmPassword && (
                            <p className="mt-1 text-sm text-red-600">{errors.confirmPassword}</p>
                        )}
                    </div>
                    <button
                        type="submit"
                        disabled={isSubmitting || isChecking || Object.keys(errors).length > 0}
                        className={`w-full px-4 py-2 text-white rounded-lg focus:ring-2 focus:ring-blue-400 ${isSubmitting || isChecking || Object.keys(errors).length > 0
                            ? 'bg-blue-400 cursor-not-allowed'
                            : 'bg-blue-600 hover:bg-blue-700'
                            }`}
                    >
                        {isSubmitting ? 'Creating Account...' : 'Sign Up'}
                    </button>
                    <div className="text-center text-sm text-gray-600">
                        Already have an account? <Link href="/login" className="text-blue-600 hover:underline">Sign In</Link>
                    </div>
                </form>
            </div>
        </div>
    );
}