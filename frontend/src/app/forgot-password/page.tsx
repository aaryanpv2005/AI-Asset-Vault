"use client";

import { useState } from "react";
import Link from "next/link";
import api from "@/lib/api";

export default function ForgotPasswordPage() {

    const [email, setEmail] = useState("");
    const [loading, setLoading] = useState(false);
    const [message, setMessage] = useState("");
    const [error, setError] = useState("");

    const handleForgotPassword = async () => {

        try {

            setLoading(true);
            setError("");
            setMessage("");

            const response = await api.post(
                "/users/forgot-password",
                {
                    email: email
                }
            );

            setMessage(response.data.message);

        } catch (err: any) {

            setError(
                err.response?.data?.detail ||
                "Something went wrong. Please try again."
            );

        } finally {

            setLoading(false);

        }

    };

    return (

        <main className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-100 via-white to-indigo-100">

            <div className="bg-white w-[420px] rounded-2xl shadow-2xl p-10">

                <h1 className="text-3xl font-bold text-center text-blue-700 mb-2">
                    Forgot Password
                </h1>

                <p className="text-center text-gray-500 mb-8">
                    Enter your email address and we'll send you a password reset link.
                </p>

                <input
                    type="email"
                    placeholder="Email Address"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className="w-full border border-gray-300 rounded-lg p-3 mb-5 text-gray-900 placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-blue-500"
                />

                <button
                    onClick={handleForgotPassword}
                    disabled={loading || !email}
                    className="w-full bg-blue-600 hover:bg-blue-700 transition text-white font-semibold py-3 rounded-lg disabled:bg-gray-400"
                >
                    {loading
                        ? "Sending..."
                        : "Send Reset Link"}
                </button>

                {message && (

                    <p className="text-green-600 text-center mt-5">
                        {message}
                    </p>

                )}

                {error && (

                    <p className="text-red-500 text-center mt-5">
                        {error}
                    </p>

                )}

                <div className="mt-8 text-center">

                    <Link
                        href="/login"
                        className="text-blue-600 font-semibold hover:underline"
                    >
                        Back to Login
                    </Link>

                </div>

            </div>

        </main>

    );

}