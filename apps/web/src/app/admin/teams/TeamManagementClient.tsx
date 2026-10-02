"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useRef, useState, useTransition, type FormEvent } from "react";
import { saveTeam, type TeamActionResult } from "./actions";

type User = {
  id: string;
  firstName: string;
  lastName: string;
  email: string;
  role: string;
  status: string;
};
type Member = { userId: string; roleInTeam: string | null };
type Team = {
  id: string;
  name: string;
  slug: string;
  description: string | null;
  leaderUserId: string;
  status: string;
  members: Member[];
  projectCount: number;
};
type Draft = {
  id?: string;
  name: string;
  description: string;
  leaderUserId: string;
  members: Member[];
};
const emptyDraft: Draft = {
  name: "",
  description: "",
  leaderUserId: "",
  members: [],
};
const field =
  "mt-2 w-full rounded-lg border border-white/15 bg-slate-950 px-3 py-3 text-sm text-white focus:outline-none focus:ring-2 focus:ring-blue-500";
const button =
  "rounded-lg border border-white/15 px-4 py-2.5 text-sm font-semibold hover:bg-white/10 focus-visible:outline-2 focus-visible:outline-blue-400 disabled:opacity-50";
const fullName = (user?: User) =>
  user ? `${user.firstName} ${user.lastName}` : "Unavailable user";

export default function TeamManagementClient({
  teams,
  users,
}: {
  teams: Team[];
  users: User[];
}) {
  const router = useRouter();
  const [draft, setDraft] = useState<Draft | null>(null);
  const [search, setSearch] = useState("");
  const [result, setResult] = useState<TeamActionResult | null>(null);
  const [pending, startTransition] = useTransition();
  const formRef = useRef<HTMLElement>(null);
  const eligibleUsers = users.filter((user) => user.status === "APPROVED");
  const selectedIds = new Set(draft?.members.map((member) => member.userId));
  const available = eligibleUsers.filter(
    (user) =>
      !selectedIds.has(user.id) &&
      `${fullName(user)} ${user.email}`
        .toLowerCase()
        .includes(search.toLowerCase()),
  );

  function openEditor(team?: Team) {
    setDraft(
      team
        ? {
            id: team.id,
            name: team.name,
            description: team.description || "",
            leaderUserId: team.leaderUserId,
            members: team.members.map((member) => ({ ...member })),
          }
        : { ...emptyDraft, members: [] },
    );
    setSearch("");
    setResult(null);
    requestAnimationFrame(() => {
      formRef.current?.scrollIntoView({ behavior: "smooth", block: "start" });
      formRef.current?.querySelector("input")?.focus({ preventScroll: true });
    });
  }

  function chooseLeader(userId: string) {
    if (!draft) return;
    const members = draft.members.map((member) => ({
      ...member,
      roleInTeam:
        member.userId === draft.leaderUserId &&
        member.userId !== userId &&
        ["Team Leader", "LEADER"].includes(member.roleInTeam || "")
          ? "Member"
          : member.roleInTeam,
    }));
    if (userId && !members.some((member) => member.userId === userId))
      members.unshift({ userId, roleInTeam: "Team Leader" });
    setDraft({ ...draft, leaderUserId: userId, members });
  }

  function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!draft || pending) return;
    setResult(null);
    startTransition(async () => {
      try {
        const response = await saveTeam({
          ...draft,
          members: draft.members.map((member) => ({
            ...member,
            roleInTeam: member.roleInTeam || "",
          })),
        });
        setResult(response);
        if (response.status === "success") {
          setDraft(null);
          router.refresh();
        }
      } catch {
        setResult({
          status: "error",
          message:
            "Could not reach the server. Your draft is still here; please try again.",
        });
      }
    });
  }

  return (
    <main className="container mx-auto min-h-screen px-6 pb-16 pt-32 text-white">
      <Link href="/admin" className="text-sm text-gray-400 hover:text-white">
        ← Back to Dashboard
      </Link>
      <div className="mb-8 mt-5 flex flex-wrap items-end justify-between gap-4 border-b border-white/10 pb-7">
        <div>
          <h1 className="text-3xl font-bold">Team Management</h1>
          <p className="mt-2 text-sm text-gray-400">
            Build your teams, choose a leader, and bring the right people
            together.
          </p>
        </div>
        <button
          type="button"
          onClick={() => openEditor()}
          disabled={pending || draft !== null}
          className="rounded-lg bg-blue-600 px-5 py-3 text-sm font-semibold hover:bg-blue-500 disabled:opacity-50"
        >
          + Add Team
        </button>
      </div>
      {result && (
        <div
          role={result.status === "error" ? "alert" : "status"}
          className={`mb-6 rounded-lg border p-4 text-sm ${result.status === "error" ? "border-red-500/30 bg-red-950/30 text-red-200" : "border-emerald-500/30 bg-emerald-950/30 text-emerald-200"}`}
        >
          {result.message}
        </div>
      )}
      {draft && (
        <section
          ref={formRef}
          className="mb-10 scroll-mt-28 rounded-2xl border border-blue-500/30 bg-white/5 p-5 sm:p-7"
          aria-labelledby="team-editor-heading"
        >
          <h2 id="team-editor-heading" className="text-xl font-bold">
            {draft.id ? "Edit Team" : "Create Team"}
          </h2>
          <form onSubmit={handleSubmit} className="mt-5">
            <fieldset
              disabled={pending}
              className="space-y-5 disabled:opacity-60"
            >
              <div className="grid gap-5 md:grid-cols-2">
                <label className="text-sm font-medium">
                  Team name
                  <input
                    className={field}
                    required
                    maxLength={120}
                    value={draft.name}
                    onChange={(event) =>
                      setDraft({ ...draft, name: event.target.value })
                    }
                    placeholder="e.g. Film Production Team"
                  />
                </label>
                <label className="text-sm font-medium">
                  Team leader
                  <select
                    className={field}
                    required
                    value={draft.leaderUserId}
                    onChange={(event) => chooseLeader(event.target.value)}
                  >
                    <option value="">Choose a leader</option>
                    {users
                      .filter(
                        (user) =>
                          user.status === "APPROVED" ||
                          user.id === draft.leaderUserId,
                      )
                      .map((user) => (
                        <option
                          key={user.id}
                          value={user.id}
                          disabled={user.status !== "APPROVED"}
                        >
                          {fullName(user)} — {user.email}
                          {user.status !== "APPROVED" ? " (unavailable)" : ""}
                        </option>
                      ))}
                  </select>
                </label>
              </div>
              <label className="block text-sm font-medium">
                Description{" "}
                <span className="font-normal text-gray-500">(optional)</span>
                <textarea
                  className={field}
                  rows={3}
                  maxLength={2000}
                  value={draft.description}
                  onChange={(event) =>
                    setDraft({ ...draft, description: event.target.value })
                  }
                  placeholder="What does this team do best?"
                />
              </label>
              <div>
                <h3 className="font-semibold">
                  Members{" "}
                  <span className="text-gray-500">
                    ({draft.members.length})
                  </span>
                </h3>
                <p className="mt-1 text-sm text-gray-400">
                  Choose approved users and describe their roles. The team
                  leader is included automatically.
                </p>
                <ul className="mt-4 space-y-2">
                  {draft.members.map((member) => {
                    const user = users.find(
                      (user) => user.id === member.userId,
                    );
                    return (
                      <li
                        key={member.userId}
                        className="flex flex-wrap items-center gap-3 rounded-lg border border-white/10 bg-black/20 p-3"
                      >
                        <div className="min-w-0 flex-1">
                          <p className="text-sm font-medium">
                            {fullName(user)}{" "}
                            {member.userId === draft.leaderUserId && (
                              <span className="ml-2 text-xs text-blue-300">
                                Leader
                              </span>
                            )}
                          </p>
                          <p className="break-all text-xs text-gray-500">
                            {user?.email}
                          </p>
                          {user?.status !== "APPROVED" && (
                            <p className="mt-1 text-xs text-amber-300">
                              Account unavailable. Remove this member before
                              saving.
                            </p>
                          )}
                        </div>
                        <label className="w-full text-xs text-gray-400 sm:w-48">
                          Role for {fullName(user)}
                          <input
                            className={`${field} mt-1 py-2`}
                            maxLength={80}
                            placeholder="e.g. Producer"
                            value={member.roleInTeam || ""}
                            onChange={(event) =>
                              setDraft({
                                ...draft,
                                members: draft.members.map((item) =>
                                  item.userId === member.userId
                                    ? {
                                        ...item,
                                        roleInTeam: event.target.value,
                                      }
                                    : item,
                                ),
                              })
                            }
                          />
                        </label>
                        <button
                          type="button"
                          className={`${button} text-gray-300`}
                          disabled={member.userId === draft.leaderUserId}
                          aria-label={`Remove ${fullName(user)}`}
                          onClick={() =>
                            setDraft({
                              ...draft,
                              members: draft.members.filter(
                                (item) => item.userId !== member.userId,
                              ),
                            })
                          }
                        >
                          Remove
                        </button>
                      </li>
                    );
                  })}
                </ul>
                <label className="mt-5 block text-sm">
                  Find a member
                  <input
                    className={field}
                    type="search"
                    value={search}
                    onChange={(event) => setSearch(event.target.value)}
                    placeholder="Search by name or email"
                  />
                </label>
                <div className="mt-2 max-h-56 overflow-y-auto rounded-lg border border-white/10">
                  {available.map((user) => (
                    <div
                      key={user.id}
                      className="flex items-center justify-between gap-3 border-b border-white/5 px-3 py-2 last:border-0"
                    >
                      <div className="min-w-0">
                        <p className="text-sm">
                          {fullName(user)}{" "}
                          {user.role === "ADMIN" && (
                            <span className="text-xs text-gray-500">
                              Administrator
                            </span>
                          )}
                        </p>
                        <p className="break-all text-xs text-gray-500">
                          {user.email}
                        </p>
                      </div>
                      <button
                        type="button"
                        className={`${button} text-blue-300`}
                        aria-label={`Add ${fullName(user)}`}
                        disabled={draft.members.length >= 100}
                        onClick={() =>
                          setDraft({
                            ...draft,
                            members: [
                              ...draft.members,
                              { userId: user.id, roleInTeam: "" },
                            ],
                          })
                        }
                      >
                        Add
                      </button>
                    </div>
                  ))}
                  {available.length === 0 && (
                    <p className="p-4 text-sm text-gray-500">
                      No matching approved users. Review new Talent in{" "}
                      <Link
                        className="text-blue-300 underline"
                        href="/admin/talent"
                      >
                        Talent Review
                      </Link>
                      .
                    </p>
                  )}
                </div>
              </div>
              <div className="flex flex-wrap gap-3 border-t border-white/10 pt-5">
                <button
                  type="submit"
                  className="rounded-lg bg-blue-600 px-5 py-3 text-sm font-semibold hover:bg-blue-500"
                  disabled={eligibleUsers.length === 0}
                >
                  {pending
                    ? "Saving…"
                    : draft.id
                      ? "Save Changes"
                      : "Create Team"}
                </button>
                <button
                  type="button"
                  className={button}
                  onClick={() => {
                    setDraft(null);
                    setResult(null);
                  }}
                >
                  Cancel
                </button>
              </div>
            </fieldset>
          </form>
        </section>
      )}
      <div className="grid gap-5 lg:grid-cols-2">
        {teams.map((team) => (
          <section
            key={team.id}
            className="rounded-2xl border border-white/10 bg-white/5 p-6"
          >
            <div className="flex items-start justify-between gap-4">
              <div>
                <h2 className="text-xl font-bold">{team.name}</h2>
                <p className="mt-1 text-sm text-gray-400">
                  Led by{" "}
                  {fullName(
                    users.find((user) => user.id === team.leaderUserId),
                  )}
                </p>
              </div>
              <span className="rounded-full bg-emerald-500/10 px-2.5 py-1 text-xs text-emerald-300">
                {team.status}
              </span>
            </div>
            {team.description && (
              <p className="mt-4 whitespace-pre-wrap break-words text-sm text-gray-400">
                {team.description}
              </p>
            )}
            <p className="my-5 text-sm text-gray-400">
              {team.members.length}{" "}
              {team.members.length === 1 ? "member" : "members"} ·{" "}
              {team.projectCount}{" "}
              {team.projectCount === 1 ? "project" : "projects"}
            </p>
            <ul className="space-y-2">
              {team.members.map((member) => (
                <li
                  key={member.userId}
                  className="flex flex-wrap justify-between gap-2 rounded-lg bg-black/20 px-3 py-2 text-sm"
                >
                  <span>
                    {fullName(users.find((user) => user.id === member.userId))}
                  </span>
                  <span className="text-gray-500">
                    {member.roleInTeam || "Member"}
                  </span>
                </li>
              ))}
            </ul>
            <div className="mt-5 flex flex-wrap gap-3">
              <button
                type="button"
                className={button}
                onClick={() => openEditor(team)}
                disabled={pending || draft !== null}
                aria-label={`Edit ${team.name}`}
              >
                Edit Team
              </button>
              <Link
                className={`${button} text-blue-300`}
                href={`/teams/${team.slug}`}
              >
                View Team Profile
              </Link>
            </div>
          </section>
        ))}
        {teams.length === 0 && (
          <div className="rounded-2xl border border-dashed border-white/15 p-12 text-center lg:col-span-2">
            <h2 className="text-xl font-semibold">Build your first team</h2>
            <p className="mt-2 text-gray-400">
              Select Add Team to choose a leader and assemble your roster.
            </p>
          </div>
        )}
      </div>
    </main>
  );
}
