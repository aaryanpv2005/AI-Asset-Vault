"use client";

import { useState } from "react";
import api from "@/lib/api";

export default function UploadForm() {

    const [file, setFile] = useState<File | null>(null);
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

            window.location.reload();

        } catch (error) {

            console.error(error);

            alert("Upload Failed");

        } finally {

            setLoading(false);

        }

    };

    return (

        <div className="bg-white rounded-xl shadow p-6">

            <h2 className="text-2xl font-bold text-gray-900 mb-6">
                Upload New Document
            </h2>

            <label
                htmlFor="fileUpload"
                className="inline-block cursor-pointer bg-gray-800 hover:bg-gray-900 text-white px-5 py-3 rounded-lg font-medium transition"
            >
                Choose File
            </label>

            <input
                id="fileUpload"
                type="file"
                className="hidden"
                onChange={(e) =>
                    setFile(
                        e.target.files
                            ? e.target.files[0]
                            : null
                    )
                }
            />

            {file ? (

                <p className="mt-4 text-gray-800">
                    <strong>Selected File:</strong> {file.name}
                </p>

            ) : (

                <p className="mt-4 text-gray-500">
                    No file selected
                </p>

            )}

            <button
                onClick={uploadFile}
                disabled={loading}
                className="mt-6 bg-blue-600 hover:bg-blue-700 disabled:bg-gray-400 text-white font-semibold px-6 py-3 rounded-lg transition"
            >
                {loading ? "Uploading..." : "Upload Document"}
            </button>

        </div>

    );

}