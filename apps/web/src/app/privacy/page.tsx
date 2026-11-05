import type { Metadata } from "next";
import Link from "next/link";
import { Checklist } from "@/components/Checklist";
import { siteConfig, supportMailto } from "@/config/site";

export const metadata: Metadata = {
  title: "Privacy Policy",
  description: "Draft privacy policy for JOTA, based on how the iPhone app and its backend handle account details, meal photos, and protein estimates.",
  alternates: { canonical: "/privacy" },
};

export default function PrivacyPage() {
  const effective = siteConfig.privacyEffectiveDate || "Not set. This draft is not approved for publication.";
  const entity = siteConfig.legalEntity || "The legal entity that operates JOTA is not named yet.";
  const address = siteConfig.businessAddress || "A mailing address has not been published.";

  return (
    <article className="wrap legal">
      <p className="eyebrow">Privacy</p>
      <h1>Privacy policy</h1>
      <div className="draft" role="note">
        <p>
          <strong>Draft for review.</strong> This page describes what the current JOTA app and backend actually do. It is
          not an approved privacy policy.
        </p>
        <p>
          Effective date: {effective}. <a href="#review">Open the developer checklist</a> before using this page in an
          App Store submission.
        </p>
      </div>
      <div className="prose">
        <h2>1. Who this describes</h2>
        <p>
          JOTA is a protein tracking app for iPhone. {entity} This draft is written from the product as it is built in
          the JOTA repository. Where a practice has not been decided, it is left out of the policy and listed in the
          checklist instead.
        </p>
        <p>
          Contact for privacy questions: <a href={supportMailto("JOTA privacy")}>{siteConfig.supportEmail}</a>. {address}
        </p>

        <h2>2. Information the app collects</h2>
        <p>Depending on how you use JOTA, the product stores:</p>
        <ul>
          <li>An account identifier created by Supabase Auth. A new install receives an anonymous account.</li>
          <li>
            If you choose Sign in with Apple, the Apple identity linked to that same account, and the name Apple shares
            when you allow it.
          </li>
          <li>
            Profile details: display name, body weight and unit, a protein goal minimum and maximum, whether that range
            was customized, and a selected goal. The goals in the app are build muscle, lose fat, maintain muscle and
            health, or simply eat more protein. The profile also stores a timezone and whether onboarding is finished.
          </li>
          <li>
            Food logs: name, optional brand, serving, protein, optional calories, carbohydrate, fat, and notes, meal
            type, date, and how the entry was made. Entries can come from search, a barcode, a recent or favorite food,
            a custom food, quick add, a photo estimate, a saved meal, or a copy.
          </li>
          <li>A manual daily total, if you set one.</li>
          <li>Favorites, custom foods, and saved meals.</li>
          <li>Notification preferences, stored for the local reminders the app schedules on the phone.</li>
          <li>Meal photos, optional text you add about a photo, and the analysis record described below.</li>
          <li>
            Feedback you send from the app: the message, an optional display name, and the account id. Feedback is
            stored in a separate table.
          </li>
          <li>
            Subscription status when billing is turned on: whether access is active, the product, store, expiry, and
            renewal flag. The example app configuration ships with the paywall off.
          </li>
        </ul>
        <p>
          A copy of your logs lives on the device and syncs to the database when the phone is online. Product analytics,
          when configured, are described below and are written so they do not include photo contents, food names, or text
          you typed about a meal.
        </p>

        <h2>3. Sign in with Apple</h2>
        <p>
          You can use JOTA with the anonymous account created at install. Sign in with Apple is optional. It links Apple’s
          identity to that account so the same logs and, when billing is on, the subscription can move with you. Apple’s
          own privacy terms cover what Apple collects during sign-in.
        </p>

        <h2>4. Meal photographs</h2>
        <p>When you submit a food photo, the app uploads the image to a private Supabase Storage bucket named meal-photos. The bucket is not public. The file path starts with your account id. Accepted types in the bucket setup are JPEG, PNG, and HEIC, up to 5 MB. The app prepares a JPEG for upload.</p>
        <p>
          The photo is then analyzed as described in the next section. The app also creates signed links so it can show
          your own photo back to you. Those links are temporary. Removing a meal inside the app marks the log deleted. In
          the current code, that does not delete the file from storage.
        </p>
        <p>How long photos are kept has not been decided. There is no expiry job in the database.</p>

        <h2>5. How a photo estimate works</h2>
        <p>
          JOTA’s API checks that the photo path belongs to the signed-in account, creates a signed URL that lasts about
          five minutes, and sends that URL to OpenAI at api.openai.com, along with any short note you added about the
          meal. OpenAI returns a structured estimate: foods it thinks it sees, a protein amount for each, a total, and a
          confidence rating. The app stores the model name, the raw response, and the estimate. The model name comes from
          the API environment. The example default is gpt-5-mini.
        </p>
        <p>
          Nothing is logged from a photo until you review it. You can edit the items or the total, replace the estimate
          with your own number, or discard it. The estimate is approximate. Portion size, hidden ingredients, and photo
          quality all change it. It is not a laboratory measurement.
        </p>

        <h2>6. What we are not claiming about OpenAI</h2>
        <p>
          The request goes to OpenAI so the estimate can be produced. This policy does not say whether OpenAI stores the
          image, for how long, or whether OpenAI may use it for training. The application code does not send a
          zero-retention flag. That decision is an open item in the checklist. Do not treat a blank as a promise.
        </p>

        <h2>7. Why the information is used</h2>
        <ul>
          <li>To keep your account, profile, and food log.</li>
          <li>To estimate protein from a photo and let you correct it.</li>
          <li>To show daily progress against your range and to schedule reminders on your phone.</li>
          <li>To sync the on-device copy with the database.</li>
          <li>To record subscription status when the paywall is enabled.</li>
          <li>To read feedback you choose to send.</li>
          <li>To understand product usage with the analytics described below, when that tool is configured.</li>
        </ul>

        <h2>8. Hosting and other providers</h2>
        <p>The current system is built to use these providers:</p>
        <ul>
          <li>Supabase, for authentication, the Postgres database, and private photo storage. Access rules limit rows to the signed-in account.</li>
          <li>Vercel, for the API that searches foods, analyzes photos, receives subscription webhooks, and stores feedback.</li>
          <li>OpenAI, for photo estimates, as described above.</li>
          <li>USDA FoodData Central, for food search, requested through JOTA’s API.</li>
          <li>Open Food Facts, for barcode lookups, requested through JOTA’s API.</li>
          <li>Apple, for Sign in with Apple, App Store purchases, and the on-device reminders, widgets, and Live Activity.</li>
          <li>
            RevenueCat, only when the paywall is enabled. It is the subscription adapter, and its webhook writes
            subscription status into Supabase. The example configuration does not turn this on.
          </li>
          <li>
            PostHog, only when a project key is set in the app. Events use the Supabase user id. They are written to
            exclude photo contents, food names, and typed meal notes. If the key is empty, those events are not sent.
          </li>
        </ul>
        <p>
          Where each provider stores data, and which legal terms apply to them, still need to be confirmed. See the
          checklist.
        </p>

        <h2>9. Sharing</h2>
        <p>
          The app sends information to the providers above so those features can run. Food search sends the query. A
          barcode lookup sends the barcode. A photo estimate sends the image URL and your optional note to OpenAI.
        </p>
        <p>
          This draft does not say that JOTA sells personal information, and it does not say that JOTA never sells
          personal information. There is no advertising SDK in the app. A reviewed position on selling or sharing is an
          open checklist item.
        </p>

        <h2>10. Retention</h2>
        <p>
          Logs, photos, analyses, and profile rows stay until they are removed. The app does not publish a retention
          period, because none is implemented. Soft-deleted logs remain in the database with a deleted timestamp.
          Feedback rows are kept if the auth user is later removed. The database only clears the user id on that table.
        </p>

        <h2>11. Security</h2>
        <p>
          Private tables are protected with row level security so an account reads its own rows. Meal photos are in a
          private bucket. The analysis URL expires after a few minutes. The API base URL used by the app is HTTPS.
        </p>
        <p>
          This page does not claim that data is encrypted at rest, and it does not describe a certification. Add that
          only after it is verified.
        </p>

        <h2>12. Your choices</h2>
        <p>You can edit or remove individual food logs in the app. You can change your name, weight, goal, and protein range from Profile. You can turn reminders off. You can skip Sign in with Apple and keep the anonymous account. You can choose not to take a photo and use quick add instead.</p>
        <p>
          There is no in-app control to download a full copy of your data, and no in-app control to delete the account.
          For access, correction, or deletion requests, email{" "}
          <a href={supportMailto("JOTA privacy request")}>{siteConfig.supportEmail}</a>. Which privacy rights apply
          depends on the legal entity and where you live. Those rights are not spelled out here until counsel confirms
          them.
        </p>

        <h2>13. Account deletion</h2>
        <p>
          Account deletion is not available inside the app or on this website. The steps we can honestly describe are on
          the <Link href="/delete-account">delete account</Link> page. Canceling an Apple subscription is separate and
          does not delete the JOTA account.
        </p>

        <h2>14. Children</h2>
        <p>
          The app does not ask for a date of birth and does not include an age check. A children’s privacy position has
          not been approved. Do not read this draft as a statement that JOTA is, or is not, directed at children.
        </p>

        <h2>15. International processing</h2>
        <p>
          The repository does not record the Supabase region or the regions used by Vercel, OpenAI, or PostHog. This
          draft does not claim that data stays in a particular country.
        </p>

        <h2>16. Changes</h2>
        <p>
          When this policy is approved, the effective date at the top will be set. Later changes will be posted on this
          page. How users will be notified, beyond the page itself, has not been decided.
        </p>

        <h2>17. Contact</h2>
        <p>
          Email <a href={supportMailto("JOTA privacy")}>{siteConfig.supportEmail}</a>. {entity} {address}
        </p>

        <Checklist />
      </div>
    </article>
  );
}
