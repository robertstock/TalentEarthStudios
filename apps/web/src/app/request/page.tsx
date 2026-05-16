"use client";

import { useChat } from "@ai-sdk/react";
import { useEffect, useRef, Suspense } from "react";
import Link from "next/link";
import { motion } from "framer-motion";
import Image from "next/image";
import { useSearchParams } from "next/navigation";
import { specialtyData, SpecialtySlug } from "@/lib/specialty-data";

function ChatContent() {
    const searchParams = useSearchParams();
    const teamSlug = searchParams.get('team') as SpecialtySlug | null;
    const teamData = teamSlug ? specialtyData[teamSlug] : null;

    const { messages, input, handleInputChange, handleSubmit, isLoading, append } = useChat({
        api: "/api/finley",
        body: { team: teamSlug },
    });

    const chatContainerRef = useRef<HTMLDivElement>(null);
    const hasGreeted = useRef(false);

    // On mount, trigger Finley to send its own opening message via GPT-5
    useEffect(() => {
        if (hasGreeted.current) return;
        hasGreeted.current = true;

        const trigger = teamData
            ? `[SYSTEM: The client has navigated to start a project with the ${teamData.title} team. Begin the intake conversation. Greet them warmly, mention the ${teamData.title} team, and ask for their first name to get started. Keep it brief — one or two sentences max.]`
            : `[SYSTEM: A new client has arrived. Begin the intake conversation. Greet them warmly as Finley, the AI Project Manager for TalentEarthStudios, and ask for their first name to get started. Keep it brief — one or two sentences max.]`;

        append({ role: "user", content: trigger });
    // eslint-disable-next-line react-hooks/exhaustive-deps
    }, []);

    // Auto-scroll to bottom of messages
    useEffect(() => {
        if (chatContainerRef.current) {
            chatContainerRef.current.scrollTop = chatContainerRef.current.scrollHeight;
        }
    }, [messages]);

    // Check if the submission tool has been successfully executed
    const isSubmitted = messages.some(m =>
        m.toolInvocations?.some(tool => tool.toolName === "submit_project_intake" && tool.state === "result")
    );

    // Filter out the hidden system trigger messages — user should never see those
    const visibleMessages = messages.filter(m =>
        !(m.role === "user" && m.content.startsWith("[SYSTEM:"))
    );

    return (
        <div className="min-h-screen bg-wme-base pt-32 pb-12 flex flex-col items-center px-4 md:px-8">
            <div className="w-full max-w-3xl flex-1 flex flex-col">

                <div className="mb-8 text-center">
                    <div className="w-20 h-20 rounded-full border border-slate-700 mx-auto mb-4 overflow-hidden relative shadow-[0_0_20px_rgba(0,174,239,0.2)]">
                        <Image src="/finley-logo.png" alt="Finley" fill className="object-cover" />
                    </div>
                    <h1 className="text-3xl font-light text-white tracking-tight">Finley</h1>
                    <p className="text-sm text-slate-500 uppercase tracking-widest mt-2">Project Intake Protocol</p>
                </div>

                <div className="flex-1 bg-wme-panel border border-wme-border rounded-2xl flex flex-col overflow-hidden shadow-2xl relative backdrop-blur-sm">

                    {/* Chat Window */}
                    <div ref={chatContainerRef} className="flex-1 overflow-y-auto p-6 space-y-6 scroll-smooth min-h-[360px]">

                        {/* Loading dots shown before Finley's first message arrives */}
                        {visibleMessages.length === 0 && (
                            <div className="flex justify-start">
                                <div className="bg-slate-800/50 border border-slate-700/50 rounded-2xl rounded-bl-none px-6 py-4 flex items-center gap-2">
                                    <div className="w-2 h-2 bg-slate-500 rounded-full animate-bounce" style={{ animationDelay: '0ms' }}></div>
                                    <div className="w-2 h-2 bg-slate-500 rounded-full animate-bounce" style={{ animationDelay: '150ms' }}></div>
                                    <div className="w-2 h-2 bg-slate-500 rounded-full animate-bounce" style={{ animationDelay: '300ms' }}></div>
                                </div>
                            </div>
                        )}

                        {visibleMessages.map(m => (
                            <motion.div
                                key={m.id}
                                initial={{ opacity: 0, y: 8 }}
                                animate={{ opacity: 1, y: 0 }}
                                transition={{ duration: 0.3 }}
                                className={`flex ${m.role === 'user' ? 'justify-end' : 'justify-start'}`}
                            >
                                <div className={`max-w-[85%] md:max-w-[75%] rounded-2xl px-6 py-4 ${
                                    m.role === 'user'
                                    ? 'bg-brand-blue text-white rounded-br-none'
                                    : 'bg-slate-800/50 text-slate-200 border border-slate-700/50 rounded-bl-none'
                                }`}>
                                    <div className="whitespace-pre-wrap font-light text-sm md:text-base leading-relaxed">
                                        {m.content}
                                    </div>

                                    {/* Tool Execution States */}
                                    {m.toolInvocations?.map((tool, index) => (
                                        <div key={index} className="mt-4 p-4 bg-black/30 rounded-lg border border-slate-700/50">
                                            {tool.toolName === "submit_project_intake" && (
                                                <div className="flex items-center gap-3">
                                                    {tool.state === "call" ? (
                                                        <>
                                                            <div className="w-4 h-4 border-2 border-brand-green border-t-transparent rounded-full animate-spin"></div>
                                                            <span className="text-xs text-brand-green uppercase tracking-wider">Submitting Project Details...</span>
                                                        </>
                                                    ) : tool.state === "result" ? (
                                                        <>
                                                            <i className="ph ph-check-circle text-brand-green text-lg"></i>
                                                            <span className="text-xs text-brand-green uppercase tracking-wider">Project Successfully Transmitted</span>
                                                        </>
                                                    ) : null}
                                                </div>
                                            )}
                                        </div>
                                    ))}
                                </div>
                            </motion.div>
                        ))}

                        {/* Typing indicator while Finley is responding */}
                        {isLoading && visibleMessages.length > 0 && visibleMessages[visibleMessages.length - 1]?.role === 'user' && (
                            <div className="flex justify-start">
                                <div className="bg-slate-800/50 border border-slate-700/50 rounded-2xl rounded-bl-none px-6 py-4 flex items-center gap-2">
                                    <div className="w-2 h-2 bg-slate-500 rounded-full animate-bounce" style={{ animationDelay: '0ms' }}></div>
                                    <div className="w-2 h-2 bg-slate-500 rounded-full animate-bounce" style={{ animationDelay: '150ms' }}></div>
                                    <div className="w-2 h-2 bg-slate-500 rounded-full animate-bounce" style={{ animationDelay: '300ms' }}></div>
                                </div>
                            </div>
                        )}
                    </div>

                    {/* Input Area */}
                    <div className="p-4 bg-wme-surface border-t border-wme-border">
                        {isSubmitted ? (
                            <motion.div
                                initial={{ opacity: 0, y: 10 }}
                                animate={{ opacity: 1, y: 0 }}
                                className="flex flex-col items-center justify-center p-4 gap-4"
                            >
                                <p className="text-slate-400 text-sm">Finley has successfully routed your project.</p>
                                <Link
                                    href="/app"
                                    className="px-8 py-4 bg-brand-green hover:bg-brand-green/90 text-white rounded-md font-medium text-sm transition-colors uppercase tracking-widest flex items-center gap-2"
                                >
                                    Access Your Dashboard
                                    <i className="ph ph-arrow-right"></i>
                                </Link>
                            </motion.div>
                        ) : (
                            <form onSubmit={handleSubmit} className="relative flex items-end gap-2">
                                <textarea
                                    value={input}
                                    onChange={handleInputChange}
                                    placeholder={visibleMessages.length === 0 ? "Finley is thinking..." : "Reply to Finley..."}
                                    className="w-full bg-slate-900/50 border border-slate-700 focus:border-brand-blue/50 rounded-xl px-4 py-4 pr-12 text-white placeholder-slate-600 outline-none resize-none min-h-[60px] max-h-[150px] transition-colors"
                                    rows={1}
                                    onKeyDown={(e) => {
                                        if (e.key === 'Enter' && !e.shiftKey) {
                                            e.preventDefault();
                                            if ((input || '').trim()) handleSubmit(e);
                                        }
                                    }}
                                    disabled={isLoading || visibleMessages.length === 0}
                                />
                                <button
                                    type="submit"
                                    disabled={isLoading || !(input || '').trim() || visibleMessages.length === 0}
                                    className="absolute right-3 bottom-3 p-2 bg-brand-blue hover:bg-brand-blue/80 disabled:bg-slate-700 disabled:text-slate-500 text-white rounded-lg transition-colors flex items-center justify-center"
                                >
                                    <i className="ph ph-paper-plane-right text-lg"></i>
                                </button>
                            </form>
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
}

export default function FinleyChat() {
    return (
        <Suspense fallback={<div className="min-h-screen bg-wme-base flex items-center justify-center text-white font-light tracking-widest uppercase">Initializing Finley...</div>}>
            <ChatContent />
        </Suspense>
    );
}
