import type { Metadata } from "next";
import Image from "next/image";
import { DownloadCta } from "@/components/DownloadCta";
import { ReviewPhone, TodayPhone } from "@/components/ProductFrames";
import { RangeBar } from "@/components/RangeBar";

export const metadata: Metadata = {
  alternates: { canonical: "/" },
};

const meals = [
  {
    src: "/photos/bowl.jpg",
    alt: "A bowl of eggs, tofu, edamame, tomatoes, and greens",
    label: "Eggs, tofu, and edamame",
    className: "meal-a shot-tall",
    position: "center",
  },
  {
    src: "/photos/yogurt.jpg",
    alt: "Jars of yogurt topped with strawberries",
    label: "Yogurt and strawberries",
    className: "meal-b",
    position: "center 40%",
  },
  {
    src: "/photos/sandwich.jpg",
    alt: "A turkey and vegetable sandwich on seeded bread",
    label: "Turkey sandwich",
    className: "meal-c",
    position: "center",
  },
  {
    src: "/photos/chicken.jpg",
    alt: "Grilled chicken with vegetables and lemon",
    label: "Grilled chicken",
    className: "meal-d",
    position: "center",
  },
];

const pains = [
  ["01", "Too much manual entry", "Searching for every ingredient gets old fast."],
  ["02", "Constant mental math", "Trying to remember how much protein you’ve eaten shouldn’t be a daily chore."],
  ["03", "All-or-nothing goals", "Missing one perfect number shouldn’t make the whole day feel like a failure."],
];

const bits = [
  ["01", "Quick logging", "Already know your protein? Add it without the extra steps."],
  ["02", "Daily progress", "Your protein goal stays easy to see."],
  ["03", "Adjustable goals", "Change your range when your needs change."],
  ["04", "Gentle reminders", "A helpful nudge to stay consistent."],
  ["05", "Lock screen widget", "Keep your progress close, even without opening the app."],
];

export default function HomePage() {
  return (
    <>
      <section className="wrap hero">
        <h1 className="display">
          <span>Hit your</span>
          <span>protein goals.</span>
          <span>
            Without the <em>hassle.</em>
          </span>
        </h1>
        <div className="hero-copy">
          <p className="lede">Track your protein in seconds. Build consistency around a goal that works for you.</p>
          <div className="cta-row">
            <DownloadCta showNote />
            <a className="btn btn-line" href="#how">
              See how it works
            </a>
          </div>
        </div>
        <div className="hero-stage">
          <div className="lime-disc" aria-hidden="true" />
          <figure className="hero-photo">
            <Image
              src="/photos/avocado-eggs.jpg"
              alt="A fried egg on avocado toast, in soft natural light"
              fill
              priority
              sizes="(max-width: 980px) 100vw, 46vw"
              style={{ objectFit: "cover", objectPosition: "center" }}
            />
          </figure>
          <div className="hero-phone">
            <TodayPhone />
          </div>
        </div>
      </section>
      <p className="wrap figure-caption" style={{ marginTop: "-1rem" }}>
        A rendering of the Jota today screen. The grams are an example.
      </p>

      <section className="wrap section rise">
        <h2 className="section-title">
          <span>Protein tracking</span>
          <span>shouldn’t feel</span>
          <span>like homework.</span>
        </h2>
        <p className="section-copy">
          You already have enough to think about. Logging every ingredient, searching endless food databases, and doing
          mental math shouldn’t be part of your routine.
        </p>
        <div className="pains">
          {pains.map(([index, title, copy]) => (
            <article className="pain" key={index}>
              <p className="pain-index">{index}</p>
              <h3>{title}</h3>
              <p>{copy}</p>
            </article>
          ))}
        </div>
      </section>

      <section id="how" className="wrap section rise">
        <div className="split">
          <div className="feature-copy">
            <p className="eyebrow">Less logging. More living.</p>
            <h2>Snap it. Log it.</h2>
            <p>Take a photo of your meal and let JOTA estimate the protein. No endless ingredient searches.</p>
            <p className="feature-note">
              The number is an estimate. You review it, and you can change it, before it is logged.
            </p>
          </div>
          <div className="feature-stage">
            <figure className="shot feature-shot">
              <Image
                src="/photos/salmon-toast.jpg"
                alt="Salmon with spinach and a cream sauce on a white plate"
                fill
                sizes="(max-width: 900px) 100vw, 50vw"
                style={{ objectFit: "cover" }}
              />
            </figure>
            <div className="feature-phone">
              <ReviewPhone />
            </div>
          </div>
        </div>
        <p className="figure-caption">A rendering of the review screen, using example portions. Not a lab measurement.</p>
      </section>

      <section className="band">
        <div className="wrap progress-layout" style={{ padding: "clamp(4.5rem, 9vw, 7.5rem) 0" }}>
          <div className="feature-copy">
            <h2>
              Know where
              <br />
              you stand.
            </h2>
            <p>See your daily protein progress without having to remember every meal or calculate the numbers yourself.</p>
          </div>
          <figure className="progress-figure">
            <p className="progress-kicker">Protein consumed today</p>
            <p className="grams">
              118<span>g</span>
            </p>
            <p className="progress-meta">Your daily range: 110–130g</p>
            <RangeBar total={118} min={110} max={130} labels />
            <p className="progress-status">You’re in your protein range.</p>
            <figcaption className="figure-caption">
              Example of the daily progress view. Reaching the low end of the range counts.
            </figcaption>
          </figure>
        </div>
      </section>

      <section className="wrap section rise">
        <div className="feature-copy">
          <h2 className="wide">Your goal is a range. Not a rigid number.</h2>
          <p className="section-copy">Work toward a personalized daily protein range that you can adjust as your routine changes.</p>
        </div>
        <div className="range-panel">
          <div>
            <p className="grams">
              142<span>g</span>
            </p>
            <p className="progress-meta">Today, with a range of 110–130g</p>
            <RangeBar total={142} min={110} max={130} labels />
          </div>
          <div className="range-callouts">
            <p>
              <strong>Goal reached.</strong>
              <span className="range-aside">Hitting 110g is the success line. The shaded band is your range.</span>
            </p>
            <p>
              <strong>Past 130g still counts.</strong>
              <span className="range-aside">Going over the top of the range is not a miss. The day still counts.</span>
            </p>
          </div>
        </div>
      </section>

      <section className="wrap section rise">
        <h2 className="section-title">
          <span>Your routine.</span>
          <span>Your protein.</span>
        </h2>
        <p className="section-copy">
          Whether you’re building muscle, losing fat, or simply trying to eat more protein, JOTA makes consistency
          easier.
        </p>
        <div className="meals">
          {meals.map((meal) => (
            <figure className={`shot ${meal.className}`} key={meal.src}>
              <Image
                src={meal.src}
                alt={meal.alt}
                fill
                sizes="(max-width: 860px) 100vw, 40vw"
                style={{ objectFit: "cover", objectPosition: meal.position }}
              />
              <figcaption>{meal.label}</figcaption>
            </figure>
          ))}
        </div>
      </section>

      <section className="wrap section rise">
        <h2 className="section-title">
          <span>Small features.</span>
          <span>Big difference.</span>
        </h2>
        <div className="bits">
          {bits.map(([index, title, copy]) => (
            <article className="bit" key={index}>
              <p className="bit-index">{index}</p>
              <h3>{title}</h3>
              <p>{copy}</p>
            </article>
          ))}
        </div>
      </section>

      <section className="band">
        <div className="wrap final-grid">
          <div>
            <h2>Protein tracking, simplified.</h2>
            <p className="section-copy">Spend less time tracking. More time making progress.</p>
            <div className="cta-row">
              <DownloadCta variant="lime" showNote />
            </div>
          </div>
          <figure className="final-photo">
            <Image
              src="/photos/roast.jpg"
              alt="A roast chicken in a skillet on a wooden table"
              fill
              sizes="(max-width: 900px) 100vw, 440px"
              style={{ objectFit: "cover", objectPosition: "center 40%" }}
            />
          </figure>
        </div>
      </section>
    </>
  );
}
