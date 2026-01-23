import { MOCK_TALENTS, MockTalent } from './mock-data';

export const AVATAR_MAP: Record<string, string> = {
    "Sarah Jenkins": "/talent-faces/avatar-1.jpg",
    "Emily Chen": "/talent-faces/avatar-10.jpg",
    "Michelle Ross": "/talent-faces/avatar-3.jpg",
    "David Okonjo": "/talent-faces/avatar-4.jpg",
    "Jane Simpson": "/talent-faces/avatar-5.jpg",
    "Marcus Thorne": "/talent-faces/avatar-6.jpg",
    "Elena Rodriguez": "/talent-faces/avatar-7.jpg",
    "James Miller": "/talent-faces/avatar-8.jpg",
    "Priya Patel": "/talent-faces/avatar-9.jpg",
    "Sofia Wagner": "/talent-faces/avatar-2.jpg",
    "Jane Doe": "/talent-faces/avatar-5.jpg"
};

export function getTalentAvatar(firstName: string, lastName: string, currentImage?: string | null): string | null {
    const fullName = `${firstName} ${lastName}`;
    if (AVATAR_MAP[fullName]) {
        return AVATAR_MAP[fullName];
    }
    return currentImage || null;
}

// Find matching mock talent by name (case-insensitive)
function findMatchingMockTalent(firstName: string, lastName: string): MockTalent | undefined {
    const normalizedName = `${firstName} ${lastName}`.toLowerCase();
    // Also handle Jane Doe -> Jane Simpson mapping
    const altName = firstName.toLowerCase() === 'jane' && (lastName.toLowerCase() === 'doe' || lastName.toLowerCase() === 'simpson')
        ? 'jane simpson'
        : normalizedName;

    return MOCK_TALENTS.find(m => {
        const mockName = `${m.firstName} ${m.lastName}`.toLowerCase();
        return mockName === normalizedName || mockName === altName;
    });
}

export function deduplicateTalents(talents: any[], mockTalents: any[]) {
    const seenEmails = new Set<string>();
    const seenNames = new Set<string>();
    const finalTalents: any[] = [];

    // Process DB Talents first - but merge mock data into them
    talents.forEach(t => {
        let firstName = t.firstName;
        let lastName = t.lastName;

        // Normalize Jane Simpson
        if (firstName === 'Jane' && (lastName === 'Doe' || lastName === 'Simpson')) {
            lastName = 'Simpson';
        }

        const fullName = `${firstName} ${lastName}`;
        const nameKey = fullName.toLowerCase();
        const emailKey = t.email.toLowerCase();

        if (!seenNames.has(nameKey) && !seenEmails.has(emailKey)) {
            seenNames.add(nameKey);
            seenEmails.add(emailKey);

            // Find matching mock talent to merge data from
            const mockMatch = findMatchingMockTalent(firstName, lastName);

            // Assign Avatar
            if (t.profile) {
                t.profile.profileImage = getTalentAvatar(firstName, lastName, t.profile.profileImage);

                // Merge mock data into profile if available
                if (mockMatch) {
                    // Merge bio if empty
                    if (!t.profile.bio || t.profile.bio.includes("No bio")) {
                        t.profile.bio = mockMatch.profile.bio;
                    }
                    // Merge skills if empty
                    if (!t.profile.skills || t.profile.skills.length === 0) {
                        t.profile.skills = mockMatch.profile.skills;
                    }
                    // Merge headline if empty
                    if (!t.profile.headline) {
                        t.profile.headline = mockMatch.profile.headline;
                    }
                    // Merge primaryDiscipline if empty
                    if (!t.profile.primaryDiscipline) {
                        t.profile.primaryDiscipline = mockMatch.profile.primaryDiscipline;
                    }
                    // Merge location if empty
                    if (!t.profile.location) {
                        t.profile.location = mockMatch.profile.location;
                    }
                }
            }

            // Merge portfolio from mock if DB portfolio is empty
            if (mockMatch && (!t.portfolio || t.portfolio.length === 0)) {
                t.portfolio = mockMatch.portfolio || [];
            }

            finalTalents.push({
                ...t,
                firstName,
                lastName
            });
        }
    });

    // Process Mock Talents - only add those not already in DB
    mockTalents.forEach(t => {
        const nameKey = `${t.firstName} ${t.lastName}`.toLowerCase();
        const emailKey = t.email.toLowerCase();

        if (!seenNames.has(nameKey) && !seenEmails.has(emailKey)) {
            seenNames.add(nameKey);
            seenEmails.add(emailKey);

            // Assign Avatar (already in mock profile but for consistency)
            if (t.profile) {
                t.profile.profileImage = getTalentAvatar(t.firstName, t.lastName, t.profile.profileImage);
            }

            finalTalents.push(t);
        }
    });

    return finalTalents;
}

