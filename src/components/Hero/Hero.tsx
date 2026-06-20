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

const quickTrust = [
  "подскажем, опасно ли включать линию",
  "оценим фото щита или места монтажа",
  "согласуем материалы до закупки",
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
            Электрик в Туапсе: щиты, проводка, свет и ремонт с бесплатной консультацией
          </h1>
          <p className="hero__lead">
            Команда электриков делает электромонтаж в квартирах, домах, офисах, кафе, автомойках и на
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
            <a className="button button--quiet" href="#photo-estimate">
              <Camera size={19} />
              Оценить по фото
            </a>
          </div>
          <div className="hero__assist">
            <strong>Если задача непонятна — это нормально.</strong>
            <ul>
              {quickTrust.map((item) => (
                <li key={item}>{item}</li>
              ))}
            </ul>
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
              width="360"
              height="480"
              decoding="async"
              fetchPriority="high"
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
            <img
              src={publicAsset("works/work-07.jpg")}
              alt="Монтаж освещения на открытой территории"
              width="640"
              height="288"
              loading="lazy"
              decoding="async"
            />
            <img
              src={publicAsset("works/work-08.jpg")}
              alt="LED-подсветка мебели и рабочих зон"
              width="360"
              height="480"
              loading="lazy"
              decoding="async"
            />
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
