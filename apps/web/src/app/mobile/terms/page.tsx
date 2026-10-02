import Link from "next/link";

export const metadata = { title: "Finley app terms | TalentEarth Studios" };
export default function MobileTerms() {
  return (
    <main className="mx-auto max-w-3xl px-6 pb-20 pt-32 text-white space-y-6">
      <h1 className="text-3xl font-semibold">Finley app terms</h1>
      <p>
        Use Finley to describe a creative project and request follow-up from
        TalentEarth Studios. Provide an email address you control, and keep your
        sign-in codes private.
      </p>
      <p>
        Only submit material you have permission to share. Record your own
        project description; obtain permission before recording anyone else.
      </p>
      <p>
        Automated transcription and summaries can make mistakes. Review and edit
        your project before submitting. Submitting a brief is a request for
        review and does not confirm a price, delivery date, agreement, or
        purchase. Any paid engagement will be agreed separately with the studio.
      </p>
      <p>
        For help, contact{" "}
        <a className="underline" href="mailto:robertstock@me.com">
          robertstock@me.com
        </a>
        .
      </p>
      <p>
        <Link className="underline" href="/mobile/privacy">
          Privacy and account deletion
        </Link>
      </p>
    </main>
  );
}
