import type { Metadata } from "next";
import Link from "next/link";
import { Checklist } from "@/components/Checklist";
import { siteConfig, supportMailto } from "@/config/site";

export const metadata: Metadata = {
  title: "Delete your account",
  description: "How to ask JOTA to delete your account, what the current app can and cannot erase, and how Apple subscriptions are handled.",
  alternates: { canonical: "/delete-account" },
};

export default function DeleteAccountPage() {
  return (
    <article className="wrap legal">
      <p className="eyebrow">Account</p>
      <h1>Delete your JOTA account.</h1>
      <p className="lede">
        There is no delete button in the iPhone app, and this page cannot delete an account for you. Email us and we
        will take the request from there.
      </p>
      <div className="prose">
        <h2>Ask by email</h2>
        <p>
          Write to <a href={supportMailto("Delete my JOTA account")}>{siteConfig.supportEmail}</a> with the subject
          “Delete my JOTA account”. Tell us the display name on your profile if you set one, and whether you use Sign in
          with Apple. Use an email address you can read, so we can reply if we need to match the request to the right
          account.
        </p>
        <p>
          <a className="btn btn-primary" href={supportMailto("Delete my JOTA account")}>
            Email support
          </a>
        </p>

        <h2>What the app can do today</h2>
        <p>
          You can remove a single meal from Today. That hides the log. In the current code it does not delete the photo
          file from storage, and it does not close the account. Signing out is not the same as deletion. Deleting the
          app from your phone leaves the synced account in place.
        </p>

        <h2>What a completed deletion is meant to remove</h2>
        <p>The database is built so that deleting the auth user also deletes rows tied to that user:</p>
        <ul>
          <li>Profile, including name, weight, goal, and protein range</li>
          <li>Food logs, custom foods, favorites, and saved meals</li>
          <li>Daily totals you set by hand</li>
          <li>Photo analysis records</li>
          <li>Notification preferences</li>
          <li>Subscription status stored for that user</li>
        </ul>
        <p>
          Two things do not follow automatically, and we will not pretend they do. Feedback messages stay in their own
          table. The database only clears the user id on those rows. Photo files in storage are not removed by the user
          deletion itself. There is no storage cleanup trigger in the schema. Both are open items in the checklist.
        </p>

        <h2>What may need to be kept</h2>
        <p>
          A retention rule for tax, fraud, or legal claims has not been decided. Until it is, the only honest statement
          is that we have not published one. If something must be kept, we will say so when we reply to a deletion
          request rather than invent a period here.
        </p>

        <h2>Your subscription is separate</h2>
        <p>
          If you have an App Store subscription, cancel it in Apple’s subscription settings:{" "}
          <a href={siteConfig.subscription.manageUrl}>apps.apple.com/account/subscriptions</a>. Deleting the JOTA account
          does not cancel Apple billing, and canceling Apple billing does not delete the JOTA account. The example app
          configuration ships with the paywall off, so you may not have a subscription at all.
        </p>

        <h2>Questions</h2>
        <p>
          Email <a href={supportMailto("JOTA account deletion")}>{siteConfig.supportEmail}</a>. The same address is on
          the <Link href="/support">support</Link> page. The <Link href="/privacy">privacy policy</Link> describes the
          data the app stores. We don’t promise how quickly a deletion is finished.
        </p>

        <Checklist areas={["Account deletion", "Privacy", "Subscription", "Contact"]} />
      </div>
    </article>
  );
}
