"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import Image from "next/image";

interface PortfolioItem {
    id: string;
    type: "IMAGE" | "VIDEO" | "LINK";
    title: string;
    description: string;
    assetUrl: string;
    thumbnailUrl?: string;
}

export default function PortfolioPage() {
    const router = useRouter();
    const [items, setItems] = useState<PortfolioItem[]>([]);
    const [loading, setLoading] = useState(true);
    const [showAddForm, setShowAddForm] = useState(false);

    const [newItem, setNewItem] = useState({
        type: "IMAGE",
        title: "",
        description: "",
        assetUrl: "",
        thumbnailUrl: ""
    });
    const [submitting, setSubmitting] = useState(false);

    useEffect(() => {
        fetchItems();
    }, []);

    const fetchItems = async () => {
        try {
            const res = await fetch("/api/portfolio");
            if (res.ok) {
                const data = await res.json();
                setItems(data);
            }
        } catch (error) {
            console.error("Failed to fetch items", error);
        } finally {
            setLoading(false);
        }
    };

    const handleDelete = async (id: string) => {
        if (!confirm("Are you sure you want to delete this item?")) return;

        try {
            const res = await fetch(`/api/portfolio?id=${id}`, { method: "DELETE" });
            if (res.ok) {
                setItems(items.filter(item => item.id !== id));
            }
        } catch (error) {
            console.error("Failed to delete item", error);
        }
    };

    const handleAddSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setSubmitting(true);

        try {
            const res = await fetch("/api/portfolio", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify(newItem),
            });

            if (res.ok) {
                const addedItem = await res.json();
                setItems([...items, addedItem]);
                setShowAddForm(false);
                setNewItem({
                    type: "IMAGE",
                    title: "",
                    description: "",
                    assetUrl: "",
                    thumbnailUrl: ""
                });
            }
        } catch (error) {
            console.error("Failed to add item", error);
        } finally {
            setSubmitting(false);
        }
    };

    if (loading) {
        return <div className="p-8 text-center text-gray-500">Loading portfolio...</div>;
    }

    return (
        <div className="container mx-auto pt-28 pb-12 px-6">
            <div className="flex justify-between items-center mb-8">
                <div>
                    <h1 className="text-3xl font-bold text-white mb-2">Portfolio</h1>
                    <p className="text-sm text-gray-400">Showcase your best work.</p>
                </div>
                <button
                    onClick={() => setShowAddForm(!showAddForm)}
                    className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-500 transition-colors text-sm font-medium"
                >
                    {showAddForm ? "Cancel" : "+ Add New"}
                </button>
            </div>

            {showAddForm && (
                <div className="mb-8 bg-wme-surface border border-white/10 rounded-lg p-6 animate-in slide-in-from-top-4 fade-in">
                    <h2 className="text-lg font-bold text-white mb-4">Add New Item</h2>
                    <form onSubmit={handleAddSubmit} className="space-y-4">
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <div className="space-y-2">
                                <label className="text-xs font-medium uppercase tracking-wider text-gray-500">Title</label>
                                <input
                                    type="text"
                                    required
                                    value={newItem.title}
                                    onChange={(e) => setNewItem({ ...newItem, title: e.target.value })}
                                    className="w-full rounded-lg border border-white/10 bg-white/5 px-4 py-3 text-white placeholder-gray-600 focus:border-blue-500/50 focus:outline-none focus:ring-2 focus:ring-blue-500/20"
                                />
                            </div>
                            <div className="space-y-2">
                                <label className="text-xs font-medium uppercase tracking-wider text-gray-500">Type</label>
                                <select
                                    value={newItem.type}
                                    onChange={(e) => setNewItem({ ...newItem, type: e.target.value as any })}
                                    className="w-full rounded-lg border border-white/10 bg-wme-base px-4 py-3 text-white focus:border-blue-500/50 focus:outline-none focus:ring-2 focus:ring-blue-500/20"
                                >
                                    <option value="IMAGE">Image</option>
                                    <option value="VIDEO">Video</option>
                                    <option value="LINK">Link</option>
                                </select>
                            </div>
                        </div>

                        <div className="space-y-2">
                            <label className="text-xs font-medium uppercase tracking-wider text-gray-500">Asset URL</label>
                            <input
                                type="url"
                                required
                                value={newItem.assetUrl}
                                onChange={(e) => setNewItem({ ...newItem, assetUrl: e.target.value })}
                                className="w-full rounded-lg border border-white/10 bg-white/5 px-4 py-3 text-white placeholder-gray-600 focus:border-blue-500/50 focus:outline-none focus:ring-2 focus:ring-blue-500/20"
                                placeholder="https://example.com/image.jpg"
                            />
                            <p className="text-xs text-yellow-500/80">
                                ⚠️ Please use a <strong>direct image link</strong> (ending in .jpg, .png, etc.). <br />
                                If using Imgur, right-click the image and select "Copy Image Address". Do not use the album/page link.
                            </p>
                        </div>

                        <div className="space-y-2">
                            <label className="text-xs font-medium uppercase tracking-wider text-gray-500">Description</label>
                            <textarea
                                rows={3}
                                value={newItem.description}
                                onChange={(e) => setNewItem({ ...newItem, description: e.target.value })}
                                className="w-full rounded-lg border border-white/10 bg-white/5 px-4 py-3 text-white placeholder-gray-600 focus:border-blue-500/50 focus:outline-none focus:ring-2 focus:ring-blue-500/20 resize-none"
                            />
                        </div>

                        <div className="flex justify-end pt-2">
                            <button
                                type="submit"
                                disabled={submitting}
                                className="px-6 py-2 bg-white text-black font-semibold rounded hover:bg-gray-200 transition-colors disabled:opacity-50"
                            >
                                {submitting ? "Adding..." : "Add Item"}
                            </button>
                        </div>
                    </form>
                </div>
            )}

            {items.length === 0 ? (
                <div className="text-center py-20 border border-dashed border-white/10 rounded-lg">
                    <p className="text-gray-500">No portfolio items yet.</p>
                </div>
            ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {items.map((item) => (
                        <PortfolioItemCard key={item.id} item={item} onDelete={handleDelete} />
                    ))}
                </div>
            )}
        </div>
    );
}

function PortfolioItemCard({ item, onDelete }: { item: PortfolioItem, onDelete: (id: string) => void }) {
    const [imgError, setImgError] = useState(false);

    return (
        <div className="group relative bg-wme-surface border border-white/5 rounded-lg overflow-hidden hover:border-white/20 transition-all">
            <div className="aspect-video w-full bg-black/50 overflow-hidden relative">
                {item.type === 'IMAGE' ? (
                    !imgError ? (
                        <Image
                            src={item.assetUrl}
                            alt={item.title}
                            fill
                            className="object-cover transition-transform group-hover:scale-105"
                            sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
                            onError={() => setImgError(true)}
                        />
                    ) : (
                        <div className="w-full h-full flex flex-col items-center justify-center bg-gray-900 text-gray-500 p-4 text-center">
                            <span className="text-2xl mb-2">⚠️</span>
                            <span className="text-xs text-red-400">Broken Image Link</span>
                        </div>
                    )
                ) : item.type === 'VIDEO' ? (
                    <div className="w-full h-full flex items-center justify-center bg-gray-900 text-gray-500">
                        <span className="text-xs uppercase tracking-widest">Video Content</span>
                    </div>
                ) : (
                    <div className="w-full h-full flex items-center justify-center bg-gray-900 text-gray-500">
                        <span className="text-xs uppercase tracking-widest">External Link</span>
                    </div>
                )}
                <div className="absolute top-2 right-2 opacity-0 group-hover:opacity-100 transition-opacity">
                    <button
                        onClick={() => onDelete(item.id)}
                        className="p-1 bg-red-500/90 text-white rounded hover:bg-red-600"
                        title="Delete"
                    >
                        <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                            <line x1="18" y1="6" x2="6" y2="18"></line>
                            <line x1="6" y1="6" x2="18" y2="18"></line>
                        </svg>
                    </button>
                </div>
            </div>
            <div className="p-4">
                <h3 className="font-bold text-white mb-1">{item.title}</h3>
                <p className="text-gray-400 text-sm line-clamp-2">{item.description}</p>
            </div>
        </div>
    );
}
