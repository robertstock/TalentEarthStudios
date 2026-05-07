import { NextAuthOptions } from "next-auth";
import CredentialsProvider from "next-auth/providers/credentials";
import GoogleProvider from "next-auth/providers/google";
import { PrismaAdapter } from "@next-auth/prisma-adapter";
import { db } from "@/lib/db";
import { compare, hash } from "bcryptjs";
import { areDemoCredentialsEnabled } from "@/lib/env";

const demoCredentialsEnabled = areDemoCredentialsEnabled();

export const authOptions: NextAuthOptions = {
    adapter: PrismaAdapter(db),
    session: {
        strategy: "jwt",
    },
    pages: {
        signIn: "/auth/signin",
    },
    providers: [
        ...(process.env.GOOGLE_CLIENT_ID && process.env.GOOGLE_CLIENT_SECRET ? [
            GoogleProvider({
                clientId: process.env.GOOGLE_CLIENT_ID,
                clientSecret: process.env.GOOGLE_CLIENT_SECRET,
            })
        ] : []),
        CredentialsProvider({
            name: "Credentials",
            credentials: {
                email: { label: "Email", type: "email" },
                password: { label: "Password", type: "password" }
            },
            async authorize(credentials) {
                if (!credentials?.email || !credentials?.password) {
                    return null;
                }

                if (demoCredentialsEnabled) {
                    // Check if it's the admin demo
                    if (credentials.email === "finley@talentearth.com" && credentials.password === "password123") {
                        return {
                            id: "demo-admin",
                            email: "finley@talentearth.com",
                            name: "Finley (Demo)",
                            role: "ADMIN",
                            image: null,
                        };
                    }

                    // Check if it's a mock talent demo
                    const { MOCK_TALENTS } = await import("@/lib/mock-data");
                    const mockTalent = MOCK_TALENTS.find(t => t.email === credentials.email);
                    
                    if (mockTalent && credentials.password === "password123") {
                        // Ensure this mock talent exists in the real DB so the dashboard works
                        let user = await db.user.findUnique({ where: { email: credentials.email }, include: { profile: true } });
                        
                        if (!user) {
                            const passwordHash = await hash("password123", 10);
                            user = await db.user.create({
                                data: {
                                    id: mockTalent.id,
                                    email: mockTalent.email,
                                    firstName: mockTalent.firstName,
                                    lastName: mockTalent.lastName,
                                    role: mockTalent.role as any,
                                    status: "APPROVED",
                                    passwordHash,
                                    profile: {
                                        create: {
                                            publicSlug: mockTalent.profile.publicSlug || mockTalent.id,
                                            headline: mockTalent.profile.headline,
                                            bio: mockTalent.profile.bio,
                                            profileImage: mockTalent.profile.profileImage,
                                            skills: mockTalent.profile.skills || [],
                                            primaryDiscipline: mockTalent.profile.primaryDiscipline
                                        }
                                    }
                                },
                                include: { profile: true }
                            });

                            // Seed portfolio items
                            if (mockTalent.portfolio && mockTalent.portfolio.length > 0) {
                                await db.portfolioItem.createMany({
                                    data: mockTalent.portfolio.map((item, index) => ({
                                        id: item.id,
                                        userId: user.id,
                                        title: item.title,
                                        description: item.description,
                                        type: item.type as any,
                                        assetUrl: item.assetUrl,
                                        isPublic: true,
                                        sortOrder: index
                                    }))
                                });
                            }
                        }

                        return {
                            id: user.id,
                            email: user.email,
                            name: user.firstName,
                            role: user.role,
                            image: user.profile?.profileImage,
                        };
                    }
                }
                const user = await db.user.findUnique({
                    where: { email: credentials.email },
                    include: { profile: true }
                });
                if (!user || !user.passwordHash) {
                    return null;
                }
                const isValid = await compare(credentials.password, user.passwordHash);
                if (!isValid) {
                    return null;
                }
                return {
                    id: user.id,
                    email: user.email,
                    name: user.firstName, // Use firstName as display name
                    role: user.role,
                    image: user.profile?.profileImage,
                };
            }
        })
    ],
    callbacks: {
        async session({ session, token }) {
            if (token && session.user) {
                session.user.id = token.id as string;
                session.user.role = token.role as any;
                session.user.image = token.picture;
            }
            return session;
        },
        async jwt({ token, user, trigger, session }) {
            if (user) {
                token.id = user.id;
                token.role = (user as any).role;
                token.picture = user.image;
            }
            // Handle session update
            if (trigger === "update" && session?.user?.image) {
                token.picture = session.user.image;
            }
            return token;
        }
    }
};
