import Link from "next/link";

export default function NotFound() {
  return (
    <section className="wrap not-found">
      <p className="eyebrow">404</p>
      <h1>This page isn’t on the menu.</h1>
      <p>The link may be old, or the page may have moved. The rest of JOTA is still here.</p>
      <div className="cta-row">
        <Link className="btn btn-primary" href="/">
          Back home
        </Link>
        <Link className="btn btn-line" href="/support">
          Support
        </Link>
      </div>
    </section>
  );
}
