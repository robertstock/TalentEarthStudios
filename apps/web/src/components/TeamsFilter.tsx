"use client";

import { useRouter, useSearchParams } from "next/navigation";

const UNIT_TYPES = [
    "Film Production",
    "Prop Design / Fabrication",
    "Set Design",
    "Audio / Score",
    "VFX / Post",
    "Post Production"
];

export default function TeamsFilter() {
    const router = useRouter();
    const searchParams = useSearchParams();
    const currentType = searchParams.get("type");

    const handleFilter = (type: string) => {
        if (currentType === type) {
            router.push("/teams"); // Deselect
        } else {
            router.push(`/teams?type=${encodeURIComponent(type)}`);
        }
    };

    return (
        <div className="hidden md:block">
            <h4 className="text-xs font-bold text-white uppercase tracking-widest mb-4 border-b border-slate-800 pb-2">Unit Type</h4>
            <div className="space-y-2">
                {UNIT_TYPES.map((type) => {
                    const isActive = currentType === type;
                    return (
                        <div
                            key={type}
                            onClick={() => handleFilter(type)}
                            className="flex items-center gap-3 cursor-pointer group"
                        >
                            <div className={`w-3 h-3 border transition-colors ${isActive ? 'bg-white border-white' : 'border-slate-600 group-hover:border-white'}`}></div>
                            <span className={`text-sm transition-colors ${isActive ? 'text-white' : 'text-slate-400 group-hover:text-white'}`}>
                                {type}
                            </span>
                        </div>
                    );
                })}
            </div>

            {currentType && (
                <div
                    onClick={() => router.push("/teams")}
                    className="mt-6 text-[10px] text-slate-500 hover:text-white cursor-pointer uppercase tracking-widest"
                >
                    Clear Filter
                </div>
            )}
        </div>
    );
}
