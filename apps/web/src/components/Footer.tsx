import Link from "next/link";
import { copyrightHolder, siteConfig } from "@/config/site";

const links = [
  { href: "/", label: "Home" },
  { href: "/privacy", label: "Privacy Policy" },
  { href: "/support", label: "Support" },
  { href: "/terms", label: "Terms of Use" },
  { href: "/delete-account", label: "Delete Account" },
];

export function Footer() {
  const socials = [
    siteConfig.instagramUrl ? { href: siteConfig.instagramUrl, label: "Instagram" } : null,
    siteConfig.tiktokUrl ? { href: siteConfig.tiktokUrl, label: "TikTok" } : null,
  ].filter((item): item is { href: string; label: string } => item !== null);
  const year = new Date().getFullYear();

  return (
    <footer className="site-footer">
      <div className="wrap footer-grid">
        <div className="footer-brand">
          <Link href="/" className="wordmark">
            JOTA
          </Link>
          <p>Hit your protein goals. Without the hassle.</p>
        </div>
        <nav className="footer-nav" aria-label="Footer">
          {links.map((link) => (
            <Link key={link.href} href={link.href}>
              {link.label}
            </Link>
          ))}
        </nav>
        {socials.length > 0 ? (
          <div className="footer-social">
            {socials.map((item) => (
              <a key={item.href} href={item.href} target="_blank" rel="noreferrer">
                {item.label}
              </a>
            ))}
          </div>
        ) : (
          <div />
        )}
      </div>
      <div className="wrap">
        <p className="copyright">
          © {year} {copyrightHolder()}
        </p>
      </div>
    </footer>
  );
}
