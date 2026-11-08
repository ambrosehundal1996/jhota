/**
 * Public website configuration.
 *
 * Empty strings and `confirmed.* = false` are unfinished on purpose.
 * Do not invent a legal name, address, price, or download URL to fill them.
 * Support email matches SUPPORT_EMAIL in apps/mobile/.env.example.
 * url is the metadata base for this site. https://jhota.vercel.app is the API host;
 * do not deploy this app onto that Vercel project.
 */

export const siteConfig = {
  name: "JOTA",
  tagline: "Hit your protein goals. Without the hassle.",
  description:
    "JOTA is a protein-first iPhone app. Photograph a meal, get a protein estimate you can edit, and aim for a daily range instead of one rigid number.",
  url: "https://jhota.vercel.app",
  supportEmail: "support@jota.app",
  /** Operating company. Required before the legal pages are treated as final. */
  legalEntity: "",
  /** Postal address for privacy requests. Required before publication. */
  businessAddress: "",
  /** Set on the day counsel approves the policy. Leave blank until then. */
  privacyEffectiveDate: "",
  /** Live App Store product page. Leave blank until the listing exists. */
  appStoreUrl: "",
  /** Public TestFlight invite. Leave blank until it exists. */
  testFlightUrl: "",
  instagramUrl: "",
  tiktokUrl: "",
  subscription: {
    /** Mirrors apps/mobile/.env.example, where PAYWALL_ENABLED=false. */
    paywallEnabled: false,
    /** Planned introductory offer described in the repo README. Confirm in App Store Connect. */
    trialDays: 7,
    intervals: "monthly and annual",
    /** Shown by Apple at purchase. The app does not hard-code a price. */
    price: "",
    entitlementId: "pro",
    manageUrl: "https://apps.apple.com/account/subscriptions",
  },
};

/**
 * Flip a flag to true only after a person has verified it outside this file.
 * The website will not describe that item as settled until then.
 */
export const confirmed = {
  supportMailboxReceivesMail: false,
  domainOwnedAndDeployed: false,
  legalReviewComplete: false,
  openaiRetentionDecided: false,
  photoRetentionPeriodDecided: false,
  storageRemovedWithAccount: false,
  dataSalePositionDecided: false,
  childrenPolicyDecided: false,
  governingLawDecided: false,
  encryptionClaimDecided: false,
  policyChangeNoticeDecided: false,
  dataRegionDecided: false,
  subscriptionProductsLive: false,
  trialAttachedToProducts: false,
  posthogAccountReviewed: false,
  revenueCatReviewed: false,
  inAppDeletionShipped: false,
  commissionedPhotography: false,
};

export type DownloadAction = {
  href: string;
  label: string;
  external: boolean;
  note: string | null;
};

export function downloadAction(): DownloadAction {
  if (siteConfig.appStoreUrl) {
    return { href: siteConfig.appStoreUrl, label: "Get Jota", external: true, note: null };
  }
  if (siteConfig.testFlightUrl) {
    return { href: siteConfig.testFlightUrl, label: "Join the beta", external: true, note: null };
  }
  return {
    href: `mailto:${siteConfig.supportEmail}?subject=${encodeURIComponent("JOTA beta")}`,
    label: "Join the beta",
    external: false,
    note: "No public download yet. This opens an email to the JOTA team.",
  };
}

export function supportMailto(subject: string): string {
  return `mailto:${siteConfig.supportEmail}?subject=${encodeURIComponent(subject)}`;
}

export function copyrightHolder(): string {
  return siteConfig.legalEntity || "JOTA";
}

export type ChecklistItem = {
  id: string;
  area: "Legal" | "Contact" | "Launch" | "Privacy" | "Subscription" | "Account deletion" | "Brand";
  detail: string;
  done: boolean;
};

export function launchChecklist(): ChecklistItem[] {
  const entity = siteConfig.legalEntity.length > 0;
  const address = siteConfig.businessAddress.length > 0;
  const effective = siteConfig.privacyEffectiveDate.length > 0;
  return [
    {
      id: "legal-entity",
      area: "Legal",
      detail: "Put the operating company’s legal name in legalEntity. The site currently shows “JOTA” because no entity is set.",
      done: entity,
    },
    {
      id: "address",
      area: "Contact",
      detail: "Add a business mailing address in businessAddress.",
      done: address,
    },
    {
      id: "support-mail",
      area: "Contact",
      detail: `Confirm ${siteConfig.supportEmail} is a real mailbox that someone reads. It is the support address configured for the iOS app. Do not publish a different address until you change both.`,
      done: confirmed.supportMailboxReceivesMail,
    },
    {
      id: "effective-date",
      area: "Legal",
      detail: "Set privacyEffectiveDate when the privacy policy is approved. Until then the page is labeled a draft.",
      done: effective,
    },
    {
      id: "legal-review",
      area: "Legal",
      detail: "Have counsel review the privacy policy and terms before App Store submission. Flip confirmed.legalReviewComplete afterward.",
      done: confirmed.legalReviewComplete,
    },
    {
      id: "governing-law",
      area: "Legal",
      detail: "Choose governing law and a dispute process. The terms intentionally leave this blank.",
      done: confirmed.governingLawDecided,
    },
    {
      id: "domain",
      area: "Launch",
      detail: "https://jhota.vercel.app is the API. This marketing site needs its own host. jota.app is not connected to either.",
      done: confirmed.domainOwnedAndDeployed,
    },
    {
      id: "app-store",
      area: "Launch",
      detail: "Add the real App Store URL. Until then the main button emails support instead of linking to a store listing.",
      done: siteConfig.appStoreUrl.length > 0,
    },
    {
      id: "testflight",
      area: "Launch",
      detail: "Add a TestFlight invite URL if the beta should be a link rather than an email.",
      done: siteConfig.testFlightUrl.length > 0,
    },
    {
      id: "instagram",
      area: "Brand",
      detail: "Add the Instagram URL. The footer hides the link until it is set.",
      done: siteConfig.instagramUrl.length > 0,
    },
    {
      id: "tiktok",
      area: "Brand",
      detail: "Add the TikTok URL. The footer hides the link until it is set.",
      done: siteConfig.tiktokUrl.length > 0,
    },
    {
      id: "photos",
      area: "Brand",
      detail: "Food photos are stock images from Unsplash, cropped and captioned for what is actually in the frame. Replace them with commissioned photography before a major launch if you want exclusive images.",
      done: confirmed.commissionedPhotography,
    },
    {
      id: "openai",
      area: "Privacy",
      detail:
        "Decide OpenAI retention and training. The API sends a short-lived signed photo URL to https://api.openai.com/v1/responses. The code does not set a zero-retention header. Do not claim OpenAI cannot train on or store images until the OpenAI account settings say so.",
      done: confirmed.openaiRetentionDecided,
    },
    {
      id: "photo-retention",
      area: "Privacy",
      detail:
        "Choose how long meal photos and ai_photo_analyses rows are kept. Nothing in the schema expires them. Removing a meal in the app soft-deletes the log and does not delete the storage object.",
      done: confirmed.photoRetentionPeriodDecided,
    },
    {
      id: "storage-delete",
      area: "Account deletion",
      detail:
        "Database rows that reference auth.users cascade when that user is deleted. beta_feedback keeps the message and only nulls user_id. No trigger deletes objects in the meal-photos bucket. Confirm storage cleanup before promising that photos are erased.",
      done: confirmed.storageRemovedWithAccount,
    },
    {
      id: "in-app-delete",
      area: "Account deletion",
      detail:
        "Ship a real in-app deletion flow, or document an operator process and staff it. The app creates an account on install and there is no delete-account control. Apple expects apps with account creation to offer deletion. This website does not fake a delete button.",
      done: confirmed.inAppDeletionShipped,
    },
    {
      id: "sale",
      area: "Privacy",
      detail:
        "Decide the “sale” and “sharing” position for your privacy law. The app has no advertising SDK. That is not the same as a reviewed statement that JOTA does not sell personal information.",
      done: confirmed.dataSalePositionDecided,
    },
    {
      id: "children",
      area: "Privacy",
      detail: "Set a minimum age and a children’s privacy position. The app has no age gate.",
      done: confirmed.childrenPolicyDecided,
    },
    {
      id: "region",
      area: "Privacy",
      detail: "Record where Supabase, Vercel, OpenAI, and PostHog store data, and whether that is cross-border for your users.",
      done: confirmed.dataRegionDecided,
    },
    {
      id: "encryption",
      area: "Privacy",
      detail:
        "Only claim encryption you have verified. The site states that the API base URL is HTTPS and that meal photos sit in a private bucket. It does not claim encryption at rest.",
      done: confirmed.encryptionClaimDecided,
    },
    {
      id: "notice",
      area: "Privacy",
      detail: "Decide how people will be told when the privacy policy or terms change. Updating this page is the only mechanism described.",
      done: confirmed.policyChangeNoticeDecided,
    },
    {
      id: "price",
      area: "Subscription",
      detail:
        "Enter the live price only if you want it repeated on the website. The app reads price and trial length from the App Store offering, and the example env ships with the paywall off.",
      done: siteConfig.subscription.price.length > 0 || confirmed.subscriptionProductsLive,
    },
    {
      id: "trial",
      area: "Subscription",
      detail: "Confirm the seven-day introductory offer is attached to the live monthly and annual products in App Store Connect and RevenueCat.",
      done: confirmed.trialAttachedToProducts,
    },
    {
      id: "subscription-live",
      area: "Subscription",
      detail: "Confirm whether the shipped app is charging yet. PAYWALL_ENABLED is false in apps/mobile/.env.example, so the paywall is not on in that configuration.",
      done: confirmed.subscriptionProductsLive,
    },
    {
      id: "posthog",
      area: "Privacy",
      detail:
        "Review the PostHog project, region, and retention. Analytics are sent only when POSTHOG_API_KEY is set. Event properties are written to exclude photo contents, food names, and typed meal notes. The distinct id is the Supabase user id.",
      done: confirmed.posthogAccountReviewed,
    },
    {
      id: "revenuecat",
      area: "Privacy",
      detail:
        "Review what RevenueCat stores when the paywall is enabled. Subscription status is written into Supabase by the RevenueCat webhook. With the paywall off, the app does not configure RevenueCat.",
      done: confirmed.revenueCatReviewed,
    },
  ];
}
