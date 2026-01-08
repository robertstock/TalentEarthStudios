"use client";

import { useState, useEffect, useRef } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import Image from "next/image";

export default function ProfilePage() {
    const router = useRouter();
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);
    const [message, setMessage] = useState<{ type: "success" | "error"; text: string } | null>(null);

    const [formData, setFormData] = useState({
        headline: "",
        bio: "",
        location: "",
        primaryDiscipline: "",
        skills: "",
        industries: "",
        languages: "",
        websiteInternal: "",
        profileImage: "",
    });

    // For image upload
    const fileInputRef = useRef<HTMLInputElement>(null);
    const [uploadingImage, setUploadingImage] = useState(false);

    useEffect(() => {
        fetchProfile();
    }, []);

    const fetchProfile = async () => {
        try {
            const res = await fetch("/api/profile");
            if (res.ok) {
                const data = await res.json();
                setFormData({
                    headline: data.headline || "",
                    bio: data.bio || "",
                    location: data.location || "",
                    primaryDiscipline: data.primaryDiscipline || "",
                    skills: data.skills?.join(", ") || "",
                    industries: data.industries?.join(", ") || "",
                    languages: data.languages?.join(", ") || "",
                    websiteInternal: data.websiteInternal || "",
                    profileImage: data.profileImage || "",
                });
            }
        } catch (error) {
            console.error("Failed to fetch profile", error);
        } finally {
            setLoading(false);
        }
    };

    const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
        setFormData({ ...formData, [e.target.name]: e.target.value });
    };

    // Generic file upload handler for profile image
    const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (!file) return;

        // Basic validation
        if (file.size > 5 * 1024 * 1024) { // 5MB limit
            setMessage({ type: "error", text: "Image too large (max 5MB)" });
            return;
        }

        setUploadingImage(true);
        setMessage(null); // Clear previous messages

        try {
            // 1. Get presigned URL
            const res = await fetch("/api/uploads/sign-profile", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    fileName: file.name,
                    contentType: file.type
                }),
            });

            if (!res.ok) {
                const errData = await res.json();
                throw new Error(errData.error || "Failed to get upload URL");
            }

            const { uploadUrl, finalUrl } = await res.json();

            console.log("Got upload URL:", uploadUrl);
            console.log("Final Public path:", finalUrl);

            // 2. Upload to S3 (or local handler)
            const uploadRes = await fetch(uploadUrl, {
                method: "PUT",
                body: file,
                headers: { "Content-Type": file.type }
            });

            if (!uploadRes.ok) {
                console.error("Upload failed with status:", uploadRes.status);
                throw new Error("Failed to upload image content");
            }

            // 3. Update local state
            setFormData(prev => ({ ...prev, profileImage: finalUrl }));
            setMessage({ type: "success", text: "Image uploaded! Remember to save changes." });

        } catch (error: any) {
            console.error("Upload error:", error);
            setMessage({ type: "error", text: error.message || "Failed to upload image" });
        } finally {
            setUploadingImage(false);
            // Reset input so same file can be selected again if retry needed
            if (fileInputRef.current) fileInputRef.current.value = '';
        }
    };

    const triggerFileInput = () => {
        fileInputRef.current?.click();
    };

    const removeImage = () => {
        setFormData(prev => ({ ...prev, profileImage: "" }));
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setSaving(true);
        setMessage(null);

        const payload = {
            ...formData,
            skills: formData.skills.split(",").map((s) => s.trim()).filter(Boolean),
            industries: formData.industries.split(",").map((s) => s.trim()).filter(Boolean),
            languages: formData.languages.split(",").map((s) => s.trim()).filter(Boolean),
        };

        try {
            const res = await fetch("/api/profile", {
                method: "PUT",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify(payload),
            });

            if (res.ok) {
                const updatedProfile = await res.json();
                setMessage({ type: "success", text: "Profile updated successfully" });
                router.refresh();

                // Redirect to dashboard as requested
                router.push("/app");
            } else {
                setMessage({ type: "error", text: "Failed to update profile" });
            }
        } catch (error) {
            setMessage({ type: "error", text: "An error occurred" });
        } finally {
            setSaving(false);
        }
    };

    if (loading) {
        return <div className="p-8 text-center text-gray-500">Loading profile...</div>;
    }

    return (
        <div className="container mx-auto max-w-2xl py-12 px-6">
            <div className="mb-8">
                <h1 className="text-3xl font-bold text-white mb-2">Edit Profile</h1>
                <p className="text-sm text-gray-400">Manage your public presence and skills.</p>
            </div>

            {message && (
                <div className={`mb-6 p-4 rounded-lg border ${message.type === 'success' ? 'bg-green-500/10 border-green-500/20 text-green-400' : 'bg-red-500/10 border-red-500/20 text-red-400'}`}>
                    {message.text}
                </div>
            )}



            <form onSubmit={handleSubmit} className="space-y-8">
                {/* Profile Header & Image */}
                <div className="flex flex-col md:flex-row gap-8 items-start pb-8 border-b border-white/10">
                    <div className="relative group shrink-0">
                        <div className="w-32 h-32 rounded-full overflow-hidden bg-white/5 border border-white/10 relative">
                            {formData.profileImage ? (
                                <Image
                                    src={formData.profileImage}
                                    alt="Profile"
                                    fill
                                    className="object-cover"
                                />
                            ) : (
                                <div className="w-full h-full flex items-center justify-center text-gray-500">
                                    <i className="ph ph-user text-4xl"></i>
                                </div>
                            )}

                            {/* Hover Overlay */}
                            <button
                                type="button"
                                onClick={triggerFileInput}
                                className="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 transition-opacity flex flex-col items-center justify-center text-xs text-white uppercase tracking-wider cursor-pointer font-medium"
                            >
                                <i className="ph ph-camera text-2xl mb-1"></i>
                                <span>Change</span>
                            </button>

                            {/* Hidden Input */}
                            <input
                                type="file"
                                ref={fileInputRef}
                                onChange={handleImageUpload}
                                accept="image/png, image/jpeg, image/webp"
                                className="hidden"
                            />
                        </div>

                        {uploadingImage && (
                            <div className="absolute inset-0 flex items-center justify-center">
                                <div className="w-full h-full bg-black/80 rounded-full flex items-center justify-center">
                                    <div className="w-6 h-6 border-2 border-blue-500 border-t-transparent rounded-full animate-spin"></div>
                                </div>
                            </div>
                        )}

                        {formData.profileImage && (
                            <button
                                type="button"
                                onClick={removeImage}
                                className="absolute -bottom-2 -right-2 bg-red-500/90 text-white p-1.5 rounded-full shadow-lg hover:bg-red-600 transition-colors"
                                title="Remove Image"
                            >
                                <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round"><line x1="18" y1="6" x2="6" y2="18"></line><line x1="6" y1="6" x2="18" y2="18"></line></svg>
                            </button>
                        )}
                    </div>

                    <div className="flex-1 w-full space-y-4">
                        <div className="flex justify-between items-start">
                            <div>
                                <h2 className="text-lg font-semibold text-white/90">Basic Info</h2>
                                <p className="text-xs text-slate-400 mt-1">This info will be public on your talent card.</p>
                            </div>

                            <Link
                                href={`/talent/${formData.headline ? 'preview' : '#'}`} /* In real app, use user ID or slug */
                                className="hidden md:inline-flex items-center gap-2 text-xs uppercase tracking-wider text-blue-400 hover:text-blue-300 transition-colors border border-blue-500/20 px-3 py-1.5 rounded bg-blue-500/10 hover:bg-blue-500/20"
                            >
                                <i className="ph ph-eye"></i> View Public
                            </Link>
                        </div>

                        <div className="space-y-2">
                            <label className="text-xs font-medium uppercase tracking-wider text-gray-500">Headline</label>
                            <input
                                type="text"
                                name="headline"
                                value={formData.headline}
                                onChange={handleChange}
                                className="w-full rounded-lg border border-white/10 bg-white/5 px-4 py-3 text-white placeholder-gray-600 focus:border-blue-500/50 focus:outline-none focus:ring-2 focus:ring-blue-500/20 transition-all"
                                placeholder="e.g. Senior Visual Designer"
                            />
                        </div>

                        <div className="space-y-2">
                            <label className="text-xs font-medium uppercase tracking-wider text-gray-500">Bio</label>
                            <textarea
                                name="bio"
                                rows={4}
                                value={formData.bio}
                                onChange={handleChange}
                                className="w-full rounded-lg border border-white/10 bg-white/5 px-4 py-3 text-white placeholder-gray-600 focus:border-blue-500/50 focus:outline-none focus:ring-2 focus:ring-blue-500/20 transition-all resize-none"
                                placeholder="Tell us about yourself..."
                            />
                        </div>

                        <div className="grid grid-cols-2 gap-4">
                            <div className="space-y-2">
                                <label className="text-xs font-medium uppercase tracking-wider text-gray-500">Location</label>
                                <input
                                    type="text"
                                    name="location"
                                    value={formData.location}
                                    onChange={handleChange}
                                    className="w-full rounded-lg border border-white/10 bg-white/5 px-4 py-3 text-white placeholder-gray-600 focus:border-blue-500/50 focus:outline-none focus:ring-2 focus:ring-blue-500/20 transition-all"
                                    placeholder="e.g. New York, NY"
                                />
                            </div>
                            <div className="space-y-2">
                                <label className="text-xs font-medium uppercase tracking-wider text-gray-500">Website</label>
                                <input
                                    type="text"
                                    name="websiteInternal"
                                    value={formData.websiteInternal}
                                    onChange={handleChange}
                                    className="w-full rounded-lg border border-white/10 bg-white/5 px-4 py-3 text-white placeholder-gray-600 focus:border-blue-500/50 focus:outline-none focus:ring-2 focus:ring-blue-500/20 transition-all"
                                    placeholder="https://"
                                />
                            </div>
                        </div>
                    </div>
                </div>

                <div className="space-y-4">
                    <h2 className="text-lg font-semibold text-white/90 border-b border-white/10 pb-2 pt-4">Skills & Expertise</h2>

                    <div className="space-y-2">
                        <label className="text-xs font-medium uppercase tracking-wider text-gray-500">Primary Discipline</label>
                        <input
                            type="text"
                            name="primaryDiscipline"
                            value={formData.primaryDiscipline}
                            onChange={handleChange}
                            className="w-full rounded-lg border border-white/10 bg-white/5 px-4 py-3 text-white placeholder-gray-600 focus:border-blue-500/50 focus:outline-none focus:ring-2 focus:ring-blue-500/20 transition-all"
                            placeholder="e.g. 3D Modeling"
                        />
                    </div>

                    <div className="space-y-2">
                        <label className="text-xs font-medium uppercase tracking-wider text-gray-500">Skills (Comma separated)</label>
                        <input
                            type="text"
                            name="skills"
                            value={formData.skills}
                            onChange={handleChange}
                            className="w-full rounded-lg border border-white/10 bg-white/5 px-4 py-3 text-white placeholder-gray-600 focus:border-blue-500/50 focus:outline-none focus:ring-2 focus:ring-blue-500/20 transition-all"
                            placeholder="Blender, Maya, Unreal Engine..."
                        />
                    </div>

                    <div className="space-y-2">
                        <label className="text-xs font-medium uppercase tracking-wider text-gray-500">Industries (Comma separated)</label>
                        <input
                            type="text"
                            name="industries"
                            value={formData.industries}
                            onChange={handleChange}
                            className="w-full rounded-lg border border-white/10 bg-white/5 px-4 py-3 text-white placeholder-gray-600 focus:border-blue-500/50 focus:outline-none focus:ring-2 focus:ring-blue-500/20 transition-all"
                            placeholder="Film, Gaming, Architecture..."
                        />
                    </div>

                    <div className="space-y-2">
                        <label className="text-xs font-medium uppercase tracking-wider text-gray-500">Languages (Comma separated)</label>
                        <input
                            type="text"
                            name="languages"
                            value={formData.languages}
                            onChange={handleChange}
                            className="w-full rounded-lg border border-white/10 bg-white/5 px-4 py-3 text-white placeholder-gray-600 focus:border-blue-500/50 focus:outline-none focus:ring-2 focus:ring-blue-500/20 transition-all"
                            placeholder="English, Spanish, French..."
                        />
                    </div>
                </div>

                <div className="pt-6 flex gap-4">
                    <button
                        type="button"
                        onClick={() => router.back()}
                        className="px-6 py-3 rounded-lg border border-white/10 text-white font-medium hover:bg-white/5 transition-colors"
                    >
                        Cancel
                    </button>
                    <button
                        type="submit"
                        disabled={saving}
                        className="px-6 py-3 rounded-lg bg-blue-600 text-white font-medium hover:bg-blue-500 transition-colors disabled:opacity-50 disabled:cursor-not-allowed shadow-[0_0_20px_-5px_rgba(37,99,235,0.5)]"
                    >
                        {saving ? "Saving..." : "Save Changes"}
                    </button>
                </div>
            </form>
        </div >
    );
}
