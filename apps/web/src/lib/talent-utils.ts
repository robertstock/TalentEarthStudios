export const AVATAR_MAP: Record<string, string> = {
    "Sarah Jenkins": "/talent-faces/avatar-1.jpg",
    "Emily Chen": "/talent-faces/avatar-2.jpg",
    "Michelle Ross": "/talent-faces/avatar-3.jpg",
    "David Okonjo": "/talent-faces/avatar-4.jpg",
    "Jane Simpson": "/talent-faces/avatar-5.jpg",
    "Marcus Thorne": "/talent-faces/avatar-6.jpg",
    "Elena Rodriguez": "/talent-faces/avatar-7.jpg",
    "James Miller": "/talent-faces/avatar-8.jpg",
    "Priya Patel": "/talent-faces/avatar-9.jpg",
    "Sofia Wagner": "/talent-faces/avatar-10.jpg",
    "Jane Doe": "/talent-faces/avatar-5.jpg"
};

export function getTalentAvatar(firstName: string, lastName: string, currentImage?: string | null): string | null {
    const fullName = `${firstName} ${lastName}`;
    if (AVATAR_MAP[fullName]) {
        return AVATAR_MAP[fullName];
    }
    return currentImage || null;
}

export function deduplicateTalents(talents: any[], mockTalents: any[]) {
    const seenEmails = new Set<string>();
    const seenNames = new Set<string>();
    const finalTalents: any[] = [];

    // Process DB Talents first
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

            // Assign Avatar
            if (t.profile) {
                t.profile.profileImage = getTalentAvatar(firstName, lastName, t.profile.profileImage);
            }

            finalTalents.push({
                ...t,
                firstName,
                lastName
            });
        }
    });

    // Process Mock Talents
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
