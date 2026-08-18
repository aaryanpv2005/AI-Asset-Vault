"use client";

import { useEffect, useState } from "react";
import api from "@/lib/api";
import { useTheme } from "@/context/ThemeContext";

interface Asset {
    id: number;
    file_name: string;
    file_type: string;
    file_size: number;
    summary: string;
    expiry_date: string | null;
}

interface AssetListProps {
    openChat: (asset: {
        id: number;
        file_name: string;
    }) => void;
}

export default function AssetList({ openChat }: AssetListProps) {

    const { darkMode } = useTheme();

    const [assets, setAssets] = useState<Asset[]>([]);
    const [loading, setLoading] = useState(true);

    const [searchTerm, setSearchTerm] = useState("");
    const [statusFilter, setStatusFilter] = useState("All");
    const [sortOption, setSortOption] = useState("Newest");

    const [previewUrl, setPreviewUrl] = useState<string | null>(null);
    const [previewName, setPreviewName] = useState("");

    /* =========================================================
       FETCH ASSETS
    ========================================================= */

    useEffect(() => {

        const fetchAssets = async () => {

            try {

                const token = localStorage.getItem("token");

                const response = await api.get(
                    "/assets/my-assets",
                    {
                        headers: {
                            Authorization: `Bearer ${token}`,
                        },
                    }
                );

                setAssets(response.data);

            } catch (error) {

                console.error("Failed to fetch assets", error);

            } finally {

                setLoading(false);

            }

        };

        fetchAssets();

    }, []);

    /* =========================================================
       PREVIEW
    ========================================================= */

    const handlePreview = async (asset: Asset) => {

        try {

            const token = localStorage.getItem("token");

            const response = await api.get(
                `/assets/${asset.id}/preview`,
                {
                    headers: {
                        Authorization: `Bearer ${token}`,
                    },
                    responseType: "blob",
                }
            );

            const url = window.URL.createObjectURL(response.data);

            setPreviewUrl(url);
            setPreviewName(asset.file_name);

        } catch (error) {

            console.error("Preview failed", error);

            alert("Failed to preview file.");

        }

    };

    const closePreview = () => {

        if (previewUrl) {
            window.URL.revokeObjectURL(previewUrl);
        }

        setPreviewUrl(null);
        setPreviewName("");

    };

    /* =========================================================
       DOWNLOAD
    ========================================================= */

    const handleDownload = async (asset: Asset) => {

        try {

            const token = localStorage.getItem("token");

            const response = await api.get(
                `/assets/${asset.id}/download`,
                {
                    headers: {
                        Authorization: `Bearer ${token}`,
                    },
                    responseType: "blob",
                }
            );

            const url = window.URL.createObjectURL(response.data);

            const link = document.createElement("a");

            link.href = url;
            link.download = asset.file_name;

            document.body.appendChild(link);

            link.click();

            document.body.removeChild(link);

            window.URL.revokeObjectURL(url);

        } catch (error) {

            console.error("Download failed", error);

            alert("Failed to download file.");

        }

    };

    /* =========================================================
       DELETE
    ========================================================= */

    const handleDelete = async (assetId: number) => {

        const confirmDelete = window.confirm(
            "Are you sure you want to delete this asset?"
        );

        if (!confirmDelete) return;

        try {

            const token = localStorage.getItem("token");

            await api.delete(
                `/assets/${assetId}`,
                {
                    headers: {
                        Authorization: `Bearer ${token}`,
                    },
                }
            );

            setAssets(prev =>
                prev.filter(asset => asset.id !== assetId)
            );

        } catch (error) {

            console.error("Delete failed", error);

            alert("Failed to delete asset.");

        }

    };

    /* =========================================================
       EXPIRY STATUS
    ========================================================= */

    const getExpiryStatus = (expiryDate: string | null) => {

        if (!expiryDate) {

            return {
                label: "No Expiry",
                badge:
                    darkMode
                        ? "bg-gray-800 text-gray-300 border-gray-700"
                        : "bg-gray-100 text-gray-600 border-gray-200",
                text:
                    darkMode
                        ? "text-gray-300"
                        : "text-gray-600",
                accent:
                    darkMode
                        ? "from-gray-600 to-gray-800"
                        : "from-gray-300 to-gray-400",
                icon: "○",
            };

        }

        const today = new Date();

        today.setHours(0, 0, 0, 0);

        const expiry = new Date(expiryDate);

        expiry.setHours(0, 0, 0, 0);

        const difference =
            expiry.getTime() - today.getTime();

        const daysRemaining =
            Math.ceil(
                difference / (1000 * 60 * 60 * 24)
            );

        if (daysRemaining < 0) {

            return {
                label: "Expired",
                badge:
                    darkMode
                        ? "bg-red-950/50 text-red-300 border-red-900/60"
                        : "bg-red-50 text-red-600 border-red-100",
                text:
                    darkMode
                        ? "text-red-400"
                        : "text-red-600",
                accent:
                    "from-red-500 via-rose-500 to-red-600",
                icon: "!",
            };

        }

        if (daysRemaining <= 30) {

            return {
                label: "Expiring Soon",
                badge:
                    darkMode
                        ? "bg-yellow-950/50 text-yellow-300 border-yellow-900/60"
                        : "bg-yellow-50 text-yellow-700 border-yellow-100",
                text:
                    darkMode
                        ? "text-yellow-300"
                        : "text-yellow-600",
                accent:
                    "from-yellow-400 via-orange-400 to-yellow-500",
                icon: "!",
            };

        }

        return {
            label: "Active",
            badge:
                darkMode
                    ? "bg-emerald-950/50 text-emerald-300 border-emerald-900/60"
                    : "bg-emerald-50 text-emerald-700 border-emerald-100",
            text:
                darkMode
                    ? "text-emerald-400"
                    : "text-emerald-600",
            accent:
                "from-blue-500 via-cyan-500 to-emerald-500",
            icon: "✓",
        };

    };

    /* =========================================================
       LOADING
    ========================================================= */

    if (loading) {

        return (

            <div
                className={`rounded-3xl border shadow-xl p-8 transition-colors duration-300 ${
                    darkMode
                        ? "bg-gray-900 border-gray-800 text-white"
                        : "bg-white border-gray-200 text-gray-900"
                }`}
            >

                <div className="flex items-center gap-4">

                    <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-blue-600 to-indigo-600 flex items-center justify-center text-white text-xl animate-pulse">
                        📁
                    </div>

                    <div>

                        <h2 className="text-xl font-bold">
                            Loading your assets
                        </h2>

                        <p
                            className={`text-sm mt-1 ${
                                darkMode
                                    ? "text-gray-400"
                                    : "text-gray-500"
                            }`}
                        >
                            Fetching your secure documents...
                        </p>

                    </div>

                </div>

            </div>

        );

    }

    /* =========================================================
       FILTER + SORT
    ========================================================= */

    const filteredAssets = assets
        .filter((asset) => {

            /* SEARCH */

            const matchesSearch =
                asset.file_name
                    .toLowerCase()
                    .includes(searchTerm.toLowerCase());

            if (!matchesSearch) {
                return false;
            }

            /* ALL */

            if (statusFilter === "All") {
                return true;
            }

            /* NO EXPIRY */

            if (statusFilter === "No Expiry Date") {

                return (
                    asset.expiry_date === null ||
                    asset.expiry_date === undefined ||
                    asset.expiry_date === ""
                );

            }

            /* IMPORTANT:
               No-expiry files are NOT treated as Active.
               They have their own filter.
            */

            if (!asset.expiry_date) {
                return false;
            }

            const today = new Date();

            today.setHours(0, 0, 0, 0);

            const expiry = new Date(asset.expiry_date);

            expiry.setHours(0, 0, 0, 0);

            const difference =
                expiry.getTime() - today.getTime();

            const daysRemaining =
                Math.ceil(
                    difference /
                    (1000 * 60 * 60 * 24)
                );

            /* EXPIRED */

            if (
                statusFilter === "Expired" &&
                daysRemaining < 0
            ) {
                return true;
            }

            /* EXPIRING SOON */

            if (
                statusFilter === "Expiring Soon" &&
                daysRemaining >= 0 &&
                daysRemaining <= 30
            ) {
                return true;
            }

            /* ACTIVE */

            if (
                statusFilter === "Active" &&
                daysRemaining > 30
            ) {
                return true;
            }

            return false;

        })
        .sort((a, b) => {

            if (sortOption === "Name A-Z") {

                return a.file_name.localeCompare(
                    b.file_name
                );

            }

            if (sortOption === "Name Z-A") {

                return b.file_name.localeCompare(
                    a.file_name
                );

            }

            if (sortOption === "Oldest") {

                return a.id - b.id;

            }

            if (sortOption === "Expiry Soonest") {

                if (!a.expiry_date) return 1;

                if (!b.expiry_date) return -1;

                return (
                    new Date(a.expiry_date).getTime() -
                    new Date(b.expiry_date).getTime()
                );

            }

            return b.id - a.id;

        });

    /* =========================================================
       MAIN UI
    ========================================================= */

    return (

        <>

            <section
                className={`rounded-3xl border shadow-xl overflow-hidden transition-colors duration-300 ${
                    darkMode
                        ? "bg-gray-900 border-gray-800"
                        : "bg-white border-gray-200"
                }`}
            >

                {/* =================================================
                   HEADER
                ================================================= */}

                <div
                    className={`px-6 sm:px-8 py-6 border-b ${
                        darkMode
                            ? "border-gray-800"
                            : "border-gray-100"
                    }`}
                >

                    <div className="flex flex-col gap-5">

                        {/* TITLE ROW */}

                        <div className="flex items-center justify-between gap-4">

                            <div className="flex items-center gap-4">

                                <div
                                    className="
                                    w-11 h-11
                                    rounded-2xl
                                    bg-gradient-to-br
                                    from-blue-600
                                    to-indigo-600
                                    flex items-center justify-center
                                    text-white
                                    text-lg
                                    shadow-lg
                                    "
                                >
                                    📁
                                </div>

                                <div>

                                    <h2
                                        className={`text-2xl font-bold ${
                                            darkMode
                                                ? "text-white"
                                                : "text-gray-900"
                                        }`}
                                    >
                                        My Assets
                                    </h2>

                                    <p
                                        className={`text-sm mt-0.5 ${
                                            darkMode
                                                ? "text-gray-400"
                                                : "text-gray-500"
                                        }`}
                                    >
                                        Your secure document collection
                                    </p>

                                </div>

                            </div>

                            <div
                                className={`px-3.5 py-1.5 rounded-full border text-xs font-bold ${
                                    darkMode
                                        ? "bg-gray-800 border-gray-700 text-gray-300"
                                        : "bg-gray-50 border-gray-200 text-gray-600"
                                }`}
                            >
                                {filteredAssets.length}{" "}
                                {filteredAssets.length === 1
                                    ? "Asset"
                                    : "Assets"}
                            </div>

                        </div>


                        {/* =================================================
                           SEARCH + FILTER TOOLBAR
                        ================================================= */}

                        <div className="grid grid-cols-1 md:grid-cols-3 gap-3">

                            {/* SEARCH */}

                            <div className="md:col-span-1 relative">

                                <span
                                    className={`absolute left-4 top-1/2 -translate-y-1/2 ${
                                        darkMode
                                            ? "text-gray-500"
                                            : "text-gray-400"
                                    }`}
                                >
                                    🔍
                                </span>

                                <input
                                    type="text"
                                    value={searchTerm}
                                    onChange={(e) =>
                                        setSearchTerm(e.target.value)
                                    }
                                    placeholder="Search assets..."
                                    className={`w-full pl-11 pr-4 py-3 rounded-xl border outline-none transition-all duration-300 ${
                                        darkMode
                                            ? "bg-gray-950 border-gray-800 text-white placeholder-gray-500 focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20"
                                            : "bg-gray-50 border-gray-200 text-gray-900 placeholder-gray-400 focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20"
                                    }`}
                                />

                            </div>


                            {/* STATUS */}

                            <select
                                value={statusFilter}
                                onChange={(e) =>
                                    setStatusFilter(e.target.value)
                                }
                                className={`w-full px-4 py-3 rounded-xl border outline-none transition-all duration-300 ${
                                    darkMode
                                        ? "bg-gray-950 border-gray-800 text-white focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20"
                                        : "bg-gray-50 border-gray-200 text-gray-900 focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20"
                                }`}
                            >

                                <option value="All">
                                    All Assets
                                </option>

                                <option value="Active">
                                    Active
                                </option>

                                <option value="Expiring Soon">
                                    Expiring Soon
                                </option>

                                <option value="Expired">
                                    Expired
                                </option>

                                <option value="No Expiry Date">
                                    No Expiry Date
                                </option>

                            </select>


                            {/* SORT */}

                            <select
                                value={sortOption}
                                onChange={(e) =>
                                    setSortOption(e.target.value)
                                }
                                className={`w-full px-4 py-3 rounded-xl border outline-none transition-all duration-300 ${
                                    darkMode
                                        ? "bg-gray-950 border-gray-800 text-white focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20"
                                        : "bg-gray-50 border-gray-200 text-gray-900 focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20"
                                }`}
                            >

                                <option value="Newest">
                                    Newest First
                                </option>

                                <option value="Oldest">
                                    Oldest First
                                </option>

                                <option value="Name A-Z">
                                    Name A-Z
                                </option>

                                <option value="Name Z-A">
                                    Name Z-A
                                </option>

                                <option value="Expiry Soonest">
                                    Expiry Date — Soonest First
                                </option>

                            </select>

                        </div>

                    </div>

                </div>


                {/* =================================================
                   EMPTY STATE
                ================================================= */}

                {filteredAssets.length === 0 ? (

                    <div className="px-6 py-14 text-center">

                        <div
                            className={`mx-auto w-16 h-16 rounded-2xl flex items-center justify-center text-2xl ${
                                darkMode
                                    ? "bg-gray-800"
                                    : "bg-blue-50"
                            }`}
                        >
                            📂
                        </div>

                        <h3
                            className={`text-lg font-bold mt-4 ${
                                darkMode
                                    ? "text-white"
                                    : "text-gray-900"
                            }`}
                        >
                            No matching assets
                        </h3>

                        <p
                            className={`mt-2 text-sm max-w-md mx-auto ${
                                darkMode
                                    ? "text-gray-400"
                                    : "text-gray-500"
                            }`}
                        >
                            Try changing your search or status filter.
                        </p>

                    </div>

                ) : (

                    /* =================================================
                       ASSET GRID
                    ================================================= */

                    <div className="p-5 sm:p-7 grid grid-cols-1 xl:grid-cols-2 gap-5">

                        {filteredAssets.map((asset) => {

                            const expiry =
                                getExpiryStatus(
                                    asset.expiry_date
                                );

                            return (

                                <article
                                    key={asset.id}
                                    className={`group relative overflow-hidden rounded-2xl border shadow-sm hover:shadow-xl hover:-translate-y-1 transition-all duration-300 ${
                                        darkMode
                                            ? "bg-gray-950 border-gray-800"
                                            : "bg-gray-50 border-gray-200"
                                    }`}
                                >

                                    {/* TOP STATUS LINE */}

                                    <div
                                        className={`h-1 w-full bg-gradient-to-r ${expiry.accent}`}
                                    />


                                    <div className="p-5">

                                        {/* =================================================
                                           FILE HEADER
                                        ================================================= */}

                                        <div className="flex items-center gap-3">

                                            <div
                                                className={`w-12 h-12 shrink-0 rounded-xl flex items-center justify-center text-xl shadow-sm ${
                                                    darkMode
                                                        ? "bg-blue-900/40"
                                                        : "bg-blue-100"
                                                }`}
                                            >
                                                📄
                                            </div>

                                            <div className="min-w-0 flex-1">

                                                <h3
                                                    className={`font-bold text-base truncate ${
                                                        darkMode
                                                            ? "text-white"
                                                            : "text-gray-900"
                                                    }`}
                                                    title={asset.file_name}
                                                >
                                                    {asset.file_name}
                                                </h3>

                                                <p
                                                    className={`text-xs mt-1 truncate ${
                                                        darkMode
                                                            ? "text-gray-500"
                                                            : "text-gray-500"
                                                    }`}
                                                >
                                                    {asset.file_type}
                                                </p>

                                            </div>

                                            {/* STATUS */}

                                            <span
                                                className={`shrink-0 inline-flex items-center gap-1 px-2.5 py-1 rounded-full border text-[11px] font-bold ${expiry.badge}`}
                                            >
                                                <span>
                                                    {expiry.icon}
                                                </span>

                                                {expiry.label}
                                            </span>

                                        </div>


                                        {/* =================================================
                                           COMPACT META
                                        ================================================= */}

                                        <div
                                            className={`flex flex-wrap items-center gap-x-5 gap-y-2 mt-4 text-xs ${
                                                darkMode
                                                    ? "text-gray-400"
                                                    : "text-gray-500"
                                            }`}
                                        >

                                            <span>
                                                <span className="mr-1 opacity-70">
                                                    Type
                                                </span>
                                                <strong
                                                    className={
                                                        darkMode
                                                            ? "text-gray-300"
                                                            : "text-gray-700"
                                                    }
                                                >
                                                    {asset.file_type}
                                                </strong>
                                            </span>

                                            <span>
                                                <span className="mr-1 opacity-70">
                                                    Size
                                                </span>
                                                <strong
                                                    className={
                                                        darkMode
                                                            ? "text-gray-300"
                                                            : "text-gray-700"
                                                    }
                                                >
                                                    {(asset.file_size / 1024).toFixed(2)} KB
                                                </strong>
                                            </span>

                                            <span>
                                                <span className="mr-1 opacity-70">
                                                    Expiry
                                                </span>
                                                <strong
                                                    className={
                                                        darkMode
                                                            ? "text-gray-300"
                                                            : "text-gray-700"
                                                    }
                                                >
                                                    {asset.expiry_date
                                                        ? asset.expiry_date
                                                            .split("-")
                                                            .reverse()
                                                            .join("/")
                                                        : "None"}
                                                </strong>
                                            </span>

                                        </div>


                                        {/* =================================================
                                           AI SUMMARY
                                        ================================================= */}

                                        <div
                                            className={`mt-4 rounded-xl border p-3.5 ${
                                                darkMode
                                                    ? "bg-gray-900 border-gray-800"
                                                    : "bg-white border-gray-200"
                                            }`}
                                        >

                                            <div className="flex items-center gap-2 mb-2">

                                                <div
                                                    className="
                                                    w-6 h-6
                                                    rounded-lg
                                                    bg-gradient-to-br
                                                    from-violet-500
                                                    to-purple-600
                                                    flex items-center justify-center
                                                    text-white
                                                    text-xs
                                                    "
                                                >
                                                    ✨
                                                </div>

                                                <span
                                                    className={`text-xs font-bold ${
                                                        darkMode
                                                            ? "text-gray-200"
                                                            : "text-gray-800"
                                                    }`}
                                                >
                                                    AI Summary
                                                </span>

                                            </div>

                                            <p
                                                className={`text-sm leading-6 ${
                                                    darkMode
                                                        ? "text-gray-400"
                                                        : "text-gray-600"
                                                }`} 
                                            >
                                                {asset.summary}
                                            </p>

                                        </div>


                                        {/* =================================================
                                           ACTIONS
                                        ================================================= */}

                                        <div
                                            className={`grid grid-cols-4 gap-2 mt-4 pt-4 border-t ${
                                                darkMode
                                                    ? "border-gray-800"
                                                    : "border-gray-200"
                                            }`}
                                        >

                                            {/* VIEW */}

                                            <button
                                                onClick={() =>
                                                    handlePreview(asset)
                                                }
                                                title="View document"
                                                className="
                                                bg-gradient-to-r from-violet-600 to-indigo-600
                                                hover:from-violet-700 hover:to-indigo-700
                                                text-white
                                                text-xs
                                                font-semibold
                                                px-2
                                                py-2.5
                                                rounded-lg
                                                shadow-sm
                                                hover:shadow-md
                                                transition-all duration-200
                                                "
                                            >
                                                View
                                            </button>


                                            {/* DOWNLOAD */}

                                            <button
                                                onClick={() =>
                                                    handleDownload(asset)
                                                }
                                                title="Download document"
                                                className="
                                                bg-gradient-to-r from-blue-600 to-cyan-600
                                                hover:from-blue-700 hover:to-cyan-700
                                                text-white
                                                text-xs
                                                font-semibold
                                                px-2
                                                py-2.5
                                                rounded-lg
                                                shadow-sm
                                                hover:shadow-md
                                                transition-all duration-200
                                                "
                                            >
                                                Download
                                            </button>


                                            {/* CHAT */}

                                            <button
                                                onClick={() =>
                                                    openChat({
                                                        id: asset.id,
                                                        file_name: asset.file_name,
                                                    })
                                                }
                                                title="Chat with document"
                                                className="
                                                bg-gradient-to-r from-emerald-600 to-green-600
                                                hover:from-emerald-700 hover:to-green-700
                                                text-white
                                                text-xs
                                                font-semibold
                                                px-2
                                                py-2.5
                                                rounded-lg
                                                shadow-sm
                                                hover:shadow-md
                                                transition-all duration-200
                                                "
                                            >
                                                Chat
                                            </button>


                                            {/* DELETE */}

                                            <button
                                                onClick={() =>
                                                    handleDelete(asset.id)
                                                }
                                                title="Delete document"
                                                className="
                                                bg-gradient-to-r from-red-600 to-rose-600
                                                hover:from-red-700 hover:to-rose-700
                                                text-white
                                                text-xs
                                                font-semibold
                                                px-2
                                                py-2.5
                                                rounded-lg
                                                shadow-sm
                                                hover:shadow-md
                                                transition-all duration-200
                                                "
                                            >
                                                Delete
                                            </button>

                                        </div>

                                    </div>

                                </article>

                            );

                        })}

                    </div>

                )}

            </section>


            {/* =====================================================
               PDF PREVIEW MODAL
            ===================================================== */}

            {previewUrl && (

                <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/75 backdrop-blur-sm p-4">

                    <div
                        className={`relative w-full max-w-6xl h-[92vh] rounded-3xl shadow-2xl overflow-hidden ${
                            darkMode
                                ? "bg-gray-900"
                                : "bg-white"
                        }`}
                    >

                        {/* MODAL HEADER */}

                        <div
                            className={`flex items-center justify-between gap-4 px-6 py-4 border-b ${
                                darkMode
                                    ? "border-gray-800 text-white"
                                    : "border-gray-200 text-gray-900"
                            }`}
                        >

                            <div className="flex items-center gap-3 min-w-0">

                                <div
                                    className="
                                    w-10 h-10
                                    shrink-0
                                    rounded-xl
                                    bg-gradient-to-br
                                    from-violet-600
                                    to-indigo-600
                                    flex items-center justify-center
                                    text-white
                                    "
                                >
                                    📄
                                </div>

                                <h2
                                    className="font-bold text-lg truncate"
                                    title={previewName}
                                >
                                    {previewName}
                                </h2>

                            </div>

                            <button
                                onClick={closePreview}
                                className="
                                shrink-0
                                bg-gradient-to-r from-red-600 to-rose-600
                                hover:from-red-700 hover:to-rose-700
                                text-white
                                px-5 py-2.5
                                rounded-xl
                                font-semibold
                                shadow-md
                                hover:shadow-lg
                                transition-all duration-300
                                "
                            >
                                Close
                            </button>

                        </div>

                        {/* PDF */}

                        <iframe
                            src={previewUrl}
                            title={previewName}
                            className="w-full h-[calc(92vh-73px)]"
                        />

                    </div>

                </div>

            )}

        </>

    );

}