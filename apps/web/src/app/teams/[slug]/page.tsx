import { cache } from "react";
import Image from "next/image";
import Link from "next/link";
import { notFound } from "next/navigation";
import { db } from "@/lib/db";

export const dynamic = "force-dynamic";
type Props = { params: Promise<{ slug: string }> };
const getTeam = cache((slug: string) =>
  db.team.findFirst({
    where: { slug, status: "ACTIVE" },
    select: {
      name: true,
      description: true,
      leaderUserId: true,
      members: {
        where: { status: "ACTIVE", user: { status: "APPROVED" } },
        orderBy: { user: { firstName: "asc" } },
        select: {
          userId: true,
          roleInTeam: true,
          user: {
            select: {
              firstName: true,
              lastName: true,
              profile: {
                select: {
                  publicSlug: true,
                  profileImage: true,
                  headline: true,
                  skills: true,
                },
              },
              portfolio: {
                where: { isPublic: true },
                orderBy: { sortOrder: "asc" },
                take: 6,
                select: { id: true, type: true, title: true, assetUrl: true },
              },
            },
          },
        },
      },
    },
  }),
);

function safeAssetUrl(value: string) {
  if (
    /^https?:\/\//i.test(value) ||
    /^\/uploads\//.test(value) ||
    /^data:(image\/(png|jpeg|webp|gif)|application\/pdf);base64,/i.test(value)
  )
    return value;
  return null;
}
const publicName = (user: { firstName: string; lastName: string }) =>
  `${user.firstName}${user.lastName ? ` ${user.lastName[0]}.` : ""}`;

export async function generateMetadata({ params }: Props) {
  const team = await getTeam((await params).slug);
  return {
    title: team ? `${team.name} | TalentEarth` : "Team Not Found",
    description: team?.description || "Meet the team and explore their work.",
  };
}

export default async function TeamProfilePage({ params }: Props) {
  const team = await getTeam((await params).slug);
  if (!team) notFound();
  const roster = [...team.members].sort(
    (a, b) =>
      Number(b.userId === team.leaderUserId) -
      Number(a.userId === team.leaderUserId),
  );
  const skills = [
    ...new Set(roster.flatMap((member) => member.user.profile?.skills || [])),
  ].slice(0, 24);
  const work = roster
    .flatMap((member) =>
      member.user.portfolio.map((item) => ({
        ...item,
        author: publicName(member.user),
      })),
    )
    .filter((item) => safeAssetUrl(item.assetUrl))
    .slice(0, 24);
  return (
    <main className="container mx-auto min-h-screen px-6 pb-16 pt-32 text-white">
      <p className="mb-4 text-xs font-semibold uppercase tracking-[0.2em] text-blue-300">
        TalentEarth Team · {roster.length}{" "}
        {roster.length === 1 ? "member" : "members"}
      </p>
      <h1 className="text-4xl font-bold md:text-5xl">{team.name}</h1>
      {team.description && (
        <p className="mt-5 max-w-3xl whitespace-pre-wrap break-words text-lg leading-relaxed text-gray-400">
          {team.description}
        </p>
      )}
      <div className="mt-12 grid gap-10 lg:grid-cols-3">
        <div className="lg:col-span-2">
          <h2 className="mb-5 text-xl font-semibold">Selected work</h2>
          <p className="mb-6 text-sm text-gray-500">
            Public portfolio samples from the team.
          </p>
          <div className="grid gap-5 sm:grid-cols-2">
            {work.map((item) => (
              <article
                key={item.id}
                className="overflow-hidden rounded-xl border border-white/10 bg-white/5"
              >
                {item.type === "IMAGE" ? (
                  <div className="relative aspect-video">
                    <Image
                      src={item.assetUrl}
                      alt={item.title || "Portfolio sample"}
                      fill
                      unoptimized
                      sizes="(max-width: 640px) 100vw, 40vw"
                      className="object-cover"
                    />
                  </div>
                ) : item.type === "VIDEO" ? (
                  <video
                    src={item.assetUrl}
                    controls
                    preload="none"
                    className="aspect-video w-full bg-black"
                    aria-label={item.title || "Portfolio video"}
                  />
                ) : (
                  <div className="flex aspect-video items-center justify-center bg-black/20">
                    <a
                      href={item.assetUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="rounded-lg border border-white/20 px-4 py-3 text-sm text-blue-300"
                    >
                      Open portfolio ↗
                    </a>
                  </div>
                )}
                <div className="p-4">
                  <h3 className="font-medium">
                    {item.title || "Portfolio sample"}
                  </h3>
                  <p className="mt-1 text-xs text-gray-500">{item.author}</p>
                </div>
              </article>
            ))}
          </div>
          {work.length === 0 && (
            <p className="rounded-xl border border-dashed border-white/15 p-10 text-center text-gray-500">
              Portfolio samples will appear as team members add public work to
              their profiles.
            </p>
          )}
          {skills.length > 0 && (
            <section className="mt-10">
              <h2 className="mb-4 text-xl font-semibold">Capabilities</h2>
              <div className="flex flex-wrap gap-2">
                {skills.map((skill) => (
                  <span
                    key={skill}
                    className="rounded-lg border border-white/10 px-3 py-2 text-sm text-gray-300"
                  >
                    {skill}
                  </span>
                ))}
              </div>
            </section>
          )}
        </div>
        <aside className="h-fit rounded-2xl border border-white/10 bg-white/5 p-6">
          <h2 className="mb-5 text-xl font-semibold">Team roster</h2>
          <ul className="space-y-5">
            {roster.map((member) => (
              <li key={member.userId} className="flex items-center gap-3">
                <div className="relative flex h-12 w-12 shrink-0 items-center justify-center overflow-hidden rounded-full bg-slate-800 text-blue-300">
                  {member.user.profile?.profileImage &&
                  safeAssetUrl(member.user.profile.profileImage) ? (
                    <Image
                      src={member.user.profile.profileImage}
                      alt=""
                      fill
                      unoptimized
                      sizes="48px"
                      className="object-cover"
                    />
                  ) : (
                    member.user.firstName[0]
                  )}
                </div>
                <div className="min-w-0">
                  {member.user.profile ? (
                    <Link
                      href={`/talent/${member.user.profile.publicSlug}`}
                      className="font-medium hover:text-blue-300"
                    >
                      {publicName(member.user)}
                    </Link>
                  ) : (
                    <span className="font-medium">
                      {publicName(member.user)}
                    </span>
                  )}
                  {member.userId === team.leaderUserId && (
                    <p className="text-xs text-blue-300">Team Leader</p>
                  )}
                  <p className="mt-1 text-xs text-gray-500">
                    {member.roleInTeam ||
                      member.user.profile?.headline ||
                      "Member"}
                  </p>
                </div>
              </li>
            ))}
          </ul>
          {roster.length === 0 && (
            <p className="text-sm text-gray-500">No public members yet.</p>
          )}
          <Link
            href="/request"
            className="mt-8 block rounded-lg bg-blue-600 px-5 py-3 text-center text-sm font-semibold hover:bg-blue-500"
          >
            Discuss a Project
          </Link>
        </aside>
      </div>
    </main>
  );
}
