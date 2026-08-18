"use client";

import { useState, useEffect, useRef } from "react";
import api from "@/lib/api";

interface ChatModalProps {
    asset: {
        id: number;
        file_name: string;
    };
    onClose: () => void;
}

interface Message {
    sender: "user" | "ai";
    text: string;
}

export default function ChatModal({
    asset,
    onClose,
}: ChatModalProps) {

    const [question, setQuestion] = useState("");
    const [loading, setLoading] = useState(false);

    const [messages, setMessages] = useState<Message[]>([]);

    const bottomRef = useRef<HTMLDivElement>(null);

    useEffect(() => {

        const loadHistory = async () => {

            try {

                const token = localStorage.getItem("token");

                const response = await api.get(
                    `/assets/${asset.id}/chat-history`,
                    {
                        headers: {
                            Authorization: `Bearer ${token}`,
                        },
                    }
                );

                if (response.data.length === 0) {

                    setMessages([
                        {
                            sender: "ai",
                            text: `Hello! Ask me anything about "${asset.file_name}".`,
                        },
                    ]);

                    return;

                }

                const history: Message[] = [];

                response.data.forEach((chat: any) => {

                    history.push({
                        sender: "user",
                        text: chat.question,
                    });

                    history.push({
                        sender: "ai",
                        text: chat.answer,
                    });

                });

                setMessages(history);

            } catch (error) {

                console.error(error);

                setMessages([
                    {
                        sender: "ai",
                        text: `Hello! Ask me anything about "${asset.file_name}".`,
                    },
                ]);

            }

        };

        loadHistory();

    }, [asset]);

    useEffect(() => {

        bottomRef.current?.scrollIntoView({
            behavior: "smooth",
        });

    }, [messages, loading]);

    const askAI = async () => {

        if (!question.trim()) return;

        const userQuestion = question;

        setMessages((prev) => [
            ...prev,
            {
                sender: "user",
                text: userQuestion,
            },
        ]);

        setQuestion("");

        try {

            setLoading(true);

            const token = localStorage.getItem("token");

            const response = await api.post(
                `/assets/${asset.id}/chat`,
                {
                    question: userQuestion,
                },
                {
                    headers: {
                        Authorization: `Bearer ${token}`,
                    },
                }
            );

            setMessages((prev) => [
                ...prev,
                {
                    sender: "ai",
                    text: response.data.answer,
                },
            ]);

        } catch (error) {

            console.error(error);

            setMessages((prev) => [
                ...prev,
                {
                    sender: "ai",
                    text: "Sorry, something went wrong.",
                },
            ]);

        } finally {

            setLoading(false);

        }

    };

    return (

        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">

            <div className="bg-white rounded-xl shadow-xl w-[90vw] max-w-5xl h-[85vh] flex flex-col">

                {/* Header */}

                <div className="flex justify-between items-center border-b p-5">

                    <div>

                        <h2 className="text-2xl font-bold text-gray-900">

                            Chat with Document

                        </h2>

                        <p className="text-gray-600">

                            {asset.file_name}

                        </p>

                    </div>

                    <button
                        onClick={onClose}
                        className="bg-red-600 hover:bg-red-700 text-white px-4 py-2 rounded-lg"
                    >
                        Close
                    </button>

                </div>

                {/* Messages */}

                <div className="flex-1 overflow-y-auto p-5 space-y-4 bg-gray-100">

                    {messages.map((message, index) => (

                        <div
                            key={index}
                            className={`flex ${
                                message.sender === "user"
                                    ? "justify-end"
                                    : "justify-start"
                            }`}
                        >

                            <div
                                className={`max-w-[70%] rounded-xl px-4 py-3 ${
                                    message.sender === "user"
                                        ? "bg-blue-600 text-white"
                                        : "bg-white text-gray-900 shadow"
                                }`}
                            >

                                <p className="font-semibold mb-1">

                                    {message.sender === "user"
                                        ? "You"
                                        : "AI"}

                                </p>

                                <p>{message.text}</p>

                            </div>

                        </div>

                    ))}

                    {loading && (

                        <div className="flex justify-start">

                            <div className="bg-white rounded-xl px-4 py-3 shadow">

                                <p className="font-semibold">

                                    AI

                                </p>

                                <p>Thinking...</p>

                            </div>

                        </div>

                    )}

                    <div ref={bottomRef}></div>

                </div>

                {/* Input */}

                <div className="border-t p-4 flex gap-3 items-center">

                    <input
                        type="text"
                        placeholder="Ask anything about this document..."
                        value={question}
                        onChange={(e) => setQuestion(e.target.value)}
                        onKeyDown={(e) => {
                            if (e.key === "Enter") {
                                askAI();
                            }
                        }}
                        className="flex-1 min-w-0 border border-gray-300 rounded-lg px-4 py-3 text-gray-900 focus:outline-none focus:ring-2 focus:ring-blue-500"
                    />

                    <button
                        onClick={askAI}
                        disabled={loading}
                        className="bg-green-600 hover:bg-green-700 disabled:bg-gray-400 text-white px-5 py-3 rounded-lg font-semibold whitespace-nowrap"
                    >
                        {loading ? "..." : "Ask AI"}
                    </button>

                </div>

            </div>

        </div>

    );

}