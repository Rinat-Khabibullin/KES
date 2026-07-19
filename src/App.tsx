import { Suspense, useEffect, useState } from "react";
import { Route, Routes, useLocation } from "react-router-dom";
import type { PortfolioItem } from "./data/portfolio";
import Header from "./components/Header/Header";
import Footer from "./components/Footer/Footer";
import LandingPage from "./pages/LandingPage/LandingPage";
import MobileActions from "./components/MobileActions/MobileActions";
import ScrollToHash from "./components/ScrollToHash/ScrollToHash";
import ChatMount from "./components/ChatMount/ChatMount";
import { CalculatorPage, NotFoundPage, PortfolioModal } from "./routes/lazyRoutes";

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

const scheduleAfterIdle = (callback: () => void) => {
  const browserWindow = window as Window &
    typeof globalThis & {
      requestIdleCallback?: (callback: IdleRequestCallback, options?: IdleRequestOptions) => number;
      cancelIdleCallback?: (handle: number) => void;
    };

  if (browserWindow.requestIdleCallback && browserWindow.cancelIdleCallback) {
    const idleId = browserWindow.requestIdleCallback(callback, { timeout: 1_200 });
    return () => browserWindow.cancelIdleCallback?.(idleId);
  }

  const timeoutId = window.setTimeout(callback, 160);
  return () => window.clearTimeout(timeoutId);
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

    let observer: IntersectionObserver | null = null;

    const cancelIdle = scheduleAfterIdle(() => {
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

      observer = new IntersectionObserver(
        (entries) => {
          entries.forEach((entry) => {
            if (entry.isIntersecting) {
              entry.target.classList.add("is-visible");
              observer?.unobserve(entry.target);
            }
          });
        },
        { rootMargin: "0px 0px -12% 0px", threshold: 0.12 },
      );

      targets.forEach((target) => observer?.observe(target));
    });

    return () => {
      cancelIdle();
      observer?.disconnect();
    };
  }, [location.pathname]);
}

function App() {
  const [activeWork, setActiveWork] = useState<PortfolioItem | null>(null);
  usePageEffects();

  return (
    <>
      <a className="skip-link" href="#main-content">
        Перейти к основному содержимому
      </a>
      <Header />
      <ScrollToHash />
      <Suspense fallback={<div className="route-skeleton" aria-busy="true" aria-label="Загрузка страницы" />}>
        <Routes>
          <Route path="/" element={<LandingPage onOpenWork={setActiveWork} />} />
          <Route path="/calculator" element={<CalculatorPage />} />
          <Route path="*" element={<NotFoundPage />} />
        </Routes>
      </Suspense>
      <Footer />
      {activeWork ? (
        <Suspense fallback={null}>
          <PortfolioModal item={activeWork} onClose={() => setActiveWork(null)} />
        </Suspense>
      ) : null}
      <ChatMount />
      <MobileActions />
    </>
  );
}

export default App;
