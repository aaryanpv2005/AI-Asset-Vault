"use client";

import { useState } from "react";
import api from "@/lib/api";
import { useTheme } from "@/context/ThemeContext";

export default function UploadForm() {

    const { darkMode } = useTheme();

    const [file, setFile] = useState<File | null>(null);
    const [expiryDate, setExpiryDate] = useState("");
    const [loading, setLoading] = useState(false);

    const uploadFile = async () => {

        if (!file) {
            alert("Please select a file.");
            return;
        }

        try {

            setLoading(true);

            const formData = new FormData();

            formData.append("file", file);

            if (expiryDate) {
                formData.append("expiry_date", expiryDate);
            }

            const token = localStorage.getItem("token");

            await api.post(
                "/assets/upload",
                formData,
                {
                    headers: {
                        Authorization: `Bearer ${token}`,
                    },
                }
            );

            alert("Upload Successful!");

            setFile(null);
            setExpiryDate("");

            window.location.reload();

        } catch (error) {

            console.error(error);

            alert("Upload Failed");

        } finally {

            setLoading(false);

        }

    };

    return (

        <section
            className={`relative overflow-hidden rounded-3xl border shadow-xl transition-all duration-300 ${
                darkMode
                    ? "bg-gray-900 border-gray-800"
                    : "bg-white border-gray-200"
            }`}
        >

            {/* ================= DECORATIVE BACKGROUND ================= */}

            <div
                className={`absolute -top-24 -right-24 w-64 h-64 rounded-full blur-3xl opacity-20 ${
                    darkMode
                        ? "bg-blue-600"
                        : "bg-blue-400"
                }`}
            />

            <div
                className={`absolute -bottom-32 -left-24 w-64 h-64 rounded-full blur-3xl opacity-10 ${
                    darkMode
                        ? "bg-indigo-600"
                        : "bg-indigo-400"
                }`}
            />

            <div className="relative p-6 sm:p-8">

                {/* ================= HEADER ================= */}

                <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-5 mb-7">

                    <div className="flex items-center gap-4">

                        <div
                            className="
                            w-14 h-14
                            rounded-2xl
                            bg-gradient-to-br
                            from-blue-600
                            to-indigo-600
                            flex items-center justify-center
                            text-white
                            text-2xl
                            shadow-lg
                            shrink-0
                            "
                        >
                            ↑
                        </div>

                        <div>

                            <h2
                                className={`text-2xl font-bold ${
                                    darkMode
                                        ? "text-white"
                                        : "text-gray-900"
                                }`}
                            >
                                Upload Document
                            </h2>

                            <p
                                className={`text-sm mt-1 ${
                                    darkMode
                                        ? "text-gray-400"
                                        : "text-gray-500"
                                }`}
                            >
                                Add a document to your secure AI-powered vault
                            </p>

                        </div>

                    </div>

                    {/* SECURITY BADGE */}

                    <div
                        className={`self-start sm:self-auto flex items-center gap-2 px-4 py-2 rounded-full border text-xs font-semibold ${
                            darkMode
                                ? "bg-emerald-950/40 border-emerald-900/60 text-emerald-300"
                                : "bg-emerald-50 border-emerald-100 text-emerald-700"
                        }`}
                    >

                        <span className="text-sm">
                            🔒
                        </span>

                        Secure Upload

                    </div>

                </div>


                {/* ================= FILE UPLOAD AREA ================= */}

                <div
                    className={`relative rounded-2xl border-2 border-dashed p-6 sm:p-8 transition-all duration-300 ${
                        file
                            ? darkMode
                                ? "border-blue-600 bg-blue-950/20"
                                : "border-blue-400 bg-blue-50/60"
                            : darkMode
                                ? "border-gray-700 bg-gray-950/60 hover:border-blue-600 hover:bg-blue-950/10"
                                : "border-gray-300 bg-gray-50 hover:border-blue-400 hover:bg-blue-50/40"
                    }`}
                >

                    <div className="flex flex-col items-center text-center">

                        <div
                            className={`w-16 h-16 rounded-2xl flex items-center justify-center text-3xl mb-4 ${
                                file
                                    ? darkMode
                                        ? "bg-blue-900/50"
                                        : "bg-blue-100"
                                    : darkMode
                                        ? "bg-gray-800"
                                        : "bg-white"
                            }`}
                        >
                            {file ? "📄" : "☁️"}
                        </div>

                        {file ? (

                            <>

                                <h3
                                    className={`font-bold text-lg max-w-full truncate ${
                                        darkMode
                                            ? "text-white"
                                            : "text-gray-900"
                                    }`}
                                    title={file.name}
                                >
                                    {file.name}
                                </h3>

                                <p
                                    className={`text-sm mt-1 ${
                                        darkMode
                                            ? "text-gray-400"
                                            : "text-gray-500"
                                    }`}
                                >
                                    {(file.size / 1024).toFixed(2)} KB selected
                                </p>

                            </>

                        ) : (

                            <>

                                <h3
                                    className={`font-bold text-lg ${
                                        darkMode
                                            ? "text-white"
                                            : "text-gray-900"
                                    }`}
                                >
                                    Choose a document
                                </h3>

                                <p
                                    className={`text-sm mt-1 ${
                                        darkMode
                                            ? "text-gray-400"
                                            : "text-gray-500"
                                    }`}
                                >
                                    Select a file from your computer
                                </p>

                            </>

                        )}

                        {/* FILE INPUT */}

                        <label
                            className="
                            mt-5
                            cursor-pointer
                            inline-flex
                            items-center
                            gap-2
                            px-5
                            py-2.5
                            rounded-xl
                            bg-gradient-to-r
                            from-blue-600
                            to-indigo-600
                            hover:from-blue-700
                            hover:to-indigo-700
                            text-white
                            font-semibold
                            shadow-md
                            hover:shadow-lg
                            hover:-translate-y-0.5
                            transition-all
                            duration-300
                            "
                        >

                            📁

                            {file ? "Change File" : "Choose File"}

                            <input
                                type="file"
                                onChange={(e) =>
                                    setFile(
                                        e.target.files
                                            ? e.target.files[0]
                                            : null
                                    )
                                }
                                className="hidden"
                            />

                        </label>

                        <p
                            className={`text-xs mt-3 ${
                                darkMode
                                    ? "text-gray-500"
                                    : "text-gray-400"
                            }`}
                        >
                            Your selected document will be securely uploaded
                        </p>

                    </div>

                </div>


                {/* ================= EXPIRY ================= */}

                <div className="mt-6">

                    <div className="flex items-center justify-between mb-2">

                        <label
                            className={`font-semibold text-sm ${
                                darkMode
                                    ? "text-gray-200"
                                    : "text-gray-800"
                            }`}
                        >
                            Expiry Date
                        </label>

                        <span
                            className={`text-xs px-2.5 py-1 rounded-full ${
                                darkMode
                                    ? "bg-gray-800 text-gray-400"
                                    : "bg-gray-100 text-gray-500"
                            }`}
                        >
                            Optional
                        </span>

                    </div>

                    <div className="relative">

                        <input
                            type="date"
                            value={expiryDate}
                            onChange={(e) =>
                                setExpiryDate(e.target.value)
                            }
                            className={`w-full border rounded-xl px-4 py-3.5 outline-none transition-all duration-300 ${
                                darkMode
                                    ? "bg-gray-950 border-gray-700 text-white focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20"
                                    : "bg-gray-50 border-gray-200 text-gray-900 focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20"
                            }`}
                        />

                    </div>

                    <p
                        className={`text-xs mt-2 ${
                            darkMode
                                ? "text-gray-500"
                                : "text-gray-400"
                        }`}
                    >
                        Leave this empty if the document does not expire.
                    </p>

                </div>


                {/* ================= UPLOAD BUTTON ================= */}

                <div
                    className={`mt-7 pt-6 border-t ${
                        darkMode
                            ? "border-gray-800"
                            : "border-gray-100"
                    }`}
                >

                    <button
                        onClick={uploadFile}
                        disabled={loading}
                        className="
                        w-full
                        sm:w-auto
                        min-w-[180px]
                        bg-gradient-to-r
                        from-blue-600
                        to-indigo-600
                        hover:from-blue-700
                        hover:to-indigo-700
                        text-white
                        font-bold
                        px-7
                        py-3.5
                        rounded-xl
                        shadow-lg
                        hover:shadow-xl
                        hover:-translate-y-0.5
                        transition-all
                        duration-300
                        disabled:opacity-60
                        disabled:cursor-not-allowed
                        disabled:transform-none
                        disabled:shadow-none
                        "
                    >

                        {loading ? (

                            <span className="flex items-center justify-center gap-2">

                                <span className="w-4 h-4 border-2 border-white/40 border-t-white rounded-full animate-spin" />

                                Uploading...

                            </span>

                        ) : (

                            <span className="flex items-center justify-center gap-2">

                                ↑

                                Upload Document

                            </span>

                        )}

                    </button>

                    {!file && !loading && (

                        <p
                            className={`text-xs mt-3 ${
                                darkMode
                                    ? "text-gray-500"
                                    : "text-gray-400"
                            }`}
                        >
                            Select a document above to enable the upload process.
                        </p>

                    )}

                </div>

            </div>

        </section>

    );

}