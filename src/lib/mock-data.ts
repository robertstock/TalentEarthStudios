
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
            profileImage: "/mocks/sarah-jenkins.png",
            skills: ["Creative Direction", "Branding", "Campaign Strategy", "Team Leadership"],
            publicSlug: "sarah-jenkins",
            location: "New York, NY",
            primaryDiscipline: "Creative Direction"
        }
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
            profileImage: "/mocks/emily-chen.png",
            skills: ["Art Direction", "UI/UX", "Editorial Design", "Typography"],
            publicSlug: "emily-chen",
            location: "San Francisco, CA",
            primaryDiscipline: "Art Direction"
        }
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
            profileImage: "/mocks/michelle-ross.png",
            skills: ["Production Management", "Budgeting", "Client Relations", "Agile Workflow"],
            publicSlug: "michelle-ross",
            location: "London, UK",
            primaryDiscipline: "Production"
        }
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
            profileImage: "/mocks/david-okonjo.png",
            skills: ["Sound Design", "Audio Mixing", "Foley", "Composition"],
            publicSlug: "david-okonjo",
            location: "Berlin, Germany",
            primaryDiscipline: "Sound Design"
        }
    },
    // Avatar 5 is Jane Simpson (Existing override, but we can include her here for consistency in the list if we wanted to purely mock, 
    // but better to keep her separate or map her existing record to this if needed. 
    // For the purpose of "adding new faces", I will add the others.)
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
            profileImage: "/mocks/marcus-thorne.png",
            skills: ["Video Editing", "Color Grading", "Narrative Structure", "After Effects"],
            publicSlug: "marcus-thorne",
            location: "Los Angeles, CA",
            primaryDiscipline: "Editing"
        }
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
            profileImage: "/mocks/avatar-7.jpg",
            skills: ["Motion Graphics", "3D Animation", "Cinema 4D", "Illustration"],
            publicSlug: "elena-rodriguez",
            location: "Remote",
            primaryDiscipline: "Motion Graphics"
        }
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
            profileImage: "/mocks/avatar-8.jpg",
            skills: ["VFX Supervision", "Compositing", "Nuke", "On-set Supervision"],
            publicSlug: "james-miller",
            location: "Vancouver, BC",
            primaryDiscipline: "Visual Effects"
        }
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
            profileImage: "/mocks/avatar-9.jpg",
            skills: ["Product Design", "User Research", "Prototyping", "Design Systems"],
            publicSlug: "priya-patel",
            location: "Austin, TX",
            primaryDiscipline: "Product Design"
        }
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
            profileImage: "/mocks/avatar-10.jpg",
            skills: ["Set Design", "Drafting", "Concept Art", "Prop Styling"],
            publicSlug: "sofia-wagner",
            location: "Vienna, Austria",
            primaryDiscipline: "Set Design"
        }
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
            bio: "Award-winning filmmaker and visual storyteller.",
            profileImage: "/jane-simpson.png",
            skills: ["Directing", "Screenwriting", "Visual Storytelling"],
            publicSlug: "jane-simpson",
            location: "Los Angeles, CA",
            primaryDiscipline: "Directing"
        }
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
        description: "Film and motion production.",
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
        description: "Prop design, fabrication, and physical builds.",
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
        description: "Set design and spatial environments.",
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
        description: "Audio, sound design, and music scoring.",
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
        description: "High-end visual effects and compositing.",
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
        description: "Editorial, color grading, and finishing.",
        portfolio: [
            { id: 1, title: "Documentary Cut", type: "Editing", image: "https://images.unsplash.com/photo-1574717024453-354056aef981?q=80&w=1000&auto=format&fit=crop" },
            { id: 2, title: "Color Grade Reel", type: "Color Grading", image: "https://images.unsplash.com/photo-1535016120720-40c6874c3b1c?q=80&w=1000&auto=format&fit=crop" }
        ]
    }
];
