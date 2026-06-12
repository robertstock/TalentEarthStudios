import Image from "next/image";
import Link from "next/link";

export const metadata = {
    title: "Our Story | TalentEarthStudios",
    description: "The founding story of TalentEarthStudios."
};

export default function OurStoryPage() {
    return (
        <div className="min-h-screen bg-[#0B0F15] text-white pt-32 pb-24 overflow-hidden relative">
            {/* Background Effects */}
            <div className="absolute top-0 left-0 w-full h-full overflow-hidden pointer-events-none -z-10">
                <div className="absolute top-[-20%] left-[-10%] w-[50%] h-[50%] rounded-full bg-blue-900/20 blur-[120px]" />
                <div className="absolute bottom-[-20%] right-[-10%] w-[50%] h-[50%] rounded-full bg-blue-800/10 blur-[120px]" />
            </div>

            <div className="container mx-auto px-6 lg:px-12">
                
                {/* Header */}
                <div className="mb-16 md:mb-24 text-center max-w-3xl mx-auto">
                    <h1 className="text-4xl md:text-6xl font-bold mb-6 bg-clip-text text-transparent bg-gradient-to-r from-blue-400 via-blue-200 to-white leading-tight">
                        Our Story
                    </h1>
                    <p className="text-xl md:text-2xl text-blue-100/80 font-light leading-relaxed">
                        TalentEarthStudios was founded on a simple belief: the world&apos;s best ideas deserve access to the world&apos;s best talent.
                    </p>
                </div>

                {/* Content Split */}
                <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 lg:gap-20 items-start">
                    
                    {/* Left: Images */}
                    <div className="lg:col-span-5 flex flex-col gap-6 relative">
                        <div className="grid grid-cols-2 gap-4 relative">
                            {/* Robert Card */}
                            <div className="relative group">
                                <div className="absolute -inset-1 bg-gradient-to-tr from-blue-600 to-blue-400 rounded-2xl blur opacity-25 group-hover:opacity-40 transition duration-1000 group-hover:duration-200"></div>
                                <div className="relative aspect-[3/4] w-full rounded-2xl overflow-hidden border border-white/10 bg-white/5">
                                    <img 
                                        src="/robert_stock.jpg" 
                                        alt="Robert Stock - Co-Founder" 
                                        className="object-cover w-full h-full transform group-hover:scale-105 transition-transform duration-700 ease-in-out"
                                    />
                                    <div className="absolute bottom-0 w-full p-4 bg-gradient-to-t from-black/95 via-black/70 to-transparent text-left">
                                        <p className="text-white font-bold text-lg leading-tight">Robert Stock</p>
                                        <p className="text-blue-300 text-xs font-semibold tracking-widest uppercase mt-1">Co-Founder</p>
                                    </div>
                                </div>
                            </div>

                            {/* Laurie Card */}
                            <div className="relative group">
                                <div className="absolute -inset-1 bg-gradient-to-tr from-blue-600 to-blue-400 rounded-2xl blur opacity-25 group-hover:opacity-40 transition duration-1000 group-hover:duration-200"></div>
                                <div className="relative aspect-[3/4] w-full rounded-2xl overflow-hidden border border-white/10 bg-white/5">
                                    <img 
                                        src="/laurie_stock.jpg" 
                                        alt="Laurie Stock - Co-Founder" 
                                        className="object-cover w-full h-full transform group-hover:scale-105 transition-transform duration-700 ease-in-out"
                                    />
                                    <div className="absolute bottom-0 w-full p-4 bg-gradient-to-t from-black/95 via-black/70 to-transparent text-left">
                                        <p className="text-white font-bold text-lg leading-tight">Laurie Stock</p>
                                        <p className="text-blue-300 text-xs font-semibold tracking-widest uppercase mt-1">Co-Founder</p>
                                    </div>
                                </div>
                            </div>
                        </div>

                        {/* Intro Video Button */}
                        <a 
                            href="https://youtu.be/qcHoezhl_-g?si=YOxao-7rzanh57-i" 
                            target="_blank" 
                            rel="noopener noreferrer"
                            className="group relative flex items-center justify-center gap-4 w-full p-5 bg-gradient-to-r from-blue-600/10 to-blue-400/10 hover:from-blue-600/20 hover:to-blue-400/20 border border-blue-500/20 hover:border-blue-400/40 rounded-2xl transition-all duration-500 overflow-hidden"
                        >
                            <div className="absolute inset-0 bg-blue-500/10 blur-2xl group-hover:bg-blue-400/30 transition-all duration-500"></div>
                            <div className="absolute inset-0 translate-x-[-100%] group-hover:translate-x-[100%] transition-transform duration-1000 bg-gradient-to-r from-transparent via-white/5 to-transparent skew-x-12"></div>
                            
                            <div className="relative z-10 flex items-center justify-center w-12 h-12 rounded-full bg-blue-500/20 group-hover:bg-blue-500/40 transition-colors duration-300">
                                <i className="ph-fill ph-play text-xl text-blue-300 group-hover:text-white transition-colors ml-1"></i>
                            </div>
                            
                            <div className="relative z-10 flex flex-col text-left">
                                <span className="text-blue-100 font-semibold tracking-widest uppercase text-sm group-hover:text-white transition-colors duration-300">
                                    Watch Intro Video
                                </span>
                                <span className="text-blue-400/70 text-xs font-light tracking-wide group-hover:text-blue-300/90 transition-colors duration-300">
                                    See our story in action
                                </span>
                            </div>
                        </a>
                    </div>

                    {/* Right: Text Content */}
                    <div className="lg:col-span-7 space-y-8 text-lg text-gray-300 leading-relaxed font-light">
                        <p>
                            After more than 30 years in project management, operations, and visual communications, co-founders Robert and Laurie Stock saw the same challenge repeated across nearly every industry. Companies had ambitious ideas but often struggled to find the right people to execute them and manage the process from start to finish.
                        </p>
                        
                        <p>
                            At the same time, many highly skilled creative professionals and specialty teams were looking for meaningful opportunities where they could focus on what they do best.
                        </p>
                        
                        <div className="p-8 my-10 border-l-4 border-blue-500 bg-blue-900/10 rounded-r-2xl relative overflow-hidden">
                            <div className="absolute top-0 right-0 p-4 opacity-5">
                                <i className="ph ph-quotes text-8xl"></i>
                            </div>
                            <p className="text-2xl text-blue-100 font-medium relative z-10">
                                TalentEarthStudios was created to bridge that gap.
                            </p>
                        </div>
                        
                        <p>
                            Robert Stock brought decades of experience in project management, manufacturing operations, visual communications, and large-scale production coordination. Throughout his career, he worked closely with companies, brands, and creative teams to help turn complex concepts into real-world deliverables across print, fabrication, experiential marketing, media, and technology-driven projects.
                        </p>

                        <p>
                            Laurie Stock co-founded TalentEarthStudios with a focus on project coordination, client communication, operations, and team management. She plays a key role in helping guide projects from initial intake through production and delivery, working closely with clients, vendors, creatives, and internal teams to keep projects organized, on schedule, and aligned with client goals. Laurie also contributes to the development of new systems and processes designed to help streamline communication and scale project operations.
                        </p>

                        <p>
                            Together, Robert and Laurie built TalentEarthStudios as both a representation and project management company for a curated network of top talent and specialty teams across disciplines including fabrication, film and video, experiential marketing, software development, 3D modeling, animation, visual communications, and emerging technologies.
                        </p>
                        <p>
                            Clients bring us an idea, a challenge, or a vision.
                        </p>
                        
                        <div className="grid grid-cols-1 sm:grid-cols-3 gap-6 my-10">
                            <div className="bg-white/5 border border-white/10 rounded-xl p-6 text-center hover:bg-white/10 transition-colors">
                                <i className="ph ph-users text-3xl text-blue-400 mb-3 block"></i>
                                <h3 className="text-white font-bold mb-2">Align Talent</h3>
                                <p className="text-sm text-gray-400">We match the right specialty teams to your unique vision.</p>
                            </div>
                            <div className="bg-white/5 border border-white/10 rounded-xl p-6 text-center hover:bg-white/10 transition-colors">
                                <i className="ph ph-kanban text-3xl text-blue-400 mb-3 block"></i>
                                <h3 className="text-white font-bold mb-2">Manage Process</h3>
                                <p className="text-sm text-gray-400">We build the schedule and oversee production end-to-end.</p>
                            </div>
                            <div className="bg-white/5 border border-white/10 rounded-xl p-6 text-center hover:bg-white/10 transition-colors">
                                <i className="ph ph-rocket-launch text-3xl text-blue-400 mb-3 block"></i>
                                <h3 className="text-white font-bold mb-2">Deliver Results</h3>
                                <p className="text-sm text-gray-400">One accountable partner from concept to completion.</p>
                            </div>
                        </div>

                        <p>
                            Our clients benefit from one accountable partner, while our talent gains access to opportunities they may not have reached on their own.
                        </p>
                        
                        <p>
                            This model allows great companies to move faster and with confidence, while empowering exceptional talent to focus on creating outstanding work.
                        </p>
                        
                        <p className="text-white font-medium text-xl pt-6 border-t border-white/10">
                            Whether the project is a custom fabrication, branded experience, digital platform, marketing campaign, or content production, TalentEarthStudios exists to connect talent and opportunity, and turn ideas into delivered projects.
                        </p>

                        <div className="pt-8">
                            <Link href="/request" className="inline-flex items-center gap-2 px-8 py-4 bg-blue-600 hover:bg-blue-500 text-white font-bold tracking-widest uppercase text-sm rounded transition-all shadow-[0_0_20px_rgba(37,99,235,0.4)] hover:shadow-[0_0_30px_rgba(37,99,235,0.6)]">
                                Start Your Project <i className="ph ph-arrow-right"></i>
                            </Link>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}
