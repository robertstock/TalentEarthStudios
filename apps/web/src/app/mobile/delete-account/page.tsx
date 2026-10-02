"use client";

import { useState } from "react";
import Link from "next/link";

export default function DeleteMobileAccount() {
  const [email, setEmail] = useState("");
  const [code, setCode] = useState("");
  const [challenge, setChallenge] = useState("");
  const [token, setToken] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const [done, setDone] = useState(false);
  async function request(path: string, data: unknown, method = "POST") {
    const response = await fetch(`/api/mobile${path}`, {
      method,
      headers: {
        "Content-Type": "application/json",
        ...(token ? { Authorization: `Bearer ${token}` } : {}),
      },
      body: JSON.stringify(data),
      signal: AbortSignal.timeout(30_000),
    });
    const result = await response.json();
    if (!response.ok) throw new Error(result.error || "Please try again.");
    return result;
  }
  async function action() {
    if (busy) return;
    setBusy(true);
    setError("");
    try {
      if (token) {
        await request("/account", { confirm: "DELETE" }, "DELETE");
        setToken("");
        setDone(true);
      } else if (challenge) {
        const result = await request("/auth/verify", {
          challengeId: challenge,
          code,
        });
        setToken(result.token);
      } else {
        const result = await request("/auth/code", { email });
        setChallenge(result.challengeId);
      }
    } catch (err) {
      setError(
        err instanceof Error ? err.message : "Unable to complete the request.",
      );
    } finally {
      setBusy(false);
    }
  }
  return (
    <main className="mx-auto max-w-xl px-6 pb-20 pt-32 text-white space-y-6">
      <h1 className="text-3xl font-semibold">
        Delete your Finley account
      </h1>
      {done ? (
        <p role="status">
          Your app account has been deleted and all its sign-ins revoked.
        </p>
      ) : (
        <>
          <p>
            This removes your Finley account and all its sign-ins. Submitted
            projects, transcripts and contact details remain with the studio for
            your service requests and business records. To request removal of
            those records, email{" "}
            <a className="underline" href="mailto:robertstock@me.com">
              robertstock@me.com
            </a>
            .
          </p>
          {!token && (
            <label className="block">
              {challenge
                ? "Code from your email"
                : "Your registered email address"}
              <input
                className="mt-2 w-full rounded-lg border border-white/25 bg-white/5 p-4"
                aria-label={challenge ? "Verification code" : "Email address"}
                value={challenge ? code : email}
                onChange={(event) =>
                  challenge
                    ? setCode(event.target.value.replace(/\D/g, "").slice(0, 6))
                    : setEmail(event.target.value)
                }
                type={challenge ? "text" : "email"}
                inputMode={challenge ? "numeric" : "email"}
                autoComplete={challenge ? "one-time-code" : "email"}
              />
            </label>
          )}
          {token && (
            <p className="font-semibold">
              Email verified. Confirm below to permanently delete your app
              account.
            </p>
          )}
          <button
            disabled={
              busy ||
              (!token && (challenge ? code.length !== 6 : !email.includes("@")))
            }
            onClick={action}
            className="w-full rounded-lg bg-blue-600 px-6 py-4 font-semibold disabled:opacity-50"
          >
            {busy
              ? "Please wait…"
              : token
                ? "Permanently delete my app account"
                : challenge
                  ? "Verify email"
                  : "Send verification code"}
          </button>
          {challenge && !token && (
            <button
              disabled={busy}
              className="underline"
              onClick={() => {
                setChallenge("");
                setCode("");
              }}
            >
              Use a different email or request a new code
            </button>
          )}
        </>
      )}
      {!!error && (
        <p role="alert" className="text-red-300">
          {error}
        </p>
      )}
      <p>
        <Link className="underline" href="/mobile/privacy">
          Read the app privacy information
        </Link>
      </p>
    </main>
  );
}
