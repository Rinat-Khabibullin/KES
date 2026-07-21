import { ArrowUpRight, Camera, PhoneCall, Sparkles } from "lucide-react";
import { avitoUrl, phoneDisplay, phoneHref } from "../../data/site";
import { trackAvitoClick } from "../../utils/metrika";

function Contact() {
  return (
    <section className="section contact-section" id="contacts" aria-labelledby="contacts-title">
      <div className="container contact-card">
        <div>
          <p className="eyebrow">Контакты</p>
          <h2 id="contacts-title">Нужен электрик в Туапсе? Начните с бесплатной консультации</h2>
          <p>
            Позвоните нам или откройте объявление на Авито. Не стесняйтесь, если не знаете точное
            название проблемы: можно отправить фото, голосом описать ситуацию и получить понятный
            ориентир по работам.
          </p>
          <div className="contact-card__badge">
            <Sparkles size={18} />
            консультация по телефону и фото бесплатно
          </div>
        </div>
        <div className="contact-card__actions">
          <a className="button button--primary" href={phoneHref}>
            <PhoneCall size={19} />
            Позвонить: {phoneDisplay}
          </a>
          <a
            className="button button--ghost"
            href={avitoUrl}
            target="_blank"
            rel="noopener noreferrer"
            onClick={trackAvitoClick}
          >
            <ArrowUpRight size={19} />
            Открыть Авито
          </a>
          <a className="button button--quiet" href="#photo-estimate">
            <Camera size={19} />
            Оценить по фото
          </a>
        </div>
      </div>
    </section>
  );
}

export default Contact;
