"use client";

import { useRouter } from "next/navigation";

export default function Home() {
  const router = useRouter();

  return (
    <main className="min-h-screen flex items-center justify-center bg-gray-100">
      <div className="bg-white shadow-lg rounded-xl p-10 w-[400px] text-center">
        <h1 className="text-3xl font-bold mb-2">AI Asset Vault</h1>

        <p className="text-gray-500 mb-8">
          Securely store and chat with your documents.
        </p>

        <button
          onClick={() => router.push("/login")}
          className="w-full bg-blue-600 text-white py-3 rounded-lg hover:bg-blue-700 transition"
        >
          Go to Login
        </button>
      </div>
    </main>
  );
}