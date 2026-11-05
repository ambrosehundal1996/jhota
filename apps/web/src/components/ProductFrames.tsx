import Image from "next/image";
import type { ReactNode } from "react";
import { RangeBar } from "@/components/RangeBar";

function Phone({ children }: { children: ReactNode }) {
  return (
    <div className="phone" aria-hidden="true">
      <div className="phone-screen">
        <div className="island" />
        {children}
      </div>
    </div>
  );
}

export function TodayPhone() {
  return (
    <Phone>
      <p className="app-kicker">Daily protein</p>
      <p className="app-title">Today</p>
      <div className="today-card">
        <p className="today-total">
          86<span>g</span>
        </p>
        <p>Protein consumed today</p>
        <p>Your daily range: 110–130g</p>
        <RangeBar total={86} min={110} max={130} />
        <p className="today-status">24g until you reach your goal.</p>
      </div>
      <div className="log-button">+</div>
    </Phone>
  );
}

export function ReviewPhone() {
  return (
    <Phone>
      <p className="app-kicker">Review estimate</p>
      <p className="app-title">Log a meal</p>
      <div className="review-photo">
        <Image src="/photos/salmon-toast.jpg" alt="" fill sizes="250px" style={{ objectFit: "cover" }} />
      </div>
      <p className="estimate-label">Your protein estimate is ready.</p>
      <p className="estimate-total">
        ~32<span>g</span>
      </p>
      <p className="fine">Estimated from your meal · Medium confidence</p>
      <ul className="item-list">
        <li>
          <span>Salmon</span>
          <span>26g</span>
        </li>
        <li>
          <span>Spinach</span>
          <span>2g</span>
        </li>
        <li>
          <span>Cream sauce</span>
          <span>4g</span>
        </li>
      </ul>
      <p className="fine" style={{ marginTop: "0.65rem" }}>
        AI estimates can be off. Adjust anything that doesn’t look right before adding.
      </p>
    </Phone>
  );
}
