import { Handshake, Megaphone, ShieldCheck, UsersRound } from "lucide-react";
import { partnerAudiences, partnerProofs } from "../../data/partners";

const audienceIcons = [ShieldCheck, Megaphone, Handshake, UsersRound];

function Partners() {
  return (
    <section className="section partner-section" id="partners" aria-labelledby="partners-title">
      <div className="container partners">
        <div className="partner-hero">
          <p className="eyebrow">Партнерства и рекомендации</p>
          <h2 id="partners-title">Сотрудничаем с мастерами, которым нужен надежный электрик на объект</h2>
          <p>
            Если вы занимаетесь плиткой, потолками, сантехникой, отделкой или ведете ремонтные
            объекты, можно договориться о взаимных рекомендациях, рекламе и выездах к вашим
            клиентам. Мы давно работаем по Туапсе и району: нас знают по объектам,
            рекомендациям и аккуратному отношению к чужой работе.
          </p>
          <a className="button button--ghost" href="#contacts">
            Обсудить сотрудничество
          </a>
        </div>
        <div className="partner-grid">
          {partnerAudiences.map((audience, index) => {
            const Icon = audienceIcons[index];

            return (
              <article className="partner-card" key={audience.title}>
                <span aria-hidden="true">
                  <Icon size={23} />
                </span>
                <h3>{audience.title}</h3>
                <p>{audience.text}</p>
              </article>
            );
          })}
        </div>
        <div className="partner-proof" aria-label="Почему с нами удобно сотрудничать">
          {partnerProofs.map((proof) => (
            <span key={proof}>{proof}</span>
          ))}
        </div>
      </div>
    </section>
  );
}

export default Partners;
