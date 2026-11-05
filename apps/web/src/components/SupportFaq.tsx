"use client";

import Link from "next/link";
import { FaqList } from "@/components/FaqList";
import { siteConfig, supportMailto } from "@/config/site";

export function SupportFaq() {
  return (
    <FaqList
      items={[
        {
          question: "How does JOTA estimate protein from a photo?",
          answer: (
            <p>
              Take a photo of the meal. JOTA uses an AI reading of that photo to estimate the protein in what it can see.
              You get a total and a breakdown, plus a confidence note. The result is approximate. Portion size,
              ingredients the photo hides, and a blurry or dark shot can all move the number. You review it before it is
              logged, and you can change it.
            </p>
          ),
        },
        {
          question: "Can I change my protein goal?",
          answer: (
            <p>
              Yes. Open Profile, tap Daily protein goal, adjust the range, and save. The goal counts as reached at the
              lower number. If you have entered a body weight, you can also recalculate a suggested range from that
              weight. A custom range is kept until you change it.
            </p>
          ),
        },
        {
          question: "Can I log protein without taking a photo?",
          answer: (
            <p>
              Yes. On Today, tap the plus button, then Quick add. Enter the grams and, if you want, a name. You can also
              search for a food or scan a barcode from that same log screen.
            </p>
          ),
        },
        {
          question: "What if the protein estimate looks wrong?",
          answer: (
            <p>
              On the review screen, edit any item or the total before you add it. If you would rather not use the
              estimate, enter the protein yourself with Quick add. If something about the estimate keeps failing, email{" "}
              <a href={supportMailto("JOTA estimate")}>{siteConfig.supportEmail}</a> and describe the meal. A photo
              attached to that email is optional.
            </p>
          ),
        },
        {
          question: "How do I manage or cancel my subscription?",
          answer: (
            <p>
              App Store subscriptions are billed by Apple. Open your Apple ID subscriptions at{" "}
              <a href={siteConfig.subscription.manageUrl}>apps.apple.com/account/subscriptions</a>, or in the iPhone
              Settings app under your name, then Subscriptions. The version of JOTA you have may not show a subscription
              at all. The example configuration ships with the paywall turned off.
            </p>
          ),
        },
        {
          question: "How does the free trial work?",
          answer: (
            <p>
              A {siteConfig.subscription.trialDays}-day introductory offer is the planned App Store setup for monthly and
              annual plans. Apple shows the price and the trial, if one is offered to your Apple ID, before you confirm.
              This site does not list a price, because the app does not hard-code one. If you never see a purchase
              screen, you are not in a trial.
            </p>
          ),
        },
        {
          question: "How do I delete my account?",
          answer: (
            <p>
              There is no delete button in the app yet. Read the <Link href="/delete-account">delete account</Link> page
              and email {siteConfig.supportEmail} to ask. Canceling an Apple subscription is a separate step and does not
              erase the account.
            </p>
          ),
        },
        {
          question: "How do I report a bug?",
          answer: (
            <p>
              Email <a href={supportMailto("JOTA bug")}>{siteConfig.supportEmail}</a> and include what you expected, what
              happened, your iPhone model, and the JOTA version from the App Store or from Settings. We don’t promise a
              response time.
            </p>
          ),
        },
      ]}
    />
  );
}
