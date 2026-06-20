import { useEffect, useState } from "react";
import { portfolioItems, type PortfolioItem } from "./data/portfolio";
import Header from "./components/Header/Header";
import Hero from "./components/Hero/Hero";
import Benefits from "./components/Benefits/Benefits";
import Services from "./components/Services/Services";
import Portfolio from "./components/Portfolio/Portfolio";
import Prices from "./components/Prices/Prices";
import Process from "./components/Process/Process";
import Areas from "./components/Areas/Areas";
import Guarantee from "./components/Guarantee/Guarantee";
import FAQ from "./components/FAQ/FAQ";
import Contact from "./components/Contact/Contact";
import Footer from "./components/Footer/Footer";
import Modal from "./components/Modal/Modal";
import { avitoUrl, phoneHref } from "./data/site";
import Partners from "./components/Partners/Partners";

function App() {
  const [activeWork, setActiveWork] = useState<PortfolioItem | null>(null);

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
        <Portfolio items={portfolioItems} onOpen={setActiveWork} />
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
      <div className="mobile-cta" aria-label="Быстрые контакты">
        <a href={phoneHref} className="mobile-cta__button mobile-cta__button--primary">
          Позвонить нам
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
