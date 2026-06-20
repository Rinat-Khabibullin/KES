import { PhoneCall } from "lucide-react";
import { brandCaption, brandName, phoneHref } from "../../data/site";
import BrandMark from "../BrandMark/BrandMark";

const navItems = [
  { href: "#services", label: "Услуги" },
  { href: "#works", label: "Работы" },
  { href: "#prices", label: "Цены" },
  { href: "#process", label: "Как работаем" },
  { href: "#partners", label: "Партнерам" },
  { href: "#areas", label: "География" },
  { href: "#contacts", label: "Контакты" },
];

function Header() {
  return (
    <header className="site-header">
      <div className="container site-header__inner">
        <a href="#top" className="logo" aria-label={`${brandName}, ${brandCaption}`}>
          <span className="logo__mark" aria-hidden="true">
            <BrandMark />
          </span>
          <span className="logo__text">
            <strong>{brandName}</strong>
            <small>{brandCaption}</small>
          </span>
        </a>
        <nav className="site-nav" aria-label="Основная навигация">
          {navItems.map((item) => (
            <a key={item.href} href={item.href}>
              {item.label}
            </a>
          ))}
        </nav>
        <a className="button button--small button--primary" href={phoneHref}>
          <PhoneCall size={17} />
          Консультация бесплатно
        </a>
      </div>
    </header>
  );
}

export default Header;
