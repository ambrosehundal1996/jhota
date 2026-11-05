import { downloadAction } from "@/config/site";

export function DownloadCta({
  variant = "primary",
  showNote = false,
  size = "default",
}: {
  variant?: "primary" | "lime" | "line";
  showNote?: boolean;
  size?: "default" | "small";
}) {
  const action = downloadAction();
  return (
    <div className="cta-block">
      <a
        className={`btn btn-${variant}${size === "small" ? " btn-small" : ""}`}
        href={action.href}
        {...(action.external ? { target: "_blank", rel: "noreferrer" } : {})}
      >
        {action.label}
      </a>
      {showNote && action.note ? <p className="cta-note">{action.note}</p> : null}
    </div>
  );
}
