
export interface MockTalent {
    id: string;
    firstName: string;
    lastName: string;
    email: string;
    role: string;
    status: string;
    profile: {
        headline: string;
        bio: string;
        profileImage: string;
        skills: string[];
        publicSlug: string;
        location: string;
        primaryDiscipline: string;
        websiteInternal?: string;
    };
    portfolio?: any[];
}

export const MOCK_TALENTS: MockTalent[] = [
    {
        id: "mock-1",
        firstName: "Sarah",
        lastName: "Jenkins",
        email: "sarah.jenkins@example.com",
        role: "TALENT",
        status: "APPROVED",
        profile: {
            headline: "Creative Director",
            bio: "Visionary Creative Director with a passion for bold aesthetics and brand storytelling. Expert in leading cross-functional teams to deliver award-winning campaigns.",
            profileImage: "/talent-faces/avatar-1.jpg",
            skills: ["Creative Direction", "Branding", "Campaign Strategy", "Team Leadership"],
            publicSlug: "sarah-jenkins",
            location: "New York, NY",
            primaryDiscipline: "Creative Direction"
        },
        portfolio: [
            { id: "p1-1", title: "Nike React Campaign", type: "IMAGE", assetUrl: "https://images.unsplash.com/photo-1542291026-7eec264c27ff?w=800", description: "Global brand campaign for Nike's React line featuring dynamic motion graphics." },
            { id: "p1-2", title: "Apple Watch Series", type: "IMAGE", assetUrl: "https://images.unsplash.com/photo-1434493789847-2f02dc6ca35d?w=800", description: "Product launch creative direction for wearables division." },
            { id: "p1-3", title: "Spotify Wrapped 2024", type: "IMAGE", assetUrl: "https://images.unsplash.com/photo-1611339555312-e607c8352fd7?w=800", description: "Led creative vision for annual user experience campaign." }
        ]
    },
    {
        id: "mock-2",
        firstName: "Emily",
        lastName: "Chen",
        email: "emily.chen@example.com",
        role: "TALENT",
        status: "APPROVED",
        profile: {
            headline: "Art Director",
            bio: "Multidisciplinary Art Director specializing in digital experiences and editorial design. Bringing concepts to life through meticulous visual execution.",
            profileImage: "/talent-faces/avatar-10.jpg",
            skills: ["Art Direction", "UI/UX", "Editorial Design", "Typography"],
            publicSlug: "emily-chen",
            location: "San Francisco, CA",
            primaryDiscipline: "Art Direction"
        },
        portfolio: [
            { id: "p2-1", title: "Vogue Digital Rebrand", type: "IMAGE", assetUrl: "https://images.unsplash.com/photo-1558618666-fcd25c85cd64?w=800", description: "Complete visual identity overhaul for Vogue's digital platforms." },
            { id: "p2-2", title: "Airbnb Experiences", type: "IMAGE", assetUrl: "https://images.unsplash.com/photo-1501785888041-af3ef285b470?w=800", description: "Art direction for travel experience marketing materials." },
            { id: "p2-3", title: "Tech Startup Branding", type: "IMAGE", assetUrl: "https://images.unsplash.com/photo-1460925895917-afdab827c52f?w=800", description: "Full brand identity system for Series B fintech company." }
        ]
    },
    {
        id: "mock-3",
        firstName: "Michelle",
        lastName: "Ross",
        email: "michelle.ross@example.com",
        role: "TALENT",
        status: "APPROVED",
        profile: {
            headline: "Senior Producer",
            bio: "Results-driven Senior Producer with a track record of managing complex productions on time and under budget. Expert in resource allocation and client management.",
            profileImage: "/talent-faces/avatar-3.jpg",
            skills: ["Production Management", "Budgeting", "Client Relations", "Agile Workflow"],
            publicSlug: "michelle-ross",
            location: "London, UK",
            primaryDiscipline: "Production"
        },
        portfolio: [
            { id: "p3-1", title: "BMW i8 Launch Event", type: "IMAGE", assetUrl: "https://images.unsplash.com/photo-1555215695-3004980ad54e?w=800", description: "Produced global launch event across 12 cities simultaneously." },
            { id: "p3-2", title: "Netflix Documentary Series", type: "VIDEO", assetUrl: "https://images.unsplash.com/photo-1485846234645-a62644f84728?w=800", description: "8-part documentary series production management." },
            { id: "p3-3", title: "Fashion Week Coverage", type: "IMAGE", assetUrl: "https://images.unsplash.com/photo-1509631179647-0177331693ae?w=800", description: "Full production coordination for Paris Fashion Week." }
        ]
    },
    {
        id: "mock-4",
        firstName: "David",
        lastName: "Okonjo",
        email: "david.okonjo@example.com",
        role: "TALENT",
        status: "APPROVED",
        profile: {
            headline: "Sound Designer",
            bio: "Immersive Sound Designer creating sonic landscapes for film, games, and VR. Believes that audio is 50% of the experience.",
            profileImage: "/talent-faces/avatar-4.jpg",
            skills: ["Sound Design", "Audio Mixing", "Foley", "Composition"],
            publicSlug: "david-okonjo",
            location: "Berlin, Germany",
            primaryDiscipline: "Sound Design"
        },
        portfolio: [
            { id: "p4-1", title: "Cyberpunk Soundscape", type: "VIDEO", assetUrl: "https://images.unsplash.com/photo-1511379938547-c1f69419868d?w=800", description: "Original sound design for AAA video game title." },
            { id: "p4-2", title: "Ambient Film Score", type: "VIDEO", assetUrl: "https://images.unsplash.com/photo-1598488035139-bdbb2231ce04?w=800", description: "Atmospheric score for indie horror feature film." },
            { id: "p4-3", title: "Podcast Audio Branding", type: "VIDEO", assetUrl: "https://images.unsplash.com/photo-1478737270239-2f02b77fc618?w=800", description: "Complete audio identity package for top-10 podcast." }
        ]
    },
    {
        id: "mock-6",
        firstName: "Marcus",
        lastName: "Thorne",
        email: "marcus.thorne@example.com",
        role: "TALENT",
        status: "APPROVED",
        profile: {
            headline: "Film Editor",
            bio: "Detail-oriented Film Editor with a rhythm for storytelling. Experienced in narrative features, documentaries, and fast-paced commercial cuts.",
            profileImage: "/talent-faces/avatar-6.jpg",
            skills: ["Video Editing", "Color Grading", "Narrative Structure", "After Effects"],
            publicSlug: "marcus-thorne",
            location: "Los Angeles, CA",
            primaryDiscipline: "Editing"
        },
        portfolio: [
            { id: "p6-1", title: "Sundance Documentary", type: "VIDEO", assetUrl: "https://images.unsplash.com/photo-1574717024453-354056aef981?w=800", description: "Award-winning documentary premiered at Sundance 2024." },
            { id: "p6-2", title: "Super Bowl Commercial", type: "VIDEO", assetUrl: "https://images.unsplash.com/photo-1492619375914-88005aa9e8fb?w=800", description: "60-second spot for major automotive brand." },
            { id: "p6-3", title: "Music Video Collection", type: "VIDEO", assetUrl: "https://images.unsplash.com/photo-1493225457124-a3eb161ffa5f?w=800", description: "Edited 15+ music videos for Grammy-winning artists." }
        ]
    },
    {
        id: "mock-7",
        firstName: "Elena",
        lastName: "Rodriguez",
        email: "elena.rodriguez@example.com",
        role: "TALENT",
        status: "APPROVED",
        profile: {
            headline: "Motion Graphics Artist",
            bio: "Motion Graphics Artist blending 2D and 3D animation to create mesmerizing visual loops and explainer videos.",
            profileImage: "/talent-faces/avatar-7.jpg",
            skills: ["Motion Graphics", "3D Animation", "Cinema 4D", "Illustration"],
            publicSlug: "elena-rodriguez",
            location: "Remote",
            primaryDiscipline: "Motion Graphics"
        },
        portfolio: [
            { id: "p7-1", title: "Abstract Loop Series", type: "VIDEO", assetUrl: "https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?w=800", description: "Viral Instagram loop series with 10M+ views." },
            { id: "p7-2", title: "Tech Explainer Video", type: "VIDEO", assetUrl: "https://images.unsplash.com/photo-1550745165-9bc0b252726f?w=800", description: "Product explainer for Y Combinator startup." },
            { id: "p7-3", title: "Brand Idents", type: "VIDEO", assetUrl: "https://images.unsplash.com/photo-1633356122544-f134324a6cee?w=800", description: "Animated logo reveals for broadcast network." }
        ]
    },
    {
        id: "mock-8",
        firstName: "James",
        lastName: "Miller",
        email: "james.miller@example.com",
        role: "TALENT",
        status: "APPROVED",
        profile: {
            headline: "VFX Supervisor",
            bio: "VFX Supervisor with a keen eye for realism and spectacle. Bridging the gap between practical effects and digital enhancements.",
            profileImage: "/talent-faces/avatar-8.jpg",
            skills: ["VFX Supervision", "Compositing", "Nuke", "On-set Supervision"],
            publicSlug: "james-miller",
            location: "Vancouver, BC",
            primaryDiscipline: "Visual Effects"
        },
        portfolio: [
            { id: "p8-1", title: "Sci-Fi Feature Film", type: "VIDEO", assetUrl: "https://images.unsplash.com/photo-1451187580459-43490279c0fa?w=800", description: "Lead VFX on $50M sci-fi feature with 800+ shots." },
            { id: "p8-2", title: "Commercial Compositing", type: "IMAGE", assetUrl: "https://images.unsplash.com/photo-1518770660439-4636190af475?w=800", description: "Invisible VFX work for luxury car commercials." },
            { id: "p8-3", title: "TV Series VFX", type: "VIDEO", assetUrl: "https://images.unsplash.com/photo-1535016120720-40c6874c3b1c?w=800", description: "Episodic VFX supervision for streaming drama." }
        ]
    },
    {
        id: "mock-9",
        firstName: "Priya",
        lastName: "Patel",
        email: "priya.patel@example.com",
        role: "TALENT",
        status: "APPROVED",
        profile: {
            headline: "Product Designer",
            bio: "User-centric Product Designer passionate about solving complex problems through intuitive interfaces. Advocate for accessibility and inclusive design.",
            profileImage: "/talent-faces/avatar-9.jpg",
            skills: ["Product Design", "User Research", "Prototyping", "Design Systems"],
            publicSlug: "priya-patel",
            location: "Austin, TX",
            primaryDiscipline: "Product Design"
        },
        portfolio: [
            { id: "p9-1", title: "Fintech App Redesign", type: "IMAGE", assetUrl: "https://images.unsplash.com/photo-1512941937669-90a1b58e7e9c?w=800", description: "Complete UX overhaul resulting in 40% conversion increase." },
            { id: "p9-2", title: "Healthcare Dashboard", type: "IMAGE", assetUrl: "https://images.unsplash.com/photo-1551288049-bebda4e38f71?w=800", description: "Data visualization dashboard for medical professionals." },
            { id: "p9-3", title: "E-commerce Mobile App", type: "IMAGE", assetUrl: "https://images.unsplash.com/photo-1556742049-0cfed4f6a45d?w=800", description: "iOS and Android app design for DTC fashion brand." }
        ]
    },
    {
        id: "mock-10",
        firstName: "Sofia",
        lastName: "Wagner",
        email: "sofia.wagner@example.com",
        role: "TALENT",
        status: "APPROVED",
        profile: {
            headline: "Set Designer",
            bio: "Atmospheric Set Designer creating physical worlds that tell a story. Experienced in stage, film, and experiential event design.",
            profileImage: "/talent-faces/avatar-2.jpg",
            skills: ["Set Design", "Drafting", "Concept Art", "Prop Styling"],
            publicSlug: "sofia-wagner",
            location: "Vienna, Austria",
            primaryDiscipline: "Set Design"
        },
        portfolio: [
            { id: "p10-1", title: "Broadway Production", type: "IMAGE", assetUrl: "https://images.unsplash.com/photo-1507676184212-d03ab07a01bf?w=800", description: "Tony-nominated set design for musical revival." },
            { id: "p10-2", title: "Immersive Art Exhibition", type: "IMAGE", assetUrl: "https://images.unsplash.com/photo-1518998053901-5348d3961a04?w=800", description: "Interactive installation at contemporary art museum." },
            { id: "p10-3", title: "Film Set Build", type: "IMAGE", assetUrl: "https://images.unsplash.com/photo-1536440136628-849c177e76a1?w=800", description: "Period-accurate Victorian manor for feature film." }
        ]
    },
    {
        id: "jane-simpson",
        firstName: "Jane",
        lastName: "Simpson",
        email: "jane.simpson@example.com",
        role: "TALENT",
        status: "APPROVED",
        profile: {
            headline: "Director",
            bio: "Award-winning filmmaker and visual storyteller with over 10 years of experience in commercial and narrative cinema. Specializing in creating emotionally resonant content for global brands and independent films.",
            profileImage: "/talent-faces/avatar-5.jpg",
            skills: ["Directing", "Screenwriting", "Visual Storytelling", "Cinematography", "Post-Production"],
            publicSlug: "jane-simpson",
            location: "Los Angeles, CA",
            primaryDiscipline: "Directing"
        },
        portfolio: [
            { id: "pjs-1", title: "Indie Feature Film", type: "VIDEO", assetUrl: "https://images.unsplash.com/photo-1485846234645-a62644f84728?w=800", description: "Critically acclaimed debut feature screened at TIFF." },
            { id: "pjs-2", title: "Nike 'Just Do It' Spot", type: "VIDEO", assetUrl: "https://images.unsplash.com/photo-1571902943202-507ec2618e8f?w=800", description: "60-second inspirational commercial with 50M+ views." },
            { id: "pjs-3", title: "Music Documentary", type: "VIDEO", assetUrl: "https://images.unsplash.com/photo-1493225457124-a3eb161ffa5f?w=800", description: "Behind-the-scenes documentary for touring artist." }
        ]
    }
];

const getTalent = (id: string) => MOCK_TALENTS.find(t => t.id === id) || MOCK_TALENTS[0];

export const MOCK_TEAMS = [
    {
        id: "tm_prod_001",
        slug: "motionworks",
        name: "MotionWorks",
        members: [
            getTalent("mock-1"), // Sarah Jenkins
            getTalent("jane-simpson"),// Jane Simpson
            getTalent("mock-3"), // Michelle Ross
        ].filter(Boolean),
        type: "Film Production",
        status: "Allocated",
        description: "Full-service film and motion production unit specializing in commercials, documentaries, and branded content. From concept to delivery, we bring stories to life with cinematic excellence.",
        capabilities: ["Film Production", "Commercial Shoots", "Documentary", "Music Videos"],
        portfolio: [
            { id: 1, title: "Neon Horizon", type: "Feature Film", image: "https://images.unsplash.com/photo-1536440136628-849c177e76a1?q=80&w=1000&auto=format&fit=crop" },
            { id: 2, title: "Midnight Sun", type: "Commercial", image: "https://images.unsplash.com/photo-1485846234645-a62644f84728?q=80&w=1000&auto=format&fit=crop" }
        ]
    },
    {
        id: "tm_fab_002",
        slug: "blackline-fabrication",
        name: "Blackline Fabrication",
        members: [
            getTalent("mock-9"), // Priya Patel
            getTalent("mock-10"), // Sofia Wagner
        ].filter(Boolean),
        type: "Prop Design / Fabrication",
        status: "Allocated",
        description: "Expert prop design, custom fabrication, and physical builds for film, television, and experiential installations. Specializing in functional prototypes and hero props.",
        capabilities: ["Custom Props", "Set Pieces", "Specialty Vehicles", "Materials R&D"],
        portfolio: [
            { id: 1, title: "Exo-Suit Prototype", type: "Prop Build", image: "https://images.unsplash.com/photo-1581091226825-a6a2a5aee158?q=80&w=1000&auto=format&fit=crop" },
            { id: 2, title: "Cyberpunk Vehicle", type: "Fabrication", image: "https://images.unsplash.com/photo-1537498425277-c283d32ef9db?q=80&w=1000&auto=format&fit=crop" }
        ]
    },
    {
        id: "tm_set_003",
        slug: "environment-studio",
        name: "Environment Studio",
        members: [
            getTalent("mock-10"), // Sofia Wagner
            getTalent("mock-9"),  // Priya Patel
        ].filter(Boolean),
        type: "Set Design",
        status: "Available",
        description: "Immersive set design and spatial environments for film, stage, and experiential activations. Creating worlds that transport audiences.",
        capabilities: ["Concept Design", "Set Construction", "Virtual Production", "Location Scouting"],
        portfolio: [
            { id: 1, title: "The Void Stage", type: "Stage Design", image: "https://images.unsplash.com/photo-1556761175-5973dc0f32e7?q=80&w=1000&auto=format&fit=crop" },
            { id: 2, title: "Glass House", type: "Interior Set", image: "https://images.unsplash.com/photo-1497215728101-856f4ea42174?q=80&w=1000&auto=format&fit=crop" }
        ]
    },
    {
        id: "tm_aud_004",
        slug: "waveform-studio",
        name: "Waveform Studio",
        members: [
            getTalent("mock-4"), // David Okonjo
        ].filter(Boolean),
        type: "Audio / Score",
        status: "Available",
        description: "Full-spectrum audio services including original composition, sound design, and mixing. Creating sonic landscapes that elevate every project.",
        capabilities: ["Sound Design", "Original Score", "Audio Mixing", "Foley"],
        portfolio: [
            { id: 1, title: "Deep Space Ambience", type: "Sound Design", image: "https://images.unsplash.com/photo-1511379938547-c1f69419868d?q=80&w=1000&auto=format&fit=crop" },
            { id: 2, title: "Synthwave Score", type: "Composition", image: "https://images.unsplash.com/photo-1598488035139-bdbb2231ce04?q=80&w=1000&auto=format&fit=crop" }
        ]
    },
    {
        id: "tm_vfx_005",
        slug: "visual-effects-studio",
        name: "Visual Effects Studio",
        members: [
            getTalent("mock-8"), // James Miller (VFX)
            getTalent("mock-7"), // Elena Rodriguez (Motion Graphics)
        ].filter(Boolean),
        type: "VFX / Post",
        status: "Allocated",
        description: "High-end visual effects and compositing for feature films, commercials, and streaming content. Seamless integration of CGI and practical elements.",
        capabilities: ["Compositing", "CGI", "Motion Graphics", "Color Grading"],
        portfolio: [
            { id: 1, title: "Particle Simulation", type: "VFX", image: "https://images.unsplash.com/photo-1550745165-9bc0b252726f?q=80&w=1000&auto=format&fit=crop" },
            { id: 2, title: "Holographic UI", type: "Motion Graphics", image: "https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?q=80&w=1000&auto=format&fit=crop" }
        ]
    },
    {
        id: "tm_post_006",
        slug: "continuity",
        name: "Continuity",
        members: [
            getTalent("mock-6"), // Marcus Thorne (Editor)
            getTalent("mock-2"), // Emily Chen (Art Director)
        ].filter(Boolean),
        type: "Post Production",
        status: "Available",
        description: "Complete post-production services from assembly through final delivery. Precision editing, color finishing, and quality control for film and broadcast.",
        capabilities: ["Editorial", "Assembly", "Color Finishing", "Delivery"],
        portfolio: [
            { id: 1, title: "Documentary Cut", type: "Editing", image: "https://images.unsplash.com/photo-1574717024453-354056aef981?q=80&w=1000&auto=format&fit=crop" },
            { id: 2, title: "Color Grade Reel", type: "Color Grading", image: "https://images.unsplash.com/photo-1535016120720-40c6874c3b1c?q=80&w=1000&auto=format&fit=crop" }
        ]
    }
];
