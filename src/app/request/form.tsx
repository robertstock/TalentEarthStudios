"use client";

import { useState } from "react";
import { useSearchParams } from "next/navigation";

export default function RequestForm() {
    const searchParams = useSearchParams();
    const talentSlug = searchParams.get("talent");

    const [formData, setFormData] = useState({
        name: "",
        email: "",
        company: "",
        message: ""
    });
    const [status, setStatus] = useState<"IDLE" | "SUBMITTING" | "SUCCESS" | "ERROR">("IDLE");

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setStatus("SUBMITTING");

        try {
            const res = await fetch("/api/public/lead", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ ...formData, talentSlug })
            });

            if (res.ok) {
                setStatus("SUCCESS");
                setFormData({ name: "", email: "", company: "", message: "" });
            } else {
                setStatus("ERROR");
            }
        } catch {
            setStatus("ERROR");
        }
    };

    return (
        <div className="container mx-auto py-12 px-6 max-w-2xl">
            <h1 className="text-3xl font-bold mb-6">
                {talentSlug ? "Request to Book Talent" : "Contact TalentEarth Studios"}
            </h1>

            {status === "SUCCESS" ? (
                <div className="bg-green-100 ring-1 ring-green-300 p-6 rounded-lg text-green-800 text-center">
                    <h2 className="text-xl font-bold mb-2">Request Received!</h2>
                    <p>We will be in touch shortly to discuss your project.</p>
                    <button onClick={() => setStatus("IDLE")} className="text-sm underline mt-4">Send another</button>
                </div>
            ) : (
                <form onSubmit={handleSubmit} className="space-y-6 bg-white p-8 rounded-lg border shadow-sm">
                    <div>
                        <label className="block text-sm font-medium mb-1">Name</label>
                        <input
                            required
                            type="text"
                            className="w-full border rounded p-2"
                            value={formData.name}
                            onChange={e => setFormData({ ...formData, name: e.target.value })}
                        />
                    </div>

                    <div>
                        <label className="block text-sm font-medium mb-1">Email</label>
                        <input
                            required
                            type="email"
                            className="w-full border rounded p-2"
                            value={formData.email}
                            onChange={e => setFormData({ ...formData, email: e.target.value })}
                        />
                    </div>

                    <div>
                        <label className="block text-sm font-medium mb-1">Company (Optional)</label>
                        <input
                            type="text"
                            className="w-full border rounded p-2"
                            value={formData.company}
                            onChange={e => setFormData({ ...formData, company: e.target.value })}
                        />
                    </div>

                    <div>
                        <label className="block text-sm font-medium mb-1">Message / Project Brief</label>
                        <textarea
                            required
                            rows={5}
                            className="w-full border rounded p-2"
                            value={formData.message}
                            onChange={e => setFormData({ ...formData, message: e.target.value })}
                        />
                    </div>

                    <button
                        disabled={status === "SUBMITTING"}
                        type="submit"
                        className="w-full bg-blue-600 text-white font-bold py-3 rounded hover:bg-blue-700 transition disabled:opacity-50"
                    >
                        {status === "SUBMITTING" ? "Sending..." : "Send Request"}
                    </button>

                    {status === "ERROR" && (
                        <p className="text-red-600 text-center">Something went wrong. Please try again.</p>
                    )}
                </form>
            )}
        </div>
    );
}
