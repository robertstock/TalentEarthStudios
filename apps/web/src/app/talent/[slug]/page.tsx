import { db } from "@/lib/db";
import { notFound } from "next/navigation";
import Image from "next/image";

interface PageProps {
    params: Promise<{
        slug: string;
    }>
}

async function getTalentBySlug(slug: string) {
    try {
        return await db.user.findFirst({
            where: {
                profile: {
                    publicSlug: slug
                },
                status: "APPROVED"
            },
            include: {
                profile: true,
                portfolio: {
                    where: { isPublic: true },
                    orderBy: { sortOrder: 'asc' }
                }
            }
        });
    } catch (e) {
        console.warn("Could not fetch talent from DB", e);
        return null;
    }
}

export default async function TalentProfilePage(props: PageProps) {
    const params = await props.params;
    let talent = await getTalentBySlug(params.slug);
    const { MOCK_TALENTS } = await import('@/lib/mock-data');

    // MOCK: Check if it's a mock talent if not found in DB
    if (!talent) {
        const mockTalent = MOCK_TALENTS.find(t => t.profile.publicSlug === params.slug);

        if (mockTalent) {
            // Transform mock talent to match the Prisma return type structure roughly if needed
            // The MOCK_TALENTS structure is already close enough for reading properties
            // We just need to ensure portfolio is handled if we access it.
            // In the mock data I defined portfolio as optional array.
            talent = {
                ...mockTalent,
                // Ensure default values for required DB fields if accessed securely
                id: mockTalent.id,
                createdAt: new Date(),
                updatedAt: new Date(),
                emailVerified: null,
                image: null,
                passwordHash: null,
                portfolio: mockTalent.portfolio || [],
                profile: {
                    ...mockTalent.profile,
                    id: "mock-profile-" + mockTalent.id,
                    userId: mockTalent.id,
                    websiteExternal: null,
                    instagram: null,
                    linkedin: null,
                    twitter: null,
                    // satisfy other required fields of Profile model if checked strictly
                    createdAt: new Date(),
                    updatedAt: new Date(),
                }
            } as any;
        }
    } else {
        // DB talent found - merge mock data for bios/portfolios/skills if missing
        let firstName = talent.firstName;
        let lastName = talent.lastName;

        // Normalize Jane Simpson
        if (firstName === 'Jane' && (lastName === 'Doe' || lastName === 'Simpson')) {
            lastName = 'Simpson';
        }

        const fullName = `${firstName} ${lastName}`.toLowerCase();
        const mockMatch = MOCK_TALENTS.find(m => {
            const mockName = `${m.firstName} ${m.lastName}`.toLowerCase();
            // Also handle jane doe -> jane simpson
            const altName = firstName?.toLowerCase() === 'jane' &&
                (lastName?.toLowerCase() === 'doe' || lastName?.toLowerCase() === 'simpson')
                ? 'jane simpson' : fullName;
            return mockName === fullName || mockName === altName;
        });

        if (mockMatch && talent.profile) {
            // Merge bio if empty
            if (!talent.profile.bio || talent.profile.bio.includes("No bio")) {
                talent.profile.bio = mockMatch.profile.bio;
            }
            // Merge skills if empty
            if (!talent.profile.skills || talent.profile.skills.length === 0) {
                talent.profile.skills = mockMatch.profile.skills;
            }
            // Merge headline if empty
            if (!talent.profile.headline) {
                talent.profile.headline = mockMatch.profile.headline;
            }
            // Merge primaryDiscipline if empty
            if (!talent.profile.primaryDiscipline) {
                talent.profile.primaryDiscipline = mockMatch.profile.primaryDiscipline;
            }
            // Merge location if empty
            if (!talent.profile.location) {
                talent.profile.location = mockMatch.profile.location;
            }
            // Assign avatar from map
            if (!talent.profile.profileImage) {
                talent.profile.profileImage = mockMatch.profile.profileImage;
            }
        }

        // Merge portfolio from mock if DB portfolio is empty
        if (mockMatch && (!talent.portfolio || talent.portfolio.length === 0)) {
            talent.portfolio = mockMatch.portfolio || [];
        }

        // Apply name normalization
        talent.firstName = firstName;
        talent.lastName = lastName;
    }

    if (!talent || !talent.profile) {
        notFound();
    }

    // MOCK: Override for Jane Doe to make her look like a real user
    if (talent.firstName === 'Jane' && talent.lastName === 'Doe') {
        talent.lastName = 'Simpson';
        talent.profile.profileImage = '/jane-simpson.png';

        if (!talent.profile.bio || talent.profile.bio.includes("No bio")) {
            talent.profile.bio = "Award-winning filmmaker and visual storyteller with over 10 years of experience in commercial and narrative cinema. Specializing in creating emotionally resonant content for global brands and independent films. Based in Los Angeles, but available for travel worldwide.";
        }

        if (talent.profile.skills.length === 0) {
            talent.profile.skills = ["Cinematography", "Directing", "Color Grading", "Visual Storytelling", "Post-Production"];
        }
    }

    return (
        <div className="min-h-screen bg-[#050505] text-white pt-24 pb-20">
            {/* Background Ambience */}
            <div className="fixed inset-0 bg-[radial-gradient(circle_at_top_right,_var(--tw-gradient-stops))] from-blue-900/10 via-transparent to-transparent pointer-events-none"></div>

            <div className="max-w-7xl mx-auto px-6 relative z-10">
                {/* Profile Header */}
                <div className="relative mb-8 pt-8">
                    <div className="absolute top-0 right-0 p-4 opacity-50">
                        <i className="ph ph-cube text-4xl text-white/5"></i>
                    </div>

                    <div className="flex flex-col md:flex-row gap-8 items-start">
                        {/* Avatar */}
                        <div className="w-32 h-32 md:w-40 md:h-40 shrink-0 rounded-2xl bg-[#0A0A0A] border border-white/10 overflow-hidden relative shadow-2xl">
                            {talent.profile.profileImage ? (
                                <Image
                                    src={talent.profile.profileImage}
                                    alt={talent.firstName}
                                    fill
                                    className="object-cover"
                                />
                            ) : (
                                <div className="w-full h-full flex items-center justify-center text-slate-700">
                                    <span className="text-3xl font-bold">{talent.firstName[0]}</span>
                                </div>
                            )}
                        </div>

                        {/* Info */}
                        <div className="flex-1 pt-2">
                            <div className="flex flex-col md:flex-row justify-between items-start gap-4">
                                <div>
                                    <h1 className="text-4xl md:text-5xl font-light text-white mb-2">
                                        {talent.firstName} <span className="opacity-50">{talent.lastName}</span>
                                    </h1>
                                    <div className="flex flex-wrap items-center gap-4 text-sm text-slate-400 mb-6">
                                        {talent.profile.primaryDiscipline && (
                                            <span className="px-3 py-1 rounded-full border border-white/10 bg-white/5 text-blue-300">
                                                {talent.profile.primaryDiscipline}
                                            </span>
                                        )}
                                        {talent.profile.location && (
                                            <span className="flex items-center gap-1">
                                                <i className="ph ph-map-pin"></i> {talent.profile.location}
                                            </span>
                                        )}
                                        {talent.profile.websiteInternal && (
                                            <a href={talent.profile.websiteInternal} target="_blank" className="flex items-center gap-1 hover:text-white transition-colors">
                                                <i className="ph ph-link"></i> Website
                                            </a>
                                        )}
                                    </div>

                                    <div className="max-w-2xl text-slate-300 leading-relaxed text-sm md:text-base font-light">
                                        {talent.profile.bio || "No bio available yet."}
                                    </div>
                                </div>

                                <div className="flex gap-3">
                                    <button className="px-6 py-3 bg-white text-black font-medium rounded-lg hover:bg-slate-200 transition-colors shadow-[0_0_20px_-10px_rgba(255,255,255,0.5)]">
                                        Request to Book
                                    </button>
                                    <button className="p-3 border border-white/10 rounded-lg hover:bg-white/5 transition-colors text-white">
                                        <i className="ph ph-share-network text-xl"></i>
                                    </button>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Skills Section */}
                {talent.profile.skills.length > 0 && (
                    <div className="mb-20 pb-10 border-b border-white/5">
                        <h3 className="text-xs font-mono text-slate-500 uppercase tracking-widest mb-4">Core Competencies</h3>
                        <div className="flex flex-wrap gap-2">
                            {talent.profile.skills.map(skill => (
                                <span key={skill} className="px-4 py-2 bg-[#0A0A0A] border border-white/10 rounded text-sm text-slate-300 hover:border-white/20 hover:text-white transition-colors cursor-default">
                                    {skill}
                                </span>
                            ))}
                        </div>
                    </div>
                )}


                {/* Portfolio Grid */}
                <div className="space-y-6">
                    <div className="flex justify-between items-end">
                        <h2 className="text-2xl font-light text-white">Selected Works</h2>
                        <span className="text-xs font-mono text-slate-500">{talent.portfolio.length} ITEMS</span>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                        {talent.portfolio.map(item => (
                            <div key={item.id} className="group relative bg-[#0A0A0A] border border-white/10 rounded-xl overflow-hidden hover:border-white/20 transition-all duration-300 hover:shadow-2xl hover:-translate-y-1">
                                <div className="aspect-[16/9] relative overflow-hidden bg-black/50">
                                    {item.type === 'IMAGE' && (
                                        <img
                                            src={item.assetUrl}
                                            alt={item.title || "Portfolio Item"}
                                            className="w-full h-full object-cover opacity-80 group-hover:opacity-100 transition-opacity duration-500"
                                        />
                                    )}
                                    {item.type === 'VIDEO' && (
                                        <div className="w-full h-full flex items-center justify-center relative">
                                            <div className="absolute inset-0 bg-gradient-to-t from-black/80 to-transparent"></div>
                                            <i className="ph-fill ph-play-circle text-5xl text-white/80 group-hover:text-white group-hover:scale-110 transition-all z-10"></i>
                                        </div>
                                    )}
                                    {item.type === 'LINK' && (
                                        <div className="w-full h-full flex flex-col items-center justify-center p-6 bg-gradient-to-br from-indigo-900/20 to-purple-900/20">
                                            <i className="ph ph-link text-4xl text-white/50 mb-2"></i>
                                            <span className="text-xs text-white/50 break-all text-center px-4">{item.assetUrl}</span>
                                        </div>
                                    )}
                                </div>

                                <div className="p-5">
                                    <h3 className="text-lg font-medium text-white mb-2 group-hover:text-blue-400 transition-colors line-clamp-1">{item.title || "Untitled Project"}</h3>
                                    <p className="text-sm text-slate-500 line-clamp-2 h-10">{item.description}</p>

                                    {item.type === 'LINK' && (
                                        <a href={item.assetUrl} target="_blank" className="mt-4 inline-flex items-center text-xs text-white/60 hover:text-white border-b border-white/20 pb-0.5 transition-colors">
                                            View External Link <i className="ph ph-arrow-up-right ml-1"></i>
                                        </a>
                                    )}
                                </div>
                            </div>
                        ))}

                        {talent.portfolio.length === 0 && (
                            <div className="col-span-full py-20 text-center border border-dashed border-white/10 rounded-2xl bg-white/[0.02]">
                                <i className="ph ph-image text-4xl text-slate-700 mb-4"></i>
                                <p className="text-slate-500">No public portfolio items to display.</p>
                            </div>
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
}
