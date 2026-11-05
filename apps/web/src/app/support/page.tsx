import type { Metadata } from "next";
import { SupportFaq } from "@/components/SupportFaq";
import { siteConfig, supportMailto } from "@/config/site";

export const metadata: Metadata = {
  title: "Support",
  description: "Get help with JOTA. Questions about photo estimates, protein goals, subscriptions, and account deletion.",
  alternates: { canonical: "/support" },
};

export default function SupportPage() {
  return (
    <article className="wrap legal">
      <p className="eyebrow">Support</p>
      <h1>We’re here to help.</h1>
      <p className="lede">Questions, feedback, or something not working? We’d love to hear from you.</p>
      <div className="contact-card">
        <p className="eyebrow">Email</p>
        <h2 className="app-title" style={{ fontSize: "2rem" }}>
          {siteConfig.supportEmail}
        </h2>
        <p>A small team reads this inbox. Write the way you would to a person.</p>
        <a className="btn btn-primary" href={supportMailto("JOTA support")}>
          Email support
        </a>
      </div>
      <h2 className="section-title" style={{ marginTop: "3.5rem", fontSize: "clamp(2rem, 4vw, 3rem)" }}>
        Common questions
      </h2>
      <SupportFaq />
      <div className="help-close">
        <h2 className="section-title" style={{ fontSize: "clamp(2rem, 4vw, 3.2rem)" }}>
          Still need help?
        </h2>
        <p className="section-copy">Reach out directly. We’re a small team building JOTA with real user feedback.</p>
        <div className="cta-row">
          <a className="btn btn-primary" href={supportMailto("JOTA support")}>
            Email support
          </a>
        </div>
      </div>
    </article>
  );
}
