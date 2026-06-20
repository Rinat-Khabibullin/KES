import { Cable, Flame, Lightbulb, PanelsTopLeft, PlugZap } from "lucide-react";
import { serviceCategories } from "../../data/services";

const serviceIcons = [Flame, Cable, PanelsTopLeft, Lightbulb, PlugZap];

function Services() {
  return (
    <section className="section" id="services" aria-labelledby="services-title">
      <div className="container">
        <div className="section-heading section-heading--wide">
          <p className="eyebrow">Услуги</p>
          <h2 id="services-title">От срочного ремонта до полной разводки электрики</h2>
          <p>
            Не стесняйтесь звонить с небольшой проблемой: подскажем по телефону, оценим по фото и
            честно скажем, нужен ли выезд.
          </p>
        </div>
        <div className="service-grid">
          {serviceCategories.map((category, index) => {
            const Icon = serviceIcons[index];

            return (
            <article className="service-card" key={category.title}>
              <div className="service-card__header">
                <span className="service-card__spark" aria-hidden="true">
                  <Icon size={23} />
                </span>
                <h3>{category.title}</h3>
              </div>
              <p>{category.note}</p>
              <ul>
                {category.items.map((item) => (
                  <li key={item}>{item}</li>
                ))}
              </ul>
            </article>
            );
          })}
        </div>
      </div>
    </section>
  );
}

export default Services;
