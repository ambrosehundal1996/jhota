"use client";

import { useState, type ReactNode } from "react";

export type Faq = { question: string; answer: ReactNode };

export function FaqList({ items }: { items: Faq[] }) {
  const [open, setOpen] = useState<number | null>(0);

  return (
    <div className="faq">
      {items.map((item, index) => {
        const expanded = open === index;
        const panelId = `faq-panel-${index}`;
        const buttonId = `faq-button-${index}`;
        return (
          <div className="faq-item" key={item.question}>
            <h3>
              <button
                id={buttonId}
                type="button"
                aria-expanded={expanded}
                aria-controls={panelId}
                onClick={() => setOpen(expanded ? null : index)}
              >
                <span>{item.question}</span>
                <span aria-hidden="true">{expanded ? "–" : "+"}</span>
              </button>
            </h3>
            {expanded ? (
              <div className="answer" id={panelId} role="region" aria-labelledby={buttonId}>
                {item.answer}
              </div>
            ) : null}
          </div>
        );
      })}
    </div>
  );
}
