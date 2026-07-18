import { useEffect, useState } from "react";
import { portfolioItems, type PortfolioItem } from "./data/portfolio";
import Header from "./components/Header/Header";
import Hero from "./components/Hero/Hero";
import Benefits from "./components/Benefits/Benefits";
import Services from "./components/Services/Services";
import Portfolio from "./components/Portfolio/Portfolio";
import PhotoEstimate from "./components/PhotoEstimate/PhotoEstimate";
import Prices from "./components/Prices/Prices";
import Process from "./components/Process/Process";
import ObjectTypes from "./components/ObjectTypes/ObjectTypes";
import Areas from "./components/Areas/Areas";
import Guarantee from "./components/Guarantee/Guarantee";
import FAQ from "./components/FAQ/FAQ";
import Contact from "./components/Contact/Contact";
import Footer from "./components/Footer/Footer";
import Modal from "./components/Modal/Modal";
import { avitoUrl, phoneHref } from "./data/site";
import Partners from "./components/Partners/Partners";
import ChatWidget from "./components/ChatWidget/ChatWidget";

function App() {
  const [activeWork, setActiveWork] = useState<PortfolioItem | null>(null);

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
      ".estimate-calculator",
      ".estimate-service-card",
      ".new-point-wizard",
      ".estimate-summary",
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
  }, []);

  useEffect(() => {
    if (!window.location.hash) {
      return;
    }

    const hash = window.location.hash.slice(1);
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
  }, []);

  return (
    <>
      <Header />
      <main>
        <Hero />
        <Benefits />
        <Services />
        <ObjectTypes />
        <Portfolio items={portfolioItems} onOpen={setActiveWork} />
        <PhotoEstimate />
        <Prices />
        <Process />
        <Partners />
        <Areas />
        <Guarantee />
        <FAQ />
        <Contact />
      </main>
      <Footer />
      <Modal item={activeWork} onClose={() => setActiveWork(null)} />
      <ChatWidget />
      <div className="mobile-cta" aria-label="Быстрые контакты">
        <a href={phoneHref} className="mobile-cta__button mobile-cta__button--primary">
          Позвонить нам
        </a>
        <a href="#photo-estimate" className="mobile-cta__button">
          Фото
        </a>
        <a
          href={avitoUrl}
          className="mobile-cta__button"
          target="_blank"
          rel="noopener noreferrer"
        >
          Авито
        </a>
      </div>
    </>
  );
}

export default App;
