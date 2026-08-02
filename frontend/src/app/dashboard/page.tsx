"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import UploadForm from "@/components/UploadForm";
import AssetList from "@/components/AssetList";
import ChatModal from "@/components/ChatModal";
import api from "@/lib/api";

export default function Dashboard() { 

    const router = useRouter();

    const [loading, setLoading] = useState(true);

    const [userName, setUserName] = useState("");
    const [userEmail, setUserEmail] = useState("");

    // Chat States
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

                setLoading(false);

            } catch (error) {

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

    // Open Chat
    const openChat = (asset: { id: number; file_name: string }) => {

        setSelectedAsset(asset);

        setChatOpen(true);

    };

    // Close Chat
    const closeChat = () => {

        setChatOpen(false);

        setSelectedAsset(null);

    };

    if (loading) {

        return (

            <div className="min-h-screen flex items-center justify-center text-xl font-semibold">

                Checking authentication...

            </div>

        );

    }

    return (

        <main className="min-h-screen bg-gray-100">

            {/* Header */}

            <div className="bg-blue-700 text-white shadow">

                <div className="max-w-7xl mx-auto flex justify-between items-center p-6">

                    <div>

                        <h1 className="text-3xl font-bold">
                            AI Asset Vault
                        </h1>

                        <p className="opacity-90 mt-1">
                            Securely upload, organize and chat with your documents.
                        </p>

                    </div>

                    <div className="flex items-center gap-6">

                        <div className="text-right">

                            <p className="text-sm opacity-80">
                                Logged in as
                            </p>

                            <p className="text-xl font-bold">
                                {userName}
                            </p>

                            <p className="text-sm opacity-90">
                                {userEmail}
                            </p>

                        </div>

                        <button
                            onClick={handleLogout}
                            className="bg-red-500 hover:bg-red-600 transition px-5 py-2 rounded-lg font-semibold"
                        >
                            Logout
                        </button>

                    </div>

                </div>

            </div>

            {/* Main Content */}

            <div className="max-w-7xl mx-auto p-8">

                <UploadForm />

                <div className="mt-10">

                    <AssetList openChat={openChat} />

                </div>

            </div>

            {chatOpen && selectedAsset && (

                <ChatModal
                    asset={selectedAsset}
                    onClose={closeChat}
                />

            )}

        </main>

    );

}