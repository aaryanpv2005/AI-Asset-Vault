"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import UploadForm from "@/components/UploadForm";
import AssetList from "@/components/AssetList";
import ChatModal from "@/components/ChatModal";
import api from "@/lib/api";
import { useTheme } from "@/context/ThemeContext";

export default function Dashboard() {

    const router = useRouter();
    const { darkMode, toggleTheme } = useTheme();

    const [loading, setLoading] = useState(true);

    const [userName, setUserName] = useState("");
    const [userEmail, setUserEmail] = useState("");
    const [totalAssets, setTotalAssets] = useState(0);
    const [activeAssets, setActiveAssets] = useState(0);
    const [expiringAssets, setExpiringAssets] = useState(0);
    const [expiredAssets, setExpiredAssets] = useState(0); 

    const [chatOpen, setChatOpen] = useState(false);

    const [selectedAsset, setSelectedAsset] = useState<{
        id: number;
        file_name: string;
    } | null>(null);

    useEffect(() => {

        const checkAuth = async () => {

            const token = localStorage.getItem("token");

            if (!token) {
                router.replace("/login");
                return;
            }

            try {

                const response = await api.get("/users/me", {
                    headers: {
                        Authorization: `Bearer ${token}`,
                    },
                });

                setUserName(response.data.full_name);
                setUserEmail(response.data.email);

                            const assetsResponse = await api.get("/assets/my-assets", {
                headers: {
                    Authorization: `Bearer ${token}`,
                },
            });

            const assets = assetsResponse.data;

            const today = new Date();
            today.setHours(0, 0, 0, 0);

            let active = 0;
            let expiring = 0;
            let expired = 0;

            assets.forEach((asset: {
                expiry_date: string | null;
            }) => {

                if (!asset.expiry_date) {
                    return;
                }

                const expiry = new Date(asset.expiry_date);
                expiry.setHours(0, 0, 0, 0);

                const difference =
                    expiry.getTime() - today.getTime();

                const daysRemaining =
                    Math.ceil(
                        difference / (1000 * 60 * 60 * 24)
                    );

                if (daysRemaining < 0) {
                    expired++;
                } else if (daysRemaining <= 30) {
                    expiring++;
                } else {
                    active++;
                }

            });

            setTotalAssets(assets.length);
            setActiveAssets(active);
            setExpiringAssets(expiring);
            setExpiredAssets(expired);

            setLoading(false);

            } catch (error) {

                console.error("Authentication failed", error);

                localStorage.removeItem("token");

                router.replace("/login");

            }

        };

        checkAuth();

    }, [router]);

    const handleLogout = () => {

        localStorage.removeItem("token");

        router.replace("/login");

    };

    const openChat = (asset: {
        id: number;
        file_name: string;
    }) => {

        setSelectedAsset(asset);
        setChatOpen(true);

    };

    const closeChat = () => {

        setChatOpen(false);
        setSelectedAsset(null);

    };

    if (loading) {

        return (

            <div
                className={`min-h-screen flex items-center justify-center transition-colors duration-300 ${
                    darkMode
                        ? "bg-gray-950 text-white"
                        : "bg-gray-100 text-gray-900"
                }`}
            >

                <div className="text-center">

                    <div className="mx-auto mb-4 w-10 h-10 border-4 border-blue-500 border-t-transparent rounded-full animate-spin" />

                    <p className="text-lg font-semibold">
                        Checking authentication...
                    </p>

                    <p
                        className={`text-sm mt-1 ${
                            darkMode
                                ? "text-gray-400"
                                : "text-gray-500"
                        }`}
                    >
                        Please wait
                    </p>

                </div>

            </div>

        );

    }

    return (

        <main
            className={`min-h-screen transition-colors duration-300 ${
                darkMode
                    ? "bg-gray-950"
                    : "bg-gray-100"
            }`}
        >

            {/* ================= HEADER ================= */}

            <header
                className={`sticky top-0 z-40 border-b backdrop-blur-xl transition-all duration-300 ${
                    darkMode
                        ? "bg-gray-900/90 border-gray-800"
                        : "bg-white/90 border-gray-200"
                }`}
            >

                <div className="max-w-7xl mx-auto px-6 py-4">

                    <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-5">

                        {/* ================= BRAND ================= */}

                        <div className="flex items-center gap-4">

                            <div
                                className="
                                w-12 h-12
                                rounded-2xl
                                bg-gradient-to-br
                                from-blue-600
                                via-indigo-600
                                to-purple-600
                                flex items-center justify-center
                                shadow-lg
                                shadow-blue-500/20
                                "
                            >

                                <span className="text-white text-2xl font-extrabold">
                                    A
                                </span>

                            </div>

                            <div>

                                <h1
                                    className={`text-2xl font-extrabold tracking-tight ${
                                        darkMode
                                            ? "text-white"
                                            : "text-gray-900"
                                    }`}
                                >
                                    AI Asset Vault
                                </h1>

                                <p
                                    className={`text-sm ${
                                        darkMode
                                            ? "text-gray-400"
                                            : "text-gray-500"
                                    }`}
                                >
                                    Secure AI-powered document management
                                </p>

                            </div>

                        </div>

                        {/* ================= RIGHT SIDE ================= */}

                        <div className="flex flex-wrap items-center gap-3">

                            {/* USER PROFILE */}

                            <div
                                className={`hidden sm:flex items-center gap-3 px-4 py-2.5 rounded-2xl border transition-colors duration-300 ${
                                    darkMode
                                        ? "bg-gray-800/80 border-gray-700"
                                        : "bg-gray-50 border-gray-200"
                                }`}
                            >

                                <div
                                    className="
                                    w-10 h-10
                                    rounded-xl
                                    bg-gradient-to-br
                                    from-cyan-500
                                    to-blue-600
                                    flex items-center justify-center
                                    text-white
                                    font-bold
                                    shadow-md
                                    "
                                >

                                    {userName
                                        ? userName.charAt(0).toUpperCase()
                                        : "U"}

                                </div>

                                <div className="leading-tight">

                                    <p
                                        className={`text-xs ${
                                            darkMode
                                                ? "text-gray-400"
                                                : "text-gray-500"
                                        }`}
                                    >
                                        Logged in as
                                    </p>

                                    <p
                                        className={`font-semibold ${
                                            darkMode
                                                ? "text-white"
                                                : "text-gray-900"
                                        }`}
                                    >
                                        {userName}
                                    </p>

                                    <p
                                        className={`text-xs max-w-[220px] truncate ${
                                            darkMode
                                                ? "text-gray-400"
                                                : "text-gray-500"
                                        }`}
                                        title={userEmail}
                                    >
                                        {userEmail}
                                    </p>

                                </div>

                            </div>

                            {/* THEME BUTTON */}

                            <button
                                onClick={toggleTheme}
                                title={
                                    darkMode
                                        ? "Switch to light mode"
                                        : "Switch to dark mode"
                                }
                                aria-label={
                                    darkMode
                                        ? "Switch to light mode"
                                        : "Switch to dark mode"
                                }
                                className={`w-11 h-11 rounded-xl flex items-center justify-center border text-lg transition-all duration-300 hover:-translate-y-0.5 hover:shadow-md ${
                                    darkMode
                                        ? "bg-gray-800 border-gray-700 text-yellow-300 hover:bg-gray-700"
                                        : "bg-gray-100 border-gray-200 text-gray-700 hover:bg-gray-200"
                                }`}
                            >

                                {darkMode ? "☀️" : "🌙"}

                            </button>

                            {/* LOGOUT */}

                            <button
                                onClick={handleLogout}
                                className="
                                px-5 py-2.5
                                rounded-xl
                                bg-gradient-to-r
                                from-red-600
                                to-rose-600
                                hover:from-red-700
                                hover:to-rose-700
                                text-white
                                font-semibold
                                shadow-md
                                hover:shadow-lg
                                hover:-translate-y-0.5
                                active:translate-y-0
                                transition-all
                                duration-300
                                "
                            >
                                Logout
                            </button>

                        </div>

                    </div>

                </div>

            </header>

            {/* ================= MAIN CONTENT ================= */}

            <div className="max-w-7xl mx-auto px-6 py-8">

                {/* ================= WELCOME ================= */}

                <div className="mb-8">

                    <div
                        className={`inline-flex items-center px-3 py-1 rounded-full text-xs font-semibold mb-3 ${
                            darkMode
                                ? "bg-blue-900/40 text-blue-300"
                                : "bg-blue-100 text-blue-700"
                        }`}
                    >
                        🔐 Secure Workspace
                    </div>

                    <p
                        className={`text-sm font-medium mb-1 ${
                            darkMode
                                ? "text-blue-400"
                                : "text-blue-600"
                        }`}
                    >
                        Welcome back
                    </p>

                    <h2
                        className={`text-3xl sm:text-4xl font-extrabold tracking-tight ${
                            darkMode
                                ? "text-white"
                                : "text-gray-900"
                        }`}
                    >
                        {userName}
                    </h2>

                    <p
                        className={`mt-2 max-w-2xl ${
                            darkMode
                                ? "text-gray-400"
                                : "text-gray-600"
                        }`}
                    >
                        Manage your documents securely and interact with them
                        using AI.
                    </p>

                </div>

                {/* ================= STATISTICS ================= */}

<div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5 mb-8">

    {/* TOTAL ASSETS */}

    <div
        className={`rounded-2xl p-5 border shadow-sm transition-all duration-300 hover:-translate-y-1 hover:shadow-lg ${
            darkMode
                ? "bg-gray-900 border-gray-800"
                : "bg-white border-gray-200"
        }`}
    >

        <div className="flex items-center justify-between">

            <div>

                <p
                    className={`text-sm font-medium ${
                        darkMode
                            ? "text-gray-400"
                            : "text-gray-500"
                    }`}
                >
                    Total Assets
                </p>

                <p
                    className={`text-3xl font-bold mt-2 ${
                        darkMode
                            ? "text-white"
                            : "text-gray-900"
                    }`}
                >
                    {totalAssets}
                </p>

            </div>

            <div className="w-12 h-12 rounded-xl bg-blue-100 dark:bg-blue-900/40 flex items-center justify-center text-2xl">
                📁
            </div>

        </div>

    </div>


    {/* ACTIVE */}

    <div
        className={`rounded-2xl p-5 border shadow-sm transition-all duration-300 hover:-translate-y-1 hover:shadow-lg ${
            darkMode
                ? "bg-gray-900 border-gray-800"
                : "bg-white border-gray-200"
        }`}
    >

        <div className="flex items-center justify-between">

            <div>

                <p
                    className={`text-sm font-medium ${
                        darkMode
                            ? "text-gray-400"
                            : "text-gray-500"
                    }`}
                >
                    Active
                </p>

                <p className="text-3xl font-bold mt-2 text-green-500">
                    {activeAssets}
                </p>

            </div>

            <div className="w-12 h-12 rounded-xl bg-green-100 dark:bg-green-900/40 flex items-center justify-center text-2xl">
                ✓
            </div>

        </div>

    </div>


    {/* EXPIRING SOON */}

    <div
        className={`rounded-2xl p-5 border shadow-sm transition-all duration-300 hover:-translate-y-1 hover:shadow-lg ${
            darkMode
                ? "bg-gray-900 border-gray-800"
                : "bg-white border-gray-200"
        }`}
    >

        <div className="flex items-center justify-between">

            <div>

                <p
                    className={`text-sm font-medium ${
                        darkMode
                            ? "text-gray-400"
                            : "text-gray-500"
                    }`}
                >
                    Expiring Soon
                </p>

                <p className="text-3xl font-bold mt-2 text-yellow-500">
                    {expiringAssets}
                </p>

            </div>

            <div className="w-12 h-12 rounded-xl bg-yellow-100 dark:bg-yellow-900/40 flex items-center justify-center text-2xl">
                ⚠
            </div>

        </div>

    </div>


    {/* EXPIRED */}

    <div
        className={`rounded-2xl p-5 border shadow-sm transition-all duration-300 hover:-translate-y-1 hover:shadow-lg ${
            darkMode
                ? "bg-gray-900 border-gray-800"
                : "bg-white border-gray-200"
        }`}
    >

        <div className="flex items-center justify-between">

            <div>

                <p
                    className={`text-sm font-medium ${
                        darkMode
                            ? "text-gray-400"
                            : "text-gray-500"
                    }`}
                >
                    Expired
                </p>

                <p className="text-3xl font-bold mt-2 text-red-500">
                    {expiredAssets}
                </p>

            </div>

            <div className="w-12 h-12 rounded-xl bg-red-100 dark:bg-red-900/40 flex items-center justify-center text-2xl">
                !
            </div>

        </div>

    </div>

</div>

                {/* ================= UPLOAD ================= */}

                <UploadForm />

                {/* ================= ASSETS ================= */}

                <div className="mt-10">

                    <AssetList
                        openChat={openChat}
                    />

                </div>

            </div>

            {/* ================= CHAT MODAL ================= */}

            {chatOpen && selectedAsset && (

                <ChatModal
                    asset={selectedAsset}
                    onClose={closeChat}
                />

            )}

        </main>

    );

}