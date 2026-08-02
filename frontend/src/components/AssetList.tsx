"use client";

import { useEffect, useState } from "react";
import api from "@/lib/api";

interface Asset {
    id: number;
    file_name: string;
    file_type: string;
    file_size: number;
    summary: string;
}

interface AssetListProps {
    openChat: (asset: {
        id: number;
        file_name: string;
    }) => void;
}

export default function AssetList({ openChat }: AssetListProps) {

    const [assets, setAssets] = useState<Asset[]>([]);
    const [loading, setLoading] = useState(true);

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

    const handleDownload = async (assetId: number) => {

        try {

            const token = localStorage.getItem("token");

            const response = await api.get(
                `/assets/${assetId}/download`,
                {
                    headers: {
                        Authorization: `Bearer ${token}`,
                    },
                    responseType: "blob",
                }
            );

            const asset = assets.find(
                (a) => a.id === assetId
            );

            const blob = new Blob(
                [response.data],
                {
                    type: response.headers["content-type"],
                }
            );

            const url = window.URL.createObjectURL(blob);

            const link = document.createElement("a");

            link.href = url;

            link.download =
                asset?.file_name || "download";

            document.body.appendChild(link);

            link.click();

            document.body.removeChild(link);

            window.URL.revokeObjectURL(url);

        } catch (error) {

            console.error("Download failed", error);

        }

    };

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

            setAssets(
                assets.filter(
                    (asset) => asset.id !== assetId
                )
            );

        } catch (error) {

            console.error("Delete failed", error);

        }

    };

    if (loading) {

        return (

            <div className="bg-white rounded-xl shadow p-6">

                Loading assets...

            </div>

        );

    }

    return (

        <div className="bg-white rounded-xl shadow p-6">

            <h2 className="text-2xl font-bold mb-5 text-gray-900">

                My Assets

            </h2>

            {assets.length === 0 ? (

                <div className="border rounded-lg p-5 text-gray-700">

                    No assets uploaded yet.

                </div>

            ) : (

                <div className="space-y-5">

                    {assets.map((asset) => (

                        <div
                            key={asset.id}
                            className="border rounded-xl p-5 shadow-sm bg-gray-50"
                        >

                            <h3 className="text-xl font-semibold text-gray-900">

                                {asset.file_name}

                            </h3>

                            <p className="text-gray-800 mt-2">

                                <strong>Type:</strong> {asset.file_type}

                            </p>

                            <p className="text-gray-800">

                                <strong>Size:</strong>{" "}
                                {(asset.file_size / 1024).toFixed(2)} KB

                            </p>

                            <p className="mt-4 font-semibold text-gray-900">

                                Summary

                            </p>

                            <p className="text-gray-800 mt-1">

                                {asset.summary}

                            </p>

                            <div className="flex gap-3 mt-6">

                                <button
                                    onClick={() =>
                                        handleDownload(asset.id)
                                    }
                                    className="bg-blue-600 hover:bg-blue-700 text-white px-5 py-2 rounded-lg transition"
                                >
                                    Download
                                </button>

                                <button
                                    onClick={() =>
                                        handleDelete(asset.id)
                                    }
                                    className="bg-red-600 hover:bg-red-700 text-white px-5 py-2 rounded-lg transition"
                                >
                                    Delete
                                </button>

                                <button
                                    onClick={() => openChat(asset)}
                                    className="bg-green-600 hover:bg-green-700 text-white px-5 py-2 rounded-lg transition"
                                >
                                    Chat
                                </button>

                            </div>

                        </div>

                    ))}

                </div>

            )}

        </div>

    );

}