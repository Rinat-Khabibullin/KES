import { Calculator, Camera, MessageCircle, PhoneCall, Sparkles } from "lucide-react";
import { Link } from "react-router-dom";
import { landingPriceLegacyNumbers } from "../../data/prices";
import { phoneHref } from "../../data/site";
import { getServiceByLegacyNumber } from "../../shared/estimate/catalog";
import { formatPrice, unitPriceLabels } from "../../shared/estimate/format";

const landingPrices = landingPriceLegacyNumbers
  .map((legacyNumber) => getServiceByLegacyNumber(legacyNumber))
  .filter((service): service is NonNullable<typeof service> => Boolean(service));

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
          <a className="button button--quiet button--small" href="#photo-estimate">
            <Camera size={17} />
            Оценить по фото
          </a>
        </div>
        <div className="price-landing">
          <div className="price-strip" aria-label="Популярные расценки">
            {landingPrices.map((service) => (
              <article className="price-strip-card" key={service.id}>
                <span>№{service.legacyNumber}</span>
                <h3>{service.name}</h3>
                <strong>
                  {formatPrice(service.price)} {unitPriceLabels[service.unit]}
                </strong>
              </article>
            ))}
          </div>
          <aside className="price-cta-panel">
            <Calculator size={28} />
            <h3>Нужна смета по нескольким работам?</h3>
            <p>
              Откройте отдельный калькулятор: там поиск по каталогу, метраж, мастер новой
              электроточки и передача расчёта в чат.
            </p>
            <div className="price-cta-panel__actions">
              <Link className="button button--primary" to="/calculator">
                <Calculator size={18} />
                Рассчитать смету
              </Link>
              <button
                className="button button--ghost"
                type="button"
                onClick={() => window.dispatchEvent(new CustomEvent("chat:open"))}
              >
                <MessageCircle size={18} />
                Задать вопрос
              </button>
            </div>
          </aside>
        </div>
      </div>
    </section>
  );
}

export default Prices;
