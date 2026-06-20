import { Camera, PhoneCall, Sparkles } from "lucide-react";
import { priceGroups } from "../../data/prices";
import { phoneHref } from "../../data/site";

function Prices() {
  return (
    <section className="section" id="prices" aria-labelledby="prices-title">
      <div className="container">
        <div className="section-heading section-heading--wide">
          <p className="eyebrow">Цены</p>
          <h2 id="prices-title">Цены «от» и понятный ориентир до выезда</h2>
          <p>
            Точная стоимость зависит от объема работ, состояния проводки, доступа к месту монтажа и
            материалов. Предварительно можем оценить по фото.
          </p>
        </div>
        <div className="price-note">
          <div>
            <Sparkles size={22} />
            <strong>Консультация бесплатно</strong>
            <span>Опишите задачу своими словами или отправьте фото щита, розетки, трассы.</span>
          </div>
          <a className="button button--primary button--small" href={phoneHref}>
            <PhoneCall size={17} />
            Позвонить нам
          </a>
          <a className="button button--quiet button--small" href="#works">
            <Camera size={17} />
            Оценить по фото
          </a>
        </div>
        <div className="price-grid">
          {priceGroups.map((group) => (
            <article className="price-card" key={group.title}>
              <h3>{group.title}</h3>
              <ul>
                {group.items.map((item) => (
                  <li key={item.name}>
                    <span>{item.name}</span>
                    <strong>{item.price}</strong>
                  </li>
                ))}
              </ul>
            </article>
          ))}
        </div>
      </div>
    </section>
  );
}

export default Prices;
