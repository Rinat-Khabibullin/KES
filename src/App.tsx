import { useEffect, useState } from "react";
import { Route, Routes, useLocation } from "react-router-dom";
import type { PortfolioItem } from "./data/portfolio";
import Header from "./components/Header/Header";
import Footer from "./components/Footer/Footer";
import Modal from "./components/Modal/Modal";
import ChatWidget from "./components/ChatWidget/ChatWidget";
import LandingPage from "./pages/LandingPage/LandingPage";
import CalculatorPage from "./pages/CalculatorPage/CalculatorPage";
import NotFoundPage from "./pages/NotFoundPage/NotFoundPage";
import MobileActions from "./components/MobileActions/MobileActions";

const pageMeta = {
  "/": {
    title: "Электрика Туапсе — электрик, электромонтаж, щиты | Команда электриков",
    description:
      "Электрик и электромонтаж в Туапсе и районе: щиты, проводка, розетки, освещение, тёплый пол, аварийный ремонт. Бесплатная консультация, договор, гарантия, опыт 10+ лет.",
    canonical: "https://www.electrik-tuapse.ru/",
  },
  "/calculator": {
    title: "Калькулятор электромонтажных работ в Туапсе | Электрика Туапсе",
    description:
      "Онлайн-калькулятор электромонтажных работ в Туапсе: розетки, свет, кабель, штробление, щиты, тёплый пол. Предварительная смета по прайсу, материалы отдельно.",
    canonical: "https://www.electrik-tuapse.ru/calculator",
  },
};

function usePageEffects() {
  const location = useLocation();

  useEffect(() => {
    const meta = pageMeta[location.pathname as keyof typeof pageMeta] ?? {
      title: "Страница не найдена | Электрика Туапсе",
      description: "Страница не найдена. Вернитесь на главную или откройте калькулятор электромонтажных работ.",
      canonical: "https://www.electrik-tuapse.ru/",
    };
    document.title = meta.title;

    const description = document.querySelector<HTMLMetaElement>('meta[name="description"]');
    if (description) {
      description.content = meta.description;
    }

    let canonical = document.querySelector<HTMLLinkElement>('link[rel="canonical"]');
    if (!canonical) {
      canonical = document.createElement("link");
      canonical.rel = "canonical";
      document.head.append(canonical);
    }
    canonical.href = meta.canonical;
  }, [location.pathname]);

  useEffect(() => {
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) {
      return;
    }

    const selectors = [
      ".section-heading",
      ".hero__content",
      ".hero-showcase",
      ".benefit-card",
      ".service-card",
      ".object-card",
      ".portfolio-card",
      ".photo-estimate__content",
      ".photo-estimate__panel",
      ".price-note",
      ".price-strip-card",
      ".price-cta-panel",
      ".calculator-page__hero",
      ".calculator-page__note",
      ".price-card",
      ".process-card",
      ".partner-card",
      ".partner-proof",
      ".area-list span",
      ".guarantee__panel",
      "details",
      ".contact-card",
    ].join(", ");
    const targets = Array.from(document.querySelectorAll<HTMLElement>(selectors));

    targets.forEach((target, index) => {
      target.classList.add("reveal");
      target.style.setProperty("--reveal-delay", `${Math.min((index % 8) * 55, 330)}ms`);
    });

    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            entry.target.classList.add("is-visible");
            observer.unobserve(entry.target);
          }
        });
      },
      { rootMargin: "0px 0px -12% 0px", threshold: 0.12 },
    );

    targets.forEach((target) => observer.observe(target));

    return () => observer.disconnect();
  }, [location.pathname]);

  useEffect(() => {
    if (!location.hash) {
      return;
    }

    const hash = location.hash.slice(1);
    const scrollToHash = () => {
      const target = document.getElementById(hash);
      const heading = target?.querySelector<HTMLElement>("h1, h2");
      const anchor = heading ?? target;

      if (!anchor) {
        return;
      }

      const headerHeight = document.querySelector<HTMLElement>(".site-header")?.offsetHeight ?? 0;
      const top = anchor.getBoundingClientRect().top + window.scrollY - headerHeight - 22;
      window.scrollTo({ top: Math.max(0, top), behavior: "auto" });
    };

    const timeoutIds = [80, 360, 900].map((delay) => window.setTimeout(scrollToHash, delay));

    return () => timeoutIds.forEach((timeoutId) => window.clearTimeout(timeoutId));
  }, [location.hash, location.pathname]);
}

function App() {
  const [activeWork, setActiveWork] = useState<PortfolioItem | null>(null);
  usePageEffects();

  return (
    <>
      <Header />
      <Routes>
        <Route path="/" element={<LandingPage onOpenWork={setActiveWork} />} />
        <Route path="/calculator" element={<CalculatorPage />} />
        <Route path="*" element={<NotFoundPage />} />
      </Routes>
      <Footer />
      <Modal item={activeWork} onClose={() => setActiveWork(null)} />
      <ChatWidget />
      <MobileActions />
    </>
  );
}

export default App;
