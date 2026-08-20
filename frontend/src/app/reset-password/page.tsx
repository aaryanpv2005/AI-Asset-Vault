"use client";

import { useState } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import api from "@/lib/api";

export default function ResetPasswordPage() {
    const searchParams = useSearchParams();
    const router = useRouter();

    const token = searchParams.get("token");

    const [password, setPassword] = useState("");
    const [confirmPassword, setConfirmPassword] = useState("");

    const [loading, setLoading] = useState(false);
    const [message, setMessage] = useState("");
    const [error, setError] = useState("");

    const handleResetPassword = async () => {
        setError("");
        setMessage("");

        if (!token) {
            setError("Invalid password reset link.");
            return;
        }

        if (password.length < 8) {
            setError("Password must be at least 8 characters long.");
            return;
        }

        if (password !== confirmPassword) {
            setError("Passwords do not match.");
            return;
        }

        try {
            setLoading(true);

            await api.post("/users/reset-password", {
                token: token,
                new_password: password,
            });

            setMessage(
                "Password reset successfully. Redirecting to login..."
            );

            setTimeout(() => {
                router.push("/login");
            }, 2000);

        } catch (err: any) {
            setError(
                err.response?.data?.detail ||
                "Password reset failed. Please try again."
            );
        } finally {
            setLoading(false);
        }
    };

    return (
        <main className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-100 via-white to-indigo-100">

            <div className="bg-white w-[420px] rounded-2xl shadow-2xl p-10">

                <h1 className="text-3xl font-bold text-center text-blue-700 mb-2">
                    Reset Password
                </h1>

                <p className="text-center text-gray-500 mb-8">
                    Create a new password for your AI Asset Vault account.
                </p>

                {!token ? (
                    <p className="text-red-500 text-center">
                        Invalid or missing password reset token.
                    </p>
                ) : (
                    <>
                        <input
                            type="password"
                            placeholder="New Password"
                            value={password}
                            onChange={(e) => setPassword(e.target.value)}
                            className="w-full border border-gray-300 rounded-lg p-3 mb-4 text-gray-900 placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-blue-500"
                        />

                        <input
                            type="password"
                            placeholder="Confirm New Password"
                            value={confirmPassword}
                            onChange={(e) =>
                                setConfirmPassword(e.target.value)
                            }
                            className="w-full border border-gray-300 rounded-lg p-3 mb-5 text-gray-900 placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-blue-500"
                        />

                        <button
                            onClick={handleResetPassword}
                            disabled={loading}
                            className="w-full bg-blue-600 hover:bg-blue-700 transition text-white font-semibold py-3 rounded-lg disabled:bg-gray-400"
                        >
                            {loading
                                ? "Resetting..."
                                : "Reset Password"}
                        </button>
                    </>
                )}

                {error && (
                    <p className="text-red-500 text-center mt-4">
                        {error}
                    </p>
                )}

                {message && (
                    <p className="text-green-600 text-center mt-4">
                        {message}
                    </p>
                )}

                <p className="text-center text-sm text-gray-400 mt-8">
                    AI Asset Vault
                </p>

            </div>
        </main>
    );
}