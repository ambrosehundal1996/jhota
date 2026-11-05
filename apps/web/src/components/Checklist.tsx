import { launchChecklist, type ChecklistItem } from "@/config/site";

export function Checklist({
  areas,
}: {
  areas?: ChecklistItem["area"][];
}) {
  const items = launchChecklist().filter((item) => !areas || areas.includes(item.area));
  const open = items.filter((item) => !item.done);
  return (
    <section id="review" aria-labelledby="review-title">
      <h2 id="review-title">Developer review checklist</h2>
      <p>
        {open.length} item{open.length === 1 ? "" : "s"} still need a person to confirm them. Nothing in this list is
        claimed as settled in the text above.
      </p>
      <ul className="checklist">
        {items.map((item) => (
          <li key={item.id} className={item.done ? "is-done" : undefined}>
            <span className="check-label">
              {item.done ? "Confirmed" : "Open"} · {item.area}
            </span>
            <p>{item.detail}</p>
          </li>
        ))}
      </ul>
    </section>
  );
}
