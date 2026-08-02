"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import api from "@/lib/api";

export default function RegisterPage() {

    const router = useRouter();

    const [fullName, setFullName] = useState("");
    const [email, setEmail] = useState("");
    const [password, setPassword] = useState("");

    const [loading, setLoading] = useState(false);
    const [error, setError] = useState("");

    const handleRegister = async () => {

        try {

            setLoading(true);
            setError("");

            await api.post("/users/register", {
                full_name: fullName,
                email: email,
                password: password,
            });

            alert("Registration Successful!");

            router.push("/login");

        } catch (err: any) {

            setError(
                err.response?.data?.detail ||
                "Registration failed."
            );

        } finally {

            setLoading(false);

        }

    };

    return (

        <main className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-100 via-white to-indigo-100">

            <div className="bg-white w-[420px] rounded-2xl shadow-2xl p-10">

                <h1 className="text-4xl font-bold text-center text-blue-700 mb-2">
                    Create Account
                </h1>

                <p className="text-center text-gray-500 mb-8">
                    Join AI Asset Vault
                </p>

                <input
                    type="text"
                    placeholder="Full Name"
                    value={fullName}
                    onChange={(e) => setFullName(e.target.value)}
                    className="w-full border border-gray-300 rounded-lg p-3 mb-4 text-gray-900 placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-blue-500"
                />

                <input
                    type="email"
                    placeholder="Email Address"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className="w-full border border-gray-300 rounded-lg p-3 mb-4 text-gray-900 placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-blue-500"
                />

                <input
                    type="password"
                    placeholder="Password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    className="w-full border border-gray-300 rounded-lg p-3 mb-5 text-gray-900 placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-blue-500"
                />

                <button
                    onClick={handleRegister}
                    disabled={loading}
                    className="w-full bg-blue-600 hover:bg-blue-700 transition text-white font-semibold py-3 rounded-lg disabled:bg-gray-400"
                >
                    {loading ? "Creating Account..." : "Create Account"}
                </button>

                {error && (

                    <p className="text-red-500 text-center mt-4">
                        {error}
                    </p>

                )}

                <div className="mt-8 text-center">

                    <p className="text-gray-600">
                        Already have an account?
                    </p>

                    <Link
                        href="/login"
                        className="text-blue-600 font-semibold hover:underline"
                    >
                        Login
                    </Link>

                </div>

                <hr className="my-8" />

                <p className="text-center text-sm text-gray-400">
                    AI Asset Vault
                </p>

            </div>

        </main>

    );

} 