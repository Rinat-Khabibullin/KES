import {
  BadgeCheck,
  CalendarClock,
  Camera,
  FileCheck2,
  HandCoins,
  SearchCheck,
  ShieldCheck,
  Sparkles,
} from "lucide-react";
import { benefits } from "../../data/benefits";

const icons = [Sparkles, SearchCheck, ShieldCheck, BadgeCheck, HandCoins, FileCheck2, CalendarClock, Camera];

function Benefits() {
  return (
    <section className="section section--compact" aria-labelledby="benefits-title">
      <div className="container">
        <div className="section-heading section-heading--center">
          <p className="eyebrow">Почему доверяют</p>
          <h2 id="benefits-title">Сначала помогаем понять задачу, потом аккуратно делаем монтаж</h2>
        </div>
        <div className="benefit-grid">
          {benefits.map((benefit, index) => {
            const Icon = icons[index];

            return (
            <article className="benefit-card" key={benefit.title}>
              <span className="benefit-card__icon" aria-hidden="true">
                <Icon size={22} />
              </span>
              <h3>{benefit.title}</h3>
              <p>{benefit.text}</p>
            </article>
            );
          })}
        </div>
      </div>
    </section>
  );
}

export default Benefits;
