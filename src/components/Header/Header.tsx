import { Menu, PhoneCall, X } from "lucide-react";
import { useEffect, useRef, useState } from "react";
import { Link, useLocation } from "react-router-dom";
import { avitoUrl, brandCaption, brandName, phoneHref } from "../../data/site";
import { loadCalculatorPage } from "../../routes/lazyRoutes";
import BrandMark from "../BrandMark/BrandMark";

type NavItem = { hash: string; label: string; to?: never } | { to: string; label: string; hash?: never };

const navItems: NavItem[] = [
  { hash: "services", label: "Услуги" },
  { hash: "works", label: "Работы" },
  { hash: "prices", label: "Цены" },
  { to: "/calculator", label: "Калькулятор" },
  { hash: "contacts", label: "Контакты" },
];

function Header() {
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const location = useLocation();
  const panelRef = useRef<HTMLDivElement>(null);
  const menuButtonRef = useRef<HTMLButtonElement>(null);

  useEffect(() => {
    document.body.classList.toggle("is-nav-open", isMenuOpen);
    return () => document.body.classList.remove("is-nav-open");
  }, [isMenuOpen]);

  useEffect(() => {
    setIsMenuOpen(false);
  }, [location.pathname, location.hash]);

  useEffect(() => {
    if (!isMenuOpen) {
      return undefined;
    }

    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        setIsMenuOpen(false);
        menuButtonRef.current?.focus();
      }
    };

    const handlePointerDown = (event: PointerEvent) => {
      const target = event.target as Node;
      if (panelRef.current?.contains(target) || menuButtonRef.current?.contains(target)) {
        return;
      }

      setIsMenuOpen(false);
    };

    document.addEventListener("keydown", handleKeyDown);
    document.addEventListener("pointerdown", handlePointerDown);
    return () => {
      document.removeEventListener("keydown", handleKeyDown);
      document.removeEventListener("pointerdown", handlePointerDown);
    };
  }, [isMenuOpen]);

  const getNavTarget = (item: NavItem) => {
    if (item.to) {
      return item.to;
    }

    return location.pathname === "/" ? `#${item.hash}` : `/#${item.hash}`;
  };

  const preloadRoute = (item: NavItem) => {
    if (item.to === "/calculator") {
      void loadCalculatorPage();
    }
  };

  return (
    <header className="site-header">
      <div className="container site-header__inner">
        <Link to="/" className="logo" aria-label={`${brandName}, ${brandCaption}`}>
          <span className="logo__mark" aria-hidden="true">
            <BrandMark />
          </span>
          <span className="logo__text">
            <strong>{brandName}</strong>
            <small>{brandCaption}</small>
          </span>
        </Link>
        <nav className="site-nav" aria-label="Основная навигация">
          {navItems.map((item) => (
            <Link
              key={item.label}
              to={getNavTarget(item)}
              onFocus={() => preloadRoute(item)}
              onPointerEnter={() => preloadRoute(item)}
              onPointerDown={() => preloadRoute(item)}
            >
              {item.label}
            </Link>
          ))}
        </nav>
        <div className="site-header__actions">
          <a className="button button--small button--primary" href={phoneHref}>
            <PhoneCall size={17} />
            Позвонить
          </a>
          <button
            ref={menuButtonRef}
            className="site-menu-toggle"
            type="button"
            aria-expanded={isMenuOpen}
            aria-controls="mobile-menu"
            aria-label={isMenuOpen ? "Закрыть меню" : "Открыть меню"}
            onClick={() => setIsMenuOpen((current) => !current)}
          >
            {isMenuOpen ? <X size={22} /> : <Menu size={22} />}
          </button>
        </div>
      </div>

      <div className={`mobile-menu ${isMenuOpen ? "mobile-menu--open" : ""}`} id="mobile-menu" ref={panelRef}>
        <nav aria-label="Мобильная навигация">
          {navItems.map((item) => (
            <Link
              key={item.label}
              to={getNavTarget(item)}
              onFocus={() => preloadRoute(item)}
              onPointerEnter={() => preloadRoute(item)}
              onPointerDown={() => preloadRoute(item)}
            >
              {item.label}
            </Link>
          ))}
          <Link to={location.pathname === "/" ? "#photo-estimate" : "/#photo-estimate"}>Оценка по фото</Link>
          <Link to={location.pathname === "/" ? "#partners" : "/#partners"}>Партнёрам</Link>
          <a href={avitoUrl} target="_blank" rel="noopener noreferrer">
            Авито
          </a>
        </nav>
        <a className="button button--primary" href={phoneHref}>
          <PhoneCall size={17} />
          Позвонить нам
        </a>
      </div>
    </header>
  );
}

export default Header;
