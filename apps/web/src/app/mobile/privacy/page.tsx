import Link from "next/link";

export const metadata = { title: "Finley app privacy | TalentEarth Studios" };
export default function MobilePrivacy() {
  return (
    <main className="mx-auto max-w-3xl px-6 pb-20 pt-32 text-white space-y-6">
      <h1 className="text-3xl font-semibold">
        Finley app privacy
      </h1>
      <p>
        Finley is the project submission app for TalentEarth Studios. It uses
        your name and email address to verify your account, greet
        you, and let our studio follow up about the projects you submit. Sign-in
        codes expire after ten minutes. Your phone stores its sign-in token in
        the operating system’s secure storage.
      </p>
      <h2 className="text-xl font-semibold">
        Your recordings and project ideas
      </h2>
      <p>
        With your permission, recordings are sent to OpenAI through our server
        to transcribe your words and prepare a summary. You can use the text
        option instead. Review and correct the summary before submitting it. An
        AI summary can contain mistakes.
      </p>
      <p>
        The app keeps your unfinished draft and recording on your device so you
        can retry. Our server processes the audio without adding it to our
        permanent file storage. OpenAI processes it under its applicable API
        data policies. After submission, your edited brief and original
        transcript are stored with your project for our studio team. We use
        Resend to deliver verification and project notification emails.
      </p>
      <p>
        Submitting, discarding a draft, signing out, or deleting your account
        removes the app’s saved local draft and recording. Uninstalling the app
        also removes local drafts. The app does not sell your personal
        information, include advertising, or track you across other apps.
      </p>
      <h2 className="text-xl font-semibold">
        Delete your account or request data removal
      </h2>
      <p>
        You can delete your app account in Account → Delete account, or use the
        link below without installing the app. This removes the account and
        revokes all its sign-ins. Submitted projects, transcripts, and their
        contact details are retained by the studio to handle your service
        requests and business records; account deletion does not automatically
        delete those records.
      </p>
      <p>
        For removal of submitted project data or other privacy questions, email{" "}
        <a className="underline" href="mailto:robertstock@me.com">
          robertstock@me.com
        </a>
        . We will review your request and explain any records that must be
        retained.
      </p>
      <p>
        <Link className="underline" href="/mobile/delete-account">
          Delete your Finley account
        </Link>
      </p>
      <p>
        <Link className="underline" href="/mobile/terms">
          App terms
        </Link>
      </p>
    </main>
  );
}
