import type { Metadata } from "next";
import Link from "next/link";
import { Checklist } from "@/components/Checklist";
import { siteConfig, supportMailto } from "@/config/site";

export const metadata: Metadata = {
  title: "Terms of Use",
  description: "Draft terms for the JOTA iPhone app, including photo estimates and App Store subscriptions.",
  alternates: { canonical: "/terms" },
};

export default function TermsPage() {
  const entity = siteConfig.legalEntity || "Not set";
  const price = siteConfig.subscription.price || "Not listed. Apple shows the price before you subscribe.";

  return (
    <article className="wrap legal">
      <p className="eyebrow">Terms</p>
      <h1>Terms of use</h1>
      <div className="draft" role="note">
        <p>
          <strong>Draft. Needs legal review before publication.</strong> These terms describe the product as it is built.
          They are not a finished contract. Governing law, liability limits, and the live subscription offer are
          incomplete on purpose.
        </p>
      </div>
      <div className="prose">
        <h2>1. Agreement</h2>
        <p>
          These terms cover the JOTA iPhone app and this website. If you use JOTA, you are agreeing to this draft only
          once a lawyer has approved it and an effective date is published. Until then, treat the page as a preview of
          the intended terms.
        </p>

        <h2>2. Who operates JOTA</h2>
        <dl className="facts">
          <div>
            <dt>Legal entity</dt>
            <dd>{entity}</dd>
          </div>
          <div>
            <dt>Contact</dt>
            <dd>
              <a href={supportMailto("JOTA terms")}>{siteConfig.supportEmail}</a>
            </dd>
          </div>
          <div>
            <dt>Address</dt>
            <dd>{siteConfig.businessAddress || "Not set"}</dd>
          </div>
        </dl>

        <h2>3. Eligibility</h2>
        <p>
          The iPhone app uses an Apple account when you subscribe or use Sign in with Apple. A minimum age has not been
          set. This section is not an age gate. Do not publish the terms until the checklist item for children and
          eligibility is decided.
        </p>

        <h2>4. The account</h2>
        <p>
          Installing JOTA creates an anonymous account. You do not pick a password. You can link Sign in with Apple,
          which attaches that Apple identity to the same account. You are responsible for the phone you use and for
          reviewing what you log. There is no separate web login on this website.
        </p>

        <h2>5. The service</h2>
        <p>
          JOTA helps you track protein. You can photograph a meal for an estimate, add a protein amount yourself, search
          foods, scan a barcode, and follow a daily protein range. Reminders, a Home Screen widget, and a Lock Screen
          Live Activity are part of the iOS app. Features can change.
        </p>

        <h2>6. Photo estimates</h2>
        <p>
          If you submit a meal photo, JOTA sends it for an AI estimate of the protein in what is visible. The result is
          an estimate. It can be wrong because of portion size, ingredients the camera cannot see, or the photo itself.
          You are shown the estimate and can edit it before it is saved. JOTA does not guarantee that an estimate is
          accurate, complete, or suitable for a medical diet.
        </p>

        <h2>7. Not medical or nutrition advice</h2>
        <p>
          Protein totals, ranges, and estimates are information for your own tracking. They are not medical advice,
          dietary advice, or a diagnosis. They are not a substitute for a physician or a registered dietitian. You are
          responsible for decisions you make about what you eat.
        </p>

        <h2>8. Subscriptions</h2>
        <p>
          JOTA may offer an auto-renewing subscription through the Apple App Store. The planned offer is a{" "}
          {siteConfig.subscription.trialDays}-day free introductory period, then a paid {siteConfig.subscription.intervals}{" "}
          plan. The app is written to read the price and the trial from Apple rather than hard-coding them.
        </p>
        <dl className="facts">
          <div>
            <dt>Price on this website</dt>
            <dd>{price}</dd>
          </div>
          <div>
            <dt>Plans</dt>
            <dd>{siteConfig.subscription.intervals}, entitlement id {siteConfig.subscription.entitlementId}</dd>
          </div>
          <div>
            <dt>Current example configuration</dt>
            <dd>
              {siteConfig.subscription.paywallEnabled
                ? "The paywall flag is on."
                : "The paywall flag in the example app configuration is off, so that build does not ask for a subscription."}
            </dd>
          </div>
        </dl>
        <p>
          If a purchase screen is shown, Apple charges the payment method on your Apple ID when the trial ends, unless
          you cancel first. The exact renewal time is the one Apple shows you at purchase. Payment, receipts, and
          failed charges are handled by Apple.
        </p>

        <h2>9. Free trial</h2>
        <p>
          A {siteConfig.subscription.trialDays}-day introductory offer is the planned App Store setup. It is only a
          promise for a specific product once that product is live in App Store Connect. Eligibility, including whether
          you have already used a trial, is decided by Apple. This website does not start a trial.
        </p>

        <h2>10. Cancellation and refunds</h2>
        <p>
          Manage or cancel an App Store subscription in your Apple ID subscription settings:{" "}
          <a href={siteConfig.subscription.manageUrl}>apps.apple.com/account/subscriptions</a>. Deleting a JOTA account,
          or deleting the app, does not cancel the Apple subscription. Refunds for App Store charges are requested from
          Apple. JOTA has not published a separate refund policy.
        </p>

        <h2>11. Your photos and other content</h2>
        <p>
          You keep ownership of the photos and notes you submit. You give JOTA permission to store them, show them back
          to you, and send a photo and optional note to the estimation provider described in the{" "}
          <Link href="/privacy">Privacy Policy</Link>, so the app can do what you asked. That permission lasts for as
          long as the content is kept. The retention limits are not settled. See the privacy checklist.
        </p>

        <h2>12. JOTA’s intellectual property</h2>
        <p>
          The JOTA name, the app, the widget, and this website’s design and copy belong to the operator named above,
          once that operator is set. These terms do not sell you that ownership. They let you use the app for your own
          tracking.
        </p>

        <h2>13. Acceptable use</h2>
        <p>Do not misuse JOTA. That includes trying to break or overload the service, probing it without permission, uploading unlawful content, or using the estimate as if it were a certified lab result.</p>

        <h2>14. Availability</h2>
        <p>
          JOTA can change, suspend, or stop features. Photo estimates depend on the phone, the network, and the
          estimation provider. A failed estimate is a reason to add the protein yourself, not a promise that every photo
          will resolve.
        </p>

        <h2>15. Disclaimers and liability</h2>
        <p>
          The service and its estimates are provided as available. To the extent the law allows, JOTA disclaims
          warranties of accuracy, fitness for a particular diet, and uninterrupted operation. A numeric cap on liability,
          and any carve-outs a local law requires, are not written here. Counsel needs to add them before publication.
          Nothing in this draft limits liability that cannot legally be limited.
        </p>

        <h2>16. Ending an account</h2>
        <p>
          You can stop using JOTA by deleting the app, which does not by itself erase the synced account. Account
          deletion is described on the <Link href="/delete-account">delete account</Link> page. JOTA may refuse or close
          access if the service is misused. The operational process for that is not published yet.
        </p>

        <h2>17. Law and disputes</h2>
        <p>
          Governing law, venue, and any arbitration or small-claims option are not selected. Do not infer a state, a
          country, or a dispute forum from this draft.
        </p>

        <h2>18. Changes to these terms</h2>
        <p>
          Updated terms will be posted on this page. A notice method beyond the page itself has not been decided. If you
          keep using JOTA after approved terms take effect, that is the point at which the new terms are meant to apply.
          The effective moment should be added when the terms are approved.
        </p>

        <h2>19. Contact</h2>
        <p>
          <a href={supportMailto("JOTA terms")}>{siteConfig.supportEmail}</a>
        </p>

        <Checklist areas={["Legal", "Contact", "Subscription", "Account deletion", "Privacy"]} />
      </div>
    </article>
  );
}
