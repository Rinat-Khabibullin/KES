import {
  ArrowUpRight,
  BadgeCheck,
  Camera,
  Clock,
  FileCheck2,
  PhoneCall,
  ShieldCheck,
  Sparkles,
  UsersRound,
  Zap,
} from "lucide-react";
import { avitoUrl, phoneHref } from "../../data/site";
import { publicAsset } from "../../utils/assets";

const badges = [
  { icon: ShieldCheck, text: "договор и гарантия" },
  { icon: UsersRound, text: "2–4 мастера на объекте" },
  { icon: Clock, text: "ежедневно 09:00–22:00" },
  { icon: BadgeCheck, text: "10+ лет практики" },
];

function Hero() {
  return (
    <section className="hero section" id="top" aria-labelledby="hero-title">
      <div className="hero__cables" aria-hidden="true">
        <span />
        <span />
        <span />
      </div>
      <div className="container hero__grid">
        <div className="hero__content">
          <p className="hero__kicker">
            <Sparkles size={18} />
            Бесплатная консультация по телефону и фото
          </p>
          <h1 id="hero-title">
            Электрик в Туапсе: щиты, проводка, свет и ремонт без хаоса
          </h1>
          <p className="hero__lead">
            Команда Михаила делает электромонтаж в квартирах, домах, офисах, кафе, автомойках и на
            открытых территориях. Поможем разобраться в задаче, оценим по фото, согласуем материалы
            и аккуратно доведем работу до проверки.
          </p>
          <div className="hero__actions">
            <a className="button button--primary" href={phoneHref}>
              <PhoneCall size={19} />
              Получить бесплатную консультацию
            </a>
            <a className="button button--ghost" href={avitoUrl} target="_blank" rel="noopener noreferrer">
              <ArrowUpRight size={19} />
              Профиль на Авито
            </a>
            <a className="button button--quiet" href="#works">
              <Camera size={19} />
              Оценить по фото
            </a>
          </div>
          <ul className="badge-list" aria-label="Ключевые преимущества">
            {badges.map((badge) => (
              <li key={badge.text}>
                <badge.icon size={17} />
                {badge.text}
              </li>
            ))}
          </ul>
        </div>
        <aside className="hero-showcase" aria-label="Примеры электромонтажных работ">
          <div className="hero-showcase__main">
            <img
              src={publicAsset("works/work-06.jpg")}
              alt="Собранный электрощит с автоматикой и реле напряжения"
            />
            <div className="hero-showcase__label">
              <Zap size={18} />
              <span>щит с защитой линий</span>
            </div>
          </div>
          <div className="hero-showcase__stack">
            <div className="hero-mini hero-mini--blue">
              <strong>от 1000 ₽</strong>
              <span>минимальный заказ</span>
            </div>
            <div className="hero-mini hero-mini--amber">
              <FileCheck2 size={23} />
              <span>работа по договору</span>
            </div>
          </div>
          <div className="hero-showcase__photos">
            <img src={publicAsset("works/work-07.jpg")} alt="Монтаж освещения на открытой территории" />
            <img src={publicAsset("works/work-08.jpg")} alt="LED-подсветка мебели и рабочих зон" />
          </div>
        </aside>
      </div>
      <div className="hero-ribbon" aria-hidden="true">
        <span>розетки</span>
        <span>электрощиты</span>
        <span>теплый пол</span>
        <span>фасадный свет</span>
        <span>аварийный ремонт</span>
        <span>проводка</span>
      </div>
    </section>
  );
}

export default Hero;
